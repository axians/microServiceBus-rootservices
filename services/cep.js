/*
The MIT License (MIT)

Copyright (c) 2014 microServiceBus.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var self;
var eep;
var tumblingWindow;

var exports = module.exports = {
    Start : function () {
        self = this;
        self.Debug('eep started');
            
        this.AddNpmPackage('eep', true, function(err){
            self.Debug('eep installed');
            if(!err){
                eep = require('eep');
                let windowType = self.GetPropertyValue('static', 'windowType');
                let windowLength = self.GetPropertyValue('static', 'windowLength');
                
                switch(windowType){
                    case 'COUNT':
                        tumblingWindow = eep.EventWorld.make().windows().tumbling(eep.Stats.count, windowLength);
                        break;
                    case 'SUM':
                        tumblingWindow = eep.EventWorld.make().windows().tumbling(eep.Stats.sum, windowLength);
                        break;
                    case 'MEAN':
                        tumblingWindow = eep.EventWorld.make().windows().tumbling(eep.Stats.mean, windowLength);
                        break;
                    case 'MAX':
                        tumblingWindow = eep.EventWorld.make().windows().tumbling(eep.Stats.max, windowLength);
                        break;
                    case 'MIN':
                        tumblingWindow = eep.EventWorld.make().windows().tumbling(eep.Stats.min, windowLength);
                        break;
                    default:
                        self.ThrowError(null, '00002', 'Unsuported window type. Supported types are COUNT, SUM, MIN, MAX and MEAN.');
                        return;
                }
                
                tumblingWindow.on('emit', function(value) {
                    self.Debug('eep value: ' + value);
                    let reading = {
                        dt : new Date(),
                        type : windowType,
                        val : value
                    }
                    self.SubmitMessage(reading, 'application/json', []);
                });
            }
            else{
                self.ThrowError(null, '00001', 'Unable to install the azure-storage npm package');
                return;
            }
        });
    },

    Stop : function () {
    },    
    
    // Only accepts files
    Process : function (value, context) {
        if(eep)
            tumblingWindow.enqueue(value);
    },    
}
