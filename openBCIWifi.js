'use strict';
const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const util = require('util');
// Local imports
const OpenBCIUtilities = require('openbci-utilities');
const obciUtils = OpenBCIUtilities.Utilities;
const k = OpenBCIUtilities.Constants;
const obciDebug = OpenBCIUtilities.Debug;
const clone = require('clone');
const ip = require('ip');
const Client = require('node-ssdp').Client;
const net = require('net');
const http = require('http');
const bufferEqual = require('buffer-equal');
const Buffer = require('safe-buffer').Buffer;

const wifiOutputModeJSON = 'json';
const wifiOutputModeRaw = 'raw';

/**
 * Options object
 * @type {InitializationObject}
 * @private
 */
const _options = {
  attempts: 10,
  debug: false,
  latency: 20000,
  sendCounts: false,
  simulate: false,
  simulatorBoardFailure: false,
  simulatorHasAccelerometer: true,
  simulatorInternalClockDrift: 0,
  simulatorInjectAlpha: true,
  simulatorInjectLineNoise: [k.OBCISimulatorLineNoiseHz60, k.OBCISimulatorLineNoiseHz50, k.OBCISimulatorLineNoiseNone],
  simulatorSampleRate: 200,
  verbose: false
};

/**
 * @typedef {Object} InitializationObject
 * @property {Number} attempts  - The number of times to try and perform an SSDP search before quitting. (Default 10)
 *
 * @property {Boolean} debug  - Print out a raw dump of bytes sent and received. (Default `false`)
 *
 * @property {Number} latency - The latency, or amount of time between packet sends, of the WiFi shield. The time is in
 *                      micro seconds!
 *
 * @property {Boolean} sendCounts  - Send integer raw counts instead of scaled floats.
 *           (Default `false`)
 *
 * @property {Boolean} simulate  - (IN-OP) Full functionality, just mock data. Must attach Daisy module by setting
 *                  `simulatorDaisyModuleAttached` to `true` in order to get 16 channels. (Default `false`)
 *
 * @property {Boolean} simulatorBoardFailure  - (IN-OP)  Simulates board communications failure. This occurs when the RFduino on
 *                  the board is not polling the RFduino on the dongle. (Default `false`)
 *
 * @property {Boolean} simulatorHasAccelerometer  - Sets simulator to send packets with accelerometer data. (Default `true`)
 *
 * @property {Boolean} simulatorInjectAlpha  - Inject a 10Hz alpha wave in Channels 1 and 2 (Default `true`)
 *
 * @property {String} simulatorInjectLineNoise  - Injects line noise on channels.
 *          3 Possible Options:
 *              `60Hz` - 60Hz line noise (Default) [America]
 *              `50Hz` - 50Hz line noise [Europe]
 *              `none` - Do not inject line noise.
 *
 * @property {Number} simulatorSampleRate  - The sample rate to use for the simulator. Simulator will set to 125 if
 *                  `simulatorDaisyModuleAttached` is set `true`. However, setting this option overrides that
 *                  setting and this sample rate will be used. (Default is `250`)
 *
 * @property {Boolean} verbose  - Print out useful debugging events. (Default `false`)
 *
 */

/**
 * @description The initialization method to call first, before any other method.
 * @param options {InitializationObject} (optional) - Board optional configurations.
 * @param callback {function} (optional) - A callback function used to determine if the noble module was able to be started.
 *    This can be very useful on Windows when there is no compatible BLE device found.
 * @constructor
 * @author AJ Keller (@pushtheworldllc)
 */
function Wifi (options, callback) {
  if (!(this instanceof Wifi)) {
    return new Wifi(options, callback);
  }

  if (options instanceof Function) {
    callback = options;
    options = {};
  }

  options = (typeof options !== 'function') && options || {};
  let opts = {};

  /** Configuring Options */
  let o;
  for (o in _options) {
    var userOption = (o in options) ? o : o.toLowerCase();
    var userValue = options[userOption];
    delete options[userOption];

    if (typeof _options[o] === 'object') {
      // an array specifying a list of choices
      // if the choice is not in the list, the first one is defaulted to

      if (_options[o].indexOf(userValue) !== -1) {
        opts[o] = userValue;
      } else {
        opts[o] = _options[o][0];
      }
    } else {
      // anything else takes the user value if provided, otherwise is a default

      if (userValue !== undefined) {
        opts[o] = userValue;
      } else {
        opts[o] = _options[o];
      }
    }
  }

  for (o in options) throw new Error('"' + o + '" is not a valid option');

  /**
   * @type {InitializationObject}
   */
  this.options = clone(opts);

  /**
   * @type {RawDataToSample}
   * @private
   */
  this._rawDataPacketToSample = k.rawDataToSampleObjectDefault(8);
  this._rawDataPacketToSample.scale = !this.options.sendCounts;
  this._rawDataPacketToSample.protocol = k.OBCIProtocolWifi;
  this._rawDataPacketToSample.verbose = this.options.verbose;

  /** Private Properties (keep alphabetical) */
  this._accelArray = [0, 0, 0];
  this._boardType = k.OBCIBoardNone;
  this._connected = false;
  this._droppedPacketCounter = 0;
  this._firstPacket = true;
  this._info = null;
  this._latency = this.options.latency;
  this._localName = null;
  this._lowerChannelsSampleObject = null;
  this._multiPacketBuffer = null;
  this._numberOfChannels = 0;
  this._packetCounter = 0;
  this._peripheral = null;
  this._scanning = false;
  this._streaming = false;

  /** Public Properties (keep alphabetical) */
  this.curOutputMode = wifiOutputModeRaw;
  this.wifiShieldArray = [];

  /** Initializations */

  this.wifiInitServer();
  if (callback) callback();
}

// This allows us to use the emitter class freely outside of the module
util.inherits(Wifi, EventEmitter);

/**
 * Used to auto find and connect to a single wifi shield on a local network.
 * @param timeout {Number} - The time in milli seconds to wait for the system to try and auto find and connect to the
 *  board.
 * @return {Promise} - Resolves after successful connection, rejects otherwise with Error.
 */
Wifi.prototype.autoFindAndConnectToWifiShield = function (timeout) {
  return new Promise((resolve, reject) => {
    let autoFindTimeOut = null;
    timeout = timeout | 10000;
    this.once(k.OBCIEmitterWifiShield, (shield) => {
      if (autoFindTimeOut) clearTimeout(autoFindTimeOut);
      this.connect(shield.ipAddress)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
          console.log(err);
        });
      this.searchStop().catch(console.log);
    });
    this.searchStart().catch(console.log);

    autoFindTimeOut = setTimeout(() => {
      this.searchStop().catch(console.log);
      reject(Error(`Failed to autoFindAndConnectToWifiShield within ${timeout} ms`))
    }, timeout);

  });
};

/**
 * @description Send a command to the board to turn a specified channel off
 * @param channelNumber
 * @returns {Promise.<T>}
 * @author AJ Keller (@pushtheworldllc)
 */
Wifi.prototype.channelOff = function (channelNumber) {
  return k.commandChannelOff(channelNumber).then((charCommand) => {
    // console.log('sent command to turn channel ' + channelNumber + ' by sending command ' + charCommand)
    return this.write(charCommand);
  });
};

/**
 * @description Send a command to the board to turn a specified channel on
 * @param channelNumber
 * @returns {Promise.<T>|*}
 * @author AJ Keller (@pushtheworldllc)
 */
Wifi.prototype.channelOn = function (channelNumber) {
  return k.commandChannelOn(channelNumber).then((charCommand) => {
    // console.log('sent command to turn channel ' + channelNumber + ' by sending command ' + charCommand)
    return this.write(charCommand);
  });
};

/**
 * @description The essential precursor method to be called initially to establish a
 *              ble connection to the OpenBCI ganglion board.
 * @param id {String | Object} - a string local name or peripheral object
 * @returns {Promise} If the board was able to connect.
 * @author AJ Keller (@pushtheworldllc)
 */
Wifi.prototype.connect = function (id) {
  return new Promise((resolve, reject) => {
    if (_.isObject(id)) {
      id = id.ipAddress;
    } else if (_.includes(id.toLowerCase(), "openbci")) {
      _.forEach(this.wifiShieldArray, (shield) => {
        if (shield.localName === id) {
          id = shield.ipAddress;
        }
      });
    }
    if (this.options.verbose) console.log(`Attempting to connect to ${id}`);
    this._connectSocket(id)
      .then(() => {
        if (this.options.verbose) console.log(`Connected to ${id}`);
        this._localName = id;
        this._connected = true;
        return this.syncInfo();
      })
      .then(() => {
        if (this.options.verbose) console.log(`Synced into with ${id}`);
        resolve();
      })
      .catch((err) => {
        this._localName = null;
        this._connected = false;
        reject(err);
      });
  });
};

/**
 * @description Closes the connection to the board. Waits for stop streaming command to
 *  be sent if currently streaming.
 * @returns {Promise} - fulfilled by a successful close, rejected otherwise.
 * @author AJ Keller (@pushtheworldllc)
 */
Wifi.prototype.disconnect = function () {
  this._disconnected();
  return Promise.resolve();

};

/**
 * Return the local name of the attached Wifi device.
 * @return {null|String}
 */
Wifi.prototype.getLocalName = function () {
  return this._localName;
};

/**
 * Get's the multi packet buffer.
 * @return {null|Buffer} - Can be null if no multi packets received.
 */
Wifi.prototype.getMutliPacketBuffer = function () {
  return this._multiPacketBuffer;
};

/**
 * @description Checks if the driver is connected to a board.
 * @returns {boolean} - True if connected.
 */
Wifi.prototype.isConnected = function () {
  return this._connected;
};

/**
 * @description Checks if noble is currently scanning.
 * @returns {boolean} - True if streaming.
 */
Wifi.prototype.isSearching = function () {
  return this._scanning;
};

/**
 * @description Checks if the board is currently sending samples.
 * @returns {boolean} - True if streaming.
 */
Wifi.prototype.isStreaming = function () {
  return this._streaming;
};

/**
 * @description This function is used as a convenience method to determine how many
 *              channels the current board is using.
 * @returns {Number} A number
 * Note: This is dependent on if your wifi shield is attached to another board and how many channels are there.
 * @author AJ Keller (@pushtheworldllc)
 */
Wifi.prototype.getNumberOfChannels = function () {
  return this._numberOfChannels;
};

/**
 * @description Get the current board type
 * @returns {*}
 */
Wifi.prototype.getBoardType = function () {
  return this._boardType;
};

Wifi.prototype.getSampleRate = function () {
  const numPattern = /\d+/g;
  return new Promise((resolve, reject) => {
    this.write(`${k.OBCISampleRateSet}${k.OBCISampleRateCmdGetCur}`)
      .then((res) => {
        if (_.includes(res, k.OBCIParseSuccess)) {
          resolve(Number(res.match(numPattern)[0]));
        } else {
          reject(res);
        }
      })
      .catch((err) => {
        reject(err);
      })
  });
};

Wifi.prototype.setSampleRate = function (sampleRate) {
  const numPattern = /\d+/g;
  return new Promise((resolve, reject) => {
    k.getSampleRateSetter(this._boardType, sampleRate)
      .then((cmds) => {
        return this.write(cmds);
      })
      .then((res) => {
        if (_.includes(res, k.OBCIParseSuccess)) {
          this._sampleRate = Number(res.match(numPattern)[0]);
          resolve(this._sampleRate);
        } else {
          reject(res);
        }
      })
      .catch((err) => {
        reject(err);
      })
  });
};

/**
 * @description Get the the current sample rate is.
 * @returns {Number} The sample rate
 * Note: This is dependent on if you configured the board correctly on setup options
 */
Wifi.prototype.sampleRate = function () {
  return this._sampleRate;
};

/**
 * @description List available peripherals so the user can choose a device when not
 *              automatically found.
 * @returns {Promise} - If scan was started
 */
Wifi.prototype.searchStart = function () {
  return new Promise((resolve) => {
    this._scanning = true;
    this.wifiClient = new Client({});
    let attemptCounter = 0;
    let _timeout = 3 * 1000; // Retry every 3 seconds
    let timeoutFunc = () => {
      if (attemptCounter < this.options.attempts) {
        if (this.wifiClient) {
          this.wifiClient.stop();
          this.wifiClient.search('urn:schemas-upnp-org:device:Basic:1');
          attemptCounter++;
          if (this.options.verbose) console.log(`SSDP: still trying to find a board - attempt ${attemptCounter} of ${this.options.attempts}`);
          this.ssdpTimeout = setTimeout(timeoutFunc, _timeout);
        }
      } else {
        if (this.options.verbose) console.log('SSDP: stopping because out of attempts');
        this.searchStop();
      }
    };
    this.wifiClient.on('response', (headers, code, rinfo) => {
      if (this.options.verbose) console.log('SSDP:Got a response to an m-search:\n%d\n%s\n%s', code, JSON.stringify(headers, null, '  '), JSON.stringify(rinfo, null, '  '));
      try {
        const shieldName = `OpenBCI-${headers.SERVER.split('/')[2].split('-')[2]}`;
        const shieldIpAddress = rinfo.address;
        const wifiShieldObject = {
          ipAddress: shieldIpAddress,
          localName: shieldName
        };
        let addShield = true;
        _.forEach(this.wifiShieldArray, (shield) => {
          if (shield.ipAddress === shieldIpAddress) {
            addShield = false;
          }
        });
        if (addShield) this.wifiShieldArray.push(wifiShieldObject);
        this.emit(k.OBCIEmitterWifiShield, wifiShieldObject);
      } catch (err) {
        console.log('not an openbci shield');
      }
    });
    // Search for just the wifi shield
    this.wifiClient.search('urn:schemas-upnp-org:device:Basic:1');
    this.ssdpTimeout = setTimeout(timeoutFunc, _timeout);
    resolve();
  });
};

/**
 * Called to end a search.
 * @return {global.Promise|Promise}
 */
Wifi.prototype.searchStop = function () {
  if (this.wifiClient) this.wifiClient.stop();
  if (this.ssdpTimeout) clearTimeout(this.ssdpTimeout);
  this._scanning = false;
  return Promise.resolve();
};

/**
 * @description Sends a soft reset command to the board
 * @returns {Promise} - Fulfilled if the command was sent to board.
 * @author AJ Keller (@pushtheworldllc)
 */
Wifi.prototype.softReset = function () {
  return this.write(k.OBCIMiscSoftReset);
};

/**
 * @description Sends a start streaming command to the board.
 * @returns {Promise} indicating if the signal was able to be sent.
 * Note: You must have successfully connected to an OpenBCI board using the connect
 *           method. Just because the signal was able to be sent to the board, does not
 *           mean the board will start streaming.
 * @author AJ Keller (@pushtheworldllc)
 */
Wifi.prototype.streamStart = function () {
  return new Promise((resolve, reject) => {
    if (this.isStreaming()) return reject('Error [.streamStart()]: Already streaming');
    this._streaming = true;
    this.write(k.OBCIStreamStart)
      .then(() => {
        if (this.options.verbose) console.log('Sent stream start to board.');
        resolve();
      })
      .catch(reject);
  });
};

/**
 * @description Sends a stop streaming command to the board.
 * @returns {Promise} indicating if the signal was able to be sent.
 * Note: You must have successfully connected to an OpenBCI board using the connect
 *           method. Just because the signal was able to be sent to the board, does not
 *           mean the board stopped streaming.
 * @author AJ Keller (@pushtheworldllc)
 */
Wifi.prototype.streamStop = function () {
  return new Promise((resolve, reject) => {
    if (!this.isStreaming()) return reject('Error [.streamStop()]: No stream to stop');
    this._streaming = false;
    this.write(k.OBCIStreamStop)
      .then(() => {
        resolve();
      })
      .catch(reject);
  });
};

Wifi.prototype.syncInfo = function () {
  return this.get(this._localName, '/board')
    .then((info) => {
      try {
        info = JSON.parse(info);
        this.openBCIBoardConnected = info['board_connected'];
        if (!this.openBCIBoardConnected) return Promise.reject(Error('No OpenBCI Board (Ganglion or Cyton) connected, please check power of the boards'));
        this._numberOfChannels = info['num_channels'];
        this._boardType = info['board_type'];

        const channelSettings = k.channelSettingsArrayInit(this.getNumberOfChannels());
        _.forEach(channelSettings, (settings, index) => {
          settings['gain'] = info['gains'][index];
        });
        this._rawDataPacketToSample.channelSettings = channelSettings;
        if (this.options.verbose) console.log(`Got all info from GET /board`);
        return this.getSampleRate();
      } catch (err) {
        return Promise.reject(err);
      }
    })
    .then((sampleRate) => {
      if (this.options.verbose) console.log(`Sample rate is ${sampleRate}`);
      this._sampleRate = sampleRate;
      return Promise.resolve();
    })
    .catch((err) => {
      console.log(err);
      return Promise.reject(err);
    })
};

/**
 * @description Used to send data to the board.
 * @param data {Array | Buffer | Number | String} - The data to write out
 * @returns {Promise} - fulfilled if command was able to be sent
 * @author AJ Keller (@pushtheworldllc)
 */
Wifi.prototype.write = function (data) {
  return new Promise((resolve, reject) => {
    if (this._localName) {
      if (!Buffer.isBuffer(data)) {
        if (_.isArray(data)) {
          data = Buffer.alloc(data.length, data.join(''));
        } else {
          data = new Buffer(data);
        }
      }
      if (this.options.debug) obciDebug.debugBytes('>>>', data);
      this.post(this._localName, '/command', {'command': data.toString()})
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        })
    } else {
      reject('Local name is not set. Please call connect with ip address of wifi shield');
    }
  });
};

// //////// //
// PRIVATES //
// //////// //
/**
 * @description Called once when for any reason the ble connection is no longer open.
 * @private
 */
Wifi.prototype._disconnected = function () {
  this._streaming = false;
  this._connected = false;

  if (this.options.verbose) console.log(`Private disconnect clean up`);

  this.emit('close');
};

/**
 * Route incoming data to proper functions
 * @param data {Buffer} - Data buffer from noble Wifi.
 * @private
 */
Wifi.prototype._processBytes = function (data) {
  if (this.options.debug) obciDebug.debugBytes('<<', data);
  if (this.curOutputMode === wifiOutputModeRaw) {
    if (this.buffer) {
      this.prevBuffer = this.buffer;
      this.buffer = new Buffer([this.buffer, data]);
    } else {
      this.buffer = data;
    }
    const output = obciUtils.extractRawDataPackets(this.buffer);

    this.buffer = output.buffer;

    this._rawDataPacketToSample.rawDataPackets = output.rawDataPackets;

    _.forEach(this._rawDataPacketToSample.rawDataPackets, (rawDataPacket) => {
      this.emit(k.OBCIEmitterRawDataPacket, rawDataPacket);
    });

    const samples = obciUtils.transformRawDataPacketsToSample(this._rawDataPacketToSample);

    _.forEach(samples, (sample) => {
      if (this.getBoardType() === k.OBCIBoardDaisy) {
        // Send the sample for downstream sample compaction
        this._finalizeNewSampleForDaisy(sample);
      } else {
        this.emit(k.OBCIEmitterSample, sample);
      }
    });

    // Prevent bad data from being carried through continuously
    if (this.buffer) {
      if (bufferEqual(this.buffer, this.prevBuffer)) {
        this.buffer = null;
      }
    }
  }
};

/**
 * @description This function is called every sample if the boardType is Daisy. The function stores odd sampleNumber
 *      sample objects to a private global variable called `._lowerChannelsSampleObject`. The method will emit a
 *      sample object only when the upper channels arrive in an even sampleNumber sample object. No sample will be
 *      emitted on an even sampleNumber if _lowerChannelsSampleObject is null and one will be added to the
 *      missedPacket counter. Further missedPacket will increase if two odd sampleNumber packets arrive in a row.
 * @param sampleObject {Object} - The sample object to finalize
 * @private
 * @author AJ Keller (@pushtheworldllc)
 */
Wifi.prototype._finalizeNewSampleForDaisy = function (sampleObject) {
  if (k.isNull(this._lowerChannelsSampleObject)) {
    this._lowerChannelsSampleObject = sampleObject;
  } else {
    // Make sure there is an odd packet waiting to get merged with this packet
    if (this._lowerChannelsSampleObject.sampleNumber === sampleObject.sampleNumber) {
      // Merge these two samples
      var mergedSample = obciUtils.makeDaisySampleObjectWifi(this._lowerChannelsSampleObject, sampleObject);
      // Set the _lowerChannelsSampleObject object to null
      this._lowerChannelsSampleObject = null;
      // Emit the new merged sample
      this.emit('sample', mergedSample);
    } else {
      // Missed the odd packet, i.e. two evens in a row
      this._lowerChannelsSampleObject = sampleObject;
    }
  }
};

/**
 * Used for client connecting to
 * @param shieldIP {String} - The local ip address. Or host name on mac or if using bonjour (windows/linux)
 * @private
 */
Wifi.prototype._connectSocket = function (shieldIP) {
  return this.post(shieldIP, '/tcp', {
    ip: ip.address(),
    output: this.curOutputMode,
    port: this.wifiGetLocalPort(),
    delimiter: false,
    latency: this.options.latency
  });
};

/**
 * Call this to shut down the servers.
 */
Wifi.prototype.destroy = function () {
  this.wifiServer = null;
  if (this.wifiClient) {
    this.wifiClient.stop();
  }
  this.wifiClient = null;
};

Wifi.prototype.wifiGetLocalPort = function () {
  return this.wifiServer.address().port;
};

Wifi.prototype.wifiInitServer = function () {
  let persistentBuffer = null;
  const delimBuf = new Buffer("\r\n");
  this.wifiServer = net.createServer((socket) => {
    // streamJSON.on("data", (sample) => {
    //   console.log(sample);
    // });
    socket.on('data', (data) => {
      this._processBytes(data);
    });
    socket.on('error', (err) => {
      if (this.options.verbose) console.log('SSDP:',err);
    });
  }).listen();
  if (this.options.verbose) console.log("Server on port: ", this.wifiGetLocalPort());
};

Wifi.prototype.processResponse = function (res, cb) {
  if (this.options.verbose) {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  }
  res.setEncoding('utf8');
  let msg = '';
  res.on('data', (chunk) => {
    if (this.options.verbose) console.log(`BODY: ${chunk}`);
    msg += chunk.toString();
  });
  res.once('end', () => {
    if (this.options.verbose) console.log('No more data in response.');
    this.emit('res', msg);
    if (res.statusCode !== 200) {
      if (cb) cb(msg);
    } else {
      if (cb) cb();
    }
  });
};

Wifi.prototype._post = function (host, path, payload, cb) {
  const output = JSON.stringify(payload);
  const options = {
    host: host,
    port: 80,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': output.length
    }
  };

  const req = http.request(options, (res) => {
    this.processResponse(res, (err) => {
      if (err) {
        if (cb) cb.call(this, err);
      } else {
        if (cb) cb.call(this);
      }
    });
  });

  req.once('error', (e) => {
    if (this.options.verbose) console.log(`problem with request: ${e.message}`);
    if (cb) cb.call(this, e);
  });

  // write data to request body
  req.write(output);
  req.end();
};

//TODO: Implement a function that allows us to async wait for res
Wifi.prototype.post = function (host, path, payload) {
  return new Promise((resolve, reject) => {
    const resFunc = (res) => {
      resolve(res);
    };
    this.once('res', resFunc);
    this._post(host, path, payload, (err) => {
      if (err) {
        if (this.options.verbose) {
          this.removeListener('res', resFunc);
          reject(err);
        }
      }
    })
  });
};


Wifi.prototype._get = function (host, path, cb) {
  const options = {
    host: host,
    port: 80,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    this.processResponse(res, (err) => {
      if (err) {
        if (cb) cb(err);
      } else {
        if (cb) cb();
      }
    });
  });

  req.once('error', (e) => {
    if (this.options.verbose) console.log(`problem with request: ${e.message}`);
    if (cb) cb(e);
  });

  req.end();
};

Wifi.prototype.get = function (host, path) {
  return new Promise((resolve, reject) => {
    const resFunc = (res) => {
      resolve(res);
    };
    this.once('res', resFunc);
    this._get(host, path, (err) => {
      if (err) {
        if (this.options.verbose) {
          this.removeListener('res', resFunc);
          reject(err);
        }
      }
    })
  });
};

module.exports = Wifi;