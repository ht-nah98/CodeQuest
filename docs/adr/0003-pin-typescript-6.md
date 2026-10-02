# ADR-0003: Ghim TypeScript 6.0.3, chưa dùng TypeScript 7

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Ngày 01/10/2026, `typescript@latest` là 7.0.2. `typescript-eslint` 8.71.0 khai báo peer dependency `typescript >=4.8.4 <6.1.0`.

## Quyết định
Ghim **`typescript` 6.0.3** (bản mới nhất trong khoảng được hỗ trợ). Bật `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.

## Hệ quả
Lint có kiểm tra kiểu hoạt động. Khi `typescript-eslint` hỗ trợ TS 7 thì viết ADR mới để nâng cấp.

## Phương án đã cân nhắc
Dùng TS 7 và bỏ lint có kiểm tra kiểu (mất nhiều luật hữu ích); dùng TS 7 với `--force` (không ổn định).
