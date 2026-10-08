# Nguồn tài sản

| Tài sản | Nguồn | Giấy phép |
|---|---|---|
| Sprite gấu trúc Măng (`raw/panda-sheet.png`) | Huấn luyện viên cung cấp (tạo bằng AI) | Thuộc dự án |
| Font Baloo 2, Nunito, VT323 | Google Fonts | SIL Open Font License 1.1 |
| Tile tạm cho runner (`apps/web/public/tiles/*.png`): `ground_left/ground/ground_right` = `tile_0021/0022/0023`, `dirt_left/dirt/dirt_right` = `tile_0121/0122/0123`, `flag_1/flag_2` = `tile_0111/0112`, `flag_pole` = `tile_0131`, `crate` = `tile_0026`, `branch_left/branch_right` = `tile_0098/0099` (cành thấp, P1-03), `bamboo` = `tile_0125` (măng để nhặt, P1-03) | Kenney, gói **Pixel Platformer** 1.2 (https://kenney.nl/assets/pixel-platformer), giấy phép gốc ở `apps/web/public/tiles/LICENSE-kenney.txt` | CC0 1.0 |
| Hiệu ứng âm thanh + 2 bài nhạc nền (`apps/web/public/audio/{sfx,music}/*.mp3`, P1-14) | Tự tạo bằng mã: bộ tổng hợp chiptune tất định `tools/audio/` (`npm run audio:gen`), không dùng mẫu âm thanh nào của người khác | Thuộc dự án |
| Icon PWA (`apps/web/public/icons/*.png`, P2-09): Măng khung `happy` trên nền lavender | Sinh từ `apps/web/public/sprites/panda.png` bằng `python3 tools/pwa/make_icons.py` (phóng nearest-neighbor) | Thuộc dự án |
| Hình tạm sa bàn robot W6 (`apps/web/src/stages/robotlab/robotArt.ts`, P3-03): robot Bíp nhìn từ trên xuống, tay gắp mở / đóng, khối rào / trung hòa / ô nhiễm, nhà, bình thí nghiệm (biển phòng thí nghiệm), đồng hồ, cúp điểm; nền phố, hàng nhà cao tầng và ô lát của cảnh `thanh-pho-robot` (`stages/sceneThemes.ts`, `stages/sceneTiles.ts`, `stages/runner/scenery.ts`, đảo trong `screens/map/Island.tsx`) | Vẽ cho dự án bằng mã (lưới 16×16 / 12×12; màu là token trong `ui/tokens.ts` hoặc suy ra bằng `shade()` / `mix()`), không dùng file ảnh. P3-02 thay bằng sprite đẹp | Thuộc dự án |
| Tile mê cung (`apps/web/src/stages/maze/pixelArt.ts`): đường, tường tre, măng, khung đích, cờ, mũi tên hướng, tia sáng | Vẽ cho dự án bằng mã (lưới 12×12; màu là token trong `ui/tokens.ts` hoặc sắc độ suy ra bằng `shade()`), không dùng file ảnh | Thuộc dự án |

## Font tự host (P0-04)

Tải ngày 01/10/2026 từ Google Fonts (CSS API, chỉ lấy bộ `vietnamese` + `latin`), lưu ở `apps/web/public/fonts/`. Khai báo `@font-face` trong `apps/web/src/ui/fonts.css`.

| File | Font | Tác giả | Giấy phép |
|---|---|---|---|
| `baloo2-{vietnamese,latin}.woff2` | Baloo 2 (variable, dùng 700–800) | Ek Type | SIL OFL 1.1 — https://github.com/EkType/Baloo2 |
| `nunito-{vietnamese,latin}.woff2` | Nunito (variable, dùng 600–800) | Vernon Adams, Cyreal, Jacques Le Bailly | SIL OFL 1.1 — https://github.com/googlefonts/nunito |
| `vt323-{vietnamese,latin}.woff2` | VT323 | Peter Hull | SIL OFL 1.1 — https://fonts.google.com/specimen/VT323 |

OFL cho phép dùng, nhúng và phân phối lại kèm phần mềm; không bán riêng file font. Toàn văn: https://openfontlicense.org
