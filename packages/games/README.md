# @codequest/games (headless)

Cài đặt từng kiểu game: khối + generator + mô phỏng + chấm bài. Registry `gameKinds`.

**Đọc trước:** `docs/product/game-kinds.md`, `docs/architecture/game-kind-sdk.md`, `docs/playbooks/add-game-kind.md`, `add-block.md`.

```
src/
├─ registerAllBlocks.ts   đăng ký khối của mọi kiểu game (gọi registerBlockSpecs của engine)
├─ runner/          config · state · events · blocks · sim · evaluate · reasons · index · runner.test
├─ maze/
├─ robotlab/        (GĐ 3)
└─ index.ts         gameKinds registry
```
**Cấm:** DOM, React, PixiJS, `Math.random`, `Date`. Mỗi reasonCode phải có test.
