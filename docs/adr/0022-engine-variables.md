# ADR-0022: Biến của engine ("hộp"): khối chỉ có ô số, biến nằm trong trạng thái vét cạn, `countGoal`, `lặp [hộp] lần`

- **Trạng thái:** Chấp nhận
- **Ngày:** 09/10/2026 (sửa sau review độc lập cùng ngày; HLV giao các quyết định sản phẩm cho AI, ghi ở cuối ADR)

## Bối cảnh
Thế giới 7 "🏪 Chợ Đếm Số" dạy biến (`product/curriculum.md` §6.2). HLV chọn phương án A (`coach-questions.md` câu 11): biến chạy trên `maze` và `robotlab` có sẵn, khối biến **chỉ có ô số** (field), không có ô cắm, nên không cần capacity guard (`blockly-integration.md` §5). Các ràng buộc đã có:
- Mô phỏng tất định; package headless (ADR-0006).
- Vét cạn (`@codequest/validator`, ADR-0015/0018) ghi lời gọi API của từng khối lệnh rồi phát lại trên state của kiểu game, gộp các trạng thái giống nhau theo `stateKey`.
- Hiện có ba lỗ hổng (critic đã nêu):
  1. Khối biến không gọi API nào của kiểu game, nên biến nằm **ngoài** state mà `FastSim` phát lại.
  2. `cq_repeat_var` đọc số vòng lúc chạy, trong khi `RepeatCode.times` là số cố định và khối này không có trong `CONTROL_TYPES`.
  3. `cq_var_compare` nhân catalogue điều kiện lên (2 biến × 3 phép so × nhiều số).
- Maze thắng **ngay** khi chạm `G` (luật A1), còn robotlab chấm khi hết chương trình (ADR-0021).

**Spike (09/10/2026).** Chép `packages/validator/src/search/*` ra thư mục tạm (không đổi repo). Dựng một kiểu game bọc `maze`, có state `{ game, vars }` và 5 khối mới (đặt, tăng, so sánh, `lặp [hộp] lần`, `phía trước có măng?`). Thêm `RepeatVarCode` vào `FastSim` / `shortest.ts`. Chạy `findShortestPrograms` thật trên Node 22 / WSL2, `--max-old-space-size=3072`. "Trạng thái" = số trạng thái mô phỏng khác nhau. "Work" = đơn vị ngân sách. "Ghim" = mục thanh khối ghi sẵn `VAR` / `NUM` / `OP`.

| Màn (phác theo §6.2) | Bản đồ | Thanh khối | Kết quả | Trạng thái | Work | Thời gian |
|---|---|---|---|---:|---:|---:|
| `l03` đếm măng (`nếu phía trước có măng? {tăng}`), `countGoal` 2 / 4 | 2 | tiến, lặp, nếu, hỏi măng, đặt (ghim), tăng (ghim) | min **5**, 15 cách, đủ | 952 (trần 99) · 186 (trần 9) | 179 k | 0,2 s |
| như trên, **không** biến, không `countGoal` | 2 | | min 2 | 6 | 8 | 0,1 s |
| như trên, `tăng` và `đặt` **không ghim** (2 biến × NUM 1–9) | 2 | | hết ngân sách 20 M ở cỡ 5 | 37 272 | 20 M | 9,6 s |
| `l08` đếm rồi so sánh, `nếu … nếu không`, tìm tới cỡ 7 | 2 | 3 lệnh đi + lặp + nếu + nếu-không + hỏi măng + tăng + so sánh (ghim) | (chưa tới par 10) | 103 111 (trần 99) · 10 211 (trần 9) | 100 M · 39 M | 10 s · 3,8 s |
| như trên, so sánh để mở `VAR` + `OP` (6 câu hỏi) | 2 | | | 103 119 | 145 M | 18,8 s, heap 1 GB |
| như trên, không có khối biến | 2 | | | 666 | 20 M | 1,4 s |
| `l08` tới par 10, trần 9, ngân sách 1 tỉ | 2 | | dừng ở cỡ 8 (trần catalogue 1,5 M), cả bản **không biến** cũng dừng ở cỡ 8 | 14 831 | 287 M | 15,7 s |
| `l11` dạng maze: "biến của đề", `start` 3 / 4 / 2, `lặp [hộp] lần {tiến}`, rẽ, tiến | 3 | tiến, rẽ ×2, lặp, `lặp [hộp] lần`, tăng | min **4**, 21 cách, đủ | 261 | 20 k | 0,2 s |
| như trên, không có khối biến (kiểm R4) | 3 | | không thắng tới cỡ 8 | 28 | 155 M | 3,2 s |
| `l04` bậc thang (`lặp đến khi có đường bên trái {tiến, tăng}`, rẽ, `lặp [hộp] lần`) | 2 | | min 6 **không cần biến** (đi men tường) | 360 | 3 M | 0,5 s |

**Đọc số đo:**
- Biến **có** làm nổ số trạng thái: mỗi giá trị của hộp là một trạng thái mới, khoảng ×150 so với bản không biến ở `l08`. Thủ phạm chính là `tăng` trong vòng lặp đẩy hộp lên tới trần. Hạ trần từ 99 xuống 9 (vượt trần = thua) giảm số trạng thái ×10 và work ×2.
- Mở ô số / ô chọn trong thanh khối làm hết ngân sách ngay ở màn dễ nhất (`l03`). Vì vậy phải ghim.
- Màn par 10 có đủ bộ khối W4–W5 (như `l08`, `l17`, boss) **không** vét cạn được, có biến hay không, giống `l19` của W6 (ADR-0021). Lý do là catalogue `cq_repeat` 2–20 × điều kiện, không phải do biến.
- Màn dạng "biến của đề" và "lặp [hộp] lần" (`l04`, `l11`) nhỏ và nhanh.
- Lối tắt: cả hai bản phác của `l08` và `l04` đều có lời giải **không cần đếm**, ngắn hơn par: Măng đi thử cả hai nhánh rồi thắng giữa chừng nhờ A1, hoặc đi men tường bằng `lặp đến khi có đường …`. Luật R4 bắt đúng lỗi này. Việc sửa bản đồ là của P3-10, không phải của engine.

## Quyết định

### 1. Mô hình biến
- **Biến là trạng thái của engine, không thuộc kiểu game.**
  - `GameKindDefinition` **không đổi**. Kiểu game không đọc, không ghi biến.
  - Mỗi lượt chạy một bản đồ, engine giữ `vars: Record<string, number>`.
  - Trong vét cạn, trạng thái của một bản đồ là cặp `{ game, vars }`, và `stateKey` tính cả `vars`. Hai chương trình chỉ được gộp khi cả sân chơi và **mọi** hộp đều bằng nhau.
  - Màn **không** khai báo biến thì `MapSim` dùng state cũ, không bọc. Nhờ vậy W1–W6 cho kết quả `npm run par` y hệt từng ký tự.
- **Khai báo ở level** (`content-schema`):
  ```ts
  variables?: Array<{
    id: string;        // ^[a-z][a-z0-9_]*$, vd "bamboo"
    name: string;      // tên hộp cho bé, vd "số măng" (≤ 3 chữ)
    start?: number[];  // một số cho mỗi bản đồ (config, rồi từng variant); mặc định toàn 0
    max?: number;      // 1–20, mặc định 9
  }>;  // 1–2 phần tử
  countGoal?: { var: string; equals: number[] };  // một số cho mỗi bản đồ
  ```
  - Độ dài `start` và `equals` phải bằng số bản đồ (zod `superRefine`).
  - Giá trị nằm trong `0…max`.
  - `countGoal.var` phải là một biến đã khai báo.
  - `countGoal` chỉ dùng ở mode `build`, `bughunt`, `parsons`.
- **Giá trị:** số nguyên `0…max`. **Vượt `max` thì thua** (`crash` / `BOX_FULL`: "Hộp đầy rồi!"), không giữ ở trần như bản nháp cũ của §6.2 ("giữ 99").
  - Lý do 1: giữ ở trần làm sai mà không báo. Ví dụ bé đếm cả ô trống (ngộ nhận của `l10`) thì hộp đứng yên ở trần và không ai biết vì sao.
  - Lý do 2: thua sớm cắt bớt vét cạn (số đo ở trên).
  - `max` ≤ 20 = `CQ_REPEAT_MAX_TIMES`, nên `lặp [hộp] lần` không bao giờ chạy quá 20 vòng.
  - Không có số âm. Không có "giảm" ở W7 (để W10).
- **Gọi tên với bé** (câu 12 của HLV): bài giảng nói "biến là chiếc hộp có tên". Trên khối chỉ hiện tên hộp. Bảng cạnh sân chơi gọi là "Hộp". Code dùng `variable` / `var`. Thêm một dòng "Biến / hộp" vào `glossary.md`.

### 2. Bộ khối
Mọi khối đều là khối chung của engine (`packages/engine/src/blocks/variables.ts`, `category: 'variable'`). Riêng khối hỏi măng thuộc maze. Không khối nào có input giá trị hay shadow.

| Type | Nhãn | Field | Generator (sandbox) | Tooltip (giọng "lệnh") |
|---|---|---|---|---|
| `cq_var_set` | đặt %1 thành %2 | `VAR` (`field_cq_var`), `NUM` (`field_number` 0–20, precision 1) | `__varSet('bamboo', 0, id);` | Lệnh này cho số vào hộp. Số cũ mất |
| `cq_var_add` | tăng %1 thêm %2 | `VAR`, `NUM` (1–9) | `__varAdd('bamboo', 1, id);` | Lệnh này cộng thêm vào số trong hộp |
| `cq_var_compare` | %1 %2 %3 ? (output `Boolean`) | `VAR`, `OP` (`field_dropdown` `=`/`<`/`>` → `EQ`/`LT`/`GT`), `NUM` (0–20) | `__varCmp('bamboo', 'GT', 2, id)` | Câu hỏi: ✔ khi số trong hộp đúng như vậy, ✘ khi không |
| `cq_repeat_var` | lặp %1 lần %2 %3 (`DO`) | `VAR` | `var n = __varGet('bamboo', id); for (var c = 0; c < n; c++) {…}` | Làm các lệnh bên trong, số lần bằng số trong hộp lúc bắt đầu lặp |
| `maze_bamboo_ahead` | phía trước có măng? | — | `bambooAhead(id)` (API maze, `ctx.sense`) | ✔ khi ô ngay trước Măng có măng chưa nhặt |

- **`field_cq_var`** (`packages/engine/src/blocks/variableField.ts`): field riêng kế thừa `FieldDropdown`, engine đăng ký bằng `fieldRegistry.register('field_cq_var', …)`. Trong Blockly 13.3, constructor của `FieldDropdown` gọi `setOptions` rồi `getOptions(false)` **trước** khi khối nguồn tồn tại, và danh sách rỗng thì ném lỗi. Ngoài ra nhiều nơi nạp workspace mà **không có level**: `analyzeWorkspace` (`packages/validator/src/validateLevel.ts:132`, `apps/web/src/blockly/BlocklyWorkspace.tsx:267`) và thẻ `demo` của bài giảng. Vì vậy:
  - **Menu generator không bao giờ rỗng:** chưa có khối nguồn, khối không có workspace, hoặc workspace chưa đăng ký biến thì trả **một lựa chọn giữ chỗ** `[[value hiện tại hoặc 'hộp', value hiện tại hoặc '__none']]`. Có danh sách thì trả `[[name, id], …]` của màn.
  - **Tìm danh sách biến** theo `ws.isFlyout ? ws.targetWorkspace : ws` (khối trong thanh khối nằm ở workspace của flyout), trong `WeakMap<Workspace, LevelVariable[]>` do `setWorkspaceVariables(ws, variables)` ghi.
  - **`doClassValidation_`** nhận mọi id đúng `^[a-z][a-z0-9_]*$` (không đối chiếu menu). Nạp không bao giờ âm thầm bỏ giá trị, và `analyzeWorkspace` không có level vẫn đọc đúng `fields.VAR`.
  - **`fromJson`** (static) đọc `{ name }` từ JSON khối, không đòi `options`. **`getText`** (và `getText_`) tra nhãn theo **giá trị hiện tại** trong danh sách mới nhất (không dùng `selectedOption` cũ, vì `doValueUpdate_` chỉ cập nhật nó khi giá trị có trong menu lúc đó); không thấy thì hiện chính id.
  - `withHeadlessWorkspace(workspace, fn, variables?)`: tham số mới, truyền ở **3** nơi gọi (`runLevel.ts:86`, `compileProgram.ts:26`, `analyzeWorkspace.ts:55`); `analyzeWorkspace` không có level thì không truyền (dùng giữ chỗ).
  - `runLevel` báo `INTERNAL_ERROR: unknown variable <id>` khi chương trình dùng id chưa khai báo; `content:check` bắt trước (luật 23).
  - **Test bắt buộc** (`variableField.test.ts`, Node): tạo khối không có workspace / không đăng ký biến (không ném, có giữ chỗ); nạp JSON có `VAR` chưa đăng ký rồi đọc lại đúng giá trị; `analyzeWorkspace` không level; đổi đăng ký rồi `getText` ra nhãn mới; khối trong flyout lấy biến của workspace chính (test web, `BlocklyWorkspace`); lưu/nạp tròn (`serialization.blocks.save`) giữ nguyên id; thẻ `demo` của bài giảng hiện tên hộp.
- **`lặp [hộp] lần` đọc số hộp một lần lúc vào vòng** (như Scratch). Đổi hộp bên trong thân không đổi số vòng. Bẫy này **không** dùng ở màn thử thách (`l17`–`l19`, boss): tooltip và bài giảng nói rõ, và `content:check` luật 23 (i) cảnh báo khi thân của một `lặp [hộp] lần` đặt hoặc tăng chính hộp đó. Khối thêm vào `LOOP_BLOCK_TYPES` (tính trong `maxLoopDepth`).
- **Không có khối số cắm vào ô.** "Số khối đã thu" của robotlab **không** là cảm biến số. Bé tự đếm bằng `tăng` sau mỗi lần `thả` (đúng ý `l06`, `l15`). Câu hỏi robot dùng `đang gắp khối?` có sẵn (`robot_holding`).
- **`countGoal`** (chấm của engine, sau chấm của kiểu game):
  - Một lượt chạy bản đồ *i* thắng khi kiểu game thắng **và** `vars[countGoal.var] === equals[i]`. Sai số thì `incomplete` / `WRONG_COUNT` ("Đếm chưa đúng. Đếm lại nhé!").
  - Engine kiểm ở **cả hai** đường: `evaluate` thành công, và `StopSignal('success')` giữa chừng (maze chạm `G`, robotlab hết giờ ở màn `score`). Nói cách khác: hộp phải đúng **ngay lúc thắng**.
- **Khóa đoán** (`predict`): engine nối thêm `#<id>=<n>` cho **mọi** biến đã khai báo, theo thứ tự khai báo, lấy từ `vars` của **bản đồ quyết định** (`maps[deciding]`, `runLevel.ts:194`; màn `predict` có một bản đồ). Ví dụ `win#bamboo=3`, `stop@1,4#bamboo=2#fish=0`.
  - Hàm chung `splitVarSuffix(key) → { base, vars }` (engine, thuần) chạy **trước** bộ đọc khóa của từng kiểu game ở web (`apps/web/src/features/play/answerKey.ts`, `parseRobotKey` trong `apps/web/src/stages/robotlab/answer.ts`), nên bộ đọc cũ không phải đổi; `AnswerPicture` vẽ thêm hộp từ `vars`.
  - `content:check` luật 23 (j): màn `predict` có `variables` thì **mọi** `predict.options[].key` phải có đủ đuôi, đúng thứ tự khai báo.

### 2b. Thẻ demo của bài giảng
`LessonCardSchema` nhánh `demo` (`packages/content-schema/src/lesson.ts:17`, `strictObject`) thêm `variables?` (cùng schema khai báo của level) và `start?: number[]` dài 1. `LessonDemo` truyền `variables` vào `runLevel` / `setWorkspaceVariables` và hiện `VarBoxes` cạnh sân chơi nhỏ.

### 3. Engine
- **Hàm sandbox** do `runMap` cài (không thuộc `createApi`): `__varSet`, `__varAdd`, `__varGet`, `__varCmp`.
  - Tên thêm vào `BASE_RESERVED_WORDS`, và nằm trong `apiNames` của các khối trên.
  - Luật của chúng là **một hàm thuần** export từ engine: `applyVarCall(vars, decls, name, args) → { vars, value?, overflow? }`. Engine và `FastSim` dùng chung hàm này, để luật chỉ viết ở một chỗ.
- **Event chung `var { blockId, id, value }`** (như `sense`, không thuộc union event của kiểu game):
  - Ghi sau mỗi `đặt` / `tăng`, **kể cả** khi giá trị không đổi.
  - Tính vào `maxActions`, nên vòng lặp chỉ có `tăng` vẫn dừng tất định.
  - `__varCmp` ghi `sense` qua đường `sense` có sẵn. `__varGet` không ghi event (khối lặp đã có `highlight`).
  - Vượt `max`: ghi `var` với `value` = số cũ và `overflow: true`, rồi `crash` / `BOX_FULL`.
- **Mã lý do mới của engine:** `WRONG_COUNT`, `BOX_FULL` vào `ENGINE_REASONS`, mỗi mã một câu trong `feedback.json` (luật 17).
- **Tất định:** không đụng `rng` hay đồng hồ. Mỗi bản đồ có `vars` mới từ `start[i]`. Thêm test snapshot "hai lần chạy cùng event log".
- **`RunOutcome`:** `MapOutcome.vars?` là giá trị cuối của từng hộp (để thẻ kết quả và test dùng). Bảng hộp ở web dựng lại từ event `var`, không đọc trường này.

### 4. Vét cạn
- **Danh sách khối gộp:** `FastSim` dựng một lần `specs = [...kind.blocks, ...VARIABLE_BLOCKS]` (khối biến của engine) và mọi chỗ đang đọc `kind.blocks` đọc `specs`: `unsupportedReason`, `dropdownChoices` (thêm nhánh `field_cq_var` → các id của `level.variables`, hoặc chỉ id ghim) và `addConditions` (`sim.ts:146-200`), `sensorNames` (`sim.ts:610`, thêm `__varCmp`), `recordAs` (`sim.ts:670`: bộ ghi có cả tên `__var*`, kind truyền cho `runLevel` có `blocks: specs`), và vòng khởi tạo atom (`sim.ts:318`). `recordCondition` nhận `__varCmp` là API cảm biến hợp lệ. `registerBlockSpecs` của engine đăng ký `VARIABLE_BLOCKS` cùng `COMMON_BLOCKS`.
- **Bỏ lớp bọc ở mọi chỗ gọi kiểu game:** màn có biến thì `MapSim` lưu `{ game, vars }`, nên `createState` (bọc khi tạo), `MapSim.finish` (`evaluate` trên `.game`, rồi `countGoal` trên `.vars`), `meetsGoals` / `checkStarGoal` (trên `.game`; màn có cả `starGoals` và `countGoal` cần cả hai), `probe`, `compute`, `answer` đều mở `.game`. Một hàm `wrap/unwrap` duy nhất, test có màn vừa `starGoals` vừa `countGoal`.
- **Phát lại:**
  - `FastSim.record` ghi cả lời gọi `__var*`. `runLevel` nhận một tùy chọn nội bộ `engineCalls?: (name, args) => Primitive | undefined` để thay các hàm biến thật bằng bộ ghi. Chỉ validator dùng tùy chọn này, có ghi trong JSDoc.
  - `FastSim.compute`: lời gọi `__var*` thì chạy `applyVarCall` trên `vars`. Lời gọi khác thì chạy API kiểu game trên `game`. Vượt trần → `LOSS`. Thắng giữa chừng chỉ tính là `WIN` khi `countGoal` đúng.
  - `FastSim.answer` của `cq_var_compare` đọc `vars` và không đổi state. Giả định 1b (§4 của `game-kind-sdk.md`) vẫn giữ: câu hỏi gọi đúng một hàm, trả boolean.
  - `MapSim.finish` thêm điều kiện `countGoal`.
- **`cq_repeat_var`:**
  - Thêm vào `CONTROL_TYPES`.
  - `Statement` thêm `{ repeatVar: string; body }` và `Code` thêm `{ timesVar: number; body }`. Sửa `programSize`, `programBlockTypes`, `programLoopDepth`, `programToWorkspace`, `programFromWorkspace` (`CONTROL_INPUTS`), `formatProgram`, `hasEmptySlot`.
  - `MapSim.run` đọc số vòng từ `vars` của trạng thái lúc vào vòng. `FastSim.run` chạy khối này **theo từng bản đồ** (`runMasked`, như `nếu`), vì mỗi bản đồ có số vòng riêng.
  - Catalogue tạo một mục cho mỗi biến mà mục thanh khối cho phép.
  - Ở tầng ngoài cùng: dựng thân bằng `grow` trên các bản đồ có hộp ≥ 1 (cắt tiền tố thua như `repeats`), rồi chạy cả khối bằng `sim.run`, có nhớ. Bỏ qua nếu hộp = 0 ở mọi bản đồ còn chạy (khối không làm gì; bỏ đi thì chương trình nhỏ hơn).
  - Spike dùng `sequence` không cắt tỉa và đã chạm trần catalogue ở cỡ 9. Bản thật phải dùng `grow`.
- **Gộp trạng thái vẫn đúng:** mọi thứ quyết định phần chạy tiếp đều nằm trong `{ game, vars }`. Khai báo biến là hằng của màn. Bộ đếm `maxActions` vẫn là giới hạn đã biết của ADR-0018: ví dụ được chạy lại bằng `runLevel`, lệch thì báo ✖.
  - Không thêm "quên biến không còn dùng" (gộp trạng thái bỏ qua biến chết). Cách đó không chứng minh được là đúng khi biến còn được đọc ở `lặp [hộp] lần` hoặc ở `countGoal`.
- **Giữ catalogue nhỏ:**
  - (a) **Ghim:** mọi mục thanh khối của `cq_var_set` / `cq_var_add` / `cq_var_compare` phải ghi sẵn `VAR` và `NUM` (`compare` cả `OP`), và `cq_repeat_var` ghi sẵn `VAR` (luật 23). Vét cạn chỉ thử giá trị ghim. Bé vẫn đổi số được trong giao diện, giống `robot_forward` (ADR-0021).
  - (b) Trần `max` mặc định 9.
  - (c) Một màn muốn cả `=` và `>` thì đặt hai mục thanh khối, mỗi mục ghim một phép so.
- **Ngân sách:** màn par ≤ 9 có ≤ 6 loại khối thì vét cạn được trong vài giây. Màn par ≥ 10 có đủ `lặp` + `nếu-không` + biến thì không vét cạn được (như W6 `l19`): `par` tính tay, ghi ở "Ghi chú khi soạn". `npm run par` báo ⚠ ngân sách, không báo ✖.

### 5. `content:check`
Luật 23 (biến), mỗi luật một fixture:
- (a) Mục thanh khối của khối biến không ghim đủ field → lỗi.
- (b) `VAR` trong thanh khối, `solution` hoặc `initialWorkspace` là id chưa khai báo → lỗi.
- (c) Màn có khối biến mà không có `variables` → lỗi.
- (d) `variables` khai báo mà thanh khối và chương trình cho sẵn không có khối nào dùng → cảnh báo.
- (e) `start`, `equals`, ô `NUM` ghim nằm ngoài `0…max`, hoặc độ dài mảng sai → lỗi (một phần đã do zod bắt).
- (f) `countGoal` mà `solution` không đặt hay tăng biến đó → cảnh báo.
- (g) Khối biến xuất hiện ở thế giới < 7 → lỗi (ngoài `_sandbox`).
- (h) `name` > 3 chữ → cảnh báo.
- (i) Thân của `lặp [hộp] lần` đặt / tăng chính hộp đó → cảnh báo (bẫy đọc-một-lần, chỉ dùng có chủ đích ở màn `predict` không phải thử thách).
- (j) Màn `predict` có `variables`: mọi khóa đáp án có đuôi `#id=n` đầy đủ.
- (k) Ô `NUM` ghim (`đặt`, `so sánh`, `tăng`) lớn hơn `max` của biến → lỗi.
- (l) Màn maze có `countGoal`: không có măng (`b`) trên ô `G` hay ngay ô Măng thắng (đếm ở ô đích không bao giờ chạy vì thắng ngay) → lỗi.

Luật 7 (khối mới lần đầu) nhận `cq_var_*` như mọi khối.

Luật soạn **R4** (`content-authoring.md` §2.2, mới), hai loại màn tự ghép (`build`, `bughunt`) có biến:
- **Hộp lái chương trình** (thanh khối có `lặp [hộp] lần` hoặc `so sánh`): ≥ 2 bản đồ, và test của thế giới (`w07.test.ts`) chạy vét cạn với thanh khối **bỏ hết khối biến** và bỏ `countGoal`: không được thắng tới `par`. Số đo cho thấy đây là chỗ hỏng thật: `l08` và `l04` bản phác đều có lối tắt.
- **Chỉ đếm** (hộp chỉ được `đặt` / `tăng`, chấm bằng `countGoal`): bỏ khối biến thì chắc chắn thua vì `countGoal`, nên phép thử trên vô nghĩa. Thay vào đó: ≥ 2 bản đồ có `equals` **khác nhau** (để một số cố định không thắng được), luật 23 kiểm.

### 6. Bảng hộp (web)
- `apps/web/src/play/VarBoxes.tsx` (React, dùng chung mọi kiểu game), nằm cạnh sân chơi, chỉ hiện ở màn có `variables`.
- Mỗi hộp là một thùng gỗ pixel. Nhãn tên ở trên (VT323), số lớn ở giữa, trần nhỏ bên dưới ("/9").
- **Trước khi chạy:** hiện `start` của bản đồ đang xem, đổi theo tab bản đồ.
- **Khi phát lại:** `Replay` xử lý `var` như `sense`: không đưa cho renderer, chuyển cho `onVar`.
  - `tăng`: chữ "+1" bay lên và số nảy (scale 1→1,25→1, 200 ms, màu `--coin`).
  - `đặt`: số cũ rơi ra, số mới rơi vào (250 ms).
  - `so sánh`: viền hộp sáng ✔ / ✘ cùng lúc khối hỏi sáng.
  - `overflow`: hộp rung đỏ rồi bong bóng "Hộp đầy rồi!".
- `prefers-reduced-motion`: chỉ đổi số. "Từng bước" dừng ở từng event `var`.
- Hết lượt: số trong hộp so với `equals` của bản đồ, hiện ✔ hoặc "cần 4" ở thẻ kết quả khi thua `WRONG_COUNT`.
- Màn nhiều bản đồ: hộp về `start` khi chuyển bản đồ.
- `AnswerPicture` của `predict` vẽ thêm hộp với số của khóa.
- Có unit test cho `varBoxesReducer`, và e2e số đổi theo từng bước.

## Hệ quả
- Kiểu game không cần sửa gì để có biến. Robotlab được biến "miễn phí". Kiểu game sau (W8+) cũng vậy.
- W1–W6: state, khóa đoán, kết quả `npm run par` không đổi, vì màn không có `variables` thì không bọc state. Đây là điều kiện nghiệm thu.
- Ô số ghim trong thanh khối là giả định của vét cạn. Bé đổi số có thể tìm được chương trình ngắn hơn par mà vét cạn không thấy. Chấp nhận như `robot_forward`.
- Maze + A1 dễ có lối tắt "đi thử hết" cho màn chọn đường theo số. Ngõ cụt ngắn **không đủ** (bé vẫn rẽ quay lại). Màn "đếm rồi chọn" (`l08`, `l16`, boss) phải có **vật nguy hiểm ngay đầu nhánh sai** (tường chắn đâm vào là thua ngay ô đầu tiên, tức nhánh sai chỉ là một ô cụt mà bước tiếp là `HIT_WALL`, và không có câu hỏi `có đường …` trong thanh khối để dò), **hoặc** chuyển sang robotlab (chấm khi hết chương trình, đi thử hết thì `NOT_HOME` / hết giờ). Cả hai đều phải qua R4 (vét cạn không khối biến không thắng tới `par`).
- `l04` (bậc thang) không được để `có đường [trái/phải]` cùng `lặp đến khi` mà không chặn men tường. Hoặc dùng dạng `l11` (hộp có sẵn số), dạng này đã đo là sạch.
- Màn dạy `đặt` cần `start` ≠ 0 (hộp còn số cũ), vì `start` mặc định 0 làm `đặt = 0` thừa và vét cạn không bao giờ dùng nó (đo ở `l03`: par 5, không phải 6). Hoặc dạy bằng `parsons` / `bughunt` (`l01`, `l05`).
- **Lệch khỏi bản nháp:** `curriculum.md` §6.2 và `phase-3.md` từng ghi "biến 0–99, vượt thì giữ 99"; ADR này đổi thành trần theo màn (mặc định 9, tối đa 20), vượt là `BOX_FULL`. Hai tài liệu đó đã sửa cùng lúc với ADR.
- `l11` trên robotlab (đơn hàng theo bản đồ) **chưa đo**; chỉ dạng maze đã đo. Việc 4 đo và ghi số vào ADR mới nếu khác nhiều.
- Cập nhật tài liệu ở P3-09: `curriculum.md` §6.2, `phase-3.md` (P3-09, P3-10), `game-kinds.md` §2.1 (bảng khối biến), `runtime-engine.md` §5 (hàm biến, event `var`), `game-kind-sdk.md` §4 (điều 8: biến là trạng thái engine), `content-model.md` (trường mới, luật 23, §8 vét cạn), `glossary.md`, `content-authoring.md` R4, `blockly-integration.md` §5 (vẫn không cần capacity guard).

## Phương án đã cân nhắc
- **Biến trong state của kiểu game (API chung ghi vào `ctx.state.vars`):** mỗi kiểu game phải thêm trường và nhớ không xóa nó. `evaluate`, `predictAnswer` của từng kiểu phải biết `countGoal`. State của W1–W6 đổi nên `par` cũ phải đo lại. Không được gì hơn cặp `{ game, vars }` của engine.
- **Biến ngoài state vét cạn (engine đếm riêng, vét cạn bỏ qua):** gộp sai. Hai chương trình tới cùng ô nhưng hộp khác số sẽ bị coi là một.
- **Kiểu game mới `farm` (phương án B, §6.2):** thêm một sân chơi, sprite và editor, chậm khoảng một giai đoạn, và không nối với AIROC. HLV đã chọn A.
- **Biến gốc của Blockly (`variables_set`, `math_change`, `controls_repeat_ext` + `math_number`):** có ô cắm và shadow, nên phải có capacity guard. Bé tự tạo biến bằng nút "Tạo biến" làm thanh khối thay đổi. Dropdown đổi tên / xóa biến lộ chữ tiếng Anh. Vét cạn phải hiểu biểu thức.
- **Ô số shadow cắm vào ô + capacity guard (GĐ 4):** đúng hướng cho W10 (`biến + biến`), nhưng thừa cho W7. Vét cạn biểu thức nổ catalogue. Để sau.
- **Hộp giữ ở 99 khi vượt (bản nháp §6.2):** sai mà không báo; ×10 trạng thái so với trần 9 + thua.
- **Cảm biến số `số khối đã thu` (khối giá trị):** cần ô cắm số. Bé đếm bằng `tăng` mới là điều cần học.
- **`lặp [hộp] lần` đọc lại số hộp mỗi vòng:** khó đoán cho bé. Vét cạn phải biết lúc nào hộp đổi trong thân. Scratch và Blockly đều đọc một lần.
- **Thử mọi giá trị `NUM` / `OP` khi không ghim:** đo được là hết ngân sách ngay ở `l03`.

## Việc của P3-09 (theo thứ tự, mỗi việc một agent, review độc lập rồi mới làm việc sau; việc 3 chạy song song với việc 2)
1. **Schema** (`content-schema`): `variables`, `countGoal` + refine (độ dài theo số bản đồ, khoảng giá trị, id tồn tại, mode); thẻ `demo` có `variables` / `start` (§2b). *Nghiệm thu:* test schema cho mọi nhánh lỗi; W1–W6 và mọi bài giảng vẫn parse.
2. **Engine lõi:** `variables.ts` (4 khối chung), `field_cq_var` đúng §2 (giữ chỗ, flyout, `fromJson`, `getText`) + `setWorkspaceVariables` + tham số mới của `withHeadlessWorkspace` (3 nơi gọi), `applyVarCall` thuần, hàm sandbox trong `runMap`, event `var`, `BOX_FULL` / `WRONG_COUNT`, `countGoal` ở cả hai đường thắng, đuôi khóa đoán từ bản đồ quyết định + `splitVarSuffix`, `MapOutcome.vars`, `LOOP_BLOCK_TYPES`, tùy chọn nội bộ `engineCalls`. *Nghiệm thu:* các test field ở §2; unit test đặt / tăng / so sánh / lặp theo hộp (đọc một lần), vượt `max`, `start` theo bản đồ, `countGoal` nhiều bản đồ và lúc maze thắng giữa chừng, khóa `#id=n`, tất định (2 lần chạy cùng log); snapshot W1–W6 không đổi.
3. **Khối `maze_bamboo_ahead`** (`games/maze`, song song với 2). *Nghiệm thu:* test ✔ / ✘ (măng đã nhặt là ✘, tường là ✘); luật 7 có tooltip.
4. **Vét cạn** (`validator`): danh sách khối gộp ở mọi hàm §4, bọc / mở `{ game, vars }` một chỗ, ghi `__var*`, `RepeatVarCode` + catalogue + tầng ngoài cùng bằng `grow`, `countGoal` trong `compute` / `finish`, `fixes.ts` hiểu `repeatVar`. *Nghiệm thu:* `variables.test.ts` tái lập số của spike (`l03` min 5 / 15 cách, `l11` maze min 4 / 21 cách, R4 không thắng tới 8), thêm 1 màn robotlab (`l11` robot: đơn hàng theo bản đồ, đo và ghi số), màn vừa `starGoals` vừa `countGoal`; `npm run par -- --world w01…w06` giống từng ký tự trước thay đổi (trừ thời gian).
5. **`content:check`:** luật 23 (a)–(l), R4 hai loại, câu `feedback.json` cho 2 mã mới (luật 17), fixture từng luật; `tools/par` truyền biến. *Nghiệm thu:* fixture đỏ đúng chỗ; `content/` xanh.
6. **Web:** `setWorkspaceVariables` trong `BlocklyWorkspace` (cả flyout), `Replay` xử lý `var`, `VarBoxes` + reducer (có "/max"), `LessonDemo` hiện `VarBoxes`, thẻ kết quả `WRONG_COUNT`, `splitVarSuffix` trước `answerKey.ts` / `parseRobotKey`, `AnswerPicture` có hộp. *Nghiệm thu:* unit test reducer và bộ đọc khóa; e2e 1280×720 và 1366×768 trên màn `_sandbox`: số đổi từng bước, thua `WRONG_COUNT`, `BOX_FULL`, demo bài giảng; ảnh chụp trong PR.
7. **Giao diện khối:** style `variable_blocks` trong theme (`blockly-integration.md` §3, màu riêng có tương phản), nhóm thanh khối "HỘP" cho `category: 'variable'` trong `toolbox.ts`, `knownBlockSpecs` (web) có khối biến. *Nghiệm thu:* `toolbox.test.ts`; ảnh chụp.
8. **Giọng đọc:** câu mới (`WRONG_COUNT`, `BOX_FULL`, lời Măng của bảng hộp, tooltip khối mới) vào bộ giọng; `npm run voice -- check` xanh.
9. **Level editor:** **hoãn** tới sau P3-11 (W7 soạn JSON tay như W6); editor gặp màn có `variables` thì báo "chưa hỗ trợ biến" thay vì chạy sai. *Nghiệm thu:* test của editor cho thông báo đó.
10. **Tài liệu + bài giới thiệu:** cập nhật các doc ở "Hệ quả" (kể cả `curriculum.md` §6.2, `phase-3.md`); thẻ demo bài "Khối mới" cho từng khối biến (mỗi khối một câu luật cho bé + ví dụ chạy được) và cho `đang gắp khối?`; R4 trong `content-authoring.md`.

## Kết quả phần headless (P3-09 việc 1–5, 09/10/2026)
- **Số luật:** P3-08 đã dùng luật 22 (màn thi thử), nên luật biến là **luật 23**; mọi chỗ trong ADR này đã đổi. Cảnh báo (d), (f), (h), (i) đi qua `LevelValidation.warnings` mới. (l) không cần code: một ô maze chỉ có một ký tự, `b` không trùng `G` được.
- **Spike tái lập** (màn mẫu `tools/content-check/fixtures/variables-samples/`, test `packages/validator/src/variables.test.ts`; bản đồ của spike không được giữ nên số trạng thái lệch chút):
  - `var-count` (`l03`): min **5**, **15** cách (khớp), 188 trạng thái (spike 186), 101 615 work (spike 179 k). Không hộp: min 2, 6 trạng thái, 8 work (khớp). `max` 20: 369 trạng thái.
  - `var-order` (`l11` maze): min **4**, **21** cách (khớp), 188 trạng thái (spike 261), 20 066 work (spike 20 k). R4: không thắng tới cỡ 8, đủ, 12 trạng thái (spike 28), 142,6 M work (spike 155 M), khoảng 4 s.
  - `robot-order` (`l11` robotlab, đo mới): hộp `start` 2 / 3, `lặp [số khối] lần { tiến 1, gắp, rẽ phải ×2, tiến 1, thả, rẽ phải }`, `maxLoopDepth: 1`: min **8**, 12 cách, 15 656 trạng thái, 2,19 M work, khoảng 1,4 s. R4: không thắng tới cỡ 8 (đủ). Không có `maxLoopDepth` (cho `lặp` lồng trong `lặp [hộp] lần`): vẫn min 8 nhưng 52 cách, 110 M work, 30 s, 1 GB.
- `npm run par -- --world w01…w06` giống từng ký tự trước thay đổi (trừ thời gian).
- Thẻ `demo` (§2b): không thêm trường `start` riêng ở thẻ; `variables[].start` của demo dài đúng 1 (demo có một bản đồ).

## Quyết định sản phẩm (HLV giao cho AI, 09/10/2026) và rủi ro còn lại
1. **Gọi "biến" hay "hộp":** bài giảng nói "biến là chiếc hộp có tên" một lần; khối, bảng và lời Măng chỉ nói "hộp" và tên hộp. Tooltip nói "lệnh" (giao diện "khối", tooltip "lệnh").
2. **Trần:** mặc định 9, màn đặt tới 20; vượt thì thua `BOX_FULL` ("Hộp đầy rồi!"). Bảng hiện "/9".
3. **`lặp [hộp] lần` đọc số một lần** lúc bắt đầu lặp (như Scratch). Không dùng làm bẫy ở màn thử thách; luật 23 (i) cảnh báo.
4. **Hộp phải đúng ngay lúc thắng** (maze chạm đích là thắng). Măng nói "Đếm xong rồi mới tới đích nhé!" khi `WRONG_COUNT` trên maze. Không đặt măng trên `G` (luật 23 (l)).
5. **Bé được đổi số trên khối biến**; vét cạn chỉ thử số ghim (như "tiến [3] ô").
6. **Màn "đếm rồi chọn đường":** maze chỉ khi nhánh sai có tường ngay ô thứ hai (đi tiếp là `HIT_WALL`) và thanh khối không có `có đường …`; không được thì chuyển sang robotlab. Cả hai qua R4. P3-10 ghi lựa chọn từng màn.
7. **Rủi ro kỹ thuật `field_cq_var`:** rủi ro thật không phải "field tùy biến có chạy trên Node không" (có: `maze_is_path` là dropdown chạy headless), mà là các đường **không có level** (`analyzeWorkspace`, flyout, demo, constructor gọi `getOptions` trước khi có khối) làm ném lỗi hoặc mất / sai nhãn. Việc 2 viết đủ test ở §2 **trước** khi viết khối. Nếu vẫn hỏng: dùng hai giá trị cố định `a` / `b` trong `field_dropdown` thường, nhãn đổi theo màn chỉ ở web (ADR bổ sung).
8. **Rủi ro vét cạn:** `l17`, `l19`, boss (par ≥ 10) có thể không vét cạn được; `par` tính tay + ⚠, như W6 `l19`. `l11` robot chưa đo (việc 4).
