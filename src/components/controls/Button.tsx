import { useState, useCallback } from 'react'

interface ButtonProps {
  isPressed?: boolean
  onToggle?: (pressed: boolean) => void
  onPress?: () => void          // For momentary buttons
  momentary?: boolean           // If true, only fires while held
  size?: 'xs' | 'sm' | 'md'
  color?: string
  label?: string
}

const SIZES = {
  xs: { width: 16, height: 16, depth: 2 },
  sm: { width: 24, height: 24, depth: 3 },
  md: { width: 32, height: 32, depth: 4 },
}

export function Button({
  isPressed = false,
  onToggle,
  onPress,
  momentary = false,
  size = 'sm',
  color = '#4ecdc4',
  label,
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [showRipple, setShowRipple] = useState(false)

  const dimensions = SIZES[size]

  // The visual pressed state combines external isPressed and internal active state
  const visuallyPressed = momentary ? isActive : isPressed

  const handleMouseDown = useCallback(() => {
    setIsActive(true)
    setShowRipple(true)

    // Brief timeout for ripple animation
    setTimeout(() => setShowRipple(false), 200)

    if (momentary && onPress) {
      onPress()
    }
  }, [momentary, onPress])

  const handleMouseUp = useCallback(() => {
    setIsActive(false)

    if (!momentary && onToggle) {
      onToggle(!isPressed)
    }
  }, [momentary, onToggle, isPressed])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (momentary) {
      setIsActive(false)
    }
  }, [momentary])

  return (
    <div
      className="flex flex-col items-center gap-1 no-select"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative cursor-pointer"
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {/* Button shadow/depth */}
        <div
          className="absolute rounded transition-all duration-75"
          style={{
            left: 0,
            right: 0,
            bottom: 0,
            height: dimensions.height,
            background: '#1a1a2a',
            borderRadius: 4,
          }}
        />

        {/* Button body */}
        <div
          className="absolute rounded transition-all"
          style={{
            left: 0,
            right: 0,
            top: 0,
            height: dimensions.height - dimensions.depth,
            transform: visuallyPressed
              ? `translateY(${dimensions.depth}px)`
              : 'translateY(0)',
            background: visuallyPressed
              ? `linear-gradient(180deg, ${color}dd 0%, ${color}aa 100%)`
              : `linear-gradient(180deg, #4a4a5a 0%, #3a3a4a 100%)`,
            boxShadow: visuallyPressed
              ? 'inset 0 1px 2px rgba(0,0,0,0.3)'
              : `
                inset 0 1px 2px rgba(255,255,255,0.1),
                0 ${dimensions.depth}px 0 #2a2a3a
              `,
            borderRadius: 4,
            transitionDuration: visuallyPressed ? '80ms' : '120ms',
          }}
        >
          {/* LED indicator */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150"
            style={{
              width: dimensions.width * 0.25,
              height: dimensions.width * 0.25,
              backgroundColor: visuallyPressed ? '#ffffff' : '#2a2a3a',
              boxShadow: visuallyPressed
                ? `0 0 ${dimensions.width * 0.3}px ${color}, 0 0 ${dimensions.width * 0.6}px ${color}80`
                : 'none',
            }}
          />

          {/* Ripple effect on press */}
          {showRipple && (
            <div
              className="absolute inset-0 rounded overflow-hidden"
              style={{ borderRadius: 4 }}
            >
              <div
                className="absolute left-1/2 top-1/2"
                style={{
                  width: dimensions.width * 2,
                  height: dimensions.width * 2,
                  marginLeft: -dimensions.width,
                  marginTop: -dimensions.width,
                  background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
                  animation: 'buttonRipple 0.2s ease-out forwards',
                }}
              />
            </div>
          )}
        </div>

        {/* Hover highlight */}
        {isHovered && !visuallyPressed && (
          <div
            className="absolute rounded pointer-events-none"
            style={{
              left: 0,
              right: 0,
              top: 0,
              height: dimensions.height - dimensions.depth,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 4,
            }}
          />
        )}
      </div>

      {/* Label */}
      {label && (
        <span
          className="text-[8px] uppercase tracking-wider"
          style={{ color: '#6a6a7a' }}
        >
          {label}
        </span>
      )}

      <style>{`
        @keyframes buttonRipple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
