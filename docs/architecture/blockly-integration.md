# Tích hợp Blockly

Nguồn chuẩn cho: cách dùng Blockly 13 trong CodeQuest: wrapper React, theme, renderer, toolbox, khối, giới hạn khối, highlight, gợi ý chỉ bước tiếp, phím tắt, sự kiện.

## 1. Hai môi trường
| Nơi | Import | Mục đích |
|---|---|---|
| `packages/engine`, `packages/games`, `tools/*` (Node) | `import * as Blockly from 'blockly'` (Node tự dùng bản `core-node` + jsdom) và `blockly/javascript` | Workspace headless: nạp JSON, phân tích, sinh code. Tạo bằng `new Blockly.Workspace(new Blockly.Options({...}))`: **phải** bọc `Options`, truyền object thường sẽ lỗi `connectionChecker` |
| `apps/web` (trình duyệt) | `blockly`, `blockly/javascript`, `blockly/msg/vi`, các plugin `@blockly/*` | Workspace có hiển thị |

Định nghĩa khối và generator dùng chung cho cả hai môi trường. Khối chung `cq_start`, `cq_repeat` nằm trong `@codequest/engine` (`src/blocks/common.ts`), vì engine cần chúng để biên dịch. Khối riêng của kiểu game nằm trong `@codequest/games`. `registerBlockSpecs(specs)` của engine là hàm đăng ký duy nhất (idempotent). `runLevel` tự gọi nó; web gọi `registerAllBlocks()` của `games` một lần lúc khởi động để workspace có hiển thị dùng được mọi khối.

## 2. Wrapper React
`apps/web/src/blockly/BlocklyWorkspace.tsx`:
- `useEffect` gọi `Blockly.inject(div, options)` khi mount và `workspace.dispose()` khi unmount.
- **Mỗi màn một workspace mới:** component được render với `key={level.id}`, nên chuyển màn = dispose workspace cũ + inject workspace mới. Lý do (đã kiểm trong mã nguồn Blockly 13): `maxBlocks`/`maxInstances`/`readOnly` chỉ đặt được lúc inject, và `updateToolbox` ném lỗi *"Existing toolbox is null"* nếu workspace được tạo mà không có toolbox (trường hợp mode `parsons` → `build`).
- Trong cùng một màn, Làm lại chương trình dùng `workspace.clear()` + `serialization.workspaces.load(initial)`.
- Nhận `level`, trả ra qua callback: `onChange({ levelId, json, analysis, remainingCapacity })` (debounce 150 ms, chỉ dùng để hiển thị), `onReady(workspaceSvg, handle)`, `onDispose()`, `onMouseDragEnd()` (xem §13).
- **Bấm Chạy phải đọc workspace đồng bộ** qua `handle.getState()` (serialize + `analyzeWorkspace` + `remainingCapacity` ngay lúc gọi), **không** đọc state debounce: bé thả khối rồi nhấn Space ngay thì state debounce vẫn là chương trình cũ. `handle.flush()` giao ngay báo cáo `onChange` đang chờ. Khi gỡ workspace (unmount hoặc đổi màn), wrapper hủy thao tác di chuyển bằng bàn phím đang dở, flush báo cáo đang chờ (không bỏ mất), gọi `onDispose()` rồi mới `dispose()`. Báo cáo flush lúc đổi màn mang `levelId` của màn cũ, nên màn hình lọc theo `levelId`. `loadInitialWorkspace(ws, level)` dùng chung cho lúc inject và nút Làm lại; hàm này luôn `setDeletable(false)` cho `cq_start`, bất kể JSON nội dung ghi gì.
- **Chờ font trước khi inject** (`document.fonts.load` cho Baloo 2 và VT323, kèm chữ có dấu để tải bộ `vietnamese`): Blockly đo chữ đúng một lần lúc vẽ khối, đo bằng font dự phòng thì nhãn tràn khỏi khối khi Baloo 2 tải xong. Vì vậy `onReady` đến sau một nhịp bất đồng bộ.
- Một màn chơi chỉ có **một** workspace có hiển thị. Bài giảng dùng workspace **chỉ đọc** riêng (`readOnly: true`).

Tùy chọn `inject` chuẩn (viết bằng conditional spread vì `exactOptionalPropertyTypes` không cho gán `undefined` vào trường tùy chọn):
```ts
{
  renderer: 'zelos',
  theme: codequestTheme,
  media: '/blockly-media/',            // KHÔNG để mặc định https://static.blockly.com/media/ (xem security-privacy.md)
  toolbox: buildToolbox(level),        // luôn có flyout toolbox, kể cả parsons (rỗng + ẩn bằng CSS)
  ...(level.maxBlocks !== undefined && { maxBlocks: level.maxBlocks + 1 }),   // +1 cho cq_start, xem §5
  ...(level.maxInstances && { maxInstances: level.maxInstances }),
  trashcan: true,
  sounds: false,                       // tiếng của app qua `blocklySfx` (audio.md §3)
  move: { scrollbars: true, drag: true, wheel: true },
  zoom: { controls: true, wheel: false, startScale: 1.1, minScale: 0.7, maxScale: 1.6 },
  grid: { spacing: 24, length: 2, colour: '#D9D5EE', snap: true },
  readOnly: level.mode === 'predict',
}
```

## 3. Theme & renderer
- Renderer **`zelos`**: khối tròn, to.
- `Blockly.Theme.defineTheme('codequest', {...})` với `blockStyles` theo nhóm và `categoryStyles` cho toolbox. Màu lấy từ `docs/design/art-direction.md` §2:

| blockStyle | Dùng cho | Màu |
|---|---|---|
| `move_blocks` | khối di chuyển của mọi kiểu game | `#3A7BD5` |
| `loop_blocks` | `cq_repeat`, `cq_repeat_until` (`controls_whileUntil`) | `#D9730D` |
| `logic_blocks` | `cq_if`, `cq_if_else` (`controls_if`), `logic_*` | `#8A5CD1` |
| `sensor_blocks` | cảm biến (`*_is_ahead`, `*_is_path`…) | `#178A7E` |
| `robot_blocks` | gắp, thả… | `#A0612B` |
| `variable_blocks` | `variables_*`, `math_*` | `#D13F73` |
| `procedure_blocks` | `procedures_*` | `#5560C8` |
| `pen_blocks` | turtle | `#2F8A3E` |
| `event_blocks` | `cq_start` | `#FBC73F`, chữ màu mực |

- Code: `apps/web/src/blockly/theme.ts` (`base: Themes.Zelos`; màu import từ `ui/tokens.ts`). `colourTertiary` (zelos vẽ thành viền) = màu khối trộn 35% mực, viền 2px trong `blockly.css`, giống viền khối trên style board. `math_blocks` dùng màu biến.
- Chữ trên `cq_start` màu mực: CSS `.event_blocks > .blocklyLabelField > .blocklyText` (chỉ con trực tiếp, vì khối bên dưới nằm lồng trong `<g>` của `cq_start`).
- Font: `fontStyle: { family: '"Baloo 2", Nunito, sans-serif', weight: '700', size: 14 }`. 14pt ≈ 18,7px in đậm, đạt mức **chữ lớn** của WCAG, nên ngưỡng tương phản 3:1 của bảng màu khối là đúng chuẩn.
- Theme mù màu: tạo thêm `codequest-cvd` theo bộ màu của plugin `@blockly/theme-deuteranopia`, bật trong Cài đặt.

## 4. Khối "khi bắt đầu" (`cq_start`)
- Khối mũ (hat), định nghĩa trong `packages/engine/src/blocks/common.ts`.
- Luôn có sẵn trong workspace ban đầu, `deletable: false`, `movable: true`, không xuất hiện trong thanh khối.
- Khối rời bị làm xám nhờ listener `Blockly.Events.disableOrphans` + plugin `@blockly/disable-top-blocks`.
- Menu chuột phải: `setupBlockly()` bỏ đăng ký `blockHelp` ("Trợ giúp" mở trang tiếng Anh của bên thứ ba bằng `window.open`) và `blockInline` ("Cùng dòng"). Giữ Nhân đôi, Xóa khối, Hoàn tác / Làm tiếp (`REDO` đổi thành "Làm tiếp" để không trùng nút "Làm lại" của màn chơi), Xếp gọn, Xóa hết. `blockDisable` vẫn đăng ký (ẩn vì `disable` tắt) vì plugin vá nó.
- Đã kiểm (13.3.0): menu chuột phải của `cq_start` không có mục nào hiện (không xóa, không bình luận, không thu gọn), nên không mở menu. Tùy chọn `disable` để mặc định (`false` khi toolbox là flyout), nên bé không tự tắt khối được; plugin vẫn được `init()` để đúng hành vi nếu sau này bật `disable`.

## 5. Giới hạn khối
Đã kiểm chứng trên Blockly 13.3.0 (01/10/2026): `workspace.remainingCapacity()` = `maxBlocks − getAllBlocks(false).length`, tức là **tính cả `cq_start` và cả shadow block**. Ví dụ `controls_repeat_ext` có ô số shadow chiếm **2** chỗ.

Vì vậy:
- Truyền `maxBlocks: level.maxBlocks + 1` vào `inject` (+1 cho `cq_start`).
- **Khối dùng trong màn có `maxBlocks` không được có shadow.** Lặp dùng khối riêng `cq_repeat` (số lần là `field_number` nằm trong khối), không dùng `controls_repeat_ext`. Khối điều kiện `cq_if`, `cq_if_else`, `cq_repeat_until` nhận khối cảm biến thật (không phải shadow) ở input `COND`, nên mỗi câu hỏi là 1 khối, đúng như bé đếm.
- **Khối điều kiện riêng thay cho `controls_if` / `controls_whileUntil` (P2-11, chốt 04/10/2026):** ba type `cq_if` ("nếu ◇ thì"), `cq_if_else` ("nếu ◇ thì … nếu không thì") và `cq_repeat_until` ("lặp đến khi ◇") trong `packages/engine/src/blocks/common.ts`, không có bánh răng (mutator). Lý do: (1) bé kéo thẳng từ thanh khối, không phải bấm bánh răng; (2) luật 7 của `content:check` (khối mới xuất hiện lần đầu) và `maxInstances` của Blockly làm việc theo **type**, nên "nếu" và "nếu … nếu không" là hai khối riêng thì đếm, giới thiệu, giới hạn riêng được (T1); (3) "lặp đến khi" không có dropdown WHILE/UNTIL để lỡ đổi; (4) không cần `extraState` trong `ToolboxEntrySchema`. Nhãn tiếng Việt viết thẳng trong `message0…3` như khối riêng khác (không qua `messages.ts`). Ô điều kiện trống → engine không chạy (`EMPTY_CONDITION`, `runtime-engine.md` §2).
- **`maxLoopDepth`** (T16b): Blockly không có tùy chọn này. Web cần một bộ chặn thả khối (như `maxInstances`) dùng hàm thuần `loopDepth(workspaceJson)` của engine; **chưa làm** (task giao diện sau P2-11). `content:check` luật 20 đã kiểm `solution` / `initialWorkspace`.
- `content:check` báo lỗi nếu màn có `maxBlocks` mà toolbox chứa khối có shadow.
- Từ Thế giới 7 (biến, phép toán có shadow): viết **capacity guard** riêng trong `apps/web/src/blockly/capacity.ts` (đếm theo `analysis.blocksUsed`, chặn `BLOCK_CREATE` vượt mức) rồi mới dùng shadow trong màn có giới hạn. Việc này nằm trong roadmap GĐ 4.
- Mọi chỗ hiển thị và chấm điểm dùng `analysis.blocksUsed` (không tính `cq_start`, không tính shadow).
- Thanh "còn N khối" = `workspace.remainingCapacity()` (khớp với việc Blockly khóa khối trong thanh khối). Lưu ý: **khối rời cũng chiếm chỗ**, nên nếu còn khối rời thì Măng nhắc "Có khối chưa nối vào khi bắt đầu".
- Hết chỗ thì khối trong thanh khối tự bị khóa (hành vi có sẵn của Blockly) + gợi ý tầng 0 `capacityFull`.

## 6. Toolbox
`buildToolbox(level)` (trong `apps/web/src/blockly/toolbox.ts`) tạo **flyout toolbox** (không dùng category) từ `level.toolbox: string[]`:
- Thứ tự theo `level.toolbox`, nhóm theo `category` của BlockSpec, giữa các nhóm có nhãn nhỏ (VT323: "DI CHUYỂN", "LẶP"…).
- Khối có tham số dùng giá trị mặc định khai báo trong `content` (vd `{"type":"cq_repeat","fields":{"TIMES":3}}`). Vì thế `level.toolbox` cho phép chuỗi hoặc object.
- Mode `parsons`: toolbox là flyout **rỗng**, cột thanh khối ẩn bằng CSS (vẫn phải có toolbox để Blockly không lỗi). CSS cần `display: none !important` vì Blockly đặt `style="display: block"` inline cho flyout.
- Mode `parsons` (P1-06): **không** gắn `Events.disableOrphans` (lúc đầu gần như mọi khối đều rời, sọc xám làm cả bài khó đọc). Thay vào đó khối đứng đầu một chồng rời có class `cq-loose` (viền nét đứt màu mực, `opacity: 0.88`, `blockly.css`), cập nhật sau mỗi event không phải UI. Engine vẫn bỏ qua khối rời khi sinh code. Mọi khối `setDeletable(false)` khi nạp (Blockly chỉ copy/nhân bản khối xóa được), không có thùng rác.
- Mode `predict`: không có thùng rác (workspace chỉ đọc, §2).
- Nhãn nhóm là `{ kind: 'label', 'web-class': 'cq-flyout-label' }`, kiểu chữ VT323 22px trong `blockly.css`. Blockly đo nhãn bằng style đã tính, nên phải chờ font (§2).

## 7. Highlight khi phát lại
- `workspace.highlightBlock(id)` khi diễn event có `blockId`; `highlightBlock(null)` khi xong.
- CSS bổ sung viền vàng (`--coin`) quanh khối được highlight cho dễ thấy.
- Khi thua: khối gây lỗi (blockId của event thất bại) rung 2 lần (class CSS `cq-shake` gắn vào `block.getSvgRoot()`).

## 8. Gợi ý "chỉ bước tiếp" (tầng 2)
- Lấy lời giải (`level.solution`), so với chương trình hiện tại theo thứ tự trước (như `editDistance`), tìm **khối đầu tiên khác nhau** và **chỗ nối** của nó (khối cha + tên input, hoặc khối đứng trước).
- **Không** chèn khối vào workspace chính. Một khối thật sẽ bị serialize, bị tính vào `remainingCapacity()` (có thể khóa thanh khối khi chỉ còn 1 chỗ) và bắn sự kiện change. Thay vào đó:
  - Hiện một **popover** nhỏ chứa workspace chỉ đọc riêng, bên trong có đúng khối cần thêm, mờ và viền nét đứt.
  - Popover neo cạnh chỗ nối trong workspace chính, có mũi tên chỉ vào đó. Khối đích được tô viền bằng class CSS (`BlockSvg.addClass`), không thay đổi dữ liệu.
  - Nếu khối đúng có trong thanh khối, khối đó trong flyout cũng nhấp nháy viền.
- Popover tự đóng khi bé thả một khối hoặc bấm ra ngoài.

### Cài đặt (P1-07)
- **Phần so sánh là hàm thuần trong engine**: `nextStep(solution, current, { toolbox?, capacityLeft? }): NextStep | null` (`packages/engine/src/hints/nextStep.ts`).
  - Chỉ so khối dưới `cq_start`, theo token thứ tự trước như `editDistance` (độ sâu + tên input + `type` + `fields` + `extraState`), **bỏ qua shadow** (khác nhau chỉ ở shadow không phải là một bước).
  - Căn hai chương trình bằng **cùng bảng edit-distance** (đổi khối tại chỗ = 1, đổi sang độ sâu/input khác = 2), lấy các phép sửa trên một đường tối ưu theo thứ tự chương trình. Ví dụ: lời giải ABC, bé ghép AXBC → bỏ X (không phải "đổi X thành B"); bé ghép AC → thêm B sau A; bé ghép ACB → kéo B lên sau A.
  - Mỗi phép sửa thành một bước bé làm được, rồi **thử bước đó trên bản sao** theo đúng cách Blockly làm (kéo một khối là kéo cả các khối dưới nó; xóa một khối là xóa cả khối bên trong; chuột phải → "Xóa khối" giữ các khối dưới). Chọn bước làm `structuralDistance` giảm nhiều nhất. Nếu không bước đơn nào giảm (gỡ khối ra khỏi một vòng lặp thừa, thêm vòng lặp rồi kéo khối vào), chọn bước mà ngay sau nó có bước làm giảm, nên khoảng cách luôn giảm sau tối đa 2 bước (có property test chạy bằng Blockly headless thật).
  - Kết quả (`NextStep`):
    - `{ kind: 'add', block, anchor }`: kéo `block` từ thanh khối vào `anchor = { blockId, input }` (`input: null` = nối vào `next` của `blockId`).
    - `{ kind: 'move', blockId, anchor, withTail }`: kéo khối **đã có** (khối rời, hoặc khối nằm sai chỗ trong chuỗi; `withTail` = kéo theo cả các khối dưới nó) tới `anchor`.
    - `{ kind: 'edit', block, blockId }`: đúng loại khối, chỉ sai trường (vd lặp 3 thay vì lặp 2); sửa xong, các khối bên trong được so tiếp như đã khớp.
    - `{ kind: 'replace', block, anchor, blockId, midStack }`: xóa khối sai rồi đặt `block` từ thanh khối vào chỗ đó.
    - `{ kind: 'remove', blockId, midStack, loose }`: bỏ khối thừa (`midStack` = còn khối bên dưới, dùng chuột phải → "Xóa khối"; `loose` = chồng khối rời, bỏ để có chỗ).
    - `{ kind: 'reset' }`: cần một khối mà không còn ở đâu và thanh khối không có (màn `parsons` lỡ xóa khối) → bấm "Làm lại".
    - `null`: chương trình đã giống lời giải (hoặc một bên thiếu `cq_start`).
  - `toolbox`: các loại khối bé kéo được; `add`/`replace` chỉ dùng chúng. Màn `parsons` truyền `[]`: chỉ có `move`/`edit`/`remove`, và không bao giờ xóa một khối lời giải cần mà thanh khối không cho lại.
  - `capacityLeft ≤ 0`: không đề nghị khối mới; nếu bước đầu cần khối mới thì bỏ chồng khối rời trước, hoặc một khối thừa / dùng lại khối đã có.
  - `block` là khối của lời giải đứng một mình (bỏ `next` và khối con, giữ shadow), id `NEXT_STEP_BLOCK_ID`. Hàm định nghĩa ("để làm…") chưa được so (chỉ có từ Thế giới 8).
- **Phần hiển thị**: `showNextStepPopover(workspace, step, { onClose })` trong `apps/web/src/blockly/nextStepPopover.ts` (+ `.css`), trả `{ element, close() }`. Câu của Măng: `nextStepMessage(step)` (`vi.hints.nextStep`).
  - Popover (`role="dialog"`, không modal) gắn vào div `.cq-blockly` (cha của `injectionDiv`), đặt **bên phải cả chồng khối** (không che chương trình; không đủ chỗ thì sang **trái mép trái** của chồng khối), ngang hàng với chỗ nối của `anchor` (`nextConnection` / `getInput(name).connection`) hoặc với khối cần sửa/bỏ, đổi sang pixel bằng `utils.svgMath.wsToScreenCoordinates`. Mép trên kẹp trong chiều cao vùng `.cq-blockly` (không tràn xuống dưới). Đặt lại khi workspace cuộn/zoom (`VIEWPORT_CHANGE`) và khi `.cq-blockly` đổi cỡ (`ResizeObserver`).
  - Xem trước (`add`, `replace`, `edit`): `mountReadOnlyWorkspace` (`blockly/readOnlyWorkspace.ts`, dùng chung với lời giải tầng 3), khối mờ, viền nét đứt. `inject` biến workspace mới thành "main workspace" của Blockly; hàm trả vai đó về workspace chính ngay và khi gỡ.
  - Viền: `cq-step-anchor` (chỗ nối), `cq-step-source` (khối cần kéo / cần sửa), `cq-step-wrong` (khối cần đổi / bỏ, đỏ nét đứt), `cq-step-flyout` (khối cùng loại trong flyout, nhấp nháy; tắt khi giảm chuyển động).
  - Đóng khi: thả khối (`BlockDrag` kết thúc), bấm chuột **ngoài vùng `.cq-blockly`** (bấm trong vùng ghép là đang kéo khối, nên giữ popover tới lúc thả), `Esc` (trừ khi dropdown / ô nhập của Blockly đang mở: `Esc` đó dành để đóng nó), nút đóng, và khi bé chạy chương trình (Chạy / `Space` / `S`: màn chơi gọi `close()`). `close()` gỡ mọi listener và class, idempotent, gọi `onClose` một lần.
  - Màn chơi đọc chương trình bằng `handle.getState().json` (đồng bộ, §2) và đưa cho `useHints().buy(2, …)`, hàm này tính bước **trước** khi trừ xu.
- Lời giải tầng 3: `screens/play/SolutionViewer.tsx` (lớp phủ `aria-modal`, workspace chỉ đọc, `zoomToFit` tối đa 1,2×). Đã nối vào màn chơi: `hint-engine.md` §7.
- Mũi tên của gợi ý tầng 0: `blockly/hintPointer.ts` (`hintTargetBlock`, `pointAtBlock`, `pointAtElement`), xem `hint-engine.md` §7 mục 4.

## 9. Tiếng Việt
- `Blockly.setLocale(vi)` từ `blockly/msg/vi` (đã có sẵn tiếng Việt cho khối có sẵn).
- Ghi đè các nhãn khối có sẵn cho ngắn hơn, trong `apps/web/src/blockly/messages.ts`, vd `CONTROLS_IF_MSG_IF = "nếu"`. Nhãn `cq_repeat` là "lặp %1 lần".
- Nhãn khối riêng viết thẳng trong `json.message0` của BlockSpec (đã là tiếng Việt).

## 10. Lưu workspace
- Định dạng: `Blockly.serialization.workspaces.save(ws)` (JSON). Không dùng XML.
- Bài làm dở lưu vào IndexedDB theo `(profileId, levelId)` mỗi khi có thay đổi (debounce 1 s).
- Lời giải và workspace ban đầu trong `content/` dùng đúng định dạng này. Level editor xuất ra định dạng này.

## 11. Plugin dùng
| Plugin | Dùng làm gì |
|---|---|
| `@blockly/disable-top-blocks` | Kết hợp `disableOrphans`. Bản 13.3.0 chỉ phát hành `src/` (không có `dist/`, không có type): Vite lấy theo trường `module`; type tự khai trong `apps/web/src/blockly/disable-top-blocks.d.ts` |
| `@blockly/workspace-content-highlight` | Làm mờ xung quanh khi hướng dẫn lần đầu: `startContentHighlight(ws)` trong `blockly/contentHighlight.ts`, bật khi gợi ý tầng 0 có `spotlight: true`. Plugin chỉ làm sáng **cả vùng có khối** của workspace (không riêng một khối), flyout giữ nguyên |
| `@blockly/field-grid-dropdown` | Chọn hướng / màu / ô bằng lưới hình |
| `@blockly/zoom-to-fit` | Nút "vừa màn hình" |

## 12. Đường dẫn tài nguyên
- Copy `node_modules/blockly/media/` vào `apps/web/public/blockly-media/` bằng script `postinstall` của `apps/web` (`apps/web/scripts/copyBlocklyMedia.js`; thư mục đích đã gitignore, `npm ci` tạo lại) và truyền `media: '/blockly-media/'`.
- `field_image.src` luôn là **đường dẫn tuyệt đối từ gốc site** (`/icons/jump.png`), không dùng đường dẫn tương đối (sẽ thành `/play/icons/...` → 404).

## 13. Phím tắt và Blockly
Blockly 13 có phím tắt riêng (đã kiểm trong `core/shortcut_items.ts`): `Enter`/`Space` = `perform_action` và `finish_move`, `H` = `next_heading` khi flyout đang focus, `Esc` = `escape`/`abort_move`.
- Phím tắt của app (`Space`, `S`, `R`, `H` = mở hộp gợi ý; `H` và nút "Gợi ý" chờ tới khi phiên màn đã nạp xong, vì mua lúc đó không ghi được trần sao) chỉ hoạt động khi Blockly **không ở chế độ điều hướng bàn phím** (không có khối/kết nối đang được focus bằng bàn phím, và không có thao tác di chuyển bằng bàn phím đang dở). Sau khi bé **kéo thả bằng chuột** xong, app trả focus về vùng màn chơi (listener `BLOCK_DRAG` kết thúc → `stageContainer.focus()`), nên `Space` để chạy vẫn dùng được ngay.
- Bỏ đăng ký `next_heading` (`Blockly.ShortcutRegistry.registry.unregister('next_heading')`). Giữ các phím điều hướng còn lại cho người dùng bàn phím.
- `Esc` của app chỉ đóng lớp phủ của app; khi không có lớp phủ thì để Blockly xử lý.
- Code: `shouldHandleAppShortcut(event)` trong `apps/web/src/blockly/shortcuts.ts`. Không xử lý khi có lớp phủ `[aria-modal="true"]`, khi có Shift + phím chữ, và để `Space` cho nút/link/`summary`/các role checkbox, switch, tab, menuitem, option tự kích hoạt. Blockly giữ phím khi: đang di chuyển bằng bàn phím (`KeyboardMover.mover.isMoving()`), đang kéo bằng chuột (`Gesture.inProgress()`, nếu không Space giữa lúc kéo sẽ chạy chương trình trước khi thả), đang mở ô nhập/dropdown, hoặc điều hướng bàn phím đang bật **và** focus nằm trong Blockly. Phải xét cả focus vì Blockly bật điều hướng bàn phím mỗi khi nhấn `Tab` ở **bất kỳ đâu** trên trang (`inject.ts`, listener `keydown` trên `document`).
- Màn chơi nghe `keydown` ở **pha capture** trên `window` và `stopPropagation()` khi tự xử lý `Space`; nếu không, khối vừa bấm chuột (đang focus, điều hướng bàn phím tắt) sẽ nhận thêm `perform_action` của Blockly.
