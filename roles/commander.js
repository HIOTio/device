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
const express = require("express");

var debug = require("debug")("/roles/commander.js");
const app = express();
var listening = false;
var mqttClient;
var commands = [];
var groups = [];
var topics = [];
var retTopics = [];
function init(_config, _mqttClient) {
	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});
	if (_config) {
		console.log("building commander command list");
		//just in case...
		if (Array.isArray(_config.topics)) {
			console.log(_config.topics);
			_config.topics.forEach(function(topic, index) {
				
				topics.push(topic);
				console.log(topic);
				topic.commands.cmds.forEach(function(cmd) {
					cmd.topic = index;
					commands.push(cmd);
				});
				topic.commands.groups.forEach(function(group) {
					group.topic = index;
					groups.push(group);
				});

			});
		}
		mqttClient = _mqttClient;
		if (!listening) {
			listening = true;
			app.get('/', (req, res) => res.send('HIOT Commander!'));
			app.get('/cmd/:topic/:command/:params', handleCommand);
			app.get('/cmdList', returnCommands);
			app.listen(_config.port);
			console.log("listening on " + _config.port);
		} else {
			debug("Already listening");
		}
	} else {
		debug("Commander Role not provisioned");
	}
	return {
		topics : []
	};

}
function returnCommands(req, res, next) {
	res.json({
		cmds:commands ,
		groups
	});
}

function handleCommand(req, res, next) {
	var topic = req.params.topic;
	var command = req.params.command;
	var params = JSON.parse(req.params.params);
	debug(topics[topic].path);
	mqttClient.publish(topics[topic].path, "{ \"c\":\"" + command + "\",\"p\":" + params + "}", {},
		function(err) {
			if (err) {
				debug(err);
			}
		});
	res.json("{}");
}
module.exports = {
	init
};