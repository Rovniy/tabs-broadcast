/**
 * @file types.ts
 * @description Type definitions for the TabsBroadcast and TabsWorker libraries.
 *
 * This file contains the type definitions used across the TabsBroadcast and TabsWorker libraries.
 * These types are essential for ensuring type safety and providing a clear contract for the expected
 * data structures and function signatures.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 */

/**
 * TDefaultConfig represents the default configuration options for the TabsBroadcast.
 */
export type TDefaultConfig = {
    channelName?: string, // Broadcast channel name
    layer?: string, // Default layer name
    listenOwnChannel?: boolean, // Listen broadcast event on current tab
    emitByPrimaryOnly?: boolean, // Emits event only by Primary tab
    onBecomePrimary?: (detail: TPrimaryDetail) => void, // Event that fired when current tab become Primary
    disableInternalErrors?: boolean // Disable internal errors logging
}

/**
 * TConfig represents the complete configuration structure for the TabsBroadcast.
 */
export type TConfig = {
    defaultConfig: Required<TDefaultConfig>,
    dict: {
        tab_prefix: string,
        primaryTabId: string,
        primaryLock: string,
    },
    timing: {
        heartbeat: number,
        stale: number,
    }
}

/**
 * Layers used for a single channel
 */
export type TLayer = {
    name: string,
    listeners: TCallbackItem[]
}
export interface ILayers {
    [key: string]: TLayer
}

/**
 * TCallbackItem represents a callback item to be executed when a specific event type is received.
 */
export interface TCallbackItem {
    type: string;
    callback: (payload: TPayload) => void;
    layer?: string;
    once?: boolean;
}

/**
 * TPayload represents the structure of the message payload.
 */
export type TPayload = {
    type: string,
    payload: any,
    layer: string
}

/**
 * Detail passed to the `onBecomePrimary` callback when this tab acquires primary status.
 */
export type TPrimaryDetail = {
    tabId: string
}

/**
 * Handler invoked by TabsWorker whenever this tab's primary status changes.
 */
export type TPrimaryChangeHandler = (isPrimary: boolean, detail: TPrimaryDetail) => void

export type TWildcardEvent = '*'
