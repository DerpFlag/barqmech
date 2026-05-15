/** Injected at build time (see vite.config.ts). Shown in catalog diagnostics. */
declare const __BM_BUILD_ID__: string

export const STORE_BUILD_ID =
  typeof __BM_BUILD_ID__ !== 'undefined' && __BM_BUILD_ID__ ? __BM_BUILD_ID__ : 'dev-local'
