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

Khối mới của Thế giới 3–5 (`nếu`, `nếu … nếu không`, `lặp đến khi`, `đã tới nơi?`, chìa khóa / đón bạn) cần đúng 3 thứ trên khi xây (`product/curriculum.md` §5.4 T20).

## 6. Review nội dung
Màn mới phải được huấn luyện viên **chơi thử một lần trên trình duyệt** trước khi merge, ngoài việc qua `content:check`. Màn do AI soạn nháp phải ghi `Co-authored` trong PR và được huấn luyện viên duyệt.
