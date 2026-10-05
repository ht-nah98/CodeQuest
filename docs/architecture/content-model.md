# Mô hình nội dung

Nguồn chuẩn cho: cấu trúc file trong `content/`, schema của World / Level / Lesson / Hint / Shop / Badge, quy ước ID, các luật mà `content:check` kiểm tra. Schema code: `packages/content-schema/src/`.

## 1. Bố cục thư mục
```
content/
├─ shared/
│  ├─ feedback.json        câu mặc định cho mọi reasonCode (xem ui-copy-guide §3)
│  ├─ shop.json            vật phẩm cửa hàng
│  └─ badges.json          huy hiệu
└─ worlds/
   └─ w01-lang-tre/
      ├─ world.json        thông tin thế giới + thứ tự các màn
      ├─ lessons/
      │  └─ w01-lesson.json
      └─ levels/
         ├─ w01-l01.json
         ├─ …
         ├─ w01-boss.json
         └─ w01-creative.json
```
- Một file = một đối tượng. Tên file = `id` + `.json`.
- Toàn bộ chữ trong `content/` là tiếng Việt, theo `docs/design/ui-copy-guide.md`.
- App nạp nội dung qua alias Vite **`@content` → `<repo>/content`** (khai báo trong `apps/web/vite.config.ts`, kèm `server.fs.allow: [repoRoot]`, vì `content/` nằm ngoài thư mục gốc của app `apps/web`):
  ```ts
  const files = import.meta.glob(['@content/**/*.json', '!@content/worlds/_*/**'], { import: 'default' });
  ```
  Không dùng `'/content/**'`: trong Vite, `/` là gốc của app (`apps/web`), glob sẽ trả về **rỗng mà không báo lỗi**. Màn trong thư mục `_*` chỉ được nạp khi `import.meta.env.DEV` (glob riêng).
- Nội dung được đóng gói cùng bản build (không tải từ server).
- Thư mục `worlds/_<tên>/` (vd `_sandbox`) là **khu nháp**: không hiện cho bé ở bản production; vẫn được `content:check` kiểm luật 1, luật chạy được (9–17) và 18, nhưng **miễn** mẫu ID của luật 2 và các luật chương trình học 3–8 (khu nháp không cần `world.json`, không nằm trong thứ tự `world.order`, chưa phải chữ cho bé).

## 2. Quy ước ID
| Loại | Mẫu | Ví dụ |
|---|---|---|
| World | `w<2 số>-<slug>` | `w01-lang-tre` |
| Level | `w<2 số>-l<2 số>` · `w<2 số>-boss` · `w<2 số>-creative` · `w<2 số>-bonus<2 số>` | `w02-l05`, `w02-boss` |
| Lesson | `w<2 số>-lesson[-<slug>]` | `w01-lesson` |
| Block type | `<kind>_<verb>` hoặc `cq_<tên>` cho khối chung | `runner_jump`, `cq_repeat`, `cq_start` |
| Badge | kebab-case | `loop-master` |
| Shop item | `<loại>-<slug>` | `skin-astro-panda`, `fx-confetti` |
| Câu thoại có giọng đọc | `<id>.<khóa>` (chỉ chữ, số, `.` `_` `-`; là tên file) | `w01-l03.objective` · `w03-l11.mission` · `w01-l03.thinking` · `w01-l03.hint.<hintId>` · `w01-l03.feedback.<REASON>` (câu feedback riêng của màn) · `w01-lesson.c<n>` (thẻ thứ n, **đếm từ 1**) · `w01-lesson.c<n>.explain` (giải thích của thẻ quiz) · `feedback.FELL_IN_HOLE` · `ui.<khóa trong vi.ts>`. Danh sách đầy đủ: `npm run voice -- lines` (`docs/architecture/audio.md` §5) |

ID **không bao giờ đổi** sau khi đã có bé chơi, vì tiến độ gắn với ID. Muốn bỏ màn: đặt `"retired": true`.

## 3. Schema (TypeScript rút gọn; nguồn thật là zod trong `content-schema`)

```ts
type GameKindId = 'runner' | 'maze' | 'robotlab' | 'turtle' | 'farm' | 'sorter' | 'music';
type LevelMode = 'build' | 'parsons' | 'predict' | 'bughunt' | 'creative';
type LevelStage = 'guided' | 'practice' | 'challenge' | 'boss' | 'creative' | 'bonus';   // bài giảng KHÔNG phải một stage
type WorkspaceJson = { blocks: { languageVersion: 0; blocks: unknown[] }; variables?: unknown[] };
type ToolboxEntry = string | { type: string; fields?: Record<string, unknown> };

interface World {
  id: string; order: number;                // 1..10
  title: string;                            // "Làng Tre"
  emoji: string;                            // "🎋"
  concept: string;                          // "Tuần tự"
  story: string;                            // 1–2 câu
  theme: { tileset: string; music?: string; palette?: 'day' | 'dusk' | 'night' };
  lessonIds: string[];
  levelIds: string[];                       // đúng thứ tự hiển thị
  unlock: { minStarRatio: number };         // bắt buộc ghi rõ; giá trị chuẩn 0.6 (rewards-economy.md §3)
  unplugged?: { title: string; steps: string[] };   // hoạt động ngoài màn hình cho huấn luyện viên
}

interface Level {
  id: string; worldId: string;
  stage: LevelStage; kind: GameKindId; mode: LevelMode;
  title: string;                            // ≤ 5 chữ
  objective: string;                        // ≤ 12 chữ, Măng đọc khi vào màn
  learningGoal: string;                     // cho huấn luyện viên đọc
  misconception?: string;                   // bắt buộc với guided/practice
  mission?: string;                         // dòng nhiệm vụ ≤ 12 chữ (luật 5), giọng đọc `<id>.mission` (P2-11c, curriculum.md §5.0)
  goalSprite?: GoalSprite;                  // hình đích, chỉ runner/maze, chỉ để vẽ: 'flag' | 'machine' | 'exit' | 'home' | 'footprints' | 'friend' | 'cage' | 'dock'
  toolbox: ToolboxEntry[];                  // rỗng với parsons/predict
  maxBlocks?: number;
  maxInstances?: Record<string, number>;     // số khối tối đa mỗi type (Blockly chặn khi thả; luật 20)
  maxLoopDepth?: number;                     // số tầng vòng lặp lồng nhau tối đa (cq_repeat, cq_repeat_until), ≥ 1; 1 = không lặp lồng (P2-11, T16b; luật 20)
  par?: number;                             // bắt buộc với build/parsons
  parEdits?: number;                        // bughunt, mặc định 1
  config: unknown;                          // kiểm bằng configSchema của kind; điều kiện thắng phụ (vd goal.collectAll, goal.items) nằm TRONG config
  variants?: unknown[];                     // 1–2 bản đồ thêm, cùng kind (P2-12, ADR-0016); chỉ build/bughunt; chương trình phải thắng MỌI bản đồ
  starGoals?: StarGoal[];                   // mục tiêu ⭐ (P2-21, ADR-0017); chỉ build/bughunt; StarGoal = { kind: 'collectAll' }
  initialWorkspace?: WorkspaceJson;         // bắt buộc với parsons (khối xáo trộn), predict, bughunt
  solution?: WorkspaceJson;                 // bắt buộc trừ predict/creative
  predict?: { options: Array<{ key: string; label: string }>; };  // key theo predictAnswer; label ≤ 4 chữ; hình vẽ từ key + config (AnswerPicture, stage-rendering.md §4); đáp án đúng do engine tính
  hints: HintRule[];                        // gợi ý tầng 0 (xem hint-engine.md)
  thinkingHint?: string;                    // gợi ý tầng 1, bắt buộc trừ creative
  feedback?: Partial<Record<string, string>>;   // ghi đè câu theo reasonCode
  limits?: { maxSteps?: number; maxActions?: number };
  retired?: boolean;
}

interface Lesson {
  id: string; worldId: string; title: string;
  beforeLevel?: string;                     // bài "Khối mới": hiện ngay trước màn này trên đường bậc đá (xem dưới)
  cards: LessonCard[];
}
type LessonCard =
  | { type: 'say'; pose: MascotPose; text: string; image?: string }
  | { type: 'demo'; text: string; kind: GameKindId; config: unknown; workspace: WorkspaceJson; autoplay?: boolean }
  | { type: 'quiz'; text: string; options: string[]; correct: number; explain: string };
type MascotPose = 'idle' | 'talk' | 'happy' | 'cheer' | 'think' | 'point' | 'oops';

interface ShopItem { id: string; kind: 'skin' | 'pen' | 'fx' | 'music' | 'bonus-level'; title: string; price: number; asset: string; unlockAfterWorld?: number }
interface Badge { id: string; title: string; description: string; icon: string; rule: BadgeRule }  // BadgeRule: xem rewards-engine.md

// File trong shared/
type FeedbackFile = Record<ReasonCode, string>;   // feedback.json: khóa SCREAMING_SNAKE_CASE → câu không rỗng
type ShopFile = ShopItem[];                       // shop.json: thứ tự hiển thị
type BadgesFile = Badge[];                        // badges.json: thứ tự hiển thị
```

Ghi chú cài đặt schema (P0-02):
- World, Level, Lesson, LessonCard, HintRule, ShopItem, Badge là **strict object**: khóa lạ (gõ sai tên trường) bị báo lỗi luật 1. `WorkspaceJson` thì lỏng (giữ nguyên khóa khác của Blockly), chỉ kiểm `languageVersion: 0` và mỗi khối gốc có `type`.
- Schema Level tự kiểm các trường bắt buộc mà engine cần: `par` (build/parsons), `initialWorkspace` (parsons/predict/bughunt), `solution` (trừ predict/creative), `predict` (chỉ và bắt buộc với predict, 3–4 phương án), `parEdits` chỉ cho bughunt, `id` của hint không trùng trong màn. Các luật sư phạm (`misconception`, `thinkingHint`, số chữ) vẫn thuộc luật 5–6.
- `variants` (P2-12, ADR-0016): 1–2 phần tử, mỗi phần tử là một config đầy đủ của cùng kind ("Bản đồ 2", "Bản đồ 3"; `config` là "Bản đồ 1"). Chỉ mode `build` và `bughunt`; ở `parsons`, `predict`, `creative` schema báo lỗi luật 1. Vật phẩm, `goal` … khai báo riêng trong config của từng bản đồ.
- **Bài "Khối mới"** (`lesson.beforeLevel`, góp ý HLV 03/10/2026): một bài giảng ngắn cho **một khối hành động mới**, hiện trên trang thế giới như một quyển sách nhỏ gắn ở viên đá của màn đầu tiên dùng khối đó (`design/screens-and-flows.md`) (thường là màn có gợi ý `enter` "Khối mới: …"). ID `w<NN>-lesson-<slug>` (vd `w01-lesson-nhay`), liệt kê trong `world.lessonIds` **sau** bài mở đầu. Thẻ `demo` của bài cho thấy Măng **đứng ở đâu** sau khối (đi 1 ô, cúi đi 1 ô, nhảy bay qua 1 ô đáp xuống ô thứ 2, đá đứng yên, rẽ quay tại chỗ); `tools/content-check/src/blockLessons.test.ts` chạy từng demo và kiểm ô Măng dừng. Bài mở đầu (`lessonIds[0]`, không có `beforeLevel`) vẫn là bài duy nhất khóa màn 1; bài "Khối mới" **không khóa** màn của nó (Măng nhắc "Có khối mới!" và quyển sách nhấp nháy, `coach-questions.md` F10). Vì sao không làm thẻ mới trong màn chơi: giữ nội dung là dữ liệu, không thêm UI vào màn chơi, dùng lại thẻ `demo` sẵn có; lời giới thiệu ngay trong màn vẫn là gợi ý tầng 0 `enter` "Khối mới: …" (luật 7).
- **Mục tiêu sao** `starGoals` (P2-21, ADR-0017, luật sao ở `rewards-economy.md` §1): 1 phần tử trở lên, mỗi loại tối đa một lần, chỉ mode `build` và `bughunt` (khác → lỗi luật 1). Loại hiện có: `{ "kind": "collectAll" }` = nhặt hết măng (`config.bamboo` ở runner, ô `b` ở maze) của **mỗi** bản đồ; bản đồ không có măng tự đạt. Khác `config.goal.collectAll` (điều kiện thắng): mục tiêu sao **không** chặn cờ, Măng vẫn thắng khi bỏ sót măng, chỉ mất ⭐⭐. Muốn mục tiêu ở một bản đồ thì chỉ đặt măng ở bản đồ đó. Engine chấm trên trạng thái cuối (`RunOutcome.goals`, `runtime-engine.md` §7).
- `mission` (dòng nhiệm vụ, ≤ 12 chữ, luật 5) và `goalSprite` (chỉ `runner`/`maze`, khác → lỗi luật 1) là P2-11c: chỉ để kể chuyện và vẽ, **không** đổi luật chơi hay cách chấm.
- **Vật phẩm nhiệm vụ** `config.goal.items` (P2-11c, ADR-0019, `curriculum.md` §5.4 T17b), runner và maze: `{ kind: 'key' | 'friend', at }[]` (`at` là số ô ở runner, `[r, c]` ở maze), khai báo riêng trong config của từng bản đồ. Đây **là** điều kiện thắng (khác `starGoals`): Măng phải **đứng ở** ô của mọi vật phẩm (thứ tự tùy ý; nhảy qua không tính) trước khi đích được tính. Runner: tới cờ mà thiếu → `incomplete` / `NEED_KEY` (`key`) hoặc `NEED_FRIEND` (`friend`). Maze: đi xuyên `G` như `collectAll`; hết chương trình ở `G` mà thiếu → `NEED_KEY` / `NEED_FRIEND`, ở chỗ khác → `NOT_AT_GOAL`. Luật 1 (configSchema) kiểm chỗ đặt: runner trên ô `ground`/`branch` sau `start`, không trùng nhau hay trùng măng; maze trên ô `.` (không tường, `S`, `G`, `b`), không trùng nhau. Màn `rescue` / `escort` chỉ là tên gọi trong chương trình học (vật phẩm `key` / `friend` + `goalSprite`), không có trường riêng.
- `world.unlock.minStarRatio` bắt buộc ghi rõ (giá trị chuẩn 0.6, `rewards-economy.md` §3).
- Quiz: 2–4 phương án, `correct` phải là chỉ số hợp lệ.
- **Block id trong nội dung** (`solution`, `initialWorkspace`, `workspace` của thẻ demo) dùng `ContentWorkspaceJsonSchema`: **mọi** khối, kể cả khối lồng trong `next`/`inputs` và shadow, phải có `id` khớp `^[A-Za-z0-9_\-.:]+$` và không trùng trong cùng workspace. Lý do: thiếu id thì Blockly sinh id ngẫu nhiên (event log không tất định, highlight của bài predict lệch giữa engine và UI); ký tự lạ (`'`, `\`, xuống dòng, U+2028) dễ làm hỏng code sinh ra. Kiểm ở schema (luật 1) chứ không chỉ ở luật 2, vì đây là điều kiện để nội dung chạy đúng. `WorkspaceJsonSchema` dùng cho dữ liệu lúc chạy (bài làm dở, IndexedDB) vẫn lỏng: `Blockly.serialization.workspaces.save` sinh id có ký tự ngoài bảng trên. Kiểu TS của các trường này vẫn là `WorkspaceJson`.
- `limits.maxSteps` ≤ 1 000 000, `limits.maxActions` ≤ 10 000 (gấp 10 lần mặc định của engine). Khóa của `level.feedback` theo SCREAMING_SNAKE_CASE. Các `key` của `predict.options` không trùng nhau.

## 4. Ví dụ một màn
```json
{
  "id": "w02-l05",
  "worldId": "w02-rung-lap-lai",
  "stage": "practice",
  "kind": "runner",
  "mode": "build",
  "title": "Đi và nhảy",
  "objective": "Đến lá cờ, dùng không quá 3 khối",
  "learningGoal": "Đặt nhiều khối bên trong một vòng lặp",
  "misconception": "Vòng lặp chỉ chứa được một khối",
  "toolbox": ["runner_walk", "runner_jump", { "type": "cq_repeat", "fields": { "TIMES": 2 } }],
  "maxBlocks": 3,
  "par": 3,
  "config": { "cells": ["ground","ground","hole","ground","ground","hole","ground","ground","hole","flag"], "start": 0 },
  "solution": { "blocks": { "languageVersion": 0, "blocks": [
    { "type": "cq_start", "id": "start", "deletable": false,
      "next": { "block": { "type": "cq_repeat", "id": "rep", "fields": { "TIMES": 3 },
        "inputs": { "DO": { "block": { "type": "runner_walk", "id": "walk",
          "next": { "block": { "type": "runner_jump", "id": "jump" } } } } } } } }
  ] } },
  "hints": [
    { "id": "cap", "when": { "capacityFull": true, "missing": "cq_repeat" }, "say": "Hết chỗ rồi! Thử khối lặp xem", "point": "toolbox:cq_repeat" },
    { "id": "one-inside", "when": { "lastReason": "FELL_IN_HOLE", "has": "cq_repeat" }, "say": "Trong vòng lặp có cả khối nhảy chưa?" }
  ],
  "thinkingHint": "Con thấy mẫu nào lặp đi lặp lại?"
}
```
Kiểm tay: ô 0 → đi 1 → nhảy 3 → đi 4 → nhảy 6 → đi 7 → nhảy 9 (cờ) ✔. Trong thực tế không cần kiểm tay vì `content:check` chạy lời giải cho mọi màn.

## 5. Luật của `content:check` (`tools/content-check`)
Chạy `npm run content:check`. Báo lỗi (exit 1) nếu vi phạm bất kỳ luật nào:

> Luật **cấp màn** (1, 2 mẫu ID, 5–6, 9–16, 19–20) cài trong `@codequest/validator` (`validateLevel`), dùng chung với level editor trong trình duyệt. `tools/content-check` đọc file, kiểm luật liên file (2 tên file/trùng ID, 3–4, 7–8, 17–18) và in bảng (ADR-0015).

**Cấu trúc**
1. Mọi file đúng schema zod. `level.config` đúng `configSchema` của `kind`.
2. ID duy nhất, đúng mẫu ở §2, khớp tên file.
3. `world.levelIds` / `lessonIds` trỏ tới file có thật; mọi level nằm trong đúng một world.
4. Mỗi world có ≥ 1 lesson, đúng 1 `boss`, tối đa 1 `creative`.

**Sư phạm**
5. `objective` ≤ 12 chữ; `title` ≤ 5 chữ; `mission` ≤ 12 chữ; mọi câu `say` trong hint ≤ 12 chữ.
6. `guided`/`practice` phải có `misconception`. Mọi màn trừ `creative` có `thinkingHint`. Màn `guided` có ≥ 2 luật gợi ý tầng 0 (`conventions/content-authoring.md` §3; vế "`practice` ≥ 1" chưa kiểm).
7. Khối xuất hiện lần đầu **trong toàn bộ chương trình học** (theo thứ tự `world.order`, rồi `levelIds`) phải ở màn `guided` hoặc `practice`, và màn đó có hint chỉ vào khối: `point: "toolbox:<type>"` (mode `build`) hoặc `point: "block:<type>"` (mode `parsons`). Mode `predict`/`bughunt` không được là nơi khối xuất hiện lần đầu. **Lỗi** (không chỉ cảnh báo). Thêm **cảnh báo** (góp ý HLV 03/10/2026): khối hành động (nhóm `move` trong `BlockSpec`) xuất hiện lần đầu mà không gợi ý nào của màn có `say` chứa nhãn khối (vd "nhảy") → `no hint names "<nhãn>" and says what it does` (`conventions/content-authoring.md` §5.1).
8. Mỗi mode `build`, `parsons`, `predict`, `bughunt` xuất hiện ≥ 1 lần trong mỗi world; không quá 3 màn `build` liền nhau. Vi phạm thì chỉ báo **cảnh báo**.

**Chạy được**
9. Với mọi màn có `solution`: `runLevel(solution)` trả `success`.
10. `blocksUsed(solution) ≤ par ≤ maxBlocks` (nếu có).
11. Mọi block type trong `solution` có trong `toolbox` (trừ `cq_start`; trừ mode `parsons`, khi đó so với `initialWorkspace`).
12. Màn có `maxBlocks`: `solution` và `initialWorkspace` không chứa shadow block, và toolbox không chứa `controls_repeat_ext` (dùng `cq_repeat`). Lý do: `blockly-integration.md` §5. Schema `ToolboxEntry` chỉ cho `fields`, không cho `inputs`, nên khối kéo từ toolbox không bao giờ mang shadow.
13. `parsons`: tập khối của `initialWorkspace` = tập khối của `solution` (chỉ khác thứ tự/vị trí), và `initialWorkspace` **không** tự thắng. Vì vậy màn ghép hình không có khối gây nhiễu: lúc chơi, bé phải ghép **mọi** khối được cho, thắng mà còn khối rời là `incomplete` / `LOOSE_BLOCKS` (câu G22, `runtime-engine.md` §2); luật 9 chạy `solution` đúng mode nên lời giải có khối rời sẽ đỏ.
14. `bughunt`: `initialWorkspace` **phải thua**; `editDistance(initial, solution) ≤ parEdits`.
15. `predict`: chạy `initialWorkspace` lấy `answerKey`, phải trùng đúng 1 `options[].key`; số phương án 3–4.
16. Hint: `point: "toolbox:<type>"` phải trỏ tới khối có trong toolbox; `point: "block:<type>"` phải trỏ tới khối có trong `initialWorkspace` hoặc `solution`, và ở mode `predict`/`bughunt` chương trình cho sẵn chỉ có **đúng một** khối loại đó (màn chơi chỉ vào khối đầu tiên: khối trong chương trình, hoặc khối rời khi điều kiện có `orphans: true`; `apps/web/src/blockly/hintPointer.ts`), nên câu gợi ý không chỉ nhầm khối; `when.lastReason` phải là reasonCode có thật của `kind` hoặc của engine.
17. Mọi reasonCode của engine (`ENGINE_REASONS`) và của mọi kind có câu trong `content/shared/feedback.json` (nguồn duy nhất của câu phản hồi).

**Mục tiêu sao** (P2-21)
19. Màn có `starGoals`: kiểu game chấm được mục tiêu sao (`checkStarGoal`); không mục tiêu nào **đã đạt sẵn trên mọi bản đồ** trước khi Măng đi (vd `collectAll` mà không bản đồ nào có măng); `collectAll` không thừa (mọi bản đồ có măng đều đã đặt `config.goal.collectAll`, nên thắng là đạt); `solution` thắng thì phải đạt **mọi** mục tiêu trên **mọi** bản đồ. Chứng minh `par` đúng theo mục tiêu là việc của `npm run par` (§8).

**Giới hạn khối** (P2-11)
20. `solution` và `initialWorkspace` không vượt `maxLoopDepth` (số tầng vòng lặp `cq_repeat` / `cq_repeat_until` lồng nhau, hàm `loopDepth` của engine) và `maxInstances` (số khối mỗi type, tính cả khối rời, như Blockly đếm). Nếu vượt, bé không ghép lại được lời giải, hoặc nhận một chương trình mà vùng ghép không cho tạo.

**Tài sản**
18. Asset được tham chiếu (`theme.tileset`, `image`, `shop.asset`) tồn tại trong `apps/web/public/`.

Kết quả in thành bảng: `✔ w01-l03 runner/build  par 3  sol 3  ok` hoặc `✖ w02-l05  rule 9: solution ends NOT_AT_GOAL at cell 9`. Cảnh báo in `⚠ <id>  rule 8: …` và **không** làm đỏ (exit 0); có lỗi thì exit 1. `npm run content:check -- --dir <thư mục>` kiểm một cây nội dung khác (mặc định `content/`), dùng cho fixture ở `tools/content-check/fixtures/` (mỗi luật một fixture sai, `baseline/` xanh).

Cách hiểu chi tiết (cài đặt ở P1-11):
- **Luật 1, workspace:** mọi khối trong `solution`, `initialWorkspace` và demo bài giảng có `id` đúng `CONTENT_BLOCK_ID`, không trùng, và **không bị tắt** (`"enabled": false` hay `"disabledReasons"`): khối tắt không chạy, ở `parsons` không gì bật lại được nên bé không thể thắng (P2-07).
- **Đếm chữ** (luật 5): tách theo khoảng trắng, chỉ tính token có chữ cái hoặc chữ số, nên emoji và dấu câu không tính; mỗi âm tiết tiếng Việt là 1 chữ (`lá cờ` = 2). Giống `countWords` trong `apps/web/src/ui/bubbleCopy.ts`.
- **Luật 3:** `levelIds`/`lessonIds` không trùng và trỏ tới file trong **chính thư mục thế giới đó**; `worldId` của level/lesson phải bằng tên thư mục thế giới. Lesson không bắt buộc phải được liệt kê. `lesson.beforeLevel` phải là một màn trong `levelIds` của chính thế giới đó, và bài mở đầu (`lessonIds[0]`) không được có `beforeLevel`.
- **Luật 4, 7, 8** bỏ qua màn `retired`. "Màn creative" của luật 4 là `stage: "creative"`; "trừ creative" của luật 6 là `stage` hoặc `mode` là `creative`.
- **Luật 7:** khối "xuất hiện" ở một màn = khối trong `toolbox`, `initialWorkspace` và `solution` (trừ `cq_start`), xét theo `world.order` rồi `levelIds`. Mỗi khối chỉ báo một lần, ở màn đầu tiên.
- **Màn nhiều bản đồ** (`variants`, P2-12): luật 1 kiểm config của mọi bản đồ (lỗi ghi `variants.<i>.…`, `i` đếm từ 0); luật 9 chạy lời giải trên mọi bản đồ và khi thua ghi bản đồ đầu tiên thua, đếm từ 1: `rule 9: solution ends crash FELL_IN_HOLE (crash:FELL_IN_HOLE@3) on map 2`; luật 14 coi `initialWorkspace` là thua khi thua ít nhất một bản đồ. Dòng ✔ ghi thêm `maps N`. Fixture: `tools/content-check/fixtures/extra-02-variant-loses/` (luật 9), `extra-03-variants-in-predict/` (luật 1).
- **Luật 9–11** bỏ qua màn `predict` (nếu lỡ có `solution`): engine chạy `initialWorkspace` ở mode này, luật 15 đã kiểm.
- **Luật 12:** shadow tính cả shadow lồng trong `next`/`inputs`.
- **Luật 13:** so khớp theo bội (multiset) chữ ký `type + fields + extraState` của mọi khối không phải shadow, kể cả `cq_start` và khối rời.
- **Luật 14:** `initialWorkspace` kết thúc `success` hoặc `INTERNAL_ERROR` đều vi phạm; `parEdits` mặc định 1.
- **Luật 15:** số phương án 3–4 và khóa không trùng đã do schema (luật 1) kiểm.
- **Luật 16:** `lastReason` được đọc cả trong `all`/`any`/`not` lồng nhau. Luật "đúng một khối" (P2-08 review, 04/10/2026) không xét `parsons` (các khối giống nhau đổi chỗ được cho nhau) và `build` (vùng ghép do bé ghép). Lỗi ghi `hint "<id>" points to block:<type>, but initialWorkspace has N such blocks; the arrow lands on the first one`. Fixture: `extra-06-ambiguous-pointer/`.
- **Luật 6, số gợi ý:** lỗi ghi `stage guided needs at least 2 tier-0 hints, has N`. Khu nháp `_*` được miễn như các luật 5–6 khác. Fixture: `extra-05-guided-one-hint/`.
- **Luật 17:** có màn mà thiếu `shared/feedback.json` cũng là lỗi luật 17.
- **Luật 19:** lỗi ghi `rule 19: solution wins but misses star goal "collectAll"` (màn nhiều bản đồ thêm `on map 2`, đếm từ 1), `star goal "collectAll" already holds before Măng moves on every map`, `star goal "collectAll" adds nothing: config.goal.collectAll already requires every shoot to win`, hoặc `game kind "x" has no star goals`. Lời giải thua thì chỉ luật 9 báo. Dòng ✔ ghi thêm `goals N`. Fixture: `rule-19-star-goal-missed/`, `extra-04-star-goal-redundant/`.
- **Luật 20:** lỗi ghi `rule 20: solution nests loops 2 deep > maxLoopDepth 1` hoặc `rule 20: initialWorkspace has 2 "cq_repeat" > maxInstances 1`. Không cần cấu hình hợp lệ (chỉ đọc JSON). `maxInstances` chỉ có `toolbox` kéo được mới cần; luật kiểm mọi type ghi trong nó. Fixture: `rule-20-block-limits/`.
- **Luật 18:** đường dẫn phải bắt đầu bằng `/` (tính từ `apps/web/public/`) và không thoát ra ngoài thư mục đó. Kiểm `world.theme.tileset`, `world.theme.music`, `image` của thẻ bài giảng, `asset` của vật phẩm cửa hàng.

## 6. Phiên bản luật chơi
`GameKindDefinition.version` tăng khi luật chơi đổi. Không cần cache kết quả kiểm: `content:check` **luôn chạy lại lời giải của mọi màn**, nên màn nào bị ảnh hưởng sẽ đỏ ngay. Khi tăng version, ghi một dòng vào `CHANGELOG.md` để huấn luyện viên chơi thử lại các màn của kiểu game đó.

## 7. Giai đoạn của `content:check`
- **Từ P0-01:** bản tối thiểu, chỉ chạy luật 1–2 (schema, ID) trên những file đang có. Thư mục `content/` rỗng thì xanh. Vì zod schema có ở P0-02, luật 1 lúc này chỉ kiểm JSON hợp lệ và có `id` dạng chuỗi; P0-02 nối schema vào. Khu nháp `_*` được miễn mẫu ID nhưng vẫn phải có `id` trùng tên file và không trùng ID khác. Level/lesson phải có tiền tố `wNN-` trùng thư mục thế giới. Trong `shared/` chỉ chấp nhận `feedback.json`, `shop.json`, `badges.json`.
- **Từ P0-02:** luật 1 kiểm mọi file bằng schema zod (lỗi kèm đường dẫn trường, vd `mode: Invalid option…`), và `level.config` bằng `configSchema` của `kind` lấy từ registry `@codequest/games`; kiểu game chưa cài → lỗi luật 1 `game kind "x" is not implemented yet`. Luật 2 kiểm thêm ID vật phẩm (`<loại>-<slug>`, tiền tố phải trùng `kind`) và huy hiệu (kebab-case), không trùng với mọi ID khác.
- **P0-07:** thêm luật 9–11 cho `runner`. Luật 9 chạy `runLevel(solution)` đúng mode của màn; khi thua, chạy lại ở mode `predict` để in chỗ dừng, vd `rule 9: solution ends crash FELL_IN_HOLE (crash:FELL_IN_HOLE@2)`. Luật 11 đọc mọi khối (không tính shadow) trong JSON của `solution`, kể cả khối rời và khối lồng trong `inputs`. `world.json` của `w01-lang-tre` lúc này là **bản tạm**: chỉ liệt kê các màn đã có (`w01-l03`), `lessonIds` rỗng. Bổ sung dần khi soạn đủ Thế giới 1 (P1-12).
- **P1-11:** đủ 18 luật, fixture cho từng luật (`tools/content-check/fixtures/`), tùy chọn `--dir`. **Thế giới tạm:** bảng `PROVISIONAL_WORLDS` trong `tools/content-check/src/curriculum.ts` ghi các thế giới mà `world.json` còn là bản tạm (từ P1-12 bảng đang rỗng; `w01-lang-tre` đã đủ bài giảng và boss). Với chúng, luật 4 và 7 chỉ **cảnh báo** (kèm chữ `provisional world until P1-12`) thay vì báo lỗi, vì thế giới còn thiếu bài giảng, boss và các màn đầu (vd `runner_walk` sẽ được giới thiệu ở `w01-l01`). Mọi luật khác vẫn là lỗi như thường. Không thêm trường mới vào schema cho việc này. Thế giới nào mới dựng dở có thể tạm thêm vào bảng, và phải xóa khi đủ bài giảng và boss.
- **P2-12:** trường `variants` (màn nhiều bản đồ, ADR-0016); luật 1, 9, 14 xét mọi bản đồ; hai fixture `extra-02`, `extra-03`. Output của màn một bản đồ không đổi.
- **P2-21 + P2-11c:** trường `starGoals`, `mission`, `goalSprite`; luật 5 đếm chữ `mission`; thêm **luật 19** (mục tiêu sao) và fixture `rule-19-star-goal-missed/`. Dòng tổng kết in `rules 1–19`; output của mọi màn không có `starGoals` không đổi.
- **P2-11 (a/b):** khối `cq_if`, `cq_if_else`, `cq_repeat_until`, `runner_at_goal`; trường `maxLoopDepth`; điểm gợi ý `step`; mã engine `EMPTY_CONDITION` (luật 17: `feedback.json` của nội dung và mọi fixture có câu cho nó); thêm **luật 20** (giới hạn khối) và fixture `rule-20-block-limits/`. Dòng tổng kết in `rules 1–20`; output các màn khác không đổi.
- **P2-11c (vật phẩm nhiệm vụ):** `config.goal.items` của runner, maze; mã `NEED_KEY`, `NEED_FRIEND` (luật 17: `feedback.json` của nội dung và mọi fixture, trừ fixture luật 17, có câu cho cả hai). Output các màn hiện có không đổi.
- **P2-13 (05/10/2026):** mã engine `LOOSE_BLOCKS` (mode `parsons`, câu G22; luật 17: `feedback.json` của nội dung và mọi fixture có câu). Mọi màn ghép hình W1–W4 vẫn xanh.
- **P2-15:** luật cấp màn chuyển sang package headless `@codequest/validator` (`validateLevel`); `content:check` cho output y hệt trước khi tách (đã so trên `content/` và cả 19 fixture). Thêm `npm run par` (§8).

## 8. Vét cạn `par` (`npm run par`)
`npm run par -- <levelId | đường dẫn .json>… [--world w02] [--max-size N] [--depth N] [--budget N] [--timeout <giây>]` (số nguyên dương; `--depth` ≥ 0), dùng `findShortestPrograms` và `findFixes` của `@codequest/validator`.
- **Không gian tìm:** chương trình dưới `khi bắt đầu` gồm các khối lệnh trong toolbox của màn, `cq_repeat` (nếu toolbox có) với số lần lặp 2–20, và (P2-11, ADR-0018) `cq_if`, `cq_if_else`, `cq_repeat_until` (nếu toolbox có cả khối đó lẫn ít nhất một cảm biến) với mọi cảm biến của toolbox ở ô điều kiện. Khối lệnh và cảm biến có ô chọn (`field_dropdown`) mà toolbox không cố định giá trị thì thử mọi lựa chọn (mỗi lựa chọn một khối). Nhánh `nếu` không rỗng; `nếu … nếu không` được để trống **một** nhánh; thân vòng lặp không rỗng (chương trình có phần rỗng không bao giờ là nhỏ nhất). Lặp lồng tối đa `min(--depth (mặc định 2), maxLoopDepth)` tầng, tính cả `lặp` lẫn `lặp đến khi` (`nếu` không tính tầng). **`maxInstances` được xét** trên cả chương trình (tính cả khối hỏi và khối điều khiển): hai chương trình tới cùng trạng thái nhưng đã dùng số khối giới hạn khác nhau được giữ riêng. Khối có ô cắm khác, khối gọi API cảm biến từ khối lệnh, khối có sẵn của Blockly (`controls_if`…) **không được tìm** (in `not searched: …`).
- **Điều kiện trong vét cạn** (ADR-0018): câu trả lời của cảm biến tính bằng API thật trên bản sao trạng thái, nhớ theo (trạng thái, cảm biến); màn nhiều bản đồ thì mỗi bản đồ đi nhánh của mình. `lặp đến khi` quay lại một trạng thái đã hỏi (hoặc chạy quá `maxActions` vòng) = vòng lặp không dừng = thua (engine trả `TIMEOUT`); ô điều kiện trống = thua (`EMPTY_CONDITION`). Bỏ qua (không đổi số nhỏ nhất và số đếm): `nếu` ở **tầng ngoài cùng** mà câu hỏi trả lời giống nhau trên mọi bản đồ còn chạy (bỏ khối `nếu` đi thì ngắn hơn), `lặp đến khi` ở tầng ngoài cùng hỏi ✔ ngay ở mọi bản đồ (không làm gì). Trần bộ nhớ: `MAX_CATALOG_ENTRIES` (1,5 triệu câu lệnh dựng sẵn) như ngân sách.
- **Tái lập `curriculum.md` §5.5** (test `packages/validator/src/search/conditions.test.ts`, mỗi màn vài giây): W4 `l02` nhỏ nhất 5, đúng **28** chương trình, đều có khối hỏi; W4 `l16` thắng thường 5 (**75** cách, không cách nào nhặt măng), theo mục tiêu 8; W5 `l01`, `l04`, `l06` đúng 1 lời giải; W5 `l09` không có ≤ 6, cỡ 7 đúng **1**; W5 `l14` thắng thường 6 (6 cách), theo mục tiêu 7 (2 cách "lắc"); W5 `l17` nhỏ nhất 7 (4 cách); W5 boss nhỏ nhất 6 (6 cách); sửa lỗi: W4 `l05` 1, W4 `l19` 2, W5 `l05` 1, W5 `l12` 1, W5 `l13` 2 thao tác. Với vật phẩm nhiệm vụ (P2-11c): W4 `l17` (chìa khóa, 3 bản đồ) nhỏ nhất 5 (**24** cách, đều có khối hỏi; nhảy cóc thua); W4 boss (chìa khóa, 3 mê cung) không có ≤ 7, nhỏ nhất **8** (**68** cách, có cách hai câu hỏi; bỏ chìa khóa thì 429 cách, kể cả bản "hỏi bên phải trước"); W5 boss với Gà con vẫn 6 (6 cách). Vét cạn không cần thêm gì: vật phẩm đã nhặt nằm trong trạng thái của kiểu game nên trạng thái gộp vẫn đúng.
- **Màn `build`:** tìm theo số khối tăng dần tới `par` (không vượt `maxBlocks`); báo số khối nhỏ nhất, **số chương trình** thắng với số khối đó và vài ví dụ (mỗi trạng thái mô phỏng một ví dụ, nên số ví dụ có thể ít hơn số chương trình).
- **Màn `bughunt`:** như trên (chỉ để biết), và tìm theo số lần sửa (`editDistance`) tăng dần tới `parEdits`: báo số lần sửa ít nhất và số cách sửa. Lần sửa chỉ được **thêm/đổi thành** khối có trong toolbox; khối chỉ có trong `initialWorkspace` thì giữ hoặc xóa. Cách sửa chỉ thêm một vòng lặp rỗng (hoặc `nếu` rỗng) không được tính. Với khối điều kiện (P2-11), mỗi token có thêm tên input (`DO`, `ELSE`, `COND`) như `editDistance`: đổi giá trị ô chọn của khối hỏi = 1, `lặp` → `lặp đến khi` + cắm khối hỏi = 2 (T13). Cách sửa phải giữ `maxBlocks`, `maxInstances`, `maxLoopDepth` (chương trình ở giữa các bước sửa thì không cần: `editDistance` không phụ thuộc thứ tự). Màn không có khối điều kiện tìm y như trước (cùng thứ tự, cùng ngân sách).
- `parsons`, `predict`, `creative`: bỏ qua (khối đã cho sẵn).
- **Màn có mục tiêu sao** (`starGoals`, P2-21): chỉ chương trình (hoặc cách sửa) **vừa thắng vừa đạt mọi mục tiêu trên mọi bản đồ** mới được tính, vì `par` / `parEdits` của màn này là mức ⭐⭐⭐. Trong vét cạn, lượt thắng mà thiếu mục tiêu được coi là thua (mục tiêu chấm bằng `checkStarGoal` trên trạng thái lúc thắng). CLI tìm thêm lần nữa **bỏ qua mục tiêu** (`ignoreStarGoals`) để in đánh đổi: `✔ w03-l11 runner/build  par 7  min (goals) 7 (68 shortest) · plain win 5 (32)`, kèm ví dụ `plain win: …`. Mức báo ✖/⚠ xét theo số có mục tiêu (`par 5 is too high`… ghi thêm `(goals)`; `no win (goals) ≤ 5 blocks`). Bughunt ghi `fix (goals) N`. Màn không có `starGoals` in y như trước (đã so `--world w01`, `--world w02`).
- **Màn nhiều bản đồ** (`variants`, P2-12): chỉ chương trình (hoặc cách sửa) **thắng mọi bản đồ** mới được tính. Trạng thái tìm là bộ trạng thái của từng bản đồ (bản đồ đã thắng giữa chừng giữ nguyên là thắng); thua một bản đồ là loại ngay. Dòng kết quả ghi `maps N`, vd `✔ runner-maps runner/build  maps 3  par 3  min 3 (18 shortest)`. Màn một bản đồ tìm y như trước (cùng số trạng thái, cùng kết quả). Số bộ trạng thái có trần `MAX_TUPLE_STATES` (1 triệu, khoảng 100 MB): vượt trần thì dừng như hết ngân sách (`search stopped`, kết quả tối đa ⚠).
- **Trần bộ nhớ của tìm cách sửa:** tìm theo bề rộng phải giữ mọi chương trình của các khoảng cách trước để mở rộng; số chương trình giữ lại có trần `MAX_KEPT_FIXES` (2 triệu, khoảng 600 MB). Vượt trần thì dừng như hết ngân sách (`fix search stopped (budget, memory cap or --timeout)`, ⚠), không để Node hết bộ nhớ. Trước trần này `npm run par -- w03-boss` (`parEdits` 4) vượt 2 GB heap ở 3 thao tác và chết (exit 134); nay dừng ở khoảng 850 MB, chứng minh không có cách sửa ≤ 2 thao tác.
- **Mức báo:** ✖ chỉ khi chắc chắn: có chương trình thật ít khối hơn `par`; `runLevel` không đồng ý với kết quả tìm; hoặc tìm **hết** (đủ ngân sách, mọi khối toolbox đều tìm được) mà không thắng trong `par` / không sửa được trong `parEdits`. Mọi trường hợp chưa chắc tối đa là ⚠: hết ngân sách, có khối không tìm được, kiểu game không phát lại được (API dùng `ctx.rng`), hoặc màn bughunt sửa được với ít lần hơn `parEdits`. Exit 1 khi có ✖.
- **Tất định và giới hạn:** cùng màn và tùy chọn ⇒ cùng kết quả. Giới hạn bằng ngân sách công việc (`maxWork`, mặc định `DEFAULT_MAX_WORK` = 20 triệu; level editor trong Web Worker nên dùng `WORKER_MAX_WORK` = 2 triệu, đủ cho mọi `par` build W1–W2 và sửa ≤ 2 lần). Hết ngân sách hoặc quá `--timeout` thì **luôn** in dòng `search stopped …`; số khối / số lần sửa nhỏ nhất vẫn chính xác nếu đã tìm thấy (các mức nhỏ hơn đã tìm hết), còn số đếm có dấu `≥`. Mọi ví dụ in ra đều được chạy lại bằng `runLevel`.
- **Đo trên máy dev (03/10/2026):** `npm run par -- --world w02` 10,9 giây (9,7 giây là `w02-l18`, `parEdits` 3, dừng ở ngân sách khi đếm cách sửa), bộ nhớ đỉnh của `npm run par -- w02-l18` 232 MB; `--world w01` 0,7 giây.
- Giả định về kiểu game mà vét cạn cần: `game-kind-sdk.md` §4.
- **Level editor (`/coach/editor`, P2-07):** nút "Tìm par nhỏ nhất" gọi cùng hai hàm trong một Web Worker với `WORKER_MAX_WORK` và giới hạn 60 giây (`shouldStop`); "Hủy" kết thúc worker (vét cạn chạy đồng bộ nên không nhận được tin nhắn hủy). Khác CLI: editor tìm tới `maxBlocks`, hoặc `max(par, 10)` khối khi chưa có `maxBlocks`, và sửa tới `max(parEdits, 2)` lần, để thấy cả trường hợp `par` / `parEdits` đặt quá thấp (báo "quá thấp"). Mức báo theo đúng quy tắc ✖/⚠ ở trên.
