# tabs-broadcast-nuxt

Official [Nuxt](https://nuxt.com) module for [`tabs-broadcast`](https://www.npmjs.com/package/tabs-broadcast) — zero-dependency inter-tab communication over the `BroadcastChannel` API with primary-tab (leader) election.

The module registers a **client-only** plugin that creates the shared `TabsBroadcast` instance and exposes it through the auto-imported `useTabsBroadcast()` composable (and as `$tabsBroadcast` on the Nuxt app).

## Install

```bash
npm install tabs-broadcast-nuxt tabs-broadcast
# nuxt is a peer dependency (Nuxt 3 or 4)
```

## Setup

Add the module and (optionally) configure it in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['tabs-broadcast-nuxt'],

  tabsBroadcast: {
    channelName: 'my-app',
    listenOwnChannel: true,
    // emitByPrimaryOnly: true (default) — non-primary tabs drop emit()
    // composables: true (default) — auto-import useTabsBroadcast()
  },
})
```

All [core config options](https://www.npmjs.com/package/tabs-broadcast#configuration) are accepted **except** `onBecomePrimary` — it is a function and cannot live in `runtimeConfig`. Configure it app-side instead (see below).

## Usage

```vue
<script setup lang="ts">
const bus = useTabsBroadcast()

onMounted(() => {
  bus.on('tab:open', ({ payload }) => {
    console.log('another tab opened', payload)
  })
})
</script>
```

### SSR

The instance is **client-only** (`BroadcastChannel`/`localStorage`/`navigator.locks` do not exist on the server). On the server `useTabsBroadcast()` resolves to `undefined`, so only touch it on the client — inside `onMounted` or guarded by `import.meta.client`.

### Emitting reliably

Primary-tab election is asynchronous. While `emitByPrimaryOnly` is enabled (the default), an `emit()` fired immediately after mount is silently dropped because the tab is not primary *yet*. Two options:

```ts
// 1) Any tab may emit — disable the primary gate:
// nuxt.config.ts → tabsBroadcast: { emitByPrimaryOnly: false }

// 2) Emit only once this tab becomes primary (configured app-side, e.g. in a plugin):
import TabsBroadcast from 'tabs-broadcast'
new TabsBroadcast({
  onBecomePrimary: () => { /* safe to emit here */ },
})
```

Because the core class is a singleton, a `new TabsBroadcast({ onBecomePrimary })` call in your own plugin reuses the same instance — but note that config passed to a second `new` is ignored once the instance exists, so set non-serialisable options in a plugin that runs **before** any code that triggers instantiation.

## Options

| Option              | Type      | Default     | Notes                                          |
| ------------------- | --------- | ----------- | ---------------------------------------------- |
| `channelName`       | `string`  | core default | Tabs only coordinate if they share this name. |
| `layer`             | `string`  | `default_layer` | Default layer name.                       |
| `listenOwnChannel`  | `boolean` | `false`     | Re-dispatch `emit` locally to the same tab.    |
| `emitByPrimaryOnly` | `boolean` | `true`      | Non-primary tabs drop `emit()`.                |
| `disableInternalErrors` | `boolean` | `true`  | Suppress internal error logging.               |
| `composables`       | `boolean` | `true`      | Auto-import `useTabsBroadcast()`.              |

## License

MIT © Andrei (Ravy) Rovnyi
