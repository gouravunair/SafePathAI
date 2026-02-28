-- ============================================================
-- SafePath AI — Supabase Database Setup
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;   -- pgRouting for graph-based routing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- UUID generation

-- ============================================================
-- 2. REPORTED HAZARDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reported_hazards (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type            TEXT NOT NULL CHECK (type IN ('flood','fire','roadblock','structural','landslide','other')),
    severity        INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 10),
    description     TEXT,
    geom            GEOMETRY(Point, 4326) NOT NULL,  -- WGS84 lat/lng point
    radius_meters   FLOAT NOT NULL DEFAULT 200.0,   -- Danger impact radius
    is_active       BOOLEAN DEFAULT TRUE,
    reported_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    source          TEXT DEFAULT 'user',             -- 'user', 'openweather', 'kaggle'
    weather_data    JSONB,                           -- Raw weather API response
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast spatial queries (ST_DWithin, ST_Distance)
CREATE INDEX IF NOT EXISTS idx_hazards_geom ON reported_hazards USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_hazards_active ON reported_hazards (is_active);

-- ============================================================
-- 3. EVACUATION SHELTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shelters (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    address         TEXT,
    capacity        INTEGER DEFAULT 0,
    current_occupancy INTEGER DEFAULT 0,
    status          TEXT DEFAULT 'open' CHECK (status IN ('open','full','closed')),
    geom            GEOMETRY(Point, 4326) NOT NULL,
    amenities       TEXT[],                          -- e.g. ARRAY['medical','food','water']
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shelters_geom ON shelters USING GIST (geom);

-- ============================================================
-- 4. ELEVATION CACHE TABLE (speeds up routing by caching results)
-- ============================================================
CREATE TABLE IF NOT EXISTS elevation_cache (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    geom        GEOMETRY(Point, 4326) UNIQUE NOT NULL,
    elevation_m FLOAT NOT NULL,
    source      TEXT DEFAULT 'open-elevation',
    fetched_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elevation_geom ON elevation_cache USING GIST (geom);

-- ============================================================
-- 5. ROUTE SESSIONS TABLE (optional: log user navigation sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS route_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    start_geom      GEOMETRY(Point, 4326),
    end_geom        GEOMETRY(Point, 4326),
    selected_route  TEXT CHECK (selected_route IN ('safest','fastest')),
    route_geom      GEOMETRY(LineString, 4326),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. Row Level Security
-- ============================================================
ALTER TABLE reported_hazards ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE elevation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read hazards and shelters
CREATE POLICY "Public read hazards"
    ON reported_hazards FOR SELECT USING (true);

CREATE POLICY "Auth users can report hazards"
    ON reported_hazards FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Auth users can update their own hazards"
    ON reported_hazards FOR UPDATE
    USING (auth.uid() = reported_by);

CREATE POLICY "Public read shelters"
    ON shelters FOR SELECT USING (true);

CREATE POLICY "Public read elevation_cache"
    ON elevation_cache FOR SELECT USING (true);

CREATE POLICY "Service role only elevation writes"
    ON elevation_cache FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 7. HELPER FUNCTION: Find Nearest Shelters (PostGIS)
-- ============================================================
CREATE OR REPLACE FUNCTION get_nearest_shelters(
    lat FLOAT,
    lng FLOAT,
    limit_n INTEGER DEFAULT 5
)
RETURNS TABLE(
    id UUID, name TEXT, address TEXT, status TEXT,
    capacity INTEGER, current_occupancy INTEGER,
    amenities TEXT[],
    distance_m FLOAT,
    latitude FLOAT, longitude FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id, s.name, s.address, s.status,
        s.capacity, s.current_occupancy,
        s.amenities,
        ST_Distance(
            s.geom::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) AS distance_m,
        ST_Y(s.geom) AS latitude,
        ST_X(s.geom) AS longitude
    FROM shelters s
    WHERE s.status != 'closed'
    ORDER BY s.geom <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    LIMIT limit_n;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. SAMPLE SEED DATA (for development - Wayanad, Kerala)
-- ============================================================
INSERT INTO shelters (name, address, capacity, status, geom, amenities) VALUES
('Mananthavady Relief Camp', 'Main Road, Mananthavady', 450, 'open',
    ST_SetSRID(ST_MakePoint(76.0829, 11.7516), 4326),
    ARRAY['food','water','medical','wifi']),
('Kalpetta Central Shelter', 'Kalpetta Town Hall', 800, 'open',
    ST_SetSRID(ST_MakePoint(76.1320, 11.6050), 4326),
    ARRAY['food','water','medical']),
('Sulthan Bathery High School', 'Civil Station Road', 600, 'open',
    ST_SetSRID(ST_MakePoint(76.2620, 11.6620), 4326),
    ARRAY['food','water'])
ON CONFLICT DO NOTHING;

INSERT INTO reported_hazards (type, severity, description, geom, radius_meters, source) VALUES
('landslide', 9, 'Critical: Landslide block on Vythiri road', ST_SetSRID(ST_MakePoint(76.0400, 11.5500), 4326), 500, 'user'),
('flood', 7, 'River overflow near Panamaram bridge', ST_SetSRID(ST_MakePoint(76.1000, 11.7200), 4326), 300, 'openweather')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. POINTS OF INTEREST TABLE (Shops, Schools, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS points_of_interest (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT,                           -- 'school', 'shop', etc.
    lat             FLOAT8 NOT NULL,
    lng             FLOAT8 NOT NULL,
    geom            GEOMETRY(Point, 4326),
    district        TEXT DEFAULT 'Wayanad',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pois_geom ON points_of_interest USING GIST (geom);

-- Trigger to update geom from lat/lng
CREATE OR REPLACE FUNCTION update_poi_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER poi_geom_trigger
BEFORE INSERT OR UPDATE ON points_of_interest
FOR EACH ROW EXECUTE FUNCTION update_poi_geom();

ALTER TABLE points_of_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read POIs" ON points_of_interest FOR SELECT USING (true);
