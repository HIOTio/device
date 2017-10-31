var fs = require('fs')
var mqtt = require('./MQTT')
var handlers = []
var timers = []
this.addHandler = function (index, file, poll, object) {
  fs.stat(file + '.js', function (err, stat) {
    if (err == null) {
      handlers[index] = require(file)
      if (poll) {
        timers.push(setInterval(function () {
          mqtt.publish_poll(object)
        }, object.poll))
      } else {
        // subscriptions will be handled by the mqtt.onMessage event.
        // not sure if there are other use cases that we need to look at
        
      }
    } else {
     // console.log(err)
    }
  })
}

this.clearHandlers = function () {
  while (timers.length) {
    // TODO: need some error handling in here
    clearInterval(timers.pop())
  }
}
this.getHandler = function (handle) {
  // TODO: error handling if handler cannot be found
  if(!handlers[handle]){
  }
  return handlers[handle]
}
module.exports = {
  addHandler: this.addHandler,
  clearHandlers: this.clearHandlers,
  getHandler: this.getHandler
}
