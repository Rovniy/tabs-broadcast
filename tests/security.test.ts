import { describe, it, expect, vi } from 'vitest';
import globalConfig from '../src/core/config';
import { tick, useTabsBroadcast } from './helpers';

describe('incoming messages are untrusted input', () => {
	const { make } = useTabsBroadcast();
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
