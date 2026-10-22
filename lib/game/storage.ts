import type { GameSettings, LevelProgress, MedalTier, SaveData } from "./types"
import { LEVELS } from "./levels"

const STORAGE_KEY = "feather-rush-save-v1"

const MEDAL_RANK: Record<MedalTier, number> = {
  none: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
}

export function defaultSave(): SaveData {
  const levels: Record<number, LevelProgress> = {}
  for (const lvl of LEVELS) {
    levels[lvl.id] = {
      unlocked: lvl.id === 1,
      bestScore: 0,
      bestDistance: 0,
      medal: "none",
      attempts: 0,
      completed: false,
    }
  }
  return {
    levels,
    totalCoins: 0,
    bestOverall: 0,
    achievements: [],
    settings: { sound: true, music: true, vibration: true, reducedMotion: false },
  }
}

export function loadSave(): SaveData {
  if (typeof window === "undefined") return defaultSave()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSave()
    const parsed = JSON.parse(raw) as SaveData
    // Merge with defaults so newly added levels/settings are present.
    const base = defaultSave()
    const merged: SaveData = {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      levels: { ...base.levels },
      achievements: parsed.achievements ?? [],
    }
    for (const lvl of LEVELS) {
      merged.levels[lvl.id] = { ...base.levels[lvl.id], ...(parsed.levels?.[lvl.id] ?? {}) }
    }
    return merged
  } catch {
    return defaultSave()
  }
}

export function persistSave(data: SaveData) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

export function betterMedal(a: MedalTier, b: MedalTier): MedalTier {
  return MEDAL_RANK[a] >= MEDAL_RANK[b] ? a : b
}

export function medalRank(m: MedalTier): number {
  return MEDAL_RANK[m]
}

export function isSettingsEqual(a: GameSettings, b: GameSettings): boolean {
  return a.sound === b.sound && a.music === b.music && a.vibration === b.vibration && a.reducedMotion === b.reducedMotion
}
