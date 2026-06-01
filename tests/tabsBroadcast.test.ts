import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TabsBroadcast from '../src/index';
import globalConfig from '../src/core/config';

const tick = () => new Promise((r) => setTimeout(r, 15));

const primaryKey = (channelName: string) => `${globalConfig.dict.primaryTabId}__${channelName}`;

let tb: TabsBroadcast | null = null;

/** Create an instance and remember it for teardown. */
function make(config: any = {}): TabsBroadcast {
	tb = new TabsBroadcast(config);
	return tb;
}

beforeEach(() => {
	localStorage.clear();
});

afterEach(async () => {
	if (tb) {
		await tb.destroy();
		tb = null;
	}
	localStorage.clear();
	vi.restoreAllMocks();
});

describe('primary election (localStorage fallback)', () => {
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

describe('local dispatch: on / once / off / layers / wildcard', () => {
	const baseConfig = { channelName: 'ch_dispatch', emitByPrimaryOnly: false, listenOwnChannel: true };

	it('delivers events to matching listeners', () => {
		const inst = make({ ...baseConfig });
		const cb = vi.fn();
		inst.on('PING', cb);
		inst.emit('PING', { n: 1 });
		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb.mock.calls[0][0]).toEqual({ type: 'PING', payload: { n: 1 }, layer: globalConfig.defaultConfig.layer });
	});

	it('off() actually removes listeners', () => {
		const inst = make({ ...baseConfig });
		const cb = vi.fn();
		inst.on('PING', cb);
		inst.off('PING');
		inst.emit('PING');
		expect(cb).not.toHaveBeenCalled();
	});

	it('off() does not throw for a non-existent layer', () => {
		const inst = make({ ...baseConfig });
		expect(() => inst.off('NOPE', 'no_such_layer')).not.toThrow();
	});

	it('once() fires exactly once', () => {
		const inst = make({ ...baseConfig });
		const cb = vi.fn();
		inst.once('ONCE', cb);
		inst.emit('ONCE');
		inst.emit('ONCE');
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it('isolates events by layer', () => {
		const inst = make({ ...baseConfig });
		const a = vi.fn();
		const b = vi.fn();
		inst.on('EVT', a, 'LAYER_A');
		inst.on('EVT', b, 'LAYER_B');
		inst.emit('EVT', null, 'LAYER_A');
		expect(a).toHaveBeenCalledTimes(1);
		expect(b).not.toHaveBeenCalled();
	});

	it('emits to multiple layers at once', () => {
		const inst = make({ ...baseConfig });
		const a = vi.fn();
		const b = vi.fn();
		inst.on('EVT', a, 'LAYER_A');
		inst.on('EVT', b, 'LAYER_B');
		inst.emit('EVT', null, ['LAYER_A', 'LAYER_B']);
		expect(a).toHaveBeenCalledTimes(1);
		expect(b).toHaveBeenCalledTimes(1);
	});

	it('wildcard listener captures all events in its layer', () => {
		const inst = make({ ...baseConfig });
		const all = vi.fn();
		inst.on('*', all);
		inst.emit('A');
		inst.emit('B');
		expect(all).toHaveBeenCalledTimes(2);
	});

	it('onList registers persistent (non-once) listeners', () => {
		const inst = make({ ...baseConfig });
		const cb = vi.fn();
		inst.onList([['E', cb]]);
		inst.emit('E');
		inst.emit('E');
		expect(cb).toHaveBeenCalledTimes(2);
	});

	it('onceList registers one-time listeners with default layer', () => {
		const inst = make({ ...baseConfig });
		const cb = vi.fn();
		inst.onceList([['E', cb]]);
		inst.emit('E');
		inst.emit('E');
		expect(cb).toHaveBeenCalledTimes(1);
	});
});

describe('emitByPrimaryOnly gate', () => {
	it('blocks emit from a non-primary tab', async () => {
		const channelName = 'ch_gate';
		// occupy primary with a different live tab so our instance is a slave
		localStorage.setItem(primaryKey(channelName), JSON.stringify({ tabId: 'other', ts: Date.now() }));

		const inst = make({ channelName, emitByPrimaryOnly: true });
		expect(inst.primary).toBe(false);

		const remote = new BroadcastChannel(channelName);
		const got = vi.fn();
		remote.onmessage = got;

		inst.emit('SHOULD_NOT_SEND');
		await tick();

		expect(got).not.toHaveBeenCalled();
		remote.close();
	});

	it('allows emit from the primary tab', async () => {
		const channelName = 'ch_gate_ok';
		const inst = make({ channelName, emitByPrimaryOnly: true });
		expect(inst.primary).toBe(true);

		const remote = new BroadcastChannel(channelName);
		const got = vi.fn();
		remote.onmessage = (e) => got(e.data);

		inst.emit('HELLO', { x: 1 });
		await tick();

		expect(got).toHaveBeenCalledTimes(1);
		expect(got.mock.calls[0][0]).toMatchObject({ type: 'HELLO', payload: { x: 1 } });
		remote.close();
	});
});

describe('incoming messages are untrusted input', () => {
	const channelName = 'ch_incoming';

	it('delivers a well-formed remote message to a registered listener', async () => {
		const inst = make({ channelName, emitByPrimaryOnly: false });
		const cb = vi.fn();
		inst.on('REMOTE', cb, 'L1');

		const remote = new BroadcastChannel(channelName);
		remote.postMessage({ type: 'REMOTE', payload: { ok: true }, layer: 'L1' });
		await tick();

		expect(cb).toHaveBeenCalledTimes(1);
		remote.close();
	});

	it('does NOT create new layers from incoming messages', async () => {
		const inst = make({ channelName, emitByPrimaryOnly: false });
		const before = inst.getLayers();

		const remote = new BroadcastChannel(channelName);
		remote.postMessage({ type: 'X', payload: 1, layer: 'attacker_layer' });
		await tick();

		expect(inst.getLayers()).toEqual(before);
		expect(inst.getLayers()).not.toContain('attacker_layer');
		remote.close();
	});

	it('ignores malformed messages without throwing', async () => {
		const inst = make({ channelName, emitByPrimaryOnly: false, disableInternalErrors: false });
		const cb = vi.fn();
		inst.on('*', cb, globalConfig.defaultConfig.layer);

		const remote = new BroadcastChannel(channelName);
		remote.postMessage({ no: 'type' });
		remote.postMessage(null);
		remote.postMessage('garbage');
		await tick();

		expect(cb).not.toHaveBeenCalled();
		remote.close();
	});
});

describe('config: disableInternalErrors', () => {
	it('can be turned off so internal errors are logged', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const inst = make({ channelName: 'ch_err', emitByPrimaryOnly: false, listenOwnChannel: true, disableInternalErrors: false });

		inst.on('BOOM', () => { throw new Error('listener blew up'); });
		inst.emit('BOOM');

		expect(spy).toHaveBeenCalled();
	});

	it('suppresses internal errors by default', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const inst = make({ channelName: 'ch_err2', emitByPrimaryOnly: false, listenOwnChannel: true });

		inst.on('BOOM', () => { throw new Error('listener blew up'); });
		inst.emit('BOOM');

		expect(spy).not.toHaveBeenCalled();
	});
});

describe('singleton & destroy', () => {
	it('returns the same instance for repeated construction', () => {
		const a = make({ channelName: 'ch_single' });
		const b = new TabsBroadcast({ channelName: 'different' });
		expect(b).toBe(a);
	});

	it('destroy() releases the primary slot and resets the singleton', async () => {
		const channelName = 'ch_destroy';
		const a = make({ channelName });
		expect(localStorage.getItem(primaryKey(channelName))).not.toBeNull();

		await a.destroy();
		expect(localStorage.getItem(primaryKey(channelName))).toBeNull();

		// a brand-new instance can now be created (singleton was cleared)
		const b = new TabsBroadcast({ channelName });
		tb = b;
		expect(b).not.toBe(a);
		expect(b.primary).toBe(true);
	});
});

describe('getEvents / getLayers', () => {
	it('aggregates listeners across layers', () => {
		const inst = make({ channelName: 'ch_events', emitByPrimaryOnly: false });
		inst.on('A', () => {});
		inst.on('B', () => {}, 'L2');
		expect(inst.getEvents()).toHaveLength(2);
		expect(inst.getLayers()).toEqual(expect.arrayContaining([globalConfig.defaultConfig.layer, 'L2']));
	});
});
