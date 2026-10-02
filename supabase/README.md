# supabase/ — Backend (từ GĐ 2)

- `migrations/`: SQL theo thứ tự thời gian (`YYYYMMDDHHMMSS_<mô tả>.sql`): bảng, RLS, RPC, view.
- `functions/`: Edge Function `create-student`, `pairing-code`, `pair-device`.

**Đọc trước:** `docs/architecture/data-sync-auth.md`, `security-privacy.md`, ADR-0009, ADR-0010.
Khóa `service_role` **không bao giờ** nằm trong repo.
