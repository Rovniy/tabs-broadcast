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

function generateTabId() {
  const prefix = globalConfig.dict.tab_prefix;
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return prefix + crypto.randomUUID();
    }
  } catch {
  }
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

class BaseElector {
  tabId;
  channelName;
  onChange;
  primary = false;
  destroyed = false;
  constructor(channelName, onChange) {
    this.channelName = channelName;
    this.onChange = onChange;
    this.tabId = generateTabId();
  }
  setPrimary(value) {
    if (this.primary === value) return;
    this.primary = value;
    this.onChange(value, { tabId: this.tabId });
  }
  isPrimary() {
    return this.primary;
  }
}

class WebLocksElector extends BaseElector {
  lockName;
  // Resolving this releases the held lock (and our leadership).
  releaseLock = null;
  constructor(channelName, onChange) {
    super(channelName, onChange);
    this.lockName = `${globalConfig.dict.primaryLock}__${channelName}`;
  }
  start() {
    if (this.destroyed) return;
    const locks = navigator.locks;
    locks.request(
      this.lockName,
      () => new Promise((resolve) => {
        if (this.destroyed) {
          resolve();
          return;
        }
        this.releaseLock = resolve;
        this.setPrimary(true);
      })
    ).catch(() => {
    });
  }
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
    this.primary = false;
  }
}

class StorageElector extends BaseElector {
  keyPrimary;
  heartbeatTimer = null;
  storageHandler = null;
  unloadHandler = null;
  constructor(channelName, onChange) {
    super(channelName, onChange);
    this.keyPrimary = `${globalConfig.dict.primaryTabId}__${channelName}`;
  }
  start() {
    if (this.destroyed || typeof window === "undefined") return;
    this.storageHandler = (event) => {
      if (event.key === this.keyPrimary) this.evaluate();
    };
    this.unloadHandler = () => this.resign();
    window.addEventListener("storage", this.storageHandler);
    window.addEventListener("pagehide", this.unloadHandler);
    const begin = () => {
      if (this.destroyed) return;
      this.evaluate();
      this.heartbeatTimer = setInterval(() => this.evaluate(), globalConfig.timing.heartbeat);
    };
    if (document.readyState === "complete") {
      begin();
    } else {
      window.addEventListener("load", begin, { once: true });
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
   * Re-run the election. Idempotent: claims the slot if it is vacant or stale, refreshes
   * the heartbeat if we already own it, and yields to a live primary otherwise (tie-broken
   * by the smaller tab id so concurrent claims converge).
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
  /** Release leadership on tab teardown so another tab can take over immediately. */
  resign() {
    const current = this.readPrimary();
    if (current && current.tabId === this.tabId) {
      try {
        localStorage.removeItem(this.keyPrimary);
      } catch {
      }
    }
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
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

class TabsWorker {
  elector;
  constructor(channelName, onChange) {
    this.elector = TabsWorker.hasWebLocks() ? new WebLocksElector(channelName, onChange) : new StorageElector(channelName, onChange);
    this.elector.start();
  }
  static hasWebLocks() {
    return typeof navigator !== "undefined" && !!navigator.locks && typeof navigator.locks.request === "function";
  }
  /**
   * Whether this tab is currently the primary tab.
   */
  isPrimaryTab() {
    return this.elector.isPrimary();
  }
  /**
   * Tear down the election strategy and relinquish leadership.
   */
  destroy() {
    this.elector.destroy();
  }
}

const WILDCARD_EVENT = "*";
class TabsBroadcast {
  channelName;
  layers = {};
  /** Whether the current tab is the primary tab. */
  primary = false;
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
   * Look up a layer, creating it if it does not yet exist.
   * @param layer - The layer name (defaults to the configured default layer).
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
   * @param data - The raw message payload.
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
   * @param event - Incoming payload
   * @private
   */
  #onMessage(event) {
    this.#dispatch(event?.data);
  }
  /**
   * Error handling in the broker's work
   * @param error - Error
   * @private
   */
  #onError(error) {
    this.#handleError("Can't parse message", error);
  }
  on(type, callback, layer = globalConfig.defaultConfig.layer) {
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
  onList(list) {
    if (!list || !list.length) return;
    list.forEach(([type, callback, layer = globalConfig.defaultConfig.layer]) => {
      if (!type || !callback) return;
      this.#checkOrCreateLayer(layer).listeners.push({ type, callback, once: false });
    });
  }
  once(type, callback, layer = globalConfig.defaultConfig.layer) {
    this.#checkOrCreateLayer(layer).listeners.push({ type, callback, once: true });
  }
  /**
   * Register multiple one-time listeners at once.
   * @param list - Tuples of `[type, callback, layer?]`.
   */
  onceList(list) {
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
   * Delete a layer and unregister all of its listeners.
   * @param layer - The layer name to delete.
   */
  deleteLayer(layer) {
    const _l = this.layers[layer];
    if (!_l) return;
    _l.listeners = [];
    delete this.layers[layer];
  }
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
   * @returns True if the current tab is primary, false otherwise.
   * @deprecated Use the `primary` property instead.
   */
  isPrimary() {
    return this.primary;
  }
  /**
   * Set custom config properties.
   * @param config - Optional custom config (merged over defaults).
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
   * Destroy the BroadcastChannel, tear down the election worker, clear all listeners,
   * and reset the singleton.
   * @param delay - Optional delay in milliseconds before destruction begins.
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
  getLayers() {
    return Object.keys(this.layers);
  }
  /**
   * Extend the instance with a plugin.
   * @param plugin - A function receiving the instance to mutate/extend.
   */
  use(plugin) {
    plugin(this);
  }
}

export { TabsBroadcast, TabsBroadcast as default };
//# sourceMappingURL=tabs-broadcast.es.js.map
