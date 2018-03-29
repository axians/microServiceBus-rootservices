const path = require("path");
const fork = require("child_process").fork;
const BatterySimulationController = require(path.resolve('./BatterySimulationController.js'));
const SelfAdjustingTimer = require(path.resolve('./SelfAdjustingTimer.js'));
const program = path.resolve("PeakShavingProcess.js");
const SimulationData = require(path.resolve('./SimulationData.js'));

const parameters;
const peakshaving;
const options = [];

var batterySimulationController = new BatterySimulationController();
var forecastFilePath;
var loadFilePath;
var logFilePath;
var routineStartTime;
var testStartTime;
var currentTime;
var batteryOutput;
var batterySOC;
var batteryLoad;
var loadCurrent;
var readCurrentLoadTimer;
var CNT = 0;

var isTest = false;
var testCase; // will be used to decide what scenario to run
var me;
var exports = module.exports = {
    Start: function () {
        me = this;
        isSimulatedBattery = this.GetPropertyValue('static', 'isSimulatedBattery');
        testCase = this.GetPropertyValue('static', 'testCase');
        forecastFilePath = this.GetPropertyValue('static', 'forecastFilePath');
        loadFilePath = this.GetPropertyValue('static', 'loadFilePath');
        logFilePath = this.GetPropertyValue('static', 'logFilePath');
        
        routineStartTime = new Date();
        if (isTest) {
            logFilePath = logFilePath + "/PeakShavingControllerLog_Case_" + testCase + "_" +
                routineStartTime.getFullYear().toString() + ("0" + routineStartTime.getMonth().toString()).slice(-2) + ("0" + routineStartTime.getDate().toString()).slice(-2) +
                "_" + ("0" + routineStartTime.getHours().toString()).slice(-2) + ("0" + routineStartTime.getMinutes().toString()).slice(-2) + ("0" + routineStartTime.getSeconds().toString()).slice(-2) + ".csv";
        }
        else {
            logFilePath = logFilePath + "/PeakShavingControllerLog_" +
                routineStartTime.getFullYear().toString() + ("0" + routineStartTime.getMonth().toString()).slice(-2) + ("0" + routineStartTime.getDate().toString()).slice(-2) +
                "_" + ("0" + routineStartTime.getHours().toString()).slice(-2) + ("0" + routineStartTime.getMinutes().toString()).slice(-2) + ("0" + routineStartTime.getSeconds().toString()).slice(-2) + ".csv";
        }

        testStartTime = new Date("2016-01-04T06:00:00Z"); // will be the basis for what time the test believes it is
        currentTime = new Date(testStartTime.getTime());; // will be updated continously with the time the test believes it currently is
        parameters = [
            "testCase=" + testCase // what test to run
            , //"totalTestTimeMs=" + simulationData.msTotalTestTime // will be determined later by the testcase run, how long to run test for
            , "testTimeAsRealTime=" + testTimeAsRealTime // Run in loop (0) or according to real time (1)
            , "testStartTime=" + testStartTime // What time the test should believe it is, matters for example what forecast it retrieves and if it starts at start of quarter or not
            , "forecastFilePath=" + forecastFilePath // Where to find the forecast file, path and file name
            , "doLog=true" // If we should produce a log file
            , "logResolution=s" // How often to write to log, ms = on every call, s = once per second, mi = once per minute, q = once per quarter
            , "logFilePath=" + logFilePath // Where to place logfiles, path and file name
        ];


        peakshaving = fork(program, parameters, options);
        peakshaving.on("exit", function (code, signal) {
            me.Debug("peakshaving process exited with code " + code + " and signal " + signal);
            me.Stop();
        });
        peakshaving.on("close", function (code) {
            me.Debug("peakshaving process closed with code " + code);
            me.Stop();
        });
        peakshaving.on("message", message => {

            if (message.batterySetpoint != undefined) {
                if (isTest) {
                    // ADDED
                    // batterySetpoint from model => -250000 W - 250.000 W => model delivers value in W
                    // Register wants = -250.00 - 250.00 kW, factor 0.01 => -25000 - 25000
                    // model W / 1000 = kW = -250.00 - 250.00, round to two decimals
                    // model kW * 100 (factor) = -25000 - 25000
                    // So... model W / 1000 (kW) * 100 (factor)
                    // So... model / 10 (round, no decimals) = value to write to register

                    var setpoint = Math.round(message.batterySetpoint / 10);
                    

                    currentTime = new Date(message.currentTime);
                    if (isSimulatedBattery == 1) { // if simulated time, send new inputs immediatly
                        //var loadCurrent = simulationData.getLoad(currentTime);
                        batterySimulationController.update(setpoint);
                        var newInput = {
                            batteryOutput: batterySimulationController.batteryOutput,
                            batteryStateOfCharge: batterySimulationController.batteryStateOfCharge,
                        };
                        peakshaving.send(newInput);
                    }
                }
                else {
                    me.SubmitMessage(setpoint, 'application/json', []);
                    // TODO: Production code for writing new battery setpoint to BMS modbus register
                }
            }

            if (message.plim_changed != undefined) {
                // Handle changed P_LIM (aka send new value to cloud)
                if (isTest) {
                    me.Debug("P_LIM Changed event. New P_LIM " + message.plim_changed);
                }
                else {
                    // TODO: Production code for sending updated P_LIM to cloud
                }
            }
        });



    },
    Stop: function () {
        me.SubmitMessage(0, 'application/json', []);
    },
    Process: function (message, context) {
        peakshaving.send(message);



    },
    PrecisionRound: function (number, precision) {
        var factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    },




};


/*var simulationData = new SimulationData(
    testCase, // will be used to decide what scenario to run
    testStartTime, // will be the basis for what time the test believes it is
    forecastFilePath, // will be where the simulation forecast is saved
    loadFilePath); // will be where the simulation load is saved







/*
// There are other Jungheinrich values that need to be read
// These are not important for PeakShavingController
// But still need to be read/stored/sent to cloud from the battery
var readBatteryDiagnosticsSecondsTimer = setInterval(function () {
    // read second resolution values
}, 1000); // every second

var readBatteryDiagnosticsQuarterTimer = setInterval(function () {
    // read quarter / 15 min resolution values
}, 15 * 60 * 1000); // every 15 minutes
*/

/////////////////////////////////////////////////////////////////////////
// OnTerminate
/*
if (readBatteryOutputTimer) {
    clearInterval(readBatteryOutputTimer.timer);
}
if (readBatterySOCTimer) {
    clearInterval(readBatterySOCTimer.timer);
}
if (readCurrentLoadTimer) {
    clearInterval(readCurrentLoadTimer.timer);
}
batterysimulation.terminate();
peakshaving.kill('SIGINT');
*/
