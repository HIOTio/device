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

const {exec} = require("child_process");
const debug = require("debug")("handlers/controller1.js");
var cont={}; 
var commands=[];
module.exports= function(controller){
	cont=controller;
	cont.commands.forEach((cmd)=>{
		commands.push(cmd);
		
	});
	return {
		handleMessage
		
	}
}
function handleMessage(command,topic,send){
	debug("got a message for controller1");
	commands.forEach((cmd)=> {
		if(cmd.id===command.c){
			var params='';
			
			if(Array.isArray(command.p)){
				command.p.forEach((p)=>{
					params=params.concat(' ');
					params=params.concat(p.v);
				});
			}
			exec("" + cmd.e + params,(err,stdout,stderr)=>{
				if(err){
					send("e/1/" + topic,JSON.stringify(err));
				}
			});
		}
	})
}
