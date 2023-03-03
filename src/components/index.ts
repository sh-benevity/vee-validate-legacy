import { ValidationResult, VeeObserver, VNodeWithVeeContext } from '@/types';

declare module "vue" {
  interface ComponentCustomProperties {
    $_veeObserver: VeeObserver
    _needsValidation: boolean
    _inputEventName: string
    _ignoreImmediate: boolean
    _pendingValidation?: Promise<ValidationResult>
    _pendingReset?: boolean
    _resolvedRules: any
    _regenerateMap?: Record<string, () => string>
    _veeWatchers: Record<string, Function>
    $veeDebounce?: number
    $veeHandler?: Function
    $veeOnInput?: Function
    $veeOnBlur?: Function
    $vnode: VNodeWithVeeContext
    $localeHandler: Function
  }
}

export { ValidationProvider } from "./Provider"
export { ValidationObserver } from "./Observer"
export { withValidation } from "./withValidation"
