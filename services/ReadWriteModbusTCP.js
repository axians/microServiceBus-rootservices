const PAC_BESS_EC = 20020;
const SOC_BESS_USABLE = 20009;
const P_SET_BESS = 20502;
const CMD_BESS = 20501;
var ModbusRTU;
var client;
var isTest ;
var batteryOutput;
var batterySOC;
var readBatteryOutputTimer;
var readBatterySOCTimer;
var testTimeAsRealTime = 1;
var exports = module.exports = {
    Start: function () {
        ModbusRTU = require('modbus-serial');
        if (isTest) {
            me.Debug("StartPeakShavingProcess : Starting a test...");
            if (!client) {
                me.Debug("Creating client");
                client = new ModbusRTU();
                // open connection to a serial port 
                client.connectTCP('192.168.2.11', { port: 502 }, function (err) {
                    me.Debug("CONNECTED: " + err);
                    client.setID(0);
                });
            }
        }
        else {
            me.Debug("StartPeakShavingProcess : Starting...");

        }

        var readWriteTimer = setInterval(function () {
            client.writeRegisters(20500, [me.GetNextCNT(), 1])
                .then(function () {
                    //me.Debug("Write went well");
                    client.readHoldingRegisters(20000, 1)
                        .then(function (data) {
                            //me.Debug("Read went well");
                            me.CheckCNT(data.data[0]);
                        })
                        .catch(function (err) {
                            me.Debug("Error reading CNT: \"" + err + "\". CNT is " + CNT);
                        })
                })
                .catch(function (err) {
                    me.Debug("Error writing CNT: \"" + err + "\". CNT is " + CNT);
                })
        }, 500);

        if (!isTest || (isTest && testTimeAsRealTime == 1)) {
            readBatteryOutputTimer = setInterval(function () {
                if (!isTest) { // Prod
                    // TODO: Prod code here to read battery meter from BMS TCP modbus register 
        
                }
                else {// if(isTest && testTimeAsRealTime == 1) {
                    // if not using real battery...
                    //batteryOutput = batterySimulationController.batteryOutput;
        
                    // if using real battery
                    me.ReadRegisterInt32(20020, 1, 0, function (val) {
                        let newInput = { batteryOutput: val };
                        //me.Debug("Sending new batteryOutput input: " + JSON.stringify(newInput));
                        try {
                            //peakshaving.send(newInput);
                            me.SubmitMessage(newInput, 'application/json', []);
                        }
                        catch (err) {
                            me.Debug("Error: \"" + err + "\" when sending new battery output to model: " + (typeof val) + " " + val);
                        }
                    });
        
        
        
                }
            }, 1000 );
        
            readBatterySOCTimer = setInterval(function () {
                //var batteryStateOfCharge = 0.0;
                if (!isTest) { // Prod
                    // TODO: Prod code here to read battery state of charge from BMS TCP modbus register
                }
                else {// if (isTest && testTimeAsRealTime == 1) {
                    // if not using real battery...
                    //batteryStateOfCharge = batterySimulationController.batteryStateOfCharge;
        
                    // if using real battery
                    me.ReadRegisterInt16(20009, 0.0001, 4, function (val) {
                        let newInput = { batteryStateOfCharge: val };
                        //me.Debug("Sending new batterySOC input: " + JSON.stringify(newInput));
                        try {
                            //peakshaving.send(newInput);
                            me.SubmitMessage(newInput, 'application/json', []);
                        }
                        catch (err) {
                            me.Debug("Error: \"" + err + "\" when sending new battery SOC to model: " + (typeof val) + " " + val);
                        }
                    });
                }
            }, 1000);
            
        
        }
    },
    Stop: function () {

    },
    Process: function (message, context) {
        if(message.setpoint){
            me.WriteRegisters(setpoint);
        }
    },
    WriteRegisters : function(setpoint){
        if (setpoint < 0) {
            setpoint = 65536 - Math.abs(setpoint);
        }
    
        client.writeRegisters(20500, [me.GetNextCNT(), 1, setpoint])
            .then(function () {
                //me.Debug("Writing a new battery set point went well");
                client.readHoldingRegisters(20000, 1)
                    .then(function (data) {
                        //me.Debug("Read went well after battery set point");
                        me.CheckCNT(data.data[0]);
                    })
                    .catch(function (err) {
                        me.Debug("Error when reading CNT register: \"" + err + "\". CNT is " + (typeof CNT) + " " + CNT);
                    })
            })
            .catch(function (err) {
                me.Debug("Error: \"" + err + "\" when writing a new battery set point: " + (typeof setpoint) + " " + setpoint + ". CNT is " + (typeof CNT) + " " + CNT);
            })
    },
    GetNextCNT: function () {
        CNT++;
        if (CNT > 65535) {
            me.Debug("CNT reached 65535. Resetting to 0.");
            CNT = 0;
        }
        return CNT;
    },
    CheckCNT: function (cnt) {
        if (Math.abs(CNT - cnt) > 1000) {
            me.Debug("Warning: CNT written is " + CNT + " but CNT_RM read is " + cnt);
            // TODO: What should we really do if this happens?
            // Note: Will also alert when CNT starts over.
            // Warning: CNT written is 53 but CNT_RM read is 65489
        }
    },
    ReadRegisterInt16 : function(register, scale, decimals, whenValueRead){
        client.writeRegisters(20500, [me.GetNextCNT(), 1])
        .then(function () {
            client.readHoldingRegisters(register, 1)
                .then(function (data) {
                    val = data.data[0];
                    if (val > 32767) {
                        val = -1 * (65536 - val);
                    }
                    //me.Debug("READInt16 SOC" + register + " : " + (val * factor));
                    if (whenValueRead) {
                        whenValueRead(precisionRound(val * scale, decimals));
                    }
                })
                .catch(function (err) {
                    me.Debug("Error : \"" + err + "\" when reading battery output from PLC");
                })
        })
        .catch(function (err) {
            me.Debug("CatchWriteRegister20500. Error when writing CNT: " + (typeof CNT) + " " + CNT + ", before reading battery output: " + err);
        });
    },
    ReadRegisterInt32 : function(register, scale, decimals, whenValueRead){
        client.writeRegisters(20500, [me.GetNextCNT(), 1])
        .then(function () {
            client.readHoldingRegisters(register, 2)
                .then(function (data) {
                    //me.Debug("READ [0]:" + data.data[0] + " [1]:" + data.data[1]);
                    // Int32, Max: 4294967295, Half: 2147483647
                    val = ((data.data[1] << 16) | data.data[0])
                    if (val > 2147483647) {
                        val = -1 * (4294967296 - val);
                    }
                    //me.Debug("READInt32 2 batOut" + register + " : " + (val * factor));
                    if (whenValueRead) {
                        whenValueRead(precisionRound(val * scale, decimals));
                    }
                })
                .catch(function (err) {
                    me.Debug("Error : \"" + err + "\" when reading battery output from PLC");
                })
        })
        .catch(function (err) {
            me.Debug("CatchWriteRegister20500. Error when writing CNT: " + (typeof CNT) + " " + CNT + ", before reading battery output: " + err);
        });
    }
}



