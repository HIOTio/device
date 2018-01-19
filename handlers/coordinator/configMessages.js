/*

Code below is from the original config file - see what can/should be re-used to manage config files

This file is responsible for getting & setting device config from the platform



*/

var fs = require("fs");
var myConfig={};
var mqtt = {};
var mqttServer= {};
var roles = [];
var subscriptions = [];
var brokerFrom=[];
var isThing = false;
var isAggregator = false;
var isBroker = false;
var controllerCommands=[];
var mqttSubscriptions=[];
var handler=[];
var aggregators=[];
var sensors=[];
var controllers=[];
var brokers=[];
var base64=require("base-64");
var thing={};
var deviceId={};

function validateConfig(conf){
  //Validate the supplied config and return true if it"s OK
  return true;
}
function saveConfig(conf){
  if(validateConfig(conf)){
    fs.writeFile("./config.json", JSON.stringify(conf), function (err) {
      if (err) {
        return;
      }
      //TODO: do some validation etc. here - significant security risk as anyone can push any file to any device as it currently stands
      //NOTE: passing files from config, structure config.files=[{location:"",file:""}]
      for (var a = 0; a < conf.files.length; a++) {
        var location ="./handlers/" + conf.files[a].location;
        base64.decode(conf.files[a].file,  location, null);
      }
    });
  }
}



function updateConfig(conf) {
controllerCommands = [];
  //TODO: [x]need to include a mechanism to pass handler files to the device
  //TODO: [x]need to double-check the logic- _CFG_Set has to run twice before the deviceId will change
  if (conf) {
    //TODO: sanity check the config before writing to disk
    //TODO: look at importin npm packages if needed, also look to remove unused packages 
    myConfig = conf;
  }
  deviceId = myConfig.deviceId;
  sensors = null;
  if(myConfig.thing){  
    sensors = myConfig.thing.sensors;
  }
  deviceId = myConfig.deviceId;
  
  if(myConfig.thing){  
    controllers = myConfig.thing.controllers;
  }
  aggregators = myConfig.aggregators;
  brokers = myConfig.brokers;
  brokerFrom = myConfig.brokerFrom;
  // unsubscribe from MQTT topics
  //make sure we"ve set up mqtt first
  if(mqtt){
  for (var ind in subscriptions) {
    var index = ind;
    delete subscriptions[index];
    mqtt.unsub(index);
  }
}
  // clear timers for polling
  handler.clearHandlers();
  // add two special channels to get and set configuration
  subscriptions["_CFG_Set" + deviceId] = "./handlers/config";
  handler.addHandler("_CFG_Set" + deviceId, "./handlers/config", null, null);
  subscriptions["_CFG_Get" + deviceId] = "./handlersr/config";
  handler.addHandler("_CFG_Get" + deviceId, "./handlers/config", null, null);
  subscriptions["admin_" + deviceId] = "admin_" + deviceId;
  handler.addHandler("admin_" + deviceId, "./handlers/device/admin", null, null);
  // clear any previously assigned roles
  roles = [];
  if (myConfig.thing) {
    thing = myConfig.thing;
    isThing = true;
    sensors = thing.sensors;
    controllers = thing.controllers;
    roles.push("THING");
    var i=0;
    for ( i = 0; i < thing.sensors.length; i++) {
      handler.addHandler(sensors[i].channel, "./handlers/" + sensors[i].handler, sensors[i].poll, sensors[i]);
     // moved this into the addHandler function to ensure it executes in sequence
      // setInterval(publish, sensors[i].poll, sensors[i]);
    }
    // set up subscriptions for controllers
    for (i = 0; i < controllers.length; i++) {
      handler.addHandler(controllers[i].controller_channel, "./handlers/" + controllers[i].handler, null, null);
      //FUTURE: need to tidy this up and combine the handler and the config
      controllerCommands[controllers[i].controller_channel] = controllers[i].commands;
      subscriptions[controllers[i].controller_channel] = controllers[i].handler;
    }
  } else {
    isThing = false;
  }
  if (myConfig.aggregators) {
    aggregators = myConfig.aggregators;
    isAggregator = true;
    roles["AGGREGATOR"] = true;
    for (i = 0; i < aggregators.length; i++) {
      handler.addHandler(aggregators[i].channel, "./handlers/" + aggregators[i].handler, aggregators[i].poll, aggregators[i]);
      // TODO: [x]bit more work to be done here - need to subscribe to and collate all the relevant sensor messages
      for (var j = 0; j < aggregators[i].topics.length; j++) {
        // subscribe to the topic
     /*   handler.addHandler(aggregators[i].topics[j], "./handlers/" + aggregators[i].handler, null, {
          isAggTopic: true
        }) */
        subscriptions[aggregators[i].topics[j]] = aggregators[i].handler;
      }
    }
  } else {
    isAggregator = false;
  } 
  //TODO: need to update this mess - define the connection for the MQTT server (mosca or others) and then set up the MQTT functionality as before
  if (myConfig.brokers) {
    brokers = myConfig.brokers;
    isBroker = true;
    roles["BROKER"] = true;
   //Set up local Mosca as our mqtt server
    var mosca  =require("mosca");
    mqttServer= new mosca.Server({port:myConfig.mqttServers[0].mqttPort});
    mqttServer.on("clientConnected", function(client) {
  });
  mqttServer.on("published", function(packet, client) {
  });
    for (i = 0; i < brokers.length; i++) {
      handler.addHandler(brokers[i].channel, "./handlers/" + brokers[i].handler, null, null);
      subscriptions[brokers[i].channel] = brokers[i].handler;
    }
  } else {
    isBroker = false;
    mqttServer = mqtt.connect(configJson.mqttServer, {
      keepalive: 0,
      debug: false
    });
  }
  mqtt= require("./MQTT");
  mqtt.init(myConfig.mqttServers[0],controllerCommands);
  // add all of the subscribed channels/topics
  for (index in subscriptions) {
    mqtt.subscribe(index);
  }
 // fs.writeFile("./curConfig.json",JSON.stringify(getConfig()));
}
getConfigJSON = function () {
  return JSON.stringify(myConfig);
};
var empty = function () {

};

function setConfig(conf){
  myConfig=conf;
  updateConfig(conf);
}
function loadConfig(){
  //load the config from file and assign to config
  var confTemp=fs.readFileSync("./config.json");
  if(validateConfig(confTemp)){
    setConfig(confTemp);
  }
}


/*
module.exports = {
  loadConfig: loadConfig, // read the config from file
  getConfigJSON: getConfigJSON, //return the current config
  setConfig: setConfig,
  saveConfig: saveConfig,
  controllerCommands: controllerCommands,
  roles: roles,
  handlers: handlers,
  subscriptions: subscriptions,
  isThing: isThing,
  isAggregator: isAggregator,
  isBroker: isBroker,
  sensors: sensors,
  controllers: controllers,
  aggregators: aggregators,
  thing: thing,
  brokers: brokers,
  updateConfig: updateConfig
}
*/