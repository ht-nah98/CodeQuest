# Khóa Leanbot AIROC tiếng Việt

Nguồn chuẩn cho: chương trình học tiếng Việt bám theo khóa **SYNAPSE CITY: Robotics & AI
Explorer** của Pythaverse, thuật ngữ Anh ↔ Việt dùng trong khóa đó, lộ trình và hệ thống
ôn luyện. Dữ liệu khảo sát thô: [`../research/pythaverse-synapse-city.md`](nen-tang/pythaverse.md).
Luật thi: [`airoc-2026.md`](../product/airoc-2026.md). Việt hóa trình soạn khối: [`../../tools/lbeditor-vi/`](../../tools/lbeditor-vi).

> Khóa này **không thay** khóa gốc. Bé vẫn phải tự hoàn thành 26 hoạt động trên Plearn để
> lấy chứng chỉ. Tài liệu này là bản tiếng Việt đi **song song**, để bé hiểu được bài rồi
> mới bấm qua bản tiếng Anh.

## 1. Vì sao cần bản tiếng Việt

Khóa gốc là **tiếng Anh 100%**: 19 bài H5P, khoảng 670 slide, không có phụ đề hay bản
dịch nào. Học sinh đích là **lớp 4** (9–10 tuổi), tiếng Anh chưa đủ để tự đọc slide.

Rào cản đo được khi khảo sát:

| Rào cản | Số liệu |
|---|---|
| Slide bài học, toàn tiếng Anh | ~670 |
| Nhãn khối Leanbot còn tiếng Anh trong chế độ `?lang=vi` | 30 / 48 |
| Câu hỏi kiểm tra (CYU/Quiz), toàn tiếng Anh | ≥ 43 câu |
| Công cụ ngoài không có tiếng Việt | Teachable Machine, Scratch, PIDE, PGit, Gateway |

Thêm ba thứ khóa gốc giả định bé đã biết mà bé lớp 4 Việt Nam chưa chắc có: đọc số âm,
khái niệm góc và độ, và đơn vị đo (cm / mm / rpm / Hz).

## 2. Học để đi thi hạng nào

Bé 9–10 tuổi thuộc hạng **Creator (9–12 tuổi)**:

| | Creator |
|---|---|
| Robot | 1 × Leanbot Standard |
| Ngôn ngữ | Blockly |
| Số tham số khối được phép | 8 |
| Thử thách | Màu khối ô nhiễm **đã biết trước** — không bắt buộc dùng AI |
| Thời gian mỗi lượt | 2 phút, làm nhiệm vụ theo thứ tự nào cũng được |

Hệ quả cho việc dạy: **Bài 1–4 và 10–16 là phần phải thật chắc** (robot, cảm biến, dò
vạch, ba nhiệm vụ). Bài 5–9 (AI, Teachable Machine) là phần bắt buộc để **lấy chứng chỉ
khóa học** nhưng **không dùng khi thi** hạng Creator. Dạy đủ, nhưng không cần luyện sâu.

## 3. Bản đồ khóa gốc → khóa tiếng Việt

Khóa gốc: 21 mục, 26 hoạt động tính tiến độ. Cột "Việt" là tên dùng khi dạy.

### Khởi động (video, không có slide)

| # | Gốc | Việt | Nội dung |
|---|---|---|---|
| GS1 | Getting Started: System Configuration | Làm quen và chăm sóc Leanbot | 7 video: bộ kit, sạc pin, giữ gìn, kiểm tra cảm biến, cân chỉnh tay gắp / đèn LED / động cơ bước |
| GS2 | Getting Started: First Program | Chương trình đầu tiên | 4 video: Blockly Editor, chép code sang PIDE, nạp xuống robot thật, chương trình C++ đầu tiên |
| GS3 | Getting Started: Pythaverse Tools | Bộ công cụ Pythaverse | 4 video: PLearn, PGit, Leanbot IDE, Blockly Editor |

### 16 bài chính (mỗi bài 4–5 chương: Engage → Learn → Resolve → Growth)

| # | Gốc | Việt | Khái niệm cốt lõi | Slide |
|---|---|---|---|---|
| 1 | Hello Leanbot, Let's get moving | Chào Leanbot! Cùng di chuyển | Thứ tự các bước; tiến / lùi theo cm; quay tại chỗ theo độ; số âm | 45 |
| 2 | The Functional Bot: The Magic Gripper | Cánh tay kẹp thần kỳ | Servo và góc; mở / đóng / xoay tới góc; ghép gắp–chở–thả | 35 |
| 3 | Detect Obstacles with Ultrasonic Sensors | Mắt thần siêu âm | Đo khoảng cách bằng sóng âm; `nếu`; `lặp khi`; ngưỡng 25 cm / 30 cm | 26 |
| 4 | Follow the Smart road | Đi theo đường thông minh | 4 mắt hồng ngoại; cân chỉnh đen–trắng; mã vạch 1..14; `switch` | 27 |
| 5 | What is Data? | Dữ liệu là gì? | AI học từ dữ liệu; dữ liệu tốt / xấu | 50 |
| 6 | Image Classification | Dạy robot phân loại ảnh | Lớp (class), thu mẫu, huấn luyện, điểm tin cậy | 45 |
| 7 | Basic Sound Classification | Âm thanh vô hình | Rung động, biên độ, tần số, ảnh phổ | 45 |
| 8 | Advanced Sound Classification | Phân loại âm thanh nâng cao | Thu mẫu cân bằng, ngưỡng, ma trận nhầm lẫn | 90 |
| 9 | Pose Recognition | Nhận diện dáng người | Mô hình có sẵn, khung xương, đạo đức AI | 59 |
| 10 | See your robot before it moves | Nhìn robot chạy thử trước | Bản Sao Số; nghĩ trước, làm sau | 40 |
| 11 | Control and Explore Robot Paths | Điều khiển đường đi của robot | Dự đoán → chạy → so sánh; chỉnh từng tham số một | 48 |
| 12 | From Virtual to Real Robot | Từ robot ảo sang robot thật | Nạp code qua USB; sai lệch ảo / thật; Thử–Quan sát–Chỉnh–Lặp | 46 |
| 13 | Mission 1: Containment | Nhiệm vụ 1: Khoanh vùng | Dò vạch + đếm ngã tư + đẩy khối; 45 điểm / khối | 26 |
| 14 | Mission 2: Neutralizer Deployment | Nhiệm vụ 2: Rải chất trung hòa | Gắp từ kho S1–S6, chở, thả đúng màu; 160 điểm / cặp | 29 |
| 15 | Mission 3: Analysis Retrieval | Nhiệm vụ 3: Mang mẫu về phòng lab | Quay đầu 180° khi đang kẹp; tìm lại vạch; 100 điểm / khối | 29 |
| 16 | The Ultimate Environmental Challenge | Nhiệm vụ tổng hợp | Ghép ba nhiệm vụ trong 2 phút; chia hàm; quản lý thời gian | 30 |

### Bài nộp

| Gốc | Việt | Mở khóa sau |
|---|---|---|
| MINI PROJECT 1: The AI Data Trainer | Dự án 1: Huấn luyện viên dữ liệu AI | Bài 6 |
| MINI PROJECT 2: Autonomous Driving License | Dự án 2: Bằng lái robot tự hành | Bài 11 |
| Mission 1 – The Containment Protocol | Nộp Nhiệm vụ 1 | Bài 13 |
| Mission 2 – The Neutralizer Deployment | Nộp Nhiệm vụ 2 | Bài 14 |
| MINI PROJECT 5: Mission 3 – The Analysis Retrieval | Nộp Nhiệm vụ 3 | Bài 15 |
| GRAND CAPSTONE PROJECT | Dự án tổng kết | Nộp Nhiệm vụ 1 |
| E-Certification | Chứng chỉ điện tử | Hết khóa |

## 4. Phương pháp: nhìn và học song song

Mỗi bài dạy theo **ba lớp**, bé thấy cùng một việc ở ba dạng:

```
┌─ Khối tiếng Việt ─────────┐   ┌─ Code C++ sinh ra ───────────┐
│ Tay gắp: Đóng             │ → │ LbGripper.close();           │
│ Chờ 1 giây                │ → │ LbDelay(1000);               │
└───────────────────────────┘   └──────────────────────────────┘
                  ↓ bé tự đọc lại bằng nhãn gốc
         ┌─ Khối tiếng Anh trên Plearn ─┐
         │ Gripper: Close               │
         └──────────────────────────────┘
```

Vì sao làm được: trình soạn khối của Pythaverse **tự sinh code C++ Arduino ngay bên phải**
màn hình. Khối đổi thì code đổi theo. Đây là công cụ đối chiếu sẵn có, không cần dựng thêm.

Cách dùng trong buổi học:
1. Thầy mở trình soạn khối **có bản vá tiếng Việt** (`tools/lbeditor-vi/`), dạy bằng khối tiếng Việt.
2. Bé nhìn cột code bên phải, nhận ra mỗi khối thành một dòng lệnh.
3. Trước khi bé vào Plearn làm bài, thầy tắt bản vá (hoặc đổi `?lang=en`) để bé thấy nhãn
   gốc tiếng Anh, đối chiếu với bảng thuật ngữ ở §5.

Việc này **phải làm đúng chiều**: dạy tiếng Việt trước, đối chiếu tiếng Anh sau. Dạy
thẳng tiếng Anh thì bé học thuộc vị trí khối chứ không hiểu nghĩa.

## 5. Thuật ngữ dùng thống nhất

Mọi giáo án, phiếu bài tập và câu nói trong lớp dùng đúng cột "Việt". Không đặt thêm từ mới.

### 5.1 Khái niệm lập trình

| Anh | Việt | Nói với bé |
|---|---|---|
| Sequence | Thứ tự các bước | Làm đúng thứ tự thì robot mới hiểu |
| Command / Block | Lệnh / Khối lệnh | Mỗi khối là một câu lệnh |
| Program | Chương trình | Cả chuỗi lệnh ghép lại |
| Loop | Vòng lặp | Làm đi làm lại |
| Condition / If | Điều kiện / Nếu | Nếu đúng thì làm, không thì thôi |
| Variable | Biến (hộp nhớ) | Cái hộp để robot nhớ một con số |
| Function / My block | Hàm (phép thuật) | Gói nhiều lệnh thành một lệnh có tên |
| Parameter | Tham số | Con số điền vào ô trống của khối |
| Debug | Sửa lỗi | Tìm chỗ sai rồi chữa. Ai cũng mắc lỗi |
| Test | Chạy thử | Cho robot chạy xem đúng chưa |
| Threshold | Ngưỡng | Mốc để phân biệt, ví dụ đen hay trắng |
| Calibration | Cân chỉnh | Dạy robot phân biệt đen với trắng |

### 5.2 Bộ phận robot

| Anh | Việt | Nói với bé |
|---|---|---|
| Leanbot Standard Kit | Bộ Leanbot cơ bản | Robot và các món đi kèm |
| Arduino Nano | Bo mạch Arduino Nano | Bộ não của robot |
| Stepper motor | Động cơ bước | Bánh xe quay từng nấc nhỏ nên đi rất chuẩn |
| Servo motor | Động cơ servo | Quay tới đúng một góc rồi giữ ở đó |
| Gripper | Tay gắp | Hai càng kẹp để gắp khối |
| Ultrasonic sensor | Cảm biến siêu âm | Mắt thần đo xa bằng sóng âm |
| IR line sensor | Cảm biến vạch | Bốn mắt nhìn xuống sàn để thấy vạch đen |
| Touch button (TB1A, TB1B) | Nút chạm | Chạm tay vào để ra lệnh |
| RGB LED | Đèn LED | Vòng đèn đổi màu được |
| Buzzer | Còi | Phát tiếng bíp |
| Powerbank port | Cổng sạc | Chỗ cắm dây sạc pin |

### 5.3 Nền tảng và công cụ

| Anh | Việt | Địa chỉ |
|---|---|---|
| PLearn | Trang học PLearn | <https://learn.pythaverse.space/> |
| Student Workspace | Góc học sinh | <https://pythaverse.space/student-workspace/dashboard> |
| Leanbot Blockly Editor | Trình soạn khối lệnh | <https://ide.pythaverse.space/lbeditor/> |
| Leanbot IDE / PIDE | Trình soạn code C++ | <https://ide.pythaverse.space/#/code> |
| PGit | Kho lưu code | <https://git.pythaverse.space/> |
| Digital Twin / Twinspace | Bản Sao Số | mở từ bài học trên PLearn |
| Gateway | Cầu nối robot thật ↔ Bản Sao Số | <https://meta.pythaverse.space/gateway?lang=en> |
| Teachable Machine | Máy học được dạy | <https://teachablemachine.withgoogle.com/> |

### 5.4 Sa bàn và nhiệm vụ

| Anh | Việt |
|---|---|
| Synapse City | Thành phố Synapse |
| Sector A–H | Khu A–H |
| Pollution block / source | Khối ô nhiễm |
| Containment area | Khu cách ly |
| Neutralizer | Khối trung hòa |
| Neutralizer storage S1–S6 | Kho trung hòa S1–S6 |
| CRL (Crisis Response Lab) | Phòng Thí Nghiệm (CRL) |
| Mission | Nhiệm vụ |
| Junction | Ngã tư (chỗ hai vạch đen cắt nhau) |
| Line following | Bám vạch |
| Score / Penalty | Điểm / Phạt |

### 5.5 Nhãn 48 khối Leanbot

Bảng đầy đủ Anh → Việt nằm trong [`../../tools/lbeditor-vi/leanbot_vi.js`](../../tools/lbeditor-vi/leanbot_vi.js)
(mỗi khối kèm tooltip giải thích cho bé). Những khối hay dùng nhất khi thi:

> **Đơn vị là ô chọn trên khối, không cố định.** `Chạy đoạn đường` chọn được **cm** hoặc **mm**;
> `Chạy với vận tốc` chọn được **vòng/phút** hoặc **bước/giây**. Bài học dùng cm và vòng/phút;
> các chương trình mẫu chính thức dùng mm và bước/giây. Cùng một khối, khác ô chọn — không
> phải hai khối khác nhau.

| Khối | Nhãn gốc | Nhãn Việt |
|---|---|---|
| `LbMotion.run` | Motion: Run with velocity Left ? Right ? | Di chuyển: Chạy với vận tốc Trái ? Phải ? |
| `LbMotion.waitDistanceMm` | Motion: Keep running for ? cm | Di chuyển: Chạy đoạn đường ? cm |
| `LbMotion.waitRotationDeg` | Motion: Keep turning for ? degrees | Di chuyển: Rẽ góc ? độ |
| `LbMotion.stopAndWait` | Motion: Stop | Di chuyển: Dừng |
| `LbGripper.open` / `close` | Gripper: Open / Close | Tay gắp: Mở / Đóng |
| `LbGripper.moveTo` | Gripper: Rotate to ? degrees | Tay gắp: Xoay tới góc ? độ |
| `Leanbot.ping` | Ping: Front distance in cm | Đo xa: Khoảng cách phía trước, tính bằng cm |
| `Leanbot.pingCm() <= ?` | Ping: Object in front is within ? cm ? | Đo xa: Phía trước có vật trong vòng ? cm ? |
| `LbIRLine.doManualCalibration` | IRLine: Do manual calibration with ? button | Cảm biến vạch: Cân chỉnh bằng nút ? |
| `LbIRLine.read` | IRLine: Read sensors | Cảm biến vạch: Đọc cảm biến |
| `LbIRLine.value` | IRLine: Sensor values (2L, 0L, 1R, 3R) | Cảm biến vạch: Giá trị 4 mắt (2T, 0T, 1P, 3P) |
| `LbIRLine.isBlackDetected` | IRLine: Black is detected ? | Cảm biến vạch: Có thấy màu đen? |
| `LbTouch.read(TB1A)` | Touch: wait until ? touched | Nút chạm: Chờ tới khi ? được chạm (thư viện **không có** `waitUntil`) |
| `LbMission.beginByTeacher_end` | Mission: Begin when ? combo touched | Nhiệm vụ: Bắt đầu khi chạm cùng lúc ? |
| `LbMission.end` | Mission: End | Nhiệm vụ: Kết thúc |

## 6. Con số phải nhớ đúng

Lấy từ slide bài học và chương trình mẫu chính thức. Sai số này là robot chạy sai.

| Thứ | Giá trị | Nguồn |
|---|---|---|
| Khoảng tốc độ bánh xe | **−59 … 59 vòng/phút**, hoặc **−2000 … 2000 bước/giây** | Bài 1, slide Learn 08 |
| Tốc độ nên dùng khi mới tập | 30–50 % | Bài 13, câu hỏi kiểm tra |
| ⚠ **Mâu thuẫn:** chương trình mẫu chính thức chạy **2000 bước/giây** = hết cỡ, không phải 30–50 % | | so `Fullmision.ino` với Bài 13 |
| Tay gắp mở | góc **0°** | Bài 2 + `LbGripper.open` |
| Tay gắp đóng | góc **90°** | Bài 2 + `LbGripper.close` |
| Chờ sau khi đóng tay gắp | **1 giây** | Bài 14, câu hỏi kiểm tra |
| Ngưỡng dừng trước vật cản | **≤ 25 cm** | Bài 3 |
| Ngưỡng coi là trống | **> 30 cm** | Bài 3 |
| Tốc độ bám vạch (chương trình mẫu) | Trái **190** / Phải **1500** bước/giây khi quẹo | `FollowLine_EN.bduino` |
| Bước dò vạch mỗi vòng lặp | **1 mm** | `FollowLine_EN.bduino` |
| Mã 4 mắt cảm biến | 1 … 14; **6** = hai mắt giữa thấy đen (đi thẳng) | `FollowLine_EN.bduino` |
| Thời gian mỗi lượt thi | **2 phút** | Luật AIROC 2026 |
| Điểm khoanh vùng / trung hòa / phân tích / về CRL | **45 / 160 / 100 / 40** | Luật AIROC 2026 |
| Sa bàn | **4 ft × 4 ft** (1,2192 m) | Luật AIROC 2026 |
| Bo mạch chọn khi nạp code | Arduino **Uno** hoặc **Nano** | Hướng dẫn nạp code của Pythaverse |

## 7. Lộ trình

20 buổi, mỗi buổi 90 phút (45 phút học + 45 phút thực hành trên robot thật).

| Buổi | Nội dung | Cột mốc |
|---|---|---|
| 0 | Cài đặt: tài khoản, Chrome, dây USB, sạc pin, bản vá tiếng Việt | Nạp được chương trình nháy đèn xuống robot |
| 1 | GS1 + GS2: chăm sóc robot, chương trình đầu tiên | Robot kêu bíp theo lệnh của bé |
| 2 | Bài 1 phần tiến / lùi | Robot đi thẳng đúng 15 cm |
| 3 | Bài 1 phần quay tại chỗ | Robot quay đúng 90° |
| 4 | Bài 2: tay gắp | Gắp và thả một khối |
| 5 | Bài 3: cảm biến siêu âm | Dừng trước vật cản ở 25 cm |
| 6–7 | Bài 4: cân chỉnh và bám vạch | Robot bám hết một đoạn vạch đen |
| 8 | Ôn tập Bài 1–4 + bài kiểm tra giữa phần | Qua phiếu ôn luyện A |
| 9 | Bài 5 + Bài 6: dữ liệu và phân loại ảnh | Nộp Dự án 1 |
| 10 | Bài 7 + Bài 8: âm thanh | Mô hình nghe đúng ≥ 8/10 lần |
| 11 | Bài 9: dáng người + đạo đức AI | Xong phần AI, đủ điều kiện chứng chỉ |
| 12 | Bài 10: Bản Sao Số | Chạy được chương trình trên robot ảo |
| 13 | Bài 11: dự đoán và chỉnh tham số | Nộp Dự án 2 |
| 14 | Bài 12: từ ảo sang thật | Cùng một chương trình chạy cả ảo lẫn thật |
| 15 | Bài 13: Nhiệm vụ 1 | Nộp Nhiệm vụ 1 |
| 16 | Bài 14: Nhiệm vụ 2 | Nộp Nhiệm vụ 2 |
| 17 | Bài 15: Nhiệm vụ 3 | Nộp Nhiệm vụ 3 |
| 18 | Bài 16: ghép ba nhiệm vụ | Chạy trọn vẹn một lượt |
| 19 | Chạy thử như thi thật, bấm giờ 2 phút | Hai lượt liên tiếp cùng ra điểm |

Buổi 0 là buổi **bắt buộc có người lớn**: xem [`../playbooks/leanbot-setup.md`](thiet-bi/cai-dat.md).

## 8. Hệ thống ôn luyện

Ba tầng, vì một tầng không đủ.

### Tầng 1 — Phiếu giấy (không cần máy)
Mỗi bài một phiếu trong `docs/leanbot/giao-an/bai-NN-*.md`, mục "Phiếu ôn luyện".
Dạng bài: đọc chương trình đoán kết quả, tìm lỗi sai, sắp xếp lại thứ tự khối, điền số
còn thiếu, dịch nhãn khối Anh ↔ Việt. Làm được khi không có robot, không có mạng.

### Tầng 2 — Trình soạn khối (cần máy, không cần robot)
Bé ghép khối trong `ide.pythaverse.space/lbeditor/` rồi **đọc cột code C++** để tự kiểm.
Thầy cho sẵn code C++ đích, bé phải ghép khối sao cho sinh ra đúng code đó. Đây là bài
tập tự chấm: giống code thì đúng.

### Tầng 3 — Màn chơi trong CodeQuest (cần máy)
Thế giới 6 "Thành Phố Robot" đã mô phỏng sa bàn AIROC bằng kiểu game `robotlab`.
Bài ôn luyện bổ sung đặt ở `content/worlds/w06-thanh-pho-robot/levels/w06-bonusNN.json`.

**Giới hạn thật, cần biết trước:** khối của `robotlab` là **mức trừu tượng cao hơn**
Leanbot thật — `tiến N ô`, `rẽ trái`, `gắp`, `thả`, `phía trước có line?`, `khối màu ?`.
Nó luyện được **thứ tự việc, đếm ngã tư, chọn nhiệm vụ nào làm trước, quản lý thời gian**
— tức phần Bài 13–16. Nó **không** luyện được: đặt tốc độ hai bánh theo vòng/phút, góc
servo, khoảng cách siêu âm theo cm, mã 4 mắt cảm biến. Những thứ đó chỉ luyện được ở
tầng 1 và tầng 2. Đừng để bé tưởng chơi hết Thế giới 6 là biết lập trình Leanbot.

## 9. Đánh giá

| Mốc | Cách đo | Đạt khi |
|---|---|---|
| Hết Bài 4 | Phiếu ôn luyện A + chạy robot bám một đoạn vạch | Tự làm, không cần nhắc |
| Hết Bài 9 | 26 hoạt động AI trên Plearn + Dự án 1 | Plearn ghi nhận hoàn thành |
| Hết Bài 12 | Cùng một chương trình chạy đúng cả trên Bản Sao Số lẫn robot thật | Sai lệch < 2 cm |
| Hết Bài 16 | Chạy trọn một lượt trong 2 phút | **Hai lượt liên tiếp cùng ra một kết quả** |

Mốc cuối theo nguyên tắc đã có trong [`vision.md`](../product/vision.md) §3: chạy ổn định hai lần
liên tiếp mới tính là làm được, vì ngày thi lấy điểm theo độ ổn định giữa hai lượt.

## 10. Việc của ai

| Việc | Ai làm |
|---|---|
| Nội dung bài, chứng chỉ, luật thi | Pythaverse / BTC AIROC |
| Bản dịch slide và giáo án tiếng Việt | Tài liệu này + `giao-an/` |
| Nhãn khối tiếng Việt | `tools/lbeditor-vi/` |
| Màn ôn luyện dạng game | `content/worlds/w06-thanh-pho-robot/` |
| Robot thật, dây USB, pin | Huấn luyện viên |

## 11. Chỗ còn hở

Ghi lại để không quên, không phải để làm ngay.

1. **Bản dịch chưa gửi Pythaverse.** Nếu họ nhận `leanbot_vi.js`, mọi học sinh Việt Nam
   đều được lợi, và lớp không phải cài Tampermonkey.
2. **Bài 7 trên slide ghi sai tên** ("Lesson 1: Invisible Data" thay vì Lesson 7). Bài 11
   không hề nhắc "Mini Project 2" dù Plearn gắn dự án đó vào. Đã ghi lại trong giáo án từng bài.
3. **Bài 9 dùng Scratch**, không dùng Leanbot. Cần máy cài được tiện ích Body Sensing.
4. **Phần Bản Sao Số (Bài 10–12) chưa tự tay chạy thử.** Các bước lấy từ slide và tài liệu
   Gateway (bản cập nhật 16/10/2023, có thể đã cũ). Buổi 12 phải dành thời gian dự phòng.
5. **Chưa có luật AIROC 2026 bản đầy đủ.** Số điểm trong §6 lấy từ `airoc.space`; xem mức
   tin cậy ở [`airoc-2026.md`](../product/airoc-2026.md).
