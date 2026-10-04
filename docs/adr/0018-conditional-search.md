# ADR-0018: Khối điều kiện riêng, event `sense`, và vét cạn `par` có điều kiện

- **Trạng thái:** Chấp nhận
- **Ngày:** 04/10/2026

## Bối cảnh
Thế giới 4–5 (`product/curriculum.md` §5.2–§5.5) cần `nếu`, `nếu … nếu không`, `lặp đến khi` với khối hỏi, cảm biến runner `đã tới nơi?`, khối hỏi sáng ✔/✘ khi được hỏi (T7), vòng lặp không dừng ra `TIMEOUT` tất định (T14), giới hạn lồng vòng lặp `maxLoopDepth` (T16b), và `npm run par` hiểu tất cả những thứ đó cùng `maxInstances` (T16). Vét cạn của ADR-0015 chỉ phát lại chương trình tuần tự: mỗi khối lệnh được ghi lời gọi API một lần rồi phát lại, nên không biết gì về giá trị cảm biến trả về.

## Quyết định
- **Khối riêng** `cq_if`, `cq_if_else`, `cq_repeat_until` (engine, `blocks/common.ts`), ô điều kiện là input `COND`, không mutator (`blockly-integration.md` §5). Runner thêm cảm biến `runner_at_goal` (`atGoal(id)`).
- **Ô điều kiện trống không chạy:** `runLevel` trả `error` / `EMPTY_CONDITION` (mã engine mới, có câu trong `feedback.json`). Blockly đọc ô trống là `false`: `lặp đến khi ◇` trống sẽ thành "lặp mãi" và thắng nhờ luật "chạm đích là thắng" (A1), một lối tắt rẻ hơn mọi lời giải có câu hỏi (vd W5 boss 5 khối < `par` 6). Câu hỏi sản phẩm: HLV có thể đổi (`coach-questions.md` G21).
- **`sense`:** cảm biến trả lời qua `ctx.sense(value, blockId)`; engine ghi event chung `{ type: 'sense', blockId, value }` (như `highlight`, không thuộc union event của kiểu game) và **tính vào `maxActions`**. Nhờ vậy vòng lặp chỉ hỏi (thân rỗng) dừng sau `maxActions` câu hỏi với log ngắn, cả hai đường giới hạn đều ra `TIMEOUT` tất định; và trong vét cạn, một `lặp đến khi` chạy quá `maxActions` vòng chắc chắn là `TIMEOUT`.
- **`maxLoopDepth`** (level, số nguyên ≥ 1) + hàm thuần `loopDepth(workspaceJson)` của engine; `content:check` luật 20 kiểm `solution` / `initialWorkspace` theo `maxLoopDepth` và `maxInstances`. Điểm gợi ý `step` thêm vào `HintTargetSchema`.
- **Vét cạn có điều kiện** (`packages/validator/src/search`):
  - Cảm biến được ghi như khối lệnh (chạy một mình trong `cq_if` bằng engine thật, hai block id), rồi **câu trả lời tính bằng API thật trên bản sao trạng thái**, nhớ theo (trạng thái, cảm biến). Cảm biến phải gọi đúng một API, trả boolean, không đổi state (vi phạm → `unsearchable`). Generator vẫn là nguồn duy nhất.
  - Mã đã biên dịch có `if` / `until`; `MapSim.run` diễn giải trên **từng bản đồ** (mỗi bản đồ đi nhánh riêng), bộ trạng thái nhiều bản đồ ghép lại sau mỗi câu lệnh. `lặp đến khi` quay lại một trạng thái đã hỏi trong cùng lần chạy khối đó (hoặc quá `maxActions` vòng) = không dừng = thua; ô trống = thua.
  - Tìm theo số khối như cũ (đường ngắn nhất trên trạng thái). Khóa nút tìm là (trạng thái, vector số khối đã dùng của các type trong `maxInstances`); không có `maxInstances` thì khóa là trạng thái như trước. Lặp lồng tối đa `min(--depth, maxLoopDepth)`.
  - Cắt tỉa không đổi số nhỏ nhất và số đếm: thân/nhánh rỗng, tiền tố thân thua hoặc thắng trước khối cuối (chạy lượt đầu chỉ trên các bản đồ đi vào nhánh đó, `runMasked`), `nếu` ở tầng ngoài cùng không chia bản đồ (bỏ `nếu` thì ngắn hơn), `lặp đến khi` ở tầng ngoài cùng hỏi ✔ ngay (không làm gì).
  - Tìm cách sửa: token thêm tên input (`DO`/`ELSE`/`COND`) như `editDistance`; độ sâu tối đa = độ sâu ban đầu + số lần sửa; token chèn/đổi chỉ thử những độ sâu hợp với hai token kề (thứ tự trước). Màn không có khối điều kiện tìm y như trước.
  - Trần bộ nhớ: `MAX_CATALOG_ENTRIES` (1,5 triệu câu lệnh dựng sẵn) dừng như hết ngân sách.

## Hệ quả
- Tái lập được các số "VC" của `curriculum.md` §5.5 bằng engine thật, mỗi màn vài giây (test `conditions.test.ts`): W4 `l02` 5 (28 cách), `l16` 5 (75) / theo mục tiêu 8, W5 `l09` 7 (đúng 1), `l14` 6 / 7, `l17` 7 (4), boss 6 (6). `npm run par -- --world w01|w02|w03` cho output giống từng ký tự trước thay đổi (trừ thời gian).
- Kiểu game mới phải để cảm biến báo qua `ctx.sense` (game-kind-sdk.md §1, luật 6) và giữ giả định 1b của §4.
- Web còn phải làm: `Replay` xử lý `sense` (không đưa cho renderer), mũi tên `step`, chặn thả khối theo `maxLoopDepth`, thanh khối của editor có `cq_if`/`cq_if_else`/`cq_repeat_until`, khóa cache vét cạn của editor tính cả `maxInstances`/`maxLoopDepth`.
- Giới hạn: vét cạn không theo dõi tổng `maxActions` / `maxSteps` của cả chương trình (chỉ số vòng của từng `lặp đến khi`); ví dụ vẫn được chạy lại bằng `runLevel` và lệch thì báo ✖.
- Giới hạn: một `lặp đến khi` ở tầng ngoài cùng chạy lượt đầu khi dựng thân rồi mới vào vòng có cận `maxActions`, nên được thêm một vòng so với cận đó (chỉ đổi ngưỡng coi là không dừng, ví dụ vẫn được chạy lại bằng `runLevel`).
- Ô điều kiện trống: `FastSim.wins` từ chối **tĩnh** mọi mã có ô trống ở bất kỳ đâu (như `runLevel`), ngoài thua khi chạy tới ô đó; tìm cách sửa không bao giờ đếm một chương trình có ô trống.
- Trần bộ nhớ đếm cả câu lệnh `cq_repeat` dựng sẵn và mọi dãy thân (`sequence`), không tính vào ngân sách công việc (để màn không có điều kiện tốn đúng như trước); `WORKER_MAX_CATALOG_ENTRIES` (300 000) cho Web Worker, truyền qua `maxCatalogEntries`.
- Bộ lọc độ sâu khi tìm cách sửa chỉ áp ở lần sửa **cuối** (danh sách ở đó phải đúng dạng mới thắng được); các lần sửa trước thử mọi token vì danh sách sai dạng còn được sửa tiếp. Test so với tìm không lọc (`unfilteredEdits`).
- Câu hỏi HLV G21 (`coach-questions.md`): ô trống báo lỗi hay chạy như Blockly.

## Phương án đã cân nhắc
- **`controls_if` + `extraState`, `controls_whileUntil` khóa UNTIL:** bé phải bấm bánh răng hoặc nội dung phải ghi `extraState`; luật 7 và `maxInstances` không phân biệt được "nếu" với "nếu … nếu không".
- **Chạy từng chương trình qua js-interpreter (có nhớ):** đúng nhưng chậm hàng trăm lần; không đạt "mỗi màn vài giây".
- **Ghi lại chuỗi lời gọi của cả chương trình theo từng giá trị cảm biến:** cây nhánh nổ theo số lần hỏi; hỏi API thật trên trạng thái đơn giản và đúng hơn.
- **`sense` không tính vào `maxActions`:** vòng lặp thân rỗng chỉ dừng ở `maxSteps` với hàng chục nghìn event; vẫn tất định nhưng log dài và vét cạn không có cận số vòng chắc chắn.
- **Ô trống = `false`** (như Blockly): mở lối tắt "lặp mãi" rẻ hơn mọi lời giải dạy câu hỏi.
