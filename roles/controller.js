
var mqtt= require("mqtt");

var debug=require("debug")("coorcontrollerdinator.js");
var mqttClient={};
var ctrlHandlers=[];
var ctrlSubs=[];
var ctrlCommands=[];

function init(ctrlList,dMqttClient){
    //connect to the mqtt broker
    mqttClient= dMqttClient;
    // load the handers into an associative array with empty arrays for the elements (topic =>[handler])
    // need to have a many to many between topics and handlers
    for(var i=0;i<ctrlList.length;i++){
        // Create a handler for this topic 
        ctrlSubs.push(ctrlList[i].channel);
        ctrlHandlers[ctrlList[i].channel] = require("../handlers/" + ctrlList[i].handler);
        ctrlCommands[ctrlList[i].channel]= ctrlList[i].commands;
        debug("Added Handler " + ctrlList[i].handler + " for controller topic " + ctrlList[i].channel);
    }
    // Subscribe to each topic
    addSubscriptions(ctrlSubs);
    //handle incoming messages
    mqttClient.on("message", function (topic, _message) {
        try {
          var message = JSON.parse(_message.toString());
          var commands=null;
          if(ctrlSubs.indexOf(topic)>=0){
              //this is a valid message for this controller
              if(ctrlHandlers[topic]){
                  debug("got a controller message");
                      // make sure the handler can handle an inbound message
                      if(ctrlHandlers[topic].handleMessage){
                        var resp = ctrlHandlers[topic].handleMessage(topic, message,ctrlCommands[topic]);
                        debug("found correct controller handler");
                      if(resp){
                        if(resp.topic){
                          //send a message
                          mqttClient.publish(resp.topic,JSON.stringify(resp.message));
                        }
                      }
                      }
                  
            }
          }

          
        } catch (err) {
         debug(err);
        }
      })
}
function reset(ctrlHandlers,mqttServer){
    //clear the mqtt subscriptions (if any)

    //disconnect from the mqtt broker

    //clear all timers

    //set up aggregators
    init(ctrlHandlers,mqttServer);
}

function addSubscriptions(subs){
    for(var i=0;i<subs.length;i++){
        mqttClient.subscribe(subs[i])
    }
   
}
module.exports={
    init,
    reset
};