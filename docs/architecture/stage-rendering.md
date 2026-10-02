# Sân chơi & asset

Nguồn chuẩn cho: cách vẽ sân chơi bằng PixiJS, phát lại event log, sprite, tileset, âm thanh, pipeline asset. Phong cách hình ảnh: `docs/design/art-direction.md`.

## 1. StageController
`apps/web/src/stages/StageController.ts`. Một instance cho mỗi màn chơi.

```ts
class StageController {
  static mount(container: HTMLElement, signal: AbortSignal, opts: {
    config: RunnerConfig;                           // GĐ 0: chỉ runner
    onHighlight(blockId: string | null): void;      // màn chơi gọi workspace.highlightBlock
    onAnimation?(name: PandaAnimation): void;       // cho e2e (data-panda)
    onWaitingStep?(waiting: boolean): void;         // cho e2e (data-waiting-step)
  }): Promise<StageController | null>;              // null nếu signal abort trước (StrictMode)
  play(outcome: RunOutcome, opts?: { step?: boolean }): Promise<'finished' | 'aborted'>;
  step(): void;                                     // diễn khối tiếp theo; bấm sớm thì được giữ lại
  reset(): void;                                    // dừng phát, renderer.reset, bỏ highlight
  setSpeed(speed: 0.5 | 1 | 2): void;
  destroy(): void;
}
```
- `stages/` không import Blockly: highlight đi qua callback `onHighlight` (ranh giới `screens → blockly/stages`, `coding-standards.md` §3).
- Tốc độ = `app.ticker.speed` của **một** đồng hồ (§3), nên tween và hoạt ảnh sprite cùng nhanh/chậm. Lượt thắng phát ×1,25, lượt thua ×0,85 và tối đa 1×. Lượt `timeout` chỉ phát 24 event đầu.
- Chế độ từng bước dừng **một lần mỗi khối**: sau highlight, trước hành động đầu tiên của khối (event nối tiếp cùng khối như `fall`, `win` diễn luôn).
- Trong 120 ms highlight, Măng đứng yên ở khung hiện tại (`renderer.hold()`), không đi tại chỗ.
- Chưa có nút tạm dừng: `Space` khi đang diễn = **Dừng** (đưa sân chơi về đầu, như `R`).
- Khởi tạo PixiJS với `import 'pixi.js/unsafe-eval'` (export có sẵn trong pixi.js 8.21) để chạy được dưới CSP không có `'unsafe-eval'`.
- Duyệt `outcome.events` tuần tự. Event `highlight` → `onHighlight(id)` rồi chờ 120 ms theo đồng hồ (đã nhân tốc độ). Event hành động → `renderer.play(event, signal)`.
- Một `AbortController` cho mỗi lần play. Bấm Làm lại / rời màn thì abort, renderer phải dừng tween ngay.
- `ResizeObserver` trên container → `app.renderer.resize` + `renderer.resize`.
- Sau khi diễn xong: thắng → báo màn hình Kết quả; thua → rung khối gây lỗi + gọi hint engine.

## 2. Hệ tọa độ & tỷ lệ
- Mỗi kiểu game định nghĩa **kích thước logic** (vd runner: 3–40 ô × 1 làn; maze: 3–12 × 3–12 ô). Renderer tính lại bố cục theo kích thước thật của khung (ResizeObserver), không phóng to một canvas cố định.
- Sân chơi **lấp đầy** phần còn lại của cột trái (khoảng 516×360 ở 1280×720, 553×408 ở 1366×768), không ép đúng 16:10. Lý do: ép 16:10 để lại khoảng trống dưới thanh điều khiển ở màn hình laptop, còn renderer vẽ được ở mọi tỷ lệ.
- Runner (`stages/runner/layout.ts`, có unit test): mỗi ô = 2 tile Kenney, hệ số tile nguyên `floor(width / ((số ô + 1) × 36))` kẹp trong 2–4; đường đất ở 66% chiều cao; Măng cao 96–150 px (34% chiều cao khung). Đường vừa khung thì căn giữa; **không vừa** (tính theo pixel, không theo số ô) thì camera cuộn theo Măng, giữ Măng hơi lệch trái.
- Để bé đếm ô: ô lẻ tô sẫm hơn một chút, giữa hai ô đất có vạch nối rõ; phần đất ngoài đường (trước ô 0) là đất trơn, sẫm, không có cỏ.

## 3. Sprite & pixel
- Sprite gấu trúc gốc là pixel art do AI tạo, mỗi "pixel" ~5,5 px ảnh thật, **không** nằm đúng lưới nguyên. Vì vậy:
  - Texture Măng dùng `scaleMode: 'linear'`, hiển thị nhỏ hơn bản gốc (96–160 px).
  - Tile và icon tự vẽ theo lưới chuẩn (16/32 px) dùng `scaleMode: 'nearest'` và phóng to theo **bội số nguyên**.
- Độ phân giải: `PIXI.Application` vẽ theo `window.devicePixelRatio` (`autoDensity`, `roundPixels`; xem `stages/createStageApp.ts`). Ở DPR lẻ (1,25 / 1,5) tile vẫn `nearest` nên không mờ, nhưng mỗi texel rộng chênh nhau 1 px thiết bị (vd ×3 ở DPR 1,25 = 3–4 px). Chấp nhận cho GĐ 0–1; nếu khi chơi thử thấy rõ, renderer chọn hệ số tile sao cho `hệ số × DPR` là số nguyên.
- Hoạt ảnh: `PIXI.AnimatedSprite` từ spritesheet JSON (định dạng TexturePacker/Pixi). Tốc độ: đi 9 fps, chạy 12 fps, đứng 2 fps.
- **Một đồng hồ:** mọi `AnimatedSprite` tạo với `autoUpdate: false` và được gọi `sprite.update(ticker)` từ `app.ticker`, để dừng / bước / đổi tốc độ chỉ cần điều khiển một ticker. Helper Măng: `stages/pandaSprite.ts` (`createPanda(textures)` → `{ sprite, animation, play(name), update(ticker) }`).
- Lật hướng trái: `sprite.scale.x = -Math.abs(sprite.scale.x)`.
- Bảng tên hoạt ảnh của Măng (khóa trong spritesheet): `idle`, `talk`, `happy`, `walk`, `run`, `crouch`, `jump`, `kick`, `cheer` (+ `walk_front`, `walk_back`, `bump`, `oops`, `think`, `point` khi có sprite mới).

## 4. Pipeline asset
```
assets/raw/<tên>.png  ──(npm run sprites)──▶  assets/sprites/<nhân vật>/*.png  ──(npm run sprites:pack)──▶  apps/web/public/sprites/<nhân vật>.png + .json
```
- `tools/sprites/clean.py` (Python + Pillow, đã dùng cho bộ gấu trúc): cắt lưới 4×4, xóa nền tím bằng flood-fill từ mép, cắt mọi khung bằng **một** khung bao chung (giữ vị trí tương đối giữa các khung; **không** đưa chân mọi tư thế về cùng một đường), xuất PNG trong suốt.
- `tools/sprites/pack.py` (Python + Pillow, cùng môi trường với `clean.py`): ghép các khung thành atlas + JSON spritesheet của Pixi, theo bảng tên hoạt ảnh ở §3.
  - Tên hoạt ảnh suy ra từ tên khung: `walk_1…walk_4` → `walk` (theo số), khung không số (`jump`) → hoạt ảnh 1 khung. Bỏ qua `preview.png` và `*-clean.png`.
  - JSON dạng "hash" của TexturePacker: mỗi khung `trimmed` (cắt sát pixel có màu) nhưng giữ `sourceSize` gốc (280×280 với bộ gấu trúc). Các khung **không** chung đường chân (đáy khung, px nguồn: walk 275–276, idle/talk/happy 274, run 265–272, cheer 269, crouch 264, kick 247, jump 221). Vì vậy `anchor.y` tính **theo từng hoạt ảnh** = hàng có màu thấp nhất của hoạt ảnh đó / chiều cao khung; `anchor.x` = 0,5. Khung chạm đất đứng đúng trên `sprite.position` (dùng `AnimatedSprite` với `updateAnchor: true`). Hoạt ảnh trên không (bảng `AIRBORNE` trong `pack.py`, hiện là `jump` → mượn đường chân của `idle`); code sân chơi tự vẽ đường nhảy. Tên hoạt ảnh không có trong bảng §3 → `pack.py` cảnh báo.
  - Khung chép 1:1 (không resample), viền extrude 1 px + đệm 2 px trong suốt chống lem; pixel trong suốt ghi là `(0,0,0,0)` để không còn màu nền tím trong kênh RGB.
  - Tất định: cùng đầu vào → PNG giống từng pixel và JSON giống hệt (PNG giống từng byte với Pillow/NumPy ghim trong `tools/sprites/requirements.txt`). `apps/web/src/stages/pandaSheet.test.ts` kiểm cấu trúc `panda.json` và anchor đường chân.
- Tile Kenney tạm (gói Pixel Platformer, lưới **18×18**) ở `apps/web/public/tiles/<tên>.png`: `ground_left`, `ground`, `ground_right`, `dirt_left`, `dirt`, `dirt_right`, `flag_1`, `flag_2`, `flag_pole`, `crate`. Ô `hole` là ô trống, hai bên dùng `ground_right`/`ground_left`. Hiển thị `nearest`, phóng bội số nguyên (trang `/dev/stage` dùng ×3). Mép trên ô cỏ có viền tối 2 px: đặt chân Măng ở `đỉnh ô + 2 × hệ số`.
- Code nạp asset: `apps/web/src/stages/assets.ts` (`loadPandaSheet`, `loadTiles`; `scaleMode` truyền lúc nạp qua `data` của `PIXI.Assets`); tạo/hủy `Application` an toàn với StrictMode: `stages/createStageApp.ts`.
- `assets/` là **nguồn**, được commit. `apps/web/public/sprites` là **kết quả build**, cũng được commit (để chạy không cần Python), nhưng không sửa tay.
- Tileset: GĐ 0–1 dùng tạm gói **Kenney** (CC0). Ghi nguồn trong `assets/CREDITS.md`.

## 5. Âm thanh
- `apps/web/src/audio/sound.ts` bọc Howler: `play('snap' | 'run' | 'step' | 'jump' | 'bump' | 'win' | 'star' | 'coin' | 'click')`, `music(worldId)`, `voice(id)`.
- Ba kênh âm lượng riêng: nhạc, hiệu ứng, giọng đọc (lưu trong cài đặt của hồ sơ).
- Chỉ bắt đầu phát sau lần tương tác đầu tiên của người dùng (chính sách autoplay của trình duyệt).
- File: `apps/web/public/audio/{sfx,music,voice}/`. Định dạng `.mp3` (+ `.ogg` nếu cần).

## 6. Hiệu năng
- Mục tiêu 60 fps trên laptop phổ thông, sân chơi ≤ 300 sprite.
- Chỉ một `PIXI.Application` mỗi lúc. Hủy khi rời màn (`app.destroy(true)` + giải phóng texture không dùng chung).
- Texture của Măng và UI dùng chung được nạp một lần qua `PIXI.Assets` và giữ suốt phiên.
