# OpenBCI WiFi Shield NodeJS SDK

<p align="center">
  <img alt="banner" src="/images/WiFi_front_product.jpg/" width="600">
</p>
<p align="center" href="">
  Make programming with OpenBCI reliable, easy, research grade and fun!
</p>

[![codecov](https://codecov.io/gh/OpenBCI/OpenBCI_NodeJS_Wifi/branch/master/graph/badge.svg)](https://codecov.io/gh/OpenBCI/OpenBCI_NodeJS_Wifi)
[![Dependency Status](https://david-dm.org/OpenBCI/OpenBCI_NodeJS_Wifi.svg)](https://david-dm.org/OpenBCI/OpenBCI_NodeJS_Wifi)
[![npm](https://img.shields.io/npm/dm/openbci-wifi.svg?maxAge=2592000)](http://npmjs.com/package/openbci-wifi)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

## Welcome!

First and foremost, Welcome! :tada: Willkommen! :confetti_ball: Bienvenue! :balloon::balloon::balloon:

Thank you for visiting the OpenBCI WiFi Shield NodeJS SDK repository.

This document (the README file) is a hub to give you some information about the project. Jump straight to one of the sections below, or just scroll down to find out more.

* [What are we doing? (And why?)](#what-are-we-doing)
* [Who are we?](#who-are-we)
* [What do we need?](#what-do-we-need)
* [How can you get involved?](#get-involved)
* [Get in touch](#contact-us)
* [Find out more](#find-out-more)
* [Understand the jargon](#glossary)

## What are we doing?

### The problem

* Users continuously struggle to get prerequisites properly installed to get current OpenBCI Cyton and Ganglion, hours/days/weeks are wasted just _trying to get the data_.
* Bluetooth requires you to stay close to your computer, if you go to far, data is lost and the experiment is over.
* Bluetooth is too slow for transmitting research grade EEG, researchers want 1000Hz (samples per second), bluetooth with 8 channels is limted to 250Hz and with 16 channels limited to 125Hz.
* Bluetooth is unreliable when many other Bluetooth devices are around, demo device or use in busy real life experiment is not reliable. (think grand central station at rush hour)
* Bluetooth requires data to be sent to desktops in raw or compressed form, must use other node modules to parse complex byte streams, prevents from running in browser.
* OpenBCI Cyton (8 and 16 channel) with Bluetooth cannot go to any mobile device because of required Bluetooth-to-USB "Dongle". Must use USB port on Desktop/Laptop computers.
* Bluetooth on Ganglion requires low level drivers to use computers bluetooth hardware.
* The OpenBCI Cyton and Ganglion must transmit data to another computer over Bluetooth before going to the cloud for storage or analytics
* OpenBCI Cyton Dongle FTDI virtual comm port drivers have high latency by default which limits the rate at which new data is made available to your application to twice a second when it should get data as close to 250 times a second.
* Using Cyton or Ganglion NodeJS drivers requires the use of [_native C++ modules_](https://nodejs.org/api/addons.html) which continuously confuse developers of all levels.

So, if even the very best developers integrate the current easy to use Cyton and Ganglion NodeJS drivers, they are still burdened by the limitations of the physical hardware on the OpenBCI system.

### The solution

The OpenBCI WiFi Shield NodeJS SDK will:

* Find, connect, sync, and configure (e.g. set sample rate) with OpenBCI WiFi Shield and Carrier board (Ganglion or Cyton or Cyton with Daisy) in a single function call
* Use TCP over WiFi to prevent packet loss
* Relies on **zero** [_native C++ modules_](https://nodejs.org/api/addons.html)
* Enable streaming of high speed (samples rates over 100Hz), low latency (by default, send data every 10ms), research grade EEG (no lost data) directly to any internet connected device (i.e. iPhone, Android, macOS, Windows, Linux, Raspberry Pi 3)
* With WiFi Shield you can now use OpenBCI Ganglion and Cyton anywhere you have a good enough WiFi signal.
* Hotspots create a stable wireless transmission system even in crowded areas

Using WiFi physically solves limitations with the current state-of-the-art open source bio sensor. The goal for the WiFi Shield firmware was to create a [_one up_](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&cad=rja&uact=8&ved=0ahUKEwjF7pax67PWAhUH6oMKHdfJAcgQFggoMAA&url=https%3A%2F%2Fwww.electroimpact.com%2FWhitePapers%2F2008-01-2297.pdf&usg=AFQjCNHSyVXxRNtkFrmPiRqM5WqHWdO9-g) data pipeline, where scientific data in JSON is sent instead of raw/compressed ADC counts (yuk!) to ***make programming with OpenBCI reliable, easy, research grade and fun!***

## Who are we?

The founder of the OpenBCI WiFi Shield NodeJS SDK is [AJ Keller][link_aj_keller]. There's more information about him (and some pictures) in the [MeetTheTeam](MeetTheTeam.md) file.

<a href="https://www.mozillascience.org/about">
  <img
    src="http://mozillascience.github.io/working-open-workshop/assets/images/science-fox.svg"
    align="right"
    width=140
  </img>
</a>

[AJ][link_aj_keller] is an invited member of the 4th cohort [Open Leaders Cohort][link_openleaderscohort] of the [Mozilla Science Lab][link_mozsci] who brought together open science advocates from around the world to participate in the first [Working Open Workshop][link_mozwow] in Berlin in February 2016. The [training exercises][link_mozwow] (which are free and easy to reuse) focused on how to build and effectively engage communities so they can work together to develop tools and resources for the greater good.

## What do we need?

**You**! In whatever way you can help.

We need expertise in programming, user experience, software sustainability, documentation and technical writing and project management.

We'd love your feedback along the way.

Our primary goal is to make programming with OpenBCI reliable, easy, research grade and fun, and we're excited to support the professional development of any and all of our contributors. If you're looking to learn to code, try out working collaboratively, or translate you skills to the digital domain, we're here to help.

## Get involved

If you think you can help in any of the areas listed above (and we bet you can) or in any of the many areas that we haven't yet thought of (and here we're *sure* you can) then please check out our [contributors' guidelines](CONTRIBUTING.md) and our [roadmap](ROADMAP.md).

Please note that it's very important to us that we maintain a positive and supportive environment for everyone who wants to participate. When you join us we ask that you follow our [code of conduct](CODE_OF_CONDUCT.md) in all interactions both on and offline.


## Contact us

If you want to report a problem or suggest an enhancement we'd love for you to [open an issue](../../issues) at this github repository because then we can get right on it. But you can also contact [AJ][link_aj_keller] by email (pushtheworldllc AT gmail DOT com) or on [twitter](https://twitter.com/aj-ptw).

You can also hang out, ask questions and share stories in the [OpenBCI NodeJS room](https://gitter.im/OpenBCI/OpenBCI_NodeJS?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) on Gitter.

## Find out more

You might be interested in:

* Purchase a [WiFi Shield from OpenBCI](https://shop.openbci.com/collections/frontpage/products/wifi-shield?variant=44534009550)
* A NodeJS example for WiFi Shield: [getStreaming.js][link_wifi_get_streaming]

And of course, you'll want to know our:

* [Contributors' guidelines](CONTRIBUTING.md)
* [Roadmap](ROADMAP.md)

## Thank you

Thank you so much (Danke schön! Merci beaucoup!) for visiting the project and we do hope that you'll join us on this amazing journey to make programming with OpenBCI fun and easy.

# Documentation

## Table of Contents:
---

1. [Installation](#install)
2. [TL;DR](#tldr)
3. [Developing](#developing)
4. [Contribute](#contribute)
5. [License](#license)
6. [General Overview](#general-overview)
7. [Classes](#classes)
8. [Typedefs](#typedefs)
9. [Wifi](#wifi)

## <a name="install"></a> Installation:
```
npm install openbci-wifi
```

## <a name="tldr"></a> TL;DR:
Get connected and [start streaming right now with the example code](examples/getStreaming/getStreaming.js).

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

1. Checkout [contributors' guidelines](CONTRIBUTING.md)
2. Fork it!
3. Branch off of `development`: `git checkout development`
4. Create your feature branch: `git checkout -b my-new-feature`
5. Make changes
6. If adding a feature, please add test coverage.
7. Ensure tests all pass. (`npm test`)
8. Commit your changes: `git commit -m 'Add some feature'`
9. Push to the branch: `git push origin my-new-feature`
10. Submit a pull request. Make sure it is based off of the `development` branch when submitting! :D

## <a name="license"></a> License:

MIT

## <a name="general-overview"></a> General Overview

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
const wifi = new Wifi({
  verbose: true
});
```

or if you are using ES6:
```js
import Wifi from 'openbci-wifi';
import { Constants } from 'openbci-utilities';
const wifi = new Wifi();
wifi.connect("OpenBCI-2114");
```

To debug, it's amazing, do:
```js
const Wifi = require('openbci-wifi');
const wifi = new Wifi({
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

To get a 'sample' event, you need to:
-------------------------------------
1. Install the 'sample' event emitter
2. Call [`.searchToStream(_options_)`](#Wifi-connect)
```js
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
Close the connection with [`.streamStop()`](#Wifi+streamStop) and disconnect with [`.disconnect()`](#Wifi+disconnect)
```js
const Wifi = require('openbci-wifi');
const wifi = new Wifi();
wifi.streamStop().then(wifi.disconnect());
```

## Classes

<dl>
<dt><a href="#Wifi">Wifi</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#InitializationObject">InitializationObject</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="Wifi"></a>

## Wifi
**Kind**: global class
**Author**: AJ Keller (@aj-ptw)

* [Wifi](#Wifi)
    * [new Wifi(options)](#new_Wifi_new)
    * _instance_
        * [.options](#Wifi+options) : [<code>InitializationObject</code>](#InitializationObject)
        * [._accelArray](#Wifi+_accelArray)
        * [.curOutputMode](#Wifi+curOutputMode)
        * [.bufferRawDataPackets(rawDataPackets)](#Wifi+bufferRawDataPackets) ⇒ <code>Array</code>
        * [.channelOff(channelNumber)](#Wifi+channelOff) ⇒ <code>Promise.&lt;T&gt;</code>
        * [.channelOn(channelNumber)](#Wifi+channelOn) ⇒ <code>Promise.&lt;T&gt;</code> \| <code>\*</code>
        * [.channelSet(channelNumber, powerDown, gain, inputType, bias, srb2, srb1)](#Wifi+channelSet) ⇒ <code>Promise</code>
        * [.impedanceSet(channelNumber, pInputApplied, nInputApplied)](#Wifi+impedanceSet) ⇒ <code>Promise</code>
        * [.connect(o)](#Wifi+connect) ⇒ <code>Promise</code>
        * [.disconnect()](#Wifi+disconnect) ⇒ <code>Promise</code>
        * [.isConnected()](#Wifi+isConnected) ⇒ <code>boolean</code>
        * [.isSearching()](#Wifi+isSearching) ⇒ <code>boolean</code>
        * [.isStreaming()](#Wifi+isStreaming) ⇒ <code>boolean</code>
        * [.getBoardType()](#Wifi+getBoardType) ⇒ <code>\*</code>
        * [.getFirmwareVersion()](#Wifi+getFirmwareVersion) ⇒ <code>String</code>
        * [.getIpAddress()](#Wifi+getIpAddress) ⇒ <code>null</code> \| <code>String</code>
        * [.getLatency()](#Wifi+getLatency) ⇒ <code>Number</code>
        * [.getMacAddress()](#Wifi+getMacAddress) ⇒ <code>null</code> \| <code>String</code>
        * [.getNumberOfChannels()](#Wifi+getNumberOfChannels) ⇒ <code>Number</code>
        * [.getSampleRate()](#Wifi+getSampleRate) ⇒ <code>Number</code>
        * [.getShieldName()](#Wifi+getShieldName) ⇒ <code>null</code> \| <code>String</code>
        * [.impedanceStart()](#Wifi+impedanceStart) ⇒ <code>global.Promise</code> \| <code>Promise</code>
        * [.impedanceStop()](#Wifi+impedanceStop) ⇒ <code>global.Promise</code> \| <code>Promise</code>
        * [.searchToStream(o)](#Wifi+searchToStream) ⇒ <code>Promise</code>
        * [.setSampleRate(sampleRate)](#Wifi+setSampleRate) ⇒ <code>Promise</code>
        * [.syncSampleRate()](#Wifi+syncSampleRate) ⇒ <code>Promise</code>
        * [.searchStart()](#Wifi+searchStart) ⇒ <code>Promise</code>
        * [.searchStop()](#Wifi+searchStop) ⇒ <code>global.Promise</code> \| <code>Promise</code>
        * [.sdStop()](#Wifi+sdStop) ⇒ <code>Promise</code>
        * [.syncRegisterSettings()](#Wifi+syncRegisterSettings) ⇒ <code>Promise.&lt;T&gt;</code> \| <code>\*</code>
        * [.softReset()](#Wifi+softReset) ⇒ <code>Promise</code>
        * [.eraseWifiCredentials()](#Wifi+eraseWifiCredentials) ⇒ <code>Promise</code>
        * [.streamStart()](#Wifi+streamStart) ⇒ <code>Promise</code>
        * [.streamStop()](#Wifi+streamStop) ⇒ <code>Promise</code>
        * [.syncInfo(o)](#Wifi+syncInfo) ⇒ <code>Promise.&lt;TResult&gt;</code>
        * [.write(data)](#Wifi+write) ⇒ <code>Promise</code>
        * [.destroy()](#Wifi+destroy)
        * [.wifiGetLocalPort()](#Wifi+wifiGetLocalPort) ⇒ <code>number</code>
        * [.wifiGetLocalPortUDP()](#Wifi+wifiGetLocalPortUDP) ⇒ <code>number</code>
        * [.wifiGetLocalPortTCP()](#Wifi+wifiGetLocalPortTCP) ⇒ <code>number</code>
        * [.wifiInitServer()](#Wifi+wifiInitServer)
        * [.delete(path)](#Wifi+delete) ⇒ <code>Promise</code>
        * [.get(path)](#Wifi+get) ⇒ <code>Promise</code>
        * [.post(path, payload)](#Wifi+post) ⇒ <code>Promise</code>
    * _inner_
        * [~o](#Wifi..o)

<a name="new_Wifi_new"></a>

### new Wifi(options)
The initialization method to call first, before any other method.


| Param | Type | Description |
| --- | --- | --- |
| options | [<code>InitializationObject</code>](#InitializationObject) | (optional) - Board optional configurations. |

<a name="Wifi+options"></a>

### wifi.options : [<code>InitializationObject</code>](#InitializationObject)
**Kind**: instance property of [<code>Wifi</code>](#Wifi)
<a name="Wifi+_accelArray"></a>

### wifi._accelArray
Private Properties (keep alphabetical)

**Kind**: instance property of [<code>Wifi</code>](#Wifi)
<a name="Wifi+curOutputMode"></a>

### wifi.curOutputMode
Public Properties (keep alphabetical)

**Kind**: instance property of [<code>Wifi</code>](#Wifi)
<a name="Wifi+bufferRawDataPackets"></a>

### wifi.bufferRawDataPackets(rawDataPackets) ⇒ <code>Array</code>
This function is for redundancy after a long packet send, the wifi firmware can resend the same
 packet again, using this till add redundancy on poor networks.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)

| Param | Description |
| --- | --- |
| rawDataPackets | - |

<a name="Wifi+channelOff"></a>

### wifi.channelOff(channelNumber) ⇒ <code>Promise.&lt;T&gt;</code>
Send a command to the board to turn a specified channel off

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)

| Param |
| --- |
| channelNumber |

<a name="Wifi+channelOn"></a>

### wifi.channelOn(channelNumber) ⇒ <code>Promise.&lt;T&gt;</code> \| <code>\*</code>
Send a command to the board to turn a specified channel on

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)

| Param |
| --- |
| channelNumber |

<a name="Wifi+channelSet"></a>

### wifi.channelSet(channelNumber, powerDown, gain, inputType, bias, srb2, srb1) ⇒ <code>Promise</code>
To send a channel setting command to the board

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - resolves if sent, rejects on bad input or no board
**Author**: AJ Keller (@aj-ptw)

| Param | Description |
| --- | --- |
| channelNumber | Number (1-16) |
| powerDown | Bool (true -> OFF, false -> ON (default))          turns the channel on or off |
| gain | Number (1,2,4,6,8,12,24(default))          sets the gain for the channel |
| inputType | String (normal,shorted,biasMethod,mvdd,temp,testsig,biasDrp,biasDrn)          selects the ADC channel input source |
| bias | Bool (true -> Include in bias (default), false -> remove from bias)          selects to include the channel input in bias generation |
| srb2 | Bool (true -> Connect this input to SRB2 (default),                     false -> Disconnect this input from SRB2)          Select to connect (true) this channel's P input to the SRB2 pin. This closes              a switch between P input and SRB2 for the given channel, and allows the              P input to also remain connected to the ADC. |
| srb1 | Bool (true -> connect all N inputs to SRB1,                     false -> Disconnect all N inputs from SRB1 (default))          Select to connect (true) all channels' N inputs to SRB1. This effects all pins,              and disconnects all N inputs from the ADC. |

<a name="Wifi+impedanceSet"></a>

### wifi.impedanceSet(channelNumber, pInputApplied, nInputApplied) ⇒ <code>Promise</code>
To send an impedance setting command to the board

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - resolves if sent, rejects on bad input or no board
**Author**: AJ Keller (@aj-ptw)

| Param | Type | Description |
| --- | --- | --- |
| channelNumber | <code>Number</code> | (1-16) |
| pInputApplied | <code>Boolean</code> | (true -> ON, false -> OFF (default)) |
| nInputApplied | <code>Boolean</code> | (true -> ON, false -> OFF (default)) |

<a name="Wifi+connect"></a>

### wifi.connect(o) ⇒ <code>Promise</code>
The essential precursor method to be called initially to establish a
             ble connection to the OpenBCI ganglion board.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - If the board was able to connect.
**Author**: AJ Keller (@aj-ptw)

| Param | Type | Description |
| --- | --- | --- |
| o | <code>Object</code> |  |
| o.burst | <code>Boolean</code> | Set this option true to have UDP do burst mode 3x |
| o.examineMode | <code>Boolean</code> | Set this option true to connect to the WiFi Shield even if there is no board attached. |
| o.ipAddress | <code>String</code> | The ip address of the shield if you know it |
| o.latency | <code>Number</code> | If you want to set the latency of the system you can here too. |
| o.protocol | <code>String</code> | Either send the data over TCP or UDP. UDP seems better for either a bad router or slow                      router. Default is TCP |
| o.sampleRate |  | The sample rate to set the board connected to the wifi shield |
| o.shieldName | <code>String</code> | If supplied, will search for a shield by this name, if not supplied, will connect to  the first shield found. |
| o.streamStart | <code>Boolean</code> | Set `true` if you want the board to start streaming. |

<a name="Wifi+disconnect"></a>

### wifi.disconnect() ⇒ <code>Promise</code>
Closes the connection to the board. Waits for stop streaming command to
 be sent if currently streaming.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - - fulfilled by a successful close, rejected otherwise.
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+isConnected"></a>

### wifi.isConnected() ⇒ <code>boolean</code>
Checks if the driver is connected to a board.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>boolean</code> - - True if connected.
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+isSearching"></a>

### wifi.isSearching() ⇒ <code>boolean</code>
Checks if noble is currently scanning.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>boolean</code> - - True if streaming.
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+isStreaming"></a>

### wifi.isStreaming() ⇒ <code>boolean</code>
Checks if the board is currently sending samples.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>boolean</code> - - True if streaming.
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+getBoardType"></a>

### wifi.getBoardType() ⇒ <code>\*</code>
Get the current board type

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+getFirmwareVersion"></a>

### wifi.getFirmwareVersion() ⇒ <code>String</code>
Get the firmware version of connected and synced wifi shield.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>String</code> - The version number
Note: This is dependent on if you called connect
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+getIpAddress"></a>

### wifi.getIpAddress() ⇒ <code>null</code> \| <code>String</code>
Return the ip address of the attached WiFi Shield device.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+getLatency"></a>

### wifi.getLatency() ⇒ <code>Number</code>
Return the latency to be set on the WiFi Shield.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+getMacAddress"></a>

### wifi.getMacAddress() ⇒ <code>null</code> \| <code>String</code>
Return the MAC address of the attached WiFi Shield device.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+getNumberOfChannels"></a>

### wifi.getNumberOfChannels() ⇒ <code>Number</code>
This function is used as a convenience method to determine how many
             channels the current board is using.
Note: This is dependent on if your wifi shield is attached to another board and how many channels are there.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Number</code> - A number
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+getSampleRate"></a>

### wifi.getSampleRate() ⇒ <code>Number</code>
Get the the current sample rate is.
 Note: This is dependent on if you configured the board correctly on setup options

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Number</code> - The sample rate
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+getShieldName"></a>

### wifi.getShieldName() ⇒ <code>null</code> \| <code>String</code>
Return the shield name of the attached WiFi Shield device.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+impedanceStart"></a>

### wifi.impedanceStart() ⇒ <code>global.Promise</code> \| <code>Promise</code>
Call to start testing impedance.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+impedanceStop"></a>

### wifi.impedanceStop() ⇒ <code>global.Promise</code> \| <code>Promise</code>
Call to stop testing impedance.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+searchToStream"></a>

### wifi.searchToStream(o) ⇒ <code>Promise</code>
Used to search for an OpenBCI WiFi Shield. Will connect to the first one if no `shieldName` is supplied.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - - Resolves after successful connection, rejects otherwise with Error.
**Author**: AJ Keller (@aj-ptw)

| Param | Type | Description |
| --- | --- | --- |
| o | <code>Object</code> | (optional) |
| o.sampleRate |  | The sample rate to set the board connected to the wifi shield |
| o.shieldName | <code>String</code> | If supplied, will search for a shield by this name, if not supplied, will connect to  the first shield found. |
| o.streamStart | <code>Boolean</code> | Set `true` if you want the board to start streaming. |
| o.timeout | <code>Number</code> | The time in milli seconds to wait for the system to try and auto find and connect to the  shield. |

<a name="Wifi+setSampleRate"></a>

### wifi.setSampleRate(sampleRate) ⇒ <code>Promise</code>
Set the sample rate of the remote OpenBCI shield

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)

| Param | Type | Description |
| --- | --- | --- |
| sampleRate | <code>Number</code> | the sample rate you want to set to. |

<a name="Wifi+syncSampleRate"></a>

### wifi.syncSampleRate() ⇒ <code>Promise</code>
Returns the sample rate from the board

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+searchStart"></a>

### wifi.searchStart() ⇒ <code>Promise</code>
List available peripherals so the user can choose a device when not
             automatically found.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - - If scan was started
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+searchStop"></a>

### wifi.searchStop() ⇒ <code>global.Promise</code> \| <code>Promise</code>
Called to end a search.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+sdStop"></a>

### wifi.sdStop() ⇒ <code>Promise</code>
Sends the stop SD logging command to the board. If not streaming then `eot` event will be emitted
     with request response from the board.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - - Resolves when written
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+syncRegisterSettings"></a>

### wifi.syncRegisterSettings() ⇒ <code>Promise.&lt;T&gt;</code> \| <code>\*</code>
Syncs the internal channel settings object with a cyton, this will take about
 over a second because there are delays between the register reads in the firmware.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise.&lt;T&gt;</code> \| <code>\*</code> - Resolved once synced, rejects on error or 2 second timeout
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+softReset"></a>

### wifi.softReset() ⇒ <code>Promise</code>
Sends a soft reset command to the board

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - - Fulfilled if the command was sent to board.
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+eraseWifiCredentials"></a>

### wifi.eraseWifiCredentials() ⇒ <code>Promise</code>
Tells the WiFi Shield to forget it's network credentials. This will cause the board to drop all
 connections.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - Resolves when WiFi Shield has been reset and the module disconnects.
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+streamStart"></a>

### wifi.streamStart() ⇒ <code>Promise</code>
Sends a start streaming command to the board.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - indicating if the signal was able to be sent.
Note: You must have successfully connected to an OpenBCI board using the connect
          method. Just because the signal was able to be sent to the board, does not
          mean the board will start streaming.
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+streamStop"></a>

### wifi.streamStop() ⇒ <code>Promise</code>
Sends a stop streaming command to the board.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - indicating if the signal was able to be sent.
Note: You must have successfully connected to an OpenBCI board using the connect
          method. Just because the signal was able to be sent to the board, does not
          mean the board stopped streaming.
**Author**: AJ Keller (@aj-ptw)
<a name="Wifi+syncInfo"></a>

### wifi.syncInfo(o) ⇒ <code>Promise.&lt;TResult&gt;</code>
Sync the info of this wifi module

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Author**: AJ Keller (@aj-ptw)

| Param | Type | Description |
| --- | --- | --- |
| o | <code>Object</code> |  |
| o.examineMode | <code>Boolean</code> | Set this option true to connect to the WiFi Shield even if there is no board attached. |

<a name="Wifi+write"></a>

### wifi.write(data) ⇒ <code>Promise</code>
Used to send data to the board.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - - fulfilled if command was able to be sent
**Author**: AJ Keller (@aj-ptw)

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array</code> \| <code>Buffer</code> \| <code>Number</code> \| <code>String</code> | The data to write out |

<a name="Wifi+destroy"></a>

### wifi.destroy()
Call this to shut down the servers.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
<a name="Wifi+wifiGetLocalPort"></a>

### wifi.wifiGetLocalPort() ⇒ <code>number</code>
Get the local port number of either the TCP or UDP server. Based on `options.protocol` being set to
 either `udp` or `tcp`.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>number</code> - The port number that was dynamically assigned to this module on startup.
<a name="Wifi+wifiGetLocalPortUDP"></a>

### wifi.wifiGetLocalPortUDP() ⇒ <code>number</code>
Get the local port number of the UDP server.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>number</code> - The port number that was dynamically assigned to this module on startup.
<a name="Wifi+wifiGetLocalPortTCP"></a>

### wifi.wifiGetLocalPortTCP() ⇒ <code>number</code>
Get the local port number of the UDP server.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>number</code> - The port number that was dynamically assigned to this module on startup.
<a name="Wifi+wifiInitServer"></a>

### wifi.wifiInitServer()
Initialization function that will start the TCP server and bind the UDP port.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
<a name="Wifi+delete"></a>

### wifi.delete(path) ⇒ <code>Promise</code>
Send a delete message to the connected wifi shield.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - - Resolves if gets a response from the client/server, rejects with error

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | the path/route to send the delete message to |

<a name="Wifi+get"></a>

### wifi.get(path) ⇒ <code>Promise</code>
Send a GET message to the connected wifi shield.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - - Resolves if gets/with a response from the client/server, rejects with error

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | the path/route to send the GET message to |

<a name="Wifi+post"></a>

### wifi.post(path, payload) ⇒ <code>Promise</code>
Send a POST message to the connected wifi shield.

**Kind**: instance method of [<code>Wifi</code>](#Wifi)
**Returns**: <code>Promise</code> - - Resolves if gets a response from the client/server, rejects with error

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | the path/route to send the POST message to |
| payload | <code>\*</code> | can really be anything but should be a JSON object. |

<a name="Wifi..o"></a>

### Wifi~o
Configuring Options

**Kind**: inner property of [<code>Wifi</code>](#Wifi)
<a name="InitializationObject"></a>

## InitializationObject : <code>Object</code>
**Kind**: global typedef
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| attempts | <code>Number</code> | The number of times to try and perform an SSDP search before quitting. (Default 10) |
| burst | <code>Boolean</code> | Only applies for UDP, but the wifi shield will send 3 of the same packets on UDP to                      increase the chance packets arrive to this module (Default false) |
| debug | <code>Boolean</code> | Print out a raw dump of bytes sent and received. (Default `false`) |
| latency | <code>Number</code> | The latency, or amount of time between packet sends, of the WiFi shield. The time is in                      micro seconds! |
| protocol | <code>String</code> | Either send the data over TCP or UDP. UDP seems better for either a bad router or slow                      router. Default is TCP |
| sampleRate | <code>Number</code> | The sample rate to set the board to. (Default is zero) |
| sendCounts | <code>Boolean</code> | Send integer raw counts instead of scaled floats.           (Default `false`) |
| verbose | <code>Boolean</code> | Print out useful debugging events. (Default `false`) |


[link_aj_keller]: https://github.com/aj-ptw
[link_shop_wifi_shield]: https://shop.openbci.com/collections/frontpage/products/wifi-shield?variant=44534009550
[link_shop_ganglion]: https://shop.openbci.com/collections/frontpage/products/pre-order-ganglion-board
[link_shop_cyton]: https://shop.openbci.com/collections/frontpage/products/cyton-biosensing-board-8-channel
[link_shop_cyton_daisy]: https://shop.openbci.com/collections/frontpage/products/cyton-daisy-biosensing-boards-16-channel
[link_ptw]: https://www.pushtheworldllc.com
[link_openbci]: http://www.openbci.com
[link_mozwow]: http://mozillascience.github.io/working-open-workshop/index.html
[link_wifi_get_streaming]: examples/getStreaming/getStreaming.js
[link_openleaderscohort]: https://medium.com/@MozOpenLeaders
[link_mozsci]: https://science.mozilla.org
