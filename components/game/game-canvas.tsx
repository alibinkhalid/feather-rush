"use client"

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react"
import { GameEngine } from "@/lib/game/engine"
import { getAudio } from "@/lib/game/audio"
import type { HudState, LevelConfig, RunStats } from "@/lib/game/types"

export interface GameCanvasHandle {
  pause: () => void
  resume: () => void
  restart: () => void
}

export const GameCanvas = forwardRef<
  GameCanvasHandle,
  {
    level: LevelConfig
    reducedMotion: boolean
    onHud: (hud: HudState) => void
    onDeath: (stats: RunStats) => void
    onComplete: (stats: RunStats) => void
    onEvent?: (event: "coin" | "powerup" | "hit" | "tutorial-next") => void
    onFirstInput?: () => void
  }
>(function GameCanvas({ level, reducedMotion, onHud, onDeath, onComplete, onEvent, onFirstInput }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Keep latest callbacks without re-instantiating the engine.
  const cbRef = useRef({ onHud, onDeath, onComplete, onEvent, onFirstInput })
  cbRef.current = { onHud, onDeath, onComplete, onEvent, onFirstInput }

  useImperativeHandle(ref, () => ({
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    restart: () => engineRef.current?.start(),
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const engine = new GameEngine(
      canvas,
      level,
      {
        onHud: (h) => cbRef.current.onHud(h),
        onDeath: (s) => cbRef.current.onDeath(s),
        onComplete: (s) => cbRef.current.onComplete(s),
        onEvent: (e) => cbRef.current.onEvent?.(e),
      },
      getAudio(),
      reducedMotion,
    )
    engineRef.current = engine

    const applySize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      engine.resize(rect.width, rect.height, dpr)
    }
    applySize()

    const ro = new ResizeObserver(applySize)
    ro.observe(wrap)

    engine.start()

    let firstInputFired = false
    const doFlap = () => {
      getAudio().resume()
      if (!firstInputFired) {
        firstInputFired = true
        cbRef.current.onFirstInput?.()
      }
      engine.flap()
    }

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      doFlap()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault()
        doFlap()
      }
    }
    const onVisibility = () => {
      if (document.hidden) engine.pause()
    }

    canvas.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("keydown", onKeyDown)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      ro.disconnect()
      canvas.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("visibilitychange", onVisibility)
      engine.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id])

  return (
    <div ref={wrapRef} className="absolute inset-0 touch-none">
      <canvas ref={canvasRef} className="h-full w-full touch-none" aria-label={`Playing ${level.name}`} />
    </div>
  )
})
