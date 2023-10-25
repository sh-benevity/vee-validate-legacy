import { defineI18nLocale } from "#i18n"
import type { LocaleMessages } from "~/lang/localeMessages"

const messages: LocaleMessages = {
  global: {},
  messages: {},
  confirm: {},
  actions: {
    login: "Login",
    logout: "Logout",
    loading: "Loading",
    noProfile: "No profile",
  },
  menu: {
    createProfile: "Create profile",
    management: {
      root: "Management",
      exit: "Return to my organisation",
    },
  },
}

export default defineI18nLocale(function () {
  return messages
})
