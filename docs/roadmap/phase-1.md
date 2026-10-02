# GĐ 1 · MVP (09–29/10/2026)

**Mục tiêu giai đoạn:** bản đầu tiên cho bé chơi thật: 2 kiểu game (`runner`, `maze`) × 5 cách chơi, Thế giới 1–2 (35 màn + 2 bài giảng), sao/xu/gợi ý 3 tầng, nhiều hồ sơ trên một máy, lưu local.
**Nghiệm thu giai đoạn:** bé tự chơi 30 phút, hoàn thành ≥ 10 màn, muốn chơi tiếp; 1–2 bạn trong nhóm chơi thử không gặp lỗi chặn; tag `v0.1.0`.

| ID | Task | Phụ thuộc | Người làm | Trạng thái |
|---|---|---|---|---|
| P1-01 | Kiểu game `runner` đầy đủ | P0-07 | AI | ✅ |
| P1-02 | Kiểu game `maze` | P0-03 | AI | ✅ |
| P1-03 | `RunnerStage` đầy đủ | P1-01 | AI | ⬜ |
| P1-04 | `MazeStage` | P1-02 (P0-08 nếu có, không bắt buộc) | AI | ⬜ |
| P1-05 | `StageController` đầy đủ | P0-07 | AI | ⬜ |
| P1-06 | 4 cách chơi: parsons, predict, bughunt, creative | P1-01, P1-02, P1-03, P1-04, P1-05 | AI | ⬜ |
| P1-07 | Hint engine + gợi ý tầng 1–3 + popover chỉ bước tiếp | P0-05, P1-08 | AI | ⬜ |
| P1-08 | Package `rewards` đầy đủ | P0-02 | AI | ✅ |
| P1-09 | Lớp dữ liệu Dexie, hồ sơ + PIN, bản nháp, sao lưu/khôi phục | P0-01 | AI | ✅ |
| P1-10 | Màn hình: hồ sơ, bản đồ, thế giới, bài giảng, kết quả, cài đặt | P1-08, P1-09 | AI | ⬜ |
| P1-11 | Công cụ `content:check` đủ 18 luật | P1-01, P1-02 | AI | ⬜ |
| P1-12 | Nội dung Thế giới 1 (15 màn + bài giảng) | P1-11 | AI soạn nháp · HLV duyệt | ⬜ |
| P1-13 | Nội dung Thế giới 2 (20 màn + bài giảng) | P1-12 | AI soạn nháp · HLV duyệt | ⬜ |
| P1-14 | Âm thanh & giọng đọc | P1-10 | AI · HLV chọn giọng | ⬜ |
| P1-15 | E2E smoke + CI đầy đủ | P1-10 | AI | ⬜ |
| P1-16 | Chơi thử, sửa, phát hành `v0.1.0` | tất cả | HLV + AI | ⬜ |

---

### P1-01 · Kiểu game `runner` đầy đủ
Đúng toàn bộ đặc tả `product/game-kinds.md` §3.1: khối `runner_walk/jump/crouch/kick/is_ahead`, ô `ground/hole/branch/crate/flag`, măng `bamboo[]`, `goal.collectAll`, reason `FELL_IN_HOLE, HIT_BRANCH, HIT_CRATE, OFF_TRACK, NOT_AT_GOAL, MISSED_ITEMS`, `predictAnswer` (`win`, `stop@n`, `missed@n`, `crash:<REASON>@n`).
**Nghiệm thu:** mỗi reason có test; coverage ≥ 85%; đặc tả khớp `product/game-kinds.md` §3.1.

### P1-02 · Kiểu game `maze`
Đúng toàn bộ đặc tả `product/game-kinds.md` §3.2: config `map` + `startDir`, khối `maze_forward/turn_left/turn_right/is_path/at_goal`, thắng ngay khi tới `G`, reason `HIT_WALL, NOT_AT_GOAL, MISSED_ITEMS`, `predictAnswer`.
**Nghiệm thu:** như P1-01, khớp §3.2.

### P1-03 · `RunnerStage` đầy đủ
Nền parallax pixel (bầu trời, tre xa, đất), camera cuộn theo Măng khi > 8 ô, hoạt ảnh cho mọi event (đi, nhảy, cúi, đá thùng đổ, nhặt măng, rơi hố, đụng cành, ăn mừng).
**Nghiệm thu:** 60 fps với màn 30 ô; mọi event của P1-01 có hoạt ảnh.

### P1-04 · `MazeStage`
Lưới tile, Măng 4 hướng (sprite đi lên/xuống từ P0-08; nếu chưa có thì lật sprite ngang + mũi tên hướng), đâm tường thì choáng.
**Nghiệm thu:** mọi event của P1-02 có hoạt ảnh.

### P1-05 · `StageController` đầy đủ
Chạy / tạm dừng / từng bước / tốc độ 0,5–1–2 / làm lại / hủy giữa chừng; phím tắt `Space S R` theo `blockly-integration.md` §13; rung khối gây lỗi; lượt thua phát tối đa 1×.
**Nghiệm thu:** bấm Làm lại giữa lúc đang diễn thì dừng ngay, không còn tween chạy ngầm (có test).

### P1-06 · 4 cách chơi
`parsons` (ẩn thanh khối, khối rải rác), `predict` (workspace chỉ đọc + 3–4 thẻ đáp án có hình, chấm sao theo số lần chọn), `bughunt` (bộ đếm "đã sửa N khối" theo `editDistance`), `creative` (không chấm, nút Lưu; nút Khoe với nhóm có ở GĐ 2).
**Nghiệm thu:** mỗi mode có 1 màn mẫu chơi được và 1 test e2e.

### P1-07 · Gợi ý
`packages/engine/src/hints` (`matches`, chọn luật, luật chung); hộp gợi ý 3 tầng theo giá và lưới an toàn (`buyHint`); popover "chỉ bước tiếp" (`blockly-integration.md` §8); xem lời giải chỉ đọc; `workspace-content-highlight` cho màn đầu.
**Nghiệm thu:** test `matches` đủ khóa; sau 3 lượt thua tầng 1 miễn phí; mua tầng 3 thì sao tối đa 1.

### P1-08 · Package `rewards`
Mọi hàm ở `rewards-engine.md` §3 (gồm `buyHint`, `computeLessonRewards`, thưởng ngày + chuỗi ngày, `mergeProgress`). Huy hiệu (`evaluateBadges`) có thể để GĐ 4.
**Nghiệm thu:** mọi test ở `rewards-engine.md` §6; coverage ≥ 95%.

### P1-09 · Lớp dữ liệu
Dexie DB theo `data-sync-auth.md` §2 (đã có bảng `outbox` dù chưa đồng bộ, và bảng `lessons`); repository; hồ sơ với avatar + PIN; lưu bản nháp workspace; sao lưu/khôi phục file JSON; ghi 30 xu khởi đầu khi tạo hồ sơ.
**Nghiệm thu:** test bằng `fake-indexeddb`; tải lại trang không mất tiến độ; khôi phục từ file ra đúng số dư xu.

### P1-10 · Màn hình
Theo `design/screens-and-flows.md`: `/`, `/profile/new`, `/map`, `/w/:worldId`, bài giảng, màn chơi đầy đủ, lớp phủ kết quả (sao bay, xu bay, "N dòng code"), hộp gợi ý, `/settings` (gồm sao lưu/khôi phục), màn "màn hình nhỏ quá", nhắc nghỉ 25 phút; **chế độ tác giả** `?author=1` chỉ ở bản dev (nút "Sao chép workspace JSON", `?unlock=all`).
**Nghiệm thu:** đi được luồng hồ sơ → bản đồ → thế giới → bài giảng → màn chơi → kết quả → màn tiếp bằng chuột và bằng phím; khớp style board. (Cửa hàng, huy hiệu, Góc nhóm, Góc huấn luyện viên **không** thuộc GĐ 1.)

### P1-11 · `content:check`
Đủ 18 luật ở `content-model.md` §5, in bảng kết quả, exit code đúng.
**Nghiệm thu:** mỗi luật có 1 fixture sai trong `tools/content-check/fixtures/` bị bắt đúng.

### P1-12 · Nội dung Thế giới 1
Theo bảng ở `product/curriculum.md` §3. `world.json`, `w01-lesson`, 15 màn + `w01-creative`, `content/shared/feedback.json`.
**Nghiệm thu:** `content:check` xanh; HLV chơi thử từng màn; mỗi mode xuất hiện ≥ 1 lần; đã xóa `w01-lang-tre` khỏi `PROVISIONAL_WORLDS` (`tools/content-check/src/curriculum.ts`), `content:check` không còn cảnh báo luật 4/7.

### P1-13 · Nội dung Thế giới 2
Theo `product/curriculum.md` §4. **Nghiệm thu:** như P1-12.

### P1-14 · Âm thanh & giọng đọc
Hiệu ứng (Kenney CC0), 2 bản nhạc nền, script sinh trước giọng đọc cho mọi câu **cố định** (`tools/voice/`; dịch vụ TTS do HLV chọn ở đầu task, ghi vào `tech-stack.md`), 3 kênh âm lượng.
**Nghiệm thu:** mọi câu cố định của Thế giới 1–2 và `feedback.json` có giọng đọc (câu có số thay đổi thì không, xem `ui-copy-guide.md` §5); tắt từng kênh độc lập.

### P1-15 · E2E smoke + CI
Kịch bản ở `testing-strategy.md` §3, chạy trong CI với tag `@smoke`.
**Nghiệm thu:** CI xanh trên PR.

### P1-16 · Chơi thử & phát hành
Chơi thử với bé → sửa lỗi chặn → chơi thử với 1–2 bạn → deploy Vercel → tag `v0.1.0` + `CHANGELOG.md`.
