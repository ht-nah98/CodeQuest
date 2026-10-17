# GĐ 4 · Xưởng Phép Thuật và Tháp Họa Sĩ (16/10/2026 → ~07/11/2026)

**Mục tiêu giai đoạn:**
- Có Thế giới 8 "🪄 Xưởng Phép Thuật" chơi được: dạy hàm (gọi là "phép thuật"), rồi một tham số số. Chạy trên `maze` + `robotlab` có sẵn.
- Có Thế giới 9 "🎨 Tháp Họa Sĩ" chơi được: dạy lặp lồng nhau + góc, trên kiểu game mới `turtle`.
- Mỗi thế giới có 20 màn + bài giảng, đủ luật soạn của đợt tăng độ khó: mỗi màn một ý, mê cung thật, không lặp công thức.
- Engine có phép thuật: biên dịch, event, gợi ý, vét cạn `par` có giới hạn rõ ràng.

**Nghiệm thu giai đoạn:**
- W8 và W9 qua `content:check` và `npm run par`. Màn ⚠ phải có cờ `parUnproven` (hoặc ghi "⚠ R5") kèm ghi chú.
- e2e của phép thuật và của `turtle` xanh, có ảnh chụp.
- HLV chơi thử và duyệt từng màn (AI không tự đánh dấu).
- Tag `v0.4.0`.

> **Bối cảnh lúc viết (15/10/2026, sửa cùng ngày theo review độc lập):**
> - W1–W7 là nháp, chờ HLV chơi thử (đợt tăng độ khó 0, A–E đã xong, `difficulty-pass.md`).
> - HLV giao: tiếp tục làm thế giới mới **tự động và nhanh, dùng nhiều agent song song**, không hỏi. Câu hỏi sản phẩm ghi ở `coach-questions.md` mục I, mỗi câu có mặc định.
> - Tài liệu thiết kế: `product/curriculum.md` §6.3 (W8), §6.4 (W9); ADR-0023 (phép thuật, Đề xuất); ADR-0024 (`turtle`, Đề xuất).
>
> **Quyết định của điều phối (15/10/2026):**
> - W8 xây trên `maze` + `robotlab`; W8 không dùng `turtle` / `music` (đã sửa bảng `curriculum.md` §2). Boss W8 là nhiệm vụ robot dùng 2–3 phép.
> - W9 dùng kiểu game mới `turtle` + sân chơi PixiJS. Chấm bằng tập nét so với hình mẫu, không theo thứ tự, tất định.
> - W10 chỉ giữ một dòng khung (`curriculum.md` §6.5).
> - W6 **sửa được**: HLV đã xin cập nhật W6. Muốn sửa file W6 / W7 thì hỏi điều phối trước để không đụng agent khác.
> - Lỗi chặn từ buổi chơi thử W1–W7 luôn được làm trước task GĐ 4.
>
> **Máy dev:** RAM thật **7,8 GB** (cấu hình WSL 10 GB chờ khởi động lại). **Mỗi lúc chỉ một việc nặng** (xem "Việc nặng"). File này thay khung GĐ 4 cũ ở `later-phases.md`.

| ID | Task | Phụ thuộc | Người làm | Trạng thái |
|---|---|---|---|---|
| P4-01 | Spike + chốt ADR-0023: đo vét cạn phép (theo tập phép, thân cố định / liệt kê thân ≤ k), R5 có ngân sách, trên 3 màn maze + 1 robotlab **[nặng]** | — | AI (A) | ✅ |
| P4-02 | Phép thuật trong engine (headless): schema `procedures` + `parUnproven` + `predict.options[].drawProgram`; `cq_proc_def` / `cq_proc_call`; `field_cq_proc`; biên dịch, `__call` / `__ret`, event `call` / `ret`; mã lý do; độ sâu vòng lặp hiệu dụng; `blocksUsed`, `parEdits`, gợi ý tầng 2 | P4-01 (thiết kế; schema và khối làm song song với spike) | AI (A) | ✅ |
| P4-03 | Vét cạn có phép: `Statement.call`, chế độ theo tập phép + liệt kê thân, kiểm cờ `parUnproven` cũ, `parsons` hai chồng, `fixes`, `tools/par`, helper R5 **[nặng]** | P4-02 | AI (A) | ✅ |
| P4-04 | Hộp của phép (tham số): `cq_proc_def_n` / `cq_proc_call_n`, hộp chỉ dùng trong thân, `var` lúc vào / ra, sửa luật 23 + R4, vét cạn | P4-02, P4-03 | AI (A) | ✅ |
| P4-05 | `content:check` luật 25, luật 20 dùng độ sâu hiệu dụng, luật 24 hiểu phép + `turtle` (bỏ số độ, T1), `feedback.json`, fixture, màn mẫu, gắn ngược `parUnproven` | P4-02 (phần hộp: P4-04) | AI (A) | ✅ |
| P4-06a | Chữ giao diện cho GĐ 4 trong `i18n/vi.ts` (nhóm PHÉP THUẬT / BÚT, thẻ kết quả các mã mới, HUD turtle) + `PROVISIONAL_WORLDS` cho `w08`, `w09` | — | AI (C) | ✅ |
| P4-06 | Web phép thuật: thanh khối, theme, khối `dạy phép` không bị làm xám, flyout, bộ chặn thả khối theo độ sâu hiệu dụng, phát lại `call` / `ret`, bảng hộp của phép, thẻ demo, giọng đọc, editor "chưa hỗ trợ" **[e2e nặng]** | P4-02 (phần hộp: P4-04), P4-06a | AI (C) | ✅ |
| P4-07 | Capacity guard (`apps/web/src/blockly/capacity.ts`). **Không chặn** W8–W9, vì mọi ô số vẫn là field | — | AI (C) | ⬜ (ưu tiên thấp) |
| P4-08 | `turtle` headless: số học Z[√3], config, state, 5 khối (dropdown góc tĩnh), mô phỏng, chấm tập nét, `turtleDrawKey`, `EXTRA_LINE` / `MISSING_LINES` / `OFF_PAPER`, luật 26, 3 màn mẫu, đo vét cạn, chốt ADR-0024 | `drawProgram` trong schema (P4-02, phần đầu) | AI (B) | ✅ |
| P4-09 | `TurtleStage` PixiJS + `layout.ts` + `AnswerPicture` turtle + bộ nạp nội dung suy khóa đoán **[e2e nặng]** | P4-08; chữ của P4-06a | AI (B) | ✅ |
| P4-10 | Chi tiết hóa lần hai W8: bản đồ / sa bàn thật, `par` tay, R5 trên vét cạn **không** phép (vét cạn này đã có) | P4-02 (để chạy lời giải); R5 không cần | AI (C) | ✅ |
| P4-11 | Nội dung Thế giới 8 (20 màn + sáng tạo, bài mở đầu + 5 bài, 5 chương) **[par nặng]** | P4-03, P4-04, P4-05, P4-10; e2e cần P4-06 | AI (C soạn; A chạy `par` / R5) · HLV duyệt | 🟨 nháp, chờ HLV chơi thử |
| P4-12 | Chi tiết hóa lần hai W9: hình mẫu thật trên lưới, `par` tay, bẫy T1 | P4-08 | AI (B) | ✅ |
| P4-13 | Nội dung Thế giới 9 (20 màn + sáng tạo, bài mở đầu + 8 bài, 5 chương) **[par nặng]** | P4-08, P4-12; `world.json` cần P4-14; `l16` cần P4-03; e2e cần P4-09 | AI (B) · HLV duyệt | 🟨 nháp, chờ HLV chơi thử |
| P4-14 | Cảnh riêng `xuong-phep-thuat`, `thap-hoa-si` + hình `spellbook`, `wand`, `easel`, `tower` | — | AI (D, đang làm) | ✅ |
| P4-15 | HLV chơi thử W8 | P4-11, P4-06 | HLV (AI sửa) | ⬜ |
| P4-16 | HLV chơi thử W9 | P4-13, P4-09 | HLV (AI sửa) | ⬜ |
| P4-17 | Phát hành `v0.4.0` | P4-15, P4-16 | HLV + AI | ⬜ |

## Thứ tự làm & lịch

| Ngày (dự kiến) | Luồng A (phép, headless) | Luồng B (`turtle`) | Luồng C (web + nội dung W8) |
|---|---|---|---|
| 16–17/10 | **P4-01** spike (việc nặng, chạy trước); song song viết schema (`drawProgram` trước tiên, cho B) và khối của P4-02 | **P4-08**: số học Z[√3], state, khối, mô phỏng | **P4-06a**, **P4-07** |
| 18–21/10 | **P4-02** xong → **P4-03** | **P4-08**: chấm, luật 26, màn mẫu, đo → **P4-12** | **P4-10** (bản đồ, R5 không phép) → **P4-06** khi P4-02 xong |
| 22–25/10 | **P4-04**, **P4-05** | **P4-09** sân chơi | **P4-06** phần hộp (sau P4-04) |
| 26–31/10 | `par` / R5 cho **P4-11** (theo yêu cầu của C) | **P4-13** | **P4-11** |
| 01–05/11 | sửa theo review | sửa theo review | **P4-15**, **P4-16**: HLV chơi thử, AI sửa trong ngày |
| ~07/11 | | | **P4-17** |

**Quy trình mỗi task:**
1. Viết.
2. Review độc lập: code thì `code-reviewer`, nội dung thì critic sư phạm. Không tự duyệt trong cùng ngữ cảnh.
3. Sửa theo review.
4. Chạy lint / typecheck / test / content:check, thêm e2e khi có giao diện. Báo kết quả thật.
5. **Điều phối commit** sau mỗi task. Agent không commit, không push.

## Chia việc song song (3 agent, một cây làm việc chung)

- **Mọi agent làm trong cây chính** `~/projects/codequest`, không dùng worktree, không có thứ tự gộp. Điều phối commit sau mỗi task.
- **Mỗi file chỉ có một chủ.** Agent khác cần sửa file đó thì gửi nội dung cho chủ file qua điều phối.
- File mới chỉ do agent tạo ra nó sửa.
- Trước khi sửa một file không có trong bảng dưới, hỏi điều phối.

| Agent | Task | Chủ của (chỉ agent này sửa) |
|---|---|---|
| **A · phép thuật headless** | P4-01 → P4-02 → P4-03 → P4-04 → P4-05; chạy `par` / R5 cho P4-11 | **Package:** `packages/content-schema/src/level.ts`, `procedures.ts` (mới), `index.ts`; `packages/engine/**`; `packages/validator/**` (kể cả `variableRules.ts`); `tools/par/**` · **Content-check:** `tools/content-check/src/procedures.ts` (mới), `rules.ts` (đăng ký mọi luật, cả luật 26 của B), `difficulty.ts` (M2 có phép, M2 `turtle` bỏ số độ, T1) · **Dữ liệu:** `content/shared/feedback.json` (mọi câu mới, cả 3 câu `turtle` của B); `content/worlds/_sandbox/levels/proc-*.json`; cờ `parUnproven` trong file màn W6 / W7 (gắn ngược) · **Tài liệu:** ADR-0023, `runtime-engine.md`, `game-kind-sdk.md` (cả §1.3 do B gửi), `content-model.md`, `content-authoring.md` (R5, T1, câu chuẩn §5.1 của W8 và W9 do B / C gửi) |
| **B · `turtle`** | P4-08 → P4-09 → P4-12 → P4-13 | **Package:** `packages/games/src/turtle/**` (mới), `packages/games/src/index.ts`, `registerAllBlocks.ts`, `registry.ts` · **Web:** `apps/web/src/stages/turtle/**` (mới), `stages/registry.ts`, `stages/AnswerPicture.tsx`; bộ nạp nội dung `apps/web/src/features/content/**` và `features/play/answerKey.ts` (suy khóa từ `drawProgram`) · **Content-check:** `tools/content-check/src/turtle.ts` (mới, luật 26); `tools/content-check/src/w09.test.ts` · **Dữ liệu:** `content/worlds/_sandbox/levels/turtle-*.json`; `content/worlds/w09-thap-hoa-si/**` · **e2e:** `apps/web/e2e/turtle.spec.ts`, `w09.spec.ts` · **Tài liệu:** ADR-0024, `game-kinds.md`, `curriculum.md` **§6.4** |
| **C · web + nội dung W8** | P4-06a, P4-07 → P4-10 → P4-06 → P4-11 | **Web:** `apps/web/src/i18n/vi.ts` (mọi chữ GĐ 4: `HÀM` → `PHÉP THUẬT`, `BÚT VẼ` → `BÚT`, thẻ kết quả 8 mã mới, HUD `turtle` "Còn 5 nét"); `apps/web/src/blockly/**` (`toolbox.ts`, `theme.ts` có cả nhóm BÚT, `BlocklyWorkspace.tsx`, `blockLimits.ts`, `capacity.ts` mới); `stages/replay.ts`; `apps/web/src/screens/**` (`VarBoxes.tsx`, `LessonDemo.tsx`, editor); `apps/web/src/features/**` **trừ** `features/content/**` và `features/play/answerKey.ts`; giọng đọc · **Content-check:** `tools/content-check/src/curriculum.ts` (`PROVISIONAL_WORLDS`); `tools/content-check/src/w08.test.ts` · **Dữ liệu:** `content/worlds/w08-xuong-phep-thuat/**` (**C là người duy nhất ghi**: A chạy `par` / R5 rồi gửi số `par`, `parEdits`, `maxBlocks`, `maxInstances` và dòng "Ghi chú khi soạn"; C ghi vào file) · **e2e:** `apps/web/e2e/procedures.spec.ts`, `w08.spec.ts` · **Tài liệu:** `blockly-integration.md`, `glossary.md` (thuật ngữ A / B gửi), `curriculum.md` **§6.3** |
| **D · cảnh (đang chạy)** | P4-14 | `packages/content-schema/src/world.ts` (`SCENE_THEMES`, `STORY_PROPS`), `stages/sceneThemes.ts`, `sceneTiles.ts`, `screens/world/storyArt.ts`, e2e cảnh. Khi P4-14 xong, `world.json` của B và C dùng được `xuong-phep-thuat` / `thap-hoa-si` và các hình mới |

**Điểm chạm có thứ tự** (mọi thứ khác chạy độc lập ngay từ ngày đầu):
- A làm trường `predict.options[].drawProgram` **trước tiên** trong P4-02 (nửa ngày). B cần trường này cho màn `predict`. Trước khi có, B vẫn viết code headless được.
- C cần block spec của P4-02 trước khi làm P4-06.
- C làm P4-06a sớm (ngày 1). Nhờ vậy B có chữ HUD và nhóm BÚT mà không phải chờ P4-06.
- `world.json` của W8 / W9 chờ P4-14.
- `l16` của W9 chờ P4-03.
- B **không** phụ thuộc phần còn lại của P4-06.
- Luật 26 và 3 câu `feedback.json` của B: A đăng ký / thêm trong ngày B gửi.

**`PROVISIONAL_WORLDS`:**
- Thế giới tạm (`w08`, `w09`, do C thêm ở P4-06a) **hạ lỗi luật 4 và 7 thành cảnh báo**, nên lỗi thật có thể bị che.
- Mỗi lần báo `content:check`, ghi rõ số cảnh báo luật 4 / 7 của thế giới tạm. Chỉ bỏ thế giới khỏi danh sách (P4-15, P4-16) khi số đó bằng 0 hoặc mỗi cảnh báo có lý do.

### Việc nặng (một lúc chỉ một việc trên cả máy)
- **Nặng** (bắt buộc chạy qua `heavy.sh`):
  - `npm run par` (mọi dạng);
  - test R4 / R5 / spike;
  - `npm run e2e`;
  - `npm run test` toàn workspace (có test vét cạn của `w07.test.ts`);
  - `npm run typecheck` (`tsc -b` dùng chung cache `.tsbuild` trong một cây làm việc: hai lần chạy cùng lúc ghi đè nhau).
- **Nhẹ** (chạy song song được): `npm run lint`; `vitest` của **một** package (trừ test vét cạn); `content:check` trên `_sandbox` hoặc một thế giới.
- **Mọi agent phải dùng helper của điều phối** cho việc nặng, không tự `mkdir` khóa:
  ```bash
  ~/.cache/cq/heavy.sh <tên-agent> <lệnh...>
  # vd: ~/.cache/cq/heavy.sh A npm run par -- w08-l03 --timeout 120
  ```
  Helper chờ khóa (`mkdir .omc/state/heavy.lock`), ghi `owner` (pid + giờ + agent + lệnh), đặt `NODE_OPTIONS=--max-old-space-size=2048`, chạy lệnh, nhả khóa khi thoát (kể cả lỗi), và tự xóa khóa bị bỏ quên khi pid trong `owner` đã chết. Spike cần heap lớn hơn (tối đa 3072) thì ghi rõ trong lệnh. Khóa giữ quá 30 phút: báo điều phối.
- Khi `par` lâu thì chạy một màn mỗi lần; đặt `--timeout` cho mọi lần chạy có thể quá 2 phút.

---

### P4-01 · Spike + chốt ADR-0023 (phép thuật)
**Mục tiêu:** chốt cách vét cạn `par` cho màn có phép **trước** khi xây, vì không gian chương trình là tích (thân phép × chương trình chính).

**Sản phẩm:**
- Bản chép tạm của `packages/validator/src/search/*` để ngoài repo, như spike của ADR-0022. Thêm `Statement { call }`, chạy thân tại chỗ trong `FastSim`, liệt kê tập con S của các phép (ADR-0023 §4, chế độ 1).
- Đo trên 4 màn phác theo §6.3: `l03` (thân cố định, 3 lần gọi), `l08` (gọi trong vòng lặp), `l11` (thân có `lặp đến khi`, 3 bản đồ), `l06` robotlab. Mỗi màn đo:
  - chế độ 1;
  - chế độ 2 với k = 3 và k = 4;
  - R5 với `maxBlocks`, rồi với `maxInstances` trên khối hành động; ngân sách 120 s.
- Ghi số trạng thái, work, thời gian và heap vào ADR-0023, mục "Kết quả spike".
- Quyết định ghi trong ADR:
  - k mặc định của chế độ 2 (hoặc tắt hẳn);
  - ngưỡng để đặt `parUnproven`;
  - cách ép R5 khuyên dùng.

**Nghiệm thu:**
- Bảng số đo có trong ADR-0023.
- ADR chuyển "Chấp nhận" (hoặc ghi phương án thay).
- Không đổi gì trong repo ngoài tài liệu.

### P4-02 · Phép thuật trong engine (headless)
**Mục tiêu:** chạy được chương trình có `dạy phép` / `làm phép` trên Node, tất định, đúng ADR-0023 §1–§3.

**Sản phẩm:**
- **`content-schema`** (làm trước, cho B):
  - `predict.options[].drawProgram` (chỉ cho `turtle`, đúng một trong `key` / `drawProgram`; ADR-0024 mục 5);
  - **mọi chỗ đọc `predict.options[].key`** đổi sang khóa suy ra (`optionKey(level, option)`: `key` nếu có, không thì `turtleDrawKey` của B; B viết hàm ở `@codequest/games`, A nối khi P4-08 có): A sửa validator (`levelRules.ts` kiểm khóa của màn `predict`, luật 23 (j)) và các kiểm `predict` của `content:check`; B sửa bộ nạp web (`features/content/**`, `answerKey.ts`); C sửa `apps/web/src/features/play/session.ts` (`predictPickSummary` so khóa thẻ bé chọn) và thẻ đáp án trong `screens/**`. Test: màn `predict` turtle chỉ có `drawProgram` chấm đúng ở cả ba nơi;
  - `level.procedures` (≤ 3 phép, `id`, `name` ≤ 3 chữ, `param?`), refine id không trùng hộp;
  - `level.parUnproven?: true`.
- **Khối** (`packages/engine/src/blocks/procedures.ts`):
  - `cq_proc_def` (khối gốc, ô `BODY`, không `previous` / `next`) và `cq_proc_call`;
  - `field_cq_proc` theo cách của `field_cq_var`, chạy được cả ở các chỗ không có level: `analyzeWorkspace`, flyout, demo;
  - nhãn và tooltip **đúng từng chữ** bảng §6.3; tooltip không nêu tên nhân vật.
- **Biên dịch:**
  - `function __p_<id>() {…}`; `__call` / `__ret` có tên trong `BASE_RESERVED_WORDS`;
  - event chung `call` / `ret`, tính vào `maxActions`;
  - kiểm tĩnh `NO_SPELL`, `TWO_SPELLS`, `EMPTY_SPELL`, `SPELL_IN_SPELL` trước mọi event, thêm vào `ENGINE_REASONS`.
- **`loopDepth`:** dùng độ sâu hiệu dụng (số vòng lặp quanh chỗ gọi + độ sâu trong thân). W1–W7 không đổi giá trị.
- **`analyzeWorkspace`:**
  - `cq_proc_def` là gốc của chương trình (không là khối rời); khối tính vào `blocksUsed`;
  - `UNUSED_BLOCKS` của `parsons` báo đúng khi phép không được gọi.
- **`editDistance` và `nextStep`** (gợi ý tầng 2) hiểu nhiều chồng: chồng chính, rồi các chồng `dạy phép` theo thứ tự `level.procedures`. Neo có thể là ô `BODY`.
- **Tài liệu:** `runtime-engine.md`.

**Nghiệm thu (unit test):**
- gọi 0 / 1 / 3 lần; dạy mà không gọi; gọi trong vòng lặp;
- quay lại khối ngay sau phép; highlight đi vào thân;
- các mã lý do;
- độ sâu hiệu dụng: phép có vòng lặp gọi trong vòng lặp = 2;
- `blocksUsed`; `parEdits` khi sửa trong thân; `nextStep` thêm khối vào thân phép;
- tất định (2 lần chạy cùng log); snapshot W1–W7 không đổi.

Package vẫn headless; lint / typecheck / test xanh.

### P4-03 · Vét cạn có phép
**Mục tiêu:** `npm run par` chạy được màn có phép, và nói rõ đã chứng minh tới đâu.

**Sản phẩm** (theo ADR-0023 §4, đã chốt ở P4-01):
- `Statement { call; arg? }`; dạng `{ main, defs }` ở `programToWorkspace` / `programFromWorkspace` / `programSize` / `formatProgram` / `programBlockTypes`.
- `FastSim` chạy thân tại chỗ, có nhớ.
- Chế độ 1: liệt kê tập con S, catalogue chỉ có `làm phép p ∈ S`, hằng số `Σ(1 + |thân|)`, lấy nhỏ nhất qua S, cắt S theo kết quả tốt nhất.
- Chế độ 2: `--proc-bodies k`.
- Catalogue tôn trọng độ sâu hiệu dụng.
- `npm run par` báo ⚠ cho cờ `parUnproven` cũ. Việc này chỉ nằm ở `npm run par`; `content:check` không bao giờ vét cạn.
- `parsons.ts` ghép hai chồng; `fixes.ts` sửa được trong thân.
- Helper `withoutProcedures(level)` cho test R5, có ngân sách 120 s mỗi màn; hết ngân sách thì trả "⚠ R5".
- Dòng kết quả của `tools/par` ghi rõ chế độ, vd "✔ par (thân phép theo lời giải)".

**Nghiệm thu:**
- Test tái lập số đo của spike (sai lệch nhỏ thì ghi lại).
- Màn mẫu `_sandbox/proc-*` đúng `par`; R5 đúng trên 2 màn mẫu.
- **Hồi quy W1–W7, có ngân sách:**
  - Bộ mẫu cố định 5 màn mỗi thế giới (một guided, một bughunt, một parsons, một màn nhiều bản đồ, boss; ghi danh sách trong test) chạy `--timeout 60` mỗi màn, kết quả **giống từng ký tự** trước thay đổi (trừ thời gian). Tổng ≤ 20 phút, một việc nặng.
  - Chạy đủ `--world w01…w07` một lần trước P4-17, mỗi thế giới ≤ 15 phút.
- **[nặng]**

### P4-04 · Hộp của phép (tham số)
**Mục tiêu:** phép có một số, nối với hộp của W7 (ADR-0022), không cần capacity guard.

**Sản phẩm:** theo ADR-0023 §2.
- **Khối:**
  - `cq_proc_def_n`: nhãn hộp lấy từ `param.name`;
  - `cq_proc_call_n`: `field_number` 0…`max`, ghim trong thanh khối.
- **Chỗ của hộp:** hộp khai báo ở `procedures[].param`, gộp vào `vars`.
  - `__call` đặt hộp = số (qua `applyVarCall`; vượt `max` → `BOX_FULL`), `__ret` đặt về 0, mỗi lần ghi `var`.
  - `field_cq_var` chỉ hiện hộp của phép khi khối nằm trong thân phép đó.
  - Dùng hộp ngoài thân → `BOX_OUTSIDE_SPELL`.
- **Sửa luật 23** (`variableRules.ts`):
  - (b), (c), (d), (e), (k) tính cả hộp của phép;
  - (j): đuôi khóa đoán chỉ gồm hộp của màn;
  - R4: màn chỉ có hộp của phép đạt khi lời giải có ≥ 2 lần `làm phép … với` với số khác nhau; phép thử "bỏ khối biến" của R4 thay bằng R5.
- **Vét cạn:** mỗi số ghim là một mục catalogue.

**Nghiệm thu (unit test):**
- gọi với 1 rồi 3 (đi 1 rồi 3); hộp về 0 sau phép;
- hộp ngoài thân bị chặn; dropdown theo khối cha; vượt `max`;
- luật 23 sửa có fixture cho từng nhánh;
- vét cạn đúng `par` màn mẫu "cầu thang"; tất định.

### P4-05 · `content:check` cho phép thuật (và phần `turtle` của luật 24)
**Sản phẩm:**
- **Luật 25** (a)–(j) của ADR-0023 §5: chỉ kiểm tĩnh, mỗi luật một fixture `extra-25-*`.
- **Luật 20** dùng độ sâu hiệu dụng. **Luật 7** nhận `cq_proc_*` là khối mới (lần đầu ở W8).
- **Luật 24:**
  - M2 tính hình lời giải gồm chồng chính + thân phép;
  - với `turtle`: bỏ số bước **và** số độ, coi ảnh gương là một;
  - T1 (cảnh báo): màn `turtle` `build` / `bughunt` khai báo ≥ 1 chương trình sai vẽ nét lạ; danh sách nằm ở test của thế giới, `difficulty.ts` kiểm là có.
- **`feedback.json`:** câu cho 5 mã mới của phép và 3 mã `turtle` (B gửi), theo luật 17.
- **Gắn ngược `parUnproven`** cho W6 boss, W7 `l16`, `l19`, boss (hỏi điều phối trước khi sửa file W6 / W7).
- **Tài liệu:**
  - `content-model.md`: trường mới, luật 25, sửa luật 20 / 23;
  - `content-authoring.md`: R5, công thức tiết kiệm `(c − 1)(b − 1) ≥ 3`, T1, câu chuẩn §5.1 của 9 khối mới và các ý mới W8 / W9.
- **3 màn mẫu `_sandbox`:** thân cố định, hai phép, có hộp.

**Nghiệm thu:** fixture đỏ đúng chỗ; `content/` xanh; lint / typecheck / test xanh.

### P4-06a · Chữ giao diện GĐ 4
**Sản phẩm:**
- `apps/web/src/i18n/vi.ts`:
  - nhóm thanh khối `HÀM` → `PHÉP THUẬT`, `BÚT VẼ` → `BÚT`;
  - câu thẻ kết quả cho `NO_SPELL`, `TWO_SPELLS`, `EMPTY_SPELL`, `SPELL_IN_SPELL`, `BOX_OUTSIDE_SPELL`, `EXTRA_LINE`, `MISSING_LINES`, `OFF_PAPER` (giống `feedback.json`);
  - bong bóng "Đang làm phép «…»";
  - HUD `turtle` "Còn 5 nét" (mẫu có số).
- `tools/content-check/src/curriculum.ts`: thêm `w08-xuong-phep-thuat` → `P4-15` và `w09-thap-hoa-si` → `P4-16` vào `PROVISIONAL_WORLDS`.

**Nghiệm thu:** test `vi.ts` / toolbox có sẵn xanh; câu ≤ 12 chữ, số viết bằng chữ số.

### P4-06 · Web phép thuật
**Mục tiêu:** bé kéo, ghép, chạy và xem phát lại một chương trình có phép trên laptop.

**Sản phẩm:**
- **Thanh khối:** `toolbox.ts` / `theme.ts` có nhóm PHÉP THUẬT (category `function`) và BÚT (category `pen`), style riêng, đủ tương phản. `knownBlockSpecs` có khối phép.
- **Khối `dạy phép`:**
  - không bị làm xám như khối rời: kiểm `disable-top-blocks` / `disableOrphans` và thêm ngoại lệ;
  - có hình "mũ";
  - flyout ẩn mục `dạy phép X` khi workspace đã có;
  - `field_cq_proc` lấy tên từ level, cả trong flyout.
- **`blockLimits.ts`:** dùng `loopDepth` hiệu dụng. Kéo `làm phép` (phép có vòng lặp) vào vòng lặp ở W8 thì bị hoàn tác.
- **Phát lại** (`replay.ts`):
  - `call` sáng viền khối `dạy phép` và hiện bong bóng "Đang làm phép «…»"; `ret` tắt;
  - "Từng bước" dừng ở `call` / `ret`;
  - `VarBoxes` hiện hộp của phép trong lúc làm phép, rồi về 0.
- **Còn lại:**
  - thẻ kết quả cho các mã mới;
  - `LessonDemo` chạy thẻ demo có phép;
  - level editor gặp màn có `procedures` → "Chưa hỗ trợ phép thuật" (có test);
  - câu mới vào bộ giọng đọc (`npm run voice -- check` xanh).

**Nghiệm thu:**
- Unit test toolbox / flyout / bộ đọc event / bộ chặn độ sâu.
- e2e 1280×720 và 1366×768 trên màn `_sandbox`: ghép phép rồi thắng; dạy mà không gọi (Măng đứng yên); `NO_SPELL`; hộp của phép đổi số theo từng bước; demo bài giảng.
- Ảnh chụp trong PR.
- **[e2e nặng]**

### P4-07 · Capacity guard
**Mục tiêu:** sẵn sàng cho khối có shadow ở W10 (`biến + biến`, tham số cắm ô), như `blockly-integration.md` §5 đã hứa. W8–W9 **không** cần: mọi ô số là field (ADR-0022, 0023, 0024).

**Sản phẩm:**
- `apps/web/src/blockly/capacity.ts`: đếm theo `analysis.blocksUsed`, chặn `BLOCK_CREATE` vượt mức, hoàn tác cả nhóm như `guardBlockLimits`. Chưa bật ở màn nào.
- `content:check` vẫn báo lỗi shadow trong màn có `maxBlocks`, tới khi guard được bật bằng ADR.

**Nghiệm thu:**
- Unit test bằng workspace headless có `controls_repeat_ext` + shadow.
- Không đổi hành vi màn hiện có (e2e có sẵn xanh).
- Được hoãn nếu luồng C chậm.

### P4-08 · `turtle` headless
**Mục tiêu:** cài đúng ADR-0024, chạy trên Node; đủ để soạn W9.

**Sản phẩm:**
- **`packages/games/src/turtle/`:**
  - `lattice.ts`: điểm `(a, b, c, d)` nguyên trong Z[√3], 12 hướng, bước đơn vị, kiểm còn trong giấy;
  - `config.ts` (zod): `size`, `start`, `target` dạng đường gấp khúc nở thành nét đơn vị, `angles`, `penDown`, `grid`;
  - `state.ts`, `events.ts`;
  - `blocks.ts`: 5 khối, nhãn và tooltip **đúng từng chữ** §6.4 (tooltip bắt đầu bằng nhãn), `DEG` là dropdown tĩnh 30…180;
  - `sim.ts`;
  - `evaluate.ts`: `MISSING_LINES`; `turtleDrawKey(config, workspace)` thuần, export ra ngoài;
  - `reasons.ts`, `turtle.test.ts`;
  - đăng ký vào registry.
- **Luật 26** (`tools/content-check/src/turtle.ts`, A đăng ký vào `rules.ts`):
  - `target` hợp lệ trên lưới và nằm trong giấy;
  - `start` là một đỉnh của hình mẫu (`predict` không có `target`: điểm lưới nguyên);
  - góc ghim ⊆ `angles`; ô `N` ghim, hoặc mở 1–9;
  - lời giải vẽ đúng `target`;
  - `predict`: suy khóa từ `drawProgram`, các khóa khác nhau, đúng một khóa trùng kết quả của `initialWorkspace`.
- **3 màn mẫu `_sandbox`:** hình vuông, lục giác, 3 hình vuông lặp lồng. Đo `npm run par` (số trạng thái, thời gian), ghi vào ADR-0024 → "Chấp nhận".
- **Tài liệu:** viết lại `game-kinds.md` §3.4; gửi đoạn §1.3 (event turtle) của `game-kind-sdk.md` cho A.

**Nghiệm thu (unit test):**
- Số học:
  - 12 hướng × bước quay về đúng điểm đầu, chính xác;
  - tam giác, lục giác, 12-giác khép kín.
- Tập nét:
  - vẽ lại nét cũ không sao; tiến 2 = tiến 1 + tiến 1; không theo thứ tự.
- Chấm và mã lý do:
  - `EXTRA_LINE` dừng đúng ở nét lạ; `OFF_PAPER`; `MISSING_LINES`; bút nhấc thì không vẽ;
  - `turtleDrawKey` cho cùng khóa với `predictAnswer` của lần chạy.
- Tất định.
- Schema / luật 26 từ chối:
  - góc ghim ngoài tập;
  - `target` lệch lưới;
  - `start` không nằm trên hình mẫu.
- Package vẫn headless; `npm run par` đúng `par` của 3 màn mẫu.

### P4-09 · `TurtleStage`
**Mục tiêu:** bé thấy hình mẫu, thấy Măng vẽ từng nét, và thấy ngay nét lạ.

**Sản phẩm:**
- **Sân chơi:** `apps/web/src/stages/turtle/` gồm `TurtleStage.ts` và `layout.ts` (thuần: đổi Z[√3] → pixel; số thực chỉ dùng ở đây). Đăng ký vào `stageKinds`.
- **Hình vẽ trên sân:**
  - giấy có chấm lưới vuông hoặc tam giác;
  - hình mẫu là nét đứt nhạt, nét đã vẽ màu mực;
  - Măng cầm bút lông, quay được 12 hướng; bút nhấc và bút hạ có hình khác nhau.
- **Diễn event:**
  - `line` vẽ dần từng nét;
  - `extraLine` tô đỏ nét lạ và rung;
  - `offPaper`.
- **HUD** "Còn 5 nét" (chữ từ P4-06a).
- **`AnswerPicture` turtle:** vẽ lại hình từ khóa `draw:…`.
- **Bộ nạp nội dung** suy `key` từ `drawProgram` (`turtleDrawKey` / `optionKey`). Mọi nơi đọc khóa thẻ đáp án dùng khóa suy ra (P4-02: validator và `content:check` do A, `session.ts` và `screens/**` do C, bộ nạp và `answerKey.ts` do B).
- Tốc độ / tạm dừng / Từng bước đi qua `StageController` chung.

**Nghiệm thu:**
- `layout.ts` có unit test.
- e2e (1280×720, 1366×768) trên 3 màn mẫu:
  - thắng màn hình vuông;
  - `EXTRA_LINE` hiện nét đỏ;
  - màn `predict` đủ hình đáp án.
- Ảnh chụp trong PR.
- **[e2e nặng]**

### P4-10 · Chi tiết hóa lần hai Thế giới 8
**Mục tiêu:** bảng §6.3 thành "Chi tiết từng màn" như §6.2: bản đồ / sa bàn thật, chương trình, kết quả chạy trên engine thật.

**Sản phẩm:**
- Bản đồ từng màn:
  - mê cung `build` / `bughunt` có ≥ 2 ngã ba và ngõ cụt có việc;
  - chuỗi lặp lại không đều;
  - phép tiết kiệm khối (`(c − 1)(b − 1) ≥ 3`).
- `par` tính tay.
- Cách ép R5 cho từng màn (`maxBlocks` hoặc `maxInstances`).
- **R5 kiểm ngay** bằng vét cạn có sẵn (thanh khối không có khối phép) tới `maxBlocks`, ngân sách 120 s mỗi màn. Bước này không cần P4-02.
- Sau P4-02: chạy lời giải trên engine thật; ghi lệch kế hoạch vào "Ghi chú khi soạn".

**Nghiệm thu:**
- §6.3 có "Chi tiết từng màn".
- Review sư phạm độc lập đạt:
  - mỗi màn một ý;
  - chữ ≤ 12, số bằng chữ số;
  - "Khối mới! …" đúng tooltip;
  - gợi ý là câu hỏi;
  - không công thức nào lặp quá 2 lần.

### P4-11 · Nội dung Thế giới 8 · Xưởng Phép Thuật
Như P3-04 / P3-11, theo §6.3 đã chi tiết hóa. C là người duy nhất ghi file của `content/worlds/w08-xuong-phep-thuat/`; A chạy `par` / R5 và gửi số.

**Sản phẩm:**
- `world.json`: 5 chương, cảnh `xuong-phep-thuat` (cần P4-14), unplugged "Thẻ phép thuật".
- `w08-lesson` + 5 bài.
- 20 màn + `w08-creative`.

**Nghiệm thu:**
- `content:check` xanh. Mọi cảnh báo luật 4 / 7 / 24 / 25 có lý do trong "Ghi chú khi soạn" (thế giới tạm: xem `PROVISIONAL_WORLDS`).
- `npm run par -- --world w08`: mọi màn build / bughunt ✔, hoặc ⚠ có cờ `parUnproven` (boss) / "⚠ R5" có ghi chú.
- `tools/content-check/src/w08.test.ts` có:
  - demo bài giảng; đáp án màn đoán; từng cách sửa;
  - **R5**: bỏ khối phép thì không gì thắng, ngân sách 120 s mỗi màn, trừ guided;
  - độ sâu hiệu dụng ≤ 1;
  - chữ "khối" / "lệnh"; gợi ý `enter` = "Khối mới! " + tooltip;
  - gợi ý `TOO_MANY_BLOCKS` / `capacityFull` chỉ về phép.
- e2e smoke `w08-l01` và boss.
- **HLV chơi thử trước khi merge** (AI không tự đánh dấu).
- **[par nặng]**

### P4-12 · Chi tiết hóa lần hai Thế giới 9
**Sản phẩm:**
- Hình mẫu thật của từng màn: đường gấp khúc trên lưới, giấy ≤ 12 × 12, `start` là một đỉnh của hình.
- Chương trình đúng (đã mô phỏng ở §6.4, chạy lại trên engine thật) và `par` tay.
- Chương trình sai của bẫy T1.

**Nghiệm thu:** §6.4 có "Chi tiết từng màn"; review sư phạm độc lập như P4-10. Phải kiểm thêm: mỗi hình lời giải (bỏ số, bỏ độ) dùng ≤ 2 lần.

### P4-13 · Nội dung Thế giới 9 · Tháp Họa Sĩ
Như P4-11, cho `w09-thap-hoa-si`.

**Sản phẩm:**
- `world.json`: 5 chương, cảnh `thap-hoa-si` (cần P4-14), unplugged "Rùa băng keo".
- `w09-lesson` + 8 bài (4 bài "Khối mới", 4 bài ý mới).
- 20 màn + `w09-creative`.
- Màn `predict` soạn lựa chọn bằng `drawProgram`.

**Nghiệm thu:** như P4-11 cho `w09`, cộng thêm:
- test "vòng trong chạy hết" (đáp án `l11`);
- test "khối sai vòng vẽ nét lạ" (`l12`);
- T1: mọi màn `build` / `bughunt` có ≥ 1 chương trình sai vẽ nét lạ;
- boss: không có `nhấc bút` thì không thắng;
- `l16` vét cạn ở chế độ thân cố định, R5 với `maxBlocks` 12.

**HLV chơi thử trước khi merge.** **[par nặng]**

### P4-14 · Cảnh riêng W8, W9 (đang làm, agent D)
**Sản phẩm:**
- `SCENE_THEMES` thêm hai cảnh, làm theo cách của P2-23 (`sceneThemes.ts`, `sceneTiles.ts`, vẽ bằng mã, "Pixel ấm áp"):
  - `xuong-phep-thuat`: xưởng gỗ, kệ sách phép, lọ sao;
  - `thap-hoa-si`: tháp 5 tầng, giá vẽ, bảng màu.
- `STORY_PROPS` thêm `spellbook`, `wand`, `easel`, `tower`, có hình tạm 12×12 ở `storyArt.ts`.

**Nghiệm thu:**
- `sceneThemes.test.ts` xanh.
- e2e cảnh có ảnh chụp 1280×720.
- Không đổi cảnh W1–W7.

### P4-15 · HLV chơi thử W8
HLV mở khóa W8 bằng tay ở Góc huấn luyện viên (như P3-06), chơi hết bài và màn, ghi góp ý. AI sửa trong ngày.

**Nghiệm thu:**
- HLV ghi "đạt" từng màn.
- Cảnh báo luật 4 / 7 của `w08` bằng 0 hoặc có lý do; bỏ `w08-xuong-phep-thuat` khỏi `PROVISIONAL_WORLDS`.
- Đây là việc của HLV; AI không tự đánh dấu.

### P4-16 · HLV chơi thử W9
Như P4-15, cho `w09-thap-hoa-si`.

### P4-17 · Phát hành `v0.4.0`
**Nghiệm thu:**
- P4-15 và P4-16 đạt.
- lint / typecheck / test / content:check / e2e xanh.
- Hồi quy đủ `npm run par -- --world w01…w07` (P4-03) giống trước.
- Ghi chú phát hành (W8–W9, phép thuật, `turtle`) trong tin nhắn tag.
- Tag `v0.4.0` (HLV push).
