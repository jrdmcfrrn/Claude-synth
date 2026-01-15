import { create } from 'zustand'
import type { AudioEngineState } from '../engine/AudioEngine'

interface SessionState {
  // Audio state
  audioState: AudioEngineState
  setAudioState: (state: AudioEngineState) => void

  // Has the user entered the experience?
  hasEntered: boolean
  setHasEntered: (entered: boolean) => void

  // Is the synth currently making sound?
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  audioState: 'uninitialized',
  setAudioState: (audioState) => set({ audioState }),

  hasEntered: false,
  setHasEntered: (hasEntered) => set({ hasEntered }),

  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
}))
