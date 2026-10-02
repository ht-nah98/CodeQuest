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

## Âm thanh
- Hiệu ứng `.mp3`, ≤ 1 giây, chuẩn hóa âm lượng −16 LUFS. Nguồn CC0 (Kenney Audio) hoặc tự tạo. Ghi vào `assets/CREDITS.md`.
- Hiệu ứng hiện có là tự tạo bằng mã: thêm/sửa công thức trong `tools/audio/src/sfx.ts`, tên thêm vào `apps/web/src/audio/sfxCatalog.ts`, chạy `npm run audio:gen` (xem `architecture/audio.md` §4).
- Giọng đọc: `apps/web/public/audio/voice/<id câu>.mp3`, id theo `content-model.md` §2.

## Giấy phép
Chỉ dùng asset CC0, CC-BY (ghi công), hoặc tự tạo / AI tạo theo yêu cầu của huấn luyện viên. **Không** dùng asset của Blockly Games (Pegman…) cho bản chính, để giữ phong cách riêng.
