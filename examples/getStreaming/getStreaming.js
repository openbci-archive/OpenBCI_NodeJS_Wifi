/* jslint es6 */
/**
 * This is an example from the readme.md
 * On windows you should run with PowerShell not git bash.
 * Install
 *   [nodejs](https://nodejs.org/en/)
 *
 * To run:
 *   change directory to this file `cd examples/getStreaming`
 *   do `npm install`
 *   then `npm start`
 */
'use strict';
const OBCIConsts = require('@openbci/utilities').constants;
const OBCIWifi = require('../../openBCIWifi');

const wifi = new OBCIWifi({
  debug: false, // Pretty print bytes
  verbose: true, // Verbose output
  sendCounts: false,
  latency: 16667,
  protocol: 'tcp' // or "udp"
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
    console.error(err);
  }
};

wifi.on(OBCIConsts.OBCIEmitterImpedance, (impedance) => {
  console.log(JSON.stringify(impedance));
});

wifi.on(OBCIConsts.OBCIEmitterSample, sampleFunc);
// wifi.on(OBCIConsts.OBCIEmitterRawDataPacket, console.log);

wifi.searchToStream({
  streamStart: true,
  sampleRate: 200
})
  .then(() => {
    MAX_SAMPLE_NUMBER = wifi.getNumberOfChannels() === 4 ? 200 : 255;
  })
  .catch((err) => {
    console.error(err);
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

  if (err) console.error(err.stack);

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
          console.error(err);
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

// Perform actions on exit
process.on('exit', exitHandler.bind(null, {
  cleanup: true
}));

// Perform actions on SIGINT
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));

// Perform actions on uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true
}));
