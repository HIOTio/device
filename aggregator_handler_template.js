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

// create an array to store the data to aggregate
var data = []; 
// store the parameters/characteristics for this aggregator
var agg={}; 
// object to store the aggregated output
var out={};
module.exports= function(aggregator){
	agg=aggregator;
	return {
		poll,
		handleMessage,
		
	}
}

function poll(messaging){
	// aggregate the raw data in whatever way you want
	
	
	//send the aggregated data
	messaging(agg.channel,JSON.stringify(out));
	//clear the data
	data=[];
} 

function handleMessage(dataIn){
	// push the data received into the data array
	data.push(dataIn);
}
function handleOther(dataIn, topic,messaging) {
	var outTopic= agg.channel;
	messaging(outTopic, JSON.stringify(
			{
				"t":topic,
				"m":dataIn
			}));
}