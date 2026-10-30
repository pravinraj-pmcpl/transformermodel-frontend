/// <reference types="vite/client" />

declare module '*.glb' {
  const src: string
  export default src
}

// vite/client only types lowercase *.png; Vite itself matches asset extensions case-insensitively.
declare module '*.PNG' {
  const src: string
  export default src
}
