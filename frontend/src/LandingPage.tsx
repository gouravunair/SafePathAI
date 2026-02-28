import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LocationMap } from './components/ui/expand-map'
import { ArrowRight, X } from 'lucide-react'
import { RetroGrid } from './components/ui/retro-grid'

const QUICK_PICKS = [
    { label: '🏥 Nearest Hospital', query: 'hospital' },
    { label: '🏫 Civic Shelter', query: 'civic shelter' },
    { label: '🏔️ Highland Ridge', query: 'Highland Ridge' },
    { label: '🛖 Emergency Camp', query: 'emergency camp' },
]

export default function LandingPage({ onNavigate }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSearch = async (query) => {
        if (!query.trim()) return
        setLoading(true); setSearchQuery(query)
        await new Promise(r => setTimeout(r, 600))
        setLoading(false); onNavigate(query)
    }

    return (
        <div
            className="relative min-h-screen flex flex-col overflow-hidden"
            style={{ background: '#f8fafc', fontFamily: "'Public Sans', sans-serif" }}
        >
            {/* RetroGrid — sole background */}
            <RetroGrid angle={65} className="z-[1]" />

            {/* Subtle top & bottom white fades */}
            <div className="absolute inset-x-0 top-0 h-32 pointer-events-none z-10"
                style={{ background: 'linear-gradient(to bottom, rgba(248,250,252,0.75), transparent)' }} />
            <div className="absolute inset-x-0 bottom-0 h-52 pointer-events-none z-10"
                style={{ background: 'linear-gradient(to top, rgba(248,250,252,0.97) 20%, rgba(248,250,252,0.5) 60%, transparent)' }} />

            {/* ── Header ── */}
            <div className="relative z-20 flex items-center justify-between px-5 pt-5 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: '#2563EB' }}>
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>alt_route</span>
                    </div>
                    <span className="font-black text-slate-800 text-base">SafePath AI</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    LIVE
                </div>
            </div>

            {/* ── Hero text ── */}
            <div className="relative z-20 flex flex-col items-center text-center px-6 pt-5 pb-4">
                <motion.h1
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="text-4xl font-black text-slate-900 leading-tight mb-1.5"
                >
                    Find Your <span style={{ color: '#2563EB' }}>Safest</span><br />Escape Route
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
                    className="text-slate-500 text-sm max-w-xs"
                >
                    Real-time evacuation routing powered by live hazard data and AI.
                </motion.p>
            </div>

            {/* ── LocationMap widget ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.32, type: 'spring', stiffness: 180, damping: 20 }}
                className="relative z-20 flex flex-col items-center gap-1.5 pb-5"
            >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Current Location</p>
                <LocationMap location="San Francisco, CA" coordinates="37.7749° N, 122.4194° W" />
            </motion.div>

            {/* ── Search bar (compact) ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
                className="relative z-20 px-5 pb-3"
            >
                <form onSubmit={e => { e.preventDefault(); handleSearch(searchQuery) }} className="max-w-sm mx-auto">
                    <label
                        className="flex w-full h-10 rounded-full items-center cursor-text transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(16px)',
                            border: isFocused ? '1.5px solid rgba(37,99,235,0.45)' : '1.5px solid rgba(0,0,0,0.08)',
                            boxShadow: isFocused ? '0 0 0 3px rgba(37,99,235,0.12)' : '0 2px 12px rgba(0,0,0,0.07)',
                        }}
                    >
                        <div className="pl-3 pr-1.5 shrink-0">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: isFocused ? '#2563EB' : '#94a3b8' }}>search</span>
                        </div>
                        <input
                            id="destination-search"
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                            placeholder="Search destination or shelter…"
                            className="flex-1 bg-transparent py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')} className="px-1.5 text-slate-300 hover:text-slate-500">
                                <X size={13} />
                            </button>
                        )}
                        <button
                            id="btn-search-destination"
                            type="submit"
                            disabled={!searchQuery.trim() || loading}
                            className="m-1 px-3.5 py-1.5 rounded-full font-bold text-xs text-white flex items-center gap-1 transition-all active:scale-95 disabled:opacity-40"
                            style={{ background: '#2563EB', boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }}
                        >
                            {loading ? <span className="animate-spin text-sm">⟳</span> : 'Route'}
                        </button>
                    </label>

                    {/* Quick-pick dropdown */}
                    <AnimatePresence>
                        {isFocused && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                className="absolute left-5 right-5 mt-1.5 rounded-2xl overflow-hidden z-50"
                                style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 12px 36px rgba(0,0,0,0.12)', backdropFilter: 'blur(16px)' }}
                            >
                                <p className="px-4 pt-2.5 pb-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Quick picks</p>
                                {QUICK_PICKS.map((pick, i) => (
                                    <button key={i} type="button" onClick={() => handleSearch(pick.query)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-50 transition-colors text-sm font-semibold text-slate-700"
                                        style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                                        {pick.label}
                                        <ArrowRight size={14} className="text-blue-500" />
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>



            {/* ── CTA ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                className="relative z-20 px-5 pb-8"
            >
                <button
                    onClick={() => onNavigate('Evacuation Map')}
                    id="btn-open-map"
                    className="block mx-auto text-white font-black text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                    style={{ width: '100%', maxWidth: '384px', background: 'linear-gradient(135deg, #2563EB, #1d4ed8)', boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}
                >
                    <span className="material-symbols-outlined text-lg">map</span>
                    Open Evacuation Map
                </button>
            </motion.div>
        </div>
    )
}
