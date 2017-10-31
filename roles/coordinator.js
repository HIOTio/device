/*

    Coordinators are different from other roles for the following reasons:
    -- only one active per deployment
    -- require local storage in order to queue messages
    core functions:
    -- act as a gateway between the deployment and the cloud
    -- need to implement high-availability and fail-over to other coordinator
    -- some sort of polling, health between coordinators to detect when one is offine?

    
-- coordinate devices
-- -- receive health status for each device
-- -- -- ensure required aggregator and broker roles are active
-- -- -- move roles when device is unavailable
-- -- -- move roles when device is short on resources
*/
var mqtt= require('mqtt')
var mqttClient={}
var aggHandlers=[]
var aggSubs=[]
var timers = [] // need this to track the polling and remove them 
module.exports={
    init:init,
    reset: reset,
    handleMessage: handleMessage
}

function handleMessage(topic,message){
    // need to handle messages from the rest of the deployment, but also from the platform
    // lowercase topics are from te deployment devices
    // uppercase topics are from the platform 
    // up to top-level aggregators to send on coordinator topic
    // up to coordinator to route broker messages to top-level brokers

    /*
    reserved topics :
    "e","Error message from the deployment","deploymentError"
    "R","response from the platform","platformResponse"
    "r","response from the deployment","deploymentResponse"
    "h","health message from the deployment","deploymentHealth"
    "C","config message from the platform","platformConfig"
    "c","config message from the deployment","deploymentConfig"
    "Q","query from the platform","platformQuery"
    "q","query from the deployment","deploymentQuery"
    "X","execute command from the platform","platformExec"
    "a","aggregation data from the deployment","deploymentAggregation"
    "Z","coordinator-coordinator comms","coordinatorChannel"
    
*/
}
var coordHandlers=[]
var channels=[
    {
        ch:"E",
        desc:"Error message from the platform",
        func:"ErrorMessages"
    },
    {
        ch:"e",
        desc:"Error message from the deployment",
        func:"ErrorMessages"
    },
    {
        ch:"R",
        desc:"response from the platform",
        func:"responseMessages"
    },
    {
        ch:"r",
        desc:"response from the deployment",
        func:"responseMessages"
    },
    {
        ch:"h",
        desc:"health message from the deployment",
        func:"healthMessages"
    },
    {
        ch:"C",
        desc:"config message from the platform",
        func:"platformConfig"
    },
    {
        ch:"c",
        desc:"config message from the deployment",
        func:"configMessages"
    },
    {
        ch:"Q",
        desc:"query from the platform",
        func:"queryMessages"
    },
    {
        ch:"q",
        desc:"query from the deployment",
        func:"queryMessages"
    },
    {
        ch:"X",
        desc:"execute command from the platform",
        func:"executeCommand"
    },
    {
        ch:"a",
        desc:"aggregation data from the deployment",
        func:"aggregationMessages"
    },
    {
        ch:"Z",
        desc:"coordinator-coordinator comms",
        func:"CoordinatorMessages"
    }

]


function sendUp(topic, message){
    // send message to the platform
    // seperated out from sendDown as the use cases are much different & a different MQTT Server is required
}
function sendDown(topic,message){
    //send message to the deployment devices
}




function init(coord,mqttServer,coord){
    if(!coord){
        return;
    }
    //connect to the mqtt brokers
    platformMqttClient=mqtt.connect({
        server:m2mMqttServer,
        port:m2mMqttPort
    })
    deploymentMqttClient= mqtt.connect ({
        server:mqttServer[0].server, 
        port:mqttServer[0].port})
    // load the handers into an associative array with empty arrays for the elements (topic =>[handler])
    for(var i=0;i<channels.length;i++){
        // Create a handler for this topic 
        coordHandlers[channels[i].ch] = require("../handlers/coordinator/" + channels[i].func)
        console.log("Added Handler " + channels[i].func + " for coordinator topic " + channels[i].ch)

        console.log("Finished setting up coordinator")
    }
    // Subscribe to each topic
    addSubscriptions(channels)
    
    // track missing/late client readings


    //handle incoming messages
    deploymentMqttClient.on('message', function (topic, _message) {
        try {
          var message = JSON.parse(_message.toString())
          var commands=null
              if(coordHandlers[topic]){
                  console.log("got a coordinator message")
                  var resp = coordHandlers[topic].handleMessage(topic, message)
                   if(resp){
                        if(resp.topic){
                          //send a message
                          m2mMqttClient.publish(resp.topic,JSON.stringify(resp.message))
                        
                      }
                      }
                  }
                
            
          
        } catch (err) {
         console.log(err)
        }
      })

m2mMqttClient.on('message', function (topic, _message) {
    try {
      var message = JSON.parse(_message.toString())
      var commands=null
          if(coordHandlers[topic]){
              console.log("got a coordinator message")
              var resp = coordHandlers[topic].handleMessage(topic, message)
               if(resp){
                    if(resp.topic){
                      //send a message
                      deploymentMqttClient.publish(resp.topic,JSON.stringify(resp.message))
                    
                  }
                  }
              }
            
        
      
    } catch (err) {
     console.log(err)
    }
  })
}
function reset(aggList,mqttServer){
    //clear the mqtt subscriptions (if any)

    //disconnect from the mqtt broker

    //clear all timers

    //set up aggregators
    init(aggList,mqttServer)
}

function addSubscriptions(subs){
    for(var i=0;i<subs.length;i++){
        mqttClient.subscribe(subs[i].ch)
    }
   
}