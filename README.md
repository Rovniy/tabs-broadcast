# TabsBroadcast

![License](https://badgen.net/github/license/rovniy/tabs-broadcast)
![Stars](https://badgen.net/github/stars/rovniy/tabs-broadcast)
![GitHub file size in bytes](https://img.shields.io/github/size/Rovniy/tabs-broadcast/index.js)
![Latest tag](https://badgen.net/github/tag/Rovniy/tabs-broadcast)
![Repo depends](https://badgen.net/github/dependents-repo/Rovniy/tabs-broadcast)
![Pckg depends](https://badgen.net/github/dependents-pkg/Rovniy/tabs-broadcast)
![Last commits](https://badgen.net/github/last-commit/Rovniy/tabs-broadcast)

TabsBroadcast is a library for managing inter-tab communication via the BroadcastChannel API. It implements a singleton pattern to ensure a single instance and allows for registering, emitting, and handling various types of events across different browser tabs. The library also manages primary and slave tabs, ensuring that only one tab is designated as the primary tab, which can perform certain tasks exclusively.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


## Author

- Andrei (Ravy) Rovnyi
- [contact@ravy.pro](contact@ravy.pro)

## Features

- Singleton pattern to ensure a single instance.
- Inter-tab communication using the BroadcastChannel API.
- Primary-Slave tab management.
- Event registration and handling.
- Emit messages to all tabs or only from the primary tab.
- Configurable settings.

## Demo

You can access the live demo at the following URL:

[TabsBroadcast Demo](http://tabs-broadcast.ravy.pro)

## Installation

You can install the library using [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/ru/), [yarn](https://yarnpkg.com/) or [bun](https://bun.sh/):

```
npm install tabs-broadcast
```
or
```
pnpm install tabs-broadcast
```
or
```
yarn add tabs-broadcast
```
or
```
bun install tabs-broadcast
```

## Usage
To use the library, import the `TabsBroadcast` class and initialize it:

### Importing the Library
```javascript
import TabsBroadcast from 'tabs-broadcast';
```

### Creating an Instance
```javascript
const tabsBroadcast = new TabsBroadcast({
    channelName: 'myChannel',
    listenOwnChannel: true,
    onBecomePrimary: (detail) => console.log('Became primary tab:', detail),
    emitByPrimaryOnly: true
});
```
### Config Options
- `channelName`: The name of the BroadcastChannel. Using for multiple instance per site.
- `listenOwnChannel`: Whether the tab should listen to its own emitted messages.
- `onBecomePrimary`: Callback function when the tab becomes the primary tab.
- `emitByPrimaryOnly`: Whether only the primary tab can emit messages.

### Methods

### `on(message: string, callback: (data: any) => void): void`
Register a callback to be executed whenever a message of the specified type is received.
```javascript
tabsBroadcast.on('eventType', (data) => {
    console.log('Event received:', data);
});
```

<hr>

### `onList(list: Array<[string, Function]>): void`
Register multiple callbacks to be executed whenever messages of specified types are received.
```javascript
tabsBroadcast.onList([
    ['eventType1', (data) => console.log('Event 1 received:', data)],
    ['eventType2', (data) => console.log('Event 2 received:', data)],
    ['eventType3', (data) => console.log('Event 3 received:', data)]
]);
```

<hr>

### `once(message: string, callback: (data: any) => void): void`
Register a callback to be executed only once when a message of the specified type is received.
```javascript
tabsBroadcast.once('eventType', (data) => {
    console.log('One-time event received:', data);
});
```

<hr>

### `onceList(list: Array<[string, Function]>): void`
Register multiple callbacks to be executed one-time when messages of specified types are received.
```javascript
tabsBroadcast.onceList([
    ['eventType1', (data) => console.log('One-time event 1 received:', data)],
    ['eventType2', (data) => console.log('One-time event 2 received:', data)],
    ['eventType3', (data) => console.log('One-time event 3 received:', data)],
]);
```

<hr>

### `off(message: string): void`
Unregister all callbacks of the specified type.
```javascript
tabsBroadcast.off('eventType');
```

<hr>

### `emit(message: string, data?: any): void`
Emit a message to all listening tabs with the specified type and payload.
```javascript
tabsBroadcast.emit('eventType', { key: 'value' });
tabsBroadcast.emit('eventType', 'Hello World');
tabsBroadcast.emit('eventType');
```

<hr>

### `isPrimary(): boolean`
Check if the current tab is the primary tab.
```javascript
if (tabsBroadcast.isPrimary()) {
    console.log('This is the primary tab.');
}
```

<hr>

### `setConfig(config: TDefaultConfig): void`
Set custom configuration properties.
```javascript
tabsBroadcast.setConfig({
    channelName: 'newChannelName',
    listenOwnChannel: false,
    onBecomePrimary: (detail) => console.log('New primary tab:', detail),
    emitByPrimaryOnly: true
});
```

<hr>

### `destroy(): void`
Destroy the BroadcastChannel. Messages will no longer be received.
```javascript
tabsBroadcast.destroy();
```

<hr>

### `getEvents() : TCallbackItem[]`
Receive a copy of the registered events list.
```javascript
const events = tabsBroadcast.getEvents();
console.log('Registered events:', events);
```

<hr>

### Primary-Slave Tab Management

The library ensures that one tab is marked as the primary tab and others as slave tabs. When the primary tab is closed, another tab is promoted to the primary status.

#### Example Usage

```javascript
window.addEventListener('load', () => {
    const tabsBroadcast = new TabsBroadcast({
        onBecomePrimary: (detail) => console.log('This tab became the primary tab:', detail),
    });

    tabsBroadcast.on('customEvent', (data) => {
        console.log('Received custom event:', data);
    });

    if (tabsBroadcast.isPrimary()) {
        tabsBroadcast.emit('customEvent', { message: 'Hello from the primary tab!' });
    }
});

window.addEventListener('beforeunload', () => {
    tabsBroadcast.destroy();
});
```
This example demonstrates how to create an instance of TabsBroadcast, register an event listener for a custom event, emit an event only from the primary tab, and handle the tab's unload event to destroy the BroadcastChannel.

### Why Do I Need Primary-Slave Tab Management?

In modern web applications, users often open multiple tabs of the same application. Managing the state and interaction between these tabs efficiently is crucial. Primary-Slave Tab Management addresses several key challenges:

1. `Avoiding Conflicts`: When multiple tabs attempt to perform the same actions (e.g., synchronizing data with the server), it can lead to conflicts and errors. Primary-Slave Tab Management designates one tab as the primary tab, responsible for executing such critical tasks, while the other tabs (slaves) perform auxiliary functions.
2. `Resource Optimization`: Performing tasks (like background data synchronization or periodic updates) only in one tab reduces the load on the browser and server, significantly improving performance and lowering resource consumption.
3. `Centralized State Management`: The primary tab can manage the shared state of the application and coordinate actions across all tabs. This ensures data consistency and predictable application behavior.

### What Problems Can Primary-Slave Tab Management Solve?

1. `Data Synchronization`: The primary tab can perform periodic data synchronization with the server and distribute updates to other tabs, ensuring data is up-to-date across all tabs.
2. `User Session Management`: The primary tab can monitor user activity and manage sessions (e.g., automatic logout on inactivity), enhancing security and user experience.
3. `Notifications and Alerts`: The primary tab can centrally handle notifications and alerts, preventing the user from receiving duplicate notifications in every tab.
4. `Load Distribution`: In scenarios involving resource-intensive operations (e.g., processing large data sets), the primary tab can distribute tasks among other tabs, optimizing overall application performance.

Primary-Slave Tab Management is an effective way to improve performance, manage state, and enhance the reliability of web applications operating with multiple tabs.

## TypeScript Support


This library fully supports TypeScript, providing type definitions for seamless integration with TypeScript projects. TypeScript users can leverage static typing to catch errors early in the development process and benefit from improved code editor support, including auto-completion and type checking.

## Sponsorship and Support

If you have found this library useful and would like to support its continued development and maintenance, you can make a donation to the following TRC20 wallet address:

```text
TFWHdvkHs78jrANbyYfAy6JaXVVfKQiwjv
```

Your donation will directly contribute to improving functionality, bug fixes, and ensuring long-term support for this library. Thank you for your support!
<hr>

![Ravy.pro](https://badgen.net/static/XPLOIT/RAVY/fa4c28)
