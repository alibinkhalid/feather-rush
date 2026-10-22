// Lightweight Web Audio synthesizer. No external assets required.

type SfxName = "flap" | "coin" | "hit" | "powerup" | "complete" | "button" | "gameover"

export class AudioManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private musicTimer: number | null = null
  private musicStep = 0
  private soundOn = true
  private musicOn = true

  private ensure() {
    if (typeof window === "undefined") return
    if (this.ctx) return
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    this.ctx = new Ctor()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.9
    this.master.connect(this.ctx.destination)
    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = 0.6
    this.sfxGain.connect(this.master)
    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0.16
    this.musicGain.connect(this.master)
  }

  /** Must be called from a user gesture to unlock audio on iOS. */
  resume() {
    this.ensure()
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume()
    }
  }

  setSound(on: boolean) {
    this.soundOn = on
  }

  setMusic(on: boolean) {
    this.musicOn = on
    if (!on) this.stopMusic()
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0, slideTo?: number) {
    if (!this.ctx || !this.sfxGain) return
    const t0 = this.ctx.currentTime + when
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g)
    g.connect(this.sfxGain)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }

  play(name: SfxName) {
    if (!this.soundOn) return
    this.ensure()
    if (!this.ctx) return
    if (this.ctx.state === "suspended") void this.ctx.resume()
    switch (name) {
      case "flap":
        this.tone(420, 0.12, "sine", 0.5, 0, 620)
        break
      case "coin":
        this.tone(880, 0.08, "square", 0.35)
        this.tone(1320, 0.1, "square", 0.3, 0.06)
        break
      case "powerup":
        this.tone(520, 0.1, "triangle", 0.4, 0, 780)
        this.tone(780, 0.12, "triangle", 0.4, 0.1, 1180)
        break
      case "hit":
        this.tone(180, 0.25, "sawtooth", 0.5, 0, 60)
        break
      case "gameover":
        this.tone(400, 0.2, "sawtooth", 0.4, 0, 180)
        this.tone(220, 0.3, "sawtooth", 0.4, 0.18, 90)
        break
      case "complete":
        this.tone(523, 0.14, "triangle", 0.45, 0)
        this.tone(659, 0.14, "triangle", 0.45, 0.13)
        this.tone(784, 0.14, "triangle", 0.45, 0.26)
        this.tone(1046, 0.24, "triangle", 0.45, 0.39)
        break
      case "button":
        this.tone(600, 0.05, "square", 0.25, 0, 720)
        break
    }
  }

  startMusic() {
    if (!this.musicOn) return
    this.ensure()
    if (!this.ctx || !this.musicGain || this.musicTimer !== null) return
    if (this.ctx.state === "suspended") void this.ctx.resume()
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]
    const bass = [65.41, 82.41, 98.0, 73.42]
    this.musicStep = 0
    const stepMs = 340
    const tick = () => {
      if (!this.ctx || !this.musicGain) return
      const t0 = this.ctx.currentTime
      const note = scale[(this.musicStep * 3) % scale.length]
      const osc = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      osc.type = "triangle"
      osc.frequency.value = note
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.04)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3)
      osc.connect(g)
      g.connect(this.musicGain)
      osc.start(t0)
      osc.stop(t0 + 0.34)

      if (this.musicStep % 2 === 0) {
        const b = this.ctx.createOscillator()
        const bg = this.ctx.createGain()
        b.type = "sine"
        b.frequency.value = bass[(this.musicStep / 2) % bass.length]
        bg.gain.setValueAtTime(0.0001, t0)
        bg.gain.exponentialRampToValueAtTime(0.6, t0 + 0.04)
        bg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5)
        b.connect(bg)
        bg.connect(this.musicGain)
        b.start(t0)
        b.stop(t0 + 0.55)
      }
      this.musicStep = (this.musicStep + 1) % 32
    }
    tick()
    this.musicTimer = window.setInterval(tick, stepMs)
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer)
      this.musicTimer = null
    }
  }

  dispose() {
    this.stopMusic()
    if (this.ctx) {
      void this.ctx.close()
      this.ctx = null
    }
  }
}

let sharedAudio: AudioManager | null = null
export function getAudio(): AudioManager {
  if (!sharedAudio) sharedAudio = new AudioManager()
  return sharedAudio
}
