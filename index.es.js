var x = Object.defineProperty;
var E = (i) => {
  throw TypeError(i);
};
var B = (i, t, e) => t in i ? x(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var w = (i, t, e) => B(i, typeof t != "symbol" ? t + "" : t, e), I = (i, t, e) => t.has(i) || E("Cannot " + e);
var s = (i, t, e) => (I(i, t, "read from private field"), e ? e.call(i) : t.get(i)), d = (i, t, e) => t.has(i) ? E("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(i) : t.set(i, e), c = (i, t, e, a) => (I(i, t, "write to private field"), a ? a.call(i, e) : t.set(i, e), e), y = (i, t, e) => (I(i, t, "access private method"), e);
const u = { channelName: "xploit_tab_channel", layer: "default_layer", listenOwnChannel: !0, emitByPrimaryOnly: !0, onBecomePrimary: () => {
} }, l = { tab_prefix: "xploit_tab_id_", slave: "xploit_slave", primary: "xploit_primary", primaryTabId: "xploit_primary_tab_id", primaryStatusChanged: "XPLOIT_TAB_STATUS_CHANGED" };
class N {
  constructor() {
    w(this, "tabId");
    this.tabId = l.tab_prefix + Date.now().toString(), this.init();
  }
  init() {
    if (typeof window > "u") return;
    const t = () => {
      localStorage.getItem(l.primaryTabId) ? this.setSlaveTab(this.tabId) : this.setPrimaryTab(this.tabId), this.notifyTabStatus();
    };
    document.readyState === "complete" ? t() : window.addEventListener("load", t), window.addEventListener("pagehide", () => {
      this.isPrimaryTab() && (this.removeTabStatus(l.primaryTabId), this.transferPrimaryStatus()), this.removeTabStatus(this.tabId);
    }), window.addEventListener("storage", (e) => {
      e.key === l.primaryTabId && this.notifyTabStatus();
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
    this.set(l.primaryTabId, t), this.set(t, l.primary);
  }
  setSlaveTab(t) {
    this.set(t, l.slave);
  }
  transferPrimaryStatus() {
    const t = Object.keys(localStorage).filter((e) => e !== l.primaryTabId && this.get(e) === l.slave);
    t.length > 0 ? this.setPrimaryTab(t.at(0)) : this.remove(l.primaryTabId);
  }
  removeTabStatus(t) {
    this.remove(t);
  }
  notifyTabStatus() {
    if (typeof window > "u") return;
    const t = { detail: { tabId: this.tabId, isPrimary: this.isPrimaryTab() } };
    window.dispatchEvent(new CustomEvent(l.primaryStatusChanged, t));
  }
  isPrimaryTab() {
    return this.get(l.primaryTabId) === this.tabId;
  }
}
var f, g, T, v, b, h, r, n, C, O, m, k, L;
const p = class p {
  constructor(t = null) {
    d(this, n);
    d(this, f);
    d(this, g);
    d(this, T);
    d(this, v);
    d(this, b);
    d(this, h);
    d(this, r);
    w(this, "primary", !1);
    if (p.instance) return p.instance;
    this.setConfig(t), y(this, n, C).call(this), p.instance = this;
  }
  on(t, e, a) {
    y(this, n, m).call(this, a).listeners.push({ type: t, callback: e });
  }
  onList(t) {
    t.length && t.forEach(([e, a, o]) => {
      e && a && y(this, n, m).call(this, o).listeners.push({ type: e, callback: a });
    });
  }
  once(t, e, a) {
    y(this, n, m).call(this, a).listeners.push({ type: t, callback: e, once: !0 });
  }
  onceList(t) {
    t.length && t.forEach(([e, a, o = u.layer]) => {
      e && a && y(this, n, m).call(this, o).listeners.push({ type: e, callback: a, once: !0 });
    });
  }
  off(t, e = null) {
    if (e) s(this, r)[e].listeners.filter((a) => a.type !== t);
    else for (const a in s(this, r)) s(this, r)[a].listeners.filter((o) => o.type !== t);
  }
  deleteLayer(t) {
    y(this, n, m).call(this, t).listeners = [], s(this, r)[t] = null, delete s(this, r)[t];
  }
  emit(t, e = null, a = u.layer) {
    if (s(this, v) && !s(this, b).isPrimaryTab() || !s(this, h)) return;
    const o = { type: t, payload: e, layer: a };
    s(this, h).postMessage(o), s(this, g) && s(this, h).onmessage({ data: o });
  }
  isPrimary() {
    return s(this, b).isPrimaryTab();
  }
  setConfig(t) {
    const e = { ...u, ...t };
    c(this, f, e.channelName), c(this, r, {}), c(this, g, e.listenOwnChannel), c(this, T, e.onBecomePrimary), c(this, v, e.emitByPrimaryOnly);
  }
  destroy() {
    s(this, h) && s(this, h).close(), p.instance = null, c(this, h, null);
  }
  getEvents() {
    return Object.keys(s(this, r)).length === 1 && s(this, r)[u.layer] ? [...s(this, r)[u.layer].listeners] : Object.values(s(this, r)).reduce((t, e) => t = [...t, ...e.listeners], []);
  }
  getLayers() {
    return Object.keys(s(this, r));
  }
};
f = new WeakMap(), g = new WeakMap(), T = new WeakMap(), v = new WeakMap(), b = new WeakMap(), h = new WeakMap(), r = new WeakMap(), n = new WeakSet(), C = function() {
  window && (c(this, b, new N()), c(this, h, new BroadcastChannel(s(this, f))), s(this, h).onmessage = y(this, n, k).bind(this), s(this, h).onmessageerror = y(this, n, L).bind(this), this.primary = !1, y(this, n, O).call(this));
}, O = function() {
  window.addEventListener(l.primaryStatusChanged, (t) => {
    const e = t;
    s(this, b).isPrimaryTab() ? (this.primary = !0, s(this, T).call(this, e.detail)) : this.primary = !1;
  }, { passive: !0 });
}, m = function(t = u.layer) {
  return s(this, r)[t] || (s(this, r)[t] = { name: t, listeners: [] }), s(this, r)[t];
}, k = function(t) {
  const { type: e, payload: a, layer: o } = t.data, P = y(this, n, m).call(this, o);
  P.listeners = P.listeners.filter((S) => S.type !== e || (S.callback({ type: e, payload: a, layer: o }), !S.once));
}, L = function(t) {
  process.env.NODE_ENV !== "production" && console.error("Can't parse message", t);
}, w(p, "instance");
let _ = p;
export {
  _ as default
};
//# sourceMappingURL=index.es.js.map
