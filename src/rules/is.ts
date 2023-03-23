import { defineRuleParamConfig } from "../types"

const validate = (value: any, { other }: Record<string, any>) => {
  return value === other
}

const params = [
  defineRuleParamConfig({
    name: "other",
  }),
] as const

export { validate, params }

export default {
  validate,
  params,
}
