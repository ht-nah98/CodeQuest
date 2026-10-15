# ADR-0023: Phép thuật (hàm) của engine: tên do màn khai báo, gọi là chạy thân phép tại chỗ, tham số là hộp của phép, vét cạn theo tập phép với thân cố định

- **Trạng thái:** Đề xuất
- **Ngày:** 15/10/2026 (bản nháp của P4-01, sửa cùng ngày theo review độc lập; chuyển "Chấp nhận" sau spike đo vét cạn)

## Bối cảnh
Thế giới 8 "🪄 Xưởng Phép Thuật" dạy **hàm** (thủ tục không trả giá trị), sau đó **một tham số số** (`product/curriculum.md` §6.3). Điều phối quyết định ngày 15/10/2026: W8 chạy trên `maze` và `robotlab` có sẵn (W8 không dùng `turtle` / `music`); boss là nhiệm vụ robot dùng 2–3 phép. Những gì đã có:
- Mô phỏng tất định; package headless (ADR-0006). `runLevel` chạy JS sinh từ Blockly trong js-interpreter (ADR-0005).
- `compileProgram` **đã** biên dịch các định nghĩa hàm ở gốc (`procedures_defnoreturn`, `procedures_defreturn`). Khối của chúng tính vào `blocksUsed`, nằm trong `programBlockIds`, không bị coi là khối rời (`architecture/runtime-engine.md` §2–3). Chưa có nội dung, vét cạn hay giao diện nào dùng.
- Vét cạn (`@codequest/validator`, ADR-0015/0018/0022) dựng chương trình theo cỡ, từ catalogue khối của thanh khối, và chỉ có **một** chồng khối dưới `cq_start`. Phép thuật thêm các chồng thân phép, nên không gian chương trình thành **tích** của thân phép và chương trình chính.
- `InstanceLimits` (`search/limits.ts`) **cộng** số khối mỗi type và loại phần vượt trần. Nó không biểu diễn được kiểu "chi phí trả một lần lúc dùng lần đầu".
- Hộp (biến) W7 là trạng thái engine `{ game, vars }`. Khối chỉ có ô số / ô chọn, nên không cần capacity guard (ADR-0022). Luật 23 (`validator/src/variableRules.ts`) và R4 kiểm hộp khai báo ở `level.variables`.
- Luật HLV (cố định):
  - Mọi ý mới cần câu luật cho bé, ví dụ chạy được và tooltip đúng từng chữ.
  - Giao diện nói "khối", tooltip nói "lệnh".
  - Khối dùng chung cho maze (Măng) và robotlab (Bíp) **không nêu tên nhân vật**.

## Quyết định

### 1. Mô hình
- Màn khai báo phép bằng `level.procedures?: { id, name, param?: { id, name, max? } }[]`:
  - tối đa 3 phép; `name` ≤ 3 chữ tiếng Việt (vd `{ id: 'stair', name: 'bậc thang' }`);
  - bé **không** tự đặt tên, không tạo phép mới (giống hộp W7); dropdown chỉ hiện phép của màn.
- Không dùng `procedures_*` gốc của Blockly (lý do ở "Phương án"). Engine có 4 khối chung, category `function`:

| Khối | Nhãn | Field | Tooltip (đề xuất, không nêu tên nhân vật) |
|---|---|---|---|
| `cq_proc_def` | dạy phép [bậc thang ▾] · (ô lệnh `BODY`) | `PROC` (`field_cq_proc`) | Dạy phép: nhớ các lệnh bên trong, chưa làm ngay |
| `cq_proc_call` | làm phép [bậc thang ▾] | `PROC` | Làm phép: làm hết lệnh trong phép, rồi làm tiếp |
| `cq_proc_def_n` | dạy phép [cầu thang ▾] với hộp [số bậc] | `PROC` (tên hộp lấy từ `param.name`, không đổi được) | Dạy phép với hộp: làm phép thì hộp nhận số |
| `cq_proc_call_n` | làm phép [cầu thang ▾] với [3] | `PROC`, `NUM` (`field_number` 0…`max`) | Làm phép với số: hộp của phép nhận số này |

- Lời cho bé = "Khối mới! " + tooltip, ≤ 12 chữ. Bài giảng và lời thoại của từng màn mới nói tên Măng / Bíp.
- `cq_proc_def*` là khối gốc kiểu "mũ": không có `previous` / `next`, chỉ có ô lệnh `BODY`. Khối này **không** chạy khi chương trình chạy; chỉ thân của nó chạy khi có `làm phép`.

### 2. Hộp của phép (tham số): nằm ở đâu
- **Khai báo:** ở `level.procedures[].param`, **không** ở `level.variables`. Id hộp của phép không được trùng id hộp của màn hay của phép khác.
- **Trạng thái:** engine và vét cạn gộp hộp của phép vào `vars` của `{ game, vars }`, giá trị đầu 0, `max` mặc định 9 (ADR-0022). Màn chỉ có hộp của phép vẫn được bọc `{ game, vars }`.
- **Phạm vi:** hộp chỉ được đọc **trong thân** phép của nó, qua `cq_repeat_var` ("lặp [số bậc ▾] lần").
  - Dropdown `field_cq_var` của khối nằm trong thân `dạy phép X với hộp` hiện hộp của X cùng các hộp của màn. Ở chỗ khác chỉ hiện hộp của màn. Danh sách đọc lại mỗi lần mở dropdown, theo khối cha lúc đó.
  - Khối kéo ra ngoài thân mà vẫn chọn hộp của phép → lỗi tĩnh `BOX_OUTSIDE_SPELL` ("Hộp này chỉ dùng trong phép của nó.").
  - `cq_var_set` / `cq_var_add` / `cq_var_compare` **không** dùng được hộp của phép ở v1 (luật 25 (j)).
- **Luật 23 sửa ở P4-04** (`variableRules.ts`):
  - (c) "có khối biến mà không có `variables`": hộp của phép tính là hộp đã khai báo.
  - (b) id hợp lệ: `VAR` của `cq_repeat_var` có thể là id hộp của phép, chỉ trong thân phép đó.
  - (d) "khai báo mà không dùng": hộp của phép được coi là đã dùng khi có `cq_proc_def_n` của phép.
  - (k) và (e) áp dụng cho `NUM` của `cq_proc_call_n` so với `param.max`.
  - (j) khóa đoán: đuôi `#id=n` **chỉ** gồm hộp của màn. Hộp của phép luôn là 0 khi hết chương trình nên không vào khóa.
  - R4 "hộp lái chương trình": với màn chỉ có hộp của phép, R4 đạt khi lời giải có **≥ 2 lần `làm phép … với` mang số khác nhau** (không cần ≥ 2 bản đồ). Phép thử "bỏ khối biến thì không thắng" của R4 được thay bằng R5 (§4).
- **Engine:**
  - `__call` của `cq_proc_call_n` đặt hộp bằng số truyền vào, qua `applyVarCall` (vượt `max` → `BOX_FULL`), và ghi event `var`.
  - `__ret` đặt hộp về 0 và ghi `var`.
  - Không có gọi lồng (§3), nên không cần ngăn xếp. Trạng thái sau khi ra khỏi phép không phụ thuộc số đã truyền, nên gộp trạng thái của vét cạn vẫn đúng.
- Mọi ô số vẫn là field: **vẫn không cần capacity guard**.

### 3. Engine
- **Biên dịch:**
  - `cq_proc_def*` → `function __p_<id>() { … }`. Thân có `STATEMENT_PREFIX`, nên highlight đi vào được từng khối trong phép.
  - `cq_proc_call*` → `__call('<id>', n, <blockId>); __p_<id>(); __ret('<id>', <blockId>);`.
  - `__call` / `__ret` là hàm sandbox của engine (như `__var*`). Tên của chúng nằm trong `BASE_RESERVED_WORDS` và `apiNames`.
- **Event chung** `call { blockId, id }` và `ret { blockId, id }`. Chúng giống `var`, `sense`: không thuộc union event của kiểu game, có tính vào `maxActions`. Web dùng hai event này để sáng khối `dạy phép` đang chạy và hiện "Đang làm phép «…»".
- **Không gọi lồng ở v1:** thân phép không được chứa `làm phép` (cả chính nó lẫn phép khác). Engine kiểm tĩnh trước khi chạy và trả `SPELL_IN_SPELL` ("Trong phép không làm phép khác nhé!"). Bỏ được ở W10 bằng ADR mới (gọi theo DAG, cấm đệ quy).
- **Mã lý do mới của engine** (`ENGINE_REASONS` + `feedback.json`, luật 17), đều là `{ result: 'error' }` kiểm tĩnh trước mọi event, như `EMPTY_CONDITION`:

| Mã | Khi nào | Câu |
|---|---|---|
| `NO_SPELL` | làm phép chưa có khối `dạy phép` | "Phép này chưa được dạy." |
| `TWO_SPELLS` | hai khối `dạy phép` cùng tên | |
| `EMPTY_SPELL` | làm phép mà thân trống | |
| `SPELL_IN_SPELL` | có `làm phép` trong thân phép | "Trong phép không làm phép khác nhé!" |
| `BOX_OUTSIDE_SPELL` | dùng hộp của phép ngoài thân phép | "Hộp này chỉ dùng trong phép của nó." |

- **Đếm khối:** `blocksUsed` = khối dưới `cq_start` + mọi khối `dạy phép` và thân của nó (`analyzeWorkspace` mở rộng danh sách type gốc).
  - Dạy phép mà không gọi: khối trong phép không chạy. Ở `parsons` thì thành `UNUSED_BLOCKS` (luật G22 có sẵn). Ở `build` thì không lỗi: không chạy nhưng vẫn tính khối.
- **Độ sâu vòng lặp hiệu dụng:** độ sâu của một `làm phép` = số vòng lặp bao quanh khối đó + độ sâu vòng lặp lớn nhất trong thân phép. `loopDepth(workspaceJson)` trả **giá trị lớn nhất** của độ sâu hiệu dụng. Cả bốn nơi dùng chung hàm này: luật 20, luật 25, vét cạn (catalogue chỉ có `làm phép p` ở chỗ còn đủ tầng), và bộ chặn thả khối của web (`guardBlockLimits`). Như vậy không ai lách được `maxLoopDepth: 1` bằng cách gọi một phép có vòng lặp từ trong vòng lặp.
- **`parEdits` và gợi ý tầng 2:**
  - `editDistance` và gợi ý tầng 2 (`nextStep`) dùng chuỗi token gồm chồng chính, rồi các chồng `dạy phép` theo thứ tự `level.procedures`.
  - Neo của bước tiếp có thể là ô `BODY` của khối `dạy phép`.
- **Tất định:** không đụng `rng` hay đồng hồ; có test "hai lần chạy cùng event log".

### 4. Vét cạn (`@codequest/validator`)
- **Biểu diễn:**
  - `Statement` thêm `{ call: string; arg?: number }`.
  - Chương trình của màn có phép là `{ main: Program; defs: Record<id, Program> }`, dùng ở `programToWorkspace` / `programFromWorkspace` / `programSize` / `programBlockTypes` / `formatProgram`.
  - `FastSim` chạy `call` bằng cách **chạy thân** tại chỗ, có nhớ theo (trạng thái, phép, số), không cần js-interpreter.
- Không vét cạn chung thân × chương trình chính. Ba chế độ; `npm run par` ghi rõ đã dùng chế độ nào.

**Chế độ 1 · thân cố định, theo tập phép (mặc định).**
- Lấy thân của mọi phép từ `solution`.
- Với **mỗi tập con S** của các phép (≤ 3 phép, nên ≤ 8 tập), chạy tìm kiếm có sẵn trên chương trình chính:
  - catalogue = khối của thanh khối ∪ { `làm phép p` với p ∈ S, với các số ghim };
  - cỡ của một chương trình = khối chính + **hằng số** `Σ_{p∈S} (1 + |thân p|)`;
  - **không** bắt chương trình phải gọi mọi p ∈ S: chương trình gọi ít phép hơn bị tính thừa chi phí của S, nên không bao giờ nhỏ hơn kết quả của tập con đúng của nó; lấy nhỏ nhất qua mọi S vẫn đúng. Điều kiện "gọi đủ S" còn mâu thuẫn với cắt tiền tố theo (trạng thái, usage), có thể báo `par` cao hơn thật. Chỉ khi cần **đếm đúng số cách thắng** mới thêm mặt nạ bit "phép đã gọi" vào khóa gộp trạng thái (và chỉ đếm cách thắng gọi đủ S).
- `par` = nhỏ nhất qua mọi S. Khi đã có kết quả tốt nhất B, bỏ qua mọi S có hằng số + |S| ≥ B.
- Không cần sửa `InstanceLimits`: phép không thuộc S thì không có trong catalogue; phép thuộc S thì đã trả chi phí thân.
- Kết quả in "✔ par (thân phép theo lời giải)". Chứng minh không có chương trình chính nào nhỏ hơn **với các thân đó**, chưa chứng minh thân khác không ngắn hơn.

**Chế độ 2 · liệt kê thân nhỏ (`--proc-bodies k`, mặc định tắt; k ≤ 4, ≤ 2 phép).**
- Liệt kê mọi thân cỡ ≤ k từ khối lệnh của thanh khối, kể cả `lặp`, `nếu` nếu thanh khối có, trong giới hạn độ sâu hiệu dụng.
- Mỗi bộ thân chạy chế độ 1.
- Cắt tỉa bằng cận dưới: một phép chỉ có ích khi được gọi ≥ 2 lần. Bộ thân nào có `Σ(1 + |thân|) + 2·|S| ≥ B` thì bỏ.
- Chứng minh `par` cho mọi chương trình có thân ≤ k. Hết ngân sách → ⚠.

**Chế độ 3 · `par` tính tay.**
- Trường mới `level.parUnproven?: true` dùng cho mọi kiểu game. Gắn ngược cho W6 boss, W7 `l16` / `l19` / boss ở P4-05.
- `npm run par` báo ⚠ "par chưa chứng minh (tính tay)" và không đỏ.
- Kiểm cờ cũ nằm ở **`npm run par`**, không ở `content:check` (`content:check` không bao giờ vét cạn). Nếu màn có cờ mà chế độ 1 xong trong ngân sách mặc định, in ⚠ "cờ parUnproven có thể bỏ".
- Lý do của cờ ghi ở "Ghi chú khi soạn".

**Luật soạn R5 "phép phải có ích"** (song song R4 của ADR-0022). Áp dụng cho màn `build` / `bughunt` có phép, **không** áp dụng cho màn `guided`.
- **Đòi hỏi:** vét cạn **không có khối phép** (thanh khối bỏ `cq_proc_*`) không thắng được tới `maxBlocks`.
- **Cách ép:** ép bằng `maxBlocks`, **hoặc** bằng `maxInstances` trên khối hành động (vd `maze_forward: 4` khi thân phép có 2 lần `tiến` và được gọi 3 lần). Cách thứ hai làm vét cạn R5 nhỏ hơn nhiều, vì chương trình không phép bị chặn sớm.
- **Ngân sách:** mỗi màn tối đa **120 s** và 300 M work (`--timeout 120`). Hết ngân sách mà chưa thấy cách thắng → "⚠ R5 chưa chứng minh", ghi lý do ở "Ghi chú khi soạn", kèm một test cấu trúc nếu có: số khối hành động mà đường thắng cần > trần `maxInstances`, chứng minh bằng đếm.
- **Nơi chạy:** test ở `w08.test.ts`, việc nặng, một màn một lần.

**`parsons`** có hai chồng: bộ đếm cách ghép (`parsons.ts`) ghép cả thân phép lẫn chương trình chính, và vẫn báo số cách thắng / tổng số cách ghép.

### 5. `content:check` (luật 25; chỉ kiểm tĩnh, không vét cạn)
- (a) `PROC` trong thanh khối, lời giải và chương trình cho sẵn là id đã khai báo.
- (b) `cq_proc_def_n` / `cq_proc_call_n` chỉ dùng cho phép có `param`, và ngược lại.
- (c) Lời giải và chương trình cho sẵn (trừ `bughunt`) không có `SPELL_IN_SPELL`, `TWO_SPELLS`, `NO_SPELL`, `EMPTY_SPELL`, `BOX_OUTSIDE_SPELL`.
- (d) Khối phép ở thế giới < 8 → lỗi (ngoài `_sandbox`).
- (e) Ô `NUM` của `cq_proc_call_n` ghim trong thanh khối (như luật 23 (a)) và nằm trong `0…max`.
- (f) `name` > 3 chữ → cảnh báo.
- (g) Màn `build` có phép mà lời giải gọi mỗi phép < 2 lần → cảnh báo (phép không có ích).
- (h) Id phép và id hộp không trùng nhau.
- (i) Độ sâu vòng lặp hiệu dụng của lời giải ≤ `maxLoopDepth` (luật 20 dùng `loopDepth` mới).
- (j) `cq_var_*` không dùng hộp của phép.

Luật 24 (M2): hình lời giải của màn có phép = chương trình chính + các thân phép, bỏ số.

### 6. Web (tóm tắt, chi tiết ở P4-06)
- **Thanh khối:** nhóm "PHÉP THUẬT" (category `function`; đổi nhãn `HÀM` cũ trong `i18n/vi.ts`), màu riêng, đủ tương phản.
- **Khối `dạy phép`:** không bị làm xám như khối rời. Mỗi phép chỉ một khối `dạy phép`: flyout ẩn mục của phép đã có trên workspace.
- **Phát lại:**
  - event `call` sáng viền khối `dạy phép` và hiện bong bóng "Đang làm phép «…»" (không nêu tên nhân vật); highlight đi vào thân; `ret` tắt;
  - event `var` của hộp của phép hiện trên bảng hộp (`VarBoxes`) trong lúc làm phép.
- **Bộ chặn thả khối** dùng độ sâu hiệu dụng.
- **Level editor:** màn có `procedures` → "chưa hỗ trợ phép thuật" (như biến).

## Hệ quả
- Kiểu game không cần sửa gì (`maze`, `robotlab`, sau này `turtle`). W1–W7: màn không có `procedures` → `npm run par` cho ra kết quả như cũ (điều kiện nghiệm thu, đo theo `phase-4.md` P4-03).
- `par` của màn có phép mặc định là "tốt nhất với thân của lời giải". Người soạn chọn thân ngắn nhất hợp lý; review sư phạm kiểm; chế độ 2 kiểm thêm khi màn nhỏ.
- Không có gọi lồng; tham số chỉ là số vòng lặp. Đủ cho W8, chưa đủ cho đệ quy hay `tiến [n] ô` (để W10, cần capacity guard và ADR mới).
- Độ sâu hiệu dụng thay đổi `loopDepth`. Với W1–W7 (không có phép) giá trị không đổi; test snapshot kiểm điều này.
- Tài liệu cập nhật cùng P4-02…P4-06:
  - `runtime-engine.md`: khối gốc, `__call`/`__ret`, event, độ sâu hiệu dụng;
  - `game-kind-sdk.md` §4 (điều 9);
  - `content-model.md`: `procedures`, `parUnproven`, luật 25, sửa luật 20 / 23;
  - `blockly-integration.md` §5, §6;
  - `content-authoring.md`: R5, câu chuẩn §5.1;
  - `glossary.md`.

## Phương án đã cân nhắc
- **`procedures_defnoreturn` / `procedures_callnoreturn` gốc của Blockly:**
  - có bánh răng (mutator) để thêm tham số, có ô đổi tên tự do, chữ tiếng Anh ("to do something"), nhóm thanh khối động;
  - tham số là biến Blockly (ô cắm, shadow → cần capacity guard);
  - tên do bé gõ làm thanh khối và vét cạn không cố định.
  - Giống lý do bỏ biến gốc ở ADR-0022.
- **Phép cho sẵn không sửa được (macro do màn định nghĩa):** vét cạn dễ, nhưng bé không học "dạy phép". Chỉ dùng dưới dạng khối `dạy phép` đặt sẵn trong `initialWorkspace` (W8 `l03`).
- **Cờ 0/1 "đã dùng phép" trong vector `Usage` của `InstanceLimits`:** không làm được. `InstanceLimits` cộng số lượng và loại phần vượt trần, không có chi phí "trả lần đầu". Liệt kê tập con S cho cùng kết quả với ≤ 8 lần chạy.
- **Vét cạn chung thân × chương trình chính:** catalogue thân nhân với catalogue chính; dự kiến hết ngân sách từ cỡ 8 (spike P4-01 đo). Giữ dưới dạng chế độ 2 có trần k.
- **Ngăn xếp đầy đủ + gọi lồng:** đúng hơn về mặt lập trình, nhưng trạng thái phải mang ngăn xếp (gộp kém), và đệ quy phải chặn bằng `maxActions`. W8 không cần.
- **Tham số là ô cắm số (`tiến [n] ô`):** cần khối giá trị, shadow, capacity guard và vét cạn biểu thức. Để W10.
- **Độ sâu vòng lặp theo chữ trên từng chồng:** gọi một phép có vòng lặp từ trong vòng lặp sẽ lén đưa vòng lặp lồng vào thế giới có `maxLoopDepth: 1`. Vì vậy chọn độ sâu hiệu dụng.
- **Cấm `làm phép` trong vòng lặp khi thân có vòng lặp:** đơn giản hơn, nhưng chặn cả trường hợp hợp lệ khi `maxLoopDepth ≥ 2` (W9 `l16`). Độ sâu hiệu dụng bao được cả hai trường hợp.
