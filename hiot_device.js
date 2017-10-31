var os = require('os')
var disk = require('fd-diskspace')

var myIP = function () {
  var interfaces = os.networkInterfaces()
  return {
    network_interfaces: interfaces
  }
}

var memUsage = function () {
  return {
    total_memory: os.totalmem(),
    available: os.freemem(),
    percent_available: os.freemem() / os.totalmem() * 100
  }
}
var diskUsage = function () {
  return disk.diskSpaceSync()
}

var platform = function () {
  return {
    hostname: os.hostname(),
    architecture: os.arch(),
    processors: os.cpus(),
    os_type: os.type(),
    platform: os.platform(),
    release: os.release()
  }
}

var health = function () {
  return {
    load: os.loadavg(),
    uptime: os.uptime(),
    memory: memUsage(),
    disk: diskUsage()
  }
}

var dump = function () {
 // console.log(myIP())
//  console.log(platform())
//  console.log(health())
}

dump()
