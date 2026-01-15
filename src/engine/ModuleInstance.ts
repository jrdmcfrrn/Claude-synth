import * as Tone from 'tone'

/**
 * ModuleInstance is the core abstraction for audio modules.
 *
 * Key principle: Audio instantiation happens FIRST, React renders a view of it.
 * The module owns its Tone.js nodes and knows how to tear them down.
 *
 * Zustand stores are "source of record" (persistence, snapshots).
 * Tone.js nodes are "source of truth during interaction" (real-time audio).
 * They sync on gesture completion, not continuously.
 */

export interface ParamConfig {
  name: string
  label: string
  defaultValue: number
  // Convert 0-1 normalized to display string
  format: (value: number) => string
  // Convert 0-1 normalized to actual audio parameter value
  map: (value: number) => number
}

export interface ModuleConfig {
  type: string
  label: string
  color: string
  params: ParamConfig[]
  hasInput: boolean
  hasOutput: boolean
}

export abstract class ModuleInstance {
  readonly id: string
  readonly type: string
  readonly config: ModuleConfig

  protected nodes: Tone.ToneAudioNode[] = []
  protected _isDisposed = false
  protected _isPowered = true

  // Current parameter values (0-1 normalized)
  protected paramValues: Map<string, number> = new Map()

  constructor(id: string, config: ModuleConfig) {
    this.id = id
    this.type = config.type
    this.config = config

    // Initialize param values to defaults
    for (const param of config.params) {
      this.paramValues.set(param.name, param.defaultValue)
    }
  }

  /**
   * Initialize audio nodes. Called after construction.
   * Subclasses create their Tone.js nodes here.
   */
  abstract initialize(): void

  /**
   * Get the input node for external connections (if module accepts input)
   */
  abstract getInput(): Tone.ToneAudioNode | null

  /**
   * Get the output node for external connections
   */
  abstract getOutput(): Tone.ToneAudioNode | null

  /**
   * Set a parameter value immediately (during drag).
   * This updates the audio directly without React involvement.
   */
  abstract setParamImmediate(name: string, value: number): void

  /**
   * Get current parameter value
   */
  getParam(name: string): number {
    return this.paramValues.get(name) ?? 0
  }

  /**
   * Get all current parameter values (for persistence)
   */
  getAllParams(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [name, value] of this.paramValues) {
      result[name] = value
    }
    return result
  }

  /**
   * Restore parameters from saved state
   */
  restoreParams(params: Record<string, number>): void {
    for (const [name, value] of Object.entries(params)) {
      this.setParamImmediate(name, value)
    }
  }

  /**
   * Power on/off the module
   */
  setPower(on: boolean): void {
    this._isPowered = on
    this.onPowerChange(on)
  }

  get isPowered(): boolean {
    return this._isPowered
  }

  /**
   * Subclass hook for power state changes
   */
  protected onPowerChange(on: boolean): void {
    // Default: mute output when powered off
    const output = this.getOutput()
    if (output && 'volume' in output) {
      (output as Tone.Volume).volume.value = on ? 0 : -Infinity
    }
  }

  /**
   * Connect this module's output to a destination
   */
  connect(destination: Tone.InputNode): void {
    const output = this.getOutput()
    if (output && !this._isDisposed) {
      output.connect(destination)
    }
  }

  /**
   * Disconnect from destination (or all if not specified)
   */
  disconnect(destination?: Tone.InputNode): void {
    const output = this.getOutput()
    if (output && !this._isDisposed) {
      if (destination) {
        output.disconnect(destination)
      } else {
        output.disconnect()
      }
    }
  }

  /**
   * Clean up all resources. Called when module is removed from rack.
   */
  dispose(): void {
    if (this._isDisposed) return

    this._isDisposed = true

    // Disconnect and dispose all nodes in reverse order
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i]
      try {
        node.disconnect()
        node.dispose()
      } catch (e) {
        // Node may already be disposed
      }
    }

    this.nodes = []
    this.paramValues.clear()
  }

  get isDisposed(): boolean {
    return this._isDisposed
  }
}

// Registry of module instances by ID
const moduleRegistry = new Map<string, ModuleInstance>()

export function registerModule(module: ModuleInstance): void {
  moduleRegistry.set(module.id, module)
}

export function unregisterModule(id: string): void {
  const module = moduleRegistry.get(id)
  if (module) {
    module.dispose()
    moduleRegistry.delete(id)
  }
}

export function getModule(id: string): ModuleInstance | undefined {
  return moduleRegistry.get(id)
}

export function getAllModules(): ModuleInstance[] {
  return Array.from(moduleRegistry.values())
}
