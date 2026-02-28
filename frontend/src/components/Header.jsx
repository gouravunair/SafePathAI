import React from 'react'
import { ArrowLeft, BatteryCharging, MapPin } from 'lucide-react'

export default function Header({ onBack, destination }) {
    return (
        <header
            className="flex items-center justify-between p-4 sticky top-0 z-20 border-b"
            style={{
                background: 'linear-gradient(180deg, rgba(13,13,26,0.98) 0%, rgba(19,13,42,0.95) 100%)',
                backdropFilter: 'blur(16px)',
                borderColor: 'rgba(255,255,255,0.08)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
            }}
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center p-2 rounded-full transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                    <h1
                        className="text-lg font-bold tracking-tight bg-clip-text text-transparent"
                        style={{ backgroundImage: 'linear-gradient(90deg, #ffffff, #a5b4fc)' }}
                    >
                        Route Comparison
                    </h1>
                    {destination ? (
                        <p className="text-[10px] font-bold flex items-center gap-1" style={{ color: '#39ff9a' }}>
                            <MapPin className="w-3 h-3" />
                            {destination}
                        </p>
                    ) : (
                        <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(165,180,252,0.6)' }}>
                            SafePath AI
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)' }}
                >
                    <BatteryCharging className="w-4 h-4" style={{ color: '#00e676' }} />
                    <span className="text-xs font-bold" style={{ color: '#39ff9a' }}>92%</span>
                </div>
                <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)' }}
                >
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#ff6b00', boxShadow: '0 0 6px #ff6b00' }} />
                    <span className="text-xs font-bold" style={{ color: '#ff8c00' }}>LIVE</span>
                </div>
            </div>
        </header>
    )
}
