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
    channelName: string, // Broadcast channel name
    layer: string,
    listenOwnChannel?: boolean, // Listen broadcast event on current tab
    emitByPrimaryOnly?: boolean, // Emits event only by Primary tab
    onBecomePrimary?: (payload: TEvent) => void, // Event that fired when current tab become Primary
}

/**
 * TConfig represents the complete configuration structure for the TabsBroadcast.
 */
export type TConfig = {
    defaultConfig: TDefaultConfig,
    dict: {
        tab_prefix : string,
        slave : string,
        primary : string,
        primaryTabId : string,
        primaryStatusChanged : string
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
    callback: (payload: any) => void;
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
 * TEvent represents the structure of a custom event, detailing the tabId and its primary status.
 */
export type TEvent = {
    detail: {
        tabId: string,
        isPrimary: boolean
    }
}
