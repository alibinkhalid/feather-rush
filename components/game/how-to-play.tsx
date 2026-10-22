"use client"

import { ArrowLeft, MousePointerClick, Coins, Shield, Timer, Magnet, Zap, Heart } from "lucide-react"
import { IconButton } from "./ui"

const POWERS = [
  { icon: <Shield className="h-5 w-5" />, name: "Shield", desc: "Absorbs one hit.", color: "#3fa9f5" },
  { icon: <Timer className="h-5 w-5" />, name: "Slow Motion", desc: "Slows the world briefly.", color: "#9b59f5" },
  { icon: <Magnet className="h-5 w-5" />, name: "Magnet", desc: "Pulls in nearby coins.", color: "#f55d9b" },
  { icon: <Zap className="h-5 w-5" />, name: "Boost", desc: "Stronger, faster flaps.", color: "#f5a623" },
  { icon: <Heart className="h-5 w-5" />, name: "Extra Life", desc: "Grants an extra attempt.", color: "#4bd964" },
]

export function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-teal-500 to-teal-800">
      <header className="flex items-center gap-3 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <IconButton aria-label="Back to menu" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <h2 className="text-2xl font-black text-white">How to Play</h2>
      </header>

      <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950">
              <MousePointerClick className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-white">Tap, click, or press Space</p>
              <p className="text-sm text-white/70">Each input flaps your bird upward. Gravity pulls it down.</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-400 text-white">
              <ArrowLeft className="h-6 w-6 rotate-90" />
            </div>
            <div>
              <p className="font-bold text-white">Fly through the gaps</p>
              <p className="text-sm text-white/70">Avoid obstacles, the ceiling, and the ground. Reach the target distance to win.</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-amber-950">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-white">Collect coins</p>
              <p className="text-sm text-white/70">Coins boost your score and unlock better medals. You have 3 attempts per level.</p>
            </div>
          </div>
        </Card>

        <div>
          <h3 className="mb-2 px-1 text-sm font-black uppercase tracking-wider text-white/60">Power-ups</h3>
          <div className="flex flex-col gap-2">
            {POWERS.map((p) => (
              <div key={p.name} className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: p.color }}>
                  {p.icon}
                </div>
                <div>
                  <p className="font-bold text-white">{p.name}</p>
                  <p className="text-sm text-white/70">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 px-1 text-sm font-black uppercase tracking-wider text-white/60">Medals</h3>
          <ul className="flex flex-col gap-1.5 rounded-xl bg-white/10 p-4 text-sm text-white/80 backdrop-blur">
            <li><span className="font-bold text-amber-300">Bronze</span> — complete the level.</li>
            <li><span className="font-bold text-slate-200">Silver</span> — complete without taking a hit.</li>
            <li><span className="font-bold text-yellow-300">Gold</span> — beat the target score.</li>
            <li><span className="font-bold text-cyan-200">Platinum</span> — flawless run, nearly every coin.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">{children}</div>
}
