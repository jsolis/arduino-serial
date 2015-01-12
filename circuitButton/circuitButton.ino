// Send a message over the serial port when the buttons are pushed

#include <LiquidCrystal.h>
#include <ArduinoJson.h>

const int button1Pin = 7;  // pushbutton 1 pin
const int button2Pin = 8;  // pushbutton 2 pin
const int ledPin =  13;    // LED pin

boolean holding1,holding2 = false;

LiquidCrystal lcd(12,11,5,4,3,2);

String message;

const int BUFFER_SIZE = JSON_OBJECT_SIZE(2);
StaticJsonBuffer<BUFFER_SIZE> jsonBuffer;
JsonObject& root = jsonBuffer.createObject();

int commandIndex = -1;

void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);

  // Set up the pushbutton pins to be an input:
  pinMode(button1Pin, INPUT);
  pinMode(button2Pin, INPUT);

  // Set up the LED pin to be an output:
  pinMode(ledPin, OUTPUT);
  
  // Init the LCD screen as 2 lines of 16 characters
  lcd.begin(16, 2);
  lcd.clear();
  lcd.print("Select command");
}

void clearLCDLine(int lineno) {
  lcd.setCursor(0,lineno);
  lcd.print("                ");
  lcd.setCursor(0,lineno);
}

void loop() {
  int button1State, button2State;

  button1State = digitalRead(button1Pin);
  button2State = digitalRead(button2Pin);

  // Button 1 will handle cycling through different requests
  if (button1State == LOW && !holding1)  {
    holding1 = true;
    digitalWrite(ledPin, HIGH);
    commandIndex++;
    Serial.print("GET-DISLAY-NAME:");
    Serial.print(commandIndex);
    Serial.print("\n");
  } else if (button1State == HIGH && holding1) {
    holding1 = false;
    digitalWrite(ledPin, LOW);
  }

  // Button 2 will fire the request
  if (button2State == LOW && !holding2)  {
    holding2 = true;
    digitalWrite(ledPin, HIGH);
    lcd.setCursor(0,1);
    lcd.print("running...      ");
    Serial.print("RUN-COMMAND:");
    Serial.print(commandIndex);
    Serial.print("\n");
  } else if (button2State == HIGH && holding2) {
    holding2 = false;
    digitalWrite(ledPin, LOW);
  }
  
  // Serial listener waits for response back
  if (Serial.available() > 0) {

    message = Serial.readStringUntil('\n');
    Serial.print("debug: message:");
    Serial.print(message);
    Serial.print("\n");
    
    char json[message.length()+1];
    message.toCharArray(json, message.length()+1);
    
    Serial.print("debug: char array: ");
    Serial.print(json);
    Serial.print("\n");
    
    if (json[0] == '{') {
      DynamicJsonBuffer cmdBuffer;
      JsonObject& cmdRoot = cmdBuffer.parseObject(json);
      
      if (cmdRoot.success()) {
        Serial.print("debug: parseObject success!\n");
        String line1 = cmdRoot["line1"].asString();
        String line2 = cmdRoot["line2"].asString();
        if (line1 != "") {
          clearLCDLine(0);
          lcd.print(line1);
        }
        if (line2 != "") {
          clearLCDLine(1);
          lcd.print(line2);
        }
      } else {
        lcd.print("parseObject error");
      }
    } else {
      lcd.clear();
      lcd.print(json);
    }
    
    message = "";
  }
  
  delay(100);
}
