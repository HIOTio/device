var handler = require('./handler')
//NOTE: need this up here to set some config details (e.g. device id and mqtt address)

/*
Start-up:
 1 - read config file
 2 - set device ID
 3 - check if I'm a broker
 4.a - if I am, create a list of brokers with just localhost in it
 4.b - if I'm not, create list of MQTT brokers
 5 - create list of subscriptions and handlers (need to tidy up current stuff)
 6 - Do I have sensors?
 7 - Do I have controllers?
 8 - Am I an aggregator?
 9 - Am I a coordinator


Re-load config:
1 - validate new configuration
  -- Make sure the required data is included
2 - remove subscriptions, handlers etc.
3 - run start-up 

*/

/*
  config should just return config.json to index
  let index create all the objects etc
  mqtt should return a reference to the server back to index
  index should handle onMessage etc, by calling controller, aggregate etcs.
  controller and aggregate etc. should be self contained, if the device is an aggregator, let aggregator look after it

*/



/*
  -- getConfig - load the current configuration

  -- setConfig - validate, save and apply supplied config JSON


*/
var _config = {
  roles:{
    broker:false,
    coordinator: false,
    aggregator:false,
    sensor:false,
    controller:false,
  },
  roleChannels:{
    broker:[],
    coordinator:[],
    aggregator:[],
    sensor:[],
    controller:[]
  },
  moscaEnabled:false,
  moscaPort:1884,
  mqttServers:[],
  devicePath:'',
  device:{
    hiotId:'',
    name:'',
    description:'',
  }
}
function getRoles(){
  var roles={
    broker:false,
    coordinator: false,
    aggregator:false,
    sensor:false,
    controller:false,
  }
  if(_config.roleChannels.aggregator) roles.aggregator=true
  if(_config.roleChannels.broker) roles.broker=true
  if(_config.roleChannels.coordinator) roles.coordinator=true
  if(_config.roleChannels.sensor) roles.sensor=true
  if(_config.roleChannels.controller) roles.controller=true
  return roles
}
module.exports={
  getConfig: function(){
    //reload the configuration from disk
    var confTemp=require('./config.json');
    _config.roleChannels=confTemp.roleChannels,
    _config.moscaEnabled=confTemp.moscaEnabled,
    _config.moscaPort=confTemp.moscaPort,
    _config.mqttServers=confTemp.mqttServers,
    _config.device=confTemp.device
    return {
      roles:getRoles(),
      device:_config.device,
      roleChannels:_config.roleChannels,
      moscaEnabled:_config.moscaEnabled,
      moscaPort:_config.moscaPort,
      mqttServers:_config.mqttServers,
      device:_config.device
    }
  },
  setConfig: function(config){
    //need some validation in here

    //Write to config.json

    //return new config (to be reapplied in index.js)
  }
}
