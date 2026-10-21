# Bài 16 — Nhiệm vụ tổng hợp

> Bài gốc: *The Ultimate Environmental Challenge* (Module 9, "AI ROC 2026 — The Ultimate Environmental Challenge") · 30 slide · 3 chương (Engage 11 · Learn 13 · Resolve 6) · <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=63009>

Mã mẫu chính thức: `git.pythaverse.space/ptvairoc/Synapsecity_Primary/blob/master/Fullmision`. Video bài: <https://youtu.be/s7P5Aq1XXgE>.

## Bé học xong thì làm được gì
- Cộng được điểm của một lượt chạy: Khoanh vùng **45**, Trung hòa **160** mỗi cặp, Phân tích **100**, về CRL **40**.
- Chỉ ra trong chương trình `Fullmision` 11 chặng và nói mỗi chặng gồm những lệnh nào.
- Giải thích ba tầng của chương trình (dò vạch, chạy thô, nhiệm vụ) và thứ tự các hàm được gọi.
- Bấm giờ từng chặng, tính điểm trên mỗi giây, rồi chọn nhiệm vụ nào làm trước và nhiệm vụ nào bỏ nếu thiếu giờ.
- Chạy trọn một lượt trong **2 phút**, hai lượt liên tiếp ra cùng kết quả.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Robot Leanbot đã sạc pin, tay gắp đã cân chỉnh | Nhớ bài GS1 |
| Sa bàn AIROC 4 ft × 4 ft (1,2192 m) đủ CRL, khu A–H, kho S1–S6 | Không có sa bàn thật thì làm bằng băng keo đen, nhưng quãng đường phải đúng tỉ lệ nếu muốn đo giờ |
| Khối trung hòa (có sọc trắng) và khối ô nhiễm | Kích thước khối theo slide: dài 1,5 × rộng 2,5 × cao 7,5 cm. Đặt khối trung hòa ở S3 (như mẫu); vị trí kho do đội tự chọn |
| Trình soạn khối lệnh **có bản vá tiếng Việt** | `tools/lbeditor-vi/` |
| Mã mẫu `Fullmision` dán sẵn vào trình soạn khối | Slide Learn 09: bấm biểu tượng để chép mã mẫu, dán vào Trình soạn khối lệnh |
| Đồng hồ bấm giờ (mỗi nhóm một cái) | Dùng ở bước 6 và phần bé tự làm |
| 4 thẻ điểm: 45, 160, 100, 40 | Thầy tự làm |
| Phiếu bảng thời gian 11 chặng | Mẫu ở Phiếu ôn luyện, bài 9 |
| Phiếu ôn luyện Bài 13, 14, 15 | Để bé đọc lại từng nhiệm vụ |

## Thuật ngữ của bài
Các từ đã có ở §5 giáo trình tổng (Nhiệm vụ, Điểm, Phạt, Khu cách ly, Khối trung hòa, Khối ô nhiễm, Kho S1–S6, CRL, Hàm, Ngưỡng, Cân chỉnh, Chạy thử, Sửa lỗi…) không chép lại.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Ultimate Mission / Full Mission | Nhiệm vụ tổng hợp | Làm cả ba nhiệm vụ trong một lượt |
| Containment | Khoanh vùng | Nhiệm vụ 1. Đẩy khối ô nhiễm vào Khu cách ly |
| Neutralization | Trung hòa | Nhiệm vụ 2. Mang khối trung hòa tới khối ô nhiễm cùng màu, theo cặp |
| Analysis | Phân tích | Nhiệm vụ 3. Mang khối ô nhiễm về CRL |
| Return bonus | Điểm thưởng về đích | +40 nếu cả hai bánh nằm trọn trong CRL khi robot dừng |
| Perfection | Lượt hoàn hảo | Lượt được điểm cao nhất (xem Ghi chú về bản gốc, số điểm chưa thống nhất) |
| Junction | Ngã tư | Chỗ cả 4 mắt cảm biến thấy đen |
| Centering | Căn giữa | Đi thêm 20 mm cho tâm quay nằm giữa ngã tư |
| Junction counting | Đếm ngã tư | Đi qua một số ngã tư rồi mới dừng |
| Simultaneous start | Chạm hai nút cùng lúc để bắt đầu | TB1A và TB1B cùng được chạm |
| Sportsmanship | Tinh thần thể thao | Chơi đẹp, tôn trọng luật và bạn thi |
| Mystery block | Khối bí ẩn | Chỉ hạng Master có (+150). Hạng Creator không dùng |
| Code to Run → Code to Think | Từ "code để chạy" sang "code để nghĩ" | Robot không chỉ chạy theo lệnh mà còn biết nghĩ |
| Physical AI | AI trong robot thật | Robot tự nhìn, tự nghĩ, rồi tự làm việc ngoài đời |
| Project Atmos / Code Red | Dự án Atmos / Báo động đỏ | Chuyện kể năm 2050: không khí bẩn, robot đi làm sạch |

## Khối lệnh dùng trong bài
Tám hàm tự tạo và các khối nền giống hệt Bài 15 (đã đối chiếu `Analyst.ino` với `Fullmision.ino`, phần hàm trùng từng dòng). Chỉ khác ở khối `loop`.

| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `Leanbot.whenStarted` | Leanbot bắt đầu hoạt động | Chạy một lần khi bật |
| `LbMission.beginByTeacher_end` | Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B … Nhiệm vụ: Kết thúc | Bao toàn bộ nhiệm vụ |
| `LbIRLine.setThreshold` | Cảm biến vạch: Đặt ngưỡng 2T 69, 0T 78, 1P 106, 3P 70 | Đặt mức đen/trắng cho 4 mắt |
| `LbIRLine.read` / `LbIRLine.value` | Cảm biến vạch: Đọc cảm biến / Giá trị 4 mắt | Đọc rồi lấy con số `line` |
| `LbIRLine.displayOnRGB` | Cảm biến vạch: Hiện lên đèn LED màu | Báo mắt nào thấy đen |
| `controls_switch` | Chọn theo giá trị (Switch) | Chọn cách lái theo `line` |
| `LbMotion.run` | Di chuyển: Chạy với vận tốc Trái ? Phải ? bước/giây | Đặt tốc độ hai bánh |
| `LbMotion.waitDistanceMm` | Di chuyển: Chạy đoạn đường ? mm | Chờ đủ quãng đường |
| `LbMotion.waitRotationDeg` | Di chuyển: Rẽ góc ? độ | Chờ đủ góc |
| `LbMotion.stop` | Di chuyển: Dừng | Dừng hẳn |
| `LbMotion.approxDistance` | Di chuyển: Đường đã đi, tính bằng mm | Quãng đường đã đi |
| `LbGripper.moveTo` | Tay gắp: Xoay tới góc ? độ | Kẹp khối (góc 50° trong mẫu) |
| `LbGripper.open` | Tay gắp: Mở | Nhả khối |
| `Leanbot.commentLine` | Dòng ghi chú | Đặt tên chặng cho người đọc |
| `procedures_defnoreturn` / `procedures_callnoreturn` | Hàm (phép thuật): định nghĩa / gọi | Gói nhiều lệnh thành một |
| `controls_whileUntil`, `controls_repeat_ext` | Lặp khi …, Lặp N lần | Vòng lặp |
| `vars_initialize_local_auto` | Tạo biến tạm | Hộp nhớ dùng trong một hàm |

## Dạy thế nào
Buổi 18 theo lộ trình (§7 giáo trình tổng). Buổi 19 là chạy thử như thi thật. Dạy bằng khối tiếng Việt trước, đối chiếu nhãn tiếng Anh sau (§4).

### Mở bài (5 phút)
1. Thầy giơ 4 thẻ điểm: **45 – 160 – 100 – 40**. Hỏi: "Một lượt chỉ có 2 phút. Con muốn lấy thẻ nào trước?" Cho bé cãi nhau một lúc, đừng chốt vội.
2. Thầy nói: "Hôm nay con không học lệnh mới. Con học cách **ghép** ba nhiệm vụ đã học và **chọn** thứ tự làm."
3. Ghi bảng: **Ghép – Chọn – Bấm giờ**.

### Giảng (35 phút)
1. **Bảng điểm (5 phút).** Bốn khoản điểm:
   - Khoanh vùng: 45 mỗi khối ô nhiễm vào Khu cách ly.
   - Trung hòa: 160 mỗi **cặp** khối ô nhiễm và khối trung hòa.
   - Phân tích: 100 mỗi khối ô nhiễm đưa về CRL.
   - Về đích: 40 nếu cả hai bánh nằm trọn trong CRL khi robot dừng.
   - Thầy cho xem ví dụ slide Learn 06: 1 khối vàng (45) + 2 cặp (320) + 1 khối đỏ về CRL (100) = **465**; robot không ở CRL nên +0; nếu có thêm 40 thì tổng là **505**.
   - Thầy hỏi: "Con cộng lại được 465 không?" (45 + 320 + 100 = 465.)
2. **Luật bắt đầu và kết thúc (4 phút).**
   - Bắt đầu: robot nằm **trọn** trong CRL, không đè viền đen. Rồi chạm **cùng lúc TB1A và TB1B**. Một nút thôi là chưa chạy.
   - Kết thúc: robot dừng, hai bánh trọn trong CRL.
   - Tinh thần thể thao: mục tiêu của bài có ghi, nhưng slide không có nội dung chi tiết. Thầy chỉ nói ngắn: chơi đẹp, tôn trọng luật và bạn thi.
3. **Mở chương trình `Fullmision` (6 phút).** Thầy thu nhỏ khối `loop`, chỉ ba tầng:
   - Tầng 1, dò vạch: `runFollowLine` và các hàm dựa trên nó.
   - Tầng 2, chạy thô: `Forward`, `Backward`, `Rotate`.
   - Tầng 3, nhiệm vụ: khối `loop` với 11 chặng.
   - Thầy hỏi: "Trong khối `loop` có chỗ nào `nếu` hay `lặp` không?" (Không. Chỉ là một dãy lệnh thẳng. Robot đi theo đường **cố định**.)
4. **Đọc 11 chặng (8 phút).** Thầy phát 11 thẻ chặng (xem Chương trình mẫu). Mỗi nhóm xếp thẻ theo thứ tự và nói mỗi chặng "đi", "kẹp", "thả" hay "đẩy".
   - Thầy nhắc: tên chặng như `S3`, `E2`, `B1`, `F4` là tên đoạn đường trong mã mẫu. Chưa có slide nào giải thích từng cái, nên bé chỉ trên sa bàn theo thầy.
5. **Chọn nhiệm vụ nào làm trước (8 phút).** Đọc mục Kiến trúc chương trình. Cho bé điền cột "điểm ÷ giây" sau khi bấm giờ ở phần tự làm. Hôm nay thầy chỉ đưa ba câu hỏi:
   - Nhiệm vụ nào nhiều điểm nhất?
   - Nhiệm vụ nào kết thúc ở CRL?
   - Nếu chỉ còn ít giờ, bỏ nhiệm vụ nào?
6. **Quản lý 2 phút (4 phút).** Chương trình **không có đồng hồ**. Thời gian chỉ do tốc độ, đường đi và số lần dừng quyết định. Muốn biết robot mất bao lâu phải **bấm giờ bằng tay**. Thầy hỏi: "Tốc độ 2000 đã là nhanh nhất rồi. Vậy còn cách nào rút ngắn thời gian?" (Bớt đường đi, bớt lần dừng.)

### Bé tự làm (40 phút)
Hai bé một robot, một bé bấm giờ.
1. (15 phút) Nạp `Fullmision`, chạy một lượt. Bé bấm giờ từng chặng vào phiếu bảng thời gian, ghi xem robot lệch ở đâu.
2. (10 phút) Tính tổng giây và điểm/giây của từng nhiệm vụ (bài 8 và 9 của Phiếu ôn luyện).
3. (10 phút) Sửa **một** tham số rồi chạy lại (ví dụ giảm tốc độ một chặng hay chỉnh một góc). Mỗi lần chỉ đổi một thứ, như Bài 11. Ghi kết quả.
4. (5 phút) Chạy **hai lượt liên tiếp**. Ghi điểm và giây. Mốc đạt của khóa (§9): hai lượt ra cùng một kết quả.

### Chốt bài (5 phút)
- Mỗi nhóm đọc to tổng giây và tổng điểm, rồi nói chọn nhiệm vụ nào làm trước, vì sao.
- Thầy hỏi: "Khi chạy nhanh quá, chuyện gì dễ xảy ra?" (Mất vạch.)
- Dặn: buổi sau chạy như thi thật, hai lượt liên tiếp.

## Kiến trúc chương trình

### Các hàm và thứ tự gọi
Có **8 hàm tự tạo** cộng với `setup` và `loop`. Cây gọi:

```
setup
 ├─ Leanbot.begin
 └─ LbIRLine.setThreshold(69, 78, 106, 70)

loop
 ├─ LbMission.begin(TB1A + TB1B)
 ├─ Forward / Backward / Rotate        (tầng 2: chạy thô)
 │     └─ LbMotion.runLR, waitDistanceMm | waitRotationDeg, stopAndWait
 ├─ followLineMultipleJunctions(N)     (tầng 1)
 │     ├─ followLineDistance(30) ─── runFollowLine
 │     └─ followLineUntilJunction ── runFollowLine
 ├─ goToJunction                       (tầng 1)
 │     ├─ followLineUntilJunction ── runFollowLine
 │     ├─ followLineDistance(20) ─── runFollowLine
 │     └─ LbMotion.stopAndWait
 ├─ LbGripper.moveTo(50) / LbGripper.open
 └─ LbMission.end
```

Đếm trong khối `loop`: `Rotate` 12 lần · `Forward` 4 lần · `Backward` 3 lần · `followLineMultipleJunctions` 8 lần (cộng các số ngã tư: 2+2+2+2+2+5+1+2 = **18**) · `goToJunction` 8 lần · `LbGripper.moveTo(50)` 2 lần · `LbGripper.open()` 2 lần.

**Mỗi chặng đi theo một khuôn:** `Rotate` (quay hướng) → `followLineMultipleJunctions(n)` (qua n ngã tư, không dừng) → `goToJunction` (dừng giữa ngã tư đích). Thêm `Forward`/`Backward` để đẩy hoặc lùi, và tay gắp để kẹp/thả.

**Điều cần biết:**
- `loop` là dãy lệnh thẳng, **không có `nếu`, không có `lặp`**. Nếu một chặng lệch, các chặng sau vẫn chạy tiếp như không có chuyện gì. Mỗi `goToJunction` giúp robot căn lại theo ngã tư của sa bàn.
- Vị trí khối **cứng trong mã**: kho S3, ô E2, B1, F4. Slide Engage 06 nói khối ô nhiễm đặt ngẫu nhiên ở 4 vị trí. Ngày thi nếu khối nằm chỗ khác thì phải đổi các chặng (đổi góc `Rotate`, số ngã tư). Tám hàm nền không phải đổi.
- Slide Resolve 04, thử thách 3, đòi robot "tự tìm" khối dù vị trí đổi. Mẫu chính thức **không** làm được việc đó.

### Gợi ý tách chặng thành hàm (người soạn đề xuất, không có trong mẫu)
Slide Resolve 04 của Bài 15 gợi ý gom thành hàm có tên. Có thể gói mỗi chặng thành một hàm để dễ đổi và dễ đo giờ:
```cpp
void FromCRLtoS3() {
  Forward(2000, 110);
  Rotate(-2000, 108);
  followLineMultipleJunctions(2);
  goToJunction();
}
void loop() {
  LbMission.begin(TB1A + TB1B);
  FromCRLtoS3();
  PickupNeutralizeS3();   // và 9 chặng còn lại
  LbMission.end();
}
```
Lợi ích: muốn đổi thứ tự chặng chỉ cần đổi thứ tự dòng gọi hàm. Nhưng **các góc xoay phụ thuộc robot đang quay hướng nào**, nên đổi thứ tự thì phải tính lại góc `Rotate` đầu và cuối mỗi chặng.

### Quản lý thời gian 2 phút
- Chương trình **không đo giờ**. Không có `Leanbot.delay`, không có điều kiện thời gian. Trọng tài bấm giờ, hết 2 phút là dừng.
- Mọi lệnh chạy đã ở **2000 bước/giây**, tức mức nhanh nhất của khoảng −2000 … 2000 (§6). Lái nhẹ chạy `(1000, 2000)`, lái gắt `(200, 2000)`.
- Nên muốn rút ngắn thời gian thì phải **bớt đường** và **bớt lần dừng**, không thể tăng tốc hơn. Mỗi `goToJunction` có `stopAndWait` (dừng hẳn) nên 8 lần dừng tốn giờ, nhưng bỏ dừng thì xoay lệch tâm (câu hỏi 2 ở khóa gốc).
- Chạy nhanh nhất dễ **mất vạch** (slide Resolve 02: "without losing the line"). Nếu cả lượt đo ra còn thừa nhiều giây thì **hạ tốc độ** để chạy ổn định. §6 gợi ý 30–50 % khi mới tập, mà 2000 là 100 %. Ngày thi chấm theo độ ổn định giữa hai lượt (§9).
- Cách làm: bấm giờ từng chặng, ghi vào bảng, cộng lại. Tổng phải **nhỏ hơn 120 giây** và còn dư một khoảng cho lúc robot lệch. Dư bao nhiêu là do huấn luyện viên quyết (10 giây là gợi ý của người soạn, chưa kiểm).

### Chiến thuật: nhiệm vụ nào làm trước
Điểm: **45 / 160 / 100 / 40** (khớp slide Learn 06 và §6 giáo trình tổng). Hạng Creator được làm nhiệm vụ theo thứ tự nào cũng được (§2).

| Nhiệm vụ | Điểm | Robot kết thúc ở đâu | Ghi chú |
|---|---|---|---|
| Trung hòa | 160 mỗi cặp | Ở khu đặt khối (trong mẫu: E2) | Nhiều điểm nhất. Phải nhặt, chở và đặt chính xác |
| Phân tích | 100 mỗi khối | **Trong CRL** | Kết thúc ở CRL nên đi cùng điểm về đích |
| Về đích | 40 | Trong CRL, hai bánh trọn | Gần như miễn phí nếu Phân tích là chặng cuối |
| Khoanh vùng | 45 mỗi khối | Ở Khu cách ly | Ít điểm nhất |

Lập luận của người soạn (suy luận, chưa kiểm trên sa bàn thật):
1. **Phân tích làm cuối.** Nó là nhiệm vụ duy nhất kết thúc trong CRL, nên 100 + 40 = **140 điểm** dồn vào chặng cuối. Về CRL xong thì dừng đúng chỗ để lấy cả hai.
2. **Trung hòa làm sớm.** 160 điểm là khoản lớn nhất; làm lúc robot còn mới chạy, pin còn đầy, để dành trước.
3. **Khoanh vùng là khoản bỏ đầu tiên khi thiếu giờ.** Chỉ 45 điểm. Mẫu mất hai lần đẩy (E2 và B1) cộng đoạn đường nối. Nên chuẩn bị **hai phiên bản chương trình**: Kế hoạch A đủ ba nhiệm vụ, Kế hoạch B bỏ Khoanh vùng. Đổi kế hoạch thì phải tính lại góc xoay.
4. **Giữ chặng cuối.** Nếu hết giờ khi robot còn đang chở mẫu thì mất cả 140. Luôn kiểm: *thời gian các chặng trước + thời gian chặng cuối < 120 giây*.
5. **Dùng điểm trên giây** để so sánh: lấy điểm của nhiệm vụ chia cho giây robot mất. Nhiệm vụ nào thấp nhất thì bỏ đầu tiên. Bé tự đo, không có số cho sẵn.

Thứ tự trong mẫu `Fullmision`: **Trung hòa (S3 → E2) → Khoanh vùng (đẩy ở E2, B1) → Phân tích (F4 → CRL)**. Đây đúng là thứ tự trên.

**Việc chưa chắc:** cách gán chặng vào nhiệm vụ là suy luận từ tên chặng, chưa slide nào ghi thẳng. Slide Learn 12 gọi E2 là chỗ khối "Pollution", mà mã vừa đẩy khối ô nhiễm ở E2 vừa thả khối trung hòa ở E2. Cần huấn luyện viên xem sa bàn thật để xác nhận.

## Chương trình mẫu
Nguồn: `Fullmision.ino` do Trình soạn khối lệnh sinh ra. Chương trình có **194 khối** tính cả khối giá trị (số, phép so sánh, ô số mặc định), tương ứng **93 dòng lệnh** khi chỉ đếm khối lệnh xếp chồng. Hai con số đo hai thứ khác nhau, không mâu thuẫn. Cột phải là code C++.

**Cách đọc cảm biến.** Bốn mắt theo thứ tự (2T, 0T, 1P, 3P) ứng với các bit 8, 4, 2, 1. Cách ánh xạ này suy ra từ bảng `switch`, chưa slide nào ghi thẳng. Cả bốn mắt đen là 15.

### Biến chung và tầng 1: dò vạch
| Khối | C++ | Nghĩa |
|---|---|---|
| Tạo biến số nguyên `line` | `int line;` | Hộp nhớ giữ mẫu 4 mắt |
| **Hàm `runFollowLine`**: Đọc cảm biến | `LbIRLine.read();` | Nhìn xuống sàn một lần |
| đặt `line` = Giá trị 4 mắt | `line = LbIRLine.value();` | Ghi vào hộp `line` |
| Hiện lên đèn LED màu xanh lá | `LbIRLine.displayOnRGB(0x00ff00);` | Đèn báo mắt thấy đen |
| trường hợp 4 | `case 4: LbMotion.runLR(1000, 2000); break;` | Lệch trái nhẹ: rẽ nhẹ trái |
| trường hợp 2 | `case 2: LbMotion.runLR(2000, 1000); break;` | Lệch phải nhẹ: rẽ nhẹ phải |
| trường hợp 12 | `case 12: LbMotion.runLR(200, 2000); break;` | Lệch trái nhiều: rẽ gắt trái |
| trường hợp 3 | `case 3: LbMotion.runLR(2000, 200); break;` | Lệch phải nhiều: rẽ gắt phải |
| trường hợp 8 | `case 8: LbMotion.runLR(-1000, 1000); break;` | Xoay tại chỗ sang trái |
| trường hợp 1 | `case 1: LbMotion.runLR(1000, -1000); break;` | Xoay tại chỗ sang phải |
| mặc định | `default: LbMotion.runLR(2000, 2000);` | Vạch ở giữa: chạy thẳng |
| **Hàm `followLineUntilJunction`**: Lặp khi `line` khác 15 | `while ((line != 15)) {` | Dò tới khi gặp ngã tư |
| gọi `runFollowLine` | `  runFollowLine();` | |
| **Hàm `followLineDistance(distanceMm)`**: Tạo biến tạm `targetMm` = `distanceMm` + Đường đã đi | `auto targetMm = distanceMm + LbMotion.getDistanceMm();` | Đích = đã đi + đoạn cần thêm |
| Lặp khi Đường đã đi < `targetMm` | `while ((LbMotion.getDistanceMm() < targetMm)) {` | Chưa tới đích thì còn dò |
| gọi `runFollowLine` | `  runFollowLine();` | |
| **Hàm `goToJunction`**: gọi `followLineUntilJunction` | `followLineUntilJunction();` | Dò tới ngã tư |
| gọi `followLineDistance` 20 | `followLineDistance(20);` | Đi thêm 20 mm để vào giữa |
| Di chuyển: Dừng | `LbMotion.stopAndWait();` | Dừng hẳn |
| **Hàm `followLineMultipleJunctions(junctionCount)`**: Lặp `junctionCount` lần | `for (int count = 0; count < junctionCount; count++) {` | Đếm ngã tư |
| gọi `followLineDistance` 30 | `  followLineDistance(30);` | Bước ra khỏi ngã tư đang đứng |
| gọi `followLineUntilJunction` | `  followLineUntilJunction();` | Dò tới ngã tư kế |

### Tầng 2: chạy thô
| Khối | C++ | Nghĩa |
|---|---|---|
| **`Forward(speed, distanceMm)`**: Chạy với vận tốc Trái `speed` Phải `speed` | `LbMotion.runLR(speed, speed);` | Hai bánh cùng tiến |
| Chạy đoạn đường `distanceMm` mm | `LbMotion.waitDistanceMm(distanceMm);` | Chờ đủ quãng đường |
| Dừng | `LbMotion.stopAndWait();` | |
| **`Backward(speed, distanceMm)`**: Chạy với vận tốc Trái (−1 × `speed`) Phải (−1 × `speed`) | `LbMotion.runLR((-1) * speed, (-1) * speed);` | Hai bánh cùng lùi |
| Chạy đoạn đường, Dừng | `LbMotion.waitDistanceMm(distanceMm);` `LbMotion.stopAndWait();` | |
| **`Rotate(speed, degrees)`**: Chạy với vận tốc Trái `speed` Phải (−1 × `speed`) | `LbMotion.runLR(speed, (-1) * speed);` | Hai bánh ngược chiều, xoay tại chỗ. Dương = phải, âm = trái |
| Rẽ góc `degrees` độ, Dừng | `LbMotion.waitRotationDeg(degrees);` `LbMotion.stopAndWait();` | |

### Cài đặt và bắt đầu
| Khối | C++ |
|---|---|
| Leanbot bắt đầu hoạt động | `void setup() {` `Leanbot.begin();` |
| Cảm biến vạch: Đặt ngưỡng 2T 69, 0T 78, 1P 106, 3P 70 | `LbIRLine.setThreshold(69, 78, 106, 70);` |
| Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B | `LbMission.begin(TB1A + TB1B);` |

### Tầng 3: 11 chặng của `loop`
Tên chặng là khối "Dòng ghi chú" trong chương trình. Tay gắp không được mở ở đầu chương trình; chương trình giả định tay gắp đã mở sẵn từ lúc cân chỉnh (chưa rõ, cần xác nhận).

**Chặng 1 · FromCRLtoS3**

| Khối | C++ | Làm gì |
|---|---|---|
| Forward 2000, 110 | `Forward(2000, 110);` | Ra khỏi CRL 110 mm |
| Rotate −2000, 108 | `Rotate((-2000), 108);` | Xoay trái 108° |
| followLineMultipleJunctions 2 | `followLineMultipleJunctions(2);` | Qua 2 ngã tư |
| goToJunction | `goToJunction();` | Dừng giữa ngã tư (S3) |

**Chặng 2 · PickupNeutralizeS3**

| Khối | C++ | Làm gì |
|---|---|---|
| Tay gắp: Xoay tới góc 50 độ | `LbGripper.moveTo(50);` | Kẹp khối trung hòa |

**Chặng 3 · FromS3toE2**

| Khối | C++ | Làm gì |
|---|---|---|
| Rotate 2000, 60 | `Rotate(2000, 60);` | Xoay phải 60° |
| followLineMultipleJunctions 2 · goToJunction | `followLineMultipleJunctions(2);` `goToJunction();` | Qua 2 ngã tư, dừng |
| Rotate 2000, 60 | `Rotate(2000, 60);` | Xoay phải 60° |
| followLineMultipleJunctions 2 · goToJunction | `followLineMultipleJunctions(2);` `goToJunction();` | Qua 2 ngã tư, dừng |
| Rotate 2000, 30 | `Rotate(2000, 30);` | Xoay phải 30° |

**Chặng 4 · PushPollutionE2**

| Khối | C++ | Làm gì |
|---|---|---|
| Forward 2000, 150 | `Forward(2000, 150);` | Tiến 150 mm đẩy khối ô nhiễm |

**Chặng 5 · DropNeutralizeE2**

| Khối | C++ | Làm gì |
|---|---|---|
| Tay gắp: Mở | `LbGripper.open();` | Nhả khối trung hòa |

**Chặng 6 · FromE2toB1**

| Khối | C++ | Làm gì |
|---|---|---|
| Backward 2000, 150 | `Backward(2000, 150);` | Lùi 150 mm |
| Rotate −2000, 120 | `Rotate((-2000), 120);` | Xoay trái 120° |
| followLineMultipleJunctions 2 · goToJunction | `followLineMultipleJunctions(2);` `goToJunction();` | Qua 2 ngã tư, dừng |
| Rotate 2000, 60 | `Rotate(2000, 60);` | Xoay phải 60° |
| followLineMultipleJunctions 2 · goToJunction | `followLineMultipleJunctions(2);` `goToJunction();` | Qua 2 ngã tư, dừng |
| Rotate 2000, 110 | `Rotate(2000, 110);` | Xoay phải 110° |

**Chặng 7 · PushPollutionB1**

| Khối | C++ | Làm gì |
|---|---|---|
| Forward 2000, 150 | `Forward(2000, 150);` | Tiến 150 mm đẩy khối ô nhiễm thứ hai |

**Chặng 8 · FromB1toF4**

| Khối | C++ | Làm gì |
|---|---|---|
| Backward 2000, 150 | `Backward(2000, 150);` | Lùi 150 mm |
| Rotate −2000, 25 | `Rotate((-2000), 25);` | Xoay trái 25° |
| followLineMultipleJunctions 5 · goToJunction | `followLineMultipleJunctions(5);` `goToJunction();` | Qua 5 ngã tư, dừng |
| Rotate −2000, 30 | `Rotate((-2000), 30);` | Xoay trái 30° |
| Forward 2000, 30 | `Forward(2000, 30);` | Tiến sát khối ở F4 |

**Chặng 9 · PickupPollutionF4**

| Khối | C++ | Làm gì |
|---|---|---|
| Tay gắp: Xoay tới góc 50 độ | `LbGripper.moveTo(50);` | Kẹp khối ô nhiễm |

**Chặng 10 · FromF4toCRL**

| Khối | C++ | Làm gì |
|---|---|---|
| Backward 2000, 30 | `Backward(2000, 30);` | Lùi 30 mm |
| Rotate 2000, 30 | `Rotate(2000, 30);` | Xoay phải 30° |
| followLineMultipleJunctions 1 · goToJunction | `followLineMultipleJunctions(1);` `goToJunction();` | Qua 1 ngã tư, dừng |
| Rotate 2000, 60 | `Rotate(2000, 60);` | Xoay phải 60° |
| followLineMultipleJunctions 2 · goToJunction | `followLineMultipleJunctions(2);` `goToJunction();` | Qua 2 ngã tư, dừng |
| Rotate 2000, 30 | `Rotate(2000, 30);` | Xoay phải 30° |

**Chặng 11 · DropPollutionCRL**

| Khối | C++ | Làm gì |
|---|---|---|
| Tay gắp: Mở | `LbGripper.open();` | Nhả mẫu trong CRL |
| Nhiệm vụ: Kết thúc | `LbMission.end();` | Hết nhiệm vụ |

Hai lần `Forward 150` (chặng 4 và 7) được `Backward 150` lùi lại ngay chặng sau (chặng 6 và 8); lần `Forward 30` ở chặng 8 được `Backward 30` ở chặng 10. Lùi bằng đúng đoạn vừa tiến để trở về ngã tư cũ.

## Phiếu ôn luyện
Giả định mọi bài tính điểm: mỗi lượt có **1 cặp** Trung hòa trừ khi đề ghi khác.

**1. Đọc đoán kết quả: tính điểm.** Tính điểm mỗi ca.
- (a) Xong cả ba nhiệm vụ (1 khối Khoanh vùng, 1 cặp Trung hòa, 1 khối Phân tích), robot dừng hai bánh trọn trong CRL.
- (b) Như (a) nhưng hết giờ khi robot còn đang chở mẫu giữa đường.
- (c) Như (a) nhưng một bánh nằm đè lên vạch viền của CRL khi robot dừng.
- (d) 1 khối Khoanh vùng, **2 cặp** Trung hòa, 1 khối Phân tích, hai bánh trọn trong CRL.

**Đáp án:** (a) 45 + 160 + 100 + 40 = **345**. (b) mất Phân tích và Về đích: 45 + 160 = **205**. (c) mất 40: **305**, vì hai bánh phải nằm *hoàn toàn* trong CRL. (d) 45 + 320 + 100 + 40 = **505**, đúng con số tối đa ở ví dụ slide Learn 06.

**2. Đọc đoán kết quả: chặng B1 → F4.** Robot đang ở B1. Chạy:
```cpp
Backward(2000, 150);
Rotate((-2000), 25);
followLineMultipleJunctions(5);
goToJunction();
Rotate((-2000), 30);
Forward(2000, 30);
```
Robot làm gì từng bước? Cuối cùng robot ở đâu?

**Đáp án:** Lùi 150 mm (ra khỏi khối vừa đẩy). Xoay trái 25°. Dò vạch qua 5 ngã tư. `goToJunction`: vì `line` vẫn là 15 ở ngã tư thứ 5 nên robot dò thêm 20 mm rồi dừng, tức dừng giữa **ngã tư thứ 5**. Xoay trái 30°. Tiến 30 mm, dừng sát khối ô nhiễm ở F4, sẵn sàng kẹp. (Cách đọc ngã tư thứ 5 là suy luận từ code, chưa thử trên robot.)

**3. Tìm lỗi.** Bé viết chặng E2 → B1 như dưới. Có 2 chỗ sai so với mẫu. Tìm và sửa.
```cpp
Forward(2000, 150);
Rotate((-2000), 120);
followLineMultipleJunctions(2);
Rotate(2000, 60);
followLineMultipleJunctions(2);
goToJunction();
Rotate(2000, 110);
```
**Đáp án:** (1) Dòng đầu là `Forward`, phải là `Backward(2000, 150)`: robot đang đứng sát khối nên phải lùi ra, tiến nữa là đâm tiếp. (2) Sau `followLineMultipleJunctions(2)` đầu tiên thiếu `goToJunction();`, robot xoay 60° ngay mép ngã tư thay vì giữa ngã tư, nên tâm quay lệch và lệch dần.

**4. Sắp thứ tự.** Xếp 11 chặng theo đúng thứ tự:
- A. Thả mẫu vào CRL · B. Đẩy khối ở E2 · C. Nhặt khối trung hòa ở S3 · D. Từ F4 về CRL · E. Ra khỏi CRL tới S3 · F. Nhặt khối ô nhiễm ở F4 · G. Từ B1 tới F4 · H. Thả khối trung hòa ở E2 · I. Từ S3 tới E2 · J. Đẩy khối ở B1 · K. Từ E2 tới B1

**Đáp án:** **E → C → I → B → H → K → J → G → F → D → A.**

**5. Điền số.** Chặng F4 → CRL bị mất số. Điền và giải thích:
```cpp
Backward(2000, __);
Rotate(2000, __);
followLineMultipleJunctions(__);
goToJunction();
Rotate(2000, __);
followLineMultipleJunctions(__);
goToJunction();
Rotate(2000, __);
```
Rồi điền: tổng các số ngã tư trong cả 8 lệnh `followLineMultipleJunctions` của `loop` là __.

**Đáp án:** `30`, `30`, `1`, `60`, `2`, `30`. Lùi 30 mm vì ở chặng 8 robot đã `Forward 30` sát khối; lùi bằng đúng đoạn đó. Tổng ngã tư: 2+2+2+2+2+5+1+2 = **18**.

**6. Dịch nhãn.** Dịch sang tiếng Việt:
- (a) `Mission: Begin when ? combo touched`
- (b) `Mission: End`
- (c) `IRLine: Set threshold`
- (d) `Gripper: Open`
- (e) `Motion: Run with velocity Left ? Right ?`

Rồi dịch ngược sang tiếng Anh: (f) "Cảm biến vạch: Đọc cảm biến", (g) "Tay gắp: Xoay tới góc ? độ".

**Đáp án:** (a) Nhiệm vụ: Bắt đầu khi chạm cùng lúc ?. (b) Nhiệm vụ: Kết thúc. (c) Cảm biến vạch: Đặt ngưỡng. (d) Tay gắp: Mở. (e) Di chuyển: Chạy với vận tốc Trái ? Phải ?. (f) `IRLine: Read sensors`. (g) `Gripper: Rotate to ? degrees`.

**7. Làm trên máy: đẩy, thả, lùi.** Ghép khối sinh ra đúng đoạn code này (đã dán sẵn các hàm):
```cpp
Forward(2000, 150);
LbGripper.open();
Backward(2000, 150);
Rotate((-2000), 120);
```
**Đáp án:** Gọi `Forward` với `2000`, `150`; "Tay gắp: Mở"; gọi `Backward` với `2000`, `150`; gọi `Rotate` với `-2000`, `120`. Đối chiếu cột code bên phải, giống từng dòng là đúng.

**8. Chiến thuật: bỏ nhiệm vụ nào.** *Số trong bài này do người soạn đặt ra để tập tính, không phải số đo thật.* Một đội đo: Khoanh vùng mất 30 giây, Trung hòa mất 50 giây, Phân tích và về CRL mất 40 giây, đường nối mất 20 giây; tổng 140 giây, hơn 120. Giả sử bỏ nhiệm vụ nào thì tiết kiệm đúng số giây của nhiệm vụ đó. Bỏ nhiệm vụ nào thì được nhiều điểm nhất mà vẫn đủ 120 giây?

**Đáp án:** Điểm trên giây: Khoanh vùng 45 ÷ 30 = 1,5; Trung hòa 160 ÷ 50 = 3,2; Phân tích + về 140 ÷ 40 = 3,5. Thấp nhất là Khoanh vùng, bỏ nó còn 110 giây và được 160 + 140 = **300 điểm**. Bỏ Trung hòa còn 90 giây nhưng chỉ được 185. Bỏ Phân tích còn 100 giây, được nhiều nhất 45 + 160 + 40 = 245 (nếu vẫn về được CRL). Bỏ Khoanh vùng là tốt nhất.

**9. Thực hành có robot: bảng giờ 11 chặng.** Chạy `Fullmision`, bấm giờ từng chặng và ghi:

| Chặng | Tên | Giây đo được | Thuộc nhiệm vụ |
|---|---|---|---|
| 1 | FromCRLtoS3 | | |
| 2 | PickupNeutralizeS3 | | |
| 3 | FromS3toE2 | | |
| 4 | PushPollutionE2 | | |
| 5 | DropNeutralizeE2 | | |
| 6 | FromE2toB1 | | |
| 7 | PushPollutionB1 | | |
| 8 | FromB1toF4 | | |
| 9 | PickupPollutionF4 | | |
| 10 | FromF4toCRL | | |
| 11 | DropPollutionCRL | | |

Cộng các chặng của mỗi nhiệm vụ rồi chia điểm cho giây (như bài 8). Rồi chạy lượt thứ hai và so.

**Đáp án:** Không có số cố định. Bài đúng khi tổng nhỏ hơn 120 giây, bé nêu được nhiệm vụ nào điểm trên giây thấp nhất, và hai lượt cho kết quả giống nhau.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc có 10 câu (dữ liệu H5P, slide Resolve 03 hiện trống). Đáp án đúng ghi sau dấu ✔.

1. What is the specific trigger to begin the ultimate mission? (Điều gì bắt đầu nhiệm vụ cuối cùng?) ✔ *Simultaneously touching TB1A and TB1B sensors.* (Chạm đồng thời hai cảm biến TB1A và TB1B.) Sai: *A voice command*; *Pressing a mechanical button on the back*.
2. Why does the goToJunction block move the robot forward 20mm after detecting black? (Vì sao khối goToJunction cho robot tiến thêm 20 mm sau khi thấy vạch đen?) ✔ *To center the robot's axis for a more accurate rotation.* (Để đưa tâm quay vào giữa ngã tư, quay chính xác hơn.) Sai: *To save battery power*; *To hit the pollution block harder*.
3. If the robot drifts to the left while following a line, how does runFollowLine react? (Nếu robot lệch trái khi bám vạch, runFollowLine làm gì?) ✔ *It increases the left motor speed to steer back toward the line.* (Tăng tốc motor trái để lái về vạch.) Sai: *It stops completely*; *It rotates 180 degrees*. ("Lệch trái" ở đây nghĩa là robot trôi khỏi vạch về phía trái, nên vạch nằm bên phải. Xem Ghi chú.)
4. What is the primary purpose of the Calibration phase? (Mục đích chính của pha Hiệu chỉnh?) ✔ *To set IR thresholds based on current lighting conditions.* (Đặt ngưỡng IR theo ánh sáng hiện tại.) Sai: *To clean the robot's wheels*; *To check the gripper's motor strength*.
5. How many points is a successful Neutralization pair worth? (Một cặp Trung hòa thành công được bao nhiêu điểm?) ✔ *+160 points.* Sai: *+45 points*; *+100 points*.
6. What logic structure does the followLineMultipleJunctions block use? (Khối followLineMultipleJunctions dùng cấu trúc nào?) ✔ *A Repeat loop.* (Vòng lặp Repeat.) Sai: *An "If-Then" statement*; *A "Wait Until" distance block*.
7. In Mission 3 (Analysis), where must the pollution block be delivered to earn points? (Ở Nhiệm vụ 3, phải giao khối ô nhiễm tới đâu?) ✔ *Back to the Crisis Response Lab (CRL).* (Về CRL.) Sai: *The Mobility Hub*; *The Industrial Automation zone*.
8. What is the official time limit to complete the full mission? (Giới hạn thời gian chính thức?) ✔ *2 minutes.* (2 phút.) Sai: *1 minute*; *5 minutes*.
9. How does the robot rotate during a "Rotate" command? (Robot quay thế nào khi chạy lệnh Rotate?) ✔ *The left and right motors run in opposite directions.* (Hai motor chạy ngược chiều nhau.) Sai: *Both wheels move forward at different speeds*; *Only one wheel moves while the other is locked*.
10. To earn the +40 Return Bonus, what condition must be met? (Muốn nhận +40 điểm về đích, cần điều kiện gì?) ✔ *Both wheels must be completely inside the CRL area when stopped.* (Cả hai bánh nằm hoàn toàn trong CRL khi dừng.) Sai: *The robot must finish the mission in under 60 seconds*; *The robot must beep three times at the end*.

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Quá nhiều chữ tiếng Anh ở slide (Phase 1–4, Practice 1–5) | Bé bỏ qua | Dùng 11 thẻ chặng và bảng thuật ngữ; mỗi thẻ một ý |
| Nhầm tên ngã tư (S3, E2, B1, F4) với tên khu A–H | Chỉ sai chỗ trên sa bàn | Dán nhãn lên sa bàn; chỉ từng chặng bằng ngón tay |
| Khó hình dung góc 108°, 60°, 30°, 120°, 110°, 25° | Không biết xoay trái hay phải | Bé xoay robot bằng tay, xem dấu `-` là trái, không dấu là phải |
| Chạy nhanh quá mất vạch | Robot lệch giữa chặng | Hạ tốc độ một chặng, đo lại; chỉ đổi một thứ mỗi lần |
| Một chặng lệch kéo cả lượt hỏng | Các chặng sau sai hết | Chạy từng chặng riêng, sửa chặng đầu tiên bị lệch trước |
| Hết giờ trước khi về CRL | Mất 100 + 40 | Quay lại bảng giờ; cân nhắc Kế hoạch B bỏ Khoanh vùng |
| Quên điều kiện +40 | Robot dừng một bánh ngoài CRL | Kiểm cuối lượt: nhìn từ trên xuống, hai bánh có trọn trong CRL không |
| Xếp robot lệch lúc xuất phát | Đè lên viền CRL | Cho bé nhìn từ trên xuống trước khi chạm hai nút |
| Chạm một nút mà chưa chạy | Robot đứng yên | Nhắc: phải chạm **cùng lúc** TB1A và TB1B |
| Ngưỡng cảm biến lệch sa bàn | Robot mất vạch ở bàn mới | Cân chỉnh lại ngưỡng theo ánh sáng bàn đó |

## Ghi chú về bản gốc
Mâu thuẫn và chỗ chưa chắc đã thấy trong bài này:
1. **Điểm "lượt hoàn hảo" không thống nhất.** Slide Learn 06 là ví dụ 465 / 505 với **2 cặp** Trung hòa (45 + 320 + 100 + 40). Slide Resolve 04, thử thách 2, kể "lượt Perfection" chỉ **1 cặp** (160 + 45 + 100 + 40 = 345). Chưa biết luật thật cho bao nhiêu cặp. Các điểm đơn lẻ 45 / 160 / 100 / 40 thì khớp §6; `airoc-2026.md` ghi chúng chưa có nguồn luật chính thức, nay có thêm slide này làm bằng chứng từ khóa học (không phải luật thi).
2. **Ánh xạ chặng ↔ nhiệm vụ là suy luận.** Slide Learn 12 gọi E2 là chỗ khối ô nhiễm, mà mã thả khối trung hòa tại E2 và đẩy khối ô nhiễm tại E2. Cần huấn luyện viên xem sa bàn thật.
3. **Tay gắp 50°.** Mẫu dùng `moveTo(50)` để kẹp. Nhãn khối nói mở = 0°, đóng = 90° (§6). 50° nằm giữa hai mức; chưa rõ nó kẹp chặt hay không. Cần thử trên robot thật.
4. **Hướng xoay.** Slide Learn 11 nói "quay 108 độ", mã mẫu là `Rotate(-2000, 108)`, tức xoay **trái**.
5. **Số chặng.** Slide Learn 12 mô tả 4 pha; mã mẫu có 11 chặng và 4 lệnh tay gắp (2 lần `moveTo(50)`, 2 lần `open`).
6. **Slide Learn 08** là sơ đồ chung (không khớp mã thật): có "Wait 1.0s", vòng lặp mẫu 10 lần, "EXECUTION GROUP A/B", cảm biến L, CL, C, CR, R (5 cảm biến) và một khối ghi "FAULTY BLOCK: ROTATE (does nothing)". Robot chỉ có 4 mắt. Mã thật không có `Wait`. Dùng mã mẫu, không dùng sơ đồ này.
7. **Slide Learn 10** lấy ví dụ mẫu "Black-Black-White-Black-Black" (5 vị trí), trong khi `runFollowLine` đọc **4** mắt. Ví dụ không khớp mã thật.
8. **Câu hỏi 3 dễ hiểu ngược.** "Robot lệch trái" nghĩa là robot trôi khỏi vạch về bên trái, tức vạch đang ở bên **phải** robot. Khi đó mã mẫu (`case 2`, `case 3`) cho bánh trái chạy nhanh hơn bánh phải, khớp đáp án khóa gốc. Còn `case 4` là trường hợp vạch ở bên **trái** robot, bánh trái chậm hơn. Không mâu thuẫn, nhưng cách nói "lệch trái" dễ nhầm; dạy bé bằng "vạch nằm ở phía nào của robot".
10. **Sa bàn.** Slide Engage 07 ghi khu B giống hệt khu A, CRL giống khu E, và khu H là "start zone and analysis lab" trong khi các slide khác nói xuất phát ở CRL (có vẻ lỗi sao chép). Slide Engage 08 tô khu E làm Khu cách ly.
11. **Dừng ở ngã tư nào.** Theo cách đọc mã, sau `followLineMultipleJunctions(N)` thì `goToJunction` dừng ở ngã tư thứ N (vì `line` vẫn là 15), còn slide Learn 11 viết "qua 2 ngã tư rồi dừng ở ngã tư tiếp theo (S3)". Chưa chạy thử, cần xác nhận.
12. **Tay gắp lúc đầu.** Mẫu không có lệnh mở tay gắp trước lần kẹp đầu tiên.
13. **Mẫu có lộ trình cố định**, trong khi thử thách 3 (Resolve 04) đòi tự tìm khối đặt ngẫu nhiên.
14. Slide Learn 07 là trang tiêu đề trống; slide Resolve 04 bị cụt chữ ở mép dưới (dòng "Final Success" cuối). Mục tiêu "Demonstrate sportsmanship and competition-day protocols" có ở slide Engage 01 nhưng không có slide nào nói chi tiết quy trình ngày thi.
15. Bài có 3 chương (Engage, Learn, Resolve), không có Growth như §3 giáo trình tổng mô tả chung (4–5 chương).

## Nộp bài trên Plearn
- Hoạt động của bài: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=63009> (H5P, 10 câu như trên).
- Giáo trình tổng §3 **không liệt kê mục nộp riêng sau Bài 16**. Mục nộp gần nhất là *Nộp Nhiệm vụ 3* (MINI PROJECT 5), mở sau Bài 15; và *GRAND CAPSTONE PROJECT* (Dự án tổng kết), mở sau *Nộp Nhiệm vụ 1*. Nội dung và cách nộp của hai mục đó **chưa lấy được**. Thầy mở trang Plearn của bé, đọc đề rồi bổ sung vào đây.
- Mốc đạt của khóa cho bài này (§9): chạy trọn một lượt trong 2 phút, **hai lượt liên tiếp cùng ra một kết quả**.
- Trước khi bé bấm hoàn thành, đi qua danh sách này:
  - [ ] Làm xong 10 câu H5P, Plearn ghi nhận hoàn thành.
  - [ ] Chạy hai lượt liên tiếp, ghi điểm và giây của từng lượt.
  - [ ] Tổng giây nhỏ hơn 120.
  - [ ] Robot xuất phát trọn trong CRL, chạm cùng lúc TB1A + TB1B, dừng hai bánh trọn trong CRL.
  - [ ] Bé chuyển nhãn khối sang tiếng Anh để thấy đúng tên trên Plearn (§4 giáo trình tổng).
