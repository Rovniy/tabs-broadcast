var E = Object.defineProperty;
var C = (a, t, e) => t in a ? E(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var T = (a, t, e) => (C(a, typeof t != "symbol" ? t + "" : t, e), e), w = (a, t, e) => {
  if (!t.has(a))
    throw TypeError("Cannot " + e);
};
var i = (a, t, e) => (w(a, t, "read from private field"), e ? e.call(a) : t.get(a)), l = (a, t, e) => {
  if (t.has(a))
    throw TypeError("Cannot add the same private member more than once");
  t instanceof WeakSet ? t.add(a) : t.set(a, e);
}, h = (a, t, e, r) => (w(a, t, "write to private field"), r ? r.call(a, e) : t.set(a, e), e);
var v = (a, t, e) => (w(a, t, "access private method"), e);
const _ = { channelName: "xploit_tab_channel", listenOwnChannel: !0, emitByPrimaryOnly: !0, onBecomePrimary: () => {
} }, n = { tab_prefix: "xploit_tab_id_", slave: "xploit_slave", primary: "xploit_primary", primaryTabId: "xploit_primary_tab_id", primaryStatusChanged: "XPLOIT_TAB_STATUS_CHANGED" };
class x {
  constructor() {
    T(this, "tabId");
    this.tabId = n.tab_prefix + Date.now().toString(), this.init();
  }
  init() {
    if (typeof window > "u")
      return;
    const t = () => {
      localStorage.getItem(n.primaryTabId) ? this.setSlaveTab(this.tabId) : this.setPrimaryTab(this.tabId), this.notifyTabStatus();
    };
    document.readyState === "complete" ? t() : window.addEventListener("load", t), window.addEventListener("beforeunload", () => {
      this.isPrimaryTab() && this.transferPrimaryStatus(), this.removeTabStatus(this.tabId);
    }), window.addEventListener("storage", (e) => {
      e.key === n.primaryTabId && this.notifyTabStatus();
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
    this.set(n.primaryTabId, t), this.set(t, n.primary);
  }
  setSlaveTab(t) {
    this.set(t, n.slave);
  }
  transferPrimaryStatus() {
    const t = Object.keys(localStorage).filter((e) => e !== n.primaryTabId && this.get(e) === n.slave);
    t.length > 0 ? this.setPrimaryTab(t[0]) : this.remove(n.primaryTabId);
  }
  removeTabStatus(t) {
    this.remove(t);
  }
  notifyTabStatus() {
    if (typeof window > "u")
      return;
    const t = { detail: { tabId: this.tabId, isPrimary: this.isPrimaryTab() } };
    window.dispatchEvent(new CustomEvent(n.primaryStatusChanged, t));
  }
  isPrimaryTab() {
    return this.get(n.primaryTabId) === this.tabId;
  }
}
var s, d, m, y, p, b, o, u, I, f, P;
const c = class c {
  constructor(t = null) {
    l(this, u);
    l(this, f);
    l(this, s, void 0);
    l(this, d, void 0);
    l(this, m, void 0);
    l(this, y, void 0);
    l(this, p, void 0);
    l(this, b, void 0);
    l(this, o, void 0);
    if (c.instance)
      return c.instance;
    this.setConfig(t), v(this, u, I).call(this), c.instance = this;
  }
  on(t, e) {
    i(this, s).push({ type: t, callback: e });
  }
  onList(t) {
    t.length && t.forEach(([e, r]) => {
      e && r && i(this, s).push({ type: e, callback: r });
    });
  }
  once(t, e) {
    i(this, s).push({ type: t, callback: e, once: !0 });
  }
  onceList(t) {
    t.length && t.forEach(([e, r]) => {
      e && r && i(this, s).push({ type: e, callback: r, once: !0 });
    });
  }
  off(t) {
    h(this, s, i(this, s).filter((e) => e.type !== t));
  }
  emit(t, e = null) {
    if (i(this, p) && !this.isPrimary() || !i(this, o))
      return;
    const r = { type: t, payload: e };
    i(this, o).postMessage(r), i(this, m) && i(this, o).onmessage({ data: r });
  }
  isPrimary() {
    return i(this, b).isPrimaryTab();
  }
  setConfig(t) {
    const e = { ..._, ...t };
    h(this, s, []), h(this, d, e.channelName), h(this, m, e.listenOwnChannel), h(this, y, e.onBecomePrimary), h(this, p, e.emitByPrimaryOnly);
  }
  destroy() {
    i(this, o) && i(this, o).close(), c.instance = null, h(this, o, null);
  }
  getEvents() {
    return [...i(this, s)];
  }
};
s = new WeakMap(), d = new WeakMap(), m = new WeakMap(), y = new WeakMap(), p = new WeakMap(), b = new WeakMap(), o = new WeakMap(), u = new WeakSet(), I = function() {
  window && (h(this, b, new x()), h(this, o, new BroadcastChannel(i(this, d))), i(this, o).onmessage = (t) => {
    const { type: e, payload: r } = t.data;
    h(this, s, i(this, s).filter((g) => g.type !== e || (g.callback(t.data), !g.once)));
  }, i(this, o).onmessageerror = (t) => {
    process.env.NODE_ENV !== "production" && console.error("Can't parse message", t);
  }, v(this, f, P).call(this));
}, f = new WeakSet(), P = function() {
  window.addEventListener(n.primaryStatusChanged, (t) => {
    const e = t;
    this.isPrimary() && i(this, y).call(this, e.detail);
  }, { passive: !0 });
}, T(c, "instance");
let S = c;
export {
  S as default
};
//# sourceMappingURL=index.es.js.map
