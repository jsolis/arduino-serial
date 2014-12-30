var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var serialport = new SerialPort("/dev/tty.usbserial-DA00UJER", {
  parser: serialport.parsers.readline("\n")
});

serialport.on('open', function(){
  console.log('Serial Port Opend');

  serialport.on('data', function(data){
    console.log('data: ' + data);

    data = data + '';

    if (data === 'button1') {
      console.log('making call for button1');
      serialport.write('foobar success');
    } else if (data === 'button2') {
      console.log('making call for button2');
      serialport.write('barfoo worked');
    }
  });
});
