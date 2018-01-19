var debug = require("debug")("aggregationMessage.js");

exports.handleMessage=function(topic,message){
    return {
        send:true,
        topic: "a",
        message,

    };
};