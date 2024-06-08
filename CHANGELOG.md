## 3.0.1

- [fix] Update README.md for support LIST subscribes

## 3.0.0

- `TabsBroadcast` is now a constructor instead of a class instance.
- Added a new method `destroy` for closing opened broadcast channels.
- Added the `onList` method for quickly subscribing to multiple events.
- Added the `onceList` method for quickly subscribing to multiple one-time events.
- Arguments for `TabsBroadcast` now have default values.
- Added a property `channelName` for customizing channel names. Now you can have multiple parallel channels.
- Added a property `listenOwnChannel` to enable listening to the own channel from which the event was sent.
- Tests have been added to enhance the stability of the library.

