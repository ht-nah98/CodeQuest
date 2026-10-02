# Công nghệ & phiên bản

Nguồn chuẩn cho: thư viện được dùng, phiên bản, lý do. Phiên bản dưới đây đã **kiểm tra trên npm ngày 01/10/2026**, kèm kiểm tra peer dependency.

Quy tắc:
- Ghim phiên bản chính xác (không dùng `^`) cho `blockly`, `js-interpreter`, `pixi.js`, `typescript`. Các thư viện khác dùng `^`.
- Thêm thư viện mới: cập nhật bảng này + nêu lý do. Thư viện lớn hoặc thay thế thư viện có sẵn: viết ADR.

## Runtime
| Thư viện | Phiên bản | Dùng ở | Vai trò | Ghi chú |
|---|---|---|---|---|
| Node.js | 22 LTS | dev, CI, tools | | `.nvmrc` = 22 |
| `react`, `react-dom` | 19.3.0 | web | UI | + `@types/react`, `@types/react-dom` 19.3.0 (dev) |
| `react-router` | 8.4.0 | web | Router (chế độ declarative) | Cần React ≥ 19.2.7 |
| `blockly` | **13.3.0** | engine, games, web | Trình ghép khối | Headless trên Node: `import * as Blockly from 'blockly'` (Node tự chọn bản `core-node` + jsdom; đã chạy thử) |
| `@blockly/field-grid-dropdown` | 13.3.0 | web | Dropdown dạng lưới có ảnh | |
| `@blockly/disable-top-blocks` | 13.3.0 | web | Chỉ cho phép disable khối không rời | |
| `@blockly/workspace-content-highlight` | 13.3.0 | web | Làm mờ quanh vùng cần chú ý (tutorial) | Tên đúng có tiền tố `workspace-` |
| `@blockly/zoom-to-fit` | 13.3.0 | web | Nút thu phóng vừa màn hình | |
| `@blockly/theme-deuteranopia` | 13.3.0 | web | Gốc cho theme mù màu `codequest-cvd` | |
| `js-interpreter` | **6.0.2** | engine | Sandbox chạy JS từng bước | **Không có type TS**, tự viết `packages/engine/src/types/js-interpreter.d.ts` |
| `pixi.js` | **8.21.0** | web | Vẽ sân chơi 2D WebGL | Dùng trực tiếp (imperative), không dùng `@pixi/react`. Xem ADR-0007 |
| `motion` | 13.5.0 | web | Animation UI (React) | **Chưa cài** (01/10/2026). Hiệu ứng UI hiện viết bằng CSS (`transition`, `@keyframes` trong `ui/tokens.css`); cài khi cần animation phức tạp hơn |
| `howler` | 2.2.4 | web | Âm thanh | + `@types/howler` 2.2.13 |
| `zustand` | 5.0.15 | web | State UI phiên chơi | Không dùng `persist`; lưu trữ đi qua repository |
| `dexie` | 4.4.6 | web | IndexedDB | + `dexie-react-hooks` 4.4.0 |
| `zod` | 4.6.5 | content-schema | Schema nội dung | |
| `@supabase/supabase-js` | 2.117.2 | web | Backend | Từ GĐ 2 |
| `tailwindcss` + `@tailwindcss/vite` | 4.3.3 | web | CSS utility, đọc token từ CSS variable | Token ở `apps/web/src/ui/tokens.css` (`@theme static`); bảng màu chép sang `ui/tokens.ts` cho Blockly/Pixi, có test chống lệch |
| `vite-plugin-pwa` | 1.3.0 | web | Chơi offline | Từ GĐ 2 |

## Công cụ dev
| Thư viện | Phiên bản | Ghi chú |
|---|---|---|
| `typescript` | **6.0.3** | **Không dùng 7.x**: `typescript-eslint` 8.71 chỉ hỗ trợ TS `>=4.8.4 <6.1.0`. Xem ADR-0003 |
| `vite` | 8.3.2 | |
| `@vitejs/plugin-react` | 6.1.1 | Cần Vite 8 |
| `vitest` | 5.0.3 | Hỗ trợ Vite 6–8 |
| `@playwright/test` | 1.63.0 | |
| `eslint` | 10.11.0 | + `@eslint/js` 10.0.1, `globals` 17.13.0 |
| `typescript-eslint` | 8.71.0 | |
| `eslint-plugin-react-hooks` | 7.1.1 | |
| `prettier` | 3.9.9 | |
| `fake-indexeddb` | 6.2.5 | Test repository Dexie trên Node |
| `@types/node` | 22.20.4 (dòng 22.x) | Type cho Node trong packages/tools (`types: ["node"]`) |
| `@vitest/coverage-v8` | 5.0.3 | Đo coverage (`--coverage` trong CI) |
| `@testing-library/react` | 16.3.3 | Test component |
| `jsdom` | 29.1.1 (dòng 29.x) | Blockly headless dùng; test component. **Không lên 30**: `blockly` 13.3.0 khai báo peer `jsdom >=27.4.0 <30.0.0`. Nếu root dùng 30, npm không hoist được `blockly` và mỗi workspace có một bản riêng (registry khối tách rời nhau) |
| `supabase` (CLI) | 2.119.0 | Migration, chạy Supabase local, từ GĐ 2 |
| `tsx` | 4.23.15 | Chạy script TS trong `tools/` |
| Python 3 + Pillow ≥ 12 + NumPy ≥ 2 | — | `tools/sprites/clean.py`, `pack.py` (`tools/sprites/requirements.txt`) |
| Dịch vụ TTS tiếng Việt | chưa chọn | Sinh trước giọng đọc (`tools/voice/`). HLV chọn ở đầu task P1-14, ghi lại tại đây |

## Đã cân nhắc và không chọn
| Lựa chọn | Lý do không chọn |
|---|---|
| Next.js / SSR | Không cần SEO hay server; SPA tĩnh đơn giản hơn, chạy offline dễ hơn |
| `@pixi/react` | Phát lại theo event log là luồng mệnh lệnh có thời gian; điều khiển Pixi trực tiếp rõ ràng hơn |
| `react-blockly` | Lớp bọc mỏng nhưng phụ thuộc thêm; tự viết wrapper ~100 dòng để kiểm soát vòng đời |
| pnpm / Turborepo | 4 package nội bộ, npm workspaces đủ dùng |
| Firebase | Supabase có Postgres + SQL + RLS, dễ truy vấn cho Góc huấn luyện viên |
| Rive / Lottie | Mascot đã là sprite pixel; `AnimatedSprite` của PixiJS là đủ |
| Press Start 2P / Pixelify Sans | Không có bộ ký tự tiếng Việt |
