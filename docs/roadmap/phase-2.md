# GĐ 2 · Nhóm 6 bé (30/10–19/11/2026)

**Mục tiêu giai đoạn:** cả nhóm 6 bé học trên laptop riêng, tiến độ đồng bộ về Supabase, huấn luyện viên xem được từng bé ở Góc huấn luyện viên. Có thêm Thế giới 3–5 (55 màn: gỡ lỗi, điều kiện, lặp có điều kiện), level editor v0 và chơi được khi mất mạng (PWA).
**Nghiệm thu giai đoạn:** 6 bé đã ghép máy và học trên máy riêng; HLV mở `/coach` thấy đúng tiến độ của từng bé (so với máy của bé); một bé chơi offline rồi online lại, tiến độ lên server không mất, không trùng xu; HLV tạo được ≥ 5 màn mới bằng editor trong 30 phút; tag `v0.2.0`.

> **Bối cảnh lúc viết (03/10/2026):** P1-01…P1-11 ✅. P1-12/13 đã soạn nháp, chờ HLV chơi thử. P1-14 chờ HLV chọn giọng đọc. P1-15 xanh trên máy, chờ push lên GitHub. P1-16 do HLV.
> Máy dev **chưa có Docker**, **chưa có Supabase project**, **chưa có tài khoản Vercel**, **chưa push GitHub**. Vì vậy GĐ 2 chia hai luồng: **luồng A** AI làm ngay, chạy hoàn toàn offline; **luồng B** cần hạ tầng do HLV tạo (P2-17). Các task luồng B được tách sao cho phần viết code + test offline xong trước. Khi hạ tầng có, chỉ còn bước chạy thật (P2-16).
> Lỗi chặn từ buổi chơi thử GĐ 1 (P1-16) luôn được ưu tiên hơn mọi task ở đây.

| ID | Task | Phụ thuộc | Người làm | Trạng thái |
|---|---|---|---|---|
| P2-01 | Spike đăng nhập ghép máy trên Supabase thật | P2-17 (H1 hoặc H2) | AI · HLV cấp khóa | ⛔ |
| P2-02 | Migration Supabase: bảng, RLS, RPC, trigger, test SQL offline | — | AI | ⬜ |
| P2-03 | Edge Function `create-student`, `pairing-code`, `pair-device`, `delete-student` (logic + test offline) | P2-02 | AI | ⬜ |
| P2-04 | Bộ đồng bộ outbox + pull + merge, lỗi vĩnh viễn, mốc `streak-7` (với server giả) | P2-02 | AI | ⬜ |
| P2-05 | Góc huấn luyện viên trên dữ liệu local + file sao lưu | — | AI | ⬜ |
| P2-06 | Góc nhóm: mục tiêu chung, tường tác phẩm | P2-04, P2-05 | AI | ⬜ |
| P2-07 | Level editor v0 (`/coach/editor`) | P2-15 | AI | 🟨 |
| P2-08 | Nội dung Thế giới 3 · Xưởng Sửa Lỗi (15 màn + bài giảng) | P2-10, P2-11 (phần W3) | AI soạn nháp · HLV duyệt | 🟨 chờ HLV chơi thử |
| P2-09 | PWA offline (chưa deploy) | — | AI | ⬜ |
| P2-10 | Chi tiết hóa chương trình học Thế giới 3–5 | — | AI soạn · HLV duyệt | ✅ HLV + phụ huynh duyệt 03/10 |
| P2-11 | Khối điều kiện, lặp đến khi, cảm biến sáng khi kiểm | P2-10 (bản nháp) | AI | 🟨 headless + web xong, chờ HLV chơi thử W4 |
| P2-12 | Màn nhiều bản đồ (một chương trình, 2–3 bản đồ) | P2-10 (bản nháp) | AI | ✅ |
| P2-13 | Nội dung Thế giới 4 · Ngã Ba Quyết Định (20 màn + bài giảng) | P2-08, P2-11, P2-12 | AI soạn nháp · HLV duyệt | 🟨 chờ HLV chơi thử |
| P2-14 | Nội dung Thế giới 5 · Sông Chờ Đợi (20 màn + bài giảng) | P2-13 | AI soạn nháp · HLV duyệt | 🟨 chờ HLV chơi thử |
| P2-15 | Package `@codequest/validator` + công cụ vét cạn `par` | — | AI | ✅ |
| P2-16 | Nối Supabase thật: chạy migration, test SQL, deploy function, e2e có server | P2-01…P2-06, P2-17, P2-20 | AI · HLV cấp khóa | ⛔ |
| P2-17 | Hạ tầng của HLV: Supabase, Docker, GitHub, Vercel (AI viết hướng dẫn trước) | — | AI viết hướng dẫn · HLV làm | ⬜ |
| P2-18 | Deploy production, thư phụ huynh, ghép máy cho 6 bé | P2-09, P2-16, P2-17 (H3, H4) | HLV + AI | ⛔ |
| P2-19 | Chơi thử cả nhóm, sửa, phát hành `v0.2.0` | tất cả | HLV + AI | ⛔ |
| P2-20 | Màn Ghép máy của bé + giao diện tài khoản trong Góc HLV (với client giả) | P2-03, P2-05 | AI | ⬜ |
| P2-21 | Sao theo mục tiêu màn: nhiều đường giải, đường tối ưu được nhiều sao nhất (góp ý HLV 03/10) | P2-10, P2-15 | AI (luật HLV đã duyệt 03/10) | 🟨 chờ HLV xem |
| P2-22 | Xem cả đường: phóng to bản đồ nhỏ, kéo trái/phải, vạch đếm ô (góp ý HLV 03/10) | — | AI | 🟨 chờ HLV xem |
| P2-23 | Cảnh riêng cho từng thế giới: nền, nền đất, ô tường, đồ trang trí (góp ý HLV 04/10) | P2-21 (UI) | AI (HLV duyệt chủ đề 04/10, không cần duyệt ảnh) | 🟨 |

Thay đổi so với khung ở `later-phases.md`: P2-08 khung (nội dung Thế giới 3–5) tách thành **P2-08** (W3), **P2-13** (W4), **P2-14** (W5). Phần "sorter tối thiểu nếu Thế giới 4 cần" **hủy**: Thế giới 4 dùng `runner` và `maze` (`curriculum.md` §2), sorter để GĐ 4. P2-09 khung tách thành **P2-09** (PWA, AI làm ngay) và **P2-18** (deploy, cần Vercel). Thêm P2-10…P2-20. "Thợ săn lỗi" trong `master-plan.md` §9 là mode `bughunt`, đã có từ P1-06.

## Thứ tự làm & điểm chặn

**Luồng A — AI bắt đầu ngay (không cần Docker, Supabase, Vercel):**
0. Phần AI của **P2-17**: viết hướng dẫn từng bước H1–H5 vào `deployment-ops.md` (nửa giờ, gỡ chặn sớm nhất cho HLV vì luồng B là đường găng).
1. **P2-15** validator + vét cạn `par`: nền cho editor và cho việc soạn nội dung W3–5.
2. **P2-10** chi tiết hóa W3–5 → gửi HLV duyệt. Trong lúc chờ: **P2-07** level editor v0.
3. **P2-11** khối điều kiện / lặp đến khi và **P2-12** màn nhiều bản đồ (làm theo bản nháp P2-10, không cần chờ duyệt xong vì phần kỹ thuật ít đổi).
4. **P2-08** nội dung W3 (chỉ cần khối đã có + phần W3 của P2-11) → **P2-13** W4 → **P2-14** W5.
5. **P2-09** PWA offline (độc lập, chen vào khi chờ HLV duyệt nội dung).
6. **P2-05** Góc huấn luyện viên trên dữ liệu local / file sao lưu (không phụ thuộc gì, chen vào bất cứ lúc nào).
7. **P2-02 → P2-03 → P2-04 → P2-20 → P2-06** phần offline (SQL + test bằng Postgres nhúng, function + test Vitest, sync và giao diện tài khoản với server/client giả, Góc nhóm với transport giả).

**Luồng B — chờ HLV (P2-17):** P2-01 spike → P2-16 nối thật (gồm phần server của P2-05/P2-06/P2-20) → P2-18 deploy → P2-19.

### Kế hoạch soạn Thế giới 3–5 (sau khi HLV duyệt P2-10, 03/10/2026)
HLV và phụ huynh đã đọc và duyệt `curriculum.md` §5. Câu hỏi G2–G20 chưa trả lời thì giữ lựa chọn "tạm dùng". Làm tuần tự (mỗi lần một việc nặng, máy 7,8 GB):

| Bước | Việc | Gồm (mục §5.4 của `curriculum.md`) | Xong khi |
|---|---|---|---|
| 1 | **P2-12** màn nhiều bản đồ, rồi **P2-22** xem cả đường | T3, T4, T11 | review độc lập + e2e, commit |
| 2 | **P2-11a** khối mới | `cq_if`, `cq_if_else`, `cq_repeat_until`, `runner_at_goal`, câu hỏi sáng ✔/✘ khi kiểm, phát lại `TIMEOUT` (cả trong bài giảng), điểm gợi ý `step` (T1–T10, T18) | test headless + e2e từng khối |
| 3 | **P2-11b** vét cạn có điều kiện | `npm run par` hiểu khối hỏi, `maxInstances`, `maxLoopDepth` (T16, T16b) | W1–W2 vẫn xanh; ví dụ W4/W5 trong §5.5 tái lập được |
| 4 | **P2-21** mục tiêu ⭐ | `starGoals` (schema, luật sao hàm thuần + test, thẻ "Mục tiêu ⭐", màn kết quả, `par` theo mục tiêu) (T19) | test rewards + e2e |
| 5 | **P2-11c** nhiệm vụ & đích mới | dòng nhiệm vụ, `goalSprite`, `rescue`/`escort` (chìa khóa, đón bạn), lý do `NEED_KEY`/`NEED_FRIEND`, hình đích lấy từ bộ sprite và hình đại diện (T17) | e2e + ảnh chụp |
| 6 | **P2-08** nội dung W3 (15 màn + bài giảng) | soạn bằng level editor; mỗi màn qua `content:check` và `npm run par`; review sư phạm độc lập | **HLV chơi thử W3** |
| 7 | **P2-13** nội dung W4 (20 màn) | như bước 6 | **HLV chơi thử W4** |
| 8 | **P2-14** nội dung W5 (20 màn) | như bước 6 | **HLV chơi thử W5** |

**Đổi thứ tự (03/10/2026, HLV đang chờ thế giới mới):** W3 không cần khối mới, nên làm **P2-21** + phần nhiệm vụ/hình đích của **P2-11c** (dòng nhiệm vụ, `goalSprite`) trước, rồi soạn **P2-08 (W3)** để HLV chơi sớm. P2-11a/b và `rescue`/`escort` làm trong lúc HLV chơi W3, trước P2-13.

Chen vào lúc chờ HLV chơi thử: **P2-09** PWA offline, **P2-05** Góc huấn luyện viên trên dữ liệu local.
Mỗi bước: viết → review độc lập → sửa → chạy lại lint/typecheck/test/content:check/e2e → commit local. Có `par` thật nào khác số trong §5 thì sửa bản đồ cho khớp ý dạy và ghi lại; đổi ý dạy thì hỏi HLV.

Điểm chặn và ai gỡ:
| Mã | Việc của HLV | Gỡ chặn cho |
|---|---|---|
| H1 | Tạo Supabase project `codequest` (Free), gửi `Project URL`, `anon key`; tự giữ `service_role key` và đặt secret trong dashboard | P2-01, P2-16 |
| H2 | Cài Docker Desktop + bật WSL integration (để `npx supabase start` chạy Supabase local) | P2-01 (cách chạy local), P2-16 (test SQL, `functions serve`) |
| H3 | Tạo repo GitHub, push (cũng gỡ P1-15), bật branch protection | CI thật, P2-16 (job DB test trong CI), P2-18 |
| H4 | Tạo project Vercel nối repo, đặt biến môi trường | P2-18 |
| H5 | Đặt `PAIRING_CODE_PEPPER` (chuỗi ngẫu nhiên ≥ 32 byte) làm secret của Edge Function | P2-16 |

H2 không bắt buộc nếu có H1 + H3: test SQL và function có thể chạy trong GitHub Actions (runner Ubuntu có sẵn Docker). Khi đó máy dev chỉ dùng project Supabase thật.

---

### P2-01 · Spike đăng nhập ghép máy
**Mục tiêu:** kiểm chứng luồng ở `data-sync-auth.md` §5 (ADR-0010) trên Supabase thật trước khi xây Góc huấn luyện viên lên trên.
**Sản phẩm:**
- Script `tools/spikes/pairing/` (chạy bằng `tsx`, chuẩn bị offline từ trước, chỉ cần điền URL + khóa): tạo user học sinh với email nội bộ `<uuid>@students.codequest.invalid` → `generateLink({ type: 'magiclink' })` lấy `hashed_token` → client `verifyOtp({ token_hash, type: 'magiclink' })` → gọi một bảng có RLS bằng phiên đó.
- Kiểm thêm: **2 hồ sơ trên cùng một máy** ghép với 2 học sinh khác nhau (mỗi hồ sơ một `storageKey` riêng của supabase-js), phiên tự làm mới sau khi hết hạn access token, phiên còn sống sau 7 ngày không mở app.
- Kết quả ghi vào ADR-0010: chuyển "Chấp nhận", hoặc viết ADR thay thế nếu luồng không chạy.
- Spike gọi thẳng Admin API, **không** cần P2-03. Ngược lại, thiết kế `pair-device` ở P2-03 là tạm cho tới khi spike xanh; spike đỏ thì P2-03/P2-20 sửa theo ADR mới.

**Nghiệm thu:** script chạy xanh trên project thật (hoặc `supabase start`), log kết quả dán vào PR; ADR-0010 đã cập nhật trạng thái; nếu cần đổi luồng thì `data-sync-auth.md` §5 sửa theo trong cùng PR.

### P2-02 · Migration Supabase
**Mục tiêu:** toàn bộ schema server viết xong và có test, **không cần Docker**.
**Sản phẩm:**
- `supabase/migrations/*.sql` theo `data-sync-auth.md` §3: mọi bảng, khóa, `synced_at` do server đặt (default + trigger), RLS bật trên mọi bảng, policy cho học sinh / huấn luyện viên / ẩn danh, RPC `merge_progress(rows jsonb)` (`SECURITY DEFINER`, `search_path = public`, lấy `student_id` từ `auth.uid()`), trigger `ledger_guard` (mức trần theo `reason`, mẫu `id` theo `rewards-engine.md` §4, `coach-adjust` chỉ HLV), `pairing_codes`, `pairing_attempts`, `unlock_overrides`.
- Đọc chung trong nhóm mà không lộ dòng của bạn khác: RPC `group_members()` (chỉ biệt danh + avatar) và `group_goal_progress()` (chỉ số tổng) cho Góc nhóm (P2-06); `creations` có cột `shared` đọc được trong nhóm.
- Xóa học sinh: `on delete cascade` từ `students` tới mọi bảng con (`security-privacy.md` §4).
- `ledger_guard` nhận khóa mốc chuỗi mới `streak-7:<n>` (P2-04) và kiểm `group-goal:<goalId>` chỉ hợp lệ khi mục tiêu đó đã đạt (tính ở server).
- Test chạy offline: Vitest + **PGlite** (Postgres biên dịch WASM, chạy trong Node), stub schema `auth` với `auth.uid()` đọc `request.jwt.claims`, role `anon`/`authenticated`. Đây là **dependency dev mới** → ADR + dòng trong `tech-stack.md` (luật vàng 10).
- Bản pgTAP tương đương ở `supabase/tests/*.sql` để chạy `supabase test db` ở P2-16.
- Không còn view `v_*` tính chỉ số (quyết định ở P2-05: chỉ số tính bằng hàm TS).
- Tài liệu cập nhật trong cùng PR: `data-sync-auth.md` §3 (bảng RLS thêm `group_members()`, `group_goal_progress()`; giảm thiểu số 2 đổi từ `v_ledger_anomalies` sang hàm TS ở P2-05; ánh xạ `creations.sharedAt` local ↔ `shared`/`shared_at` server) và §6; `rewards-engine.md` §4 nếu đổi mẫu `id`.

**Rủi ro & phương án dự phòng:** việc đầu tiên là thử 1 giờ xem PGlite có chạy được RLS + `SET ROLE` + `SECURITY DEFINER` không. Nếu không: giữ test pgTAP làm nguồn chính (chạy ở P2-16), offline chỉ kiểm cú pháp bằng parser SQL; ghi lại trong ADR.
**Nghiệm thu:**
- Mỗi policy có ít nhất 1 test cho phép và 1 test từ chối: bé A không đọc/ghi được dòng của bé B; ẩn danh không đọc được gì; HLV đọc được mọi dòng trong nhóm mình và không đọc được nhóm khác; học sinh không `update`/`delete` được `ledger`, `badges`, `attempts`; `inventory` chỉ sửa được cột `equipped`; học sinh **không** insert được `unlock_overrides` (chỉ đọc dòng của mình); `group_members()` chỉ trả biệt danh + avatar của nhóm người gọi, trả rỗng cho ẩn danh và nhóm khác.
- `merge_progress`: bỏ qua `student_id` trong payload; test giao hoán + lũy đẳng trên cùng bộ dữ liệu có seed với `mergeProgress` của `@codequest/rewards` (kết quả server = kết quả client).
- `ledger_guard`: **mọi `reason` trong bảng `rewards-engine.md` §4** (gồm `creative:`, `replay:`, `group-goal:` và các dòng tiêu âm `hint-*`, `shop:`, `bonus-level:`) với mọi giá trị `@codequest/rewards` sinh ra được đều qua; dòng vượt mức, sai mẫu `id`, hay `group-goal` khi mục tiêu chưa đạt bị từ chối.
- `npm run test` xanh mà không cần Docker hay mạng.

### P2-03 · Edge Function
**Mục tiêu:** 4 function cho luồng tài khoản học sinh, test được offline.
**Sản phẩm:**
- `supabase/functions/{create-student,pairing-code,pair-device,delete-student}/index.ts` mỏng (chỉ đọc request, gọi logic); logic nằm ở `supabase/functions/_shared/*.ts`, chỉ dùng Web API chuẩn, phụ thuộc (admin client, giờ hiện tại, sinh số ngẫu nhiên) truyền vào nên test được bằng Vitest trên Node.
- `pairing-code`: mã 6 số, hạn 10 phút, dùng một lần, lưu hash có pepper; mỗi lúc một mã cho mỗi học sinh. `pair-device`: giới hạn **toàn cục** 10 lần sai / 10 phút, vượt thì vô hiệu mọi mã đang mở (`security-privacy.md` §3). `create-student`: chỉ HLV gọi được. `delete-student`: xóa dòng `students` (cascade) + `auth.users`.
- Mọi lỗi trả mã lỗi ngắn (`CODE_EXPIRED`, `CODE_USED`, `TOO_MANY_ATTEMPTS`…) để giao diện hiện câu tiếng Việt.

**Nghiệm thu:** test cho mã đúng, sai, hết hạn, đã dùng, quá 10 lần sai (mọi mã bị vô hiệu), người không phải HLV gọi `create-student`/`delete-student`/`pairing-code` bị từ chối; sau `delete-student` không còn dòng nào của bé trong mọi bảng và `auth.users` (phía máy bé: xem P2-04); không có `service_role` hay pepper trong repo (grep trong CI); `.env.example` liệt kê tên biến. Chạy thật bằng `supabase functions serve` để ở P2-16.

> Ghi chú cho P2-04/P2-16 và mục tiêu chung (P2-05): hồ sơ "HLV" trên máy (`role: 'coach'`, bản dev, xem `data-sync-auth.md` §5) bị **loại** khỏi đồng bộ, sao lưu và mọi phép đếm tiến độ của bé.

### P2-04 · Bộ đồng bộ
**Mục tiêu:** đẩy outbox lên và kéo dữ liệu về theo `data-sync-auth.md` §4, viết và test hoàn toàn với server giả.
**Sản phẩm:**
- `apps/web/src/features/sync/`: interface `SyncTransport { push(table, rows), pull(table, cursor) }`; `SupabaseTransport` (mỏng, gọi supabase-js); `FakeTransport` (in-memory, áp cùng luật gộp/idempotent như SQL); nếu PGlite chạy được ở P2-02 thì thêm transport test gọi thẳng SQL của migration (contract test).
- Flush: debounce 3 s, mỗi 30 s khi online, khi tab ẩn; ≤ 100 dòng / bảng / lượt; backoff 5 s → 60 s. Pull: khi mở app, sau ghép máy, mỗi 5 phút; con trỏ là `synced_at` lớn nhất server trả về, lưu theo bảng trong `meta`.
- Ghép máy lần đầu: hồ sơ local được gắn `remoteStudentId`; các dòng đã nằm sẵn trong outbox từ GĐ 1 được đẩy lên tài khoản đó.
- **Lỗi vĩnh viễn** tách khỏi lỗi thử lại được: dòng bị RLS / `ledger_guard` từ chối (vd dòng sổ xu GĐ 1 không qua guard) chuyển sang danh sách "không đồng bộ được" (hiện ở `/coach`), không chặn các dòng khác. Phiên trả 401 vì học sinh đã bị xóa → bỏ ghép hồ sơ đó (giữ dữ liệu local, dừng đẩy), báo ở Cài đặt.
- **Mốc `streak-7`** (`rewards-engine.md`, lưu ý GĐ 2): đổi khóa sang số mốc `streak-7:<n>` trong `@codequest/rewards` (hàm thuần, có test), có bước nâng version Dexie viết lại dòng cũ; cập nhật `rewards-engine.md`.
- Mở khóa thủ công: `unlock_overrides` chỉ **kéo về** (học sinh chỉ đọc); không bao giờ vào outbox.
- Không có `VITE_SUPABASE_URL` → chế độ chỉ local, không có lỗi hay nút đồng bộ (hành vi GĐ 1).
- Trạng thái đồng bộ (lần cuối thành công, số dòng chờ, lỗi gần nhất) đọc được qua hook; **không** hiện cho bé, chỉ hiện ở Góc huấn luyện viên và Cài đặt.

**Nghiệm thu:**
- Test (fake-indexeddb + `FakeTransport` + fake timers): 2 máy cùng một học sinh, chơi offline xen kẽ rồi online theo mọi thứ tự → tiến độ, số dư xu, huy hiệu ở 2 máy và server **giống hệt nhau**; đẩy lại một lô (mạng rớt giữa chừng) không cộng xu 2 lần; server trả lỗi 500 thì backoff đúng nhịp và không mất dòng.
- Một dòng bị từ chối vĩnh viễn trong lô 100 dòng: 99 dòng kia vẫn lên, lô sau vẫn đồng bộ, dòng lỗi nằm trong danh sách lỗi.
- 2 máy offline cùng chạm mốc chuỗi 7 ngày vào 2 ngày khác nhau → sau khi gộp có **đúng 1** dòng thưởng cho mốc đó.
- Bé đang chơi khi đồng bộ lỗi: không có hộp thoại, không giật khung hình (e2e với transport giả trả lỗi).
- Xu âm khi 2 máy cùng tiêu offline: xử lý theo câu trả lời câu hỏi B7 trong `coach-questions.md`; nếu chưa có thì UI hiện `max(0, số dư)` như hiện tại và có test.

### P2-05 · Góc huấn luyện viên
**Mục tiêu:** HLV biết từng bé yếu ở đâu, **dùng được ngay cả trước khi có Supabase**.
**Sản phẩm:**
- Route `/coach` sau khóa người lớn (phép nhân 2 chữ số, `screens-and-flows.md`); khi có Supabase thì thêm đăng nhập HLV.
- Chỉ số tính bằng **hàm thuần TS** `apps/web/src/features/coach/metrics.ts` trên dòng thô (`progress`, `attempts`, `ledger`), dùng chung cho mọi nguồn dữ liệu: bảng 6 bé × thế giới (số màn xong, tổng sao, lần học gần nhất), khái niệm yếu (tỷ lệ thua theo reasonCode, gom theo thế giới/khái niệm), màn hay kẹt (chỉ số ở `rewards-economy.md` §6), thời gian học theo tuần, bé lâu không học (≥ 3 ngày), số dư xu bất thường (thay `v_ledger_anomalies`).
- Nguồn dữ liệu `CoachDataSource`: **local** (mọi hồ sơ trên máy này) + **file sao lưu** (HLV mở 1–6 file `.json` của các bé, chỉ đọc trong bộ nhớ, không gộp vào DB của máy HLV); **Supabase** thêm ở P2-16.
- Mở khóa thủ công: bảng `unlockOverrides` **chỉ ở máy** (nâng version Dexie, không vào outbox) để HLV mở khóa ngay trên máy bé trong buổi học; khi có Supabase, override do HLV ghi lên server và máy bé kéo về (P2-04). `isUnlocked` của `@codequest/rewards` nhận thêm danh sách override (hàm thuần, có test).
- Giao diện tài khoản (tạo học sinh, Ghép máy, xóa học sinh, đăng nhập HLV) làm ở P2-20 với client giả; nối thật ở P2-16.

**Nghiệm thu:** unit test cho mọi hàm trong `metrics.ts` với dữ liệu mẫu có đáp số tính tay; e2e: mở `/coach` qua khóa người lớn → mở 2 file sao lưu mẫu → bảng hiện đúng 2 bé, đúng số sao; mở khóa thủ công một thế giới cho một hồ sơ → hồ sơ đó vào được thế giới; bé không vào được `/coach` khi chưa qua khóa. Ảnh chụp màn hình trong PR.

### P2-06 · Góc nhóm
**Mục tiêu:** hợp tác hơn cạnh tranh (`vision.md` nguyên tắc 6): mục tiêu chung của nhóm và tường tác phẩm, **không** có bảng xếp hạng.
**Sản phẩm:** route `/group` (3 trạng thái: chưa có mục tiêu · đang chạy · đã đạt); HLV đặt mục tiêu (vd "cả nhóm 150 sao trong tuần") trong `/coach`; thanh tiến độ chỉ dùng số tổng từ `group_goal_progress()`; **thưởng mục tiêu nhóm** (`rewards-economy.md` §5: +20 xu mỗi bé + nhãn dán nhóm) bằng hàm thuần `groupGoalReward` trong `@codequest/rewards`, dòng `group-goal:<goalId>` do máy bé ghi sau khi pull thấy mục tiêu đã đạt (server kiểm lại bằng `ledger_guard`); nút **Khoe với nhóm** ở màn sáng tạo (bỏ chữ "có ở GĐ 2" của P1-06) đặt `creations.shared`; tường tác phẩm phát lại tác phẩm ở chế độ chỉ xem, ghi biệt danh + avatar. Không có Supabase → mục `/group` ẩn khỏi bản đồ.
**Nghiệm thu:** test RLS (ở P2-02) cho thấy bé chỉ đọc được số tổng và tác phẩm đã khoe; unit test `groupGoalReward` (đạt / chưa đạt / nhận 2 lần chỉ cộng 1 lần); e2e với transport giả: khoe tác phẩm → xuất hiện trên tường của máy thứ hai sau lần pull; giao diện không có thứ hạng hay so sánh giữa các bé; câu chữ theo `ui-copy-guide.md`.

### P2-07 · Level editor v0
**Mục tiêu:** HLV soạn màn mới nhanh (`vision.md` mục tiêu 4: 10 màn/giờ), mọi lỗi được báo ngay khi soạn.
**Sản phẩm:**
- Route `/coach/editor` (sau khóa người lớn). Thư mục rỗng `tools/level-editor/` thay bằng README trỏ tới route này; cập nhật `overview.md` §2.
- Vẽ bản đồ: runner (dải ô, bấm để đổi `ground → hole → branch → crate`, đặt măng, cờ luôn ở cuối), maze (lưới, chọn kích thước 3–12, cọ tường/đường/măng/S/G, hướng xuất phát).
- Thông tin màn: `id`, `title`, `objective` (đếm chữ trực tiếp), `stage`, `mode`, `par`, `maxBlocks`, `parEdits`, `misconception`, `thinkingHint`, gợi ý tầng 0 tối thiểu; toolbox chọn bằng ô tick.
- Ghép lời giải trên Blockly; với `parsons`/`bughunt`/`predict` thêm workspace ban đầu; `predict` sinh khóa đáp án bằng cách chạy và cho nhập nhãn 3–4 thẻ.
- Kiểm chứng **trực tiếp** bằng `@codequest/validator` (P2-15): mọi luật cấp màn (1, 2, 5, 6, 9–16) hiện ngay cạnh trường bị lỗi; nút "Tìm `par` nhỏ nhất" gọi vét cạn trong **Web Worker** (có nút hủy) để editor không bị đơ.
- **Thử chơi** mở màn chơi thật với bản nháp. Bản nháp lưu trong IndexedDB (bảng chỉ ở máy).
- Xuất: tải file `.json`, sao chép; mở lại một màn có sẵn để sửa. Riêng `npm run dev`: nút "Lưu vào `content/`" ghi file qua một middleware **chỉ có ở dev server** (không có trong bản build).
- v0 chưa có: soạn bài giảng, sắp xếp thứ tự trong `world.json`, màn nhiều bản đồ (P2-12 thêm sau nếu kịp).

**Nghiệm thu:** e2e: tạo một màn runner `build` từ đầu → kiểm chứng xanh → thử chơi thắng → xuất JSON; file xuất đặt vào `content/worlds/_sandbox/` qua `content:check` không lỗi; tương tự một màn maze `bughunt`. Middleware ghi file không có trong `dist/` (test kiểm bundle). HLV tự soạn ≥ 5 màn trong 30 phút và ghi nhận xét vào PR (HLV làm, AI không tự đánh dấu).

**Kết quả (03/10/2026, phần AI xong; chờ HLV soạn thử ≥ 5 màn):**
- Route `/coach/editor` **chỉ có trong bản dev** (`npm run dev`) cho tới khi P2-16 thêm đăng nhập HLV: khóa phép nhân (`screens/coach/AdultGate.tsx`, vẫn giữ trong dev) bé 8–11 tuổi giải được mà editor lại hiện lời giải (quyết định sau review). Không cần hồ sơ bé; logic thuần ở `apps/web/src/features/editor/` (có unit test), màn hình ở `screens/coach/`. `tools/level-editor/` chỉ còn README trỏ tới đây.
- Đủ các phần: vẽ runner (dải 3–40 ô, công cụ đổi ô / đặt măng / chỗ xuất phát, cờ cố định ở cuối) và maze (3–12 × 3–12, cọ tường/đường/măng/S/G, kéo chuột để tô, hướng xuất phát); "phải nhặt hết măng"; thông tin màn với đếm chữ trực tiếp; toolbox bằng ô tick, nhãn tiếng Việt như bé thấy và mã khối nhỏ bên cạnh (giữ nguyên mục `{type, fields}` của màn mở lại); số ô / số hàng / số cột áp dụng khi Enter hoặc rời ô (không đổi theo từng phím); `par`/`maxBlocks`/`parEdits`; thẻ đoán 3–4 thẻ với khóa đáp án chạy ra từ chương trình ban đầu; gợi ý tầng 0 (`when` nhập dạng JSON, kiểm bằng `ConditionSchema`); lời giải và chương trình ban đầu ghép trên Blockly (mọi khối của kiểu game, không giới hạn khối; luật 11 báo khối ngoài toolbox), "Chép từ lời giải", "Tách lời giải thành khối rời" cho parsons. Mode `creative` dùng cùng trình vẽ bản đồ (đường chạy / mê cung tự vẽ), không cần lời giải.
- Kiểm chứng trực tiếp bằng `validateDraft` → `validateLevel` (thế giới `_*` là nháp, đúng như `content:check`); lỗi hiện cạnh trường (`issueField` ánh xạ luật → trường) và trong bảng tổng. Thông báo luật giữ nguyên tiếng Anh của validator (người đọc là HLV).
- "Tìm par nhỏ nhất" trong Web Worker (`parSearch.worker.ts`) với `WORKER_MAX_WORK` + giới hạn 60 giây qua `shouldStop`; **Hủy** = `worker.terminate()` (vét cạn đồng bộ nên worker không đọc được tin hủy). Tìm tới `maxBlocks` (hoặc `max(par, 10)` khối) và sửa tới `max(parEdits, 2)` lần; kết luận ✔/⚠/✖ theo đúng quy tắc của `npm run par` (thêm "par / parEdits quá thấp"); ví dụ trùng nhau chỉ hiện một lần; nút "Dùng làm lời giải", "Đặt par = N", "Đặt parEdits = N".
- **Thử chơi** là bảng xem trước trong editor: sân chơi PixiJS thật (`StageController`) + vùng ghép đúng mode/toolbox/`maxBlocks` của màn, không có hồ sơ, xu, gợi ý (để không ghi tiến độ của bé khi HLV thử). Không mở `/play/:id` với bản nháp.
- Bản nháp tự lưu vào bảng IndexedDB mới `levelDrafts` (Dexie version 2, chỉ ở máy, không vào outbox hay file sao lưu; `data-sync-auth.md` §2), chỉ khi HLV thật sự sửa (mở hay tạo màn không sinh bản nháp rác). Mở lại: màn có sẵn trong `content/`, bản nháp đã lưu, hoặc file `.json` (nút "Chọn file .json"); trường lạ trong file được báo là bị bỏ. Mở một màn giữ nguyên `id` khối hợp lệ (gợi ý `block:`/tô sáng vẫn đúng).
- Xuất: tải `<id>.json` hoặc sao chép JSON (chỉ giữ trường mode dùng, khóa theo thứ tự file nội dung). Vùng ghép của editor tắt khối rời (`disableOrphans`); dấu tắt (`enabled`, `disabledReasons`) bị bỏ khi lưu, và schema nội dung (luật 1) giờ từ chối khối bị tắt, vì màn `parsons` có khối tắt thì bé không bao giờ thắng (lỗi do review phát hiện; fixture `tools/content-check/fixtures/extra-01-disabled-block/`). **Không có** nút "Lưu vào `content/`" / middleware dev ghi file: theo chỉ đạo của luồng điều phối, trình duyệt không ghi vào `content/`, nên phần nghiệm thu "middleware không có trong `dist/`" không áp dụng.
- Chưa có (v0): soạn bài giảng, thứ tự trong `world.json`, `feedback`/`limits`/`maxInstances` (giữ nguyên nếu màn mở lại có sẵn, chưa có ô sửa). Màn nhiều bản đồ: P2-12 đã thêm vào editor (xem kết quả P2-12).
- e2e `apps/web/e2e/coach-editor.spec.ts` (1280×720 và 1366×768): runner `build` từ đầu (lỗi luật 1/9 hiện → vẽ hố, tick `nhảy` → vét cạn ra 3 khối → dùng ví dụ + đặt par → hết lỗi → thử chơi thắng → tải file → `content:check --dir` trên bản sao `content/` có file trong `_sandbox/levels/` xanh); maze `bughunt` (dời đích, chương trình ban đầu chép từ lời giải bị luật 14 báo, sửa thành thua 1 bước → vét cạn sửa 1 lần = `parEdits` → thử chơi thắng → xuất → `content:check` xanh); runner `parsons` (tách lời giải thành khối rời, xê dịch một khối trong editor, sang Thử chơi ráp các khối rời dưới "khi bắt đầu" → không khối nào bị tắt → thắng → file xuất không có `disabledReasons` → `content:check` xanh; test này đỏ khi bỏ phần xóa dấu tắt); hủy một lần vét cạn dài. Bản build (`vite build`) không còn chunk của editor hay worker vét cạn.

### P2-08 · Nội dung Thế giới 3 · Xưởng Sửa Lỗi
Theo bảng ở `curriculum.md` (mục Thế giới 3 do P2-10 viết). `world.json`, `w03-lesson`, 15 màn + `w03-creative`, hoạt động unplugged. Chỉ dùng khối đã có (tuần tự + lặp), nặng về `bughunt`, `predict` và chạy từng bước.
**Quy trình** (như W1–W2): AI soạn nháp → vét cạn `par` cho mọi màn build/bughunt (P2-15) → review sư phạm bằng agent riêng (critic) theo `content-authoring.md` → sửa → HLV chơi thử.
**Nghiệm thu:** `content:check` xanh, không cảnh báo luật 4/7/8; `npm run par -- --world w03` không tìm thấy lời giải ít khối hơn `par`; mỗi mode `build`, `parsons`, `predict`, `bughunt` xuất hiện ≥ 1 lần; review sư phạm đã xử lý hết (ghi trong PR); `w03-xuong-sua-loi` không nằm trong `PROVISIONAL_WORLDS`; e2e smoke mở được `w03-l01`; khi đã có giọng đọc (P1-14): `npm run voice -- check --worlds w03` sạch. **HLV chơi thử từng màn** trước khi merge.
**Trạng thái (04/10/2026):** 🟨 đã soạn nháp `world.json`, `w03-lesson`, 15 màn + `w03-creative`; `content:check` xanh không cảnh báo; `npm run par -- --world w03` ✔ mọi màn trừ ⚠ `w03-boss` (vét cạn sửa 3 thao tác dừng ở trần bộ nhớ/ngân sách; vét cạn riêng ≤ 3 thao tác không có cách thắng, `curriculum.md` §5.1 "Ghi chú khi soạn"); test `tools/content-check/src/w03.test.ts` (mỗi lần sửa lộ lỗi tiếp theo). Review sư phạm độc lập đã xử lý (04/10): sửa câu chữ, điểm chỉ gợi ý, bài giảng thẻ 3–4; thêm luật `content:check` (6: màn guided ≥ 2 gợi ý tầng 0; 16: `block:<type>` chỉ đúng một khối ở predict/bughunt) và trần bộ nhớ cho vét cạn sửa lỗi. Điểm chỉ `step` xong (05/10, `w03-l02`). Còn: e2e smoke `w03-l01`, **HLV chơi thử**.

### P2-09 · PWA offline
**Mục tiêu:** bé mở app và chơi được khi mất mạng, kể cả tải lại trang.
**Sản phẩm:**
- `vite-plugin-pwa` (đã có trong `tech-stack.md`): precache app shell, JS/CSS, font, `blockly-media`, sprite, nhạc nền + hiệu ứng; giọng đọc cache khi dùng (runtime cache) để bản đầu không quá nặng. Ghi ngân sách dung lượng precache vào `deployment-ops.md`.
- Manifest tiếng Việt, icon Măng pixel; `navigator.storage.persist()` khi tạo hồ sơ đầu tiên để trình duyệt không tự xóa IndexedDB.
- Cập nhật kiểu **hỏi trước** (`registerType: 'prompt'`): chỉ báo "Có bản mới" ở bản đồ / Cài đặt, **không bao giờ** tải lại giữa màn chơi.
- Service worker tắt ở `npm run dev`; e2e PWA chạy trên `vite preview`. CSP giữ `worker-src 'self' blob:` như `security-privacy.md` §3; sửa tham chiếu "task P2-09" ở đó thành P2-18.
- Test CSP tự động: e2e trên `vite preview` gửi đúng header CSP của production, **đỏ** khi có sự kiện `securitypolicyviolation` trên luồng chính.

**Nghiệm thu:** e2e: mở app → tắt mạng (`context.setOffline(true)`) → tải lại → vào màn, chạy thắng, tiến độ được lưu; có bản build mới khi đang ở màn chơi thì không bị tải lại; manifest hợp lệ (tên, icon 192/512, `start_url`, `display`) và `navigator.serviceWorker.controller` có sau khi tải lại (Playwright); test CSP xanh; dung lượng precache ghi trong PR và nằm trong ngân sách.

### P2-10 · Chi tiết hóa chương trình học Thế giới 3–5
**Mục tiêu:** có bảng màn chi tiết cho W3–5 như `curriculum.md` §3/§4 để HLV duyệt trước khi soạn nội dung, và chốt các tính năng kỹ thuật mà nội dung cần.
**Sản phẩm:**
- `curriculum.md`: 3 mục mới cho Thế giới 3, 4, 5 (câu chuyện, bé làm được gì, ngộ nhận nhắm tới, unplugged, bảng màn đủ cột `# / ID / Chặng / Kind / Mode / Ý chính / Khối / maxBlocks / par / parEdits`, dàn ý bài giảng 3–6 thẻ). Mục "Thế giới 3–10 (khung)" chỉ còn 6–10. Cập nhật mọi tham chiếu số mục (grep `curriculum.md`).
- Danh sách tính năng cần cho P2-11/P2-12, mỗi mục ghi màn nào cần, ví dụ: hình dạng khối "nếu" / "nếu–không" trong toolbox, "lặp đến khi" + điều kiện nào (`đã tới đích?`, `có đường…?`, `phía trước có…?`), runner có cần cảm biến `đã tới cờ?` không, màn nhiều bản đồ cho W4 (boss "một chương trình thắng 3 bản đồ") và W5 ("qua sông không biết trước độ dài"), gợi ý chỉ vào nút Từng bước cho W3.
- Ghi rõ phụ thuộc vào câu trả lời của HLV: A1 (thắng ngay khi chạm đích) ảnh hưởng thiết kế "lặp đến khi"; A5 (maze `đã tới đích?` khi còn măng).

**Nghiệm thu:** mỗi thế giới đủ số màn (15/20/20) và mỗi bảng tuân §7 của `curriculum.md` (khối mới chỉ ở guided/practice, không quá 3 màn build liền, mỗi mode ≥ 1 lần, `par ≤ maxBlocks ≤ par + 2`); đã qua review sư phạm bằng agent riêng; **HLV duyệt** (ghi "Đã duyệt dd/mm" vào đầu mỗi mục).

### P2-11 · Khối điều kiện, lặp đến khi, cảm biến sáng khi kiểm
**Mục tiêu:** engine, Blockly, gợi ý và validator hỗ trợ đủ khối của W4–W5; bé **thấy** điều kiện được kiểm mỗi lần chạy qua (ngộ nhận W4: "nếu là kiểm tra một lần").
**Sản phẩm:**
- Khối `nếu`, `nếu … nếu không` (`controls_if`) và `lặp đến khi` (`controls_whileUntil`, khóa ở chế độ UNTIL) dùng được trong toolbox **không cần mutator** (bé không phải bấm bánh răng): thêm `extraState` vào `ToolboxEntrySchema` hoặc khối riêng `cq_if_else`, chọn một và ghi lý do ở `blockly-integration.md`. Nhãn tiếng Việt trong `messages.ts`.
- Khối cảm biến `runner_is_ahead`, `maze_is_path`, `maze_at_goal` (đã có ở `games`) hiển thị và chạy đúng trong `nếu`/`lặp đến khi`; thêm cảm biến runner nếu P2-10 cần.
- Event `sense{blockId, value}` khi cảm biến được đọc → sân chơi hiện ✔/✘ nhỏ và khối điều kiện sáng lên. Cập nhật `game-kind-sdk.md` (hiện ghi cảm biến không emit event).
- `TIMEOUT` (lặp vô hạn): phát lại tối đa vài giây rồi dừng với hoạt ảnh "chóng mặt"; gợi ý tầng 0 riêng cho lặp vô hạn.
- `analyzeWorkspace`, `editDistance`, hint `matches` và vét cạn `par` (P2-15) đúng với khối lồng trong nhánh `DO`/`ELSE`.
- Nếu P2-10 cần: điểm chỉ gợi ý `ui:step` (chỉ vào nút Từng bước) cho W3.
  - ~~TODO: gợi ý `step` của `w03-l02` đang tạm `point: "run"`~~ xong 05/10/2026: `point: "step"`, ghi ở `curriculum.md` §5.1 "Ghi chú khi soạn".

**Nghiệm thu:** unit test: mỗi khối mới có generator test + `runLevel` thắng/thua; vòng `lặp đến khi` không bao giờ đúng → `TIMEOUT`, **tất định** (2 lần chạy cùng event log); `editDistance` trên ví dụ có nhánh nếu–không; validator bắt shadow trong khối điều kiện ở màn có `maxBlocks` (luật 12). E2E: kéo `nếu` + cảm biến vào màn mẫu ở `_sandbox`, chạy thấy khối cảm biến sáng ✔/✘ đúng số lần; màn lặp vô hạn hiện câu `TIMEOUT` và không treo trình duyệt. Coverage `engine` ≥ 90%, `games` ≥ 85% giữ nguyên.
**Tiến độ 04/10/2026 — phần headless P2-11a + P2-11b xong** (ADR-0018), chưa commit:
- Khối `cq_if`, `cq_if_else`, `cq_repeat_until` (engine, input `COND`, không mutator, tooltip theo luật giới thiệu khối) và cảm biến runner `runner_at_goal`; tooltip cảm biến nói rõ ✔/✘ khi nào. Ô điều kiện trống → `error` / `EMPTY_CONDITION` (mã engine mới, có câu trong `feedback.json` và mọi fixture).
- Event `sense{blockId, value}` qua `ctx.sense`, **tính vào `maxActions`**: vòng lặp chỉ hỏi dừng `TIMEOUT` tất định sau 1 000 câu hỏi; khóa đoán `timeout` (T9) đã có sẵn.
- Schema: `maxLoopDepth`, điểm gợi ý `step`. Luật 20 (`maxLoopDepth`, `maxInstances` trên `solution`/`initialWorkspace`) + fixture `rule-20-block-limits/`. Engine export `loopDepth`, `blockTypeCounts`.
- Vét cạn hiểu khối điều kiện, `maxInstances`, `maxLoopDepth`, cả tìm cách sửa; tái lập số §5.5 (W4 `l02` 28 cách, `l16` 75 / 8, W5 `l09` đúng 1, `l14`, `l17`, boss) trong `packages/validator/src/search/conditions.test.ts`. `npm run par -- --world w01|w02|w03` giống từng ký tự trước thay đổi.
- ~~**Còn (web, task sau):**~~ (xong 05/10, xem "Tiến độ phần web" bên dưới) thanh khối/Blockly của màn chơi và editor (`toolboxChoices` chưa có `cq_if`…), `Replay` xử lý `sense` (khối sáng ✔/✘), phát lại `TIMEOUT` + hoạt ảnh chóng mặt (cả thẻ `demo`), mũi tên `step` (rồi mới đổi `w03-l02` sang `point: "step"`, TODO ở trên), chặn thả khối theo `maxLoopDepth`, khóa cache vét cạn của editor tính `maxInstances`/`maxLoopDepth`, e2e. W4 `l17` / boss đã tái lập ở đợt P2-11c dưới đây.

**Tiến độ 05/10/2026 — phần headless của P2-11c `rescue` / `escort` xong** (ADR-0019), chưa commit:
- `config.goal.items: { kind: 'key' | 'friend', at }[]` cho runner (`at` số ô) và maze (`at` `[r, c]`), khai báo theo từng bản đồ. Luật đúng `curriculum.md` T17b: phải **đứng ở** ô vật phẩm (nhảy qua không tính), thứ tự tùy ý. Runner tới cờ mà thiếu → `missed{at, left, item}` + `incomplete` / `NEED_KEY` hoặc `NEED_FRIEND`; maze đi xuyên `G` như `collectAll`, hết chương trình ở `G` mà thiếu → `NEED_*`, ở chỗ khác → `NOT_AT_GOAL`. Vật phẩm xét trước măng. Khóa đoán `missed@<ô>`.
- Event nhặt: `collect{at, item}` (dùng lại `collect`/`missed` với trường `item` tùy chọn, để web hiện tại vẫn biên dịch và diễn tạm như nhặt măng; ADR-0019).
- Câu cho bé trong `feedback.json` (và mọi fixture trừ fixture luật 17): `NEED_KEY` "Cần chìa khóa trước!", `NEED_FRIEND` "Chưa đón bạn kìa!".
- Luật 1 (configSchema) kiểm chỗ đặt: runner ô `ground`/`branch` sau `start`, không trùng nhau / trùng măng; maze ô `.`, không trùng nhau. Test ở `games` và `validateLevel.test.ts` (luật 1, 9).
- Vét cạn không đổi code: vật phẩm còn lại nằm trong trạng thái nên gộp trạng thái vẫn đúng. Tái lập (`conditions.test.ts`): W4 `l17` nhỏ nhất 5 (24 cách, đều hỏi), W4 boss không có ≤ 7, nhỏ nhất 8 (68 cách; bỏ chìa khóa 429 cách, "hỏi bên phải trước" thắng), W5 boss với Gà con 6 (6 cách). `npm run par -- --world w01 --world w02 --world w03` giống từng ký tự trước thay đổi.
- ~~Chặn merge nội dung~~ **gỡ 05/10/2026**: web đã vẽ vật phẩm đúng (HUD mê cung không đếm vật phẩm vào măng, đích khóa / lồng đóng tới khi đủ, `NEED_*` nhấp nháy); xem "Tiến độ phần web" bên dưới.
- ~~**Còn (web):**~~ (xong 05/10) sprite chìa khóa, lồng đóng/mở, bạn đi theo Măng (T17c); `RunnerStage`/`MazeStage` phân biệt `collect.item` và `missed.item` (đang diễn như măng); HUD mê cung không đếm vật phẩm vào măng; gợi ý tầng 0 `lastReason: NEED_KEY / NEED_FRIEND`; giọng đọc `feedback.NEED_KEY`, `feedback.NEED_FRIEND`; e2e.

**Tiến độ phần web P2-11a + P2-11c (05/10/2026)**, chưa commit:
- Blockly: `cq_if`, `cq_if_else`, `cq_repeat_until`, `runner_at_goal` trong thanh khối màn chơi (nhóm "ĐIỀU KIỆN", "LẶP", "CÂU HỎI"); ô câu hỏi trống nền sáng viền nét đứt; bộ chặn thả khối `maxLoopDepth` / `maxInstances` (`blockly/blockLimits.ts`: hoàn tác cả thao tác + câu của Măng); `EMPTY_CONDITION` rung khối có ô trống (`blockly-integration.md` §5–§7).
- Phát lại: `sense` → khối hỏi sáng ✔/✘ (`blockly/senseMark.ts`), theo tốc độ, từng bước dừng trước mỗi câu hỏi; `TIMEOUT` phát ~3 s (G13) rồi Măng chóng mặt (`dizzy`), cả trong thẻ `demo` (`stage-rendering.md` §1).
- Mũi tên gợi ý `step` (nút Từng bước); `w03-l02` đổi sang `point: "step"`.
- Vật phẩm: chìa khóa, bạn (Gà con), lồng đóng/mở, đích khóa, bảng vật phẩm, bạn đi theo, `NEED_*` nhấp nháy trên runner, maze, dải cả đường, "Xem cả đường", thẻ đáp án (`stage-rendering.md` §4 "Vật phẩm nhiệm vụ").
- Level editor: thanh khối có `cq_repeat_until`, `cq_if`, `cq_if_else`; ô `maxLoopDepth`, ô "tối đa" (`maxInstances`) cạnh mỗi khối được tick; công cụ "Đặt chìa khóa / Đặt bạn" (runner) và cọ "Chìa khóa / Bạn" (maze); bật/tắt "nhặt hết măng" giữ vật phẩm; `maxLoopDepth` không còn bị coi là khóa lạ khi mở file; khóa cache vét cạn tính `maxInstances`/`maxLoopDepth`, worker dùng `WORKER_MAX_CATALOG_ENTRIES`.
- Màn mẫu `_sandbox/runner-until` (lặp đến khi, `maxLoopDepth: 1`, gợi ý `step`); e2e `apps/web/e2e/play-conditions.spec.ts` (ghép `w04-l02` bằng chuột + câu hỏi sáng, từng bước, `TIMEOUT`, `EMPTY_CONDITION`, chặn lặp trong lặp, chìa khóa `w04-l17`, `w04-boss` thiếu chìa khóa rồi mở lồng, các bài "Khối mới" W4).
- Phát hiện cho HLV: ở `w04-l17` (tối đa 5 khối) không tìm được chương trình nào tới cờ mà bỏ sót chìa khóa (thử mọi dạng `lặp n { nếu … }` / `lặp n { nếu … nếu không … }` cỡ ≤ 5), nên gợi ý `lastReason: NEED_KEY` của màn này gần như không bao giờ hiện; bài `w04-lesson-chia-khoa` (thẻ 2) và `w04-boss` thì có `NEED_KEY`.
- Còn: giọng đọc `feedback.NEED_KEY` / `NEED_FRIEND` (chưa có file giọng), **HLV chơi thử W4**.

### P2-12 · Màn nhiều bản đồ
**Mục tiêu:** ép bé viết chương trình **tổng quát** (dùng cảm biến) thay vì ghép thuộc lòng một đường cố định.
**Sản phẩm:**
- ADR mới + `content-model.md`: trường tùy chọn `variants` (1–2 config bổ sung, cùng `kind`) trong level. Màn thắng khi chương trình thắng **mọi** bản đồ; kết quả thua lấy bản đồ đầu tiên thua.
- `runLevel` chạy lần lượt mọi bản đồ (vẫn tất định); `RunOutcome` có kết quả từng bản đồ. Rewards không đổi (một lượt thắng = một lượt thắng).
- Giao diện: thẻ "Bản đồ 1 · 2 · 3" phía trên sân chơi; Chạy phát lần lượt từng bản đồ, bản đồ thua được chọn và giữ lại để bé xem.
- `content:check`: luật 9–10 chạy mọi bản đồ; `predict` và `parsons` không được có `variants` (schema chặn); `tools/content-check/fixtures/` thêm fixture sai.

**Nghiệm thu:** unit test: thắng 2/3 bản đồ = thua với reason của bản đồ thua; snapshot event log từng bản đồ; fixture sai bị bắt; e2e: màn mẫu 3 bản đồ ở `_sandbox`, chương trình chỉ đúng bản đồ 1 thì thua ở bản đồ 2 và thẻ bản đồ 2 được chọn.

**Kết quả (03/10/2026):** ADR-0016.
- Schema: `variants` 1–2 config (`MAX_VARIANTS`), chỉ `build`/`bughunt` (schema chặn `parsons`, `predict`, `creative`). Engine: biên dịch một lần, chạy từng bản đồ như một màn riêng (state, `rng`, giới hạn riêng); `RunOutcome.maps` + `mapIndex` (bản đồ đầu tiên không thắng, hoặc bản đồ cuối); cấp trên là của bản đồ quyết định, nên rewards, gợi ý, khối bị lắc không đổi. Màn một bản đồ cho kết quả y hệt trước (snapshot cũ giữ nguyên).
- Kiểm chứng: luật 1 kiểm config mọi bản đồ (`variants.<i>.…`), luật 9 ghi `on map N`, luật 14 hiểu "thua ít nhất một bản đồ"; bảng ✔ thêm `maps N`. Fixture `extra-02-variant-loses` (luật 9), `extra-03-variants-in-predict` (luật 1). Vét cạn `par`/`parEdits` (`FastSim`) tìm trên bộ trạng thái của mọi bản đồ: chỉ chương trình thắng mọi bản đồ được tính; màn một bản đồ không thêm tầng nào, `npm run par -- --world w01` / `w02` cho kết quả như trước.
- Màn chơi: thẻ "Bản đồ 1 · 2 · 3" (`screens/play/MapTabs.tsx`) trên sân chơi; xem từng bản đồ trước khi chạy; Chạy phát lần lượt từ bản đồ 1 (`StageController.showMap` đổi cảnh trong cùng app PIXI, giữ tốc độ, Măng nói "Sang bản đồ N nào!"), dừng ở bản đồ đầu tiên thua, thẻ đó được chọn và giữ lại; ✔/✖ trên thẻ đã chạy và dòng "Chưa qua bản đồ N. Sửa rồi chạy lại nhé!" / "Qua cả N bản đồ!".
- Level editor: mở/xuất `variants` không mất (khóa ngay sau `config`, chỉ giữ khi mode là build/bughunt), thẻ bản đồ trong phần "Bản đồ", thêm bản đồ (chép bản đồ đang xem, tối đa 3) và xóa; lỗi `variants.*` hiện cạnh bản đồ; "Thử chơi" có thẻ và phát lần lượt như màn chơi; "Tìm par nhỏ nhất" tìm trên mọi bản đồ.
- Màn mẫu `content/worlds/_sandbox/levels/runner-maps.json` (3 bản đồ, `repeat 3 [walk, jump]`). Chưa có khối `nếu` (P2-11) nên bản đồ mẫu cố ý có chung một đường; màn W4–W5 thật dùng `variants` cùng khối hỏi.
- e2e `apps/web/e2e/play-maps.spec.ts` (thẻ, chương trình chỉ đúng bản đồ 1 → bản đồ 1 ✔, thua ở bản đồ 2, thẻ 2 được chọn, sửa → thắng cả 3) và một test mới trong `coach-editor.spec.ts` (mở màn 3 bản đồ, sửa riêng bản đồ 2, Thử chơi thắng cả 3, xuất đúng `variants`, `content:check` xanh).

### P2-13 · Nội dung Thế giới 4 · Ngã Ba Quyết Định
Theo bảng ở `curriculum.md` (mục Thế giới 4). `world.json`, `w04-lesson` (có thẻ `demo` dùng `nếu` trên 2 bản đồ khác nhau), 20 màn + `w04-creative`, unplugged. Boss: một chương trình thắng 3 bản đồ (P2-12).
**Nghiệm thu:** như P2-08 (thay `w03` bằng `w04`), thêm: mọi màn có `variants` qua `content:check` trên mọi bản đồ; khối `nếu`, cảm biến xuất hiện lần đầu ở màn guided có gợi ý chỉ vào khối (luật 7). **HLV chơi thử từng màn.**
**Trạng thái (05/10/2026):** 🟨 đã soạn nháp `world.json` (unplugged "Lật thẻ trước mỗi bước"), `w04-lesson` + 4 bài "Khối mới" (`w04-lesson-neu`, `w04-lesson-neu-khong`, `w04-lesson-co-duong`, `w04-lesson-chia-khoa`), 20 màn + `w04-creative`; `content:check` xanh không cảnh báo; `npm run par -- --world w04` ✔ mọi màn build/bughunt, `par`/`parEdits` đúng bảng, không phải sửa bản đồ (`curriculum.md` §5.2 "Ghi chú khi soạn (P2-13)"); test `tools/content-check/src/w04.test.ts` (demo, ghép sai, từng bước sửa, R1 "không hỏi thì không thắng", đánh đổi sao `l16` 8 / 5). Review sư phạm độc lập (05/10) đã xử lý: bản đồ `l05`, `l09`, `w04-creative`; gợi ý dạng câu hỏi; bài `w04-lesson-neu-khong`; màn ghép hình phải ghép hết khối (`LOOSE_BLOCKS`, câu G22). Phần web P2-11a / P2-11c xong 05/10 (gỡ chặn merge `w04-l17`, `w04-boss`, `w04-lesson-chia-khoa`; e2e `play-conditions.spec.ts`). Còn: e2e smoke `w04-l01`, **HLV chơi thử**.

### P2-14 · Nội dung Thế giới 5 · Sông Chờ Đợi
Theo bảng ở `curriculum.md` (mục Thế giới 5). `world.json`, `w05-lesson` (thẻ `demo` có một vòng lặp vô hạn để bé thấy "vòng lặp không tự dừng"), 20 màn + `w05-creative`, unplugged. Boss: qua sông không biết trước độ dài (nhiều bản đồ khác độ dài).
**Nghiệm thu:** như P2-13 (thay `w04` bằng `w05`), thêm: ít nhất 1 màn `bughunt` có lỗi lặp vô hạn và 1 màn `predict` hỏi "vòng lặp có dừng không?". **HLV chơi thử từng màn.**
**Trạng thái (05/10/2026):** 🟨 đã soạn nháp `world.json` (cảnh `song`, unplugged "Đi đến khi chạm tường"), `w05-lesson` (thẻ 1 nối truyện W4, thẻ 5 vòng lặp không dừng) + 4 bài "Khối mới" (`w05-lesson-lap-den-khi`, `w05-lesson-toi-dich`, `w05-lesson-toi-noi`, `w05-lesson-don-ban`), 20 màn + `w05-creative`; `content:check` xanh không cảnh báo; `npm run par -- --world w05` ✔ mọi màn build/bughunt (bản đồ `l12`, `l15`, `l18` sửa khi soạn), ghép hình `l02`, `l10` đúng 1 cách, `l16` ⚠ 4 cách tương đương (`curriculum.md` §5.3 "Ghi chú khi soạn (P2-14)"); test `tools/content-check/src/w05.test.ts`. Bughunt lặp không dừng: `l05`, `l12`; predict "vòng lặp có dừng không?": `l07`, `l19`. Review sư phạm độc lập (05/10) đã xử lý, kèm luật engine mới cho ghép hình: mọi khối phải chạy (`UNUSED_BLOCKS`, G22) và `npm run par` kiểm mọi cách ghép (W4 `l14` đổi bản đồ). Còn: e2e smoke, **HLV chơi thử** (cả W4 `l14`).

### P2-15 · Package `@codequest/validator` + công cụ vét cạn `par`
**Mục tiêu:** luật kiểm chứng chạy được **cả trên Node và trong trình duyệt** (editor), và việc kiểm `par` bằng vét cạn (đã làm tay ở W2) thành công cụ dùng lại.
**Sản phẩm:**
- Package headless mới `packages/validator` (phụ thuộc `games`, `engine`, `content-schema`; cấm DOM): chuyển các luật cấp màn từ `tools/content-check` sang; `tools/content-check` chỉ còn đọc file, luật cấp thế giới/chương trình học và in bảng. Cập nhật `overview.md` §2 (bảng package, sơ đồ, luật ESLint), thêm package vào danh sách headless ở `AGENTS.md` §3 luật 1 + ADR.
- `npm run par -- <levelId> | --world <id>`: vét cạn mọi chương trình từ toolbox của màn (số lần lặp 2–20, cho phép lặp lồng, có giới hạn độ sâu / thời gian), báo lời giải ít khối nhất và nó có ít hơn `par` không. Hỗ trợ khối điều kiện khi P2-11 xong.

**Nghiệm thu:** `content:check` cho kết quả **y hệt** trước khi tách (so output trên `content/` và mọi fixture); package mới chạy trong test `environment: 'node'` và qua `no-restricted-globals`; `npm run par -- --world w02` xác nhận lại mọi `par` của W2 (khớp ghi chú ở `curriculum.md` §4) trong < 2 phút.
**Kết quả (03/10/2026):** `content:check` cho output giống từng ký tự trên `content/` và 19 fixture. `npm run par -- --world w02` xác nhận mọi `par` của màn build W2 (và W1) trong 10,9 giây. Phát hiện: `w02-l11` sửa được bằng **1** lần (thêm `đá` vào trong vòng lặp thay vì di chuyển khối), ít hơn `parEdits` 2 — `par` báo ⚠, chờ HLV quyết định giữ hay đổi `parEdits`. Khối điều kiện chưa được vét cạn (chờ P2-11).

### P2-16 · Nối Supabase thật
**Mục tiêu:** mọi thứ đã viết offline chạy được trên Supabase thật.
**Sản phẩm & nghiệm thu:**
- `npx supabase db push` lên project; `supabase test db` (pgTAP) xanh trên `supabase start` hoặc trong GitHub Actions (job riêng, chỉ chạy khi `supabase/**` đổi).
- Deploy 4 Edge Function, đặt secret (H5); `supabase functions serve` + test gọi thật cho mã đúng/sai/hết hạn.
- `SupabaseTransport` chạy bộ test contract của P2-04 với server thật (không chạy trong CI mặc định, chạy bằng `npm run test:supabase`).
- Phần server của P2-05/P2-06/P2-20: thay client giả bằng client thật (đăng nhập HLV, tạo học sinh, ghép máy, trạng thái đồng bộ từng máy, xóa học sinh, mục tiêu nhóm); e2e `@supabase` trên Supabase local: HLV tạo bé → lấy mã → máy bé nhập mã → bé chơi thắng 1 màn → HLV thấy màn đó trong bảng.
- GitHub Action hằng tuần `supabase db dump`, lưu artifact 90 ngày (`deployment-ops.md`); (tùy chọn) ping hằng ngày để project Free không bị tạm dừng.
- `apps/web/.env.example` đầy đủ; không có khóa thật trong repo (grep `service_role` trong CI).

### P2-17 · Hạ tầng của HLV
**AI** viết trước hướng dẫn từng bước trong `deployment-ops.md` (làm ngay, bước 0 của luồng A). Việc **HLV** làm: H1 Supabase project + gửi URL và `anon key`; H2 Docker Desktop + WSL integration; H3 repo GitHub + push + branch protection; H4 project Vercel (root `apps/web`, build `npm run build`, output `dist`); H5 secret `PAIRING_CODE_PEPPER`.
**Nghiệm thu:** `npx supabase status` (nếu có H2) hoặc dashboard project mở được; CI chạy trên GitHub và xanh; Vercel tạo được bản preview cho một PR.

### P2-18 · Deploy production & đưa vào dùng
**Sản phẩm:** production trên Vercel với header CSP đầy đủ (`security-privacy.md` §3, có `connect-src` tới project Supabase); kiểm CSP trên bản preview trước (không lỗi CSP trong console khi đi luồng chính); thư phụ huynh từ mẫu `playbooks/playtest.md` §5 (AI soạn, **HLV gửi**), cập nhật mẫu và `security-privacy.md` §2: từ GĐ 2 **các bạn trong nhóm** thấy biệt danh, avatar và tác phẩm bé đã bấm Khoe (không chỉ HLV); HLV tạo 6 học sinh (biệt danh + avatar, không tên thật) và ghép máy cho từng bé; file sao lưu GĐ 1 của bé (nếu có) được gộp vào tài khoản khi ghép lần đầu.
**Nghiệm thu:** 6 máy đã ghép, mỗi máy đồng bộ thành công ≥ 1 lần (thấy ở Góc huấn luyện viên); PWA cài được từ link production; e2e smoke chạy trên URL production (không có `@supabase`).

### P2-19 · Chơi thử cả nhóm & phát hành `v0.2.0`
Buổi học nhóm theo `playbooks/playtest.md`: 6 bé chơi W3 trên máy riêng, HLV theo dõi ở `/coach` → sửa lỗi chặn → một tuần dùng ở nhà → xem chỉ số màn hay kẹt, chỉnh nội dung → tag `v0.2.0` + `CHANGELOG.md`.
**Nghiệm thu:** đạt nghiệm thu giai đoạn ở đầu file; mọi lệnh "Định nghĩa xong" (`AGENTS.md` §6) xanh trên CI; câu hỏi mở dưới đây đã chốt hoặc chuyển sang GĐ 3.

### P2-20 · Màn Ghép máy của bé + giao diện tài khoản ở Góc HLV
**Mục tiêu:** toàn bộ giao diện tài khoản làm xong offline, P2-16 chỉ còn thay client giả bằng client thật.
**Sản phẩm:**
- Interface `AccountClient` (đăng nhập HLV, `createStudent`, `pairingCode`, `pairDevice`, `deleteStudent`) + `FakeAccountClient` dùng chung logic `_shared` của P2-03.
- Phía bé: từ GĐ 2 hồ sơ do HLV tạo (`screens-and-flows.md` `/profile/new`): khi có Supabase, `/profile/new` thành **Ghép máy** (bàn phím 6 số to → chọn avatar đã có → đặt PIN cục bộ); mã lỗi `CODE_EXPIRED`, `CODE_USED`, `TOO_MANY_ATTEMPTS` hiện câu tiếng Việt ngắn theo `ui-copy-guide.md`. Không có Supabase → giữ luồng tạo hồ sơ GĐ 1.
- Phía HLV (`/coach`): danh sách học sinh, tạo học sinh (biệt danh + avatar, không tên thật), hộp **Ghép máy** hiện mã 6 số + đồng hồ 10 phút, xóa học sinh (hỏi lại 2 lần).
- Máy của bé đã bị xóa ở server: lần đồng bộ tiếp theo bỏ ghép (P2-04); Cài đặt có "Xóa hồ sơ trên máy này" (`security-privacy.md` §4).

**Nghiệm thu:** e2e với `FakeAccountClient`: HLV tạo bé → lấy mã → (trang thứ hai) bé nhập mã → đặt PIN → vào bản đồ; nhập mã sai / hết hạn / quá 10 lần hiện đúng câu; HLV xóa bé → máy bé bỏ ghép ở lần đồng bộ sau. Ảnh chụp màn hình trong PR; câu chữ ≤ 12 chữ.

---

## Câu hỏi mở (HLV quyết định)
1. **Duyệt chương trình W3–5** (P2-10) trước khi AI soạn 55 màn. Đây là điểm chặn lớn nhất của luồng A.
2. **Luật thắng (câu A1) và `đã tới đích?` (câu A5)** trong `coach-questions.md`: cần chốt trước P2-10, vì "lặp đến khi" ở W5 phụ thuộc vào việc Măng thắng ngay khi chạm đích.
3. **Xu âm khi 2 máy cùng tiêu offline (câu B7):** cần chốt trước P2-04.
4. **Màn nhiều bản đồ (P2-12)** là thay đổi mô hình nội dung (ADR). Anh đồng ý dùng cách này cho W4–W5, hay muốn bản đồ ngẫu nhiên có seed?
5. **Góc huấn luyện viên trước Supabase** đọc file sao lưu của các bé. Anh có muốn dùng cách này trong các buổi học nhóm từ giờ tới khi có Supabase không?
6. **PGlite** (Postgres WASM) làm dependency dev để test SQL offline: đồng ý thêm (sẽ có ADR)?
7. **Một máy nhiều bé** (anh chị em dùng chung): mỗi hồ sơ ghép với một học sinh riêng (spike P2-01 kiểm), hay một máy chỉ ghép một bé?
8. **Giao diện Thế giới 3–5:** dùng lại tileset Làng Tre đổi màu, hay cần tileset riêng (xưởng, ngã ba, bờ sông)? Tileset mới làm chậm P2-08/13/14 (`playbooks/add-asset.md`).
9. **Giọng đọc W3–5** phụ thuộc lựa chọn dịch vụ TTS ở P1-14 (câu E2).
10. **Đổi chỗ GĐ 2 và GĐ 3** (`master-plan.md` §9, cảnh báo về thời gian thi AIROC): giữ thứ tự hiện tại?

### P2-21 · Sao theo mục tiêu màn (góp ý HLV 03/10/2026)
**Vấn đề:** Thế giới 1 chủ yếu là đường thẳng, đi hết đường là nhặt đủ đồ và dễ có 3 sao. HLV muốn từ các thế giới sau, mỗi màn có **nhiều cách giải**, và **cách tối ưu nhất mới được nhiều sao nhất**, để bé phải suy nghĩ thêm.

**Đã duyệt 03/10/2026** (luật ghi ở `rewards-economy.md` §1):
- Mỗi màn (build/bughunt) có thể khai báo thêm **mục tiêu sao** `starGoals` trong JSON, hiện thành thẻ "Mục tiêu ⭐" trước khi chơi để bé biết đang được chấm gì. Ví dụ: nhặt đủ măng; về đích với ≤ N bước đi; không đá thùng nào; dùng ≤ `par` khối.
- Bản đồ có **ngã rẽ thật**: đường ngắn thì bỏ sót măng, đường vòng thì nhặt được nhưng cần chương trình khéo hơn. Bé tự chọn đánh đổi.
- Luật sao vẫn là **hàm thuần** trong `packages/rewards`, có unit test; trần sao do gợi ý giữ nguyên. Màn không khai báo `starGoals` vẫn dùng luật cũ, nên Thế giới 1–2 không đổi.
- `npm run par` tính **tối ưu theo từng mục tiêu** (ít khối nhất mà vẫn nhặt đủ măng…), để mức 3 sao luôn đạt được và không có lối tắt rẻ hơn.

**Nghiệm thu:** schema `starGoals` + luật sao có test; validator/par kiểm từng mục tiêu; thẻ "Mục tiêu ⭐" và màn kết quả hiện mục tiêu đạt/chưa đạt (e2e + ảnh); bảng Thế giới 3–5 (P2-10) ghi mục tiêu sao cho từng màn.

**Tiến độ 03/10/2026 — phần headless xong** (ADR-0017): schema `starGoals` (loại `collectAll`), `RunOutcome.goals` (đạt trên mọi bản đồ), `computeStars` + `meetsStarGoals` có bảng test, luật 19 + fixture, `npm run par` in `min (goals) N · plain win M`. Cùng đợt, phần dữ liệu của **P2-11c**: `mission` (luật 5 đếm chữ) và `goalSprite`. **Còn lại (web):**
- schema `RunSchema` của phiên màn (Dexie) và `RunSummarySchema` của file sao lưu phải giữ trường `goals` (không thì mất khi lưu / khôi phục);
- `toRunSummary` chép `RunOutcome.goals` sang `RunSummary.goals` (chưa chép thì màn có `starGoals` chỉ được ⭐);
- thẻ "Mục tiêu ⭐" trước khi chơi;
- màn kết quả hiện từng mục tiêu đạt/chưa đạt (`meetsStarGoals`, `outcome.goals`, `maps[i].goals`);
- vẽ `goalSprite` và dòng nhiệm vụ `mission` (giọng `<id>.mission` đã được `tools/voice` trích);
- level editor hiện thêm số khối "thắng thường" (`ignoreStarGoals`) cạnh `par` theo mục tiêu;
- e2e + ảnh chụp.

**Tiến độ 04/10/2026 — phần web xong, chờ HLV xem** (chưa commit): `RunSchema` (phiên đang mở) và `RunSummarySchema` (sao lưu) giữ `goals`, `toRunSummary` chép `outcome.goals` (test cả vòng sao lưu → khôi phục); thẻ "Mục tiêu sao" khi vào màn + nút ba ngôi sao cuối dòng mục tiêu; màn kết quả có chip ✔/✖ từng mục tiêu, số khối, gợi ý (màn nhiều bản đồ ghi bản đồ chưa đạt), câu Măng theo bảng mới; lượt thắng thiếu mục tiêu không còn khen số khối; dòng "Nhiệm vụ" trên dòng "Mục tiêu" (giọng `<id>.mission`); `goalSprite` vẽ ở sân runner/maze, dải cả đường, "Xem cả đường", thẻ đáp án (hình tạm ở `stages/goalArt.ts`, danh sách chờ họa sĩ ở `playbooks/add-asset.md`); level editor sửa `mission`, `goalSprite`, `starGoals` và in "par (mục tiêu) N · thắng thường M". e2e `play-goals.spec.ts` (màn `_sandbox` `runner-goals` + ảnh W3 `machine`/`exit`/`home`) ở 1280 và 1366. Chi tiết giao diện: `design/screens-and-flows.md` §3, `architecture/stage-rendering.md` §4 "Hình đích". Còn: HLV xem thẻ, kết quả và hình tạm; `rescue`/`escort` + hình chìa khóa, lồng mở (phần còn lại của P2-11c).

### P2-22 · Xem cả đường (góp ý HLV 03/10/2026)
**Vấn đề:** đường dài (tới 40 ô ở W4–W5) chỉ thấy qua dải bản đồ nhỏ dưới sân chơi, quá bé để bé đếm ô và lên kế hoạch.
**Làm:** nút "Xem cả đường" cạnh dải bản đồ nhỏ mở khung lớn: ô to, kéo trái/phải bằng chuột (và lăn chuột), vạch đếm từng ô ở mép dưới, bấm ô để đánh dấu, Esc/✕ để đóng. Khi Măng chưa chạy, kéo dải bản đồ nhỏ thì sân chơi cuộn theo. Dùng chung cho mê cung lớn và màn nhiều bản đồ (xem đúng bản đồ đang chọn).
**Nghiệm thu:** e2e mở/kéo/đóng ở 1280 và 1366, ảnh chụp; không đổi luật chơi; HLV xem thử.
**Trạng thái (03/10/2026):** 🟨 AI làm xong (khung `PlanView`, kéo dải cuộn sân, thước số ô chỉ trong khung này, e2e `play-plan.spec.ts` ở 1280 và 1366); chờ HLV xem thử.

### P2-23 · Cảnh riêng cho từng thế giới (góp ý HLV 04/10/2026)
**Vấn đề:** mọi thế giới đang dùng chung cảnh rừng tre của Thế giới 1, nên đổi thế giới mà không thấy đổi nơi.
**Làm:** trường `theme` trong `world.json` (mặc định `lang-tre`); sân chơi runner/mê cung, dải bản đồ, khung "Xem cả đường", hình thẻ đoán và đảo trên bản đồ phiêu lưu đều vẽ theo theme. Cảnh vẽ bằng code pixel-art như hiện nay (`scenery.ts`, `pixelArt.ts`), giữ phong cách "Pixel ấm áp" và độ tương phản của ô nguy hiểm (hố, cành, thùng luôn dễ nhận ra).
- W1 `lang-tre` (giữ), W2 `rung-lap-lai` (rừng sâu, tre đậm, đom đóm), W3 `xuong` (xưởng gỗ: bánh răng, đèn lồng, sàn ván, dây cót), W4 `nga-ba` (đường núi, biển chỉ đường, đá), W5 `song` (bờ sông, nước, bến đò, cầu tre ở boss).
**Nghiệm thu:** ảnh chụp mỗi theme ở 1280/1366, e2e mở một màn mỗi thế giới; ô nguy hiểm vẫn phân biệt rõ (kiểm tương phản); review nội bộ (HLV đã duyệt chủ đề 04/10, không cần gửi ảnh).
**Trạng thái (05/10/2026):** 🟨 AI làm xong, chờ review nội bộ (chưa commit). Trường là `world.theme.scene` (vì `theme` đã là object `{ tileset, palette }`), schema `SCENE_THEMES` + `sceneThemeOf` ở content-schema, W1–W4 đã ghi cảnh; W5 chưa có nội dung nên `song` chỉ xem được qua `?theme=song` (bản dev). Cảnh vẽ bằng mã (`stages/sceneThemes.ts`, `sceneTiles.ts`, `runner/scenery.ts`, `runner/decor.ts`), áp cho runner (trời, 3 lớp parallax, đất), maze (tường, đường, nền), dải cả đường, "Xem cả đường", thẻ đáp án, bài giảng demo, "Thử chơi" của editor và đảo trên bản đồ. Vật cản, vật nhặt, đích giữ nguyên; unit test tương phản (WCAG 3:1, `sceneThemes.test.ts`); đom đóm và ánh nước đứng yên khi giảm chuyển động; texture cache theo cảnh. Cầu tre ở màn boss của `song`. Thêm: thay ✔/✘ trong bài giảng, câu đố và `learningGoal` của W4 bằng chữ (Có/Không, đúng/sai) vì font Baloo 2 không có hai ký tự đó. e2e `scene-themes.spec.ts` ở 1280 và 1366. Chi tiết: `architecture/stage-rendering.md` §7.
