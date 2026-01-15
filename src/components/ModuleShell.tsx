import { useState } from 'react'
import type { ModuleInstance } from '../state/useRackStore'
import { Knob } from './controls/Knob'
import { Button } from './controls/Button'
import { PatchPoint } from './controls/PatchPoint'

interface ModuleShellProps {
  module: ModuleInstance
}

// Module color palette
const MODULE_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  DroneOscillator: {
    bg: 'linear-gradient(180deg, #f5e6d3 0%, #e8d5b7 100%)',
    accent: '#4ecdc4',
    text: '#3d3020',
  },
  TidalFilter: {
    bg: 'linear-gradient(180deg, #e8e0d8 0%, #d8d0c8 100%)',
    accent: '#7ed87e',
    text: '#3d3020',
  },
  ReverbPool: {
    bg: 'linear-gradient(180deg, #d8e0e8 0%, #c8d0d8 100%)',
    accent: '#6ba3d6',
    text: '#2a3040',
  },
  BreathLFO: {
    bg: 'linear-gradient(180deg, #e8d8e0 0%, #d8c8d0 100%)',
    accent: '#d87ed8',
    text: '#3d2040',
  },
  DelayDrift: {
    bg: 'linear-gradient(180deg, #e0e8d8 0%, #d0d8c8 100%)',
    accent: '#d8d87e',
    text: '#303d20',
  },
  OutputModule: {
    bg: 'linear-gradient(180deg, #2a2a3a 0%, #1a1a2a 100%)',
    accent: '#ff7f6e',
    text: '#c0c0d0',
  },
}

// Demo params for each module type (will be replaced with real module definitions)
const DEMO_PARAMS: Record<string, { name: string; label: string; default: number }[]> = {
  DroneOscillator: [
    { name: 'pitch', label: 'Pitch', default: 0.3 },
    { name: 'warmth', label: 'Warmth', default: 0.5 },
    { name: 'drift', label: 'Drift', default: 0.2 },
  ],
  TidalFilter: [
    { name: 'depth', label: 'Depth', default: 0.4 },
    { name: 'rhythm', label: 'Rhythm', default: 0.3 },
  ],
  ReverbPool: [
    { name: 'size', label: 'Size', default: 0.6 },
    { name: 'depth', label: 'Depth', default: 0.7 },
  ],
  BreathLFO: [
    { name: 'pace', label: 'Pace', default: 0.25 },
    { name: 'sway', label: 'Sway', default: 0.5 },
  ],
  DelayDrift: [
    { name: 'time', label: 'Time', default: 0.4 },
    { name: 'feedback', label: 'Feedback', default: 0.3 },
  ],
  OutputModule: [
    { name: 'volume', label: 'Volume', default: 0.7 },
  ],
}

export function ModuleShell({ module }: ModuleShellProps) {
  const colors = MODULE_COLORS[module.type] || MODULE_COLORS.DroneOscillator
  const params = DEMO_PARAMS[module.type] || []

  // Local state for param values (will be connected to store)
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    params.forEach(p => { initial[p.name] = p.default })
    return initial
  })

  const [isPowered, setIsPowered] = useState(true)

  const handleParamChange = (name: string, value: number) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div
      className="relative rounded-md overflow-hidden transition-all duration-200"
      style={{
        height: 120,
        background: colors.bg,
        boxShadow: `
          inset 0 1px 2px rgba(255, 255, 255, 0.3),
          inset 0 -1px 2px rgba(0, 0, 0, 0.2),
          0 2px 8px rgba(0, 0, 0, 0.3)
        `,
        border: '1px solid rgba(0, 0, 0, 0.1)',
        opacity: isPowered ? 1 : 0.6,
      }}
    >
      {/* Module header */}
      <div
        className="flex items-center justify-between px-3 py-1"
        style={{
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Module name */}
        <span
          className="text-[10px] uppercase tracking-wider font-medium"
          style={{ color: colors.text }}
        >
          {module.type.replace(/([A-Z])/g, ' $1').trim()}
        </span>

        {/* Power LED */}
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full transition-all duration-200"
            style={{
              backgroundColor: isPowered ? colors.accent : '#4a4a4a',
              boxShadow: isPowered
                ? `0 0 6px ${colors.accent}, 0 0 12px ${colors.accent}40`
                : 'none',
            }}
          />
        </div>
      </div>

      {/* Module body with controls */}
      <div className="flex items-center justify-center gap-4 py-2 px-3">
        {/* Input patch point (left side) */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2">
          <PatchPoint type="input" color={colors.accent} />
        </div>

        {/* Knobs */}
        <div className="flex items-center justify-center gap-4 flex-1">
          {params.map((param) => (
            <Knob
              key={param.name}
              value={values[param.name]}
              onChange={(v) => handleParamChange(param.name, v)}
              label={param.label}
              size="sm"
              color={colors.accent}
            />
          ))}
        </div>

        {/* Output patch point (right side) */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          <PatchPoint type="output" color={colors.accent} />
        </div>
      </div>

      {/* Power button (bottom right) */}
      <div className="absolute bottom-2 right-2">
        <Button
          isPressed={isPowered}
          onToggle={setIsPowered}
          size="xs"
          color={colors.accent}
        />
      </div>

      {/* Subtle texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, rgba(0,0,0,0.3) 1px, transparent 0)
          `,
          backgroundSize: '8px 8px',
        }}
      />
    </div>
  )
}
