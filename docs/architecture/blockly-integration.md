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
- Nhận `level`, trả ra qua callback: `onChange(json, analysis)` (debounce 150 ms), `onReady(workspaceSvg)`.
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
  sounds: true,
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
| `loop_blocks` | `cq_repeat`, `controls_whileUntil` | `#D9730D` |
| `logic_blocks` | `controls_if`, `logic_*` | `#8A5CD1` |
| `sensor_blocks` | cảm biến (`*_is_ahead`, `*_is_path`…) | `#178A7E` |
| `robot_blocks` | gắp, thả… | `#A0612B` |
| `variable_blocks` | `variables_*`, `math_*` | `#D13F73` |
| `procedure_blocks` | `procedures_*` | `#5560C8` |
| `pen_blocks` | turtle | `#2F8A3E` |
| `event_blocks` | `cq_start` | `#FBC73F`, chữ màu mực |

- Font: `fontStyle: { family: '"Baloo 2", Nunito, sans-serif', weight: '700', size: 14 }`. 14pt ≈ 18,7px in đậm, đạt mức **chữ lớn** của WCAG, nên ngưỡng tương phản 3:1 của bảng màu khối là đúng chuẩn.
- Theme mù màu: tạo thêm `codequest-cvd` theo bộ màu của plugin `@blockly/theme-deuteranopia`, bật trong Cài đặt.

## 4. Khối "khi bắt đầu" (`cq_start`)
- Khối mũ (hat), định nghĩa trong `packages/engine/src/blocks/common.ts`.
- Luôn có sẵn trong workspace ban đầu, `deletable: false`, `movable: true`, không xuất hiện trong thanh khối.
- Khối rời bị làm xám nhờ listener `Blockly.Events.disableOrphans` + plugin `@blockly/disable-top-blocks`.

## 5. Giới hạn khối
Đã kiểm chứng trên Blockly 13.3.0 (01/10/2026): `workspace.remainingCapacity()` = `maxBlocks − getAllBlocks(false).length`, tức là **tính cả `cq_start` và cả shadow block**. Ví dụ `controls_repeat_ext` có ô số shadow chiếm **2** chỗ.

Vì vậy:
- Truyền `maxBlocks: level.maxBlocks + 1` vào `inject` (+1 cho `cq_start`).
- **Khối dùng trong màn có `maxBlocks` không được có shadow.** Lặp dùng khối riêng `cq_repeat` (số lần là `field_number` nằm trong khối), không dùng `controls_repeat_ext`. Khối điều kiện (`controls_if`, `controls_whileUntil`) nhận khối cảm biến thật (không phải shadow) nên vẫn dùng được.
- `content:check` báo lỗi nếu màn có `maxBlocks` mà toolbox chứa khối có shadow.
- Từ Thế giới 7 (biến, phép toán có shadow): viết **capacity guard** riêng trong `apps/web/src/blockly/capacity.ts` (đếm theo `analysis.blocksUsed`, chặn `BLOCK_CREATE` vượt mức) rồi mới dùng shadow trong màn có giới hạn. Việc này nằm trong roadmap GĐ 4.
- Mọi chỗ hiển thị và chấm điểm dùng `analysis.blocksUsed` (không tính `cq_start`, không tính shadow).
- Thanh "còn N khối" = `workspace.remainingCapacity()` (khớp với việc Blockly khóa khối trong thanh khối). Lưu ý: **khối rời cũng chiếm chỗ**, nên nếu còn khối rời thì Măng nhắc "Có khối chưa nối vào khi bắt đầu".
- Hết chỗ thì khối trong thanh khối tự bị khóa (hành vi có sẵn của Blockly) + gợi ý tầng 0 `capacityFull`.

## 6. Toolbox
`buildToolbox(level)` (trong `apps/web/src/blockly/toolbox.ts`) tạo **flyout toolbox** (không dùng category) từ `level.toolbox: string[]`:
- Thứ tự theo `level.toolbox`, nhóm theo `category` của BlockSpec, giữa các nhóm có nhãn nhỏ (VT323: "DI CHUYỂN", "LẶP"…).
- Khối có tham số dùng giá trị mặc định khai báo trong `content` (vd `{"type":"cq_repeat","fields":{"TIMES":3}}`). Vì thế `level.toolbox` cho phép chuỗi hoặc object.
- Mode `parsons`: toolbox là flyout **rỗng**, cột thanh khối ẩn bằng CSS (vẫn phải có toolbox để Blockly không lỗi).

## 7. Highlight khi phát lại
- `workspace.highlightBlock(id)` khi diễn event có `blockId`; `highlightBlock(null)` khi xong.
- CSS bổ sung viền vàng (`--coin`) quanh khối được highlight cho dễ thấy.
- Khi thua: khối gây lỗi (blockId của event thất bại) rung 2 lần (class CSS `cq-shake` gắn vào `block.getSvgRoot()`).

## 8. Gợi ý "chỉ bước tiếp" (tầng 2)
- Lấy lời giải (`level.solution`), so với chương trình hiện tại theo thứ tự trước (như `editDistance`), tìm **khối đầu tiên khác nhau** và **chỗ nối** của nó (khối cha + tên input, hoặc khối đứng trước).
- **Không** chèn khối vào workspace chính. Một khối thật sẽ bị serialize, bị tính vào `remainingCapacity()` (có thể khóa thanh khối khi chỉ còn 1 chỗ) và bắn sự kiện change. Thay vào đó:
  - Hiện một **popover** nhỏ chứa workspace chỉ đọc riêng, bên trong có đúng khối cần thêm, mờ và viền nét đứt.
  - Popover neo cạnh chỗ nối trong workspace chính, có mũi tên chỉ vào đó. Khối đích được tô viền bằng `addSelect`/class CSS, không thay đổi dữ liệu.
  - Nếu khối đúng có trong thanh khối, khối đó trong flyout cũng nhấp nháy viền.
- Popover tự đóng khi bé thả một khối hoặc bấm ra ngoài.
- Code: `apps/web/src/blockly/nextStepHint.ts`.

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
| `@blockly/disable-top-blocks` | Kết hợp `disableOrphans` |
| `@blockly/workspace-content-highlight` | Làm mờ xung quanh khi hướng dẫn lần đầu |
| `@blockly/field-grid-dropdown` | Chọn hướng / màu / ô bằng lưới hình |
| `@blockly/zoom-to-fit` | Nút "vừa màn hình" |

## 12. Đường dẫn tài nguyên
- Copy `node_modules/blockly/media/` vào `apps/web/public/blockly-media/` (script `postinstall` hoặc plugin Vite) và truyền `media: '/blockly-media/'`.
- `field_image.src` luôn là **đường dẫn tuyệt đối từ gốc site** (`/icons/jump.png`), không dùng đường dẫn tương đối (sẽ thành `/play/icons/...` → 404).

## 13. Phím tắt và Blockly
Blockly 13 có phím tắt riêng (đã kiểm trong `core/shortcut_items.ts`): `Enter`/`Space` = `perform_action` và `finish_move`, `H` = `next_heading` khi flyout đang focus, `Esc` = `escape`/`abort_move`.
- Phím tắt của app (`Space`, `S`, `R`, `H`) chỉ hoạt động khi Blockly **không ở chế độ điều hướng bàn phím** (không có khối/kết nối đang được focus bằng bàn phím, và không có thao tác di chuyển bằng bàn phím đang dở). Sau khi bé **kéo thả bằng chuột** xong, app trả focus về vùng màn chơi (listener `BLOCK_DRAG` kết thúc → `stageContainer.focus()`), nên `Space` để chạy vẫn dùng được ngay.
- Bỏ đăng ký `next_heading` (`Blockly.ShortcutRegistry.registry.unregister('next_heading')`). Giữ các phím điều hướng còn lại cho người dùng bàn phím.
- `Esc` của app chỉ đóng lớp phủ của app; khi không có lớp phủ thì để Blockly xử lý.
