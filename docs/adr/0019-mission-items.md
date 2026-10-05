# ADR-0019: Vật phẩm nhiệm vụ (`goal.items`): điều kiện thắng nằm trong config, nhặt bằng cách đứng ở ô

- **Trạng thái:** Chấp nhận
- **Ngày:** 05/10/2026

## Bối cảnh
HLV muốn từ Thế giới 3 mỗi màn là một nhiệm vụ (`curriculum.md` §5.0). Hai kiểu đích mới được duyệt (câu G17): `rescue` (đứng ở ô chìa khóa rồi mới tới lồng) và `escort` (đứng ở ô của bạn rồi mới về nhà), dùng ở W4 `l17` (runner, 3 bản đồ, chìa khóa rơi trên đường, chưa có lồng), W4 boss (maze, 3 mê cung, chìa khóa ở nhánh trái) và W5 boss (runner, 3 bản đồ, Gà con trên đường). Luật chi tiết đã có ở T17b: phải **đứng ở** ô (như măng, nhảy qua không tính); runner tới cờ mà thiếu thì lượt chạy kết thúc `incomplete`; maze đi xuyên đích như `collectAll`; hết chương trình **ở đích** mà thiếu → `NEED_KEY` / `NEED_FRIEND`, ở chỗ khác → `NOT_AT_GOAL`; khóa đoán `missed@<ô>`; vét cạn được (trạng thái chỉ thêm tập vật phẩm đã lấy). "Điểm phải đi qua theo thứ tự" để sau. Ràng buộc: package headless (ADR-0006), vét cạn gộp trạng thái bằng `stateKey` (ADR-0015, 0018), mỗi bản đồ có config riêng (ADR-0016), và `apps/web` đang `switch` hết các loại event (thêm loại event mới sẽ làm web không biên dịch).

## Quyết định
- **Schema (config của kiểu game, không phải level):** `config.goal.items?: { kind: 'key' | 'friend'; at }[]` (≥ 1), runner `at` là số ô, maze `at` là `[r, c]`. Khai báo theo từng bản đồ (T11). `rescue` / `escort` chỉ là tên trong chương trình học: một màn `rescue` = vật phẩm `key` + `goalSprite: 'cage'`. Loại vật phẩm và mã lý do ở `packages/games/src/goalItems.ts` (`GOAL_ITEM_KINDS`, `NEED_REASONS`).
- **Luật:** mọi vật phẩm phải nhặt, **thứ tự tùy ý** (chưa màn nào cần thứ tự; runner vốn chỉ đi tới nên thứ tự tự có). Nhặt khi Măng **dừng** ở ô (runner: sau `walk`/`crouch`/`jump`; maze: sau `move`). Runner: tới cờ mà còn thiếu → `incomplete` / `NEED_KEY` hoặc `NEED_FRIEND` theo **vật phẩm còn thiếu đầu tiên trong config**, xét **trước** `collectAll` (`MISSED_ITEMS`). Maze: thiếu thì `G` là ô thường (đi xuyên, giữ luật A1 "chạm đích là thắng" chỉ khi đủ điều kiện, như `collectAll`); `evaluate` xét vị trí trước (`NOT_AT_GOAL`), rồi vật phẩm, rồi măng. `predictAnswer`: ba lý do "thiếu ở đích" (`MISSED_ITEMS`, `NEED_KEY`, `NEED_FRIEND`) đều cho `missed@<ô>`.
- **Event:** dùng lại `collect` và `missed` với trường tùy chọn `item?: 'key' | 'friend'`: `collect{at, item}` = nhặt vật phẩm (bạn từ đây đi theo Măng); runner `missed{at, left, item}` = tới cờ còn thiếu vật phẩm ở các ô `left` (tăng dần như măng; `item` là loại của vật phẩm thiếu đầu tiên theo thứ tự config). Maze không có event khi đi xuyên `G` (như `collectAll`).
- **Kiểm chứng:** chỗ đặt kiểm trong `configSchema` (luật 1): runner ô `ground`/`branch` sau `start`, không trùng nhau, không trùng măng (ô `crate` bị từ chối **cố ý**, như măng: thùng phải đá đổ mới đứng được, vật phẩm "trong thùng" là luật mới chưa ai duyệt; ô `hole` và cờ cũng không); maze ô `.` (không tường, `S`, `G`, `b`), không trùng nhau. Luật 9 (lời giải thắng mọi bản đồ) bắt lời giải bỏ sót vật phẩm. `feedback.json` có câu cho `NEED_KEY` "Cần chìa khóa trước!", `NEED_FRIEND` "Chưa đón bạn kìa!" (luật 17).
- **Vét cạn:** không đổi code. Vật phẩm còn lại là một mảng trong trạng thái của kiểu game, `stateKey` so sánh được, nên hai trạng thái cùng ô/hướng nhưng khác vật phẩm đã nhặt được giữ riêng (vẫn đúng). Lượt dừng `incomplete` ở cờ là thua như mọi lượt không thắng. Tái lập §5.5: W4 `l17` 5 (24 cách), W4 boss 8 (68 cách, không có ≤ 7), W5 boss 6 (6 cách) trong `packages/validator/src/search/conditions.test.ts`.

## Hệ quả
- Web hiện tại vẫn biên dịch và chạy màn có vật phẩm, nhưng diễn `collect{item}` như nhặt măng và `missed{item}` như măng còn lại (HUD mê cung còn đếm nhầm vật phẩm vào măng) cho tới khi có sprite chìa khóa, lồng đóng/mở, bạn đi theo Măng (T17c). Việc đó thuộc phần web của P2-11c.
- Không thêm trạng thái lớn cho vét cạn: mỗi vật phẩm nhân số trạng thái tối đa 2 lần; 1–2 vật phẩm mỗi bản đồ là nhỏ.
- Màn mê cung có vật phẩm **không** được dạy cùng "lặp đến khi đã tới đích" (D9): `đã tới đích?` đúng khi Măng đứng ở `G` dù còn thiếu.
- Thêm loại vật phẩm = thêm vào `GOAL_ITEM_KINDS` + `NEED_REASONS` + câu trong `feedback.json`.

## Phương án đã cân nhắc
- **Event riêng `pickup` / `need`:** rõ nghĩa hơn, nhưng `RunnerStage.estimate` / `MazeStage.estimate` (web) `switch` hết các loại event mà không có `default`, nên thêm loại mới làm `tsc -b` đỏ cho tới khi web sửa. Trường `item` tùy chọn giữ web biên dịch và vẫn đủ để vẽ sau này.
- **Trường cấp level `mission: 'rescue' | 'escort'`:** vật phẩm phải khai báo theo từng bản đồ, nên dữ liệu vẫn nằm trong config; trường riêng chỉ lặp lại `goalSprite`.
- **Thứ tự bắt buộc (`ordered`):** curriculum để sau (G17); runner tự có thứ tự, maze boss chỉ có một chìa khóa. Thêm sau bằng cờ `goal.ordered` nếu màn nào cần.
- **Runner đi xuyên cờ khi thiếu (như maze):** cờ luôn là ô cuối nên không đi tiếp được; T17b chốt kết thúc `incomplete` ngay ở cờ.
- **Coi thiếu vật phẩm ở cờ là `MISSED_ITEMS`:** mất câu riêng cho bé ("Cần chìa khóa trước!") mà HLV đã duyệt.
