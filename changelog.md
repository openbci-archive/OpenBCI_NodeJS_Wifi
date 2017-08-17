# 0.1.1

### New Features

* Added function called `autoFindAndConnectToWifiShield()` which will automatically search the local network for wifi shields and connect to the first one it finds.
* Add `latency` setting to default options

# 0.1.0

### Breaking Change

* Updated `localName` building for wifi v0.2.1+ where name changed to `PTW-0001-XXXX` where the last four are the last two bytes of the mac address.

# 0.0.5

### Enhancements

* Bump utilities to 0.1.2

# 0.0.4

### New Features

* Switch `getSampleRate` and `setSampleRate` to regex parseing which adds support for ganglion now.
* Started saving the wifi shields found so the user can pass a `localName` and the module will use the ip address to route to it. mDNS is too router dependent.

# 0.0.3

This actually seems to be generally working for cyton and ganglion. Daisy needs more testing.

### Enhancements

* Now working with daisy, cyton and ganglion. 
* Bumped `openbci-utilities` to v0.0.8
* Now setting the sample rate it possible checkout the example
* Module will now sync itself with the shield on `connect` which will align board type and channel gains.

# 0.0.2

The readme and package.json were horribly wrong in `v0.0.1`

# 0.0.1

Initial release
