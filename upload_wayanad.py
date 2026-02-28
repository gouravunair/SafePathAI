import osmnx as ox
import pandas as pd

place_name = "Wayanad, Kerala, India"

print(f"Step 1: Downloading COMPLETE map of {place_name}...")
# Fetching the entire district's road network
try:
    graph = ox.graph_from_place(place_name, network_type='drive')

    print("Step 2: Preparing Road Network for Supabase...")
    nodes, edges = ox.graph_to_gdfs(graph)
    edges = edges.reset_index()

    # Assign incremental IDs for pgRouting compatibility
    edges['id'] = range(1, len(edges) + 1)
    edges['source'] = edges['u']
    edges['target'] = edges['v']

    # Save the district-wide roads CSV
    edges[['id', 'source', 'target', 'length']].to_csv("wayanad_roads_district.csv", index=False)
    print("SUCCESS! 'wayanad_roads_district.csv' created.")
except Exception as e:
    print(f"Road Network Download failed: {e}")

print("Step 3: Downloading Points of Interest (Shops & Schools)...")
# Tags for schools and shops for better disaster situational awareness
tags = {"amenity": "school", "shop": True}
try:
    pois = ox.features_from_place(place_name, tags)

    print("Step 4: Cleaning POI data...")
    # Extract only relevant columns: name, category, and location
    # Use centroid for polygons (like schools) to get a single point
    # We combine 'amenity' and 'shop' into a single 'type' column
    if 'amenity' in pois.columns and 'shop' in pois.columns:
        pois['type'] = pois['amenity'].fillna(pois['shop'])
    elif 'amenity' in pois.columns:
        pois['type'] = pois['amenity']
    elif 'shop' in pois.columns:
        pois['type'] = pois['shop']
    else:
        pois['type'] = "POI"

    pois['lat'] = pois.geometry.centroid.y
    pois['lng'] = pois.geometry.centroid.x
    
    # Filter for entries with names and save to CSV
    pois_clean = pois[pois['name'].notnull()]
    pois_clean[['name', 'type', 'lat', 'lng']].to_csv("wayanad_pois.csv", index=False)
    print("SUCCESS! 'wayanad_pois.csv' created.")
except Exception as e:
    print(f"POI Extraction failed: {e}")