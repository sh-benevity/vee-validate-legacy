import { createHooks } from "sync-hookable"

export type VeeValidateLegacyHooks = {
  "change:locale": () => void
}

const EVENT_BUS = createHooks<VeeValidateLegacyHooks>()

export function localeChanged() {
  EVENT_BUS.callHook("change:locale")
}

export { EVENT_BUS }
