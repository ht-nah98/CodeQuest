# tools/ — Script cho dev & nội dung

| Thư mục | Lệnh | Việc |
|---|---|---|
| `sprites/` | `npm run sprites -- <in.png> <outDir> [--names a,b,…]` · `npm run sprites:pack -- <dir> [--out apps/web/public/sprites]` | `clean.py` làm sạch sprite sheet 4×4; `pack.py` tạo spritesheet Pixi (Python + Pillow + NumPy, `pip install -r tools/sprites/requirements.txt`) |
| `content-check/` | `npm run content:check [-- --dir <thư mục>]` | Kiểm 18 luật của `docs/architecture/content-model.md` §5: đọc file, gọi `@codequest/validator` cho luật cấp màn, tự kiểm luật liên file; `fixtures/` có một cây nội dung sai cho mỗi luật |
| `par/` | `npm run par -- <levelId \| level.json>… [--world <wNN>] [--max-size N] [--depth N] [--budget N] [--timeout <giây>]` | Vét cạn `par` (màn build) và `parEdits` (màn bughunt) bằng `@codequest/validator`, xem `content-model.md` §8 |
| `audio/` | `npm run audio:gen [-- --wav-only]` | Tổng hợp tất định hiệu ứng + 2 bài nhạc nền chiptune → `apps/web/public/audio/{sfx,music}/*.mp3` (cần `ffmpeg`), xem `docs/architecture/audio.md` §4 |
| `voice/` | `npm run voice -- lines \| check \| build --provider <id>` | Liệt kê câu cần giọng đọc, sinh trước file giọng qua adapter TTS (HLV chọn), xem `tools/voice/README.md` |
| `level-editor/` | (GĐ 2, chạy trong web ở `/coach/editor`) | Phần logic không phụ thuộc UI của editor |

Tools được import `engine`, `games`, `content-schema`, `validator`; **không** import `apps/web`. Riêng `voice/` **đọc** `apps/web/src/i18n/vi.ts` như văn bản (parser TypeScript) và ghi `apps/web/src/audio/voiceManifest.json` + `apps/web/public/audio/`.
