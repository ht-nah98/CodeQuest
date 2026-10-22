// Leanbot self-check for the coach (tools/leanbot-check/check.py drives it over serial).
// Prints the same status line as lesson 0's test program, ten times a second:
//   TB 0000 - IR 00 0000 00 - 23 cm - GR 0 0
// and answers one command per line; each command prints "DONE <command>" when it ends.
#include <Leanbot.h>

void setup() {
  Leanbot.begin();
  Serial.println("READY leanbot-check");
}

void loop() {
  readCommand();
  printStatus();
  LbDelay(100);
}

void printStatus() {
  const eLbTouchButton touch[] = {TB1A, TB1B, TB2A, TB2B};
  Serial.print("TB ");
  for (int i = 0; i < 4; i++) Serial.print(LbTouch.read(touch[i]) == HIGH ? "1" : "0");

  Serial.print(" - IR ");
  Serial.print(LbIRSensor.read(sir6L) > 60 ? 1 : 0);
  Serial.print(LbIRSensor.read(sir4L) > 60 ? 1 : 0);
  Serial.print(" ");
  LbIRLine.print(LbIRLine.read());
  Serial.print(" ");
  Serial.print(LbIRSensor.read(sir5R) > 60 ? 1 : 0);
  Serial.print(LbIRSensor.read(sir7R) > 60 ? 1 : 0);

  Serial.print(" - ");
  Serial.print(Leanbot.pingCm());
  Serial.print(" cm - GR ");
  Serial.print(LbGripper.readL());
  Serial.print(" ");
  Serial.println(LbGripper.readR());
}

void readCommand() {
  static String line = "";
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n') {
      line.trim();
      runCommand(line);
      line = "";
    } else {
      line += c;
    }
  }
}

void runCommand(const String &cmd) {
  if (cmd == "Motion") {
    // forward 10 cm, back 10 cm, turn right 90, turn left 90: ends where it started
    LbMotion.runLRrpm(30, 30);
    LbMotion.waitDistanceMm(100);
    LbMotion.runLRrpm(-30, -30);
    LbMotion.waitDistanceMm(100);
    LbMotion.runLRrpm(30, -30);
    LbMotion.waitRotationDeg(90);
    LbMotion.runLRrpm(-30, 30);
    LbMotion.waitRotationDeg(90);
    LbMotion.stopAndWait();
  } else if (cmd == "Gripper") {
    LbGripper.close();
    LbDelay(1000);
    printStatus();
    LbGripper.open();
    LbDelay(1000);
  } else if (cmd == "RGBLeds") {
    // all seven lights red, green, blue in turn, so a missing one shows in every colour
    const CRGB colours[] = {CRGB::Red, CRGB::Green, CRGB::Blue};
    for (int i = 0; i < 3; i++) {
      LbRGB.fillColor(colours[i]);
      LbRGB.show();
      LbDelay(700);
    }
    LbRGB.clear();
    LbRGB.show();
  } else if (cmd == "Buzzer") {
    const int notes[] = {261, 293, 329, 349, 392, 440, 493, 523};  // đô rê mi fa sol la si đô
    for (int i = 0; i < 8; i++) {
      Leanbot.tone(notes[i], 150);
      LbDelay(200);
    }
  } else {
    return;
  }
  Serial.print("DONE ");
  Serial.println(cmd);
}
