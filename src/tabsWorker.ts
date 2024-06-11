/**
 * @file tabsWorker.ts
 * @description A class to manage browser tabs, assigning a primary tab and handling the status changes among tabs.
 *
 * This library ensures that a single browser tab is marked as the primary tab,
 * while others are marked as slave tabs. When the primary tab is closed, the
 * status is transferred to another tab. This helps in managing tab-specific
 * functionalities like maintaining session states, or performing tasks which
 * should only occur in one tab at a time.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 */
import globalConfig from './config';
import type { TEvent } from "./types";

export class TabsWorker {
	private readonly tabId: string;

	constructor() {
		this.tabId = globalConfig.dict.tab_prefix + Date.now().toString();
		this.init();
	}

	/**
	 * Initializes event listeners for load, beforeunload, and storage events.
	 */
	private init() {
		if (typeof window === 'undefined') return;

		// Callback for load event
		const loadCb = () => {
			if (!localStorage.getItem(globalConfig.dict.primaryTabId)) {
				this.setPrimaryTab(this.tabId);
			} else {
				this.setSlaveTab(this.tabId);
			}

			this.notifyTabStatus();
		};

		// Callback for beforeunload event
		const beforeUnloadCb = () => {
			if (this.isPrimaryTab()) {
				this.transferPrimaryStatus();
			}
			this.removeTabStatus(this.tabId);
		};

		// Callback for storage event
		const storageCb = (event: StorageEvent) => {
			if (event.key === globalConfig.dict.primaryTabId) {
				this.notifyTabStatus();
			}
		};

		// Adding event listeners
		window.addEventListener('load', loadCb);
		window.addEventListener('beforeunload', beforeUnloadCb);
		window.addEventListener('storage', storageCb);

		loadCb();
	}

	/**
	 * Sets a key-value pair in localStorage.
	 * @param key - The key to set in localStorage.
	 * @param value - The value to set in localStorage.
	 */
	private set(key: string, value: string) {
		localStorage.setItem(key, value);
	}

	/**
	 * Gets a value from localStorage by key.
	 * @param key - The key to get from localStorage.
	 * @returns The value associated with the key in localStorage.
	 */
	private get(key: string): string | null {
		return localStorage.getItem(key);
	}

	/**
	 * Removes a key from localStorage.
	 * @param key - The key to remove from localStorage.
	 */
	private remove(key: string) {
		localStorage.removeItem(key);
	}

	/**
	 * Sets the current tab as the primary tab.
	 * @param id - The ID of the tab to set as primary.
	 */
	private setPrimaryTab(id: string) {
		this.set(globalConfig.dict.primaryTabId, id);
		this.set(id, globalConfig.dict.primary);
	}

	/**
	 * Sets the current tab as a slave tab.
	 * @param id - The ID of the tab to set as slave.
	 */
	private setSlaveTab(id: string) {
		this.set(id, globalConfig.dict.slave);
	}

	/**
	 * Transfers primary status to another tab if the current primary tab is closed.
	 */
	private transferPrimaryStatus() {
		const tabs = Object.keys(localStorage).filter(key => key !== globalConfig.dict.primaryTabId && this.get(key) === globalConfig.dict.slave);

		if (tabs.length > 0) {
			this.setPrimaryTab(tabs[0]);
		} else {
			this.remove(globalConfig.dict.primaryTabId);
		}
	}

	/**
	 * Removes the status of a tab from localStorage.
	 * @param id - The ID of the tab to remove status for.
	 */
	private removeTabStatus(id: string) {
		this.remove(id);
	}

	/**
	 * Notifies other tabs of the current tab's status (primary or slave).
	 */
	private notifyTabStatus() {
		if (typeof window === 'undefined') return;

		const event: TEvent = {
			detail: {
				tabId: this.tabId,
				isPrimary: this.isPrimaryTab(),
			},
		};

		window.dispatchEvent(new CustomEvent(globalConfig.dict.primaryStatusChanged, event))
	}

	/**
	 * Checks if the current tab is the primary tab.
	 * @returns True if the current tab is the primary tab, false otherwise.
	 */
	public isPrimaryTab(): boolean {
		return this.get(globalConfig.dict.primaryTabId) === this.tabId;
	}
}
