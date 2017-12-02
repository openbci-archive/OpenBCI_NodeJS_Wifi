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
let debug = false; // Pretty print any bytes in and out... it's amazing...
let verbose = false; // Adds verbosity to functions
const protocol = 'udp'; // or 'udp'

const k = require('openbci-utilities').Constants;
let Wifi = require('../../openBCIWifi');
let wifi = new Wifi({
  debug: debug,
  verbose: verbose,
  sendCounts: false,
  latency: 16667,
  protocol: protocol,
  burst: true
});

let counter = 0;
let sampleRateCounterInterval = null;
let lastSampleNumber = 0;
let MAX_SAMPLE_NUMBER = 255;
let droppedPacketArray = [];
let sampleRateArray = [];
let droppedPackets = 0;
const sampleFunc = (sample) => {
  try {
    // console.log(JSON.stringify(sample));
    if (sample.valid) {
      counter++;
      if (sampleRateCounterInterval === null) {
        sampleRateCounterInterval = setInterval(() => {
          console.log(`\nSR: ${counter}`);
          console.log(`Dropped ${droppedPackets} packets`);
          droppedPacketArray.push(droppedPackets);
          let sum = 0;
          droppedPacketArray.map((droppedPacketCnt) => {
            sum += droppedPacketCnt;
          });
          console.log(`Dropped packet average: ${sum / droppedPacketArray.length}`);

          sampleRateArray.push(counter);
          sum = 0;
          sampleRateArray.map((counter) => {
            sum += counter;
          });
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

wifi.on(k.OBCIEmitterImpedance, (impedance) => {
  console.log(JSON.stringify(impedance));
});
wifi.on(k.OBCIEmitterSample, sampleFunc);
// wifi.on(k.OBCIEmitterRawDataPacket, console.log);

// wifi.searchToStream({
//     streamStart: true,
//     sampleRate: 1000
//   })
wifi.connect({
    sampleRate: 4000,
    streamStart: true,
    ipAddress: '192.168.4.1'
  })
  .then(() => {
    if (wifi.getNumberOfChannels() === 4) {
      MAX_SAMPLE_NUMBER = 200;
    } else {
      MAX_SAMPLE_NUMBER = 255;
    }
  })
  .catch((err) => {
    console.log(err);
    process.exit(0);
  });

function exitHandler (options, err) {
  if (options.cleanup) {
    if (verbose) console.log('clean');
    /** Do additional clean up here */
    if (wifi.isConnected()) wifi.disconnect().catch(console.log);
    wifi.removeAllListeners('rawDataPacket');
    wifi.removeAllListeners('sample');
    wifi.destroy();
    if (sampleRateCounterInterval) {
      clearInterval(sampleRateCounterInterval);
    }
  }
  if (err) console.log(err.stack);
  if (options.exit) {
    if (verbose) console.log('exit');
    if (wifi.isStreaming()) {
      let timmy = setTimeout(() => {
        console.log("timeout");
        process.exit(0);
      }, 1000);
      wifi.streamStop()
        .then(() => {
          console.log('stream stopped');
          if (timmy) clearTimeout(timmy);
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

if (process.platform === "win32") {
  const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
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