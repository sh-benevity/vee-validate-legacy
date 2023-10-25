import { defineI18nLocale } from "#i18n"
import type { LocaleMessages } from "~/lang/localeMessages"

const messages: LocaleMessages = {
  global: {},
  messages: {},
  confirm: {},
  actions: {
    login: "Connexion",
    logout: "Déconnexion",
    loading: "Chargement",
    noProfile: "Aucun profil",
  },
  menu: {
    createProfile: "Créer profil",
    management: {
      root: "Management",
      exit: "Retour à mon organisation",
    },
  },
}

export default defineI18nLocale(function () {
  return messages
})
