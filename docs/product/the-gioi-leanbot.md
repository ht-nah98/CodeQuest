# Thế giới Leanbot — bản đồ phiêu lưu thứ hai

> **Trạng thái 23/10/2026:** HLV duyệt kế hoạch ("triển khai tiếp"), rồi yêu cầu **bám đúng mẫu
> Pythaverse** (§3). **Đã có:** đủ 93 khối của trình soạn Pythaverse bằng tiếng Việt, code Arduino
> giống hệt của họ, bộ đọc code → khối, và **Màn 0 Xưởng Phiên Dịch** ở `/xuong-phien-dich` (chỉ
> HLV thấy, §5). **Chưa có:** sân mô phỏng, Vùng 1–9, hai bản đồ (ADR-0030). Bốn câu hỏi ở §7 HLV
> chưa trả lời.
> Bảng khối dưới đây bóc từ trình soạn khối thật của Pythaverse bằng
> `node tools/pythaverse-blocks/dump.mjs` → `docs/research/pythaverse-lbeditor-blocks.json`.

## 1. Vì sao có bản đồ này

Lời HLV (23/10/2026), tóm lại:

- Trình soạn của Pythaverse chỉ đi **một chiều**: ghép khối thì ra code, nhưng dán code vào
  thì không ra khối.
- Khối của họ phần lớn là **tiếng Anh**. Bé lớp 4–5 đã có tư duy nhờ CodeQuest nhưng vướng
  chữ tiếng Anh.
- Muốn có **bản đồ thứ hai** bên cạnh bản đồ cũ:
  - **Làng của Măng** = 10 thế giới hiện có (giữ nguyên).
  - **Thế giới Leanbot** = dạy **mọi khối có trong Pythaverse** bằng khối **tiếng Việt**.
- **Màn 0** chuyên chuyển **khối → code** và **code → khối**. Code vẫn là tiếng Anh, đúng
  code Leanbot, để chép sang Leanbot IDE nạp được vào robot thật.

Ba quyết định HLV đã chốt (23/10/2026):

| Câu hỏi | Chốt |
|---|---|
| Đặt bản đồ ở đâu | **Trong CodeQuest**: `/map` có hai bản đồ, dùng chung sao, coin, gợi ý, chấm bài. Khóa Leanbot (Bài 0–4, robot thật) giữ riêng, có nút dẫn qua lại |
| Màn 0 làm tới đâu | **Hai chiều, dạng chuẩn**: khối → code luôn được; code → khối với code đúng dạng mình sinh ra. Dòng lạ thì tô đỏ, không đoán |
| Bước đầu | **Bảng khối + kế hoạch** (tài liệu này), duyệt rồi mới code |

## 2. Trình soạn của Pythaverse có gì (đã bóc)

Trình soạn `ide.pythaverse.space/lbeditor/` (Blockly bản 2020) có **20 nhóm, 93 khối** trong
thanh khối, cộng 105 khối Leanbot (kể cả bản `_vi`) mà thanh khối không hiện.

Bản `?lang=vi` mới dịch **một phần**:

| Đã dịch | Vẫn tiếng Anh |
|---|---|
| Tên nhóm (Logic, Vòng lặp, Toán, Di chuyển, Tay gắp, Đèn Led RGB, Phát nhạc, Cảm biến, Cảm biến vạch) | `if … do`, `repeat while`, `repeat 10 times`, `and`, `not`, `true` |
| "Di chuyển: Chạy với vận tốc…", "Chạy đoạn đường", "Rẽ góc", "Dừng", "Chờ … giây" | `Mission: Begin when TB1A + TB1B combo touched … Mission: End` |
| Đơn vị: giây, độ, vòng/phút | `Gripper: Open/Close/Rotate`, `RGB Leds: Set/Fill/Clear/Display` |
| | `Touch: wait until`, `Ping: Front distance`, `IRLine: Black is detected` |

Cả nhóm Tay gắp, Đèn, Cảm biến, Cảm biến vạch, Logic, Vòng lặp — tức **phần bé cần nhất** —
vẫn tiếng Anh. Đúng như HLV nhận xét.

### Khung code mà trình soạn sinh ra

Mọi chương trình đều có cùng một khung. Code → khối chỉ cần đọc phần trong `loop()`:

```cpp
#include <Leanbot.h>

void setup() {
  Leanbot.begin();
}

void loop() {
  LbMission.begin(TB1A + TB1B);   // khối "Mission: Begin when TB1A + TB1B combo touched"
  LbMotion.runLRrpm(30, 30);
  LbMotion.waitDistanceMm(20 * 10);
  LbMotion.stopAndWait();
  LbMission.end();                // khối "Mission: End"
}
```

## 3. Bảng khối: đủ 93 khối của Pythaverse, chữ tiếng Việt

**HLV (23/10/2026, sau khi xem bản đầu):** *"lbeditor lại có nhiều khối block hơn. Bạn phải bám
theo những thứ mẫu của họ."* Bản đầu tự chọn khoảng 45 khối và tự đặt khối mới, nên bị **làm lại**
như sau:

- **Đủ mọi khối** trong thanh khối của `ide.pythaverse.space/lbeditor`, **cùng cây nhóm, cùng thứ
  tự**: Logic, Vòng lặp, Toán, Biến (5 nhóm con), Hàm, Arduino (Vào/Ra, Serial), Leanbot (Di
  chuyển, Tay gắp, Đèn Led RGB, Phát nhạc, Cảm biến, Cảm biến vạch).
- **Cùng tên khối, cùng ô cắm, cùng ô chọn, cùng giá trị ban đầu, cùng màu.** Nhờ vậy chương trình
  lưu từ Pythaverse (XML) mở được ở đây, và ngược lại.
- **Chỉ khác chữ trên khối:** tiếng Việt. Chỗ nào bản `?lang=vi` của Pythaverse đã dịch (Di
  chuyển, Chờ, Nhiệm vụ: Bắt đầu ngay lập tức…) thì giữ đúng chữ đó. Khối Pythaverse lấy nguyên
  của Blockly (`nếu`, `lặp`, so sánh, hàm…) dùng chữ tiếng Việt của Blockly, chỉnh cho khớp Làng
  Măng (`nếu … thì`, `lặp N lần`, `lặp khi`, `không phải`).
- **Code ra giống hệt từng ký tự** code trình soạn Pythaverse in ra (trừ 3 dòng "Generated … at
  <giờ>" ở đầu). Kiểm bằng máy cho cả 93 khối và 5 chương trình dài (`leanbot.test.ts`).
- Ô màu là **bảng màu** như Pythaverse (plugin `@blockly/field-colour`); mắt dò vạch chọn ⬜/⬛
  bằng bảng 2 màu như của họ.
- Ba khối "hình" (`*` của Tay gắp, Đèn, Cảm biến vạch) dùng **ảnh chụp robot của mình**, không chép
  ảnh của Pythaverse.

Khác biệt duy nhất trong code: khối ghi chú mặc định là `// Mô tả` thay vì `// Comment`.

Bảng dưới sinh tự động từ code (chữ khối như bé thấy, code là code Pythaverse in ra với giá trị
ban đầu). `?` là chỗ cắm khối khác.

#### Logic (Logic)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 1 | `controls_if` | nếu ? thì ? | `if (false) {` |
| 2 | `logic_compare` | ? = ? | `(0 == 0)` |
| 3 | `logic_operation` | ? và ? | `false && false` |
| 4 | `logic_negate` | không phải ? | `!false` |
| 5 | `logic_boolean` | đúng | `true` |
| 6 | `logic_null` | trống không | `null` |
| 7 | `logic_ternary` | kiểm tra ? nếu đúng ? nếu sai ? | `false ? null : null` |
| 8 | `controls_switch` | xét hộp i nếu bằng ? thì ? | `switch (i) {` |

#### Vòng lặp (Loops)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 9 | `controls_repeat_ext` | lặp 10 lần làm ? | `for (int count = 0; count < 10; count++) {` |
| 10 | `controls_repeat` | lặp 10 lần làm ? | `for (int count = 0; count < 10; count++) {` |
| 11 | `controls_whileUntil` | lặp khi ? làm ? | `while (false) {` |
| 12 | `controls_for` | đếm theo j từ 1 đến 10 mỗi lần thêm 1 làm ? | `for (int j = 1; j <= 10; j++) {` |
| 13 | `controls_forEach` | với mỗi thành phần k trong danh sách ? làm ? | `var k_list = [];` |
| 14 | `controls_flow_statements` | thoát | `break;` |

#### Toán (Math)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 15 | `math_number` | 123 | `123` |
| 16 | `math_constant` | π | `PI` |
| 17 | `math_arithmetic` | 1 + 2 | `1 + 2` |
| 18 | `math_modulo` | số dư của 64 ÷ 10 | `64 % 10` |
| 19 | `math_number_property` | 0 là số chẵn | `(0 % 2) == 0` |
| 20 | `math_round` | làm tròn 3.14 | `round(3.14)` |
| 21 | `math_single` | trị tuyệt đối 9 | `abs(9)` |
| 22 | `math_multiple2` | số lớn hơn trong 2 3 | `max(2, 3)` |
| 23 | `math_trig` | cos 45 độ | `cos(radians(45))` |
| 24 | `math_constrain` | giới hạn 50 không dưới 1 không hơn 100 | `constrain(50, 1, 100)` |
| 25 | `math_map` | đổi thang đo: 712 , biết rằng 0 đổi thành 0 1023 đổi thành 100 | `map(712, 0, 1023, 0, 100)` |
| 26 | `math_random_int` | Một số nguyên bất kỳ từ 0 đến 100 | `random(0, 100)` |
| 27 | `math_random_seed` | khởi động số ngẫu nhiên bằng (đọc chân analog A0) | `randomSeed(analogRead(A0));` |

#### Arduino › Vào/Ra (Arduino › In/Out)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 28 | `board_base_inout_buildin_led` | bật đèn trên mạch ở mức HIGH | `digitalWrite(LED_BUILTIN, HIGH);` |
| 29 | `board_base_inout_digital_write` | đặt chân số 0 ở mức HIGH | `digitalWrite(0, HIGH);` |
| 30 | `board_base_inout_digital_read` | mức của chân số 0 | `digitalRead(0)` |
| 31 | `board_base_inout_highlow` | HIGH | `HIGH` |
| 32 | `board_base_inout_analog_write` | ghi ra chân analog 3 giá trị 0 | `analogWrite(3, 0);` |
| 33 | `board_base_inout_analog_read` | đọc chân analog A0 | `analogRead(A0)` |
| 34 | `board_base_delay` | chờ (mili giây) 1234 | `delay(1234);` |
| 35 | `board_base_angle` | góc: 90 | `90` |
| 36 | `board_base_map` | đổi giá trị 250 từ khoảng 0 - 1023 sang khoảng 0 - 255 | `map(250, 0, 1023, 0, 255)` |
| 37 | `board_base_inout_tone` | phát tiếng ở chân 0 tần số (Hz) 440 | `tone(0, 440);` |
| 38 | `board_base_inout_notone` | tắt tiếng ở chân 0 | `noTone(0);` |

#### Arduino › Serial (Arduino › Serial)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 39 | `text` | “ some text ” | `"some text"` |
| 40 | `board_serial_init` | Serial: mở với tốc độ 115200 baud | `` |
| 41 | `board_serial_print` | Serial: in rồi xuống dòng “ Hello World! ” | `Serial.println("Hello World!");` |
| 42 | `board_serial_available` | Serial: có dữ liệu gửi tới? | `Serial.available()` |
| 43 | `board_serial_read` | Serial: đọc | `Serial.read()` |
| 44 | `board_serial_readStringUntil` | Serial: đọc tới khi gặp “ \n ” | `Serial.readStringUntil('\n')` |
| 45 | `board_serial_flush` | Serial: chờ gửi xong | `Serial.flush();` |

#### Leanbot (Leanbot)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 46 | `Leanbot.commentLine` | 💬 Mô tả | `// Comment` |
| 47 | `Leanbot.section` | 💬 Mô tả ? | `{ // Comment` |
| 48 | `Leanbot.delay` | Chờ 1.25 giây | `LbDelay(1.25 * 1000);` |
| 49 | `LbMission.elapsedMillis` | Nhiệm vụ: thời gian đã chạy, tính bằng giây | `LbMission.elapsedMillis() / 1000` |
| 50 | `LbMission.beginByTeacher_end` | Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B ? Nhiệm vụ: Kết thúc | `LbMission.begin(TB1A + TB1B);` |
| 51 | `LbMission.beginImmediately_end` | Nhiệm vụ: Bắt đầu ngay lập tức ? Nhiệm vụ: Kết thúc | `LbMission.begin(0);` |
| 52 | `LbMission.missionSelect` | “ msNumberGrid ” | `"msNumberGrid"` |
| 53 | `LbMission.beginBySelect_end` | Nhiệm vụ: Bắt đầu trên Bản Sao Số “ mission name ” ? Nhiệm vụ: Kết thúc | `LbMission.beginDigitalTwin(F("mission name"));` |
| 54 | `LbMission.end` | Nhiệm vụ: Kết thúc | `LbMission.end();` |
| 55 | `Leanbot.whenStarted` | Leanbot bắt đầu hoạt động | `` |
| 56 | `Leanbot.DCMotor.setPower` | Động cơ DC: quay tới với mức 100 % | `Leanbot.DCMotor.setPower(100 * 255 / 100);` |

#### Leanbot › Di chuyển (Leanbot › Motion)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 57 | `LbMotion.run` | Di chuyển: Chạy với vận tốc Trái 30 Phải 30 vòng/phút | `LbMotion.runLRrpm(30, 30);` |
| 58 | `LbMotion.waitDistanceMm` | Di chuyển: Chạy đoạn đường 4.2 cm | `LbMotion.waitDistanceMm(4.2 * 10);` |
| 59 | `LbMotion.waitRotationDeg` | Di chuyển: Rẽ góc 90 độ | `LbMotion.waitRotationDeg(90);` |
| 60 | `LbMotion.wait` | Di chuyển: Tiếp tục chạy trong 1.25 giây | `LbDelay(1.25 * 1000);` |
| 61 | `LbMotion.stop` | Di chuyển: Dừng | `LbMotion.stopAndWait();` |
| 62 | `LbMotion.approxDistance` | Di chuyển: quãng đường đã đi, tính bằng mm | `LbMotion.getDistanceMm()` |
| 63 | `LbMotion.approxHeading` | Di chuyển: góc đã rẽ, tính bằng độ | `LbMotion.getRotationDeg()` |
| 64 | `LbMotion.setZeroOrigin` | Di chuyển: Đặt quãng đường và góc về 0 | `LbMotion.setZeroOrigin();` |

#### Leanbot › Tay gắp (Leanbot › Gripper)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 65 | `LbGripper.open` | Tay gắp: Mở | `LbGripper.open();` |
| 66 | `LbGripper.close` | Tay gắp: Khép | `LbGripper.close();` |
| 67 | `LbGripper.moveTo` | Tay gắp: Xoay tới 45 độ | `LbGripper.moveTo(45);` |
| 68 | `LbGripper.moveToLR` | Tay gắp: Xoay tay Trái tới 30 và tay Phải tới 60 độ trong 1000 mili giây | `LbGripper.moveToLR(30, 60, 1000);` |
| 69 | `LbGripper.help` | * | `` |

#### Leanbot › Đèn Led RGB (Leanbot › RGB Leds)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 70 | `LbRGB.help` | * | `` |
| 71 | `LbRGB.clear_show` | Đèn: Xóa hết màu ? Đèn: Bật lên | `LbRGB.clear();` |
| 72 | `LbRGB.setColor` | Đèn: Tô đèn ledO màu Màu sắc: #00ffff | `LbRGB[ledO] = 0x00ffff;` |
| 73 | `LbRGB.setColorText` | Đèn: Tô đèn ledO màu Yellow ? | `LbRGB[ledO] = CRGB::Yellow;` |
| 74 | `LbRGB.fillColor` | Đèn: Tô (các đèn: O true A true B true C true D true E true F true) màu Màu sắc: #ffff00 | `LbRGB.fillColor(0xffff00, BITMAP(ledO, ledA, ledB, ledC, ledD, ledE, ledF));` |
| 75 | `LbRGB.colour_picker` | Màu sắc: #ff0000 | `0xff0000` |
| 76 | `LbRGB.colour_random` | Màu sắc: ngẫu nhiên | `CRGB(random8(), random8(), random8())` |
| 77 | `LbRGB.colour_rgb` | Màu sắc: Đỏ 255 Xanh lá 0 Xanh dương 0 | `0xff0000` |
| 78 | `LbRGB.colour_blend` | Màu sắc: Pha #00ff00 với #0000ff tỉ lệ 0.5 | `0x008080` |
| 79 | `LbRGB.clear` | Đèn: Xóa hết màu | `LbRGB.clear();` |
| 80 | `LbRGB.show` | Đèn: Bật lên | `LbRGB.show();` |

#### Leanbot › Phát nhạc (Leanbot › Sound)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 81 | `Leanbot.toneDuration` | Âm thanh: Kêu 1500 Hz trong 100 mili giây | `Leanbot.tone(1500, 100);` |

#### Leanbot › Cảm biến (Leanbot › Sensors)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 82 | `LbTouch.waitUntil` | Chạm: chờ tới khi chạm TB1A | `while (LbTouch.read(TB1A) == LOW);` |
| 83 | `LbTouch.read` | Chạm: TB1A đang được chạm? | `(LbTouch.read(TB1A) == HIGH)` |
| 84 | `Leanbot.ping` | Siêu âm: khoảng cách phía trước, tính bằng cm | `Leanbot.pingCm()` |
| 85 | `Leanbot.objectInFront` | Siêu âm: có vật phía trước trong vòng 25 cm ? | `Leanbot.pingCm() <= 25` |

#### Leanbot › Cảm biến vạch (Leanbot › IRLine)

| # | Pythaverse | Khối tiếng Việt | Code |
|---|---|---|---|
| 86 | `LbIRLine.doManualCalibration` | Dò vạch: tự hiệu chỉnh, bấm bằng vùng chạm TB1A | `` |
| 87 | `LbIRLine.setThreshold` | Dò vạch: đặt ngưỡng 2L 300 0L 300 1R 300 3R 300 | `` |
| 88 | `LbIRLine.read` | Dò vạch: Đọc 4 mắt | `LbIRLine.read();` |
| 89 | `LbIRLine.displayOnRGB` | Dò vạch: Hiện lên đèn với Màu sắc: #00ff00 | `LbIRLine.displayOnRGB(0x00ff00);` |
| 90 | `LbIRLine.isBlackDetected` | Dò vạch: Thấy vạch đen? | `LbIRLine.isBlackDetected()` |
| 91 | `LbIRLine.value` | Dò vạch: 4 mắt đang thấy (2L, 0L, 1R, 3R) | `LbIRLine.value()` |
| 92 | `LbIRLine.state` | Dò vạch: #ffffff #ffffff #ffffff #ffffff | `0` |
| 93 | `LbIRLine.help` | * | `` |

### Những chỗ của Pythaverse giữ nguyên dù lạ

Vì phải giống hệt, các chỗ sau **giữ như Pythaverse** (đã kiểm trên trình soạn của họ):

- Ô chọn "Chạy / Rẽ" của khối Di chuyển và "chạy / rẽ" của "Tiếp tục" **không đổi code**.
- "với mỗi thành phần … trong danh sách" in ra JavaScript (`var k_list = [];`), không biên dịch
  được. "đếm theo" với cận không phải số cũng vậy.
- In chữ có dấu `"` thì code hỏng (`Serial.print("a"b")`): Pythaverse không thoát dấu này.
- Khối "các đèn" bỏ hết dấu tích thì in `BITMA)`.

Bài học nên tránh các chỗ này, không sửa chúng.

## 4. Bản đồ: Màn 0 + 8 vùng

Mỗi vùng là một "thế giới" theo mô hình hiện có (màn, sao, boss), chỉ khác là thuộc bản đồ
Leanbot. Số màn là ước lượng, chốt khi viết `curriculum` của từng vùng.

| # | Vùng (tên tạm) | Dạy khối gì | Ý chính bé phải hiểu | Màn |
|---|---|---|---|---|
| 0 | 🔤 **Xưởng Phiên Dịch** | Mọi khối ✅ | Khối Việt và code Anh là **một**. Ghép khối → xem code; đọc code → đoán khối; dán code → ra khối | 4–5 |
| 1 | 🚩 **Bãi Xuất Phát** | Bắt đầu khi chạm, Bắt đầu ngay, Kết thúc, Chờ, Ghi chú | Robot chỉ chạy sau khi chạm `TB1A + TB1B`; nhiệm vụ có đầu có cuối | 5 |
| 2 | 🛞 **Đường Thẳng** | Di chuyển: Chạy với vận tốc, Chạy đoạn đường, Tiếp tục chạy trong, Dừng | Bật bánh rồi **chờ** quãng đường; đi theo cm, không theo ô | 6 |
| 3 | ↪️ **Ngã Xoay** | Chạy với vận tốc (hai bánh ngược nhau), Rẽ góc, lặp | Rẽ = hai bánh ngược chiều; hình vuông = lặp 4 lần (đi + xoay 90°) | 6 |
| 4 | ✊ **Bến Tay Gắp** | Tay gắp: Mở, Khép, Xoay tới, Xoay tay Trái/Phải | Gắp đồ, chở đi, thả đúng chỗ | 5 |
| 5 | 💡 **Hội Đèn Lồng** | Đèn: Tô đèn, Tô các đèn, Xóa hết màu, Bật lên; Màu sắc; Âm thanh: Kêu | Tô màu chưa sáng, phải "bật đèn lên"; còi có Hz và thời gian | 5 |
| 6 | 🦇 **Hang Dơi** (mắt siêu âm) | Siêu âm: khoảng cách, có vật trong vòng?; nếu, lặp khi / đến khi | Robot "nhìn" bằng tiếng vang; dừng trước tường; bám tay | 6 |
| 7 | ✋ **Cổng Cảm Ứng** | Chạm: chờ tới khi chạm, đang được chạm?; nếu … thì … nếu không | Chọn việc bằng vùng chạm (chạm trước làm A, chạm sau làm B) | 4 |
| 8 | 〰️ **Đường Vạch Đen** | Dò vạch: Đọc 4 mắt, Thấy vạch đen?, 4 mắt đang thấy = ⬜⬛⬛⬜, Hiện lên đèn | Bám vạch: lệch trái thì xoay phải, lệch phải thì xoay trái | 6 |
| 9 | 🏙️ **Sa Bàn AIROC** (boss) | Tất cả | Một bài thi gần giống sa bàn thật | 3 |

Các nhóm Biến, Hàm, Arduino (Vào/Ra, Serial) có đủ trong xưởng; vùng nào dạy chúng thì chốt khi
viết `curriculum` (xem câu hỏi §7.3).

Khoảng **50 màn**. Mỗi vùng có nút dẫn sang bài tương ứng của khóa Leanbot để thử trên robot
thật (Vùng 2–3 ↔ Bài 1, Vùng 4 ↔ Bài 2, Vùng 6 ↔ Bài 3–4…).

### Màn 0 — Xưởng Phiên Dịch

Không phải màn chơi có sao, mà là **xưởng mở**, có 4 thử thách nhỏ dẫn dắt:

1. **Ghép rồi xem**: ghép 3 khối Việt, cột bên phải hiện code tiếng Anh. Bấm vào một dòng code
   thì khối tương ứng sáng lên (và ngược lại).
2. **Đọc code, đoán khối**: cho code 4 dòng, bé chọn đúng các khối Việt.
3. **Dán code vào**: dán code chép từ Leanbot IDE, xưởng dựng lại khối. Dòng không đọc được
   thì tô đỏ: *"Măng chưa đọc được dòng này."*
4. **Mang ra robot**: nút **Chép code** + link Leanbot IDE (như Bài 0 màn 14–19).

Sau Màn 0, xưởng luôn mở ở mọi màn (nút "Xem code").

## 5. Phần kỹ thuật (tóm tắt, chi tiết ở ADR khi làm)

- **Kiểu game mới `leanbot`** trong `packages/games/`: sân mô phỏng **liên tục** (mm, độ),
  không theo ô. Có hai bánh, tay gắp, 7 đèn, còi, 4 vùng chạm, mắt siêu âm, 4 mắt dò vạch.
  Tất định (§3 quy tắc 2): chạy theo bước thời gian cố định, không dùng đồng hồ thật.
- **Hai bộ sinh code từ cùng một khối**: một bộ chạy trong sân mô phỏng; một bộ sinh **code
  Arduino giống hệt** code của trình soạn Pythaverse (so khớp từng khối với
  `docs/research/pythaverse-lbeditor-blocks.json` bằng unit test).
- **Code → khối**: bộ đọc nhỏ chỉ hiểu dạng chuẩn (code mà các khối in ra). Không dùng thư viện
  C++ nào. Dòng ngoài dạng chuẩn thì báo đỏ, không đoán. Có unit test **khối → code → khối** ra
  đúng như cũ.
- **Biên dịch thật** (§9.12): một script gửi code lời giải của mọi màn tới
  `cs.leanbot.space/v3/compile`. Chạy tay trước khi gộp (cần mạng nên không chạy trong CI).
- **Không đặt lên bản đồ `/map`** (bỏ ý `World.map` ban đầu): HLV chọn trang riêng
  `/the-gioi-leanbot` cho bài giảng (ADR-0030, `the-gioi-leanbot-bai-giang.md`).
- **Ẩn khi chưa xong** (§9.10): bản đồ Leanbot chưa có vùng nào đủ boss thì không hiện với bé.

### Đã làm (23/10/2026)

| Phần | Ở đâu | Kiểm bằng |
|---|---|---|
| 93 khối Pythaverse bằng tiếng Việt | `packages/games/src/leanbot/blocks.ts`, `toolbox.ts`, `flyouts.ts` (Biến) | thanh khối đủ 93 khối, đúng cây nhóm (`workshopToolbox.test.ts`) |
| Khối → code Arduino | `leanbot/arduino.ts` (`toArduino`) | `leanbot.test.ts`: **từng khối** của thanh khối so với code trình soạn Pythaverse in ra; **5 chương trình** lưu từ Pythaverse (XML) ra đúng từng ký tự (`leanbot/fixtures/`) |
| Code → khối | `leanbot/parse.ts` (`parseArduino`) | mỗi lý do báo đỏ một test; mọi khối và 5 chương trình: khối → code → khối → code ra y như cũ |
| Biên dịch thật | `npm run leanbot:compile` (cần mạng) | mọi khối lệnh của thanh khối + 5 chương trình mẫu: biên dịch được trên `cs.leanbot.space` |
| Màn 0 | `/xuong-phien-dich` (`apps/web/src/screens/workshop/`) | e2e `coach-profile.spec.ts`; bé vào bằng địa chỉ thì bị đưa về `/hub` (`leanbot.spec.ts`) |

Màn 0 hiện là **xưởng mở**: ghép khối thì code hiện bên phải; bấm một dòng code thì khối của nó
sáng lên và ngược lại; "Dán code vào" → "Dựng khối" dựng lại khối, dòng chưa đọc được tô đỏ kèm
lý do; "Chép code" + link Leanbot IDE. **Chưa có** 4 thử thách dẫn dắt (cần mô hình màn chơi của
bản đồ Leanbot, tức ADR-0030).

Code sinh ra **bỏ 3 dòng đầu** `// Generated … at <giờ>` của Pythaverse: có giờ thì mỗi lần ra
code một khác. Bộ đọc bỏ qua ghi chú ngoài `loop()`, nên dán code có 3 dòng đó vẫn được.

Hai khối cùng in một code thì code → khối chọn khối đứng trước trong thanh khối: `LbDelay` ra
"Chờ" (không ra "Di chuyển: Tiếp tục…"), `for (int count…)` ra "lặp … lần" có ô cắm, `LbRGB.clear();
… LbRGB.show();` ra hai khối rời, màu số `0x…` ra "Màu sắc" bảng màu.

## 6. Thứ tự làm đề xuất

1. HLV duyệt tài liệu này (tên khối, vùng, số màn).
2. **Thử trên robot thật** những chỗ còn nghi: chiều quay khi bánh âm, khối mắt dò vạch
   `⬜⬛⬛⬜`, "chờ tới khi chạm". Mỗi chỗ biên dịch + nạp một chương trình nhỏ.
3. ADR-0030 (hai bản đồ, kiểu game `leanbot`) → HLV duyệt.
4. Khối Việt + bộ sinh code Arduino + unit test so khớp Pythaverse. ✅ (23/10, làm lại theo mẫu
   Pythaverse cùng ngày)
5. **Màn 0** (xưởng chuyển đổi hai chiều) — ✅ bản xưởng mở (23/10); còn 4 thử thách dẫn dắt.
6. Sân mô phỏng, rồi Vùng 1 → 9, mỗi vùng HLV chơi thử trước khi gộp.

## 7. Câu hỏi còn mở cho HLV

1. Chữ trên khối ở §3: có chữ nào bé lớp 4 chưa hiểu không (vd "vòng/phút", "Hz", "ngưỡng",
   "baud")?
2. Giữ **tên vùng chạm** `TB1A`… như trên robot (bé đã quen ở Bài 0) hay gọi "chạm trước
   trái"…? Đề xuất: giữ `TB1A` vì in trên robot, thêm hình nhỏ chỉ chỗ.
3. Các nhóm Biến, Hàm, Arduino (Vào/Ra, Serial) đã có trong xưởng: dạy ở vùng nào, hay chỉ để
   bé tra?
4. Thứ tự vùng có hợp với lịch 17 buổi của khóa Leanbot không?
