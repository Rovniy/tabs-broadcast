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
import {TCallbackItem, TDefaultConfig, TEvent, TPayload} from "./types";

/**
 * TabsBroadcast class facilitates inter-tab communication using the BroadcastChannel API.
 * It ensures a single instance is used across the application and provides methods to register,
 * emit, and handle events.
 */
export class TabsBroadcast {
    #callbacks: TCallbackItem[];
    #channelName: string;
    #listenOwnChannel: boolean;
    #onBecomePrimaryCallback: (payload: any) => void;
    #emitByPrimaryOnly: boolean;
    #worker: TabsWorker;
    #channel: null|BroadcastChannel;
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

        this.#channel.onmessage = (event) => {
            const { type, payload } = event.data as TPayload;

            this.#callbacks = this.#callbacks.filter(item => {
                if (item.type === type) {
                    item.callback(payload);

                    return !item.toRemove;
                }

                return true;
            });
        };

        this.#channel.onmessageerror = error => {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Can\'t parse message', error);
            }
        };

        this.#onBecomePrimary()
    }

    /**
     * Set up the event listener for becoming the primary tab.
     */
    #onBecomePrimary() {
        window.addEventListener(globalConfig.dict.primaryStatusChanged, (event: Event) => {
            const _event = event as unknown as TEvent;

            if (this.isPrimary()) {
                this.#onBecomePrimaryCallback(_event.detail);
            }
        }, { passive: true });
    }

    /**
     * Register a callback to be executed whenever a message of the specified type is received.
     * @param {string} type - The type of the message.
     * @param {function} callback - The function to execute when a message of the specified type is received.
     */
    on(type: string, callback: () => void) {
        this.#callbacks.push({ type, callback });
    }

    /**
     * Register multiple callbacks to be executed whenever messages of specified types are received.
     * @param {Array.<Array.<string, function>>} list - List of type-callback pairs.
     */
    onList(list: [string, () => void][]) {
        if (!list.length) return;

        list.forEach(([type, callback]) => {
            if (!type || !callback) return;

            this.#callbacks.push({ type, callback });
        });
    }

    /**
     * Register a callback to be executed only once when a message of the specified type is received.
     * @param {string} type - The type of the message.
     * @param {function} callback - The function to execute when a message of the specified type is received.
     */
    once(type: string, callback: () => void) {
        this.#callbacks.push({ type, callback, toRemove: true });
    }

    /**
     * Register multiple callbacks to be executed one-time when messages of specified types are received.
     * @param {Array.<Array.<string, function>>} list - List of type-callback pairs.
     */
    onceList(list: [string, () => void][]) {
        if (!list.length) return;

        list.forEach(([type, callback]) => {
            if (!type || !callback) return;

            this.#callbacks.push({ type, callback, toRemove: true });
        });
    }

    /**
     * Unregister all callbacks of the specified type.
     * @param {string} type - The type of the messages for which to unregister the callbacks.
     */
    off(type: string) {
        this.#callbacks = this.#callbacks.filter(item => item.type !== type);
    }

    /**
     * Emit a message to all listening tabs with the specified type and payload.
     * @param {string} type - The type of the message.
     * @param {*} [payload=null] - The payload of the message.
     */
    emit(type: string, payload: any = null) {
        if (this.#emitByPrimaryOnly && !this.isPrimary()) return;

        if (!this.#channel) return;

        const message: TPayload = { type, payload };
        this.#channel.postMessage(message);

        if (this.#listenOwnChannel) {
            // @ts-ignore
            this.#channel.onmessage({ data: message });
        }
    }

    /**
     * Check if the current tab is the primary tab.
     * @returns {boolean} - True if the current tab is primary, false otherwise.
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

        this.#callbacks = [];
        this.#channelName = _config.channelName;
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
}
