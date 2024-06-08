class TabsBroadcast {
  constructor() {
    if (TabsBroadcast.instance) {
      return TabsBroadcast.instance;
    }

    this.callbacks = [];
    this.channelName = 'broadcast';

    this.#init();

    TabsBroadcast.instance = this;
  }

  /**
   * Initialize the BroadcastChannel and set up the message handler.
   * @private
   */
  #init() {
    this.instance = new BroadcastChannel(this.channelName);

    this.instance.onmessage = (event) => {
      const { type, payload } = event.data;

      this.callbacks = this.callbacks.filter(item => {
        if (item.type === type) {
          item.callback(payload);

          return !item.toRemove;
        }

        return true;
      });
    };
  }

  /**
   * Register a callback to be executed whenever a message of the specified type is received.
   * @param {string} type - The type of the message.
   * @param {function} callback - The function to execute when a message of the specified type is received.
   */
  on(type, callback) {
    this.callbacks.push({ type, callback });
  }

  /**
   * Register a callback to be executed only once when a message of the specified type is received.
   * @param {string} type - The type of the message.
   * @param {function} callback - The function to execute when a message of the specified type is received.
   */
  once(type, callback) {
    this.callbacks.push({ type, callback, toRemove: true });
  }

  /**
   * Unregister all callbacks of the specified type.
   * @param {string} type - The type of the messages for which to unregister the callbacks.
   */
  off(type) {
    this.callbacks = this.callbacks.filter(item => item.type !== type);
  }

  /**
   * Emit a message to all listening tabs with the specified type and payload.
   * @param {string} type - The type of the message.
   * @param {*} [payload=null] - The payload of the message.
   */
  emit(type, payload = null) {
    this.instance.postMessage({ type, payload });
  }
}

export default new TabsBroadcast();
