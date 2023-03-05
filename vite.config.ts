import { fileURLToPath, URL } from "node:url"

import { defineConfig } from "vite"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vue from "@vitejs/plugin-vue"

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    setupFiles: ["./test/setupRaf.js", "./test/setup.ts"],
    environment: "jsdom",
    watch: false,
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
