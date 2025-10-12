const globalConfig = {
  defaultConfig: {
    channelName: "xploit_tab_channel",
    // Broadcast channel name
    layer: "default_layer",
    listenOwnChannel: true,
    // Listen broadcast event on current tab
    emitByPrimaryOnly: true,
    // Emits event only by Primary tab
    onBecomePrimary: () => {
    }
    // Global event when current tab become Primary
  },
  dict: {
    tab_prefix: "xploit_tab_id_",
    slave: "xploit_slave",
    primary: "xploit_primary",
    primaryTabId: "xploit_primary_tab_id",
    primaryStatusChanged: "XPLOIT_TAB_STATUS_CHANGED"
  }
};

class TabsWorker {
  tabId;
  constructor() {
    this.tabId = globalConfig.dict.tab_prefix + Date.now().toString();
    this.init();
  }
  /**
   * Initializes event listeners for load, beforeunload, and storage events.
   */
  init() {
    if (typeof window === "undefined") return;
    const loadCb = () => {
      if (!localStorage.getItem(globalConfig.dict.primaryTabId)) {
        this.setPrimaryTab(this.tabId);
      } else {
        this.setSlaveTab(this.tabId);
      }
      this.notifyTabStatus();
    };
    const beforeUnloadCb = () => {
      if (this.isPrimaryTab()) {
        this.removeTabStatus(globalConfig.dict.primaryTabId);
        this.transferPrimaryStatus();
      }
      this.removeTabStatus(this.tabId);
    };
    const storageCb = (event) => {
      if (event.key === globalConfig.dict.primaryTabId) {
        this.notifyTabStatus();
      }
    };
    if (document.readyState === "complete") {
      loadCb();
    } else {
      window.addEventListener("load", loadCb);
    }
    window.addEventListener("pagehide", beforeUnloadCb);
    window.addEventListener("storage", storageCb);
  }
  /**
   * Sets a key-value pair in localStorage.
   * @param key - The key to set in localStorage.
   * @param value - The value to set in localStorage.
   */
  set(key, value) {
    localStorage.setItem(key, value);
  }
  /**
   * Gets a value from localStorage by key.
   * @param key - The key to get from localStorage.
   * @returns The value associated with the key in localStorage.
   */
  get(key) {
    return localStorage.getItem(key);
  }
  /**
   * Removes a key from localStorage.
   * @param key - The key to remove from localStorage.
   */
  remove(key) {
    localStorage.removeItem(key);
  }
  /**
   * Sets the current tab as the primary tab.
   * @param id - The ID of the tab to set as primary.
   */
  setPrimaryTab(id) {
    this.set(globalConfig.dict.primaryTabId, id);
    this.set(id, globalConfig.dict.primary);
  }
  /**
   * Sets the current tab as a slave tab.
   * @param id - The ID of the tab to set as slave.
   */
  setSlaveTab(id) {
    this.set(id, globalConfig.dict.slave);
  }
  /**
   * Transfers primary status to another tab if the current primary tab is closed.
   */
  transferPrimaryStatus() {
    const tabs = Object.keys(localStorage).filter((key) => key !== globalConfig.dict.primaryTabId && this.get(key) === globalConfig.dict.slave);
    if (tabs.length > 0) {
      this.setPrimaryTab(tabs.at(0));
    } else {
      this.remove(globalConfig.dict.primaryTabId);
    }
  }
  /**
   * Removes the status of a tab from localStorage.
   * @param id - The ID of the tab to remove status for.
   */
  removeTabStatus(id) {
    this.remove(id);
  }
  /**
   * Notifies other tabs of the current tab's status (primary or slave).
   */
  notifyTabStatus() {
    if (typeof window === "undefined") return;
    const event = {
      detail: {
        tabId: this.tabId,
        isPrimary: this.isPrimaryTab()
      }
    };
    window.dispatchEvent(new CustomEvent(globalConfig.dict.primaryStatusChanged, event));
  }
  /**
   * Checks if the current tab is the primary tab.
   * @returns True if the current tab is the primary tab, false otherwise.
   */
  isPrimaryTab() {
    return this.get(globalConfig.dict.primaryTabId) === this.tabId;
  }
}

const WILDCARD_EVENT = "*";
class TabsBroadcast {
  channelName;
  layers = {};
  primary = false;
  // Indicates whether the current tab is the primary tab.
  #listenOwnChannel;
  #emitByPrimaryOnly;
  #worker;
  #channel;
  #disableInternalErrors = true;
  #onBecomePrimaryCallback;
  static instance;
  constructor(config) {
    if (TabsBroadcast.instance) return TabsBroadcast.instance;
    this.setConfig(config);
    this.#init();
    TabsBroadcast.instance = this;
  }
  /**
   * Initialize the BroadcastChannel and set up event listeners.
   */
  #init() {
    if (!window) return;
    this.primary = false;
    this.#worker = new TabsWorker();
    this.#channel = new BroadcastChannel(this.channelName);
    this.#channel.onmessage = this.#onMessage.bind(this);
    this.#channel.onmessageerror = this.#onError.bind(this);
    this.#onBecomePrimary();
  }
  /**
   * Set up the event listener for becoming the primary tab.
   */
  #onBecomePrimary() {
    window.addEventListener(globalConfig.dict.primaryStatusChanged, (event) => {
      const _event = event;
      if (this.#worker.isPrimaryTab()) {
        this.primary = true;
        try {
          this.#onBecomePrimaryCallback(_event.detail);
        } catch (e) {
          this.#handleError("Can't execute become primary callback", e);
        }
      } else {
        this.primary = false;
      }
    }, { passive: true });
  }
  #handleError(...args) {
    if (this.#disableInternalErrors) return;
    console.error(`TabsBroadcast : Channel=${this.channelName}`, ...args);
  }
  /**
   * Checking for the existence of a layer. Creating a new layer if it does not exist
   * @param {string} layer - the name of the layer you are looking for
   * @private
   */
  #checkOrCreateLayer(layer = globalConfig.defaultConfig.layer) {
    if (!this.layers[layer]) {
      this.layers[layer] = {
        name: layer,
        listeners: []
      };
    }
    return this.layers[layer];
  }
  /**
   * Processing incoming messages
   * @param {MessageEvent<TPayload>} event - Incoming payload
   * @private
   */
  #onMessage(event) {
    const { type, payload, layer } = event.data;
    const _l = this.#checkOrCreateLayer(layer);
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
   * Error handling in the broker's work
   * @param {MessageEvent<any>} error - Error
   * @private
   */
  #onError(error) {
    if (this.#disableInternalErrors) return;
    this.#handleError("Can't parse message", error);
  }
  /**
   * Register a callback to be executed whenever a message of the specified type is received.
   * And register a wildcard listener for all event types.
   * @param {string} type - The type of the message.
   * @param {Function} callback - The function to execute when a message of the specified type is received.
   * @param {string} layer - The name of the layer to which the message is addressed.
   */
  on(type, callback, layer = globalConfig.defaultConfig.layer) {
    this.#checkOrCreateLayer(layer).listeners.push({ type, callback, once: false });
  }
  /**
   * Register multiple callbacks to be executed whenever messages of specified types are received.
   * @param {Array.<Array.<string, function, string>>} list - List of type-callback pairs.
   */
  onList(list) {
    if (!list.length) return;
    list.forEach(([type, callback, layer]) => {
      if (!type || !callback) return;
      this.#checkOrCreateLayer(layer).listeners.push({ type, callback });
    });
  }
  /**
   * Register a callback to be executed only once when a message of the specified type is received.
   * @param {string} type - The type of the message.
   * @param {function} callback - The function to execute when a message of the specified type is received.
   * @param {string} layer - The name of the layer to which the message is addressed.
   */
  once(type, callback, layer) {
    this.#checkOrCreateLayer(layer).listeners.push({ type, callback, once: true });
  }
  /**
   * Register multiple callbacks to be executed one-time when messages of specified types are received.
   * @param {Array.<Array.<string, function>>} list - List of type-callback pairs.
   */
  onceList(list) {
    if (!list.length) return;
    list.forEach(([type, callback, layer = globalConfig.defaultConfig.layer]) => {
      if (!type || !callback) return;
      this.#checkOrCreateLayer(layer).listeners.push({ type, callback, once: true });
    });
  }
  /**
   * Unregister all callbacks of the specified type.
   * @param {string} type - The type of the messages for which to unregister the callbacks.
   * @param {string|null} [layer] - Specifying the layer to delete the message from.
   */
  off(type, layer = null) {
    if (layer) {
      this.layers[layer].listeners.filter((item) => item.type !== type);
    } else {
      for (const layerName in this.layers) {
        this.layers[layerName].listeners.filter((item) => item.type !== type);
      }
    }
  }
  /**
   * Delete and unregister all callbacks of the specified layer.
   * @param {string} layer - The name of the layer to be deleted.
   */
  deleteLayer(layer) {
    const _l = this.#checkOrCreateLayer(layer);
    _l.listeners = [];
    this.layers[layer] = null;
    delete this.layers[layer];
  }
  /**
   * Emit a message to all listening tabs with the specified type, payload and layer.
   * @param {string} type - The type of the event.
   * @param {*} payload - The payload to send with the event.
   * @param {string | string[]} layers - A single layer name or an array of layer names.
   */
  emit(type, payload = null, layers = globalConfig.defaultConfig.layer) {
    if (this.#emitByPrimaryOnly && !this.#worker.isPrimaryTab()) return;
    if (!this.#channel) return;
    const targetLayers = Array.isArray(layers) ? layers : [layers];
    targetLayers.forEach((layer) => {
      this.#checkOrCreateLayer(layer);
      const message = { type, payload, layer };
      this.#channel.postMessage(message);
      if (this.#listenOwnChannel) {
        this.#channel.onmessage({ data: message });
      }
    });
  }
  /**
   * Check if the current tab is the primary tab.
   * @returns {boolean} - True if the current tab is primary, false otherwise.
   * @deprecated - Use `TabBroadcast.primary` for primary tab identify
   */
  isPrimary() {
    return this.#worker.isPrimaryTab();
  }
  /**
   * Set custom config properties
   * @param {TDefaultConfig} config - Optional custom config
   */
  setConfig(config) {
    const _config = {
      ...globalConfig.defaultConfig,
      ...config ? config : {}
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
  async destroy(delay = 0) {
    try {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
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
      TabsBroadcast.instance = null;
    } catch (error) {
      this.#handleError("Error while destroying instance:", error);
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
      return [...this.layers[globalConfig.defaultConfig.layer].listeners];
    }
    return Object.values(this.layers).reduce((acc, layerData) => {
      acc = [...acc, ...layerData.listeners];
      return acc;
    }, []);
  }
  /**
   * Retrieves the list of layer names.
   *
   * @return {string[]} An array of strings representing the keys of the layers.
   */
  getLayers() {
    return Object.keys(this.layers);
  }
  /**
   * Enable plugins for extending the library.
   * @param {Function} plugin - Plugin function to extend the TabsBroadcast instance.
   */
  use(plugin) {
    plugin(this);
  }
}

export { TabsBroadcast as default };
//# sourceMappingURL=tabs-broadcast.es.js.map
