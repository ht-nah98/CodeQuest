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
| Câu thoại có giọng đọc | `<id>.<khóa>` | `w01-l03.objective` · `w01-l03.thinking` · `w01-l03.hint.<hintId>` · `w01-lesson.c<số thẻ>` · `feedback.FELL_IN_HOLE` · `ui.<khóa trong vi.ts>` |

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
  toolbox: ToolboxEntry[];                  // rỗng với parsons/predict
  maxBlocks?: number;
  maxInstances?: Record<string, number>;
  par?: number;                             // bắt buộc với build/parsons
  parEdits?: number;                        // bughunt, mặc định 1
  config: unknown;                          // kiểm bằng configSchema của kind; điều kiện thắng phụ (vd goal.collectAll) nằm TRONG config
  initialWorkspace?: WorkspaceJson;         // bắt buộc với parsons (khối xáo trộn), predict, bughunt
  solution?: WorkspaceJson;                 // bắt buộc trừ predict/creative
  predict?: { options: Array<{ key: string; label: string }>; };  // key theo predictAnswer; label ≤ 4 chữ; hình do renderer vẽ (drawAnswer); đáp án đúng do engine tính
  hints: HintRule[];                        // gợi ý tầng 0 (xem hint-engine.md)
  thinkingHint?: string;                    // gợi ý tầng 1, bắt buộc trừ creative
  feedback?: Partial<Record<string, string>>;   // ghi đè câu theo reasonCode
  limits?: { maxSteps?: number; maxActions?: number };
  retired?: boolean;
}

interface Lesson {
  id: string; worldId: string; title: string;
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

**Cấu trúc**
1. Mọi file đúng schema zod. `level.config` đúng `configSchema` của `kind`.
2. ID duy nhất, đúng mẫu ở §2, khớp tên file.
3. `world.levelIds` / `lessonIds` trỏ tới file có thật; mọi level nằm trong đúng một world.
4. Mỗi world có ≥ 1 lesson, đúng 1 `boss`, tối đa 1 `creative`.

**Sư phạm**
5. `objective` ≤ 12 chữ; `title` ≤ 5 chữ; mọi câu `say` trong hint ≤ 12 chữ.
6. `guided`/`practice` phải có `misconception`. Mọi màn trừ `creative` có `thinkingHint`.
7. Khối xuất hiện lần đầu **trong toàn bộ chương trình học** (theo thứ tự `world.order`, rồi `levelIds`) phải ở màn `guided` hoặc `practice`, và màn đó có hint chỉ vào khối: `point: "toolbox:<type>"` (mode `build`) hoặc `point: "block:<type>"` (mode `parsons`). Mode `predict`/`bughunt` không được là nơi khối xuất hiện lần đầu. **Lỗi** (không chỉ cảnh báo).
8. Mỗi mode `build`, `parsons`, `predict`, `bughunt` xuất hiện ≥ 1 lần trong mỗi world; không quá 3 màn `build` liền nhau. Vi phạm thì chỉ báo **cảnh báo**.

**Chạy được**
9. Với mọi màn có `solution`: `runLevel(solution)` trả `success`.
10. `blocksUsed(solution) ≤ par ≤ maxBlocks` (nếu có).
11. Mọi block type trong `solution` có trong `toolbox` (trừ `cq_start`; trừ mode `parsons`, khi đó so với `initialWorkspace`).
12. Màn có `maxBlocks`: `solution` và `initialWorkspace` không chứa shadow block, và toolbox không chứa `controls_repeat_ext` (dùng `cq_repeat`). Lý do: `blockly-integration.md` §5. Schema `ToolboxEntry` chỉ cho `fields`, không cho `inputs`, nên khối kéo từ toolbox không bao giờ mang shadow.
13. `parsons`: tập khối của `initialWorkspace` = tập khối của `solution` (chỉ khác thứ tự/vị trí), và `initialWorkspace` **không** tự thắng.
14. `bughunt`: `initialWorkspace` **phải thua**; `editDistance(initial, solution) ≤ parEdits`.
15. `predict`: chạy `initialWorkspace` lấy `answerKey`, phải trùng đúng 1 `options[].key`; số phương án 3–4.
16. Hint: `point: "toolbox:<type>"` phải trỏ tới khối có trong toolbox; `point: "block:<type>"` phải trỏ tới khối có trong `initialWorkspace` hoặc `solution`; `when.lastReason` phải là reasonCode có thật của `kind` hoặc của engine.
17. Mọi reasonCode của engine (`ENGINE_REASONS`) và của mọi kind có câu trong `content/shared/feedback.json` (nguồn duy nhất của câu phản hồi).

**Tài sản**
18. Asset được tham chiếu (`theme.tileset`, `image`, `shop.asset`) tồn tại trong `apps/web/public/`.

Kết quả in thành bảng: `✔ w01-l03 runner/build  par 3  sol 3  ok` hoặc `✖ w02-l05  rule 9: solution ends NOT_AT_GOAL at cell 9`. Cảnh báo in `⚠ <id>  rule 8: …` và **không** làm đỏ (exit 0); có lỗi thì exit 1. `npm run content:check -- --dir <thư mục>` kiểm một cây nội dung khác (mặc định `content/`), dùng cho fixture ở `tools/content-check/fixtures/` (mỗi luật một fixture sai, `baseline/` xanh).

Cách hiểu chi tiết (cài đặt ở P1-11):
- **Đếm chữ** (luật 5): tách theo khoảng trắng, chỉ tính token có chữ cái hoặc chữ số, nên emoji và dấu câu không tính; mỗi âm tiết tiếng Việt là 1 chữ (`lá cờ` = 2). Giống `countWords` trong `apps/web/src/ui/bubbleCopy.ts`.
- **Luật 3:** `levelIds`/`lessonIds` không trùng và trỏ tới file trong **chính thư mục thế giới đó**; `worldId` của level/lesson phải bằng tên thư mục thế giới. Lesson không bắt buộc phải được liệt kê.
- **Luật 4, 7, 8** bỏ qua màn `retired`. "Màn creative" của luật 4 là `stage: "creative"`; "trừ creative" của luật 6 là `stage` hoặc `mode` là `creative`.
- **Luật 7:** khối "xuất hiện" ở một màn = khối trong `toolbox`, `initialWorkspace` và `solution` (trừ `cq_start`), xét theo `world.order` rồi `levelIds`. Mỗi khối chỉ báo một lần, ở màn đầu tiên.
- **Luật 9–11** bỏ qua màn `predict` (nếu lỡ có `solution`): engine chạy `initialWorkspace` ở mode này, luật 15 đã kiểm.
- **Luật 12:** shadow tính cả shadow lồng trong `next`/`inputs`.
- **Luật 13:** so khớp theo bội (multiset) chữ ký `type + fields + extraState` của mọi khối không phải shadow, kể cả `cq_start` và khối rời.
- **Luật 14:** `initialWorkspace` kết thúc `success` hoặc `INTERNAL_ERROR` đều vi phạm; `parEdits` mặc định 1.
- **Luật 15:** số phương án 3–4 và khóa không trùng đã do schema (luật 1) kiểm.
- **Luật 16:** `lastReason` được đọc cả trong `all`/`any`/`not` lồng nhau.
- **Luật 17:** có màn mà thiếu `shared/feedback.json` cũng là lỗi luật 17.
- **Luật 18:** đường dẫn phải bắt đầu bằng `/` (tính từ `apps/web/public/`) và không thoát ra ngoài thư mục đó. Kiểm `world.theme.tileset`, `world.theme.music`, `image` của thẻ bài giảng, `asset` của vật phẩm cửa hàng.

## 6. Phiên bản luật chơi
`GameKindDefinition.version` tăng khi luật chơi đổi. Không cần cache kết quả kiểm: `content:check` **luôn chạy lại lời giải của mọi màn**, nên màn nào bị ảnh hưởng sẽ đỏ ngay. Khi tăng version, ghi một dòng vào `CHANGELOG.md` để huấn luyện viên chơi thử lại các màn của kiểu game đó.

## 7. Giai đoạn của `content:check`
- **Từ P0-01:** bản tối thiểu, chỉ chạy luật 1–2 (schema, ID) trên những file đang có. Thư mục `content/` rỗng thì xanh. Vì zod schema có ở P0-02, luật 1 lúc này chỉ kiểm JSON hợp lệ và có `id` dạng chuỗi; P0-02 nối schema vào. Khu nháp `_*` được miễn mẫu ID nhưng vẫn phải có `id` trùng tên file và không trùng ID khác. Level/lesson phải có tiền tố `wNN-` trùng thư mục thế giới. Trong `shared/` chỉ chấp nhận `feedback.json`, `shop.json`, `badges.json`.
- **Từ P0-02:** luật 1 kiểm mọi file bằng schema zod (lỗi kèm đường dẫn trường, vd `mode: Invalid option…`), và `level.config` bằng `configSchema` của `kind` lấy từ registry `@codequest/games`; kiểu game chưa cài → lỗi luật 1 `game kind "x" is not implemented yet`. Luật 2 kiểm thêm ID vật phẩm (`<loại>-<slug>`, tiền tố phải trùng `kind`) và huy hiệu (kebab-case), không trùng với mọi ID khác.
- **P0-07:** thêm luật 9–11 cho `runner`. Luật 9 chạy `runLevel(solution)` đúng mode của màn; khi thua, chạy lại ở mode `predict` để in chỗ dừng, vd `rule 9: solution ends crash FELL_IN_HOLE (crash:FELL_IN_HOLE@2)`. Luật 11 đọc mọi khối (không tính shadow) trong JSON của `solution`, kể cả khối rời và khối lồng trong `inputs`. `world.json` của `w01-lang-tre` lúc này là **bản tạm**: chỉ liệt kê các màn đã có (`w01-l03`), `lessonIds` rỗng. Bổ sung dần khi soạn đủ Thế giới 1 (P1-12).
- **P1-11:** đủ 18 luật, fixture cho từng luật (`tools/content-check/fixtures/`), tùy chọn `--dir`. **Thế giới tạm:** bảng `PROVISIONAL_WORLDS` trong `tools/content-check/src/curriculum.ts` ghi các thế giới mà `world.json` còn là bản tạm (hiện chỉ `w01-lang-tre`, tới P1-12). Với chúng, luật 4 và 7 chỉ **cảnh báo** (kèm chữ `provisional world until P1-12`) thay vì báo lỗi, vì thế giới còn thiếu bài giảng, boss và các màn đầu (vd `runner_walk` sẽ được giới thiệu ở `w01-l01`). Mọi luật khác vẫn là lỗi như thường. Không thêm trường mới vào schema cho việc này. **P1-12 phải xóa `w01-lang-tre` khỏi bảng** khi Thế giới 1 đủ bài giảng và boss.
