import { defineI18nConfig } from "#i18n"

export default defineI18nConfig(function () {
  return {
    legacy: false,
    fallbackLocale: "en-CA",
  }
})
