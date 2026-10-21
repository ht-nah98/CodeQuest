# ADR-0028: Hai khóa trong một app, chung một tài khoản

- **Trạng thái:** Chấp nhận
- **Ngày:** 21/10/2026

## Bối cảnh

Huấn luyện viên dạy hai thứ cho cùng một nhóm bé:

- **CodeQuest** — tư duy lập trình, bản đồ phiêu lưu, 10 thế giới, chơi bằng Blockly.
- **Leanbot** — robot thật để đi thi AIROC 2026, dịch từ khóa "Synapse City Primary" của
  Pythaverse.

Hai khóa khác nhau về mọi mặt: Leanbot không có màn chơi, không có lời giải để chấm, không có
`par`; phần lớn việc của bé là cầm robot, cắm dây, nhìn đèn, gõ lệnh kiểm tra. Nhưng chúng
dùng chung một nhóm bé, một máy, một người dạy.

Yêu cầu nói nguyên văn: *"khi vào localhost:5173 sẽ có 2 trang: 1 là trang Leanbot, 2 là trang
CodeQuest. Dùng cùng 1 tài khoản để đăng nhập"*. Và: *"Chả nhẽ cứ mỗi 1 kiến thức mới tôi cần
làm thêm 1 web à?"*

Ba cách đã cân nhắc, hai cách đã **làm thử rồi bỏ** trong cùng ngày:

1. **Khóa Leanbot thành một thế giới của CodeQuest.** Bỏ: giáo án Leanbot không phải màn chơi,
   nhét vào `worlds/` thì phải bẻ cong cả `world.json`, luật mở khóa, `par` và `content:check`.
2. **Một trang web riêng cho Leanbot.** Đã dựng thử ở cổng 8099. Bỏ: hai địa chỉ, hai tài
   khoản, hai nơi lưu tiến độ — và mỗi môn mới lại thêm một web nữa.
3. **Một app, hai khóa, một tài khoản.**

## Quyết định

Chọn cách 3.

- Đăng nhập xong, bé vào **`/hub`** chứ không vào thẳng `/map`. Màn này có đúng hai lựa chọn:
  Leanbot và CodeQuest. `ProfilePickScreen` và `NewProfileScreen` chuyển hướng tới `/hub`.
- `/map` và toàn bộ CodeQuest **không đổi một dòng nội dung nào**. Leanbot không nằm trong
  `worlds/`, không xuất hiện trên bản đồ, không đụng tới sao, coin hay luật mở khóa của
  CodeQuest.
- Bài Leanbot là **dữ liệu trong `content/leanbot/*.json`**, schema zod
  `LeanbotLessonSchema`, nạp qua alias `@content` và kiểm bằng `content:check` — đúng quy tắc
  3 và 4 của AGENTS.md, giống hệt bài giảng của CodeQuest.
- Schema **giới hạn độ dài từng trường**, vì bài học cho bé lớp 4 mà để tự do thì sẽ thành
  trang chữ: `lines` tối đa 3 câu × 120 ký tự, `title` 60, `steps` tối đa 8 bước. Một màn phải
  có ít nhất một thứ để xem ngoài tiêu đề; có `image` thì bắt buộc có `alt`.
- Hai khóa **dùng chung bộ giao diện**: `TopBar`, `Panel`, `Button`, bảng màu và font của
  `src/ui`. Bé không thấy mình đang ở hai phần mềm khác nhau.
- Ô tích "con làm được rồi" trên màn Leanbot nằm trong `localStorage` của máy đó: nó là ghi
  chú của bé cho chính bé, không phải tiến độ để báo cáo.

## Hệ quả

**Được:**

- Thêm một môn mới = thêm một thẻ ở `/hub`, không phải thêm một web.
- Nội dung Leanbot được `content:check` gác: sai schema, sai id, thiếu ảnh đều đỏ trước khi
  tới tay bé.
- Markdown trong `docs/product/leanbot-airoc/` vẫn là bản của huấn luyện viên và là nguồn để
  dựng PDF; JSON trong `content/leanbot/` là bản cho bé. Hai bản cho hai người đọc khác nhau.

**Mất:**

- Thêm một lần bấm trước khi vào bản đồ CodeQuest.
- Hai bản nội dung cho cùng một bài (markdown cho thầy, JSON cho bé) phải tự giữ cho khớp.
  Hiện chưa có bộ kiểm nào bắt được khi hai bản lệch nhau.
- Giáo án markdown dài hơn bản JSON rất nhiều, nên bản cho bé **không phủ hết** giáo án. Phần
  nào bỏ ra là lựa chọn của người viết bài, không phải thiếu sót của công cụ.

## Phương án đã cân nhắc

**Leanbot thành một thế giới của CodeQuest** — `worlds/` có schema cho màn chơi: `levelIds`,
luật mở khóa theo tỉ lệ sao, `par`, lời giải chạy được trong CI. Bài Leanbot không có thứ nào
trong đó. Nhét vào thì vừa hỏng mô hình màn chơi, vừa làm `content:check` phải học thêm một
ngoại lệ cho mỗi luật.

**Một web riêng cho Leanbot** — đã dựng thử và nhìn thấy ngay chỗ hỏng: tài khoản riêng, tiến
độ riêng, và mỗi kiến thức mới lại sinh thêm một địa chỉ cho huấn luyện viên phải nhớ.

**Nhúng giáo án markdown vào app và vẽ ra** — đã thử trong cùng ngày (ADR-0027, đã bỏ). Hỏng
vì lý do nội dung chứ không phải kỹ thuật: 17 giáo án viết cho **người lớn đứng lớp**, mỗi bài
vài nghìn chữ. Bé lớp 4 lướt dọc trang chữ đó thì không học được gì.
