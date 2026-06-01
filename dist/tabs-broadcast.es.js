const globalConfig = {
  defaultConfig: {
    channelName: "xploit_tab_channel",
    // Broadcast channel name
    layer: "default_layer",
    // Default layer name
    listenOwnChannel: false,
    // Listen broadcast event on current tab
    emitByPrimaryOnly: true,
    // Emits event only by Primary tab
    onBecomePrimary: () => {
    },
    // Global event when current tab become Primary
    disableInternalErrors: true
    // Disable internal errors logging
  },
  dict: {
    // Base names. All cross-tab keys/locks are namespaced per `channelName`
    // at runtime (see TabsWorker) so independent channels never collide.
    tab_prefix: "xploit_tab_id_",
    primaryTabId: "xploit_primary_tab_id",
    primaryLock: "xploit_primary_lock"
  },
  // Time budget (ms) used by the localStorage fallback election (no Web Locks).
  timing: {
    heartbeat: 2e3,
    // primary refreshes its claim this often
    stale: 5e3
    // a primary claim older than this is considered dead
  }
};

class TabsWorker {
  tabId;
  channelName;
  onChange;
  primary = false;
  destroyed = false;
  keyPrimary;
  lockName;
  // Web Locks: resolving this releases the held lock (and our leadership).
  releaseLock = null;
  // localStorage fallback bookkeeping
  heartbeatTimer = null;
  storageHandler = null;
  unloadHandler = null;
  constructor(channelName, onChange) {
    this.channelName = channelName;
    this.onChange = onChange;
    this.tabId = this.generateId();
    this.keyPrimary = `${globalConfig.dict.primaryTabId}__${channelName}`;
    this.lockName = `${globalConfig.dict.primaryLock}__${channelName}`;
    this.init();
  }
  /**
   * Generate a collision-resistant tab id. Prefers crypto.randomUUID; falls back to
   * a time+random string in environments that lack it.
   */
  generateId() {
    const prefix = globalConfig.dict.tab_prefix;
    try {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return prefix + crypto.randomUUID();
      }
    } catch {
    }
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  /**
   * Choose an election strategy and start it.
   */
  init() {
    if (typeof window === "undefined") return;
    if (this.hasWebLocks()) {
      this.initWebLocks();
    } else {
      this.initStorageFallback();
    }
  }
  hasWebLocks() {
    return typeof navigator !== "undefined" && !!navigator.locks && typeof navigator.locks.request === "function";
  }
  // --- Web Locks strategy --------------------------------------------------
  initWebLocks() {
    const locks = navigator.locks;
    locks.request(this.lockName, () => new Promise((resolve) => {
      if (this.destroyed) {
        resolve();
        return;
      }
      this.releaseLock = resolve;
      this.setPrimary(true);
    })).catch(() => {
    });
  }
  // --- localStorage fallback strategy --------------------------------------
  initStorageFallback() {
    this.storageHandler = (event) => {
      if (event.key === this.keyPrimary) this.evaluate();
    };
    this.unloadHandler = () => this.resign();
    window.addEventListener("storage", this.storageHandler);
    window.addEventListener("pagehide", this.unloadHandler);
    const start = () => {
      if (this.destroyed) return;
      this.evaluate();
      this.heartbeatTimer = setInterval(() => this.evaluate(), globalConfig.timing.heartbeat);
    };
    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
    }
  }
  readPrimary() {
    try {
      const raw = localStorage.getItem(this.keyPrimary);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.tabId === "string" && typeof parsed.ts === "number") {
        return parsed;
      }
    } catch {
    }
    return null;
  }
  writePrimary() {
    try {
      localStorage.setItem(this.keyPrimary, JSON.stringify({ tabId: this.tabId, ts: Date.now() }));
    } catch {
    }
  }
  /**
   * Re-run the election. Idempotent: claims the slot if it is vacant or stale,
   * refreshes the heartbeat if we already own it, and yields to a live primary
   * otherwise (tie-broken by the smaller tab id so concurrent claims converge).
   */
  evaluate() {
    if (this.destroyed) return;
    const current = this.readPrimary();
    const fresh = !!current && Date.now() - current.ts <= globalConfig.timing.stale;
    if (!fresh) {
      this.writePrimary();
      this.setPrimary(true);
      return;
    }
    if (current.tabId === this.tabId) {
      this.writePrimary();
      this.setPrimary(true);
      return;
    }
    if (this.primary && this.tabId < current.tabId) {
      this.writePrimary();
      this.setPrimary(true);
    } else {
      this.setPrimary(false);
    }
  }
  /**
   * Release leadership on tab teardown so another tab can take over immediately.
   */
  resign() {
    const current = this.readPrimary();
    if (current && current.tabId === this.tabId) {
      try {
        localStorage.removeItem(this.keyPrimary);
      } catch {
      }
    }
  }
  setPrimary(value) {
    if (this.primary === value) return;
    this.primary = value;
    this.onChange(value, { tabId: this.tabId });
  }
  /**
   * Whether this tab is currently the primary tab.
   */
  isPrimaryTab() {
    return this.primary;
  }
  /**
   * Tear down all listeners/timers and relinquish leadership.
   */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.releaseLock) {
      try {
        this.releaseLock();
      } catch {
      }
      this.releaseLock = null;
    }
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (typeof window !== "undefined") {
      if (this.storageHandler) window.removeEventListener("storage", this.storageHandler);
      if (this.unloadHandler) window.removeEventListener("pagehide", this.unloadHandler);
    }
    this.storageHandler = null;
    this.unloadHandler = null;
    this.resign();
    this.primary = false;
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
   * Initialize the BroadcastChannel and the primary-tab worker.
   */
  #init() {
    if (typeof window === "undefined") return;
    this.primary = false;
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
  #handlePrimaryChange(isPrimary, detail) {
    this.primary = isPrimary;
    if (!isPrimary) return;
    try {
      this.#onBecomePrimaryCallback(detail);
    } catch (e) {
      this.#handleError("Can't execute become primary callback", e);
    }
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
   * Validate and dispatch a single message to the listeners of its layer.
   * Untrusted input: malformed messages are ignored, and dispatch never creates a
   * new layer (only already-registered layers receive events).
   * @param {unknown} data - The raw message payload.
   * @private
   */
  #dispatch(data) {
    if (!data || typeof data.type !== "string") return;
    const type = data.type;
    const layer = typeof data.layer === "string" ? data.layer : globalConfig.defaultConfig.layer;
    const payload = "payload" in data ? data.payload : null;
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
   * @param {MessageEvent<TPayload>} event - Incoming payload
   * @private
   */
  #onMessage(event) {
    this.#dispatch(event?.data);
  }
  /**
   * Error handling in the broker's work
   * @param {MessageEvent<any>} error - Error
   * @private
   */
  #onError(error) {
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
    if (!list || !list.length) return;
    list.forEach(([type, callback, layer = globalConfig.defaultConfig.layer]) => {
      if (!type || !callback) return;
      this.#checkOrCreateLayer(layer).listeners.push({ type, callback, once: false });
    });
  }
  /**
   * Register a callback to be executed only once when a message of the specified type is received.
   * @param {string} type - The type of the message.
   * @param {function} callback - The function to execute when a message of the specified type is received.
   * @param {string} layer - The name of the layer to which the message is addressed.
   */
  once(type, callback, layer = globalConfig.defaultConfig.layer) {
    this.#checkOrCreateLayer(layer).listeners.push({ type, callback, once: true });
  }
  /**
   * Register multiple callbacks to be executed one-time when messages of specified types are received.
   * @param {Array.<Array.<string, function>>} list - List of type-callback pairs.
   */
  onceList(list) {
    if (!list || !list.length) return;
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
    const prune = (l) => {
      if (l) l.listeners = l.listeners.filter((item) => item.type !== type);
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
  deleteLayer(layer) {
    const _l = this.layers[layer];
    if (!_l) return;
    _l.listeners = [];
    delete this.layers[layer];
  }
  /**
   * Emit a message to all listening tabs with the specified type, payload and layer.
   * @param {string} type - The type of the event.
   * @param {*} payload - The payload to send with the event.
   * @param {string | string[]} layers - A single layer name or an array of layer names.
   */
  emit(type, payload = null, layers = globalConfig.defaultConfig.layer) {
    if (this.#emitByPrimaryOnly && !this.primary) return;
    if (!this.#channel) return;
    const targetLayers = Array.isArray(layers) ? layers : [layers];
    targetLayers.forEach((layer) => {
      this.#checkOrCreateLayer(layer);
      const message = { type, payload, layer };
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
  isPrimary() {
    return this.primary;
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
    this.#disableInternalErrors = _config.disableInternalErrors ?? true;
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
      this.#handleError("Error while destroying instance:", error);
    }
  }
  /**
   * Retrieves a list of event listeners across all layers.
   *
   * @return {Array} An aggregated copy of every layer's listeners.
   */
  getEvents() {
    return Object.values(this.layers).flatMap((layerData) => [...layerData.listeners]);
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
