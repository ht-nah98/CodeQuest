# Bài 1 — Chào Leanbot! Cùng di chuyển

> Bài gốc: *Hello, Robot! - Let's Get Moving!* · 45 slide · 4 chương (Engage 6, Learn 23, Resolve 9, Growth 7) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=61113>

## Bé học xong thì làm được gì
- Nói được quy tắc số 1 của lập trình: **làm cái này trước, rồi mới cái kia** (thứ tự các bước), và xếp đúng thứ tự một chuỗi lệnh cho trước.
- Kéo khối từ thanh nhóm thả vào vùng ghép khối và nối đúng khối bắt đầu, khối `Nhiệm vụ`, các khối `Di chuyển` thành một chương trình.
- Cho Leanbot đi tới và đi lùi đúng số cm; biết **dấu trừ nghĩa là lùi**.
- Cho Leanbot quay phải và quay trái tại chỗ đúng số độ; biết bánh nào mang số âm.
- Khi robot quay lố, tự chỉnh số độ hoặc vận tốc rồi chạy thử lại (sửa lỗi).

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Máy tính, trình duyệt | Mở trình soạn khối lệnh: <https://ide.pythaverse.space/lbeditor/> |
| Trình soạn ở chế độ tiếng Việt | **Bắt buộc thêm `?lang=vi` vào cuối địa chỉ**: <https://ide.pythaverse.space/lbeditor/?lang=vi>. Trong trình soạn **không có** menu đổi ngôn ngữ; nút bánh răng góc trên bên phải chỉ mở bảng `categories choice` (chọn nhóm khối nào hiện ra) |
| Bản vá tiếng Việt | `tools/lbeditor-vi/`. Không vá thì 30/48 nhãn khối vẫn tiếng Anh dù đã có `?lang=vi`. Dạy bằng khối tiếng Việt trước, đổi `?lang=en` để đối chiếu nhãn Anh sau (giáo trình tổng §4) |
| Leanbot đã sạc pin, mỗi nhóm 1 con | Cách sạc, kiểm tra: mục Khởi động GS1 |
| Cách nạp chương trình xuống robot | Mục Khởi động GS2 (khóa gốc dạy bằng video). Bài 1 chỉ nói "Download and run", không có từng bước trên slide |
| Mặt sàn phẳng, còn trống ít nhất 1 m | Để chạy thử 50 cm rồi quay. Gợi ý của thầy: dán băng dính đánh dấu 15 cm, 35 cm, 50 cm |
| Thước cm | Cho bé đo xem robot đi có đúng không |
| Video "What is a Robot?" | <https://www.youtube.com/watch?v=3g0W9OVJSsE> (slide chỉ ghi "Click the link"; link lấy từ phần phân tích) |
| Sân có ô Grid 1, 4, 1B cho Practice | Slide có nhắc ô nhưng **chưa lấy được kích thước ô**. Thầy tự vẽ sân theo đoạn đường 50 cm + 35 cm |
| Thời lượng | Khóa gốc không ghi. Gợi ý của thầy: khoảng 70 phút (5 + 35 + 25 + 5), co giãn theo lớp |

## Thuật ngữ của bài
Từ đã có trong giáo trình tổng §5 (thứ tự các bước, khối lệnh, chương trình, tham số, sửa lỗi, chạy thử, nút chạm, nhiệm vụ, trình soạn khối lệnh) không chép lại.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Robot | Rô-bốt | Cỗ máy làm đúng điều con ra lệnh, từng bước một |
| Robot Engineer / Creative Robotics Engineer | Kỹ sư rô-bốt | Người nghĩ ra và làm ra đồ hay. Hôm nay con là kỹ sư |
| Programming | Lập trình | Bảo rô-bốt làm gì, từng bước, đúng thứ tự |
| Drag-and-drop programming | Lập trình kéo-thả | Ghép khối như xếp hình trên máy tính |
| Mission Control / Command Center | Trung tâm chỉ huy | Chỗ con ra lệnh cho Leanbot |
| Forward movement | Đi tới | Đi thẳng về phía mặt robot đang hướng |
| Backward movement / reverse | Đi lùi | Đi ngược lại, vẫn theo đường thẳng |
| Distance (cm, mm) | Quãng đường (cm, mm) | Robot phải đi xa bao nhiêu |
| Velocity / speed (rpm) | Vận tốc, nói với bé là "tốc độ" (vòng/phút) | Số to thì bánh quay nhanh |
| Positive / negative number | Số dương / số âm (dấu trừ) | Không dấu trừ: tới. Có dấu trừ: lùi |
| Left motor / Right motor | Động cơ trái / phải (bánh trái / bánh phải) | Bánh bên trái, bánh bên phải của robot |
| Point turn | Quay tại chỗ | Hai bánh quay ngược chiều, robot xoay như con quay |
| Swing turn | Quay vòng cung | Bài này **chưa học**, chỉ nói là có |
| Degrees (°) | Độ | Cả vòng là 360°. 90° là góc vuông. 180° là quay ngược lại |
| Checkpoint | Điểm mốc | Chỗ robot đến giữa đường. Không dùng "điểm dừng" vì dễ lẫn với khối `Dừng` |

Hai chữ "vận tốc" và "tốc độ": nhãn khối (theo §5.5 và `leanbot_vi.js`) ghi **vận tốc**; thầy nói với bé là **tốc độ**. Chỉ giải thích một lần, không bắt bé học thuộc rpm hay "bước/giây".

## Khối lệnh dùng trong bài
Nhãn Việt theo giáo trình tổng §5.5 và `tools/lbeditor-vi/leanbot_vi.js`.

| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `Leanbot.whenStarted` | Leanbot bắt đầu hoạt động | Khối mũ mở đầu chương trình. Mọi khối khác ghép dưới nó |
| `LbMission.beginByTeacher_end` | Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B … Nhiệm vụ: Kết thúc | Khối bao ngoài. Lệnh di chuyển nằm bên trong. Chạm hai nút cùng lúc thì robot mới chạy |
| `LbMotion.run` (menu `Run`) | Di chuyển: Chạy với vận tốc Trái ? Phải ? | Đặt tốc độ hai bánh. Hai số bằng nhau thì đi thẳng; cùng dấu trừ thì đi lùi |
| `LbMotion.run` (menu `Turn`) | Di chuyển: Rẽ với vận tốc Trái ? Phải ? | Cùng khối, đổi menu sang `Rẽ`. Hai số trái dấu thì quay tại chỗ |
| `LbMotion.waitDistanceMm` | Di chuyển: Chạy đoạn đường ? cm | Chạy tiếp cho đủ quãng đường rồi mới làm lệnh sau. Menu chọn cm hoặc mm |
| `LbMotion.waitRotationDeg` | Di chuyển: Rẽ góc ? độ | Quay tiếp cho đủ góc rồi mới làm lệnh sau |
| `LbMotion.stop` | Di chuyển: Dừng | Dừng cả hai bánh |
| `LbMotion.wait` | Di chuyển: Tiếp tục chạy trong ? giây | Chỉ **giới thiệu** (slide Learn 13, ví dụ 1,25 giây). Không có hoạt động |
| Khối ghi chú (xám) | Ghi chú | Dòng chữ nhắc việc trong lời giải Practice. Slide không ghi rõ loại khối; coi là ghi chú |

Khối thấy trong nhóm `Di chuyển` nhưng **không dạy** ở bài này: "Đường đã đi, tính bằng …", "Hướng đang quay, tính bằng …", "Đặt lại mốc đường đi và hướng".

Ghi chú nhãn: file bóc tách đề xuất "Chuyển động / Giữ chạy / Giữ quay". Bài này **bỏ** các đề xuất đó, dùng đúng §5.5 ("Di chuyển / Chạy đoạn đường / Rẽ góc").

## Dạy thế nào
### Mở bài (5 phút)
1. Chào cả lớp: "Hôm nay con trở thành **kỹ sư rô-bốt**. Kỹ sư là người nghĩ ra và làm ra đồ hay. Con sẽ là người ra lệnh cho robot."
2. Hỏi: "Robot là gì? Robot giúp con việc gì?" Cho 2–3 bé nói. Chốt: robot là cỗ máy thông minh, làm **đúng điều mình bảo, từng bước một**, không mệt, không quên.
3. Chiếu video "What is a Robot?" (link ở mục Cần chuẩn bị) nếu có mạng.
4. Giơ Leanbot lên: "Đây là Leanbot, bạn nhỏ của con." Hỏi: "Con đoán Leanbot làm được những gì?" Chốt bốn việc theo slide: đi tới đi lùi như xe đua, xoay và quay mọi hướng, bật đèn nhiều màu, phát âm thanh.
5. Nói mục tiêu hôm nay bằng bốn câu ngắn: hiểu quy tắc số 1; kéo thả khối; cho robot đi tới, đi lùi; cho robot quay.

### Giảng (35 phút)
**Bước 1. Quy tắc số 1: thứ tự (5 phút).**
- Thầy làm: đứng trước lớp, hỏi "Pha một gói mì: con làm gì trước, làm gì sau?" Cho bé nói lần lượt (xé gói, cho mì vào bát, đổ nước sôi, chờ, ăn). Rồi cố ý đảo: "Đổ nước sôi trước khi cho mì thì sao?"
- Bé làm: đoán, cười, sửa lại thứ tự.
- Thầy chốt: "Quy tắc số 1 là **làm cái này trước, rồi mới cái kia**. Gọi là **thứ tự các bước**. Đảo thứ tự thì robot làm chuyện ngộ nghĩnh, hoặc đứng im."
- Nói thêm: lập trình là bảo robot làm gì, từng bước, đúng thứ tự, giống công thức nấu ăn. Con là người dạy, robot làm đúng điều con dạy.
- Khóa gốc dùng ví dụ "mua đồ chơi trên mạng" (tìm, chọn, bỏ vào giỏ, nhập thông tin, xác nhận). Ví dụ pha mì dễ hiểu hơn với bé lớp 4.

**Bước 2. Làm quen trình soạn khối (5 phút).**
- Thầy làm: mở <https://ide.pythaverse.space/lbeditor/> (bản vá tiếng Việt). Chiếu màn hình lên cho cả lớp.
- Nói: "Đây là **trung tâm chỉ huy**. Mỗi khối màu như một câu thần chú bảo Leanbot làm gì. Ghép các khối lại như xếp hình thì thành chương trình."
- Chỉ thanh nhóm khối: Logic, Vòng lặp, Toán, Biến, Hàm, Arduino, Leanbot (tên Anh trên ảnh gốc: Logic, Loops, Math, Variables, Functions, Arduino, Leanbot). Hôm nay chỉ dùng nhóm **Leanbot**, nhóm con **Di chuyển** (Anh: Motion).
- Bé làm: mở trình soạn trên máy mình, tìm nhóm Leanbot, bấm mở nhóm Di chuyển, đọc to tên các khối trong nhóm. Thầy đi quanh giúp bé chưa mở được.
- Hỏi: "Con thấy khối nào có chữ 'Chạy'? Khối nào có chữ 'Dừng'?"

**Bước 3. Thao tác kéo-thả đầu tiên (8 phút).** Đây là lần đầu bé chạm vào trình soạn, đi thật chậm, từng thao tác một. Thầy làm mẫu một thao tác, bé làm theo, rồi thầy đi kiểm.
- Thao tác 1, lấy khối bắt đầu. Thầy nói: "Chương trình nào cũng có khối mở đầu." Tìm khối **Leanbot bắt đầu hoạt động** trong nhóm Leanbot, hoặc xem trong vùng ghép khối đã có sẵn chưa. (Vị trí khối trong thanh nhóm chưa có trong nguồn; thầy tự tìm trước giờ học.) Cách kéo-thả: đặt con trỏ lên khối, **bấm giữ chuột trái**, kéo sang vùng ghép khối, **nhả chuột**.
- Thao tác 2, lấy khối `Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B … Nhiệm vụ: Kết thúc`. Kéo cho **mép dưới** khối bắt đầu chạm **mép trên** khối nhiệm vụ. Khi hai khối sát nhau sẽ tự khớp như mảnh ghép. Hỏi: "Con có thấy hai khối dính vào nhau không?" Nếu khối chỉ nằm gần mà không dính, kéo lại gần hơn.
- Thao tác 3, lấy khối `Di chuyển: Chạy với vận tốc Trái 30 Phải 30` (giữ menu là `Chạy`). Kéo vào **bên trong** "cái miệng" của khối Nhiệm vụ, chỗ giữa chữ Bắt đầu và chữ Kết thúc. Thầy nhấn: "Lệnh di chuyển phải nằm giữa hai khối nhiệm vụ."
- Thao tác 4, lấy khối `Di chuyển: Chạy đoạn đường ? cm`. Kéo xuống **dưới** khối Chạy với vận tốc, cho hai khối dính nhau.
- Thao tác 5, lấy khối `Di chuyển: Dừng`. Kéo xuống dưới khối Chạy đoạn đường.
- Thầy đọc cả chương trình từ trên xuống, ngón tay chỉ từng khối: "Khi Leanbot bắt đầu, chờ chạm hai nút, chạy tốc độ 30, chạy đủ quãng đường, dừng, kết thúc nhiệm vụ." Nhấn lại quy tắc số 1: **trên làm trước, dưới làm sau**.
- Khối lạc chỗ: kéo ra lại rồi thả vào đúng chỗ. Nếu bé thả nhầm khối, thầy chỉ cách kéo khối ra khỏi chuỗi và đặt lại (thao tác Blockly chuẩn; thầy tự thử trước trên bản vá).
- Hỏi kiểm tra: "Nếu thầy đặt `Dừng` lên trên `Chạy với vận tốc`, robot sẽ làm gì?" (Dừng trước khi chạy, tức là gần như đứng im.)
- Chỉ sang cột code C++ bên phải: mỗi khối ra một dòng lệnh (giáo trình tổng §4). Chưa cần bé hiểu hết, chỉ cần thấy "khối đổi thì code đổi".

**Bước 4. Đi tới và đổi số (6 phút).**
- Thầy giảng: robot hai bánh. Hai bánh quay cùng chiều, cùng tốc độ thì robot đi thẳng về phía mặt nó đang hướng. Hỏi: "Robot đi tới thì bánh trái và bánh phải quay thế nào?" (cả hai cùng tới).
- Chỉ hai ô số: **Trái** là bánh trái, **Phải** là bánh phải, không phải hướng đi. Hai ô cùng 30 thì đi thẳng.
- Chỉ ô số của khối `Chạy đoạn đường`. Thầy nói: "Số này bảo robot đi **xa bao nhiêu**, như bảo bạn 'bước 10 bước to'." Ví dụ trong khóa gốc: đổi thành 50 là robot đi 50 cm, khoảng bằng một tấm ván trượt. Thước ở lớp đo bằng cm hoặc mm, trên khối cũng chọn được cm hoặc mm.
- Bé làm: bấm vào ô số, gõ số mới (thao tác Blockly chuẩn; thầy kiểm lại trên bản vá), đổi số trên khối từ số có sẵn (slide gốc có sẵn 4,2) thành **15**, giữ vận tốc 30. Đơn vị để **cm**.
- **Hoạt động 1** (Learning Activity #1): chương trình `Chạy với vận tốc Trái 30 Phải 30` → `Chạy đoạn đường 15 cm` → `Dừng`. Bé tải xuống và chạy trên Leanbot (xem GS2), đo bằng thước. Thầy nhắc: ai cũng phải **chạm cả TB1A và TB1B cùng lúc** thì robot mới chạy.
- Hỏi: "Số 30 làm gì? Số 15 làm gì?" (30 là nhanh hay chậm, 15 là đi xa bao nhiêu cm.)
- Tham số: gọi hai con số trong ô là **tham số**: con số điền vào ô trống của khối.
- Giới hạn quan trọng: **vận tốc mỗi bánh nằm trong khoảng −59 … 59 vòng/phút** (hoặc −2000 … 2000 bước/giây). Viết lên bảng. Nói với bé: "Số to thì chạy nhanh. Đừng gõ quá 59."

**Bước 5. Đi lùi và dấu trừ (5 phút).**
- Hỏi: "Muốn robot đi lùi, con nghĩ phải làm sao?" Cho bé đoán trước khi chiếu.
- Thầy chốt: **thêm dấu trừ (−) trước cả hai số**. Không dấu trừ: tới. Có dấu trừ: lùi. Không giải thích số âm là gì; chỉ nói "dấu trừ nghĩa là lùi".
- Thầy làm: so sánh hai chương trình trên bảng, trên là Trái 30 Phải 30, dưới là Trái **−50** Phải **−50**. Đổi cả hai ô, đừng chỉ đổi một. Nhắc: số to thì nhanh hơn, 50 nhanh hơn 30.
- **Hoạt động 2** (Learning Activity #2): sửa chương trình để Leanbot **lùi 15 cm, nhanh hơn**. Đáp án: `Chạy với vận tốc Trái −50 Phải −50` → `Chạy đoạn đường 15 cm` → `Dừng`. Bé chạy thử, đo xem robot về lại chỗ cũ chưa.
- Hỏi: "Một ô có dấu trừ, một ô không có dấu trừ thì sao?" Để bé đoán và thử, dẫn sang bước 6.
- Nói cho vui: tới rồi lùi là "bước nhảy đầu tiên của một điệu nhảy".
- Khối `Tiếp tục chạy trong ? giây` (slide Learn 13, ví dụ 1,25 giây): chỉ giới thiệu trong một câu "robot cũng chạy theo thời gian được", không làm hoạt động. Lưu ý ảnh ví dụ trên slide **không có `Dừng`**; với bé thì luôn thêm `Dừng` cho chắc.

**Bước 6. Quay tại chỗ (8 phút).**
- Thầy làm: giơ Leanbot, hai ngón tay chỉ hai bánh. "Một bánh tới, một bánh lùi thì robot xoay tại chỗ như con quay." Cho bé xoay tay làm thử.
- Nói robot có hai cách quay: **quay tại chỗ** (hai bánh cùng tốc độ, ngược chiều) và **quay vòng cung** (hai bánh cùng chiều, khác tốc độ). Hôm nay chỉ học **quay tại chỗ**.
- Độ: "Một cái bánh pizza tròn là 360 độ. Quay 90 độ là một góc vuông, như góc tờ giấy vuông. Quay 180 độ là quay ngược lại, mặt hướng phía đối diện." (Câu 180° là thầy bổ sung; slide gốc chỉ nói 360° và 90°.)
- Hỏi: "Quay ra sau lưng thì mấy độ?" (180.)
- **Trái và phải của robot.** Quan trọng: trái, phải là của **robot**, nhìn từ **phía sau lưng robot**, không phải của bé đứng đối diện. Cho bé quay lưng cùng chiều với robot để nhìn.
- Thầy làm: đổi menu của khối `Chạy với vận tốc` thành `Rẽ` (Anh: `Turn`). Thêm khối `Rẽ góc ? độ` và `Dừng`.
- **Quay phải:** `Rẽ với vận tốc Trái 50 Phải −50` → `Rẽ góc 90 độ` → `Dừng`. Nói: "Bánh trái đi tới (50), bánh phải đi lùi (−50), robot quay sang **phải** cho đến khi đủ 90 độ rồi dừng." Nghe ngược với trực giác, nên cho cả lớp giơ tay xoay thử. Gợi nhớ: bánh bên nào lùi thì robot quay về bên đó.
- **Hoạt động 3** (Learning Activity #3): chép chương trình quay phải, tải xuống, chạy.
- **Quay trái:** lật hai số: `Rẽ với vận tốc Trái −50 Phải 50` → `Rẽ góc 90 độ` → `Dừng`. Bánh trái lùi, bánh phải tới, robot quay sang **trái**.
- **Hoạt động 4** (Learning Activity #4): chép chương trình quay trái, tải xuống, chạy.
- Hỏi: "Muốn đổi từ quay phải sang quay trái, ta đổi gì?" (đổi chỗ dấu trừ giữa hai bánh.)

**Bước 7. Robot quay lố thì sao? (3 phút).**
- Hỏi: "Nếu Leanbot quay quá đà, con làm gì?" Hai cách theo slide: **dùng vận tốc nhỏ hơn** để quay chậm hơn, hoặc **dùng góc nhỏ hơn**, ví dụ 85 độ thay vì 90.
- Nói rõ: slide giảng 90°, nhưng lời giải mẫu thật dùng **85° và vận tốc 30 / −30**, vì robot hay quay lố. Đây là chuyện bình thường, không phải bé làm sai. Kỹ sư chỉ chỉnh số rồi chạy thử lại, đó là **sửa lỗi**.

### Bé tự làm (25 phút)
Chia nhóm 2 bạn, một bạn ghép khối, một bạn đặt robot rồi hoán đổi. Thầy đi quanh. Gợi ý bằng câu hỏi, không đưa đáp án ngay.
1. **Practice #1 (8 phút).** "Cho Leanbot đi tới 50 cm, rồi quay sang phải." Lời giải mẫu có hai đoạn, mỗi đoạn có ghi chú: `Chạy với vận tốc 50/50` → `Chạy đoạn đường 50 cm` → `Dừng`; rồi `Rẽ với vận tốc Trái 30 Phải −30` → `Rẽ góc 85 độ` → `Dừng`. Bé thử bằng 90° trước; nếu lố thì chỉnh xuống 85°.
2. **Practice #2 (8 phút).** "Làm tiếp: đi tới 35 cm, rồi quay trái." Thêm vào dưới Practice #1: `Chạy 50/50`, `Chạy đoạn đường 35 cm`, `Dừng`; rồi `Rẽ với vận tốc Trái −30 Phải 30`, `Rẽ góc 85 độ`, `Dừng`.
3. **Tìm kho báu (Treasure Hunt) (9 phút).** Robot xuất phát ở dấu X trên bản đồ: đi tới 50 cm đến điểm mốc đầu, quay phải 90°, đi tới 30 cm tới kho báu. Bé tự ghép từ khối bắt đầu. Nếu lạc đường, nhắc bốn bước sửa lỗi: nhìn chỗ robot đi sai; kiểm tra số trên từng khối; chỉnh một chút rồi thử lại; hỏi bạn hoặc thầy.
4. Bé xong sớm: **Robot nhảy múa**. (a) Quay đúng 90° như rẽ ở góc phố. (b) "Siêu xoay" quay 180° để mặt hướng ngược lại. (c) Ghép nhiều lần quay thành điệu nhảy riêng: quay hết một vòng tròn cần mấy độ? (360.)

Với bé chưa nạp được xuống robot: cho chạy thử trên Bản Sao Số nếu thầy đã chuẩn bị (không có trong nguồn bài 1, chỉ là gợi ý).

### Chốt bài (5 phút)
1. Hỏi nhanh, cả lớp giơ tay: "Quy tắc số 1 là gì?" ("Làm cái này trước, rồi mới cái kia", tức thứ tự.)
2. "Muốn robot lùi thì thêm gì?" (Dấu trừ.) "Muốn quay phải thì bánh nào mang dấu trừ?" (Bánh phải.)
3. "Quay quá đà thì làm gì?" (Chỉnh lại số độ hoặc vận tốc rồi chạy thử.)
4. Khen cụ thể: "Hôm nay con làm cho robot sống dậy bằng chương trình của chính con." Nhắc chương trình nào cũng cần khối bắt đầu, khối nhiệm vụ, và nên kết thúc bằng `Dừng`.
5. Nhắc cuối giờ theo slide: tắt robot cẩn thận, giúp dọn lớp.
6. Bài tiếp theo (theo bản đồ giáo trình tổng): vòng lặp. Bài này, nếu bé hỏi "đi một hình vuông thì sao", trả lời "con phải ghép tay bốn lần, bài sau có cách gọn hơn".

## Chương trình mẫu
Khung chung của mọi chương trình trong bài:

- Leanbot bắt đầu hoạt động
  - Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B
    - (các lệnh ở bên dưới)
  - Nhiệm vụ: Kết thúc

Khung C++ tương ứng (dạng chương trình mẫu chính thức `Fullmision.ino`, `FollowLine_EN.bduino.ino`):

```cpp
#include <Leanbot.h>

void setup() {
  Leanbot.begin();
}

void loop() {
  LbMission.begin(TB1A + TB1B);

  // ... các lệnh ở bên dưới ...

  LbMission.end();
}
```

**Lưu ý về số trong code.** Các lệnh dưới đây ghi số vận tốc **nguyên như số trên khối** (30, 50...). Chương trình mẫu chính thức dùng `LbMotion.runLR(trái, phải)` với số theo **bước/giây** (tới 2000), còn khối của bài 1 dùng **vòng/phút** (−59 … 59). Chưa kiểm chứng trình soạn đổi hai đơn vị đó thế nào khi sinh code. Thầy mở trình soạn, ghép đúng khối, rồi chép lại dòng `runLR` thật máy sinh ra để thay vào. Quãng đường trong `waitDistanceMm` tính bằng **mm** (15 cm = 150 mm), góc trong `waitRotationDeg` tính bằng **độ**.

**1. Đi tới 15 cm (Hoạt động 1)**

- Di chuyển: Chạy với vận tốc Trái 30 Phải 30
- Di chuyển: Chạy đoạn đường 15 cm
- Di chuyển: Dừng

```cpp
LbMotion.runLR(30, 30);
LbMotion.waitDistanceMm(150);
LbMotion.stopAndWait();
```

**2. Lùi 15 cm, nhanh hơn (Hoạt động 2)**

- Di chuyển: Chạy với vận tốc Trái −50 Phải −50
- Di chuyển: Chạy đoạn đường 15 cm
- Di chuyển: Dừng

```cpp
LbMotion.runLR(-50, -50);
LbMotion.waitDistanceMm(150);
LbMotion.stopAndWait();
```

**3. Quay phải 90° (Hoạt động 3)**

- Di chuyển: Rẽ với vận tốc Trái 50 Phải −50
- Di chuyển: Rẽ góc 90 độ
- Di chuyển: Dừng

```cpp
LbMotion.runLR(50, -50);
LbMotion.waitRotationDeg(90);
LbMotion.stopAndWait();
```

**4. Quay trái 90° (Hoạt động 4)**

- Di chuyển: Rẽ với vận tốc Trái −50 Phải 50
- Di chuyển: Rẽ góc 90 độ
- Di chuyển: Dừng

```cpp
LbMotion.runLR(-50, 50);
LbMotion.waitRotationDeg(90);
LbMotion.stopAndWait();
```

**5. Practice #2: chữ L (đi 50 cm, quay phải, đi 35 cm, quay trái)**

- Ghi chú: Đi tới từ ô 1 đến ô 4
- Di chuyển: Chạy với vận tốc Trái 50 Phải 50
- Di chuyển: Chạy đoạn đường 50 cm
- Di chuyển: Dừng
- Ghi chú: Quay phải
- Di chuyển: Rẽ với vận tốc Trái 30 Phải −30
- Di chuyển: Rẽ góc 85 độ
- Di chuyển: Dừng
- Ghi chú: Đi tới từ ô 4 đến ô 1B
- Di chuyển: Chạy với vận tốc Trái 50 Phải 50
- Di chuyển: Chạy đoạn đường 35 cm
- Di chuyển: Dừng
- Ghi chú: Quay trái
- Di chuyển: Rẽ với vận tốc Trái −30 Phải 30
- Di chuyển: Rẽ góc 85 độ
- Di chuyển: Dừng

```cpp
// Đi tới từ ô 1 đến ô 4
LbMotion.runLR(50, 50);
LbMotion.waitDistanceMm(500);
LbMotion.stopAndWait();
// Quay phải
LbMotion.runLR(30, -30);
LbMotion.waitRotationDeg(85);
LbMotion.stopAndWait();
// Đi tới từ ô 4 đến ô 1B
LbMotion.runLR(50, 50);
LbMotion.waitDistanceMm(350);
LbMotion.stopAndWait();
// Quay trái
LbMotion.runLR(-30, 30);
LbMotion.waitRotationDeg(85);
LbMotion.stopAndWait();
```

Practice #1 chính là hai đoạn đầu (đi 50 cm, quay phải 85°). Slide Practice #2 hơi mờ, chữ "50" của đoạn đầu đọc ra từ ngữ cảnh (khớp Practice #1), còn 35 cm và 85° đọc rõ.

**6. Tìm kho báu (Treasure Hunt)** — slide chỉ mô tả bằng lời (đi 50 cm, quay phải 90°, đi 30 cm), **không in code**. Bản dưới là gợi ý của thầy theo mẫu trên, không phải lời giải chính thức:

- Di chuyển: Chạy với vận tốc Trái 50 Phải 50
- Di chuyển: Chạy đoạn đường 50 cm
- Di chuyển: Dừng
- Di chuyển: Rẽ với vận tốc Trái 50 Phải −50 (hoặc 30 / −30 nếu lố)
- Di chuyển: Rẽ góc 90 độ (hoặc 85 nếu lố)
- Di chuyển: Dừng
- Di chuyển: Chạy với vận tốc Trái 50 Phải 50
- Di chuyển: Chạy đoạn đường 30 cm
- Di chuyển: Dừng

```cpp
LbMotion.runLR(50, 50);
LbMotion.waitDistanceMm(500);
LbMotion.stopAndWait();
LbMotion.runLR(50, -50);
LbMotion.waitRotationDeg(90);
LbMotion.stopAndWait();
LbMotion.runLR(50, 50);
LbMotion.waitDistanceMm(300);
LbMotion.stopAndWait();
```

## Phiếu ôn luyện
Từ dễ đến khó. Ghi chú: `Chạy` / `Rẽ` là hai lựa chọn trong menu của khối `Di chuyển: … với vận tốc Trái ? Phải ?`.

**Bài 1. Đọc đoán kết quả**
Đề: Chương trình dưới đây (bên trong khối Nhiệm vụ). Sau khi chạm TB1A + TB1B, Leanbot làm gì và dừng ở đâu?
- Di chuyển: Chạy với vận tốc Trái 30 Phải 30
- Di chuyển: Chạy đoạn đường 20 cm
- Di chuyển: Dừng

**Đáp án:** Leanbot đi **thẳng tới** 20 cm rồi dừng, cách chỗ xuất phát 20 cm theo hướng mặt robot. Hai bánh cùng 30, không dấu trừ nên đi tới.

**Bài 2. Sắp thứ tự**
Đề: Các khối bị xáo trộn. Hãy xếp lại, từ trên xuống, để Leanbot đi tới 15 cm rồi dừng:
(a) Di chuyển: Dừng · (b) Nhiệm vụ: Kết thúc · (c) Di chuyển: Chạy đoạn đường 15 cm · (d) Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B · (e) Di chuyển: Chạy với vận tốc Trái 30 Phải 30

**Đáp án:** (d) → (e) → (c) → (a) → (b). Khối bắt đầu ở trên cùng, khối kết thúc ở dưới cùng, ba lệnh nằm giữa. Phải đặt vận tốc **trước**, rồi mới chạy đủ quãng đường, rồi dừng. Đây là quy tắc "cái này trước, rồi mới cái kia".

**Bài 3. Dịch nhãn**
Đề: (a) Nối nhãn Anh với nhãn Việt:
1. Motion: Stop · 2. Motion: Keep turning for ? degrees · 3. Motion: Keep running for ? cm · 4. Mission: End
A. Di chuyển: Chạy đoạn đường ? cm · B. Nhiệm vụ: Kết thúc · C. Di chuyển: Dừng · D. Di chuyển: Rẽ góc ? độ
(b) Dịch sang tiếng Anh: "Di chuyển: Chạy với vận tốc Trái ? Phải ?"

**Đáp án:** (a) 1–C, 2–D, 3–A, 4–B. (b) **Motion: Run with velocity Left ? Right ? rpm**.

**Bài 4. Đọc đoán kết quả**
Đề: Robot đang quay mặt về phía trước. Chương trình:
- Di chuyển: Rẽ với vận tốc Trái 50 Phải −50
- Di chuyển: Rẽ góc 90 độ
- Di chuyển: Dừng

(a) Robot quay sang phải hay sang trái? (b) Robot có đi xa khỏi chỗ cũ không? (c) Muốn quay sang bên kia thì sửa gì?

**Đáp án:** (a) Sang **phải**: bánh trái đi tới (50), bánh phải đi lùi (−50). (b) **Không**, quay tại chỗ như con quay, đứng nguyên một điểm. (c) Đổi chỗ dấu trừ: Trái **−50** Phải **50**.

**Bài 5. Tìm lỗi**
Đề: Bé An muốn Leanbot **lùi** 15 cm. Chương trình của An:
- Di chuyển: Chạy với vận tốc Trái 30 Phải 30
- Di chuyển: Chạy đoạn đường 15 cm
- Di chuyển: Dừng

Robot lại đi tới. Sai ở đâu? Sửa thế nào?

**Đáp án:** Hai số vận tốc không có dấu trừ nên robot đi tới. Sửa thành Trái **−30** Phải **−30** (thêm dấu trừ cho **cả hai** ô). Lưu ý bé hay chỉ sửa một ô: nếu chỉ một ô có dấu trừ thì robot sẽ quay chứ không lùi.

**Bài 6. Điền số**
Đề: (a) Để Leanbot **quay trái** tại chỗ, điền số vào ô: Rẽ với vận tốc Trái __ Phải __ (dùng số 50 hoặc −50). (b) Muốn Leanbot **quay ngược lại** (mặt hướng phía đối diện) phải rẽ góc bao nhiêu độ? (c) Trong các số 30, −50, 60, −59, số nào **không được** đặt cho vận tốc của một bánh?

**Đáp án:** (a) Trái **−50** Phải **50**. Quay trái thì bánh trái lùi (có dấu trừ), bánh phải tới. (b) **180** độ (nửa vòng; cả vòng là 360). (c) **60**, vì vận tốc chỉ nằm trong khoảng từ −59 đến 59 vòng/phút.

**Bài 7. Tìm lỗi (quay lố)**
Đề: Chương trình quay phải 90° của Mai làm robot quay lố, hơi quá góc vuông. Nêu **hai** cách sửa theo bài học.

**Đáp án:** Cách 1: chỉnh góc nhỏ hơn, ví dụ **85 độ** thay vì 90. Cách 2: dùng vận tốc nhỏ hơn, ví dụ 30 / −30 thay vì 50 / −50, để robot quay chậm hơn. Sau mỗi lần chỉnh phải chạy thử lại. Không cần xóa chương trình.

**Bài 8. Đọc đoán kết quả**
Đề: Chương trình (đã bỏ khối `Dừng` cho gọn, nhưng giả sử robot dừng sau mỗi đoạn):
1. Chạy 50 50 → Chạy đoạn đường 50 cm
2. Rẽ 30 −30 → Rẽ góc 85 độ
3. Chạy 50 50 → Chạy đoạn đường 35 cm
4. Rẽ −30 30 → Rẽ góc 85 độ

(a) Tổng quãng đường đi tới là bao nhiêu cm? (b) Sau bước 2 robot quay sang phía nào? (c) Sau bước 4, robot quay mặt về hướng nào so với lúc bắt đầu?

**Đáp án:** (a) 50 + 35 = **85 cm**. (b) Sang **phải** (bánh trái dương, bánh phải âm). (c) **Cùng hướng** lúc bắt đầu: quay phải một góc vuông rồi quay trái một góc vuông thì mặt lại hướng như cũ. Đường đi hình chữ L.

**Bài 9. Làm trên máy**
Đề: Mở trình soạn khối (bản vá tiếng Việt). Ghép các khối **trong khối Nhiệm vụ** để cột code bên phải có các dòng:
```cpp
LbMotion.runLR(-50, -50);
LbMotion.waitDistanceMm(150);
LbMotion.stopAndWait();
```
Nói rõ: khối nào ra dòng nào, và cm trên khối khác mm trong code thế nào.

**Đáp án:** `Chạy với vận tốc Trái −50 Phải −50` → `LbMotion.runLR(-50, -50)`; `Chạy đoạn đường 15 cm` → `LbMotion.waitDistanceMm(150)` (15 cm = 150 mm); `Dừng` → `LbMotion.stopAndWait()`. Cả ba khối nằm giữa `Nhiệm vụ: Bắt đầu…` và `Nhiệm vụ: Kết thúc`. *Thầy kiểm lại trên máy thật: số trong `runLR` có thể khác −50 vì đơn vị (xem lưu ý ở mục Chương trình mẫu). Nếu khác, đổi đáp án cho khớp máy.*

**Bài 10. Làm trên máy**
Đề: Ghép khối để cột code bên phải có dòng `LbMotion.waitRotationDeg(90);` và robot quay **trái**. Dùng khối nào, điền số gì?

**Đáp án:** `Rẽ với vận tốc Trái −50 Phải 50` (menu chọn `Rẽ`) rồi `Rẽ góc 90 độ` rồi `Dừng`. Dòng sinh ra: `LbMotion.waitRotationDeg(90);`, số góc đi thẳng từ khối ra code. Dòng `runLR` cần thầy kiểm trên máy, như Bài 9.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc có 4 mục trong phần "Check Your Understanding!" (Resolve 05–08). Nội dung nằm trong H5P, ảnh slide trống; ba câu đầu lấy được từ phần phân tích, **câu thứ 4 có phần đề trống, không có gì để chép**. Đáp án đúng đánh dấu ✔.

1. What happens if Leanbot's left wheel goes forward and the right wheel goes backward? — *Nếu bánh trái đi tới và bánh phải đi lùi thì Leanbot sẽ ra sao?*
   - ✔ It turns in place — *Quay tại chỗ*
   - It jumps — *Nhảy lên*
   - It stops — *Dừng lại*
   - It goes straight — *Đi thẳng*
2. What number should the right wheel be for a right turn? — *Muốn quay phải thì bánh phải phải là số nào?*
   - ✔ Negative (with minus sign) — *Số âm, có dấu trừ*
   - Zero — *Số không*
   - Very big — *Số rất lớn*
   - Positive (without minus sign) — *Số dương, không dấu trừ*
3. What should you do if Leanbot turns too far? — *Nếu Leanbot quay quá đà thì nên làm gì?*
   - ✔ Adjust the degree of angle — *Chỉnh lại số độ*
   - Delete the program — *Xóa chương trình*
   - Fix the wheels — *Sửa bánh xe*
   - You clap — *Vỗ tay*
4. Chưa lấy được (đề trống trong nguồn).

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Thả khối nhưng không khớp | Khối nằm gần nhau mà chạy không được, hoặc robot đứng im | Kéo khối lại gần hơn cho sát mép; đọc chương trình từ trên xuống bằng ngón tay |
| Quên bọc lệnh trong khối Nhiệm vụ | Khối `Chạy…` nằm ngoài, không ăn vào khối nào | Chỉ vào "cái miệng" của khối Nhiệm vụ: lệnh phải nằm giữa Bắt đầu và Kết thúc |
| Robot không chạy | Tải xuống xong mà robot đứng yên | Hỏi: "Con đã chạm TB1A và TB1B cùng lúc chưa?" |
| Số âm | Bé chỉ đặt dấu trừ ở một ô, hoặc hỏi "âm là gì" | Không giải thích số học: "dấu trừ nghĩa là lùi". Nhắc đặt cho **cả hai** ô khi muốn lùi |
| Nhầm trái / phải | Bé đặt Trái 50 Phải −50 rồi nói "quay trái" | Cho bé đứng sau lưng robot nhìn theo cùng hướng. Nhắc "Trái" và "Phải" trên khối là **bánh**, không phải hướng đi |
| Quay phải mà ghép ngược | Robot quay trái | Hỏi bánh nào lùi: bánh nào lùi thì robot quay về bên đó |
| Quay lố | Robot quay hơn góc vuông | Bình thường. Chỉnh góc 85° hoặc vận tốc 30 / −30, chạy thử lại |
| Gõ vận tốc quá 59 | Khối không chạy như ý | Nhắc khoảng cho phép −59 … 59 |
| Thiếu `Dừng` | Robot trôi đi sau khi xong đoạn đường | Thêm `Dừng` sau mỗi đoạn. Chú ý ví dụ giờ ở slide Learn 13 không có `Dừng` |
| Đo xa nhầm đơn vị | Gõ 15 mà robot đi bé tí | Kiểm menu đơn vị là **cm** hay **mm** |
| Nản vì lỗi | Bé nói "con làm sai rồi" | "Ai cũng mắc lỗi. Kỹ sư tìm chỗ sai rồi chữa, gọi là sửa lỗi." |

## Ghi chú về bản gốc
- **Nhãn khối**: file bóc tách đề xuất "Chuyển động / Giữ chạy / Giữ quay / Khi Leanbot khởi động". Giáo trình tổng §5.5 và `leanbot_vi.js` ghi "Di chuyển / Chạy đoạn đường / Rẽ góc / Leanbot bắt đầu hoạt động". Giáo án này theo §5.5 và `leanbot_vi.js`. Nhãn khối `Tiếp tục chạy trong ? giây` lấy từ `leanbot_vi.js`.
- **Số liệu khớp §6**: khoảng vận tốc −59 … 59 vòng/phút, hoặc −2000 … 2000 bước/giây (slide Learn 08). Không mâu thuẫn. Hai điểm cần lưu ý, không phải mâu thuẫn: (1) §6 ghi "tốc độ nên dùng khi mới tập 30–50 %" (nguồn Bài 13) theo phần trăm, còn bài 1 dùng 30 và 50 vòng/phút, đơn vị khác nhau; (2) chương trình mẫu chính thức dùng số bước/giây (đến 2000) trong khi bài 1 dùng vòng/phút; chưa kiểm chứng cách đổi (xem lưu ý ở mục Chương trình mẫu).
- **90° và 85°**: slide giảng (Learn 17–22) dùng quay 90°, vận tốc 50 / −50; lời giải Practice dùng **85°** và vận tốc **30 / −30**. Đây là điều chỉnh vì robot quay lố, không phải mâu thuẫn, nhưng bé dễ thắc mắc. Slide Growth 03 lại ghi "Turn right 90 degrees".
- **Practice #2 (Resolve 04)** ảnh mờ; chữ "50" của đoạn đi đầu suy ra từ Practice #1.
- Trong phần "chương trình mẫu" của file bóc tách, Practice #2 ghi nhầm kiểu "Turn Left 30 Right -30" (thiếu chữ velocity); đã sửa lại thành `Rẽ với vận tốc` như slide.
- **Slide Growth 06** ghi "'Move To' block" trong "What you learned today", nhưng bài **không dạy** khối Move To (bài dùng `Chạy đoạn đường ? cm`). Là chữ sót từ bản khác, giáo án này bỏ qua.
- **Slide Learn 15** có lỗi chính tả "onlu" (đúng: "only").
- **Slide Learn 04**: ảnh minh họa "mua đồ chơi" do AI vẽ, chữ trong ảnh loạn, không dùng được. Giáo án thay bằng ví dụ pha mì.
- **Slide Growth 03** đánh số "1." cả ba dòng do lỗi định dạng; thứ tự đúng là 1, 2, 3.
- **Slide Learn 13** (chạy theo thời gian) không có khối `Dừng`, trong khi các ví dụ khác đều có.
- **Câu kiểm tra thứ 4** trong H5P có đề trống, chưa lấy được.
- **Chưa lấy được**: kích thước ô Grid 1, 4, 1B ở Practice; từng bước nạp code xuống robot trong slide (có ở video GS2); vị trí chính xác của khối bắt đầu trong thanh nhóm; code C++ mà trình soạn sinh cho khối `Chạy với vận tốc` với đơn vị vòng/phút.
