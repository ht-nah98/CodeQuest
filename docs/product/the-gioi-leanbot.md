# Thế giới Leanbot — bản đồ phiêu lưu thứ hai (bản nháp chờ HLV duyệt)

> **Trạng thái 23/10/2026:** HLV duyệt kế hoạch ("triển khai tiếp"). **Đã có:** bộ khối Việt,
> bộ sinh code Arduino khớp Pythaverse, bộ đọc code → khối, và **Màn 0 Xưởng Phiên Dịch** ở
> `/xuong-phien-dich` (chỉ HLV thấy, §5). **Chưa có:** sân mô phỏng, Vùng 1–9, hai bản đồ (ADR-0030).
> Bốn câu hỏi ở §7 HLV chưa trả lời; đang làm theo đề xuất của từng câu.
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

## 3. Bảng khối: Pythaverse → khối tiếng Việt của mình → code

Cột **"Khối Việt (đề xuất)"** là chữ hiện trên khối của mình. HLV sửa thẳng vào bảng.
`[ ]` là ô số, `▾` là ô chọn, `◇` là ô điều kiện, `⟨ ⟩` là ô cắm giá trị.
Cột **Dạy** cho biết khối có lên bản đồ không: ✅ dạy, ➖ để sau, ✘ không dạy (lý do ở cuối bảng).

### 3.1. Nhiệm vụ và thời gian

| Pythaverse (en) | Khối Việt (đề xuất) | Code sinh ra | Dạy |
|---|---|---|---|
| Mission: Begin when TB1A + TB1B combo touched … Mission: End | 🚩 **Bắt đầu khi chạm** `TB1A + TB1B ▾` … **Kết thúc nhiệm vụ** | `LbMission.begin(TB1A + TB1B);` … `LbMission.end();` | ✅ |
| Mission: Begin immediately … Mission: End | 🚩 **Bắt đầu ngay** … **Kết thúc nhiệm vụ** | `LbMission.begin(0);` … `LbMission.end();` | ✅ |
| Wait for 1.25 seconds | **Chờ** `[1.25]` `giây ▾` | `LbDelay(1.25 * 1000);` | ✅ |
| Mission: elapsed Time in seconds | ⟨**thời gian nhiệm vụ** (giây)⟩ | `LbMission.elapsedMillis() / 1000` | ➖ |
| Comment | 💬 **Ghi chú** `[…]` | `// …` | ✅ |
| Mission: Begin Digital Twin … | — | `LbMission.beginDigitalTwin(F("…"))` | ✘ |
| DC Motor: Run forward at power level 100 % | — | `Leanbot.DCMotor.setPower(…)` | ✘ |

### 3.2. Di chuyển

| Pythaverse (en) | Khối Việt (đề xuất) | Code sinh ra | Dạy |
|---|---|---|---|
| Motion: Run with velocity Left 30 Right 30 rpm | **Quay bánh: trái** `[30]` **phải** `[30]` vòng/phút | `LbMotion.runLRrpm(30, 30);` | ✅ |
| Motion: Keep running for 4.2 cm | **Đi tiếp** `[4.2]` `cm ▾` | `LbMotion.waitDistanceMm(4.2 * 10);` | ✅ |
| Motion: Keep turning for 90 degrees | **Xoay tiếp** `[90]` độ | `LbMotion.waitRotationDeg(90);` | ✅ |
| Motion: Keep running for 1.25 seconds | = khối **Chờ** (cùng một dòng code) | `LbDelay(1.25 * 1000);` | ✅ |
| Motion: Stop | **Dừng lại** | `LbMotion.stopAndWait();` | ✅ |
| Motion: Reset Distance and Heading | **Đặt lại quãng đường và góc về 0** | `LbMotion.setZeroOrigin();` | ➖ |
| Motion: approx. Distance in mm | ⟨**quãng đường đã đi** (mm)⟩ | `LbMotion.getDistanceMm()` | ➖ |
| Motion: approx. Heading in degrees | ⟨**góc đã xoay** (độ)⟩ | `LbMotion.getRotationDeg()` | ➖ |

Hai điều phải dạy kỹ, vì khác với Măng ở Làng (Măng đi theo ô):

- Leanbot đi theo **cách hai bước**: "quay bánh" chỉ **bật** động cơ, robot chưa dừng;
  khối "đi tiếp 20 cm" mới **chờ** tới khi đủ 20 cm. Thiếu khối thứ hai thì robot chạy mãi.
- **Rẽ = hai bánh quay ngược nhau**: trái `-30`, phải `30` là xoay sang trái. Ô chọn "Run /
  Turn" của Pythaverse **không đổi code** (đã thử: "Turn" với trái 30, phải 30 vẫn ra
  `runLRrpm(30, 30)`), nên mình bỏ ô chọn đó, để dấu `-` nói lên tất cả. **Cần thử trên robot
  thật** chiều quay của dấu `-` trước khi viết màn.

### 3.3. Tay gắp

| Pythaverse (en) | Khối Việt (đề xuất) | Code sinh ra | Dạy |
|---|---|---|---|
| Gripper: Open | ✋ **Mở tay gắp** | `LbGripper.open();` | ✅ |
| Gripper: Close | ✊ **Khép tay gắp** | `LbGripper.close();` | ✅ |
| Gripper: Rotate to 45 degrees | **Xoay tay gắp tới** `[45]` độ | `LbGripper.moveTo(45);` | ✅ |
| Gripper: Rotate Left to 30 and Right to 60 degrees in 1000 milliseconds | **Xoay tay trái tới** `[30]` **tay phải tới** `[60]` độ **trong** `[1000]` mili giây | `LbGripper.moveToLR(30, 60, 1000);` | ✅ |

### 3.4. Đèn và còi

| Pythaverse (en) | Khối Việt (đề xuất) | Code sinh ra | Dạy |
|---|---|---|---|
| RGB Leds: Set ledO to Color | **Tô đèn** `O ▾` **màu** ⟨🎨⟩ | `LbRGB[ledO] = 0x00ffff;` | ✅ |
| RGB Leds: Set ledO to Yellow | **Tô đèn** `O ▾` **màu** `vàng ▾` | `LbRGB[ledO] = CRGB::Yellow;` | ✅ |
| RGB Leds: Fill (Shape …) with Color | **Tô các đèn** `☑O ☑A … ☑F` **màu** ⟨🎨⟩ | `LbRGB.fillColor(0xffff00, BITMAP(ledO, …));` | ✅ |
| RGB Leds: Clear | **Xóa hết màu** | `LbRGB.clear();` | ✅ |
| RGB Leds: Display | 💡 **Bật đèn lên** | `LbRGB.show();` | ✅ |
| RGB Leds: Clear … Display | = **Xóa hết màu** … **Bật đèn lên** (hai khối rời: cùng code, nên code → khối không phân biệt được) | `LbRGB.clear();` … `LbRGB.show();` | ✅ |
| Color: #fff | ⟨🎨 **màu** ■⟩ | `0xff0000` | ✅ |
| Color: Random | ⟨**màu ngẫu nhiên**⟩ | `CRGB(random8(), random8(), random8())` | ➖ |
| Color: R 255 G 0 B 0 | ⟨**màu: đỏ** `[255]` **xanh lá** `[0]` **xanh dương** `[0]`⟩ | `0xff0000` | ➖ |
| Color: Blend … with ratio 0.5 | ⟨**pha màu** ■ **với** ■ **tỉ lệ** `[0.5]`⟩ | `0x008080` | ➖ |
| Sound: Play 1500 Hz tone for 100 milliseconds | 🔔 **Kêu** `[1500]` Hz **trong** `[100]` mili giây | `Leanbot.tone(1500, 100);` `LbDelay(100);` | ✅ |

Ô màu (⟨🎨⟩) là **ô chọn 9 màu có tên** (đỏ, cam, vàng, xanh lá, xanh ngọc, xanh dương, tím,
hồng, trắng), không phải bảng pha màu: Blockly bản mới bỏ ô chọn màu khỏi lõi, và tên màu dễ đọc
hơn. "Tô đèn" in `CRGB::Red`; "tô các đèn" và "hiện mắt dò vạch" in số `0xff0000` như Pythaverse.

Chỗ dễ sai cần một màn riêng: "tô đèn" chỉ **ghi màu vào bộ nhớ**, phải có "bật đèn lên" thì
đèn mới sáng. Sân mô phỏng sẽ cho thấy đèn chưa đổi cho tới khi gặp "bật đèn lên".

### 3.5. Vùng chạm, mắt siêu âm

| Pythaverse (en) | Khối Việt (đề xuất) | Code sinh ra | Dạy |
|---|---|---|---|
| Touch: wait until TB1A touched | ✋ **Chờ tới khi chạm** `TB1A ▾` | `while (LbTouch.read(TB1A) == LOW);` | ✅ |
| Touch: TB1A is touched ? | ◇ `TB1A ▾` **đang được chạm?** | `(LbTouch.read(TB1A) == HIGH)` | ✅ |
| Ping: Front distance in cm | ⟨**khoảng cách phía trước** (cm)⟩ | `Leanbot.pingCm()` | ✅ |
| Ping: Object in front is within 25 cm distance ? | ◇ **có vật trong vòng** `[25]` cm? | `Leanbot.pingCm() <= 25` | ✅ |

### 3.6. Mắt dò vạch

| Pythaverse (en) | Khối Việt (đề xuất) | Code sinh ra | Dạy |
|---|---|---|---|
| IRLine: Read sensors | 👀 **Mắt dò vạch: nhìn xuống** | `LbIRLine.read();` | ✅ |
| IRLine: Black is detected ? | ◇ **thấy vạch đen?** | `LbIRLine.isBlackDetected()` | ✅ |
| IRLine: #fff #fff #fff #fff (cắm vào `=` với Sensor values) | ◇ **4 mắt dò vạch thấy** `⬜⬛⬛⬜` **?** | `(LbIRLine.value() == 6)` | ✅ |
| IRLine: Sensor values (2L, 0L, 1R, 3R) | ⟨**4 mắt dò vạch**⟩ | `LbIRLine.value()` | ✅ |
| IRLine: Display on RGB with Color | **Hiện 4 mắt dò vạch lên đèn, màu** ⟨🎨⟩ | `LbIRLine.displayOnRGB(0x00ff00);` | ✅ |
| IRLine: Do manual calibration with TB1A button | **Dạy mắt dò vạch** (chạm `TB1A ▾`) | *(sinh ở `setup()`)* | ➖ |
| IRLine: Set threshold 2L 0L 1R 3R | **Đặt ngưỡng 4 mắt** `[300]` `[300]` `[300]` `[300]` | *(sinh ở `setup()`)* | ➖ |

Đã bóc (23/10): khối `IRLine: #fff…` là **một số 4 bit**, mỗi ô đen là một bit, mắt ngoài trái
(2L) là bit cao nhất: `⬜⬛⬛⬜` = `6`, tất cả trắng = `0`. Pythaverse ghép nó với `Sensor values`
bằng khối `=`, ra `(LbIRLine.value() == 6)`. Khối Việt gộp hai việc đó thành một câu hỏi.
Đã biên dịch được (`npm run leanbot:compile`). **Vẫn cần thử trên robot thật** xem số đó có
đúng thứ tự mắt không.

### 3.7. Logic, lặp, toán, hộp — dùng chung từ Làng Măng

Bé đã học các khối này ở Làng. Ở Thế giới Leanbot chúng **giữ đúng chữ của Làng**
(`docs/glossary.md`), chỉ thêm code Arduino bên cạnh.

| Pythaverse (en) | Khối Việt (theo Làng Măng) | Code sinh ra | Dạy |
|---|---|---|---|
| if ◇ do | **nếu** ◇ **thì** | `if (…) { }` | ✅ |
| if ◇ do … else | **nếu** ◇ **thì** … **nếu không thì** | `if (…) { } else { }` | ✅ |
| repeat 10 times | **lặp** `[10]` **lần** | `for (int count = 0; count < 10; count++) { }` | ✅ |
| repeat while ◇ | **lặp khi** ◇ | `while (…) { }` | ✅ |
| repeat until ◇ (cùng khối, đổi ô chọn) | **lặp đến khi** ◇ | `while (!(…)) { }` | ✅ |
| (không có khối "mãi mãi") | **lặp mãi** (= `repeat while true`) | `while (true) { }` | ✅ |

Chữ trên khối giữ đúng Làng Măng, nhưng là **khối riêng** (`lb_if`, `lb_repeat`…), không dùng
lại `cq_if`: code của chúng là C++ chứ không phải JavaScript của sân chơi, và "lặp" của robot
cần tới 1000 lần thay vì 20.
| break out of loop | **thoát khỏi vòng lặp** | `break;` | ➖ |
| count with j from 1 to 10 by 1 | **đếm** `j` **từ** `[1]` **tới** `[10]` | `for (int j = 1; j <= 10; j++) { }` | ➖ |
| ◇ and ◇ / or / not | ◇ **và** ◇ / **hoặc** / **không phải** ◇ | `&&` / `\|\|` / `!` | ✅ |
| ⟨ ⟩ = < > ⟨ ⟩ | ⟨ ⟩ `= ▾` ⟨ ⟩ | `(a == b)` | ✅ |
| true / false | **đúng** / **sai** | `true` / `false` | ✅ |
| 1 + 2, − × ÷ | ⟨ ⟩ `+ ▾` ⟨ ⟩ | `1 + 2` | ✅ |
| remainder of 64 ÷ 10 | **phần dư của** ⟨ ⟩ **chia** ⟨ ⟩ | `64 % 10` | ➖ |
| random integer from 0 to 100 | **số ngẫu nhiên từ** `[0]` **tới** `[100]` | `random(0, 100)` | ➖ |
| constrain / map / round / max | — | `constrain` / `map` / `round` / `max` | ✘ |
| Variables (int / float / text / boolean) | **hộp** (chỉ số nguyên) | `int x = 0;` | ➖ |
| Functions | **phép** (như Thế giới 8) | `void tenPhep() { }` | ➖ |

"Lặp khi" và "lặp đến khi" là **ngược nhau**. Pythaverse mặc định "repeat while"; Làng dạy
"lặp đến khi" (Thế giới 5). Đề xuất: dạy cả hai, có một màn so sánh hai khối cạnh nhau.

### 3.8. Không dạy (✘) và lý do

- **In/Out** (`digitalWrite`, `analogRead`, `tone(pin)`…) và **Serial** (`Serial.println`…):
  việc của thợ điện tử, Leanbot đã gói sẵn trong các khối trên. Riêng `Serial.println` có thể
  dạy ở cuối để bé **in số ra MONITOR** (Bài 0 đã dùng MONITOR) — ➖ để HLV chọn.
- **Digital Twin, DC Motor**: thi AIROC không dùng; DC Motor là bộ phận gắn thêm.
- **Danh sách, chữ, switch/case, constrain/map**: vượt quá lớp 4–5, không cần cho sa bàn.

Tổng: **khoảng 45 khối ✅**, 15 khối ➖, phần còn lại ✘.

## 4. Bản đồ: Màn 0 + 8 vùng

Mỗi vùng là một "thế giới" theo mô hình hiện có (màn, sao, boss), chỉ khác là thuộc bản đồ
Leanbot. Số màn là ước lượng, chốt khi viết `curriculum` của từng vùng.

| # | Vùng (tên tạm) | Dạy khối gì | Ý chính bé phải hiểu | Màn |
|---|---|---|---|---|
| 0 | 🔤 **Xưởng Phiên Dịch** | Mọi khối ✅ | Khối Việt và code Anh là **một**. Ghép khối → xem code; đọc code → đoán khối; dán code → ra khối | 4–5 |
| 1 | 🚩 **Bãi Xuất Phát** | Bắt đầu khi chạm, Bắt đầu ngay, Kết thúc, Chờ, Ghi chú | Robot chỉ chạy sau khi chạm `TB1A + TB1B`; nhiệm vụ có đầu có cuối | 5 |
| 2 | 🛞 **Đường Thẳng** | Quay bánh, Đi tiếp … cm, Chạy tiếp … giây, Dừng lại | Bật bánh rồi **chờ** quãng đường; đi theo cm, không theo ô | 6 |
| 3 | ↪️ **Ngã Xoay** | Quay bánh ngược nhau, Xoay tiếp … độ, lặp | Rẽ = hai bánh ngược chiều; hình vuông = lặp 4 lần (đi + xoay 90°) | 6 |
| 4 | ✊ **Bến Tay Gắp** | Mở, Khép, Xoay tay gắp, Xoay hai tay | Gắp đồ, chở đi, thả đúng chỗ | 5 |
| 5 | 💡 **Hội Đèn Lồng** | Tô đèn, Tô các đèn, Xóa, Bật đèn lên, Kêu | Tô màu chưa sáng, phải "bật đèn lên"; còi có Hz và thời gian | 5 |
| 6 | 🦇 **Hang Dơi** (mắt siêu âm) | Khoảng cách, Có vật gần hơn?, nếu, lặp khi / đến khi | Robot "nhìn" bằng tiếng vang; dừng trước tường; bám tay | 6 |
| 7 | ✋ **Cổng Cảm Ứng** | Chờ tới khi chạm, … đang được chạm?, nếu không thì | Chọn việc bằng vùng chạm (chạm trước làm A, chạm sau làm B) | 4 |
| 8 | 〰️ **Đường Vạch Đen** | Nhìn xuống, Thấy vạch đen?, 4 mắt dò vạch, Hiện lên đèn | Bám vạch: lệch trái thì xoay phải, lệch phải thì xoay trái | 6 |
| 9 | 🏙️ **Sa Bàn AIROC** (boss) | Tất cả | Một bài thi gần giống sa bàn thật | 3 |

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
- **Code → khối**: bộ đọc nhỏ chỉ hiểu dạng chuẩn ở §2 (các lệnh trong bảng, `if/else`,
  `for` đếm, `while`, `LbDelay`, ghi chú). Không dùng thư viện C++ nào. Dòng ngoài dạng chuẩn
  thì giữ nguyên và báo đỏ. Có unit test **khối → code → khối** ra đúng như cũ.
- **Biên dịch thật** (§9.12): một script gửi code lời giải của mọi màn tới
  `cs.leanbot.space/v3/compile`. Chạy tay trước khi gộp (cần mạng nên không chạy trong CI).
- **Hai bản đồ**: `World` có thêm trường `map` (`lang-mang` | `leanbot`), mặc định `lang-mang`
  để 10 thế giới cũ không phải sửa. `/map` có chỗ chuyển bản đồ. Đây là đổi schema và route,
  khó lùi → viết ADR-0030 và hỏi HLV khi tới bước đó (§9.5).
- **Ẩn khi chưa xong** (§9.10): bản đồ Leanbot chưa có vùng nào đủ boss thì không hiện với bé.

### Đã làm (23/10/2026)

| Phần | Ở đâu | Kiểm bằng |
|---|---|---|
| 38 khối Việt | `packages/games/src/leanbot/blocks.ts` | — |
| Khối → code Arduino | `leanbot/arduino.ts` (`toArduino`) | `leanbot.test.ts`: từng khối so với `docs/research/pythaverse-lbeditor-blocks.json`; hai chương trình dài so **từng ký tự** với code trình soạn Pythaverse in ra (`leanbot/fixtures/`) |
| Code → khối | `leanbot/parse.ts` (`parseArduino`) | mỗi lý do báo đỏ một test; khối → code → khối → code ra y như cũ |
| Biên dịch thật | `npm run leanbot:compile` (cần mạng) | chương trình có **mọi** khối + hai chương trình mẫu: biên dịch được trên `cs.leanbot.space` |
| Màn 0 | `/xuong-phien-dich` (`apps/web/src/screens/workshop/`) | e2e `coach-profile.spec.ts`; bé vào bằng địa chỉ thì bị đưa về `/hub` (`leanbot.spec.ts`) |

Màn 0 hiện là **xưởng mở**: ghép khối thì code hiện bên phải; bấm một dòng code thì khối của nó
sáng lên và ngược lại; "Dán code vào" → "Dựng khối" dựng lại khối, dòng chưa đọc được tô đỏ kèm
lý do; "Chép code" + link Leanbot IDE. **Chưa có** 4 thử thách dẫn dắt (cần mô hình màn chơi của
bản đồ Leanbot, tức ADR-0030).

Code sinh ra **bỏ 3 dòng đầu** `// Generated … at <giờ>` của Pythaverse: có giờ thì mỗi lần ra
code một khác. Bộ đọc bỏ qua các dòng ghi chú ngoài `loop()`, nên dán code có 3 dòng đó vẫn được.

## 6. Thứ tự làm đề xuất

1. HLV duyệt tài liệu này (tên khối, vùng, số màn).
2. **Thử trên robot thật** những chỗ còn nghi: chiều quay khi bánh âm, khối mắt dò vạch
   `⬜⬛⬛⬜`, "chờ tới khi chạm". Mỗi chỗ biên dịch + nạp một chương trình nhỏ.
3. ADR-0030 (hai bản đồ, kiểu game `leanbot`) → HLV duyệt.
4. Khối Việt + bộ sinh code Arduino + unit test so khớp Pythaverse. ✅ (23/10)
5. **Màn 0** (xưởng chuyển đổi hai chiều) — ✅ bản xưởng mở (23/10); còn 4 thử thách dẫn dắt.
6. Sân mô phỏng, rồi Vùng 1 → 9, mỗi vùng HLV chơi thử trước khi gộp.

## 7. Câu hỏi còn mở cho HLV

1. Tên khối ở §3: có chữ nào bé lớp 4 chưa hiểu không (vd "vòng/phút", "Hz", "ngưỡng")?
2. Giữ **tên vùng chạm** `TB1A`… như trên robot (bé đã quen ở Bài 0) hay gọi "chạm trước
   trái"…? Đề xuất: giữ `TB1A` vì in trên robot, thêm hình nhỏ chỉ chỗ.
3. Có dạy `Serial.println` (in số ra MONITOR) không?
4. Thứ tự vùng có hợp với lịch 17 buổi của khóa Leanbot không?
