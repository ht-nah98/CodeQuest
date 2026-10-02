# Rewards engine

Nguồn chuẩn cho: cách **cài đặt** sao, xu, huy hiệu, chuỗi ngày, mở khóa. **Con số** (bao nhiêu xu, giá bao nhiêu) nằm ở `docs/product/rewards-economy.md`; code đọc con số từ một file cấu hình duy nhất `packages/rewards/src/config.ts`, file này phải khớp với tài liệu sản phẩm.

## 1. Nguyên tắc
- **Hàm thuần**: nhận dữ liệu, trả dữ liệu. Không đọc đồng hồ (thời điểm truyền vào qua tham số `now`), không I/O.
- **Sổ xu chỉ ghi thêm** (append-only). Số dư = tổng các dòng. Không bao giờ lưu số dư như một con số có thể sửa.
- **Idempotent**: mỗi dòng sổ xu có `id` xác định từ nguồn gốc của nó (vd `level-first-clear:w01-l03`). Ghi trùng thì bỏ qua. Nhờ đó đồng bộ nhiều máy không cộng xu hai lần.

## 2. Kiểu dữ liệu
```ts
interface LevelProgress {
  levelId: string;
  bestStars: 0 | 1 | 2 | 3;
  bestBlocks: number | null;
  completedAt: string | null;     // ISO
  firstTryWin: boolean;
  attempts: number;
}

// RunResult, ReasonCode, RunSummary được khai báo trong @codequest/content-schema (src/runtime.ts)
// để rewards không phải import engine. Engine dùng lại đúng các type này.
interface RunSummary {
  runId: string;                  // uuid của MỘT lượt chạy (khác `attempts` trong Dexie = một phiên màn)
  result: RunResult;
  reasonCode: ReasonCode | null;
  blocksUsed: number;
  edits?: number;                 // bughunt
  predictChoice?: string;         // predict
}

interface LevelSession {          // một phiên màn: từ lúc vào tới lúc rời màn
  levelId: string;
  runs: RunSummary[];
  hintTiersBought: Array<1 | 2 | 3>;
}

interface LedgerEntry {
  id: string;                     // khóa idempotent, xem §4
  profileId: string;
  delta: number;                  // + nhận, − tiêu
  reason: LedgerReason;           // 'level-clear' | 'star-2' | 'star-3' | 'first-try' | 'lesson' | 'daily' | 'streak-7' | 'replay' | 'creative' | 'group-goal' | 'hint-1' | 'hint-2' | 'hint-3' | 'shop' | 'bonus-level' | 'starter' | 'coach-adjust'
  refId: string | null;           // levelId, itemId…
  at: string;                     // ISO, giờ thật của máy
  localDay: string;               // 'YYYY-MM-DD' theo Asia/Ho_Chi_Minh
}
```

## 3. API công khai (`@codequest/rewards`)
```ts
computeStars(level: Level, session: LevelSession, winning: RunSummary): 0 | 1 | 2 | 3
computeLevelRewards(input: { level; session; winning; progress: LevelProgress | undefined; ledger: LedgerEntry[]; now: Date; profileId })
  : { stars; newProgress: LevelProgress; entries: LedgerEntry[]; newBadges: string[] }
  // entries gồm cả 'daily' và 'streak-7' nếu lượt thắng này là hoạt động đầu tiên của ngày / chạm mốc chuỗi
computeLessonRewards(input: { lessonId; ledger; now; profileId }): LedgerEntry[]   // 'lesson' + có thể 'daily', 'streak-7'
hintPrice(tier: 1 | 2 | 3, session: LevelSession, ledger: LedgerEntry[]): number  // lưới an toàn; tầng 1 đã mua trước đây → 0
buyHint(input: { tier; level; session; ledger; now; profileId }): { ok: true; entry: LedgerEntry | null } | { ok: false; missing: number }
  // entry null khi giá 0 (miễn phí); missing = số xu còn thiếu
canAfford(ledger: LedgerEntry[], price: number): boolean
balance(ledger: LedgerEntry[]): number                               // áp trần replay 5/ngày khi cộng (§4)
streak(ledger: LedgerEntry[], now: Date): { current: number; best: number }
isUnlocked(target: { worldId } | { levelId }, ctx: { worlds; levels; progress: Map<string, LevelProgress>; lessonsDone: Set<string>; bonusOwned: Set<string>; overrides: Set<string> }): boolean
evaluateBadges(ctx: BadgeContext): string[]
localDay(date: Date): string                                         // Asia/Ho_Chi_Minh, dùng Intl.DateTimeFormat
mergeProgress(a: LevelProgress, b: LevelProgress): LevelProgress   // luật gộp dùng chung cho đồng bộ (data-sync-auth.md §4)
```

## 4. Khóa idempotent của dòng sổ xu
| Lý do | `id` |
|---|---|
| Hoàn thành lần đầu | `level-clear:<levelId>` |
| ⭐⭐ / ⭐⭐⭐ lần đầu | `star-2:<levelId>` · `star-3:<levelId>` |
| Thắng lượt đầu | `first-try:<levelId>` |
| Bài giảng | `lesson:<lessonId>` |
| Thưởng ngày | `daily:<localDay>` |
| Mốc chuỗi | `streak-7:<localDay của ngày chạm mốc>` |
| Chơi lại | `replay:<runId>`. Trần 5/ngày: khi ghi, kiểm số dòng `replay` cùng `localDay`; khi **tính số dư**, `balance()` chỉ cộng 5 dòng `replay` đầu tiên của mỗi `localDay` (sắp theo `id`), nên hai máy offline cùng ghi vẫn ra cùng số dư |
| Sáng tạo | `creative:<levelId>` |
| Mục tiêu nhóm | `group-goal:<goalId>` |
| Huấn luyện viên điều chỉnh | `coach-adjust:<uuid>` |
| Mua gợi ý | `hint-<tier>:<levelId>:<uuid>` (tầng 1: `hint-1:<levelId>`, mua 1 lần là đủ) |
| Mua vật phẩm / màn bonus | `shop:<itemId>` · `bonus-level:<levelId>` |
| Xu khởi đầu | `starter` |

Mọi dòng đều có id xác định từ nguồn gốc của nó (lượt chạy, ngày, vật phẩm), nên ghi lại cùng một sự kiện bao nhiêu lần, trên bao nhiêu máy, cũng ra cùng tập dòng.

## 5. Luật huy hiệu (`BadgeRule`)
Huy hiệu khai báo trong `content/shared/badges.json`, luật là dữ liệu:
```ts
type BadgeRule =
  | { type: 'count-levels'; minStars: 1 | 2 | 3; withAnyBlock?: string[]; mode?: LevelMode; stage?: LevelStage[]; gte: number }
  | { type: 'predict-first-try'; gte: number }
  | { type: 'world-clear'; worldId: string }
  | { type: 'streak'; gte: number }
  | { type: 'event'; name: 'first-run' | 'persistent' | 'robot-mission' };

interface BadgeContext {
  levels: Map<string, Level>;
  progress: Map<string, LevelProgress>;
  solutionsUsed: Map<string, Record<string, number>>;   // levelId → blockTypesUsed của lượt thắng tốt nhất
  predictFirstTry: Set<string>;                         // levelId của màn predict đúng ngay lần đầu
  streak: { current: number; best: number };
  events: Set<'first-run' | 'persistent' | 'robot-mission'>;
  owned: Set<string>;                                   // huy hiệu đã có
}
```
`evaluateBadges` chỉ trả huy hiệu **mới** (chưa có trong `owned`). `bug-detective` = `{type:'count-levels', minStars:2, mode:'bughunt', gte:5}`. `persistent` do UI phát hiện (≥ 5 lượt thua rồi tự thắng, không mua tầng 2/3) và ghi vào `events`.

## 6. Kiểm thử bắt buộc
- Bảng test cho `computeStars` phủ mọi dòng ở `rewards-economy.md` §1 (gồm trần sao do gợi ý, `predict`, `bughunt`).
- Thưởng tối đa của một màn = 25 xu.
- Ghi lại cùng một lượt thắng 2 lần (cùng `runId`) → sổ xu không đổi; hai lượt chơi lại khác nhau trên hai máy → 2 dòng `replay`, trần 5/ngày vẫn đúng sau khi gộp.
- `localDay` tại 23:59 và 00:01 giờ Việt Nam khi máy để múi giờ UTC.
- Chuỗi ngày: đứt khi bỏ 1 ngày; mốc 7 chỉ thưởng 1 lần mỗi mốc.
