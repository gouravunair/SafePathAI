import React from 'react'

function Bar({ value, color }) {
    return (
        <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
            <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
        </div>
    )
}

export default function SafetyBreakdown({ activeRoute, routeData }) {
    const isFlood = activeRoute === 'fastest'
    const rows = [
        { icon: 'landscape', label: 'Terrain', value: activeRoute === 'safest' ? 90 : 55, label2: activeRoute === 'safest' ? 'High' : 'Medium', color: activeRoute === 'safest' ? '#10b981' : '#f59e0b' },
        { icon: 'water_drop', label: 'Flood Risk', value: isFlood ? 75 : 8, label2: isFlood ? 'High ⚠️' : 'None', color: isFlood ? '#ef4444' : '#10b981' },
        { icon: 'traffic', label: 'Congestion', value: activeRoute === 'safest' ? 45 : 25, label2: activeRoute === 'safest' ? 'Moderate' : 'Low', color: '#f59e0b' },
    ]

    return (
        <div className="rounded-2xl p-4 shadow-sm" style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,0,0,0.06)'
        }}>
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-blue-600">verified_user</span>
                    Safety Breakdown
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={activeRoute === 'safest'
                        ? { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }
                        : { background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' }}>
                    {activeRoute === 'safest' ? '✦ Safest' : '⚡ Fastest'} Route
                </span>
            </div>
            <div className="space-y-3">
                {rows.map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg text-slate-400 shrink-0">{r.icon}</span>
                        <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-semibold text-slate-600">{r.label}</span>
                                <span className="font-bold" style={{ color: r.color }}>{r.label2}</span>
                            </div>
                            <Bar value={r.value} color={r.color} />
                        </div>
                    </div>
                ))}
            </div>
            {routeData?.safest?.distance_m && (
                <div className="flex justify-around mt-4 pt-3 border-t border-slate-100">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Safest Dist</p>
                        <p className="text-sm font-black text-blue-600">{(routeData.safest.distance_m / 1000).toFixed(2)} km</p>
                    </div>
                    <div className="w-px bg-slate-100" />
                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Fastest Dist</p>
                        <p className="text-sm font-black text-orange-500">{(routeData.fastest.distance_m / 1000).toFixed(2)} km</p>
                    </div>
                </div>
            )}
        </div>
    )
}
