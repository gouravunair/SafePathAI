"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface NavItem {
    name: string
    icon: React.ElementType
    onClick?: () => void
}

interface NavBarProps {
    items: NavItem[]
    className?: string
    defaultActive?: string
    activeTab?: string
    onTabChange?: (name: string) => void
    /** Position variant — 'top' (default) centres horizontally at the top; 'left' renders a vertical sidebar */
    position?: "top" | "left"
}

export function AnimeNavBar({
    items,
    className,
    defaultActive,
    activeTab: controlledActive,
    onTabChange,
    position = "top",
}: NavBarProps) {
    const [mounted, setMounted] = useState(false)
    const [hoveredTab, setHoveredTab] = useState<string | null>(null)
    const [internalActive, setInternalActive] = useState<string>(defaultActive ?? items[0]?.name ?? "")
    const activeTab = controlledActive ?? internalActive

    useEffect(() => { setMounted(true) }, [])
    if (!mounted) return null

    const handleClick = (item: NavItem) => {
        setInternalActive(item.name)
        onTabChange?.(item.name)
        item.onClick?.()
    }

    /* ──────────────────────── LEFT SIDEBAR ──────────────────────── */
    if (position === "left") {
        return (
            <div className={cn("fixed left-4 top-1/2 -translate-y-1/2 z-[9999] flex flex-col", className)}>
                <motion.div
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-3xl shadow-xl"
                    style={{
                        background: "rgba(255,255,255,0.88)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)",
                    }}
                    initial={{ x: -60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                    {items.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.name
                        const isHovered = hoveredTab === item.name

                        return (
                            <div key={item.name} className="relative flex items-center">
                                {/* Mascot floats to the RIGHT of active item */}
                                {isActive && (
                                    <motion.div
                                        layoutId="mascot-sidebar"
                                        className="absolute left-full ml-3 pointer-events-none"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    >
                                        <div className="relative w-10 h-10">
                                            <motion.div
                                                className="absolute w-9 h-9 bg-white rounded-full left-1/2 -translate-x-1/2 shadow-md"
                                                animate={
                                                    hoveredTab
                                                        ? { scale: [1, 1.1, 1], rotate: [0, -6, 6, 0], transition: { duration: 0.4 } }
                                                        : { y: [0, -3, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
                                                }
                                                style={{ border: "2px solid #e2e8f0" }}
                                            >
                                                {/* Eyes */}
                                                {[{ left: "22%" }, { right: "22%" }].map((pos, i) => (
                                                    <motion.div key={i}
                                                        className="absolute w-1.5 h-1.5 bg-slate-800 rounded-full"
                                                        animate={hoveredTab ? { scaleY: [1, 0.1, 1], transition: { duration: 0.2 } } : {}}
                                                        style={{ ...pos, top: "38%" }}
                                                    />
                                                ))}
                                                {/* Blush */}
                                                {[{ left: "10%" }, { right: "10%" }].map((pos, i) => (
                                                    <div key={i} className="absolute w-2 h-1 rounded-full"
                                                        style={{ ...pos, top: "56%", background: "rgba(255,182,193,0.8)" }} />
                                                ))}
                                                {/* Smile */}
                                                <motion.div
                                                    className="absolute w-3 h-1.5 border-b-2 border-slate-700 rounded-full"
                                                    animate={hoveredTab ? { scaleY: 1.5, y: -1 } : { scaleY: 1, y: 0 }}
                                                    style={{ left: "32%", top: "60%" }}
                                                />
                                                <AnimatePresence>
                                                    {hoveredTab && [0, 1].map((i) => (
                                                        <motion.div key={i}
                                                            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
                                                            transition={{ delay: i * 0.1 }}
                                                            className="absolute text-yellow-300 text-[10px]"
                                                            style={{ top: i === 0 ? "-4px" : "-7px", [i === 0 ? "right" : "left"]: "-3px" }}>
                                                            ✨
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </motion.div>
                                            {/* Pointer diamond pointing LEFT */}
                                            <motion.div
                                                className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3"
                                                animate={{ x: [0, -2, 0], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }}
                                            >
                                                <div className="w-full h-full bg-white rotate-45 border-l border-b border-slate-100" />
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                )}

                                <button
                                    onClick={() => handleClick(item)}
                                    onMouseEnter={() => setHoveredTab(item.name)}
                                    onMouseLeave={() => setHoveredTab(null)}
                                    className="relative flex flex-col items-center gap-1 px-3 py-3 rounded-2xl transition-all duration-200 active:scale-95"
                                    style={{
                                        background: isActive ? "rgba(37,99,235,0.1)" : "transparent",
                                        border: isActive ? "1px solid rgba(37,99,235,0.2)" : "1px solid transparent",
                                        minWidth: "52px",
                                    }}
                                >
                                    {/* Active glow */}
                                    {isActive && (
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl"
                                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            style={{ background: "rgba(37,99,235,0.06)", boxShadow: "inset 0 0 12px rgba(37,99,235,0.1)" }}
                                        />
                                    )}

                                    {/* Hover bg */}
                                    <AnimatePresence>
                                        {isHovered && !isActive && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className="absolute inset-0 rounded-2xl" style={{ background: "rgba(0,0,0,0.04)" }} />
                                        )}
                                    </AnimatePresence>

                                    <Icon
                                        size={20}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        style={{ color: isActive ? "#2563EB" : "#94a3b8", position: "relative", zIndex: 1 }}
                                    />
                                    <span
                                        className="text-[9px] font-bold leading-none"
                                        style={{ color: isActive ? "#2563EB" : "#94a3b8", position: "relative", zIndex: 1 }}
                                    >
                                        {item.name}
                                    </span>
                                </button>
                            </div>
                        )
                    })}
                </motion.div>
            </div>
        )
    }

    /* ──────────────────────── TOP PILL (original) ──────────────────────── */
    return (
        <div className={cn("fixed top-4 left-0 right-0 z-[9999]", className)}>
            <div className="flex justify-center">
                <motion.div
                    className="flex items-center gap-1 py-2 px-2 rounded-full shadow-xl"
                    style={{
                        background: "rgba(255,255,255,0.88)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    }}
                    initial={{ y: -24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                    {items.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.name
                        const isHovered = hoveredTab === item.name
                        return (
                            <button
                                key={item.name}
                                onClick={() => handleClick(item)}
                                onMouseEnter={() => setHoveredTab(item.name)}
                                onMouseLeave={() => setHoveredTab(null)}
                                className="relative flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 active:scale-95"
                                style={{
                                    background: isActive ? "rgba(37,99,235,0.1)" : "transparent",
                                    color: isActive ? "#2563EB" : "#94a3b8",
                                    border: isActive ? "1px solid rgba(37,99,235,0.2)" : "1px solid transparent",
                                }}
                            >
                                {isActive && (
                                    <motion.div layoutId="anime-mascot-top"
                                        className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none"
                                        initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                                        <div className="relative w-10 h-10">
                                            <motion.div
                                                className="absolute w-9 h-9 bg-white rounded-full left-1/2 -translate-x-1/2 shadow-md"
                                                animate={hoveredTab
                                                    ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0], transition: { duration: 0.4 } }
                                                    : { y: [0, -3, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                                                style={{ border: "2px solid #e2e8f0" }}
                                            >
                                                {[{ left: "22%" }, { right: "22%" }].map((pos, i) => (
                                                    <motion.div key={i} className="absolute w-1.5 h-1.5 bg-slate-800 rounded-full"
                                                        animate={hoveredTab ? { scaleY: [1, 0.1, 1], transition: { duration: 0.2 } } : {}}
                                                        style={{ ...pos, top: "38%" }} />
                                                ))}
                                                {[{ left: "10%" }, { right: "10%" }].map((pos, i) => (
                                                    <div key={i} className="absolute w-2 h-1 rounded-full"
                                                        style={{ ...pos, top: "56%", background: "rgba(255,182,193,0.8)" }} />
                                                ))}
                                                <motion.div className="absolute w-3 h-1.5 border-b-2 border-slate-700 rounded-full"
                                                    animate={hoveredTab ? { scaleY: 1.5, y: -1 } : { scaleY: 1, y: 0 }}
                                                    style={{ left: "32%", top: "60%" }} />
                                                <AnimatePresence>
                                                    {hoveredTab && [0, 1].map(i => (
                                                        <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
                                                            transition={{ delay: i * 0.1 }} className="absolute text-yellow-300 text-[10px]"
                                                            style={{ top: i === 0 ? "-4px" : "-7px", [i === 0 ? "right" : "left"]: "-3px" }}>✨</motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </motion.div>
                                            <motion.div className="absolute -bottom-1 left-1/2 w-3 h-3 -translate-x-1/2"
                                                animate={{ y: [0, 2, 0], transition: { duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.5 } }}>
                                                <div className="w-full h-full bg-white rotate-45 shadow-sm border-r border-b border-slate-100" />
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                )}
                                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} style={{ position: "relative", zIndex: 1 }} />
                                <span className="hidden md:inline text-sm font-bold" style={{ position: "relative", zIndex: 1 }}>{item.name}</span>
                                <AnimatePresence>
                                    {isHovered && !isActive && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="absolute inset-0 rounded-full" style={{ background: "rgba(0,0,0,0.04)" }} />
                                    )}
                                </AnimatePresence>
                            </button>
                        )
                    })}
                </motion.div>
            </div>
        </div>
    )
}
