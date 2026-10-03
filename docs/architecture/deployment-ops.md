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
VITE_APP_ENV=local
```
`VITE_APP_ENV` nhận `local` | `preview` | `production`.
Edge Function (đặt trong Supabase, **không** commit): `PAIRING_CODE_PEPPER` do HLV tự đặt. Khóa quản trị (`SUPABASE_SECRET_KEYS`, hoặc tên cũ `SUPABASE_SERVICE_ROLE_KEY`) do Supabase tự cấp cho function.

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
| `e2e` | `npm -w apps/web run e2e --` (dấu `--` để cờ như `--grep` đi tiếp tới Playwright) |
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
7. `npx playwright install --with-deps chromium && npm run e2e -- --grep @smoke` (test smoke đầu tiên: `apps/web/e2e/play-runner.spec.ts`, từ P0-07; không còn cờ `--pass-with-no-tests`)

Mọi bước phải xanh mới được merge vào `main`.

Ghi chú về e2e (`apps/web/playwright.config.ts`): `npm run e2e` tự bật **hai** dev server riêng, không bao giờ dùng cổng 5173 của HLV: cổng `PW_PORT` (mặc định 5199) cho các spec của bé (không có PIN) và cổng `PW_PORT + 1` với PIN giả `E2E_COACH_PIN` (mặc định 2468) chỉ cho `coach-profile.spec.ts`. Chạy 4 worker (8 worker làm sân chơi quá tải trên máy 8 GB). Chromium chạy với `--mute-audio` vì WSL2/CI không có thiết bị âm thanh.

## Deploy
| Môi trường | Nơi | Khi nào |
|---|---|---|
| Preview | Vercel preview URL | Mỗi pull request |
| Production | Vercel (Hobby; dự án cá nhân, phi thương mại) | Merge vào `main` |
| Backend | 1 Supabase project `codequest` (gói Free) | Migration chạy tay: `npx supabase db push` |

Cấu hình Vercel: framework *Vite*, root `apps/web`, install `cd ../.. && npm ci`, build `npm run build`, output `dist`, Node 22.x, rewrite mọi route về `index.html` (SPA, file `apps/web/vercel.json`). Chi tiết: mục H4 bên dưới.

## Vận hành
- **Supabase gói Free tạm dừng project sau ~1 tuần không có hoạt động.** App vẫn chạy local khi project bị dừng, nhưng không đồng bộ được. Kỳ nghỉ dài: vào dashboard bấm Restore. Nếu thấy phiền thì nâng gói hoặc đặt một GitHub Action ping hằng ngày.
- **Sao lưu:** GitHub Action hằng tuần chạy `supabase db dump`, lưu artifact 90 ngày (GĐ 2).
- **Phát hành nội dung:** nội dung đóng gói cùng bản build, nên thêm màn = merge PR = deploy. Không cần migration.
- **Xử lý sự cố:** Góc huấn luyện viên hiện trạng thái đồng bộ của từng máy (lần cuối đồng bộ, số dòng chờ trong outbox).

## Hướng dẫn hạ tầng cho huấn luyện viên (H1–H5)

Dành cho HLV (task P2-17). Làm theo thứ tự **H3 → H1 → H5 → H4**; H2 làm lúc nào cũng được (không bắt buộc nếu đã có H1 + H3). Mỗi bước có phần *Kiểm tra* và *Lỗi hay gặp*. Giao diện các dịch vụ hay đổi tên menu; nếu không thấy đúng chữ, tìm mục gần giống rồi báo AI.

### Quy tắc về khóa bí mật (đọc trước)
- **Không dán** khóa bí mật (`service_role` / Secret key, `PAIRING_CODE_PEPPER`, mật khẩu database) vào chat với AI, issue, PR hay file trong repo.
- **Lệnh sinh hoặc hiện bí mật** chỉ chạy trong **terminal WSL của chính anh** (mở Ubuntu riêng), **không** chạy qua chat Claude Code (không dùng tiền tố `!`, không nhờ AI chạy). Gồm: `openssl rand`, sửa `.env.local`, `supabase secrets ...`, `supabase status`, `supabase login/link`.
- Khi cửa sổ chat đang mở, **không** `cat`/mở file `.env*` trong chat. Sửa file bằng `nano` ở terminal riêng.
- Chỉ **Project URL** và **Publishable key (hoặc anon key)** được gửi cho AI: công khai theo thiết kế, an toàn khi RLS đúng (`security-privacy.md` §3).
- `.gitignore` đã chặn `.env` và `.env.*` (trừ `.env.example`). Kiểm tra bất cứ lúc nào:
  ```bash
  cd ~/projects/codequest
  git check-ignore -v apps/web/.env.local   # phải in dòng: .gitignore:9:.env.*  apps/web/.env.local
  ```

### Tên khóa Supabase (cũ và mới)
Supabase đang chuyển sang tên khóa mới; hai kiểu cùng tồn tại. Nguồn: https://supabase.com/docs/guides/api/api-keys (kiểm ngày 03/10/2026).

| Vai trò | Tên mới | Tên cũ (legacy, JWT dài, bắt đầu `eyJ`) | Gửi AI? |
|---|---|---|---|
| Khóa công khai, chạy trong trình duyệt | **Publishable key** `sb_publishable_…` | `anon` | **Có** |
| Khóa quản trị, vượt RLS | **Secret key** `sb_secret_…` | `service_role` | **Không bao giờ** |

- Xem ở **Project Settings → API Keys** (tab *Publishable and secret API keys*; tab *Legacy API keys* chứa `anon`/`service_role`). Có thể lấy cả ở nút **Connect** của project.
- Khóa cũ **vẫn dùng được**, nhưng Supabase dự kiến ngừng vào cuối 2026. Tạo khóa mới không tự vô hiệu khóa cũ. Dùng **Publishable key** nếu dashboard có; chưa có thì dùng `anon`. Biến trong app vẫn tên `VITE_SUPABASE_ANON_KEY` (điền loại khóa công khai nào cũng được); AI sẽ đổi tên biến nếu cần.
- Edge Function nhận sẵn các biến do Supabase tự cấp: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS` (JSON), và biến cũ `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (vẫn chạy). Vì vậy HLV **không** cần tự đặt khóa quản trị cho function. Tên secret tự đặt **không được bắt đầu bằng `SUPABASE_`**. Nguồn: https://supabase.com/docs/guides/functions/secrets
- Lưu ý cho AI ở P2-03/P2-16: khi gọi function bằng Publishable key (không phải JWT), kiểm tra JWT mặc định của function (`verify_jwt`) có thể từ chối; tài liệu Supabase hướng dẫn đặt `verify_jwt = false` khi dùng khóa mới và tự kiểm người gọi trong code. Cách xử lý chốt ở P2-16 (ghi lại trong ADR-0010 nếu đổi).

| Giá trị | Lấy ở đâu | Đặt ở đâu | Gửi AI? |
|---|---|---|---|
| Project URL | Project Settings → API (hoặc nút Connect) | `apps/web/.env.local` (`VITE_SUPABASE_URL`); Vercel (H4) | Có |
| Publishable / anon key | Project Settings → API Keys | `apps/web/.env.local` (`VITE_SUPABASE_ANON_KEY`); Vercel (H4) | Có |
| Secret / service_role key | Project Settings → API Keys | Không cần tự đặt cho Edge Function (Supabase tự cấp). Chỉ khi chạy spike P2-01: `tools/spikes/pairing/.env.local` | **Không** |
| `PAIRING_CODE_PEPPER` | Tự sinh (H5) | Secret của Edge Function (Supabase); `supabase/functions/.env` khi chạy local | **Không** |

### Khi bị kẹt: gửi cho AI những thứ sau (không bí mật)
- Tên bước (H1–H5) và **chép nguyên văn dòng báo lỗi** (không chụp trang có khóa).
- Hệ điều hành/terminal đang dùng (WSL Ubuntu hay PowerShell), kết quả `git status -sb`, `node -v`.
- Với CI/Vercel: link lượt chạy (Actions run / Deployment) hoặc đoạn log đỏ. Log build không chứa khóa; nếu thấy chuỗi `eyJ…`, `sb_secret_…` hay `PEPPER=…` thì **xóa** trước khi gửi.
- Ảnh chụp màn hình trang Settings: **che** mọi ô có khóa.

### H3 · Repo GitHub + push + branch protection
Làm đầu tiên: gỡ chặn CI thật (P1-15) và Vercel (H4).

1. Đăng nhập GitHub → **New repository**. Tên `codequest`, chọn **Private**. **Không** tick "Add a README / .gitignore / license" (repo phải rỗng). Bấm **Create repository**.
2. Khai báo tên/email commit (nếu `git config user.name` đang trống): `git config --global user.name "Tên"` và `git config --global user.email "email"`. Email này sẽ hiện trong lịch sử commit; dùng email `noreply` của GitHub nếu không muốn lộ email thật (Settings → Emails).
3. Xác thực (làm một lần). Cách dễ nhất là GitHub CLI; ưu tiên cài theo https://cli.github.com (bản trong `apt` của Ubuntu có thể cũ):
   ```bash
   gh auth login
   ```
   Chọn **GitHub.com → HTTPS**, trả lời **Y** cho "Authenticate Git with your GitHub credentials?", chọn *Login with a web browser*. Nếu không tự mở trình duyệt, vào https://github.com/login/device rồi nhập mã 8 ký tự hiện trong terminal. Cách khác: URL SSH `git@github.com:<tên-bạn>/codequest.git` sau khi thêm SSH key (GitHub → Settings → SSH and GPG keys).
4. Nối repo local với GitHub (thay `<tên-bạn>`):
   ```bash
   cd ~/projects/codequest
   git remote add origin https://github.com/<tên-bạn>/codequest.git
   git remote -v                      # thấy 2 dòng origin (fetch/push)
   ```
5. Push nhánh chính trước, **chờ CI xanh**, rồi mới đẩy các nhánh tính năng:
   ```bash
   git push -u origin main
   git push -u origin feat/P0-phase-0 feat/P1-wave1 feat/P1-wave2 feat/P2-stream-a
   ```
   Mỗi nhánh đẩy lên sẽ chạy CI riêng (tốn phút Actions). Chỉ đẩy nhánh còn cần. **Tránh** `git push --all`: nó đẩy mọi nhánh local kể cả nhánh thử bỏ dở.
6. Tab **Actions** của repo: workflow **CI** tự chạy. Chờ job `check` xanh (cần để bước 7 thấy tên check).
7. **Bật branch protection (tùy gói):** theo tài liệu GitHub, rulesets chỉ có cho gói Team/Enterprise (https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) và branch protection cho repo **private** cũng cần gói trả phí (https://docs.github.com/en/get-started/learning-about-github/githubs-plans). Repo private ở **GitHub Free** nhiều khả năng **không** có mục này. Chọn một:
   - **(a) Đổi repo sang Public** (Settings → General → Danger Zone → Change visibility). Repo không chứa dữ liệu của bé (`security-privacy.md`); không để khóa trong repo. Public thì có branch protection và Actions **miễn phí không giới hạn** (https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions).
   - **(b) Nâng gói** (Pro/Team) và giữ Private.
   - **(c) Bỏ qua**, giữ quy ước: mọi thay đổi vào `main` đi qua PR, chỉ bấm Merge khi CI xanh. Repo private Free có **2.000 phút Actions/tháng**, đủ dùng nếu không đẩy quá nhiều nhánh; hết phút CI sẽ không chạy.

   Nếu có mục này: **Settings → Branches → Add branch protection rule** (hoặc *Rules → Rulesets*), pattern `main`, tick:
   - **Require a pull request before merging**
   - **Require status checks to pass before merging** → gõ `check` → chọn **check** (tên job trong `ci.yml`)
   - (tùy chọn) *Require branches to be up to date before merging*: chặt hơn nhưng phải cập nhật nhánh trước mỗi lần merge; với 1 người làm có thể bỏ
   - (tùy chọn) *Do not allow bypassing the above settings*: nếu tick, chính anh cũng phải qua PR

**Kiểm tra:** `git status -sb` hiện `main...origin/main` không lệch; tab Actions có dấu tick xanh. Nếu đã bật protection: mở một **PR thử** (đẩy một nhánh rồi *Compare & pull request*), nút **Merge** bị khóa tới khi `check` xanh.

**Lỗi hay gặp:**
| Lỗi | Cách xử lý |
|---|---|
| `remote origin already exists` | `git remote set-url origin <url>` |
| `Authentication failed` / `Permission denied (publickey)` | Chạy lại `gh auth login`; với SSH thì kiểm `ssh -T git@github.com` |
| `src refspec ... does not match any` | Tên nhánh sai; xem `git branch` |
| CI đỏ ở bước `npm ci` hay `playwright` | Gửi log bước đỏ cho AI (xem mục "Khi bị kẹt") |
| Không thấy `check` trong ô status checks | CI chưa chạy xong lần nào; đợi bước 6 rồi tải lại trang |
| Không thấy mục branch protection / bị khóa "Upgrade" | Gói Free + repo private: chọn (a), (b) hoặc (c) ở bước 7 |

### H1 · Supabase project `codequest`
1. Vào https://supabase.com → **Sign in with GitHub**.
2. **New project**: Organization mặc định, **Name** `codequest`, **Database password** bấm *Generate a password* rồi lưu vào trình quản lý mật khẩu (không gửi cho ai; sẽ cần khi chạy `supabase link`), **Region** `Southeast Asia (Singapore)` (gần Việt Nam nhất), gói **Free**.
3. Các tùy chọn bảo mật/API ở màn tạo project (ví dụ tự bật RLS, mở Data API): **giữ mặc định**, rồi báo AI những ô nào đang tick. Bấm **Create new project**, đợi 1–2 phút.
4. Lấy giá trị ở **Project Settings → API Keys** (xem bảng "Tên khóa Supabase"): chép **Project URL** (dạng `https://xxxx.supabase.co`) và **Publishable key** (hoặc `anon` ở tab Legacy). **Chỉ gửi hai giá trị này cho AI.**
5. Đặt vào máy dev (không commit), trong terminal WSL của anh:
   ```bash
   cd ~/projects/codequest/apps/web
   cp .env.example .env.local
   nano .env.local      # điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY; giữ VITE_APP_ENV=local
   ```
6. Secret key / `service_role` (cùng trang, bấm *Reveal*): **giữ riêng, không gửi**. Edge Function đã được Supabase cấp khóa này (xem trên). Chỉ khi chạy spike P2-01 mới cần: AI sẽ nhắc, anh tự đặt vào `tools/spikes/pairing/.env.local` (đã bị `.gitignore` chặn) rồi chạy script ở terminal riêng.

**Kiểm tra:** Dashboard mở được, project `codequest` trạng thái *Healthy*. Trong terminal riêng: `grep -c "^VITE_SUPABASE_URL=https" apps/web/.env.local` in `1` (lệnh chỉ đếm, không in khóa). `git status` **không** liệt kê `.env.local`.

**Giới hạn gói Free** (nguồn: https://supabase.com/docs/guides/platform/free-project-pausing, https://supabase.com/docs/guides/platform/billing-on-supabase):
- Project bị **tạm dừng sau ~1 tuần ít hoạt động**; sau khi dừng có **90 ngày** để bấm **Restore project** trên dashboard (con số này theo tài liệu hiện tại, kiểm lại nếu đã lâu). Quá hạn thì có thể mất project. App vẫn chạy local khi project dừng nhưng không đồng bộ. Mở dashboard/app trước buổi học sau kỳ nghỉ.
- **Không có sao lưu tự động** ở gói Free (0 ngày lưu). Sao lưu hằng tuần do GitHub Action `supabase db dump` (GĐ 2) lo; chưa có Action đó thì dữ liệu chưa được sao lưu.
- Tối đa 2 project Free mỗi tài khoản; egress 5 GB, storage 1 GB. Không đổi được region sau khi tạo (phải tạo lại).

**Lỗi hay gặp:** không thấy khóa `eyJ…`: mở tab *Legacy API keys*. Khóa dán thiếu ký tự: dùng nút copy. Lấy nhầm Secret/`service_role` để dán vào `.env.local`: **sai**, đổi lại thành Publishable/anon và coi khóa kia đã lộ nếu từng dán vào đâu đó (xoay khóa trong dashboard).

### H2 · Docker Desktop + WSL integration
Chỉ cần nếu muốn chạy `npx supabase start` trên máy. Không bắt buộc nếu đã có H1 + H3.

1. Tải **Docker Desktop for Windows** (https://www.docker.com/products/docker-desktop), cài, chọn backend **WSL 2**, khởi động lại máy nếu được hỏi. Xem điều khoản gói miễn phí của Docker nếu dùng ngoài mục đích cá nhân/giáo dục nhỏ.
2. Docker Desktop → **Settings → Resources → WSL integration** → bật **Enable integration with my default WSL distro** và công tắc cho distro đang dùng (ví dụ `Ubuntu`) → **Apply & restart**.
3. Trong terminal WSL:
   ```bash
   docker version              # phải thấy cả Client và Server
   docker run --rm hello-world # in "Hello from Docker!"
   ```
4. Thử Supabase local (sau khi AI thêm `supabase/config.toml` ở P2-16). **Lần đầu tải vài GB ảnh Docker**, mất vài phút đến vài chục phút và cần ổ trống:
   ```bash
   cd ~/projects/codequest
   npx supabase start
   npx supabase status         # in API URL và các KHÓA LOCAL: xem ở terminal riêng, KHÔNG dán vào chat
   npx supabase stop           # tắt khi xong
   ```

**Kiểm tra:** `docker run --rm hello-world` chạy được từ terminal WSL (không phải PowerShell).

**Lỗi hay gặp:**
| Lỗi | Cách xử lý |
|---|---|
| `docker: command not found` trong WSL | Docker Desktop chưa chạy hoặc chưa bật WSL integration cho đúng distro (bước 2); chạy `wsl --shutdown` ở PowerShell rồi mở lại |
| `Cannot connect to the Docker daemon` | Mở Docker Desktop, đợi biểu tượng cá voi báo *running* |
| Thiếu WSL 2 / ảo hóa | Bật *Virtual Machine Platform* và ảo hóa trong BIOS; `wsl --update` ở PowerShell |
| Máy chậm, ngốn RAM | Tạo `%UserProfile%\.wslconfig` với `[wsl2]` và `memory=6GB`, rồi `wsl --shutdown` |
| `port is already allocated` | Dịch vụ khác đang dùng cổng; `npx supabase stop` hoặc tắt dịch vụ trùng |

### H5 · Secret `PAIRING_CODE_PEPPER`
Chuỗi ngẫu nhiên dùng khi băm mã ghép máy (`security-privacy.md` §3). Đặt lại pepper chỉ làm các mã đang mở (hạn 10 phút) mất hiệu lực, không ảnh hưởng dữ liệu bé.

Trong **terminal WSL riêng của anh** (không qua chat):
1. Sinh chuỗi 32 byte (64 ký tự hex) và lưu vào trình quản lý mật khẩu (tên "CodeQuest PAIRING_CODE_PEPPER"):
   ```bash
   openssl rand -hex 32
   ```
2. Đặt cho project Supabase thật, **Dashboard → Edge Functions → Secrets** (hoặc *Project Settings → Edge Functions*) → **Add new secret**, Name `PAIRING_CODE_PEPPER`, Value là chuỗi vừa sinh → **Save**.
   Hoặc bằng CLI (cần `npx supabase login`, rồi `npx supabase link --project-ref <ref>`; `<ref>` là phần `xxxx` trong URL project; lệnh `link` hỏi **mật khẩu database** của H1):
   ```bash
   npx supabase secrets set PAIRING_CODE_PEPPER="$(openssl rand -hex 32)"
   ```
   **Cẩn thận:** mỗi lần chạy lại `secrets set` là **đổi (xoay) pepper** sang giá trị mới. Cách CLI này không cho anh biết giá trị; cần lưu giá trị thì dùng cách dashboard.
3. Khi chạy local (chỉ khi có H2): tạo `supabase/functions/.env` (đã bị `.gitignore` chặn; kiểm `git check-ignore -v supabase/functions/.env`) chứa một dòng `PAIRING_CODE_PEPPER=<chuỗi khác, sinh bằng openssl rand -hex 32>`. Dùng pepper **khác** cho local và production.

**Kiểm tra:** Dashboard → Edge Functions → Secrets hiện tên `PAIRING_CODE_PEPPER` (giá trị luôn ẩn); hoặc `npx supabase secrets list` có dòng đó. `git status` sạch.

**Lỗi hay gặp:** `openssl: command not found` → `sudo apt install openssl`. `Cannot find project ref` → chạy `npx supabase link --project-ref <ref>` trước. Secret sai tên (thừa khoảng trắng, sai hoa/thường) → function báo thiếu pepper; xóa và tạo lại.

### H4 · Project Vercel
Cần H3 xong (Vercel đọc code từ GitHub).

1. Vào https://vercel.com → **Sign up with GitHub** (gói **Hobby**, dự án cá nhân phi thương mại).
2. **Add New… → Project → Import Git Repository** → cấp quyền cho Vercel vào repo `codequest` (*Only select repositories*) → **Import**.
3. Cấu hình (theo https://vercel.com/docs/monorepos và https://vercel.com/docs/builds/configure-a-build):
   | Mục | Giá trị |
   |---|---|
   | Framework Preset | **Vite** |
   | Root Directory | `apps/web` (bấm **Edit**). Nếu có công tắc **Include source files outside of the Root Directory**, giữ **bật** (repo là npm workspaces: `apps/web` dùng các package trong `packages/`). Tài liệu Vercel chưa nêu rõ công tắc này; nếu build báo không thấy `packages/`, báo AI |
   | Install Command | bật **Override**: `cd ../.. && npm ci` (cài từ gốc repo, dùng `package-lock.json` ở gốc) |
   | Build Command | `npm run build` (trong `apps/web` chạy `vite build`; kiểm kiểu `typecheck` do CI lo, không do Vercel) |
   | Output Directory | `dist` |
   | Node.js Version | **22.x**: **Settings → Build and Deployment → Node.js Version** (repo yêu cầu Node `>=22 <23`) |
4. **Environment Variables** (đặt trước khi bấm Deploy; mỗi biến một hàng cho từng môi trường):
   | Name | Value | Environment |
   |---|---|---|
   | `VITE_SUPABASE_URL` | Project URL (H1) | Production, Preview |
   | `VITE_SUPABASE_ANON_KEY` | Publishable/anon key (H1) | Production, Preview |
   | `VITE_APP_ENV` | `production` | chỉ **Production** |
   | `VITE_APP_ENV` | `preview` | chỉ **Preview** |
   
   `VITE_APP_ENV` thành **hai hàng**: bỏ tick Preview ở hàng `production`, bỏ tick Production ở hàng `preview`. **Không** thêm khóa Secret/`service_role` hay pepper vào Vercel (biến `VITE_*` bị nhúng vào JavaScript công khai).
5. Bấm **Deploy**. Build đỏ: gửi log cho AI (xem "Khi bị kẹt"), đừng sửa lung tung.
6. **Rewrite SPA (đường dẫn con):** file `apps/web/vercel.json` đã có trong repo (`{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`); P2-18 sẽ thêm header CSP vào cùng file. Kiểm tra: mở `<link>/map`, bấm **F5** (tải lại) vẫn hiện app, không 404.
7. **Bản preview:** mở một PR từ nhánh `feat/...` vào `main`; bot Vercel bình luận link preview trong PR.
8. **Ai xem được:** theo tài liệu hiện tại (https://vercel.com/docs/deployment-protection), mặc định *Standard Protection* bảo vệ mọi URL **trừ domain production**. Vậy ở gói Hobby, URL production `*.vercel.app` là **công khai** (ai có link đều mở được; app không chứa dữ liệu cá nhân của bé nằm sẵn trong bản build), còn **link preview cần đăng nhập Vercel**: gửi link preview cho người khác sẽ bị chặn. Kiểm ở **Settings → Deployment Protection**.

**Kiểm tra:** URL production mở được và chơi được một màn; `<link>/map` + F5 không 404; PR có link preview; **Settings → Environment Variables** có đủ 4 hàng như bảng trên.

**Lỗi hay gặp:**
| Lỗi | Cách xử lý |
|---|---|
| `Cannot find module '@codequest/...'` hoặc không thấy `packages/` khi build | Kiểm Install Command là `cd ../.. && npm ci` và công tắc *Include source files outside of the Root Directory* (nếu có) đang bật; **Redeploy** |
| `npm ci` báo lockfile không khớp | Chạy `npm install` ở gốc repo, commit `package-lock.json` (nhờ AI), push lại |
| Build báo sai phiên bản Node | Đặt Node.js Version **22.x** (bảng trên) rồi Redeploy |
| Trang trắng, console báo thiếu Supabase | Biến `VITE_*` thêm sau lần build: **Redeploy** (biến chỉ có hiệu lực ở lần build sau) |
| Mở `/map` bị 404 | `apps/web/vercel.json` thiếu hoặc Root Directory sai; kiểm lại bước 3 và 6 |
| Không thấy repo trong danh sách | GitHub → Settings → Applications → Vercel → *Configure* → thêm repo `codequest` |
| Link preview đòi đăng nhập | Đúng thiết kế (bước 8) |

### Báo lại cho AI khi xong
Gửi vào chat (chỉ các mục này): "H3 xong, link repo …, chọn (a)/(b)/(c) cho branch protection", "H1 xong, Project URL …, Publishable/anon key …, các ô bảo mật đã tick …", "H2 xong / bỏ qua", "H5 xong (đã đặt secret)", "H4 xong, link Vercel …". Nghiệm thu P2-17: `npx supabase status` (nếu có H2) hoặc dashboard mở được; CI xanh trên GitHub; Vercel tạo được bản preview cho một PR.
