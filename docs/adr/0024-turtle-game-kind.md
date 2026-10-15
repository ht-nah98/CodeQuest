# ADR-0024: Kiểu game `turtle` (Họa sĩ): lưới chính xác bội số 30°, chấm bằng tập nét không theo thứ tự, nét lạ là dừng

- **Trạng thái:** Đề xuất
- **Ngày:** 15/10/2026 (bản nháp của P4-08, sửa cùng ngày theo review độc lập; chuyển "Chấp nhận" khi lõi headless và 3 màn mẫu qua `npm run par`)

## Bối cảnh
Thế giới 9 "🎨 Tháp Họa Sĩ" dạy **lặp lồng nhau** và **góc** (`product/curriculum.md` §6.4). Bản khung cũ (`game-kinds.md` §3.4) chấm bằng so ảnh (kênh alpha, ngưỡng sai khác như Blockly Games Turtle). Cách đó không hợp với dự án:
- Package headless không có canvas (ADR-0006); so ảnh cần rasterize trên Node.
- Số thực (`cos`, `sin`) làm hai chương trình vẽ cùng hình có tọa độ lệch `1e-15`; vét cạn gộp trạng thái bằng `stateKey` cần khóa **chính xác**.
- Ngưỡng sai khác là "gần đúng": bé vẽ thừa một nét ngắn vẫn thắng, khó giải thích.

## Quyết định
1. **Hướng là bội số 30°.** `heading` là số nguyên 0…11 (0 = hướng phải `E`, tăng ngược chiều kim đồng hồ). Ô `DEG` của `rẽ phải [d] độ` / `rẽ trái [d] độ` là **dropdown tĩnh** trong `blocks.ts` với đủ 6 giá trị `30, 60, 90, 120, 150, 180` (không cần hook engine theo màn). Mỗi màn **ghim** `DEG` trong từng mục thanh khối (thường 1–2 góc); luật 26 kiểm góc ghim ⊆ `config.angles` (mặc định `{ 60, 90, 120 }`). Bé vẫn đổi được góc trong giao diện (như ô số của `robot_forward`); vét cạn chỉ thử góc ghim. Không có 45° hay 72° (ngũ giác, bát giác): cần √2 / √5, phá tính chính xác (xem "Phương án").
2. **Tọa độ chính xác trong Z[√3].** Mọi điểm có dạng `x = (a + b√3) / 2`, `y = (c + d√3) / 2` với `a, b, c, d` nguyên, vì `cos`, `sin` của bội số 30° nằm trong `{0, ±1/2, ±√3/2, ±1}`. State lưu 4 số nguyên; không có số thực trong state. `tiến [n] bước` là n bước đơn vị.
3. **Tập nét đơn vị.** Mỗi bước đơn vị khi bút hạ thêm một nét `{p, q}` (hai đầu, sắp theo thứ tự cố định, khóa chuỗi). Bản vẽ = **tập** nét (không theo thứ tự, vẽ lại nét cũ không sao, vẽ một đoạn bằng hai lần tiến ngắn = một lần tiến dài). Hình mẫu `config.target` cũng là tập nét đơn vị, viết gọn trong file nội dung bằng các đoạn (đường gấp khúc theo lệnh rùa) và được nở thành nét đơn vị khi parse.
4. **Nét lạ là dừng ngay** (như đâm tường): bút hạ mà bước tới nét không có trong hình mẫu → `crash` / `EXTRA_LINE` ("Nét này không có trong hình mẫu."), Măng dừng ở đầu nét đó. Ra ngoài giấy (`config.size`) → `OFF_PAPER`. Hết chương trình: đủ mọi nét → thắng; thiếu → `incomplete` / `MISSING_LINES` ("Còn nét chưa vẽ."). **Không thắng giữa chương trình** khi vừa đủ nét (như robotlab, ADR-0021): vẽ xong mới chấm; nhưng vì nét lạ dừng ngay, chương trình đúng không bao giờ bị phạt vì đi tiếp với bút nhấc.
   - Hệ quả cho vét cạn: bản vẽ luôn là **tập con** của hình mẫu, nên số trạng thái bị chặn bởi (vị trí × hướng × bút × tập con tới được), và mọi tiền tố vẽ sai bị cắt ngay.
5. **Màn `predict` không cần `target`.** Không có `target` thì không có `EXTRA_LINE`. Khóa đoán là `draw:<danh sách nét đã sắp>` (hoặc `crash:OFF_PAPER@…`): một hình 96 nét không viết tay được, nên **mỗi lựa chọn của màn `predict` turtle được soạn bằng chương trình**: `predict.options[].drawProgram` (workspace JSON nhỏ, chỉ khối turtle + lặp) thay cho `key`. `@codequest/games` export hàm thuần `turtleDrawKey(config, workspace)`; bộ nạp nội dung của web và `content:check` (luật 26) suy ra `key` từ `drawProgram` bằng cùng hàm, `content:check` kiểm các khóa khác nhau và đúng một khóa trùng kết quả chạy `initialWorkspace`. Trường `drawProgram` thêm vào schema `predict.options` (refine: chỉ cho `kind: 'turtle'`, đúng một trong `key` / `drawProgram`). `AnswerPicture` vẽ lại từ khóa.
6. **Khối** (`packages/games/src/turtle/blocks.ts`, category `move` và `pen`):

| Khối | Nhãn | Field | Tooltip (đề xuất) |
|---|---|---|---|
| `turtle_forward` | tiến [3] bước | `N` `field_number` 1…9 | Tiến 3 bước: bút hạ thì có nét dài 3 |
| `turtle_turn_right` | rẽ phải [90 ▾] độ | `DEG` dropdown tĩnh 30…180 | Rẽ phải 90 độ: quay tại chỗ, chưa đi |
| `turtle_turn_left` | rẽ trái [90 ▾] độ | `DEG` dropdown tĩnh 30…180 | Rẽ trái 90 độ: quay tại chỗ, chưa đi |
| `turtle_pen_up` | nhấc bút | — | Nhấc bút: đi tiếp thì không có nét |
| `turtle_pen_down` | hạ bút | — | Hạ bút: đi tiếp thì có nét |

   Tooltip **bắt đầu bằng nhãn khối** (như `robot_forward` "Tiến 3 ô: dừng ở ngã tư thứ 3"), để gợi ý `enter` "Khối mới! " + tooltip qua luật 7 (`ACTION_LABELS` so nhãn `tiến bước`, `rẽ phải độ` sau khi bỏ số). `turtle_forward`, `turtle_turn_*` có category `move` (vào `ACTION_LABELS`); hai khối bút category `pen`. Mọi gợi ý `enter` ≤ 12 chữ, số viết bằng chữ số.
   Bút **hạ sẵn** lúc bắt đầu (`config.penDown` mặc định `true`), để màn đầu chỉ có một khối mới. Không có màu bút ở v1.
7. **Config** (zod, `config.ts`): `size: { w, h }` (đơn vị bước, ≤ 12), `start: { x, y, heading }` (điểm lưới nguyên), `target?` (danh sách đường gấp khúc), `angles?` (tập độ được dùng, kiểm tooltip và dropdown), `penDown?`, `grid: 'square' | 'tri'` (chỉ để vẽ chấm lưới ở sân chơi). Đúng cấu trúc `game-kind-sdk.md` §1: `config.ts`, `lattice.ts` (số học Z[√3], thuần, có test), `state.ts`, `events.ts` (`move`, `turn`, `pen`, `line`, `extraLine`, `offPaper`), `blocks.ts`, `sim.ts`, `evaluate.ts`, `reasons.ts`, `turtle.test.ts`. `version: 1`. Không có `checkStarGoal` ở v1.
8. **Vét cạn không cần cơ chế riêng:** khối lệnh không đọc cảm biến (W9 không có câu hỏi), state là dữ liệu thuần, `stateKey` = vị trí + hướng + bút + tập nét đã vẽ (sắp). Ô `N` và `DEG` ghim trong thanh khối, hoặc ô `N` mở thử 1…9 (điều 7 của `game-kind-sdk.md` §4). Đo trước (P4-08): 3 màn mẫu (vuông, lục giác, 3 hình vuông lặp lồng); ghi số trạng thái và thời gian vào ADR này khi chuyển "Chấp nhận".
9. **Sân chơi** `apps/web/src/stages/turtle/` (PixiJS, ADR-0007): giấy kẻ chấm (lưới vuông hoặc tam giác), hình mẫu nét đứt nhạt, nét đã vẽ đậm (màu mực), Măng cầm bút lông xoay theo 12 hướng; `extraLine` tô đỏ nét lạ và rung; `layout.ts` thuần đổi Z[√3] → pixel (dùng số thực **chỉ** ở đây).

## Hệ quả
- Chấm đúng / sai rõ ràng, giải thích được cho bé ("nét này thừa", "còn nét chưa vẽ"); tất định tuyệt đối; vét cạn gộp trạng thái được.
- Mất ngũ giác, bát giác, hình tròn (vẽ gần đúng bằng 12-giác vẫn được: 30°). Bông tuyết, lục giác, tam giác đều, sao David, hình vuông xoay 30°/60° đều vẽ được.
- Hình mẫu phải soạn trên lưới; `content:check` (luật 26) kiểm: `target` nở ra nét đơn vị hợp lệ, nằm trong `size`; `start` là **một đỉnh của hình mẫu** (điểm đầu mút của một nét đơn vị của `target`, để Măng đứng trên cùng lưới với hình mẫu, không lệch nửa bước hay lệch √3/2), hoặc với `predict` không có `target` thì là điểm lưới nguyên; góc ghim ⊆ `angles`; ô `N` ghim hoặc mở 1–9; lời giải vẽ đúng `target`; khóa `predict` suy từ `drawProgram` (mục 5).
- Luật 24 (M2, "Lặp công thức") cho `turtle`: hình lời giải bỏ **cả số bước lẫn số độ** (`lặp{tiến, phải}` của tam giác = của lục giác); ảnh gương (trái ↔ phải) là cùng công thức, như maze. Luật soạn T1 (cảnh báo, `difficulty.ts`): màn `build` / `bughunt` có ≥ 1 cách sai hợp lý vẽ nét lạ trước khi xong (người soạn khai báo chương trình sai trong test của thế giới).
- Thêm `turtle` vào `stageKinds`, `AnswerPicture`, `knownBlockSpecs`; nhóm thanh khối "BÚT" (category `pen`, đã có trong `BlockCategory`).
- Cập nhật `game-kinds.md` §3.4 (viết lại theo ADR này), `game-kind-sdk.md` §1.3 (event turtle), `content-authoring.md` §5.1 (dòng khối bút), `glossary.md` (bút, nét, hình mẫu, độ).

## Phương án đã cân nhắc
- **So ảnh với ngưỡng (Blockly Games Turtle, bản khung cũ):** cần raster trên Node, không tất định giữa máy (khử răng cưa), ngưỡng mơ hồ, vét cạn không gộp được trạng thái.
- **Số thực + làm tròn tọa độ (vd 6 chữ số):** đơn giản hơn nhưng có ca biên (làm tròn hai phía của .5), và khóa trạng thái phụ thuộc cách làm tròn; Z[√3] chỉ thêm ~60 dòng có test.
- **Hỗ trợ cả 45° (Z[√2, √3], 8 số nguyên mỗi điểm):** làm được nhưng gấp đôi số học và test cho một hình (bát giác) chương trình học không cần.
- **Chấm khi hết chương trình, không dừng khi vẽ nét lạ:** bé chỉ thấy "sai" ở cuối, khó tìm lỗi; vét cạn mất phép cắt tỉa lớn nhất.
- **Chấm theo thứ tự nét (so chuỗi lệnh):** bắt bé vẽ đúng một thứ tự; nhiều cách vẽ đúng bị chê. Trái với tinh thần "nhiều cách giải".
