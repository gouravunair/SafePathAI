import React from "react"
import { cn } from "@/lib/utils"

export function RetroGrid({
    className,
    angle = 65,
}: {
    className?: string
    angle?: number
}) {
    return (
        <div
            className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
            style={{ perspective: "200px", opacity: 0.55 }}
        >
            {/* Scrolling perspective grid */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    transform: `rotateX(${angle}deg)`,
                }}
            >
                <div
                    className="animate-grid"
                    style={{
                        backgroundRepeat: "repeat",
                        backgroundSize: "60px 60px",
                        height: "300vh",
                        width: "600vw",
                        marginLeft: "-50%",
                        inset: "0% 0px",
                        transformOrigin: "100% 0 0",
                        backgroundImage:
                            "linear-gradient(to right, rgba(0,0,0,0.25) 1px, transparent 0), linear-gradient(to bottom, rgba(0,0,0,0.25) 1px, transparent 0)",
                    }}
                />
            </div>

            {/* Bottom fade so content reads cleanly */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, #f8fafc 10%, transparent 90%)",
                }}
            />
        </div>
    )
}
