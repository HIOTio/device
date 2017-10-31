
/*
 accept an array of aggregator configurations and 
-- create an array of subscriptions (for each topic)
-- set up polling for the aggregator output
-- track missing or delayed messages from sensors

 sample controller config
 "controller":[{
            "id": "controller1",
            "controller_channel": "controller12345",
            "description": "lighting controller, first floor",
            "handler": "thing/controllers/demo_controller",
            "broker": "demoBroker",
            "commands": [{
                    "c": 0,
                    "e": "/home/pi/lightwaverf-pi/send",
                    "p": [
                        {
                            "p": "p1",
                            "r": true
            },
                        {
                            "p": "p2",
                            "r": true
            },
                        {
                            "p": "p3",
                            "r": true
                    }
                ]

            }]
        }
*/
var mqtt= require('mqtt')
var mqttClient={}
var ctrlHandlers=[]
var ctrlSubs=[]
var ctrlCommands=[]
module.exports={
    init:init,
    reset: reset
}
function init(ctrlList,mqttServer){
    //connect to the mqtt broker
    mqttClient= mqtt.connect ({
        server:mqttServer[0].server, 
        port:mqttServer[0].port})
    // load the handers into an associative array with empty arrays for the elements (topic =>[handler])
    // need to have a many to many between topics and handlers
    for(var i=0;i<ctrlList.length;i++){
        // Create a handler for this topic 
        ctrlSubs.push(ctrlList[i].channel)
        ctrlHandlers[ctrlList[i].channel] = require("../handlers/" + ctrlList[i].handler)
        ctrlCommands[ctrlList[i].channel]= ctrlList[i].commands
        console.log("Added Handler " + ctrlList[i].handler + " for controller topic " + ctrlList[i].channel)
    }
    // Subscribe to each topic
    addSubscriptions(ctrlSubs)
    //handle incoming messages
    mqttClient.on('message', function (topic, _message) {
        try {
          var message = JSON.parse(_message.toString())
          var commands=null
          if(ctrlSubs.indexOf(topic)>=0){
              //this is a valid message for this controller
              if(ctrlHandlers[topic]){
                  console.log("got a controller message")
                      // make sure the handler can handle an inbound message
                      if(ctrlHandlers[topic].handleMessage){
                        var resp = ctrlHandlers[topic].handleMessage(topic, message,ctrlCommands[topic])
                      if(resp){
                        if(resp.topic){
                          //send a message
                          mqttClient.publish(resp.topic,JSON.stringify(resp.message))
                        }
                      }
                      }
                  
            }
          }

          
        } catch (err) {
         console.log(err)
        }
      })
}
function reset(ctrlHandlers,mqttServer){
    //clear the mqtt subscriptions (if any)

    //disconnect from the mqtt broker

    //clear all timers

    //set up aggregators
    init(ctrlHandlers,mqttServer)
}

function addSubscriptions(subs){
    for(var i=0;i<subs.length;i++){
        mqttClient.subscribe(subs[i])
    }
   
}