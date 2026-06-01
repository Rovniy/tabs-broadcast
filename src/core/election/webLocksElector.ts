/**
 * @file election/webLocksElector.ts
 * @description Primary-tab election via the Web Locks API (`navigator.locks`).
 *
 * Leadership is modelled as holding a named lock: the lock is requested once, and held by
 * keeping the request callback's promise pending. The browser releases it automatically
 * when the tab closes or crashes, so there are no stale entries and no election races.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 * @internal
 */
import globalConfig from '../config';
import { TPrimaryChangeHandler } from '../../types';
import { BaseElector } from './baseElector';

export class WebLocksElector extends BaseElector {
	private readonly lockName: string;
	// Resolving this releases the held lock (and our leadership).
	private releaseLock: (() => void) | null = null;

	constructor(channelName: string, onChange: TPrimaryChangeHandler) {
		super(channelName, onChange);
		this.lockName = `${globalConfig.dict.primaryLock}__${channelName}`;
	}

	public start() {
		if (this.destroyed) return;

		const locks = (navigator as any).locks;

		// We become primary the moment the lock is granted, and hold it until destroy()
		// resolves the promise or the tab dies.
		locks
			.request(
				this.lockName,
				() =>
					new Promise<void>((resolve) => {
						if (this.destroyed) {
							resolve();
							return;
						}
						this.releaseLock = resolve;
						this.setPrimary(true);
					}),
			)
			.catch(() => {
				/* request aborted (e.g. on destroy) */
			});
	}

	public destroy() {
		if (this.destroyed) return;
		this.destroyed = true;

		if (this.releaseLock) {
			try {
				this.releaseLock();
			} catch {
				/* ignore */
			}
			this.releaseLock = null;
		}
		this.primary = false;
	}
}
