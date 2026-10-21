# Bài 4 — Đi theo đường thông minh

> Bài gốc: *Lesson 4 — Follow the Smart Roads* · 27 slide · 4 chương (Engage 6, Learn 12, Resolve 4, Growth 5) · [Hoạt động trên Plearn](https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62361)

Đây là bài **khó nhất trong bốn bài đầu** và là bài quyết định bé có bám vạch ổn định ngày thi hay không. Giáo trình tổng xếp bài này vào **buổi 6–7** (2 buổi × 90 phút). Đọc hết giáo án trước khi dạy; phần "Bảng mã 4 mắt" ở mục Giảng là chỗ bé hay đứng lại nhất.

## Bé học xong thì làm được gì
- Nói được vì sao robot thấy vạch đen: nền trắng dội lại nhiều ánh sáng, vạch đen dội lại rất ít.
- Chỉ đúng 4 mắt dò vạch dưới mũi robot và vẽ được 4 ô trắng/đen cho một thế đứng bất kỳ trên vạch.
- Nhìn 4 ô trắng/đen mà nói được robot sẽ quẹo trái, quẹo phải hay đi thẳng.
- Làm đúng **7 bước cân chỉnh** bằng nút TB1A, nhớ màu đèn ở từng bước (đỏ nháy, vàng, xanh lá).
- Cho robot bám vạch trên bản đồ Thành phố Synapse: B → C, A → D, rồi A → H.
- Khi robot trôi khỏi vạch, biết việc đầu tiên cần làm là **cân chỉnh lại**.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Leanbot đã sạc pin, mỗi bé hoặc mỗi cặp một robot | Bài này cần robot thật; không thay bằng màn hình được |
| Dây USB + máy tính có trình soạn khối (bản vá tiếng Việt) | Mở `ide.pythaverse.space/lbeditor/`; xem `tools/lbeditor-vi/` |
| Bản đồ Thành phố Synapse in hoặc trải sàn | Lưới 3×3 các khu A, B, C, D, E, F, G, H và ô CRL. Mặt bản đồ nền **trắng sạch**, vạch **đen đậm** (xem Bé hay vướng) |
| Một tờ giấy A4 trắng và một tờ giấy đen to (hoặc băng keo đen dán kín) | Dùng cho bước cân chỉnh: "vùng TOÀN TRẮNG" và "vùng TOÀN ĐEN" |
| Tờ "bảng màu đèn" dán cạnh robot | 3 dòng: đỏ nháy = chưa cân chỉnh; vàng = đã nhớ trắng; xanh lá = thấy đen. Làm theo mục Cân chỉnh |
| 16 miếng bìa vẽ sẵn 4 ô (mỗi ô để tô đen hoặc để trắng) | Dùng ở bước Bảng mã 4 mắt; hoặc bé tự vẽ vào vở |
| Chương trình mẫu `FollowLine_EN.bduino` | Tải từ link "Download the Line Tracking Sample program" ở slide Learn 07 (trỏ tới `git.pythaverse.space/ptvairoc/Synapsecity_Primary/blob/master/FollowLine_EN.bduino`). Thầy tải sẵn về máy từng bé |
| Giấy, bút, vở ghi "Nhật ký chạy thử" | Slide Resolve 03 dặn "ghi chép lần thử" |

## Thuật ngữ của bài
Từ đã có trong §5 giáo trình tổng (cảm biến vạch, cân chỉnh, ngưỡng, nút chạm, đèn LED, biến, hàm, vòng lặp, nếu, nhiệm vụ…) không chép lại.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Smart Road | Đường thông minh | Đường có vạch đen vẽ sẵn để robot đi theo |
| Black line / Guide line | Vạch đen / vạch dẫn đường | Vạch đen trên nền trắng, chỉ đường cho robot |
| Line-following robot | Robot dò vạch | Robot tự đi theo vạch, không cần chỉ từng bước |
| Infrared (IR) | Hồng ngoại | Ánh sáng mắt người không thấy, robot thì thấy |
| IR transmitter (IR LED) | Đèn phát hồng ngoại | Đèn nhỏ chiếu ánh sáng xuống đường |
| IR receiver (Photodiode) | Mắt thu hồng ngoại | Phần nhận ánh sáng dội ngược lên |
| Reflect | Dội lại (phản xạ) | Ánh sáng đập xuống đường rồi bật ngược lên |
| White surface | Nền trắng | Dội lại nhiều ánh sáng |
| Swing turn | Quẹo | Một bánh chạy chậm, bánh kia chạy nhanh, robot quay hướng |
| Left / Right swing turn | Quẹo trái / quẹo phải | Bánh bên nào chậm thì robot quẹo về bên đó |
| Target | Đích (quãng đường phải đi trước khi được dừng) | Số mm robot phải đi thêm, rồi mới được phép dừng |
| Switch / case | Chọn theo số (switch) | Nhìn con số rồi chọn đúng việc để làm |
| Map: Business Center, Innovator Campus… | Các khu A–H của Thành phố Synapse | A = Trung tâm Kinh doanh, B = Khuôn viên Sáng tạo, C = Khu Năng lượng Xanh, D = Khu Bờ sông, H = Khu Trung tâm Số |

Ghi chú: slide Resolve 01 đặt tên các khu như sau: A Business Center, B Innovator Campus, C Green Energy, F Industrial Automation, E Mobility Hub, H Digital Downtown, D Waterfront District, G Eco District, và ô CRL (Crisis Response Lab = Phòng Thí Nghiệm). Tên Việt ở bảng trên là bản dịch nghĩa; trong lớp bé chỉ cần nhớ **chữ cái A, B, C, D, H**.

**Quy ước tên mắt trong giáo án này.** Tên chân của khóa gốc (`ir3R`, `ir1R`, `ir0L`, `ir2L`) trộn chữ L và R nên rất dễ nhầm. Với bé, gọi 4 mắt là **mắt ①, ②, ③, ④ từ trái qua phải, đúng như thứ tự 4 ô trong khối**. Ghép với tên khối (2T, 0T, 1P, 3P trong bản vá tiếng Việt; 2L, 0L, 1R, 3R trong bản gốc): ① = 2L, ② = 0L, ③ = 1R, ④ = 3R. **Thầy phải thử trên robot thật xem mắt nào là mắt nào** trước khi dạy (xem Ghi chú về bản gốc, mục 2).

## Khối lệnh dùng trong bài
| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `Leanbot.whenStarted` | Leanbot bắt đầu hoạt động | Điểm bắt đầu chương trình |
| `Leanbot.section_vi` | Ghi chú | Dòng chú thích, robot không làm gì. Mẫu có 2 ghi chú: "Do manual calibration with black/white line" và "Follow line to the end then stops" |
| `LbIRLine.doManualCalibration_vi` | Cảm biến vạch: Cân chỉnh bằng nút TB1A | Chạy quy trình dạy mắt (7 bước) |
| `LbMission.beginByTeacher_end_vi` | Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B … Nhiệm vụ: Kết thúc | Khung bao quanh phần chạy chính; chờ chạm hai nút cùng lúc mới chạy |
| `procedures_defnoreturn` / `procedures_callnoreturn` | làm việc `followLine` / gọi `followLine` | Gói cả đoạn bám vạch thành một lệnh có tên (Hàm) |
| `vars_set_int` | đặt `target` / `line` | Cất một con số vào hộp nhớ (Biến) |
| `LbMotion.approxDistance` | Di chuyển: Đường đã đi, tính bằng mm | Hỏi robot đã đi được bao nhiêu mm (sinh `LbMotion.getDistanceMm()`) |
| `controls_whileUntil` | lặp khi … | Còn thấy đen thì còn lặp |
| `controls_repeat` | lặp 10 lần | Làm đúng 10 lần |
| `LbIRLine.read_vi` | Cảm biến vạch: Đọc cảm biến | Nhìn xuống sàn một lần, ghi nhớ kết quả |
| `LbIRLine.value` | Cảm biến vạch: Giá trị 4 mắt (2T, 0T, 1P, 3P) | Ra một con số từ 0 đến 15 |
| `LbIRLine.displayOnRGB` | Cảm biến vạch: Hiện lên đèn LED màu … | Mẫu dùng xanh lá (`0x00ff00`) |
| `controls_switch` | Chọn theo `line` (switch) | Mỗi nhánh là một thế 4 ô; chọn việc theo thế đó |
| `LbIRLine.state` | Cảm biến vạch: ▢ ▢ ▢ ▢ | Mẫu 4 ô trắng/đen, mỗi ô là một mắt; đen = mắt đó thấy vạch |
| `LbMotion.run` | Di chuyển: Chạy với vận tốc Trái … Phải … bước/giây | Chạy với tốc độ hai bánh (code: `LbMotion.runLR(trái, phải)`) |
| `LbMotion.waitDistanceMm` | Di chuyển: Chạy đoạn đường 1 mm | Chạy tiếp 1 mm rồi mới sang việc sau |
| `LbIRLine.isBlackDetected` | Cảm biến vạch: Có thấy màu đen? | Đúng khi có ít nhất một mắt đang ở trên vạch đen |
| `controls_if` + `controls_flow_statements` | nếu … thì thoát khỏi vòng lặp | Nếu đúng điều kiện thì thoát vòng lặp (`break`) |

Bài này **không** dùng `LbIRLine.setThreshold` (Đặt ngưỡng), dù nó có trong bộ khối.

Ghi chú về nhãn: bản vá tiếng Việt (`tools/lbeditor-vi/leanbot_vi.js`) chưa có nhãn cho các khối lõi của Blockly (`controls_switch`, `controls_whileUntil`, `controls_repeat`, `procedures_*`, `vars_set_int`). Các nhãn đó ở bảng trên là cách nói trong lớp, không phải chữ chắc chắn hiện trên màn hình. Thầy mở trình soạn khối xem thật rồi sửa lại cột này nếu khác.

## Dạy thế nào

### Mở bài (5 phút)
Thầy đặt robot lên bản đồ, bật chạy một chương trình mẫu **đã cân chỉnh sẵn** cho bé xem robot tự bám vạch từ B sang C. Rồi hỏi:
- "Thầy có bảo robot rẽ trái hay rẽ phải lúc nào không?" (Không.)
- "Vậy ai chỉ đường cho robot?" (Vạch đen.)

Thầy nói: "Hôm nay con sẽ dạy cho mắt robot biết nhìn vạch. Xong bài con làm được đúng như thế này."

Kể thêm bối cảnh (slide Engage 02–05): Thành phố Synapse có đường đen nối mọi khu. Cách cũ là lập trình từng cú quẹo, sai một chỗ là robot lạc. Cách đường thông minh là robot tự nhìn vạch. Ngoài đời, robot nhà máy, kho hàng, trang trại năng lượng mặt trời và trung tâm tái chế đều đi theo vạch như vậy.

### Giảng (40 phút)

**Bước 1. Robot "thấy" vạch đen thế nào (8 phút)** — slide Learn 01–03
- Thầy cầm robot lật ngửa, chỉ hàng mắt nhỏ ở mũi: "Đây là mắt của robot, nhìn xuống đất. Nó nhìn bằng ánh sáng hồng ngoại, mắt mình không thấy."
- Thầy làm thí nghiệm bằng đèn pin và hai tờ giấy: chiếu vào giấy trắng thấy sáng bật lên, chiếu vào giấy đen thấy tối. (Thí nghiệm này là của thầy để bé hình dung; slide chỉ có hình vẽ.)
- Mỗi mắt có hai phần: **đèn phát** chiếu xuống, **mắt thu** nhận ánh sáng dội lên.
- Hỏi: "Trắng dội lại nhiều hay ít ánh sáng?" (Nhiều.) "Còn đen?" (Rất ít.) "Vậy robot biết vạch ở đâu bằng cách nào?" (Chỗ nào dội lại yếu, chỗ đó là vạch.)
- Bé làm: tự nói lại một câu "Trắng dội ___, đen dội ___".
- Chuyện vui (có trên slide): điều khiển ti vi cũng dùng ánh sáng hồng ngoại.

**Bước 2. Bốn mắt dò vạch (5 phút)** — slide Learn 04
- Thầy chỉ 4 mắt nằm hàng ngang ở mép dưới mũi robot. "Robot có 8 mắt hồng ngoại. Hôm nay mình chỉ dùng 4 mắt ở giữa dò vạch." (Hai mắt dò mép bàn ở góc dưới và hai mắt dò vật cản ở góc trên để bài sau.)
- Thầy dán bốn nhãn ①②③④ lên mũi robot (băng giấy). Cho bé ngồi xuống nhìn từ phía **trước** robot: ① ngoài trái, ② giữa trái, ③ giữa phải, ④ ngoài phải.
- Hỏi: "Nếu vạch đen nằm ngay giữa mũi robot, mắt nào thấy đen?" (② và ③.)
- Thầy **không** dạy tên chân `ir3R, ir1R, ir0L, ir2L` ở bước này. Bé chỉ cần biết ①②③④. Nếu bé tò mò, nói: "Tên kỹ thuật thì hơi rối, mình tạm đặt tên dễ nhớ."

**Bước 3. Bảng mã 4 mắt (12 phút)** — phần khó nhất; slide Learn 06–08 và chương trình mẫu

*3a. Vẽ 4 ô.*
- Mỗi bé có hàng 4 ô vuông trong vở, ô nào mắt thấy đen thì **tô đen**, mắt thấy trắng thì **để trắng**.
- Thầy đặt robot trên vạch, bé vẽ. Ví dụ vạch ở giữa: ▢■■▢ (hai ô giữa đen). Vạch lệch sang trái: ■■▢▢. Vạch lệch sang phải: ▢▢■■.
- Hỏi: "Con có bao nhiêu thế 4 ô khác nhau?" Cho bé thử liệt kê. Đáp: có **16 thế** (từ cả 4 trắng đến cả 4 đen).

*3b. Mỗi thế có một số tên.*
- Thầy nói: "Robot không hiểu hình, robot chỉ hiểu số. Nên mỗi thế 4 ô được đặt một số tên, từ 0 đến 15. Khối `Giá trị 4 mắt` đọc ra đúng con số đó."
- Thầy phát bảng mã (bên dưới), **chỉ in cột ô vuông, số và việc cần làm**. Bé không cần học thuộc số, chỉ cần nhìn ô.
- Thầy chỉ ra ba con số hay gặp: **6** = ▢■■▢ (hai mắt giữa đen, vạch nằm chính giữa), **4** = ▢■▢▢, **1** = ▢▢▢■.

| Số | 4 ô (① ② ③ ④) | Robot làm gì | Lệnh |
|---|---|---|---|
| 0 | ▢▢▢▢ | Không thấy đen. Chương trình dừng | (vòng lặp thoát) |
| 1 | ▢▢▢■ | Quẹo phải | `runLR(1500, 190)` |
| 2 | ▢▢■▢ | Quẹo phải | `runLR(1500, 190)` |
| 3 | ▢▢■■ | Quẹo phải | `runLR(1500, 190)` |
| 4 | ▢■▢▢ | Quẹo trái | `runLR(190, 1500)` |
| 5 | ▢■▢■ | Đi thẳng | `runLR(1500, 1500)` |
| **6** | **▢■■▢** | **Đi thẳng** (nếu đã đi quá `target` thì dừng) | `runLR(1500, 1500)` |
| 7 | ▢■■■ | Quẹo phải | `runLR(1500, 190)` |
| 8 | ■▢▢▢ | Quẹo trái | `runLR(190, 1500)` |
| 9 | ■▢▢■ | Đi thẳng | `runLR(1500, 1500)` |
| 10 | ■▢■▢ | Đi thẳng | `runLR(1500, 1500)` |
| 11 | ■▢■■ | Đi thẳng | `runLR(1500, 1500)` |
| 12 | ■■▢▢ | Quẹo trái | `runLR(190, 1500)` |
| 13 | ■■▢■ | Đi thẳng | `runLR(1500, 1500)` |
| 14 | ■■■▢ | Quẹo trái | `runLR(190, 1500)` |
| 15 | ■■■■ | Đi thẳng | `runLR(1500, 1500)` |

(Số 0, 6 và 15 không có nhánh riêng trong khối `Chọn theo`; chúng rơi vào nhánh còn lại = đi thẳng. Số 0 còn khiến vòng `lặp khi còn thấy đen` kết thúc nên robot dừng.)

*3c. Gom thành ba nhóm màu, không học thuộc từng số.*
- **Đen lệch về bên TRÁI** (số 4, 8, 12, 14): quẹo **trái**.
- **Đen lệch về bên PHẢI** (số 1, 2, 3, 7): quẹo **phải**.
- **Còn lại** (đen ở giữa hoặc lẫn lộn): đi **thẳng**.
- Thầy tô bảng ba màu: nhóm trái màu xanh dương, nhóm phải màu cam, nhóm thẳng màu xanh lá.

*3d. Vì sao đen lệch trái thì quẹo trái?*
- Thầy đặt robot lệch phải của vạch, để vạch chạy sang trái dưới mũi. Hỏi: "Vạch đang chạy về phía nào của robot?" (Bên trái.) "Muốn bắt kịp vạch thì robot phải quay về phía nào?" (Trái.)
- Quẹo trái nghĩa là **bánh trái chạy chậm (190)**, bánh phải chạy nhanh (1500). Thầy làm mẫu bằng hai bàn tay: tay trái chậm, tay phải nhanh, thân người quay về bên trái.
- Thầy lưu ý: slide Learn 06 chú thích hướng quẹo **ngược** với chương trình mẫu (xem Ghi chú về bản gốc, mục 1). Trong lớp, dạy theo chương trình mẫu và theo thực tế robot chạy.

*3e. Thực hành đoán.*
- Thầy giơ miếng bìa 4 ô, bé giơ thẻ "TRÁI / PHẢI / THẲNG". Chơi 8 lượt, tăng tốc dần. Ai sai thì thầy đặt robot lên đúng thế đó để cho cả lớp xem.
- Mẹo cho bé nhanh (tùy chọn, cho bé giỏi): mỗi ô đen "được điểm", từ trái sang phải điểm là 8, 4, 2, 1; cộng điểm các ô đen được số tên. Ví dụ ▢■■▢ = 4 + 2 = 6. Cách gán điểm này là suy ra từ bảng chương trình mẫu, slide không viết ra; chỉ dạy cho bé muốn biết, **không** đưa vào bài kiểm tra.

**Bước 4. Cân chỉnh: dạy mắt robot (10 phút)** — slide Learn 10–11
- Thầy nói: "Phòng sáng hay tối, giấy bóng hay mờ thì 'trắng' và 'đen' mắt robot thấy cũng khác. Nên **trước mỗi nhiệm vụ phải cân chỉnh**."
- Thầy làm mẫu **cả 7 bước** trên robot trước lớp, bé đọc to từng bước. Nút dùng ở đây là **TB1A** (slide viết chung là "tbX"; trong chương trình mẫu là TB1A).

| Bước | Việc | Đèn LED của robot |
|---|---|---|
| 1 | Robot vừa bật, **chưa cân chỉnh** | 4 đèn **nháy đỏ** |
| 2 | Đặt robot sao cho 4 mắt nhìn vào vùng **TOÀN TRẮNG** (tờ A4 trắng) | (vẫn nháy đỏ) |
| 3 | **Chạm TB1A lần 1** để ghi nhớ màu trắng | |
| 4 | Robot xác nhận | 4 đèn **nháy vàng** |
| 5 | Đặt robot sao cho 4 mắt nhìn vào vùng **TOÀN ĐEN** | |
| 6 | **Chạm TB1A lần 2** để ghi nhớ màu đen | |
| 7 | Robot vào chế độ thử | Đèn **xanh lá** báo mắt đang thấy đen |

- Sau bước 7: (tùy chọn) dời robot sang vài chỗ trắng/đen khác, xem đèn có đổi đúng không. Khi đã đúng, **chạm TB1A lần 3 (lần cuối)** để hoàn tất.
- Có thể đổi thứ tự: làm vùng đen trước, vùng trắng sau (slide ghi bước 2 và 5 đổi chỗ được). Nhưng với bé mới học, thầy giữ một thứ tự cố định cho đỡ rối.
- **Làm sai?** Nhấn nút **Reset** trên robot rồi làm lại từ bước 1.
- Trò chơi nhớ: "**Đỏ – Trắng – Vàng – Đen – Xanh – Xong**". Thầy dán dòng này lên bảng cạnh bảng màu đèn.
- Thầy nhắc: "Nhớ ba lần chạm TB1A: lần 1 trắng, lần 2 đen, lần 3 xong."
- Slide chỉ ghi "nhấn nút Reset", không nói nút nằm ở đâu. Thầy tìm sẵn nút Reset trên robot của lớp và thử trước.

**Bước 5. Đọc chương trình mẫu (5 phút)** — slide Learn 07–09
- Thầy mở `FollowLine_EN.bduino` bằng trình soạn khối. Bé nhìn cột code C++ bên phải.
- Chia chương trình thành **ba phần**, không đọc từng dòng:
  1. **Đọc mắt**: `Đọc cảm biến` rồi `đặt line = Giá trị 4 mắt`.
  2. **Chọn hướng**: `Chọn theo line` → quẹo trái / quẹo phải / đi thẳng.
  3. **Kiểm tra đích**: đã đi hơn `target` (1000 mm = 1 mét) mà mắt báo số 6 thì dừng.
- Hỏi: "Khi nào robot dừng?" Hai cách: (1) không còn thấy đen (số 0); (2) đã đi quá 1000 mm kể từ lúc bắt đầu mà nhìn thấy số 6. Vì sao cần đi trên 1 mét rồi mới được dừng? "Để robot không dừng nhầm ngay ở vạch xuất phát."
- Thầy chỉ vào hàm `followLine`: "Cả đoạn dài này gói lại, đặt tên là followLine. Chương trình chính chỉ gọi một dòng."
- Bé **chỉ đọc**, không tự viết lại hàm này.

### Bé tự làm (45 phút buổi 6 + trọn buổi 7)

**Buổi 6, phần thực hành (45 phút)**
1. Nạp `FollowLine_EN.bduino` xuống robot (theo `docs/playbooks/leanbot-setup.md`).
2. Cân chỉnh đủ 7 bước. Mỗi bé tự làm ít nhất 2 lần, một lần cố ý làm sai rồi bấm Reset làm lại.
3. Đặt robot ở **B**, chạm cùng lúc TB1A + TB1B, quan sát robot đi tới **C**. (Slide Resolve 02, Hoạt động 1: "Campus to Energy".) Đạt khi robot không rời vạch.

**Buổi 7 (90 phút)**
4. **Hoạt động 2: A → D** (Business Center → Waterfront). Đường dài hơn, nhiều khúc cua. Nhắc: cân chỉnh lại trước khi chạy, đặt robot ở A.
5. **Hoạt động 3: A → H** (Digital Downtown). Đường dài nhất, nhiều lần quẹo. Danh sách làm: cân chỉnh kỹ → đặt ở A → chạy → quan sát, ghi chú → robot lệch thì sửa rồi chạy lại.
6. Mỗi lần chạy hỏng, bé ghi vào "Nhật ký chạy thử": đã cân chỉnh lại chưa, robot rời vạch ở chỗ nào, đèn LED lúc đó màu gì.
- Câu thầy hỏi khi bé kẹt: "Con đã cân chỉnh lại chưa?" (Slide Resolve 02: "Nếu robot cứ rời vạch, kiểm tra cân chỉnh trước, đó là cách sửa hay gặp nhất.") Thầy **không** sửa hộ chương trình.
- Đạt mốc giáo trình tổng: "Robot bám hết một đoạn vạch đen", tự làm không cần nhắc.

### Chốt bài (5 phút)
- Cả lớp đọc lại ba câu:
  1. Trắng dội nhiều, đen dội ít, nên robot thấy vạch.
  2. Bốn mắt cho ra một thế 4 ô; thế đó quyết định quẹo trái, quẹo phải hay đi thẳng.
  3. Phòng đổi ánh sáng thì cân chỉnh lại.
- Hỏi mỗi bé một câu: "Robot rời vạch thì việc đầu tiên con làm là gì?" (Cân chỉnh lại.)
- Giao phiếu ôn luyện bên dưới. Chuyển ý: bài sau (bài 5) bắt đầu phần AI. Bài 4 sẽ quay lại ở Nhiệm vụ 1 (bài 13).
- Slide Growth 02: bám vạch là "bậc thang đầu tiên" của robot tự hành; con vừa leo bậc đó.

## Chương trình mẫu
Nguồn: `FollowLine_EN.bduino` (cây khối và code C++ do Blockly Editor sinh). Bé nhìn khối và code song song.

### Khối tiếng Việt

```
Leanbot bắt đầu hoạt động
  Ghi chú: "Do manual calibration with black/white line"
  Cảm biến vạch: Cân chỉnh bằng nút TB1A
Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B
  Ghi chú: "Follow line to the end then stops"
  followLine
Nhiệm vụ: Kết thúc

làm việc followLine
  đặt target = (Di chuyển: Đường đã đi, tính bằng mm) + 1000
  lặp khi (Cảm biến vạch: Có thấy màu đen?)
    lặp 10 lần
      Cảm biến vạch: Đọc cảm biến
      đặt line = Cảm biến vạch: Giá trị 4 mắt (2T, 0T, 1P, 3P)
      Cảm biến vạch: Hiện lên đèn LED màu [xanh lá #00ff00]
      Chọn theo line
        khi ▢■▢▢ | ■■■▢ | ■■▢▢ | ■▢▢▢   (4, 14, 12, 8)
          Chạy với vận tốc Trái 190  Phải 1500 bước/giây
        khi ▢▢■▢ | ▢■■■ | ▢▢■■ | ▢▢▢■   (2, 7, 3, 1)
          Chạy với vận tốc Trái 1500  Phải 190 bước/giây
        còn lại (gồm 9, 13, 11, 10, 5 và mọi số khác)
          Chạy với vận tốc Trái 1500  Phải 1500 bước/giây
      nếu (Cảm biến vạch: Có thấy màu đen?)
        thoát khỏi vòng lặp
      Di chuyển: Chạy đoạn đường 1 mm
    nếu (Đường đã đi) > target
      nếu (Giá trị 4 mắt) = ▢■■▢   (số 6)
        thoát khỏi vòng lặp
```

Lưu ý khi đối chiếu: các ô trắng/đen trong khối `khi` ở trên được suy ra từ số trong code, vì file xuất khối của bản mẫu mất thông tin trắng/đen (hiện `#fff`). Các nhãn Việt của khối lõi (`Chọn theo`, `lặp khi`, `nếu`…) xem ghi chú ở mục Khối lệnh.

### Code C++ tương ứng (chép nguyên văn từ bản mẫu)

```cpp
//  Generated Leanbot Arduino code
//    by Leanbot Blockly Editor 2024-09-15
//    at 2026-10-21 09:57:47

#include <Leanbot.h>

int target;
int line;
// Describe this function...
void followLine() {
  target = LbMotion.getDistanceMm() + 1000;
  while (LbIRLine.isBlackDetected()) {
    for (int count = 0; count < 10; count++) {
      LbIRLine.read();
      line = LbIRLine.value();
      LbIRLine.displayOnRGB(0x00ff00);
      switch (line) {
        case 4:
        case 14:
        case 12:
        case 8:
          LbMotion.runLR(190, 1500);
          break;

        case 2:
        case 7:
        case 3:
        case 1:
          LbMotion.runLR(1500, 190);
          break;

        case 9:
        case 13:
        case 11:
        case 10:
        case 5:
        default:
          LbMotion.runLR(1500, 1500);
       }

      if (LbIRLine.isBlackDetected()) {
        break;
      }
      LbMotion.waitDistanceMm(1);
    }

    if ((LbMotion.getDistanceMm() > target)) {
      if ((LbIRLine.value() == 6)) {
        break;
      }
    }
  }

}


void setup() {
  Leanbot.begin();
  LbIRLine.doManualCalibration(TB1A);
}

void loop() {

  { // Do manual calibration with black/white line
  }

  LbMission.begin(TB1A + TB1B);

  { // Follow line to the end then stops
    followLine();
  }

  LbMission.end();
}
```

### Đọc song song
| Khối / ý | Dòng C++ |
|---|---|
| Cân chỉnh bằng nút TB1A | `LbIRLine.doManualCalibration(TB1A);` (trong `setup`) |
| Nhiệm vụ: Bắt đầu khi chạm TB1A + TB1B … Kết thúc | `LbMission.begin(TB1A + TB1B);` … `LbMission.end();` |
| Đường đã đi + 1000 | `target = LbMotion.getDistanceMm() + 1000;` |
| Lặp khi còn thấy đen | `while (LbIRLine.isBlackDetected())` |
| Lặp 10 lần | `for (int count = 0; count < 10; count++)` |
| Đọc cảm biến; Giá trị 4 mắt | `LbIRLine.read();` `line = LbIRLine.value();` |
| Chọn theo line | `switch (line)` |
| Chạy Trái 190 Phải 1500 | `LbMotion.runLR(190, 1500);` |
| Chạy đoạn đường 1 mm | `LbMotion.waitDistanceMm(1);` |
| thoát khỏi vòng lặp | `break;` |

## Phiếu ôn luyện
Không cần máy, trừ bài 9 và bài 10.

**Bài 1. Trắng hay đen? (dễ)**
Đề: Điền "mạnh" hoặc "yếu": (a) Mắt robot nhìn xuống nền trắng, ánh sáng dội lên rất ___. (b) Mắt robot nhìn xuống vạch đen, ánh sáng dội lên rất ___. (c) Chỗ nào ánh sáng dội lên yếu thì robot biết đó là ___.

**Đáp án:** (a) mạnh; (b) yếu; (c) vạch đường (vạch đen).

**Bài 2. Đọc đoán kết quả: 4 ô (dễ)**
Đề: Mỗi dòng cho 4 ô (① ② ③ ④) và số tên. Robot quẹo trái, quẹo phải hay đi thẳng?
(a) ▢■▢▢ (số 4) (b) ▢▢▢■ (số 1) (c) ▢■■▢ (số 6) (d) ■■▢▢ (số 12) (e) ▢▢■■ (số 3)

**Đáp án:** (a) trái; (b) phải; (c) thẳng; (d) trái (đen lệch trái); (e) phải (đen lệch phải).

**Bài 3. Đọc đoán kết quả: lệnh bánh xe (vừa)**
Đề: Robot đang đọc được số 12. Nó chạy lệnh `LbMotion.runLR(190, 1500)`. (a) Bánh nào chạy chậm? (b) Robot quẹo hướng nào? (c) Vì sao như vậy là đúng?

**Đáp án:** (a) bánh trái (190 nhỏ hơn 1500). (b) Quẹo trái. (c) Số 12 là ■■▢▢: vạch đen lệch về bên trái; robot quẹo về bên trái mới bắt kịp vạch.

**Bài 4. Đọc đoán kết quả: khi nào dừng? (vừa)**
Đề: Robot gọi `followLine()` lúc đường đã đi bằng 0 mm, nên `target = 1000`. Robot dừng hay đi tiếp trong từng tình huống?
(a) Đã đi 400 mm, 4 mắt đọc ▢■■▢ (6).
(b) Đã đi 1200 mm, 4 mắt đọc ▢■■▢ (6).
(c) Đã đi 1200 mm, 4 mắt đọc ■■▢▢ (12).
(d) Đã đi 700 mm, 4 mắt đều trắng ▢▢▢▢.

**Đáp án:** (a) Đi tiếp thẳng (chưa quá 1000 mm). (b) Dừng (đã quá `target` và mã là 6). (c) Đi tiếp, quẹo trái (mã 12, không phải 6). (d) Dừng, vì không còn thấy đen nên vòng `lặp khi thấy đen` kết thúc.

**Bài 5. Tìm lỗi (vừa)**
Đề: Bạn An sửa nhầm chương trình thành:
```cpp
case 4:
case 14:
case 12:
case 8:
  LbMotion.runLR(1500, 190);
  break;
```
Robot chạy thử thì trôi ra khỏi vạch ở chỗ cua. (a) Sai ở đâu? (b) Sửa thế nào? (c) Việc đầu tiên con nên kiểm tra khi robot cứ rời vạch (mà chương trình đã đúng) là gì?

**Đáp án:** (a) Hai con số 190 và 1500 bị đổi chỗ. Các số 4, 14, 12, 8 là đen lệch trái; robot phải quẹo trái nhưng lệnh này làm bánh phải chậm nên robot quẹo phải, càng xa vạch. (b) Đổi lại thành `LbMotion.runLR(190, 1500);`. (c) Cân chỉnh lại (nhất là khi đổi chỗ có ánh sáng khác).

**Bài 6. Sắp thứ tự: cân chỉnh (vừa)**
Đề: Sắp 7 thẻ sau theo thứ tự đúng:
A. Đèn nháy vàng, robot đã nhớ trắng.
B. Đặt robot nhìn vào vùng toàn đen.
C. Đèn nháy đỏ, robot chưa cân chỉnh.
D. Chạm TB1A lần 2.
E. Chạm TB1A lần 1.
F. Đặt robot nhìn vào vùng toàn trắng.
G. Đèn xanh lá, robot vào chế độ thử.

**Đáp án:** C → F → E → A → B → D → G. (Xong nhớ chạm TB1A lần 3 để hoàn tất.) Chấp nhận B → D đứng trước F → E nếu bé làm đen trước, vì slide cho phép đổi thứ tự bước 2 và 5; khi đó đèn vàng vẫn sau lần chạm đầu tiên.

**Bài 7. Điền số (khó hơn)**
Đề: (a) Điền vào chỗ trống để robot quẹo phải khi đọc số 3 (▢▢■■):
```cpp
case 3:
  LbMotion.runLR(____, ____);
  break;
```
(b) Robot gọi `followLine()` lúc `LbMotion.getDistanceMm()` đang là 350. Khi đó `target` bằng bao nhiêu? Robot được phép dừng khi đã đi quá bao nhiêu mm?
(c) Hai mắt giữa cùng thấy đen thì số tên là bao nhiêu?

**Đáp án:** (a) `runLR(1500, 190)`: số 3 là đen lệch phải, nên bánh phải chậm (190), bánh trái nhanh (1500). (b) `target = 350 + 1000 = 1350`; được dừng khi đường đã đi **lớn hơn 1350 mm** (và mắt đọc số 6). (c) 6.

**Bài 8. Dịch nhãn (vừa)**
Đề: Nối nhãn tiếng Anh với nhãn tiếng Việt.
1. IRLine: Do manual calibration with TB1A button
2. IRLine: Read sensors
3. IRLine: Black is detected ?
4. Mission: Begin when TB1A + TB1B combo touched
5. Motion: Run with velocity Left … Right …
6. IRLine: Sensor values (2L, 0L, 1R, 3R)

a. Cảm biến vạch: Có thấy màu đen?
b. Cảm biến vạch: Giá trị 4 mắt (2T, 0T, 1P, 3P)
c. Cảm biến vạch: Cân chỉnh bằng nút TB1A
d. Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B
e. Cảm biến vạch: Đọc cảm biến
f. Di chuyển: Chạy với vận tốc Trái … Phải …

**Đáp án:** 1-c, 2-e, 3-a, 4-d, 5-f, 6-b. Hỏi thêm: "2L, 0L, 1R, 3R" bản Việt viết là gì? (2T, 0T, 1P, 3P; T = trái, P = phải.)

**Bài 9. Làm trên máy: khối sinh ra đúng code (khó)**
Đề: Mở trình soạn khối. Ghép khối để cột code C++ bên phải **giống y hệt** đoạn sau (bỏ qua dòng ghi chú). Gợi ý: cần 3 khối.
```cpp
void setup() {
  Leanbot.begin();
  LbIRLine.doManualCalibration(TB1A);
}

void loop() {
  LbMission.begin(TB1A + TB1B);
  LbMission.end();
}
```
Rồi thêm 1 khối nữa để trong `loop` có thêm dòng `LbMotion.runLR(1500, 1500);` nằm **giữa** `begin` và `end`.

**Đáp án:** `Leanbot bắt đầu hoạt động` + `Cảm biến vạch: Cân chỉnh bằng nút TB1A`; `Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B … Kết thúc`. Khối thêm: `Di chuyển: Chạy với vận tốc Trái 1500 Phải 1500` đặt bên trong khối Nhiệm vụ. Tự chấm: cột code giống đoạn trên là đúng. (Đoạn sinh ra có thêm dòng `{ }` cho ghi chú nếu bé thêm khối Ghi chú, bỏ qua được.)

**Bài 10. Chạy robot thật (thử thách)**
Đề: Cân chỉnh, rồi cho robot đi theo vạch: (a) B → C; (b) A → D; (c) A → H. Ghi vào nhật ký mỗi lần chạy: đã cân chỉnh lại chưa, robot rời vạch ở đâu, sửa gì.

**Đáp án:** Đạt khi robot bám vạch tới đúng khu cần đến mà không rời vạch, và bé tự làm được không cần nhắc. Nếu robot rời vạch: (1) cân chỉnh lại, (2) kiểm tra vạch có bị bẩn, bị nhăn, (3) đặt lại robot đúng ô xuất phát. Phiếu này nằm ở mốc "Hết Bài 4" trong §9 giáo trình tổng.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc **không có** câu hỏi kiểm tra (CYU/Quiz) trong 27 slide của Bài 4. Bài kiểm tra duy nhất là ba hoạt động thực hành ở chương Resolve (Activity 1, 2, 3, trên bản đồ Thành phố Synapse). Phần hoạt động Plearn (`id=62361`) có thể có thêm nội dung trong H5P mà file bóc tách slide không lấy được; chưa kiểm tra.

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Nhầm mắt nào là mắt nào (tên chân trộn L/R, thứ tự trong khối lại khác) | Bé chỉ sai mắt, đoán sai quẹo | Dán nhãn ①②③④ lên mũi robot; thử trên robot thật: che từng mắt bằng băng keo đen, xem số đổi thế nào |
| Quẹo ngược hướng ("đen bên trái thì tránh sang phải") | Bé trả lời "phải" cho số 4 | Làm lại bước 3d: đặt vạch lệch trái, hỏi "bắt kịp vạch thì quay về đâu?"; dùng hai bàn tay làm bánh trái/phải |
| Bấm TB1A sai thứ tự hoặc quên lần 3 | Đèn không đúng màu như bảng; robot chạy loạn | Dán bảng màu đèn; bé tự đọc to "Đỏ – Trắng – Vàng – Đen – Xanh – Xong"; sai thì bấm Reset làm lại |
| Cân chỉnh trên vùng không toàn trắng / toàn đen | Robot trôi khỏi vạch dù chương trình đúng | Dùng tờ A4 trắng sạch và giấy đen kín; bảo bé kiểm tra bóng tay, nếp gấp che mắt robot |
| Đổi phòng, đổi ánh sáng mà không cân chỉnh lại | Hôm qua chạy tốt, hôm nay lệch | Nhắc câu "Đổi chỗ, đổi ánh sáng thì cân chỉnh lại" (slide Learn 10); thành thói quen đầu mỗi lượt |
| Tưởng robot dừng vì hết vạch | Bé nói "robot thấy hết đường nên dừng" | Chỉ ra 2 cách dừng ở Bước 5; hai cách khác nhau: không thấy đen, hoặc đã đi quá 1000 mm mà thấy số 6 |
| Chạm TB1A + TB1B không cùng lúc | Nhiệm vụ không bắt đầu | Tập chạm hai nút bằng hai ngón cùng lúc trước khi nạp |
| Sợ hàm `followLine` dài | Bé im, không muốn đọc | Chỉ đọc theo 3 phần (đọc mắt, chọn hướng, kiểm tra đích); không bắt tự viết |
| Đặt robot sai ô xuất phát | Robot đi sai đường dù bám vạch tốt | Dán chữ A, B trên bản đồ; bé kiểm tra "đặt đúng khu chưa" trước khi chạm nút |
| Nhầm đơn vị | Bé hỏi 190 là cm hay gì | 190 và 1500 là **tốc độ bánh**, đơn vị bước/giây (xem Ghi chú về bản gốc, mục 4) |

## Kiểm nghiệm cuối bài

Bài này không đo bằng thước mà đo bằng **số lần robot rời vạch**. Một lần rời là chưa đạt.

**Chuẩn bị tối thiểu, không cần sa bàn:** một tờ giấy trắng khổ lớn (hoặc mặt bàn sáng màu),
băng dính đen bản ~2 cm dán thành đường thẳng dài khoảng 1 mét, thêm một mảng đen to và một
tờ trắng sạch để cân chỉnh.

**Phép thử chính (10 phút).**

1. Nạp `FollowLine_EN.bduino`, rút cáp.
2. **Cân chỉnh đủ 7 bước ngay trên tờ giấy sẽ chạy**, không cân chỉnh ở chỗ khác rồi mang sang.
3. Đặt robot ở đầu vạch, bốn mắt nằm trên vạch, chạm cùng lúc TB1A + TB1B.
4. **Đạt khi robot đi hết đoạn vạch mà không rời ra lần nào.**
5. Chạy lại lần hai để chắc: bám vạch được một lần có thể là may.

**Ba phép thử khó hơn**, mỗi cái kiểm một thứ khác nhau:

| Phép thử | Kiểm cái gì | Đạt khi |
|---|---|---|
| Dán thêm một khúc cua | Nhóm "quẹo trái / quẹo phải" của bảng mã | Robot ôm cua, không cắt ngang |
| Đặt robot **lệch hẳn** sang một bên vạch rồi chạy | Robot có tự bắt lại vạch không | Trong vòng ~10 cm robot về giữa vạch |
| Bật thêm đèn phòng rồi chạy lại **mà không cân chỉnh** | Vì sao lần nào cũng phải cân chỉnh | Robot chạy tệ hẳn đi — và đó là kết quả **đúng** của phép thử |

Phép thử thứ ba là phép thử dạy chứ không phải phép thử chấm: cho bé thấy tận mắt rằng ánh
sáng đổi thì mắt thấy khác.

| Con thấy | Sửa |
|---|---|
| Trôi khỏi vạch liên tục | **Cân chỉnh lại trước đã** — lỗi hay gặp nhất, slide Resolve 02 cũng nói vậy |
| Chạy vài giây rồi dừng | Mất vạch (số 0) vì băng dính đứt nét hoặc cua gấp |
| Dừng ngay khi vừa chạy | Đường ngắn hơn `target` 1000 mm; giảm số đó cho vừa đường thật |
| Cắt ngang khúc cua | Cua gấp quá so với tốc độ 1500; dán cua rộng hơn |
| Đèn vẫn nháy đỏ | Chưa chạm đủ ba lần TB1A |
| Lúc được lúc không | Giấy bóng, hoặc nắng/đèn chiếu xiên vào mặt giấy; đổi chỗ chạy |

**Ghi vào nhật ký chạy thử** (slide Resolve 03): lần này đã cân chỉnh lại chưa, robot rời vạch
ở chỗ nào trên đường, lúc đó đèn LED màu gì. Ba câu đó đủ để lần sau sửa đúng chỗ.

## Ghi chú về bản gốc
Có mấy chỗ mâu thuẫn hoặc chưa chắc; thầy đọc trước khi dạy.

1. **Slide Learn 06 chú thích hướng quẹo ngược với chương trình mẫu.** Slide viết: hai mắt bên trái đen thì "swing turn right"; hai mắt bên phải đen thì "swing turn left". Chương trình mẫu (slide 08 và code): số 12 (hai mắt bên trái đen) → `runLR(190, 1500)` = quẹo trái. Giáo án này theo **chương trình mẫu** (hợp lý về vật lý hơn). Chú thích thứ nhất của slide 06 còn nhắc "ir0L và ir3R", có vẻ nhầm tên cảm biến. Chưa xác nhận trên robot thật.
2. **Thứ tự và tên mắt chưa chắc.** Slide Learn 04 ghi tên chân từ trái qua phải là `ir3R, ir1R, ir0L, ir2L`, nhưng khối `Giá trị 4 mắt` đọc theo thứ tự `2L, 0L, 1R, 3R`. Hai thứ tự này không trùng. Giáo án quy ước mắt ①②③④ theo thứ tự **trong khối**; cần thầy thử trên robot thật. Cách gán điểm 8-4-2-1 cho 4 mắt là suy luận của người bóc tách, khớp toàn bộ bảng, nhưng slide không viết ra.
3. **Nhánh "All Black (default)" trên slide 08 gây hiểu nhầm.** Nhánh `default` thực ra gom các số 9, 13, 11, 10, 5 và mọi số còn lại (kể cả 0, 15, 6) vào "đi thẳng", không chỉ riêng "đen hết".
4. **Đơn vị.** Bản EN của khối ghi "rpm" cho tốc độ và "cm" cho đoạn đường; bản mẫu tiếng Việt và code ghi **bước/giây** và **mm** (`waitDistanceMm(1)`). Giáo án theo code: 190 và 1500 là bước/giây, đoạn đường 1 mm. Giữ nguyên 190 và 1500. Cả hai nằm trong khoảng cho phép −2000…2000 bước/giây ở §6 giáo trình tổng.
5. **Số liệu so với §6 giáo trình tổng:** không có số nào mâu thuẫn (190 / 1500, 1 mm, mã 1…14, nút TB1A, 1000 mm). Chỉ lưu ý: §6 ghi "6 = hai mắt giữa thấy đen (đi thẳng)". Đúng, nhưng số 6 còn là **điều kiện dừng** sau khi đã đi quá `target`; giáo án ghi cả hai. Ngoài ra §5.1 dùng từ "Cân chỉnh"; file bóc tách đề xuất "hiệu chỉnh". Giáo án dùng "cân chỉnh" theo §5.
6. **Một đoạn code chưa rõ ý.** Ngay sau `switch` có `if (LbIRLine.isBlackDetected()) { break; }`. Nếu đúng như vậy thì vòng `lặp 10 lần` bị thoát ngay lần đầu mỗi khi còn thấy đen, và `waitDistanceMm(1)` gần như không chạy. Có thể khối thật là "**không** thấy đen" bị mất chữ trong bản xuất. Hình trên slide quá mờ để xác nhận. Việc cần làm: mở file `.bduino` trong trình soạn khối hoặc chạy robot thật. Giáo án không đặt câu hỏi nào dựa vào đoạn này.
7. **Nhãn trên slide Resolve 01:** ô thứ chín của bản đồ là CRL (Crisis Response Lab), nền xanh ca-rô, không phải một chữ cái A–H.
8. **Nút chạm.** Slide gọi chung là "tbX"; chương trình mẫu dùng TB1A. Giáo án ghi TB1A.
9. **Hoạt động Plearn** (`id=62361`) là đường dẫn do người điều phối cung cấp; nội dung H5P chưa được kiểm tra riêng.
