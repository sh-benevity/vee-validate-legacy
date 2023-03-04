import { createHooks, Hookable } from "sync-hookable"

export interface VueHooks {
  "hook:mounted": () => void
}

export type VueHookable = Hookable<VueHooks>
const hookMaps = new Map<any, VueHookable>()

export function generateVueHooks(obj: any): VueHookable {
  const hookable = createHooks<VueHooks>()
  hookMaps.set(obj, hookable)
  return hookable
}

export function getVueHooks(obj: any): VueHookable {
  const hookable = hookMaps.get(obj) || createHooks<VueHooks>()

  if (!hookMaps.has(obj)) {
    hookMaps.set(obj, hookable)
  }

  return hookable
}
