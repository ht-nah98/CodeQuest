# GĐ 0 · Nền móng (02–08/10/2026)

**Mục tiêu giai đoạn:** repo chạy được, có design system, Blockly + engine lõi chạy thật, và **1 màn Đường chạy chơi được từ đầu đến cuối**.
**Nghiệm thu giai đoạn:** bé chơi màn prototype mà không cần hướng dẫn; CI xanh.

| ID | Task | Phụ thuộc | Người làm | Trạng thái |
|---|---|---|---|---|
| P0-01 | Khởi tạo monorepo & tooling | — | AI | 🟨 |
| P0-02 | Khung 4 package headless | P0-01 | AI | ✅ |
| P0-03 | Engine lõi `runLevel` | P0-02 | AI | ✅ |
| P0-04 | Design system & font | P0-01 | AI | ✅ |
| P0-05 | Wrapper Blockly + theme | P0-02, P0-04 | AI | ✅ |
| P0-06 | Pipeline asset & spritesheet Măng | P0-01 | AI | ✅ |
| P0-07 | Prototype 1 màn runner end-to-end | P0-03, P0-05, P0-06 | AI | 🟨 |
| P0-08 | Tạo thêm sprite (đi lên/xuống, choáng, ôm đầu, suy nghĩ) | — | **HLV** | ⬜ |
| P0-09 | Chơi thử prototype với bé | P0-07 | **HLV** | ⬜ |

---

### P0-01 · Khởi tạo monorepo & tooling
- **Mục tiêu:** khung repo theo `architecture/overview.md`, `deployment-ops.md`, `tech-stack.md`.
- **Sản phẩm:** `package.json` root (workspaces `apps/*`, `packages/*`, `tools/*`; script ở `deployment-ops.md`); `tsconfig.base.json` (strict theo `coding-standards.md` §1) + project references; `eslint.config.js` (typescript-eslint, react-hooks, luật ranh giới package `no-restricted-imports` + `no-restricted-globals` cho package headless); `.prettierrc`; `vitest.config.ts` dạng projects (node cho packages, jsdom cho web); `apps/web` Vite + React tối thiểu; `.github/workflows/ci.yml`; `git init` + push lên GitHub private.
- **Sản phẩm thêm:** `content:check` bản tối thiểu (luật 1–2, `content-model.md` §7); Playwright đã cấu hình (chưa có test); alias `@content` + `server.fs.allow` trong `vite.config.ts`; copy `blockly/media` vào `public/blockly-media/`.
- **Nghiệm thu:** `npm ci && npm run lint && npm run typecheck && npm run test && npm run content:check && npm run build` xanh; CI xanh. Một file thử dùng `window` trong `packages/engine` làm lint đỏ, một import `@codequest/games` từ `engine` làm lint đỏ (rồi xóa). `tsc --showConfig` đã được kiểm, không dựa vào mặc định của TS 6.

### P0-02 · Khung 4 package headless
- **Sản phẩm:** `content-schema` (zod cho World, Level, Lesson, LessonCard, HintRule, ShopItem, Badge, WorkspaceJson; `src/runtime.ts` với `RunResult`, `ReasonCode`, `RunSummary`, `GameKindId`, `LevelMode`); `engine/src/sdk` (GameKindDefinition, BlockSpec, SimContext, GameEvent, HighlightEvent, DistributiveOmit, RunOutcome); `engine/src/blocks/common.ts` (`cq_start`, `cq_repeat`) + `registerBlockSpecs()`; `engine/src/types/js-interpreter.d.ts`; `games` (registry rỗng + `registerAllBlocks()`); `rewards/src/config.ts` (con số khớp `rewards-economy.md`).
- **Nghiệm thu:** test schema (1 hợp lệ + 3 không hợp lệ mỗi schema); `registerBlockSpecs()` gọi 2 lần không lỗi; `rewards` chỉ import `content-schema` mà vẫn có đủ type cần; typecheck xanh.

### P0-03 · Engine lõi `runLevel`
- **Sản phẩm:** `analyzeWorkspace`, `compileProgram`, `runLevel`, `StopSignal`, rng mulberry32 + FNV-1a, ghi đè `Math.random` trong sandbox, `editDistance`. Một kiểu game giả `line` (chỉ trong test) để thử engine.
- **Nghiệm thu:** toàn bộ mục `runLevel`, `compileProgram`, `editDistance` ở `testing-strategy.md` §2 có test và xanh; coverage engine ≥ 90%.

### P0-04 · Design system & font
- **Sản phẩm:** `ui/tokens.css` (token ở `art-direction.md` §2) nối Tailwind `@theme`; font Baloo 2, Nunito, VT323 **tự host** (bộ `vietnamese` + `latin`); component `Button` (go/hint/coin/plain/disabled), `Panel`, `Bubble` (có nút 🔊), `Hud` (xu, sao, chuỗi ngày), `CapacityBricks`, `PixelIcon` (xu, sao); route `/dev/ui` hiển thị tất cả.
- **Nghiệm thu:** `/dev/ui` khớp style board (https://claude.ai/artifact/HKbvQDqtYxkvkAwz54fBeb); chữ "Măng nhảy qua hố, rẽ phải!" hiển thị đủ dấu ở cả 3 font; hover/active/focus-visible có trên mọi nút.

### P0-05 · Wrapper Blockly + theme
- **Sản phẩm:** `blockly/BlocklyWorkspace.tsx` (remount theo `key={level.id}`), `blockly/theme.ts` (blockStyles theo `blockly-integration.md` §3, font 14pt, màu import từ một file dùng chung với tokens), `blockly/messages.ts`, `blockly/toolbox.ts` (`buildToolbox`, luôn có flyout), `disableOrphans` + `@blockly/disable-top-blocks`, `media: '/blockly-media/'`, xử lý phím tắt theo §13; route `/dev/blockly`.
- **Nghiệm thu:** workspace zelos có theme CodeQuest; `cq_start` không xóa được; khối rời bị làm xám; với `maxBlocks: 3` thì thả được đúng 3 khối và thanh hiện "còn 0 khối"; `cq_repeat` chiếm 1 chỗ; chuyển từ một màn parsons sang màn build không lỗi; DevTools Network không có request tới `static.blockly.com`; nhấn `Space` khi focus ngoài Blockly thì chạy, khi đang kéo khối bằng bàn phím thì không.

### P0-06 · Pipeline asset & spritesheet Măng
- **Sản phẩm:** `tools/sprites/clean.py` đã có (01/10, đã chạy lại ra đúng 16 khung); viết `tools/sprites/pack.py` → `apps/web/public/sprites/panda.{png,json}` với hoạt ảnh `idle, talk, happy, walk, run, crouch, jump, kick, cheer`; tile tạm Kenney + `assets/CREDITS.md`.
- **Nghiệm thu:** chạy lại pipeline từ `assets/raw/panda-sheet.png` ra đúng 16 khung; một trang `/dev/stage` hiển thị Măng đi/chạy/nhảy bằng `PIXI.AnimatedSprite`.

### P0-07 · Prototype 1 màn runner end-to-end
- **Sản phẩm:** kiểu game `runner` tối thiểu (`runner_walk`, `runner_jump`; ô ground/hole/flag; reason `FELL_IN_HOLE`, `OFF_TRACK`, `NOT_AT_GOAL`, đúng bảng luật `game-kinds.md` §3.1); `RunnerStage` tối thiểu; `StageController` (play + highlight + reset); `content/shared/feedback.json` (đủ mã của engine + runner); `world.json` tạm của `w01-lang-tre` + màn `w01-l03` thật; `content:check` thêm luật 9–11; route `/play/:levelId` với bố cục `screens-and-flows.md` §3 (chưa cần gợi ý, phần thưởng).
- **Nghiệm thu:** ghép đúng → Măng đi, nhảy, ăn mừng, khối sáng theo từng bước; ghép sai → Măng rơi hố, khối gây lỗi rung, bong bóng hiện câu `FELL_IN_HOLE`; vòng lặp vô hạn không treo trang; test Playwright đầu tiên (`@smoke`) cho luồng này.

### P0-08 · Tạo thêm sprite (HLV)
- **Sản phẩm:** sheet 4×4 cho `walk_front ×4`, `walk_back ×4`; sheet cho `bump`, `oops`, `think`, `point` (theo prompt ở `art-direction.md` §5). Lưu vào `assets/raw/`.
- **Nghiệm thu:** AI chạy pipeline P0-06 ra khung sạch, đồng bộ tỷ lệ với bộ gốc.

### P0-09 · Chơi thử prototype (HLV)
- Theo `playbooks/playtest.md`. Kết quả ghi thành issue và quyết định có chỉnh bố cục trước GĐ 1 không.
