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
const handler = require("./handler");
const debug = require("debug")("config.js");
const fs = require("fs");
var em={};
var _config = {
	roles : {
		broker : false,
		coordinator : false,
		aggregator : false,
		sensor : false,
		controller : false,
	},
	roleChannels : {
		broker : [],
		coordinator : [],
		aggregator : [],
		sensor : [],
		controller : []
	},
	moscaEnabled : false,
	moscaPort : 1884,
	mqttServers : [],
	devicePath : "",
	device : {
		hiotId : "",
		name : "",
		description : "",
	}
};
function getRoles() {
	var roles = {
		broker : false,
		coordinator : false,
		aggregator : false,
		sensor : false,
		controller : false,
	};
	if(_config.roleChannels){
	if (_config.roleChannels.aggregator) {
		roles.aggregator = true;
	}
	if (_config.roleChannels.broker) {
		roles.broker = true;
	}
	if (_config.roleChannels.coordinator) {
		roles.coordinator = true;
	}
	if (_config.roleChannels.sensor) {
		roles.sensor = true;
	}
	if (_config.roleChannels.controller) {
		roles.controller = true;
	}
	}
	return roles;
}
module.exports = function(emitter){
	em=emitter;
return {
	getConfig () {
		//reload the configuration from disk
		var confTemp = JSON.parse(fs.readFileSync("./config.json", "utf8"));
		// If we don't have a devicePath, then we need to on-board

		_config.roleChannels = confTemp.roleChannels,
		_config.moscaEnabled = confTemp.moscaEnabled,
		_config.moscaPort = confTemp.moscaPort,
		_config.mqttServers = confTemp.mqttServers,
		_config.device = confTemp.device
		return {
			roles : getRoles(),
			device : _config.device,
			roleChannels : _config.roleChannels,
			moscaEnabled : _config.moscaEnabled,
			moscaPort : _config.moscaPort,
			mqttServers : _config.mqttServers
		};

	},
	setConfig (config) {
		//need some validation in here
		try {
			debug("*************** Resetting device config **********************");
			console.log("*************** Resetting device config **********************");
			fs.renameSync('./config.json', './config.json_backup');
			fs.writeFileSync("./config.json", config);
			em.emit("confUpdated");


		} catch (err) {
			debug(err);
		}
	}
};
}