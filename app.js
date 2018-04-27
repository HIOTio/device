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


const debug = require("debug")("index.js");
var messaging = {};

const e = require("events");
const em = new e.EventEmitter();
const config = require("./config")(em);
const device = require("./device");
var mqttClient = {};
var restarting = false; //waittoClose was looping...
var localServer = {};
var timers = [];
function initialize() {
	var _config = config.getConfig();
	//if we don't have a device path, then we need to on-board
	if (!_config.device.devicePath) {
		//pass the config object to the device object
		debug("onboarding device")
		device.onBoard(_config, config);
	} else {
		//have a device Path, so we can set up the various roles, pubs and subs
		debug("loading device config")
		var deviceconf = device.init(_config.device, em);
		var localMqttClient = [];

		// connect to the specified messaging server(s)

		/*
		 * TODO: Need to refactor here.
		 * Messaging should be an array of MQTT (or other) clients
		 * downstream (moving away from the platform to devices)
		 * upstream (moving from devices to the platform)
		 * platform (for coordinators to subscribe to and publish on when communicating with the platform)
		 * 
		 * i.e. 
		 * - aggregators should subscribe to "downstream" brokers and publish on "upstream"
		 * - delegators shouls subscribe to "upstream" and publish on "downstream"
		 * - sensors should publish on upstream
		 * - controllers should subscribe on upstream
		 * 
		 * 
		 * 
		 */
		messaging = require("./messaging")(_config.mqttServers);
		// set up a local messaging server (MQTT broker) if configured
		setup(deviceconf);
		if (_config.moscaEnabled) {
			debug("local messaging server running");
			localServer = messaging.server(_config);
		}
		mqttClient = messaging.connections;



		if (_config.roleChannels.aggregator) {
			const aggregator = require("./roles/aggregator");
			setup(aggregator.init(_config.roleChannels.aggregator));
		}

		if (_config.roleChannels.delegator) {
			const delegator = require("./roles/delegator");
			setup(delegator.init(_config.roleChannels.delegator, mqttClient));
		}

		if (_config.roleChannels.sensor) {
			const sensor = require("./roles/sensor");
			setup(sensor.init(_config.roleChannels.sensor, mqttClient));
		}
		if (_config.roleChannels.controller) {
			const controller = require("./roles/controller");
			setup(controller.init(_config.roleChannels.controller, mqttClient));
		}
		if (_config.roleChannels.coordinator) {
			const coordinator = require("./roles/coordinator");
			setup(coordinator.init(_config.roleChannels.coordinator, mqttClient, _config.device.deployment));
		}
		if (_config.roleChannels.commander) {
			const commander = require("./roles/commander");
			setup(commander.init(_config.roleChannels.commander, mqttClient));
		}
	}


}
// set up any required timers or subscriptions for each role
function setup(settings) {
	if (settings.timers) {
		addTimers(settings.timers);
	}
	if (settings.topics) {
		if (settings.topics.downstream) {
			subsAdd("d", settings.topics.downstream);
		}
		if (settings.topics.upstream) {
			subsAdd("u", settings.topics.upstream);
		}
		if (settings.topics.platform) {
			subsAdd("p", settings.topics.platform);
		}
	}

}
function addTimers(_timers) {
	_timers.forEach((timer) => {
		var timedEvent = setInterval(() => {
			timer.handler(messaging.send);
		}, timer.poll);
		timers.push(timedEvent);
	});
}

function subsAdd(client, topics) {
	messaging.addSubscriptions(client, topics);
}
function timersClear() {
	timers.forEach((timer) => {
		clearInterval(timer);
	})
}
function reset() {
	restarting = true;
	closeBroker("d");
	closeBroker("u");
	closeBroker("p");
	messaging.close();
	timersClear();
	waitToClose();
}
function waitToClose(end) {
	if (end) {
		console.log("exiting normally")
		process.exit(0);
	} else {

	}
	if (restarting) {
		//really bad... need to refactor using something like async
		if (messaging.connections["d"].connected || messaging.connections["u"].connected || messaging.connections["p"].connected || messaging.clients) {
			debug("Waiting for brokers to close")
			resetTimer = setTimeout(waitToClose, 3000)
		} else {
			restarting = false;
			initialize();



		}
	}

}
function closeBroker(broker) {
	if (messaging.connections[broker]) {
		messaging.unsub(broker);
		debug("closing broker " + broker);
		messaging.connections[broker].end(false, () => {
			messaging.connections[broker] == null
			debug("broker " + broker + " closed")
		});
	} else {
		debug("broker " + broker + " not active")
	}

}
em.on("confUpdated", () => {
	reset();
})
module.exports = {
	initialize ,
	waitToClose
};