# Bài 2 — Cánh tay kẹp thần kỳ

> Bài gốc: *Lesson 2: The Functional Bot — The Magic Gripper* · 35 slide · 4 chương (Engage 6, Learn 16, Resolve 6, Growth 7) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62121>

Buổi 4 của lộ trình (giáo trình tổng §7). Cột mốc: **bé gắp và thả được một khối**.

## Bé học xong thì làm được gì
- Nói được tay gắp **mở** ở góc **0°** và **đóng** ở góc **90°**.
- Ghép được khối `Tay gắp: Mở` và `Tay gắp: Đóng`, nạp vào robot, chạm TB1A + TB1B để chạy.
- Điền được góc vào khối `Xoay tới góc`, giữ trong khoảng **-30° … 120°**.
- Điền đúng ba ô (góc trái, góc phải, mili giây) của khối `Xoay càng Trái … Phải … trong …`.
- Xếp đúng thứ tự **gắp – chở – thả** và ghép lệnh tay gắp với lệnh di chuyển để robot gắp một khối rồi thả.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Robot Leanbot đã sạc pin, dây USB | Mỗi bé hoặc mỗi cặp một robot |
| Trình soạn khối lệnh có bản vá tiếng Việt | `tools/lbeditor-vi/`. Dạy bằng nhãn Việt trước, tắt bản vá sau (giáo trình tổng §4) |
| Khối xốp để gắp | Slide Claw Machine dùng "foam block" |
| Giấy, bút, thước đo góc (nếu có) | Vẽ hai càng ở 0° và 90° |
| Sổ kỹ sư (vở thường cũng được) | Ghi kế hoạch và suy nghĩ cuối bài |
| Bài 1 đã xong | Bé cần biết lệnh tiến, lùi. Slide Bài 2 không nhắc lại tên các khối di chuyển |
| Sa bàn Thành phố Synapse | Chỉ cần cho phần thử thách Growth. Slide không cho số đo quãng đường, phải đo trên sa bàn thật |

## Thuật ngữ của bài
Từ đã có ở §5 giáo trình tổng (tay gắp, động cơ servo, nút chạm, thứ tự các bước, khối lệnh, sửa lỗi, chạy thử, nhiệm vụ) không chép lại.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| degrees (°) | độ | Đơn vị đo góc quay của càng |
| open / close | mở / đóng | Mở là hai càng dang ra. Đóng là hai càng khép vào |
| perpendicular to the ground | vuông góc với mặt đất | Càng chúc thẳng xuống đất |
| parallel to the ground | song song với mặt đất | Càng nằm ngang, hướng vào giữa |
| safe angle range (-30° to 120°) | khoảng góc an toàn | Chỉ quay trong khoảng này để càng không gãy |
| milliseconds (ms) | mili giây | 1000 mili giây là 1 giây. Số càng nhỏ, càng quay càng nhanh |
| blocking | chờ xong mới đi tiếp | Càng quay xong rồi, robot mới làm lệnh sau |
| pick-up / drop-off | gắp / thả | Gắp là lấy khối lên. Thả là đặt khối xuống |
| retreat | lùi ra | Thả xong thì lùi ra để không đụng khối |
| warehouse / district | kho / khu | Nhận khối ở kho, mang tới khu phố đúng |
| Engineering Notebook | sổ kỹ sư | Quyển sổ ghi kế hoạch và suy nghĩ của con |

Ghi chú: slide gốc gọi bộ phận này là "gripper"; tài liệu này dùng **tay gắp** (đúng §5), mỗi bên là một **càng**.

## Khối lệnh dùng trong bài
Nhãn Việt lấy từ `tools/lbeditor-vi/leanbot_vi.js`.

| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `Leanbot.whenStarted` | Leanbot bắt đầu hoạt động | Khối mở đầu mọi chương trình |
| `LbMission.beginByTeacher_end` | Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B … Nhiệm vụ: Kết thúc | Chờ chạm hai nút cùng lúc rồi mới làm các khối bên trong |
| `LbGripper.open` | Tay gắp: Mở | Cả hai càng về **0°** |
| `LbGripper.close` | Tay gắp: Đóng | Cả hai càng về **90°** |
| `LbGripper.moveTo` | Tay gắp: Xoay tới góc ? độ | Cả hai càng tới đúng góc chọn |
| `LbGripper.moveToLR` | Tay gắp: Xoay càng Trái tới ? và càng Phải tới ? độ trong ? mili giây | Mỗi càng một góc, có thời gian quay. Làm xong mới sang lệnh sau |
| `LbDelay` | Chờ ? giây | Đứng yên một lúc rồi làm lệnh sau. **Code thật là `LbDelay(1000)`** — một hàm tự do, đơn vị mili giây (kiểm trên máy chủ biên dịch 21/10/2026) |
| Khối ghi chú (màu xám) | Ghi chú | Chữ cho người đọc, robot không làm gì |
| Khối di chuyển (Bài 1) | Di chuyển: Chạy đoạn đường ? cm, … | Dùng ở bài Claw Machine. Tên và số cụ thể xem Bài 1 |

Các khối tay gắp nằm trong nhóm **Leanbot > Gripper** của trình soạn khối.

## Dạy thế nào

### Mở bài (5 phút)
1. Thầy hỏi: "Con từng thấy robot giao hàng, cần cẩu hay máy gắp thú chưa? Nó gắp cái gì?" (slide Engage 05)
2. Thầy hỏi: "Người mình nhấc đồ bằng gì?" Bé trả lời: bằng tay. Thầy nói: "Hôm nay robot có tay."
3. Bé nói với bạn bên cạnh một ý: đồ nào robot khó gắp?
4. Thầy kể tình huống: Kỹ sư trưởng nhờ cả lớp, gói hàng chất đầy kho, khu phố đang chờ. "Hôm nay con dạy robot gắp và thả."

### Giảng (25 phút)
1. **Tay gắp ở đâu?** Thầy chỉ hai càng phía trước Leanbot. Mỗi càng có một động cơ servo nhỏ. Hỏi: "Servo làm gì?" Đáp: quay tới đúng góc rồi giữ ở đó.
2. **Hai góc cần nhớ.** Thầy vẽ lên bảng hai hình:
   - **0° = Mở**: càng chúc thẳng xuống đất.
   - **90° = Đóng**: càng nằm ngang, hướng vào giữa.
   Thầy nói: "0 là mở, 90 là đóng. Nghe ngược nhỉ? Cứ nhớ hình." Bé giơ hai tay bắt chước. Hỏi: "Góc nào dang ra? Góc nào khép vào?"
3. **Khoảng an toàn.** Càng chỉ quay từ **-30° đến 120°**. Ngoài khoảng này càng có thể gãy. Thầy hỏi: "150° có được không?" (Không.) Nếu bé chưa biết số âm: nhắc lại từ Bài 1, -30 là quay ngược về phía bên kia số 0.
4. **Hoạt động 1: Mở.** Thầy ghép trên màn hình: `Leanbot bắt đầu hoạt động` → `Nhiệm vụ: Bắt đầu khi chạm TB1A + TB1B` → `Tay gắp: Mở` → `Nhiệm vụ: Kết thúc`. Hai khối đầu là khối hồng, khối `Tay gắp: Mở` màu tím. Bé chép lại, nạp vào robot, chạm **cùng lúc** TB1A và TB1B. Hỏi: "Hai càng đang ở góc nào?"
5. **Hoạt động 2: Đóng.** Giống hoạt động 1, thay bằng `Tay gắp: Đóng`. Hỏi: "Khác gì lần trước? Nhìn code C++ bên phải xem dòng nào đổi?"
6. **Hoạt động 3: Xoay tới góc.** Khối `Tay gắp: Xoay tới góc 120 độ`, thêm một khối ghi chú "Đóng tay gắp ở 120 độ". Bé chạy rồi quan sát. Hỏi: "Càng đóng đúng 120° chưa? Có khác `Đóng` (90°) không?" Nhắc: giữ trong -30 … 120.
7. **Hoạt động 4: Từng càng, có thời gian.** Thầy chỉ ba ô của khối `Xoay càng Trái tới ? và càng Phải tới ? độ trong ? mili giây`: **ô 1 càng trái, ô 2 càng phải, ô 3 thời gian**. Bé chép chương trình ở mục "Chương trình mẫu". Hỏi: "Lần nào càng quay nhanh? Lần nào chậm? Vì sao?" (100 mili giây là nhanh, 5000 mili giây là chậm.) Nói: khối này làm xong rồi chương trình mới đi tiếp.
8. **Thứ tự gắp.** Thầy vẽ bốn bước: **Tới gần vật → Mở càng → Hạ vào đúng chỗ → Đóng càng**. Hỏi: "Nếu đóng càng trước khi tới nơi thì sao?" (Robot chộp hụt.) Thầy nói: "Kỹ sư giỏi nghĩ trước, ghép khối sau."
9. **Thứ tự thả.** Bốn bước: **Đi tới → Đứng đúng chỗ → Mở càng (thả) → Lùi ra**. Hỏi: "Vì sao phải lùi ra?" (Để không làm đổ khối vừa thả.)
10. **Gắp – chở – thả.** Thầy ghép cả ba: gắp ở kho, chở tới khu phố, thả. "Đóng càng trước khi robot chạy. Mở càng chỉ khi đã tới nơi." Nhấn mạnh: **đúng thứ tự, mới giao được hàng**. Sau khi đóng càng, thầy cho robot **chờ 1 giây** cho càng kẹp chắc rồi mới chạy (xem mục "Ghi chú về bản gốc": số này lấy từ Bài 14).

### Bé tự làm (50 phút)
1. **Máy gắp thú (Claw Machine)**, đề của khóa gốc. Bé tự ghép, slide không cho chương trình mẫu:
   1. Bắt đầu với càng **mở**.
   2. **Tiến** tới khối xốp.
   3. **Đóng** càng để gắp.
   4. **Lùi** về chỗ xuất phát.
   5. **Mở** càng để thả khối.
2. Bé viết kế hoạch vào sổ kỹ sư **trước**, rồi mới ghép khối.
3. Chạy thử. Nếu hụt, thầy nhắc ba câu hỏi: Robot có cần tiến gần hơn không? Càng mở đủ rộng chưa? Các khối đúng thứ tự chưa?
4. **Thử thách (bé nhanh):** hai chuyến giao. Lấy bình nước ở khu D (Waterfront District) giao khu C (Green Energy). Lấy bình thứ hai ở khu D giao khu H (Digital Downtown). Thưởng thêm: quay về khu D. Làm theo 5 bước: **Đọc → Vạch đường → Viết → Lập trình → Chạy thử**. Quãng đường đo trên sa bàn thật, slide không cho số.

### Chốt bài (5 phút)
1. Thầy hỏi: "Tay gắp mở ở góc nào? Đóng ở góc nào?" (0° và 90°.)
2. Hỏi: "Gắp rồi mới chở, hay chở rồi mới gắp?" (Gắp, chở, thả.)
3. Hỏi: "Gặp lỗi thì làm gì?" (Tìm chỗ sai, sửa. Ai cũng mắc lỗi.)
4. Bé viết 3 dòng vào sổ kỹ sư: phần khó nhất hôm nay? Lần sau con làm khác chỗ nào? Con tự hào điều gì? (Không có đáp án sai.)
5. Nhắc bài sau: **Bài 3, Mắt thần siêu âm**. Việc về nhà của khóa gốc: vẽ thành phố của con, thêm ít nhất 2 khu mới, vạch đường giao hàng giữa các khu.

## Chương trình mẫu
Mọi chương trình thật đều nằm trong khung `Leanbot bắt đầu hoạt động` → `Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B` … `Nhiệm vụ: Kết thúc`. Dưới đây chỉ ghi phần thân và code C++ tương ứng. Phần code C++ của `Mở`, `Đóng`, `Xoay tới góc`, khung nhiệm vụ lấy từ chương trình mẫu `Neutralizer.bduino` và giáo trình tổng §4. Slide Bài 2 **không có** mã C++.

**Hoạt động 1 — Mở**
- Nhiệm vụ: Bắt đầu khi chạm TB1A + TB1B
  - Tay gắp: Mở
- Nhiệm vụ: Kết thúc

```cpp
void setup() {
  Leanbot.begin();
}

void loop() {
  LbMission.begin(TB1A + TB1B);
  LbGripper.open();
  LbMission.end();
}
```

**Hoạt động 2 — Đóng:** như trên, thay dòng giữa bằng `LbGripper.close();`

**Hoạt động 3 — Đóng tới 120°:** thay dòng giữa bằng:

```cpp
  // Close the gripper at 120 degrees
  LbGripper.moveTo(120);
```

**Hoạt động 4 — Từng càng, nhanh rồi chậm**
- Nhiệm vụ: Bắt đầu khi chạm TB1A + TB1B
  - Ghi chú: 1. Nhanh
  - Tay gắp: Xoay càng Trái tới 120 và càng Phải tới -30 độ trong 100 mili giây
  - Chờ 2 giây
  - Ghi chú: 2. Chậm
  - Tay gắp: Xoay càng Trái tới -30 và càng Phải tới 120 độ trong 5000 mili giây
  - Chờ 2 giây
- Nhiệm vụ: Kết thúc

C++ của hai khối `Xoay càng Trái… Phải…` và `Chờ` **chưa lấy được** (không có trên slide, không có trong chương trình mẫu của khóa). Muốn biết, mở trình soạn khối và đọc cột code bên phải. Giáo trình tổng §4 từng ghi `Leanbot.delay(1.0);` — **sai**: lớp `cLeanbot` không có hàm `delay`. Dạng biên dịch được là `LbDelay(1000);`.

**Máy gắp thú — gợi ý khung (slide không đưa mẫu)**
- Nhiệm vụ: Bắt đầu khi chạm TB1A + TB1B
  - Tay gắp: Mở
  - (khối tiến, xem Bài 1)
  - Tay gắp: Đóng
  - Chờ 1 giây
  - (khối lùi, xem Bài 1)
  - Tay gắp: Mở
- Nhiệm vụ: Kết thúc

```cpp
  LbMission.begin(TB1A + TB1B);
  LbGripper.open();
  // ... tiến tới khối xốp (code của khối di chuyển, xem Bài 1)
  LbGripper.close();
  LbDelay(1000);        // 1 giây = 1000 ms; đã biên dịch thật, 21/10/2026
  // ... lùi về chỗ xuất phát
  LbGripper.open();
  LbMission.end();
```

## Phiếu ôn luyện

**Bài 1. Dịch nhãn** (dễ)
**Đề:** Nối khối tiếng Anh với nhãn tiếng Việt.
a) `Gripper: Open`  b) `Gripper: Close`  c) `Gripper: Rotate to 45 degrees`  d) `Wait for 2 seconds`
1) Chờ 2 giây  2) Tay gắp: Xoay tới góc 45 độ  3) Tay gắp: Đóng  4) Tay gắp: Mở

**Đáp án:** a-4, b-3, c-2, d-1. Hỏi thêm cho bé: khối `Mission: End` tiếng Việt là
**Nhiệm vụ: Kết thúc**.

**Bài 2. Đọc đoán kết quả** (dễ)
**Đề:** Chương trình sau làm robot thế nào, hai càng ở góc bao nhiêu khi xong?
- Nhiệm vụ: Bắt đầu khi chạm TB1A + TB1B
  - Tay gắp: Xoay tới góc 0 độ
  - Chờ 2 giây
  - Tay gắp: Xoay tới góc 90 độ
- Nhiệm vụ: Kết thúc

**Đáp án:** Càng mở (0°), chờ 2 giây, rồi đóng (90°). Khi xong, hai càng đang đóng ở 90°. Chương trình chỉ chạy sau khi chạm cùng lúc TB1A và TB1B.

**Bài 3. Điền số** (vừa)
**Đề:** Điền số vào chỗ trống.
a) Muốn càng mở hẳn bằng khối `Xoay tới góc`, điền ___ độ.
b) Muốn càng đóng bằng khối `Xoay tới góc`, điền ___ độ.
c) Trong các số 150, 120, 90, -30, -90, 0, số nào **không** an toàn?

**Đáp án:** a) **0**, vì 0° là mở. b) **90**, vì 90° là đóng. c) **150 và -90**, vì ngoài khoảng -30 … 120, càng có thể gãy.

**Bài 4. Sắp thứ tự** (vừa)
**Đề:** Xếp lại cho robot gắp một khối rồi thả về chỗ cũ: (A) Tay gắp: Đóng (B) Lùi (C) Tay gắp: Mở (thả) (D) Tiến tới khối xốp (E) Tay gắp: Mở (chuẩn bị).

**Đáp án:** **E → D → A → B → C**. Mở trước để khối lọt vào giữa, tiến tới, đóng để gắp, lùi, mở để thả.

**Bài 5. Tìm lỗi** (vừa)
**Đề:** Robot không gắp được khối. Chương trình: Tiến tới khối → Tay gắp: Mở → Tay gắp: Đóng → Lùi. Sai ở đâu?

**Đáp án:** Càng chỉ mở **sau khi** robot đã tiến sát khối, nên lúc tiến càng còn khép và có thể đẩy khối đi. Sửa: đặt `Tay gắp: Mở` **đầu chương trình**, trước khi tiến. Chỉ sửa một chỗ này rồi chạy thử lại.
Biến thể: chương trình "Tiến → Mở → Đóng → Lùi" chuyển thành "Tiến → Lùi → Đóng". Sai: đóng càng **sau khi** đã lùi, khối bị bỏ lại. Sửa: đóng càng **trước** khi lùi.

**Bài 6. Đọc đoán kết quả** (khó)
**Đề:** Chương trình hai bước:
1) `Xoay càng Trái tới 120 và càng Phải tới -30 độ trong 100 mili giây`, chờ 2 giây.
2) `Xoay càng Trái tới -30 và càng Phải tới 120 độ trong 5000 mili giây`, chờ 2 giây.
Bước nào càng quay nhanh hơn? Mỗi bước mất bao nhiêu giây để quay? Hai càng trong cùng một bước có quay nhanh bằng nhau không?

**Đáp án:** Bước 1 nhanh hơn. Bước 1 quay trong 0,1 giây (100 mili giây), bước 2 quay trong 5 giây (5000 mili giây). Trong cùng một bước, hai càng dùng **chung** một thời gian nên tới đích cùng lúc. Số mili giây càng nhỏ thì quay càng nhanh.

**Bài 7. Điền số** (khó)
**Đề:** Càng trái 120°, càng phải -30°, quay trong 2 giây. Điền ba ô của khối. Nếu đổi thành 0,5 giây thì ô thời gian là bao nhiêu?

**Đáp án:** `Xoay càng Trái tới` **120**, `càng Phải tới` **-30**, `trong` **2000** mili giây (2 giây × 1000). Với 0,5 giây: **500** mili giây.

**Bài 8. Làm trên máy** (khó)
**Đề:** Mở trình soạn khối lệnh, ghép khối để cột code C++ bên phải ra đúng đoạn này. Kiểm tra bằng mắt: giống từng dòng là đúng.
```cpp
LbMission.begin(TB1A + TB1B);
LbGripper.open();
LbGripper.moveTo(120);
LbMission.end();
```

**Đáp án:** Ghép: `Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B` → `Tay gắp: Mở` → `Tay gắp: Xoay tới góc 120 độ` → `Nhiệm vụ: Kết thúc`. Khung `void setup()` / `void loop()` do trình soạn tự sinh. Hỏi thêm cho bé: ở cuối hai càng đang ở góc **120°**.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc **không có câu hỏi trắc nghiệm** (CYU/Quiz) ở 35 slide của bài này, nên không có đáp án chính thức để chép. Chỉ có câu thảo luận và suy ngẫm, không có đáp án đúng:
- *"Have you ever seen a delivery robot, a crane, or a mechanical arm in real life — or in a movie? What did it pick up? How do you think it worked?"* — Con đã từng thấy robot giao hàng, cần cẩu hay cánh tay máy ngoài đời hay trong phim chưa? Nó nhấc cái gì? Con nghĩ nó hoạt động thế nào?
- *"What kinds of objects would be tricky for a robot to pick up?"* — Đồ vật nào sẽ khó cho robot nhấc?
- Activity #3: *"Did your robot's grippers close to exactly 120°?"* — Hai càng có đóng đúng 120° không?
- Activity #4: *"Did the individual grippers move at the same speed?"* — Hai càng có di chuyển cùng tốc độ không? (Slide không nêu đáp án. Suy từ chương trình, không phải từ slide: hai bước chạy 100 và 5000 mili giây nên không cùng tốc độ giữa hai bước; trong một bước hai càng dùng chung thời gian.)
- Suy ngẫm (Growth 04): *What was the trickiest part of today's mission? What would you do differently next time? What are you most proud of today?* — Phần khó nhất? Lần sau làm khác chỗ nào? Điều con tự hào nhất?

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| 0° là mở, 90° là đóng (ngược cảm giác) | Bé nhầm "90 là mở rộng" | Vẽ hình hai càng ở mỗi góc, dán cạnh robot. Cho bé tự giơ tay |
| Số âm -30° | Bé không hiểu -30 là gì | Quay lại số âm ở Bài 1. Cho thấy robot quay thử ở -30 |
| 120° vẫn gọi là "đóng" | Bé hỏi "sao đóng mà 120, không phải 90?" | Giải thích: 90° là vị trí Đóng chuẩn, 120° là đóng sát hơn, đây là giới hạn trên |
| Ba ô số của khối trái/phải/thời gian | Điền thời gian vào ô góc | Chỉ từng ô: ô 1 trái, ô 2 phải, ô 3 thời gian. Đọc to khi điền |
| Mili giây | Điền 2 thay vì 2000 | Nhắc 1 giây = 1000 mili giây. Bảng đổi: 0,5 giây = 500 |
| Khối chờ xong mới đi tiếp | Bé tưởng chương trình bị đứng | Cho bé thử 5000 mili giây, đếm to cùng bé |
| Chạm hai nút | Chỉ chạm một nút nên robot không chạy | Tập chạm **cùng lúc** TB1A và TB1B trước khi nạp |
| Quên mở càng trước khi tiến | Robot chộp hụt | Hỏi: "Càng đang mở hay đóng lúc tiến?" Dùng bảng thứ tự gắp |
| Quên lùi ra sau khi thả | Robot đẩy đổ khối | Hỏi: "Con thả xong thì robot ở đâu?" |
| Chưa chắc lệnh tiến lùi | Bé không nhớ khối di chuyển | Ôn nhanh Bài 1 trước hoạt động Claw Machine |

## Kiểm nghiệm cuối bài

Gắp được chưa, nhìn là biết. Nhưng **gắp chắc** hay không thì phải thử.

**Phép thử chính (5 phút).**

1. Đặt khối xốp trước robot, cách khoảng 15 cm.
2. Nạp chương trình Máy gắp thú, rút cáp, chạm hai nút.
3. Nhìn kỹ **thứ tự**: càng phải mở **trước khi** robot tiến. Đây là lỗi hay gặp nhất.
4. Robot gắp xong: **nhấc cả robot lên khỏi bàn 5 giây**. Khối vẫn nằm trong càng là đạt.
5. Thả robot xuống, cho chạy nốt phần lùi và mở càng. Khối phải rơi đúng chỗ, robot lùi ra.

Bước 4 là phép thử thật: chở hàng mà rơi dọc đường thì coi như chưa gắp được. Nếu rơi, thêm
`LbDelay(1000)` ngay sau khi đóng càng cho servo kẹp chặt rồi mới chạy.

| Con thấy | Sửa |
|---|---|
| Robot húc khối văng đi | Đặt `Tay gắp: Mở` ở **đầu** chương trình |
| Càng khép vào chỗ trống | Cho tiến thêm vài cm |
| Gắp được rồi tuột khi chạy | Thêm `LbDelay(1000)` sau khi đóng càng |
| Một càng khép, một càng không | Càng đó cần hiệu chỉnh, không phải lỗi chương trình |
| Càng kêu rè rè | Góc ngoài khoảng −30…120. **Tắt robot ngay** kẻo gãy càng |

## Ghi chú về bản gốc
Do file bóc tách phát hiện, cùng đối chiếu với giáo trình tổng §6:
- **Số liệu khớp §6:** mở 0°, đóng 90°. Không mâu thuẫn.
- **"Chờ 1 giây sau khi đóng"** không có trong slide Bài 2. Số này lấy từ Bài 14 (§6 giáo trình tổng). Slide Bài 2 chỉ có `Chờ 2 giây` ở Activity #4 và không chờ sau khi đóng. Giáo án này đưa 1 giây vào Claw Machine như thói quen, không phải yêu cầu của slide.
- **Mâu thuẫn nhỏ về "đóng":** Activity #3 gọi 120° là "close at 120 degrees", trong khi 90° mới là vị trí Đóng. Ghi cả hai, dạy: 90° là Đóng chuẩn, 120° là giới hạn trên của khoảng an toàn.
- **Slide Learn 12 "The Gripper Commands"** nói về đánh trống ("drum hit", "drumstick", "beat") và nhắc "Open/Close Left/Right Gripper" riêng, có vẻ chép nhầm từ bài khác. Các khối mở/đóng riêng từng càng **không có** trong bộ khối thật (chỉ có `Xoay càng Trái … Phải …`). Giáo án này không dùng slide đó.
- **Giả mã** `MOVE`, `GRIP_OPEN`, `GRIP_CLOSE` (Learn 15, Resolve 03, Growth 03) không phải khối thật. Khối thật là `Tay gắp: Mở` / `Đóng`.
- **Resolve 05** ("điều khiển chuyển động, âm thanh, đèn và tay gắp", "dự án cuối") giọng kết khóa, lệch bối cảnh bài 2.
- **Growth 05** ghi "4 Districts Served" nhưng sa bàn ở Growth 01 có 9 khu (A … H và CRL). Không khớp.
- **Chưa lấy được:** mã C++ của khối `Xoay càng Trái … Phải …` và `Chờ`; nhãn ô số trên cạnh sa bàn (hình quá nhỏ); số đo quãng đường cho hai chuyến giao.
