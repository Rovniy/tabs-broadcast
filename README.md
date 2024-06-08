# Tabs broadcast system.

![License](https://badgen.net/github/license/rovniy/tabs-broadcast)
![Stars](https://badgen.net/github/stars/rovniy/tabs-broadcast)
![GitHub file size in bytes](https://img.shields.io/github/size/Rovniy/tabs-broadcast/index.js)


This package allows you to communicate arbitrary data between browser tabs, as well as transfer events between them. This solution is supported in Chrome, Firefox, and Opera. The exact version support can be found on [caniuse.com](https://caniuse.com/#search=BroadcastChannel).

<hr/>

## Installation
Using npm
```
npm install tabs-broadcast
```

Using yarn
```
yarn add tabs-broadcast
```

<hr/>

## Use library (ES6)
To use the library, import the `TabsBroadcast` class and initialize it:

```javascript
import TabsBroadcast from 'tabs-broadcast';

const instance = new TabsBroadcast()
```

<hr/>

### Methods

### `emit(message: string, data?: any): void`
Sends an event with arbitrary data to other browser tabs.

### `on(message: string, callback: (data: any) => void): void`
Registers a callback to listen for events within the browser.

### `once(message: string, callback: (data: any) => void): void`
Registers a callback to listen for events within the browser. Deletes the subscription to the event after the callback is called once.

### `off(message: string): void`
Unsubscribes from listening to events of the specified type.

<hr/>

## Examples

### Emitting Events

In a file that handles authorization:

```javascript
// Written in a file that handles authorization 
instance.emit('USER_IS_AUTH', { userData: { username: 'Ravy' }});
instance.emit('USER_LOG_OUT', 'Hello World');
instance.emit('SOME_EVENT');
```

### Listening to Events

In a file that requires authorization data:

```javascript
// It is written in the file that causes authorization
instance.on('USER_IS_AUTH', (data) => {
    console.log('UserData on event', data); // -> { userData: { username: 'Ravy' }}
});

const someCallbackFunction = payload => {
	console.log('someCallbackFunction : Payload=', payload); // -> 'Hello World'
};
instance.on('USER_LOG_OUT', someCallbackFunction);
```

### Subscribe to event by list

```javascript
// It is written in the file that causes authorization
instance.onList([
	[ 'EVENT_NUMBER_1', callbackNumberOne ],
	[ 'EVENT_NUMBER_2', callbackNumberTwo ],
	[ 'EVENT_NUMBER_3', callbackNumberThree ],
])
```

### One-Time Event Listener
Will cause the callback and remove the listener. This will be executed only once:

```javascript
instance.once('USER_IS_AUTH', (data) => {
    console.log('UserData once callback', data);
});
```

### Subscribe to One-Time event by list

```javascript
// It is written in the file that causes authorization
instance.onceList([
	[ 'EVENT_NUMBER_1', callbackNumberOne ],
	[ 'EVENT_NUMBER_2', callbackNumberTwo ],
	[ 'EVENT_NUMBER_3', callbackNumberThree ],
])
```

### Removing a Listener

Removes a listener for the specified event type:

```javascript
instance.off('USER_IS_AUTH');
```

## TypeScript Support

This library includes TypeScript type definitions. You can use the library in TypeScript projects with full type support.

```typescript
import TabsBroadcast from 'tabs-broadcast';

const instance = new TabsBroadcast();

instance.emit('USER_IS_AUTH', { userData: { username: 'Ravy' }});

instance.on('USER_IS_AUTH', (data: { userData: { username: string } }) => {
    console.log('UserData on event', data);
});

instance.once('USER_LOG_OUT', (message: string) => {
    console.log('User has logged out:', message);
});
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.