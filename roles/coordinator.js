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
function init(coordinator, _deploymentMessaging, deploymentId) {
	deploymentMessaging = _deploymentMessaging;
	var topics = [];
	console.log("setting up the coordinator");
	// create a connection to the platform
	serverMessaging = mqtt.connect({
		host : coordinator.platformServer,
		port : coordinator.platformPort
	});
	serverMessaging.on('connect', () => {
		console.log("connected to platform messaging and subscribed to " + "P/" + deploymentId);
		serverMessaging.subscribe("P/" + deploymentId);
	});
	serverMessaging.on("message", function(topic, _message) {
		var message = JSON.parse(_message.toString());
		console.log("got message from the platform on topic " + topic);
		deploymentMessaging.publish(message.t.substring(0,3),JSON.stringify(message.m));
	});
	return {
		topics
	}

}

module.exports = {
	init
};