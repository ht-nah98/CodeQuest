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
| Bài "Khối mới" | `Lesson` có `beforeLevel` | Bài giảng ngắn cho một khối hành động mới, đặt ngay trước màn đầu tiên dùng khối đó (`architecture/content-model.md` §3) |
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
| Khối lặp | `cq_repeat` | Khối "lặp N lần": làm các khối bên trong N lần, rồi chạy tiếp khối nằm dưới nó |
| Vòng (lặp) | iteration | Một lần chạy hết các khối bên trong khối lặp. "Lặp 3 lần" = 3 vòng. Khối nằm trước/sau khối lặp không thuộc vòng nào, chỉ chạy 1 lần |
| Nếu (đề xuất) | `cq_if` (đề xuất; P2-11 chốt type) | Khối "nếu ◇ thì": hỏi điều kiện **mỗi lần chạy tới khối**; đúng (✔) thì làm các khối bên trong, sai (✘) thì bỏ qua. Thế giới 4 |
| Nếu … nếu không (đề xuất) | `cq_if_else` (đề xuất) | Khối "nếu ◇ thì … nếu không thì …": ✔ chạy nhánh trên, ✘ chạy nhánh dưới; mỗi lần chỉ chạy **một** nhánh. Không có "nếu không nếu" ở Thế giới 4–5 |
| Nhánh (đề xuất) | input `DO` / `ELSE` | Chỗ chứa khối trong "nếu". Không nhầm với **cành** (ô `branch` của runner) |
| Điều kiện (đề xuất) | `condition` | Ô hình lục giác của "nếu" / "lặp đến khi", nơi cắm một khối hỏi (cảm biến). Với bé gọi là "câu hỏi", không nói "cảm biến" |
| Lặp đến khi (đề xuất) | `cq_repeat_until` (đề xuất; hoặc `controls_whileUntil` khóa UNTIL) | Khối "lặp đến khi ◇": **trước mỗi vòng** hỏi điều kiện; ✔ thì dừng và chạy khối nằm dưới, ✘ thì chạy thêm một vòng. Có thể chạy 0 vòng. Thế giới 5 |
| Vòng lặp không dừng (đề xuất) | `TIMEOUT` | Vòng lặp mà điều kiện không bao giờ đúng; Măng "chóng mặt". Không gọi là "lặp vô hạn" với bé |
| Từng bước | nút `step` (`vi.play.step`, đã có); điểm gợi ý `step` (đề xuất, P2-11 thêm vào `HintTargetSchema`) | Nút chạy từng khối một, dùng để tìm khối gây lỗi (Thế giới 3) |
| Lỗi (đề xuất) | `bug` | Khối làm chương trình chạy khác ý. "Sửa lỗi", "Săn lỗi" (mode `bughunt`) |
| Bản đồ 1 · 2 · 3 | `level.variants` (P2-12) | Màn nhiều bản đồ: một chương trình phải thắng mọi bản đồ |
| Nhiệm vụ (đề xuất) | `level.mission` (P2-11) | Câu ≤ 12 chữ nói Măng đang làm gì cho ai (vd "Lấy chìa khóa, mở lồng cứu Bông!"). Chỉ để tạo động lực, không đổi luật. Từ Thế giới 3 |
| Hình đích (đề xuất) | `goalSprite` | Hình vẽ ở ô đích: cờ, máy, cửa ra, nhà, dấu chân, bạn, lồng, bến đò. Chỉ để trang trí |
| Mục tiêu ⭐ | `starGoals` (P2-21) | Mục tiêu thêm để được ⭐⭐ (vd nhặt đủ măng), hiện ở thẻ "Mục tiêu ⭐". Luật: `product/rewards-economy.md` §1 |
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
| Đi | `runner_walk` / `walk` | Sang ô kế bên. Câu cho bé: "Đi 1 ô về phía trước" |
| Nhảy | `runner_jump` / `jump` | Bay qua ô kế bên (p+1), đáp xuống ô p+2: đi xa **2 ô**, cả trên đất bằng. Câu cho bé: "Nhảy: bay qua 1 ô, đáp xuống ô thứ 2" (tooltip "Bay qua 1 ô, đáp xuống ô thứ 2"). Không nói "nhảy 1 ô" hay "đáp ô sau đó" (bé hiểu là đi 1 ô / "rồi sau đó") |
| Cúi | `runner_crouch` / `crouch` | Cúi người **và đi 1 ô** (không phải cúi tại chỗ), chui qua cành. Câu cho bé: "Cúi xuống và đi 1 ô" |
| Đá | `runner_kick` / `kick` | Đá ô phía trước (đổ thùng), Măng **đứng yên**; muốn đi phải thêm khối đi. Câu cho bé: "Đá ô phía trước, Măng đứng yên" |
| Tiến | `maze_forward` / `forward` | Đi 1 ô theo hướng đang nhìn (mê cung). Câu cho bé: "Tiến 1 ô theo hướng Măng đang nhìn" |
| Rẽ trái / rẽ phải | `maze_turn_left` / `maze_turn_right` (API `turn`) | Quay 90° **tại chỗ, không đi**; muốn đi phải thêm tiến. Câu cho bé: "Quay sang trái tại chỗ, chưa đi" |
| Phía trước có [hố / cành / thùng / ô trống] | `runner_is_ahead` (giá trị `HOLE`, `BRANCH`, `CRATE`, `CLEAR`) | Cảm biến runner: nhìn **ô ngay trước mặt** Măng. "ô trống" = đất hoặc cờ (câu C2). Thế giới 4 |
| Có đường [phía trước / bên trái / bên phải] | `maze_is_path` (`AHEAD`, `LEFT`, `RIGHT`) | Cảm biến mê cung, theo hướng **của Măng** (Măng nhìn xuống thì bên trái của Măng là phía phải màn hình). Thế giới 4 |
| Đã tới đích? | `maze_at_goal` | Cảm biến mê cung: Măng đang đứng ở ô đích. Thế giới 5. Vì Măng thắng ngay khi chạm đích (câu A1), khối này **không bao giờ trả ✔ trong lúc chạy**; "lặp đến khi đã tới đích" dừng nhờ luật thắng |
| Đã tới nơi? (đề xuất, khối mới) | `runner_at_goal` (đề xuất) | Cảm biến runner: Măng đang đứng ở ô đích (cờ, nhà, lồng…). Dùng trong "lặp đến khi đã tới nơi". Gọi "tới nơi" như thuật ngữ chung ở dòng **Đích**. Giống "đã tới đích?": không bao giờ trả ✔ trong lúc chạy. Chờ HLV (`coach-questions.md` G5) |
| Chìa khóa, lồng (đề xuất) | `goal.items` kind `key` (nhiệm vụ `rescue`) | Măng phải đứng ở ô chìa khóa trước khi tới lồng (đích). Thiếu thì lý do `NEED_KEY` |
| Đón bạn (đề xuất) | `goal.items` kind `friend` (nhiệm vụ `escort`) | Măng phải đứng ở ô của bạn trước khi về nhà (đích). Thiếu thì lý do `NEED_FRIEND` |
| Thỏ Bông, bác Cú, chú Ếch, Gà con (đề xuất) | hình đại diện `bunny`, `owl`, `frog`, `chick` | Nhân vật lặp lại trong truyện Thế giới 3–5 (`curriculum.md` §5.0) |
| Tường | ô `#` (lý do `HIT_WALL`) | Ô mê cung không đi vào được |
| Đích | `goal` | Ô cần tới (mê cung); `level.config.goal` là điều kiện thắng thêm. Runner gọi là **cờ** (hoặc theo hình đích của màn, `goalSprite`: máy, nhà, lồng…); câu dùng chung cho cả hai kiểu game (vd `feedback.json`) nói "tới nơi" |

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
