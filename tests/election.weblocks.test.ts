import { describe, it, expect, afterEach, afterAll, vi } from 'vitest';
import TabsBroadcast from '../src/index';
import { tick, useTabsBroadcast } from './helpers';

// happy-dom ships a `navigator.locks` object whose `request` is null. We mock `request` to
// exercise the Web Locks elector: it grants the lock immediately (sync) and lets us observe
// release on destroy.
describe('primary election (Web Locks)', () => {
	const { track } = useTabsBroadcast();
	const nav = navigator as any;
	// `navigator.locks` is a getter-only property in happy-dom (returning null). Shadow it
	// with our own configurable object so we can install a mock `request` that the worker
	// detects as the Web Locks strategy.
	const locks = { request: undefined as any };
	Object.defineProperty(nav, 'locks', { configurable: true, writable: true, value: locks });

	afterAll(() => {
		delete nav.locks;
	});

	afterEach(() => {
		locks.request = undefined;
	});

	it('becomes primary when the lock is granted and releases it on destroy', async () => {
		let released = false;

		locks.request = vi.fn((_name: string, cb: () => Promise<void>) => {
			const held = cb(); // grant immediately -> elector calls setPrimary(true)
			held.then(() => {
				released = true;
			});
			return held;
		});

		const inst = track(new TabsBroadcast({ channelName: 'ch_locks' }));

		expect(locks.request).toHaveBeenCalledOnce();
		expect(locks.request.mock.calls[0][0]).toContain('ch_locks');
		expect(inst.primary).toBe(true);

		await inst.destroy();
		await tick();

		expect(released).toBe(true);
	});

	it('does not throw if the lock request rejects', () => {
		locks.request = vi.fn(() => Promise.reject(new Error('denied')));
		expect(() => track(new TabsBroadcast({ channelName: 'ch_locks_reject' }))).not.toThrow();
	});
});
