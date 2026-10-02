# Playbook: thêm một khối lệnh

**Đọc trước:** `architecture/blockly-integration.md`, `architecture/game-kind-sdk.md`.

1. **Đặt tên** `<kind>_<verb>` (riêng một kiểu game) hoặc `cq_<tên>` (dùng chung). Thêm vào `docs/glossary.md` nếu là khái niệm mới.
2. **Khai báo `BlockSpec`** trong `packages/games/src/<kind>/blocks.ts`:
   - `json.message0` tiếng Việt, ngắn (1–2 chữ + icon `field_image`).
   - `style` đúng nhóm màu (`move_blocks`, `sensor_blocks`…).
   - **Không dùng shadow block** nếu khối sẽ dùng ở màn có `maxBlocks` (xem `blockly-integration.md` §5).
3. **Generator:** gọi API với id đã quote: `` `jump(${gen.quote_(b.id)});\n` ``. Khối giá trị (cảm biến) trả `[code, Order.FUNCTION_CALL]`.
4. **API trong `sim.ts`:** cập nhật state, `ctx.emit(...)` với `blockId`, `ctx.stop(...)` khi va chạm. Thêm tên vào `apiNames`.
5. **reasonCode mới** (nếu có): thêm vào `reasons.ts` + câu tiếng Việt vào `content/shared/feedback.json`.
6. **Renderer:** thêm cách diễn event mới trong `apps/web/src/stages/<kind>/` (sprite/hoạt ảnh tương ứng).
7. **Icon** cho khối: `apps/web/public/icons/<tên>.png` (pixel 16×16 hoặc 24×24).
8. **Test** trong `<kind>.test.ts`: một trường hợp thành công, một trường hợp mỗi reasonCode.
9. **Dùng khối** trong ít nhất 1 màn (mở khối lần đầu ở chặng `guided` hoặc `practice`, mode `build` hoặc `parsons`, có hint chỉ vào nó; `content-model.md` §5 luật 7).
10. `npm run test && npm run content:check`.
