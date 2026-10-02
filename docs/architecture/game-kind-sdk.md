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
  arrive(ctx, to, id);   // hố → fall; măng → collect; cờ → win (success) hoặc missed (MISSED_ITEMS)
}
```

### Luật cho nửa headless
1. Không DOM, không thời gian, không ngẫu nhiên ngoài `rng` (xem `runtime-engine.md` §6). Áp dụng cho **toàn bộ** `packages/games/src/**`.
2. `GameEvent` là **dữ liệu thuần**, serialize JSON được, đủ để vẽ lại mà không cần đọc `state`.
3. Mỗi event hành động mang `blockId` của khối gây ra nó.
4. Va chạm phải emit một event thất bại **trước** khi `stop`, để sân chơi diễn được cảnh ngã/đâm.
5. Mọi `reasonCode` mới phải được liệt kê trong `reasonCodes` **và** có câu tiếng Việt trong `content/shared/feedback.json`.

### 1.1 Event của `runner` (P0-07, đủ luật ở P1-01)
Type: `RunnerEvent` export từ `@codequest/games` (`packages/games/src/runner/events.ts`), kèm `RunnerObstacle` (`'branch' | 'crate'`), `RunnerMove` (`'walk' | 'crouch' | 'jump'`), `RUNNER_AHEAD_KINDS`. Mọi event có `blockId` của khối gây ra nó; engine chèn thêm `highlight` trước mỗi câu lệnh. Luật đầy đủ: `product/game-kinds.md` §3.1.

| Event | Trường | Ý nghĩa cho sân chơi |
|---|---|---|
| `walk` | `from`, `to` (= from+1) | Đi sang ô kế |
| `crouch` | `from`, `to` (= from+1) | Cúi người đi sang ô kế (chui dưới cành nếu ô `to` là `branch`) |
| `jump` | `from`, `to` (= from+2) | Nhảy vòng cung qua ô from+1, tiếp đất ở `to` |
| `kick` | `at` (= ô Măng + 1), `hit` | Măng đá ô `at`, **đứng yên**. `hit: true`: thùng đổ, từ đây ô `at` là `ground`. `hit: false`: đá hụt, không thua |
| `collect` | `at` | Nhặt măng ở ô `at` (ô Măng vừa dừng). Đi ngay sau `walk`/`crouch`/`jump` có `to = at`, cùng `blockId`. Bay qua măng thì không nhặt |
| `fall` | `at` | Rơi xuống hố ở ô `at`. Luôn đi **ngay sau** `walk`/`crouch`/`jump` có `to = at`, cùng `blockId`; lượt chạy kết thúc `crash` / `FELL_IN_HOLE` |
| `bump` | `from`, `at`, `obstacle`, `move` | Măng đang `move` từ `from` thì va `obstacle` ở ô `at` và **vẫn ở `from`** (bật lại). **Không** có `walk`/`crouch`/`jump` đi trước. Với `move: 'jump'`: `at = from+1` là va giữa không trung, `at = from+2` là va lúc tiếp đất. Lượt chạy kết thúc `crash` / `HIT_BRANCH` (`obstacle: 'branch'`) hoặc `HIT_CRATE` (`'crate'`) |
| `offTrack` | `from` | Nhảy từ `from` ra khỏi cuối đường (đứng ở ô áp chót mà nhảy, kể cả bay qua cờ). **Không** có `jump` đi trước; lượt chạy kết thúc `crash` / `OFF_TRACK` |
| `win` | `at` | Đứng trên cờ ở ô `at`: ăn mừng. Đi ngay sau `walk`/`crouch`/`jump` tới cờ, cùng `blockId`; lượt chạy kết thúc `success` |
| `missed` | `at`, `left` | Tới cờ ở ô `at` nhưng `goal.collectAll` và còn măng ở các ô `left` (tăng dần): Măng tiếc, măng còn lại nhấp nháy. Thay cho `win`; lượt chạy kết thúc `incomplete` / `MISSED_ITEMS` |

Thứ tự trong một khối: kiểm tra chướng ngại (`bump` / `offTrack`) → di chuyển (`walk`/`crouch`/`jump`) → `fall` **hoặc** `collect` → `win` / `missed`. Nhảy: xét ô bay qua trước, rồi tới cuối đường, rồi ô tiếp đất (cành ở ô bay qua + hố ở ô tiếp đất → `HIT_BRANCH`). Cảm biến `isAhead` không emit event (chỉ đọc ô from+1; ô ngoài đường → `false`); khối `controls_if` chứa nó được highlight như mọi câu lệnh.

Hết chương trình mà chưa tới cờ: không có event riêng, lượt chạy kết thúc `incomplete` / `NOT_AT_GOAL` (sân chơi giữ Măng đứng ở ô cuối cùng). Khối gây lỗi để rung = `blockId` của event cuối cùng.

Config: `cells` (`ground`/`hole`/`branch`/`crate`/`flag`), `start`, `bamboo?: number[]` (ô `ground`/`branch`, nằm **sau** `start`, không trùng), `goal?: { collectAll?: boolean }` (`collectAll: true` cần ≥ 1 măng). `RUNNER_AHEAD_KINDS` nằm ở `config.ts`. `state.cells` là bản sao vì thùng bị đá thành `ground`; `level.config` không bị sửa. Khối tạm chỉ có chữ (chưa có `field_image`) vì `apps/web/public/icons/` chưa có icon. Cảm biến `runner_is_ahead` là khối giá trị (`output: 'Boolean'`, `sensor_blocks`), dropdown `KIND` = `HOLE`/`BRANCH`/`CRATE`/`CLEAR` (nhãn hố/cành/thùng/ô trống), generator `isAhead('<KIND>', '<blockId>')`.

`predictAnswer` của runner: `win` · `stop@<ô>` (hết chương trình ở ô đó, `NOT_AT_GOAL`) · `missed@<ô cờ>` (`MISSED_ITEMS`) · `crash:<REASON>@<ô>`. Ô của crash là ô hố (`FELL_IN_HOLE`) hoặc ô chướng ngại bị va (`HIT_BRANCH`/`HIT_CRATE`, tức `bump.at`); với `OFF_TRACK` là **ô Măng nhảy đi** (ô tiếp đất không tồn tại). Kết quả `timeout`/`error` trả đúng tên kết quả (`timeout`, `error`).

### 1.2 Event của `maze` (P1-02)
Type: `MazeEvent` export từ `@codequest/games` (`packages/games/src/maze/events.ts`). Ô viết `[r, c]` (hàng, cột, từ 0, hàng 0 ở trên cùng); hướng là `'N' | 'E' | 'S' | 'W'` (N = lên trên). Mọi event có `blockId` của khối gây ra nó; engine chèn thêm `highlight` trước mỗi câu lệnh (khối cảm biến là khối giá trị nên không có `highlight` riêng và không emit event).

| Event | Trường | Ý nghĩa cho sân chơi |
|---|---|---|
| `move` | `from`, `to`, `dir` | Đi một ô từ `from` sang `to` (kề nhau theo `dir`). Có thể đi vào `.`, `S`, `b`, `G` |
| `turn` | `from`, `to` (hướng) | Quay 90° tại chỗ: rẽ trái N→W→S→E→N, rẽ phải N→E→S→W→N |
| `bump` | `at`, `dir` | Đứng ở `at`, nhìn `dir`, tiến vào tường `#` hoặc ra ngoài bản đồ: đâm rồi đứng lại ở `at`. **Khác runner:** `at` là ô **của Măng**, không phải ô vật cản; ô tường = `at` + một bước theo `dir` (có thể nằm ngoài bản đồ). **Không** có `move` đi trước; lượt chạy kết thúc `crash` / `HIT_WALL` |
| `collect` | `at` | Nhặt măng ở ô `b` tại `at`. Đi **ngay sau** `move` có `to = at`, cùng `blockId`; mỗi ô măng chỉ nhặt một lần. Nhặt cả khi màn không có `goal.collectAll` |
| `win` | `at` | Tới đích `G` ở `at` và đã đủ điều kiện (không `collectAll`, hoặc đã nhặt hết): ăn mừng. Đi **ngay sau** `move` có `to = at` (ô `G` không có măng nên không có `collect` xen giữa), cùng `blockId`; lượt chạy kết thúc `success` **ngay**, các khối sau không chạy |

Tới `G` khi `collectAll` mà còn măng: không có event riêng, `G` như ô thường. Măng còn lại trên sân = các ô `b` của `config.map` trừ các `collect.at` đã diễn (sân chơi tự tính, event không mang số đếm). Hết chương trình: đứng ở `G` mà còn măng → `incomplete` / `MISSED_ITEMS`; không ở `G` → `incomplete` / `NOT_AT_GOAL`. Khối gây lỗi để rung = `blockId` của event cuối cùng.

API trong sandbox: `forward(id)`, `turn('LEFT' | 'RIGHT', id)`, `isPath('AHEAD' | 'LEFT' | 'RIGHT', id)` (ô kề theo hướng tương đối đó nằm trong bản đồ và không phải `#`), `atGoal(id)` (đang đứng ở `G`, bất kể măng). Giá trị lạ → `INTERNAL_ERROR`.

`predictAnswer` của maze: `win` · `stop@r,c` (`NOT_AT_GOAL`) · `missed@r,c` (`MISSED_ITEMS`) · `crash:HIT_WALL@r,c`, với `r,c` là ô Măng đang đứng (khi đâm: ô đứng lúc tiến, vì ô tường không đi vào được), viết không dấu cách, vd `stop@1,2`. Kết quả `timeout`/`error` trả đúng tên kết quả.

Config được kiểm (zod `mazeConfigSchema`): 3–12 hàng × 3–12 cột, các hàng dài bằng nhau, chỉ có ký tự `# . S G b`, đúng 1 `S` và 1 `G`, `startDir` là `N/E/S/W`, `goal.collectAll: true` cần ít nhất 1 `b`, không có khóa lạ. Schema **không** kiểm `G` có tới được không; việc đó do luật 9 của `content:check` (lời giải phải thắng). Bản đồ không bắt buộc có viền `#`: đi ra ngoài mép cũng là `HIT_WALL`, nên `MazeStage` (P1-04) phải vẽ viền tường quanh bản đồ để bé thấy được chỗ đâm.

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
}
```
Renderer dựng cảnh trong constructor (nhận `app`, `config`, asset). Không có tham số `speed`: tốc độ là `ticker.speed` của đồng hồ chung, renderer chỉ đo thời gian bằng `ticker.deltaMS` (helper `tween` trong `stages/types.ts`). `drawAnswer(key, config, canvas)` cho mode `predict` thêm khi làm mode đó. Bản runner: `stages/runner/RunnerStage.ts`, hình học thuần trong `stages/runner/layout.ts`.
`StageController` chung (`apps/web/src/stages/StageController.ts`) giữ `PIXI.Application`, chạy event log tuần tự, báo highlight qua callback `onHighlight(event.blockId)`, xử lý tốc độ / từng bước / dừng bằng `AbortSignal`. Renderer của từng kiểu game chỉ lo vẽ.

## 3. Đăng ký một kiểu game mới
Từng bước ở `docs/playbooks/add-game-kind.md`. Tóm tắt:
1. Thêm id vào `GameKindId` (`packages/content-schema`).
2. Tạo `packages/games/src/<kind>/` theo cấu trúc trên, đăng ký vào registry.
3. Tạo `apps/web/src/stages/<kind>/`, đăng ký vào `stageRegistry`.
4. Thêm category màu (nếu có) vào theme.
5. Viết ≥ 3 màn mẫu trong `content/` + chạy `content:check`.
6. Cập nhật `docs/product/game-kinds.md`.
