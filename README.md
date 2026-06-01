# TabsBroadcast

[![npm version](https://img.shields.io/npm/v/tabs-broadcast.svg)](https://www.npmjs.com/package/tabs-broadcast)
[![npm downloads](https://img.shields.io/npm/dm/tabs-broadcast.svg)](https://www.npmjs.com/package/tabs-broadcast)
[![types](https://img.shields.io/npm/types/tabs-broadcast.svg)](https://www.npmjs.com/package/tabs-broadcast)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/tabs-broadcast.svg)](https://bundlephobia.com/package/tabs-broadcast)
[![License](https://badgen.net/github/license/rovniy/tabs-broadcast)](LICENSE)

**TabsBroadcast** is a tiny, zero-dependency TypeScript library for inter-tab communication over the
[BroadcastChannel API](https://developer.mozilla.org/docs/Web/API/BroadcastChannel). It elects a single
**primary tab** (leader) — via the [Web Locks API](https://developer.mozilla.org/docs/Web/API/Web_Locks_API)
with a `localStorage` fallback — so exactly one tab performs work that must not run in duplicate, while every
tab can publish and subscribe to typed events, optionally isolated into **layers**.

> 🔎 Live demo: **[tabs-broadcast.ravy.pro](https://tabs-broadcast.ravy.pro)**

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Primary / slave tabs](#primary--slave-tabs)
- [Layers](#layers)
- [Typed events](#typed-events)
- [API](#api)
- [Plugins](#plugins)
- [Security considerations](#security-considerations)
- [Primary tab election](#primary-tab-election)
- [Browser support](#browser-support)
- [Framework usage](#framework-usage)
- [Migration: 3.x → 4.0](#migration-3x--40)
- [Contributing](#contributing)
- [License & author](#license--author)

## Features

- Inter-tab communication over the **BroadcastChannel API**.
- **Primary/slave** (leader) election with automatic failover when the primary tab closes.
- **Web Locks**-based leadership (race-free, self-healing) with a `localStorage` heartbeat fallback.
- **Layers** to isolate event streams (great for micro-frontends).
- **Typed events** via an optional generic — full autocomplete and payload type-checking.
- Wildcard (`*`) listeners, one-time listeners, and bulk registration.
- Extensible through **plugins**.
- Zero dependencies, ESM + UMD builds, first-class TypeScript types.

## Installation

```bash
npm install tabs-broadcast
# or: pnpm add tabs-broadcast / yarn add tabs-broadcast / bun add tabs-broadcast
```

## Quick start

```ts
import TabsBroadcast from 'tabs-broadcast';
// or: import { TabsBroadcast } from 'tabs-broadcast';

const bus = new TabsBroadcast();

// Subscribe (in every tab)
bus.on('cart:update', ({ payload }) => {
  console.log('cart changed:', payload);
});

// Publish (only the primary tab emits by default)
if (bus.primary) {
  bus.emit('cart:update', { items: 3 });
}
```

`TabsBroadcast` is a **singleton**: constructing it again returns the existing instance. Call
[`destroy()`](#destroydelay-number-promisevoid) to tear it down.

## Configuration

Pass options to the constructor (or [`setConfig`](#setconfigconfig-tdefaultconfig-void)):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `channelName` | `string` | `xploit_tab_channel` | BroadcastChannel name. Use the same value across micro-frontends to make them talk; use distinct values for fully independent instances. |
| `listenOwnChannel` | `boolean` | `false` | If `true`, the emitting tab also receives its own messages locally. |
| `emitByPrimaryOnly` | `boolean` | `true` | If `true`, `emit()` is a no-op on non-primary tabs. |
| `onBecomePrimary` | `(detail: { tabId: string }) => void` | `() => {}` | Called when this tab acquires primary status. |
| `disableInternalErrors` | `boolean` | `true` | If `false`, internal errors are logged via `console.error`. |

```ts
const bus = new TabsBroadcast({
  channelName: 'my_app',
  emitByPrimaryOnly: true,
  onBecomePrimary: ({ tabId }) => console.log('I am primary now:', tabId),
});
```

> To make a channel harder for unrelated same-origin scripts to target, use a non-default,
> hard-to-guess `channelName` (see [Security considerations](#security-considerations)).

## Primary / slave tabs

The library guarantees that exactly one open tab is the **primary**; the rest are **slaves**. When the
primary tab is closed or refreshed, another tab is promoted automatically. This is useful to:

- **Avoid conflicts** — run server sync / writes in one tab only.
- **Save resources** — perform background polling once instead of per-tab.
- **Centralize state & notifications** — one tab coordinates and de-duplicates alerts.

```ts
const bus = new TabsBroadcast({ onBecomePrimary: () => startBackgroundSync() });

bus.on('data:sync', ({ payload }) => updateLocalCache(payload));

if (bus.primary) {
  // only the primary tab reaches the server
  bus.emit('data:sync', await fetchLatest());
}
```

## Layers

Layers split events within one channel into independent streams. A listener registered in a layer
only receives events emitted to that layer. Layers also improve performance (fewer iterations) and
memory use, and are ideal for isolating micro-frontends sharing one channel.

```ts
bus.on('update', onCheckout, 'CHECKOUT');
bus.on('update', onCatalog, 'CATALOG');

bus.emit('update', { id: 1 }, 'CHECKOUT');            // only onCheckout fires
bus.emit('update', { id: 2 }, ['CHECKOUT', 'CATALOG']); // both fire
```

## Typed events

Provide an event map as a generic argument to get full type-safety on `on`/`once`/`emit`:

```ts
type Events = {
  'cart:update': { items: number };
  'user:logout': null;
  ping: number;
};

const bus = new TabsBroadcast<Events>();

bus.on('cart:update', ({ payload }) => payload.items.toFixed()); // payload: { items: number }
bus.emit('ping', 42);                                            // ✅
bus.emit('ping', 'oops');                                        // ❌ type error
bus.on('unknown', () => {});                                     // ❌ type error

// Wildcard listeners receive the union of all payloads
bus.on('*', (event) => console.log(event.type, event.payload));
```

The generic is optional — `new TabsBroadcast()` stays fully permissive, so existing untyped code keeps
working unchanged.

## API

### `on(type, callback, layer?)`
Register a persistent listener. Use `'*'` to capture **every** event in a layer.

```ts
bus.on('eventName', ({ payload }) => console.log(payload));
bus.on('*', (event) => console.log('any event:', event), 'APP_LAYER_0');
```

### `once(type, callback, layer?)`
Like `on`, but the listener is removed after the first matching event.

### `onList(list)` / `onceList(list)`
Register many listeners at once. Each item is `[type, callback, layer?]`.

```ts
bus.onList([
  ['eventA', onA],
  ['eventB', onB, 'APP_LAYER_0'],
]);
```

### `off(type, layer?)`
Unregister all callbacks of `type`. Omit `layer` to remove them from **every** layer.

```ts
bus.off('eventName');              // all layers
bus.off('eventName', 'APP_LAYER_0'); // one layer
```

### `deleteLayer(layer)`
Remove an entire layer and all of its listeners.

```ts
bus.deleteLayer('APP_LAYER_0');
```

### `emit(type, payload?, layers?)`
Emit a message to all listening tabs (and to this tab if `listenOwnChannel` is enabled). No-op on
non-primary tabs when `emitByPrimaryOnly` is `true`. `layers` may be a single name or an array.

```ts
bus.emit('eventName');
bus.emit('eventName', { id: 1 });
bus.emit('eventName', { id: 1 }, ['APP_LAYER_0', 'APP_LAYER_3']);
```

### `setConfig(config)`
Override configuration properties (merged over defaults).

### `destroy(delay?)`
Tear down the channel and election worker, clear all listeners/layers, relinquish leadership, and
reset the singleton. Optional `delay` (ms) defers destruction.

```ts
await bus.destroy();     // immediately
await bus.destroy(500);  // after 500ms
```

### `getEvents()` / `getLayers()`
Inspect registered listeners and layer names.

```ts
bus.getEvents();  // TCallbackItem[]
bus.getLayers();  // e.g. ['APP_LAYER_0', 'APP_LAYER_1']
```

### `primary: boolean`
Whether the current tab is the primary tab.

```ts
if (bus.primary) bus.emit('tick');
```

> `isPrimary()` still exists but is **deprecated** — use the `primary` property.

## Plugins

A plugin is a function `(instance) => void` that extends the instance with new methods or wraps
existing ones. Register it with `use`.

```ts
const emitToAllLayersPlugin = (instance) => {
  instance.emitToAllLayers = function (type, payload) {
    this.emit(type, payload, Object.keys(this.layers));
  };
};

const bus = new TabsBroadcast();
bus.use(emitToAllLayersPlugin);
bus.emitToAllLayers('globalEvent', { synced: true });
```

```ts
// Auto-logging plugin
const autoLogPlugin = (instance) => {
  const originalEmit = instance.emit.bind(instance);
  instance.emit = (type, payload, layers) => {
    console.log('[LOG] emit', type, payload, layers);
    originalEmit(type, payload, layers);
  };
};
```

## Security considerations

`BroadcastChannel` is same-origin, but it is **not** a private channel. Any script running on the same
origin — third-party tags, browser extensions, or injected code via XSS — that knows the channel name
can post messages to it. Therefore:

- **Treat every received `payload` as untrusted input.** Do not pass it directly to `innerHTML`, `eval`,
  navigation, or other sensitive sinks without validating it first.
- TabsBroadcast validates the *shape* of incoming messages and silently ignores malformed ones. Incoming
  messages are only delivered to listeners of **already-registered layers** — a remote message can never
  create new layers in your instance.
- If you need to make the channel harder to target, set a non-default, hard-to-guess `channelName`.

## Primary tab election

Election uses the **Web Locks API** (`navigator.locks`) when available: leadership is held for as long
as the tab is alive and released automatically by the browser on close/crash — so there are no stale
entries and no election races. Without Web Locks, the library falls back to a `localStorage` heartbeat
with automatic stale-primary recovery and a deterministic tab-id tie-break. All election state is
namespaced per `channelName`, so independent channels never contend for the same primary slot.

`onBecomePrimary` receives a `{ tabId }` detail identifying the tab that became primary.

## Browser support

Works in all modern browsers that implement `BroadcastChannel` (Chrome/Edge, Firefox, Safari 15.4+).
Where the **Web Locks API** is available (the common case) it is used for election; otherwise the
`localStorage` fallback kicks in automatically. SSR is safe — the library no-ops without a `window`.

## Framework usage

A minimal React hook:

```tsx
import { useEffect, useRef, useState } from 'react';
import TabsBroadcast from 'tabs-broadcast';

export function useTabsBroadcast() {
  const ref = useRef<TabsBroadcast>();
  const [isPrimary, setPrimary] = useState(false);

  if (!ref.current) {
    ref.current = new TabsBroadcast({ onBecomePrimary: () => setPrimary(true) });
    setPrimary(ref.current.primary);
  }

  // Note: TabsBroadcast is a singleton; destroy on full app teardown, not per-component.
  return { bus: ref.current, isPrimary };
}
```

## Migration: 3.x → 4.0

4.0 is a correctness/security release with a few breaking changes:

- **Namespaced election state** — `localStorage`/lock keys are now per-`channelName`. State written by 3.x
  is not read by 4.0.
- **`listenOwnChannel` now defaults to `false`** (matches the docs). Pass `true` explicitly to keep the
  old self-listening behavior.
- **`onBecomePrimary` detail is now `{ tabId }`** (the `isPrimary` field was removed).

See the [CHANGELOG](CHANGELOG.md) for the full list, including the `off()` and `disableInternalErrors`
fixes and the Web Locks election.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short:

```bash
npm install
npm test          # unit tests (Vitest + happy-dom)
npm run test:types # type-level tests
npm run lint
npm run build
```

## License & author

MIT — see [LICENSE](LICENSE).

Created by **Andrei (Ravy) Rovnyi** — [contact@ravy.pro](mailto:contact@ravy.pro) · [ravy.pro](https://ravy.pro)

#### ![](https://badgen.net/static/XPLOIT/RAVY/fa4c28)
