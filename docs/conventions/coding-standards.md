# Quy ước code

## 1. TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noImplicitOverride: true`, `verbatimModuleSyntax: true`.
- **Cấm** `any`, `@ts-ignore`, `@ts-expect-error` (trừ test có comment lý do), `!` non-null (trừ khi vừa kiểm tra xong ngay dòng trên).
- Ưu tiên `type` cho union / dữ liệu; `interface` cho hợp đồng có thể mở rộng (SDK).
- Dữ liệu từ bên ngoài (JSON nội dung, IndexedDB, Supabase) luôn đi qua **zod** ở ranh giới, sau đó mới dùng type.
- Lỗi có thể đoán trước thì trả về kết quả có kiểu (vd `RunOutcome` với `result: 'error'`), không `throw`. `throw` chỉ cho lỗi lập trình.
- Module ESM. Import có đuôi theo cấu hình bundler (không viết `.js` thủ công trong `apps/web`).

### Mẫu `tsconfig`
Luôn khai báo **tường minh** mọi tùy chọn dưới đây. TypeScript 6 đổi một số mặc định so với 5.x; không dựa vào giá trị mặc định (P0-01 phải kiểm lại bằng `tsc --showConfig`).
```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2023", "module": "ESNext", "moduleResolution": "bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],   // DOM có trong lib để type của Blockly phân giải được; cấm dùng DOM ở package headless bằng ESLint
    "types": [],                                // mỗi package tự thêm: ["node"], ["vite/client"], ["vitest/globals"]…
    "strict": true, "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true, "verbatimModuleSyntax": true, "isolatedModules": true,
    "resolveJsonModule": true, "skipLibCheck": true,
    "composite": true, "declaration": true, "emitDeclarationOnly": true,
    "declarationDir": ".tsbuild/types", "tsBuildInfoFile": ".tsbuild/tsconfig.tsbuildinfo"
  }
}
// tsconfig.json (root): { "files": [], "references": [{ "path": "packages/content-schema" }, { "path": "packages/engine" }, …, { "path": "apps/web" }] }
```
Project reference bắt buộc `composite` và không được `noEmit`, nên dùng `emitDeclarationOnly` vào `.tsbuild/` (đã gitignore). Vite/Vitest không đọc các file này.

## 2. Đặt tên
| Thứ | Quy ước | Ví dụ |
|---|---|---|
| File TS thường | `camelCase.ts` | `runLevel.ts`, `editDistance.ts` |
| Component React | `PascalCase.tsx`, 1 component chính / file | `BlocklyWorkspace.tsx` |
| Test | cạnh file, `*.test.ts(x)` | `runLevel.test.ts` |
| Type / interface | `PascalCase` | `RunOutcome` |
| Hằng số cấu hình | `SCREAMING_SNAKE_CASE` | `DEFAULT_MAX_STEPS` |
| Block type | `snake_case`, tiền tố kind hoặc `cq_` | `runner_jump` |
| reasonCode | `SCREAMING_SNAKE_CASE` | `FELL_IN_HOLE` |
| ID nội dung | xem `architecture/content-model.md` §2 | `w01-l03` |
| Thuật ngữ | đúng `docs/glossary.md` | `Level` (không `Stage`, `Mission` cho màn) |

## 3. Cấu trúc & ranh giới
- Tôn trọng bảng phụ thuộc ở `architecture/overview.md` §2. ESLint chặn import sai hướng.
- Mỗi package export qua **một** `src/index.ts`. Không import sâu (`@codequest/engine/src/run/x`) từ package khác.
- Trong `apps/web`: `screens → features/ui/blockly/stages`, `features → data/lib`, `ui` không biết nghiệp vụ.
- Component không gọi Dexie/Supabase trực tiếp; đi qua `features/*` hoặc `data/repos/*`.
- Không có "utils" khổng lồ. Hàm dùng chung đặt gần nơi dùng; chỉ đưa vào `lib/` khi ≥ 2 feature cần.

## 4. React
- Function component + hooks. Không class component.
- State phiên chơi (đang chạy, tốc độ, gợi ý đang mở) ở **Zustand store của màn chơi**, tạo mới mỗi lần vào màn.
- Dữ liệu bền (tiến độ, xu) đọc bằng `useLiveQuery` của Dexie qua hook trong `features/*`.
- Blockly và PixiJS là "đảo mệnh lệnh": React chỉ tạo `div` và quản lý vòng đời trong `useEffect`. Không đưa object Blockly/Pixi vào state React.
- Chuỗi hiển thị lấy từ `i18n/vi.ts` hoặc `content/`, không viết thẳng trong JSX (trừ ký hiệu như "▶").

## 5. CSS & UI
- Màu, font, bo góc, bóng: chỉ dùng token trong `ui/tokens.css` (Tailwind `@theme`). Không viết mã màu hex trong component.
- Vùng bấm ≥ 44px. Mọi phần tử bấm được có trạng thái hover, active, focus-visible.
- Tôn trọng `prefers-reduced-motion` và cài đặt "Giảm chuyển động" của hồ sơ.

## 6. Comment & log
- Comment giải thích **vì sao**, không giải thích code làm gì. Tiếng Anh.
- Không `console.log` trong code commit. Dùng `lib/log.ts` (tắt ở production trừ `error`).
- Hàm công khai của package headless có TSDoc 1–3 dòng.

## 7. Định dạng
Prettier (2 space, single quote, trailing comma `all`, `printWidth` 100). ESLint flat config ở root. Chạy `npm run format` trước commit.
