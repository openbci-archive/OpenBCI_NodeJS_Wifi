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

The development of this app is mentored by the team behind the [Rosalind Franklin Appathon][link_rfappapthon] - a challenge launched in 2015 to find and support the development of new mobile phone apps to empower women in STEMM. The competition is funded by the [Royal Society's Rosalind Franklin award][link_royalsociety_rfaward] which was won in 2014 by the Prof [Rachel McKendry][link_rachelmckendry]. Check out her [awesome lecture][link_rachelmckendry_talk] on _Harnessing the power of mobile phones and big data for global health_.

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

[link_aj_keller]: https://github.com/aj-ptw
[link_shop_wifi_shield]: https://shop.openbci.com/collections/frontpage/products/wifi-shield?variant=44534009550
[link_shop_ganglion]: https://shop.openbci.com/collections/frontpage/products/pre-order-ganglion-board
[link_shop_cyton]: https://shop.openbci.com/collections/frontpage/products/cyton-biosensing-board-8-channel
[link_shop_cyton_daisy]: https://shop.openbci.com/collections/frontpage/products/cyton-daisy-biosensing-boards-16-channel
[link_ptw]: https://www.pushtheworldllc.com
[link_openbci]: http://www.openbci.com
[link_mozwow]: http://mozillascience.github.io/working-open-workshop/index.html
[link_wifi_get_streaming]: examples/getStreaming/getStreaming.js
