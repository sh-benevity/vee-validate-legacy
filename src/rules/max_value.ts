import { isNullOrUndefined } from "../utils"
import { defineRuleParamConfig, StringOrNumber, ValidationRuleFunction } from "../types"

const validate: ValidationRuleFunction<StringOrNumber | StringOrNumber[], typeof params> = (
  value: StringOrNumber | StringOrNumber[],
  { max }: Record<string, any>
) => {
  if (isNullOrUndefined(value) || value === "") {
    return false
  }

  if (Array.isArray(value)) {
    return value.length > 0 && value.every((val) => validate(val, { max }))
  }

  return Number(value) <= max
}

const params = [
  defineRuleParamConfig({
    name: "max",
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
