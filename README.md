Eclipse HIP&trade; Device

This is a NodeJS implementation of the HIP device functionality.
All roles have been enabled and configured by default and some tweaks to the config.json configuration file should be enough to connect the device to the [Platform](https://github.com/HIOTio/platform) via the [Coordinator Link](https://github.com/HIOTio/coordinator_link)

In order to run the device you need to have [NodeJS](https://nodejs.org) installed.

When you download or clone the repository, enter the folder and run the following commands:

- "npm install" - to install dependencies
- "node index.js" - to start the device

If you have an MQTT client, like [MQTTFX](http://mqttfx.jensd.de/) you can subscribe to the local server (included in the default device config) and explore the sensor (telemetry) and aggregated data being published
