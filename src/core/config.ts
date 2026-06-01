/**
 * @file config.ts
 * @description Configuration file for the TabsBroadcast libraries.
 *
 * This file contains the default configuration options and constants used throughout
 * the TabsBroadcast and TabsWorker libraries. It sets up the default values for various
 * settings and provides a dictionary for common terms used within the libraries.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 */
import type { TConfig } from '../types';

export default {
	defaultConfig: {
		channelName: 'xploit_tab_channel', // Broadcast channel name
		layer: 'default_layer', // Default layer name
		listenOwnChannel: false, // Listen broadcast event on current tab
		emitByPrimaryOnly: true, // Emits event only by Primary tab
		onBecomePrimary: () => {}, // Global event when current tab become Primary
		disableInternalErrors: true, // Disable internal errors logging
	},
	dict: {
		// Base names. All cross-tab keys/locks are namespaced per `channelName`
		// at runtime (see TabsWorker) so independent channels never collide.
		tab_prefix: 'xploit_tab_id_',
		primaryTabId: 'xploit_primary_tab_id',
		primaryLock: 'xploit_primary_lock',
	},
	// Time budget (ms) used by the localStorage fallback election (no Web Locks).
	timing: {
		heartbeat: 2000, // primary refreshes its claim this often
		stale: 5000, // a primary claim older than this is considered dead
	},
} as TConfig;
