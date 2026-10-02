# ADR-0002: React 19 + Vite 8, SPA tĩnh, không SSR

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Người dùng là 6 bé trên laptop, không cần SEO. Cần chạy offline và deploy miễn phí.

## Quyết định
SPA bằng **React 19.3** + **Vite 8.3**, router `react-router` 8 ở chế độ declarative. Build ra file tĩnh, host trên Vercel.

## Hệ quả
Đơn giản, nhanh, offline dễ (PWA). Không có server code. Mọi logic bảo mật nằm ở RLS và Edge Function của Supabase.

## Phương án đã cân nhắc
Next.js (SSR thừa, phức tạp hơn khi offline); Remix framework mode (thừa).
