import { ValidationProvider } from "./Provider"
import { identity } from "../utils"
import {
  findModel,
  findModelConfig,
  findValue,
  getInputEventName,
  mergeVNodeListeners,
  normalizeSlots,
} from "../utils/vnode"
import { Component, h } from "vue"
import { createCommonHandlers, createValidationCtx, onRenderUpdate, ValidationContext } from "./common"
import { getVueHooks } from "@/components/hooks"
import { enableWarn, suppressWarn } from "@/utils/console"

type ValidationContextMapper = (ctx: ValidationContext) => Record<string, any>
type ComponentLike = Component | { options: any }

export function withValidation(component: ComponentLike, mapProps: ValidationContextMapper = identity): Component {
  const options = "options" in component ? component.options : component
  const providerOpts = ValidationProvider as any
  const hoc: any = {
    name: `${options.name || "AnonymousHoc"}WithValidation`,
    props: { ...providerOpts.props },
    data: providerOpts.data,
    computed: { ...providerOpts.computed },
    methods: { ...providerOpts.methods },
    beforeUnmount: providerOpts.beforeUnmount,
    inject: providerOpts.inject,
  }

  const eventName = options?.model?.event || "input"

  hoc.render = function () {
    this.registerField()
    const vctx = createValidationCtx(this)

    const model = findModel(this.$.vnode)
    suppressWarn()
    this._inputEventName = this._inputEventName || getInputEventName(this.$.vnode, model)
    enableWarn()
    const value = findValue(this.$.vnode)
    onRenderUpdate(this, value?.value, getVueHooks(this))

    const { onInput, onBlur, onValidate } = createCommonHandlers(this)

    mergeVNodeListeners(this, eventName, onInput)
    mergeVNodeListeners(this, "onBlur", onBlur)
    this.normalizedEvents.forEach((evt: string) => {
      mergeVNodeListeners(this, evt, onValidate)
    })

    // Props are any attrs not associated with ValidationProvider Plus the model prop.
    // WARNING: Accidental prop overwrite will probably happen.
    const { prop } = findModelConfig(this.$.vnode) || { prop: "value" }
    const props = { ...this.$attrs, ...{ [prop]: model?.value }, ...mapProps(vctx) }

    return h(
      options,
      {
        attrs: this.$attrs,
        props,
      },
      normalizeSlots(this.$slots, this.$.vnode.ctx.ctx)
    )
  }

  return hoc
}
