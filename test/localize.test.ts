import { describe, expect, it } from "vitest"

import { mount } from "@vue/test-utils"
import flushPromises from "flush-promises"
import { extend, localize, ValidationProvider } from "../src/index.full"

describe("localize", function () {
  it("should define new locales", async function () {
    localize("ar", {
      messages: {
        required: "هذا الحقل مطلوب",
      },
    })

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
        props: {},
      },
      { global: { components: { ValidationProvider } } }
    )

    const error = wrapper.find("#error")

    // flush the pending validation.
    await flushPromises()

    expect(error.text()).toContain("هذا الحقل مطلوب")
  })

  it("should define specific messages for specific fields", async () => {
    localize("en", {
      fields: {
        test: {
          required: "WRONG!",
        },
      },
    })

    const wrapper = mount(
      {
        props: {},
        data: () => ({
          first: "",
          second: "",
        }),
        template: `
        <div>
          <ValidationProvider name="test" :immediate="true" rules="required" v-slot="{ errors }">
            <input v-model="first" type="text">
            <span class="error">{{ errors[0] }}</span>
          </ValidationProvider>

          <ValidationProvider :immediate="true" rules="required" v-slot="{ errors }">
            <input v-model="second" type="text">
            <span class="error">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    await flushPromises()
    const errors = wrapper.findAll(".error")
    expect(errors).toHaveLength(2)

    expect(errors.at(0)?.text()).toEqual("WRONG!")
    expect(errors.at(1)?.text()).toContain("The {field} field is required")
  })

  it("should merge locales without setting the current one", async () => {
    localize({
      ar: {
        messages: {
          required: "هذا الحقل مطلوب",
        },
      },
    })

    const wrapper = mount(
      {
        props: {},
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

    // locale wasn't set.
    expect(error.text()).toContain("The {field} field is required")
  })

  describe("when rule without message exists", function () {
    it("should fall back to the default message", async () => {
      extend("i18n", () => false)

      const wrapper = mount(
        {
          props: {},
          data: () => ({
            value: "1",
          }),
          template: `
        <div>
          <ValidationProvider :immediate="true" rules="required|i18n" v-slot="{ errors }">
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

      expect(error.text()).toContain("{field} is not valid")
    })

    it("should use field name in the default message", async () => {
      extend("ruleWithoutMessage", () => false)

      const wrapper = mount(
        {
          props: {},
          data: () => ({
            value: "1",
          }),
          template: `
            <div>
            <ValidationProvider :immediate="true" rules="required|ruleWithoutMessage" v-slot="{ errors }">
              <input name="MyFancyInputName" v-model="value" type="text">
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

      expect(error.text()).toContain("MyFancyInputName is not valid")
    })

    it("should use id in the default message", async () => {
      extend("ruleWithoutMessage", () => false)

      const wrapper = mount(
        {
          props: {},
          data: () => ({
            value: "1",
          }),
          template: `
            <div>
            <ValidationProvider :immediate="true" rules="required|ruleWithoutMessage" v-slot="{ errors }">
              <input id="myFancyInputId" v-model="value" type="text">
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

      expect(error.text()).toContain("myFancyInputId is not valid")
    })

    it("should prioritize name in the default message", async () => {
      extend("ruleWithoutMessage", () => false)

      const wrapper = mount(
        {
          props: {},
          data: () => ({
            value: "1",
          }),
          template: `
        <div>
          <ValidationProvider :immediate="true" rules="required|ruleWithoutMessage" v-slot="{ errors }">
            <input id="myFancyInputId" name="MyFancyInputName" v-model="value" type="text">
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

      expect(error.text()).toContain("MyFancyInputName is not valid")
    })
  })

  it("should define custom field names", async () => {
    localize("en", {
      names: {
        ugly: "Name",
      },
    })

    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <div>
          <ValidationProvider name="ugly" :immediate="true" rules="required" v-slot="{ errors }">
            <input v-model="value" type="text">
            <span id="error">{{ errors[0] }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    const error = wrapper.find("#error")
    await flushPromises()

    expect(error.text()).toContain("The Name field is required")
  })

  it("should regenerate error messages when locale changes", async () => {
    const wrapper = mount(
      {
        props: {},
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
    expect(error.text()).toContain("The {field} field is required")
    localize("ar")

    await flushPromises()
    expect(error.text()).toContain("هذا الحقل مطلوب")
  })
})
