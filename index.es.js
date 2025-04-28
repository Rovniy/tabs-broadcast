var x = Object.defineProperty;
var E = (i) => {
  throw TypeError(i);
};
var B = (i, t, e) => t in i ? x(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var I = (i, t, e) => B(i, typeof t != "symbol" ? t + "" : t, e), P = (i, t, e) => t.has(i) || E("Cannot " + e);
var s = (i, t, e) => (P(i, t, "read from private field"), e ? e.call(i) : t.get(i)), d = (i, t, e) => t.has(i) ? E("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(i) : t.set(i, e), c = (i, t, e, a) => (P(i, t, "write to private field"), a ? a.call(i, e) : t.set(i, e), e), l = (i, t, e) => (P(i, t, "access private method"), e);
const p = { channelName: "xploit_tab_channel", layer: "default_layer", listenOwnChannel: !0, emitByPrimaryOnly: !0, onBecomePrimary: () => {
} }, h = { tab_prefix: "xploit_tab_id_", slave: "xploit_slave", primary: "xploit_primary", primaryTabId: "xploit_primary_tab_id", primaryStatusChanged: "XPLOIT_TAB_STATUS_CHANGED" };
class j {
  constructor() {
    I(this, "tabId");
    this.tabId = h.tab_prefix + Date.now().toString(), this.init();
  }
  init() {
    if (typeof window > "u") return;
    const t = () => {
      localStorage.getItem(h.primaryTabId) ? this.setSlaveTab(this.tabId) : this.setPrimaryTab(this.tabId), this.notifyTabStatus();
    };
    document.readyState === "complete" ? t() : window.addEventListener("load", t), window.addEventListener("pagehide", () => {
      this.isPrimaryTab() && (this.removeTabStatus(h.primaryTabId), this.transferPrimaryStatus()), this.removeTabStatus(this.tabId);
    }), window.addEventListener("storage", (e) => {
      e.key === h.primaryTabId && this.notifyTabStatus();
    });
  }
  set(t, e) {
    localStorage.setItem(t, e);
  }
  get(t) {
    return localStorage.getItem(t);
  }
  remove(t) {
    localStorage.removeItem(t);
  }
  setPrimaryTab(t) {
    this.set(h.primaryTabId, t), this.set(t, h.primary);
  }
  setSlaveTab(t) {
    this.set(t, h.slave);
  }
  transferPrimaryStatus() {
    const t = Object.keys(localStorage).filter((e) => e !== h.primaryTabId && this.get(e) === h.slave);
    t.length > 0 ? this.setPrimaryTab(t.at(0)) : this.remove(h.primaryTabId);
  }
  removeTabStatus(t) {
    this.remove(t);
  }
  notifyTabStatus() {
    if (typeof window > "u") return;
    const t = { detail: { tabId: this.tabId, isPrimary: this.isPrimaryTab() } };
    window.dispatchEvent(new CustomEvent(h.primaryStatusChanged, t));
  }
  isPrimaryTab() {
    return this.get(h.primaryTabId) === this.tabId;
  }
}
var T, g, w, v, u, o, r, n, C, O, m, k, L;
const b = class b {
  constructor(t = null) {
    d(this, n);
    d(this, T);
    d(this, g);
    d(this, w);
    d(this, v);
    d(this, u);
    d(this, o);
    d(this, r);
    I(this, "primary", !1);
    if (b.instance) return b.instance;
    this.setConfig(t), l(this, n, C).call(this), b.instance = this;
  }
  on(t, e, a = p.layer) {
    l(this, n, m).call(this, a).listeners.push({ type: t, callback: e, once: !1 });
  }
  onList(t) {
    t.length && t.forEach(([e, a, y]) => {
      e && a && l(this, n, m).call(this, y).listeners.push({ type: e, callback: a });
    });
  }
  once(t, e, a) {
    l(this, n, m).call(this, a).listeners.push({ type: t, callback: e, once: !0 });
  }
  onceList(t) {
    t.length && t.forEach(([e, a, y = p.layer]) => {
      e && a && l(this, n, m).call(this, y).listeners.push({ type: e, callback: a, once: !0 });
    });
  }
  off(t, e = null) {
    if (e) s(this, r)[e].listeners.filter((a) => a.type !== t);
    else for (const a in s(this, r)) s(this, r)[a].listeners.filter((y) => y.type !== t);
  }
  deleteLayer(t) {
    l(this, n, m).call(this, t).listeners = [], s(this, r)[t] = null, delete s(this, r)[t];
  }
  emit(t, e = null, a = p.layer) {
    s(this, v) && !s(this, u).isPrimaryTab() || s(this, o) && (Array.isArray(a) ? a : [a]).forEach((y) => {
      l(this, n, m).call(this, y);
      const f = { type: t, payload: e, layer: y };
      s(this, o).postMessage(f), s(this, g) && s(this, o).onmessage({ data: f });
    });
  }
  isPrimary() {
    return s(this, u).isPrimaryTab();
  }
  setConfig(t) {
    const e = { ...p, ...t };
    c(this, T, e.channelName), c(this, r, {}), c(this, g, e.listenOwnChannel), c(this, w, e.onBecomePrimary), c(this, v, e.emitByPrimaryOnly);
  }
  async destroy(t = 0) {
    try {
      t > 0 && await new Promise((e) => setTimeout(e, t)), s(this, o) && (s(this, o).close(), c(this, o, null)), s(this, r) && (Object.keys(s(this, r)).forEach((e) => {
        s(this, r)[e].listeners = [];
      }), c(this, r, {})), b.instance = null;
    } catch (e) {
      console.error("TabsBroadcast: Error while destroying instance:", e);
    }
  }
  getEvents() {
    return Object.keys(s(this, r)).length === 1 && s(this, r)[p.layer] ? [...s(this, r)[p.layer].listeners] : Object.values(s(this, r)).reduce((t, e) => t = [...t, ...e.listeners], []);
  }
  getLayers() {
    return Object.keys(s(this, r));
  }
  use(t) {
    t(this);
  }
};
T = new WeakMap(), g = new WeakMap(), w = new WeakMap(), v = new WeakMap(), u = new WeakMap(), o = new WeakMap(), r = new WeakMap(), n = new WeakSet(), C = function() {
  window && (c(this, u, new j()), c(this, o, new BroadcastChannel(s(this, T))), s(this, o).onmessage = l(this, n, k).bind(this), s(this, o).onmessageerror = l(this, n, L).bind(this), this.primary = !1, l(this, n, O).call(this));
}, O = function() {
  window.addEventListener(h.primaryStatusChanged, (t) => {
    const e = t;
    s(this, u).isPrimaryTab() ? (this.primary = !0, s(this, w).call(this, e.detail)) : this.primary = !1;
  }, { passive: !0 });
}, m = function(t = p.layer) {
  return s(this, r)[t] || (s(this, r)[t] = { name: t, listeners: [] }), s(this, r)[t];
}, k = function(t) {
  const { type: e, payload: a, layer: y } = t.data, f = l(this, n, m).call(this, y);
  f.listeners = f.listeners.filter((S) => S.type !== e && S.type !== "*" || (S.callback({ type: e, payload: a, layer: y }), !S.once));
}, L = function(t) {
  process.env.NODE_ENV !== "production" && console.error("Can't parse message", t);
}, I(b, "instance");
let _ = b;
export {
  _ as default
};
//# sourceMappingURL=index.es.js.map
