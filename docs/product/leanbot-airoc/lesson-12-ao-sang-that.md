# Bài 12 — Từ robot ảo sang robot thật

> Bài gốc: *From Virtual to Real Robot* · 46 slide · 4 chương (Engage 10, Learn 15, Resolve 15, Growth 6) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62989>
>
> Buổi 14 trong lộ trình (giáo trình tổng §7). Cột mốc: **cùng một chương trình chạy đúng cả trên Bản Sao Số lẫn robot thật.**
>
> Đây là bài quan trọng nhất về thao tác: lần đầu bé chuyển chương trình từ Bản Sao Số sang robot thật. **Chuẩn bị nạp code và xử lý lỗi nạp** nằm ở [`../../playbooks/leanbot-setup.md`](../../playbooks/leanbot-setup.md). Giáo án này chỉ trỏ sang đó, không chép lại. (Khi viết giáo án, file đó chưa có trong repo. Thầy kiểm tra trước giờ học.)

## Bé học xong thì làm được gì
- Chép chương trình từ trình soạn khối của Bản Sao Số sang trình soạn khối của robot thật (Sao chép khối, Dán khối).
- **Đổi đúng một khối**: thay "Nhiệm vụ: Bắt đầu trên Bản Sao Số" bằng "Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B", giữ nguyên các khối bên trong.
- Nạp chương trình xuống robot thật, chạm hai nút TB1A và TB1B cùng lúc để robot bắt đầu chạy.
- Nhìn robot thật chạy và nói được nó khác robot ảo ở chỗ nào (đường đi, khoảng cách, góc rẽ).
- Giải thích được ít nhất hai lý do robot thật chạy lệch, rồi sửa **từng số một** và thử lại theo vòng **Thử → Quan sát → Chỉnh → Lặp lại**.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Robot Leanbot thật, pin đã sạc | Slide có nhắc pin ảnh hưởng độ chính xác (GROWTH 01), nhưng không có hướng dẫn sạc. Xem Bài GS1 |
| Dây USB nối robot với máy tính | Slide **không** nhắc dây USB. Xem `leanbot-setup.md` |
| Máy tính có Chrome, vào được hai trình soạn khối (xem dưới) | Cả hai trang đều mở sẵn trong hai thẻ khác nhau, đặt tên thẻ cho khỏi nhầm |
| Sàn phẳng, sạch, có vạch xuất phát | Slide chỉ nói "đặt robot ở CRL, quay đúng hướng". Không nói cách căn |
| Băng dính màu và thước dây | Đề xuất của giáo án, để đo robot đi bao xa. Slide không nói |
| Tờ ghi chép "Đoán · Thật · Lệch · Đã đổi" | Thầy in sẵn. Slide bảo bé "viết ra giấy" nhưng không có mẫu |
| Bản vá tiếng Việt (`tools/lbeditor-vi/`) | Dạy bằng nhãn Việt trước, đối chiếu nhãn Anh sau (giáo trình tổng §4) |

**Hai trình soạn khối khác nhau, hai địa chỉ khác nhau:**

| Dùng cho | Tên trên slide | Địa chỉ |
|---|---|---|
| Robot ảo trên Bản Sao Số | Python Blockly Editor | `https://ide.pythaverse.space/lbeditor-python-simulation/index.html` |
| Robot thật | Leanbot Blockly Editor | `https://ide.pythaverse.space/lbeditor/index.html` |

Hai trang trông gần giống nhau. Khác nhau chính là **khối Nhiệm vụ** và **loại code sinh ra** (Python cho robot ảo, C++ cho robot thật).

## Thuật ngữ của bài
| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Virtual robot / Real (Physical) robot | Robot ảo / Robot thật | Robot ảo nằm trong máy tính. Robot thật có bánh xe, chạy trên sàn |
| Physical AI | AI ngoài đời thật | Robot dùng AI để di chuyển và hành động ngoài đời, không chỉ trên màn hình |
| Chief Engineer | Kỹ sư trưởng | Vai của con trong Thành phố Synapse |
| Friction | Ma sát | Sàn trơn hay nhám làm bánh xe trượt hay bám |
| Drift | Bị lệch | Robot đi hơi chệch sang một bên |
| Overshoot | Chạy quá đích | Robot đi qua khỏi chỗ cần dừng |
| Prediction | Dự đoán | Đoán trước robot sẽ làm gì rồi so với thực tế |
| Mission Begin | Khối bắt đầu nhiệm vụ | Khối mở đầu chương trình. Thiếu hoặc sai khối này, robot đứng yên |
| Combo touched | Chạm cùng lúc | Chạm hai nút cùng một lúc |
| Generated Python code / C++ code | Code Python / C++ do Blockly viết | Python: ngôn ngữ robot ảo hiểu. C++: ngôn ngữ robot thật hiểu |
| Copy blocks / Paste blocks | Sao chép khối / Dán khối | Hai nút trên thanh công cụ để chuyển khối sang trang khác |
| Upload | Nạp code | Gửi chương trình từ máy tính xuống robot thật |
| Test → Observe → Adjust → Repeat | Thử → Quan sát → Chỉnh → Lặp lại | Vòng lặp của kỹ sư giỏi |
| Think → Test → Fix → Run (Engineering Cycle) | Nghĩ → Thử → Sửa → Chạy | Bốn bước kỹ sư làm mỗi ngày |

Từ có trong giáo trình tổng §5 (Bản Sao Số, Nút chạm TB1A / TB1B, Phòng Thí Nghiệm CRL, Khu A, Khối lệnh, Tham số, Chạy thử, Sửa lỗi...) không chép lại. Cách dịch CRL theo §5.4 là **Phòng Thí Nghiệm (CRL)**. File bóc tách đề xuất "Phòng Ứng Phó Khủng Hoảng", giáo án **không dùng**.

## Khối lệnh dùng trong bài
| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `LbMission.beginByName_end` ("Mission: Begin Digital Twin" + ô tên "SynapseCity.01") | Nhiệm vụ: Bắt đầu trên Bản Sao Số … Nhiệm vụ: Kết thúc | Khối bắt đầu của **robot ảo**. Cần ô Tên nhiệm vụ. **Không dùng cho robot thật** |
| `LbMission.beginByTeacher_end` ("Mission: Begin when [TB1A + TB1B] combo touched") | Nhiệm vụ: Bắt đầu khi chạm cùng lúc [TB1A + TB1B] … Nhiệm vụ: Kết thúc | Khối bắt đầu của **robot thật**. Robot chờ tới khi con chạm hai nút cùng lúc rồi mới làm nhiệm vụ. Chọn "TB1A + TB1B" trong danh sách thả xuống |
| `LbMission.beginImmediately_end` ("Mission: Begin immediately") | Nhiệm vụ: Bắt đầu ngay lập tức | Làm nhiệm vụ ngay, không chờ nút. Thấy trong ngăn Leanbot nhưng **bài này không dùng** |
| `LbMotion.run` | Di chuyển: Chạy với vận tốc Trái ? Phải ? | Đặt tốc độ hai bánh (ví dụ 30 và 30 vòng/phút) |
| `LbMotion.waitDistanceMm` | Di chuyển: Chạy đoạn đường ? cm | Chạy cho đủ quãng đường |
| `LbMotion.stop` | Di chuyển: Dừng | Dừng robot |
| `LbMission.end` | Nhiệm vụ: Kết thúc | Đóng khối Nhiệm vụ |
| "When Leanbot started" | Leanbot bắt đầu hoạt động | Mũ vàng bọc ngoài cả chương trình |

Hai khối khác chỉ **thấy** trong ngăn Leanbot, bài này không dùng: "Chờ ? giây" và "Nhiệm vụ: Thời gian đã chạy, tính bằng ?".

Thanh công cụ của trình soạn khối (màu xanh teal, từ trái sang phải): menu ba chấm, phóng to / toàn màn hình, Hoàn tác, Làm lại, **Mở thư mục**, **Sao chép khối** (hai tờ giấy chồng), **Dán khối** (bảng kẹp giấy). Ở cạnh khung code bên phải có hai nút copy xanh lục đậm, và một biểu tượng bánh răng ở góc phải thanh teal. **Slide không giải thích** hai nút copy đó và nút bánh răng.

## Dạy thế nào

### Mở bài (5 phút)
Thầy nói: "Bài trước con chạy robot trong máy tính, rất an toàn. Hôm nay robot thật ở ngay trước mặt con. Cùng một chương trình, con đoán xem nó chạy giống không?"

Thầy hỏi và ghi lên bảng điều bé đoán (slide ENGAGE 06): "Robot thật có chạy giống robot ảo không?" Chưa trả lời. Cuối buổi quay lại câu này.

### Giảng (35 phút)

**1. Ôn nhanh (3 phút)**
- Thầy: nhắc lại bài trước: con đã viết chương trình, chạy thử trên Bản Sao Số. Hôm nay đưa **cùng chương trình** ra ngoài đời thật.
- Bé: kể lại một chương trình con đã chạy trên Bản Sao Số.

**2. Robot ảo và robot thật (5 phút)**
- Thầy: chia bảng hai cột. Robot ảo: sống trên màn hình, luôn chạy chuẩn, không ma sát, dễ làm lại, sai cũng an toàn. Robot thật: sống ngoài đời, có thể sai nhỏ, có ma sát và va chạm, cần chỉnh, dạy ta bài học thật.
- Hỏi: "Sai ở robot thật có đáng sợ không?" (Không. Kỹ sư thật luôn thử, tìm lỗi rồi sửa.)
- Nói thêm bằng ví dụ: robot thật lăn trên sàn thật, đụng vật thật, dùng cảm biến thật. Xe tự lái, robot giao hàng, robot hút bụi cũng thế. Gọi là **AI ngoài đời thật**.

**3. Cùng lệnh, kết quả khác (4 phút)**
- Thầy: "Cùng lệnh 'tiến 50 cm', robot ảo đi đúng 50 cm. Robot thật có thể đi 48 hoặc 52 cm." Hỏi: "Vì sao?" Dẫn ba lý do trên slide:
  - **Sàn:** trơn hay nhám khác nhau, bánh xe trượt hoặc bám.
  - **Hai bánh:** động cơ thật không giống hệt nhau, một bánh hơi nhanh hơn thì robot lệch dần.
  - **Thế giới thật:** có trọng lực, không khí, chỗ gồ ghề. Thế giới ảo bỏ qua hết.
- Nhấn: "Đây là chuyện bình thường. Việc của con là **nhận ra** chỗ lệch rồi **chỉnh** chương trình."
- Slide cuối bài (GROWTH 01) còn nhắc thêm **pin**: pin yếu cũng làm robot chạy khác. Thầy thêm vào cho bé.

**4. Cùng ý, khác ngôn ngữ (4 phút)**
- Thầy: "Chào buổi sáng" tiếng Việt, "Hello" tiếng Anh, "Hola" tiếng Tây Ban Nha: cùng ý, khác ngôn ngữ. Bốn tầng: **ý tưởng "tiến rồi dừng"** → code Python (robot ảo hiểu) → code C++ (robot thật hiểu) → robot chuyển động giống nhau.
- Bé: mở hai trình soạn khối, đặt hai thẻ cạnh nhau, nhìn cột code bên phải (xem mục "Chương trình mẫu").
- Hỏi: "Hai chương trình khác nhau ở chỗ nào?" (Khối Nhiệm vụ đầu tiên khác. Mấy dòng chuyển động giống nhau từng chữ.)

**5. Sáu bước chuyển chương trình (12 phút) — phần quan trọng nhất**
Thầy làm mẫu từng bước trên màn hình lớn, bé làm theo. Mỗi bước dừng lại cho cả lớp kịp.
1. **Tìm chương trình.** Mở chương trình đã làm trong Python Blockly Editor (trang robot ảo). Nhớ trang này **phải có Tên nhiệm vụ** (ví dụ "SynapseCity.01").
2. **Sao chép khối.** Bấm nút Sao chép khối (hai tờ giấy). Bé nhìn thấy con "ôm" cả chương trình.
3. **Mở trang robot thật.** Mở thẻ mới, vào `https://ide.pythaverse.space/lbeditor/index.html`. Thầy chỉ cho bé thấy hai trang khác nhau: địa chỉ khác, ngăn khối bên trái khác (trang robot thật không có nhóm Text và Lists, đó là suy ra từ ảnh slide).
4. **Dán khối.** Bấm nút Dán khối (bảng kẹp giấy). Chương trình hiện ra, vẫn còn khối Bản Sao Số cũ.
5. **Đổi khối bắt đầu nhiệm vụ.** Đây là bước dễ quên nhất. Mở ngăn Leanbot, kéo khối **"Nhiệm vụ: Bắt đầu khi chạm cùng lúc [TB1A + TB1B]"** vào thay khối "Nhiệm vụ: Bắt đầu trên Bản Sao Số". **Giữ nguyên mọi khối bên trong.** Lý do (lời slide): robot thật không cần Tên nhiệm vụ. Sau bước này, kiểm tra: ô "SynapseCity.01" đã biến mất.
6. **Nạp code xuống robot thật.** Slide chỉ ghi đúng một câu: "Nạp code C++ xuống Leanbot thật rồi xem điều gì xảy ra." **Không có** chỉ dẫn nào khác: dây USB, chọn bo mạch, chọn cổng COM, nút Nạp, hay thông báo thành công / lỗi. Thầy làm theo `leanbot-setup.md`. Điều đã có trong giáo trình tổng §6: khi nạp phải chọn bo mạch Arduino **Uno** hoặc **Nano**.

Thầy hỏi sau mỗi bước: "Con đang ở trang nào? Khối bắt đầu là khối nào?" Bước 5 nhắc hai lần.

**6. Kiểm tra trước khi nạp (2 phút)**
- Thầy: đọc slide LEARN 10: "Trước khi nạp, tìm khối Bắt đầu nhiệm vụ, xem nó đã đúng chưa." Nếu khối này thiếu hoặc sai, **robot chỉ ngồi đó**, dù các khối khác đều đúng.
- Bé: kiểm khối đầu, đọc to cho bạn nghe: "Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B".
- Dấu hiệu trong code: dòng đầu của `loop()` phải là `LbMission.begin(TB1A + TB1B);`.

**7. Chạy lần đầu (5 phút)**
- Thầy: đặt robot ở vạch xuất phát, quay đúng hướng. Dặn: "Chạm **cùng lúc** TB1A và TB1B để robot bắt đầu. Rồi đứng yên, **đừng chạm vào robot khi nó chạy**. Nhìn thật kỹ như nhà khoa học."
- Bé: nhìn ba điều và nhớ hoặc viết ra: robot đi đúng đường không? dừng đúng chỗ không? rẽ đúng góc không?
- Bảng so sánh robot ảo và robot thật (slide LEARN 12):

| Cần xem | Robot ảo | Robot thật |
|---|---|---|
| Quãng đường | Chính xác | Gần đúng, có thể lệch chút |
| Góc rẽ | Hoàn hảo | Có thể lệch nhẹ |
| Tốc độ | Mượt, đều | Có thể thay đổi chút |
| Sai số | Không có | Có thể có, bình thường! |

- Hỏi: "Hai robot khác nhau chỗ nào? Vì sao?"

### Bé tự làm (45 phút)

**A. Chạy lại chương trình cũ trên robot thật (10 phút).** Mỗi nhóm chuyển và nạp chương trình tiến 20 cm (Chạy 30/30 vòng/phút, Chạy đoạn đường 20 cm, Dừng). Dự đoán, chạy, **đo bằng thước** robot đi được bao nhiêu cm. Ghi vào tờ.

**B. Nhiệm vụ nhỏ: từ Phòng Thí Nghiệm (CRL) tới Khu A (25 phút).**
- Sa bàn 3×3. Hàng trên: **A Trung tâm Kinh doanh** (đích), C Năng lượng Xanh, F Tự động hóa Công nghiệp. Hàng giữa: B Khu Sáng tạo, E Trung tâm Di chuyển, H Trung tâm số. Hàng dưới: D Khu ven nước, G Khu sinh thái, **CRL Phòng Thí Nghiệm** (xuất phát). Tức là xuất phát ở góc dưới phải, đích ở góc trên trái. (Tên tiếng Việt các khu B, C, D, E, F, G, H ở đây là bản dịch của người viết giáo án; giáo trình tổng chưa có.)
- Ba luật của nhiệm vụ (slide RESOLVE 05): **đi đúng đường**, **dừng đúng Khu A** (không sớm, không muộn), **không chạy quá đích**.
- Quy trình bé làm:
  1. **Nghĩ và lập kế hoạch.** Chia hành trình thành các bước nhỏ: Xuất phát ở CRL → Đi thẳng → Rẽ nếu cần → Dừng ở Khu A. Viết ra giấy **trước khi** viết chương trình. Dự đoán: đi bao xa? rẽ góc nào? dừng đúng chỗ không?
  2. **Chạy thử trên Bản Sao Số trước**, sửa cho đúng.
  3. **Chuyển sang robot thật** theo sáu bước, kiểm tra khối bắt đầu, đặt robot ở CRL đúng hướng, chạm TB1A + TB1B.
  4. **Quan sát** ba câu: có đi đúng đường không? có rẽ đúng không? có dừng ở Khu A không?
  5. **Nếu chưa tới đích:** tìm nguyên nhân (xem "Bé hay vướng"), **đổi một thứ một lần**, ghi lại đã đổi gì, đặt robot lại CRL, chạy lại.
- **Chưa lấy được:** độ dài mỗi ô sa bàn, số cm từ CRL tới Khu A, góc rẽ, và đường kẻ đen có phải dùng cảm biến vạch không. Slide RESOLVE không cho chương trình đáp án. Thầy tra kích thước sa bàn thật trước giờ học (giáo trình tổng §6 chỉ cho biết sa bàn thi là 4 ft × 4 ft, tức 1,2192 m).

**C. Chỉnh số, ghi chép (10 phút).** Dùng số liệu của phần A để luyện chỉnh. Ví dụ trên slide: khối ghi 50 cm mà robot đi quá, thử 47 cm. Rẽ chưa đủ 90 độ, thử 95 độ. Mỗi lần **một số**. Ghi: số đã đổi, robot đi / rẽ ra sao, tốt hơn chưa. Lặp ít nhất 3 lần, vẽ biểu đồ sai lệch giảm dần nếu kịp.

### Chốt bài (5 phút)
- Thầy: quay lại câu hỏi đầu giờ: "Robot thật có chạy giống robot ảo không?" Bé trả lời bằng điều mình thấy.
- Ba bài học (slide GROWTH 01): robot thật khác robot ảo (sàn, pin, sai số nhỏ), phải thử nhiều lần, lỗi là dữ liệu quý.
- Vòng **Nghĩ → Thử → Sửa → Chạy**: thầy chỉ lên bảng và hỏi: "Hôm nay con làm đủ bốn bước chưa?"
- Vì sao có Bản Sao Số: thử nhiều đường trên màn hình, sửa lỗi lớn trước, rồi mới ra sàn thật cho yên tâm.
- Cột mốc buổi này (giáo trình tổng §7): **cùng một chương trình chạy cả ảo lẫn thật.** Giáo trình tổng (§9) đặt mốc hết Bài 12 là sai lệch dưới 2 cm. Slide không có con số này (xem "Ghi chú về bản gốc").

## Chương trình mẫu
Chương trình chỉ tiến 20 cm rồi dừng. Nhìn hai bản cạnh nhau.

**Bản robot ảo (Bản Sao Số) — code Python**

```
Leanbot bắt đầu hoạt động
  Nhiệm vụ: Bắt đầu trên Bản Sao Số  "SynapseCity.01"
    Di chuyển: Chạy với vận tốc Trái 30 Phải 30 vòng/phút
    Di chuyển: Chạy đoạn đường 20 cm
    Di chuyển: Dừng
  Nhiệm vụ: Kết thúc
```

```python
from pyLeanbot import *

Leanbot.begin()

LbMission.beginDigitalTwin("SynapseCity.01")
LbMotion.runLRrpm(30, 30)
LbMotion.waitDistanceMm(20 * 10)
LbMotion.stopAndWait()
LbMission.end()
```
Dòng `beginDigitalTwin` bị cắt ở mép ảnh slide (LEARN 04); phần "01" suy ra từ tên nhiệm vụ trên khối. Chương trình ví dụ đầu bài (LEARN 03) ghi **4.2 cm**, các slide sau ghi 20 cm.

**Bản robot thật — code C++ (Arduino)**

```
Leanbot bắt đầu hoạt động
  Nhiệm vụ: Bắt đầu khi chạm cùng lúc  TB1A + TB1B
    Di chuyển: Chạy với vận tốc Trái 30 Phải 30 vòng/phút
    Di chuyển: Chạy đoạn đường 20 cm
    Di chuyển: Dừng
  Nhiệm vụ: Kết thúc
```

```cpp
#include <Leanbot.h>

void setup() {
  Leanbot.begin();
}

void loop() {
  LbMission.begin(TB1A + TB1B);
  LbMotion.runLRrpm(30, 30);
  LbMotion.waitDistanceMm(20 * 10);
  LbMotion.stopAndWait();
  LbMission.end();
}
```
(Ba dòng chú thích "Generated Leanbot Arduino code …" ở đầu file do trình soạn khối tự thêm.)

**Đối chiếu Python ↔ C++:**
| Python (robot ảo) | C++ (robot thật) |
|---|---|
| `Leanbot.begin()` ở đầu file | `Leanbot.begin()` nằm trong `setup()` |
| `LbMission.beginDigitalTwin("SynapseCity.01")` | `LbMission.begin(TB1A + TB1B)` |
| `LbMotion.runLRrpm(30, 30)` | giống hệt |
| `LbMotion.waitDistanceMm(20 * 10)` | giống hệt (20 cm thành `20 * 10` mm) |
| `LbMotion.stopAndWait()` | giống hệt |
| `LbMission.end()` | giống hệt |

Chỉ khác **dòng bắt đầu nhiệm vụ**, đúng như khối bé phải đổi ở Bước 5.

## Phiếu ôn luyện

**Bài 1 — Ảo hay thật? (dễ)**
**Đề:** Mỗi câu dưới đây nói về robot ảo hay robot thật? (a) Luôn đi đúng 50 cm. (b) Có ma sát với sàn. (c) Dễ làm lại từ đầu. (d) Có thể bị lệch sang một bên. (e) Thử sai bao nhiêu lần cũng an toàn. (f) Dạy ta những bài học thật.
**Đáp án:** (a) ảo · (b) thật · (c) ảo · (d) thật · (e) ảo · (f) thật.

**Bài 2 — Đọc đoán kết quả (dễ).**
**Đề:** Đọc đoạn C++ ở mục "Chương trình mẫu". Con bật robot lên và đặt xuống sàn, **chưa chạm gì**. Robot làm gì? Khi con chạm cùng lúc TB1A và TB1B thì robot làm gì, dừng ở đâu?
**Đáp án:** Chưa chạm thì robot **đứng yên chờ**, vì dòng `LbMission.begin(TB1A + TB1B)` đợi hai nút được chạm cùng lúc. Chạm xong, robot chạy 30/30 vòng/phút, đi thẳng 20 cm (200 mm) rồi dừng. Trên sàn thật, chỗ dừng có thể lệch chút so với 20 cm.

**Bài 3 — Tìm lỗi (dễ).**
**Đề:** Một bạn chuyển chương trình sang trang robot thật, dán xong, nạp xuống robot, chạm TB1A + TB1B. Robot **đứng yên**. Khối đầu chương trình của bạn vẫn là "Nhiệm vụ: Bắt đầu trên Bản Sao Số 'SynapseCity.01'". Sai ở đâu? Sửa thế nào?
**Đáp án:** Bạn quên **đổi khối bắt đầu nhiệm vụ**. Khối Bản Sao Số dành cho robot ảo, robot thật không chạy theo nó (slide: "your robot will just sit there"). Sửa: kéo "Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B" thay vào, giữ nguyên các khối bên trong, rồi nạp lại. Slide không nói rõ điều gì xảy ra với dòng `beginDigitalTwin` khi nạp xuống robot thật, nên đáp án dựa vào lời cảnh báo của slide.

**Bài 4 — Sắp thứ tự (vừa).**
**Đề:** Sáu bước chuyển chương trình bị xáo trộn. Xếp lại cho đúng:
(a) Dán khối · (b) Nạp code C++ xuống robot thật · (c) Đổi khối bắt đầu nhiệm vụ · (d) Mở trình soạn khối robot thật · (e) Tìm chương trình trên Bản Sao Số · (f) Sao chép khối
**Đáp án:** e → f → d → a → c → b.

**Bài 5 — Điền số (vừa).**
**Đề:** (a) Robot ảo đi 50 cm. Robot thật chạy cùng lệnh, có thể đi từ ? đến ? cm (theo ví dụ trên slide). (b) Robot đi quá, khối đang ghi 50 cm. Thử đổi thành bao nhiêu (theo slide)? (c) Robot rẽ chưa đủ, khối ghi 90 độ. Thử đổi thành bao nhiêu? (d) Khối ghi 20 cm, code C++ ghi `waitDistanceMm(20 * ?)`. Điền số.
**Đáp án:** (a) **48** đến **52** cm. (b) **47** cm (giảm một chút). (c) **95** độ (tăng một chút). (d) **10**, vì 1 cm là 10 mm. Ở (b) và (c), điều quan trọng là đổi **nhỏ** và **một số một lần**, không phải đúng 47 hay 95.

**Bài 6 — Dịch nhãn (dễ).**
**Đề:** Dịch sang tiếng Việt: (a) Mission: Begin when TB1A + TB1B combo touched (b) Mission: End (c) Motion: Run with velocity Left 30 Right 30 (d) Motion: Keep running for 20 cm (e) Motion: Stop. Dịch ngược sang tiếng Anh: (f) Nhiệm vụ: Bắt đầu trên Bản Sao Số (g) Leanbot bắt đầu hoạt động.
**Đáp án:** (a) Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B · (b) Nhiệm vụ: Kết thúc · (c) Di chuyển: Chạy với vận tốc Trái 30 Phải 30 · (d) Di chuyển: Chạy đoạn đường 20 cm · (e) Di chuyển: Dừng · (f) Mission: Begin Digital Twin · (g) When Leanbot started.

**Bài 7 — Làm trên máy (vừa).**
**Đề:** Mở Leanbot Blockly Editor (trang robot thật). Ghép khối sao cho cột code C++ bên phải sinh ra đúng đoạn này (bỏ qua ba dòng chú thích đầu file):
```cpp
#include <Leanbot.h>

void setup() {
  Leanbot.begin();
}

void loop() {
  LbMission.begin(TB1A + TB1B);
  LbMotion.runLRrpm(30, 30);
  LbMotion.waitDistanceMm(20 * 10);
  LbMotion.stopAndWait();
  LbMission.end();
}
```
**Đáp án:** Khối "Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B", bên trong có "Chạy với vận tốc Trái 30 Phải 30 vòng/phút", "Chạy đoạn đường 20 cm", "Dừng", rồi "Nhiệm vụ: Kết thúc". Cột code giống từng dòng thì đúng.

**Bài 8 — Chẩn đoán (khó).**
**Đề:** Nối tình huống với nguyên nhân và cách sửa: (1) Robot đi qua khỏi Khu A. (2) Robot rẽ sai hướng hoặc sai góc. (3) Robot dừng quá sớm hoặc trôi sang một bên. Rồi trả lời: nếu con thấy ba chỗ sai cùng lúc thì nên sửa thế nào?
**Đáp án:** (1) **Đi quá**: khoảng cách có thể quá lớn, giảm khoảng cách một chút (ví dụ 50 → 47 cm). (2) **Rẽ sai**: kiểm tra góc rẽ trong chương trình (rẽ chưa đủ thì tăng, ví dụ 90 → 95 độ). (3) **Trượt đích**: xem lại từng bước; một bánh có thể quay nhanh hơn bánh kia nên robot trôi, hoặc sàn trơn. Sửa **từng chỗ một**, ghi lại đã đổi gì, chạy lại. Đổi nhiều thứ cùng lúc thì không biết thứ nào làm robot tốt hơn.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Trong 46 slide không có câu trắc nghiệm. Nếu hoạt động H5P trên Plearn có câu hỏi ẩn thì **chưa lấy được**. Các câu mở trên slide, không có đáp án đúng / sai, dùng để thảo luận:

| Câu gốc | Dịch |
|---|---|
| "What do you think will happen?" (ENGAGE 06) | Con nghĩ chuyện gì sẽ xảy ra? |
| "What is Physical AI? / How do we move code? / Why does it move differently?" (ENGAGE 03) | AI ngoài đời thật là gì? Làm sao chuyển chương trình? Vì sao robot thật chạy khác? |
| "What was different? Why do you think it happened?" (LEARN 12) | Có gì khác? Con nghĩ vì sao? |
| "What will my robot do? Where will it go? Will it stop at the right place?" (RESOLVE 06) | Robot sẽ làm gì? Đi đâu? Có dừng đúng chỗ không? |
| "Did it follow the path? Did it turn correctly? Did it stop at Zone A?" (RESOLVE 11) | Có đi đúng đường không? Rẽ đúng chưa? Dừng ở Khu A chưa? |
| "What surprised you? What was harder than you expected?" (GROWTH 01) | Điều gì làm con bất ngờ? Điều gì khó hơn con nghĩ? |

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Quên đổi khối bắt đầu | Robot đứng yên dù code đúng | Cho bé đọc to tên khối đầu tiên trước khi nạp. Dán tờ nhắc "Đổi khối đầu!" cạnh máy |
| Nhầm hai trang soạn khối | Dán khối nhầm trang; tìm mãi không thấy khối TB1A + TB1B | Mở hai thẻ, đặt tên thẻ "Robot ảo" và "Robot thật". Kiểm tra địa chỉ trên thanh trình duyệt |
| Chạm không cùng lúc | Chạm một nút thì robot không chạy | Tập chạm hai nút bằng hai ngón tay, đồng thời, trước khi nạp |
| Cho rằng chương trình sai khi robot thật lệch | Bé xóa hết làm lại | Quay lại bảng so sánh ảo / thật. Nhắc: lệch chút là bình thường. Hỏi đo được lệch mấy cm |
| Sửa quá tay hoặc đổi nhiều thứ | Sửa 50 thành 30; hoặc đổi cả khoảng cách lẫn góc | Nhắc "đổi một thứ một lần". Ví dụ nhỏ: 47, 95 |
| Lệch vì cách đặt robot, không phải vì code | Mỗi lần đặt, robot đi một kiểu | Dán băng dính đánh dấu vị trí và hướng xuất phát. Đặt giống nhau mọi lần (slide chỉ nói "quay đúng hướng") |
| Không nạp được code | Máy báo lỗi khi nạp, không thấy robot, chọn sai bo mạch hoặc cổng | Làm theo `leanbot-setup.md`. Khóa gốc **không có** danh sách thông báo lỗi; chưa lấy được |
| Quá nhiều chữ tiếng Anh | "Mission Begin", "combo touched", "Upload" làm bé rối | Nhãn Việt cạnh nhãn Anh; dùng bản vá tiếng Việt trước |
| Tưởng robot thật chạy giống hệt robot ảo | Bé ngạc nhiên rồi nản | Nói trước ở phần Mở bài. Cho bé đo lệch, "lệch" là dữ liệu, không phải thất bại |

## Ghi chú về bản gốc
1. **Slide không có phần nạp code.** Bước 6 ("Upload Generated C++ Code to physical Leanbot and see what happens") chỉ có một câu. Cả 46 slide **không có**: cài phần mềm, driver, cáp USB, chọn bo mạch, chọn cổng COM, nút Nạp, thanh tiến trình, thông báo thành công hoặc lỗi, vị trí nút TB1A / TB1B trên robot, cách căn robot. Bài giả định bé đã biết làm từ nơi khác, hoặc thầy làm cùng. Phần nạp code của giáo án này lấy từ giáo trình tổng và `leanbot-setup.md`, không phải từ slide.
2. **"A → B" lẫn với "CRL → Khu A".** Slide RESOLVE 04 ghi "Move Your Robot from A → B" và RESOLVE 07 hỏi "stop at Zone B", nhưng nội dung và bản đồ (RESOLVE 03) là xuất phát ở CRL, đích ở **Khu A**. Giáo án dùng CRL → Khu A.
3. **Khoảng cách ví dụ không thống nhất:** 4.2 cm (LEARN 03), 20 cm (LEARN 04–09), 50 cm (LEARN 01, 13, chỉ là ví dụ bằng lời).
4. **Nhãn viết hai kiểu:** "TB1A+TB1B" (LEARN 11) và "TB1A + TB1B" (tên khối). Cùng một cặp nút.
5. **Pin chỉ nhắc một lần** (GROWTH 01) như nguyên nhân sai lệch; slide LEARN 02 chỉ kể sàn, tốc độ hai bánh, trọng lực / không khí / va chạm.
6. **Số liệu so với giáo trình tổng:** giáo trình tổng §9 đặt mốc hết Bài 12 là "sai lệch dưới 2 cm". Slide không có mốc nào, và ví dụ của chính slide (50 cm thành 48 hoặc 52) là lệch **2 cm**, tức đúng bằng ngưỡng. Hai thứ không mâu thuẫn nhưng ngưỡng này khá chặt cho lần đầu; thầy cân nhắc. CRL dịch là "Phòng Thí Nghiệm (CRL)" theo §5.4 (file bóc tách đề xuất cách dịch khác). Số khác (−59 … 59 vòng/phút, sa bàn 4 ft × 4 ft, bo mạch Uno / Nano) không mâu thuẫn.
7. **Lỗi dàn trang:** tiêu đề đè chữ ở LEARN 04 (bước 2), LEARN 06 (Step 3), RESOLVE 05 (thẻ 3), RESOLVE 08 ("Distance", "Turn" xuống dòng), GROWTH 03. Nội dung vẫn đọc được. Dấu ngoặc đóng bị bỏ ở bước 1 trên LEARN 04 ("Move forward, stop.").
8. **Ngày trên ảnh:** chương trình mẫu ghi ngày 2026-03-29, cho biết bộ slide viết khoảng cuối tháng 3 năm 2026.
