# 🐼 CodeQuest

Web game dạy **tư duy lập trình** cho học sinh tiểu học, cùng gấu trúc **Măng**. Bé ghép khối lệnh (Blockly) để giải đố qua 10 thế giới, từ tuần tự, vòng lặp, điều kiện đến robot kiểu AIROC và thuật toán.

> **Trạng thái:** đang ở GĐ 0. Đã có khung monorepo (P0-01); chưa có tính năng. Xem `docs/roadmap/`.

## Bắt đầu
- **AI agent:** đọc [`AGENTS.md`](AGENTS.md).
- **Người:** đọc [`docs/README.md`](docs/README.md) (bản đồ tài liệu) → [`docs/product/vision.md`](docs/product/vision.md) → [`docs/architecture/overview.md`](docs/architecture/overview.md).
- **Phong cách:** [style board](https://claude.ai/artifact/HKbvQDqtYxkvkAwz54fBeb) · [`docs/design/art-direction.md`](docs/design/art-direction.md)

## Cấu trúc
```
apps/web/        Ứng dụng React (UI, Blockly, sân chơi PixiJS, lưu trữ)
packages/        engine · games · rewards · content-schema  (headless, chạy được trên Node)
content/         Chương trình học dạng JSON
assets/          Ảnh & âm thanh gốc
tools/           Làm sạch sprite, kiểm chứng nội dung, level editor
supabase/        Backend (từ GĐ 2)
design/          Style board, mockup
docs/            Tài liệu
```

## Lệnh
```bash
npm install && npm run dev        # http://localhost:5173
npm run lint && npm run typecheck && npm run test && npm run content:check
```
Danh sách đủ: `AGENTS.md` §5.

## Công nghệ
React 19 · Vite 8 · TypeScript 6.0 · Blockly 13 · js-interpreter · PixiJS 8 · Tailwind 4 · Dexie · Supabase. Chi tiết: [`docs/architecture/tech-stack.md`](docs/architecture/tech-stack.md).

## Giấy phép bên thứ ba
Blockly (Apache-2.0) được dùng qua npm. Ý tưởng từ Blockly Games (Apache-2.0) được tham khảo, không sao chép asset. Xem `assets/CREDITS.md`.
