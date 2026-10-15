# Đợt tăng độ khó (difficulty pass) — kiểm tra và kế hoạch

> Viết 14/10/2026 theo góp ý chơi thử của HLV: *"các màn chơi không phải mê cung đang quá dễ, thường lặp đi lặp lại 1 công thức… nên tăng độ khó và có thêm nhiều màn mê cung hơn… các màn có công thức lặp lại cách chơi nên giảm bớt."*
> Tài liệu này là **kế hoạch**, chưa sửa nội dung. Nguồn chuẩn vẫn là `product/curriculum.md` (thứ tự, bảng màn) và `product/game-kinds.md` (luật). Khi làm từng đợt, cập nhật bảng của thế giới trong `curriculum.md` trước, rồi mới sửa `content/`.
> Số liệu lấy bằng script đọc `solution` (màn `predict`: `initialWorkspace`; màn `bughunt`: lời giải đã sửa) của 137 màn trong `world.json → levelIds` của W1–W7 (không tính `w06-exam`). Chưa chạy `npm run par`: mọi `par` mới ở mục 3 là **ước lượng**, phải vét cạn khi soạn.

## 0. Tóm tắt

| Thế giới | Màn chấm | Mê cung bây giờ | Mê cung đề xuất | Runner bây giờ → đề xuất | Màn "=" (trùng công thức, chỉ đổi số) | Màn "≈" (cùng khung, đổi 1 khối/câu hỏi) |
|---|---:|---:|---:|---|---:|---:|
| W1 Làng Tre | 15 | 2 (13%) | 3 (20%) | 13 → 12 | 2 | 10 (chuỗi phản xạ runner) |
| W2 Rừng Lặp Lại | 20 | 7 (35%) | 11 (55%) | 13 → 9 | 2 | 9 |
| W3 Xưởng Sửa Lỗi | 15 | 4 (27%) | 7 (47%) | 11 → 8 | 1 | 9 |
| W4 Ngã Ba | 20 | 9 (45%) | 13 (65%) | 11 → 7 | **11** | 2 |
| W5 Sông Chờ Đợi | 20 | 8 (40%) | 13 (65%) | 12 → 7 | 6 | 6 |
| W6 Thành Phố Robot | 20 | 0 (robotlab 20) | 0 (robotlab 20, ≥ 6 sa bàn 2 chiều) | — | 4 | 10 (chuỗi robot) |
| W7 Chợ Đếm Số | 20 | 15 (75%) | 15 (75%, bản đồ 2 chiều) | — | 3 | 0 |
| **Tổng** | **130** | **45 (35%)** | **62 (48%)** | **60 → 43** | **29** | **46** |

W1 có 10 màn "≈" vì mọi chuỗi runner không lặp được tính một họ; ở thế giới dạy tuần tự đó là tự nhiên, nhưng chính nó là "một công thức" HLV thấy từ sớm.

Ba phát hiện chính:
1. **Runner là kiểu game nông.** Một làn, chỉ tiến, mỗi vật cản có **đúng một** cách vượt (hố → nhảy, cành → cúi, thùng → đá). Lời giải luôn là "đọc từ trái sang phải, gặp gì làm nấy": không có lựa chọn đường, không có hướng, không có ngõ cụt. 60/130 màn chấm là runner; trung vị lời giải 5 khối. Từ W4, luật D3 còn bó runner vào **một câu hỏi duy nhất** (phía trước có hố), nên 7 màn W4–W5 có cùng lời giải `lặp {nếu phía trước có hố {nhảy} nếu không {đi}}` hoặc `lặp đến khi phía trước có hố {đi}, nhảy, đi`.
2. **Mê cung hiện tại phần lớn là hành lang.** 27/45 màn mê cung không có ngã ba nào; chỉ 3/45 có ≥ 2 ngã ba (W5 `l07` sân trống, W5 `l16`, W7 `l18`). W7 có 15 mê cung nhưng bản đồ 3×9 với 6–7 ô mở: thực chất là đường chạy một làn vẽ trên lưới. W6 có 1/20 sa bàn có ≥ 2 ngã tư (`l19`); `l05`–`l13` là hành lang 3×5 với 5 ngã tư.
3. **Đường cong độ khó phẳng ở giữa mỗi thế giới**: W4 `l05`–`l12`, W5 `l13`–`l19` (đi xuống ở `l19`), W6 `l05`–`l13`, W2 `l11`–`l16`, W3 `l01`–`l08` (lời giải gần như y hệt W1).

Đề xuất: đổi **17 màn runner thành mê cung có ngã ba / ngõ cụt thật** (W1 1, W2 4, W3 3, W4 4, W5 5), làm khó tại chỗ ~8 màn, làm sa bàn W6 thành 2 chiều **sau chung kết AIROC (18/10)**, và làm bản đồ W7 thành 2 chiều. Không đổi ID, không đổi số màn, không thêm khối mới. Chi tiết ở mục 3, thứ tự làm ở mục 4.

## 1. Bảng kiểm tra từng màn

### 1.1 Cách đọc
- **khối**: số khối của lời giải (kể cả khối hỏi, không kể "khi bắt đầu"). **loại**: số loại khối khác nhau. **lồng**: số tầng vòng lặp. **qđ**: số điểm quyết định (`nếu`, `nếu … nếu không`, `lặp đến khi`, mỗi cái tính 1).
- **ngã/cụt**: với mê cung và robotlab, số ô có ≥ 3 lối (ngã ba, ngã tư) / số ngõ cụt (không tính S, G, L), tính trên bản đồ chính. Runner luôn "–" (một làn).
- **bđ**: số bản đồ (`1 + variants`).
- **hình lời giải**: viết tắt của chương trình. `×2` = hai khối giống nhau liền nhau; số lần lặp và số "tiến … ô" bỏ đi. `tiếnN` = `robot_forward`. `trước hố` = `phía trước có [hố]`; `đường trái` = `có đường [bên trái]`; `đích?` = `đã tới đích?`; `tới?` = `đã tới nơi?`; `phòng?`, `line?`, `màu?`, `măng?`, `hộp?` là các khối hỏi tương ứng; `lặp[hộp]` = `lặp [hộp] lần`.
- **D** (chỉ số độ khó thô) = khối + 2 × qđ + 2 × lồng + ngã + 2 × (bđ − 1). Chỉ để so sánh trong cùng thế giới, không phải điểm tuyệt đối.
- **Lặp công thức**: `= x` = hình lời giải **giống hệt** màn `x` đứng trước (chỉ khác con số). `≈ x` = cùng khung với `x`, chỉ đổi một khối hành động hoặc một ô chọn của câu hỏi (vd `lặp{đi}` ≈ `lặp{nhảy}`). Riêng chuỗi runner không có lặp / nếu tính chung một họ "chuỗi phản xạ" (≈ `w01-l01`), chuỗi robot không có lặp / nếu một họ (≈ `w06-l01`). So sánh trên toàn chương trình theo thứ tự chơi.
- Một số "=" là **thang PRIMM có chủ đích** (đoán → ghép hình → tự ghép → boss trên cùng chương trình, vd W4 `l13 → l14 → l16 → boss`, quyết định D5). Chúng vẫn được đánh dấu, mục 2 phân biệt.

### 1.2 Bảng

| id | kind | mode | stage | par | khối | loại | lồng | qđ | ngã/cụt | bđ | hình lời giải | D | lặp công thức |
|---|---|---|---|---:|---:|---:|---:|---:|---|---:|---|---:|---|
| `w01-l01` | runner | parsons | guided | 2 | 2 | 1 | 0 | 0 | – | 1 | `đi×2` | 2 |  |
| `w01-l02` | runner | build | guided | 3 | 3 | 1 | 0 | 0 | – | 1 | `đi×3` | 3 | = w01-l01 |
| `w01-l03` | runner | build | guided | 3 | 3 | 2 | 0 | 0 | – | 1 | `đi, nhảy, đi` | 3 | ≈ w01-l01 |
| `w01-l04` | runner | predict | practice | - | 3 | 2 | 0 | 0 | – | 1 | `đi, nhảy, đi` | 3 | = w01-l03 |
| `w01-l05` | runner | build | practice | 5 | 5 | 2 | 0 | 0 | – | 1 | `đi, nhảy, đi, nhảy, đi` | 5 | ≈ w01-l01 |
| `w01-l06` | runner | parsons | practice | 5 | 5 | 2 | 0 | 0 | – | 1 | `nhảy, đi×2, nhảy, đi` | 5 | ≈ w01-l01 |
| `w01-l07` | runner | build | practice | 4 | 4 | 3 | 0 | 0 | – | 1 | `cúi, đi, nhảy, đi` | 4 | ≈ w01-l01 |
| `w01-l08` | runner | predict | practice | - | 5 | 3 | 0 | 0 | – | 1 | `đi, nhảy, đi, cúi, đi` | 5 | ≈ w01-l01 |
| `w01-l09` | runner | bughunt | practice | 6 | 6 | 3 | 0 | 0 | – | 1 | `đi, nhảy, cúi, đi, nhảy, đi` | 6 | ≈ w01-l01 |
| `w01-l10` | runner | build | practice | 5 | 5 | 3 | 0 | 0 | – | 1 | `đi, đá, đi, nhảy, đi` | 5 | ≈ w01-l01 |
| `w01-l11` | runner | bughunt | practice | 6 | 6 | 4 | 0 | 0 | – | 1 | `đi, đá, đi, nhảy, cúi, đi` | 6 | ≈ w01-l01 |
| `w01-l12` | maze | build | practice | 4 | 4 | 2 | 0 | 0 | 1/3 | 1 | `tiến, phải, tiến×2` | 5 |  |
| `w01-l13` | runner | build | challenge | 10 | 10 | 4 | 0 | 0 | – | 1 | `đi, cúi, đi, đá, đi, nhảy, cúi, đi, nhảy, đi` | 10 | ≈ w01-l01 |
| `w01-l14` | maze | bughunt | challenge | 8 | 8 | 3 | 0 | 0 | 1/2 | 1 | `tiến×2, trái, tiến×2, phải, tiến×2` | 9 |  |
| `w01-boss` | runner | build | boss | 9 | 9 | 4 | 0 | 0 | – | 1 | `đi, đá, đi, cúi, đi, nhảy, đi×3` | 9 | ≈ w01-l01 |
| `w01-creative` | runner | creative | creative | - | 0 | 0 | 0 | 0 | – | 1 | `—` | – |  |
| `w02-l01` | runner | build | guided | 2 | 2 | 2 | 1 | 0 | – | 1 | `lặp{đi}` | 4 |  |
| `w02-l02` | runner | parsons | guided | 2 | 2 | 2 | 1 | 0 | – | 1 | `lặp{nhảy}` | 4 | ≈ w02-l01 |
| `w02-l03` | runner | build | guided | 2 | 2 | 2 | 1 | 0 | – | 1 | `lặp{cúi}` | 4 | ≈ w02-l01 |
| `w02-l04` | runner | predict | practice | - | 3 | 3 | 1 | 0 | – | 1 | `lặp{đi, nhảy}` | 5 | ≈ w02-l01 |
| `w02-l05` | runner | build | practice | 3 | 3 | 3 | 1 | 0 | – | 1 | `lặp{đi, nhảy}` | 5 | = w02-l04 |
| `w02-l06` | runner | build | practice | 4 | 4 | 3 | 1 | 0 | – | 1 | `nhảy, lặp{cúi}, nhảy` | 6 |  |
| `w02-l07` | runner | bughunt | practice | 4 | 4 | 3 | 1 | 0 | – | 1 | `lặp{cúi, nhảy}, nhảy` | 6 |  |
| `w02-l08` | maze | build | practice | 5 | 5 | 4 | 1 | 0 | 0/2 | 1 | `lặp{tiến, trái, tiến, phải}` | 7 |  |
| `w02-l09` | maze | parsons | practice | 5 | 5 | 4 | 1 | 0 | 0/2 | 1 | `lặp{tiến, phải, tiến, trái}` | 7 | ≈ w02-l08 |
| `w02-l10` | maze | predict | practice | - | 4 | 3 | 1 | 0 | 1/0 | 1 | `lặp{tiến×2, phải}` | 7 |  |
| `w02-l11` | runner | bughunt | practice | 4 | 4 | 4 | 1 | 0 | – | 1 | `lặp{đá, đi}, nhảy` | 6 | ≈ w02-l07 |
| `w02-l12` | maze | build | practice | 4 | 4 | 3 | 1 | 0 | 0/2 | 1 | `lặp{tiến×2, phải}` | 6 | = w02-l10 |
| `w02-l13` | runner | build | practice | 4 | 4 | 3 | 1 | 0 | – | 1 | `lặp{cúi}, lặp{nhảy}` | 6 |  |
| `w02-l14` | maze | build | practice | 5 | 5 | 3 | 1 | 0 | 0/2 | 1 | `lặp{tiến}, phải, lặp{tiến}` | 7 |  |
| `w02-l15` | runner | predict | practice | - | 4 | 3 | 1 | 0 | – | 1 | `lặp{đi}, lặp{nhảy}` | 6 | ≈ w02-l13 |
| `w02-l16` | runner | build | challenge | 5 | 5 | 4 | 1 | 0 | – | 1 | `lặp{đi, cúi, nhảy}, nhảy` | 7 | ≈ w02-l07 |
| `w02-l17` | maze | build | challenge | 7 | 7 | 4 | 1 | 0 | 0/2 | 1 | `lặp{tiến, trái, tiến, phải}, lặp{tiến}` | 9 |  |
| `w02-l18` | runner | bughunt | challenge | 6 | 6 | 5 | 1 | 0 | – | 1 | `đá, lặp{đi, cúi, nhảy}, nhảy` | 8 | ≈ w02-l06 |
| `w02-l19` | maze | build | challenge | 6 | 6 | 4 | 1 | 0 | 0/2 | 1 | `lặp{tiến×2, phải, tiến, trái}` | 8 |  |
| `w02-boss` | runner | build | boss | 6 | 6 | 5 | 1 | 0 | – | 1 | `lặp{đá, đi, cúi, nhảy}, nhảy` | 8 | ≈ w02-l07 |
| `w02-creative` | runner | creative | creative | - | 0 | 0 | 0 | 0 | – | 1 | `—` | – |  |
| `w03-l01` | runner | predict | guided | - | 6 | 2 | 0 | 0 | – | 1 | `đi, nhảy, đi×4` | 6 | ≈ w01-l01 |
| `w03-l02` | runner | bughunt | guided | 6 | 6 | 3 | 0 | 0 | – | 1 | `đi, nhảy, đi, cúi, đi×2` | 6 | ≈ w01-l01 |
| `w03-l03` | runner | bughunt | guided | 9 | 9 | 4 | 0 | 0 | – | 1 | `cúi, đi×3, nhảy, đá, đi×3` | 9 | ≈ w01-l01 |
| `w03-l04` | runner | predict | practice | - | 4 | 3 | 1 | 0 | – | 1 | `lặp{đi, nhảy}, đi` | 6 | ≈ w02-l07 |
| `w03-l05` | runner | bughunt | practice | 6 | 6 | 3 | 0 | 0 | – | 1 | `đi, đá, đi×2, nhảy, đi` | 6 | ≈ w01-l01 |
| `w03-l06` | maze | bughunt | practice | 5 | 5 | 3 | 1 | 0 | 1/2 | 1 | `lặp{tiến}, trái, lặp{tiến}` | 8 | ≈ w02-l14 |
| `w03-l07` | runner | parsons | practice | 7 | 7 | 4 | 1 | 0 | – | 1 | `lặp{đá, đi×2}, đi, nhảy, đi` | 9 | ≈ w02-l07 |
| `w03-l08` | runner | bughunt | practice | 5 | 5 | 4 | 1 | 0 | – | 1 | `lặp{nhảy}, cúi, đi×2` | 7 | ≈ w02-l07 |
| `w03-l09` | maze | predict | practice | - | 11 | 3 | 0 | 0 | 0/0 | 1 | `tiến×2, phải, tiến×2, phải, tiến×2, trái, tiến×2` | 11 |  |
| `w03-l10` | maze | bughunt | practice | 8 | 8 | 3 | 0 | 0 | 0/0 | 1 | `tiến×2, trái, tiến×2, phải, tiến×2` | 8 | = w01-l14 |
| `w03-l11` | runner | build | practice | 7 | 7 | 3 | 1 | 0 | – | 1 | `lặp{đi, nhảy}, lặp{nhảy}, lặp{đi}` | 9 |  |
| `w03-l12` | runner | bughunt | practice | 6 | 6 | 4 | 1 | 0 | – | 1 | `lặp{đi, nhảy}, cúi, đi×2` | 8 | ≈ w02-l07 |
| `w03-l13` | maze | bughunt | challenge | 8 | 8 | 3 | 1 | 0 | 0/0 | 1 | `lặp{tiến}, phải, lặp{tiến}, phải, lặp{tiến}` | 10 |  |
| `w03-l14` | runner | predict | challenge | - | 10 | 5 | 1 | 0 | – | 1 | `lặp{đi, nhảy}, lặp{cúi}, đá, lặp{đi}, nhảy, đi` | 12 |  |
| `w03-boss` | runner | bughunt | boss | 11 | 11 | 5 | 1 | 0 | – | 1 | `lặp{đi, nhảy}, đá, đi×2, lặp{cúi}, đi×3` | 13 |  |
| `w03-creative` | runner | creative | creative | - | 0 | 0 | 0 | 0 | – | 1 | `—` | – |  |
| `w04-l01` | runner | parsons | guided | 5 | 5 | 5 | 1 | 1 | – | 1 | `lặp{nếu trước hố{nhảy}, đi}` | 9 |  |
| `w04-l02` | runner | build | guided | 5 | 5 | 5 | 1 | 1 | – | 2 | `lặp{nếu trước hố{nhảy} khác{đi}}` | 11 |  |
| `w04-l03` | runner | predict | guided | - | 6 | 4 | 0 | 1 | – | 1 | `nếu trước hố{nhảy}, đi×3` | 8 |  |
| `w04-l04` | maze | build | guided | 5 | 5 | 5 | 1 | 1 | 0/0 | 1 | `lặp{nếu đường trước{tiến} khác{trái}}` | 9 |  |
| `w04-l05` | runner | bughunt | practice | 5 | 5 | 5 | 1 | 1 | – | 1 | `lặp{nếu trước trống{đi} khác{nhảy}}` | 9 | ≈ w04-l02 |
| `w04-l06` | runner | build | practice | 5 | 5 | 5 | 1 | 1 | – | 2 | `lặp{nếu trước hố{nhảy} khác{đi}}` | 11 | = w04-l02 |
| `w04-l07` | maze | predict | practice | - | 5 | 5 | 1 | 1 | 1/2 | 1 | `lặp{nếu đường trái{trái}, tiến}` | 10 |  |
| `w04-l08` | maze | build | practice | 5 | 5 | 5 | 1 | 1 | 0/0 | 1 | `lặp{nếu đường phải{phải}, tiến}` | 9 | ≈ w04-l07 |
| `w04-l09` | runner | parsons | practice | 8 | 8 | 7 | 1 | 2 | – | 1 | `lặp{nếu trước thùng{đá}, nếu trước hố{nhảy} khác{đi}}` | 14 |  |
| `w04-l10` | runner | predict | practice | - | 5 | 5 | 1 | 1 | – | 1 | `lặp{nếu trước hố{nhảy} khác{đi}}` | 9 | = w04-l02 |
| `w04-l11` | maze | bughunt | practice | 5 | 5 | 5 | 1 | 1 | 0/0 | 1 | `lặp{nếu đường phải{phải}, tiến}` | 9 | = w04-l08 |
| `w04-l12` | runner | build | practice | 5 | 5 | 5 | 1 | 1 | – | 2 | `lặp{nếu trước trống{đi} khác{nhảy}}` | 11 | = w04-l05 |
| `w04-l13` | maze | predict | practice | - | 8 | 7 | 1 | 2 | 1/1 | 1 | `lặp{nếu đường trái{trái}, nếu đường trước{tiến} khác{phải}}` | 15 |  |
| `w04-l14` | maze | parsons | practice | 8 | 8 | 7 | 1 | 2 | 1/3 | 1 | `lặp{nếu đường trái{trái}, nếu đường trước{tiến} khác{phải}}` | 15 | = w04-l13 |
| `w04-l15` | runner | bughunt | practice | 5 | 5 | 5 | 1 | 1 | – | 2 | `lặp{nếu trước hố{nhảy} khác{đi}}` | 11 | = w04-l02 |
| `w04-l16` | maze | build | practice | 8 | 8 | 7 | 1 | 2 | 1/1 | 2 | `lặp{nếu đường trái{trái}, nếu đường trước{tiến} khác{phải}}` | 17 | = w04-l13 |
| `w04-l17` | runner | build | challenge | 5 | 5 | 5 | 1 | 1 | – | 3 | `lặp{nếu trước hố{nhảy} khác{đi}}` | 13 | = w04-l02 |
| `w04-l18` | maze | bughunt | challenge | 8 | 8 | 7 | 1 | 2 | 0/0 | 2 | `lặp{nếu đường trái{trái}, nếu đường trước{tiến} khác{phải}}` | 16 | = w04-l13 |
| `w04-l19` | runner | bughunt | challenge | 5 | 5 | 5 | 1 | 1 | – | 2 | `lặp{nếu trước trống{đi} khác{nhảy}}` | 11 | = w04-l05 |
| `w04-boss` | maze | build | boss | 8 | 8 | 7 | 1 | 2 | 1/1 | 3 | `lặp{nếu đường trái{trái}, nếu đường trước{tiến} khác{phải}}` | 19 | = w04-l13 |
| `w04-creative` | maze | creative | creative | - | 0 | 0 | 0 | 0 | 2/1 | 1 | `—` | – |  |
| `w05-l01` | runner | build | guided | 4 | 4 | 4 | 1 | 1 | – | 2 | `đến khi trước hố{đi}, nhảy` | 10 |  |
| `w05-l02` | runner | parsons | guided | 6 | 6 | 4 | 1 | 1 | – | 1 | `đến khi trước hố{đi}, nhảy, đi×2` | 10 | ≈ w05-l01 |
| `w05-l03` | runner | predict | guided | - | 6 | 4 | 1 | 1 | – | 1 | `đến khi trước hố{đi}, nhảy, đi×2` | 10 | = w05-l02 |
| `w05-l04` | maze | build | guided | 3 | 3 | 3 | 1 | 1 | 0/0 | 2 | `đến khi đích?{tiến}` | 9 |  |
| `w05-l05` | maze | bughunt | practice | 3 | 3 | 3 | 1 | 1 | 0/0 | 1 | `đến khi đích?{tiến}` | 7 | = w05-l04 |
| `w05-l06` | runner | build | practice | 4 | 4 | 4 | 1 | 1 | – | 2 | `đến khi trước trống{nhảy}, đi` | 10 | ≈ w05-l01 |
| `w05-l07` | maze | predict | practice | - | 4 | 4 | 1 | 1 | 11/0 | 1 | `đến khi đích?{tiến, phải}` | 19 |  |
| `w05-l08` | runner | bughunt | practice | 5 | 5 | 4 | 1 | 1 | – | 2 | `đến khi trước hố{đi}, nhảy, đi` | 11 | ≈ w05-l01 |
| `w05-l09` | maze | build | practice | 7 | 7 | 5 | 1 | 2 | 1/1 | 2 | `đến khi đường phải{tiến}, phải, đến khi đích?{tiến}` | 16 |  |
| `w05-l10` | runner | parsons | practice | 6 | 6 | 6 | 1 | 2 | – | 1 | `đến khi tới?{nếu trước hố{nhảy} khác{đi}}` | 12 |  |
| `w05-l11` | runner | predict | practice | - | 6 | 4 | 1 | 1 | – | 1 | `đến khi trước hố{đi×2}, nhảy, đi` | 10 | ≈ w05-l01 |
| `w05-l12` | maze | bughunt | practice | 6 | 6 | 6 | 1 | 2 | 0/0 | 1 | `đến khi đích?{nếu đường trước{tiến} khác{phải}}` | 12 |  |
| `w05-l13` | runner | bughunt | practice | 6 | 6 | 6 | 1 | 2 | – | 2 | `đến khi tới?{nếu trước hố{nhảy} khác{đi}}` | 14 | = w05-l10 |
| `w05-l14` | maze | build | practice | 7 | 7 | 7 | 1 | 2 | 1/1 | 2 | `đến khi đích?{nếu đường trước{tiến, phải} khác{trái}}` | 16 |  |
| `w05-l15` | runner | bughunt | practice | 5 | 5 | 4 | 1 | 1 | – | 2 | `đến khi trước hố{đi}, nhảy, đi` | 11 | = w05-l08 |
| `w05-l16` | maze | parsons | practice | 9 | 9 | 8 | 1 | 3 | 2/1 | 1 | `đến khi đích?{nếu đường trái{trái}, nếu đường trước{tiến} khác{phải}}` | 19 |  |
| `w05-l17` | maze | build | challenge | 7 | 7 | 7 | 1 | 2 | 0/0 | 2 | `đến khi đích?{nếu đường trước{tiến, trái} khác{phải}}` | 15 | ≈ w05-l14 |
| `w05-l18` | runner | bughunt | challenge | 5 | 5 | 4 | 1 | 1 | – | 2 | `đến khi trước hố{đi}, nhảy, đi` | 11 | = w05-l08 |
| `w05-l19` | runner | predict | challenge | - | 4 | 4 | 1 | 1 | – | 1 | `đến khi trước hố{đá}, nhảy` | 8 | ≈ w05-l01 |
| `w05-boss` | runner | build | boss | 6 | 6 | 6 | 1 | 2 | – | 3 | `đến khi tới?{nếu trước hố{nhảy} khác{đi}}` | 16 | = w05-l10 |
| `w05-creative` | runner | creative | creative | - | 0 | 0 | 0 | 0 | – | 1 | `—` | – |  |
| `w06-l01` | robotlab | build | guided | 1 | 1 | 1 | 0 | 0 | 0/1 | 1 | `tiếnN` | 1 |  |
| `w06-l02` | robotlab | predict | guided | - | 1 | 1 | 0 | 0 | 0/1 | 1 | `tiếnN` | 1 | = w06-l01 |
| `w06-l03` | robotlab | build | guided | 3 | 3 | 2 | 0 | 0 | 0/1 | 1 | `tiếnN, phải, tiếnN` | 3 | ≈ w06-l01 |
| `w06-l04` | robotlab | parsons | guided | 5 | 5 | 3 | 0 | 0 | 0/1 | 1 | `tiếnN, phải, tiếnN, trái, tiếnN` | 5 | ≈ w06-l01 |
| `w06-l05` | robotlab | parsons | practice | 3 | 3 | 2 | 0 | 0 | 0/1 | 1 | `tiếnN, gắp, tiếnN` | 3 | ≈ w06-l01 |
| `w06-l06` | robotlab | build | practice | 6 | 6 | 4 | 0 | 0 | 0/1 | 1 | `tiếnN, gắp, phải×2, tiếnN, thả` | 6 | ≈ w06-l01 |
| `w06-l07` | robotlab | build | practice | 6 | 6 | 4 | 0 | 0 | 1/2 | 1 | `tiếnN, gắp, tiếnN, trái, tiếnN, thả` | 7 | ≈ w06-l01 |
| `w06-l08` | robotlab | bughunt | practice | 7 | 7 | 4 | 0 | 0 | 0/1 | 1 | `tiếnN, gắp, phải×2, tiếnN, thả, tiếnN` | 7 | ≈ w06-l01 |
| `w06-l09` | robotlab | build | practice | 7 | 7 | 4 | 0 | 0 | 0/1 | 1 | `tiếnN, gắp, phải×2, tiếnN, thả, tiếnN` | 7 | = w06-l08 |
| `w06-l10` | robotlab | parsons | practice | 7 | 7 | 5 | 1 | 0 | 0/2 | 1 | `lặp{tiếnN, gắp, phải×2, tiếnN, thả}` | 9 |  |
| `w06-l11` | robotlab | predict | practice | - | 7 | 4 | 0 | 0 | 0/1 | 1 | `tiếnN, gắp, tiếnN, thả, phải×2, tiếnN` | 7 | ≈ w06-l01 |
| `w06-l12` | robotlab | build | practice | 7 | 7 | 4 | 0 | 0 | 0/2 | 1 | `tiếnN, gắp, tiếnN, thả, phải×2, tiếnN` | 7 | = w06-l11 |
| `w06-l13` | robotlab | bughunt | practice | 7 | 7 | 4 | 0 | 0 | 0/1 | 1 | `tiếnN, gắp, phải×2, tiếnN, thả, tiếnN` | 7 | = w06-l08 |
| `w06-l14` | robotlab | build | practice | 3 | 3 | 3 | 1 | 1 | 0/1 | 2 | `đến khi phòng?{tiếnN}` | 9 |  |
| `w06-l15` | robotlab | parsons | practice | 6 | 6 | 6 | 1 | 2 | 0/1 | 1 | `đến khi phòng?{nếu line?{tiếnN} khác{trái}}` | 12 |  |
| `w06-l16` | robotlab | build | practice | 9 | 9 | 6 | 0 | 1 | 0/2 | 2 | `nếu màu?{trái} khác{phải}, tiếnN, thả, phải×2, tiếnN` | 13 |  |
| `w06-l17` | robotlab | bughunt | challenge | 9 | 9 | 6 | 0 | 1 | 0/2 | 2 | `nếu màu?{phải} khác{trái}, tiếnN, thả, phải×2, tiếnN` | 13 | ≈ w06-l16 |
| `w06-l18` | robotlab | predict | challenge | - | 18 | 5 | 0 | 0 | 0/2 | 1 | `tiếnN, gắp, tiếnN, thả, phải×2, tiếnN, phải, tiếnN, gắp, phải, tiếnN, thả, phải×2, tiếnN, trái, tiếnN` | 18 | ≈ w06-l01 |
| `w06-l19` | robotlab | build | challenge | 20 | 20 | 7 | 0 | 1 | 6/1 | 2 | `tiếnN, gắp, phải×2, tiếnN, thả, tiếnN, gắp, phải×2, tiếnN, nếu màu?{trái} khác{phải}, tiếnN, thả, phải×2, tiếnN` | 30 |  |
| `w06-boss` | robotlab | build | boss | 12 | 12 | 4 | 0 | 0 | 1/4 | 1 | `tiếnN, gắp, tiếnN, thả, phải×2, tiếnN, gắp, phải×2, tiếnN, thả` | 13 | ≈ w06-l01 |
| `w06-exam` | robotlab | creative | challenge | - | 48 | 5 | 0 | 0 | 12/3 | 1 | `tiếnN, phải, tiếnN, gắp, trái, tiếnN, phải, tiếnN, thả, phải, tiếnN, phải, tiếnN, gắp, trái×2, tiếnN, phải, tiếnN, thả, tiếnN, phải, tiếnN, gắp, tiếnN, phải, tiếnN, trái, tiếnN, phải, tiếnN, thả, tiếnN, trái, tiếnN, gắp, trái×2, tiếnN, phải, tiếnN, thả, tiếnN, gắp, trái×2, tiếnN, thả` | – |  |
| `w06-creative` | robotlab | creative | creative | - | 0 | 0 | 0 | 0 | 12/3 | 1 | `—` | – |  |
| `w07-l01` | maze | parsons | guided | 5 | 5 | 4 | 1 | 0 | 0/0 | 1 | `đặt, lặp{tiến, tăng}, tiến` | 7 |  |
| `w07-l02` | maze | predict | guided | - | 3 | 3 | 1 | 0 | 0/0 | 1 | `lặp{tiến, tăng}` | 5 |  |
| `w07-l03` | maze | build | guided | 5 | 5 | 5 | 1 | 1 | 0/0 | 2 | `lặp{nếu măng?{tăng}, tiến}` | 11 |  |
| `w07-l04` | maze | build | guided | 4 | 4 | 3 | 1 | 0 | 1/1 | 2 | `lặp[hộp]{tiến}, phải, tiến` | 9 |  |
| `w07-l05` | maze | bughunt | practice | 6 | 6 | 6 | 1 | 1 | 0/0 | 3 | `đặt, lặp{nếu măng?{tăng}, tiến}` | 14 |  |
| `w07-l06` | robotlab | build | practice | 9 | 9 | 6 | 1 | 0 | 1/4 | 2 | `lặp{tiếnN, gắp, phải×2, tiếnN, thả, tăng, phải}` | 14 |  |
| `w07-l07` | maze | predict | practice | - | 3 | 3 | 1 | 0 | 0/0 | 1 | `lặp{tiến, tăng}` | 5 | = w07-l02 |
| `w07-l08` | maze | build | practice | 7 | 7 | 5 | 0 | 1 | 0/0 | 2 | `tiến×2, nếu hộp?{trái} khác{phải}, tiến` | 11 |  |
| `w07-l09` | maze | parsons | practice | 8 | 8 | 7 | 1 | 2 | 1/1 | 1 | `đến khi hộp?{nếu măng?{tăng}, tiến}, phải, tiến` | 15 |  |
| `w07-l10` | maze | bughunt | practice | 5 | 5 | 5 | 1 | 1 | 0/0 | 2 | `lặp{nếu măng?{tăng}, tiến}` | 11 | = w07-l03 |
| `w07-l11` | robotlab | build | practice | 8 | 8 | 5 | 1 | 0 | 1/4 | 2 | `lặp[hộp]{tiếnN, gắp, phải×2, tiếnN, thả, phải}` | 13 |  |
| `w07-l12` | maze | predict | practice | - | 3 | 3 | 1 | 0 | 1/1 | 1 | `lặp[hộp]{tiến, tăng}` | 6 |  |
| `w07-l13` | robotlab | build | practice | 5 | 5 | 5 | 1 | 1 | 0/1 | 2 | `lặp{tiếnN, nếu màu?{tăng}}` | 11 |  |
| `w07-l14` | maze | parsons | practice | 8 | 8 | 6 | 1 | 1 | 0/0 | 1 | `lặp{nếu măng?{tăng} khác{tăng}, tiến}, phải, tiến` | 12 |  |
| `w07-l15` | robotlab | bughunt | practice | 5 | 5 | 5 | 1 | 1 | 0/1 | 2 | `lặp{tiếnN, nếu màu?{tăng}}` | 11 | = w07-l13 |
| `w07-l16` | maze | build | practice | 10 | 10 | 9 | 1 | 2 | 0/0 | 3 | `lặp{nếu măng?{tăng}, tiến}, nếu hộp?{trái} khác{phải}, tiến` | 20 |  |
| `w07-l17` | robotlab | build | practice | 10 | 10 | 8 | 1 | 1 | 0/1 | 2 | `đến khi màu?{tiếnN, tăng}, gắp, phải×2, lặp[hộp]{tiếnN}, thả` | 16 |  |
| `w07-l18` | maze | predict | challenge | - | 9 | 9 | 1 | 3 | 2/0 | 1 | `đến khi đích?{nếu đường trước{nếu măng?{tăng}, tiến} khác{phải}}` | 19 |  |
| `w07-l19` | maze | bughunt | challenge | 11 | 11 | 10 | 1 | 2 | 0/0 | 3 | `đặt, lặp{nếu măng?{tăng}, tiến}, nếu hộp?{trái} khác{phải}, tiến` | 21 |  |
| `w07-boss` | maze | build | boss | 10 | 10 | 8 | 1 | 1 | 1/1 | 3 | `lặp{nếu măng?{tăng}, tiến}, phải, lặp[hộp]{tiến}, trái, tiến` | 19 |  |
| `w07-creative` | robotlab | creative | creative | - | 0 | 0 | 0 | 0 | 12/3 | 1 | `—` | – |  |
`w06-exam` (thi thử, mode `creative`, không chấm) không nằm trong bảng: lời giải mẫu 48 lệnh trên sa bàn Thành Phố Măng 7×9 (12 ngã tư). Màn `creative` không có lời giải nên D để trống.

### 1.3 Đường cong độ khó theo thế giới

Chuỗi D theo thứ tự chơi (bỏ màn `creative`). Chữ sau số: `r` runner, `m` maze, `R` robotlab; `=`/`≈` như cột "Lặp công thức". **Đậm** = đoạn phẳng hoặc đi xuống.

| Thế giới | Chuỗi D | Đoạn phẳng / dễ |
|---|---|---|
| W1 | l01 2r · l02 3r= · l03 3r≈ · l04 3r= · l05 5r≈ · l06 5r≈ · l07 4r≈ · l08 5r≈ · l09 6r≈ · l10 5r≈ · l11 6r≈ · l12 5m · l13 10r≈ · l14 9m · boss 9r≈ | **l05–l11** (D 4–6, bảy màn cùng họ "chuỗi phản xạ", mỗi màn chỉ thêm 1 vật cản) |
| W2 | l01 4r · l02 4r≈ · l03 4r≈ · l04 5r≈ · l05 5r= · l06 6r · l07 6r · l08 7m · l09 7m≈ · l10 7m · l11 6r≈ · l12 6m= · l13 6r · l14 7m · l15 6r≈ · l16 7r≈ · l17 9m · l18 8r≈ · l19 8m · boss 8r≈ | **l01–l05** (ba màn `lặp{1 khối}` liền nhau), **l11–l16** (D 6–7, sáu màn), boss không khó hơn `l17` |
| W3 | l01 6r≈ · l02 6r≈ · l03 9r≈ · l04 6r≈ · l05 6r≈ · l06 8m≈ · l07 9r≈ · l08 7r≈ · l09 11m · l10 8m= · l11 9r · l12 8r≈ · l13 10m · l14 12r · boss 13r | **l01–l08**: lời giải là chuỗi W1 / lặp W2 (thế giới ôn tập, D1), nhưng bản đồ cũng ngắn như W1 |
| W4 | l01 9r · l02 11r · l03 8r · l04 9m · l05 9r≈ · l06 11r= · l07 10m · l08 9m≈ · l09 14r · l10 9r= · l11 9m= · l12 11r= · l13 15m · l14 15m= · l15 11r= · l16 17m= · l17 13r= · l18 16m= · l19 11r= · boss 19m= | **l05–l12** (D 9–11, chỉ hai chương trình runner luân phiên), **l15, l17, l19** quay về runner D 11–13 giữa các mê cung D 15–17 |
| W5 | l01 10r · l02 10r≈ · l03 10r= · l04 9m · l05 7m= · l06 10r≈ · l07 19m · l08 11r≈ · l09 16m · l10 12r · l11 10r≈ · l12 12m · l13 14r= · l14 16m · l15 11r= · l16 19m · l17 15m≈ · l18 11r= · l19 8r≈ · boss 16r= | **l01–l06** (phẳng, `l05` dễ hơn `l04`), **l15–l19** đi xuống (11 → 8), boss bằng `l09` |
| W6 | l01 1R · l02 1R= · l03 3R≈ · l04 5R≈ · l05 3R≈ · l06 6R≈ · l07 7R≈ · l08 7R≈ · l09 7R= · l10 9R · l11 7R≈ · l12 7R= · l13 7R= · l14 9R · l15 12R · l16 13R · l17 13R≈ · l18 18R≈ · l19 30R · boss 13R≈ | **l05–l13** (D 3–9, chín màn trên hành lang 3×5; `l08`, `l09`, `l12`, `l13` cùng một chương trình "tiến, gắp, quay đầu, tiến, thả, tiến"); boss (13) dễ hơn `l19` (30) |
| W7 | l01 7m · l02 5m · l03 11m · l04 9m · l05 14m · l06 14R · l07 5m= · l08 11m · l09 15m · l10 11m= · l11 13R · l12 6m · l13 11R · l14 12m · l15 11R= · l16 20m · l17 16R · l18 19m · l19 21m · boss 19m | Đường cong tốt nhất (5 → 21). Các "=" là cặp đoán/săn lỗi có chủ đích. Điểm yếu: bản đồ 3×9 một làn |

## 2. Chẩn đoán

### 2.1 Vì sao runner nông
- **Không có quyết định về đường.** Một làn, chỉ tiến: mọi chương trình đúng đi qua cùng một dãy ô. Bé không phải chọn hướng, không phải lập kế hoạch.
- **Mỗi vật cản có đúng một đáp án.** Bé học thuộc bảng "hố → nhảy, cành → cúi, thùng → đá" ở W1 là đủ cho mọi màn runner sau đó. Đây là "công thức" HLV thấy.
- **Lặp chỉ là nén chuỗi.** W2 runner = tìm chu kỳ của dãy vật cản. Sau 2–3 màn, bé nhìn dãy là ra thân lặp; các màn sau chỉ đổi độ dài chu kỳ (`lặp{đi}`, `lặp{nhảy}`, `lặp{cúi}`, `lặp{đi, nhảy}`, `lặp{cúi, nhảy}`, `lặp{đá, đi}`, `lặp{đi, cúi, nhảy}`…).
- **Từ W4, luật D3 cắt tiếp.** Vì "luôn cúi", "luôn đá", "nhảy cóc" thắng không cần hỏi, mọi màn runner tự ghép có điều kiện chỉ được hỏi về **hố**. Không gian chương trình đúng chỉ còn `nếu hố {nhảy} khác {đi}` và bản ngược `nếu trống {đi} khác {nhảy}`: 11 màn "=" của W4 đến từ đây.
- **A1 (thắng ngay ở cờ)** làm "lặp thừa" luôn thắng nếu ngay sau vòng lặp là cờ; muốn ép đếm phải thêm "đoạn đuôi khác mẫu" (ghi chú ⁴ của W2), cũng thành một công thức.
- Runner **vẫn có ích** cho việc **đọc** chương trình (`predict`, `parsons`, `bughunt`): hình một làn dễ theo dõi, bé tập trung vào khối. Đề xuất giữ runner cho các màn giới thiệu khối và các màn đọc, bỏ runner ở phần lớn màn `build` từ W2.

### 2.2 Cái gì làm mê cung giàu hơn
- **Hướng tương đối**: "bên trái của Măng" khi Măng nhìn xuống (ngộ nhận đã ghi ở W3 `l06`, W4 `l07`). Runner không có.
- **Ngã ba có lựa chọn**: hai đường tới đích, chỉ một đường ngắn (đúng `par`) cho ⭐⭐.
- **Ngõ cụt có hậu quả**: chương trình sai đi vào ngõ cụt rồi đâm tường, nên lỗi **nhìn thấy được**. Ngõ cụt có măng / chìa khóa buộc **đi vào rồi quay ra** (rẽ 2 lần = quay đầu).
- **Câu hỏi có nhiều đáp án đúng**: "bám tường trái" và "bám tường phải" đều đúng nhưng dài ngắn khác nhau trên bản đồ có ngõ cụt; với giới hạn 20 vòng (A7) chỉ một cách vừa.
- **Nhiều bản đồ khác hình** (`variants`): bản đồ khác **hình dạng** (không chỉ khác độ dài) mới ép chương trình tổng quát.
- Hiện tại 27/45 mê cung không có ngã ba, nên phần lớn các điểm trên **chưa được dùng**. Đổi sang mê cung mà vẫn vẽ hành lang thì không giải quyết góp ý.

### 2.3 Theo thế giới
- **W1**: `l01`–`l05` hợp lý cho tuần đầu. `l06`–`l11`, `l13`, boss cùng một họ "đọc vật cản, ghép khối tương ứng"; mê cung chỉ có ở `l12`, `l14`. Bị bó bởi thứ tự giới thiệu khối (nhảy `l03`, cúi `l07`, đá `l10`, rẽ `l12`) và chương truyện mở sau `l03`, `l07`, `l12`.
- **W2**: ba màn đầu đều `lặp{1 khối}`; `l05` = `l04`; runner `l11`, `l13`, `l15`, `l16`, `l18` chỉ đổi mẫu. Mê cung W2 có bậc thang nhưng không có ngã ba nào (0/7).
- **W3**: thế giới gỡ lỗi nên dùng lại chương trình cũ là cố ý (D1). Vấn đề là 8/11 runner là chương trình ngắn kiểu W1, và mê cung W3 cũng là hành lang (ngã ba ở `l06` duy nhất). Lỗi trong mê cung có ngã ba dễ thấy và thú vị hơn ("Măng rẽ nhầm vào ngõ cụt").
- **W4**: 11 màn "=". Runner `l05`, `l06`, `l10`, `l12`, `l15`, `l17`, `l19` gần như cùng một chương trình. Các mê cung `l13`–`l18` + boss cùng một chương trình hai câu hỏi (thang D5, chấp nhận được), nhưng `l18` thêm một lần nữa.
- **W5**: `lặp đến khi phía trước có hố {đi}, nhảy, đi` lặp ở `l02`, `l03`, `l08`, `l15`, `l18`. `l19` (thử thách) và boss dễ hơn giữa thế giới.
- **W6**: bị khóa bởi lịch AIROC (chung kết 17–18/10). Các màn `l05`–`l13` là hành lang; về sau cần sa bàn 2 chiều để "lập thứ tự nhiệm vụ" có nghĩa.
- **W7**: đa dạng chương trình tốt, nhưng mê cung là hành lang 3 hàng. Đổi bản đồ sang 2 chiều là đủ, không cần đổi kiểu game.

## 3. Kế hoạch sửa

### 3.1 Luật giữ nguyên (ràng buộc của mọi đợt)
- **Giữ ID, thay nội dung tại chỗ.** Không đánh số lại, không thêm / bớt màn: `world.levelIds`, `chapters[].unlockAfter`, `lesson.beforeLevel`, tiến độ đã lưu theo `levelId` đều không đổi. Không cắt màn: thay vì "gộp / cắt", màn trùng được **thay** bằng màn mê cung mới (giữ số màn 15/20/15/20/20 của `curriculum.md` §2).
- `curriculum.md` §7: tối đa 1 ý mới mỗi màn; mỗi mode `build`/`parsons`/`predict`/`bughunt` ≥ 1 lần mỗi thế giới; **không quá 3 `build` liền nhau**; `challenge` không có ý mới; boss dùng mọi khối của kiểu game boss. Đề xuất **giữ nguyên mode** của mọi màn bị thay (trừ W4 `l12`, `l19`, đã kiểm lại dãy mode ở dưới), nên dãy mode của mỗi thế giới không đổi.
- **Không thêm khối mới.** Mọi màn mới dùng khối đã có (tiến, rẽ trái/phải, lặp, nếu, nếu … nếu không, lặp đến khi, có đường, đã tới đích?). Không cần bài "Khối mới", không đổi tooltip. Hai ý mới không phải khối ("quay đầu = rẽ 2 lần" ở W2 `l13`, "nếu trong nếu không" ở W4 `l12`) có gợi ý `enter` riêng.
- Giữ các màn **giới thiệu khối** và màn có bài `beforeLevel`: W1 `l03`, `l07`, `l10`, `l12`; W4 `l01`, `l02`, `l04`, `l17`; W5 `l01`, `l04`, `l10`, boss; W6 `l01`, `l05`, `l06`, `l07`, `l09`, `l11`, `l14`, `l15`, `l16`; W7 `l01`, `l03`, `l04`, `l08`.
- Giữ nhân vật và nhiệm vụ của màn bị thay (vd W3 `l08` vẫn là "máy của Gấu nâu"), vì chương truyện kể lại các nhân vật đó (W3 chương "Máy nhặt măng lớn" mở sau `l12`: "Máy của Gấu nâu, Hổ, Chim cánh cụt chạy rồi").
- Luật soạn mê cung giữ: W1 ≤ 6×6; mọi mê cung ≤ 12×12; W4 ≤ 20 vòng (A7, D4); `maxLoopDepth: 1` từ W3 `l11` tới hết W5 (R2); `maxInstances` như W4/W5 hiện có; không `goal.items`/`collectAll` cùng `lặp đến khi đã tới đích` (D9); `par ≤ maxBlocks ≤ par + 2`.

### 3.2 Luật mới đề xuất cho màn mê cung (ghi vào `conventions/content-authoring.md` §2 khi làm đợt 0)
- **M1. Mê cung thật.** Từ W2, mỗi màn mê cung `build`/`bughunt` mới có **≥ 1 ngã ba và ≥ 1 ngõ cụt** mà một chương trình sai hợp lý (rẽ nhầm phía, lặp thừa, hỏi sai phía) sẽ đi vào. Từ W4, ≥ 2 ngã ba.
- **M2. Ngân sách công thức.** Trong một thế giới, một hình lời giải (cột "Lặp công thức") xuất hiện **tối đa 2 lần**, và lần thứ hai phải khác mode (thang PRIMM) **hoặc** khác loại bản đồ (thêm ngõ cụt, thêm bản đồ khác hình, thêm vật phẩm). Thang D5 của W4 (`l13 → l14 → l16 → boss`) là ngoại lệ đã duyệt.
- **M3. Nhiều bản đồ khác hình.** Màn nhiều bản đồ có câu hỏi: các bản đồ phải khác **hình** (rẽ ở chỗ khác, ngõ cụt ở phía khác), không chỉ khác độ dài.
- Đề xuất kèm: script kiểm "Lặp công thức" (bản sạch của script tạo bảng mục 1) chạy trong `content:check` dưới dạng **cảnh báo**, không chặn.

### 3.3 Từng thế giới

Ký hiệu: **[mê cung]** thay runner bằng mê cung, **[khó hơn]** giữ kiểu game, làm khó tại chỗ, **[giữ]** không đổi. Mọi `par` mới là ước lượng, phải chạy `npm run par -- <id>`.

#### W1 Làng Tre — mê cung 2 → 3/15
`l01`–`l05` **[giữ]**: tuần đầu phải nhẹ (HLV yêu cầu). `l07`, `l10`, `l12` **[giữ]** (giới thiệu cúi, đá, rẽ; chương truyện mở sau `l07`, `l12`). Mê cung không thể đứng trước `l12` (khối rẽ có bài `w01-lesson-re` ở `l12`, chương "Thùng gỗ chắn đường" nói "cuối làng… như mê cung").

| Màn | Việc | Phác thảo màn mới | Hình lời giải ép ra | Vì sao không lặp |
|---|---|---|---|---|
| `l06` parsons | [khó hơn] | Xếp lại 7 khối (3 hố, 1 hố ngay sau xuất phát, măng nằm giữa hai hố gần nhau) | `nhảy, đi, nhảy, đi×2, nhảy, đi` | Bản cũ 5 khối; thêm chỗ "nhảy rồi đi 1 ô rồi nhảy" mà bé hay xếp nhầm |
| `l09` bughunt | [khó hơn] | 11 ô, lỗi ở **giữa** (thiếu một nhảy sau cành), không ở đầu | 8 khối, parEdits 1 | Bé phải chạy Từng bước để tìm chỗ hỏng, không nhìn khối đầu là ra |
| `l11` bughunt | [khó hơn] | Hai khối đổi chỗ **xa nhau** (đá ở cuối, cúi ở đầu), 9 ô | 8 khối, parEdits 2 | Bản cũ đổi chỗ hai khối kề nhau |
| `l13` challenge | [mê cung] | 6×6 "Hai lối về làng": ngã ba ngay sau xuất phát, lối trái ngắn, lối phải dài có ngõ cụt; `par` = lối ngắn (~9), `maxBlocks` `par` + 2 | `tiến×2, trái, tiến, phải, tiến×2, phải, tiến` (khoảng) | Lần đầu chọn đường; ⭐⭐ chỉ cho lối ngắn. Runner "đủ mọi vật cản" của bản cũ đã có ở boss |
| `l14` bughunt | [khó hơn] | Giữ chữ Z và 2 lỗi, thêm 1 ngõ cụt cạnh chỗ rẽ sai, để lỗi rẽ nhầm phía **đi vào ngõ cụt** thay vì đâm tường ngay | `tiến×2, trái, tiến×2, phải, tiến×2` | Lỗi nhìn thấy được (Măng đi sai đường), không chỉ "đụng tường" |
| boss | [giữ] | Truyện "Mang măng về làng" đã duyệt. Câu hỏi K1 (mục 5) | | |

#### W2 Rừng Lặp Lại — mê cung 7 → 11/20
`l01`–`l04` **[giữ]** (guided + đoán). `l08` (bậc thang, chương "Bậc thang lên đồi" sau `l09`), `l09`, `l10`, `l14` (e2e `play-plan.spec.ts` dùng), `l15`, boss **[giữ]**. Gợi ý `turn-stay` "Rẽ chỉ quay tại chỗ…" chuyển từ `l08` sang `l06` (mê cung đầu tiên mới của W2).

| Màn | Việc | Phác thảo | Hình lời giải | Vì sao không lặp |
|---|---|---|---|---|
| `l05` build | [khó hơn] | Giữ "đi, nhảy × 3" nhưng thêm đoạn đuôi khác mẫu (⁴) để lặp thừa thì rơi hố | `lặp{đi, nhảy}, đi` (par 4, maxBlocks 4) | Bản cũ = `l04` (đoán); bản mới phải đếm đúng |
| `l06` build | [mê cung] | 6×7 "Lối vào rừng": Măng nhìn lên, phải rẽ phải trước, rồi hành lang 4 ô có 2 ngõ cụt nhánh lên, cuối rẽ trái 1 ô tới đích | `phải, lặp{tiến}, trái, tiến` (par 5) | Giữ ý cũ "khối trước + vòng lặp + khối sau"; lặp thừa đâm tường, rẽ sai phía vào ngõ cụt |
| `l11` bughunt | [mê cung] | Bậc thang 4 bậc, khối `rẽ phải` nằm **ngoài** vòng lặp (giữ ý cũ), parEdits 2 | `lặp{tiến, trái, tiến, phải}` | Ngộ nhận "khối ngoài lặp cũng bị lặp" nhìn thấy trên lưới: bậc thứ 2 đã đâm tường |
| `l12` build | [khó hơn] | Giữ chữ C quanh khóm tre, thêm ngõ cụt ở góc thứ 2 và đuôi 1 ô sau góc 3 để `lặp` thừa đâm tường | `lặp{tiến×2, phải}, tiến` (par 5) | Bản cũ = `l10` (đoán) và lặp thừa vẫn thắng |
| `l13` build | [mê cung] | 3×9 hành lang: măng ở cuối ngõ cụt **phía trước** Măng, đích ở đầu kia (sau lưng Măng). Tiến 3 ô nhặt măng (`collectAll`), quay đầu, tiến 6 ô tới đích. Gợi ý `enter`: "Rẽ 2 lần là quay đầu!" | `lặp{tiến}, phải×2, lặp{tiến}` (par 5, maxBlocks 6) | Giữ ý cũ "hai vòng lặp nối tiếp", thêm ý duy nhất "quay đầu"; dùng lại ở `l16` |
| `l16` challenge | [mê cung] | 5×9 "Lược măng": hành lang dưới, 4 ngõ cụt hướng lên cách nhau 2 ô, mỗi ngõ 1 măng (`collectAll`) | `lặp{trái, tiến, phải×2, tiến, trái, tiến×2}` (par 9, maxBlocks 10) | Lần đầu thân lặp có "đi vào, quay ra"; không màn nào trước có thân 8 khối |
| `l17` challenge | [khó hơn] | Giữ bậc thang + hành lang, thêm 1 ngõ cụt ở cuối hành lang (lặp thừa vào ngõ cụt) | như cũ (par 7) | Bản cũ mê cung không ngã ba |
| `l18` bughunt | [giữ] | Runner 3 lỗi, đọc chương trình dài: hợp với runner | | |
| `l19` challenge | [khó hơn] | 7×12 thêm 2 ngã ba có ngõ cụt dọc đường bậc thang lệch | như cũ (par 6) | Hiện 0 ngã ba |

Dãy mode W2 không đổi (`l12`–`l14` vẫn 3 build liền, không thêm).

#### W3 Xưởng Sửa Lỗi — mê cung 4 → 7/15
Giữ `l01`–`l04` (cặp đoán → sửa D2, chương "Máy xay chạy lại" sau `l03`), `l07` (chương "Lạc trong kho… lắp lại máy đá thùng" sau `l07`), `l11` (build duy nhất, `starGoals`, e2e `play-goals.spec.ts`), `l14`, boss (4 lỗi, truyện máy nhặt măng). Màn bị thay giữ nhân vật: đổi "máy" thành "xe dò đường" / "robot dọn kho" của cùng nhân vật.

| Màn | Việc | Phác thảo | Hình lời giải | Vì sao không lặp |
|---|---|---|---|---|
| `l05` bughunt | [mê cung] | "Xe dò đường của Cáo": 6×6 có ngã ba, khối `rẽ trái` **rời** khỏi chương trình nên xe đi thẳng vào ngõ cụt; nối lại (parEdits 1) | `tiến×2, trái, tiến×3` | Giữ ý "khối rời không chạy"; hậu quả nhìn thấy (vào ngõ cụt) |
| `l06` bughunt | [khó hơn] | Giữ "rẽ sai phía khi nhìn xuống", thêm ngõ cụt đúng phía rẽ sai | như cũ | Hiện = hình `w02-l14` |
| `l08` bughunt | [mê cung] | "Robot dọn kho của Gấu nâu": bậc thang 3 bậc trên 7×8, thân lặp có **thừa** một `tiến`; bậc 1–2 vẫn đi được nhờ hành lang rộng, bậc 3 đâm tường (parEdits 1) | `lặp{tiến, phải, tiến, trái}` | Giữ ý "thân lặp phải đúng cho mọi vòng"; runner cũ là `lặp{nhảy}` |
| `l10` bughunt | [khó hơn] | Thêm ngã ba: một trong hai lỗi đổi chỗ đưa Măng vào nhánh sai | như cũ | Hiện = hình `w01-l14` |
| `l12` bughunt | [mê cung] | "Xe giao hàng của Chim cánh cụt": 7×8 hai lỗi, sửa lỗi 1 (số lần lặp) chạy lại thấy lỗi 2 (rẽ nhầm vào ngõ cụt ở ngã ba) | `lặp{tiến}, phải, lặp{tiến}, trái, tiến×2` | Giữ ý "sửa một lỗi, chạy lại, thấy lỗi thứ hai"; khác `l13` (lỗi rẽ ở ngã ba, không phải sai phía) |
| `l13` challenge | [khó hơn] | Giữ 2 lỗi, thêm 1 ngã ba | như cũ | Hiện 0 ngã ba |

#### W4 Ngã Ba Quyết Định — mê cung 9 → 13/20 (đợt A)
Giữ runner: `l01` (nếu, parsons), `l02` (nếu … nếu không; bài `beforeLevel`), `l03` (đoán), `l06` (lặp đủ lớn, dạy D4), `l09` (hai câu nếu, parsons, thùng + hố), `l10` (đoán), `l17` (chìa khóa, bài `w04-lesson-chia-khoa`). Giữ mê cung `l04`, `l07`, `l08`, `l11`, `l13`, `l14`, `l16` (e2e), `l18`, boss.

| Màn | Việc | Phác thảo | Hình lời giải | Vì sao không lặp |
|---|---|---|---|---|
| `l05` bughunt | [mê cung] | 6×7, 2 bản đồ khác hình: hai nhánh `nếu có đường phía trước {tiến} nếu không {rẽ trái}` bị **ngược** (giữ ý cũ), ngõ cụt ở chỗ rẽ đầu | `lặp{nếu đường trước{tiến} khác{trái}}` (par 5, parEdits 2) | Thang PRIMM của `l04` (build → bughunt) trên bản đồ khác hình; thay runner = `l02` |
| `l08` build | [khó hơn] | Thêm ngõ cụt bên **trái** (không phải phải): `nếu có đường bên phải` bỏ qua nó đúng | như cũ | Hiện 0 ngã ba |
| `l11` bughunt | [khó hơn] | 2 bản đồ; bản 2 có lối phải dẫn vào ngõ cụt sớm hơn, nên hỏi sai phía lộ ra ngay | như cũ | Hiện = `l08` một bản đồ, 0 ngã ba |
| `l12` **parsons** (từ build) | [mê cung] | 7×7 "Ngã ba ưu tiên đi thẳng": xếp `lặp{nếu có đường phía trước {tiến} nếu không {nếu có đường bên trái {rẽ trái} nếu không {rẽ phải}}}`; bản đồ có rẽ cả hai phía | `lặp{nếu đường trước{tiến} khác{nếu đường trái{trái} khác{phải}}}` (par 8) | Ý mới duy nhất: `nếu` nằm trong `nếu không`. Parsons để bé thấy cấu trúc trước khi tự ghép (không bắt tự ghép ở W4) |
| `l15` bughunt | [mê cung] | "Chương trình thuộc lòng" (giữ ý cũ): `lặp{nếu có đường bên phải {rẽ phải}, tiến}` + một `rẽ trái` thuộc lòng ở đầu, đúng bản 1, sai bản 2; xóa khối thừa (parEdits 1) | `lặp{nếu đường phải{phải}, tiến}` | Bản đồ khác hình, ngõ cụt phía trái; thay runner = `l02` |
| `l19` **build** (từ bughunt) challenge | [mê cung] | 9×9 "Tay nào bám tường?": 2 bản đồ có ngõ cụt sâu bên trái; bám tường trái hết 20 vòng giữa đường, bám tường phải vừa | `lặp{nếu đường phải{phải}, nếu đường trước{tiến} khác{trái}}` (par 8, maxBlocks 8) | Lần đầu so sánh hai chiến lược; không phải ý mới (cùng cấu trúc `l14`), chỉ đổi phía |

Dãy mode W4 mới: p b pr b bh b pr b p pr bh **p** pr p bh b b bh **b** b → build liền nhau tối đa 2 (`l16`–`l17`, `l19`–boss). Mỗi mode vẫn ≥ 1. `l19` thôi là màn bughunt "2 lỗi" (đã có ở W3 nhiều).

#### W5 Sông Chờ Đợi — mê cung 8 → 13/20 (đợt A)
Giữ runner: `l01` (lặp đến khi, bài `beforeLevel`), `l02`, `l03` (0 vòng), `l10` (đã tới nơi?, bài `beforeLevel`, chương "Qua sông" sau `l10`), `l11` (đoán), `l19` (đoán thử thách, D8), boss (escort, truyện Gà con). Giữ mê cung `l04`, `l05`, `l07`, `l09`, `l12`, `l14` (`starGoals`), `l16`, `l17`.

| Màn | Việc | Phác thảo | Hình lời giải | Vì sao không lặp |
|---|---|---|---|---|
| `l05` bughunt | [khó hơn] | Giữ ý (khối `tiến` nằm ngoài vòng lặp nên vòng không dừng), thêm bản đồ thứ 2 dài hơn và một ngõ cụt cạnh đích | `đến khi đích?{tiến}` (parEdits 1) | Hiện = `l04` một bản đồ, D thấp hơn `l04` |
| `l06` build | [mê cung] | "Tìm cửa hang": Măng đứng trong hốc, cửa ra ở phía khác nhau trên 2 bản đồ; **xoay đến khi thấy đường**, rồi tiến đến đích | `đến khi đường trước{phải}, đến khi đích?{tiến}` (par 6) | Thân lặp là **khối rẽ** (Măng không đi): chưa màn nào có; giữ ý cũ "chờ bằng điều kiện có sẵn" |
| `l08` bughunt | [mê cung] | 6×8, 2 bản đồ: `lặp đến khi có đường bên trái {tiến}` hỏi **sai phía** (giữ ý "chờ sai thứ"); lối trái đầu tiên là ngõ cụt | `đến khi đường phải{tiến}, phải, đến khi đích?{tiến}` (parEdits 1) | Ngõ cụt làm lỗi nhìn thấy; là bước sửa trước bước tự ghép `l09` (thang ngược bughunt → build) |
| `l13` bughunt | [mê cung] | Giữ ý "lặp 20 lần không đủ": xoắn ốc 11×11 > 20 bước, đổi `lặp 20 lần` thành `lặp đến khi đã tới đích` | `đến khi đích?{nếu đường trước{tiến} khác{phải}}` (parEdits 2) | Bước sửa trước `l14` (tự ghép); thay runner = boss |
| `l15` bughunt | [mê cung] | Thân 2 khối `{tiến, tiến}` trong `lặp đến khi có đường bên trái`: lối ở ô chẵn (bản 1) thì đúng, ô lẻ (bản 2) thì đi quá lối rồi đâm tường | `đến khi đường trái{tiến}, trái, đến khi đích?{tiến}` (parEdits 1) | Giữ ý "đúng ở bản 1, quá ở bản 2"; ≈ `l09` nhưng khác phía và khác lỗi |
| `l18` bughunt challenge | [mê cung] | 2 lỗi: điều kiện sai phía + thân thừa `tiến`, 2 bản đồ 7×9 có ngõ cụt | `đến khi đường phải{tiến}, phải, đến khi đường trái{tiến}, trái, đến khi đích?{tiến}` | Ba vòng `lặp đến khi` nối tiếp: dài nhất W5 trước boss (`maxInstances` `cq_repeat_until` 3) |
| `l19` predict | [khó hơn] | Giữ ý (vòng lặp có dừng không), chương trình dài hơn: thùng + hố + `nếu` trong thân | | D hiện 8, thấp nhất nửa sau W5 |
| boss | [khó hơn] | Giữ escort 3 bản đồ và truyện Gà con; đặt Gà con ở ô mà nhảy cóc bay qua (R1) trên **cả 3** bản, thêm một bản có hố liền nhau cách 1 ô đất để `nhảy` thừa rơi hố | như cũ (par 6) | Boss D 16 = `l09`; ít nhất phải bằng `l16` |

#### W6 Thành Phố Robot — robotlab, sa bàn 2 chiều (đợt D, **sau 18/10**)
Không đụng W6 trước chung kết AIROC 17–18/10 (`phase-3.md`: W6 ưu tiên cho cuộc thi; các bé đang luyện). Sau đó:
- `l09` build (trung hòa) [khó hơn]: sa bàn 5×5 có 2 ngã tư, trạm nhử ở nhánh kia; phải chọn đường tới trạm đúng màu.
- `l12` build (chọn việc) [khó hơn]: 5×5, hai việc ở hai phía, đủ giờ cho một việc rồi về; bé so điểm/giây của hai đường.
- `l13` bughunt (quên về phòng) [khó hơn]: dùng lại sa bàn `l12`, đường về có hai lối, lối ngắn vừa giờ.
- `l08` bughunt [khó hơn]: chữ L thay hành lang thẳng, để "về phòng" cần rẽ.
- `l19`, boss [khó hơn]: boss trên sa bàn ≥ 5×7 (giống Thành Phố Măng), D boss ≥ D `l19`.
- `l01`–`l07`, `l10`, `l11`, `l14`–`l18` [giữ]. Mục tiêu: ≥ 6/20 màn có ≥ 2 ngã tư (hiện 1/20). Luật AIROC thật (P3-07) có thể đổi số giây; làm đợt D sau P3-07 nếu HLV đã gửi luật.

#### W7 Chợ Đếm Số — mê cung 15/20, bản đồ 2 chiều (đợt E)
Đường cong và đa dạng chương trình đã tốt. Chỉ làm bản đồ 2 chiều cho các màn hành lang 3×9: `l03`, `l05`, `l10` (đếm măng trên đường có 1–2 khúc rẽ, dùng `nếu có đường` sẵn có), `l14`, `l16`, `l19` (≥ 1 ngã ba trước chỗ chọn rẽ bằng hộp). `l07`, `l10`, `l15` là cặp đoán/săn lỗi có chủ đích [giữ hình lời giải]. Luật 23 (≥ 2 bản đồ, vét cạn `withoutVariables`) phải chạy lại cho từng màn đổi.

### 3.4 Ảnh hưởng phải xử lý trong mỗi đợt
- **`par`, `maxBlocks`, `parEdits`**: chạy `NODE_OPTIONS=--max-old-space-size=2048 npm run par -- <id>` **từng màn một**, không song song với e2e (máy 7,8 GB, `wsl-oom` đã xảy ra). Màn 8–9 khối có câu hỏi có thể vét cạn lâu: ghi số "VC ≤ n" vào "Ghi chú khi soạn" như R3.
- **Mục tiêu sao (`starGoals`)**: hiện chỉ `w03-l11`, `w04-l16`, `w05-l14`, đều giữ. Màn mê cung mới có ngõ cụt chứa măng là chỗ tốt cho đánh đổi thật (D12); chỉ thêm khi `npm run par` cho thấy cách rẻ nhất bỏ sót măng. W1–W2 không dùng `starGoals` (rewards-economy §1), dùng `config.goal.collectAll` làm điều kiện thắng.
- **Bài giảng**: không `beforeLevel` nào trỏ vào màn bị thay kiểu game (đã kiểm: W1 `l03`/`l07`/`l10`/`l12`, W4 `l01`/`l02`/`l04`/`l17`, W5 `l01`/`l04`/`l10`/boss, W6, W7 giữ). Thẻ `demo` của bài mở đầu dùng bản đồ riêng, không trỏ màn. `w02-lesson` đã đủ 6 thẻ nên "quay đầu" chỉ đi qua gợi ý `enter` của `l13`.
- **Gợi ý (`hints`)**: viết lại toàn bộ cho màn đổi kiểu game (lý do thua đổi từ `FELL_IN_HOLE`/`HIT_BRANCH` sang `HIT_WALL`/`NOT_AT_GOAL`). Màn `guided` ≥ 2 luật tầng 0, `practice` ≥ 1; `thinkingHint` là câu hỏi; không viết "ô số N".
- **Test nội dung**: `tools/content-check/src/w03.test.ts`, `w04.test.ts` (kiểm R1 "nhảy cóc" trên runner `l05`, `l06`, `l12`, `l15`, `l17`, `l19`), `w05.test.ts` (runner `l06`, `l08`, `l13`, `l15`, `l18`), `w06.test.ts`, `w07.test.ts` (luật 23). Bỏ kiểm runner của màn đã thành mê cung, thêm kiểm mê cung: lời giải ngắn nhất phải có câu hỏi; bản đồ có ≥ 1 ngã ba (M1). `curriculum.test.ts` kiểm dãy mode và "≤ 3 build liền" tự động.
- **e2e**: đã tìm ID trong `apps/web/e2e/`: màn bị thay kiểu game **không** có trong e2e (e2e dùng W1 `l01`–`l12`, W2 `l09`/`l14`/`l15`/boss, W3 `l01`/`l02`/`l06`/`l07`/`l09`/`l10`/`l11`/`l13`, W4 `l02`/`l04`/`l08`/`l10`/`l16`/`l17`/boss, W6 `l01`/`l12`/`l14`). Màn **[khó hơn]** có trong e2e (W1 `l06`, `l09`; W3 `l06`, `l10`, `l13`; W4 `l08`; W6 `l12`) phải chạy lại spec tương ứng. DoD: mỗi đợt thêm/sửa một test Playwright đi qua ít nhất một màn mới, có ảnh chụp.
- **Chương truyện (`unlockAfter`)**: ID giữ nên không đổi. Đọc lại câu chữ chương khi đổi nhân vật/nhiệm vụ của màn (W3 chương sau `l12`).
- **`curriculum.md`**: sửa dòng của từng màn đổi (Kind, Mode, Ý chính, par) và "Ghi chú khi soạn"; §5.5 D3 thêm câu "build có điều kiện từ W4 ưu tiên mê cung".
- **Tiến độ của bé**: tiến độ lưu theo `(profileId, levelId)` (`apps/web/src/features/progress/useProgress.ts`); sao chỉ tăng. Thay nội dung tại chỗ thì màn đã xong **vẫn xong**, sao cũ giữ, mở khóa thế giới (≥ 60% sao) không đổi. Bé đã qua màn cũ sẽ không bị buộc chơi lại; màn mới vẫn mở để chơi lại kiếm sao. Chỉ số "thắng lượt đầu" ở Góc HLV sẽ trộn lượt chơi bản cũ và bản mới.

## 4. Các đợt làm (ưu tiên)

| Đợt | Nội dung | Số màn | Ước lượng (AI) | Không cần HLV? |
|---|---|---:|---|---|
| **0** 🟨 nháp, chờ HLV chơi thử | Script "Lặp công thức" + chỉ số D thành cảnh báo trong `content:check` (không thêm dependency); luật M1–M3 vào `content-authoring.md` §2; cập nhật bảng `curriculum.md` cho đợt A | 0 | 0,5 ngày | Có |
| **A** 🟨 nháp, chờ HLV chơi thử | W4 (`l05`, `l12`, `l15`, `l19` mê cung; `l08`, `l11` khó hơn) + W5 (`l06`, `l08`, `l13`, `l15`, `l18` mê cung; `l05`, `l19`, boss khó hơn): nơi có 17/29 màn "=" | 14 | 2–2,5 ngày (vét cạn 8 khối chậm) | Có, trừ chơi thử trước merge |
| **B** 🟨 nháp, chờ HLV chơi thử | W2 (`l06`, `l11`, `l13`, `l16` mê cung; `l05`, `l12`, `l17`, `l19` khó hơn) + W3 (`l05`, `l08`, `l12` mê cung; `l06`, `l10`, `l13` khó hơn) | 14 | 2 ngày | Có, trừ chơi thử |
| **C** 🟨 nháp, chờ HLV chơi thử | W1 (`l13` mê cung; `l06`, `l09`, `l11`, `l14` khó hơn) | 5 | 0,5 ngày | Có; câu K1 về boss |
| **D** | W6 sa bàn 2 chiều (`l08`, `l09`, `l12`, `l13`, `l19`, boss) | 6 | 1 ngày | **Sau 18/10**; tốt nhất sau P3-07 (luật AIROC thật) |
| **E** | W7 bản đồ 2 chiều (`l03`, `l05`, `l10`, `l14`, `l16`, `l19`) | 6 | 1–1,5 ngày (luật 23 vét cạn hai lần mỗi màn) | Có, trừ chơi thử |

**Đã làm (14/10/2026), đợt 0 và A — 🟨 nháp, chờ HLV chơi thử:**
- Đợt 0: `content:check` **luật 24** (chỉ cảnh báo, `tools/content-check/src/difficulty.ts`): M1, M2 (hình lời giải = cột "Lặp công thức", chỉ "=", không tính "≈"), M3 (so "hình đường" ngắn nhất S → G). Fixture `extra-24-difficulty/`, test `difficulty.test.ts`. Luật soạn ở `conventions/content-authoring.md` §2.3, luật kiểm ở `architecture/content-model.md` §5. Chỉ số D **chưa** thành cảnh báo (chỉ số thô, mục R6). Lệch: M1, M2 bỏ qua Thế giới 1 và M1, M3 bỏ qua màn `guided` (màn giới thiệu khối giữ bản đồ đơn giản; W1 là chuỗi tuần tự, fixture `baseline/` là W1).
- Đợt A: 14 màn W4/W5 như bảng mục 3.3, `par` đã vét cạn từng màn; chi tiết, số vét cạn và **lệch kế hoạch** ở `product/curriculum.md` §5.2 và §5.3 (mục "Đợt tăng độ khó"). Lệch chính: W4 `l15` hỏi bên trái (bản kế hoạch không thắng được khi xóa khối thuộc lòng, và trùng hình `l08`/`l11` lần ba); W5 `l13` rẽ trái (tránh trùng `l12`/`l14` lần ba); thêm 2 bài ngắn `w04-lesson-neu-long`, `w05-lesson-xoay` cho 2 ý mới không phải khối (luật HLV 14/10: mọi ý mới cần câu cho bé, ví dụ chạy được và câu chuẩn; thay mặc định K4).
- Review độc lập 14/10 (REVISE, đã sửa): W4 `l19` thêm ngõ cụt bên phải chặn "trái rồi phải", `l15` đổi công thức (tiến thuộc lòng + chương trình `l12`), `l10` hỏi ô trống; W5 `l06` có sẵn vòng thứ hai, `l15` đổi công thức, boss thành mê cung 9 khối có đường vòng; luật 24 coi ảnh gương là một công thức, M1 chỉ đếm ô tới được, loại bản đồ ít nhạy hơn.
- `content:check` sau đợt A: W4 còn 8 ⚠ luật 24 (5 M2: `l06`, `l11`, `l17`, `l18`, `l19`; 3 M1), W5 còn 5 (0 M2), lý do giữ ghi ở `curriculum.md` §5.2, §5.3.

**Đã làm (14/10/2026), đợt B và C — 🟨 nháp, chờ HLV chơi thử:**
- Đợt B: W2 `l06`, `l11`, `l13`, `l16` thành mê cung, `l05`, `l12`, `l17`, `l19` khó hơn; W3 `l05`, `l08`, `l12` thành mê cung, `l06`, `l10`, `l13` khó hơn. Mê cung W2 7 → 11/20, W3 4 → 7/15. Ý mới "quay đầu" (W2 `l13`) có bài `w02-lesson-quay-dau` (demo rẽ phải ×2 và rẽ trái ×2) và câu chuẩn ở `content-authoring.md` §5.1. Chi tiết, số vét cạn và lệch kế hoạch: `product/curriculum.md` §4 (ghi chú cuối bảng) và §5.1. Lệch chính: luật A1 (thắng ngay ở đích) làm đuôi "…, đi" / "…, tiến" sau vòng lặp không bắt được lặp thừa, nên W2 `l05` đổi đuôi thành `nhảy` và `l12` đổi thân thành `{rẽ phải, tiến, tiến}`; W2 `l11` `parEdits` 1 (kéo khối vào vòng lặp là 1 thao tác) trên đường răng cưa; W2 `l13` chỉ một vòng lặp (`par` 5), hai vòng nối tiếp để cho `l14`; W2 `l17` thành hành lang + khóm tre (`par` 6), bậc thang W2 còn 3; W2 `l16` thêm `maxLoopDepth: 1`; W3 `l10` đổi chỗ khối 2–4, `par` 9; W3 `l12` lỗi 2 là thiếu một khối tiến (khác `l13`). Sau review (critic): e2e `apps/web/e2e/difficulty-bc.spec.ts`.
- Đợt C: W1 `l13` thành mê cung "Hai lối về làng" (6×6, `par` 10, lối dài = `maxBlocks` 12); `l06` (7 khối), `l09` (lỗi giữa, 8 khối), `l11` (đổi chỗ xa nhau, 8 khối), `l14` (ngõ cụt cạnh chỗ rẽ sai) khó hơn. Boss giữ runner (K1 mặc định). Mê cung W1 2 → 3/15. Chi tiết ở `product/curriculum.md` §3.
- `content:check` sau đợt B, C: W1 0 ⚠ (miễn luật 24), W2 2 ⚠ (M1 `l08`, `l14`, màn kế hoạch giữ), W3 0 ⚠. Test: `tools/content-check/src/w01.test.ts`, `w02.test.ts` (mới), `w03.test.ts`. Hình lời giải trái/phải đối xứng đã coi như cùng hình khi soạn (không tránh lặp bằng cách đổi trái ↔ phải).

Thứ tự đề xuất: 0 → A → B → C → E → D. Mỗi đợt là một nhánh / PR riêng, đủ "Định nghĩa xong" (lint, typecheck, test, content:check xanh; e2e có ảnh), rồi HLV chơi thử cả đợt một lần. AI không tự đánh dấu mục chơi thử là xong (`content-authoring.md` §6).

## 5. Rủi ro và câu hỏi cho HLV

HLV đã giao quyền quyết định: mọi câu dưới có **mặc định**, làm theo mặc định nếu HLV chưa trả lời, không chờ.

| # | Câu hỏi / rủi ro | Mặc định |
|---|---|---|
| K1 | Boss W1 "Mang măng về làng" có đổi sang mê cung nhặt 3 măng (truyện vẫn khớp) để W1 có 4/15 mê cung? | **Giữ runner.** Boss đã được chơi và là màn tổng hợp đi/nhảy/cúi/đá duy nhất |
| K2 | Bé đã có sao ở màn bị thay: giữ hay xóa? | **Giữ** (màn đã xong vẫn xong, sao không giảm). Không viết code đổi tiến độ |
| K3 | Tỉ lệ mê cung 55–65% từ W2 có hợp không, hay muốn cao hơn (≥ 75%)? | **55–65%**: runner còn cần cho màn giới thiệu khối và màn đọc (đoán, ghép hình) |
| K4 | "Quay đầu = rẽ 2 lần" (W2 `l13`) và "`nếu` trong `nếu không`" (W4 `l12`) là ý mới không phải khối: có cần bài giảng riêng? | **Không bài riêng**; gợi ý `enter` + `thinkingHint`. W4 `l12` là parsons, không bắt tự ghép |
| K5 | Có giữ runner cho `predict` / `bughunt` dài (W2 `l18`, W3 `l14`, boss W3) không? | **Giữ**: đọc chương trình dài trên một làn là đúng ý dạy |
| R1 | Mê cung lớn (9×9, xoắn ốc 11×11) làm vét cạn `par` chậm hoặc làm sập WSL | Một màn một lần, `--max-old-space-size=2048`, không chạy cùng e2e; bản đồ ≤ 9×9 trừ W5 `l13` |
| R2 | W4 giới hạn 20 vòng (A7): mê cung có ngõ cụt làm bám tường hết vòng | Dùng đúng điều đó ở `l19`; các màn khác giữ ≤ 16 vòng như boss |
| R3 | Mê cung khó hơn làm bé 8 tuổi nản | Giữ nhịp `content-authoring.md` §2 (sau 2–3 màn khó có 1 màn đoán/ghép hình); theo dõi chỉ số §6 rewards-economy ("thua > 3 lượt" thì nới) |
| R4 | Đổi W6 trước AIROC làm bé luyện trên bản khác bản thi | **Khóa W6 tới 19/10** |
| R5 | Bảng `curriculum.md` W3–W5 HLV đã duyệt 03/10; đổi kiểu game có thể ngược ý | Giữ nguyên **ý chính** và nhân vật của từng màn, chỉ đổi sân chơi; ghi thay đổi trong "Ghi chú khi soạn" để HLV xem lại khi chơi thử |
| R6 | Chỉ số "Lặp công thức" của script là thô (bỏ qua bản đồ) | Chỉ là cảnh báo; người soạn ghi lý do khi giữ một "=" (thang PRIMM, bản đồ khác hình) |
