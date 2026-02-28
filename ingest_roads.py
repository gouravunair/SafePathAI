import osmnx as ox
from sqlalchemy import create_engine

# 1. Fetch Kochi road network (for rescue vehicles)
place = "Kochi, Kerala, India"
graph = ox.graph_from_place(place, network_type='drive')

# 2. Convert to GeoDataFrames
nodes, edges = ox.graph_to_gdfs(graph)

# 3. Format it for your Supabase 'roads' table
# We keep u (source), v (target), length, and geometry
edges = edges.reset_index()[['u', 'v', 'length', 'geometry']]
edges.columns = ['source', 'target', 'distance', 'geom']
edges = edges.set_geometry('geom')
# 4. Connect to Supabase
# Replace [PASSWORD] and [REF] with your actual Supabase DB credentials
db_url = "postgresql://postgres.viorlagwschvqmfqytvt:UI7fhocqJreeccvG@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
engine = create_engine(db_url)

# 5. Upload to the 'roads' table we created in the SQL Editor
edges.to_postgis('roads', engine, if_exists='append', index=False)
print("Phase 1: Kochi road network successfully uploaded!")