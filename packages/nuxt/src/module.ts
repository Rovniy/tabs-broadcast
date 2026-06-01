/**
 * @file module.ts
 * @description Nuxt module that wires `tabs-broadcast` into a Nuxt app.
 *
 * Build-time entry: registers a client-only plugin that creates the singleton
 * `TabsBroadcast` instance and exposes it as `$tabsBroadcast`, and (optionally)
 * auto-imports the `useTabsBroadcast()` composable.
 *
 * The instance is client-only on purpose: `BroadcastChannel`, `localStorage` and
 * `navigator.locks` only exist in the browser. The serialisable config is passed
 * through `runtimeConfig.public.tabsBroadcast`; non-serialisable options such as
 * `onBecomePrimary` are configured app-side (see README).
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 */
import { defineNuxtModule, createResolver, addPlugin, addImportsDir } from '@nuxt/kit';
import type { TDefaultConfig } from 'tabs-broadcast';

/**
 * Module options.
 *
 * Mirrors the serialisable subset of the core `TDefaultConfig` (the function
 * option `onBecomePrimary` cannot live in `runtimeConfig`), plus a switch to
 * disable auto-import of the composable.
 */
export interface ModuleOptions extends Omit<TDefaultConfig, 'onBecomePrimary'> {
	/** Auto-import the `useTabsBroadcast()` composable. Default: `true`. */
	composables?: boolean;
}

export default defineNuxtModule<ModuleOptions>({
	meta: {
		name: 'tabs-broadcast',
		configKey: 'tabsBroadcast',
		compatibility: {
			nuxt: '>=3.0.0',
		},
	},
	defaults: {
		composables: true,
	},
	setup(options, nuxt) {
		const resolver = createResolver(import.meta.url);

		// Strip build-only options before exposing the rest to the runtime plugin.
		const { composables, ...clientConfig } = options;

		// Serialisable config consumed by the client plugin via useRuntimeConfig().
		nuxt.options.runtimeConfig.public.tabsBroadcast = {
			...(nuxt.options.runtimeConfig.public.tabsBroadcast as Record<string, unknown> | undefined),
			...clientConfig,
		};

		// Client-only: the underlying browser APIs do not exist on the server.
		addPlugin({ src: resolver.resolve('./runtime/plugin.client'), mode: 'client' });

		if (composables !== false) {
			addImportsDir(resolver.resolve('./runtime/composables'));
		}
	},
});
