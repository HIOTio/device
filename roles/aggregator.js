
/*
 accept an array of aggregator configurations and 
-- create an array of subscriptions (for each topic)
-- set up polling for the aggregator output
-- track missing or delayed messages from sensors

 sample agg config
 {
        "agg_id": "aggregator1",
        "channel": "a/4/4/2",
        "topics": ["s/f1/u1/w", "s/f1/u1/x","a/4/1/1"],
        "description": "First Floor Lighting Aggregator",
        "handler": "aggregators/agg1",
        "poll": 5000
    }
*/
var mqttClient={};
var aggHandlers=[];
var debug=require("debug")("aggregator.js");
var aggSubs=[];
var timers = []; // need this to track the polling and remove them 
function addSubscriptions(subs){
    for(var i=0;i<subs.length;i++){
        mqttClient.subscribe(subs[i]);
        debug("subscribed to " + subs[i]);
    }
   
}
function init(aggList,dMqttClient,mqttServer){
    mqttClient=dMqttClient;
for (var key in timers){
    timers[key].delete;
}
    // load the handers into an associative array with empty arrays for the elements (topic =>[handler])
    // need to have a many to many between topics and handlers
    for(var i=0;i<aggList.length;i++){
        // Create a handler for this topic 
        aggHandlers[aggList[i].channel] = require("../handlers/" + aggList[i].handler);
        debug("Added Handler " + aggList[i].handler + " for aggregator topic " + aggList[i].channel);
        for(var j=0;j<aggList[i].topics.length;j++){
            //subscribe to the topic
            aggSubs.push(aggList[i].topics[j]);
            //Check if there is an entry for this topic already, create one if not
            if(!aggHandlers[aggList[i].topics[j]]){
                aggHandlers[aggList[i].topics[j]]=[];
                debug("Aggregator " + aggList[i].channel +": created new, empty handler array for " + aggList[i].topics[j]);
            }
            aggHandlers[aggList[i].topics[j]].push(require("../handlers/" + aggList[i].handler));
            debug("Aggregator " + aggList[i].channel +": added handler " + aggList[i].handler + " for " + aggList[i].topics[j]);
        }
        // setInterval for the Poll function on each aggregator
        debug("Setting up publication for " + aggList[i].channel);
        timers.push(setInterval(
            function(agg,hand){
                return function () {
                    mqttClient.publish(agg.channel,hand[agg.channel].poll(agg));
                }
            
          }(aggList[i],aggHandlers),
      
           aggList[i].poll));
        debug("Finished setting up aggregator");
    }
    // Subscribe to each topic
    addSubscriptions(aggSubs);
    
    // track missing/late client readings


    //handle incoming messages
    mqttClient.on("message", function (topic, _message) {
        try {
          var message = JSON.parse(_message.toString());
          var commands=null;
          if(aggSubs.indexOf(topic)>=0){
              //this is a valid message for this aggregator
              if(aggHandlers[topic]){
                  // there may be multiple aggregators looking for this sensor value
                  for (var i=0; i<aggHandlers[topic].length;i++){
                      // make sure the handler can handle an inbound message
                      if(aggHandlers[topic][i].handleMessage){
                        var resp = aggHandlers[topic][i].handleMessage(topic, message,commands);
                      if(resp){
                        if(resp.topic){
                          //send a message
                          mqttClient.publish(resp.topic,JSON.stringify(resp.message));
                        }
                      }
                      }
                  }
                
            }
          }

          
        } catch (err) {
         debug(err);
        }
      });
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
    reset
};