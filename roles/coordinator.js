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

/*
 * deployment -> platform messages
 * - subscribe to all top level message topics (e.g. "h")
 * - encapsulate the message in a deployment message ("d/deploymentId")
 * - send to platform
 * 
 * platform -> deployment messages
 * - subscribe to platform messages on topic "P/deploymentId"
 * - extract "t" (topic) and "m" (message) from message
 * - publish message "m" on topic "t" to deployment
 * 
 */
const debug = require("debug")("/roles/coordinator.js");
var mqtt = require('mqtt');
var serverMessaging = {};
var deploymentMessaging = {};
var dfeploymentId='';
function init(coordinator, _deploymentMessaging, _deploymentId) {
	deploymentMessaging = _deploymentMessaging;
	deploymentId=_deploymentId;
	var topics = [];
	['a','b','c','d','h','n','s','v'].forEach((topic)=> {
		topics.push({
			topic,
			handler:coorHandler
		})
	});
	topics.push(
			{
				topic:"z",
				handler:coordComms
			});
	topics.push({
		topic:"Z",
		handler:coordComms
	});
	debug("setting up the coordinator");
	// create a connection to the platform
	serverMessaging = mqtt.connect({
		host : coordinator.platformServer,
		port : coordinator.platformPort
	});
	serverMessaging.on('connect', () => {
		debug("connected to platform messaging and subscribed to " + "P/" + deploymentId);
		serverMessaging.subscribe("P/" + deploymentId);
	});
	serverMessaging.on("message", function(topic, _message) {
		var message = JSON.parse(_message.toString());
		debug("got message from the platform on topic " + topic);
		if(message.t.length>3){
			//need to send via a broker
			message.t = "B" + message.t.substring(1);
		}
		deploymentMessaging.publish(message.t.substring(0,3),JSON.stringify(message.b));
	});
	return {
		topics
	}

}
function coordComms(data,topic,messaging){
	//use this for coordinator to coordinator comms
}
function coorHandler(data, topic){
	if (!Array.isArray(data.t)){
		if(data.t){
			var temp = data.t;
			data.t=[];
			data.t.push(temp);
			debug("data.t exists but is not an array");
		}else{
			data.t=[];
		debug("data.t does not exist");
		}
		debug(data);
	}
	data.t.push(topic);
	serverMessaging.publish("d/" + deploymentId,JSON.stringify(data));
}
module.exports = {
	init,
	coorHandler
};