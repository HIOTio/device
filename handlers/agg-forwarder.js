/********************************************************************************
 * Copyright (c) 2017-2018 Mark Healy 
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0 
 *
 *
 *
 * Aggregator to forward messages on all topics from the device
 * 
 ********************************************************************************/

var data = []
var agg = {};
const debug = require('debug')('agg-forwarder.js');
module.exports = function(aggregator) {
	agg = aggregator;
	return {
		poll ,
		handleMessage,
		handleOther
	}
}
function poll(){
	debug("null poll");
}
function handleMessage(dataIn, topic,messaging) {
	var outTopic=agg.channel;
	//check if a device is trying to on-board
	if(topic==="o"){
		debug("got on-boarding message");
	}
	if (!Array.isArray(dataIn.t)){
		if(dataIn.t){
			debug("data.t exists but is not an array");
		}
		dataIn.t=[];
	}
	dataIn.t.push(topic);
	messaging(outTopic, JSON.stringify(dataIn));
}
function handleOther(dataIn, topic,messaging) {
	var outTopic= agg.channel;
	if (!Array.isArray(dataIn.t)){
		dataIn.t=[];
	}
	dataIn.t.push(topic);
	messaging(outTopic, JSON.stringify(dataIn));
}