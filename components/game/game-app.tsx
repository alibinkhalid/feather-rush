"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MainMenu } from "./main-menu"
import { LevelSelect } from "./level-select"
import { HowToPlay } from "./how-to-play"
import { SettingsScreen } from "./settings-screen"
import { AchievementsScreen } from "./achievements-screen"
import { GameplayScreen } from "./gameplay-screen"
import { AchievementToast } from "./achievement-toast"
import { getLevel, LEVELS } from "@/lib/game/levels"
import { betterMedal, defaultSave, loadSave, persistSave } from "@/lib/game/storage"
import { getAudio } from "@/lib/game/audio"
import type { GameSettings, RunStats, SaveData } from "@/lib/game/types"

type Screen = "loading" | "menu" | "levels" | "how" | "settings" | "achievements" | "game"

export function GameApp() {
  const [save, setSave] = useState<SaveData>(defaultSave)
  const [screen, setScreen] = useState<Screen>("loading")
  const [prevScreen, setPrevScreen] = useState<Screen>("menu")
  const [currentLevel, setCurrentLevel] = useState(1)
  const [toast, setToast] = useState<string | null>(null)
  const hydrated = useRef(false)

  // Load save + settings once on mount.
  useEffect(() => {
    const loaded = loadSave()
    setSave(loaded)
    hydrated.current = true
    const audio = getAudio()
    audio.setSound(loaded.settings.sound)
    audio.setMusic(loaded.settings.music)
    const t = window.setTimeout(() => setScreen("menu"), 1100)
    return () => window.clearTimeout(t)
  }, [])

  // Persist whenever save changes (after hydration).
  useEffect(() => {
    if (hydrated.current) persistSave(save)
  }, [save])

  // Background music follows screen + setting.
  useEffect(() => {
    const audio = getAudio()
    if (save.settings.music && screen !== "loading") {
      audio.startMusic()
    } else {
      audio.stopMusic()
    }
  }, [screen, save.settings.music])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const unlockAchievement = useCallback(
    (draft: SaveData, id: string, title: string) => {
      if (!draft.achievements.includes(id)) {
        draft.achievements.push(id)
        showToast(title)
      }
    },
    [showToast],
  )

  const evaluateAchievements = useCallback(
    (draft: SaveData, lastStats?: RunStats) => {
      const completedCount = LEVELS.filter((l) => draft.levels[l.id]?.completed).length
      if (draft.levels[1]?.completed) unlockAchievement(draft, "first_flight", "First Flight unlocked!")
      if (completedCount >= 5) unlockAchievement(draft, "sky_master", "Sky Master unlocked!")
      if (completedCount >= LEVELS.length) unlockAchievement(draft, "ultimate_flyer", "Ultimate Flyer unlocked!")
      if (draft.totalCoins >= 100) unlockAchievement(draft, "coin_collector", "Coin Collector unlocked!")
      if (lastStats) {
        if (lastStats.saves === 0 && lastStats.distance >= getLevel(currentLevel).targetDistance)
          unlockAchievement(draft, "untouchable", "Untouchable unlocked!")
        if (lastStats.distance >= 1000) unlockAchievement(draft, "survivor", "Survivor unlocked!")
      }
    },
    [currentLevel, unlockAchievement],
  )

  const applyRunEnd = useCallback(
    (stats: RunStats, completed: boolean) => {
      setSave((prev) => {
        const draft: SaveData = {
          ...prev,
          levels: { ...prev.levels },
          achievements: [...prev.achievements],
        }
        const lp = { ...draft.levels[currentLevel] }
        lp.attempts += 1
        lp.bestScore = Math.max(lp.bestScore, stats.score)
        lp.bestDistance = Math.max(lp.bestDistance, stats.distance)
        draft.totalCoins = prev.totalCoins + stats.coins
        draft.bestOverall = Math.max(prev.bestOverall, stats.score)

        if (completed) {
          lp.completed = true
          lp.medal = betterMedal(lp.medal, stats.medal)
          const nextId = currentLevel + 1
          if (draft.levels[nextId]) {
            draft.levels[nextId] = { ...draft.levels[nextId], unlocked: true }
          }
        }
        draft.levels[currentLevel] = lp
        evaluateAchievements(draft, stats)
        return draft
      })
    },
    [currentLevel, evaluateAchievements],
  )

  const goTo = (next: Screen) => {
    setPrevScreen(screen)
    setScreen(next)
  }

  const startLevel = (id: number) => {
    setCurrentLevel(id)
    getAudio().resume()
    goTo("game")
  }

  const currentConfig = getLevel(currentLevel)
  const hasNext = !!save.levels[currentLevel + 1]

  return (
    <div className="relative mx-auto h-[100dvh] w-full max-w-md overflow-hidden bg-slate-900 shadow-2xl">
      {screen === "loading" && <LoadingScreen />}

      {screen === "menu" && (
        <MainMenu
          save={save}
          onPlay={() => startLevel(highestUnlocked(save))}
          onLevels={() => goTo("levels")}
          onHowTo={() => goTo("how")}
          onAchievements={() => goTo("achievements")}
          onSettings={() => goTo("settings")}
        />
      )}

      {screen === "levels" && (
        <LevelSelect save={save} onBack={() => goTo("menu")} onSelect={(id) => startLevel(id)} />
      )}

      {screen === "how" && <HowToPlay onBack={() => goTo("menu")} />}

      {screen === "achievements" && <AchievementsScreen save={save} onBack={() => goTo("menu")} />}

      {screen === "settings" && (
        <SettingsScreen
          settings={save.settings}
          onBack={() => goTo(prevScreen === "game" ? "menu" : prevScreen)}
          onChange={(next: GameSettings) => {
            const audio = getAudio()
            audio.setSound(next.sound)
            audio.setMusic(next.music)
            setSave((prev) => ({ ...prev, settings: next }))
          }}
          onReset={() => {
            const fresh = defaultSave()
            fresh.settings = save.settings
            setSave(fresh)
            showToast("Progress reset")
            goTo("menu")
          }}
        />
      )}

      {screen === "game" && (
        <GameplayScreen
          key={currentLevel}
          level={currentConfig}
          settings={save.settings}
          levelBest={save.levels[currentLevel]?.bestScore ?? 0}
          hasNext={hasNext}
          onRunComplete={(s) => applyRunEnd(s, true)}
          onRunDeath={(s) => applyRunEnd(s, false)}
          onEvent={() => {}}
          onExitToLevels={() => goTo("levels")}
          onExitToMenu={() => goTo("menu")}
          onOpenSettings={() => goTo("settings")}
          onNextLevel={() => {
            if (hasNext) startLevel(currentLevel + 1)
            else goTo("levels")
          }}
        />
      )}

      <AchievementToast message={toast} />
    </div>
  )
}

function highestUnlocked(save: SaveData): number {
  return LEVELS.reduce((max, l) => (save.levels[l.id]?.unlocked ? Math.max(max, l.id) : max), 1)
}

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-sky-400 to-emerald-300">
      <div className="animate-[bob_1.2s_ease-in-out_infinite]">
        <svg viewBox="0 0 100 100" className="h-24 w-24 drop-shadow-lg">
          <ellipse cx="50" cy="52" rx="34" ry="30" fill="#ffd23f" stroke="#e08a1e" strokeWidth="3" />
          <ellipse cx="40" cy="54" rx="20" ry="12" fill="#f5a623" stroke="#e08a1e" strokeWidth="2" transform="rotate(-18 40 54)" />
          <polygon points="80,48 96,52 80,60" fill="#ff8a2f" />
          <circle cx="64" cy="40" r="10" fill="#fff" />
          <circle cx="67" cy="40" r="5" fill="#1a1a1a" />
        </svg>
      </div>
      <h1 className="mt-4 text-4xl font-black text-white drop-shadow">Feather Rush</h1>
      <div className="mt-6 h-2 w-40 overflow-hidden rounded-full bg-white/30">
        <div className="h-full w-full origin-left animate-[loadBar_1s_ease-in-out] bg-white" />
      </div>
    </div>
  )
}
