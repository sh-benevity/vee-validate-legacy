import { defineRuleParamConfig, StringOrNumber } from "../types"

const validate = (value: StringOrNumber | StringOrNumber[], { min, max }: Record<string, any> = {}): boolean => {
  if (Array.isArray(value)) {
    return value.every((val) => validate(val, { min, max }))
  }

  return Number(min) <= Number(value) && Number(max) >= Number(value)
}

const params = [
  defineRuleParamConfig({
    name: "min",
  }),
  defineRuleParamConfig({
    name: "max",
  }),
] as const

export { validate, params }

export default {
  validate,
  params,
}
