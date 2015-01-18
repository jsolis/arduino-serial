var twilio = require('twilio'),
    express = require('express'),
    bodyParser = require('body-parser'),
    serialport = require('serialport'),
    _ = require('lodash');

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
    url: 'https://api.forecast.io/forecast/2a757ca3116209d20039e3e9bac1aae2/41.2401227,-73.1985881?units=us',
    method: 'GET',
    displayName: 'Trumbull Forecast',
    arduinoResponse: {
      line1: 'currently.temperature',
      line2: 'hourly.summary'
    }
  } 
];

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/sms', function(req, res) {
  res.send('OK');
});

app.post('/sms', function(req, res){

  var smsMessage = req.body.Body.trim();

  var commandIndex = _.findIndex(commands, function(command) {
    return command.displayName.toLowerCase() === smsMessage.toLowerCase();
  });

  var commandDescription = "unknown";

  if (commandIndex > -1) {

    serialport.write('command found...\n');

    commandDescription = "command received";
  } else {

    serialport.write(smsMessage + '\n', function(err, results) {
      if (err) {
	console.log('err ' + err);
      }
      console.log('results ' + results);
    });

    commandDescription = "message displayed";
  }

  var resp = new twilio.TwimlResponse();
  resp.message(function() {
    this.body(commandDescription);
    //.media('http://media.giphy.com/media/y3ADSTHiLwhEs/giphy.gif');
  });
  res.type('text/xml');
  res.send(resp.toString());

});

function getDeepValue(obj, deepKey) {
  if (!deepKey) {
    return '';
  } else if (deepKey.indexOf('.') === -1) {
    return String(obj[deepKey]);
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

  // Start listening on 3000 for Twilio
  app.listen(3000);

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
