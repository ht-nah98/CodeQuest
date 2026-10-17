# ADR-0025: Kiểu game `sorter` ("Kệ sách"): hàng sách có số, tay ở một chỗ, đổi chỗ với sách bên phải, chấm khi hết chương trình, lượt hỏi là ngân sách

- **Trạng thái:** Đề xuất
- **Ngày:** 16/10/2026 (bản nháp của P5; chốt sau P5-02, khi có số đo vét cạn)

## Bối cảnh
Thế giới 10 "🧠 Học Viện Thuật Toán" dạy **thuật toán**: tìm kiếm lần lượt, sắp xếp nổi bọt, so sánh hai cách đúng (`product/curriculum.md` §6.5). Khung cũ ghi kiểu game `sorter` ("Băng chuyền": đồ vật chạy qua, đẩy trái / phải, `game-kinds.md` §3.6). Bản đó chưa có thiết kế, chưa xếp lịch, và không dạy được sắp xếp: đồ vật chạy qua một lần, bé không quay lại được.

Những gì đã có:
- `GameKindId` đã có `'sorter'` (`packages/content-schema/src/runtime.ts`).
- SDK kiểu game (`GameKindDefinition`: `createState`, `createApi`, `evaluate`, `predictAnswer`). Vét cạn chung theo `stateKey(state)` (`validator/src/search/sim.ts`). Mỗi ô số ghim là một mục catalogue (như `robot_forward`).
- Chấm khi hết chương trình, đồng hồ trong state (`robotlab`, ADR-0021). Màn nhiều bản đồ (ADR-0016). Hộp và `countGoal` (ADR-0022). Phép có hộp (ADR-0023). Lặp lồng và `maxLoopDepth` (W9).
- Luật HLV (cố định):
  - mọi ý mới cần câu luật cho bé, ví dụ chạy được và tooltip đúng từng chữ;
  - giao diện nói "khối", tooltip nói "lệnh";
  - chữ cho bé ≤ 12 chữ, số bằng chữ số.

Ràng buộc: package headless (ADR-0006), tất định, khối chỉ có ô số / ô chọn để không cần capacity guard (ADR-0022, P4-07 chưa bật).

## Quyết định

### 1. Mô hình
- Một **kệ** gồm `n` sách (2 ≤ n ≤ 7). Mỗi sách có một số nguyên 1–9; sân chơi vẽ sách **cao theo số**.
- **Tay** (của Bíp) ở chỗ `p ∈ 1…n + 1`. Chỗ `n + 1` là **cờ cuối kệ**, không có sách. Bắt đầu `p = 1`.
- Danh sách **không** là kiểu dữ liệu của engine: không có khối "phần tử thứ i", không có biến danh sách. Kệ là trạng thái của kiểu game, như mê cung.

### 2. Config (zod, `packages/games/src/sorter/config.ts`)
```ts
{
  books: number[];            // 2–7 số, mỗi số 1–9
  goal: {
    sorted?: true;            // kệ tăng dần lúc hết chương trình
    find?: number;            // tay dừng ở sách số này (1–9)
    end?: true;               // tay ở cờ cuối kệ
  };                          // ≥ 1 mục; không có cả find và end
  maxQuestions?: number;      // 1–60; không có = không giới hạn
}
```
Bản đồ của `variants` (ADR-0016) được khác độ dài kệ.

### 3. Khối (`blocks.ts`, category `sorter`, nhóm thanh khối "KỆ SÁCH")
Nhãn và tooltip đúng từng chữ `curriculum.md` §6.5. Tooltip bắt đầu bằng nhãn và không nêu tên nhân vật.

| Khối | Nhãn | Field | Hành vi |
|---|---|---|---|
| `sorter_right` | sang phải | — | `p < n + 1` → `p + 1`; ở cờ → `crash` / `OFF_SHELF` |
| `sorter_to_start` | về đầu kệ | — | `p = 1` |
| `sorter_swap` | đổi chỗ | — | `p ≤ n − 1` → đổi sách `p`, `p + 1`; tay đứng yên; không thì `crash` / `NO_BOOK_RIGHT` |
| `sorter_bigger` | sách này lớn hơn bên phải? | — (khối hỏi) | `p ≤ n − 1` và `books[p] > books[p + 1]` → ✔; không thì ✘. Tốn 1 lượt hỏi |
| `sorter_book_is` | sách này [= ▾] [7]? | `OP` (`EQ` / `GT` / `LT`), `NUM` 1–9 (khối hỏi) | `p ≤ n` và so đúng → ✔; ở cờ → ✘. Tốn 1 lượt hỏi |
| `sorter_at_end` | hết kệ? | — (khối hỏi) | `p = n + 1`. Không tốn lượt hỏi |

Mục thanh khối **ghim** `OP` và `NUM` của `sorter_book_is` (vét cạn chỉ thử số ghim, như luật 23 (a)).

### 4. Event, mã lý do, chấm
- **Event:**
  - `move{from, to}`;
  - `swap{at, books}` (`books` là kệ sau khi đổi, để sân chơi không phải tự tính);
  - `outOfQuestions{at}`;
  - khối hỏi ghi `sense` chung (ADR-0018).
  - Mọi event tính vào `maxActions`.
- **Lượt hỏi:** state có `questions`. Câu hỏi thứ `maxQuestions + 1` → `crash` / `OUT_OF_QUESTIONS`, ghi trước khi trả lời.
- **Chấm khi hết chương trình** (như `robotlab`, ADR-0021). Thứ tự kiểm: `sorted` → `NOT_SORTED`; `find` → `NOT_FOUND`; `end` → `NOT_AT_END`. Tất cả là `incomplete`.
- **`reasonCodes`:** `OFF_SHELF`, `NO_BOOK_RIGHT`, `OUT_OF_QUESTIONS`, `NOT_SORTED`, `NOT_FOUND`, `NOT_AT_END`.
- `countGoal` (ADR-0022) dùng được như mọi kiểu game: thắng = mục tiêu kệ đạt **và** hộp đúng số.
- **Không có `checkStarGoal`** ở bản đầu (như robotlab v1). Đánh đổi nằm ở `par` và `maxQuestions`.

### 5. Khóa đoán
- `shelf:<số, nối bằng ,>@<p>`, vd `shelf:2,4,1,3,5@5`, `shelf:3,1,2@4` (tay ở cờ);
- `crash:<REASON>@<p>`;
- `timeout`.
- Màn có hộp nối đuôi `#<id>=<n>` như ADR-0022.
- `AnswerPicture` vẽ lại kệ và tay từ khóa.

### 6. Vét cạn
- State là `{ books, p }`. Thêm `questions` **chỉ khi** màn có `maxQuestions`, để màn không có ngân sách vẫn gộp trạng thái được.
- Không gian nhỏ: ≤ 7! thứ tự × 8 chỗ × ≤ 61 số lượt, nhân thêm giá trị các hộp (`vars`, ADR-0022) ở màn có hộp (`l05`, `l06`, `l16`; hộp ≤ 9).
- Màn `find` sau `sorted`: sách cần tìm phải ở chỗ khác nhau trên các kệ đã xếp (luật soạn S1), nếu không `lặp k {sang phải}` thay được câu hỏi tìm và `par` sai.
- Không cần cơ chế tìm riêng: catalogue lấy từ thanh khối, như mọi kiểu game.
- **P5-02 đo** `npm run par` trên 4 màn phác:
  - `l10` (lặp lồng có `nếu`, 3 kệ);
  - `l13` (phép có hộp + `maxQuestions`);
  - `l16` (`parsons` dừng sớm, 11 khối);
  - boss (kệ dài ngắn khác nhau, 12 khối).
  - Ghi số trạng thái, thời gian, heap vào mục "Kết quả đo" dưới.
  - Màn vượt ngân sách vét cạn thì đặt `parUnproven` (ADR-0023), dùng `par` tay.

### 7. Kiểm chứng (`content:check` luật 27, `tools/content-check/src/sorter.ts`)
- Số sách, số trên sách trong khoảng.
- `sorted`: không có 2 sách cùng số, và không bản đồ nào đã xếp sẵn.
- `find`: số cần tìm có trên mọi bản đồ.
- `maxQuestions` ≥ số lượt hỏi lời giải dùng trên mọi bản đồ.
- `predict`: các khóa khác nhau, đúng một khóa trùng kết quả của `initialWorkspace`.
- Luật soạn S1 / S2 (`curriculum.md` §6.5): mỗi màn `build` / `bughunt` khai báo cách sai hợp lý ở `SORTER_TRAPS` (như `TURTLE_T1`). Test của thế giới kiểm từng cách thua đúng mã.

### 8. Sân chơi (`apps/web/src/stages/sorter/`, P5-05)
- Vẽ: kệ gỗ, sách cao theo số và có số trên gáy, tay Bíp trên ray, cờ cuối kệ.
- Câu hỏi sáng ✔ / ✘ trên hai sách được so. `swap` có hoạt ảnh nhấc rồi đổi.
- HUD: "Còn 10 lượt hỏi" (màn có ngân sách) và "Đổi chỗ: 3" (chỉ để xem).
- `layout.ts` thuần, có unit test.

## Hệ quả
- **Được:**
  - W10 dạy tìm kiếm và sắp xếp bằng khối chỉ có field, không cần capacity guard, ô cắm hay vét cạn biểu thức;
  - kiểu game mới tự có 5 cách chơi (`game-kinds.md` §1);
  - hộp, phép, lặp lồng dùng lại nguyên vẹn.
- **Mất / giới hạn:**
  - chỉ có `sang phải` (không `sang trái`), nên chỉ dạy được nổi bọt và tìm lần lượt. Sắp xếp chọn, chèn và tìm kiếm nhị phân cần đi hai chiều và nhớ vị trí; để sau (J9, J10);
  - kiểu game không đọc / ghi hộp (ADR-0022 giữ nguyên), nên không có "nhớ số lớn nhất vào hộp".
- **Việc phải làm:**
  - `game-kinds.md` §3.6 viết lại (bỏ "Băng chuyền");
  - `game-kind-sdk.md` §1.3 (event);
  - `glossary.md` (kệ, tay Bíp, cờ cuối kệ, lượt, lượt hỏi, thuật toán);
  - `feedback.json` (6 câu mới);
  - `i18n/vi.ts` (nhóm KỆ SÁCH, HUD, thẻ kết quả).

## Phương án đã cân nhắc
- **Băng chuyền như khung cũ** (đồ chạy qua, đẩy trái / phải): đúng cho phân loại (`nếu`), không dạy được sắp xếp hay so sánh cách giải. W4 đã dạy `nếu`.
- **Danh sách là biến của engine** (`danh sách`, `phần tử thứ [i]`, `đổi chỗ [i] [j]`): cần khối giá trị, ô cắm, shadow, capacity guard, vét cạn biểu thức (ADR-0022 mục "Phương án"). Chỉ số là khái niệm trừu tượng với bé 8–11 tuổi.
- **Làm trên `robotlab`** (Bíp chở khối đổi chỗ trên sa bàn): đổi chỗ cần ô trống và nhiều bước gắp / thả. Ý "so 2 sách cạnh nhau" chìm trong việc lái robot. Bíp lại không đi xuyên qua khối, nên không đi dọc được một hàng khối để tìm.
- **Có `sang trái`:** mở đường cho sắp xếp chèn, nhưng gấp đôi catalogue vét cạn và thêm một khối mà 20 màn không cần. Thêm được sau mà không phá màn cũ.
- **Tính cả `hết kệ?` vào lượt hỏi:** làm `lặp đến khi hết kệ` tốn lượt dù không nhìn sách. Bé khó hiểu "hỏi chỗ tay" với "hỏi sách" khác nhau ở đâu. Không chọn.
- **Ngân sách là số lần đổi chỗ:** mọi cách nổi bọt đúng có cùng số lần đổi (bằng số cặp ngược), nên không phân biệt được cách nhanh / chậm. Không chọn.

## Kết quả đo
(Chưa có. P5-02 điền.)
