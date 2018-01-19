var mqtt = require("mqtt");
var config={};
var debug=require("debug")("mqtt.js");
var client = {};
var handler = require("./handler");
function initClient(server,_config){
  config.controllerCommands=_config;
  client= mqtt.connect ({server:server.server, port:server.port});
  
  client.on("message", function (topic, _message) {
    try {
      var message = JSON.parse(_message.toString());
      // TODO: move this functionality to a handler, should be the same as controller messages (i.e. with message paths)
      // handle special channels to get and set config
      var commands=null;
      if(config.controllerCommands[topic]){
          commands=config.controllerCommands[topic];
      }
      if(handler.getHandler(topic).handleMessage){
      var resp=handler.getHandler(topic).handleMessage(topic, message,commands);
      if(resp){
        if(resp.topic){
          //send a message
          client.publish(resp.topic,JSON.stringify(resp.message));
        }
      }
    }
    } catch (err) {
     debug(err);
    }
  });
  
  this.unsub = function (topic) {
    client.unsubscribe(topic, function () {

    });
  };
}

module.exports = {
  subscribe (channel) {
    // TODO: make sure we"re connected
    client.subscribe(channel);
  },
  publishPoll(channel) {
    // TODO: need to figure out why this is firing twice for each sensor
    var message = handler.getHandler(channel.channel).poll(channel);
    client.publish(channel.channel, message);
  },
    publish (channel,message) {
    client.publish(channel, message);
  },
  unsub: this.unsub,
  init(server,config){
    initClient(server);
  }

}

