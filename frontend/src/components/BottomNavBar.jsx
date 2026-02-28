import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Bottom sheet displays: alert cards (horizontal scroll) + tab bar
// Tab bar: Map, Alerts, Plan, Profile

const TABS = [
    { key: 'map', icon: 'map', label: 'Map' },
    { key: 'alerts', icon: 'notifications', label: 'Alerts' },
    { key: 'plan', icon: 'alt_route', label: 'Plan' },
    { key: 'profile', icon: 'person', label: 'Profile' },
]

function AlertCard({ icon, iconBg, iconColor, tag, title }) {
    return (
        <div className="shrink-0 flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-3 min-w-[155px] shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{tag}</span>
                <span className="text-sm font-bold text-slate-800 leading-tight">{title}</span>
            </div>
        </div>
    )
}

export default function BottomNavBar({ activeTab, setActiveTab, hazards, weatherAlerts, activeRoute, routeData }) {
    const route = routeData?.[activeRoute]
    const timeMin = route ? Math.ceil(route.time_est_min) : (activeRoute === 'safest' ? 18 : 12)

    // Build alert cards from hazards + weather
    const alertCards = [
        ...hazards.slice(0, 3).map(h => ({
            icon: h.type === 'flood' ? 'water_drop' : h.type === 'fire' ? 'local_fire_department' : 'warning',
            iconBg: h.type === 'fire' ? 'bg-orange-50' : h.type === 'flood' ? 'bg-blue-50' : 'bg-amber-50',
            iconColor: h.type === 'fire' ? 'text-orange-500' : h.type === 'flood' ? 'text-blue-500' : 'text-amber-500',
            tag: 'Hazard',
            title: h.description || h.type
        })),
        ...weatherAlerts.slice(0, 2).map(a => ({
            icon: 'thunderstorm', iconBg: 'bg-purple-50', iconColor: 'text-purple-500',
            tag: 'Weather', title: a.event || 'Alert'
        })),
    ]

    // Default demo cards if no live data
    if (alertCards.length === 0) {
        alertCards.push(
            { icon: 'local_fire_department', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', tag: 'Alert', title: 'Wildfire SE' },
            { icon: 'water_drop', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', tag: 'Status', title: 'Flood Watch' },
        )
    }

    return (
        <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col pointer-events-none">
            {/* Navigate CTA — only on map/plan tabs */}
            {(activeTab === 'map' || activeTab === 'plan') && (
                <div className="w-full flex justify-center px-4 mb-3 pointer-events-auto">
                    <button
                        id="btn-start-navigation"
                        className="flex items-center gap-2.5 text-white font-bold px-8 py-3.5 rounded-full shadow-lg transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8)', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}
                    >
                        <span className="material-symbols-outlined text-xl">navigation</span>
                        Start Navigation · {timeMin} min
                    </button>
                </div>
            )}

            {/* Glass bottom sheet */}
            <div className="pointer-events-auto rounded-t-3xl"
                style={{
                    background: 'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 -8px 32px rgba(0,0,0,0.06)'
                }}>

                {/* Alert cards horizontal scroll */}
                <div className="flex gap-3 px-4 py-2 overflow-x-auto hide-scrollbar">
                    {alertCards.map((card, i) => (
                        <AlertCard key={i} {...card} />
                    ))}
                </div>

                {/* Tab bar */}
                <div className="flex px-4 pb-4 pt-1 justify-around items-end">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className="flex flex-1 flex-col items-center gap-0.5 group active:scale-90 transition-transform"
                            >
                                <div className={`flex h-7 items-center justify-center transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                    <span className={`material-symbols-outlined text-xl ${isActive ? 'material-symbols-filled' : ''}`}
                                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                        {tab.icon}
                                    </span>
                                </div>
                                <p className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                    {tab.label}
                                </p>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
