# ADR-0021: `robotlab`: chấm khi hết chương trình, đồng hồ ảo trong state, luật chung là dữ liệu, gắp / thả tại ô

- **Trạng thái:** Chấp nhận
- **Ngày:** 08/10/2026

## Bối cảnh
Thế giới 6 "Thành Phố Robot" mô phỏng sa bàn AIROC 2026 cho Leanbot (`product/airoc-2026.md`, `game-kinds.md` §3.3, `curriculum.md` §6.1). Thói quen cần dạy khác `runner` / `maze`: robot thật chạy **hết** chương trình rồi mới được chấm; mỗi hành động tốn giây và lượt thi có giới hạn giờ; điểm và giây là con số **gần đúng**, HLV sẽ gửi luật thật (P3-07). Ràng buộc: mô phỏng tất định, package headless (ADR-0006), vét cạn gộp trạng thái bằng `stateKey` và phát lại API thật (ADR-0015, 0018), màn nhiều bản đồ (ADR-0016), không có mục tiêu ⭐ ở W6 (ADR-0017, D15). Lõi headless viết ở P3-01a (`packages/games/src/robotlab/`), phần quanh lõi ở P3-01b.

## Quyết định
1. **Không thắng giữa chương trình** (khác luật A1 của runner / maze). API robotlab không bao giờ `stop('success')` khi Bíp tới phòng; `evaluate` chấm trạng thái cuối khi chương trình hết: `missions` xét `MISSIONS_LEFT` trước, rồi `NOT_HOME` khi `mustReturn`; `score` so điểm với `target` (`LOW_SCORE`). Về phòng giữa chừng rồi đi tiếp là không còn "ở nhà"; vì vậy `lặp 20 lần` không thay được `lặp đến khi`. Ngoại lệ duy nhất: màn `score` hết giờ thì chấm ngay (đủ điểm → `success`), vì Bíp đã dừng.
2. **Đồng hồ ảo trong state.** `elapsed` (giây đã dùng, số nguyên) nằm trong `RobotLabState`. Mọi hành động đi qua **một** hàm `perform` theo thứ tự cố định: (1) kiểm ô, sai → event thất bại + crash, **không** trừ giờ; (2) kiểm giờ, `elapsed + cost > timeLimit` → `timeUp` rồi dừng (`OUT_OF_TIME` / chấm điểm), hành động không được làm; (3) làm: cộng `cost` đúng một lần, đổi state, emit event mang `t`. `tiến N ô` là N lần (1)–(3), mỗi lần một ngã tư. Câu hỏi không tốn giờ (v1). `costs.forward` và `costs.turn` ≥ 1 (schema), nên vòng lặp có lệnh đi / rẽ luôn hết giờ trước. Luật 1 của `content:check` (validator, `robotlabTimeIssues`) báo màn có `timeLimit / min(costs) × 2 + 2 > maxActions` (mặc định 1000): khi đó vòng `lặp đến khi … { rẽ trái }` ra `TIMEOUT` của engine trước `OUT_OF_TIME` (600 s: 600 lần rẽ + 601 câu hỏi + 1 `timeUp`). Với luật chung (`turn` 1 s) `timeLimit` tối đa 499 s, hoặc tăng `limits.maxActions`.
3. **Luật chung là dữ liệu.** `content/shared/robotlab.json` (`timeLimit`, `costs`, `points`; schema `robotlabRulesSchema`) + `config.rules` ghi đè từng màn. Một hàm gộp thuần `resolveRobotlabRules(levelConfig, shared)`; ở cấp level, `resolveLevelConfigs(level, shared)` (export từ `@codequest/games`) gộp `config` và mọi `variants`. `createState` chỉ nhận config đã gộp (parse `robotlabResolvedSchema`), quên gộp → `INTERNAL_ERROR: robotlab config not resolved`, không bao giờ chạy luật sai. Đã nối ở P3-01b: `content:check` (đọc `shared/robotlab.json` trước mọi màn; thiếu file → luật 1 cho file và cho từng màn robotlab), `validateLevel` (tùy chọn `shared`), `npm run par` (đọc `<content>/shared/robotlab.json`). Web (bộ nạp nội dung, thẻ `demo`, `runLevel` của `predict`, `AnswerPicture`, `RobotLabStage`) và level editor + worker vét cạn gọi cùng `resolveLevelConfigs` (P3-03, P3-05).
4. **Gắp / thả tại ô Bíp đứng.** Không có "gắp phía trước": Bíp phải **dừng trên** ô có khối (chỉ được khi đó là ngã tư cuối của lệnh `tiến` và tay trống), gắp, rồi thả ở ô đang đứng theo bảng "Thả ở đâu". Khối là vật cản: đi xuyên → `HIT_BLOCK`. Tay giữ một khối. Việc đã xong tính từ `blocks[].where` (không lưu cờ riêng), nên gắp lại khối đã đặt làm việc đó trở lại "chưa xong".
5. **Vét cạn không thêm cơ chế riêng.** `elapsed` ở trong state dù là bộ đếm tăng dần (điều kiện 6 của `game-kind-sdk.md` §4). Thêm một thay đổi chung cho mọi kiểu game: ô `field_number` số nguyên có `min` / `max` (≤ 9 giá trị, `MAX_NUMBER_FIELD_VALUES`) mà mục thanh khối để trống thì vét cạn thử **mọi** giá trị (như `field_dropdown`), để `tiến [1–9] ô` là 9 khối lệnh. Không thêm `searchKey` hay gộp trạng thái bỏ `elapsed`.

**Số đo vét cạn** (08/10/2026, Node 22, WSL2, `--max-old-space-size=2048`, `findShortestPrograms` mặc định trừ khi ghi khác; "trạng thái" = trạng thái mô phỏng khác nhau, "work" = đơn vị ngân sách):

| Màn | Bản đồ | par tính tay | Kết quả | Trạng thái | Work | Thời gian |
|---|---|---:|---|---:|---:|---:|
| `robot-missions` (= `l09`) | 1 | 7 | min 7, 6 cách, đủ | 198 | 1 781 | 0,2 s |
| `robot-maps` (= `l14`) | 2 | 3 | min 3, 2 cách, đủ | 5 | 152 | 0,2 s |
| `robot-score` (= `l12`) | 1 | 7 | min 7, 14 cách, đủ | 417 | 105 348 | 0,3 s |
| boss (bản nháp) | 1 | 12 | ngân sách mặc định 20 M hết ở cỡ 11; `--budget 300000000`: min 12, 1 696 cách, đủ | 2 283 | 55 M | 3,6 s |
| `l19` (bản nháp, có điều kiện) | 2 | 20 | dừng ở cỡ 7 / 20 (giới hạn catalog), không kết luận | 14 201 | 129 M | 13,5 s, heap 1,3 GB |

Số trạng thái nhỏ ở mọi màn: `elapsed` **không** làm nổ không gian trạng thái (sa bàn ≤ 5×5, giờ ≤ 34 s). Chi phí nằm ở số chương trình (`cq_repeat` 2–20 lần, khối điều kiện trên 2 bản đồ), giống W4–W5. Boss chỉ cần `--budget` lớn hơn. `l19` (20 khối có `nếu`) không vét cạn được bằng cách nào ở v1: `par` của nó là số tính tay, ghi rõ ở "Ghi chú khi soạn" của P3-04. Chưa cần ADR cách tìm khác.

## Hệ quả
- Ba màn mẫu (`tools/content-check/fixtures/robotlab-samples/`) là fixture của `content:check`, `@codequest/validator` (`robotlab.test.ts`) và `tools/par`; `npm run par -- --dir tools/content-check/fixtures/robotlab-samples robot-missions robot-maps robot-score` báo đúng par.
- Mục thanh khối `{ "type": "robot_forward", "fields": { "N": 1 } }` **ghim** số 1 cho vét cạn (như ô chọn của dropdown). Viết `"robot_forward"` (mặc định 1, bé tự đổi).
- Nơi mới chạy hoặc vẽ màn robotlab phải gọi `resolveLevelConfigs`; quên là `INTERNAL_ERROR` rõ ràng, không phải lỗi âm thầm.
- Đổi điểm / giây khi có luật AIROC thật = sửa `content/shared/robotlab.json`, rồi `content:check` + `npm run par` (giây đổi có thể đổi `par` và kết quả màn `score`).

## Phương án đã cân nhắc
- **Thắng ngay khi xong việc và về phòng (luật A1):** sai với robot thật; bé sẽ học rằng thêm lệnh thừa sau khi về phòng là vô hại.
- **Đồng hồ ngoài state (engine đếm bước):** giờ quyết định thắng thua và điểm, nên phải nằm trong state để `evaluate`, `predictAnswer` và vét cạn thấy được.
- **Gộp trạng thái bỏ `elapsed` (`searchKey`):** sai khi giờ làm đổi kết quả; số đo cho thấy không cần.
- **Luật hard-code trong `sim.ts`:** mỗi lần HLV gửi luật thật phải sửa code; trái quy tắc "nội dung là dữ liệu".
- **Gắp khối ở ô phía trước:** gần cách Leanbot dùng tay gắp hơn, nhưng thêm một khái niệm "phía trước" cho bé 8–11 tuổi; điều phối chọn "dừng đúng ô rồi gắp" (07/10/2026).
- **Chặn `timeLimit` trong schema ở 300 s:** an toàn nhưng phụ thuộc `maxActions` mặc định; báo ở luật 1 theo đúng `limits.maxActions` của màn thì chính xác hơn và vẫn cho màn sáng tạo 120 s.
