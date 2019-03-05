<p align="left">
  <img src="https://badgen.net/github/stars/rovniy/tabs-broadcast">
  <img src="https://badgen.net/badgesize/gzip/rovniy/tabs-broadcast/master/index.js">
</p>

# Tabs broadcast system.

This package allows you to communicate arbitrary data between browser tabs, as well as transfer events between them
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
```javascript
import TabsBroadcast from 'tabs-broadcast'
```

Return the class that you want to initialize

```javascript
const tabsBroadcast = new TabsBroadcast()
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
