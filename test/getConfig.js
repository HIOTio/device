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
var config = require("../config")(null);
// get the config file via ../config and parse

var devConf = config.getConfig()

describe("Config is valid json and contains a device Id", () => {
	it('config should be json', (done) => {
		devConf.should.be.json;
		done()

	})
	it('config should contain device id', () =>{
		devConf.should.have.property("device");
		devConf.device.should.have.property("deviceId");
	})
})