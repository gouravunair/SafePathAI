import React from 'react'

export default function RoutePicker({ activeRoute, setActiveRoute, routeData }) {
    const safest = routeData?.safest
    const fastest = routeData?.fastest
    const safeMin = safest ? Math.ceil(safest.time_est_min) : 18
    const fastMin = fastest ? Math.ceil(fastest.time_est_min) : 12
    const safeDist = safest ? `${(safest.distance_m / 1000).toFixed(1)} km` : '5.2 km'
    const fastDist = fastest ? `${(fastest.distance_m / 1000).toFixed(1)} km` : '4.1 km'

    const card = (key, label, icon, time, dist, note, color) => {
        const isActive = activeRoute === key
        return (
            <button
                onClick={() => setActiveRoute(key)}
                className="flex-1 rounded-2xl p-3.5 text-left transition-all active:scale-95 shadow-sm"
                style={{
                    background: isActive ? (key === 'safest' ? 'rgba(239,246,255,0.95)' : 'rgba(255,247,237,0.95)') : 'rgba(255,255,255,0.7)',
                    border: `1.5px solid ${isActive ? color : 'rgba(0,0,0,0.06)'}`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: isActive ? `0 0 0 1px ${color}25, 0 4px 16px ${color}18` : '0 2px 8px rgba(0,0,0,0.05)'
                }}
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${color}18` }}>
                        <span className="material-symbols-outlined text-lg" style={{ color }}>{icon}</span>
                    </div>
                    <span className="text-2xl font-black text-slate-800">{time}<span className="text-xs font-normal text-slate-400 ml-0.5">min</span></span>
                </div>
                <p className="text-sm font-bold text-slate-800">{label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{dist} · {note}</p>
                {isActive && (
                    <div className="mt-2 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                        <span className="text-[10px] font-bold" style={{ color }}>Selected</span>
                    </div>
                )}
            </button>
        )
    }

    return (
        <div className="px-1 flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Available Routes</p>
            <div className="flex gap-3">
                {card('safest', 'Via Highland Ridge', 'shield', safeMin, safeDist, '+120m Elev.', '#2563EB')}
                {card('fastest', 'Via River Road', 'bolt', fastMin, fastDist, '⚠️ Flood Risk', '#f97316')}
            </div>
        </div>
    )
}
