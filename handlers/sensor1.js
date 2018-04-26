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
 * Simple sensor example, just generates a random number
 * 
 ********************************************************************************/

module.exports = function (sensor){
 return{ handler:  function(messaging){
	 var reading = sensor.config.minValue + (Math.random() * sensor.config.range)
    messaging(sensor.topic,JSON.stringify({
      d: Date.now(),
      r: reading,
      s: sensor._id
    }));
  }
 }
}


