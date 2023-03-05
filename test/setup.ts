import { expect } from "vitest"

import { VueWrapper } from "@vue/test-utils"

expect.extend({
  toHaveElement(wrapper: VueWrapper, selector) {
    const exists = wrapper.find(selector).exists()

    return {
      pass: exists,
      message: () => `The element ${!this.isNot ? "does not" : "does"} exist.`,
    }
  },
})

export {}
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveElement(selector): R
    }
  }
}
