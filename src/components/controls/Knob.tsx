import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useDrag } from '../../interaction/useDrag'

/**
 * Knob - Rotary control with direct DOM manipulation during drag
 *
 * Performance architecture:
 * - During drag: Updates rotation via direct DOM transform (no React re-render)
 * - On release: Commits to state, triggers one re-render
 * - Audio updates: onDrag callback for immediate Tone.js param changes
 */

interface KnobProps {
  value: number           // 0-1 normalized (from store, represents committed value)
  onDrag: (value: number) => void    // Called during drag (immediate audio update)
  onCommit: (value: number) => void  // Called on release (persistence)
  label?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  formatValue?: (value: number) => string
  sensitivity?: number
}

const SIZES = {
  sm: { outer: 32, inner: 24, stroke: 2 },
  md: { outer: 48, inner: 36, stroke: 3 },
  lg: { outer: 64, inner: 48, stroke: 4 },
}

const MIN_ANGLE = -135
const MAX_ANGLE = 135

function KnobComponent({
  value,
  onDrag,
  onCommit,
  label,
  size = 'md',
  color = '#4ecdc4',
  formatValue = (v) => `${Math.round(v * 100)}%`,
  sensitivity = 0.004,
}: KnobProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [committedValue, setCommittedValue] = useState(value)

  // Refs for direct DOM manipulation
  const knobBodyRef = useRef<SVGGElement>(null)
  const valueArcRef = useRef<SVGPathElement>(null)
  const valueDisplayRef = useRef<HTMLSpanElement>(null)

  const dimensions = SIZES[size]

  // Sync committed value when prop changes (e.g., restore from store)
  useEffect(() => {
    setCommittedValue(value)
  }, [value])

  // Direct DOM update during drag (no React re-render)
  const updateKnobVisuals = useCallback((v: number) => {
    const angle = MIN_ANGLE + v * (MAX_ANGLE - MIN_ANGLE)

    // Update knob rotation
    if (knobBodyRef.current) {
      knobBodyRef.current.style.transform = `rotate(${angle}deg)`
      knobBodyRef.current.style.transformOrigin = 'center center'
    }

    // Update value arc
    if (valueArcRef.current) {
      const arcPath = createArc(MIN_ANGLE, angle, dimensions.inner / 2 - 2, dimensions.outer)
      valueArcRef.current.setAttribute('d', arcPath)
      valueArcRef.current.style.display = v > 0.01 ? 'block' : 'none'
    }

    // Update value display
    if (valueDisplayRef.current) {
      valueDisplayRef.current.textContent = formatValue(v)
    }
  }, [dimensions, formatValue])

  // Handle drag with direct DOM updates
  const handleDrag = useCallback((v: number) => {
    updateKnobVisuals(v)
    onDrag(v)
  }, [updateKnobVisuals, onDrag])

  // Handle commit (updates React state for final render)
  const handleCommit = useCallback((v: number) => {
    setCommittedValue(v)
    onCommit(v)
  }, [onCommit])

  const { isDragging, handlers } = useDrag({
    initialValue: committedValue,
    onDrag: handleDrag,
    onCommit: handleCommit,
    sensitivity,
    momentum: true,
    momentumDecay: 0.88,
  })

  // Calculate initial angle from committed value
  const angle = MIN_ANGLE + committedValue * (MAX_ANGLE - MIN_ANGLE)

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
          style={{ overflow: 'visible' }}
        >
          {/* Background track */}
          <path
            d={createArc(MIN_ANGLE, MAX_ANGLE, dimensions.inner / 2 - 2, dimensions.outer)}
            fill="none"
            stroke="#2a2a3a"
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
          />

          {/* Value arc - updated directly during drag */}
          <path
            ref={valueArcRef}
            d={createArc(MIN_ANGLE, angle, dimensions.inner / 2 - 2, dimensions.outer)}
            fill="none"
            stroke={color}
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
            style={{
              opacity: 0.8 + glowIntensity * 0.2,
              display: committedValue > 0.01 ? 'block' : 'none',
            }}
          />

          {/* Rotatable knob group - updated directly during drag */}
          <g
            ref={knobBodyRef}
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* Knob body (brass/metallic look) */}
            <circle
              cx={dimensions.outer / 2}
              cy={dimensions.outer / 2}
              r={dimensions.inner / 2 - 4}
              fill={`url(#knobGradient-${size})`}
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

            {/* Indicator line (always points up in local coords, rotates with group) */}
            <line
              x1={dimensions.outer / 2}
              y1={dimensions.outer / 2}
              x2={dimensions.outer / 2}
              y2={dimensions.outer / 2 - (dimensions.inner / 2 - 8)}
              stroke="#1a1a2a"
              strokeWidth={2}
              strokeLinecap="round"
            />

            {/* Indicator dot */}
            <circle
              cx={dimensions.outer / 2}
              cy={dimensions.outer / 2 - (dimensions.inner / 2 - 8)}
              r={2}
              fill={color}
              style={{ opacity: 0.6 + glowIntensity * 0.4 }}
            />
          </g>

          {/* Gradient definitions */}
          <defs>
            <radialGradient id={`knobGradient-${size}`} cx="30%" cy="30%">
              <stop offset="0%" stopColor="#e8d5b7" />
              <stop offset="50%" stopColor="#d4a574" />
              <stop offset="100%" stopColor="#b8956a" />
            </radialGradient>
          </defs>
        </svg>
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

      {/* Value display - updated directly during drag */}
      <span
        ref={valueDisplayRef}
        className="text-xs font-medium tabular-nums"
        style={{
          color: isDragging ? color : '#c0c0d0',
          transition: 'color 0.15s',
        }}
      >
        {formatValue(committedValue)}
      </span>
    </div>
  )
}

// Helper to create SVG arc path
function createArc(startAngle: number, endAngle: number, radius: number, size: number): string {
  const center = size / 2
  const start = polarToCartesian(center, center, radius, endAngle)
  const end = polarToCartesian(center, center, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg - 90) * Math.PI / 180
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  }
}

// Memoize to prevent re-renders from parent
export const Knob = memo(KnobComponent)
