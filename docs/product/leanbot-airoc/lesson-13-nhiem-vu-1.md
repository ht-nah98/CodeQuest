# Bài 13 — Nhiệm vụ 1: Khoanh vùng ô nhiễm

> Bài gốc: *AI ROC 2026 Mission 1 — The Containment Protocol* · 26 slide · 3 chương (Engage 10, Learn 10, Resolve 6) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62997>

Đây là **bài thi đấu**. Bé đọc luật chấm điểm, rồi đọc kỹ chương trình mẫu chính thức `Containment.bduino` từng khối một. Bài này không dạy khối mới; nó ghép những thứ đã học ở Bài 1 và Bài 4 (đi thẳng, quay, bám vạch) thành một nhiệm vụ trọn vẹn.

## Bé học xong thì làm được gì
- Nói đúng khi nào một khối ô nhiễm được **+45 điểm** (chỉ cần một phần khối chạm hoặc đè lên khu cách ly) và khi nào được **+40 điểm thưởng** (cả hai bánh nằm hoàn toàn trong Phòng Thí Nghiệm).
- Đặt robot xuất phát đúng luật: nằm hoàn toàn trong CRL, không bộ phận nào đè lên viền đen.
- Đọc chương trình mẫu và chỉ ra từng khối làm gì, khối nào gọi hàm nào.
- Đổi con số trong `Forward` và `Rotate` rồi đoán trước robot đi bao nhiêu mm, xoay bao nhiêu độ.
- Chạy chương trình mẫu trên Bản Sao Số, nhìn bảng xem lại lượt chạy, đặt lại sân rồi chạy tiếp.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Robot Leanbot đã sạc pin, dây USB | Dây USB chỉ cần khi nạp xuống robot thật |
| Sa bàn 4 ft × 4 ft có vạch đen | Nếu chưa có thì in sơ đồ 3×3 có Khu A–H và CRL ra giấy A3 |
| Khối ô nhiễm (gỗ màu) | Kích thước ghi trên slide: dài 1,5 cm × rộng 2,5 cm × cao 7,5 cm |
| Máy tính, Chrome, tài khoản PLearn | Mở sẵn trang bài 13 ở link trên |
| Trình soạn khối (`ide.pythaverse.space/lbeditor/`) | Thầy bật bản vá tiếng Việt để dạy; xem `tools/lbeditor-vi/` |
| Chương trình mẫu `Containment.bduino` | Trên PGit: `git.pythaverse.space/ptvairoc/Synapsecity_Primary/blob/master/Containment.bduino` (đường dẫn lấy từ slide). Cần có tài khoản mới mở được |
| Phiếu ôn luyện in sẵn | Mục "Phiếu ôn luyện" cuối bài |

## Thuật ngữ của bài
Từ đã có trong giáo trình tổng (Khu cách ly, Phòng Thí Nghiệm (CRL), Khối ô nhiễm, Khu A–H, Ngưỡng, Bản Sao Số, Phạt, Cảm biến siêu âm, Hàm…) không chép lại; bài này dùng đúng các cách dịch đó.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Line Following | Bám vạch | Robot đi men theo vạch đen |
| Junction | Ngã tư | Chỗ các vạch đen cắt nhau |
| Binary Line Following | Bám vạch đen/trắng | Mỗi mắt chỉ trả lời: thấy đen hay thấy trắng |
| Echolocation | Định vị bằng tiếng vọng | Như con dơi: kêu một tiếng, nghe vọng lại để biết xa gần |
| Wait Until / Repeat until | Chờ đến khi / Lặp đến khi | Làm đi làm lại cho tới khi điều kiện đúng |
| Boundary Violation | Vi phạm biên | Robot chạm hoặc vượt đường viền không được phép |
| Forensic Run Analysis | Bảng xem lại lượt chạy | Bảng ghi lại lượt chạy thử để tìm chỗ lỗi |
| Bonus point | Điểm thưởng | Điểm cộng thêm, ở bài này là 40 điểm khi về đúng chỗ |
| Progress to Perfection | Thanh tiến độ điểm | Thanh cho biết đã đạt bao nhiêu trên điểm tối đa |
| Zone | Khu | Một ô phố trên sa bàn, có một chữ cái |

Lưu ý: bản đề xuất của khâu bóc tách dịch Containment là "Ô khoanh vùng" và CRL là "Phòng Cứu Hộ". Giáo trình tổng §5.4 quy định **Khu cách ly** và **Phòng Thí Nghiệm (CRL)**, nên bài này dùng hai từ đó.

## Khối lệnh dùng trong bài
Nhãn Việt lấy từ giáo trình tổng §5.5 và từ bản dựng tiếng Việt của chương trình mẫu.

| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `Leanbot.whenStarted` | Leanbot bắt đầu hoạt động | Chỗ bắt đầu chương trình chính |
| `LbMission.beginByTeacher_end` | Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B ... Nhiệm vụ: Kết thúc | Bao cả nhiệm vụ; robot chờ bé chạm hai nút TB1A và TB1B rồi mới chạy |
| `LbIRLine.setThreshold` | Cảm biến vạch: Đặt ngưỡng 2T 69, 0T 78, 1P 106, 3P 70 | Cho bốn mắt bốn con số ngưỡng để phân biệt đen và trắng |
| `LbIRLine.read` | Cảm biến vạch: Đọc cảm biến | Bốn mắt nhìn sàn một lần |
| `LbIRLine.value` | Cảm biến vạch: Giá trị 4 mắt (2T, 0T, 1P, 3P) | Con số cho biết mắt nào đang thấy đen |
| `LbIRLine.displayOnRGB` | Cảm biến vạch: Hiện lên đèn LED màu ... | Đèn LED sáng xanh lá khi đang bám vạch |
| `controls_switch` | Chọn theo (line) ... thì làm | Mỗi giá trị `line` chạy một kiểu hai bánh |
| `LbMotion.run` | Di chuyển: Chạy với vận tốc Trái ? Phải ? bước/giây | Đặt tốc độ riêng cho từng bánh |
| `LbMotion.waitDistanceMm` | Di chuyển: Chạy đoạn đường ? mm | Chờ cho tới khi đi đủ quãng đường |
| `LbMotion.waitRotationDeg` | Di chuyển: Rẽ góc ? độ | Chờ cho tới khi xoay đủ góc |
| `LbMotion.stop` | Di chuyển: Dừng | Dừng hai bánh |
| `LbMotion.approxDistance` | Di chuyển: Đường đã đi, tính bằng mm | Robot nhớ đã đi bao xa (sinh `LbMotion.getDistanceMm()`) |
| `procedures_defnoreturn` / `procedures_callnoreturn` | to ... / tên hàm | Định nghĩa một hàm / gọi hàm đó |
| `controls_whileUntil` | Lặp khi ... thì làm | Làm đi làm lại khi điều kiện còn đúng |
| `controls_repeat_ext` | Lặp N lần | Làm đủ N lần |
| `vars_initialize_local_auto` | Tạo biến tạm | Hộp nhớ chỉ dùng trong một hàm |
| `Leanbot.commentLine` | Dòng ghi chú | Đặt tên cho một đoạn, robot không chạy dòng này |

Mâu thuẫn nhỏ về nhãn: giáo trình tổng §5.5 ghi `waitDistanceMm` là "Chạy đoạn đường ? **cm**", nhưng khối trong chương trình mẫu hiện "Chạy đoạn đường ? **mm**" và code là `waitDistanceMm`. Bài này theo chương trình mẫu: **mm**. Thầy nhắc bé nhìn kỹ đơn vị.

## Dạy thế nào

### Mở bài (5 phút)
1. Thầy kể ba câu: "Năm 2050, thành phố đầy khói, người không vào được. Robot đi dọn thay. Hôm nay robot của con phải đẩy khối ô nhiễm vào khu cách ly."
2. Hỏi: "Muốn robot tự đi tới đúng khu phố, nó cần nhìn thấy gì?" (gợi ý: vạch đen dưới sàn, như Bài 4).
3. Thầy nói rõ: bài hôm nay là bài thi. Mỗi con số trong chương trình đều có lý do, và con sẽ tìm ra lý do đó.

### Giảng (35 phút)
**Bước 1 — Luật chấm điểm (10 phút).** Thầy vẽ sa bàn 3×3 lên bảng: hàng trên A, C, F; hàng giữa B, E, H; hàng dưới D, G và CRL ở góc dưới bên phải. Ghi thêm kho S1, S3, S5 ở cạnh dưới và S2, S4, S6 ở cạnh phải.
- Thầy hỏi: "Robot xuất phát ở đâu?" Bé trả lời: CRL. Thầy cho xem hình tick và X trên slide: robot phải nằm **hoàn toàn** trong CRL, không bộ phận nào đè viền đen.
- Thầy ghi lên bảng: khối ô nhiễm **+45** nếu *bất kỳ phần nào* của khối chạm hoặc đè lên khu cách ly. Hỏi: "Khối nằm sát cạnh nhưng không chạm thì sao?" (Không tính.)
- Thầy ghi: về CRL, **cả hai bánh** nằm hoàn toàn trong CRL lúc robot dừng thì được **+40**.
- Cho bé tính ví dụ trên slide: khoanh vùng 45 + trung hòa 320 (2 cặp × 160) + phân tích 100 + về CRL 0 = **465** trên tối đa **505**. Hỏi: "505 là 465 cộng thêm gì?" (cộng 40 điểm thưởng về CRL.)
- Nhắc: đụng nguồn ô nhiễm là bị phạt hoặc hỏng nhiệm vụ (câu 8 của bài kiểm tra).

**Bước 2 — Robot nhìn vạch bằng bốn mắt (7 phút).** Thầy ôn Bài 4.
- Thầy lật robot lên, chỉ bốn mắt dưới bụng. Hỏi: "Mỗi mắt trả lời mấy kiểu?" (hai kiểu: đen hoặc trắng.)
- Thầy đọc ba luật trên slide: mắt trái thấy đen thì quẹo trái; mắt phải thấy đen thì quẹo phải; cả hai thấy trắng thì đi thẳng.
- Thầy chỉ dòng `LbIRLine.setThreshold(69, 78, 106, 70)` ở mục Chương trình mẫu. Hỏi: "Vì sao mỗi mắt một con số?" Gợi ý: mỗi mắt nhìn ánh sáng hơi khác nhau. Nói thật: slide **không giải thích** các số này; sân khác, ánh sáng khác thì có thể phải chỉnh lại.
- Chỉ nói với bé: cái mà robot đọc ra là một con số `line`. Số 15 là cả bốn mắt cùng thấy đen, tức là robot đang ở **ngã tư**. Không bắt bé học thuộc các số khác; cho bé nhìn bảng ở mục Chương trình mẫu.

**Bước 3 — Bốn hàm nhỏ (8 phút).** Thầy mở trình soạn khối, cho bé thấy bốn hàm, từ nhỏ đến lớn:
1. `runFollowLine`: bám vạch **một nhịp**, đọc mắt rồi chỉnh hai bánh.
2. `followLineUntilJunction`: bám vạch **cho tới khi** `line` bằng 15.
3. `followLineDistance(d)`: bám vạch **thêm d mm**.
4. `followLineMultipleJunctions(n)`: lặp n lần "đi 30 mm rồi bám vạch tới ngã tư".

Hỏi: "Vì sao phải đi 30 mm trước rồi mới tìm ngã tư?" Gợi ý: nếu không, robot vẫn đang đứng trên ngã tư cũ, `line` vẫn bằng 15, nó sẽ tưởng đã tới ngã tư mới. (Đây là cách hiểu từ đọc code; slide không nói.)

Rồi `goToJunction`: bám tới ngã tư, đi thêm 20 mm, dừng. Hỏi: "Vì sao đi thêm 20 mm?" Nói thật: slide không giải thích; có thể để robot đứng giữa ngã tư (suy đoán), nên nếu robot lệch thì bé thử đổi số này.

**Bước 4 — Quay và đi thẳng (5 phút).** Thầy cho bé xem `Forward` và `Rotate`. Hỏi: "`Rotate(2000, 60)` thì hai bánh quay thế nào?" Bé tự đọc: bánh trái 2000, bánh phải -2000, hai bánh quay ngược nhau nên robot xoay **tại chỗ**. Bé hay nhầm tốc độ âm là "lùi". Thầy làm mẫu trên robot thật: `Rotate` âm và dương, bé nhìn hướng xoay.

**Bước 5 — Đọc cả chương trình (5 phút).** Xem mục Chương trình mẫu. Thầy chia hai đoạn theo hai dòng ghi chú trong chương trình: `FromCRLtoB1` (đi từ CRL tới B1) và `PushPollutionB1` (đẩy khối ở B1). Bé tô màu hai đoạn trên bản in.

### Bé tự làm (45 phút)
1. **Chạy trên Bản Sao Số (15 phút).** Dán chương trình mẫu vào trình soạn khối (hoặc mở từ PGit), chạy trong Bản Sao Số. Trước mỗi lượt chạy **đặt lại môi trường nhiệm vụ**. Sau lượt chạy, mở bảng xem lại lượt chạy, tìm dòng "Boundary Violation" nếu có. Sau đó thầy hỏi: "Robot đã tới đâu? Khối đã chạm khu cách ly chưa?"
2. **Đổi một con số (10 phút).** Mỗi bé chọn **một** tham số (ví dụ `Forward(2000, 28)` thành 40) và **ghi dự đoán trước** khi chạy. Chạy xong ghi kết quả thật. Chỉnh từng tham số một, như Bài 11.
3. **Chạy trên robot thật (15 phút).** Đặt robot trong CRL, không đè viền đen. Nạp code, chạm TB1A và TB1B cùng lúc. Với bé mới tập: **hạ tốc độ xuống 30–50%** cho ổn định (xem mâu thuẫn ở mục "Ghi chú về bản gốc").
4. **Làm phiếu ôn luyện (5 phút còn lại)**: bài 1 đến bài 4, phần còn lại làm ở nhà.

### Chốt bài (5 phút)
- Thầy hỏi ba câu, bé giơ tay: "Khối chạm một phần vào khu cách ly được bao nhiêu điểm?" (45) "Cả hai bánh trong CRL được thêm bao nhiêu?" (40) "Trước khi chạy lại trên Bản Sao Số, con làm gì?" (đặt lại môi trường.)
- Mỗi bé nói một con số mà con đã đổi và robot làm gì khác đi.
- Dặn: bài sau (Bài 14) có thêm tay gắp.

## Chương trình mẫu
Nguồn: `Containment.bduino` (chương trình chính thức). Robot xuất phát ở CRL, đi tới khu B1 và đẩy khối ô nhiễm vào khu cách ly. Số liệu dưới đây khớp với file `.bduino` và `.ino`.

### Khối chính (`setup` và `loop`)

Khối tiếng Việt:
```
Leanbot bắt đầu hoạt động
  Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B
  Cảm biến vạch: Đặt ngưỡng  2T 69  0T 78  1P 106  3P 70
  # FromCRLtoB1
  Forward        tốc độ 2000   quãng đường 110 mm
  Rotate         tốc độ -2000  góc 23 độ
  followLineMultipleJunctions   số ngã tư 4
  goToJunction
  Rotate         tốc độ 2000   góc 60 độ
  followLineMultipleJunctions   số ngã tư 1
  goToJunction
  # PushPollutionB1
  Rotate         tốc độ 2000   góc 15 độ
  Forward        tốc độ 2000   quãng đường 28 mm
  Rotate         tốc độ 500    góc 50 độ
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

  // FromCRLtoB1
  Forward(2000, 110);             // tiến 110 mm ra khỏi CRL
  Rotate((-2000), 23);            // xoay 23 độ, tốc độ âm
  followLineMultipleJunctions(4); // bám vạch qua 4 ngã tư
  goToJunction();                 // bám tới ngã tư, đi thêm 20 mm, dừng
  Rotate(2000, 60);               // xoay 60 độ về khu đích
  followLineMultipleJunctions(1);
  goToJunction();

  // PushPollutionB1
  Rotate(2000, 15);               // xoay 15 độ nhắm vào khối
  Forward(2000, 28);              // tiến 28 mm đẩy khối
  Rotate(500, 50);                // xoay chậm 50 độ
  LbMission.end();
}
```

Giải thích từng khối cho bé:

| Khối | Bé nghe thầy nói |
|---|---|
| `LbMission.begin(TB1A + TB1B)` | "Robot đứng yên chờ con chạm cùng lúc hai nút. Như tiếng còi xuất phát." |
| `Forward(2000, 110)` | "Tiến thẳng 110 mm cho ra khỏi phòng CRL." |
| `Rotate(-2000, 23)` | "Xoay tại chỗ 23 độ về phía ngược với tốc độ dương, để mũi robot hướng vào vạch." |
| `followLineMultipleJunctions(4)` | "Bám vạch, đếm 4 ngã tư." |
| `goToJunction()` | "Bám tới ngã tư, đi thêm 20 mm rồi dừng." |
| `Rotate(2000, 60)` | "Xoay 60 độ sang hướng khu đích." |
| `followLineMultipleJunctions(1)` rồi `goToJunction()` | "Thêm một ngã tư nữa, rồi dừng." |
| `Rotate(2000, 15)` | "Xoay 15 độ, nhắm vào khối ô nhiễm." |
| `Forward(2000, 28)` | "Tiến 28 mm, đẩy khối vào khu cách ly." |
| `Rotate(500, 50)` | "Xoay chậm 50 độ." Slide không nói để làm gì; thầy nói thật là chưa biết, bé thử bỏ dòng này xem robot khác đi thế nào. |
| `LbMission.end()` | "Kết thúc nhiệm vụ." |

Chương trình **không về CRL** sau khi đẩy khối, nên chạy đúng cũng chưa chắc có 40 điểm thưởng. Chương trình **không dùng** cảm biến siêu âm, dù slide có nhắc.

### Các hàm do bài định nghĩa

Khối tiếng Việt (nhãn theo bản dựng của chương trình mẫu) và code C++:

**`runFollowLine`: bám vạch một nhịp**
```
to runFollowLine
  Cảm biến vạch: Đọc cảm biến
  gán line = Cảm biến vạch: Giá trị 4 mắt (2T, 0T, 1P, 3P)
  Cảm biến vạch: Hiện lên đèn LED  màu xanh lá (#00ff00)
  Chọn theo (line):
    trường hợp 4:   Chạy với vận tốc Trái 1000  Phải 2000
    trường hợp 2:   Chạy với vận tốc Trái 2000  Phải 1000
    trường hợp 12:  Chạy với vận tốc Trái 200   Phải 2000
    trường hợp 3:   Chạy với vận tốc Trái 2000  Phải 200
    trường hợp 8:   Chạy với vận tốc Trái -1000 Phải 1000
    trường hợp 1:   Chạy với vận tốc Trái 1000  Phải -1000
    còn lại:        Chạy với vận tốc Trái 2000  Phải 2000
```
```cpp
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
```

| `line` | Bánh trái | Bánh phải | Robot làm gì (suy ra từ tốc độ hai bánh) |
|---|---|---|---|
| 4 | 1000 | 2000 | Quẹo trái nhẹ |
| 2 | 2000 | 1000 | Quẹo phải nhẹ |
| 12 | 200 | 2000 | Quẹo trái gấp |
| 3 | 2000 | 200 | Quẹo phải gấp |
| 8 | -1000 | 1000 | Xoay tại chỗ sang trái |
| 1 | 1000 | -1000 | Xoay tại chỗ sang phải |
| khác | 2000 | 2000 | Đi thẳng |

Slide không giải thích bảng này. Mắt nào ứng với số nào, slide cũng không nói; chỉ biết 15 là cả bốn mắt thấy đen (ngã tư). Hướng quẹo ở cột cuối là suy ra từ việc bánh nào quay nhanh hơn.

**`followLineUntilJunction`, `followLineDistance`, `goToJunction`, `followLineMultipleJunctions`**
```
to followLineUntilJunction
  Lặp khi (line ≠ 15):  runFollowLine

to followLineDistance  (distanceMm)
  tạo biến tạm targetMm = distanceMm + Quãng đường đã đi (mm)
  Lặp khi (Quãng đường đã đi (mm) < targetMm):  runFollowLine

to goToJunction
  followLineUntilJunction
  followLineDistance  20
  Di chuyển: Dừng

to followLineMultipleJunctions  (junctionCount)
  Lặp junctionCount lần:
    followLineDistance  30
    followLineUntilJunction
```
```cpp
void followLineUntilJunction() {
  while ((line != 15)) {
    runFollowLine();
  }
}

void followLineDistance(int distanceMm) {
  auto targetMm = distanceMm + LbMotion.getDistanceMm();
  while ((LbMotion.getDistanceMm() < targetMm)) {
    runFollowLine();
  }
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
```

**`Forward`, `Backward`, `Rotate`**
```
to Forward (speed, distanceMm)
  Chạy với vận tốc Trái speed  Phải speed
  Chạy đoạn đường distanceMm mm
  Di chuyển: Dừng

to Backward (speed, distanceMm)          # có định nghĩa, loop() không gọi
  Chạy với vận tốc Trái (-1 × speed)  Phải (-1 × speed)
  Chạy đoạn đường distanceMm mm
  Di chuyển: Dừng

to Rotate (speed, degrees)
  Chạy với vận tốc Trái speed  Phải (-1 × speed)
  Rẽ góc degrees độ
  Di chuyển: Dừng
```
```cpp
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

Toàn bộ chương trình bắt đầu bằng `#include <Leanbot.h>`.

**Cách đếm ngã tư (đọc theo code).** Trong `followLineMultipleJunctions(n)`, mỗi vòng đi 30 mm rồi bám vạch cho tới khi `line` bằng 15; sau n vòng robot vừa chạm ngã tư thứ n. Rồi `goToJunction()` thấy `line` vẫn bằng 15 nên không đợi ngã tư mới, chỉ đi thêm 20 mm và dừng. Theo cách đọc này, `followLineMultipleJunctions(n)` + `goToJunction()` dừng ở **ngã tư thứ n**. File bóc tách lại viết là dừng ở "ngã tư kế tiếp" (tức n+1). Hai cách đọc khác nhau; **chưa chạy thử trên robot hay Bản Sao Số để phân xử**. Thầy nên chạy thử và cho bé quan sát trước khi dạy chắc.

## Phiếu ôn luyện

**1. Đọc đoán kết quả (dễ).**
Đề: Chương trình chạy `Forward(2000, 110);` rồi `Rotate((-2000), 23);`. Robot tiến bao nhiêu mm? Xoay bao nhiêu độ? Lúc xoay, hai bánh quay thế nào?
**Đáp án:** Tiến 110 mm, xoay 23 độ. Lúc xoay bánh trái quay -2000, bánh phải quay +2000, hai bánh quay ngược chiều nên robot xoay tại chỗ chứ không lùi.

**2. Điền số: tính điểm (dễ).**
Đề: Một lượt thi có 1 khối khoanh vùng, 1 khối phân tích, và robot dừng với cả hai bánh trong CRL. Không có cặp trung hòa. Tổng bao nhiêu điểm? (Điểm: khoanh vùng 45, phân tích 100, về CRL 40.)
**Đáp án:** 45 + 100 + 40 = **185 điểm**.

**3. Đọc đoán kết quả: bảng `line` (vừa).**
Đề: Trong `runFollowLine`, cảm biến đọc ra `line = 12`. Hai bánh chạy tốc độ nào? Robot quẹo thế nào? Nếu `line = 15` thì sao?
**Đáp án:** Bánh trái 200, bánh phải 2000, bánh phải nhanh hơn nhiều nên robot quẹo trái gấp. Số 15 không có `case` riêng nên rơi vào nhánh còn lại (hai bánh 2000, đi thẳng); nhưng `followLineUntilJunction` thấy `line` bằng 15 thì thoát vòng lặp, vì đó là ngã tư.

**4. Tìm lỗi (vừa).**
Đề: Bạn An viết hàm này để robot bám vạch tới ngã tư, nhưng chạy xong robot không nhúc nhích gì. Sai ở đâu? Sửa thế nào?
```cpp
void followLineUntilJunction() {
  while ((line == 15)) {
    runFollowLine();
  }
}
```
**Đáp án:** Điều kiện bị ngược. Vòng lặp chỉ chạy khi `line` bằng 15 (đang ở ngã tư), mà lúc xuất phát `line` thường chưa bằng 15, nên vòng lặp bị bỏ qua ngay. Sửa thành `while ((line != 15))`: bám vạch **chừng nào chưa** tới ngã tư.

**5. Sắp thứ tự (vừa).**
Đề: Các bước của chương trình mẫu đã bị xáo trộn. Xếp lại cho đúng: (a) `Rotate(2000, 15)` (b) `LbMission.begin(TB1A + TB1B)` (c) `Forward(2000, 110)` (d) `goToJunction()` lần cuối (e) `Rotate(-2000, 23)` (f) `followLineMultipleJunctions(4)` (g) `Forward(2000, 28)` (h) `LbMission.end()` (i) `Rotate(2000, 60)` (k) `followLineMultipleJunctions(1)` (l) `goToJunction()` lần đầu (m) `Rotate(500, 50)`.
**Đáp án:** b, c, e, f, l, i, k, d, a, g, m, h. Tức: chờ chạm nút; tiến 110; xoay -2000 23 độ; qua 4 ngã tư; goToJunction; xoay 60; qua 1 ngã tư; goToJunction; xoay 15; tiến 28; xoay 500 50 độ; kết thúc.

**6. Điền số: tốc độ (khó hơn).**
Đề: Tốc độ bánh đi từ -2000 đến 2000 bước/giây. Bé mới tập nên dùng 30–50% tốc độ. Hai mốc đó là khoảng bao nhiêu bước/giây? Chương trình mẫu dùng tốc độ 2000 khi đi thẳng. Đó là bao nhiêu phần trăm?
**Đáp án:** 30% của 2000 là 600, 50% là 1000, vậy khoảng **600 đến 1000 bước/giây** (tính từ giáo trình tổng, slide không cho số bước/giây). Tốc độ 2000 là **100%**, tức chương trình mẫu không chạy theo lời khuyên 30–50%.

**7. Dịch nhãn (dễ).**
Đề: Dịch sang tiếng Việt: (a) `Mission: End` (b) `Motion: Stop` (c) `IRLine: Read sensors` (d) `Motion: Run with velocity Left ? Right ?`. Rồi dịch ngược: (e) "Di chuyển: Rẽ góc ? độ" sang tiếng Anh.
**Đáp án:** (a) Nhiệm vụ: Kết thúc (b) Di chuyển: Dừng (c) Cảm biến vạch: Đọc cảm biến (d) Di chuyển: Chạy với vận tốc Trái ? Phải ? (e) `Motion: Turn angle ? degrees` (trong giáo trình tổng ghi nhãn gốc là "Motion: Keep turning for ? degrees"; cả hai cách ghi đều là khối `LbMotion.waitRotationDeg`).

**8. Làm trên máy: đi thẳng (vừa).**
Đề: Ghép khối trong trình soạn khối sao cho cột code bên phải ra đúng đoạn này:
```cpp
LbMotion.runLR(1000, 1000);
LbMotion.waitDistanceMm(50);
LbMotion.stopAndWait();
```
**Đáp án:** Ba khối nối nhau: "Di chuyển: Chạy với vận tốc Trái 1000 Phải 1000", "Di chuyển: Chạy đoạn đường 50 mm", "Di chuyển: Dừng". Code khớp thì đúng.

**9. Làm trên máy: xoay tại chỗ (khó).**
Đề: Ghép khối để ra đúng đoạn này, rồi cho biết robot làm gì:
```cpp
LbMotion.runLR(600, -600);
LbMotion.waitRotationDeg(90);
LbMotion.stopAndWait();
```
**Đáp án:** "Chạy với vận tốc Trái 600 Phải -600", "Rẽ góc 90 độ", "Dừng". Hai bánh quay ngược chiều nên robot xoay tại chỗ 90 độ rồi dừng. Tốc độ 600 là 30% của 2000.

**10. Đúng hay sai: Bản Sao Số (khó).**
Đề: Chạy xong trên Bản Sao Số thấy dòng "Boundary Violation". Việc đầu tiên cần làm trước khi chạy lại là gì?
**Đáp án:** Đặt lại môi trường nhiệm vụ trong Bản Sao Số, rồi mới chạy code mới.

Phiếu này có đủ cả sáu dạng: đọc đoán (bài 1, 3), tìm lỗi (4), sắp thứ tự (5), điền số (2, 6), dịch nhãn (7), làm trên máy (8, 9), cộng thêm bài 10.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc có **10 câu** (H5P trong trang Check your Understanding; khung trắng trong ảnh slide, nội dung lấy từ phân tích). Đáp án đúng ghi đầu tiên.

1. What is the primary goal of Mission 1? / Mục tiêu chính của Nhiệm vụ 1 là gì?
   - Đúng: To navigate to and stop the spread of pollution. / Đi tới và ngăn ô nhiễm lan rộng. Sai: To pick up the source. / Nhặt nguồn ô nhiễm lên. To race as fast as possible to the finish line. / Đua nhanh nhất tới đích.
2. Which sensor is used to follow the black path? / Cảm biến nào dùng để đi theo đường đen?
   - Đúng: Color/IR Sensor. / Cảm biến màu/hồng ngoại. Sai: Touch Sensor. / Cảm biến chạm. Ultrasonic. / Siêu âm.
3. How does an Ultrasonic sensor measure distance? / Cảm biến siêu âm đo khoảng cách bằng gì?
   - Đúng: Using sound waves. / Bằng sóng âm. Sai: Using magnets. / Nam châm. Using light. / Ánh sáng.
4. In the Digital Twin, what should you do before running code? / Trong Bản Sao Số, phải làm gì trước khi chạy code?
   - Đúng: Reset the mission environment. / Đặt lại môi trường nhiệm vụ. Sai: Delete the robot. / Xóa robot. Change the robot's color. / Đổi màu robot.
5. If the robot turns left when it sees white, what happens? / Nếu robot rẽ trái khi thấy màu trắng thì sao?
   - Đúng: It will likely lose the line. / Nhiều khả năng sẽ mất vạch. Sai: It spins in circles. / Quay vòng tròn. It stays on the line. / Vẫn ở trên vạch.
6. Which SDG is most related to cleaning up pollution? / Mục tiêu phát triển bền vững (SDG) nào liên quan nhất tới dọn ô nhiễm?
   - Đúng: SDG 14 (Life Below Water). / SDG 14 (Sự sống dưới nước). Sai: SDG 1 (No Poverty). / Không còn nghèo đói. SDG 4 (Quality Education). / Giáo dục chất lượng.
7. What speed is recommended for beginners in Mission 1? / Người mới nên dùng tốc độ nào?
   - Đúng: 30-50%. Sai: 0%. 100%.
8. What happens if the robot hits the pollution source? / Điều gì xảy ra nếu robot đụng nguồn ô nhiễm?
   - Đúng: You receive a penalty or fail the mission. / Bị phạt hoặc hỏng nhiệm vụ. Sai: The robot explodes. / Robot nổ. You win extra points. / Được thêm điểm.
9. Why do we use a Digital Twin? / Vì sao dùng Bản Sao Số?
   - Đúng: To test code safely and quickly. / Để thử code an toàn và nhanh. Sai: Because we don't have a real robot. / Vì không có robot thật. To play games. / Để chơi game.
10. The "Wait Until" block is used for... / Khối "Wait Until" dùng để...
    - Đúng: Waiting for a specific condition (like distance) to be met. / Chờ cho một điều kiện (như khoảng cách) đúng. Sai: Making the robot sleep. / Cho robot ngủ. Slowing down the wheels. / Làm bánh xe chậm lại.

Câu 6 (SDG) là kiến thức ngoài slide; thầy nói qua, không bắt bé học thuộc.

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Tưởng tốc độ âm là lùi | Bé nói `Rotate(-2000, 23)` là "đi lùi" | Làm mẫu trên robot thật: hai bánh quay ngược chiều thì robot xoay tại chỗ. Vẽ mũi tên hai bánh |
| Nhầm số mã `line` | Bé cố học thuộc 4, 2, 12, 3, 8, 1, 15 | Cho bé nhìn bảng "bánh nào nhanh hơn", chỉ nhớ riêng số 15 là ngã tư |
| Đếm ngã tư lệch một | Robot dừng sớm hoặc muộn một ngã tư | Cho bé chạy từng hàm riêng trên Bản Sao Số; đếm to mỗi lần đèn LED đổi. Xem mục "Cách đếm ngã tư" |
| Lẫn lý thuyết siêu âm với code | Bé tìm khối siêu âm trong chương trình mẫu | Nói rõ: slide nhắc siêu âm nhưng chương trình mẫu chỉ dùng cảm biến vạch |
| Đặt robot sai chỗ | Robot đè viền đen CRL khi xuất phát | Dùng hình tick và X của slide; thầy kiểm từng robot trước khi bấm chạy |
| Nhớ nhiều con số điểm | Nhầm 45, 160, 100, 40, 505 | Viết bảng điểm lên bảng; dùng ví dụ 465/505 |
| Nhầm "chạm" và "sát cạnh" | Bé cho rằng khối nằm sát khu cách ly cũng tính | Cho xem hình X trên slide: sát cạnh mà không chạm thì không tính |
| Chữ Anh quá nhiều | Bé đứng yên khi đọc slide | Dùng bảng thuật ngữ của bài; chỉ vào hình trước, đọc chữ sau |
| Robot trượt khỏi vạch ở chỗ quẹo | Robot chạy ra ngoài ở khúc cua | Hạ tốc độ về 30–50%, thử trên Bản Sao Số trước |

## Nộp bài trên Plearn
Trang khóa học có hai mục liên quan tới bài này:
1. **"Lesson 13: AI ROC 2026 Mission 1 The Containment Protocol (In-Class)"**: hoạt động H5P (link ở đầu bài). Bé làm hết slide và 10 câu hỏi kiểm tra.
2. **"Mission 1 - The Containment Protocol"**: mục nộp bài (Assignment). Theo trang khóa học, mục này **bị khóa cho tới khi hoạt động Lesson 13 được đánh dấu hoàn thành**, nên bé phải xong mục 1 trước.

**Chưa lấy được:** nội dung đề của mục nộp bài (nộp file nào, nộp ảnh hay đường dẫn, hạn nộp). Khâu bóc tách mới đọc 26 slide và danh sách hoạt động, chưa mở trang nộp bài. Thầy đăng nhập PLearn, mở mục "Mission 1 - The Containment Protocol", đọc đề và ghi lại vào đây. Đừng để bé đoán.

Việc thầy nên làm trước khi bé nộp, đúng với tinh thần bài: bé đã chạy chương trình trên Bản Sao Số ít nhất một lượt không có "Boundary Violation", và robot thật đã xuất phát đúng luật (nằm gọn trong CRL, không đè viền đen).

## Ghi chú về bản gốc
- **Slide nhấn cảm biến siêu âm, chương trình mẫu không dùng.** Mục tiêu học tập và slide "How to solve" nói về "Wait Until, khoảng cách < 10 cm", nhưng `Containment.bduino` chỉ dùng cảm biến vạch, đếm ngã tư và quãng đường cố định.
- **Tốc độ.** Slide khuyên bé mới dùng 30–50% (khớp giáo trình tổng §6), nhưng chương trình mẫu dùng tốc độ 2000, tức 100% của khoảng −2000 … 2000.
- **Lỗi chép trên slide:** Zone B có cùng mô tả với Zone A; CRL có cùng mô tả với Zone E; Zone H ghi "Start zone" trong khi robot xuất phát ở CRL; chữ "Activites" thiếu chữ i.
- **Số điểm.** Slide thử thách ghi mục tiêu "550/665", không khớp với 505 ở ví dụ chấm điểm. Slide không giải thích; có thể là hạng khác. Bài này dùng 505.
- **Cách đếm ngã tư.** Xem mục "Cách đếm ngã tư" ở Chương trình mẫu: đọc code thì cặp `followLineMultipleJunctions(n)` + `goToJunction()` dừng ở ngã tư thứ n, còn file bóc tách viết "ngã tư kế tiếp". Chưa kiểm trên máy.
- **Nhãn khối.** Giáo trình tổng ghi "Chạy đoạn đường ? cm", khối thật trong chương trình mẫu ghi mm.
- **Slide Learn 08** có chữ quá nhỏ; số liệu lấy từ file `.bduino`, các số đọc được trên ảnh (69, 78, 106, 70) khớp với file.
- **Slide không giải thích** các số: ngưỡng 69/78/106/70, góc 23°/60°/15°/50°, 28 mm, 20 mm, 30 mm, tốc độ 500. Bài này không bịa lý do.
- **Digital Twin:** slide không ghi URL; mở từ bài học trên PLearn.
