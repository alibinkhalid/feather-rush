"use client"

import { Trophy } from "lucide-react"

export function AchievementToast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[max(4.5rem,env(safe-area-inset-top))] z-50 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-300/50 bg-slate-900/95 px-4 py-3 shadow-2xl animate-[slideDown_0.35s_ease]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Achievement</p>
          <p className="text-sm font-black text-white">{message}</p>
        </div>
      </div>
    </div>
  )
}
