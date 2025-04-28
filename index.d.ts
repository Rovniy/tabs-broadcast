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
 * Plugin type definition for extending TabsBroadcast functionality.
 */
export type TPlugin = (instance: TabsBroadcast) => void;

/**
 * A tuple type representing a list item structure.
 *
 * @typedef {Array} TListItem
 * @property {string} 0 - The first element in the tuple, representing a string value.
 * @property {(payload: any) => void} 1 - The second element in the tuple, representing a callback function that takes a single parameter `payload` of any type and returns void.
 */
export type TListItem = [
    string,
    (payload: any) => void
]

/**
 * TabsBroadcast class facilitates inter-tab communication using the BroadcastChannel API.
 * It ensures a single instance is used across the application and provides methods to register,
 * emit, and handle events.
 */
export default class TabsBroadcast {
    constructor(config?: TDefaultConfig);

    /**
     * Indicates whether the current tab is the primary tab.
     */
    primary: boolean;

    /**
     * Register a callback to be executed whenever a message of the specified type is received.
     *
     * @param {String} type - Event type to listen for
     * @param {Function} callback - Callback function to execute upon receiving the event
     * @param {String} layer - Optional name of the layer to register the listener for
     */
    on(type: string | '*', callback: (payload: any) => void, layer?: string): void;

    /**
     * Emit a message to all listeners for the specified type and payload.
     *
     * Supports emitting to multiple layers.
     * @param {String} type - The type of the event being emitted
     * @param {Function} payload - Data to send with the event
     * @param {String|String[]} layers - Optional layer name(s) to target. Can be a string or an array of strings.
     */
    emit(type: string, payload?: any, layers?: string | string[]): void;

    /**
     * Unregister all callbacks of the specified type.
     *
     * @param {String} type - Event type to remove all listeners for
     * @param {String} layer - Optional layer to target for listener removal
     */
    off(type: string, layer?: string): void;

    /**
     * Register a callback to be executed only once when a message of the specified type is received.
     *
     * @param {String | '*'} type - Event type to listen for
     * @param {Function} callback - Callback function to execute upon receiving the event
     * @param {String} layer - Optional name of the layer to register the listener for
     */
    once(type: string, callback: (payload: any) => void, layer?: string): void;

    /**
     * Destroy the BroadcastChannel and clean up resources.
     * Clears all listeners, layers, and closes the channel.
     *
     * @param {Number} delay - Optional delay in milliseconds before destruction
     */
    destroy(delay?: number): Promise<void>;

    /**
     * Set custom configuration properties.
     *
     * @param {TDefaultConfig} config - The configuration object to set or update
     */
    setConfig(config?: TDefaultConfig): void;

    /**
     * Register a plugin to extend the functionality of TabsBroadcast.
     *
     * @param {TPlugin} plugin - The plugin function to apply
     */
    use(plugin: TPlugin): void;

    /**
     * Retrieves a list of events.
     *
     * @return {TCallbackItem[]} An array of callback items representing events.
     */
    getEvents(): TCallbackItem[];

    /**
     * Retrieves the list of layers.
     *
     * @return {string[]} An array of strings representing the layers.
     */
    getLayers() : string[];

    /**
     * Deprecated - Check if the current tab is the primary tab.
     * @deprecated Use `TabsBroadcast.primary` instead.
     */
    isPrimary(): boolean;

    /**
     * Handles the operation for a given list of items.
     *
     * @param {TListItem[]} list - An array of items to be processed.
     * @return {void} This method does not return a value.
     */
    onList(list: TListItem[]): void;

    /**
     * Processes a list of tasks, where each task consists of a string identifier and a callback function.
     * The callback functions are executed once with their respective payloads.
     *
     * @param {TListItem[]} list - An array of items to be processed.
     * @return {void} This method does not return a value.
     */
    onceList(list: TListItem[]): void;
}
