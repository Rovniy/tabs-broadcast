import { defineNuxtModule, createResolver, addPlugin, addImportsDir } from '@nuxt/kit';

const module = defineNuxtModule({
  meta: {
    name: "tabs-broadcast",
    configKey: "tabsBroadcast",
    compatibility: {
      nuxt: ">=3.0.0"
    }
  },
  defaults: {
    composables: true
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const { composables, ...clientConfig } = options;
    nuxt.options.runtimeConfig.public.tabsBroadcast = {
      ...nuxt.options.runtimeConfig.public.tabsBroadcast,
      ...clientConfig
    };
    addPlugin({ src: resolver.resolve("./runtime/plugin.client"), mode: "client" });
    if (composables !== false) {
      addImportsDir(resolver.resolve("./runtime/composables"));
    }
  }
});

export { module as default };
