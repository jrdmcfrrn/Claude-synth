import { create } from 'zustand'

export interface ParamValue {
  value: number      // 0-1 normalized
  displayValue: string // Human readable
}

interface ParamState {
  // Map of moduleId -> paramName -> value
  params: Record<string, Record<string, ParamValue>>

  // Set a parameter value
  setParam: (moduleId: string, paramName: string, value: number, displayValue?: string) => void

  // Get a parameter value
  getParam: (moduleId: string, paramName: string) => ParamValue | null

  // Initialize params for a module
  initModule: (moduleId: string, params: Record<string, ParamValue>) => void

  // Remove all params for a module
  removeModule: (moduleId: string) => void
}

export const useParamStore = create<ParamState>((set, get) => ({
  params: {},

  setParam: (moduleId, paramName, value, displayValue) => {
    set((state) => {
      const moduleParams = state.params[moduleId] ?? {}
      const display = displayValue ?? `${Math.round(value * 100)}%`

      return {
        params: {
          ...state.params,
          [moduleId]: {
            ...moduleParams,
            [paramName]: { value, displayValue: display },
          },
        },
      }
    })
  },

  getParam: (moduleId, paramName) => {
    const state = get()
    return state.params[moduleId]?.[paramName] ?? null
  },

  initModule: (moduleId, params) => {
    set((state) => ({
      params: {
        ...state.params,
        [moduleId]: params,
      },
    }))
  },

  removeModule: (moduleId) => {
    set((state) => {
      const { [moduleId]: _, ...rest } = state.params
      return { params: rest }
    })
  },
}))
