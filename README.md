A device is the underlying physical hardware which runs one or more of the HIOT roles (e.g. aggregator or coordinator).

Regardless of the hardware and software comprising the device, there are a number of functions which need to be implemented.

The functionality is provided via nodejs as well as arduino sketches/libraries

The following functionality is required for any device:
- return the network configuration for HIOT interfaces (equivalent to "ip addr")
- return details of the installed OS (if any) 
- maintain a list of installed and active HIOT roles (thing-sensor, thing-controller, aggregator, broker)
- report on the "health" of the device (duty cycle - percentage of time taken to execute HIOT functions, memory usage and storage usage)

For each of the installed roles (e.g. aggregator), one or more mqtt publications and/or subscriptions will be needed. In addition, various utility files will be used to provide the required functionality.

