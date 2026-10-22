# Khóa Leanbot — mục lục

Khóa thứ hai trong app CodeQuest, dạy robot Leanbot thật để đi thi AIROC 2026. Dịch và viết
lại từ khóa "Synapse City Primary" của Pythaverse. Ranh giới với CodeQuest: ADR-0028.

## Trạng thái ngày 21/10/2026 — đang tạm dừng ở đây

Khóa Leanbot **tạm dừng sau Bài 4** để quay lại hoàn thiện CodeQuest. Đọc mục này trước khi
làm tiếp, nó nói chỗ đang đứng và việc tiếp theo.

**Đã xong:**

- **Bản của thầy:** đủ **17 giáo án** (Bài 0 → 16), 155 bài ôn luyện có đáp án, giáo trình
  tổng, tài liệu thiết bị, khảo sát nền tảng.
- **Bản cho bé trong app:** **Bài 0 → 4** (`content/leanbot/bai-00…bai-04.json`), tổng 115
  màn và 30 câu kiểm tra. Bài 0 là **cổng** 9 ô tích (ADR-0029).
- **Mỗi bài kết bằng phần `Kiểm nghiệm`:** phép thử trên robot thật, con số nào là đạt, bảng
  "con thấy → sửa chỗ nào". Bắt buộc với mọi bài thêm sau, xem "Thêm một bài mới" mục 5.
- **Nạp code bằng dòng lệnh** đã chạy thật trên robot `LB398377`, xem `thiet-bi/cai-dat.md`.
  Nhờ nó phát hiện bốn tên hàm sai trong tài liệu (bảng ngay dưới).

**Việc tiếp theo, theo thứ tự:**

1. **Bài 5** — bắt đầu phần AI (Teachable Machine, Scratch), **không dùng Leanbot**. Phần
   "Kiểm nghiệm" của bài này phải khác: thử xem mô hình đoán sai lúc nào, không đo bằng thước.
2. Bài 6 → 9 (AI), rồi 10 → 12 (Bản Sao Số), rồi 13 → 16 (ba nhiệm vụ thi).
3. Hai câu còn treo cần robot và một vạch đen thật: nghĩa của `LbIRLine.isBlackDetected()`
   (cả bốn mắt hay bất kỳ mắt nào) và thứ tự bốn mắt ①②③④ ngoài đời. Chương trình đo đã nạp
   sẵn trong robot: đặt ba tư thế trắng / đen / nửa trong nửa ngoài rồi đọc serial.

**Chưa làm:** gửi bản việt hóa `tools/lbeditor-vi/` cho Pythaverse · bộ dựng PDF vẫn nằm ngoài
repo · chưa xem 2 khóa Pythaverse còn lại.

## Đường dẫn cần biết

Mọi trang khóa học gửi bé và thầy tới — trình soạn khối, robot ảo, Bản Sao Số, Plearn từng bài,
driver CH340, kho chương trình mẫu, video hướng dẫn của hãng, Teachable Machine — nằm **một chỗ**:
`content/leanbot/duong-dan.json`, hiện trong app ở **`/leanbot/duong-dan`** (thẻ "Đường dẫn cần
biết" ngay đầu danh sách bài). Thêm đường dẫn mới thì thêm vào file đó, đừng chỉ ghi trong giáo án.

Hai trang `git.pythaverse.space` cần đăng nhập (HLV giữ tài khoản lớp, không ghi vào repo).

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

**Bản cho bé trong app** (`content/leanbot/*.json`, xem `/leanbot`) hiện có: **Bài 0 → 4**.
Các bài còn lại mới có bản của thầy ở `giao-an/`.

**Bài 0 là cổng** (ADR-0029). Bài 0 bản cho bé có **9 ô tích**, mỗi ô là một việc làm xong
trên robot thật. Chưa tích đủ thì Bài 1 trở đi hiện trong danh sách nhưng mang ổ khóa, bấm
không vào, gõ thẳng URL cũng bị chặn. Thêm một ô tích vào `content/leanbot/bai-00.json` là
cổng tự chặt hơn, không phải sửa code.

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

## Đã chốt trên robot thật (21/10/2026)

Biên dịch bằng **máy chủ của hãng** (`cs.leanbot.space/v3/compile`, đúng cái trình soạn web
dùng) rồi nạp xuống robot bằng `avrdude`. Cách làm: [`thiet-bi/cai-dat.md`](thiet-bi/cai-dat.md)
mục "Nạp code không cần trình duyệt". Nhờ đó sửa được bốn chỗ sai trong tài liệu:

| Tài liệu từng ghi | Thư viện thật |
|---|---|
| `LbMotion.stop()` | **Không có.** Chỉ có `LbMotion.stopAndWait()` |
| `Leanbot.delay(1.0)` | **Không có.** Thật là `LbDelay(1000)` — hàm tự do, đơn vị mili giây |
| `Leanbot.objectInFront(25)` | **Không có.** Dạng biên dịch được: `Leanbot.pingCm() <= 25`. Có `ping()`, `pingCm()`, `pingMm()` |
| `LbTouch.waitUntil(TB1A)` | **Không có.** Chỉ có `LbTouch.read(TB1A)` |

Có thật và đã biên dịch: `runLR`, `runLRrpm`, `waitDistanceMm`, `waitRotationDeg`,
`stopAndWait`, `LbGripper.open/close/moveTo/moveToLR`, `LbIRLine.read/value/isBlackDetected/doManualCalibration`,
`LbIRSensor.read(sir6L)`, `LbMission.begin/end`. **Không có** `runLRsps`, `waitDistanceCm`.
`LbIRLine.read` có ba dạng: không tham số, một ngưỡng, hoặc bốn ngưỡng.

Dòng robot in ra lúc khởi động là **số hiệu của chính nó** (máy đang dùng: `LB398377`).

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
   phiếu ôn luyện · bé hay vướng · **kiểm nghiệm cuối bài** · **ghi chú về bản gốc**.
3. **Mỗi đáp án là một đoạn riêng**, viết `**Đáp án:**` ở đầu dòng và có **dòng trống phía
   trước**. Dòng bắt đầu bằng `1)` hoặc `2)` bị markdown hiểu là danh sách và sẽ nuốt dòng
   đáp án ngay dưới nó.
4. **Viết bản cho bé** `content/leanbot/bai-NN.json` theo `LeanbotLessonSchema`. Schema giới
   hạn độ dài từng trường, nên nếu một màn không vừa thì **tách thành hai màn**, đừng rút gọn
   câu cho vừa.
5. **Màn nào nhắc tới một trang web hay công cụ thì gắn link ngay trên màn đó** (`links`, tối đa
   4), và thêm trang đó vào `duong-dan.json` nếu chưa có. Viết "mở trình soạn khối lệnh" mà không
   có link là bắt bé và thầy tự đi tìm.
6. **Bài nào cũng kết bằng phần `Kiểm nghiệm`** — bắt buộc, cả hai bản. Gồm ba thứ:
   - **Phép thử trên robot thật**, viết thành các bước làm được ngay: đặt robot ở đâu, nạp
     chương trình nào, chạm nút gì, **đo bằng gì**. Nói rõ **con số nào là đạt** ("23–27 cm",
     "sai trong 2–3 cm"), đừng viết "robot chạy đúng".
   - **Bảng "con thấy … → sửa chỗ nào"**, lấy từ mục "bé hay vướng" của giáo án.
   - **Một ô tích** cho phép thử chính, viết theo kết quả đo được chứ không theo cảm giác:
     "Con đo rồi: robot đi gần đúng 50 cm", không phải "Con làm xong bài".

   Phép thử tốt là phép thử **phân biệt được đúng với gần đúng**: nhấc cả robot lên xem khối
   có rơi không (Bài 2), cầm vở chắn ngang khi robot đang chạy (Bài 3). Chạy được một lần
   không chứng minh gì cả.
7. **Ảnh — gần như màn nào cũng có** (HLV 22/10/2026: bé đọc chữ không hiểu, học qua hình).
   Robot đi thế nào thì vẽ robot với mũi tên; ghép khối gì thì chụp đúng các khối đó; dễ nhầm
   thì một cặp hình "Đúng / Sai". Vẽ bằng `npm run leanbot:art` (xem
   `tools/leanbot-art/README.md`), gắn vào màn bằng `images`. Ảnh chụp tay: bản của thầy dùng
   `docs/leanbot/img/`, bản của bé dùng `apps/web/public/leanbot/img/`.
8. **Cập nhật hai bảng**: bảng 17 buổi dạy ở trên, và bản đồ bài trong `giao-trinh.md`.
9. **Chạy `npm run content:check`.** Nó kiểm schema, id (`bai-<2 số>`) và sự tồn tại của ảnh.
10. **Thêm vào `apps/web/e2e/leanbot.spec.ts`** nếu bài có kiểu màn mới.

Việc nào còn treo và cần kiểm trên robot thật: xem bảng cuối tài liệu này.
