var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var serialport = new SerialPort('/dev/tty.usbserial-DA00UJER', {
  parser: serialport.parsers.readline('\n')
});

var request = require('request');

var commands = [
  {
    url: 'https://api.github.com/users/jsolis',
    method: 'GET',
    displayName: 'jsolis location',
    arduinoResponse: {
      line1: '',
      line2: 'location'
    }
  },
  {
    url: 'https://api.github.com/repos/jsolis/arduino-serial',
    method: 'GET',
    displayName: 'arduino-serial owner',
    arduinoResponse: {
      line1: 'owner.login',
      line2: 'updated_at'
    }
  },
  {
    displayName: 'tres leches'
  } 
];

function getDeepValue(obj, deepKey) {
  if (!deepKey) {
    return '';
  } else if (deepKey.indexOf('.') === -1) {
    return obj[deepKey];
  } else {
    var matches = deepKey.match(/(\w+?)\./);
    var thisKey = matches[1];
    var nextObj = obj[thisKey];
    var nextKey = deepKey.replace(thisKey+'.','');
    return getDeepValue(nextObj, nextKey);
  }
}

serialport.on('open', function(){
  console.log('Serial Port Opend');

  serialport.on('data', function(data){
    if (data.indexOf('debug:') > -1) {
      console.log(data);
      return;
    } 

    console.log('Arduino sent: ' + data);

    if (/^GET-DISLAY-NAME:/.test(data)) {
      var commandIndex = data.replace(/^GET-DISLAY-NAME:/, '');
      commandIndex = commandIndex % commands.length;
      var command = commands[commandIndex];
      var displayName = command.displayName;
      serialport.write(displayName);
      serialport.write('\n');      

    } else if (/^RUN-COMMAND:/.test(data)) {

      var commandIndex = data.replace(/^RUN-COMMAND:/, '');
      commandIndex = commandIndex % commands.length;
      var command = commands[commandIndex];

      console.log('arduino command index: ' + commandIndex);
      console.log('arduino command: ', command);

      // Add default User-Agent as many API's require it
      if (!command.headers) command.headers = {};
      if (!command.headers['User-Agent']) command.headers['User-Agent'] = 'jsolis arduino serial http client';

      request(command, function(error, response, body) {
	console.log('RESPONSE:');
	console.log(body);

        var resp = JSON.parse(body);
        var arduinoResponseLine1 = getDeepValue(resp, command.arduinoResponse.line1);
        var arduinoResponseLine2 = getDeepValue(resp, command.arduinoResponse.line2);
        console.log('arduinoResponseLine1: ', arduinoResponseLine1);
        console.log('arduinoResponseLine2: ', arduinoResponseLine2);

        var arduinoResponse = {
          line1: arduinoResponseLine1,
          line2: arduinoResponseLine2
        };

	if (!error && response.statusCode == 200) {
	  serialport.write(JSON.stringify(arduinoResponse));
	  serialport.write('\n');
	}
      });
    }
  });
});
