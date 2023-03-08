export { validate } from "./validate"
export { extend } from "./extend"
export { configure } from "./config"
export { setInteractionMode } from "./modes"
export { localize } from "./localize"
export { localeChanged } from "./localeChanged"
export { ValidationProvider, ValidationObserver, withValidation } from "./components"
export { normalizeRules } from "./utils/rules"
export {
  alpha_dash,
  alpha_num,
  alpha_spaces,
  alpha,
  between,
  confirmed,
  digits,
  dimensions,
  double,
  email,
  ext,
  image,
  oneOf,
  integer,
  length,
  is_not,
  is,
  max,
  max_value,
  mimes,
  min,
  min_value,
  excluded,
  numeric,
  regex,
  required,
  required_if,
  size,
} from "./rules"

const version = "__VERSION__"

export { version }
