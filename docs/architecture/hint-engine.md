# Hint engine

Nguồn chuẩn cho: cú pháp luật gợi ý tầng 0, cách đánh giá, cách hiển thị. Giá và luật mua gợi ý tầng 1–3 nằm ở `docs/product/rewards-economy.md`. Code: `packages/engine/src/hints/`.

## 1. Bốn tầng gợi ý
| Tầng | Nguồn dữ liệu | Ai quyết định hiện |
|---|---|---|
| 0 · tự động | `level.hints[]` (luật `when` → `say`/`point`) + luật chung | Hint engine, theo ngữ cảnh |
| 1 · gợi ý tư duy | `level.thinkingHint` | Bé bấm mua |
| 2 · chỉ bước tiếp | Tính từ `level.solution` (popover, `blockly-integration.md` §8) | Bé bấm mua |
| 3 · xem lời giải | `level.solution` hiển thị chỉ đọc trong lớp phủ | Bé bấm mua |

## 2. Ngữ cảnh đánh giá
```ts
interface HintContext {
  analysis: WorkspaceAnalysis;          // runtime-engine.md §2
  capacityLeft: number;                 // workspace.remainingCapacity()
  lastOutcome: Pick<RunOutcome, 'result' | 'reasonCode'> | null;
  runCount: number;                     // số lượt chạy trong phiên màn
  failStreak: number;                   // số lượt thua liên tiếp (incomplete/crash/timeout; error không tính)
  idleMs: number;                       // thời gian không thao tác
  shownHintIds: ReadonlySet<string>;
  isFirstOfModeInWorld: boolean;        // màn này là màn đầu tiên dùng mode của nó trong thế giới
  seenModes: ReadonlySet<LevelMode>;    // các mode bé đã từng chơi (từ tiến độ)
  trigger: 'enter' | 'change' | 'run-end' | 'idle';
}
```

## 3. Cú pháp luật (`HintRule`)
```ts
interface HintRule {
  id: string;                       // duy nhất trong màn
  when: Condition;
  say: string;                      // ≤ 12 chữ
  point?: Target;                   // mũi tên/vòng sáng chỉ vào đâu
  spotlight?: boolean;              // làm mờ xung quanh target (content-highlight)
  once?: boolean;                   // mặc định true: hiện tối đa 1 lần mỗi phiên màn
  priority?: number;                // mặc định 0; số lớn thắng
}
type Target = `toolbox:${string}` | `block:${string}` | 'run' | 'capacity' | 'stage';
// toolbox:<type> = khối loại đó trong thanh khối · block:<type> = khối loại đó đầu tiên trong vùng ghép (dùng cho parsons/bughunt)

type Condition =
  | { all: Condition[] } | { any: Condition[] } | { not: Condition }
  | AtomicCondition;
interface AtomicCondition {          // các khóa trong một object được AND với nhau
  trigger?: HintContext['trigger'];
  blockCount?: NumCmp;               // analysis.blocksUsed
  topBlockCount?: NumCmp;
  has?: string;                      // có khối type này trong chương trình
  missing?: string;                  // không có khối type này trong chương trình
  orphans?: boolean;                 // có khối rời
  capacityFull?: boolean;
  lastResult?: RunResult;
  lastReason?: string;
  runCount?: NumCmp;
  failStreak?: NumCmp;
  idleSeconds?: NumCmp;
}
type NumCmp = { lt?: number; lte?: number; eq?: number; gte?: number; gt?: number };
```

## 4. Luật chung (áp dụng cho mọi màn, ưu tiên thấp hơn luật của màn)
| id | when | say |
|---|---|---|
| `g-empty-enter` | `{ trigger: 'enter', blockCount: { eq: 0 } }`, chỉ ở mode `build` và khi `isFirstOfModeInWorld` | "Kéo khối từ đây sang nhé!" → `toolbox:<khối đầu của toolbox>` |
| `g-parsons-enter` | `{ trigger: 'enter' }`, chỉ khi mode `parsons` chưa có trong `seenModes` | "Nối các khối vào khi bắt đầu nhé!" → `block:cq_start` |
| `g-orphans` | `{ orphans: true, trigger: 'run-end' }` | "Có khối chưa nối vào khi bắt đầu." |
| `g-empty-run` | `{ lastReason: 'EMPTY_PROGRAM' }` | lấy từ feedback |
| `g-timeout` | `{ lastResult: 'timeout' }` | lấy từ feedback |
| `g-idle` | `{ idleSeconds: { gte: 60 }, runCount: { eq: 0 } }` | "Thử bấm ▶ xem chuyện gì xảy ra!" → `run` |
| `g-fail3` | `{ failStreak: { gte: 3 } }` | "Khó nhỉ? Gợi ý 💡 đang miễn phí đó." |

Ngoài ra, sau mỗi lượt thua, **câu phản hồi theo reasonCode** (`feedback`) luôn hiện trước. Gợi ý tầng 0 (nếu có) hiện sau 1,5 giây.

## 5. Thuật toán
1. Khi có `trigger`, gộp luật của màn + luật chung, lọc bỏ luật `once` đã hiện.
2. Đánh giá `when` trên `HintContext` (hàm thuần `matches(cond, ctx)`).
3. Chọn luật khớp có `priority` cao nhất; nếu bằng nhau, luật của màn thắng luật chung, rồi theo thứ tự khai báo.
4. Trả `{ rule, target }`. UI hiện bong bóng Măng + mũi tên chỉ target. Tối đa **1** gợi ý tầng 0 trên màn hình cùng lúc.
5. Trigger `change` được debounce 600 ms và **không** chạy khi bé đang kéo khối.

## 6. Kiểm thử
- Unit test `matches()` cho từng khóa điều kiện.
- `content:check` xác nhận mọi `point` và `lastReason` hợp lệ.
