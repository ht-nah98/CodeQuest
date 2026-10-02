# ADR-0001: Monorepo npm workspaces với package nội bộ source-only

- **Trạng thái:** Chấp nhận
- **Ngày:** 01/10/2026

## Bối cảnh
Có 4 package headless dùng chung giữa web, tools và test. Đội ngũ là 1 người + AI, nên cần cấu hình tối thiểu.

## Quyết định
Dùng **npm workspaces** (`apps/*`, `packages/*`, `tools/*`). Package nội bộ đặt `"exports": { ".": "./src/index.ts" }`, không có bước build riêng. Vite, Vitest và `tsx` đọc TypeScript trực tiếp. `tsc -b` với project references chỉ dùng để typecheck.

## Hệ quả
Không phải chờ build package khi sửa code. Package nội bộ không publish lên npm được (cũng không cần). Nếu sau này cần publish, thêm bước build cho package đó.

## Phương án đã cân nhắc
pnpm + Turborepo (mạnh hơn nhưng thừa cho 4 package); một package duy nhất (mất ranh giới headless).
