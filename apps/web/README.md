# apps/web — Ứng dụng CodeQuest

SPA React 19 + Vite 8. Mọi thứ bé và huấn luyện viên nhìn thấy.

**Đọc trước:** `docs/architecture/overview.md` §3, `docs/design/screens-and-flows.md`, `docs/conventions/coding-standards.md` §3–5.

| Thư mục | Trách nhiệm |
|---|---|
| `src/app/` | Khởi động, router, provider, error boundary |
| `src/screens/` | Mỗi route một thư mục; chỉ ghép UI, không chứa logic nghiệp vụ |
| `src/features/` | progress, coins, hints, profiles, sync: hook và logic dùng chung |
| `src/blockly/` | Wrapper React, theme, toolbox, messages, popover chỉ bước tiếp, phím tắt, capacity guard (GĐ 4) |
| `src/stages/` | `StageController` + renderer PixiJS cho từng kiểu game |
| `src/ui/` | Design system (token, Button, Panel, Bubble, Hud…); không biết nghiệp vụ |
| `src/audio/` | Howler: hiệu ứng, nhạc, giọng đọc |
| `src/data/` | Dexie DB, repository, outbox, Supabase client |
| `src/i18n/vi.ts` | Chuỗi giao diện tiếng Việt |
| `src/lib/` | Tiện ích nhỏ dùng ở ≥ 2 feature |
| `public/` | sprites, tiles, audio, fonts (font tự host) |
| `e2e/` | Playwright |

Quy tắc: component không gọi Dexie/Supabase trực tiếp; object Blockly/Pixi không đưa vào state React; không viết mã màu trong component.
