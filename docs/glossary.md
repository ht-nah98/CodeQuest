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
| Nếu | `cq_if` (P2-11) | Khối "nếu ◇ thì": hỏi điều kiện **mỗi lần chạy tới khối**; đúng (✔) thì làm các khối bên trong, sai (✘) thì bỏ qua. Tooltip: "Hỏi mỗi lần chạy tới đây: ✔ thì làm các khối bên trong, ✘ thì bỏ qua". Thế giới 4 |
| Nếu … nếu không | `cq_if_else` (P2-11) | Khối "nếu ◇ thì … nếu không thì …": ✔ chạy nhánh trên, ✘ chạy nhánh dưới; mỗi lần chỉ chạy **một** nhánh. Tooltip: "Hỏi mỗi lần chạy tới đây: ✔ thì làm nhánh trên, ✘ thì làm nhánh dưới". Không có "nếu không nếu" ở Thế giới 4–5 |
| Nhánh | input `DO` / `ELSE` | Chỗ chứa khối trong "nếu". Không nhầm với **cành** (ô `branch` của runner) |
| Điều kiện | input `COND` (`COND_INPUT`); trong vét cạn `Condition` | Ô hình lục giác của "nếu" / "lặp đến khi", nơi cắm một khối hỏi (cảm biến). Với bé gọi là "câu hỏi", không nói "cảm biến". Ô để trống thì không chạy (`EMPTY_CONDITION`) |
| Lặp đến khi | `cq_repeat_until` (P2-11) | Khối "lặp đến khi ◇": **trước mỗi vòng** hỏi điều kiện; ✔ thì dừng và chạy khối nằm dưới, ✘ thì chạy thêm một vòng. Có thể chạy 0 vòng. Tooltip: "Hỏi trước mỗi vòng: ✘ thì làm thêm một vòng, ✔ thì dừng và chạy khối bên dưới". Thế giới 5 |
| Vòng lặp không dừng | `TIMEOUT` (khóa đoán `timeout`) | Vòng lặp mà điều kiện không bao giờ đúng; Măng "chóng mặt". Không gọi là "lặp vô hạn" với bé |
| Từng bước | nút `step` (`vi.play.step`, đã có); điểm gợi ý `point: "step"` (`HintTargetSchema`, P2-11; nút nhấp nháy như nút Chạy) | Nút chạy từng khối một, dùng để tìm khối gây lỗi (Thế giới 3) |
| Lỗi (đề xuất) | `bug` | Khối làm chương trình chạy khác ý. "Sửa lỗi", "Săn lỗi" (mode `bughunt`) |
| Bản đồ 1 · 2 · 3 | `level.variants` (P2-12) | Màn nhiều bản đồ: một chương trình phải thắng mọi bản đồ |
| Nhiệm vụ | `level.mission` (P2-11c) | Câu ≤ 12 chữ nói Măng đang làm gì cho ai (vd "Lấy chìa khóa, mở lồng cứu Bông!"). Chỉ để tạo động lực, không đổi luật. Từ Thế giới 3. `content:check` luật 5 đếm chữ |
| Hình đích | `level.goalSprite` (P2-11c): `flag` cờ · `machine` máy · `exit` cửa ra · `home` nhà · `footprints` dấu chân · `friend` bạn · `cage` lồng · `dock` bến đò | Hình vẽ ở ô đích, chỉ runner và maze. Chỉ để trang trí |
| Chìa khóa · Đón bạn (vật phẩm nhiệm vụ) | `config.goal.items` (P2-11c, ADR-0019): `{ kind: 'key' \| 'friend', at }`; màn `rescue` (chìa khóa → lồng), `escort` (đón bạn → về nhà); lý do `NEED_KEY` "Cần chìa khóa trước!", `NEED_FRIEND` "Chưa đón bạn kìa!" | Măng phải **đứng ở** ô vật phẩm (nhảy qua không tính) trước khi tới đích. Khác mục tiêu ⭐: thiếu vật phẩm là **chưa thắng**. Chỉ runner và maze |
| Mục tiêu ⭐ (mục tiêu sao) | `level.starGoals` (P2-21), loại `collectAll` "nhặt đủ măng" | Mục tiêu thêm của màn build/bughunt, hiện ở thẻ "Mục tiêu ⭐": **không** quyết định thắng, chỉ quyết định ⭐⭐/⭐⭐⭐. Màn nhiều bản đồ: phải đạt trên mọi bản đồ. Luật: `product/rewards-economy.md` §1 |
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
| Cảm biến | `sensor` (nhóm khối `sensor`) | Khối giá trị đúng/sai, hỏi về thế giới (vd `runner_is_ahead`, `maze_is_path`). Mỗi lần được hỏi, engine ghi event `sense` (khối sáng ✔/✘) |
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
| Phía trước có [hố / cành / thùng / ô trống] | `runner_is_ahead` (giá trị `HOLE`, `BRANCH`, `CRATE`, `CLEAR`) | Cảm biến runner: nhìn **ô ngay trước mặt** Măng. "ô trống" = đất hoặc cờ (câu C2). Tooltip: "✔ khi ô ngay trước Măng là thứ con chọn, ✘ khi không phải". Thế giới 4 |
| Có đường [phía trước / bên trái / bên phải] | `maze_is_path` (`AHEAD`, `LEFT`, `RIGHT`) | Cảm biến mê cung, theo hướng **của Măng** (Măng nhìn xuống thì bên trái của Măng là phía phải màn hình). Tooltip: "✔ khi phía đó của Măng có đường đi, ✘ khi là tường". Thế giới 4 |
| Đã tới đích? | `maze_at_goal` | Cảm biến mê cung: Măng đang đứng ở ô đích. Thế giới 5. Vì Măng thắng ngay khi chạm đích (câu A1), khối này **không bao giờ trả ✔ trong lúc chạy**; "lặp đến khi đã tới đích" dừng nhờ luật thắng. Tooltip: "✔ khi Măng đã đứng ở đích, ✘ khi chưa tới. Tới đích là thắng ngay" |
| Đã tới nơi? | `runner_at_goal` (API `atGoal`, P2-11) | Cảm biến runner: Măng đang đứng ở ô đích (cờ, nhà, lồng…). Dùng trong "lặp đến khi đã tới nơi". Gọi "tới nơi" như thuật ngữ chung ở dòng **Đích**. Giống "đã tới đích?": không bao giờ trả ✔ trong lúc chạy. Tooltip: "✔ khi Măng đã tới nơi, ✘ khi chưa tới. Tới nơi là thắng ngay". Câu G5 của HLV vẫn mở (`coach-questions.md`) |
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

## AIROC và robot (Thế giới 6, `robotlab`)
Luật đầy đủ: `product/game-kinds.md` §3.3. Trong lời nói cho bé ở W6, **"khối"** chỉ là khối thi đấu; khối Blockly gọi là **"lệnh"**, cả chương trình là **"chương trình"**.

| Tiếng Việt | Trong code | Nghĩa |
|---|---|---|
| Robot Bíp | (nhân vật, kiểu game `robotlab`) | Robot giống Leanbot mà bé lập trình ở W6. Măng dẫn chuyện |
| Sa bàn | `board` / `config.map` | Bản đồ thi đấu kiểu Synapse City: lưới ngã tư của đường line đen |
| Ngã tư | ô `.` (và mọi ô không phải `#`) | Một ô của sa bàn robot. "Tiến 3 ô" = đếm 3 ngã tư, chỗ đang đứng không tính. Ở trò chơi là cách làm đơn giản; sa bàn thật có thể có đoạn line không có ngã tư (`airoc-2026.md` §4) |
| Line | `robot_line_ahead` | Đường kẻ đen Bíp chạy theo. Câu hỏi "phía trước có line?" |
| Nhà | ô `#` | Ô không có line; tiến vào là `OFF_LINE` |
| Phòng thí nghiệm | ô `L` (`atLab`, `robot_at_lab`) | Chỗ xuất phát và chỗ phải về cuối lượt (+40 điểm). Thay cho tên cũ **CRL** (Crisis Response Lab) trong ghi chú cũ; không dùng "CRL" với bé |
| Tiến … ô | `robot_forward` / `forward(n)` | Đi theo line đúng số ngã tư rồi dừng. Câu cho bé: "Tiến 3 ô: dừng ở ngã tư thứ 3". Không đi xuyên qua khối |
| Rẽ trái / rẽ phải (robot) | `robot_turn_left` / `robot_turn_right` | Như mê cung: quay 90° tại chỗ, chưa đi |
| Tay gắp | `held` (trạng thái), gripper | Giữ **một** khối |
| Gắp | `robot_grab` / `grab` | Gắp khối ở chỗ Bíp đứng. Muốn gắp thì dừng đúng ô có khối |
| Thả | `robot_release` / `release` | Thả khối xuống chỗ Bíp đứng |
| Khối rào | `fence` | Khối thi đấu màu xám, không có màu để hỏi; thả trên ô vùng là khoanh vùng |
| Khối trung hòa | `neutralizer` | Khối có màu; thả trên trạm cùng màu là trung hòa |
| Khối ô nhiễm | `pollution` | Khối có màu; thả trong phòng thí nghiệm là thu hồi |
| Ô vùng ô nhiễm | ô `Z` | Ô có viền đỏ cần đặt rào |
| Trạm xử lý | ô `r` / `y` / `g` | Trạm đỏ / vàng / xanh lá nhận khối trung hòa cùng màu |
| Khoanh vùng | `contain` (điểm `points.contain`, 45) | Thả khối rào trên ô vùng ô nhiễm. Tên Anh cũ `containment` |
| Trung hòa | `neutralize` (`points.neutralize`, 160) | Thả khối trung hòa trên trạm cùng màu. Tên Anh cũ `neutralization` |
| Thu hồi | `retrieve` (`points.retrieve`, 100) | Đứng trong phòng thí nghiệm, thả khối ô nhiễm. Thay tên cũ "Phân tích" / `analysis` |
| Về phòng | `mustReturn`, `points.return` (40) | Kết thúc lượt ở phòng thí nghiệm. Bíp chạy hết lệnh rồi mới chấm (không thắng giữa chừng) |
| Đồng hồ (ảo) | `elapsed`, `rules.timeLimit`, `rules.costs` | Mỗi việc tốn vài giây; hết giờ (`OUT_OF_TIME`) thì Bíp dừng |
| Điểm | `goal.type: 'score'`, `target` | Tổng điểm các việc đã xong; màn "chọn việc" và boss cần đủ điểm |
| Khối ở chỗ Bíp màu …? | `robot_block_color` | Câu hỏi: khối Bíp đang gắp (hoặc khối dưới chỗ Bíp đứng) có màu con chọn |
| Đã về phòng thí nghiệm? | `robot_at_lab` | Câu hỏi: Bíp đang đứng ở phòng thí nghiệm |
| Đang gắp khối? | `robot_holding` | Câu hỏi: tay gắp đang giữ khối (giới thiệu ở W7) |
