module.exports={
    handleMessage:function(topic,message){
        if(!message.path){
            //no path provided => invalid message
            return {
                topic:"e",
                message:{
                    err:"no path provided"
                }
            }
        }else{
            return{
                topic: message.path,
                message:{
                    channel: message.channel,
                    c: message.c,
                    p: message.p
                }
            }
        
        }
    }
}