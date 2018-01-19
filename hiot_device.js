var os = require("os");
var disk = require("fd-diskspace");

exports.myIP = function () {
  var interfaces = os.networkInterfaces();
  return {
    networkInterfaces: interfaces
  };
};

exports.memUsage = function () {
  return {
    totalMemory: os.totalmem(),
    available: os.freemem(),
    percentAvailable: os.freemem() / os.totalmem() * 100
  };
};
exports.diskUsage = function () {
  return disk.diskSpaceSync();
};

exports.platform = function () {
  return {
    hostname: os.hostname(),
    architecture: os.arch(),
    processors: os.cpus(),
    os_type: os.type(),
    platform: os.platform(),
    release: os.release()
  };
};

exports.health = function () {
  return {
    load: os.loadavg(),
    uptime: os.uptime(),
    memory: memUsage(),
    disk: diskUsage()
  };
};

var dump = function () {
};

