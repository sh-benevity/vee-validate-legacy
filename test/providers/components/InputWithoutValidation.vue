<template>
  <input
    id="input"
    type="text"
    :class="classes"
    name="first"
    placeholder="First"
    autofocus
    @input="$emit('update:modelValue', $event.target.value)"
  />
  <span id="error">{{ errors && errors[0] }}</span>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "InputWithoutValidation",
  props: {
    errors: { type: Array, default: null },
  },
  emits: ["update:modelValue"],
})
</script>
