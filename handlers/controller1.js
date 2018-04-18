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


// store the parameters/characteristics for this controller
var cont={}; 
var commands=[];
module.exports= function(controller){
	console.log(controller);
	cont=controller;
	cont.commands.forEach((cmd)=>{
		commands.push(cmd);
		
	});
	return {
		handleMessage,
		
	}
}

function handleMessage(command,topic,send){
	commands.forEach((cmd)=> {
		if(cmd.id===command.c){
			console.log(cmd);
		}
	})
}