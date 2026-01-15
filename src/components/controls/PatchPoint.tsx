import { useState } from 'react'

interface PatchPointProps {
  type: 'input' | 'output'
  color?: string
  isConnected?: boolean
  onConnect?: () => void
}

export function PatchPoint({
  type,
  color = '#4ecdc4',
  isConnected = false,
  onConnect,
}: PatchPointProps) {
  const [isHovered, setIsHovered] = useState(false)

  const size = 12
  const innerSize = 6

  return (
    <div
      className="relative cursor-pointer no-select"
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onConnect}
    >
      {/* Outer ring */}
      <div
        className="absolute rounded-full transition-all duration-150"
        style={{
          width: size,
          height: size,
          background: isConnected
            ? `radial-gradient(circle, ${color} 0%, ${color}88 100%)`
            : 'radial-gradient(circle, #3a3a4a 0%, #2a2a3a 100%)',
          boxShadow: isConnected
            ? `0 0 8px ${color}80, inset 0 1px 2px rgba(0,0,0,0.3)`
            : 'inset 0 1px 3px rgba(0,0,0,0.5)',
          border: `1px solid ${isConnected ? color : '#4a4a5a'}`,
        }}
      />

      {/* Inner socket */}
      <div
        className="absolute rounded-full transition-all duration-150"
        style={{
          width: innerSize,
          height: innerSize,
          left: (size - innerSize) / 2,
          top: (size - innerSize) / 2,
          background: isConnected
            ? '#1a1a2a'
            : 'radial-gradient(circle, #1a1a2a 0%, #0a0a1a 100%)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
        }}
      />

      {/* Hover glow */}
      {isHovered && !isConnected && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size + 4,
            height: size + 4,
            left: -2,
            top: -2,
            background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Type indicator (subtle arrow) */}
      <div
        className="absolute pointer-events-none opacity-40"
        style={{
          width: 4,
          height: 4,
          left: type === 'input' ? -6 : size + 2,
          top: (size - 4) / 2,
        }}
      >
        <svg width="4" height="4" viewBox="0 0 4 4">
          {type === 'input' ? (
            <path d="M0 2 L4 0 L4 4 Z" fill={color} />
          ) : (
            <path d="M0 0 L4 2 L0 4 Z" fill={color} />
          )}
        </svg>
      </div>

      {/* Pulse animation when connected */}
      {isConnected && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size,
            height: size,
            animation: 'patchPulse 2s ease-in-out infinite',
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
          }}
        />
      )}

      <style>{`
        @keyframes patchPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
