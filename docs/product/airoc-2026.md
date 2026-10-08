# AIROC 2026: những gì đã biết

Nguồn chuẩn cho: thông tin về cuộc thi AIROC 2026 dùng để soạn Thế giới 6 (`robotlab`). Tra cứu web ngày 07/10/2026. Mức tin cậy: **xác nhận** (nguồn chính thức hoặc nhiều báo), **có thể** (suy ra hợp lý), **chưa rõ** (chưa thấy nguồn công khai).

> **Bản luật chi tiết 2026 không có công khai.** `airoc.vn` chỉ là trang giới thiệu. Có lẽ BTC gửi luật cho đội đã đăng ký. HLV xin luật ở VNV (vinguoiviet@vnvedu.org, 0981.694.508) rồi gửi AI để chỉnh sa bàn và điểm cho khớp. Mọi con số dưới đây nằm trong `content/` dạng dữ liệu nên sửa nhanh.

## 1. Cuộc thi
| Mục | Nội dung | Tin cậy |
|---|---|---|
| Tên | AIROC – AI IoT Robotics Challenge (kế tiếp Robothon). Chủ đề "Synapse City – Nhiệm vụ Xanh", năm 2050 | xác nhận |
| Tổ chức | Công ty CP Vì Người Việt (VNV), Viện Nghiên cứu Thiết kế Trường học (Bộ GD&ĐT), Pythaverse | xác nhận |
| Bảng thi của bé (9–12 tuổi) | **Trung cấp**: Leanbot Standard, Blockly/C++/Python. Bé 9 tuổi nằm giữa Sơ cấp (6–9) và Trung cấp, cần hỏi BTC theo ngày sinh | xác nhận |
| Lịch | Đăng ký tới **30/09/2026** (đã đóng). Chung kết QG miền Bắc **17–18/10**, miền Nam 24–25/10, quốc tế 29/11 ở Hà Nội | xác nhận |
| Lượt chạy | Năm 2025 (Robothon "Terra Protocol"): 2 lượt × 2 phút, lấy lượt tốt hơn; tối đa 1000 điểm; hòa thì xét số nhiệm vụ → thời gian → code ngắn, rõ | có thể (luật 2025) |

Nguồn: baoxaydung.vn, cafef.vn, kienthuc.net.vn, vtv.vn, giadinh.suckhoedoisong.vn, thieunien.vn (bài 11–12/07/2026); vietnamnet.vn, vov.vn (Robothon 2025).

## 2. Sa bàn và nhiệm vụ
| Mục | Nội dung | Tin cậy |
|---|---|---|
| Sa bàn | Đô thị **dạng lưới**, có bản sao số (Digital Twin) trên Pythaverse | xác nhận |
| Phòng thí nghiệm | Có khu "phòng thí nghiệm" nhận khối ô nhiễm. "CRL" nhiều khả năng là nơi này | xác nhận / có thể |
| Nhiệm vụ 1 | **Khoanh vùng** khu ô nhiễm (Containment) | xác nhận (tên Anh: có thể) |
| Nhiệm vụ 2 | **Chở khối trung hòa** tới chỗ cần xử lý (Neutralization) | xác nhận (tên Anh: có thể) |
| Nhiệm vụ 3 | **Thu hồi khối ô nhiễm** về phòng thí nghiệm (Analysis) | xác nhận (tên Anh: có thể) |
| Điểm 45 / 160 / 100 / về CRL 40, sa bàn 1,2192 m, màu khối, đề ngẫu nhiên | Từ ghi chú cũ của HLV, không tìm thấy nguồn | chưa rõ |

## 3. Leanbot (Standard)
Xác nhận từ mã mẫu Arduino công khai (github.com/lesysang1322002/LeanbotDemo) và leanbot.space:
- Bánh xe động cơ bước: `LbMotion.runLR(trái, phải)`, đi theo **mm** (`waitDistanceMm`), quay theo **độ** (`waitRotationDeg`).
- **4 cảm biến dò line** nhìn xuống (`LbIRLine.read()` trả 4 bit), thêm cảm biến hồng ngoại hai bên.
- **Tay gắp** 2 càng servo: `LbGripper.open()` / `close()`.
- Cảm biến siêu âm đo khoảng cách (`Leanbot.pingCm()`), còi, vòng đèn RGB 7 bóng, 4 nút chạm.
- Có cảm biến màu (leanbot.space liệt kê), chưa thấy trong mã mẫu: chưa rõ bảng Trung cấp có dùng không.
- Tên khối Blockly chính thức: chưa rõ (tài liệu cần đăng nhập).

## 4. Cách Thế giới 6 mô phỏng (gần đúng)
- Sa bàn là **lưới ngã tư**: mỗi ô là một ngã tư của đường line đen. "Tiến 1 ô" = dò line tới ngã tư kế tiếp.
  - **Đơn giản hóa, HLV cần kiểm:** trên sa bàn thật, một đoạn line thẳng giữa hai dãy nhà có thể **không có ngã tư nào để đếm** (robot đi theo line tới khi gặp vạch / ngã tư ở xa). "Ngã tư" của trò chơi là cách làm đơn giản để dạy đếm. HLV gửi ảnh sa bàn và bộ khối Blockly Leanbot (`coach-questions.md` H17) để AI chỉnh sa bàn và nhãn lệnh (P3-07).
- Ba nhiệm vụ là ba loại mục tiêu: **khoanh vùng** (thả khối rào khi đứng trên ô vùng ô nhiễm), **trung hòa** (thả khối trung hòa khi đứng trên trạm cùng màu), **thu hồi** (thả khối ô nhiễm khi đứng trong phòng thí nghiệm). Gắp / thả tại chỗ robot đứng, như Leanbot chạy tới khối rồi đóng càng. Về phòng thí nghiệm cuối lượt là điểm thưởng.
- Điểm và thời gian là dữ liệu trong `content/`, tạm theo ghi chú cũ (45/160/100/40, 120 s).
- Trên giao diện ghi "Sa bàn tập, gần giống đề thi". Khi có luật thật, sửa dữ liệu, không sửa code.
