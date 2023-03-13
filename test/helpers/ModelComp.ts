export default {
  props: ["modelValue"],
  template: `<input type="text" :value="modelValue" @update:modelValue="$emit('input', $event)">`,
}
