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
import type { TConfig } from './types';

export default {
	defaultConfig: {
		channelName: 'xploit_tab_channel', // Broadcast channel name
		layer: 'default_layer',
		listenOwnChannel: true, // Listen broadcast event on current tab
		emitByPrimaryOnly: true, // Emits event only by Primary tab
		onBecomePrimary: () => {}, // Global event when current tab become Primary
	},
	dict: {
		tab_prefix: 'xploit_tab_id_',
		slave : 'xploit_slave',
		primary : 'xploit_primary',
		primaryTabId : 'xploit_primary_tab_id',
		primaryStatusChanged : 'XPLOIT_TAB_STATUS_CHANGED',
	}
} as TConfig
