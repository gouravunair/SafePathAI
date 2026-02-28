import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const SAFE_BLUE = '#2563EB'
const FAST_ORANGE = '#f97316'
const WAYANAD_CENTER = [11.6854, 76.1320]

export default function MapView({ routeData, hazards, activeRoute, shelters }) {
    const mapRef = useRef(null)
    const mapInst = useRef(null)
    const layersRef = useRef({})

    useEffect(() => {
        if (mapInst.current) return
        const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
        mapInst.current = map

        // Light CartoDB Positron tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
        }).addTo(map)

        // Attribution corner
        L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map)

        map.setView(WAYANAD_CENTER, 14)
        layersRef.current.hazards = L.layerGroup().addTo(map)
        layersRef.current.shelters = L.layerGroup().addTo(map)
        layersRef.current.routes = L.layerGroup().addTo(map)

        // Pulsing user location dot
        const locIcon = L.divIcon({
            html: `<div style="width:18px;height:18px;background:${SAFE_BLUE};border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(37,99,235,0.18)">
               <div style="position:absolute;inset:0;background:${SAFE_BLUE};border-radius:50%;animation:ping 1.5s ease-out infinite;opacity:0.35"></div></div>`,
            className: '', iconSize: [18, 18], iconAnchor: [9, 9]
        })
        L.marker(WAYANAD_CENTER, { icon: locIcon }).addTo(map)
    }, [])

    // Routes
    useEffect(() => {
        const map = mapInst.current
        if (!map || !routeData) return
        layersRef.current.routes.clearLayers()
        const { safest, fastest } = routeData
        if (fastest?.route) {
            L.polyline(fastest.route, { color: FAST_ORANGE, weight: 4, opacity: 0.7, dashArray: '8 6' }).addTo(layersRef.current.routes)
        }
        if (safest?.route) {
            L.polyline(safest.route, { color: SAFE_BLUE, weight: 5, opacity: 0.9 }).addTo(layersRef.current.routes)
            map.fitBounds(L.polyline(safest.route).getBounds(), { padding: [60, 60] })
        }
    }, [routeData])

    // Hazards
    useEffect(() => {
        if (!mapInst.current) return
        layersRef.current.hazards.clearLayers()
        hazards.forEach(h => {
            const geom = h.geom?.coordinates
            if (!geom) return
            L.circle([geom[1], geom[0]], {
                radius: h.radius_meters || 200,
                color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.12,
                weight: 1.5, dashArray: '4 4'
            }).addTo(layersRef.current.hazards)
            const icon = L.divIcon({
                html: `<div style="background:white;border:1.5px solid #ef4444;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(239,68,68,0.3);font-size:14px">${h.type === 'flood' ? '🌊' : h.type === 'fire' ? '🔥' : '⚠️'}</div>`,
                className: '', iconSize: [28, 28], iconAnchor: [14, 14]
            })
            L.marker([geom[1], geom[0]], { icon }).addTo(layersRef.current.hazards)
        })
    }, [hazards])

    // Shelters
    useEffect(() => {
        if (!mapInst.current) return
        layersRef.current.shelters.clearLayers()
        shelters.forEach(s => {
            const geom = s.geom?.coordinates || [s.lng, s.lat]
            if (!geom) return
            const icon = L.divIcon({
                html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
                <div style="background:#10b981;border:2px solid white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(16,185,129,0.4)">
                  <span class="material-symbols-outlined" style="color:white;font-size:16px">night_shelter</span>
                </div>
                <span style="background:rgba(255,255,255,0.92);color:#1e293b;font-weight:700;font-size:10px;padding:2px 8px;border-radius:99px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.08)">${s.name || 'Shelter'}</span>
               </div>`,
                className: '', iconSize: [80, 48], iconAnchor: [40, 16]
            })
            L.marker([geom[1] || s.lat, geom[0] || s.lng], { icon }).addTo(layersRef.current.shelters)
        })
    }, [shelters])

    return (
        <div
            ref={mapRef}
            style={{ width: '100%', height: '100%', background: '#f8fafc' }}
        />
    )
}
