# Khóa Leanbot — mục lục

Khóa thứ hai trong app CodeQuest, dạy robot Leanbot thật để đi thi AIROC 2026. Dịch và viết
lại từ khóa "Synapse City Primary" của Pythaverse. Ranh giới với CodeQuest: ADR-0028.

## Thư mục này có gì

| Nơi | Nội dung | Viết cho ai |
|---|---|---|
| [`giao-trinh.md`](giao-trinh.md) | **Nguồn chuẩn.** Hạng thi, bản đồ 17 bài, thuật ngữ bắt buộc (§5), các con số phải đúng (§6), lộ trình buổi dạy, cách đánh giá | Huấn luyện viên |
| [`giao-an/`](giao-an/) | 17 buổi dạy: mục tiêu, cách dạy từng bước, chương trình mẫu kèm code, phiếu ôn luyện có đáp án | Huấn luyện viên |
| [`thiet-bi/`](thiet-bi/) | [Cài đặt từ số không](thiet-bi/cai-dat.md): sạc, nạp code, hiệu chỉnh, bảng khắc phục sự cố | Huấn luyện viên |
| [`nen-tang/`](nen-tang/) | [Khảo sát Pythaverse](nen-tang/pythaverse.md): nền tảng gồm những gì, §7 danh sách lỗi của khóa gốc, §8 quyền riêng tư | Tham khảo |
| `img/` | Ảnh dùng trong giáo án | — |

**Bản cho bé nằm ở chỗ khác.** `content/leanbot/*.json` là bài học bé tự đọc trong app
(`/leanbot`), chia theo màn, chữ ngắn, có ảnh. Thư mục này là **bản của thầy**: dài, đầy đủ,
để đứng lớp và để tra. Hai bản cho hai người đọc khác nhau — xem ADR-0028.

**Trước khi lên lớp, đọc §5 và §6 của [`giao-trinh.md`](giao-trinh.md).** §5 là bảng thuật
ngữ Anh ↔ Việt bắt buộc dùng, §6 là những con số sai một chữ là robot chạy sai.

## 17 buổi dạy

| Bài | Tên | Dạy gì | Bài ôn luyện |
|---|---|---|---|
| **0** | [**Làm quen và kiểm tra Leanbot**](giao-an/bai-00-bat-dau.md) | Phần cứng, hai cổng USB, sạc, giữ gìn, chương trình kiểm tra 8 lệnh, hiệu chỉnh, nạp code — **có ảnh** | 8 |
| 1 | [Chào Leanbot! Cùng di chuyển](giao-an/bai-01-di-chuyen.md) | Thứ tự các bước, tiến/lùi theo cm, quay tại chỗ theo độ, số âm | 10 |
| 2 | [Cánh tay kẹp thần kỳ](giao-an/bai-02-tay-gap.md) | Servo, góc 0° mở / 90° đóng, chuỗi gắp–chở–thả | 8 |
| 3 | [Mắt thần siêu âm](giao-an/bai-03-sieu-am.md) | Đo khoảng cách, `nếu`, `lặp khi`, hai ngưỡng 25/30 cm | 10 |
| 4 | [Đi theo đường thông minh](giao-an/bai-04-bam-vach.md) | 4 mắt hồng ngoại, cân chỉnh, mã vạch, `switch` | 10 |
| 5 | [Dữ liệu là gì?](giao-an/bai-05-du-lieu.md) | AI học từ dữ liệu, dữ liệu tốt / xấu | 9 |
| 6 | [Dạy robot phân loại ảnh](giao-an/bai-06-phan-loai-anh.md) | Lớp, thu mẫu, làm sạch dữ liệu | 8 |
| 7 | [Âm thanh vô hình](giao-an/bai-07-am-thanh.md) | Rung động, biên độ, tần số, ảnh phổ | 8 |
| 8 | [Phân loại âm thanh nâng cao](giao-an/bai-08-am-thanh-nang-cao.md) | Thu mẫu cân bằng, ngưỡng, ma trận nhầm lẫn | 10 |
| 9 | [Nhận diện dáng người](giao-an/bai-09-dang-nguoi.md) | Mô hình có sẵn, khung xương, đạo đức AI | 10 |
| 10 | [Nhìn robot chạy thử trước](giao-an/bai-10-ban-sao-so.md) | Bản Sao Số, nghĩ trước làm sau | 10 |
| 11 | [Điều khiển đường đi của robot](giao-an/bai-11-duong-di.md) | Dự đoán → chạy → so sánh, chỉnh từng tham số | 8 |
| 12 | [Từ robot ảo sang robot thật](giao-an/bai-12-ao-sang-that.md) | Chuyển code, nạp USB, sai lệch ảo/thật | 8 |
| 13 | [Nhiệm vụ 1: Khoanh vùng](giao-an/bai-13-nhiem-vu-1.md) | Dò vạch + đếm ngã tư + đẩy khối (45 điểm) | 10 |
| 14 | [Nhiệm vụ 2: Rải chất trung hòa](giao-an/bai-14-nhiem-vu-2.md) | Gắp từ kho, chở, thả đúng màu (160 điểm) | 10 |
| 15 | [Nhiệm vụ 3: Mang mẫu về lab](giao-an/bai-15-nhiem-vu-3.md) | Quay đầu khi đang kẹp, tìm lại vạch (100 điểm) | 9 |
| 16 | [Nhiệm vụ tổng hợp](giao-an/bai-16-tong-hop.md) | Ghép ba nhiệm vụ trong 2 phút, chia hàm | 9 |

Tổng **155 bài ôn luyện** có đáp án.

**Bản cho bé trong app** (`content/leanbot/*.json`, xem `/leanbot`) hiện có: **Bài 0, 1, 2
và 3**. Các bài còn lại mới có bản của thầy ở `giao-an/`.

## Cách đọc một giáo án

- **Bài 0** dạy cách *dùng* bộ công cụ, không dạy lập trình. Dạy trước mọi bài khác, vì
  chưa nạp được code vào robot thì 16 bài sau không chạy được. Bài này do chúng ta viết:
  khóa gốc và trang `leanbot.space/start/` đều không có hướng dẫn nào như vậy.
- **Bài 1–4, 13–16** dùng robot Leanbot và khối Blockly. Đây là phần đi thi.
- **Bài 5–9** là phần AI, dùng Teachable Machine và Scratch, **không** dùng Leanbot.
  Bắt buộc để lấy chứng chỉ, nhưng hạng Creator không dùng khi thi.
- **Bài 10–12** chạy trên Bản Sao Số (robot ảo), sinh Python thay vì C++.

Mục **"Ghi chú về bản gốc"** ở cuối mỗi giáo án liệt kê lỗi và chỗ mâu thuẫn trong khóa gốc
tiếng Anh. Đọc mục này trước khi lên lớp: bé sẽ nhìn thấy slide gốc trên Plearn, và có chỗ
slide nói khác chương trình mẫu. Tổng hợp mọi lỗi tìm được:
[`nen-tang/pythaverse.md`](nen-tang/pythaverse.md) §7.

## Chỗ cần HLV kiểm lại trước khi dạy

Những điểm giáo án **không tự quyết được**, đã đánh dấu trong từng file:

| Bài | Cần kiểm | Vì sao |
|---|---|---|
| 1, 4 | ~~Trình soạn khối đổi **vòng/phút** ↔ **bước/giây** thế nào~~ — **đã chốt: ô chọn trên khối** | Đọc thẳng khối trong trình soạn: `LbMotion.run` có ô `UnitSpeed` với đúng hai lựa chọn `vòng/phút → rpm` và `bước/giây → sps`. Tương tự: quãng đường có `cm`/`mm`, thời gian có `giây`/`mili giây`, góc chỉ có `độ`. Xem [Bài 0 §8](giao-an/bai-00-bat-dau.md) |
| 4 | ~~Mắt cảm biến nào nằm bên nào~~ — **đã chốt: 8 mắt là HAI nhóm bốn** | Ảnh phần cứng chính thức ghi "8 Infrared Sensors", và chương trình kiểm tra chính thức đọc hai nhóm bằng hai hàm khác nhau: `LbIRLine.read()` cho 4 mắt **dưới bụng** (`ir0L…ir3R`, dò vạch) và `LbIRSensor.read(sir6L)` cho 4 mắt **hai bên** (`sir4L, sir5R, sir6L, sir7R`, nhìn vật). Lệch thứ tự là vì so hai nhóm khác nhau. Xem [Bài 0 §1](giao-an/bai-00-bat-dau.md) |
| 4 | Dòng `if (isBlackDetected()) break;` — **không phải lỗi xuất file** | Dòng này có **nguyên văn như vậy** trong chương trình chính thức `leanbot/Tools/Sample Code/Leanbot_Test_and_Demo_v1.ino`, nên slide không mất chữ nào. Còn lại cần kiểm: `isBlackDetected()` nghĩa là *cả bốn mắt thấy đen* hay *có mắt nào thấy đen* — hai nghĩa cho hai hành vi khác hẳn ở ngã tư |
| 2, 14, 15 | Góc 50° của tay gắp trong mẫu là mở hay đóng | Mẫu chỉ có `moveTo(50)`, slide dạy 0° mở / 90° đóng |
| 11 | `Trái 30 / Phải −30` là quay trái hay phải | Ba slide trong cùng một chương nói ngược nhau |
| 6 | Yêu cầu nộp thật của Dự án 1 | 45 slide không nhắc dự án; chỉ Plearn gắn vào |
| 14, 15 | Dạy theo slide hay theo chương trình mẫu | Hai nguồn mâu thuẫn ở phần tay gắp và siêu âm; câu hỏi kiểm tra chấm theo slide |
| 16 | Chặng nào thuộc nhiệm vụ nào | Mẫu có 11 chặng liền mạch, không slide nào chia nhóm |
| 13, 15, 16 | ~~Dừng ở ngã tư thứ N hay N+1~~ — **đã chốt: thứ N** | Xem giải thích ngay dưới bảng. Chữ trên slide hàm ý N+1, slide sai |
| 13, 16 | Dạy tốc độ 30–50 % hay chạy hết cỡ như mẫu | Bài 13 khuyên 30–50 %, mọi chương trình mẫu chạy 2000 bước/giây |
| 0 | Bốn tệp hiệu chỉnh khóa gốc nhắc tên | `Gripper_Calibration.ino`, `Gripper_Troubleshooting.ino`, `Step_Motor_Calibration.ino`, `Test_Touch_Sensor.ino` **không có** trong kho `leanbot/Tools` (sửa lần cuối 28/02/2024). Hỏi Pythaverse xem chúng ở kho nào |
| 0 | Quy trình hiệu chỉnh tay gắp, đèn LED, động cơ bước | Chỉ có trong 3 video YouTube; phần chữ của khóa gốc chỉ là danh sách đề mục. §6 Bài 0 viết từ chương trình kiểm tra, **chưa phải từ video** |

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

## Thêm một bài mới

Mỗi bài tồn tại ở **hai bản**: bản của thầy trong `giao-an/`, bản của bé trong
`content/leanbot/`. Thứ tự làm:

1. **Bóc nội dung khóa gốc** trước khi viết một chữ nào. Khóa gốc là
   `learn.pythaverse.space/course/view.php?id=1437`; nội dung nằm trong H5P
   (`window.H5PIntegration`), không nằm trong HTML. Cách lấy: `nen-tang/pythaverse.md` §2.
2. **Viết giáo án** `giao-an/bai-NN-<slug>.md`. Giữ đúng bộ mục của các bài đã có: bé học
   xong làm được gì · cần chuẩn bị · thuật ngữ của bài · cách dạy · chương trình mẫu ·
   phiếu ôn luyện · bé hay vướng · **ghi chú về bản gốc**.
3. **Mỗi đáp án là một đoạn riêng**, viết `**Đáp án:**` ở đầu dòng và có **dòng trống phía
   trước**. Dòng bắt đầu bằng `1)` hoặc `2)` bị markdown hiểu là danh sách và sẽ nuốt dòng
   đáp án ngay dưới nó.
4. **Viết bản cho bé** `content/leanbot/bai-NN.json` theo `LeanbotLessonSchema`. Schema giới
   hạn độ dài từng trường, nên nếu một màn không vừa thì **tách thành hai màn**, đừng rút gọn
   câu cho vừa.
5. **Ảnh**: bản của thầy dùng `docs/leanbot/img/`, bản của bé dùng
   `apps/web/public/leanbot/img/`. Cùng tệp thì chép sang cả hai nơi.
6. **Cập nhật hai bảng**: bảng 17 buổi dạy ở trên, và bản đồ bài trong `giao-trinh.md`.
7. **Chạy `npm run content:check`.** Nó kiểm schema, id (`bai-<2 số>`) và sự tồn tại của ảnh.
8. **Thêm vào `apps/web/e2e/leanbot.spec.ts`** nếu bài có kiểu màn mới.

Việc nào còn treo và cần kiểm trên robot thật: xem bảng cuối tài liệu này.
