export type Slice = {
  name: string
  tokens: number
  color: string
  kind: 'used' | 'free' | 'buffer' | 'deferred'
}

export type Limit = {
  kind: string
  percent: number
  resetsAt?: string
}

export type Snapshot = {
  slices: Slice[]
  limits: Limit[]
  used: number
  window: number
  percent: number
}

declare module 'claude-code' {
  interface PluginState {
    'context-bar': { snapshot: Snapshot | null; isOn: boolean; minute: number }
  }
}
