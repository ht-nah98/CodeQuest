#include <Leanbot.h>

// Describe this function...
void chao() {
  LbGripper.open();
  LbRGB.clear();
  LbRGB[ledB] = 0x33ccff;
  LbRGB.show();
}

// Describe this function...
int gapdoi(int x) {
  if ((x > 100)) {
    return 0;
  }

  return x * 2;
}


void setup() {
  Leanbot.begin();
}

void loop() {
}