/**
 * @file index.ts
 * @description Entry point for the TabsBroadcast library.
 *
 * Exports the `TabsBroadcast` class as both the default and a named export, plus the
 * public type definitions for TypeScript consumers.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 */
import { TabsBroadcast } from './core/tabsBroadcast';

export default TabsBroadcast;
export { TabsBroadcast };

export type {
	TDefaultConfig,
	TPayload,
	TEventMap,
	TPrimaryDetail,
	TPrimaryChangeHandler,
	TWildcardEvent,
	TCallbackItem,
	ILayers,
	TLayer,
} from './types';
