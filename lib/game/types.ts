// Shared type definitions for the Feather Rush game.

export type ObstacleShape = "pipe" | "branch" | "icicle" | "rock" | "asteroid" | "neon"

export type PowerUpType = "shield" | "slowmo" | "magnet" | "boost" | "life"

export type ThemeKey =
  | "day"
  | "sunset"
  | "night"
  | "storm"
  | "jungle"
  | "ice"
  | "volcano"
  | "space"
  | "cyber"
  | "final"

export interface ThemePalette {
  key: ThemeKey
  skyTop: string
  skyBottom: string
  hill: string
  hillBack: string
  accent: string
  obstacle: string
  obstacleEdge: string
  ground: string
  particle: string
  text: string
}

export interface LevelMechanics {
  moving?: boolean
  movingProbability?: number
  movingAmplitude?: number // fraction of height
  movingSpeed?: number
  wind?: number // vertical drift acceleration px/s^2 magnitude
  reducedGravity?: boolean
  fireballs?: boolean
  fireballInterval?: number // seconds
  boss?: boolean
}

export interface LevelConfig {
  id: number
  name: string
  tagline: string
  theme: ThemePalette
  gravity: number // px/s^2
  flap: number // px/s (negative applied)
  speed: number // px/s horizontal scroll
  gapFraction: number // gap size as fraction of playfield height
  spawnDistance: number // px between obstacles
  obstacleShape: ObstacleShape
  targetDistance: number // meters required to complete
  targetScore: number // score required for gold medal
  coinChance: number // 0..1 chance a gap spawns coins
  powerUps: PowerUpType[] // pool available this level
  powerUpChance: number // chance per obstacle to spawn a power-up
  mechanics: LevelMechanics
  tutorial?: boolean
}

export type MedalTier = "none" | "bronze" | "silver" | "gold" | "platinum"

export interface LevelProgress {
  unlocked: boolean
  bestScore: number
  bestDistance: number
  medal: MedalTier
  attempts: number
  completed: boolean
}

export interface GameSettings {
  sound: boolean
  music: boolean
  vibration: boolean
  reducedMotion: boolean
}

export interface SaveData {
  levels: Record<number, LevelProgress>
  totalCoins: number
  bestOverall: number
  achievements: string[]
  settings: GameSettings
}

export interface RunStats {
  score: number
  distance: number // meters
  coins: number
  coinsAvailable: number
  saves: number // collisions absorbed by shield
  medal: MedalTier
  targetScore: number
  targetDistance: number
  timeMs: number
}

export interface HudState {
  score: number
  distance: number
  coins: number
  progress: number // 0..1 toward target distance
  activePowerUp: PowerUpType | null
  powerUpTimeLeft: number
  shielded: boolean
}
