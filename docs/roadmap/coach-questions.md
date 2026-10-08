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
10. **Truyện chia chương (P2-24):** mở một chương mới **không** thưởng xu (`rewards-economy.md` chưa có nguồn này; xu đã đến từ chính màn mở chương). Có muốn +5 xu mỗi chương mới không? *Tạm dùng:* không thưởng. Lời truyện W1–W5 nằm trong `world.json` (`chapters`); anh đọc duyệt câu chữ, nhất là các chi tiết thêm: W3 Thỏ Bông ghé xưởng rồi đi về phía Ngã Ba, W4 chiếc khăn của Bông bên suối, W5 Gà con lạc trong bãi lau và kết "Làng ở ngay sau ngọn đồi" để mở W6.

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
10. **Bài "Khối mới"** (góp ý 03/10/2026: bé hiểu sai mỗi khối làm Măng đi bao xa). Thế giới 1 có thêm 4 bài ngắn, mỗi bài là một quyển sách nhỏ gắn trên viên đá của màn có khối mới: nhảy (trước `l03`), cúi (trước `l07`), đá (trước `l10`), tiến và rẽ (trước `l12`). Mỗi bài có ví dụ chạy được cho thấy Măng dừng ở ô nào. Còn hai điều chưa rõ:
    - **Có khóa màn tới khi xem bài không?** *Tạm dùng:* không khóa. Măng nhắc "Có khối mới! Xem bài khối mới trước nhé." và quyển sách nhấp nháy. Khóa thì chắc bé xem, nhưng bé đã qua màn đó (hồ sơ cũ) cũng không bị chặn.
    - **Xu:** mỗi bài giảng xem lần đầu +5 xu, nên Thế giới 1 thêm 20 xu. *Tạm dùng:* giữ +5 cho mọi bài.
    - Câu dạy nhảy: anh nói "nhảy đến trước 1 ô"; luật thật là bay qua ô kế bên, đáp xuống ô thứ 2 (đi xa 2 ô, cả trên đất bằng). Mọi chỗ (bài, gợi ý, chú thích khối) nói "Nhảy: bay qua 1 ô, đáp xuống ô thứ 2"; bài có thêm ví dụ nhảy trên đất bằng. Anh xem câu này đã dễ hiểu chưa.
11. **Thưởng ngày khi đọc lại bài giảng** (câu B6). Bài "Khối mới" chỉ 4–5 thẻ, nên đọc lại một bài cũ là cách rất rẻ để lấy +10 xu thưởng ngày và giữ chuỗi ngày học. *Đề xuất:* chỉ bài **chưa đọc** mới tính là "ngày có học"; đọc lại vẫn được, không thưởng. *Hiện tại:* giữ như cũ (đọc lại vẫn tính) tới khi anh chọn.

## G. Chương trình học Thế giới 3–5 (P2-10)
Bảng màn, lý do, quyết định D1–D12 và luật soạn R1–R3: `product/curriculum.md` §5. Danh sách câu hỏi **chỉ để ở đây**; §5.5 trỏ về đây. Luật sao theo mục tiêu đã duyệt (`product/rewards-economy.md` §1), không hỏi lại.

1. **Duyệt chương trình W3–5.** *Đã duyệt 03/10/2026 (hướng chung; sau đó HLV và phụ huynh đọc bản sửa và duyệt nội dung cùng ngày), kèm yêu cầu thêm nhiệm vụ/cốt truyện.* Sau đó bảng đã sửa theo hai vòng review sư phạm độc lập, thêm nhiệm vụ và mục tiêu ⭐, nên anh xác nhận từng màn khi chơi thử (P2-08/13/14).
2. **Luật A1 và "lặp đến khi".** Măng thắng ngay khi chạm đích, nên `đã tới đích?` / `đã tới nơi?` không bao giờ trả ✔ khi đang chạy, và `lặp 20 lần` làm được việc của "lặp đến khi tới đích" khi đường ≤ 20 vòng.
   - *Giữ A1:* W1–W2 không đổi. W4 dùng "lặp đủ nhiều" (`l06`). W5 chỉ cho "lặp n lần" ở màn cần hơn 20 vòng; bài giảng nói "Tới nơi là thắng ngay".
   - *Đổi A1 thành "chỉ thắng khi hết chương trình":* "lặp đến khi" có nghĩa trọn vẹn, nhưng phải soạn lại W1–W2 và W4 (N phải đúng, không thừa).

   *Tạm dùng:* giữ A1.
3. **"Nhảy cóc" (nhảy qua ô đất, tiến 2 ô) là hợp lệ.** Nhờ vậy `lặp {nhảy}` thắng mọi đường mà hố nằm ở ô lẻ, không cần hỏi "có hố?". Mỗi màn hỏi về hố phải có bản đồ chặn lối này (luật R1); W3 `l08` dùng nhảy cóc làm lời giải. *Tạm dùng:* giữ luật, giữ R1. Có muốn đổi (vd chỉ được nhảy khi phía trước là hố) không? Đổi thì phải kiểm lại W1–W3.
4. **Cành và thùng chỉ ở màn đoán / ghép hình / săn lỗi** ở W4–W5 (D3), vì "luôn cúi" (A2) và "luôn đá" (A4) thắng mà không cần hỏi. *Tạm dùng:* giữ luật A2/A4, giữ D3. Boss W5 chỉ có hố.
5. **Khối mới "đã tới nơi?" (`runner_at_goal`) cho runner.** *Tạm dùng:* **thêm** (D10). Đây là cách thật duy nhất để viết "lặp tới khi tới nơi" cho đường chạy, và nó giống `đã tới đích?` đã có. Nếu anh không muốn: W5 `l10`, `l13`, boss chuyển sang mê cung cảnh bờ sông (đi dọc bờ tới bến đò, đón Gà con ở bến), giữ nguyên câu chuyện qua sông.
6. **Hình dạng khối điều kiện:** hai khối riêng "nếu" và "nếu … nếu không"; không có "nếu không nếu", không có khối "không" (phủ định), không có "lặp khi" ở W4–W5. *Tạm dùng:* đúng vậy.
7. **Lối khác bằng `par`.** Một số màn có cách giải khác cùng số khối, vd boss W5 "lặp đến khi phía trước có cành / có thùng" trên đường không có cành, thùng (vòng lặp chạy tới đích). *Tạm dùng:* chấp nhận khi bằng `par`; khi ít hơn thì sửa bản đồ.
8. **Nhãn khối:** "nếu … thì", "nếu không thì", "lặp đến khi", "phía trước có …", "có đường …", "đã tới đích?", "đã tới nơi?" (`glossary.md`, các dòng "đề xuất"). Với bé gọi khối hỏi là "câu hỏi", không nói "cảm biến". *Tạm dùng:* như glossary.
9. **Độ khó boss W4** (8 khối, hai câu hỏi, 3 mê cung + chìa khóa). Đã thêm bậc: `l13` đoán ngã ba → `l14` ghép hình → `l16` tự ghép trên 2 bản đồ. *Tạm dùng:* giữ. Phương án nhẹ: boss chỉ rẽ một phía (5 khối).
10. **Boss W3 có 4 lỗi**, `parEdits` 4 (mỗi lần sửa lộ lỗi tiếp theo). *Tạm dùng:* giữ 4.
11. **Màn đoán ở chặng thử thách** (W3 `l14`, W5 `l19`). *Tạm dùng:* có.
12. **"Lặp đủ nhiều"** (W4 `l06`) thay cho một khối "lặp mãi". *Tạm dùng:* không thêm khối.
13. **Vòng lặp không dừng:** phát lại tối đa bao lâu trước khi Măng "chóng mặt"? *Tạm dùng:* 3 giây.
14. **Khối rời trong màn săn lỗi** (W3 `l05`): nối vào tính 1 thao tác. *Tạm dùng:* đồng ý.
15. **Màn sáng tạo W3 "Giấu một lỗi, đố bạn tìm".** *Tạm dùng:* bé ghép chương trình có 1 lỗi, lưu và bấm Khoe (P2-06); trong buổi học nhóm, bạn mở trên tường tác phẩm, chạy xem và nói lỗi ở đâu. Không có tính năng "chỉ lỗi" trong app. Có muốn thêm chế độ "bạn sửa lỗi của mình" (cần mở tác phẩm của bạn thành màn săn lỗi) không?
16. **Nhân vật lấy từ bộ hình đại diện.** Gấu trúc là Măng. Nhân vật có tên: Thỏ Bông (thỏ), bác Cú (cú), chú Ếch (ếch), Gà con (gà con). Dân làng: bác Heo, Mèo, Cáo, Gấu nâu, Hổ, Chim cánh cụt, Gấu túi. Như vậy **cả 12 hình đại diện** đều thành nhân vật trong truyện, và bé chọn hình nào cũng gặp "mình" trong truyện. *Tạm dùng:* chấp nhận. Anh muốn đổi tên, đổi con vật, hay giữ vài hình đại diện ngoài truyện không?
17. **Kiểu đích mới** `rescue` (chìa khóa → lồng) và `escort` (đón bạn → về nhà), chỉ dùng ở W4 `l17` (chìa khóa trên đường, chưa có lồng), W4 boss, W5 boss. "Điểm phải đi qua theo thứ tự" để sau. *Tạm dùng:* như vậy.
18. **Dòng nhiệm vụ** (`mission`) hiện cùng mục tiêu màn (`objective`): nhiệm vụ là câu chuyện, mục tiêu là việc cần làm (vd "dùng không quá 5 khối"). *Tạm dùng:* hiện cả hai, nhiệm vụ ở trên. Hay gộp làm một?
19. **⭐⭐⭐ cần chương trình "lắc".** Vét cạn cho thấy ở W5 `l14` (có mục tiêu măng) và W5 `l17` (thử thách), chương trình ít khối nhất là kiểu "lắc": `lặp đến khi đã tới đích {nếu có đường phía trước {tiến, rẽ phải} nếu không {rẽ trái}}` (ở `l17` là bản đối xứng: `{tiến, rẽ trái} nếu không {rẽ phải}`). Đây là cách khó nghĩ ra, nên `par` = 7 thay vì 9 (cách hai câu hỏi quen thuộc). *Tạm dùng:* `par` 7, `maxBlocks` 9 (cách 9 khối vẫn được ⭐⭐). Phương án khác: `l14` bỏ mục tiêu măng, `l17` ghi rõ trong gợi ý tư duy "có cách 7 khối".
20. **Giới hạn lồng vòng lặp** `maxLoopDepth: 1` (trường mới) cho W3 `l11` và mọi màn W4–W5 có vòng lặp, vì lặp lồng (dạy ở W9) hay cho lời giải ngắn hơn. Blockly sẽ không cho thả vòng lặp vào trong vòng lặp ở các màn này. *Tạm dùng:* đặt. Hay để bé lồng thoải mái và chấp nhận `par` thấp hơn?
21. **Ô câu hỏi để trống** (khối `nếu` / `lặp đến khi` chưa cắm khối hỏi): chương trình **không chạy**, Măng nói "Ô câu hỏi còn trống. Cắm một khối hỏi vào nhé!" (mã `EMPTY_CONDITION`, P2-11, ADR-0018). Lý do: Blockly hiểu ô trống là "sai", nên `lặp đến khi ◇` để trống thành "lặp mãi" và vẫn thắng vì chạm đích là thắng (A1), rẻ hơn lời giải có câu hỏi (vd boss W5 5 khối < `par` 6), bé không cần học câu hỏi. *Tạm dùng:* báo lỗi, không chạy. Hay cho chạy như Blockly (ô trống = ✘)?
22. **Màn ghép hình còn khối rời** (`parsons`). Trước đây Măng chạy phần đã nối,, nên bé có thể thắng mà bỏ lại khối không biết đặt đâu. *Tạm dùng (05/10/2026):* chỉ tính thắng khi **mọi** khối được cho đã nối dưới "khi bắt đầu"; còn khối rời thì Măng nói "Còn khối chưa ghép. Ghép hết vào nhé!" (mã `LOOSE_BLOCKS`, `runtime-engine.md` §2). Màn ghép hình không có khối gây nhiễu (luật 13). *Mở rộng (05/10/2026, review P2-14, quyết định của điều phối):* thắng còn phải **mọi khối đều chạy** ít nhất một lần (khối hỏi: được hỏi) và không có thân lặp / nhánh `nếu` trống; không thì "Còn chỗ trống, hoặc khối chưa chạy. Ghép lại nhé!" (`UNUSED_BLOCKS`). `npm run par` chạy mọi cách ghép của màn ghép hình và báo ⚠ khi hơn một cách thắng (`content-model.md` §8). Hay cho thắng như cũ?

## H. Thế giới 6–7 (Thành Phố Robot, Chợ Đếm Số, GĐ 3)
Thiết kế: `product/game-kinds.md` §3.3 (luật robot), `product/curriculum.md` §6.1 (W6), §6.2 (W7), lịch ở `roadmap/phase-3.md`. Mỗi câu có lựa chọn **tạm dùng**: anh không trả lời thì AI làm theo đó, việc không bị chặn.

1. **Tên robot.** Bạn robot của Măng tên **Bíp**, các bé lập trình cho Bíp (không phải Măng) ở W6. *Tạm dùng:* Bíp. Anh muốn các bé bỏ phiếu đặt tên khác không (chỉ là sửa chữ)?
2. **Luật AIROC thật.** Điểm 45 / 160 / 100 / về phòng 40, đồng hồ 120 s, sa bàn lưới ngã tư là từ ghi chú cũ, chưa có nguồn (`airoc-2026.md`). *Tạm dùng:* các số đó, ghi "Sa bàn tập, gần giống đề thi". Có luật thì gửi AI (P3-07), sửa dữ liệu trong ngày.
3. **Robot không thắng ngay khi xong việc** (khác Măng ở W1–W5): Bíp làm hết mọi lệnh rồi mới chấm, về tới phòng rồi đi tiếp là không còn ở nhà. *Tạm dùng:* như vậy (giống robot thật, dạy "kết thúc ở phòng").
4. **Gắp hụt, thả sai chỗ, thả sai màu, đi xuyên khối thì dừng lượt** (như đâm tường), Măng nói lý do. *Tạm dùng:* dừng lượt. Cách nhẹ hơn: Bíp lắc đầu rồi chạy tiếp, chỉ chấm thua ở cuối (khó tìm lỗi hơn).
5. **Gắp và thả tại chỗ Bíp đứng:** Bíp phải dừng **đúng ô có khối** mới gắp được, và **không đi xuyên qua khối**; thả là đặt khối xuống chỗ Bíp đứng. Thu hồi = đứng trong phòng thí nghiệm rồi thả khối ô nhiễm. *Tạm dùng:* như vậy (giống Leanbot: chạy tới khối, đóng càng). Leanbot của các bé gắp kiểu khác thì anh báo.
6. **Boss W6 nhẹ** (12 lệnh, không đổi màu, không câu hỏi): chọn việc, chọn thứ tự, về phòng trong 30 giây. Lượt thi đầy đủ có đề đổi màu (20 lệnh) là màn thử thách `l19` (tùy chọn). *Tạm dùng:* như vậy (quyết định D13, `curriculum.md` §6.1). Muốn boss là lượt thi đầy đủ thì đổi chỗ hai màn.
7. **Màu khối:** đỏ, vàng, xanh lá; khối rào màu xám, không có màu để hỏi. *Tạm dùng:* như vậy. Đề thật có xanh dương / tím thì thêm màu (P3-07).
8. **Câu hỏi "đang gắp khối?"** không có trong màn nào của W6 (chỉ màn sáng tạo); W7 giới thiệu khi đếm. *Tạm dùng:* như vậy.
9. **Giây mỗi việc:** tiến 2 s mỗi ngã tư, rẽ 1 s, gắp 2 s, thả 2 s, câu hỏi 0 s. *Tạm dùng:* như vậy. Anh đo Leanbot thật (vd đi 1 ô mất mấy giây) thì gửi số.
10. **Đồng hồ nhỏ theo sa bàn:** màn "chọn việc" và boss dùng 14–34 giây (sa bàn 3×5) thay vì 120 giây, để thời gian thật sự ép phải chọn. *Tạm dùng:* như vậy; màn sáng tạo 7×7 dùng 120 giây.
11. **Thế giới 7 dạy biến trên mê cung và robot** (`curriculum.md` §6.2 phương án A), không làm kiểu game Nông trại mới. *Tạm dùng:* phương án A.
12. **Gọi biến là gì với bé:** "biến" trong bài giảng ("biến là chiếc hộp có tên"), trên khối chỉ hiện tên hộp (vd "số măng"). *Tạm dùng:* như vậy. Hay chỉ nói "hộp"?
13. **Thi thử 2 lượt × 2 phút** và nút "Đề mới" sinh sa bàn ngẫu nhiên. *Tạm dùng:* làm sau ngày thi (P3-08); trước thi chỉ có "đề đổi màu" bằng màn nhiều bản đồ.
14. **Xu cho bài W6:** W6 có 11 bài (mở đầu + 10 bài lệnh mới / luật), mỗi bài +5 xu lần đầu (55 xu). *Tạm dùng:* giữ +5 như W1–W5.
15. **Nếu không kịp trước 17/10:** *Tạm dùng:* phát hành trước bài giảng + `l01`–`l13` + boss (đủ các thói quen thi, không cần câu hỏi), phần câu hỏi `l14`–`l19` và màn sáng tạo sau. Anh muốn ưu tiên khác không?
16. **Bé 9 tuổi thi bảng nào** (Sơ cấp 6–9 hay Trung cấp 9–12, `airoc-2026.md` §1) không đổi nội dung W6. *Tạm dùng:* một W6 cho cả 6 bé. Bảng Sơ cấp dùng robot / luật khác thì anh báo.
17. **Ảnh khối Blockly của Leanbot và sa bàn thật.** Nhãn lệnh của W6 ("tiến 3 ô", "rẽ trái", "gắp", "thả") là đoán. Sa bàn thật có thể có đoạn line dài giữa hai dãy nhà mà **không có ngã tư để đếm**; ở trò chơi, "ngã tư" là cách làm đơn giản. *Tạm dùng:* như hiện tại. Anh chụp màn hình bộ khối Blockly Leanbot (nhóm di chuyển, tay gắp, cảm biến) và một tấm ảnh sa bàn gửi AI, AI chỉnh nhãn và sa bàn cho giống (P3-07).
18. **Mở khóa W6 bằng tay:** các bé chưa xong W5, nên anh mở W6 cho từng bé ở Góc huấn luyện viên (P3-06). *Tạm dùng:* như vậy, không đổi luật mở khóa chung.
