/* 
 * Service template for node.js
 * 
 * To use this template, simply add your code in Start and Stop method

*/
var timerEvent; // In case you use a timer for fetching data
var interval;
var baudRate;
var serialPortPath;
var batchSize;
var me;
var client;
var uuid = require('uuid');
var moment = require('moment');
var baseReading = [];
var value;
var configuration;
var sensors;
var port;
var adress;
var count = 0;
var batteryController = 0.5;
var exports = module.exports = {

    Start: function () {
        try {
            me = this;
            // Fetch all the static properties of the service
            interval = this.GetPropertyValue('static', 'interval');
           // serialPortPath = this.GetPropertyValue('static', 'serialPortPath');
            baudRate = this.GetPropertyValue('static', 'baudRate');
            port = this.GetPropertyValue('static', 'port');
            adress = this.GetPropertyValue('static', 'adress')
            //batchSize = this.GetPropertyValue('static', 'batchSize');

            configuration = this.GetPropertyValue('static', 'configuration');
            sensors = JSON.parse(configuration);
            // me.Debug("Sensors: " + JSON.stringify(sensors));

            this.AddNpmPackage('modbus-serial@5.3.2,async-foreach', true, function (err) {
                if (!err) {
                    var ModbusRTU = require("modbus-serial");

                    // me.Debug("client:" + client);
                    // Creates a client if the service has not already created one
                    if (!client) {
                        console.log("TEST")
                        me.Debug("Creating client");
                        client = new ModbusRTU();
                        var options = {
                            port : 10000,
                            baudrate: baudRate,
                            parity: 'even',
                            stopBits: 1,
                            dataBits: 8 // alt 7
                        };
                        // open connection to a serial port 
                        client.connectTCP('192.168.255.1', options, function (err) {
                            me.Debug("CONNECTED: " + err);
                            me.Run();
                            timerEvent = setInterval(function () {
                                count++;
                                me.Run();
                            },
                                100);
                        });
                    }

                }
                else {
                    me.ThrowError(null, '00001', 'Unable to install the modbus-stream npm package');
                    return;
                }
            });
        }
        catch (e) {
            me.Debug("EXCEPTION:" + e);
        }
    },

    // The Stop method is called from the Host when the Host is 
    // either stopped or has updated integrations. 
    Stop: function (restart) {
        me.Debug('The Stop method is called.');
        //Close the connection with the serial-port and clear the timerInterval to avoid redundancy
        client.close();
        clearInterval(timerEvent);
        if (restart) {
            me.Debug("Calling start")
            me.Start();
            me.Debug("Start called")
        }
    },

    Process: function (message, context) { },
    Run: function () {
        var forEach = require('async-foreach').forEach;
        me.Debug("Run is called...")
        forEach(sensors, function (reading, index, arr) {
            var done = this.async();

            client.setID(reading.slaveAdress);
            value = null;
            client.readHoldingRegisters(reading.registerAdress, reading.registerSize)
                .then(function (data) {
                    if (!data) {
                        me.Debug("Error readHoldingRegisters");
                            done();
                                return;
                    }
                    else {
                        me.Debug("Reading complete: " + JSON.stringify(data));

                                    
                        value = data.data[2];

                        //Save data in KWh and sets all the properties of the reading
                        me.Debug("Data: " + value + " " + reading.unit);
                            let sensorReading =
                                {
                                    id: uuid.v1(),
                                    device: me.NodeName,
                                    sensor: reading.sensor,
                                    type: reading.type,
                                    ts: moment.utc(),
                                    v: value,
                                    u: reading.unit
                                };
                            
                            //me.Debug("Data pushed to readingsArray: " + value);
                            done();
                                
                            
                        }
                    });

                
               


        });
    }
}


