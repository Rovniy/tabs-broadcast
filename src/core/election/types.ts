/**
 * @file election/types.ts
 * @description Shared contract for primary-tab election strategies.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 * @internal
 */

/**
 * A leader-election strategy. Implementations decide which tab is "primary" and report
 * status changes through the handler supplied at construction.
 * @internal
 */
export interface PrimaryElector {
	/** Begin participating in the election. */
	start(): void;
	/** Whether this tab currently holds primary status. */
	isPrimary(): boolean;
	/** Stop participating, release resources, and relinquish leadership. */
	destroy(): void;
}
