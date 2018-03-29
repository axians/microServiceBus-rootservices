const fs = require('fs');
var loadArray = new Array();
var timeAsRealTime = 0;
var startTime = new Date("2016-01-04 07:00:00");
var forecastFilePath;
var loadFilePath;
var lastQuarter;
var timeTimer;
var currentTime = new Date("2016-01-04T06:00:00Z");
const forecastLimit = 96;
var loadForecast = Array(forecastLimit).fill(0);

var exports = module.exports = {
    Start: function () {
        testCase = this.GetPropertyValue('static', 'testCase');
        forecastFilePath = this.GetPropertyValue('static', 'forecastFilePath');
        loadFilePath = this.GetPropertyValue('static', 'loadFilePath');

        var me = this;
        me.msTotalTestTime = 0; // will be determined later by the testcase run


        // Init Testcase, testCase may update startTime + msTotalTestTime
        // A)  _       B)  _   _       C)   ^        D)  _        E)  _     F) _ _     G) Load data from file
        //    | |         | | | |          / \          | |_        _| |      |   |       Jungheinrich 1
        //   _| |_       _| |_| |_      _ /   \ _      _|   |_    _|   |_    _|   |_      2016-01-04 07:00-13:00
        lastQuarter = me.GetStartOfQuarter(startTime);

        me.Debug("Loading input for testCase " + testCase);

        timeTimer = setInterval(function () {
            currentTime.setSeconds(currentTime.getSeconds() + 10);
            var newInput = {
                loadCurrent: me.GetLoad(currentTime)
            };
            me.SubmitMessage(newInput, 'application/json', []);

        }, 1000 );
        

        me.InitTestLoad();
        me.InitForecast();

        me.PrintTestCase();

        me.Debug("Test duration is: " + Math.round((me.msTotalTestTime / 1000) / 60) + " minutes");

    },
    Stop: function () {

    },
    Process: function () {

    },
    PrintTestCase: function () {
        // A)  _       B)  _   _       C)   ^        D)  _        E)  _     F) _ _     G) Load data from file
        //    | |         | | | |          / \          | |_        _| |      |   |       Jungheinrich 1
        //   _| |_       _| |_| |_      _ /   \ _      _|   |_    _|   |_    _|   |_      2016-01-04 07:00-13:00
        // x1 = without forecast, x2 = with forecast
        if (testCase.startsWith("a")) {
            me.Debug(" A)  _   ");
            me.Debug("    | |  ");
            me.Debug("   _| |_ ");
        }
        else if (testCase.startsWith("b")) {
            me.Debug("B)  _   _   ");
            me.Debug("   | | | |  ");
            me.Debug("  _| |_| |_ ");
        }
        else if (testCase.startsWith("c")) {
            me.Debug("C)   ^      ");
            me.Debug("    / \\     ");
            me.Debug(" _ /   \\ _  ");
        }
        else if (testCase.startsWith("d")) {
            me.Debug("D)  _     ");
            me.Debug("   | |_   ");
            me.Debug("  _|   |_ ");
        }
        else if (testCase.startsWith("e")) {
            me.Debug(" E)  _    ");
            me.Debug("   _| |   ");
            me.Debug(" _|   |_  ");
        }
        else if (testCase.startsWith("f")) {
            me.Debug("F) _ _    ");
            me.Debug("  |   |   ");
            me.Debug(" _|   |_  ");
        }
        /*else if (testCase.startsWith("g")) {
            me.Debug("G) Load data from file");
            me.Debug("   Jungheinrich Norderstedt");
            me.Debug("   2016-01-04 07:00-13:00");
        }*/
        else {
            me.Debug("Unknown (non-hardcoded) test case. Assuming data will be loaded from file.");
        }
    },
    GetLoad: function (currentTime) {
        var secondsPassed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
        return loadArray[secondsPassed];
    },
    InitTestLoad: function () {
        switch (testCase) {
            case "a1": case "a2":
            case "b1": case "b2":
            case "c1": case "c2":
            case "d1": case "d2":
            case "e1": case "e2":
            case "f1": case "f2":
                me.InitHardCodedTestLoadAndForecast();
                fs.writeFileSync(loadFilePath, loadArray.join());
                break;
            /*case "g1": case "g2": 
                me.InitTestLoadFromFile();
                break;*/
            default:
                me.InitTestLoadFromFile();
                break;
        }
        me.msTotalTestTime = loadArray.length * 1000;
    },
    InitHardCodedTestLoadAndForecast: function () {
        //var maxLoad = 3500000; // For 500 kW battery and previously 264 kW battery
        //var maxLoad = 1000000; // For 264 kW battery, closest to Jungheinrich real world
        var maxLoad = 100000; // For 27 kW battery
        var halfLoad = me.PrecisionRound((maxLoad / 2), 1);
        var secTotalTestTime = 0;

        if (testCase.startsWith("a")) {
            //     _
            //    | |
            //   _| |_          [45] 15 + 15 + 15   -   15 min peak
            secTotalTestTime = (60 * 15 * 3);
            loadArray = Array(secTotalTestTime).fill(0);
            for (var i = (60 * 15); i < (60 * 15 * 2); i++) {
                loadArray[i] = maxLoad;
            }

            if (testCase == "a2") { // init forecast
                loadForecast[1] = maxLoad;
            }
        }
        else if (testCase.startsWith("b")) {
            //     _   _
            //    | | | |
            //   _| |_| |_      [75] 15 + 15 high + 15 + 15 high + 15   -   Two 15 min peaks seperated by a 15 min quite time
            secTotalTestTime = (60 * 15 * 5);
            loadArray = Array(secTotalTestTime).fill(0);
            for (var i = (60 * 15); i < (60 * 15 * 2); i++) {
                loadArray[i] = maxLoad;
            }
            for (var i = (60 * 15 * 3); i < (60 * 15 * 4); i++) {
                loadArray[i] = maxLoad;
            }

            if (testCase == "b2") { // init forecast
                loadForecast[1] = maxLoad;
                loadForecast[3] = maxLoad;
            }
        }
        else if (testCase.startsWith("c")) {
            //      ^
            //     / \
            //  _ /   \ _       [90] 15 + 30 ascending + 30 decending + 15
            secTotalTestTime = (60 * 15 * 6);
            loadArray = Array(secTotalTestTime).fill(0);
            var diffPerLoad = (maxLoad / (60 * 15 * 2));
            for (var i = (60 * 15); i < (60 * 15 * 3); i++) {
                loadArray[i] = loadArray[i - 1] + diffPerLoad;
            }
            for (var i = (60 * 15 * 3); i < (60 * 15 * 5); i++) {
                loadArray[i] = loadArray[i - 1] - diffPerLoad;
            }

            if (testCase == "c2") { // init forecast
                var total = 0.0;
                for (var i = (60 * 15); i < (60 * 15 * 2); i++) {
                    total += loadArray[i];
                }
                var avg = me.PrecisionRound(total / (60 * 15), 1);
                loadForecast[1] = avg;
                loadForecast[4] = avg;
                total = 0.0;
                for (var i = (60 * 15 * 2); i < (60 * 15 * 3); i++) {
                    total += loadArray[i];
                }
                avg = me.PrecisionRound(total / (60 * 15), 1);
                loadForecast[2] = avg;
                loadForecast[3] = avg;
            }
        }
        else if (testCase.startsWith("d")) {
            //   _  
            //  | |_ 
            // _|   |_          [60] 15 + 15 high + 15 middle + 15
            secTotalTestTime = (60 * 15 * 4);
            loadArray = Array(secTotalTestTime).fill(0);
            for (var i = (60 * 15); i < (60 * 15 * 2); i++) {
                loadArray[i] = maxLoad;
            }
            for (var i = (60 * 15 * 2); i < (60 * 15 * 3); i++) {
                loadArray[i] = halfLoad;
            }

            if (testCase == "d2") { // init forecast
                loadForecast[1] = maxLoad;
                loadForecast[2] = halfLoad;
            }

        }
        else if (testCase.startsWith("e")) {
            //     _
            //   _| |
            // _|   |_          [60] 15 + 15 middle + 15 high + 15
            secTotalTestTime = (60 * 15 * 4);
            loadArray = Array(secTotalTestTime).fill(0);
            for (var i = (60 * 15); i < (60 * 15 * 2); i++) {
                loadArray[i] = halfLoad;
            }
            for (var i = (60 * 15 * 2); i < (60 * 15 * 3); i++) {
                loadArray[i] = maxLoad;
            }

            if (testCase == "e2") { // init forecast
                loadForecast[1] = halfLoad;
                loadForecast[2] = maxLoad;
            }
        }
        else if (testCase.startsWith("f")) {
            //   _ _
            //  |   |
            // _|   |_          [60] 15 + 30 high + 15
            secTotalTestTime = (60 * 15 * 4);
            loadArray = Array(secTotalTestTime).fill(0);
            for (var i = (60 * 15); i < (60 * 15 * 3); i++) {
                loadArray[i] = maxLoad;
            }

            if (testCase == "f2") { // init forecast
                loadForecast[1] = maxLoad;
                loadForecast[2] = maxLoad;
            }
        }
    },
    InitTestLoadFromFile: function () {
        if (!fs.existsSync(loadFilePath)) {
            throw "Missing Load data file " + loadFilePath;
        }

        // Init load from a file
        var data = fs.readFileSync(loadFilePath); // File contains second resolution load data
        var tmpArray = data.toString().split("\n");
        loadArray = new Array(tmpArray.length - 1); // -1 because last row in file should be empty
        for (loadCnt = 0; loadCnt < tmpArray.length - 1; loadCnt++) {
            var dataInLine = tmpArray[loadCnt].toString().split(',');
            var valueIndex = (dataInLine.length == 2 ? 1 : 0);
            loadArray[loadCnt] = parseFloat(dataInLine[valueIndex].replace('\r', ''));
        }
        me.Debug("Loaded consumption data");
    },
    InitForeCast: function () {
        if (!fs.existsSync(forecastFilePath)) {
            // If no forecast exists, assume the forecast is hardcoded
            // Save the forecast to a file, if it does not already exist
            forecasts = new Array(forecastLimit);
            var startOfQuarter = me.GetStartOfQuarter(startTime);
            for (var i = 0; i < forecastLimit; i++) {
                forecasts[i] = { ts: startOfQuarter, v: me.PrecisionRound(loadForecast[i] / 1000, 3) };
                startOfQuarter = me.GetStartOfQuarter(new Date(startOfQuarter.getTime() + (15 * 60000))); // Add 15 minutes
            }
            var jsonData = JSON.stringify(forecasts);
            fs.writeFileSync(forecastFilePath, jsonData);
        }
        //else {
        // The forecast file already exists and...
        // ...the PeakShavingProcess will read the forecast file, so do nothing here
        //}
    },
    GetStartOfQuarter : function () {
        var startOfQuarter;
        // Get the correct quarter
        if (timeToCheck.getMinutes() >= 45) {
            startOfQuarter = new Date(timeToCheck.getFullYear(), timeToCheck.getMonth(), timeToCheck.getDate(), timeToCheck.getHours(), 45, 0, 0);
        }
        else if (timeToCheck.getMinutes() >= 30) {
            startOfQuarter = new Date(timeToCheck.getFullYear(), timeToCheck.getMonth(), timeToCheck.getDate(), timeToCheck.getHours(), 30, 0, 0);
        }
        else if (timeToCheck.getMinutes() >= 15) {
            startOfQuarter = new Date(timeToCheck.getFullYear(), timeToCheck.getMonth(), timeToCheck.getDate(), timeToCheck.getHours(), 15, 0, 0);
        }
        else { // Between 0 and 15
            startOfQuarter = new Date(timeToCheck.getFullYear(), timeToCheck.getMonth(), timeToCheck.getDate(), timeToCheck.getHours(), 0, 0, 0);
        }
        return startOfQuarter;
    },
    PrecisionRound: function () {
        var factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    }

}


/////////////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////



/////////////////////////////////////////////////// FORECAST /////////////////////////////////////////////////////



//////////////////////////////////////////////// UTILITY FUNCTIONS /////////////////////////////////////////////////

//};
//module.exports = SimulationData;
