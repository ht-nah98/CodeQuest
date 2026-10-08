# SDK kiểu game

Nguồn chuẩn cho: hợp đồng (interface) mà mỗi kiểu game phải cài đặt, ở phía headless (`packages/games`) và phía hiển thị (`apps/web/src/stages`).

Một kiểu game gồm **hai nửa**:
```
packages/games/src/<kind>/       ← headless: luật chơi, khối, mô phỏng, chấm bài
apps/web/src/stages/<kind>/      ← hiển thị: vẽ PixiJS, diễn từng GameEvent
```

## 1. Nửa headless: `GameKindDefinition`
Interface định nghĩa trong `packages/engine/src/sdk/gameKind.ts`:

```ts
export interface GameKindDefinition<C, S, E extends GameEvent> {
  /** 'runner' | 'maze' | ... — khớp level.kind */
  id: GameKindId;
  /** Tăng khi thay đổi luật làm lời giải cũ có thể sai. content:check báo màn cần soát lại. */
  version: number;

  /** Schema zod cho level.config của kiểu game này */
  configSchema: z.ZodType<C>;

  /** Khối riêng của kiểu game (JSON định nghĩa Blockly + generator) */
  blocks: ReadonlyArray<BlockSpec>;

  /** Mã lý do thua riêng. Câu tiếng Việt KHÔNG nằm ở đây: nguồn duy nhất là content/shared/feedback.json (content:check luật 17). */
  reasonCodes: ReadonlyArray<string>;

  /** Trạng thái ban đầu từ config. Có thể dùng rng (đề ngẫu nhiên). */
  createState(config: C, rng: () => number): S;

  /** Các hàm đưa vào sandbox. Tên hàm phải khớp với generator trong blocks. */
  createApi(ctx: SimContext<S, E>): GameKindApi;   // Readonly<Record<string, (...args: Primitive[]) => Primitive | undefined>>

  /** Gọi khi chương trình chạy hết mà chưa bị stop. */
  evaluate(state: S, config: C): { success: true } | { success: false; reasonCode: string };

  /** Cho mode predict: mô tả kết quả thành một khóa so sánh được (định dạng ở product/game-kinds.md). */
  predictAnswer(state: S, outcome: { result: RunResult; reasonCode: ReasonCode | null }): string;

  /**
   * Tùy chọn (P2-21, ADR-0017): trạng thái cuối của một lượt chạy trên một bản đồ có đạt mục tiêu sao
   * `goal` không. Thuần, chỉ đọc state (và config). Không có hàm này = kiểu game không hỗ trợ
   * `starGoals` (content:check luật 19). runner, maze: `collectAll` = đã nhặt hết măng của bản đồ.
   */
  checkStarGoal?(goal: StarGoal, state: S, config: C): boolean;
}

/** Event cơ sở. Mọi event của kiểu game mở rộng từ đây (discriminated union theo `type`). */
export interface GameEvent { type: string; blockId: string | null }
export interface HighlightEvent { type: 'highlight'; blockId: string }
/** Omit phân phối trên union — dùng cho emit, vì Omit<Union,K> thường làm mất trường riêng của từng biến thể. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export interface BlockSpec {
  type: string;                  // '<kind>_<verb>', vd 'runner_jump'
  category: BlockCategory;       // 'move' | 'loop' | 'logic' | 'sensor' | 'robot' | 'variable' | 'function' | 'pen' | 'event'
  json: BlocklyBlockJson;        // định nghĩa JSON của Blockly (message0, args0, previousStatement…)
  generator: (block: Blockly.Block, gen: JavascriptGenerator) => string | [string, number];
  /** Tên hàm API mà generator gọi tới — dùng để addReservedWords và kiểm chứng */
  apiNames: ReadonlyArray<string>;
}
```

Registry: `packages/games/src/index.ts` export `gameKinds: Readonly<Partial<Record<GameKindId, AnyGameKindDefinition>>>` và `getGameKind(id)` (trả `undefined` nếu kiểu game chưa cài). `Partial` vì các kiểu game được thêm dần theo roadmap. `AnyGameKindDefinition = GameKindDefinition<unknown, unknown, GameEvent>`; các phương thức của interface viết theo cú pháp method nên một kiểu game cụ thể gán được vào kiểu này. App và tools lấy kiểu game qua registry, **không** import trực tiếp từng thư mục con.

API trả `Primitive | undefined` (không dùng `void` vì luật ESLint `no-invalid-void-type`; arrow function không có `return` vẫn hợp lệ nhờ TS ≥ 5.1). Tham số không phải string/number/boolean (**kể cả `undefined`**, vốn cũng là giá trị nguyên thủy trong JS) hoặc giá trị trả về là object → `INTERNAL_ERROR`. Mọi tên trong `BlockSpec.apiNames` phải có trong object `createApi` trả về, nếu không `runLevel` báo `INTERNAL_ERROR` (`createApi lacks …`).

### Cấu trúc thư mục một kiểu game (headless)
```
packages/games/src/runner/
├─ index.ts          export const runner: GameKindDefinition<RunnerConfig, RunnerState, RunnerEvent>
├─ config.ts         RunnerConfig + configSchema (zod)
├─ state.ts          RunnerState + createState
├─ events.ts         RunnerEvent (discriminated union)
├─ blocks.ts         BlockSpec[]: runner_walk, runner_jump, runner_crouch, runner_kick, runner_is_ahead
├─ sim.ts            createApi: walk/jump/crouch/kick/isAhead — cập nhật state, emit, stop
├─ evaluate.ts       evaluate + predictAnswer
├─ reasons.ts        reasonCodes
└─ runner.test.ts    test luật chơi trên Node
```

### Ví dụ rút gọn: `runner_jump`
```ts
// blocks.ts
{ type: 'runner_jump', category: 'move', apiNames: ['jump'],
  json: { message0: '%1 nhảy', args0: [{ type: 'field_image', src: '/icons/jump.png', width: 24, height: 24, alt: 'nhảy' }],   // đường dẫn tuyệt đối, xem blockly-integration §12
          previousStatement: null, nextStatement: null, style: 'move_blocks' },
  generator: (b, gen) => `jump(${gen.quote_(b.id)});\n` }

// sim.ts
jump: (blockId) => {
  const id = String(blockId), from = ctx.state.pos, to = from + 2;
  // Luật đầy đủ: product/game-kinds.md §3.1, bảng "nhảy". Ô from+1 luôn nằm trong đường.
  crashIfBlocked(ctx, from + 1, 'jump', id);                // branch/crate ở ô bay qua → bump + crash
  if (to >= ctx.state.cells.length) { ctx.state.crashAt = from; ctx.emit({ type: 'offTrack', from }, id); ctx.stop('crash', 'OFF_TRACK'); }
  crashIfBlocked(ctx, to, 'jump', id);                      // branch/crate ở ô tiếp đất → bump + crash
  ctx.emit({ type: 'jump', from, to }, id);
  arrive(ctx, to, id);   // hố → fall; măng / vật phẩm → collect; cờ → win (success) hoặc missed (NEED_KEY / NEED_FRIEND / MISSED_ITEMS)
}
```

### Luật cho nửa headless
1. Không DOM, không thời gian, không ngẫu nhiên ngoài `rng` (xem `runtime-engine.md` §6). Áp dụng cho **toàn bộ** `packages/games/src/**`.
2. `GameEvent` là **dữ liệu thuần**, serialize JSON được, đủ để vẽ lại mà không cần đọc `state`.
3. Mỗi event hành động mang `blockId` của khối gây ra nó.
4. Va chạm phải emit một event thất bại **trước** khi `stop`, để sân chơi diễn được cảnh ngã/đâm.
5. Mọi `reasonCode` mới phải được liệt kê trong `reasonCodes` **và** có câu tiếng Việt trong `content/shared/feedback.json`.
6. **Cảm biến** (khối giá trị, `json.output`, P2-11): generator gọi **một** API, block id là tham số cuối (`isAhead('HOLE', id)`); API chỉ đọc state, trả boolean qua `return ctx.sense(answer, String(blockId))` để engine ghi `sense` (khối hỏi sáng ✔/✘). Không `emit`, không `stop`, không đổi state (vét cạn kiểm và báo `unsearchable` nếu vi phạm).

### 1.1 Event của `runner` (P0-07, đủ luật ở P1-01)
Type: `RunnerEvent` export từ `@codequest/games` (`packages/games/src/runner/events.ts`), kèm `RunnerObstacle` (`'branch' | 'crate'`), `RunnerMove` (`'walk' | 'crouch' | 'jump'`), `RUNNER_AHEAD_KINDS`. Mọi event có `blockId` của khối gây ra nó; engine chèn thêm `highlight` trước mỗi câu lệnh. Luật đầy đủ: `product/game-kinds.md` §3.1.

| Event | Trường | Ý nghĩa cho sân chơi |
|---|---|---|
| `walk` | `from`, `to` (= from+1) | Đi sang ô kế |
| `crouch` | `from`, `to` (= from+1) | Cúi người đi sang ô kế (chui dưới cành nếu ô `to` là `branch`) |
| `jump` | `from`, `to` (= from+2) | Nhảy vòng cung qua ô from+1, tiếp đất ở `to` |
| `kick` | `at` (= ô Măng + 1), `hit` | Măng đá ô `at`, **đứng yên**. `hit: true`: thùng đổ, từ đây ô `at` là `ground`. `hit: false`: đá hụt, không thua |
| `collect` | `at`, `item?` | Nhặt măng ở ô `at` (ô Măng vừa dừng). Có `item` (`'key'` / `'friend'`, P2-11c, ADR-0019): nhặt **vật phẩm nhiệm vụ** của `goal.items` (chìa khóa; bạn từ đây đi theo Măng), không phải măng. Đi ngay sau `walk`/`crouch`/`jump` có `to = at`, cùng `blockId`. Bay qua thì không nhặt |
| `fall` | `at` | Rơi xuống hố ở ô `at`. Luôn đi **ngay sau** `walk`/`crouch`/`jump` có `to = at`, cùng `blockId`; lượt chạy kết thúc `crash` / `FELL_IN_HOLE` |
| `bump` | `from`, `at`, `obstacle`, `move` | Măng đang `move` từ `from` thì va `obstacle` ở ô `at` và **vẫn ở `from`** (bật lại). **Không** có `walk`/`crouch`/`jump` đi trước. Với `move: 'jump'`: `at = from+1` là va giữa không trung, `at = from+2` là va lúc tiếp đất. Lượt chạy kết thúc `crash` / `HIT_BRANCH` (`obstacle: 'branch'`) hoặc `HIT_CRATE` (`'crate'`) |
| `offTrack` | `from` | Nhảy từ `from` ra khỏi cuối đường (đứng ở ô áp chót mà nhảy, kể cả bay qua cờ). **Không** có `jump` đi trước; lượt chạy kết thúc `crash` / `OFF_TRACK` |
| `win` | `at` | Đứng trên cờ ở ô `at`: ăn mừng. Đi ngay sau `walk`/`crouch`/`jump` tới cờ, cùng `blockId`; lượt chạy kết thúc `success` |
| `missed` | `at`, `left`, `item?` | Tới cờ ở ô `at` mà còn thiếu: Măng tiếc, các ô `left` nhấp nháy. Thay cho `win`. Không có `item`: `goal.collectAll` và còn măng ở `left` (tăng dần), kết thúc `incomplete` / `MISSED_ITEMS`. Có `item` (P2-11c): còn vật phẩm nhiệm vụ ở `left` (tăng dần), `item` là loại của vật phẩm còn thiếu đầu tiên theo thứ tự config, kết thúc `incomplete` / `NEED_KEY` (`key`) hoặc `NEED_FRIEND` (`friend`). Vật phẩm được xét **trước** măng |

Thứ tự trong một khối: kiểm tra chướng ngại (`bump` / `offTrack`) → di chuyển (`walk`/`crouch`/`jump`) → `fall` **hoặc** `collect` → `win` / `missed`. Nhảy: xét ô bay qua trước, rồi tới cuối đường, rồi ô tiếp đất (cành ở ô bay qua + hố ở ô tiếp đất → `HIT_BRANCH`). Cảm biến `isAhead` (đọc ô from+1; ô ngoài đường → `false`) và `atGoal` (`runner_at_goal`, P2-11: Măng đứng ở cờ, nên trong lúc chạy luôn `false`) không emit event của runner; chúng báo câu trả lời qua `ctx.sense`, engine ghi event chung `sense{blockId, value}` (`runtime-engine.md` §5). Khối `cq_if` / `cq_if_else` / `cq_repeat_until` chứa chúng được highlight như mọi câu lệnh, rồi tới `sense`.

Hết chương trình mà chưa tới cờ: không có event riêng, lượt chạy kết thúc `incomplete` / `NOT_AT_GOAL` (sân chơi giữ Măng đứng ở ô cuối cùng). Khối gây lỗi để rung = `blockId` của event cuối cùng.

Config: `cells` (`ground`/`hole`/`branch`/`crate`/`flag`), `start`, `bamboo?: number[]` (ô `ground`/`branch`, nằm **sau** `start`, không trùng), `goal?: { collectAll?: boolean; items?: { kind: 'key' | 'friend'; at: number }[] }` (`collectAll: true` cần ≥ 1 măng; `items` ≥ 1 phần tử, mỗi vật phẩm ở ô `ground`/`branch` **sau** `start`, không trùng nhau, không trùng măng; P2-11c, ADR-0019). `RUNNER_AHEAD_KINDS` nằm ở `config.ts`. `state.cells` là bản sao vì thùng bị đá thành `ground`; `level.config` không bị sửa. Khối tạm chỉ có chữ (chưa có `field_image`) vì `apps/web/public/icons/` chưa có icon. Cảm biến `runner_is_ahead` là khối giá trị (`output: 'Boolean'`, `sensor_blocks`), dropdown `KIND` = `HOLE`/`BRANCH`/`CRATE`/`CLEAR` (nhãn hố/cành/thùng/ô trống), generator `isAhead('<KIND>', '<blockId>')`. Cảm biến `runner_at_goal` ("đã tới nơi?", P2-11) generator `atGoal('<blockId>')`.

`predictAnswer` của runner: `win` · `stop@<ô>` (hết chương trình ở ô đó, `NOT_AT_GOAL`) · `missed@<ô cờ>` (`MISSED_ITEMS`, `NEED_KEY`, `NEED_FRIEND`) · `crash:<REASON>@<ô>`. Ô của crash là ô hố (`FELL_IN_HOLE`) hoặc ô chướng ngại bị va (`HIT_BRANCH`/`HIT_CRATE`, tức `bump.at`); với `OFF_TRACK` là **ô Măng nhảy đi** (ô tiếp đất không tồn tại). Kết quả `timeout`/`error` trả đúng tên kết quả (`timeout`, `error`).

### 1.2 Event của `maze` (P1-02)
Type: `MazeEvent` export từ `@codequest/games` (`packages/games/src/maze/events.ts`). Ô viết `[r, c]` (hàng, cột, từ 0, hàng 0 ở trên cùng); hướng là `'N' | 'E' | 'S' | 'W'` (N = lên trên). Mọi event có `blockId` của khối gây ra nó; engine chèn thêm `highlight` trước mỗi câu lệnh (khối cảm biến là khối giá trị nên không có `highlight` riêng; nó báo câu trả lời qua `ctx.sense`, engine ghi `sense{blockId, value}`).

| Event | Trường | Ý nghĩa cho sân chơi |
|---|---|---|
| `move` | `from`, `to`, `dir` | Đi một ô từ `from` sang `to` (kề nhau theo `dir`). Có thể đi vào `.`, `S`, `b`, `G` |
| `turn` | `from`, `to` (hướng) | Quay 90° tại chỗ: rẽ trái N→W→S→E→N, rẽ phải N→E→S→W→N |
| `bump` | `at`, `dir` | Đứng ở `at`, nhìn `dir`, tiến vào tường `#` hoặc ra ngoài bản đồ: đâm rồi đứng lại ở `at`. **Khác runner:** `at` là ô **của Măng**, không phải ô vật cản; ô tường = `at` + một bước theo `dir` (có thể nằm ngoài bản đồ). **Không** có `move` đi trước; lượt chạy kết thúc `crash` / `HIT_WALL` |
| `collect` | `at`, `item?` | Nhặt măng ở ô `b` tại `at`, hoặc (có `item`, P2-11c) vật phẩm nhiệm vụ `goal.items` ở ô `.` tại `at`. Đi **ngay sau** `move` có `to = at`, cùng `blockId`; mỗi ô chỉ nhặt một lần. Măng được nhặt cả khi màn không có `goal.collectAll` |
| `win` | `at` | Tới đích `G` ở `at` và đã đủ điều kiện (đã nhặt mọi vật phẩm `goal.items`; không `collectAll`, hoặc đã nhặt hết măng): ăn mừng. Đi **ngay sau** `move` có `to = at` (ô `G` không có măng nên không có `collect` xen giữa), cùng `blockId`; lượt chạy kết thúc `success` **ngay**, các khối sau không chạy |

Tới `G` khi còn vật phẩm nhiệm vụ, hoặc khi `collectAll` mà còn măng: không có event riêng, `G` như ô thường (Măng đi xuyên qua). Măng / vật phẩm còn lại trên sân = các ô của config trừ các `collect.at` đã diễn (sân chơi tự tính, event không mang số đếm). Hết chương trình: không ở `G` → `incomplete` / `NOT_AT_GOAL` (xét trước); đứng ở `G` mà còn vật phẩm → `NEED_KEY` / `NEED_FRIEND` (loại của vật phẩm còn thiếu đầu tiên); còn măng → `MISSED_ITEMS`. Khối gây lỗi để rung = `blockId` của event cuối cùng.

API trong sandbox: `forward(id)`, `turn('LEFT' | 'RIGHT', id)`, `isPath('AHEAD' | 'LEFT' | 'RIGHT', id)` (ô kề theo hướng tương đối đó nằm trong bản đồ và không phải `#`), `atGoal(id)` (đang đứng ở `G`, bất kể măng). Giá trị lạ → `INTERNAL_ERROR`.

`predictAnswer` của maze: `win` · `stop@r,c` (`NOT_AT_GOAL`) · `missed@r,c` (`MISSED_ITEMS`, `NEED_KEY`, `NEED_FRIEND`) · `crash:HIT_WALL@r,c`, với `r,c` là ô Măng đang đứng (khi đâm: ô đứng lúc tiến, vì ô tường không đi vào được), viết không dấu cách, vd `stop@1,2`. Kết quả `timeout`/`error` trả đúng tên kết quả.

Config được kiểm (zod `mazeConfigSchema`): 3–12 hàng × 3–12 cột, các hàng dài bằng nhau, chỉ có ký tự `# . S G b`, đúng 1 `S` và 1 `G`, `startDir` là `N/E/S/W`, `goal.collectAll: true` cần ít nhất 1 `b`, `goal.items` (P2-11c: `{ kind: 'key' | 'friend'; at: [r, c] }[]`, ≥ 1) mỗi vật phẩm nằm trên một ô `.` (không tường, không `S`/`G`/`b`), không trùng nhau, không có khóa lạ. Schema **không** kiểm `G` có tới được không; việc đó do luật 9 của `content:check` (lời giải phải thắng). Bản đồ không bắt buộc có viền `#`: đi ra ngoài mép cũng là `HIT_WALL`, nên `MazeStage` (P1-04) phải vẽ viền tường quanh bản đồ để bé thấy được chỗ đâm.

### 1.3 Event của `robotlab` (P3-01a/b, ADR-0021)
Type: `RobotLabEvent` export từ `@codequest/games` (`packages/games/src/robotlab/events.ts`). Ô `[r, c]`, hướng `N/E/S/W` như maze. Mọi event hành động mang `t` = `elapsed` (giây) **sau** hành động, để sân chơi chạy đồng hồ mà không đọc state. `index` = chỉ số cố định của khối (`startHolding` là 0 nếu có, rồi `config.blocks`).

| Event | Trường | Ý nghĩa cho sân chơi |
|---|---|---|
| `move` | `from`, `to`, `dir`, `t` | Đi **một** ngã tư (`tiến 3 ô` = 3 event `move`, dừng một nhịp ở từng ngã tư) |
| `turn` | `from`, `to`, `t` | Quay 90° tại chỗ |
| `bump` | `at`, `dir`, `into: 'offLine' \| 'block'` | Đứng ở `at` không đi tiếp được: không có line (`OFF_LINE`) hoặc khối chắn (`HIT_BLOCK`). Không có `move` đi trước; crash |
| `grab` | `at`, `block`, `index`, `t` | Gắp khối `index` ở ngã tư Bíp đứng |
| `release` | `at`, `block`, `index`, `result`, `t` | Thả: `placed` (nằm ở `at`), `contained` (rào trên `Z`), `neutralized` (đúng trạm), `retrieved` (khối biến vào phòng) |
| `gripFail` | `at`, `reason` | Gắp / thả không được (`NOTHING_TO_GRAB`, `HANDS_FULL`, `HANDS_EMPTY`, `CELL_TAKEN`, `WRONG_PLACE`, `WRONG_COLOR`); crash |
| `timeUp` | `at`, `t` | Hành động kế sẽ vượt `timeLimit`: Bíp dừng ở `at`, đồng hồ đỏ |

**Không có event `win`**: robotlab chấm khi hết chương trình (ADR-0021), sân chơi diễn ăn mừng / bảng điểm trong `finish(outcome)`. Câu hỏi (`lineAhead`, `blockColor`, `atLab`, `holding`) chỉ qua `ctx.sense`, không tốn giờ. Thứ tự cố định của mọi hành động: kiểm ô → kiểm giờ → làm (`game-kinds.md` §3.3). Config vào `createState`, `AnswerPicture` và factory của sân chơi phải là config **đã gộp** luật chung (`resolveLevelConfigs` / `resolveRobotlabRules`, `content-model.md` §3).

`predictAnswer`: `missions` → `win` · `stop@r,c` · `crash:<REASON>@r,c` · `outOfTime@r,c` · `timeout`; `score` → `score:<điểm>` · `crash:…` · `timeout`.

## 2. Nửa hiển thị: `StageRenderer`
Interface định nghĩa trong `apps/web/src/stages/types.ts`:

```ts
export interface StageRenderer<E extends GameEvent> {
  /** Đưa về trạng thái ban đầu, không tải lại asset. */
  reset(): void;
  /** Diễn một event. Xong khi diễn xong, hoặc ngay khi signal abort. `next`: event kế tiếp cùng khối (vd `fall` sau `jump`). */
  play(event: E, signal: AbortSignal, next?: E): Promise<void>;
  /** Thời lượng ước tính (ms) ở speed 1, dùng cho thanh tua. */
  estimate(event: E): number;
  /** Nhân vật đứng yên (giữa các bước, cuối lượt chưa xong). */
  rest(): void;
  /** Giữ nguyên khung hình hiện tại (lúc khối kế tiếp đang sáng). */
  hold(): void;
  /** Đổi kích thước khung (ResizeObserver). */
  resize(width: number, height: number): void;
  destroy(): void;
  /** Tùy chọn: gọi đúng một lần sau event cuối của lượt chạy (sau rest() nếu lượt chưa xong); không gọi khi abort/Làm lại, không gọi giữa các bước. */
  finish?(outcome: RunOutcome<E>): void;
}
```
Helper dùng chung cho renderer: `tween` (`stages/types.ts`), `reducedMotion()` (`stages/motion.ts`, bỏ chuyển động trang trí như rung sân khi máy bật giảm chuyển động).
Renderer dựng cảnh trong constructor (nhận `app`, `config`, asset). Không có tham số `speed`: tốc độ là `ticker.speed` của đồng hồ chung, renderer chỉ đo thời gian bằng `ticker.deltaMS` (helper `tween` trong `stages/types.ts`). Hình đáp án của mode `predict` không nằm trong renderer: mỗi kiểu game thêm một hình SVG tĩnh trong `stages/AnswerPicture.tsx` (stage-rendering.md §4). Bản runner: `stages/runner/RunnerStage.ts`, hình học thuần trong `stages/runner/layout.ts`.
`StageController` chung (`apps/web/src/stages/StageController.ts`) giữ `PIXI.Application`, chạy event log tuần tự, báo highlight qua callback `onHighlight(event.blockId)`, xử lý tốc độ / tạm dừng / từng bước / dừng bằng `AbortSignal`. Renderer của từng kiểu game chỉ lo vẽ. Mọi chuyển động phải chạy trên `app.ticker` (helper `tween`, sprite `autoUpdate: false`) và dừng khi `signal` abort, nếu không tạm dừng / Làm lại sẽ không dừng được nó.

**Stage registry** (`apps/web/src/stages/registry.ts`), màn chơi chọn renderer theo `level.kind`:
```ts
export interface StageHooks { onAnimation?: PandaAnimationListener }
export type StageFactory = (app: Application, config: unknown, hooks: StageHooks) => StageRenderer<GameEvent>;
export interface StageKind {
  background: string;                  // màu nền canvas (token trong ui/tokens.ts)
  prepare(): Promise<StageFactory>;    // nạp texture (PIXI.Assets cache), trả factory; factory parse config bằng configSchema
}
export const stageKinds: Partial<Record<GameKindId, StageKind>>;   // { runner, maze }
export function getStageKind(kind: GameKindId): StageKind | undefined;
```
Chạy chương trình cũng chung cho mọi kiểu game: `features/play/run.ts` `runProgram(level, workspace)` lấy kiểu game qua `getGameKind(level.kind)`.

## 3. Đăng ký một kiểu game mới
Từng bước ở `docs/playbooks/add-game-kind.md`. Tóm tắt:
1. Thêm id vào `GameKindId` (`packages/content-schema`).
2. Tạo `packages/games/src/<kind>/` theo cấu trúc trên, đăng ký vào registry.
3. Tạo `apps/web/src/stages/<kind>/`, đăng ký vào `stageKinds` (`stages/registry.ts`).
4. Thêm category màu (nếu có) vào theme.
5. Viết ≥ 3 màn mẫu trong `content/` + chạy `content:check`.
6. Cập nhật `docs/product/game-kinds.md`.

## 4. Điều kiện để vét cạn `par` được (`@codequest/validator`)
`npm run par` và nút "Tìm `par` nhỏ nhất" của level editor không chạy js-interpreter cho từng chương trình. Chúng ghi lại các lệnh gọi API của từng khối lệnh (chạy khối một mình bằng `runLevel`), rồi phát lại trên `createState` / `createApi` / `evaluate` thật, gộp các trạng thái giống nhau. Vì vậy một kiểu game phải giữ các điều kiện sau (ADR-0015):
1. **Khối lệnh (statement) không đọc cảm biến:** generator của khối lệnh chỉ gọi API của khối lệnh, không gọi API của khối giá trị (`output`). Vi phạm → khối bị báo `not searched`.
1b. **Cảm biến (P2-11, ADR-0018):** khối giá trị gọi đúng **một** API cảm biến, trả boolean, không đổi state, không phụ thuộc block id. Vét cạn ghi lời gọi đó (trong một `cq_if`) rồi hỏi API thật trên bản sao trạng thái, nhớ theo (trạng thái, cảm biến). Gọi nhiều API hoặc không phải API cảm biến → `not searched`; trả không phải boolean, đổi state, `stop` → cả màn ⚠ `unsearchable`.
2. **`blockId` không vào state:** id khối chỉ được dùng cho event. Trạng thái sau một lệnh không được phụ thuộc id (validator kiểm bằng cách ghi khối dưới hai id khác nhau). Vi phạm → khối bị báo `not searched`.
3. **API không dùng `ctx.rng`:** ngẫu nhiên chỉ được dùng trong `createState`. Vi phạm → cả màn báo ⚠ `unsearchable`.
4. **State là dữ liệu thuần:** object, mảng, `Set`, `Map`, số, chuỗi, boolean (`structuredClone` sao được và so sánh được bằng nội dung). Không có hàm, class instance hay tham chiếu vòng.
5. `maxSteps` / `maxActions` chỉ được kiểm ở bước chạy lại ví dụ bằng `runLevel`; lệch thì báo ✖ `runLevel disagrees`.
6. **Mục tiêu sao chỉ đọc state** (P2-21): `checkStarGoal` chỉ dựa vào trạng thái cuối và config, nên vét cạn chấm được trạng thái phát lại. Thông tin cần cho mục tiêu phải nằm trong state. Đừng thêm bộ đếm tăng mãi (số bước, số lần đá…) vào state chỉ để chấm: mỗi giá trị đếm là một trạng thái mới, vét cạn mất khả năng gộp trạng thái và chậm theo cấp số nhân. Mục tiêu kiểu "≤ N bước" cần cách tìm riêng (ADR-0017).
7. **Ô số và đồng hồ (P3-01b, ADR-0021):** ô `field_number` số nguyên có `min`/`max` (≤ 9 giá trị) mà toolbox không ghim được thử mọi giá trị như ô chọn. Kiểu game có luật chung (robotlab) được tìm trên level đã gộp (`resolveLevelConfigs`). Bộ đếm cần cho luật chơi (đồng hồ `elapsed` của robotlab) **được** nằm trong state; đo trước khi lo: ba màn mẫu robotlab chỉ vài trăm trạng thái.
