/*

    Act as intermediary for health and config channels
    Send execution commands to controllers

    2 Network interfaces & 2 mosca deployments, one on local subnet ("downstream") and one to route "upstream"
    
    Publications & subscriptions
    -- x/<x>/<y>/<z>/.../deviceId = execute command on controller
    -- h/<x>/<y>/<z>/.../deviceId = forward health messages from devices 
    -- x/<x>/<y>/<z>/ (.../controllerId) = subscribe to execution commands on a particular path
    -- C/<x>/<y>/<z>/ (.../deviceId) =  forward config requests from platform to device
    -- c/<x>/<y>/<z>/.../deviceId = send config to platform
    -- e/<x>/<y>/<z>/.../deviceId = send error messages to platform
    -- B... = Broker to Broker comms - for future use...

    -- each publication has a "needResponse" flag - used to track responses required, send "e" message if no response received

    timer structure
    {
        ch:X, -- this is the response channel
        items:[
            {
                "createdAt":dateTime,
                "channel": X/1/2/3,
                setInterval: setIntervalInstance  -- this is what we want to cleanInterval
            }
        ]
        
    }
    setInterval requirements
    -- track number of iterations
    -- purge timer and clearInterval after retry limit (default 5)
    -- send warning to platform (add "w/" to start of path)
*/

var mqtt= require('mqtt')

var channels=[
    {
        ch:"X",
        desc:"Execute Command on Device",
        respCh:"x",
        retries:10,
        timeout:1000
    },{
        ch:"x",
        desc:"execution result (from controller",
        resp:false
    },
    {
        ch:"C",
        desc:"set device config (from Platform)",
        resp:true,
        respCh:"c"
    },
    {
        ch:"c",
        desc:"Send device config (to Platform)",
        resp:false
    },
    {
        ch:"h",
        desc:"Send Device health to Platform",
        resp:false
    },
    {
        ch:"H",
        desc:"Request Device health (from Platform)",
        resp:true,
        respCh:"h"
    },
    {
        ch:"w",
        desc:"warning for platform, e.g. response message is late",
        resp:false
    }
]
var myPaths = []
var responsesNeeded=[]
var publications =[]
var subscriptions=[]
var handlers=[]
var mqttClient={}
var timers = [] // need this to track the polling and remove them 
module.exports={
    init:init,
    reset: reset
}
function init(brokers,mqttServer){
    //connect to the mqtt broker
    mqttClient= mqtt.connect ({
        server:mqttServer[0].server, 
        port:mqttServer[0].port})
        //set up all channels for each ACTIVE broker
        for(var j=0;j<brokers.length;j++){
            //and for each path in the broker, ignoring inactive ones
            if(brokers[j].active){
                for (var k=0;k<brokers[j].myPaths.length;k++){
                    
    for(var i=0;i<channels.length;i++){
                    subscriptions.push(channels[i].ch + "/" + brokers[j].myPaths[k].in)
                }
                var wildcard=0
                var _inTopic=brokers[j].myPaths[k].in
                if(_inTopic.endsWith("#")){
                    wildcard=2
                    _inTopic=_inTopic.slice(0,_inTopic.length-2)
                }else if( _inTopic.endsWith("+")){
                    wildcard=1
                    _inTopic=_inTopic.slice(0,_inTopic.length-2)
                }else{
                    _inTopic=_inTopic.slice(0,_inTopic.length-1)
                }
                    myPaths[_inTopic]={
                        out:brokers[j].myPaths[k].out,
                        wildcard:wildcard
                    } 
                   
            }
        }
    }
    // Subscribe to each topic
    addSubscriptions(subscriptions)
    mqttClient.on('message', function (topic, _message) {
        try {
          var message = JSON.parse(_message.toString())

          //get the associated channel from the first character
          var ch=topic[0]
          var channel =getChannel(ch)
          // make sure we get a valid channel, just in case
          if(channel){
              //forward on the response
          var out=getOutPath(topic)
          if(out){
            mqttClient.publish(ch + "/" + out,_message.toString())

          }
            //drop the first character and slash from the topic to match requests and responses
            var _topic=topic.toString().slice(2)  
            // is this a response to a previous message

            if(timers[ch]){
                if(timers[ch][_topic]){
                    //clear the entry from the list of timers
                    clearInterval(timers[ch][_topic]._setInterval)
                    delete timers[ch][_topic]
                }
            }
            
            //does this channel require a response  
            console.log(channel)
            if(channel.respCh){
                //set up a timer for this response, issue a warning back to the platform if not received in time
                if(!timers[channel.respCh]){
                    timers[channel.respCh]=[]
                }
                var interval=3000 //timeout after 3 seconds by default
                var retries=4 // 4 attempts by default
                if(channel.interval){
                    interval=channel.interval
                }
                if(channel.retries){
                    retries=channel.retries
                }
                var si=setInterval(
                    function(topic,channel,retries) {
                        var _this = this
                        var retry=0;
                        return function(){
                            //TODO: see if we've gotten a response yet

                            retry++
                            if(retry>retries){
                                //remove the timer
                                mqttClient.publish("e/" + topic, JSON.stringify({
                                    err: "Timeout",
                                    errorMsg: "no response received"
                                }))
                                clearInterval(si)
                                return
                            }
                            console.log("Topic " + topic +": wait " + retry + " of " + retries)
                            // this is where the updates
                        }
                    }(topic,channel,retries),
              
                   interval)
                timers[channel.respCh][_topic]= {
                            _setInterval: si
                        }
                    }
                }
        } catch (err) {
         mqttClient.publish("e/" + topic,JSON.stringify({
            err:err
         }))
        }
      })
}

function getChannel(char){
    for(var i=0;i<channels.length;i++){
        if(channels[i].ch==char){
            return channels[i]
        }
    }
    return null
}
function getOutPath(topic){
    var _topic = topic.toString()
    _topic=topic.slice(2) //remove the channel and the first slash
    //need to iterate through the paths because the inbound topic could be any length due to wildcards
    for (path in myPaths){
        if(_topic.startsWith(path)){
        return myPaths[path].out
        }
    }
    return null
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
        mqttClient.subscribe(subs[i])
        console.log ("subscribed to topic " + subs[i])
    }
   
}