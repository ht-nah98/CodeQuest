# Khảo sát nền tảng Pythaverse và khóa SYNAPSE CITY

Tài liệu tham khảo, **không phải nguồn chuẩn**. Ghi lại những gì đo được trực tiếp trên nền
tảng Pythaverse ngày **21/10/2026**, để sau này kiểm chứng lại hoặc phát hiện khi nền tảng đổi.

Giáo trình dựng từ khảo sát này: [`../product/leanbot-airoc-vi.md`](../product/leanbot-airoc-vi.md)

## 1. Cách lấy dữ liệu

Đăng nhập sẵn trong Chrome của HLV, điều khiển qua CDP (`--remote-debugging-port`) trên một
**bản sao** hồ sơ Chrome, không đụng tới phiên đang mở. Không dùng `--headless`.

| Thứ cần lấy | Lấy ở đâu |
|---|---|
| Cấu trúc khóa | `li.activity` trên trang `course/view.php?id=1437` |
| Nội dung bài | `window.H5PIntegration.contents['cid-*'].jsonContent` trên trang `h5p/embed.php` |
| Ảnh slide | `…/pluginfile.php/**1**/core_h5p/content/<cid>/images/…` (lưu ý: context **1**, không phải 0) |
| Danh sách khối | `Blockly.Blocks` + `getToolboxItems()` trong trình soạn khối |
| Nhãn khối | Dựng từng khối trong một `Blockly.Workspace` rời rồi gọi `block.toString()` |
| Chương trình mẫu | `git.pythaverse.space/ptvairoc/Synapsecity_Primary` (kho công khai) |
| Luật thi | `airoc.space/airoc` |

Dữ liệu thô nằm trong thư mục tạm của phiên làm việc, **không commit**: 19 file JSON nội dung,
670 ảnh slide, 5 chương trình mẫu, 16 file bóc tách theo slide.

## 2. Cấu trúc khóa

**SYNAPSE CITY: Robotics & AI Explorer** — `learn.pythaverse.space/course/view.php?id=1437`
(Moodle, tên hiển thị "Plearn LMS"). 21 mục, **26 hoạt động** tính tiến độ.

- 1 diễn đàn thông báo
- 19 hoạt động **H5P** (`H5P.InteractiveBook 1.9`) — toàn bộ nội dung bài học
- 6 bài nộp (`assign`)
- 1 chứng chỉ (`customcert`)

Mỗi bài H5P là một "sách tương tác" gồm 3–5 chương, mỗi chương là một `H5P.CoursePresentation`.
**Nội dung nằm trong ảnh nền slide 1920×1080**, không phải văn bản — nên không dịch máy được,
phải đọc từng ảnh.

| | Số lượng |
|---|---|
| Ảnh slide tổng cộng | 670 |
| Bài nhiều slide nhất | Bài 8 (90 slide, 3 chương × 30) |
| Bài ít slide nhất | Bài 3 và Bài 13 (26) |
| Câu hỏi `H5P.SingleChoiceSet` lấy được | 43 |

Ba bài **Getting Started** không có slide — chỉ gồm video YouTube (19 video) kèm mục "Check
Your Understanding".

## 3. Bộ công cụ

| Công cụ | Địa chỉ | Ghi chú |
|---|---|---|
| PLearn (LMS) | `learn.pythaverse.space` | Moodle |
| Student Workspace | `pythaverse.space/student-workspace/dashboard` | Tiến độ, danh sách khóa |
| Blockly Editor (robot thật) | `ide.pythaverse.space/lbeditor/` | Sinh C++ Arduino |
| Blockly Editor (robot ảo) | `ide.pythaverse.space/lbeditor-python-simulation/index.html` | Sinh Python `pyLeanbot` |
| PIDE | `ide.pythaverse.space/#/code` | Soạn C++, nạp xuống robot |
| PGit | `git.pythaverse.space` | Kho code |
| PNote | `note.pythaverse.space` | Jupyter, tối đa 100 người cùng lúc |
| Bản Sao Số | `digitaltwin.pythaverse.space/experience` | Sân mô phỏng 3D |
| Gateway | `meta.pythaverse.space/gateway?lang=en` | Nối robot thật vào sân ảo |
| Teachable Machine | `teachablemachine.withgoogle.com` | Của Google, dùng ở Bài 5–9 |

Bốn địa chỉ đầu đã kiểm trả HTTP 200 ngày 21/10/2026.

## 4. Trình soạn khối

**Blockly Editor v0.8.0**, dựa trên [BlocklyDuino / STudio4Education] của Sébastien CANET
(GNU GPL v3). Không phải sản phẩm Pythaverse viết từ đầu.

Danh mục toolbox: Logic · Loops · Math · Variables · Functions · Arduino (In/Out, Serial) ·
**Leanbot** (Motion, Gripper, RGB Leds, Sound, Sensors, IRLine). Trình robot ảo có thêm
Text, Lists, Print.

### 4.1 Cơ chế ngôn ngữ

Menu `#languageMenu` có `en` và `vi`. Mỗi khối Leanbot tồn tại **hai bản**: `X` và `X_vi`.
Nhãn **không** được nung vào lúc nạp file ngôn ngữ — `blocklyduino/blocks/leanbot/leanbot.js`
giữ mỗi khối dưới dạng một hàm `(id, lang)` chỉ đọc `Blockly.Msg.Leanbot[lang][id]` khi
`LeanbotBlocks_begin()` chạy:

```js
Blockly.Blocks[id]         = block(id, Code.LANG);
Blockly.Blocks[id + "_vi"] = block(id, "vi");
```

Đây là chỗ móc vào để việt hóa — xem [`../../tools/lbeditor-vi/README.md`](../../tools/lbeditor-vi/README.md).

### 4.2 Hiện trạng bản dịch tiếng Việt

48 khối Leanbot trong `blocklyduino/msg/leanbot_vi.js`:

| | Số khối |
|---|---|
| Dịch xong | 13 |
| Dịch dang dở (nửa Anh nửa Việt) | 5 |
| Còn nguyên tiếng Anh | 30 |

Các khối còn tiếng Anh gồm toàn bộ nhóm **Gripper**, **IRLine**, **Sensors**, **RGB Leds**
và phần lớn nhóm **Mission** — tức những khối dùng nhiều nhất khi thi.

Đáng chú ý: **năm chương trình mẫu chính thức của Pythaverse đều dùng khối `_vi`**, tức
chế độ tiếng Việt là chế độ được khuyến nghị, chỉ là bản dịch làm chưa xong.

## 5. Chương trình mẫu chính thức

Kho công khai `git.pythaverse.space/ptvairoc/Synapsecity_Primary` (3 commit, lần cuối 14/04/2026).
Định dạng `.bduino` là XML của Blockly.

| File | Số khối | Nội dung |
|---|---|---|
| `FollowLine_EN.bduino` | 56 | Hàm `followLine`: đọc 4 mắt → `switch` → quẹo |
| `Containment.bduino` | 122 | Nhiệm vụ 1 |
| `Neutralizer.bduino` | 131 | Nhiệm vụ 2 |
| `Analyst` | 142 | Nhiệm vụ 3 |
| `Fullmision` | 194 | Cả ba nhiệm vụ |

Nạp lại vào trình soạn khối rồi sinh code cho thấy kiến trúc ba tầng: tầng bám vạch
(`runFollowLine`, `followLineUntilJunction`, `goToJunction`, `followLineMultipleJunctions`),
tầng chuyển động (`Forward`, `Backward`, `Rotate`), tầng nhiệm vụ (`loop`).

Hai điều rút ra khác với mong đợi:

1. **Không có đồng hồ trong code.** Giới hạn 2 phút chỉ được giữ bằng cách chạy nhanh
   (mọi lệnh dùng 2000 bước/giây), không có lệnh nào đọc `LbMission.elapsedMillis`.
2. **Không dùng cảm biến siêu âm** trong bất kỳ chương trình nhiệm vụ nào, dù slide Bài 13
   dạy logic siêu âm. Robot định vị hoàn toàn bằng đếm ngã tư.

Cách đọc 4 mắt cảm biến thành một số (`2L=8, 0L=4, 1R=2, 3R=1`, đen = 1) **không được viết
ở đâu cả** — là suy ra từ bảng `case` trong code, khớp với mọi giá trị xuất hiện. Cần HLV
xác nhận trên robot thật.

## 6. Luật AIROC 2026

Từ `airoc.space/airoc`. Đối chiếu và cập nhật vào
[`../product/airoc-2026.md`](../product/airoc-2026.md).

| Hạng | Tuổi | Robot | Ngôn ngữ | Tham số khối | Thử thách |
|---|---|---|---|---|---|
| Explorer | 6–9 | 1 × Standard | Blockly | 6 | Màu biết trước |
| **Creator** | **9–12** | **1 × Standard** | **Blockly** | **8** | **Màu biết trước** |
| Innovator | 11–15 | 2 × IoT | Blockly / C++ / Python | 9 | Màu ẩn, **cần AI** |
| Master | 15–18 | 2 × IoT | Blockly / C++ / Python | 10 | AI + khối bí ẩn |

Sa bàn 4 ft × 4 ft (1,2192 m), lưới 3×3, 8 khu A–H + CRL, khối ô nhiễm 5 màu
(đỏ, xanh dương, xanh lá, vàng, tím), 6 kho trung hòa ở mép, CRL ở cuối sa bàn.
Khối gỗ 1,5 × 2,5 × 7,5 cm.

Điểm: khoanh vùng **45**/khối · trung hòa **160**/cặp đúng màu · phân tích **100**/khối
(khối bí ẩn **150**, chỉ hạng Master) · về CRL **40**/robot. Lượt **2 phút**, làm nhiệm vụ
theo thứ tự nào cũng được.

Phân định thứ hạng khi bằng điểm: điểm chuẩn hóa cao nhất → **độ ổn định giữa hai lượt** →
số lần thử ít nhất → thời gian ngắn nhất.

Lịch: mở đăng ký 01/07/2026 · hạn đăng ký 08/11/2026 · hạn nộp hạng Open 12/11/2026 ·
tập huấn 28/11/2026 · **chung kết quốc tế 29/11/2026** tại Nhà thi đấu tỉnh Phú Thọ.

## 7. Lỗi trong khóa gốc

Phát hiện khi đọc 670 slide. Ghi lại để lúc dạy không bị bé hỏi vặn, và để báo Pythaverse.

### Sai số liệu / mâu thuẫn
- **Bài 11** slide LEARN 19 gọi `Trái 30 / Phải −30 rpm` là "quay trái 90°", nhưng slide 15
  và 17 của cùng chương nói cấu hình đó là quay **phải**.
- **Bài 11** slide RESOLVE 06 bảo đổi 30 thành **60** vòng/phút, vượt giới hạn 59 của chính bài 1.
- **Bài 16** slide RESOLVE 04 tính "hoàn hảo" = 345 điểm (1 cặp trung hòa), slide LEARN 06
  tính 505 điểm (2 cặp). Hai slide mâu thuẫn.
- **Bài 13** thử thách 3 ghi 550/665 trong khi tổng điểm tối đa là 505.
- **Bài 14** slide dạy khối `Set Servo [Port] to [Angle]` — **khối này không tồn tại** trong
  48 khối Leanbot. Khối thật là `LbGripper.moveTo` / `open` / `close`.
- **Bài 14** slide dạy "mở → tiến chậm → đóng → chờ 1 giây" và dùng siêu âm; chương trình
  mẫu không có cả hai. Câu hỏi kiểm tra chấm theo slide, không theo mẫu.
- **Bài 15** slide dạy "lượt về rẽ ngược chiều lượt đi"; chương trình mẫu lượt về **toàn rẽ phải**.
- **Bài 4** slide Learn 06 chú thích hướng quẹo **ngược** với chương trình mẫu.

### Sai tên, sai nhãn
- **Bài 7** slide bìa ghi "Lesson 1: Invisible Data" thay vì Lesson 7.
- **Bài 8** slide 00 ghi "Lesson 1", slide 25 ghi "Lesson 3 Complete".
- Nhiều bài: mô tả **Khu B trùng Khu A**, **CRL trùng Khu E**, **Khu H bị gọi là "start zone"**
  dù CRL mới là nơi xuất phát.
- **Bài 1** slide Growth 06 nhắc khối "Move To" — bài không hề dạy khối đó.
- **Bài 2** slide Growth 05 ghi "4 districts" trong khi sa bàn có 9 khu.
- **Bài 5** slide Engage 10 ghi "A cute dog" nhưng ảnh là lưới ảnh mèo.
- Lỗi chính tả trên slide: "onlu" (Bài 1), "Practice Activites" (Bài 14), "To vs. Small" (Bài 7).

### Khác
- **Bài 11** không hề nhắc "Mini Project 2 / Autonomous Driving License" dù Plearn gắn dự án
  đó vào bài này.
- **Bài 6** dừng trước bước huấn luyện ("DO NOT PRESS TRAIN YET!") nhưng Plearn gắn
  "Mini Project 1: The AI Data Trainer" vào.
- **Bài 6** slide quiz **hiện sẵn đáp án** bằng dấu tích xanh.
- **Bài 9** là bộ slide "Dancing with AI" dùng mẫu Slidesgo, dạy bằng **Scratch**, không liên
  quan Leanbot. Có một đoạn JavaScript vượt xa trình độ lớp 4.
- Nhiều ảnh minh họa do AI vẽ có **chữ loạn, không đọc được** (rõ nhất ở Bài 1 slide Learn 04).

## 8. Điều cần biết về quyền riêng tư

Bài 6, 7, 8, 9 dùng **webcam và micro** gửi dữ liệu lên Teachable Machine của Google. Bài 9
quay **khuôn mặt trẻ em**. Quy tắc vàng số 8 của repo cấm thu thập dữ liệu cá nhân của trẻ,
nhưng quy tắc đó áp cho **CodeQuest**; các bài này chạy trên nền tảng của Pythaverse và Google,
ngoài tầm kiểm soát của repo.

Việc cần làm trước khi dạy Bài 6–9: HLV xin phép phụ huynh, và ưu tiên cách làm **không quay
mặt** (Bài 6 có thể dùng ảnh tải lên thay vì webcam; Bài 9 có thể dùng dáng người thay vì
khuôn mặt).

## 9. Những gì chưa kiểm được

1. **Chưa chạy thử Bản Sao Số và Gateway.** Các bước chép từ slide và tài liệu Gateway
   (cập nhật 16/10/2023).
2. **Chưa cắm robot thật.** Chưa đọc được firmware, hiệu chỉnh cảm biến đang lưu, mức pin.
3. **Chưa xem hai khóa còn lại** trong tài khoản: "SYNAPSE CITY: Smart Robotics & Data AI"
   (39 hoạt động) và "SYNAPSE CITY: Advanced AI & Multi-Agent Systems" (35 hoạt động).
4. **Chưa xem ba khóa miễn phí**, trong đó có "Leanbot Learning Tools with Blockly Programming"
   — nhiều khả năng là tài liệu tra cứu khối lệnh.
5. **Nội dung câu hỏi H5P của một số bài chưa lấy được** (hiện là phần tương tác, không nằm
   trong ảnh slide).
