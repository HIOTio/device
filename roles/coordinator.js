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
var mqtt= require("mqtt");

var debug=require("debug")("coordinator.js");
var deploymentMqttClient={};
var platformMqttClient={};
var aggHandlers=[];
var aggSubs=[];
var timers = [] // need this to track the polling and remove them 

function addPlatformSubscriptions(subs){
    for(var i=0;i<subs.length;i++){
        platformMqttClient.subscribe(subs[i].ch + "/#")
    }
   
}
function addDeploymentSubscriptions(subs){
    for(var i=0;i<subs.length;i++){
        deploymentMqttClient.subscribe(subs[i].ch + "/#")
    }
   
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
var coordHandlers=[];
var Pchannels=[
    {
        ch:"E",
        desc:"Error message from the platform",
        func:"ErrorMessages"
    },
    {
        ch:"R",
        desc:"response from the platform",
        func:"responseMessages"
    },
    {
        ch:"C",
        desc:"config message from the platform",
        func:"platformConfig"
    },
    {
        ch:"Q",
        desc:"query from the platform",
        func:"queryMessages"
    },
    {
        ch:"X",
        desc:"execute command from the platform",
        func:"executeCommand"
    },
    {
        ch:"Z",
        desc:"coordinator-coordinator comms",
        func:"CoordinatorMessages"
    }

];
var Dchannels=[

    {
        ch:"e",
        desc:"Error message from the deployment",
        func:"ErrorMessages"
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
        ch:"c",
        desc:"config message from the deployment",
        func:"configMessages"
    },

    {
        ch:"q",
        desc:"query from the deployment",
        func:"queryMessages"
    },

    {
        ch:"a",
        desc:"aggregation data from the deployment",
        func:"aggregationMessages"
    },


];

function sendUp(topic, message){
    // send message to the platform
    // seperated out from sendDown as the use cases are much different & a different MQTT Server is required
}
function sendDown(topic,message){
    //send message to the deployment devices
}




function init(coord,mqttClient,moscaServer){

    if(!coord){
        return;
    }
    deploymentMqttClient=moscaServer;
    //connect to the mqtt brokers
    platformMqttClient=mqttClient;
    

    // load the handers into an associative array with empty arrays for the elements (topic =>[handler])
    var i=0;
    for( i=0;i<Dchannels.length;i++){
        // Create a handler for this topic 
        coordHandlers[Dchannels[i].ch] = require("../handlers/coordinator/" + Dchannels[i].func);
        debug("Added Handler " + Dchannels[i].func + " for coordinator deployment topic " + Dchannels[i].ch);

    }
        for( i=0;i<Pchannels.length;i++){
        // Create a handler for this topic 
        coordHandlers[Pchannels[i].ch] = require("../handlers/coordinator/" + Pchannels[i].func);
        debug("Added Handler " + Pchannels[i].func + " for coordinator platform topic " + Pchannels[i].ch);

    }
    // Subscribe to each topic
    addDeploymentSubscriptions(Dchannels);
    addPlatformSubscriptions(Pchannels);
    
    // track missing/late client readings


    //handle incoming messages
    deploymentMqttClient.on("message", function (topic, _message) {
        try {
          var message = JSON.parse(_message.toString());
          var commands=null;
              if(coordHandlers[topic]){
                  debug("got a coordinator message");
                  var resp = coordHandlers[topic].handleMessage(topic, message);
                   if(resp){
                        if(resp.topic){
                          //send a message
                          platformMqttClient.publish(resp.topic,JSON.stringify(resp.message));
                        
                      }
                      }
                  }
                
            
          
        } catch (err) {
         debug(err);
        }
      });

platformMqttClient.on("message", function (topic, _message) {
    try {
      var message = JSON.parse(_message.toString());
      var commands=null;
          if(coordHandlers[topic.substring(0,1)]){
              var resp = coordHandlers[topic.substring(0,1)].handleMessage(topic.substring(0,1), message);
               if(resp){
                    if(resp.topic){
                      deploymentMqttClient.publish(resp.topic,JSON.stringify(resp.message));
                    
                  }
                  }
              };      
    } catch (err) {
     debug(err);
    }
  })
}
function reset(aggList,mqttServer){
    //clear the mqtt subscriptions (if any)

    //disconnect from the mqtt broker

    //clear all timers

    //set up aggregators
    init(aggList,mqttServer);
}


module.exports={
    init,
    reset,
    handleMessage
};