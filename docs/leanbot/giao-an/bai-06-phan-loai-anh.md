# Bài 6 — Dạy robot phân loại ảnh

> **Hạng Creator không bắt buộc dùng AI khi thi, nhưng bắt buộc làm phần AI để lấy chứng chỉ khóa học.** Dạy đủ, không cần luyện sâu (giáo trình tổng §2).

> Bài gốc: *Image Classification* · 45 slide · 5 chương (Engage 4, Learn 10, Discover 8, Practice 8, Challenge 15) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62109>

Bài này dùng **Teachable Machine**, không dùng robot Leanbot, không có khối Blockly. Bé làm bước đầu của việc dạy máy: tạo 2 nhóm ảnh DOG và CAT, tải ảnh lên, xóa ảnh sai. **Chưa bấm Train.**

## Bé học xong thì làm được gì
- Giải thích "phân loại" là xếp đồ vào đúng "nhà".
- Kể đúng 3 bước dạy máy: Thu thập → Dạy máy → Xem thử.
- Phân biệt được lớp (class), dữ liệu, độ chắc chắn.
- Nêu được dấu hiệu phân biệt chó và mèo (tai, mõm, ria) và 3 mẹo chụp mẫu tốt (ngồi yên, đủ sáng, nhiều góc).
- Tự tạo 2 lớp DOG và CAT trong Teachable Machine, tải ảnh lên và xóa ảnh nằm nhầm nhà.

## Dự án 1: Huấn luyện viên dữ liệu AI
Giáo trình tổng §3: **Dự án 1 "Huấn luyện viên dữ liệu AI" (gốc: *MINI PROJECT 1: The AI Data Trainer*) mở khóa sau Bài 6**; buổi 9 trong lộ trình có cột mốc "Nộp Dự án 1".

**Yêu cầu nộp: chưa lấy được.** 45 slide của Bài 6 **không nhắc** tới Dự án 1 ở chỗ nào. Mối liên hệ này chỉ có trong giáo trình tổng. Vì vậy:
1. Đề bài, cách nộp và tiêu chí chấm của dự án nằm ở trang dự án trên Plearn hoặc Góc học sinh. Thầy phải mở trang đó trước buổi học, chép yêu cầu thật vào đây rồi mới giao cho bé.
2. Cái bé làm được chắc chắn trong bài này, và nhiều khả năng cần cho dự án, là: một dự án ảnh Teachable Machine có 2 lớp, đặt tên đúng, ảnh đã làm sạch, chưa Train. Đó chỉ là suy đoán, không phải yêu cầu đã xác nhận.
3. Giáo trình tổng ghi Bài 6 có "huấn luyện, điểm tin cậy" nhưng slide Bài 6 dừng **trước** bước Train (mục "Ghi chú về bản gốc"). Nếu dự án đòi mô hình đã huấn luyện thì bé phải học thêm từ bài sau ("TRAINING DAY"), chưa thấy trong 45 slide.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Máy tính có Chrome và mạng | Vào được Plearn và Teachable Machine |
| Trang Plearn của bài | <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62109> |
| Thư mục ảnh "DATASET" | **Thầy phải chuẩn bị sẵn.** Slide chỉ ghi "Find the DATASET folder" mà không nói thư mục ở đâu. Nên tách hai thư mục riêng: ảnh chó và ảnh mèo, để bé khỏi chọn nhầm |
| Cỡ bộ ảnh | Slide chỉ nói: "hàng trăm ảnh", **80% mèo, 20% chó**, ảnh mèo nhiều hơn là được. Không có con số bắt buộc |
| Trang dự án trên Plearn / Góc học sinh | Mở sẵn để xem yêu cầu nộp Dự án 1 |
| Không cần webcam, không cần robot | Hôm nay dùng ảnh có sẵn. Bé không phải bật camera |

## Thuật ngữ của bài
| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Classification | Phân loại | Xếp mọi thứ vào đúng "nhà" của nó, như xếp đồ chơi. |
| Class | Nhóm (lớp) ảnh | Tên của một nhóm ảnh, ví dụ "Chó" hoặc "Mèo". Không phải "lớp học". |
| Dataset | Bộ ảnh mẫu ("kho ảnh") | Cả hộp ảnh, gồm hàng trăm tấm. |
| Gather / Input | Thu thập / đầu vào | Đưa thật nhiều ảnh cho máy xem. |
| Train Model | Dạy máy (huấn luyện) | Máy ngồi "suy nghĩ" tìm điểm khác nhau giữa các nhóm. |
| Preview / Test | Xem thử | Thử xem máy đã học được chưa. |
| Confidence Score | Độ chắc chắn | Máy chắc bao nhiêu phần trăm là nó đoán đúng. |
| Pattern | Điểm giống/khác để nhận ra | Dấu hiệu lặp lại giúp máy phân biệt hai nhóm. |
| Data Curation | Chọn lọc ảnh | Chỉ giữ ảnh rõ, đẹp; bỏ ảnh mờ hoặc đen thui. |
| Upload | Tải lên | Đưa file ảnh từ máy tính vào công cụ. |
| Webcam | Camera máy tính | Bài này không dùng. |
| Debugging | Sửa lỗi | Tìm ảnh bỏ nhầm nhà rồi xóa đi. |
| Intruder | Kẻ lạc nhà | Ảnh mèo nằm nhầm trong nhóm chó, hoặc ngược lại. |

Từ "Data" (dữ liệu) đã dạy ở Bài 5, dùng lại đúng cách dịch đó.

## Công cụ dùng trong bài
**Teachable Machine** — <https://teachablemachine.withgoogle.com/> (địa chỉ lấy từ giáo trình tổng §5.3, không có trên slide). Công cụ này tiếng Anh, không có tiếng Việt; bé cần biết trước các nút dưới đây.

| Nút / chỗ trên màn hình | Tiếng Việt | Làm gì |
|---|---|---|
| Image Project | Dự án ảnh | Chọn loại dự án |
| Class 1, Class 2 | Nhóm 1, nhóm 2 | Hai "ngôi nhà" cho ảnh |
| Upload | Tải lên | Đưa ảnh có sẵn vào nhóm |
| File | Từ file | Chọn "File", đừng chọn Google Drive |
| Drop Images Here | Thả ảnh vào đây | Kéo ảnh thả vào ô này |
| Thùng rác | Xóa | Xóa ảnh sai |
| Train Model | Dạy máy | **Hôm nay không bấm** |
| Export Model | Xuất mô hình | Có trên ảnh minh họa, slide không hướng dẫn dùng |

### Các bước thao tác (Challenge 00–04)
1. Mở Teachable Machine.
2. Chọn **Image Project**.
3. Tìm thư mục "DATASET" trên máy (thư mục thầy đã chuẩn bị).
4. Đổi tên **Class 1** thành **DOG**. Bấm **Upload**, chọn **File**, kéo toàn bộ ảnh chó vào.
5. Đổi tên **Class 2** thành **CAT**. Kéo toàn bộ ảnh mèo vào. Ảnh mèo nhiều hơn ảnh chó thì không sao.
6. Kiểm tra lần cuối: cuộn qua danh sách ảnh, tìm "gián điệp": ảnh mèo nằm trong nhóm chó hoặc ngược lại. Thấy thì bấm **thùng rác** để xóa ngay.
7. **Không bấm Train.**

## Dạy thế nào
Thời lượng gợi ý: khoảng 45 phút (nửa sau buổi 9).

### Mở bài (5 phút)
1. Mở slide Engage 00 "Welcome to the AI Lab". Thầy nói: "Bình thường thầy dạy con. Hôm nay con dạy robot."
2. Thầy hỏi: "Con dạy em nhỏ phân biệt chó và mèo bằng cách nào?" Cho bé trả lời. Điều này nối với việc "máy học bằng ví dụ".
3. Nhắc lại Bài 5: dữ liệu là thức ăn của AI.

### Giảng (22 phút)
**Phần 1. Phân loại là gì (Engage 01–03), 4 phút.**
1. Thầy đưa ví dụ xếp đồ chơi: Lego vào hộp Lego, gấu bông vào giỏ gấu bông. "Đó là phân loại."
2. Máy tính không cầm bằng tay được, nên dùng "hộp" trong máy. Hộp đó gọi là **nhóm ảnh (class)**. Dặn bé: ở đây class không phải lớp học.
3. Slide 03: "Teachable Machine là học trò của mình hôm nay. Nó cần con dạy cách nhìn."

**Phần 2. Ba bước thần kỳ (Learn 00–09), 8 phút.**
1. Ba bước: **Thu thập → Dạy máy → Xem thử** (máy ảnh, bộ não, con mắt).
2. Bước 1, thu thập: máy "đói kiến thức", ta cho nhiều ảnh. Những ảnh đó là **dữ liệu**. Một nhóm ảnh có một cái tên, ví dụ "Con" và "Chó của con".
3. Bước 2, dạy máy: máy đang nghĩ. Slide dặn: đừng tắt, chờ vòng tròn quay dừng. Máy so sánh hai nhóm để tìm điểm khác nhau.
4. Bước 3, xem thử: máy đoán và cho một thanh **độ chắc chắn**. 100% là "Tôi biết chắc!". 50% là "Ừm… có thể?".
5. Slide Learn 03 nói chụp bằng webcam, giữ nút để chụp 100 tấm sẽ giúp máy học nhanh hơn. Hôm nay **không dùng webcam**, thầy chỉ lấy ý: càng nhiều ảnh càng tốt.
6. Ba mẹo dạy tốt (Learn 09, nói về chụp mẫu): ngồi yên như tượng, đủ sáng trên mặt, nhiều góc (nghiêng đầu trái, phải).

**Phần 3. Thám tử thú cưng (Discover 00–07), 6 phút.**
1. Nhiệm vụ "Gâu gâu hay Meo meo". Robot mới đến Trái Đất, chưa phân biệt được chó mèo.
2. Hỏi: "Chó mèo giống nhau ở đâu?" Bé nói: 4 chân, có lông, có đuôi, 2 mắt. Rồi hỏi: "Khác nhau ở đâu?"
3. Ba manh mối: **tai** (mèo thường nhọn dựng; chó hay có tai cụp dài), **mõm** (chó mõm dài; mèo mũi nhỏ, phẳng), **ria** (mèo có ria dài, cứng).
4. Lưu ý: đây chỉ là dấu hiệu thường gặp, không tuyệt đối (có chó tai dựng, mèo tai cụp). Thầy nói rõ để bé không tin tuyệt đối.
5. Bộ ảnh mẫu: hàng trăm tấm, 80% mèo, 20% chó. Slide chỉ nói "ảnh mèo nhiều hơn cũng được". **Đừng giảng thêm về vì sao dữ liệu lệch lại hại**, vì không có trong bài và quá khó cho lớp 4.

**Phần 4. Luật làm sạch dữ liệu (Practice 00–01, 05), 4 phút.**
1. **Chọn lọc ảnh:** chỉ giữ ảnh rõ. Ảnh mờ hoặc đen thui thì bỏ.
2. **Không bỏ lẫn nhà:** tuyệt đối không bỏ ảnh mèo vào nhà chó và ngược lại, nếu không robot sẽ rối.
3. Nhắc lại Bài 5: ảnh mờ, tối, nhãn sai đều là dữ liệu xấu.

### Bé tự làm (13 phút)
Mỗi bé một máy. Thầy phát cho bé các bước ở mục "Công cụ dùng trong bài". Thầy đi quanh xem.

1. Bé làm theo 7 bước ở phần **Các bước thao tác**.
2. Bé nào xong sớm: rà lại danh sách ảnh lần nữa, đếm xem nhóm nào nhiều ảnh hơn (mèo nhiều hơn là bình thường).
3. Mọi bé **dừng ở "Data ready"**. Slide Challenge 04 dặn: "Đợi đã! Chưa bấm Train."
4. Nếu còn thời gian, chơi **"Tay nhanh mắt tinh"** (Challenge 10–13): thầy chiếu ảnh. Thấy chó thì vỗ tay một cái. Thấy mèo thì kêu "Meo!". Mức 3 là ảnh đánh lừa (chó Chihuahua lẫn bánh muffin việt quất): **im lặng, không vỗ, không kêu.** Giải thích cho bé: đó là bài học rằng ảnh có thể đánh lừa cả máy lẫn người, không phải để trêu bé.

### Chốt bài (5 phút)
1. Cả lớp nhắc lại 3 bước: Thu thập → Dạy máy → Xem thử. Hôm nay mình mới làm bước 1.
2. Thầy hỏi: "Ảnh sai nhóm thì làm gì?" Bé: xóa ngay.
3. Thầy dặn bài sau là **TRAINING DAY** (Challenge 14), bài tập về nhà (nếu có thú cưng): chụp ảnh thú cưng mang đến lớp.
4. Thầy mở trang Dự án 1, đọc cho bé yêu cầu nộp thật (xem mục "Dự án 1").

## Các bước làm mẫu
Thầy làm mẫu trên màn chiếu, chậm, mỗi bước hỏi bé "tiếp theo bấm gì?".

1. Mở <https://teachablemachine.withgoogle.com/>. Chọn **Image Project**.
2. Hai nhóm hiện sẵn là Class 1 và Class 2. Bấm vào tên Class 1, gõ **DOG**. Bấm vào tên Class 2, gõ **CAT**. (Slide nhắc: DOG là nhà của "Gâu gâu", dùng xương làm biểu tượng; CAT là nhà của "Meo meo", dùng xương cá.)
3. Ở nhóm DOG bấm **Upload**, chọn **File**. Mở thư mục ảnh chó, kéo tất cả vào ô **Drop Images Here**.
4. Ở nhóm CAT làm tương tự với ảnh mèo.
5. Cuộn xuống từng nhóm. Thầy cố ý giả vờ "thấy" một ảnh nằm sai: bấm biểu tượng thùng rác để xóa ngay và đọc to: "Ảnh mèo nằm trong nhà chó. Xóa!"
6. Thầy chỉ nút **Train Model** và nói: "Nút này để bài sau. Hôm nay không bấm."

Trên ảnh minh họa giao diện (Practice 02), ngoài nút Webcam và Upload còn thấy khung Preview có nút "Export Model", thanh phần trăm đầu ra. Slide không hướng dẫn dùng, thầy đừng dạy phần đó hôm nay.

## Phiếu ôn luyện
**Bài 1. Xếp đồ vào nhà.** (dễ nhất)
**Đề.** Xếp 6 thẻ vào hai hộp "Trái cây" và "Rau củ": táo, cà rốt, chuối, củ cải, nho, khoai tây.

**Đáp án.** Trái cây: táo, chuối, nho. Rau củ: cà rốt, củ cải, khoai tây. Mỗi hộp là một "nhóm ảnh" có tên.

**Bài 2. Sắp thứ tự 3 bước.**
**Đề.** Xếp thứ tự: (a) Xem thử (b) Thu thập (c) Dạy máy. Nối mỗi bước với hình: máy ảnh, bộ não, con mắt.

**Đáp án.** (b) Thu thập (máy ảnh) → (c) Dạy máy (bộ não) → (a) Xem thử (con mắt).

**Bài 3. Nhìn dữ liệu đoán AI sẽ trả lời gì.**
**Đề.** Thanh độ chắc chắn của robot hiện: "Mèo 100%", "Chó 50%", "Mèo 20%". Robot chắc chắn nhất ở thanh nào? Thanh nào là "Ừm… có thể?"

**Đáp án.** Chắc nhất: "Mèo 100%". "Chó 50%" là chưa chắc.

**Bài 4. Chọn dữ liệu tốt / xấu.**
**Đề.** Nhóm DOG có 9 ảnh: 2 ảnh mờ, 1 ảnh đen thui, 1 ảnh mèo lọt vào, 5 ảnh còn lại rõ nét. Ảnh nào cần xóa?

**Đáp án.** Xóa 4 ảnh (2 mờ, 1 đen thui, 1 mèo). Giữ 5 ảnh.

**Bài 5. Tìm lỗi.**
**Đề.** Bạn An bỏ một ảnh mèo vào nhóm DOG và bấm Dạy máy. Sai ở đâu? Phải làm gì?

**Đáp án.** Sai: ảnh mèo nằm nhầm nhà ("kẻ lạc nhà"), lại còn đã bấm Train khi chưa kiểm tra. Cách sửa: xóa ảnh bằng thùng rác trước, rồi mới dạy máy. Nếu để nguyên, robot sẽ bị rối.

**Bài 6. Thám tử mõm và tai.**
**Đề.** Đoán chó hay mèo, nêu dấu hiệu: (a) tai nhọn dựng, mũi nhỏ phẳng, ria dài cứng; (b) tai cụp dài, mõm dài.

**Đáp án.** (a) Mèo. (b) Chó. Dấu hiệu thường gặp, không tuyệt đối.

**Bài 7. Dịch thuật ngữ Anh–Việt.**
**Đề.** Dịch: Classification, Class, Upload, Confidence Score, Preview, Intruder.

**Đáp án.** Phân loại; nhóm (lớp) ảnh; tải lên; độ chắc chắn; xem thử; kẻ lạc nhà.

**Bài 8. Làm trên máy: nhóm riêng của em.** (khó nhất, theo đề xuất của người bóc tách)
**Đề.** Tự chọn 2 nhóm mới (ví dụ "Bút" và "Thước"). Tạo hai nhóm trong Teachable Machine, tải ảnh từ thư mục thầy chuẩn bị, rà lại ảnh nhầm. **Chưa bấm Train.**

**Đáp án.** Hai nhóm đúng tên, không có ảnh lẫn nhóm, không có ảnh mờ hoặc đen. Số ảnh tối thiểu (người bóc tách đề xuất khoảng 20 ảnh mỗi nhóm) là con số do người bóc tách đề xuất, không có trên slide; thầy tự quyết.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc có 5 câu ngay trên slide Challenge 05–09. Đáp án đúng là ô có viền xanh và dấu tích **ngay trên slide**, nên bé thấy đáp án trước khi trả lời. Khi làm bài tập, thầy che đáp án đi.

1. *Is this a Dog or a Cat?* (ảnh ba chú chó Pomeranian lông xù) A. It's a fluffy CAT. **B. It's a DOG (Look at the snout!)** ✔ — Đây là chó hay mèo? B: Là chó (nhìn cái mõm!).
2. *Easiest way to spot a Cat?* **A. Pointy Ears & Whiskers** ✔ B. Big Floppy Ears — Cách dễ nhất để nhận ra mèo? A: Tai nhọn và ria.
3. *Wrong photo in the group?* A. Ignore it. **B. Delete it immediately! (Clean Data)** ✔ — Có ảnh sai nhóm thì sao? B: Xóa ngay (dữ liệu sạch).
4. *How did we put photos in today?* A. Webcam. **B. Upload Files** ✔ — Hôm nay ta đưa ảnh vào bằng cách nào? B: Tải file lên.
5. *Why do we need many photos?* **A. Make Robot Learn Better** ✔ B. To fill up memory — Vì sao cần nhiều ảnh? A: Để robot học tốt hơn.

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Nhiều từ tiếng Anh khó (classification, confidence score, data curation, dataset, intruder, debugging, whiskers) | Bé đọc slide mà không hiểu | Dùng đúng bảng thuật ngữ, cho thẻ từ có hình |
| Nhầm "class" của Teachable Machine với "lớp học" | Bé hỏi "lớp nào?" | Nói rõ: nhóm ảnh, không phải lớp học |
| Không tìm thấy thư mục DATASET | Bé không tìm ra ảnh | Thầy chuẩn bị sẵn, tách hai thư mục chó và mèo |
| Nút Upload có nhiều lựa chọn (File / Google Drive) | Bé chọn Google Drive | Chỉ rõ: chọn File |
| Chọn nhầm ảnh vào sai nhóm | Ảnh mèo nằm trong DOG | Cho làm bước kiểm tra cuối, bấm thùng rác |
| Bé muốn bấm Train | Bé bấm Train | Nhắc: hôm nay chưa. Bài sau mới bấm |
| Ảnh minh họa gây nhầm (ảnh giấy cắt xe tải ở Discover 06, ảnh lá cây ở Challenge 00) | Bé tưởng bộ ảnh là xe, lá | Nói trước: đó chỉ là hình trang trí |
| Mức 3 trò chơi (chihuahua và muffin) khó | Bé thấy bị trêu | Giải thích: ảnh đánh lừa được cả máy lẫn người |
| Tin "chó thì tai cụp, mèo thì tai nhọn" là luật tuyệt đối | Bé cãi khi gặp chó tai dựng | Nhắc: chỉ là dấu hiệu thường gặp |
| Quyền riêng tư | Bé muốn chụp mặt bạn bằng webcam | Hôm nay không dùng webcam. Ví dụ "Me vs My Dog" ở Learn 02 chỉ là minh họa |

## Ghi chú về bản gốc
- **Mâu thuẫn với giáo trình tổng:** giáo trình tổng §3 ghi Bài 6 có khái niệm "huấn luyện, điểm tin cậy", nhưng slide Bài 6 **dừng ở bước nạp dữ liệu**; Challenge 04 và Practice 07 ghi "DO NOT PRESS TRAIN YET!". Train, Preview và Export Model thuộc bài sau ("TRAINING DAY"). Giáo án này theo slide: bé chỉ nạp dữ liệu. Phần "độ chắc chắn" mới học trên lý thuyết (Learn 06–07), chưa bấm được.
- Slide **không** nhắc "Mini Project 1 – The AI Data Trainer"; mối liên hệ chỉ có trong giáo trình tổng.
- Slide **không** ghi URL nào; URL Teachable Machine lấy từ giáo trình tổng §5.3.
- Số ảnh: slide chỉ nói "100 ảnh giúp học nhanh hơn" (Learn 03, về webcam), "hàng trăm ảnh", 80% mèo / 20% chó (Discover 06), mèo nhiều hơn chó "That's okay!" (Challenge 02). Không có con số bắt buộc.
- Slide Discover 06 dùng ảnh minh họa không liên quan (giấy cắt xe tải, biển STOP). Challenge 00 dùng ảnh lá cây. Discover 04 có chữ alt lỗi "Dog vs Cat Profile". Discover 05 có hai đoạn chữ cuối bị đè lên nhau. Practice 07: chữ D đầu của "DO NOT PRESS TRAIN YET!" bị che.
- Challenge 11: chữ "CLAP!" nằm giữa hai ảnh nên không rõ ứng với ảnh nào; slide không có đáp án chính thức. Theo luật, chó thì vỗ tay.
- Không có chương trình mẫu hay khối lệnh nào trong bài; không đọc được nội dung ngoài 45 slide.
