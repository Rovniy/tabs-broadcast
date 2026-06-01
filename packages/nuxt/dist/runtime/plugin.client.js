import TabsBroadcast from "tabs-broadcast";
import { defineNuxtPlugin, useRuntimeConfig } from "#app";
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.tabsBroadcast ?? {};
  const bus = new TabsBroadcast(config);
  return {
    provide: {
      tabsBroadcast: bus
    }
  };
});
