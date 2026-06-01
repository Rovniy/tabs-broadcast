/**
 * @file runtime/plugin.client.ts
 * @description Client-only Nuxt plugin that instantiates the TabsBroadcast singleton.
 *
 * Reads the serialisable config from `runtimeConfig.public.tabsBroadcast` (filled by the
 * module), creates the instance and provides it as `$tabsBroadcast`. The core class is a
 * singleton, so calling `new TabsBroadcast()` again anywhere returns this same instance.
 *
 * License: MIT
 * Author: Andrei (Ravy) Rovnyi
 */
import TabsBroadcast from 'tabs-broadcast';
declare const _default: any;
export default _default;
declare module '#app' {
    interface NuxtApp {
        $tabsBroadcast: TabsBroadcast;
    }
}
declare module 'vue' {
    interface ComponentCustomProperties {
        $tabsBroadcast: TabsBroadcast;
    }
}
