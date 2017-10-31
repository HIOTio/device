var mqtt = require('mqtt')
var config={};
var client = {};
var handler = require('./handler')
function initClient(server,_config){
  config.controllerCommands=_config
  console.log(_config)
  client= mqtt.connect ({server:server.server, port:server.port})
  
  client.on('connect', function () {
    // TODO: set a flag for connection status and don't subscribe/publish unless connected
    //config.updateConfig()
  })
  client.on('disconnect', function () {
    //TODO: need to handle MQTT disconnect
  })
  client.on('error', function (err) {
    //TODO: need to handle MQTT errors
    //TODO: use an array of brokers and report up to platform if the first one(s) isn't available
  
   // console.log(err)
  })
  
  client.on('message', function (topic, _message) {
    try {
      var message = JSON.parse(_message.toString())
      // TODO: move this functionality to a handler, should be the same as controller messages (i.e. with message paths)
      // handle special channels to get and set config
      var commands=null
      if(config.controllerCommands[topic]){
          commands=config.controllerCommands[topic]
      }
  //    console.log(handler.getHandler(topic))
      if(handler.getHandler(topic).handleMessage){
      var resp=handler.getHandler(topic).handleMessage(topic, message,commands)
   //   console.log("inbound message on "+ topic)
      if(resp){
        if(resp.topic){
          //send a message
          client.publish(resp.topic,JSON.stringify(resp.message))
        }
      }
    }
    } catch (err) {
     console.log(err)
    }
  })
  
  this.unsub = function (topic) {
    client.unsubscribe(topic, function (err) {
      if (err) {
     //   console.log(err)
      }
    })
  }
}

module.exports = {
  subscribe: function (channel) {
    // TODO: make sure we're connected
    client.subscribe(channel)
  },
  publish_poll: function (channel) {
    // TODO: need to figure out why this is firing twice for each sensor
 //   console.log(channel)
    var message = handler.getHandler(channel.channel).poll(channel)
    
  //  console.log(channel.channel)
    client.publish(channel.channel, message)
  },
    publish: function (channel,message) {
    client.publish(channel, message)
  },
  unsub: this.unsub,
  init: function(server,config){
    initClient(server);
  }

}

