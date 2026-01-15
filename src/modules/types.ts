import * as Tone from 'tone'

export type ControlType = 'knob' | 'fader' | 'button' | 'toggle'

export interface ParamDefinition {
  name: string
  label: string
  type: ControlType
  defaultValue: number
  min?: number
  max?: number
  // For buttons with cycle states
  states?: string[]
  // Function to convert 0-1 value to display string
  formatValue?: (value: number) => string
  // Function to convert 0-1 value to actual parameter value
  mapValue?: (value: number) => number
}

export interface ModuleDefinition {
  type: string
  label: string
  description: string
  color: string
  params: ParamDefinition[]
  inputs: string[]
  outputs: string[]
}

export interface ModuleAudioNode {
  // Connect this module's output to another input
  connect: (destination: Tone.InputNode) => void
  // Disconnect from all or specific destination
  disconnect: (destination?: Tone.InputNode) => void
  // Get the output node for external connections
  getOutput: () => Tone.ToneAudioNode
  // Get input node if module accepts input
  getInput?: () => Tone.ToneAudioNode
  // Set a parameter value (0-1 normalized)
  setParam: (name: string, value: number) => void
  // Clean up resources
  dispose: () => void
}

// Exponential mapping for frequency-like parameters
export function expMap(value: number, min: number, max: number): number {
  const minLog = Math.log(min)
  const maxLog = Math.log(max)
  return Math.exp(minLog + value * (maxLog - minLog))
}

// Linear mapping
export function linMap(value: number, min: number, max: number): number {
  return min + value * (max - min)
}

// Format as Hz
export function formatHz(hz: number): string {
  if (hz >= 1000) {
    return `${(hz / 1000).toFixed(1)}kHz`
  }
  return `${Math.round(hz)}Hz`
}

// Format as percentage
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

// Format as time in seconds
export function formatTime(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`
  }
  return `${seconds.toFixed(1)}s`
}
