/**
 * Re-exports `@react-three/postprocessing` pieces without loading the package index,
 * which imports SSR helpers that reference removed Three symbols (r183+).
 */
export { EffectComposer } from "../../node_modules/@react-three/postprocessing/dist/EffectComposer.js";
export { Bloom } from "../../node_modules/@react-three/postprocessing/dist/effects/Bloom.js";
export { ChromaticAberration } from "../../node_modules/@react-three/postprocessing/dist/effects/ChromaticAberration.js";
export { DepthOfField } from "../../node_modules/@react-three/postprocessing/dist/effects/DepthOfField.js";
export { Vignette } from "../../node_modules/@react-three/postprocessing/dist/effects/Vignette.js";
