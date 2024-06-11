## 3.1.0

- Improved TypeScript Definitions: Enhanced type definitions for event handling, ensuring proper typing for `event.detail`.
- Singleton Pattern: Ensured `TabsBroadcast` maintains a single instance across the application.
- Code Optimization: Refactored and optimized the `TabsBroadcast` and `TabsWorker` classes, adding detailed comments and documentation for better understanding and maintenance.
- Event Handling Enhancements: Improved the event listener setup for primary status changes.
- Primary-Slave Management: Added robust handling for designating and transferring primary tab status.
- Detailed Documentation: Provided comprehensive documentation in the `readme.md` for better clarity on usage, installation, and examples.
- Demo URL: Added a demo URL (http://tabs-broadcast.ravy.pro) for users to see the library in action.
- Sponsorship Information: Added information on how to support the library development with a TRC20 wallet address.

## 3.0.3

- Update homepage to https://ravy.pro

## 3.0.2

- [fix] Update README.md for support LIST subscribes. Again
- Update jsDocs

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

