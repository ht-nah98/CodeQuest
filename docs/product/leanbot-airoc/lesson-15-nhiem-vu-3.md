# Bài 15 — Nhiệm vụ 3: Mang mẫu về phòng lab

> Bài gốc: *Mission 3: Analysis Retrieval* (Module 8, "AI ROC 2026 Mission 3 The Analysis Retrieval") · 29 slide · 3 chương (Engage 11 · Learn 12 · Resolve 6) · <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=63005>

Mã mẫu chính thức: `git.pythaverse.space/ptvairoc/Synapsecity_Primary/blob/master/Analyst`. Video bài: <https://youtu.be/DeixGqfmIkI>.

## Bé học xong thì làm được gì
- Nói được Nhiệm vụ 3 được bao nhiêu điểm (**100 điểm mỗi khối ô nhiễm**) và khối nào thì được tính (bất kỳ phần nào của khối chạm hoặc đè lên CRL).
- Đặt robot đúng chỗ xuất phát: nằm trọn trong CRL, không bộ phận nào đè lên đường viền đen.
- Đọc được 7 trường hợp của hàm `runFollowLine` và nói robot sẽ lái thế nào khi cảm biến vạch thấy một mẫu đen/trắng cho trước.
- Giải thích vì sao quay đầu 180° khi đang kẹp khối phải **chậm**, và ghép được lệnh `Rotate` để quay đầu.
- Đọc cả chương trình `Analyst` và chỉ ra chặng nào là "đi tới F4", "kẹp", "về CRL", "thả".

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Robot Leanbot đã sạc pin, tay gắp đã cân chỉnh | Nhớ bài GS1 |
| Sa bàn AIROC hoặc tấm in có CRL, khu F và vạch đen | Nếu không có sa bàn thật thì vẽ bằng băng keo đen trên giấy khổ lớn |
| Một khối gỗ ô nhiễm | Kích thước theo slide 06: dài 1,5 cm × rộng 2,5 cm × cao 7,5 cm |
| Trình soạn khối lệnh **có bản vá tiếng Việt** | `tools/lbeditor-vi/` |
| Mã mẫu `Analyst` dán sẵn vào trình soạn khối | Slide Learn 09 hướng dẫn bấm biểu tượng để chép mã mẫu rồi dán vào Trình soạn khối lệnh |
| 4 tấm thẻ "mắt dò vạch" (mỗi thẻ 4 ô đen/trắng) | Thầy tự làm, dùng ở bước 4 |
| Đồng hồ bấm giờ, thước, giấy ghi kết quả | Cho bài thí nghiệm tốc độ quay |
| Cáp USB nạp code | Hướng dẫn nạp ở `docs/playbooks/leanbot-setup.md` |
| Bản sao số (nếu muốn chạy thử trước) | Chỉ dùng được nếu lớp đã học Bài 10–12 |

## Thuật ngữ của bài
Các từ đã có trong giáo trình tổng §5 (Khối ô nhiễm, Khu cách ly, Kho S1–S6, CRL, Nhiệm vụ, Điểm, Hàm, Tham số, Ngưỡng, Cân chỉnh, Tay gắp, Cảm biến vạch…) không chép lại ở đây.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Analysis | Phân tích | Mang mẫu về phòng lab để biết chất ô nhiễm là gì |
| Junction | Ngã tư | Chỗ cả 4 mắt cảm biến cùng thấy đen |
| U-Turn / Pivot 180° | Quay đầu 180° | Hai bánh quay ngược chiều nhau, robot xoay tại chỗ nửa vòng |
| Opposite directions | Ngược chiều nhau | Bánh trái tiến thì bánh phải lùi |
| Re-acquire the line / Search | Tìm lại vạch | Xoay chậm cho tới khi mắt cảm biến thấy đen lần nữa |
| Mirrored turns | Rẽ đối xứng | Đi tới rẽ phải thì lúc về thường rẽ trái (xem mục Ghi chú về bản gốc) |
| Boundary detection | Nhận ra đích | Cách robot biết mình đã về tới nhà |
| Open loop | Chạy theo quãng đường, không nhìn vạch | Chạy một đoạn cố định, mắt không dò vạch |
| Return bonus | Điểm thưởng về đích (+40) | Cả hai bánh nằm trọn trong CRL khi robot dừng |
| SDG 12 | Mục tiêu 12 của Liên Hợp Quốc | Dùng và làm ra đồ một cách có trách nhiệm |
| Physical AI | AI trong robot thật | Robot tự nhìn, tự nghĩ, rồi tự làm việc ngoài đời |
| Base Zone | Khu căn cứ | Chỗ xuất phát. Trong bài này chính là CRL |

## Khối lệnh dùng trong bài
| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `Leanbot.whenStarted` | Leanbot bắt đầu hoạt động | Chạy một lần khi bật. Ở đây đặt ngưỡng cảm biến |
| `LbMission.beginByTeacher_end` | Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B … Nhiệm vụ: Kết thúc | Chờ chạm hai nút cùng lúc rồi mới làm nhiệm vụ |
| `LbIRLine.setThreshold` | Cảm biến vạch: Đặt ngưỡng 2T 69, 0T 78, 1P 106, 3P 70 | Đặt mức đen/trắng cho từng mắt |
| `LbIRLine.read` | Cảm biến vạch: Đọc cảm biến | Nhìn xuống sàn một lần |
| `LbIRLine.value` | Cảm biến vạch: Giá trị 4 mắt (2T, 0T, 1P, 3P) | Lấy kết quả đọc dưới dạng một con số |
| `LbIRLine.displayOnRGB` | Cảm biến vạch: Hiện lên đèn LED màu | Cho đèn LED sáng theo mắt nào thấy đen |
| `controls_switch` | Chọn theo giá trị (Switch) | Mỗi giá trị `line` một cách lái |
| `LbMotion.run` | Di chuyển: Chạy với vận tốc Trái ? Phải ? bước/giây | Đặt tốc độ hai bánh (sinh `LbMotion.runLR`) |
| `LbMotion.waitDistanceMm` | Di chuyển: Chạy đoạn đường ? mm | Chạy tiếp cho đủ quãng đường |
| `LbMotion.waitRotationDeg` | Di chuyển: Rẽ góc ? độ | Rẽ tiếp cho đủ góc |
| `LbMotion.stop` | Di chuyển: Dừng | Giảm tốc rồi dừng hẳn (sinh `stopAndWait`) |
| `LbMotion.approxDistance` | Di chuyển: Đường đã đi, tính bằng mm | Quãng đường robot đã đi (sinh `getDistanceMm`) |
| `LbGripper.moveTo` | Tay gắp: Xoay tới góc ? độ | Đưa hai càng tới đúng một góc |
| `LbGripper.open` | Tay gắp: Mở | Mở hai càng ra để nhả khối |
| `Leanbot.commentLine` | Dòng ghi chú | Robot bỏ qua. Người đọc dễ hiểu hơn |
| `procedures_defnoreturn` / `procedures_callnoreturn` | Hàm (phép thuật): định nghĩa / gọi | Gói nhiều lệnh thành một lệnh có tên |
| `controls_whileUntil` | Lặp khi … | Làm đi làm lại khi điều kiện còn đúng |
| `controls_repeat_ext` | Lặp N lần | Làm đúng N lần |
| `vars_initialize_local_auto` | Tạo biến tạm | Hộp nhớ chỉ dùng trong một hàm |

## Dạy thế nào
Buổi 17 theo lộ trình (§7 giáo trình tổng). Dạy bằng khối tiếng Việt trước, đối chiếu nhãn tiếng Anh sau (§4).

### Mở bài (5 phút)
1. Đưa một ly nước đầy (hoặc khối gỗ để trên cái muỗng). Thầy hỏi: "Con xoay người thật nhanh thì chuyện gì xảy ra?" Để bé tự nói: nước văng, khối rơi.
2. Thầy nói: "Hôm nay robot phải **kẹp** một khối ô nhiễm rồi **quay đầu** mà không làm rơi. Đó là chỗ khó nhất của Nhiệm vụ 3."
3. Ghi bảng ba chữ: **Đi tới – Kẹp – Mang về**.

### Giảng (35 phút)
1. **Nhiệm vụ 3 là gì (3 phút).** Robot đi tới khu có khối ô nhiễm (trong chương trình mẫu là **F4**), kẹp khối rồi chở về **CRL** để phân tích. Mỗi khối được **100 điểm**. Nếu robot dừng với cả hai bánh nằm trọn trong CRL thì được thêm **40 điểm**.
   - Thầy hỏi: "Vì sao người ta phải mang mẫu về phòng thí nghiệm?" (Để biết chất ô nhiễm là gì.)
   - Slide Engage kể chuyện năm 2050 bằng nhiều tiếng Anh khó. Thầy bỏ phần đó, chỉ kể 2–3 câu tiếng Việt.
2. **Đặt robot đúng chỗ (3 phút).** Bé đặt robot lên CRL. Thầy chỉ bảng đúng/sai của slide Learn 03: nhìn từ trên xuống, **không bộ phận nào đè lên đường viền đen quanh CRL**.
   - Thầy hỏi: "Robot của con đè lên vạch chưa? Nhìn từ trên xuống nhé."
3. **Khối nào được tính (3 phút).** Khối ô nhiễm được tính khi **bất kỳ phần nào của nó chạm hoặc đè lên CRL** (slide Learn 04). Khối còn nằm ngoài CRL, hoặc còn nằm trong gọng tay gắp mà không chạm CRL, thì **không** được tính.
   - Bé làm việc: thầy đặt khối ở 4 vị trí khác nhau, bé giơ tay "được" hoặc "chưa".
4. **Ôn mắt dò vạch (7 phút).** Robot có 4 mắt nhìn xuống sàn, xếp từ trái sang phải: **2T, 0T, 1P, 3P**. Mỗi mắt thấy đen hoặc trắng. Bốn mắt gộp thành một con số `line`.
   - Thầy dùng 4 tấm thẻ, không dạy nhị phân. Bé đặt thẻ, thầy đọc số: chỉ 0T đen là **4**, chỉ 1P đen là **2**, 2T+0T đen là **12**, 1P+3P đen là **3**, chỉ 2T đen là **8**, chỉ 3P đen là **1**, cả 4 đen là **15** = **ngã tư**.
   - Thầy hỏi: "Chỉ mắt giữa bên trái thấy đen, vạch đang lệch về phía nào của robot?" (Bên trái.) "Robot nên làm gì?" (Rẽ trái nhẹ.)
   - Mở bảng `runFollowLine` ở mục Chương trình mẫu, cho bé đọc từng dòng. Chốt: số nhỏ hơn nghĩa là bánh đó chạy chậm lại để lái.
5. **Các hàm xếp thành ba tầng (8 phút).** Mở chương trình `Analyst`. Thầy chỉ ba tầng:
   - Tầng 1, dò vạch: `runFollowLine` → `followLineUntilJunction` / `followLineDistance` → `goToJunction` / `followLineMultipleJunctions`.
   - Tầng 2, chạy thô: `Forward`, `Backward`, `Rotate`.
   - Tầng 3, nhiệm vụ: khối `loop`, một dãy lệnh thẳng, mỗi đoạn có dòng ghi chú.
   - Thầy nhấn ba cái tên rất giống nhau: `followLineUntilJunction` (dò tới ngã tư), `goToJunction` (tới ngã tư rồi **dừng giữa ngã tư**), `followLineMultipleJunctions` (qua N ngã tư, **không dừng**).
   - Thầy hỏi: "Vì sao phải đi thêm 20 mm rồi mới dừng?" (Để tâm quay của robot nằm giữa ngã tư, lần xoay sau mới đúng.)
6. **Điểm khó: quay đầu 180° khi đang kẹp (6 phút).** Hai bánh chạy **ngược chiều nhau** thì robot xoay tại chỗ. Khối `Rotate` làm đúng việc đó: bánh trái chạy `speed`, bánh phải chạy `-speed`. Tốc độ dương là xoay phải, âm là xoay trái.
   - Bé thử bằng tay với robot đồ chơi hoặc hộp bút: hai tay kéo ngược chiều.
   - Thầy nói thật: **chương trình mẫu không có lệnh quay 180°**. Nó lùi 30 mm rồi xoay 35°. Muốn quay đầu, ta gọi `Rotate(tốc độ, 180)`. Khi đang kẹp khối phải chọn tốc độ nhỏ hơn 2000 cho khối khỏi văng. Slide không nêu con số, nên bé phải tự thử (xem Phiếu ôn luyện, bài 9).
7. **Tìm lại vạch (5 phút).** Sau khi xoay, robot có thể mất vạch. Ý tưởng ở slide: xoay **chậm** cho tới khi mắt cảm biến thấy đen. Mẫu chính thức **không có** khối này, nên đây là bài bé tự ghép từ khối đã học (xem Phiếu ôn luyện, bài 8).
   - Thầy hỏi: "Khi nào thì `line` bằng 0?" (Khi chưa mắt nào thấy đen.) "Vậy ta cho robot xoay chậm khi `line` còn bằng 0, và nhớ **đọc cảm biến lại** trong mỗi vòng. Quên đọc thì chuyện gì xảy ra?" (`line` không đổi, robot xoay mãi.)

### Bé tự làm (40 phút)
Làm theo nhóm hai bé một robot.
1. (5 phút) Nạp chương trình `Analyst` đã dán sẵn. Mỗi bé chỉ vào khối và đọc to: "Đây là chặng đi tới F4. Đây là chặng kẹp. Đây là chặng về CRL. Đây là chặng thả."
2. (10 phút) Chạy chặng đi tới F4. Chạm cùng lúc TB1A và TB1B để bắt đầu. Nếu robot lệch vạch, hỏi: "Ngưỡng cảm biến có hợp với ánh sáng ở bàn mình không?" Ngưỡng `69, 78, 106, 70` là của lúc soạn mẫu; mỗi sa bàn phải **cân chỉnh lại** (Bài 4).
3. (10 phút) Chạy trọn chương trình: kẹp khối rồi về CRL và thả. Ghi lại: khối có chạm CRL không? Hai bánh có nằm trọn trong CRL không?
4. (15 phút) Thí nghiệm quay đầu 180°: kẹp khối, gọi `Rotate` 180° ở các tốc độ **2000, 1500, 1000, 500**. Ghi vào bảng: khối có văng không? Robot có còn trên vạch không? Chạy `Search` nếu mất vạch. Bé ghi lại tốc độ **lớn nhất** mà khối không văng. Đây là số bé tự đo, không có đáp án sẵn.

### Chốt bài (5 phút)
- Thầy hỏi lại ba câu: Khối nào được tính? Hai bánh làm gì để robot xoay tại chỗ? Vì sao phải đọc cảm biến trong mỗi vòng khi tìm vạch?
- Mỗi bé nói một điều con làm đúng và một điều con sẽ chỉnh lần sau.
- Dặn: bài sau ghép Nhiệm vụ 1 + 2 + 3 trong 2 phút.

## Chương trình mẫu
Nguồn: `Analyst.ino` do Trình soạn khối lệnh sinh ra, khớp với sơ đồ slide Learn 08 và ảnh khối slide Learn 09. Cây khối có 66 dòng khối. Tên hàm giữ tiếng Anh như trong code. Cột phải là code C++ do khối sinh ra.

**Cách đọc cảm biến.** Bốn mắt theo thứ tự (2T, 0T, 1P, 3P) ứng với các bit 8, 4, 2, 1. Cách ánh xạ này suy ra từ đối chiếu bảng `switch` với slide, chưa có slide nào ghi thẳng. Cả bốn mắt đen là 15.

### Biến chung
| Khối | C++ |
|---|---|
| Tạo biến số nguyên `line` | `int line;` |

### Hàm `runFollowLine`: một bước lái theo vạch
| Khối | C++ | Nghĩa cho bé |
|---|---|---|
| Ghi chú "--- Read line ---" | `// --- Read line ---` | Chỉ để đọc |
| Cảm biến vạch: Đọc cảm biến | `LbIRLine.read();` | Nhìn xuống sàn một lần |
| đặt `line` = Cảm biến vạch: Giá trị 4 mắt | `line = LbIRLine.value();` | Ghi nhớ kết quả vào hộp `line` |
| Cảm biến vạch: Hiện lên đèn LED màu xanh lá | `LbIRLine.displayOnRGB(0x00ff00);` | Đèn LED báo mắt nào thấy đen |
| Chọn theo `line`, trường hợp 4 (0T đen) | `case 4: LbMotion.runLR(1000, 2000); break;` | Vạch lệch trái ít: bánh trái chậm hơn, rẽ nhẹ sang trái |
| trường hợp 2 (1P đen) | `case 2: LbMotion.runLR(2000, 1000); break;` | Vạch lệch phải ít: rẽ nhẹ sang phải |
| trường hợp 12 (2T + 0T đen) | `case 12: LbMotion.runLR(200, 2000); break;` | Vạch lệch trái nhiều: rẽ gắt trái |
| trường hợp 3 (1P + 3P đen) | `case 3: LbMotion.runLR(2000, 200); break;` | Vạch lệch phải nhiều: rẽ gắt phải |
| trường hợp 8 (chỉ 2T đen) | `case 8: LbMotion.runLR(-1000, 1000); break;` | Vạch ở sát ngoài cùng trái: xoay tại chỗ sang trái |
| trường hợp 1 (chỉ 3P đen) | `case 1: LbMotion.runLR(1000, -1000); break;` | Vạch ở sát ngoài cùng phải: xoay tại chỗ sang phải |
| mặc định (các trường hợp còn lại) | `default: LbMotion.runLR(2000, 2000);` | Vạch ở giữa: chạy thẳng, nhanh nhất |

Tốc độ 2000 bước/giây là nhanh nhất (khoảng −2000 … 2000, §6 giáo trình tổng).

### Hàm `followLineUntilJunction`: dò vạch tới khi gặp ngã tư
| Khối | C++ |
|---|---|
| Lặp khi `line` khác 15 | `while ((line != 15)) {` |
| gọi `runFollowLine` | `  runFollowLine();` |

### Hàm `followLineDistance(distanceMm)`: dò vạch thêm đúng một đoạn
| Khối | C++ | Nghĩa |
|---|---|---|
| Tạo biến tạm `targetMm` = `distanceMm` + Đường đã đi | `auto targetMm = distanceMm + LbMotion.getDistanceMm();` | Đích = đã đi bao nhiêu + đoạn cần đi thêm |
| Lặp khi Đường đã đi < `targetMm` | `while ((LbMotion.getDistanceMm() < targetMm)) {` | Chưa tới đích thì còn dò |
| gọi `runFollowLine` | `  runFollowLine();` | |

### Hàm `goToJunction`: tới ngã tư rồi dừng giữa ngã tư
| Khối | C++ |
|---|---|
| gọi `followLineUntilJunction` | `followLineUntilJunction();` |
| gọi `followLineDistance` với 20 | `followLineDistance(20);` |
| Di chuyển: Dừng | `LbMotion.stopAndWait();` |

### Hàm `followLineMultipleJunctions(junctionCount)`: đi qua N ngã tư, không dừng
| Khối | C++ | Nghĩa |
|---|---|---|
| Lặp `junctionCount` lần | `for (int count = 0; count < junctionCount; count++) {` | |
| gọi `followLineDistance` với 30 | `  followLineDistance(30);` | Bước ra khỏi ngã tư đang đứng, khỏi đếm lại nó |
| gọi `followLineUntilJunction` | `  followLineUntilJunction();` | Dò tới ngã tư kế |

### Ba hàm chạy thô
| Khối | C++ | Nghĩa |
|---|---|---|
| `Forward(speed, distanceMm)`: Chạy với vận tốc Trái `speed` Phải `speed` | `LbMotion.runLR(speed, speed);` | Hai bánh cùng tiến |
| Chạy đoạn đường `distanceMm` mm | `LbMotion.waitDistanceMm(distanceMm);` | Chờ đủ quãng đường, không nhìn vạch |
| Dừng | `LbMotion.stopAndWait();` | |
| `Backward`: Chạy với vận tốc Trái (−1 × `speed`) Phải (−1 × `speed`) | `LbMotion.runLR((-1) * speed, (-1) * speed);` | Hai bánh cùng lùi |
| Chạy đoạn đường `distanceMm` mm, Dừng | `LbMotion.waitDistanceMm(distanceMm);` `LbMotion.stopAndWait();` | |
| `Rotate(speed, degrees)`: Chạy với vận tốc Trái `speed` Phải (−1 × `speed`) | `LbMotion.runLR(speed, (-1) * speed);` | Hai bánh **ngược chiều** nên xoay tại chỗ |
| Rẽ góc `degrees` độ | `LbMotion.waitRotationDeg(degrees);` | Chờ đủ góc |
| Dừng | `LbMotion.stopAndWait();` | |

### Cài đặt và chương trình chính
| Khối | C++ |
|---|---|
| Leanbot bắt đầu hoạt động | `void setup() {` `Leanbot.begin();` |
| Cảm biến vạch: Đặt ngưỡng 2T 69, 0T 78, 1P 106, 3P 70 | `LbIRLine.setThreshold(69, 78, 106, 70);` |
| Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B | `LbMission.begin(TB1A + TB1B);` |

Chặng **đi tới F4** (khối ghi chú "Follow line to F4"):

| Khối | C++ | Làm gì |
|---|---|---|
| `Forward` 2000, 110 | `Forward(2000, 110);` | Ra khỏi CRL 110 mm, không nhìn vạch |
| `Rotate` 2000, 23 | `Rotate(2000, 23);` | Xoay phải 23° |
| `followLineMultipleJunctions` 2 | `followLineMultipleJunctions(2);` | Đi qua 2 ngã tư |
| `goToJunction` | `goToJunction();` | Dừng giữa ngã tư |
| `Rotate` 2000, 60 | `Rotate(2000, 60);` | Xoay phải 60° |
| `followLineMultipleJunctions` 1 | `followLineMultipleJunctions(1);` | Đi qua 1 ngã tư |
| `goToJunction` | `goToJunction();` | Dừng giữa ngã tư |
| `Rotate` −2000, 35 | `Rotate((-2000), 35);` | Xoay **trái** 35° |
| `Forward` 2000, 30 | `Forward(2000, 30);` | Tiến sát khối ở F4 |

Chặng **kẹp** (khối ghi chú "Pick up Pollution at F4"):

| Khối | C++ | Làm gì |
|---|---|---|
| Tay gắp: Xoay tới góc 50 độ | `LbGripper.moveTo(50);` | Kẹp khối ô nhiễm |

Chặng **về CRL** (khối ghi chú "Follow line to CRL"):

| Khối | C++ | Làm gì |
|---|---|---|
| `Backward` 2000, 30 | `Backward(2000, 30);` | Lùi 30 mm, đúng bằng đoạn vừa tiến |
| `Rotate` 2000, 35 | `Rotate(2000, 35);` | Xoay phải 35° |
| `followLineMultipleJunctions` 1 | `followLineMultipleJunctions(1);` | Qua 1 ngã tư |
| `goToJunction` | `goToJunction();` | Dừng |
| `Rotate` 2000, 60 | `Rotate(2000, 60);` | Xoay phải 60° |
| `followLineMultipleJunctions` 2 | `followLineMultipleJunctions(2);` | Qua 2 ngã tư |
| `goToJunction` | `goToJunction();` | Dừng |
| `Rotate` 2000, 35 | `Rotate(2000, 35);` | Xoay phải 35° |

Chặng **thả** (khối ghi chú "Drop Pollution into CRL"):

| Khối | C++ | Làm gì |
|---|---|---|
| Tay gắp: Mở | `LbGripper.open();` | Nhả khối trong CRL |
| Nhiệm vụ: Kết thúc | `LbMission.end();` | Hết nhiệm vụ |

**Đọc kỹ ba chỗ:**
- Chương trình mẫu **không quay đầu 180°**. Nó lùi 30 mm rồi xoay phải 35°, 60°, 35°.
- Chương trình mẫu **không có** chế độ tìm lại vạch.
- Chỉ có một lệnh kẹp, `LbGripper.moveTo(50)`. Slide nói "mở → tiến → kẹp chặt" nhưng mẫu không có khối mở trước khi kẹp. Xem mục Ghi chú về bản gốc.

## Phiếu ôn luyện

**1. Đọc đoán kết quả: mắt dò vạch.** Với mỗi ca, cho biết `line` bằng bao nhiêu và robot lái thế nào.
- (a) Chỉ mắt 0T thấy đen.
- (b) Mắt 1P và 3P thấy đen.
- (c) Cả 4 mắt thấy đen.
- (d) Mắt 0T và 1P thấy đen (hai mắt giữa).

**Đáp án:** (a) `line` = 4, chạy `(1000, 2000)`: bánh trái chậm hơn nên rẽ nhẹ sang trái. (b) `line` = 3, chạy `(2000, 200)`: rẽ gắt sang phải. (c) `line` = 15: đây là ngã tư, vòng lặp `followLineUntilJunction` dừng lại. (d) `line` = 6, không có trong `switch` nên rơi vào mặc định `(2000, 2000)`: chạy thẳng.

**2. Đọc đoán kết quả: dừng ở đâu.** Robot đang ở CRL. Chạy đoạn sau:
```cpp
Forward(2000, 110);
Rotate(2000, 23);
followLineMultipleJunctions(2);
goToJunction();
```
Robot làm gì từng bước và cuối cùng dừng ở đâu?

**Đáp án:** Tiến thẳng 110 mm không nhìn vạch. Xoay phải 23°. Dò vạch qua 2 ngã tư. Rồi `goToJunction`: vì `line` vẫn còn là 15 từ ngã tư thứ 2 nên hàm `followLineUntilJunction` thoát ngay, robot dò thêm 20 mm rồi dừng. Vậy robot dừng giữa **ngã tư thứ 2** (không phải ngã tư thứ 3). Đây là cách đọc code; cần xác nhận trên robot thật (xem Ghi chú về bản gốc).

**3. Tìm lỗi.** Bé viết chặng "về CRL" như dưới. Có 3 chỗ sai so với mẫu. Tìm và sửa.
```cpp
Backward(2000, 30);
Rotate(-2000, 35);
followLineMultipleJunctions(1);
Rotate(2000, 60);
followLineMultipleJunctions(2);
goToJunction();
Rotate(2000, 35);
LbMission.end();
```

**Đáp án:** (1) Dòng 2 xoay **trái**, mẫu xoay **phải**: phải là `Rotate(2000, 35)`. (2) Sau `followLineMultipleJunctions(1)` thiếu `goToJunction();`. Không có nó robot không dừng giữa ngã tư, mà xoay ngay khi vừa tới mép ngã tư nên tâm quay lệch. (3) Trước `LbMission.end()` thiếu `LbGripper.open();`, robot không nhả khối trong CRL; khối còn kẹp trong gọng thì chưa chắc được tính (slide Learn 04), có thể mất 100 điểm.

**4. Sắp thứ tự.** Xếp 5 đoạn của chương trình chính theo đúng thứ tự:
- A. Thả khối vào CRL (`LbGripper.open`, `LbMission.end`)
- B. Về CRL
- C. Chờ chạm TB1A + TB1B
- D. Kẹp khối ở F4
- E. Đi tới F4

**Đáp án:** **C → E → D → B → A.**

**5. Điền số.** Chặng về CRL bị mất số. Điền vào chỗ trống và nói vì sao.
```cpp
Backward(2000, __);
Rotate(2000, __);
followLineMultipleJunctions(__);
goToJunction();
Rotate(2000, __);
followLineMultipleJunctions(__);
goToJunction();
Rotate(2000, __);
```
Rồi điền: muốn xoay **trái** 35° thì viết `Rotate(__, 35)`.

**Đáp án:** `30`, `35`, `1`, `60`, `2`, `35`. Lùi 30 mm vì lúc đi robot đã tiến 30 mm sát khối. Số ngã tư lúc về là 1 rồi 2, ngược với lúc đi (2 rồi 1): đường về đi lại đúng vạch cũ nhưng theo chiều ngược. Xoay trái viết `Rotate(-2000, 35)`.

**6. Dịch nhãn.** Dịch sang tiếng Việt (nhãn của Trình soạn khối lệnh):
- (a) `Motion: Keep turning for ? degrees`
- (b) `Gripper: Rotate to ? degrees`
- (c) `IRLine: Set threshold`
- (d) `Mission: Begin when ? combo touched`
- (e) `Motion: Stop`

Rồi dịch ngược: (f) "Di chuyển: Chạy đoạn đường ? mm" sang tiếng Anh.

**Đáp án:** (a) Di chuyển: Rẽ góc ? độ. (b) Tay gắp: Xoay tới góc ? độ. (c) Cảm biến vạch: Đặt ngưỡng. (d) Nhiệm vụ: Bắt đầu khi chạm cùng lúc ?. (e) Di chuyển: Dừng. (f) `Motion: Keep running for ? ...` (nhãn gốc của `LbMotion.waitDistanceMm`; giáo trình tổng §5.5 ghi `Motion: Keep running for ? cm`, còn mẫu `Analyst` dùng đơn vị mm. Nhìn đúng nhãn trên Plearn.)

**7. Làm trên máy: chặng kẹp và lùi.** Ghép khối sao cho sinh ra đúng đoạn code này (đã dán sẵn các hàm `Forward`, `Backward`, `Rotate`):
```cpp
Rotate((-2000), 35);
Forward(2000, 30);
LbGripper.moveTo(50);
Backward(2000, 30);
Rotate(2000, 35);
```

**Đáp án:** Năm khối nối nhau dưới khối "Nhiệm vụ": gọi `Rotate` với tốc độ `-2000` góc `35`; gọi `Forward` với `2000`, `30`; "Tay gắp: Xoay tới góc 50 độ"; gọi `Backward` với `2000`, `30`; gọi `Rotate` với `2000`, `35`. Đối chiếu cột code bên phải: giống từng dòng là đúng.

**8. Làm trên máy: quay đầu và tìm lại vạch (khó).** Viết hàm `searchLine` sinh ra đúng code này, rồi gọi nó sau `Rotate(1000, 180)`:
```cpp
void searchLine() {
  LbMotion.runLR(500, -500);
  LbIRLine.read();
  line = LbIRLine.value();
  while ((line == 0)) {
    LbIRLine.read();
    line = LbIRLine.value();
  }
  LbMotion.stopAndWait();
}
```

**Đáp án:** Tạo hàm `searchLine`; trong hàm: "Chạy với vận tốc Trái 500 Phải −500", "Đọc cảm biến", đặt `line` = "Giá trị 4 mắt", rồi "Lặp khi `line` = 0" chứa hai khối vừa đọc vừa đặt `line`, cuối cùng "Di chuyển: Dừng". Chương trình chính: `Rotate(1000, 180); searchLine();`. **Lưu ý:** hàm này và các số 500, 1000 là gợi ý của người soạn bài, **chưa thử trên robot thật**. Phải đọc cảm biến trong mỗi vòng; quên thì `line` không đổi và robot xoay mãi.

**9. Thí nghiệm có robot: tốc độ quay đầu êm nhất.** Kẹp khối gỗ, gọi `Rotate(tốc độ, 180)` với tốc độ 2000, 1500, 1000, 500. Ghi bảng: khối có văng không, robot còn trên vạch không. Chốt tốc độ lớn nhất mà khối không văng.

**Đáp án:** Không có số cố định, slide không đưa con số. Kết quả phụ thuộc robot, khối, sàn. Bài đúng khi bé có bảng 4 dòng và chọn đúng tốc độ từ bảng của mình.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc có 10 câu (dữ liệu H5P, slide Resolve 03 hiện trống). Đáp án đúng ghi sau dấu ✔.

1. What is the main goal of Mission 3? (Mục tiêu chính của Nhiệm vụ 3 là gì?) ✔ *To bring the pollution sample back to base.* (Mang mẫu ô nhiễm về căn cứ.) Sai: *To spin in circles* (Quay vòng vòng); *To leave the robot at the site* (Để robot lại hiện trường).
2. To perform a 180-degree turn in place, the motors should move... (Để quay 180° tại chỗ, động cơ phải chạy...) ✔ *In opposite directions.* (Ngược chiều nhau.) Sai: *They shouldn't move* (Không chạy); *In the same direction* (Cùng chiều).
3. Why do we analyze the sample in a lab? (Vì sao phân tích mẫu trong phòng thí nghiệm?) ✔ *To find out what the pollutant is.* (Để biết chất ô nhiễm là gì.) Sai: *To make the robot look busy*; *To clean the robot's wheels*.
4. What might happen if the robot turns too fast while holding a sample? (Nếu robot quay quá nhanh khi đang kẹp mẫu thì có thể xảy ra gì?) ✔ *The sample will fly out due to force.* (Mẫu văng ra vì lực.) Sai: *The robot will gain more battery*; *The line will disappear*.
5. Which sensor helps the robot find the line after a U-turn? (Cảm biến nào giúp robot tìm lại vạch sau khi quay đầu?) ✔ *IR/Line Sensor.* (Cảm biến hồng ngoại / dò vạch.) Sai: *Temperature Sensor*; *Ultrasonic*.
6. SDG 12 is about "Responsible Consumption and...". (SDG 12 nói về "Tiêu dùng có trách nhiệm và...".) ✔ *Production.* (Sản xuất.) Sai: *Pollution*; *Programming*.
7. What is a "Function" or "My Block" in coding? (Hàm hay "Khối của tôi" là gì?) ✔ *A group of blocks used to simplify the main program.* (Một nhóm khối gom lại để chương trình chính gọn hơn.) Sai: *A way to delete code*; *A special type of battery*.
8. How can the robot detect it has returned to the "Base Zone"? (Robot biết đã về "Khu căn cứ" bằng cách nào?) ✔ *Both sensors detect a wide black line/marker.* (Hai cảm biến cùng thấy vạch / mốc đen rộng.) Sai: *It runs out of power*; *It hears the teacher clap*.
9. When picking up the source, the gripper should be... (Khi nhặt mẫu, tay gắp phải...) ✔ *Open then Closed.* (Mở rồi đóng.) Sai: *Removed*; *Closed then Open*.
10. The path back to base is usually... (Đường về căn cứ thường là...) ✔ *The same line used to get there.* (Chính vạch đã dùng để đi.) Sai: *A completely different road*; *Invisible*.

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Không hiểu 4 mắt thành một con số | Hỏi "sao `line` lại bằng 12?" | Quay lại 4 thẻ đen/trắng. Không dạy nhị phân, chỉ nói "mẫu này thì bánh nào chạy nhanh" |
| Lẫn `goToJunction`, `followLineMultipleJunctions`, `followLineUntilJunction` | Robot xoay trước khi tới giữa ngã tư | Vẽ ba mũi tên trên bảng: một mũi dừng, hai mũi không dừng. Hỏi "hàm này có dừng không?" |
| Đếm ngã tư ngược chiều | Đi qua 2 rồi 1, lúc về đếm sai | Bé lấy ngón tay đếm trên sa bàn khi đi, rồi đi ngược |
| Khó hình dung hai bánh ngược chiều | Gọi `Rotate` mà robot đi tới | Bé xoay đồ chơi bằng hai tay kéo ngược nhau; chỉ dấu `-` đổi chiều |
| Nhầm xoay trái/xoay phải | Dấu `-` ở tốc độ | Quy ước: dương = phải, âm = trái. Cho đo bằng góc thực trên sàn |
| Khối văng khi quay | Khối rơi ra ngoài | Giảm tốc độ `Rotate`, thử bảng tốc độ ở bài 9 |
| Đặt robot lệch lúc xuất phát | Một góc đè lên vạch viền CRL | Nhìn từ trên xuống, dời robot vào trọn trong CRL |
| Ngưỡng cảm biến không hợp sa bàn | Robot mất vạch dù mẫu chạy được ở nơi khác | Cân chỉnh lại ngưỡng; hỏi "ánh sáng ở đây khác chỗ cũ không?" |
| Tiếng Anh dày đặc ở slide | Bé bỏ qua không đọc | Dùng bảng thuật ngữ của bài; đọc sau khi đã hiểu bằng tiếng Việt |
| Câu SDG 12 | Bé không biết đáp án | Thầy giải thích 1 câu: "dùng và làm ra đồ một cách có trách nhiệm" |

## Ghi chú về bản gốc
Điều đã thấy trong khi bóc tách bài này:
1. **Mục tiêu "quay đầu 180°" và "tìm lại vạch" chỉ có ở phần chữ** (Learn 10, Resolve 01), **chương trình mẫu không có** lệnh nào làm hai việc đó. Mẫu lùi 30 mm rồi xoay 35°.
2. **"Rẽ đối xứng" (đi phải thì về trái) không đúng trong mẫu**: lượt đi xoay phải 23°, phải 60°, trái 35°; lượt về xoay phải 35°, 60°, 35°. Đừng dạy thành quy tắc tuyệt đối.
3. **Lệnh kẹp**: mẫu dùng `LbGripper.moveTo(50)`. Giáo trình tổng §6 và nhãn khối nói mở = 0°, đóng = 90°; vậy 50° không phải đóng hết. Chưa rõ 50° là kẹp chặt hay không. **Cần thử trên robot thật.** Slide và câu hỏi 9 còn nói "mở rồi đóng", mà mẫu không có khối mở trước khi kẹp.
4. **Dừng ở ngã tư nào**: slide L16 viết "qua 2 ngã tư rồi dừng ở ngã tư **tiếp theo**". Theo cách đọc code, sau `followLineMultipleJunctions(N)` thì `line` vẫn là 15 nên `goToJunction` dừng ngay ở ngã tư thứ N, không đi thêm tới ngã tư N+1. Chưa chạy thử, cần xác nhận trên robot thật.
5. **Chỗ xuất phát**: slide Engage 07 ghi khu H (Digital Downtown) là "start zone and analysis lab", còn các slide khác ghi CRL là nơi xuất phát. Bài này dùng CRL. Slide 07 còn ghi khu B giống hệt khu A, và CRL mô tả giống khu E (có vẻ lỗi sao chép).
6. **Slide Learn 08** là hình do AI vẽ, chữ có chỗ lỗi ("Soopen()", "BROKEN BACKWARD PATH LOGIC", "Faulty line follow"). Dùng mã mẫu, không dùng hình này làm đặc tả.
7. Slide Resolve 01 viết sai chính tả "Practice Activites". Slide Learn 07 là trang tiêu đề trống.
8. Slide Learn 11 nêu cách nhận ra đích: A) hai cảm biến thấy ngã tư đen rộng, B) dùng thời gian ("không khuyến khích"), C) siêu âm phát hiện tường. **Mẫu chính thức không dùng cách nào** cả: nó đếm ngã tư rồi `Rotate`.
9. Slide Learn 10 kể bối cảnh "sau Nhiệm vụ 2, robot nhặt nguồn ô nhiễm mang về Base Zone". Mẫu `Analyst` là chương trình **độc lập**, xuất phát từ CRL.
10. **Tên ô như F4** suy từ slide Engage 05–06: F là khu, 4 là vị trí số 4 trong khu (mỗi khu có 4 vị trí đánh số 1–4). Chưa có slide nào nói thẳng.
11. Bài này có 3 chương (Engage, Learn, Resolve), không có chương Growth như giáo trình tổng §3 mô tả chung (4–5 chương).
12. Điểm: 45 + 320 + 100 = 465, thêm 40 thành 505, khớp slide Learn 06. Số 100 và 40 khớp §6.
13. Các số 500 và 1000 trong bài ôn luyện, và hàm `searchLine`, là đề xuất của người soạn, không có trong khóa gốc.

## Nộp bài trên Plearn
- Hoạt động của bài: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=63005> (H5P, 10 câu như trên).
- Giáo trình tổng §3 ghi mục nộp liên quan là **MINI PROJECT 5: Mission 3 – The Analysis Retrieval** ("Nộp Nhiệm vụ 3"), mở sau Bài 15.
- **Chưa lấy được**: mục nộp đòi hỏi gì (file, ảnh, video hay chỉ bấm hoàn thành), nút bấm nào, hạn nộp. Thầy mở trang Plearn của bé lần đầu, đọc đề rồi bổ sung vào đây.
- Trước khi bé bấm nộp, đi qua danh sách này:
  - [ ] Bé làm xong 10 câu H5P, Plearn ghi nhận hoàn thành.
  - [ ] Chương trình `Analyst` chạy được trọn vẹn trên robot thật hoặc Bản Sao Số.
  - [ ] Robot xuất phát nằm trọn trong CRL, không đè viền.
  - [ ] Khối chạm hoặc đè lên CRL khi kết thúc; cả hai bánh nằm trong CRL.
  - [ ] Bé đã chuyển nhãn khối sang tiếng Anh để thấy đúng tên trên Plearn (§4 giáo trình tổng).
