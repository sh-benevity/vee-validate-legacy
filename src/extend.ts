import { RuleParams, RuleParamSchema, ValidationRule, ValidationRuleSchema } from "./types"
import { isCallable, merge } from "./utils"

interface NormalizedRuleSchema<V, AP extends ReadonlyArray<RuleParamSchema<string, unknown>>>
  extends ValidationRuleSchema<V, AP> {
  params?: RuleParams<AP>
}

const RULES: { [k: string]: NormalizedRuleSchema<unknown, ReadonlyArray<RuleParamSchema<string, unknown>>> } = {}

function normalizeSchema<V, AP extends ReadonlyArray<RuleParamSchema<string, unknown>>>(
  schema: ValidationRuleSchema<V, AP>
): NormalizedRuleSchema<V, AP> {
  if (schema.params?.length) {
    const params = schema.params.map((param) => {
      if (typeof param === "string") {
        return { name: param }
      }

      return param
    })

    return <NormalizedRuleSchema<V, AP>>(<unknown>{
      ...schema,
      params: params,
    })
  }

  return schema as NormalizedRuleSchema<V, AP>
}

export class RuleContainer {
  public static extend<
    V,
    AP extends ReadonlyArray<RuleParamSchema<string, unknown>> = ReadonlyArray<RuleParamSchema<string, unknown>>
  >(name: string, schema: ValidationRuleSchema<V, AP>) {
    // if rule already exists, overwrite it.
    const rule = normalizeSchema(schema)
    if (RULES[name]) {
      RULES[name] = merge(RULES[name], schema)
      return
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    RULES[name] = <NormalizedRuleSchema<V, AP>>(<unknown>{
      lazy: false,
      computesRequired: false,
      ...rule,
    })
  }

  public static isLazy(name: string) {
    return !!RULES[name]?.lazy
  }

  public static isRequireRule(name: string): boolean {
    return RULES[name]?.computesRequired || false
  }

  public static getRuleDefinition(ruleName: string) {
    return RULES[ruleName]
  }
}

/**
 * Adds a custom validator to the list of validation rules.
 */
export function extend<V, AP extends ReadonlyArray<RuleParamSchema<string, unknown>>>(
  name: string,
  schema: ValidationRule<V, AP>
) {
  // makes sure new rules are properly formatted.
  guardExtend(name, schema)

  // Full schema object.
  if (typeof schema === "object") {
    RuleContainer.extend(name, schema)
    return
  }

  RuleContainer.extend(name, {
    validate: schema,
  })
}

/**
 * Guards from extension violations.
 */
function guardExtend<V, AP extends ReadonlyArray<RuleParamSchema<string, unknown>>>(
  name: string,
  validator: ValidationRule<V, AP>
) {
  if (isCallable(validator)) {
    return
  }

  if (isCallable(validator.validate)) {
    return
  }

  if (RuleContainer.getRuleDefinition(name)) {
    return
  }

  throw new Error(`Extension Error: The validator '${name}' must be a function or have a 'validate' method.`)
}
