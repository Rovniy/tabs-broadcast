import * as _nuxt_schema from '@nuxt/schema';
import { TDefaultConfig } from 'tabs-broadcast';

/**
 * Module options.
 *
 * Mirrors the serialisable subset of the core `TDefaultConfig` (the function
 * option `onBecomePrimary` cannot live in `runtimeConfig`), plus a switch to
 * disable auto-import of the composable.
 */
interface ModuleOptions extends Omit<TDefaultConfig, 'onBecomePrimary'> {
    /** Auto-import the `useTabsBroadcast()` composable. Default: `true`. */
    composables?: boolean;
}
declare const _default: _nuxt_schema.NuxtModule<ModuleOptions, ModuleOptions, false>;

export { _default as default };
export type { ModuleOptions };
