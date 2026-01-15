import { useRef, useCallback, useEffect, useState } from 'react'

/**
 * useDrag - Hook for knob/fader drag with momentum physics
 *
 * Architecture:
 * - During drag: Calls onDrag() for immediate audio/visual updates (bypasses React)
 * - On release: Calls onCommit() with final value (for persistence to Zustand)
 *
 * This decouples 60fps interaction from React's render cycle.
 */

interface DragState {
  isDragging: boolean
  startY: number
  startValue: number
}

interface UseDragOptions {
  initialValue: number
  onDrag: (value: number) => void     // Called during drag (immediate audio update)
  onCommit: (value: number) => void   // Called on release (persistence)
  sensitivity?: number
  momentum?: boolean
  momentumDecay?: number
}

interface UseDragReturn {
  isDragging: boolean
  currentValue: number  // Current value (including during drag)
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onTouchStart: (e: React.TouchEvent) => void
  }
}

export function useDrag({
  initialValue,
  onDrag,
  onCommit,
  sensitivity = 0.005,
  momentum = true,
  momentumDecay = 0.88,
}: UseDragOptions): UseDragReturn {
  const [isDragging, setIsDragging] = useState(false)

  // Refs for performance-critical values (no re-renders)
  const valueRef = useRef(initialValue)
  const dragState = useRef<DragState>({
    isDragging: false,
    startY: 0,
    startValue: 0,
  })
  const velocityRef = useRef(0)
  const lastYRef = useRef(0)
  const animationRef = useRef<number | null>(null)

  // Sync ref when initialValue changes (e.g., on mount)
  useEffect(() => {
    if (!dragState.current.isDragging) {
      valueRef.current = initialValue
    }
  }, [initialValue])

  const clamp = (v: number): number => Math.max(0, Math.min(1, v))

  // Momentum animation after release
  const animateMomentum = useCallback(() => {
    if (Math.abs(velocityRef.current) < 0.0005) {
      velocityRef.current = 0
      // Final commit after momentum settles
      onCommit(valueRef.current)
      return
    }

    valueRef.current = clamp(valueRef.current + velocityRef.current)
    onDrag(valueRef.current)

    velocityRef.current *= momentumDecay
    animationRef.current = requestAnimationFrame(animateMomentum)
  }, [onDrag, onCommit, momentumDecay])

  // Start drag
  const handleDragStart = useCallback((clientY: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    dragState.current = {
      isDragging: true,
      startY: clientY,
      startValue: valueRef.current,
    }

    lastYRef.current = clientY
    velocityRef.current = 0
    setIsDragging(true)
  }, [])

  // During drag
  const handleDragMove = useCallback((clientY: number) => {
    if (!dragState.current.isDragging) return

    const deltaY = dragState.current.startY - clientY
    const newValue = clamp(dragState.current.startValue + deltaY * sensitivity)

    // Calculate velocity for momentum
    const instantVelocity = (lastYRef.current - clientY) * sensitivity
    velocityRef.current = instantVelocity * 0.3 + velocityRef.current * 0.7
    lastYRef.current = clientY

    // Update ref and call onDrag (no React state update)
    valueRef.current = newValue
    onDrag(newValue)
  }, [sensitivity, onDrag])

  // End drag
  const handleDragEnd = useCallback(() => {
    if (!dragState.current.isDragging) return

    dragState.current.isDragging = false
    setIsDragging(false)

    if (momentum && Math.abs(velocityRef.current) > 0.001) {
      // Start momentum animation
      animationRef.current = requestAnimationFrame(animateMomentum)
    } else {
      // No momentum, commit immediately
      onCommit(valueRef.current)
    }
  }, [momentum, animateMomentum, onCommit])

  // Global event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY)
    const handleMouseUp = () => handleDragEnd()
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleDragMove(e.touches[0].clientY)
    }
    const handleTouchEnd = () => handleDragEnd()

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientY)
  }, [handleDragStart])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleDragStart(e.touches[0].clientY)
    }
  }, [handleDragStart])

  return {
    isDragging,
    currentValue: valueRef.current,
    handlers: {
      onMouseDown,
      onTouchStart,
    },
  }
}
