# Bài 14 — Nhiệm vụ 2: Rải chất trung hòa

> Bài gốc: *AI ROC 2026 Mission 2 – The Neutralizer Deployment* · 29 slide · 3 chương (Engage 11, Learn 12, Resolve 6) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=63001>

Đây là **bài thi đấu**. Bé học cách gắp một khối trung hòa từ kho, chở qua các ngã tư và thả đúng khu cách ly để được **160 điểm mỗi cặp đúng màu**. Bài dựa trên Bài 2 (tay gắp) và Bài 13 (bám vạch, đếm ngã tư). Mục "Chương trình mẫu" giải thích từng khối của chương trình chính thức `Neutralizer.bduino`.

## Bé học xong thì làm được gì
- Nói đúng ba điều kiện để một khối trung hòa được **+160 điểm**: Nhiệm vụ 1 đã khoanh vùng thành công, một phần khối chạm hoặc đè lên khu cách ly, và **màu khớp** màu khối ô nhiễm nằm trong ô đó.
- Chỉ ra kho S1–S6 trên sa bàn và tự chọn chỗ đặt khối trung hòa.
- Sắp đúng thứ tự nhặt khối: mở tay gắp, tiến chậm, đóng tay gắp, chờ 1 giây.
- Đọc chương trình mẫu và nói được từng khối làm gì, đoạn nào là đi lấy khối, đoạn nào là chở và thả.
- Tự thêm hai bước mà chương trình mẫu còn thiếu (chờ 1 giây sau khi gắp, lùi sau khi thả) rồi chạy thử trên Bản Sao Số.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Robot Leanbot có tay gắp, đã sạc pin, dây USB | Kiểm tra tay gắp đã cân chỉnh (Bài 2) |
| Sa bàn 4 ft × 4 ft có vạch đen và kho S1–S6 | Không có sa bàn thì in sơ đồ 3×3 ra giấy A3 |
| Khối trung hòa (gỗ màu có sọc trắng) và khối ô nhiễm (gỗ màu) | Kích thước ghi trên slide: dài 1,5 cm × rộng 2,5 cm × cao 7,5 cm |
| Máy tính, Chrome, tài khoản PLearn | Mở sẵn trang bài 14 ở link trên |
| Trình soạn khối (`ide.pythaverse.space/lbeditor/`) | Thầy bật bản vá tiếng Việt để dạy; xem `tools/lbeditor-vi/` |
| Chương trình mẫu `Neutralizer.bduino` | Trên PGit. Đường dẫn trong slide Learn 09 là *chương trình của Bài 13* (`Containment.bduino`); xem "Ghi chú về bản gốc" |
| Video của bài | Link chép từ phân tích: <https://youtu.be/OtFIqNPVI6c>. Slide Learn 07 chỉ có tiêu đề, phần thân trắng nên chưa chắc video nằm ở đó; thầy mở thử trước giờ học |
| Phiếu ôn luyện in sẵn | Mục "Phiếu ôn luyện" cuối bài |

## Thuật ngữ của bài
Từ đã có trong giáo trình tổng (Khối trung hòa, Kho trung hòa S1–S6, Khu cách ly, Phòng Thí Nghiệm (CRL), Khối ô nhiễm, Tay gắp, Động cơ servo, Bản Sao Số, Ngưỡng…) không chép lại; bài này dùng đúng cách dịch đó.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Angle (0°–180°) | Góc (0 đến 180 độ) | Servo quay tới góc nào thì tay gắp mở hay đóng theo góc đó |
| Friction | Ma sát | Lực làm khối bám chặt vào tay gắp, không tuột |
| Payload | Hàng đang chở | Khối mà robot đang kẹp trên tay gắp |
| Center of gravity | Trọng tâm | Chỗ giữ cho robot khỏi chúi về trước khi kẹp khối nặng |
| Pair (Neutralizer + Pollution) | Cặp (khối trung hòa + khối ô nhiễm) | Hai khối cùng màu, một nằm trong ô, một mang tới |
| Color-matched | Đúng màu | Khối trung hòa và khối ô nhiễm cùng một màu |
| Collision | Va chạm | Robot hoặc khối đụng nhau trong Bản Sao Số |
| Junction | Ngã tư | Chỗ các vạch đen cắt nhau (từ Bài 13) |
| Storage Area | Kho | Các ô S1–S6 ở mép sa bàn, nơi đặt khối trung hòa |

## Khối lệnh dùng trong bài
Nhãn Việt theo giáo trình tổng §5.5; các khối bám vạch và di chuyển giống Bài 13.

| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `LbGripper.moveTo` | Tay gắp: Xoay tới góc ? độ | Servo quay tới đúng góc rồi giữ. Chương trình mẫu dùng **50 độ** để kẹp khối |
| `LbGripper.open` | Tay gắp: Mở | Mở tay gắp để thả khối |
| `LbGripper.close` | Tay gắp: Đóng | Đóng tay gắp (có trong thư viện, **chương trình mẫu không dùng**) |
| `LbMission.beginByTeacher_end` | Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B ... Nhiệm vụ: Kết thúc | Robot chờ chạm hai nút rồi mới chạy |
| `LbIRLine.setThreshold` | Cảm biến vạch: Đặt ngưỡng 2T 69, 0T 78, 1P 106, 3P 70 | Cho bốn mắt bốn ngưỡng đen/trắng |
| `LbIRLine.read`, `LbIRLine.value`, `LbIRLine.displayOnRGB` | Đọc cảm biến, Giá trị 4 mắt, Hiện lên đèn LED | Đọc bốn mắt, cất vào `line`, đèn LED sáng xanh lá |
| `controls_switch` | Chọn theo (line) ... thì làm | Mỗi giá trị `line` một kiểu chạy hai bánh |
| `LbMotion.run` | Di chuyển: Chạy với vận tốc Trái ? Phải ? | Đặt tốc độ từng bánh |
| `LbMotion.waitDistanceMm` | Di chuyển: Chạy đoạn đường ? mm | Chờ đi đủ quãng đường |
| `LbMotion.waitRotationDeg` | Di chuyển: Rẽ góc ? độ | Chờ xoay đủ góc |
| `LbMotion.stop` | Di chuyển: Dừng | Dừng hai bánh |
| Hàm tự tạo | `runFollowLine`, `followLineUntilJunction`, `followLineDistance`, `goToJunction`, `followLineMultipleJunctions`, `Forward`, `Backward`, `Rotate` | Giống hệt Bài 13 |

Slide dạy khối `Set Servo [Port] to [Angle]`. Khối này **không có** trong bộ khối của Leanbot. Thầy chỉ cho bé các khối thật: **Tay gắp: Xoay tới góc ? độ**, **Tay gắp: Mở**, **Tay gắp: Đóng**.

## Dạy thế nào

### Mở bài (5 phút)
1. Thầy hỏi: "Con cầm một cốc nước đầy bằng một tay, vươn ra phía trước. Điều gì dễ xảy ra?" (chúi về trước, đổ.) Nối sang robot: "Robot kẹp khối cũng vậy."
2. Thầy nói câu chuyện: "Khói trong thành phố cần chất trung hòa. Robot lấy chất đó ở kho, mang tới đúng khu có khối cùng màu."
3. Thầy cho xem sa bàn và hai kiểu khối: khối trung hòa có **sọc trắng**, khối ô nhiễm không có.

### Giảng (35 phút)
**Bước 1 — Kho và khu cách ly (7 phút).** Thầy vẽ sa bàn 3×3 lên bảng (A, C, F / B, E, H / D, G, CRL) và hai hàng kho: S1, S3, S5 ở mép dưới; S2, S4, S6 ở mép phải.
- Hỏi: "Ai quyết định đặt khối trung hòa ở ô kho nào?" Slide nói: **học sinh tự chọn chỗ đặt**. Ví dụ trên slide: S1 và S5.
- Hỏi: "Robot xuất phát và kết thúc ở đâu?" (CRL.) Nhắc lại luật đặt robot: nằm hoàn toàn trong CRL, không đè viền đen.

**Bước 2 — Luật chấm điểm (8 phút).** Thầy ghi lên bảng: **+160 mỗi cặp**. Một khối trung hòa được tính khi đủ **cả ba**:
1. Nhiệm vụ 1 đã khoanh vùng thành công (khối ô nhiễm đã nằm trong khu cách ly).
2. Một phần khối trung hòa chạm hoặc đè lên khu cách ly.
3. **Màu khối trung hòa trùng màu khối ô nhiễm** nằm trong ô đó.
- Cho bé xem hình tick và X trên slide. Hỏi: "Khối xanh dương mang vào ô có khối ô nhiễm đỏ thì được bao nhiêu điểm?" (0, vì sai màu.)
- Bảng điểm ví dụ trên slide: khoanh vùng +45; trung hòa hai cặp +320 (160 × 2); phân tích +100; về CRL không đúng chỗ +0; tổng **465 trên 505**. Điểm thưởng 40 khi cả hai bánh trong CRL lúc dừng.

**Bước 3 — Tay gắp và servo (8 phút).** Thầy ôn Bài 2.
- Servo không quay mãi, nó quay **tới một góc** rồi giữ. Góc 0 đến 180 độ.
- Giáo trình tổng §6 ghi: tay gắp mở là **0°**, đóng là **90°** (theo `LbGripper.open` và `LbGripper.close`). Chương trình mẫu dùng `moveTo(50)` để kẹp. Nói thật với bé: slide **không nói** vì sao là 50; có thể vì khối rộng 2,5 cm nên tay gắp dừng ở góc đó, nhưng đó là suy đoán. Mỗi robot có thể khác, nên bé phải tự tìm góc kẹp chắc cho robot của mình.
- Thầy làm mẫu **tăng góc từng nấc nhỏ**. Dặn: nghe tiếng servo rít hoặc thấy tay gắp kẹt thì dừng ngay và nhả ra.

**Bước 4 — Thứ tự nhặt khối (6 phút).** Thầy viết bốn thẻ lên bảng, bé xếp: Mở tay gắp → Tiến chậm → Đóng tay gắp → Chờ 1 giây.
- Hỏi: "Vì sao chờ 1 giây?" Câu trả lời của slide: cho **ma sát** ổn định, khối được giữ chặt trước khi robot đi. Thầy cho bé thử nâng khối bằng hai ngón tay: lúc vừa kẹp thì dễ tuột, giữ một lát thì chắc.
- Nói rõ: slide dạy chờ 1 giây, nhưng **chương trình mẫu không có** bước này. Bé sẽ tự thêm.

**Bước 5 — Chở nặng và thả (6 phút).**
- "Robot chúi về trước khi mang khối thì làm gì?" Slide: **hạ thấp tay gắp** (câu 5 của bài kiểm tra).
- Slide dạy thả khối bằng cảm biến siêu âm: chờ khoảng cách nhỏ hơn 5 cm, dừng, rồi mở tay gắp. Sau khi thả thì **lùi một đoạn ngắn** trước khi rẽ để không đụng khối vừa thả.
- Nói rõ: chương trình mẫu **không dùng siêu âm** và **không lùi**. Nó đi thẳng 100 mm rồi mở tay gắp. Hai bước này là phần "em tự thêm".

### Bé tự làm (45 phút)
1. **Tìm góc kẹp (10 phút).** Dùng khối "Tay gắp: Xoay tới góc ? độ", thử từ góc nhỏ tăng dần cho tới khi kẹp chắc khối trung hòa. Ghi lại góc kẹp và góc mở của robot mình. Bé dừng ngay nếu thấy tay gắp kẹt.
2. **Chuỗi nhặt khối (10 phút).** Ghép Mở → tiến chậm → Đóng → Chờ 1 giây. Thử nhấc nhẹ khối khỏi mặt bàn xem có tuột không.
3. **Chạy chương trình mẫu trên Bản Sao Số (10 phút).** Đặt lại môi trường rồi chạy. Quan sát: robot lấy khối ở S3 và thả vào ô E (Mobility Hub). Xem có thông báo "Collision" không.
4. **Thêm hai bước còn thiếu (10 phút).** Thêm "Chờ 1 giây" sau khi gắp và `Backward` một đoạn ngắn sau khi thả. Chạy lại, so sánh với trước.
5. **Chạy robot thật (5 phút)**, bé mới tập dùng tốc độ thấp. Phần còn lại làm ở nhà: phiếu ôn luyện.

### Chốt bài (5 phút)
- Thầy hỏi: "Ba điều kiện để được 160 điểm là gì?" (đã khoanh vùng, chạm khu cách ly, đúng màu.) "Sau khi đóng tay gắp, robot nên làm gì?" (chờ 1 giây.) "Sau khi thả khối, robot nên làm gì?" (lùi một đoạn ngắn.)
- Mỗi bé nói góc kẹp mình tìm được.
- Dặn: Bài 15 sẽ quay đầu khi đang kẹp khối.

## Chương trình mẫu
Nguồn: `Neutralizer.bduino`. Robot xuất phát ở CRL, lấy khối ở **S3**, chở vào **khu cách ly E** (Mobility Hub) rồi thả. Số liệu khớp với file `.bduino` và `.ino`.

### Khối chính

Khối tiếng Việt:
```
Leanbot bắt đầu hoạt động
  Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B
  Cảm biến vạch: Đặt ngưỡng  2T 69  0T 78  1P 106  3P 70
  # Follow line to S3
  Forward        tốc độ 2000   quãng đường 110 mm
  Rotate         tốc độ -2000  góc 108 độ
  followLineMultipleJunctions   số ngã tư 2
  goToJunction
  # Pick up Neutralize at S3
  Tay gắp: Xoay tới góc 50 độ
  # Follow line to E2
  Rotate         tốc độ 2000   góc 60 độ
  followLineMultipleJunctions   số ngã tư 2
  goToJunction
  Rotate         tốc độ 2000   góc 60 độ
  followLineMultipleJunctions   số ngã tư 2
  goToJunction
  Rotate         tốc độ 2000   góc 30 độ
  # Push Pollution into Containment E
  Forward        tốc độ 2000   quãng đường 100 mm
  # Drop Neutralize into Containment E
  Tay gắp: Mở
  Nhiệm vụ: Kết thúc
```

Code C++ tương ứng:
```cpp
void setup() {
  Leanbot.begin();
  LbIRLine.setThreshold(69, 78, 106, 70);   // 2L, 0L, 1R, 3R
}

void loop() {
  LbMission.begin(TB1A + TB1B);   // chờ chạm hai nút

  // Follow line to S3
  Forward(2000, 110);             // tiến 110 mm ra khỏi CRL
  Rotate((-2000), 108);           // xoay 108 độ, tốc độ âm
  followLineMultipleJunctions(2);
  goToJunction();

  // Pick up Neutralize at S3
  LbGripper.moveTo(50);           // tay gắp xoay tới 50 độ: kẹp khối

  // Follow line to E2
  Rotate(2000, 60);
  followLineMultipleJunctions(2);
  goToJunction();
  Rotate(2000, 60);
  followLineMultipleJunctions(2);
  goToJunction();
  Rotate(2000, 30);

  // Push Pollution into Containment E
  Forward(2000, 100);             // tiến 100 mm vào ô E

  // Drop Neutralize into Containment E
  LbGripper.open();               // mở tay gắp: thả khối
  LbMission.end();
}
```

Giải thích từng khối cho bé:

| Khối | Bé nghe thầy nói |
|---|---|
| `LbMission.begin(TB1A + TB1B)` | "Chạm cùng lúc hai nút thì robot mới chạy." |
| `LbIRLine.setThreshold(69, 78, 106, 70)` | "Bốn mắt, bốn ngưỡng. Số nhỏ hơn ngưỡng là thấy đen (suy ra từ cách dùng, slide không nói). Đổi sân, đổi ánh sáng thì có thể phải đo lại." |
| `Forward(2000, 110)` | "Tiến thẳng 110 mm ra khỏi CRL." |
| `Rotate(-2000, 108)` | "Xoay tại chỗ 108 độ. Tốc độ âm là xoay chiều ngược với tốc độ dương, không phải lùi." |
| `followLineMultipleJunctions(2)` + `goToJunction()` | "Bám vạch, đếm 2 ngã tư, rồi dừng giữa ngã tư (xem ghi chú đếm ngã tư ở Bài 13). Chú thích của chương trình: đây là chặng tới **S3**." |
| `LbGripper.moveTo(50)` | "Servo xoay tới 50 độ rồi giữ. Tay gắp kẹp khối." Chương trình **không mở tay gắp trước** và **không chờ 1 giây**. |
| `Rotate(2000, 60)` (hai lần) và `Rotate(2000, 30)` | "Ba lần xoay 60°, 60°, 30° để hướng về ô E." Slide không giải thích vì sao đúng các góc này; chúng do mẫu chọn cho đúng sa bàn. |
| `followLineMultipleJunctions(2)` + `goToJunction()` (hai lần) | "Hai chặng bám vạch nữa, mỗi chặng 2 ngã tư rồi dừng. Chú thích: đi tới E2." |
| `Forward(2000, 100)` | "Tiến thẳng 100 mm, đẩy khối vào ô E." Chú thích trong chương trình ghi "Push Pollution", nhưng thứ đang được đưa vào ô là khối trung hòa, nên chú thích hơi lạc. |
| `LbGripper.open()` | "Mở tay gắp, thả khối vào ô E." |
| `LbMission.end()` | "Kết thúc nhiệm vụ." Chương trình **không lùi** và **không về CRL**. |

### Các hàm do bài định nghĩa
Giống hệt Bài 13 (`runFollowLine`, `followLineUntilJunction`, `followLineDistance`, `goToJunction`, `followLineMultipleJunctions`, `Forward`, `Backward`, `Rotate`). Bảng quẹo, các số 15, 20 mm, 30 mm xem ở `lesson-13-nhiem-vu-1.md`. Hàm `Backward` có định nghĩa nhưng `loop()` không gọi.

```cpp
#include <Leanbot.h>

int line;

void runFollowLine() {
  // --- Read line ---
  LbIRLine.read();
  line = LbIRLine.value();
  LbIRLine.displayOnRGB(0x00ff00);
  switch (line) {
    case 4:  LbMotion.runLR(1000, 2000);  break;
    case 2:  LbMotion.runLR(2000, 1000);  break;
    case 12: LbMotion.runLR(200, 2000);   break;
    case 3:  LbMotion.runLR(2000, 200);   break;
    case 8:  LbMotion.runLR(-1000, 1000); break;
    case 1:  LbMotion.runLR(1000, -1000); break;
    default: LbMotion.runLR(2000, 2000);
  }
}

void followLineUntilJunction() {
  while ((line != 15)) { runFollowLine(); }
}

void followLineDistance(int distanceMm) {
  auto targetMm = distanceMm + LbMotion.getDistanceMm();
  while ((LbMotion.getDistanceMm() < targetMm)) { runFollowLine(); }
}

void goToJunction() {
  followLineUntilJunction();
  followLineDistance(20);
  LbMotion.stopAndWait();
}

void followLineMultipleJunctions(int junctionCount) {
  for (int count = 0; count < junctionCount; count++) {
    followLineDistance(30);
    followLineUntilJunction();
  }
}

void Forward(int speed, int distanceMm) {
  LbMotion.runLR(speed, speed);
  LbMotion.waitDistanceMm(distanceMm);
  LbMotion.stopAndWait();
}

void Backward(int speed, int distanceMm) {
  LbMotion.runLR((-1) * speed, (-1) * speed);
  LbMotion.waitDistanceMm(distanceMm);
  LbMotion.stopAndWait();
}

void Rotate(int speed, int degrees) {
  LbMotion.runLR(speed, (-1) * speed);
  LbMotion.waitRotationDeg(degrees);
  LbMotion.stopAndWait();
}
```
(Phần `#include <Leanbot.h>` và `int line;` lấy từ chương trình Bài 13, hai chương trình có cùng các hàm.)

### Chương trình mẫu sau khi bé tự thêm hai bước (không phải bản chính thức)
Bước thêm theo đúng lời slide: chờ 1 giây sau khi gắp, lùi sau khi thả. Hai con số 1 giây và đoạn lùi là của bé; slide chỉ nói "một đoạn ngắn".
```cpp
  // Pick up Neutralize at S3
  LbGripper.moveTo(50);
  Leanbot.delay(1.0);             // chờ 1 giây cho ma sát giữ chặt
  ...
  // Drop Neutralize into Containment E
  LbGripper.open();
  Backward(1000, 50);             // lùi ngắn trước khi rẽ (50 mm là ví dụ để bé thử)
  LbMission.end();
```

## Phiếu ôn luyện

**1. Dịch nhãn (dễ).**
Đề: Dịch sang tiếng Việt: (a) `Gripper: Open` (b) `Gripper: Close` (c) `Gripper: Rotate to ? degrees` (d) Neutralizer (e) Containment area. Dịch ngược sang tiếng Anh: (f) "Kho trung hòa S1–S6".

**Đáp án:** (a) Tay gắp: Mở (b) Tay gắp: Đóng (c) Tay gắp: Xoay tới góc ? độ (d) Khối trung hòa (e) Khu cách ly (f) Neutralizer storage S1–S6.

**2. Đọc đoán kết quả: tay gắp (dễ).**
Đề: Chương trình chạy `LbGripper.moveTo(50);` rồi `Forward(2000, 100);` rồi `LbGripper.open();`. Tay gắp làm gì ở từng dòng? Khối trung hòa nằm ở đâu lúc kết thúc?

**Đáp án:** Dòng 1: servo xoay tới 50 độ, kẹp khối. Dòng 2: robot tiến 100 mm, tay gắp vẫn giữ khối. Dòng 3: tay gắp mở, khối được thả tại chỗ robot vừa tới (trong chương trình mẫu là khu cách ly E).

**3. Đọc đoán kết quả: đúng màu (dễ).**
Đề: Khu cách ly E đã có một khối ô nhiễm **xanh dương**. Ở kho, S1 có khối trung hòa xanh lá, S5 có khối trung hòa xanh dương. Lấy khối ở ô nào? Nếu mang cả hai vào ô E thì được mấy điểm? (Giả sử Nhiệm vụ 1 đã khoanh vùng thành công và cả hai chạm khu cách ly.)

**Đáp án:** Lấy khối ở **S5** (cùng màu xanh dương). Khối xanh lá sai màu nên không được điểm. Một cặp đúng màu được **160 điểm**.

**4. Sắp thứ tự (vừa).**
Đề: Xếp lại chuỗi nhặt khối cho đúng: (a) Đóng tay gắp (b) Chờ 1 giây (c) Tiến chậm tới sát khối (d) Mở tay gắp.

**Đáp án:** d, c, a, b: Mở tay gắp, tiến chậm, đóng tay gắp, chờ 1 giây. Chờ 1 giây để ma sát giữ chặt khối trước khi robot đi.

**5. Điền số (vừa).**
Đề: Điền các số còn thiếu theo chương trình mẫu của bài:
```cpp
Forward(2000, ___);
Rotate((-2000), ___);
followLineMultipleJunctions(___);
goToJunction();
LbGripper.moveTo(___);
```

**Đáp án:** 110; 108; 2; 50. Đây là các số của chương trình mẫu, chạy đúng với sa bàn và robot của slide. Robot của bé có thể cần số khác: đặc biệt góc kẹp 50 độ phải thử lại cho từng robot.

**6. Đọc đoán kết quả: chặng đầu (vừa).**
Đề: Đọc `Forward(2000, 110); Rotate((-2000), 108); followLineMultipleJunctions(2); goToJunction();`. Theo dòng chú thích của chương trình thì robot đi tới đâu? Dòng nào ngay sau đó, và nó làm gì?

**Đáp án:** Chú thích ghi "Follow line to S3": robot đi tới **S3**. Dòng ngay sau là `LbGripper.moveTo(50)`: tay gắp xoay tới 50 độ để kẹp khối ở S3.

**7. Tìm lỗi: thiếu chờ (vừa).**
Đề: Robot gắp xong thì chạy luôn, đi được một đoạn thì khối tuột khỏi tay gắp. Chương trình:
```cpp
LbGripper.moveTo(50);
Rotate(2000, 60);
```
Sai ở đâu? Sửa thế nào? Vì sao?

**Đáp án:** Thiếu bước **chờ 1 giây** sau khi đóng tay gắp, thêm `Leanbot.delay(1.0);` giữa hai dòng. Lý do (theo slide): chờ cho ma sát ổn định, khối được giữ chặt rồi mới đi. Chương trình mẫu chính thức cũng không có bước này; bé là người thêm vào. Nếu vẫn tuột thì thử đổi góc kẹp.

**8. Tìm lỗi: thả rồi rẽ liền (khó).**
Đề: Robot thả khối vào khu cách ly xong thì rẽ ngay, và khối bị gạt ra ngoài ô, mất điểm:
```cpp
LbGripper.open();
Rotate(2000, 60);
```
Sai ở đâu? Sửa thế nào?

**Đáp án:** Robot còn sát khối nên khi rẽ, thân hoặc tay gắp gạt vào khối. Thêm một đoạn **lùi ngắn** trước khi rẽ, ví dụ `Backward(1000, 50);` (50 mm là số để bé thử, slide chỉ nói "một đoạn ngắn"). Lý do trong bài kiểm tra: lùi để không đụng khối khi rẽ.

**9. Làm trên máy (vừa).**
Đề: Ghép khối trong trình soạn khối để cột code bên phải ra đúng:
```cpp
LbGripper.open();
LbGripper.close();
Leanbot.delay(1.0);
```

**Đáp án:** Ba khối nối nhau: "Tay gắp: Mở", "Tay gắp: Đóng", rồi khối chờ 1 giây. (Đoạn code mẫu `LbGripper.close(); Leanbot.delay(1.0);` lấy từ giáo trình tổng §4; thầy kiểm tên khối chờ trong thanh khối của bản vá trước khi giao bài.) Chạy trên robot thật, góc đóng của khối này khác góc 50 của chương trình mẫu, nên để bé quan sát chỗ khác nhau.

**10. Điền số: tính điểm cả lượt (khó).**
Đề: Một lượt: khoanh vùng 1 khối ô nhiễm, trung hòa đúng màu 1 cặp, không có khối phân tích, robot dừng với cả hai bánh nằm trong CRL. Tổng bao nhiêu điểm? Nếu trung hòa **sai màu** thì sao?

**Đáp án:** 45 + 160 + 0 + 40 = **245 điểm**. Nếu sai màu thì không tính cặp trung hòa: 45 + 0 + 0 + 40 = **85 điểm**.

Phiếu có đủ sáu dạng: đọc đoán (2, 3, 6), tìm lỗi (7, 8), sắp thứ tự (4), điền số (5, 10), dịch nhãn (1), làm trên máy (9).

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc có **8 câu** (H5P; slide Check your Understanding chỉ là khung trắng). Đáp án đúng ghi đầu tiên.

1. What motor is typically used to control a gripper? / Loại động cơ nào thường điều khiển tay gắp?
   - Đúng: Servo Motor / Động cơ servo. Sai: Steam Engine / Máy hơi nước. DC Motor / Động cơ DC.
2. Which angle would likely "Open" a gripper? / Góc nào nhiều khả năng sẽ "Mở" tay gắp?
   - Đúng: 0 degrees / 0 độ. Sai: 360 degrees / 360 độ. -90 degrees / -90 độ.
3. Why should the robot wait 1 second after closing the gripper? / Vì sao robot nên chờ 1 giây sau khi đóng tay gắp?
   - Đúng: To ensure the object is securely held before moving. / Để chắc chắn khối được giữ chặt trước khi đi. Sai: To let the sensors cool down. / Để cảm biến nguội bớt. To save battery. / Để tiết kiệm pin.
4. What force helps the gripper hold onto the block? / Lực nào giúp tay gắp giữ chặt khối?
   - Đúng: Friction / Ma sát. Sai: Magnetism / Từ trường. Gravity / Trọng lực.
5. If the robot tips forward while carrying the block, what should you do? / Nếu robot chúi về trước khi mang khối, em nên làm gì?
   - Đúng: Lower the gripper height. / Hạ thấp tay gắp. Sai: Increase speed. / Tăng tốc độ. Remove the wheels. / Tháo bánh xe.
6. Which sensor tells the robot it has reached the delivery zone? / Cảm biến nào cho robot biết đã tới khu giao hàng?
   - Đúng: Ultrasonic Sensor / Cảm biến siêu âm. Sai: Sound Sensor / Cảm biến âm thanh. Pressure Sensor / Cảm biến áp suất.
7. What is the "Neutralizer" in the context of AI ROC 2026? / "Neutralizer" trong AI ROC 2026 là gì?
   - Đúng: A substance to treat pollution. / Chất dùng để xử lý ô nhiễm. Sai: A weapon. / Vũ khí. A spare battery. / Pin dự phòng.
8. Why move backward after dropping the block? / Vì sao lùi sau khi thả khối?
   - Đúng: To avoid hitting the block when turning. / Để không đụng khối khi rẽ. Sai: Because the robot is lighter now. / Vì robot nhẹ hơn. To show off. / Để khoe.

Câu 2 khớp giáo trình tổng (mở là 0°) và khớp ví dụ trên slide (`Set Servo 1 to 0` là mở). Câu 6 nhắc siêu âm, nhưng chương trình mẫu không dùng siêu âm.

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Tìm khối `Set Servo` | Bé hỏi "khối này đâu?" | Chỉ ba khối thật: Tay gắp: Xoay tới góc ? độ, Mở, Đóng |
| Ép servo quá góc | Tay gắp kêu rít, kẹt | Cho bé tăng góc từng nấc nhỏ, dừng ngay khi nghe tiếng rít |
| Khối tuột lúc chạy | Khối rơi khi robot vừa xoay | Thêm chờ 1 giây sau khi đóng tay gắp; thử đổi góc kẹp |
| Robot chúi về trước | Mũi robot chúi xuống khi chở khối | Hạ thấp tay gắp (theo slide) |
| Nhầm tốc độ âm là lùi | Bé tưởng `Rotate(-2000, 108)` là đi lùi | Làm mẫu trên robot thật, vẽ mũi tên hai bánh |
| Chép máy móc các số | 110, 108, 60, 30, 100 | Hỏi bé "nếu khối đặt ở S1 thì số nào phải đổi?"; số góc do mẫu chọn cho sa bàn, slide không giải thích |
| Nhiều hàm lồng nhau | Bé không biết robot đi những đoạn nào | Cho bé chạy từng hàm riêng trên Bản Sao Số trước, đếm to ngã tư |
| Lẫn slide với chương trình mẫu | Bé hỏi vì sao mẫu không có chờ 1 giây hay siêu âm | Nói rõ: mẫu chưa làm; đây là phần bé tự thêm |
| Quên điều kiện "đúng màu" | Bé mang bừa khối đầu tiên | Vẽ bảng "ô nào có khối màu gì, lấy kho nào" trước khi lập trình |
| Chữ khó (overlap, color match) | Bé không hiểu luật | Dùng hình tick và X trên slide thay cho chữ |

## Nộp bài trên Plearn
Trang khóa học có hai mục liên quan:
1. **"Lesson 14: AI ROC 2026 Mission 2 – The Neutralizer Deployment (In-Class)"**: hoạt động H5P (link ở đầu bài). Bé xem hết slide và làm 8 câu hỏi kiểm tra.
2. **"Mission 2 - The Neutralizer Deployment"**: mục nộp bài (Assignment). Theo trang khóa học, mục này **bị khóa cho tới khi hoạt động Lesson 14 được đánh dấu hoàn thành**.

**Chưa lấy được:** nội dung đề của mục nộp bài (nộp file nào, ảnh, video hay đường dẫn; hạn nộp). Khâu bóc tách mới đọc 29 slide và danh sách hoạt động, chưa mở trang nộp bài. Thầy đăng nhập PLearn, mở mục "Mission 2 - The Neutralizer Deployment", đọc đề và ghi vào đây. Đừng để bé đoán.

Trước khi bé nộp, thầy kiểm: bé đã chạy chương trình mẫu trên Bản Sao Số một lượt có thả được khối vào ô E, và đã tự thêm hai bước chờ 1 giây và lùi sau khi thả.

## Ghi chú về bản gốc
- **Slide và chương trình mẫu không khớp.** Slide dạy: mở tay gắp, tiến chậm, đóng, **chờ 1 giây**; chờ siêu âm khoảng cách nhỏ hơn 5 cm rồi thả; **lùi** sau khi thả. Chương trình `Neutralizer.bduino` chỉ có `moveTo(50)`, `Forward(2000, 100)` và `open()`: không chờ, không siêu âm, không lùi, không mở tay gắp trước khi tới S3.
- **Khối không tồn tại.** Slide dạy `Set Servo [Port] to [Angle]`, ví dụ `Set Servo 1 to 90` là đóng và `Set Servo 1 to 0` là mở. Khối này không có trong bộ khối Leanbot. Khối thật: `LbGripper.moveTo`, `open`, `close`.
- **Góc tay gắp mâu thuẫn.** Giáo trình tổng §6: mở là 0°, đóng là 90°. Slide ví dụ: đóng 90, mở 0 (khớp §6). Chương trình mẫu: kẹp bằng `moveTo(50)`. Không tài liệu nào giải thích vì sao 50 chứ không phải 90.
- **Tên chương trình mẫu.** Slide Learn 09 nói "Click into this to copy template code" và link trong phân tích trỏ tới `Containment.bduino` (chương trình của Bài 13), không phải `Neutralizer.bduino`. Có thể là lỗi chép đường dẫn trên slide. Thầy dùng file `Neutralizer.bduino`.
- **Sơ đồ ở slide Learn 08** ("repeat main drive pattern 10 times", `DrivePattern1`) là hình minh họa chung chung, không khớp chương trình mẫu thật (không có vòng lặp 10 lần).
- **Chú thích trong chương trình mẫu:** "Push Pollution into Containment E" thực ra đưa khối trung hòa vào ô E. "Follow line to E2" cũng không giải thích "E2" là gì.
- **Kho.** Mẫu lấy khối ở S3, nhưng ví dụ trên slide đặt ở S1 và S5; Challenge 1 nói lấy từ S1 hoặc S5. Chương trình mẫu không áp dụng trực tiếp cho S1 và S5 mà phải đổi số.
- **Tốc độ.** Chương trình mẫu chạy tốc độ 2000 (100% của −2000 … 2000), trong khi lời khuyên 30–50% (Bài 13) dành cho bé mới tập.
- **Đếm ngã tư.** Xem ghi chú "Cách đếm ngã tư" ở `lesson-13-nhiem-vu-1.md`: đọc code và đọc bóc tách có thể khác nhau một ngã tư. Chưa kiểm trên máy.
- **Lỗi chép trên slide:** Zone B trùng mô tả Zone A; CRL trùng mô tả Zone E; Zone H ghi "Start zone"; "Practice Activites"; tên module "Mission 1: Neutralize" trên trang bìa dù là Nhiệm vụ 2; trang khóa học viết "Neutraulizer".
- **Slide Learn 07** chỉ có tiêu đề "MISSION 2: NEUTRALIZER", phần thân trắng.
