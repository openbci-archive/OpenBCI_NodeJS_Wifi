'use strict';
const bluebirdChecks = require('./bluebirdChecks');
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const should = chai.should(); // eslint-disable-line no-unused-vars
const Wifi = require('../openBCIWifi');
const OpenBCIUtilities = require('openbci-utilities');
const openBCIUtilities = OpenBCIUtilities.Utilities;
const k = OpenBCIUtilities.Constants;
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const bufferEqual = require('buffer-equal');
const fs = require('fs');
const math = require('mathjs');
const dirtyChai = require('dirty-chai');
const Buffer = require('safe-buffer').Buffer;

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.use(dirtyChai);

describe('openbci-wifi', function () {
  /**
  * Test the function that parses an incoming data buffer for packets
  */
  describe('#bufferRawDataPackets', function () {
    let wifi = new Wifi();

    beforeEach(() => {
      wifi = new Wifi();
    });

    it('should buffer raw data packets and return no data packets', () => {
      // declare the array of raw packets
      let rawDataPackets = [
        openBCIUtilities.samplePacketReal(0),
        openBCIUtilities.samplePacketReal(1),
        openBCIUtilities.samplePacketReal(2)
      ];

      // Call the function under test
      let rawDataPacketsOutput = wifi.bufferRawDataPackets(rawDataPackets);

      // Ensure that no buffers were output
      expect(rawDataPacketsOutput).to.deep.equal([]);
      expect(wifi.internalRawDataPackets).to.deep.equal(rawDataPackets);
    });
    it('should output old data in internal raw packet buffer even if duplicate in current packets', () => {
      // declare the array of raw packets
      let rawDataPackets = [
        openBCIUtilities.samplePacketReal(0),
        openBCIUtilities.samplePacketReal(1),
        openBCIUtilities.samplePacketReal(2)
      ];

      // Call the function under test one time to preload buffer
      wifi.bufferRawDataPackets(rawDataPackets);

      // Then push in the same raw data packets but more as if the first one took a while to send
      //  and then the first three got sent again for good measure
      rawDataPackets = [
        openBCIUtilities.samplePacketReal(0),
        openBCIUtilities.samplePacketReal(1),
        openBCIUtilities.samplePacketReal(2),
        openBCIUtilities.samplePacketReal(3),
        openBCIUtilities.samplePacketReal(4),
        openBCIUtilities.samplePacketReal(5)
      ];

      // Call the function under test
      let rawDataPacketsOutput = wifi.bufferRawDataPackets(rawDataPackets);

      // Ensure that the first three buffers were output
      expect(rawDataPacketsOutput).to.deep.equal([
        openBCIUtilities.samplePacketReal(0),
        openBCIUtilities.samplePacketReal(1),
        openBCIUtilities.samplePacketReal(2)
      ]);
      expect(wifi.internalRawDataPackets).to.deep.equal([
        openBCIUtilities.samplePacketReal(3),
        openBCIUtilities.samplePacketReal(4),
        openBCIUtilities.samplePacketReal(5)
      ]);
    });
    it('should output old data in internal buffer if no duplicate', () => {
      // declare the array of raw packets
      let rawDataPackets = [
        openBCIUtilities.samplePacketReal(0),
        openBCIUtilities.samplePacketReal(1),
        openBCIUtilities.samplePacketReal(2)
      ];

      // Call the function under test
      wifi.bufferRawDataPackets(rawDataPackets);

      // Then push in good packets
      rawDataPackets = [
        openBCIUtilities.samplePacketReal(3),
        openBCIUtilities.samplePacketReal(4),
        openBCIUtilities.samplePacketReal(5)
      ];

      // Call the function under test
      const rawDataPacketsOutput = wifi.bufferRawDataPackets(rawDataPackets);

      // Ensure that the first three buffers were output
      expect(rawDataPacketsOutput).to.deep.equal([
        openBCIUtilities.samplePacketReal(0),
        openBCIUtilities.samplePacketReal(1),
        openBCIUtilities.samplePacketReal(2)
      ]);
      expect(wifi.internalRawDataPackets).to.deep.equal([
        openBCIUtilities.samplePacketReal(3),
        openBCIUtilities.samplePacketReal(4),
        openBCIUtilities.samplePacketReal(5)
      ]);
    });
  });
});
