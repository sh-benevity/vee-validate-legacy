// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  app: {
    baseURL: "/vee-validate-legacy",
  },
  css: ["~/assets/styles/main.scss"],

  modules: ["@nuxtjs/i18n", "@nuxtjs/tailwindcss"],

  i18n: {
    locales: [
      {
        code: "en-CA",
        name: "English",
        file: "en-CA.ts",
        iso: "en-CA",
        dir: "ltr",
      },
      {
        code: "fr-CA",
        name: "Français",
        file: "fr-CA.ts",
        iso: "fr-CA",
        dir: "ltr",
      },
    ],
    lazy: true,
    strategy: "no_prefix",
    defaultLocale: "en-CA",
    langDir: "./lang/",
    vueI18n: "./lang/vueI18n.config.ts",
    detectBrowserLanguage: false,
    experimental: {
      jsTsFormatResource: true,
    },
  },
})
