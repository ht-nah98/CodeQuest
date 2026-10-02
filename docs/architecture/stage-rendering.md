# Sân chơi & asset

Nguồn chuẩn cho: cách vẽ sân chơi bằng PixiJS, phát lại event log, sprite, tileset, âm thanh, pipeline asset. Phong cách hình ảnh: `docs/design/art-direction.md`.

## 1. StageController
`apps/web/src/stages/StageController.ts`. Một instance cho mỗi màn chơi.

```ts
class StageController {
  constructor(opts: { container: HTMLElement; kind: GameKindId; config: unknown; assets: AssetBundle; workspace: WorkspaceSvg });
  async mount(): Promise<void>;                     // tạo PIXI.Application, gọi renderer.mount
  async play(outcome: RunOutcome, speed: Speed): Promise<'finished' | 'aborted'>;
  step(): Promise<void>;                            // diễn 1 event hành động tiếp theo
  pause(): void; resume(): void;
  reset(): void;                                    // renderer.reset + bỏ highlight
  setSpeed(speed: Speed): void;                     // 0.5 | 1 | 2; khi lượt thua, tốc độ phát tối đa 1×
  destroy(): void;
}
```
- Khởi tạo PixiJS với `import 'pixi.js/unsafe-eval'` (export có sẵn trong pixi.js 8.21) để chạy được dưới CSP không có `'unsafe-eval'`.
- Duyệt `outcome.events` tuần tự. Event `highlight` → `workspace.highlightBlock(id)` rồi chờ 120 ms × hệ số tốc độ. Event hành động → `renderer.play(event, speed, signal)`.
- Một `AbortController` cho mỗi lần play. Bấm Làm lại / rời màn thì abort, renderer phải dừng tween ngay.
- `ResizeObserver` trên container → `app.renderer.resize` + `renderer.resize`.
- Sau khi diễn xong: thắng → báo màn hình Kết quả; thua → rung khối gây lỗi + gọi hint engine.

## 2. Hệ tọa độ & tỷ lệ
- Mỗi kiểu game định nghĩa **kích thước logic** (vd runner: 3–40 ô × 1 làn; maze: 3–12 × 3–12 ô). Renderer tính `tile = min(width / cols, height / rows)` và căn giữa.
- Sân chơi tỷ lệ **16:10** trong cột trái. Runner dài hơn 8 ô thì camera cuộn theo Măng.

## 3. Sprite & pixel
- Sprite gấu trúc gốc là pixel art do AI tạo, mỗi "pixel" ~5,5 px ảnh thật, **không** nằm đúng lưới nguyên. Vì vậy:
  - Texture Măng dùng `scaleMode: 'linear'`, hiển thị nhỏ hơn bản gốc (96–160 px).
  - Tile và icon tự vẽ theo lưới chuẩn (16/32 px) dùng `scaleMode: 'nearest'` và phóng to theo **bội số nguyên**.
- Hoạt ảnh: `PIXI.AnimatedSprite` từ spritesheet JSON (định dạng TexturePacker/Pixi). Tốc độ: đi 9 fps, chạy 12 fps, đứng 2 fps.
- Lật hướng trái: `sprite.scale.x = -Math.abs(sprite.scale.x)`.
- Bảng tên hoạt ảnh của Măng (khóa trong spritesheet): `idle`, `talk`, `happy`, `walk`, `run`, `crouch`, `jump`, `kick`, `cheer` (+ `walk_front`, `walk_back`, `bump`, `oops`, `think`, `point` khi có sprite mới).

## 4. Pipeline asset
```
assets/raw/<tên>.png  ──(npm run sprites)──▶  assets/sprites/<nhân vật>/*.png  ──(npm run sprites:pack)──▶  apps/web/public/sprites/<nhân vật>.png + .json
```
- `tools/sprites/clean.py` (Python + Pillow, đã dùng cho bộ gấu trúc): cắt lưới 4×4, xóa nền tím bằng flood-fill từ mép, căn đáy chung, xuất PNG trong suốt.
- `tools/sprites/pack.py` (Python + Pillow, cùng môi trường với `clean.py`): ghép các khung thành atlas + JSON spritesheet của Pixi, theo bảng tên hoạt ảnh ở §3.
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
