# tools/voice — sinh trước giọng đọc của Măng

Giọng đọc được sinh **trước** (không gọi TTS khi bé chơi, `docs/design/ui-copy-guide.md` §5) thành `apps/web/public/audio/voice/<id câu>.mp3`, kèm danh sách `apps/web/src/audio/voiceManifest.json`. App chỉ hiện nút 🔊 cho câu có trong danh sách. Kiến trúc: `docs/architecture/audio.md`.

## Lệnh
```bash
npm run voice -- lines [--worlds w01,w02] [--out <file>]   # câu cần giọng → tools/voice/.out/lines.json
npm run voice -- check [--worlds …] [--strict]             # câu thiếu giọng / giọng cũ (--strict: exit 1)
npm run voice -- build --provider <id> [--from <dir>] [--worlds …] [--force]
```
- Câu lấy từ: màn chơi (`objective`, `thinkingHint`, `hints[].say`, `feedback` riêng của màn), bài giảng (`text` từng thẻ, `explain` của quiz), `content/shared/feedback.json`, và các khóa `vi.ts` liệt kê trong `src/uiLines.ts` (`VOICED_UI_KEYS`). `vi.ts` được **đọc như văn bản** bằng parser TypeScript, tools không import code của `apps/web`.
- Câu có số thay đổi là hàm trong `vi.ts` nên tự bị loại. Khóa trong `VOICED_UI_KEYS` mà biến mất hoặc thành hàm → lỗi.
- `build` chỉ sinh câu thiếu hoặc đã đổi chữ (so hash), câu trùng chữ chỉ gọi TTS một lần (chỉ dùng chung khi đã có âm), xóa file của câu không còn. Provider không có âm cho một câu thì file cũ chỉ bị xóa khi chữ đã đổi. `--provider none` bị từ chối khi đã có giọng hoặc kèm `--force` (tránh xóa nhầm). `check --worlds` không báo câu của thế giới khác là thừa. `--worlds` sinh riêng vài thế giới (không xóa gì của phần còn lại, bỏ qua câu `ui.*`). `--force` sinh lại hết.
- `lines.json` là file tạm (gitignore) để HLV đọc lại danh sách câu. File `.mp3` và `voiceManifest.json` thì **commit**.

## Cắm giọng đọc (HLV chọn, roadmap P1-14)
Có 3 cách, không cách nào cần sửa app:

1. **Thu giọng thật hoặc xuất tay từ một công cụ TTS**: đặt các file `<id câu>.mp3` (tên lấy từ `lines.json`) vào một thư mục, rồi
   `npm run voice -- build --provider files --from <thư mục>`.
2. **Dịch vụ TTS có API**: viết adapter `src/providers/<dịch vụ>.ts`:
   ```ts
   import type { TtsProvider } from './types';
   export function createMyTtsProvider(): TtsProvider {
     const key = process.env.MY_TTS_KEY;            // khóa để trong .env, không commit
     if (!key) throw new Error('MY_TTS_KEY is missing');
     return {
       id: 'mytts-<giọng>',                          // ghi vào voiceManifest.json
       async synthesize(line) {                      // line.id, line.text (tiếng Việt)
         const res = await fetch('https://…', { method: 'POST', headers: { … }, body: … });
         if (!res.ok) throw new Error(`TTS ${res.status} for ${line.id}`);
         return new Uint8Array(await res.arrayBuffer()); // MP3; nếu dịch vụ trả WAV thì đổi bằng ffmpeg
       },
     };
   }
   ```
   thêm một dòng vào `PROVIDERS` trong `src/providers/index.ts`, ghi tên dịch vụ + giọng vào `docs/architecture/tech-stack.md` (dòng "Dịch vụ TTS tiếng Việt"), rồi chạy `npm run voice -- build --provider mytts`.
3. Chưa chọn: provider `none` (mặc định) không sinh gì; app không hiện nút 🔊.

Khuyến nghị cho file: MP3 mono, 22–24 kHz, 48–64 kbps, cắt lặng đầu/cuối, âm lượng đều nhau giữa các câu. Nghe lại vài câu có dấu khó (ngã/hỏi) trước khi sinh toàn bộ. Sửa chữ trong nội dung xong thì chạy lại `build`: chỉ câu đã đổi được sinh lại.

## Nghiệm thu P1-14
Mọi câu cố định của Thế giới 1–2 và `feedback.json` có giọng: `npm run voice -- check --worlds w01,w02` (gồm cả `feedback.*`) không còn câu thiếu. Câu `ui.*` kiểm bằng `npm run voice -- check` (không `--worlds`).
