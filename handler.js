/********************************************************************************
 * Copyright (c) 2017-2018 Mark Healy 1
 *
 * This program and the accompanying materials are made available under the 2
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0 3
 *
 ********************************************************************************/
var fs = require("fs");
var debug=require("debug")("handler.js");
var handlers = [];
var timers = [];
this.addHandler = function (index, file, poll, object) {
  fs.stat(file + ".js", function (err, stat) {
    if (err == null) {
      handlers[index] = require(file);
      if (poll) {
        timers.push(setInterval(function () {
          mqtt.publish_poll(object);
        }, object.poll));
      } else {
        // subscriptions will be handled by the mqtt.onMessage event.
        // not sure if there are other use cases that we need to look at
        
      }
    } else {
     debug(err);
    }
  })
}

this.clearHandlers = function () {
  while (timers.length) {
    // TODO: need some error handling in here
    clearInterval(timers.pop());
  }
};
this.getHandler = function (handle) {
  // TODO: error handling if handler cannot be found
  if(!handlers[handle]){
    return null;
  }
  return handlers[handle];
};
module.exports = {
  addHandler: this.addHandler,
  clearHandlers: this.clearHandlers,
  getHandler: this.getHandler
};
