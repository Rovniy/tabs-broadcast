# Tabs broadcast system.

<p align="center">
  <img src="https://badgen.net/npm/v/vue-tabs-broadcast">
  <img src="https://badgen.net/npm/license/vue-tabs-broadcast">
  <img src="https://badgen.net/badgesize/gzip/https://github.com/Rovniy/vue-tabs-broadcast/blob/master/index.js">
</p>



## This package allows you to communicate arbitrary data between browser tabs, as well as transfer events between them

### Install
Using npm
```
npm install tabs-broadcast
```

Using yarn
```
yarn add tabs-broadcast
```

### Use plugin (ES6)
```
import TabsBroadcast from 'tabs-broadcast'
```

Return the class that you want to initialize

```
const tabsBroadcast = new TabsBroadcast()
```

### Methods

```.$emit( message: {String}, data: {String})``` - sends any event with arbitrary data to the browser<br/>
```.$on(message: {String}, callback: {Function})``` - listens for events within the browser<br/>
```.$once(message: {String}, callback: {Function})``` - listens for events within the browser. Deletes the subscription to the event after a call to callback<br/>
```.$off(message: {String})``` - unsubscribes from wiretapping events of the specified method<br/>

### Example
```
// Written in a file that handles authorization 
tabsBroadcast.$emit('USER-IS-AUTH', { userData: {username: 'Ravy'}})

// It is written in the file that causes authorization
tabsBroadcast.$on('USER-IS-AUTH', (data) => {
    console.log('UserData on event', data)
})

// Will cause a colback and remove the listener. Will be executed only once
tabsBroadcast.$once('USER-IS-AUTH', (data) => {
    console.log('UserData once callback', data)
})

// Removes a listener
tabsBroadcast.$off('USER-IS-AUTH')
```
