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

var Wifi = require('../../index').Wifi;
var wifi = new Wifi({
  debug: debug,
  verbose: verbose,
  sendCounts: true
});

wifi.on('sample',(sample) => {
  try {
    console.log(sample.channelData);
  } catch (err) {
    console.log(err);
  }
});

wifi.once('wifiShield', (obj) => {
  const shieldIp = obj.rinfo.address;
  wifi.connect(shieldIp)
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