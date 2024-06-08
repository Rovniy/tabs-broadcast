declare class TabsBroadcast {
    private instance: BroadcastChannel;
    private callbacks: Array<{
        type: string;
        callback: (payload: any) => void;
        toRemove?: boolean;
    }>;

    constructor();

    private init(): void;

    /**
     * Register a callback to be executed whenever a message of the specified type is received.
     * @param {string} type - The type of the message.
     * @param {(payload: any) => void} callback - The function to execute when a message of the specified type is received.
     */
    on(type: string, callback: (payload: any) => void): void;

    /**
     * Register a callback to be executed only once when a message of the specified type is received.
     * @param {string} type - The type of the message.
     * @param {(payload: any) => void} callback - The function to execute when a message of the specified type is received.
     */
    once(type: string, callback: (payload: any) => void): void;

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
}

declare const tabsBroadcast: TabsBroadcast;
export default tabsBroadcast;
