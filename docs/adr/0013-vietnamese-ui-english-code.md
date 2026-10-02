# ADR-0013: Giao diện chỉ tiếng Việt; code bằng tiếng Anh

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Người dùng là trẻ Việt Nam. Code cần dễ đọc với AI và công cụ.

## Quyết định
Không dùng framework i18n. Chuỗi giao diện ở `apps/web/src/i18n/vi.ts`; nội dung bài học trong `content/`. Định danh, comment, commit, test: tiếng Anh. Tài liệu: tiếng Việt.

## Hệ quả
Đơn giản. Nếu sau này cần thêm ngôn ngữ, `vi.ts` là điểm bắt đầu để chuyển sang i18n.

## Phương án đã cân nhắc
Dùng i18next từ đầu (thừa với 1 ngôn ngữ).
