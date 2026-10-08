# Kiểu game × Cách chơi

Nguồn chuẩn cho: danh sách kiểu game, cách chơi, luật, khối lệnh, cách chấm bài.

## 1. Mô hình hai chiều

Một màn chơi = **một kiểu game** (`kind`: thế giới mô phỏng) × **một cách chơi** (`mode`: cách bé tương tác).

```
                 build    parsons   predict   bughunt   creative
runner (Đường chạy)  ●        ●         ●         ●         ●
maze   (Mê cung)     ●        ●         ●         ●         ●
robotlab (Robot)     ●        ●         ●         ●         ●
turtle (Họa sĩ)      ●        ●         ●         ●         ●
farm   (Nông trại)   ●        ●         ●         ●         ○
sorter (Băng chuyền) ●        ●         ●         ●         ○
music  (Nhạc công)   ●        ●         ●         ●         ●
```
Ký hiệu: ● dùng được · ○ dùng được nhưng ít giá trị.

Nhờ tách hai chiều, mỗi kiểu game mới tự động có 5 cách chơi; mỗi cách chơi mới dùng được ngay cho mọi kiểu game.

## 2. Cách chơi (`LevelMode`)

| Mode | Tên hiển thị | Bé làm gì | Chấm bài | Workspace ban đầu |
|---|---|---|---|---|
| `build` | Tự ghép | Ghép chương trình từ thanh khối | `evaluate()` của kiểu game | Chỉ có "khi bắt đầu" |
| `parsons` | Ghép hình | Các khối đã có sẵn nhưng xáo trộn, bé sắp xếp lại | `evaluate()`, và **mọi khối được cho phải nối dưới "khi bắt đầu"**: thắng mà còn khối rời → `incomplete` / `LOOSE_BLOCKS`; thắng mà có khối chưa chạy lần nào hoặc thân lặp / nhánh trống → `incomplete` / `UNUSED_BLOCKS` (câu G22) | Khối lời giải xáo trộn; thanh khối trống |
| `predict` | Đoán kết quả | Đọc chương trình **chỉ xem**, chọn 1 trong 3–4 đáp án bằng hình | So đáp án đã chọn với kết quả mô phỏng thật | Chương trình chỉ đọc |
| `bughunt` | Săn lỗi | Chương trình có sẵn bị sai, sửa với ít thao tác nhất | `evaluate()` + đếm số khối thay đổi so với ban đầu | Chương trình có lỗi |
| `creative` | Sáng tạo | Tự do, không có đúng/sai | Không chấm. Lưu được và khoe với nhóm | Chỉ có "khi bắt đầu" |

Riêng với `predict`: đáp án đúng **được tính bằng cách chạy mô phỏng** (`predictAnswer`), không gõ tay, nên không bao giờ lệch với engine. Người soạn khai báo 3–4 phương án (`key` theo định dạng `predictAnswer` của kiểu game), đúng 1 phương án trùng kết quả thật. Mỗi phương án hiện bằng **hình thu nhỏ** vẽ từ `key` và `config` (`AnswerPicture`, SVG tĩnh, xem `architecture/stage-rendering.md` §4 "Hình đáp án"), kèm nhãn chữ ngắn. Hình không đánh số ô (sân chơi không hiện số); ô của đáp án có khung vàng.

Gợi ý trong `predict`: chỉ có tầng 1 (gợi ý tư duy); tầng 2–3 bị ẩn vì không có lời giải để chỉ.

**Màn nhiều bản đồ** (P2-12, `level.variants`, ADR-0016): một màn `build` hoặc `bughunt` có 2–3 bản đồ cùng kiểu game; **một chương trình** phải thắng **mọi** bản đồ. Mục đích: ép bé viết chương trình tổng quát (dùng khối hỏi) thay vì ghép thuộc lòng một đường. Bé thấy thẻ "Bản đồ 1 · 2 · 3" trên sân chơi, xem từng bản đồ trước khi chạy; Chạy phát lần lượt từng bản đồ và dừng ở bản đồ đầu tiên thua (thẻ đó được chọn, có dấu ✖). Thua ở bản đồ nào thì câu phản hồi và gợi ý theo lý do thua ở bản đồ đó. Sao, xu chấm như màn thường: thắng mọi bản đồ là một lượt thắng. Không dùng cho `parsons`, `predict`, `creative`.

### 2.1 Khối điều khiển chung (mọi kiểu game)
Khối của engine (`packages/engine/src/blocks/common.ts`), dùng chung cho mọi kiểu game; thêm vào `toolbox` như khối thường.

| Khối | Nhãn | Ý nghĩa |
|---|---|---|
| `cq_repeat` | lặp N lần | Làm các khối bên trong N lần (1–20) |
| `cq_if` | nếu ◇ thì | **Mỗi lần chạy tới** thì hỏi; ✔ làm các khối bên trong, ✘ bỏ qua (Thế giới 4) |
| `cq_if_else` | nếu ◇ thì … nếu không thì … | ✔ làm nhánh trên, ✘ làm nhánh dưới; mỗi lần chỉ một nhánh (Thế giới 4) |
| `cq_repeat_until` | lặp đến khi ◇ | **Trước mỗi vòng** hỏi: ✘ làm thêm một vòng, ✔ dừng và chạy khối bên dưới; có thể chạy 0 vòng (Thế giới 5) |

- Ô ◇ (điều kiện, input `COND`) nhận **một** khối hỏi (cảm biến) của kiểu game. Ô để trống thì chương trình không chạy: `error` / `EMPTY_CONDITION` ("Ô câu hỏi còn trống. Cắm một khối hỏi vào nhé!"), không đoán thay bé.
- Mỗi lần cảm biến được hỏi, engine ghi event `sense{blockId, value}` (`blockId` = khối hỏi, `value` = ✔/✘) để sân chơi cho khối hỏi sáng ✔/✘. `sense` **tính vào `maxActions`**.
- Vòng lặp không dừng (điều kiện không bao giờ ✔, thân rỗng, thân không làm Măng đổi chỗ) kết thúc `timeout` / `TIMEOUT` khi hết `maxActions` (mỗi câu hỏi là một action, nên thường tới trước) hoặc `maxSteps`; tất định (cùng chương trình ⇒ cùng event log). Khóa đoán của `predict` là `timeout`.
- `level.maxLoopDepth` (P2-11, T16b): số tầng vòng lặp lồng nhau tối đa (`cq_repeat`, `cq_repeat_until`); `1` = không lặp lồng. `maxInstances` đếm theo từng loại khối nên không chặn được một `lặp đến khi` nằm trong một `lặp`.

## 3. Kiểu game (`GameKind`)

### 3.1 `runner` — Đường chạy của Măng · **GĐ 1**

**Góc nhìn:** ngang, 1 làn. Ô đánh số từ 0. Măng luôn nhìn sang phải (chỉ tiến, không lùi).

**Config** (zod ở `packages/games/src/runner/config.ts`):
```ts
type RunnerCell = 'ground' | 'hole' | 'branch' | 'crate' | 'flag';
interface RunnerConfig {
  cells: RunnerCell[];          // 3–40 ô; đúng 1 'flag' và nó phải là ô CUỐI
  start: number;                // chỉ số ô 'ground'
  bamboo?: number[];            // vị trí măng: ô 'ground' hoặc 'branch', nằm SAU start, không trùng; nhặt tự động khi Măng dừng ở ô đó
  goal?: {
    collectAll?: boolean;       // mặc định false; collectAll: true thì bamboo phải có ≥ 1 măng
    items?: { kind: 'key' | 'friend'; at: number }[];  // vật phẩm nhiệm vụ (P2-11c, ADR-0019): ô 'ground'/'branch' SAU start, không trùng nhau, không trùng măng
  };
}
```
- `hole` = hố; `branch` = cành tre thấp (ô đi qua được nếu **cúi**); `crate` = thùng gỗ (phải **đá** đổ trước); `flag` = cờ đích.

**Khối**
| Khối | Nhãn | API | Ý nghĩa |
|---|---|---|---|
| `runner_walk` | đi | `walk(id)` | Sang ô p+1 |
| `runner_jump` | nhảy | `jump(id)` | Bay qua ô p+1, tiếp đất ở ô p+2 |
| `runner_crouch` | cúi | `crouch(id)` | Cúi người đi sang ô p+1 |
| `runner_kick` | đá | `kick(id)` | Đá vào ô p+1, Măng **đứng yên** |
| `runner_is_ahead` | phía trước có [hố ▾ / cành ▾ / thùng ▾ / ô trống ▾] | `isAhead(kind, id)` → boolean | Cảm biến (Thế giới 4). Giá trị dropdown: `HOLE`, `BRANCH`, `CRATE`, `CLEAR` |
| `runner_at_goal` | đã tới nơi? | `atGoal(id)` → boolean | Cảm biến (Thế giới 5, P2-11): Măng đang đứng ở cờ. Tới cờ là kết thúc lượt chạy, nên trong lúc chạy luôn ✘; dùng trong "lặp đến khi đã tới nơi" |

**Bảng luật** (p = ô hiện tại, `t` = ô đích của hành động). "→ crash X" nghĩa là emit event thất bại rồi `stop('crash', X)`.

| Hành động \ ô `t` | `ground` / `flag` | `hole` | `branch` | `crate` | ngoài đường (t ≥ số ô) |
|---|---|---|---|---|---|
| **đi** (t = p+1) | sang t | → crash `FELL_IN_HOLE` | → crash `HIT_BRANCH` | → crash `HIT_CRATE` | không xảy ra (cờ là ô cuối, xem "Tới cờ") |
| **cúi** (t = p+1) | sang t | → crash `FELL_IN_HOLE` | sang t ✔ | → crash `HIT_CRATE` | không xảy ra |
| **nhảy**: ô bay qua (p+1) | qua được | qua được | → crash `HIT_BRANCH` (va cành giữa không trung) | → crash `HIT_CRATE` (thùng cao) | → crash `OFF_TRACK` |
| **nhảy**: ô tiếp đất (t = p+2) | sang t | → crash `FELL_IN_HOLE` | → crash `HIT_BRANCH` | → crash `HIT_CRATE` | → crash `OFF_TRACK` |
| **đá** (ô p+1) | không có gì xảy ra (emit `kick{hit:false}`), không thua | như ground | như ground | thùng đổ, ô thành `ground` (emit `kick{hit:true}`) | như ground |

- **Nhặt măng:** mỗi khi Măng dừng ở một ô có măng chưa nhặt → emit `collect`. Bay qua (nhảy qua) ô có măng thì **không** nhặt.
- **Va chạm** (`HIT_BRANCH`/`HIT_CRATE`): Măng bật lại, **vẫn đứng ở ô p**; không emit `walk`/`crouch`/`jump` trước `bump`. Khi nhảy, xét ô bay qua trước rồi mới tới ô tiếp đất.
- **Vật phẩm nhiệm vụ** (`goal.items`, P2-11c; `rescue` = chìa khóa `key` rồi tới lồng, `escort` = đón bạn `friend` rồi về nhà; curriculum.md §5.0, T17): nhặt như măng, khi Măng **dừng** ở ô đó (emit `collect{at, item}`); nhảy qua thì không. Thứ tự nhặt tùy ý, nhưng phải đủ **trước** khi tới cờ.
- **Tới cờ:** ngay khi Măng dừng ở ô `flag`, lượt chạy **kết thúc**: nếu còn vật phẩm nhiệm vụ → emit `missed{at, left, item}` (thay cho `win`), `incomplete` / `NEED_KEY` hoặc `NEED_FRIEND` (theo vật phẩm còn thiếu đầu tiên trong config); nếu `goal.collectAll` và còn măng chưa nhặt → emit `missed` (thay cho `win`), `incomplete` / `MISSED_ITEMS`; ngược lại → emit `win`, `success`. Vì cờ luôn là ô cuối, Măng không bao giờ đi quá đường.
- **Hết chương trình** mà chưa tới cờ → `incomplete` / `NOT_AT_GOAL`.
- **Cảm biến** `isAhead(kind)` nhìn ô p+1: `HOLE`/`BRANCH`/`CRATE` đúng khi ô đó đúng loại; `CLEAR` đúng khi ô đó là `ground` hoặc `flag`. Ô p+1 nằm ngoài đường → mọi giá trị đều `false`. `atGoal` đúng khi ô p là cờ (không bao giờ trong lúc chạy). Mỗi lần cảm biến được hỏi, engine ghi event `sense{blockId, value}` (§2.1).

**Event** (`events.ts`, mọi event có `blockId`): `walk{from,to}` · `crouch{from,to}` · `jump{from,to}` · `kick{at,hit}` · `collect{at, item?}` (`item` = vật phẩm nhiệm vụ) · `fall{at}` · `bump{from,at,obstacle:'branch'|'crate',move:'walk'|'crouch'|'jump'}` · `offTrack{from}` · `win{at}` · `missed{at,left:number[], item?}` (`left` = các ô còn măng, hoặc còn vật phẩm khi có `item`; luôn tăng dần). Thứ tự, ý nghĩa từng trường: `architecture/game-kind-sdk.md` §1.1.

**reasonCodes:** `FELL_IN_HOLE`, `HIT_BRANCH`, `HIT_CRATE`, `OFF_TRACK`, `NOT_AT_GOAL`, `MISSED_ITEMS`, `NEED_KEY`, `NEED_FRIEND`.

**`predictAnswer`:** `win` · `stop@<ô>` (hết chương trình ở ô đó) · `missed@<ô cờ>` (thiếu măng hoặc vật phẩm) · `crash:<REASON>@<ô>` (ô nơi xảy ra va chạm) · `timeout` (vòng lặp không dừng, T9). Ví dụ `crash:FELL_IN_HOLE@3`.

**Sprite:** đã đủ (đi, nhảy, cúi, đá, ăn mừng).

### 3.2 `maze` — Mê cung · **GĐ 1**

**Góc nhìn:** từ trên xuống, lưới ô, 4 hướng.

**Config:**
```ts
interface MazeConfig {
  map: string[];                 // các hàng bằng nhau, 3–12 cột × 3–12 hàng
                                 // '#' tường · '.' đường · 'S' xuất phát · 'G' đích · 'b' đường có măng
                                 // đúng 1 'S', đúng 1 'G'
  startDir: 'N' | 'E' | 'S' | 'W';
  goal?: {
    collectAll?: boolean;
    items?: { kind: 'key' | 'friend'; at: [number, number] }[];  // vật phẩm nhiệm vụ (P2-11c): trên ô '.', không trùng nhau
  };
}
```
Tọa độ ô viết `r,c` (hàng, cột, từ 0, hàng 0 ở trên cùng).

**Khối**
| Khối | Nhãn | API | Ý nghĩa |
|---|---|---|---|
| `maze_forward` | tiến | `forward(id)` | Sang ô kế tiếp theo hướng đang nhìn |
| `maze_turn_left` / `maze_turn_right` | rẽ trái / rẽ phải | `turn(dir, id)` | Quay 90° tại chỗ |
| `maze_is_path` | có đường [phía trước ▾ / bên trái ▾ / bên phải ▾] | `isPath(dir, id)` → boolean | Cảm biến (Thế giới 4). Giá trị: `AHEAD`, `LEFT`, `RIGHT` |
| `maze_at_goal` | đã tới đích? | `atGoal(id)` → boolean | Dùng với "lặp đến khi" (Thế giới 5). Tới `G` là thắng ngay (khi không còn măng phải nhặt), nên trong lúc chạy thường ✘ |

**Luật**
| Hành động | Kết quả |
|---|---|
| tiến vào `.`, `S`, `b`, `G` | Sang ô đó (dừng ở ô có măng → `collect`; ô có vật phẩm nhiệm vụ → `collect{item}`) |
| tiến vào `#` hoặc ra ngoài bản đồ | emit `bump` → crash `HIT_WALL` |
| rẽ | đổi hướng, emit `turn` |
| **Tới `G` giữa chương trình** | Nếu đã đủ điều kiện (đã nhặt mọi vật phẩm `goal.items`; không `collectAll`, hoặc đã nhặt hết măng) → `success` **ngay lập tức** (giống Blockly Games). Nếu chưa đủ → đi tiếp như ô thường |
| Hết chương trình | Không ở `G` → `incomplete` / `NOT_AT_GOAL` (xét trước). Đứng ở `G` mà còn vật phẩm → `NEED_KEY` / `NEED_FRIEND`; còn măng → `MISSED_ITEMS` |

**Event:** `move{from:[r,c],to:[r,c],dir}` · `turn{from,to}` · `bump{at:[r,c],dir}` · `collect{at, item?}` · `win{at}`.
**reasonCodes:** `HIT_WALL`, `NOT_AT_GOAL`, `MISSED_ITEMS`, `NEED_KEY`, `NEED_FRIEND`.
**Vật phẩm nhiệm vụ và "lặp đến khi đã tới đích":** Măng đi xuyên `G` khi còn thiếu vật phẩm, mà `đã tới đích?` đúng khi đứng ở `G` bất kể vật phẩm; nên không soạn màn mê cung có `goal.items` (hoặc `goal.collectAll`) cùng `lặp đến khi đã tới đích` (curriculum.md §5.5 D9).
**`predictAnswer`:** `win` · `stop@r,c` · `missed@r,c` · `crash:HIT_WALL@r,c` (ô Măng đang đứng khi đâm) · `timeout` (vòng lặp không dừng, T9). Cảm biến ghi `sense` như runner (§2.1).

**Thiết kế màn:** đường đi kéo dài quá điểm xuất phát và đích (bài học từ Blockly Games: mục tiêu là tới đích, không phải đi hết mọi ô).
**Sprite:** cần thêm đi lên / đi xuống (task P0-08). Trước khi có, tạm lật sprite ngang + mũi tên chỉ hướng.

### 3.3 `robotlab` — Phòng thí nghiệm Robot · **GĐ 3** (Thế giới 6)

> Đặc tả v1 (P3-01a/b), viết 07/10/2026, sửa cùng ngày theo review độc lập và quyết định của điều phối (gắp / thả **tại ô Bíp đứng**, khối rẽ tên "rẽ trái / rẽ phải", không thắng giữa chương trình). Mọi con số (điểm, giây, sa bàn) là **gần đúng** (`product/airoc-2026.md` §4): nằm trong dữ liệu, sửa khi HLV gửi luật thật (P3-07), không sửa code. Thói quen AIROC cần dạy: đếm ngã tư trên lưới line, quay tại chỗ rồi mới đi, tay gắp giữ **một** khối, lập thứ tự nhiệm vụ, kết thúc ở phòng thí nghiệm, ngân sách thời gian.

**Góc nhìn:** từ trên xuống, sa bàn là **lưới ngã tư của đường line đen**. Mỗi ô của bản đồ là **một ngã tư**; hai ô kề nhau (không phải `#`) nối với nhau bằng một đoạn line. Nhân vật được lập trình là **robot Bíp** (giống Leanbot), không phải Măng; Măng đứng cạnh sa bàn dẫn chuyện. Trong lời nói cho bé ở W6, **"khối"** chỉ là khối thi đấu (rào, trung hòa, ô nhiễm); khối Blockly gọi là **"lệnh"** / **"chương trình"** (`glossary.md`).

**Khác `maze` ở ba điểm (bài mở đầu W6 dạy):**
1. **Không thắng giữa chương trình** (khác luật A1 của runner/maze; ADR ở P3-01b). Bíp làm **hết mọi lệnh** rồi mới chấm, như robot thật. Về tới phòng giữa chừng rồi đi tiếp thì không còn "ở nhà". Vì vậy `lặp 20 lần` không thay được `lặp đến khi`.
2. **Tiến N ô** là một lệnh (số chọn trên khối), Bíp **dừng ở từng ngã tư** nó đếm (event `move` cho từng ô).
3. **Đồng hồ ảo**: mỗi hành động tốn vài giây; hết giờ thì Bíp dừng.

Lệnh rẽ giữ **đúng tên và nghĩa của mê cung**: "rẽ trái / rẽ phải" = quay 90° tại chỗ, chưa đi. Bé đã biết từ W1, nên W6 không có bài riêng cho rẽ.

**Config** (zod ở `packages/games/src/robotlab/config.ts`):
```ts
const ROBOT_TILES = ['#', '.', 'L', 'Z', 'r', 'y', 'g'] as const;
// '#' nhà (không có line, không vào được) · '.' ngã tư · 'L' phòng thí nghiệm (đúng 1)
// 'Z' ô vùng ô nhiễm (cần khoanh) · 'r' 'y' 'g' trạm xử lý màu đỏ / vàng / xanh lá
const ROBOT_COLORS = ['RED', 'YELLOW', 'GREEN'] as const;            // nhãn: đỏ · vàng · xanh lá
const ROBOT_BLOCK_KINDS = ['fence', 'neutralizer', 'pollution'] as const;
// fence = khối rào (màu trung tính, không có `color`) · neutralizer = khối trung hòa · pollution = khối ô nhiễm

type Cell = [number, number];                                        // [hàng, cột], hàng 0 ở trên
type RobotBlock =
  | { kind: 'fence' }
  | { kind: 'neutralizer' | 'pollution'; color: RobotColor };

/** level.config như trong file nội dung (luật chung chưa gộp). */
interface RobotLabLevelConfig {
  map: string[];               // 3–9 hàng × 3–9 cột, các hàng dài bằng nhau
  startDir: 'N' | 'E' | 'S' | 'W';
  start?: Cell;                // ngã tư xuất phát (không phải '#', không có khối); mặc định: ô 'L'
  startHolding?: RobotBlock;   // Bíp cầm sẵn một khối lúc xuất phát (W6 `l16`, `l17`: đề đổi màu)
  blocks?: (RobotBlock & { at: Cell })[];          // ≤ 8 khối trên sa bàn
  goal:
    | { type: 'missions'; mustReturn?: boolean }   // màn thường: xong mọi việc (+ về phòng nếu mustReturn)
    | { type: 'score'; target: number };           // màn chọn việc / boss: đủ điểm trong thời gian
  rules?: {                    // ghi đè luật chung (chỉ khi màn cần)
    timeLimit?: number;        // giây, 1–600
    costs?: Partial<{ forward: number; turn: number; grab: number; release: number }>;
    points?: Partial<{ contain: number; neutralize: number; retrieve: number; return: number }>;
  };
}
/** Config chạy được: `rules` đã gộp đủ mọi trường. */
type RobotLabConfig = Omit<RobotLabLevelConfig, 'rules'> & { rules: Required<…> /* đủ timeLimit, costs, points */ };
```
**Luật chung là dữ liệu** (`content/shared/robotlab.json`, schema export từ `robotlab/config.ts`):
```json
{ "timeLimit": 120,
  "costs":  { "forward": 2, "turn": 1, "grab": 2, "release": 2 },
  "points": { "contain": 45, "neutralize": 160, "retrieve": 100, "return": 40 } }
```
- **Một hàm gộp duy nhất** `resolveRobotlabRules(levelConfig, shared): RobotLabConfig` (thuần, export từ `@codequest/games`). `configSchema` của kiểu game (luật 1 của `content:check`, editor) kiểm `RobotLabLevelConfig`; `createState` chỉ nhận config **đã gộp** và parse bằng `robotlabResolvedSchema` (mọi trường `rules` bắt buộc), nên quên gộp là lỗi to (`INTERNAL_ERROR: robotlab config not resolved`), không bao giờ âm thầm chạy luật sai. Nơi gọi (P3-01a liệt kê và test từng chỗ): bộ nạp nội dung của web (màn, **thẻ `demo` bài giảng**), `runLevel` của màn `predict` (khóa đáp án), `AnswerPicture`, factory của `RobotLabStage`, `tools/content-check`, `tools/par`, level editor **và worker vét cạn của editor**, helper test (`resolvedFixture`).
- `forward` tính **mỗi ngã tư** đi được. Câu hỏi (cảm biến) **không tốn giờ** ở v1 (không có `costs.sense`: cảm biến không được đổi state, `game-kind-sdk.md` §1 luật 6).
- Điểm tính **mỗi việc**: mỗi ô `Z` có rào 45, mỗi khối trung hòa nằm trên trạm cùng màu 160, mỗi khối ô nhiễm đã vào phòng 100, kết thúc ở `L` 40.

Schema kiểm (`superRefine`): kích thước 3–9, chỉ có ký tự của `ROBOT_TILES`, đúng 1 `L`; `start` không phải `#`; mỗi khối nằm trên ô `.`, không trùng nhau, không trùng `start`; `fence` **không** có `color`, `neutralizer`/`pollution` **bắt buộc** `color`; số `fence` ≥ số ô `Z`; **mỗi màu: số trạm ≥ số khối trung hòa màu đó** (kể cả `startHolding`); `missions` cần ít nhất một việc (`Z`, `neutralizer`, `pollution`) hoặc `mustReturn: true`; `score.target` ≥ 1. Trạm thừa (nhiều trạm hơn khối) được phép: dùng làm trạm "nhử".

**Trạng thái** (dữ liệu thuần): `pos`, `dir`, `elapsed` (giây đã dùng), `crashAt`, và `blocks`: mảng **giữ nguyên chỉ số theo config** (`startHolding` là phần tử 0 nếu có, rồi tới `blocks`), mỗi phần tử `{ kind, color?, where }` với `where` là `{ at: Cell }` (nằm trên sa bàn) · `'held'` (trong tay gắp, nhiều nhất một) · `'done'` (đã vào phòng thí nghiệm). Việc đã xong **tính từ `where`** (không lưu cờ riêng).

**Lệnh** (câu ở cột cuối là tooltip **đúng từng chữ**; gợi ý `enter` của màn đầu tiên dùng lệnh là "Lệnh mới! " + đúng câu này; bài "Khối mới" và `glossary.md` dùng lại câu này, `conventions/content-authoring.md` §5.1; không dùng chữ N trong câu cho bé):

| Khối | Nhãn | API | Bíp có đi? | Tooltip |
|---|---|---|---|---|
| `robot_forward` | tiến [3] ô (ô **số** `field_number` 1–9, mặc định 1; không phải ô cắm, nên không cần capacity guard) | `forward(n, id)` | đi đúng số ngã tư, dừng ở từng ngã tư đếm được | Tiến 3 ô: dừng ở ngã tư thứ 3 |
| `robot_turn_left` / `robot_turn_right` | rẽ trái / rẽ phải | `turn('LEFT' \| 'RIGHT', id)` | **không đi**, quay 90° | Quay sang trái (phải) tại chỗ, chưa đi (giống hệt mê cung) |
| `robot_grab` | gắp | `grab(id)` | **đứng yên** | Gắp khối ở chỗ Bíp đứng |
| `robot_release` | thả | `release(id)` | **đứng yên** | Thả khối xuống chỗ Bíp đứng |
| `robot_line_ahead` | phía trước có line? | `lineAhead(id)` → boolean | câu hỏi | ✔ khi phía trước Bíp có line, ✘ khi không |
| `robot_block_color` | khối ở chỗ Bíp màu [đỏ ▾ / vàng ▾ / xanh lá ▾]? | `blockColor(color, id)` → boolean | câu hỏi | ✔ khi khối ở chỗ Bíp có màu con chọn, ✘ khi không |
| `robot_at_lab` | đã về phòng thí nghiệm? | `atLab(id)` → boolean | câu hỏi | ✔ khi Bíp đứng ở phòng thí nghiệm, ✘ khi chưa |
| `robot_holding` | đang gắp khối? | `holding(id)` → boolean | câu hỏi | ✔ khi tay gắp đang giữ khối, ✘ khi tay trống |

- **Luật cho bé về khối trên đường** (bài `w06-lesson-gap`, gợi ý `HIT_BLOCK`): "Bíp không đi xuyên qua khối. Muốn gắp thì dừng đúng ô có khối."
- "khối ở chỗ Bíp" = khối Bíp **đang gắp**, hoặc (tay trống) khối **nằm ở ngã tư Bíp đứng**. Khối rào không có màu nên mọi lựa chọn đều ✘.
- `đang gắp khối?` có trong bộ lệnh nhưng **không nằm trong thanh khối màn nào của W6** (luật 7: chưa được giới thiệu); W7 giới thiệu khi cần.
- Luật 7 coi `robot_turn_*` là loại khối mới (khác `maze_turn_*`): màn đầu tiên dùng (`l03`) có gợi ý `enter` nhắc đúng nhãn và tooltip mê cung ("Rẽ phải: quay sang phải tại chỗ, chưa đi.").
- Nhãn `tiến %1 ô` có ô số ở giữa: bộ so nhãn `ACTION_LABELS` của luật 7 (`tools/content-check`) phải **gộp khoảng trắng** khi bỏ ô số ("tiến  ô" → "tiến ô"), sửa ở P3-01b; gợi ý viết đúng nhãn bé thấy ("tiến 3 ô").
- Khối điều khiển dùng lại của engine (§2.1): `cq_repeat`, `cq_if`, `cq_if_else`, `cq_repeat_until`. Generator: lệnh gọi đúng **một** API lệnh; câu hỏi gọi đúng một API câu hỏi, block id là tham số cuối (`game-kind-sdk.md` §1 luật 6, §4).

**Thứ tự cố định của mọi hành động** (một chỗ duy nhất trong `sim.ts`, có unit test riêng):
1. **Kiểm ô** theo bảng dưới. Không hợp lệ → emit event thất bại, `stop('crash', REASON)`; Bíp đứng yên, **không** trừ giờ.
2. **Kiểm giờ**: `elapsed + cost > timeLimit` → emit `timeUp{at, t: elapsed}` rồi dừng (`missions` → `incomplete` / `OUT_OF_TIME`; `score` → chấm điểm ngay: đủ `target` → `success`, thiếu → `incomplete` / `LOW_SCORE`). Hành động **không** được làm.
3. **Làm**: cộng `cost` vào `elapsed` **đúng một lần**, đổi state, emit event (mang `t` = `elapsed` mới).

`tiến N` là N lần liên tiếp bước 1–3, mỗi lần một ngã tư (`cost` = `costs.forward`): hỏng ở ngã tư thứ k thì k−1 `move` đã diễn. Câu hỏi không qua bước 2–3 (không tốn giờ).

**Bảng kiểm ô** (`p` = ngã tư Bíp đứng, `t` = ngã tư kế theo `dir`):

| Hành động | Hợp lệ khi | Không hợp lệ |
|---|---|---|
| **tiến**, mỗi ngã tư | `t` trong sa bàn, không phải `#`, và: `t` **không có khối**; **hoặc** `t` có khối, đây là ngã tư **cuối** của lệnh **và** tay trống (Bíp dừng **trên** ô có khối) | `t` là `#` / ngoài sa bàn → `OFF_LINE` (`bump{into:'offLine'}`) · `t` có khối mà còn ngã tư phải đi, hoặc tay đang giữ khối → `HIT_BLOCK` (`bump{into:'block'}`) |
| **rẽ** | luôn | — |
| **gắp** | tay trống **và** ô `p` có khối | tay đang giữ → `HANDS_FULL` · ô `p` không có khối → `NOTHING_TO_GRAB` (`gripFail`) |
| **thả** | tay giữ khối, ô `p` không có khối, và theo bảng "Thả ở đâu" | tay trống → `HANDS_EMPTY` · ô `p` đã có khối → `CELL_TAKEN` (chỉ xảy ra khi màn cho Bíp vừa cầm sẵn vừa đứng trên khối; schema chặn `start` trùng khối nên thực tế không gặp) · sai chỗ → bảng dưới |

**Thả ở đâu** (ô `p` = chỗ Bíp đứng):
| Ô `p` \ khối đang giữ | `fence` | `neutralizer` màu c | `pollution` |
|---|---|---|---|
| `.` | nằm ở `p` | nằm ở `p` | nằm ở `p` |
| `L` | → `WRONG_PLACE` | → `WRONG_PLACE` | **thu hồi**: `where = 'done'` (khối biến vào phòng) |
| `Z` | nằm ở `p`: **khoanh vùng** xong 1 ô | → `WRONG_PLACE` | → `WRONG_PLACE` |
| trạm màu c | → `WRONG_PLACE` | nằm ở `p`: **trung hòa** xong 1 khối | → `WRONG_PLACE` |
| trạm màu khác c | → `WRONG_PLACE` | → `WRONG_COLOR` | → `WRONG_PLACE` |

- Khối đã đặt (rào trên `Z`, trung hòa trên trạm, khối để trên `.`) là vật cản như mọi khối: Bíp đứng trên nó được (vừa thả xong, hoặc dừng ở ô đó tay trống), đi **xuyên qua** thì `HIT_BLOCK`. Gắp lại khối đã đặt là hợp lệ: việc đó trở lại "chưa xong". `L` không bao giờ có khối.
- Câu hỏi chỉ đọc state, trả boolean qua `ctx.sense` (không emit, không stop, không đổi state; `sense` vẫn tính vào `maxActions`). `lineAhead`: `t` trong sa bàn và không phải `#` (có khối vẫn ✔). `blockColor(c)`: khối "ở chỗ Bíp" (đang gắp, hoặc nằm ở `p`) có `color === c`. `atLab`: `p` là `L` (✔ ngay lúc xuất phát ở `L`, nên `lặp đến khi đã về phòng thí nghiệm` xuất phát từ `L` chạy **0 vòng**). `holding`: có phần tử `'held'`.
- **Vòng lặp không dừng**: thân có lệnh tốn giờ thì **hết giờ trước** (`OUT_OF_TIME`); chỉ vòng chỉ có câu hỏi / thân rỗng mới ra `TIMEOUT` của engine. Màn W6 có vòng lặp khai báo `level.feedback.TIMEOUT` = "Bíp hỏi mãi mà không làm gì. Vòng lặp không dừng!" (câu chung "Măng chóng mặt…" không hợp với Bíp) và gợi ý `lastReason: OUT_OF_TIME` riêng "Hết giờ khi đang lặp. Vòng lặp có dừng không?".

**Chấm khi hết chương trình** (`evaluate`):
- `missions`: còn ô `Z` chưa có rào, còn khối trung hòa chưa nằm trên trạm cùng màu, hoặc còn khối ô nhiễm chưa `'done'` → `incomplete` / `MISSIONS_LEFT` (xét trước). Xong hết mà `mustReturn` và `p` không phải `L` → `incomplete` / `NOT_HOME`. Ngược lại `success`.
- `score`: điểm = `contain` × số ô `Z` có rào + `neutralize` × số khối trung hòa đúng trạm + `retrieve` × số khối ô nhiễm `'done'` + (`return` nếu `p` là `L`). ≥ `target` → `success`, ngược lại `incomplete` / `LOW_SCORE`. Không có `MISSIONS_LEFT`/`NOT_HOME`.
- Crash ở mọi chế độ là thua (không chấm điểm).

**Event** (`events.ts`; mọi event có `blockId`; event hành động mang `t` = `elapsed` sau hành động, để sân chơi chạy đồng hồ mà không đọc state):
`move{from, to, dir, t}` (một ngã tư) · `turn{from, to, t}` · `bump{at, dir, into: 'offLine' | 'block'}` (Bíp ở `at`, không có `move` đi trước) · `grab{at, block, index, t}` · `release{at, block, index, result: 'placed' | 'contained' | 'neutralized' | 'retrieved', t}` · `gripFail{at, reason}` (`NOTHING_TO_GRAB`, `HANDS_FULL`, `HANDS_EMPTY`, `CELL_TAKEN`, `WRONG_PLACE`, `WRONG_COLOR`) · `timeUp{at, t}`. `index` = chỉ số cố định của khối. **Không có event `win`**: sân chơi diễn ăn mừng / bảng điểm trong `finish(outcome)` (`game-kind-sdk.md` §2). Điểm tính lại được từ `release.result`, `grab` (gắp lại khối đã đặt), vị trí cuối và `rules.points`.

**reasonCodes:** `OFF_LINE`, `HIT_BLOCK`, `NOTHING_TO_GRAB`, `HANDS_FULL`, `HANDS_EMPTY`, `CELL_TAKEN`, `WRONG_PLACE`, `WRONG_COLOR`, `OUT_OF_TIME`, `MISSIONS_LEFT`, `NOT_HOME`, `LOW_SCORE` (cộng `TIMEOUT` chung). Câu cho `content/shared/feedback.json` (luật 17):

| Mã | Câu (≤ 12 chữ) |
|---|---|
| `OFF_LINE` | Phía trước không có line. Bíp lạc rồi! |
| `HIT_BLOCK` | Ối, đụng khối! Bíp không đi xuyên qua khối. |
| `NOTHING_TO_GRAB` | Chỗ này không có khối để gắp. |
| `HANDS_FULL` | Tay gắp đang bận. Thả khối cũ trước nhé! |
| `HANDS_EMPTY` | Tay gắp trống, chưa có gì để thả. |
| `CELL_TAKEN` | Chỗ này có khối rồi. Thả chỗ khác nhé! |
| `WRONG_PLACE` | Khối này không đặt ở đây. |
| `WRONG_COLOR` | Sai màu rồi! Trạm cần khối cùng màu. |
| `OUT_OF_TIME` | Hết giờ rồi! Tìm đường ngắn hơn nhé. |
| `MISSIONS_LEFT` | Còn việc chưa xong kìa! |
| `NOT_HOME` | Xong việc rồi, nhưng Bíp chưa về phòng. |
| `LOW_SCORE` | Chưa đủ điểm. Chọn việc nhiều điểm hơn nhé! |

**`predictAnswer`:**
- `missions`: `win` · `stop@r,c` (hết chương trình, `MISSIONS_LEFT` hoặc `NOT_HOME`) · `crash:<REASON>@r,c` (`r,c` = ngã tư **Bíp đứng** khi lỗi) · `outOfTime@r,c` · `timeout`.
- `score`: `score:<điểm>` (hết chương trình hoặc hết giờ, thắng hay thua) · `crash:<REASON>@r,c` · `timeout`. Ví dụ `score:160`.

Hình đáp án (`AnswerPicture`, dùng config đã gộp): sa bàn thu nhỏ, Bíp ở ô của khóa; `outOfTime` thêm đồng hồ cát; `score:` vẽ bảng điểm.

**Mục tiêu sao:** robotlab v1 **không** cài `checkStarGoal` (luật 19: màn robotlab không có `starGoals`). W6 không cần: đánh đổi "nhiều cách giải" nằm ở `par` và ở màn `score`. Thêm loại mục tiêu khi một màn thật sự cần (ADR-0017).

**Vét cạn `par`** (`game-kind-sdk.md` §4): luật trên giữ điều kiện 1–4. `elapsed` **nằm trong state** (cần cho luật hết giờ) dù là bộ đếm tăng dần (điều kiện 6 cảnh báo mất gộp trạng thái). Không thêm cơ chế gộp riêng: P3-01b **đo trước** (`npm run par` trên màn mẫu và trên bản nháp `l19`, boss; ghi số trạng thái và thời gian vào ADR). Chỉ khi quá chậm mới tính cách khác, bằng ADR riêng.

**Thiết kế màn:** sa bàn nhỏ trước (3×3 tới 3×5), tới thử thách 3×5 nhiều bản đồ; sa bàn kiểu đề thi 7×7 chỉ ở màn sáng tạo. Màn `score` đặt `rules.timeLimit` nhỏ theo sa bàn (14–34 s) để thời gian **thật sự** ép phải chọn việc. "Đề ngẫu nhiên" ở v1 = màn nhiều bản đồ (ADR-0016) khác **màu khối**; một chương trình phải thắng mọi bản đồ. Nút "Đề mới" sinh sa bàn bằng `rng` có seed để sau (P3-08).

**Sprite:** robot Bíp nhìn từ trên xuống 4 hướng (đi 2 khung, tay gắp mở/đóng, lắc đầu khi lỗi, vui), khối rào (xám, sọc) / trung hòa (tròn) / ô nhiễm (chấm) theo màu, trạm 3 màu, ô vùng ô nhiễm, phòng thí nghiệm, nhà. Bản tạm vẽ bằng `PIXI.Graphics` theo lưới pixel (P3-03) để không chặn nội dung; bản đẹp theo `playbooks/add-asset.md` (P3-02).

### 3.4 `turtle` — Họa sĩ · GĐ 4 (Thế giới 8–9)
Bút vẽ trên canvas. Khối: `turtle_move(n)`, `turtle_turn(deg)`, `turtle_pen(up|down)`, `turtle_color`. Chấm bằng so sánh ảnh với ảnh mẫu (kênh alpha, ngưỡng sai khác như Blockly Games Turtle).

### 3.5 `farm` — Nông trại · GĐ 4 (Thế giới 7)
Lưới ô có cây trồng mang số quả. Khối: đi/rẽ, `farm_harvest`, `farm_fruit_count`, biến. Chấm: trạng thái cuối + giá trị biến (vd "đếm đúng tổng số quả").
> Đề xuất 07/10/2026 (`curriculum.md` §6.2): Thế giới 7 dạy biến trên `maze` và `robotlab` bằng khối biến chung của engine; `farm` dời sau (cần khối số cắm vào ô, tức capacity guard).

### 3.6 `sorter` — Băng chuyền · GĐ 4 (Thế giới 7, 10)
Đồ vật lần lượt chạy qua băng chuyền. Khối: `sorter_color_is`, `sorter_shape_is`, `sorter_push(left|right)`, danh sách, đổi chỗ (thuật toán sắp xếp). Chấm: mọi vật vào đúng thùng / danh sách cuối đã sắp xếp.

### 3.7 `music` — Nhạc công · GĐ 4 (Thế giới 8)
Ghép nốt theo giai điệu mẫu. Khối: `music_play(note, length)`, `music_rest`. Chấm: so chuỗi nốt với mẫu.

## 4. Thêm một kiểu game mới
Xem `docs/playbooks/add-game-kind.md` và hợp đồng kỹ thuật ở `docs/architecture/game-kind-sdk.md`.
