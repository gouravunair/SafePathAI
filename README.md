# SafePath AI - Disaster Evacuation System

A full-stack application for calculating the safest evacuation routes during disasters, considering real-time hazards and elevation risks.

## Features
- **Intelligent Routing**: Uses OSMnx and NetworkX to calculate routes weighted by hazard proximity and elevation.
- **Real-time Map**: Interactive Mapbox GL JS dashboard with semi-transparent hazard zones.
- **Reporting System**: Verified hazard reporting integrated with Supabase.
- **PostGIS Backend**: Efficient spatial queries for hazard impact analysis.

## Setup Instructions

### 1. Database (Supabase)
1. Create a new Supabase project.
2. Enable the **PostGIS** extension in the SQL Editor.
3. Copy the contents of `supabase_schema.sql` and run them in the SQL Editor.

### 2. Backend (Python)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py
```
The API will run on `http://localhost:8000`.

### 3. Frontend (React)
1. Copy `.env.example` to `.env` and fill in your credentials.
2. Install dependencies and start:
```bash
cd frontend
npm install
npm run dev
```

## How the "Safest Route" works
The backend uses a weighted Dijkstra algorithm. Instead of minimizing just distance, it minimizes:
`Cost = Distance * (1 + Hazard_Penalty + Elevation_Penalty)`

- **Hazard Penalty**: Roads near active fire/flood zones are heavily penalized or marked as impassable.
- **Elevation Penalty**: (To be fully implemented) Areas at low-lying points are preferred for fire but avoided for floods.
