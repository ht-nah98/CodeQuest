# Bài 7 — Âm thanh vô hình

> Bài gốc: *Basic Sound Classification* · 45 slide · 5 chương (Engage, Learn, Discover, Apply, Quiz) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62113>

**Lưu ý hạng Creator:** hạng Creator không bắt buộc dùng AI khi thi, nhưng bài AI (Bài 5–9) là bắt buộc để lấy chứng chỉ khóa học. Dạy đủ, không cần luyện sâu.

Bài này là bài AI: **không lập trình robot, không dùng khối Leanbot**, không có chân cắm, góc servo hay ngưỡng cảm biến. Bài này cũng **không thu mẫu nào** cho Teachable Machine; việc thu mẫu nằm ở Bài 8.

## Bé học xong thì làm được gì
- Nói được âm thanh là rung động: sờ loa thấy rung.
- Chỉ ra sóng nào to (sóng cao) và sóng nào bổng (sóng dày) trên hình.
- Kể đúng chuỗi: sóng âm → micro → lấy mẫu → dãy số → ảnh phổ → AI nhận ra.
- Đọc ảnh phổ: ngang là thời gian, dọc là cao thấp, màu là to nhỏ (đỏ là to).
- Nhận ra mẫu hình của vỗ tay (vạch dọc), búng tay (vạch mảnh dồn lên đỉnh), gõ (khối ngắn ở đáy).

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Laptop có micro, trình duyệt Chrome | Trình duyệt sẽ xin quyền dùng micro: bấm cho phép |
| Phòng yên tĩnh | Thí nghiệm nhạy với tiếng ồn |
| Loa nhỏ hoặc loa laptop | Cho thí nghiệm "sờ loa" (Engage 01) |
| Chrome Music Lab, trang Spectrogram | Slide chỉ ghi tên "Chrome Music Lab", **không ghi URL**. Địa chỉ ở dưới là hiểu biết ngoài slide, thầy mở thử trước |
| Ảnh chụp màn hình thật của vỗ tay / búng tay / gõ | Thầy tự thử trước và chụp (xem mục "Bé hay vướng") |
| Lò xo đồ chơi (Slinky) nếu có | Slide Engage 02 bị hỏng ảnh, chỉ còn chữ |
| Giấy, bút | Cho phiếu ôn luyện |

## Thuật ngữ của bài
Chỉ các từ mới. Từ đã có trong §5 giáo trình tổng (Threshold, Test…) dùng đúng cách dịch ở đó.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Sound wave | Sóng âm | Không khí bị đẩy tới lui như lò xo, truyền đến tai mình |
| Vibration | Rung động | Sờ loa là thấy rung |
| Amplitude (Loudness) | Biên độ (độ to) | Sóng càng cao thì tiếng càng to |
| Frequency (Pitch) | Tần số (độ cao thấp của giọng) | Sóng càng sát nhau thì giọng càng bổng |
| Hertz (Hz) | Héc (Hz) | Đơn vị đo tần số |
| Bass / Deep voice | Giọng trầm | Sóng thưa, tiếng thấp, nặng |
| Treble / High voice | Giọng bổng | Sóng dày, tiếng cao, mảnh |
| Microphone (Mic) | Micro | Cái tai của máy: biến tiếng thành số |
| Noise | Nhiễu | Tiếng ồn không cần, làm sóng bị "nguệch ngoạc" |
| Silence | Tiếng im lặng | Im lặng cũng là dữ liệu: robot biết lúc nào không làm gì |
| Sampling | Lấy mẫu | Micro "chụp ảnh" độ cao sóng rất nhiều lần mỗi giây |
| Raw data | Dữ liệu thô | Dãy số dài, rối. Như củ khoai chưa gọt |
| Processed data | Dữ liệu đã xử lý | Gọn, sạch, dùng được. Như khoai chiên |
| Spectrogram | Ảnh phổ âm thanh | Bức tranh của tiếng: ngang là thời gian, dọc là cao thấp, màu là to nhỏ |
| Heatmap | Bản đồ nhiệt | Ảnh dùng màu chỉ mức độ, đỏ là mạnh nhất |
| Echolocation | Định vị bằng tiếng vang | Dơi, cá heo phát tiếng rồi nghe vọng lại để "thấy" trong tối |
| Clap / Snap / Knock | Vỗ tay / Búng tay / Gõ | Ba âm thanh sẽ dạy cho AI ở Bài 8 |

"Wavelength" (bước sóng) chỉ có trong hình ở Engage 04, slide không giải thích bằng chữ. Không bắt bé học.

## Công cụ dùng trong bài
| Công cụ | Địa chỉ | Làm gì |
|---|---|---|
| Plearn, bài "Basic Sound Classification" | <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62113> | Xem slide và làm câu hỏi |
| Chrome Music Lab (trang Spectrogram) | <https://musiclab.chromeexperiments.com/Spectrogram/> (chưa kiểm chứng trong bài này, slide không ghi URL) | Nhìn tiếng của mình thành ảnh phổ |
| Ứng dụng ghi âm (Recorder) trên điện thoại | Có sẵn trên điện thoại | Bài về nhà "Thám tử âm thanh" |

Teachable Machine **không dùng** trong bài này. Nó chỉ xuất hiện như một câu hỏi (Discover 01) và là bài sau (Apply 06).

## Dạy thế nào
### Mở bài (5 phút)
Cho bé che tai như đeo tai nghe, nói to. Rồi đặt tay nhẹ lên loa lúc loa phát tiếng. Hỏi: "Con có nghe thấy không? Con có *sờ* thấy không?" Chốt: tiếng động không chỉ nghe, còn *cảm nhận* được. Âm thanh là rung động.

### Giảng (25 phút)
1. **Sóng âm (Engage 02).** Nhún lò xo tới lui: "Không khí cũng bị đẩy tới lui như vậy, tới tai mình." Hỏi: "Lò xo nhún mạnh thì sao?"
2. **Hai đặc điểm của sóng (Engage 03–04).** Vẽ hai sóng trên bảng. Sóng cao: tiếng to. Sóng thấp: tiếng nhỏ. Sóng thưa: giọng trầm. Sóng dày: giọng bổng, đo bằng Hz. Hỏi: "Sóng cao là tiếng gì? Sóng dày là tiếng gì?" Hai chữ "cao" dễ lẫn nhau, xem mục "Bé hay vướng".
3. **Tai người có giới hạn (Engage 05).** Trẻ em nghe được tới 20.000 Hz. Người lớn nghe kém tiếng rất bổng. Nói với bé: "Micro nghe được nhiều hơn tai người." Không nói "nghe mọi thứ".
4. **Âm thanh khó với máy (Engage 06–08).** Ảnh đứng yên như bức ảnh. Âm thanh chảy liên tục như nước. Nhiễu là tiếng ồn làm sóng nguệch ngoạc, như nói chuyện giữa phố đông. Hỏi: "Phòng im lặng có phải dữ liệu không?" Đáp: có. Micro vẫn ghi lại, để robot biết lúc *không* làm gì.
5. **Từ sóng thành số (Learn 01–04).** Máy tính chỉ hiểu 0 và 1. Micro "chụp ảnh" độ cao sóng rất nhiều lần mỗi giây, gọi là lấy mẫu. Ví dụ trên slide: giây 1 cao 5, giây 2 cao 8, giây 3 cao 2. Nói thêm: "Đó là ví dụ cho dễ. Thật ra micro chụp hàng nghìn lần mỗi giây." Cho bé xem dãy `[5, 8, 2, -3, -5, 0, 4, 9, 2, -1, -8 ...]`: đây là dữ liệu thô, dài và rối.
6. **Từ số thành ảnh (Learn 05–08).** Đưa cả triệu con số cho AI thì nó rối. AI cần một bức tranh. Đó là ảnh phổ. Chỉ từng trục: ngang là thời gian, dọc là cao thấp, màu là to nhỏ, đỏ là to. Chốt: **AI "nhìn" ảnh phổ, không "nghe" như mình.**
7. **Ví dụ khoai tây (Discover 00).** Khoai chưa gọt là dữ liệu thô. Khoai chiên là dữ liệu đã xử lý. Hỏi: "Con muốn ăn món nào?" Lưu ý: ảnh trên slide trông như khoai đã cắt, chưa chiên.
8. **Câu hỏi nhanh (Discover 01–02).** "Đầu vào của Teachable Machine Audio là gì? A. Sóng âm vô hình, B. Ảnh phổ âm thanh." Đáp án B.
9. **Phòng thí nghiệm ảo (Discover 03–09).** Xem phần "Bé tự làm" bên dưới.
10. **AI nghĩ thế nào (Apply 00–01).** Thấy "cột điện" thì: "À, vỗ tay!". Thấy đỉnh mảnh thì: "À, búng tay!". Thấy khối dưới đáy thì: "À, gõ!". Thử thách: làm sao dạy robot tự phân biệt ba hình này? Đó là Bài 8.
11. **Ngoài đời (Apply 03–04).** Siri và Google đổi ảnh phổ giọng nói thành lệnh chữ. Shazam nghe nhạc, so "dấu vân tay" để đoán bài hát. Dơi và cá heo phát tiếng rồi nghe vọng lại để "thấy" trong tối, gọi là định vị bằng tiếng vang.

### Bé tự làm (10 phút)
Các bước làm mẫu trong Chrome Music Lab (slide chỉ ghi việc cần làm, không ghi tên nút; thầy tự thử trước):
1. Mở trang Spectrogram, bấm cho phép dùng micro.
2. **Thử 1, chữ ký giọng nói:** nói tên mình, nhìn hình. Mỗi người một hình riêng, không ai giống ai.
3. **Thử 2, nghệ sĩ huýt sáo:** huýt từ thấp lên cao, đường đi lên. Rồi từ cao xuống thấp, đường đi xuống.
4. **Thử 3, ba tiếng:** vỗ tay một lần thật mạnh. Rồi búng tay. Rồi gõ. Nhìn hình của từng tiếng.
   - Vỗ tay: vạch dọc cao, như cột điện.
   - Búng tay: vạch mảnh hơn, màu dồn lên phía trên, vì búng tay là âm bổng.
   - Gõ: khối ngắn ở sát đáy, vì gõ là âm trầm.
5. **Thử 4, nhìn nhiễu:** cả lớp cùng nói một lúc. Hình thành đám sương lộn xộn, gọi là "rác dữ liệu". AI không học được từ hình này.

Hỏi bé sau mỗi thử: "Con thấy gì? Vì sao hình lại như vậy?"

### Chốt bài (5 phút)
Ba điều cần nhớ (slide Worksheet Recap): (1) Âm thanh là rung động. (2) Đơn vị của tần số là Hz. (3) AI nhìn ảnh phổ để đoán âm thanh.

Dặn buổi sau: kiểm tra micro laptop, tìm phòng yên tĩnh, mang đôi tay để vỗ. Bài về nhà "Thám tử âm thanh": ghi âm 3 tiếng lạ trong nhà (nước rót, giấy xé, mèo kêu…) bằng ứng dụng ghi âm trên điện thoại, mang tới lớp cho cả lớp đoán. Slide không nói độ dài mỗi đoạn ghi.

## Các bước làm mẫu
Bài này không có chương trình và không có code C++. Chuỗi cần nhớ:

- Âm thanh (rung động)
  - → micro: lấy mẫu rất nhiều lần mỗi giây
    - → dãy số (dữ liệu thô)
      - → ảnh phổ (dữ liệu đã xử lý)
        - → AI nhìn hình và đoán: vỗ tay, búng tay hay gõ

Thứ duy nhất giống code là dãy số minh họa dữ liệu thô:

```
[ 5, 8, 2, -3, -5, 0, 4, 9, 2, -1, -8 ... ]
```

Ba hình cần nhận ra trên ảnh phổ:

| Tiếng | Hình |
|---|---|
| Vỗ tay | Vạch dọc cao, như cột điện |
| Búng tay | Vạch mảnh, màu dồn lên đỉnh |
| Gõ | Khối ngắn ở đáy |

## Phiếu ôn luyện

**1. Dịch nhãn.** Nối từ Anh với từ Việt: Amplitude, Frequency, Microphone, Noise, Sampling, Spectrogram.

**Đáp án:** Amplitude = biên độ (độ to); Frequency = tần số (độ cao thấp của giọng); Microphone = micro; Noise = nhiễu; Sampling = lấy mẫu; Spectrogram = ảnh phổ âm thanh.

**2. Đọc đoán kết quả.** Có bốn sóng: A cao và thưa, B thấp và thưa, C cao và dày, D thấp và dày. Ghép mỗi sóng với "to-trầm", "nhỏ-trầm", "to-bổng", "nhỏ-bổng".

**Đáp án:** A to-trầm; B nhỏ-trầm; C to-bổng; D nhỏ-bổng. (Cao = to. Dày = bổng.)

**3. Đọc đoán kết quả (ảnh phổ).** Ba hình: (a) vạch dọc cao, (b) vạch mảnh dồn lên đỉnh, (c) khối ngắn ở đáy. Hình nào là vỗ tay, búng tay, gõ? Vì sao hình (c) nằm ở đáy?

**Đáp án:** (a) vỗ tay; (b) búng tay; (c) gõ. Gõ là âm trầm nên nằm sát đáy. (Nên dùng ảnh chụp thật của lớp.)

**4. Sắp thứ tự.** Xếp lại cho đúng: ảnh phổ, sóng âm, AI nhận ra, dãy số, lấy mẫu, micro.

**Đáp án:** sóng âm → micro → lấy mẫu → dãy số → ảnh phổ → AI nhận ra.

**5. Điền số.** (a) Tai trẻ em nghe được tới ___ Hz. (b) Trong ví dụ lấy mẫu của slide, giây 1 cao 5, giây 2 cao ___, giây 3 cao ___. (c) Đơn vị đo tần số là ___.

**Đáp án:** (a) 20.000; (b) 8 và 2; (c) Hz (héc). Vì sao 20.000: đó là con số slide nêu cho tai trẻ em. Người lớn nghe kém tiếng bổng.

**6. Tìm lỗi.** Bạn Na nói: "Sóng xếp sát nhau là giọng trầm. Phòng im lặng thì không có dữ liệu. AI nghe tiếng bằng tai như mình." Có ba lỗi, tìm và sửa.

**Đáp án:** (1) Sóng sát nhau là giọng bổng, sóng thưa mới là trầm. (2) Im lặng vẫn là dữ liệu, giúp robot biết lúc không làm gì. (3) AI "nhìn" ảnh phổ, không "nghe" như mình.

**7. Làm trên máy.** Mở Chrome Music Lab (Spectrogram). Làm cho hình hiện ra: (a) một đường đi lên; (b) một vạch dọc cao; (c) đám sương lộn xộn. Ghi lại con đã làm gì.

**Đáp án:** (a) huýt sáo từ thấp lên cao; (b) vỗ tay một lần thật mạnh; (c) cả nhóm nói cùng lúc. Thầy kiểm tra bé có nêu đúng thuật ngữ: tần số, to nhỏ, nhiễu.

**8. Thám tử âm thanh (khó).** Chọn một trong ba tiếng con ghi ở nhà. Đoán: trầm hay bổng, to hay nhỏ. Mở Chrome Music Lab xem hình có khớp không.

**Đáp án:** đáp án mở. Thầy chấm lý do bé nêu, và ghi bé đã dùng đúng thuật ngữ nào.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Cả 5 câu đều có 2 lựa chọn.

| Câu | Tiếng Anh | Bản dịch | Đáp án |
|---|---|---|---|
| Discover 01–02 | What is the Input of Teachable Machine Audio? A. Invisible Sound Waves / B. Spectrogram Images | Đầu vào của Teachable Machine Audio là gì? A. Sóng âm vô hình / B. Ảnh phổ âm thanh | **B** |
| Q1 | A high, soaring wave represents a sound that is...? A. Very Quiet / B. Very LOUD | Sóng cao vút biểu thị âm thanh như thế nào? A. Rất nhỏ / B. Rất TO | **B** |
| Q2 | Waves that are packed very close together mean...? A. Deep Voice (Low) / B. High Voice (Treble) | Sóng xếp sát nhau nghĩa là gì? A. Giọng trầm / B. Giọng bổng | **B** |
| Q3 | What turns sound waves into 0s and 1s? A. Microphone / B. Speaker | Cái gì biến sóng âm thành số 0 và 1? A. Micro / B. Loa | **A** |
| Q4 | Why do we filter out Noise? A. So AI doesn't get confused / B. Because noise is scary | Vì sao phải lọc nhiễu? A. Để AI không bị rối / B. Vì tiếng ồn đáng sợ | **A** |

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Chữ "cao" có hai nghĩa: sóng cao (to) và giọng cao (sóng dày). Q1 và Q2 dễ lẫn | Bé trả lời "sóng cao là giọng bổng" | Dùng hai chữ khác nhau: "cao = to", "dày = bổng". Vẽ hai sóng cạnh nhau |
| Đồ thị sóng và các trục chưa học ở lớp 4 | Bé nhìn hình rồi im | Dùng lò xo, hoặc thả sỏi xuống nước, rồi mới vẽ |
| Đọc ảnh phổ có ba chiều cùng lúc | Bé chỉ nhìn màu, bỏ qua trục | Chỉ từng trục một: ngang, rồi dọc, rồi màu |
| Hình thật trên Chrome Music Lab khác slide. Slide Discover 06 nói vỗ tay là "dark line" nhưng bảng màu nói đỏ là to | Bé nói "hình của con không giống" | Thầy thử trước, chụp hình thật, cho bé xem cạnh hình trên slide |
| Vì sao máy chỉ hiểu 0 và 1; ví dụ "giây 1, giây 2" mâu thuẫn nhẹ với "hàng nghìn lần mỗi giây" | Bé hỏi "sao chỉ có 3 mẫu?" | Nói rõ: đó là ví dụ rút gọn, thật ra rất nhiều mẫu |
| "AI nhìn chứ không nghe" trái trực giác | Bé nói "AI nghe tiếng" | Cho bé xem ảnh phổ rồi hỏi "nếu chỉ có hình này, con đoán được tiếng gì không?" |
| Phòng ồn, micro không xin được quyền | Ảnh phổ không hiện | Chọn phòng yên tĩnh; bấm cho phép micro; thử tải lại trang |

## Ghi chú về bản gốc
- **Tên bài ghi sai trên slide bìa.** Slide bìa ghi "Lesson 1: Invisible Data / Level 2: The Era of 'New Senses'". Đây là Bài 7 (*Basic Sound Classification*); chỉ là cách đánh số khác của khóa gốc. Đừng để bé nhầm với Bài 1.
- Slide Engage 02 (lò xo Slinky): ảnh hỏng, chỉ hiện chữ "Slinky toy wave".
- Slide Engage 03: dòng phụ ghi "To vs. Small", là lỗi gõ, ý là "Tall vs. Small". Hình ở slide này còn có sẵn nội dung tần số, trước khi slide sau dạy.
- Slide Engage 05 nói "Machine ears hear EVERYTHING". Chưa chính xác: micro cũng có giới hạn tần số. Giáo án đổi thành "nghe được nhiều hơn tai người".
- Slide Learn 03: ví dụ "Second 1/2/3" là mô hình đơn giản; thật ra hàng nghìn mẫu mỗi giây.
- Slide Discover 00: ảnh khoai trông như khoai đã cắt, chưa chiên.
- Slide Discover 06: ghi vỗ tay là "dark line" nhưng bảng màu nói đỏ là to; ảnh minh họa là ảnh phổ nền đỏ-xanh, không thấy rõ vạch dọc. Cần thầy tự thử.
- Slide Apply 00: chữ "Fire Top" có thể là lỗi gõ của "Fine Top" (đỉnh mảnh).
- Slide không ghi URL Chrome Music Lab và không hướng dẫn bấm nút.
- Giáo trình tổng §7 xếp Bài 7 và Bài 8 chung buổi 10 (90 phút). Bài 8 có 90 slide chia 3 buổi con, nên không vừa một buổi nếu dạy đủ. Xem ghi chú ở Bài 8.
- Con số trong §6 giáo trình tổng không có số nào thuộc Bài 7; không có mâu thuẫn.
