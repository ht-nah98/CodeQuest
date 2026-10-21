# Giáo án 16 bài — khóa Leanbot AIROC tiếng Việt

Mỗi file là một buổi dạy: mục tiêu, thuật ngữ Anh ↔ Việt, cách dạy từng bước, chương trình
mẫu kèm code, phiếu ôn luyện có đáp án, và chỗ bé hay vướng.

**Đọc trước:** [`../leanbot-airoc-vi.md`](../leanbot-airoc-vi.md) — giáo trình tổng.
§5 là bảng thuật ngữ bắt buộc dùng, §6 là các con số phải đúng.
**Cài đặt máy:** [`../../playbooks/leanbot-setup.md`](../../playbooks/leanbot-setup.md).

| Bài | Tên | Dạy gì | Bài ôn luyện |
|---|---|---|---|
| 1 | [Chào Leanbot! Cùng di chuyển](lesson-01-di-chuyen.md) | Thứ tự các bước, tiến/lùi theo cm, quay tại chỗ theo độ, số âm | 10 |
| 2 | [Cánh tay kẹp thần kỳ](lesson-02-tay-gap.md) | Servo, góc 0° mở / 90° đóng, chuỗi gắp–chở–thả | 8 |
| 3 | [Mắt thần siêu âm](lesson-03-sieu-am.md) | Đo khoảng cách, `nếu`, `lặp khi`, hai ngưỡng 25/30 cm | 10 |
| 4 | [Đi theo đường thông minh](lesson-04-bam-vach.md) | 4 mắt hồng ngoại, cân chỉnh, mã vạch, `switch` | 10 |
| 5 | [Dữ liệu là gì?](lesson-05-du-lieu.md) | AI học từ dữ liệu, dữ liệu tốt / xấu | 9 |
| 6 | [Dạy robot phân loại ảnh](lesson-06-phan-loai-anh.md) | Lớp, thu mẫu, làm sạch dữ liệu | 8 |
| 7 | [Âm thanh vô hình](lesson-07-am-thanh.md) | Rung động, biên độ, tần số, ảnh phổ | 8 |
| 8 | [Phân loại âm thanh nâng cao](lesson-08-am-thanh-nang-cao.md) | Thu mẫu cân bằng, ngưỡng, ma trận nhầm lẫn | 10 |
| 9 | [Nhận diện dáng người](lesson-09-dang-nguoi.md) | Mô hình có sẵn, khung xương, đạo đức AI | 10 |
| 10 | [Nhìn robot chạy thử trước](lesson-10-ban-sao-so.md) | Bản Sao Số, nghĩ trước làm sau | 10 |
| 11 | [Điều khiển đường đi của robot](lesson-11-duong-di.md) | Dự đoán → chạy → so sánh, chỉnh từng tham số | 8 |
| 12 | [Từ robot ảo sang robot thật](lesson-12-ao-sang-that.md) | Chuyển code, nạp USB, sai lệch ảo/thật | 8 |
| 13 | [Nhiệm vụ 1: Khoanh vùng](lesson-13-nhiem-vu-1.md) | Dò vạch + đếm ngã tư + đẩy khối (45 điểm) | 10 |
| 14 | [Nhiệm vụ 2: Rải chất trung hòa](lesson-14-nhiem-vu-2.md) | Gắp từ kho, chở, thả đúng màu (160 điểm) | 10 |
| 15 | [Nhiệm vụ 3: Mang mẫu về lab](lesson-15-nhiem-vu-3.md) | Quay đầu khi đang kẹp, tìm lại vạch (100 điểm) | 9 |
| 16 | [Nhiệm vụ tổng hợp](lesson-16-tong-hop.md) | Ghép ba nhiệm vụ trong 2 phút, chia hàm | 9 |

Tổng **147 bài ôn luyện** có đáp án.

## Cách đọc một giáo án

- **Bài 1–4, 13–16** dùng robot Leanbot và khối Blockly. Đây là phần đi thi.
- **Bài 5–9** là phần AI, dùng Teachable Machine và Scratch, **không** dùng Leanbot.
  Bắt buộc để lấy chứng chỉ, nhưng hạng Creator không dùng khi thi.
- **Bài 10–12** chạy trên Bản Sao Số (robot ảo), sinh Python thay vì C++.

Mục **"Ghi chú về bản gốc"** ở cuối mỗi giáo án liệt kê lỗi và chỗ mâu thuẫn trong khóa gốc
tiếng Anh. Đọc mục này trước khi lên lớp: bé sẽ nhìn thấy slide gốc trên Plearn, và có chỗ
slide nói khác chương trình mẫu. Tổng hợp mọi lỗi tìm được:
[`../../research/pythaverse-synapse-city.md`](../../research/pythaverse-synapse-city.md) §7.

## Chỗ cần HLV kiểm lại trước khi dạy

Những điểm giáo án **không tự quyết được**, đã đánh dấu trong từng file:

| Bài | Cần kiểm | Vì sao |
|---|---|---|
| 1, 4 | Trình soạn khối đổi **vòng/phút** ↔ **bước/giây** thế nào | Bài học ghi vòng/phút, chương trình mẫu ghi bước/giây |
| 4 | Mắt cảm biến nào nằm bên nào | Tên chân trên slide (`ir3R, ir1R, ir0L, ir2L`) lệch thứ tự với nhãn khối (`2L, 0L, 1R, 3R`) |
| 4 | Dòng `if (isBlackDetected()) break;` | Nghi là mất chữ "không" khi xuất file; ảnh slide quá mờ để xác nhận |
| 2, 14, 15 | Góc 50° của tay gắp trong mẫu là mở hay đóng | Mẫu chỉ có `moveTo(50)`, slide dạy 0° mở / 90° đóng |
| 11 | `Trái 30 / Phải −30` là quay trái hay phải | Ba slide trong cùng một chương nói ngược nhau |
| 6 | Yêu cầu nộp thật của Dự án 1 | 45 slide không nhắc dự án; chỉ Plearn gắn vào |
| 14, 15 | Dạy theo slide hay theo chương trình mẫu | Hai nguồn mâu thuẫn ở phần tay gắp và siêu âm; câu hỏi kiểm tra chấm theo slide |
| 16 | Chặng nào thuộc nhiệm vụ nào | Mẫu có 11 chặng liền mạch, không slide nào chia nhóm |
| 13, 15, 16 | ~~Dừng ở ngã tư thứ N hay N+1~~ — **đã chốt: thứ N** | Xem giải thích ngay dưới bảng. Chữ trên slide hàm ý N+1, slide sai |
| 13, 16 | Dạy tốc độ 30–50 % hay chạy hết cỡ như mẫu | Bài 13 khuyên 30–50 %, mọi chương trình mẫu chạy 2000 bước/giây |

### Đã chốt: `followLineMultipleJunctions(N)` + `goToJunction()` dừng ở ngã tư thứ **N**

Chỗ này từng bị đọc nhầm thành N+1. Đọc code thì rõ:

```cpp
int line;                                   // biến toàn cục
void followLineUntilJunction() {
  while ((line != 15)) { runFollowLine(); }  // kiểm tra TRƯỚC khi chạy
}
void goToJunction() {
  followLineUntilJunction();                 // line đang là 15 → thoát ngay
  followLineDistance(20);                    // đi thêm 20 mm cho vào giữa ngã tư
  LbMotion.stopAndWait();
}
```

`followLineMultipleJunctions(N)` kết thúc khi `line == 15`, tức robot **đang đứng trên ngã tư
thứ N**. `goToJunction()` gọi `followLineUntilJunction()`, nhưng vòng `while` kiểm tra điều kiện
trước và `line` vẫn đang là 15, nên nó **thoát ngay lập tức, không đi thêm ngã tư nào** — chỉ đi
thêm 20 mm rồi dừng để robot nằm giữa ngã tư, đủ chỗ xoay cho chuẩn.

Vậy cặp lệnh đó = **đi qua đúng N ngã tư**, dừng cách ngã tư thứ N là 20 mm.
Dạy sai chỗ này là robot dừng lệch hẳn một ô.
