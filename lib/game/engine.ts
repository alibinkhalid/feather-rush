import type { HudState, LevelConfig, PowerUpType, RunStats } from "./types"
import type { AudioManager } from "./audio"

const METER = 42 // px per meter of distance

interface Obstacle {
  x: number
  gapY: number
  gapCenter: number
  baseCenter: number
  moving: boolean
  amp: number
  phase: number
  speed: number
  width: number
  scored: boolean
  id: number
}

interface Coin {
  x: number
  y: number
  r: number
  collected: boolean
  bob: number
  id: number
}

interface PowerUp {
  x: number
  y: number
  r: number
  type: PowerUpType
  bob: number
  id: number
}

interface Fireball {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  id: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  gravity: number
}

interface BgLayer {
  offset: number
}

export interface EngineCallbacks {
  onHud: (hud: HudState) => void
  onDeath: (stats: RunStats) => void
  onComplete: (stats: RunStats) => void
  onEvent?: (event: "coin" | "powerup" | "hit" | "tutorial-next") => void
}

const POWER_DURATIONS: Record<PowerUpType, number> = {
  shield: 0,
  slowmo: 5,
  magnet: 6,
  boost: 4,
  life: 0,
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private level: LevelConfig
  private cb: EngineCallbacks
  private audio: AudioManager
  private reducedMotion: boolean

  private width = 0
  private height = 0
  private dpr = 1
  private groundH = 0
  private playH = 0

  private rafId: number | null = null
  private lastTime = 0
  private running = false
  private paused = false
  private started = false
  private dead = false
  private finished = false

  // player
  private px = 0
  private py = 0
  private vy = 0
  private rotation = 0
  private radius = 16
  private wingPhase = 0

  private obstacles: Obstacle[] = []
  private coins: Coin[] = []
  private powerups: PowerUp[] = []
  private fireballs: Fireball[] = []
  private particles: Particle[] = []
  private bgLayers: BgLayer[] = [{ offset: 0 }, { offset: 0 }, { offset: 0 }]

  private distancePx = 0
  private nextSpawnX = 0
  private idCounter = 0
  private speedMultiplier = 1
  private windPhase = 0
  private fireballTimer = 0
  private lightningTimer = 0
  private shake = 0

  // run stats
  private coinsCollected = 0
  private coinsAvailable = 0
  private saves = 0
  private startTime = 0
  private score = 0

  // power-up state
  private shield = false
  private activePower: PowerUpType | null = null
  private powerTimer = 0

  // hud throttle
  private lastHud = ""

  // tutorial
  private tutorialStage = 0

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelConfig,
    callbacks: EngineCallbacks,
    audio: AudioManager,
    reducedMotion: boolean,
  ) {
    this.canvas = canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("2D context unavailable")
    this.ctx = ctx
    this.level = level
    this.cb = callbacks
    this.audio = audio
    this.reducedMotion = reducedMotion
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.dpr = dpr
    this.width = cssW
    this.height = cssH
    this.canvas.width = Math.floor(cssW * dpr)
    this.canvas.height = Math.floor(cssH * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.groundH = Math.max(48, cssH * 0.1)
    this.playH = cssH - this.groundH
    this.radius = Math.max(12, Math.min(20, cssH * 0.022))
    this.px = cssW * 0.3
    if (!this.started) {
      this.py = this.playH * 0.45
    }
    if (!this.running) this.renderStaticFrame()
  }

  private reset() {
    this.py = this.playH * 0.45
    this.vy = 0
    this.rotation = 0
    this.obstacles = []
    this.coins = []
    this.powerups = []
    this.fireballs = []
    this.particles = []
    this.distancePx = 0
    this.nextSpawnX = this.width + 80
    this.speedMultiplier = 1
    this.windPhase = 0
    this.fireballTimer = this.level.mechanics.fireballInterval ?? 3
    this.coinsCollected = 0
    this.coinsAvailable = 0
    this.saves = 0
    this.score = 0
    this.shield = false
    this.activePower = null
    this.powerTimer = 0
    this.dead = false
    this.finished = false
    this.shake = 0
    this.tutorialStage = 0
  }

  start() {
    this.reset()
    this.started = false
    this.running = true
    this.paused = false
    this.startTime = performance.now()
    this.lastTime = performance.now()
    this.loop(this.lastTime)
    this.emitHud(true)
  }

  /** Player input. */
  flap() {
    if (!this.running || this.paused || this.dead || this.finished) return
    if (!this.started) {
      this.started = true
      this.startTime = performance.now()
    }
    let power = this.level.flap
    if (this.activePower === "boost") power *= 1.18
    this.vy = -power
    this.wingPhase = 0
    this.audio.play("flap")
    this.spawnParticles(this.px - this.radius, this.py + this.radius * 0.4, 4, this.level.theme.particle, 0.4)
    if (this.tutorialStage === 0 && this.level.tutorial) {
      this.tutorialStage = 1
      this.cb.onEvent?.("tutorial-next")
    }
  }

  pause() {
    if (!this.running || this.dead || this.finished) return
    this.paused = true
  }

  resume() {
    if (!this.running || this.dead || this.finished) return
    this.paused = false
    this.lastTime = performance.now()
    if (this.rafId === null) this.loop(this.lastTime)
  }

  isPaused() {
    return this.paused
  }

  destroy() {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private loop = (t: number) => {
    if (!this.running) return
    this.rafId = requestAnimationFrame(this.loop)
    let dt = (t - this.lastTime) / 1000
    this.lastTime = t
    if (this.paused) {
      return
    }
    // Clamp dt to avoid huge jumps after tab switches.
    if (dt > 0.05) dt = 0.05
    if (dt <= 0) return
    this.update(dt)
    this.render()
  }

  private currentSpeed() {
    // Gradually ramp speed within a level up to +25%.
    const ramp = Math.min(0.25, this.distancePx / (this.level.targetDistance * METER))
    let s = this.level.speed * (1 + ramp) * this.speedMultiplier
    if (this.activePower === "slowmo") s *= 0.55
    return s
  }

  private update(dt: number) {
    const speed = this.currentSpeed()

    // Background parallax
    this.bgLayers[0].offset += speed * 0.15 * dt
    this.bgLayers[1].offset += speed * 0.4 * dt
    this.bgLayers[2].offset += speed * 0.7 * dt

    // Power-up timers
    if (this.activePower && POWER_DURATIONS[this.activePower] > 0) {
      this.powerTimer -= dt
      if (this.powerTimer <= 0) {
        this.activePower = null
        this.powerTimer = 0
      }
    }

    if (!this.started) {
      // Idle bob before first flap.
      this.py = this.playH * 0.45 + Math.sin(performance.now() / 300) * 8
      this.rotation = Math.sin(performance.now() / 300) * 0.08
      this.wingPhase += dt * 10
      this.emitHud()
      return
    }

    // Physics
    let gravity = this.level.gravity
    if (this.level.mechanics.reducedGravity) gravity *= 1
    this.vy += gravity * dt

    // Wind: gentle vertical drift that changes over time.
    if (this.level.mechanics.wind) {
      this.windPhase += dt
      const wind = Math.sin(this.windPhase * 0.8) * this.level.mechanics.wind
      this.vy += wind * dt
    }

    this.py += this.vy * dt
    this.wingPhase += dt * (this.vy < 0 ? 22 : 10)

    // Rotation from velocity.
    const targetRot = Math.max(-0.5, Math.min(1.1, this.vy / 900))
    this.rotation += (targetRot - this.rotation) * Math.min(1, dt * 10)

    // Scroll world
    const move = speed * dt
    this.distancePx += move
    for (const o of this.obstacles) o.x -= move
    for (const c of this.coins) c.x -= move
    for (const p of this.powerups) p.x -= move
    this.nextSpawnX -= move

    // Moving obstacles
    for (const o of this.obstacles) {
      if (o.moving) {
        o.phase += dt * o.speed
        o.gapCenter = o.baseCenter + Math.sin(o.phase) * o.amp
      }
    }

    // Spawn obstacles
    if (this.nextSpawnX <= this.width) {
      this.spawnObstacle()
      this.nextSpawnX += this.level.spawnDistance
    }

    // Fireballs
    if (this.level.mechanics.fireballs) {
      this.fireballTimer -= dt
      if (this.fireballTimer <= 0) {
        this.spawnFireball()
        this.fireballTimer = (this.level.mechanics.fireballInterval ?? 3) * (0.7 + Math.random() * 0.6)
      }
    }
    for (const f of this.fireballs) {
      f.x += f.vx * dt
      f.y += f.vy * dt
    }

    // Lightning flash timer (storm/final)
    if (this.level.theme.key === "storm" || this.level.mechanics.boss) {
      this.lightningTimer -= dt
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 3 + Math.random() * 4
        this.flash = 1
      }
    }
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 3)

    // Magnet: pull nearby coins
    if (this.activePower === "magnet") {
      for (const c of this.coins) {
        if (c.collected) continue
        const dx = this.px - c.x
        const dy = this.py - c.y
        const d = Math.hypot(dx, dy)
        if (d < 180 && d > 1) {
          c.x += (dx / d) * 260 * dt
          c.y += (dy / d) * 260 * dt
        }
      }
    }

    // Coin bob
    for (const c of this.coins) c.bob += dt * 4
    for (const p of this.powerups) p.bob += dt * 3

    // Collisions & collection
    this.handleCoins()
    this.handlePowerups()
    this.handleObstacleCollision()
    this.handleFireballs()

    // Bounds
    if (this.py - this.radius < 0) {
      this.py = this.radius
      this.vy = Math.max(0, this.vy)
    }
    if (this.py + this.radius >= this.playH) {
      this.py = this.playH - this.radius
      this.die()
    }

    // Cleanup off-screen
    this.obstacles = this.obstacles.filter((o) => o.x + o.width > -20)
    this.coins = this.coins.filter((c) => c.x > -40 && !c.collected)
    this.powerups = this.powerups.filter((p) => p.x > -40)
    this.fireballs = this.fireballs.filter((f) => f.x > -60 && f.y > -60 && f.y < this.height + 60)

    // Particles
    this.updateParticles(dt)

    // Score = distance meters + coins*10
    const meters = Math.floor(this.distancePx / METER)
    this.score = meters + this.coinsCollected * 10

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 60)

    // Completion check
    if (!this.finished && meters >= this.level.targetDistance) {
      this.complete()
    }

    this.emitHud()
  }

  private flash = 0

  private spawnObstacle() {
    const gap = this.playH * this.level.gapFraction
    const minCenter = gap / 2 + this.playH * 0.08
    const maxCenter = this.playH - gap / 2 - this.playH * 0.08
    const range = Math.max(20, maxCenter - minCenter)
    const baseCenter = minCenter + Math.random() * range

    const m = this.level.mechanics
    const moving = !!m.moving && Math.random() < (m.movingProbability ?? 0)
    const amp = moving ? this.playH * (m.movingAmplitude ?? 0.08) : 0
    // Clamp amplitude so the moving gap always stays reachable.
    const safeAmp = Math.min(amp, (range / 2) * 0.8)

    const obstacle: Obstacle = {
      x: this.width + 40,
      gapY: gap,
      gapCenter: baseCenter,
      baseCenter,
      moving,
      amp: safeAmp,
      phase: Math.random() * Math.PI * 2,
      speed: m.movingSpeed ?? 1.5,
      width: Math.max(46, this.width * 0.11),
      scored: false,
      id: this.idCounter++,
    }
    this.obstacles.push(obstacle)

    // Coins inside/around the gap.
    if (Math.random() < this.level.coinChance) {
      const count = 1 + Math.floor(Math.random() * 3)
      for (let i = 0; i < count; i++) {
        this.coins.push({
          x: obstacle.x + obstacle.width / 2 + (i - (count - 1) / 2) * 34,
          y: baseCenter,
          r: Math.max(9, this.playH * 0.018),
          collected: false,
          bob: Math.random() * Math.PI * 2,
          id: this.idCounter++,
        })
        this.coinsAvailable++
      }
    }

    // Power-up
    if (this.level.powerUps.length && Math.random() < this.level.powerUpChance) {
      const type = this.level.powerUps[Math.floor(Math.random() * this.level.powerUps.length)]
      this.powerups.push({
        x: obstacle.x + obstacle.width + this.level.spawnDistance * 0.4,
        y: minCenter + Math.random() * range,
        r: Math.max(14, this.playH * 0.026),
        type,
        bob: Math.random() * Math.PI * 2,
        id: this.idCounter++,
      })
    }
  }

  private spawnFireball() {
    const fromTop = Math.random() < 0.5
    this.fireballs.push({
      x: this.width + 30,
      y: fromTop ? this.playH * 0.15 : this.playH * 0.85,
      vx: -this.currentSpeed() * 1.3,
      vy: fromTop ? 60 : -60,
      r: Math.max(10, this.playH * 0.02),
      id: this.idCounter++,
    })
  }

  private handleCoins() {
    for (const c of this.coins) {
      if (c.collected) continue
      const d = Math.hypot(c.x - this.px, c.y - this.py)
      if (d < c.r + this.radius) {
        c.collected = true
        this.coinsCollected++
        this.audio.play("coin")
        this.cb.onEvent?.("coin")
        this.spawnParticles(c.x, c.y, 8, this.level.theme.accent, 0.6)
      }
    }
  }

  private handlePowerups() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i]
      const d = Math.hypot(p.x - this.px, p.y - this.py)
      if (d < p.r + this.radius) {
        this.applyPowerUp(p.type)
        this.powerups.splice(i, 1)
        this.audio.play("powerup")
        this.cb.onEvent?.("powerup")
        this.spawnParticles(p.x, p.y, 14, "#ffffff", 0.8)
      }
    }
  }

  private applyPowerUp(type: PowerUpType) {
    switch (type) {
      case "shield":
        this.shield = true
        break
      case "life":
        // Extra life handled by React layer via stats; grant shield as tangible effect too.
        this.pendingExtraLife = true
        break
      default:
        this.activePower = type
        this.powerTimer = POWER_DURATIONS[type]
    }
  }

  pendingExtraLife = false

  consumeExtraLife(): boolean {
    if (this.pendingExtraLife) {
      this.pendingExtraLife = false
      return true
    }
    return false
  }

  private handleObstacleCollision() {
    for (const o of this.obstacles) {
      const halfGap = o.gapY / 2
      const top = o.gapCenter - halfGap
      const bottom = o.gapCenter + halfGap
      const withinX = this.px + this.radius > o.x && this.px - this.radius < o.x + o.width
      if (withinX) {
        if (this.py - this.radius < top || this.py + this.radius > bottom) {
          this.onImpact(o.x + o.width / 2 < this.px ? this.px : o.x, this.py)
          return
        }
      }
    }
  }

  private handleFireballs() {
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const f = this.fireballs[i]
      const d = Math.hypot(f.x - this.px, f.y - this.py)
      if (d < f.r + this.radius) {
        this.fireballs.splice(i, 1)
        this.onImpact(f.x, f.y)
        return
      }
    }
  }

  private onImpact(x: number, y: number) {
    if (this.shield) {
      this.shield = false
      this.saves++
      this.audio.play("hit")
      this.spawnParticles(x, y, 18, "#7fdfff", 1)
      this.shake = this.reducedMotion ? 0 : 10
      // Nudge player back to a safe center to avoid instant re-collision.
      this.vy = -this.level.flap * 0.6
      return
    }
    this.die(x, y)
  }

  private die(x?: number, y?: number) {
    if (this.dead || this.finished) return
    this.dead = true
    this.running = true // keep rendering death particles briefly
    this.audio.play("hit")
    this.audio.play("gameover")
    this.shake = this.reducedMotion ? 0 : 16
    this.spawnParticles(x ?? this.px, y ?? this.py, 26, this.level.theme.accent, 1.2)
    this.cb.onEvent?.("hit")
    const stats = this.buildStats()
    // Give a short beat for the death effect before notifying.
    window.setTimeout(() => {
      this.running = false
      this.cb.onDeath(stats)
    }, 420)
  }

  private complete() {
    if (this.finished || this.dead) return
    this.finished = true
    this.audio.play("complete")
    if (!this.reducedMotion) {
      for (let i = 0; i < 5; i++) {
        this.spawnParticles(
          this.width * (0.3 + Math.random() * 0.4),
          this.playH * (0.2 + Math.random() * 0.3),
          20,
          i % 2 ? this.level.theme.accent : "#ffffff",
          1.4,
        )
      }
    }
    const stats = this.buildStats()
    window.setTimeout(() => {
      this.running = false
      this.cb.onComplete(stats)
    }, 600)
  }

  private buildStats(): RunStats {
    const distance = Math.floor(this.distancePx / METER)
    const medal = this.computeMedal(distance)
    return {
      score: this.score,
      distance,
      coins: this.coinsCollected,
      coinsAvailable: this.coinsAvailable,
      saves: this.saves,
      medal,
      targetScore: this.level.targetScore,
      targetDistance: this.level.targetDistance,
      timeMs: performance.now() - this.startTime,
    }
  }

  private computeMedal(distance: number): RunStats["medal"] {
    const completed = distance >= this.level.targetDistance
    if (!completed) return "none"
    const collectedRatio = this.coinsAvailable > 0 ? this.coinsCollected / this.coinsAvailable : 1
    if (this.saves === 0 && collectedRatio >= 0.9) return "platinum"
    if (this.score >= this.level.targetScore) return "gold"
    if (this.saves === 0) return "silver"
    return "bronze"
  }

  private spawnParticles(x: number, y: number, count: number, color: string, intensity: number) {
    if (this.reducedMotion) count = Math.min(count, 4)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = (40 + Math.random() * 160) * intensity
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.5,
        size: 2 + Math.random() * 4,
        color,
        gravity: 300,
      })
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life += dt
      p.vy += p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife)
  }

  // ---------- Rendering ----------

  private render() {
    const ctx = this.ctx
    ctx.save()
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake)
    }
    this.drawBackground()
    this.drawObstacles()
    this.drawCoins()
    this.drawPowerups()
    this.drawFireballs()
    this.drawPlayer()
    this.drawParticles()
    this.drawGround()
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.5})`
      ctx.fillRect(-40, -40, this.width + 80, this.height + 80)
    }
    ctx.restore()
  }

  renderStaticFrame() {
    // Draw a single frame when not running (for preview under menus).
    this.drawBackground()
    this.drawGround()
    this.drawPlayer()
  }

  private drawBackground() {
    const ctx = this.ctx
    const t = this.level.theme
    const g = ctx.createLinearGradient(0, 0, 0, this.height)
    g.addColorStop(0, t.skyTop)
    g.addColorStop(1, t.skyBottom)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, this.width, this.height)

    // Stars for dark themes
    if (["night", "space", "cyber", "final"].includes(t.key)) {
      ctx.fillStyle = "rgba(255,255,255,0.8)"
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97.3 + this.bgLayers[0].offset * 0.2) % this.width
        const sy = (i * 53.7) % (this.playH * 0.8)
        const tw = 0.5 + Math.abs(Math.sin(performance.now() / 800 + i)) * 1.5
        ctx.globalAlpha = 0.4 + Math.abs(Math.sin(i)) * 0.6
        ctx.fillRect(this.width - sx, sy, tw, tw)
      }
      ctx.globalAlpha = 1
    }

    // Sun/moon
    if (["day", "sunset", "night", "ice"].includes(t.key)) {
      ctx.beginPath()
      ctx.fillStyle = t.key === "night" ? "#f5f3d0" : t.accent
      ctx.globalAlpha = 0.9
      ctx.arc(this.width * 0.78, this.playH * 0.24, this.playH * 0.07, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // Back hills / buildings layer
    this.drawParallaxLayer(this.bgLayers[1].offset, this.playH * 0.62, t.hillBack, 0.55)
    this.drawParallaxLayer(this.bgLayers[2].offset, this.playH * 0.72, t.hill, 0.7)

    // Rain
    if (t.key === "storm" || (this.level.mechanics.wind && t.key === "ice")) {
      ctx.strokeStyle = t.key === "ice" ? "rgba(255,255,255,0.5)" : "rgba(180,210,255,0.5)"
      ctx.lineWidth = 1.5
      for (let i = 0; i < 60; i++) {
        const rx = (i * 61 + performance.now() * 0.4) % this.width
        const ry = (i * 47 + performance.now() * 0.9) % this.playH
        ctx.beginPath()
        ctx.moveTo(rx, ry)
        ctx.lineTo(rx - 4, ry + 12)
        ctx.stroke()
      }
    }
  }

  private drawParallaxLayer(offset: number, baseY: number, color: string, alpha: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    const key = this.level.theme.key
    const span = 160
    const o = offset % span
    if (key === "cyber" || key === "final") {
      // Buildings
      for (let x = -o; x < this.width + span; x += 70) {
        const h = 60 + (Math.sin(x * 0.7) + 1) * 70
        ctx.fillRect(x, baseY - h, 50, h + 200)
      }
    } else {
      // Rolling hills
      ctx.beginPath()
      ctx.moveTo(-o, this.height)
      for (let x = -o; x < this.width + span; x += span) {
        ctx.quadraticCurveTo(x + span / 2, baseY - 40, x + span, baseY)
      }
      ctx.lineTo(this.width + span, this.height)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  private drawObstacles() {
    const ctx = this.ctx
    const t = this.level.theme
    for (const o of this.obstacles) {
      const halfGap = o.gapY / 2
      const top = o.gapCenter - halfGap
      const bottom = o.gapCenter + halfGap
      ctx.fillStyle = t.obstacle
      ctx.strokeStyle = t.obstacleEdge
      ctx.lineWidth = 3

      const shape = this.level.obstacleShape
      if (shape === "neon") {
        ctx.shadowColor = t.obstacleEdge
        ctx.shadowBlur = 16
      }
      // Top segment
      this.drawObstacleSegment(o.x, 0, o.width, top, true, shape)
      // Bottom segment
      this.drawObstacleSegment(o.x, bottom, o.width, this.playH - bottom, false, shape)
      ctx.shadowBlur = 0
    }
  }

  private drawObstacleSegment(x: number, y: number, w: number, h: number, isTop: boolean, shape: string) {
    const ctx = this.ctx
    if (h <= 0) return
    if (shape === "icicle") {
      ctx.beginPath()
      if (isTop) {
        ctx.moveTo(x, y)
        ctx.lineTo(x + w, y)
        ctx.lineTo(x + w, y + h - 20)
        ctx.lineTo(x + w / 2, y + h + 18)
        ctx.lineTo(x, y + h - 20)
      } else {
        ctx.moveTo(x, y + 20)
        ctx.lineTo(x + w / 2, y - 18)
        ctx.lineTo(x + w, y + 20)
        ctx.lineTo(x + w, y + h)
        ctx.lineTo(x, y + h)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      return
    }
    if (shape === "asteroid" || shape === "rock") {
      const r = 8
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // Craters
      ctx.fillStyle = "rgba(0,0,0,0.15)"
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(x + w * (0.3 + i * 0.2), y + h * (0.3 + (i % 2) * 0.4), 4, 0, Math.PI * 2)
        ctx.fill()
      }
      return
    }
    // pipe / branch / neon: rounded rectangle with cap
    ctx.fillRect(x, y, w, h)
    ctx.strokeRect(x, y, w, h)
    const capH = 18
    const capOverhang = 5
    const capY = isTop ? y + h - capH : y
    ctx.fillRect(x - capOverhang, capY, w + capOverhang * 2, capH)
    ctx.strokeRect(x - capOverhang, capY, w + capOverhang * 2, capH)
    if (shape === "branch") {
      ctx.fillStyle = "rgba(0,0,0,0.12)"
      for (let i = 0; i < Math.floor(h / 30); i++) {
        ctx.fillRect(x + 6, y + 10 + i * 30, w - 12, 3)
      }
      ctx.fillStyle = this.level.theme.obstacle
    }
  }

  private drawCoins() {
    const ctx = this.ctx
    const t = this.level.theme
    for (const c of this.coins) {
      if (c.collected) continue
      const yy = c.y + Math.sin(c.bob) * 4
      const squash = Math.abs(Math.cos(c.bob * 0.8))
      ctx.save()
      ctx.translate(c.x, yy)
      ctx.scale(0.4 + squash * 0.6, 1)
      ctx.beginPath()
      ctx.fillStyle = t.accent
      ctx.arc(0, 0, c.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = "rgba(0,0,0,0.25)"
      ctx.stroke()
      ctx.restore()
      ctx.fillStyle = "rgba(255,255,255,0.5)"
      ctx.beginPath()
      ctx.arc(c.x - c.r * 0.3, yy - c.r * 0.3, c.r * 0.25, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawPowerups() {
    const ctx = this.ctx
    for (const p of this.powerups) {
      const yy = p.y + Math.sin(p.bob) * 5
      ctx.save()
      ctx.translate(p.x, yy)
      ctx.shadowColor = this.powerColor(p.type)
      ctx.shadowBlur = 16
      ctx.beginPath()
      ctx.fillStyle = this.powerColor(p.type)
      ctx.arc(0, 0, p.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = "#ffffff"
      ctx.font = `${Math.floor(p.r * 1.1)}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(this.powerIcon(p.type), 0, 1)
      ctx.restore()
    }
  }

  private powerColor(type: PowerUpType) {
    switch (type) {
      case "shield":
        return "#3fa9f5"
      case "slowmo":
        return "#9b59f5"
      case "magnet":
        return "#f55d9b"
      case "boost":
        return "#f5a623"
      case "life":
        return "#4bd964"
    }
  }

  private powerIcon(type: PowerUpType) {
    switch (type) {
      case "shield":
        return "S"
      case "slowmo":
        return "T"
      case "magnet":
        return "M"
      case "boost":
        return "B"
      case "life":
        return "+"
    }
  }

  private drawFireballs() {
    const ctx = this.ctx
    for (const f of this.fireballs) {
      ctx.save()
      ctx.translate(f.x, f.y)
      ctx.shadowColor = "#ff6a2f"
      ctx.shadowBlur = 20
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, f.r)
      g.addColorStop(0, "#fff2a0")
      g.addColorStop(0.5, "#ff8a2f")
      g.addColorStop(1, "#d32f0f")
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(0, 0, f.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  private drawPlayer() {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(this.px, this.py)
    ctx.rotate(this.rotation)

    // Shield aura
    if (this.shield) {
      ctx.beginPath()
      ctx.strokeStyle = "rgba(63,169,245,0.9)"
      ctx.lineWidth = 3
      ctx.setLineDash([6, 4])
      ctx.arc(0, 0, this.radius + 8 + Math.sin(performance.now() / 150) * 2, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
    if (this.activePower === "boost") {
      // trail
      ctx.fillStyle = "rgba(245,166,35,0.5)"
      ctx.beginPath()
      ctx.ellipse(-this.radius - 6, 0, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    const r = this.radius
    // Body
    ctx.fillStyle = "#ffd23f"
    ctx.strokeStyle = "#e08a1e"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 1.15, r, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Belly
    ctx.fillStyle = "#fff1b8"
    ctx.beginPath()
    ctx.ellipse(-r * 0.1, r * 0.35, r * 0.7, r * 0.55, 0, 0, Math.PI * 2)
    ctx.fill()

    // Wing (flaps)
    const wing = Math.sin(this.wingPhase) * 0.5
    ctx.fillStyle = "#f5a623"
    ctx.strokeStyle = "#e08a1e"
    ctx.beginPath()
    ctx.ellipse(-r * 0.15, r * 0.05, r * 0.7, r * 0.42, -0.4 + wing, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Beak
    ctx.fillStyle = "#ff8a2f"
    ctx.beginPath()
    ctx.moveTo(r * 1.0, -r * 0.1)
    ctx.lineTo(r * 1.5, r * 0.05)
    ctx.lineTo(r * 1.0, r * 0.25)
    ctx.closePath()
    ctx.fill()

    // Eye
    ctx.fillStyle = "#fff"
    ctx.beginPath()
    ctx.arc(r * 0.5, -r * 0.3, r * 0.32, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#1a1a1a"
    ctx.beginPath()
    ctx.arc(r * 0.6, -r * 0.3, r * 0.15, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  private drawParticles() {
    const ctx = this.ctx
    for (const p of this.particles) {
      const a = 1 - p.life / p.maxLife
      ctx.globalAlpha = Math.max(0, a)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private drawGround() {
    const ctx = this.ctx
    const t = this.level.theme
    ctx.fillStyle = t.ground
    ctx.fillRect(0, this.playH, this.width, this.groundH)
    ctx.fillStyle = "rgba(0,0,0,0.12)"
    const span = 40
    const o = this.bgLayers[2].offset % span
    for (let x = -o; x < this.width; x += span) {
      ctx.fillRect(x, this.playH, 20, 6)
    }
    ctx.fillStyle = "rgba(255,255,255,0.15)"
    ctx.fillRect(0, this.playH, this.width, 3)
  }

  private emitHud(force = false) {
    const meters = Math.floor(this.distancePx / METER)
    const progress = Math.min(1, meters / this.level.targetDistance)
    const hud: HudState = {
      score: this.score,
      distance: meters,
      coins: this.coinsCollected,
      progress,
      activePowerUp: this.activePower,
      powerUpTimeLeft: this.powerTimer,
      shielded: this.shield,
    }
    const key = `${hud.score}|${hud.coins}|${Math.round(progress * 100)}|${hud.activePowerUp}|${hud.shielded}|${Math.ceil(hud.powerUpTimeLeft)}`
    if (force || key !== this.lastHud) {
      this.lastHud = key
      this.cb.onHud(hud)
    }
  }

  getTutorialStage() {
    return this.tutorialStage
  }
}
