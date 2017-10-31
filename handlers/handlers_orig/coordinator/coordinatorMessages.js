module.exports={
    handleMessage: function(topic,message){
        console.log("got a coordinator message on topic" + topic);
        console.log(JSON.stringify(message))
        console.log("--------------------------------------")
    }
}