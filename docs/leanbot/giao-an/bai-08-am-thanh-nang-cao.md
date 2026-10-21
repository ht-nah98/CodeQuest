# Bài 8 — Phân loại âm thanh nâng cao

> Bài gốc: *Advanced Sound Classification* · 90 slide · 3 chương (Vỗ tay, Búng tay, Gõ bàn; mỗi chương 30 slide) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62973>

**Lưu ý hạng Creator:** hạng Creator không bắt buộc dùng AI khi thi, nhưng bài AI (Bài 5–9) là bắt buộc để lấy chứng chỉ khóa học. Dạy đủ, không cần luyện sâu.

Đây là bài **dài nhất khóa** và là bài AI: **không lập trình robot, không dùng khối Leanbot**. Bé dùng Teachable Machine (Audio Project) để dạy máy nghe 4 nhóm âm: Tiếng nền, Vỗ tay, Búng tay, Gõ bàn. Giáo án chia **3 buổi con**, mỗi buổi con làm một chương và lưu một file `.tm`.

| Buổi con | Chương | File bé lưu cuối buổi |
|---|---|---|
| A | Vỗ tay (Part 3) | `Audio_Lesson3_Clap.tm` |
| B | Búng tay (Part 4) | `Audio_Lesson4_Snap.tm` |
| C | Gõ bàn (Part 5) | `Final_Audio_Model_Class5A.tm` |

Buổi A mở file `Audio_Lesson2.tm` (có lớp Tiếng nền, làm ở bài trước). Mỗi buổi sau mở file của buổi trước, **không làm lại từ đầu**.

## Bé học xong thì làm được gì
- Mở lại file `.tm` cũ, thêm một nhóm âm mới, không làm lại từ đầu.
- Thu mẫu sạch và cân bằng: Tiếng nền 20, Vỗ tay 20–30, Búng tay khoảng 40 (có chỗ ghi 35), Gõ bàn 35.
- Dọn dữ liệu: nghe từng mẫu, xóa mẫu lẫn tiếng cười, gió, "xoẹt", rung bàn, bút rơi.
- Chạy thử mô hình và đạt ít nhất 8 trên 10 lần đúng.
- Sửa lỗi khi máy báo nhầm hoặc bỏ sót: thu thêm mẫu, chỉnh ngưỡng, đọc bảng nhầm lẫn.
- Lưu file `.tm` sau mỗi buổi, đặt đúng tên.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Laptop có micro, Chrome | Mỗi nhóm một máy; kiểm tra micro trước |
| File `Audio_Lesson2.tm` | Kết quả bài trước (lớp Tiếng nền). Thiếu file thì buổi A không bắt đầu được |
| Phòng yên tĩnh | Bé cười khúc khích, nói chen làm bẩn dữ liệu |
| Mặt phẳng để gõ | Cốc nhựa hoặc bàn gỗ; bìa sách; tường hoặc nhựa (buổi C). Bài về nhà cuối buổi B dặn bé tìm sẵn |
| Chỗ để laptop riêng | Buổi C: gõ cùng bàn thì laptop rung; nhấc laptop lên hoặc để bàn khác |
| Thư mục lưu file `.tm` | Mỗi nhóm một thư mục, ghi rõ tên nhóm |
| Ảnh chụp ảnh phổ thật của lớp (nên có) | Các slide mô tả ảnh phổ không khớp nhau, xem "Ghi chú về bản gốc" |

## Thuật ngữ của bài
Chỉ các từ mới. Từ đã có trong §5 giáo trình tổng (Threshold = Ngưỡng, Test = Chạy thử, Debug = Sửa lỗi) dùng đúng cách dịch ở đó. Từ đã có ở Bài 7 (ảnh phổ, trầm, bổng, nhiễu) không chép lại.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Impulse sound | Âm xung (tiếng "bốp" ngắn) | Rất to, rất ngắn, tắt ngay, như sấm chớp |
| Background Noise | Tiếng nền | Âm thanh bình thường quanh phòng khi không ai làm gì |
| Class | Nhóm âm (lớp) | Mỗi loại âm là một ngăn trong bộ não máy |
| Sample | Mẫu âm | Một đoạn thu ngắn để máy học |
| Train Model | Dạy máy (Huấn luyện) | Bấm nút để máy tự học từ các mẫu |
| False Positive | Báo nhầm | Máy báo "vỗ tay" nhưng không ai vỗ |
| False Negative | Bỏ sót | Con vỗ thật mà máy không phản ứng |
| Confusion Matrix | Bảng nhầm lẫn | Bảng ghi con làm gì, máy đoán gì, đúng hay sai |
| Data Balance | Cân bằng dữ liệu | Mỗi nhóm có số mẫu gần nhau, không 100 và 5 |
| Data Cleaning | Dọn dữ liệu | Xóa mẫu hỏng để máy khỏi học sai |
| Goldilocks Zone | Vừa đủ | Không quá ít, không quá nhiều mẫu |
| Success Rate | Tỉ lệ đúng | Đúng mấy lần trên 10 lần thử |
| Emergency Stop | Dừng khẩn cấp | Lệnh để robot dừng ngay khi nguy hiểm (gõ bàn) |
| Guard Mode | Chế độ canh gác | Búng tay để bật (dùng ở bài sau) |
| CLAP / SNAP / KNOCK | VO_TAY / BUNG_TAY / GO_BAN | Tên nhóm âm; tên gốc viết hoa, tên Việt là gợi ý của slide |

## Công cụ dùng trong bài
| Công cụ | Địa chỉ | Làm gì |
|---|---|---|
| Teachable Machine (Audio Project) | <https://teachablemachine.withgoogle.com> | Thu mẫu, dạy máy, chạy thử |
| Plearn, bài "Advanced Sound Classification" | <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62973> | Xem slide |

Các thao tác trong Teachable Machine (theo slide):
- Mở file cũ: vào trang → menu 3 gạch → "Open from file" → chọn file `.tm`.
- Thêm nhóm: "Add a Class", đổi tên (viết HOA cho rõ).
- Thu mẫu: chọn nhóm → nút Mic → ghi mặc định 20 giây (Record 20s).
- Nghe lại mẫu nhỏ, xóa mẫu hỏng.
- "Train Model": đừng chuyển tab khi máy đang học.
- Chạy thử: cột Preview; tắt "Input On" khi cần; thanh Threshold (ngưỡng).
- Lưu: "Download project as file". **Lưu là bắt buộc.**

## Dạy thế nào
Thời lượng dưới đây là **gợi ý của giáo án**, không phải của khóa gốc. Khóa gốc không ghi phút. Giáo trình tổng xếp Bài 7 + Bài 8 vào một buổi 90 phút, nhưng Bài 8 có 90 slide, nên giáo án này tách thành 3 buổi con (xem "Ghi chú về bản gốc").

### Mở bài (5 phút, đầu buổi A)
Hỏi: "Robot nghe thấy con vỗ tay, búng tay, gõ bàn. Làm sao nó biết là tiếng nào?" Nhắc Bài 7: AI *nhìn* ảnh phổ. Hôm nay con dạy máy bằng ví dụ của chính con. Cảnh báo: **"Hôm nay xây tiếp, không làm lại. Mở file cũ."**

Đầu mỗi buổi B và C, mở bài 2 phút: "Mở file buổi trước ra. Có đủ các nhóm chưa?"

---
### Buổi A: Vỗ tay (45–60 phút gợi ý)

#### Giảng
1. **Mở file cũ (Part 3, slide 01–02).** Làm cùng bé: vào trang, menu 3 gạch, "Open from file", chọn `Audio_Lesson2.tm`.
2. **Thêm nhóm VO_TAY (slide 03).** "Add a Class", đổi tên thành CLAP (hoặc VO_TAY), viết hoa.
3. **Khoa học của tiếng vỗ tay (slide 04–07).** Vỗ tay là âm xung: rất to, cực nhanh (dưới 1 giây), tắt ngay, kêu "BỐP". Trên ảnh phổ, tiếng nền là đám mây ngang mờ, vỗ tay là một đường thẳng đứng như cột điện. Vỗ đúng: lòng bàn tay mở rộng, vỗ dứt khoát, tiếng "POP". Vỗ sai: tay khum (rỗng), tay cọ vào nhau, ra tiếng "thụp" hay "xoẹt".
4. **Quy tắc 1 giây (slide 08–09).** Teachable Machine cắt âm thanh thành đoạn 1 giây. Vỗ quá nhanh hoặc quá chậm thì máy có thể cắt đúng lúc con chưa vỗ. Nhịp 1–1: vỗ, chờ 1 giây, vỗ, chờ 1 giây. Không vỗ liền tay. "Để máy kịp chụp ảnh từng cái vỗ."
5. **Thu mẫu (slide 10–13).** Chọn nhóm CLAP, ghi 20 giây mặc định, tay sẵn sàng trên nút Mic. Làm theo nhóm: bấm ghi, thay phiên nhau vỗ vào Mic, giữ nhịp, chuyền Mic cho bạn (tay to, tay nhỏ). Nhìn sóng cuộn trên màn hình: có vệt đỏ hoặc cam là tốt. Kiểm tra: nghe từng mẫu nhỏ, phải có tiếng "POP"; chỉ có gió hoặc im lặng thì xóa.
6. **Bao nhiêu mẫu là đủ (slide 14).** Nhắm **20–30 mẫu CLAP chất lượng** (slide minh họa 25). Ít quá, máy không nhớ. Nhiều quá, máy học chậm. Gọi là "vừa đủ".
7. **Đa dạng (slide 15–16).** Vỗ gần (to) và đứng cách 2 mét (nhỏ). Vỗ nhanh "bốp-bốp" và vỗ chậm "bốp..... bốp.....". Dạy máy: to hay nhỏ, "POP" vẫn là vỗ tay.
8. **Dọn dữ liệu (slide 17).** Có ai cười lúc vỗ không? **Xóa mẫu đó.** Không thì sau này con cười, robot tưởng con vỗ tay.
9. **Dạy máy (slide 18).** Kiểm tra: Tiếng nền khoảng 20 giây xong; CLAP 20–30 mẫu xong. Bấm "Train Model". Chờ, **không chuyển tab**.

#### Bé tự làm: chạy thử (slide 19–24)
1. **Im lặng:** ngồi yên. Tiếng nền phải khoảng 98%, Clap gần 0. Nếu thanh Clap nhấp nháy khi con ngồi yên thì chưa đạt.
2. **Vỗ một lần:** Tiếng nền khoảng 5%, Clap khoảng 95%. Thanh Clap nhảy lên gần 100% rồi tụt ngay, như lò xo.
3. **Đánh lừa AI:** thử nói "POP" bằng miệng, thử gõ bàn. Nếu gõ bàn bị nhận là CLAP thì máy bối rối vì cả hai đều là âm xung. Buổi C sẽ sửa.
4. **Chỉnh ngưỡng:** chạm nhẹ cũng báo CLAP? Kéo thanh ngưỡng **lên 0.85–0.90** (slide hiện 0.85): phải vỗ thật to máy mới báo. Nói với bé: "Ngưỡng càng cao, máy càng khó báo."
5. **Báo nhầm:** báo "Clap" mà không ai vỗ. Nguyên nhân: tiếng nền bẩn (lẫn tiếng click). Cách sửa: thu các tiếng click đó vào nhóm Tiếng nền.
6. **Bỏ sót:** vỗ mỏi tay mà máy im. Nguyên nhân: vỗ quá nhỏ hoặc micro kém. Cách sửa: vỗ to hơn.

Tiêu chí xong buổi A (slide 25, "10 điểm"): im lặng ra Tiếng nền 100%, vỗ tay ra Clap 100%.

#### Chốt bài buổi A (5 phút)
**Lưu file** (slide 26): "Download project as file", tên `Audio_Lesson3_Clap.tm`. "File này quý như vàng, có cả Tiếng nền và Vỗ tay." Ứng dụng ngoài đời (slide 27): công tắc thông minh, vỗ bật vỗ tắt; robot được gọi lại gần bằng vỗ tay. Hỏi gợi mở (slide 28): "Búng tay cũng kêu 'bốp'. Máy có phân biệt được không?" Dặn: tập búng tay ở nhà.

---
### Buổi B: Búng tay (45–60 phút gợi ý)

#### Giảng
1. **Mở file (Part 4, slide 01).** Mở `Audio_Lesson3_Clap.tm`. Kiểm tra phải có "Noise" và "Clap".
2. **Thêm nhóm BUNG_TAY (slide 02).** "Add a Class", đổi tên SNAP (hoặc BUNG_TAY). Bây giờ não máy có 3 ngăn: Tiếng nền, Vỗ tay, Búng tay.
3. **Nghe và so sánh (slide 03–04).** Vỗ tay kêu "POP", nặng hơn, như trống bass (âm trầm). Búng tay kêu "CLICK", sắc hơn, như tam giác hay chuông (âm bổng). Máy "nhìn" ảnh phổ thấy được sự khác nhau.
4. **Ảnh phổ (slide 05).** Vỗ tay: cột trụ to, vệt sáng dày. Búng tay: kim nhọn mảnh, màu dồn lên phía trên. AI tìm "cây kim trong đống rơm".
5. **Vì sao dễ nhầm (slide 06).** Cả hai đều cực nhanh (dưới 1 giây). Micro kém làm mất phần "sắc" của búng tay, thế là Búng tay thành Vỗ tay.
6. **Bé không búng được (slide 07).** Đừng chỉ cọ ngón (ra tiếng "xoẹt"). Dùng chặc lưỡi, âm "tốc/click".
7. **Cách thu (slide 08–09).** Ngón cái và ngón giữa, tiếng phải GIÒN. Đưa tay gần Mic (búng tay nhỏ hơn vỗ tay). Nhịp: click, nghỉ 1 giây, click. "Cho máy thở."
8. **Số mẫu (slide 10).** Mục tiêu **40 mẫu SNAP**, nhiều hơn Vỗ tay vì búng tay khó nhận hơn.
9. **Dọn dữ liệu (slide 11–12).** Xóa "xoẹt" (cọ xát) và "hehe" (cười). Giữ "click" sắc, "tốc" rõ. Đa dạng: tay trái, tay phải, gần, xa.
10. **Cân bằng (slide 13).** Tiếng nền **20**, Vỗ tay **30**, Búng tay **40**. Đừng để bên này 100, bên kia 5.
11. **Kiểm tra lẫn (slide 14).** Lúc thu SNAP có ai vô tình vỗ tay không? Lẫn tiếng Clap vào nhóm SNAP thì máy rối mãi.
12. **Dạy máy (slide 15–16).** "Train Model". Máy học phân biệt "cột trụ" (Clap) và "cây kim" (Snap). "Hai anh em sinh đôi, máy có phân biệt được không?"

#### Bé tự làm: chạy thử (slide 17–25)
1. Chuyển sang cột Preview, tắt "Input On".
2. **Im lặng:** Tiếng nền khoảng 98%, Clap và Snap thấp; thanh phải đứng yên.
3. **Vỗ tay:** Clap khoảng 95%, Snap thấp.
4. **Búng tay:** Snap khoảng 95%, Clap thấp.
5. **Lỗi vỗ ra Snap:** vỗ quá nhỏ hoặc bằng đầu ngón (quá sắc). Sửa: thu kiểu vỗ đó vào nhóm CLAP, dạy "đây cũng là vỗ tay".
6. **Lỗi búng ra Clap:** tiếng búng đục, trầm. Sửa: búng lại cho giòn và thu vào nhóm SNAP.
7. **Bảng nhầm lẫn (slide 23):** ghi Con làm gì / Máy đoán gì / Kết quả. Vỗ-Clap: đúng. Vỗ-Snap: sai. Búng-Snap: đúng. Búng-Clap: sai.
8. **Trò chơi Nhạc trưởng robot (slide 24):** thầy ra hiệu CLAP, cả lớp vỗ, nhìn màn hình. Ra hiệu SNAP, cả lớp búng, nhìn màn hình.
9. **Điểm cuối (slide 25):** **8 trên 10** lần đúng thì mô hình tốt. Sai 1–2 lần là bình thường với AI trên web.

#### Chốt bài buổi B (5 phút)
**Lưu file** (slide 26): `Audio_Lesson4_Snap.tm`, "giờ có 3 báu vật: Tiếng nền, Vỗ tay, Búng tay". Slide 27 nhắc phim Thanos (búng tay xóa nửa vũ trụ); ảnh có bản quyền ngoài, không dùng lại; chỉ nói: robot của mình hiền hơn, búng tay để bật chế độ canh gác. Hỏi gợi mở (slide 28): "Vỗ tay và búng tay đều là tiếng đơn. Robot cần dừng khẩn cấp thì sao? Cần nhịp dài hơn." Bài về nhà (slide 29): tìm một mặt phẳng, cốc nhựa hoặc bàn gỗ, tập gõ.

---
### Buổi C: Gõ bàn (45–60 phút gợi ý)

#### Giảng
1. **Mở file (Part 5, slide 01).** Mở `Audio_Lesson4_Snap.tm`; đảm bảo 3 nhóm đều có.
2. **Thêm nhóm GO_BAN (slide 02–03).** "Add a Class", đổi tên KNOCK (hoặc GO_BAN). Đây là lệnh "Dừng! Nguy hiểm!". Robot đang chạy mà gặp nguy hiểm, ta theo bản năng đập bàn "BANG!". Tiếng gõ khác tiếng nói.
3. **Khoa học (slide 04–05).** Búng tay như chim hót (âm bổng). Gõ bàn như trống trường (âm trầm), nặng "thụp thụp". Trên ảnh phổ: tảng đá nằm dưới đáy, màu đỏ sẫm, thấp, nặng.
4. **Dụng cụ gõ (slide 06–07).** Móng tay kêu "click click", quá giống búng tay. Đốt ngón tay kêu "thụp thụp", hoàn hảo. Nhịp: THỤP THỤP THỤP, 3 cú nhanh trong 1 giây, như gõ cửa.
5. **Kỹ thuật và an toàn (slide 08).** Nắm tay, dùng mặt sau các ngón, gõ lên bàn. Gõ đủ để có tiếng, đừng làm đau tay.
6. **Cảnh báo rung (slide 09).** Gõ cùng bàn với laptop thì laptop rung, micro thu tiếng "ù ù" thay vì "thụp". Nhấc laptop lên, hoặc gõ nhẹ.
7. **Thu mẫu (slide 10–12).** Chọn nhóm KNOCK, nhịp "gõ-gõ-gõ... nghỉ...", thay phiên. Đa dạng chất liệu: bàn gỗ, bìa sách, tường hoặc nhựa. Đa dạng mạnh nhẹ: gõ mạnh (khẩn cấp) và gõ nhẹ (nhắc nhở). Thu khoảng **35 mẫu**.
8. **Dọn dữ liệu (slide 13, 15).** Xóa "bùm" do rung, tiếng bút rơi. Giữ "thụp thụp" rõ. Kẻ giả mạo: bút rơi nghe giống gõ, xóa các mẫu lẫn.
9. **Cân bằng (slide 14).** Tiếng nền **20**, Vỗ tay **30**, Búng tay **35**, Gõ bàn **35**. "Bộ ba mạnh mẽ đã cân bằng." (Buổi B ghi Búng tay 40, xem "Ghi chú về bản gốc".)
10. **Dạy máy (slide 16).** Lần này **chờ lâu nhất** từ đầu bài, vì máy học 4 nhóm.
11. **Nghỉ (slide 17).** "Thả lỏng tay, lắc tay!" Gõ 10 phút là mệt.

#### Bé tự làm: trận chiến âm thanh (slide 18–24)
1. **Chạy thử cả 4 nhóm** (slide 18).
2. **Gõ ra Clap (slide 19):** gõ mạnh mà máy nói CLAP; nguyên nhân âm quá to và sắc. Sửa: gõ sâu và thấp hơn bằng phần thịt của tay.
3. **Đập bàn bằng lòng bàn tay (slide 20):** tiếng "bốp" bổng, ra CLAP. Gõ bằng nắm đấm, tiếng "thụp" trầm, ra KNOCK. **Dùng nắm đấm.**
4. **Dậm chân (slide 21):** ra KNOCK; chấp nhận được. Dậm chân để dừng robot cũng hay.
5. **Gõ phím (slide 22):** có thể bị nhầm là Búng tay. Sửa: thu tiếng gõ phím vào Tiếng nền, rồi dạy máy lại.
6. **Thử thách tổ hợp (slide 23):** CLAP, CLAP, KNOCK, SNAP, KNOCK. "Con làm cho các thanh nhảy theo nhịp này được không?"
7. **Đánh giá (slide 24):** trên 80% đúng là xuất sắc. Đoán bừa thì kiểm tra micro, phòng có quá ồn không.

#### Chốt bài buổi C (5 phút)
**Lưu file** (slide 26): `Final_Audio_Model_Class5A.tm`. "Mất file này là robot bị điếc." Tóm tắt giai đoạn 1 (slide 27): dữ liệu sóng; nền Tiếng nền; phân biệt Vỗ tay / Búng tay / Gõ. Báo trước (slide 28): tạm biệt Teachable Machine, chào Leanbot; robot sẽ học "chiêu đặc biệt". Bài về nhà (slide 29): tập tổ hợp. Đây là "bộ não" cho giai đoạn 3.

## Các bước làm mẫu
Bài này không có chương trình Blockly hay code C++. Các bước làm mẫu là chuỗi việc trong Teachable Machine, ba lần liên tiếp.

- Buổi A
  - Mở `Audio_Lesson2.tm` (có Tiếng nền)
  - Thêm nhóm CLAP, thu 20–30 mẫu, nhịp 1 giây
  - Dạy máy, chạy thử, lưu `Audio_Lesson3_Clap.tm`
- Buổi B
  - Mở `Audio_Lesson3_Clap.tm`
  - Thêm nhóm SNAP, thu khoảng 40 mẫu
  - Dạy máy, chạy thử, lưu `Audio_Lesson4_Snap.tm`
- Buổi C
  - Mở `Audio_Lesson4_Snap.tm`
  - Thêm nhóm KNOCK, thu khoảng 35 mẫu
  - Dạy máy, chạy thử, lưu `Final_Audio_Model_Class5A.tm`

Bộ số liệu thu mẫu theo slide:

| Thời điểm | Tiếng nền | Vỗ tay | Búng tay | Gõ bàn |
|---|---|---|---|---|
| Buổi A (slide 18, 14) | khoảng 20 giây | 20–30 (minh họa 25) | chưa có | chưa có |
| Buổi B (slide 13) | 20 | 30 | 40 | chưa có |
| Buổi C (slide 14) | 20 | 30 | 35 | 35 |

Ngưỡng và tỉ lệ đúng cần đạt:

| Thứ | Giá trị |
|---|---|
| Im lặng | Tiếng nền khoảng 98% |
| Vỗ tay / Búng tay | Nhóm đúng khoảng 95% |
| Ngưỡng khi quá nhạy | kéo lên 0.85–0.90 (thanh hiện 0.85) |
| Tỉ lệ đúng buổi B | 8 trên 10 |
| Tỉ lệ đúng buổi C | trên 80% |
| Quy tắc đoạn thu | 1 giây; nghỉ 1 giây giữa hai tiếng |

## Phiếu ôn luyện

**1. Dịch nhãn.** Nối: Background Noise, Class, False Positive, False Negative, Confusion Matrix, Data Balance.

**Đáp án:** Tiếng nền; nhóm âm; báo nhầm; bỏ sót; bảng nhầm lẫn; cân bằng dữ liệu.

**2. Điền số.** Hoàn thành bảng mẫu cho mô hình cuối: Tiếng nền ___, Vỗ tay ___, Búng tay ___, Gõ bàn ___. Vì sao bốn số gần nhau?

**Đáp án:** 20, 30, 35, 35 (theo buổi C; buổi B ghi Búng tay 40). Gần nhau để máy không thiên vị nhóm nhiều mẫu nhất, tức là cân bằng dữ liệu.

**3. Sắp thứ tự.** Xếp các việc của một buổi: Dạy máy; Mở file cũ; Lưu file; Thu mẫu; Thêm nhóm mới; Chạy thử; Dọn mẫu hỏng.

**Đáp án:** Mở file cũ → Thêm nhóm mới → Thu mẫu → Dọn mẫu hỏng → Dạy máy → Chạy thử → Lưu file.

**4. Dọn dữ liệu (giữ hay xóa).** Sáu mẫu: tiếng cười, "xoẹt", click sắc, gió, thụp rõ, bút rơi. Mẫu nào giữ, mẫu nào xóa?

**Đáp án:** Giữ: click sắc (nhóm Búng tay), thụp rõ (nhóm Gõ bàn). Xóa: tiếng cười, "xoẹt", gió, bút rơi.

**5. Đọc đoán kết quả.** Con ngồi im mà thanh Clap nhấp nháy, báo "Clap". Còn một lần con búng tay, máy báo Clap. Máy làm gì, vì sao?

**Đáp án:** Lần đầu là báo nhầm, có thể do tiếng nền bẩn lẫn tiếng click. Lần sau là nhầm Búng tay thành Vỗ tay: tiếng búng đục, trầm. Không phải bỏ sót, vì máy vẫn báo.

**6. Tìm lỗi.** Một nhóm có Tiếng nền 20, Vỗ tay 30, Búng tay 5, Gõ bàn 100 mẫu, và sau đó vỗ tay máy hay báo Gõ. Sai ở đâu, sửa thế nào?

**Đáp án:** Mất cân bằng: Búng tay thiếu (cần khoảng 35–40), Gõ bàn thừa (giảm về khoảng 35). Dạy máy lại.

**7. Tìm lỗi (chọn cách sửa).** Nối lỗi với cách sửa: (a) vỗ tay mà máy nói SNAP; (b) gõ mạnh mà máy nói CLAP; (c) im lặng mà báo CLAP; (d) gõ cùng bàn laptop mà máy không nhận.

**Đáp án:** (a) thu thêm kiểu vỗ đó vào nhóm CLAP; (b) gõ bằng nắm đấm, thấp hơn; (c) thu các tiếng click vào Tiếng nền; (d) nhấc laptop lên hoặc gõ nhẹ.

**8. Đọc đoán kết quả (bảng nhầm lẫn).** Con làm 10 lần thử và máy đoán đúng 8 lần. Mô hình có tốt không? Nếu khóa gốc nói "xuất sắc là trên 80%" thì sao?

**Đáp án:** Theo buổi B, 8/10 là tốt. Nhưng 8/10 bằng đúng 80%, không phải "trên 80%" của buổi C. Hỏi thầy, hoặc thử thêm vài lần để đạt cao hơn. Đây là một chỗ lệch của khóa gốc.

**9. Làm trên máy.** Mở `Final_Audio_Model_Class5A.tm`. Làm theo thứ tự CLAP, CLAP, KNOCK, SNAP, KNOCK và chụp màn hình thanh kết quả sau mỗi tiếng. Có mấy tiếng đúng?

**Đáp án:** đáp án mở. Khóa gốc đòi "trên 80% đúng"; với 5 tiếng, 4/5 chỉ bằng đúng 80%, nên cần 5/5, hoặc thử nhiều lượt rồi tính. Thầy xem bé sửa tiếng sai bằng cách nào (thu thêm mẫu, đổi cách gõ).

**10. Làm trên máy (gỡ lỗi).** Thử đập bàn bằng lòng bàn tay rồi bằng nắm đấm. Máy báo gì mỗi lần?

**Đáp án:** Lòng bàn tay: tiếng bổng "bốp", ra CLAP. Nắm đấm: tiếng trầm "thụp", ra KNOCK.

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc **không có câu hỏi trắc nghiệm** trong 90 slide. Chỉ có các bài kiểm thử thực hành:

| Bài kiểm thử | Yêu cầu | Đạt |
|---|---|---|
| Test 1 Im lặng | ngồi yên | Tiếng nền khoảng 98%; thanh Clap nhấp nháy = chưa đạt |
| Test 2 CLAP | vỗ một lần | Clap khoảng 95% |
| Test 3 SNAP | búng một lần | Snap khoảng 95% |
| Nhạc trưởng robot | thầy ra hiệu CLAP/SNAP | 8/10 |
| Thử thách tổ hợp | CLAP, CLAP, KNOCK, SNAP, KNOCK | trên 80% đúng |

File phân tích gốc (analysis.txt) có thể có câu trắc nghiệm của Bài 8; chưa kiểm tra trong lần soạn này.

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Thuật ngữ trừu tượng (impulse, threshold, false positive…) | Bé im, hoặc đoán bừa | Dùng từ Việt trong bảng, kèm ví dụ: "ngưỡng càng cao càng khó báo" |
| Chỉnh ngưỡng bằng số thập phân 0.85–0.90 | Bé kéo lung tung | Chỉ nói: kéo lên thì khó báo hơn; làm cùng bé từng nấc |
| Các slide tả ảnh phổ không thống nhất | Bé hỏi "vỗ tay là thấp hay cao?" | Chọn một cách nói: vỗ tay = cột đứng, búng tay = kim mảnh trên cao, gõ = tảng đá dưới đáy |
| Búng tay chưa được | Mẫu toàn "xoẹt" | Cho chặc lưỡi, tiếng "tốc/click" |
| Cười khúc khích, nói chen khi thu | Mẫu lẫn tiếng cười | Thu từng bạn, yên lặng; nghe lại và xóa |
| Gõ cùng bàn laptop làm rung | Tiếng "ù ù", không có "thụp" | Nhấc laptop lên hoặc gõ nhẹ |
| Đập bàn bằng lòng bàn tay | Máy báo Clap | Dùng nắm đấm; nhắc an toàn, đừng làm đau tay |
| Quên lưu file hoặc đặt sai tên | Buổi sau mở không ra | Dặn lưu cuối mỗi buổi; thầy xem tên file trước khi bé ra về |
| Phòng ồn | Máy đoán bừa | Chọn phòng yên tĩnh; nếu vẫn ồn thu thêm tiếng nền |
| Gõ 10 phút thì mỏi tay | Bé nhăn mặt | Cho nghỉ, lắc tay |

## Ghi chú về bản gốc
- **Số mẫu Búng tay không nhất quán:** buổi B (Part 4) mục tiêu 40 mẫu, bảng cân bằng ghi 40; buổi C (Part 5, slide 14) bảng cân bằng ghi 35. Giáo án này giữ cả hai và nêu rõ theo buổi; thầy chọn một con số cho cả lớp.
- **Số mẫu Vỗ tay:** slide 14 (Part 3) ghi nhắm 20–30, minh họa 25; Part 4 và Part 5 ghi 30.
- **Tiếng nền:** Part 3 ghi "khoảng 20 giây"; Part 4 và Part 5 ghi "20" (không nói đơn vị). Giáo án hiểu cả hai là cùng một lượng thu.
- **Ngưỡng đạt:** Part 4 slide 25 nói "8 trên 10 là tốt"; Part 5 slide 24 nói "trên 80% là xuất sắc". 8/10 = 80%, chưa vượt 80%. Hai ngưỡng lệch nhau một chút.
- **Mô tả ảnh phổ lệch nhau:** Part 3 nói vỗ tay "đánh thức mọi tần số" (slide 06), Part 4 nói vỗ tay như trống bass, tần số thấp (slide 04) và là "cột trụ to", Part 5 gọi vỗ tay là "cột điện vút lên". Cần chọn một cách nói thống nhất khi dạy.
- **Đánh số bài trong slide không nhất quán:** slide 00 ghi "Lesson 1: The Clap / Audio Project 1", slide 18 ghi "Part 3: Training", slide 25 ghi "Lesson 3 Complete!"; Part 4 ghi "Lesson 4", Part 5 ghi "Lesson 5". Đây đều là các buổi con của Bài 8.
- **Ảnh hỏng hoặc không phù hợp:** slide Part 3-27 (ảnh "Smart Switch" hỏng, hiện chữ); Part 4-27 (ảnh găng tay Thanos, có bản quyền ngoài); Part 5-05 (ảnh là sơ đồ DFT, không phải ảnh phổ thật của tiếng gõ); nhiều ảnh stock có watermark.
- **Chữ bị che:** Part 5 slide 29, dòng cuối còn "Imagine: What will the Robot do when you K…?". Đoán là "Knock?".
- **Giáo trình tổng §7 xếp Bài 7 + Bài 8 chung buổi 10 (90 phút).** Bài 8 có 90 slide, 3 phần, mỗi phần có thu mẫu, dạy máy, chạy thử và lưu file. Không vừa một buổi nếu dạy đủ. Cần HLV quyết: tách ra thêm buổi, hay rút gọn (ví dụ chỉ làm trọn buổi A và B, giữ buổi C cho buổi sau).
- Các con số trong §6 giáo trình tổng không có số nào thuộc Bài 8; không có mâu thuẫn với §6.
