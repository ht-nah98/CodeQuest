# Quy trình Git

## Nhánh
- `main` luôn deploy được (CI xanh). Không commit thẳng vào `main`.
- Nhánh làm việc: `<loại>/<task-id>-<mô-tả-ngắn>`, vd `feat/P1-01-runner-sim`, `content/w01-levels-1-5`, `fix/P1-07-hint-priority`.

## Commit — Conventional Commits, tiếng Anh
```
<type>(<scope>): <mô tả ngắn, thì hiện tại>

<thân: vì sao, nếu cần>
Refs: P1-01
```
| type | Khi nào |
|---|---|
| `feat` | Tính năng mới |
| `fix` | Sửa lỗi |
| `content` | Thêm/sửa màn, bài giảng, gợi ý, vật phẩm |
| `refactor` | Đổi cấu trúc, không đổi hành vi |
| `test` | Chỉ thêm/sửa test |
| `docs` | Chỉ tài liệu |
| `chore` | Cấu hình, dependency, CI |
| `asset` | Sprite, tile, âm thanh |

Scope: `engine`, `games`, `runner`, `maze`, `rewards`, `schema`, `web`, `blockly`, `stage`, `sync`, `tools`, `content`, `docs`, `ci`.

Ví dụ: `feat(runner): add crouch block and HIT_BRANCH reason`, `content(w01): add levels 1-5 with hints`.

## Pull request
- Một PR = một task trong roadmap (hoặc một nhóm màn của cùng thế giới).
- Mô tả PR: task ID, làm gì, đã kiểm thế nào (dán kết quả `test`, `content:check`), ảnh chụp nếu đổi giao diện.
- Checklist = mục "Định nghĩa xong" trong `AGENTS.md`.
- Đổi kiến trúc → PR phải kèm cập nhật tài liệu hoặc ADR mới.

## Phiên bản
Gắn tag theo giai đoạn khi đạt tiêu chí nghiệm thu: `v0.1.0` (GĐ 1), `v0.2.0` (GĐ 2)… Ghi `CHANGELOG.md` ngắn gọn bằng tiếng Việt cho huấn luyện viên đọc.
