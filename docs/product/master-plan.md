# 02 — Kế hoạch xây dựng nền tảng học tư duy lập trình cho trẻ tiểu học

> Tên sản phẩm: **CodeQuest** · Mascot: gấu trúc pixel **Măng** (tên tạm)
> Người dùng: **6 học sinh** (bé của anh + nhóm 5 bạn), lớp 3–5 · Thiết bị: **laptop** (chuột/trackpad + bàn phím)
> Có phục vụ AIROC 2026, nhưng **robot nằm ở các phiên bản và level tầng giữa**
> Tài liệu liên quan: [`01-phan-tich-blockly.md`](../research/blockly-analysis.md) · [`03-dinh-huong-phong-cach.md`](../design/art-direction.md)


> **Lưu ý (cập nhật 01/10/2026):** đây là **bản kế hoạch tổng gốc**, giữ lại để hiểu lý do của các quyết định. Chi tiết đã được tách thành tài liệu chuyên đề và **các tài liệu đó là nguồn chuẩn** (xem `docs/README.md`). Những điểm đã thay đổi so với bản này:
> - **Đoán kết quả, Săn lỗi, Ghép hình, Sáng tạo** giờ là **cách chơi** (`mode`), áp dụng được cho mọi kiểu game, không còn là kiểu game riêng → `product/game-kinds.md`.
> - Khối lặp dùng `cq_repeat` riêng (vì `maxBlocks` của Blockly đếm cả shadow) → `architecture/blockly-integration.md` §5.
> - Cấu trúc thư mục, interface và schema chính thức → `architecture/overview.md`, `game-kind-sdk.md`, `content-model.md`.
> - Task cụ thể → `roadmap/`.
> - Kiểu game của từng thế giới và danh sách màn → `product/curriculum.md` (vd Thế giới 4 không còn dùng sorter).
> - Giới hạn bước của sandbox là 100 000 (không phải 10 000) → `architecture/runtime-engine.md` §4.
> - Con số sao/xu/gợi ý → `product/rewards-economy.md`. Ghost block được thay bằng popover "chỉ bước tiếp" → `architecture/blockly-integration.md` §8.
---

## 0. Tầm nhìn & nguyên tắc

**Một câu:** Bé vào web như vào một game phiêu lưu. Mỗi vùng đất dạy một khái niệm tư duy lập trình. Bé được giải thích trước, chơi nhiều kiểu trò chơi để luyện, kiếm sao/coin, và dùng coin mua gợi ý khi bí.

Năm nguyên tắc không được phá:
1. **Hiểu trước, làm sau.** Mỗi khái niệm mới đều có bài giảng ngắn bằng hình + giọng đọc trước khi chơi.
2. **Sai là một phần của trò chơi.** Thua thì vui, không phạt, phản hồi phải nói rõ *sai ở đâu*.
3. **Đa dạng kiểu bài.** Cùng một khái niệm được luyện qua 3–4 kiểu game khác nhau, để bé hiểu bản chất chứ không thuộc lòng vị trí khối.
4. **Phần thưởng phục vụ việc học.** Coin không được biến thành nút "mua đáp án cho xong" (xem §5).
5. **Nội dung là dữ liệu.** Màn chơi, bài giảng, gợi ý đều viết bằng JSON. Thêm 100 màn mới không cần sửa code.

---

## 1. Kiến trúc nội dung: Thế giới → Chương → Màn

```
Bản đồ phiêu lưu
 └─ Thế giới (1 khái niệm lớn, vd "Rừng Lặp Lại")
     ├─ 📖 Bài giảng      2–4 thẻ hình + mascot + ví dụ chạy được
     ├─ 🧩 Luyện có khung  khối có sẵn, bé chỉ sắp xếp/điền (scaffold)
     ├─ 🎮 Luyện tự do     nhiều kiểu game khác nhau
     ├─ 🏆 Thử thách       giới hạn khối chặt, đòi tối ưu
     ├─ 👾 Boss            màn tổng hợp có cốt truyện, mở thế giới tiếp theo
     └─ 🎨 Sáng tạo        sân chơi mở, không chấm đúng/sai
```

### 1.1. Chu trình dạy một khái niệm (dựa trên khung PRIMM)
| Bước | Bé làm gì | Kiểu bài |
|---|---|---|
| Kể chuyện | Nghe mascot kể vấn đề của nhân vật | Bài giảng |
| Ngoài màn hình | Phụ huynh nhận gợi ý 1 trò chơi vận động 5 phút (vd: "con là robot") | Thẻ cho huấn luyện viên / phụ huynh |
| **P**redict – Đoán | Xem chương trình có sẵn, đoán robot đi đâu | Đoán kết quả |
| **R**un – Chạy | Bấm chạy, đối chiếu với dự đoán | Ví dụ chạy được |
| **I**nvestigate – Soi | Đổi 1 số, xem điều gì thay đổi | Bài giảng tương tác |
| **M**odify – Sửa | Sửa chương trình sai | Thợ săn lỗi |
| **M**ake – Tự làm | Tự viết từ đầu | Mê cung / Họa sĩ / … |

### 1.2. Lộ trình 10 thế giới (~190 màn chính + màn bonus)

Robot đặt ở **Thế giới 6**, giữa lộ trình. Đến đó bé đã có đủ nền tuần tự, lặp, gỡ lỗi, điều kiện, lặp có điều kiện, tức là toàn bộ những gì Blockly cho AIROC cần. Các thế giới sau đó (biến, hàm, thuật toán) giúp bé **làm nhiệm vụ robot gọn và tối ưu hơn**.

| # | Thế giới | Khái niệm | Khối mới | Kiểu game chủ đạo | Số màn |
|---|---|---|---|---|---:|
| 1 | 🎋 Làng Tre | Kéo thả, **tuần tự**, thứ tự quan trọng | đi, nhảy, cúi, rẽ | Đường chạy, Ghép hình, Đoán | 15 |
| 2 | 🌳 Rừng Lặp Lại | **Lặp n lần**, nhận ra mẫu lặp | lặp `n` lần | Đường chạy, Mê cung, Nhạc công | 20 |
| 3 | 🔧 Xưởng Sửa Lỗi | **Gỡ lỗi**: đọc, tìm, sửa | (ôn tập) | Thợ săn lỗi, Đoán | 15 |
| 4 | 🔀 Ngã Ba Quyết Định | **Điều kiện** nếu/nếu-không, cảm biến | nếu, nếu-không, có hố?, có đường? | Đường chạy, Mê cung, Băng chuyền | 20 |
| 5 | 🌊 Sông Chờ Đợi | **Lặp có điều kiện** (lặp đến khi) | lặp đến khi, đã tới đích? | Mê cung, Nông trại | 20 |
| 6 | 🤖 **Thành Phố Robot** | Robot + cảm biến + tay gắp, **nhiệm vụ kiểu AIROC** | tiến/rẽ theo ô, dò line, gắp, thả, màu khối | Phòng thí nghiệm Robot | 20 |
| 7 | 🏪 Chợ Đếm Số | **Biến**, đếm, so sánh | biến, +1, so sánh | Nông trại, Băng chuyền, Robot | 20 |
| 8 | 🪄 Xưởng Phép Thuật | **Hàm/thủ tục**, tham số | định nghĩa hàm, gọi hàm | Họa sĩ, Robot | 20 |
| 9 | 🎨 Tháp Họa Sĩ | **Lặp lồng nhau**, góc, hình học | lặp lồng, góc, bút màu | Họa sĩ rùa | 20 |
| 10 | 🧠 Học Viện Thuật Toán | Tìm đường, **sắp xếp**, tìm kiếm, tối ưu | danh sách, đổi chỗ | Băng chuyền, Mê cung lớn | 20 |

Trong **Thế giới 6**, 20 màn tăng dần độ khó:
- **Màn 1–5:** điều khiển robot đi theo ô, rẽ đúng góc.
- **Màn 6–10:** dò line, dừng ở nút giao.
- **Màn 11–15:** gắp/thả khối màu, tương ứng nhiệm vụ **Containment** và **Analysis**.
- **Màn 16–20:** ghép cặp **Neutralization**, quay về CRL, đề bài **ngẫu nhiên** có giới hạn thời gian 2–3 phút như luật thi.

Robot cũng xuất hiện lại trong boss của Thế giới 7–8 để bé áp dụng biến và hàm vào nhiệm vụ robot.


### 1.3. Mỗi màn chơi phải ghi rõ (bắt buộc trong file dữ liệu)
- **Mục tiêu học** (1 câu): bé luyện được gì
- **Ngộ nhận nhắm tới** (vd: "nghĩ phải đi hết mọi ô", "nghĩ lặp chỉ dùng cho 1 khối")
- **Lời giải tối ưu** (dùng để chấm sao và để test tự động)
- **Par** (số khối chuẩn)

---

## 2. Các kiểu trò chơi

| # | Kiểu game | Cách chơi | Khái niệm phù hợp | Chấm bài | Giai đoạn |
|---|---|---|---|---|---|
| 1 | **Đường chạy của Măng** (nhìn ngang) | Lập trình Măng đi, nhảy qua hố, cúi dưới cành tre, đá đổ thùng để tới lá cờ | Tuần tự, lặp, điều kiện | Trạng thái cuối | **MVP**, sprite đã đủ |
| 2 | **Mê cung** (nhìn từ trên) | Lập trình Măng đi tới đích trên lưới | Tuần tự, lặp, điều kiện, lặp-đến-khi | Trạng thái cuối | MVP, cần thêm sprite đi lên/xuống |
| 3 | **Đoán kết quả** | Xem code có sẵn, chọn đáp án bằng hình (Măng dừng ở ô nào?) | Đọc code, truy vết | So đáp án | MVP |
| 4 | **Thợ săn lỗi** | Code có sẵn bị sai, sửa với ít thao tác nhất | Gỡ lỗi | Trạng thái cuối + số lần sửa | GĐ 2 |
| 5 | **Ghép hình** (kiểu Parsons) | Khối đã có sẵn, chỉ sắp xếp đúng thứ tự | Tuần tự, cấu trúc | Chạy thử | MVP |
| 6 | **Phòng thí nghiệm Robot** | Robot trên sa bàn kiểu Synapse City, có cảm biến + tay gắp | Cảm biến, nhiệm vụ AIROC | Bảng điểm nhiệm vụ | **GĐ 3** |
| 7 | **Họa sĩ rùa** | Vẽ hình giống mẫu | Lặp lồng, góc, hàm | So pixel (như Turtle) | GĐ 4 |
| 8 | **Nông trại** | Đi thu hoạch, đếm số quả | Biến, lặp có điều kiện | Trạng thái + giá trị biến | GĐ 4 |
| 9 | **Băng chuyền** | Phân loại đồ vật theo màu/hình | Điều kiện, sắp xếp | Trạng thái cuối | GĐ 4 |
| 10 | **Nhạc công** | Ghép giai điệu theo mẫu | Tuần tự, lặp, hàm | So chuỗi nốt | GĐ 4 |
| 11 | **Sân chơi sáng tạo** | Tự do, lưu lại và khoe với nhóm | Tổng hợp | Không chấm | GĐ 4 |

---

## 3. Vòng lặp một màn chơi (core loop)

```
Vào màn → Mascot đọc mục tiêu (≤ 12 chữ + giọng đọc)
       → Bé kéo thả khối (thanh "còn N khối" luôn hiện)
       → [Tùy màn] Hỏi bé "Con đoán robot sẽ đi đâu?" trước khi chạy
       → ▶ Chạy: engine chạy trước trong sandbox, ghi log
       → Phát lại animation + tô sáng khối đang chạy
           ├─ Thắng → pháo hoa, sao bay, coin bay vào ví, xem "con vừa viết N dòng code"
           └─ Chưa được → nhân vật phản ứng vui nhộn
                        → chỉ đúng khối gây lỗi + 1 câu giải thích theo loại lỗi
                        → gợi ý theo ngữ cảnh (miễn phí, tầng 0)
```

Phản hồi theo loại kết quả (kế thừa 4 loại của Blockly Games, thêm 1):
| Kết quả | Câu mascot nói (ví dụ) | Hành động UI |
|---|---|---|
| Thắng | "Tuyệt vời! Con dùng 4 khối, đúng bằng chuẩn!" | Màn kết quả |
| Đâm tường | "Ối, cục đá! Khối này đi thẳng nhưng phía trước có đá." | Rung khối gây lỗi |
| Chưa tới đích | "Gần lắm rồi! Robot còn cách đích 2 ô." | Vẽ đường mờ còn thiếu |
| Lặp mãi | "Robot chóng mặt rồi, vòng lặp không bao giờ dừng!" | Dừng sau 10.000 bước |
| Sai đáp án (bài đoán) | "Chưa đúng, cùng chạy thử để xem nhé." | Chạy chậm từng bước |

Điều khiển khi chạy: ▶ Chạy · ⏭ Từng bước · 🐢/🐇 Tốc độ · ↺ Làm lại.

---

## 4. Hệ thống gợi ý 3 tầng

| Tầng | Tên | Nội dung | Giá | Ảnh hưởng sao |
|---|---|---|---|---|
| 0 | Gợi ý tự động | Theo ngữ cảnh: "Hai cụm khối đang rời nhau, nối lại nhé" | Miễn phí | Không |
| 1 | 💡 Gợi ý tư duy | Câu hỏi gợi mở: "Con thấy đoạn nào bị lặp lại?" | 5 coin | Không |
| 2 | 🧭 Chỉ bước tiếp | Hiện **khối mờ** (ghost) ở đúng vị trí tiếp theo | 15 coin | Tối đa ⭐⭐ |
| 3 | 📜 Xem lời giải | Hiện lời giải đầy đủ dạng **chỉ đọc**, bé phải **tự ghép lại** | 40 coin | Tối đa ⭐ |

Lưới an toàn chống nản: sai **3 lần** → tầng 1 tự mở miễn phí; sai **6 lần** → giảm giá tầng 2 còn 5 coin.

---

## 5. Phần thưởng & kinh tế coin

### 5.1. Sao (mỗi màn tối đa 3 sao)
- ⭐ Hoàn thành
- ⭐⭐ Dùng số khối ≤ par
- ⭐⭐⭐ ≤ par **và** không dùng gợi ý tầng 2–3

Sao **mở khóa** thế giới tiếp theo (vd: cần 60% tổng số sao của thế giới trước) → khuyến khích quay lại tối ưu bài cũ.

### 5.2. Coin
| Nguồn | Coin |
|---|---:|
| Qua màn lần đầu | +10 |
| Mỗi sao từ sao thứ 2 trở đi | +5 |
| Đúng ngay lần chạy đầu | +5 |
| Hoàn thành bài giảng | +5 |
| Học liên tục mỗi ngày (streak) | +10/ngày, mốc 7 ngày +50 |
| Chơi lại màn đã 3 sao | +1 (tối đa 5 coin/ngày để chống "cày") |

| Tiêu coin | Giá |
|---|---:|
| Gợi ý tầng 1 / 2 / 3 | 5 / 15 / 40 |
| Skin nhân vật (robot, mèo, phi hành gia…) | 50–200 |
| Màu bút, hiệu ứng pháo hoa, nhạc nền | 30–100 |
| Mở màn bonus | 30 |

Nguyên tắc cân bằng: **một màn thường cho ~15–25 coin, một lời giải tốn 40 coin**, nên không thể mua đáp án mọi màn. Bộ chỉ số theo dõi (§10) sẽ dùng để tinh chỉnh.

### 5.3. Huy hiệu & bộ sưu tập
- Huy hiệu khái niệm: "Bậc thầy vòng lặp", "Thám tử sửa lỗi"…
- Huy hiệu hành vi: "Kiên trì" (thử 5 lần rồi tự giải được), "Tiết kiệm" (10 màn dưới par)
- Album sticker nhân vật mở dần theo cốt truyện

---

## 6. UI/UX

> Phong cách hình ảnh, bảng màu, font và sprite chi tiết ở [`03-dinh-huong-phong-cach.md`](../design/art-direction.md).

### 6.1. Nguyên tắc
- **Laptop là thiết bị chính.** Kích thước thiết kế chuẩn là **1366×768**, tối thiểu **1280×720** (laptop 1920×1080 đặt scale 150% cũng ra 1280×720). Màn hình lớn hơn thì vùng ghép khối rộng ra.
- **Khuyên dùng chuột rời:** trẻ 8–10 tuổi kéo thả bằng trackpad rất khó. Vẫn hỗ trợ trackpad: khối to, vùng hít (snap) rộng, có thể thả hơi lệch.
- **Phím tắt** (hiện trên nút): `Space` = Chạy/Dừng · `S` = Từng bước · `R` = Làm lại · `H` = Gợi ý · `Esc` = Đóng hộp thoại.
- Có **hover state** cho mọi thứ bấm được, kèm tooltip có hình.
- Nút tối thiểu **44px**. Nút ▶ Chạy rất to và luôn ở cùng một chỗ.
- **Ít chữ:** mỗi bong bóng ≤ 12 chữ, luôn có nút 🔊 đọc to (giọng tiếng Việt thu sẵn / TTS sinh trước, không gọi API lúc chạy).
- Màu khối **cố định theo khái niệm** trên toàn hệ thống, khối có **icon + động từ ngắn** (bảng màu ở `docs/design/art-direction.md`).
- Renderer Blockly **`zelos`** (khối tròn, to kiểu Scratch) + theme riêng, font Baloo 2.
- Không bao giờ dùng màu làm tín hiệu duy nhất, luôn kèm icon. Có theme cho trẻ mù màu (plugin có sẵn).
- Có tùy chọn giảm chuyển động, chỉnh âm lượng.
- Nhắc nghỉ nhẹ nhàng sau 25 phút.

### 6.2. Bố cục màn chơi (laptop 1366×768)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Bản đồ    Làng Tre · Màn 5        ⭐⭐☆           🪙 120    🔊  ⚙       │
├──────────────────────────────┬─────────┬─────────────────────────────────┤
│                              │ Thanh   │                                 │
│   SÂN CHƠI (PixiJS)          │ khối    │   VÙNG GHÉP KHỐI                │
│   🎋        🐼 → → ⛳         │ 👣 đi   │   ▶ khi bắt đầu                 │
│   ▓▓▓▓▓  ▓▓▓▓ __ ▓▓▓▓        │ 🦘 nhảy │     🔁 lặp 3 lần                │
│                              │ 🔁 lặp  │        👣 đi                    │
├──────────────────────────────┤         │        🦘 nhảy                  │
│ 🎯 Đến lá cờ, dùng ≤ 3 khối  │         │                                 │
│ [▶ CHẠY ␣]  ⏭ S  🐢━●━🐇  ↺ R│         │   🧱🧱🧱 còn 0 khối    💡 Gợi ý H│
├──────────────────────────────┴─────────┴─────────────────────────────────┤
│ 🐼 Măng: "Con thấy đoạn nào lặp lại không?"  🔊                          │
└──────────────────────────────────────────────────────────────────────────┘
```
Sân chơi chiếm khoảng 42% chiều ngang, vùng ghép khối khoảng 58%. Có thể kéo thanh chia để đổi tỷ lệ.

### 6.3. Danh sách màn hình
1. Đăng nhập kiểu trẻ em: chọn avatar của mình + mã PIN 4 số (không cần email)
2. **Bản đồ phiêu lưu** — bản đồ pixel cuộn ngang, các đảo/thế giới, Măng đứng ở màn hiện tại
3. Trang thế giới — danh sách màn, sao, boss
4. Thẻ bài giảng — trình chiếu từng thẻ, có ví dụ chạy được
5. **Màn chơi** (theo từng kiểu game)
6. Màn kết quả — sao, coin, "con vừa viết N dòng code"
7. Cửa hàng & tủ đồ (skin)
8. Bộ sưu tập huy hiệu
9. **Góc huấn luyện viên** (cho anh, có khóa) — tiến độ của **cả 6 bé**, khái niệm yếu của từng bé, màn nào cả nhóm hay kẹt, thời gian học, gợi ý hoạt động ngoài màn hình
10. **Góc nhóm** — mục tiêu chung của cả nhóm (vd: "cả nhóm đạt 300 ⭐"), bảng khoe tác phẩm ở Sân chơi sáng tạo
11. Cài đặt

### 6.4. Cảm giác (micro-interaction)
Tiếng "tách" khi khối khớp · sao nổ và bay lên · coin bay vào ví · mascot nhảy khi thắng, ôm đầu khi đâm tường · bản đồ có hiệu ứng mở đường khi qua thế giới mới.

---

## 7. Kiến trúc kỹ thuật

### 7.1. Công nghệ
| Lớp | Lựa chọn | Lý do |
|---|---|---|
| Khung | **React + TypeScript + Vite** | Anh quen, build nhanh, SPA tĩnh |
| Trình ghép khối | **Blockly 13** (`blockly` npm) + plugin `@blockly/*` | Đã phân tích ở `docs/research/blockly-analysis.md` |
| Sandbox chạy code | **`js-interpreter`** | Chạy từng bước, chặn lặp vô hạn, cách ly |
| Sân khấu game | **PixiJS** (WebGL 2D) | Sprite, animation mượt, `AnimatedSprite` cho Măng |
| UI & chuyển động | Tailwind CSS + Motion (Framer Motion) | Nhanh, animation khai báo |
| Mascot & nhân vật | Sprite pixel **Măng** (16 khung có sẵn) + PixiJS `AnimatedSprite` | Dùng chính sprite anh gửi, không cần Rive/Lottie |
| Âm thanh | Howler.js | Đa định dạng, ổn định trên mọi trình duyệt |
| State | Zustand | Nhẹ, đơn giản |
| Lưu trữ cục bộ | IndexedDB (Dexie) | Lưu tiến độ & bài làm dở, chạy offline |
| Backend (từ GĐ 2) | **Supabase** (Postgres + Auth + Row Level Security) | 6 bé học trên 6 laptop khác nhau, anh cần xem tiến độ cả nhóm. Gói miễn phí dư cho quy mô này |
| Hosting | Vercel hoặc Cloudflare Pages | Web tĩnh, miễn phí, gửi link cho các bé là dùng |
| Offline | PWA | Mạng chập chờn vẫn chơi được, đồng bộ lại sau |
| Test | Vitest + Playwright + Blockly headless | Xem §8 |

### 7.2. Sơ đồ module
```
            ┌──────────────── content/ (JSON) ────────────────┐
            │ worlds · levels · lessons · hints · shop items  │
            └───────────────────────┬─────────────────────────┘
                                    ▼
┌───────────┐   blocks/   ┌──────────────────┐   events log   ┌──────────────┐
│  Blockly  │────────────▶│  Runtime Engine  │───────────────▶│  Stage       │
│ Workspace │  sinh JS    │ js-interpreter   │                │ (PixiJS)     │
│ (React)   │◀────────────│ + GameKind API   │                │ phát lại,    │
└───────────┘ highlight   └────────┬─────────┘                │ tua, từng bước│
                                   ▼                          └──────────────┘
                          ┌──────────────────┐
                          │ GoalChecker      │──▶ Kết quả ──▶ Reward Engine (sao/coin/huy hiệu)
                          │ HintEngine       │──▶ Gợi ý          │
                          └──────────────────┘                   ▼
                                                        Progress Store (IndexedDB ⇄ Supabase)
```

Điểm thiết kế cốt lõi: **mô phỏng game là TypeScript thuần, không phụ thuộc giao diện** → chạy được trên Node để test, và để sau này dùng chung cho chế độ Robot Lab / xuất code Leanbot.

### 7.3. Interface cho mỗi kiểu game
```ts
interface GameKind<Cfg, State> {
  id: 'runner' | 'maze' | 'robotlab' | 'turtle' | 'farm' | 'sorter' | 'music';   // xem game-kinds.md
  blocks: BlockDefinition[];                 // khối riêng của game + generator JS
  init(cfg: Cfg): State;                     // trạng thái ban đầu
  api(state: State, emit: (e: GameEvent) => void): Record<string, NativeFn>; // hàm đưa vào sandbox
  check(state: State, cfg: Cfg): GoalResult; // thắng/thua + lý do
  Stage: React.FC<StageProps<Cfg, GameEvent>>; // chỉ vẽ, không chứa logic
}
```

### 7.4. Định dạng một màn chơi
```jsonc
{
  "id": "w2-l05",
  "world": "rung-lap-lai",
  "kind": "maze",
  "title": "Cây cầu dài",
  "objective": "Dùng vòng lặp để đi hết cây cầu",
  "misconception": "Nghĩ rằng lặp chỉ chứa được 1 khối",
  "toolbox": ["move_forward", "turn_left", "turn_right", "repeat_n"],
  "maxBlocks": 4,
  "par": 3,
  "config": {
    "map": ["#######", "#S...F#", "#######"],
    "startDir": "east",
    "skinnable": true
  },
  "hints": [
    { "when": { "blockCount": { "lt": 1 } }, "say": "Kéo khối 'đi thẳng' vào đây nhé", "point": "toolbox:move_forward" },
    { "when": { "capacityFull": true, "missing": "repeat_n" }, "say": "Hết chỗ rồi! Thử khối lặp xem", "point": "toolbox:repeat_n" },
    { "when": { "lastResult": "TIMEOUT" }, "say": "Vòng lặp của con không dừng lại" }
  ],
  "thinkingHint": "Con đếm xem robot phải đi thẳng mấy lần?",
  "solution": { /* Blockly JSON — dùng cho gợi ý tầng 2/3 và test tự động */ }
}
```
Gợi ý được viết bằng **luật khai báo** (`when` → `say` / `point`), thay cho ~180 dòng if/else hard-code của Blockly Games.

### 7.5. Cấu trúc thư mục dự kiến
```
codequest/
├─ apps/web/                  # React app
│  ├─ src/
│  │  ├─ app/                 # router, layout, providers
│  │  ├─ screens/             # map, world, lesson, play, result, shop, parent
│  │  ├─ blockly/             # theme, renderer config, React wrapper, toolbox builder
│  │  ├─ ui/                  # design system: Button, Bubble, StarBurst, CoinCounter…
│  │  └─ audio/, mascot/
├─ packages/
│  ├─ engine/                 # runtime, sandbox, event log, hint engine, goal checker (TS thuần)
│  ├─ games/                  # maze/, predict/, bughunt/, puzzle/, turtle/ … (mỗi thư mục = 1 GameKind)
│  ├─ rewards/                # tính sao, coin, huy hiệu, streak (TS thuần, test kỹ)
│  └─ content-schema/         # zod schema cho level/lesson/hint
├─ content/                   # worlds/*.json, levels/*.json, lessons/*.md, assets/
└─ tools/
   ├─ validate-levels.ts      # headless: chạy lời giải của MỌI màn, phải thắng và ≤ par
   └─ level-editor/           # công cụ soạn màn trực quan (GĐ 2)
```

---

## 8. Chất lượng nội dung & kiểm thử

Nút thắt thật sự của dự án là **sản xuất ~190 màn chơi tốt**, không phải code. Vì vậy:

1. **Kiểm chứng tự động mọi màn** (`tools/validate-levels.ts`): dùng Blockly headless trên Node, nạp `solution`, chạy qua engine → bắt buộc thắng và số khối ≤ `par` ≤ `maxBlocks`. Chạy trong CI, màn nào hỏng thì build đỏ.
2. **Schema validation** (zod): thiếu `objective`, `misconception`, `solution` → báo lỗi.
3. **Level editor** (GĐ 2): vẽ bản đồ bằng chuột, chọn toolbox, ghép lời giải ngay trên Blockly, xem trước → xuất JSON. Đây là thứ giúp anh tạo 10 màn/giờ thay vì 1 màn/giờ.
4. **Dùng LLM hỗ trợ soạn**: sinh nháp bản đồ/biến thể theo khái niệm, *luôn qua bộ kiểm chứng tự động + anh duyệt*.
5. Unit test cho `engine` và `rewards` (logic coin dễ sai và ảnh hưởng động lực của bé).
6. Playwright: luồng chơi chính ở kích thước 1280×720 và 1366×768.
7. **Test thật với bé** cuối mỗi giai đoạn: quan sát 20–30 phút, không giải thích UI. Chỗ nào bé phải hỏi = chỗ UX cần sửa.

---

## 9. Lộ trình triển khai

> Giả định: anh làm ~15–20 giờ/tuần cùng Claude Code. Bắt đầu từ 02/10/2026. Nếu ít thời gian hơn, giữ thứ tự, giãn thời lượng.

| Giai đoạn | Thời gian (dự kiến) | Sản phẩm | Tiêu chí nghiệm thu |
|---|---|---|---|
| **GĐ 0 – Thiết kế** | 1 tuần · 02–08/10 | Style board ✅ (đã có bản đầu), design token, theme Blockly, tạo thêm sprite (đi lên/xuống, đâm tường, ôm đầu, suy nghĩ), tileset Làng Tre, **prototype 1 màn Đường chạy** | Bé chơi được 1 màn không cần hướng dẫn |
| **GĐ 1 – Lõi + MVP** | 3 tuần · 09–29/10 | Engine (sandbox, log, phát lại, từng bước, tốc độ); **Đường chạy + Mê cung + Đoán + Ghép hình**; Thế giới 1–2 (35 màn); bài giảng; sao/coin/gợi ý 3 tầng; bản đồ; hồ sơ cục bộ | Bé tự chơi 30 phút, hoàn thành ≥ 10 màn, muốn chơi tiếp |
| **GĐ 2 – Nhóm 6 bé** | 3 tuần · 30/10–19/11 | Supabase: đăng nhập avatar + PIN, đồng bộ; **Góc huấn luyện viên**; Thợ săn lỗi; Thế giới 3–5; validator headless + CI; level editor v0; deploy link cho cả nhóm | Cả 6 bé học trên máy riêng, anh xem được tiến độ từng bé |
| **GĐ 3 – Thành Phố Robot** (phiên bản giữa) | 3 tuần · 20/11–10/12 | **Phòng thí nghiệm Robot**: sa bàn kiểu Synapse City, robot có dò line, cảm biến, tay gắp; nhiệm vụ Containment/Neutralization/Analysis/về CRL; đề ngẫu nhiên + đồng hồ 2–3 phút; **Thế giới 6** (20 màn) | Bé hoàn thành 1 nhiệm vụ kiểu AIROC trên mô phỏng, chạy ổn định 2 lần liên tiếp |
| **GĐ 4 – Mở rộng** | 4 tuần | Họa sĩ, Nông trại, Băng chuyền, Nhạc công, Sân chơi; Thế giới 7–9; cửa hàng skin, huy hiệu, streak, mục tiêu nhóm, giọng đọc | 170 màn, các bé dùng coin mua skin |
| **GĐ 5 – Thuật toán & code chữ** | 2 tuần | Thế giới 10; chế độ xem code JS/Python song song với khối | Bé đọc được code tương ứng với khối mình ghép |
| **GĐ 6 – Vận hành** | liên tục | Tinh chỉnh theo dữ liệu của 6 bé, thêm màn, (tùy chọn) xuất code cho Leanbot | — |

**Bản đầu tiên các bé chơi được: cuối tháng 10.** Thành Phố Robot: **đầu tháng 12**. Bản v1 đầy đủ: khoảng **16 tuần**.

> ⚠️ **Về thời gian thi AIROC:** vòng khu vực (17–18/10 hoặc 24–25/10) và chung kết quốc gia (14–15/11) đều diễn ra **trước** khi có Thành Phố Robot (đầu tháng 12). Mùa thi này, các bé vẫn cần luyện trực tiếp trên Leanbot. CodeQuest sẽ giúp bằng nền tư duy từ Thế giới 1–5 (sẵn sàng trong tháng 10–11). Nếu anh muốn có robot sớm hơn, có thể đổi chỗ GĐ 2 và GĐ 3: robot sẽ có giữa tháng 11, nhưng Góc huấn luyện viên lùi xuống tháng 12.

### Việc cụ thể của GĐ 0 + GĐ 1 (để bắt tay ngay)
1. Khởi tạo monorepo (Vite + React + TS, workspace `packages/*`), ESLint/Prettier, Vitest. Đưa script làm sạch sprite vào `tools/sprites/`.
2. Design system: token màu/font (`docs/design/art-direction.md`), nút chunky, panel, bong bóng thoại, HUD coin/sao.
3. React wrapper cho Blockly: inject/dispose, renderer `zelos`, theme CodeQuest, font Baloo 2, tiếng Việt, toolbox theo level, `maxBlocks` + thanh "còn N khối".
4. Khối lệnh: `đi`, `nhảy`, `cúi`, `đá`, `rẽ trái/phải`, `lặp n lần`, `nếu có hố/có đường`, `lặp đến khi tới đích` + generator JS kèm block id.
5. Engine: chạy `js-interpreter` với giới hạn bước → event log → `GoalResult` (5 loại).
6. Stage **Đường chạy** bằng PixiJS: nền parallax pixel, Măng `AnimatedSprite` (đi/nhảy/cúi/đá/cheer), hố, cành tre, thùng, lá cờ; phát lại theo log + highlight khối.
7. Stage **Mê cung**: lưới tile, Măng 4 hướng (tạm lật sprite ngang cho tới khi có sprite đi lên/xuống).
8. Điều khiển + phím tắt: Chạy / Từng bước / Tốc độ / Làm lại.
9. HintEngine đọc luật `when` + gợi ý 3 tầng + khối mờ (ghost).
10. Rewards: sao, coin, lưu IndexedDB, màn kết quả có Măng `cheer`.
11. Bản đồ thế giới + trang thế giới + thẻ bài giảng có Măng `talk`.
12. Soạn 35 màn Thế giới 1–2 + bài giảng + kiểm chứng tự động.
13. Buổi test với bé của anh → sửa → mời thêm 1–2 bạn trong nhóm test → đóng GĐ 1.

---

## 10. Đo lường (để biết hệ thống có thực sự dạy được)

Ghi cục bộ (không gửi đi đâu ở GĐ 1–3), mỗi lượt chơi: số lần chạy, kết quả từng lần, thời gian, gợi ý đã dùng, số khối.

| Chỉ số | Ngưỡng cảnh báo | Hành động |
|---|---|---|
| Màn có > 40% lượt phải mua lời giải | Quá khó | Thêm màn đệm phía trước / sửa gợi ý |
| Màn thắng ngay lần đầu > 95% và thời gian < 20 giây | Quá dễ | Gộp hoặc siết par |
| Tỷ lệ dùng gợi ý tầng 3 tăng dần theo thời gian | Bé "mua đáp án" | Tăng giá / giới hạn theo ngày |
| Một khái niệm sai lặp lại ở nhiều game | Lỗ hổng kiến thức | Góc huấn luyện viên đề xuất ôn cho bé đó |

---

## 11. Rủi ro & cách giảm

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Sản xuất nội dung chậm | Cao | Level editor + validator + LLM soạn nháp, ưu tiên ít màn nhưng tốt |
| Trẻ kéo thả khó bằng trackpad laptop | Trung bình | Khuyên dùng chuột rời; khối to, vùng hít rộng; test trên đúng laptop của các bé ngay GĐ 0 |
| Gamification lấn át việc học | Trung bình | Giá gợi ý, trần coin, sao gắn với tối ưu, chỉ số §10 |
| Phạm vi phình to | Cao | Bám tiêu chí nghiệm thu từng giai đoạn, kiểu game mới chỉ thêm sau MVP |
| Thành Phố Robot có sau mùa thi AIROC 2026 | Cao | Mùa này luyện trực tiếp trên Leanbot; có thể đổi chỗ GĐ 2 ↔ GĐ 3 (xem §9) |
| Sprite AI tạo thêm không đồng bộ với bộ gốc | Trung bình | Luôn gửi ảnh gốc làm tham chiếu, dùng prompt mẫu ở `docs/design/art-direction.md`, kiểm tra trước khi đưa vào game |
| Trẻ trong nhóm so bì, nản | Trung bình | Không xếp hạng công khai; dùng **mục tiêu chung cả nhóm** + khoe tác phẩm |
| Dùng lại hình ảnh Blockly Games | Thấp | Code Apache-2.0 dùng được, nhưng **vẽ asset riêng** cho đồng bộ phong cách |
| Quyền riêng tư của trẻ | Trung bình | Chỉ lưu biệt danh + avatar + PIN; không email, ảnh hay chat; anh giữ quyền quản trị; xin phép phụ huynh 5 bạn |

---

## 12. Quyết định đã chốt (01/10/2026)

| Câu hỏi | Quyết định |
|---|---|
| Ai dùng | Bé của anh + nhóm 5 học sinh (6 bé) → cần đăng nhập đơn giản + Góc huấn luyện viên từ GĐ 2 |
| Phong cách | Claude tự nghiên cứu → **"Pixel ấm áp"** dựa trên sprite gấu trúc (`docs/design/art-direction.md`) |
| Thiết bị | **Laptop** → bố cục 1366×768, phím tắt, khuyên dùng chuột |
| AIROC | Có phục vụ, robot nằm ở **tầng giữa**: Thế giới 6, xây trong GĐ 3 |
| Tên | **CodeQuest** |

Còn mở: tên mascot ("Măng" là tên tạm), và có đổi chỗ GĐ 2 ↔ GĐ 3 để robot có sớm hơn hay không.
