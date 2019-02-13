/* jslint es6 */
/**
 * This is an example from the readme.md
 * On windows you should run with PowerShell not git bash.
 * Install
 *   [nodejs](https://nodejs.org/en/)
 *
 * To run:
 *   change directory to this file `cd examples/debug`
 *   do `npm install`
 *   then `npm start`
 */
'use strict';
const OpenBCIConsts = require('@openbci/utilities').constants;
const OpenBCIWifi = require('../../openBCIWifi');

const deviceAddr = '10.0.1.3';

const wifi = new OpenBCIWifi({
  debug: false, // Pretty print bytes
  verbose: false, // Verbose output
  sendCounts: false,
  latency: 16667,
  protocol: 'tcp', // or "udp"
  burst: true
});

let counter = 0;
let sampleRateCounterInterval = null;
let lastSampleNumber = 0;
let MAX_SAMPLE_NUMBER = 255;
let droppedPacketArray = [];
let sampleRateArray = [];
let droppedPackets = 0;

const sum = (acc, cur) => acc + cur;

const sampleFunc = (sample) => {
  try {
    // console.log(JSON.stringify(sample));
    if (sample.valid) {
      counter++;
      if (sampleRateCounterInterval === null) {
        sampleRateCounterInterval = setInterval(() => {
          droppedPacketArray.push(droppedPackets);
          sampleRateArray.push(counter);

          const dpSum = droppedPacketArray.reduce(sum, 0);
          const srSum = sampleRateArray.reduce(sum, 0);

          console.log(`SR: ${counter}`);
          console.log(`Dropped ${droppedPackets} packets`);
          console.log(`Dropped packet average: ${dpSum / droppedPacketArray.length}`);
          console.log(`Sample rate average: ${srSum / sampleRateArray.length}`);

          droppedPackets = 0;
          counter = 0;
        }, 1000);
      }

      let packetDiff = sample.sampleNumber - lastSampleNumber;

      if (packetDiff < 0) packetDiff += MAX_SAMPLE_NUMBER;

      if (packetDiff > 1) {
        console.log(`dropped ${packetDiff} packets | cur sn: ${sample.sampleNumber} | last sn: ${lastSampleNumber}`);
        droppedPackets += packetDiff;
      }

      lastSampleNumber = sample.sampleNumber;
      // console.log(JSON.stringify(sample));
    }
  } catch (err) {
    console.log(err);
  }
};

wifi.on(OpenBCIConsts.OBCIEmitterImpedance, (impedance) => {
  console.log(JSON.stringify(impedance));
});

wifi.on(OpenBCIConsts.OBCIEmitterSample, sampleFunc);
// wifi.on(OpenBCIConsts.OBCIEmitterRawDataPacket, console.log);

wifi.connect({
  sampleRate: 200,
  streamStart: true,
  ipAddress: deviceAddr
})
  .then(() => {
    MAX_SAMPLE_NUMBER = wifi.getNumberOfChannels() === 4 ? 200 : 255;
  })
  .catch((err) => {
    console.log(err);
    process.exit(0);
  });

function exitHandler (options, err) {
  if (options.cleanup) {
    if (options.verbose) console.log('clean');
    /** Do additional clean up here */
    if (wifi.isConnected()) wifi.disconnect().catch(console.log);

    wifi.removeAllListeners('rawDataPacket');
    wifi.removeAllListeners('sample');
    wifi.destroy();

    if (sampleRateCounterInterval) clearInterval(sampleRateCounterInterval);
  }

  if (err) console.log(err.stack);

  if (options.exit) {
    if (options.verbose) console.log('exit');

    if (wifi.isStreaming()) {
      const _t = setTimeout(() => {
        console.log('timeout');
        process.exit(0);
      }, 1000);

      wifi.streamStop()
        .then(() => {
          console.log('stream stopped');
          if (_t) clearTimeout(_t);
          process.exit(0);
        }).catch((err) => {
          console.log(err);
          process.exit(0);
        });
    } else {
      process.exit(0);
    }
  }
}

if (process.platform === 'win32') {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', function () {
    process.emit('SIGINT');
  });
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, {
  cleanup: true
}));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true
}));
