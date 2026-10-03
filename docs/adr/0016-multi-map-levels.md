# ADR-0016: Màn nhiều bản đồ (`variants`): một chương trình phải thắng mọi bản đồ

- **Trạng thái:** Chấp nhận
- **Ngày:** 03/10/2026

## Bối cảnh
Thế giới 4–5 dạy `nếu` và `lặp đến khi` (`product/curriculum.md` §5). Trên một bản đồ cố định, bé luôn ghép được chương trình "thuộc lòng" không cần hỏi gì; chỉ khi **cùng một chương trình** phải chạy trên vài bản đồ khác nhau thì khối hỏi mới thật sự cần (P2-12). Engine (`runLevel`), vét cạn `par` (ADR-0015) và màn chơi đều đang giả định một màn = một `config`.

## Quyết định
- **Schema:** trường tùy chọn `variants` trong level: 1–2 config bổ sung (`MAX_VARIANTS = 2`, tối đa 3 bản đồ), cùng `kind`, mỗi cái kiểm bằng `configSchema` của kind (luật 1, đường dẫn `variants.<i>.…`). Chỉ mode `build` và `bughunt`: schema chặn `variants` ở `parsons`, `predict`, `creative` (khối đã cho sẵn hoặc không có đúng sai, nên bản đồ thêm không dạy gì). `config` là "Bản đồ 1", `variants[i]` là "Bản đồ i+2".
- **Engine:** `runLevel` biên dịch chương trình **một lần**, rồi chạy trên từng bản đồ theo thứ tự với state, `rng` (cùng seed), event log và giới hạn `maxSteps`/`maxActions` **riêng**: mỗi lượt chạy y hệt như màn chỉ có bản đồ đó (tất định). `RunOutcome.maps` giữ kết quả từng bản đồ; `mapIndex` là bản đồ quyết định: bản đồ **đầu tiên không thắng**, hoặc bản đồ cuối khi thắng hết. `result`, `reasonCode`, `events`, `stats` ở cấp trên là của `maps[mapIndex]`, nên code chỉ đọc cấp trên (rewards, gợi ý `lastReason`, khối bị lắc) không phải đổi. `answerKey` lấy từ bản đồ quyết định; `edits` tính một lần. Màn một bản đồ: không có `maps`/`mapIndex`, kết quả giữ nguyên từng byte.
- **Rewards không đổi:** một lượt chạy thắng mọi bản đồ là một lượt thắng.
- **Kiểm chứng:** luật 9 chạy mọi bản đồ và ghi `on map N` khi thua; luật 14 (`bughunt` ban đầu phải thua) tự hiểu là thua ít nhất một bản đồ. Vét cạn (`FastSim`) dùng **bộ trạng thái** (một trạng thái mỗi bản đồ, bản đồ đã thắng giữ `WIN`): chương trình thắng khi thắng mọi bản đồ, bị loại ngay khi thua một bản đồ. Màn một bản đồ dùng thẳng trạng thái của bản đồ đó (không thêm tầng), nên `npm run par` của W1–W2 không đổi.
- **Giao diện:** thẻ "Bản đồ 1 · 2 · 3" trên sân chơi. Chạy: phát lần lượt từng bản đồ (`StageController.showMap` đổi cảnh trong cùng ứng dụng PIXI, giữ tốc độ), dừng ở bản đồ đầu tiên thua; thẻ đó được chọn và giữ lại, mỗi thẻ đã chạy có dấu ✔/✖. Level editor soạn được từng bản đồ (thêm bằng cách chép bản đồ đang xem, xóa), xuất `variants` ngay sau `config`.

## Hệ quả
- Một lượt chạy tốn thời gian gấp số bản đồ (vẫn rất nhỏ). Vét cạn nhiều bản đồ có thể gộp ít trạng thái hơn, nhưng loại chương trình sai sớm hơn.
- Vật phẩm theo từng bản đồ (`rescue`/`escort`, `curriculum.md` §5.4 T17) chỉ cần nằm trong config của từng bản đồ, không cần trường mới.
- Thẻ `demo` của bài giảng vẫn một bản đồ: muốn cho xem hai bản đồ thì dùng hai thẻ `demo` liền nhau (W4 thẻ 3–4).

## Phương án đã cân nhắc
- **Mỗi bản đồ một màn riêng:** bé sẽ ghép lại từng lần, đúng điều ta muốn tránh (thuộc lòng).
- **Chạy tiếp các bản đồ sau khi một bản đồ thua, và phát hết:** bé phải xem nhiều đoạn thua; dừng ở bản đồ đầu tiên thua thì chỗ cần sửa rõ hơn. Engine vẫn chạy mọi bản đồ (rẻ) để `maps` đủ thông tin cho công cụ.
- **`config` là mảng:** đổi kiểu của mọi màn đã có và mọi kiểu game; `variants` tùy chọn thì màn cũ không đổi gì.
- **Dựng lại sân chơi (mount mới) mỗi khi đổi bản đồ:** chậm và chớp màn hình; đổi renderer trong cùng ứng dụng PIXI là đủ.
