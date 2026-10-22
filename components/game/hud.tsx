"use client"

import { Pause, Coins, Shield, Timer, Magnet, Zap } from "lucide-react"
import type { HudState, PowerUpType } from "@/lib/game/types"

const POWER_ICON: Record<PowerUpType, React.ReactNode> = {
  shield: <Shield className="h-4 w-4" />,
  slowmo: <Timer className="h-4 w-4" />,
  magnet: <Magnet className="h-4 w-4" />,
  boost: <Zap className="h-4 w-4" />,
  life: null,
}

export function Hud({
  hud,
  levelId,
  levelName,
  attempts,
  onPause,
}: {
  hud: HudState
  levelId: number
  levelName: string
  attempts: number
  onPause: () => void
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-start justify-between gap-2">
        {/* level badge */}
        <div className="rounded-xl bg-black/35 px-3 py-1.5 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Level {levelId}</p>
          <p className="max-w-[8rem] truncate text-sm font-black text-white">{levelName}</p>
        </div>

        {/* score */}
        <div className="rounded-xl bg-black/35 px-4 py-1.5 text-center backdrop-blur">
          <p className="text-2xl font-black leading-none text-white tabular-nums">{hud.score}</p>
          <p className="flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-300">
            <Coins className="h-3 w-3" /> {hud.coins}
          </p>
        </div>

        {/* pause + lives */}
        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            aria-label="Pause"
            onClick={onPause}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl bg-black/35 text-white backdrop-blur transition active:scale-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            <Pause className="h-5 w-5 fill-current" />
          </button>
          <div className="flex gap-1 rounded-full bg-black/35 px-2 py-1 backdrop-blur">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full ${i < attempts ? "bg-rose-400" : "bg-white/20"}`}
                aria-hidden
              />
            ))}
            <span className="sr-only">{attempts} attempts remaining</span>
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div className="flex items-center gap-2">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/35">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-400 transition-[width] duration-150"
            style={{ width: `${Math.round(hud.progress * 100)}%` }}
          />
        </div>
        <span className="text-[11px] font-bold text-white tabular-nums drop-shadow">{hud.distance}m</span>
      </div>

      {/* active power-up */}
      {hud.activePowerUp && hud.activePowerUp !== "life" && (
        <div className="flex justify-center">
          <div className="flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-sm font-bold text-white backdrop-blur">
            {POWER_ICON[hud.activePowerUp]}
            <span className="tabular-nums">{hud.powerUpTimeLeft.toFixed(1)}s</span>
          </div>
        </div>
      )}
    </div>
  )
}
