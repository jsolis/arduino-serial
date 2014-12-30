// Send a message over the serial port when the buttons are pushed

#include <LiquidCrystal.h>

const int button1Pin = 7;  // pushbutton 1 pin
const int button2Pin = 8;  // pushbutton 2 pin
const int ledPin =  13;    // LED pin

boolean holding1,holding2 = false;

LiquidCrystal lcd(12,11,5,4,3,2);

String message;

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
}


void loop() {
  int button1State, button2State;

  button1State = digitalRead(button1Pin);
  button2State = digitalRead(button2Pin);

  if (button1State == LOW && !holding1)  {
    holding1 = true;
    digitalWrite(ledPin, HIGH);
    Serial.print("button1\n");
    lcd.setCursor(0,0);
  } else if (button1State == HIGH && holding1) {
    holding1 = false;
    digitalWrite(ledPin, LOW);
  }

  if (button2State == LOW && !holding2)  {
    holding2 = true;
    digitalWrite(ledPin, HIGH);
    Serial.print("button2\n");
    lcd.setCursor(0,1);
  } else if (button2State == HIGH && holding2) {
    holding2 = false;
    digitalWrite(ledPin, LOW);
  }
  
  if (Serial.available() > 0) {
    while (Serial.available() > 0) {
      message += char(Serial.read());
    }
    lcd.print(message);
    message = "";
  }
  
  delay(100);
}
