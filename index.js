const mqtt = require("mqtt");
const debug = require("debug")("index.js");
const config=require("./config");
const aggregator = require("./roles/aggregator");
const broker = require("./roles/broker");
const sensor = require("./roles/sensor");
const controller = require("./roles/controller");
const coordinator = require("./roles/coordinator");
const commander = require("./roles/commander");
const e = require("events");
const em = new e.EventEmitter();
const device = require("./device");
var mqttClient={};
var localMqttServer={};
function reload(){
    var _config=config.getConfig();
    var localMqttClient=[]; 
    if(_config.moscaEnabled){
        var mosca  =require("mosca");
        localMqttServer= new mosca.Server({port:_config.moscaPort});
        localMqttClient=mqtt.connect({server: "127.0.0.1", port:localMqttServer.port});
        //FUTURE: monitor status connections and traffic for local MQTT server
    }
     mqttClient = mqtt.connect({
        host: _config.mqttServers[0].mqttServerIP,
        port: _config.mqttServers[0].mqttServerPort
    });

    mqttClient.on("connect", function(){
    	
        debug("conected to upstream MQTT Server");
        device.init(mqttClient,_config.device,em);
        aggregator.init(_config.roleChannels.aggregator,mqttClient,localMqttClient);
        broker.init(_config.roleChannels.broker,mqttClient, localMqttClient);
        sensor.init(_config.roleChannels.sensor,mqttClient);
        controller.init(_config.roleChannels.controller,mqttClient);
        coordinator.init(_config.roleChannels.coordinator,mqttClient, localMqttClient);
        commander.init(_config.roleChannels.commander,mqttClient);
        
    });

}
function reset(){
    localMqttServer.close(reload());

}
em.on("confUpdated",function(){
    reset();
})
function xxxxxxx_getUpstreamMqtt(servers){
    //TODO: update this to iterate through servers if server[0] is unavailable
    if(!mqttClient.client){
        mqttClient = mqtt.connect({
        server: servers[0].server,
        port: servers[0].port
    });
    }
    return mqttClient;
}

reload();