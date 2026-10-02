# ADR-0007: PixiJS 8 điều khiển trực tiếp, không dùng @pixi/react

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Sân chơi diễn event log theo thời gian (tween, chờ, hủy giữa chừng). Đây là luồng mệnh lệnh, không phải UI khai báo.

## Quyết định
Dùng **pixi.js 8.21** trực tiếp qua `StageController` và `StageRenderer` của từng kiểu game. React chỉ cấp `div` chứa và gọi `mount`/`destroy`.

## Hệ quả
Kiểm soát tốt thời gian và việc hủy. Không bị re-render của React làm giật.

## Phương án đã cân nhắc
`@pixi/react` 8 (khai báo đẹp nhưng khó điều khiển tween tuần tự); Canvas 2D thuần (phải tự làm sprite, batching).
