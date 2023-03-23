import { defineRuleParamConfig, StringOrNumber } from "../types"

type Separator = "dot" | "comma"

const validate = (
  value: StringOrNumber | StringOrNumber[],
  params: { decimals?: number; separator?: Separator } = {}
): boolean => {
  const { decimals = 0, separator = "dot" } = params
  const separators = {
    dot: "\\.",
    comma: ",",
  } as const

  const delimiterRegexPart = `${separators[separator]}?`
  const decimalRegexPart = decimals === 0 ? "\\d*" : `(\\d{${decimals}})?`
  const regex = new RegExp(`^-?\\d+${delimiterRegexPart}${decimalRegexPart}$`)

  return Array.isArray(value) ? value.every((val) => regex.test(String(val))) : regex.test(String(value))
}

const params = [
  defineRuleParamConfig({
    name: "decimals",
    default: 0,
  }),
  defineRuleParamConfig({
    name: "separator",
    default: "dot",
  }),
] as const

export { validate, params }

export default {
  validate,
  params,
}
