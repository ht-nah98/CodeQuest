# Bài 5 — Dữ liệu là gì?

> **Hạng Creator không bắt buộc dùng AI khi thi, nhưng bắt buộc làm phần AI để lấy chứng chỉ khóa học.** Dạy đủ, không cần luyện sâu (giáo trình tổng §2).

> Bài gốc: *What is Data?* · 50 slide · 4 chương (Engage 15, Learn 5, Resolve 10, Growth 20) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62105>

Bài này là bài AI nhập môn. **Không có robot Leanbot, không có khối lệnh, không có code.** Bé chỉ nghe, trả lời, chơi trò Bingo và vẽ robot.

## Bé học xong thì làm được gì
- Nói được AI là "máy tính có bộ não": tự học và tự đoán.
- Kể được ít nhất 3 chỗ có AI quanh mình (gợi ý video, tai thỏ trên ảnh, loa thông minh, robot hút bụi, mở khóa bằng mặt, bản đồ, Google Translate).
- Nói được dữ liệu là gì (ảnh, âm thanh, chữ) và vì sao gọi là "thức ăn của AI".
- Chỉ ra được 4 kiểu dữ liệu xấu (mờ, tối, lẫn người lạ, gán nhãn sai) và nêu 2 bí quyết dữ liệu tốt (đa dạng, nhiều).
- Đọc thuộc công thức: **Ảnh rõ + Nhiều kiểu + Tên đúng = AI thông minh**.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Máy tính có Chrome, vào được Plearn | Bé đăng nhập sẵn. Hoạt động: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62105> |
| Phiếu Bingo 3×3, số trong khoảng 1–30 | **Thầy tự chuẩn bị.** Slide chỉ cho hàng 1: 1, 11, 26; hàng 2: 9, 20, 22; hàng 3: 4, 12, 29. Slide không nói số nào ứng với hình nào. |
| Giấy A4 và bút màu | Cho hoạt động vẽ robot (slide ghi 10 phút) |
| Giấy ô vuông (đề xuất của thầy, không có trên slide) | Để bé tô ô vuông cho thấy "ảnh là con số" |
| Không cần robot Leanbot | |

## Thuật ngữ của bài
| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| AI (Artificial Intelligence) | Trí tuệ nhân tạo (AI) | Máy tính có "bộ não": tự học và tự đoán. |
| Normal computer | Máy tính thường | Phải chờ con bấm nút mới chạy. |
| Data | Dữ liệu | Ảnh, âm thanh, chữ. Là thức ăn của AI. |
| Recommend | Gợi ý | AI nhớ con thích gì rồi cho xem thêm. |
| Pixel ("Tiny squares and numbers") | Điểm ảnh | Ảnh gồm nhiều ô vuông nhỏ. AI chỉ thấy số. |
| Facial Recognition | Nhận diện khuôn mặt | Điện thoại nhìn mặt rồi tự mở khóa. |
| Bias (= Underfitting, "Learning too little") | Thiên lệch (học quá ít) | Chỉ thấy một kiểu nên cứ lặp lại như vẹt. Không cần dạy chữ Underfitting. |
| Diversity | Đa dạng | Cho AI xem nhiều kiểu khác nhau. |
| Quantity | Số lượng | Càng nhiều ảnh, AI càng giỏi. |
| Blurry | Ảnh mờ | Ảnh rung, mờ thì AI không thấy mắt, mũi, tai. |
| Wrong Label | Gán nhãn sai | Ảnh mèo mà ghi "chó" thì AI học sai. |
| Garbage In = Garbage Out | Cho học dữ liệu dở thì trả lời dở | Học bài sai thì làm bài sai. |
| Re-Train / TRAIN MODEL | Dạy lại / bấm "Huấn luyện" | Thêm ảnh đúng rồi dạy lại. Như chữa bài tập. |
| Model | Mô hình | Bộ não AI sau khi học xong. Slide không giải thích, thầy nói thêm một câu. |

## Công cụ dùng trong bài
| Công cụ | Địa chỉ | Dùng để làm gì |
|---|---|---|
| Trang học PLearn | <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62105> | Xem 50 slide và làm 5 câu quiz |
| Giấy bút màu | | Vẽ robot, đặt tên robot, tô ô vuông |
| Phiếu Bingo | Thầy tự chuẩn bị | Trò "Thám tử AI" |

Slide **không** đưa công cụ ngoài nào và **không** có thao tác trên Teachable Machine. Slide Growth 16 nhắc nút "TRAIN MODEL" nhưng bài này không có chỗ nào để bấm. Nút đó (rất có thể là của Teachable Machine) bé sẽ gặp ở Bài 6. Nếu bé hỏi, thầy trả lời: "Nút đó ở bài sau, mình sẽ bấm thật."

## Dạy thế nào
Thời lượng gợi ý: khoảng 45 phút (nửa đầu buổi 9; nửa sau là Bài 6).

### Mở bài (5 phút)
1. Thầy hỏi: "Con có thấy cái gì trong nhà mà tự biết con thích gì không?" Cho 2–3 bé trả lời tự do.
2. Thầy nói: "Hôm nay mình làm quen một người bạn mới. Bạn ấy tên là AI."
3. Mở slide Engage 00–01 trên Plearn: robot ngực ghi "AI" vẫy tay.

### Giảng (25 phút)
**Phần 1. AI là gì (Engage 01–03), 5 phút.**
1. Thầy hỏi: "Máy tính ở nhà có tự mở YouTube không?" Bé thường trả lời "không, phải bấm". Thầy chốt: máy tính thường chờ con bấm.
2. Thầy nói: "AI là máy tính có bộ não. Nó tự học và tự đoán." Chỉ chữ BRAIN màu đỏ trên slide 03.
3. Lưu ý: nhiều bé biết hẹn giờ tự chạy. Thầy đáp: "Hẹn giờ là con đã dặn trước. AI thì tự đoán, không ai dặn."

**Phần 2. AI ở đâu (Engage 04–07, 11–12), 6 phút.**
1. Netflix: "Ai chọn phim hoạt hình cho con?" Bé trả lời: AI.
2. Khủng long: con xem khủng long thì AI cho xem thêm khủng long. Đây là **gợi ý**.
3. Tai thỏ: "AI nhìn mặt con rồi gắn tai đúng chỗ."
4. Loa thông minh: "Hey Google, play Baby Shark." AI nghe và làm theo.
5. Robot hút bụi tránh tường; học tiếng Anh, AI nghe con nói và chấm phát âm (slide 11–12).
6. Mỗi ví dụ thầy hỏi: "Con có thấy cái này ở nhà chưa?"

**Phần 3. AI học thế nào, dữ liệu là gì (Engage 08–10), 6 phút.**
1. Slide 08: em bé học bằng thẻ hình, mẹ chỉ "đây là con mèo". AI cũng vậy, nhưng học bằng thật nhiều ảnh.
2. Slide 09: "Dữ liệu là thức ăn của AI. Dữ liệu là ảnh, âm thanh và chữ."
3. Slide 10: con thấy một chú chó dễ thương, AI thấy ô vuông nhỏ và con số. Thầy làm thử trên giấy ô vuông: tô vài ô thành chữ hoặc hình đơn giản, rồi nói "Máy chỉ thấy ô nào tô, ô nào không."
4. Cảnh báo cho thầy: chữ trên slide 10 nói "dog" nhưng hình lại là mèo. Thầy nói trước để bé khỏi rối.
5. Slide 13: AI chưa biết ăn cơm, chưa biết yêu thương như người. Slide 14: AI là bạn tốt nhưng cần người dạy.

**Phần 4. Trò "Thám tử AI" (Learn 00–04), 4 phút.**
1. Phát phiếu Bingo. Thầy đọc từng gợi ý: mở khóa điện thoại bằng mặt, bản đồ tránh kẹt xe, Google Translate dịch "Hello" ra "Xin chào".
2. Bé nào thấy AI trong lớp hoặc ở nhà thì giơ tay.
3. Slide Learn 04 "BINGO!": "AI ở khắp nơi quanh mình."

**Phần 5. Dạy robot cho tốt (Growth 04–19), xem ở mục "Bé tự làm" và "Các bước làm mẫu".**

### Bé tự làm (10 phút)
1. **Quiz Plearn (5 câu).** Bé tự làm trên Plearn, thầy đi quanh xem. Đáp án nằm ở mục "Câu hỏi kiểm tra của khóa gốc".
2. **Vẽ robot (Growth 00–03).** Slide ghi 10 phút. Nếu hết giờ, cho bé vẽ ở nhà. Bé vẽ robot và đặt tên robot, gợi ý: làm bài tập, dọn đồ chơi, nấu cơm. Ai muốn thì giới thiệu: "Robot của con tên là…".

### Chốt bài (5 phút)
1. Thầy chỉ công thức trên slide Growth 18 và cho cả lớp đọc: **Ảnh rõ + Nhiều kiểu + Tên đúng = AI thông minh.**
2. Thầy hỏi: "Robot học sai thì sửa thế nào?" Bé trả lời: thêm ảnh đúng rồi dạy lại.
3. Báo bài sau (Growth 19): dạy robot phân biệt chó và mèo.

## Các bước làm mẫu
Bài này không có chương trình mẫu. Đây là hai hoạt động thầy làm mẫu trước lớp. Phần chuyện "robot bị bệnh" bám theo slide Growth 04–16.

**Mẫu 1. Chuyện "Robot không nhận ra quả táo đỏ" (Growth 04–06, 16).**
1. Robot thấy quả táo đỏ nhưng lắc đầu: "Đây không phải táo!"
2. Thầy hỏi: "Vì sao?" Cho bé đoán.
3. Lật lại: robot chỉ được xem **táo xanh**. Robot nghĩ: "Không xanh thì không phải táo."
4. Đây gọi là **thiên lệch**: học quá ít nên cứ lặp lại như con vẹt.
5. Cách sửa: (a) tìm thêm **nhiều ảnh táo đúng**, gồm cả táo đỏ, (b) bấm **TRAIN MODEL** để dạy lại. Slide ví như "chữa bài tập".

**Mẫu 2. Bốn kiểu dữ liệu xấu (Growth 10–13).** Thầy đưa từng ví dụ, bé nói AI sẽ bị sao:
1. Ảnh **mờ**: AI không thấy mắt, mũi, tai nên đoán sai.
2. Ảnh **tối**: các điểm ảnh đều đen, AI không thấy gì.
3. Có **người lạ** chen vào: dạy máy mặt con mà bạn chạy phía sau, máy không biết ai là con.
4. **Gán nhãn sai**: ảnh mèo ghi "chó", AI học sai.

Thêm hai câu chuyện vui (Growth 14–15): chó Komondor lông xù bị nhầm với cây lau nhà; chú chó Chihuahua và bánh muffin việt quất nhìn rất giống nhau, người lớn cũng nhầm.

Mẹo (Growth 17): chụp ảnh ở chỗ sáng, quay mặt ra cửa sổ hoặc bật đèn. Ánh sáng rõ thì điểm ảnh rõ, robot mới thông minh.

## Phiếu ôn luyện
Đề dùng chữ, không cần ảnh in sẵn. Thầy đọc đề hoặc phát phiếu.

**Bài 1. Nhìn và đoán: AI hay không phải AI?** (dễ)
**Đề.** Trong các thứ sau, thứ nào dùng AI? Robot hút bụi / Chổi rơm / Loa thông minh / Xe đạp / Bản đồ chỉ đường / Hòn đá.

**Đáp án.** Robot hút bụi, loa thông minh, bản đồ chỉ đường.

**Bài 2. Nhìn dữ liệu đoán AI sẽ trả lời gì.** (dễ)
**Đề.** Con xem rất nhiều video khủng long trên YouTube. Lần sau mở YouTube, AI sẽ gợi ý gì? Vì sao?

**Đáp án.** Thêm video khủng long, vì AI nhớ con thích gì.

**Bài 3. Nhìn dữ liệu đoán AI sẽ trả lời gì (khó hơn).** (vừa)
**Đề.** Một robot chỉ được xem toàn ảnh **táo xanh**. Đưa cho nó quả táo đỏ, nó sẽ nói gì? Cần làm gì để robot nhận ra táo đỏ?

**Đáp án.** Nó nói "Đây không phải táo". Phải cho nó xem thêm ảnh táo đỏ (và nhiều kiểu khác) rồi dạy lại.

**Bài 4. Chọn dữ liệu tốt / xấu.** (vừa)
**Đề.** Bốn ảnh mèo: (A) rõ nét, (B) mờ, (C) tối đen, (D) có một bạn lạ chen vào sau lưng. Ảnh nào là dữ liệu **tốt**? Mỗi ảnh còn lại hỏng vì sao?

**Đáp án.** Chỉ ảnh A tốt. B hỏng vì mờ, C vì tối đen, D vì có người lạ.

**Bài 5. Tìm lỗi: sửa nhãn.** (vừa)
**Đề.** Bốn ảnh có nhãn: "mèo", "mèo", "chó", "chó". Ảnh thứ ba thực ra là ảnh mèo. Sai ở đâu? Sửa thế nào? Nếu để nguyên, AI sẽ học ra sao?

**Đáp án.** Ảnh thứ ba bị gán nhãn sai. Đổi nhãn thành "mèo". Nếu để nguyên, AI học sai (học bài sai thì làm bài sai).

**Bài 6. Sắp thứ tự: sửa robot bị nhầm.** (vừa)
Xếp lại cho đúng:
(a) Bấm TRAIN MODEL dạy lại (b) Robot đoán sai (c) Tìm thêm nhiều ảnh đúng (d) Robot đoán đúng.

**Đáp án.** (b) → (c) → (a) → (d).

**Bài 7. Chọn dữ liệu tốt / xấu (điền công thức).** (khó)
**Đề.** Điền: "Ảnh ___ + Nhiều ___ + Tên ___ = AI thông minh".

**Đáp án.** rõ / kiểu / đúng. Giải thích: ảnh rõ thì điểm ảnh rõ; nhiều kiểu để không thiên lệch; tên đúng để không gán nhãn sai.

**Bài 8. Dịch thuật ngữ Anh–Việt.** (vừa)
**Đề.** Nối: Data, Recommend, Blurry, Wrong Label, Diversity, Quantity, Re-Train, Pixel với: gợi ý / ảnh mờ / điểm ảnh / dạy lại / dữ liệu / đa dạng / số lượng / gán nhãn sai.

**Đáp án.** Data = dữ liệu; Recommend = gợi ý; Blurry = ảnh mờ; Wrong Label = gán nhãn sai; Diversity = đa dạng; Quantity = số lượng; Re-Train = dạy lại; Pixel = điểm ảnh.

**Bài 9. Làm trên máy.** (khó, bài do thầy đặt, không có trong slide)
**Đề.** Vào Plearn, mở lại hoạt động Bài 5, làm lại 5 câu quiz và **đọc to đáp án bằng tiếng Việt**. Sau đó chọn một câu và kể cho bạn vì sao đáp án đó đúng.

**Đáp án.** Bé làm đúng 5 câu theo mục "Câu hỏi kiểm tra của khóa gốc" và giải thích được bằng lời của mình.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc có 5 câu. Đáp án đúng là ô có dấu tích xanh trên slide.

1. *What is AI? Choose the right picture!* A. A Stone / B. A Bicycle / C. Smart Computer! → **C**. (AI là gì? Chọn hình đúng. A. Hòn đá / B. Xe đạp / C. Máy tính thông minh.)
2. *Which one USES AI?* A. Robot Vacuum / B. Straw Broom → **A**. (Cái nào dùng AI? A. Robot hút bụi / B. Chổi rơm.)
3. *AI is hungry! What do we feed it?* A. Pizza / B. Data (Images, Sound) → **B**. (AI đói rồi! Cho nó ăn gì? A. Pizza / B. Dữ liệu: ảnh, âm thanh.)
4. *How does YouTube suggest videos for you?* A. Guessing randomly / B. Seeing what you liked before → **B**. (YouTube gợi ý video bằng cách nào? A. Đoán bừa / B. Xem con thích gì trước đó.)
5. *Does AI have emotions (happy, sad) like humans?* A. Yes, AI can express their emotion like humans / B. No, AI is just a machine. (For now!) → **B**. (AI có cảm xúc vui buồn như người không? A. Có / B. Không, AI chỉ là máy. Hiện giờ thì vậy.)

Lưu ý cho thầy ở câu 5: chữ "For now!" dễ khiến bé nghĩ sau này AI sẽ có cảm xúc. Thầy giải thích: AI chỉ biết bắt chước, không thật sự vui hay buồn.

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Tiếng Anh dài và khó (recommend, recognition, diversity, quantity, blurry, garbage) | Bé im lặng, đọc lướt slide | Dịch từng ý sang tiếng Việt ngắn, dùng đúng bảng thuật ngữ, chỉ vào hình |
| "Thiên lệch" trừu tượng | Bé hỏi "bias là gì" | Chỉ dùng hình con vẹt và táo xanh. Bỏ chữ Underfitting |
| "Garbage In = Garbage Out" | Bé cười hoặc không hiểu | Đổi thành "học bài sai thì làm bài sai" |
| Điểm ảnh | Bé không hình dung được | Cho tô ô vuông trên giấy ô vuông |
| Nút TRAIN MODEL | Bé hỏi nút ở đâu | Nói: nút này ở bài sau, mình sẽ bấm thật |
| Bingo | Thầy không biết số nào ứng hình nào | Slide không nói rõ, thầy tự chuẩn bị phiếu trước |
| Chữ "dog" nhưng hình là mèo (Engage 10) | Bé cãi "đây là mèo" | Thầy nói trước, đây là lỗi của slide |
| Giọng hơi dọa ("Robot bị bệnh", "Teacher is lying") | Bé lo | Nói nhẹ nhàng: "Robot chưa được xem đủ ảnh", không nói thầy cô nói dối |
| Quiz 5 "For now!" | Bé tin AI sẽ có cảm xúc | Giải thích AI chỉ bắt chước |

## Ghi chú về bản gốc
- Slide Engage 10 ghi "A cute dog" nhưng hình minh họa là lưới ảnh mèo.
- Slide Engage 01 và Growth 12: chữ bị đè lên nhau trong ảnh gốc.
- Slide Growth 04 và 13 có giọng hơi tiêu cực ("Is the Robot Sick?", "Teacher is lying?").
- Phiếu Bingo (Learn 00) không có trong 50 slide; slide không nói ô số ứng với hình nào.
- "TRAIN MODEL" (Growth 16) xuất hiện nhưng bài này không có công cụ nào để bấm. Việc đó là nút của Teachable Machine chỉ là suy đoán của người bóc tách, chưa kiểm chứng.
- Mâu thuẫn với giáo trình tổng: **không thấy.** Số slide (50) khớp bảng §3. Giáo trình tổng §6 không có con số nào dành cho bài AI.
