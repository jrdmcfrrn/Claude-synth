import { useEffect } from 'react'
import { Room } from './components/Room'
import { SynthRack } from './components/SynthRack'
import { EntryScreen } from './components/EntryScreen'
import { useSessionStore } from './state/useSessionStore'
import { useRackStore } from './state/useRackStore'
import './index.css'

function App() {
  const hasEntered = useSessionStore((state) => state.hasEntered)
  const addModule = useRackStore((state) => state.addModule)

  // Initialize with demo modules when entering
  useEffect(() => {
    if (hasEntered) {
      // Add demo modules to showcase the UI
      // In MVP, we start with modules already in place
      addModule(0, 'DroneOscillator')
      addModule(1, 'TidalFilter')
      addModule(2, 'ReverbPool')
      // Slot 3 left empty to show the slot state
    }
  }, [hasEntered, addModule])

  return (
    <div className="w-full h-screen overflow-hidden">
      {/* Entry screen - shows until user clicks to start audio */}
      {!hasEntered && <EntryScreen />}

      {/* Main experience */}
      <Room>
        <SynthRack />
      </Room>
    </div>
  )
}

export default App
