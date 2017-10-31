//NOTE: this file will be deployed to device-nodejs to enable coordinator functionality

//TODO: mqtt broker on localhost - if not available, select another broker and move the coordinator role over there

/*
    Architecturally, while this is a role, it is not managed by the device, it is managed here in the handler
    The device can direct messages to the coordinator via the standard handleMessage function
*/


var isActive=boolean;
var coordinatorDeviceId;
var coordinatorDescription;
var coordinators=[];
var channels=[
    {
        ch:"b",
        desc:"Broadcast topic for all devices",
        func:"messageRouter"
    },
    {
        ch:"E",
        desc:"Error message from the platform",
        func:"platformError"
    },
    {
        ch:"e",
        desc:"Error message from the deployment",
        func:"deploymentError"
    },
    {
        ch:"R",
        desc:"response from the platform",
        func:"platformResponse"
    },
    {
        ch:"r",
        desc:"response from the deployment",
        func:"deploymentResponse"
    },
    {
        ch:"H",
        desc:"health message from the platform",
        func:"platformHealth"
    },
    {
        ch:"h",
        desc:"health message from the deployment",
        func:"deploymentHealth"
    },
    {
        ch:"C",
        desc:"config message from the platform",
        func:"platformConfig"
    },
    {
        ch:"c",
        desc:"config message from the deployment",
        func:"deploymentConfig"
    },
    {
        ch:"Q",
        desc:"query from the platform",
        func:"platformQuery"
    },
    {
        ch:"q",
        desc:"query from the deployment",
        func:"deploymentQuery"
    },
    {
        ch:"X",
        desc:"execute command from the platform",
        func:"platformExec"
    },
    {
        ch:"a",
        desc:"aggregation data from the deployment",
        func:"deploymentAggregation"
    },
    {
        ch:"Z",
        desc:"coordinator-coordinator comms",
        func:"coordinatorChannel"
    }

]
function init(config){
    //Run coordinator tasks on start

    //TODO: get the device config

    //TODO: start any tasks/listeners

    //TODO: integrate/control the local MQTT broker
}
function messageRouter(message){
    // TODO: categorise the broadcast message and use the appropriate handler
}
function sendUp(topic, message){
    // send message to the platform
    // seperated out from sendDown as the use cases are much different
}
function sendDown(topic,message){
    //send message to the deployment devices
}
modules.exports={
    handleMessage: function(topic,message){
        // need to handle messages from the rest of the deployment, but also from the platform
        /*
-- coordinate devices
-- -- receive health status for each device
-- -- -- ensure required aggregator and broker roles are active
-- -- -- move roles when device is unavailable
-- -- -- move roles when device is short on resources

*/
    }
   

}
