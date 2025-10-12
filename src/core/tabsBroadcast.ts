/**
 * @file tabsBroadcast.ts
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
import { ILayers, TDefaultConfig, TEvent, TWildcardEvent, TPayload } from '../types';

const WILDCARD_EVENT = '*'

/**
 * TabsBroadcast class facilitates inter-tab communication using the BroadcastChannel API.
 * It ensures a single instance is used across the application and provides methods to register,
 * emit, and handle events.
 */
export class TabsBroadcast {
	channelName: string;
	layers: ILayers = {};
	primary: boolean = false; // Indicates whether the current tab is the primary tab.

    #listenOwnChannel: boolean;
    #emitByPrimaryOnly: boolean;
    #worker: TabsWorker;
    #channel: null|BroadcastChannel;
    #disableInternalErrors: boolean = true;
	#onBecomePrimaryCallback: (payload: any) => void;

    private static instance: null|TabsBroadcast;

    constructor(config?: TDefaultConfig) {
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

		this.primary = false;

        this.#worker = new TabsWorker();
        this.#channel = new BroadcastChannel(this.channelName);
        this.#channel.onmessage = this.#onMessage.bind(this);
        this.#channel.onmessageerror = this.#onError.bind(this);
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

				try {
					this.#onBecomePrimaryCallback(_event.detail);
				} catch (e) {
					this.#handleError('Can\'t execute become primary callback', e);
				}
            } else {
                this.primary = false;
            }
        }, { passive: true });
    }

	#handleError(...args: any[]) {
		if (this.#disableInternalErrors) return;

		console.error(`TabsBroadcast : Channel=${this.channelName}`, ...args)
	}

    /**
     * Checking for the existence of a layer. Creating a new layer if it does not exist
     * @param {string} layer - the name of the layer you are looking for
     * @private
     */
    #checkOrCreateLayer(layer: string = globalConfig.defaultConfig.layer) {
        if (!this.layers[layer]) {
            this.layers[layer] = {
                name: layer,
                listeners: []
            }
        }

        return this.layers[layer]
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
            if (item.type === type || item.type === WILDCARD_EVENT) {
				try {
					item.callback({ type, payload, layer });
				} catch (e) {
					this.#handleError('Can\'t execute callback', e);
				}

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
		if (this.#disableInternalErrors) return;

		this.#handleError('Can\'t parse message', error);
    }

    /**
     * Register a callback to be executed whenever a message of the specified type is received.
     * And register a wildcard listener for all event types.
     * @param {string} type - The type of the message.
     * @param {Function} callback - The function to execute when a message of the specified type is received.
     * @param {string} layer - The name of the layer to which the message is addressed.
     */
    on(type: string | TWildcardEvent, callback: (event: TPayload) => void, layer: string = globalConfig.defaultConfig.layer) {
        this.#checkOrCreateLayer(layer)
            .listeners
            .push({ type, callback, once: false });
    }

    /**
     * Register multiple callbacks to be executed whenever messages of specified types are received.
     * @param {Array.<Array.<string, function, string>>} list - List of type-callback pairs.
     */
    onList(list: [string, (event: TPayload) => void, string][]) {
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
    once(type: string, callback: (event: TPayload) => void, layer: string) {
        this.#checkOrCreateLayer(layer)
            .listeners
            .push({ type, callback, once: true })
    }

    /**
     * Register multiple callbacks to be executed one-time when messages of specified types are received.
     * @param {Array.<Array.<string, function>>} list - List of type-callback pairs.
     */
    onceList(list: [string, (event: TPayload) => void, string][]) {
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
            this.layers[layer].listeners.filter(item => item.type !== type);
        } else {
            for (const layerName in this.layers) {
                this.layers[layerName].listeners.filter(item => item.type !== type);
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
        this.layers[layer] = null
        delete this.layers[layer]
    }

    /**
     * Emit a message to all listening tabs with the specified type, payload and layer.
     * @param {string} type - The type of the event.
     * @param {*} payload - The payload to send with the event.
     * @param {string | string[]} layers - A single layer name or an array of layer names.
     */
    emit(type: string, payload: any = null, layers: string | string[] = globalConfig.defaultConfig.layer) {
        if (this.#emitByPrimaryOnly && !this.#worker.isPrimaryTab()) return;
        if (!this.#channel) return;

        const targetLayers = Array.isArray(layers) ? layers : [layers];

        // Emit event for each target layer
        targetLayers.forEach(layer => {
            this.#checkOrCreateLayer(layer);

            const message: TPayload = { type, payload, layer };
            this.#channel.postMessage(message);

            if (this.#listenOwnChannel) {
                // @ts-ignore
                this.#channel.onmessage({ data: message });
            }
        });
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
    setConfig(config?: TDefaultConfig) {
        const _config = {
            ...globalConfig.defaultConfig,
            ...(config ? config : {})
        };

        this.channelName = _config.channelName;
        this.layers = {};
        this.#listenOwnChannel = _config.listenOwnChannel;
        this.#onBecomePrimaryCallback = _config.onBecomePrimary;
        this.#disableInternalErrors = _config?.disableInternalErrors || true;
        this.#emitByPrimaryOnly = _config.emitByPrimaryOnly;
    }

    /**
     * Destroys the BroadcastChannel and cleans up resources.
     * @param {number} delay - The optional delay (in milliseconds) before destruction begins.
     */
    async destroy(delay: number = 0) : Promise<void> {
        try {
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            if (this.#channel) {
                this.#channel.close();
                this.#channel = null;
            }

            if (this.layers) {
                Object.keys(this.layers).forEach(layerKey => {
                    this.layers[layerKey].listeners = [];
                });

                this.layers = {};
            }

            TabsBroadcast.instance = null;
        } catch (error) {
			this.#handleError('Error while destroying instance:', error);
        }
    }


    /**
     * Retrieves a list of event listeners from the layers.
     *
     * @return {Array} An array of event listener objects. If there is only one default layer,
     *                 returns the listeners from that layer. Otherwise, aggregates listeners
     *                 from all layers.
     */
    getEvents() {
        const isOnlyDefaultLayer = Object.keys(this.layers).length === 1 && this.layers[globalConfig.defaultConfig.layer];

        if (isOnlyDefaultLayer) {
            return [ ...this.layers[globalConfig.defaultConfig.layer].listeners ];
        }

        return Object.values(this.layers).reduce((acc, layerData) => {
            acc = [ ...acc, ...layerData.listeners ]
            return acc
        }, []);
    }

    /**
     * Retrieves the list of layer names.
     *
     * @return {string[]} An array of strings representing the keys of the layers.
     */
    getLayers() : string[] {
        return Object.keys(this.layers)
    }

    /**
     * Enable plugins for extending the library.
     * @param {Function} plugin - Plugin function to extend the TabsBroadcast instance.
     */
    use(plugin: (instance: TabsBroadcast) => void) {
        plugin(this);
    }
}
