# SafePath AI - Disaster Evacuation System (Wayanad Edition)

A full-stack AI-driven application for calculating the safest evacuation routes during disasters, specifically configured for **Wayanad, Kerala, India**. It integrates real-time hazard data, elevation risks, and automated weather monitoring.

## 📍 Project Focus: Wayanad, Kerala
The application has been fully pivoted to support the Wayanad region, including:
- **Default Map Center**: Wayanad coordinates (11.6854, 76.1320).
- **Road Network**: Pre-generated road networks for routing in Mananthavady and surrounding areas.
- **Shelter Data**: Integrated locations for regional evacuation shelters.

## ✨ Key Features
- **Intelligent Routing**: Dijkstra-based routing weighted by real-time rainfall, elevation, and reported hazards.
- **Vibrant Modern UI**: A high-fidelity "V3" design featuring glassmorphism, vertical navigation, and pulsing map indicators.
- **Automated Weather Sync**: Live syncing with OpenWeatherMap to dynamically adjust road safety weights based on rainfall intensity.
- **Real-time Hazards**: Instant synchronization with Supabase for user-reported landslides, floods, and roadblocks.

## 🚀 Setup & Scripts

### 1. Road Data Generation
Generate the regional road network with pgRouting IDs:
```bash
python upload_wayanad.py
```
This produces `wayanad_roads_with_id.csv`, ready for Supabase upload.

### 2. Weather & Hazard Sync
Update road hazard weights based on live rainfall:
```bash
python weather_update.py
```

### 3. Local Development
**Backend (FastAPI):**
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend (React/Vite):**
```bash
cd frontend
npm install
npm run dev
```

## 🔗 Repositories
- **Primary**: [SafePathAI](https://github.com/gouravunair/SafePathAI.git)
- **Secondary**: [SafePathAI2](https://github.com/gouravunair/SafePathAI2.git)

## 🛠 Tech Stack
- **Frontend**: React, Vite, Leaflet, Framer Motion, Lucide Icons.
- **Backend**: FastAPI, OSMnx, NetworkX.
- **Database**: Supabase (Postgres + PostGIS + pgRouting).
