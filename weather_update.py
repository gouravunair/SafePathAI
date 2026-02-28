import requests

# --- 1. CONFIGURATION ---
WEATHER_API_KEY = "6cb5ead96cdf3915142c47df1ea00edb"

# From Supabase Settings -> API
SUPABASE_URL = "https://xwhxodtwwgrtztmfukyj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3aHhvZHR3d2dydHp0bWZ1a3lqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIyMzk0MSwiZXhwIjoyMDg3Nzk5OTQxfQ.pmXKoqN0s5wtYTMJbJrlBSFiChhSHpCHg2opKzJD5A0" # Paste your service_role key here

# Wayanad Coordinates
LAT, LON = 11.55, 76.13

def get_weather_and_update():
    try:
        # A. Fetch Weather (Working fine in your logs)
        print("Fetching live weather...")
        w_url = f"https://api.openweathermap.org/data/2.5/weather?lat={LAT}&lon={LON}&appid={WEATHER_API_KEY}&units=metric"
        res = requests.get(w_url).json()
        rain = res.get('rain', {}).get('1h', 0)
        print(f"Current Rain: {rain}mm/h")

        # B. Update Supabase via REST API (Bypasses all Port/Tenant errors)
        # We target the 'roads' table. 
        # Note: This updates ALL roads in the table to test the connection.
        hazard_val = 1.0 + (rain * 2.0)
        
        api_url = f"{SUPABASE_URL}/rest/v1/roads"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        # This updates the hazard_weight for every row
        payload = {"hazard_weight": hazard_val}
        
        print(f"Updating hazard_weight to {hazard_val} via HTTPS...")
        response = requests.patch(api_url, json=payload, headers=headers)
        
        if response.status_code in [200, 201, 204]:
            print("✅ SUCCESS: Database updated via REST API!")
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
        
    except Exception as e:
        print(f"❌ Script Error: {e}")

if __name__ == "__main__":
    get_weather_and_update()