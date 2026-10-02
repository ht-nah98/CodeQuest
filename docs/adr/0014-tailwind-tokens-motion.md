# ADR-0014: Tailwind CSS 4 + CSS variables cho design token; Motion cho animation UI

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Cần dựng nhanh một design system nhất quán (nút chunky, panel, bong bóng) theo token trong `art-direction.md`.

## Quyết định
Token màu/font/bo góc là CSS variables trong `apps/web/src/ui/tokens.css`, được Tailwind 4 đọc qua `@theme`. Thành phần UI viết bằng React + Tailwind trong `apps/web/src/ui/`. Animation UI dùng `motion` 13.

## Hệ quả
Đổi token một chỗ là đổi toàn app. Blockly theme cũng đọc cùng bảng màu (đồng bộ bằng một file TS export màu).

## Phương án đã cân nhắc
CSS Modules (chậm hơn khi dựng nhiều thành phần); thư viện UI có sẵn (MUI, Chakra) (khó ra phong cách riêng, nặng).
