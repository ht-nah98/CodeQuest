# ADR-0012: Phong cách "Pixel ấm áp" và font có tiếng Việt

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Mascot là sprite gấu trúc pixel. Chữ tiếng Việt có dấu phải dễ đọc với trẻ. Kiểm tra Google Fonts ngày 01/10/2026: Press Start 2P, Pixelify Sans, Silkscreen, Tiny5, Jersey 10 **không** có bộ ký tự tiếng Việt; VT323 và Handjet có.

## Quyết định
Thế giới game vẽ pixel; khung UI bo tròn, viền mực, bóng cứng. Font: Baloo 2 (tiêu đề, khối), Nunito (nội dung), VT323 (số HUD, từ 22px). Font tự host trong `public/fonts`.

## Hệ quả
Đồng bộ với mascot, đọc tốt. Mọi font pixel mới phải kiểm có bộ `vietnamese`.

## Phương án đã cân nhắc
UI pixel hoàn toàn (khó đọc dấu); UI phẳng hiện đại (không hợp mascot).
