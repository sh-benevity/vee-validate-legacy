import type { Config } from "tailwindcss"

import colors from "tailwindcss/colors"

const config: Config = {
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./composables/**/*.{js,ts}",
    "./plugins/**/*.{js,ts}",
    "./utils/**/*.{js,ts}",
    "./App.{js,ts,vue}",
    "./app.{js,ts,vue}",
    "./Error.{js,ts,vue}",
    "./error.{js,ts,vue}",
    "./app.config.{js,ts}",
  ],
  safelist: [{ pattern: /^h-/ }, { pattern: /^w-/ }],
  theme: {
    fontFamily: {
      sans: ["Lato", "sans-serif"],
      accent: ["Handel Gothic D Bold", "sans-serif"],
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: "#000000",
      white: "#FFFFFF",
      gray: {
        100: "#F6F6F6",
        200: "#ECECEC",
        250: "#E8E8E8",
        400: "#D8D8D8",
        500: "#C4C4C4",
        600: "#8D8D8D",
        700: "#808080",
        750: "#7C7C7C",
        800: "#505050",
        900: "#333333",
      },
      blue: {
        DEFAULT: "#0242E0",
        dark: "#061845",
        light: "#CDDCF3",
        home: colors.green,
        away: colors.blue,
      },
      red: colors.red,
      green: colors.green,
      orange: {
        lighter: "#F5E9E2",
        light: "#f5bc42",
        DEFAULT: "#F4A22A",
      },
      yellow: colors.yellow,
    },
    cursor: {
      auto: "auto",
      default: "default",
      pointer: "pointer",
      wait: "wait",
      text: "text",
      move: "move",
      help: "help",
      "not-allowed": "not-allowed",
      grab: "grab",
      grabbing: "grabbing",
    },
    extend: {
      spacing: {
        13: "3.25rem",
        15: "3.75rem",
      },
      maxWidth: {
        12: "12rem",
        14: "14rem",
        "200px": "200px",
        screen: "100vw",
      },
      minWidth: {
        10: "10rem",
      },
      width: {
        navmain: "260px",
        navmaincompact: "80px",
        negnavmain: "-260px",
        "200px": "200px",
        initial: "initial",
      },
      height: {
        headerheight: "58px",
        footerheight: "44px",
        "fit-content": "fit-content",
      },
      maxHeight: {
        "250px": "250px",
      },
      screens: {
        xs: "540px",
      },
      zIndex: {
        100: "100",
      },
      boxShadow: {
        "elevation-24":
          "0px 15px 20px -5px rgba(0, 0, 0, 0.3), 0px 24px 38px 3px rgba(0, 0, 0, 0.3), 0px 0px 40px 15px rgba(0, 0, 0, 0.3)",
      },
    },
  },
}

export default config
