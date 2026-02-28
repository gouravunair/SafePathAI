-- This creates the RPC named 'get_safe_route'
CREATE OR REPLACE FUNCTION get_safe_route(start_node_id INTEGER, end_node_id INTEGER)
RETURNS TABLE (geom geometry, cost float8) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    roads.geom, 
    di.cost
  FROM pgr_dijkstra(
    -- This is your "Search" query. It tells pgRouting which roads to look at.
    'SELECT id, source, target, (distance * safety_weight) AS cost FROM roads',
    start_node_id, 
    end_node_id, 
    directed := false
  ) AS di
  JOIN roads ON di.edge = roads.id;
END;
$$;
ALTER TABLE roads 
  ALTER COLUMN source TYPE bigint,
  ALTER COLUMN target TYPE bigint;
