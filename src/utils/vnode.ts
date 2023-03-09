import {
  ComponentPublicInstance,
  DirectiveBinding,
  vModelCheckbox,
  vModelDynamic,
  vModelRadio,
  vModelSelect,
  vModelText,
  VNode,
} from "vue"
import { find, includes, isCallable, isNullOrUndefined, isSpecified } from "./index"
import { normalizeRules } from "./rules"
import { RuleContainer } from "../extend"
import { VModel } from "../types"

export const isTextInput = (vnode: VNode): boolean => {
  const attrs = vnode.props

  // it will fall back to being a text input per browsers spec.
  if (vnode.type === "input" && (!attrs || !attrs.type)) {
    return true
  }

  if (vnode.type === "textarea") {
    return true
  }

  return includes(["text", "password", "search", "email", "tel", "url", "number"], attrs?.type)
}

// export const isCheckboxOrRadioInput = (vnode: VNode): boolean => {
//   const attrs = (vnode.data && vnode.data.attrs) || vnode.elm;

//   return includes(['radio', 'checkbox'], attrs && attrs.type);
// };

// Gets the model object on the vnode.
export function findModel(vnode: VNode): DirectiveBinding | VModel | undefined {
  if (!vnode.dirs && !vnode.props) {
    return undefined
  }

  if (vnode.dirs && vnode.dirs.length > 0) {
    return find(vnode.dirs, (d) =>
      [vModelText, vModelCheckbox, vModelRadio, vModelSelect, vModelDynamic].includes(d.dir)
    )
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const propKeys = Object.keys(vnode.props)
  if (
    !(vnode.type === "input" && vnode.props?.onInput) &&
    !propKeys.includes("onUpdate:modelValue") &&
    propKeys.filter((key) => key.startsWith("onUpdate:")).length != 1
  ) {
    return undefined
  }

  if (vnode.type === "input" && vnode.props?.onInput) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return { value: vnode.props.value, onInput: vnode.props.onInput }
  }

  const modelKey = propKeys.includes("onUpdate:modelValue")
    ? "modelValue"
    : propKeys.filter((key) => key.startsWith("onUpdate:"))[0].replace(/^onUpdate:/g, "")
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (vnode.props[`onUpdate:${modelKey}`]) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const model = { value: vnode.props[modelKey] }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    model[`onUpdate:${modelKey}`] = vnode.props[`onUpdate:${modelKey}`]
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return model
  }
}

export function findValue(vnode: VNode): { value: any } | undefined {
  const model = findModel(vnode)
  if (model) {
    return { value: model.value }
  }

  const config = findModelConfig(vnode)
  const prop = config?.prop || "value"
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (vnode.componentOptions?.propsData && prop in vnode.componentOptions.propsData) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const propsDataWithValue = vnode.componentOptions.propsData as any
    return { value: propsDataWithValue[prop] }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (vnode.data?.domProps && "value" in vnode.data.domProps) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return { value: vnode.data.domProps.value }
  }

  return undefined
}

function extractChildren(vnode: VNode | VNode[]): VNode[] {
  if (Array.isArray(vnode)) {
    return vnode
  }

  if (Array.isArray(vnode.children)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return vnode.children
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (vnode.componentOptions && Array.isArray(vnode.componentOptions.children)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return vnode.componentOptions.children
  }

  return []
}

export function findInputNodes(vnode: VNode | VNode[]): VNode[] {
  if (!Array.isArray(vnode) && findValue(vnode) !== undefined) {
    return [vnode]
  }

  const children = extractChildren(vnode)

  return children.reduce((nodes: VNode[], node): VNode[] => {
    const candidates = findInputNodes(node)
    if (candidates.length) {
      nodes.push(...candidates)
    }

    return nodes
  }, [])
}

// Resolves v-model config if exists.
export function findModelConfig(vnode: VNode): { prop: string; event: string } | null {
  /* istanbul ignore next */
  if (!vnode.props) {
    return null
  }

  const propKeys = Object.keys(vnode.props)
  if (!propKeys.includes("onUpdate:modelValue") && propKeys.filter((key) => key.startsWith("onUpdate:")).length != 1) {
    return null
  }

  const modelKey = propKeys.includes("onUpdate:modelValue")
    ? "modelValue"
    : propKeys.filter((key) => key.startsWith("onUpdate:"))[0].replace(/^onUpdate:/g, "")
  return { prop: modelKey, event: `onUpdate:${modelKey}` }
}

// Adds a listener to vnode listener object.
export function mergeVNodeListeners(obj: any, eventName: string, handler: Function): void {
  // no listener at all.
  if (isNullOrUndefined(obj[eventName])) {
    obj[eventName] = [handler]
    return
  }

  // Is an invoker.
  if (isCallable(obj[eventName]) && obj[eventName].fns) {
    const invoker = obj[eventName]
    invoker.fns = Array.isArray(invoker.fns) ? invoker.fns : [invoker.fns]
    if (!includes(invoker.fns, handler)) {
      invoker.fns.push(handler)
    }

    return
  }

  if (isCallable(obj[eventName])) {
    const prev = obj[eventName]
    obj[eventName] = [prev]
  }

  if (Array.isArray(obj[eventName]) && !includes(obj[eventName], handler)) {
    obj[eventName].push(handler)
  }
}

// Adds a listener to a native HTML vnode.
function addNativeNodeListener(node: VNode, eventName: string, handler: Function): void {
  /* istanbul ignore next */
  if (!node.props) {
    node.props = {}
  }

  mergeVNodeListeners(node.props, eventName, handler)
}

// Adds a listener to a Vue component vnode.
function addComponentNodeListener(node: VNode, eventName: string, handler: Function): void {
  /* istanbul ignore next */
  if (!node.props) {
    node.props = {}
  }

  mergeVNodeListeners(node.props, eventName, handler)
}

export function addVNodeListener(vnode: VNode, eventName: string, handler: Function): void {
  if (typeof vnode.type === "object") {
    addComponentNodeListener(vnode, eventName, handler)
    return
  }

  addNativeNodeListener(vnode, eventName, handler)
}

// Determines if `change` should be used over `input` for listeners.
export function getInputEventName(vnode: VNode, model?: DirectiveBinding): string {
  // Is a component.
  if (typeof vnode.type !== "string") {
    const { event } = findModelConfig(vnode) || { event: "onUpdate:modelValue" }

    return event || "onUpdate:modelValue"
  }

  // Lazy Models typically use change event
  if (model?.modifiers?.lazy) {
    return "onChange"
  }

  // is a textual-type input.
  if (isTextInput(vnode)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return model?.onInput ? "onInput" : "onUpdate:modelValue"
  }

  return "onChange"
}

export function isHTMLNode(node: VNode) {
  return includes(["input", "select", "textarea"], node.type)
}

// TODO: Type this one properly.
export function normalizeSlots(slots: any, ctx: VNode): VNode[] {
  const acc: VNode[] = []

  return Object.keys(slots).reduce((arr, key): VNode[] => {
    slots[key].forEach((vnode: VNode): void => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (!vnode.context) {
        slots[key].context = ctx
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (!vnode.data) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          vnode.data = {}
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        vnode.data.slot = key
      }
    })

    return arr.concat(slots[key])
  }, acc)
}

function resolveTextualRules(vnode: VNode): Record<string, any> {
  const attrs = vnode.props
  const rules: Record<string, any> = {}

  if (!attrs) {
    return rules
  }

  if (attrs.type === "email" && RuleContainer.getRuleDefinition("email")) {
    rules.email = ["multiple" in attrs]
  }

  if (attrs.pattern && RuleContainer.getRuleDefinition("regex")) {
    rules.regex = attrs.pattern
  }

  if (attrs.maxlength >= 0 && RuleContainer.getRuleDefinition("max")) {
    rules.max = attrs.maxlength
  }

  if (attrs.minlength >= 0 && RuleContainer.getRuleDefinition("min")) {
    rules.min = attrs.minlength
  }

  if (attrs.type === "number") {
    if (isSpecified(attrs.min) && RuleContainer.getRuleDefinition("min_value")) {
      rules.min_value = Number(attrs.min)
    }

    if (isSpecified(attrs.max) && RuleContainer.getRuleDefinition("max_value")) {
      rules.max_value = Number(attrs.max)
    }
  }

  return rules
}

export function resolveRules(vnode: VNode) {
  const htmlTags = ["input", "select", "textarea"]
  const attrs = vnode.props

  if (!includes(htmlTags, vnode.type) || !attrs) {
    return {}
  }

  const rules: Record<string, any> = {}
  if ("required" in attrs && attrs.required !== false && RuleContainer.getRuleDefinition("required")) {
    rules.required = attrs.type === "checkbox" ? [true] : true
  }

  if (isTextInput(vnode)) {
    return normalizeRules({ ...rules, ...resolveTextualRules(vnode) })
  }

  return normalizeRules(rules)
}

export function normalizeChildren(context: ComponentPublicInstance, slotProps: any): VNode[] {
  if (context.$slots.default) {
    return context.$slots.default(slotProps) || []
  }

  return context.$slots.default || []
}
