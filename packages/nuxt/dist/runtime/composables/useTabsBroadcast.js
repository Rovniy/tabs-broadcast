import { useNuxtApp } from "#app";
export function useTabsBroadcast() {
  return useNuxtApp().$tabsBroadcast;
}
