"use client"

import { useState } from "react"
import { ArrowLeft, Volume2, Music, Smartphone, Eye, Trash2 } from "lucide-react"
import { IconButton, GameButton } from "./ui"
import type { GameSettings } from "@/lib/game/types"

export function SettingsScreen({
  settings,
  onBack,
  onChange,
  onReset,
}: {
  settings: GameSettings
  onBack: () => void
  onChange: (next: GameSettings) => void
  onReset: () => void
}) {
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-slate-600 to-slate-900">
      <header className="flex items-center gap-3 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <IconButton aria-label="Back to menu" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <h2 className="text-2xl font-black text-white">Settings</h2>
      </header>

      <div className="flex flex-col gap-3 overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <Toggle
          icon={<Volume2 className="h-5 w-5" />}
          label="Sound Effects"
          on={settings.sound}
          onToggle={() => onChange({ ...settings, sound: !settings.sound })}
        />
        <Toggle
          icon={<Music className="h-5 w-5" />}
          label="Music"
          on={settings.music}
          onToggle={() => onChange({ ...settings, music: !settings.music })}
        />
        <Toggle
          icon={<Smartphone className="h-5 w-5" />}
          label="Vibration"
          on={settings.vibration}
          onToggle={() => onChange({ ...settings, vibration: !settings.vibration })}
        />
        <Toggle
          icon={<Eye className="h-5 w-5" />}
          label="Reduced Motion"
          on={settings.reducedMotion}
          onToggle={() => onChange({ ...settings, reducedMotion: !settings.reducedMotion })}
        />

        <div className="mt-4 rounded-2xl border-2 border-rose-500/30 bg-rose-500/10 p-4">
          <p className="mb-1 font-bold text-white">Reset Progress</p>
          <p className="mb-3 text-sm text-white/60">Clears all unlocked levels, scores, medals, coins, and achievements.</p>
          <GameButton variant="danger" className="w-full" onClick={() => setConfirmReset(true)}>
            <span className="flex items-center justify-center gap-2 text-base">
              <Trash2 className="h-4 w-4" /> Reset all progress
            </span>
          </GameButton>
        </div>

        <p className="mt-2 text-center text-xs text-white/40">Feather Rush · a original arcade flyer</p>
      </div>

      {confirmReset && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-3xl bg-slate-800 p-6 text-center shadow-2xl animate-[popIn_0.25s_ease]">
            <h3 className="text-xl font-black text-white">Are you sure?</h3>
            <p className="mt-2 text-sm text-white/70">This will erase all progress and cannot be undone.</p>
            <div className="mt-5 flex flex-col gap-2">
              <GameButton
                variant="danger"
                className="w-full"
                onClick={() => {
                  onReset()
                  setConfirmReset(false)
                }}
              >
                Yes, reset everything
              </GameButton>
              <GameButton variant="ghost" className="w-full" onClick={() => setConfirmReset(false)}>
                Cancel
              </GameButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({
  icon,
  label,
  on,
  onToggle,
}: {
  icon: React.ReactNode
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className="flex items-center justify-between rounded-2xl bg-white/10 p-4 text-left backdrop-blur transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
    >
      <span className="flex items-center gap-3 font-bold text-white">
        <span className="text-white/80">{icon}</span>
        {label}
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-emerald-400" : "bg-white/20"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  )
}
