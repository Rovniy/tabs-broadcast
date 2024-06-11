var E = Object.defineProperty;
var C = (e, t, a) => t in e ? E(e, t, { enumerable: !0, configurable: !0, writable: !0, value: a }) : e[t] = a;
var T = (e, t, a) => (C(e, typeof t != "symbol" ? t + "" : t, a), a), w = (e, t, a) => {
  if (!t.has(e))
    throw TypeError("Cannot " + a);
};
var i = (e, t, a) => (w(e, t, "read from private field"), a ? a.call(e) : t.get(e)), l = (e, t, a) => {
  if (t.has(e))
    throw TypeError("Cannot add the same private member more than once");
  t instanceof WeakSet ? t.add(e) : t.set(e, a);
}, h = (e, t, a, r) => (w(e, t, "write to private field"), r ? r.call(e, a) : t.set(e, a), a);
var v = (e, t, a) => (w(e, t, "access private method"), a);
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
    window.addEventListener("load", t), window.addEventListener("beforeunload", () => {
      this.isPrimaryTab() && this.transferPrimaryStatus(), this.removeTabStatus(this.tabId);
    }), window.addEventListener("storage", (a) => {
      a.key === n.primaryTabId && this.notifyTabStatus();
    }), t();
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
    this.set(n.primaryTabId, t), this.set(t, n.primary);
  }
  setSlaveTab(t) {
    this.set(t, n.slave);
  }
  transferPrimaryStatus() {
    const t = Object.keys(localStorage).filter((a) => a !== n.primaryTabId && this.get(a) === n.slave);
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
var s, d, m, y, p, b, o, u, S, f, P;
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
    this.setConfig(t), v(this, u, S).call(this), c.instance = this;
  }
  on(t, a) {
    i(this, s).push({ type: t, callback: a });
  }
  onList(t) {
    t.length && t.forEach(([a, r]) => {
      a && r && i(this, s).push({ type: a, callback: r });
    });
  }
  once(t, a) {
    i(this, s).push({ type: t, callback: a, once: !0 });
  }
  onceList(t) {
    t.length && t.forEach(([a, r]) => {
      a && r && i(this, s).push({ type: a, callback: r, once: !0 });
    });
  }
  off(t) {
    h(this, s, i(this, s).filter((a) => a.type !== t));
  }
  emit(t, a = null) {
    if (i(this, p) && !this.isPrimary() || !i(this, o))
      return;
    const r = { type: t, payload: a };
    i(this, o).postMessage(r), i(this, m) && i(this, o).onmessage({ data: r });
  }
  isPrimary() {
    return i(this, b).isPrimaryTab();
  }
  setConfig(t) {
    const a = { ..._, ...t };
    h(this, s, []), h(this, d, a.channelName), h(this, m, a.listenOwnChannel), h(this, y, a.onBecomePrimary), h(this, p, a.emitByPrimaryOnly);
  }
  destroy() {
    i(this, o) && i(this, o).close(), c.instance = null, h(this, o, null);
  }
  getEvents() {
    return [...i(this, s)];
  }
};
s = new WeakMap(), d = new WeakMap(), m = new WeakMap(), y = new WeakMap(), p = new WeakMap(), b = new WeakMap(), o = new WeakMap(), u = new WeakSet(), S = function() {
  window && (h(this, b, new x()), h(this, o, new BroadcastChannel(i(this, d))), i(this, o).onmessage = (t) => {
    const { type: a, payload: r } = t.data;
    h(this, s, i(this, s).filter((g) => g.type !== a || (g.callback(t.data), !g.once)));
  }, i(this, o).onmessageerror = (t) => {
    process.env.NODE_ENV !== "production" && console.error("Can't parse message", t);
  }, v(this, f, P).call(this));
}, f = new WeakSet(), P = function() {
  window.addEventListener(n.primaryStatusChanged, (t) => {
    const a = t;
    this.isPrimary() && i(this, y).call(this, a.detail);
  }, { passive: !0 });
}, T(c, "instance");
let I = c;
export {
  I as default
};
//# sourceMappingURL=index.es.js.map
