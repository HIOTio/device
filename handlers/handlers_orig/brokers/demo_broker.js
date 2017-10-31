
module.exports = {
  //TODO: re-write this to use the topic path to identify where to send the message
  upstream: function (topic, message) {
        // pass a message up to the next level

  },
  downStream: function (topic,message) {
        // pass a message from the coordinator to the next level
  },
  handleMessage: function(topic,_message){
    var path =[]
    var myPos=-1
    var senderPos =-1
    /* see where the message has come from and where I feature in the list
    *  my pos and sender pos
    *  if sender pos > my pos, forward to my pos -1
    *  else send to my pos + 1
    */
    // TODO: add validation and exception handling (around message.path)
    for(var i=0;i<_message.path.length;i++){
      path.push(_message.path[i])

      if(_message.path[i]===topic){

        myPos=i
      }else if(_message.path[i]===_message.from){
        senderPos=i
      }
    }
    if(myPos==-1 || senderPos==-1){
      //TODO: Implement error handling here - either me or the sender aren't on the message path

    }
    //push the controller onto path
    path.push(_message.controller)
    /* there should only be one between myPos and senderPos
    *  so, next index = myPos + myPos-senderPos
    *  e.g, myPos=4, senderPos=3, next index = 4 + 4 -3 = 5
    *  or, myPos=3, senderPos=4, next index = 3 + 3 - 4 = 2
    */
    //update the "from" details of the message
    _message.from = topic
    return {
      topic: path[myPos*2 - senderPos],
      message: _message
  }
  }
}
