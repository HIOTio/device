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

var debug = require("debug")("controller.js");
function init(controllers){
	var topics=[];
	console.log("setting up the controller");
	controllers.forEach((controller)=> {
		console.log(controller);
		if(controller.active){
			var cont=require("../handlers/" + controller.handler)(controller);
			topics.push({
				topic: controller.topic,
				handler: cont.handleMessage
			})
		}
	});
	return {
		topics 
	}
	
}

module.exports={
    init
};