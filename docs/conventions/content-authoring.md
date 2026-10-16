# Quy ước soạn nội dung

Áp dụng khi tạo hoặc sửa file trong `content/`. Quy trình từng bước: `docs/playbooks/add-level.md`.

## 1. Trước khi soạn một màn, trả lời 4 câu
1. **Bé học được gì?** (`learningGoal`, 1 câu)
2. **Bé hay hiểu sai gì?** (`misconception`)
3. **Ý mới duy nhất của màn là gì?** (tối đa 1)
4. **Vì sao cách chơi này** (build/parsons/predict/bughunt) hợp với ý đó?

## 2. Độ khó
- Trong một thế giới, độ khó tăng dần nhưng **có nhịp**: sau 2–3 màn khó có 1 màn dễ hơn (thường là `predict` hoặc `parsons`).
- `par` là số khối của lời giải tối ưu thật. Khi đặt `maxBlocks` thì `par ≤ maxBlocks ≤ par + 2`: bằng `par` khi muốn ép dùng khái niệm (vd ép dùng lặp), `par + 1` hoặc `par + 2` khi chỉ muốn khuyến khích. Thế giới 1 thường không đặt `maxBlocks`.
- Bản đồ nhỏ trước, to sau. Thế giới 1: runner ≤ 12 ô, maze ≤ 6×6.
- Không đặt bẫy "ăn gian" (chướng ngại khó thấy, ô giống nhau gây nhầm).

### 2.1 Màn có câu hỏi (từ Thế giới 4; `product/curriculum.md` §5.5 R1–R3)
- **Chặn "nhảy cóc" (R1).** Màn runner muốn ép hỏi về hố phải có ít nhất một bản đồ có hố ở ô **chẵn** tính từ ô 0, hoặc chìa khóa / bạn ở ô mà nhảy cóc bay qua. Kiểm bằng `npm run par`: lời giải ngắn nhất phải có khối hỏi (test của thế giới bỏ khối hỏi khỏi thanh khối và kiểm không gì thắng trong `maxBlocks`, vd `tools/content-check/src/w04.test.ts`).
- **Chống lặp lồng (R2).** Màn build/bughunt có vòng lặp đặt `maxLoopDepth: 1`; Thế giới 4 thêm `maxInstances: { cq_repeat: 1 }` (cả màn ghép hình).
- **Vét cạn (R3).** Mọi màn build/bughunt chạy `npm run par`; số nào khác bảng ở `curriculum.md` thì sửa bản đồ cho giữ ý dạy và ghi lại ở mục "Ghi chú khi soạn" của thế giới đó.
- Cành và thùng chỉ ở màn ghép hình, đoán, săn lỗi (D3), vì "luôn cúi", "luôn đá" thắng mà không cần hỏi.

### 2.2 Màn có hộp (biến, từ Thế giới 7; ADR-0022, luật soạn R4)
- **Hộp lái chương trình** (thanh khối có `lặp [hộp] lần` hoặc `so sánh`), mode `build` / `bughunt`: ≥ 2 bản đồ (`content:check` luật 23 kiểm), và test của thế giới (`w07.test.ts`) chạy vét cạn trên `withoutVariables(level)` (`@codequest/validator`: bỏ mọi khối biến khỏi thanh khối, bỏ `variables` và `countGoal`): **không** được thắng tới `par`. Số đo của spike cho thấy đây là chỗ hỏng thật: Măng đi thử cả hai nhánh rồi thắng nhờ A1, hoặc đi men tường.
- **Chỉ đếm** (hộp chỉ được `đặt` / `tăng`, chấm bằng `countGoal`): ≥ 2 bản đồ có `countGoal.equals` **khác nhau**, để một số cố định không thắng được (luật 23 kiểm).
- Mục thanh khối của khối biến **ghim** `VAR` và `NUM` (`so sánh` cả `OP`; `lặp [hộp] lần` ghim `VAR`), vì vét cạn chỉ thử số ghim (luật 23 (a)). Màn cần cả `=` và `>` thì đặt hai mục.
- Không dùng bẫy "đổi hộp trong thân `lặp [hộp] lần`" ở màn thử thách (luật 23 (i) cảnh báo). Màn dạy `đặt` cần `start` ≠ 0, hoặc dạy bằng `parsons` / `bughunt`.

### 2.3 Mê cung thật, không lặp công thức (đợt tăng độ khó 14/10/2026; `roadmap/difficulty-pass.md` §3.2)
HLV chơi thử thấy màn không phải mê cung quá dễ và lặp một công thức. Ba luật soạn, ⚙ `content:check` **luật 24** chỉ cảnh báo (không chặn), người soạn ghi lý do khi giữ một cảnh báo:
- **M1. Mê cung thật.** Từ Thế giới 2, mỗi màn mê cung `build` / `bughunt` có **≥ 1 ngã ba** (ô có ≥ 3 lối) và **≥ 1 ngõ cụt** (ô 1 lối), không tính `S`, `G`. Từ Thế giới 4: **≥ 2 ngã ba**. Đặt ngõ cụt ở chỗ mà một chương trình sai hợp lý (rẽ nhầm phía, lặp thừa, hỏi sai phía) đi vào, để lỗi **nhìn thấy được**. Luật kiểm bản đồ tốt nhất của màn và chỉ đếm ô **Măng tới được** (màn không có khối rẽ chỉ tới được đường thẳng trước `S`); phần "chương trình sai đi vào" do người review kiểm.
- **M2. Ngân sách công thức.** Trong một thế giới, một **hình lời giải** (chương trình bỏ số: `lặp 3 {đi, đi}` = `lặp 5 {đi, đi, đi}`; màn `predict` lấy `initialWorkspace`, `bughunt` lấy lời giải đã sửa) dùng **tối đa 2 lần**, và lần thứ hai phải khác mode **hoặc** khác loại bản đồ (số bản đồ, có vật phẩm, số bản đồ là mê cung thật; thêm một ngõ cụt không tính). **Ảnh gương là cùng công thức**: "hỏi phải, rẽ phải" = "hỏi trái, rẽ trái". Thang PRIMM đã duyệt được miễn: W4 `l13 → l14 → l16 → boss` (D5, `APPROVED_LADDERS` trong `tools/content-check/src/difficulty.ts`); màn khác cùng hình vẫn bị đếm cả các màn của thang.
- **M3. Nhiều bản đồ khác hình.** Màn mê cung nhiều bản đồ có câu hỏi: các bản đồ phải khác **hình đường** (rẽ ở chỗ khác, ngõ cụt ở phía khác), không chỉ khác độ dài. Luật so "hình đường" của đường ngắn nhất từ `S` tới `G`: các chỗ rẽ và các nhánh hai bên theo hướng Măng, bỏ độ dài.
- Miễn: Thế giới 1 (chuỗi tuần tự là ý dạy), màn `guided` (màn giới thiệu khối giữ bản đồ đơn giản) với M1 và M3, màn `creative`.
- Khi đổi một màn chạy thanh khối có `lặp n lần` (W4): đường của chương trình đúng ≤ 20 vòng; ngõ cụt sâu làm cách sai **hết 20 vòng** là có chủ đích (W4 `l19`).

## 3. Gợi ý
- Mỗi màn `guided` có ≥ 2 luật gợi ý tầng 0; `practice` ≥ 1.
- `thinkingHint` là **câu hỏi**, không chứa tên khối cần dùng.
- Gợi ý theo `lastReason` nên nói **vì sao** chuyện đó xảy ra, không chỉ lặp lại câu phản hồi.
- Số ô chỉ hiện trong khung "Xem cả đường" (thước đếm ô, P2-22, `architecture/stage-rendering.md` §4), không có trên sân chơi. Gợi ý, mục tiêu và nhãn đáp án vẫn nói theo vật mốc, **không bao giờ** viết "ô số N".

### Màn `predict`: khóa đáp án
Khóa `crash:<REASON>@<ô>` chỉ **ô nơi va chạm xảy ra** (ô hố, ô cành/thùng bị đụng), không phải ô Măng đứng; riêng runner `OFF_TRACK` là ô Măng nhảy đi. Nhãn lựa chọn nói rõ chỗ đó bằng **vật mốc trên sân chơi**, không dùng số ô (sân chơi không hiện số, bé đếm dễ lệch), vd `crash:HIT_BRANCH@2` → "Cụng đầu vào cành tre", `stop@4` → "Đứng ngay trước lá cờ". **Riêng maze `HIT_WALL`** (`crash:HIT_WALL@r,c`): ô là ô Măng **đứng khi đâm** (ô bước ra), không phải ô tường, vì tường không phải chỗ Măng tới được (`mazePredictAnswer`, sự thật của engine); hình thẻ vẽ Măng ở ô đó, vụ nổ ở cạnh tường. `stop@<ô>` là ô Măng đứng khi hết chương trình; `missed@<ô cờ>` là tới cờ mà còn măng. Định dạng: `product/game-kinds.md` §3.

## 4. Câu chữ
Theo `docs/design/ui-copy-guide.md`. `content:check` tự kiểm độ dài.

## 5. Bài giảng
- 3–6 thẻ. Thẻ đầu kể chuyện; ít nhất 1 thẻ `demo` chạy được; thẻ cuối là `quiz` 1 câu.
- Mỗi thẻ ≤ 2 câu.
- `demo` dùng đúng kiểu game mà bé sắp chơi.
- **Bài "Khối mới"** (`beforeLevel`, `architecture/content-model.md` §3): mỗi khối hành động mới có một bài 3–5 thẻ đặt trước màn đầu tiên dùng nó. Thẻ đầu `say` gọi tên khối ("Khối mới: nhảy!"); thẻ `demo` cho thấy Măng **dừng ở ô nào** sau khối (so với khối "đi" khi cần); thẻ cuối `quiz` hỏi "Măng đi mấy ô / đứng ở đâu?". Câu tả chuyển động dùng đúng các câu ở `glossary.md` (dòng Đi, Nhảy, Cúi, Đá, Tiến, Rẽ), giống chú thích khối và gợi ý `enter` của màn.

### 5.1 Giới thiệu khối mới (luật cố định cho mọi thế giới)
Góp ý HLV 03/10/2026: bé hay đoán sai một khối làm Măng đi bao xa. **Mọi khối hành động / tác động mới** (khối làm Măng di chuyển hoặc làm đổi thế giới; về sau cả khối điều khiển và khối hỏi) phải được giới thiệu bằng đủ 3 thứ:
1. **Một câu cho bé** nói chính xác khối làm gì: Măng **có đi không**, **đi mấy ô**, **cái gì đổi**. Câu này nằm trong gợi ý tầng 0 `enter` "Khối mới: …" ở màn đầu tiên dùng khối, và giống câu trong `glossary.md`.
2. **Một ví dụ chạy được** bé xem tận mắt: thẻ `demo` trong bài "Khối mới" (`beforeLevel`, §5) hoặc trong bài mở đầu thế giới, cho thấy Măng **dừng ở ô nào** (so với khối đi khi cần).
3. **Chú thích khối (tooltip) chính xác** trong `packages/games/src/<kind>/blocks.ts`, cùng cách nói với câu ở (1).

⚙ `content:check` luật 7 cảnh báo khi màn đầu tiên dùng một khối hành động không có gợi ý nào nhắc tên khối. Ví dụ chạy được và câu đúng nghĩa thì người soạn và người review kiểm (với Thế giới 1 có `tools/content-check/src/blockLessons.test.ts`).

**Bảng tra các khối hiện có.** Cột cuối là tooltip, **đúng từng chữ**; gợi ý `enter`, thẻ bài giảng và `glossary.md` dùng lại câu này (hoặc phần đầu của nó, vd "Cúi xuống và đi 1 ô"), không nói cách khác. Mỗi câu một ý: không nối thêm "Rồi đi!" vào câu tả khối.

| Khối | Măng có đi? | Câu chuẩn (tooltip) |
|---|---|---|
| đi (runner) | đi 1 ô | Đi 1 ô về phía trước |
| tiến (mê cung) | đi 1 ô theo hướng mặt | Tiến 1 ô theo hướng Măng đang nhìn |
| cúi | cúi **và** đi 1 ô | Cúi xuống và đi 1 ô, chui qua cành thấp |
| nhảy | bay qua 1 ô, đáp ô thứ 2 (xa 2 ô, cả trên đất bằng) | Bay qua 1 ô, đáp xuống ô thứ 2 |
| đá | **đứng yên**, ô phía trước đổi (thùng đổ) | Đá ô phía trước, Măng đứng yên |
| rẽ trái / rẽ phải | **không đi**, chỉ quay 90° | Quay sang trái (phải) tại chỗ, chưa đi |
| tiến … ô (robot Bíp, W6) | đi đúng số ngã tư chọn trên lệnh, dừng ở từng ngã tư (ngã tư đang đứng không tính) | Tiến 3 ô: dừng ở ngã tư thứ 3 |
| rẽ trái / rẽ phải (robot Bíp) | **không đi**, chỉ quay 90° (khối riêng `robot_turn_*`, câu giống mê cung) | Quay sang trái (phải) tại chỗ, chưa đi |
| gắp (robot Bíp) | **đứng yên**, gắp khối ở ngã tư Bíp đứng | Gắp khối ở chỗ Bíp đứng |
| thả (robot Bíp) | **đứng yên**, thả khối xuống ngã tư Bíp đứng | Thả khối xuống chỗ Bíp đứng |
| dạy phép [▾] (W8, ADR-0023) | **không đi**: chỉ nhớ các lệnh bên trong | Dạy phép: nhớ các lệnh bên trong, chưa làm ngay |
| làm phép [▾] (W8) | làm hết lệnh trong thân phép, rồi làm khối tiếp theo | Làm phép: làm hết lệnh trong phép, rồi làm tiếp |
| tiến [n] bước (bút, W9, ADR-0024) | đi n bước; bút hạ thì để lại nét dài n. Demo `tiến 3` → 1 nét dài 3 | Tiến 3 bước: bút hạ thì có nét dài 3 |
| rẽ phải [d] độ (bút) | **không đi**, quay d độ. Demo `tiến 2, rẽ phải 90, tiến 2` → hình chữ L | Rẽ phải 90 độ: quay tại chỗ, chưa đi |
| rẽ trái [d] độ (bút) | **không đi**, quay d độ. Demo cầu thang đi lên | Rẽ trái 90 độ: quay tại chỗ, chưa đi |
| nhấc bút (bút) | đứng yên; đi tiếp thì không vẽ. Demo `tiến 1, nhấc bút, tiến 1, hạ bút, tiến 1` → nét đứt | Nhấc bút: đi tiếp thì không có nét |
| hạ bút (bút) | đứng yên; đi tiếp thì vẽ (cùng thẻ demo trên) | Hạ bút: đi tiếp thì có nét |

Robot Bíp (W6, `game-kinds.md` §3.3): gợi ý `enter` của lệnh mới là "Lệnh mới! " + đúng tooltip, **đúng từng chữ** ("Lệnh mới! Tiến 3 ô: dừng ở ngã tư thứ 3."), không đổi số theo lời giải của màn; luật 7 coi "tiến 4 ô" là đã nhắc tên lệnh `tiến … ô`. Thanh khối ghi `"robot_forward"` (không ghi `fields`): bé tự đổi số, và `npm run par` thử mọi số 1–9; ghi `fields` là ghim số đó cho vét cạn.

Bút vẽ (`turtle`, W9, ADR-0024): khi màn ghim góc khác 90 độ cho khối rẽ, hoặc số bước khác 3 cho `tiến`, gợi ý `enter` "Khối mới! …" nhắc lại câu tooltip với **đúng số của màn đó** ("Rẽ trái 60 độ: quay tại chỗ, chưa đi"), không dùng số của câu chuẩn. Luật 26 bắt ghim `DEG` trong mọi mục thanh khối, kể cả `l01`–`l03`.

Phép thuật (W8, ADR-0023): gợi ý `enter` của khối phép là "Khối mới! " + đúng tooltip. Tooltip không nêu tên nhân vật (cùng khối chạy cho Măng và Bíp).

Khối mới của Thế giới 3–5 (`nếu`, `nếu … nếu không`, `lặp đến khi`, `đã tới nơi?`, chìa khóa / đón bạn) cần đúng 3 thứ trên khi xây (`product/curriculum.md` §5.4 T20).

**Ý mới không phải khối** (HLV nhắc lại 14/10/2026, luật cố định): mọi **ý mới**, kể cả khi không có khối mới, cũng cần đủ 3 thứ: câu cho bé (gợi ý `enter` của màn đầu tiên), ví dụ chạy được (thẻ `demo` của một bài `beforeLevel` ngắn) và **câu chuẩn đúng từng chữ** (thay cho tooltip, vì không có khối để rê chuột). Chữ trên giao diện gọi là "khối"; tooltip và câu tả lệnh nói "lệnh" khi cần (W6). Câu chuẩn hiện có:

| Ý mới | Màn đầu tiên | Bài có ví dụ | Câu chuẩn (đúng từng chữ) |
|---|---|---|---|
| Quay đầu = rẽ 2 lần (rẽ phải ×2 hoặc rẽ trái ×2) | W2 `l13` | `w02-lesson-quay-dau` | Rẽ 2 lần là quay đầu: Măng nhìn ngược lại, chưa đi. |
| `nếu` nằm trong nhánh `nếu không` | W4 `l12` (ghép hình) | `w04-lesson-neu-long` | Nếu trong nếu không: hết đường phía trước mới hỏi tiếp. |
| Thân `lặp đến khi` là khối rẽ (quay tìm đường) | W5 `l06` | `w05-lesson-xoay` | Rẽ đến khi có đường: Măng quay tại chỗ, chưa đi. |
| Câu hỏi `phía trước có [ô trống]` (không phải khối mới, ô chọn của `phía trước có`) | W4 `l10` (đoán; trước đây `l05`, `l12`) | màn đoán `l10` (chạy chương trình thật) | Ô trống: phía trước là đất, Măng đi được. |
| Hai hộp: một hộp là số vòng, hộp kia đếm (`lặp [số bước] lần { … tăng [số măng] … }`) | W7 `l16` | `w07-lesson-hai-hop` | Hộp số bước chỉ số vòng. Hộp số măng đếm măng. |
| Rẽ 180 độ (bút, W9) | W9 `l17` | bài W9 trước `l17` | Rẽ 180 độ là quay ngược lại. |
| Thứ tự việc (robot Bíp): cùng các việc, đổi thứ tự thì đường và số giây đổi | W6 boss (`l19` đã nhắc khi quá số lệnh) | `w06-lesson-thu-tu` (2 demo: hai thứ tự, một kịp về phòng, một hết giờ) | Đổi thứ tự việc thì số giây cũng đổi. |


## 6. Review nội dung
Màn mới phải được huấn luyện viên **chơi thử một lần trên trình duyệt** trước khi merge, ngoài việc qua `content:check`. Màn do AI soạn nháp phải ghi `Co-authored` trong PR và được huấn luyện viên duyệt.
