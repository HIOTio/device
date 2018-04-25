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
var localServer={};
var subscriptions = [];
var timers=[];
function initialize() {
	var _config = config.getConfig();
	
	//if we don't have a device path, then we need to on-board
	if(!_config.device){
		//pass the config object to the device object
		device.onBoard(config);
	}else{
		//have a device Path, so we can set up the various roles, pubs and subs
		setup(device.init(_config.device,em));
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
		if (_config.moscaEnabled) {
			debug("local messaging server running");
			localServer=messaging.server(_config);
		}
		mqttClient=messaging.connections;
		
		//clear any existing subscriptions
		subsClear();

		if (_config.roleChannels.aggregator) {
			const aggregator = require("./roles/aggregator");
			setup(aggregator.init(_config.roleChannels.aggregator));
		}

		if(_config.roleChannels.delegator){
			const delegator = require("./roles/delegator");
		     setup(delegator.init(_config.roleChannels.delegator,mqttClient));
		}
		
		if(_config.roleChannels.sensor){
			const sensor = require("./roles/sensor");
		     setup(sensor.init(_config.roleChannels.sensor,mqttClient));
		}
		if(_config.roleChannels.controller){
			const controller = require("./roles/controller");
		     setup(controller.init(_config.roleChannels.controller,mqttClient));
		}
		if(_config.roleChannels.coordinator){
			const coordinator = require("./roles/coordinator");
		     setup(coordinator.init(_config.roleChannels.coordinator,mqttClient, _config.device.deployment));
		}
		if(_config.roleChannels.commander){
			const commander = require("./roles/commander");
		     setup(commander.init(_config.roleChannels.commander,mqttClient));
		}
	}

	
}
// set up any required timers or subscriptions for each role
function setup(settings){
	if (settings.timers){
		addTimers(settings.timers);
	}
	if(settings.downstreamTopics){
		subsAdd("d",settings.downstreamTopics);
	}
	if(settings.upstreamTopics){
		subsAdd("u",settings.upstreamTopics);
	}
	if(settings.platformTopics){
		subsAdd("p",settings.platformTopics);
	}
	
}
function addTimers(_timers){
	_timers.forEach((timer)=> {
		var timedEvent = setInterval(() =>{
			timer.handler(messaging.send);
		}, timer.poll);
		timers.push(timedEvent);
	});
}
function subsClear() {
	// unsubscribe on all channels

	//reset the subscriptions variable
	subscriptions = [];
}
function subsAdd(client,topics) {
	messaging[client].addSubscriptions(client,topics);


}
function timersClear(){
	
}
function reset() {
	subsClear();
	timersClear();
	messaging.close(initialize);

}
em.on("confUpdated", function() {
	reset();
})

initialize();