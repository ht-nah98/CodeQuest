# Âm thanh & giọng đọc

Nguồn chuẩn cho hiệu ứng âm thanh, nhạc nền và giọng đọc của Măng (task P1-14). Phong cách âm thanh: `design/art-direction.md` §6. Câu nào có giọng đọc: `design/ui-copy-guide.md` §5. ID câu thoại: `content-model.md` §2.

## 1. Tổng quan

```
tools/audio/  ──npm run audio:gen──▶ apps/web/public/audio/{sfx,music}/*.mp3
tools/voice/  ──npm run voice -- build──▶ apps/web/public/audio/voice/<id câu>.mp3
                                    └──▶ apps/web/src/audio/voiceManifest.json (câu nào có file)
apps/web/src/audio/  AudioManager (Howler) · useAudio() · AudioProvider · bảng tra
```

- Mọi file âm thanh tự host, tải từ chính app (`media-src 'self'`, `connect-src 'self'`, `security-privacy.md`). Không gọi dịch vụ TTS lúc bé chơi.
- Ba kênh âm lượng riêng: **nhạc**, **hiệu ứng**, **giọng đọc**, lưu trong `ProfileSettings` (`musicVolume`, `sfxVolume`, `voiceVolume`, 0..1). Kéo một thanh về 0 là tắt riêng kênh đó.

## 2. `apps/web/src/audio/`

| File | Việc |
|---|---|
| `AudioManager.ts` | Chủ duy nhất của mọi âm thanh. Không tạo gì trước cử chỉ đầu tiên của người dùng (chính sách autoplay): trước `unlock()` hiệu ứng bị bỏ qua, bài nhạc muốn phát chỉ được ghi nhớ. Phát hiệu ứng (`playSfx(name, { rate })`, chặn lặp quá nhanh 35 ms), nhạc nền lặp (`playMusic(track)`, mờ vào/ra 400 ms, mỗi bài một Howl dùng lại), giọng đọc (`playVoice(id)`, mỗi lúc một câu, `speaking`, `stopVoice(token?)`; giữ tối đa 10 câu đã nạp, câu cũ nhất bị `unload`; file lỗi thì `unload` và lần sau nạp lại). Khi Măng nói, nhạc **hạ xuống 30%** (ducking), đọc liền nhiều câu thì nhạc vẫn hạ, hết câu mới lên lại. `stopAll()` tắt nhạc + giọng. Tab ẩn (`visibilitychange`) hoặc `setMuted(true)` thì tắt tiếng toàn bộ. Howler nằm sau interface `AudioBackend` để test bằng backend giả |
| `howlerBackend.ts` · `audio.ts` | Howler 2.2.4 (Web Audio, định dạng `mp3`); `audio` là instance dùng chung |
| `volume.ts` | Toán âm lượng (hàm thuần, có test): `gain = slider² × mức kênh × mức từng âm`, mức kênh nhạc 0,35 · hiệu ứng 0,8 · giọng 1 (nhạc "mặc định nhỏ"), ducking × 0,3 |
| `useAudio.ts` | `useAudio()` → `{ playSfx, playVoice, stopVoice, hasVoice, playMusic, speaking }`; `useMusic(track)` (phát nhạc khi màn hình đang hiện); `useVoiceLine(id)` (nút 🔊). Dùng được cả khi không có `AudioProvider` (test, trang dev) |
| `AudioProvider.tsx` | Gắn một lần trong `App.tsx`, bên trong `CurrentProfileProvider`: đồng bộ âm lượng của hồ sơ (áp dụng ngay), mở khóa âm thanh ở `pointerdown`/`keydown` đầu tiên, theo dõi tab ẩn, và **tiếng click cho mọi `ui/Button`** bằng một listener ủy quyền trên `document` (nút có `data-variant`). `data-sfx="coin"` đổi âm, `data-sfx="none"` tắt tiếng cho một nút |
| `sfxCatalog.ts` | Bảng hiệu ứng + mức âm từng cái, 2 bài nhạc, URL file |
| `stageSfx.ts` | `stageSfx(eventType)`: event của sân chơi → hiệu ứng; `RUN_SFX` (bấm Chạy, chạy thua); `blocklySfx(event)`: event Blockly → `snap`/`drop` |
| `voiceIds.ts` | Tạo ID câu thoại theo `content-model.md` §2 |
| `voiceManifest.ts` · `voiceManifest.json` | Danh sách câu đã có file giọng (do `tools/voice` sinh, đóng gói cùng app nên biết ngay có hiện 🔊 hay không). Câu không có trong danh sách thì **không có nút 🔊** |

### Hiệu ứng (`tools/audio/src/sfx.ts`, tự tạo)
| Tên | Khi nào |
|---|---|
| `click` | Bấm `ui/Button` (tự động) |
| `snap` · `drop` | Khối khớp vào nhau · thả khối rời / xóa khối |
| `run` | Bấm ▶ Chạy (`RUN_SFX.start`) |
| `step` · `jump` · `kick` · `collect` | Event `walk`/`move` · `jump` · `kick` · `collect` |
| `fall` · `bump` | Rơi hố / ra khỏi đường · đâm tường, cành (tiếng "boing", không dùng còi báo lỗi) |
| `wrong` | Thua (`missed`, `RUN_SFX.fail`), hai nốt đi xuống nhẹ nhàng |
| `win` · `fanfare` | Măng tới cờ · màn Kết quả |
| `star` · `coin` · `unlock` | Từng sao (cao dần: `rate` 1 · 1,12 · 1,26) · xu bay vào ví · mở thế giới mới |
| `page-turn` | Lật thẻ bài giảng |

### Nhạc nền
`village` (bản đồ, thế giới, bài giảng; 90 BPM, 21 giây) và `adventure` (màn chơi; 112 BPM, 17 giây). Mỗi bài đúng 8 ô nhịp để lặp tròn. Đây là bản tạm do code sinh, chờ HLV duyệt.

## 3. Đã nối / chưa nối

Đã nối (P1-14):
- `ui/SpeakButton` (nút 🔊 "Đọc to", prop `voiceId`; không hiện gì khi câu chưa có file giọng) và `ui/Bubble` dùng nó qua prop `voiceId`. Bấm để đọc, bấm lại để dừng; nút ở trạng thái nhấn khi đang đọc; bubble bị gỡ hoặc đổi câu thì chỉ dừng **lượt đọc do chính nó bật** (token), không dừng câu bubble khác vừa bật. `onSpeak` cũ vẫn dùng được và được ưu tiên.
- Bài giảng: giọng cho từng thẻ (`lessonCardVoiceId`), giải thích quiz (`.explain`), "Giờ mình vào chơi nhé!"; tiếng `page-turn` khi lật thẻ (phím hoặc nút; hai nút Trước/Tiếp có `data-sfx="none"` để không kêu hai lần); nhạc `village`.
- Bản đồ, Thế giới: nhạc `village`; bubble Thế giới có giọng (`world.lessonFirst` / `world.newBlockFirst` / mục tiêu màn kế tiếp / `world.allDone`). Tạo hồ sơ: bubble từng bước. Nhắc nghỉ, màn hình nhỏ, màn lỗi: nút 🔊 cạnh câu của Măng. Màn lỗi (`ErrorBoundary.componentDidCatch`) tắt nhạc và giọng (`audio.stopAll()`).
- Màn Kết quả (`screens/play/ResultsOverlay.tsx`): `fanfare` khi mở, `star` theo nhịp sao hiện ra (giảm chuyển động: một tiếng `star` ngay, không giãn nhịp), `coin` khi xu bay, `unlock` khi mở thế giới mới; câu của Măng và ID giọng (`ui.results.*`) lấy từ **một** bảng (`LINE_TEXT`/`STAR_LINES`).
- Cài đặt: kéo thanh âm lượng thì áp dụng ngay và nghe thử (hiệu ứng: `coin`; giọng: một câu mẫu nếu đã có giọng; nhạc: phát 2,5 giây rồi trả lại bài cũ).
- Tiếng click cho mọi `ui/Button` (bỏ qua nút `disabled` / `aria-disabled="true"`; `data-sfx` lạ thì cảnh báo ở bản dev). Đăng xuất (không còn hồ sơ) → âm lượng về mặc định.

- Màn chơi (P1-07 phần 2, `screens/play/PlayScreen.tsx`):
  - Nhạc `adventure` (`useMusic`).
  - Hiệu ứng theo event khi phát lại: `StageController`/`Replay` có hook `onEvent(event)`, gọi **ngay trước** khi hoạt ảnh của event bắt đầu, trên đúng đồng hồ của replay (theo tốc độ, tạm dừng, từng bước; không thêm bộ hẹn giờ). Màn chơi gọi `audio.playSfx(stageSfx(event.type))`. Lượt thua (kể cả chọn sai ở `predict`) kết thúc bằng `RUN_SFX.fail` (`wrong`), **trừ khi** event cuối của lượt phát lại đã kêu `wrong` (`missed`): không kêu hai lần. Event `win` không có tiếng riêng: màn Kết quả mở ra với `fanfare`.
  - ▶ Chạy: **một** tiếng `run` mỗi lần bắt đầu chạy, do `run()` phát (bấm nút, `Space` hay `S` đều như nhau); bấm Dừng thì `click`. Nút để `data-sfx="none"`: listener click chung đọc `data-sfx` **sau** khi React đã vẽ lại nút thành "Dừng" (sự kiện click rời rạc được flush đồng bộ), nên `data-sfx="run"` trên nút sẽ kêu `click` thay vì `run`.
  - Bong bóng của Măng mang `voiceId`: `ui.play.*` cho câu cố định của `vi.play` (`ready`, `readyByMode.<mode>`, `running`, `stepping`, `paused`, `win`, `bughunt.win`, `creative.done`, `predict.*`, `creative.saved`…), `feedbackVoiceId(reason, levelId nếu màn ghi đè)` cho câu phản hồi, `hintVoiceId` / `ui.hints.global.<id>` cho gợi ý tầng 0. Câu có số (khen số khối, xu khi lưu) không có giọng. Dòng mục tiêu có nút 🔊 (`levelVoiceId(id, 'objective')`, chỉ hiện khi có file). Hộp gợi ý: `thinkingHint` → `levelVoiceId(id, 'thinking')`.
  - Blockly: `sounds: false` (tiếng có sẵn của Blockly không theo thanh âm lượng); change listener của `BlocklyWorkspace` gọi `audio.playSfx(blocklySfx(event))` cho sự kiện có `recordUndo` (nạp chương trình thì im lặng): nối khối → `snap`, thả khối rời / xóa khối → `drop`.

Lưu ý: câu đang hiển thị trong bubble chỉ có giọng khi đúng ID với `tools/voice` (ví dụ bubble ghép từ nhiều nguồn thì không có giọng). Câu có số (hàm trong `vi.ts`) không bao giờ có giọng.

## 4. Sinh hiệu ứng & nhạc: `npm run audio:gen`
- `tools/audio/src/synth.ts`: bộ tổng hợp chiptune nhỏ (sóng vuông/xung/tam giác/sine/nhiễu LFSR, envelope, trượt cao độ, vibrato, lọc thông thấp), **tất định** (không `Math.random`): cùng công thức → cùng file WAV từng byte (có test). MP3 chỉ giống từng byte khi dùng cùng phiên bản ffmpeg/LAME; khác phiên bản có thể lệch vài byte, nghe như nhau. Công thức ở `sfx.ts` và `music.ts`.
- Mã hóa MP3 bằng `ffmpeg` (libmp3lame, mono 22,05 kHz, 48 kbps hiệu ứng / 40 kbps nhạc, `bitexact`, không metadata). `--wav-only` ghi WAV vào `tools/audio/.out/` (gitignore) để nghe thử khi chỉnh công thức.
- Kích thước hiện tại: 17 hiệu ứng ≈ 42 KB, 2 bài nhạc ≈ 189 KB, tổng ≈ 231 KB (test giữ dưới 300 KB). Mỗi hiệu ứng ≤ 1 giây (có test).
- Âm lượng cân bằng bằng **đỉnh** (peak) theo từng công thức + mức trong `sfxCatalog.ts`, không đo −16 LUFS như `playbooks/add-asset.md` (âm dài < 0,4 giây đo LUFS không tin cậy). Đổi file thì chạy lại lệnh và commit kết quả.

## 5. Giọng đọc: `npm run voice -- …`
Xem `tools/voice/README.md` (cách HLV cắm dịch vụ TTS). Tóm tắt:
- `lines`: liệt kê mọi câu cố định cần giọng (`content/` + danh sách khóa `vi.ts` trong `tools/voice/src/uiLines.ts`) → `tools/voice/.out/lines.json`.
- `check`: câu nào chưa có giọng hoặc giọng đã cũ (chữ đổi sau khi sinh, so bằng hash).
- `build --provider <id>`: sinh file thiếu, xóa file thừa, ghi `voiceManifest.json`. Không xóa file còn đúng chữ khi provider không có âm cho câu đó; từ chối `--provider none` khi đã có giọng hoặc kèm `--force`. Manifest được kiểm bằng zod; ID chỉ gồm chữ, số, `.` `_` `-`. Provider có sẵn: `none` (mặc định, không sinh gì) và `files` (lấy `<id>.mp3` đã thu âm sẵn hoặc xuất từ công cụ TTS).
- ID: `<level>.objective` · `<level>.thinking` · `<level>.hint.<hintId>` · `<level>.feedback.<REASON>` (câu feedback riêng của màn) · `<lesson>.c<n>` · `<lesson>.c<n>.explain` (giải thích của thẻ quiz) · `<world>.story.<chapterId>.<n>` (dòng n, đếm từ 1, của một chương truyện, P2-24) · `feedback.<REASON>` · `ui.<khóa vi.ts>`. Bỏ qua thế giới nháp `_*` và màn `retired`.
