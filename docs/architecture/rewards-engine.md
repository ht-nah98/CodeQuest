# Rewards engine

Nguồn chuẩn cho: cách **cài đặt** sao, xu, huy hiệu, chuỗi ngày, mở khóa. **Con số** (bao nhiêu xu, giá bao nhiêu) nằm ở `docs/product/rewards-economy.md`; code đọc con số từ một file cấu hình duy nhất `packages/rewards/src/config.ts`, file này phải khớp với tài liệu sản phẩm.

## 1. Nguyên tắc
- **Hàm thuần**: nhận dữ liệu, trả dữ liệu. Không đọc đồng hồ (thời điểm truyền vào qua tham số `now`), không I/O.
- **Sổ xu chỉ ghi thêm** (append-only). Số dư = tổng các dòng. Không bao giờ lưu số dư như một con số có thể sửa.
- **Idempotent**: mỗi dòng sổ xu có `id` xác định từ nguồn gốc của nó (vd `level-clear:w01-l03`). Ghi trùng thì bỏ qua. Nhờ đó đồng bộ nhiều máy không cộng xu hai lần.

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
computeStars(level: Level, session: LevelSession, winning: RunSummary, progress?: LevelProgress): 0 | 1 | 2 | 3
  // progress (như trước lượt này) để predict đếm lần chọn qua mọi phiên
computeLevelRewards(input: { level; session; winning; progress: LevelProgress | undefined; ledger: LedgerEntry[]; now: Date; profileId })
  : { stars; newProgress: LevelProgress; entries: LedgerEntry[]; newBadges: string[] }
  // entries gồm cả 'daily' và 'streak-7' nếu lượt thắng này là hoạt động đầu tiên của ngày / chạm mốc chuỗi
computeLessonRewards(input: { lessonId; ledger; now; profileId }): LedgerEntry[]   // 'lesson' + có thể 'daily', 'streak-7'
hintPrice(tier: 1 | 2 | 3, session: LevelSession, ledger: LedgerEntry[]): number  // lưới an toàn; tầng 1 đã mua trước đây → 0
hintEntryId(tier, levelId, purchaseId): string                    // id dòng sổ xu của lần mua gợi ý (§4)
isHintOwned(levelId, ledger): boolean                              // tầng 1 của màn đã mua (mở lại miễn phí)
buyHint(input: { tier; level; session; ledger; now; profileId; purchaseId }): { ok: true; entry: LedgerEntry | null } | { ok: false; missing: number }
  // entry null khi đã sở hữu (tầng 1) hoặc purchaseId này đã trả rồi; missing = giá − max(0, số dư)
  // tầng 1 mở miễn phí nhờ lưới an toàn → vẫn ghi `hint-1:<levelId>` với delta 0 để sở hữu mãi
  // purchaseId: uuid do UI tạo cho mỗi lần bấm mua (package không được sinh uuid); tầng 1 bỏ qua nó
  // tầng 2/3 ở màn predict, hoặc session của màn khác → throw (lỗi lập trình)
canAfford(ledger: LedgerEntry[], price: number): boolean
balance(ledger: LedgerEntry[]): number                               // áp trần replay 5/ngày khi cộng (§4)
streak(ledger: LedgerEntry[], now: Date): { current: number; best: number }
isUnlocked(target: { worldId } | { levelId }, ctx: { worlds; levels; progress: Map<string, LevelProgress>; lessonsDone: Set<string>; bonusOwned: Set<string>; overrides: Set<string> }): boolean
evaluateBadges(ctx: BadgeContext): string[]
localDay(date: Date): string                                         // Asia/Ho_Chi_Minh, dùng Intl.DateTimeFormat
mergeProgress(a: LevelProgress, b: LevelProgress): LevelProgress   // luật gộp dùng chung cho đồng bộ (data-sync-auth.md §3–§4)
recordSession(progress: LevelProgress | undefined, session: LevelSession): LevelProgress  // gọi khi rời màn (thắng hay thua)
starterEntry(profileId: string, now: Date): LedgerEntry              // dòng 'starter' +30 khi tạo hồ sơ
failStreak(session: LevelSession): number                           // chuỗi thua cuối phiên, cho UI hiện gợi ý miễn phí
applyRun(state: { progress; ledger }, input: { level; session; run; now; profileId })
  : { progress; ledger: LedgerEntry[]; rewards: LevelRewards | null }  // reducer gọi sau MỖI lượt chạy
computeCreativeSaveRewards(input: { level; progress; ledger; now; profileId }): { newProgress; entries }  // bé bấm Lưu ở màn creative
predictPickSummary(engineRun: RunSummary, pickedKey: string, answerKey: string, runId: string): RunSummary
WRONG_ANSWER = 'WRONG_ANSWER'                               // reasonCode của lần chọn sai
// buyBonusLevel (mua màn bonus, 'bonus-level:<levelId>') để GĐ 4 cùng cửa hàng
```

### Quy ước gọi (chốt ở P1-08)
- **Một lượt chạy được tính ngay khi engine trả kết quả** (`runLevel` xong), không đợi phần phát lại: bé bấm Dừng, Làm lại hay rời màn giữa lúc Măng đang diễn thì lượt đó vẫn nằm trong `session.runs` (vẫn tính vào `attempts`, `failStreak`, "thắng lượt đầu"), và lượt thắng vẫn được ghi xu ngay. Chỉ lớp phủ kết quả đợi phát lại xong mới hiện. Cài đặt: `apps/web/src/features/play/usePlaySession.ts` (`recordRun`), phiên đang mở được chép vào `sessionStorage` sau mỗi lượt để lần vào màn sau đóng nốt nếu tab bị đóng giữa chừng (`recordSession` + `saveAttempt`, cả hai idempotent). Gợi ý mua trong phiên: `recordHintBought(tier, entry)`.
- **UI dùng `applyRun`**: gọi sau mỗi lượt chạy theo đúng thứ tự, `session` đã chứa lượt đó, rồi giữ `{ progress, ledger }` trả về cho lượt sau (và ghi `rewards.entries` + `progress` vào Dexie). Nhờ vậy lượt thắng thứ 2 trong cùng phiên nhận đúng `newProgress` của lượt thắng thứ 1 (không đếm `attempts` hai lần). Lượt không thắng → `rewards: null`, state giữ nguyên.
- `computeLevelRewards` nhận `progress` và `ledger` **như ngay trước lượt thắng này**. Gọi lại với cùng đầu vào (cùng `runId`) không sinh dòng mới. Dòng "lần đầu" (`level-clear`, `star-*`, `first-try`) xét theo **sổ xu**, không theo `progress`. Lỗ hổng đã biết: nếu ghi lại lượt ⭐⭐⭐ đầu tiên với `progress` **đã cập nhật**, sẽ sinh thêm `replay:<runId>`; vì vậy luôn đi qua `applyRun`.
- `session.levelId` phải bằng `level.id` (và `progress.levelId` trong `recordSession`), nếu không thì throw.
- `LevelProgress.attempts` = tổng số lượt chạy **không phải `error`** ở màn đó từ trước tới nay. `computeLevelRewards` cộng các lượt từ lần thắng trước trong phiên tới lượt thắng này; `recordSession` cộng phần còn lại khi rời màn. UI **phải** gọi `recordSession` khi rời màn, kể cả khi thua, nếu không "thắng lượt đầu" sẽ bị cho sai ở phiên sau.
- "Thắng lượt đầu" = `attempts` trước đó bằng 0, chưa từng hoàn thành, sổ xu chưa có `level-clear:<levelId>`, và không có lượt chạy (khác `error`) nào trước lượt thắng trong phiên.
- `predict`: mỗi lần chọn thẻ thành một `RunSummary` qua `predictPickSummary`: chọn đúng → `success`; chọn sai → `incomplete` + `reasonCode: 'WRONG_ANSWER'`, **bất kể** chương trình tự nó thắng hay lỗi. Lần chọn sai tính vào `failStreak` (mở gợi ý tầng 1 miễn phí sau 3 lần). `feedback.json` cần một dòng cho `WRONG_ANSWER`. Cài đặt (P1-06): `PlayScreen` chạy `initialWorkspace` khi bé bấm thẻ, `recordRun(outcome, pickedKey)` → `toRunSummary(outcome, runId, pickedKey)` (`features/play/session.ts`) gọi `predictPickSummary`. Màn `creative`: nút Lưu → `saveCreative` (`usePlaySession`) → `saveCreation` (`data/repos/creations.ts`, có outbox) + `addCreativeSave` → `computeCreativeSaveRewards`, ghi bằng `saveLevelResult`.
- `predict`: "lần chọn thứ n" đếm **qua mọi phiên** = `progress.attempts` + lượt (khác `error`) trước lượt thắng trong phiên, để ra vào màn không "cày" được ⭐⭐⭐ (chờ HLV xác nhận).
- `bughunt` mà lượt thắng thiếu `edits` → coi như không đạt điều kiện ⭐⭐.
- Màn `creative`: gọi `computeCreativeSaveRewards` khi bé bấm Lưu; chỉ sinh `creative:<levelId>` lần đầu, 0 sao, **không** tính là ngày có học (không thưởng ngày). `computeLevelRewards` gặp màn creative thì chuyển sang hàm này (giữ tương thích); `applyRun` bỏ qua màn creative.
- `replay` chỉ khi `progress.bestStars` trước lượt này đã là 3; khi ghi, dừng ở 5 dòng/`localDay`.
- `streak` suy ra từ các dòng `daily` (mỗi ngày có học có đúng 1 dòng `daily:<localDay>`). Hôm nay chưa học mà hôm qua có học thì chuỗi vẫn còn. Mốc `streak-7` chỉ xét lúc ghi dòng `daily` đầu ngày, nên mỗi mốc thưởng 1 lần. Dòng `daily` có ngày sau `now` (đồng hồ máy lệch) bị bỏ qua. `balance` và `streak` giả định sổ xu của **một** hồ sơ.
- Lưu ý GĐ 2 (đồng bộ nhiều máy): `streak-7` có khóa theo **ngày chạm mốc**. Nếu một máy offline chưa thấy dòng `daily` của máy kia, hai máy có thể tính chuỗi khác nhau và chạm mốc vào hai ngày khác nhau → hai dòng `streak-7` cho cùng một mốc. Khi làm đồng bộ cần xét lại (vd khóa theo số mốc `streak-7:<n>` hoặc kiểm lại sau khi pull).
- `balance` là tổng thật (không kẹp về 0). Hai máy offline cùng tiêu xu vẫn có thể làm số dư âm sau khi gộp; đề xuất UI hiển thị `max(0, balance)` (chờ HLV chốt).
- `isUnlocked`: `ctx.worlds: Map<string, World>`, `ctx.levels: Map<string, Level>`, `overrides` chứa worldId hoặc levelId. Tỷ lệ sao lấy từ `world.unlock.minStarRatio` của **thế giới trước**, làm tròn lên số sao nguyên. Chuỗi "màn liền trước" chỉ gồm màn `guided`/`practice` (bỏ qua `challenge`). Màn `retired` bị khóa (kể cả khi HLV mở thủ công) và không tính vào chuỗi hay tổng sao. Thế giới không có màn `boss` còn hiệu lực thì **không bao giờ** được tính là đã qua (không mở thế giới sau, không mở màn bonus). Màn đầu của thế giới cần bài giảng đầu tiên trong `world.lessonIds`.
- `evaluateBadges` để GĐ 4. Chữ ký hiện tại thiếu danh sách huy hiệu: khi cài cần thêm tham số `badges: Badge[]` (hoặc trường trong `BadgeContext`).

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
