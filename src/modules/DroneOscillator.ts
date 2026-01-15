import * as Tone from 'tone'
import { ModuleInstance } from '../engine/ModuleInstance'
import type { ModuleConfig } from '../engine/ModuleInstance'
import { driftConductor } from '../engine/DriftConductor'

/**
 * DroneOscillator - A warm, slow-evolving drone source.
 *
 * Creates a rich, layered sound using multiple detuned oscillators
 * passed through a lowpass filter for warmth. The DriftConductor
 * provides gentle, musical pitch variation.
 *
 * Parameters:
 * - Pitch: Base frequency (perceptually-linear: 40-200 Hz)
 * - Warmth: Filter cutoff (exponential: 200-3000 Hz)
 * - Drift: How much the conductor affects pitch (0-100%)
 */

// Perceptually-linear frequency mapping for bass/drone range
// More resolution in the musical sweet spot (60-120 Hz)
function mapPitch(value: number): number {
  // Custom curve with more resolution in the bass sweet spot
  const curve = [40, 55, 70, 85, 100, 120, 145, 175, 200]
  const index = value * (curve.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const t = index - lower

  if (lower === upper) return curve[lower]
  return curve[lower] + t * (curve[upper] - curve[lower])
}

// Exponential mapping for filter (sounds linear to human ears)
function mapWarmth(value: number): number {
  const min = 200
  const max = 3000
  return min * Math.pow(max / min, value)
}

function formatPitch(value: number): string {
  const hz = mapPitch(value)
  return `${Math.round(hz)}Hz`
}

function formatWarmth(value: number): string {
  const hz = mapWarmth(value)
  if (hz >= 1000) {
    return `${(hz / 1000).toFixed(1)}k`
  }
  return `${Math.round(hz)}Hz`
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export const DRONE_OSCILLATOR_CONFIG: ModuleConfig = {
  type: 'DroneOscillator',
  label: 'Drone',
  color: '#4ecdc4',
  hasInput: false,
  hasOutput: true,
  params: [
    {
      name: 'pitch',
      label: 'Pitch',
      defaultValue: 0.25, // ~70Hz
      format: formatPitch,
      map: mapPitch,
    },
    {
      name: 'warmth',
      label: 'Warmth',
      defaultValue: 0.4, // ~600Hz
      format: formatWarmth,
      map: mapWarmth,
    },
    {
      name: 'drift',
      label: 'Drift',
      defaultValue: 0.3,
      format: formatPercent,
      map: (v) => v, // 0-1 passed directly
    },
  ],
}

export class DroneOscillator extends ModuleInstance {
  // Oscillator layers for rich sound
  private osc1: Tone.Oscillator | null = null
  private osc2: Tone.Oscillator | null = null
  private osc3: Tone.Oscillator | null = null

  // Signal chain
  private filter: Tone.Filter | null = null
  private gain: Tone.Gain | null = null
  private output: Tone.Gain | null = null

  // Drift animation
  private driftAnimationId: number | null = null
  private baseFrequency: number = 70

  constructor(id: string) {
    super(id, DRONE_OSCILLATOR_CONFIG)
  }

  initialize(): void {
    // Create three oscillators with slight detuning for richness
    // Using different waveforms for harmonic complexity
    this.osc1 = new Tone.Oscillator({
      type: 'sine',
      frequency: this.baseFrequency,
    })

    this.osc2 = new Tone.Oscillator({
      type: 'triangle',
      frequency: this.baseFrequency,
      detune: -8, // Slightly flat
    })

    this.osc3 = new Tone.Oscillator({
      type: 'sine',
      frequency: this.baseFrequency * 2, // Octave up
      detune: 5,  // Slightly sharp
    })

    // Lowpass filter for warmth
    this.filter = new Tone.Filter({
      type: 'lowpass',
      frequency: mapWarmth(this.paramValues.get('warmth') ?? 0.4),
      rolloff: -24,
      Q: 0.5,
    })

    // Mix gain (oscillators sum here)
    this.gain = new Tone.Gain(0.25) // Reduce because we're summing 3 oscs

    // Output with envelope-like volume control
    this.output = new Tone.Gain(0)

    // Wire up the signal chain
    this.osc1.connect(this.gain)
    this.osc2.connect(this.gain)
    this.osc3.connect(this.gain)
    this.gain.connect(this.filter)
    this.filter.connect(this.output)

    // Register nodes for disposal
    this.nodes = [this.osc1, this.osc2, this.osc3, this.filter, this.gain, this.output]

    // Register with drift conductor
    driftConductor.registerOscillator(this.id)

    // Start drift animation loop
    this.startDriftAnimation()
  }

  /**
   * Start the oscillators and fade in
   */
  start(): void {
    if (!this.osc1 || !this.osc2 || !this.osc3 || !this.output) return

    this.osc1.start()
    this.osc2.start()
    this.osc3.start()

    // Fade in over 800ms
    this.output.gain.rampTo(1, 0.8)
  }

  /**
   * Fade out and stop
   */
  stop(): void {
    if (!this.output) return

    // Fade out over 500ms
    this.output.gain.rampTo(0, 0.5)

    // Stop oscillators after fade
    setTimeout(() => {
      this.osc1?.stop()
      this.osc2?.stop()
      this.osc3?.stop()
    }, 600)
  }

  getInput(): Tone.ToneAudioNode | null {
    return null // DroneOscillator has no input
  }

  getOutput(): Tone.ToneAudioNode | null {
    return this.output
  }

  setParamImmediate(name: string, value: number): void {
    // Clamp value
    const clamped = Math.max(0, Math.min(1, value))
    this.paramValues.set(name, clamped)

    const config = this.config.params.find(p => p.name === name)
    if (!config) return

    const mappedValue = config.map(clamped)

    switch (name) {
      case 'pitch':
        this.baseFrequency = mappedValue
        this.updateOscillatorFrequencies()
        break

      case 'warmth':
        if (this.filter) {
          // Use setTargetAtTime for smooth transitions
          this.filter.frequency.setTargetAtTime(mappedValue, Tone.now(), 0.05)
        }
        break

      case 'drift':
        // Drift amount is applied in the animation loop
        break
    }
  }

  /**
   * Update oscillator frequencies with drift applied
   */
  private updateOscillatorFrequencies(): void {
    if (!this.osc1 || !this.osc2 || !this.osc3) return

    const driftAmount = this.paramValues.get('drift') ?? 0.3
    const driftCents = driftConductor.getDriftCents(this.id, 5, driftAmount)

    // Convert cents to frequency multiplier
    const driftMultiplier = Math.pow(2, driftCents / 1200)
    const driftedFreq = this.baseFrequency * driftMultiplier

    // Update frequencies with smooth ramp
    const now = Tone.now()
    this.osc1.frequency.setTargetAtTime(driftedFreq, now, 0.1)
    this.osc2.frequency.setTargetAtTime(driftedFreq, now, 0.1)
    this.osc3.frequency.setTargetAtTime(driftedFreq * 2, now, 0.1) // Octave up
  }

  /**
   * Animation loop that applies drift continuously
   */
  private startDriftAnimation(): void {
    const animate = () => {
      if (this._isDisposed) return

      this.updateOscillatorFrequencies()

      // Run at ~10fps - drift is slow, doesn't need 60fps
      this.driftAnimationId = window.setTimeout(() => {
        requestAnimationFrame(animate)
      }, 100)
    }

    requestAnimationFrame(animate)
  }

  private stopDriftAnimation(): void {
    if (this.driftAnimationId !== null) {
      clearTimeout(this.driftAnimationId)
      this.driftAnimationId = null
    }
  }

  protected onPowerChange(on: boolean): void {
    if (on) {
      this.start()
    } else {
      this.stop()
    }
  }

  dispose(): void {
    // Stop drift animation
    this.stopDriftAnimation()

    // Unregister from drift conductor
    driftConductor.unregisterOscillator(this.id)

    // Stop oscillators gracefully
    this.stop()

    // Wait for fade out before disposing
    setTimeout(() => {
      super.dispose()
    }, 600)
  }
}

/**
 * Factory function to create a DroneOscillator
 */
export function createDroneOscillator(id: string): DroneOscillator {
  const module = new DroneOscillator(id)
  module.initialize()
  return module
}
