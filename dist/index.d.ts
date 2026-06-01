declare interface ILayers {
    [key: string]: TLayer;
}

/**
 * TabsBroadcast class facilitates inter-tab communication using the BroadcastChannel API.
 * It ensures a single instance is used across the application and provides methods to register,
 * emit, and handle events.
 */
declare class TabsBroadcast {
    #private;
    channelName: string;
    layers: ILayers;
    primary: boolean;
    private static instance;
    constructor(config?: TDefaultConfig);
    /**
     * Register a callback to be executed whenever a message of the specified type is received.
     * And register a wildcard listener for all event types.
     * @param {string} type - The type of the message.
     * @param {Function} callback - The function to execute when a message of the specified type is received.
     * @param {string} layer - The name of the layer to which the message is addressed.
     */
    on(type: string | TWildcardEvent, callback: (event: TPayload) => void, layer?: string): void;
    /**
     * Register multiple callbacks to be executed whenever messages of specified types are received.
     * @param {Array.<Array.<string, function, string>>} list - List of type-callback pairs.
     */
    onList(list: [string, (event: TPayload) => void, string?][]): void;
    /**
     * Register a callback to be executed only once when a message of the specified type is received.
     * @param {string} type - The type of the message.
     * @param {function} callback - The function to execute when a message of the specified type is received.
     * @param {string} layer - The name of the layer to which the message is addressed.
     */
    once(type: string, callback: (event: TPayload) => void, layer?: string): void;
    /**
     * Register multiple callbacks to be executed one-time when messages of specified types are received.
     * @param {Array.<Array.<string, function>>} list - List of type-callback pairs.
     */
    onceList(list: [string, (event: TPayload) => void, string?][]): void;
    /**
     * Unregister all callbacks of the specified type.
     * @param {string} type - The type of the messages for which to unregister the callbacks.
     * @param {string|null} [layer] - Specifying the layer to delete the message from.
     */
    off(type: string, layer?: string | null): void;
    /**
     * Delete and unregister all callbacks of the specified layer.
     * @param {string} layer - The name of the layer to be deleted.
     */
    deleteLayer(layer: string): void;
    /**
     * Emit a message to all listening tabs with the specified type, payload and layer.
     * @param {string} type - The type of the event.
     * @param {*} payload - The payload to send with the event.
     * @param {string | string[]} layers - A single layer name or an array of layer names.
     */
    emit(type: string, payload?: any, layers?: string | string[]): void;
    /**
     * Check if the current tab is the primary tab.
     * @returns {boolean} - True if the current tab is primary, false otherwise.
     * @deprecated - Use `TabsBroadcast.primary` for primary tab identify
     */
    isPrimary(): boolean;
    /**
     * Set custom config properties
     * @param {TDefaultConfig} config - Optional custom config
     */
    setConfig(config?: TDefaultConfig): void;
    /**
     * Destroys the BroadcastChannel and cleans up resources.
     * @param {number} delay - The optional delay (in milliseconds) before destruction begins.
     */
    destroy(delay?: number): Promise<void>;
    /**
     * Retrieves a list of event listeners across all layers.
     *
     * @return {Array} An aggregated copy of every layer's listeners.
     */
    getEvents(): TCallbackItem[];
    /**
     * Retrieves the list of layer names.
     *
     * @return {string[]} An array of strings representing the keys of the layers.
     */
    getLayers(): string[];
    /**
     * Enable plugins for extending the library.
     * @param {Function} plugin - Plugin function to extend the TabsBroadcast instance.
     */
    use(plugin: (instance: TabsBroadcast) => void): void;
}
export default TabsBroadcast;

/**
 * TCallbackItem represents a callback item to be executed when a specific event type is received.
 */
declare interface TCallbackItem {
    type: string;
    callback: (payload: TPayload) => void;
    layer?: string;
    once?: boolean;
}

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
declare type TDefaultConfig = {
    channelName?: string;
    layer?: string;
    listenOwnChannel?: boolean;
    emitByPrimaryOnly?: boolean;
    onBecomePrimary?: (detail: TPrimaryDetail) => void;
    disableInternalErrors?: boolean;
};

/**
 * Layers used for a single channel
 */
declare type TLayer = {
    name: string;
    listeners: TCallbackItem[];
};

/**
 * TPayload represents the structure of the message payload.
 */
declare type TPayload = {
    type: string;
    payload: any;
    layer: string;
};

/**
 * Detail passed to the `onBecomePrimary` callback when this tab acquires primary status.
 */
declare type TPrimaryDetail = {
    tabId: string;
};

declare type TWildcardEvent = '*';

export { }
