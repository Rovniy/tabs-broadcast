import { describe, it, expect } from 'vitest';
import TabsBroadcast from '../src/index';
import globalConfig from '../src/core/config';
import { primaryKey, useTabsBroadcast } from './helpers';

describe('singleton & destroy', () => {
	const { make, track } = useTabsBroadcast();

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
		const b = track(new TabsBroadcast({ channelName }));
		expect(b).not.toBe(a);
		expect(b.primary).toBe(true);
	});
});

describe('getEvents / getLayers', () => {
	const { make } = useTabsBroadcast();

	it('aggregates listeners across layers', () => {
		const inst = make({ channelName: 'ch_events', emitByPrimaryOnly: false });
		inst.on('A', () => {});
		inst.on('B', () => {}, 'L2');
		expect(inst.getEvents()).toHaveLength(2);
		expect(inst.getLayers()).toEqual(expect.arrayContaining([globalConfig.defaultConfig.layer, 'L2']));
	});
});
