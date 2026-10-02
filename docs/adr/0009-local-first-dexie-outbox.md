# ADR-0009: Local-first với IndexedDB (Dexie) + outbox đồng bộ lên Supabase

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Bé học ở nhà, mạng có thể chập chờn. 6 máy khác nhau. Huấn luyện viên cần xem tiến độ.

## Quyết định
Ghi vào IndexedDB trước, mỗi lần ghi đẩy một dòng vào `outbox` trong cùng transaction. Bộ đồng bộ đẩy lên Supabase khi online. Dữ liệu được thiết kế hội tụ (tiến độ chỉ tăng; sổ xu/huy hiệu/tủ đồ là phép hợp theo khóa idempotent).

## Hệ quả
Không cần xử lý xung đột. Offline hoàn toàn. Đổi lại: phải giữ luật gộp giống nhau ở client và server (có test).

## Phương án đã cân nhắc
Chỉ online (bé mất tiến độ khi rớt mạng); Firebase (ít hợp với truy vấn SQL cho Góc huấn luyện viên).
