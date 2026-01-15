import type { ModuleInstance } from '../state/useRackStore'
import { ModuleShell } from './ModuleShell'

interface ModuleSlotProps {
  slotIndex: number
  module: ModuleInstance | null
}

export function ModuleSlot({ slotIndex, module }: ModuleSlotProps) {
  if (module) {
    return <ModuleShell module={module} />
  }

  // Empty slot
  return (
    <div
      className="relative rounded-md transition-all duration-200"
      style={{
        height: 120,
        background: 'linear-gradient(180deg, #1a1810 0%, #0f0d08 100%)',
        boxShadow: `
          inset 0 2px 8px rgba(0, 0, 0, 0.5),
          inset 0 -1px 2px rgba(255, 255, 255, 0.05)
        `,
        border: '1px solid #2a2520',
      }}
    >
      {/* Empty slot indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 opacity-30">
          {/* Slot rails visualization */}
          <div className="flex gap-4">
            <div
              className="w-1 h-16 rounded-full"
              style={{
                background: 'linear-gradient(180deg, #3a3530 0%, #2a2520 100%)',
              }}
            />
            <div
              className="w-1 h-16 rounded-full"
              style={{
                background: 'linear-gradient(180deg, #3a3530 0%, #2a2520 100%)',
              }}
            />
          </div>

          {/* Slot number */}
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: '#4a4540' }}
          >
            Slot {slotIndex + 1}
          </span>
        </div>
      </div>

      {/* Subtle slot guides */}
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-800/30 rounded-full" />
      <div className="absolute right-2 top-2 bottom-2 w-0.5 bg-gray-800/30 rounded-full" />
    </div>
  )
}
