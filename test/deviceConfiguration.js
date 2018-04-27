/********************************************************************************
 * Copyright (c) 2017-2018 Mark Healy 
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0 
 *
 ********************************************************************************/

var should = require("should");
const {expect} = require('chai')
var chai = require('chai');
chai.use(require('chai-match'));
var mqtt = require("mqtt");
var config = require("../config")(null);
// get the config file via ../config and parse

var devConf = config.getConfig()

describe("Device is correctly configured", () => {
	if (devConf.device.devicePath) {
		const device = devConf.device;
		it("Device has a properly formatted path assigned", () => {
			expect(device.devicePath).to.match(/[0-9A-Z]\/+[0-9A-Z]/) //TODO: fix regex
		})
		it("Polling for health (device.healthTimer) must be specified", () => {
			device.healthTimer.should.be.number;
		})	
		it("Config has a roleChannels object", ()=>{
			devConf.roleChannels.should.be.object;
		})
		it("Config has MQTT servers specified",()=>{
			devConf.mqttServers.should.be.object;
		})
	}
})