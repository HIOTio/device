const express = require("express");

var debug = require("debug")("/roles/commander.js");
const app = express();
var listening = false;
var mqttClient;
var commands=[];
var topics=[];
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
			_config.topics.forEach(function(topic,index) {
				if (Array.isArray(topic.commands)) {
					topics.push(topic);
					topic.commands.forEach(function(cmd) {
						cmd.topic=index;
						commands.push(cmd);
						debug(cmd);
					});
				}
			});
		}
		mqttClient = _mqttClient;
		if (!listening) {
			listening = true;
			app.get('/', (req, res) => res.send('HIOT Commander!'));
			app.get('/cmd/:topic/:command/:params', handleCommand);
			app.get('/cmdList',returnCommands);
			app.listen(_config.port);
			debug("listening on " + _config.port);
		} else {
			debug("Already listening");
		}
	} else {
		debug("Commander Role not provisioned");
	}


}
function returnCommands(req,res,next){
	res.json(commands);
}

function handleCommand(req, res, next) {
	var topic = req.params.topic;
	var command = req.params.command;
	var params = req.params.params;
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