import { useState, useCallback } from 'react'
import audioEngine from '../engine/AudioEngine'
import { driftConductor } from '../engine/DriftConductor'
import { useSessionStore } from '../state/useSessionStore'

/**
 * EntryScreen - "Opening the door" to a room where sound is already playing
 *
 * The visual treatment suggests life behind the door:
 * - Pulsing glow indicates LEDs are lit
 * - Waveform hint suggests audio is happening
 *
 * On enter:
 * - Audio context initializes
 * - Drift conductor starts
 * - Scene fades in over 1s (room brightens)
 * - Audio fades in over 800ms (ears adjusting to the space)
 */

export function EntryScreen() {
  const [isEntering, setIsEntering] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const setHasEntered = useSessionStore((state) => state.setHasEntered)
  const setAudioState = useSessionStore((state) => state.setAudioState)
  const setIsPlaying = useSessionStore((state) => state.setIsPlaying)

  const handleEnter = useCallback(async () => {
    if (isEntering) return

    setIsEntering(true)

    try {
      // Initialize audio engine (requires user gesture)
      await audioEngine.initialize()
      setAudioState('running')

      // Initialize and start the drift conductor
      driftConductor.initialize()
      driftConductor.start()

      // Start fade out animation (the "door opening")
      setFadeOut(true)

      // Mark as playing after audio fade-in time (800ms)
      setTimeout(() => {
        setIsPlaying(true)
      }, 800)

      // Transition complete after visual fade (1000ms)
      setTimeout(() => {
        setHasEntered(true)
      }, 1000)
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      setIsEntering(false)
    }
  }, [isEntering, setHasEntered, setAudioState, setIsPlaying])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-1000"
      style={{
        background: 'linear-gradient(180deg, #1a1f3c 0%, #0f1225 100%)',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Warm glow bleeding through (suggests light in the room beyond) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 70% 50%, rgba(255, 179, 71, 0.06) 0%, transparent 50%)',
        }}
      />

      {/* Subtle hint of synth LEDs (pulsing) */}
      <div className="absolute right-[15%] top-1/2 -translate-y-1/2 flex flex-col gap-3 opacity-30">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: '#4ecdc4',
              boxShadow: '0 0 8px #4ecdc4',
              animation: `ledPulse 3s ease-in-out ${i * 0.5}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Subtle waveform suggestion (implies sound is happening) */}
      <div
        className="absolute bottom-[20%] left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-20"
      >
        {[0.3, 0.6, 1, 0.7, 0.4, 0.8, 0.5].map((h, i) => (
          <div
            key={i}
            className="w-0.5 rounded-full"
            style={{
              height: `${h * 20}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              animation: `wavePulse 2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>

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

        {/* Enter button - styled as "opening a door" */}
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
          {/* Hover background - warm light bleeding through */}
          <div
            className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            style={{
              background: 'linear-gradient(180deg, rgba(255,179,71,0.15) 0%, rgba(255,127,110,0.1) 100%)',
            }}
          />

          {/* Button text */}
          <span
            className="relative text-sm tracking-[0.4em] uppercase transition-colors duration-300"
            style={{
              color: isEntering ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {isEntering ? 'Waking up...' : 'Enter'}
          </span>

          {/* Loading indicator - like a door slowly opening */}
          {isEntering && (
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-0.5 overflow-hidden rounded-full"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #ffb347, #ff7f6e)',
                  animation: 'doorOpen 1s ease-out forwards',
                }}
              />
            </div>
          )}
        </button>

        {/* Subtitle - evokes the feeling */}
        <p
          className="text-xs max-w-xs text-center leading-relaxed"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          A beachside bedroom at dusk.
          <br />
          Something is already humming softly.
        </p>
      </div>

      {/* Corner decorations - frame like a doorway */}
      <div
        className="absolute top-8 left-8 w-12 h-12 border-l border-t"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      />
      <div
        className="absolute bottom-8 right-8 w-12 h-12 border-r border-b"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      />

      <style>{`
        @keyframes ledPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }

        @keyframes wavePulse {
          0%, 100% {
            transform: scaleY(1);
            opacity: 0.3;
          }
          50% {
            transform: scaleY(1.4);
            opacity: 0.6;
          }
        }

        @keyframes doorOpen {
          0% {
            width: 0%;
            transform: translateX(-50%);
          }
          100% {
            width: 100%;
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  )
}
