# ADR-0006: Package headless không được phụ thuộc DOM

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Bộ kiểm chứng nội dung và unit test chạy trên Node. Mô phỏng trên trình duyệt và trên CI phải cho cùng kết quả.

## Quyết định
`engine`, `games`, `rewards`, `content-schema` cấm `window`/`document`/`localStorage`/`navigator`, cấm import React/PixiJS (luật ESLint). Riêng `blockly` được phép vì có bản Node. Test của các package này chạy với `environment: 'node'`.

## Hệ quả
Mỗi kiểu game tách thành nửa headless và nửa hiển thị. Hơi nhiều file hơn, nhưng test nhanh và CI đáng tin.

## Phương án đã cân nhắc
Cho phép DOM và chạy test bằng jsdom (chậm, dễ lẫn logic với hiển thị).
