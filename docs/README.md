# Tài liệu CodeQuest — bản đồ

## Thứ tự đọc cho người mới / AI mới
1. [`../AGENTS.md`](../AGENTS.md): quy tắc vàng, bản đồ repo
2. [`glossary.md`](glossary.md): thuật ngữ
3. [`product/vision.md`](product/vision.md): làm cho ai, để làm gì
4. [`architecture/overview.md`](architecture/overview.md): hệ thống ghép với nhau thế nào
5. Tài liệu chuyên đề của phần đang làm

## Nguồn chuẩn (single source of truth)

Nếu hai tài liệu nói khác nhau, **tài liệu ở cột "Nguồn chuẩn" thắng**. Các tài liệu khác chỉ tóm tắt và phải trỏ về đây.

| Chủ đề | Nguồn chuẩn |
|---|---|
| Tầm nhìn, người dùng, phạm vi | `product/vision.md` |
| Lý do gốc của các quyết định sản phẩm (bản kế hoạch đầu tiên; **không** thắng khi mâu thuẫn với tài liệu chuyên đề) | `product/master-plan.md` |
| Chương trình học: 10 thế giới, khái niệm, số màn | `product/curriculum.md` |
| Đặc tả từng kiểu game | `product/game-kinds.md` |
| Sao, coin, giá gợi ý, huy hiệu, mở khóa | `product/rewards-economy.md` |
| Phong cách hình ảnh, màu, font, sprite | `design/art-direction.md` |
| Danh sách màn hình, luồng, trạng thái UI | `design/screens-and-flows.md` |
| Giọng văn tiếng Việt, xưng hô, câu mẫu | `design/ui-copy-guide.md` |
| Kiến trúc tổng, ranh giới package | `architecture/overview.md` |
| Phiên bản thư viện | `architecture/tech-stack.md` |
| Sandbox, event log, kết quả chạy | `architecture/runtime-engine.md` |
| Hợp đồng (interface) của một kiểu game | `architecture/game-kind-sdk.md` |
| Tích hợp Blockly (theme, toolbox, khối, generator) | `architecture/blockly-integration.md` |
| Schema dữ liệu nội dung, quy ước ID | `architecture/content-model.md` |
| Cú pháp luật gợi ý | `architecture/hint-engine.md` |
| Cài đặt logic phần thưởng | `architecture/rewards-engine.md` |
| Vẽ sân chơi, sprite, asset pipeline | `architecture/stage-rendering.md` |
| Lưu trữ, đồng bộ, đăng nhập | `architecture/data-sync-auth.md` |
| Kiểm thử | `architecture/testing-strategy.md` |
| Bảo mật, quyền riêng tư của trẻ | `architecture/security-privacy.md` |
| Môi trường dev, CI, deploy | `architecture/deployment-ops.md` |
| Lý do của từng quyết định kỹ thuật | `adr/` |
| Việc cần làm, thứ tự, tiêu chí nghiệm thu | `roadmap/` |

## Cây thư mục

```
docs/
├─ README.md                 ← bạn đang ở đây
├─ glossary.md
├─ product/                  CÁI GÌ & VÌ SAO
│  ├─ vision.md
│  ├─ master-plan.md         kế hoạch tổng (bản gốc, chi tiết lý do)
│  ├─ curriculum.md
│  ├─ game-kinds.md
│  └─ rewards-economy.md
├─ design/                   TRÔNG & NÓI NHƯ THẾ NÀO
│  ├─ art-direction.md
│  ├─ screens-and-flows.md
│  └─ ui-copy-guide.md
├─ architecture/             XÂY NHƯ THẾ NÀO
│  ├─ overview.md · tech-stack.md · runtime-engine.md · game-kind-sdk.md
│  ├─ blockly-integration.md · content-model.md · hint-engine.md · rewards-engine.md
│  ├─ stage-rendering.md · data-sync-auth.md · testing-strategy.md
│  └─ security-privacy.md · deployment-ops.md
├─ adr/                      QUYẾT ĐỊNH ĐÃ CHỐT (không sửa nội dung, chỉ thay thế bằng ADR mới)
├─ conventions/              QUY ƯỚC: code, git, soạn nội dung
├─ playbooks/                HƯỚNG DẪN TỪNG BƯỚC cho việc lặp lại
├─ roadmap/                  GIAI ĐOẠN, TASK, TIÊU CHÍ NGHIỆM THU
└─ research/                 TÀI LIỆU NGHIÊN CỨU (tham khảo, không phải nguồn chuẩn)
```

## Quy tắc cập nhật tài liệu
- Đổi hành vi của hệ thống → cập nhật tài liệu nguồn chuẩn **trong cùng commit**.
- Đổi một quyết định đã có ADR → viết ADR mới với trạng thái "Thay thế ADR-xxxx", không sửa ADR cũ.
- Tài liệu viết bằng tiếng Việt. Tên định danh trong code, tên file, đoạn code: tiếng Anh.
