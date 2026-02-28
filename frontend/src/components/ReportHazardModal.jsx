import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const HAZARD_TYPES = [
    { value: 'flood', label: '🌊 Flood' },
    { value: 'fire', label: '🔥 Wildfire / Fire' },
    { value: 'roadblock', label: '🚧 Road Blockage' },
    { value: 'structural', label: '🏗️ Structural Damage' },
    { value: 'landslide', label: '⛰️ Landslide' },
    { value: 'other', label: '⚠️ Other' },
]

export default function ReportHazardModal({ isOpen, onClose, onSubmit, userCoords }) {
    const [form, setForm] = useState({ type: 'flood', severity: 5, description: '', lat: userCoords?.lat || '', lng: userCoords?.lng || '', radius_meters: 200 })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true)
        try {
            await onSubmit(form); setSuccess(true)
            setTimeout(() => {
                setSuccess(false); onClose()
                setForm({ type: 'flood', severity: 5, description: '', lat: userCoords?.lat || '', lng: userCoords?.lng || '', radius_meters: 200 })
            }, 1500)
        } catch (err) { console.error(err) } finally { setLoading(false) }
    }

    const sevColor = form.severity >= 7 ? '#ef4444' : form.severity >= 4 ? '#f59e0b' : '#10b981'

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: 60, opacity: 0, scale: 0.97 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 60, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="relative w-full max-w-md rounded-3xl p-6"
                        style={{
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255,255,255,0.8)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
                        }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl text-red-500">warning</span>
                                </div>
                                Report Hazard
                            </h2>
                            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {success ? (
                            <div className="text-center py-8">
                                <div className="text-5xl mb-3 animate-bounce">✅</div>
                                <p className="font-black text-lg text-slate-800">Hazard Reported!</p>
                                <p className="text-sm text-slate-400 mt-1">Nearby users will be warned.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Type */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Type</label>
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                                        {HAZARD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>

                                {/* Severity */}
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Severity</label>
                                        <span className="text-sm font-black" style={{ color: sevColor }}>{form.severity}/10</span>
                                    </div>
                                    <input type="range" min={1} max={10} value={form.severity}
                                        onChange={e => setForm(f => ({ ...f, severity: Number(e.target.value) }))}
                                        className="w-full" style={{ accentColor: sevColor }} />
                                    <div className="flex justify-between text-[10px] text-slate-300 mt-1">
                                        <span>Minor</span><span>Moderate</span><span>Critical</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="What's happening? (optional)" rows={2}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
                                </div>

                                {/* Coords */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[{ label: 'Latitude', key: 'lat', placeholder: '37.7749' }, { label: 'Longitude', key: 'lng', placeholder: '-122.4194' }].map(f => (
                                        <div key={f.key}>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{f.label}</label>
                                            <input type="number" step="any" value={form[f.key]} placeholder={f.placeholder}
                                                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                                        </div>
                                    ))}
                                </div>

                                {/* Submit */}
                                <button type="submit" disabled={loading}
                                    className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 20px rgba(239,68,68,0.3)' }}>
                                    {loading
                                        ? <span className="animate-spin text-xl">⟳</span>
                                        : <><span className="material-symbols-outlined text-xl">warning</span> Submit Report</>
                                    }
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
