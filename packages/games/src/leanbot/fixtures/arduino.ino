#include <Leanbot.h>

auto tong = 5;
int diem;
float tocdo;
String loi;
bool xong;
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
  Serial.begin(115200);
  Leanbot.begin();
  LbIRLine.setThreshold(300, 310, 320, 330);
  LbIRLine.doManualCalibration(TB1A);
  pinMode(7, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(3, OUTPUT);
  pinMode(2, INPUT);
}

void loop() {
  LbMission.begin(TB1A + TB1B);
  diem = diem + 1;
  tocdo = 1.5;
  loi = "xin chao";
  xong = true;
  auto dem = 3;
  tong = 7;
  diem = tong;
  Serial.println(tocdo);
  Serial.print("diem: ");
  if (Serial.available()) {
    diem = (random(1, Serial.read()));
  }
  digitalWrite(7, HIGH);
  digitalWrite(LED_BUILTIN, LOW);
  analogWrite(5, map(analogRead(A0), 0, 1023, 0, 255));
  tone(3, 440);
  delay(500);
  noTone(3);
  if ((digitalRead(2) == HIGH)) {
    Serial.flush();
  }
  chao();
  diem = gapdoi(21);
  loi = Serial.readStringUntil('\n');
  for (int i = 1; i <= 10; i += 2) {
    continue;
  }

  if ((4 % 2) == 0) {
    while (true) {
      break;
    }

  } else if (!false) {
    LbMotion.stopAndWait();
  } else {
    randomSeed(analogRead(A1));
  }
  LbMission.end();
}