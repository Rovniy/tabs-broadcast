/**
 * @file tabsWorker.ts
 * @description Primary-tab election facade.
 *
 * Picks an election strategy at runtime and delegates to it:
 *  1. {@link WebLocksElector} — preferred, when `navigator.locks` is available.
 *  2. {@link StorageElector} — `localStorage` heartbeat fallback otherwise.
 *
 * Each strategy is namespaced per `channelName`, so independent channels (e.g. separate
 * micro-frontends) never contend for the same leadership slot.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 * @internal
 */
import { TPrimaryChangeHandler } from '../types';
import type { PrimaryElector } from './election/types';
import { WebLocksElector } from './election/webLocksElector';
import { StorageElector } from './election/storageElector';

export class TabsWorker {
	private readonly elector: PrimaryElector;

	constructor(channelName: string, onChange: TPrimaryChangeHandler) {
		this.elector = TabsWorker.hasWebLocks()
			? new WebLocksElector(channelName, onChange)
			: new StorageElector(channelName, onChange);

		this.elector.start();
	}

	private static hasWebLocks(): boolean {
		return (
			typeof navigator !== 'undefined' &&
			!!(navigator as any).locks &&
			typeof (navigator as any).locks.request === 'function'
		);
	}

	/**
	 * Whether this tab is currently the primary tab.
	 */
	public isPrimaryTab(): boolean {
		return this.elector.isPrimary();
	}

	/**
	 * Tear down the election strategy and relinquish leadership.
	 */
	public destroy() {
		this.elector.destroy();
	}
}
