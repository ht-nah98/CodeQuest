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

## 4. Câu chữ
Theo `docs/design/ui-copy-guide.md`. `content:check` tự kiểm độ dài.

## 5. Bài giảng
- 3–6 thẻ. Thẻ đầu kể chuyện; ít nhất 1 thẻ `demo` chạy được; thẻ cuối là `quiz` 1 câu.
- Mỗi thẻ ≤ 2 câu.
- `demo` dùng đúng kiểu game mà bé sắp chơi.

## 6. Review nội dung
Màn mới phải được huấn luyện viên **chơi thử một lần trên trình duyệt** trước khi merge, ngoài việc qua `content:check`. Màn do AI soạn nháp phải ghi `Co-authored` trong PR và được huấn luyện viên duyệt.
