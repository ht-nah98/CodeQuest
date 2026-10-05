# Playbook: thêm sprite, tileset, âm thanh

**Đọc trước:** `design/art-direction.md`, `architecture/stage-rendering.md` §3–5.

## Sprite nhân vật
1. Tạo sprite sheet **4×4**, nền tím đặc `#7B769E`, cùng nhân vật và tỷ lệ với bộ gốc (prompt mẫu ở `art-direction.md` §5). Luôn gửi kèm ảnh gốc làm tham chiếu.
2. Lưu file gốc vào `assets/raw/<nhân vật>-<hành động>.png`. **Không** sửa file gốc.
3. Chạy `npm run sprites -- assets/raw/<file>.png assets/sprites/<nhân vật>/ --names <tên 16 khung, cách nhau bởi dấu phẩy>`.
4. Mở `assets/sprites/<nhân vật>/preview.png` kiểm tra: nền đã trong suốt chưa, còn đường kẻ lưới không, chân có thẳng hàng không.
5. Chạy `npm run sprites:pack -- assets/sprites/<nhân vật>` (`tools/sprites/pack.py`, có từ task P0-06) → `apps/web/public/sprites/<nhân vật>.{png,json}`.
6. Thêm tên hoạt ảnh mới vào bảng trong `stage-rendering.md` §3.

## Tileset
- Lưới chuẩn **16×16** (hoặc 32×32), vẽ đúng lưới nguyên, hiển thị `nearest` + phóng bội số nguyên.
- Tạm thời: gói Kenney CC0. Ghi tên gói + link vào `assets/CREDITS.md`.

## Hình đích (`goalSprite`, P2-11c)
Hình vẽ ở ô đích của runner và maze (`level.goalSprite`, `content-model.md` §3). Hiện là **hình tạm** vẽ bằng mã: mẫu pixel 12×12 dạng chuỗi trong `apps/web/src/stages/goalArt.ts` (màu token, như tile maze), dùng chung cho sân chơi PixiJS, dải cả đường, khung "Xem cả đường" và thẻ đáp án. Xem tất cả ở `/dev/ui` (bản dev), mục "Hình đích".

**TODO cho HLV / họa sĩ** (thay hình tạm bằng pixel art thật, cùng lưới 12×12 hoặc 16×16, nền trong suốt):
- [ ] `machine` máy của bác Cú (W3: máy xay, xe đẩy, máy tưới…) — hình tạm: hộp gỗ có bánh răng, ống khói, đèn xanh.
- [ ] `exit` cửa ra khỏi kho — hình tạm: khung cửa gỗ sáng, mũi tên xanh.
- [ ] `home` nhà (bác Cú, nhà của Gà con) — hình tạm: nhà mái đỏ.
- [ ] `footprints` dấu chân Thỏ Bông (W4) — hình tạm: hai dấu chân nâu.
- [ ] `friend` bạn — đang dùng mặt Thỏ Bông của hình đại diện (`ui/Avatar.tsx`, 16×16); cần dáng đứng nếu muốn khác hình đại diện.
- [ ] `cage` lồng (W4 boss; T17 cần cả khung **mở**) — hình tạm: lồng đóng có ổ khóa.
- [ ] `dock` bến đò (W5) — hình tạm: cầu gỗ trên nước.
- [ ] Chìa khóa, bạn đi theo Măng (T17c, `rescue`/`escort`): chưa có, làm cùng P2-11c phần vật phẩm.

Thay hình: sửa mẫu trong `goalArt.ts` (hoặc chuyển sang file PNG trong `apps/web/public/tiles/` và nạp như tile Kenney, cập nhật `stage-rendering.md` §4); test `goalArt.test.ts` kiểm mẫu vuông, đủ màu.

## Cảnh thế giới (`world.theme.scene`, P2-23)
Mỗi thế giới vẽ sân chơi, dải cả đường, "Xem cả đường", thẻ đáp án và đảo trên bản đồ theo cảnh của nó (`architecture/stage-rendering.md` §7). Cảnh vẽ bằng mã, không có file ảnh.
1. Chọn cảnh cho thế giới: `"theme": { …, "scene": "<id>" }` trong `world.json` (`content-model.md` §3). Không ghi = `lang-tre`.
2. Sửa cảnh có sẵn:
   - Màu: `apps/web/src/stages/sceneThemes.ts` (chỉ token hoặc `shade`/`mix` của token, không mã màu rời).
   - Đất runner (18×18, 2 hàng viền trên là `k`) và tường/đường maze (12×12, cột phải + hàng dưới là vạch vữa): `apps/web/src/stages/sceneTiles.ts`.
   - Trời, lớp xa, lớp gần: `apps/web/src/stages/runner/scenery.ts`; đom đóm / ánh nước: `runner/decor.ts`; đảo: `screens/map/Island.tsx`.
3. Thêm cảnh mới: thêm id vào `SCENE_THEMES` (`packages/content-schema/src/world.ts`), một mục trong `SCENE_ART`, mẫu trong `sceneTiles.ts`, hàm vẽ trong `scenery.ts`, vật mốc trong `Island.tsx`, một dòng ở bảng `stage-rendering.md` §7.
4. Luật: **không** đổi hình hay màu vật cản/vật nhặt/đích; đồ trang trí không giống thùng, hố, cành thấp hay măng; mọi vật động phải đứng yên khi giảm chuyển động; phóng to theo số nguyên.
5. Kiểm: `npx vitest run apps/web/src/stages/sceneThemes.test.ts` (độ tương phản ≥ 3:1 của vật cản/vật nhặt với nền, hố với đất, vật nhặt với đường maze; tường/đường ≥ 2,25:1). Xem thử trên bản dev: `/play/<levelId>?theme=<id>`; ảnh chụp: `CQ_SHOTS_DIR=<thư mục> npm run e2e -- e2e/scene-themes.spec.ts`.

## Âm thanh
- Hiệu ứng `.mp3`, ≤ 1 giây, chuẩn hóa âm lượng −16 LUFS. Nguồn CC0 (Kenney Audio) hoặc tự tạo. Ghi vào `assets/CREDITS.md`.
- Hiệu ứng hiện có là tự tạo bằng mã: thêm/sửa công thức trong `tools/audio/src/sfx.ts`, tên thêm vào `apps/web/src/audio/sfxCatalog.ts`, chạy `npm run audio:gen` (xem `architecture/audio.md` §4).
- Giọng đọc: `apps/web/public/audio/voice/<id câu>.mp3`, id theo `content-model.md` §2.

## Giấy phép
Chỉ dùng asset CC0, CC-BY (ghi công), hoặc tự tạo / AI tạo theo yêu cầu của huấn luyện viên. **Không** dùng asset của Blockly Games (Pegman…) cho bản chính, để giữ phong cách riêng.
