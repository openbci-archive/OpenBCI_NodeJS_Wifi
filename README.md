[![Build Status](https://travis-ci.org/OpenBCI/OpenBCI_NodeJS_Wifi.svg?branch=master)](https://travis-ci.org/OpenBCI/OpenBCI_NodeJS_Wifi)
[![codecov](https://codecov.io/gh/OpenBCI/OpenBCI_NodeJS_Wifi/branch/master/graph/badge.svg)](https://codecov.io/gh/OpenBCI/OpenBCI_NodeJS_Wifi)
[![Dependency Status](https://david-dm.org/OpenBCI/OpenBCI_NodeJS_Wifi.svg)](https://david-dm.org/OpenBCI/OpenBCI_NodeJS_Wifi)
[![npm](https://img.shields.io/npm/dm/openbci-wifi.svg?maxAge=2592000)](http://npmjs.com/package/openbci-wifi)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

# OpenBCI Node.js Wifi

A Node.js module for OpenBCI ~ written with love by [Push The World!](http://www.pushtheworldllc.com)

Push The World is actively developing and maintaining this module.

The purpose of this module is to supply an npm module with no native modules that interfaces with the OpenBCI Wifi Shield.

### Table of Contents:
---

1. [Installation](#install)
2. [TL;DR](#tldr)
3. [Cyton (32bit Board)](#cyton)
  1. [About](#about)
  2. [General Overview](#general-overview)
  3. [SDK Reference Guide](#sdk-reference-guide)
    * [Constructor](#constructor)
    * [Methods](#method)
    * [Events](#event)
    * [Constants](#constants)
4. [Developing](#developing)
5. [Testing](#developing-testing)
6. [Contribute](#contribute)
7. [License](#license)


### <a name="install"></a> Installation:
```
npm install openbci-wifi
```

### <a name="tldr"></a> TL;DR:
Get connected and [start streaming right now with the example code](examples/getStreaming/getStreaming.js).

#### Wifi
```ecmascript 6
const Wifi = require('openbci-wifi');
let wifi = new Wifi({
  debug: false,
  verbose: true,
  latency: 10000
});

wifi.on(k.OBCIEmitterSample, (sample) => {
  for (let i = 0; i < wifi.getNumberOfChannels(); i++) {
    console.log("Channel " + (i + 1) + ": " + sample.channelData[i].toFixed(8) + " Volts.");
     // prints to the console
     //  "Channel 1: 0.00001987 Volts."
     //  "Channel 2: 0.00002255 Volts."
     //  ...
     //  "Channel 8: -0.00001875 Volts."
  }
});

wifi.searchToStream({
    sampleRate: 1000 // Custom sample rate
    shieldName: 'OpenBCI-2C34', // Enter the unique name for your wifi shield
    streamStart: true // Call to start streaming in this function
  }).catch(console.log);
```

# <a name="wifi"></a> Wifi

Initialization
--------------

Initializing the board:

```js
const Wifi = require('openbci-wifi');
const ourBoard = new Wifi();
```
Go [checkout out the get streaming example](examples/getStreaming/getStreaming.js)!

For initializing with options, such as verbose print outs:

```js
const Wifi = require('openbci-wifi');
const ourBoard = new Cyton({
  verbose: true
});
```

or if you are using ES6:
```js
import Wifi from 'openbci-wifi';
import { Constants } from 'openbci-utilities';
const ourBoard = new Cyton();
ourBoard.connect(Constants.OBCISimulatorPortName);
```

To debug, it's amazing, do:
```js
const Cyton = require('openbci-cyton');
const ourBoard = new Cyton({
    debug: true
});
```

Sample properties:
------------------
* `startByte` (`Number` should be `0xA0`)
* `sampleNumber` (a `Number` between 0-255)
* `channelData` (channel data indexed at 0 filled with floating point `Numbers` in Volts) if `sendCounts` is false
* `channelDataCounts` (channel data indexed at 0 filled with floating point `Numbers` in Volts) if `sendCounts` is true
* `accelData` (`Array` with X, Y, Z accelerometer values when new data available) if `sendCounts` is false
* `accelDataCounts` (`Array` with X, Y, Z accelerometer values when new data available) Only present if `sendCounts` is true
* `auxData` (`Buffer` filled with either 2 bytes (if time synced) or 6 bytes (not time synced))
* `stopByte` (`Number` should be `0xCx` where x is 0-15 in hex)
* `boardTime` (`Number` the raw board time)
* `timeStamp` (`Number` the `boardTime` plus the NTP calculated offset)

The power of this module is in using the sample emitter, to be provided with samples to do with as you wish.

To get a ['sample'](#event-sample) event, you need to:
-------------------------------------
1. Call [`.searchToStream(serialPortName)`](#method-connect)
2. Install the ['ready'](#event-ready) event emitter on resolved promise
3. In callback for ['ready'](#event-ready) emitter, call [`streamStart()`](#method-stream-start)
4. Install the ['sample'](#event-sample) event emitter
```js
const Cyton = require('openbci-cyton');
const ourBoard = new Cyton();
ourBoard.connect(portName).then(function() {
    ourBoard.on('ready',function() {
        ourBoard.streamStart();
        ourBoard.on('sample',function(sample) {
            /** Work with sample */
        });
    });
}).catch(function(err) {
    /** Handle connection errors */
});
```
Close the connection with [`.streamStop()`](#method-stream-stop) and disconnect with [`.disconnect()`](#method-disconnect)
```js
const Cyton = require('openbci-cyton');
const ourBoard = new Cyton();
ourBoard.streamStop().then(ourBoard.disconnect());
```

## <a name="developing"></a> Developing:
### <a name="developing-running"></a> Running:

```
npm install
```

### <a name="developing-testing"></a> Testing:

```
npm test
```

## <a name="contribute"></a> Contribute:

1. Fork it!
2. Branch off of `development`: `git checkout development`
2. Create your feature branch: `git checkout -b my-new-feature`
3. Make changes
4. If adding a feature, please add test coverage.
5. Ensure tests all pass. (`npm test`)
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin my-new-feature`
8. Submit a pull request. Make sure it is based off of the `development` branch when submitting! :D

## <a name="license"></a> License:

MIT
