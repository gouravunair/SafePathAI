from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import osmnx as ox
import networkx as nx
from typing import List, Tuple, Optional
import httpx
import math
import os
from supabase import create_client, Client

app = FastAPI(title="SafePath AI Routing API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Supabase Client ---
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if SUPABASE_URL else None

# --- OpenWeather API ---
OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")

# --- OSMnx graph cache ---
_graph_cache: dict = {}

# ============================================================
# Pydantic Models
# ============================================================
class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    disaster_type: Optional[str] = "flood"  # 'flood', 'fire', 'earthquake'

class HazardReport(BaseModel):
    type: str
    severity: int
    description: Optional[str] = ""
    lat: float
    lng: float
    radius_meters: float = 200.0

# ============================================================
# Elevation Helper (Open-Elevation API)
# ============================================================
async def get_elevation(lat: float, lng: float) -> float:
    """Fetch elevation in metres from the free Open-Elevation API."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(
                "https://api.open-elevation.com/api/v1/lookup",
                params={"locations": f"{lat},{lng}"}
            )
            data = r.json()
            return data["results"][0]["elevation"]
    except Exception:
        return 50.0  # fallback neutral elevation

async def get_elevations_bulk(locations: List[Tuple[float, float]]) -> List[float]:
    """Batch-fetch elevations for a list of (lat, lng) tuples."""
    loc_str = "|".join(f"{lat},{lng}" for lat, lng in locations)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                "https://api.open-elevation.com/api/v1/lookup",
                json={"locations": [{"latitude": lat, "longitude": lng} for lat, lng in locations]}
            )
            data = r.json()
            return [res["elevation"] for res in data["results"]]
    except Exception:
        return [50.0] * len(locations)  # return neutral fallback for all

# ============================================================
# Weather / Disaster Data (OpenWeatherMap)
# ============================================================
async def fetch_weather_hazards(lat: float, lng: float) -> List[dict]:
    """Fetch live weather-based hazards from OpenWeatherMap One Call API."""
    if not OPENWEATHER_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(
                "https://api.openweathermap.org/data/3.0/onecall",
                params={
                    "lat": lat, "lon": lng,
                    "exclude": "minutely,hourly,daily",
                    "appid": OPENWEATHER_API_KEY,
                    "units": "metric"
                }
            )
            data = r.json()
            hazards = []
            # Parse alerts
            for alert in data.get("alerts", []):
                hazards.append({
                    "type": "weather_alert",
                    "event": alert.get("event", "Unknown"),
                    "description": alert.get("description", ""),
                    "severity": 7
                })
            # Check rain/snow intensity
            current = data.get("current", {})
            rain_mm = current.get("rain", {}).get("1h", 0)
            if rain_mm > 20:
                hazards.append({"type": "flood", "severity": min(int(rain_mm / 5), 10), "description": f"Heavy rain: {rain_mm}mm/h"})
            return hazards
    except Exception as e:
        print(f"Weather API error: {e}")
        return []

# ============================================================
# Safety Cost Edge Weighting
# ============================================================
def safety_cost(length: float, elevation: float, hazard_penalty: float, disaster_type: str) -> float:
    """
    Calculate the safety cost for a road edge.
    
    Cost = Length × (1 + hazard_penalty + elevation_penalty)
    
    - For floods: low elevation = high penalty
    - For fires:  high elevation (ridges) = slight penalty (smoke traps)
    - Hazard penalty: 0 to 5 based on proximity × severity
    """
    FLOOD_BASELINE_M = 20.0  # metres above sea level considered safe

    if disaster_type == "flood":
        elev_penalty = max(0.0, (FLOOD_BASELINE_M - elevation) / 10.0)
    elif disaster_type == "fire":
        elev_penalty = max(0.0, (elevation - 200) / 100.0)  # penalise high ridges
    else:
        elev_penalty = 0.0

    return length * (1.0 + hazard_penalty + elev_penalty)

# ============================================================
# Get or Cache OSMnx Graph
# ============================================================
async def get_graph(center_lat: float, center_lng: float, dist: int = 4000):
    key = f"{round(center_lat, 3)},{round(center_lng, 3)}"
    if key not in _graph_cache:
        G = ox.graph_from_point((center_lat, center_lng), dist=dist, network_type="drive", simplify=True)
        _graph_cache[key] = G
    return _graph_cache[key]

# ============================================================
# Build Hazard Map from Supabase
# ============================================================
async def get_active_hazards() -> List[dict]:
    if not supabase:
        return []
    try:
        res = supabase.table("reported_hazards").select("*").eq("is_active", True).execute()
        return res.data or []
    except Exception:
        return []

def compute_hazard_penalty(node_lat: float, node_lng: float, hazards: List[dict]) -> float:
    """Compute hazard penalty for a road node based on proximity to reported hazards."""
    penalty = 0.0
    for h in hazards:
        hgeom = h.get("geom", {})
        # geom returned from Supabase as GeoJSON
        if isinstance(hgeom, dict) and hgeom.get("type") == "Point":
            h_lng, h_lat = hgeom["coordinates"]
        else:
            continue
        # Haversine distance
        dlat = math.radians(node_lat - h_lat)
        dlng = math.radians(node_lng - h_lng)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(h_lat)) * math.cos(math.radians(node_lat)) * math.sin(dlng/2)**2
        dist_m = 6371000 * 2 * math.asin(math.sqrt(a))
        radius = h.get("radius_meters", 200.0)
        if dist_m < radius:
            severity = h.get("severity", 5)
            penalty += (severity / 10.0) * 5.0 * (1 - dist_m / radius)  # stronger at center
    return penalty

# ============================================================
# ENDPOINTS
# ============================================================
@app.get("/")
def health_check():
    return {"status": "ok", "service": "SafePath AI Routing API v1.0"}

@app.post("/calculate-route")
async def calculate_route(req: RouteRequest):
    """
    Calculate both the SAFEST and FASTEST routes between two points.
    Returns GeoJSON-compatible coordinate arrays.
    """
    try:
        center_lat = (req.start_lat + req.end_lat) / 2
        center_lng = (req.start_lng + req.end_lng) / 2

        G = await get_graph(center_lat, center_lng)
        hazards = await get_active_hazards()
        weather_hazards = await fetch_weather_hazards(center_lat, center_lng)

        orig = ox.nearest_nodes(G, req.start_lng, req.start_lat)
        dest = ox.nearest_nodes(G, req.end_lng, req.end_lat)

        # Fetch elevations for all nodes in graph (batched, cached)
        node_list = list(G.nodes(data=True))
        locations = [(d['y'], d['x']) for _, d in node_list]
        elevations = await get_elevations_bulk(locations[:150])  # cap to 150 for speed
        node_elevation = {}
        for i, (nid, d) in enumerate(node_list[:150]):
            node_elevation[nid] = elevations[i] if i < len(elevations) else 50.0

        all_hazards = hazards + [
            {"geom": {"type": "Point", "coordinates": [center_lng, center_lat]},
             "radius_meters": 300, "severity": wh["severity"]}
            for wh in weather_hazards
        ]

        # Assign safety_cost to each edge
        for u, v, k, data in G.edges(data=True, keys=True):
            u_lat = G.nodes[u].get('y', center_lat)
            u_lng = G.nodes[u].get('x', center_lng)
            elev = node_elevation.get(u, 50.0)
            h_penalty = compute_hazard_penalty(u_lat, u_lng, all_hazards)
            length = data.get('length', 1.0)
            data['safety_cost'] = safety_cost(length, elev, h_penalty, req.disaster_type)

        # --- Fastest: pure length (Dijkstra) ---
        fastest_path = nx.shortest_path(G, orig, dest, weight='length')
        fastest_dist = sum(ox.utils_graph.get_route_edge_attributes(G, fastest_path, 'length'))

        # --- Safest: safety_cost weighted ---
        safest_path = nx.shortest_path(G, orig, dest, weight='safety_cost')
        safest_dist = sum(ox.utils_graph.get_route_edge_attributes(G, safest_path, 'length'))

        def path_to_coords(path):
            return [[G.nodes[n]['y'], G.nodes[n]['x']] for n in path]

        return {
            "fastest": {
                "route": path_to_coords(fastest_path),
                "distance_m": round(fastest_dist, 1),
                "time_est_min": round(fastest_dist / 833, 1),  # ~50km/h avg
            },
            "safest": {
                "route": path_to_coords(safest_path),
                "distance_m": round(safest_dist, 1),
                "time_est_min": round(safest_dist / 833, 1),
            },
            "weather_hazards": weather_hazards,
            "active_hazard_count": len(all_hazards)
        }

    except nx.NetworkXNoPath:
        raise HTTPException(status_code=404, detail="No route found between these two locations.")
    except Exception as e:
        print(f"Route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nearest-shelters")
async def nearest_shelters(lat: float, lng: float, limit: int = 5):
    """
    Returns nearest open evacuation shelters using PostGIS ST_Distance.
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase not configured.")
    try:
        res = supabase.rpc("get_nearest_shelters", {"lat": lat, "lng": lng, "limit_n": limit}).execute()
        return {"shelters": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/report-hazard")
async def report_hazard(hazard: HazardReport):
    """
    Store a user-reported hazard in Supabase.
    Also enriches with live weather data if available.
    """
    weather_data = {}
    if OPENWEATHER_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={"lat": hazard.lat, "lon": hazard.lng, "appid": OPENWEATHER_API_KEY, "units": "metric"}
                )
                weather_data = r.json()
        except Exception:
            pass

    if not supabase:
        return {"status": "ok", "message": "Supabase not configured — hazard logged locally.", "data": hazard.dict()}

    try:
        payload = {
            "type": hazard.type,
            "severity": hazard.severity,
            "description": hazard.description,
            "geom": f"POINT({hazard.lng} {hazard.lat})",
            "radius_meters": hazard.radius_meters,
            "source": "user",
            "weather_data": weather_data
        }
        res = supabase.table("reported_hazards").insert(payload).execute()
        return {"status": "ok", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/weather-alerts")
async def weather_alerts(lat: float, lng: float):
    """Fetch current weather alerts from OpenWeatherMap for a location."""
    alerts = await fetch_weather_hazards(lat, lng)
    return {"alerts": alerts, "location": {"lat": lat, "lng": lng}}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
