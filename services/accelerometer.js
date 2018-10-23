/*
Supported Accelerometers:
  
Analog (Like the Tinkerkit 2/3-Axis Accelerometer)
MPU6050 (I2C IMU)
ADXL345 (I2C)
ADXL335 (Analog)
MMA7361 (Analog)

*/
var five = require("johnny-five");

var exports = module.exports = {
    
    // The Start method is called from the Host. This is where you 
    // implement your code to fetch the data and submit the message
    // back to the host.
    Start : function () {
        var me = this;
        var board = new five.Board(); 
        
        controller = this.GetPropertyValue('static', 'controller');
        pins = this.GetPropertyValue('static', 'pins');
        sensitivity = this.GetPropertyValue('static', 'sensitivity');
        aref = this.GetPropertyValue('static', 'sensitivity');
        zeroV = this.GetPropertyValue('static', 'sensitivity');
        autoCalibrate = this.GetPropertyValue('static', 'sensitivity');
        sleepPin = this.GetPropertyValue('static', 'sleepPin');

        var pinArray = pins.split(',');
        if(pinArray.length < 2){
            
            this.Error(this.Name, '00001', 'At least two pins is required.');
            return;
        }
        
        board.on("ready", function() {

            var accelerometer = new five.Accelerometer({
                pins: pinArray,
                sensitivity: sensitivity, 
                aref: aref,         
                zeroV: zeroV,
                autoCalibrate:autoCalibrate,
                sleepPin: sleepPin
            });
            

            accelerometer.on("change", function() {
                var response = {
                    x : this.x, 
                    y : this.y,
                    z : accelerometer.hasAxis("z") ? this.z : 0
                };

                me.SubmitMessage(response, 'application/json', []);
                
            });
        });
    },

    Stop : function () {
        board = null;
    },    
    
   Process : function (message, context) {},    
}
