# Roadmap

Nguồn chuẩn cho: giai đoạn, task, thứ tự, tiêu chí nghiệm thu. Lý do của thứ tự này nằm ở `product/master-plan.md` §9.

| Giai đoạn | Thời gian dự kiến | Mục tiêu | File |
|---|---|---|---|
| **GĐ 0 · Nền móng** | 02–08/10/2026 | Repo chạy được, design system, Blockly + engine lõi, 1 màn Đường chạy chơi được | [`phase-0.md`](phase-0.md) |
| **GĐ 1 · MVP** | 09–29/10 | 2 kiểu game, 5 cách chơi, Thế giới 1–2 (35 màn), phần thưởng, gợi ý, lưu local | [`phase-1.md`](phase-1.md) |
| GĐ 2 · Nhóm 6 bé | 30/10–19/11 | Supabase, ghép máy, Góc huấn luyện viên, Thế giới 3–5, level editor | [`later-phases.md`](later-phases.md) |
| GĐ 3 · Thành Phố Robot | 20/11–10/12 | robotlab, Thế giới 6 | [`later-phases.md`](later-phases.md) |
| GĐ 4 · Mở rộng | 4 tuần | turtle, farm, sorter, music; Thế giới 7–9; cửa hàng, huy hiệu | [`later-phases.md`](later-phases.md) |
| GĐ 5 · Thuật toán & code chữ | 2 tuần | Thế giới 10, xem code JS/Python | [`later-phases.md`](later-phases.md) |

## Quy ước task
- Mã: `P<giai đoạn>-<2 số>`, vd `P1-07`. Mã không đổi; task bỏ thì ghi "Hủy".
- Mỗi task có: **Mục tiêu**, **Phụ thuộc**, **Sản phẩm**, **Nghiệm thu** (kiểm được), **Người làm** (AI / HLV = huấn luyện viên).
- Trạng thái ghi ngay trong bảng: ⬜ chưa làm · 🟨 đang làm · ✅ xong · ⛔ bị chặn.
- Một task xong khi đạt nghiệm thu **và** "Định nghĩa xong" trong `AGENTS.md`.
