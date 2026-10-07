# ADR-0020: PWA offline bằng `vite-plugin-pwa` (Workbox `generateSW`), cập nhật kiểu hỏi trước

- **Trạng thái:** Chấp nhận
- **Ngày:** 06/10/2026

## Bối cảnh
Wifi ở nơi học hay chập chờn; laptop của bé phải mở và chơi được khi mất mạng, kể cả khi tải lại trang (P2-09). Nội dung bài học đã đóng gói vào bản build (JSON thành chunk JS), tiến độ nằm trong IndexedDB (ADR-0009), font và media Blockly đã tự host, nên chỉ thiếu một service worker giữ bản app trên máy. Ràng buộc:
- Bản deploy mới **không được** tải lại trang giữa màn chơi, không được làm mất tiến độ trong IndexedDB.
- Vercel chỉ phục vụ file của bản deploy hiện tại: tab đang mở bản cũ sẽ lỗi khi tải một chunk lười (màn, màn hình) đã bị xóa.
- `npm run dev` và e2e trên dev server không được bị ảnh hưởng.
- CSP production không có `'unsafe-eval'`, không inline script (`security-privacy.md` §3).

## Quyết định
- Dùng **`vite-plugin-pwa` 1.3.0** (devDependency của `apps/web`, kéo theo `workbox-build`/`workbox-window` 7.4) ở chế độ `generateSW`. Bản 2.0.0 mới ra 03/10/2026, chưa dùng.
- **Precache** (không ghi tên file tay, Workbox tự lấy theo glob và revision): `index.html`, mọi chunk JS (gồm nội dung bài học), CSS, font, sprite, tile, media Blockly, nhạc nền, hiệu ứng, `panda.json`, favicon. **Không** precache giọng đọc (`audio/voice/`, runtime cache `StaleWhileRevalidate` tên `cq-voice`) và icon cài đặt. Điều hướng nào cũng trả `index.html` từ cache (`navigateFallback`). Ngân sách ở `deployment-ops.md` mục "PWA".
- **`registerType: 'prompt'`**, tự đăng ký trong `apps/web/src/features/pwa` (không chèn script): bản mới cài ngầm rồi **chờ**. Chỉ bản đồ và Cài đặt hiện chip "Có bản mới! · Tải lại"; màn chơi, bài giảng không bao giờ hiện, không bao giờ tự tải lại. Bấm thì `skipWaiting` rồi chỉ tab đó tải lại; tab khác chuyển cờ thành "chỉ cần tải lại" và vẫn chơi tiếp. Tab đang mở kiểm bản mới mỗi giờ khi có mạng (và mỗi lần tải trang).
- Tab cũ gặp `vite:preloadError` (chunk của bản cũ không còn) thì tự tải lại, tối đa một lần mỗi 10 giây. Lỗi này chỉ xảy ra lúc chuyển màn hình, không giữa màn.
- Service worker **tắt** ở `npm run dev` (`devOptions.enabled: false`, `main.tsx` chỉ đăng ký khi `import.meta.env.PROD`). E2E PWA chạy trên `vite build` + `vite preview` cổng 4180, có header CSP production.
- `sw.js` và `manifest.webmanifest` gửi `Cache-Control: no-cache` (`vercel.json`), chunk `assets/*` có hash nên `immutable`.
- Không đụng IndexedDB: service worker chỉ quản lý Cache Storage. Schema Dexie vẫn chỉ thêm version (`data/db.ts`), nên bản mới mở được DB của bản cũ.
- Zod 4 chạy `jitless` (đặt `globalThis.__zod_globalConfig` trong `public/boot/zod-jitless.js`, script thường chạy trước bundle) để không thử `new Function` dưới CSP.
- `navigator.storage.persist()` khi tạo hồ sơ và mỗi lần vào bản đồ (cho hồ sơ tạo trước P2-09; chỉ hỏi khi chưa được), để trình duyệt không tự xóa IndexedDB khi thiếu dung lượng.

## Hệ quả
- Sau lần mở đầu tiên có mạng, app chạy offline hoàn toàn; tiến độ ghi IndexedDB như cũ (đồng bộ server từ P2-16 đi qua outbox, vốn đã chịu được offline).
- Bản build lần đầu tải thêm ~3,5 MB vào Cache Storage (một lần, chạy ngầm).
- Bé chỉ nhận bản mới khi có người bấm "Tải lại" (hoặc đóng hết tab rồi mở lại). HLV cần biết điều này khi vừa deploy sửa lỗi gấp.
- Khi một bản mới nâng version Dexie, tab cũ còn mở sẽ nhận `versionchange` và tải lại (hành vi có sẵn của `data/db.ts`). Chỉ xảy ra khi có 2 tab cùng lúc và một tab đã nhận bản mới.
- `navigateFallback` trả `index.html` cho **mọi** điều hướng cùng origin. P2-16 (Supabase): nếu có đường dẫn cùng origin phải tới server thật (callback đăng nhập, `/api/...`), thêm vào `workbox.navigateFallbackDenylist`; gọi Supabase khác origin thì không bị ảnh hưởng.
- Vercel không rewrite `/assets/`, `/audio/` về `index.html`: chunk cũ đã xóa trả 404, để `vite:preloadError` tải lại lên bản mới.
- Không đọc được `sessionStorage` (chặn dữ liệu trang) thì không tự tải lại khi lỗi chunk (không có chốt chống lặp); màn lỗi xử lý. Lỗi khi khởi động service worker không làm trắng trang (`main.tsx` bắt lỗi).
- Workbox `generateSW` không chạy được mã riêng trong service worker; nếu sau này cần (vd background sync), chuyển sang `injectManifest`.

## Phương án đã cân nhắc
- Tự viết service worker: phải tự lo danh sách precache theo hash, dọn cache cũ, cập nhật; dễ sai, lỗi ở đây làm kẹt bé ở bản cũ.
- `registerType: 'autoUpdate'`: tự tải lại khi có bản mới, có thể đúng lúc bé đang chạy chương trình.
- `vite-plugin-pwa` 2.0.0: mới ra 3 ngày, bảng `tech-stack.md` đã chọn 1.3.0 sau khi kiểm peer Vite 8.
- Precache cả giọng đọc: dung lượng tăng theo chương trình học (hàng trăm câu), không cần cho lần đầu.
