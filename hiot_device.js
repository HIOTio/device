/********************************************************************************
 * Copyright (c) 2017-2018 Mark Healy 1
 *
 * This program and the accompanying materials are made available under the 2
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0 3
 *
 ********************************************************************************/
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

