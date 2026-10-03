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
| P2-07 | Level editor v0 (`/coach/editor`) | P2-15 | AI | ⬜ |
| P2-08 | Nội dung Thế giới 3 · Xưởng Sửa Lỗi (15 màn + bài giảng) | P2-10, P2-11 (phần W3) | AI soạn nháp · HLV duyệt | ⬜ |
| P2-09 | PWA offline (chưa deploy) | — | AI | ⬜ |
| P2-10 | Chi tiết hóa chương trình học Thế giới 3–5 | — | AI soạn · HLV duyệt | ⬜ |
| P2-11 | Khối điều kiện, lặp đến khi, cảm biến sáng khi kiểm | P2-10 (bản nháp) | AI | ⬜ |
| P2-12 | Màn nhiều bản đồ (một chương trình, 2–3 bản đồ) | P2-10 (bản nháp) | AI | ⬜ |
| P2-13 | Nội dung Thế giới 4 · Ngã Ba Quyết Định (20 màn + bài giảng) | P2-08, P2-11, P2-12 | AI soạn nháp · HLV duyệt | ⬜ |
| P2-14 | Nội dung Thế giới 5 · Sông Chờ Đợi (20 màn + bài giảng) | P2-13 | AI soạn nháp · HLV duyệt | ⬜ |
| P2-15 | Package `@codequest/validator` + công cụ vét cạn `par` | — | AI | ✅ |
| P2-16 | Nối Supabase thật: chạy migration, test SQL, deploy function, e2e có server | P2-01…P2-06, P2-17, P2-20 | AI · HLV cấp khóa | ⛔ |
| P2-17 | Hạ tầng của HLV: Supabase, Docker, GitHub, Vercel (AI viết hướng dẫn trước) | — | AI viết hướng dẫn · HLV làm | ⬜ |
| P2-18 | Deploy production, thư phụ huynh, ghép máy cho 6 bé | P2-09, P2-16, P2-17 (H3, H4) | HLV + AI | ⛔ |
| P2-19 | Chơi thử cả nhóm, sửa, phát hành `v0.2.0` | tất cả | HLV + AI | ⛔ |
| P2-20 | Màn Ghép máy của bé + giao diện tài khoản trong Góc HLV (với client giả) | P2-03, P2-05 | AI | ⬜ |

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

### P2-08 · Nội dung Thế giới 3 · Xưởng Sửa Lỗi
Theo bảng ở `curriculum.md` (mục Thế giới 3 do P2-10 viết). `world.json`, `w03-lesson`, 15 màn + `w03-creative`, hoạt động unplugged. Chỉ dùng khối đã có (tuần tự + lặp), nặng về `bughunt`, `predict` và chạy từng bước.
**Quy trình** (như W1–W2): AI soạn nháp → vét cạn `par` cho mọi màn build/bughunt (P2-15) → review sư phạm bằng agent riêng (critic) theo `content-authoring.md` → sửa → HLV chơi thử.
**Nghiệm thu:** `content:check` xanh, không cảnh báo luật 4/7/8; `npm run par -- --world w03` không tìm thấy lời giải ít khối hơn `par`; mỗi mode `build`, `parsons`, `predict`, `bughunt` xuất hiện ≥ 1 lần; review sư phạm đã xử lý hết (ghi trong PR); `w03-xuong-sua-loi` không nằm trong `PROVISIONAL_WORLDS`; e2e smoke mở được `w03-l01`; khi đã có giọng đọc (P1-14): `npm run voice -- check --worlds w03` sạch. **HLV chơi thử từng màn** trước khi merge.

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

**Nghiệm thu:** unit test: mỗi khối mới có generator test + `runLevel` thắng/thua; vòng `lặp đến khi` không bao giờ đúng → `TIMEOUT`, **tất định** (2 lần chạy cùng event log); `editDistance` trên ví dụ có nhánh nếu–không; validator bắt shadow trong khối điều kiện ở màn có `maxBlocks` (luật 12). E2E: kéo `nếu` + cảm biến vào màn mẫu ở `_sandbox`, chạy thấy khối cảm biến sáng ✔/✘ đúng số lần; màn lặp vô hạn hiện câu `TIMEOUT` và không treo trình duyệt. Coverage `engine` ≥ 90%, `games` ≥ 85% giữ nguyên.

### P2-12 · Màn nhiều bản đồ
**Mục tiêu:** ép bé viết chương trình **tổng quát** (dùng cảm biến) thay vì ghép thuộc lòng một đường cố định.
**Sản phẩm:**
- ADR mới + `content-model.md`: trường tùy chọn `variants` (1–2 config bổ sung, cùng `kind`) trong level. Màn thắng khi chương trình thắng **mọi** bản đồ; kết quả thua lấy bản đồ đầu tiên thua.
- `runLevel` chạy lần lượt mọi bản đồ (vẫn tất định); `RunOutcome` có kết quả từng bản đồ. Rewards không đổi (một lượt thắng = một lượt thắng).
- Giao diện: thẻ "Bản đồ 1 · 2 · 3" phía trên sân chơi; Chạy phát lần lượt từng bản đồ, bản đồ thua được chọn và giữ lại để bé xem.
- `content:check`: luật 9–10 chạy mọi bản đồ; `predict` và `parsons` không được có `variants` (schema chặn); `tools/content-check/fixtures/` thêm fixture sai.

**Nghiệm thu:** unit test: thắng 2/3 bản đồ = thua với reason của bản đồ thua; snapshot event log từng bản đồ; fixture sai bị bắt; e2e: màn mẫu 3 bản đồ ở `_sandbox`, chương trình chỉ đúng bản đồ 1 thì thua ở bản đồ 2 và thẻ bản đồ 2 được chọn.

### P2-13 · Nội dung Thế giới 4 · Ngã Ba Quyết Định
Theo bảng ở `curriculum.md` (mục Thế giới 4). `world.json`, `w04-lesson` (có thẻ `demo` dùng `nếu` trên 2 bản đồ khác nhau), 20 màn + `w04-creative`, unplugged. Boss: một chương trình thắng 3 bản đồ (P2-12).
**Nghiệm thu:** như P2-08 (thay `w03` bằng `w04`), thêm: mọi màn có `variants` qua `content:check` trên mọi bản đồ; khối `nếu`, cảm biến xuất hiện lần đầu ở màn guided có gợi ý chỉ vào khối (luật 7). **HLV chơi thử từng màn.**

### P2-14 · Nội dung Thế giới 5 · Sông Chờ Đợi
Theo bảng ở `curriculum.md` (mục Thế giới 5). `world.json`, `w05-lesson` (thẻ `demo` có một vòng lặp vô hạn để bé thấy "vòng lặp không tự dừng"), 20 màn + `w05-creative`, unplugged. Boss: qua sông không biết trước độ dài (nhiều bản đồ khác độ dài).
**Nghiệm thu:** như P2-13 (thay `w04` bằng `w05`), thêm: ít nhất 1 màn `bughunt` có lỗi lặp vô hạn và 1 màn `predict` hỏi "vòng lặp có dừng không?". **HLV chơi thử từng màn.**

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
