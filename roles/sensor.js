/*
    Publish readings from a sensor
    import sensor config
    push message on interval

    {
            "id": "sensor1",
            "channel": "sensor1",
            "sensor_id": "597fb1dd3d7bab07cc445bf1",
            "description": "temperature sensor #17, floor 1",
            "handler": "thing/sensors/rand_sensor",
            "poll": 60000,
            "config": {
                "minValue": 14,
                "range": 17
            }
        }
*/
var mqtt = require("mqtt")
var debug=require("debug")("sensor.js");
var mqttClient = {}
var senHandlers = []
var timers = [] // need this to track the polling and remove them 
module.exports = {
  init: init,
  reset: reset
}

function init(sensorList, mqttServer) {
  // kill any existing timers - if we"re reloading the config
  debug(sensorList);
  for (var key in timers) {
    clearInterval(timers[key]);
    timers[key].delete;
  }
  //connect to the mqtt broker
  mqttClient = mqtt.connect({
    server: mqttServer[0].server,
    port: mqttServer[0].port
  })
  // load the handers into an associative array with empty arrays for the elements (topic =>[handler])
  // need to have a many to many between topics and handlers
  for (var i = 0; i < sensorList.length; i++) {

    // Create a handler for this topic 
    senHandlers[sensorList[i].channel] = require("../handlers/" + sensorList[i].handler)
    debug("setting up sensor");
    debug(sensorList[i]);
    debug("Added Handler " + sensorList[i].handler + " for sensor topic " + sensorList[i].channel)
    // setInterval for the Poll function on each aggregator
    debug("Setting up publication for " + sensorList[i].channel)
    timers.push(setInterval(
      function (sensor, handlers) {
        return function () {
          debug("Publishing on Sensor Channel " + sensor.channel + " every " + sensor.poll/1000 + " seconds");
          mqttClient.publish(sensor.channel, senHandlers[sensor.channel].poll(sensor));
        }
      }
      (sensorList[i], senHandlers),

      sensorList[i].poll))
    debug("Finished setting up sensor")
  }

}

function reset(sensor, mqttServer) {

  //disconnect from the mqtt broker

  //clear all timers
  //set up aggregators
  init(sensor, mqttServer)
}
