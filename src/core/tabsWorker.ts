/**
 * @file tabsWorker.ts
 * @description Leader (primary) tab election across browser tabs of the same origin.
 *
 * Exactly one tab is elected "primary"; the rest are "slaves". When the primary tab
 * goes away the role is transferred to another tab.
 *
 * Two strategies are used, picked at runtime:
 *  1. Web Locks API (`navigator.locks`) — preferred. Leadership is held by keeping a
 *     lock acquired; the browser releases it automatically when the tab dies, so there
 *     are no stale entries and no election races.
 *  2. localStorage fallback — for environments without Web Locks. Uses a heartbeat
 *     (timestamped claim) so a crashed primary is detected and replaced, plus a
 *     deterministic tab-id tie-break to converge when two tabs claim simultaneously.
 *
 * All keys/locks are namespaced per `channelName`, so independent channels (e.g.
 * separate micro-frontends) never fight over the same leadership slot.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 */
import globalConfig from './config';
import { TPrimaryChangeHandler } from '../types';

type TPrimaryRecord = { tabId: string, ts: number };

export class TabsWorker {
	private readonly tabId: string;
	private readonly channelName: string;
	private readonly onChange: TPrimaryChangeHandler;

	private primary = false;
	private destroyed = false;

	private readonly keyPrimary: string;
	private readonly lockName: string;

	// Web Locks: resolving this releases the held lock (and our leadership).
	private releaseLock: (() => void) | null = null;

	// localStorage fallback bookkeeping
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
	private storageHandler: ((event: StorageEvent) => void) | null = null;
	private unloadHandler: (() => void) | null = null;

	constructor(channelName: string, onChange: TPrimaryChangeHandler) {
		this.channelName = channelName;
		this.onChange = onChange;
		this.tabId = this.generateId();
		this.keyPrimary = `${globalConfig.dict.primaryTabId}__${channelName}`;
		this.lockName = `${globalConfig.dict.primaryLock}__${channelName}`;
		this.init();
	}

	/**
	 * Generate a collision-resistant tab id. Prefers crypto.randomUUID; falls back to
	 * a time+random string in environments that lack it.
	 */
	private generateId(): string {
		const prefix = globalConfig.dict.tab_prefix;

		try {
			if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
				return prefix + crypto.randomUUID();
			}
		} catch { /* fall through */ }

		return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2);
	}

	/**
	 * Choose an election strategy and start it.
	 */
	private init() {
		if (typeof window === 'undefined') return;

		if (this.hasWebLocks()) {
			this.initWebLocks();
		} else {
			this.initStorageFallback();
		}
	}

	private hasWebLocks(): boolean {
		return typeof navigator !== 'undefined'
			&& !!(navigator as any).locks
			&& typeof (navigator as any).locks.request === 'function';
	}

	// --- Web Locks strategy --------------------------------------------------

	private initWebLocks() {
		const locks = (navigator as any).locks;

		// Request the lock. We become primary the moment it is granted, and we hold it
		// (by keeping the promise pending) until destroy() resolves it or the tab dies.
		locks.request(this.lockName, () => new Promise<void>((resolve) => {
			if (this.destroyed) {
				resolve();
				return;
			}
			this.releaseLock = resolve;
			this.setPrimary(true);
		})).catch(() => { /* request aborted (e.g. on destroy) */ });
	}

	// --- localStorage fallback strategy --------------------------------------

	private initStorageFallback() {
		this.storageHandler = (event: StorageEvent) => {
			if (event.key === this.keyPrimary) this.evaluate();
		};
		this.unloadHandler = () => this.resign();

		window.addEventListener('storage', this.storageHandler);
		window.addEventListener('pagehide', this.unloadHandler);

		const start = () => {
			if (this.destroyed) return;
			this.evaluate();
			this.heartbeatTimer = setInterval(() => this.evaluate(), globalConfig.timing.heartbeat);
		};

		if (document.readyState === 'complete') {
			start();
		} else {
			window.addEventListener('load', start, { once: true });
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
		} catch { /* ignore unavailable/corrupt storage */ }

		return null;
	}

	private writePrimary() {
		try {
			localStorage.setItem(this.keyPrimary, JSON.stringify({ tabId: this.tabId, ts: Date.now() }));
		} catch { /* ignore quota / unavailable storage */ }
	}

	/**
	 * Re-run the election. Idempotent: claims the slot if it is vacant or stale,
	 * refreshes the heartbeat if we already own it, and yields to a live primary
	 * otherwise (tie-broken by the smaller tab id so concurrent claims converge).
	 */
	private evaluate() {
		if (this.destroyed) return;

		const current = this.readPrimary();
		const fresh = !!current && (Date.now() - current.ts <= globalConfig.timing.stale);

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

	/**
	 * Release leadership on tab teardown so another tab can take over immediately.
	 */
	private resign() {
		const current = this.readPrimary();
		if (current && current.tabId === this.tabId) {
			try { localStorage.removeItem(this.keyPrimary); } catch { /* ignore */ }
		}
	}

	private setPrimary(value: boolean) {
		if (this.primary === value) return;
		this.primary = value;
		this.onChange(value, { tabId: this.tabId });
	}

	/**
	 * Whether this tab is currently the primary tab.
	 */
	public isPrimaryTab(): boolean {
		return this.primary;
	}

	/**
	 * Tear down all listeners/timers and relinquish leadership.
	 */
	public destroy() {
		if (this.destroyed) return;
		this.destroyed = true;

		// Web Locks: resolving the held promise releases the lock.
		if (this.releaseLock) {
			try { this.releaseLock(); } catch { /* ignore */ }
			this.releaseLock = null;
		}

		// localStorage fallback cleanup.
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
