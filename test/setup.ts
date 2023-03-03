expect.extend({
  toHaveElement(wrapper, selector) {
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
      toHaveElement(wrapper, selector): R
    }
  }
}
