-- ============================================================
--  SAFEROUTE AI — PHASE 3, STEP 1: pgRouting + Dijkstra RPC
--  Run this entire file in your Supabase SQL Editor
--  Requires: PostGIS + pgRouting extensions (enabled in Phase 1)
-- ============================================================

-- STEP 0: Make sure extensions are active
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;


-- ============================================================
-- STEP 1: Add topology columns to the roads table
--         pgRouting needs integer source/target node IDs
--         on every edge row.
-- ============================================================

-- Add routing columns (id column without PRIMARY KEY since one already exists)
ALTER TABLE public.roads
    ADD COLUMN IF NOT EXISTS source    INTEGER,
    ADD COLUMN IF NOT EXISTS target    INTEGER,
    ADD COLUMN IF NOT EXISTS length_m  FLOAT,   -- true geodesic length (metres)
    ADD COLUMN IF NOT EXISTS cost      FLOAT,   -- weighted cost for routing
    ADD COLUMN IF NOT EXISTS rcost     FLOAT;   -- reverse cost (bidirectional)

-- Ensure there is an integer primary key column named 'id' for pgr_createTopology.
-- If your existing PK is named differently (e.g. gid), rename it:
--   ALTER TABLE public.roads RENAME COLUMN gid TO id;
-- Or if no integer PK exists at all, add one:
--   ALTER TABLE public.roads ADD COLUMN id BIGSERIAL PRIMARY KEY;
-- Check your current PK with:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name='roads' AND column_default LIKE 'nextval%';


-- ============================================================
-- STEP 2: Compute true geodesic length for every road segment
--         ST_Length on geography gives metres.
-- ============================================================

UPDATE public.roads
SET length_m = ST_Length(geom::geography);


-- ============================================================
-- STEP 3: Build the routable topology
--
--  pgr_createTopology snaps nearby endpoints into shared
--  integer node IDs (source / target) so Dijkstra can traverse
--  the graph. Tolerance = 0.0001 degrees (~11 m).
-- ============================================================

-- pgr_createTopology needs a geom column named 'the_geom' or
-- we pass the column name explicitly.  It also needs the table
-- to have a primary-key integer column ('id').

SELECT pgr_createTopology(
    'public.roads',   -- table
    0.0001,           -- tolerance in degrees
    'geom',           -- geometry column
    'id'              -- primary key column
);
-- After this runs, roads.source and roads.target are populated
-- and a table public.roads_vertices_pgr is created automatically.


-- ============================================================
-- STEP 4: Compute the WEIGHTED COST
--
--  Formula (Rescue-Route mode):
--    cost = length_m × (1 + hazard_weight)
--
--  hazard_weight comes directly from our Phase-2 logic:
--    • Flood penalty  → elevation < 10 m  (base ×5)
--    • Slope penalty  → slope > 5°        (base ×1.5)
--    • Column 'hazard_weight' already stores the combined value
--      (set during Phase 2; default 3 = low, 5 = high risk)
--
--  We normalise hazard_weight so 3 → factor 1.0 (neutral)
--  and 5 → factor 2.0 (double the effective distance).
-- ============================================================

UPDATE public.roads
SET
    cost  = length_m * (1 + (hazard_weight - 3.0) / 2.0),
    rcost = length_m * (1 + (hazard_weight - 3.0) / 2.0);   -- bidirectional road


-- ============================================================
-- STEP 5: Index for fast routing queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_roads_source  ON public.roads (source);
CREATE INDEX IF NOT EXISTS idx_roads_target  ON public.roads (target);
CREATE INDEX IF NOT EXISTS idx_roads_geom    ON public.roads USING GIST (geom);


-- ============================================================
-- STEP 6: Helper view — vertex lookup by lat/lon
--         The frontend sends coordinates; we need to snap them
--         to the nearest graph node (vertex).
-- ============================================================

CREATE OR REPLACE VIEW public.road_vertices AS
SELECT
    v.id,
    v.the_geom                              AS geom,
    ST_Y(v.the_geom)                        AS latitude,
    ST_X(v.the_geom)                        AS longitude
FROM public.roads_vertices_pgr v;


-- ============================================================
-- STEP 7: THE MAIN RPC — get_safest_path
--
--  Parameters
--    start_lat / start_lon  : origin  coordinate (WGS-84)
--    end_lat   / end_lon    : destination coordinate
--
--  Returns a GeoJSON FeatureCollection containing:
--    • Each road segment on the safest path
--    • Properties: name, hazard_weight, slope, altitude, cost
--
--  How the frontend calls it:
--    const { data } = await supabase.rpc('get_safest_path', {
--        start_lat: 11.2847, start_lon: 75.7725,
--        end_lat:   11.2901, end_lon:   75.7731
--    })
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_safest_path(
    start_lat  FLOAT,
    start_lon  FLOAT,
    end_lat    FLOAT,
    end_lon    FLOAT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_id  INTEGER;
    v_end_id    INTEGER;
    v_result    JSON;
    v_start_pt  GEOMETRY;
    v_end_pt    GEOMETRY;
BEGIN
    -- Build point geometries from input coordinates
    v_start_pt := ST_SetSRID(ST_MakePoint(start_lon, start_lat), 4326);
    v_end_pt   := ST_SetSRID(ST_MakePoint(end_lon,   end_lat),   4326);

    -- Snap to nearest graph vertex (within 5 km; raises if nothing found)
    SELECT id INTO v_start_id
    FROM public.roads_vertices_pgr
    ORDER BY the_geom <-> v_start_pt
    LIMIT 1;

    SELECT id INTO v_end_id
    FROM public.roads_vertices_pgr
    ORDER BY the_geom <-> v_end_pt
    LIMIT 1;

    IF v_start_id IS NULL OR v_end_id IS NULL THEN
        RETURN json_build_object(
            'error', 'Could not snap coordinates to road network'
        );
    END IF;

    IF v_start_id = v_end_id THEN
        RETURN json_build_object(
            'error', 'Origin and destination are the same node'
        );
    END IF;

    -- ── Run pgr_dijkstra (bidirectional weighted) ──────────────
    -- pgr_dijkstra signature:
    --   pgr_dijkstra(edges_sql, start_vid, end_vid, directed)
    --
    -- edges_sql must return: id, source, target, cost, [reverse_cost]

    SELECT json_build_object(
        'type',     'FeatureCollection',
        'start_node', v_start_id,
        'end_node',   v_end_id,
        'features', COALESCE(json_agg(feat), '[]'::json)
    )
    INTO v_result
    FROM (
        SELECT json_build_object(
            'type',       'Feature',
            'geometry',   ST_AsGeoJSON(r.geom)::json,
            'properties', json_build_object(
                'seq',           route.seq,
                'edge_id',       r.id,
                'road_name',     COALESCE(NULLIF(r.name,''), 'Unnamed Road'),
                'hazard_weight', r.hazard_weight,
                'slope',         r.slope,
                'altitude_m',    r.altitude,
                'length_m',      ROUND(r.length_m::numeric, 1),
                'cost',          ROUND(route.cost::numeric,  2),
                'agg_cost',      ROUND(route.agg_cost::numeric, 2)
            )
        ) AS feat
        FROM pgr_dijkstra(
            -- Edge SQL: must expose id, source, target, cost, reverse_cost
            'SELECT id, source, target, cost, rcost AS reverse_cost
             FROM public.roads
             WHERE cost IS NOT NULL',
            v_start_id,
            v_end_id,
            directed := false          -- roads are bidirectional
        ) AS route
        JOIN public.roads r ON r.id = route.edge
        WHERE route.edge <> -1         -- exclude the virtual last row
        ORDER BY route.seq
    ) sub;

    RETURN v_result;
END;
$$;


-- ============================================================
-- STEP 8: BONUS RPC — nearest_node
--         Utility the frontend uses to convert a map click
--         (lat/lon) into a graph vertex id + snapped coords.
-- ============================================================

CREATE OR REPLACE FUNCTION public.nearest_node(
    lat FLOAT,
    lon FLOAT
)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT json_build_object(
        'node_id',   v.id,
        'latitude',  ST_Y(v.the_geom),
        'longitude', ST_X(v.the_geom),
        'distance_m', ROUND(ST_Distance(
                            v.the_geom::geography,
                            ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
                       )::numeric, 1)
    )
    FROM public.roads_vertices_pgr v
    ORDER BY v.the_geom <-> ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    LIMIT 1;
$$;


-- ============================================================
-- STEP 9: VERIFICATION QUERIES
--         Run these individually to confirm everything works.
-- ============================================================

-- 9a. Check topology was built (should return rows with source/target)
-- SELECT id, name, source, target, length_m, cost
-- FROM public.roads
-- WHERE source IS NOT NULL
-- LIMIT 10;

-- 9b. Count vertices in the graph
-- SELECT COUNT(*) AS vertex_count FROM public.roads_vertices_pgr;

-- 9c. Test nearest_node snap
-- SELECT * FROM public.nearest_node(11.2847, 75.7725);

-- 9d. Test the full routing RPC end-to-end
--     (uses two real coordinates from your dataset)
-- SELECT public.get_safest_path(
--     11.2847467, 75.7725663,   -- East Hill Road
--     11.2901608, 75.7731884    -- Mini Bypass Road
-- );


-- ============================================================
-- GRANT PERMISSIONS (needed for Supabase anon / service role)
-- ============================================================

GRANT EXECUTE ON FUNCTION public.get_safest_path(FLOAT, FLOAT, FLOAT, FLOAT)
    TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.nearest_node(FLOAT, FLOAT)
    TO anon, authenticated, service_role;

GRANT SELECT ON public.road_vertices TO anon, authenticated, service_role;


-- ============================================================
-- DONE ✅
-- Phase 3 Step 1 complete.
-- Next: Phase 4 — connect get_safest_path to your React frontend
--       via supabase.rpc() and render the returned GeoJSON on Mapbox.
-- ============================================================
