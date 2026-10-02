# 01 — Phân tích Blockly & Blockly Games: ta học được gì

> Nguồn đã đọc trực tiếp (clone ngày 01/10/2026):
> - `RaspberryPiFoundation/blockly` — monorepo, core **v13.3.0**, kèm ~40 plugin chính chủ trong `packages/plugins/`
> - `google/blockly-games` — mã nguồn trang blockly.games (Puzzle, Maze, Bird, Turtle, Movie, Music, Pond)
> - `RaspberryPiFoundation/blockly-samples` — các ví dụ (`interpreter-demo`, `max-blocks-demo`, `headless-demo`…)
>
> Cả ba đều **Apache-2.0** → được dùng thương mại, sửa đổi, miễn giữ thông báo bản quyền + LICENSE.

---

## 1. Phân biệt rõ hai thứ anh gửi

| | Blockly (repo anh gửi) | Blockly Games (blockly.games) |
|---|---|---|
| Bản chất | **Thư viện** trình soạn thảo kéo-thả | **Ứng dụng** game dựng trên Blockly |
| Có bài học không? | Không. Chỉ là "bàn phím" để ghép khối | Có 7 game × ~10 màn |
| Vai trò với ta | **Dùng làm nền** (npm `blockly`) | **Tham khảo thiết kế** + học pattern |

→ Ta **không fork** cả hai. Ta cài `blockly` qua npm và tự xây phần game, bài giảng, phần thưởng, UI.

---

## 2. Những pattern đáng học từ Blockly Games (đọc từ `appengine/maze/src/main.js`)

### 2.1. "Chạy trước – phát lại sau" (run-then-replay) ⭐ quan trọng nhất
```
Khối Blockly → sinh JavaScript (mỗi lệnh kèm block_id)
            → chạy trong JS-Interpreter (sandbox) tối đa 10.000 tick
            → mỗi lệnh move/turn ghi vào log: ['east', 'block_id_xyz']
            → reset sân → animate() lấy từng phần tử log:
                 di chuyển nhân vật + workspace.highlightBlock(id)
```
Lợi ích: biết **kết quả trước** khi animate (thắng → chạy nhanh 100ms/bước, thua → chậm 150ms để trẻ nhìn kỹ chỗ sai), tô sáng đúng khối đang chạy, vòng lặp vô hạn không treo trình duyệt.
→ **Ta giữ nguyên ý tưởng này**, nhưng nâng cấp: log có cấu trúc (JSON event), hỗ trợ **tua lại / chạy từng bước / chỉnh tốc độ**.

### 2.2. 4 loại kết quả chạy
`SUCCESS`, `FAILURE` (chạy xong nhưng chưa tới đích), `TIMEOUT` (lặp vô hạn), `ERROR` (đâm tường).
→ Mỗi loại cần một **phản hồi riêng, thân thiện**, không chỉ "Sai rồi".

### 2.3. Giới hạn số khối (`MAX_BLOCKS`) để "ép" khái niệm mới
`[∞, ∞, 2, 5, 5, 5, 5, 10, 7, 10]` theo level. Level 3 chỉ cho 2 khối với đường thẳng dài → **bắt buộc** dùng vòng lặp. Blockly core có sẵn `maxBlocks` và `maxInstances` (theo loại khối) + `workspace.remainingCapacity()`.
→ Ta biến nó thành **tiêu chí sao**: giải được = ⭐, giải ≤ số khối tối ưu = ⭐⭐…

### 2.4. Gợi ý theo ngữ cảnh (`levelHelp`)
Gợi ý bật lên dựa trên **trạng thái workspace**: chưa có khối nào → chỉ vào thanh công cụ; có 2 cụm khối rời → nhắc "nối thành một"; hết chỗ mà chưa dùng `repeat` → chỉ vào khối lặp. Nhưng Blockly Games **hard-code từng level bằng if/else** (≈180 dòng).
→ Ta làm thành **luật gợi ý khai báo (declarative)** trong dữ liệu level, để người soạn bài không phải code.

### 2.5. Toolbox tăng dần theo level
Mỗi level chỉ mở đúng các khối cần. Trẻ không bị ngợp.

### 2.6. Thiết kế màn chơi có chủ đích sư phạm
Ghi chú ở Maze level 4: đường đi **kéo dài quá điểm xuất phát và đích** để trẻ hiểu mục tiêu là *đến đích*, không phải *đi hết mọi ô* ("mowing the lawn").
→ Mỗi level của ta cần ghi rõ **ngộ nhận (misconception) mà nó nhắm tới**.

### 2.7. Các cách chấm bài khác nhau theo game
- Maze: kiểm tra **trạng thái cuối** (nhân vật ở đích chưa).
- Turtle: so **từng pixel** ảnh vẽ với ảnh đáp án (sai lệch alpha > 64 → tính là khác).
- Puzzle: so **cấu trúc khối** (ghép đúng ảnh – tên – đặc điểm).
→ Ta thiết kế interface `GoalChecker` chung, mỗi loại game cài đặt riêng.

### 2.8. Skin nhân vật (Pegman / Astro / Panda)
Đổi sprite + âm thanh + kiểu ngã khi đâm tường. → Đây chính là **móc phần thưởng cosmetic** của ta.

### 2.9. Cầu nối sang code chữ
Màn chúc mừng hiện **mã JavaScript tương ứng** + "bạn vừa viết N dòng code". Pond cho chuyển qua lại **khối ↔ JavaScript**.
→ Tầng cao của ta: cho xem/đối chiếu code Python/JS → chuẩn bị lên lớp lớn.

---

## 3. Blockly v13 cung cấp sẵn những gì cho ta

| Tính năng | Dùng để làm gì | Vị trí |
|---|---|---|
| Renderer **`zelos`** | Khối tròn, to, kiểu Scratch — hợp trẻ em | `core/renderers/zelos` |
| **Theme** tùy biến | Màu khối theo khái niệm, font, bộ màu mù màu | `core/theme`, plugin `theme-deuteranopia/tritanopia` |
| `maxBlocks`, `maxInstances` | Giới hạn khối / tiêu chí sao | `blockly_options.ts` |
| `readOnly` workspace | Hiện "code mẫu", bài **đoán kết quả** | `blockly_options.ts` |
| `highlightBlock(id)` | Tô sáng khối khi chạy | `workspace_svg.ts` |
| JSON serialization | Lưu bài làm dở, lưu đáp án | `core/serialization` |
| Custom block + generator | Khối "đi tới", "nhặt", "tô màu"… sinh JS | `core/generator.ts` |
| **Tiếng Việt** sẵn | Nhãn khối mặc định | `msg/json/vi.json` |
| Keyboard nav + ARIA | Hỗ trợ trẻ khó dùng chuột | `core/keyboard_nav`, `block_aria_composer.ts` |
| `Toast` / `hints.ts` | Thông báo nhẹ | `core/toast.ts` |
| **Headless mode** | Chạy Blockly trên Node → **tự động kiểm tra mọi level giải được** | blockly-samples `headless-demo` |

Plugin chính chủ nên dùng:
- `@blockly/field-grid-dropdown` — dropdown dạng lưới **có ảnh** (chọn hướng bằng mũi tên, chọn màu)
- `@blockly/field-slider`, `@blockly/field-angle` — kéo thanh trượt / xoay góc trực quan (Turtle)
- `@blockly/content-highlight` — **làm mờ xung quanh, chiếu sáng vùng cần chú ý** (tutorial)
- `@blockly/disable-top-blocks` + `Events.disableOrphans` — khối rời bị xám → trẻ hiểu "khối phải nối vào"
- `@blockly/zoom-to-fit`, `@blockly/workspace-backpack`, `@blockly/suggested-blocks`

Thư viện chạy code: **`js-interpreter`** (npm, v6.0.2) — cùng thư viện Blockly Games dùng, chạy từng bước, sandbox.

---

## 4. Blockly Games còn thiếu gì (vì sao "chưa đủ" như anh nói)

| Điểm yếu | Hệ quả với trẻ | Ta làm khác thế nào |
|---|---|---|
| **Không có bài giảng** — vào là chơi | Trẻ làm được nhưng không hiểu *vì sao* | Mỗi khái niệm có thẻ bài giảng + ví dụ + mascot giải thích |
| Mỗi game ~10 màn, rời rạc | Không có lộ trình, nhảy cóc độ khó | Bản đồ thế giới nhiều tầng, khái niệm nối tiếp |
| **Không phần thưởng**, chỉ ✓ hoàn thành | Thiếu động lực quay lại | Sao, coin, huy hiệu, skin, chuỗi ngày học |
| Gợi ý hard-code, ít | Bí là bỏ | Gợi ý 3 tầng, mua bằng coin |
| Chỉ có 1 kiểu bài: "lập trình để giải" | Đơn điệu | 8+ kiểu: đoán kết quả, sửa lỗi, ghép, vẽ, sắp xếp… |
| UI 2012, desktop, chữ nhiều | Trẻ chưa đọc giỏi bị nản | Tablet-first, ít chữ, có giọng đọc, animation |
| Tiến độ chỉ ở localStorage | Đổi máy là mất | Tài khoản phụ huynh, đồng bộ |
| Code Closure/`goog.require` cũ | Khó tái sử dụng trực tiếp | Viết mới bằng React + TS, chỉ **mượn ý tưởng** |
| Không có góc phụ huynh | Anh không theo dõi được bé yếu ở đâu | Dashboard: khái niệm nào bé hay sai, dùng gợi ý nhiều |
