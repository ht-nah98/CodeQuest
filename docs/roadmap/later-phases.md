# GĐ 2–5 (khung)

Chi tiết hóa thành task có nghiệm thu khi giai đoạn trước sắp xong (cùng cách viết với `phase-1.md`).

## GĐ 2 · Nhóm 6 bé (30/10–19/11)
- **P2-01 Spike đăng nhập:** kiểm chứng luồng ghép máy `generateLink(magiclink)` → `verifyOtp(token_hash)` trên Supabase thật. Kết quả: chuyển ADR-0010 sang "Chấp nhận" hoặc viết ADR thay thế.
- P2-02 Migration Supabase: bảng, RLS, RPC `merge_progress`, view cho Góc huấn luyện viên, test policy.
- P2-03 Edge Function `create-student`, `pairing-code`, `pair-device`.
- P2-04 Bộ đồng bộ outbox + pull + merge; chỉ báo trạng thái.
- P2-05 Góc huấn luyện viên: bảng 6 bé, khái niệm yếu, màn hay kẹt, mở khóa thủ công, mục tiêu nhóm.
- P2-06 Góc nhóm: mục tiêu chung, tường tác phẩm.
- P2-07 Level editor v0 (`/coach/editor`): vẽ bản đồ runner/maze, toolbox, lời giải, kiểm chứng tại chỗ, xuất JSON.
- P2-08 Nội dung Thế giới 3–5 (55 màn) + sorter tối thiểu nếu Thế giới 4 cần.
- P2-09 PWA offline; deploy production; gửi link + thư phụ huynh.

## GĐ 3 · Thành Phố Robot (20/11–10/12)
- Kiểu game `robotlab` (headless): sa bàn, robot có hướng, tay gắp, cảm biến line/vật cản/màu, chấm điểm AIROC 45/160/100/40, đồng hồ ảo 120/180 s, đề ngẫu nhiên có seed.
- `RobotLabStage`: sa bàn pixel kiểu Synapse City, sprite robot đồng hành.
- Nội dung Thế giới 6 (20 màn theo `curriculum.md` §2 và `master-plan.md` §1.2).
- Nút "Đề mới" sinh cấu hình ngẫu nhiên; chế độ thi thử 2 lượt.

## GĐ 4 · Mở rộng (4 tuần)
- Kiểu game `turtle`, `farm`, `sorter` (đầy đủ), `music`.
- **Capacity guard** cho khối có shadow (`blockly-integration.md` §5) trước khi dùng phép toán/biến trong màn có giới hạn.
- Thế giới 7–9; cửa hàng & tủ đồ; huy hiệu; màn bonus; giọng đọc đầy đủ. (Chuỗi ngày và thưởng ngày đã có từ GĐ 1.)

## GĐ 5 · Thuật toán & code chữ (2 tuần)
- Thế giới 10.
- Chế độ xem code: hiển thị JavaScript/Python tương ứng (generator `blockly/python`) song song với khối, tô sáng dòng đang chạy.
- (Tùy chọn) Xuất chương trình robotlab sang C++ cho Leanbot.
