import { defineRuleParamConfig, StringOrNumber } from "../types"

const validate = (value: StringOrNumber | StringOrNumber[], { length }: Record<string, any>): boolean => {
  if (Array.isArray(value)) {
    return value.every((val) => validate(val, { length }))
  }
  const strVal = String(value)

  return /^[0-9]*$/.test(strVal) && strVal.length === length
}

const params = [
  defineRuleParamConfig({
    name: "length",
    cast(value) {
      return Number(value)
    },
  }),
] as const

export { validate, params }

export default {
  validate,
  params,
}
