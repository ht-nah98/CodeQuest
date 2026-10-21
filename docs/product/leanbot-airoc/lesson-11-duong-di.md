# Bài 11 — Điều khiển và khám phá đường đi của robot

> Bài gốc: *Control and Explore Robot Paths* · 48 slide · 4 chương (Engage 9, Learn 20, Resolve 7, Growth 12) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62985>
>
> Buổi 13 trong lộ trình (giáo trình tổng §7). Cột mốc của buổi: **nộp Dự án 2 "Bằng lái robot tự hành"**.

## Bé học xong thì làm được gì
- Đọc một chương trình và **đoán trước** robot dừng ở đâu, rồi mới bấm Chạy.
- Chạy thử trên Bản Sao Số, so với điều mình đoán và nói được: khớp, gần khớp hay khác hẳn.
- **Đổi từng tham số một** (khoảng cách hoặc góc), chạy lại, và nói được số nào làm robot đổi chỗ dừng.
- Ghép được chương trình có khối Nhiệm vụ, tiến, dừng, chờ, rẽ, lùi, và gắn Ghi chú cho từng bước.
- Tìm đường ngắn, ít chỗ rẽ từ Khu A tới Khu H trên bản đồ Synapse City.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Máy tính có Chrome, vào được Plearn và Bản Sao Số | Bài này **không dùng robot thật**. Robot thật bắt đầu từ Bài 12 |
| Trình soạn khối bản **Python** để điều khiển Bản Sao Số | Slide chỉ ghi "Python Blockly Editor", không ghi địa chỉ. Địa chỉ lấy từ Bài 12: `https://ide.pythaverse.space/lbeditor-python-simulation/index.html` |
| Tờ lưới in sẵn 3×3 có chữ A, C, F / B, E, H / D, G, Bến xuất phát | Đề xuất của giáo án, để bé vẽ điểm dự đoán và đường đi. Slide có bé vẽ lên tờ lưới nhưng không nói tờ lưới lấy ở đâu |
| Bút chì hai màu | Một màu cho "đoán", một màu cho "chạy thật" |
| Bản vá tiếng Việt (`tools/lbeditor-vi/`) | Dạy bằng nhãn Việt trước, đối chiếu nhãn Anh sau (giáo trình tổng §4) |
| Bảng ghi chép thử (xem mục "Bé tự làm") | Thầy in hoặc chép lên bảng |

**Chưa lấy được từ khóa gốc:** cách mở Bản Sao Số, vị trí nút **Run**, cách chuyển qua lại giữa trình soạn khối và Bản Sao Số. Slide chỉ ghi "go to PNote, click Run" và nút **Back** trong màn hình mô phỏng. Bài 10 đã dạy bé mở Bản Sao Số; thầy mở lại trước giờ học và thử một lần.

## Thuật ngữ của bài
Từ đã có trong giáo trình tổng §5 (Nhiệm vụ, Chương trình, Tham số, Sửa lỗi, Chạy thử, Bản Sao Số, Khu A–H, vòng/phút...) không chép lại. Slide dùng chữ "Zone", giáo án dùng **Khu** theo §5.4.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Chief Engineer | Kỹ sư trưởng | Con là người ra lệnh cho robot |
| Prediction / predict | Dự đoán | Đoán robot dừng ở đâu **trước** khi bấm Chạy |
| Mission Name | Tên nhiệm vụ | Tên bản đồ robot sẽ chạy, ví dụ `SynapseCity.01` |
| Start-Up Command | Lệnh khởi động | Hai khối đầu giúp robot sẵn sàng nghe lệnh |
| Grid | Lưới ô | Bản đồ chia hàng và cột như bàn cờ |
| TERMINAL | Bến xuất phát | Ô xanh nhạt, nơi robot đỗ lúc đầu |
| Distance | Khoảng cách | Robot đi thẳng bao xa |
| Turn Angle / degrees | Góc quay / độ | Robot xoay bao nhiêu. 90 độ là góc vuông |
| Point turn | Quay tại chỗ | Hai bánh quay ngược chiều, robot xoay tại chỗ |
| Swing turn | Quay vòng cua | Hai bánh quay cùng chiều nhưng nhanh chậm khác nhau, robot đi cua rộng |
| milliseconds | mili-giây | 1000 mili-giây là 1 giây |
| Comment | Ghi chú | Khối ghi lời giải thích. Robot bỏ qua nó |
| Optimize | Làm cho tốt hơn | Tìm đường ngắn, ít chỗ rẽ hơn |
| Edge case | Thử số cực đoan | Thử số rất nhỏ, rất lớn xem robot ra sao |
| Python | Python | Chữ mà khối lệnh tự biến thành. Bản Sao Số đọc được chữ này |
| Run | Chạy | Nút để robot trên Bản Sao Số làm theo chương trình |

Slide đề xuất dịch Digital Twin thành "robot song sinh ảo". Giáo án **không dùng**, theo §5.3 là **Bản Sao Số**.

## Khối lệnh dùng trong bài
Nhãn Việt lấy từ `tools/lbeditor-vi/leanbot_vi.js`. Nhãn Anh đúng như trên slide.

| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `Leanbot.whenStarted` ("When Leanbot started") | Leanbot bắt đầu hoạt động | Mũ đỏ trên cùng, nơi chương trình bắt đầu |
| `LbMission.beginByServer_end` ("Mission: Begin Digital Twin" + ô chọn tên) | Nhiệm vụ: Bắt đầu trên Bản Sao Số … Nhiệm vụ: Kết thúc | Bọc ngoài mọi lệnh. **Cách 1:** chọn tên trong danh sách |
| `LbMission.beginByName_end` + khối Text | Nhiệm vụ: Bắt đầu trên Bản Sao Số + ô chữ | **Cách 2:** kéo khối chữ vào ô tên rồi gõ `SynapseCity.01`. Tên khối do người bóc tách suy ra, slide không ghi |
| `LbMotion.run` ("Run with velocity Left ? Right ?") | Di chuyển: Chạy với vận tốc Trái ? Phải ? | Đặt tốc độ hai bánh. Cùng dấu: đi thẳng. Âm: lùi. Chọn "Rẽ" thì hai bánh ngược dấu để xoay |
| `LbMotion.waitDistanceMm` ("Keep running for ? cm") | Di chuyển: Chạy đoạn đường ? cm | Chạy cho đủ quãng đường rồi mới làm lệnh sau |
| `LbMotion.waitRotationDeg` ("Keep turning for ? degrees") | Di chuyển: Rẽ góc ? độ | Rẽ cho đủ góc (xấp xỉ) |
| `LbMotion.stop` | Di chuyển: Dừng | Dừng robot, chờ lệnh sau |
| `Leanbot.delay` ("Wait for ? seconds") | Chờ ? giây | Đứng chờ. **Robot vẫn giữ tốc độ đang chạy** (theo slide). Đổi ô đơn vị sang mili-giây được |
| `LbMotion.wait` ("Keep turning for ? milliseconds") | Di chuyển: Tiếp tục rẽ trong ? mili-giây | Rẽ theo thời gian. Slide LEARN 16 dùng khối này, nhưng người bóc tách không chắc tên khối |
| `Leanbot.commentLine` ("Comment") | Ghi chú | Khối xám, lấy ở nhóm Leanbot. Ghi lời giải thích |
| `LbMission.end` | Nhiệm vụ: Kết thúc | Đóng khối Nhiệm vụ |

Hai đơn vị tốc độ: **vòng/phút** (từ −59 đến 59) hoặc **bước/giây** (từ −2000 đến 2000). Hai đơn vị khoảng cách: cm (khối cho chọn cm hoặc mm; từ −32.768 đến 32.768 mm). Góc rẽ từ −3.600 đến 3.600 độ. **Cả buổi chỉ dùng vòng/phút và cm** cho đỡ rối; bước/giây chỉ xuất hiện trong một ví dụ.

## Dạy thế nào

### Mở bài (5 phút)
Thầy nói: "Bài trước con đã xem robot chạy trong Bản Sao Số. Hôm nay con là **Kỹ sư trưởng**. Con ra lệnh, robot làm đúng như vậy."

Thầy chiếu đường đi dài, ngoằn ngoèo của robot (ENGAGE 05) và hỏi: "Đường này có gì chưa ổn?" Bé nói: dài, nhiều chỗ rẽ. Thầy chốt mục tiêu buổi: **tìm đường ngắn hơn** và **đoán trước robot dừng ở đâu**.

### Giảng (40 phút)

**1. Luật vàng (4 phút)**
- Thầy: đọc ba luật trên slide ENGAGE 07, nói bằng lời của thầy: robot chỉ làm đúng điều con viết, không tự đoán, code đúng thì lần nào cũng đúng.
- Bé: nhắc lại luật số 1 bằng lời mình.
- Hỏi: "Robot dừng quá sớm, đi quá xa hoặc rẽ sai. Lỗi nằm ở robot hay ở chương trình?" (Ở chương trình.)

**2. Vì sao phải đoán trước (2 phút)**
- Thầy: viết bốn bước lên bảng: **Đọc kỹ → Hình dung → Đánh dấu chỗ dừng → Chạy rồi so sánh**.
- Hỏi: "Đoán xong mới chạy thì học được mấy lần?" (Hai lần: lúc đoán và lúc kiểm.)

**3. Bản đồ Synapse City (3 phút)**
- Thầy: chiếu bản đồ 3×3. Hàng 1: A, C, F. Hàng 2: B, E, H. Hàng 3: D, G, Bến xuất phát (robot đỗ ở đây). Nói: "Bản đồ chia ô như bàn cờ. Đi đúng thì nhiệm vụ thành công, đi sai thì thất bại."
- Bé: chỉ vào ô A, ô H, Bến xuất phát trên tờ lưới.
- Lưu ý với thầy: bản đồ trên Bản Sao Số **không giống hệt** sa bàn thật (slide nói vậy), đủ để tập.

**4. Đọc chương trình đầu tiên (5 phút)**
- Thầy: chiếu chương trình `msNumberGrid` (xem mục Chương trình mẫu). Hỏi trước khi cho chạy: "Robot sẽ làm gì?"
- Bé: nói cho bạn bên cạnh nghe, rồi chạy. (Đáp án của slide: tiến 20 cm, dừng, lùi 20 cm, dừng, **về đúng chỗ cũ**.)
- Thầy chỉ cột bên phải: "Khối đổi thì chữ Python đổi theo." Cho bé tìm: dòng nào là "tiến"? dòng nào là "lùi"? Hỏi: "Hai cột giống và khác nhau chỗ nào?" (Giống: cùng làm tiến rồi lùi. Khác: một bên là khối, một bên là chữ do máy tự viết.)
- Bỏ qua slide giới thiệu Python (LEARN 07). Thầy chỉ cần nói "Python là một ngôn ngữ lập trình rất phổ biến". Không cần học thuộc.
- Nói thêm: khối ghi 20 cm, chữ Python ghi `20 * 10` vì Python đếm bằng mm (20 cm là 200 mm).

**5. Lệnh khởi động và Tên nhiệm vụ (4 phút)**
- Thầy: "Hai khối đầu giúp robot sẵn sàng nghe lệnh." Chỉ khối đỏ "Leanbot bắt đầu hoạt động" và khối "Nhiệm vụ: Bắt đầu trên Bản Sao Số".
- Cách 1: chọn tên trong danh sách. Danh sách trên slide có: `msNumberGrid` (đang chọn), `SWRP3.M04`, `ms1.1`, `ms11.1`, `ms11.2`, `ms12.1`.
- Cách 2: nhóm Text, kéo khối "some text" vào ô tên, gõ `SynapseCity.01`.
- Bé: làm cách 2 trên máy mình. Thầy đi quanh xem bé gõ đúng từng chữ, từng dấu chấm.
- Hỏi: "Tên nhiệm vụ để làm gì?" (Cho Bản Sao Số biết robot chạy trên bản đồ nào.)

**6. Đi, chờ, lùi (5 phút)**
- Thầy: ghép từng khối: Chạy Trái 30 Phải 30 vòng/phút → Chạy đoạn đường 4.2 cm → Dừng. Hỏi: "Số 30 và 4.2 là gì?" (Tham số: 30 là tốc độ, 4.2 là quãng đường.)
- Nhắc: tiến thì hai số **dương**, lùi thì hai số **âm**. Giới hạn vòng/phút là 59.
- Thầy thêm khối **Chờ 1.25 giây** vào giữa. Hỏi: "Chờ xong robot làm gì?" Bé thêm đoạn lùi (Trái −30 Phải −30, 4.2 cm, Dừng). Hỏi: "Vì sao lùi cũng phải 4.2 cm?" (Để về đúng chỗ cũ.)
- Nhắc: 1000 mili-giây là 1 giây.

**7. Hai kiểu rẽ (5 phút)**
- Thầy: dùng tay hoặc hai cây bút làm bánh xe. **Quay tại chỗ:** hai bánh quay ngược chiều, robot xoay tại chỗ, không tiến lên. **Quay vòng cua:** hai bánh cùng chiều nhưng một bánh nhanh hơn, robot đi vòng.
- Chương trình mẫu: Rẽ với Trái −30 Phải 30 vòng/phút, rẽ góc 90 độ, Dừng. Slide (LEARN 15) gọi đây là **quay trái 90 độ**.
- **Kiểm chứng trên máy, đừng tin chữ.** Slide LEARN 19 viết Trái 30 Phải −30 là "quay trái", trong khi slide LEARN 15 và 17 ngược lại (Trái −30 Phải 30 là trái; Trái 30 Phải −30 là phải). Thầy cho bé chạy cả hai cấu hình trên Bản Sao Số, ghi robot quay hướng nào. Theo hai slide kia, Trái 30 Phải −30 là quay **phải**; thầy xác nhận lại bằng mắt trước khi dạy.
- Quay theo thời gian (Trái 59 Phải 10, 2500 mili-giây) chỉ cho bé xem. Slide không cho công thức đổi mili-giây ra độ. Hỏi: "Con rẽ 90 độ thì dùng khối nào dễ hơn?" (Khối rẽ góc.)

**8. Ghi chú (3 phút)**
- Thầy: lấy khối "Ghi chú" (xám, nhóm Leanbot), gắn trước mỗi bước, ví dụ "1. Tiến 4.2 cm", "2. Chờ 1.25 giây", "3. Rẽ phải 90 độ".
- Bé: gắn ghi chú vào chương trình của mình.
- Hỏi: "Ghi chú giúp ai?" (Giúp mình và bạn đọc lại. Robot bỏ qua.)
- Slide LEARN 17 có lỗi gõ "s specific angle", thầy sửa miệng thành "a specific angle".

**9. Hai thứ quyết định đường đi (2 phút)**
- Thầy: viết lên bảng **Khoảng cách + Góc quay = đường đi chính xác của robot**. Số nhỏ thì đi ngắn hoặc rẽ nhẹ, số lớn thì đi xa hoặc rẽ gắt. 90 độ là góc vuông như ngã tư.

**10. Hoạt động 1: Đoán rồi chạy (7 phút)**
- Thầy: chiếu chương trình LEARN 19 / RESOLVE 01 (tiến 4.2 cm, rẽ 90 độ, tiến 20 cm). Hỏi ba câu: "Robot bắt đầu ở đâu? Sau khi rẽ nó quay mặt về hướng nào? Cuối cùng nó dừng ở đâu?"
- Bé: dùng ngón tay đi theo từng dòng, **đánh dấu điểm đoán bằng bút chì màu 1** trên tờ lưới, viết một câu vì sao. Nói với bạn bên cạnh.
- Rồi chạy, **không đổi gì cả**, chỉ nhìn: robot đi hướng nào? rẽ đúng chưa? dừng ở đâu? Đánh dấu điểm thật bằng bút màu 2.
- So sánh, thầy nói theo ba mức: **Khớp hẳn** ("Con hình dung robot rất chuẩn!"), **Gần khớp** ("Đúng hướng, lệch khoảng cách. Giờ con biết cần chỉnh gì."), **Khác hẳn** ("Đây là lúc học nhiều nhất. Do khoảng cách hay do cú rẽ?").

**11. Hoạt động 2: Đổi một số (làm ở mục Bé tự làm, phần A)**
Xem mục tiếp theo. Câu thầy nhắc trước khi bé bắt đầu: "Đổi **một** số thôi. Đoán lại. Rồi mới chạy."

### Bé tự làm (40 phút)
Mỗi bé có bảng ghi chép: **Số đã đổi · Đoán · Thật · Lệch mấy ô**.

**A. Đổi khoảng cách (10 phút).** Lấy chương trình ở bước 10. Đổi **chỉ** đoạn cuối từ 20 thành 30 cm. Đoán, chạy, ghi. Rồi đổi lại 20 và chỉ đổi 4.2 thành 6. Đoán, chạy, ghi. Hỏi: "Hai điểm dừng cách nhau mấy ô? Lệch ít hay nhiều?"
Slide (RESOLVE 04) cho bé đổi **cả hai số cùng lúc** rồi mới chạy. Giáo án tách ra từng số một, đúng với "Luật Kỹ sư" ở slide RESOLVE 06: **đổi một thứ một lần, luôn đoán trước, nhìn kỹ mọi kết quả**.

**B. Nhiệm vụ nhỏ: đi từ Khu A tới Khu H (15 phút).** Làm đủ ba bước, lặp lại tới khi robot dừng đúng Khu H:
1. **Đoán:** nhìn lưới, vẽ đường, viết chương trình **trước khi chạy**.
2. **Chỉnh:** so kết quả với Khu H, sửa khoảng cách hoặc góc, **từng số một**.
3. **Chạy:** chạy lại, đúng Khu H chưa?

Lưu ý với thầy: slide **không cho** độ dài mỗi ô lưới, không cho chương trình mẫu từ A tới H, và robot trong ảnh đỗ ở Bến xuất phát nhưng đề nói đi "từ A". Thầy tự đo trước trên Bản Sao Số: mỗi ô dài bao nhiêu cm, robot đặt ở A bằng cách nào. Nếu chưa đo được, cho bé tự đo bằng cách thử và ghi lại.

**C. Chọn đường tốt hơn (7 phút).** Chiếu bốn đường từ A tới H (slide GROWTH 03 và 06). Slide gọi đường 1 và 3 là "đường dài, nhiều chỗ rẽ", đường 2 và 4 là "đường thông minh, ít chỗ rẽ". Cho bé chọn đường và nói **vì sao**, dựa vào ba tiêu chí: **ngắn nhất, ít chỗ rẽ nhất, chạy lần nào cũng đúng**. Thử thách: tới Khu H chỉ với **2 chỗ rẽ hoặc ít hơn**. Số bước và thời gian bé tự đo (thanh trên Bản Sao Số có ô "Time").

**D. Thử số cực đoan (8 phút).** Bé điền bảng, mỗi dòng đoán trước rồi chạy:

| Thử | Đổi thành | Đoán | Thật |
|---|---|---|---|
| Khoảng cách quá nhỏ | 5 cm | | |
| Khoảng cách quá lớn | 200 cm | | |
| Góc quá nhỏ | 10 độ | | |
| Góc quá lớn | 135 độ | | |

Gợi ý trên slide: 5 cm gần như đứng yên; 200 cm đi quá xa mục tiêu; 10 độ gần như không đổi hướng; 135 độ... slide viết "quay ngược hẳn" nhưng quay ngược hẳn phải là 180 độ, nên thầy cho bé tự nhìn.

Bé chạy nhanh thì làm **thử thách thêm**: đi tới một khu chưa từng tới (Khu B hoặc C). Vẽ trên giấy trước, rồi mới viết chương trình.

### Chốt bài (5 phút)
Thầy hỏi ba câu (slide GROWTH 08), mỗi bé trả lời một câu:
1. Vì sao con chọn đường này?
2. Con đã đổi gì so với lần chạy đầu?
3. Lần sau con sẽ làm khác đi điều gì?

Thầy chốt bốn ý bằng lời của bé:
- **Nghĩ trước khi chạy.**
- **Tham số rất quan trọng**: khoảng cách và góc quyết định tất cả.
- **Đổi nhỏ có thể khác lớn**: một con số có thể đưa robot sang ô khác (slide: sai khoảng cách thì "quá đích", quá ngắn thì "chưa tới", rẽ sai thì "vào nhầm khu").
- **Con là người điều khiển**: robot không tự làm gì cả.

**Nộp Dự án 2: "Bằng lái robot tự hành"**
- Theo giáo trình tổng (§3, §7): dự án này được mở khóa **sau Bài 11**, và cột mốc buổi 13 là **nộp Dự án 2**.
- Plearn gắn dự án này vào Bài 11, nhưng 48 slide của bài **không hề nhắc** tên dự án (xem "Ghi chú về bản gốc").
- **Chưa lấy được:** đề bài, tiêu chí chấm và cách nộp của Dự án 2. Thầy mở trang Dự án 2 trên Plearn, đọc đề rồi nói lại với bé bằng tiếng Việt trước khi bé làm.
- Đề xuất của giáo án: bảng ghi chép "Số đã đổi · Đoán · Thật" của bé là bằng chứng tốt cho kỹ năng bài này; bé giữ lại để nộp hoặc để nhìn lại. Nhưng chưa biết đề có cần đến không.
- Thầy chỉ đánh dấu "nộp xong" khi Plearn đã ghi nhận.

## Chương trình mẫu
Bài này dùng trình soạn khối bản **Python** cho Bản Sao Số, nên code kèm theo là **Python**, không phải C++. Code C++ cho robot thật bắt đầu ở Bài 12.

**1. Tiến 20 cm rồi lùi 20 cm (bản đồ `msNumberGrid`, đơn vị bước/giây)**

```
Leanbot bắt đầu hoạt động
  Nhiệm vụ: Bắt đầu trên Bản Sao Số  "msNumberGrid"
    Di chuyển: Chạy với vận tốc Trái 2000 Phải 2000 bước/giây
    Di chuyển: Chạy đoạn đường 20 cm
    Di chuyển: Dừng
    Di chuyển: Chạy với vận tốc Trái -2000 Phải -2000 bước/giây
    Di chuyển: Chạy đoạn đường 20 cm
    Di chuyển: Dừng
  Nhiệm vụ: Kết thúc
```

```python
from pyLeanbot import *

Leanbot.begin()

LbMission.beginDigitalTwin("msNumberGrid")
LbMotion.runLR(2000, 2000)
LbMotion.waitDistanceMm(20 * 10)
LbMotion.stopAndWait()
LbMotion.runLR(-2000, -2000)
LbMotion.waitDistanceMm(20 * 10)
LbMotion.stopAndWait()
LbMission.end()
```
(Dòng đầu file là ba dòng chú thích "Generated Leanbot Python code …" do trình soạn khối tự thêm.)

**2. Tiến, chờ, lùi (bản đồ `SynapseCity.01`, đơn vị vòng/phút)** — slide LEARN 13

```
Leanbot bắt đầu hoạt động
  Nhiệm vụ: Bắt đầu trên Bản Sao Số  "SynapseCity.01"
    Di chuyển: Chạy với vận tốc Trái 30 Phải 30 vòng/phút
    Di chuyển: Chạy đoạn đường 4.2 cm
    Di chuyển: Dừng
    Chờ 1.25 giây
    Di chuyển: Chạy với vận tốc Trái -30 Phải -30 vòng/phút
    Di chuyển: Chạy đoạn đường 4.2 cm
    Di chuyển: Dừng
  Nhiệm vụ: Kết thúc
```
Slide chỉ đưa khối, không đưa code Python của chương trình này (chưa lấy được).

**3. Chương trình dự đoán** — slide LEARN 19, RESOLVE 01

```
Leanbot bắt đầu hoạt động
  Nhiệm vụ: Bắt đầu trên Bản Sao Số  "SynapseCity.01"
    Di chuyển: Chạy với vận tốc Trái 30 Phải 30 vòng/phút
    Di chuyển: Chạy đoạn đường 4.2 cm
    Di chuyển: Dừng
    Di chuyển: Rẽ với vận tốc Trái 30 Phải -30 vòng/phút
    Di chuyển: Rẽ góc 90 độ
    Di chuyển: Dừng
    Di chuyển: Chạy với vận tốc Trái 30 Phải 30 vòng/phút
    Di chuyển: Chạy đoạn đường 20 cm
    Di chuyển: Dừng
  Nhiệm vụ: Kết thúc
```
Hướng rẽ của khối thứ tư: **kiểm trên máy** (xem Bước 7 và "Ghi chú về bản gốc"). Slide chưa cho Python của chương trình này.

**4. Quay tại chỗ 90 độ sang trái** — slide LEARN 15, hai cách viết

```
Di chuyển: Rẽ với vận tốc Trái -1000 Phải 1000 bước/giây     (hoặc: Trái -30 Phải 30 vòng/phút)
Di chuyển: Rẽ góc 90 độ
Di chuyển: Dừng
```

## Phiếu ôn luyện

**Bài 1 — Đọc đoán kết quả (dễ).**
**Đề:** Chương trình: Chạy Trái 30 Phải 30 vòng/phút → Chạy đoạn đường 10 cm → Dừng. Robot làm gì?

**Đáp án:** Robot đi thẳng 10 cm rồi dừng. Không rẽ, không lùi.

**Bài 2 — Đọc đoán kết quả (vừa).**
**Đề:** Chương trình: Chạy 2000/2000 bước/giây → Chạy đoạn đường 20 cm → Dừng → Chạy −2000/−2000 bước/giây → Chạy đoạn đường 20 cm → Dừng. Robot dừng ở đâu? Tổng cộng nó đi bao nhiêu cm?

**Đáp án:** Robot **về đúng chỗ xuất phát**. Tổng quãng đường đi là 20 + 20 = 40 cm, nhưng chỗ dừng cách chỗ đầu 0 cm.

**Bài 3 — Tìm lỗi (dễ).**
**Đề:** Con muốn robot tiến 4.2 cm, chờ, rồi **lùi** 4.2 cm. Chương trình con viết: Chạy 30/30 → Chạy đoạn đường 4.2 cm → Dừng → Chờ 1.25 giây → Chạy **30/30** → Chạy đoạn đường 4.2 cm → Dừng. Robot dừng ở đâu? Sai ở đâu? Sửa thế nào?

**Đáp án:** Robot đi tiến hai lần, dừng cách chỗ đầu 8.4 cm. Sai ở khối "Chạy" thứ hai: hai số vẫn dương. Muốn lùi thì hai số phải âm. Sửa thành Trái **−30** Phải **−30**.

**Bài 4 — Tìm lỗi (vừa).**
**Đề:** Một bạn muốn robot chạy nhanh nhất có thể và viết "Chạy với vận tốc Trái 60 Phải 60 vòng/phút". Số 60 có vấn đề gì? Sửa thế nào?

**Đáp án:** Khoảng tốc độ chỉ từ −59 đến 59 vòng/phút. 60 vượt giới hạn. Máy sẽ báo lỗi hay tự cắt về 59 thì chưa biết (slide không nói), nên chọn số không quá 59. Sửa thành 59 hoặc nhỏ hơn.

**Bài 5 — Sắp thứ tự (vừa).**
**Đề:** Sắp lại các khối để robot **tiến 4.2 cm, chờ, rồi lùi về chỗ cũ**:
(a) Chờ 1.25 giây · (b) Nhiệm vụ: Kết thúc · (c) Dừng · (d) Chạy đoạn đường 4.2 cm · (e) Chạy Trái 30 Phải 30 vòng/phút · (f) Nhiệm vụ: Bắt đầu trên Bản Sao Số "SynapseCity.01" · (g) Chạy Trái −30 Phải −30 vòng/phút · (h) Chạy đoạn đường 4.2 cm · (i) Dừng
(Khối "Leanbot bắt đầu hoạt động" đã nằm sẵn trên cùng.)

**Đáp án:** f → e → d → c → a → g → h → i → b. (Khối nào ghi "Chạy" cũng phải đi đôi với khối "Chạy đoạn đường" ngay sau nó, rồi mới "Dừng".)

**Bài 6 — Điền số (vừa).**
**Đề:** (a) Muốn rẽ một góc vuông, điền vào "Rẽ góc ? độ". (b) "Chờ 1.25 giây" là bao nhiêu mili-giây? (c) Khối ghi 20 cm thì chữ Python ghi `waitDistanceMm(20 * ?)`. (d) Chương trình đi 4.2 cm rồi rẽ 90 độ rồi đi 20 cm. Con đổi **chỉ** số 20 thành 30. Robot dừng xa hơn bao nhiêu cm, theo hướng nào?

**Đáp án:** (a) **90** (góc vuông). (b) **1250** (1000 mili-giây là 1 giây, nên 1.25 × 1000). (c) **10** (1 cm = 10 mm). (d) Xa hơn **10 cm**, theo hướng robot đang quay mặt sau cú rẽ. Vì ta chỉ đổi đoạn cuối, hai đoạn đầu không đổi.

**Bài 7 — Dịch nhãn (dễ).**
**Đề:** Dịch sang tiếng Việt: (a) Motion: Stop (b) Motion: Keep running for 20 cm (c) Motion: Keep turning for 90 degrees (d) Wait for 1.25 seconds (e) Comment. Rồi dịch ngược: (f) Nhiệm vụ: Kết thúc (g) Di chuyển: Chạy với vận tốc Trái ? Phải ?

**Đáp án:** (a) Di chuyển: Dừng (b) Di chuyển: Chạy đoạn đường 20 cm (c) Di chuyển: Rẽ góc 90 độ (d) Chờ 1.25 giây (e) Ghi chú (f) Mission: End (g) Motion: Run with velocity Left ? Right ?

**Bài 8 — Làm trên máy (khó).**
**Đề:** Mở trình soạn khối bản Python. Ghép khối sao cho cột bên phải sinh ra đúng đoạn này (bỏ qua ba dòng chú thích đầu file):
```python
from pyLeanbot import *

Leanbot.begin()

LbMission.beginDigitalTwin("msNumberGrid")
LbMotion.runLR(2000, 2000)
LbMotion.waitDistanceMm(20 * 10)
LbMotion.stopAndWait()
LbMotion.runLR(-2000, -2000)
LbMotion.waitDistanceMm(20 * 10)
LbMotion.stopAndWait()
LbMission.end()
```

**Đáp án:** Chương trình ở mục "Chương trình mẫu", ví dụ 1: chọn tên `msNumberGrid` trong danh sách, hai khối "Chạy với vận tốc" (2000/2000 rồi −2000/−2000, đơn vị bước/giây), mỗi khối kèm "Chạy đoạn đường 20 cm" và "Dừng". Cột code giống từng dòng thì đúng.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Trong 48 slide không có câu trắc nghiệm. Nếu hoạt động H5P trên Plearn có câu hỏi ẩn thì **chưa lấy được**. Các câu hỏi mở trên slide, dùng làm câu kiểm tra miệng:

| # | Câu gốc | Dịch | Đáp án (theo slide) |
|---|---|---|---|
| 1 | "What do you think the robot's action will be based on the program below?" (LEARN 04) | Con nghĩ robot sẽ làm gì với chương trình dưới đây? | Chạy thẳng 20 cm, dừng, chạy lùi 20 cm, dừng, về chỗ cũ |
| 2 | "What are the similarities and differences of the two codes?" (LEARN 05) | Hai đoạn code giống và khác nhau chỗ nào? | Giống: cùng bắt đầu nhiệm vụ, tiến rồi lùi cùng khoảng cách, kết thúc. Khác: bên trái là khối Blockly, bên phải là Python do Blockly tự sinh |
| 3 | "Where will the robot end up?" (LEARN 19, RESOLVE 01) | Robot sẽ dừng ở đâu? | Slide không cho đáp án chỗ dừng; chỉ nói tiến 4.2 cm, rẽ 90 độ, tiến 20 cm. Hướng rẽ xem "Ghi chú về bản gốc" |
| 4 | "Which path would YOU choose, and WHY?" (GROWTH 03) | Con chọn đường nào và vì sao? | Gợi ý của slide: đường 2 và 4, ít chỗ rẽ, ít bước |
| 5 | "Can you reach Zone H with only 2 turns or even fewer?" (GROWTH 04) | Con có tới Khu H chỉ với 2 chỗ rẽ hoặc ít hơn được không? | Đáp án mở |
| 6 | "How can you predict where the robot will go before running the code?" / "What is the role of Mission Name in a robot program?" / "How do distance and turn angle change the robot's movement?" (ENGAGE 02) | Làm sao đoán trước robot đi đâu? Tên nhiệm vụ để làm gì? Khoảng cách và góc quay làm đường đi đổi thế nào? | Đọc từng dòng và hình dung; cho biết robot chạy bản đồ nào; hai thứ này cùng quyết định chỗ dừng |

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Quên đoán trước, chạy luôn | Bé bấm Chạy ngay khi ghép xong | Che nút Chạy bằng tờ giấy tới khi bé đánh dấu điểm đoán lên tờ lưới |
| Đổi nhiều số cùng lúc | Chạy xong không biết số nào gây ra lệch | Nhắc luật: "một số một lần". Cho bé ghi số đã đổi vào bảng |
| Nhầm rẽ trái / rẽ phải | Robot rẽ ngược ý bé | Cho bé chạy hai cấu hình Trái/Phải ngược dấu, nhìn bằng mắt. Không dựa vào chữ "trái/phải" trên slide |
| Nhầm dấu của tốc độ | Muốn lùi mà robot lại tiến | Hỏi: "Số của bánh trái và bánh phải có dấu gì?" Lùi là hai số âm |
| Nhập số quá giới hạn | Bé gõ 60 vòng/phút | Nhắc: tối đa 59 |
| Nhầm đơn vị | Bé trộn cm với mm, vòng/phút với bước/giây | Cả buổi chỉ dùng vòng/phút và cm |
| Gõ tên nhiệm vụ sai | Robot không chạy hoặc chạy bản đồ khác | Dùng cách 1 (chọn trong danh sách) trước. Nếu gõ chữ thì chép đúng `SynapseCity.01`, kể cả dấu chấm và chữ hoa. Bàn phím tiếng Việt có thể gõ sai ký tự (người bóc tách cảnh báo, chưa kiểm trên máy) |
| Không biết đo "đường ngắn" | Bé nói "đường này ngắn hơn" mà không có số | Dạy đếm: mấy đoạn thẳng, mấy chỗ rẽ, thời gian trên thanh "Time" |
| Bí khi đi từ A tới H | Bé không biết ô dài bao nhiêu cm | Thầy cho bé thử một đoạn ngắn rồi đo xem robot đi được bao xa |
| Quá nhiều tiếng Anh | Bé sợ không đọc nổi slide | Dùng bản vá tiếng Việt trước, nhìn slide sau. Đọc cho bé nghe từng câu chính |

## Ghi chú về bản gốc
Những chỗ mâu thuẫn hoặc lỗi trong khóa gốc mà file bóc tách đã phát hiện:

1. **Dự án 2 không có trong bài.** Plearn gắn "Dự án 2: Bằng lái robot tự hành" vào Bài 11, nhưng 48 slide không có chữ "Mini Project 2" hay "Autonomous Driving License". Bài chỉ dạy kỹ năng chuẩn bị (dự đoán, chỉnh tham số, tối ưu đường). Giáo án vẫn ghi yêu cầu nộp Dự án 2 ở mục Chốt bài; đề bài chi tiết **chưa lấy được**.
2. **Trái / phải mâu thuẫn.** Slide LEARN 15 gọi Trái −30 Phải 30 là "quay trái". Slide LEARN 17 gọi Trái 30 Phải −30 là "quay phải". Nhưng slide LEARN 19 viết Trái 30 Phải −30 là "left 90°". Hai slide trước khớp nhau, slide 19 sai. Chưa kiểm trên mô phỏng.
3. **Ví dụ 30 đổi thành 60** ở slide RESOLVE 06 vượt giới hạn 59 vòng/phút (giống giáo trình tổng §6: −59 … 59).
4. **Slide RESOLVE 04 đổi hai số cùng lúc** (4.2 → 6 và 20 → 30) rồi slide RESOLVE 06 lại dạy "đổi một thứ một lần". Giáo án làm theo luật ở slide 06.
5. **Chữ "Point B"** ở slide GROWTH 02 lẽ ra là Khu H.
6. **Tiêu đề không khớp nội dung:** slide LEARN 11 ghi "Backward" nhưng chương trình đi tới (30/30 rpm); slide LEARN 16 ghi "90° Point Turn to the Left" nhưng chương trình rẽ theo mili-giây (quay vòng cua).
7. **Robot đỗ ở Bến xuất phát** (ảnh LEARN 01) mà nhiệm vụ nói "từ Khu A". Slide không giải thích robot được đặt vào A thế nào.
8. **Slide GROWTH 09:** góc 135 độ được gọi là "quay ngược hẳn", quay ngược hẳn phải là 180 độ. Slide GROWTH 03 gọi đường chéo (đường 4) là "đường thông minh" mà không tính góc rẽ.
9. **Lỗi gõ và dàn trang:** "s specific angle" (LEARN 17); chữ "Distance" bị đè (LEARN 18).
10. **Không có thang đo:** slide không cho độ dài ô lưới, không có bảng số liệu so sánh đường, và không có chương trình mẫu từ A tới H.
11. **Mâu thuẫn số liệu với giáo trình tổng:** không thấy. Khoảng tốc độ −59 … 59 vòng/phút và −2000 … 2000 bước/giây khớp §6. Con số "30–50 %" trong §6 là mức tốc độ nên dùng ở Bài 13 (đơn vị phần trăm), khác với 30 vòng/phút dùng trong bài này.
