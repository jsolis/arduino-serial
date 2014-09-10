var SerialPort = require("serialport").SerialPort;
var serialport = new SerialPort("/dev/tty.usbserial-DA00UJER");
serialport.on('open', function(){
  console.log('Serial Port Opend');
  serialport.on('data', function(data){
    console.log(data[0]);
    if (data[0] == 1) {
      console.log('making call to build');
    } else if (data[0] == 2) {
      console.log('making call to deploy');
    }
  });
});
