/**
 * @param {string} channelName - Custom channel name
 * @param {boolean} listenOwnChannel - Emit event into own tab
 * @return {TabsBroadcast}
 */
class TabsBroadcast {
  constructor(channelName = 'xploit_channel', listenOwnChannel = true) {
    if (TabsBroadcast.instance) {
      return TabsBroadcast.instance;
    }

    this.callbacks = [];
    this.channelName = channelName;
    this.listenOwnChannel = listenOwnChannel;

    this.#init();

    TabsBroadcast.instance = this;
  }

  /**
   * Initialize the BroadcastChannel and set up the message and error handler.
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

    this.instance.onmessageerror = error => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Tabs broadcast : BroadcastChannel : Can\'t parse message', error)
      }
    }
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
   * Register multiple callbacks to be executed whenever messages of specified types are received.
   * @param {Array.<Array.<string, function>>} list - List of type-callback pairs.
   */
  onList(list) {
    if (!list.length) return;

    list.forEach((item) => {
      if (!item?.at(0) || !item.at(1)) return;

      this.callbacks.push({ type: item.at(0), callback: item.at(1) });
    })
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
   * Register multiple callbacks to be executed one-time when messages of specified types are received.
   * @param {Array.<Array.<string, function>>} list - List of type-callback pairs.
   */
  onceList(list) {
    if (!list.length) return;

    list.forEach((item) => {
      if (!item?.at(0) || !item.at(1)) return;

      this.callbacks.push({ type: item.at(0), callback: item.at(1), toRemove: true });
    });
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
    const message = { type, payload }
    this.instance.postMessage(message);

    if (this.listenOwnChannel) {
        this.instance.onmessage({ data: message });
    }
  }

  /**
   * Destroy Broadcast channel. Messages will not receive
   */
  destroy() {
    this.instance.close()
  }
}

export default TabsBroadcast;
