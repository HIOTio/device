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
var config={};
var debug=require("debug")("messaging.js");
var mqttClient = {};
var localServer={};
var connection={};
var handlers=[];
var connected =false;
function connect(mqttServers){
	console.log("connecting to messaging server");
	mqttClient= mqtt.connect({
        host: mqttServers[0].mqttServerIP,
        port: mqttServers[0].mqttServerPort
    });
	mqttClient.on("connect", ()=> {
		console.log("connected to "+ mqttServers[0].mqttServerIP + 
				" on port " + mqttServers[0].mqttServerPort);
		connected=true;
		subscribe();
	});
	
	return mqttClient;
}

function subscribe(){
	if(connected){
		handlers.forEach((handler)=>{
			mqttClient.subscribe(handler.topic);
			console.log("subscribed to " + handler.topic)
		})

		mqttClient.on("message", function(topic, _message) {
			//find the relevant handler
			handlers.forEach((handler)=>{
				if(handler.topic==topic){
					debug("got message on topic " + topic + ", handling using function " + handler.handler.name);
					handler.handler(JSON.parse(_message.toString()),topic,send);
				}
			});	
		});
	}else{
		// need to wait until we're connected
		// this is nasty....
		console.log("waiting");
		setTimeout(subscribe(topics,2000));
	}
}

function send(topic, message, retryLevel){
	
	mqttClient.publish(topic,message);
}
function close(callback){
	if(localServer.clients){
		localServer.close();
		//callback seems to fire too soon, so doing this...
		while(!localServer.closed){
			
		}
		callback();
	}else{
		callback();
	}

	
}
function server(config){
	  var mosca  =require("mosca");
      localServer= new mosca.Server({port:config.moscaPort});
      return localServer;
      
}
function addSubscriptions(topics){
	topics.forEach((topic) => {
		handlers.push(topic);
		console.log("creating subscription for topic " + topic.topic );
	});
}

module.exports = function(config){
	connection=connect(config);
	return{
		connection,
		addSubscriptions,
		subscribe,
		close,
		server,
		send
	}
}




