var E = Object.defineProperty;
var C = (e, t, a) => t in e ? E(e, t, { enumerable: !0, configurable: !0, writable: !0, value: a }) : e[t] = a;
var g = (e, t, a) => (C(e, typeof t != "symbol" ? t + "" : t, a), a), v = (e, t, a) => {
  if (!t.has(e))
    throw TypeError("Cannot " + a);
};
var i = (e, t, a) => (v(e, t, "read from private field"), a ? a.call(e) : t.get(e)), l = (e, t, a) => {
  if (t.has(e))
    throw TypeError("Cannot add the same private member more than once");
  t instanceof WeakSet ? t.add(e) : t.set(e, a);
}, h = (e, t, a, n) => (v(e, t, "write to private field"), n ? n.call(e, a) : t.set(e, a), a);
var w = (e, t, a) => (v(e, t, "access private method"), a);
const _ = { channelName: "xploit_tab_channel", listenOwnChannel: !0, emitByPrimaryOnly: !0, onBecomePrimary: () => {
} }, s = { tab_prefix: "xploit_tab_id_", slave: "xploit_slave", primary: "xploit_primary", primaryTabId: "xploit_primary_tab_id", primaryStatusChanged: "XPLOIT_TAB_STATUS_CHANGED" };
class x {
  constructor() {
    g(this, "tabId");
    this.tabId = s.tab_prefix + Date.now().toString(), this.init();
  }
  init() {
    if (typeof window > "u")
      return;
    const t = () => {
      localStorage.getItem(s.primaryTabId) ? this.setSlaveTab(this.tabId) : this.setPrimaryTab(this.tabId), this.notifyTabStatus();
    };
    document.readyState === "complete" ? t() : window.addEventListener("load", t), window.addEventListener("beforeunload", () => {
      this.isPrimaryTab() && this.transferPrimaryStatus(), this.removeTabStatus(this.tabId), this.isPrimaryTab() && this.removeTabStatus(s.primaryTabId);
    }), window.addEventListener("storage", (a) => {
      a.key === s.primaryTabId && this.notifyTabStatus();
    });
  }
  set(t, a) {
    localStorage.setItem(t, a);
  }
  get(t) {
    return localStorage.getItem(t);
  }
  remove(t) {
    localStorage.removeItem(t);
  }
  setPrimaryTab(t) {
    this.set(s.primaryTabId, t), this.set(t, s.primary);
  }
  setSlaveTab(t) {
    this.set(t, s.slave);
  }
  transferPrimaryStatus() {
    const t = Object.keys(localStorage).filter((a) => a !== s.primaryTabId && this.get(a) === s.slave);
    t.length > 0 ? this.setPrimaryTab(t[0]) : this.remove(s.primaryTabId);
  }
  removeTabStatus(t) {
    this.remove(t);
  }
  notifyTabStatus() {
    if (typeof window > "u")
      return;
    const t = { detail: { tabId: this.tabId, isPrimary: this.isPrimaryTab() } };
    window.dispatchEvent(new CustomEvent(s.primaryStatusChanged, t));
  }
  isPrimaryTab() {
    return this.get(s.primaryTabId) === this.tabId;
  }
}
var r, d, c, y, p, b, o, u, I, T, P;
const m = class m {
  constructor(t = null) {
    l(this, u);
    l(this, T);
    l(this, r, void 0);
    l(this, d, void 0);
    l(this, c, void 0);
    l(this, y, void 0);
    l(this, p, void 0);
    l(this, b, void 0);
    l(this, o, void 0);
    if (m.instance)
      return m.instance;
    this.setConfig(t), w(this, u, I).call(this), m.instance = this;
  }
  on(t, a) {
    i(this, r).push({ type: t, callback: a });
  }
  onList(t) {
    t.length && t.forEach(([a, n]) => {
      a && n && i(this, r).push({ type: a, callback: n });
    });
  }
  once(t, a) {
    i(this, r).push({ type: t, callback: a, once: !0 });
  }
  onceList(t) {
    t.length && t.forEach(([a, n]) => {
      a && n && i(this, r).push({ type: a, callback: n, once: !0 });
    });
  }
  off(t) {
    h(this, r, i(this, r).filter((a) => a.type !== t));
  }
  emit(t, a = null) {
    if (i(this, p) && !this.isPrimary() || !i(this, o))
      return;
    const n = { type: t, payload: a };
    i(this, o).postMessage(n), i(this, c) && i(this, o).onmessage({ data: n });
  }
  isPrimary() {
    return i(this, b).isPrimaryTab();
  }
  setConfig(t) {
    const a = { ..._, ...t };
    h(this, r, []), h(this, d, a.channelName), h(this, c, a.listenOwnChannel), h(this, y, a.onBecomePrimary), h(this, p, a.emitByPrimaryOnly);
  }
  destroy() {
    i(this, o) && i(this, o).close(), m.instance = null, h(this, o, null);
  }
  getEvents() {
    return [...i(this, r)];
  }
};
r = new WeakMap(), d = new WeakMap(), c = new WeakMap(), y = new WeakMap(), p = new WeakMap(), b = new WeakMap(), o = new WeakMap(), u = new WeakSet(), I = function() {
  window && (h(this, b, new x()), h(this, o, new BroadcastChannel(i(this, d))), i(this, o).onmessage = (t) => {
    const { type: a, payload: n } = t.data;
    h(this, r, i(this, r).filter((f) => f.type !== a || (f.callback(t.data), !f.once)));
  }, i(this, o).onmessageerror = (t) => {
    process.env.NODE_ENV !== "production" && console.error("Can't parse message", t);
  }, w(this, T, P).call(this));
}, T = new WeakSet(), P = function() {
  window.addEventListener(s.primaryStatusChanged, (t) => {
    const a = t;
    this.isPrimary() && i(this, y).call(this, a.detail);
  }, { passive: !0 });
}, g(m, "instance");
let S = m;
export {
  S as default
};
//# sourceMappingURL=index.es.js.map
