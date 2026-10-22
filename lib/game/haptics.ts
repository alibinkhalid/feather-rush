// Thin wrapper over the Vibration API, gated by the user's setting.

type HapticKind = "flap" | "coin" | "hit" | "success" | "powerup"

const PATTERNS: Record<HapticKind, number | number[]> = {
  flap: 8,
  coin: 12,
  powerup: [10, 30, 10],
  hit: [40, 30, 60],
  success: [20, 40, 20, 40, 40],
}

export function vibrate(kind: HapticKind, enabled: boolean) {
  if (!enabled) return
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return
  try {
    navigator.vibrate(PATTERNS[kind])
  } catch {
    // ignore
  }
}
