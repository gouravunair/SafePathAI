# 🗺️ SafePath AI - Kerala Relief (Wayanad Edition)

**SafePath AI** is a tool built to find the safest evacuation routes during disasters in **Wayanad, Kerala, India**. It calculates the safest path by looking at live rain data, flood zones, and landslide risks.

---

## 🚀 How to Run (Easy Step-by-Step)

If you have never used GitHub before, follow these steps to see the website on your computer:

### 1. Download the Project
1. Scroll to the top of this page.
2. Click the green **"<> Code"** button.
3. Click **"Download ZIP"**.
4. Extract (Unzip) the folder on your computer (e.g., to your Desktop).

### 2. Set Up Your Keys
1. Open the extracted folder.
2. Go into the `frontend` folder.
3. Find the file named `.env.example`.
4. **Rename** it to exactly `.env`.
5. Open it with Notepad and paste your **Supabase URL** and **Anon Key** where requested.

### 3. Start the Website (Frontend)
1. Open your Windows **PowerShell** or Command Prompt.
2. Go to the `frontend` folder:
   ```powershell
   cd frontend
   ```
3. Install the tools (only once):
   ```powershell
   npm install
   ```
4. Start the website:
   ```powershell
   npm run dev
   ```
5. **Open your browser** and go to: `http://localhost:5173`

---

## 🧪 For Developers & Advanced Users

### Regional Settings
- **Location**: Wayanad (11.6854, 76.1320)
- **UI Design**: Modern "V3" glassmorphism with pulsing hazard indicators.

### Running Helper Scripts
These scripts help synchronize live data:
1. **Prepare Road Data**: `python upload_wayanad.py` (Generates `wayanad_roads_with_id.csv`).
2. **Update Live Weather**: `python weather_update.py` (Syncs rain data to the map).

### Technical Stack
- **Frontend**: React (Vite), Leaflet (Maps), Framer Motion (Animations).
- **Backend**: FastAPI, OSMnx (Road Networks), NetworkX.
- **Database**: Supabase (PostGIS for spatial data).

---

## 🔗 Repository Links
- **Primary**: [SafePathAI](https://github.com/gouravunair/SafePathAI.git) 📍
- **Secondary**: [SafePathAI2](https://github.com/gouravunair/SafePathAI2.git) 📍
