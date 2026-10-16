# tools/content-gen — sinh nội dung từ chương trình viết gọn

| Lệnh (chạy ở gốc repo, chỉ cần `python3`) | Việc |
|---|---|
| `python3 tools/content-gen/w09gen.py` | Sinh toàn bộ `content/worlds/w09-thap-hoa-si/` (`world.json`, bài, màn) từ chương trình viết gọn (`F2 R90 U D REP3[…]`). Hình mẫu của mỗi màn là lời giải trải ra; giấy ôm hình, chừa 1 bước |
| `python3 tools/content-gen/w09table.py` | Viết lại bảng "Chi tiết từng màn" ở `docs/product/curriculum.md` §6.4 từ cùng dữ liệu |

Sau khi sinh: `npx prettier --write content/worlds/w09-thap-hoa-si`, rồi `npm run content:check`, `npx vitest run tools/content-check/src/w09.test.ts` và `npm run par -- --world w09` (việc nặng). Sửa màn W9 ở `w09gen.py`, **không** sửa tay file JSON (lần sinh sau sẽ ghi đè). Bẫy T1 của từng màn nằm ở `TURTLE_T1` (`tools/content-check/src/turtle.ts`); khi đổi lời giải nhớ sửa cả hai chỗ.

## Thế giới 8 — Xưởng Phép Thuật (`w08/`, TypeScript)

| Lệnh (chạy ở gốc repo) | Việc |
|---|---|
| `npx tsx tools/content-gen/w08/gen.ts` | Sinh toàn bộ `content/worlds/w08-xuong-phep-thuat/` (`world.json`, 6 bài, 20 màn + sáng tạo) từ `w08/designs.ts`. Trước khi ghi, chạy mọi lời giải trên engine thật (khối `dạy phép` / `làm phép`, cả khối có hộp), kiểm mọi chương trình bẫy đều thua và khóa đoán của màn `predict` khác nhau; sai thì không ghi gì |
| `~/.cache/cq/heavy.sh <tên> npx tsx tools/content-gen/w08/verify.ts r5` | R5 (việc nặng): bỏ khối phép khỏi thanh khối, vét cạn tới `maxBlocks`, không được có chương trình thắng (`curriculum.md` §6.3.1) |
| `~/.cache/cq/heavy.sh <tên> npx tsx tools/content-gen/w08/verify.ts loop` | Kiểm "phép thắng vòng lặp" cho `l01`, `l03`, `l04`, `l08`, `l09` và 2 thẻ demo: thêm `lặp`, bỏ phép, vét cạn tới `par` |
| `tools/content-gen/w08/plan.ts` (thư viện) | Bộ lập kế hoạch giây cho bẫy thứ tự của boss W8: Dijkstra trên vị trí, hướng, trạng thái từng khối; `fastest(board, firstGrab?)` cho giây nhanh nhất mọi thứ tự, hoặc khi buộc gắp khối nào trước |

Sau khi sinh: `npx prettier --write content/worlds/w08-xuong-phep-thuat`, rồi `npm run content:check`, `npx vitest run tools/content-check/src/w08.test.ts` và `npm run par -- --world w08` (việc nặng). Sửa màn W8 ở `w08/designs.ts` (bản đồ, chương trình, chữ cho bé), **không** sửa tay file JSON. Cách viết chương trình gọn: chú thích đầu `w08/dsl.ts` (`F` tiến, `{ call: 'stair' }` làm phép, `{ calln: 'turn', n: 3 }` làm phép với 3…). `w08/tsconfig.json` cho eslint và `tsc -p tools/content-gen/w08`; chưa nằm trong `tsc -b` gốc. Trạng thái: 🟨 nháp, chờ HLV chơi thử.
