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
| 6 | `w06-thanh-pho-robot` | 🤖 Thành Phố Robot | Robot, cảm biến, tay gắp, nhiệm vụ AIROC | tiến n ô, dò line, gắp, thả, màu là…? | robotlab | 20 | GĐ 3 |
| 7 | `w07-cho-dem-so` | 🏪 Chợ Đếm Số | Biến, đếm, so sánh | biến, tăng 1, so sánh | farm, sorter, robotlab | 20 | GĐ 4 |
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
| 6 | `w01-l06` | practice | runner | parsons | Thứ tự quan trọng: xếp lại 5 khối | đi, nhảy | — | 5 | — |
| — | `w01-lesson-cui` | (bài Khối mới) | runner | — | **Cúi xuống và đi 1 ô**, chui qua cành; nhảy vào cành là cụng đầu (thẻ sau giải thích) | đi, nhảy, cúi | — | — | — |
| 7 | `w01-l07` | practice | runner | build | Khối **cúi** dưới cành tre | đi, nhảy, cúi | — | 4 | — |
| 8 | `w01-l08` | practice | runner | predict | Đoán Măng vướng ở đâu | (chỉ xem) | — | — | — |
| 9 | `w01-l09` | practice | runner | bughunt | Thiếu một khối nhảy | đi, nhảy, cúi | — | 6 | 1 |
| — | `w01-lesson-da` | (bài Khối mới) | runner | — | **Đá ô phía trước, Măng đứng yên** (ví dụ chỉ có khối đá); đi tiếp phải thêm khối đi | đi, đá | — | — | — |
| 10 | `w01-l10` | practice | runner | build | Khối **đá** thùng gỗ | đi, nhảy, cúi, đá | — | 5 | — |
| 11 | `w01-l11` | practice | runner | bughunt | Hai khối đặt sai thứ tự | đi, nhảy, cúi, đá | — | 6 | 2 |
| — | `w01-lesson-re` | (bài Khối mới) | maze | — | **Tiến 1 ô**; **rẽ chỉ quay tại chỗ, chưa đi**; rẽ rồi mới tiến | tiến, rẽ phải | — | — | — |
| 12 | `w01-l12` | practice | maze | build | Mê cung đầu tiên: **tiến**, **rẽ** | tiến, rẽ trái, rẽ phải | — | 4 | — |
| 13 | `w01-l13` | challenge | runner | build | Đường dài đủ mọi chướng ngại | đi, nhảy, cúi, đá | 12 | 10 | — |
| 14 | `w01-l14` | challenge | maze | bughunt | Mê cung chữ Z có 2 lỗi | tiến, rẽ trái, rẽ phải | — | 8 | 2 |
| 15 | `w01-boss` | boss | runner | build | "Mang măng về làng": nhặt 3 măng (`collectAll`); nhảy qua măng là bỏ sót | đi, nhảy, cúi, đá | 11 | 9 | — |
| ✦ | `w01-creative` | creative | runner | creative | Sân chơi tự do trên đường chạy có sẵn (chưa có trình xây đường) | tất cả | — | — | — |

**Bài "Khối mới"** (góp ý HLV 03/10/2026): bé hay hiểu sai mỗi khối làm Măng đi bao xa (tưởng cúi là cúi tại chỗ, nhảy chỉ 1 ô, đá xong Măng tự đi, rẽ là rẽ và đi). Mỗi khối hành động mới có một bài 3–5 thẻ (`lesson.beforeLevel`, `architecture/content-model.md` §3) gắn trên viên đá của màn đầu tiên dùng khối đó; ví dụ chạy được cho thấy Măng dừng ở ô nào. Bài mở đầu `w01-lesson` đã dạy "mỗi khối đi là 1 bước" nên khối đi không có bài riêng. Trong màn, gợi ý `enter` "Khối mới: …" nhắc lại đúng câu đó (`l03`, `l07`, `l10`, `l12`), cùng câu với chú thích khối và `glossary.md`. Bài không khóa màn (`coach-questions.md` F10).

Thế giới 1 dạy tuần tự nên **không giới hạn số khối** ở các màn guided/practice: bé được thử thoải mái. `par` vẫn dùng để chấm ⭐⭐.

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
| 5 | `w02-l05` | practice | runner | build | Mẫu "đi, nhảy" × 3 | 3 | 3 |
| 6 | `w02-l06` | practice | runner | build | Khối trước + vòng lặp + khối sau | 4 | 4 |
| 7 | `w02-l07` | practice | runner | bughunt | Thừa một vòng: "lặp 4 lần" phải là 3, sau vòng lặp còn 1 khối nhảy (parEdits 1) ⁴ | — | 4 |
| 8 | `w02-l08` | practice | maze | build | Bậc thang: "tiến, rẽ trái, tiến, rẽ phải" × 3 | 5 | 5 |
| 9 | `w02-l09` | practice | maze | parsons | Bậc thang xuống dốc: thứ tự khối **trong** vòng lặp (tiến, rẽ phải, tiến, rẽ trái) × 3 ¹ | — | 5 |
| 10 | `w02-l10` | practice | maze | predict | Đoán ô dừng của vòng lặp có rẽ | — | — |
| 11 | `w02-l11` | practice | runner | bughunt | Khối bị đặt ngoài vòng lặp, có hố cuối sau vòng lặp (parEdits 2) ⁴ | — | 4 |
| 12 | `w02-l12` | practice | maze | build | Ba cạnh quanh khóm tre: "tiến, tiến, rẽ phải" × 3 ² | 4 | 4 |
| 13 | `w02-l13` | practice | runner | build | Hai vòng lặp nối tiếp | 4 | 4 |
| 14 | `w02-l14` | practice | maze | build | Hai vòng lặp nối tiếp trong mê cung (đoạn ngang 3, đoạn dọc 5) ⁵ | 6 | 5 |
| 15 | `w02-l15` | practice | runner | predict | Hai vòng lặp nối tiếp: đoán kết quả | — | — |
| 16 | `w02-l16` | challenge | runner | build | Đường dài (19 ô kể cả ô xuất phát và cờ) chỉ được 5 khối: vòng lặp + hố cuối ⁴ | 5 | 5 |
| 17 | `w02-l17` | challenge | maze | build | Bậc thang rồi hành lang: hai vòng lặp, mỗi vòng vừa đủ ³ | 8 | 7 |
| 18 | `w02-l18` | challenge | runner | bughunt | Ba lỗi trong một chương trình, có hố cuối sau vòng lặp (parEdits 3) ⁴ | — | 6 |
| 19 | `w02-l19` | challenge | maze | build | Mê cung dài, `par` rất chặt | 7 | 6 |
| 20 | `w02-boss` | boss | runner | build | "Vượt rừng tre": 28 ô, mẫu "đá, đi, cúi, nhảy" × 6 rồi hố cuối ⁴ | 7 | 6 |
| ✦ | `w02-creative` | creative | runner | creative | Tạo nhịp điệu đường chạy riêng | — | — |

Ghi chú: thế giới này **chưa có lặp lồng nhau** (để dành Thế giới 9). Với màn `bughunt`, cột `par` là số khối của lời giải; sao ⭐⭐ chấm theo `parEdits` (số khối phải sửa).

Ghi chú khi soạn nháp (P1-13, đã sửa sau review sư phạm):
- ¹ ² ³ **Mê cung xoắn ốc** (dòng 9, 17 bản đầu) bỏ: trên lưới, xoắn ốc cạnh 2 ô luôn đặt đích sát ô xuất phát (đi tắt 2 khối), còn cạnh 3 ô thì lặp lồng `lặp 4 { lặp 3 {tiến}, rẽ }` chỉ 4 khối, ít hơn `par`, mà thế giới này chưa dạy lặp lồng. **Hình vuông kín** (dòng 12) cũng tạo đường tắt sang đích, nên đường quanh khóm tre là 3 cạnh (chữ C). Dòng 17 giờ là bậc thang + hành lang (`par` 7, `maxBlocks` 8).
- ⁴ Măng **thắng ngay khi chạm cờ / đích**, kể cả giữa vòng lặp, nên đặt số lần lặp **lớn hơn** cần vẫn thắng nếu ngay sau vòng lặp là đích. Để kỹ năng "đếm đúng số lần lặp" thật sự cần, các màn này có **đoạn cuối khác mẫu** ngay sau vòng lặp (hố cuối): lặp thừa 1 vòng là Măng rơi hố / đụng cành, lặp thiếu thì khối sau vòng lặp va vào chướng ngại. Các màn vẫn để số lặp thừa thắng được: `l01`, `l03`, `l05`, `l08`, `l12`, `l19` (màn dạy ý khác, hoặc mê cung nhìn thấy hết đường).
- ⁵ `l14` bản đầu bắt đầu nhìn lên (thêm 1 khối rẽ đầu tiên để `par` 6); đổi sang nhìn sang phải, `par` 5, `maxBlocks` 6. Lặp thừa ở đoạn ngang là đụng tường.
- Thế giới 2 không có khối hành động mới. `l08` (mê cung đầu tiên của thế giới) có thêm gợi ý `turn-stay` "Rẽ chỉ quay tại chỗ. Muốn đi thì thêm tiến!" khi bé thiếu khối tiến (góp ý HLV 03/10/2026, `glossary.md` dòng Rẽ).
- Mọi `par` đã được kiểm bằng vét cạn trên thanh khối của màn (số lần lặp 2–20, cho phép cả lặp lồng): không có lời giải nào ít khối hơn.

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
| 5 | `w03-l05` | practice | runner | bughunt | Khối rời không chạy: nối khối đá vào đúng chỗ | Một khối rơi khỏi máy của Cáo. Nối lại! (máy) | đi, nhảy, đá | — | 6 | 1 | — |
| 6 | `w03-l06` | practice | maze | bughunt | Rẽ sai phía khi Măng nhìn xuống | Tìm lối ra khỏi kho của bác Cú. (cửa ra) | tiến, rẽ trái, rẽ phải, lặp | — | 5 | 1 | — |
| 7 | `w03-l07` | practice | runner | parsons | Lắp lại chương trình bị gió thổi tung: khối nào trong, khối nào sau vòng lặp | Gió thổi tung khối. Lắp lại máy đá thùng! (máy) | đi, nhảy, đá, lặp | — | 7 | — | · |
| 8 | `w03-l08` | practice | runner | bughunt | Vòng 1–2 đúng, vòng 3 sai: thân vòng lặp phải đúng cho **mọi** vòng | Máy của Gấu nâu hỏng ở vòng thứ ba. (máy) | đi, nhảy, cúi, lặp | — | 5 | 1 | — |
| 9 | `w03-l09` | practice | maze | predict | Đọc chương trình mê cung có rẽ khi Măng nhìn xuống | Măng có ra khỏi kho không? Đoán xem! (cửa ra) | (chỉ xem) | — | — | — | · |
| 10 | `w03-l10` | practice | maze | bughunt | Hai khối đổi chỗ (sửa 2 thao tác) | Mang hộp đồ nghề về nhà bác Cú. (nhà) | tiến, rẽ trái, rẽ phải | — | 8 | 2 | — |
| 11 | `w03-l11` | practice | runner | build | Tự ghép từng đoạn, chạy thử sau mỗi đoạn | Tự ghép chương trình cho máy mới của Hổ. (máy) | đi, nhảy, cúi, đá, lặp | 9 | 7 | — | Nhặt măng ở bãi đất cuối |
| 12 | `w03-l12` | practice | runner | bughunt | Hai lỗi: sửa một lỗi, chạy lại, thấy lỗi thứ hai | Máy của Chim cánh cụt có hai lỗi. (máy) | đi, nhảy, cúi, lặp | — | 6 | 2 | — |
| 13 | `w03-l13` | challenge | maze | bughunt | Mê cung có vòng lặp, 2 lỗi: số lần lặp + rẽ sai phía | Kho lớn có hai lỗi. Tìm lối ra! (cửa ra) | tiến, rẽ trái, rẽ phải, lặp | — | 8 | 2 | — |
| 14 | `w03-l14` | challenge | runner | predict | Đọc chương trình dài có 3 vòng lặp | Đọc chương trình dài của Gấu túi. (máy) | (chỉ xem) | — | — | — | · |
| 15 | `w03-boss` | boss | runner | bughunt | "Sửa máy nhặt măng": 4 lỗi khác loại, nhặt đủ 3 măng (`collectAll`) | Sửa máy nhặt măng lớn của cả làng! (máy) | đi, nhảy, cúi, đá, lặp | — | 11 | 4 | — |
| ✦ | `w03-creative` | creative | runner | creative | Ghép một chương trình có 1 lỗi, lưu và khoe với nhóm; trong buổi học nhóm, bạn chạy xem và nói lỗi ở đâu (câu G15) | Giấu một lỗi, đố bạn tìm! | tất cả | — | — | — | · |

Thế giới này **không có khối mới**. Chặng: 3 guided · 9 practice · 2 challenge · 1 boss. Mode: predict 4 · bughunt 9 · parsons 1 · build 1. Nhịp: sau 2 màn sửa lỗi có 1 màn đoán hoặc ghép hình.

Chi tiết từng màn (bản đồ → chương trình ban đầu → lời giải; kết quả mô phỏng):
1. `l01` `..O..B.F`. Chương trình `đi, nhảy, đi, đi, đi, đi` → `crash:HIT_BRANCH@5`. Thẻ: **Cụng cành tre** ✔ · Tới nơi (`win`) · Rơi xuống hố (`crash:FELL_IN_HOLE@2`) · Đứng trước máy (`stop@6`).
2. `l02` cùng bản đồ và chương trình của `l01` (Đoán → Chạy → Sửa trên **một** chương trình). Lời giải: khối thứ 4 (đi) → cúi (thắng). Gợi ý tầng 0: `enter` chỉ `run`; `run-end` + `HIT_BRANCH` chỉ `step` ("Bấm Từng bước, xem khối nào sáng.").
3. `l03` `.B...O.C.F`. Ban đầu `cúi, đi, đi, nhảy, đá, đi, đi, đi` → `FELL_IN_HOLE@5` (Măng nhảy từ ô 3, sớm 1 ô). Lời giải: chèn 1 khối đi trước nhảy (9 khối, thắng). Khối đang sáng lúc ngã là **nhảy**, nhưng nhảy không sai. Gợi ý: `FELL_IN_HOLE` → `step` "Trước khi nhảy, Măng đứng sát hố chưa?".
4. `l04` `..O.B.O.F`, chương trình `lặp 3 {đi, nhảy}, đi` → `crash:HIT_BRANCH@4` (vòng 2). Thẻ: **Cụng cành tre** ✔ · Tới nơi · Rơi hố thứ hai (`@6`) · Rơi hố đầu (`@2`).
5. `l05` `..C.O.F`. Ban đầu `đi, đi, đi, nhảy, đi` + một khối **đá rời** nằm cạnh → `HIT_CRATE@2`. Lời giải: nối khối đá vào sau khối đi đầu (`đi, đá, đi, đi, nhảy, đi`, thắng). Ở mode `bughunt`, khối rời bị làm xám (`Events.disableOrphans`, chỉ `parsons` không dùng: `blockly-integration.md`), nên câu gợi ý `orphans: true` "Khối xám này chưa nối nên không chạy." khớp với màn hình.
6. `l06` `########/##S#####/##.#####/##.#####/##....G./##.#####/########`, nhìn `S`. Ban đầu `lặp 3 {tiến}, rẽ phải, lặp 4 {tiến}` → `HIT_WALL@4,2`. Lời giải: rẽ phải → rẽ trái (thắng).
7. `l07` `.C.C.C..O.F`, lời giải `lặp 3 {đá, đi, đi}, đi, nhảy, đi` (thắng). Xếp sai một khối đi ra ngoài (`lặp 3 {đá, đi}, đi, đi, đi, nhảy`) → `HIT_CRATE@5`.
8. `l08` `...O.O.B.F`. Ban đầu `lặp 3 {đi}, cúi, đi, đi`: vòng 1–2 đúng, vòng 3 rơi hố (`FELL_IN_HOLE@3`). Lời giải `lặp 3 {nhảy}, cúi, đi, đi` ("nhảy cóc" qua cả đất lẫn hố, câu G3).
9. `l09` `#######/#S..#G#/###.#.#/###...#/#######`, nhìn `E`. Chương trình `tiến, tiến, rẽ phải, tiến, tiến, rẽ phải, tiến, tiến, rẽ trái, tiến, tiến` → `crash:HIT_WALL@3,3`. Thẻ: **Đụng tường góc dưới** ✔ · Ra được cửa (`win`) · Đụng góc trên (`@1,3`) · Đứng dưới cửa (`stop@2,5`).
10. `l10` `#######/###..G#/###.###/#S..###/#######`, nhìn `E`. Ban đầu `tiến, rẽ trái, tiến, tiến, tiến, rẽ phải, tiến, tiến` → `HIT_WALL@3,2`. Lời giải: đổi chỗ khối 2–3 (2 thao tác, thắng).
11. `l11` `..O..O..O.O.O.O....F` (20 ô, măng ở ô 16), `maxLoopDepth: 1`. Chỉ ghép đoạn 1 (`lặp 3 {đi, nhảy}`) rồi bấm Chạy: Măng dừng ở ô 9, ngay trước dãy hố sát nhau (`stop@9`), đúng lúc ghép đoạn 2. Gợi ý `enter`: "Ghép đoạn đầu rồi bấm Chạy xem."
    - **Đánh đổi sao:** `lặp 3 {đi, nhảy}, lặp 5 {nhảy}` (5 khối) thắng nhưng nhảy qua măng ở ô 16 (chỉ ⭐). `lặp 3 {đi, nhảy}, lặp 3 {nhảy}, lặp 4 {đi}` (7 khối) thắng và nhặt măng.
    - **VC ≤ 6** (không lặp lồng; 2,36 triệu chương trình ở cỡ 6): thắng nhỏ nhất 5 (32 cách, đều bỏ sót măng); không cách ≤ 6 khối nào vừa thắng vừa nhặt măng, nên `par` = 7. Cỡ 7 chưa vét cạn (≈ 4,5 × 10⁷ chương trình). Bỏ thùng để mất lối tắt "luôn đá"; cấm lặp lồng để mất lối tắt `lặp 2 {…}`.
12. `l12` `..O..O..O.B.F`. Ban đầu `lặp 2 {đi, nhảy}, đi, đi, đi` → `FELL_IN_HOLE@8`; sửa 2 → 3 → `HIT_BRANCH@10`; sửa đi → cúi → thắng. Gợi ý `run-end` + `lastReason: HIT_BRANCH`: "Lỗi mới! Lỗi cũ con sửa được rồi đó."
13. `l13` `########/#.....##/#.###.##/#.###G##/#.######/#S######/########`, nhìn `N`. Ban đầu `lặp 3 {tiến}, rẽ phải, lặp 4 {tiến}, rẽ trái, lặp 2 {tiến}` → `HIT_WALL@2,1`; sửa 3 → 4 → `HIT_WALL@1,5`; sửa rẽ trái → rẽ phải → thắng.
14. `l14` `..O..O.BBC..O.F`, chương trình `lặp 2 {đi, nhảy}, lặp 2 {cúi}, đá, lặp 2 {đi}, nhảy, đi` → `crash:FELL_IN_HOLE@12`. Thẻ: **Rơi vào hố cuối** ✔ · Tới nơi (`win`) · Đụng thùng gỗ (`crash:HIT_CRATE@9`) · Rơi hố thứ hai (`crash:FELL_IN_HOLE@5`).
15. `boss` `..O..O..O.C.BBB..F`, măng ở ô 4, 11, 15, `collectAll`. Ban đầu `lặp 2 {đi, nhảy}, đi, đi, lặp 3 {đi}, nhảy, đi, đi`. Mỗi lần sửa lộ lỗi tiếp theo:
    - số lần lặp 2 → 3 (lúc đầu `FELL_IN_HOLE@8`)
    - thiếu khối đá (`HIT_CRATE@10`)
    - đi → cúi trong vòng lặp (`HIT_BRANCH@12`)
    - nhảy → đi ở đoạn cuối (nhảy qua măng: `missed@17`)

    Lời giải `lặp 3 {đi, nhảy}, đá, đi, đi, lặp 3 {cúi}, đi, đi, đi` (11 khối, 4 thao tác, thắng). Hình đích: máy nhặt măng; vật phẩm vẫn là măng nên câu phản hồi `MISSED_ITEMS` ("Còn măng chưa nhặt kìa!") đúng với hình.

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
| 5 | `w04-l05` | practice | runner | bughunt | Hai nhánh ngược: ✔ chạy nhánh trên, ✘ chạy nhánh dưới | Chương trình tìm Bông bị ngược. Sửa nhé! (dấu chân) | đi, nhảy, lặp, nếu…nếu không, phía trước có | — | 5 | 1 | — |
| 6 | `w04-l06` | practice | runner | build | Chọn số lần lặp **đủ lớn**: nhảy 2 ô vẫn là 1 vòng, tới đích là dừng (2 bản đồ) | Đường dài quá! Lặp đủ để tới nơi. (dấu chân) | đi, nhảy, lặp, nếu…nếu không, phía trước có | 6 | 5 | — | — |
| 7 | `w04-l07` | practice | maze | predict | "Bên trái" là bên trái **của Măng** khi Măng nhìn xuống | Măng nhìn xuống. Đoán xem Măng đi đâu! (cửa ra) | (chỉ xem) | — | — | — | · |
| 8 | `w04-l08` | practice | maze | build | `nếu` (một nhánh) trong mê cung: thấy lối bên phải thì rẽ | Ra khỏi hang tối bên bờ suối. (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu, nếu…nếu không, có đường | 5 | 5 | — | — |
| 9 | `w04-l09` | practice | runner | parsons | Hai câu `nếu` nối tiếp: hỏi thùng trước, rồi mới hỏi hố | Thùng và hố chắn đường tới chỗ Bông. (dấu chân) | đi, nhảy, đá, lặp, nếu, nếu…nếu không, phía trước có | — | 8 | — | · |
| 10 | `w04-l10` | practice | runner | predict | Mỗi vòng chỉ chạy **một** nhánh; đếm vòng chứ không đếm ô | Đoán chỗ Măng dừng trên đường tìm Bông. (dấu chân) | (chỉ xem) | — | — | — | · |
| 11 | `w04-l11` | practice | maze | bughunt | Câu hỏi sai phía (bên trái ↔ bên phải) | Chương trình ra hang bị sai. Sửa giúp Măng! (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu, có đường | — | 5 | 1 | — |
| 12 | `w04-l12` | practice | runner | build | Hỏi theo cách khác: **phía trước có [ô trống]** thì đi, nếu không thì nhảy (2 bản đồ) | Hai con đường, một chương trình. Tìm Bông! (dấu chân) | đi, nhảy, lặp, nếu, nếu…nếu không, phía trước có | 6 | 5 | — | — |
| 13 | `w04-l13` | practice | maze | predict | Ngã ba: hỏi bên trái trước thì Măng rẽ trái | Ngã ba! Đoán xem Măng rẽ về phía nào. (dấu chân) | (chỉ xem) | — | — | — | · |
| 14 | `w04-l14` | practice | maze | parsons | Chương trình hai câu hỏi: rẽ trái **hoặc** rẽ phải | Lắp lại bản đồ dò đường của bác Cú. (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu, nếu…nếu không, có đường | — | 8 | — | · |
| 15 | `w04-l15` | practice | runner | bughunt | Khối "thuộc lòng" đúng ở bản đồ 1, sai ở bản đồ 2 (2 bản đồ) | Chương trình thuộc lòng lạc ở đường mới. Sửa nhé! (dấu chân) | đi, nhảy, lặp, nếu…nếu không, phía trước có | — | 5 | 1 | — |
| 16 | `w04-l16` | practice | maze | build | Tự ghép chương trình hai câu hỏi; một câu hỏi vẫn tới đích nhưng bỏ sót măng (2 bản đồ) | Hai mê cung, một chương trình. Tìm lối ra! (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu, nếu…nếu không, có đường | 9 | 8 | — | Nhặt măng ở ngõ cụt (bản đồ 1) |
| 17 | `w04-l17` | challenge | runner | build | Ba bản đồ, số khối đúng bằng `par`; phải nhặt chìa khóa trên đường (`rescue`, 3 bản đồ) | Bông đánh rơi chìa khóa. Nhặt hết trên đường! (dấu chân) | đi, nhảy, lặp, nếu, nếu…nếu không, phía trước có | 5 | 5 | — | — |
| 18 | `w04-l18` | challenge | maze | bughunt | Một khối rẽ sai trong chương trình hai câu hỏi (2 bản đồ) | Bản đồ dò đường sai một chỗ. Sửa nhé! (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, nếu, nếu…nếu không, có đường | — | 8 | 1 | — |
| 19 | `w04-l19` | challenge | runner | bughunt | 2 chỗ sai: lặp ít quá + câu hỏi ngược (2 bản đồ) | Chương trình tìm Bông sai hai chỗ. (dấu chân) | đi, nhảy, lặp, nếu…nếu không, phía trước có | — | 5 | 2 | — |
| 20 | `w04-boss` | boss | maze | build | "Cứu Bông": **một chương trình thắng 3 mê cung**, chìa khóa nằm ở nhánh bên trái (`rescue`, 3 bản đồ) | Lấy chìa khóa, mở lồng cứu Bông! (lồng) | tiến, rẽ trái, rẽ phải, lặp, nếu, nếu…nếu không, có đường | 9 | 8 | — | — |
| ✦ | `w04-creative` | creative | maze | creative | Tự ghép chương trình "biết nhìn" rồi thử trên các mê cung có sẵn | Thử chương trình của con trên mọi mê cung! | tất cả | — | — | — | · |

Khối mới và nơi xuất hiện lần đầu (luật 7):
- `nếu` và `phía trước có` ở `l01` (parsons, gợi ý `block:<type>` cho cả hai);
- `nếu … nếu không` ở `l02` (build, `toolbox:<type>`);
- `có đường` ở `l04` (build, `toolbox:<type>`).

Màn nhiều bản đồ đầu tiên là `l02`: bài giảng (thẻ 3–4) đã cho xem một chương trình chạy trên 2 bản đồ, nên đây không phải ý mới thứ hai. Chặng: 4 guided · 12 practice · 3 challenge · 1 boss. Mode: build 8 (kể cả boss) · parsons 3 · predict 4 · bughunt 5; build liền nhau nhiều nhất 2 (`l16`–`l17`). Boss là maze, dùng đủ khối maze mới (`nếu`, `nếu … nếu không`, `có đường`). Độ khó tới boss đi từng bậc: `l13` đoán ngã ba → `l14` ghép hình → `l16` tự ghép trên 2 bản đồ → boss (3 bản đồ + chìa khóa).

**Số lần lặp ở W4:** vì Măng **thắng ngay khi chạm cờ / đích** (A1), `lặp N lần` với N đủ lớn dùng như "lặp tới khi tới nơi"; `l06` dạy điều này (thanh khối để sẵn `lặp 3 lần`, gợi ý `NOT_AT_GOAL`: "Chưa tới nơi. Lặp thêm vòng nhé!"). Mọi bản đồ W4 cần ≤ 20 vòng (A7). **Mọi màn W4 có `lặp` đặt `maxInstances: { cq_repeat: 1 }` và `maxLoopDepth: 1`** (không lặp lồng, để dành W9; xem §5.5 R2).

Chi tiết từng màn:
1. `l01` `.O...O..F`, lời giải `lặp 6 {nếu phía trước có hố {nhảy}, đi}` (thắng). Xếp nhảy ra ngoài `nếu` → nhảy ở mọi vòng; xếp đi vào trong `nếu` → Măng đứng yên khi không có hố.
2. `l02` bản đồ 1 `..O.O...O.F`, bản đồ 2 `.O...O.O..F`. Lời giải `lặp 10 {nếu phía trước có hố {nhảy} nếu không {đi}}` (thắng cả hai). Cách của màn 1 (`nếu {nhảy}, đi`) rơi hố ở ô 4 bản đồ 1. **VC ≤ 5:** nhỏ nhất 5 khối, cả 28 lời giải đều có khối hỏi; "nhảy cóc" bị bản đồ 2 chặn.
3. `l03` `..O.F`, chương trình `nếu phía trước có hố {nhảy}, đi, đi, đi` → `crash:FELL_IN_HOLE@2`. Thẻ: **Rơi xuống hố** ✔ · Tới lá cờ (`win`) · Đứng sát mép hố (`stop@1`). Sân chơi hiện ✘ đúng **1 lần**.
4. `l04` `#######/##G...#/#####.#/#S....#/#######`, nhìn `E`. Lời giải `lặp 12 {nếu có đường phía trước {tiến} nếu không {rẽ trái}}` (thắng). **VC ≤ 5:** nhỏ nhất 5, mọi lời giải đều có khối hỏi (vd `lặp 9 {tiến, nếu có đường bên trái {rẽ trái}}` nếu thanh khối có `nếu`). Bản đồ cũ (đoạn 4/3/2 ô) bị lặp lồng 4 khối.
5. `l05` `..O..O.F`. Ban đầu `lặp 8 {nếu phía trước có hố {đi} nếu không {nhảy}}` → `FELL_IN_HOLE@2`. Sửa 1 thao tác: đổi câu hỏi "hố" → "ô trống" (thắng); đổi chỗ hai khối cũng thắng nhưng tốn 2 thao tác.
6. `l06` bản đồ 1 `..O.O...O.O..F`, bản đồ 2 `.O...O..O.O...F`. Thanh khối để sẵn `lặp 3 lần` → `stop@5` ở bản đồ 1. Lời giải `lặp 12 {nếu phía trước có hố {nhảy} nếu không {đi}}` (thắng cả hai). **VC ≤ 5:** nhỏ nhất 5, mọi lời giải đều có khối hỏi.
7. `l07` `#######/###S###/###.###/#G...##/###.###/#######`, nhìn `S`. Chương trình `lặp 5 {nếu có đường bên trái {rẽ trái}, tiến}` → `crash:HIT_WALL@3,4`. Thẻ: **Ngõ cụt bên phải** ✔ · Ra cửa bên trái (`win`) · Đi thẳng xuống (`crash:HIT_WALL@4,3`) · Đứng ở ngã tư (`stop@3,3`).
8. `l08` `#######/#S....#/#####.#/##G...#/#######`, nhìn `E`. Lời giải `lặp 12 {nếu có đường bên phải {rẽ phải}, tiến}` (thắng). **VC ≤ 5:** nhỏ nhất 5, mọi lời giải đều có khối hỏi.
9. `l09` `.C..O.C.O..F`, lời giải `lặp 12 {nếu phía trước có thùng {đá}, nếu phía trước có hố {nhảy} nếu không {đi}}` (thắng). Đổi thứ tự hai câu `nếu` → `HIT_CRATE@1`. Màn ghép hình nên lối tắt "luôn đá" (A4) không ảnh hưởng.
10. `l10` `.O.O..O..F`, chương trình `lặp 4 {nếu phía trước có hố {nhảy} nếu không {đi}}` → `stop@7`. Thẻ: **Sau hố thứ ba** ✔ · Sau hố thứ hai (`stop@4`, ngộ nhận "4 vòng = 4 ô") · Trước hố thứ ba (`stop@5`) · Tới nơi (`win`).
11. `l11` `#######/#S...##/####.##/##G..##/#######`, nhìn `E`. Ban đầu `lặp 12 {nếu có đường bên trái {rẽ phải}, tiến}` → `HIT_WALL@1,4`. Sửa "bên trái" → "bên phải" (thắng).
12. `l12` bản đồ 1 `.O.O..O.F`, bản đồ 2 `...O.O...F`. Lời giải `lặp 12 {nếu phía trước có ô trống {đi} nếu không {nhảy}}` (thắng). **VC ≤ 5:** nhỏ nhất 5, mọi lời giải đều có khối hỏi (có cả `lặp {nhảy, nếu phía trước có ô trống {đi}}`).
13. `l13` `#######/#....G#/###.###/###.###/###S###/#######`, nhìn `N` (Bông chờ ở đầu **bên phải** ngã ba). Chương trình `lặp 5 {nếu có đường bên trái {rẽ trái}, nếu có đường phía trước {tiến} nếu không {rẽ phải}}` → `stop@1,1`. Thẻ: **Cuối đường bên trái** ✔ · Tới chỗ Bông (`win`) · Đứng ở ngã ba (`stop@1,3`) · Giữa đường lên (`stop@2,3`).
14. `l14` `#######/#S.####/##...##/####.##/##G..##/#######`, nhìn `E`. Khối xáo trộn của `lặp 20 {nếu có đường bên trái {rẽ trái}, nếu có đường phía trước {tiến} nếu không {rẽ phải}}` (thắng).
15. `l15` bản đồ 1 `.O..O..F`, bản đồ 2 `..O...O.F`. Ban đầu `nhảy, lặp 12 {nếu phía trước có hố {nhảy} nếu không {đi}}`: thắng bản đồ 1, rơi hố ở bản đồ 2 (ô 2). Lời giải: xóa khối nhảy đầu (thắng cả hai).
16. `l16` bản đồ 1 `#########/#S....###/#####..##/#####.###/##G...###/#########` (nhìn `E`; măng ở `2,6`, một **ngõ cụt bên trái** của Măng ở chỗ rẽ), bản đồ 2 `#######/#....G#/#.#####/#.#####/#S#####/#######` (nhìn `N`). Lời giải như `l14` (8 khối, thắng cả hai, nhặt được măng). `maxInstances: { cq_repeat: 1 }`, `maxLoopDepth: 1`.
    - **Đánh đổi sao:** chương trình một câu hỏi, vd `lặp 10 {tiến, nếu có đường bên phải {rẽ phải}}` (5 khối), thắng cả hai nhưng không vào ngõ cụt (chỉ ⭐). Bản "hỏi bên phải trước" cũng vậy.
    - **VC ≤ 7** (2,7 triệu chương trình ở cỡ 7): có 75 cách 5 khối thắng, không cách nào nhặt măng; không cách ≤ 7 khối nào vừa thắng vừa nhặt măng, nên `par` = 8.
17. `l17` ba bản đồ `.O..O.O...O.O.F` (chìa khóa ô 3, 8), `.O.O..O...O.F` (ô 4, 7), `...O.O.O.F` (ô 1), `rescue`, hình đích dấu chân. Chưa có lồng ở màn này, để boss giữ được cảnh mở lồng cứu Bông. Lời giải `lặp 12 {nếu phía trước có hố {nhảy} nếu không {đi}}` thắng cả 3; "nhảy cóc" thua cả 3. **VC ≤ 5:** nhỏ nhất 5, mọi lời giải đều có khối hỏi.
18. `l18` bản đồ 1 `########/#S.#####/##.#####/##....##/#####.##/#G....##/########` (nhìn `E`), bản đồ 2 `#########/#.....G.#/#.#######/#.#######/#S#######/#########` (nhìn `N`). Ban đầu: chương trình của `l14` nhưng nhánh "nếu không" là **rẽ trái** → Măng xoay tại chỗ ở góc đầu tiên, hết vòng (`stop@1,1` cả hai). Sửa rẽ trái → rẽ phải (1 thao tác, thắng cả hai).
19. `l19` bản đồ 1 `..O.O..F`, bản đồ 2 `.O...O.O.F`. Ban đầu `lặp 5 {nếu phía trước có hố {đi} nếu không {nhảy}}` → rơi hố ở cả hai. Sửa 2 thao tác: câu hỏi "hố" → "ô trống" và 5 → 12 (thắng). Chỉ sửa một chỗ thì vẫn thua (đổi câu hỏi: hết vòng ở ô 8 bản đồ 2; chỉ đổi số: rơi hố).
20. `boss` 3 mê cung, nhìn `E`, `rescue`:
    - `#########/#S..#####/###.#####/###...###/###.#####/#G..#####/#########`, chìa khóa ở `3,5`, cuối nhánh cụt **bên trái** của Măng;
    - `########/#....G##/#.######/#.######/#...####/###.####/#S..####/########`, chìa khóa ở `4,2`;
    - `#########/#S.######/##.....##/######.##/##G....##/#########`, chìa khóa ở `2,4`.

    Lời giải `lặp 20 {nếu có đường bên trái {rẽ trái}, nếu có đường phía trước {tiến} nếu không {rẽ phải}}` thắng cả 3, cần ít nhất 16 vòng (≤ 20). Bản "hỏi bên phải trước" thắng bản đồ 2–3 nhưng không lấy được chìa khóa ở bản đồ 1. Chìa khóa làm ý của `l13` (hỏi bên nào trước) có ý nghĩa, không thêm ý mới. `maxInstances: { cq_repeat: 1 }`. VC: xem §5.5 R3.

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
1. "Cầu bị cuốn mất. Sông dài bao nhiêu? Không ai biết!"
2. "Lặp đến khi: trước mỗi vòng Măng hỏi. ✔ thì dừng."
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
| 5 | `w05-l05` | practice | maze | bughunt | Vòng lặp không dừng: khối tiến nằm **ngoài** vòng lặp | Măng đứng mãi không đi. Sửa giúp nhé! (bến đò) | tiến, lặp đến khi, đã tới đích? | — | 3 | 1 | — |
| 6 | `w05-l06` | practice | runner | build | Chờ bằng **ô trống**: nhảy qua dãy đá nổi đến khi phía trước là đất (2 bản đồ) | Nhảy qua dãy đá nổi sang bờ bên kia. (cờ) | đi, nhảy, lặp đến khi, phía trước có | 5 | 4 | — | — |
| 7 | `w05-l07` | practice | maze | predict | "Vòng lặp có dừng không?" | Măng có tới bến đò không? Đoán xem! (bến đò) | (chỉ xem) | — | — | — | · |
| 8 | `w05-l08` | practice | runner | bughunt | Chờ sai thứ: điều kiện hỏi cành thay vì hố (2 bản đồ) | Măng chờ nhầm thứ nên rơi xuống nước. Sửa nhé! (cờ) | đi, nhảy, lặp đến khi, phía trước có | — | 5 | 1 | — |
| 9 | `w05-l09` | practice | maze | build | Tiến đến khi có lối rẽ, rẽ, rồi tiến đến khi tới đích (2 bản đồ) | Tìm lối rẽ xuống bến đò. (bến đò) | tiến, rẽ trái, rẽ phải, lặp đến khi, có đường, đã tới đích? | 8 | 7 | — | — |
| 10 | `w05-l10` | practice | runner | parsons | Khối **đã tới nơi?**; `nếu` nằm trong `lặp đến khi` | Lắp lại chương trình đưa Bông sang bờ bên kia. (cờ) | đi, nhảy, lặp đến khi, nếu…nếu không, phía trước có, đã tới nơi? | — | 6 | — | · |
| 11 | `w05-l11` | practice | runner | predict | Điều kiện chỉ được hỏi **giữa** các vòng: thân 2 khối đi quá mép hố | Măng có dừng kịp trước nước không? (cờ) | (chỉ xem) | — | — | — | · |
| 12 | `w05-l12` | practice | maze | bughunt | Không dừng vì nhánh "nếu không" trống: mỗi vòng phải làm Măng thay đổi | Măng kẹt ở góc đường. Sửa giúp nhé! (bến đò) | tiến, rẽ trái, rẽ phải, lặp đến khi, nếu…nếu không, có đường, đã tới đích? | — | 6 | 1 | — |
| 13 | `w05-l13` | practice | runner | bughunt | "Lặp 20 lần" không đủ cho đường dài: đổi sang `lặp đến khi đã tới nơi` (2 bản đồ) | Lặp 20 lần chưa sang tới bờ. Sửa nhé! (cờ) | đi, nhảy, lặp, lặp đến khi, nếu…nếu không, phía trước có, đã tới nơi? | — | 6 | 2 | — |
| 14 | `w05-l14` | practice | maze | build | Mê cung xoắn dài hơn 20 vòng: `nếu` trong `lặp đến khi đã tới đích` (2 bản đồ) | Đường vòng quanh hồ rất dài. Tìm lối ra! (cửa ra) | tiến, rẽ trái, rẽ phải, lặp, lặp đến khi, nếu…nếu không, có đường, đã tới đích? | 9 | 7 | — | Nhặt măng trong hốc bên đường (bản đồ 1) |
| 15 | `w05-l15` | practice | runner | bughunt | Thân vòng lặp 2 khối: đúng ở bản đồ 1, đi quá ở bản đồ 2 (2 bản đồ) | Đúng ở suối này, rơi ở suối kia. Sửa nhé! (cờ) | đi, nhảy, lặp đến khi, phía trước có | — | 5 | 1 | — |
| 16 | `w05-l16` | practice | maze | parsons | Chương trình hai câu hỏi của W4 trong `lặp đến khi đã tới đích` | Lắp lại bản đồ dò đường qua bãi lau. (cửa ra) | tiến, rẽ trái, rẽ phải, lặp đến khi, nếu, nếu…nếu không, có đường, đã tới đích? | — | 9 | — | · |
| 17 | `w05-l17` | challenge | maze | build | Mê cung dài rẽ hỗn hợp, hơn 20 vòng: tìm chương trình **gọn hơn** cách hai câu hỏi (2 bản đồ) | Bãi lau rộng, đường rất dài. Tìm lối ra! (cửa ra) | như màn 16 + lặp | 9 | 7 | — | — |
| 18 | `w05-l18` | challenge | runner | bughunt | 2 lỗi: điều kiện sai + thân vòng lặp thừa khối (2 bản đồ) | Chương trình qua sông sai hai chỗ. (cờ) | đi, nhảy, lặp đến khi, phía trước có | — | 5 | 2 | — |
| 19 | `w05-l19` | challenge | runner | predict | Đá thùng "đến khi phía trước có hố": vòng lặp có dừng không? | Măng đá thùng. Vòng lặp có dừng không? (cờ) | (chỉ xem) | — | — | — | · |
| 20 | `w05-boss` | boss | runner | build | "Qua sông không biết trước độ dài": 3 bản đồ (một bản 39 ô), nhiệm vụ `escort` | Qua sông đón Gà con rồi đưa em về nhà! (bạn → nhà) | đi, nhảy, lặp đến khi, nếu…nếu không, phía trước có, đã tới nơi? | 6 | 6 | — | — |
| ✦ | `w05-creative` | creative | runner | creative | Tự làm "máy qua sông" và thử trên các đường có sẵn | Làm máy qua sông cho cả làng! | tất cả | — | — | — | · |

Khối mới và nơi xuất hiện lần đầu (luật 7):
- `lặp đến khi` ở `l01` (build, `toolbox:<type>`);
- `đã tới đích?` ở `l04` (build, `toolbox:<type>`);
- `đã tới nơi?` (khối đề xuất `runner_at_goal`, câu G5) ở `l10` (parsons, `block:<type>`).

Chặng: 4 guided · 12 practice · 3 challenge · 1 boss. Mode: build 7 (kể cả boss) · parsons 3 · predict 4 · bughunt 6; build liền nhau nhiều nhất 1. Nghiệm thu P2-14: `l05`, `l12` là `bughunt` có lỗi vòng lặp không dừng; `l07`, `l19` là `predict` "vòng lặp có dừng không?". Boss là runner, dùng đủ khối runner mới (`lặp đến khi`, `đã tới nơi?`).

**Khi nào thanh khối W5 có `lặp n lần`:** vì Măng thắng ngay khi chạm đích (A1), `lặp 20 lần {…}` làm được việc của `lặp đến khi đã tới đích` khi đường cần ≤ 20 vòng, lại ít hơn 1 khối. Nên `lặp n lần` chỉ có trong thanh khối ở màn mà đường **cần hơn 20 vòng** (`l13` bughunt, `l14`, `l17`), để bé tự thấy "lặp 20 lần không đủ". Các màn khác dạy `lặp đến khi` qua điều kiện **làm vòng lặp dừng thật** (phía trước có hố, có đường bên phải…) rồi chạy tiếp khối sau. Boss **không** có `lặp n lần`. Không dạy lặp lồng (để dành W9): mọi màn W5 đặt `maxLoopDepth: 1`; `l14`, `l17` đặt thêm `maxInstances: { cq_repeat: 1, cq_repeat_until: 1 }`, boss `{ cq_repeat_until: 1 }` (§5.5 R2).

Chi tiết từng màn:
1. `l01` bản đồ 1 `..OF`, bản đồ 2 `.......OF`. Lời giải `lặp đến khi phía trước có hố {đi}, nhảy` (thắng cả hai). **VC ≤ 4:** chỉ có đúng lời giải này. Bản đồ 2 dài 9 ô để "nhảy mãi" rơi hố ở bản đồ 1.
2. `l02` `..O..F`, lời giải `lặp đến khi phía trước có hố {đi}, nhảy, đi, đi` (thắng). Xếp 2 khối đi vào trong vòng lặp → `FELL_IN_HOLE@2`.
3. `l03` `.O..F`, chương trình `lặp đến khi phía trước có hố {đi}, nhảy, đi, đi` → `win` (vòng lặp chạy 0 vòng). Thẻ: **Tới lá cờ** ✔ · Rơi xuống hố (`crash:FELL_IN_HOLE@1`, ngộ nhận "đi trước rồi mới hỏi") · Đứng trước cờ (`stop@3`) · Đứng yên chỗ cũ (`stop@0`).
4. `l04` bản đồ 1 `########/#S....G#/########`, bản đồ 2 `########/#S..G..#/########` (nhìn `E`). Lời giải `lặp đến khi đã tới đích {tiến}` (thắng). **VC ≤ 3:** chỉ có lời giải này.
5. `l05` `#######/#S...G#/#######`. Ban đầu `lặp đến khi đã tới đích {}` rồi `tiến` nằm **dưới** vòng lặp → `TIMEOUT`. Sửa: kéo `tiến` vào trong (1 thao tác, thắng). Gợi ý `TIMEOUT`: "Trong vòng lặp có khối nào đưa Măng đi không?".
6. `l06` bản đồ 1 `.O.O.O.F`, bản đồ 2 `.O.O.O.O.O.F`. Lời giải `lặp đến khi phía trước có ô trống {nhảy}, đi` (4 khối, thắng cả hai). **VC ≤ 4:** chỉ có lời giải này.
7. `l07` `#######/#S...G#/#######`, chương trình `lặp đến khi đã tới đích {rẽ phải}, tiến` → `TIMEOUT`. Thẻ: **Quay vòng mãi** ✔ (`timeout`, T9) · Tới bến đò (`win`) · Đụng tường (`crash:HIT_WALL@1,1`) · Đứng yên chỗ cũ (`stop@1,1`).
8. `l08` bản đồ 1 `...O.F`, bản đồ 2 `.....O.F`. Ban đầu `lặp đến khi phía trước có cành {đi}, nhảy, đi` → `FELL_IN_HOLE@3` / `@5`. Sửa ô chọn "cành" → "hố" (thắng cả hai).
9. `l09` bản đồ 1 `#######/#S....#/####.##/####.##/####G##/#######`, bản đồ 2 `##########/#S.......#/######.###/######.###/######.###/######G###/##########` (nhìn `E`, hành lang kéo dài quá chỗ rẽ; đoạn xuống dài 4 ô, khác bản đồ 1). Lời giải `lặp đến khi có đường bên phải {tiến}, rẽ phải, lặp đến khi đã tới đích {tiến}` (7 khối, thắng). `maxLoopDepth: 1`. **VC ≤ 7:** cỡ ≤ 6 không có lời giải; cỡ 7 có **đúng 1** lời giải (chính là lời giải trên). Bản trước có 18 cách 7 khối, kể cả không cần vòng thứ hai.
10. `l10` `..O.O..O.F`, khối xáo trộn của `lặp đến khi đã tới nơi {nếu phía trước có hố {nhảy} nếu không {đi}}` (thắng). Gợi ý `block:runner_at_goal`. Đích là cờ ở bờ bên kia (chưa về nhà: nhà để dành cho boss).
11. `l11` `..O..F`, chương trình `lặp đến khi phía trước có hố {đi, đi}, nhảy, đi` → `crash:FELL_IN_HOLE@2`. Thẻ: **Rơi xuống hố** ✔ · Tới lá cờ (`win`) · Đứng sát mép hố (`stop@1`).
12. `l12` `#######/#S..###/###.###/##G.###/#######` (nhìn `E`). Ban đầu `lặp đến khi đã tới đích {nếu có đường phía trước {tiến} nếu không {}}` → `TIMEOUT` ở góc đầu tiên. Sửa: thêm `rẽ phải` vào nhánh "nếu không" (thắng).
13. `l13` bản đồ 1 (40 ô) `..O...O.O....O..O.O...O....O.O..O......F`, bản đồ 2 (21 ô) `...O.O.....O..O.O...F`. Ban đầu `lặp 20 {nếu phía trước có hố {nhảy} nếu không {đi}}`: thắng bản đồ 2, dừng ở ô 28 của bản đồ 1 (`NOT_AT_GOAL`). Sửa 2 thao tác: khối `lặp` → `lặp đến khi` + cắm `đã tới nơi?` (thắng cả hai). Đích là cờ ở bờ bên kia. Gợi ý `NOT_AT_GOAL`: "Lặp 20 lần vẫn chưa tới. Lặp đến khi nào?".
14. `l14` bản đồ 1 xoắn ốc có **hốc cụt** ở `6,4` (măng trong hốc): `##########/#S.......#/########.#/#....G##.#/#.######.#/#.######.#/#.##.###.#/#........#/##########`, bản đồ 2 `##########/#S......##/#######.##/#######.##/#G......##/##########` (nhìn `E`). Lời giải ý chính `lặp đến khi đã tới đích {nếu có đường phía trước {tiến} nếu không {rẽ phải}}` (6 khối, thắng cả hai, bỏ qua hốc). `lặp 20 {…}` cùng thân dừng giữa đường ở bản đồ 1. `maxLoopDepth: 1`, `maxInstances { cq_repeat: 1, cq_repeat_until: 1 }`.
    - Hốc cụt chặn lối tắt lặp lồng `lặp N {tiến, lặp đến khi có đường bên phải {tiến}, rẽ phải}` (6 khối) mà bản trước có (`maxInstances` không chặn được lồng một `lặp` với một `lặp đến khi`).
    - **Đánh đổi sao:** cách 6 khối không vào hốc (chỉ ⭐).
    - **VC ≤ 7** (không lặp lồng; vài triệu chương trình chương trình ở cỡ 7): cỡ 6 có 6 cách thắng, đều là **một** vòng `lặp đến khi` và đều bỏ sót măng. Cỡ 7 có 2 cách vừa thắng vừa nhặt măng, đều là kiểu "lắc" `lặp đến khi đã tới đích {nếu có đường phía trước {tiến, rẽ phải} nếu không {rẽ trái}}`, nên `par` = 7. Cách "hỏi bên phải trước" (9 khối) cũng nhặt được măng (⭐⭐ với `maxBlocks` 9). Xem câu G19.
15. `l15` bản đồ 1 `...O.F`, bản đồ 2 `......O.F`. Ban đầu `lặp đến khi phía trước có hố {đi, đi}, nhảy, đi`: thắng bản đồ 1, `FELL_IN_HOLE@6` ở bản đồ 2. Sửa: bỏ 1 khối đi trong thân (thắng cả hai).
16. `l16` `########/#S..####/###.####/###...##/#####.##/#G....##/########` (nhìn `E`). Khối xáo trộn của `lặp đến khi đã tới đích {nếu có đường bên trái {rẽ trái}, nếu có đường phía trước {tiến} nếu không {rẽ phải}}` (thắng).
17. `l17` bản đồ 1 `##########/#S..#....#/###.#.##.#/#...#.#..#/#.###.#.##/#.....#.G#/##########`, bản đồ 2 `##########/#S.......#/#######.##/#G..#...##/###.#.####/###...####/##########` (nhìn `E`). Cách hai câu hỏi của `l16` (9 khối) thắng cả hai, nhưng **không phải nhỏ nhất**: thử thách là tìm chương trình gọn hơn. `lặp 20 {…}` (cách hai câu hỏi) dừng giữa đường ở cả hai bản đồ. `maxLoopDepth: 1`, `maxInstances { cq_repeat: 1, cq_repeat_until: 1 }`.
    - **VC ≤ 7** (không lặp lồng; vài triệu chương trình chương trình ở cỡ 7): cỡ ≤ 6 không có; cỡ 7 có 4 cách, đều kiểu "lắc", vd `lặp đến khi đã tới đích {nếu có đường phía trước {tiến, rẽ trái} nếu không {rẽ phải}}`. Nên `par` = 7, `maxBlocks` = 9. Màn không có `starGoals` nên giữ luật sao cũ: cách hai câu hỏi (9 khối, vượt `par`) chỉ được ⭐; ⭐⭐⭐ cần cách "lắc" 7 khối.
    - **Không có mục tiêu ⭐:** đã thử đặt măng ở mọi ô mà cách hai câu hỏi đi qua, và ở mọi hốc một ô mở thêm vào bản đồ; không chỗ nào mà cách hai câu hỏi lấy được còn cả 4 cách "lắc" đều bỏ sót. Vì vậy màn này là thử thách tối ưu số khối, không phải đánh đổi theo măng. Câu G19 hỏi HLV có chấp nhận ⭐⭐⭐ cần cách "lắc" khó nghĩ ra không.
18. `l18` bản đồ 1 `...O.F`, bản đồ 2 `......O.F`. Ban đầu `lặp đến khi phía trước có cành {đi, đi}, nhảy, đi` → `FELL_IN_HOLE@3` / `@6`. Sửa "cành" → "hố" và bỏ 1 khối đi (2 thao tác).
19. `l19` `.C..O.F`, chương trình `lặp đến khi phía trước có hố {đá}, nhảy` → `TIMEOUT` (đá đổ thùng xong, phía trước là đất, không bao giờ là hố). Thẻ: **Đá mãi không dừng** ✔ (`timeout`) · Tới lá cờ (`win`) · Đụng thùng (`crash:HIT_CRATE@1`) · Rơi xuống hố (`crash:FELL_IN_HOLE@4`). Dựa vào luật A4.
20. `boss` `escort`, Gà con đứng ở ô 4 / 7 / 22:
    - bản đồ 1 `...O..O.O...F` (13 ô);
    - bản đồ 2 `..O.O.O.O.O..O.F` (16 ô);
    - bản đồ 3 `....O...O.O.O.....O..O.O.O...O...O.O..F` (39 ô).

    Lời giải `lặp đến khi đã tới nơi {nếu phía trước có hố {nhảy} nếu không {đi}}` (thắng cả 3; Măng đứng ở mọi ô đất nên luôn đón được Gà con). **VC ≤ 6** với `maxInstances { cq_repeat_until: 1 }` (thanh khối không có `lặp n lần`): cỡ ≤ 5 không có; cỡ 6 có 6 cách. Ngoài lời giải (hỏi "hố" hoặc "ô trống") còn "lặp đến khi phía trước có cành" và "lặp đến khi phía trước có thùng": đường không có cành, thùng nên vòng lặp chạy tới đích. Bằng `par`, chấp nhận (câu G7). Chỉ có hố (D3).

### 5.4 Tính năng cần cho P2-11 / P2-12 (từ ba bảng trên)

| # | Tính năng | Task | Màn cần |
|---|---|---|---|
| T1 | Khối `nếu` (1 nhánh) và `nếu … nếu không` (2 nhánh) là **hai khối riêng trong thanh khối**, không cần bánh răng. Đề xuất hai type `cq_if` / `cq_if_else`, để luật 7 thấy lần đầu của từng khối. Nếu chọn `controls_if` + `extraState`, luật 7 phải phân biệt theo `extraState`. **Không** có "nếu không nếu", khối "không" (phủ định), "lặp khi" (while) ở W4–W5 | P2-11 | W4 từ `l01`; W5 `l10`, `l12`–`l14`, `l16`, `l17`, boss |
| T2 | Khối `lặp đến khi` (`controls_whileUntil` khóa UNTIL hoặc type `cq_repeat_until`): hỏi điều kiện **trước** mỗi vòng | P2-11 | W5 từ `l01` |
| T3 | Khối hỏi runner `phía trước có [hố/cành/thùng/ô trống]` (đã có): `HOLE`, `CRATE` (W4 `l09`), `CLEAR` (W4 `l05`, `l12`, `l19`; W5 `l06`), `BRANCH` (W5 `l08`, `l18`: điều kiện sai) | P2-11 | như cột trái |
| T4 | Khối hỏi maze `có đường [phía trước/bên trái/bên phải]` (đã có), theo hướng **của Măng** | P2-11 | W4 `l04`, `l07`, `l08`, `l11`, `l13`, `l14`, `l16`, `l18`, boss; W5 `l09`, `l12`, `l14`, `l16`, `l17` |
| T5 | `đã tới đích?` (đã có). Với luật A1, lượt chạy kết thúc ngay khi chạm đích, nên khối này **không bao giờ trả ✔ trong lúc chạy**; `lặp đến khi đã tới đích` thực chất dừng nhờ luật thắng. Ghi rõ trong bài giảng ("Tới nơi là thắng ngay") và `glossary.md` | P2-11 | W5 `l04`, `l05`, `l07`, `l09`, `l12`, `l14`, `l16`, `l17` |
| T6 | **Khối mới đề xuất** `runner_at_goal` "đã tới nơi?", cùng tính chất với T5 (câu G5). Gọi "tới nơi" (thuật ngữ chung trong `glossary.md`) chứ không "tới cờ", vì đích có thể là cờ, nhà, lồng… (T17) | P2-11 | W5 `l10`, `l13`, boss |
| T7 | Event `sense{blockId, value}` → khối hỏi sáng ✔/✘ mỗi lần được đọc | P2-11 | W4 `l03` (✘ đúng 1 lần), `l07`, `l10`; mọi màn có khối hỏi |
| T8 | `TIMEOUT` ở màn chơi: phát lại tối đa vài giây (câu G13) rồi hoạt ảnh "chóng mặt"; gợi ý tầng 0 theo `lastReason: TIMEOUT` | P2-11 | W5 `l05`, `l12` |
| T9 | **Khóa đáp án `timeout`** cho `predictAnswer` runner và maze + hình thẻ đáp án (Măng chóng mặt). Hiện chỉ có `win` / `stop@` / `missed@` / `crash:` | P2-11 | W5 `l07`, `l19` |
| T10 | Điểm chỉ gợi ý **`step`** (nút Từng bước): thêm vào `HintTargetSchema` (hiện có `toolbox:`, `block:`, `run`, `capacity`, `stage`) | P2-11 | W3 `l02`, `l03` |
| T11 | `variants` (1–2 bản đồ thêm) cho `build` và `bughunt`; vật phẩm `rescue`/`escort` (T17) khai báo **theo từng bản đồ** | P2-12 | W4 `l02`, `l06`, `l12`, `l15`, `l16`, `l17` (3), `l18`, `l19`, boss (3); W5 `l01`, `l04`, `l06`, `l08`, `l09`, `l13`, `l14`, `l15`, `l17`, `l18`, boss (3) |
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

  Vì vậy câu hỏi về cành và thùng chỉ ở `parsons`, `predict`, `bughunt` (W4 `l09`; W5 `l08`, `l18`, `l19`). Mỗi màn hỏi về hố phải có bản đồ chặn "nhảy cóc" (luật R1). Phân nhánh nhiều hướng nằm ở mê cung.
- **D4.** W4 dùng `lặp N lần` với N đủ lớn (dựa vào A1), được dạy ở `l06`. Mọi bản đồ W4 ≤ 20 vòng.
- **D5.** Boss W4 là mê cung "hai câu hỏi" 8 khối, có `l13` đoán → `l14` ghép hình → `l16` tự ghép đi trước.
- **D6.** W5 dạy `lặp đến khi` bằng điều kiện làm vòng lặp dừng thật trước, rồi mới tới `đã tới đích?` / `đã tới nơi?`.
- **D7.** Không dạy lặp lồng ở W3–W5 (luật R2, `maxLoopDepth: 1`).
- **D8.** Có `predict` ở chặng `challenge` (W3 `l14`, W5 `l19`): thử thách đọc chương trình khó.
- **D9.** Không dùng điều kiện thắng `config.goal.collectAll` / `items` cùng `lặp đến khi đã tới đích` trong mê cung (A5): Măng đi xuyên đích khi còn thiếu vật phẩm nên vòng lặp không dừng. Mục tiêu ⭐ `starGoals` `collectAll` thì **được** (không chặn đích, W5 `l14`). W5 boss dùng `escort` trên runner, nơi lượt chạy kết thúc ngay ở cờ.
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

## 6. Thế giới 6–10 (khung, chi tiết hóa khi tới giai đoạn xây)

| Thế giới | Mục tiêu học | Ngộ nhận nhắm tới | Boss |
|---|---|---|---|
| 6 Thành Phố Robot | Điều khiển robot theo ô, dò line, gắp/thả, chọn chiến thuật nhiệm vụ trong thời gian giới hạn | "Robot luôn đi chính xác"; làm hết mọi nhiệm vụ mới tốt | Đề AIROC ngẫu nhiên, 180 s, về CRL |
| 7 Chợ Đếm Số | Biến lưu giá trị thay đổi; đếm, cộng, so sánh | Biến là hằng số; tên biến là giá trị | Đếm và chia măng đều cho 3 nhà |
| 8 Xưởng Phép Thuật | Gói chuỗi lệnh thành hàm, dùng lại, thêm tham số | Hàm chạy ngay khi định nghĩa | Vẽ cả ngôi làng bằng 3 hàm |
| 9 Tháp Họa Sĩ | Lặp lồng nhau, góc ngoài của đa giác | Vòng trong chạy 1 lần | Vẽ bông hoa tuyết |
| 10 Học Viện Thuật Toán | So sánh các cách giải, sắp xếp, tìm kiếm, chọn đường ngắn nhất | Cách nào chạy được là tốt | Robot chọn thứ tự nhiệm vụ tối ưu |

## 7. Quy tắc soạn chương trình học
`content:check` tự kiểm các luật có dấu ⚙ (luật 7–8 ở `architecture/content-model.md` §5).
- Mỗi màn chỉ giới thiệu **tối đa 1 ý mới**.
- ⚙ Khối mới (lần đầu trong toàn bộ chương trình học) xuất hiện lần đầu ở màn `guided` hoặc `practice` (**không** ở `challenge`/`boss`, vì `challenge` là tùy chọn), và màn đó có gợi ý tầng 0 chỉ vào khối: `toolbox:<type>` (mode build) hoặc `block:<type>` (mode parsons).
- ⚙ **Giới thiệu khối mới bằng 3 thứ** (luật cố định, HLV 03/10/2026): (1) một câu cho bé nói đúng khối làm gì (Măng có đi không, mấy ô, cái gì đổi) trong gợi ý `enter` "Khối mới: …"; (2) một ví dụ chạy được (thẻ `demo` của bài "Khối mới" `beforeLevel` hoặc bài mở đầu); (3) tooltip chính xác. Bảng tra và chi tiết: `conventions/content-authoring.md` §5.1. `content:check` cảnh báo (luật 7) khi màn giới thiệu khối hành động không có gợi ý nào nhắc tên khối.
- ⚙ **Không quá 3 màn `build` liền nhau.** Mỗi cách chơi `build`, `parsons`, `predict`, `bughunt` xuất hiện ≥ 1 lần trong mỗi thế giới.
- Màn `challenge` không giới thiệu khái niệm hoặc khối mới.
- Boss dùng **mọi khối của kiểu game của boss** đã được giới thiệu trong thế giới, và kể tiếp câu chuyện.
- `par ≤ maxBlocks ≤ par + 2` khi có `maxBlocks`.
