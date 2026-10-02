# ADR-0005: Chạy chương trình của bé trong js-interpreter, theo mô hình chạy-trước-phát-lại

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Code do bé ghép có thể lặp vô hạn. Cần tô sáng từng khối khi chạy, cần biết kết quả trước khi diễn. Blockly Games đã dùng cách này nhiều năm.

## Quyết định
Sinh JavaScript (có `STATEMENT_PREFIX` mang block id), chạy trong **js-interpreter 6.0.2** với giới hạn `maxSteps`/`maxActions`. API của kiểu game ghi `GameEvent` vào log. Chạy hết rồi mới phát lại log trên sân chơi.

## Hệ quả
Không bao giờ treo giao diện. Phát lại tua/dừng/từng bước được. Chạy được trên Node để kiểm chứng. Đổi lại: không có tương tác giữa chừng lúc đang chạy (kiểu game cần điều này sẽ phải dùng cách khác).

## Phương án đã cân nhắc
`eval`/`new Function` (không an toàn, không cắt được vòng lặp vô hạn); Web Worker + timeout (không tô sáng từng bước được); interpreter tự viết.
