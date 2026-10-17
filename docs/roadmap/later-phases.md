# GĐ 3–5 (khung)

Chi tiết hóa thành task có nghiệm thu khi giai đoạn trước sắp xong (cùng cách viết với `phase-1.md`).

## GĐ 2 · Nhóm 6 bé (30/10–19/11)
Đã chi tiết hóa: xem [`phase-2.md`](phase-2.md) (P2-01…P2-19).

## GĐ 3 · Thành Phố Robot (07/10/2026 → sau chung kết AIROC)
Đã chi tiết hóa và làm sớm hơn vì cuộc thi (chung kết miền Bắc 17–18/10/2026): xem [`phase-3.md`](phase-3.md) (P3-01a…P3-13: `robotlab`, Thế giới 6, biến trong engine, Thế giới 7). Khung cũ (20/11–10/12, đồng hồ 120/180 s, cảm biến vật cản) được thay bằng file đó.

## GĐ 4 · Xưởng Phép Thuật, Tháp Họa Sĩ (16/10 → ~07/11/2026)
Đã chi tiết hóa: xem [`phase-4.md`](phase-4.md) (P4-01…P4-17: phép thuật trong engine, kiểu game `turtle`, Thế giới 8–9, capacity guard chuẩn bị cho W10). Thế giới 7 đã làm ở GĐ 3.
- Còn lại của khung GĐ 4 cũ, **chưa xếp lịch**: kiểu game `farm`, `sorter` (đầy đủ), `music`; cửa hàng & tủ đồ; huy hiệu; màn bonus; giọng đọc đầy đủ. (Chuỗi ngày và thưởng ngày đã có từ GĐ 1.)

## GĐ 5 · Học Viện Thuật Toán (17/10 → ~14/11/2026)
Đã chi tiết hóa: xem [`phase-5.md`](phase-5.md) (P5-01…P5-14: kiểu game `sorter`, bước sức mê cung, Thế giới 10, `v0.5.0`, `v1.0.0`). Thiết kế ở `curriculum.md` §6.5. Phép gọi phép, tham số cắm ô, `biến + biến` **không** làm ở W10 (lý do ở §6.5); để chuyến phiêu lưu bên dưới.
- Phần cũ của khung GĐ 5, **chưa xếp lịch** (P5-14, ưu tiên thấp):
  - Chế độ xem code: hiển thị JavaScript/Python tương ứng (generator `blockly/python`) song song với khối, tô sáng dòng đang chạy.
  - (Tùy chọn) Xuất chương trình robotlab sang C++ cho Leanbot.

## Ý tưởng · Hành trình phiêu lưu (HLV đề xuất 03/10/2026, chưa xếp lịch)
Sau khi Măng đi hết bản đồ 10 thế giới đầu, mở thêm các **chuyến phiêu lưu** theo cốt truyện. Mỗi chuyến vừa luyện lại/khó hơn các khái niệm code đã học, vừa cho bé biết thêm về thế giới và khoa học.

- **Ra khơi:** lên thuyền, đọc la bàn, gió và thủy triều, đi theo sao. Code: lặp và điều kiện theo hướng gió, ghi nhớ bằng biến.
- **Lạc đảo hoang:** tìm nước, dựng lều, nhóm lửa, đoán thời tiết. Code: tìm đường trong mê cung, lặp đến khi, gói chuỗi việc thành hàm.
- **Du lịch vòng quanh thế giới:** mỗi chặng là một nơi thật (núi lửa, sa mạc, Bắc Cực, rừng mưa, kỳ quan). Code: sắp xếp, tìm kiếm, chọn đường ngắn nhất.

Cách làm:
- Mỗi màn có một thẻ **"Măng biết không?"**: một hiện tượng khoa học thú vị (cầu vồng, thủy triều, núi lửa, nam châm, ngày và đêm…), câu ngắn theo `ui-copy-guide.md`.
- Kiến thức thế giới phải **đúng**: AI ghi nguồn tin cậy cho từng thẻ, HLV duyệt trước khi đưa cho bé. Không bịa số liệu.
- Kiến thức là phần thưởng và bối cảnh, không chấm điểm. Mục tiêu học code của từng màn vẫn theo quy tắc ở `curriculum.md` §7.
- Mỗi chuyến cần tile/cảnh riêng (biển, đảo, các vùng đất), nên tách thành giai đoạn riêng sau GĐ 5.
