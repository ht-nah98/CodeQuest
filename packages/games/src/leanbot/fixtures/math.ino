#include <Leanbot.h>

float tocdo;
int diem;

void setup() {
  Leanbot.begin();
}

void loop() {
  LbMission.begin(0);

  { // Tinh toan
    tocdo = pow(PI, 64 % 10);
    tocdo = sin(radians(round(3.14)));
    diem = (max(constrain(50, 1, 100), LbMission.elapsedMillis() / 1000));
    diem = (LbTouch.read(TB2B) == HIGH) ? LbMotion.getDistanceMm() / 10 : LbMotion.getRotationDeg();
    LbMotion.setZeroOrigin();
    LbMotion.runLR(-400, 400);
    LbDelay(300);
    Leanbot.DCMotor.setPower(-80 * 255 / 100);
    Leanbot.DCMotor.setPower(0);
    LbRGB[ledD] = 0xff8000;
    LbRGB[ledE] = CRGB(random8(), random8(), random8());
    LbRGB[ledF] = 0xbf0040;
    Leanbot.tone(2 * 1000, 50);
    LbDelay(50);
    diem = Leanbot.pingMm();
    for (int count = 0; count < diem; count++) {
      LbMission.end();
    }

    int repeat_end = 1 + 2;
    for (int count2 = 0; count2 < repeat_end; count2++) {
    }

    for (int count3 = 0; count3 < 3; count3++) {
    }

  }

  LbMission.end();

  LbMission.beginDigitalTwin(F("ms11.1"));

  // twin
  LbMission.end();
}