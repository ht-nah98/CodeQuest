# tools/ — Script cho dev & nội dung

| Thư mục | Lệnh | Việc |
|---|---|---|
| `sprites/` | `npm run sprites -- <in.png> <outDir> [--names a,b,…]` · `npm run sprites:pack -- <dir> [--out apps/web/public/sprites]` | `clean.py` làm sạch sprite sheet 4×4; `pack.py` tạo spritesheet Pixi (Python + Pillow + NumPy, `pip install -r tools/sprites/requirements.txt`) |
| `content-check/` | `npm run content:check` | Kiểm 18 luật của `docs/architecture/content-model.md` §5 |
| `level-editor/` | (GĐ 2, chạy trong web ở `/coach/editor`) | Phần logic không phụ thuộc UI của editor |

Tools được import `engine`, `games`, `content-schema`; **không** import `apps/web`.
