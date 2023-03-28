// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  app: {
    baseURL: "/vee-validate-legacy",
  },

  modules: ["@nuxtjs/i18n", "@nuxtjs/tailwindcss"],

  i18n: {
    locales: [
      {
        code: "en_US",
        file: "en_US.ts",
      },
      {
        code: "fr_CA",
        file: "fr_CA.ts",
      },
    ],
    defaultLocale: "en_US",
    langDir: "./lang",
    strategy: "no_prefix",
  },
})
