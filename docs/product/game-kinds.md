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
| `parsons` | Ghép hình | Các khối đã có sẵn nhưng xáo trộn, bé sắp xếp lại | `evaluate()` | Khối lời giải xáo trộn; thanh khối trống |
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
  goal?: { collectAll?: boolean };   // mặc định false; collectAll: true thì bamboo phải có ≥ 1 măng
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
- **Tới cờ:** ngay khi Măng dừng ở ô `flag`, lượt chạy **kết thúc**: nếu `goal.collectAll` và còn măng chưa nhặt → emit `missed` (thay cho `win`), `incomplete` / `MISSED_ITEMS`; ngược lại → emit `win`, `success`. Vì cờ luôn là ô cuối, Măng không bao giờ đi quá đường.
- **Hết chương trình** mà chưa tới cờ → `incomplete` / `NOT_AT_GOAL`.
- **Cảm biến** `isAhead(kind)` nhìn ô p+1: `HOLE`/`BRANCH`/`CRATE` đúng khi ô đó đúng loại; `CLEAR` đúng khi ô đó là `ground` hoặc `flag`. Ô p+1 nằm ngoài đường → mọi giá trị đều `false`. `atGoal` đúng khi ô p là cờ (không bao giờ trong lúc chạy). Mỗi lần cảm biến được hỏi, engine ghi event `sense{blockId, value}` (§2.1).

**Event** (`events.ts`, mọi event có `blockId`): `walk{from,to}` · `crouch{from,to}` · `jump{from,to}` · `kick{at,hit}` · `collect{at}` · `fall{at}` · `bump{from,at,obstacle:'branch'|'crate',move:'walk'|'crouch'|'jump'}` · `offTrack{from}` · `win{at}` · `missed{at,left:number[]}` (`left` = các ô còn măng). Thứ tự, ý nghĩa từng trường: `architecture/game-kind-sdk.md` §1.1.

**reasonCodes:** `FELL_IN_HOLE`, `HIT_BRANCH`, `HIT_CRATE`, `OFF_TRACK`, `NOT_AT_GOAL`, `MISSED_ITEMS`.

**`predictAnswer`:** `win` · `stop@<ô>` (hết chương trình ở ô đó) · `missed@<ô cờ>` · `crash:<REASON>@<ô>` (ô nơi xảy ra va chạm) · `timeout` (vòng lặp không dừng, T9). Ví dụ `crash:FELL_IN_HOLE@3`.

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
  goal?: { collectAll?: boolean };
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
| tiến vào `.`, `S`, `b`, `G` | Sang ô đó (dừng ở ô có măng → `collect`) |
| tiến vào `#` hoặc ra ngoài bản đồ | emit `bump` → crash `HIT_WALL` |
| rẽ | đổi hướng, emit `turn` |
| **Tới `G` giữa chương trình** | Nếu đã đủ điều kiện (không `collectAll`, hoặc đã nhặt hết) → `success` **ngay lập tức** (giống Blockly Games). Nếu chưa nhặt hết → đi tiếp như ô thường |
| Hết chương trình | Đứng ở `G` nhưng còn măng → `incomplete` / `MISSED_ITEMS`; không ở `G` → `incomplete` / `NOT_AT_GOAL` |

**Event:** `move{from:[r,c],to:[r,c],dir}` · `turn{from,to}` · `bump{at:[r,c],dir}` · `collect{at}` · `win{at}`.
**reasonCodes:** `HIT_WALL`, `NOT_AT_GOAL`, `MISSED_ITEMS`.
**`predictAnswer`:** `win` · `stop@r,c` · `missed@r,c` · `crash:HIT_WALL@r,c` (ô Măng đang đứng khi đâm) · `timeout` (vòng lặp không dừng, T9). Cảm biến ghi `sense` như runner (§2.1).

**Thiết kế màn:** đường đi kéo dài quá điểm xuất phát và đích (bài học từ Blockly Games: mục tiêu là tới đích, không phải đi hết mọi ô).
**Sprite:** cần thêm đi lên / đi xuống (task P0-08). Trước khi có, tạm lật sprite ngang + mũi tên chỉ hướng.

### 3.3 `robotlab` — Phòng thí nghiệm Robot · **GĐ 3** (Thế giới 6)
- **Góc nhìn:** từ trên xuống, sa bàn kiểu Synapse City (lưới khu vực A–H + CRL).
- **Robot:** có hướng, tay gắp (đang cầm 0/1 khối), cảm biến line, cảm biến vật cản, cảm biến màu.
- **Khối:** `robot_forward(n)`, `robot_turn(left|right)`, `robot_follow_line_to_junction`, `robot_grab`, `robot_release`, `robot_color_is(color)`, `robot_obstacle_ahead`, `robot_at(zone)`.
- **Nhiệm vụ:** `containment` (đưa khối xanh lá/xanh dương/tím vào vùng khoanh của khu vực) · `neutralization` (ghép khối trung hòa đúng màu) · `analysis` (đưa khối đỏ/vàng về CRL) · `return` (kết thúc trong CRL).
- **Chấm:** bảng điểm theo luật AIROC (45/160/100/40), có đồng hồ ảo 120 s hoặc 180 s tính theo số hành động × thời gian mỗi hành động.
- **Đề ngẫu nhiên:** cấu hình sinh bằng `rng` có seed, để lặp lại được khi chấm và khi xem lại.

### 3.4 `turtle` — Họa sĩ · GĐ 4 (Thế giới 8–9)
Bút vẽ trên canvas. Khối: `turtle_move(n)`, `turtle_turn(deg)`, `turtle_pen(up|down)`, `turtle_color`. Chấm bằng so sánh ảnh với ảnh mẫu (kênh alpha, ngưỡng sai khác như Blockly Games Turtle).

### 3.5 `farm` — Nông trại · GĐ 4 (Thế giới 7)
Lưới ô có cây trồng mang số quả. Khối: đi/rẽ, `farm_harvest`, `farm_fruit_count`, biến. Chấm: trạng thái cuối + giá trị biến (vd "đếm đúng tổng số quả").

### 3.6 `sorter` — Băng chuyền · GĐ 4 (Thế giới 7, 10)
Đồ vật lần lượt chạy qua băng chuyền. Khối: `sorter_color_is`, `sorter_shape_is`, `sorter_push(left|right)`, danh sách, đổi chỗ (thuật toán sắp xếp). Chấm: mọi vật vào đúng thùng / danh sách cuối đã sắp xếp.

### 3.7 `music` — Nhạc công · GĐ 4 (Thế giới 8)
Ghép nốt theo giai điệu mẫu. Khối: `music_play(note, length)`, `music_rest`. Chấm: so chuỗi nốt với mẫu.

## 4. Thêm một kiểu game mới
Xem `docs/playbooks/add-game-kind.md` và hợp đồng kỹ thuật ở `docs/architecture/game-kind-sdk.md`.
