# ADR-0029: Bài 0 là cổng của khóa Leanbot

- **Trạng thái:** Chấp nhận
- **Ngày:** 21/10/2026

## Bối cảnh

Khóa Leanbot có 17 bài, và **mọi bài từ 1 trở đi đều kết thúc bằng việc nạp code xuống robot
thật**. Bài 0 là bài chuẩn bị: hai cổng USB, sạc, cho máy tính thấy robot, chọn đúng bảng
mạch, nạp chương trình kiểm tra, đọc dòng số liệu, thử bánh xe, tay gắp, đèn, còi và hai loại
mắt, rồi hiệu chỉnh mắt dò vạch.

Huấn luyện viên nói nguyên văn: *"Bài 0 coi như 1 bài chuẩn bị tất cả để từ sau chỉ việc học
sinh viết code nạp code. Phải có 1 outcome gì đó cụ thể mới qua được bài 0. Chứ bài 0 còn chưa
config xong, cứ làm bài 1 bài 2 nhưng lại chả có gì hoạt động thì không ổn lắm."*

Đó là chuyện thật chứ không phải lo xa: trong chính phiên làm việc này, máy của huấn luyện
viên nạp code thất bại vì `brltty` chiếm cổng USB và vì Chrome thiếu quyền mở cổng. Nếu bé
ngồi học Bài 1 trên một máy chưa cài xong, bé ghép khối đúng mà robot vẫn đứng im — và bé sẽ
nghĩ mình sai.

Ba cách đã cân nhắc:

1. **Chỉ ghi điều kiện, không khóa.** Bé vẫn vào được bài sau. Dễ làm, nhưng không khác gì
   hiện trạng: không ai biết máy đã sẵn sàng chưa.
2. **Tích đủ ô kiểm tra thì mở khóa.**
3. **Nhập số hiệu robot để mở khóa.** Robot tự in số hiệu (ví dụ `LB398377`) khi khởi động,
   nên chỉ bé nào nạp được chương trình mới biết số đó. Bằng chứng chắc hơn, nhưng cần lưu
   thêm dữ liệu và bé gõ sai một ký tự là tắc.

## Quyết định

Chọn cách 2. Huấn luyện viên chọn trực tiếp.

- Bài 0 có **9 ô tích**, mỗi ô là một việc làm xong trên robot thật: chỉ đúng hai cổng · sạc
  được · máy tính thấy robot · nạp được chương trình · đọc được dòng số liệu · bánh xe chạy
  đúng · tay gắp mở đóng đều · đèn và còi đủ · hai loại mắt đều nhận.
- **Tích đủ cả 9 thì Bài 1 trở đi mới mở.** Chưa đủ thì bài sau vẫn hiện trong danh sách, có
  tên, có thời lượng, nhưng mang ổ khóa và không bấm vào được. Gõ thẳng URL cũng bị chặn.
- Danh sách bài hiện **còn mấy ô chưa tích**, để bé biết mình thiếu gì chứ không chỉ thấy khóa.
- Luật nằm ở `apps/web/src/features/leanbot/leanbotGate.ts`, là **hàm thuần** nhận hàm đọc ô
  tích, nên kiểm bằng unit test trên Node; chỗ chạm vào `localStorage` tách riêng.
- Bài 0 **không bao giờ tự khóa chính nó**, và khóa có **9 ô thì đọc từ nội dung** chứ không
  viết cứng trong code: thêm một ô tích vào `content/leanbot/bai-00.json` là cổng tự chặt hơn.
- Khóa **không áp dụng cho CodeQuest**: `/map` và 10 thế giới không liên quan tới robot.

## Hệ quả

**Được:**

- Không còn cảnh học Bài 1–3 trên một máy chưa nạp được code.
- Bài 0 có hình hài rõ ràng: một danh sách việc phải làm xong, không phải một bài đọc.
- Thêm một ô tích = thắt chặt điều kiện, không phải sửa code.

**Mất:**

- Ô tích nằm trong `localStorage` của **máy đó, trình duyệt đó**. Đổi máy là bé phải tích lại.
  Chấp nhận được: đổi máy thì đằng nào cũng phải cài đặt lại từ đầu, đúng việc Bài 0 dạy.
- Bé **tự tích được** mà không làm thật. Đây là lựa chọn có ý thức: ADR này đổi ô tích từ "ghi
  chú của bé cho chính bé" (ADR-0028) thành điều kiện mở bài, nhưng vẫn **không** biến nó
  thành bài thi. Muốn bằng chứng thật thì dùng cách 3, để dành khi nào cần.
- Xóa dữ liệu trình duyệt là khóa đóng lại. Bé tích lại 9 ô trong một phút.

## Phương án đã cân nhắc

**Chỉ ghi điều kiện, không khóa** — vẫn là thứ ai cũng bỏ qua. Chính vì nó mà Bài 1, 2, 3 đã
được viết xong trước khi có ai hỏi "máy đã nạp được code chưa".

**Nhập số hiệu robot** — bằng chứng thật nhất: số `LB398377` chỉ hiện ra khi chương trình đã
chạy trên robot. Nhưng phải lưu thêm một trường cho mỗi bé, và một robot hỏng cổng serial là
bé tắc hoàn toàn, không có đường vòng. Giữ lại cho sau.
