import osmnx as ox
import pandas as pd

print("Step 1: Downloading Wayanad Map...")
place_name = "Wayanad, Kerala, India"
graph = ox.graph_from_place(place_name, network_type='drive')

print("Step 2: Preparing Data for Supabase...")
nodes, edges = ox.graph_to_gdfs(graph)

# Reset index to turn the 'ID' into a regular column
edges = edges.reset_index()

# Rename the column to 'id' so the 'Brain' can find it
edges['id'] = range(1, len(edges) + 1)

# Prepare columns for pgRouting
edges['source'] = edges['u']
edges['target'] = edges['v']

# Save the CSV with the 'id' column included
edges[['id', 'source', 'target', 'length']].to_csv("wayanad_roads_with_id.csv", index=False)
print("SUCCESS! 'wayanad_roads_with_id.csv' created. Upload this one.")