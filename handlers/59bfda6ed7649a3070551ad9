const {exec} = require('child_process')
//TODO: need to load this list dynamically and add some validation (number ad type of parameter)
module.exports = {
  handleMessage: function (topic, message,commands) {
    var command = message
    try {
    } catch (e) {
      // not valid command -> just ignore it for now
  //    console.log(e)
    }
      /*
      
      Structure of a command
    {
        "sender":"sending device" ,
        "c": "commandID" ,
        "p":[
            {
                "id":"p1",
                "value":"parameter value"
            }
       
        ]
      }  
      
      => need to "lookup relevant command (based on "topic") - probably best to include a config file and read from there??
      
      exec command[c] p1.value ....
    
      */
      var parameters =""
      for(var a=0 ; a<message.p.length;a++){
          //FUTURE: check commands for required parameters
          parameters += message.p[a].v + ' '
      }
      exec ('' + commands[message.c].e + ' ' + parameters, function(err,stdout,stderr){
        //TODO: need to return status (err or OK etc.)
      //    console.log("Error" + err)
       //   console.log("Std out" + stdout);
        //  console.log("Std Err" + stderr)
      })
  }
}
