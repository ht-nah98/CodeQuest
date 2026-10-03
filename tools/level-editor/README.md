# tools/level-editor — đã chuyển vào web

Level editor chạy trong trình duyệt ở route **`/coach/editor`** của `npm run dev` (chỉ bản dev cho tới P2-16, sau khóa người lớn), không phải script Node. Mã nằm ở:

| Chỗ | Việc |
|---|---|
| `apps/web/src/features/editor/` | Logic thuần (có unit test): bản nháp, công cụ vẽ bản đồ, xuất JSON, gắn lỗi vào trường, vét cạn `par` (Web Worker) |
| `apps/web/src/screens/coach/` | Màn hình editor và khóa người lớn |
| `apps/web/src/data/repos/levelDrafts.ts` | Bản nháp trong IndexedDB (chỉ ở máy) |
| `apps/web/e2e/coach-editor.spec.ts` | e2e: tạo màn runner `build`, maze `bughunt`, runner `parsons` từ đầu → thử chơi thắng → xuất → `content:check`; hủy vét cạn |

Kiểm chứng dùng `@codequest/validator` (cùng luật cấp màn với `npm run content:check`). Editor **không ghi** vào `content/`: tải file `.json` (hoặc sao chép JSON) rồi đặt vào `content/worlds/<thế giới>/levels/` và chạy `npm run content:check`. Mô tả đầy đủ: `docs/roadmap/phase-2.md` P2-07.
