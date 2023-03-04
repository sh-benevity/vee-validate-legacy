export default {
  file: (name, type, size = 1) =>
    <File>{
      name,
      type,
      size: size * 1024,
    },
}
