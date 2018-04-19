module.exports = function (sensor){
 return{ handler:  function(messaging){
	 var reading = sensor.config.minValue + (Math.random() * sensor.config.range)
    messaging(sensor.topic,JSON.stringify({
      d: Date.now(),
      r: reading,
      s: sensor._id
    }));
  }
 }
}


