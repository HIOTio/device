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

var mqtt = require("mqtt");

var debug=require("debug")("broker.js");
var channelsUp = [{
    ch: "X",
    desc: "Execute Command on Device",
    respCh: "x",
    retries: 10,
    timeout: 1000
  }, 
  {
    ch: "C",
    desc: "set device config (from Platform)",
    resp: true,
    respCh: "c"
  },

  {
    ch: "H",
    desc: "Request Device health (from Platform)",
    resp: true,
    respCh: "h"
  }
];
var channelsDown = [
    {
    ch: "x",
    desc: "execution result (from controller)",
    resp: false
  },

  {
    ch: "c",
    desc: "Send device config (to Platform)",
    resp: false
  },
  {
    ch: "h",
    desc: "Send Device health to Platform",
    resp: false
  },

  {
    ch: "w",
    desc: "warning for platform, e.g. response message is late",
    resp: false
  }
];
var myPaths = [];
var responsesNeeded = [];
var publications = [];
var subscriptions = [];
var subscriptionsUp=[];
var handlers = [];
var mqttClient = {};
var timers = []; // need this to track the polling and remove them 
function init(broker, dMqttClient,moscaServer) {
  mqttClient=dMqttClient;
 // debug("setting up " + broker.length + " broker(s)");
  myPaths = [];
  responsesNeeded = [];
  publications = [];
  subscriptions = [];
  subscriptionsUp=[];
  handlers = [];
  if(timers){
  for (var key in timers) {
    delete timers[key];
}
  } 
  timers = [];
  //run local mqtt for downstream connections

   debug("connecting to upstream server" + broker.upMqttServers[0]);
    let upServer = mqtt.connect({
      server: broker.upMqttServers[0].ip,
      port: broker.upMqttServers[0].port
    });
    upServer.on("message", receiveUpstream);
    //and for each path in the broker, ignoring inactive ones
    if (broker.active) {
      for (var k = 0; k < broker.myPaths.length; k++) {

        for (var i = 0; i < channelsDown.length; i++) {
          subscriptions.push(channelsDown[i].ch + "/" + broker.myPaths[k].in);
        }
        var wildcard = 0;
        var _inTopic = broker.myPaths[k].in;
        if (_inTopic.endsWith("#")) {
          wildcard = 2;
          _inTopic = _inTopic.slice(0, _inTopic.length - 2);
        } else if (_inTopic.endsWith("+")) {
          wildcard = 1;
          _inTopic = _inTopic.slice(0, _inTopic.length - 2);
        } else {
          _inTopic = _inTopic.slice(0, _inTopic.length);
        }
        myPaths[_inTopic] = {
          out: broker.myPaths[k].out,
          wildcard,
          server: upServer
        };
      }
    }
  // Subscribe to each topic
  addSubscriptions(subscriptions);
  mqttClient.on("message", receiveDownstream);
}

function getChannel(char) {
  for (var i = 0; i < channelsDown.length; i++) {
    if (channelsDown[i].ch == char) {
      return channelsDown[i];
    }
  }
    for (var i = 0; i < channelsUp.length; i++) {
    if (channelsUp[i].ch == char) {
      return channelsUp[i];
    }
  }
  return null;
}

function getOutPath(topic) {
  var _topic = topic.toString();
  _topic = topic.slice(2); //remove the channel and the first slash
  //need to iterate through the paths because the inbound topic could be any length due to wildcards
  for (var path in myPaths) {
    if (_topic.startsWith(path)) {
      return {
        path: myPaths[path].out,
        server: myPaths[path].server
      };
    }
  }
    return null;
}

function reset(aggList, mqttServer) {
  //clear the mqtt subscriptions (if any)

  //disconnect from the mqtt broker

  //clear all timers

  //set up aggregators
  init(aggList, mqttServer);
}

function addSubscriptions(subs) {
  for (var i = 0; i < subs.length; i++) {
    mqttClient.subscribe(subs[i]);
    debug("subscribed to topic " + subs[i]);
  }

}

function receiveUpstream(topic, _message) {
  //handle message from upstream broker
  /*
      Coordinator -> device
      received on upstream mqtt broker
      send on mqttClient
  */
  forwardMessage(mqttClient, topic, _message);
}

function forwardMessage(_mqtt, topic, _message) {
    debug("received on " + topic);
  try {
    var message = JSON.parse(_message.toString());

    //get the associated channel from the first character
    var ch = topic[0];
    var channel = getChannel(ch);
    // make sure we get a valid channel, just in case
    if (channel) {
      //forward on the response
      var out = getOutPath(topic);
      if (out) {
        _mqtt.publish(ch + "/" + out.path, _message.toString());

      }
      //drop the first character and slash from the topic to match requests and responses
      var _topic = topic.toString().slice(2);
      // is this a response to a previous message

      if (timers[ch]) {
        if (timers[ch][_topic]) {
          //clear the entry from the list of timers
          clearInterval(timers[ch][_topic]._setInterval);
          delete timers[ch][_topic];
        }
      }

      //does this channel require a response  
      debug(channel);
      if (channel.respCh) {
        //set up a timer for this response, issue a warning back to the platform if not received in time
        if (!timers[channel.respCh]) {
          timers[channel.respCh] = [];
        }
        var interval = 3000 //timeout after 3 seconds by default
        var retries = 4 // 4 attempts by default
        if (channel.interval) {
          interval = channel.interval;
        }
        if (channel.retries) {
          retries = channel.retries;
        }
        var si = setInterval(
          function (topic, channel, retries) {
            var _this = this;
            var retry = 0;
            return function () {
              //TODO: see if we"ve gotten a response yet
              retry++
              if (retry > retries) {
                //remove the timer
                _mqtt.publish("e/" + topic, JSON.stringify({
                  err: "Timeout",
                  errorMsg: "no response received"
                }));
                clearInterval(si);
                return;
              }
              debug("Topic " + topic + ": wait " + retry + " of " + retries);
              // this is where the updates
            }
          }(topic, channel, retries),

          interval);
        timers[channel.respCh][_topic] = {
          _setInterval: si
        };
      }
    }
  } catch (err) {
    upServer.publish("e/" + topic, JSON.stringify({
      err: err
    }));
  }
}

function receiveDownstream(topic, _message) {


  var out = getOutPath(topic);
  if (out) {
    forwardMessage(out.server, topic, _message);
  }
}
module.exports = {
  init,
  reset
};