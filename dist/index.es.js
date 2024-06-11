var C = Object.defineProperty;
var E = (a, t, e) => t in a ? C(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var g = (a, t, e) => (E(a, typeof t != "symbol" ? t + "" : t, e), e), v = (a, t, e) => {
  if (!t.has(a))
    throw TypeError("Cannot " + e);
};
var i = (a, t, e) => (v(a, t, "read from private field"), e ? e.call(a) : t.get(a)), l = (a, t, e) => {
  if (t.has(a))
    throw TypeError("Cannot add the same private member more than once");
  t instanceof WeakSet ? t.add(a) : t.set(a, e);
}, h = (a, t, e, s) => (v(a, t, "write to private field"), s ? s.call(a, e) : t.set(a, e), e);
var w = (a, t, e) => (v(a, t, "access private method"), e);
const _ = { channelName: "xploit_tab_channel", listenOwnChannel: !0, emitByPrimaryOnly: !0, onBecomePrimary: () => {
}, onTabsUpdate: () => {
} }, r = { tab_prefix: "xploit_tab_id_", slave: "xploit_slave", primary: "xploit_primary", primaryTabId: "xploit_primary_tab_id", primaryStatusChanged: "XPLOIT_TAB_STATUS_CHANGED" };
class x {
  constructor() {
    g(this, "tabId");
    this.tabId = r.tab_prefix + Date.now().toString(), this.init();
  }
  init() {
    typeof window > "u" || (window.addEventListener("load", () => {
      localStorage.getItem(r.primaryTabId) ? this.setSlaveTab(this.tabId) : this.setPrimaryTab(this.tabId), this.notifyTabStatus();
    }), window.addEventListener("beforeunload", () => {
      this.isPrimaryTab() && this.transferPrimaryStatus(), this.removeTabStatus(this.tabId);
    }), window.addEventListener("storage", (t) => {
      t.key === r.primaryTabId && this.notifyTabStatus();
    }));
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
    this.set(r.primaryTabId, t), this.set(t, r.primary);
  }
  setSlaveTab(t) {
    this.set(t, r.slave);
  }
  transferPrimaryStatus() {
    const t = Object.keys(localStorage).filter((e) => e !== r.primaryTabId && this.get(e) === r.slave);
    t.length > 0 ? this.setPrimaryTab(t[0]) : this.remove(r.primaryTabId);
  }
  removeTabStatus(t) {
    this.remove(t);
  }
  notifyTabStatus() {
    if (typeof window > "u")
      return;
    const t = { detail: { tabId: this.tabId, isPrimary: this.isPrimaryTab() } };
    window.dispatchEvent(new CustomEvent(r.primaryStatusChanged, t));
  }
  isPrimaryTab() {
    return this.get(r.primaryTabId) === this.tabId;
  }
}
var n, d, y, c, p, b, o, u, S, f, P;
const m = class m {
  constructor(t = null) {
    l(this, u);
    l(this, f);
    l(this, n, void 0);
    l(this, d, void 0);
    l(this, y, void 0);
    l(this, c, void 0);
    l(this, p, void 0);
    l(this, b, void 0);
    l(this, o, void 0);
    if (m.instance)
      return m.instance;
    this.setConfig(t), w(this, u, S).call(this), m.instance = this;
  }
  on(t, e) {
    i(this, n).push({ type: t, callback: e });
  }
  onList(t) {
    t.length && t.forEach(([e, s]) => {
      e && s && i(this, n).push({ type: e, callback: s });
    });
  }
  once(t, e) {
    i(this, n).push({ type: t, callback: e, toRemove: !0 });
  }
  onceList(t) {
    t.length && t.forEach(([e, s]) => {
      e && s && i(this, n).push({ type: e, callback: s, toRemove: !0 });
    });
  }
  off(t) {
    h(this, n, i(this, n).filter((e) => e.type !== t));
  }
  emit(t, e = null) {
    if (i(this, p) && !this.isPrimary() || !i(this, o))
      return;
    const s = { type: t, payload: e };
    i(this, o).postMessage(s), i(this, y) && i(this, o).onmessage({ data: s });
  }
  isPrimary() {
    return i(this, b).isPrimaryTab();
  }
  setConfig(t) {
    const e = { ..._, ...t };
    h(this, n, []), h(this, d, e.channelName), h(this, y, e.listenOwnChannel), h(this, c, e.onBecomePrimary), h(this, p, e.emitByPrimaryOnly);
  }
  destroy() {
    i(this, o) && i(this, o).close(), m.instance = null, h(this, o, null);
  }
};
n = new WeakMap(), d = new WeakMap(), y = new WeakMap(), c = new WeakMap(), p = new WeakMap(), b = new WeakMap(), o = new WeakMap(), u = new WeakSet(), S = function() {
  window && (h(this, b, new x()), h(this, o, new BroadcastChannel(i(this, d))), i(this, o).onmessage = (t) => {
    const { type: e, payload: s } = t.data;
    h(this, n, i(this, n).filter((T) => T.type !== e || (T.callback(s), !T.toRemove)));
  }, i(this, o).onmessageerror = (t) => {
    process.env.NODE_ENV !== "production" && console.error("Can't parse message", t);
  }, w(this, f, P).call(this));
}, f = new WeakSet(), P = function() {
  window.addEventListener(r.primaryStatusChanged, (t) => {
    const e = t;
    this.isPrimary() && i(this, c).call(this, e.detail);
  }, { passive: !0 });
}, g(m, "instance");
let I = m;
export {
  I as default
};
//# sourceMappingURL=index.es.js.map
