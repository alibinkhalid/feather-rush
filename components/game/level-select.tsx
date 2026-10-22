"use client"

import { ArrowLeft, Lock, Coins } from "lucide-react"
import { IconButton, Medal } from "./ui"
import { LEVELS } from "@/lib/game/levels"
import type { SaveData } from "@/lib/game/types"

export function LevelSelect({
  save,
  onBack,
  onSelect,
}: {
  save: SaveData
  onBack: () => void
  onSelect: (id: number) => void
}) {
  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-indigo-500 to-indigo-800">
      <header className="flex items-center gap-3 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <IconButton aria-label="Back to menu" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <h2 className="text-2xl font-black text-white">Choose a World</h2>
      </header>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {LEVELS.map((lvl) => {
          const prog = save.levels[lvl.id]
          const unlocked = prog?.unlocked
          const t = lvl.theme
          return (
            <button
              key={lvl.id}
              type="button"
              disabled={!unlocked}
              onClick={() => onSelect(lvl.id)}
              className="group relative flex aspect-[3/4] flex-col overflow-hidden rounded-2xl border-2 border-white/20 text-left shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
              style={{ background: `linear-gradient(160deg, ${t.skyTop}, ${t.skyBottom})` }}
            >
              {/* mini scene */}
              <div className="relative flex-1 overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{ background: t.hill }} />
                <div
                  className="absolute bottom-2 left-3 h-10 w-4 rounded-sm"
                  style={{ background: t.obstacle, border: `2px solid ${t.obstacleEdge}` }}
                />
                <div
                  className="absolute bottom-6 right-4 h-8 w-4 rounded-sm"
                  style={{ background: t.obstacle, border: `2px solid ${t.obstacleEdge}` }}
                />
                <div className="absolute right-2 top-2">
                  <Medal tier={prog?.medal ?? "none"} size={28} />
                </div>
                <span className="absolute left-2 top-1 text-3xl font-black text-white/80 drop-shadow">{lvl.id}</span>
              </div>

              {/* label */}
              <div className="bg-black/35 px-2.5 py-2 backdrop-blur-sm">
                <p className="truncate text-sm font-bold text-white">{lvl.name}</p>
                {unlocked ? (
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-white/70">
                    <Coins className="h-3 w-3" /> Best {prog?.bestScore ?? 0}
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-white/70">Complete Lv {lvl.id - 1}</p>
                )}
              </div>

              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
                  <Lock className="h-8 w-8 text-white/80" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
