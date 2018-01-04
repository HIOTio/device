var mqtt = require("mqtt");
var config={};
var client = {};
var handler = require("./handler");
function initClient(server,_config){
  config.controllerCommands=_config;
  console.log(_config);
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
  //    console.log(handler.getHandler(topic))
      if(handler.getHandler(topic).handleMessage){
      var resp=handler.getHandler(topic).handleMessage(topic, message,commands);
   //   console.log("inbound message on "+ topic)
      if(resp){
        if(resp.topic){
          //send a message
          client.publish(resp.topic,JSON.stringify(resp.message));
        }
      }
    }
    } catch (err) {
     console.log(err);
    }
  });
  
  this.unsub = function (topic) {
    client.unsubscribe(topic, function () {

    })
  }
}

module.exports = {
  subscribe: function (channel) {
    // TODO: make sure we"re connected
    client.subscribe(channel);
  },
  publish_poll: function (channel) {
    // TODO: need to figure out why this is firing twice for each sensor
 //   console.log(channel)
    var message = handler.getHandler(channel.channel).poll(channel);
    
  //  console.log(channel.channel)
    client.publish(channel.channel, message);
  },
    publish: function (channel,message) {
    client.publish(channel, message);
  },
  unsub: this.unsub,
  init: function(server,config){
    initClient(server);
  }

}

