import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Shield, AlertTriangle, MapPin } from 'lucide-react'
import MapView from './components/MapView'
import RoutePicker from './components/RoutePicker'
import SafetyBreakdown from './components/SafetyBreakdown'
import HazardPanel from './components/HazardPanel'
import BottomNavBar from './components/BottomNavBar'
import ReportHazardModal from './components/ReportHazardModal'
import LandingPage from './LandingPage'
import { AnimeNavBar } from './components/ui/anime-navbar'
import { supabase } from './lib/supabase'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const DEMO_START = { lat: 11.6854, lng: 76.1320 } // Wayanad, Kerala
const DEMO_END = { lat: 11.7516, lng: 76.0829 } // Mananthavady/Shelter Area

// AnimeNavBar items — names match exactly what setActiveTab expects
const NAV_ITEMS = [
  { name: 'Home', icon: Home },
  { name: 'Evacuate', icon: Shield },
  { name: 'Hazards', icon: AlertTriangle },
  { name: 'Shelters', icon: MapPin },
]

// Map AnimeNavBar tab name → internal activeTab key
const NAV_TO_TAB = { Home: 'home', Evacuate: 'map', Hazards: 'alerts', Shelters: 'profile' }
const TAB_TO_NAV = { home: 'Home', map: 'Evacuate', alerts: 'Hazards', profile: 'Shelters' }

// Tab views for the bottom nav
// 'map' = main evacuation map, 'alerts' = hazard panel, 'plan' = route comparison, 'profile' = landing

export default function App() {
  const [activeTab, setActiveTab] = useState('home')   // 'home' | 'map' | 'alerts' | 'plan'
  const [destination, setDestination] = useState('')
  const [activeRoute, setActiveRoute] = useState('safest')
  const [routeData, setRouteData] = useState(null)
  const [hazards, setHazards] = useState([])
  const [shelters, setShelters] = useState([])
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState({ shelters: true, hazards: true, medical: false })

  // ── Helper: GeoJSON LineString → Leaflet [lat, lng] pairs ──
  const geoJsonToLatLng = (geojsonStr) => {
    try {
      const g = typeof geojsonStr === 'string' ? JSON.parse(geojsonStr) : geojsonStr
      const coords = g?.coordinates ?? g?.geometry?.coordinates ?? []
      return coords.map(([lng, lat]) => [lat, lng])
    } catch { return [] }
  }

  const fetchRoutes = useCallback(async (startCoords = DEMO_START, endCoords = DEMO_END) => {
    setLoading(true)
    try {
      // ── Primary: Supabase brain RPC ──
      if (supabase) {
        const { data, error } = await supabase.rpc('get_safe_evacuation_route', {
          start_lng: startCoords.lng,
          start_lat: startCoords.lat,
          end_lng: endCoords.lng,
          end_lat: endCoords.lat,
        })
        if (!error && data) {
          if (data.safest || data.fastest) {
            setRouteData({
              safest: { route: geoJsonToLatLng(data.safest), distance_m: data.safest_distance_m ?? 5200, time_est_min: data.safest_time_min ?? 18 },
              fastest: { route: geoJsonToLatLng(data.fastest), distance_m: data.fastest_distance_m ?? 4100, time_est_min: data.fastest_time_min ?? 12 },
            })
          } else {
            const route = geoJsonToLatLng(data)
            setRouteData({
              safest: { route, distance_m: 5200, time_est_min: 18 },
              fastest: { route, distance_m: 4100, time_est_min: 12 },
            })
          }
          setLoading(false); return
        }
        if (error) console.warn('Supabase RPC error, trying backend:', error.message)
      }

      // ── Fallback: Python backend ──
      const res = await axios.post(API + '/calculate-route', {
        start_lat: startCoords.lat, start_lng: startCoords.lng,
        end_lat: endCoords.lat, end_lng: endCoords.lng,
        disaster_type: 'flood'
      })
      setRouteData(res.data)
      if (res.data.weather_hazards?.length) setWeatherAlerts(res.data.weather_hazards)

    } catch (err) {
      console.warn('Route fetch failed, using demo data:', err)
      setRouteData({
        safest: { route: [[11.6854, 76.1320], [11.6950, 76.1250], [11.7100, 76.1150], [11.7300, 76.1000], [11.7516, 76.0829]], distance_m: 5200, time_est_min: 18 },
        fastest: { route: [[11.6854, 76.1320], [11.7000, 76.1100], [11.7250, 76.0950], [11.7516, 76.0829]], distance_m: 4100, time_est_min: 12 },
      })
    } finally { setLoading(false) }
  }, [])

  const fetchHazards = useCallback(async () => {
    if (!supabase) return
    try {
      const { data } = await supabase.from('reported_hazards').select('*').eq('is_active', true)
      setHazards(data || [])
    } catch { }
  }, [])

  const fetchShelters = useCallback(async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('evacuation_shelters').select('*').limit(10)
        if (!error && data?.length) { setShelters(data); return }
      } catch { }
    }
    try {
      const { data } = await axios.get(API + '/nearest-shelters', { params: { lat: DEMO_START.lat, lng: DEMO_START.lng, limit: 5 } })
      setShelters(data.shelters || [])
    } catch { }
  }, [])

  useEffect(() => {
    if (!supabase) return
    const ch = supabase.channel('hz')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reported_hazards' },
        p => setHazards(prev => [p.new, ...prev]))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  useEffect(() => {
    if (activeTab !== 'home') { fetchRoutes(); fetchHazards(); fetchShelters() }
  }, [activeTab, fetchRoutes, fetchHazards, fetchShelters])

  const handleNavigate = (dest) => { setDestination(dest); setActiveTab('map') }
  const handleReportHazard = async (form) => { await axios.post(API + '/report-hazard', form); fetchHazards() }

  if (activeTab === 'home') {
    return (
      <div className="h-screen w-full overflow-hidden relative" style={{ fontFamily: "'Public Sans', sans-serif", background: '#f8fafc' }}>
        <AnimeNavBar
          items={NAV_ITEMS}
          activeTab={TAB_TO_NAV[activeTab]}
          onTabChange={(name) => setActiveTab(NAV_TO_TAB[name] || 'home')}
          defaultActive="Home"
          position="left"
        />
        <LandingPage onNavigate={handleNavigate} />
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ fontFamily: "'Public Sans', sans-serif", background: '#f8fafc' }}>

      {/* AnimeNavBar — compact centered top pill */}
      <AnimeNavBar
        items={NAV_ITEMS}
        activeTab={TAB_TO_NAV[activeTab]}
        onTabChange={(name) => setActiveTab(NAV_TO_TAB[name] || 'home')}
        defaultActive="Evacuate"
        position="left"
      />

      {/* ─── Full-screen map ─── */}
      <div className="absolute inset-0 z-0">
        <MapView routeData={routeData} hazards={hazards} activeRoute={activeRoute} shelters={shelters} />
      </div>

      {/* Top gradient fade */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/60 via-transparent to-transparent pointer-events-none z-10" />
      {/* Bottom gradient fade */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/80 via-white/40 to-transparent pointer-events-none z-10" />

      {/* ─── Top overlay: search + filters + controls ─── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex flex-col gap-3 px-4 pt-4">
        {/* Search bar */}
        <label className="flex w-full h-12 glass-panel rounded-full shadow-md items-center group focus-within:ring-2 focus-within:ring-blue-500/20 transition-all cursor-text">
          <div className="flex items-center justify-center pl-4 pr-2 text-slate-400 group-focus-within:text-blue-600">
            <span className="material-symbols-outlined text-2xl">search</span>
          </div>
          <input
            id="search-destination"
            className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none h-full text-sm font-medium"
            placeholder="Search for shelter or address"
            defaultValue={destination}
            onKeyDown={e => { if (e.key === 'Enter' && e.target.value) handleNavigate(e.target.value) }}
          />
          <button className="flex items-center justify-center px-4 text-slate-400 hover:text-slate-600 border-l border-slate-200/60 h-full">
            <span className="material-symbols-outlined text-2xl">mic</span>
          </button>
        </label>

        {/* Filter pills (left) + map controls (right) */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            {[
              { key: 'shelters', icon: 'night_shelter', label: 'Shelters', color: 'text-emerald-600' },
              { key: 'hazards', icon: 'local_fire_department', label: 'Hazards', color: 'text-red-500' },
              { key: 'medical', icon: 'medical_services', label: 'Medical', color: 'text-blue-500' },
            ].map(f => (
              <button key={f.key}
                onClick={() => setShowFilters(s => ({ ...s, [f.key]: !s[f.key] }))}
                className="flex items-center gap-2 px-3 py-2 glass-panel rounded-full shadow-md text-slate-700 text-sm font-bold hover:bg-white/90 transition-colors"
                style={showFilters[f.key] ? { border: '1.5px solid rgba(37,99,235,0.25)', background: 'rgba(239,246,255,0.9)' } : {}}
              >
                <span className={`material-symbols-outlined text-lg ${f.color}`}>{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-slate-600 shadow-md hover:bg-white active:scale-95 transition-all">
              <span className="material-symbols-outlined text-xl">layers</span>
            </button>
            <button className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-slate-600 shadow-md hover:bg-white active:scale-95 transition-all">
              <span className="material-symbols-outlined text-xl">near_me</span>
            </button>
            <div className="flex flex-col rounded-full glass-panel shadow-md overflow-hidden">
              <button className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white transition-colors border-b border-slate-200/50">
                <span className="material-symbols-outlined text-xl">add</span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-white transition-colors">
                <span className="material-symbols-outlined text-xl">remove</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Report Hazard button (floating) ─── */}
      <div className="absolute bottom-40 right-4 z-30">
        <button
          id="btn-report-hazard"
          onClick={() => setReportModalOpen(true)}
          className="flex items-center gap-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white px-5 py-3.5 rounded-full shadow-lg transition-all"
          style={{ boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}
        >
          <span className="material-symbols-outlined text-xl">warning</span>
          <span className="font-bold tracking-wide text-sm">Report Hazard</span>
        </button>
      </div>

      {/* ─── Active-tab detail panel (if not just map) ─── */}
      <AnimatePresence>
        {activeTab === 'plan' && (
          <motion.div
            key="plan-panel"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute left-4 right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 max-h-[55vh] overflow-y-auto"
          >
            <RoutePicker activeRoute={activeRoute} setActiveRoute={setActiveRoute} routeData={routeData} />
            <SafetyBreakdown activeRoute={activeRoute} routeData={routeData} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom glass sheet ─── */}
      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hazards={hazards}
        weatherAlerts={weatherAlerts}
        activeRoute={activeRoute}
        routeData={routeData}
      />

      {/* ─── Report Modal ─── */}
      <ReportHazardModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportHazard}
        userCoords={DEMO_START}
      />
    </div>
  )
}
