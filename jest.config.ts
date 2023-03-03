import type { Config } from "@jest/types"

const config: Config.InitialOptions = {
  collectCoverage: true,
  setupFilesAfterEnv: ["<rootDir>/test/setupRaf.js", "<rootDir>/test/setup.ts"],
  testMatch: ["**/test/**/*.test.js", "**/test/**/*.test.ts"],
  testPathIgnorePatterns: ["/helpers/", "/setupRaf.js"],
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts"],
  preset: "ts-jest",
  testEnvironment: "jsdom",
  clearMocks: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^~/(.*)$": "<rootDir>/$1",
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleFileExtensions: ["js", "ts", "json", "vue"],
  transform: {
    "\\.ts$": "ts-jest",
    "\\.js$": "babel-jest",
    "^.+\\.vue$": "@vue/vue3-jest",
  },
  moduleDirectories: ["node_modules"],
  verbose: true,
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
}

export default config
