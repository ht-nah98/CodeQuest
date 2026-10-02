# Môi trường dev, CI & deploy

Nguồn chuẩn cho: cài đặt máy dev, biến môi trường, CI, deploy, vận hành.

## Môi trường dev
- **Node 22 LTS** (`.nvmrc`), npm 10. Python 3 + Pillow chỉ cần khi xử lý sprite.
- **WSL2:** repo nằm ở ổ Linux của WSL, **`~/projects/codequest`** (chuyển từ `/mnt/d/Study-Lesson` ngày 01/10/2026). Không đặt repo trên ổ Windows (`/mnt/c`, `/mnt/d`): truy cập từ WSL rất chậm, `npm install`/Vite/Vitest chậm và file watcher có thể bỏ sót thay đổi. Mở bằng VS Code Remote-WSL (`code ~/projects/codequest`). Trình duyệt Windows vẫn mở được `http://localhost:5173` vì WSL2 tự chuyển tiếp cổng.
- Trình duyệt test: Chrome hoặc Edge bản mới. Playwright tự cài Chromium (`npx playwright install chromium`).
- Supabase local (từ GĐ 2): `npx supabase start` (cần Docker Desktop có WSL integration).

## Biến môi trường
`apps/web/.env.example`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_ENV=local        # local | preview | production
```
Edge Function (đặt trong Supabase, **không** commit): `SUPABASE_SERVICE_ROLE_KEY`, `PAIRING_CODE_PEPPER`.

Khi chưa có `VITE_SUPABASE_URL`, app chạy chế độ **chỉ local** (đúng hành vi GĐ 1).

## Script gốc (`package.json` ở root)
| Script | Lệnh |
|---|---|
| `dev` | `npm -w apps/web run dev` |
| `build` | `npm run typecheck && npm -w apps/web run build` |
| `typecheck` | `tsc -b` (project references cho mọi workspace; khai báo `.d.ts` xuất vào `.tsbuild/` đã gitignore) |
| `lint` / `format` | `eslint .` · `prettier --write .` |
| `test` | `vitest run --passWithNoTests` (Vitest projects: node cho packages/tools, jsdom cho web) |
| `content:check` | `tsx tools/content-check/src/main.ts` |
| `e2e` | `npm -w apps/web run e2e` |
| `sprites` | `python3 tools/sprites/clean.py` |
| `sprites:pack` | `python3 tools/sprites/pack.py` |

## CI — `.github/workflows/ci.yml`
Chạy trên mỗi push và pull request:
1. `npm ci` (cache npm)
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test -- --coverage`
5. `npm run content:check`
6. `npm run build`
7. `npx playwright install --with-deps chromium && npm run e2e -- --grep @smoke --pass-with-no-tests` (bỏ cờ `--pass-with-no-tests` ở P0-07, khi đã có test smoke đầu tiên)

Mọi bước phải xanh mới được merge vào `main`.

## Deploy
| Môi trường | Nơi | Khi nào |
|---|---|---|
| Preview | Vercel preview URL | Mỗi pull request |
| Production | Vercel (Hobby; dự án cá nhân, phi thương mại) | Merge vào `main` |
| Backend | 1 Supabase project `codequest` (gói Free) | Migration chạy tay: `npx supabase db push` |

Cấu hình Vercel: framework *Vite*, root `apps/web`, build `npm run build`, output `dist`, rewrite mọi route về `index.html` (SPA).

## Vận hành
- **Supabase gói Free tạm dừng project sau ~1 tuần không có hoạt động.** App vẫn chạy local khi project bị dừng, nhưng không đồng bộ được. Kỳ nghỉ dài: vào dashboard bấm Restore. Nếu thấy phiền thì nâng gói hoặc đặt một GitHub Action ping hằng ngày.
- **Sao lưu:** GitHub Action hằng tuần chạy `supabase db dump`, lưu artifact 90 ngày (GĐ 2).
- **Phát hành nội dung:** nội dung đóng gói cùng bản build, nên thêm màn = merge PR = deploy. Không cần migration.
- **Xử lý sự cố:** Góc huấn luyện viên hiện trạng thái đồng bộ của từng máy (lần cuối đồng bộ, số dòng chờ trong outbox).
