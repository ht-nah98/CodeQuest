# Runtime engine

Nguồn chuẩn cho: cách một chương trình của bé được phân tích, biên dịch, chạy, cắt giới hạn và trả kết quả. Code: `packages/engine/src/`.

## 1. Tổng quan pipeline

```
workspace JSON ─▶ normalizeIds ─▶ analyze ─▶ compile ─▶ interpret (sandbox) ─▶ evaluate ─▶ RunOutcome
                                  │           │            │                      │
                                  │           │            └─ GameKind.api ghi GameEvent vào log
                                  │           └─ generator riêng của engine (§3) + STATEMENT_PREFIX
                                  └─ đếm khối, khối rời, chương trình rỗng
```
Hàm công khai chính:
```ts
// packages/engine/src/run/runLevel.ts
export function runLevel<C, S, E extends GameEvent>(input: {
  kind: GameKindDefinition<C, S, E>;
  level: Level;                         // từ content-schema
  workspace: WorkspaceJson;             // Blockly serialization JSON
  seed?: number;                        // mặc định: hash(level.id)
}): RunOutcome<E>;
```
`runLevel` **đồng bộ**, **thuần** (không I/O), chạy được trên Node và trình duyệt. Lần đầu gặp một kiểu game, `runLevel` gọi `registerBlockSpecs(kind.blocks)` (idempotent) để định nghĩa khối + generator; khối chung `cq_start`, `cq_repeat` được engine tự đăng ký. Nhờ vậy test, tools và web không phải nhớ bước đăng ký.

## 2. Phân tích workspace (`analyzeWorkspace`)
Nạp JSON vào một `Blockly.Workspace` headless rồi trả về:
```ts
interface WorkspaceAnalysis {
  startBlockId: string | null;      // khối 'cq_start' ("khi bắt đầu")
  programBlockIds: string[];        // các khối nối (trực tiếp/gián tiếp) vào cq_start
  orphanBlockIds: string[];         // khối rời
  blocksUsed: number;               // số khối trong chương trình, KHÔNG tính cq_start và shadow block
  blockTypesUsed: Record<string, number>;
  topBlockCount: number;
}
```
Quy tắc:
- Mỗi workspace có đúng **một** `cq_start`, không xóa được (`deletable: false`).
- Khối rời **không chạy** (UI làm xám bằng `Blockly.Events.disableOrphans`) và **không** gây thua. Chúng chỉ kích hoạt gợi ý `DISCONNECTED_BLOCKS`.
- `blocksUsed` là con số dùng cho `maxBlocks`, `par`, sao ⭐⭐. Shadow block (vd ô số trong "lặp 3 lần") không tính.
- Block thiếu `id` được gán id theo vị trí bằng hàm thuần `normalizeIds` (export từ engine) trước khi nạp: `b0`, `b0.n` (khối `next`), `b0.DO` (khối trong input `DO`), `b0.TIMES.s` (shadow); trùng id có sẵn thì thêm `_2`, `_3`… Lý do: Blockly tự sinh id bằng `Math.random`, làm event log không tất định và làm highlight của engine lệch với workspace của UI. **Web phải gọi cùng hàm này** khi nạp nội dung vào Blockly. Nội dung trong `content/` vẫn bắt buộc có id cho mọi khối (`content-model.md` §3).
- Định nghĩa hàm ở gốc (`procedures_defnoreturn`, `procedures_defreturn`) thuộc chương trình: các khối của nó được tính vào `blocksUsed`, có trong `programBlockIds` (sau các khối dưới `cq_start`), **không** nằm trong `orphanBlockIds`, và được biên dịch cùng chương trình.
- Chương trình rỗng (không có khối nào nối dưới `cq_start`, kể cả khi có định nghĩa hàm) → trả ngay `{ result: 'error', reasonCode: 'EMPTY_PROGRAM' }`, không chạy. Workspace không có `cq_start` cũng tính là rỗng. Nếu có hơn một `cq_start`, khối đầu tiên là chương trình, các khối còn lại tính là khối rời.
- `DISCONNECTED_BLOCKS` **không** phải kết quả chạy. Nó là mã cho gợi ý (hint engine dùng `analysis.orphanBlockIds`).
- `blocksUsed > level.maxBlocks` → không chạy, trả `{ result: 'error', reasonCode: 'TOO_MANY_BLOCKS' }`. Bình thường UI đã chặn việc này bằng tùy chọn `maxBlocks` của Blockly; đây là lớp bảo vệ thứ hai.

## 3. Biên dịch (`compileProgram`)
- Dùng generator riêng của engine (xem các gạch đầu dòng dưới), chỉ sinh code từ `cq_start` trở xuống và từ các định nghĩa hàm ở gốc (không dùng `workspaceToCode`, vì hàm đó sinh cả khối rời). Trình tự bắt buộc (đã chạy thử):
  ```ts
  gen.init(ws);                                   // khởi tạo nameDB_, nếu thiếu sẽ lỗi khi đặt tên biến
  for (const def of procedureDefinitions) gen.blockToCode(def);   // lưu code hàm cho finish()
  let code = gen.blockToCode(ws.getBlockById(startId)!);
  if (Array.isArray(code)) code = code[0];
  code = gen.finish(code);                        // thêm khai báo biến/hàm
  ```
- `STATEMENT_PREFIX = '__hl(%1);\n'` → trước mỗi câu lệnh có một lời gọi highlight mang block id. Kết quả là event `{ type: 'highlight', blockId }` cho cả khối lặp lẫn khối điều kiện (khối lặp được highlight lại ở cuối mỗi vòng; `cq_start` cũng có một highlight đầu tiên).
- Engine dùng **generator riêng** (`packages/engine/src/blocks/generator.ts`): một instance con của `JavascriptGenerator`, chép `forBlock` của `javascriptGenerator`, để `STATEMENT_PREFIX` và reserved words không lan sang web. Instance này ghi đè `injectId`: bản gốc của Blockly 13.3.0 chỉ bọc id trong `'…'` **không escape**, nên id chứa `'` hoặc `\` sinh code lỗi cú pháp (đã kiểm 02/10/2026). Bản ghi đè dùng `quote_(block.id)`.
- Generator riêng còn: (1) dùng **danh sách reserved words cố định** (từ khóa JS + biến toàn cục của js-interpreter + `__hl`) thay cho mặc định của Blockly (mặc định thêm mọi biến toàn cục của môi trường chạy, nên Node và trình duyệt sinh code khác nhau); (2) **dựng lại `nameDB_` mỗi lần `init`**, vì `Names.reset()` của Blockly 13.3.0 không đọc lại reserved words, nên tên API đăng ký sau lần biên dịch đầu sẽ không được giữ chỗ.
- Generator của khối kiểu game gọi API theo mẫu `walk(<id>);`, trong đó **id luôn được quote bằng `gen.quote_(block.id)`** (`gen` là generator được truyền vào). Không ghép chuỗi `'${id}'` bằng tay: block id của Blockly có thể chứa ký tự đặc biệt.
- Tên API của các kiểu game phải được thêm vào `addReservedWords`, để biến của bé không trùng tên. `registerBlockSpecs` tự làm việc này từ `BlockSpec.apiNames`; vd khi kiểu game có API `walk`, biến tên `walk` của bé được sinh thành `walk2` (có test, kể cả khi kiểu game được đăng ký sau lần biên dịch đầu).
- Khối điều khiển: **lặp dùng khối riêng `cq_repeat`** (số lần là field trong khối, không có shadow, xem `blockly-integration.md` §5). Các khối khác dùng khối có sẵn của Blockly (`controls_if`, `controls_whileUntil`, `logic_*`, `variables_*`, `procedures_*`), đổi màu bằng theme. Generator của `cq_repeat` lấy tên biến đếm bằng `gen.nameDB_.getDistinctName('count', Blockly.Names.NameType.VARIABLE)`.

Đã kiểm chứng ngày 01/10/2026: Blockly 13.3.0 + js-interpreter 6.0.2 chạy headless trên Node 22, sinh code có `STATEMENT_PREFIX` và gọi native function đúng thứ tự.

## 4. Sandbox (`js-interpreter`)
```ts
const interpreter = new Interpreter(code, (it, globalObj) => {
  for (const [name, fn] of Object.entries(api)) {
    it.setProperty(globalObj, name, it.createNativeFunction((...args) => fn(...args.map(toNative))));
  }
});
```
- API của kiểu game chỉ nhận **string, number, boolean** và chỉ trả string, number, boolean hoặc không trả gì. Tham số khác, **kể cả `undefined`** (vd ô giá trị để trống), hoặc giá trị trả về là object → `INTERNAL_ERROR` (cách xử lý ô trống đang chờ huấn luyện viên quyết). `runLevel` cũng báo `INTERNAL_ERROR` nếu `createApi` thiếu một hàm có trong `apiNames` của khối.
- Interpreter đặt `REGEXP_MODE = 1` (RegExp gốc). Mặc định (2) chạy RegExp trong Web Worker khi có `Worker`, làm interpreter tạm dừng (ASYNC) và mỗi `step()` chỉ quay vòng tới `maxSteps` → `timeout` giả trên trình duyệt, trong khi Node vẫn thắng. Khối chữ của Blockly chỉ tạo mẫu tĩnh đã escape, bé không gõ được RegExp, nên dùng RegExp gốc là an toàn. Nếu interpreter vẫn rơi vào trạng thái ASYNC thì trả `INTERNAL_ERROR` ngay, không quay vòng.
- `interpreter.step()` của js-interpreter có gọi `Date.now()` nội bộ, nhưng chỉ để giới hạn thời gian chạy polyfill trong một bước (polyfill chạy xong trong constructor). Số bước và kết quả không phụ thuộc đồng hồ.
- `runLevel` gọi `Blockly.Events.disable()` trong lúc nạp workspace headless (đồng bộ, bật lại ngay trong `finally`). Trên trình duyệt, việc này dùng chung bộ đếm sự kiện toàn cục của Blockly với workspace có hiển thị, nhưng vì `runLevel` đồng bộ nên không có sự kiện nào của UI bị nuốt.
- File `js-interpreter` có `require("vm")` (chỉ dùng cho REGEXP_MODE 2 trên Node). Với `REGEXP_MODE = 1` nhánh này không chạy; nếu Vite cảnh báo khi đóng gói thì đánh dấu `vm` là external.
- **Giới hạn:**

| Giới hạn | Mặc định | Ghi đè | Khi vượt |
|---|---|---|---|
| `maxSteps` (bước interpreter) | 100 000 | `level.limits.maxSteps` | `timeout` / `TIMEOUT` |
| `maxActions` (số GameEvent không phải highlight) | 1 000 | `level.limits.maxActions` | `timeout` / `TIMEOUT` |

Chương trình chạy đúng `maxSteps` bước mà chưa xong thì là `timeout` (`stats.steps = maxSteps`). Event thứ `maxActions + 1` không được ghi; log có đúng `maxActions` event hành động.

- **Dừng sớm:** khi mô phỏng gặp va chạm hoặc thắng giữa chừng, API gọi `ctx.stop(result, reasonCode)`. Hàm này ném `StopSignal` (một class riêng của engine). `runLevel` bắt `StopSignal` bên ngoài vòng `interpreter.step()`. Lỗi khác bị bắt → `result: 'error'`, `reasonCode: 'INTERNAL_ERROR'`, kèm thông tin để debug.
- Chạy trên **main thread**. Màn thông thường mất < 20 ms. Nếu đo được > 50 ms thì chuyển sang Web Worker (làm được vì engine không đụng DOM).
- Sau khi tạo interpreter, engine **thay `Math.random` bên trong sandbox** bằng `ctx.rng` (ghi đè thuộc tính `random` của object `Math` của interpreter), để lỡ có khối `math_random_*` thì kết quả vẫn tất định.

## 5. SimContext: thứ kiểu game nhận được
```ts
interface SimContext<S, E extends GameEvent> {
  state: S;                                       // trạng thái có thể đổi của lượt chạy
  emit(event: DistributiveOmit<E, 'blockId'>, blockId: string | null): void;  // ghi vào log, tăng bộ đếm action
  stop(result: 'success'): never;
  stop(result: 'crash' | 'incomplete', reasonCode: ReasonCode): never;
  rng: () => number;                              // [0,1), có seed (mulberry32)
  readonly level: Level;
}
```

## 6. Tất định (bắt buộc)
- Trong **toàn bộ** `packages/games/src/**` và `packages/engine/src/**` (trừ file `*.test.ts`) **cấm** dùng `Math.random`, `Date`, `performance`, `setTimeout` (ESLint `no-restricted-properties` / `no-restricted-globals`).
- Mọi ngẫu nhiên đi qua `ctx.rng`. Seed mặc định = hash FNV-1a của `level.id`. Đề ngẫu nhiên của robotlab lấy seed từ `level.config.seed` hoặc do người chơi bấm "Đề mới".
- Cùng `(kind, level, workspace, seed)` ⇒ cùng `RunOutcome`, từng byte giống nhau. Có test snapshot cho điều này.

## 7. Kết quả
```ts
type RunResult = 'success' | 'incomplete' | 'crash' | 'timeout' | 'error';

interface RunOutcome<E extends GameEvent = GameEvent> {
  result: RunResult;
  reasonCode: ReasonCode | null;        // null khi success
  events: ReadonlyArray<E | HighlightEvent>;
  stats: { steps: number; actions: number; blocksUsed: number };
  answerKey?: string;                   // cho mode predict (xem §8)
  edits?: number;                       // cho mode bughunt (xem §8, §9)
  debug?: { message: string };          // chỉ khi result = 'error'
  goals?: boolean[];                    // chỉ màn có `starGoals` (P2-21, ADR-0017): mỗi mục tiêu đạt chưa, đạt khi đạt trên MỌI bản đồ
  maps?: MapOutcome<E>[];               // chỉ màn có `variants` (§7.1)
  mapIndex?: number;                    // chỉ màn có `variants`: bản đồ quyết định kết quả
  // Lỗi ném ra từ predictAnswer hoặc editDistance cũng thành result 'error' / INTERNAL_ERROR.
}
type MapOutcome<E> = Pick<RunOutcome<E>, 'result' | 'reasonCode' | 'events' | 'stats' | 'debug' | 'goals'>;
```
**Mục tiêu sao** (`goals`, P2-21, ADR-0017): chỉ có khi màn khai báo `starGoals` và chương trình đã chạy (không có ở `error` của chương trình rỗng / quá số khối). Mỗi bản đồ: `kind.checkStarGoal(goal, trạng thái cuối, config)` cho từng mục tiêu theo thứ tự `starGoals`; kiểu game không có `checkStarGoal` thì mọi mục tiêu `false`; `checkStarGoal` ném lỗi thì `INTERNAL_ERROR`. Cấp màn: mục tiêu đạt khi đạt trên **mọi** bản đồ. Xét trên trạng thái cuối bất kể kết quả; phần thưởng chỉ tính khi thắng. Mục tiêu **không bao giờ** đổi `result`.
| result | Khi nào | Ví dụ reasonCode |
|---|---|---|
| `success` | `evaluate` trả thành công, hoặc `ctx.stop('success')` | — |
| `incomplete` | Chương trình chạy hết nhưng `evaluate` báo chưa đạt, hoặc mô phỏng gọi `ctx.stop('incomplete', …)` (vd tới cờ khi còn măng) | `NOT_AT_GOAL`, `MISSED_ITEMS` |
| `crash` | Mô phỏng dừng vì va chạm | `HIT_WALL`, `FELL_IN_HOLE`, `HIT_BRANCH`, `HIT_CRATE` |
| `timeout` | Vượt `maxSteps` / `maxActions` | `TIMEOUT` |
| `error` | Chương trình rỗng, quá số khối, lỗi nội bộ | `EMPTY_PROGRAM`, `TOO_MANY_BLOCKS`, `INTERNAL_ERROR` |

`ReasonCode` là `string` (khai báo trong `@codequest/content-schema/runtime`), không phải union đóng, vì engine không biết trước các kiểu game. Mã chung của engine là hằng số `ENGINE_REASONS = ['EMPTY_PROGRAM', 'TOO_MANY_BLOCKS', 'TIMEOUT', 'INTERNAL_ERROR']`; mã của kiểu game nằm trong `GameKindDefinition.reasonCodes`. **Nguồn duy nhất** của câu tiếng Việt là `content/shared/feedback.json`; `content:check` (luật 17) đảm bảo mọi mã đều có câu.

### 7.1 Màn nhiều bản đồ (`variants`, P2-12, ADR-0016)
- Bản đồ theo thứ tự: `config` (bản đồ 1), rồi từng phần tử của `level.variants`. Config nào không hợp `configSchema` thì cả lượt chạy là `error` / `INTERNAL_ERROR` (`debug`: `variants[i]: …`), không chạy gì.
- Chương trình được phân tích, kiểm số khối và **biên dịch một lần** (`EMPTY_PROGRAM`, `TOO_MANY_BLOCKS` không có `maps`). Sau đó chạy trên **từng** bản đồ như một màn riêng: state mới, `rng` mới cùng seed, event log riêng, `maxSteps` / `maxActions` tính riêng; `ctx.level.config` là config của bản đồ đó. Mọi bản đồ đều được chạy (trừ khi một bản đồ gặp lỗi nội bộ thì dừng ở đó).
- `mapIndex` = bản đồ **đầu tiên không thắng**, hoặc bản đồ cuối khi thắng hết. `result`, `reasonCode`, `events`, `stats` (và `debug`) ở cấp trên **là của `maps[mapIndex]`**, nên rewards (thắng = thắng mọi bản đồ), gợi ý `lastReason` và khối bị lắc không cần biết có nhiều bản đồ. `answerKey` lấy từ trạng thái cuối của bản đồ quyết định; `edits` (bughunt) tính một lần.
- Màn một bản đồ: không có `maps`, `mapIndex`; kết quả y hệt trước P2-12 (snapshot cũ không đổi). Tất định: cùng đầu vào ⇒ cùng `maps` (test snapshot `multiMap.test.ts`).
- Phát lại ở web: `features/play/run.ts` `mapReplays(outcome)` cho danh sách bản đồ cần phát (mọi bản đồ tới `mapIndex`); `StageController.showMap(config)` đổi cảnh trong cùng ứng dụng PIXI rồi `play(maps[i])` (`stage-rendering.md`).

## 8. Theo từng cách chơi
| Mode | Engine làm gì thêm |
|---|---|
| `build`, `parsons` | Như trên |
| `predict` | Chạy `level.initialWorkspace`. `answerKey = kind.predictAnswer(state, { result, reasonCode })` (vd `"stop@5"`, `"crash:HIT_WALL@3,2"`). UI so lựa chọn của bé với `answerKey` |
| `bughunt` | Ngoài kết quả chạy, tính `outcome.edits = editDistance(level.initialWorkspace, workspace)` (§9) |
| `creative` | Chạy bình thường nhưng **bỏ qua `evaluate`**: chương trình chạy hết thì `success`. Nếu mô phỏng gọi `ctx.stop('crash', …)` hoặc `ctx.stop('incomplete', …)`, hoặc quá giới hạn, thì vẫn trả `crash` / `incomplete` / `timeout` để sân chơi diễn đúng (đang chờ huấn luyện viên xác nhận) |

## 9. Khoảng cách sửa (`editDistance`) cho `bughunt`
- Duyệt chương trình (từ `cq_start`) theo thứ tự trước (pre-order) thành chuỗi token `"<depth>|<tên input chứa khối>|<type>|<fields JSON đã sắp key>|<mutation JSON>"`. Tên input (vd `DO`, `DO0`, `ELSE`) giúp phân biệt nhánh nếu / nếu-không; mutation phân biệt số nhánh của `controls_if`.
- `edits` = khoảng cách Levenshtein giữa hai chuỗi token (chèn = xóa = thay = 1). Chuỗi khối tiếp nối (`next`) có cùng độ sâu và cùng tên input với khối đầu chuỗi; chuỗi ngay dưới `cq_start` có độ sâu 0 và tên input rỗng. Ô shadow được tính như khối (nếu không có khối thật cắm vào), nên đổi số trong `controls_repeat_ext` cũng = 1. Hàm làm việc trên JSON, không cần Blockly.
- Ví dụ: đổi số lặp 3 → 2 = 1; thêm 1 khối = 1; đổi chỗ 2 khối liền nhau = 2.
- `level.parEdits` phải ≥ `editDistance(initialWorkspace, solution)`. `content:check` kiểm tra điều này.

## 10. Phát lại (ở `apps/web`, không thuộc engine)
Engine chỉ trả event **logic**, không có thời lượng. `StageController` của web quyết định mỗi event diễn bao lâu (theo tốc độ đang chọn), tô sáng `blockId` bằng `workspace.highlightBlock(id)`, hỗ trợ chạy / tạm dừng / từng bước / tua về đầu. Xem `stage-rendering.md`.

Tốc độ do bé chọn: 0,5× · 1× · 2×. Khi lượt chạy **thua**, tốc độ phát lại tối đa là 1× (chọn 2× thì vẫn phát 1×) để bé kịp nhìn chỗ sai.
