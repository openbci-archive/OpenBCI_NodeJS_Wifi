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
const defaultChannelSettingsArray = k.channelSettingsArrayInit(k.OBCINumberOfChannelsDefault);

const _options = {
  debug: false,
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
 * @description The initialization method to call first, before any other method.
 * @param options {object} (optional) - Board optional configurations.
 *     - `debug` {Boolean} - Print out a raw dump of bytes sent and received. (Default `false`)
 *
 *     - `sendCounts` {Boolean} - Send integer raw counts instead of scaled floats.
 *           (Default `false`)
 *
 *     - `simulate` {Boolean} - (IN-OP) Full functionality, just mock data. Must attach Daisy module by setting
 *                  `simulatorDaisyModuleAttached` to `true` in order to get 16 channels. (Default `false`)
 *
 *     - `simulatorBoardFailure` {Boolean} - (IN-OP)  Simulates board communications failure. This occurs when the RFduino on
 *                  the board is not polling the RFduino on the dongle. (Default `false`)
 *
 *     - `simulatorHasAccelerometer` - {Boolean} - Sets simulator to send packets with accelerometer data. (Default `true`)
 *
 *     - `simulatorInjectAlpha` - {Boolean} - Inject a 10Hz alpha wave in Channels 1 and 2 (Default `true`)
 *
 *     - `simulatorInjectLineNoise` {String} - Injects line noise on channels.
 *          3 Possible Options:
 *              `60Hz` - 60Hz line noise (Default) [America]
 *              `50Hz` - 50Hz line noise [Europe]
 *              `none` - Do not inject line noise.
 *
 *     - `simulatorSampleRate` {Number} - The sample rate to use for the simulator. Simulator will set to 125 if
 *                  `simulatorDaisyModuleAttached` is set `true`. However, setting this option overrides that
 *                  setting and this sample rate will be used. (Default is `250`)
 *
 *     - `verbose` {Boolean} - Print out useful debugging events. (Default `false`)
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

  // Set to global options object
  this.options = clone(opts);

  /** Private Properties (keep alphabetical) */
  this._accelArray = [0, 0, 0];
  this._connected = false;
  this._droppedPacketCounter = 0;
  this._firstPacket = true;
  this._localName = null;
  this._multiPacketBuffer = null;
  this._numberOfChannels = 0;
  this._packetCounter = 0;
  this._peripheral = null;
  this._scanning = false;
  this._streaming = false;

  /** Public Properties (keep alphabetical) */
  this.curOutputMode = wifiOutputModeRaw;
  this.peripheralArray = [];
  this.previousPeripheralArray = [];
  this.wifiPeripheralArray = [];

  /** Initializations */

  this.wifiInitServer();
  if (callback) callback();
}

// This allows us to use the emitter class freely outside of the module
util.inherits(Wifi, EventEmitter);

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
    this._connectSocket(id, (err) => {
      if (err) return reject(err);
      else return resolve();
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
Wifi.prototype.numberOfChannels = function () {
  return this._numberOfChannels;
};

/**
 * @description Get the the current sample rate is.
 * @returns {Number} The sample rate
 * Note: This is dependent on if you configured the board correctly on setup options
 */
Wifi.prototype.sampleRate = function () {
  if (this.options.simulate) {
    return this.options.simulatorSampleRate;
  } else {
    return k.OBCISampleRate200;
  }
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
    let _attempts = 4; // Retry 4 times. Sometimes ssdp stalls out...
    let _timeout = 3 * 1000; // Retry every 3 seconds
    let timeoutFunc = () => {
      if (attemptCounter < _attempts) {
        this.wifiClient.stop();
        this.wifiClient.search('urn:schemas-upnp-org:device:Basic:1');
        attemptCounter++;
        if (this.options.verbose) console.log(`SSDP: still trying to find a board - attempt ${attemptCounter} of ${_attempts}`);
        this.ssdpTimeout = setTimeout(timeoutFunc, _timeout);
      } else {
        if (this.options.verbose) console.log('SSDP: stopping because out of attempts');
        this.searchStop();
      }
    };
    this.wifiClient.on('response', (headers, code, rinfo) => {
      if (this.options.verbose) console.log('SSDP:Got a response to an m-search:\n%d\n%s\n%s', code, JSON.stringify(headers, null, '  '), JSON.stringify(rinfo, null, '  '));
      this.emit('wifiShield', { headers, code, rinfo });
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

Wifi.prototype.syncNumberOfChannels = function () {
  return this.get(this._localName, '/all')
    .then((res) => {
      const info = JSON.parse(res);
      this._numberOfChannels = info['num_channels'];
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
        data = new Buffer(data);
      }
      if (this.options.debug) obciDebug.debugBytes('>>>', data);
      this.post(
        this._localName,
        '/command',
        {'command': data.toString()},
        (err) => {
          if (err) reject(err);
          else resolve();
        });
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
    const samples = obciUtils.transformRawDataPacketsToSample({
      rawDataPackets: output.rawDataPackets,
      gains: defaultChannelSettingsArray,
      scale: !this.options.sendCounts
    });

    _.forEach(samples, (sample) => {
      this.emit('sample', sample);
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
 * Used for client connecting to
 * @param shieldIP {String} - The local ip address. Or host name on mac or if using bonjour (windows/linux)
 * @param cb
 * @private
 */
Wifi.prototype._connectSocket = function (shieldIP, cb) {
  this._localName = shieldIP;
  this.post(shieldIP, '/tcp', {
    ip: ip.address(),
    output: this.curOutputMode,
    port: this.wifiGetLocalPort(),
    delimiter: false,
    latency: "5000"
  }, cb);
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
    // socket.on('data', (data) => {
      // this._processBytes(data);
      // console.log(data.toString());
      // streamJSON.write(data);
      // if (persistentBuffer !== null) persistentBuffer = Buffer.concat([persistentBuffer, data]);
      // else persistentBuffer = data;
      //
      // if (persistentBuffer) {
      //   let bytesIn = persistentBuffer.byteLength;
      //   if (bytesIn > 2) {
      //     let head = 2;
      //     let tail = 0;
      //     while (head < bytesIn - 2) {
      //       if (delimBuf.compare(persistentBuffer, head-2, head) === 0) {
      //         try {
      //           const obj = JSON.parse(persistentBuffer.slice(tail, head-2));
      //           console.log(obj.chunk);
      //           if (head < bytesIn - 2) {
      //             tail = head;
      //           }
      //         } catch (e) {
      //           console.log(persistentBuffer.slice(tail, head-2).toString());
      //           persistentBuffer = persistentBuffer.slice(head);
      //           return;
      //         }
      //
      //       }
      //       head++;
      //     }
      //
      //     if (tail < bytesIn - 2) {
      //       persistentBuffer = persistentBuffer.slice(tail);
      //     } else {
      //       persistentBuffer = null;
      //     }
      //
      //   }
      // }

    // });
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
    if (!this.isConnected()) return reject(Error('Please call connect(ipAddr) where ipAddr is the wifi shield local address'));
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
    if (!this.isConnected()) return reject(Error('Please call connect(ipAddr) where ipAddr is the wifi shield local address'));
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