# Playbook: thêm một màn chơi

**Đọc trước:** `conventions/content-authoring.md`, `architecture/content-model.md`, `product/curriculum.md` (màn này nằm ở đâu).

1. **Xác định vị trí:** thế giới, thứ tự, chặng, kind, mode, theo bảng trong `product/curriculum.md`. Nếu màn chưa có trong bảng, thêm vào bảng trước (cùng PR).
2. **Tạo file** `content/worlds/<worldId>/levels/<levelId>.json`. Cách nhanh: copy một màn cùng kind + mode rồi sửa.
3. **Điền phần sư phạm:** `title`, `objective`, `learningGoal`, `misconception`, `thinkingHint`.
4. **Thiết kế bản đồ** trong `config` (đúng `configSchema` của kind, xem `packages/games/src/<kind>/config.ts`). Từ GĐ 2 dùng level editor (`/coach/editor`) để vẽ và xuất JSON.
5. **Chọn `toolbox`**, đặt `maxBlocks` và `par`.
6. **Viết `solution`:** ghép trong level editor hoặc trong màn chơi (bật "chế độ tác giả": `?author=1`, có nút "Sao chép workspace JSON").
7. **Theo mode:**
   - `parsons`: `initialWorkspace` = các khối của lời giải, rời nhau, vị trí lộn xộn.
   - `bughunt`: `initialWorkspace` = lời giải đã bị cài lỗi; đặt `parEdits`.
   - `predict`: `initialWorkspace` = chương trình cho bé đọc; `predict.options` 3–4 phương án (key theo `predictAnswer` của kind).
8. **Viết gợi ý tầng 0** (`hints`), xem `architecture/hint-engine.md`.
9. **Thêm `levelId` vào `world.json`** đúng thứ tự.
10. **Chạy** `npm run content:check`, sửa đến khi xanh.
11. **Chơi thử** trong trình duyệt: `npm run dev` → `/play/<levelId>`. Thử cả cách giải đúng lẫn 2–3 cách sai thường gặp, xem câu phản hồi có hợp lý không.
12. **Commit:** `content(<worldId>): add <levelId> <title>`.
