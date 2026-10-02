# Lưu trữ, đồng bộ & đăng nhập

Nguồn chuẩn cho: dữ liệu lưu ở đâu, đồng bộ thế nào, bé và huấn luyện viên đăng nhập thế nào.

## 1. Nguyên tắc
- **Local-first:** IndexedDB trên máy là nơi ghi đầu tiên. Bé chơi được hoàn toàn khi mất mạng.
- **Dữ liệu hội tụ được (convergent):** mọi bảng được thiết kế để gộp hai phía luôn ra cùng một kết quả, không cần giải quyết xung đột:
  - tiến độ màn: chỉ **tăng** (sao lớn nhất, số khối nhỏ nhất, lần hoàn thành sớm nhất)
  - sổ xu, huy hiệu, tủ đồ, lượt chơi: **hợp** (union) theo khóa idempotent
- **Giai đoạn:** GĐ 1 chỉ có local (nhiều hồ sơ trên một máy + nút sao lưu/khôi phục file JSON). GĐ 2 thêm Supabase.

## 2. IndexedDB (Dexie) — `apps/web/src/data/db.ts`
Database `codequest`, version 1:

| Bảng | Khóa | Trường chính |
|---|---|---|
| `profiles` | `id` | nickname, avatarId, pinHash, settings, remoteStudentId?, createdAt |
| `lessons` | `[profileId+lessonId]` | completedAt |
| `progress` | `[profileId+levelId]` | bestStars, bestBlocks, completedAt, firstTryWin, attempts, updatedAt |
| `drafts` | `[profileId+levelId]` | workspace (JSON), updatedAt |
| `attempts` | `id` (uuid) | profileId, levelId, startedAt, endedAt, runs[], hintTiersBought[], won |
| `ledger` | `[profileId+id]` | delta, reason, refId, at, localDay |
| `inventory` | `[profileId+itemId]` | equipped, at |
| `badges` | `[profileId+badgeId]` | at |
| `creations` | `[profileId+levelId]` | workspace, title, sharedAt? |
| `outbox` | `++seq` | table, payload, createdAt, tries |
| `meta` | `key` | pairing, lastSyncAt, schemaVersion |

Truy cập **chỉ qua repository** (`apps/web/src/data/repos/*.ts`), không gọi Dexie trực tiếp từ component. Mỗi hàm ghi của repository vào **bảng có đồng bộ** tự đẩy một dòng vào `outbox` trong **cùng transaction**.

Quyết định khi làm P1-09:
- **Bảng có đồng bộ** (ghi kèm `outbox`): `lessons`, `progress`, `attempts`, `ledger`, `inventory`, `badges`, `creations` — đúng các bảng có ở Supabase (§3). `profiles`, `drafts`, `meta` **chỉ ở máy**, không vào outbox: `pinHash` không bao giờ rời máy (§5), hồ sơ phía server do huấn luyện viên tạo, bản nháp không có bảng server.
- Mỗi bảng có thêm chỉ mục `profileId` (và `attempts` có `[profileId+levelId]`) để đọc theo hồ sơ. `meta.schemaVersion` được ghi khi tạo DB và sau mỗi lần nâng version.
- Đổi schema: **thêm** một mục mới vào `SCHEMA_VERSIONS` trong `db.ts` (không sửa mục cũ), kèm hàm `upgrade` nếu cần viết lại dòng. Test mẫu ở `data/db.test.ts`.
- Ghi tiến độ đi qua `mergeProgress` (chỉ tăng); không có gì tốt hơn thì không ghi và không thêm dòng outbox. Sổ xu bỏ qua dòng trùng khóa `[profileId+id]`.
- Kết quả một lượt thắng (tiến độ + dòng xu) ghi trong **một** transaction (`saveLevelResult`). Tạo hồ sơ ghi dòng `starter` 30 xu (`starterEntry` của `@codequest/rewards`) cùng transaction. Mua (gợi ý, cửa hàng) qua `spend(entry)`: đọc lại số dư **trong** transaction ghi, thiếu xu thì từ chối, nên bấm 2 lần nhanh không tiêu trùng.
- **`attempts` ghi một lần** (server chỉ insert): chỉ ghi khi bé **rời màn** (`saveAttempt`, `endedAt` bắt buộc), không ghi phiên đang mở; ghi lại cùng `id` thì bỏ qua, không thêm dòng outbox. Phiên đang chơi nằm trong store của màn chơi.
- `balance`, `localDay`, `mergeProgress`, `starterEntry` lấy từ `@codequest/rewards` (cùng luật với server).
- Kết nối DB tự đóng khi tab khác mở version mới (`versionchange`) rồi tải lại trang. Hàm `upgrade` chỉ được `await` promise của Dexie.
- **PIN:** PBKDF2-SHA256 (WebCrypto), salt ngẫu nhiên 16 byte cho mỗi hồ sơ, 100 000 vòng, lưu dạng `pbkdf2-sha256$<vòng>$<salt>$<hash>`; chỉ chấp nhận chuỗi đúng mẫu với 1 000–1 000 000 vòng (cả khi đọc file sao lưu). Component chỉ nhận `ProfileSummary` (không có `pinHash`). PIN 4 số chỉ có 10 000 giá trị nên hash không giữ bí mật được trước người có DB; mục tiêu là PIN không nằm dạng chữ thường trong IndexedDB hay file sao lưu.
- **File sao lưu** (`data/backup.ts`): JSON `{ format: 'codequest-backup', version: 1, exportedAt, profiles: [{ profile, lessons, progress, drafts, attempts, ledger, inventory, badges, creations }] }`, kiểm bằng zod khi đọc (mọi dòng phải thuộc đúng hồ sơ; biệt danh NFC, đã cắt khoảng trắng, ≤ 12 chữ, không trùng trong file; `pinHash` đúng mẫu). File lớn hơn `MAX_BACKUP_BYTES` (5 MB) bị từ chối; màn hình nên kiểm `File.size` trước khi đọc. Có `pinHash`, không có PIN, `outbox` hay `meta`. **Khôi phục là phép gộp**, không ghi đè: hồ sơ và các bảng chỉ-thêm lấy hợp (trùng khóa thì giữ bản trên máy), tiến độ qua `mergeProgress`, bản nháp mới hơn thắng; dòng đồng bộ mới được đẩy vào outbox; dòng lặp trong file bị bỏ qua. Khôi phục 2 lần không cộng xu 2 lần. **Trùng biệt danh** với một hồ sơ khác trên máy (khác `id`): mặc định **bỏ qua** cả hồ sơ đó và trả về trong `conflicts` (`restoreBackup` → `{ restored, conflicts }`); màn Khôi phục (P1-10) báo cho huấn luyện viên quyết định.
- Chưa giới hạn `delta` theo `reason` khi đọc file: §3 chỉ nêu ví dụ mức trần của `ledger_guard`, chưa có bảng đầy đủ.

## 3. Supabase (từ GĐ 2) — `supabase/migrations/`

### Bảng
| Bảng | Khóa | Ghi chú |
|---|---|---|
| `coaches` | `id` = `auth.users.id` | display_name |
| `groups` | `id` | coach_id, name, goal (jsonb) |
| `students` | `id` | group_id, nickname, avatar_id, `auth_user_id` (unique) |
| `progress` | `(student_id, level_id)` | best_stars, best_blocks, completed_at, first_try_win, attempts, updated_at |
| `attempts` | `id` | student_id, level_id, started_at, ended_at, runs (jsonb), hints (jsonb), won |
| `ledger` | `(student_id, id)` | delta, reason, ref_id, at, local_day |
| `inventory`, `badges`, `creations`, `lessons` | `(student_id, …)` | như local |
| `unlock_overrides` | `(student_id, target_id)` | do huấn luyện viên mở khóa thủ công |
| `pairing_codes` | `code_hash` | student_id, expires_at, used_at |

### Ghi dữ liệu
- `progress` chỉ ghi qua RPC `merge_progress(rows jsonb)`, khai báo **`SECURITY DEFINER`** + `set search_path = public`. Hàm **lấy `student_id` từ `auth.uid()`** (tra bảng `students`), **bỏ qua** mọi `student_id` trong payload. Luật gộp: `greatest(best_stars)`, `least(best_blocks)`, `least(completed_at)`, `bool_or(first_try_win)`, `greatest(attempts)`.
- `ledger`, `badges`, `attempts`: chỉ `insert … on conflict do nothing`. **Không có quyền update/delete** cho học sinh.
- `inventory`: insert + update **chỉ cột `equipped`** của dòng của mình. `creations`: insert + update dòng của mình.
- Mọi bảng có cột `synced_at timestamptz` do **server** đặt (`default now()` + trigger khi update). Không tin đồng hồ của client cho việc đồng bộ.

### Mức tin cậy (chấp nhận có ghi nhận)
Client tự tính xu và sao. Một bé rành máy tính có thể tự chèn dòng sổ xu. Với nhóm 6 bé do một huấn luyện viên quản lý, rủi ro này được **chấp nhận**, kèm hai lớp giảm thiểu:
1. Trigger `ledger_guard` từ chối dòng có `delta` vượt mức của `reason` (vd `level-clear` ≤ 10, `daily` ≤ 10, `streak-7` ≤ 50, `replay` ≤ 1; `coach-adjust` chỉ huấn luyện viên được ghi), và từ chối `id` không đúng mẫu ở `rewards-engine.md` §4.
2. View `v_ledger_anomalies` trong Góc huấn luyện viên liệt kê bé có số dư bất thường.
Nếu sau này mở cho nhiều người hơn, chuyển việc tính thưởng lên Edge Function (viết ADR mới).

### Row Level Security
| Vai trò | Được làm |
|---|---|
| Học sinh (`auth.uid()` = `students.auth_user_id`) | Đọc/ghi (insert) các dòng của chính mình; đọc `groups.goal` và `creations.shared` của nhóm mình |
| Huấn luyện viên (`auth.uid()` = `groups.coach_id`) | Đọc mọi dòng của học sinh trong nhóm mình; ghi `unlock_overrides`, `groups.goal`, `ledger` với reason `coach-adjust` |
| Ẩn danh | Không gì cả |

## 4. Đồng bộ — `apps/web/src/features/sync/`
```
ghi local + outbox ──▶ (online?) ──▶ flush: gom ≤ 100 dòng / bảng ──▶ upsert / RPC
                                                    │ lỗi mạng: thử lại theo backoff 5s→60s
đăng nhập / mở app ──▶ pull: tải dòng của mình (synced_at > con trỏ của server) ──▶ merge vào local
```
- Flush khi: có dòng mới (debounce 3 s), mỗi 30 s khi online, khi tab chuyển sang ẩn (`visibilitychange`).
- Pull khi: mở app, sau khi ghép máy, mỗi 5 phút. Con trỏ pull = giá trị `synced_at` lớn nhất **mà server đã trả về** (lưu trong `meta.lastSyncAt` theo từng bảng), không dùng giờ của máy.
- Merge local dùng **cùng luật** với server (hàm `mergeProgress` trong `@codequest/rewards`, có test).
- Lỗi đồng bộ không làm gián đoạn bé. Chỉ hiện trạng thái trong Góc huấn luyện viên.

## 5. Đăng nhập

### Huấn luyện viên
Supabase Auth bằng email + mật khẩu (hoặc magic link). Chỉ một tài khoản.

### Học sinh — ghép máy + PIN *(Đề xuất, xác nhận bằng spike ở task P2-01, xem ADR-0010)*
Mục tiêu: bé không bao giờ phải nhớ email hay mật khẩu.
1. Huấn luyện viên tạo học sinh trong Góc huấn luyện viên → Edge Function `create-student` (service role) tạo `auth.users` với email nội bộ `<uuid>@students.codequest.invalid` (không gửi thư), tạo dòng `students`.
2. Huấn luyện viên bấm "Ghép máy" → Edge Function sinh **mã 6 số**, hạn 10 phút, lưu dạng hash trong `pairing_codes`.
3. Trên laptop của bé: màn "Ghép máy" → nhập mã → Edge Function `pair-device` kiểm mã, dùng Admin API `generateLink({ type: 'magiclink' })` lấy `hashed_token` → client gọi `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` để nhận phiên. supabase-js tự lưu và làm mới phiên.
4. Mỗi lần mở app: bé chọn avatar + **PIN 4 số**. PIN chỉ là **khóa cục bộ** giữa các hồ sơ trên cùng một máy (vd anh chị em dùng chung), lưu dạng hash, không gửi lên server.

### Trước GĐ 2
Hồ sơ chỉ tồn tại trên máy. Cài đặt có "Sao lưu tiến độ" (tải file `.json`) và "Khôi phục". Khi lên GĐ 2, file này (hoặc dữ liệu local) được đẩy lên tài khoản học sinh tương ứng trong lần ghép máy đầu tiên.

## 6. Góc huấn luyện viên đọc gì
View SQL (định nghĩa trong migration):
- `v_student_world_summary`: theo (học sinh, thế giới): số màn xong, tổng sao, lần học gần nhất.
- `v_level_difficulty`: theo màn: tỷ lệ mua gợi ý tầng 3, số lượt thua trung bình, thời gian trung bình (đúng các chỉ số ở `rewards-economy.md` §6).
- `v_student_weak_concepts`: theo (học sinh, khái niệm): tỷ lệ thua theo reasonCode.
