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
var debug = false; // Pretty print any bytes in and out... it's amazing...
var verbose = true; // Adds verbosity to functions

const k = require('openbci-utilities').Constants;
var Wifi = require('../../index').Wifi;
var wifi = new Wifi({
  debug: debug,
  verbose: verbose,
  sendCounts: true
});

var timeOfLastSample = Date.now();

wifi.on('sample',(sample) => {
  try {
    const noww = Date.now();
    console.log(noww - timeOfLastSample);
    timeOfLastSample = noww;
  } catch (err) {
    console.log(err);
  }
});

wifi.once('wifiShield', (shield) => {
  wifi.connect(shield.ipAddress)
    .then(() => {
     return wifi.syncNumberOfChannels();
    })
    .then((info) => {
      return k.getSampleRateSetter(info.board_type, 2000);
    })
    .then((cmds) => {
      return wifi.write(cmds);
    })
    .then(() => {
      return wifi.streamStart();
    })
    .catch((err) => {
      console.log(err);
    });
  wifi.searchStop().catch(console.log);
});

wifi.searchStart().catch(console.log);

// const shield_uuid = "openbci-2af1.local";


function exitHandler (options, err) {
  if (options.cleanup) {
    if (verbose) console.log('clean');
    /** Do additional clean up here */
    if (wifi.isConnected()) wifi.disconnect().catch(console.log);
    wifi.removeAllListeners('rawDataPacket');
    wifi.removeAllListeners('sample');
    wifi.destroy();
  }
  if (err) console.log(err.stack);
  if (options.exit) {
    if (verbose) console.log('exit');
    if (wifi.isStreaming()) {
      wifi.streamStop()
        .then(() => {
          console.log('stream stopped');
          process.exit(0);
        }).catch(console.log);
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