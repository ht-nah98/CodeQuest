# Phần thưởng & kinh tế xu

Nguồn chuẩn cho mọi con số liên quan tới sao, xu, gợi ý, huy hiệu, mở khóa. Cài đặt: `docs/architecture/rewards-engine.md`.

> Mọi thời điểm "trong ngày" tính theo múi giờ **Asia/Ho_Chi_Minh**.
> **Có trong GĐ 1:** sao, xu, gợi ý 3 tầng, lưới an toàn, xu khởi đầu, thưởng ngày + chuỗi ngày, mở khóa. **GĐ 2:** mục tiêu nhóm. **GĐ 4:** cửa hàng, huy hiệu.

### Định nghĩa dùng trong tài liệu này
| Từ | Nghĩa chính xác |
|---|---|
| **Phiên màn** | Từ lúc vào màn tới lúc rời màn (về thế giới, tải lại trang, đóng tab) |
| **Lượt thua** | Lượt chạy có `result` là `incomplete`, `crash` hoặc `timeout`. Kết quả `error` (chương trình rỗng, quá số khối) **không** tính, để bấm ▶ liên tục không mở được gợi ý miễn phí |
| **Chuỗi thua** (`failStreak`) | Số lượt thua liên tiếp trong phiên màn; về 0 khi thắng |
| **Thắng lượt đầu** | Lượt chạy **đầu tiên từ trước tới nay** của bé ở màn đó là thắng |
| **Hoàn thành bài giảng** | Đã tới thẻ cuối (thẻ quiz trả lời đúng hoặc sai đều được) |
| **Ngày có học** | Ngày có ít nhất 1 lượt **thắng** (kể cả chơi lại màn cũ) hoặc hoàn thành 1 bài giảng |

## 1. Sao (0–3 mỗi màn)

| Sao | Điều kiện |
|---|---|
| ⭐ | Hoàn thành màn |
| ⭐⭐ | Hoàn thành **và** số khối ≤ `par` |
| ⭐⭐⭐ | ⭐⭐ **và** không dùng gợi ý tầng 2 hoặc 3 trong phiên màn đó |

**Màn có mục tiêu sao** (`starGoals`, HLV duyệt 03/10/2026, cài đặt ở P2-21). Từ Thế giới 3, màn `build`/`bughunt` có thể khai báo mục tiêu riêng (nhặt đủ măng, về đích với ≤ N bước, không đá thùng…), hiện thành thẻ "Mục tiêu ⭐" trước khi chơi. Khi đó bảng trên được thay bằng:

| Sao | Điều kiện |
|---|---|
| ⭐ | Hoàn thành màn |
| ⭐⭐ | Hoàn thành **và** đạt mọi mục tiêu trong `starGoals` |
| ⭐⭐⭐ | ⭐⭐ **và** số khối ≤ `par` (`bughunt`: số khối thay đổi ≤ `parEdits`) **và** không dùng gợi ý tầng 2 hoặc 3 |

`par` của màn có mục tiêu sao là số khối ít nhất của chương trình **vừa thắng vừa đạt mọi mục tiêu** (`npm run par` kiểm). Màn không khai báo `starGoals` giữ bảng cũ, nên Thế giới 1–2 không đổi.

Trần sao do gợi ý (áp dụng cho **phiên màn hiện tại**, tức từ lúc vào màn tới lúc rời màn):
- Đã mua gợi ý **tầng 2** → tối đa ⭐⭐
- Đã mua gợi ý **tầng 3** → tối đa ⭐

Cách chơi đặc biệt:
- `predict`: đúng ngay lần chọn đầu = ⭐⭐⭐, lần 2 = ⭐⭐, từ lần 3 trở đi = ⭐. Không có `par`.
- `bughunt`: ⭐⭐ khi số khối thay đổi ≤ `parEdits` (mặc định 1), thay cho điều kiện số khối.
- `creative`: không có sao. Lần lưu đầu tiên được +10 xu.

Sao tốt nhất của mỗi màn được lưu lại. Chơi lại chỉ có thể **tăng** sao, không bao giờ giảm.

## 2. Xu

### Nguồn xu
| Sự kiện | Xu | Ghi chú |
|---|---:|---|
| Hoàn thành màn lần đầu | +10 | |
| Đạt ⭐⭐ lần đầu | +5 | |
| Đạt ⭐⭐⭐ lần đầu | +5 | |
| Thắng ngay **lượt chạy đầu tiên** của lần hoàn thành đầu | +5 | |
| Hoàn thành một bài giảng (lần đầu) | +5 | |
| Thưởng ngày: lần đầu trong một "ngày có học" | +10 | Cộng ngay tại lượt thắng / bài giảng đầu tiên của ngày |
| Mốc chuỗi 7 ngày liên tiếp | +50 | Mỗi lần chuỗi chạm 7, 14, 21… ngày |
| Chơi lại màn đã ⭐⭐⭐ và thắng | +1 | Tối đa **5 xu/ngày** từ nguồn này |
| Lưu tác phẩm sáng tạo lần đầu (mỗi màn `creative`) | +10 | |
| Mục tiêu nhóm đạt mốc | +20 mỗi bé | Do huấn luyện viên đặt |

Tối đa một màn mang lại **25 xu** (10 + 5 + 5 + 5), chưa kể thưởng ngày. Ví dụ: màn đầu tiên của ngày, thắng 3 sao ngay lượt đầu → 25 + 10 = **35 xu**.

### Tiêu xu
| Vật phẩm | Giá |
|---|---:|
| Gợi ý tầng 1: 💡 Gợi ý tư duy | 5 |
| Gợi ý tầng 2: 🧭 Chỉ bước tiếp | 15 |
| Gợi ý tầng 3: 📜 Xem lời giải | 40 |
| Skin nhân vật | 50–200 |
| Màu bút, hiệu ứng pháo hoa, nhạc nền | 30–100 |
| Mở màn bonus | 30 |

Đã mua gợi ý tầng 1 của một màn thì **xem lại miễn phí mãi mãi** ở màn đó. Tầng 2 có thể mua nhiều lần, mỗi lần chỉ thêm một khối tiếp theo. Mode `predict` chỉ có tầng 1.

### Lưới an toàn chống nản (trong một phiên màn)
- Sau **3 lượt chạy thua** liên tiếp → gợi ý tầng 1 **miễn phí**.
- Sau **6 lượt chạy thua** liên tiếp → gợi ý tầng 2 giảm còn **5 xu**.
- Không đủ xu mà vẫn cần giúp → gợi ý tầng 1 luôn mở miễn phí sau 3 lượt thua.

### Số dư
- Xu không bao giờ âm. Không đủ xu thì nút mua bị khóa, kèm câu "Cần thêm N xu".
- Mỗi bé bắt đầu với **30 xu** để thử gợi ý ngay từ đầu.

## 3. Mở khóa

| Đối tượng | Điều kiện mở |
|---|---|
| Màn `guided` / `practice` | Màn liền trước trong thế giới đã hoàn thành |
| Màn `challenge` | Đã hoàn thành mọi màn `practice` của thế giới; không bắt buộc để qua thế giới |
| Màn `boss` | Đã hoàn thành mọi màn `guided` + `practice` |
| Màn `creative` | Mở ngay khi vào thế giới |
| Màn `bonus` | Mua bằng 30 xu ở trang thế giới, sau khi đã thắng boss |
| Thế giới tiếp theo | Đã thắng `boss` **và** có ≥ 60% tổng số sao tối đa (tính trên màn `guided`, `practice`, `boss` của thế giới) |
| Bài giảng | Luôn mở; màn đầu tiên của thế giới yêu cầu đã xem bài giảng **mở đầu** 1 lần. Bài "Khối mới" (`beforeLevel`) không khóa màn nào |

Huấn luyện viên có quyền **mở khóa thủ công** cho từng bé trong Góc huấn luyện viên.

## 4. Huy hiệu (bản đầu)

| ID | Tên | Điều kiện |
|---|---|---|
| `first-run` | Lần đầu chạy code | Bấm ▶ lần đầu |
| `world-<n>-clear` | Chinh phục \<thế giới\> | Thắng boss thế giới n |
| `loop-master` | Bậc thầy vòng lặp | 10 màn có khối lặp (`cq_repeat` hoặc `controls_whileUntil`) đạt ⭐⭐⭐ |
| `bug-detective` | Thám tử sửa lỗi | 5 màn `bughunt` đạt ⭐⭐ trở lên |
| `fortune-teller` | Nhà tiên tri | 5 màn `predict` đúng ngay lần đầu |
| `persistent` | Kiên trì | Thua ≥ 5 lượt rồi tự thắng mà không mua gợi ý tầng 2/3 |
| `thrifty` | Tiết kiệm | 10 màn `challenge` hoặc `boss` đạt ⭐⭐⭐ |
| `streak-7` | 7 ngày chăm chỉ | Chuỗi 7 ngày |
| `robot-cadet` | Tân binh robot | Hoàn thành 1 nhiệm vụ AIROC đầy đủ ở Thế giới 6 |

## 5. Mục tiêu nhóm
Huấn luyện viên đặt mục tiêu chung, ví dụ "Cả nhóm đạt 300 ⭐ trước Chủ nhật". Thanh tiến độ hiện ở Góc nhóm. Đạt mục tiêu thì **mỗi bé** được +20 xu và cả nhóm mở một sticker. **Không** hiển thị số sao của từng bạn cho các bạn khác.

## 6. Chỉ số theo dõi để cân bằng
| Chỉ số | Ngưỡng | Hành động |
|---|---|---|
| Tỷ lệ phiên màn có mua gợi ý tầng 3 | > 40% | Màn quá khó: thêm màn đệm hoặc sửa gợi ý |
| Thắng lượt đầu > 95% và thời gian < 20 s | | Màn quá dễ: gộp hoặc siết `par` |
| Số dư trung bình > 400 xu | | Thêm vật phẩm cửa hàng |
| Số dư trung bình < 20 xu | | Tăng thưởng hoặc giảm giá gợi ý |
