/**
 * @file TabsBroadcast.ts
 * @description A class for managing inter-tab communication via BroadcastChannel.
 *
 * This class implements a singleton pattern to ensure a single instance.
 * It allows for registering, emitting, and handling various types of events across different browser tabs.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 */
import globalConfig from './config'
import { TabsWorker } from './tabsWorker'
import {ILayers, TDefaultConfig, TEvent, TLayer, TPayload} from './types';

/**
 * TabsBroadcast class facilitates inter-tab communication using the BroadcastChannel API.
 * It ensures a single instance is used across the application and provides methods to register,
 * emit, and handle events.
 */
export class TabsBroadcast {
    #channelName: string;
    #listenOwnChannel: boolean;
    #onBecomePrimaryCallback: (payload: any) => void;
    #emitByPrimaryOnly: boolean;
    #worker: TabsWorker;
    #channel: null|BroadcastChannel;
    #layers: ILayers
    primary: boolean = false;

    private static instance: null|TabsBroadcast;

    constructor(config: null|TDefaultConfig = null) {
        // Ensure singleton instance
        if (TabsBroadcast.instance) return TabsBroadcast.instance;

        this.setConfig(config)
        this.#init();

        TabsBroadcast.instance = this;
    }

    /**
     * Initialize the BroadcastChannel and set up event listeners.
     */
    #init() {
        if (!window) return

        this.#worker = new TabsWorker();
        this.#channel = new BroadcastChannel(this.#channelName);

        this.#channel.onmessage = this.#onMessage.bind(this);
        this.#channel.onmessageerror = this.#onError.bind(this);

        this.primary = false;

        this.#onBecomePrimary()
    }

    /**
     * Set up the event listener for becoming the primary tab.
     */
    #onBecomePrimary() {
        window.addEventListener(globalConfig.dict.primaryStatusChanged, (event: Event) => {
            const _event = event as unknown as TEvent;

            if (this.#worker.isPrimaryTab()) {
                this.primary = true;
                this.#onBecomePrimaryCallback(_event.detail);
            } else {
                this.primary = false;
            }
        }, { passive: true });
    }

    /**
     * Checking for the existence of a layer. Creating a new layer if it does not exist
     * @param {string} layer - the name of the layer you are looking for
     * @private
     */
    #checkOrCreateLayer(layer: string = globalConfig.defaultConfig.layer) {
        if (!this.#layers[layer]) {
            this.#layers[layer] = {
                name: layer,
                listeners: []
            }
        }

        return this.#layers[layer]
    }

    /**
     * Processing incoming messages
     * @param {MessageEvent<TPayload>} event - Incoming payload
     * @private
     */
    #onMessage(event: MessageEvent<TPayload>) {
        const { type, payload, layer } = event.data;

        const _l = this.#checkOrCreateLayer(layer);

        _l.listeners = _l.listeners.filter(item => {
            if (item.type === type) {
                item.callback({ type, payload, layer });

                return !item.once;
            }

            return true;
        });
    };

    /**
     * Error handling in the broker's work
     * @param {MessageEvent<any>} error - Error
     * @private
     */
    #onError(error: MessageEvent) {
        if (process.env.NODE_ENV === 'production') return;

        console.error('Can\'t parse message', error);
    }

    /**
     * Register a callback to be executed whenever a message of the specified type is received.
     * @param {string} type - The type of the message.
     * @param {function} callback - The function to execute when a message of the specified type is received.
     * @param {string} layer - The name of the layer to which the message is addressed.
     */
    on(type: string, callback: () => void, layer: string) {
        this.#checkOrCreateLayer(layer)
            .listeners
            .push({ type, callback })
    }

    /**
     * Register multiple callbacks to be executed whenever messages of specified types are received.
     * @param {Array.<Array.<string, function, string>>} list - List of type-callback pairs.
     */
    onList(list: [string, () => void, string][]) {
        if (!list.length) return;

        list.forEach(([type, callback, layer]) => {
            if (!type || !callback) return;

            this.#checkOrCreateLayer(layer)
                .listeners
                .push({ type, callback })
        });
    }

    /**
     * Register a callback to be executed only once when a message of the specified type is received.
     * @param {string} type - The type of the message.
     * @param {function} callback - The function to execute when a message of the specified type is received.
     * @param {string} layer - The name of the layer to which the message is addressed.
     */
    once(type: string, callback: () => void, layer: string) {
        this.#checkOrCreateLayer(layer)
            .listeners
            .push({ type, callback, once: true })
    }

    /**
     * Register multiple callbacks to be executed one-time when messages of specified types are received.
     * @param {Array.<Array.<string, function>>} list - List of type-callback pairs.
     */
    onceList(list: [string, () => void, string][]) {
        if (!list.length) return;

        list.forEach(([type, callback, layer = globalConfig.defaultConfig.layer]) => {
            if (!type || !callback) return;

            this.#checkOrCreateLayer(layer)
                .listeners
                .push({ type, callback, once: true })
        });
    }

    /**
     * Unregister all callbacks of the specified type.
     * @param {string} type - The type of the messages for which to unregister the callbacks.
     * @param {string|null} [layer] - Specifying the layer to delete the message from.
     */
    off(type: string, layer: string|null = null) {
        if (layer) {
            this.#layers[layer].listeners.filter(item => item.type !== type);
        } else {
            for (const layerName in this.#layers) {
                this.#layers[layerName].listeners.filter(item => item.type !== type);
            }
        }
    }

    /**
     * Delete and unregister all callbacks of the specified layer.
     * @param {string} layer - The name of the layer to be deleted.
     */
    deleteLayer(layer: string) {
        const _l = this.#checkOrCreateLayer(layer);

        _l.listeners = []
        this.#layers[layer] = null
        delete this.#layers[layer]
    }

    /**
     * Emit a message to all listening tabs with the specified type, payload and layer.
     * @param {string} type - The type of the message.
     * @param {*} [payload=null] - The payload of the message.
     * @param {string} [layer] - The name of the layer to which the message is addressed.
     */
    emit(type: string, payload: any = null, layer: string = globalConfig.defaultConfig.layer) {
        if (this.#emitByPrimaryOnly && !this.#worker.isPrimaryTab()) return;

        if (!this.#channel) return;

        const message: TPayload = { type, payload, layer };
        this.#channel.postMessage(message);

        if (this.#listenOwnChannel) {
            // @ts-ignore
            this.#channel.onmessage({ data: message });
        }
    }

    /**
     * Check if the current tab is the primary tab.
     * @returns {boolean} - True if the current tab is primary, false otherwise.
     * @deprecated - Use `TabBroadcast.primary` for primary tab identify
     */
    isPrimary(): boolean {
        return this.#worker.isPrimaryTab();
    }

    /**
     * Set custom config properties
     * @param {TDefaultConfig} config - Optional custom config
     */
    setConfig(config: null|TDefaultConfig) {
        const _config = {
            ...globalConfig.defaultConfig,
            ...config
        };

        this.#channelName = _config.channelName;
        this.#layers = {};
        this.#listenOwnChannel = _config.listenOwnChannel;
        this.#onBecomePrimaryCallback = _config.onBecomePrimary;
        this.#emitByPrimaryOnly = _config.emitByPrimaryOnly;
    }

    /**
     * Destroy the BroadcastChannel. Messages will no longer be received.
     */
    destroy() {
        if (this.#channel) {
            this.#channel.close();
        }

        TabsBroadcast.instance = null;
        this.#channel = null;
    }

    /**
     * Receive copy of events list
     */
    getEvents() {
        const isOnlyDefaultLayer = Object.keys(this.#layers).length === 1 && this.#layers[globalConfig.defaultConfig.layer];

        if (isOnlyDefaultLayer) {
            return [ ...this.#layers[globalConfig.defaultConfig.layer].listeners ];
        }

        return Object.values(this.#layers).reduce((acc, layerData) => {
            acc = [ ...acc, ...layerData.listeners ]
            return acc
        }, []);
    }

    /**
     * Get a list of all available layers
     */
    getLayers() : string[] {
        return Object.keys(this.#layers)
    }
}
