# Architecture Decision Records

Mỗi quyết định kỹ thuật quan trọng có một file `NNNN-<slug>.md`. ADR **không sửa nội dung** sau khi đã "Chấp nhận". Muốn đổi quyết định thì viết ADR mới có trạng thái "Chấp nhận, thay thế ADR-NNNN", rồi sửa trạng thái ADR cũ thành "Đã bị thay thế bởi ADR-MMMM".

Trạng thái: **Đề xuất** → **Chấp nhận** → (**Đã bị thay thế**).

| ADR | Quyết định | Trạng thái |
|---|---|---|
| [0001](0001-monorepo-npm-workspaces.md) | Monorepo npm workspaces, package nội bộ source-only | Chấp nhận |
| [0002](0002-react-vite-spa.md) | React 19 + Vite 8, SPA tĩnh | Chấp nhận |
| [0003](0003-pin-typescript-6.md) | Ghim TypeScript 6.0.3 | Chấp nhận |
| [0004](0004-blockly-zelos-cq-repeat.md) | Blockly 13 + zelos, khối lặp riêng `cq_repeat` | Chấp nhận |
| [0005](0005-js-interpreter-run-then-replay.md) | js-interpreter, chạy trước rồi phát lại | Chấp nhận |
| [0006](0006-headless-packages-no-dom.md) | Package headless không phụ thuộc DOM | Chấp nhận |
| [0007](0007-pixi-imperative-stage.md) | PixiJS 8 điều khiển trực tiếp | Chấp nhận |
| [0008](0008-content-as-json-validated.md) | Nội dung JSON + zod + chạy lời giải trong CI | Chấp nhận |
| [0009](0009-local-first-dexie-outbox.md) | Local-first + outbox đồng bộ Supabase | Chấp nhận |
| [0010](0010-student-device-pairing.md) | Học sinh đăng nhập bằng ghép máy + PIN | **Đề xuất** |
| [0011](0011-laptop-first.md) | Laptop-first, tối thiểu 1280×720 | Chấp nhận |
| [0012](0012-art-direction-vietnamese-fonts.md) | Pixel ấm áp + font có tiếng Việt | Chấp nhận |
| [0013](0013-vietnamese-ui-english-code.md) | Giao diện tiếng Việt, code tiếng Anh | Chấp nhận |
| [0014](0014-tailwind-tokens-motion.md) | Tailwind 4 + CSS variables + Motion | Chấp nhận |
| [0015](0015-validator-package.md) | Package headless `validator`: luật cấp màn + vét cạn `par` | Chấp nhận |
| [0016](0016-multi-map-levels.md) | Màn nhiều bản đồ (`variants`): một chương trình thắng mọi bản đồ | Chấp nhận |
| [0017](0017-star-goals.md) | Mục tiêu sao (`starGoals`): chấm trên trạng thái cuối, đạt trên mọi bản đồ | Chấp nhận |
| [0018](0018-conditional-search.md) | Khối điều kiện riêng, event `sense`, vét cạn `par` có điều kiện | Chấp nhận |
| [0019](0019-mission-items.md) | Vật phẩm nhiệm vụ (`goal.items`: chìa khóa, đón bạn) là điều kiện thắng trong config | Chấp nhận |

## Mẫu
```markdown
# ADR-NNNN: <Tiêu đề quyết định>

- **Trạng thái:** Đề xuất | Chấp nhận | Đã bị thay thế bởi ADR-MMMM
- **Ngày:** DD/MM/YYYY

## Bối cảnh
Vấn đề gì, ràng buộc gì, dữ kiện đã kiểm chứng.

## Quyết định
Chọn gì, cụ thể đến phiên bản / tên file nếu cần.

## Hệ quả
Được gì, mất gì, việc phải làm thêm.

## Phương án đã cân nhắc
Phương án — lý do không chọn.
```
