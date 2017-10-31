var config = require('../config');
var mqtt=require('../MQTT');
module.exports={
  handleMessage: function(topic,message){
    //TODO: error handling in here
    if (topic.startsWith('_CFG_Set')) {
        config.updateConfig(message.config);
      } else if (topic.startsWith('_CFG_Get')) {
        
        mqtt.publish(message.sender, config.getConfig())

      }
  }

}
