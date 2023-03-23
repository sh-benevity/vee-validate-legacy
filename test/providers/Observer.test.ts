// noinspection VueMissingComponentImportInspection

import { beforeEach, describe, expect, it, vi } from "vitest"

import { mount } from "@vue/test-utils"
import { ValidationObserver, ValidationProvider } from "../../src/index.full"
import flushPromises from "flush-promises"
import { ObserverInstance } from "../../src/types"

async function flush() {
  await flushPromises()
  vi.runAllTimers()
}

const DEFAULT_REQUIRED_MESSAGE = "The {field} field is required"

describe("Observer", function () {
  beforeEach(function () {
    vi.useFakeTimers()
  })

  it("should render the slot", () => {
    const wrapper = mount(
      {
        template: `
      <ValidationObserver tag="form" v-slot="ctx">
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver } } }
    )

    expect(wrapper.html()).toBe(`<form></form>`)
  })

  it("should observe the current state of providers", async () => {
    const wrapper = mount(
      {
        data: () => ({
          value: "",
        }),
        template: `
      <ValidationObserver v-slot="{ valid }">
        <ValidationProvider rules="required" v-slot="ctx">
          <input v-model="value" type="text">
        </ValidationProvider>

        <span id="state">{{ valid }}</span>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const stateSpan = wrapper.find("#state")
    const input = wrapper.find("input")

    await flush()
    // initially the field valid flag is false.
    expect(stateSpan.text()).toBe("false")

    input.setValue("value")
    await flush()

    expect(stateSpan.text()).toBe("true")
  })

  it("should trigger validation manually on its children providers using refs", async () => {
    const wrapper = mount(
      {
        data: () => ({
          value: "",
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="ctx">
        <ValidationProvider rules="required" v-slot="{ errors }">
          <input v-model="value" type="text">
          <span id="error">{{ errors[0] }}</span>
        </ValidationProvider>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const obs = wrapper.vm.$refs.obs as ObserverInstance

    const error = wrapper.find("#error")
    await flush()
    expect(error.text()).toBe("")

    await obs.validate()
    await flush()

    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)
  })

  it("should have passes only executing the callback if observer is valid", async () => {
    const wrapper = mount(
      {
        data: () => ({
          value: "",
          calls: 0,
        }),
        methods: {
          submit() {
            this.calls++
          },
        },
        template: `
      <ValidationObserver v-slot="ctx">
        <ValidationProvider rules="required" v-slot="{ errors }">
          <input v-model="value" type="text">
          <span id="error">{{ errors[0] }}</span>
        </ValidationProvider>
        <button @click="ctx.handleSubmit(submit)">Validate</button>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const error = wrapper.find("#error")
    const input = wrapper.find("input")
    await flush()
    expect(error.text()).toBe("")

    wrapper.find("button").trigger("click")
    await flush()
    expect(wrapper.vm.calls).toBe(0)

    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)
    input.setValue("12")
    wrapper.find("button").trigger("click")
    await flush()

    expect(error.text()).toBe("")
    expect(wrapper.vm.calls).toBe(1)
  })

  it("should remove child ref when the child is destroyed", async () => {
    const wrapper = mount(
      {
        data: () => ({
          value: "",
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="ctx">
        <ValidationProvider rules="required" vid="id" v-slot="{ errors }">
          <input v-model="value" type="text">
          <span id="error">{{ errors[0] }}</span>
        </ValidationProvider>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const obs = wrapper.vm.$refs.obs as ObserverInstance
    expect(obs.refs).toHaveProperty("id")

    wrapper.unmount()

    expect(obs.refs).not.toHaveProperty("id")
  })

  it("should reset child refs", async () => {
    const wrapper = mount(
      {
        data: () => ({
          value: "",
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="ctx">
        <ValidationProvider rules="required" v-slot="{ errors }">
          <input v-model="value" type="text">
          <span id="error">{{ errors[0] }}</span>
        </ValidationProvider>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const error = wrapper.find("#error")
    await flush()
    expect(error.text()).toBe("")

    const obs = wrapper.vm.$refs.obs as ObserverInstance

    await obs.validate()

    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)

    obs.reset()
    await flush()

    expect(error.text()).toBe("")
  })

  it("should reset child refs using reset on the v-slot data", async () => {
    const wrapper = mount(
      {
        data: () => ({
          value: "",
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="ctx">
        <ValidationProvider rules="required" v-slot="{ errors }">
          <input v-model="value" type="text">
          <span id="error">{{ errors[0] }}</span>
        </ValidationProvider>
        <button @click="ctx.reset()">Reset</button>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const error = wrapper.find("#error")
    await flush()
    expect(error.text()).toBe("")

    const obs = wrapper.vm.$refs.obs as ObserverInstance

    obs.validate()
    await flush()

    expect(error.text()).toBe(DEFAULT_REQUIRED_MESSAGE)

    await wrapper.find("button").trigger("click")
    await flush()

    expect(error.text()).toBe("")
  })

  it("should collect errors from child providers", async () => {
    const wrapper = mount(
      {
        data: () => ({
          email: "",
          name: "",
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="{ errors }">
        <ValidationProvider vid="name" rules="required" v-slot="ctx">
          <input v-model="name" type="text">
        </ValidationProvider>
        <ValidationProvider vid="email" rules="required" v-slot="ctx">
          <input v-model="email" type="text">
        </ValidationProvider>
        <p v-for="fieldErrors in errors">{{ fieldErrors[0] }}</p>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    await flush()

    const obs = wrapper.vm.$refs.obs as ObserverInstance

    await obs.validate()
    await flush()

    const errors = wrapper.findAll("p")
    expect(errors).toHaveLength(2) // 2 fields.
    expect(errors.at(0)?.text()).toBe(DEFAULT_REQUIRED_MESSAGE)
    expect(errors.at(1)?.text()).toBe(DEFAULT_REQUIRED_MESSAGE)
  })

  it("should expose nested observers state", async () => {
    const wrapper = mount(
      {
        data: () => ({
          name: "",
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="state">
        <ValidationObserver>
          <ValidationProvider vid="name" rules="required|alpha" v-slot="_">
            <input v-model="name" type="text">
          </ValidationProvider>
        </ValidationObserver>
        <p>{{ state.errors }}</p>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    await flush()
    const input = wrapper.find("input")
    input.setValue("1")
    await flush()
    await flush()

    expect(wrapper.find("p").text()).toContain("The {field} field may only contain alphabetic characters")
  })

  it("should validate and reset nested observers", async () => {
    const wrapper = mount(
      {
        data: () => ({
          name: "",
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="state">
        <ValidationObserver>
          <ValidationProvider vid="name" rules="required|alpha" v-slot="_">
            <input v-model="name" type="text">
          </ValidationProvider>
        </ValidationObserver>
        <p>{{ state.errors }}</p>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const obs = wrapper.vm.$refs.obs as ObserverInstance

    await flush()
    expect(wrapper.find("p").text()).not.toContain(DEFAULT_REQUIRED_MESSAGE)
    await obs.validate()
    await flush()
    await flush()
    expect(wrapper.find("p").text()).toContain(DEFAULT_REQUIRED_MESSAGE)
    await obs.reset()
    await flush()
    await flush()
    expect(wrapper.find("p").text()).not.toContain(DEFAULT_REQUIRED_MESSAGE)
  })

  it("should not validate nested disabled observers", async () => {
    const wrapper = mount(
      {
        data: () => ({
          name: "",
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="state">
        <ValidationObserver>
          <ValidationProvider disabled vid="name" rules="required|alpha" v-slot="_">
            <input v-model="name" type="text">
          </ValidationProvider>
        </ValidationObserver>
        <p>{{ state.errors }}</p>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const obs = wrapper.vm.$refs.obs as ObserverInstance

    await flush()
    expect(wrapper.find("p").text()).not.toContain(DEFAULT_REQUIRED_MESSAGE)
    await obs.validate()
    await flush()
    await flush()
    expect(wrapper.find("p").text()).not.toContain(DEFAULT_REQUIRED_MESSAGE)
  })

  it("should not have parent observer collecting errors from nested disabled observers", async () => {
    const wrapper = mount(
      {
        data: () => ({
          name: "",
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="state">
        <ValidationObserver disabled>
          <ValidationProvider vid="name" rules="required|alpha" v-slot="_">
            <input v-model="name" type="text">
          </ValidationProvider>
        </ValidationObserver>
        <p>{{ state.errors }}</p>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    await flush()
    const input = wrapper.find("input")
    input.setValue("1")
    await flush()
    await flush()

    expect(wrapper.find("p").text()).not.toContain("The {field} field may only contain alphabetic characters")
  })

  it("should merge nested observers state", async () => {
    const wrapper = mount(
      {
        data: () => ({
          name: "",
          isMounted: true,
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="state">
        <ValidationObserver v-if="isMounted" vid="NESTED_OBS">
          <ValidationProvider vid="name" rules="required|alpha" v-slot="_">
            <input v-model="name" type="text">
          </ValidationProvider>
        </ValidationObserver>
        <p>{{ state.errors }}</p>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    await flush()
    await flush()
    expect(wrapper.find("p").text()).toContain(`name`) // nested observer is mounted.
    wrapper.setData({
      isMounted: false,
    })
    await flush()
    expect(wrapper.find("p").text()).not.toContain(`name`) // nested observer is unmounted.
  })

  it("should set errors for all providers", async () => {
    const wrapper = mount(
      {
        data: () => ({
          field1: "",
          field2: "",
        }),
        template: `
    <div>
      <ValidationObserver ref="observer">
        <ValidationProvider
          vid="field1"
          v-slot="{ errors }"
        >
          <input type="text" v-model="field1">
          <span id="error1">{{ errors[0] }}</span>
        </ValidationProvider>

        <ValidationProvider
          name="field2"
          v-slot="{ errors }"
        >
          <input type="text" v-model="field2">
          <span id="error2">{{ errors[0] }}</span>
        </ValidationProvider>
      </ValidationObserver>
    </div>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const observer = wrapper.vm.$refs.observer as ObserverInstance

    await flush()
    expect(wrapper.find("#error1").text()).toBe("")
    expect(wrapper.find("#error2").text()).toBe("")

    observer.setErrors({
      field1: ["wrong"],
      field2: ["whoops"],
    })

    await flush()
    expect(wrapper.find("#error1").text()).toBe("wrong")
    expect(wrapper.find("#error2").text()).toBe("whoops")
  })

  it("should set errors for nested observer providers", async () => {
    const wrapper = mount(
      {
        data: () => ({
          field1: "",
          field2: "",
        }),
        template: `
    <div>
      <ValidationObserver ref="observer">
        <ValidationObserver>
          <ValidationProvider
            vid="field1"
            v-slot="{ errors }"
          >
            <input type="text" v-model="field1">
            <span id="error1">{{ errors[0] }}</span>
          </ValidationProvider>

          <ValidationProvider
            name="field2"
            v-slot="{ errors }"
          >
            <input type="text" v-model="field2">
            <span id="error2">{{ errors[0] }}</span>
          </ValidationProvider>
        </ValidationObserver>
      </ValidationObserver>
    </div>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const observer = wrapper.vm.$refs.observer as ObserverInstance

    await flush()
    expect(wrapper.find("#error1").text()).toBe("")
    expect(wrapper.find("#error2").text()).toBe("")

    observer.setErrors({
      field1: ["wrong"],
      field2: ["whoops"],
    })

    await flush()
    expect(wrapper.find("#error1").text()).toBe("wrong")
    expect(wrapper.find("#error2").text()).toBe("whoops")
  })

  // #2686 and #2781
  it("should have errors synced immediately after validation", async () => {
    const wrapper = mount(
      {
        data: () => ({
          email: "",
          name: "",
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="{ errors }">
        <ValidationProvider vid="name" rules="required" v-slot="ctx">
          <input v-model="name" type="text">
        </ValidationProvider>
        <ValidationProvider vid="email" rules="required" v-slot="ctx">
          <input v-model="email" type="text">
        </ValidationProvider>
        <p v-for="fieldErrors in errors">{{ fieldErrors[0] }}</p>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const obs = wrapper.vm.$refs.obs as ObserverInstance

    await flush()

    await obs.validate()
    expect(obs.errors.name).toHaveLength(1)
    expect(obs.errors.email).toHaveLength(1)
  })

  // #2900
  it("should offer a detailed validation function", async () => {
    const wrapper = mount(
      {
        data: () => ({
          email: "",
          name: "",
        }),
        template: `
      <ValidationObserver ref="obs" v-slot="{ errors }">
        <ValidationProvider vid="name" rules="required" v-slot="ctx">
          <input v-model="name" type="text">
        </ValidationProvider>
        <ValidationProvider vid="email" rules="required" v-slot="ctx">
          <input v-model="email" type="text">
        </ValidationProvider>
        <p v-for="fieldErrors in errors">{{ fieldErrors[0] }}</p>
      </ValidationObserver>
    `,
      },
      { global: { components: { ValidationObserver, ValidationProvider } } }
    )

    const obs = wrapper.vm.$refs.obs as ObserverInstance

    await flush()

    const results = await obs.validateWithInfo()
    expect(results.errors.name).toHaveLength(1)
    expect(results.errors.email).toHaveLength(1)
  })
})
