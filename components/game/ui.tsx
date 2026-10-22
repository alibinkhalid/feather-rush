"use client"

import { cn } from "@/lib/utils"
import type { MedalTier } from "@/lib/game/types"
import { getAudio } from "@/lib/game/audio"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 border-amber-600 shadow-[0_5px_0_0] shadow-amber-700",
  secondary:
    "bg-gradient-to-b from-sky-400 to-sky-600 text-white border-sky-700 shadow-[0_5px_0_0] shadow-sky-800",
  ghost:
    "bg-white/10 text-white border-white/25 shadow-[0_4px_0_0] shadow-black/30 backdrop-blur",
  danger:
    "bg-gradient-to-b from-rose-400 to-rose-600 text-white border-rose-700 shadow-[0_5px_0_0] shadow-rose-800",
}

export function GameButton({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
  type = "button",
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  className?: string
  disabled?: boolean
  type?: "button" | "submit"
  "aria-label"?: string
}) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        const a = getAudio()
        a.resume()
        a.play("button")
        onClick?.()
      }}
      className={cn(
        "select-none rounded-2xl border-2 px-6 font-bold tracking-wide",
        "min-h-[52px] text-lg",
        "transition-transform duration-100 active:translate-y-[4px] active:shadow-none",
        "disabled:opacity-40 disabled:active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}

export function IconButton({
  children,
  onClick,
  className,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  "aria-label": string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => {
        const a = getAudio()
        a.resume()
        a.play("button")
        onClick?.()
      }}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white backdrop-blur",
        "transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50",
        className,
      )}
    >
      {children}
    </button>
  )
}

export const MEDAL_META: Record<Exclude<MedalTier, "none">, { label: string; from: string; to: string; ring: string }> = {
  bronze: { label: "Bronze", from: "#e8a15c", to: "#a5642c", ring: "#7a4a1e" },
  silver: { label: "Silver", from: "#e8e8ef", to: "#a8adba", ring: "#7d818c" },
  gold: { label: "Gold", from: "#ffe27a", to: "#f5a623", ring: "#c07d10" },
  platinum: { label: "Platinum", from: "#c8f7ff", to: "#7fd8f5", ring: "#4aa6c2" },
}

export function Medal({ tier, size = 40 }: { tier: MedalTier; size?: number }) {
  if (tier === "none") {
    return (
      <div
        className="flex items-center justify-center rounded-full border-2 border-dashed border-white/25 text-[10px] font-semibold text-white/40"
        style={{ width: size, height: size }}
      >
        —
      </div>
    )
  }
  const meta = MEDAL_META[tier]
  return (
    <div
      className="flex items-center justify-center rounded-full border-2 font-black text-white/90 shadow-inner"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, ${meta.from}, ${meta.to})`,
        borderColor: meta.ring,
        fontSize: size * 0.4,
      }}
      title={meta.label}
      aria-label={`${meta.label} medal`}
    >
      <span className="drop-shadow-sm">{meta.label[0]}</span>
    </div>
  )
}

export function ScreenShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col overflow-y-auto px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]",
        "animate-[fadeIn_0.3s_ease]",
        className,
      )}
    >
      {children}
    </div>
  )
}
