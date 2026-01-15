import * as Tone from 'tone'

export type AudioEngineState = 'uninitialized' | 'suspended' | 'running'

class AudioEngine {
  private static instance: AudioEngine | null = null
  private _state: AudioEngineState = 'uninitialized'
  private _masterGain: Tone.Gain | null = null

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine()
    }
    return AudioEngine.instance
  }

  get state(): AudioEngineState {
    return this._state
  }

  get masterGain(): Tone.Gain | null {
    return this._masterGain
  }

  get context(): Tone.BaseContext | null {
    return Tone.getContext()
  }

  async initialize(): Promise<void> {
    if (this._state !== 'uninitialized') {
      return
    }

    try {
      // Start Tone.js - this requires a user gesture
      await Tone.start()

      // Create master gain for overall volume control
      this._masterGain = new Tone.Gain(0.7).toDestination()

      this._state = 'running'
      console.log('AudioEngine initialized successfully')
    } catch (error) {
      console.error('Failed to initialize AudioEngine:', error)
      throw error
    }
  }

  async suspend(): Promise<void> {
    if (this._state !== 'running') return

    const ctx = Tone.getContext()
    if (ctx.rawContext && 'suspend' in ctx.rawContext) {
      await (ctx.rawContext as AudioContext).suspend()
    }
    this._state = 'suspended'
  }

  async resume(): Promise<void> {
    if (this._state !== 'suspended') return

    const ctx = Tone.getContext()
    if (ctx.rawContext && 'resume' in ctx.rawContext) {
      await (ctx.rawContext as AudioContext).resume()
    }
    this._state = 'running'
  }

  // Get the destination for modules to connect to
  getDestination(): Tone.Gain {
    if (!this._masterGain) {
      throw new Error('AudioEngine not initialized')
    }
    return this._masterGain
  }

  // Utility to check if audio context is ready
  isReady(): boolean {
    return this._state === 'running'
  }
}

export const audioEngine = AudioEngine.getInstance()
export default audioEngine
