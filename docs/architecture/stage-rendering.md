# Sân chơi & asset

Nguồn chuẩn cho: cách vẽ sân chơi bằng PixiJS, phát lại event log, sprite, tileset, âm thanh, pipeline asset. Phong cách hình ảnh: `docs/design/art-direction.md`.

## 1. StageController
`apps/web/src/stages/StageController.ts`. Một instance cho mỗi màn chơi. Phần phát lại (duyệt event, tốc độ, tạm dừng, từng bước) nằm trong `stages/replay.ts` (`Replay`, chỉ cần một `Ticker`, có unit test với đồng hồ chạy tay `replay.test.ts`); `StageController` giữ `PIXI.Application`, `ResizeObserver` và gọi `Replay`.

```ts
class StageController {
  static mount(container: HTMLElement, signal: AbortSignal, opts: {
    kind: GameKindId;                               // level.kind → renderer lấy từ stage registry
    config: unknown;                                // level.config; factory của kiểu game tự kiểm bằng schema
    onHighlight(blockId: string | null): void;      // màn chơi gọi workspace.highlightBlock
    onAnimation?(name: PandaAnimation): void;       // cho e2e (data-panda)
    onWaitingStep?(waiting: boolean): void;         // cho e2e (data-waiting-step)
    onClockSpeed?(speed: number): void;             // tốc độ đồng hồ sau mỗi lần đổi; chỉ bản dev, e2e đọc data-stage-speed
  }): Promise<StageController | null>;              // null nếu signal abort trước (StrictMode); reject nếu kiểu game chưa có sân chơi
  play(outcome: RunOutcome, opts?: { step?: boolean }): Promise<'finished' | 'aborted'>;
  pause(): void; resume(): void;                    // đóng băng giữa chừng / chạy tiếp
  step(): void;                                     // diễn khối tiếp theo; xem quy tắc bấm sớm bên dưới
  setSpeed(speed: 0.5 | 1 | 2): void;
  reset(): void;                                    // dừng phát ngay, renderer.reset, bỏ highlight
  destroy(): void;
  readonly playing: boolean; readonly paused: boolean; readonly waitingForStep: boolean;
}
```
- **Stage registry** `stages/registry.ts`: `stageKinds: Partial<Record<GameKindId, StageKind>>`, `getStageKind(kind)`. Mỗi `StageKind` có `background` (màu nền canvas, token) và `prepare(): Promise<StageFactory>`: nạp texture (cache trong `PIXI.Assets`) rồi trả `factory(app, config, { onAnimation })` → `StageRenderer`. Factory kiểm `config` bằng `configSchema` của kiểu game. Màn chơi không biết renderer cụ thể; thêm kiểu game = thêm một dòng vào `stageKinds` (runner: `RunnerStage`, maze: `stages/maze`).
- `stages/` không import Blockly: highlight đi qua callback `onHighlight` (ranh giới `screens → blockly/stages`, `coding-standards.md` §3).
- Tốc độ = `app.ticker.speed` của **một** đồng hồ (§3), nên tween và hoạt ảnh sprite cùng nhanh/chậm. Lượt thắng phát ×1,25, lượt thua ×0,85 và tối đa 1× (chọn Nhanh vẫn chỉ 0,85×). Lượt `timeout` chỉ phát 24 event đầu.
- **Tạm dừng** = cùng đồng hồ đó với `speed = 0`: mọi tween và sprite đứng yên giữa chừng, canvas vẫn vẽ (resize vẫn đúng). Tiếp tục = trả lại tốc độ đã chọn. Bấm Từng bước lúc đang chạy thường hoặc đang tạm dừng: khối hiện tại diễn nốt rồi dừng trước khối kế tiếp.
- Chế độ từng bước dừng **một lần mỗi khối**: sau highlight, trước hành động đầu tiên của khối (event nối tiếp cùng khối như `fall`, `collect`, `win` diễn luôn).
- Bấm Từng bước **sớm** (đang ở chế độ từng bước nhưng chưa tới chỗ chờ, vd trong 120 ms highlight): được giữ lại cho lần chờ kế tiếp, **chỉ một lần** (bấm nhiều lần trước chỗ chờ vẫn chỉ qua một khối). Bấm lúc đang chạy thường thì không giữ: chỉ chuyển sang từng bước (dòng trên).
- Sau mỗi lần mount sân chơi (đổi màn, Fast Refresh), màn chơi gọi lại `setSpeed` với tốc độ bé đã chọn; sân chơi mới không có lượt nào nên không ở trạng thái tạm dừng.
- Trong 120 ms highlight, Măng đứng yên ở khung hiện tại (`renderer.hold()`), không đi tại chỗ.
- Hết event: bỏ highlight; lượt chưa xong (không `success`/`crash`) gọi `renderer.rest()`; rồi gọi `renderer.finish?(outcome)` đúng một lần (không gọi khi abort, không gọi giữa các bước). Kiểu game đặt dấu hiệu cuối lượt ở đây (vd maze: báo măng còn sót).
- Nút **Tạm dừng / Tiếp tục** ở thanh điều khiển (chỉ bật khi đang diễn, không có phím tắt riêng). `Space` khi đang diễn vẫn = **Dừng** (đưa sân chơi về đầu, như `R`), theo `screens-and-flows.md` §4.
- Làm lại / Dừng / rời màn giữa lúc đang diễn: abort `AbortController` của lượt phát; mọi `tween` gỡ khỏi ticker ngay (unit test `replay.test.ts` kiểm `ticker.count` về 0 và không còn gì chuyển động; e2e `play-runner-full.spec.ts`).
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
- Nền runner (`stages/runner/scenery.ts`) vẽ bằng `Graphics` theo lưới texel của tile (1 đơn vị = hệ số tile), màu nhạt dần theo xa gần: trời 2 dải + mặt trời nhạt (đứng yên), mây (parallax 0,12), rặng tre xa (0,3), đồi + vài cây tre gần (0,55). Tất định (dãy giả ngẫu nhiên có seed), dựng lại khi resize.
- Vật trên đường: `branch` = cành lá thấp (tile `branch_left/right`, lớn hơn tile đất một bậc) mọc từ một thân tre ở mép phải ô, đáy lá cách chân Măng 0,74 chiều cao khi đứng; khi cúi Măng bị ép dọc 0,7 nên chui lọt, còn đứng thì đầu chạm lá. Cành vẽ **trước** Măng. `crate` = 2 thùng chồng (cao bằng 1 ô, không nhảy qua được), đổ quanh góc dưới phải khi bị đá. Măng (`bamboo`) đứng giữa ô.
- Hoạt ảnh event: `walk` (đi; rời ô cành thì cúi nửa đầu), `crouch` (khung cúi, nhún nhẹ, ở dưới cành thì giữ tư thế cúi), `jump` (cúi lấy đà, vòng cung, tiếp đất có bụi), `kick` (lùi lấy đà, đá; `hit` → thùng đổ + bụi, hụt → vệt gió), `collect` (Măng vui, măng bay lên mờ dần, lấp lánh vàng), `fall`, `bump` (tiến tới chỗ chạm, va: Măng ửng đỏ, vật cản rung, sân rung nhẹ, bật về ô `from`, sao vàng quay trên đầu đến khi Làm lại; thay cho khung `bump`/`oops` chưa có), `offTrack`, `win` (nhảy mừng + pháo giấy), `missed` (Măng nói "ối", camera lùi để thấy măng bị bỏ, măng nhấp nháy và giữ vạch vàng dưới chân). Độ sâu khi rơi tính theo ô, nên resize giữa lúc rơi vẫn đúng. Khi giảm chuyển động (`stages/motion.ts`: `prefers-reduced-motion` **hoặc** công tắc "Giảm chuyển động" của hồ sơ, `<html data-reduced-motion="true">`): không rung sân, vật cản không rung, sao đứng yên, măng bị bỏ không nhấp nháy mà chỉ có vạch vàng + dấu "!" tĩnh. Màu cảnh runner (`scenery.ts`, nền đất, cành) đều lấy từ token qua `shade()` của `stages/colors.ts`.
- Maze (`stages/maze/layout.ts`, có unit test): bản đồ + **một vòng tường bao** (bản đồ không bắt buộc có viền `#`, đi ra mép cũng là `HIT_WALL`, nên ô tường ngoài mép phải nhìn thấy được; vòng bao tô sẫm hơn tường trong). Mỗi ô = 1 tile 12×12 texel, hệ số nguyên `floor(min((rộng − 16) / (số cột + 2), (cao − dải HUD − 16) / (số hàng + 2)) / 12)` kẹp 1–6, căn giữa. Trên cùng chừa **dải HUD** cho bảng đếm măng (chỉ khi bản đồ có `b`; icon ×2, không vừa thì ×1 rồi xuống dòng), nên bảng không bao giờ che hàng 0. Măng cao 1,4 ô nhưng **không dưới 64 px** (bản đồ 12×12 thì Măng tràn ra ngoài ô; xem ngoại lệ ở `design/art-direction.md` §7); chân ở tâm ô + 0,3 ô. Đường đi kẻ ô bàn cờ nhạt + vạch vữa để bé đếm ô.
- Hoạt ảnh event maze (`stages/maze/MazeStage.ts`): `move` (`walk`, trượt sang ô kế), `turn` (mũi tên xoay mượt 90°, Măng nhún; đổi bên trái/phải thì "xoay" qua bề ngang 0), `bump` (lao vào nửa ô, ô tường `at + dir` chớp trắng viền đỏ, sân rung, tia lửa, bật về với khung `jump`, rồi `crouch` + 3 sao vàng quay trên đầu đến khi Làm lại), `collect` (Măng `happy`, măng bay lên to dần mờ đi, lấp lánh, icon trên bảng đếm sáng lên), `win` (`cheer` nhảy 2 lần, lấp lánh, cờ bay nhanh, cất mũi tên). Đích của màn `collectAll` **khóa** (cờ xám tím, đứng yên) đến khi nhặt hết, rồi sáng lên. Cuối lượt `MISSED_ITEMS` (hook `finish(outcome)`, không hiện giữa các bước): măng còn lại có khung hồng viền mực và nhún nhảy. Khi giảm chuyển động (như runner): không rung sân, mũi tên không nhấp nhô, sao đứng yên, măng bị bỏ chỉ có khung tĩnh. Trạng thái nhìn thấy được ghi ra `data-maze-*` trên canvas (`shoots`, `collected`, `goal`, `missed`, `stunned`) cho e2e.
- Mọi renderer: sau mỗi `await tween(...)` phải kiểm `signal.aborted` (và cờ `destroyed`) **trước** khi đổi cảnh; Làm lại abort rồi gọi `reset()` ngay, phần tiếp theo của event cũ chạy sau đó và không được ghi đè cảnh vừa đặt lại.

## 3. Sprite & pixel
- Sprite gấu trúc gốc là pixel art do AI tạo, mỗi "pixel" ~5,5 px ảnh thật, **không** nằm đúng lưới nguyên. Vì vậy:
  - Texture Măng dùng `scaleMode: 'linear'`, hiển thị nhỏ hơn bản gốc (96–160 px).
  - Tile và icon tự vẽ theo lưới chuẩn (16/32 px) dùng `scaleMode: 'nearest'` và phóng to theo **bội số nguyên**.
- Độ phân giải: `PIXI.Application` vẽ theo `window.devicePixelRatio` (`autoDensity`, `roundPixels`; xem `stages/createStageApp.ts`). Ở DPR lẻ (1,25 / 1,5) tile vẫn `nearest` nên không mờ, nhưng mỗi texel rộng chênh nhau 1 px thiết bị (vd ×3 ở DPR 1,25 = 3–4 px). Chấp nhận cho GĐ 0–1; nếu khi chơi thử thấy rõ, renderer chọn hệ số tile sao cho `hệ số × DPR` là số nguyên.
- Hoạt ảnh: `PIXI.AnimatedSprite` từ spritesheet JSON (định dạng TexturePacker/Pixi). Tốc độ: đi 9 fps, chạy 12 fps, đứng 2 fps.
- **Một đồng hồ:** mọi `AnimatedSprite` tạo với `autoUpdate: false` và được gọi `sprite.update(ticker)` từ `app.ticker`, để dừng / bước / đổi tốc độ chỉ cần điều khiển một ticker. Helper Măng: `stages/pandaSprite.ts` (`createPanda(textures)` → `{ sprite, animation, play(name), update(ticker) }`).
- Lật hướng trái: `sprite.scale.x = -Math.abs(sprite.scale.x)`.
- Maze nhìn từ trên xuống nhưng Măng chỉ có khung nhìn ngang (chưa có `walk_front`/`walk_back` của P0-08): hướng E → mặt phải, W → lật ngang, N/S giữ bên cũ. Hướng nhìn luôn do **mũi tên xanh** (màu khối Di chuyển) trên sàn chỉ rõ: cách tâm ô 0,82 ô, riêng N đặt 1,2 ô để vượt qua đầu Măng. Khung `idle` gần như nhìn thẳng nên chỉ dựa vào lật sprite là không đủ.
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
- Tile Kenney tạm (gói Pixel Platformer, lưới **18×18**) ở `apps/web/public/tiles/<tên>.png`: `ground_left`, `ground`, `ground_right`, `dirt_left`, `dirt`, `dirt_right`, `flag_1`, `flag_2`, `flag_pole`, `crate`, `branch_left`, `branch_right`, `bamboo`. Ô `hole` là ô trống, hai bên dùng `ground_right`/`ground_left`. Hiển thị `nearest`, phóng bội số nguyên (trang `/dev/stage` dùng ×3). Mép trên ô cỏ có viền tối 2 px: đặt chân Măng ở `đỉnh ô + 2 × hệ số`.
- Code nạp asset: `apps/web/src/stages/assets.ts` (`loadPandaSheet`, `loadTiles`; `scaleMode` truyền lúc nạp qua `data` của `PIXI.Assets`); `Assets.setPreferences({ preferWorkers: false })` để giải mã ảnh trên luồng chính (ảnh nhỏ; đường worker của Pixi từng treo lần nạp đầu khi máy rất bận); tạo/hủy `Application` an toàn với StrictMode: `stages/createStageApp.ts`.
- `assets/` là **nguồn**, được commit. `apps/web/public/sprites` là **kết quả build**, cũng được commit (để chạy không cần Python), nhưng không sửa tay.
- Tileset: GĐ 0–1 dùng tạm gói **Kenney** (CC0). Ghi nguồn trong `assets/CREDITS.md`.
- Tile maze **vẽ bằng code**, không có file ảnh: mẫu pixel 12×12 dạng chuỗi (mỗi ký tự 1 texel, `.` trong suốt) trong `stages/maze/pixelArt.ts` (đường, tường tre, măng, khung đích, 2 khung cờ, mũi tên, lấp lánh), dựng thành texture `nearest` qua `BufferImageSource` lúc tạo sân (không cần renderer). Màu lấy từ `ui/tokens.ts`; sắc độ phụ suy ra bằng `shade(token, k)` (có unit test), không viết mã màu rời.

## 5. Âm thanh
- `apps/web/src/audio/sound.ts` bọc Howler: `play('snap' | 'run' | 'step' | 'jump' | 'bump' | 'win' | 'star' | 'coin' | 'click')`, `music(worldId)`, `voice(id)`.
- Ba kênh âm lượng riêng: nhạc, hiệu ứng, giọng đọc (lưu trong cài đặt của hồ sơ).
- Chỉ bắt đầu phát sau lần tương tác đầu tiên của người dùng (chính sách autoplay của trình duyệt).
- File: `apps/web/public/audio/{sfx,music,voice}/`. Định dạng `.mp3` (+ `.ogg` nếu cần).

## 6. Hiệu năng
- Mục tiêu 60 fps trên laptop phổ thông, sân chơi ≤ 300 sprite.
- Chỉ một `PIXI.Application` mỗi lúc. Hủy khi rời màn (`app.destroy(true)` + giải phóng texture không dùng chung).
- Texture của Măng và UI dùng chung được nạp một lần qua `PIXI.Assets` và giữ suốt phiên.
