#include <Leanbot.h>

void setup() {
  Leanbot.begin();
}

void loop() {
  LbMission.begin(TB1A + TB1B);

  // Di thang
  LbMotion.runLRrpm(30, -30);
  LbMotion.waitDistanceMm(20 * 10);
  LbMotion.waitDistanceMm(55);
  LbMotion.waitRotationDeg(90);
  for (int count2 = 0; count2 < 4; count2++) {
    for (int count = 0; count < 2; count++) {
      LbMotion.stopAndWait();
    }

    LbDelay(500);
  }

  if (Leanbot.pingCm() <= 25) {
    LbGripper.close();
  } else {
    LbRGB[ledA] = CRGB::Red;
    LbRGB.show();
  }
  if ((LbTouch.read(TB1B) == HIGH)) {
    LbGripper.open();
  }
  while (!((LbTouch.read(TB2A) == HIGH) && !LbIRLine.isBlackDetected())) {
    LbIRLine.read();
    Leanbot.tone(1500, 100);
    LbDelay(100);
  }

  while (!(LbIRLine.isBlackDetected())) {
    LbIRLine.read();
  }

  while ((LbIRLine.value() == 6)) {
    LbRGB.fillColor(0xff00ff, BITMAP(ledO, ledA, ledF));
    LbIRLine.displayOnRGB(0x00ff00);
    while (LbTouch.read(TB1B) == LOW);
    LbGripper.moveToLR(30, 60, 1000);
    LbGripper.moveTo(45);
    LbRGB[ledC] = CRGB::Blue;
    LbRGB.clear();
  }

  while ((Leanbot.pingCm() < 10 + 5) || (Leanbot.pingCm() >= 100)) {
    LbDelay(1.25 * 1000);
  }

  while (true) {
    LbGripper.open();
    LbRGB.clear();
    LbRGB[ledO] = CRGB::Green;
    LbRGB.show();
    while (!false) {
      LbMotion.runLRrpm(-30, 30);
    }

  }

  LbMission.end();
}