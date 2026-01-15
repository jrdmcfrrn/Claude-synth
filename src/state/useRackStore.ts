import { create } from 'zustand'

export type ModuleType =
  | 'DroneOscillator'
  | 'TidalFilter'
  | 'ReverbPool'
  | 'BreathLFO'
  | 'DelayDrift'
  | 'OutputModule'

export interface ModuleInstance {
  id: string
  type: ModuleType
  slotIndex: number
}

interface RackState {
  // 4 slots, each can hold one module or be empty
  slots: (ModuleInstance | null)[]

  // Add a module to a specific slot
  addModule: (slotIndex: number, type: ModuleType) => void

  // Remove a module from a slot
  removeModule: (slotIndex: number) => void

  // Move a module from one slot to another
  moveModule: (fromSlot: number, toSlot: number) => void

  // Get module at slot
  getModuleAt: (slotIndex: number) => ModuleInstance | null
}

let moduleIdCounter = 0
const generateModuleId = (type: ModuleType): string => {
  return `${type}-${++moduleIdCounter}`
}

export const useRackStore = create<RackState>((set, get) => ({
  slots: [null, null, null, null],

  addModule: (slotIndex, type) => {
    if (slotIndex < 0 || slotIndex > 3) return

    const newModule: ModuleInstance = {
      id: generateModuleId(type),
      type,
      slotIndex,
    }

    set((state) => {
      const newSlots = [...state.slots]
      newSlots[slotIndex] = newModule
      return { slots: newSlots }
    })
  },

  removeModule: (slotIndex) => {
    if (slotIndex < 0 || slotIndex > 3) return

    set((state) => {
      const newSlots = [...state.slots]
      newSlots[slotIndex] = null
      return { slots: newSlots }
    })
  },

  moveModule: (fromSlot, toSlot) => {
    if (fromSlot < 0 || fromSlot > 3 || toSlot < 0 || toSlot > 3) return

    set((state) => {
      const newSlots = [...state.slots]
      const module = newSlots[fromSlot]

      if (module) {
        newSlots[fromSlot] = newSlots[toSlot]
        newSlots[toSlot] = { ...module, slotIndex: toSlot }

        // Update the swapped module's slotIndex if it exists
        if (newSlots[fromSlot]) {
          newSlots[fromSlot] = { ...newSlots[fromSlot]!, slotIndex: fromSlot }
        }
      }

      return { slots: newSlots }
    })
  },

  getModuleAt: (slotIndex) => {
    return get().slots[slotIndex] ?? null
  },
}))
