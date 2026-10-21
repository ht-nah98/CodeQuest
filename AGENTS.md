# AGENTS.md — CodeQuest

Đây là điểm vào cho mọi AI agent (Claude Code, Codex, Cursor…) làm việc trong repo này. Đọc hết file này trước khi làm bất cứ việc gì.

## 1. Dự án là gì

**CodeQuest** là web game dạy **tư duy lập trình** cho học sinh tiểu học (8–11 tuổi), dựng trên **Blockly**. Bé đi qua 10 "thế giới". Mỗi thế giới dạy một khái niệm (tuần tự, lặp, điều kiện…) bằng bài giảng ngắn và nhiều kiểu trò chơi kéo-thả khối lệnh, có sao/coin/gợi ý.

- Người dùng: **6 học sinh** (con của huấn luyện viên + nhóm 5 bạn) và **1 huấn luyện viên** (chủ repo).
- Thiết bị: **laptop**, màn hình tối thiểu 1280×720, chuột + bàn phím.
- Ngôn ngữ giao diện: **chỉ tiếng Việt**.
- Mascot: gấu trúc pixel **Măng**.
- Có liên quan tới cuộc thi robot **AIROC 2026** (Leanbot): Thế giới 6 "Thành Phố Robot" mô phỏng sa bàn thi.

**App có HAI khóa, chung một tài khoản** (ADR-0028). Đăng nhập xong bé vào `/hub` rồi chọn:

| Khóa | Dạy gì | Nội dung ở đâu | Tài liệu |
|---|---|---|---|
| **CodeQuest** `/map` | Tư duy lập trình, 10 thế giới, Blockly | `content/worlds/` | `docs/product/` |
| **Leanbot** `/leanbot` | Robot Leanbot thật, đi thi AIROC | `content/leanbot/` | `docs/leanbot/` |

Hai khóa **không trộn vào nhau**: Leanbot không phải một thế giới, không lên bản đồ, không
đụng sao/coin/mở khóa của CodeQuest. Chúng chỉ dùng chung tài khoản bé và bộ giao diện
`src/ui`. Muốn thêm môn thứ ba thì thêm một thẻ ở `/hub`, **không dựng web mới**.

## 2. Đọc gì trước (theo thứ tự)

1. `docs/README.md` — bản đồ tài liệu, **tài liệu nào là nguồn chuẩn cho chủ đề nào**
2. `docs/glossary.md` — thuật ngữ Việt ↔ code. **Dùng đúng thuật ngữ này** trong code và nội dung
3. `docs/architecture/overview.md` — kiến trúc tổng thể, ranh giới module
4. Tài liệu chuyên đề của phần bạn sắp sửa (xem bảng trong `docs/README.md`)
5. `docs/conventions/coding-standards.md`
6. Nếu đang thực hiện một task trong roadmap: `docs/roadmap/phase-*.md`

**Và đọc mục 9 của chính file này** trước khi bắt tay vào việc mới: nó ghi những sai lầm
đã thật sự xảy ra trong repo này, kèm lý do. Đọc 2 phút để khỏi mất nửa ngày.

## 3. Quy tắc vàng (không được phá)

1. **Package headless không được đụng DOM.** `packages/engine`, `packages/games`, `packages/rewards`, `packages/content-schema`, `packages/validator` phải chạy được trên Node thuần. Không `window`, `document`, PixiJS, React. (`blockly` được phép vì chạy headless được.) Lý do: bộ kiểm chứng màn chơi và unit test chạy trên Node.
2. **Mô phỏng phải tất định (deterministic).** Trong code mô phỏng không dùng `Math.random()` hay `Date.now()`; dùng `ctx.rng` và bộ đếm bước. Cùng chương trình + cùng màn ⇒ cùng kết quả.
3. **Nội dung là dữ liệu.** Màn chơi, bài giảng, gợi ý, vật phẩm cửa hàng nằm trong `content/` dạng JSON, được kiểm tra bằng schema zod. Không hard-code nội dung bài học trong code React.
4. **Mọi màn chơi phải qua `npm run content:check`**: lời giải chạy thắng, số khối ≤ `par` ≤ `maxBlocks`, toolbox chứa đủ khối của lời giải.
5. **Code tiếng Anh, giao diện tiếng Việt.** Tên biến, hàm, file, commit, comment: tiếng Anh. Chữ hiển thị cho bé: tiếng Việt, theo `docs/design/ui-copy-guide.md`.
6. **Chữ cho trẻ em phải ngắn.** Bong bóng thoại ≤ 12 chữ, không thuật ngữ khó, không câu chê bai.
7. **Logic phần thưởng là hàm thuần (pure function) và có unit test.** Coin/sao sai sẽ làm hỏng động lực của bé.
8. **Không thu thập dữ liệu cá nhân của trẻ** ngoài biệt danh, avatar và tiến độ học. Không analytics bên thứ ba. Xem `docs/architecture/security-privacy.md`.
9. **Font pixel phải có tiếng Việt.** Chỉ dùng VT323 (hoặc Handjet). Cấm Press Start 2P, Pixelify Sans, Silkscreen, Tiny5, Jersey 10 và mọi font không có bộ `vietnamese`.
10. **Không tự ý thêm dependency.** Thư viện mới cần ADR trong `docs/adr/`, hoặc ít nhất phải được ghi vào `docs/architecture/tech-stack.md` kèm lý do.

## 4. Bản đồ repo

```
apps/web/            Ứng dụng React (giao diện, Blockly UI, sân chơi PixiJS, lưu trữ)
packages/engine/     Runtime: sinh code → sandbox js-interpreter → event log → kết quả; hint engine
packages/games/      Từng kiểu game: khối lệnh + generator + mô phỏng + chấm bài (headless)
packages/rewards/    Sao, coin, huy hiệu, streak, mở khóa (hàm thuần)
packages/content-schema/  Schema zod cho world/level/lesson/hint/shop + type TS
packages/validator/  Luật kiểm chứng cấp màn + vét cạn par (dùng chung cho content:check và level editor)
content/             Dữ liệu bài học (JSON) — nguồn của toàn bộ chương trình học
                       worlds/  CodeQuest · leanbot/  khóa Leanbot (ADR-0028)
assets/              Ảnh gốc (sprite, tileset) trước khi xử lý
tools/               Script: làm sạch sprite, kiểm chứng nội dung, level editor
supabase/            Migration SQL + edge function (từ Giai đoạn 2)
design/              Style board, mockup
docs/                Toàn bộ tài liệu
```
Mỗi thư mục chính có `README.md` riêng mô tả trách nhiệm và quy tắc. Đọc README đó trước khi sửa trong thư mục.

## 5. Lệnh thường dùng

```bash
npm install              # cài đặt (Node 22, npm workspaces)
npm run dev              # chạy web ở http://localhost:5173
npm run typecheck        # tsc -b (project references) cho toàn bộ workspace
npm run lint             # eslint
npm run test             # vitest (unit, headless)
npm run content:check    # kiểm chứng toàn bộ màn chơi
npm run par -- --world w02   # vét cạn par/parEdits (hoặc: npm run par -- w02-l05)
npm run e2e              # playwright (1280×720, 1366×768), tự chạy server riêng ở cổng 5199 (không dùng 5173 của HLV)
npm run build            # build production
npm run sprites -- <in.png> <outDir>   # làm sạch sprite sheet
npm run sprites:pack -- <dir>          # tạo spritesheet cho PixiJS (pack.py có từ P0-06)
```

## 6. Định nghĩa "xong" (Definition of Done)

Một thay đổi chỉ được coi là xong khi:
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run content:check` đều xanh. (Từ P0-01 cả 4 lệnh đều tồn tại; `content:check` lúc đầu chỉ kiểm schema và ID, xem `content-model.md` §7.)
- [ ] Logic mới trong package headless có unit test
- [ ] Thay đổi có giao diện (màn chơi, màn hình, khối mới): **AI** chạy `npm run dev` và kiểm bằng một test Playwright (hoặc thêm vào bộ e2e có sẵn) đi qua đúng phần đã đổi. Có ảnh chụp màn hình trong PR. Riêng **nội dung màn chơi mới** còn cần huấn luyện viên chơi thử trước khi merge (`conventions/content-authoring.md` §6). AI không được tự đánh dấu mục đó là xong.
- [ ] Chữ hiển thị tiếng Việt đúng hướng dẫn (ngắn, có dấu, giọng Măng)
- [ ] Tài liệu liên quan đã cập nhật (nếu đổi kiến trúc → cập nhật doc kiến trúc hoặc thêm ADR)
- [ ] Không có `any`, `@ts-ignore`, `console.log` thừa

Báo cáo kết quả **thật**: lệnh nào đỏ thì nói đỏ, kèm output. Bước nào chưa làm được thì nói rõ.

## 7. Quy trình làm việc theo loại việc

| Việc | Playbook |
|---|---|
| Thêm / sửa một màn chơi | `docs/playbooks/add-level.md` |
| Thêm một khối lệnh | `docs/playbooks/add-block.md` |
| Thêm một kiểu game | `docs/playbooks/add-game-kind.md` |
| Thêm sprite / tileset / âm thanh | `docs/playbooks/add-asset.md` |
| Cho bé chơi thử và thu phản hồi | `docs/playbooks/playtest.md` |
| **Thêm một bài của khóa Leanbot** | `docs/leanbot/README.md` mục "Thêm một bài mới" |
| Ghi lại một quyết định kiến trúc | `docs/adr/README.md` |

## 8. Khi không chắc chắn

- Câu hỏi về **sản phẩm hoặc cách dạy** (luật chơi, độ khó, câu chữ cho bé) → `docs/product/`. Nếu tài liệu không trả lời được, hỏi huấn luyện viên, đừng tự đoán.
- Câu hỏi **kỹ thuật thuần** mà tài liệu không nói (tên hàm nội bộ, cách tổ chức file trong một module): tự quyết theo `conventions/coding-standards.md`, ghi lại lựa chọn trong PR.
- Câu hỏi về **API của Blockly** → mã nguồn tại https://github.com/RaspberryPiFoundation/blockly và tài liệu tại https://docs.blockly.com (link `developers.google.com/blockly` đã cũ).
- Hai tài liệu mâu thuẫn nhau → làm theo tài liệu được ghi là **nguồn chuẩn** trong `docs/README.md`, rồi báo lại để sửa tài liệu còn lại.

## 9. Sai lầm đã xảy ra, đừng lặp lại

Ghi ngày 21/10/2026, sau một phiên làm việc mà **ba hướng bị làm rồi bỏ**. Mỗi mục là một
việc đã thật sự xảy ra, không phải lời khuyên chung chung.

### 9.1. Đọc nội dung nguồn TRƯỚC khi viết nội dung

Bài 0 của khóa Leanbot bị viết lại từ đầu, vì bản đầu lắp từ trang trợ giúp công khai của
nhà sản xuất trong khi **khóa gốc mở đầu bằng 7 chương "System Configuration"** mà không ai
mở ra đọc. Bản đầu bỏ sót toàn bộ phần cầm robot, sạc, kiểm tra, hiệu chỉnh — tức đúng phần
quan trọng nhất.

**Luật:** nội dung dịch hoặc bám theo một khóa có sẵn thì **bóc nội dung khóa đó trước**.
Với Pythaverse, nội dung nằm trong H5P (`window.H5PIntegration`), không nằm trong HTML; cách
lấy ở `docs/leanbot/nen-tang/pythaverse.md`. Trang trợ giúp công khai của nhà sản xuất
**không thay thế được** nội dung khóa.

### 9.2. Tài liệu cho người lớn ≠ bài học cho bé

Giáo án trong `docs/leanbot/giao-an/` viết cho **người lớn đứng lớp**: mỗi bài vài nghìn
chữ, có bảng và khối code. Có lần chúng được dựng thẳng thành trang đọc trong app cho bé
(ADR-0027, đã bỏ). Hỏng không phải vì kỹ thuật mà vì nội dung: bé lớp 4 lướt dọc trang chữ
đó thì không học được gì.

**Luật:** bài cho bé là **dữ liệu riêng** trong `content/leanbot/*.json`, chia theo màn, mỗi
màn một ý. `LeanbotLessonSchema` **giới hạn độ dài từng trường** để không ai dán được cả
trang chữ vào. Một màn không vừa thì **tách thành hai màn**, đừng rút gọn câu cho vừa.

### 9.3. Môn mới không phải web mới

Khóa Leanbot từng được dựng thành một trang riêng ở cổng khác, với tài khoản riêng và tiến
độ riêng. Sai: huấn luyện viên dạy cùng một nhóm bé, và mỗi môn mới lại sinh thêm một địa
chỉ phải nhớ.

**Luật:** một app, nhiều khóa, một tài khoản. Thêm môn = thêm một thẻ ở `/hub` (ADR-0028).

### 9.4. Cũng đừng trộn khóa nọ vào khóa kia

Hướng ngược lại cũng đã thử: nhét khóa Leanbot thành một thế giới của CodeQuest. Hỏng vì
`worlds/` có schema cho **màn chơi** — `levelIds`, luật mở khóa theo tỉ lệ sao, `par`, lời
giải chạy được trong CI — mà bài Leanbot không có thứ nào trong đó.

**Luật:** khóa mới thì **thư mục nội dung mới + schema mới**, đừng bẻ cong mô hình màn chơi.

### 9.5. Hỏi trước khi dời, không hỏi khi đã muộn

Ba hướng trên đều bị bỏ **sau khi đã viết code**, vì người viết đoán ý thay vì hỏi. Mỗi lần
bỏ mất cả buổi.

**Luật:** việc **khó lùi** (dời thư mục, đổi route sau khi đăng nhập, đổi schema, xóa tài
liệu) thì hỏi huấn luyện viên **trước**, kèm 2–3 phương án cụ thể. Việc dễ lùi thì cứ làm
rồi báo.

### 9.6. Chạy lệnh rồi mới nói "xong"

Có lần báo "PDF đã tô nền mọi đáp án" trong khi thật ra chỉ 48/155 đáp án được nhận ra: các
dòng bắt đầu bằng `1)` `2)` bị markdown hiểu là danh sách và nuốt luôn dòng đáp án ngay dưới.
Lỗi chỉ lộ ra khi có **bộ đếm so khớp hai con số**.

**Luật:** mọi khẳng định về số lượng phải có lệnh đếm được, và nên có **bộ chặn tự động**
thay vì mắt người. Ví dụ đang dùng: `content:check` so số đáp án trong markdown với số dựng
ra, và luật 18 kiểm ảnh tồn tại. **Thử phá có chủ đích** để chắc bộ chặn còn bắt được.

### 9.7. Thêm tệp nội dung thì phải khởi động lại `npm run dev`

Đã mất thì giờ ba lần vì cùng một chuyện: thêm `content/leanbot/bai-0N.json` xong, mở
`localhost:5173` thì thấy **"Không tìm thấy bài này."** và tưởng mình viết sai dữ liệu. Thật ra
Vite chốt danh sách `import.meta.glob` **lúc khởi động**, nên tệp mới không có trong gói cho
tới khi chạy lại dev server. Ảnh chụp màn hình lúc đó là ảnh của trang lỗi, không phải của bài.

**Luật:** thêm **tệp mới** trong `content/` thì khởi động lại `npm run dev` trước khi chụp màn
hình hay kết luận. Sửa nội dung trong một tệp đã có thì không cần. Bộ e2e tự dựng server riêng
nên không dính lỗi này — e2e xanh mà màn hình đỏ thì gần như chắc chắn là nó.

### 9.8. Báo cả phần chưa làm được

Khi một mục của "Định nghĩa xong" chưa làm được (chưa có e2e, chưa xem được video hướng dẫn,
chưa chạy thử trên robot thật) thì **nói thẳng ở cuối báo cáo**, đừng im lặng. Riêng mục
"huấn luyện viên chơi thử" thì **AI không bao giờ được tự tích**.
