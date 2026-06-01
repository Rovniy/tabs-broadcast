export declare interface ILayers {
    [key: string]: TLayer;
}

/**
 * TabsBroadcast facilitates inter-tab communication using the BroadcastChannel API.
 * It ensures a single instance is used across the application and provides methods to register,
 * emit, and handle events.
 *
 * @typeParam TEvents - Optional event map (`{ eventName: payloadType }`) for fully typed
 * `on`/`once`/`emit`. Defaults to a permissive map, so untyped usage keeps working.
 *
 * @example
 * ```ts
 * // Untyped
 * const bus = new TabsBroadcast();
 * bus.on('hello', (e) => console.log(e.payload));
 *
 * // Typed
 * type Events = { login: { userId: string }; logout: null };
 * const typed = new TabsBroadcast<Events>();
 * typed.on('login', (e) => e.payload.userId); // payload is { userId: string }
 * typed.emit('login', { userId: '42' });
 * ```
 */
declare class TabsBroadcast<TEvents extends TEventMap = TEventMap> {
    #private;
    channelName: string;
    layers: ILayers;
    /** Whether the current tab is the primary tab. */
    primary: boolean;
    private static instance;
    constructor(config?: TDefaultConfig);
    /**
     * Register a callback executed whenever a message of the given type is received.
     *
     * @param type - The event type, or `'*'` to capture every event in the layer.
     * @param callback - Invoked with `{ type, payload, layer }` for each matching message.
     * @param layer - Optional layer to scope the listener to (default layer otherwise).
     * @example
     * ```ts
     * bus.on('eventName', ({ payload }) => console.log(payload));
     * bus.on('*', (event) => console.log('any event', event), 'APP_LAYER_0');
     * ```
     */
    on<K extends keyof TEvents & string>(type: K, callback: (event: {
        type: K;
        payload: TEvents[K];
        layer: string;
    }) => void, layer?: string): void;
    on(type: TWildcardEvent, callback: (event: TPayload<TEvents[keyof TEvents]>) => void, layer?: string): void;
    /**
     * Register multiple persistent listeners at once.
     * @param list - Tuples of `[type, callback, layer?]`.
     * @example
     * ```ts
     * bus.onList([
     *   ['eventA', onA],
     *   ['eventB', onB, 'APP_LAYER_0'],
     * ]);
     * ```
     */
    onList(list: [keyof TEvents & string, (event: TPayload) => void, string?][]): void;
    /**
     * Register a callback executed only once for the given message type.
     *
     * @param type - The event type.
     * @param callback - Invoked once with `{ type, payload, layer }`, then removed.
     * @param layer - Optional layer to scope the listener to.
     */
    once<K extends keyof TEvents & string>(type: K, callback: (event: {
        type: K;
        payload: TEvents[K];
        layer: string;
    }) => void, layer?: string): void;
    once(type: TWildcardEvent, callback: (event: TPayload<TEvents[keyof TEvents]>) => void, layer?: string): void;
    /**
     * Register multiple one-time listeners at once.
     * @param list - Tuples of `[type, callback, layer?]`.
     */
    onceList(list: [keyof TEvents & string, (event: TPayload) => void, string?][]): void;
    /**
     * Unregister all callbacks of the given type.
     * @param type - The event type to remove.
     * @param layer - Optional layer to remove from; omit to remove from every layer.
     */
    off(type: keyof TEvents & string, layer?: string | null): void;
    /**
     * Delete a layer and unregister all of its listeners.
     * @param layer - The layer name to delete.
     */
    deleteLayer(layer: string): void;
    /**
     * Emit a message to all listening tabs (and this tab if `listenOwnChannel` is set).
     * No-op on non-primary tabs when `emitByPrimaryOnly` is enabled.
     *
     * @param type - The event type.
     * @param payload - The payload to send (default `null`).
     * @param layers - A single layer name or an array of layer names to target.
     * @example
     * ```ts
     * bus.emit('eventName', { id: 1 });
     * bus.emit('eventName', { id: 1 }, ['APP_LAYER_0', 'APP_LAYER_3']);
     * ```
     */
    emit<K extends keyof TEvents & string>(type: K, payload?: TEvents[K], layers?: string | string[]): void;
    /**
     * Check if the current tab is the primary tab.
     * @returns True if the current tab is primary, false otherwise.
     * @deprecated Use the `primary` property instead.
     */
    isPrimary(): boolean;
    /**
     * Set custom config properties.
     * @param config - Optional custom config (merged over defaults).
     */
    setConfig(config?: TDefaultConfig): void;
    /**
     * Destroy the BroadcastChannel, tear down the election worker, clear all listeners,
     * and reset the singleton.
     * @param delay - Optional delay in milliseconds before destruction begins.
     */
    destroy(delay?: number): Promise<void>;
    /**
     * Retrieve an aggregated copy of every layer's listeners.
     * @returns A flat array of all registered listener items.
     */
    getEvents(): TCallbackItem[];
    /**
     * Retrieve the list of registered layer names.
     * @returns The keys of the layers map.
     */
    getLayers(): string[];
    /**
     * Extend the instance with a plugin.
     * @param plugin - A function receiving the instance to mutate/extend.
     */
    use(plugin: (instance: TabsBroadcast<TEvents>) => void): void;
}
export { TabsBroadcast }
export default TabsBroadcast;

/**
 * TCallbackItem represents a callback item to be executed when a specific event type is received.
 */
export declare interface TCallbackItem {
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
export declare type TDefaultConfig = {
    channelName?: string;
    layer?: string;
    listenOwnChannel?: boolean;
    emitByPrimaryOnly?: boolean;
    onBecomePrimary?: (detail: TPrimaryDetail) => void;
    disableInternalErrors?: boolean;
};

/**
 * TEventMap maps event names to their payload types for typed `TabsBroadcast<TEvents>` usage.
 */
export declare type TEventMap = Record<string, any>;

/**
 * Layers used for a single channel
 */
export declare type TLayer = {
    name: string;
    listeners: TCallbackItem[];
};

/**
 * TPayload represents the structure of the message payload delivered to listeners.
 * @typeParam P - The payload value type (defaults to `any` for untyped usage).
 */
export declare type TPayload<P = any> = {
    type: string;
    payload: P;
    layer: string;
};

/**
 * Handler invoked by TabsWorker whenever this tab's primary status changes.
 */
export declare type TPrimaryChangeHandler = (isPrimary: boolean, detail: TPrimaryDetail) => void;

/**
 * Detail passed to the `onBecomePrimary` callback when this tab acquires primary status.
 */
export declare type TPrimaryDetail = {
    tabId: string;
};

export declare type TWildcardEvent = '*';

export { }
