# Thế giới Leanbot — hệ thống bài giảng

> **Trạng thái 23/10/2026:** HLV duyệt (§9): trang riêng `/the-gioi-leanbot`, chỉ đánh dấu xong
> (không sao/coin), làm Đợt 1 trước (ADR-0030). **Đợt 1 đã có:** khung bài học, chấm bằng so code,
> luật 29, bài L0 và L1 của Chặng 0 (16 màn) — **HLV chơi thử và duyệt 23/10**. **Đợt 2 đã có:** Chặng 1,
bài B1a, B1b, B2 (26 màn), chờ HLV chơi thử. Vẫn chỉ HLV thấy.
> Nguồn nội dung: khóa gốc Pythaverse (`docs/leanbot/giao-trinh.md`) và 16 giáo án
> `docs/leanbot/giao-an/` — nhất là hai mục "Bé học xong thì làm được gì" và "Bé hay vướng ở đâu"
> của từng bài. Khối lệnh: `the-gioi-leanbot.md` §3 (đủ 93 khối, giống Pythaverse).

## 1. Vì sao

Lời HLV (23/10/2026): Xưởng Phiên Dịch đã ổn, nhưng *"chúng ta cung cấp con rất nhiều khối mới
mà không ai dạy thì các con sao mà làm được"*. Bé cần **bài học từng bước, từ dễ đến khó**: mỗi
màn học thêm một điều, và màn cuối làm được việc thật (**robot chạy trên sa bàn**).

Xưởng giữ đúng vai **công cụ phiên dịch**. Bài giảng là một thứ mới, nằm cạnh xưởng.

## 2. Đích cuối

Hết lộ trình, bé tự làm được:

1. Ghép chương trình bằng khối tiếng Việt, đọc được code C++ nó sinh ra, và ngược lại.
2. Nạp chương trình xuống Leanbot thật, chạm TB1A + TB1B, robot làm đúng.
3. **Chạy trọn một lượt thi AIROC hạng Creator trong 2 phút** trên sa bàn 4 ft × 4 ft: khoanh
   vùng, rải chất trung hòa, mang mẫu về phòng thí nghiệm, về CRL. **Hai lượt liên tiếp cùng ra
   một điểm** (giáo trình §9).

## 3. Tám nguyên tắc

1. **Bám đúng khóa gốc Pythaverse.** Thứ tự bài, con số (25 cm / 30 cm, 0° / 90°, mã vạch 6 và
   15…), chương trình mẫu đều lấy từ khóa gốc và giáo án. Không tự chế bài mới khi khóa gốc đã có.
2. **Một màn một ý.** Màn không vừa một ý thì tách đôi, không nhồi (AGENTS.md §9.2).
3. **Khối mở dần.** Màn đầu chỉ có 2–3 khối trong thanh khối. Mỗi màn mở thêm đúng khối mới của
   màn đó, và khối mới **sáng lên** lần đầu. Hết bài thì có đủ khối của bài. Đủ 93 khối chỉ có ở
   Xưởng Phiên Dịch.
4. **Biết trước mục tiêu.** Mỗi bài mở bằng "Học xong con làm được…" (có hình), mỗi màn mở bằng
   một câu nhiệm vụ ≤ 12 chữ.
5. **Tự chấm được.** Bé bấm "Kiểm tra" là biết đúng sai và sai ở đâu, không cần thầy.
6. **Ba vòng: hiểu → làm trên máy → làm trên robot.** Bài nào cũng kết bằng một màn robot thật.
7. **Chỗ bé hay vướng thành màn "tìm lỗi".** Mỗi dòng trong bảng "Bé hay vướng" của giáo án là
   một chương trình sai có sẵn để bé sửa (ví dụ: quên bọc trong khối Nhiệm vụ, chỉ đặt dấu trừ ở
   một bánh, `nếu` đặt ngoài vòng lặp).
8. **Có hình ở mọi màn.** Khối thì chụp từ trình soạn thật; robot thì ảnh chụp robot thật
   (AGENTS.md §9.20).

## 4. Một bài gồm những màn gì

Mỗi bài lấy trong các kiểu màn sau. Cột **Chấm** cho biết làm được ngay hay phải chờ.

| Kiểu màn | Bé làm gì | Chấm thế nào | Làm được khi nào |
|---|---|---|---|
| 📖 **Học** | Đọc 1 thẻ có hình: một khối mới, nó làm gì, code của nó | Không chấm, bấm "Hiểu rồi" | Ngay |
| 🧩 **Ghép theo mẫu** | Ghép khối theo hình chương trình mẫu | Code sinh ra **trùng** code mẫu | **Ngay** (bộ sinh code đã giống hệt Pythaverse) |
| 🔤 **Đọc code ra khối** | Cho code C++, bé ghép khối sao cho ra đúng code đó (Tầng 2 của giáo trình §8) | Code trùng | Ngay |
| 🔍 **Tìm lỗi** | Chương trình sai có sẵn, bé sửa | Code trùng lời giải; hoặc nhiều lời giải đúng thì dùng sa bàn ảo | Ngay (một lời giải); sau (nhiều lời giải) |
| 🔢 **Điền số** | Khối có sẵn, bé điền đúng số (15 cm, 90°, 25 cm…) | Code trùng | Ngay |
| 🤔 **Đoán trước** | Xem chương trình, chọn hình robot sẽ dừng ở đâu | Đáp án chọn | Ngay (hình vẽ sẵn); đẹp hơn khi có sa bàn ảo |
| 🗺️ **Sa bàn ảo** | Ghép chương trình, bấm ▶, robot ảo chạy trên sa bàn Synapse City | Robot tới đích, đủ điều kiện | **Sau**: cần sân mô phỏng (§8) |
| 🤖 **Robot thật** | Chép code, nạp ở Leanbot IDE, chạm TB1A + TB1B, đo kết quả | Bé tự tích từng ô kiểm (như Bài 0 khóa Leanbot); HLV xem | Ngay |
| ✅ **Ôn nhanh** | 3–5 câu hỏi của khóa gốc, đã dịch | Đáp án chọn | Ngay |

"Code trùng" so sau khi bỏ khoảng trắng thừa. Lời giải khác mà đúng (ví dụ đi 15 cm bằng
`Chạy đoạn đường 150 mm`) thì màn đó khai báo thêm các lời giải được chấp nhận.

Bé sai thì **chỉ đúng dòng sai**: so code bé với code mẫu, tô dòng khác đầu tiên, và Măng nói một
câu gợi ý lấy từ bảng "Bé hay vướng" (ví dụ dòng `runLRrpm(-30, 30)` khác `(-30, -30)` → *"Lùi thì
cả hai bánh đều có dấu trừ."*).

## 5. Lộ trình: 6 chặng, 15 bài, khoảng 110 màn

Bài 5–9 của khóa gốc (dữ liệu, AI, âm thanh, dáng người) **không có ở đây**: chúng dùng
Teachable Machine và Scratch, không dùng khối Leanbot. Chúng ở lại khóa Leanbot `/leanbot` và trên
Plearn. Hạng Creator không dùng AI khi thi (giáo trình §2).

Ký hiệu khối mới dùng đúng chữ trên khối (the-gioi-leanbot.md §3).

### Chặng 0 — Làm quen (buổi 0–1 của lịch)

**L0. Xưởng khối** — *Học xong: kéo được khối, điền số, chọn trong ô chọn, xóa khối, đọc code bên
phải.* Khối: `Nhiệm vụ: Bắt đầu ngay lập tức`, `Chờ`.

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 📖 | Màn hình có ba phần: khay khối, vùng ghép, code. Code đổi theo khối |
| 2 | 🧩 | Kéo khối `Nhiệm vụ` ra vùng ghép, xem 2 dòng code xuất hiện |
| 3 | 🧩 | Kéo `Chờ` vào **giữa miệng** khối Nhiệm vụ (dòng code nằm giữa begin và end) |
| 4 | 🔢 | Đổi số trong `Chờ` thành 3; đổi `giây` thành `mili giây`, xem code đổi `* 1000` |
| 5 | 🔍 | Khối `Chờ` nằm ngoài Nhiệm vụ → kéo vào trong (lỗi số 1 của bảng Bài 1) |
| 6 | 🔤 | Cho code `LbDelay(500);`, bé ghép ra đúng code đó |
| 7 | 📖 | Nút **Chép code** và Leanbot IDE: code này mang sang robot thế nào |

**L1. Chương trình đầu tiên** (GS2) — *Học xong: robot kêu bíp và sáng đèn theo lệnh của con.*
Khối: `Âm thanh: Kêu`, `Đèn: Tô đèn`, `Màu sắc`, `Đèn: Bật lên`, `Nhiệm vụ: Bắt đầu khi chạm cùng
lúc`.

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 🧩 | Robot kêu 1 tiếng bíp |
| 2 | 🔢 | Đổi Hz: số lớn kêu cao, số nhỏ kêu trầm; ba tiếng đồ–rê–mi |
| 3 | 📖 | 7 đèn O, A…F nằm ở đâu (ảnh chụp robot thật) |
| 4 | 🧩 | Tô đèn O màu đỏ — **đèn chưa sáng**: phải có `Đèn: Bật lên` |
| 5 | 🔍 | Chương trình tô màu mà quên `Bật lên` → sửa |
| 6 | 📖 | `Bắt đầu ngay` và `Bắt đầu khi chạm cùng lúc TB1A + TB1B`: robot đợi tay con |
| 7 | 🧩 | Chạm hai vùng → kêu bíp + sáng đèn xanh |
| 8 | 🤖 | Nạp xuống robot (dẫn sang Bài 0 khóa Leanbot nếu chưa cài máy), chạm, nghe bíp |

### Chặng 1 — Robot đi (Bài 1, Bài 2 của khóa gốc)

**B1a. Đi tới, đi lùi** — *Học xong: robot đi thẳng đúng 15 cm rồi lùi về.* Khối: `Di chuyển:
Chạy với vận tốc`, `Chạy đoạn đường`, `Dừng`.

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 📖 | Leanbot đi **hai bước**: bật bánh (`Chạy với vận tốc`) rồi chờ đủ đường (`Chạy đoạn đường`) |
| 2 | 🧩 | Đi tới 10 cm rồi dừng |
| 3 | 🔢 | Đi đúng 15 cm |
| 4 | 📖 | Dấu trừ nghĩa là lùi, và **cả hai bánh** đều trừ |
| 5 | 🔍 | Chỉ một bánh có dấu trừ → robot xoay thay vì lùi; sửa |
| 6 | 🧩 | Tới 15 cm, dừng 1 giây, lùi 15 cm |
| 7 | 🔤 | Đọc code ra khối: một chương trình 6 dòng |
| 8 | 🔍 | Quên `Chạy đoạn đường` → robot chạy mãi; sửa |
| 9 | 🤖 | Robot thật đi 15 cm; đo bằng thước, ghi số đo |

**B1b. Quay tại chỗ** — *Học xong: robot quay phải, quay trái đúng 90°, đi một hình vuông.* Khối:
`Di chuyển: Rẽ góc`, `lặp … lần`.

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 📖 | Quay = hai bánh ngược chiều; bánh nào lùi thì robot quay về phía đó |
| 2 | 🤔 | Trái 30 / Phải −30 thì quay về đâu? (chọn hình) |
| 3 | 🧩 | Quay phải 90° |
| 4 | 🧩 | Quay trái 90° |
| 5 | 🔍 | Muốn quay trái mà ghép ngược → sửa |
| 6 | 🧩 | Hình vuông: đi + quay, bốn lần, **không lặp** (dài) |
| 7 | 📖 | `lặp 4 lần` gói 8 khối thành 3 |
| 8 | 🧩 | Hình vuông bằng `lặp 4 lần` |
| 9 | 🤖 | Robot thật đi hình vuông; quay lố thì chỉnh 85° (Thử → Quan sát → Chỉnh) |
| 10 | ✅ | Ôn nhanh: câu hỏi kiểm tra Bài 1 của khóa gốc |

**B2. Tay gắp** — *Học xong: robot gắp một khối, chở đi 20 cm rồi thả.* Khối: `Tay gắp: Mở`,
`Khép`, `Xoay tới`, `Xoay tay Trái … Phải … trong`.

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 📖 | Mở = 0°, khép = 90° (ngược cảm giác; hình hai càng) |
| 2 | 🧩 | Mở rồi khép tay gắp |
| 3 | 🔢 | Xoay tới 45°: nửa mở nửa khép; giới hạn −30° … 120° |
| 4 | 🧩 | Xoay từng tay, trong 2000 mili giây (1 giây = 1000 mili giây) |
| 5 | 📖 | Thứ tự **gắp – chở – thả**: mở trước, tiến, khép, chờ 1 giây, chở, mở |
| 6 | 🔍 | Quên mở trước khi tiến → chộp hụt; sửa |
| 7 | 🧩 | Gắp – chở 20 cm – thả – lùi |
| 8 | 🤖 | Robot thật gắp một khối gỗ, chở, thả |

### Chặng 2 — Robot cảm nhận (Bài 3, Bài 4)

**B3. Mắt siêu âm** — *Học xong: robot chạy tới, dừng trước vật ở 25 cm, lùi tới khi trống hơn 30
cm.* Khối: `Siêu âm: khoảng cách phía trước`, `có vật trong vòng`, `nếu … thì`, `so sánh`, `lặp
khi`, `Serial: in` (để nhìn con số).

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 📖 | Siêu âm: phát tiếng, nghe tiếng vọng; T phát, R thu (ảnh robot thật) |
| 2 | 🧩 | In khoảng cách ra MONITOR mỗi giây (`Serial: in`) — nhìn con số đổi khi đưa tay |
| 3 | 📖 | `nếu … thì`: hỏi một lần, đúng thì làm |
| 4 | 🧩 | Nếu có vật trong vòng 25 cm thì kêu bíp |
| 5 | 🔍 | `nếu` để ngoài vòng lặp → chỉ hỏi một lần, robot đâm vào vật; sửa |
| 6 | 🧩 | Chạy tới, dừng khi vật ≤ 25 cm (chương trình 1 của khóa gốc) |
| 7 | 🧩 | Lùi **khi** vật còn ≤ 30 cm (`lặp khi`, chương trình 2) |
| 8 | 🤔 | Vì sao 25 và 30 khác nhau? (robot giật như yo-yo) |
| 9 | 🔍 | Dấu `≥` thay `≤`; đọc thành lời "còn gần thì còn lùi" |
| 10 | 🤖 | Robot thật dừng trước hộp ở 25 cm |

**B3b. Vùng chạm** — *Học xong: chạm vùng trước thì robot làm việc A, chạm vùng sau làm việc B.*
Khối: `Chạm: chờ tới khi chạm`, `Chạm: … đang được chạm?`, `nếu … thì … nếu không`.

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 📖 | TB1A…TB2B là **vùng chạm**, không phải nút (ảnh mép mạch) |
| 2 | 🧩 | Chờ tới khi chạm TB1A rồi kêu bíp |
| 3 | 🧩 | Chạm TB1A → đèn xanh; chạm TB2A → đèn đỏ (`nếu … nếu không`) |
| 4 | 🤖 | Robot thật đổi màu theo vùng chạm |

**B4a. Bốn mắt dò vạch** — *Học xong: nhìn 4 ô ⬜⬛⬛⬜ mà biết robot quẹo hướng nào.* Khối: `Dò
vạch: Đọc 4 mắt`, `4 mắt đang thấy`, `Dò vạch: ⬜⬜⬜⬜`, `Thấy vạch đen?`, `Hiện lên đèn`.

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 📖 | Nền trắng dội ánh sáng, vạch đen nuốt ánh sáng; 4 mắt dưới mũi robot |
| 2 | 🧩 | Hiện 4 mắt lên đèn (robot tự kiểm mắt nào thấy đen) |
| 3 | 🤔 | ⬜⬛⬛⬜ là đi thẳng; ⬛⬛⬜⬜ là quẹo về đâu? (4 câu) |
| 4 | 🧩 | Nếu 4 mắt thấy ⬜⬛⬛⬜ thì đi thẳng, nếu không thì dừng |
| 5 | 📖 | Cân chỉnh 7 bước bằng TB1A, màu đèn từng bước |
| 6 | 🤖 | Robot thật: cân chỉnh trên giấy trắng / đen, rồi hiện mắt lên đèn |

**B4b. Bám vạch** — *Học xong: robot bám vạch từ B tới C trên bản đồ Synapse City.* Khối thêm:
`xét hộp … nếu bằng …` (switch) hoặc chuỗi `nếu`.

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 📖 | Lệch trái thì quẹo phải: hai bàn tay làm hai bánh |
| 2 | 🧩 | Một bước lái: đọc mắt, chọn vận tốc hai bánh, đi 1 mm |
| 3 | 🧩 | Lặp bước lái tới khi không thấy vạch |
| 4 | 🔍 | Quẹo ngược hướng; sửa |
| 5 | 🗺️ | Sa bàn ảo: bám vạch B → C |
| 6 | 🔤 | Đọc code `FollowLine` mẫu ra khối (đọc theo 3 phần: đọc mắt, chọn hướng, kiểm tra đích) |
| 7 | 🤖 | Robot thật bám B → C, A → D, rồi A → H |
| 8 | ✅ | Ôn nhanh Bài 3–4 (phiếu ôn luyện A của giáo trình) |

### Chặng 3 — Hộp nhớ và phép (chuẩn bị cho nhiệm vụ)

Khóa gốc không có bài riêng, nhưng chương trình mẫu Bài 13–16 dùng **biến** (đếm ngã tư) và
**hàm** (`goToJunction`, `followLineMultipleJunctions`). Bé đã học hộp và phép ở Làng Măng (Thế
giới 7–8); ở đây chỉ nối sang khối Leanbot.

**H1. Hộp đếm** — *Học xong: robot đếm số ngã tư đã đi qua.* Khối: `tạo hộp`, `gán`, hộp số.

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 📖 | Hộp ở Làng Măng = biến ở đây; hộp có kiểu: số nguyên, chữ, đúng/sai |
| 2 | 🧩 | Tạo hộp `ngã_tư` = 0, mỗi lần gặp 4 mắt ⬛⬛⬛⬛ thì cộng 1 |
| 3 | 🧩 | In số ngã tư ra MONITOR |
| 4 | 🗺️ | Dừng ở ngã tư thứ 3 |

**H2. Phép của robot** — *Học xong: gói "tới ngã tư rồi dừng" thành một phép, dùng lại nhiều lần.*
Khối: `Hàm`.

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 📖 | Phép ở Làng Măng = hàm ở đây; code `void toiNgaTu() { … }` |
| 2 | 🧩 | Phép `tới ngã tư` |
| 3 | 🧩 | Phép có số: `qua N ngã tư` |
| 4 | 🔤 | Đọc ba hàm của chương trình mẫu Bài 15 ra khối |

### Chặng 4 — Thử trước, chạy thật sau (Bài 10–12)

**B10–12. Sa bàn ảo → robot thật** — *Học xong: cùng một chương trình chạy trên sa bàn ảo rồi trên
robot thật, lệch dưới 2 cm.*

| # | Kiểu | Bé làm |
|---|---|---|
| 1 | 📖 | Nhìn – nghĩ – làm; vì sao thử trên máy trước |
| 2 | 🤔 | Đoán trước robot dừng ở đâu, rồi mới chạy (Bài 11) |
| 3 | 🗺️ | Đổi **một số một lần**, xem robot đổi chỗ dừng |
| 4 | 🗺️ | Đường ngắn, ít chỗ rẽ từ Khu A tới Khu H |
| 5 | 📖 | Từ ảo sang thật: đổi khối bắt đầu thành `Bắt đầu khi chạm cùng lúc` (Bài 12) |
| 6 | 🤖 | Robot thật chạy cùng chương trình; đo lệch, chỉnh từng số (Thử → Quan sát → Chỉnh → Lặp) |

Bản Sao Số của Pythaverse vẫn dùng như khóa gốc (link ở màn), sa bàn ảo của mình là chỗ tập
thêm, không thay nó.

### Chặng 5 — Ba nhiệm vụ AIROC (Bài 13–16)

Mỗi nhiệm vụ: luật và điểm → đọc chương trình mẫu → sửa / thêm bước → sa bàn ảo → robot thật.

| Bài | Học xong làm được | Màn chính |
|---|---|---|
| **B13. Khoanh vùng** | Đẩy khối ô nhiễm vào khu cách ly, về CRL (+45, +40) | Luật đặt robot trong CRL · đọc chương trình mẫu · đổi số `Forward`/`Rotate` và đoán · đếm ngã tư · 🗺️ · 🤖 |
| **B14. Rải chất trung hòa** | Gắp khối ở kho S1–S6, chở, thả đúng màu (+160) | Ba điều kiện được điểm · thứ tự nhặt khối · **tự thêm** chờ 1 giây sau khi gắp và lùi sau khi thả · 🗺️ · 🤖 |
| **B15. Mang mẫu về phòng lab** | Kẹp khối ở F4, quay đầu chậm 180°, về CRL (+100) | 7 trường hợp của `runFollowLine` · quay đầu khi đang kẹp · ba hàm dò vạch khác nhau ở chỗ dừng · 🗺️ · 🤖 |
| **B16. Tổng hợp (trùm cuối)** | Trọn một lượt 2 phút | 11 chặng của `Fullmision` · bấm giờ từng chặng · chọn nhiệm vụ làm trước · 🗺️ hai lượt cùng điểm · 🤖 thi thử |

**Màn cuối của cả lộ trình:** 🤖 hai lượt thi thử liên tiếp trên sa bàn thật, bấm giờ 2 phút, cùng
ra một điểm. HLV xác nhận.

### Tổng

| Chặng | Bài | Màn (ước) |
|---|---|---|
| 0. Làm quen | L0, L1 | 15 |
| 1. Robot đi | B1a, B1b, B2 | 27 |
| 2. Robot cảm nhận | B3, B3b, B4a, B4b | 28 |
| 3. Hộp và phép | H1, H2 | 8 |
| 4. Thử trước | B10–12 | 6 |
| 5. Nhiệm vụ | B13–B16 | ~28 |
| **Cộng** | **15 bài** | **~112 màn** |

## 6. Nối với những thứ đã có

| Đã có | Quan hệ |
|---|---|
| **Khóa Leanbot** `/leanbot` (Bài 0–4, đọc + robot thật) | Giữ. Bài 0 (cài máy, nạp code) là **cửa vào** chặng 0 màn 🤖. Mỗi bài ở đây có link "Đọc thêm" sang bài cùng số ở khóa Leanbot, và ngược lại |
| **Xưởng Phiên Dịch** | Giữ, là công cụ tự do. Mọi màn có nút "Mở trong xưởng" mang chương trình đang ghép sang |
| **Làng Măng, Thế giới 6 robotlab** | Màn 📖 của Chặng 3 nhắc lại hộp/phép của Thế giới 7–8. Thế giới 6 vẫn luyện thứ tự nhiệm vụ (giáo trình §8 Tầng 3) |
| **Phiếu ôn luyện giấy** (giáo án) | Màn ✅ lấy câu hỏi từ đó; phiếu giấy vẫn dùng khi không có máy |

## 7. Dữ liệu một màn (phác thảo)

Mỗi bài một tệp `content/leanbot-world/<bai>.json`, schema zod riêng (như khóa Leanbot, ADR-0028):

```jsonc
{
  "id": "b1a-di-toi-di-lui",
  "title": "Đi tới, đi lùi",
  "canDo": "Robot đi thẳng đúng 15 cm rồi lùi về",   // "Học xong con làm được"
  "image": "b1a/muc-tieu.png",
  "screens": [
    {
      "kind": "build",                                // learn | build | code-to-blocks | fix | fill | predict | sim | robot | quiz
      "task": "Đi tới 10 cm rồi dừng",                // ≤ 12 chữ
      "newBlocks": ["LbMotion.run", "LbMotion.waitDistanceMm", "LbMotion.stop"],
      "toolbox": ["LbMission.beginImmediately_end", "Leanbot.delay", "…"],  // chỉ những khối này
      "start": "<xml>…</xml>",                         // chương trình ban đầu (rỗng, hoặc chương trình sai cho màn fix)
      "target": ["LbMission.begin(0);", "LbMotion.runLRrpm(30, 30);", "…"],  // code cần ra
      "accept": [],                                    // lời giải khác cũng đúng
      "hints": { "LbMotion.runLRrpm(30, -30);": "Đi thẳng thì hai bánh cùng dấu." }
    }
  ]
}
```

`content:check` kiểm: code `target` **biên dịch được** (một lần, qua `npm run leanbot:compile`),
lời giải ghép từ `toolbox` ra đúng `target`, khối trong `newBlocks` có trong `toolbox`, mỗi câu ≤ 12 chữ.

## 8. Kỹ thuật và thứ tự làm

| Đợt | Làm gì | Bé thấy gì | Cần |
|---|---|---|---|
| **Đ1** | Schema + màn hình bài học (khung xưởng + bảng hướng dẫn bên cạnh + nút Kiểm tra); thanh khối theo màn; chấm bằng so code; Chặng 0 (L0, L1) | 15 màn đầu | Không cần sân mô phỏng |
| **Đ2** | Chặng 1 (B1a, B1b, B2), màn 🤖 có ô tích | Robot đi, tay gắp | Hình chụp robot thật cho từng màn |
| **Đ3** | Chặng 2 (B3, B3b, B4a, phần không cần sân của B4b) | Cảm biến | Thử trên robot: thứ tự bit mắt dò vạch, chiều bánh âm |
| **Đ4** | **Sa bàn ảo**: kiểu game `leanbot`, mô phỏng liên tục (mm, độ), sa bàn Synapse City, tất định | Màn 🗺️ của B4b, H1 | ADR riêng; việc lớn nhất |
| **Đ5** | Chặng 3–4 | Hộp, phép, ảo → thật | Đ4 |
| **Đ6** | Chặng 5, thi thử | Ba nhiệm vụ, trùm cuối | Đ4, luật AIROC 2026 bản đầy đủ |

Mỗi đợt: HLV chơi thử rồi mới gộp vào `main`; bài chưa xong thì ẩn (AGENTS.md §9.10).

## 9. HLV đã chọn (23/10/2026)

1. Trang riêng `/the-gioi-leanbot` (phương án a). 2. Chỉ đánh dấu xong. 3. Làm Đợt 1 ngay.
4. Tên bài và câu "Học xong con làm được…": chưa góp ý — sửa khi chơi thử.

Câu hỏi gốc giữ lại bên dưới để biết vì sao chọn.

### Câu hỏi đã hỏi

1. **Bài giảng nằm ở đâu?**
   - (a) **Một trang riêng `/the-gioi-leanbot`**: danh sách bài → màn, giống khóa Leanbot; thẻ
     "Thế giới Leanbot" ở `/hub` dẫn vào, Xưởng là một nút trong đó. *Đề xuất*: không đổi schema
     thế giới của CodeQuest, làm được ngay.
   - (b) Thành các thế giới trên bản đồ CodeQuest `/map` (hướng cũ ở `the-gioi-leanbot.md` §5,
     cần ADR-0030 đổi schema `World`). Có sao/coin như Làng Măng, nhưng màn robot thật và màn đọc
     không hợp mô hình màn chơi (AGENTS.md §9.4).
2. **Sao và coin?** Có tính sao/coin cho màn tự chấm không, hay chỉ đánh dấu xong như khóa Leanbot?
3. **Bắt đầu từ Đ1** (Chặng 0, chấm bằng so code, chưa cần sa bàn ảo) — đồng ý?
4. Tên các bài và câu "Học xong con làm được…" ở §5: có chỗ nào cần sửa?
