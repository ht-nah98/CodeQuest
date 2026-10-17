# ADR-0026: Bước sức của mê cung (`stepLimit`): mỗi `tiến` tốn 1 bước, hết bước là dừng, số bước chỉ vào state khi màn có giới hạn

- **Trạng thái:** Đề xuất
- **Ngày:** 16/10/2026 (bản nháp của P5; chốt sau P5-03, khi có số đo vét cạn)

## Bối cảnh
Ngộ nhận chính của Thế giới 10 là "cách nào chạy được là tốt" (`product/curriculum.md` §6.5). Trong mê cung, ý đó là **đường ngắn nhất**: hai chương trình cùng tới cờ, một chương trình đi ít bước hơn.

Hiện chưa có cách nào để màn mê cung chấm "ít bước":
- `maxActions` / `maxSteps` là chặn vòng lặp vô tận, bé không thấy. Câu hết lượt là `TIMEOUT` chung.
- `starGoals` chỉ đọc trạng thái cuối. ADR-0017 đã ghi: "Về đích với ≤ N bước" cần bộ đếm bước trong state, và vét cạn mất khả năng gộp trạng thái.
- Hộp đếm bước + `countGoal` thì bé tự khai số, nên gian được (bỏ bớt `tăng`).
- `robotlab` đã có đồng hồ trong state (ADR-0021). W6 đã dạy "đường ngắn kịp giờ" trên robot. Mê cung thì chưa có gì tương tự.

Ràng buộc:
- hơn 100 màn mê cung W1–W9 không được đổi kết quả hay `par`;
- tất định, headless.

## Quyết định
- **Config maze:** `stepLimit?: number` (1–99), theo từng bản đồ (`variants` được khác số).
- **State:** `steps` (số `tiến` đã đi). Chỉ có khi config có `stepLimit`. Màn không có thì state y như cũ, nên `stateKey`, snapshot và `par` của W1–W9 không đổi.
- **Luật:**
  - mỗi `maze_forward` **đi được** tốn 1 bước. `tiến` đâm tường thì dừng `crash` như cũ;
  - thứ tự kiểm khi `tiến`: tường trước (`HIT_WALL` như hôm nay), rồi mới tới bước sức. Hết bước mà phía trước là tường thì vẫn là `HIT_WALL`;
  - rẽ và câu hỏi không tốn bước;
  - `tiến` khi `steps = stepLimit` → `crash` / `OUT_OF_STEPS`. Măng **đứng tại chỗ**, event `tired{at}`;
  - chạm `G` ở bước cuối vẫn thắng (maze thắng giữa chừng như cũ).
- **Khóa đoán:** `crash:OUT_OF_STEPS@r,c`, theo định dạng crash của maze.
- **HUD** "Còn 9 bước": chữ ở `i18n/vi.ts`. Sân chơi đọc `stepLimit` và đếm event `move`.
- **Vét cạn:** `steps` vào state, nên trạng thái nhân tối đa `stepLimit + 1` lần. Mê cung ≤ 12 × 12, `stepLimit` ≤ ~40. P5-03 đo trên 2 màn phác (`l15` 1 bản đồ, `l17` 3 bản đồ có câu hỏi + phép). Quá ngân sách thì thêm **so sánh trội**: cùng ô, cùng hướng, ít bước hơn thì thắng. Không được thì `parUnproven`.
- **Kiểm chứng** (`content:check` luật 28):
  - `stepLimit` ≥ số bước lời giải dùng trên mọi bản đồ;
  - luật soạn S2 (`curriculum.md` §6.5): mỗi màn có `stepLimit` khai báo "cách chạy được nhưng chậm", và test kiểm cách đó dừng `OUT_OF_STEPS`.
- **`feedback.json`:** `OUT_OF_STEPS` "Măng mệt rồi! Hết bước."

## Hệ quả
- **Được:**
  - mê cung dạy được "đường ngắn nhất" mà bé nhìn thấy (HUD), không gian lận được;
  - cùng một ý "ngân sách" với lượt hỏi của kệ sách (ADR-0025) và đồng hồ robot (ADR-0021).
- **Mất:** màn có `stepLimit` vét cạn chậm hơn. Không ảnh hưởng màn không có.
- **Việc phải làm:**
  - `game-kinds.md` §3.2;
  - `content-model.md` (trường mới, luật 28);
  - snapshot W1–W9 (test hồi quy, P5-03).

## Phương án đã cân nhắc
- **Mục tiêu sao "≤ N bước" (`starGoals`):** chỉ thêm sao, không làm bé thua. "Chạy được là tốt" vẫn được ⭐. Và vẫn phải đếm bước trong state.
- **Hộp đếm bước + `countGoal`:** bé tự khai số, gian được.
- **Dùng `maxActions` cho bé thấy:** `maxActions` đếm cả câu hỏi và event khác, bé không đoán được. Nó cũng là chặn an toàn chung, không nên mang nghĩa luật chơi.
- **Rẽ cũng tốn bước:** gần với robot (rẽ 1 s) nhưng bé phải đếm hai thứ. Mê cung của bé là "ô đi được". Không chọn (J8).

## Kết quả đo
(Chưa có. P5-03 điền.)
