import TabsBroadcast from '../index.js';

describe('TabsBroadcast', () => {
	let tabsBroadcast;
	let originalEnv;
	let consoleErrorMock;

	beforeAll(() => {
		originalEnv = process.env.NODE_ENV;
	});

	beforeEach(() => {
		process.env.NODE_ENV = 'development';
		tabsBroadcast = new TabsBroadcast();
		consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		tabsBroadcast.off('test-event');
		consoleErrorMock.mockRestore();
		process.env.NODE_ENV = originalEnv;
	});

	test('should register and trigger an event callback', () => {
		const callback = jest.fn();
		tabsBroadcast.on('test-event', callback);

		tabsBroadcast.emit('test-event', { data: 'test' });

		expect(callback).toHaveBeenCalledWith({ data: 'test' });
	});

	test('should register and trigger multiple event callbacks', () => {
		const callback1 = jest.fn();
		const callback2 = jest.fn();
		tabsBroadcast.on('test-event', callback1);
		tabsBroadcast.on('test-event', callback2);

		tabsBroadcast.emit('test-event', { data: 'test' });

		expect(callback1).toHaveBeenCalledWith({ data: 'test' });
		expect(callback2).toHaveBeenCalledWith({ data: 'test' });
	});

	test('should call console.error on message error in development mode', () => {
		const error = new Error('Test error');
		tabsBroadcast.instance.onmessageerror(error);

		expect(consoleErrorMock).toHaveBeenCalledWith('Tabs broadcast : BroadcastChannel : Can\'t parse message', error);
	});

	test('should not call console.error on message error in production mode', () => {
		process.env.NODE_ENV = 'production';
		const error = new Error('Test error');
		tabsBroadcast.instance.onmessageerror(error);

		expect(consoleErrorMock).not.toHaveBeenCalled();
	});

	test('should trigger once callback only once', () => {
		const callback = jest.fn();
		tabsBroadcast.once('test-event', callback);

		tabsBroadcast.emit('test-event', { data: 'test' });
		tabsBroadcast.emit('test-event', { data: 'test' });

		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('should remove callbacks for a specific type', () => {
		const callback = jest.fn();
		tabsBroadcast.on('test-event', callback);

		tabsBroadcast.off('test-event');
		tabsBroadcast.emit('test-event', { data: 'test' });

		expect(callback).not.toHaveBeenCalled();
	});

	test('should register and trigger multiple event callbacks from list', () => {
		const callback1 = jest.fn();
		const callback2 = jest.fn();
		tabsBroadcast.onList([['test-event1', callback1], ['test-event2', callback2]]);

		tabsBroadcast.emit('test-event1', { data: 'test1' });
		tabsBroadcast.emit('test-event2', { data: 'test2' });

		expect(callback1).toHaveBeenCalledWith({ data: 'test1' });
		expect(callback2).toHaveBeenCalledWith({ data: 'test2' });
	});

	test('should register and trigger once callbacks from list only once', () => {
		const callback1 = jest.fn();
		const callback2 = jest.fn();
		tabsBroadcast.onceList([['test-event1', callback1], ['test-event2', callback2]]);

		tabsBroadcast.emit('test-event1', { data: 'test1' });
		tabsBroadcast.emit('test-event1', { data: 'test1' });
		tabsBroadcast.emit('test-event2', { data: 'test2' });
		tabsBroadcast.emit('test-event2', { data: 'test2' });

		expect(callback1).toHaveBeenCalledTimes(1);
		expect(callback2).toHaveBeenCalledTimes(1);
	});

	test('should close the BroadcastChannel when destroy is called', () => {
		const closeMock = jest.spyOn(tabsBroadcast.instance, 'close');
		tabsBroadcast.destroy();

		expect(closeMock).toHaveBeenCalled();
		closeMock.mockRestore();
	});
});
