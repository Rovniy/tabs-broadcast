/**
 * @file election/tabId.ts
 * @description Collision-resistant per-tab identifier generation.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 * @internal
 */
import globalConfig from '../config';

/**
 * Generate a collision-resistant tab id. Prefers `crypto.randomUUID`; falls back to a
 * time+random string in environments that lack it.
 * @internal
 */
export function generateTabId(): string {
	const prefix = globalConfig.dict.tab_prefix;

	try {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return prefix + crypto.randomUUID();
		}
	} catch {
		/* fall through to the non-crypto id */
	}

	return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2);
}
