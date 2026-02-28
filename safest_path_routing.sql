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
    v_start_pt := ST_SetSRID(ST_MakePoint(start_lon, start_lat), 4326);
    v_end_pt   := ST_SetSRID(ST_MakePoint(end_lon,   end_lat),   4326);

    SELECT id INTO v_start_id
    FROM public.road_edges_vertices_pgr
    ORDER BY the_geom <-> v_start_pt
    LIMIT 1;

    SELECT id INTO v_end_id
    FROM public.road_edges_vertices_pgr
    ORDER BY the_geom <-> v_end_pt
    LIMIT 1;

    IF v_start_id IS NULL OR v_end_id IS NULL THEN
        RETURN json_build_object('error', 'Could not snap coordinates to road network');
    END IF;

    IF v_start_id = v_end_id THEN
        RETURN json_build_object('error', 'Origin and destination are the same node');
    END IF;

    SELECT json_build_object(
        'type',       'FeatureCollection',
        'start_node', v_start_id,
        'end_node',   v_end_id,
        'features',   COALESCE(json_agg(feat), '[]'::json)
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
            'SELECT id, source, target, cost, rcost AS reverse_cost
             FROM public.road_edges
             WHERE source IS NOT NULL
               AND target IS NOT NULL
               AND cost   IS NOT NULL',
            v_start_id,
            v_end_id,
            directed := false
        ) AS route
        JOIN public.road_edges r ON r.id = route.edge
        WHERE route.edge <> -1
        ORDER BY route.seq
    ) sub;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_safest_path(FLOAT, FLOAT, FLOAT, FLOAT)
    TO anon, authenticated, service_role;
