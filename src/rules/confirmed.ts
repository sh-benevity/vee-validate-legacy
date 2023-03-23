import { defineRuleParamConfig } from "../types"

const validate = (value: string, { target }: Record<string, any>) => String(value) === String(target)

const params = [
  defineRuleParamConfig({
    name: "target",
    isTarget: true,
  }),
] as const

export { validate, params }

export default {
  validate,
  params,
}
