import { describe, expect, it } from "vitest"

import { extend, validate } from "@/index.full"

describe("extend", function () {
  it("should throw error if passed a non-function as the validate method", function () {
    expect(() => {
      extend("noFn", {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        validate: "",
      })
    }).toThrow()
  })

  it("should be possible to return error messages directly in the validate fn", async function () {
    extend("test-direct", (value) => {
      if (value === "1") {
        return "Cannot be 1"
      }

      if (value === "2") {
        return "{_field_} Cannot be 2"
      }

      return true
    })

    let result = await validate("1", "test-direct")
    expect(result.errors[0]).toBe("Cannot be 1")

    result = await validate("2", "test-direct", { name: "test" })
    expect(result.errors[0]).toBe("test Cannot be 2")
  })
})
