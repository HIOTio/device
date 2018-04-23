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
 * 
 * Delegators:
 * 
 * 2 modes of operation:-
 * 
 * 1.
 * 	- chained together, e.g. if the coordinator receives an eXecute message on topic "X/1/2/3/4/A/5"
 * 	- message (include the execution topic as element "p") is sent on "B/1"
 *  - Delegator subscribed to "B/1" publishes unmodified version of the message to "B/1/2" 
 *  - Delegator subscribed to "B/1/2" publishes unmodified version of the message to "B/1/2/3" 
 * .....
 *  - Delegator listening on "B/1/2/3/4/A", publishes the message on "X/1/2/3/4/A/5", the original execution topic
 *  
 *  2.
 *  Delegator Groups
 *  These messages allow a number of commands to be grouped as one and published on multiple topics by the last delegator
 *  
 */


var debug = require("debug")("/roles/delegator.js");
var messageGroups=[];
function init(delegators) {
	var topics = [];
	delegators.forEach((delegator) => {
		if(delegator.groups){
			delegator.groups.forEach((group)=>{
				messageGroups.push(group);
			});
		}
		topics.push({
			topic : delegator.path,
			handler : handleMessage
		});
	});
	return {
		topics
	};
}
function handleMessage(message, topic, messaging) {
	debug("got a delegator message");
	if (!message.p) {
		debug("badly formed delegator message, ");
		debug(message);
	} else {
		if (topic.substring(1) === message.p.substring(1, message.p.length - 2)) {
			if(message.p.substring(0,1)==="O"){
				//got an onboarding message
				// need to publish on message.i
				messaging("O/" + message.i,JSON.stringify(message))
			}else if(!message.g){
				// no message groups, just fire the message 
				messaging(message.p, JSON.stringify(message), 1)
			}else{
				// need to send more than one message
				messageGroups.forEach((group)=>{
					if (group.id==message.g){
						group.msgOut.forEach((groupItem)=>{
							if(group.includeBody){
								// combine the contents of the message with the hard-coded body from the config
								Object.assign(groupItem.body,message);
							}
							messaging(groupItem.topic,JSON.stringify(groupItem.body));
						});
					}
				});
			}
		} else {
			// need to forward on to the next delegator
			messaging("B/"+ message.p.substring(2,topic.length + 2), JSON.stringify(message), 1)
		}
	}

}

module.exports = {
	init
};