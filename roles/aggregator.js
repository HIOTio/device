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

var debug = require("debug")("aggregator.js");
function init(aggList) {
	var timers = [];
	var topics ={
	downstream:[]
};
	aggList.forEach((aggregator) => {
		if (aggregator.active) {
			var agg = require("../handlers/" + aggregator.handler)(aggregator);
			//setup timers
			if (aggregator.poll) {
				timers.push({
					poll : aggregator.poll,
					handler : agg.poll
				});
			}
			//need to handle event, response and query messages for each topic 
			aggregator.topics.forEach((topic) => {
				[ 'v', 'r', 'q' ].forEach((otherTopic) => {

					topics.downstream.push({
						topic : otherTopic + topic.substring(1),
						handler : agg.handleOther
					});
				});
				topics.downstream.push({
					topic ,
					handler : agg.handleMessage
				})
			});
			
		}
	});

	return {
		timers,
		topics
	}
}
function forwarder() {
}
module.exports = {
	init
};