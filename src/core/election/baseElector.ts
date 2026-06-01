/**
 * @file election/baseElector.ts
 * @description Common state/transition handling shared by election strategies.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 * @internal
 */
import { TPrimaryChangeHandler } from '../../types';
import { generateTabId } from './tabId';
import type { PrimaryElector } from './types';

/**
 * Base class holding the tab id, the change handler, and the primary flag. Subclasses
 * implement {@link PrimaryElector.start} / {@link PrimaryElector.destroy} and flip status
 * via {@link BaseElector.setPrimary}, which fires the handler only on real transitions.
 * @internal
 */
export abstract class BaseElector implements PrimaryElector {
	protected readonly tabId: string;
	protected readonly channelName: string;
	protected readonly onChange: TPrimaryChangeHandler;
	protected primary = false;
	protected destroyed = false;

	protected constructor(channelName: string, onChange: TPrimaryChangeHandler) {
		this.channelName = channelName;
		this.onChange = onChange;
		this.tabId = generateTabId();
	}

	protected setPrimary(value: boolean) {
		if (this.primary === value) return;
		this.primary = value;
		this.onChange(value, { tabId: this.tabId });
	}

	public isPrimary(): boolean {
		return this.primary;
	}

	public abstract start(): void;
	public abstract destroy(): void;
}
