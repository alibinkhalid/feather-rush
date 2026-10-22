"use client"

import { ArrowLeft, Trophy, Lock } from "lucide-react"
import { IconButton } from "./ui"
import { ACHIEVEMENTS } from "@/lib/game/levels"
import type { SaveData } from "@/lib/game/types"

export function AchievementsScreen({ save, onBack }: { save: SaveData; onBack: () => void }) {
  const unlockedCount = ACHIEVEMENTS.filter((a) => save.achievements.includes(a.id)).length

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-violet-600 to-violet-900">
      <header className="flex items-center gap-3 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <IconButton aria-label="Back to menu" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <h2 className="text-2xl font-black text-white">Achievements</h2>
        <span className="ml-auto rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-white">
          {unlockedCount}/{ACHIEVEMENTS.length}
        </span>
      </header>

      <div className="flex flex-col gap-2.5 overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = save.achievements.includes(a.id)
          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-2xl p-4 backdrop-blur transition ${
                unlocked ? "bg-amber-400/20 ring-2 ring-amber-300/50" : "bg-white/5"
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  unlocked ? "bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950" : "bg-white/10 text-white/40"
                }`}
              >
                {unlocked ? <Trophy className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className={`font-bold ${unlocked ? "text-white" : "text-white/60"}`}>{a.title}</p>
                <p className="text-sm text-white/60">{a.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
