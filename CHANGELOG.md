## [3.2.3] - 04/28/2025

### Added
- **TypeScript Support**: Added comprehensive type definitions via `index.d.ts` for full type safety and IDE autocompletion.
- **Wildcard Listeners (`*`)**: Now you can listen to all events in a specific layer by using the `*` wildcard in the `on` method.
- **Emit to Multiple Layers**: The `emit` method now allows targeting multiple layers at once by passing an array of layer names.
- **Plugin System**: Introduced a `use` method to register plugins and extend the functionality of TabsBroadcast.
- **Destroy Delay**: The `destroy` method now supports an optional delay parameter, allowing deferred cleanup.

### Changed
- Enhanced the `on`, `off`, and `once` methods to support event handling within specific layers.
- The `isPrimary` method is now **deprecated**. Use the `primary` property for checking primary tab status.

### Fixed
- Minor bug fixes and optimizations for inter-tab communication stability.

### Documentation

- Add additional demo functionality

## [3.2.2] - 04/25/2025

- Fix pack issue

## [3.2.1]

- Vite version change to ^6.3.3
- Update readme

## [3.2.0]

### Layer Support
Added the concept of layers to enhance event handling. Events can now be grouped and isolated by layers, allowing for better separation and control in applications with micro-frontends or multiple components.

- Usage: Specify a layer when emitting or registering an event (on, once, emit). Events will trigger only within their designated layer.
- Performance Optimization: Using layers reduces memory usage and iteration counts in large-scale applications.

### Primary-Slave Tab Management:
- Improved to ensure consistent behavior across multiple tabs.
- Primary tab status is now accessible directly as a static property (primary) for easier checking without a separate method call.

### TypeScript Enhancements:
- Added more precise type definitions, improving integration with TypeScript projects.
- New TypeScript support provides better editor auto-completion and error detection, facilitating a smoother development experience.

### Updated Methods
- Extended on, once, onList, onceList, off, and emit: Each method now includes an optional layer parameter to designate event isolation by layer. This allows users to assign and listen to events in separate layers within the same application context.

### Config Updates
- Refined Configuration Options: channelName, listenOwnChannel, and emitByPrimaryOnly are now fully compatible with the new layer functionality, allowing multiple isolated instances in micro-frontend environments by simply setting the desired channelName.

### Improved Documentation

- Updated README to include comprehensive examples for all methods, configuration, and layer-based usage.
- Enhanced explanations on the benefits and use cases of the Primary-Slave model, including examples of how layers can be used to optimize communication across micro-frontends.

### Bug Fixes
- Context Preservation in Event Listeners: Fixed an issue where certain private methods were not correctly bound, causing errors in some browsers. All event listeners now maintain the correct class context.
- Improved Memory Management: Addressed a memory leak by ensuring BroadcastChannel instances are properly destroyed when calling destroy().

This version represents a major upgrade with layer-based event handling and improved Primary-Slave management. We recommend upgrading to leverage these new features, especially for applications with complex inter-tab communication or multi-frontend architectures.

## [3.1.10]

- Switch beforeunload to pagehide event

## [3.1.9]

- Change Github actions

## [3.1.8]

- Update Github workflow for auto-update docs

## [3.1.7]

- Remove primary tab key from localStorage on onBeforeUnload event

## [3.1.6]

- Fix document.readyState event. Now support SSR mode

## [3.1.5]

- Change http -> https in docs.
- Fix JS paths
- Add index.d.ts additional types

## [3.1.4]

- Update readme.md. 
- Add min lib files

## [3.1.3]

- Remove `package-lock.json` from repo

## [3.1.2]

- Bug fixes

## [3.1.1]

- Update docs
- Rename props

## [3.1.0]

- Improved TypeScript Definitions: Enhanced type definitions for event handling, ensuring proper typing for `event.detail`.
- Singleton Pattern: Ensured `TabsBroadcast` maintains a single instance across the application.
- Code Optimization: Refactored and optimized the `TabsBroadcast` and `TabsWorker` classes, adding detailed comments and documentation for better understanding and maintenance.
- Event Handling Enhancements: Improved the event listener setup for primary status changes.
- Primary-Slave Management: Added robust handling for designating and transferring primary tab status.
- Detailed Documentation: Provided comprehensive documentation in the `readme.md` for better clarity on usage, installation, and examples.
- Demo URL: Added a demo URL (http://tabs-broadcast.ravy.pro) for users to see the library in action.
- Sponsorship Information: Added information on how to support the library development with a TRC20 wallet address.

## [3.0.3]

- Update homepage to https://ravy.pro

## [3.0.2]

- [fix] Update README.md for support LIST subscribes. Again
- Update jsDocs

## [3.0.1]

- [fix] Update README.md for support LIST subscribes

## [3.0.0]

- `TabsBroadcast` is now a constructor instead of a class instance.
- Added a new method `destroy` for closing opened broadcast channels.
- Added the `onList` method for quickly subscribing to multiple events.
- Added the `onceList` method for quickly subscribing to multiple one-time events.
- Arguments for `TabsBroadcast` now have default values.
- Added a property `channelName` for customizing channel names. Now you can have multiple parallel channels.
- Added a property `listenOwnChannel` to enable listening to the own channel from which the event was sent.
- Tests have been added to enhance the stability of the library.

