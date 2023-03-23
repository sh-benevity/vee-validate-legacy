import { App, VNode } from "vue"
import { ValidationObserver } from "./components/Observer"
import { ValidationProvider } from "./components/Provider"

export type ProviderInstance = InstanceType<typeof ValidationProvider>

export type ObserverInstance = InstanceType<typeof ValidationObserver>

export interface VeeObserver {
  refs: Record<string, ProviderInstance>
  observe(provider: any, type?: "provider" | "observer"): void
  unobserve(id: string, type?: "provider" | "observer"): void
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  failedRules: Record<string, string>
  regenerateMap?: Record<string, () => string>
  required?: boolean
}

export type VueValidationContext = App & {
  $_veeObserver?: VeeObserver
}

export type Locator = { __locatorRef: string } & Function

export interface ValidationMessageGenerator {
  (field: string, params: Record<string, any>): string
}

export type ValidationMessageTemplate = string | ValidationMessageGenerator

export interface ValidationRuleResult {
  data?: Record<string, any>
  valid: boolean
  required?: boolean
}

export type ValidationRuleFunction<V, AP extends ReadonlyArray<RuleParamSchema<string, unknown>>> = (
  value: V,
  params: ValidationParams<AP>
) => boolean | string | ValidationRuleResult | Promise<boolean | string | ValidationRuleResult>

export interface RuleParamConfig<N extends string, T> {
  name: N
  isTarget?: boolean
  default?: T
  cast?(value: any): T
}

export type RuleParamSchema<N extends string, T> = (string & T) | RuleParamConfig<N, T>

export type RuleParamConfigOfSchema<S extends RuleParamSchema<string, unknown>> = S extends string
  ? RuleParamConfig<S, S>
  : S extends RuleParamConfig<infer N, infer T>
  ? RuleParamConfig<N, T>
  : never

export type RuleParams<AP extends ReadonlyArray<RuleParamSchema<string, unknown>>> = AP & {
  [I: number]: RuleParamConfigOfSchema<AP[typeof I]>
}

export interface ValidationRuleSchema<V, AP extends ReadonlyArray<RuleParamSchema<string, unknown>>> {
  validate?: ValidationRuleFunction<V, AP>
  params?: AP
  message?: ValidationMessageTemplate
  lazy?: boolean
  computesRequired?: boolean
  castValue?(value: any): any
}

export type ValidationParams<AP extends ReadonlyArray<RuleParamSchema<string, unknown>>> = {
  [K in AP extends ReadonlyArray<infer RP>
    ? RP extends RuleParamSchema<infer TK, infer _>
      ? TK
      : never
    : never]: AP extends ReadonlyArray<infer RP> ? (RP extends RuleParamSchema<K, infer TV> ? TV : never) : never
}

export function defineValidation<V, AP extends ReadonlyArray<RuleParamSchema<string, unknown>>>(
  validation: ValidationRuleSchema<V, AP>
): ValidationRuleSchema<V, AP> {
  return validation
}

export function defineRuleParamConfig<N extends string, T>(
  ruleParamConfig: RuleParamConfig<N, T>
): RuleParamConfig<N, T> {
  return ruleParamConfig
}

export type ValidationRule<V, AP extends ReadonlyArray<RuleParamSchema<string, unknown>>> =
  | ValidationRuleFunction<V, AP>
  | ValidationRuleSchema<V, AP>

export type StringOrNumber = string | number

// Extracts explicit keys of an interface without index signature
// https://stackoverflow.com/questions/51465182/typescript-remove-index-signature-using-mapped-types
export type KnownKeys<T> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K
} extends { [_ in keyof T]: infer U }
  ? U
  : never

export interface ValidationFlags {
  untouched: boolean
  touched: boolean
  dirty: boolean
  pristine: boolean
  valid: boolean
  invalid: boolean
  passed: boolean
  failed: boolean
  validated: boolean
  pending: boolean
  required: boolean
  changed: boolean
  [x: string]: boolean | undefined
}

export interface InactiveRefCache {
  id: string
  errors: string[]
  flags: ValidationFlags
  failedRules: Record<string, string>
}

export type VNodeWithVeeContext = VNode & {
  context: App & {
    $_veeObserver?: VeeObserver
  }
}

export interface VModel {
  value: any
  "onUpdate:modelValue": Function
}

export function isVModel(obj: any) {
  const keys = Object.keys(obj)

  return (
    keys.includes("value") &&
    (keys.includes("onUpdate:modelValue") || keys.filter((key) => key.startsWith("onUpdate:")).length === 1)
  )
}
