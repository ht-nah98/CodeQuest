#include <Leanbot.h>

void setup() {
  Leanbot.begin();
}

void loop() {

  // Bai 1
  LbMission.begin(0);
  LbDelay(2 * 1000);
  if (!(LbIRLine.isBlackDetected() || (2 * (7 - 3) != 8))) {
    Leanbot.tone(440, 250);
    LbDelay(250);
  }
  for (int count = 0; count < 3; count++) {
    LbGripper.moveTo(0);
    LbGripper.moveTo(90);
  }

  LbMission.end();
}