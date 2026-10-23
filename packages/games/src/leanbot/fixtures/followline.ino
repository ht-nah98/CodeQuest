#include <Leanbot.h>

int target;
int line;
// Describe this function...
void followLine() {
  target = LbMotion.getDistanceMm() + 1000;
  while (LbIRLine.isBlackDetected()) {
    for (int count = 0; count < 10; count++) {
      LbIRLine.read();
      line = LbIRLine.value();
      LbIRLine.displayOnRGB(0x00ff00);
      switch (line) {
        case 4:
        case 14:
        case 12:
        case 8:
          LbMotion.runLR(190, 1500);
          break;

        case 2:
        case 7:
        case 3:
        case 1:
          LbMotion.runLR(1500, 190);
          break;

        case 9:
        case 13:
        case 11:
        case 10:
        case 5:
        default:
          LbMotion.runLR(1500, 1500);
       }

      if (LbIRLine.isBlackDetected()) {
        break;
      }
      LbMotion.waitDistanceMm(1);
    }

    if ((LbMotion.getDistanceMm() > target)) {
      if ((LbIRLine.value() == 6)) {
        break;
      }
    }
  }

}


void setup() {
  Leanbot.begin();
  LbIRLine.doManualCalibration(TB1A);
}

void loop() {

  { // Do manual calibration with black/white line
  }

  LbMission.begin(TB1A + TB1B);

  { // Follow line to the end then stops
    followLine();
  }

  LbMission.end();
}