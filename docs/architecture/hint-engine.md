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
type Target = `toolbox:${string}` | `block:${string}` | 'run' | 'capacity' | 'stage' | 'step';
// 'step' (P2-11, T10): nút "Từng bước" (`data-hint-anchor="step"`), nhấp nháy như 'run'.
// toolbox:<type> = khối loại đó trong thanh khối · block:<type> = khối loại đó đầu tiên trong vùng ghép (dùng cho parsons/bughunt; ở predict/bughunt chương trình cho sẵn phải có đúng một khối loại đó, content:check luật 16)

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
| `g-empty-run` | `{ trigger: 'run-end', lastReason: 'EMPTY_PROGRAM' }` | lấy từ feedback |
| `g-timeout` | `{ trigger: 'run-end', lastResult: 'timeout' }` | lấy từ feedback |
| `g-idle` | `{ idleSeconds: { gte: 60 }, runCount: { eq: 0 } }` | "Thử bấm Chạy xem chuyện gì xảy ra!" → `run` |
| `g-fail3` | `{ trigger: 'run-end', failStreak: { gte: 3 } }`, chỉ khi màn có `thinkingHint` | "Khó nhỉ? Gợi ý đang miễn phí đó." |

Cài đặt (`hints/globalRules.ts`):
- Luật chung **không mang chữ**: engine chỉ trả `id` (`GlobalHintId`). Web lấy câu ở `vi.hints.global[id]`; `g-empty-run` và `g-timeout` có `feedbackReason` (`EMPTY_PROGRAM`, `TIMEOUT`) nên nói câu `level.feedback` → `feedback.json` của reasonCode đó, câu trong `vi.ts` chỉ là dự phòng. Hàm: `hintText(selection, level, feedback)` ở `apps/web/src/features/hints`.
- Điều kiện theo mode (`g-empty-enter`, `g-parsons-enter`) không viết được bằng cú pháp `Condition`, nên `globalRules(level, ctx)` lọc trước.
- `g-empty-run` chỉ vào `toolbox:<khối đầu của toolbox>` ở mode `build` (`screens-and-flows.md` §5).
- `g-empty-run`, `g-timeout`, `g-fail3` chỉ nói ngay sau một lượt chạy (`run-end`), không lặp lại mỗi lần bé sửa khối.
- Bỏ emoji 💡 / ▶ khỏi câu: máy của bé không chắc có font emoji (giống nút Chạy).
- Id luật chung bắt đầu bằng `g-`; luật của màn không nên dùng tiền tố này (dùng chung `shownHintIds`).

Ngoài ra, sau mỗi lượt thua, **câu phản hồi theo reasonCode** (`feedback`) luôn hiện trước. Gợi ý tầng 0 (nếu có) hiện sau 1,5 giây.

## 5. Thuật toán
1. Khi có `trigger`, gộp luật của màn + luật chung, lọc bỏ luật `once` đã hiện.
2. Đánh giá `when` trên `HintContext` (hàm thuần `matches(cond, ctx)`).
3. Chọn luật khớp có `priority` cao nhất; nếu bằng nhau, luật của màn thắng luật chung, rồi theo thứ tự khai báo.
4. Trả `{ rule, target }`. UI hiện bong bóng Măng + mũi tên chỉ target. Tối đa **1** gợi ý tầng 0 trên màn hình cùng lúc.
5. Trigger `change` được debounce 600 ms và **không** chạy khi bé đang kéo khối.

## 6. Kiểm thử
- Unit test `matches()` cho từng khóa điều kiện, `all`/`any`/`not`, ưu tiên, từng luật chung (`packages/engine/src/hints/*.test.ts`).
- `content:check` xác nhận mọi `point` và `lastReason` hợp lệ.
- Web: `features/hints/*.test.ts(x)` (giá, lưới an toàn, mua bằng `spend` trên fake-indexeddb, trần sao tầng 3), `screens/play/HintBox.test.tsx`, `SolutionViewer.test.tsx`, `blockly/nextStepPopover.test.ts` (Blockly thật trong jsdom).

## 7. API cho màn chơi (P1-07)
### Engine (`@codequest/engine`)
| Hàm | Ý nghĩa |
|---|---|
| `matches(cond, ctx)` / `compare(value, numCmp)` | Đánh giá điều kiện (thuần) |
| `globalRules(level, ctx): GlobalHintRule[]` | Luật chung áp dụng cho màn này, theo thứ tự khai báo |
| `selectHint(level, ctx): HintSelection \| null` | Thuật toán §5. `HintSelection = { source: 'level', rule: HintRule, target } \| { source: 'global', rule: GlobalHintRule, target }`, `target` = `point` hoặc `null` |
| `nextStep(solution, current, { toolbox?, capacityLeft? }): NextStep \| null` | Gợi ý tầng 2 (`blockly-integration.md` §8), thuần trên JSON |
| `structuralDistance(solution, current)` | Số bước sửa còn lại theo cách `nextStep` đo (0 = giống lời giải) |

`level` là `HintLevel = Pick<Level, 'mode' | 'toolbox' | 'hints' | 'thinkingHint'>`. `HintContext.capacityLeft` = `Infinity` khi màn không có `maxBlocks`.

### Web: `useHints` (`apps/web/src/features/hints`)
```ts
const hints = useHints({ profileId, level, session });   // onPurchased?, now?, newPurchaseId? tùy chọn
hints.ready; hints.balance; hints.tiers;   // TierView[]: { tier, state: 'owned'|'free'|'buy'|'locked', price, missing }
hints.tiersBought;                         // tầng đã mua trong phiên màn (theo thứ tự)
await hints.buy(1 | 3);
await hints.buy(2, { json: handle.getState().json, capacityLeft });   // capacityLeft = remainingCapacity ?? Infinity
// → { status: 'opened', tier: 1|3 } | { status: 'opened', tier: 2, step: NextStep }
//   | { status: 'solved' | 'reset', tier: 2 }          // tầng 2 không có gì để chỉ: KHÔNG trừ xu, KHÔNG hạ sao
//   | { status: 'missing', tier, missing } | { status: 'busy' } | { status: 'unavailable' } | { status: 'error' }
hints.evaluate(trigger, facts);            // facts: { analysis, capacityLeft, idleMs, isFirstOfModeInWorld, seenModes }
hints.tip; hints.dismissTip();             // gợi ý tầng 0 đang hiện (tối đa 1)
```
- `session` (`LevelSession`) do màn chơi giữ; hook đọc nó ở **mỗi lần render và mỗi lần gọi** (không memo), nên giữ trong ref/sửa tại chỗ cũng được, miễn là màn chơi render lại sau mỗi lượt chạy. `runCount`, `failStreak`, `lastOutcome` lấy từ `session.runs`; `shownHintIds` do hook giữ suốt phiên màn (hook sống cùng `PlaySession`, `key={level.id}`).
- **Trần sao:** hook tự giữ `tiersBought` (khởi tạo từ `session.hintTiersBought` lúc mount). Trước khi gọi `applyRun` / `computeStars`, màn chơi truyền `{ ...session, hintTiersBought: hints.tiersBought }`. Không cần tự `push` vào session.
- Mua: tầng 2 tính `nextStep` **trước** khi trừ xu (`toolbox` của màn, rỗng ở `parsons`; `capacityLeft`). Rồi đọc lại sổ xu → `buyHint` của rewards → giá > 0 ghi bằng `spend` (kiểm số dư trong transaction), tầng 1 miễn phí (delta 0) ghi bằng `addLedgerEntries` để **sở hữu mãi**. Mỗi lần bấm một `purchaseId` mới (`crypto.randomUUID()`). Bấm lần 2 khi đang ghi → `busy`; tầng màn không có → `unavailable`; lỗi lưu trữ → `error`, không ghi nhận tầng.
- Trạng thái `owned`: tầng 1 đã mua ở màn này (`isHintOwned` của rewards, bất kỳ phiên nào), tầng 3 đã mua trong phiên này (mở lại không trừ xu). Tầng 2 lần nào cũng trả (mỗi lần một bước mới).
- Tầng có trong màn (`availableTiers`): tầng 1 cần `thinkingHint`; tầng 2–3 cần `solution` và không có ở `predict`/`creative`.

### Web: thành phần giao diện
| Thành phần | Dùng |
|---|---|
| `screens/play/HintBox.tsx` | Lớp phủ `aria-modal`: `<HintBox tiers balance busy thinkingHint notice onBuy onClose />`, `notice` = `'error' \| 'solved' \| 'reset' \| 'missing' \| null` (`missing`: số dư đổi giữa chừng, không đủ xu; không trừ gì). Có kiểm soát. Focus nút đầu khi mở, Tab không ra ngoài, Esc đóng (bắt trên `document`), trả focus cho nút đã mở hộp. Nút bị khóa/đang mua dùng `aria-disabled` (vẫn focus được) |
| `screens/play/SolutionViewer.tsx` | Tầng 3: `<SolutionViewer solution={level.solution} onClose />`, workspace chỉ đọc (vùng `role="region"`), tự `zoomToFit` |
| `blockly/nextStepPopover.ts` | Tầng 2: `showNextStepPopover(workspace, result.step, { onClose })` → `{ element, close() }`; `nextStepMessage(step)` cho câu của Măng |
| `blockly/readOnlyWorkspace.ts` | `mountReadOnlyWorkspace(div, json)` → `{ workspace, dispose() }`; trả vai "main workspace" cho workspace chính |
| `blockly/contentHighlight.ts` | `startContentHighlight(workspace)` → hàm gỡ; dùng khi gợi ý tầng 0 đang hiện có `spotlight: true` |

### Đã nối vào màn chơi (P1-07 phần 2)
Code: `apps/web/src/screens/play/usePlayHints.ts` (hook gom `useHints` + popover + lời giải + gợi ý tầng 0) và `PlayScreen.tsx`.
1. **Nút "Gợi ý"** (`data-testid="play-hint"`, phím `H` qua `shouldHandleAppShortcut`) ở bên phải thanh "còn N khối" (hàng dưới vùng ghép khối; màn không giới hạn khối thì hàng chỉ có nút). Không có nút khi màn không có tầng nào (`creative`); `predict` chỉ có tầng 1. Nút bị `disabled` và phím `H` không làm gì **tới khi phiên màn nạp xong** (`usePlaySession().ready`); phòng thêm: `useHints({ sessionOpen })` (màn chơi truyền `() => snapshot().open`) trả `busy` khi phiên chưa mở, nên không bao giờ trừ xu mà không ghi được trần sao.
2. **Mua**: `onBuy(tier)` → tầng 2 đọc `handle.getState()` (JSON + `remainingCapacity`) rồi `hints.buy(2, …)`; `opened` tầng 1 → hộp hiện `thinkingHint` (giọng `levelVoiceId(id, 'thinking')`); tầng 2 → đóng hộp, `showNextStepPopover`; tầng 3 → đóng hộp, `SolutionViewer`. `solved`/`reset`/`missing`/`error` → `notice` trong hộp. `useHints({ onPurchased })` nhận `(tier, entry)` và chuyển thẳng cho `usePlaySession().recordHintBought(tier, entry)`: phiên màn ghi tầng đã mua (trần sao qua `applyRun`) và thêm dòng sổ xu vào sổ đang giữ trong bộ nhớ. `session` đưa cho `useHints` là `snapshot().session`.
3. **Gợi ý tầng 0** (`hints.evaluate`):
   - `enter`: một lần, khi cả sân chơi lẫn workspace đã sẵn sàng.
   - `change`: 600 ms sau khi **chương trình** đổi (bỏ qua báo cáo lặp lại không đổi chương trình); đang kéo khối (`Gesture.inProgress()`) thì chờ thêm 600 ms.
   - `run-end`: 1,5 s sau khi phát lại một lượt **thua** xong (câu phản hồi hiện trước), kể cả lần chọn sai ở `predict`. Lượt thắng không có gợi ý (màn Kết quả hiện).
   - `idle`: kiểm mỗi 5 s; 60 s không chạm / không phím / không đổi chương trình → một lần, tới khi bé thao tác lại.
   - Bé sửa chương trình thì hủy gợi ý `run-end` đang chờ; `reset` (Làm lại, Dừng, sửa sau một lượt) và bắt đầu chạy hủy mọi gợi ý đang chờ (`cancelPending`).
   - Không hiện khi đang chạy, đang ở màn Kết quả, hoặc khi hộp gợi ý / lời giải / popover tầng 2 đang mở. Mở hộp gợi ý, mở tầng 2 hoặc tầng 3 xóa mũi tên của gợi ý tầng 0 đang hiện (`clearTip`). `hints.tip` là gợi ý tầng 0 đang hiện, tới khi `clearTip` (một trạng thái, không bật rồi tắt ngay). Câu của Măng: `hintText`, giọng `hintVoiceId(levelId, ruleId)` (luật của màn), `feedbackVoiceId` (luật mượn câu phản hồi), `ui.hints.global.<id>` (luật chung). Câu mới bất kỳ trong bong bóng (chạy, dừng…) xóa mũi tên của gợi ý cũ.
4. **Chỉ vào đâu** (`blockly/hintPointer.ts`): `toolbox:<type>` = khối trong flyout (bỏ qua ở `parsons`, thanh khối ẩn); `block:<type>` = khối đầu tiên loại đó (trên xuống), ưu tiên khối đã nối vào chương trình, hoặc **ưu tiên khối rời** nếu điều kiện có `orphans: true`; không có `point` mà điều kiện có `orphans: true` → khối rời đầu tiên. Khối được chỉ có mũi tên nhún (`data-testid="hint-arrow"`, `data-block-type`) + viền hồng; mũi tên ở bên trái khối, sang bên phải (`data-side="right"`) khi bên trái không còn chỗ; theo khối khi workspace **và flyout** cuộn; khối bị xóa (hoặc flyout vẽ lại) thì mũi tên tự gỡ; `run` / `capacity` / `stage` → vòng sáng trên phần tử có `data-hint-anchor` tương ứng (`data-hint-target="true"`). `spotlight: true` chỉ bật `startContentHighlight` ở màn `stage: 'guided'`.
5. Rời màn (unmount) đóng popover và gỡ mũi tên; hẹn giờ được hủy. Bắt đầu chạy (Chạy / `Space` / `S`) đóng popover tầng 2.
6. Unit: `screens/play/usePlayHints.test.tsx` (fake timers: chờ 600 ms + `Gesture.inProgress`, 1,5 s `run-end`, `idle` một lần, hủy khi unmount; không gợi ý khi hộp/lời giải/popover mở). E2E: `apps/web/e2e/play-hints.spec.ts` (World 1 thật: w01-l01, l02, l03, l04, creative).
