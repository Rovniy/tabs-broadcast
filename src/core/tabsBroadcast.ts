/**
 * @file tabsBroadcast.ts
 * @description A class for managing inter-tab communication via BroadcastChannel.
 *
 * This class implements a singleton pattern to ensure a single instance.
 * It allows for registering, emitting, and handling various types of events across different browser tabs.
 *
 * Security note: messages arriving on a BroadcastChannel are *untrusted input*. Any
 * same-origin script (third-party tags, browser extensions, XSS) that knows the channel
 * name can post arbitrary messages. Incoming messages are shape-validated and are only
 * dispatched to listeners of already-registered layers — they never create new layers.
 * Treat the `payload` you receive as untrusted in your own handlers.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 */
import globalConfig from './config'
import { TabsWorker } from './tabsWorker'
import { ILayers, TDefaultConfig, TPrimaryDetail, TWildcardEvent, TPayload } from '../types';

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
	#onBecomePrimaryCallback: (detail: TPrimaryDetail) => void;

    private static instance: null|TabsBroadcast;

    constructor(config?: TDefaultConfig) {
        // Ensure singleton instance
        if (TabsBroadcast.instance) return TabsBroadcast.instance;

        this.setConfig(config)
        this.#init();

        TabsBroadcast.instance = this;
    }

    /**
     * Initialize the BroadcastChannel and the primary-tab worker.
     */
    #init() {
        if (typeof window === 'undefined') return

        this.primary = false;

        // The worker drives `this.primary` through a single callback — this is the only
        // source of truth for primary status, so the public flag and `emit()` can never
        // disagree, and there is no window-event ordering race on initial load.
        this.#worker = new TabsWorker(this.channelName, (isPrimary, detail) => {
            this.#handlePrimaryChange(isPrimary, detail);
        });

        this.#channel = new BroadcastChannel(this.channelName);
        this.#channel.onmessage = this.#onMessage.bind(this);
        this.#channel.onmessageerror = this.#onError.bind(this);
    }

    /**
     * React to a change in this tab's primary status.
     */
    #handlePrimaryChange(isPrimary: boolean, detail: TPrimaryDetail) {
        this.primary = isPrimary;

        if (!isPrimary) return;

        try {
            this.#onBecomePrimaryCallback(detail);
        } catch (e) {
            this.#handleError('Can\'t execute become primary callback', e);
        }
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
     * Validate and dispatch a single message to the listeners of its layer.
     * Untrusted input: malformed messages are ignored, and dispatch never creates a
     * new layer (only already-registered layers receive events).
     * @param {unknown} data - The raw message payload.
     * @private
     */
    #dispatch(data: any) {
        if (!data || typeof data.type !== 'string') return;

        const type: string = data.type;
        const layer: string = typeof data.layer === 'string' ? data.layer : globalConfig.defaultConfig.layer;
        const payload = 'payload' in data ? data.payload : null;

        const _l = this.layers[layer];
        if (!_l) return;

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
    }

    /**
     * Processing incoming messages
     * @param {MessageEvent<TPayload>} event - Incoming payload
     * @private
     */
    #onMessage(event: MessageEvent<TPayload>) {
        this.#dispatch(event?.data);
    };

    /**
     * Error handling in the broker's work
     * @param {MessageEvent<any>} error - Error
     * @private
     */
    #onError(error: MessageEvent) {
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
    onList(list: [string, (event: TPayload) => void, string?][]) {
        if (!list || !list.length) return;

        list.forEach(([type, callback, layer = globalConfig.defaultConfig.layer]) => {
            if (!type || !callback) return;

            this.#checkOrCreateLayer(layer)
                .listeners
                .push({ type, callback, once: false })
        });
    }

    /**
     * Register a callback to be executed only once when a message of the specified type is received.
     * @param {string} type - The type of the message.
     * @param {function} callback - The function to execute when a message of the specified type is received.
     * @param {string} layer - The name of the layer to which the message is addressed.
     */
    once(type: string, callback: (event: TPayload) => void, layer: string = globalConfig.defaultConfig.layer) {
        this.#checkOrCreateLayer(layer)
            .listeners
            .push({ type, callback, once: true })
    }

    /**
     * Register multiple callbacks to be executed one-time when messages of specified types are received.
     * @param {Array.<Array.<string, function>>} list - List of type-callback pairs.
     */
    onceList(list: [string, (event: TPayload) => void, string?][]) {
        if (!list || !list.length) return;

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
        const prune = (l: ILayers[string] | undefined) => {
            if (l) l.listeners = l.listeners.filter(item => item.type !== type);
        };

        if (layer) {
            prune(this.layers[layer]);
        } else {
            Object.values(this.layers).forEach(prune);
        }
    }

    /**
     * Delete and unregister all callbacks of the specified layer.
     * @param {string} layer - The name of the layer to be deleted.
     */
    deleteLayer(layer: string) {
        const _l = this.layers[layer];
        if (!_l) return;

        _l.listeners = []
        delete this.layers[layer]
    }

    /**
     * Emit a message to all listening tabs with the specified type, payload and layer.
     * @param {string} type - The type of the event.
     * @param {*} payload - The payload to send with the event.
     * @param {string | string[]} layers - A single layer name or an array of layer names.
     */
    emit(type: string, payload: any = null, layers: string | string[] = globalConfig.defaultConfig.layer) {
        if (this.#emitByPrimaryOnly && !this.primary) return;
        if (!this.#channel) return;

        const targetLayers = Array.isArray(layers) ? layers : [layers];

        // Emit event for each target layer
        targetLayers.forEach(layer => {
            this.#checkOrCreateLayer(layer);

            const message: TPayload = { type, payload, layer };
            this.#channel.postMessage(message);

            if (this.#listenOwnChannel) {
                this.#dispatch(message);
            }
        });
    }

    /**
     * Check if the current tab is the primary tab.
     * @returns {boolean} - True if the current tab is primary, false otherwise.
     * @deprecated - Use `TabsBroadcast.primary` for primary tab identify
     */
    isPrimary(): boolean {
        return this.primary;
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
        this.#disableInternalErrors = _config.disableInternalErrors ?? true;
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

            if (this.#worker) {
                this.#worker.destroy();
                this.#worker = null;
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

            this.primary = false;
            TabsBroadcast.instance = null;
        } catch (error) {
			this.#handleError('Error while destroying instance:', error);
        }
    }


    /**
     * Retrieves a list of event listeners across all layers.
     *
     * @return {Array} An aggregated copy of every layer's listeners.
     */
    getEvents() {
        return Object.values(this.layers).flatMap(layerData => [...layerData.listeners]);
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
