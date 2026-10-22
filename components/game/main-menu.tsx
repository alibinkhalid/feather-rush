"use client"

import { Coins, Trophy, Play, Grid3x3, HelpCircle, Settings, Award } from "lucide-react"
import { GameButton } from "./ui"
import type { SaveData } from "@/lib/game/types"
import { LEVELS } from "@/lib/game/levels"

export function MainMenu({
  save,
  onPlay,
  onLevels,
  onHowTo,
  onAchievements,
  onSettings,
}: {
  save: SaveData
  onPlay: () => void
  onLevels: () => void
  onHowTo: () => void
  onAchievements: () => void
  onSettings: () => void
}) {
  const highestUnlocked = LEVELS.reduce((max, l) => (save.levels[l.id]?.unlocked ? Math.max(max, l.id) : max), 1)

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-emerald-200 px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      {/* animated clouds */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[14%] h-16 w-28 rounded-full bg-white/70 blur-md animate-[floatX_18s_linear_infinite]" />
        <div className="absolute left-[55%] top-[26%] h-12 w-24 rounded-full bg-white/60 blur-md animate-[floatX_24s_linear_infinite]" />
        <div className="absolute left-[30%] top-[40%] h-10 w-20 rounded-full bg-white/50 blur-md animate-[floatX_30s_linear_infinite]" />
      </div>

      {/* stats bar */}
      <div className="z-10 flex w-full items-center justify-between text-amber-950">
        <Stat icon={<Coins className="h-4 w-4" />} label={`${save.totalCoins}`} />
        <Stat icon={<Trophy className="h-4 w-4" />} label={`${save.bestOverall}`} />
        <Stat icon={<Grid3x3 className="h-4 w-4" />} label={`Lv ${highestUnlocked}`} />
      </div>

      {/* title + mascot */}
      <div className="z-10 flex flex-col items-center">
        <BirdMascot />
        <h1 className="mt-2 text-center text-6xl font-black leading-none tracking-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.2)]">
          Feather
          <br />
          <span className="text-amber-300">Rush</span>
        </h1>
        <p className="mt-2 text-center text-sm font-semibold text-amber-950/70">Flap. Dodge. Soar through 10 worlds.</p>
      </div>

      {/* buttons */}
      <div className="z-10 flex w-full max-w-xs flex-col gap-3">
        <GameButton variant="primary" className="w-full" onClick={onPlay}>
          <span className="flex items-center justify-center gap-2">
            <Play className="h-5 w-5 fill-current" /> Play
          </span>
        </GameButton>
        <div className="grid grid-cols-2 gap-3">
          <GameButton variant="secondary" onClick={onLevels}>
            <span className="flex items-center justify-center gap-2 text-base">
              <Grid3x3 className="h-4 w-4" /> Levels
            </span>
          </GameButton>
          <GameButton variant="secondary" onClick={onAchievements}>
            <span className="flex items-center justify-center gap-2 text-base">
              <Award className="h-4 w-4" /> Awards
            </span>
          </GameButton>
          <GameButton variant="ghost" onClick={onHowTo}>
            <span className="flex items-center justify-center gap-2 text-base">
              <HelpCircle className="h-4 w-4" /> How to
            </span>
          </GameButton>
          <GameButton variant="ghost" onClick={onSettings}>
            <span className="flex items-center justify-center gap-2 text-base">
              <Settings className="h-4 w-4" /> Settings
            </span>
          </GameButton>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/50 px-3 py-1.5 text-sm font-bold backdrop-blur">
      {icon}
      {label}
    </div>
  )
}

function BirdMascot() {
  return (
    <div className="relative h-24 w-24 animate-[bob_2.4s_ease-in-out_infinite]">
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-lg">
        <ellipse cx="50" cy="52" rx="34" ry="30" fill="#ffd23f" stroke="#e08a1e" strokeWidth="3" />
        <ellipse cx="46" cy="62" rx="20" ry="16" fill="#fff1b8" />
        <ellipse cx="40" cy="54" rx="20" ry="12" fill="#f5a623" stroke="#e08a1e" strokeWidth="2" transform="rotate(-18 40 54)" />
        <polygon points="80,48 96,52 80,60" fill="#ff8a2f" />
        <circle cx="64" cy="40" r="10" fill="#fff" />
        <circle cx="67" cy="40" r="5" fill="#1a1a1a" />
        <circle cx="69" cy="38" r="1.6" fill="#fff" />
      </svg>
    </div>
  )
}
