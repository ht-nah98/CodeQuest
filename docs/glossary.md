# Thuật ngữ (Glossary)

Dùng **đúng** các từ này. Cột "Trong code" là tên dùng cho type, biến, ID, tên file.

## Cấu trúc học tập
| Tiếng Việt (hiển thị) | Trong code | Nghĩa |
|---|---|---|
| Thế giới | `World` | Một vùng đất trên bản đồ, dạy một khái niệm lớn. Có 10 thế giới |
| Màn (màn chơi) | `Level` | Một bài cụ thể bé phải giải |
| Chặng | `LevelStage` | Vai trò của màn trong thế giới: `guided`, `practice`, `challenge`, `boss`, `creative`, `bonus`. (Bài giảng không phải một chặng) |
| Bài giảng | `Lesson` | Chuỗi thẻ giải thích khái niệm, có ví dụ chạy được |
| Thẻ (bài giảng) | `LessonCard` | Một trang trong bài giảng |
| Kiểu game | `GameKind` | Thế giới mô phỏng + sân chơi: `runner`, `maze`, `robotlab`, `turtle`, `farm`, `sorter`, `music` |
| Cách chơi | `LevelMode` | Cách bé tương tác: `build` (tự ghép), `parsons` (ghép hình), `predict` (đoán kết quả), `bughunt` (săn lỗi), `creative` (sáng tạo). Xem `product/game-kinds.md` |
| Mục tiêu | `objective` | Câu ngắn nói bé cần làm gì trong màn |
| Ngộ nhận | `misconception` | Hiểu sai phổ biến mà màn này nhắm tới |
| Lời giải | `solution` | Chương trình Blockly mẫu (JSON) giải được màn |
| Số khối chuẩn | `par` | Số khối của lời giải tối ưu, dùng để chấm ⭐⭐ |
| Giới hạn khối | `maxBlocks` | Tối đa số khối được dùng trong màn |

## Lập trình & chạy
| Tiếng Việt | Trong code | Nghĩa |
|---|---|---|
| Khối (khối lệnh) | `block`, `blockType` | Một mảnh Blockly. Khối "khi bắt đầu" **không** tính vào số khối |
| Thanh khối | `toolbox` | Cột chứa các khối được dùng trong màn |
| Vùng ghép khối | `workspace` | Nơi bé ghép chương trình |
| Chương trình | `program` | Toàn bộ khối nối với "khi bắt đầu" |
| Khối rời | `orphan block` | Khối không nối vào chương trình, bị làm xám và không chạy |
| Chạy | `run` | Bấm ▶: chạy sandbox rồi phát lại |
| Lượt chạy | `Run` / `RunOutcome` | Một lần bấm chạy và kết quả của nó |
| Sự kiện | `GameEvent` | Một hành động mô phỏng ghi vào log (vd `{type:'walk', blockId, from, to}`) |
| Nhật ký chạy | `eventLog` | Danh sách sự kiện của một lượt chạy |
| Phát lại | `playback` | Diễn hoạt cảnh từ event log trên sân chơi |
| Kết quả | `RunResult` | `success`, `incomplete`, `crash`, `timeout`, `error` |
| Lý do | `reasonCode` | Vì sao thua: `HIT_WALL`, `FELL_IN_HOLE`, `NOT_AT_GOAL`… |
| Sân chơi | `Stage` | Vùng vẽ PixiJS bên trái màn hình |
| Mô phỏng | `sim` | Code headless cập nhật trạng thái game |
| Chấm bài | `evaluate` | Hàm quyết định thắng/thua từ trạng thái cuối |

## Kiểu game: vật thể & khối
| Tiếng Việt | Trong code | Nghĩa |
|---|---|---|
| Cảm biến | `sensor` (nhóm khối `sensor`) | Khối giá trị đúng/sai, hỏi về thế giới (vd `runner_is_ahead`, `maze_is_path`) |
| Cành (cành tre thấp) | `branch` | Ô runner chỉ qua được bằng cách **cúi** |
| Thùng (thùng gỗ) | `crate` | Ô runner chắn đường, phải **đá** đổ trước |
| Hố | `hole` | Ô runner phải **nhảy** qua |
| Cờ (lá cờ) | `flag` | Ô đích của runner, luôn là ô cuối |
| Măng (vật phẩm) | `bamboo` | Măng tre để nhặt; `goal.collectAll` bắt nhặt hết. Khác với Măng (mascot) |
| Đi | `runner_walk` / `walk` | Sang ô kế bên |
| Nhảy | `runner_jump` / `jump` | Bay qua 1 ô, đáp ô sau đó |
| Cúi | `runner_crouch` / `crouch` | Cúi người đi sang ô kế, chui qua cành |
| Đá | `runner_kick` / `kick` | Đá ô phía trước, đứng yên |
| Tiến | `maze_forward` / `forward` | Đi 1 ô theo hướng đang nhìn (mê cung) |
| Rẽ trái / rẽ phải | `maze_turn_left` / `maze_turn_right` (API `turn`) | Quay tại chỗ |
| Tường | ô `#` (lý do `HIT_WALL`) | Ô mê cung không đi vào được |
| Đích | `goal` | Ô cần tới (mê cung); `level.config.goal` là điều kiện thắng thêm. Runner gọi là **cờ**; câu dùng chung cho cả hai kiểu game (vd `feedback.json`) nói "tới nơi" |

## Phần thưởng
| Tiếng Việt | Trong code | Nghĩa |
|---|---|---|
| Sao | `stars` (0–3) | Mức hoàn thành một màn |
| Xu / coin | `coins` | Tiền trong game. Giao diện gọi là **"xu"** |
| Sổ xu | `CoinLedger` | Danh sách cộng/trừ xu (chỉ ghi thêm, không sửa) |
| Gợi ý tầng 0/1/2/3 | `HintTier` 0–3 | 0 tự động · 1 gợi ý tư duy · 2 chỉ bước tiếp · 3 xem lời giải |
| Chỉ bước tiếp | `nextStepHint` | Popover hiện khối tiếp theo cần thêm, mũi tên chỉ chỗ nối (gợi ý tầng 2). Không chèn khối vào workspace |
| Huy hiệu | `Badge` | Thành tích (vd "Bậc thầy vòng lặp") |
| Chuỗi ngày | `streak` | Số ngày liên tiếp có học |
| Cửa hàng / tủ đồ | `Shop` / `Inventory` | Mua và lưu skin, hiệu ứng |

## Con người & hệ thống
| Tiếng Việt | Trong code | Nghĩa |
|---|---|---|
| Bé / học sinh | `Student` | Người chơi, 8–11 tuổi |
| Huấn luyện viên | `Coach` | Người lớn quản lý nhóm (chủ repo) |
| Nhóm | `Group` | Tập học sinh của một huấn luyện viên |
| Hồ sơ | `Profile` | Biệt danh + avatar + PIN trên một máy |
| Góc huấn luyện viên | `coach dashboard` | Màn hình theo dõi tiến độ cả nhóm |
| Măng | `mascot` | Gấu trúc dẫn chuyện |

## AIROC (Thế giới 6)
| Tiếng Việt | Trong code | Nghĩa |
|---|---|---|
| Sa bàn | `board` | Bản đồ thi đấu kiểu Synapse City |
| CRL | `crl` | Ô xuất phát/đích (Crisis Response Lab) |
| Khoanh vùng | `containment` | Đưa khối ô nhiễm vào vùng khoanh |
| Trung hòa | `neutralization` | Ghép khối trung hòa đúng màu |
| Phân tích | `analysis` | Đưa khối đỏ/vàng về CRL |
