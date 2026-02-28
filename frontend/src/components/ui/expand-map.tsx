"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion"

interface LocationMapProps {
    location?: string
    coordinates?: string
    className?: string
}

export function LocationMap({
    location = "Wayanad, Kerala, India",
    coordinates = "11.6854° N, 76.1320° E",
    className,
}: LocationMapProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const rotateX = useTransform(mouseY, [-50, 50], [8, -8])
    const rotateY = useTransform(mouseX, [-50, 50], [-8, 8])

    const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 })
    const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 })

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        mouseX.set(e.clientX - centerX)
        mouseY.set(e.clientY - centerY)
    }

    const handleMouseLeave = () => {
        mouseX.set(0)
        mouseY.set(0)
        setIsHovered(false)
    }

    const handleClick = () => {
        setIsExpanded(!isExpanded)
    }

    return (
        <motion.div
            ref={containerRef}
            className={`relative cursor-pointer select-none ${className}`}
            style={{ perspective: 1000 }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <motion.div
                className="relative overflow-hidden rounded-2xl"
                style={{
                    rotateX: springRotateX,
                    rotateY: springRotateY,
                    transformStyle: "preserve-3d",
                    background: "linear-gradient(135deg, rgba(26,26,53,0.95) 0%, rgba(20,20,40,0.98) 100%)",
                    border: isExpanded
                        ? "1px solid rgba(0,230,118,0.4)"
                        : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: isExpanded
                        ? "0 0 30px rgba(0,230,118,0.2), 0 20px 60px rgba(0,0,0,0.5)"
                        : "0 10px 40px rgba(0,0,0,0.4)",
                }}
                animate={{
                    width: isExpanded ? 360 : 260,
                    height: isExpanded ? 300 : 150,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
                {/* Gradient overlay */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(135deg, rgba(0,230,118,0.05) 0%, transparent 60%, rgba(99,102,241,0.05) 100%)" }} />

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            {/* Map BG */}
                            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #0d1520 100%)" }} />

                            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                {/* Main roads */}
                                {[["0%", "35%", "100%", "35%"], ["0%", "65%", "100%", "65%"]].map(([x1, y1, x2, y2], i) => (
                                    <motion.line key={`h-main-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                                        stroke="rgba(0,230,118,0.25)" strokeWidth="3"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }} />
                                ))}
                                {[["30%", "0%", "30%", "100%"], ["70%", "0%", "70%", "100%"]].map(([x1, y1, x2, y2], i) => (
                                    <motion.line key={`v-main-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                                        stroke="rgba(0,230,118,0.18)" strokeWidth="2"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }} />
                                ))}
                                {/* Secondary streets */}
                                {[20, 50, 80].map((y, i) => (
                                    <motion.line key={`hs-${i}`} x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`}
                                        stroke="rgba(165,180,252,0.08)" strokeWidth="1"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }} />
                                ))}
                                {[15, 45, 55, 85].map((x, i) => (
                                    <motion.line key={`vs-${i}`} x1={`${x}%`} y1="0%" x2={`${x}%`} y2="100%"
                                        stroke="rgba(165,180,252,0.08)" strokeWidth="1"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }} />
                                ))}
                            </svg>

                            {/* Buildings */}
                            {[
                                ["40%", "10%", "15%", "20%", "0.3"],
                                ["15%", "35%", "12%", "15%", "0.25"],
                                ["70%", "70%", "18%", "18%", "0.28"],
                                ["20%", "right", "10%", "25%", "0.22"],
                                ["55%", "5%", "8%", "12%", "0.20"],
                                ["8%", "75%", "14%", "10%", "0.22"],
                            ].map(([top, left, w, h, op], i) => (
                                <motion.div key={i}
                                    className="absolute rounded-sm"
                                    style={{
                                        top, [typeof left === 'string' && left === 'right' ? 'right' : 'left']: typeof left === 'string' && left !== 'right' ? left : "10%",
                                        width: w, height: h,
                                        background: `rgba(0,230,118,${op})`,
                                        border: `1px solid rgba(0,230,118,0.15)`
                                    }}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                                />
                            ))}

                            {/* Pin */}
                            <motion.div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                initial={{ scale: 0, y: -20 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.3 }}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                    style={{ filter: "drop-shadow(0 0 12px rgba(0, 230, 118, 0.7))" }}>
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#00e676" />
                                    <circle cx="12" cy="9" r="2.5" fill="#0d1a2e" />
                                </svg>
                            </motion.div>

                            {/* Fade bottom */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Collapsed grid pattern */}
                <motion.div className="absolute inset-0" animate={{ opacity: isExpanded ? 0 : 0.04 }}>
                    <svg width="100%" height="100%" className="absolute inset-0">
                        <defs>
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </motion.div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-5">
                    {/* Top */}
                    <div className="flex items-start justify-between">
                        <motion.div animate={{ opacity: isExpanded ? 0 : 1 }} transition={{ duration: 0.3 }}>
                            <motion.svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="#00e676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                animate={{ filter: isHovered ? "drop-shadow(0 0 8px rgba(0,230,118,0.7))" : "drop-shadow(0 0 4px rgba(0,230,118,0.3))" }}
                                transition={{ duration: 0.3 }}>
                                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                                <line x1="9" x2="9" y1="3" y2="18" />
                                <line x1="15" x2="15" y1="6" y2="21" />
                            </motion.svg>
                        </motion.div>

                        <motion.div
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                            style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)" }}
                            animate={{ scale: isHovered ? 1.05 : 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#00e676", boxShadow: "0 0 6px #00e676" }} />
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#39ff9a" }}>Live</span>
                        </motion.div>
                    </div>

                    {/* Bottom */}
                    <div className="space-y-1">
                        <motion.h3
                            className="font-bold text-sm tracking-tight text-white"
                            animate={{ x: isHovered ? 4 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                            {location}
                        </motion.h3>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.p
                                    className="text-xs font-mono"
                                    style={{ color: "rgba(0,230,118,0.7)" }}
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    {coordinates}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Animated underline */}
                        <motion.div
                            style={{ height: "1px", background: "linear-gradient(90deg, rgba(0,230,118,0.6) 0%, rgba(0,230,118,0.2) 60%, transparent 100%)" }}
                            initial={{ scaleX: 0, originX: 0 }}
                            animate={{ scaleX: isHovered || isExpanded ? 1 : 0.3 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Click hint */}
            <motion.p
                className="absolute -bottom-6 left-1/2 text-[10px] whitespace-nowrap"
                style={{ x: "-50%", color: "rgba(255,255,255,0.4)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered && !isExpanded ? 1 : 0, y: isHovered ? 0 : 4 }}
                transition={{ duration: 0.2 }}
            >
                Click to expand
            </motion.p>
        </motion.div>
    )
}
