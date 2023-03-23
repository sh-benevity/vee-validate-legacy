import { validate as includes } from "./oneOf"
import { ValidationRuleFunction } from "../types"

const validate: ValidationRuleFunction<any[], []> = (value, args) => {
  return !includes(value, args)
}

export { validate }

export default {
  validate,
}
