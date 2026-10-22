"use client"

import { useEffect, useRef, useState } from "react"
import { GameCanvas, type GameCanvasHandle } from "./game-canvas"
import { Hud } from "./hud"
import { GameOverOverlay, LevelCompleteOverlay, PauseOverlay } from "./overlays"
import type { GameSettings, HudState, LevelConfig, RunStats } from "@/lib/game/types"
import { vibrate } from "@/lib/game/haptics"

type Phase = "intro" | "playing" | "paused" | "dead" | "complete"

const INITIAL_HUD: HudState = {
  score: 0,
  distance: 0,
  coins: 0,
  progress: 0,
  activePowerUp: null,
  powerUpTimeLeft: 0,
  shielded: false,
}

const TUTORIAL_STEPS = ["Tap to fly", "Avoid the obstacles", "Grab the coins!"]

export function GameplayScreen({
  level,
  settings,
  levelBest,
  hasNext,
  onRunComplete,
  onRunDeath,
  onEvent,
  onExitToLevels,
  onExitToMenu,
  onOpenSettings,
  onNextLevel,
}: {
  level: LevelConfig
  settings: GameSettings
  levelBest: number
  hasNext: boolean
  onRunComplete: (stats: RunStats) => void
  onRunDeath: (stats: RunStats) => void
  onEvent: (event: "coin" | "powerup" | "hit" | "tutorial-next", stats?: RunStats) => void
  onExitToLevels: () => void
  onExitToMenu: () => void
  onOpenSettings: () => void
  onNextLevel: () => void
}) {
  const canvasRef = useRef<GameCanvasHandle>(null)
  const [hud, setHud] = useState<HudState>(INITIAL_HUD)
  const [phase, setPhase] = useState<Phase>("intro")
  const [stats, setStats] = useState<RunStats | null>(null)
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const bestAtEntry = useRef(levelBest)

  // Reset per-level session state when the level changes.
  useEffect(() => {
    bestAtEntry.current = levelBest
    setAttemptsLeft(3)
    setPhase("intro")
    setHud(INITIAL_HUD)
    setStats(null)
    setTutorialStep(0)
    setShowIntro(true)
    const t = window.setTimeout(() => setShowIntro(false), 1500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id])

  const handlePause = () => {
    canvasRef.current?.pause()
    setPhase("paused")
  }

  const handleResume = () => {
    setPhase("playing")
    canvasRef.current?.resume()
  }

  const handleRestartRun = () => {
    setHud(INITIAL_HUD)
    setStats(null)
    setPhase("playing")
    setTutorialStep(0)
    canvasRef.current?.restart()
  }

  const handleRetry = () => {
    if (attemptsLeft <= 0) setAttemptsLeft(3)
    handleRestartRun()
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <GameCanvas
        ref={canvasRef}
        level={level}
        reducedMotion={settings.reducedMotion}
        onHud={setHud}
        onFirstInput={() => {
          if (phase === "intro") setPhase("playing")
        }}
        onEvent={(e) => {
          if (e === "coin") vibrate("coin", settings.vibration)
          if (e === "powerup") vibrate("powerup", settings.vibration)
          if (e === "hit") vibrate("hit", settings.vibration)
          if (e === "tutorial-next" && level.tutorial) {
            setTutorialStep((s) => Math.min(TUTORIAL_STEPS.length - 1, s + 1))
          }
          onEvent(e)
        }}
        onDeath={(s) => {
          setStats(s)
          setAttemptsLeft((a) => Math.max(0, a - 1))
          setPhase("dead")
          onRunDeath(s)
        }}
        onComplete={(s) => {
          setStats(s)
          setPhase("complete")
          vibrate("success", settings.vibration)
          onRunComplete(s)
        }}
      />

      {phase !== "complete" && (
        <Hud hud={hud} levelId={level.id} levelName={level.name} attempts={attemptsLeft} onPause={handlePause} />
      )}

      {/* Level intro banner */}
      {showIntro && phase === "intro" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="rounded-3xl bg-black/45 px-8 py-5 text-center backdrop-blur animate-[popIn_0.4s_ease]">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Level {level.id}</p>
            <p className="text-3xl font-black text-white">{level.name}</p>
            <p className="mt-1 text-sm font-semibold text-white/70">{level.tagline}</p>
          </div>
        </div>
      )}

      {/* Tap-to-start hint */}
      {phase === "intro" && !showIntro && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="animate-[bob_1.4s_ease-in-out_infinite] rounded-full bg-white/15 px-6 py-3 text-lg font-black text-white backdrop-blur">
            Tap to start
          </div>
        </div>
      )}

      {/* Tutorial hints (level 1) */}
      {level.tutorial && (phase === "playing" || phase === "intro") && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-20 flex justify-center">
          <div className="rounded-full bg-amber-400/90 px-5 py-2 text-sm font-black text-amber-950 shadow-lg animate-[fadeIn_0.4s_ease]">
            {TUTORIAL_STEPS[tutorialStep]}
          </div>
        </div>
      )}

      {phase === "paused" && (
        <PauseOverlay
          onResume={handleResume}
          onRestart={handleRestartRun}
          onLevelSelect={onExitToLevels}
          onSettings={onOpenSettings}
        />
      )}

      {phase === "dead" && stats && (
        <GameOverOverlay
          stats={stats}
          bestScore={Math.max(bestAtEntry.current, stats.score)}
          attemptsLeft={attemptsLeft}
          onRetry={handleRetry}
          onLevelSelect={onExitToLevels}
          onMenu={onExitToMenu}
        />
      )}

      {phase === "complete" && stats && (
        <LevelCompleteOverlay
          stats={stats}
          bestScore={bestAtEntry.current}
          isNewBest={stats.score > bestAtEntry.current}
          hasNext={hasNext}
          onNext={onNextLevel}
          onReplay={handleRestartRun}
          onLevelSelect={onExitToLevels}
        />
      )}
    </div>
  )
}
