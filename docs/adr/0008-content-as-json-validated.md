# ADR-0008: Nội dung là JSON, kiểm bằng zod và chạy lời giải trong CI

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Khoảng 190 màn. Nút thắt là chất lượng nội dung, không phải code.

## Quyết định
Mọi world/level/lesson/hint/shop/badge là JSON trong `content/`, schema zod trong `@codequest/content-schema`. `content:check` chạy lời giải của mọi màn qua engine và kiểm 18 luật (`content-model.md` §5). CI chặn merge nếu lỗi.

## Hệ quả
Không có màn nào không giải được hoặc có `par` sai lọt ra ngoài. Level editor xuất đúng định dạng này.

## Phương án đã cân nhắc
CMS / database cho nội dung (thừa; mất lịch sử git, khó review).
