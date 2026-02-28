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
            className="relative min-h-screen flex flex-col overflow-x-hidden"
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
            <div className="relative z-20 flex items-center justify-between px-5 pt-5 pb-2 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm" style={{ background: '#2563EB' }}>
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>alt_route</span>
                    </div>
                    <span className="font-black text-slate-800 text-base">SafePath AI</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm"
                    style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    LIVE RELIEF
                </div>
            </div>

            {/* ── Hero text ── */}
            <div className="relative z-20 flex flex-col items-center text-center px-6 pt-5 pb-4 max-w-2xl mx-auto">
                <motion.h1
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 leading-tight mb-2"
                >
                    Find Your <span style={{ color: '#2563EB' }}>Safest</span><br />Escape Route
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
                    className="text-slate-500 text-sm md:text-base max-w-xs md:max-w-md"
                >
                    Real-time evacuation routing powered by live hazard data and AI. Optimized for the entire Wayanad district.
                </motion.p>
            </div>

            {/* ── LocationMap & Status ── */}
            <div className="relative z-20 flex flex-col md:flex-row items-center justify-center gap-6 px-5 py-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.32, type: 'spring', stiffness: 180, damping: 20 }}
                    className="flex flex-col items-center gap-1.5"
                >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Current Location</p>
                    <LocationMap location="Wayanad, Kerala, India" coordinates="11.6854° N, 76.1320° E" />
                </motion.div>

                {/* Desktop-only Stats Sidebar */}
                <div className="hidden md:flex flex-col gap-3">
                    <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200 shadow-sm min-w-[180px]">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coverage</p>
                        <p className="text-xl font-black text-slate-800">Entire District</p>
                    </div>
                </div>
            </div>

            {/* ── Main Search & Tools ── */}
            <div className="relative z-20 px-5 pb-8 flex flex-col items-center gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
                    className="w-full max-w-[420px]"
                >
                    <form onSubmit={e => { e.preventDefault(); handleSearch(searchQuery) }} className="relative">
                        <label
                            className="flex w-full h-11 md:h-14 rounded-full items-center cursor-text transition-all"
                            style={{
                                background: 'rgba(255,255,255,0.95)',
                                backdropFilter: 'blur(20px)',
                                border: isFocused ? '1.5px solid rgba(37,99,235,0.45)' : '1.5px solid rgba(0,0,0,0.08)',
                                boxShadow: isFocused ? '0 10px 40px rgba(37,99,235,0.15)' : '0 4px 20px rgba(0,0,0,0.08)',
                            }}
                        >
                            <div className="pl-4 pr-2 shrink-0">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isFocused ? '#2563EB' : '#94a3b8' }}>search</span>
                            </div>
                            <input
                                id="destination-search"
                                className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none h-full text-xs md:text-sm font-medium"
                                placeholder="Search any destination in Wayanad..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                            />
                            <button
                                id="btn-search-destination"
                                className="h-9 md:h-12 px-5 md:px-8 mr-1 rounded-full bg-blue-600 text-white text-xs md:text-sm font-bold hover:bg-blue-700 transition-colors shadow-md"
                            >
                                {loading ? <span className="animate-spin">⟳</span> : 'Route'}
                            </button>
                        </label>

                        {/* Quick-pick dropdown */}
                        <AnimatePresence>
                            {isFocused && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                    className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 p-1"
                                    style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', backdropFilter: 'blur(24px)' }}
                                >
                                    <p className="px-5 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Emergency Targets</p>
                                    {QUICK_PICKS.map((pick, i) => (
                                        <button key={i} type="button" onClick={() => handleSearch(pick.query)}
                                            className="w-full flex items-center justify-between px-5 py-3.5 text-left rounded-xl hover:bg-blue-50 transition-all text-sm font-bold text-slate-700">
                                            {pick.label}
                                            <ArrowRight size={14} className="text-blue-500" />
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </motion.div>

                {/* ── Shops & Schools Discovery ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="w-full max-w-[420px] flex flex-col gap-3"
                >
                    <div className="flex items-center justify-between px-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Localized Resources</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Supabase Integrated
                        </div>
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar px-1">
                        {[
                            { icon: '🏫', label: 'Schools' },
                            { icon: '🛍️', label: 'Shops' },
                            { icon: '🏤', label: 'Offices' },
                            { icon: '🏥', label: 'Clinics' }
                        ].map((poi, idx) => (
                            <div key={idx}
                                className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/60 border border-slate-100 backdrop-blur-md text-xs font-bold text-slate-700 shadow-sm cursor-pointer hover:bg-white/90 hover:shadow-md transition-all active:scale-95">
                                <span>{poi.icon}</span>
                                <span>{poi.label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Main CTA ── */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    onClick={() => onNavigate('Evacuation Map')}
                    id="btn-open-map"
                    className="w-full max-w-[420px] text-white font-black text-sm md:text-base py-4 md:py-5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8)', boxShadow: '0 8px 30px rgba(37,99,235,0.4)' }}
                >
                    <span className="material-symbols-outlined text-xl">explore</span>
                    Open Full District Rescue Map
                    <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                </motion.button>
            </div>
        </div>
    )
}
