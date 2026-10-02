# ADR-0004: Blockly 13 với renderer zelos, khối lặp riêng `cq_repeat`

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Cần trình ghép khối kéo thả hợp với trẻ. Kiểm chứng ngày 01/10/2026: `maxBlocks` của Blockly tính cả khối mũ và shadow block, nên `controls_repeat_ext` (có ô số là shadow) chiếm 2 chỗ.

## Quyết định
Dùng **Blockly 13.3.0**, renderer **zelos**, theme riêng `codequest`. Khối lặp dùng khối riêng `cq_repeat` với `field_number` nằm trong khối. Truyền `maxBlocks + 1` cho khối `cq_start`. Màn có `maxBlocks` cấm khối có shadow (kiểm bằng `content:check`).

## Hệ quả
Số khối hiển thị khớp với cảm nhận của bé. Từ Thế giới 7 (phép toán có shadow) cần viết capacity guard riêng (GĐ 4).

## Phương án đã cân nhắc
Scratch-blocks (fork cũ, khó tùy biến); tự viết trình ghép khối (quá tốn công); dùng `controls_repeat_ext` và chấp nhận đếm sai (gây khó hiểu cho trẻ).
