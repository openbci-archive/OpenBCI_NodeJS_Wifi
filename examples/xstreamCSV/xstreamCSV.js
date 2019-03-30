/* jslint es6 */
'use strict';
const fs = require('fs');
const OBCIConst = require('@openbci/utilities').constants;
const Wifi = require('../../openBCIWifi');
const xs = require('xstream').Stream;

// GLOBALS
const deviceAddr = '10.0.1.3';
let f_ = null; // WriteStream, assigned by wifi.connect({...})

const wifi = new Wifi({
  debug: false,
  verbose: false,
  sendCounts: false,
  latency: 20000,
  protocol: 'tcp'
});

// PRODUCERS
const OBCIDataStream = {
  start: (listener) => {
    wifi.on(OBCIConst.OBCIEmitterSample, (s) => {
      listener.next(s);
    });
  },
  stop: () => {
    console.log('OBCIDataStream stop');
  }
};
const data_ = xs.create(OBCIDataStream);

// LISTENERS
const CSVWriter = {
  next: (v) => {
    const row = [v.sampleNumber, v.timestamp, ...v.channelData, ...v.accelData, v.valid].join(',');
    f_.write(row + '\n');
  },
  error: (err) => console.error(err),
  complete: () => console.log('CSVWriter complete')
};

const StreamPrinter = {
  next: (v) => console.log(v),
  error: (e) => console.error(e),
  complete: () => console.log('StreamPrinter complete')
};

// APPLICATION CODE
wifi.connect({
  ipAddress: deviceAddr,
  sampleRate: 200,
  streamStart: false
}).then(() => {
  f_ = fs.createWriteStream(`${Date.now()}-${wifi.getShieldName()}-${wifi.getSampleRate()}hz.csv`);
  f_.write('sample,t,ch1,ch2,ch3,ch4,x,y,z,valid\n');
  wifi.streamStart().then(() => {
    data_.addListener(CSVWriter);
    data_.addListener(StreamPrinter);
  });
});

// HANDLERS
const exitHandler = (opt, err) => {
  if (opt.cleanup) {
    console.log('Disconnect');
    if (wifi.isConnected()) wifi.disconnect().catch(console.log);
    wifi.removeAllListeners('rawDataPacket');
    wifi.removeAllListeners('sample');
    wifi.destroy();
  }

  if (err) console.error(err);

  if (wifi.isStreaming()) {
    const tOut = setTimeout(() => {
      console.log('Stream timed out');
      process.exit(0);
    }, 1000);

    wifi.streamStop()
      .then(() => {
        console.log('WiFi stream stop');
        if (tOut) clearTimeout(tOut);
        OBCIDataStream.stop();
        f_.end();
        process.exit(0);
      })
      .catch((err) => {
        console.error(err);
        process.exit(0);
      });
  } else {
    process.exit(0);
  }
};

process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
