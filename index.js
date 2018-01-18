var mqtt = require("mqtt");
var debug = require("debug")("index.js");
var config=require("./config");
var aggregator = require("./roles/aggregator");
var broker = require("./roles/broker");
var sensor = require("./roles/sensor");
var controller = require("./roles/controller");
var coordinator = require("./roles/coordinator");
var localMqttServer={};
var e = require("events");
var em = new e.EventEmitter();
var device = require("./device");
var mqttClient={};

function reload(){
    var _config=config.getConfig();
    var localMqttClient=[]; 
    if(_config.moscaEnabled){
        var mosca  =require("mosca");
        localMqttServer= new mosca.Server({port:_config.moscaPort});
        localMqttClient=mqtt.connect({server: '127.0.0.1', port:localMqttServer.port});
        //FUTURE: monitor status connections and traffic for local MQTT server
    }
     mqttClient = mqtt.connect({
        server: _config.mqttServers[0].server,
        port: _config.mqttServers[0].port
    });

    mqttClient.on("connect", function(){
        debug("conected to upstream MQTT Server");
        device.init(mqttClient,_config.device,em);
        aggregator.init(_config.roleChannels.aggregator,mqttClient,localMqttClient);
        broker.init(_config.roleChannels.broker,mqttClient, localMqttClient);
        sensor.init(_config.roleChannels.sensor,mqttClient);
        controller.init(_config.roleChannels.controller,mqttClient);
        coordinator.init(_config.roleChannels.coordinator,mqttClient, localMqttClient);
    })

}
function reset(){
    localMqttServer.close(reload());

}
em.on("confUpdated",function(){
    reset();
})
function getUpstreamMqtt(servers){
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