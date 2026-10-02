# Câu hỏi chờ huấn luyện viên (GĐ 1)

Gom từ các task P1-01 → P1-15. Mỗi câu ghi lựa chọn AI đang dùng tạm. Anh chỉ cần trả lời những câu muốn đổi; câu nào không trả lời thì giữ như hiện tại. Sau khi trả lời, xóa câu đó khỏi file (hoặc ghi "Đã chốt: …").

## A. Luật chơi
1. **Lặp thừa vẫn thắng?** Măng chạm cờ/đích là thắng ngay, kể cả giữa vòng lặp, nên đặt "lặp 20 lần" vẫn qua nhiều màn. Thế giới 2 đã thêm "đuôi" sau vòng lặp ở l07, l11, l16, l18, boss để lặp thừa thì ngã. *Đang dùng:* giữ luật cũ + đuôi trong nội dung. Có muốn đổi luật thành "chỉ thắng khi hết chương trình" (sẽ phải sửa lại Thế giới 1) không?
2. **Cúi trên đất trống = đi.** Khối "cúi" đi 1 ô giống "đi". Bé có thể dùng "cúi" thay "đi" mà không bị trừ sao. Có cần phạt không (ảnh hưởng Thế giới 4 "nếu có cành thì cúi")?
3. **Nhảy qua măng thì không nhặt được** (chỉ nhặt khi Măng dừng ở ô đó). Đúng ý anh?
4. **Đá vào ô trống** tốn 1 khối nhưng không tính là thua. Được không?
5. **Mê cung:** đứng ở ô đích nhưng chưa nhặt hết măng, khối "đã tới đích?" trả về *đúng*. Được không?
6. **Màn sáng tạo:** khi Măng rơi hố/đụng tường vẫn hiện câu phản hồi và rung khối. Có muốn chế độ sáng tạo hoàn toàn trung tính không?
7. **Số lần lặp** của khối lặp: mặc định 3, cho chọn 1–20. Đúng không?

## B. Phần thưởng
1. **Đoán kết quả:** số lần đoán tính qua mọi lần chơi (thoát ra vào lại không lấy lại 3 sao). Đồng ý?
2. **Gợi ý tầng 1 miễn phí** (sau 3 lần thua) thì giữ miễn phí mãi cho màn đó. Đồng ý?
3. **Chương trình rỗng / quá số khối** không tính là lượt thua, không mất "đúng ngay lần đầu". Đúng ý?
4. **Mua gợi ý tầng 3 rồi thắng ngay lượt đầu** vẫn được "+5 đúng ngay lần đầu" (đúng theo `rewards-economy.md` hiện tại). Có muốn bỏ khi đã xem lời giải?
5. **Màn sáng tạo** không tính là "ngày có học" (không thưởng ngày, không chuỗi). Đúng?
6. **Đọc lại bài giảng cũ** vẫn được thưởng ngày. Được không?
7. **Xu âm** khi 2 máy cùng tiêu lúc mất mạng (GĐ 2): UI hiện `max(0, số dư)`. Xử lý "nợ" thế nào?

## C. Câu chữ cho bé (chỉ cần duyệt nhanh)
1. Câu phản hồi chung đã đổi để nói đúng nguyên nhân: `HIT_WALL` "Ối, tường! Măng rẽ đúng chỗ, đúng phía chưa?", `FELL_IN_HOLE` "Ối, hố! Nhảy ngay trước hố nhé.", `NOT_AT_GOAL` "Hết khối rồi mà Măng chưa tới nơi."
2. Nhãn cảm biến "phía trước có **ô trống**" (trước là "trống", dễ hiểu nhầm là cái trống).
3. Menu chuột phải: "Hoàn tác" / "Làm tiếp" (thay "Làm lại" để không trùng nút Làm lại).
4. Chọn hồ sơ: "Chọn hình đại diện của con" — con vật chỉ là ảnh đại diện, nhân vật luôn là Măng.
5. Nhắc nghỉ 25 phút: "Mình chơi lâu rồi. Đứng dậy vươn vai nhé!" — có cần bắt nghỉ thật (nút khóa 2–5 phút)?

## D. Giao diện & trải nghiệm
1. Space khi Măng đang chạy = **Dừng** (về đầu). Nút tạm dừng riêng là nút biểu tượng ❚❚. Có muốn Space = tạm dừng/tiếp tục?
2. Thiếu bước (NOT_AT_GOAL) thì khối cuối bị rung dù khối đó đúng. Giữ hay không rung?
3. Chế độ ghép hình: khối rời giữ màu, viền đứt nét. Dễ đọc chưa?
4. Đoán kết quả: chọn thẻ xong báo đúng/sai ngay rồi mới chạy cho xem. Hay muốn giữ hồi hộp (chạy xong mới báo)?
5. Gợi ý tầng 0 hiện sau 1,5 giây khi thua; bé bấm chạy lại nhanh sẽ không thấy. Đúng nhịp chưa?
6. Măng rơi hố thì biến mất tới khi Làm lại (chờ sprite choáng P0-08).
7. Mê cung: Măng nhỏ hơn ở runner (tối thiểu 64 px), mũi tên xanh chỉ hướng. Đủ rõ chưa?
8. PIN 4 số, không khóa khi nhập sai, hỏi PIN một lần mỗi tab. Đổi người chơi chỉ cần PIN. Được không?
9. File sao lưu chứa **mọi hồ sơ** trên máy; khôi phục giữ PIN cũ; trùng biệt danh thì bỏ qua và báo. Đúng ý?

## E. Âm thanh
1. Phong cách: chiptune nhẹ, "boing" thay còi báo lỗi. 2 bản nhạc nền là bản tạm do máy tạo. Giữ hay thay?
2. **Chọn dịch vụ giọng đọc tiếng Việt** (hoặc thu âm thật). Cách cắm vào: `tools/voice/README.md`.
3. Câu nào được đọc to? Hiện: mọi câu cố định trong nội dung + `feedback.json` + ~60 câu giao diện. Có đọc cả câu chuyện thế giới, thẻ đáp án không?
4. Nhạc nền bật mặc định? Âm lượng mặc định 0,8 cho cả 3 kênh.

## F. Nội dung Thế giới 1–2 (cần anh chơi thử từng màn — P1-12, P1-13)
1. W1-l03: đường 5 ô, hố ở ô 3. Độ dài ổn?
2. W1-l06: hố ngay ô đầu (phá thói quen "đi trước"). Quá khó cho màn 6?
3. W1 màn sáng tạo và W2 màn sáng tạo: đường cố định, chưa có trình dựng đường. Tạm chấp nhận?
4. W1-l12 (mê cung đầu): chỉ cần "rẽ phải", "rẽ trái" là khối gây nhiễu. Được không?
5. Bài giảng Thế giới 1 chưa có thẻ "đổi thứ tự thì kết quả đổi" (đã đủ 6 thẻ). Có muốn thay một thẻ?
6. W2-l17 thử thách thắng giữa vòng lặp? (đã thiết kế lại thành "Bậc thang và hành lang").
7. W2-l18: bé di chuyển khối nhảy thay vì chép thì phải sửa 4 chỗ (1 sao). Chấp nhận cho màn thử thách?
8. Giao diện Thế giới 2 đang dùng chung bộ tile với Thế giới 1. Có muốn khác màu/khác cảnh?
9. Nhãn thẻ đoán W2-l10 "Đụng tường góc trên bên phải" dài 6 chữ (giới hạn khuyến nghị 4). Rút gọn?
