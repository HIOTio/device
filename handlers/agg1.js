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
 * Aggregator to calculate the min, mean and max of the data received
 * 
 * subscribed topic added to input data below) as part of the data array 
 * 
 * input: {
 * 		"r" - numeric reading value
 * 		"t" - timestamp
 * 		"s" - this is the topic the message was received on
 * }
 * output:{
 * 		"c": count (number of readings received
 * 		"n": min value of "r" in readings
 * 		"x": max value of "r"
 * 		"m": average (mean) value of "r"
 * 		"r": array of raw data (input messages) 
 * }
 ********************************************************************************/

var data = []
var agg = {};
module.exports = function(aggregator) {
	agg = aggregator;
	return {
		poll ,
		handleMessage,
		handleOther
	}
}

function poll(messaging) {
	//just a simple min, max and average
	var out = {
		"c" : 0,
		"n" : 0,
		"x" : 0,
		"m" : 0,
		"r" : []
	};
	var total = 0;
	if (data.length == 0) {
		messaging("e/2/" + agg.channel, JSON.stringify({
			"error" : "no message for aggregator with id " + agg._id
		}));
	} else {
		data.forEach((reading) => {
			total += reading.r;
			//initialise the output with the first record from data[]
			if (out.c == 0) {

				out = {
					"c" : 1,
					"n" : data[0].r,
					"x" : data[0].r,
					"m" : data[0].r,
					"r" : []
				};
			} else {
				// increment the reading count
				out.c++;
				if (reading.r < out.n) {
					//have a new min value
					out.n = reading.r;
				}

				if (reading.r > out.x) {
					//have a new max value
					out.x = reading.r;
				}
			}

			out.r.push(reading);

		});
		out.m = total / out.c;
		messaging(agg.channel, JSON.stringify(out));
		data = [];
		
	}
}

function handleMessage(dataIn, topic) {
	dataIn.s = topic;
	data.push(dataIn);
}
function handleOther(dataIn, topic,messaging) {
	if (!Array.isArray(dataIn.t)){
		dataIn.t=[];
	}
	dataIn.t.push(topic);
	messaging(agg.channel, JSON.stringify(dataIn));
}