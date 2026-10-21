# GĐ 5 · Học Viện Thuật Toán (17/10/2026 → ~14/11/2026, rồi `v1.0.0`)

**Mục tiêu giai đoạn:**
- Có Thế giới 10 "🧠 Học Viện Thuật Toán" chơi được: dạy **thuật toán** (tìm kiếm lần lượt, sắp xếp nổi bọt, đường ngắn nhất) và **so sánh hai cách đúng**.
  - Kiểu game mới `sorter` ("Kệ sách", ADR-0025).
  - Mê cung có thêm **bước sức** (`stepLimit`, ADR-0026).
  - Robot quay lại ở một màn tổng ôn.
- 20 màn + bài giảng, đủ luật soạn của đợt tăng độ khó (mỗi màn một ý, mê cung thật, không lặp công thức) và luật S1–S4 của W10 (`curriculum.md` §6.5).
- Đóng khóa học: chương truyện cuối "Ngày tốt nghiệp". Phát hành `v0.5.0` (W10), rồi `v1.0.0` khi HLV duyệt đủ 10 thế giới.

**Nghiệm thu giai đoạn:**
- W10 qua `content:check` và `npm run par`. Màn ⚠ có cờ `parUnproven` (hoặc ghi "⚠ R5") kèm ghi chú.
- e2e của `sorter`, bước sức và W10 xanh, có ảnh chụp.
- Snapshot và `par` của W1–W9 **không đổi** (bước sức chỉ vào state khi màn có `stepLimit`).
- HLV chơi thử và duyệt từng màn (AI không tự đánh dấu).
- Tag `v0.5.0`. Sau P5-12: tag `v1.0.0`.

> **Bối cảnh lúc viết (16/10/2026):**
> - W1–W9 là nháp, chờ HLV chơi thử. W8, W9 vừa soạn xong (P4-11, P4-13); P4-15, P4-16 (HLV chơi thử) chưa làm.
> - HLV giao: làm thế giới mới **tự động, nhanh, nhiều agent song song**, không hỏi. Câu hỏi sản phẩm ghi ở `coach-questions.md` mục J, mỗi câu có mặc định.
> - Tài liệu thiết kế: `product/curriculum.md` §6.5 (W10); ADR-0025 (`sorter`, Đề xuất); ADR-0026 (bước sức, Đề xuất).
>
> **Quyết định của điều phối (16/10/2026):**
> - W10 dạy thuật toán bằng **ghép** các ý đã học, không thêm cú pháp mới. Không làm phép gọi phép, tham số cắm ô, `biến + biến` (lý do ở §6.5). Capacity guard (P4-07) vẫn chưa bật.
> - Kiểu game mới duy nhất là `sorter`, theo ADR-0025. Khung "Băng chuyền" cũ ở `game-kinds.md` §3.6 bị thay.
> - Mê cung chỉ thêm `stepLimit`. Robotlab, turtle không đổi engine.
> - **Xem code JS/Python** (phần cũ của khung GĐ 5) để sau `v1.0.0` (P5-14, mặc định J13).
> - Lỗi chặn từ buổi chơi thử W1–W9 (P4-15, P4-16) luôn làm trước task GĐ 5.
>
> **Máy dev:** RAM thật **7,8 GB**. **Mỗi lúc chỉ một việc nặng** (xem "Việc nặng", giống `phase-4.md`). File này thay khung GĐ 5 ở `later-phases.md`.

> **Trạng thái ngày 21/10/2026** (xác minh bằng code, không tin ô tick cũ):
> - **Xong và đã ở trên `main`:** P5-01 (chữ GĐ 5), P5-02 (`sorter` headless + ADR-0025),
>   P5-03 (bước sức của maze + ADR-0026), P5-04 (vét cạn + `content:check` luật 27/28 —
>   `content:check` đang báo "rules 1–28"), P5-08 (cảnh `hoc-vien` trong `sceneThemes.ts`).
> - **Chưa bắt đầu:** P5-05 trở đi. Cụ thể là **chưa có `SorterStage`**, nên kiểu game
>   `sorter` chạy được trên Node mà **chưa chơi được trong trình duyệt**; và **chưa có
>   `content/worlds/w10-*`**, nên W10 chưa tồn tại với bé. Không có chữ `w10` nào trong
>   `apps/`, `packages/`, `content/`.
> - W1–W9 chơi được đủ, đó là phần bé học hiện nay.

| ID | Task | Phụ thuộc | Người làm | Trạng thái |
|---|---|---|---|---|
| P5-01 | Chữ giao diện GĐ 5 trong `i18n/vi.ts` (nhóm KỆ SÁCH, thẻ kết quả 7 mã mới, HUD "Còn 10 lượt hỏi", "Còn 9 bước", "Đổi chỗ: 3") + `PROVISIONAL_WORLDS` cho `w10` | — | AI (C) | ✅ |
| P5-02 | `sorter` headless: config, state, 6 khối, mô phỏng, chấm, lượt hỏi, khóa đoán, luật 27, 3 màn mẫu, đo vét cạn, chốt ADR-0025 **[nặng: đo]** | — | AI (B) | ✅ |
| P5-03 | Bước sức của maze (`stepLimit`): state, `OUT_OF_STEPS`, event `tired`, vét cạn (so sánh trội nếu cần), luật 28, hồi quy W1–W9, đo, chốt ADR-0026 **[nặng]** | — | AI (A) | ✅ |
| P5-04 | Vét cạn + `content:check` cho W10: đăng ký luật 27 / 28, khung test S1 / S2 (`SORTER_TRAPS`, "cách chậm"), luật 24 (M2) hiểu `sorter`, `feedback.json`, màn mẫu có phép + `maxQuestions`, câu chuẩn của mọi ý W10, tài liệu **[nặng: R5]** | P5-02 (khối, config), P5-03 | AI (A) | ✅ |
| P5-05 | `SorterStage` PixiJS + `layout.ts` + `AnswerPicture` kệ sách + bộ nạp nội dung **[e2e nặng]** | P5-02; chữ của P5-01 | AI (B) | ⬜ |
| P5-06 | Web cho W10: thanh khối / theme KỆ SÁCH, HUD bước sức của maze, phát lại `swap` / `tired` / `outOfQuestions`, `LessonDemo` kệ sách, editor "chưa hỗ trợ", giọng đọc **[e2e nặng]** | P5-01, P5-02 (block spec), P5-03 (event `tired`); phần `LessonDemo` kệ sách và e2e demo cần P5-05 | AI (C) | ⬜ |
| P5-07 | Chi tiết hóa lần hai W10: kệ thật, bản đồ mê cung và sa bàn robot thật, `par` tay, bẫy S1, "cách chậm" S2, câu bài và gợi ý; review sư phạm | P5-02, P5-03 (để chạy lời giải); bản đồ vẽ tay làm ngay | AI (C; B gửi phần kệ sách) | ⬜ |
| P5-08 | Cảnh `hoc-vien` (thư viện trên mây, vườn hàng rào cây xén) + hình `bookshelf`, `diploma` | — | AI (D) | ✅ |
| P5-09 | Nội dung Thế giới 10 (20 màn + sáng tạo, bài mở đầu + 14 bài, 5 chương) **[par nặng]** | P5-04, P5-07; `world.json` cần P5-08; e2e cần P5-05, P5-06 | AI (C soạn; A chạy `par` / R5) · HLV duyệt | ⬜ |
| P5-10 | HLV chơi thử W10 | P5-09 | HLV (AI sửa) | ⬜ |
| P5-11 | Phát hành `v0.5.0` | P5-10, P4-17 (`v0.4.0` phát hành trước) | HLV + AI | ⬜ |
| P5-12 | Hoàn thiện trước `1.0`: lỗi chặn của mọi buổi chơi thử, `PROVISIONAL_WORLDS` rỗng, hồi quy `par` đủ W1–W10, e2e đủ, tài liệu khớp code **[par nặng, e2e nặng]** | P5-11; HLV duyệt xong W1–W9 (P4-15, P4-16 và các đợt trước) | AI (A, B, C) | ⬜ |
| P5-13 | Phát hành `v1.0.0` (đủ 10 thế giới HLV đã duyệt) | P5-12 | HLV + AI | ⬜ |
| P5-14 | Xem code JS song song với khối (cần ADR-0027) | sau P5-13 (mặc định J13) | AI (C) | ⬜ (ưu tiên thấp) |

## Thứ tự làm & lịch

| Ngày (dự kiến) | Luồng A (headless chung) | Luồng B (`sorter`) | Luồng C (web + nội dung W10) | Luồng D (cảnh) |
|---|---|---|---|---|
| 17–19/10 | **P5-03**: state, luật, test, hồi quy W1–W9 | **P5-02**: config, state, khối, mô phỏng, chấm | **P5-01**; **P5-07** phần bản đồ vẽ tay | **P5-08** |
| 20–24/10 | **P5-03** đo → **P5-04** | **P5-02** luật 27, màn mẫu, đo (việc nặng) → **P5-05** | **P5-07** chạy lời giải (sau P5-02, P5-03) → **P5-06** | **P5-08** xong |
| 25–31/10 | `par` / R5 cho **P5-09** (theo yêu cầu của C) | **P5-05**; gửi `SORTER_TRAPS` cho C | **P5-09** | |
| 01–07/11 | sửa theo review | sửa theo review | **P5-09** xong, e2e | |
| 08–12/11 | | | **P5-10**: HLV chơi thử, AI sửa trong ngày | |
| ~14/11 | | | **P5-11** | |
| sau khi HLV duyệt W1–W10 | **P5-12** | **P5-12** | **P5-12** → **P5-13** | |

**Quy trình mỗi task** (như GĐ 4):
1. Viết.
2. Review độc lập: code thì `code-reviewer`, nội dung thì critic sư phạm. Không tự duyệt trong cùng ngữ cảnh.
3. Sửa theo review.
4. Chạy lint / typecheck / test / content:check, thêm e2e khi có giao diện. Báo kết quả thật.
5. **Điều phối commit** sau mỗi task. Agent không commit, không push.

## Chia việc song song (4 agent, một cây làm việc chung)

- **Mọi agent làm trong cây chính** `~/projects/codequest`, không dùng worktree. Điều phối commit sau mỗi task.
- **Mỗi file chỉ có một chủ.** Agent khác cần sửa file đó thì gửi nội dung cho chủ file qua điều phối.
- File mới chỉ do agent tạo ra nó sửa.
- Trước khi sửa một file không có trong bảng dưới, hỏi điều phối.

| Agent | Task | Chủ của (chỉ agent này sửa) |
|---|---|---|
| **A · headless chung** | P5-03 → P5-04; chạy `par` / R5 cho P5-09; phần headless của P5-12 | **Package:** `packages/games/src/maze/**` (`stepLimit`); `packages/engine/**`; `packages/validator/**`; `packages/content-schema/src/level.ts`, `index.ts`; `tools/par/**` · **Content-check:** `tools/content-check/src/stepLimit.ts` (mới, luật 28), `rules.ts` (đăng ký mọi luật, cả luật 27 của B), `difficulty.ts` (M2 hiểu `sorter`) · **Dữ liệu:** `content/shared/feedback.json` (mọi câu mới, cả 6 câu `sorter` của B); `content/worlds/_sandbox/levels/maze-step-*.json` · **Tài liệu:** ADR-0026, `runtime-engine.md`, `game-kind-sdk.md` (cả §1.3 do B gửi), `content-model.md`, `content-authoring.md` (S1–S4, câu chuẩn §5.1 của W10 do B / C gửi). Đoạn §3.2 của `game-kinds.md` gửi cho B |
| **B · `sorter`** | P5-02 → P5-05; gửi phần kệ sách của P5-07 | **Package:** `packages/games/src/sorter/**` (mới), `packages/games/src/index.ts`, `registerAllBlocks.ts`, `registry.ts` · **Web:** `apps/web/src/stages/sorter/**` (mới), `stages/registry.ts`, `stages/AnswerPicture.tsx`; `apps/web/src/features/content/**`, `features/play/answerKey.ts` · **Content-check:** `tools/content-check/src/sorter.ts` (mới: luật 27, bộ chạy `SORTER_TRAPS`) · **Dữ liệu:** `content/worlds/_sandbox/levels/sorter-*.json` · **e2e:** `apps/web/e2e/sorter.spec.ts` · **Tài liệu:** ADR-0025, `game-kinds.md` (cả file; §3.2 bước sức do A gửi), `architecture/stage-rendering.md` (`SorterStage`) |
| **C · web + nội dung W10** | P5-01 → P5-07 → P5-06 → P5-09 → P5-10 | **Tools:** `tools/level-editor/**` ("Chưa hỗ trợ kệ sách"), `tools/voice/**` (giọng đọc) · **Web:** `apps/web/src/i18n/vi.ts`; `apps/web/src/blockly/**`; `stages/replay.ts`; `apps/web/src/stages/maze/**` (chỉ HUD bước sức và hoạt ảnh `tired`); `apps/web/src/screens/**`; `apps/web/src/features/**` **trừ** `features/content/**` và `features/play/answerKey.ts`; giọng đọc · **Content-check:** `tools/content-check/src/curriculum.ts` (`PROVISIONAL_WORLDS`), `tools/content-check/src/w10.test.ts` (dùng bộ chạy của B) · **Dữ liệu:** `content/worlds/w10-hoc-vien/**` (**C là người duy nhất ghi**: A gửi số `par`, `parEdits`, `maxBlocks`; B gửi kệ và `SORTER_TRAPS`) · **e2e:** `apps/web/e2e/step-limit.spec.ts`, `w10.spec.ts` · **Tài liệu:** `blockly-integration.md`, `glossary.md` (thuật ngữ A / B gửi), `curriculum.md` **§6.5**, `coach-questions.md` mục J |
| **D · cảnh** | P5-08 | `packages/content-schema/src/world.ts` (`SCENE_THEMES`, `STORY_PROPS`), `stages/sceneThemes.ts`, `sceneTiles.ts`, `screens/world/storyArt.ts`, e2e cảnh. Khi P5-08 xong, `world.json` của C dùng được `hoc-vien`, `bookshelf`, `diploma`; `SorterStage` của B đọc màu nền kệ từ theme |

**Điểm chạm có thứ tự** (mọi thứ khác chạy độc lập ngay từ ngày đầu):
- B chốt **block spec và config** của `sorter` trước tiên trong P5-02 (nửa ngày). C cần chúng cho P5-01 / P5-06, A cần cho P5-04.
- A chốt **event `tired` và trường `stepLimit`** trước tiên trong P5-03. C cần cho HUD maze.
- Luật 27 và 6 câu `feedback.json` của B: A đăng ký / thêm trong ngày B gửi.
- `world.json` của W10 chờ P5-08.
- `l13`, `l17` (có phép) dùng vét cạn phép của GĐ 4 (đã có). `l05`, `l06`, `l16` dùng hộp của W7 (đã có).
- B **không** phụ thuộc phần còn lại của P5-06.

**`PROVISIONAL_WORLDS`:** như GĐ 4. `w10-hoc-vien` → `P5-10` (C thêm ở P5-01). Mỗi lần báo `content:check`, ghi số cảnh báo luật 4 / 7 của thế giới tạm. Chỉ bỏ khỏi danh sách khi số đó bằng 0 hoặc mỗi cảnh báo có lý do.

### Việc nặng (một lúc chỉ một việc trên cả máy)
Giống `phase-4.md` mục "Việc nặng":
- **Nặng:** `npm run par`, `npm run e2e`, `npm run test` toàn workspace, `npm run typecheck`, test đo / R5. Mọi việc nặng chạy qua `~/.cache/cq/heavy.sh <tên-agent> <lệnh...>`.
- **Nhẹ:** `npm run lint`, `vitest` của một package (trừ test vét cạn), `content:check` trên `_sandbox` hoặc một thế giới.
- Khi `par` lâu thì chạy một màn mỗi lần; đặt `--timeout` cho mọi lần chạy có thể quá 2 phút.

---

### P5-01 · Chữ giao diện GĐ 5
**Sản phẩm:**
- `apps/web/src/i18n/vi.ts`:
  - nhóm thanh khối `KỆ SÁCH`;
  - câu thẻ kết quả cho `OFF_SHELF`, `NO_BOOK_RIGHT`, `OUT_OF_QUESTIONS`, `NOT_SORTED`, `NOT_FOUND`, `NOT_AT_END`, `OUT_OF_STEPS` (giống `feedback.json` của P5-04);
  - HUD "Còn 10 lượt hỏi", "Còn 9 bước", "Đổi chỗ: 3" (mẫu có số).
- `tools/content-check/src/curriculum.ts`: thêm `w10-hoc-vien` → `P5-10` vào `PROVISIONAL_WORLDS`.

**Nghiệm thu:** test `vi.ts` / toolbox có sẵn xanh; câu ≤ 12 chữ, số viết bằng chữ số.

### P5-02 · `sorter` headless
**Mục tiêu:** cài đúng ADR-0025, chạy trên Node; đủ để soạn W10.

**Sản phẩm:**
- **`packages/games/src/sorter/`:**
  - `config.ts` (zod): `books`, `goal { sorted?, find?, end? }`, `maxQuestions?`, kèm refine;
  - `state.ts`: `{ books, p }`, cộng `questions` chỉ khi màn có `maxQuestions`;
  - `events.ts`: `move`, `swap`, `outOfQuestions`;
  - `blocks.ts`: 6 khối, nhãn và tooltip **đúng từng chữ** `curriculum.md` §6.5 (tooltip bắt đầu bằng nhãn, không nêu tên nhân vật);
  - `sim.ts`;
  - `evaluate.ts`: thứ tự `NOT_SORTED` → `NOT_FOUND` → `NOT_AT_END`;
  - `predictAnswer`: `shelf:…@p`;
  - `reasons.ts`, `sorter.test.ts`;
  - đăng ký vào registry.
- **Luật 27** (`tools/content-check/src/sorter.ts`, A đăng ký vào `rules.ts`): như ADR-0025 §7. Kèm bộ chạy `SORTER_TRAPS` (danh sách chương trình sai + mã thua mong đợi) cho test của thế giới.
- **3 màn mẫu `_sandbox`:** tìm sách (`find`), đếm sách lớn (`end` + `countGoal`), nổi bọt 3 kệ (`sorted`, `variants`).
- **Đo `npm run par`** trên 4 màn phác của §6.5: `l10`, `l13`, `l16`, boss. Ghi số trạng thái, thời gian, heap vào ADR-0025 → "Chấp nhận" (hoặc ghi phương án thay).
- **Tài liệu:** viết lại `game-kinds.md` §3.6 và dòng `sorter` của bảng §1; gửi đoạn §1.3 (event `sorter`) của `game-kind-sdk.md` cho A.

**Nghiệm thu (unit test):**
- Mỗi chương trình trong bảng §6.5 cho đúng kết quả đã mô phỏng:
  - `l03` (`sang phải, lặp đến khi = 5?` trên `[5 2 5 3 1]`) dừng ở `@3`;
  - `l12` (5 lượt hỏi trên `[4 3 1 2]`) ra kệ `[1 2 3 4]` mà vẫn `crash:OUT_OF_QUESTIONS@3`;
  - `l09` ra `[2 4 1 3 5]`;
  - `l11` bản lỗi ra `[3 2 1 4 5]`;
  - `l13` dùng đúng 10 lượt hỏi; nổi bọt `l10` dừng `OUT_OF_QUESTIONS` ở lần hỏi thứ 11;
  - boss: vòng trong `lặp 5` dừng `OFF_SHELF` ở kệ 4 sách.
- Mã lý do: `OFF_SHELF` ở cờ; `NO_BOOK_RIGHT` ở sách cuối và ở cờ; hỏi ở cờ trả ✘; `hết kệ?` không tốn lượt.
- Tất định (2 lần chạy cùng log).
- Schema / luật 27 từ chối: kệ `sorted` đã xếp sẵn; trùng số khi `sorted`; `find` không có trên một bản đồ; `find` cùng `end`; `maxQuestions` nhỏ hơn số lượt của lời giải.
- Package vẫn headless; `npm run par` đúng `par` của 3 màn mẫu.
- **[nặng: đo]**

### P5-03 · Bước sức của mê cung (`stepLimit`)
**Mục tiêu:** cài đúng ADR-0026 mà không đổi gì ở màn W1–W9.

**Sản phẩm:**
- `packages/games/src/maze/`:
  - `config.ts`: `stepLimit?` 1–99;
  - `state.ts`: `steps`, **chỉ khi** có `stepLimit`;
  - `sim.ts`: luật `OUT_OF_STEPS`, event `tired{at}`;
  - `reasons.ts`; khóa đoán `crash:OUT_OF_STEPS@r,c`.
- **Vét cạn:** đo 2 màn phác (`l15` 1 bản đồ, `l17` 3 bản đồ có câu hỏi + phép). Quá ngân sách thì thêm so sánh trội theo số bước trong `validator/src/search/`. Ghi số đo vào ADR-0026 → "Chấp nhận".
- **Luật 28** (`tools/content-check/src/stepLimit.ts`): `stepLimit` ≥ số bước của lời giải trên mọi bản đồ.
- `_sandbox/levels/maze-step-*.json`: 2 màn mẫu (1 bản đồ, nhiều bản đồ).
- **Tài liệu:** `content-model.md`; đoạn `game-kinds.md` §3.2 gửi cho B.

**Nghiệm thu:**
- Unit test:
  - `tiến` thứ `stepLimit + 1` dừng tại chỗ; rẽ và câu hỏi không tốn bước;
  - chạm `G` ở bước cuối vẫn thắng;
  - nhiều bản đồ có `stepLimit` riêng;
  - tất định.
- **Hồi quy W1–W9:** snapshot event log không đổi. Bộ mẫu 5 màn mỗi thế giới (như P4-03) `--timeout 60` cho kết quả **giống từng ký tự** trước thay đổi (trừ thời gian).
- **[nặng]**

### P5-04 · Vét cạn và `content:check` cho W10
**Sản phẩm:**
- Đăng ký luật 27 (B) và 28 vào `rules.ts`; mỗi luật một fixture `extra-27-*`, `extra-28-*`.
- **Luật 24 (M2)** tính hình lời giải của `sorter` (bỏ số) và thân phép như W8.
- **Khung test S1 / S2:** helper `expectTrapsFail(level, traps)` cho `SORTER_TRAPS` và danh sách "cách chậm" của màn mê cung có `stepLimit`. Mỗi cách phải thua đúng mã.
- **R5** (phép có ích) chạy được trên màn `sorter` có phép (`l13`); có ngân sách 120 s.
- **`feedback.json`:** câu cho 7 mã mới theo luật 17 (6 mã `sorter` B gửi + `OUT_OF_STEPS`).
- **Màn mẫu `_sandbox`:** `sorter` + phép có hộp + `maxQuestions`.
- **Tài liệu:**
  - `content-model.md`: trường mới, luật 27, 28;
  - `content-authoring.md`: S1–S4, câu chuẩn §5.1 của **mọi** ý W10, đúng cột "Câu chuẩn" ở `curriculum.md` §6.5 (6 khối mới, 2 luật mới, và các ý thuật toán, xem hết kệ, hỏi trước, thấy là dừng, một lượt, kệ ngược hẳn, lượt ngắn dần, đường ngắn nhất, dừng sớm).
- **[nặng: R5]**

**Nghiệm thu:** fixture đỏ đúng chỗ; `content/` xanh; lint / typecheck / test xanh; R5 đúng trên màn mẫu.

### P5-05 · `SorterStage`
**Mục tiêu:** bé thấy kệ, thấy tay Bíp hỏi và đổi chỗ từng bước, thấy ngay lúc hết lượt hỏi.

**Sản phẩm:**
- **Sân chơi:** `apps/web/src/stages/sorter/` gồm `SorterStage.ts` và `layout.ts` (thuần). Đăng ký vào `stageKinds`.
- **Hình vẽ trên sân:**
  - kệ gỗ (màu từ theme `hoc-vien` của P5-08; chưa có thì màu tạm);
  - sách cao theo số, có số trên gáy;
  - tay Bíp trên ray, cờ cuối kệ.
- **Diễn event:**
  - `move` trượt tay;
  - `sense` sáng ✔ / ✘ trên hai sách được so (hoặc một sách);
  - `swap` nhấc rồi đổi;
  - `outOfQuestions` rung tay, HUD đỏ.
- **HUD** "Còn 10 lượt hỏi", "Đổi chỗ: 3" (chữ từ P5-01).
- **`AnswerPicture` kệ sách:** vẽ lại kệ và tay từ khóa `shelf:…@p`.
- Bộ nạp nội dung đọc khóa thẻ đáp án của `sorter`.
- Tốc độ / tạm dừng / Từng bước đi qua `StageController` chung.

**Nghiệm thu:**
- `layout.ts` có unit test.
- e2e (1280×720, 1366×768) trên 3 màn mẫu:
  - thắng màn tìm sách;
  - nổi bọt 3 kệ: thẻ "Bản đồ 1 · 2 · 3", thua ở kệ 3 khi thiếu lượt;
  - `predict` đủ hình đáp án.
- Ảnh chụp trong PR.
- **[e2e nặng]**

### P5-06 · Web cho W10
**Sản phẩm:**
- **Thanh khối:** `toolbox.ts` / `theme.ts` có nhóm KỆ SÁCH (category `sorter`), style riêng, đủ tương phản. `knownBlockSpecs` có 6 khối.
- **Mê cung:** HUD "Còn 9 bước" khi màn có `stepLimit`. `tired` có hoạt ảnh Măng ngồi thở và bong bóng lý do.
- **Phát lại** (`replay.ts`): "Từng bước" dừng ở `swap`, `sense`, `tired`, `outOfQuestions`.
- **Còn lại:**
  - thẻ kết quả cho 7 mã mới;
  - `LessonDemo` chạy thẻ demo kệ sách và mê cung có `stepLimit`;
  - level editor gặp màn `sorter` → "Chưa hỗ trợ kệ sách" (có test);
  - câu mới vào bộ giọng đọc (`npm run voice -- check` xanh).
- (Nếu HLV giữ mặc định J14, **tùy chọn**, không chặn P5-09) nút **"Xáo kệ"** ở `w10-creative`, theo cách "Đề mới" có hạt giống của `w06-exam`. Không dùng lại thẳng được: trường `exam` hiện chỉ cho robotlab creative (`level.ts`, luật 22). Cần A mở schema trong `level.ts` (A là chủ) và B viết hàm sinh kệ thuần trong `sorter/`; C làm nút.

**Nghiệm thu:**
- Unit test toolbox / bộ đọc event / HUD.
- e2e 1280×720 và 1366×768:
  - màn `_sandbox` mê cung có `stepLimit`: hết bước thì dừng đúng ô;
  - demo bài giảng kệ sách.
- Ảnh chụp trong PR.
- **[e2e nặng]**

### P5-07 · Chi tiết hóa lần hai Thế giới 10
**Mục tiêu:** bảng §6.5 thành "Chi tiết từng màn" như §6.3.1 / §6.4: kệ, bản đồ, sa bàn thật; chương trình và kết quả chạy trên engine thật.

**Sản phẩm:**
- **Kệ sách** (B gửi, C ghi):
  - kệ thật cho từng màn, đúng S1–S4;
  - `SORTER_TRAPS` cho mọi màn `build` / `bughunt`;
  - "cách chậm" (S2) cho mọi màn có ngân sách: `l13`, `l15`, `l16`, `l17`, `l18`;
  - boss: sách số 4 ở chỗ khác nhau trên 3 kệ đã xếp (S1);
  - `par` tay.
- **Mê cung `l14`, `l15`, `l17`, `l18`:**
  - bản đồ theo M1–M3, `stepLimit` khít, "cách chậm" (S2);
  - không dùng lại hình đường của W4 `l19` / W5 boss.
- **Sa bàn robot `l19`:** 3 sa bàn đề đổi màu, đồng hồ khít. Không trùng bẫy thứ tự việc của W6 boss / W8 boss.
- Câu `mission`, gợi ý (câu hỏi), thẻ bài; mỗi câu ≤ 12 chữ.
- Sau P5-02 / P5-03: chạy lời giải trên engine thật; ghi lệch kế hoạch vào "Ghi chú khi soạn".

**Nghiệm thu:**
- §6.5 có "Chi tiết từng màn".
- Review sư phạm độc lập đạt:
  - mỗi màn một ý;
  - chữ ≤ 12, số bằng chữ số, giao diện "khối", tooltip "lệnh";
  - "Khối mới! …" đúng tooltip;
  - gợi ý là câu hỏi;
  - không hình lời giải nào dùng quá 2 lần;
  - mỗi màn kệ sách nói rõ số trên sách cần tìm / cần xếp.

### P5-08 · Cảnh riêng W10 (agent D)
**Sản phẩm:**
- `SCENE_THEMES` thêm `hoc-vien` (làm theo P2-23 / P4-14, vẽ bằng mã, "Pixel ấm áp"):
  - thư viện trên đồi mây, kệ sách gỗ, đèn lồng;
  - ô mê cung là vườn hàng rào cây xén (khác kệ sách của `xuong-phep-thuat`).
- `STORY_PROPS` thêm `bookshelf`, `diploma`, có hình tạm 12×12 ở `storyArt.ts`.
- Màu nền kệ cho `SorterStage` (gửi B tên token).

**Nghiệm thu:**
- `sceneThemes.test.ts` xanh.
- e2e cảnh có ảnh chụp 1280×720.
- Không đổi cảnh W1–W9.

### P5-09 · Nội dung Thế giới 10 · Học Viện Thuật Toán
Như P4-11 / P4-13, theo §6.5 đã chi tiết hóa. C là người duy nhất ghi `content/worlds/w10-hoc-vien/`. A chạy `par` / R5 và gửi số; B gửi kệ và `SORTER_TRAPS`.

**Sản phẩm:**
- `world.json`:
  - 5 chương; chương cuối "Ngày tốt nghiệp" đóng cả khóa học;
  - cảnh `hoc-vien` (cần P5-08);
  - unplugged "Xếp hàng theo số".
- `w10-lesson` + 14 bài ngắn; gợi ý `enter` mang câu chuẩn của `l03`, `l09`.
- 20 màn + `w10-creative`.

**Nghiệm thu:**
- `content:check` xanh. Mọi cảnh báo luật 4 / 7 / 24 / 25 / 27 / 28 có lý do trong "Ghi chú khi soạn" (thế giới tạm: xem `PROVISIONAL_WORLDS`).
- `npm run par -- --world w10`: mọi màn build / bughunt ✔, hoặc ⚠ có cờ `parUnproven` (boss, `l17`, `l19`) / "⚠ R5" có ghi chú.
- `tools/content-check/src/w10.test.ts` có:
  - demo bài giảng; đáp án màn đoán; từng cách sửa;
  - **S1:** mọi `SORTER_TRAPS` thua đúng mã;
  - **S2:** mọi "cách chậm" dừng `OUT_OF_QUESTIONS` / `OUT_OF_STEPS`;
  - **R5** cho `l13`, `l17`;
  - độ sâu hiệu dụng ≤ 2;
  - chữ "khối" / "lệnh"; gợi ý `enter` = "Khối mới! " + tooltip; chữ số cho số đếm;
  - boss: bỏ `hết kệ?` thì không thắng kệ 4 sách; bỏ `sách này = …?` khỏi thanh khối thì không gì thắng (S1);
  - `l12`: đáp án là `crash:OUT_OF_QUESTIONS@3` dù kệ đã xếp xong.
- e2e smoke `w10-l01`, `l13` và boss.
- **HLV chơi thử trước khi merge** (AI không tự đánh dấu).
- **[par nặng]**

### P5-10 · HLV chơi thử W10
HLV mở khóa W10 bằng tay ở Góc huấn luyện viên (như P3-06, mặc định J16), chơi hết bài và màn, ghi góp ý. AI sửa trong ngày.

**Nghiệm thu:**
- HLV ghi "đạt" từng màn.
- Cảnh báo luật 4 / 7 của `w10` bằng 0 hoặc có lý do; bỏ `w10-hoc-vien` khỏi `PROVISIONAL_WORLDS`.
- Đây là việc của HLV; AI không tự đánh dấu.

### P5-11 · Phát hành `v0.5.0`
**Nghiệm thu:**
- P5-10 đạt.
- lint / typecheck / test / content:check / e2e xanh.
- Bộ mẫu hồi quy `par` W1–W9 (P5-03) giống trước.
- Ghi chú phát hành (W10, kệ sách, bước sức) trong tin nhắn tag.
- Tag `v0.5.0` (HLV push).

### P5-12 · Hoàn thiện trước `1.0`
**Mục tiêu:** cả 10 thế giới là bản HLV đã duyệt, không còn nháp.

**Sản phẩm:**
- Sửa mọi lỗi chặn còn lại từ các buổi chơi thử W1–W10.
- `PROVISIONAL_WORLDS` rỗng. Bỏ dấu "🟨 nháp" khỏi `curriculum.md` ở thế giới nào HLV đã duyệt.
- Hồi quy đủ `npm run par -- --world w01…w10` (mỗi thế giới ≤ 15 phút, một việc nặng mỗi lần); số nào đổi thì giải thích.
- e2e đủ ở 1280×720 và 1366×768.
- Tài liệu khớp code: `docs/README.md`, `game-kinds.md`, `content-model.md`, bảng ADR (ADR nào còn "Đề xuất" thì chốt hoặc ghi lý do).
- `coach-questions.md`: mọi câu đã chốt được chuyển vào tài liệu nguồn chuẩn rồi xóa.

**Nghiệm thu:** danh sách trên đủ; báo cáo hồi quy có số thật.

### P5-13 · Phát hành `v1.0.0`
**Nghiệm thu:**
- P5-12 đạt; HLV ghi "đạt" cho cả 10 thế giới.
- lint / typecheck / test / content:check / e2e xanh.
- Ghi chú phát hành: 10 thế giới, 5 kiểu game (runner, maze, robotlab, turtle, sorter) × 5 cách chơi, Góc huấn luyện viên.
- Tag `v1.0.0` (HLV push).

### P5-14 · Xem code JS (ưu tiên thấp)
Phần cũ của khung GĐ 5. Làm sau `v1.0.0`, trừ khi HLV đổi mặc định J13.

**Sản phẩm:**
- ADR-0027: generator đọc được (tên hàm tiếng Anh hay tiếng Việt, chỉ JS hay cả Python), chỗ đặt khung code, tô sáng dòng đang chạy.
- Khung "Xem code" chỉ đọc, bên cạnh vùng ghép khối, bật theo màn hoặc theo hồ sơ HLV.

**Nghiệm thu:** theo ADR-0027.
