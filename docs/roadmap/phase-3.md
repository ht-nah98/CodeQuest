# GĐ 3 · Thành Phố Robot (07/10/2026 → sau chung kết AIROC)

**Mục tiêu giai đoạn:** có Thế giới 6 "Thành Phố Robot" chơi được (kiểu game `robotlab`, 20 màn + bài giảng) **trước chung kết quốc gia miền Bắc AIROC 17–18/10/2026**, để 6 bé luyện các thói quen cần trên Leanbot: đếm ngã tư, rẽ rồi mới tiến, tay gắp giữ một khối, lập thứ tự nhiệm vụ, về phòng thí nghiệm, ngân sách thời gian. Sau cuộc thi: biến trong engine và Thế giới 7 "Chợ Đếm Số".
**Nghiệm thu giai đoạn:** HLV chơi thử W6 (ít nhất phạm vi cắt H15) và các bé chơi được trên laptop trước 16/10; điểm, giây, sa bàn sửa được bằng dữ liệu (không sửa code) khi có luật thật; W7 chơi được và HLV duyệt; tag `v0.3.0`.

> **Bối cảnh lúc viết (07/10/2026, sửa 08/10 sau review độc lập):** GĐ 2 luồng A gần xong (W3–W5 chờ HLV chơi thử, P2-09/12/15/24 ✅); luồng B vẫn chờ hạ tầng (P2-17). Thiết kế: `product/game-kinds.md` §3.3 (luật `robotlab`), `product/curriculum.md` §6.1 (W6), §6.2 (W7), `product/airoc-2026.md`. Câu hỏi HLV: `coach-questions.md` mục H (mọi câu có lựa chọn tạm, không chặn việc).
> **Ưu tiên:** W6 (P3-01a → P3-04 → P3-01b / P3-03 → P3-06) đứng trước mọi task GĐ 2 chưa xong, trừ lỗi chặn từ buổi chơi thử W3–W5. Máy dev 7,8 GB: mỗi lúc một việc nặng (vét cạn **hoặc** e2e, không chạy song song).
> Thay khung GĐ 3 cũ ở `later-phases.md` (20/11–10/12): GĐ 3 làm sớm hơn vì cuộc thi.

| ID | Task | Phụ thuộc | Người làm | Trạng thái |
|---|---|---|---|---|
| P3-01a | `robotlab` headless lõi: config + `resolveRobotlabRules`, state, 8 lệnh, mô phỏng, đồng hồ, chấm việc / điểm, event, unit test | — | AI | ⬜ |
| P3-01b | `robotlab` quanh lõi: vét cạn (đo kích thước), luật `content:check` (19, 7 + `ACTION_LABELS`), `feedback.json`, ADR, tài liệu, 3 màn mẫu | P3-01a | AI | ⬜ |
| P3-02 | Sprite robot Bíp + bộ hình sa bàn (bản đẹp) | P3-03 (bản tạm) | AI viết prompt · HLV tạo ảnh (tùy chọn) | ⬜ |
| P3-03 | `RobotLabStage`: sa bàn PixiJS từ trên xuống, Bíp, đồng hồ, bảng điểm, hình đáp án | P3-01a | AI | ⬜ |
| P3-04 | Nội dung Thế giới 6 (11 bài, 20 màn + sáng tạo, truyện 5 chương) | P3-01a (soạn, `content:check`, test nội dung); P3-01b (`npm run par`); P3-03 **chỉ cho e2e** | AI soạn nháp · HLV duyệt | 🟨 nháp, chờ HLV chơi thử |
| P3-05 | Level editor: soạn màn `robotlab` | P3-01b, P3-03 | AI | ⬜ (sau 18/10) |
| P3-06 | HLV mở khóa W6 bằng tay, chơi thử, sửa theo góp ý, cho các bé chơi | P3-04, P3-03 | HLV (AI sửa) | ⬜ |
| P3-07 | HLV gửi luật AIROC thật + ảnh khối Blockly Leanbot và sa bàn → cập nhật dữ liệu | HLV có luật / ảnh (H2, H17) | HLV gửi · AI sửa | ⬜ |
| P3-08 | "Đề mới": sinh sa bàn ngẫu nhiên có seed + chế độ thi thử 2 lượt | P3-03, P3-04 | AI | 🟨 (09/10: sa bàn Thành Phố Măng, generator, `w06-exam`, e2e; chờ HLV chơi thử + review) |
| P3-09a | Spike + ADR: biến trong engine và vét cạn | P3-01b | AI | ✅ (ADR-0022) |
| P3-09 | Biến trong engine: khối biến chỉ có ô số, giá trị đầu theo bản đồ, event `var`, bảng hộp, `countGoal`, khối hỏi `phía trước có măng?`, vét cạn | P3-09a | AI | ⬜ |
| P3-10 | Chi tiết hóa lần hai Thế giới 7 (bản đồ thật, vét cạn) + HLV duyệt | P3-06, P3-09 | AI soạn · HLV duyệt | ⬜ |
| P3-11 | Nội dung Thế giới 7 · Chợ Đếm Số (20 màn + bài giảng) | P3-09, P3-10 | AI soạn nháp · HLV duyệt | ⬜ |
| P3-12 | HLV chơi thử W7 | P3-11 | HLV | ⬜ |
| P3-13 | Phát hành `v0.3.0` | P3-06, P3-12 | HLV + AI | ⬜ |

## Thứ tự làm & lịch (đường găng là cuộc thi)

| Ngày (dự kiến) | Việc | Xong khi |
|---|---|---|
| 08/10 | **P3-01a** lõi headless | unit test bảng luật §3.3 xanh |
| 09/10 | **P3-04** bắt đầu soạn W6 (phạm vi cắt `l01`–`l13` + boss trước) song song **P3-01b** | `content:check` xanh cho các màn đã soạn |
| 09–10/10 | **P3-03** sân chơi (sprite tạm bằng `PIXI.Graphics`) | e2e chạy một màn mẫu, có ảnh chụp |
| 10–12/10 | **P3-04** xong phạm vi cắt, rồi `l14`–`l19`, sáng tạo; `npm run par` (một việc nặng mỗi lúc) | review sư phạm độc lập, e2e smoke |
| 12–13/10 | **P3-06** HLV chơi thử, AI sửa trong ngày | HLV ghi "đạt" từng màn |
| 13–16/10 | Các bé chơi W6 (buổi học nhóm + ở nhà) | — |
| bất kỳ lúc nào | **P3-07** khi HLV có luật / ảnh | dữ liệu đã sửa, `content:check` xanh |
| sau 18/10 | P3-02, P3-05, P3-08 → P3-09a → P3-09 → P3-10 → P3-11 → P3-12 → P3-13 | — |

**Cắt phạm vi nếu trễ** (câu H15, `curriculum.md` §6.1): phát hành trước `w06-lesson`, các bài trước `l01`–`l13`, màn `l01`–`l13` và **boss** (boss nhẹ, không đổi màu, không câu hỏi; mọi lệnh trong thanh khối của boss đã có từ `l01`–`l10`, D13). Để sau: `l14`–`l19`, ba bài câu hỏi, màn sáng tạo. **Không** cắt: bài "Khối mới", `l08` (về phòng), `l11`–`l13` (giờ, điểm, chọn việc). Khi cắt, `world.json` chỉ liệt kê các màn đã phát hành; 5 chương truyện vẫn mở đúng (`l04`, `l10`, `l13`, boss).

Mỗi task: viết → review độc lập (code: `code-reviewer`; nội dung: critic sư phạm) → sửa → lint / typecheck / test / content:check (+ e2e khi có giao diện) → commit local. Báo kết quả thật.

---

### P3-01a · `robotlab` headless lõi
**Mục tiêu:** cài đúng luật ở `game-kinds.md` §3.3, chạy trên Node; đủ để soạn và kiểm nội dung W6 ngay.
**Sản phẩm:**
- `packages/games/src/robotlab/` theo cấu trúc chuẩn (`game-kind-sdk.md` §1): `config.ts` (zod `robotlabLevelConfigSchema` cho file nội dung, `robotlabResolvedSchema` cho config đã gộp, `ROBOT_TILES`, `ROBOT_COLORS`, `ROBOT_BLOCK_KINDS`, schema luật chung), `state.ts` (mảng khối **giữ chỉ số** `where: {at} | 'held' | 'done'`), `events.ts`, `blocks.ts` (8 lệnh, nhãn và tooltip **đúng từng chữ** bảng §3.3; `rẽ trái / rẽ phải` dùng câu của mê cung), `sim.ts`, `evaluate.ts` (`missions` / `score`, `predictAnswer`), `reasons.ts`, `robotlab.test.ts`; đăng ký vào registry. Không cài `checkStarGoal` (W6 không có mục tiêu ⭐).
- **Luật chung là dữ liệu:** `content/shared/robotlab.json` (`timeLimit` 120, `costs` 2/1/2/2, `points` 45/160/100/40) + `config.rules` ghi đè từng màn.
- **Một hàm gộp** `resolveRobotlabRules(levelConfig, shared)`; `createState` chỉ nhận config đã gộp (parse `robotlabResolvedSchema`, chưa gộp → `INTERNAL_ERROR`). Nối vào **mọi** nơi chạy hoặc vẽ robotlab, mỗi nơi một test: bộ nạp nội dung của web (màn **và** thẻ `demo` bài giảng), `runLevel` của màn `predict` (khóa đáp án), `AnswerPicture`, factory `RobotLabStage`, `tools/content-check`, `tools/par`, level editor và **worker vét cạn của editor**, helper test `resolvedFixture`.
- **Thứ tự hành động** một chỗ duy nhất: kiểm ô → kiểm giờ (`elapsed + cost > timeLimit` → `OUT_OF_TIME` / chấm điểm) → làm (cộng `cost` đúng một lần).

**Nghiệm thu:**
- Unit test cho **mọi dòng** của bảng kiểm ô và bảng "thả ở đâu" (§3.3): tiến dừng **trên** khối khi là ngã tư cuối và tay trống; `HIT_BLOCK` khi còn ngã tư hoặc đang cầm khối; đi xuyên khối đã đặt → `HIT_BLOCK`; gắp / thả tại ô; thu hồi khi thả trong `L`; `WRONG_PLACE`, `WRONG_COLOR`, `CELL_TAKEN`.
- **Test thứ tự**: lệnh không hợp lệ ở giây cuối → lỗi ô (không phải `OUT_OF_TIME`) và không trừ giờ; lệnh hợp lệ mà thiếu giờ → `OUT_OF_TIME`, state không đổi; lệnh vừa đủ giờ (`elapsed + cost = timeLimit`) → làm được; `tiến 3` hết giờ ở ngã tư thứ 2 → đúng 1 `move`.
- Chấm `missions` (`MISSIONS_LEFT` trước `NOT_HOME`), chấm `score` (cả lúc hết giờ), không thắng giữa chương trình (về `L` rồi đi tiếp → `NOT_HOME`), `predictAnswer` mọi dạng khóa, câu hỏi (kể cả `atLab` ✔ lúc xuất phát → `lặp đến khi` 0 vòng; `blockColor` đọc khối đang cầm; rào luôn ✘).
- Tất định (chạy 2 lần so sánh event log). Ví dụ tính tay ở `curriculum.md` §6.1 (`l05`, `l10`, `l11`, `l12`, `l13`, `l16`, `l18`, `l19`, boss) tái lập được bằng test.
- Schema: từ chối rào có màu, trạm ít hơn khối trung hòa cùng màu, `start` trên khối, config chưa gộp ở `createState`.
- Package vẫn headless; lint / typecheck / test xanh.

### P3-01b · `robotlab` quanh lõi
**Sản phẩm:**
- **Vét cạn:** `npm run par` chạy được robotlab. `elapsed` **ở trong state**, không thêm cơ chế gộp riêng. **Đo trước**: ghi số trạng thái và thời gian của 3 màn mẫu, bản nháp `l19` và boss vào ADR; chỉ khi quá chậm mới đề xuất cách khác bằng ADR riêng.
- `content:check`: luật 19 kiểm hỗ trợ mục tiêu ⭐ theo **từng loại** (robotlab không có loại nào); luật 7: bộ so nhãn `ACTION_LABELS` **gộp khoảng trắng** sau khi bỏ ô số, để nhãn `tiến %1 ô` khớp gợi ý "tiến 3 ô"; luật 7 nhận `robot_turn_*` là loại mới dù nhãn trùng mê cung.
- 12 mã lý do vào `reasonCodes` và `content/shared/feedback.json` (câu ở §3.3, luật 17).
- **ADR mới**: robotlab không thắng giữa chương trình (khác A1), gắp / thả tại ô, đồng hồ ảo trong state + thứ tự kiểm, luật chung + `resolveRobotlabRules`, số đo vét cạn. Cập nhật `game-kind-sdk.md` (§1.3 event robotlab, §4), `content-authoring.md` §5.1 (dòng lệnh robot trong bảng tra), `content-model.md` (`content/shared/robotlab.json`).
- 3 màn mẫu trong `content/worlds/_sandbox/` (`missions`, `missions` nhiều bản đồ, `score`).

**Nghiệm thu:** `npm run par` báo đúng `par` 3 màn mẫu, không `unsearchable`; số đo ghi trong ADR; lint / typecheck / test / content:check xanh.

### P3-02 · Sprite robot Bíp + hình sa bàn (bản đẹp)
**Mục tiêu:** thay hình tạm của P3-03 bằng pixel art "Pixel ấm áp" (`design/art-direction.md` §1, §5).
**Sản phẩm:** prompt cho công cụ AI HLV đã dùng (kèm ảnh gấu trúc gốc làm tham chiếu): robot nhỏ giống Leanbot (thân tròn, 2 bánh, tay gắp 2 càng, mắt đèn), nhìn từ trên xuống, 4 hướng, đi ×2, gắp mở/đóng, lắc đầu, vui; khối rào (xám, sọc) / trung hòa (tròn) / ô nhiễm (chấm) theo màu; trạm 3 màu; ô vùng ô nhiễm; phòng thí nghiệm; nhà. Làm sạch và đóng gói theo `playbooks/add-asset.md`, ghi nguồn vào `assets/CREDITS.md`. Hình truyện `prop: robot`, `prop: lab`.
**Nghiệm thu:** sân chơi dùng sprite mới, ảnh chụp 1280×720 trong PR; Bíp đọc được hướng ở sa bàn 9×9; khối phân biệt được cả khi in đen trắng. Không có ảnh thì giữ hình tạm (không chặn W6).

### P3-03 · `RobotLabStage`
**Mục tiêu:** bé thấy sa bàn line, đếm được ngã tư và thấy đồng hồ chạy.
**Sản phẩm:**
- `apps/web/src/stages/robotlab/` (`RobotLabStage.ts`, `layout.ts` thuần có unit test), đăng ký `stageKinds`. Nền giấy, **line đen** nối các ngã tư kề nhau, chấm tròn ở mỗi ngã tư, nhà khối hộp ở ô `#`, viền vùng ô nhiễm, trạm màu, phòng thí nghiệm có biển.
- Diễn event: `move` từng ngã tư (dừng một nhịp, chấm sáng lên: "đếm"), `turn`, `bump` (rung, lắc đầu), `grab` / `release` (càng mở / đóng, khối dưới thân Bíp), `gripFail`, `timeUp` (đồng hồ đỏ); `finish(outcome)` hiện bảng việc xong / điểm.
- HUD: đồng hồ đếm ngược theo `t` của event (VT323), điểm ở màn `score`. Sprite tạm bằng `PIXI.Graphics` lưới 16 px. Cảnh `theme.scene: 'thanh-pho-robot'`.
- `AnswerPicture` robotlab: `win`, `stop@`, `crash:`, `outOfTime@`, `score:`, `timeout` (nhận config đã gộp).
- Màn nhiều bản đồ dùng cơ chế có sẵn (ADR-0016). Tốc độ / tạm dừng / Từng bước qua `StageController` chung.

**Nghiệm thu:** e2e (1280×720, 1366×768) trên 3 màn mẫu: thắng `missions`, thua `HIT_BLOCK` (lệnh gây lỗi rung), hết giờ ở màn `score` (đồng hồ về 0, điểm đúng); màn `predict` đủ hình đáp án; ảnh chụp trong PR; `layout.ts` có unit test. Không chạy e2e cùng lúc với vét cạn.

### P3-04 · Nội dung Thế giới 6 · Thành Phố Robot
Theo `curriculum.md` §6.1. `world.json` (5 chương, cảnh `thanh-pho-robot`, unplugged "Robot băng keo"; thêm `robot`, `lab` vào `STORY_PROPS`), `w06-lesson` + 10 bài, 20 màn + `w06-creative`. `w06-thanh-pho-robot` tạm vào `PROVISIONAL_WORLDS` tới khi HLV chơi thử. Soạn **phạm vi cắt** (`l01`–`l13` + boss) trước.
**Phụ thuộc:** soạn file, `content:check`, test nội dung chỉ cần P3-01a; `npm run par` cần P3-01b; chỉ e2e cần P3-03.
**Quy trình:** soạn JSON tay (editor chưa có robotlab), `content:check` sau mỗi màn → `npm run par -- --world w06` → sửa sa bàn khi `par` thật khác bảng, ghi "Ghi chú khi soạn" §6.1 → review sư phạm độc lập (độ dài chữ, một ý mới mỗi màn, "Lệnh mới! …" đúng từng chữ tooltip, "khối" chỉ là khối thi đấu, gợi ý là câu hỏi) → sửa → HLV chơi thử (P3-06).
**Nghiệm thu:** `content:check` xanh không cảnh báo luật 4/7/8/21; không thanh khối nào (trừ sáng tạo) có `robot_holding`; `npm run par -- --world w06` ✔ mọi màn build/bughunt (`l19` có thể ⚠ ngân sách, ghi rõ); mỗi mode ≥ 1 lần; test `tools/content-check/src/w06.test.ts`: demo bài giảng (ô Bíp dừng), đáp án màn đoán, từng bước sửa, và **"chỉ chọn đúng việc mới đủ điểm"** ở `l12`, `l19`, boss (mọi tổ hợp việc khác thiếu điểm hoặc hết giờ); boss: thứ tự "trung hòa trước" là `par`; e2e smoke mở `w06-l01` và boss. **HLV chơi thử trước khi merge** (AI không tự đánh dấu).

### P3-05 · Level editor: soạn màn `robotlab`
**Sản phẩm:** trong `/coach/editor`: cọ ô `# . L Z r y g`, đặt khối (loại + màu; rào không màu), khối cầm sẵn, hướng xuất phát, `missions` / `score`, ô sửa `rules`, "Tìm `par` nhỏ nhất" (worker gọi `resolveRobotlabRules`), thử chơi, xuất JSON (như P2-07).
**Nghiệm thu:** e2e tạo một màn `score` từ đầu → kiểm chứng xanh → thử chơi thắng → xuất → `content:check` trên `_sandbox` xanh. HLV tự soạn 1 màn (HLV làm).

### P3-06 · HLV chơi thử W6
**Mục tiêu:** từng màn W6 qua tay HLV trước khi các bé chơi.
**Sản phẩm:**
- Các bé **chưa xong W5**, nên W6 không tự mở theo `unlock.minStarRatio`. HLV **mở khóa W6 bằng tay** cho từng hồ sơ ở Góc huấn luyện viên (P2-05, `unlockOverrides` chỉ ở máy) trong buổi học nhóm. Không đổi luật mở khóa chung.
- HLV chơi hết bài giảng + màn (ít nhất phạm vi cắt), ghi góp ý (màn khó, câu khó hiểu, số giây có giống Leanbot không) vào PR hoặc `coach-questions.md`; AI sửa trong ngày.

**Nghiệm thu:** HLV ghi "đạt" từng màn; bỏ `w06-thanh-pho-robot` khỏi `PROVISIONAL_WORLDS`; 6 hồ sơ đã được mở W6. Việc của HLV, AI không tự đánh dấu.

### P3-07 · Luật AIROC thật → cập nhật dữ liệu
**Mục tiêu:** sa bàn tập khớp đề thi khi HLV có bản luật (xin ở VNV, `airoc-2026.md`) và ảnh khối Blockly Leanbot / sa bàn (câu H17).
**Sản phẩm:** AI cập nhật `content/shared/robotlab.json` (điểm, giây, `timeLimit`), `airoc-2026.md` (chuyển "chưa rõ" → "xác nhận", ghi nguồn), sa bàn màn sáng tạo theo kích thước / bố cục thật, `rules` của các màn `score` nếu đổi số làm hỏng bài "chọn việc"; nhãn lệnh cho gần tên khối Leanbot nếu khác nhiều (đổi nhãn là đổi tooltip + gợi ý + glossary cùng lúc). Nếu sa bàn thật có đoạn line dài giữa hai dãy nhà **không có ngã tư để đếm**, ghi rõ khác biệt trong bài mở đầu W6 và hỏi HLV có cần lệnh "tiến tới ngã tư kế" không. Đổi luật chơi (vd thả sai màu không dừng lượt) thì làm qua ADR + tăng `version` của kiểu game.
**Nghiệm thu:** `content:check` + `npm run par -- --world w06` xanh sau khi đổi số; test "chỉ chọn đúng việc mới đủ điểm" (P3-04) vẫn xanh hoặc màn được chỉnh lại; diff dữ liệu ghi trong PR kèm nguồn.

### P3-08 · "Đề mới" và thi thử 2 lượt
**Sản phẩm:** bộ sinh sa bàn trong `createState` dùng `rng` có seed (seed hiện trên màn hình); nút "Đề mới" ở màn sáng tạo; chế độ "Thi thử" 2 lượt × `timeLimit`, ghi lượt tốt hơn (không xu, không sao). Cập nhật §3.3.
**Nghiệm thu:** cùng seed ⇒ cùng sa bàn (test); mọi đề sinh ra có lời giải đạt điểm tối thiểu (200 seed, bộ giải tham lam); e2e một lượt thi thử.

**🟨 Đã làm (09/10/2026, chờ HLV chơi thử, review độc lập):** làm sớm hơn lịch theo chỉ đạo HLV 08/10 (H17: tự thiết kế sa bàn).
- **Sa bàn Thành Phố Măng** 9×7 (`curriculum.md` §6.1.1): làng tre, công viên có vòng line, sông hai cầu, phố chợ, hẻm tắt, nhà máy cạnh vùng ô nhiễm, phòng thí nghiệm. Dữ liệu `packages/games/src/robotlab/boards.ts`, **không đổi luật** engine.
- **Khác bản kế hoạch:** đề **không** sinh trong `createState` (giữ engine nguyên, config vẫn là dữ liệu kiểm được): `generateExam` thuần (`exam.ts`) bày khối lên sa bàn cố định, web gọi `examConfig` khi bấm "Đề mới". Màn riêng `w06-exam` (chặng `challenge`, mode `creative`) thay vì nút ở màn sáng tạo; màn sáng tạo dùng cùng sa bàn.
- Công bằng + có lời giải (`examIssues`, `planExam`), 9 999 đề đều đạt (thấp nhất 300 điểm theo kế hoạch tham lam). Test: tất định, 200 đề hợp lệ, 200 kế hoạch thắng bằng engine thật (`exam.test.ts`); luật 22 của `content:check` (`level.exam`); web `features/play/exam.test.ts`, `cityArt.test.ts`, `layout.test.ts` (HUD cột trái).
- Giao diện: bảng điểm Lượt 1 · Lượt 2 · Tốt nhất, ô "Đề số" gõ được, "Đề mới", "Thi lại", `?de=`; cảnh thành phố vẽ bằng mã (`cityArt.ts`). e2e `apps/web/e2e/exam.spec.ts` (1280, 1366), ảnh ở `apps/web/test-results/exam/`.
- Chờ HLV: H21 (thưởng cho thi thử), H22 (lượt đụng vẫn giữ điểm), H23 (khi nào mở thi thử).

### P3-09a · Spike + ADR: biến trong engine
**Mục tiêu:** chốt thiết kế biến trước khi xây, vì vét cạn hiện không hiểu biến.
**Phải trả lời (ghi trong ADR):**
- `cq_repeat_var` **phụ thuộc trạng thái** (số vòng đọc lúc chạy), không nằm trong `CONTROL_TYPES` của `@codequest/validator`: vét cạn mở rộng thế nào.
- Biến nằm **ngoài** trạng thái kiểu game mà `FastSim` phát lại (khối biến không gọi API nào): biến là trạng thái engine được `FastSim` mang theo, hay API chung ghi vào state của kiểu game.
- Giữ vét cạn nhỏ: giá trị ô số của khối biến **cố định bởi thanh khối** (vét cạn không thử mọi số), biến có trần `max` theo màn (mặc định 9, tối đa 20), vượt là `BOX_FULL` (ADR-0022, thay "chặn 0–99" của bản nháp).
- Giá trị đầu theo bản đồ `variables[].start: number[]`; `countGoal` nhiều bản đồ; khóa đoán `#<id>=<n>`.

**Nghiệm thu:** spike chạy được 1 màn maze đếm măng trên `npm run par` (nhánh tạm), số trạng thái đo được; ADR "Chấp nhận" hoặc ghi phương án thay.
**Kết quả (09/10/2026):** ADR-0022 "Chấp nhận". Spike chạy `findShortestPrograms` thật trên bản chép tạm của vét cạn (ngoài repo, không qua CLI `npm run par`): `l03` maze par 5 (952 trạng thái, 0,2 s), `l11` maze par 4, `l08` cho thấy giới hạn par ≥ 10; `l11` robotlab chưa đo (việc 4 của P3-09).

### P3-09 · Biến trong engine
**Mục tiêu:** nền cho W7 theo phương án A (`curriculum.md` §6.2), không cần capacity guard.
**Sản phẩm:** theo ADR-0022 (10 việc con): khối chung `cq_var_set` (`đặt [hộp] thành [0]`), `cq_var_add`, `cq_var_compare`, `cq_repeat_var` (chỉ ô số và dropdown biến); `level.variables` (≤ 2, tên tiếng Việt, `start` theo bản đồ) và `level.countGoal` trong schema; lý do `WRONG_COUNT`, `BOX_FULL`; field `field_cq_var`; event chung `var{blockId, id, value}`; "bảng hộp" (React, dùng chung) cạnh sân chơi; khối hỏi `maze_bamboo_ahead`; vét cạn có biến; luật R4 trong `content-authoring.md`; bài giới thiệu `đang gắp khối?` cho W7.
**Tiến độ (09/10/2026):** việc 1–5 (headless: schema, engine, `maze_bamboo_ahead`, vét cạn, `content:check` luật 23 + `tools/par`) xong, số đo ở ADR-0022 "Kết quả phần headless"; còn việc 6–8, 10 (web, giao diện khối, giọng đọc, bài giới thiệu) và việc 9 hoãn.
**Nghiệm thu:** theo 10 việc con của ADR-0022 (việc 3 song song việc 2; level editor hoãn); unit test engine (đặt / tăng / so sánh / lặp theo biến, vượt `max` → `BOX_FULL`, giá trị đầu theo bản đồ, tất định), `countGoal` nhiều bản đồ, vét cạn đúng `par` trên 2 màn maze + 1 robotlab; e2e bảng hộp đổi số theo từng bước; W1–W6 `npm run par` không đổi.

### P3-10 · Chi tiết hóa lần hai Thế giới 7
**Nghiệm thu:** §6.2 có "Chi tiết từng màn" như §5.2, dùng luật gắp / thả tại ô của W6; mọi màn build/bughunt vét cạn (sau P3-09); HLV duyệt hướng chung (HLV làm).

### P3-11 · Nội dung Thế giới 7 · Chợ Đếm Số
Như P3-04, theo §6.2 đã duyệt. **Nghiệm thu:** như P3-04 cho `w07`, cộng test R4 (bỏ khối biến khỏi thanh khối thì không gì thắng). **HLV chơi thử trước khi merge.**

### P3-12 · HLV chơi thử W7
Như P3-06 cho `w07-cho-dem-so`.

### P3-13 · Phát hành `v0.3.0`
**Nghiệm thu:** P3-06 và P3-12 đạt; lint / typecheck / test / content:check / e2e xanh; ghi chú phát hành (W6–W7, luật robotlab, biến) trong tin nhắn tag; tag `v0.3.0` (HLV push khi có repo GitHub, P2-17 H3).
