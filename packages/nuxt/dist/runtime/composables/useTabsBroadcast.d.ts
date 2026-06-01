/**
 * @file runtime/composables/useTabsBroadcast.ts
 * @description Auto-imported composable returning the TabsBroadcast instance.
 *
 * The instance is provided by the client-only plugin, so it only exists in the browser.
 * Call this from client-side code (e.g. inside `onMounted` or guarded by `import.meta.client`);
 * on the server it resolves to `undefined`.
 *
 * Note: `emit()` is dropped on non-primary tabs while `emitByPrimaryOnly` is enabled (the
 * default). To emit reliably right after mount, either set `emitByPrimaryOnly: false` or emit
 * from the `onBecomePrimary` callback.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 */
import type TabsBroadcast from 'tabs-broadcast';
export declare function useTabsBroadcast(): TabsBroadcast;
