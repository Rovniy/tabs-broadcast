/**
 * @file index.d.ts
 * @description Type definitions for the TabsBroadcast class.
 *
 * @license MIT
 * @autor Andrei (Ravy) Rovnyi
 */

/**
 * TEvent represents the structure of a custom event, detailing the tabId and its primary status.
 */
export type TEvent = {
    detail: {
        tabId: string, // Unique tab ID
        isPrimary: boolean // Primary flag
    }
}

/**
 * TDefaultConfig represents the default configuration options for the TabsBroadcast.
 */
export type TDefaultConfig = {
    channelName: string, // Broadcast channel name
    listenOwnChannel: boolean, // Listen broadcast event on current tab
    emitByPrimaryOnly: boolean, // Emits event only by Primary tab
    onBecomePrimary: (payload: TEvent) => void, // Event that fired when current tab become Primary
}

/**
 * TCallbackItem represents a callback item to be executed when a specific event type is received.
 */
export interface TCallbackItem {
    type: string; // Custom event name
    callback: (payload: any) => void; // Callback function
    once?: boolean; // Delete after actor?
}

/**
 * TabsBroadcast class facilitates inter-tab communication using the BroadcastChannel API.
 * It ensures a single instance is used across the application and provides methods to register,
 * emit, and handle events.
 */
export default class TabsBroadcast {
    constructor(config?: TDefaultConfig);

    /**
     * Register a callback to be executed whenever a message of the specified type is received.
     * @param type
     * @param callback
     */
    on(type: string, callback: (payload: any) => void): void;

    /**
     * Register multiple callbacks to be executed whenever messages of specified types are received.
     * @param list
     */
    onList(list: [string, (payload: any) => void][]): void;

    /**
     * Register a callback to be executed only once when a message of the specified type is received.
     * @param type
     * @param callback
     */
    once(type: string, callback: (payload: any) => void): void;

    /**
     * Register multiple callbacks to be executed one-time when messages of specified types are received.
     * @param list
     */
    onceList(list: [string, (payload: any) => void][]): void;

    /**
     * Unregister all callbacks of the specified type.
     * @param type
     */
    off(type: string): void;

    /**
     * Emit a message to all listening tabs with the specified type and payload.
     * @param type
     * @param payload
     */
    emit(type: string, payload?: any): void;

    /**
     * Check if the current tab is the primary tab.
     */
    isPrimary(): boolean;

    /**
     * Set custom configuration properties.
     * @param config
     */
    setConfig(config?: TDefaultConfig): void;

    /**
     * Destroy the BroadcastChannel. Messages will no longer be received.
     */
    destroy(): void;

    /**
     * Receive a copy of the registered events list.
     */
    getEvents(): TCallbackItem[];
}
