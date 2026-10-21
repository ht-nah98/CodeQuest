# Bài 9 — Nhận diện dáng người

> Bài gốc: *Pose Recognition* (slide ghi "Pose recognition & Capstone project", bộ "Dancing with AI") · 59 slide · 3 chương (Day 3: 30 slide, Day 4: 24 slide, Day 5: 5 slide) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62977>

> **Bài này khác mọi bài còn lại.** Không có robot Leanbot, không có Blockly Leanbot, không có code C++. Bé dùng **Scratch** với **webcam** và tiện ích **Body Sensing / Hand Sensing**. Máy không cài được tiện ích thì không dạy được phần thực hành. Xem mục "Việc thầy làm trước buổi học".

## Bé học xong thì làm được gì
- Kể được 4 việc con người dùng chuyển động: đi lại, chơi thể thao, làm nghệ thuật, giao tiếp.
- Nói được một câu: máy không hiểu chuyển động như người, nhưng học được quy luật từ nhiều ví dụ.
- Thêm tiện ích Body Sensing (hoặc Hand Sensing) vào Scratch và làm nhân vật đi theo vai trái (hoặc đầu ngón cái) của mình qua webcam.
- Ghép được chương trình "khi thấy cười thì nói Yay!" bằng khối biểu cảm khuôn mặt.
- Điền được bảng "Ai vui, ai lo?" (ma trận đạo đức) cho một máy AI đơn giản, nói được ai bị ảnh hưởng.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Laptop có **webcam** | Mỗi bé hoặc mỗi cặp một máy. Màn hình tối thiểu 1280×720 |
| Trình duyệt cho phép dùng camera | Thầy thử trước. Lần đầu trình duyệt sẽ hỏi xin quyền camera |
| **Scratch có tiện ích Body Sensing / Hand Sensing** | **Slide không ghi URL Scratch.** File bóc tách chỉ nói giao diện giống Stretch3 / Scratch Lab, không đọc được địa chỉ. **Chưa xác nhận bản nào dùng được.** Thầy phải tìm và thử trước buổi học (xem bên dưới) |
| Mạng Internet | Tiện ích và Máy học được dạy chạy trên mạng |
| Trang Máy học được dạy | <https://teachablemachine.withgoogle.com/train> (URL ghi trên slide Day 4, số 12) |
| Hai dự án mẫu (tùy chọn) | Dog Hide: <https://tinyurl.com/doghide> · Snake Game: <https://tinyurl.com/scratchsnakegame> (URL ghi trên slide Day 4) |
| Giấy, bút | Cho bảng "Ai vui, ai lo?" |
| Thẻ gỡ rối, thẻ lập trình ("Stuck Cards", "Coding Cards") | Slide Day 3 nhắc tới nhưng không nói thẻ từ đâu. Chưa lấy được. Thầy tự làm thẻ nếu cần |

### Việc thầy làm trước buổi học
Làm lần lượt, mỗi việc xong mới sang việc sau. Việc nào hỏng thì báo ngay, đừng chờ tới giờ học.

1. Mở Scratch bản có tiện ích mở rộng. Ở góc trái dưới có **nút xanh có dấu cộng** (nút thêm tiện ích mở rộng).
2. Bấm nút đó. Tìm thẻ **"Body Sensing"** (mô tả trên thẻ: "Sense body position with the camera") và thẻ **"Hand Sensing"** ("Sense hand movement with the camera"). Không thấy hai thẻ này thì máy/bản Scratch này **không dùng được** cho bài.
3. Bấm vào thẻ Body Sensing. Cho phép camera khi trình duyệt hỏi. Kéo khối `go to (left shoulder)` ra, bấm thử, thấy nhân vật nhảy tới vai mình là đạt.
4. Làm tương tự với Hand Sensing, khối `go to (thumb) (tip)`.
5. Ghi lại URL Scratch đã dùng được vào chỗ này của giáo án, để các buổi sau không phải tìm lại: `__________`.
6. Nếu không máy nào cài được tiện ích: dạy phần "Giảng" (không cần máy) và phần bảng "Ai vui, ai lo?". Bỏ phần "Bé tự làm" và ghi lại để báo Pythaverse.

**Riêng tư:** webcam quay mặt bé. Dặn bé và nhắc thầy: không chụp, không lưu, không đưa ảnh lên mạng. Chỉ để máy "nhìn" lúc đang chơi. (Đây cũng là quy tắc của CodeQuest: không thu thập dữ liệu cá nhân của trẻ.)

## Thuật ngữ của bài
Từ đã có ở giáo trình tổng §5 (Teachable Machine = Máy học được dạy; Test = Chạy thử; Debug = Sửa lỗi; Condition/If = Điều kiện/Nếu; Loop = Vòng lặp) thì dùng đúng cách dịch đó, không chép lại.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Natural Interaction | Tương tác tự nhiên | Người và máy "nói chuyện" bằng cử động, như người với người |
| two-way street | đường hai chiều | Người phản ứng với máy, máy cũng phản ứng với người |
| Motion / Movement | Chuyển động | Cách cơ thể con cử động: đi, nhảy, vẫy tay |
| Pattern | Quy luật | Điều cứ lặp lại mà máy tìm ra trong nhiều ví dụ |
| Model (machine learning model) | Mô hình | Bộ não máy đã học xong từ nhiều ví dụ |
| Pre-trained model | Mô hình có sẵn | Đã học xong từ trước, mình chỉ việc dùng |
| Scratch | Scratch | Nơi kéo thả khối để làm truyện, trò chơi, hoạt hình |
| Sprite | Nhân vật (sprite) | Hình nhân vật đứng trên sân khấu Scratch |
| Extension | Tiện ích mở rộng | Bộ khối thêm vào Scratch, bấm nút xanh góc trái dưới |
| PoseNet | PoseNet | Mô hình có sẵn, biết tìm các khớp xương người trong ảnh |
| Pose / Skeleton | Dáng người / Khung xương | Các chấm nối thành hình người: vai, khuỷu, cổ tay |
| Keypoint | Điểm mốc | Một chấm đánh dấu chỗ trên cơ thể: mũi, vai, đầu ngón tay |
| Body Sensing / Hand Sensing | Cảm nhận cơ thể / Cảm nhận bàn tay | Hai bộ khối để máy nhìn người và tay qua camera |
| Expression | Biểu cảm | Vui, giận, ngạc nhiên trên mặt. Máy đoán được |
| Affectiva | Affectiva | Tên công ty làm mô hình đọc biểu cảm khuôn mặt |
| Class (prediction class) | Nhóm nhận diện | Tên mỗi loại máy phải phân biệt, ví dụ "lên", "xuống" |
| Image vs pose | Dùng ảnh hay dùng dáng | Máy học từ cả bức ảnh, hoặc chỉ từ khung xương |
| Stakeholder | Người liên quan | Người được lợi hoặc bị ảnh hưởng khi dùng máy |
| Value | Điều quan tâm | Điều mỗi người coi trọng: sức khỏe, tiết kiệm, đi làm được |
| Ethical Matrix | Ma trận đạo đức ("Bảng Ai vui, ai lo?") | Bảng ghi ai quan tâm điều gì khi dùng một máy AI |
| Capstone / Final project | Dự án cuối khóa | Sản phẩm bé tự làm rồi kể cho cả lớp |

## Khối lệnh dùng trong bài
Không có khối Leanbot. Toàn bộ là khối **Scratch**. Cột "Nhãn Việt" do giáo án này đặt để thầy nói; trên màn hình bé vẫn thấy nhãn tiếng Anh.

| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `when green flag clicked` | Khi bấm cờ xanh | Bắt đầu chương trình |
| `forever` | Lặp mãi mãi | Làm đi làm lại không dừng |
| `glide (1) secs to (random position)` | Lướt 1 giây tới vị trí ngẫu nhiên | Nhân vật trượt tới chỗ bất kỳ |
| `glide (1) secs to (mouse-pointer)` | Lướt 1 giây tới con trỏ chuột | Nhân vật chạy theo chuột |
| `go to (mouse-pointer)` | Đi tới con trỏ chuột | Bài khởi động Day 4 |
| `go to (left shoulder)` (Body Sensing) | Đi tới vai trái | Nhân vật đứng đúng vai trái của bé |
| `go to (thumb) (tip)` (Hand Sensing) | Đi tới đầu ngón cái | Nhân vật bám đầu ngón cái |
| `when (smile) detected` | Khi thấy cười | Chạy khi camera thấy bé cười |
| `when (eyebrow furrow) detected` | Khi thấy nhíu mày | Chạy khi camera thấy bé nhíu mày |
| `switch costume to (ecstatic)` / `(angry)` | Đổi trang phục thành "vui sướng" / "giận" | Đổi hình nhân vật |
| `say (Yay!)` | Nói "Yay!" | Hiện bong bóng thoại |
| `use model (Enter Model URL Here!)` | Dùng mô hình (dán địa chỉ mô hình) | Tải mô hình tự dạy từ Máy học được dạy |
| `model (...) prediction = (Bunny-ears)` / `prediction is (Class 1)` | Mô hình đoán là "Tai thỏ" / đoán là "Nhóm 1" | Điều kiện theo kết quả máy đoán |
| `if ... then ... else` | Nếu ... thì ... không thì | Chọn việc theo điều kiện |
| `move (10) steps`, `next costume`, `if on edge, bounce` | Đi 10 bước, trang phục kế, chạm mép thì bật lại | Khối chuyển động trong ví dụ Tai thỏ |

Các khối khác chỉ xuất hiện trong ví dụ Snake Game (bút vẽ, âm thanh, điểm): `define run game`, `erase all`, `pen down`, `set pen color`, `set pen size to 25`, `touching (edge)?`, `touching (taco)?`, `set score to 0`, `play sound`. **Không dạy**, chỉ cho bé xem.

## Dạy thế nào
Buổi 11 trong lộ trình, 90 phút. Khóa gốc dạy nội dung này trong 3 ngày (Day 3–5). Bản sắp xếp dưới đây **cắt gọn** vào 90 phút; phần cắt ghi rõ ở cuối mục.

### Mở bài (5 phút)
1. Thầy bật một đoạn nhảy "điệu robot" hoặc tự làm vài động tác robot trước lớp. Hỏi: "Thầy đang làm gì? Con đoán thầy bắt chước ai?"
2. Hỏi tiếp: "Nếu máy tính nhìn thầy qua camera, nó có biết thầy đang giơ tay không?" Cho bé đoán, chưa trả lời.
3. Nói: "Hôm nay con dạy máy tính nhìn dáng người. Bài này không dùng robot Leanbot. Con dùng Scratch."

### Giảng (35 phút)
**Bước 1. Con người dùng chuyển động để làm gì? (6 phút)**
- Thầy hỏi: "Mình cử động để làm những việc gì?" Bé nói tự do trước.
- Rồi thầy gom lại thành 4 việc, mỗi việc một ví dụ: đi lại (đi bộ, xe lăn); chơi thể thao (đấu kiếm, bóng bầu dục); làm nghệ thuật (múa ba-lê, nhạc trưởng); giao tiếp (ngôn ngữ ký hiệu, dáng người khi nói chuyện).
- Bé làm: nói một ví dụ của riêng mình cho mỗi nhóm.

**Bước 2. Máy có hiểu chuyển động không? (5 phút)**
- Hỏi: "Máy tính có di chuyển được không? Khác mình chỗ nào?" Cho xem hoặc kể: rô-bốt đi như người, robot nhỏ xoay người, robot nhảy trên sân khấu.
- Hỏi: "Máy có hiểu chuyển động như mình không?" Cho bé đoán.
- Trả lời bằng câu của slide, nói lại cho dễ hiểu: "Máy **không hiểu** như mình. Nhưng nó học được **quy luật** từ thật nhiều ví dụ, rồi phản ứng lại."
- Giải thích "đường hai chiều": mình nhìn máy làm gì, máy cũng nhìn mình làm gì.

**Bước 3. Làm quen Scratch: cho nhân vật chuyển động (6 phút)**
- Bé mở Scratch. Thầy chỉ: nút cờ xanh là bắt đầu, nút đỏ là dừng.
- Ghép chương trình 1: `Khi bấm cờ xanh` → `Lặp mãi mãi` → `Lướt 1 giây tới vị trí ngẫu nhiên`. Bé bấm cờ xanh, xem nhân vật chạy lung tung.
- Đổi thành chương trình 2: thay khối bằng `Lướt 1 giây tới con trỏ chuột`. Hỏi: "Lần này ai ra lệnh cho nhân vật?" (Đáp: con, bằng chuột. Slide gọi là "đầu vào từ người dùng".)

**Bước 4. Máy "thấy" khung xương (6 phút)**
- Thầy cho xem hình người có khung xương xanh. Hỏi: "Con thấy những chấm gì?" Gọi tên: chấm là **điểm mốc**, nối lại là **khung xương**.
- Giải thích PoseNet: "Một bộ não đã học sẵn từ rất nhiều ảnh người kèm khung xương. Mình không phải dạy nữa, chỉ việc dùng."
- Thêm tiện ích: bấm nút xanh góc trái dưới → chọn thẻ **Body Sensing**. Cho phép camera khi hộp thoại hiện ra.
- Bé ghép: `Khi bấm cờ xanh` → `Lặp mãi mãi` → `Đi tới vai trái` (khối `go to (left shoulder)`). Bấm cờ xanh, đứng trước webcam. Nhân vật phải đứng đúng vai trái của con.
- Hỏi: "Giơ tay lên thì nhân vật có đi theo không? Vì sao khối này phải nằm trong `Lặp mãi mãi`?"

**Bước 5. Bàn tay và khuôn mặt (6 phút)**
- Thêm tiện ích **Hand Sensing**. Khối `go to (thumb) (tip)`. Chương trình mẫu: cờ xanh → nói "That's a thumbs up from me!" → lặp mãi mãi: đi tới đầu ngón cái. Bé giơ ngón cái, xem nhân vật bám theo.
- Nói về khuôn mặt: mô hình khuôn mặt của một công ty tên Affectiva. Nó cho điểm mốc trên mặt (lông mày, miệng, mũi) và còn đoán được **biểu cảm** (há miệng, nhướng mày, chớp mắt).
- Bé ghép hai khối: `Khi thấy cười` → đổi trang phục "ecstatic" → nói "Yay!"; `Khi thấy nhíu mày` → "angry" → nói "Grrrr...". Cả lớp cười thử, nhíu mày thử.
- Nhắc lại luật riêng tư: không chụp, không lưu.

**Bước 6. Ma trận đạo đức: "Ai vui, ai lo?" (6 phút)**
- Mở đầu: "AI do người làm, cho người dùng. Nên mình phải nghĩ: máy này ảnh hưởng tới ai?"
- Đưa ví dụ 1: máy phát hiện **tay chạm mặt** (chạm mặt dễ lây bệnh). Hỏi: "Ai quan tâm máy này?" Vẽ bảng trên bảng đen: hàng là **người** (bố mẹ, bác sĩ, thầy cô), cột là **điều họ quan tâm** (bé khỏe mạnh; đi làm được; không muốn tự bị ốm). Bé chấm mặt cười to / nhỏ / để trống vào mỗi ô. Bảng mẫu ở phần "Chương trình mẫu".
- Đưa ví dụ 2: máy phát hiện **rác nào bỏ vào thùng tái chế nào**. Ai quan tâm? (thành phố trả tiền tái chế, công ty mua vật liệu tái chế, thế hệ mai sau). Điều quan tâm: giảm chi phí, bền vững, ảnh hưởng môi trường.
- Câu hỏi chốt của thầy: "Máy này giúp ai? Có ai bị lo, bị thiệt không?" Không có đáp án sai, miễn bé nói được lý do.

**Phần cắt khỏi 90 phút (nói rõ để thầy quyết):** (1) Bước nhìn video/GIF dài ở Day 3; (2) hai dự án mẫu Dog Hide và Snake Game chỉ cho xem, không phân tích từng khối (Snake Game quá dài cho bé lớp 4); (3) trình bày dự án cuối khóa (Day 5); (4) mục "Free Project Time" của Day 5 có một ví dụ viết bằng JavaScript (`nose.style.color`), vượt trình độ lớp 4, **bỏ hẳn**.

### Bé tự làm (45 phút)
Chọn **một** trong hai, tùy máy và thời gian.

**Phần A. Dự án nhỏ về dáng người (bám slide Day 3, số 28), 20 phút**
- Đề bài trên slide: "Use Scratch to make a project using poses!" Nghĩa: dùng Scratch làm một dự án phản ứng theo dáng người. Ví dụ: Măng bám theo ngón tay, nhân vật đổi mặt khi con cười, nhân vật đứng trên đầu con.
- Bé tự nghĩ. Thầy chỉ hỏi: "Dự án của con hiểu gì về con?" (câu phản tư trên slide).
- Xong thì **đi quanh lớp** chơi thử dự án của bạn. Hỏi mỗi bạn hai câu: "Con thích gì ở dự án này?" và "Nó ảnh hưởng tới ai? Có điều gì đáng lo không?"

**Phần B. Tự dạy máy bằng Máy học được dạy (bám slide Day 4, số 12–14), 25 phút, chỉ làm nếu còn thời gian**
Bốn bước ghi trên slide, theo đúng thứ tự:
1. Mở <https://teachablemachine.withgoogle.com/train>.
2. Huấn luyện một mô hình **ảnh** hoặc **dáng**. Gợi ý nhóm: "che mắt" và "không che", hoặc "tai thỏ" và "không có tai".
3. Xuất (export) mô hình sang Scratch.
4. Làm cho nó làm việc gì đó vui. Trong Scratch, dán địa chỉ mô hình vào ô của khối `use model`, rồi **bấm vào khối đó một lần** để tải mô hình.

Slide không ghi tên nút xuất. Thầy tự xem giao diện thật và ghi lại: `__________`.

Câu thầy hỏi: "Con chọn nhóm nào cho máy phân biệt? Dùng ảnh hay dùng dáng?" và "Dự án này dành cho ai? Họ thấy vui hay hữu ích không?"

### Chốt bài (5 phút)
1. Hỏi lại: "Máy có hiểu chuyển động như mình không?" (Không hiểu, nhưng học được quy luật.)
2. Hỏi: "Khi làm máy nhìn người, mình phải nhớ điều gì?" (Hỏi: máy này giúp ai, ai có thể lo? Và không lưu ảnh của bạn.)
3. Cho bé tự nói một câu: "Hôm nay con dạy máy tính ..."
4. Nhắc: bài này tính vào 26 hoạt động trên Plearn. Bé vẫn phải tự bấm hoàn thành ở <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62977>.

## Chương trình mẫu
Bài này **không có chương trình C++**. Dưới đây là các chương trình Scratch trong slide, viết dạng khối tiếng Việt kèm khối gốc. Chỗ nào slide không đọc rõ có ghi chú.

**1. Nhân vật chạy lung tung (Day 3, slide 17)**
- Khi bấm cờ xanh
  - Lặp mãi mãi
    - Lướt 1 giây tới vị trí ngẫu nhiên

```
when [green flag] clicked
forever
    glide (1) secs to (random position)
```

**2. Nhân vật theo chuột (Day 3, slide 18)**
- Khi bấm cờ xanh
  - Lặp mãi mãi
    - Lướt 1 giây tới con trỏ chuột

```
when [green flag] clicked
forever
    glide (1) secs to (mouse-pointer)
```

**3. Theo vai trái (Day 3, slide 21)** — slide chỉ cho thấy khối `go to (left shoulder)` và nhân vật nói "Hi friend!". Thầy ghép trong `Lặp mãi mãi` (cách ghép này là gợi ý của giáo án, vì slide chỉ thấy khối đơn).
- Khi bấm cờ xanh
  - Lặp mãi mãi
    - Đi tới vai trái

```
when [green flag] clicked
forever
    go to (left shoulder)
```

**4. Theo ngón cái (Day 3, slide 24)**
- Khi bấm cờ xanh
  - Nói "That's a thumbs up from me!"
  - Lặp mãi mãi
    - Đi tới đầu ngón cái

```
when [green flag] clicked
say (That's a thumbs up from me!)
forever
    go to (thumb) (tip)
```

**5. Biểu cảm khuôn mặt (Day 3, slide 26)**
- Khi thấy cười
  - Đổi trang phục thành "ecstatic"
  - Nói "Yay!"
- Khi thấy nhíu mày
  - Đổi trang phục thành "angry"
  - Nói "Grrrr..."

```
when (smile) detected
switch costume to (ecstatic)
say (Yay!)

when (eyebrow furrow) detected
switch costume to (angry)
say (Grrrr...)
```

**6. Tai thỏ (Day 4, slide 04)** — mã mô hình trên ảnh đọc mờ ("NeWr1eyPR", không chắc).
- Khi bấm cờ xanh
  - Lặp mãi mãi
    - Nếu mô hình đoán là "Bunny-ears" thì
      - Trang phục kế
      - Đi 10 bước
      - Chạm mép thì bật lại
    - Không thì
      - Đổi trang phục thành "rabbit-d"

```
when [green flag] clicked
forever
    if <model (...) prediction = (Bunny-ears)> then
        next costume
        move (10) steps
        if on edge, bounce
    else
        switch costume to (rabbit-d)
```

**7. Dog Hide (Day 4, slide 08)** — đáy mã bị cắt trên slide. Số bước của `move` không đọc được; slide 05 cho thấy `move (2) steps`.
- Khi bấm cờ xanh
  - Dùng mô hình (dán địa chỉ mô hình)
- Khi bấm cờ xanh
  - Nói ""
  - Đi tới x: -183, y: -106
  - Lặp lại cho tới khi vị trí x > 168
    - Đổi trang phục thành "dot-forward"
    - Nếu đoán là "Class 1" thì
      - Đổi trang phục thành "dot-away"
      - Đi (?) bước

```
when [green flag] clicked
use model (Enter Model URL Here!)

when [green flag] clicked
say ()
go to x: (-183) y: (-106)
repeat until <(x position) > (168)>
    switch costume to (dot-forward)
    if <(prediction) is (Class 1)> then
        switch costume to (dot-away)
        move (?) steps
```

Ghi chú trên slide: (1) tự dạy mô hình rồi dán địa chỉ vào khối `use model` và bấm khối đó; (2) khi mô hình tải xong, chọn nhóm nào thì chó sẽ trốn.

**8. Snake Game (Day 4, slide 10).** Chỉ cho xem. Nửa dưới mã bị cắt. Điều chắc chắn: cần **4 nhóm** huấn luyện: lên, xuống, trái, phải; trong khối `run game` rắn đi 5 bước mỗi lần, bút vẽ kích thước 25.

### Bảng "Ai vui, ai lo?" mẫu

Hai bảng dưới đọc từ ảnh trên slide 18 và 20 (Day 4). Số mặt người to/nhỏ trong ảnh là mức quan tâm. Ký hiệu: **●** quan tâm nhiều, **○** quan tâm ít, **–** ô trống. **Một số ô đọc từ ảnh nhỏ, có thể lệch.** Hàng "Bác sĩ" ở bảng 1 nên thầy xem lại slide gốc trước khi dạy.

**Máy phát hiện tay chạm mặt (slide 18)**

| Người liên quan | Muốn bé khỏe mạnh | Cần đi làm được | Không muốn tự bị ốm |
|---|---|---|---|
| Bố mẹ (Parents) | ● | ● | ● |
| Bác sĩ (Doctors) | – | ● | ○ |
| Thầy cô (Teachers) | ● | ● | ● |

**Máy chỉ thùng rác tái chế (slide 20)**

| Người liên quan | Giảm chi phí | Bền vững | Ảnh hưởng môi trường |
|---|---|---|---|
| Thành phố trả tiền tái chế | ● | ○ | ○ |
| Công ty mua vật liệu tái chế | ● | ● | – |
| Thế hệ mai sau | – | – | ● |

Hàng "Thế hệ mai sau" bị cắt đáy ảnh trên slide, nhưng cả ba ô vẫn thấy.

## Phiếu ôn luyện

**Bài 1. Dịch nhãn** (dễ)
**Đề:** Nối nhãn tiếng Anh với tiếng Việt.
a) `forever` b) `when green flag clicked` c) `go to (left shoulder)` d) `when (smile) detected` e) `say (Yay!)`
1) Khi thấy cười 2) Nói "Yay!" 3) Lặp mãi mãi 4) Đi tới vai trái 5) Khi bấm cờ xanh

**Đáp án:** a-3, b-5, c-4, d-1, e-2.

**Bài 2. Đọc đoán kết quả**
**Đề:** Chương trình sau chạy thì nhân vật làm gì?
```
when [green flag] clicked
say (That's a thumbs up from me!)
forever
    go to (thumb) (tip)
```
Bé giơ ngón cái lên rồi di chuyển bàn tay sang phải.

**Đáp án:** Nhân vật nói "That's a thumbs up from me!" **một lần**, rồi cứ bám theo đầu ngón cái. Bàn tay sang phải thì nhân vật cũng sang phải, vì khối `go to` nằm trong `forever` nên lặp mãi.

**Bài 3. Đọc đoán kết quả**
**Đề:** Với hai khối sau, bé cười thì gì xảy ra? Bé nhíu mày thì gì xảy ra?
```
when (smile) detected
switch costume to (ecstatic)
say (Yay!)

when (eyebrow furrow) detected
switch costume to (angry)
say (Grrrr...)
```

**Đáp án:** Cười: nhân vật đổi sang hình "ecstatic" và nói "Yay!". Nhíu mày: đổi sang hình "angry" và nói "Grrrr...".

**Bài 4. Tìm lỗi**
**Đề:** Bé muốn nhân vật bám theo vai trái, nhưng chạy xong chỉ thấy nhân vật nhảy tới vai một lần rồi đứng yên dù bé đi chỗ khác.
```
when [green flag] clicked
go to (left shoulder)
```
Sai ở đâu? Sửa thế nào?

**Đáp án:** Thiếu `forever`. Khối `go to` chỉ chạy một lần. Sửa: đặt `go to (left shoulder)` vào trong `forever`.

**Bài 5. Tìm lỗi**
**Đề:** Bé tự dạy mô hình trên Máy học được dạy, ghép chương trình có khối `if <prediction is (Class 1)>` nhưng máy không phản ứng gì. Bé có thể đã quên hai việc với khối `use model`. Nêu cả hai.

**Đáp án:** (1) Chưa dán địa chỉ mô hình vào khối `use model`. (2) Chưa bấm vào khối đó để tải mô hình. Slide ghi: "Put the link to your model in this block and click it!" Sau khi mô hình tải xong, còn phải chọn nhóm (class) mình muốn nhân vật phản ứng.

**Bài 6. Sắp thứ tự**
**Đề:** Sắp 4 bước làm mô hình riêng cho đúng thứ tự:
(A) Xuất mô hình sang Scratch (B) Làm cho nó làm việc gì đó vui (C) Mở trang `teachablemachine.withgoogle.com/train` (D) Huấn luyện mô hình ảnh hoặc dáng

**Đáp án:** C → D → A → B.

**Bài 7. Điền số**
**Đề:** a) Trò Snake Game điều khiển rắn bằng mô hình tự dạy. Cần huấn luyện bao nhiêu nhóm? Là những nhóm nào? b) Chương trình `Lặp mãi mãi: Lướt 1 giây tới vị trí ngẫu nhiên` chạy 10 giây thì nhân vật lướt bao nhiêu lần?

**Đáp án:** a) **4** nhóm: lên, xuống, trái, phải (vì rắn đi được 4 hướng). b) **10** lần, vì mỗi lần lướt mất 1 giây.

**Bài 8. Đọc bảng "Ai vui, ai lo?"**
**Đề:** Nhìn bảng máy phát hiện tay chạm mặt ở trên. Hàng nào có cả ba ô đều "quan tâm nhiều"? Vì sao bố mẹ lại quan tâm cả ba điều?

**Đáp án:** Hàng **Bố mẹ** và hàng **Thầy cô**. Gợi ý cho "vì sao": bố mẹ muốn con khỏe, cần đi làm được, và cũng không muốn tự bị ốm. (Bé nói lý do của mình cũng được, miễn hợp lý.)

**Bài 9. Làm trên máy** (khó)
**Đề:** Trong Scratch có Body Sensing, ghép chương trình để nhân vật nói "Hi friend!" một lần rồi đứng đúng vai trái của bé suốt lúc chạy. Viết lại chương trình bằng chữ để thầy kiểm.

**Đáp án (một cách đúng):**
```
when [green flag] clicked
say (Hi friend!)
forever
    go to (left shoulder)
```
Kiểm trên máy: bấm cờ xanh, bé di chuyển, nhân vật phải đi theo vai trái. (Lời "Hi friend!" thấy trên slide 21. Cách ghép `say` trước `forever` theo mẫu slide 24.)

**Bài 10. Nghĩ thêm** (mở)
**Đề:** Nghĩ một máy AI trong đời sống (cái cửa tự mở, camera ở cổng trường, loa nghe lệnh...). Vẽ bảng "Ai vui, ai lo?" cho nó: ít nhất 2 hàng người, 2 cột điều quan tâm.

**Đáp án:** Không có đáp án duy nhất. Đạt khi: hàng là **người** thật sự bị ảnh hưởng, cột là **điều họ quan tâm**, và bé giải thích được một ô.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc **không có** câu trắc nghiệm (CYU/Quiz) ở bài này. Chỉ có câu thảo luận trên slide, không đánh dấu đáp án đúng/sai, trừ câu 3 có đáp án ở slide 14 (Day 3):

1. *What do humans use motion for?* — Con người dùng chuyển động để làm gì? (Đi lại, thể thao, nghệ thuật, giao tiếp; slide 07–10.)
2. *Can AI move? How is it different from how we move?* — AI có di chuyển được không? Khác mình thế nào? (Không có đáp án trên slide.)
3. *Can AI understand our movement? What do you think?* — AI có hiểu chuyển động của mình không? **Đáp án slide 14:** *"AI doesn't understand movement like you or I do, but it can be trained to extract patterns from our movement and respond to it."* — AI không hiểu chuyển động như mình, nhưng có thể được huấn luyện để rút ra quy luật từ chuyển động và phản ứng lại.
4. *What does your project understand about its users?* — Dự án của con hiểu gì về người dùng?
5. *Who does it impact? What are some potential ethical concerns?* — Nó ảnh hưởng tới ai? Có điều gì đáng lo về đạo đức?
6. *What kind of data did you use for this project? What other data could you use?* — Con dùng loại dữ liệu nào? Còn dữ liệu nào khác dùng được?
7. *Who is this project for? Would they find it useful or fun? Why?* — Dự án này dành cho ai? Họ thấy hữu ích hay vui không? Vì sao?
8. *Who are the stakeholders of this system?* — Ai là người liên quan của hệ thống này? (hai ví dụ: máy phát hiện tay chạm mặt; máy chỉ thùng rác tái chế. Đáp án ở bảng slide 18 và 20.)

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Không thêm được tiện ích | Bấm nút xanh nhưng không thấy Body Sensing | Kiểm tra bản Scratch đang dùng; dùng máy đã thử trước (xem "Việc thầy làm trước buổi học") |
| Trình duyệt chặn camera | Nhân vật đứng yên, không theo | Bấm biểu tượng camera cạnh thanh địa chỉ, chọn cho phép, tải lại trang |
| Nhân vật chỉ nhảy một lần | Đứng yên sau khi tới vai | Hỏi: "Khối này đang nằm trong `Lặp mãi mãi` chưa?" |
| Nhầm khối Hand và Body | Muốn theo ngón tay nhưng dùng khối vai | Hỏi: "Khối này thuộc bộ nào, cơ thể hay bàn tay?" |
| Chữ tiếng Anh quá khó | Bé đứng im, không dám đọc | Cho xem hình trước, nói nghĩa tiếng Việt, rồi mới chỉ chữ |
| Không hiểu ma trận | Bé điền bừa hoặc bỏ trống | Đổi thành "ai vui, ai lo?", vẽ mặt cười / mặt lo, bắt đầu từ một hàng thôi |
| Ngại bị quay mặt | Bé che camera, né | Nhắc lại: không lưu, không đưa lên mạng; cho bé dùng Phần A bằng chuột nếu không muốn bật camera |
| Dự án Snake Game quá dài | Bé cố hiểu từng khối | Chỉ cho xem trò chơi chạy; nói "đây là ví dụ lớn, hôm nay mình không làm" |
| Mô hình tự dạy đoán sai | Máy hay nhầm hai nhóm | Hỏi: "Con có cho máy xem đủ ví dụ, ở nhiều góc, cho cả hai nhóm chưa?" |

## Ghi chú về bản gốc
- **Bài này không đúng khuôn của khóa.** Giáo trình tổng §3 nói mỗi bài có 4–5 chương Engage → Learn → Resolve → Growth. Bài 9 gốc có 3 phần (Day 3, Day 4, Day 5), là bộ slide "Dancing with AI" mẫu Slidesgo, không phải khuôn của khóa Synapse City.
- **Không có URL Scratch.** Slide không ghi địa chỉ Scratch có tiện ích. Chỉ ghi URL của Máy học được dạy và hai dự án mẫu tinyurl.
- **Tên nút xuất mô hình sang Scratch không có trên slide.**
- **Day 4 slide 02 nhắc lại "Day 1 và Day 2"**: học về dự án AI tương tác, cách dùng Máy học được dạy, và sự khác nhau giữa dùng ảnh và dùng dáng. Trong khóa tiếng Việt, Bài 6 dạy phân loại ảnh; nội dung "ảnh và dáng" **có thể chưa được dạy ở bài nào**. Thầy tự bù một câu ngắn khi cần.
- **Slide Day 3 số 16 nhắc "Project Bazaar"**, một sự kiện không có trong khóa này. Bỏ qua khi dạy.
- **Chỗ ảnh nhỏ hoặc mờ chưa đọc chắc:** mã mô hình trên Day 4 slide 04 ("NeWr1eyPR"); mã Shy Dog (slide 05); số bước `move` ở slide 08 (bị cắt đáy); nửa dưới mã Snake Game (slide 10); hai mẫu dự án Day 5 slide 02 (một đoạn JavaScript bị che giữa dòng); hàng "Bác sĩ" ở bảng slide 18.
- **Số liệu so với giáo trình tổng:** bài này không dùng số liệu nào trong §6. Số slide 59 khớp bảng §3. Không thấy mâu thuẫn số liệu.
- **Việc cần xác nhận với giáo trình tổng §7:** buổi 11 ghi cột mốc "Xong phần AI, đủ điều kiện chứng chỉ". Các slide Day 5 (dự án cuối khóa, trình bày) có phải bắt buộc để Plearn ghi hoàn thành hay không, file bóc tách không nói. Thầy kiểm lại trên Plearn.
