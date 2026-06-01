import { describe, it, expect, vi } from 'vitest';
import { useTabsBroadcast } from './helpers';

describe('config: disableInternalErrors', () => {
	const { make } = useTabsBroadcast();

	it('can be turned off so internal errors are logged', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const inst = make({
			channelName: 'ch_err',
			emitByPrimaryOnly: false,
			listenOwnChannel: true,
			disableInternalErrors: false,
		});

		inst.on('BOOM', () => {
			throw new Error('listener blew up');
		});
		inst.emit('BOOM');

		expect(spy).toHaveBeenCalled();
	});

	it('suppresses internal errors by default', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const inst = make({ channelName: 'ch_err2', emitByPrimaryOnly: false, listenOwnChannel: true });

		inst.on('BOOM', () => {
			throw new Error('listener blew up');
		});
		inst.emit('BOOM');

		expect(spy).not.toHaveBeenCalled();
	});
});

describe('config: defaults', () => {
	const { make } = useTabsBroadcast();

	it('defaults to emitByPrimaryOnly and no self-listening', () => {
		const channelName = 'ch_defaults';
		const inst = make({ channelName });

		// listenOwnChannel defaults to false: a primary tab emitting does not hit its own listener.
		const cb = vi.fn();
		inst.on('SELF', cb);
		inst.emit('SELF');
		expect(cb).not.toHaveBeenCalled();
	});
});
