# ADR-0010: Học sinh đăng nhập bằng ghép máy + PIN cục bộ

- **Trạng thái:** Đề xuất (xác nhận ở spike P2-01)
- **Ngày:** 01/10/2026

## Bối cảnh
Trẻ 8–11 tuổi không nên phải nhớ email/mật khẩu. Mỗi bé có laptop riêng.

## Quyết định
Huấn luyện viên tạo tài khoản Supabase cho bé (email nội bộ, qua Edge Function). Ghép máy bằng mã 6 số hạn 10 phút; Edge Function đổi mã thành phiên bằng `generateLink(magiclink)` + `verifyOtp(token_hash)`. Trên máy, PIN 4 số chỉ để chọn hồ sơ.

## Hệ quả
Bé không phải gõ gì ngoài PIN. Cần 2–3 Edge Function. Phải kiểm chứng luồng `generateLink` → `verifyOtp` trên phiên bản Supabase thật trước khi chốt.

## Phương án đã cân nhắc
Mỗi bé một email + mật khẩu (khó với trẻ); đăng nhập ẩn danh của Supabase (khó liên kết với hồ sơ huấn luyện viên tạo); không có tài khoản cho bé, chỉ đẩy dữ liệu bằng khóa chung (không an toàn).
