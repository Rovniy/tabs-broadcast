declare class TabsBroadcast {
    private static instance: TabsBroadcast;
    private callbacks: Array<{ type: string, callback: Function, toRemove?: boolean }>;
    private channelName: string;
    private instance: BroadcastChannel;

    constructor(channelName: string, listenOwnChannel: boolean);

    private init(): void;

    /**
     * Register a callback to be executed whenever a message of the specified type is received.
     * @param {string} type - The type of the message.
     * @param {Function} callback - The function to execute when a message of the specified type is received.
     */
    on(type: string, callback: Function): void;

    /**
     * Register multiple callbacks to be executed whenever messages of specified types are received.
     * @param {Array.<Array.<string, void>>} list - List of type-callback pairs.
     */
    onList(list: Array<[string, Function]>): void;

    /**
     * Register a callback to be executed only once when a message of the specified type is received.
     * @param {string} type - The type of the message.
     * @param {Function} callback - The function to execute when a message of the specified type is received.
     */
    once(type: string, callback: Function): void;

    /**
     * Register multiple callbacks to be executed only once when messages of specified types are received.
     * @param {Array.<Array.<string, (payload: any) => void>>} list - List of type-callback pairs.
     */
    onceList(list: Array<[string, Function]>): void;

    /**
     * Unregister all callbacks of the specified type.
     * @param {string} type - The type of the messages for which to unregister the callbacks.
     */
    off(type: string): void;

    /**
     * Emit a message to all listening tabs with the specified type and payload.
     * @param {string} type - The type of the message.
     * @param {any} [payload] - The payload of the message.
     */
    emit(type: string, payload?: any): void;

    /**
     * Destroy Broadcast channel. Messages will not receive
     */
    destroy(): void;
}

export default TabsBroadcast;
