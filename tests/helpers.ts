import { afterEach, beforeEach, vi } from 'vitest';
import TabsBroadcast from '../src/index';
import globalConfig from '../src/core/config';

/** Wait a couple of macrotasks so async BroadcastChannel delivery can settle. */
export const tick = () => new Promise((resolve) => setTimeout(resolve, 15));

/** The namespaced localStorage key the fallback elector uses for a given channel. */
export const primaryKey = (channelName: string) => `${globalConfig.dict.primaryTabId}__${channelName}`;

/**
 * Install standard per-test isolation and return a `make()` factory that tracks the
 * created instance and tears it down automatically after each test.
 */
export function useTabsBroadcast() {
	let instance: TabsBroadcast<any> | null = null;

	const make = (config: any = {}): TabsBroadcast<any> => {
		instance = new TabsBroadcast(config);
		return instance;
	};

	/** Adopt an instance created outside the factory so it is torn down too. */
	const track = (inst: TabsBroadcast<any>) => {
		instance = inst;
		return inst;
	};

	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(async () => {
		if (instance) {
			await instance.destroy();
			instance = null;
		}
		localStorage.clear();
		vi.restoreAllMocks();
	});

	return { make, track };
}
