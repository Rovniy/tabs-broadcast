import { describe, it, expect, vi } from 'vitest';
import { primaryKey, tick, useTabsBroadcast } from './helpers';

describe('emitByPrimaryOnly gate', () => {
	const { make } = useTabsBroadcast();

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
