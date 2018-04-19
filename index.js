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
var mqttClient = {};
var localServer={};
var subscriptions = [];
var timers=[];
function initialize() {
	var _config = config.getConfig();
	var localMqttClient = [];

	// connect to the specified messaging server(s)
	messaging = require("./messaging")(_config.mqttServers);
	// set up a local messaging server (MQTT broker) if configured
	if (_config.moscaEnabled) {
		console.log("local messaging server running");
		localServer=messaging.server(_config);
	}
	mqttClient=messaging.connection;
	
	//clear any existing subscriptions
	subsClear();

	const device = require("./device");
	setup(device.init(_config.device,em));

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
// set up any required timers or subscriptions for each role
function setup(settings){
	if (settings.timers){
		addTimers(settings.timers);
	}
	if(settings.topics){
		subsAdd(settings.topics);
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
function subsAdd(topics) {
	messaging.addSubscriptions(topics);


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