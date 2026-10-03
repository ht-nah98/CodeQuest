# ADR-0015: Package headless `@codequest/validator` cho luật cấp màn và vét cạn `par`

- **Trạng thái:** Chấp nhận
- **Ngày:** 03/10/2026

## Bối cảnh
Luật kiểm chứng (`content-model.md` §5) nằm trong `tools/content-check`, đọc file bằng `node:fs`, nên level editor trong trình duyệt (P2-07) không dùng lại được. `par` của Thế giới 1–2 được kiểm bằng script vét cạn viết tay, không nằm trong repo, nên không ai chạy lại được khi màn đổi.

## Quyết định
Thêm package source-only `packages/validator` (`@codequest/validator`), headless như ADR-0006, phụ thuộc `games`, `engine`, `content-schema`, `zod`; cấm `fs`/`node:*`, DOM, `Date` (luật ESLint trong `eslint.config.js`).
- `validateLevel(json, { isDraft, getKind })`: luật cấp màn 1, 2 (mẫu ID), 5–6, 9–16, trả `{ rule, message }` không kèm đường dẫn file.
- `findShortestPrograms(level)` và `findFixes(level)`: vét cạn tất định, có ngân sách công việc (`maxWork`) và `shouldStop` để hủy (Web Worker, giới hạn thời gian của CLI).
- `tools/content-check` chỉ còn đọc file, luật liên file (2 phần tên file/trùng ID, 3–4, 7–8, 17–18) và in bảng; output giữ nguyên từng ký tự.
- `tools/par` (`npm run par`) là CLI mỏng trên hai hàm vét cạn.

## Hệ quả
Editor, CI và CLI chạy cùng một code luật. Vét cạn nhanh vì phát lại mô phỏng thật của kiểu game (`createState`/`createApi`/`evaluate`) với trạng thái được gộp và bước được ghi nhớ, rồi xác nhận lại các lời giải tìm được bằng `runLevel`. Vét cạn chỉ đúng khi kiểu game giữ các giả định ở `game-kind-sdk.md` §4: khối lệnh không gọi API cảm biến, `blockId` không vào state, API không dùng `ctx.rng`, state là dữ liệu thuần. Ba điều đầu được kiểm tự động (khối vi phạm bị báo `not searched`, dùng `ctx.rng` ném `UnsearchableLevel`). Mọi kết quả có ✖ chỉ khi chắc chắn; còn lại tối đa ⚠. Ngân sách cho Web Worker: `WORKER_MAX_WORK`. Giới hạn: chỉ chương trình tuần tự + `cq_repeat` (chưa có khối điều kiện, chờ P2-11); không xét `maxInstances`; giới hạn `maxSteps`/`maxActions` chỉ được kiểm ở bước xác nhận.

## Phương án đã cân nhắc
- Giữ luật trong `tools/content-check` và cho editor gọi một API dev server: không chạy được ở bản build, editor không kiểm được khi offline.
- Vét cạn bằng `runLevel` cho từng chương trình: đúng nhưng chậm (hàng triệu chương trình ở `par` 7), không đạt mục tiêu `--world w02` < 2 phút.
