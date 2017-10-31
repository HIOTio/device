module.exports = {
  poll: function (sensor) {
    var reading = sensor.config.minValue + (Math.random() * sensor.config.range)
    return JSON.stringify({
      date: Date.now(),
      reading: reading,
      sensor_id: sensor.sensor_id
    })
  }
}


