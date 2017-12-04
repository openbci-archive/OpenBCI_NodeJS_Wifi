# v0.4.1

### Bug Fixes

* DELETE, GET, and POST would resolve even if code was not equal to 200

# v0.4.0

### New Features

* Add UDP support! New option on connect and Constructor called `protocol` that can be either `'udp'` or `'tcp'` (Default is `tcp`)
* Add burst mode UDP support! New option on connect and Constructor called `burst` that can be either `true` or `false` (default `false`). When `true` and `protocol` option is UDP, will tell WiFi Shield to send every packet three times. The module will automatically only process new data.
* Went through all the docs again and cleaned up!

### New Example

* WiFi direct example!

### Bug Fixes

* Now starting both UDP and TCP systems incase so user can select at `connect` function.

# v0.3.1

### New Features

* Add UDP support.

# v0.3.0

Docs for all!!

### New Files

* `CODE_OF_CONDUCT.md` added to govern community
* `CONTRIBUTING.md` added to describe how people should contribute
* `ROADMAP.md` added to outline a roadmap for project

### Bug Fixes

* Bump utilities to 0.2.7 to get patch for wifi accel data and stop byte

### Breaking Changes

* Removed index.js to conform to other cyton and ganglion modules

# v0.2.1

### Bug Fixes

* Bumping utility version to 0.2.4 fixes bug in this repo too for ganglion over wifi with no scale.

# 0.2.0

### Breaking changes

* Update `autoFindAndConnectToWifiShield()` to be called `searchToStream` and upgraded it's power! Checkout the source code for how to use the function.

### New Features

* Added function for telling the WiFi Shield to forget it's credentials and turn back into an access point, aka broad casting it's unique name ready for someone to connect and have it join another network.

# 0.1.4

### Enhancements

* Bump `openbci-utilities` to v0.2.0 for accelDataCounts support on cyton.

# 0.1.3

### New Features

* Add `channelSet` function

# 0.1.2

### New Features

* Add `sdStart`, `sdStop`, and `syncRegisterSettings`

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
