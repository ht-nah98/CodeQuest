# 03 — Định hướng phong cách CodeQuest

> Xuất phát điểm: bộ sprite gấu trúc pixel anh gửi (`assets/raw/panda-sheet.png`, 4×4 khung).
> Bản đã làm sạch (nền trong suốt, căn chân thẳng hàng): `assets/sprites/panda/*.png` + `panda-sheet-clean.png`.

---

## 1. Ý tưởng chủ đạo: "Pixel ấm áp"

**Thế giới game vẽ pixel, khung giao diện mềm mại và dễ đọc.**

| Phần | Phong cách | Lý do |
|---|---|---|
| Nhân vật, sân chơi, bản đồ, vật phẩm, icon thưởng | **Pixel art** (giống sprite gấu trúc) | Đồng bộ với nhân vật, cảm giác "đang chơi game" |
| Khung, nút, thẻ bài giảng, khối Blockly | **Bo tròn, viền mực đậm, đổ bóng cứng** (không blur) | Đọc tiếng Việt có dấu rõ ràng, nút trông "bấm được" |
| Số liệu HUD (coin, sao, "còn 3 khối", số màn) | **Font pixel** | Điểm nhấn retro, chỉ dùng cho chữ ngắn |

Lý do không làm toàn bộ bằng pixel: chữ pixel nhỏ + dấu tiếng Việt (ằ, ẫ, ợ…) rất khó đọc với trẻ 8–10 tuổi.

**Mascot: gấu trúc "Măng"** (tên tạm, như măng tre, món gấu trúc thích nhất). Măng dẫn chuyện, giải thích bài và cũng là nhân vật được lập trình trong màn chơi.

---

## 2. Bảng màu

Lấy trực tiếp từ sprite (k-means trên pixel thật):

| Màu sprite | Mã | Dùng cho |
|---|---|---|
| Lông đen | `#202028` / `#32323B` | — |
| Viền | `#101016` | → gốc của màu **mực** UI |
| Kem | `#F9F0E8` | → gốc của màu **nền thẻ** |
| Kem bóng | `#D4C1B9` | → viền phụ |
| Má hồng | `#F9A5A7` | → màu **gợi ý / cảm xúc** |
| Tia vàng (khung cheer) | `#FBC73F` | → màu **coin / sao** |
| Nền tím gốc | `#7B769E` | → màu **thương hiệu** |

### Token giao diện
```css
:root {
  --ink:        #1E1B2E;  /* chữ, viền 3px, bóng cứng */
  --paper:      #FFF8EE;  /* nền thẻ, panel */
  --paper-2:    #F1E6D8;  /* nền phụ, vùng lõm */
  --brand:      #7B769E;  /* tím oải hương – thương hiệu */
  --brand-deep: #4B4673;
  --brand-soft: #D9D5EE;
  --go:         #4FAF5A;  /* nút ▶ Chạy, thành công */
  --go-deep:    #2F7D3A;
  --coin:       #FBC73F;  /* coin, sao */
  --coin-deep:  #C98A12;
  --hint:       #F9A5A7;  /* gợi ý */
  --oops:       #E8615E;  /* lỗi – dùng ít, luôn kèm icon */
  --sky:        #BFE3F2;  /* nền sân chơi ban ngày */
}
```

**Token bổ sung** (lấy từ style board, cần khi dựng component ở P0-04):

| Token | Mã | Dùng cho |
|---|---|---|
| `ink-soft` | `#4A4560` | chữ phụ, chú thích |
| `ground` | `#E9E4F3` | nền trang phía sau các panel |
| `white` | `#FFFFFF` | bong bóng thoại |
| `coin-shine` | `#FFF4C8` | điểm sáng trên icon xu/sao |
| `oops-soft` | `#FDE7E6` | nền hộp cảnh báo |

**Cách đặt tên trong code:** token nằm trong `apps/web/src/ui/tokens.css`, khối `@theme static` của Tailwind 4, theo không gian tên của Tailwind: màu là `--color-<tên>` (vd `--color-ink`, `--color-block-move`), font là `--font-display|body|pixel`, cỡ chữ `--text-*`, bo góc `--radius-*`, bóng `--shadow-*`. Tailwind sinh class tương ứng (`bg-ink`, `font-pixel`, `shadow-hard`). Bảng màu của Tailwind và bóng mặc định đã bị tắt. Mã màu được chép sang `ui/tokens.ts` cho Blockly/PixiJS; unit test so hai file nên phải sửa cả hai cùng lúc.

### Màu khối lệnh (cố định trên toàn hệ thống)
Chọn đủ đậm để **chữ trắng in đậm trên khối đạt độ tương phản ≥ 3:1**. Ngưỡng 3:1 chỉ đúng vì chữ trên khối là chữ lớn in đậm (≥ 18,66px), xem §3. Không giảm cỡ chữ khối xuống dưới mức này:

| Nhóm khối | Màu | Icon |
|---|---|---|
| Di chuyển | `#3A7BD5` | 👣 |
| Lặp | `#D9730D` | 🔁 |
| Điều kiện | `#8A5CD1` | ❓ |
| Cảm biến | `#178A7E` | 👀 |
| Robot (gắp/thả) | `#A0612B` | 🦾 |
| Biến & số | `#D13F73` | 🔢 |
| Hàm | `#5560C8` | 🪄 |
| Bút vẽ | `#2F8A3E` | 🖍️ |

---

## 3. Font chữ (đã kiểm tra trên Google Fonts có bộ ký tự tiếng Việt)

| Vai trò | Font | Ghi chú |
|---|---|---|
| Tiêu đề, nút, **chữ trên khối Blockly** | **Baloo 2** (700–800) | Tròn, vui, đủ dấu tiếng Việt |
| Nội dung, bong bóng thoại | **Nunito** (600–800) | Rất dễ đọc ở cỡ nhỏ |
| Số HUD, nhãn pixel | **VT323** | Font pixel hiếm hoi **có tiếng Việt**; chỉ dùng từ 22px trở lên |

⚠️ **Không dùng** *Press Start 2P, Pixelify Sans, Silkscreen, Tiny5, Jersey 10*. Các font này **không có bộ ký tự tiếng Việt**, dấu sẽ bị rơi sang font khác và vỡ chữ.

Cỡ chữ cho laptop: nội dung ≥ 18px, bong bóng mascot 20–22px, chữ trên khối **14pt ≈ 18,7px in đậm** (mức "chữ lớn" của WCAG, nên ngưỡng tương phản 3:1 ở §2 là đúng).

---

## 4. Thành phần giao diện

- **Nút chunky:** chữ màu `--ink` trên nền `--go`/`--coin`/`--paper` (chữ trắng trên `--go` chỉ đạt 2,8:1, không đủ tương phản), viền 3px `--ink`, bóng cứng `0 5px 0 var(--ink)`. Khi hover, nút nhô lên 1px. Khi bấm, nút lún xuống (`translateY(4px)`, bóng còn 1px) kèm tiếng "tách".
- **Thẻ/panel:** nền `--paper`, bo 18px, viền 3px, bóng cứng 6px.
- **Bong bóng mascot:** nền trắng, viền mực, đuôi nhọn chỉ về Măng. Có nút 🔊 đọc to cho mọi câu cố định (câu có số thay đổi thì không, xem `ui-copy-guide.md` §5). Nút 🔊 rộng **44×44px** (vùng bấm tối thiểu), không phải 36px như bản style board.
- **Viền focus bàn phím:** hai màu: vòng `--paper` 3px sát viền nút, ngoài cùng là viền `--brand-deep` 3px. Một màu đơn sẽ biến mất trên nền cùng màu (thanh trên màu `--brand-deep`).
- **Thanh còn-khối:** những "viên gạch" pixel giảm dần, hết gạch thì rung nhẹ.
- **Sao & coin:** icon pixel 16×16 phóng to theo bội số nguyên, hiệu ứng nảy khi nhận.
- **Icon pixel (`PixelIcon`):** `coin`, `star`, `star-empty`, `flame` (chuỗi ngày), `speaker` (🔊), `play` (▶ Chạy), `bulb` (💡 Gợi ý), `lock` (🔒 chưa mở). Giao diện **không dùng emoji** cho icon: emoji phụ thuộc font của máy (máy không có font emoji hiện ô trống; "▶" thành emoji màu trên Windows).
- **Bản đồ phiêu lưu:** ảnh pixel cuộn ngang, có con đường nối các đảo thế giới. Măng đi theo đường tới màn hiện tại.

---

## 5. Sprite: hiện có và còn thiếu

### Đang có (16 khung)
| Hàng | Khung | Dùng trong game |
|---|---|---|
| 1 | `idle_1`, `talk`, `happy`, `idle_2` | Đứng chờ, nói (bài giảng/gợi ý), vui |
| 2 | `walk_1…4` (nhìn ngang) | Đi 1 ô |
| 3 | `run_1…4` (nhìn ngang) | Chạy nhanh khi tua / màn thắng |
| 4 | `crouch`, `jump`, `kick`, `cheer` | Cúi, nhảy, đá, ăn mừng qua màn |

Sprite chỉ có hướng **nhìn sang phải**. Hướng trái thì lật ngang (`scale.x = -1`).

### 💡 Đề xuất quan trọng: thêm game "Đường chạy của Măng" (góc nhìn ngang) vào MVP
Các khung **đi / nhảy / cúi / đá / ăn mừng** đã đủ cho một game màn hình ngang **ngay bây giờ**, không cần vẽ thêm:
- `nhảy` qua hố, `cúi` chui dưới cành tre, `đá` đổ thùng gỗ, `đi` tới lá cờ, `ăn mừng` khi tới đích
- Dạy được **tuần tự → lặp → điều kiện** ("nếu phía trước có hố thì nhảy")

Mê cung nhìn từ trên xuống (kiểu Blockly Games) cần thêm sprite **đi lên / đi xuống**, nên làm sau.

### Cần tạo thêm (cùng công cụ AI anh đã dùng)
| Ưu tiên | Khung | Cho game |
|---|---|---|
| Cao | `walk_front ×4`, `walk_back ×4` | Mê cung nhìn từ trên xuống |
| Cao | `bump/dizzy ×2–4` (đâm tường, sao quay quanh đầu) | Phản hồi lỗi vui nhộn |
| Cao | `oops` (ôm đầu), `think` (gãi đầu) | Phản hồi sai / gợi ý |
| Trung bình | `point` (chỉ tay), `wave` (vẫy chào) | Hướng dẫn, màn mở đầu |
| Trung bình | `carry` (bê khối), `push` | Băng chuyền, Thành phố Robot |
| Trung bình | Robot nhỏ đồng hành (kiểu Leanbot) ×8 khung | Thế giới Robot |
| Thấp | `sleep`, `fall` (rơi xuống nước) | Chờ lâu, màn có nước |

**Prompt mẫu** (giữ đồng bộ với bộ gốc):
> *Pixel art sprite sheet, 4×4 grid, same cute chibi panda character as reference image, black outline, cream white fur, pink blush cheeks, solid lavender background #7B769E, consistent size and proportions, [mô tả hành động, vd: walking towards the camera, 4 frames walk cycle | walking away from camera, back view, 4 frames], no text.*

Luôn gửi kèm ảnh gốc làm tham chiếu. Sau đó chạy lại script làm sạch (xem §7).

### Tileset & vật phẩm
- **Giai đoạn prototype:** dùng gói **Kenney** (giấy phép CC0, miễn phí, không cần ghi công) làm đồ tạm.
- **Bản chính:** tạo tileset riêng cùng phong cách với gấu trúc: nền cỏ, đường đất, bụi tre, nước, đá, thùng gỗ, lá cờ, măng (coin), khối màu nhiệm vụ AIROC.

---

## 6. Chuyển động & âm thanh

- Animation sprite: 8–10 khung/giây cho đi, 12 khung/giây cho chạy.
- Hiệu ứng UI: ngắn (150–300 ms), dùng easing kiểu "bật nảy". Có tùy chọn **giảm chuyển động**.
- Âm thanh kiểu chiptune nhẹ: tiếng tách khi khối khớp, tiếng "ding" lên dần khi nhận sao, tiếng "boing" vui khi đâm tường (không dùng tiếng buzzer gây sợ). Có thể dùng gói âm thanh CC0 của Kenney.
- Nhạc nền mỗi thế giới một giai điệu, mặc định nhỏ, tắt được.

---

## 7. Lưu ý kỹ thuật khi hiển thị sprite

- Bộ sprite này là pixel art do AI tạo: mỗi "pixel" rộng khoảng 5,5px ảnh thật và **không nằm đúng lưới nguyên**. Vì vậy:
  - Hiển thị ở kích thước **nhỏ hơn bản gốc** (96–160px): dùng scale mượt (linear). Ảnh sẽ trông sắc nét.
  - **Không** dùng `image-rendering: pixelated` ở tỉ lệ không nguyên, vì sẽ bị răng cưa lệch.
  - Icon/tile tự vẽ theo lưới chuẩn (16px, 32px) thì dùng `pixelated` + phóng to theo bội số nguyên.
  - **Ngoại lệ mê cung:** bản đồ tới 12×12 ô phải vừa sân chơi ~516×300 px, nên Măng trong maze chỉ cao 1,4 ô và **tối thiểu 64 px** (thấp hơn mức 96–160px), được phép tràn ra ngoài ô. Khung `idle` gần như nhìn thẳng, nên hướng nhìn do mũi tên trên sàn chỉ (`architecture/stage-rendering.md` §2–3).
- Script làm sạch: `tools/sprites/clean.py` (tách 16 khung, xóa nền tím và bóng bằng flood-fill từ mép, căn đáy chung, xuất PNG trong suốt + `preview.png`). Cách dùng: `docs/playbooks/add-asset.md`.
