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

var mqtt = require("mqtt");
var config = {};
var debug = require("debug")("messaging.js");
var client={};
var localServer = {};
var connection = {};
var handlers = {
	"d" : [],
	"u" : [],
	"p" : []
};

function connectClient(broker,description,mqttServers){
	debug("connecting to " + description +"  messaging server" + JSON.stringify({
		host : mqttServers[broker].mqttServerIP,
		port : mqttServers[broker].mqttServerPort
	}));
 var _client= mqtt.connect({
	host : mqttServers[broker].mqttServerIP,
	port : mqttServers[broker].mqttServerPort
});
_client.on("connect", () => {
	debug("connected to " + description + " messaging " + mqttServers["d"].mqttServerIP +
		" on port " + mqttServers["d"].mqttServerPort);

	subscribe(broker);
});
return _client;
}
function connect(mqttServers) {
	client["d"]=connectClient("d","downstream",mqttServers);
	client["u"]=connectClient("u","upstream",mqttServers);
	client["p"]=connectClient("p","platform",mqttServers);


	return client;
}
function subscribe(broker) {
	console.log(client[broker])
	debug("setting up subs for client "  + broker)
	if (client[broker].connected) {
		handlers[broker].forEach((handler) => {
			client[broker].subscribe(handler.topic);
			debug("subscribed to " + handler.topic)
			
		})

		client[broker].on("message", (topic, _message) =>{
			//find the relevant handler
			handlers[broker].forEach((handler) => {
				if (handler.topic == topic) {
					debug("got message on topic " + topic + ", handling using function " + handler.handler.name);
					handler.handler(JSON.parse(_message.toString()), topic, send);
				}
	
			});
		});
	} else {
		// need to wait until we're connected
		// this is nasty....
		debug("waiting");
		//setTimeout(subscribe(broker, 2000));
	}
}

function send(topic, message, retryLevel) {
	var broker="u";
	if(topic.substring(0,1)==="P"){
		broker="p";
		
	}
	else if(topic[0] === topic[0].toUpperCase()){
		broker="d";
	}
	client[broker].publish(topic, message);

}

function close(callback) {
	if (localServer.clients) {
		localServer.close(()=>{console.log("mosca closed")});
		
	}


}
function server(config) {
	var mosca = require("mosca");
	localServer = new mosca.Server({
		port : config.moscaPort
	});
	return localServer;

}
function addSubscriptions(client, topics) {
	topics.forEach((topic) => {
		handlers[client].push(topic);
		debug("creating " + client + " subscription for topic " + topic.topic);
	});
}
function unsub(broker){
	handlers[broker].forEach((topic)=>{
		client[broker].unsubscribe(topic.topic)
		delete handlers[broker][topic];
	})
}
module.exports = function(config) {
	return {
		connections : connect(config),
		addSubscriptions ,
		subscribe ,
		unsub,
		close ,
		server ,
		send
	}
}