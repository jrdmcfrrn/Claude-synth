import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModuleInstance } from '../engine/ModuleInstance'

/**
 * Parameter Store - Source of Record (not real-time truth)
 *
 * This store is for PERSISTENCE and SNAPSHOTS, not real-time audio control.
 *
 * Architecture:
 * - During drag: Audio params updated directly via ModuleInstance.setParamImmediate()
 * - On release: commitParam() saves the final value here for persistence
 * - On mount: Store hydrates ModuleInstance params from saved state
 *
 * This decouples React rendering from audio updates, eliminating latency.
 */

export interface StoredParam {
  value: number        // 0-1 normalized
  displayValue: string // Human readable (for UI restore without recalculating)
}

export interface StoredModule {
  id: string
  type: string
  slotIndex: number
  params: Record<string, StoredParam>
  isPowered: boolean
}

interface ParamStoreState {
  // Stored module states (persisted)
  modules: Record<string, StoredModule>

  // Commit a parameter value (called on pointer release)
  commitParam: (moduleId: string, paramName: string, value: number, displayValue: string) => void

  // Commit power state
  commitPower: (moduleId: string, isPowered: boolean) => void

  // Initialize store entry from a ModuleInstance
  initFromModule: (module: ModuleInstance, slotIndex: number) => void

  // Get stored state for a module (for hydration)
  getStoredModule: (moduleId: string) => StoredModule | null

  // Remove a module from storage
  removeModule: (moduleId: string) => void

  // Get all stored modules (for session restore)
  getAllStoredModules: () => StoredModule[]

  // Clear all stored state
  clearAll: () => void
}

export const useParamStore = create<ParamStoreState>()(
  persist(
    (set, get) => ({
      modules: {},

      commitParam: (moduleId, paramName, value, displayValue) => {
        set((state) => {
          const existingModule = state.modules[moduleId]
          if (!existingModule) return state

          return {
            modules: {
              ...state.modules,
              [moduleId]: {
                ...existingModule,
                params: {
                  ...existingModule.params,
                  [paramName]: { value, displayValue },
                },
              },
            },
          }
        })
      },

      commitPower: (moduleId, isPowered) => {
        set((state) => {
          const existingModule = state.modules[moduleId]
          if (!existingModule) return state

          return {
            modules: {
              ...state.modules,
              [moduleId]: {
                ...existingModule,
                isPowered,
              },
            },
          }
        })
      },

      initFromModule: (module, slotIndex) => {
        const params: Record<string, StoredParam> = {}

        for (const paramConfig of module.config.params) {
          const value = module.getParam(paramConfig.name)
          params[paramConfig.name] = {
            value,
            displayValue: paramConfig.format(value),
          }
        }

        set((state) => ({
          modules: {
            ...state.modules,
            [module.id]: {
              id: module.id,
              type: module.type,
              slotIndex,
              params,
              isPowered: module.isPowered,
            },
          },
        }))
      },

      getStoredModule: (moduleId) => {
        return get().modules[moduleId] ?? null
      },

      removeModule: (moduleId) => {
        set((state) => {
          const { [moduleId]: _, ...rest } = state.modules
          return { modules: rest }
        })
      },

      getAllStoredModules: () => {
        return Object.values(get().modules)
      },

      clearAll: () => {
        set({ modules: {} })
      },
    }),
    {
      name: 'tideland-synth-params',
      // Only persist the modules object
      partialize: (state) => ({ modules: state.modules }),
    }
  )
)

/**
 * Hydrate a ModuleInstance from stored state.
 * Call this after creating a module to restore saved params.
 */
export function hydrateModuleFromStore(module: ModuleInstance): boolean {
  const stored = useParamStore.getState().getStoredModule(module.id)
  if (!stored) return false

  // Restore each param
  for (const [paramName, { value }] of Object.entries(stored.params)) {
    module.setParamImmediate(paramName, value)
  }

  // Restore power state
  module.setPower(stored.isPowered)

  return true
}
