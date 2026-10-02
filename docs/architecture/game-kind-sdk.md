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
  const id = String(blockId), from = s.pos, over = from + 1, to = from + 2;
  // Luật đầy đủ: product/game-kinds.md §3.1, bảng "nhảy"
  if (over >= s.cells.length || to >= s.cells.length) { ctx.emit({ type: 'offTrack', from }, id); ctx.stop('crash', 'OFF_TRACK'); }
  crashIfBlocked(ctx, s, over, id, /* overhead */ true);   // branch/crate ở ô bay qua → crash
  crashIfBlocked(ctx, s, to, id, false);                   // hole/branch/crate ở ô tiếp đất → crash
  ctx.emit({ type: 'jump', from, to }, id);
  s.pos = to;
  collectAt(ctx, s, to, id);
  finishIfOnFlag(ctx, s, id);                              // success, hoặc incomplete MISSED_ITEMS
}
```

### Luật cho nửa headless
1. Không DOM, không thời gian, không ngẫu nhiên ngoài `rng` (xem `runtime-engine.md` §6). Áp dụng cho **toàn bộ** `packages/games/src/**`.
2. `GameEvent` là **dữ liệu thuần**, serialize JSON được, đủ để vẽ lại mà không cần đọc `state`.
3. Mỗi event hành động mang `blockId` của khối gây ra nó.
4. Va chạm phải emit một event thất bại **trước** khi `stop`, để sân chơi diễn được cảnh ngã/đâm.
5. Mọi `reasonCode` mới phải được liệt kê trong `reasonCodes` **và** có câu tiếng Việt trong `content/shared/feedback.json`.

### 1.1 Event của `runner` (đã cài ở P0-07)
Type: `RunnerEvent` export từ `@codequest/games` (`packages/games/src/runner/events.ts`). Mọi event có `blockId` của khối gây ra nó; engine chèn thêm `highlight` trước mỗi câu lệnh.

| Event | Trường | Ý nghĩa cho sân chơi |
|---|---|---|
| `walk` | `from`, `to` (= from+1) | Đi sang ô kế |
| `jump` | `from`, `to` (= from+2) | Nhảy vòng cung qua ô from+1, tiếp đất ở `to` |
| `fall` | `at` | Rơi xuống hố ở ô `at`. Luôn đi **ngay sau** `walk`/`jump` có `to = at`, cùng `blockId`; lượt chạy kết thúc `crash` / `FELL_IN_HOLE` |
| `offTrack` | `from` | Nhảy từ `from` ra khỏi cuối đường (đứng ở ô áp chót mà nhảy, kể cả bay qua cờ). **Không** có `jump` đi trước; lượt chạy kết thúc `crash` / `OFF_TRACK` |
| `win` | `at` | Đứng trên cờ ở ô `at`: ăn mừng. Đi ngay sau `walk`/`jump` tới cờ, cùng `blockId`; lượt chạy kết thúc `success` |

Hết chương trình mà chưa tới cờ: không có event riêng, lượt chạy kết thúc `incomplete` / `NOT_AT_GOAL` (sân chơi giữ Măng đứng ở ô cuối cùng). Khối gây lỗi để rung = `blockId` của event cuối cùng.

Bản P0-07 là bản tối thiểu: ô `ground` / `hole` / `flag`, khối `runner_walk` / `runner_jump`, reason `FELL_IN_HOLE` / `OFF_TRACK` / `NOT_AT_GOAL`. Ô `branch` / `crate`, măng (`bamboo`, `goal.collectAll`), khối cúi / đá / cảm biến và các event `crouch`, `kick`, `collect`, `bump` thêm ở P1-01 theo `product/game-kinds.md` §3.1. Khối tạm chỉ có chữ (chưa có `field_image`) vì `apps/web/public/icons/` chưa có icon.

`predictAnswer` của runner: với `crash:OFF_TRACK@<ô>`, ô là **ô Măng nhảy đi** (ô tiếp đất không tồn tại); với `FELL_IN_HOLE` là ô hố. Kết quả `timeout`/`error` trả đúng tên kết quả (`timeout`, `error`).

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
