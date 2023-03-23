// noinspection VueMissingComponentImportInspection,ES6MissingAwait,ES6UnusedImports

import { describe, expect, it } from "vitest"

import { nextTick } from "vue"
import { mount } from "@vue/test-utils"
import flushPromises from "flush-promises"
import { configure, extend, ValidationObserver, ValidationProvider, withValidation } from "../../src/index.full"
import InputWithoutValidation from "./components/InputWithoutValidation.vue"
import InputWithSlot from "./components/InputWithSlot.vue"
import ModelComp from "./../helpers/ModelComp"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { template } from "@babel/core"
import { ObserverInstance } from "../../src/types"

const DEFAULT_REQUIRED_MESSAGE = "The {field} field is required"

describe("Provider", function () {
  it("should render its tag attribute", () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({ val: "" }),
        template: `
        <ValidationProvider v-slot="ctx">
          <input v-model="val" type="text" @blur="console.log('get blurred')">
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    expect(wrapper.html()).toBe(`<span><input type="text"></span>`)
  })

  it("should be possible to be renderless with slim prop", () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({ val: "" }),
        template: `
        <ValidationProvider v-slot="ctx" slim>
          <input v-model="val" type="text">
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    expect(wrapper.html()).toBe(`<input type="text">`)
  })

  it("should listen for input, blur events to set flags", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <ValidationProvider rules="required" v-slot="{ errors, ...rest }">
          <input v-model="value" type="text">
          <div v-for="(flag, name) in rest">
            <li v-if="flag" :id="name">{{ name }}</li>
          </div>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    expect(wrapper).toHaveElement("#untouched")
    expect(wrapper).toHaveElement("#pristine")
    input.trigger("blur")
    await flushPromises()
    expect(wrapper).toHaveElement("#touched")
    expect(wrapper).not.toHaveElement("#untouched")
    expect(wrapper).toHaveElement("#pristine")
    await flushPromises()
    input.trigger("input")
    await flushPromises()
    expect(wrapper).not.toHaveElement("#pristine")
    expect(wrapper).toHaveElement("#dirty")
  })

  it.each([
    [5, 10, true],
    [5, 5, false],
    ["my value", "new value", true],
    ["my value", "my value", false],
    [["apple", "orange", "banana"], ["lemon", "orange", "strawberry"], true],
    [["apple", "orange", "banana"], ["apple", "orange", "banana"], false],
    [{ fruit: "apple", vegetable: "peas" }, { fruit: "lemon", vegetable: "carrot" }, true],
    [{ fruit: "apple", vegetable: "peas" }, { fruit: "apple", vegetable: "peas" }, false],
  ])('should listen for input, blur events to set "changed" flag', async (initialValue, newValue, expectedFlag) => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: initialValue,
        }),
        components: {
          CustomInput: {
            name: "CustomInput",
            props: ["modelValue"],
            template: `
              <p id="input">{{ modelValue }}</p>
            `,
          },
        },
        template: `
      <ValidationProvider rules="required" v-slot="{ changed }">
        <CustomInput v-model="value"/>
        <span id="changed">{{ changed }}</span>
      </ValidationProvider>
    `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.findComponent({ name: "CustomInput" })
    const changedSpan = wrapper.find("#changed")
    input.vm.$emit("blur")
    await flushPromises()
    input.vm.$emit("update:modelValue", newValue)
    await flushPromises()
    expect(changedSpan.text()).toContain(expectedFlag)
  })

  it("should validate lazy models", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <ValidationProvider rules="required" v-slot="{ errors }">
          <input v-model.lazy="value" type="text">
          <span id="error">{{ errors[0] }}</span>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    const error = wrapper.find("#error")

    input.element.value = ""
    input.trigger("update:modelValue")
    await flushPromises()
    // did not validate on input.
    expect(error.text()).toBe("")

    input.trigger("change")
    await flushPromises()
    // validation triggered on change.
    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)

    input.element.value = "text"
    input.trigger("change")
    await flushPromises()
    // validation triggered on change.
    expect(error.text()).toBe("")
  })

  it("should use appropriate events for different input types", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <div>
          <ValidationProvider rules="required" v-slot="{ errors }">
            <select v-model="value">
              <option value="">0</option>
              <option value="1">1</option>
            </select>
            <span id="error">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const select = wrapper.find("select")
    const error = wrapper.find("#error")

    select.trigger("update:modelValue")
    await flushPromises()
    // did not validate on input.
    expect(error.text()).toBe("")

    select.trigger("change")
    select.element.value = ""
    await flushPromises()
    // validation triggered on change.
    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)

    select.element.value = "1"
    wrapper.find("select").trigger("change")
    await flushPromises()

    expect(error.text()).toBe("")
  })

  it("should validate fields initially using the immediate prop", async () => {
    const wrapper = mount(
      {
        data: () => ({
          value: "",
        }),
        template: `
        <div>
          <ValidationProvider :immediate="true" rules="required" v-slot="{ errors }">
            <input v-model="value" type="text">
            <span id="error">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const error = wrapper.find("#error")

    // flush the pending validation.
    await flushPromises()

    expect(error.text()).toContain(DEFAULT_REQUIRED_MESSAGE)
  })

  it("should validate on rule change if the field was validated before", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
          rules: { required: true },
        }),
        template: `
        <div>
          <ValidationProvider :rules="rules" v-slot="{ errors }">
            <input v-model="value" type="text">
            <span id="error">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    const error = wrapper.find("#error")
    input.setValue("1")
    // flush the pending validation.
    await flushPromises()

    expect(error.text()).toBe("")

    wrapper.vm.rules = {
      required: false,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      min: 3,
    }

    await flushPromises()
    expect(error.text()).toBe("The {field} field must be at least 3 characters")
  })

  it("should validate on rule change: testing arrays", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
          rules: { required: true, oneOf: [1, 2, 3] },
        }),
        template: `
        <div>
          <ValidationProvider :rules="rules" v-slot="{ errors }">
            <input v-model="value" type="text">
            <span id="error">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    const error = wrapper.find("#error")
    input.setValue("4")
    // flush the pending validation.
    await flushPromises()

    expect(error.text()).toBe("The {field} field is not a valid value")

    wrapper.vm.rules = {
      required: true,
      oneOf: [1, 2, 3, 4],
    }

    await flushPromises()
    expect(error.text()).toBe("")
  })

  it("should validate on rule change: testing regex", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
          rules: { required: true, regex: /[0-9]+/i },
        }),
        template: `
        <div>
          <ValidationProvider :rules="rules" v-slot="{ errors }">
            <input v-model="value" type="text">
            <span id="error">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    const error = wrapper.find("#error")
    input.setValue("88")
    // flush the pending validation.
    await flushPromises()

    expect(error.text()).toBe("")

    wrapper.vm.rules = {
      required: false,
      regex: /^[0-9]$/i,
    }

    await flushPromises()
    expect(error.text()).toBe("The {field} field format is invalid")
  })

  it("should validate on rule change: testing NaN", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
          rules: { required: true, max: NaN },
        }),
        template: `
        <div>
          <ValidationProvider :rules="rules" v-slot="{ errors }">
            <input v-model="value" type="text">
            <span id="error">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    const error = wrapper.find("#error")
    input.setValue("2")
    // flush the pending validation.
    await flushPromises()

    expect(error.text()).toBe("The {field} field may not be greater than NaN characters")

    wrapper.vm.rules = {
      required: true,
      max: NaN,
    }

    await flushPromises()
    expect(error.text()).toBe("The {field} field may not be greater than NaN characters")
  })

  it("should validate components on input by default", async () => {
    const div = document.createElement("div")
    div.id = "root"
    document.body.appendChild(div)
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        components: {
          TextInput: {
            props: {
              modelValue: {
                type: String,
                required: true,
              },
            },
            emits: ["update:modelValue"],
            template: `
            <div>
              <input id="input" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">
            </div>
          `,
          },
        },
        template: `
        <div>
          <ValidationProvider rules="required" v-slot="{ errors }">
            <TextInput v-model="value" ref="input"></TextInput>
            <span id="error">{{ errors && errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } }, attachTo: "#root" }
    )

    const error = wrapper.find("#error")
    const input = wrapper.find("#input")

    expect(error.text()).toBe("")

    input.setValue("")
    await flushPromises()
    await nextTick()

    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)

    input.setValue("val")
    await flushPromises()
    expect(error.text()).toBe("")
  })

  it("should validate components on custom model", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        components: {
          TextInput: {
            props: ["test"],
            template: `<input :value="test" @change="$emit('update:test', $event.target.value)" />`,
          },
        },
        template: `
        <div>
          <ValidationProvider rules="required" v-slot="{ errors }">
            <TextInput v-model:test="value" ref="input"></TextInput>
            <span id="error">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const error = wrapper.find("#error")
    const input = wrapper.findComponent({ ref: "input" })

    expect(error.text()).toBe("")
    input.vm.$emit("update:test", "")
    await flushPromises()
    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)

    input.vm.$emit("update:test", "txt")
    await flushPromises()
    expect(error.text()).toBe("")
  })

  it("should validate target dependant fields using targeted params", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          password: "",
          confirmation: "",
        }),
        template: `
        <div>
          <ValidationProvider rules="required" vid="confirmation" v-slot="ctx">
            <input type="password" v-model="confirmation">
          </ValidationProvider>
          <ValidationProvider rules="required|confirmed:confirmation" v-slot="{ errors }">
            <input type="password" v-model="password">
            <span id="err1">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const error = wrapper.find("#err1")
    const inputs = wrapper.findAll("input")

    expect(error.text()).toBeFalsy()
    inputs.at(0)?.setValue("val")
    await flushPromises()
    // the password input hasn't changed yet.
    expect(error.text()).toBeFalsy()
    inputs.at(1)?.setValue("12")
    await flushPromises()
    // the password input was interacted with and should be validated.
    expect(error.text()).toBeTruthy()

    inputs.at(1)?.setValue("val")
    await flushPromises()
    // the password input now matches the confirmation.
    expect(error.text()).toBeFalsy()

    inputs.at(0)?.setValue("val1")
    await flushPromises()
    expect(error.text()).toBeTruthy()
  })

  it("should validate target dependant fields using interpolated params", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          password: "",
          confirmation: "",
        }),
        template: `
        <div>
          <ValidationProvider rules="required" vid="confirmation" v-slot="ctx">
            <input type="password" v-model="confirmation">
          </ValidationProvider>
          <ValidationProvider rules="required|is:@confirmation" v-slot="{ errors }">
            <input type="password" v-model="password">
            <span id="err1">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const error = wrapper.find("#err1")
    const inputs = wrapper.findAll("input")

    expect(error.text()).toBeFalsy()
    inputs.at(0)?.setValue("val")
    await flushPromises()
    // the password input hasn't changed yet.
    expect(error.text()).toBeFalsy()
    inputs.at(1)?.setValue("12")
    await flushPromises()
    // the password input was interacted with and should be validated.
    expect(error.text()).toBeTruthy()

    inputs.at(1)?.setValue("val")
    await flushPromises()
    // the password input now matches the confirmation.
    expect(error.text()).toBeFalsy()

    inputs.at(0)?.setValue("val1")
    await flushPromises()
    expect(error.text()).toBeTruthy()
  })

  it("should validate file input", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          file: null,
        }),
        template: `
        <ValidationProvider rules="required|image" v-slot="{ errors, validate }">
          <input type="file"  @change="validate">
          <p id="error">{{ errors[0] }}</p>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    input.trigger("change")
    await flushPromises()

    const error = wrapper.find("#error")
    expect(error.text()).toBeTruthy()
  })

  it("should remove the provider reference at destroy", () => {
    const wrapper = mount(
      {
        template: `
        <div>
          <ValidationProvider vid="named" ref="provider" v-slot="{ errors }">
            <span></span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const providersMap = wrapper.vm.$_veeObserver.refs
    expect(providersMap.named).toBe(wrapper.vm.$refs.provider)
    wrapper.unmount()
    expect(providersMap.named).toBeUndefined()
  })

  it("should create HOCs from other components", async () => {
    const InputWithValidation = withValidation(InputWithoutValidation)

    const wrapper = mount(
      {
        props: {},
        template: `
        <div>
          <InputWithValidation v-model="value" rules="required"></InputWithValidation>
        </div>
      `,
        data: () => ({ value: "" }),
        components: {
          InputWithValidation,
        },
      },
      { global: { components: { ValidationProvider, InputWithValidation } } }
    )

    const error = wrapper.find("#error")
    const input = wrapper.find("#input")

    expect(error.text()).toBe("")
    input.setValue("a")
    await flushPromises()
    input.setValue("")
    await flushPromises()

    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)
    input.setValue("txt")
    await flushPromises()
    expect(error.text()).toBe("")
  })

  it("should preserve the slots of created HOCs", async () => {
    const InputWithValidation = withValidation(InputWithSlot)

    const wrapper = mount(
      {
        props: {},
        template: `
        <div>
          <InputWithValidation v-model="value" rules="required" v-slot="{ data }">
            <p id="slotted">{{ data }}</p>
          </InputWithValidation>
        </div>
      `,
        data: () => ({ value: "" }),
        components: {
          InputWithValidation,
        },
      },
      { global: { components: {} } }
    )

    const slot = wrapper.find("#slotted")
    expect(slot.exists()).toBe(true)
    expect(slot.text()).toBe("10")
  })

  it("should reset validation state", async () => {
    const div = document.createElement("div")
    div.id = "root"
    document.body.appendChild(div)
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        components: {
          TextInput: {
            props: ["modelValue"],
            template: `
            <div>
              <input id="input" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">
            </div>
          `,
          },
        },
        template: `
        <div>
          <ValidationProvider rules="required" ref="provider" v-slot="{ errors, failedRules }">
            <TextInput v-model="value" ref="input"></TextInput>
            <span id="error">{{ errors && errors[0] }}</span>
            <span id="failed">{{ failedRules.required }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } }, attachTo: "#root" }
    )

    const error = wrapper.find("#error")
    const input = wrapper.find("#input")

    expect(error.text()).toBe("")
    expect(wrapper.find("#failed").text()).toBe("")

    input.setValue("")
    await flushPromises()

    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)
    expect(wrapper.find("#failed").text()).toBe(DEFAULT_REQUIRED_MESSAGE)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    wrapper.vm.$refs.provider.reset()
    await flushPromises()
    expect(error.text()).toBe("")
    expect(wrapper.find("#failed").text()).toBe("")
  })

  it("should have setting bails prop to false disabling fast exit", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <ValidationProvider :bails="false" rules="email|min:3" v-slot="{ errors }">
          <input v-model="value" type="text">
          <p v-for="error in errors">{{ error }}</p>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    input.setValue("1")
    await flushPromises()

    const errors = wrapper.findAll("p")
    expect(errors).toHaveLength(2)
    expect(errors.at(0)?.text()).toBe("The {field} field must be a valid email")
    expect(errors.at(1)?.text()).toBe("The {field} field must be at least 3 characters")
  })

  it("should have setting bails and skipIfEmpty to false running all rules", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <ValidationProvider :skipIfEmpty="false" :bails="false" rules="email|min:3" v-slot="{ errors }">
          <input v-model="value" type="text">
          <p v-for="error in errors">{{ error }}</p>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    input.setValue("")
    await flushPromises()

    const errors = wrapper.findAll("p")
    expect(errors).toHaveLength(2)
    expect(errors.at(0)?.text()).toBe("The {field} field must be a valid email")
    expect(errors.at(1)?.text()).toBe("The {field} field must be at least 3 characters")
  })

  it("should have setting skipIfEmpty to false running only the first rule", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <ValidationProvider :skipIfEmpty="false" rules="email|min:3" v-slot="{ errors }">
          <input v-model="value" type="text">
          <p v-for="error in errors">{{ error }}</p>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    input.setValue("")
    await flushPromises()

    const errors = wrapper.findAll("p")
    expect(errors).toHaveLength(1)
    expect(errors.at(0)?.text()).toBe("The {field} field must be a valid email")
  })

  it("should have setting detectInput to false disabling the v-model autodetection", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <ValidationProvider :detectInput="false" rules="required" v-slot="{ errors }">
          <input id="input" v-model="value" type="text">
          <span id="error">{{ errors[0] }}</span>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("#input")
    input.setValue("")
    await flushPromises()

    const error = wrapper.find("#error")
    expect(error.text()).toBeFalsy()
  })

  const sleep = (wait) => new Promise((resolve) => setTimeout(resolve, wait))
  it("should be possible to debounce validation", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <ValidationProvider rules="required" :debounce="50" v-slot="{ errors }">
          <input v-model="value" type="text">
          <p>{{ errors[0] }}</p>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    const error = wrapper.find("p")

    input.setValue("")
    await sleep(40)
    expect(error.text()).toBe("")
    await sleep(10)
    await flushPromises()
    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)
  })

  it("should ignore pending validation result on reset", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <ValidationProvider ref="provider" rules="required" :debounce="50" v-slot="{ errors }">
          <input v-model="value" type="text">
          <p>{{ errors[0] }}</p>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    const error = wrapper.find("p")

    input.setValue("")
    await sleep(40)
    await flushPromises()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    wrapper.vm.$refs.provider.reset()
    await flushPromises()
    expect(error.text()).toBe("")
    await sleep(10)
    await flushPromises()
    expect(error.text()).toBe("")
  })

  it("should avoid race conditions between successive validations", async () => {
    // A decreasing timeout (the most recent validation will finish before new ones).
    extend("longRunning", {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      message: (_, __, data) => data,
      validate: (value) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              valid: value === 42,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              data: "Lost in time",
            })
          }, 20)
        })
      },
    })

    const wrapper = mount(
      {
        data: () => ({
          value: "",
        }),
        template: `
        <ValidationProvider rules="required|longRunning" :debounce="10" v-slot="{ errors }">
          <input v-model="value" type="text">
          <p>{{ errors[0] }}</p>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    const error = wrapper.find("p")

    input.setValue("123")
    input.setValue("12")
    input.setValue("")
    await sleep(100)
    await flushPromises()
    // LAST message should be the required one.
    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)
  })

  it("should validate manually using the validate event handler", async () => {
    const wrapper = mount(
      {
        props: {},
        template: `
        <ValidationProvider rules="required" v-slot="{ validate, errors }">
          <input type="text" @input="validate">
          <p id="error">{{ errors[0] }}</p>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    input.setValue("")
    await flushPromises()

    const error = wrapper.find("#error")
    expect(error.text()).toBeTruthy()

    input.setValue("123")
    await flushPromises()

    expect(error.text()).toBeFalsy()
  })

  it("should validate manually with a initial value using the validate event handler on native comp", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          myValue: "initial value",
        }),
        template: `
        <ValidationObserver ref="obs">
          <ValidationProvider rules="required" v-slot="{ validate, errors }">
            <input type="text" :value="myValue" @input="validate">
            <p id="error">{{ errors[0] }}</p>
          </ValidationProvider>
        </ValidationObserver>
      `,
      },
      { global: { components: { ValidationProvider, ValidationObserver } } }
    )

    const obs = wrapper.vm.$refs.obs as ObserverInstance

    await obs.validate()

    const error = wrapper.find("#error")
    expect(error.text()).toBe("")
  })

  it("should validate manually with a initial value using the validate event handler on vue comp", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          myValue: "initial value",
        }),
        template: `
        <ValidationObserver ref="obs">
          <ValidationProvider rules="required" v-slot="{ validate, errors }">
            <ModelComp :modelValue="myValue" @update:modelValue="validate" />
            <p id="error">{{ errors[0] }}</p>
          </ValidationProvider>
        </ValidationObserver>
      `,
      },
      { global: { components: { ValidationProvider, ValidationObserver, ModelComp } } }
    )

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await wrapper.vm.$refs.obs.validate()

    const error = wrapper.find("#error")
    expect(error.text()).toBe("")
  })

  it("should reset validation state using reset method in slot scope data", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <ValidationProvider rules="required" v-slot="{ errors, reset }">
          <input type="text" v-model="value">
          <span id="error">{{ errors && errors[0] }}</span>
          <button @click="reset">Reset</button>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const error = wrapper.find("#error")
    const input = wrapper.find("input")

    expect(error.text()).toBe("")

    input.setValue("")
    await flushPromises()

    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)

    wrapper.find("button").trigger("click")
    await flushPromises()
    expect(error.text()).toBe("")
  })

  it("should have the possibility to have classes as arrays", async () => {
    configure({
      classes: {
        invalid: ["wrong", "bad"],
        valid: ["jolly", "good"],
      },
    })
    const wrapper = mount(
      {
        props: {},
        data: () => ({ val: "" }),
        template: `
        <ValidationProvider v-slot="{ errors, classes }">
          <input type="text" v-model="val" required :class="classes">
          <p id="error">{{ errors[0] }}</p>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const input = wrapper.find("input")
    input.setValue("")
    await flushPromises()
    expect(input.classes()).toContain("wrong")
    expect(input.classes()).toContain("bad")

    input.setValue("1")
    await flushPromises()
    expect(input.classes()).toContain("jolly")
    expect(input.classes()).toContain("good")
  })

  it("should set errors manually with setErrors", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({ val: "1" }),
        template: `
        <ValidationProvider ref="provider" v-slot="{ errors }" rules="required">
          <input type="text" v-model="val">
          <p id="error">{{ errors[0] }}</p>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    await flushPromises()
    expect(wrapper.find("#error").text()).toBe("")

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    wrapper.vm.$refs.provider.setErrors(["WRONG!"])
    await flushPromises()
    expect(wrapper.find("#error").text()).toBe("WRONG!")
  })

  describe("HTML5 Rule inference", () => {
    it("should have required and email rules", async () => {
      const wrapper = mount(
        {
          props: {},
          data: () => ({ val: "1" }),
          template: `
        <ValidationProvider v-slot="{ errors }">
          <input type="email" required v-model="val">
          <p id="error">{{ errors[0] }}</p>
        </ValidationProvider>
      `,
        },
        { global: { components: { ValidationProvider } } }
      )

      await flushPromises()
      expect(wrapper.find("#error").text()).toBe("")
      wrapper.find("input").setValue("")
      await flushPromises()
      expect(wrapper.find("#error").text()).toContain("is required")

      // test inferred email value
      wrapper.find("input").setValue("123")
      await flushPromises()
      expect(wrapper.find("#error").text()).toContain("email")
    })

    it("should have required explicit false", async () => {
      const wrapper = mount(
        {
          props: {},
          data: () => ({ val: "1" }),
          template: `
        <ValidationProvider v-slot="{ errors }">
          <input type="text" :required="false" v-model="val">
          <p id="error">{{ errors[0] }}</p>
        </ValidationProvider>`,
        },
        { global: { components: { ValidationProvider } } }
      )

      await flushPromises()
      expect(wrapper.find("#error").text()).toBe("")
      wrapper.find("input").setValue("")
      await flushPromises()
      expect(wrapper.find("#error").text()).toBe("")
    })

    it("should have regex and minlength and maxlength rules", async () => {
      const wrapper = mount(
        {
          props: {},
          data: () => ({ val: "1" }),
          template: `
        <ValidationProvider v-slot="{ errors }">
          <input type="text" pattern="[0-9]+" minlength="2" maxlength="3" v-model="val">
          <p id="error">{{ errors[0] }}</p>
        </ValidationProvider>
      `,
        },
        { global: { components: { ValidationProvider } } }
      )

      wrapper.find("input").setValue("a")
      await flushPromises()
      expect(wrapper.find("#error").text()).toContain("format is invalid")

      // test inferred maxlength
      wrapper.find("input").setValue("1234")
      await flushPromises()
      expect(wrapper.find("#error").text()).toContain("greater than 3")

      // test inferred minlength
      wrapper.find("input").setValue("1")
      await flushPromises()
      expect(wrapper.find("#error").text()).toContain("least 2")
    })

    it("should have number and min_value and max_value", async () => {
      const wrapper = mount(
        {
          props: {},
          data: () => ({ val: "1" }),
          template: `
        <ValidationProvider v-slot="{ errors }">
          <input type="number" min="2" max="4" v-model="val">
          <p id="error">{{ errors[0] }}</p>
        </ValidationProvider>
      `,
        },
        { global: { components: { ValidationProvider } } }
      )

      // test min_value
      wrapper.find("input").setValue("1")
      await flushPromises()
      expect(wrapper.find("#error").text()).toContain("must be 2")

      // test max_value
      wrapper.find("input").setValue("5")
      await flushPromises()
      expect(wrapper.find("#error").text()).toContain("must be 4")
    })

    it("should have select input required", async () => {
      const wrapper = mount(
        {
          props: {},
          data: () => ({ val: "1" }),
          template: `
        <ValidationProvider v-slot="{ errors }">
          <select required v-model="val">
            <option value="">1</option>
            <option value="1">1</option>
          </select>
          <p id="error">{{ errors[0] }}</p>
        </ValidationProvider>
      `,
        },
        { global: { components: { ValidationProvider } } }
      )

      wrapper.find("select").setValue("")
      await flushPromises()
      expect(wrapper.find("#error").text()).toContain("is required")
    })
  })

  it("should be possible to have field name resolved from name attribute", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({ val: "123" }),
        template: `
        <ValidationProvider v-slot="{ errors }" rules="required">
          <input v-model="val" name="firstName" type="text">
          <span id="error">{{ errors[0] }}</span>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )
    await flushPromises()
    wrapper.find("input").setValue("")
    await flushPromises()

    expect(wrapper.find("#error").text()).toBe(DEFAULT_REQUIRED_MESSAGE.replace("{field}", "firstName"))
  })

  it("should be possible to have field name resolved from id attribute", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({ val: "123" }),
        template: `
        <ValidationProvider v-slot="{ errors }" rules="required">
          <input v-model="val" id="firstName" type="text">
          <span id="error">{{ errors[0] }}</span>
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )
    await flushPromises()
    wrapper.find("input").setValue("")
    await flushPromises()

    expect(wrapper.find("#error").text()).toBe(DEFAULT_REQUIRED_MESSAGE.replace("{field}", "firstName"))
  })

  it("should have array param collecting in the last parameter", async () => {
    extend("isOneOf", {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      validate(value: string, { val, isOneOf }: { val: string; isOneOf: string[] }) {
        return isOneOf.includes(value) && isOneOf.includes(val)
      },
      params: ["val", "isOneOf"],
      message: "nah",
    })

    const wrapper = mount(
      {
        props: {},
        data: () => ({ val: "1" }),
        template: `
      <ValidationProvider rules="required|isOneOf:2,1,2" v-slot="{ errors }">
        <input type="text" v-model="val">
        <p id="error">{{ errors[0] }}</p>
      </ValidationProvider>
    `,
      },
      { global: { components: { ValidationProvider } } }
    )

    wrapper.find("input").setValue("5")
    await flushPromises()
    expect(wrapper.find("#error").text()).toContain("nah")
    wrapper.find("input").setValue("1")
    await flushPromises()
    expect(wrapper.find("#error").text()).toBe("")
  })

  it.fails("should throw if rule does not exist", async () => {
    const wrapper = mount(
      {
        props: {},
        data: () => ({ val: "123" }),
        template: `
        <ValidationProvider rules="wutface" v-slot="ctx" ref="pro">
          <input v-model="val" type="text">
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await expect(wrapper.vm.$refs.pro.validate()).rejects.toBe(1)
  })

  it("should return custom error messages passed in the customMessages prop", async () => {
    extend("truthy", {
      validate: Boolean,
      message: "Original Message",
    })

    const customMessage = "Custom Message"

    const wrapper = mount(
      {
        props: {},
        data: () => ({ val: false }),
        template: `
        <ValidationProvider rules="truthy" :customMessages="{ truthy: '${customMessage}' }" v-slot="ctx" ref="pro">
          <input v-model="val" type="text">
        </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = await wrapper.vm.$refs.pro.validate()

    expect(result.errors[0]).toEqual(customMessage)
  })

  describe("Handle value mutating modifiers", () => {
    it("should handle .number modifier", () => {
      const wrapper = mount(
        {
          props: {},
          data: () => ({ val: "" }),
          template: `
        <ValidationProvider rules="required" v-slot="ctx" ref="provider">
          <input v-model.number="val" type="text">
        </ValidationProvider>
      `,
        },
        { global: { components: { ValidationProvider } } }
      )

      // should happen synchronously!
      wrapper.find("input").setValue("11")
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(wrapper.vm.$refs.provider.value).toBe(11)

      // NaN values are left as is.
      wrapper.find("input").setValue("x23")
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(wrapper.vm.$refs.provider.value).toBe("x23")
    })

    it("should handle .trim modifier", () => {
      const wrapper = mount(
        {
          props: {},
          data: () => ({ val: "" }),
          template: `
            <ValidationProvider rules="required" v-slot="ctx" ref="provider">
              <input v-model.trim="val" type="text">
            </ValidationProvider>
      `,
        },
        { global: { components: { ValidationProvider } } }
      )

      // should happen synchronously!
      wrapper.find("input").setValue("  abc")
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(wrapper.vm.$refs.provider.value).toBe("abc")
    })
  })

  it("should work when wrapped", async function () {
    const wrapper = mount(
      {
        props: {
          refName: {
            type: String,
            default: "",
          },
        },
        data: () => ({ value: "" }),
        template: `
          <ValidationProvider ref="validator" v-slot="{ validate, errors }" :name="refName" class="align-top block" mode="eager" :rules="'required'">
              <input
                v-model="value"
                :type="'text'"
                :name="null"
              />
              <div id="errors">
                <div v-for="(error, key) in errors" v-show="errors" :key="key"
                     class="text-red-500 mb-0 italic pt-1 text-sm">
                  <p :id="\`error_\${key}\`">{{ error }}</p>
              </div>
            </div>
          </ValidationProvider>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    wrapper.find("input").setValue("a")
    await flushPromises()
    wrapper.find("input").setValue("")
    await flushPromises()
    expect(wrapper.find("#errors").text()).toContain("is required")
  })
})
