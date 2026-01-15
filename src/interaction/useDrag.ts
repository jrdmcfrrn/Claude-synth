import { useRef, useCallback, useEffect, useState } from 'react'

interface DragState {
  isDragging: boolean
  startY: number
  startValue: number
  currentY: number
}

interface UseDragOptions {
  value: number
  onChange: (value: number) => void
  sensitivity?: number     // How much mouse movement = value change
  momentum?: boolean       // Enable momentum on release
  momentumDecay?: number   // How quickly momentum decays (0-1, lower = faster decay)
}

interface UseDragReturn {
  isDragging: boolean
  velocity: number
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onTouchStart: (e: React.TouchEvent) => void
  }
}

export function useDrag({
  value,
  onChange,
  sensitivity = 0.005,
  momentum = true,
  momentumDecay = 0.92,
}: UseDragOptions): UseDragReturn {
  const [isDragging, setIsDragging] = useState(false)
  const [velocity, setVelocity] = useState(0)

  const dragState = useRef<DragState>({
    isDragging: false,
    startY: 0,
    startValue: 0,
    currentY: 0,
  })

  const velocityRef = useRef(0)
  const lastYRef = useRef(0)
  const animationRef = useRef<number | null>(null)

  // Clamp value between 0 and 1
  const clamp = (v: number): number => Math.max(0, Math.min(1, v))

  // Handle momentum animation after drag ends
  const animateMomentum = useCallback(() => {
    if (Math.abs(velocityRef.current) < 0.0005) {
      velocityRef.current = 0
      setVelocity(0)
      return
    }

    const newValue = clamp(value + velocityRef.current)
    onChange(newValue)

    velocityRef.current *= momentumDecay
    setVelocity(velocityRef.current)

    animationRef.current = requestAnimationFrame(animateMomentum)
  }, [value, onChange, momentumDecay])

  // Start drag
  const handleDragStart = useCallback((clientY: number) => {
    // Cancel any ongoing momentum animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    dragState.current = {
      isDragging: true,
      startY: clientY,
      startValue: value,
      currentY: clientY,
    }

    lastYRef.current = clientY
    velocityRef.current = 0
    setIsDragging(true)
    setVelocity(0)
  }, [value])

  // Update during drag
  const handleDragMove = useCallback((clientY: number) => {
    if (!dragState.current.isDragging) return

    const deltaY = dragState.current.startY - clientY
    const newValue = clamp(dragState.current.startValue + deltaY * sensitivity)

    // Calculate velocity for momentum
    const instantVelocity = (lastYRef.current - clientY) * sensitivity
    velocityRef.current = instantVelocity * 0.3 + velocityRef.current * 0.7 // Smooth velocity
    lastYRef.current = clientY

    onChange(newValue)
  }, [sensitivity, onChange])

  // End drag
  const handleDragEnd = useCallback(() => {
    if (!dragState.current.isDragging) return

    dragState.current.isDragging = false
    setIsDragging(false)

    // Start momentum animation if enabled and there's velocity
    if (momentum && Math.abs(velocityRef.current) > 0.001) {
      setVelocity(velocityRef.current)
      animationRef.current = requestAnimationFrame(animateMomentum)
    }
  }, [momentum, animateMomentum])

  // Global mouse/touch handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY)
    }

    const handleMouseUp = () => {
      handleDragEnd()
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientY)
      }
    }

    const handleTouchEnd = () => {
      handleDragEnd()
    }

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

  // Cleanup animation on unmount
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
    velocity,
    handlers: {
      onMouseDown,
      onTouchStart,
    },
  }
}
