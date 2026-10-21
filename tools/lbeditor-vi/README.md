# tools/lbeditor-vi — việt hóa Leanbot Blockly Editor

Hoàn thiện nhãn tiếng Việt cho **cả hai** trình soạn khối của Pythaverse, dùng cho khóa
AIROC 2026 (xem `docs/product/leanbot-airoc-vi.md`):

| Trình | Dùng cho | Sinh ra |
|---|---|---|
| <https://ide.pythaverse.space/lbeditor/> | Leanbot thật | C++ Arduino |
| <https://ide.pythaverse.space/lbeditor-python-simulation/> | Leanbot ảo (Bản Sao Số) | Python (`pyLeanbot`) |

Cả hai dùng chung file ngôn ngữ `blocklyduino/msg/leanbot_vi.js`, nên một bản vá phủ cả hai.

## Vì sao cần

Trình soạn thảo **đã có sẵn chế độ tiếng Việt** (`?lang=vi`, hoặc menu bánh răng →
`Tiếng Việt`). Nhưng bản dịch mới xong một nửa. Đo ngày 21/10/2026 trên Chrome 154:

| | Số khối |
|---|---|
| Khối Leanbot tất cả | 48 |
| Dịch xong | 13 |
| Dịch dang dở (nửa Anh nửa Việt, vd `Di chuyển: approx. Distance in %1`) | 5 |
| **Còn nguyên tiếng Anh** | **30** |

Đếm bằng `check-placeholders.mjs` trên `upstream-leanbot_vi.js`, tính theo trường
`message0` của từng khối.

Những khối còn tiếng Anh lại đúng là các khối dùng nhiều nhất khi đi thi:
`Gripper: Open/Close`, `IRLine: Read sensors`, `Ping: Front distance`,
`Touch: TB1A is touched ?`, `RGB Leds: Clear/Display`, `Mission: End`.

## Hai cách dùng

### Cách 1 — userscript (khuyến nghị, không cần đụng máy chủ)

1. Cài tiện ích **Tampermonkey** cho Chrome.
2. Mở bảng điều khiển Tampermonkey → *Create a new script* → dán toàn bộ
   [`lbeditor-vi.user.js`](lbeditor-vi.user.js) → Ctrl+S.
3. Mở <https://ide.pythaverse.space/lbeditor/?lang=vi> (robot thật) hoặc
   <https://ide.pythaverse.space/lbeditor-python-simulation/index.html?lang=vi> (robot ảo).

Trong Console sẽ thấy `[lbeditor-vi] đã bật nhãn tiếng Việt đầy đủ`.

### Cách 2 — thay thẳng file (nếu Pythaverse đồng ý, hoặc khi tự dựng bản cục bộ)

Chép [`leanbot_vi.js`](leanbot_vi.js) đè lên `blocklyduino/msg/leanbot_vi.js`.
File giữ nguyên tên khóa, thứ tự và số lượng `%n`, nên thay trực tiếp được.
Cách này đổi được cả tên danh mục ngay từ lúc dựng toolbox.

## Cách nó móc vào

`blocklyduino/blocks/leanbot/leanbot.js` **không** nung nhãn vào lúc nạp file ngôn ngữ.
Mỗi khối là một hàm `(id, lang)` chỉ đọc `Blockly.Msg.Leanbot[lang][id]` **khi**
`LeanbotBlocks_begin()` chạy:

```js
Blockly.Blocks[id]         = block(id, Code.LANG);
Blockly.Blocks[id + "_vi"] = block(id, "vi");
```

Nên userscript chỉ cần: vá object thông điệp → gọi lại `LeanbotBlocks_begin()` →
`refreshSelection()`. Không cần proxy, không phụ thuộc thứ tự nạp script.

Tên **danh mục** thì khác: cây toolbox dựng từ `toolbox_leanbot_vi.json` trước khi
userscript chạy, và `refreshSelection()` chỉ dựng lại khay khối chứ không đổi nhãn
danh mục. Vì vậy userscript đổi nhãn danh mục bằng cách sửa chữ đã hiển thị.

## Ràng buộc sống còn: số ô trống `%n`

Blockly gắn `%1..%n` vào các ô nhập của khối **theo vị trí**. Dịch mà làm rơi hoặc
đánh số lại một `%n` thì khối vỡ — và vỡ lúc vẽ ra màn hình, không phải lúc nạp, nên
lớp học sẽ là nơi phát hiện ra. Vì thế có bộ kiểm:

```bash
node tools/lbeditor-vi/check-placeholders.mjs           # so với bản gốc đã lưu
node tools/lbeditor-vi/check-placeholders.mjs --fetch    # tải lại bản gốc rồi so
```

Nó kiểm **cả hai bản dịch** — file `leanbot_vi.js` và danh sách nhãn trong
`lbeditor-vi.user.js` — so với bản gốc và so với nhau, nên hai bản không thể lệch nhau
mà không ai biết. Bắt năm lỗi: lệch `%n`, lệch `%%`, thiếu khối, nhãn còn sót tiếng Anh,
và userscript nói khác file.
`upstream-leanbot_vi.js` là bản gốc đã tải ngày 21/10/2026 để đối chiếu.

Đã thử phá có chủ đích ba kiểu (userscript lệch, thiếu một `%n`, để sót nhãn tiếng Anh):
cả ba đều bị bắt và lệnh trả về mã lỗi 1.

## Đã kiểm chứng những gì

Trên Chrome 154.0.8037.92, ngày 21/10/2026, với `?lang=vi`:

- 48/48 nhãn khớp số ô trống, 0 nhãn còn tiếng Anh (`check-placeholders.mjs`).
- **Trình robot thật:** nạp chương trình mẫu chính thức `FollowLine_EN.bduino` rồi sinh
  code Arduino — **trước và sau khi vá giống hệt nhau từng dòng** (73 dòng).
- **Trình robot ảo:** dựng chương trình mở/đóng tay gắp rồi sinh code Python — **trước và
  sau khi vá cũng giống hệt nhau** (`LbGripper.open()` / `close()` / `LbMotion.stopAndWait()`).
- Kết luận: bản vá chỉ đổi chữ hiển thị, **không đụng tới code sinh ra** ở cả hai trình.
- Danh mục hiển thị: Logic · Vòng lặp · Toán · Chữ · Danh sách · Biến · Chức năng ·
  Arduino · Leanbot · Di chuyển · Tay gắp · Đèn LED · Âm thanh · Cảm biến · Cảm biến vạch.

## Chưa làm

- Nhóm khối **Arduino** (`In/Out`, `Serial`) và nhãn `Logic` vẫn tiếng Anh. Khóa
  Explorer/Creator không dùng tới, nên để sau.
- Bản dịch nằm ở hai chỗ (file và userscript). Bộ kiểm bắt được khi hai chỗ lệch nhau,
  nhưng vẫn phải sửa tay cả hai. Gộp làm một chỉ đáng làm nếu sau này phải dịch thêm nhóm
  khối Arduino.
- Chưa gửi bản dịch cho Pythaverse. Nếu họ nhận, cách 2 là cách gọn nhất.
