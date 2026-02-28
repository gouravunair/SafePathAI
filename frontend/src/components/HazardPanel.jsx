import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

const HAZARD_ICONS = { flood: '🌊', fire: '🔥', roadblock: '🚧', structural: '🏗️', landslide: '⛰️', weather_alert: '⛈️', other: '⚠️' }

export default function HazardPanel({ hazards, weatherAlerts }) {
    const all = [
        ...hazards.map(h => ({ ...h, _kind: 'hazard' })),
        ...weatherAlerts.map(a => ({ ...a, _kind: 'weather', type: 'weather_alert' }))
    ]

    return (
        <div className="absolute top-20 left-4 bottom-36 overflow-y-auto hide-scrollbar w-72 z-20 flex flex-col gap-3 pointer-events-auto">
            {/* Header */}
            <div className="glass-panel rounded-2xl px-4 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className="material-symbols-outlined text-xl text-red-500">warning</span>
                    Nearby Hazards
                </div>
                <span className="text-xs font-black bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">{all.length}</span>
            </div>

            {all.length === 0 && (
                <div className="glass-panel rounded-2xl px-4 py-6 text-center shadow-sm">
                    <p className="text-2xl mb-1">✅</p>
                    <p className="text-sm font-semibold text-slate-700">No active hazards</p>
                    <p className="text-xs text-slate-400 mt-0.5">Area is clear</p>
                </div>
            )}

            {all.map((item, i) => {
                const isCritical = (item.severity || 0) >= 7
                return (
                    <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="glass-panel rounded-2xl p-3 shadow-sm flex items-start gap-3"
                        style={isCritical ? { borderColor: 'rgba(239,68,68,0.3)', boxShadow: '0 0 0 1px rgba(239,68,68,0.15)' } : {}}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${item.type === 'weather_alert' ? 'bg-purple-50' : item.type === 'flood' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                            {HAZARD_ICONS[item.type] || '⚠️'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.type}</span>
                                {item.severity != null && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isCritical ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {item.severity}/10
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-semibold text-slate-800 leading-snug truncate mt-0.5">
                                {item.description || item.event || `${item.type} detected`}
                            </p>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
