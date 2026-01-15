import { useState, useCallback } from 'react'
import audioEngine from '../engine/AudioEngine'
import { useSessionStore } from '../state/useSessionStore'

export function EntryScreen() {
  const [isEntering, setIsEntering] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const setHasEntered = useSessionStore((state) => state.setHasEntered)
  const setAudioState = useSessionStore((state) => state.setAudioState)

  const handleEnter = useCallback(async () => {
    if (isEntering) return

    setIsEntering(true)

    try {
      // Initialize audio engine (requires user gesture)
      await audioEngine.initialize()
      setAudioState('running')

      // Start fade out animation
      setFadeOut(true)

      // Wait for fade animation then mark as entered
      setTimeout(() => {
        setHasEntered(true)
      }, 1000)
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      setIsEntering(false)
    }
  }, [isEntering, setHasEntered, setAudioState])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-1000"
      style={{
        background: 'linear-gradient(180deg, #1a1f3c 0%, #0f1225 100%)',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Ambient glow effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 40%, rgba(255, 179, 71, 0.08) 0%, transparent 60%)',
        }}
      />

      {/* Content */}
      <div className="flex flex-col items-center gap-8">
        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-3xl font-light tracking-[0.5em] uppercase"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            Tideland
          </h1>
          <p
            className="text-sm tracking-[0.3em] uppercase"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            Synth
          </p>
        </div>

        {/* Decorative line */}
        <div
          className="w-32 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          }}
        />

        {/* Enter button */}
        <button
          onClick={handleEnter}
          disabled={isEntering}
          className="group relative px-8 py-4 overflow-hidden transition-all duration-300 focus:outline-none"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 4,
          }}
        >
          {/* Hover background */}
          <div
            className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            style={{
              background: 'linear-gradient(180deg, rgba(255,179,71,0.1) 0%, rgba(255,127,110,0.1) 100%)',
            }}
          />

          {/* Button text */}
          <span
            className="relative text-sm tracking-[0.4em] uppercase transition-colors duration-300"
            style={{
              color: isEntering ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {isEntering ? 'Entering...' : 'Enter'}
          </span>

          {/* Loading indicator */}
          {isEntering && (
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 overflow-hidden rounded-full"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #ffb347, #ff7f6e)',
                  animation: 'loadingSlide 1s ease-in-out infinite',
                }}
              />
            </div>
          )}
        </button>

        {/* Subtitle */}
        <p
          className="text-xs max-w-xs text-center leading-relaxed"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          A beachside bedroom at dusk.
          <br />
          Touch things. Sound happens.
        </p>
      </div>

      {/* Corner decorations */}
      <div
        className="absolute top-8 left-8 w-12 h-12 border-l border-t"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      />
      <div
        className="absolute bottom-8 right-8 w-12 h-12 border-r border-b"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      />

      <style>{`
        @keyframes loadingSlide {
          0% {
            transform: translateX(-100%);
            width: 30%;
          }
          50% {
            width: 50%;
          }
          100% {
            transform: translateX(300%);
            width: 30%;
          }
        }
      `}</style>
    </div>
  )
}
