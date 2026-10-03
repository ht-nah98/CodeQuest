# Chiến lược kiểm thử

Nguồn chuẩn cho: loại test, công cụ, nơi đặt test, mức bao phủ, cái gì chạy trong CI.

## 1. Kim tự tháp
| Tầng | Công cụ | Ở đâu | Môi trường | Chạy khi |
|---|---|---|---|---|
| Unit headless | Vitest | `packages/*/src/**/*.test.ts` | `node` | mỗi commit (CI) |
| **Kiểm chứng nội dung** | `tools/content-check` (luật cấp màn trong `packages/validator`) | `content/**` | node | mỗi commit (CI) |
| Vét cạn `par` | `npm run par` (`tools/par`) | màn build/bughunt | node | khi soạn hoặc sửa màn (`content-model.md` §8); unit test của `validator` tái lập `par` mọi màn build W1–W2 |
| Repository / sync | Vitest + `fake-indexeddb` | `apps/web/src/data/**/*.test.ts` | node | CI |
| Component | Vitest + jsdom + Testing Library | `apps/web/src/**/*.test.tsx` | jsdom | CI |
| End-to-end | Playwright (Chromium) | `apps/web/e2e/*.spec.ts` | 1280×720 và 1366×768 | CI (smoke), local (đầy đủ) |
| **Chơi thử với bé** | Quan sát | `docs/playbooks/playtest.md` | thật | cuối mỗi giai đoạn |

## 2. Bắt buộc phải có test
| Thứ | Test |
|---|---|
| Mỗi kiểu game | Mỗi reasonCode có ít nhất 1 test sinh ra nó; 1 test thắng; test `predictAnswer` |
| `runLevel` | Chương trình rỗng; quá `maxBlocks`; khối rời không chạy; vòng lặp vô hạn → `timeout`; `StopSignal`; **tất định** (chạy 2 lần cho cùng snapshot) |
| `compileProgram` | Block id có ký tự đặc biệt (`'`, `\`, `` ` ``) vẫn sinh code hợp lệ |
| `editDistance` | Các ví dụ ở `runtime-engine.md` §9 |
| Hint `matches()` | Mỗi khóa điều kiện, `all`/`any`/`not`, ưu tiên |
| Rewards | Danh sách ở `rewards-engine.md` §6 |
| `mergeProgress` | Giao hoán, kết hợp, lũy đẳng (property test với các bộ ngẫu nhiên có seed) |
| Schema | Mỗi schema có 1 ví dụ hợp lệ + các ví dụ sai điển hình |

Mục tiêu bao phủ (statement): `engine` ≥ 90%, `rewards` ≥ 95%, `games` ≥ 85%. Không đặt chỉ tiêu cho `apps/web`; ưu tiên e2e cho luồng chính.

## 3. E2E smoke (chạy trong CI)
1. Tạo hồ sơ → vào bản đồ → vào Thế giới 1 → xem bài giảng → vào `w01-l01`.
2. Kéo thả để giải `w01-l01` (dùng helper đặt workspace từ `solution`, không mô phỏng kéo từng pixel) → bấm Chạy → thấy màn Kết quả 3 sao → số dư xu đúng **70**: 30 xu khởi đầu → 45 sau bài giảng ở bước 1 (+5 bài giảng, +10 thưởng ngày vì đó là hoạt động đầu tiên của ngày) → 70 sau màn (+25).
3. Mở `w01-l03` (đã mở sau khi xong l01–l02 bằng helper), ghép chương trình chỉ có "đi, đi" → thấy bong bóng phản hồi `FELL_IN_HOLE`.
4. Mua gợi ý tầng 1 → số dư giảm 5.
5. Tải lại trang → tiến độ vẫn còn.

## 4. Quy ước
- Tên test mô tả hành vi bằng tiếng Anh: `it('stops with FELL_IN_HOLE when walking into a hole')`.
- Không test chi tiết cài đặt nội bộ; test qua API công khai của package.
- Test không phụ thuộc thời gian thật: truyền `now` vào; Vitest `vi.useFakeTimers()` cho UI.
- Snapshot chỉ dùng cho event log của engine (tất định), không dùng cho DOM.
