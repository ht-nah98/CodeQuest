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

Ghi ngày 21/10/2026, sau một phiên làm việc mà **ba hướng bị làm rồi bỏ**; mục 9.8–9.19 thêm
ngày 22/10/2026, sau khi bật CI và đẩy lên production lần đầu. Mỗi mục là một việc đã thật sự
xảy ra, không phải lời khuyên chung chung.

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

### 9.8. Chạy ĐỦ bộ kiểm rồi mới báo xanh

Ngày 21/10 có bốn lần liền báo "e2e 16/16 xanh" trong khi chỉ chạy `leanbot.spec.ts`. Bộ đầy
đủ có **398 test**, và 4 trong số đó đã đỏ từ lúc đổi luồng đăng nhập — gồm cả test `@smoke` mà
CI chạy. Chỉ lộ ra khi chạy cả bộ trước lúc đẩy.

**Luật:** thay đổi đụng tới thứ dùng chung (route, đăng nhập, layout, thanh trên, catalog) thì
chạy **`npm run e2e` đầy đủ**, không chạy riêng spec của phần mình. Báo con số của cả bộ, và
đừng chạy `npm run build` trong lúc e2e đang chạy: `pwa-offline.spec.ts` phục vụ chính `dist/`.

### 9.9. Đổi đường đi chung thì đi lại cả hai chiều

Đăng nhập chuyển sang `/hub` (ADR-0028). Chiều vào thì đã kiểm, chiều ra thì không: bản đồ
CodeQuest **mất nút quay về hub**, bé chọn CodeQuest rồi là không về được khóa Leanbot nếu không
gõ URL. Huấn luyện viên phát hiện ra, không phải bộ kiểm.

**Luật:** thêm hay dời một màn hình thì liệt kê mọi màn **dẫn tới** nó và mọi màn **nó dẫn
đi**, rồi có e2e đi trọn vòng (ví dụ `map → hub → map` trong `leanbot.spec.ts`).

### 9.10. Gộp vào `main` là lên production

`main` tự deploy lên Vercel. Thế giới 10 đã lên bản đồ của bé khi mới có 13/20 màn và chưa có
boss — một hòn đảo bé đi vào mà không có đích. Phát hiện bằng cách mở chính trang production ra
đếm số đảo.

**Luật:** thứ chưa xong không được để bé nhìn thấy. Đã có chặn tự động: thế giới **chưa có màn
boss thì không lên bản đồ** (`features/content/catalog.ts`, có test). Thứ dang dở khác thì phải
có cách ẩn tương tự **trước** khi gộp, không phải sau. Sau mỗi lần đẩy, mở production kiểm.

### 9.11. CI phải thật sự chạy, và trần thời gian đặt theo máy chậm nhất

Repo có `.github/workflows/ci.yml` từ 02/10 mà **GitHub Actions chưa chạy lần nào** (tính năng
đang tắt). Bật lên thì lòi ra bốn lỗi có sẵn, toàn về thời gian trên máy ảo 2 nhân không GPU:
test vét cạn W6 quá 240 s, 4 worker làm sân chơi bị bỏ đói, chờ 20 s cho robotlab là không đủ,
và **`test.describe.configure({ timeout })` trong từng spec đè lên trần ở config**.

**Luật:** sau khi đẩy, xem CI xanh thật (`gh run list`), đừng giả định. Trần thời gian mới phải
có nhánh `process.env.CI ? …` (đang dùng ×2,5), và đặt ở **mọi** chỗ có trần, không chỉ config.

### 9.12. Tên hàm thì hỏi trình biên dịch, đừng tin tài liệu

Giáo án Leanbot ghi `LbMotion.stop()`, `Leanbot.delay(1.0)`, `Leanbot.objectInFront(25)`,
`LbTouch.waitUntil(TB1A)` — **cả bốn không tồn tại**, hai trong số đó đã lọt vào màn hình của bé.
Lộ ra khi biên dịch thật trên máy chủ của hãng và nạp xuống robot.

**Luật:** code nào in ra cho bé hay cho thầy thì phải **biên dịch được**. Leanbot: POST tới
`cs.leanbot.space/v3/compile` (cách làm ở `docs/leanbot/thiet-bi/cai-dat.md`); log lỗi của gcc
còn liệt kê được chữ ký hàm thật.

### 9.13. Bộ vét cạn là người duyệt nội dung, đọc kỹ những gì nó in ra

Màn `w10-l06` chọn hai kệ bằng tay, và `npm run par` in ra **ba** cách sửa thay vì một: hai cách
"cộng bừa 1 rồi bỏ sót một cuốn" thắng vì hai cái sai triệt tiêu nhau đúng trên hai kệ đó. Không
có lỗi đỏ nào cả — chỉ có dòng `fix:` thừa.

**Luật:** dòng `fix:` / `shortest:` khác lời giải là **dấu hiệu bản đồ yếu**, không phải chuyện
vặt. Chọn kệ / bản đồ bằng script thử mọi cách sai đã biết, và khai báo chúng trong
`SORTER_TRAPS`. Vét cạn dừng vì ngân sách thì đặt `parUnproven: true`.

### 9.14. Thêm tài sản thì đo lại ngân sách

Ba ảnh phần cứng Leanbot vào repo ở dạng PNG 1600 px, 1,8 MB, đẩy precache của PWA lên
6 332 KiB, **vượt ngân sách 5 MiB** — mỗi bé tải thêm chừng ấy ở lần mở đầu. Giảm còn 1140 px,
bảng màu 256: 292 KB, chữ trên ảnh vẫn rõ.

**Luật:** thêm ảnh, âm thanh hay font thì đọc dòng `precache N entries (… KiB)` ở cuối
`npm run build` và so với `deployment-ops.md`.

### 9.15. Nhắc tới công cụ thì đưa luôn đường dẫn

Khóa Leanbot có 9 màn viết "mở trình soạn khối lệnh", "cài driver CH340", "dùng Chrome"… mà
**không có một link nào**; gần 40 đường dẫn quan trọng chỉ nằm rải rác trong giáo án markdown, bé
và thầy không thấy. Schema khi đó chỉ cho một `link` mỗi màn, nên đã chẳng gắn ở đâu cả. Huấn
luyện viên phát hiện khi dạy.

**Luật:** chữ nào nhắc một trang web hay công cụ thì màn đó mang link của nó (`links`), và mọi
đường dẫn của khóa nằm chung ở `content/leanbot/duong-dan.json` (`/leanbot/duong-dan`).

### 9.16. Báo cả phần chưa làm được

Khi một mục của "Định nghĩa xong" chưa làm được (chưa có e2e, chưa xem được video hướng dẫn,
chưa chạy thử trên robot thật) thì **nói thẳng ở cuối báo cáo**, đừng im lặng. Riêng mục
"huấn luyện viên chơi thử" thì **AI không bao giờ được tự tích**.

### 9.17. Đừng chờ một giá trị chỉ sống vài khung hình

Test smoke của sân robot đỏ trên CI suốt ba lần đẩy, và đã bị đổ cho "máy ảo yếu, sân chơi
đứng": nâng trần chờ từ 20 s lên 90 s mà vẫn đỏ. Tái hiện trên máy này bằng
`CI=1 taskset -c 0,1 npm run e2e -- --grep @smoke` (2 nhân như máy GitHub) thì ảnh lúc hỏng cho
thấy **robot đã chạy xong, ba sao**. Test chờ đồng hồ hiện đúng số `19` — số chỉ sống vài khung
hình — và máy bận thì bước dò bỏ lỡ nó, rồi ngồi chờ một con số không bao giờ quay lại. Trên CI
cũng không xem được gì vì reporter `github` không sinh `playwright-report`, nên bước tải lên luôn
rỗng.

**Luật:** muốn kiểm các bước giữa chừng của một lần chạy thì **ghi lại** bằng
`recordAttributes` / `attributeHistory` (`e2e/helpers.ts`, dùng MutationObserver, không sót lần
ghi nào) rồi kiểm thứ tự **sau khi chạy xong**, đừng `waitForFunction` từng giá trị. Test đỏ vì
quá thời gian thì **mở ảnh lúc hỏng trước** khi nâng trần: nâng trần chỉ đúng khi ảnh cho thấy
việc thật sự chưa xong.

### 9.18. Ý nhiều khối thì đừng làm ghép hình

`w10-l16` (dừng sớm, 11 khối) được lên kế hoạch là ghép hình. Vét cạn tìm ra **ít nhất 186 cách
ghép thắng**, có cả cách sai hẳn mà thắng nhờ may (đổi một cặp sách chẵn lần, rồi hộp tình cờ về
0). Ghép sẵn một phần cũng không giúp: bé tháo rời được nên bộ tìm coi mọi khối là rời. Màn ghép
hình lại chỉ có một bản đồ, không có `variants` để chặn mẹo.

**Luật:** ghép hình chỉ cho ý **ít khối** (≤ 6 như `l02`, `l08`). Ý nhiều khối thì dùng **tìm
lỗi nhiều kệ / nhiều bản đồ**, chọn bản đồ sao cho cách "số lượt cố định" thua ở ít nhất một
cái, và đọc dòng `fix:` của `npm run par` tới khi chỉ còn một. Đổi kiểu màn so với
`curriculum.md` thì hỏi HLV trước (§9.5).

### 9.19. Repo chuyển chỗ thì `.env.local` không đi theo

HLV mở `localhost:5173` để chơi thử thì **không thấy hồ sơ HLV**, và tưởng AI đã xóa. Thật ra
repo ở `~/Desktop/CodeQuest` chưa từng có `apps/web/.env.local`, vì tệp này bị git bỏ qua nên clone
hay chép repo đều không mang theo. Không có `VITE_COACH_PIN` thì dev server không tạo hồ sơ HLV.
Code không bao giờ xóa hồ sơ này.

**Luật:** trước khi nhờ HLV chơi thử ở local, kiểm `apps/web/.env.local` có `VITE_COACH_PIN`
(xem `.env.example`) và trang chọn hồ sơ có ô "HLV". Thế giới chưa có boss vẫn ẩn cả với HLV, nên
màn mới thì tạm chép vào `content/worlds/_sandbox/levels/` (đổi `id`, `worldId: "_sandbox"`),
khởi động lại dev, gửi link `/play/<id>`, chơi xong thì xóa. Đừng commit các bản chép đó.
