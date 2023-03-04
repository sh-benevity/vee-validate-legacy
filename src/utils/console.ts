const warn = console.warn

export function suppressWarn() {
  console.warn = () => {}
}

export function enableWarn() {
  console.warn = warn
}
