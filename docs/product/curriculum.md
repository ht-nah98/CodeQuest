# Chương trình học

Nguồn chuẩn cho: thứ tự khái niệm, nội dung từng thế giới, danh sách màn của các thế giới đang xây.

## 1. Cấu trúc một thế giới

```
📖 Bài giảng mở đầu (lesson) ── bắt buộc xem 1 lần trước màn đầu tiên
🧩 guided    3–4 màn   có khung đỡ: ít khối, gợi ý tầng 0 dày
🎮 practice  7–12 màn  đa dạng kiểu game và cách chơi
🏆 challenge 2–4 màn   tùy chọn, giới hạn khối chặt, đòi tối ưu
👾 boss      1 màn     tổng hợp, có cốt truyện, mở thế giới tiếp theo
🎨 creative  1 màn     sân chơi tự do, không chấm (không tính vào số màn)
```
Mỗi khái niệm đi theo chu trình **PRIMM**: Đoán (`predict`) → Chạy → Soi (bài giảng tương tác) → Sửa (`bughunt`) → Tự làm (`build`). Trong một thế giới, mỗi cách chơi xuất hiện **ít nhất 1 lần**.

Kèm mỗi thế giới có **1 hoạt động ngoài màn hình** (unplugged) 5–10 phút để huấn luyện viên làm cùng các bé trong buổi học nhóm.

## 2. Tổng quan 10 thế giới

| # | ID | Thế giới | Khái niệm | Khối mới | Kiểu game | Màn | Giai đoạn xây |
|---|---|---|---|---|---|---:|---|
| 1 | `w01-lang-tre` | 🎋 Làng Tre | Tuần tự, thứ tự quan trọng | đi, nhảy, cúi, đá, tiến, rẽ trái/phải | runner, maze | 15 | GĐ 1 |
| 2 | `w02-rung-lap-lai` | 🌳 Rừng Lặp Lại | Lặp n lần, nhận ra mẫu lặp | lặp n lần | runner, maze | 20 | GĐ 1 |
| 3 | `w03-xuong-sua-loi` | 🔧 Xưởng Sửa Lỗi | Gỡ lỗi: đọc, tìm, sửa | (ôn tập) | runner, maze | 15 | GĐ 2 |
| 4 | `w04-nga-ba` | 🔀 Ngã Ba Quyết Định | Điều kiện nếu / nếu-không, cảm biến | nếu, nếu … nếu không, phía trước có…, có đường… | runner, maze | 20 | GĐ 2 |
| 5 | `w05-song-cho-doi` | 🌊 Sông Chờ Đợi | Lặp có điều kiện | lặp đến khi, đã tới đích?, đã tới nơi? (đề xuất) | runner, maze | 20 | GĐ 2 |
| 6 | `w06-thanh-pho-robot` | 🤖 Thành Phố Robot | Robot trên lưới line, tay gắp, nhiệm vụ AIROC, ngân sách thời gian | tiến … ô, rẽ trái/phải (như mê cung), gắp, thả, phía trước có line?, khối ở chỗ Bíp màu …?, đã về phòng thí nghiệm? (§6.1) | robotlab | 20 | GĐ 3 |
| 7 | `w07-cho-dem-so` | 🏪 Chợ Đếm Số | Biến ("hộp"), đếm, so sánh | đặt, tăng thêm, so sánh, lặp [hộp] lần, phía trước có măng? (§6.2) | maze, robotlab (§6.2; farm dời sau) | 20 | GĐ 3 (sau W6) |
| 8 | `w08-xuong-phep-thuat` | 🪄 Xưởng Phép Thuật | Hàm, tham số | định nghĩa / gọi hàm | turtle, music, robotlab | 20 | GĐ 4 |
| 9 | `w09-thap-hoa-si` | 🎨 Tháp Họa Sĩ | Lặp lồng nhau, góc, hình học | lặp lồng, góc, bút | turtle | 20 | GĐ 4 |
| 10 | `w10-hoc-vien` | 🧠 Học Viện Thuật Toán | Tìm đường, sắp xếp, tìm kiếm, tối ưu | danh sách, đổi chỗ | sorter, maze | 20 | GĐ 5 |

> Robot nằm ở **tầng giữa** (Thế giới 6) theo quyết định của huấn luyện viên. Bé đến đó đã có tuần tự, lặp, gỡ lỗi, điều kiện, lặp có điều kiện: đủ những gì Blockly cần cho AIROC. Robot quay lại trong boss Thế giới 7–8.

## 3. Thế giới 1 — 🎋 Làng Tre (chi tiết)

**Câu chuyện:** Gió to thổi bay hết măng của làng. Măng phải đi khắp làng nhặt lại.
**Bé làm được sau thế giới:** ghép chuỗi lệnh theo đúng thứ tự để nhân vật tới đích; giải thích được "đổi thứ tự thì kết quả đổi".
**Ngộ nhận nhắm tới:** khối rời vẫn chạy; thứ tự không quan trọng; nhân vật "tự biết" né chướng ngại.
**Unplugged:** dán băng keo thành đường trên sàn, một bé làm "robot", một bé đọc lệnh bằng thẻ giấy.

| # | ID | Chặng | Kind | Mode | Ý chính | Khối được dùng | maxBlocks | par | parEdits |
|---|---|---|---|---|---|---|---:|---:|---:|
| — | `w01-lesson` | (bài giảng) | — | — | Chương trình là gì? Máy làm đúng từng bước bạn ghép | — | — | — | — |
| 1 | `w01-l01` | guided | runner | parsons | Kéo khối và nối vào "khi bắt đầu" | đi | — | 2 | — |
| 2 | `w01-l02` | guided | runner | build | Ghép 3 bước đi | đi | — | 3 | — |
| — | `w01-lesson-nhay` | (bài Khối mới) | runner | — | Đi 1 ô so với **nhảy: bay qua 1 ô, đáp xuống ô thứ 2** (xa 2 ô, cả trên đất bằng) | đi, nhảy | — | — | — |
| 3 | `w01-l03` | guided | runner | build | Khối **nhảy** qua hố | đi, nhảy | — | 3 | — |
| 4 | `w01-l04` | practice | runner | predict | Đoán Măng dừng ở đâu | (chỉ xem) | — | — | — |
| 5 | `w01-l05` | practice | runner | build | Hai hố | đi, nhảy | — | 5 | — |
| 6 | `w01-l06` | practice | runner | parsons | Thứ tự quan trọng: xếp lại 7 khối, hố ngay sau xuất phát | đi, nhảy | — | 7 | — |
| — | `w01-lesson-cui` | (bài Khối mới) | runner | — | **Cúi xuống và đi 1 ô**, chui qua cành; nhảy vào cành là cụng đầu (thẻ sau giải thích) | đi, nhảy, cúi | — | — | — |
| 7 | `w01-l07` | practice | runner | build | Khối **cúi** dưới cành tre | đi, nhảy, cúi | — | 4 | — |
| 8 | `w01-l08` | practice | runner | predict | Đoán Măng vướng ở đâu | (chỉ xem) | — | — | — |
| 9 | `w01-l09` | practice | runner | bughunt | Thiếu một khối nhảy **giữa** chương trình (sau cành) | đi, nhảy, cúi | — | 8 | 1 |
| — | `w01-lesson-da` | (bài Khối mới) | runner | — | **Đá ô phía trước, Măng đứng yên** (ví dụ chỉ có khối đá); đi tiếp phải thêm khối đi | đi, đá | — | — | — |
| 10 | `w01-l10` | practice | runner | build | Khối **đá** thùng gỗ | đi, nhảy, cúi, đá | — | 5 | — |
| 11 | `w01-l11` | practice | runner | bughunt | Hai khối **xa nhau** đặt sai thứ tự (đá ở đầu, cúi gần cuối) | đi, nhảy, cúi, đá | — | 8 | 2 |
| — | `w01-lesson-re` | (bài Khối mới) | maze | — | **Tiến 1 ô**; **rẽ chỉ quay tại chỗ, chưa đi**; rẽ rồi mới tiến | tiến, rẽ phải | — | — | — |
| 12 | `w01-l12` | practice | maze | build | Mê cung đầu tiên: **tiến**, **rẽ** | tiến, rẽ trái, rẽ phải | — | 4 | — |
| 13 | `w01-l13` | challenge | maze | build | "Hai lối về làng": ngã ba ngay sau xuất phát, hai lối tới đích (lối dài vừa `maxBlocks`, có ngõ cụt) | tiến, rẽ trái, rẽ phải | 12 | 10 | — |
| 14 | `w01-l14` | challenge | maze | bughunt | Mê cung chữ Z có 2 lỗi; rẽ nhầm phía đi vào ngõ cụt | tiến, rẽ trái, rẽ phải | — | 8 | 2 |
| 15 | `w01-boss` | boss | runner | build | "Mang măng về làng": nhặt 3 măng (`collectAll`); nhảy qua măng là bỏ sót | đi, nhảy, cúi, đá | 11 | 9 | — |
| ✦ | `w01-creative` | creative | runner | creative | Sân chơi tự do trên đường chạy có sẵn (chưa có trình xây đường) | tất cả | — | — | — |

**Bài "Khối mới"** (góp ý HLV 03/10/2026): bé hay hiểu sai mỗi khối làm Măng đi bao xa (tưởng cúi là cúi tại chỗ, nhảy chỉ 1 ô, đá xong Măng tự đi, rẽ là rẽ và đi). Mỗi khối hành động mới có một bài 3–5 thẻ (`lesson.beforeLevel`, `architecture/content-model.md` §3) gắn trên viên đá của màn đầu tiên dùng khối đó; ví dụ chạy được cho thấy Măng dừng ở ô nào. Bài mở đầu `w01-lesson` đã dạy "mỗi khối đi là 1 bước" nên khối đi không có bài riêng. Trong màn, gợi ý `enter` "Khối mới: …" nhắc lại đúng câu đó (`l03`, `l07`, `l10`, `l12`), cùng câu với chú thích khối và `glossary.md`. Bài không khóa màn (`coach-questions.md` F10).

Thế giới 1 dạy tuần tự nên **không giới hạn số khối** ở các màn guided/practice: bé được thử thoải mái. `par` vẫn dùng để chấm ⭐⭐.

**Đợt tăng độ khó (14/10/2026, `roadmap/difficulty-pass.md` đợt C; 🟨 nháp, chờ HLV chơi thử):** `l01`–`l05`, `l07`, `l10`, `l12`, boss giữ nguyên (tuần đầu nhẹ; màn giới thiệu khối; boss vẫn là runner, mặc định K1). Thay tại chỗ, giữ ID và chương:
- `l06` `.O..O...O.F` (măng ô 3), 7 khối `nhảy, đi, nhảy, đi, đi, nhảy, đi`: hố ngay sau xuất phát, "nhảy, đi 1 ô, nhảy". `npm run par`: 35 cách xếp, đúng 1 thắng. Mảnh rời giữ id `walk1` (e2e `play-step-reset-speed.spec.ts`).
- `l09` `..O..BO.B.F`, ban đầu `đi, nhảy, đi, cúi, cúi, đi, đi` → `FELL_IN_HOLE@6` (lỗi **giữa** chương trình). Lời giải thêm nhảy sau cành đầu (8 khối, sửa 1, đúng 1 cách).
- `l11` `.B.O..C.F`, ban đầu `đá, đi, nhảy, đi, cúi, đi, đi, đi` → `HIT_BRANCH@1`; đổi khối đầu thành cúi → `HIT_CRATE@6`; đổi khối thứ 5 thành đá → thắng (8 khối, sửa 2; không cách 1 thao tác).
- `l13` runner → **mê cung** "Hai lối về làng" `#.G..#/#.##.#/#.#..#/#.##.#/#....#/##S###` (6×6, nhìn `N`): ngã ba ngay sau 1 ô; lối trái `tiến, rẽ trái, tiến, rẽ phải, tiến ×4, rẽ phải, tiến` (10 = `par`, 1 cách), lối phải 12 khối (= `maxBlocks`, chỉ ⭐) đi qua ngã ba có ngõ cụt `2,3`. Thanh khối tiến, rẽ trái, rẽ phải (đã học ở `l12`). **Không phải ý mới:** cả hai lối đều thắng, bé chỉ dùng tiến / rẽ đã học; "ít khối thì thêm sao" (`par` → ⭐⭐) có từ `l02` ở mọi màn, ở đây chỉ được nhìn thấy trên bản đồ. Mê cung W1 2 → 3/15. Chuỗi "đủ mọi chướng ngại" của bản cũ đã có ở boss.
- `l14` thêm ngõ cụt `4,2` (`######/##..G./##.###/S...##/##.###/######`, có hàng tường dưới để ngõ cụt không trông như lối ra): lỗi đầu (rẽ phải) đi xuống ngõ cụt rồi đụng tường (`HIT_WALL@4,2`) thay vì đụng ngay. `par` 8, sửa 2 (1 cách).
- Lệch kế hoạch: `l13` `par` 10 (kế hoạch ước 9): bản đồ phải ≤ 6×6 (§2 `content-authoring.md`) mà lối dài vẫn vừa `maxBlocks` 12.

## 4. Thế giới 2 — 🌳 Rừng Lặp Lại (chi tiết)

**Câu chuyện:** Rừng tre có những con đường lặp đi lặp lại. Phù thủy gió chỉ cho Măng mang theo rất ít khối.
**Bé làm được:** nhận ra đoạn lặp, dùng "lặp n lần" với một hoặc nhiều khối bên trong, đếm đúng số lần lặp.
**Ngộ nhận nhắm tới:** lặp chỉ chứa được 1 khối; số lần lặp = số ô; khối đặt ngoài vòng lặp cũng bị lặp.
**Unplugged:** vỗ tay theo nhịp "vỗ-vỗ-dậm" × 4, rồi viết thành "lặp 4 lần: vỗ, vỗ, dậm".

| # | ID | Chặng | Kind | Mode | Ý chính | maxBlocks | par |
|---|---|---|---|---|---|---:|---:|
| — | `w02-lesson` | (bài giảng) | — | — | Lặp lại thay cho ghép nhiều lần | — | — |
| 1 | `w02-l01` | guided | runner | build | Đường thẳng 6 ô, chỉ được 2 khối | 2 | 2 |
| 2 | `w02-l02` | guided | runner | parsons | Đặt khối vào **trong** vòng lặp | — | 2 |
| 3 | `w02-l03` | guided | runner | build | Đổi số lần lặp | 2 | 2 |
| 4 | `w02-l04` | practice | runner | predict | Lặp 3 lần thì Măng đi tới đâu? | — | — |
| 5 | `w02-l05` | practice | runner | build | Mẫu "đi, nhảy" × 4, rồi hố cuối sát ngay: lặp thừa hay thiếu đều rơi hố ⁴ | 4 | 4 |
| 6 | `w02-l06` | practice | maze | build | "Lối vào rừng": khối trước + vòng lặp + khối sau; hành lang có 2 ngõ cụt | 6 | 5 |
| 7 | `w02-l07` | practice | runner | bughunt | Thừa một vòng: "lặp 4 lần" phải là 3, sau vòng lặp còn 1 khối nhảy (parEdits 1) ⁴ | — | 4 |
| 8 | `w02-l08` | practice | maze | build | Bậc thang: "tiến, rẽ trái, tiến, rẽ phải" × 3 | 5 | 5 |
| 9 | `w02-l09` | practice | maze | parsons | Bậc thang xuống dốc: thứ tự khối **trong** vòng lặp (tiến, rẽ phải, tiến, rẽ trái) × 3 ¹ | — | 5 |
| 10 | `w02-l10` | practice | maze | predict | Đoán ô dừng của vòng lặp có rẽ | — | — |
| 11 | `w02-l11` | practice | maze | bughunt | Đường răng cưa "tiến, tiến, rẽ trái, tiến, rẽ phải": khối rẽ phải đặt ngoài vòng lặp, vòng 2 vào ngõ cụt (parEdits 1) | — | 7 |
| 12 | `w02-l12` | practice | maze | build | Ba cạnh quanh khóm tre: "rẽ phải, tiến, tiến" × 3 rồi 1 tiến; lặp thừa đụng khóm tre, thiếu vào ngõ cụt ² | 5 | 5 |
| — | `w02-lesson-quay-dau` | (bài ý mới) | maze | — | **Rẽ 2 lần là quay đầu** (rẽ phải 2 lần, rẽ trái 2 lần) | — | — |
| 13 | `w02-l13` | practice | maze | build | **Quay đầu** (một vòng lặp): nhặt măng ngay trước mặt, quay đầu, lặp tiến về đích sau lưng | 5 | 5 |
| 14 | `w02-l14` | practice | maze | build | **Hai vòng lặp nối tiếp** (ý mới của màn) trong mê cung (đoạn ngang 3, đoạn dọc 5) ⁵ | 6 | 5 |
| 15 | `w02-l15` | practice | runner | predict | Hai vòng lặp nối tiếp: đoán kết quả | — | — |
| 16 | `w02-l16` | challenge | maze | build | "Lược măng": 4 ngõ cụt có măng, thân lặp 8 khối (vào ngõ, quay đầu, ra, đi tiếp) | 10 | 9 |
| 17 | `w02-l17` | challenge | maze | build | Hành lang rồi vòng qua khóm tre: hai vòng lặp, mỗi vòng vừa đủ; hành lang thừa vào ngõ cụt ³ | 7 | 6 |
| 18 | `w02-l18` | challenge | runner | bughunt | Ba lỗi trong một chương trình, có hố cuối sau vòng lặp (parEdits 3) ⁴ | — | 6 |
| 19 | `w02-l19` | challenge | maze | build | Mê cung dài, `par` rất chặt; 2 ngã ba có ngõ cụt (quên rẽ trái là vào ngõ) | 7 | 6 |
| 20 | `w02-boss` | boss | runner | build | "Vượt rừng tre": 28 ô, mẫu "đá, đi, cúi, nhảy" × 6 rồi hố cuối ⁴ | 7 | 6 |
| ✦ | `w02-creative` | creative | runner | creative | Tạo nhịp điệu đường chạy riêng | — | — |

Ghi chú: thế giới này **chưa có lặp lồng nhau** (để dành Thế giới 9). Với màn `bughunt`, cột `par` là số khối của lời giải; sao ⭐⭐ chấm theo `parEdits` (số khối phải sửa).

Ghi chú khi soạn nháp (P1-13, đã sửa sau review sư phạm):
- ¹ ² ³ **Mê cung xoắn ốc** (dòng 9, 17 bản đầu) bỏ: trên lưới, xoắn ốc cạnh 2 ô luôn đặt đích sát ô xuất phát (đi tắt 2 khối), còn cạnh 3 ô thì lặp lồng `lặp 4 { lặp 3 {tiến}, rẽ }` chỉ 4 khối, ít hơn `par`, mà thế giới này chưa dạy lặp lồng. **Hình vuông kín** (dòng 12) cũng tạo đường tắt sang đích, nên đường quanh khóm tre là 3 cạnh (chữ C). Dòng 17 giờ là bậc thang + hành lang (`par` 7, `maxBlocks` 8).
- ⁴ Măng **thắng ngay khi chạm cờ / đích**, kể cả giữa vòng lặp, nên đặt số lần lặp **lớn hơn** cần vẫn thắng nếu ngay sau vòng lặp là đích. Để kỹ năng "đếm đúng số lần lặp" thật sự cần, các màn này có **đoạn cuối khác mẫu** ngay sau vòng lặp (hố cuối): lặp thừa 1 vòng là Măng rơi hố / đụng cành, lặp thiếu thì khối sau vòng lặp va vào chướng ngại. Các màn vẫn để số lặp thừa thắng được: `l01`, `l03`, `l08`, `l19` (`l05`, `l12` bắt đếm đúng từ đợt tăng độ khó) (màn dạy ý khác, hoặc mê cung nhìn thấy hết đường).
- ⁵ `l14` bản đầu bắt đầu nhìn lên (thêm 1 khối rẽ đầu tiên để `par` 6); đổi sang nhìn sang phải, `par` 5, `maxBlocks` 6. Lặp thừa ở đoạn ngang là đụng tường.
- Thế giới 2 không có khối hành động mới. `l08` (mê cung đầu tiên của thế giới) có thêm gợi ý `turn-stay` "Rẽ chỉ quay tại chỗ. Muốn đi thì thêm tiến!" khi bé thiếu khối tiến (góp ý HLV 03/10/2026, `glossary.md` dòng Rẽ).
- Mọi `par` đã được kiểm bằng vét cạn trên thanh khối của màn (số lần lặp 2–20, cho phép cả lặp lồng): không có lời giải nào ít khối hơn.
- **Đợt tăng độ khó (14/10/2026, `roadmap/difficulty-pass.md` đợt B; 🟨 nháp, chờ HLV chơi thử):** thay tại chỗ, giữ ID, chương (`l03`, `l09`, `l15`, boss), mode. Mê cung 7 → 11/20 (`l06`, `l11`, `l13`, `l16` thành mê cung); khó hơn `l05`, `l12`, `l17`, `l19`. W2 không có `nếu`; mọi màn chỉ dùng tiến, rẽ, lặp đã học.
  - `l05` `..O..O..O..O.OF` (15 ô): `lặp 4 {đi, nhảy}, nhảy` (`par` = `maxBlocks` 4, 1 cách). Lặp 5 hay lặp 3 đều rơi hố (đoạn cuối "hố, cờ" khác mẫu, ⁴).
  - `l06` `#######/##.#.G#/#S....#/#####.#/#######` (nhìn `N`): `rẽ phải, lặp 4 {tiến}, rẽ trái, tiến` (`par` 5, `maxBlocks` 6). Lặp thiếu thì rẽ vào ngõ cụt, lặp thừa đụng tường; 3 ngã ba, 3 ngõ cụt. Gợi ý `turn-stay` có ở đây (mê cung đầu tiên mới), `l08` vẫn giữ.
  - `l11` đường răng cưa (không phải bậc thang 1 ô) `##########/#######.G#/###.#...##/###...####/#S..######/##########`: ban đầu `lặp 3 {tiến, tiến, rẽ trái, tiến}, rẽ phải, tiến` → vòng 2 đi vào ngõ cụt `2,3` (`HIT_WALL@2,3`). Lời giải `lặp 3 {tiến, tiến, rẽ trái, tiến, rẽ phải}, tiến`.
  - `l12` `#######/#.S...#/####.##/.G...##/####.##/#######` (nhìn `N`): `lặp 3 {rẽ phải, tiến, tiến}, tiến` (`par` = `maxBlocks` 5, 2 cách). Lặp thừa đụng khóm tre (`HIT_WALL@3,2`), lặp thiếu vào ngõ cụt `4,4`.
  - `l13` `#########/#G....Sb#/###.#####/#########` (`collectAll`): `tiến, rẽ phải, rẽ phải, lặp 6 {tiến}` (`par` = `maxBlocks` 5; rẽ trái ×2 hoặc `lặp 2 {rẽ}` cũng thắng). **Một vòng lặp**, ý mới duy nhất là "quay đầu": bài `w02-lesson-quay-dau` (`beforeLevel` `l13`; hai thẻ demo: rẽ phải ×2 rồi tiến tới đích, rẽ trái ×2 rồi tiến tới đích), gợi ý `enter` và câu chuẩn ở `content-authoring.md` §5.1. "Hai vòng lặp nối tiếp" để lại cho `l14` (ý mới của `l14`).
  - `l16` "Lược măng" `############/##b#b#b#b###/#.S.......G#/############` (`collectAll`, `maxLoopDepth: 1`): `lặp 4 {rẽ trái, tiến, rẽ phải, rẽ phải, tiến, rẽ trái, tiến, tiến}` (`par` 9, `maxBlocks` 10; 34 cách, đều là thân này hoặc bản rẽ ngược chiều).
  - `l17` thành "hành lang và khóm tre" `########/#S.....#/#####.##/#..G..##/#####.##/########`: `lặp 4 {tiến}, lặp 2 {rẽ phải, tiến, tiến}` (`par` 6, `maxBlocks` 7), không còn bậc thang; hành lang thừa vào ngõ cụt `1,6`. `l19` thêm 2 ngõ cụt `3,3`, `4,5` dưới chỗ xuống bậc (quên rẽ trái thì vào ngõ), `par` giữ 6. Bậc thang W2 còn 3 màn (`l08`, `l09`, `l19`).
  - `npm run par` (từng màn, `--max-old-space-size=2048`): `l05` 4 (1) · `l06` 5 (21, có cách lặp lồng cùng 5 khối) · `l11` 7 · sửa **1** · `l12` 5 (2) · `l13` 5 · `l16` 9 (34) · `l17` 6 · `l19` 6 (34).
  - **Lệch kế hoạch:** (1) `l05` lời giải `lặp {đi, nhảy}, nhảy` (kế hoạch `…, đi`): Măng thắng ngay ở cờ (A1), nên nếu khối sau vòng lặp là `đi` thì vòng thừa cũng `đi` tới cờ và thắng; `par` 4 như kế hoạch. (2) `l12` thân `{rẽ phải, tiến, tiến}` bắt đầu nhìn lên (kế hoạch `{tiến, tiến, rẽ phải}, tiến`): cùng lý do A1, đuôi `tiến` sau thân bắt đầu bằng `tiến` không bắt lặp thừa đụng tường. (3) `l11` `parEdits` **1** (kế hoạch 2): kéo khối rẽ phải vào trong vòng lặp là 1 thao tác (`editDistance`), bản cũ đã có ⚠ này. (4) `l13` chỉ một vòng lặp (kế hoạch: hai vòng nối tiếp + quay đầu là 2 ý mới); bản đồ có thêm 1 ngách để có ngã ba (M1). (4b) `l11` đường răng cưa, `l17` hành lang + khóm tre thay cho bậc thang (review: W2 có 5 màn bậc thang). (5) `l16` thêm `maxLoopDepth: 1`: không có thì `lặp 4 {lặp 2 {rẽ trái, tiến, rẽ trái}, tiến, tiến}` thắng với 7 khối, mà W2 chưa dạy lặp lồng. (6) Bài `w02-lesson-quay-dau` (K4 mặc định không bài riêng), theo luật HLV 14/10 như W4 `l12`, W5 `l06`.
  - `l05` → `l07` là bước PRIMM có chủ đích: tự ghép đếm vòng có đoạn cuối khác mẫu (`l05`), rồi săn lỗi "thừa một vòng" (`l07`, hình khác: `lặp {cúi, nhảy}, nhảy`).
  - Còn ⚠ luật 24: `l08`, `l14` (M1, màn kế hoạch giữ: chương "Bậc thang lên đồi", e2e `play-plan.spec.ts`). Không còn ⚠ M2.

## 5. Thế giới 3–5 (chi tiết, bản nháp P2-10)

> **Hướng chung đã duyệt 03/10/2026**, kèm yêu cầu thêm nhiệm vụ và cốt truyện (§5.0). Sau đó bảng đã sửa theo review sư phạm độc lập (critic), nên HLV xác nhận từng màn khi **chơi thử** (P2-08/13/14). Câu hỏi còn mở: `roadmap/coach-questions.md` mục G (chỉ để ở đó, §5.5 trỏ tới).

Quy ước chung cho ba bảng dưới:
- **`par`, `maxBlocks`, `parEdits` là (dự kiến, vét cạn khi soạn).** Khi soạn file, chạy `npm run par` trên thanh khối thật của màn. Có lời giải ít khối hơn thì sửa bản đồ hoặc sửa `par`, rồi ghi lại ở đây như ghi chú W2.
- Bản đồ runner viết thành chuỗi ô, ô 0 là chỗ xuất phát: `.` đất · `O` hố · `B` cành · `C` thùng · `F` cờ / đích (luôn là ô cuối). Bản đồ maze viết từng hàng, ngăn bằng `/`, kèm hướng nhìn lúc đầu (`E` phải, `S` xuống, `N` lên, `W` trái). Ô `r,c` đếm từ 0.
- Chương trình viết gọn: `lặp 3 {đi, nhảy}`, `nếu <điều kiện> {…} nếu không {…}`, `lặp đến khi <điều kiện> {…}`. Khối điều kiện (`phía trước có …`, `có đường …`, `đã tới đích?`) cũng **tính là 1 khối**.
- **Cột "Mục tiêu ⭐"** (`starGoals`, P2-21; luật sao đã duyệt ở `rewards-economy.md` §1). `—` = màn build/bughunt không khai báo mục tiêu, giữ luật sao cũ. `·` = không áp dụng (predict, parsons, bài giảng, sáng tạo). Khi có mục tiêu, `par` là số khối ít nhất của chương trình **vừa thắng vừa đạt mọi mục tiêu**.
- `(N bản đồ)` = màn nhiều bản đồ (`variants`, P2-12): chương trình phải thắng **mọi** bản đồ. Chỉ dùng cho `build` và `bughunt`.
- **Đã kiểm thế nào** (03/10/2026): mọi bản đồ và chương trình (ban đầu, từng bước sửa, lời giải, khóa đoán) đã chạy trên một bộ mô phỏng Python nháp viết theo `game-kinds.md` §3.1–3.2. Màn `build` được **vét cạn** mọi chương trình đến một kích thước, dòng chi tiết ghi "VC ≤ n": thanh khối của màn, số lần lặp 1–20, lồng tối đa 2 tầng, mọi giá trị ô chọn; có ghi `maxInstances` khi màn đặt. Màn ghi "chưa VC" thì `par` mới là số khối của lời giải dự kiến. Engine thật vẫn là nguồn chuẩn: `content:check` và `npm run par` chạy lại khi soạn.

### 5.0 Cốt truyện và nhiệm vụ (yêu cầu của HLV 03/10/2026)
Từ Thế giới 3, Măng đã lớn: mỗi thế giới là **một câu chuyện liền mạch**, mỗi màn là **một nhiệm vụ** chứ không chỉ "đi tới cờ". Nhiệm vụ là **động lực, không phải ý mới**: luật chơi giữ nguyên, ý học của màn vẫn là cột "Ý chính".
- **Nhân vật lặp lại**, lấy từ bộ hình đại diện có sẵn (`apps/web/src/ui/Avatar.tsx`): **Thỏ Bông** (`bunny`), bạn thân của Măng · **bác Cú** (`owl`), chủ xưởng · **chú Ếch** (`frog`), lái đò ở sông · **Gà con** (`chick`), em nhỏ hay lạc · dân làng: bác Heo, Mèo, Cáo, Gấu nâu, Hổ, Chim cánh cụt, Gấu túi. Phù thủy gió vẫn là "người gây rối" (W2).
- **Dòng nhiệm vụ** (`mission`, ≤ 12 chữ, có giọng đọc) và **hình đích** (`goalSprite`: cờ · máy · cửa ra · nhà · dấu chân · bạn · lồng · bến đò). Chỉ để trang trí: không đổi luật, không đổi cách chấm.
- **Hai kiểu đích mới, rẻ, tất định, vét cạn được** (chi tiết T17 ở §5.4):
  - `rescue`: phải **đứng ở ô chìa khóa** trước khi tới lồng (đích).
  - `escort`: phải **đứng ở ô của bạn** (đón bạn) trước khi về nhà (đích).

  Cả hai là `collectAll` với vật phẩm có tên và hình riêng, kèm câu phản hồi riêng ("Cần chìa khóa trước!", "Chưa đón bạn kìa!"). Dùng ở W4 `l17`, W4 boss, W5 boss. "Các điểm phải đi qua theo thứ tự" để sau (chưa màn nào cần).
- Mạch truyện: **W3** Măng giúp bác Cú sửa máy cho dân làng. Cuối boss, bác Cú báo Thỏ Bông vào vùng Ngã Ba chưa về. **W4** Măng lần theo dấu Bông qua những con đường gió đổi mỗi lần; boss: lấy chìa khóa, mở lồng cứu Bông. **W5** cầu về làng bị gió cuốn; chú Ếch chỉ đá nổi qua sông; boss: qua sông đón Gà con rồi đưa em về nhà.
- **Truyện chia chương** (P2-24, góp ý HLV 06/10/2026): mạch truyện trên được kể ở cột trái trang thế giới thành 5 chương mỗi thế giới (mở đầu · sau vài màn đầu · giữa thế giới · trước boss · sau boss, mở sang thế giới sau). Lời truyện nằm trong `world.json` (`chapters`, `architecture/content-model.md` §3, luật 21); cách hiện: `design/screens-and-flows.md` §6. Chương mở theo màn bé thắng; chi tiết thêm (khăn của Bông, Gà con lạc trong bãi lau) chỉ để kể, không đổi màn nào.
- Nối tiếp về sau: `roadmap/later-phases.md` có ý tưởng **Hành trình phiêu lưu** (ra khơi, đảo hoang, vòng quanh thế giới) sau Thế giới 10. Giữ nhân vật và giọng kể ở đây để dùng lại được.

### 5.1 Thế giới 3 — 🔧 Xưởng Sửa Lỗi (chi tiết)

**Câu chuyện:** Xưởng của bác Cú chứa chương trình cho máy của cả làng. Phù thủy gió thổi qua, làm lệch vài khối trong mỗi chương trình. Măng làm **thợ sửa**: chạy thử, tìm khối gây lỗi, sửa ít nhất có thể. Cuối thế giới, bác Cú báo: "Thỏ Bông vào Ngã Ba chưa về!"
**Bé làm được sau thế giới:**
- đọc chương trình có sẵn và đoán Măng gặp nạn ở đâu;
- dùng nút **Từng bước** để tìm khối đầu tiên làm Măng đi khác ý;
- phân biệt **chỗ Măng gặp nạn** với **khối gây lỗi**;
- sửa từng lỗi một và chạy lại sau mỗi lần sửa;
- nhận ra các loại lỗi: sai khối, thiếu khối, khối rời, sai thứ tự, sai số lần lặp, khối nằm sai chỗ, rẽ sai phía.

**Ngộ nhận nhắm tới:** "Sai thì xóa hết làm lại"; "Khối gây lỗi là khối đang sáng lúc Măng ngã"; "Vòng đầu chạy đúng thì cả vòng lặp đúng"; "Rẽ trái là rẽ về phía trái màn hình"; "Sửa nhiều chỗ một lúc cho nhanh".
**Unplugged — "Robot đọc thẻ":** dán băng keo thành đường có 2 khúc rẽ. HLV xếp một chuỗi thẻ lệnh có **1 thẻ lạc chỗ**. Một bé làm "robot", đi đúng từng thẻ; các bé khác làm "thợ", hô "Dừng!" khi robot đi khác ý, rồi chỉ ra **thẻ nào** phải đổi (chỉ được đổi 1 thẻ). Vòng 2: thẻ thiếu nằm **trước** chỗ robot đâm tường. Vòng 3: các bé tự giấu 1 lỗi cho nhóm bạn tìm.
**Bài giảng `w03-lesson` (6 thẻ, mỗi thẻ ≤ 12 chữ):**
1. "Gió thổi lệch khối của máy. Măng làm thợ sửa!"
2. "Măng làm đúng từng khối. Khối lạc chỗ, Măng đi lạc."
3. `demo` runner (bản đồ `l01`): "Bấm Từng bước. Khối đang chạy sẽ sáng lên."
4. `demo` thiếu một khối đi: "Măng ngã ở hố, nhưng khối thiếu nằm trước đó."
5. "Sửa ít nhất: đổi một khối, rồi bấm Chạy."
6. `quiz` "Măng rơi hố. Con làm gì trước?": Xóa hết ghép lại / **Chạy từng bước**.

| # | ID | Chặng | Kind | Mode | Ý chính | Nhiệm vụ (hình đích) | Khối | maxBlocks | par (dự kiến, vét cạn khi soạn) | parEdits | Mục tiêu ⭐ |
|---|---|---|---|---|---|---|---|---:|---:|---:|---|
| — | `w03-lesson` | (bài giảng) | — | — | Lỗi là gì, chạy từng bước, sửa ít nhất | — | — | — | — | — | · |
| 1 | `w03-l01` | guided | runner | predict | Đọc chương trình sai, đoán Măng gặp nạn ở đâu | Máy xay của bác Heo chạy lạ. Đoán xem! (máy) | (chỉ xem) | — | — | — | · |
| 2 | `w03-l02` | guided | runner | bughunt | Sửa đúng 1 khối của chương trình ở màn 1; làm quen nút **Từng bước** | Sửa máy xay cho bác Heo nhé! (máy) | đi, nhảy, cúi | — | 6 | 1 | — |
| 3 | `w03-l03` | guided | runner | bughunt | Lỗi nằm **trước** chỗ ngã: thiếu một khối đi | Xe đẩy của Mèo bị kẹt. Tìm khối gây lỗi! (máy) | đi, nhảy, cúi, đá | — | 9 | 1 | — |
| 4 | `w03-l04` | practice | runner | predict | Đọc vòng lặp: mỗi vòng làm lại đúng các khối đó, dù đường đổi | Máy tưới của Gà con chạy tới đâu? (máy) | (chỉ xem) | — | — | — | · |
| 5 | `w03-l05` | practice | maze | bughunt | Khối rời không chạy: thiếu khối rẽ trái nên xe đi thẳng vào ngõ cụt; nối lại | Một khối rơi khỏi xe dò đường của Cáo. Nối lại! (máy) | tiến, rẽ trái, rẽ phải | — | 6 | 1 | — |
| 6 | `w03-l06` | practice | maze | bughunt | Rẽ sai phía khi Măng nhìn xuống (phía sai là ngõ cụt) | Tìm lối ra khỏi kho của bác Cú. (cửa ra) | tiến, rẽ trái, rẽ phải, lặp | — | 5 | 1 | — |
| 7 | `w03-l07` | practice | runner | parsons | Lắp lại chương trình bị gió thổi tung: khối nào trong, khối nào sau vòng lặp | Gió thổi tung khối. Lắp lại máy đá thùng! (máy) | đi, nhảy, đá, lặp | — | 7 | — | · |
| 8 | `w03-l08` | practice | maze | bughunt | Bậc thang, thân lặp thừa 1 tiến: vòng 1–2 vẫn đi được, vòng 3 đụng tường; thân vòng lặp phải đúng cho **mọi** vòng | Robot dọn kho của Gấu nâu hỏng ở vòng ba. (máy) | tiến, rẽ trái, rẽ phải, lặp | — | 5 | 1 | — |
| 9 | `w03-l09` | practice | maze | predict | Đọc chương trình mê cung có rẽ khi Măng nhìn xuống | Măng có ra khỏi kho không? Đoán xem! (cửa ra) | (chỉ xem) | — | — | — | · |
| 10 | `w03-l10` | practice | maze | bughunt | Hai khối đổi chỗ (sửa 2 thao tác): rẽ sớm vào ngõ cụt | Mang hộp đồ nghề về nhà bác Cú. (nhà) | tiến, rẽ trái, rẽ phải | — | 9 | 2 | — |
| 11 | `w03-l11` | practice | runner | build | Tự ghép từng đoạn, chạy thử sau mỗi đoạn | Tự ghép chương trình cho máy mới của Hổ. (máy) | đi, nhảy, cúi, đá, lặp | 9 | 7 | — | Nhặt măng ở bãi đất cuối |
| 12 | `w03-l12` | practice | maze | bughunt | Hai lỗi: sửa số lần lặp, chạy lại, thấy lỗi thứ hai (thiếu một khối tiến ở cuối, khác loại với `l13`) | Xe giao hàng của Chim cánh cụt có 2 lỗi. (máy) | tiến, rẽ trái, rẽ phải, lặp | — | 8 | 2 | — |
| 13 | `w03-l13` | challenge | maze | bughunt | Mê cung có vòng lặp, 2 lỗi: số lần lặp + rẽ sai phía (vào ngõ cụt) | Kho lớn có hai lỗi. Tìm lối ra! (cửa ra) | tiến, rẽ trái, rẽ phải, lặp | — | 8 | 2 | — |
| 14 | `w03-l14` | challenge | runner | predict | Đọc chương trình dài có 3 vòng lặp | Đọc chương trình dài của Gấu túi. (máy) | (chỉ xem) | — | — | — | · |
| 15 | `w03-boss` | boss | runner | bughunt | "Sửa máy nhặt măng": 4 lỗi khác loại, nhặt đủ 3 măng (`collectAll`) | Sửa máy nhặt măng lớn của cả làng! (máy) | đi, nhảy, cúi, đá, lặp | — | 11 | 4 | — |
| ✦ | `w03-creative` | creative | runner | creative | Ghép một chương trình có 1 lỗi, lưu và khoe với nhóm; trong buổi học nhóm, bạn chạy xem và nói lỗi ở đâu (câu G15) | Giấu một lỗi, đố bạn tìm! | tất cả | — | — | — | · |

Thế giới này **không có khối mới**. Chặng: 3 guided · 9 practice · 2 challenge · 1 boss. Mode: predict 4 · bughunt 9 · parsons 1 · build 1. Nhịp: sau 2 màn sửa lỗi có 1 màn đoán hoặc ghép hình.

Chi tiết từng màn (bản đồ → chương trình ban đầu → lời giải; kết quả mô phỏng):
1. `l01` `..O..B.F`. Chương trình `đi, nhảy, đi, đi, đi, đi` → `crash:HIT_BRANCH@5`. Thẻ: **Cụng cành tre** ✔ · Tới nơi (`win`) · Rơi xuống hố (`crash:FELL_IN_HOLE@2`) · Đứng trước máy (`stop@6`).
2. `l02` cùng bản đồ và chương trình của `l01` (Đoán → Chạy → Sửa trên **một** chương trình). Lời giải: khối thứ 4 (đi) → cúi (thắng). Gợi ý tầng 0: `enter` chỉ `run`; `run-end` + `HIT_BRANCH` chỉ `step` ("Bấm Từng bước, xem khối nào sáng.").
3. `l03` `.B...O.C.F`. Ban đầu `cúi, đi, đi, nhảy, đá, đi, đi, đi` → `FELL_IN_HOLE@5` (Măng nhảy từ ô 3, sớm 1 ô). Lời giải: chèn 1 khối đi trước nhảy (9 khối, thắng). Khối đang sáng lúc ngã là **nhảy**, nhưng nhảy không sai. Gợi ý: `FELL_IN_HOLE` → `step` "Trước khi nhảy, Măng đứng sát hố chưa?".
4. `l04` `..O.B.O.F`, chương trình `lặp 3 {đi, nhảy}, đi` → `crash:HIT_BRANCH@4` (vòng 2). Thẻ: **Cụng cành tre** ✔ · Tới nơi · Rơi hố thứ hai (`@6`) · Rơi hố đầu (`@2`).
5. `l05` (đợt tăng độ khó) mê cung `######/###G##/###.##/###.##/#S...#/######`, nhìn `E` (ngã ba ngay sau 2 ô, ngõ cụt phía trước). Ban đầu `tiến, tiến, tiến, tiến, tiến` + một khối **rẽ trái rời** nằm cạnh → `HIT_WALL@4,4` (xe đi thẳng vào ngõ cụt). Lời giải: nối khối rẽ trái vào sau 2 khối tiến (`tiến, tiến, rẽ trái, tiến, tiến, tiến`, thắng). Ở mode `bughunt`, khối rời bị làm xám (`Events.disableOrphans`, chỉ `parsons` không dùng: `blockly-integration.md`), nên câu gợi ý `orphans: true` "Khối xám này chưa nối nên không chạy." khớp với màn hình.
6. `l06` `########/##S#####/##.#####/##.#####/#.....G./##.#####/########`, nhìn `S` (đợt tăng độ khó: thêm ngõ cụt `4,1` đúng phía rẽ sai). Ban đầu `lặp 3 {tiến}, rẽ phải, lặp 4 {tiến}` → `HIT_WALL@4,1` (vào ngõ cụt). Lời giải: rẽ phải → rẽ trái (thắng).
7. `l07` `.C.C.C..O.F`, lời giải `lặp 3 {đá, đi, đi}, đi, nhảy, đi` (thắng). Xếp sai một khối đi ra ngoài (`lặp 3 {đá, đi}, đi, đi, đi, nhảy`) → `HIT_CRATE@5`.
8. `l08` (đợt tăng độ khó) mê cung bậc thang `#######/#S.####/##..###/##...##/###.G##/###.###/#######`, nhìn `E`. Ban đầu `lặp 3 {tiến, rẽ phải, tiến, tiến, rẽ trái}`: thừa 1 tiến nên mỗi bậc xuống 2 ô; vòng 1–2 đi được (khoảng rộng `3,2`–`5,3`), vòng 3 đụng tường (`HIT_WALL@5,3`). Lời giải `lặp 3 {tiến, rẽ phải, tiến, rẽ trái}` (xóa 1 khối).
9. `l09` `#######/#S..#G#/###.#.#/###...#/#######`, nhìn `E`. Chương trình `tiến, tiến, rẽ phải, tiến, tiến, rẽ phải, tiến, tiến, rẽ trái, tiến, tiến` → `crash:HIT_WALL@3,3`. Thẻ: **Đụng tường góc dưới** ✔ · Ra được cửa (`win`) · Đụng góc trên (`@1,3`) · Đứng dưới cửa (`stop@2,5`).
10. `l10` (đợt tăng độ khó) `########/####..G#/##.#.###/#S...###/########`, nhìn `E` (ngã ba `3,2`, ngõ cụt `2,2`). Ban đầu `tiến, rẽ trái, tiến, tiến, tiến, tiến, rẽ phải, tiến, tiến` → `HIT_WALL@2,2` (rẽ sớm vào ngõ cụt). Lời giải: đổi chỗ khối 2 và 4 (`tiến, tiến, tiến, rẽ trái, tiến, tiến, rẽ phải, tiến, tiến`, 2 thao tác, thắng).
11. `l11` `..O..O..O.O.O.O..F` (18 ô, măng ở ô 16), `maxLoopDepth: 1` (khi P2-11b có trường này). **Sửa khi soạn (P2-08, 04/10/2026):** bản đồ nháp 20 ô (`…O.O....F`) để lặp lồng `lặp 2 {lặp 3 {đi, nhảy}, lặp 3 {nhảy}}` thắng và nhặt măng với 6 khối (< `par` 7), mà `maxLoopDepth` chưa có. Cờ dời về ô 17: vòng ngoài thứ hai đi 16 rồi nhảy ra ngoài đường (`OFF_TRACK`), nên lặp lồng cần 7 khối (bằng `par`, câu G7). Lời giải đổi đoạn cuối thành `lặp 2 {đi}`; đánh đổi giữ nguyên: `npm run par` ra `min (goals) 7 · plain win 5` cả khi có và không lặp lồng (`--depth 1`). Lối 5 khối thành `lặp 3 {đi, nhảy}, lặp 4 {nhảy}`. Chỉ ghép đoạn 1 (`lặp 3 {đi, nhảy}`) rồi bấm Chạy: Măng dừng ở ô 9, ngay trước dãy hố sát nhau (`stop@9`), đúng lúc ghép đoạn 2. Gợi ý `enter`: "Ghép đoạn đầu rồi bấm Chạy xem."
    - **Đánh đổi sao:** `lặp 3 {đi, nhảy}, lặp 4 {nhảy}` (5 khối) thắng nhưng nhảy qua măng ở ô 16 (chỉ ⭐). `lặp 3 {đi, nhảy}, lặp 3 {nhảy}, lặp 2 {đi}` (7 khối) thắng và nhặt măng.
    - **VC ≤ 6** (không lặp lồng; 2,36 triệu chương trình ở cỡ 6): thắng nhỏ nhất 5 (32 cách, đều bỏ sót măng); không cách ≤ 6 khối nào vừa thắng vừa nhặt măng, nên `par` = 7. Cỡ 7 chưa vét cạn (≈ 4,5 × 10⁷ chương trình). Bỏ thùng để mất lối tắt "luôn đá"; cấm lặp lồng để mất lối tắt `lặp 2 {…}`.
12. `l12` (đợt tăng độ khó) mê cung `########/#S....##/####.###/####.###/####.###/##....G#/########`, nhìn `E` (ngã ba `1,4` và `5,4`, ngõ cụt `1,5` và `5,2`). Ban đầu `lặp 2 {tiến}, rẽ phải, lặp 4 {tiến}, rẽ trái, tiến` → `HIT_WALL@1,3`; sửa 2 → 3 → dừng ngay trước nhà (`stop@5,5`, `NOT_AT_GOAL`): thiếu 1 khối tiến; thêm tiến → thắng. Gợi ý `run-end` + `lastReason: NOT_AT_GOAL`: "Lỗi mới! Lỗi cũ con sửa được rồi đó."
13. `l13` (đợt tăng độ khó) `########/#####.##/#.....##/#.###.##/#.###G##/#.######/#S######/########`, nhìn `N` (ngã ba `2,5`, ngõ cụt `1,5`). Ban đầu `lặp 3 {tiến}, rẽ phải, lặp 4 {tiến}, rẽ trái, lặp 2 {tiến}` → `HIT_WALL@3,1`; sửa 3 → 4 → rẽ trái vào ngõ cụt, `HIT_WALL@1,5`; sửa rẽ trái → rẽ phải → thắng.
14. `l14` `..O..O.BBC..O.F`, chương trình `lặp 2 {đi, nhảy}, lặp 2 {cúi}, đá, lặp 2 {đi}, nhảy, đi` → `crash:FELL_IN_HOLE@12`. Thẻ: **Rơi vào hố cuối** ✔ · Tới nơi (`win`) · Đụng thùng gỗ (`crash:HIT_CRATE@9`) · Rơi hố thứ hai (`crash:FELL_IN_HOLE@5`).
15. `boss` `..O..O..O.C.BBB..F`, măng ở ô 4, 11, 15, `collectAll`. Ban đầu `lặp 2 {đi, nhảy}, đi, đi, lặp 3 {đi}, nhảy, đi, đi`. Mỗi lần sửa lộ lỗi tiếp theo:
    - số lần lặp 2 → 3 (lúc đầu `FELL_IN_HOLE@8`)
    - thiếu khối đá (`HIT_CRATE@10`)
    - đi → cúi trong vòng lặp (`HIT_BRANCH@12`)
    - nhảy → đi ở đoạn cuối (nhảy qua măng: `missed@17`)

    Lời giải `lặp 3 {đi, nhảy}, đá, đi, đi, lặp 3 {cúi}, đi, đi, đi` (11 khối, 4 thao tác, thắng). Hình đích: máy nhặt măng; vật phẩm vẫn là măng nên câu phản hồi `MISSED_ITEMS` ("Còn măng chưa nhặt kìa!") đúng với hình.

Ghi chú khi soạn (P2-08, 04/10/2026; đã qua review sư phạm độc lập, chờ HLV chơi thử):
- Mọi màn qua `content:check`. `npm run par`: mọi màn build/bughunt ✔, `par`/`parEdits` đúng như bảng (bughunt: `par` = số khối của lời giải, ⭐⭐⭐ chỉ dựa vào `parEdits`). Riêng `l11` sửa bản đồ (dòng 11 trên); `npm run par -- w03-l11` ra `min (goals) 7 · plain win 5 (34 cách)`.
- `boss`, `parEdits` 4 là nhỏ nhất:
  - `npm run par` chứng minh không có cách sửa ≤ 2 thao tác; tìm 3 thao tác dừng ở trần (ngân sách 20 triệu, trần 2 triệu chương trình giữ lại, khoảng 850 MB) nên báo ⚠ "fix search stopped". Không cần `NODE_OPTIONS` nữa; muốn heap lớn hơn thì `NODE_OPTIONS=--max-old-space-size=3500` và không chạy việc nặng khác.
  - Vét cạn riêng của review (04/10/2026, bộ mô phỏng Node độc lập, số lần lặp 1–20, lồng 2 tầng): mọi chương trình cách ban đầu ≤ 3 thao tác (41 triệu lần chạy; thao tác thứ 3 chỉ xét thêm khối đá / cúi khi còn thiếu, vì thắng cần cả hai), **không có cách nào thắng**.
  - Đường sửa khác: nếu lỗi đầu tiên bé sửa `đi → nhảy` (khối đi thứ hai sau vòng lặp, để nhảy qua hố ô 8) thay vì đổi số lần lặp, thì cả bài cần 5 thao tác (chỉ ⭐⭐). HLV để ý khi chơi thử.
- Điểm chỉ `step` (T10): gợi ý "Bấm Từng bước, xem khối nào sáng." của `l02` lúc đầu tạm chỉ vào nút `run`; từ 05/10/2026 (phần web P2-11a) chỉ vào nút Từng bước (`point: "step"`).
- `maxLoopDepth` (T16b) chưa có: `l11` chặn lặp lồng bằng bản đồ (dòng 11), thêm trường khi P2-11b xong.
- Gợi ý `point: "block:<type>"` chỉ dùng khi chương trình cho sẵn có **đúng một** khối loại đó (màn chơi chỉ vào khối đầu tiên), còn lại chỉ `stage`. `content:check` luật 16 kiểm điều này ở `predict`/`bughunt`.
- Bài giảng: thẻ 3 chạy **chương trình đã sửa** của `l01` trên bản đồ `l01` (thắng; câu "Bấm Chạy thử", vì thẻ demo không có nút Từng bước, nút này giới thiệu ở `l02`), để không lộ đáp án màn đoán `l01`. Thẻ 4 (thiếu một khối đi) dùng bản đồ nhỏ `...O.F` với `đi, nhảy, đi` (Măng nhảy sớm, rơi hố).
- `l07`: các khối rời được xáo trộn (nhảy, đi, lặp, đi, đá, đi, đi), không xếp sẵn theo thứ tự lời giải.
- Kết truyện "bác Cú báo: Thỏ Bông vào Ngã Ba chưa về!": `world.json` chưa có trường kết thế giới, nên câu này chuyển thành **thẻ 1 của `w04-lesson`** (P2-13).
- **Đợt tăng độ khó (14/10/2026, `roadmap/difficulty-pass.md` đợt B; 🟨 nháp, chờ HLV chơi thử):** thay tại chỗ, giữ ID, chương, mode, ý chính và nhân vật (máy đổi thành "xe dò đường" của Cáo, "robot dọn kho" của Gấu nâu, "xe giao hàng" của Chim cánh cụt; chương "Máy nhặt măng lớn" sau `l12` vẫn khớp). Mê cung 4 → 7/15 (`l05`, `l08`, `l12` thành mê cung); khó hơn `l06`, `l10`, `l13` (thêm ngã ba có ngõ cụt đúng chỗ lỗi đi vào). Chi tiết bản đồ ở dòng 5, 6, 8, 10, 12, 13 trên.
  - `npm run par`: `l05` sửa 1 (1 cách) · `l06` sửa 1 (1) · `l08` sửa 1 (2: xóa một trong hai khối tiến) · `l10` 9 khối, sửa 2 (3) · `l12` 8 khối, sửa 2 (3) · `l13` sửa 2 (3). Bughunt chấm ⭐ theo `parEdits`; `par` là số khối lời giải (`l12` nhỏ nhất 7, `l13` nhỏ nhất 4 bằng lặp lồng, như bản cũ).
  - **Lệch kế hoạch:** (1) `l10` lỗi đổi chỗ khối 2 và 4 (kế hoạch: giữ đổi chỗ kề nhau): ngõ cụt cạnh đường đi lên sẽ nối vào đường, nên chỗ rẽ sai phải cách đường 1 cột; `par` 8 → 9. (2) `l12` lỗi 2 là **thiếu một khối tiến** ở cuối (kế hoạch: rẽ nhầm vào ngõ cụt), vì `l13` đã là "số lần lặp + rẽ sai phía" (review); lỗi 2 dừng trước nhà (`NOT_AT_GOAL`) nên gợi ý "Lỗi mới!" phân biệt được với lỗi 1 (`HIT_WALL`). Rẽ sai phía vào ngõ cụt còn ở `l06` (ý chính của màn) và `l13`; `l10` là rẽ sớm (sai thứ tự).
  - `content:check`: W3 không còn ⚠ luật 24.

### 5.2 Thế giới 4 — 🔀 Ngã Ba Quyết Định (chi tiết)

**Câu chuyện:** Măng lần theo dấu chân Thỏ Bông vào vùng ngã ba. Phù thủy gió đổi đường **mỗi lần** Măng đi qua, nên chương trình thuộc lòng không còn đúng. Măng học cách **nhìn rồi quyết định**: phía trước có hố không? có đường rẽ không? Cuối thế giới, Bông bị nhốt trong lồng; Măng phải tìm chìa khóa.
**Bé làm được:**
- dùng khối hỏi (`phía trước có …`, `có đường …`) trong `nếu` và `nếu … nếu không`, đặt **trong vòng lặp**, để một chương trình chạy đúng trên **nhiều** bản đồ;
- đọc được nhánh nào chạy khi ✔, nhánh nào chạy khi ✘;
- biết thứ tự hai câu hỏi có thể đổi kết quả;
- chọn số lần lặp đủ lớn.

**Ngộ nhận nhắm tới:** "`nếu` là kiểm tra một lần cho cả chương trình"; "Măng nhìn ô mình đang đứng"; "bên trái của Măng là bên trái màn hình"; "đúng ở bản đồ này là đúng ở mọi bản đồ"; "mỗi vòng chạy cả hai nhánh"; "lặp bao nhiêu lần thì đi bấy nhiêu ô".
**Unplugged — "Lật thẻ trước mỗi bước":** HLV cầm thẻ úp (hố / đất). Một bé làm Măng, cầm tờ "nếu thẻ là hố thì nhảy, nếu không thì bước". Mỗi bước HLV lật một thẻ mới, bé phải **hỏi lại** mỗi lần. Vòng 2: bé chỉ hỏi một lần ở đầu rồi đi tiếp, cả nhóm xem bé "rơi hố". Vòng 3: bé bịt mắt (có bạn đi kèm), bạn đứng sau nói "bên trái/bên phải **của bạn** có đường".
**Bài giảng `w04-lesson` (6 thẻ):**
1. "Gió đổi đường mỗi lần. Thuộc lòng không còn đúng!"
2. "Măng nhìn ô phía trước rồi trả lời ✔ hoặc ✘."
3. `demo` runner `lặp 10 {nếu phía trước có hố {nhảy} nếu không {đi}}` trên bản đồ A: "Có hố thì nhảy, không có thì đi."
4. `demo` **cùng chương trình** trên bản đồ B: "Đường khác, chương trình vẫn đúng!"
5. "Mỗi vòng, `nếu` hỏi lại. ✔ chạy nhánh trên, ✘ chạy nhánh dưới."
6. `quiz` "Phía trước là đất. Măng làm khối nào?": nhảy / **đi**.

| # | ID | Chặng | Kind | Mode | Ý chính | Nhiệm vụ (hình đích) | Khối | maxBlocks | par (dự kiến, vét cạn khi soạn) | parEdits | Mục tiêu ⭐ |
|---|---|---|---|---|---|---|---|---:|---:|---:|---|
| — | `w04-lesson` | (bài giảng) | — | — | Hỏi rồi quyết định: một chương trình, nhiều con đường | — | — | — | — | — | · |
| 1 | `w04-l01` | guided | runner | parsons | Khối **nếu** + **phía trước có [hố]**: đặt nhảy vào trong nếu | Theo dấu chân Bông qua đường có hố. (dấu chân) | đi, nhảy, lặp, nếu, phía trước có | — | 5 | — | · |
| 2 | `w04-l02` | guided | runner | build | Khối **nếu … nếu không** (2 bản đồ, như bài giảng thẻ 3–4) | Gió đổi đường rồi! Tìm dấu Bông tiếp. (dấu chân) | đi, nhảy, lặp, nếu, nếu…nếu không, phía trước có | 5 | 5 | — | — |
| 3 | `w04-l03` | guided | runner | predict | `nếu` không nằm trong vòng lặp chỉ hỏi **một lần** | Măng có qua được hố không? Đoán xem! (cờ) | (chỉ xem) | — | — | — | · |
| 4 | `w04-l04` | guided | maze | build | Khối **có đường [phía trước]**: đi thẳng, hết đường thì rẽ trái | Tìm lối ra khỏi mê cung lá. (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu…nếu không, có đường | 5 | 5 | — | — |
| 5 | `w04-l05` | practice | maze | bughunt | Hai nhánh ngược: ✔ chạy nhánh trên, ✘ chạy nhánh dưới (mê cung, 2 bản đồ khác hình) | Chương trình tìm Bông bị ngược. Sửa nhé! (dấu chân) | tiến, rẽ trái, rẽ phải, lặp, nếu…nếu không, có đường | — | 5 | 2 | — |
| 6 | `w04-l06` | practice | runner | build | Chọn số lần lặp **đủ lớn**: nhảy 2 ô vẫn là 1 vòng, tới đích là dừng (2 bản đồ) | Đường dài quá! Lặp đủ để tới nơi. (dấu chân) | đi, nhảy, lặp, nếu…nếu không, phía trước có | 6 | 5 | — | — |
| 7 | `w04-l07` | practice | maze | predict | "Bên trái" là bên trái **của Măng** khi Măng nhìn xuống | Măng nhìn xuống. Đoán xem Măng đi đâu! (cửa ra) | (chỉ xem) | — | — | — | · |
| 8 | `w04-l08` | practice | maze | build | `nếu` (một nhánh) trong mê cung: thấy lối bên phải thì rẽ; 3 ngõ cụt bên trái bỏ qua | Ra khỏi hang tối bên bờ suối. (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu, nếu…nếu không, có đường | 5 | 5 | — | — |
| 9 | `w04-l09` | practice | runner | parsons | Hai câu `nếu` nối tiếp: hỏi thùng trước, rồi mới hỏi hố | Thùng và hố chắn đường tới chỗ Bông. (dấu chân) | đi, nhảy, đá, lặp, nếu, nếu…nếu không, phía trước có | — | 8 | — | · |
| 10 | `w04-l10` | practice | runner | predict | Mỗi vòng chỉ chạy **một** nhánh; đếm vòng chứ không đếm ô. Câu hỏi **phía trước có [ô trống]** (đi) | Đoán chỗ Măng dừng trên đường tìm Bông. (dấu chân) | (chỉ xem) | — | — | — | · |
| 11 | `w04-l11` | practice | maze | bughunt | Câu hỏi sai phía (bên trái ↔ bên phải): rẽ nhầm ở lối cụt bên trái (2 bản đồ) | Chương trình ra hang bị sai. Sửa giúp Măng! (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu, có đường | — | 5 | 1 | — |
| 12 | `w04-l12` | practice | maze | parsons | **`nếu` trong nhánh `nếu không`**: đi thẳng trước, hết đường mới hỏi bên trái | Lối nào cũng đi thẳng trước. Tìm Bông! (dấu chân) | (khối cho sẵn) tiến, rẽ trái, rẽ phải, lặp, nếu…nếu không ×2, có đường ×2 | — | 8 | — | · |
| 13 | `w04-l13` | practice | maze | predict | Ngã ba: hỏi bên trái trước thì Măng rẽ trái | Ngã ba! Đoán xem Măng rẽ về phía nào. (dấu chân) | (chỉ xem) | — | — | — | · |
| 14 | `w04-l14` | practice | maze | parsons | Chương trình hai câu hỏi: rẽ trái **hoặc** rẽ phải | Lắp lại bản đồ dò đường của bác Cú. (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu, nếu…nếu không, có đường | — | 8 | — | · |
| 15 | `w04-l15` | practice | maze | bughunt | Khối "thuộc lòng" (`tiến` ở đầu, trước chương trình đi thẳng trước của `l12`) đúng ở bản đồ 1, sai ở bản đồ 2 (2 bản đồ) | Chương trình thuộc lòng lạc ở đường mới. Sửa nhé! (dấu chân) | tiến, rẽ trái, rẽ phải, lặp, nếu…nếu không, có đường | — | 8 | 1 | — |
| 16 | `w04-l16` | practice | maze | build | Tự ghép chương trình hai câu hỏi; một câu hỏi vẫn tới đích nhưng bỏ sót măng (2 bản đồ) | Hai mê cung, một chương trình. Tìm lối ra! (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu, nếu…nếu không, có đường | 9 | 8 | — | Nhặt măng ở ngõ cụt (bản đồ 1) |
| 17 | `w04-l17` | challenge | runner | build | Ba bản đồ, số khối đúng bằng `par`; phải nhặt chìa khóa trên đường (`rescue`, 3 bản đồ) | Bông đánh rơi chìa khóa. Nhặt hết trên đường! (dấu chân) | đi, nhảy, lặp, nếu, nếu…nếu không, phía trước có | 5 | 5 | — | — |
| 18 | `w04-l18` | challenge | maze | bughunt | Một khối rẽ sai trong chương trình hai câu hỏi (2 bản đồ) | Bản đồ dò đường sai một chỗ. Sửa nhé! (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu, nếu…nếu không, có đường | — | 8 | 1 | — |
| 19 | `w04-l19` | challenge | maze | build | "Tay nào bám tường?": hỏi bên phải trước vừa 20 vòng; hỏi bên trái trước lạc vào ngõ cụt sâu, "trái rồi phải" rẽ vào ngõ cụt bên phải (2 bản đồ) | Gió giấu Bông sau 2 mê cung. Tìm lối ra! (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu, nếu…nếu không, có đường | 8 | 8 | — | — |
| 20 | `w04-boss` | boss | maze | build | "Cứu Bông": **một chương trình thắng 3 mê cung**, chìa khóa nằm ở nhánh bên trái (`rescue`, 3 bản đồ) | Lấy chìa khóa, mở lồng cứu Bông! (lồng) | tiến, rẽ trái, rẽ phải, lặp, nếu, nếu…nếu không, có đường | 9 | 8 | — | — |
| ✦ | `w04-creative` | creative | maze | creative | Tự ghép chương trình "biết nhìn" rồi thử trên các mê cung có sẵn | Thử chương trình của con trên mọi mê cung! | tất cả | — | — | — | · |

Khối mới và nơi xuất hiện lần đầu (luật 7):
- `nếu` và `phía trước có` ở `l01` (parsons, gợi ý `block:<type>` cho cả hai);
- `nếu … nếu không` ở `l02` (build, `toolbox:<type>`);
- `có đường` ở `l04` (build, `toolbox:<type>`).

Màn nhiều bản đồ đầu tiên là `l02`: bài giảng (thẻ 3–4) đã cho xem một chương trình chạy trên 2 bản đồ, nên đây không phải ý mới thứ hai. Chặng: 4 guided · 12 practice · 3 challenge · 1 boss. Mode (sau đợt tăng độ khó 14/10/2026): build 8 (kể cả boss) · parsons 4 · predict 4 · bughunt 4; build liền nhau nhiều nhất 2 (`l16`–`l17`, `l19`–boss). Mê cung 13/20 (trước 9). Boss là maze, dùng đủ khối maze mới (`nếu`, `nếu … nếu không`, `có đường`). Độ khó tới boss đi từng bậc: `l13` đoán ngã ba → `l14` ghép hình → `l16` tự ghép trên 2 bản đồ → boss (3 bản đồ + chìa khóa).

**Số lần lặp ở W4:** vì Măng **thắng ngay khi chạm cờ / đích** (A1), `lặp N lần` với N đủ lớn dùng như "lặp tới khi tới nơi"; `l06` dạy điều này (thanh khối để sẵn `lặp 3 lần`, gợi ý `NOT_AT_GOAL`: "Chưa tới nơi. Lặp thêm vòng nhé!"). Mọi bản đồ W4 cần ≤ 20 vòng (A7). **Mọi màn W4 có `lặp` đặt `maxInstances: { cq_repeat: 1 }` và `maxLoopDepth: 1`** (không lặp lồng, để dành W9; xem §5.5 R2).

Chi tiết từng màn:
1. `l01` `.O...O..F`, lời giải `lặp 6 {nếu phía trước có hố {nhảy}, đi}` (thắng). Xếp nhảy ra ngoài `nếu` → nhảy ở mọi vòng; xếp đi vào trong `nếu` → Măng đứng yên khi không có hố.
2. `l02` bản đồ 1 `..O.O...O.F`, bản đồ 2 `.O...O.O..F`. Lời giải `lặp 10 {nếu phía trước có hố {nhảy} nếu không {đi}}` (thắng cả hai). Cách của màn 1 (`nếu {nhảy}, đi`) rơi hố ở ô 4 bản đồ 1. **VC ≤ 5:** nhỏ nhất 5 khối, cả 28 lời giải đều có khối hỏi; "nhảy cóc" bị bản đồ 2 chặn.
3. `l03` `..O.F`, chương trình `nếu phía trước có hố {nhảy}, đi, đi, đi` → `crash:FELL_IN_HOLE@2`. Thẻ: **Rơi xuống hố** ✔ · Tới lá cờ (`win`) · Đứng sát mép hố (`stop@1`). Sân chơi hiện ✘ đúng **1 lần**.
4. `l04` `#######/##G...#/#####.#/#S....#/#######`, nhìn `E`. Lời giải `lặp 12 {nếu có đường phía trước {tiến} nếu không {rẽ trái}}` (thắng). **VC ≤ 5:** nhỏ nhất 5, mọi lời giải đều có khối hỏi (vd `lặp 9 {tiến, nếu có đường bên trái {rẽ trái}}` nếu thanh khối có `nếu`). Bản đồ cũ (đoạn 4/3/2 ô) bị lặp lồng 4 khối.
5. `l05` (đợt tăng độ khó) mê cung, bản đồ 1 `#########/#G......#/####.##.#/###.###.#/#S......#/#######.#/#########` (nhìn `E`; 3 ngã ba, ngõ cụt ở chỗ rẽ đầu), bản đồ 2 `#######/#.....#/#.#.#.#/#.##..#/#..G#.#/#####S#/#######` (nhìn `N`). Ban đầu `lặp 20 {nếu có đường phía trước {rẽ trái} nếu không {tiến}}` → `HIT_WALL@4,1` / `@5,5`. Sửa 2 thao tác: đổi chỗ hai khối (thắng cả hai, 17 / 16 vòng). Rẽ phải ở tường thì đi vào ngõ cụt rồi hết vòng.
6. `l06` bản đồ 1 `..O.O...O.O..F`, bản đồ 2 `.O...O..O.O...F`. Thanh khối để sẵn `lặp 3 lần` → `stop@5` ở bản đồ 1. Lời giải `lặp 12 {nếu phía trước có hố {nhảy} nếu không {đi}}` (thắng cả hai). **VC ≤ 5:** nhỏ nhất 5, mọi lời giải đều có khối hỏi.
7. `l07` `#######/###S###/###.###/#G...##/###.###/#######`, nhìn `S`. Chương trình `lặp 5 {nếu có đường bên trái {rẽ trái}, tiến}` → `crash:HIT_WALL@3,4`. Thẻ: **Ngõ cụt bên phải** ✔ · Ra cửa bên trái (`win`) · Đi thẳng xuống (`crash:HIT_WALL@4,3`) · Đứng ở ngã tư (`stop@3,3`).
8. `l08` (đợt tăng độ khó) `#########/###.#####/#S.....##/######..#/##G....##/####.####/#########`, nhìn `E` (3 ngã ba, 3 ngõ cụt đều ở **bên trái** của Măng). Lời giải `lặp 12 {nếu có đường bên phải {rẽ phải}, tiến}` (thắng, 11 vòng); hỏi bên trái thì vào ngõ cụt đầu tiên. **VC ≤ 5:** nhỏ nhất 5 (68 cách), mọi lời giải đều có khối hỏi. Thanh khối giữ nguyên (e2e `flyout-scroll.spec.ts`).
9. `l09` `.C..O.O.C..F` (sửa khi soạn P2-13), lời giải `lặp 12 {nếu phía trước có thùng {đá}, nếu phía trước có hố {nhảy} nếu không {đi}}` (thắng). Đổi thứ tự hai câu `nếu` → `HIT_CRATE@1`. Màn ghép hình nên lối tắt "luôn đá" (A4) không ảnh hưởng.
10. `l10` `.O.O..O..F`, chương trình (đợt tăng độ khó) `lặp 4 {nếu phía trước có ô trống {đi} nếu không {nhảy}}` → `stop@7`: giữ ý "ô trống" của `l05`, `l12` cũ (nay là mê cung), câu chuẩn ở `content-authoring.md` §5.1, gợi ý `idle` "Ô trống: phía trước là đất, Măng đi được.". Thẻ: **Sau hố thứ ba** ✔ · Sau hố thứ hai (`stop@4`, ngộ nhận "4 vòng = 4 ô") · Trước hố thứ ba (`stop@5`) · Tới nơi (`win`).
11. `l11` (đợt tăng độ khó) bản đồ 1 `########/##.#####/#S....##/#####.##/##G....#/########` (nhìn `E`), bản đồ 2 `########/######S#/##..G#.#/#..###.#/##.....#/####.###/########` (nhìn `S`, rẽ phải 3 lần). Mỗi bản đồ 2 ngã ba có lối cụt bên trái. Ban đầu `lặp 12 {nếu có đường bên trái {rẽ phải}, tiến}` → thấy lối cụt bên trái thì rẽ phải vào tường (`HIT_WALL@2,2` / `@4,6`). Sửa "bên trái" → "bên phải" (đúng 1 cách, thắng cả hai).
12. `l12` (đợt tăng độ khó, mode build → parsons) `########/######G#/######.#/#####..#/####..##/##.##.##/#S....##/########`, nhìn `E` (2 ngã ba có ngõ cụt bên trái; rẽ trái, rẽ phải, rẽ trái). Khối xáo trộn của `lặp 20 {nếu có đường phía trước {tiến} nếu không {nếu có đường bên trái {rẽ trái} nếu không {rẽ phải}}}` (13 vòng). Ý mới duy nhất: `nếu` trong nhánh `nếu không`, có bài `w04-lesson-neu-long` (2 demo) và câu chuẩn `content-authoring.md` §5.1. `npm run par`: 120 cách ghép, **đúng 1** thắng (hỏi bên trái trước thì quay vòng ở ngã ba đầu; đổi chỗ hai khối rẽ thì xoay tại chỗ ở góc).
13. `l13` `#######/#....G#/###.###/###.###/###S###/#######`, nhìn `N` (Bông chờ ở đầu **bên phải** ngã ba). Chương trình `lặp 5 {nếu có đường bên trái {rẽ trái}, nếu có đường phía trước {tiến} nếu không {rẽ phải}}` → `stop@1,1`. Thẻ: **Cuối đường bên trái** ✔ · Tới chỗ Bông (`win`) · Đứng ở ngã ba (`stop@1,3`) · Giữa đường lên (`stop@2,3`).
14. `l14` `#########/#.......#/#######.#/#....G#.#/###.#.#.#/#...#.#.#/#.#####.#/#S......#/#########` (sửa ở review P2-14, ghi chú dưới), nhìn `E`. Khối xáo trộn của `lặp 20 {nếu có đường bên trái {rẽ trái}, nếu có đường phía trước {tiến} nếu không {rẽ phải}}` (thắng).
15. `l15` (đợt tăng độ khó, sửa sau review) bản đồ 1 `############/###.########/#S.........#/#####.####.#/##########.#/##########.#/#####G.....#/############` (nhìn `E`, đúng **20 vòng**), bản đồ 2 `########/#####G##/#####.##/####...#/#####.##/#S....##/###.####/########` (nhìn `N`, mặt vào tường). Ban đầu `tiến, lặp 20 {nếu có đường phía trước {tiến} nếu không {nếu có đường bên trái {rẽ trái} nếu không {rẽ phải}}}`: bản đồ 1 thắng (khối tiến làm đúng việc vòng 1 sẽ làm), bản đồ 2 đâm tường ngay (`HIT_WALL@5,1`). Sửa: xóa khối tiến đầu (**đúng 1** cách sửa 1 thao tác: đổi nó thành khối rẽ thì tốn thêm vòng, bản đồ 1 hết 20 vòng). Hình lời giải là của `l12` (ghép hình → săn lỗi).
16. `l16` bản đồ 1 `#########/#S....###/#####..##/#####.###/##G...###/#########` (nhìn `E`; măng ở `2,6`, một **ngõ cụt bên trái** của Măng ở chỗ rẽ), bản đồ 2 `#######/#....G#/#.#####/#.#####/#S#####/#######` (nhìn `N`). Lời giải như `l14` (8 khối, thắng cả hai, nhặt được măng). `maxInstances: { cq_repeat: 1 }`, `maxLoopDepth: 1`.
    - **Đánh đổi sao:** chương trình một câu hỏi, vd `lặp 10 {tiến, nếu có đường bên phải {rẽ phải}}` (5 khối), thắng cả hai nhưng không vào ngõ cụt (chỉ ⭐). Bản "hỏi bên phải trước" cũng vậy.
    - **VC ≤ 7** (2,7 triệu chương trình ở cỡ 7): có 75 cách 5 khối thắng, không cách nào nhặt măng; không cách ≤ 7 khối nào vừa thắng vừa nhặt măng, nên `par` = 8.
17. `l17` ba bản đồ `.O..O.O...O.O.F` (chìa khóa ô 3, 8), `.O.O..O...O.F` (ô 4, 7), `...O.O.O.F` (ô 1), `rescue`, hình đích dấu chân. Chưa có lồng ở màn này, để boss giữ được cảnh mở lồng cứu Bông. Lời giải `lặp 12 {nếu phía trước có hố {nhảy} nếu không {đi}}` thắng cả 3; "nhảy cóc" thua cả 3. **VC ≤ 5:** nhỏ nhất 5, mọi lời giải đều có khối hỏi.
18. `l18` bản đồ 1 `########/#S.#####/##.#####/##....##/#####.##/#G....##/########` (nhìn `E`), bản đồ 2 `#########/#.....G.#/#.#######/#.#######/#S#######/#########` (nhìn `N`). Ban đầu: chương trình của `l14` nhưng nhánh "nếu không" là **rẽ trái** → Măng xoay tại chỗ ở góc đầu tiên, hết vòng (`stop@1,1` cả hai). Sửa rẽ trái → rẽ phải (1 thao tác, thắng cả hai).
19. `l19` (đợt tăng độ khó, mode bughunt → build) "Tay nào bám tường?", bản đồ 1 `#########/######.##/##.#.#.##/##.#....#/##.#.##.#/##.#..#.#/##.#.##G#/#S...####/#########` (nhìn `E`), bản đồ 2 `#########/#####..G#/#####.###/####..###/#.#..####/#.##.####/#....####/####S####/#########` (nhìn `N`). Ngõ cụt sâu (5 ô) bên trái, ngõ cụt 1 ô bên phải ở `5,5`. Lời giải `lặp 20 {nếu có đường bên phải {rẽ phải}, nếu có đường phía trước {tiến} nếu không {rẽ trái}}` (bản đồ 1 vào rồi ra ngõ cụt bên phải, vẫn ≤ 20 vòng). Thua: hỏi bên trái trước (`l14`, hết 20 vòng ở cả hai), đi thẳng trước (`l12`, vào ngõ cụt phía trước ở bản đồ 1), "trái rồi phải rồi tiến" `lặp 20 {nếu có đường bên trái {rẽ trái}, nếu có đường bên phải {rẽ phải}, tiến}` (rẽ vào ngõ cụt bên phải rồi đâm tường, review 14/10). **VC = 8** (40 cách 8 khối, không cách nào ≤ 7). Mục tiêu trung tính "Bám tường bên nào? Đúng 8 khối!". Hình lời giải là ảnh gương của thang D5 (⚠ M2, giữ có chủ đích: màn so hai phía).
20. `boss` 3 mê cung, nhìn `E`, `rescue`:
    - `#########/#S..#####/###.#####/###...###/###.#####/#G..#####/#########`, chìa khóa ở `3,5`, cuối nhánh cụt **bên trái** của Măng;
    - `########/#....G##/#.######/#.######/#...####/###.####/#S..####/########`, chìa khóa ở `4,2`;
    - `#########/#S.######/##.....##/######.##/##G....##/#########`, chìa khóa ở `2,4`.

    Lời giải `lặp 20 {nếu có đường bên trái {rẽ trái}, nếu có đường phía trước {tiến} nếu không {rẽ phải}}` thắng cả 3, cần ít nhất 16 vòng (≤ 20). Bản "hỏi bên phải trước" thắng bản đồ 2–3 nhưng không lấy được chìa khóa ở bản đồ 1. Chìa khóa làm ý của `l13` (hỏi bên nào trước) có ý nghĩa, không thêm ý mới. `maxInstances: { cq_repeat: 1 }`. VC: xem §5.5 R3.

Ghi chú khi soạn (P2-13, 05/10/2026; chờ review sư phạm độc lập và HLV chơi thử):
- Mọi màn qua `content:check` (không cảnh báo). Mọi bản đồ và chương trình ở trên chạy đúng như ghi trên engine thật, **không phải sửa bản đồ nào**. `npm run par -- --world w04` ✔ cả 15 màn build/bughunt, `par`/`parEdits` đúng bảng:
  - build: `l02` 5 (28 cách), `l04` 5 (58), `l06` 5 (22), `l08` 5 (82), `l12` 5 (79), `l16` theo mục tiêu 8 (74) · thắng thường 5 (75), `l17` 5 (24), boss 8 (68);
  - bughunt (`par` = số khối của lời giải, ⭐⭐⭐ dựa vào `parEdits`): `l05` sửa 1 (đúng 1 cách: đổi câu hỏi sang "ô trống"; nhỏ nhất 5, 90 cách, đều có khối hỏi), `l11` 1 (1), `l15` 1 (1), `l18` 1 (3), `l19` 2 (19 cách; không có cách sửa 1 thao tác).
  - R1: test `tools/content-check/src/w04.test.ts` bỏ khối hỏi khỏi thanh khối của `l02`, `l04`, `l06`, `l08`, `l12`, `l17`, boss: không chương trình nào ≤ `maxBlocks` thắng.
- **Review sư phạm độc lập (05/10/2026), đã sửa:**
  - `l05`: bản đồ nháp `..O..O.F` để `lặp 3 {đi, nhảy}` (3 khối, không hỏi) thắng và có 3 cách sửa 1 thao tác. Bản đồ mới `..O...O..O.F`: mọi chương trình 5 khối thắng đều hỏi, đúng 1 cách sửa 1 thao tác (đổi "hố" → "ô trống"). Gợi ý `enter` chỉ ô chọn của câu hỏi ("Bấm vào câu hỏi: có cả hố, ô trống…"). Vì "ô trống" đã gặp ở `l05`, `l12` thành màn **ôn lại** cách hỏi này trên 2 bản đồ.
  - `l09`: bản đồ nháp `.C..O.C.O..F` đổi thành `.C..O.O.C..F` (hai hố liền nhau trước thùng thứ hai); tên "Thùng và hố"; gợi ý `enter` là câu hỏi ("Có 2 câu hỏi. Câu nào hỏi trước?").
  - **Màn ghép hình phải ghép hết khối** (quyết định của điều phối, mặc định câu G22): mode `parsons` chỉ thắng khi mọi khối được cho đã nối dưới "khi bắt đầu", còn khối rời → `LOOSE_BLOCKS` "Còn khối chưa ghép. Ghép hết vào nhé!" (`runtime-engine.md` §2). Mọi màn ghép hình W1–W4 vẫn xanh (không màn nào có khối gây nhiễu).
  - Gợi ý tầng 0 là câu hỏi / cách làm, không nói đáp án (`l01`, `l02`, `l06`, `l08`, `l09`, `l11`, `l12`, `l14`, `l15`, `l19`); câu `enter` "Khối mới" dùng lại chữ của chú thích khối (`l01` cả `nếu` lẫn `phía trước có`, `l02`, `l04`). Số viết bằng chữ số trong chữ cho bé ("2 câu hỏi", "3 con đường", "2 mê cung"…), giữ "ngã ba", "thứ ba", "một chương trình". Dòng nhiệm vụ và mục tiêu không trùng nhau (`l03`, `l07`). `l17` nhiệm vụ "Gió thổi chìa khóa rơi khắp đường. Nhặt hết nhé!", thêm gợi ý `enter` "Đứng ở ô chìa khóa mới nhặt được.".
  - Thêm bài "Khối mới" `w04-lesson-neu-khong` trước `l02` (không lặp: có hố → nhánh trên, nhảy, `stop@2`; đất → nhánh dưới, đi, `stop@1`).
  - `w04-creative`: cửa ra dời lên 1 ô để chương trình hai câu hỏi (hỏi trái trước hay phải trước) đều ra tới cửa trong 20 vòng.
- `l18` có lời giải **ít khối hơn** lời giải đã sửa (không ảnh hưởng sao, vì sao của bughunt tính theo số thao tác sửa): 3 chương trình "lắc" 7 khối, vd `tiến, lặp 20 {nếu có đường bên phải {rẽ phải, tiến} nếu không {rẽ trái}}`. Bé xóa hết rồi ghép lại chỉ được ⭐. Ngoài cách sửa chính (rẽ trái → rẽ phải ở nhánh "nếu không"), `l18` còn 2 cách sửa 1 thao tác khác: thêm rẽ phải sau tiến ở nhánh trên, hoặc thêm một rẽ trái nữa ở nhánh "nếu không" (quay đầu rồi rẽ). **HLV để ý khi chơi thử** xem bé có sửa theo kiểu đó không.
- `l18` ban đầu: Măng **đi tới đi lui** giữa hai ô đầu (rẽ trái hai lần thành quay đầu), không xoay tại chỗ; vẫn hết vòng ở `stop@1,1` trên cả hai bản đồ. Gợi ý `enter` chỉ nút Từng bước (`point: "step"`).
- **Thanh khối:** `lặp` để sẵn số đủ dùng ở các màn trước `l06` (`l02` 10, `l04` 12) để màn chỉ có một ý mới; từ `l06` để sẵn `lặp 3 lần`, bé tự chọn số (bughunt giữ số của chương trình ban đầu). Màn ghép hình đưa **khối hỏi rời** (bé tự cắm vào ô của `nếu`).
- **Bài giảng mở đầu** (6 thẻ, mỗi thẻ ≤ 12 chữ; thẻ 5 "Mỗi vòng, khối nếu hỏi lại. ✔ chạy nhánh trên, ✘ chạy nhánh dưới."): câu kết W3 của bác Cú gộp vào thẻ 1 ("Thỏ Bông vào Ngã Ba chưa về! Gió đổi đường mỗi lần."); thẻ 2 "Đừng thuộc lòng. Măng nhìn ô phía trước, trả lời ✔ hoặc ✘." Hai thẻ `demo` chạy cùng chương trình `lặp 10 {nếu phía trước có hố {nhảy} nếu không {đi}}` trên hai đường nhỏ khác bản đồ `l02` (`..O.O..F`, `.O...O.F`).
- **Bài "Khối mới"** (`content-authoring.md` §5.1): `w04-lesson-neu` trước `l01` (nếu: ✔ nhảy qua hố, ✘ bỏ qua khối nhảy, đứng yên), `w04-lesson-neu-khong` trước `l02`, `w04-lesson-co-duong` trước `l04` (có đường phía trước; Măng nhìn xuống thì bên trái của Măng là phía phải màn hình), `w04-lesson-chia-khoa` trước `l17` (đứng ở ô chìa khóa mới nhặt được, nhảy qua thì không; T20). Test `w04.test.ts` chạy từng demo và kiểm ô Măng dừng.
- `l15`: gợi ý không chỉ `block:runner_jump` vì chương trình có 2 khối nhảy (luật 16); gợi ý "Bấm Từng bước ở bản đồ 2. Khối nào không hỏi?" chỉ nút Từng bước.
- `w04-creative`: màn sáng tạo không có `variants` (schema), nên là **một** mê cung lớn nhiều ngã rẽ; dòng nhiệm vụ đổi thành "Thử chương trình biết nhìn của con nhé!".
- **Kiểm ghép hình (review P2-14, G22 mở rộng):** `npm run par` nay chạy mọi cách ghép. `l01` đúng 1 cách. `l14` bản đồ cũ có 7 cách ghép thắng (kể cả "hỏi phía trước trước"), đổi sang `#########/#.......#/#######.#/#....G#.#/###.#.#.#/#...#.#.#/#.#####.#/#S......#/#########` (nhìn `E`): đúng 1 cách. `l09` còn 4 cách (⚠, chấp nhận): hỏi thùng trong nhánh "nếu không" là cách đúng tương đương, hai cách còn lại bọc vòng lặp trong `nếu phía trước có thùng` rồi luôn đá (lối tắt A4); không chặn được bằng bản đồ vì thùng phải ở ngay trước Măng để thứ tự 2 câu hỏi có ý nghĩa. **HLV chơi thử lại `l14`.**
- **Mạch truyện sang W5:** W4 kết ở boss (mở lồng cứu Bông). Thẻ 1 của `w05-lesson` (P2-14) phải nhắc Bông đã được cứu (ghi ở §5.3).
- **Chờ P2-11c web** (`roadmap/phase-2.md`, chặn merge): `w04-l17`, `w04-boss` (`config.goal.items`) và bài `w04-lesson-chia-khoa` (demo có chìa khóa). Cả thế giới cũng cần phần web của P2-11a (khối `nếu`, khối hỏi trong thanh khối và Blockly của màn chơi) mới chơi được.

- **Đợt tăng độ khó (14/10/2026, `roadmap/difficulty-pass.md` đợt A; 🟨 nháp, chờ HLV chơi thử):** HLV thấy runner W4 lặp một công thức (11 màn "=", toàn `lặp {nếu hố {nhảy} nếu không {đi}}`). Thay tại chỗ, giữ ID, chương, bài `beforeLevel`, ý chính và nhân vật:
  - mê cung mới: `l05` (bughunt, 2 bản đồ), `l12` (build → **parsons**, ý mới `nếu` trong `nếu không`), `l15` (bughunt, 2 bản đồ), `l19` (bughunt → **build**, "Tay nào bám tường?"); khó hơn: `l08` (3 ngõ cụt bên trái), `l11` (2 bản đồ, lối cụt bên trái). Mê cung 9 → 13/20.
  - `npm run par` (từng màn, `--max-old-space-size=2048`): `l05` 5 (16 cách) · sửa 2 (5 cách, đổi chỗ 2 khối); `l08` 5 (68); `l11` 5 (20) · sửa 1 (1); `l12` 120 cách ghép, đúng 1 thắng; `l15` 5 (9) · sửa 1 (3: xóa khối rẽ, hoặc thêm rẽ phải trước / sau nó cho hai lần rẽ bù nhau); `l19` 8 (329).
  - **Lệch kế hoạch:** (1) `l15` (sửa sau review 14/10) là `tiến` thuộc lòng trước chương trình đi thẳng trước của `l12` (kế hoạch: `rẽ trái` thuộc lòng trước `lặp {nếu có đường bên phải …}`): bản kế hoạch không thắng nổi bản đồ 1 khi xóa khối thuộc lòng, và họ "hỏi một phía rồi tiến" (tính cả ảnh gương) đã có `l07`, `l08`, `l11`. `par` 5 → 8. (2) `l11` bản đồ 2 có **lối cụt bên trái** (bản kế hoạch ghi "lối phải dẫn vào ngõ cụt": lời giải hỏi bên phải sẽ đi vào đó). (3) `l12` có bài `w04-lesson-neu-long` (kế hoạch K4 mặc định không bài riêng), theo luật HLV 14/10: mọi ý mới cần câu cho bé, ví dụ chạy được và câu chuẩn. (4) `l19` thêm một ngõ cụt **phía trước** ở bản đồ 1 để chương trình `l12` (đi thẳng trước) không thắng, và đoạn cuối dài thêm 1 ô để cách "lắc" 7 khối hết 20 vòng.
  - Review 14/10 (sửa): `l10` hỏi **ô trống** (giữ ý "ô trống" sau khi `l05`, `l12` thành mê cung); `l11` gợi ý `HIT_WALL` "Măng hỏi bên nào? Lối ra ở bên nào?"; bài `w04-lesson-neu-long` có 3 demo (thêm "không có đường trái → rẽ phải").
  - Còn 8 ⚠ luật 24 (luật M2 nay coi ảnh gương trái ↔ phải là một công thức), giữ có lý do: M2 `l06`, `l17` (họ runner `lặp {nếu hố …}`: màn dạy D4 "lặp đủ lớn" và màn chìa khóa, kế hoạch giữ); `l11` (lần 3 của "hỏi một phía rồi tiến" sau `l07` đoán, `l08` tự ghép: thang đoán → ghép → sửa); `l18` (kế hoạch giữ); `l19` (ảnh gương của thang D5, có chủ đích). M1 `l16`, boss (1 ngã ba), `l18` (0 ngã ba). HLV xem khi chơi thử.

### 5.3 Thế giới 5 — 🌊 Sông Chờ Đợi (chi tiết)

**Câu chuyện:** Măng và Bông về làng, nhưng gió cuốn mất cầu. Không ai biết bờ sông dài bao nhiêu, bến đò ở đâu, có mấy hòn đá nổi. Chú Ếch dạy Măng **chờ**: "Cứ đi, **đến khi** thấy nước thì nhảy." Boss: Gà con lạc bên kia sông; Măng qua sông đón em rồi đưa em về nhà.
**Bé làm được:**
- dùng `lặp đến khi <điều kiện>` khi không biết trước số lần lặp;
- biết điều kiện được hỏi **trước mỗi vòng** (kể cả vòng đầu, nên có thể chạy 0 vòng) và **chỉ giữa các vòng**;
- biết khối sau vòng lặp chạy khi vòng lặp dừng;
- nhận ra và sửa **vòng lặp không dừng**;
- đặt `nếu` bên trong `lặp đến khi`;
- biết "lặp 20 lần" có khi không đủ.

**Ngộ nhận nhắm tới:** "Vòng lặp tự dừng"; "Điều kiện được hỏi ở cuối vòng" (hoặc "luôn chạy ít nhất 1 vòng"); "Vòng lặp dừng ngay khi điều kiện đúng, kể cả giữa vòng"; "Lặp 20 lần là đủ cho mọi đường".
**Unplugged — "Đi đến khi chạm tường":** một bé bịt mắt (có bạn đi kèm) làm theo thẻ "lặp đến khi tay chạm tường: bước 1 bước". Đổi chỗ đứng xa/gần: cùng một thẻ dùng được mọi khoảng cách. Thẻ bẫy 1: "lặp đến khi chạm tường: vỗ tay" → bé vỗ mãi, cả nhóm hô "Vòng lặp không dừng!". Thẻ bẫy 2: "lặp đến khi chạm tường: bước 2 bước" khi chỉ còn 1 bước.
**Bài giảng `w05-lesson` (6 thẻ):**
> Ghi chú P2-13 (05/10/2026): thẻ 1 phải nối truyện W4, nhắc **Bông đã được cứu** (boss W4 mở lồng) rồi mới tới chuyện cầu bị cuốn, vd "Cứu được Bông rồi! Nhưng cầu về làng bị cuốn mất." Sửa khi soạn P2-14. *Đã sửa (P2-14): thẻ 1 "Cứu được Bông rồi! Nhưng cầu về làng bị cuốn mất."*

1. "Cầu bị cuốn mất. Sông dài bao nhiêu? Không ai biết!"
2. "Lặp đến khi: trước mỗi vòng Măng hỏi. ✔ thì dừng." (khi soạn: "Chú Ếch dạy: trước mỗi vòng, hỏi. Đúng thì dừng.")
3. `demo` runner `lặp đến khi phía trước có hố {đi}, nhảy, đi` trên `.....O.F`: "Bờ dài, Măng đi nhiều bước rồi nhảy."
4. `demo` cùng chương trình trên `..OF` (nhảy xong là tới cờ, khối đi cuối không chạy): "Bờ ngắn, vẫn đúng! Tới nơi là thắng ngay."
5. `demo` vòng lặp **không dừng** (`lặp đến khi đã tới đích {rẽ phải}`): "Măng chỉ xoay, không bao giờ tới. Chóng mặt quá!"
6. `quiz` "Hố ngay trước mặt. Vòng lặp chạy mấy vòng?": 1 / **0**.

| # | ID | Chặng | Kind | Mode | Ý chính | Nhiệm vụ (hình đích) | Khối | maxBlocks | par (dự kiến, vét cạn khi soạn) | parEdits | Mục tiêu ⭐ |
|---|---|---|---|---|---|---|---|---:|---:|---:|---|
| — | `w05-lesson` | (bài giảng) | — | — | Lặp đến khi; vòng lặp không tự dừng | — | — | — | — | — | · |
| 1 | `w05-l01` | guided | runner | build | Khối **lặp đến khi**: đi đến khi thấy hố, rồi nhảy (2 bản đồ khác độ dài) | Bờ sông dài bao nhiêu? Đi tới chỗ nhảy qua! (cờ) | đi, nhảy, lặp đến khi, phía trước có | 4 | 4 | — | — |
| 2 | `w05-l02` | guided | runner | parsons | Khối sau vòng lặp chạy khi vòng lặp dừng | Lắp lại chương trình qua suối của chú Ếch. (cờ) | đi, nhảy, lặp đến khi, phía trước có | — | 6 | — | · |
| 3 | `w05-l03` | guided | runner | predict | Điều kiện hỏi **trước** vòng đầu: có thể chạy 0 vòng | Nước ngay trước mặt. Đoán xem Măng làm gì! (cờ) | (chỉ xem) | — | — | — | · |
| 4 | `w05-l04` | guided | maze | build | Khối **đã tới đích?**: tiến đến khi tới đích (2 bản đồ) | Đi dọc bờ tới bến đò của chú Ếch. (bến đò) | tiến, rẽ trái, rẽ phải, lặp đến khi, đã tới đích? | 3 | 3 | — | — |
| 5 | `w05-l05` | practice | maze | bughunt | Vòng lặp không dừng: khối tiến nằm **ngoài** vòng lặp (2 bản đồ có ngõ cụt cạnh đường) | Măng đứng mãi không đi. Sửa giúp nhé! (bến đò) | tiến, lặp đến khi, đã tới đích? | — | 3 | 1 | — |
| 6 | `w05-l06` | practice | maze | build | **Thân lặp là khối rẽ**: quay tại chỗ đến khi có đường phía trước; vòng `lặp đến khi đã tới đích {tiến}` **có sẵn** bên dưới (2 hang, cửa ở 2 phía) | Bến đò bên kia hang đá. Tìm cửa hang! (bến đò) | tiến, rẽ trái, rẽ phải, lặp đến khi, có đường, đã tới đích? | 7 | 6 | — | — |
| 7 | `w05-l07` | practice | maze | predict | "Vòng lặp có dừng không?" | Măng có tới bến đò không? Đoán xem! (bến đò) | (chỉ xem) | — | — | — | · |
| 8 | `w05-l08` | practice | maze | bughunt | Chờ sai thứ: chờ có đường **bên trái** thay vì bên phải, rẽ ở lối cụt hoặc đi quá chỗ rẽ (2 bản đồ) | Măng chờ nhầm lối rẽ xuống bến. Sửa nhé! (bến đò) | tiến, rẽ trái, rẽ phải, lặp đến khi, có đường, đã tới đích? | — | 7 | 1 | — |
| 9 | `w05-l09` | practice | maze | build | Lần đầu **tự ghép** hai vòng `lặp đến khi` nối tiếp (ở `l06` vòng thứ hai có sẵn): tiến đến khi có lối rẽ, rẽ, rồi tiến đến khi tới đích (2 bản đồ) | Tìm lối rẽ xuống bến đò. (bến đò) | tiến, rẽ trái, rẽ phải, lặp đến khi, có đường, đã tới đích? | 8 | 7 | — | — |
| 10 | `w05-l10` | practice | runner | parsons | Khối **đã tới nơi?**; `nếu` nằm trong `lặp đến khi` | Lắp lại chương trình đưa Bông sang bờ bên kia. (cờ) | đi, nhảy, lặp đến khi, nếu…nếu không, phía trước có, đã tới nơi? | — | 6 | — | · |
| 11 | `w05-l11` | practice | runner | predict | Điều kiện chỉ được hỏi **giữa** các vòng: thân 2 khối đi quá mép hố | Măng có dừng kịp trước nước không? (cờ) | (chỉ xem) | — | — | — | · |
| 12 | `w05-l12` | practice | maze | bughunt | Không dừng vì nhánh "nếu không" trống: mỗi vòng phải làm Măng thay đổi | Măng kẹt ở góc đường. Sửa giúp nhé! (bến đò) | tiến, rẽ trái, rẽ phải, lặp đến khi, nếu…nếu không, có đường, đã tới đích? | — | 6 | 1 | — |
| 13 | `w05-l13` | practice | maze | bughunt | "Lặp 20 lần" không đủ cho đường xoắn: đổi sang `lặp đến khi đã tới đích` (2 bản đồ) | Lặp 20 lần chưa ra khỏi bãi đá. Sửa nhé! (bến đò) | tiến, rẽ trái, rẽ phải, lặp, lặp đến khi, nếu…nếu không, có đường, đã tới đích? | — | 6 | 2 | — |
| 14 | `w05-l14` | practice | maze | build | Mê cung xoắn dài hơn 20 vòng: `nếu` trong `lặp đến khi đã tới đích` (2 bản đồ) | Đường vòng quanh hồ rất dài. Tìm lối ra! (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, lặp đến khi, nếu…nếu không, có đường, đã tới đích? | 9 | 7 | — | Nhặt măng trong hốc bên đường (bản đồ 1) |
| 15 | `w05-l15` | practice | maze | bughunt | Thân `lặp đến khi đã tới đích {nếu có đường bên trái {rẽ trái}, tiến, tiến}`: hỏi sau mỗi 2 bước, đúng ở bản đồ 1, đi quá lối rẽ ở bản đồ 2 (2 bản đồ) | Đúng ở bãi này, lạc ở bãi kia. Sửa nhé! (bến đò) | tiến, rẽ trái, rẽ phải, lặp đến khi, nếu, có đường, đã tới đích? | — | 6 | 1 | — |
| 16 | `w05-l16` | practice | maze | parsons | Chương trình hai câu hỏi của W4 trong `lặp đến khi đã tới đích` | Lắp lại bản đồ dò đường qua bãi lau. (cửa ra) | tiến, rẽ trái, rẽ phải, lặp đến khi, nếu, nếu…nếu không, có đường, đã tới đích? | — | 9 | — | · |
| 17 | `w05-l17` | challenge | maze | build | Mê cung dài rẽ hỗn hợp, hơn 20 vòng: tìm chương trình **gọn hơn** cách hai câu hỏi (2 bản đồ) | Bãi lau rộng, đường rất dài. Tìm lối ra! (cửa ra) | như màn 16 + lặp | 9 | 7 | — | — |
| 18 | `w05-l18` | challenge | maze | bughunt | 2 lỗi trong 3 vòng `lặp đến khi` nối tiếp: chờ sai phía + thân thừa khối tiến (2 bản đồ) | Bông chờ ở bãi lau. Sửa 2 chỗ sai nhé! (bến đò) | tiến, rẽ trái, rẽ phải, lặp đến khi, có đường, đã tới đích? | — | 11 | 2 | — |
| 19 | `w05-l19` | challenge | runner | predict | `nếu có thùng {đá}` trong "lặp đến khi phía trước có hố": vòng lặp có dừng không? | Măng đá thùng. Vòng lặp có dừng không? (cờ) | (chỉ xem) | — | — | — | · |
| 20 | `w05-boss` | boss | maze | build | "Đón Gà con trong bãi lau": bãi lau có đường vòng, bám tường thì đi vòng mãi hoặc tới nhà mà chưa đón em; đi thẳng trước (`nếu` trong `nếu không`) trong `lặp đến khi đã tới đích` (2 bản đồ, `escort`) | Đón Gà con trong bãi lau rồi đưa em về nhà! (bạn → nhà) | tiến, rẽ trái, rẽ phải, lặp đến khi, nếu, nếu…nếu không, có đường, đã tới đích? | 10 | 9 | — | — |
| ✦ | `w05-creative` | creative | runner | creative | Tự làm "máy qua sông" và thử trên các đường có sẵn | Làm máy qua sông cho cả làng! | tất cả | — | — | — | · |

Khối mới và nơi xuất hiện lần đầu (luật 7):
- `lặp đến khi` ở `l01` (build, `toolbox:<type>`);
- `đã tới đích?` ở `l04` (build, `toolbox:<type>`);
- `đã tới nơi?` (khối đề xuất `runner_at_goal`, câu G5) ở `l10` (parsons, `block:<type>`).

Chặng: 4 guided · 12 practice · 3 challenge · 1 boss. Mode: build 7 (kể cả boss) · parsons 3 · predict 4 · bughunt 6; build liền nhau nhiều nhất 1. Nghiệm thu P2-14: `l05`, `l12` là `bughunt` có lỗi vòng lặp không dừng; `l07`, `l19` là `predict` "vòng lặp có dừng không?". Boss (đợt tăng độ khó, review 14/10) là **mê cung**, dùng đủ khối mê cung của W4–W5 (`lặp đến khi`, `đã tới đích?`, `nếu … nếu không`, `có đường`); `đã tới nơi?` (runner) chỉ còn ở `l10`, `l13` cũ, nay ở `l10`.

**Khi nào thanh khối W5 có `lặp n lần`:** vì Măng thắng ngay khi chạm đích (A1), `lặp 20 lần {…}` làm được việc của `lặp đến khi đã tới đích` khi đường cần ≤ 20 vòng, lại ít hơn 1 khối. Nên `lặp n lần` chỉ có trong thanh khối ở màn mà đường **cần hơn 20 vòng** (`l13` bughunt, `l14`, `l17`), để bé tự thấy "lặp 20 lần không đủ". Các màn khác dạy `lặp đến khi` qua điều kiện **làm vòng lặp dừng thật** (phía trước có hố, có đường bên phải…) rồi chạy tiếp khối sau. Boss **không** có `lặp n lần`. Không dạy lặp lồng (để dành W9): mọi màn W5 đặt `maxLoopDepth: 1`; `l14`, `l17` đặt thêm `maxInstances: { cq_repeat: 1, cq_repeat_until: 1 }`, boss `{ cq_repeat_until: 1 }` (§5.5 R2).

Chi tiết từng màn:
1. `l01` bản đồ 1 `..OF`, bản đồ 2 `.......OF`. Lời giải `lặp đến khi phía trước có hố {đi}, nhảy` (thắng cả hai). **VC ≤ 4:** chỉ có đúng lời giải này. Bản đồ 2 dài 9 ô để "nhảy mãi" rơi hố ở bản đồ 1.
2. `l02` `.....O..F` (sửa ở review P2-14), lời giải `lặp đến khi phía trước có hố {đi}, nhảy, đi, đi` (thắng). Xếp 2 khối đi vào trong vòng lặp → hết khối ở `stop@7`. Đúng **1** cách ghép thắng (`npm run par`).
3. `l03` `.O..F`, chương trình `lặp đến khi phía trước có hố {đi}, nhảy, đi, đi` → `win` (vòng lặp chạy 0 vòng). Thẻ: **Tới lá cờ** ✔ · Rơi xuống hố (`crash:FELL_IN_HOLE@1`, ngộ nhận "đi trước rồi mới hỏi") · Đứng trước cờ (`stop@3`) · Đứng yên chỗ cũ (`stop@0`).
4. `l04` bản đồ 1 `########/#S....G#/########`, bản đồ 2 `########/#S..G..#/########` (nhìn `E`). Lời giải `lặp đến khi đã tới đích {tiến}` (thắng). **VC ≤ 3:** chỉ có lời giải này.
5. `l05` (đợt tăng độ khó) bản đồ 1 `########/###.####/#S....G#/#####.##/########` (nhìn `E`, ngõ cụt cạnh đích), bản đồ 2 `#####/##S##/##.##/#..##/##.##/##..#/##.##/##.##/#.G##/#####` (nhìn `S`, dài hơn). Ban đầu `lặp đến khi đã tới đích {}` rồi `tiến` nằm **dưới** vòng lặp → `TIMEOUT` cả hai. Sửa: kéo `tiến` vào trong (1 thao tác, thắng cả hai). Gợi ý `TIMEOUT`: "Trong vòng lặp có khối nào đưa Măng đi không?".
6. `l06` (đợt tăng độ khó; review 14/10: vòng `lặp đến khi đã tới đích {tiến}` có sẵn dưới "khi bắt đầu", bé ghép vòng quay ở trên, để màn chỉ có 1 ý mới) "Tìm cửa hang", bản đồ 1 `#########/###.#.###/#S.....G#/#########` (nhìn `N`, cửa hang bên phải), bản đồ 2 `#######/###G###/###..##/##..###/###.###/###..##/###S###/#######` (nhìn `E`, cửa hang bên trái). Lời giải `lặp đến khi có đường phía trước {rẽ phải}, lặp đến khi đã tới đích {tiến}` (6 khối). **VC = 6:** đúng 2 cách (rẽ phải hoặc rẽ trái trong vòng đầu); một khối rẽ thuộc lòng (`rẽ phải, lặp đến khi đã tới đích {tiến}`) thắng bản đồ 1, đâm tường ở bản đồ 2. Ý mới duy nhất: thân lặp là khối rẽ (Măng không đi), có bài `w05-lesson-xoay` (2 demo) và câu chuẩn `content-authoring.md` §5.1. `maxInstances { cq_repeat_until: 2 }`.
7. `l07` `#######/#S....#/#.....#/#....G#/#######` (sửa ở review P2-14), chương trình `lặp đến khi đã tới đích {tiến, rẽ phải}` → `TIMEOUT` (Măng đi vòng ô vuông 2×2, về chỗ cũ sau 4 vòng). Thẻ: **Đi vòng mãi** ✔ (`timeout`, T9) · Tới bến đò (`win`) · Rẽ 1 lần, dừng (`stop@1,2`) · Đụng tường cuối bờ (`crash:HIT_WALL@1,5`). Măng **có đi** mà vòng lặp vẫn không dừng (khác thẻ 5 bài giảng: chỉ xoay).
8. `l08` (đợt tăng độ khó) bản đồ 1 `########/###.####/#S.....#/#####.##/#####.##/#####G##/########` (nhìn `E`, lối cụt bên trái trước chỗ rẽ), bản đồ 2 `#########/######G##/######.##/######.##/######.##/##.....S#/####.####/#########` (nhìn `W`, chỗ rẽ ngay bước đầu, lối cụt bên trái ở xa hơn). Ban đầu `lặp đến khi có đường bên trái {tiến}, rẽ phải, lặp đến khi đã tới đích {tiến}` → bản đồ 1 rẽ ở lối cụt (`HIT_WALL@2,3`), bản đồ 2 đi quá chỗ rẽ (`HIT_WALL@5,4`). Sửa "bên trái" → "bên phải" (đúng 1 cách, thắng cả hai). **VC = 7:** đúng 1 lời giải 7 khối. Bước sửa trước bước tự ghép `l09` (cùng chương trình).
9. `l09` bản đồ 1 `#######/#S....#/####.##/####.##/####G##/#######`, bản đồ 2 `##########/#S.......#/######.###/######.###/######.###/######G###/##########` (nhìn `E`, hành lang kéo dài quá chỗ rẽ; đoạn xuống dài 4 ô, khác bản đồ 1). Lời giải `lặp đến khi có đường bên phải {tiến}, rẽ phải, lặp đến khi đã tới đích {tiến}` (7 khối, thắng). `maxLoopDepth: 1`. **VC ≤ 7:** cỡ ≤ 6 không có lời giải; cỡ 7 có **đúng 1** lời giải (chính là lời giải trên). Bản trước có 18 cách 7 khối, kể cả không cần vòng thứ hai.
10. `l10` `..O.O..O.F`, khối xáo trộn của `lặp đến khi đã tới nơi {nếu phía trước có hố {nhảy} nếu không {đi}}` (thắng). Gợi ý `block:runner_at_goal`. Đích là cờ ở bờ bên kia (chưa về nhà: nhà để dành cho boss).
11. `l11` `..O.F` (sửa ở review P2-14), chương trình `lặp đến khi phía trước có hố {đi, đi}, nhảy, đi` → `crash:FELL_IN_HOLE@2`. Thẻ: **Rơi xuống hố** ✔ · Tới lá cờ (`win`, ngộ nhận "dừng ngay khi thấy hố") · Đứng sát mép hố (`stop@1`).
12. `l12` `#######/#S...##/####.##/###G.##/#######` (sửa khi soạn P2-14) (nhìn `E`). Ban đầu `lặp đến khi đã tới đích {nếu có đường phía trước {tiến} nếu không {}}` → `TIMEOUT` ở góc đầu tiên. Sửa: thêm `rẽ phải` vào nhánh "nếu không" (thắng).
13. `l13` (đợt tăng độ khó) bản đồ 1 xoắn ốc 11×11 `###########/#S#.......#/#.#.#####.#/#.#.#G..#.#/#.#..##.#.#/#.#.###.#.#/#.#.#.#.#.#/#.#.....#.#/#.#######.#/#.........#/###########` (nhìn `S`, rẽ trái 7 lần, 2 ngõ cụt bên trái), bản đồ 2 `########/#.G...##/#####.##/####...#/#####S##/########` (nhìn `N`, ngắn). Ban đầu `lặp 20 {nếu có đường phía trước {tiến} nếu không {rẽ trái}}`: thắng bản đồ 2, dừng giữa xoắn ốc ở bản đồ 1 (`stop@7,9`, `NOT_AT_GOAL`). Sửa 2 thao tác: khối `lặp` → `lặp đến khi` + cắm `đã tới đích?` (thắng cả hai). Rẽ **trái** để hình lời giải khác `l12`, `l14` (luật M2). Nhánh cụt bên phải ở bản đồ 2 chặn cách "lặp đến khi có đường bên phải" (dừng ở `3,5`). Gợi ý `NOT_AT_GOAL`: "Lặp 20 lần vẫn chưa tới. Lặp đến khi nào?".
14. `l14` bản đồ 1 xoắn ốc có **hốc cụt** ở `6,4` (măng trong hốc): `##########/#S.......#/########.#/#....G##.#/#.######.#/#.######.#/#.##.###.#/#........#/##########`, bản đồ 2 `##########/#S......##/#######.##/#######.##/#G......##/##########` (nhìn `E`). Lời giải ý chính `lặp đến khi đã tới đích {nếu có đường phía trước {tiến} nếu không {rẽ phải}}` (6 khối, thắng cả hai, bỏ qua hốc). `lặp 20 {…}` cùng thân dừng giữa đường ở bản đồ 1. `maxLoopDepth: 1`, `maxInstances { cq_repeat: 1, cq_repeat_until: 1 }`.
    - Hốc cụt chặn lối tắt lặp lồng `lặp N {tiến, lặp đến khi có đường bên phải {tiến}, rẽ phải}` (6 khối) mà bản trước có (`maxInstances` không chặn được lồng một `lặp` với một `lặp đến khi`).
    - **Đánh đổi sao:** cách 6 khối không vào hốc (chỉ ⭐).
    - **VC ≤ 7** (không lặp lồng; vài triệu chương trình chương trình ở cỡ 7): cỡ 6 có 6 cách thắng, đều là **một** vòng `lặp đến khi` và đều bỏ sót măng. Cỡ 7 có 2 cách vừa thắng vừa nhặt măng, đều là kiểu "lắc" `lặp đến khi đã tới đích {nếu có đường phía trước {tiến, rẽ phải} nếu không {rẽ trái}}`, nên `par` = 7. Cách "hỏi bên phải trước" (9 khối) cũng nhặt được măng (⭐⭐ với `maxBlocks` 9). Xem câu G19.
15. `l15` (đợt tăng độ khó, sửa sau review 14/10) bản đồ 1 `########/########/##G...##/#####.##/#####..#/#####.##/#S....##/###.####/########` (nhìn `E`, lối rẽ trái cách 4 bước, chẵn), bản đồ 2 `########/#S###G##/#.###..#/#.###.##/#.....##/###.####/########` (nhìn `S`, lối rẽ trái cách 3 bước, lẻ). Ngõ cụt bên phải. Ban đầu `lặp đến khi đã tới đích {nếu có đường bên trái {rẽ trái}, tiến, tiến}`: thắng bản đồ 1, đi quá lối rẽ ở bản đồ 2 (`HIT_WALL@4,1`). Sửa: bỏ 1 khối tiến (thắng cả hai; vét cạn có 5 cách sửa 1 thao tác, đều bỏ hoặc dời khối tiến thứ hai). **VC = 6** (2 cách). Hình mới (bản trước trùng `l08`, `l09` khi tính ảnh gương).
16. `l16` `#######/#S#...#/#.#.#.#/#.....#/#####.#/#..G..#/#######` (nhìn `E`, Măng nhìn vào tường lúc đầu; sửa ở review P2-14). Khối xáo trộn của `lặp đến khi đã tới đích {nếu có đường bên trái {rẽ trái}, nếu có đường phía trước {tiến} nếu không {rẽ phải}}` (thắng).
17. `l17` bản đồ 1 `##########/#S..#....#/###.#.##.#/#...#.#..#/#.###.#.##/#.....#.G#/##########`, bản đồ 2 `##########/#S.......#/#######.##/#G..#...##/###.#.####/###...####/##########` (nhìn `E`). Cách hai câu hỏi của `l16` (9 khối) thắng cả hai, nhưng **không phải nhỏ nhất**: thử thách là tìm chương trình gọn hơn. `lặp 20 {…}` (cách hai câu hỏi) dừng giữa đường ở cả hai bản đồ. `maxLoopDepth: 1`, `maxInstances { cq_repeat: 1, cq_repeat_until: 1 }`.
    - **VC ≤ 7** (không lặp lồng; vài triệu chương trình chương trình ở cỡ 7): cỡ ≤ 6 không có; cỡ 7 có 4 cách, đều kiểu "lắc", vd `lặp đến khi đã tới đích {nếu có đường phía trước {tiến, rẽ trái} nếu không {rẽ phải}}`. Nên `par` = 7, `maxBlocks` = 9. Màn không có `starGoals` nên giữ luật sao cũ: cách hai câu hỏi (9 khối, vượt `par`) chỉ được ⭐; ⭐⭐⭐ cần cách "lắc" 7 khối.
    - **Không có mục tiêu ⭐:** đã thử đặt măng ở mọi ô mà cách hai câu hỏi đi qua, và ở mọi hốc một ô mở thêm vào bản đồ; không chỗ nào mà cách hai câu hỏi lấy được còn cả 4 cách "lắc" đều bỏ sót. Vì vậy màn này là thử thách tối ưu số khối, không phải đánh đổi theo măng. Câu G19 hỏi HLV có chấp nhận ⭐⭐⭐ cần cách "lắc" khó nghĩ ra không.
18. `l18` (đợt tăng độ khó) bản đồ 1 `#########/###.#####/#S....###/#####.###/#####..G#/#####.###/#########` (nhìn `E`), bản đồ 2 `#########/######S##/######..#/####.#.##/#......##/###.#####/###G#####/#########` (nhìn `S`). Lời giải 3 vòng `lặp đến khi` nối tiếp: `lặp đến khi có đường bên phải {tiến}, rẽ phải, lặp đến khi có đường bên trái {tiến}, rẽ trái, lặp đến khi đã tới đích {tiến}` (11 khối, `maxInstances { cq_repeat_until: 3 }`). Ban đầu vòng 1 chờ **bên trái** và vòng 2 thân `{tiến, tiến}` → rẽ ở lối cụt (`HIT_WALL@2,5` / `@4,6`). Chỉ sửa vòng 1: bản đồ 2 đi quá lối rẽ thứ hai (`HIT_WALL@4,1`); chỉ sửa vòng 2: vẫn rẽ ở lối cụt. Sửa cả hai (2 thao tác, đúng 1 cách) thắng cả hai.
19. `l19` (đợt tăng độ khó) `..C.O.F`, chương trình `đi, lặp đến khi phía trước có hố {nếu phía trước có thùng {đá}}, nhảy, đi` → `TIMEOUT` (đá đổ thùng xong, phía trước là đất: khối `nếu` không làm gì, Măng đứng yên, phía trước không bao giờ là hố). Thẻ: **Đứng yên mãi không dừng** ✔ (`timeout`) · Tới lá cờ (`win`, ngộ nhận "đá xong thì đi tiếp") · Đụng thùng (`crash:HIT_CRATE@2`) · Rơi xuống hố (`crash:FELL_IN_HOLE@4`). Dựa vào luật A4. Có thêm `nếu` trong thân và khối trước / sau vòng lặp (8 khối, trước 4).
20. `boss` (đợt tăng độ khó, review 14/10: runner → mê cung) `escort`, `goalSprite: home`:
    - bản đồ 1 `#########/#S......#/####.##.#/####....#/####.####/###..####/####..G##/#########` (nhìn `E`), Gà con ở `1,6` trên nhánh đi thẳng; bám tường phải rẽ xuống ở ngã ba `1,4`, tới nhà mà chưa đón em (`missed@6,6`, `NEED_FRIEND`);
    - bản đồ 2 `###########/#.......###/#.#####.###/#.#G....###/#.###.#.#.#/#.....#..S#/###########` (nhìn `W`), Gà con ở `1,4` trên vòng quanh bãi lau; bám tường trái hay phải đều đi vòng mãi (`timeout`).

    Lời giải `lặp đến khi đã tới đích {nếu có đường phía trước {tiến} nếu không {nếu có đường bên trái {rẽ trái} nếu không {rẽ phải}}}` (9 khối, `maxBlocks` 10, `maxInstances { cq_repeat_until: 1 }`): đi thẳng qua ô Gà con rồi về nhà ở cả hai. **VC = 9** (4 cách, đều là "đi thẳng trước"), bằng `par` của `l16` (9). D9: Gà con luôn nằm trước nhà trên đường của lời giải, nên `lặp đến khi đã tới đích` không dừng ở nhà khi chưa đón em; cách sai dừng ở nhà với `NEED_FRIEND` là phản hồi mong muốn. Bài `w05-lesson-don-ban` đổi sang demo mê cung (đi qua ô Gà con: đón được; đi lối khác: `missed@1,4`).

Ghi chú khi soạn (P2-14, 05/10/2026; đã qua review sư phạm độc lập, chờ HLV chơi thử). **Số liệu cũ** của các màn `l05`, `l06`, `l08`, `l13`, `l15`, `l18`, `l19`, boss trong mục này là bản runner / bản trước đợt tăng độ khó 14/10/2026; số mới ở bảng, "Chi tiết từng màn" và mục "Đợt tăng độ khó" dưới:
- Mọi màn qua `content:check` (không cảnh báo). `npm run par -- --world w05`: ✔ cả 14 màn build/bughunt (`par`/`parEdits` đúng bảng), màn ghép hình `l02`, `l10` ✔ (đúng 1 cách ghép thắng), `l16` ⚠ (ghi dưới):
  - build: `l01` 4 (đúng 1 cách), `l04` 3 (1), `l06` 4 (1), `l09` 7 (1), `l14` theo mục tiêu 7 (2 cách "lắc") · thắng thường 6 (6), `l17` 7 (4), boss 6 (6);
  - bughunt: `l05` sửa 1 (2 cách: kéo `tiến` vào trong, hoặc thêm một `tiến` vào trong), `l08` 1 (1), `l12` 1 (1), `l13` 2 (3 cách: `lặp đến khi đã tới nơi`, hoặc "đến khi phía trước có cành / thùng", G7), `l15` 1 (1), `l18` 2 (1).
- **Bản đồ đã sửa khi soạn** (vét cạn trên engine thật khác bảng nháp):
  - `l12`: bản đồ nháp (hai đoạn cùng dài 2 ô) để `lặp đến khi đã tới đích {tiến, tiến, rẽ phải}` (5 khối, "thuộc lòng") thắng, ít hơn `par` 6. Bản đồ mới (đoạn 3 ô, 2 ô, 1 ô): nhỏ nhất 6 (12 cách, đều hỏi có đường), đúng 1 cách sửa.
  - `l15`, `l18`: bản đồ 2 nháp `......O.F` để chương trình không cần hỏi thắng cả hai bản đồ bằng 5 khối (`đi, lặp đến khi … {đi, nhảy}`, `lặp đến khi … {nhảy, nhảy, đi}` với điều kiện không bao giờ đúng, như nhảy cóc). Bản đồ 2 mới `..........O.F` (hố ô 10, nơi cả hai nhịp đó đều rơi): `l15` nhỏ nhất 5 đúng 1 cách, 1 cách sửa; `l18` 1 cách sửa 2 thao tác; chỉ sửa một chỗ vẫn thua. Đã thử đổi bản đồ 1 của `l18` thành `....O.F`: sinh lời giải 4 khối và cách sửa 1 thao tác, nên giữ `...O.F`.
- **Review sư phạm độc lập (05/10/2026), đã sửa:**
  - **Luật ghép hình mới** (G22 mở rộng, quyết định của điều phối): thắng ở `parsons` còn cần **mọi khối đều chạy** ít nhất một lần và không có thân lặp / nhánh trống, không thì `UNUSED_BLOCKS` "Còn chỗ trống, hoặc khối chưa chạy. Ghép lại nhé!" (`runtime-engine.md` §2). `npm run par` chạy mọi cách ghép của màn ghép hình (`content-model.md` §8).
  - `l02` `.....O..F`: bản nháp `..O..F` có 4 cách ghép thắng; nay đúng 1. `l10` giữ `..O.O..O.F`: với luật mới chỉ lời giải thắng (12 cách ghép).
  - `l16`: bản nháp có 7 cách ghép thắng, gồm cách "hỏi phía trước trước" (ý sai của màn) và cách bọc vòng lặp trong `nếu phía trước có đường`. Bản đồ mới (Măng nhìn vào tường lúc đầu, có vòng quanh) chặn cả hai; còn **4** cách thắng, đều là "bám tường trái" đúng, chỉ khác chỗ đặt câu hỏi bên trái (trước khi tiến, trong nhánh, hoặc sau khi tiến). Với `lặp đến khi` không giới hạn vòng, các cách này tương đương nên không bản đồ nào tách được (đã tìm ngẫu nhiên vài nghìn mê cung). `npm run par` báo ⚠, chấp nhận.
  - `l07` (đổi có duyệt): chương trình `lặp đến khi đã tới đích {tiến, rẽ phải}` trên ô trống 3×5: Măng **có đi** mà vẫn vòng mãi, nên câu hỏi "vòng lặp có dừng không?" không bị lộ bởi "không có khối nào đi" (bản nháp: chỉ rẽ, rồi `tiến` nằm ngoài, giống thẻ 5 bài giảng). Gợi ý chuyển sang `idle`, lời trung tính.
  - `l11` `..O.F`: ngộ nhận "dừng ngay khi thấy hố" giờ cho ra `win` (thẻ "Tới lá cờ"), khác hẳn đáp án thật.
  - Bài `w05-lesson-toi-noi`: demo chỉ dùng khối mới (`lặp đến khi đã tới nơi {đi}` trên đường bằng ngắn và dài), không lộ lời giải `l10`. Bài `w05-lesson-lap-den-khi`: demo 2 dùng `.O.F` (khác bản đồ `l03`).
  - Thẻ 2 bài mở đầu: "Chú Ếch dạy: trước mỗi vòng, hỏi. Đúng thì dừng."; thẻ 1 bài `w05-lesson-don-ban`: "Gà con lạc bên kia sông! Đứng ở ô em để đón."
  - Gợi ý: `l03` `enter` "Chỉ tay theo từng khối. Măng làm gì đầu tiên?"; `l19` chuyển sang `idle`; `l17` thêm gợi ý `TIMEOUT` "Chỉ rẽ một phía, Măng đi vòng mãi. Còn lối nào?"; câu khối mới viết «đã tới đích?», «đã tới nơi?»; `l18` gợi ý tư duy "Sửa một chỗ vẫn rơi? Có khi còn chỗ sai nữa."; nhiệm vụ `l18` nhắc Bông ("Bông chờ bên kia sông. Sửa 2 chỗ sai nhé!").
- Test `tools/content-check/src/w05.test.ts`: demo bài giảng (kể cả thẻ `TIMEOUT` chóng mặt), đáp án các màn đoán, ghép sai và "đúng 1 cách ghép" (`l02`, `l10`), từng bước sửa, R1 (bỏ mọi câu hỏi khỏi thanh khối: không gì thắng trong `maxBlocks` / `par`), đánh đổi sao `l14` 7 / 6, boss đón Gà con ở cả 3 bản đồ.
- **Bài "Khối mới"** (`content-authoring.md` §5.1): `w05-lesson-lap-den-khi` trước `l01`, `w05-lesson-toi-dich` trước `l04`, `w05-lesson-toi-noi` trước `l10`, `w05-lesson-don-ban` trước boss (đứng ở ô Gà con: thắng; nhảy qua: `NEED_FRIEND`, T20).
- **Boss:** Gà con ở ô bắt buộc phải đứng trên cả 3 bản đồ, nên `NEED_FRIEND` không xảy ra với chương trình nào không rơi hố; nhiệm vụ đón bạn chỉ là động lực (D11). Gợi ý `enter` "Gà con chờ trên đường. Đứng ở ô em là đón được!" thay cho gợi ý `NEED_FRIEND`.
- `l13`: mục tiêu màn "Bờ sông dài quá. Đổi khối lặp cho Măng tới bờ!" (2 thao tác là một ý sửa).
- `w05-creative`: một đường runner 29 ô có hố, cành, thùng; thanh khối đủ khối runner W1–W5. `world.json` dùng cảnh `theme.scene: "song"` (P2-23).
- **Mạch truyện sang W6:** W5 kết ở boss (đưa Gà con về nhà). Thẻ 1 bài mở đầu W6 nên mở bằng "Về tới làng rồi!".
- **Chờ HLV chơi thử** từng màn (`content-authoring.md` §6). Câu G19 (⭐⭐⭐ cần cách "lắc" ở `l14`, `l17`) vẫn mở.

- **Đợt tăng độ khó (14/10/2026, `roadmap/difficulty-pass.md` đợt A; 🟨 nháp, chờ HLV chơi thử):** thay tại chỗ, giữ ID, chương, bài `beforeLevel`, ý chính và nhân vật:
  - mê cung mới: `l06` (ý mới: thân lặp là khối rẽ, bài `w05-lesson-xoay`), `l08`, `l13` (xoắn ốc 11×11), `l15`, `l18` (3 vòng `lặp đến khi`), boss (review 14/10: mê cung có đường vòng, 9 khối); khó hơn: `l05` (2 bản đồ, ngõ cụt), `l19` (thêm `nếu` trong thân, 8 khối). Mê cung 8 → 14/20. Mode giữ nguyên.
  - `npm run par`: `l05` 3 (1) · sửa 1 (2); `l06` 6 (2); `l08` 7 (1) · sửa 1 (1); `l13` 6 (3, đều `lặp đến khi đã tới đích`) · sửa 2 (1); `l15` 6 (2) · sửa 1 (5); `l18` 11 (nhỏ nhất **10**: 2 cách "lắc" `lặp đến khi có đường bên phải {tiến}, lặp đến khi có đường phía trước {rẽ phải, tiến, rẽ trái}, tiến, tiến`; bughunt chấm theo `parEdits` nên không đổi sao) · sửa 2 (1); boss (mê cung) 9 (4).
  - **Lệch kế hoạch:** (1) `l13` rẽ **trái** (kế hoạch: rẽ phải); với luật M2 tính ảnh gương, nó là lần 2 của công thức `l12` (cùng mode săn lỗi nhưng khác loại bản đồ: 2 bản đồ, xoắn ốc > 20 vòng), giữ có chủ đích: `l12` sửa nhánh trống, `l13` sửa khối lặp; `l14` tự ghép dùng cách "lắc" 7 khối. (2) `l06` có bài `w05-lesson-xoay` (luật HLV 14/10, như W4 `l12`). (3) Bản đồ 2 của `l08` kéo dài đoạn sau chỗ rẽ (4 ô) để `…, rẽ, tiến, tiến, tiến` không thắng cả hai. (4) Review 14/10: `l15` đổi công thức (bản trước là ảnh gương `l08`/`l09`, lần 3); boss thành mê cung (9 khối); `l05` thanh khối thêm rẽ trái/phải (không có khối rẽ thì ngõ cụt cạnh đường không tới được, luật M1 nay chỉ đếm ô tới được); mission `l06`, `l18` theo mạch truyện (sau chương "Bến đò": "Bến đò bên kia hang đá"; `l18` "Bông chờ ở bãi lau").
  - Còn 5 ⚠ luật 24, đều ở màn giữ nguyên: `l09` (M1 + M3: 2 bản đồ cùng hình "rẽ phải ở ngã ba"), `l12`, `l14`, `l17` (M1). Không có ⚠ M2 (lặp công thức) ở W5. HLV xem khi chơi thử.

### 5.4 Tính năng cần cho P2-11 / P2-12 (từ ba bảng trên)

| # | Tính năng | Task | Màn cần |
|---|---|---|---|
| T1 | Khối `nếu` (1 nhánh) và `nếu … nếu không` (2 nhánh) là **hai khối riêng trong thanh khối**, không cần bánh răng. Đề xuất hai type `cq_if` / `cq_if_else`, để luật 7 thấy lần đầu của từng khối. Nếu chọn `controls_if` + `extraState`, luật 7 phải phân biệt theo `extraState`. **Không** có "nếu không nếu", khối "không" (phủ định), "lặp khi" (while) ở W4–W5 | P2-11 | W4 từ `l01`; W5 `l10`, `l12`–`l14`, `l16`, `l17`, boss |
| T2 | Khối `lặp đến khi` (`controls_whileUntil` khóa UNTIL hoặc type `cq_repeat_until`): hỏi điều kiện **trước** mỗi vòng | P2-11 | W5 từ `l01` |
| T3 | Khối hỏi runner `phía trước có [hố/cành/thùng/ô trống]` (đã có): `HOLE`, `CRATE` (W4 `l09`), `CLEAR` (W4 `l05`, `l12`, `l19` và W5 `l06` trước đợt tăng độ khó 14/10/2026; nay chỉ còn là cách giải tương đương), `BRANCH` (W5 `l08`, `l18` trước đợt tăng độ khó) | P2-11 | như cột trái |
| T4 | Khối hỏi maze `có đường [phía trước/bên trái/bên phải]` (đã có), theo hướng **của Măng** | P2-11 | W4 `l04`, `l05`, `l07`, `l08`, `l11`, `l12`, `l13`, `l14`, `l15`, `l16`, `l18`, `l19`, boss; W5 `l06`, `l08`, `l09`, `l12`–`l18` |
| T5 | `đã tới đích?` (đã có). Với luật A1, lượt chạy kết thúc ngay khi chạm đích, nên khối này **không bao giờ trả ✔ trong lúc chạy**; `lặp đến khi đã tới đích` thực chất dừng nhờ luật thắng. Ghi rõ trong bài giảng ("Tới nơi là thắng ngay") và `glossary.md` | P2-11 | W5 `l04`, `l05`, `l07`, `l09`, `l12`, `l14`, `l16`, `l17` |
| T6 | **Khối mới đề xuất** `runner_at_goal` "đã tới nơi?", cùng tính chất với T5 (câu G5). Gọi "tới nơi" (thuật ngữ chung trong `glossary.md`) chứ không "tới cờ", vì đích có thể là cờ, nhà, lồng… (T17) | P2-11 | W5 `l10`, `l13`, boss |
| T7 | Event `sense{blockId, value}` → khối hỏi sáng ✔/✘ mỗi lần được đọc | P2-11 | W4 `l03` (✘ đúng 1 lần), `l07`, `l10`; mọi màn có khối hỏi |
| T8 | `TIMEOUT` ở màn chơi: phát lại tối đa vài giây (câu G13) rồi hoạt ảnh "chóng mặt"; gợi ý tầng 0 theo `lastReason: TIMEOUT` | P2-11 | W5 `l05`, `l12` |
| T9 | **Khóa đáp án `timeout`** cho `predictAnswer` runner và maze + hình thẻ đáp án (Măng chóng mặt). Hiện chỉ có `win` / `stop@` / `missed@` / `crash:` | P2-11 | W5 `l07`, `l19` |
| T10 | Điểm chỉ gợi ý **`step`** (nút Từng bước): thêm vào `HintTargetSchema` (hiện có `toolbox:`, `block:`, `run`, `capacity`, `stage`) | P2-11 | W3 `l02`, `l03` |
| T11 | `variants` (1–2 bản đồ thêm) cho `build` và `bughunt`; vật phẩm `rescue`/`escort` (T17) khai báo **theo từng bản đồ** | P2-12 | W4 `l02`, `l05`, `l06`, `l11`, `l15`, `l16`, `l17` (3), `l18`, `l19`, boss (3); W5 `l01`, `l04`, `l05`, `l06`, `l08`, `l09`, `l13`, `l14`, `l15`, `l17`, `l18`, boss (2) |
| T12 | `bughunt` có **khối rời** trong `initialWorkspace` (nối vào = 1 thao tác); gợi ý `orphans: true` | đã có (kiểm khi soạn) | W3 `l05` |
| T13 | `bughunt` có nhánh "nếu không" **trống**; thêm 1 khối vào nhánh = 1 thao tác. Thay `lặp` bằng `lặp đến khi` + cắm khối hỏi = 2 thao tác | P2-11 (`editDistance`) | W5 `l12`, `l13` |
| T14 | Vòng `lặp đến khi` thân rỗng dừng bằng `maxSteps` hoặc `maxActions` (nếu `sense` được đếm). Chốt `sense` có tính vào `maxActions` không; cả hai cách đều phải ra `TIMEOUT` tất định | P2-11 | W5 `l05` |
| T15 | Runner 39–40 ô (giới hạn schema 40): sân chơi cuộn/thu nhỏ vẫn đọc được | P2-14 | W5 `l13`, boss |
| T16 | Vét cạn `par` (P2-15) hỗ trợ `nếu`, `nếu … nếu không`, `lặp đến khi`, khối hỏi kèm giá trị ô chọn, nhiều bản đồ, vật phẩm T17; **và xét `maxInstances` cùng `maxLoopDepth`** (hiện không xét `maxInstances`: `content-model.md`, phần vét cạn). Thiếu cái này thì `npm run par` báo nhầm lời giải lặp lồng ít khối hơn | P2-15 / P2-11 | mọi màn build/bughunt W4–W5 |
| T16b | **Giới hạn lồng vòng lặp** `maxLoopDepth` (trường mới của level, số nguyên ≥ 1): `1` = không đặt vòng lặp (`lặp`, `lặp đến khi`) bên trong vòng lặp khác. Cần ở schema, Blockly (từ chối thả khối, như `maxInstances`), validator (luật kiểm `solution`/`initialWorkspace`) và vét cạn. `maxInstances` không đủ vì nó đếm theo **từng loại** khối, nên vẫn lồng được một `lặp` với một `lặp đến khi` (bản trước của W5 `l14`) | P2-11 / P2-15 | W3 `l11`; mọi màn build/bughunt W4–W5 có vòng lặp |
| T17 | **Nhiệm vụ và kiểu đích mới** (yêu cầu HLV):<br>(a) trường `mission` (≤ 12 chữ, luật 5 đếm chữ, giọng đọc `<id>.mission`) và `goalSprite` (`flag`, `machine`, `exit`, `home`, `footprints`, `friend`, `cage`, `dock`), chỉ để vẽ;<br>(b) `goal.items: { at, kind: 'key' \| 'friend' }[]` cho runner và maze. Măng phải **đứng ở** ô vật phẩm (như măng: nhảy qua không tính) trước khi đích được tính. Runner: tới cờ mà thiếu thì lượt chạy kết thúc `incomplete`. Maze: đi xuyên qua đích như `collectAll`. Hết chương trình **đang đứng ở đích** mà thiếu vật phẩm thì `incomplete` / `NEED_KEY` (hoặc `NEED_FRIEND`); hết chương trình ở chỗ khác thì vẫn `NOT_AT_GOAL` (vị trí xét trước). Lý do mới `NEED_KEY` ("Cần chìa khóa trước!"), `NEED_FRIEND` ("Chưa đón bạn kìa!"), thêm vào `feedback.json` (luật 17). Khóa đoán dùng lại `missed@<ô>`;<br>(c) sprite chìa khóa, lồng (đóng/mở), bạn đi theo Măng, nhà, cửa ra, bến đò, dấu chân; mặt các nhân vật lấy từ hình đại diện;<br>(d) tất định và vét cạn được (trạng thái chỉ thêm tập vật phẩm đã lấy) | P2-11 (+ sprite: `playbooks/add-asset.md`) | (a) mọi màn W3–W5; (b) W4 `l17`, W4 boss (`rescue`), W5 boss (`escort`) |
| T18 | Trình phát bài giảng chạy được thẻ `demo` kết thúc `TIMEOUT` (phát lại có giới hạn + hoạt ảnh chóng mặt) | P2-11 | `w05-lesson` thẻ 5 |
| T19 | `starGoals` (P2-21): mục tiêu "nhặt đủ măng" **không** phải điều kiện thắng (khác `collectAll`); thẻ "Mục tiêu ⭐"; `npm run par` tính `par` theo "thắng + đạt mọi mục tiêu" | P2-21 | W3 `l11`, W4 `l16`, W5 `l14` (và màn thêm sau) |

| T20 | **Giới thiệu khối mới** (luật cố định, `conventions/content-authoring.md` §5.1): `nếu`, `nếu … nếu không`, `lặp đến khi`, `đã tới nơi?`, chìa khóa / đón bạn (T17) mỗi thứ cần câu cho bé ở gợi ý `enter` + ví dụ chạy được (bài "Khối mới" `beforeLevel` hoặc thẻ `demo` bài mở đầu) + tooltip chính xác (khối hỏi: trả ✔/✘ khi nào; lặp đến khi: hỏi trước mỗi vòng) | P2-11 | màn đầu tiên dùng mỗi khối |

Runner **không** cần thêm khối hỏi nào khác ngoài T6.

### 5.5 Quyết định thiết kế, luật soạn, phụ thuộc

Quyết định AI đã chọn. HLV đổi được qua các câu hỏi ở **`roadmap/coach-questions.md` mục G** (danh sách câu hỏi chỉ để ở đó):
- **D1.** W3 không có khối mới. Kỹ năng mới là **quy trình gỡ lỗi**, mỗi màn thêm một bước hoặc một loại lỗi.
- **D2.** Đoán rồi sửa trên cùng một chương trình (W3 `l01` → `l02`), theo PRIMM.
- **D3. Runner chỉ hỏi về hố trong mọi màn tự ghép có điều kiện ở W4–W5.** Với luật hiện tại có ba **lối tắt không cần hỏi**:
  - "luôn cúi": cúi trên đất = đi (A2);
  - "luôn đá": đá ô trống không sao (A4);
  - **"nhảy cóc"**: nhảy qua ô đất là hợp lệ, tiến 2 ô. Nếu mọi hố nằm ở ô lẻ tính từ chỗ Măng đứng, `lặp {nhảy}` thắng mà không cần hỏi.

  Vì vậy câu hỏi về cành và thùng chỉ ở `parsons`, `predict`, `bughunt` (W4 `l09`; W5 `l19`). Mỗi màn hỏi về hố phải có bản đồ chặn "nhảy cóc" (luật R1). Phân nhánh nhiều hướng nằm ở mê cung: **từ W4, màn build có điều kiện ưu tiên mê cung** (đợt tăng độ khó 14/10/2026), runner giữ cho màn giới thiệu khối và màn đọc.
- **D4.** W4 dùng `lặp N lần` với N đủ lớn (dựa vào A1), được dạy ở `l06`. Mọi bản đồ W4 ≤ 20 vòng.
- **D5.** Boss W4 là mê cung "hai câu hỏi" 8 khối, có `l13` đoán → `l14` ghép hình → `l16` tự ghép đi trước.
- **D6.** W5 dạy `lặp đến khi` bằng điều kiện làm vòng lặp dừng thật trước, rồi mới tới `đã tới đích?` / `đã tới nơi?`.
- **D7.** Không dạy lặp lồng ở W3–W5 (luật R2, `maxLoopDepth: 1`).
- **D8.** Có `predict` ở chặng `challenge` (W3 `l14`, W5 `l19`): thử thách đọc chương trình khó.
- **D9.** Không dùng điều kiện thắng `config.goal.collectAll` / `items` cùng `lặp đến khi đã tới đích` trong mê cung (A5): Măng đi xuyên đích khi còn thiếu vật phẩm, nhưng `đã tới đích?` trả ✔ ngay khi Măng đứng ở đích (bất kể vật phẩm), nên vòng lặp dừng **ở đích** và lượt chạy kết thúc `NEED_KEY` / `NEED_FRIEND` (hoặc `MISSED_ITEMS`) thay vì đi tiếp nhặt vật phẩm: "lặp đến khi tới đích" không bao giờ thắng được màn đó. Mục tiêu ⭐ `starGoals` `collectAll` thì **được** (không chặn đích, W5 `l14`). W5 boss dùng `escort` trên runner, nơi lượt chạy kết thúc ngay ở cờ.
- **D10.** Thêm khối runner `đã tới nơi?` (`runner_at_goal`, G5). Đây là cách thật duy nhất để viết "lặp tới khi tới nơi" cho runner. Gọi "tới nơi" chứ không "tới cờ" vì từ W3 đích có thể là nhà, lồng, bến đò (§5.0); thẻ đoán cũng ghi "Tới nơi" khi đích không phải cờ. Nó có cùng tính chất "không bao giờ ✔ khi đang chạy" như `đã tới đích?` đã có, và chỉ tốn một khối hỏi. Không có nó, boss W5 phải dùng mẹo "lặp đến khi phía trước có cành" trên đường không có cành.
- **D11.** Nhiệm vụ (§5.0) chỉ để tạo động lực. `rescue`/`escort` chỉ đặt ở màn mà vật phẩm **không** thêm ý mới: W4 `l17` (thử thách; chìa khóa Bông đánh rơi trên đường, hình đích dấu chân, để không lộ trước cảnh mở lồng của boss), W4 boss (chìa khóa ở nhánh trái, dùng lại ý `l13`), W5 boss (Gà con nằm trên đường, Măng đi qua là đón được).
- **D12. Mục tiêu ⭐ (P2-21, luật ở `rewards-economy.md` §1).** "Nhiều cách giải, cách khéo hơn mới được nhiều sao" có ở ba dạng:
  - `bughunt`: luật cũ đã cho ⭐⭐ chỉ khi số thao tác sửa ≤ `parEdits`, nên xóa hết làm lại chỉ được ⭐. W3 dùng dạng này cho mọi màn sửa lỗi.
  - `build` có `par`: ít khối hơn được ⭐⭐ (luật cũ).
  - **Đánh đổi thật** (`starGoals`: nhặt măng): chương trình **rẻ nhất** thắng nhưng bỏ sót măng, chương trình khéo hơn, dài hơn mới lấy được. Đã vét cạn: W3 `l11` (5 khối bỏ sót, 7 khối lấy được), W4 `l16` (5 khối bỏ sót, 8 khối hai câu hỏi lấy được), W5 `l14` (6 khối bỏ sót, 7 khối lấy được). Khi đó ⭐⭐ = thắng + đạt mục tiêu, ⭐⭐⭐ = thêm ≤ `par` (bughunt: ≤ `parEdits`) và không gợi ý tầng 2–3.

  Màn guided và màn giới thiệu khối mới giữ đơn giản (không mục tiêu). Đã thử nhưng **không** có đánh đổi thật nên không đặt mục tiêu:
  - W4 `l04`, `l08`: `maxBlocks` 5 không đủ chỗ cho chương trình đi vào hốc;
  - W5 `l17`: không chỗ đặt măng nào tách được các cách 7 khối với cách hai câu hỏi.

  Khi soạn P2-13/14, thêm mục tiêu cho màn nào `npm run par` cho thấy có đánh đổi thật.

Luật soạn thêm cho W4–W5 (ghi vào `conventions/content-authoring.md` khi soạn P2-13):
- **R1. Kiểm "nhảy cóc".** Màn runner nào muốn ép hỏi về hố phải có ít nhất một bản đồ có hố ở ô **chẵn** tính từ ô 0, hoặc có `rescue`/`escort` đặt vật phẩm ở ô mà nhảy cóc bay qua. Kiểm bằng `npm run par`: lời giải ngắn nhất phải có khối hỏi.
- **R2. Chống lặp lồng.** Mọi màn build/bughunt có vòng lặp từ W3 `l11` tới hết W5 đặt `maxLoopDepth: 1` (T16b). Thêm `maxInstances` khi cần giới hạn số vòng: W4 mọi màn có `lặp`: `{ cq_repeat: 1 }`; W5 `l14`, `l17`: `{ cq_repeat: 1, cq_repeat_until: 1 }`; W5 boss: `{ cq_repeat_until: 1 }`. Chỉ `maxInstances` thì **không đủ** (W5 `l14` bản trước bị `lặp N {tiến, lặp đến khi …, rẽ phải}` 6 khối).
- **R3. Vét cạn đã làm và chưa làm.** Đã vét cạn: xem từng dòng "VC ≤ n" (bộ mô phỏng nháp bằng Node, số lần lặp 1–20, mọi giá trị ô chọn, giới hạn lồng như R2; mỗi lần chạy ≤ 1,2 × 10⁷ chương trình). Màn 8–9 khối chưa vét cạn tới đúng `par`; phải chạy `npm run par` (T16, T16b) khi soạn.
  - W4 `l16`: VC ≤ 7 (2,7 triệu ở cỡ 7), có bắt măng: không có lời giải → `par` 8.
  - W4 boss: VC ≤ 7 (2,7 triệu ở cỡ 7), có bắt chìa khóa: không có lời giải → `par` 8.
  - W5 `l17`: VC ≤ 7 (vài triệu chương trình ở cỡ 7): nhỏ nhất 7 → `par` 7.
  - W3 `l11`: VC ≤ 6 với mục tiêu: không có → `par` 7.

Phụ thuộc vào các câu đang mở ở GĐ 1:
- **A1 (thắng ngay khi chạm đích):** giữ thì thiết kế trên đúng nguyên. Đổi thành "chỉ thắng khi hết chương trình" thì:
  - W1–W2 phải soạn lại;
  - W4 `lặp N` với N thừa làm Măng đi quá đích, nên phải chọn N đúng (khó) hoặc dạy `lặp đến khi` trước `nếu`;
  - W5: `đã tới đích?` / `đã tới nơi?` trả ✔ thật, `lặp đến khi` có ý nghĩa đầy đủ.

  Đánh đổi chi tiết ở câu G2.
- **A2, A4 và "nhảy cóc":** giữ thì giữ D3 + R1. Đổi thì W4 thêm được màn "ba vật cản" (cần `nếu` lồng trong `nếu không`, không đề xuất cho W4), và phải kiểm lại W1–W3, W5 `l19`.
- **A5 (`đã tới đích?` đúng khi còn măng):** không ảnh hưởng nhờ D9.
- **A7 (lặp tối đa 20):** W4 boss cần 16 vòng; W5 dùng chính giới hạn này cho "lặp 20 lần không đủ".

## 6. Thế giới 6–10

Thế giới 6 và 7 đã chi tiết hóa (§6.1, §6.2, 07/10/2026). Thế giới 8–10 vẫn là **khung**, chi tiết hóa khi tới giai đoạn xây.

| Thế giới | Mục tiêu học | Ngộ nhận nhắm tới | Boss |
|---|---|---|---|
| 6 Thành Phố Robot | xem §6.1 | | |
| 7 Chợ Đếm Số | xem §6.2 | | |
| 8 Xưởng Phép Thuật | Gói chuỗi lệnh thành hàm, dùng lại, thêm tham số | Hàm chạy ngay khi định nghĩa | Vẽ cả ngôi làng bằng 3 hàm |
| 9 Tháp Họa Sĩ | Lặp lồng nhau, góc ngoài của đa giác | Vòng trong chạy 1 lần | Vẽ bông hoa tuyết |
| 10 Học Viện Thuật Toán | So sánh các cách giải, sắp xếp, tìm kiếm, chọn đường ngắn nhất | Cách nào chạy được là tốt | Robot chọn thứ tự nhiệm vụ tối ưu |

### 6.1 Thế giới 6 — 🤖 Thành Phố Robot (chi tiết, bản nháp P3-04, 07/10/2026)

> Viết theo quyết định của điều phối ngày 07/10/2026, **sửa cùng ngày** theo review độc lập (gắp / thả tại ô Bíp đứng, khối rẽ giữ tên "rẽ trái / rẽ phải", màn thi quan trọng đặt sớm, boss nhẹ). Chung kết quốc gia miền Bắc AIROC là **17–18/10/2026**, nên W6 dạy đúng các thói quen cần trên Leanbot thật: **đếm ngã tư**, **quay tại chỗ rồi mới tiến**, **tay gắp giữ một khối**, **lập thứ tự nhiệm vụ**, **kết thúc ở phòng thí nghiệm**, **ngân sách thời gian**. Luật kiểu game: `game-kinds.md` §3.3. Mọi điểm, giây, sa bàn là **gần đúng** (`airoc-2026.md` §4), nằm trong dữ liệu; HLV gửi luật thật thì sửa dữ liệu (P3-07). Câu hỏi còn mở: `roadmap/coach-questions.md` mục H.

Quy ước riêng của bảng W6 (ngoài quy ước §5):
- **Sa bàn** viết từng hàng, ngăn bằng `/`: `#` nhà (không có line) · `.` ngã tư · `L` phòng thí nghiệm · `Z` ô vùng ô nhiễm · `r` `y` `g` trạm đỏ / vàng / xanh lá. Ô `r,c` đếm từ 0. Hướng như maze (`N` lên, `E` phải, `S` xuống, `W` trái). Không ghi chỗ xuất phát thì Bíp đứng ở `L`.
- **Khối trên sa bàn** viết `rào@r,c`, `TH đỏ@r,c` (khối trung hòa đỏ), `ON vàng@r,c` (khối ô nhiễm vàng); `cầm TH đỏ` = `startHolding`.
- **Chương trình** viết gọn: `tiến 3` = lệnh "tiến 3 ô"; `gắp`, `thả`, `rẽ trái`, `rẽ phải`; câu hỏi viết như nhãn. `rẽ phải ×2` = hai lệnh `rẽ phải` (hoặc `lặp 2 {rẽ phải}`, cũng 2 khối).
- **Giờ** (giây) theo luật chung: tiến 2 s mỗi ngã tư, rẽ 1 s, gắp 2 s, thả 2 s, câu hỏi 0 s. Màn không ghi `timeLimit` dùng 120 s (không bao giờ hết giờ ở màn nhỏ).
- **Chưa vét cạn** (robotlab chưa có): mọi `par`, `parEdits`, giây ở đây là **dự kiến**, tính tay theo luật §3.3. Khi soạn (P3-04), chạy `npm run par` trên engine thật, sửa sa bàn hoặc số, rồi ghi lại ở "Ghi chú khi soạn" như W3–W5.
- **Chữ cho bé ở W6:** "khối" chỉ là khối thi đấu (rào, trung hòa, ô nhiễm); khối Blockly gọi là **"lệnh"**, cả chương trình là **"chương trình"**. Gợi ý `enter` của lệnh mới là "Lệnh mới! " + đúng tooltip (`game-kinds.md` §3.3).

**Câu chuyện:** Măng và Bông về tới làng. Bên kia đồi là **Thành Phố Robot**, nơi bác Cú (chủ xưởng ở làng, W3) mở thêm một phòng thí nghiệm. Gió của phù thủy thổi **khối ô nhiễm** khắp thành phố. Bác Cú giới thiệu **robot Bíp** (giống Leanbot của các bé): Bíp chạy theo đường line, có tay gắp. Măng lập trình cho Bíp khoanh vùng, trung hòa, thu hồi, rồi về phòng đúng giờ. Boss là **Ngày hội robot**, giống một lượt thi AIROC. Kết thế giới: chợ phiên sắp mở, Bíp rủ Măng đi chợ (W7).
**Bé làm được sau thế giới:**
- đếm đúng số ngã tư cần đi (ngã tư đang đứng không tính) và dùng một lệnh `tiến 3 ô`;
- rẽ tại chỗ rồi mới tiến; "trái/phải" là của **Bíp**;
- dừng **đúng ô có khối** rồi gắp; tới đúng chỗ rồi thả; tay gắp giữ **một** khối;
- làm đủ ba việc AIROC: khoanh vùng, trung hòa đúng màu, thu hồi về phòng thí nghiệm;
- luôn cho Bíp **về phòng** ở cuối; biết Bíp chạy **hết lệnh** rồi mới chấm;
- tính giờ và **chọn việc nhiều điểm**, chọn **thứ tự** việc cho đường ngắn;
- (phần sau) dùng câu hỏi của robot trong `nếu … nếu không`, `lặp đến khi` để một chương trình chạy đúng khi đề đổi màu, đổi độ dài.

**Ngộ nhận nhắm tới:** "Tiến 3 là tính cả ngã tư đang đứng"; "Rẽ là vừa quay vừa đi"; "Bíp đi xuyên qua khối được"; "Gắp được khối ở xa"; "Tay gắp cầm được nhiều khối"; "Bíp tự dừng khi về tới phòng"; "Xong việc là xong, không cần về"; "Hết giờ là mất hết điểm"; "Làm hết mọi nhiệm vụ mới tốt" (boss, `l18`).
**Unplugged — "Robot băng keo":** dán băng keo thành lưới 3×4 trên sàn, chấm tròn ở mỗi ngã tư, một góc là "phòng thí nghiệm". Một bé làm Bíp, cầm cốc giấy làm tay gắp; bạn đọc thẻ lệnh "tiến 2 ô", "rẽ phải", "gắp", "thả". Vòng 1: đếm ngã tư (chỗ đang đứng không tính). Vòng 2: phải **đứng lên** chấm có khối gỗ mới gắp được, và chỉ cầm **một** khối; không được bước qua khối. Vòng 3: HLV bấm đồng hồ 60 giây, mỗi thẻ "tiến" tốn 5 giây; nhóm chọn việc nào làm trước để kịp về phòng.

**Quyết định riêng của W6:**
- **D13. Boss không dùng câu hỏi robot.** Boss là một lượt thi **không** đổi màu (nhẹ, 12 khối), thanh khối chỉ có lệnh đã học ở `l01`–`l10` (+ `lặp`). Đây là ngoại lệ có chủ ý của luật §7 "boss dùng mọi khối của kiểu game": ba câu hỏi robot (`l14`–`l16`) được ôn ở thử thách `l17`–`l19`, trong đó `l19` là lượt thi đầy đủ có đề đổi màu (20 khối). Lý do: màn thi quan trọng phải chơi được trước 17/10 dù các bé chưa xong W5 (HLV mở khóa W6 bằng tay, P3-06), và phạm vi cắt (H15) không được có khối xuất hiện lần đầu ở boss.
- **D14. `mustReturn` từ `l08`.** Sau bài sửa lỗi "về phòng" (`l08`), mọi màn `missions` đều bắt về phòng; màn `score` có 40 điểm về phòng.
- **D15. Không có mục tiêu ⭐ ở W6** (robotlab v1 không có `checkStarGoal`): đánh đổi nằm ở `par` (thứ tự việc, boss) và ở màn `score`.

**Bài giảng `w06-lesson` (6 thẻ, mỗi thẻ ≤ 12 chữ):**
1. "Về tới làng rồi! Bên kia đồi có tiếng bíp bíp." (nối truyện W5)
2. "Đây là robot Bíp. Bíp chạy theo đường line đen."
3. `demo` sa bàn `#####/L..../#####`, Bíp ở `1,4` nhìn `W`, chương trình `tiến 2`: "Tiến 2 ô: dừng ở ngã tư thứ 2."
4. `demo` cùng sa bàn, `tiến 4, tiến 1` → `crash:OFF_LINE@1,0`: "Bíp làm hết mọi lệnh, về tới phòng vẫn đi tiếp!"
5. `demo` sa bàn `####/L..#/##.#`, Bíp ở `2,2` nhìn `N`, `tiến 1, rẽ trái` → Bíp ở `1,2` nhìn `W`: "Tiến 1 ô, rẽ trái: Bíp quay tại chỗ, chưa đi."
6. `quiz` "Bíp đứng ở ngã tư. Tiến 1 ô thì Bíp tới đâu?": **Ngã tư kế bên** / Ngã tư thứ hai.

| # | ID | Chặng | Kind | Mode | Ý chính | Nhiệm vụ | Khối | maxBlocks | par (dự kiến) | parEdits | Mục tiêu ⭐ |
|---|---|---|---|---|---|---|---|---:|---:|---:|---|
| — | `w06-lesson` | (bài giảng) | — | — | Bíp, ngã tư, chạy hết lệnh, rẽ như Măng | — | — | — | — | — | · |
| 1 | `w06-l01` | guided | robotlab | build | Lệnh **tiến … ô**: một lệnh đi nhiều ngã tư | Đưa Bíp về phòng thí nghiệm. | tiến | — | 1 | — | · |
| 2 | `w06-l02` | guided | robotlab | predict | Đếm ngã tư: chỗ đang đứng **không tính** | Bíp dừng ở ngã tư nào? Đoán xem! | (chỉ xem) | — | — | — | · |
| 3 | `w06-l03` | guided | robotlab | build | **Rẽ** như mê cung: quay tại chỗ, rồi mới tiến | Đường về có khúc rẽ. Đưa Bíp về! | tiến, rẽ trái, rẽ phải | — | 3 | — | · |
| 4 | `w06-l04` | guided | robotlab | parsons | Hai khúc rẽ: thứ tự rẽ và tiến | Lắp lại đường về cho Bíp nhé. | tiến, rẽ trái, rẽ phải | — | 5 | — | · |
| 5 | `w06-l05` | practice | robotlab | parsons | Lệnh **gắp**: dừng **đúng ô có khối** rồi gắp (đổi từ build khi soạn, xem Ghi chú) | Rào đổ chắn đường. Gắp lên rồi về! | tiến, gắp | — | 3 | — | · |
| 6 | `w06-l06` | practice | robotlab | build | Lệnh **thả** + **thu hồi**: đứng trong phòng rồi thả | Mang khối ô nhiễm vào phòng thí nghiệm. | tiến, rẽ trái, rẽ phải, gắp, thả, lặp | 8 | 6 | — | · |
| 7 | `w06-l07` | practice | robotlab | build | **Khoanh vùng**: đứng **trên** ô vùng rồi thả rào | Đặt rào khoanh vùng ô nhiễm. | tiến, rẽ trái, rẽ phải, gắp, thả | 8 | 6 | — | · |
| 8 | `w06-l08` | practice | robotlab | bughunt | **Về phòng** ở cuối: Bíp chấm khi hết lệnh (từ đây `mustReturn`, D14) | Bíp quên về phòng. Sửa giúp nhé! | tiến, rẽ trái, rẽ phải, gắp, thả | — | 7 | 1 | · |
| 9 | `w06-l09` | practice | robotlab | build | **Trung hòa**: khối trung hòa vào trạm **cùng màu**; có trạm nhử | Chở khối trung hòa đỏ tới trạm đỏ. | tiến, rẽ trái, rẽ phải, gắp, thả | 9 | 7 | — | · |
| 10 | `w06-l10` | practice | robotlab | parsons | Tay gắp giữ **một** khối: thả xong mới gắp khối sau | Hai khối ô nhiễm, một tay gắp. Xếp lại nhé! | tiến, rẽ phải, gắp, thả, lặp | — | 7 | — | · |
| 11 | `w06-l11` | practice | robotlab | predict | **Đồng hồ và điểm**: hết giờ thì dừng, việc đã xong vẫn có điểm | Hết giờ thì Bíp được mấy điểm? | (chỉ xem) | — | — | — | · |
| 12 | `w06-l12` | practice | robotlab | build | **Chọn việc**: chỉ đủ giờ cho một việc rồi về (`score` 200, 20 s) | Chỉ đủ giờ cho một việc. Chọn việc nào? | tiến, rẽ trái, rẽ phải, gắp, thả, lặp | 9 | 7 | — | · |
| 13 | `w06-l13` | practice | robotlab | bughunt | Quên về phòng nên thiếu 40 điểm (`score` 200, 20 s) | Bíp làm giỏi mà thiếu điểm. Sửa nhé! | tiến, rẽ trái, rẽ phải, gắp, thả, lặp | — | 7 | 1 | · |
| 14 | `w06-l14` | practice | robotlab | build | Câu hỏi **đã về phòng thí nghiệm?** trong `lặp đến khi` (2 bản đồ); `tiến 6 ô` đi quá ở bản đồ ngắn | Đường về dài ngắn khác nhau. Về phòng nào! | tiến, lặp, lặp đến khi, đã về phòng thí nghiệm? | 4 | 3 | — | · |
| 15 | `w06-l15` | practice | robotlab | parsons | Câu hỏi **phía trước có line?**: hết line thì rẽ | Đường về khúc khuỷu. Lắp chương trình dò line! | tiến, rẽ trái, lặp đến khi, nếu…nếu không, phía trước có line?, đã về phòng thí nghiệm? | — | 6 | — | · |
| 16 | `w06-l16` | practice | robotlab | build | Câu hỏi **khối ở chỗ Bíp màu …?**: đề đổi màu, nhìn rồi chọn trạm (2 bản đồ) | Khối trung hòa đổi màu mỗi lần. Chở đúng trạm! | tiến, rẽ trái, rẽ phải, thả, nếu, nếu…nếu không, khối ở chỗ Bíp màu? | 10 | 9 | — | · |
| 17 | `w06-l17` | challenge | robotlab | bughunt | Câu hỏi màu ngược với nhánh: sửa ô chọn màu (2 bản đồ) | Bíp chở nhầm trạm. Sửa giúp nhé! | như màn 16 | — | 9 | 1 | · |
| 18 | `w06-l18` | challenge | robotlab | predict | "Làm hết mọi việc" thì hết giờ giữa đường, mất cả điểm về phòng | Làm hết mọi việc có kịp không? | (chỉ xem) | — | — | — | · |
| 19 | `w06-l19` | challenge | robotlab | build | **Lượt thi đầy đủ**: đề đổi màu (2 bản đồ), thu hồi + trung hòa + về phòng trong 34 s (`score` 300); khoanh vùng là bẫy | Lượt thi thật: đủ 300 điểm trong 34 giây! | mọi lệnh robot đã học + lặp, nếu, nếu…nếu không, lặp đến khi | 22 | 20 | — | · |
| 20 | `w06-boss` | boss | robotlab | build | **"Ngày hội robot"**: chọn việc + chọn **thứ tự** + về phòng trong 30 s (`score` 300), không đổi màu (D13) | Ngày hội robot: đủ 300 điểm trong 30 giây! | tiến, rẽ trái, rẽ phải, gắp, thả, lặp | 14 | 12 | — | · |
| ✦ | `w06-exam` | challenge | robotlab | creative | **Thi thử** (P3-08): 2 lượt × 120 s trên Thành Phố Măng, lượt tốt nhất được tính, "Đề mới" đổi chỗ khối (§6.1.1) | Thi thử ở Thành Phố Măng. Bíp sẵn sàng! | như màn sáng tạo | — | — | — | · |
| ✦ | `w06-creative` | creative | robotlab | creative | Sa bàn tập Thành Phố Măng 9×7 (§6.1.1; bản đầu 7×7), đủ 3 việc, tự chọn chiến thuật | Sa bàn tập: tự đặt chiến thuật cho Bíp! | mọi lệnh robot đã học (không có `đang gắp khối?`) + điều khiển | — | — | — | · |

Chặng: 4 guided · 12 practice · 3 challenge · 1 boss. Mode (sau khi soạn): build 10 (kể cả boss) · parsons 4 · predict 3 · bughunt 3; build liền nhau nhiều nhất 2. **Thứ tự theo mức quan trọng cho kỳ thi:** lệnh cơ bản (`l01`–`l07`) → thói quen thi không cần câu hỏi (`l08` về phòng, `l09` trung hòa, `l10` một tay gắp, `l11`–`l13` giờ, điểm, chọn việc) → câu hỏi robot W4/W5 (`l14`–`l16`) → thử thách → boss.

Khối mới và nơi xuất hiện lần đầu (luật 7):
- `tiến … ô` ở `l01` (`toolbox:robot_forward`, gợi ý "Lệnh mới! Tiến 3 ô: dừng ở ngã tư thứ 3." đúng từng chữ tooltip, không đổi theo số của màn); `rẽ trái` / `rẽ phải` ở `l03` (`toolbox:`, gợi ý "Rẽ phải: quay sang phải tại chỗ, chưa đi.");
- `gắp` ở `l05`, `thả` ở `l06` (`toolbox:`);
- `đã về phòng thí nghiệm?` ở `l14` (`toolbox:`); `phía trước có line?` ở `l15` (parsons, `block:robot_line_ahead`); `khối ở chỗ Bíp màu …?` ở `l16` (`toolbox:`).
- `đang gắp khối?` (`robot_holding`) **không** nằm trong thanh khối màn nào từ `l01` tới boss và cũng không ở màn sáng tạo (luật 7 báo lỗi khi khối xuất hiện lần đầu ở `creative`; ghi chú khi soạn). W7 giới thiệu nó khi đếm (§6.2).
- Ba việc AIROC, đồng hồ và điểm là **luật**, không phải khối; mỗi thứ có bài ngắn trước màn đầu tiên (như chìa khóa W4, T20).

**Thanh khối:** `tiến` để sẵn số 1 (bé tự đổi). Có `lặp` từ `l06`. `maxLoopDepth: 1` mọi màn có vòng lặp. `l14` đặt `maxInstances: { cq_repeat: 1 }`. Màn có vòng lặp khai báo `feedback.TIMEOUT` và gợi ý `OUT_OF_TIME` riêng cho vòng lặp (`game-kinds.md` §3.3).

**Bài "Khối mới" và bài luật** (3–5 thẻ, `beforeLevel`; thẻ `demo` cho thấy Bíp **dừng ở ngã tư nào** / khối nằm ở đâu; thẻ cuối `quiz`; mỗi thẻ ≤ 12 chữ):
- `w06-lesson-tien` trước `l01`: "Lệnh mới! Tiến 3 ô: dừng ở ngã tư thứ 3." · demo `tiến 3` trên `######/L...../######` (Bíp ở `1,5`, nhìn `W`) dừng ở `1,2` · demo `tiến 1, tiến 1, tiến 1` cùng chỗ dừng: "Ba lệnh tiến 1 ô bằng một lệnh tiến 3 ô." · quiz "Tiến 2 ô: Bíp dừng ở đâu?".
- `w06-lesson-gap` trước `l05`: "Lệnh mới! Gắp khối ở chỗ Bíp đứng. Bíp đứng yên." · "Bíp không đi xuyên qua khối." · "Muốn gắp thì dừng đúng ô có khối." · demo `tiến 4` đụng khối (`crash:HIT_BLOCK@1,3`) · demo `tiến 2, gắp` · quiz "Khối cách 4 ngã tư. Tiến mấy ô rồi gắp?": **4** / 3 (không trùng số của `l05`).
- `w06-lesson-tha` trước `l06`: "Lệnh mới! Thả khối xuống chỗ Bíp đứng." · demo thả trên ngã tư trống · demo đứng trong phòng thả khối ô nhiễm: "Thả trong phòng thí nghiệm là thu hồi!" · quiz.
- `w06-lesson-khoanh-vung` trước `l07`: "Vùng ô nhiễm có viền đỏ. Đứng lên vùng rồi thả rào." · demo đúng · demo thả cạnh vùng (`MISSIONS_LEFT`) · quiz.
- `w06-lesson-trung-hoa` trước `l09`: "Khối trung hòa phải vào trạm cùng màu." · demo đúng màu · demo sai màu (`WRONG_COLOR`) · quiz.
- `w06-lesson-dong-ho` trước `l11` (bản sửa theo review): "Mỗi lệnh tốn vài giây tập. Hết giờ, Bíp dừng." · "Tiến 1 ô: 2 giây. Rẽ: 1 giây. Gắp, thả: 2 giây." · "Trung hòa 160, thu hồi 100, khoanh vùng 45, về 40." (test so với `shared/robotlab.json`) · demo Bíp cầm khối ô nhiễm, `timeLimit` 7: `tiến 2, thả, rẽ phải, rẽ phải, tiến 1` → hết giờ ở lệnh rẽ thứ hai, trong phòng: `score:140` "Hết giờ lúc Bíp đang quay: thu hồi 100, ở phòng 40." (số khác `l11`, bé vẫn phải đếm ở `l11`) · quiz "Hết giờ. Việc đã xong có được điểm không?": **Có** / Không.
- `w06-lesson-ve-phong-chua` trước `l14`: "Câu hỏi mới: đã về phòng thí nghiệm?" · "Đúng khi Bíp đứng ở phòng, sai khi chưa." · demo `lặp đến khi đã về phòng thí nghiệm? {tiến 1}` trên đường dài · demo cùng chương trình khi Bíp **đang ở** phòng: chạy 0 vòng · quiz.
- `w06-lesson-co-line` trước `l15`: "Câu hỏi mới: phía trước có line? Có thì đúng." · ba demo: ngã tư (đúng), mép sa bàn (sai), nhà (sai); lời giải thích quiz không nói trước hai nhánh của `l15` · quiz.
- `w06-lesson-mau` trước `l16`: "Câu hỏi mới: khối ở chỗ Bíp màu gì?" · "Khối ở chỗ Bíp: khối Bíp đang cầm, hoặc nằm dưới Bíp." · demo Bíp cầm khối đỏ: ✔ đỏ, ✘ vàng · quiz.

Chi tiết từng màn (sa bàn → lời giải dự kiến → kết quả tính tay; giờ chỉ ghi khi màn có `timeLimit` nhỏ):
1. `l01` `#####/L..../#####`, Bíp ở `1,4` nhìn `W` (`start`), `missions` + `mustReturn`, không có việc khác. Lời giải `tiến 4` (1 khối). `tiến 1` × 4 cũng thắng (chỉ ⭐). Gợi ý `enter` "Lệnh mới! Tiến 3 ô: dừng ở ngã tư thứ 3." (đúng từng chữ tooltip, không nói lời giải); `NOT_HOME` "Đếm lại ngã tư. Chỗ đang đứng không tính."; `OFF_LINE` "Bíp đi quá phòng rồi. Bớt 1 ô nhé!".
2. `l02` `######/L...../######`, Bíp ở `1,5` nhìn `W`. Chương trình `tiến 4` → `stop@1,1`. Thẻ: **Ngay trước phòng thí nghiệm** ✔ · Trong phòng thí nghiệm (`win`) · Cách phòng 2 ngã tư (`stop@1,2`, ngộ nhận "chỗ đang đứng là 1"). Gợi ý `idle`: "Chỉ tay theo từng ngã tư, đếm từ ngã tư kế bên."
3. `l03` `#L##/#.##/#...`, Bíp ở `2,3` nhìn `W`. Lời giải `tiến 2, rẽ phải, tiến 2` (3). Ngộ nhận "rẽ là đi": `tiến 2, rẽ phải, tiến 1` → `NOT_HOME@1,1`. Gợi ý `enter` "Rẽ phải: quay sang phải tại chỗ, chưa đi."; `OFF_LINE` "Bíp đang nhìn hướng nào? Rẽ đúng phía chưa?".
4. `l04` `L..##/##.##/##...`, Bíp ở `2,4` nhìn `W`. Khối xáo trộn của `tiến 2, rẽ phải, tiến 2, rẽ trái, tiến 2` (5). Đổi chỗ hai lệnh rẽ → `crash:OFF_LINE@2,2`. Gợi ý `enter` "Khúc rẽ thứ nhất: Bíp nhìn bên nào?".
5. `l05` `#####/L..../#####`, Bíp ở `1,4` nhìn `W`, `rào@1,2`, `mustReturn`. Lời giải `tiến 2, gắp, tiến 2` (3; dừng **trên** rào, gắp, về phòng, tay còn cầm rào: được). `tiến 4` → `crash:HIT_BLOCK@1,3` (rào chưa phải ngã tư cuối). `tiến 1, gắp` → `crash:NOTHING_TO_GRAB@1,3`. Gợi ý `enter` "Lệnh mới! Gắp khối ở chỗ Bíp đứng."; `HIT_BLOCK` "Bíp không đi xuyên qua khối. Dừng đúng ô, hoặc đi vòng."
6. `l06` `#####/L..../#####`, Bíp ở `L` nhìn `E`, `ON đỏ@1,3`, `missions`. Lời giải `tiến 3, gắp, rẽ phải ×2, tiến 3, thả` (6; kết thúc trong phòng). Thả trước khi về (`…, gắp, thả`) → khối nằm ở `1,3`, `MISSIONS_LEFT`; về phòng mà quên thả → `MISSIONS_LEFT`. Gợi ý `enter` "Lệnh mới! Thả khối xuống chỗ Bíp đứng."; `MISSIONS_LEFT` "Khối ô nhiễm đã vào phòng chưa? Đứng trong phòng rồi thả."
7. `l07` `###Z#/L..../#####`, Bíp ở `L` nhìn `E`, `rào@1,2`, `missions` (chưa `mustReturn`). Lời giải `tiến 2, gắp, tiến 1, rẽ trái, tiến 1, thả` (6; rào lên `0,3`). Ngộ nhận "thả cạnh vùng": `tiến 2, gắp, tiến 1, thả` → rào ở `1,3`, `MISSIONS_LEFT`. `tiến 3` → `crash:HIT_BLOCK@1,1`. Gợi ý `MISSIONS_LEFT` "Vùng có viền đỏ có rào chưa? Đứng lên vùng rồi thả."
8. `l08` `#####/LZ.../#####`, Bíp ở `L` nhìn `E`, `rào@1,3`, `mustReturn`. Ban đầu `tiến 3, gắp, rẽ phải ×2, tiến 2, thả` → khoanh vùng xong ở `1,1`, `incomplete` / `NOT_HOME`. Sửa 1 thao tác: thêm `tiến 1` (về `L`). Sửa khác: `tiến 2` → `tiến 3` rồi thả rào trong phòng → `WRONG_PLACE`. Gợi ý `enter` chỉ nút Từng bước; `NOT_HOME` "Bíp chạy hết lệnh mới chấm. Lệnh cuối đưa Bíp về đâu?".
9. `l09` `#####/L.r.y/#####`, Bíp ở `L` nhìn `E`, `TH đỏ@1,3`, `mustReturn`. Lời giải `tiến 3, gắp, rẽ phải ×2, tiến 1, thả, tiến 2` (7; đi qua trạm đỏ trống, dừng trên khối, quay lại trạm đỏ, thả, về). Mang sang trạm vàng (`…, gắp, tiến 1, thả`) → `crash:WRONG_COLOR@1,4`. Gợi ý `enter` "Trạm nào cùng màu với khối?".
10. `l10` `###/.L./###`, Bíp ở `L` nhìn `E`, `ON đỏ@1,2`, `ON đỏ@1,0`, `mustReturn`. Khối xáo trộn của `lặp 2 {tiến 1, gắp, rẽ phải ×2, tiến 1, thả}` (7: vòng 1 lấy khối bên phải, vòng 2 lấy khối bên trái, mỗi vòng kết thúc trong phòng). Để `thả` ra ngoài vòng lặp → vòng 2 Bíp cầm khối đi vào ô có khối → `crash:HIT_BLOCK@1,1`. Gợi ý `enter` "Tay gắp chỉ giữ một khối. Thả xong mới gắp tiếp."
11. `l11` `#####/L...r/#####`, Bíp ở `L` nhìn `E`, `TH đỏ@1,2`, `score` 200, `timeLimit` 14. Chương trình `tiến 2, gắp, tiến 2, thả, rẽ phải ×2, tiến 4`: dừng trên khối 4 s, gắp 6 s, tới trạm 10 s, thả 12 s (trung hòa xong), rẽ 13 s, 14 s; ngã tư kế cần 16 s > 14 → `timeUp`, Bíp ở `1,4` → `score:160`. Thẻ: **160 điểm, hết giờ ở trạm** ✔ · 200 điểm, về kịp phòng (`score:200`) · 0 điểm (`score:0`, ngộ nhận "hết giờ là mất hết"). Khớp quiz bài `w06-lesson-dong-ho` (việc đã xong vẫn có điểm).
12. `l12` `##r##/Z#.##/..L##`, Bíp ở `L` nhìn `N`, `TH đỏ@1,2`, `rào@2,0`, `score` 200, `timeLimit` 20. Lời giải `tiến 1, gắp, tiến 1, thả, rẽ phải ×2, tiến 2` (7 khối, 14 s, 160 + 40). Khoanh vùng + về: 85 điểm, 21 s. Trung hòa, về, rồi đi khoanh vùng → tới rào lúc 19 s, gắp cần 21 s > 20 → hết giờ ở `2,0`, 160 < 200. Gợi ý `enter` "Việc nào nhiều điểm? Còn đủ giờ về phòng không?"; `LOW_SCORE` "Đếm giây từng việc. Bỏ bớt việc ít điểm nhé."
13. `l13` `#####/L.y../#####`, Bíp ở `L` nhìn `E`, `TH vàng@1,3`, `score` 200, `timeLimit` 20. Ban đầu `tiến 3, gắp, rẽ phải ×2, tiến 1, thả` → trung hòa xong ở `1,2` lúc 14 s, 160 điểm, `LOW_SCORE`. Sửa 1 thao tác: thêm `tiến 2` (về phòng lúc 18 s, 200). Gợi ý `LOW_SCORE` "Đủ việc rồi. Còn 40 điểm ở đâu nhỉ?".
14. `l14` bản đồ 1 `#######/L....../#######` (Bíp ở `1,6`), bản đồ 2 `####/L.../####` (Bíp ở `1,3`), nhìn `W`, `mustReturn`. Lời giải `lặp đến khi đã về phòng thí nghiệm? {tiến 1}` (3). `tiến 6` / `lặp 6 {tiến 1}`: thắng bản đồ 1, bản đồ 2 đi quá phòng → `crash:OFF_LINE@1,0` (không có thắng giữa chừng). Gợi ý `enter` "Câu hỏi mới: đã về phòng thí nghiệm?"; `OFF_LINE` "Bíp đi quá phòng. Hỏi đã về chưa, trước mỗi bước."
15. `l15` `L.../###./#...`, Bíp ở `2,1` nhìn `E`, `mustReturn`. Khối xáo trộn của `lặp đến khi đã về phòng thí nghiệm? {nếu phía trước có line? {tiến 1} nếu không {rẽ trái}}` (6; rẽ ở `2,3` và `0,3`). Đổi hai nhánh → vòng đầu rẽ sang nhà rồi tiến vào nhà: `crash:OFF_LINE@2,1`. Gợi ý `enter` "Câu hỏi mới: phía trước có line? Có line thì tiến."
16. `l16` `#####/r.L.y/#####`, Bíp ở `L` nhìn `N`, bản đồ 1 `cầm TH đỏ`, bản đồ 2 `cầm TH vàng`, `mustReturn`. Lời giải `nếu khối ở chỗ Bíp màu đỏ? {rẽ trái} nếu không {rẽ phải}, tiến 2, thả, rẽ phải ×2, tiến 2` (9; `thả` và đường về nằm **sau** `nếu`, dùng chung cho hai màu). Dạng một nhánh (`rẽ phải, nếu … đỏ? {rẽ phải ×2}`) tốn 10. Chương trình không hỏi chỉ thắng một bản đồ (`WRONG_COLOR` ở bản đồ kia). Gợi ý `enter` "Câu hỏi mới: khối ở chỗ Bíp màu gì?".
17. `l17` sa bàn và bản đồ của `l16`. Ban đầu: lời giải `l16` nhưng hai nhánh đổi chỗ (`đỏ → rẽ phải`) → `crash:WRONG_COLOR@1,4` ở bản đồ 1. Sửa 1 thao tác: ô chọn màu `đỏ → vàng` (đổi chỗ hai lệnh rẽ cũng thắng, 2 thao tác). Gợi ý tầng 1 "Khối đỏ đi nhánh nào? Trạm đỏ ở bên nào của Bíp?".
18. `l18` sa bàn `l12`. Chương trình = lời giải `l12` + `rẽ phải, tiến 2, gắp, rẽ phải, tiến 1, thả, rẽ phải ×2, tiến 1, rẽ trái, tiến 2` (đi khoanh vùng). Về phòng lúc 14 s, rời phòng, dừng trên rào lúc 19 s, gắp cần 21 s > 20 → hết giờ ở `2,0`: `score:160`. Thẻ: **160 điểm** ✔ · 245 điểm (làm hết, ngộ nhận) · 200 điểm ("về rồi là có 40").
19. `l19` `##.##/r.L.y/Z....`, Bíp ở `L` nhìn `N`, `ON đỏ@0,2`, bản đồ 1 `TH đỏ@2,2`, bản đồ 2 `TH vàng@2,2`, cả hai `rào@2,4`; `score` 300, `timeLimit` 34. Lời giải `tiến 1, gắp, rẽ phải ×2, tiến 1, thả` (thu hồi, 10 s, Bíp trong phòng nhìn `S`) `, tiến 1, gắp, rẽ phải ×2, tiến 1` (lấy khối trung hòa, 18 s, nhìn `N`) `, nếu khối ở chỗ Bíp màu đỏ? {rẽ trái} nếu không {rẽ phải}, tiến 2, thả, rẽ phải ×2, tiến 2` (31 s): 100 + 160 + 40 = 300, 20 khối. Khoanh vùng (rào ở `2,4` → vùng `2,0`) tốn hơn 20 s cho 45 điểm: làm thêm là hết giờ ngoài phòng.
20. `boss` `##Z##/r.L../##.##`, Bíp ở `L` nhìn `W`, `TH đỏ@1,1`, `ON đỏ@1,4`, `rào@2,2`, `score` 300, `timeLimit` 30, một bản đồ.
    - Lời giải `tiến 1, gắp, tiến 1, thả` (trung hòa ở trạm `1,0`, 8 s) `, rẽ phải ×2, tiến 4` (đi qua phòng, dừng trên khối ô nhiễm, 18 s) `, gắp, rẽ phải ×2, tiến 2, thả` (thu hồi trong phòng, 28 s): 160 + 100 + 40 = 300, **12 khối**.
    - **Thứ tự**: thu hồi trước rồi trung hòa (`rẽ phải ×2, tiến 2, gắp, rẽ phải ×2, tiến 2, thả, tiến 1, gắp, tiến 1, thả, rẽ phải ×2, tiến 2`) cũng 300, vừa đúng 30 s, nhưng 15 khối > `maxBlocks` 14 nên **bị chặn** (`TOO_MANY_BLOCKS`, câu riêng của màn "Nhiều lệnh quá. Đổi thứ tự việc thử xem!"); engine tính lại ở P3-01a: 30 s, không phải 28 s.
    - **Bẫy "làm hết":** khoanh vùng (rào `2,2` → vùng `0,2`) tốn khoảng 17 s cho 45 điểm. Trung hòa + khoanh vùng + về = 245 < 300; thu hồi + khoanh vùng + về = 185. Chỉ "trung hòa + thu hồi + về" đạt 300. Câu kết boss: "Không cần làm hết. Chọn đúng việc, về đúng giờ!".
- `w06-creative`: sa bàn 7×7 kiểu đề thi, đủ 3 loại việc, `score` không chấm, đồng hồ 120 s chạy thật, thanh khối đủ mọi lệnh. Dòng ghi "Sa bàn tập, gần giống đề thi" (`airoc-2026.md` §4).

**Gợi ý tầng 0 chung cho W6** (ngoài từng màn): `OFF_LINE` "Bíp đang nhìn hướng nào? Đếm lại ngã tư nhé."; `HIT_BLOCK` "Bíp không đi xuyên qua khối. Dừng đúng ô, hoặc đi vòng." (không bảo gắp lên, vì khối đó có thể là việc đã xong); `HANDS_FULL` "Tay gắp chỉ giữ một khối. Thả xong mới gắp tiếp."; `NOT_HOME` "Lệnh cuối cùng đưa Bíp về phòng chưa?"; `OUT_OF_TIME` "Đường nào ngắn hơn? Bớt rẽ thừa nhé." (màn có vòng lặp: câu vòng lặp ở `game-kinds.md` §3.3). Không câu nào nói "ô số N".

**Truyện chia chương** (`world.json` `chapters`, P2-24; mỗi dòng ≤ 12 chữ; `art.prop` cần thêm `robot` và `lab` vào `STORY_PROPS`, P3-04; các chương mở ở màn nằm trong phạm vi cắt H15):
1. `ve-lang` "Về tới làng" (mở đầu): "Về tới làng rồi! Bên kia đồi có tiếng bíp bíp." · "Bác Cú mở thêm phòng thí nghiệm ở Thành Phố Robot." · "Gió thổi khối ô nhiễm khắp thành phố!" (`cast: owl, bunny`, `prop: lab`)
2. `bip-hoc-viec` "Bíp học việc" (sau `l04`; bài mở đầu đã giới thiệu Bíp): "Bíp đếm ngã tư giỏi rồi. Bác Cú khen!" · "Giờ Bíp học dùng tay gắp." (`cast: owl`, `prop: robot`)
3. `tay-gap` "Tay gắp của Bíp" (sau `l10`): "Bíp gắp từng khối một, không tham." · "Khoanh vùng, trung hòa, thu hồi: ba việc của Bíp." (`prop: robot`)
4. `dong-ho` "Đồng hồ thành phố" (sau `l13`): "Mỗi việc tốn vài giây." · "Đồng hồ chạy rồi! Bíp phải nhanh tay." (không lộ bẫy chọn việc) · "Ngày hội robot sắp bắt đầu!" (`cast: owl`, `prop: lab`)
5. `thanh-pho-sach` "Thành phố sạch rồi" (sau `boss`): "Bíp về phòng đúng giờ. Cả thành phố vỗ tay!" · "Chợ phiên sắp mở. Bíp rủ Măng đi chợ!" (`cast: bunny`, `prop: robot`)

`theme.scene` mới `thanh-pho-robot` (kiểu P2-23: nền thành phố pixel, sa bàn màu giấy, line đen, nhà khối hộp).

**Phạm vi cắt nếu trễ** (câu H15, `phase-3.md`): `w06-lesson` + các bài trước `l01`–`l13` + `l01`–`l13` + boss (D13: boss không có câu hỏi, không đổi màu, mọi lệnh của boss đã có từ `l01`–`l10`). Thêm sau: `l14`–`l19`, ba bài câu hỏi, màn sáng tạo. Truyện 5 chương vẫn đủ (chương mở ở `l04`, `l10`, `l13`, boss).

Ghi chú khi soạn (P3-04, 08/10/2026; **🟨 nháp, chờ HLV chơi thử**, chưa qua review sư phạm độc lập):
- `content:check` xanh, không cảnh báo. `npm run par` từng màn (một việc mỗi lúc, `NODE_OPTIONS=--max-old-space-size=2048`):
  - build: `l01` 1 (1 cách), `l03` 3 (1), `l06` 6 (26 cách, gồm `lặp 2 {rẽ trái}`), `l07` 6 (1), `l09` 7 (6), `l12` 7 (14), `l14` 3 (2), boss 12 (1696 cách, `--budget 300000000`, 5 s; gồm cách lặp mà hết giờ khi đã đủ 300 điểm ở phòng, vẫn 12 khối);
  - bughunt: `l08` 7 / sửa 1 (1 cách), `l13` 7 / sửa 1 (1), `l17` sửa 1 (1 cách: đổi màu `đỏ → vàng`);
  - ghép hình: `l04` 1 cách thắng / 20, `l05` 1 / 3, `l15` 1 / 12, `l10` ⚠ **3** / 3780 (ghi dưới);
  - `l16`, `l17` **par 9 đã chứng minh** (npm run par báo ⚠ chỉ vì dừng giữa cỡ 9): vét cạn **xong** mọi chương trình ≤ 8 khối (không gì thắng), rồi dừng ở cỡ 9 vì trần 1 000 000 trạng thái nhiều bản đồ của vét cạn (`MAX_TUPLE_STATES`, không chỉnh bằng `--budget`). Lời giải 9 khối thắng, nên `par` 9 đúng.
  - ⚠ `l19`: chỉ xong ≤ 7 khối rồi chạm cùng trần đó (14 s). **Giữ `par` 20 tính tay** (như `w03-boss`); test kiểm lời giải 300 điểm cả 2 đề.
- **Sửa so với bảng nháp:**
  - `l05` **build → parsons** (khối `tiến 2, gắp, tiến 2`). Vét cạn tìm `tiến 2, tiến 2` (2 khối) thắng bản nháp: Bíp được **dừng trên** khối (ngã tư cuối, tay trống) rồi **đi tiếp ra khỏi** ô đó (đúng luật §3.3), nên không màn chỉ có `gắp` (không có `thả`) nào ép được phải gắp. Ở ghép hình, mọi lệnh phải chạy: chỉ một cách thắng, `gắp` đặt sai chỗ ra `NOTHING_TO_GRAB`. Bẫy `tiến 4` → `HIT_BLOCK` vẫn có trong demo bài `w06-lesson-gap` và ở `l07`. Lưu ý chung: rào trên đường chỉ bắt **dừng**, không bắt gắp.
  - `l10` ⚠ 3 cách ghép thắng: `gắp` đổi chỗ được với hai lệnh `rẽ phải` (rẽ không đi). Cả 3 đều thả **trong** vòng lặp (ý của màn), nên chấp nhận như W5 `l16`.
  - `w06-lesson-gap`: demo dùng sa bàn 6 cột (rào ở `1,2`, Bíp ở `1,5`) để không lộ lời giải `l05`.
  - `w06-creative`: `score` 300 (một lượt thi); từ P3-08 dùng sa bàn Thành Phố Măng 9×7 (§6.1.1). **Không** có `đang gắp khối?` trong thanh khối: luật 7 báo lỗi khi khối xuất hiện lần đầu ở màn `creative` (bảng trên ghi "luật 7 không áp dụng" là sai). Có `lặp`, `lặp đến khi`, `nếu`, `nếu … nếu không` và 3 câu hỏi đã học. Sa bàn 7×7: 2 ô vùng, 3 trạm, 3 khối trung hòa, 2 khối ô nhiễm, 2 rào; đồng hồ 120 s.
  - Bài: `w06-lesson` + 9 bài trước màn = **10** bài (phase-3 ghi 11; §6.1 chỉ liệt kê 9 bài trước màn).
- **Chữ:** gợi ý `enter` của lệnh mới là "Lệnh mới! " + tooltip; riêng `l03` hai gợi ý "Lệnh mới! Rẽ trái: quay sang trái tại chỗ, chưa đi." / "… Rẽ phải: …" (thêm nhãn trước tooltip để luật 7 thấy tên lệnh). Câu hỏi mới dùng "Câu hỏi mới: …" như bảng. Chữ cho bé gọi code là "lệnh"; "khối" chỉ là khối thi đấu.
- **Review độc lập (08/10/2026, REVISE), đã sửa:**
  - Bé được biết giây và điểm: bài `w06-lesson-dong-ho` có hai thẻ số ("giây tập"), demo đổi sang 140 điểm.
  - Thứ tự việc khác bị **giới hạn lệnh** chặn, không phải "chỉ mất ⭐": boss "thu hồi trước" 15 > 14; `l19` "trung hòa trước" thắng cả hai bản đồ với 29 lệnh > 22 (cần thêm một `nếu` để quay về hướng bắc sau khi thả). Hai màn có `feedback.TOO_MANY_BLOCKS` "Nhiều lệnh quá. Đổi thứ tự việc thử xem!"; test chạy màn thật (kể cả `maxBlocks`).
  - "khối" cho code: mọi màn (trừ đoán) ghi đè `EMPTY_PROGRAM` "Con chưa ghép lệnh nào. Kéo lệnh vào đây nhé!"; màn có `maxBlocks` `TOO_MANY_BLOCKS` "Nhiều lệnh quá. Thử dùng lệnh lặp xem?"; ghép hình `LOOSE_BLOCKS` "Còn lệnh chưa ghép. Ghép hết vào nhé!", `UNUSED_BLOCKS` "Còn chỗ trống, hoặc lệnh chưa chạy. Ghép lại nhé!"; màn có `nếu` / `lặp đến khi` `EMPTY_CONDITION` "Ô câu hỏi còn trống. Cắm một câu hỏi vào nhé!". Schema không có ghi đè cấp thế giới. Chữ chung trong `vi.ts` vẫn nói "khối" (câu H19).
  - Rẽ có demo chạy được (thẻ 5 bài mở đầu). Gắp / thả: thẻ đầu thêm "Bíp đứng yên". Câu hỏi mới có câu luật (tooltip) trong bài.
  - `l10` thêm gợi ý `MISSIONS_LEFT` "Lặp 2 lần: mỗi vòng thu hồi một khối."; `l19` thêm gợi ý `WRONG_COLOR`; `l17`, `l18` có `misconception`; màn 2 bản đồ đều nói "2 bản đồ"; màn sáng tạo `score` 300.
  - Truyện: bác Cú (chủ xưởng ở làng) mở thêm phòng thí nghiệm; chương 2 đổi thành `bip-hoc-viec` (bài mở đầu đã giới thiệu Bíp); chương 4 không lộ bẫy chọn việc. Hoạt động unplugged thêm: "Robot thật dừng trước khối rồi đóng càng".
  - `l18` giữ chương trình đầy đủ (chưa bỏ phần đầu: khối không được đặt sẵn trên trạm, schema).
- **`HIT_BLOCK` khi đang cầm khối** (review code): câu chung "Bíp không đi xuyên qua khối" sai khi Bíp cầm khối mà muốn dừng lên khối khác. `l10` (chỉ xảy ra trường hợp này) ghi đè `feedback.HIT_BLOCK` = "Tay đang cầm khối. Thả xong mới tới khối khác."; `l19`, boss (cầm khối rồi đi lấy khối sau) có gợi ý `HIT_BLOCK` "Tay đang cầm khối? Thả xong mới tới khối khác." (dạng câu hỏi, vẫn đúng khi tay trống).
- Màn có vòng lặp: gợi ý `OUT_OF_TIME` "Hết giờ khi đang lặp. Vòng lặp có dừng không?". `feedback.TIMEOUT` "Bíp hỏi mãi mà không làm gì. Vòng lặp không dừng!" chỉ ở màn có câu hỏi (`l14`, `l15`, `l19`, sáng tạo); màn chỉ có lệnh hành động thì vòng lặp hết giờ trước.
- Test `tools/content-check/src/w06.test.ts`: demo từng bài (ô Bíp dừng), đáp án 3 màn đoán, ghép sai, từng bước sửa, câu hỏi cần cho `l14`, `l16` (bỏ câu hỏi: không gì thắng trong `maxBlocks`), và **"chỉ đúng việc mới đủ điểm"**: vét cạn không vòng lặp tới 30 khối (mỗi lệnh ≥ 1 s nên phủ mọi chuỗi hành động) với điểm đổi để chỉ tổ hợp cấm mới đạt: `l12` trung hòa + khoanh vùng không kịp 20 s; `l19` (từng đề) và boss: thu hồi + trung hòa + khoanh vùng không kịp. Boss: lời giải "trung hòa trước" 12 khối = `par`; "thu hồi trước" 300 điểm với 15 khối nhưng màn thật báo `TOO_MANY_BLOCKS`; `l19` "trung hòa trước" 29 lệnh, cũng bị chặn. Test thêm: số giây / điểm trên thẻ = `shared/robotlab.json`, gợi ý "Lệnh mới! " + tooltip, số cách ghép thắng (`l04`, `l05`, `l15` 1, `l10` 3), câu "lệnh" thay "khối".
- `theme.scene: "thanh-pho-robot"` (đã có trong `SCENE_THEMES`). Truyện: `STORY_PROPS` thêm `robot`, `lab` (hình tạm 12×12 ở `storyArt.ts`).
- Chưa làm: thêm `w06-thanh-pho-robot` vào `PROVISIONAL_WORLDS` (nằm trong code luật `tools/content-check/src/curriculum.ts`; không cần vì `content:check` xanh); e2e (P3-03); review sư phạm độc lập; **HLV chơi thử từng màn**.

#### 6.1.1 Sa bàn Thành Phố Măng và thi thử (P3-08, 09/10/2026)

> Theo HLV (08/10/2026, H17): **không** chép sa bàn hay Blockly của Leanbot / AIROC (mỗi năm một đề), tự thiết kế; giữ cảm biến màu và line (H20). Sa bàn chỉ dùng ký tự robotlab (`# . L Z r y g`), **không đổi luật** engine. Dữ liệu: `THANH_PHO_MANG` ở `packages/games/src/robotlab/boards.ts`; luật bày khối: `exam.ts`.

**Sa bàn** 9 cột × 7 hàng ngã tư (hàng 0 ở trên, cột 0 bên trái; Bíp xuất phát ở `L`, nhìn `N`):

```
      0 1 2 3 4 5 6 7 8          khu phố (cảnh, không phải luật)
  0   y # # . # . . . g          0  · v t · w · · · ·    v nhà tranh  t rặng tre
  1   . . . . . . # # .          1  · · · · b · m m ·    w sông       b cầu
  2   . # # . # . . . .          2  · p p · w · · · ·    p công viên  m sạp chợ
  3   . # # L # . # # .          3  · p p · w · c c ·    c nhà phố    f nhà máy
  4   . . . . # . . Z Z          4  · · · · w · · · ·
  5   # . # . . . # # r          5  v · t · b · f f ·
  6   . . . . # . . . .          6  · · · · w · · · ·
```

**Chuyện của sa bàn:** Măng dẫn Bíp đi một vòng Thành Phố Măng. Phía tây sông là **làng tre** (nhà tranh, rặng tre; trạm vàng ở cuối ngõ cụt `0,0`) và **công viên** (cây, hồ sen, luống hoa) có line **chạy vòng quanh** (vòng 12 ngã tư, hàng 1 và 4, cột 0 và 3). **Phòng thí nghiệm** `L` ở mép đông công viên, sát **sông**. Sông có **hai cây cầu** (`1,4` và `5,4`): sang bờ đông phải chọn cầu trên hay cầu dưới. Phía đông: **phố chợ** (hàng 0, mái bạt sọc) dẫn tới trạm xanh ở `0,8`; **hẻm tắt** hàng 2; **nhà máy** có ống khói tỏa khói, cạnh **vùng ô nhiễm** `4,7`–`4,8` và trạm đỏ `5,8`.

**Đường có chủ ý:** ngõ cụt `0,0` (trạm vàng), `0,3`, `6,0`; vòng quanh công viên (đi hai chiều đều tới); hai cầu (đường ngắn tùy việc); hẻm hàng 2 là đường tắt so với phố chợ; rào đặt lên `4,8` thì chặn lối `3,8 → 5,8`, phải vòng hàng 6.

**Đề** (bộ khối của mỗi đề, giống nhau mọi đề nên điểm so được với nhau): 2 rào, 3 trung hòa (đỏ, vàng, xanh lá, một mỗi màu), 3 ô nhiễm (màu ngẫu nhiên, để dùng câu hỏi màu) = 8 khối, tối đa 2 × 45 + 3 × 160 + 3 × 100 + 40 = 910 điểm. 120 giây không đủ làm hết: phải chọn việc.

**"Đề mới"** (`generateExam(board, seed, rules, target)`, thuần, tất định): `seed` 1–9999 ("Đề số 1234") → dòng số mulberry32 trộn các ngã tư `.` (trừ hai cầu), bày khối rồi kiểm; không đạt thì bày lại (tối đa 300 lần, chưa bao giờ cần: 9 999 đề đều có). Đề đạt khi:
- khối chỉ ở ngã tư `.`, **không** trên cầu, **không** hai khối kề nhau;
- **không dồn sát phòng**: nhiều nhất 1 khối trong vòng 2 bước line quanh `L`;
- **việc nào cũng làm được**: từ lúc xuất phát, làm riêng việc đó rồi về `L` vẫn kịp 120 giây (với mọi khối khác nằm nguyên, Bíp không đi xuyên khối);
- **có lời giải**: một kế hoạch tham lam (việc nhiều điểm / giây nhất còn kịp giờ, rồi về phòng) đạt ≥ `target` (300) trong 120 giây. Đo trên 9 999 đề: thấp nhất 300, trung vị 500, cao nhất 725 điểm.

**Thi thử** (`w06-exam`, chặng `challenge`, mode `creative`, sau boss): 2 lượt × 120 giây, **lượt tốt nhất được tính** (luật 2025, `airoc-2026.md` §1). Bảng điểm dưới vùng ghép: Lượt 1 · Lượt 2 · Tốt nhất; lượt tính ngay khi chạy (dừng giữa chừng vẫn tính), lượt thứ ba không tính ("Xong hai lượt rồi. Bấm Thi lại hoặc Đề mới nhé!"). Lượt đụng khối / lạc line giữ điểm các việc đã xong (H22). "Đề mới" đổi số đề và chỗ các khối, xóa bảng điểm; ô "Đề số" gõ được (HLV cho cả nhóm cùng thi một đề), số đề nằm trên URL (`?de=1234`). Không sao, không xu (H21). File màn giữ **đề 2026** làm cấu hình chuẩn có lời giải 48 lệnh (kế hoạch tham lam, 660 điểm, 114 giây); luật 22 của `content:check` kiểm `config.blocks` đúng là đề 2026.

**Màn sáng tạo** `w06-creative` dùng cùng sa bàn (khối của đề 17), `score` 300.

### 6.2 Thế giới 7 — 🏪 Chợ Đếm Số (chi tiết, bản nháp P3-10/P3-11, 09/10/2026)

> Đề xuất 07/10/2026; chi tiết hóa lần hai và soạn nội dung 09/10/2026 (P3-10, P3-11; HLV giao quyết định sản phẩm cho AI). Bảng và "Chi tiết từng màn" dưới đây là bản đã soạn trong `content/worlds/w07-cho-dem-so/`, **🟨 nháp, chờ HLV chơi thử** (P3-12).

**Chọn cách làm biến (khuyến nghị: phương án A).**

| | A. Biến trên `maze` + `robotlab` (khuyến nghị) | B. Kiểu game mới `farm` |
|---|---|---|
| Việc phải xây | Khối biến chung của engine, bảng biến trên sân chơi (React, dùng chung), luật chấm "đếm đúng", 1 khối hỏi maze mới | Cả một kiểu game (headless + stage + sprite + editor) **và** khối biến |
| Khối số | **Chỉ dùng ô số trên khối** (field), không có ô cắm số: không cần capacity guard (`later-phases.md`), vét cạn vẫn hữu hạn | `farm_fruit_count` là khối số cắm vào ô → cần shadow block + capacity guard + vét cạn biểu thức |
| Nối với AIROC | Đếm khối đã giao, `lặp [số khối] lần` trên robot: dùng lại ngay cho thi | Không |
| Bất lợi | Cảnh "chợ" chỉ là trang trí trên mê cung/sa bàn; không có `biến + biến` (để W10) | Chậm hơn ~1 giai đoạn; thêm một sân chơi mới cho bé học luật |

`cq_repeat` hiện có **ô số** (field, ADR-0004), không phải ô cắm. Phương án A **không** đổi `cq_repeat`: thêm khối riêng `lặp [biến] lần`.

**Khối biến đề xuất** (engine, chung mọi kiểu game; tên biến khai báo ở màn `level.variables: { id, name }[]` tối đa 2, vd `{ id: 'bamboo', name: 'số măng' }`; dropdown chỉ hiện biến của màn, bé không tự tạo biến ở W7):
| Khối | Nhãn | Tooltip (đề xuất) |
|---|---|---|
| `cq_var_set` | đặt [số măng ▾] thành [0] | Lệnh này cho số vào hộp. Số cũ mất |
| `cq_var_add` | tăng [số măng ▾] thêm [1] | Cộng thêm vào số đang có trong hộp |
| `cq_var_compare` | [số măng ▾] [= ▾ / < / >] [3]? | So số trong hộp với số bên phải. Đúng thì ✔, sai thì ✘ |
| `cq_repeat_var` | lặp [số măng ▾] lần | Làm các lệnh bên trong, số lần bằng số trong hộp lúc bắt đầu lặp |
| `maze_bamboo_ahead` | phía trước có măng? | ✔ khi ô ngay trước Măng có măng chưa nhặt |

- Biến là số nguyên `0…max` (`max` theo màn, mặc định 9, tối đa 20); vượt `max` thì thua `BOX_FULL` "Hộp đầy rồi!" (ADR-0022, đổi so với bản nháp "giữ 99"). Mỗi lần đổi biến, engine ghi event chung `var{blockId, id, value}`; "bảng hộp" cạnh sân chơi hiện số mới (giống `sense`).
- **Chấm "đếm đúng"**: trường màn `countGoal: { var, equals: number[] }` (một số cho mỗi bản đồ). Thắng của kiểu game **và** biến đúng số → thắng; sai số → `incomplete` / `WRONG_COUNT` "Đếm chưa đúng. Đếm lại nhé!". Khóa đoán thêm đuôi `#<id>=<n>` (vd `win#bamboo=3`).
- **Giá trị đầu theo bản đồ:** `level.variables[].start?: number[]` (một số cho mỗi bản đồ, mặc định 0). Dùng cho "biến của đề" (đơn hàng khác nhau mỗi bản đồ, `l11`); hộp hiện số đầu trước khi chạy.
- **Rủi ro kỹ thuật cần spike trước (P3-09a, có ADR):**
  - `cq_repeat_var` **phụ thuộc trạng thái** (số lần lặp đọc lúc chạy), khác `cq_repeat` có số cố định; nó **không** nằm trong `CONTROL_TYPES` của vét cạn (`@codequest/validator`), nên vét cạn hiện tại không hiểu khối này.
  - Biến hiện nằm **ngoài** trạng thái kiểu game mà `FastSim` phát lại (vét cạn ghi lời gọi API của từng khối rồi phát lại trên state; khối biến không gọi API nào). Spike chọn: biến là trạng thái của engine được `FastSim` mang theo, hay API chung ghi vào state của kiểu game.
  - Vét cạn chỉ hữu hạn vì giá trị ô số **cố định bởi thanh khối** (như `cq_repeat` hiện nay: thanh khối để sẵn số, vét cạn thử 0–9 / số của thanh khối), và biến bị chặn bởi `max` của màn (ADR-0022).
- Luật soạn **R4** (ADR-0022): màn tự ghép mà hộp **lái** chương trình (`lặp [hộp] lần` hoặc so sánh) có ≥ 2 bản đồ và bỏ khối biến khỏi thanh khối thì không gì thắng tới `par`; màn **chỉ đếm** có ≥ 2 bản đồ với `countGoal` khác số. Màn "đếm rồi chọn đường" trên maze cần tường ngay ô thứ hai của nhánh sai (không có `có đường …` trong thanh khối), nếu không thì chuyển sang robotlab.
- Đã quyết ở **ADR-0022** (09/10/2026): biến của engine, `countGoal`, event `var`, cách vét cạn, các câu hỏi sản phẩm.

**Câu chuyện** (nối chương cuối W6 "Chợ phiên sắp mở. Bíp rủ Măng đi chợ!"): chợ phiên mở ở Thành Phố Robot. Bác Heo nhờ Măng đếm măng trên các sạp, bác Cú nhờ Bíp đếm khối thu về phòng thí nghiệm, Mèo nhờ đếm khối vàng. Bác Cú tặng Măng **chiếc hộp có tên**: hộp giữ một số và đổi được. Boss: "Giao măng cho 3 nhà" (đếm măng trên sạp, rồi hộp chỉ số bước tới nhà). Kết thế giới: bác Cú gọi Măng sang Xưởng Phép Thuật (W8).
**Bé làm được:** đặt và tăng hộp (tăng cộng thêm vào số đang có); đếm bằng `nếu … {tăng}` trong vòng lặp (hỏi **trước** khi tiến); so sánh hộp để chọn đường và để dừng vòng lặp; dùng hộp làm số lần lặp, kể cả hộp vừa đếm được; hai hộp khác tên.
**Ngộ nhận nhắm tới:** "Biến là hằng số" (`l02`, `l06`: hộp đổi theo từng vòng, tăng cộng vào số cũ); "Tên biến là giá trị" (bài mở đầu, `l07`, `l15`); "`đặt` trong vòng lặp vẫn đếm được" (`l05`, `l19`); "Đếm số ô thay vì số vật" (`l03`, `l09`, `l10`); "Hộp tự đếm" (`l07`); "`lặp [hộp] lần` đọc lại hộp mỗi vòng" (`l12`).
**Unplugged — "Hộp đếm":** mỗi bé một hộp giấy có nhãn tên ("số táo"). Đi dọc hàng ghế, gặp táo thì bỏ một hạt đậu vào hộp. Cuối hàng đọc số trong hộp. Vòng 2: một bạn "đặt = 0" sai chỗ (đổ hộp ở mỗi ghế). Vòng 3: hộp có 3 hạt, bạn kia bước đúng 3 bước.

**Gọi tên với bé** (ADR-0022 quyết định 1): bài mở đầu nói một lần "Biến là chiếc hộp có tên"; mọi chỗ khác chỉ nói "hộp" và tên hộp. **Chữ "khối" / "lệnh"** (HLV 08/10/2026): chữ cho bé ở W7 gọi khối Blockly là **"khối"** như giao diện chung (không ghi đè `EMPTY_PROGRAM`… như W6); chữ "lệnh" chỉ nằm trong tooltip ("Lệnh này cho số vào hộp. Số cũ mất"). Màn robot vẫn gọi rào / trung hòa / ô nhiễm là "khối" kèm loại hoặc màu ("khối đỏ", "khối vàng").

**Bài giảng `w07-lesson` (5 thẻ):** 1. "Chợ phiên mở rồi! Bác Heo nhờ Măng đếm măng." · 2. "Biến là chiếc hộp có tên. Hộp giữ một số." · 3. `demo` `tiến, tăng, tiến, tăng` trên `#Sbb.G#` → hộp 2 · 4. "Tên để gọi hộp. Số bên trong mới là thứ hộp giữ." · 5. `quiz` "Hộp tên «số măng» đang có 2. Hộp giữ gì?": **Số 2** / Chữ «số măng».

**Bài "Khối mới"** (`beforeLevel`; câu luật cho bé = tooltip, có demo chạy được, `content-authoring.md` §5.1):
- `w07-lesson-dat-tang` trước `l01`: "Khối mới! Đặt: lệnh này cho số vào hộp. Số cũ mất." · demo hộp 5, `đặt thành 0` → 0, Măng đứng yên · "Khối mới! Tăng: lệnh này cộng thêm vào số trong hộp." · demo hộp 2, `tiến, tăng` → 3 · quiz "Hộp có 4. Đặt thành 1. Hộp có mấy?": **1** / 5.
- `w07-lesson-mang-truoc` trước `l03`: "Khối mới! ✔ khi ô ngay trước Măng có măng chưa nhặt." · demo măng trước mặt: `nếu phía trước có măng? {tăng}` → 1, Măng đứng yên · demo ô trống → 0 · quiz "Câu hỏi có làm Măng đi không?": **Không** / Có.
- `w07-lesson-lap-hop` trước `l04`: "Khối mới! Lặp «số bước» lần. Hộp có mấy, lặp mấy lần." · demo cùng chương trình `lặp [số bước] lần {tiến}` với hộp 3 (3 ô) và hộp 1 (1 ô) · "Khối lặp xem hộp một lần, lúc bắt đầu lặp." · quiz "Hộp có 2. Lặp «số bước» lần, tiến. Măng đi mấy ô?": **2 ô** / 1 ô.
- `w07-lesson-so-sanh` trước `l08`: "Khối mới! So số trong hộp với số bên phải. Đúng thì ✔." (tooltip mới) · demo `nếu số măng > 2 {rẽ trái}` với hộp 4 (rẽ) và hộp 1 (không rẽ) · "Dấu = là bằng, < là nhỏ hơn, > là lớn hơn." · quiz "Hộp có 2. Câu «số măng > 2» là gì?": **✘ sai** / ✔ đúng.
- Gợi ý `enter` của màn đầu tiên dùng khối là "Khối mới! " + tooltip (hoặc phần đầu tooltip khi câu dài quá 12 chữ: `phía trước có măng?`, `so sánh`; riêng `lặp [hộp] lần` bỏ "Khối mới!" vì phần đầu tooltip đã 11 chữ); test `w07.test.ts` so từng chữ với tooltip.

Quy ước bảng W7: bản đồ maze / sa bàn robot viết như §5 / §6.1; `b` = măng. Chương trình: `tăng` = `tăng [hộp] thêm 1`, `đặt 0` = `đặt [hộp] thành 0`, `lặp [số bước]` = `lặp [hộp] lần`, `số măng > 2?` = khối so sánh. Mọi mục thanh khối của khối biến **ghim** `VAR` / `NUM` / `OP` (luật 23 (a)). `(N bản đồ)` = `variants`; "hộp đầu" = `variables[].start` theo bản đồ; "đếm đúng" = `countGoal.equals`.

| # | ID | Chặng | Kind | Mode | Ý chính | Nhiệm vụ | Khối | maxBlocks | par | parEdits |
|---|---|---|---|---|---|---|---|---:|---:|---:|
| — | `w07-lesson` | (bài giảng) | — | — | Biến = chiếc hộp có tên; tên ≠ số | — | — | — | — | — |
| 1 | `w07-l01` | guided | maze | parsons | Khối **đặt**, **tăng**: hộp còn số cũ, đặt 0 trước vòng lặp | Bác Heo nhờ Măng đếm măng trên lối chợ. | (ghép) | — | 5 | — |
| 2 | `w07-l02` | guided | maze | predict | Tăng trong vòng lặp chạy mỗi vòng, cộng vào số cũ (1 + 3 = 4) | Hộp số măng là mấy? Đoán xem! | (chỉ xem) | — | — | — |
| 3 | `w07-l03` | guided | maze | build | Khối **phía trước có măng?**: hỏi rồi mới tăng (2 bản đồ, đếm 2 / 4) | Mỗi sạp một số măng. Đếm đúng nhé! | tiến, lặp, nếu, phía trước có măng?, tăng | 6 | 5 | — |
| 4 | `w07-l04` | guided | maze | build | Khối **lặp [hộp] lần**: hộp cho sẵn 3 / 5 (2 bản đồ) | Bác Heo ghi số bước vào hộp. Đi đúng nhé! | tiến, rẽ ×2, lặp, lặp [số bước] lần | 5 | 4 | — |
| 5 | `w07-l05` | practice | maze | bughunt | `đặt 0` **trong** vòng lặp: hộp bị đổ mỗi vòng (3 bản đồ, hộp đầu 5 / 4 / 3) | Hộp cứ về 0. Sửa giúp bác Heo! | tiến, lặp, nếu, phía trước có măng?, đặt 0, tăng | — | 6 | 2 |
| 6 | `w07-l06` | practice | robotlab | build | Đếm khối thu hồi: tăng sau mỗi chuyến; hộp đầu 0 / 3 → đếm đúng 2 / 5 | Bác Cú cần biết đã thu mấy khối đỏ. | lệnh robot, lặp, tăng | 10 | 9 | — |
| 7 | `w07-l07` | practice | maze | predict | Hai hộp: chỉ hộp ghi trên khối tăng mới đổi; hộp không tự đếm | Hộp số măng hay hộp số bước tăng? Đoán xem! | (chỉ xem) | — | — | — |
| 8 | `w07-l08` | practice | maze | build | Khối **so sánh**: hộp cho sẵn 4 / 1, `> 2` rẽ trái, không thì rẽ phải (2 bản đồ) | Nhiều măng thì giao nhà bên trái. | tiến, rẽ ×2, lặp, nếu, nếu…nếu không, số măng > 2? | 8 | 7 | — |
| 9 | `w07-l09` | practice | maze | parsons | `lặp đến khi số măng = 3`: đếm măng chứ không đếm ô, đủ thì rẽ | Đủ 3 măng thì rẽ về nhà. | (ghép) | — | 8 | — |
| 10 | `w07-l10` | practice | maze | bughunt | `tăng` nằm **ngoài** `nếu`: hộp đếm ô (2 bản đồ) | Đếm nhầm cả ô trống. Sửa nhé! | như `l03` | — | 5 | 1 |
| 11 | `w07-l11` | practice | robotlab | build | **Hộp của đề**: đơn hàng 3 / 2, `lặp [đơn hàng] lần {chuyến}` (2 bản đồ) | Đơn hàng mỗi lần một khác. Giao đủ nhé! | lệnh robot, lặp, lặp [đơn hàng] lần | 9 | 8 | — |
| 12 | `w07-l12` | practice | maze | predict | `lặp [hộp] lần` **đọc hộp một lần**: tăng hộp trong thân không thêm vòng | Hộp tăng trong vòng lặp. Lặp mấy vòng? | (chỉ xem) | — | — | — |
| 13 | `w07-l13` | practice | robotlab | build | Đếm riêng **khối đỏ** bằng `nếu khối ở chỗ Bíp màu đỏ? {tăng}` (2 bản đồ, đỏ 2 / 1) | Đếm khối đỏ ở bãi giao hàng. | tiến, lặp, nếu, khối ở chỗ Bíp màu?, tăng | 6 | 5 | — |
| 14 | `w07-l14` | practice | maze | parsons | Hai hộp trong một vòng: có măng tăng số măng, không thì tăng số ô trống | Bác Heo và Mèo cùng nhờ đếm. | (ghép) | — | 8 | — |
| 15 | `w07-l15` | practice | robotlab | bughunt | Tăng **nhầm hộp**: gặp khối vàng mà tăng hộp đỏ (2 bản đồ) | Mèo đếm khối vàng mà hộp vẫn 0. | tiến, lặp, nếu, khối ở chỗ Bíp màu?, tăng đỏ, tăng vàng | — | 5 | 1 |
| 16 | `w07-l16` | practice | maze | build | **Đếm rồi chọn**: đếm măng, rồi `> 2` rẽ trái, không thì rẽ phải (3 bản đồ) | Giao nhà nào? Đếm rồi quyết định. | tiến, rẽ ×2, lặp, nếu, nếu…nếu không, phía trước có măng?, tăng, số măng > 2? | 12 | 10 ⚠ | — |
| 17 | `w07-l17` | practice | robotlab | build | Đếm bước lúc đi (`lặp đến khi khối đỏ`), `lặp [số bước] lần` lúc về (2 bản đồ) | Bíp đếm bước lúc đi để biết đường về. | lệnh robot, lặp, lặp đến khi, màu?, tăng, lặp [số bước] lần | 11 | 10 | — |
| 18 | `w07-l18` | challenge | maze | predict | Đếm trong `lặp đến khi` lồng `nếu`: măng ngoài đường đi không được đếm | Cuối chợ, hộp có mấy? Đoán xem! | (chỉ xem) | — | — | — |
| 19 | `w07-l19` | challenge | maze | bughunt | 2 lỗi: `đặt 0` trong vòng lặp + so sánh `<` thay vì `>` (3 bản đồ) | Hai lỗi trong máy đếm. Sửa nhé! | như `l16` + đặt 0 | — | 11 ⚠ | 3 ⚠ |
| 20 | `w07-boss` | boss | maze | build | **"Giao măng cho 3 nhà"**: đếm măng trên sạp, rồi `lặp [số măng] lần {tiến}` xuống tới nhà (3 bản đồ) | Giao măng cho 3 nhà! Đếm rồi đi đúng. | tiến, rẽ ×2, lặp, nếu, phía trước có măng?, tăng, lặp [số măng] lần | 11 | 10 | — |
| ✦ | `w07-creative` | creative | robotlab | creative | Sa bàn Thành Phố Măng + hộp "số việc" (đặt, tăng, so sánh, lặp theo hộp) | Tự đếm việc cho Bíp trên sa bàn tập! | mọi lệnh robot (trừ `đang gắp khối?`) + điều khiển + khối hộp | — | — | — |

Chặng: 4 guided · 13 practice · 2 challenge · 1 boss (`l17` là practice vì ý "đếm rồi dùng lại hộp" của boss phải có ở màn bắt buộc). Mode: build 9 (kể cả boss) · parsons 3 · predict 4 · bughunt 4; build liền nhau nhiều nhất 2. Kiểu game: maze 14, robotlab 6 (`l06`, `l11`, `l13`, `l15`, `l17`, sáng tạo). Khối mới lần đầu (luật 7): `đặt`, `tăng` ở `l01` (`block:`), `phía trước có măng?` ở `l03`, `lặp [hộp] lần` ở `l04`, `so sánh` ở `l08` (`toolbox:`). Mọi màn có vòng lặp `maxLoopDepth: 1`; `l05`, `l19` thêm `maxInstances: { cq_repeat: 1 }` (chặn cách "sửa" bằng cách chẻ vòng lặp thành hai).

Chi tiết từng màn (bản đồ → chương trình → kết quả, đã chạy trên engine thật):
1. `l01` `######/#SbbG#/######` (nhìn `E`), hộp đầu 3, đếm đúng 2. Khối xáo trộn của `đặt 0, lặp 2 {tiến, tăng}, tiến` (5). ⚠ 5 cách ghép thắng / 120 (`tiến` / `tăng` đổi chỗ trong vòng lặp), đều đặt 0 trước khi đếm; quên `đặt` → 5, `đặt` trong vòng lặp → 0 hoặc 1. Chấp nhận như W6 `l10` (ý của màn là đặt / tăng, không phải thứ tự trong vòng).
2. `l02` `########/#Sbbb.G#/########`, hộp đầu 1, `lặp 3 {tiến, tăng}` → `stop@1,4#bamboo=4`. Thẻ: **Ở măng thứ ba, hộp có 4** ✔ · hộp có 3 (bỏ số cũ) · hộp có 2 (tăng một lần).
3. `l03` bản đồ 1 `#S.bb..G#`, bản đồ 2 `#Sbb.bbG#` (giữa hai hàng tường, nhìn `E`), đếm đúng 2 / 4. Lời giải `lặp 6 {nếu phía trước có măng? {tăng}, tiến}` (5). Hỏi **sau** khi tiến (`lặp 6 {tiến, nếu …}`) bỏ sót măng đầu ở bản đồ 2 (3 ≠ 4). `lặp 6 {tiến, tăng}` đếm ô (6).
4. `l04` bản đồ 1 `########/#S.....#/####G###/########`, bản đồ 2 G ở `2,6`, hộp `số bước` 3 / 5. Lời giải `lặp [số bước] lần {tiến}, rẽ phải, tiến` (4, đúng 1 cách). Số cố định đâm tường ở một bản đồ.
5. `l05` bản đồ `#Sb.bb.G#`, `#S.b..bG#`, `#Sbbb.bG#`, hộp đầu 5 / 4 / 3, đếm đúng 3 / 2 / 4. Ban đầu `lặp 6 {đặt 0, nếu … {tăng}, tiến}` → hộp 0 lúc tới sạp (`WRONG_COUNT`). Sửa: kéo `đặt 0` ra trước vòng lặp (2 thao tác theo cách đếm của engine: bỏ một chỗ, thêm một chỗ). Xóa `đặt` thì giữ số cũ → sai (mọi bản đồ hộp đầu > 0). Bản đồ thứ 3 chặn một chương trình 6 khối "đếm trùng" thắng 2 bản đồ.
6. `l06` sa bàn chữ thập `#.#/.L./#.#` (Bíp ở `L` nhìn `N`), ô nhiễm đỏ ở `0,1` và `1,0`, hai bản đồ cùng sa bàn, hộp đầu 0 / 3, đếm đúng 2 / 5. Lời giải `lặp 2 {tiến 1, gắp, rẽ phải ×2, tiến 1, thả, tăng, rẽ phải}` (9).
7. `l07` `########/#Sb.b.G#/########`, hai hộp `số măng`, `số bước`, `lặp 4 {tiến, tăng số bước}` → `stop@1,5#bamboo=0#steps=4`. Thẻ: **Số măng 0, số bước 4** ✔ · số măng 2 (tên hộp là thứ nó đếm: hộp tự đếm) · số măng 4, số bước 0 (nhầm hộp) · số măng 2, số bước 0 (cả hai).
8. `l08` bản đồ 1 `#####/#G.##/##.##/##S##/#####`, bản đồ 2 G ở `1,3` (nhìn `N`), hộp đầu 4 / 1. Lời giải `tiến, tiến, nếu số măng > 2? {rẽ trái} nếu không {rẽ phải}, tiến` (7). Nhánh sai là tường ngay cạnh ngã ba (ADR-0022 quyết định 6), không có `có đường …`.
9. `l09` `###########/#S.b.bb.b.#/######G####/###########`. Khối xáo trộn của `lặp đến khi số măng = 3? {nếu phía trước có măng? {tăng}, tiến}, rẽ phải, tiến` (8). **1** cách ghép thắng / 2400; đổi chỗ `tiến` lên trước → dừng sớm một ô, `HIT_WALL@1,5`.
10. `l10` `#S.b..bG#` / `#Sbbb.bG#`, đếm đúng 2 / 4. Ban đầu `lặp 6 {nếu phía trước có măng? {}, tăng, tiến}` → 6 / 6. Sửa 1: kéo `tăng` vào trong `nếu` (đúng 1 cách sửa).
11. `l11` sa bàn chữ thập, đơn hàng 3 (ô nhiễm ở `0,1`, `1,0`, `2,1`) / 2 (`0,1`, `1,0`). Lời giải `lặp [đơn hàng] lần {tiến 1, gắp, rẽ phải ×2, tiến 1, thả, rẽ phải}` (8). Lặp 3 ở đơn 2 → `NOTHING_TO_GRAB`; lặp 2 ở đơn 3 → `MISSIONS_LEFT`.
12. `l12` `########/#S.....#/#####G##/########`, hộp `số bước` đầu 2, `lặp [số bước] lần {tiến, tăng số bước}` → 2 vòng, `stop@1,3#steps=4`. Thẻ: **Đi 2 ô, hộp có 4** ✔ · Đi 2 ô, hộp vẫn 2 · Đi mãi, đụng tường (`crash:HIT_WALL@1,6#steps=7`, ngộ nhận đọc lại hộp mỗi vòng). Luật 23 (i) cảnh báo đúng chỗ (bẫy có chủ đích, màn `practice`).
13. `l13` sa bàn `#####/L..../#####`, Bíp ở `1,4` nhìn `W`, 3 khối ô nhiễm ở `1,1`–`1,3` (đỏ, vàng, đỏ / vàng, đỏ, vàng), `score` 40 (về phòng, không phải dọn), đếm đúng 2 / 1. Lời giải `lặp 4 {tiến 1, nếu khối ở chỗ Bíp màu đỏ? {tăng}}` (5). `tiến 4` → `HIT_BLOCK`; đếm mọi khối → 4.
14. `l14` `########/#Sb.b..#/######G#/########`, đếm đúng `số ô trống` 3. Khối xáo trộn của `lặp 5 {nếu phía trước có măng? {tăng số măng} nếu không {tăng số ô trống}, tiến}, rẽ phải, tiến` (8). **1** cách ghép thắng / 12 600.
15. `l15` sa bàn của `l13`, khối vàng, đỏ, vàng / đỏ, vàng, đỏ; đếm đúng `số khối vàng` 2 / 1. Ban đầu `lặp 4 {tiến 1, nếu … màu vàng? {tăng số khối đỏ}}` → hộp vàng 0. Sửa 1: đổi tên hộp trên khối tăng (3 cách sửa 1 thao tác, đều tăng hộp vàng trong nhánh vàng).
16. `l16` bản đồ `#######/#####G#/#Sbbb.#/#######`, `…/#S.bb./#####G#`, `…#####G#/#S.bbb#…` (nhìn `E`), đếm 3 / 2 / 3. Lời giải `lặp 4 {nếu phía trước có măng? {tăng}, tiến}, nếu số măng > 2? {rẽ trái} nếu không {rẽ phải}, tiến` (10). Ba bản đồ chọn sao cho không ô nào một mình tách được "lên" với "xuống" (bản 2 bản đồ đầu tiên có lối tắt 10 khối không hộp, nhìn măng ở từng ô).
17. `l17` sa bàn `#######/L....../#######`, Bíp ở `L` nhìn `E`, một khối ô nhiễm đỏ ở `1,3` / `1,5`, `mustReturn`. Lời giải `lặp đến khi khối ở chỗ Bíp màu đỏ? {tiến 1, tăng}, gắp, rẽ phải ×2, lặp [số bước] lần {tiến 1}, thả` (10). Không có `đã về phòng thí nghiệm?` / `phía trước có line?` trong thanh khối, nên đường về phải dùng hộp.
18. `l18` `#######/#S.b..#/##b##b#/#G..b.#/#######`, `lặp đến khi đã tới đích? {nếu có đường phía trước {nếu phía trước có măng? {tăng}, tiến} nếu không {rẽ phải}}` → `win#bamboo=3`. Thẻ: **hộp có 3** ✔ · 4 (đếm cả măng ở lối giữa `2,2`, Măng không đi qua) · 2 (quên măng ngay sau chỗ rẽ).
19. `l19` bản đồ `#Sbb.b#` (lên, 3), `#Sb..b#` (xuống, 2), `#S.b..#` (xuống, 1), hộp đầu 5 / 4 / 6; không ô nào một mình tách được "lên" với "xuống" (bản trước có lối tắt 12 khối không hộp, nhìn ô đầu). Ban đầu `lặp 4 {đặt 0, nếu … {tăng}, tiến}, nếu số măng < 2? {rẽ trái} nếu không {rẽ phải}, tiến`. Sửa 3 thao tác: kéo `đặt 0` ra trước (2) + đổi `<` thành `>` (1). Sửa một lỗi vẫn đâm tường (test).
20. `boss` 3 bản đồ 7×9: hàng sạp `#Sb.b..##` / `#Sbbb.b##` / `#S.bb.b##` (2 / 4 / 3 măng), rồi đường xuống cột 6, nhà ở `3,7` / `5,7` / `4,7`. Lời giải `lặp 5 {nếu phía trước có măng? {tăng}, tiến}, rẽ phải, lặp [số măng] lần {tiến}, rẽ trái, tiến` (10).
- `w07-creative`: sa bàn Thành Phố Măng của `w06-creative`, hộp `số việc` (`max` 20), thanh khối có `đặt 0`, `tăng`, `số việc = 3?`, `lặp [số việc] lần`.

**Truyện chia chương** (`world.json`; `STORY_PROPS` thêm `market` (sạp chợ) và `box` (hộp gỗ có nhãn), hình tạm 12×12 ở `storyArt.ts`):
1. `cho-phien` "Chợ phiên mở rồi" (mở đầu): "Chợ phiên mở rồi! Măng và Bíp cùng đi chợ." · "Bác Heo nhờ Măng đếm măng trên các sạp." · "Bác Cú tặng Măng một chiếc hộp có tên." (`pig`, `owl`, `market`)
2. `hop-biet-nho` "Chiếc hộp biết nhớ" (sau `l04`) (`pig`, `box`)
3. `bip-giao-hang` "Bíp giao hàng" (sau `l05`, trước màn robot đầu tiên `l06`) (`owl`, `cat`, `robot`)
4. `ba-nha` "Ba nhà đặt măng" (sau `l17`, màn practice cuối; luật 21 không cho mở sau màn challenge `l19`) (`pig`, `home`)
5. `cho-tan` "Chợ tan" (sau `boss`): "Ba nhà đều có măng. Bác Heo cười tít mắt!" · "Bác Cú gọi: Xưởng Phép Thuật đang chờ Măng!" (`pig`, `owl`, `market`)

`theme.scene`: **chưa có cảnh chợ**; dùng `thanh-pho-robot` (chợ phiên ở Thành Phố Robot; cảnh này có cả mê cung `CITY_MAZE`). Cảnh `cho` riêng là việc của web (P2-23 kiểu).

Ghi chú khi soạn (P3-10 + P3-11, 09/10/2026; **🟨 nháp, chờ HLV chơi thử**):
- `content:check` xanh, 1 cảnh báo có chủ đích (`l12`, luật 23 (i)). `npm run par` từng màn (`NODE_OPTIONS=--max-old-space-size=2048`, một việc mỗi lúc):

  | Màn | par tính tay | `npm run par` |
  |---|---:|---|
  | `l03` | 5 | ✔ 5 (15 cách, đều `lặp N≥6` cùng thân) |
  | `l04` | 4 | ✔ 4 (1 cách) |
  | `l05` | 6 / sửa 2 | ✔ 6 (15) / sửa 2 (15 cách, đều "kéo `đặt` ra trước") |
  | `l06` | 9 | ✔ 9 (144 cách: đổi chỗ rẽ / gắp / tăng) |
  | `l08` | 7 | ✔ 7 (40) |
  | `l10` | 5 / sửa 1 | ✔ 5 / sửa 1 (đúng 1 cách sửa) |
  | `l11` | 8 | ✔ 8 (12) |
  | `l13` | 5 | ✔ 5 (2) |
  | `l15` | 5 / sửa 1 | ✔ 5 / sửa 1 (3 cách) |
  | `l16` | 10 | ⚠ không thắng ≤ 8 rồi chạm trần catalogue; với `lặp` 2–6 không thắng ≤ 9 → `par` 10 tính tay |
  | `l17` | 10 | ⚠ mặc định dừng ở ≤ 8; `--budget 400000000` ✔ 10 (76 cách, 69 s) |
  | `l19` | 11 / sửa 3 | ⚠ không thắng ≤ 8, không sửa được ≤ 1 → giữ tay (như W6 `l19`) |
  | `boss` | 10 | ⚠ không thắng ≤ 9 (`--budget 400000000`, 31 s) → `par` 10 đã chứng minh |
  | ghép hình | — | `l01` ⚠ 5 / 120, `l09` 1 / 2400, `l14` 1 / 12 600 |
- **R4** (`w07.test.ts`, `withoutVariables`, giới hạn `maxBlocks ?? par`): không gì thắng ở `l04`, `l08`, `l11`, `l17` (vét cạn đủ); boss tới 11 với số vòng `lặp` 2–6; `l16`, `l19` chỉ vét cạn đủ tới 10 (số vòng 2–6; quá 10 chạm trần catalogue / 2 GB heap), cộng một test cấu trúc: không ô nào của hành lang tách được bản đồ "lên" với "xuống" (chặn lối tắt nhìn một ô). Màn chỉ đếm (`l03`, `l05`, `l06`, `l10`, `l13`, `l15`) có `countGoal.equals` khác nhau (luật 23).
- **Lối tắt ADR M6 đã đóng:** `l04` dùng dạng "hộp của đề" (không có `lặp đến khi` / `có đường …`, không men tường); `l08` chọn đường bằng hộp cho sẵn, nhánh sai là tường; `l16` (đếm rồi chọn) cần 3 bản đồ.
- **Lệch so với bản đề xuất:**
  - `l01` 7 → 5 khối (một vòng lặp); `l02` hộp đầu 1 (thêm ý "tăng cộng vào số cũ").
  - `l04`: "đếm bậc thang rồi đi xuống" (lối tắt men tường, ADR) chuyển thành hộp cho sẵn; ý "đếm xong dùng lại số đó" dời lên boss và `l17`.
  - `l08`: so sánh với hộp cho sẵn (một ý mới), "đếm + so sánh" dời sang `l16`.
  - `l09` robot → **maze** ghép hình; `đang gắp khối?` **không** giới thiệu ở W7: câu hỏi này không giúp đếm vì gắp ở ô trống là thua (`NOTHING_TO_GRAB`), không "thử gắp" được. Để W8 nếu cần.
  - `l13` đếm khối đỏ **không** thu hồi (màn `score` 40 = về phòng), để chương trình 5 khối; `l14` hai hộp là "măng / ô trống" (maze không có cá).
  - `l15`: "tăng trước khi chắc thả được" không dạy được (thả sai chỗ là thua, hộp không được chấm) → "tăng nhầm hộp".
  - `l16` bỏ mục tiêu ⭐ (không có đánh đổi thật), 3 bản đồ; `l17` "đếm đường đi, đường về" thay "giao đúng đơn trong 40 giây".
  - **Boss**: "chia măng đều cho 3 nhà" cần phép chia / mang hàng, engine không có. Thay bằng "giao măng cho 3 nhà": đếm măng, rồi hộp vừa đếm là số bước tới nhà (đếm + dùng lại hộp). Boss không dùng `so sánh` (đã ôn ở `l16`, `l19`); ngoại lệ có chủ đích của luật §7 như D13 của W6.
  - Mode: build 9 / predict 4 (đề xuất 8 / 5).
- Review sư phạm độc lập của AI (critic, 09/10/2026), đã sửa: `l01` không còn dựa vào A1 để tăng ít hơn số vòng; `l17` thành practice; `l18` gọi `2,2` là lối giữa (không phải hốc); `l19` nói luật "hơn 2 măng thì lên"; chữ "lặp «số bước» lần" thay "lặp hộp lần"; `l14` gợi ý không lộ lời giải, Mèo thay Gà con; bỏ gợi ý `OUT_OF_TIME` / `feedback.TIMEOUT` ở màn robot không có `lặp đến khi`; chương 3 mở sau `l05`. Còn để HLV quyết: mission gọi đích là "sạp" mà hình đích là nhà (`l08`, `l09`, `l16`). Tooltip `cq_var_compare` đã đổi thành "So số trong hộp với số bên phải. Đúng thì ✔, sai thì ✘" (09/10).
- Chưa làm: e2e, **HLV chơi thử từng màn**.

## 7. Quy tắc soạn chương trình học
`content:check` tự kiểm các luật có dấu ⚙ (luật 7–8 ở `architecture/content-model.md` §5).
- Mỗi màn chỉ giới thiệu **tối đa 1 ý mới**.
- ⚙ Khối mới (lần đầu trong toàn bộ chương trình học) xuất hiện lần đầu ở màn `guided` hoặc `practice` (**không** ở `challenge`/`boss`, vì `challenge` là tùy chọn), và màn đó có gợi ý tầng 0 chỉ vào khối: `toolbox:<type>` (mode build) hoặc `block:<type>` (mode parsons).
- ⚙ **Giới thiệu khối mới bằng 3 thứ** (luật cố định, HLV 03/10/2026): (1) một câu cho bé nói đúng khối làm gì (Măng có đi không, mấy ô, cái gì đổi) trong gợi ý `enter` "Khối mới: …"; (2) một ví dụ chạy được (thẻ `demo` của bài "Khối mới" `beforeLevel` hoặc bài mở đầu); (3) tooltip chính xác. Bảng tra và chi tiết: `conventions/content-authoring.md` §5.1. `content:check` cảnh báo (luật 7) khi màn giới thiệu khối hành động không có gợi ý nào nhắc tên khối.
- ⚙ **Không quá 3 màn `build` liền nhau.** Mỗi cách chơi `build`, `parsons`, `predict`, `bughunt` xuất hiện ≥ 1 lần trong mỗi thế giới.
- Màn `challenge` không giới thiệu khái niệm hoặc khối mới.
- Boss dùng **mọi khối của kiểu game của boss** đã được giới thiệu trong thế giới, và kể tiếp câu chuyện.
- `par ≤ maxBlocks ≤ par + 2` khi có `maxBlocks`.
