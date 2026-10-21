# AIROC 2026: những gì đã biết

Nguồn chuẩn cho: thông tin về cuộc thi AIROC 2026 dùng để soạn Thế giới 6 (`robotlab`) và khóa
[`leanbot-airoc-vi.md`](leanbot-airoc-vi.md). Tra cứu web ngày 07/10/2026, **cập nhật 21/10/2026**
từ trang chính thức `airoc.space/airoc`. Mức tin cậy: **xác nhận** (nguồn chính thức hoặc nhiều
báo), **có thể** (suy ra hợp lý), **chưa rõ** (chưa thấy nguồn công khai).

> **Cập nhật 21/10/2026.** Trang chính thức `airoc.space/airoc` **có công bố** bảng hạng, luật
> sa bàn và bảng điểm. Phần lớn những mục trước đây ghi "chưa rõ" nay đã **xác nhận** — xem §1a,
> §2 và §3. Vẫn chưa thấy bản luật PDF đầy đủ; HLV vẫn nên xin ở VNV
> (vinguoiviet@vnvedu.org, 0981.694.508) để đối chiếu. Mọi con số nằm trong `content/` dạng dữ
> liệu nên sửa nhanh.
>
> Bộ khối Blockly Leanbot nay đã **khảo sát đầy đủ 48 khối** — xem
> [`../research/pythaverse-synapse-city.md`](../research/pythaverse-synapse-city.md) §4.

## 1a. Bảng hạng (xác nhận, `airoc.space/airoc`, 21/10/2026)

| Hạng | Tuổi | Robot | Ngôn ngữ | Tham số khối | Thử thách |
|---|---|---|---|---|---|
| Explorer | 6–9 | 1 × Leanbot Standard | Blockly | 6 | Màu khối biết trước |
| **Creator** | **9–12** | **1 × Leanbot Standard** | **Blockly** | **8** | **Màu khối biết trước** |
| Innovator | 11–15 | 2 × Leanbot IoT | Blockly / C++ / Python | 9 | Màu ẩn, **bắt buộc dùng AI** |
| Master | 15–18 | 2 × Leanbot IoT | Blockly / C++ / Python | 10 | AI + khối bí ẩn (150 điểm) |
| Open | 13–20 | ≥ 1 Leanbot làm bộ điều khiển | tự do | — | Dự án tự chọn theo chủ đề |

Bé 9–10 tuổi (lớp 4) thuộc hạng **Creator**. Hạng này **không bắt buộc dùng AI** vì màu khối
đã biết trước. Bảng này thay cho dòng "Bảng thi của bé — Trung cấp" ở §1.

## 1. Cuộc thi
| Mục | Nội dung | Tin cậy |
|---|---|---|
| Tên | AIROC – AI IoT Robotics Challenge (kế tiếp Robothon). Chủ đề "Synapse City – Nhiệm vụ Xanh", năm 2050 | xác nhận |
| Tổ chức | Công ty CP Vì Người Việt (VNV), Viện Nghiên cứu Thiết kế Trường học (Bộ GD&ĐT), Pythaverse | xác nhận |
| Bảng thi của bé (9–12 tuổi) | **Trung cấp**: Leanbot Standard, Blockly/C++/Python. Bé 9 tuổi nằm giữa Sơ cấp (6–9) và Trung cấp, cần hỏi BTC theo ngày sinh | xác nhận |
| Lịch | Đăng ký tới **30/09/2026** (đã đóng). Chung kết QG miền Bắc **17–18/10**, miền Nam 24–25/10, quốc tế 29/11 ở Hà Nội | xác nhận |
| Lượt chạy | **2 phút mỗi lượt**, làm nhiệm vụ theo thứ tự nào cũng được | xác nhận (airoc.space) |
| Phân định khi bằng điểm | điểm chuẩn hóa cao nhất → **độ ổn định giữa hai lượt** → số lần thử ít nhất → thời gian ngắn nhất | xác nhận (airoc.space) |
| Lịch quốc tế | đăng ký 01/07→08/11/2026 · hạng Open nộp 12/11 · tập huấn 28/11 · **chung kết 29/11/2026, Nhà thi đấu tỉnh Phú Thọ** | xác nhận (airoc.space) |

Nguồn: baoxaydung.vn, cafef.vn, kienthuc.net.vn, vtv.vn, giadinh.suckhoedoisong.vn, thieunien.vn (bài 11–12/07/2026); vietnamnet.vn, vov.vn (Robothon 2025).

## 2. Sa bàn và nhiệm vụ
| Mục | Nội dung | Tin cậy |
|---|---|---|
| Sa bàn | Đô thị **dạng lưới**, có bản sao số (Digital Twin) trên Pythaverse | xác nhận |
| Phòng thí nghiệm | Có khu "phòng thí nghiệm" nhận khối ô nhiễm. "CRL" nhiều khả năng là nơi này | xác nhận / có thể |
| Nhiệm vụ 1 | **Khoanh vùng** khu ô nhiễm (Containment) | xác nhận (tên Anh: có thể) |
| Nhiệm vụ 2 | **Chở khối trung hòa** tới chỗ cần xử lý (Neutralization) | xác nhận (tên Anh: có thể) |
| Nhiệm vụ 3 | **Thu hồi khối ô nhiễm** về phòng thí nghiệm (Analysis) | xác nhận (tên Anh: có thể) |
| Điểm: khoanh vùng **45**/khối · trung hòa **160**/cặp đúng màu · phân tích **100**/khối · về CRL **40**/robot | **xác nhận** (airoc.space) — khớp đúng ghi chú cũ của HLV |
| Khối bí ẩn **150** điểm | xác nhận, **chỉ hạng Master** |
| Sa bàn **4 ft × 4 ft** (1,2192 m), lưới **3×3** | xác nhận (airoc.space) |
| 8 khu **A–H** + CRL: Business Center, Innovator Campus, Green Energy, Waterfront District, Mobility Hub, Industrial Automation, Eco District, Digital Downtown | xác nhận (airoc.space) |
| Khối ô nhiễm **5 màu**: đỏ, xanh dương, xanh lá, vàng, tím | xác nhận (airoc.space) |
| **6 kho trung hòa** (S1–S6) đặt dọc mép sa bàn | xác nhận (airoc.space) |
| Khối gỗ **1,5 × 2,5 × 7,5 cm** | xác nhận (slide khóa học) |
| Khối ô nhiễm đặt ngẫu nhiên ở **4 vị trí**; kho trung hòa do đội tự chọn | xác nhận (slide khóa học) |
| Robot phải xuất phát **nằm trọn trong CRL**, không đè viền đen | xác nhận (slide khóa học) |
| Điểm về CRL chỉ tính khi **cả hai bánh** nằm trong CRL | xác nhận (slide khóa học) |

## 3. Leanbot (Standard)
Xác nhận từ mã mẫu Arduino công khai (github.com/lesysang1322002/LeanbotDemo) và leanbot.space:
- Bánh xe động cơ bước: `LbMotion.runLR(trái, phải)`, đi theo **mm** (`waitDistanceMm`), quay theo **độ** (`waitRotationDeg`).
- **4 cảm biến dò line** nhìn xuống (`LbIRLine.read()` trả 4 bit), thêm cảm biến hồng ngoại hai bên.
- **Tay gắp** 2 càng servo: `LbGripper.open()` / `close()`.
- Cảm biến siêu âm đo khoảng cách (`Leanbot.pingCm()`), còi, vòng đèn RGB 7 bóng, 4 nút chạm.
- Có cảm biến màu (leanbot.space liệt kê), chưa thấy trong mã mẫu: chưa rõ hạng Creator có dùng không.
- **Tên khối Blockly chính thức: đã có đủ.** 48 khối Leanbot, nhãn Anh và Việt, liệt kê trong
  [`../../tools/lbeditor-vi/leanbot_vi.js`](../../tools/lbeditor-vi/leanbot_vi.js); các khối hay
  dùng nhất tóm tắt ở [`leanbot-airoc-vi.md`](leanbot-airoc-vi.md) §5.5.
- **Khoảng tốc độ bánh xe: −59…59 vòng/phút, hoặc −2000…2000 bước/giây** (xác nhận, slide Bài 1).
- **Tay gắp: mở = 0°, đóng = 90°** (xác nhận, slide Bài 2 và tooltip khối).
- Năm chương trình mẫu chính thức của ba nhiệm vụ nằm ở kho công khai
  `git.pythaverse.space/ptvairoc/Synapsecity_Primary`; phân tích ở
  [`../research/pythaverse-synapse-city.md`](../research/pythaverse-synapse-city.md) §5.
  Đáng chú ý: mẫu **không dùng cảm biến siêu âm** và **không đọc đồng hồ** — robot định vị
  hoàn toàn bằng đếm ngã tư, và giữ trong 2 phút chỉ bằng cách chạy nhanh.

## 4. Cách Thế giới 6 mô phỏng (gần đúng)
- Sa bàn là **lưới ngã tư**: mỗi ô là một ngã tư của đường line đen. "Tiến 1 ô" = dò line tới ngã tư kế tiếp.
  - **Đơn giản hóa, HLV cần kiểm:** trên sa bàn thật, một đoạn line thẳng giữa hai dãy nhà có thể **không có ngã tư nào để đếm** (robot đi theo line tới khi gặp vạch / ngã tư ở xa). "Ngã tư" của trò chơi là cách làm đơn giản để dạy đếm. HLV gửi ảnh sa bàn và bộ khối Blockly Leanbot (`coach-questions.md` H17) để AI chỉnh sa bàn và nhãn lệnh (P3-07).
- Ba nhiệm vụ là ba loại mục tiêu: **khoanh vùng** (thả khối rào khi đứng trên ô vùng ô nhiễm), **trung hòa** (thả khối trung hòa khi đứng trên trạm cùng màu), **thu hồi** (thả khối ô nhiễm khi đứng trong phòng thí nghiệm). Gắp / thả tại chỗ robot đứng, như Leanbot chạy tới khối rồi đóng càng. Về phòng thí nghiệm cuối lượt là điểm thưởng.
- Điểm và thời gian là dữ liệu trong `content/`, tạm theo ghi chú cũ (45/160/100/40, 120 s).
- Trên giao diện ghi "Sa bàn tập, gần giống đề thi". Khi có luật thật, sửa dữ liệu, không sửa code.

## 5. Việc cần làm với Thế giới 6 sau cập nhật này

Luật đã rõ hơn, nên `content/shared/robotlab.json` và các màn W6 có thể đối chiếu lại:

- Lưới sa bàn thật là **3×3 khu** (A–H + CRL), không phải 3×4 như phần chơi không máy tính mô tả.
- Khối trung hòa phải **khớp màu** với khối ô nhiễm trong cùng ô mới được 160 điểm — kiểm xem
  luật trong `robotlab.json` có đúng điều kiện này không.
- Điểm về CRL (40) chỉ tính khi **cả hai bánh** nằm trong CRL.
- `curriculum.md` §6 mô tả Thế giới 6 trước khi có bảng hạng; hạng của bé là **Creator**, 8 tham số khối.

Chưa làm những việc này — ghi ra để không quên.
