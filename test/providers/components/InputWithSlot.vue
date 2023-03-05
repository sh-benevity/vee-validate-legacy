<template>
  <div>
    <input
      id="input"
      type="text"
      :class="classes"
      name="first"
      placeholder="First"
      autofocus
      @input="$emit('input', $event.target.value)"
    />
    <span id="error">{{ errors && errors[0] }}</span>
    <slot :data="10" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "InputWithSlot",
  props: {
    errors: { type: Array, default: null },
  },
  emits: ["input"],
})
</script>
