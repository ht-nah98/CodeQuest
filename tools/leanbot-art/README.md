# tools/leanbot-art — hình cho các bài Leanbot

HLV, 22/10/2026: *"Học sinh tiểu học học thông qua hình ảnh chứ không phải chỉ mấy đoạn chữ."*
Mỗi màn của bài Leanbot nên có một hình (hoặc một cặp hình để so: Đúng / Sai, Chương trình /
Robot chạy). Thư mục này vẽ các hình đó.

```bash
npm run leanbot:art -- bai-01            # vẽ lại mọi hình của Bài 1
npm run leanbot:art -- bai-01 di-thang   # chỉ một hình
```

Hình ra ở `apps/web/public/leanbot/img/<bài>/<tên>.png`, rồi gắn vào màn trong
`content/leanbot/<bài>.json`:

```json
"images": [
  { "src": "bai-01/quay-phai-khoi.png", "alt": "Ba khối: …", "caption": "Chương trình" },
  { "src": "bai-01/quay-phai.png", "alt": "Bánh trái tới, bánh phải lùi…", "caption": "Robot quay phải" }
]
```

## Hai loại cảnh (`scenes/<bài>.mjs`)

| Loại | Viết thế nào | Dùng khi |
|---|---|---|
| `svg` | ghép các mảnh trong `draw.mjs`: `robot` (nhìn từ trên), `front` (nhìn từ trước, cho tay gắp), `arrow`, `arc`, `ruler`, `pill`, `badge`, `mark`… | robot di chuyển, quay, đo; hình tượng trưng (gói mì, vòng sửa lỗi) |
| `blocks` | chương trình viết bằng `blocks.mjs`: `program`, `run`, `distance`, `turnBy`, `stop`, `gripper*`, `wait`, `ifDo`, `repeatWhile`, `objectInFront`, `pingAtMost` | cho bé thấy **đúng khối** cần ghép |

Cảnh `blocks` được nạp vào **trình soạn thật** `ide.pythaverse.space/lbeditor/?lang=vi` rồi chụp
lại, nên khối trong hình giống hệt cái bé thấy, kể cả chỗ còn tiếng Anh ("Mission: Begin when …
combo touched", `if`, `repeat while`). Cần mạng. `badges` gắn số 1, 2, 3 cạnh khối; `rings`
khoanh vàng một ô chọn (`field`) hoặc một ô số (`input`, kèm số `n` phía trên).

Vẽ xong, `shrink.py` (Pillow, `tools/sprites/requirements.txt`) nén về bảng 256 màu: mắt không
thấy khác, tệp nhỏ đi ~60 % (Bài 0–4: 2,6 MB cho 138 hình).

## Ảnh chụp thật (`shots/`)

Ảnh màn hình Leanbot IDE và ảnh robot thật (chụp ngày 22/10/2026) nằm trong `shots/`, đã cắt sẵn
đúng vùng cần nhìn. Cảnh dùng `shot(name, x, y, w, marks)` để đặt ảnh và vẽ đè vòng khoanh
(`ring`, kèm số `n`), mũi tên (`arrow`) hoặc che đi tên người (`cover`). Ảnh màn hình rộng thì cắt
hẹp lại trước, đừng thu nhỏ: chữ IDE thu còn một nửa là bé không đọc được.

## Quy ước

- Hình chụp ở **1,5×** và app hiện đúng cỡ thật (chỉ `srcset … 1.5x`, không kèm `src`, nếu
  không màn hình thường sẽ lấy `src` làm bản 1× và phóng to). Khung bài rộng 728 px: một cảnh
  `scene(w, h)` hiện rộng đúng `w` px. Cặp hình so sánh dùng `pairScene(w, h)`: vẽ trên cùng
  khung nhưng hiện rộng 346 px, nên hai cái đứng cạnh nhau. Ảnh chụp khối thì để xếp chồng,
  thu nhỏ là chữ trong khối khó đọc. Ảnh chụp tay nằm thẳng trong `img/` và hiện 1×.
- Màu lấy từ `apps/web/src/ui/tokens.css`, chữ là font của app (Baloo 2, Nunito).
- **Đừng chép ảnh slide của Pythaverse**: chữ tiếng Anh, của bên khác, và app chạy công khai.
  Vẽ lại bằng mảnh ở đây.
- Vị trí bộ phận robot lấy theo ảnh thật (`leanbot-phan-cung-*.png`): TB1A trước-trái, TB1B
  trước-phải, ngay trước bánh.
- Ảnh không nằm trong precache của PWA (`vite.config.ts`), chỉ cache khi mở lần đầu, nên thêm
  hình không đụng ngân sách 5 MiB.
