# vee-validate-legacy

vee-validate-legacy is a template-based validation framework for [Vue.js](https://vuejs.org/) that allows you to validate inputs and display errors.

Being template-based you only need to specify for each input what kind of validators should be used when the value changes. The errors will be automatically generated with 40+ locales supported. [Many rules are available out of the box](https://vee-validate.logaretm.com/v3/guide/rules.html).

This plugin is inspired by [PHP Framework Laravel's validation](https://laravel.com/).

## Features

- Template based validation that is both familiar and easy to setup.
- 🌍 i18n Support and error Messages in 40+ locales.
- 💫 Async and Custom Rules Support.
- 💪 Written in TypeScript.
- No dependencies.

## Why this and not vee-validate

Use it if you prefer how vee-validate worked with Vue 2

## Installation

The latest release of vee-validate is v4, which is only available for Vue 3. If you are looking to install v3, then make sure to include the version tag.

### yarn

```bash
yarn add vee-validate-legacy
```

### npm

```bash
npm i vee-validate-legacy --save
```

### pnpm

```bash
pnpm i vee-validate-legacy
```

## Getting Started

Install the rules you will use in your app, we will install the `required` rule for now:

```ts
import { extend } from "vee-validate-legacy"
import { required, email } from "vee-validate-legacy/dist/rules"

// Add the required rule
extend("required", {
  ...required,
  message: "This field is required"
})

// Add the email rule
extend("email", {
  ...email,
  message: "This field must be a valid email"
})
```

Import the `ValidationProvider` component and register it:

### Global Registration

```ts
import { ValidationProvider } from "vee-validate-legacy"

// Register it globally
// main.ts or any entry file.
app.component("ValidationProvider", ValidationProvider)
```

### Local Registration

```ts
import { defineComponent } from "vue"
import { ValidationProvider } from "vee-validate-legacy"

export default defineComponent({
  components: {
    ValidationProvider
  }
});
```

All the TypeScript work is done. Next in the template add the inputs you want to validate them:

```vue
<ValidationProvider name="email" rules="required|email" v-slot="{ errors }">
  <div>
    <input v-model="email" />
    <p>{{ errors[0] }}</p>
  </div>
</ValidationProvider>
```

The validation provider accepts two props: `rules` which is in its simplest form, a string containing the validation rules separated by a `|` character, and a `name` prop which is the field name that will be used in error messages.

And that's it, your input will be validated automatically, notice that the `ValidationProvider` uses [scoped slots](https://vuejs.org/guide/components/slots.html#scoped-slots) to pass down validation state and results.

There is more that can be done! You can customize events, validate initial values, manually validate or reset the field and much more. Make sure to [read the docs](https://vee-validate.logaretm.com/v3).

## Documentation

Read the [documentation and demos](https://vee-validate.logaretm.com/v3/).

## Compatibility

This library uses ES6 Promises so be sure to provide a polyfill for it for the browsers that do not support it.

## Contributing

You are welcome to contribute to this project, but before you do, please make sure you read the [contribution guide](CONTRIBUTING.md).
