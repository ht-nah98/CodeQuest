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
| 4 | `w04-nga-ba` | 🔀 Ngã Ba Quyết Định | Điều kiện nếu / nếu-không, cảm biến | nếu, nếu-không, phía trước có…?, có đường…? | runner, maze | 20 | GĐ 2 |
| 5 | `w05-song-cho-doi` | 🌊 Sông Chờ Đợi | Lặp có điều kiện | lặp đến khi, đã tới đích? | maze, runner | 20 | GĐ 2 |
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
| 3 | `w01-l03` | guided | runner | build | Khối **nhảy** qua hố | đi, nhảy | — | 3 | — |
| 4 | `w01-l04` | practice | runner | predict | Đoán Măng dừng ở đâu | (chỉ xem) | — | — | — |
| 5 | `w01-l05` | practice | runner | build | Hai hố | đi, nhảy | — | 5 | — |
| 6 | `w01-l06` | practice | runner | parsons | Thứ tự quan trọng: xếp lại 5 khối | đi, nhảy | — | 5 | — |
| 7 | `w01-l07` | practice | runner | build | Khối **cúi** dưới cành tre | đi, nhảy, cúi | — | 4 | — |
| 8 | `w01-l08` | practice | runner | predict | Đoán Măng vướng ở đâu | (chỉ xem) | — | — | — |
| 9 | `w01-l09` | practice | runner | bughunt | Thiếu một khối nhảy | đi, nhảy, cúi | — | 6 | 1 |
| 10 | `w01-l10` | practice | runner | build | Khối **đá** thùng gỗ | đi, nhảy, cúi, đá | — | 5 | — |
| 11 | `w01-l11` | practice | runner | bughunt | Hai khối đặt sai thứ tự | đi, nhảy, cúi, đá | — | 6 | 2 |
| 12 | `w01-l12` | practice | maze | build | Mê cung đầu tiên: **tiến**, **rẽ** | tiến, rẽ trái, rẽ phải | — | 4 | — |
| 13 | `w01-l13` | challenge | runner | build | Đường dài đủ mọi chướng ngại | đi, nhảy, cúi, đá | 12 | 10 | — |
| 14 | `w01-l14` | challenge | maze | bughunt | Mê cung chữ Z có 2 lỗi | tiến, rẽ trái, rẽ phải | — | 8 | 2 |
| 15 | `w01-boss` | boss | runner | build | "Mang măng về làng": nhặt 3 măng (`collectAll`); nhảy qua măng là bỏ sót | đi, nhảy, cúi, đá | 11 | 9 | — |
| ✦ | `w01-creative` | creative | runner | creative | Sân chơi tự do trên đường chạy có sẵn (chưa có trình xây đường) | tất cả | — | — | — |

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
| 16 | `w02-l16` | challenge | runner | build | Đường 18 ô chỉ được 5 khối: vòng lặp + hố cuối ⁴ | 5 | 5 |
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
- Mọi `par` đã được kiểm bằng vét cạn trên thanh khối của màn (số lần lặp 2–20, cho phép cả lặp lồng): không có lời giải nào ít khối hơn.

## 5. Thế giới 3–10 (khung, chi tiết hóa khi tới giai đoạn xây)

| Thế giới | Mục tiêu học | Ngộ nhận nhắm tới | Boss |
|---|---|---|---|
| 3 Xưởng Sửa Lỗi | Đọc chương trình người khác, chạy từng bước để tìm chỗ sai, sửa ít nhất | "Sai thì xóa hết làm lại" | Sửa máy nhặt măng có 4 lỗi |
| 4 Ngã Ba Quyết Định | Dùng cảm biến + nếu/nếu-không để một chương trình chạy đúng trên **nhiều** bản đồ | "Nếu" là kiểm tra một lần cho cả chương trình | Một chương trình thắng 3 bản đồ khác nhau |
| 5 Sông Chờ Đợi | Lặp đến khi điều kiện đúng; tránh lặp vô hạn | Vòng lặp tự dừng; điều kiện kiểm tra ở cuối | Qua sông không biết trước độ dài |
| 6 Thành Phố Robot | Điều khiển robot theo ô, dò line, gắp/thả, chọn chiến thuật nhiệm vụ trong thời gian giới hạn | "Robot luôn đi chính xác"; làm hết mọi nhiệm vụ mới tốt | Đề AIROC ngẫu nhiên, 180 s, về CRL |
| 7 Chợ Đếm Số | Biến lưu giá trị thay đổi; đếm, cộng, so sánh | Biến là hằng số; tên biến là giá trị | Đếm và chia măng đều cho 3 nhà |
| 8 Xưởng Phép Thuật | Gói chuỗi lệnh thành hàm, dùng lại, thêm tham số | Hàm chạy ngay khi định nghĩa | Vẽ cả ngôi làng bằng 3 hàm |
| 9 Tháp Họa Sĩ | Lặp lồng nhau, góc ngoài của đa giác | Vòng trong chạy 1 lần | Vẽ bông hoa tuyết |
| 10 Học Viện Thuật Toán | So sánh các cách giải, sắp xếp, tìm kiếm, chọn đường ngắn nhất | Cách nào chạy được là tốt | Robot chọn thứ tự nhiệm vụ tối ưu |

## 6. Quy tắc soạn chương trình học
`content:check` tự kiểm các luật có dấu ⚙ (luật 7–8 ở `architecture/content-model.md` §5).
- Mỗi màn chỉ giới thiệu **tối đa 1 ý mới**.
- ⚙ Khối mới (lần đầu trong toàn bộ chương trình học) xuất hiện lần đầu ở màn `guided` hoặc `practice` (**không** ở `challenge`/`boss`, vì `challenge` là tùy chọn), và màn đó có gợi ý tầng 0 chỉ vào khối: `toolbox:<type>` (mode build) hoặc `block:<type>` (mode parsons).
- ⚙ **Không quá 3 màn `build` liền nhau.** Mỗi cách chơi `build`, `parsons`, `predict`, `bughunt` xuất hiện ≥ 1 lần trong mỗi thế giới.
- Màn `challenge` không giới thiệu khái niệm hoặc khối mới.
- Boss dùng **mọi khối của kiểu game của boss** đã được giới thiệu trong thế giới, và kể tiếp câu chuyện.
- `par ≤ maxBlocks ≤ par + 2` khi có `maxBlocks`.
