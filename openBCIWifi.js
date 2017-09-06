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
  latency: 10000,
  sampleRate: 0,
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
 * @property {Number} sampleRate - The sample rate to set the board to. (Default is zero)
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
 * @constructor
 * @author AJ Keller (@aj-ptw)
 */
function Wifi (options) {
  if (!(this instanceof Wifi)) {
    return new Wifi(options);
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
  this._allInfo = null;
  this._boardConnected = false;
  this._boardInfo = null;
  this._boardType = k.OBCIBoardNone;
  this._connected = false;
  this._droppedPacketCounter = 0;
  this._firstPacket = true;
  this._ipAddress = null;
  this._info = null;
  this._latency = this.options.latency;
  this._lowerChannelsSampleObject = null;
  this._macAddress = null;
  this._multiPacketBuffer = null;
  this._numberOfChannels = 0;
  this._packetCounter = 0;
  this._peripheral = null;
  this._sampleRate = this.options.sampleRate;
  this._scanning = false;
  this._shieldName = null;
  this._shieldName = null;
  this._streaming = false;
  this._version = null;

  /** Public Properties (keep alphabetical) */
  this.curOutputMode = wifiOutputModeRaw;
  this.wifiShieldArray = [];

  /** Initializations */

  this.wifiInitServer();
}

// This allows us to use the emitter class freely outside of the module
util.inherits(Wifi, EventEmitter);

/**
 * @description Send a command to the board to turn a specified channel off
 * @param channelNumber
 * @returns {Promise.<T>}
 * @author AJ Keller (@aj-ptw)
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
 * @author AJ Keller (@aj-ptw)
 */
Wifi.prototype.channelOn = function (channelNumber) {
  return k.commandChannelOn(channelNumber).then((charCommand) => {
    // console.log('sent command to turn channel ' + channelNumber + ' by sending command ' + charCommand)
    return this.write(charCommand);
  });
};

/**
 * @description To send a channel setting command to the board
 * @param channelNumber - Number (1-16)
 * @param powerDown - Bool (true -> OFF, false -> ON (default))
 *          turns the channel on or off
 * @param gain - Number (1,2,4,6,8,12,24(default))
 *          sets the gain for the channel
 * @param inputType - String (normal,shorted,biasMethod,mvdd,temp,testsig,biasDrp,biasDrn)
 *          selects the ADC channel input source
 * @param bias - Bool (true -> Include in bias (default), false -> remove from bias)
 *          selects to include the channel input in bias generation
 * @param srb2 - Bool (true -> Connect this input to SRB2 (default),
 *                     false -> Disconnect this input from SRB2)
 *          Select to connect (true) this channel's P input to the SRB2 pin. This closes
 *              a switch between P input and SRB2 for the given channel, and allows the
 *              P input to also remain connected to the ADC.
 * @param srb1 - Bool (true -> connect all N inputs to SRB1,
 *                     false -> Disconnect all N inputs from SRB1 (default))
 *          Select to connect (true) all channels' N inputs to SRB1. This effects all pins,
 *              and disconnects all N inputs from the ADC.
 * @returns {Promise} resolves if sent, rejects on bad input or no board
 * @author AJ Keller (@aj-ptw)
 */
Wifi.prototype.channelSet = function (channelNumber, powerDown, gain, inputType, bias, srb2, srb1) {
  let arrayOfCommands = [];
  return new Promise((resolve, reject) => {
    k.getChannelSetter(channelNumber, powerDown, gain, inputType, bias, srb2, srb1)
      .then((val) => {
        arrayOfCommands = val.commandArray;
        this._rawDataPacketToSample.channelSettings[channelNumber - 1] = val.newChannelSettingsObject;
        return this.write(arrayOfCommands.join(''));
      }).then(resolve, reject);
  });
};

/**
 * @description To send an impedance setting command to the board
 * @param channelNumber {Number} (1-16)
 * @param pInputApplied {Boolean} (true -> ON, false -> OFF (default))
 * @param nInputApplied {Boolean} (true -> ON, false -> OFF (default))
 * @returns {Promise} resolves if sent, rejects on bad input or no board
 * @author AJ Keller (@aj-ptw)
 */
Wifi.prototype.impedanceSet = function (channelNumber, pInputApplied, nInputApplied) {
  let arrayOfCommands = [];
  return new Promise((resolve, reject) => {
    k.getImpedanceSetter(channelNumber, pInputApplied, nInputApplied)
      .then((val) => {
        return this.write(val.join(''));
      }).then(resolve, reject);
  });
};

/**
 * @description The essential precursor method to be called initially to establish a
 *              ble connection to the OpenBCI ganglion board.
 * @param o {Object}
 * @param o.examineMode {Boolean} - Set this option true to connect to the WiFi Shield even if there is no board attached.
 * @param o.ipAddress {String} - The ip address of the shield if you know it
 * @param o.latency {Number} - If you want to set the latency of the system you can here too.
 * @param o.sampleRate - The sample rate to set the board connected to the wifi shield
 * @param o.shieldName {String} - If supplied, will search for a shield by this name, if not supplied, will connect to
 *  the first shield found.
 * @param o.streamStart {Boolean} - Set `true` if you want the board to start streaming.
 * @returns {Promise} If the board was able to connect.
 * @author AJ Keller (@aj-ptw)
 */
Wifi.prototype.connect = function (o) {
  return new Promise((resolve, reject) => {
    let ipAddress = "";
    if (o.hasOwnProperty('ipAddress')) {
      ipAddress = o.ipAddress;
    } else if (o.hasOwnProperty('shieldName')) {
      _.forEach(this.wifiShieldArray, (shield) => {
        if (shield.localName === o.shieldName) {
          ipAddress = shield.ipAddress;
        }
      });
    }
    if (o.hasOwnProperty('latency')) {
      this._latency = o.latency;
    }
    this._ipAddress = ipAddress;
    if (this.options.verbose) console.log(`Attempting to connect to ${this._ipAddress}`);
    this._connectSocket()
      .then(() => {
        if (this.options.verbose) console.log(`Connected to ${this._ipAddress}`);
        this._connected = true;
        return this.syncInfo(o);
      })
      .then(() => {
        if (this.options.verbose) console.log(`Synced info with ${this._shieldName}`);
        if (o.hasOwnProperty('sampleRate')) {
          if (this.options.verbose) console.log(`Attempting to set sample rate to ${o.sampleRate}`);
          return this.setSampleRate(o.sampleRate);
        }
        if (o.hasOwnProperty('examineMode')) {
          if (o.examineMode) return Promise.resolve(0);
        }
        return this.syncSampleRate();
      })
      .then((sampleRate) => {
        if (this.options.verbose) console.log(`Sample rate is ${sampleRate}`);
        this._sampleRate = sampleRate;
        if (o.hasOwnProperty('streamStart')) {
          if (o.streamStart) {
            if (this.options.verbose) console.log('Attempting to start stream');
            return this.streamStart();
          }
        }
        return Promise.resolve();
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        this._ipAddress = null;
        this._shieldName = null;
        this._connected = false;
        reject(err);
      });
  });
};

/**
 * @description Closes the connection to the board. Waits for stop streaming command to
 *  be sent if currently streaming.
 * @returns {Promise} - fulfilled by a successful close, rejected otherwise.
 * @author AJ Keller (@aj-ptw)
 */
Wifi.prototype.disconnect = function () {
  this._disconnected();
  return Promise.resolve();
};

Wifi.prototype.eraseCredentials = function () {
  this.delete
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
 * @description Get the current board type
 * @returns {*}
 */
Wifi.prototype.getBoardType = function () {
  return this._boardType;
};

/**
 * @description Get the firmware version of connected and synced wifi shield.
 * @returns {String} The version number
 * Note: This is dependent on if you called connect
 */
Wifi.prototype.getFirmwareVersion = function () {
  return this._version;
};

/**
 * Return the ip address of the attached WiFi Shield device.
 * @return {null|String}
 */
Wifi.prototype.getIpAddress = function () {
  return this._ipAddress;
};

/**
 * Return the latency to be set on the WiFi Shield.
 * @return {Number}
 */
Wifi.prototype.getLatency = function () {
  return this._latency;
};

/**
 * Return the MAC address of the attached WiFi Shield device.
 * @return {null|String}
 */
Wifi.prototype.getMacAddress = function () {
  return this._macAddress;
};

/**
 * @description This function is used as a convenience method to determine how many
 *              channels the current board is using.
 * @returns {Number} A number
 * Note: This is dependent on if your wifi shield is attached to another board and how many channels are there.
 * @author AJ Keller (@aj-ptw)
 */
Wifi.prototype.getNumberOfChannels = function () {
  return this._numberOfChannels;
};

/**
 * @description Get the the current sample rate is.
 * @returns {Number} The sample rate
 * Note: This is dependent on if you configured the board correctly on setup options
 */
Wifi.prototype.getSampleRate = function () {
  return this._sampleRate;
};

/**
 * Return the shield name of the attached WiFi Shield device.
 * @return {null|String}
 */
Wifi.prototype.getShieldName = function () {
  return this._shieldName;
};

/**
 * Call to start testing impedance.
 * @return {global.Promise|Promise}
 */
Wifi.prototype.impedanceStart = function () {
  if (this.getBoardType() !== k.OBCIBoardGanglion) return Promise.reject(Error('Expected board type to be Ganglion'));
  return this.write(k.OBCIGanglionImpedanceStart);
};

/**
 * Call to stop testing impedance.
 * @return {global.Promise|Promise}
 */
Wifi.prototype.impedanceStop = function () {
  if (this.getBoardType() !== k.OBCIBoardGanglion) return Promise.reject(Error('Expected board type to be Ganglion'));
  return this.write(k.OBCIGanglionImpedanceStop);
};

/**
 * Used to search for an OpenBCI WiFi Shield. Will connect to the first one if no `shieldName` is supplied.
 * @param o {Object} (optional)
 * @param o.sampleRate - The sample rate to set the board connected to the wifi shield
 * @param o.shieldName {String} - If supplied, will search for a shield by this name, if not supplied, will connect to
 *  the first shield found.
 * @param o.streamStart {Boolean} - Set `true` if you want the board to start streaming.
 * @param o.timeout {Number} - The time in milli seconds to wait for the system to try and auto find and connect to the
 *  shield.
 * @return {Promise} - Resolves after successful connection, rejects otherwise with Error.
 */
Wifi.prototype.searchToStream = function (o) {
  return new Promise((resolve, reject) => {
    let autoFindTimeOut = null;
    let timeout = 10000;
    if (o.hasOwnProperty('timeout')) timeout = o.timeout;
    this.once(k.OBCIEmitterWifiShield, (shield) => {
      if (o.hasOwnProperty('shieldName')) {
        if (!_.eq(o.shieldName, shield.localName)) return;
      }
      if (autoFindTimeOut) clearTimeout(autoFindTimeOut);
      o['ipAddress'] = shield.ipAddress;
      this.searchStop()
        .then(() => {
          return this.connect(o);
        })
        .then(() => {
          if (this.options.verbose) console.log('Done with search connect and sync');
          resolve();
        })
        .catch((err) => {
          reject(err);
          console.log(err);
        });
    });
    this.searchStart().catch(console.log);

    autoFindTimeOut = setTimeout(() => {
      this.searchStop().catch(console.log);
      reject(Error(`Failed to autoFindAndConnectToWifiShield within ${timeout} ms`));
    }, timeout);
  });
};

/**
 * Set the sample rate of the remote OpenBCI shield
 * @param sampleRate {Number} the sample rate you want to set to.
 * @returns {Promise}
 */
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
 * Returns the sample rate from the board
 * @returns {Promise}
 */
Wifi.prototype.syncSampleRate = function () {
  const numPattern = /\d+/g;
  return new Promise((resolve, reject) => {
    this.write(`${k.OBCISampleRateSet}${k.OBCISampleRateCmdGetCur}`)
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
  this.emit('scanStopped'); // TODO: When 0.2.4 util is merged change to const
  return Promise.resolve();
};

/**
 * @description Start logging to the SD card. If not streaming then `eot` event will be emitted with request
 *      response from the board.
 * @param recordingDuration {String} - The duration you want to log SD information for. Limited to:
 *      '14sec', '5min', '15min', '30min', '1hour', '2hour', '4hour', '12hour', '24hour'
 * @returns {Promise} - Resolves when the command has been written.
 * @private
 * @author AJ Keller (@aj-ptw)
 */
Wifi.prototype.sdStart = function (recordingDuration) {
  return new Promise((resolve, reject) => {
    if (!this.isConnected()) return reject(Error('Must be connected to the device'));
    k.sdSettingForString(recordingDuration)
      .then(command => {
        return this.write(command);
      })
      .then((res) => {
        resolve(res);
      })
      .catch(err => reject(err));
  });
};

/**
 * @description Sends the stop SD logging command to the board. If not streaming then `eot` event will be emitted
 *      with request response from the board.
 * @returns {Promise} - Resolves when written
 * @author AJ Keller (@aj-ptw)
 */
Wifi.prototype.sdStop = function () {
  return new Promise((resolve, reject) => {
    if (!this.isConnected()) return reject(Error('Must be connected to the device'));
    // If we are not streaming, then expect a confirmation message back from the board
    this.write(k.OBCISDLogStop)
      .then((res) => {
        if (this.options.verbose) console.log('Sent sd stop to board.');
        resolve(res);
      })
      .catch(reject);
  });
};

/**
 * @description Syncs the internal channel settings object with a cyton, this will take about
 *  over a second because there are delays between the register reads in the firmware.
 * @returns {Promise.<T>|*} Resolved once synced, rejects on error or 2 second timeout
 * @author AJ Keller (@aj-ptw)
 */
Wifi.prototype.syncRegisterSettings = function () {
  return new Promise((resolve, reject) => {
    this.write(k.OBCIMiscQueryRegisterSettings)
      .then((res) => {
        this._rawDataPacketToSample.data = Buffer.from(res);
        try {
          obciUtils.syncChannelSettingsWithRawData(this._rawDataPacketToSample);
          resolve(this._rawDataPacketToSample.channelSettings);
        } catch (e) {
          reject(e);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * @description Sends a soft reset command to the board
 * @returns {Promise} - Fulfilled if the command was sent to board.
 * @author AJ Keller (@aj-ptw)
 */
Wifi.prototype.softReset = function () {
  return this.write(k.OBCIMiscSoftReset);
};

/**
 * @description Tells the WiFi Shield to forget it's network credentials. This will cause the board to drop all
 *  connections.
 * @returns {Promise} Resolves when WiFi Shield has been reset and the module disconnects.
 */
Wifi.prototype.eraseWifiCredentials = function () {
  return new Promise((resolve, reject) => {
    let result = "";
    this.delete('/wifi')
      .then((res) => {
        if (this.options.verbose) console.log(res);
        return this.disconnect();
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        if (this.options.verbose) console.log(err);
        reject(err);
      })
  });
};

/**
 * @description Sends a start streaming command to the board.
 * @returns {Promise} indicating if the signal was able to be sent.
 * Note: You must have successfully connected to an OpenBCI board using the connect
 *           method. Just because the signal was able to be sent to the board, does not
 *           mean the board will start streaming.
 * @author AJ Keller (@aj-ptw)
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
 * @author AJ Keller (@aj-ptw)
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

/**
 * Sync the info of this wifi module
 * @param o {Object}
 * @param o.examineMode {Boolean} - Set this option true to connect to the WiFi Shield even if there is no board attached.
 * @returns {Promise.<TResult>}
 */
Wifi.prototype.syncInfo = function (o) {
  return this.get('/board')
    .then((info) => {
      try {
        info = JSON.parse(info);
        this._boardConnected = info['board_connected'];
        this._numberOfChannels = info['num_channels'];
        this._boardType = info['board_type'];
        if (o.hasOwnProperty('examineMode')) {
          if (!o.examineMode && !this._boardConnected) {
            return Promise.reject(Error('No OpenBCI Board (Ganglion or Cyton) connected, please check power of the boards'));
          }
        } else {
          if (!this._boardConnected) return Promise.reject(Error('No OpenBCI Board (Ganglion or Cyton) connected, please check power of the boards'));
        }

        const channelSettings = k.channelSettingsArrayInit(this.getNumberOfChannels());
        _.forEach(channelSettings, (settings, index) => {
          settings['gain'] = info['gains'][index];
        });
        this._rawDataPacketToSample.channelSettings = channelSettings;
        if (this.options.verbose) console.log(`Got all info from GET /board`);
        this._boardInfo = info;
        return this.get('/all');
      } catch (err) {
        return Promise.reject(err);
      }
    })
    .then((allInfo) => {
      allInfo = JSON.parse(allInfo);
      this._shieldName = allInfo.name;
      this._macAddress = allInfo.mac;
      this._version = allInfo.version;
      this._latency = allInfo.latency;
      this._allInfo = allInfo;
      return Promise.resolve(this._boardInfo);
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
 * @author AJ Keller (@aj-ptw)
 */
Wifi.prototype.write = function (data) {
  return new Promise((resolve, reject) => {
    if (this._ipAddress) {
      if (!Buffer.isBuffer(data)) {
        if (_.isArray(data)) {
          data = Buffer.alloc(data.length, data.join(''));
        } else {
          data = new Buffer(data);
        }
      }
      if (this.options.debug) obciDebug.debugBytes('>>>', data);
      this.post('/command', {'command': data.toString()})
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        })
    } else {
      reject('ipAddress is not set. Please call connect with ip address of wifi shield');
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

    if (samples.length > 0) {
      if (samples[0].hasOwnProperty('impedanceValue')) {
        _.forEach(samples, (impedance) => {
          this.emit(k.OBCIEmitterImpedance, impedance);
        });
      } else {
        _.forEach(samples, (sample) => {
          if (this.getBoardType() === k.OBCIBoardDaisy) {
            // Send the sample for downstream sample compaction
            this._finalizeNewSampleForDaisy(sample);
          } else {
            // console.log(JSON.stringify(sample));
            this.emit(k.OBCIEmitterSample, sample);
          }
        });
      }
    }

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
 * @author AJ Keller (@aj-ptw)
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
 * @private
 */
Wifi.prototype._connectSocket = function () {
  return this.post('/tcp', {
    ip: ip.address(),
    output: this.curOutputMode,
    port: this.wifiGetLocalPort(),
    delimiter: false,
    latency: this._latency
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

Wifi.prototype._delete = function (host, path, cb) {
  const options = {
    host: host,
    port: 80,
    path: path,
    method: 'DELETE'
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
    if (this.options.verbose) console.log(`DELETE problem with request: ${e.message}`);
    if (cb) cb(e);
  });

  req.end();
};

Wifi.prototype.delete = function (path) {
  return new Promise((resolve, reject) => {
    const resFunc = (res) => {
      resolve(res);
    };
    this.once('res', resFunc);
    this._delete(this._ipAddress, path, (err) => {
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

Wifi.prototype.get = function (path) {
  return new Promise((resolve, reject) => {
    const resFunc = (res) => {
      resolve(res);
    };
    this.once('res', resFunc);
    this._get(this._ipAddress, path, (err) => {
      if (err) {
        if (this.options.verbose) {
          this.removeListener('res', resFunc);
          reject(err);
        }
      }
    })
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
Wifi.prototype.post = function (path, payload) {
  return new Promise((resolve, reject) => {
    const resFunc = (res) => {
      resolve(res);
    };
    this.once('res', resFunc);
    this._post(this._ipAddress, path, payload, (err) => {
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