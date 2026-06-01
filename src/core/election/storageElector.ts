/**
 * @file election/storageElector.ts
 * @description Primary-tab election fallback via `localStorage` + the `storage` event.
 *
 * Used when the Web Locks API is unavailable. Uses a timestamped heartbeat claim so a
 * crashed primary is detected and replaced, plus a deterministic tab-id tie-break so
 * concurrent claims converge on a single primary. The claim key is namespaced per
 * `channelName`, so independent channels never contend for the same slot.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 * @internal
 */
import globalConfig from '../config';
import { TPrimaryChangeHandler } from '../../types';
import { BaseElector } from './baseElector';

type TPrimaryRecord = { tabId: string; ts: number };

export class StorageElector extends BaseElector {
	private readonly keyPrimary: string;

	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
	private storageHandler: ((event: StorageEvent) => void) | null = null;
	private unloadHandler: (() => void) | null = null;

	constructor(channelName: string, onChange: TPrimaryChangeHandler) {
		super(channelName, onChange);
		this.keyPrimary = `${globalConfig.dict.primaryTabId}__${channelName}`;
	}

	public start() {
		if (this.destroyed || typeof window === 'undefined') return;

		this.storageHandler = (event: StorageEvent) => {
			if (event.key === this.keyPrimary) this.evaluate();
		};
		this.unloadHandler = () => this.resign();

		window.addEventListener('storage', this.storageHandler);
		window.addEventListener('pagehide', this.unloadHandler);

		const begin = () => {
			if (this.destroyed) return;
			this.evaluate();
			this.heartbeatTimer = setInterval(() => this.evaluate(), globalConfig.timing.heartbeat);
		};

		if (document.readyState === 'complete') {
			begin();
		} else {
			window.addEventListener('load', begin, { once: true });
		}
	}

	private readPrimary(): TPrimaryRecord | null {
		try {
			const raw = localStorage.getItem(this.keyPrimary);
			if (!raw) return null;

			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed.tabId === 'string' && typeof parsed.ts === 'number') {
				return parsed as TPrimaryRecord;
			}
		} catch {
			/* ignore unavailable/corrupt storage */
		}

		return null;
	}

	private writePrimary() {
		try {
			localStorage.setItem(this.keyPrimary, JSON.stringify({ tabId: this.tabId, ts: Date.now() }));
		} catch {
			/* ignore quota / unavailable storage */
		}
	}

	/**
	 * Re-run the election. Idempotent: claims the slot if it is vacant or stale, refreshes
	 * the heartbeat if we already own it, and yields to a live primary otherwise (tie-broken
	 * by the smaller tab id so concurrent claims converge).
	 */
	private evaluate() {
		if (this.destroyed) return;

		const current = this.readPrimary();
		const fresh = !!current && Date.now() - current.ts <= globalConfig.timing.stale;

		if (!fresh) {
			this.writePrimary();
			this.setPrimary(true);
			return;
		}

		if (current!.tabId === this.tabId) {
			this.writePrimary(); // refresh heartbeat
			this.setPrimary(true);
			return;
		}

		// A different, live primary exists. Keep our claim only if we both think we are
		// primary and our id wins the tie-break; otherwise step down.
		if (this.primary && this.tabId < current!.tabId) {
			this.writePrimary();
			this.setPrimary(true);
		} else {
			this.setPrimary(false);
		}
	}

	/** Release leadership on tab teardown so another tab can take over immediately. */
	private resign() {
		const current = this.readPrimary();
		if (current && current.tabId === this.tabId) {
			try {
				localStorage.removeItem(this.keyPrimary);
			} catch {
				/* ignore */
			}
		}
	}

	public destroy() {
		if (this.destroyed) return;
		this.destroyed = true;

		if (this.heartbeatTimer !== null) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
		if (typeof window !== 'undefined') {
			if (this.storageHandler) window.removeEventListener('storage', this.storageHandler);
			if (this.unloadHandler) window.removeEventListener('pagehide', this.unloadHandler);
		}
		this.storageHandler = null;
		this.unloadHandler = null;

		this.resign();
		this.primary = false;
	}
}
