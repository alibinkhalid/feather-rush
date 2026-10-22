"use client"

import { Play, RotateCcw, Grid3x3, Home, Settings as SettingsIcon, Coins, Clock, Ruler, Target } from "lucide-react"
import { GameButton, Medal } from "./ui"
import type { RunStats } from "@/lib/game/types"

export function PauseOverlay({
  onResume,
  onRestart,
  onLevelSelect,
  onSettings,
}: {
  onResume: () => void
  onRestart: () => void
  onLevelSelect: () => void
  onSettings: () => void
}) {
  return (
    <Backdrop>
      <Panel>
        <h2 className="text-3xl font-black text-white">Paused</h2>
        <div className="mt-6 flex flex-col gap-3">
          <GameButton variant="primary" className="w-full" onClick={onResume}>
            <span className="flex items-center justify-center gap-2">
              <Play className="h-5 w-5 fill-current" /> Resume
            </span>
          </GameButton>
          <GameButton variant="secondary" className="w-full" onClick={onRestart}>
            <span className="flex items-center justify-center gap-2">
              <RotateCcw className="h-4 w-4" /> Restart
            </span>
          </GameButton>
          <div className="grid grid-cols-2 gap-3">
            <GameButton variant="ghost" onClick={onLevelSelect}>
              <span className="flex items-center justify-center gap-2 text-base">
                <Grid3x3 className="h-4 w-4" /> Levels
              </span>
            </GameButton>
            <GameButton variant="ghost" onClick={onSettings}>
              <span className="flex items-center justify-center gap-2 text-base">
                <SettingsIcon className="h-4 w-4" /> Settings
              </span>
            </GameButton>
          </div>
        </div>
      </Panel>
    </Backdrop>
  )
}

export function GameOverOverlay({
  stats,
  bestScore,
  attemptsLeft,
  onRetry,
  onLevelSelect,
  onMenu,
}: {
  stats: RunStats
  bestScore: number
  attemptsLeft: number
  onRetry: () => void
  onLevelSelect: () => void
  onMenu: () => void
}) {
  return (
    <Backdrop>
      <Panel>
        <h2 className="text-4xl font-black text-rose-400 drop-shadow">Game Over</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatBox icon={<Target className="h-4 w-4" />} label="Score" value={stats.score} />
          <StatBox icon={<Target className="h-4 w-4" />} label="Best" value={bestScore} />
          <StatBox icon={<Coins className="h-4 w-4" />} label="Coins" value={stats.coins} />
          <StatBox icon={<Ruler className="h-4 w-4" />} label="Distance" value={`${stats.distance}m`} />
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-3.5 w-3.5 rounded-full ${i < attemptsLeft ? "bg-rose-400" : "bg-white/20"}`} />
          ))}
          <span className="ml-2 text-sm font-semibold text-white/70">
            {attemptsLeft > 0 ? `${attemptsLeft} attempts left` : "No attempts left"}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <GameButton variant="primary" className="w-full" onClick={onRetry}>
            <span className="flex items-center justify-center gap-2">
              <RotateCcw className="h-5 w-5" /> {attemptsLeft > 0 ? "Try Again" : "Restart Level"}
            </span>
          </GameButton>
          <div className="grid grid-cols-2 gap-3">
            <GameButton variant="ghost" onClick={onLevelSelect}>
              <span className="flex items-center justify-center gap-2 text-base">
                <Grid3x3 className="h-4 w-4" /> Levels
              </span>
            </GameButton>
            <GameButton variant="ghost" onClick={onMenu}>
              <span className="flex items-center justify-center gap-2 text-base">
                <Home className="h-4 w-4" /> Menu
              </span>
            </GameButton>
          </div>
        </div>
      </Panel>
    </Backdrop>
  )
}

export function LevelCompleteOverlay({
  stats,
  bestScore,
  isNewBest,
  hasNext,
  onNext,
  onReplay,
  onLevelSelect,
}: {
  stats: RunStats
  bestScore: number
  isNewBest: boolean
  hasNext: boolean
  onNext: () => void
  onReplay: () => void
  onLevelSelect: () => void
}) {
  const seconds = (stats.timeMs / 1000).toFixed(1)
  return (
    <Backdrop>
      <Panel>
        <div className="flex flex-col items-center">
          <div className="animate-[popIn_0.4s_ease]">
            <Medal tier={stats.medal} size={76} />
          </div>
          <h2 className="mt-3 text-3xl font-black text-emerald-300 drop-shadow">Level Complete!</h2>
          {isNewBest && <p className="mt-1 text-sm font-bold text-amber-300">New personal best!</p>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatBox icon={<Target className="h-4 w-4" />} label="Score" value={stats.score} />
          <StatBox icon={<Target className="h-4 w-4" />} label="Best" value={Math.max(bestScore, stats.score)} />
          <StatBox icon={<Coins className="h-4 w-4" />} label="Coins" value={`${stats.coins}/${stats.coinsAvailable}`} />
          <StatBox icon={<Ruler className="h-4 w-4" />} label="Distance" value={`${stats.distance}m`} />
          <StatBox icon={<Clock className="h-4 w-4" />} label="Time" value={`${seconds}s`} />
          <StatBox icon={<Target className="h-4 w-4" />} label="Hits taken" value={stats.saves} />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {hasNext ? (
            <GameButton variant="primary" className="w-full" onClick={onNext}>
              <span className="flex items-center justify-center gap-2">
                <Play className="h-5 w-5 fill-current" /> Next Level
              </span>
            </GameButton>
          ) : (
            <div className="rounded-2xl bg-amber-400/20 p-3 text-center text-sm font-bold text-amber-200 ring-2 ring-amber-300/40">
              You cleared every world. Ultimate Flyer!
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <GameButton variant="secondary" onClick={onReplay}>
              <span className="flex items-center justify-center gap-2 text-base">
                <RotateCcw className="h-4 w-4" /> Replay
              </span>
            </GameButton>
            <GameButton variant="ghost" onClick={onLevelSelect}>
              <span className="flex items-center justify-center gap-2 text-base">
                <Grid3x3 className="h-4 w-4" /> Levels
              </span>
            </GameButton>
          </div>
        </div>
      </Panel>
    </Backdrop>
  )
}

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm animate-[fadeIn_0.25s_ease]">
      {children}
    </div>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-800/95 p-6 text-center shadow-2xl animate-[popIn_0.3s_ease]">
      {children}
    </div>
  )
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/8 px-3 py-2 text-left">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
        {icon} {label}
      </p>
      <p className="text-lg font-black text-white tabular-nums">{value}</p>
    </div>
  )
}
