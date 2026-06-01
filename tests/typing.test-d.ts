/**
 * Type-level tests for the typed-events generic. Not executed by the runtime test suite
 * (it is not a *.test.ts file); checked by `npm run test:types` via tsc.
 */
import TabsBroadcast from '../src/index';

type Events = {
	login: { userId: string };
	logout: null;
	count: number;
};

const bus = new TabsBroadcast<Events>();

// on(): payload is narrowed to the event's type
bus.on('login', (e) => {
	const id: string = e.payload.userId;
	void id;
});

// once(): same narrowing
bus.once('count', (e) => {
	const n: number = e.payload;
	void n;
});

// emit(): payload type is enforced
bus.emit('login', { userId: '42' });
bus.emit('count', 5);

// wildcard listener receives the union of payloads
bus.on('*', (e) => {
	void e.payload;
});

// @ts-expect-error - unknown event name in on()
bus.on('unknown', () => {});

// @ts-expect-error - wrong payload type in emit()
bus.emit('count', 'not-a-number');

// @ts-expect-error - unknown event name in emit()
bus.emit('nope', 1);

// Untyped usage stays permissive (no generic argument)
const loose = new TabsBroadcast();
loose.on('anything', (e) => void e.payload);
loose.emit('anything', { whatever: true });
loose.emit('noPayloadOk');
