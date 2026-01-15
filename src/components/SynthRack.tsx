import { ModuleSlot } from './ModuleSlot'
import { useRackStore } from '../state/useRackStore'

export function SynthRack() {
  const slots = useRackStore((state) => state.slots)

  return (
    <div
      className="absolute right-0 top-0 h-full flex flex-col justify-center pr-4"
      style={{
        width: '45%',
        minWidth: 300,
        maxWidth: 500,
      }}
    >
      {/* Rack frame */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #3d3020 0%, #2a2015 50%, #1f1810 100%)',
          boxShadow: `
            inset 0 2px 4px rgba(255, 255, 255, 0.1),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 2px 8px rgba(0, 0, 0, 0.3)
          `,
          border: '2px solid #4a4030',
        }}
      >
        {/* Wooden texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.1) 2px,
              rgba(0,0,0,0.1) 4px
            )`,
          }}
        />

        {/* Top rail */}
        <div
          className="h-4 flex items-center justify-between px-3"
          style={{
            background: 'linear-gradient(180deg, #5a5040 0%, #3d3020 100%)',
            borderBottom: '1px solid #2a2015',
          }}
        >
          {/* Screws */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #888 0%, #444 100%)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
              }}
            />
          ))}
        </div>

        {/* Module slots container */}
        <div className="p-3 space-y-2">
          {slots.map((module, index) => (
            <ModuleSlot
              key={index}
              slotIndex={index}
              module={module}
            />
          ))}
        </div>

        {/* Bottom rail */}
        <div
          className="h-4 flex items-center justify-between px-3"
          style={{
            background: 'linear-gradient(0deg, #5a5040 0%, #3d3020 100%)',
            borderTop: '1px solid #2a2015',
          }}
        >
          {/* Screws */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #888 0%, #444 100%)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
              }}
            />
          ))}
        </div>

        {/* Power LED (always on when audio is running) */}
        <div
          className="absolute bottom-6 right-3 flex items-center gap-2"
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: '#4ecdc4',
              boxShadow: '0 0 8px #4ecdc4, 0 0 16px rgba(78, 205, 196, 0.5)',
            }}
          />
          <span className="text-[8px] uppercase tracking-wider text-gray-500">
            PWR
          </span>
        </div>
      </div>

      {/* Rack label */}
      <div className="mt-3 text-center">
        <span
          className="text-xs uppercase tracking-[0.3em] font-light"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          Tideland
        </span>
      </div>
    </div>
  )
}
