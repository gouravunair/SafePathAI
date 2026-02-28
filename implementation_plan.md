# Implementation Plan: Disaster Evacuation & Safety Routing System

This document outlines the architecture and execution strategy for building a disaster evacuation website that calculates the "safest" route based on real-time hazard data and elevation context.

## 1. Project Architecture
The system follows a modern decoupled architecture:
- **Frontend**: React (Vite) - High-performance SPA for map interaction and dashboard.
- **Computational Backend**: Python (FastAPI) - Specialized for Geo-spatial processing and OSMnx network analysis.
- **Database & Services**: Supabase - PostgreSQL with PostGIS for spatial queries, Auth for reporting, and Realtime for instant map updates.

## 2. Technical Stack
- **UI/UX**: React, Tailwind CSS (for layout), Framer Motion (for animations), Lucide React (icons).
- **Geospatial UI**: Mapbox GL JS or Leaflet.
- **Geo-Computation**: 
  - `OSMnx`: For fetching and cleaning road network data.
  - `NetworkX`: For graph theory and routing algorithms (Dijkstra/A*).
  - `GeoPandas`: For handling spatial data structures.
- **Database**: Supabase (PostgreSQL + PostGIS).

## 3. Database Design (PostGIS)
We will leverage PostGIS for efficient spatial indexing and proximity calculations.
- `hazards`:
  - `id`: uuid
  - `type`: text (e.g., "flood", "fire", "roadblock")
  - `severity`: integer (1-10)
  - `geom`: GEOMETRY(Point, 4326)
  - `radius`: float (impact area)
- `shelters`:
  - `id`: uuid
  - `name`: text
  - `geom`: GEOMETRY(Point, 4326)
  - `capacity`: integer
- `elevation_cache`:
  - `point`: GEOMETRY(Point, 4326)
  - `elevation`: float

## 4. Routing Logic: The "Safety First" Algorithm
Standard routing uses `length` or `travel_time`. Our algorithm will use a `safety_cost`:

$$Cost = Length \times (1 + Penalty_{hazard} + Penalty_{elevation})$$

1. **Hazard Penalty**: If a road segment passes through or near a hazard radius, apply a high multiplier or mark as impassable.
2. **Elevation Penalty**: For flood risks, edges at lower elevations relative to surroundings receive higher penalties.
3. **Dynamic Re-routing**: As new hazards are added to Supabase, the backend invalidates cached graphs and re-calculates.

## 5. Development Roadmap

### Phase 1: Infrastructure & Base Setup
- [ ] Initialize Supabase project and enable `postgis`.
- [ ] Create `frontend/` (Vite + React) and `backend/` (FastAPI).
- [ ] Setup basic Supabase client in frontend.

### Phase 2: Computational Backend
- [ ] Implement OSMnx graph fetching for target cities/regions.
- [ ] Integrate elevation data (Open-Elevation API or SRTM).
- [ ] Code the weighted Dijkstra algorithm in Python.
- [ ] Expose FastAPI endpoints for `/get-route` and `/nearest-shelters`.

### Phase 3: Map Interface & Interaction
- [ ] Integrate Mapbox GL JS in React.
- [ ] Implement "Report Hazard" functionality with click-on-map.
- [ ] Visualize hazard zones with semi-transparent circles.
- [ ] Display the "Safest Route" vs "Fastest Route" for comparison.

### Phase 4: Real-time Sync & Polish
- [ ] Enable Supabase Realtime to push hazard updates to all connected clients.
- [ ] Implement user authentication for verified hazard reporting.
- [ ] Final UI/UX polish (premium dark mode, glassmorphism).

## 6. Security & Scalability
- **RLS (Row Level Security)**: Ensure only authenticated users can report hazards, but everyone can view them.
- **Graph Caching**: Cache OSMnx graphs in-memory or on disk to prevent redundant API calls to OSM.
