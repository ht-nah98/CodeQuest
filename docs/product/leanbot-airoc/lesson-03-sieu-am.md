# Bài 3 — Mắt thần siêu âm

> Bài gốc: *Lesson 3. Detect Obstacles with Ultrasonic Sensors* · 26 slide · 4 chương (Engage 4, Learn 9, Resolve 4, Growth 9) · <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62125>

## Bé học xong thì làm được gì
- Kể được cảm biến siêu âm đo xa bằng cách nào: phát sóng âm, nghe tiếng vọng, tiếng vọng về càng lâu thì vật càng xa.
- Chỉ đúng trên cảm biến HC-SR04 đâu là bộ phát (T) và đâu là bộ thu (R).
- Ghép chương trình có khối `nếu` để robot chạy tới và **dừng khi vật cách ≤ 25 cm**.
- Ghép chương trình có khối `lặp khi` để robot **lùi cho tới khi phía trước trống hơn 30 cm**.
- Nói được vì sao ngưỡng dừng (25 cm) khác ngưỡng trống (30 cm), và sửa được lỗi thường gặp trong chương trình.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Robot Leanbot có cảm biến siêu âm HC-SR04 | Hai "mắt" tròn ở phía trước: T (bộ phát) bên trái, R (bộ thu) bên phải. HC-SR04 có 4 chân: Vcc, Trig, Echo, Gnd (slide Learn 03) |
| Máy tính mở Trình soạn khối lệnh bản tiếng Việt | <https://ide.pythaverse.space/lbeditor/> kèm bản vá `tools/lbeditor-vi/`. Trước khi bé vào PLearn, thầy tắt bản vá (hoặc đổi `?lang=en`) để bé thấy nhãn gốc |
| Vật cản | Hộp giấy hoặc tường. Thầy tự chuẩn bị, bài gốc không ghi cụ thể |
| Thước đo | Để kiểm 15, 25, 30 cm. Thầy tự chuẩn bị, bài gốc không ghi cụ thể |
| Sa bàn Synapse City (lưới 3x3, 4 chấm đỏ là đường bị chặn) | Dùng ở phần Bé tự làm. Cách đặt robot ở ô xuất phát CRL nằm trong slide Growth 01 |
| Trang học PLearn | Hoạt động của bài, đường dẫn ở đầu file |

## Thuật ngữ của bài
| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Sound wave | Sóng âm | Tiếng kêu rất cao, tai mình không nghe được |
| Echo | Tiếng vọng | Tiếng dội lại khi đụng vật cản |
| Echolocation (bat) | Dơi định vị bằng tiếng vọng | Dơi dùng tiếng vọng để bay trong bóng tối |
| Transmitter | Bộ phát | Mắt trái: gửi sóng âm đi |
| Receiver | Bộ thu | Mắt phải: bắt tiếng vọng về |
| Distance | Khoảng cách | Vật cách robot bao xa |
| centimeters (cm) | xăng-ti-mét | Đơn vị đo độ dài nhỏ |
| Obstacle | Chướng ngại vật | Thứ chắn đường robot |
| Stop Distance (25 cm) | Khoảng cách dừng | Vật cách 25 cm hoặc gần hơn thì robot phải dừng |
| Safe Distance (30 cm) | Khoảng cách an toàn | Lùi cho tới khi phía trước trống hơn 30 cm |
| Max Range (400 cm) | Tầm xa nhất | Cảm biến thấy được vật xa tới 4 mét |
| Safety buffer zone | Vùng đệm an toàn | Khoảng chênh giữa 25 và 30 để robot không giật tới lui |
| Reverse | Lùi | Chạy ngược về sau, tốc độ là số âm |
| RPM | Vòng/phút | Bánh xe quay bao nhiêu vòng trong một phút |
| Milliseconds | Mili giây | Rất nhanh, nhanh hơn một cái chớp mắt |
| Bug | Lỗi chương trình | Chỗ sai làm robot chạy không đúng |
| Red Zones | Vùng đỏ | Đường bị chặn, robot phải lùi |

Các từ Ngưỡng, Điều kiện / Nếu, Vòng lặp, Sửa lỗi, Chạy thử đã có trong §5.1 giáo trình tổng. Bài này dùng đúng cách dịch đó.

## Khối lệnh dùng trong bài
| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `Leanbot.whenStarted` (When Leanbot started) | Leanbot bắt đầu hoạt động | Điểm bắt đầu chương trình |
| `LbMotion.run` (Motion: Run with velocity Left ? Right ? rpm) | Di chuyển: Chạy với vận tốc Trái ? Phải ? | Đặt tốc độ hai bánh. 30 là tiến, -30 là lùi |
| `LbMotion.stop` (Motion: Stop) | Di chuyển: Dừng | Giảm tốc rồi dừng hẳn hai bánh |
| `Leanbot.objectInFront` (Ping: Object in front is within ? cm distance ?) | Đo xa: Phía trước có vật trong vòng ? cm ? | Câu hỏi đúng/sai. Dùng trong khối `nếu`. Slide điền 25 |
| `Leanbot.ping` (Ping: Front distance in cm) | Đo xa: Khoảng cách phía trước, tính bằng cm | Trả về một con số (cm). Đem so sánh trong `lặp khi` |
| `if ... do ...` (khối Blockly có sẵn) | nếu ... thì | Điều kiện đúng thì làm các khối bên trong, **chỉ kiểm tra một lần** mỗi khi chạy tới nó |
| `repeat while` (khối Blockly có sẵn) | lặp khi | Điều kiện còn đúng thì làm đi làm lại các khối bên trong |
| `Leanbot.toneDuration` (Sound: Play ? ? tone for ? ?) | Âm thanh: Kêu nốt ? ? trong ? ? | Chỉ dùng ở thử thách Còi báo (Challenge 3) |

Hai khối `if` và `repeat while` không nằm trong bảng 48 khối Leanbot của bản vá nên nhãn Việt lấy theo §5.1 và §3 giáo trình tổng. Thầy mở trình soạn khối bản Việt xem nhãn thật rồi sửa lại cột này nếu khác.

## Dạy thế nào
Gợi ý tổng 55 phút: Mở bài 5, Giảng 20, Bé tự làm 25, Chốt 5. Con số này là đề xuất của giáo án. Slide chỉ ghi riêng hoạt động nhiệm vụ là 20 phút (Growth 02).

### Mở bài (5 phút)
1. Thầy kể: "Thành phố có robot giao hàng. Nhưng chúng cứ đâm vào tường, vào thùng hàng, thậm chí đâm nhau. Kỹ sư trưởng cần các con sửa."
2. Thầy hỏi: "Làm sao con biết có vật gì đó quá gần con?" Bé trả lời: "Con nhìn bằng mắt." Thầy nói: "Robot chưa có mắt. Hôm nay mình lắp mắt cho robot."
3. Thầy hỏi: "Con có biết con dơi bay trong bóng tối bằng cách nào không?" Cho bé đoán rồi hé: "Bằng tiếng vọng. Robot của mình cũng vậy."

### Giảng (20 phút)
1. **Mắt thần hoạt động thế nào (4 phút).** Thầy đưa robot, chỉ hai "mắt" tròn. Thầy nói: "Mắt trái gửi tiếng kêu đi, mắt phải nghe tiếng vọng về." Thầy vỗ tay vào tường trong lớp để bé nghe tiếng dội. Hỏi: "Tiếng vọng về nhanh thì vật gần hay xa?" Đáp: gần. "Về chậm?" Đáp: xa.
   - Công thức trên slide Learn 04 (thời gian đi và về chia 2, nhân vận tốc âm) **không bắt bé tính**. Chỉ nói: "Sóng đi rồi về, nên máy chia đôi."
2. **Ba con số thần kỳ (4 phút).** Thầy viết lên bảng: 25, 30, 400. Hỏi bé từng số nghĩa là gì rồi chốt:
   - 25 cm: vật cách 25 cm hoặc gần hơn thì **dừng**.
   - 30 cm: **lùi** cho tới khi phía trước trống hơn 30 cm.
   - 400 cm: cảm biến thấy xa nhất 4 mét.
3. **Vì sao 25 mà không phải 30 luôn? (4 phút).** Đây là câu quan trọng nhất của bài. Thầy dùng robot hoặc hai bé đóng vai:
   - Cho "nếu dùng cùng một số 25". Robot tiến, tới 25 cm thì dừng. Dừng xong lùi, lùi cho tới khi **hơn 25 cm**. Vừa lên 26 cm là nó tiến lại, tới 25 cm lại dừng, lại lùi, lại tiến... Cứ giật tới lui như yo-yo.
   - Cho "25 để dừng, 30 để coi là trống". Lùi tới khi hơn 30 cm mới thôi, cách vật 5 cm nữa. Robot có chỗ rộng, không giật. Khoảng 5 cm đó là **vùng đệm an toàn**.
   - Hỏi bé: "Nếu vật cách đúng 27 cm thì sao?" Đáp án: robot **chưa dừng** khi đang tiến (27 lớn hơn 25), nhưng cũng chưa coi là trống nếu nó đang lùi (27 nhỏ hơn hoặc bằng 30).
4. **Bốn luật robot an toàn (3 phút).** Cho bé đọc to và đóng vai: Đi tiếp khi phía trước hơn 25 cm. Dừng khi vật ≤ 25 cm. Lùi cho tới khi hơn 30 cm. Kiểm tra liên tục, không nghỉ.
5. **Chương trình 1, đi tới khi gần vật (3 phút).** Thầy ghép trên màn hình, cho bé nhìn cột code bên phải: Chạy Trái 30 Phải 30, rồi `nếu` vật trong vòng 25 cm thì Dừng. Hỏi: "Số 30 này là gì?" Đáp: tốc độ bánh, đơn vị vòng/phút, nằm trong khoảng -59 đến 59.
6. **Chương trình 2, lùi tới khi trống (2 phút).** Thầy ghép `lặp khi` khoảng cách ≤ 30 thì Chạy -30 -30, ra khỏi vòng lặp thì Dừng. Hỏi: "Vì sao có dấu trừ?" Đáp: số âm là lùi. Hỏi: "Khi nào vòng lặp thôi lùi?" Đáp: khi khoảng cách **không còn ≤ 30**, tức là hơn 30.
7. **Khối `nếu` khác `lặp khi` (không đếm giờ, hỏi lướt).** Hỏi: "Khối nào chỉ hỏi một lần? Khối nào hỏi đi hỏi lại?" Đáp: `nếu` hỏi một lần, `lặp khi` hỏi liên tục. Đây là chỗ bé dễ nhầm nhất, xem bảng "Bé hay vướng".

### Bé tự làm (25 phút)
Bé làm đôi: **một kỹ sư, một người thử**. Kỹ sư ghép khối, người thử đặt robot và quan sát. Đổi vai giữa chừng.
1. Mở Trình soạn khối lệnh, ghép lại Chương trình 1 rồi Chương trình 2 (xem phần dưới). Chạy thử.
2. Hoạt động nhiệm vụ trên slide (Growth 02), có 20 phút: mở trình soạn, ghép, đặt robot ở ô xuất phát (CRL), chạy thử xem robot có dừng trước vật không, rồi **đổi khoảng cách dừng** (thử 20 cm hoặc 35 cm) và ghi lại số nào tốt nhất.
3. Ba bài tập nhỏ trên slide (Resolve). Dừng khi vật ≤ 15 cm. Dừng khi vật ≤ 20 cm. Lùi cho tới khi vật hoặc tường xa hơn 60 cm.
4. Bé nào xong sớm: ghép **chương trình đầy đủ** (tiến, dừng, lùi) hoặc thử một thử thách (xem bên dưới). Làm phiếu ôn luyện ở cuối.

Thử thách trên slide (Growth 04), cho bé giỏi:
- Tốc độ: robot chạy nhanh hơn mà vẫn dừng an toàn.
- Hai cảm biến: thêm cảm biến bên hông để tránh sang trái hoặc phải thay vì chỉ lùi. Bài gốc không nói hai cảm biến nối thế nào.
- Còi báo: kêu bíp khi tới gần vật, như cảm biến lùi xe hơi (dùng khối `Âm thanh`).

### Chốt bài (5 phút)
1. Hỏi bé nhắc lại ba ý: Robot đo xa bằng tiếng vọng. Dừng ở ≤ 25 cm. Lùi tới khi hơn 30 cm. Hai con số khác nhau để robot không giật như yo-yo.
2. Hỏi ngẫu nhiên: "Cảm biến khoảng cách còn dùng ở đâu?" Slide gợi ý xe tự lái, drone giao hàng, robot hút bụi. Bé nghĩ thêm chỗ khác thì càng tốt, không có đáp án sai.
3. Bài về nhà trên slide: vẽ một robot giao hàng mơ ước và ghi 3 cảm biến nó cần để đi an toàn trong khu phố của bé.
4. Bài sau: Bài 4, đi theo đường (robot tìm và đi theo vạch sơn).

## Chương trình mẫu

### Chương trình 1: đi tới khi gần vật (slide Learn 07)
```
Leanbot bắt đầu hoạt động
  Di chuyển: Chạy với vận tốc Trái 30 Phải 30
  nếu  Đo xa: Phía trước có vật trong vòng 25 cm ?
  thì  Di chuyển: Dừng
```
```cpp
// Cách đọc: mỗi khối thành một lệnh.
LbMotion.runLRrpm(30, 30);          // Chạy Trái 30, Phải 30 vòng/phút
if (Leanbot.objectInFront(25)) {    // nếu phía trước có vật trong 25 cm
  LbMotion.stop();                  // Dừng
}
```
Trong ảnh slide, khối `nếu` **chỉ kiểm tra một lần**, ngay sau khi robot bắt đầu chạy. Nghĩa là nó có thể chưa dừng đúng lúc. Phiên bản trọn vẹn nằm ở chương trình đầy đủ dưới đây.

### Chương trình 2: lùi tới khi trống (slide Learn 08)
```
Leanbot bắt đầu hoạt động
  lặp khi  Đo xa: Khoảng cách phía trước, tính bằng cm  ≤  30
  thì      Di chuyển: Chạy với vận tốc Trái -30 Phải -30
  Di chuyển: Dừng
```
```cpp
while (Leanbot.ping() <= 30) {      // lặp khi khoảng cách phía trước ≤ 30 cm
  LbMotion.runLRrpm(-30, -30);      // lùi
}
LbMotion.stop();                    // Dừng, sau khi vòng lặp kết thúc
```
Khối `Dừng` nằm **ngoài** vòng lặp, thẳng hàng với `lặp khi`.

### Chương trình đầy đủ (đề xuất của giáo án, suy ra từ 4 luật Learn 06, không có nguyên văn trên slide)
```
Leanbot bắt đầu hoạt động
  lặp mãi
    Di chuyển: Chạy với vận tốc Trái 30 Phải 30
    nếu  Đo xa: Phía trước có vật trong vòng 25 cm ?
    thì
      Di chuyển: Dừng
      lặp khi  Đo xa: Khoảng cách phía trước, tính bằng cm  ≤  30
      thì      Di chuyển: Chạy với vận tốc Trái -30 Phải -30
      Di chuyển: Dừng
```
```cpp
while (true) {                              // lặp mãi: kiểm tra liên tục
  LbMotion.runLRrpm(30, 30);                // luật 1: phía trước trống thì đi tiếp
  if (Leanbot.objectInFront(25)) {          // luật 2: vật ≤ 25 cm
    LbMotion.stop();
    while (Leanbot.ping() <= 30) {          // luật 3: lùi cho tới khi hơn 30 cm
      LbMotion.runLRrpm(-30, -30);
    }
    LbMotion.stop();
  }
}
```

**Phần code C++ ở trên chưa được đối chiếu với trình soạn khối thật.** Nguồn mà giáo án có chỉ cho thấy `LbMotion.runLRrpm(30, -30)` (từ Bài 10) và `LbMotion.runLR(...)`. Tên hàm `Leanbot.objectInFront`, `Leanbot.ping`, `LbMotion.stop` lấy theo tên loại khối, còn dạng chữ chính xác sinh ra, cùng việc khối "Leanbot bắt đầu hoạt động" đặt trong `setup()` hay `loop()`, thầy cần mở trình soạn, ghép khối và đọc cột code bên phải để xác nhận. Bài gốc cũng không có chương trình C++ hay file `.bduino` nào cho Bài 3.

Khối "Lặp mãi" (Repeat Forever) chỉ được nhắc ở slide Growth 03, **không có trong ảnh chương trình mẫu**. Giáo án chưa xác nhận trình soạn có khối này hay không. Nếu không, dùng `lặp khi` với điều kiện `đúng`.

## Phiếu ôn luyện

**1. Đọc đoán kết quả (dễ).** Chương trình: `nếu` Phía trước có vật trong vòng 25 cm thì Dừng. Robot đang chạy tới. Vật đứng cách 10 cm, 25 cm, 40 cm. Robot dừng hay đi tiếp ở từng trường hợp?
**Đáp án:** 10 cm: dừng. 25 cm: dừng (25 cm là "hoặc gần hơn" nên tính). 40 cm: đi tiếp.

**2. Đọc đoán kết quả.** Chương trình 2 (lặp khi khoảng cách ≤ 30 thì lùi, rồi Dừng). Robot đang cách tường 12 cm. Robot làm gì và dừng khi nào? Nếu robot đang cách tường 40 cm thì sao?
**Đáp án:** Cách 12 cm: 12 ≤ 30 nên robot lùi, lùi tới khi khoảng cách hơn 30 cm thì thoát vòng lặp và Dừng. Cách 40 cm: 40 không ≤ 30 nên vòng lặp không chạy, robot **không lùi**, chỉ Dừng.

**3. Tìm lỗi (a).** Bé ghép: `nếu` Phía trước có vật trong vòng 25 cm thì Dừng, nhưng khối `nếu` nằm ngay dưới khối Chạy, **không nằm trong vòng lặp**. Robot đâm vào vật. Sai ở đâu, sửa thế nào?
**Đáp án:** Khối `nếu` chỉ hỏi một lần lúc mới bắt đầu, lúc đó chưa có vật gần nên không dừng. Sửa: đặt `nếu` vào **trong vòng lặp** (lặp mãi) để robot hỏi liên tục.

**4. Tìm lỗi (b).** Bé muốn "lùi tới khi hơn 30 cm" nhưng gõ nhầm số, viết lặp khi khoảng cách ≤ **3**. Robot đang cách tường 12 cm. Chuyện gì xảy ra? Sửa thế nào?
**Đáp án:** 12 không ≤ 3 nên vòng lặp không chạy, robot đứng yên, không lùi. Sửa: thay 3 bằng 30 (thiếu một số 0).

**5. Sắp thứ tự.** Có 4 khối xáo trộn: (A) Di chuyển: Dừng. (B) Chạy với vận tốc Trái -30 Phải -30. (C) lặp khi khoảng cách ≤ 30. (D) Leanbot bắt đầu hoạt động. Xếp lại cho robot lùi tới khi trống rồi dừng.
**Đáp án:** D, C, B, A. B nằm **bên trong** C. A nằm **sau** C, ngoài vòng lặp.

**6. Điền số (a).** Điền số vào chỗ trống để robot dừng khi vật cách 15 cm hoặc gần hơn: `nếu` Phía trước có vật trong vòng __ cm thì Dừng. Rồi làm lại cho 20 cm.
**Đáp án:** 15, và 20. Chỉ đổi con số trong khối `Đo xa: Phía trước có vật trong vòng ? cm ?`.

**7. Điền số (b).** Điền số để robot lùi tới khi vật hoặc tường xa hơn 60 cm: lặp khi khoảng cách ≤ __ thì Chạy Trái __ Phải __.
**Đáp án:** 60. Hai tốc độ là số âm, ví dụ -30 và -30. Vì: còn ≤ 60 thì còn lùi, hơn 60 thì thoát vòng lặp.

**8. Điền số (c) và giải thích.** Chương trình đầy đủ dùng hai ngưỡng: dừng khi vật ≤ __ cm, coi là trống khi hơn __ cm. Vì sao hai số khác nhau?
**Đáp án:** 25 và 30. Nếu cùng một số, robot lùi tới vừa quá số đó là tiến lại ngay, rồi dừng, rồi lùi: giật tới lui như yo-yo. Chênh 5 cm tạo vùng đệm an toàn.

**9. Dịch nhãn.** Dịch sang tiếng Việt: (a) `Ping: Front distance in cm`. (b) `Ping: Object in front is within 25 cm distance ?`. (c) `Motion: Stop`. (d) `Motion: Run with velocity Left -30 Right -30 rpm`. (e) `When Leanbot started`.
**Đáp án:** (a) Đo xa: Khoảng cách phía trước, tính bằng cm. (b) Đo xa: Phía trước có vật trong vòng 25 cm ? (c) Di chuyển: Dừng. (d) Di chuyển: Chạy với vận tốc Trái -30 Phải -30. (e) Leanbot bắt đầu hoạt động.

**10. Làm trên máy.** Ghép khối sao cho trình soạn sinh ra đoạn code này, rồi nói robot sẽ làm gì:
```cpp
LbMotion.runLRrpm(30, 30);
if (Leanbot.objectInFront(25)) {
  LbMotion.stop();
}
```
**Đáp án:** Khối `Chạy với vận tốc Trái 30 Phải 30`, rồi khối `nếu` có điều kiện `Phía trước có vật trong vòng 25 cm ?`, bên trong là khối `Dừng`. Robot chạy tới, nếu **ngay lúc kiểm tra** vật ở ≤ 25 cm thì dừng. Chỉ kiểm tra một lần. (Lưu ý: dạng code này cần đối chiếu với trình soạn thật, xem phần Chương trình mẫu.)

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc không có câu trắc nghiệm cho Bài 3 (mục này trống trong dữ liệu bóc tách). Slide Growth 07 "Check Your Understanding!" có 4 câu **mở**, không có đáp án đúng/sai cố định. Phần gợi ý bên dưới do file bóc tách đề xuất, không phải đáp án chính thức.

1. *Sound Science: "How does an ultrasonic sensor know how far away an object is? Explain it in your own words — imagine you're explaining it to a younger student!"*
   Dịch: Cảm biến siêu âm biết vật cách bao xa bằng cách nào? Giải thích bằng lời của con, như đang giải thích cho em nhỏ.
   Gợi ý: phát sóng âm, đo thời gian tiếng vọng quay về, càng lâu càng xa.
2. *Number Thinking: "Why do we use 25 cm to stop and 30 cm to start moving again? What would happen if we used the same number for both?"*
   Dịch: Vì sao dừng ở 25 cm mà chạy lại ở 30 cm? Nếu dùng cùng một số thì sao?
   Gợi ý: cùng số thì robot giật tới lui như yo-yo, 5 cm là vùng đệm.
3. *Real Life Link: "Can you think of one more place in everyday life where a distance sensor might be really useful? Get creative — there's no wrong answer!"*
   Dịch: Con nghĩ ra thêm một nơi trong đời sống dùng cảm biến khoảng cách không? Cứ sáng tạo, không có đáp án sai.
4. *Debug It!: "Your robot reverses but never stops reversing. What do you think might be wrong with the code? How would you fix it?"*
   Dịch: Robot lùi mà không bao giờ dừng. Con nghĩ code sai ở đâu? Sửa thế nào?
   Gợi ý (theo slide Growth 03): sai điều kiện, ví dụ viết 3 thay vì 30, hoặc dây Trig/Echo lỏng làm cảm biến đọc 0 hoặc 999. Xem thêm "Ghi chú về bản gốc" mục 3.

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Tưởng `nếu` hỏi liên tục | Robot lao thẳng vào vật dù đã có khối `nếu` | Cho robot chạy thử, hỏi "khối này hỏi mấy lần?". Đặt `nếu` vào trong vòng lặp |
| Không hiểu vì sao hai số khác nhau | Bé muốn sửa 30 thành 25 "cho đẹp" | Đóng vai yo-yo (Giảng bước 3). Cho bé thử cùng một số và nhìn robot giật |
| Nhầm chiều dấu | Dùng `≥` thay `≤`, hoặc "lùi khi hơn 30" | Đọc thành lời: "còn gần thì còn lùi". Dừng lùi khi **không còn** ≤ 30 |
| Số âm là lùi | Bé đặt 30 mà robot vẫn tiến | Chỉ vào dấu trừ: "trừ là đi ngược". Cho thử -30 |
| Phân biệt "dưới" và "≤" | Slide Resolve viết "less than 15cm", ảnh ghi "<= 15cm" | Luôn nói "15 cm hoặc gần hơn". Chốt bằng đúng số trên hình |
| Gõ thiếu số 0 | Viết 3 thay vì 30 | Dạy bé đọc lại từng số trước khi bấm chạy |
| Khối `Dừng` đặt sai chỗ | Robot dừng ngay lập tức hoặc không lùi | Nhắc: khối `Dừng` của Chương trình 2 nằm **ngoài** vòng lặp |
| Cảm biến đọc 0 hoặc 999 | Robot lùi hoặc dừng vô lý | Kiểm tra dây Trig và Echo cắm chắc, đúng khe (slide Growth 03) |
| Chữ tiếng Anh khó | Bé lúng túng với ultrasonic, echo, threshold | Dùng bảng thuật ngữ, vẽ hình, nói tiếng Việt trước rồi cho xem chữ gốc |

## Ghi chú về bản gốc
1. **Chương trình mẫu trên slide chưa đủ.** Slide Learn 07 chỉ có `nếu` (kiểm tra một lần) và Learn 08 chỉ có `lặp khi`. Hai nửa này **rời nhau**. Luật 4 (Learn 06) và thẻ lỗi (d) ở Growth 03 lại nói phải kiểm tra liên tục trong vòng lặp. Bài gốc không đưa chương trình ghép hoàn chỉnh. Chương trình đầy đủ trong giáo án này là đề xuất, đã đánh dấu.
2. **Khối "Repeat Forever"** được nhắc ở Growth 03 nhưng không thấy trong ảnh chương trình mẫu nào.
3. **Lỗi "> 3" (Growth 03, thẻ b).** Thẻ nói "Robot keeps reversing forever. Make sure the reverse loop says distance > 30, not distance > 3". Nhưng mẫu ở Learn 08 viết `lặp khi ≤ 30`, không phải `> 30`. Hai cách viết là hai góc nhìn ngược nhau (lùi *cho tới khi* hơn 30, so với lùi *khi* còn ≤ 30). Nếu thay `≤ 30` bằng `≤ 3` thì robot **không lùi** (xem bài 4), chứ không lùi mãi như thẻ mô tả. Chưa rõ ý thẻ muốn nói gì. Cần thống nhất khi làm bài trong game.
4. **Thẻ lỗi (a) khuyên tăng ngưỡng từ 25 lên 30 cm** khi robot dừng không kịp. Điều này làm hai ngưỡng bằng nhau nếu giữ nguyên 30 cho phần lùi, tức là rơi vào lỗi yo-yo mà slide Learn 05 cảnh báo. Khi bé thử đổi ngưỡng, nhắc giữ ngưỡng trống lớn hơn ngưỡng dừng.
5. **"Less than" và "≤".** Slide Resolve viết "less than 15cm" và "less than 20cm" nhưng ảnh ghi `<= 15cm`, `<= 20cm`. Giáo án dùng "≤" (khớp §6 giáo trình tổng).
6. **Nhãn khối "When Leanbot started".** Slide dịch ra "Khi Leanbot bắt đầu" ở file bóc tách, còn bản vá `tools/lbeditor-vi/` ghi "Leanbot bắt đầu hoạt động". Giáo án theo bản vá.
7. **Chữ "within" của khối `Đo xa: Phía trước có vật trong vòng ? cm ?`.** Mô tả khối trong bản vá ghi "Đúng khi có vật cản **gần hơn** khoảng cách này", nghe như nhỏ hơn hẳn, còn slide Learn 07 ghi "≤ 25 cm". Không có nguồn nào cho biết đúng 25,0 cm tính hay không. Số liệu §6 giáo trình tổng là **≤ 25 cm**. Giáo án theo §6. Thầy thử trên robot thật nếu muốn chắc.
8. **Không có mâu thuẫn với §6 giáo trình tổng.** 25 cm, 30 cm, tốc độ 30 và -30 (trong khoảng -59 … 59 vòng/phút) đều khớp.
9. Một số ký hiệu S1-S6 trên ảnh sa bàn (Growth 01) không đọc rõ ý nghĩa. Ảnh tiêu đề và đoạn văn "Robot Vacuums" ở Growth 05 bị chồng chữ nhưng vẫn đọc được.
