# Hướng dẫn câu chữ tiếng Việt

Nguồn chuẩn cho: giọng văn, xưng hô, độ dài câu, câu mẫu. Áp dụng cho mọi chữ bé nhìn thấy: nội dung trong `content/`, chuỗi giao diện trong `apps/web/src/i18n/vi.ts`, câu phản hồi lỗi.

## 1. Nhân vật & xưng hô
- **Măng** là bạn gấu trúc nhỏ, tò mò, hay động viên, đôi khi vụng về (đâm tường thì ôm đầu cười).
- Măng xưng **"Măng"** hoặc **"mình"**, gọi bé là **"con"** (giọng của anh chị hướng dẫn, ấm áp).
- Nút, nhãn hệ thống: không xưng hô, chỉ động từ: "Chạy", "Làm lại", "Màn tiếp".

## 2. Luật viết
| Luật | Đúng | Sai |
|---|---|---|
| Bong bóng ≤ 12 chữ | "Phía trước có hố. Thử khối nhảy nhé!" | "Bạn đã gặp lỗi do nhân vật di chuyển vào ô có hố…" |
| Nói **cái gì xảy ra**, không nói "sai" | "Măng rơi xuống hố rồi!" | "Sai rồi!" |
| Gợi ý bằng câu hỏi | "Con thấy đoạn nào lặp lại không?" | "Dùng khối lặp 3 lần." (đó là tầng 2) |
| Khen cụ thể | "Chỉ 4 khối, đúng bằng số chuẩn!" | "Giỏi quá!" (dùng một mình) |
| Không so sánh bạn bè | "Cả nhóm sắp đạt 300 sao rồi!" | "Bạn An làm nhanh hơn con." |
| Đủ dấu, không viết tắt | "không", "được" | "ko", "dc" |
| Số dùng chữ số | "lặp 3 lần" | "lặp ba lần" |
| Một câu, một ý | "Kéo khối đi vào đây." | "Kéo khối đi vào đây rồi nối nó với khối khi bắt đầu và bấm chạy." |

Thuật ngữ cố định theo `docs/glossary.md`: **khối, thanh khối, vùng ghép khối, chạy, lặp, nếu, màn, thế giới, xu, sao, gợi ý**. Không dùng "code" trong lời thoại, trừ câu "con vừa viết N dòng code" ở màn kết quả.

## 3. Câu phản hồi theo lý do thua
Mỗi `reasonCode` có câu mặc định. **Nguồn duy nhất** là `content/shared/feedback.json` (bảng dưới là bản tóm tắt, file JSON thắng nếu khác). Màn có thể ghi đè bằng `level.feedback`.

| reasonCode | Câu mặc định |
|---|---|
| `EMPTY_PROGRAM` | Con chưa ghép khối nào. Kéo khối vào đây nhé! |
| `INTERNAL_ERROR` | Ối, game bị vấp. Con bấm Làm lại nhé! |
| `OFF_TRACK` | Ối, Măng nhảy ra khỏi đường rồi! |
| `DISCONNECTED_BLOCKS` (chỉ dùng cho gợi ý) | Có khối chưa nối vào "khi bắt đầu". |
| `NOT_AT_GOAL` | Hết khối rồi mà Măng chưa tới nơi. |
| `HIT_WALL` | Ối, tường! Măng rẽ đúng chỗ, đúng phía chưa? |
| `FELL_IN_HOLE` | Ối, hố! Nhảy ngay trước hố nhé. |
| `HIT_BRANCH` | Cộc! Cành thấp quá, Măng phải cúi. |
| `HIT_CRATE` | Thùng chắn đường. Đá nó đi! |
| `MISSED_ITEMS` | Còn măng chưa nhặt kìa! |
| `TIMEOUT` | Măng chóng mặt rồi, vòng lặp không dừng! |
| `TOO_MANY_BLOCKS` | Nhiều khối quá. Thử dùng khối lặp xem? |
| `WRONG_ANSWER` (predict) | Chưa đúng. Cùng chạy thử để xem nhé! |
| `ROBOT_TIME_UP` | Hết giờ rồi! Chọn nhiệm vụ nào làm trước? |

## 4. Câu mẫu theo tình huống
- Vào màn: đọc `objective` của màn (≤ 12 chữ), ví dụ "Đến lá cờ, dùng không quá 3 khối".
- Thắng ⭐: "Qua màn rồi! Thử ít khối hơn nhé?"
- Thắng ⭐⭐: "Đúng số khối chuẩn! Không cần gợi ý là ⭐⭐⭐."
- Thắng ⭐⭐⭐: "Hoàn hảo! Ba sao luôn!"
- Thua 3 lần: "Khó nhỉ? Gợi ý 💡 đang miễn phí đó."
- Không đủ xu: "Cần thêm 10 xu. Qua một màn là đủ!"
- Nhắc nghỉ (25 phút): "Mình chơi lâu rồi. Đứng dậy vươn vai nhé!"

## 5. Giọng đọc
- Mọi câu **cố định** có nút 🔊. File âm thanh sinh **trước** (TTS tiếng Việt hoặc thu giọng thật), lưu tại `apps/web/public/audio/voice/<id>.mp3`, ID theo `architecture/content-model.md` §2.
- Câu có số thay đổi ("Cần thêm N xu", "còn N khối") **không** có giọng đọc ở GĐ 1. Viết câu sao cho phần quan trọng không phụ thuộc vào con số.
- Không gọi dịch vụ TTS khi bé đang chơi.
