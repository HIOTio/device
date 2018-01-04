/*
  MQTT:
    -- subscribe to C/deviceId = set config of device based on device id
    -- publish on c/deviceId = send config to platform
    -- publish on e/deviceId = send error messages to platform
    -- publish on h/deviceId = send health Information
*/
var mqtt = require("mqtt");
var base64 = require("file-base64");
var fs = require("fs");
var mqttClient = {};


function init(mqttServer, device, em) {

  //connect to the mqtt broker
  mqttClient = mqtt.connect({
    server: mqttServer[0].server,
    port: mqttServer[0].port
  });
  mqttClient.subscribe("C/" + device.devicePath);
  console.log("device subscribed to c/" + device.devicePath);
  mqttClient.on("message", function (topic, _message) {
    try {

      var message = JSON.parse(_message.toString());
      if (message.set) {
        //have a new config
        var conf = message.conf
        console.log("*************** Resetting device config **********************");

        fs.writeFileSync("./config.json", JSON.stringify(conf));
        em.emit("confUpdated");
      }

    } catch (err) {
      console.log(err);
    }
  });
}
module.exports = {
  init: init
};