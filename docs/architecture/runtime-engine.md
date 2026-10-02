# Runtime engine

Nguồn chuẩn cho: cách một chương trình của bé được phân tích, biên dịch, chạy, cắt giới hạn và trả kết quả. Code: `packages/engine/src/`.

## 1. Tổng quan pipeline

```
workspace JSON ─▶ analyze ─▶ compile ─▶ interpret (sandbox) ─▶ evaluate ─▶ RunOutcome
                   │           │            │                      │
                   │           │            └─ GameKind.api ghi GameEvent vào log
                   │           └─ javascriptGenerator + STATEMENT_PREFIX
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
- Chương trình rỗng (chỉ có `cq_start`) → trả ngay `{ result: 'error', reasonCode: 'EMPTY_PROGRAM' }`, không chạy.
- `DISCONNECTED_BLOCKS` **không** phải kết quả chạy. Nó là mã cho gợi ý (hint engine dùng `analysis.orphanBlockIds`).
- `blocksUsed > level.maxBlocks` → không chạy, trả `{ result: 'error', reasonCode: 'TOO_MANY_BLOCKS' }`. Bình thường UI đã chặn việc này bằng tùy chọn `maxBlocks` của Blockly; đây là lớp bảo vệ thứ hai.

## 3. Biên dịch (`compileProgram`)
- Dùng `javascriptGenerator` từ `blockly/javascript`, chỉ sinh code từ `cq_start` trở xuống (không dùng `workspaceToCode`, vì hàm đó sinh cả khối rời). Trình tự bắt buộc (đã chạy thử):
  ```ts
  gen.init(ws);                                   // khởi tạo nameDB_, nếu thiếu sẽ lỗi khi đặt tên biến
  let code = gen.blockToCode(ws.getBlockById(startId)!);
  if (Array.isArray(code)) code = code[0];
  code = gen.finish(code);                        // thêm khai báo biến/hàm
  ```
- `javascriptGenerator.STATEMENT_PREFIX = '__hl(%1);\n'` → trước mỗi câu lệnh có một lời gọi highlight mang block id. Kết quả là event `{ type: 'highlight', blockId }` cho cả khối lặp lẫn khối điều kiện.
- Generator của khối kiểu game gọi API theo mẫu `walk(<id>);`, trong đó **id luôn được quote bằng `javascriptGenerator.quote_(block.id)`**. Không ghép chuỗi `'${id}'` bằng tay: block id của Blockly có thể chứa ký tự đặc biệt.
- Tên API của các kiểu game phải được thêm vào `addReservedWords`, để biến của bé không trùng tên.
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
- API của kiểu game chỉ nhận và trả **giá trị nguyên thủy** (string, number, boolean). Không trả object.
- **Giới hạn:**

| Giới hạn | Mặc định | Ghi đè | Khi vượt |
|---|---|---|---|
| `maxSteps` (bước interpreter) | 100 000 | `level.limits.maxSteps` | `timeout` / `TIMEOUT` |
| `maxActions` (số GameEvent không phải highlight) | 1 000 | `level.limits.maxActions` | `timeout` / `TIMEOUT` |

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
  debug?: { message: string };          // chỉ khi result = 'error'
}
```
| result | Khi nào | Ví dụ reasonCode |
|---|---|---|
| `success` | `evaluate` trả thành công, hoặc `ctx.stop('success')` | — |
| `incomplete` | Chương trình chạy hết nhưng `evaluate` báo chưa đạt, hoặc mô phỏng gọi `ctx.stop('incomplete', …)` (vd tới cờ khi còn măng) | `NOT_AT_GOAL`, `MISSED_ITEMS` |
| `crash` | Mô phỏng dừng vì va chạm | `HIT_WALL`, `FELL_IN_HOLE`, `HIT_BRANCH`, `HIT_CRATE` |
| `timeout` | Vượt `maxSteps` / `maxActions` | `TIMEOUT` |
| `error` | Chương trình rỗng, quá số khối, lỗi nội bộ | `EMPTY_PROGRAM`, `TOO_MANY_BLOCKS`, `INTERNAL_ERROR` |

`ReasonCode` là `string` (khai báo trong `@codequest/content-schema/runtime`), không phải union đóng, vì engine không biết trước các kiểu game. Mã chung của engine là hằng số `ENGINE_REASONS = ['EMPTY_PROGRAM', 'TOO_MANY_BLOCKS', 'TIMEOUT', 'INTERNAL_ERROR']`; mã của kiểu game nằm trong `GameKindDefinition.reasonCodes`. **Nguồn duy nhất** của câu tiếng Việt là `content/shared/feedback.json`; `content:check` (luật 17) đảm bảo mọi mã đều có câu.

## 8. Theo từng cách chơi
| Mode | Engine làm gì thêm |
|---|---|
| `build`, `parsons` | Như trên |
| `predict` | Chạy `level.initialWorkspace`. `answerKey = kind.predictAnswer(state, { result, reasonCode })` (vd `"stop@5"`, `"crash:HIT_WALL@3,2"`). UI so lựa chọn của bé với `answerKey` |
| `bughunt` | Ngoài kết quả chạy, tính `edits = editDistance(level.initialWorkspace, workspace)` (§9) |
| `creative` | Chạy bình thường nhưng **bỏ qua `evaluate`** (luôn `success`, không chấm) |

## 9. Khoảng cách sửa (`editDistance`) cho `bughunt`
- Duyệt chương trình (từ `cq_start`) theo thứ tự trước (pre-order) thành chuỗi token `"<depth>|<tên input chứa khối>|<type>|<fields JSON đã sắp key>|<mutation JSON>"`. Tên input (vd `DO`, `DO0`, `ELSE`) giúp phân biệt nhánh nếu / nếu-không; mutation phân biệt số nhánh của `controls_if`.
- `edits` = khoảng cách Levenshtein giữa hai chuỗi token (chèn = xóa = thay = 1).
- Ví dụ: đổi số lặp 3 → 2 = 1; thêm 1 khối = 1; đổi chỗ 2 khối liền nhau = 2.
- `level.parEdits` phải ≥ `editDistance(initialWorkspace, solution)`. `content:check` kiểm tra điều này.

## 10. Phát lại (ở `apps/web`, không thuộc engine)
Engine chỉ trả event **logic**, không có thời lượng. `StageController` của web quyết định mỗi event diễn bao lâu (theo tốc độ đang chọn), tô sáng `blockId` bằng `workspace.highlightBlock(id)`, hỗ trợ chạy / tạm dừng / từng bước / tua về đầu. Xem `stage-rendering.md`.

Tốc độ do bé chọn: 0,5× · 1× · 2×. Khi lượt chạy **thua**, tốc độ phát lại tối đa là 1× (chọn 2× thì vẫn phát 1×) để bé kịp nhìn chỗ sai.
