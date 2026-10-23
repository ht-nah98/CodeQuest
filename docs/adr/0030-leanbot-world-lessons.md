# ADR-0030: Bài giảng Thế giới Leanbot ở trang riêng, chấm bằng so code

- **Trạng thái:** Chấp nhận
- **Ngày:** 23/10/2026

## Bối cảnh

Thế giới Leanbot có đủ 93 khối của trình soạn Pythaverse bằng tiếng Việt và Xưởng Phiên Dịch
(`docs/product/the-gioi-leanbot.md`). Huấn luyện viên nhận xét: *"chúng ta cung cấp con rất nhiều
khối mới mà không ai dạy thì các con sao mà làm được"*. Cần bài học từng bước, từ khối đầu tiên tới
lượt thi AIROC trên sa bàn thật. Kế hoạch: `docs/product/the-gioi-leanbot-bai-giang.md`.

`the-gioi-leanbot.md` §5 từng định đặt các vùng thành **thế giới trên bản đồ `/map`** (thêm trường
`World.map`). Hỏi lại thì vướng: màn robot thật và màn đọc không hợp mô hình màn chơi (`levelIds`,
`par`, lời giải chạy trên sân, AGENTS.md §9.4), và sân mô phỏng robot chưa có.

## Quyết định

Huấn luyện viên chọn (23/10/2026):

1. **Trang riêng `/the-gioi-leanbot`**: danh sách bài theo chặng → từng màn
   (`/the-gioi-leanbot/:lessonId/:page`). Thẻ "Thế giới Leanbot" ở `/hub` dẫn vào; Xưởng Phiên Dịch
   là một nút trong trang. Không đổi schema `World` của CodeQuest.
2. **Nội dung là dữ liệu riêng**: `content/leanbot-world/<id>.json`, schema
   `LeanbotWorldLessonSchema` (`packages/content-schema/src/leanbotWorld.ts`). Một bài là danh sách
   màn; màn `read` dùng lại `LeanbotScreenSchema` của khóa Leanbot (thêm `program` cho màn robot
   thật), màn `build` có bốn cách (`build`, `fix`, `fill`, `code`).
3. **Chấm bằng so code**: chương trình của bé đúng khi code Arduino của nó trùng code của lời giải
   (hoặc một lời giải `accept`), bỏ dòng trống và khoảng trắng cuối dòng (`checkProgram`,
   `packages/games/src/leanbot/lesson.ts`). Làm được vì bộ sinh code in giống hệt Pythaverse. Sai thì
   chỉ dòng: thiếu khối trước dòng N, dòng N là khối thừa, hay dòng N khác mẫu; `hints` cho câu gợi ý
   riêng.
4. **Khối mở dần**: mỗi màn khai báo `toolbox` (chỉ những khối này) và `newBlocks` (hiện trên cùng
   dưới nhãn "Khối mới").
5. **Chỉ đánh dấu xong**, không sao, không coin: mỗi màn xong là một dấu trong `localStorage`
   (`cq.lbworld.done.<bài>.<màn>`), như ô tích của khóa Leanbot (ADR-0028).
6. **Ẩn với bé** (AGENTS.md §9.10): trang, bài và xưởng chỉ mở cho hồ sơ HLV tới khi HLV chơi thử
   và cho mở.
7. **Luật 29** của `content:check`: chương trình nào cũng mở được và in ra code, khay khối có đủ khối
   của lời giải, màn không bắt đầu bằng đúng lời giải. `npm run leanbot:compile` (cần mạng, chạy tay)
   biên dịch code của mọi lời giải trên máy chủ Leanbot (AGENTS.md §9.12).

## Hệ quả

- Làm được ngay mà chưa cần sân mô phỏng. Màn "sa bàn ảo" (§4 của kế hoạch) đợi kiểu game
  `leanbot`, sẽ có ADR riêng.
- So code thì một màn chỉ nhận những lời giải đã khai báo. Màn có nhiều cách đúng phải liệt kê
  trong `accept` (tối đa 4) hoặc chờ sân mô phỏng.
- Tiến độ chỉ ở trình duyệt này, như khóa Leanbot; đổi máy là mất dấu.

## Phương án đã cân nhắc

- **Thế giới trên bản đồ `/map`** (`World.map`): có sao/coin sẵn, nhưng phải bẻ mô hình màn chơi
  cho màn đọc và màn robot thật, và đổi schema thế giới — HLV không chọn.
- **Gộp vào khóa Leanbot `/leanbot`**: khóa đó là bài đọc và việc làm trên robot, không có vùng ghép
  khối; nhét Blockly vào làm mỗi màn hai kiểu bố cục. Hai thứ nối nhau bằng link (`course`).
