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
import globalConfig from './config';
import { TabsWorker } from './tabsWorker';
import { ILayers, TDefaultConfig, TEventMap, TPrimaryDetail, TWildcardEvent, TPayload } from '../types';

const WILDCARD_EVENT = '*';

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
export class TabsBroadcast<TEvents extends TEventMap = TEventMap> {
	channelName: string;
	layers: ILayers = {};
	/** Whether the current tab is the primary tab. */
	primary: boolean = false;

	#listenOwnChannel: boolean;
	#emitByPrimaryOnly: boolean;
	#worker: TabsWorker;
	#channel: null | BroadcastChannel;
	#disableInternalErrors: boolean = true;
	#onBecomePrimaryCallback: (detail: TPrimaryDetail) => void;

	private static instance: null | TabsBroadcast<any>;

	constructor(config?: TDefaultConfig) {
		// Ensure singleton instance
		if (TabsBroadcast.instance) return TabsBroadcast.instance as TabsBroadcast<TEvents>;

		this.setConfig(config);
		this.#init();

		TabsBroadcast.instance = this;
	}

	/**
	 * Initialize the BroadcastChannel and the primary-tab worker.
	 */
	#init() {
		if (typeof window === 'undefined') return;

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
			this.#handleError("Can't execute become primary callback", e);
		}
	}

	#handleError(...args: any[]) {
		if (this.#disableInternalErrors) return;

		console.error(`TabsBroadcast : Channel=${this.channelName}`, ...args);
	}

	/**
	 * Look up a layer, creating it if it does not yet exist.
	 * @param layer - The layer name (defaults to the configured default layer).
	 * @private
	 */
	#checkOrCreateLayer(layer: string = globalConfig.defaultConfig.layer) {
		if (!this.layers[layer]) {
			this.layers[layer] = {
				name: layer,
				listeners: [],
			};
		}

		return this.layers[layer];
	}

	/**
	 * Validate and dispatch a single message to the listeners of its layer.
	 * Untrusted input: malformed messages are ignored, and dispatch never creates a
	 * new layer (only already-registered layers receive events).
	 * @param data - The raw message payload.
	 * @private
	 */
	#dispatch(data: any) {
		if (!data || typeof data.type !== 'string') return;

		const type: string = data.type;
		const layer: string = typeof data.layer === 'string' ? data.layer : globalConfig.defaultConfig.layer;
		const payload = 'payload' in data ? data.payload : null;

		const _l = this.layers[layer];
		if (!_l) return;

		_l.listeners = _l.listeners.filter((item) => {
			if (item.type === type || item.type === WILDCARD_EVENT) {
				try {
					item.callback({ type, payload, layer });
				} catch (e) {
					this.#handleError("Can't execute callback", e);
				}

				return !item.once;
			}

			return true;
		});
	}

	/**
	 * Processing incoming messages
	 * @param event - Incoming payload
	 * @private
	 */
	#onMessage(event: MessageEvent<TPayload>) {
		this.#dispatch(event?.data);
	}

	/**
	 * Error handling in the broker's work
	 * @param error - Error
	 * @private
	 */
	#onError(error: MessageEvent) {
		this.#handleError("Can't parse message", error);
	}

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
	on<K extends keyof TEvents & string>(
		type: K,
		callback: (event: { type: K; payload: TEvents[K]; layer: string }) => void,
		layer?: string,
	): void;
	on(type: TWildcardEvent, callback: (event: TPayload<TEvents[keyof TEvents]>) => void, layer?: string): void;
	on(type: string, callback: (event: TPayload) => void, layer: string = globalConfig.defaultConfig.layer) {
		this.#checkOrCreateLayer(layer).listeners.push({ type, callback, once: false });
	}

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
	onList(list: [keyof TEvents & string, (event: TPayload) => void, string?][]) {
		if (!list || !list.length) return;

		list.forEach(([type, callback, layer = globalConfig.defaultConfig.layer]) => {
			if (!type || !callback) return;

			this.#checkOrCreateLayer(layer).listeners.push({ type, callback, once: false });
		});
	}

	/**
	 * Register a callback executed only once for the given message type.
	 *
	 * @param type - The event type.
	 * @param callback - Invoked once with `{ type, payload, layer }`, then removed.
	 * @param layer - Optional layer to scope the listener to.
	 */
	once<K extends keyof TEvents & string>(
		type: K,
		callback: (event: { type: K; payload: TEvents[K]; layer: string }) => void,
		layer?: string,
	): void;
	once(type: TWildcardEvent, callback: (event: TPayload<TEvents[keyof TEvents]>) => void, layer?: string): void;
	once(type: string, callback: (event: TPayload) => void, layer: string = globalConfig.defaultConfig.layer) {
		this.#checkOrCreateLayer(layer).listeners.push({ type, callback, once: true });
	}

	/**
	 * Register multiple one-time listeners at once.
	 * @param list - Tuples of `[type, callback, layer?]`.
	 */
	onceList(list: [keyof TEvents & string, (event: TPayload) => void, string?][]) {
		if (!list || !list.length) return;

		list.forEach(([type, callback, layer = globalConfig.defaultConfig.layer]) => {
			if (!type || !callback) return;

			this.#checkOrCreateLayer(layer).listeners.push({ type, callback, once: true });
		});
	}

	/**
	 * Unregister all callbacks of the given type.
	 * @param type - The event type to remove.
	 * @param layer - Optional layer to remove from; omit to remove from every layer.
	 */
	off(type: keyof TEvents & string, layer: string | null = null) {
		const prune = (l: ILayers[string] | undefined) => {
			if (l) l.listeners = l.listeners.filter((item) => item.type !== type);
		};

		if (layer) {
			prune(this.layers[layer]);
		} else {
			Object.values(this.layers).forEach(prune);
		}
	}

	/**
	 * Delete a layer and unregister all of its listeners.
	 * @param layer - The layer name to delete.
	 */
	deleteLayer(layer: string) {
		const _l = this.layers[layer];
		if (!_l) return;

		_l.listeners = [];
		delete this.layers[layer];
	}

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
	emit(type: string, payload: any = null, layers: string | string[] = globalConfig.defaultConfig.layer) {
		if (this.#emitByPrimaryOnly && !this.primary) return;
		if (!this.#channel) return;

		const targetLayers = Array.isArray(layers) ? layers : [layers];

		// Emit event for each target layer
		targetLayers.forEach((layer) => {
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
	 * @returns True if the current tab is primary, false otherwise.
	 * @deprecated Use the `primary` property instead.
	 */
	isPrimary(): boolean {
		return this.primary;
	}

	/**
	 * Set custom config properties.
	 * @param config - Optional custom config (merged over defaults).
	 */
	setConfig(config?: TDefaultConfig) {
		const _config = {
			...globalConfig.defaultConfig,
			...(config ? config : {}),
		};

		this.channelName = _config.channelName;
		this.layers = {};
		this.#listenOwnChannel = _config.listenOwnChannel;
		this.#onBecomePrimaryCallback = _config.onBecomePrimary;
		this.#disableInternalErrors = _config.disableInternalErrors ?? true;
		this.#emitByPrimaryOnly = _config.emitByPrimaryOnly;
	}

	/**
	 * Destroy the BroadcastChannel, tear down the election worker, clear all listeners,
	 * and reset the singleton.
	 * @param delay - Optional delay in milliseconds before destruction begins.
	 */
	async destroy(delay: number = 0): Promise<void> {
		try {
			if (delay > 0) {
				await new Promise((resolve) => setTimeout(resolve, delay));
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
				Object.keys(this.layers).forEach((layerKey) => {
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
	 * Retrieve an aggregated copy of every layer's listeners.
	 * @returns A flat array of all registered listener items.
	 */
	getEvents() {
		return Object.values(this.layers).flatMap((layerData) => [...layerData.listeners]);
	}

	/**
	 * Retrieve the list of registered layer names.
	 * @returns The keys of the layers map.
	 */
	getLayers(): string[] {
		return Object.keys(this.layers);
	}

	/**
	 * Extend the instance with a plugin.
	 * @param plugin - A function receiving the instance to mutate/extend.
	 */
	use(plugin: (instance: TabsBroadcast<TEvents>) => void) {
		plugin(this);
	}
}
