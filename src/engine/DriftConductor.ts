import * as Tone from 'tone'

/**
 * DriftConductor provides a shared, slow LFO that multiple oscillators
 * can sample for pitch drift. This keeps oscillators moving together
 * (with phase offsets) rather than diverging chaotically.
 *
 * The soft-snap function creates gravitational wells at musical intervals,
 * so drift feels "alive" without going sour.
 */

class DriftConductor {
  private static instance: DriftConductor | null = null

  private lfo: Tone.LFO | null = null
  private signal: Tone.Signal<'number'> | null = null
  private _isStarted = false

  // Phase offsets for different oscillators (0-1)
  private phaseRegistry: Map<string, number> = new Map()

  // Time-based tracking for smoother phase offsets
  private startTime: number = 0

  private constructor() {}

  static getInstance(): DriftConductor {
    if (!DriftConductor.instance) {
      DriftConductor.instance = new DriftConductor()
    }
    return DriftConductor.instance
  }

  /**
   * Initialize the drift LFO. Call after audio context is ready.
   */
  initialize(): void {
    if (this.lfo) return

    // Create a signal to read LFO value from
    this.signal = new Tone.Signal(0)

    // Very slow LFO: one full cycle every ~50 seconds
    this.lfo = new Tone.LFO({
      frequency: 0.02,
      min: -1,
      max: 1,
      type: 'sine',
    })

    // Connect LFO to signal so we can read its value
    this.lfo.connect(this.signal)
  }

  /**
   * Start the drift conductor. Call when audio should begin.
   */
  start(): void {
    if (this._isStarted || !this.lfo) return
    this.lfo.start()
    this._isStarted = true
    this.startTime = Tone.now()
  }

  /**
   * Stop the drift conductor.
   */
  stop(): void {
    if (!this._isStarted || !this.lfo) return
    this.lfo.stop()
    this._isStarted = false
  }

  /**
   * Register an oscillator and get its phase offset.
   * Each oscillator gets a unique offset so they don't drift in lockstep.
   */
  registerOscillator(id: string): number {
    if (!this.phaseRegistry.has(id)) {
      // Distribute phases evenly with some randomness
      const existingCount = this.phaseRegistry.size
      const basePhase = (existingCount * 0.33) % 1 // ~120° apart
      const jitter = Math.random() * 0.1 - 0.05   // ±5% randomness
      this.phaseRegistry.set(id, (basePhase + jitter + 1) % 1)
    }
    return this.phaseRegistry.get(id)!
  }

  /**
   * Unregister an oscillator when it's disposed.
   */
  unregisterOscillator(id: string): void {
    this.phaseRegistry.delete(id)
  }

  /**
   * Get the current drift value for an oscillator.
   * Returns cents of detuning (±maxCents).
   *
   * @param id - Oscillator ID (for phase offset)
   * @param maxCents - Maximum drift amount (default ±5 cents)
   * @param depthScale - 0-1 multiplier for this oscillator's drift amount
   */
  getDriftCents(id: string, maxCents: number = 5, depthScale: number = 1): number {
    if (!this._isStarted) return 0

    const phaseOffset = this.phaseRegistry.get(id) ?? 0

    // Calculate LFO phase based on time (more reliable than reading signal)
    const elapsed = Tone.now() - this.startTime
    const frequency = 0.02 // Same as LFO frequency
    const basePhase = (elapsed * frequency) % 1

    // Apply phase offset and calculate sine value
    const adjustedPhase = (basePhase + phaseOffset) % 1
    const rawValue = Math.sin(adjustedPhase * Math.PI * 2)

    // Scale to cents
    const rawCents = rawValue * maxCents * depthScale

    // Apply soft-snap to musical intervals
    return this.softSnapToInterval(rawCents)
  }

  /**
   * Soft-snap creates gravitational wells at musical intervals.
   * The drift can wander, but it's gently pulled toward consonant values.
   *
   * Intervals in cents from unison:
   * - 0: Unison (strongest pull)
   * - ±5: Barely perceptible, adds richness
   * - ±100: Semitone (avoid - sounds out of tune)
   *
   * We want the drift to feel free but bias toward 0 and ±5.
   */
  private softSnapToInterval(cents: number): number {
    // Define attraction points and their strength
    const attractors = [
      { center: 0, strength: 0.3 },    // Strong pull to unison
      { center: 5, strength: 0.15 },   // Mild pull to +5 cents
      { center: -5, strength: 0.15 },  // Mild pull to -5 cents
    ]

    let result = cents

    for (const { center, strength } of attractors) {
      const distance = cents - center
      // Gravitational pull: stronger when closer
      const pull = strength * Math.sign(distance) * Math.pow(Math.abs(distance), 0.7)
      result -= pull
    }

    // Clamp to prevent runaway
    return Math.max(-10, Math.min(10, result))
  }

  /**
   * Get raw LFO value (-1 to 1) for other modulation uses.
   */
  getRawValue(): number {
    if (!this._isStarted) return 0

    const elapsed = Tone.now() - this.startTime
    const frequency = 0.02
    const phase = (elapsed * frequency) % 1
    return Math.sin(phase * Math.PI * 2)
  }

  dispose(): void {
    if (this.lfo) {
      this.lfo.stop()
      this.lfo.dispose()
      this.lfo = null
    }
    if (this.signal) {
      this.signal.dispose()
      this.signal = null
    }
    this._isStarted = false
    this.phaseRegistry.clear()
  }
}

export const driftConductor = DriftConductor.getInstance()
export default driftConductor
