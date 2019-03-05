<p align="left">
  <img src="https://badgen.net/github/stars/rovniy/tabs-broadcast">
  <img src="https://badgen.net/badgesize/gzip/rovniy/tabs-broadcast/master/index.js">
</p>

# Tabs broadcast system.

This package allows you to communicate arbitrary data between browser tabs, as well as transfer events between them. This solution is supported in Chrome, Firefox and Opera. The exact version support can be found in [caniuse.com](https://caniuse.com/#search=BroadcastChannel) 
<hr/>

### Install
Using npm
```
npm install tabs-broadcast
```

Using yarn
```
yarn add tabs-broadcast
```

<hr/>

### Use plugin (ES6)
Return the class that you want to initialize
```javascript
import TabsBroadcast from 'tabs-broadcast'
```

<hr/>

### Methods

`.$emit( message: {String}, data: {String} )` - sends any event with arbitrary data to the browser<br/>
`.$on( message: {String}, callback: {Function} )` - listens for events within the browser<br/>
`.$once( message: {String}, callback: {Function} )` - listens for events within the browser. Deletes the subscription to the event after a call to callback<br/>
`.$off( message: {String} )` - unsubscribes from wiretapping events of the specified method<br/>

<hr/>

### Example
```javascript
// Written in a file that handles authorization 
TabsBroadcast.$emit('USER-IS-AUTH', { userData: {username: 'Ravy'}})

// It is written in the file that causes authorization
TabsBroadcast.$on('USER-IS-AUTH', (data) => {
    console.log('UserData on event', data)
})

// Will cause a colback and remove the listener. Will be executed only once
TabsBroadcast.$once('USER-IS-AUTH', (data) => {
    console.log('UserData once callback', data)
})

// Removes a listener
TabsBroadcast.$off('USER-IS-AUTH')
```
