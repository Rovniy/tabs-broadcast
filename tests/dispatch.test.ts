import { describe, it, expect, vi } from 'vitest';
import globalConfig from '../src/core/config';
import { useTabsBroadcast } from './helpers';

// emitByPrimaryOnly:false + listenOwnChannel:true lets a single instance emit and receive
// its own events, exercising the dispatch/layer/wildcard logic without a second tab.
describe('local dispatch: on / once / off / layers / wildcard', () => {
	const { make } = useTabsBroadcast();
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

	it('deleteLayer removes a layer and its listeners', () => {
		const inst = make({ ...baseConfig });
		inst.on('E', () => {}, 'DROP_ME');
		expect(inst.getLayers()).toContain('DROP_ME');
		inst.deleteLayer('DROP_ME');
		expect(inst.getLayers()).not.toContain('DROP_ME');
	});
});
