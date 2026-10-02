# Playbook: thêm một kiểu game

**Đọc trước:** `product/game-kinds.md`, `architecture/game-kind-sdk.md`, `architecture/runtime-engine.md`, `architecture/stage-rendering.md`.

1. **Đặc tả trước, code sau:** thêm mục mới vào `product/game-kinds.md` (góc nhìn, ô/vật thể, khối, cách thua, cách thắng, sprite cần có). Được huấn luyện viên đồng ý mới làm tiếp.
2. **Schema:** thêm id vào `GameKindId` trong `packages/content-schema`.
3. **Nửa headless** `packages/games/src/<kind>/` theo cấu trúc ở `game-kind-sdk.md` §1: `config.ts`, `state.ts`, `events.ts`, `blocks.ts`, `sim.ts`, `evaluate.ts`, `reasons.ts`, `index.ts`, `<kind>.test.ts`. Đăng ký vào `gameKinds` ở `packages/games/src/index.ts`.
4. **Test headless** cho mọi reasonCode, thắng, `predictAnswer`, tất định.
5. **Nửa hiển thị** `apps/web/src/stages/<kind>/` cài `StageRenderer`. Đăng ký vào `stageRegistry`.
6. **Asset:** sprite/tile theo `playbooks/add-asset.md`.
7. **Theme:** thêm blockStyle nếu có nhóm khối mới.
8. **3 màn mẫu** (build, predict, bughunt) trong một thế giới nháp `content/worlds/_sandbox/` (thư mục bắt đầu bằng `_` không hiện cho bé, nhưng vẫn qua `content:check`).
9. **Chơi thử**, rồi mới đưa vào thế giới thật.
10. Cập nhật `docs/glossary.md` (thuật ngữ mới), `docs/design/ui-copy-guide.md` (reasonCode mới).
