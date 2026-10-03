# ADR-0017: Mục tiêu sao (`starGoals`): chấm trên trạng thái cuối, đạt trên mọi bản đồ

- **Trạng thái:** Chấp nhận
- **Ngày:** 03/10/2026

## Bối cảnh
HLV muốn từ Thế giới 3 mỗi màn có nhiều cách giải và cách khéo hơn mới được nhiều sao (P2-21, luật đã duyệt ở `product/rewards-economy.md` §1): màn `build`/`bughunt` khai báo mục tiêu riêng; ⭐ thắng, ⭐⭐ thắng + đạt mọi mục tiêu, ⭐⭐⭐ thêm ≤ `par` (bughunt ≤ `parEdits`) và không gợi ý tầng 2–3. `par` của màn này phải là số khối ít nhất của chương trình **vừa thắng vừa đạt mục tiêu**. Mọi màn có mục tiêu ở `curriculum.md` §5 (W3 `l11`, W4 `l16`, W5 `l14`) chỉ cần "nhặt măng", và măng đã có sẵn trong config runner/maze (`config.goal.collectAll` biến nó thành điều kiện thắng). Rewards không được import engine (ADR-0006, `rewards-engine.md`), vét cạn gộp các trạng thái giống nhau (ADR-0015), và màn có thể có nhiều bản đồ (ADR-0016).

## Quyết định
- **Schema:** `level.starGoals?: StarGoal[]`, `StarGoal` là union theo `kind`, hiện chỉ `{ kind: 'collectAll' }` (nhặt hết măng của bản đồ). Chỉ mode `build`/`bughunt`, mỗi loại tối đa một lần (luật 1). Mục tiêu **không bao giờ** quyết định thắng.
- **SDK:** `GameKindDefinition.checkStarGoal?(goal, state, config): boolean`, thuần, chỉ đọc trạng thái cuối. runner, maze cài `collectAll`. Kiểu game không có hàm này không hỗ trợ mục tiêu (content:check luật 19).
- **Engine:** màn có `starGoals` → mỗi bản đồ có `goals: boolean[]` (theo thứ tự `starGoals`) chấm trên trạng thái cuối bất kể kết quả; `RunOutcome.goals` cấp màn = đạt trên **mọi** bản đồ. Bản đồ không có măng tự đạt `collectAll`, nên "nhặt măng ở bản đồ 1" chỉ cần đặt măng ở bản đồ 1. Màn không có `starGoals` không có trường `goals`: output giữ nguyên từng byte.
- **Rewards:** `RunSummary.goals?: boolean[]` (web chép từ `RunOutcome.goals`). `computeStars` dùng bảng mới khi màn có `starGoals` (thiếu cờ hoặc sai số cờ = chưa đạt), giữ nguyên luật cũ khi không có; trần do gợi ý giữ nguyên. `meetsStarGoals` cho màn kết quả.
- **Kiểm chứng:** luật 19 (kiểu game hỗ trợ; không mục tiêu nào đạt sẵn trên mọi bản đồ; lời giải thắng thì đạt mọi mục tiêu); luật 5 đếm chữ `mission`. Vét cạn (`FastSim`) coi lượt thắng thiếu mục tiêu là **thua**, nên kết quả nhỏ nhất chính là `par` theo mục tiêu mà không cần thêm trạng thái; `ignoreStarGoals` tìm thắng thường. `npm run par` in cả hai: `min (goals) 7 … · plain win 5 (32)`.
- **Cùng đợt (P2-11c, chỉ dữ liệu):** `mission` (≤ 12 chữ) và `goalSprite` (runner/maze) chỉ để kể chuyện và vẽ, không qua engine.

## Hệ quả
- Thêm loại mục tiêu = thêm một phần tử vào union + `checkStarGoal` của các kiểu game + test; không đổi engine, rewards hay vét cạn.
- Mục tiêu phải tính được từ trạng thái cuối. "Về đích với ≤ N bước" cần bộ đếm bước trong state, làm mất khả năng gộp trạng thái của vét cạn (mỗi số bước một trạng thái): khi một màn cần, phải thêm cách tìm riêng (vd so sánh trội theo số bước). "Không đá thùng" vô nghĩa ở runner (thùng luôn chắn đường). Cả hai chưa cài.
- Web phải chép `goals` vào `RunSummary`; trước khi nối, màn có `starGoals` chỉ cho tối đa ⭐ (an toàn: không thưởng nhầm). Thẻ "Mục tiêu ⭐" và màn kết quả là phần giao diện của P2-21.

## Phương án đã cân nhắc
- **Engine trả "dữ kiện" (số măng còn, số bước…) rồi rewards tự chấm:** rewards phải biết từng loại mục tiêu và từng kiểu game; chấm một chỗ (kiểu game) gọn hơn, vét cạn dùng lại được.
- **Mục tiêu đạt nếu đạt ở bất kỳ bản đồ nào:** không khớp ý "một chương trình đúng cho mọi bản đồ" của ADR-0016; đặt măng ở đúng bản đồ cần là đủ diễn đạt "mục tiêu ở bản đồ 1".
- **Trường `collect: [ô…]` (măng ở ô cụ thể):** chưa màn nào cần nhặt một phần số măng; măng chỉ đặt khi có mục tiêu, nên `collectAll` đủ.
