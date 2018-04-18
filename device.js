/********************************************************************************
 * Copyright (c) 2017-2018 Mark Healy 1
 *
 * This program and the accompanying materials are made available under the 2
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0 3
 *
 ********************************************************************************/


/* Need to subscribe to the following topics
 * "o/device-id" - for on-boarding 
 * "C/device-path" - for config updates and requests
 * "H/device-path" - for health status requests
 * "N/device-path" - for handler messages 
 * 
 */
const debug = require("debug")("device.js");
const info=require('systeminformation');
var config = {};
var deviceId='';
var devicePath='';
var em={};

// need to re-write the init function for each role (and the device) to return a list of subscriptions and handlers
function init(device,emitter) {
	em=emitter;
	deviceId= device.id;
	config=require("./config")(em);
	devicePath = device.devicePath;
	return {
		timers : [
			{
				poll : 6000,
				handler : getHealth,
			}
		],
		topics : [
			{
				"topic" : "O/" + deviceId,
				"handler" : onBoardMsg
			},
			{
				"topic" : "C/" + devicePath,
				"handler" : configMsg
			},
			{
				"topic" : "H/" + devicePath,
				"handler" : healthMsg
			},
			{
				"topic" : "N/" + devicePath,
				"handler" : handlerMsg
			}
		]
	}
}
module.exports = {
	init
};
function getHealth(messaging){
	debug("sending health information");
	info.currentLoad((stats)=>{
		messaging("h/" + devicePath,JSON.stringify(stats),1);
	});
	
}

function onBoardMsg(message,topic, messaging) {
}
function configMsg(message, topic, messaging) {
	//check to see if the config message is valid
	if (message.device) {
		//have a configuration included
		config.setConfig(message);
	} else {
		//no config in message, so send current config back to the platform
		messaging("c/" + devicePath, JSON.stringify(config.getConfig()));
	}
}
function healthMsg(message,topic, messaging) {
	 getHealth(messaging);
}
function handlerMsg(message,topic, messaging) {
	debug("handler messaging not yet implemented");
	messaging("n" + devicePath,"handler messaging not yet implemented",1);

}