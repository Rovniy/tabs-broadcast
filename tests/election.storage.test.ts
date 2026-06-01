import { describe, it, expect, vi } from 'vitest';
import { primaryKey, useTabsBroadcast } from './helpers';

// happy-dom exposes `navigator.locks` but its `request` is null, so these run against the
// localStorage fallback elector.
describe('primary election (localStorage fallback)', () => {
	const { make } = useTabsBroadcast();

	it('a fresh tab becomes primary and fires onBecomePrimary with its tabId', () => {
		const onBecomePrimary = vi.fn();
		const channelName = 'ch_elect_1';
		const inst = make({ channelName, onBecomePrimary });

		expect(inst.primary).toBe(true);
		expect(onBecomePrimary).toHaveBeenCalledTimes(1);
		expect(onBecomePrimary.mock.calls[0][0]).toMatchObject({ tabId: expect.any(String) });
	});

	it('yields when another live primary already holds the channel', () => {
		const channelName = 'ch_elect_2';
		localStorage.setItem(primaryKey(channelName), JSON.stringify({ tabId: 'someone_else', ts: Date.now() }));

		const inst = make({ channelName });
		expect(inst.primary).toBe(false);
	});

	it('takes over a stale primary claim', () => {
		const channelName = 'ch_elect_3';
		// ts far in the past -> considered dead
		localStorage.setItem(primaryKey(channelName), JSON.stringify({ tabId: 'dead_tab', ts: Date.now() - 999999 }));

		const inst = make({ channelName });
		expect(inst.primary).toBe(true);
	});

	it('namespaces the primary key per channelName', () => {
		const channelName = 'ch_ns';
		make({ channelName });
		expect(localStorage.getItem(primaryKey(channelName))).not.toBeNull();
		expect(localStorage.getItem(primaryKey('other_channel'))).toBeNull();
	});
});
