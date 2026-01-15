import { useState, useRef, useEffect } from 'react'
import { useDrag } from '../../interaction/useDrag'

interface KnobProps {
  value: number           // 0-1 normalized
  onChange: (value: number) => void
  label?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string          // Accent color for the indicator
  showValue?: boolean
  formatValue?: (value: number) => string
  sensitivity?: number
}

const SIZES = {
  sm: { outer: 32, inner: 24, stroke: 2 },
  md: { outer: 48, inner: 36, stroke: 3 },
  lg: { outer: 64, inner: 48, stroke: 4 },
}

export function Knob({
  value,
  onChange,
  label,
  size = 'md',
  color = '#4ecdc4',
  showValue = true,
  formatValue = (v) => `${Math.round(v * 100)}%`,
  sensitivity = 0.004,
}: KnobProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const lastSignificantValue = useRef(value)
  const particleTimeoutRef = useRef<number | null>(null)

  const { isDragging, handlers } = useDrag({
    value,
    onChange,
    sensitivity,
    momentum: true,
    momentumDecay: 0.88,
  })

  const dimensions = SIZES[size]

  // Calculate rotation angle (270 degree sweep, from -135 to +135)
  const minAngle = -135
  const maxAngle = 135
  const angle = minAngle + value * (maxAngle - minAngle)

  // Detect significant value changes for particle effect
  useEffect(() => {
    const delta = Math.abs(value - lastSignificantValue.current)
    if (delta > 0.15) {
      lastSignificantValue.current = value
      setShowParticles(true)

      if (particleTimeoutRef.current) {
        clearTimeout(particleTimeoutRef.current)
      }
      particleTimeoutRef.current = window.setTimeout(() => {
        setShowParticles(false)
      }, 300)
    }
  }, [value])

  // Cleanup
  useEffect(() => {
    return () => {
      if (particleTimeoutRef.current) {
        clearTimeout(particleTimeoutRef.current)
      }
    }
  }, [])

  // Calculate arc path for value indicator
  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(dimensions.outer / 2, dimensions.outer / 2, radius, endAngle)
    const end = polarToCartesian(dimensions.outer / 2, dimensions.outer / 2, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ')
  }

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = (angleDeg - 90) * Math.PI / 180
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    }
  }

  // Calculate indicator line position
  const indicatorLength = dimensions.inner / 2 - 4
  const indicatorEnd = polarToCartesian(
    dimensions.outer / 2,
    dimensions.outer / 2,
    indicatorLength,
    angle
  )

  // Glow intensity based on interaction state
  const glowIntensity = isDragging ? 1 : isHovered ? 0.5 : 0
  const glowSize = isDragging ? 12 : 8

  return (
    <div
      className="flex flex-col items-center gap-1 no-select"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Knob SVG */}
      <div
        className="relative cursor-pointer"
        style={{
          width: dimensions.outer,
          height: dimensions.outer,
          filter: glowIntensity > 0
            ? `drop-shadow(0 0 ${glowSize}px ${color}${Math.round(glowIntensity * 99).toString(16).padStart(2, '0')})`
            : 'none',
          transition: isDragging ? 'none' : 'filter 0.2s ease-out',
        }}
        {...handlers}
      >
        <svg
          width={dimensions.outer}
          height={dimensions.outer}
          viewBox={`0 0 ${dimensions.outer} ${dimensions.outer}`}
        >
          {/* Background track */}
          <path
            d={createArc(minAngle, maxAngle, dimensions.inner / 2 - 2)}
            fill="none"
            stroke="#2a2a3a"
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
          />

          {/* Value arc */}
          {value > 0.01 && (
            <path
              d={createArc(minAngle, angle, dimensions.inner / 2 - 2)}
              fill="none"
              stroke={color}
              strokeWidth={dimensions.stroke}
              strokeLinecap="round"
              style={{
                opacity: 0.8 + glowIntensity * 0.2,
              }}
            />
          )}

          {/* Knob body (brass/metallic look) */}
          <circle
            cx={dimensions.outer / 2}
            cy={dimensions.outer / 2}
            r={dimensions.inner / 2 - 4}
            fill="url(#knobGradient)"
            style={{
              filter: isDragging ? 'brightness(1.1)' : 'none',
            }}
          />

          {/* Knob edge highlight */}
          <circle
            cx={dimensions.outer / 2}
            cy={dimensions.outer / 2}
            r={dimensions.inner / 2 - 4}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />

          {/* Indicator line */}
          <line
            x1={dimensions.outer / 2}
            y1={dimensions.outer / 2}
            x2={indicatorEnd.x}
            y2={indicatorEnd.y}
            stroke="#1a1a2a"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Indicator dot at end */}
          <circle
            cx={indicatorEnd.x}
            cy={indicatorEnd.y}
            r={2}
            fill={color}
            style={{
              opacity: 0.6 + glowIntensity * 0.4,
            }}
          />

          {/* Gradient definitions */}
          <defs>
            <radialGradient id="knobGradient" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#e8d5b7" />
              <stop offset="50%" stopColor="#d4a574" />
              <stop offset="100%" stopColor="#b8956a" />
            </radialGradient>
          </defs>
        </svg>

        {/* Particle effect on significant change */}
        {showParticles && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              animation: 'particleBurst 0.3s ease-out forwards',
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 3,
                  height: 3,
                  backgroundColor: color,
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-${dimensions.outer / 2 + 5}px)`,
                  opacity: 0,
                  animation: `particleFly 0.3s ease-out ${i * 0.03}s forwards`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Label */}
      {label && (
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: '#8a8a9a' }}
        >
          {label}
        </span>
      )}

      {/* Value display */}
      {showValue && (
        <span
          className="text-xs font-medium tabular-nums"
          style={{
            color: isDragging ? color : '#c0c0d0',
            transition: 'color 0.15s',
          }}
        >
          {formatValue(value)}
        </span>
      )}

      {/* Keyframes for particle animation */}
      <style>{`
        @keyframes particleBurst {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes particleFly {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-${dimensions.outer / 2 + 5}px);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-${dimensions.outer / 2 + 20}px);
          }
        }
      `}</style>
    </div>
  )
}
