import type { BlockCategory } from '@codequest/engine';
import type { PandaAnimation } from '../stages/panda';

export const vi = {
  appTitle: 'CodeQuest',
  appGreeting: 'Chào con! Măng đang chuẩn bị nè.',

  // Route-level error boundary (app/ErrorBoundary.tsx).
  crash: {
    message: 'Ối, game bị vấp. Con bấm Tải lại nhé!',
    reload: 'Tải lại',
  },

  // Design-system labels (apps/web/src/ui). Short, no forms of address (ui-copy-guide.md §1).
  ui: {
    speak: 'Đọc to',
    hud: 'Thành tích',
    coins: (n: number) => `${String(n)} xu`,
    stars: (n: number) => `${String(n)} sao`,
    streakUnit: 'ngày',
    streak: (n: number) => `Chuỗi ${String(n)} ngày`,
    blocksLeft: (n: number) => `còn ${String(n)} khối`,
    blocksLeftLabel: 'Khối còn lại',
    starsOf: (earned: number, max: number) => `${String(earned)} trên ${String(max)} sao`,
  },

  // Play screen /play/:levelId (screens-and-flows.md §3). Buttons are verbs only (ui-copy-guide.md §1).
  play: {
    start: 'Vào chơi',
    backToMap: 'Bản đồ',
    where: (world: string, levelNumber: number | null) =>
      levelNumber === null ? world : `${world} · Màn ${String(levelNumber)}`,
    objectiveLabel: 'Mục tiêu',
    stageLabel: 'Sân chơi',
    controlsLabel: 'Điều khiển',
    run: 'Chạy',
    stop: 'Dừng',
    step: 'Từng bước',
    reset: 'Làm lại',
    speedLabel: 'Tốc độ',
    speeds: { slow: 'Chậm', normal: 'Vừa', fast: 'Nhanh' },
    mangSays: 'Măng nói',
    // Măng's bubble (≤ 12 words).
    ready: 'Ghép khối rồi bấm Chạy nhé!',
    running: 'Xem Măng làm theo từng khối nhé!',
    stepping: 'Bấm Từng bước để Măng làm tiếp.',
    winPar: (blocks: number) => `Chỉ ${String(blocks)} khối, đúng bằng số chuẩn!`,
    winUnderPar: (blocks: number) => `Chỉ ${String(blocks)} khối, ít hơn cả số chuẩn!`,
    win: 'Qua màn rồi! Thử ít khối hơn nhé?',
    successTitle: 'Qua màn rồi!',
    successBody: (blocks: number) => `Con dùng ${String(blocks)} khối.`,
    playAgain: 'Chơi lại',
    loading: 'Măng đang chuẩn bị…',
    notFound: 'Không tìm thấy màn này.',
    loadError: 'Ối, không mở được màn này.',
    unplayable: 'Màn này chưa chơi được. Con chọn màn khác nhé!',
    stageError: 'Ối, sân chơi chưa hiện được.',
  },

  // Showcase page /dev/ui (dev build only; read by the coach, not by children).
  devUi: {
    eyebrow: 'DESIGN SYSTEM · /DEV/UI',
    wordmarkStart: 'Code',
    wordmarkEnd: 'Quest',
    intro: 'Mọi thành phần giao diện dùng chung, vẽ bằng token của style board "Pixel ấm áp".',
    greeting: 'Chào con! Mình là Măng.',
    sample: 'Măng nhảy qua hố, rẽ phải!',

    typeEyebrow: 'CHỮ',
    typeTitle: 'Ba font, tất cả đều có đủ dấu tiếng Việt',
    typeDisplayMeta: 'Baloo 2 · 800',
    typeDisplayUse: 'Tiêu đề, nút, chữ trên khối',
    typeBodyMeta: 'Nunito · 600',
    typeBodyUse: 'Bài giảng, bong bóng thoại',
    typeBodyExtra:
      'Vòng lặp giúp con không phải ghép một khối nhiều lần. Con đếm xem Măng phải đi mấy bước nhé?',
    typePixelMeta: 'VT323 · 400',
    typePixelUse: 'Số HUD, nhãn pixel, từ 22px',
    typePixelExtra: 'MÀN 04 · CÒN 3 KHỐI · 120 XU · ỐI!',
    typeWarnTitle: 'Không dùng Press Start 2P, Pixelify Sans, Silkscreen, Tiny5.',
    typeWarnBody:
      'Các font này không có bộ ký tự tiếng Việt: chữ "ằ", "ẫ", "ợ" sẽ bị thay bằng font khác và vỡ chữ.',

    colorEyebrow: 'MÀU SẮC',
    colorTitle: 'Bảng màu lấy từ chính bộ lông của Măng',
    blockColorTitle: 'Màu khối lệnh, cố định trong toàn bộ hệ thống',
    swatches: {
      ink: ['Mực', 'chữ, viền, bóng'],
      paper: ['Giấy', 'thẻ, panel'],
      brand: ['Oải hương', 'thương hiệu'],
      go: ['Lá tre', 'nút Chạy, thành công'],
      coin: ['Nắng', 'xu, sao'],
      hint: ['Má hồng', 'gợi ý'],
      sky: ['Trời', 'nền sân chơi'],
      oops: ['Ối', 'lỗi, luôn kèm icon'],
    },
    blocks: {
      move: 'Di chuyển',
      loop: 'Lặp',
      if: 'Điều kiện',
      sensor: 'Cảm biến',
      robot: 'Robot',
      var: 'Biến & số',
      fn: 'Hàm',
      pen: 'Bút vẽ',
    },

    compEyebrow: 'THÀNH PHẦN GIAO DIỆN',
    compTitle: 'Nút to, có độ dày, bấm vào thấy lún xuống',
    compIntro: 'Rê chuột thì nút nhô lên, bấm thì lún xuống. Nhấn Tab để xem viền focus.',
    labelButtons: 'NÚT',
    labelHud: 'HUD & GIỚI HẠN KHỐI',
    labelBubble: 'MĂNG NÓI',
    labelPanel: 'THẺ / PANEL',
    labelIcons: 'ICON PIXEL · 16×16',
    labelTopBar: 'THANH TRÊN MÀN CHƠI',
    run: 'Chạy',
    hint: 'Gợi ý',
    shop: 'Cửa hàng',
    reset: 'Làm lại',
    locked: 'Chưa mở',
    nextLevel: 'Màn tiếp',
    addBlock: 'Thêm khối',
    removeBlock: 'Bớt khối',
    bubbleHint: 'Con thấy đoạn nào lặp lại không?',
    bubbleFell: 'Ối, hố! Thử khối nhảy nhé.',
    spoken: 'Đang đọc…',
    panelTitle: 'Qua màn rồi!',
    panelBody: 'Chỉ 5 khối, đúng bằng số chuẩn!',
    topBarWhere: 'Làng Tre · Màn 4',
    back: 'Bản đồ',
    mangTalking: 'Măng đang nói',
  },

  // Blockly wrapper labels (apps/web/src/blockly). Blockly's own messages: blockly/messages.ts.
  blockly: {
    // Small VT323 group labels in the toolbox flyout (blockly-integration.md §6).
    toolboxGroups: {
      move: 'DI CHUYỂN',
      loop: 'LẶP',
      logic: 'ĐIỀU KIỆN',
      sensor: 'CẢM BIẾN',
      robot: 'ROBOT',
      variable: 'BIẾN & SỐ',
      function: 'HÀM',
      pen: 'BÚT VẼ',
      event: 'SỰ KIỆN',
    } satisfies Record<BlockCategory, string>,
    workspaceLabel: 'Vùng ghép khối',
  },

  // Dev-only pages (/dev/*; read by the coach, not by children).
  dev: {
    stageTitle: 'Sân chơi thử: Măng',
    stageHint: 'Chọn một hoạt ảnh để xem Măng.',
    stageLoading: 'Đang tải…',
    stageError: 'Không mở được sân chơi. Thử tải lại trang nhé.',
    backHome: 'Về trang đầu',
    stageAnimationsLabel: 'Hoạt ảnh',
    animations: {
      idle: 'Đứng',
      talk: 'Nói',
      happy: 'Vui',
      walk: 'Đi',
      run: 'Chạy',
      crouch: 'Cúi',
      jump: 'Nhảy',
      kick: 'Đá',
      cheer: 'Ăn mừng',
    } satisfies Record<PandaAnimation, string>,
    // /dev/blockly (dev build only; read by the coach, not by children).
    blockly: {
      eyebrow: 'BLOCKLY · /DEV/BLOCKLY',
      title: 'Vùng ghép khối thử',
      intro: 'Đổi màn mẫu, ghép khối, rồi nhấn Space ngoài vùng ghép để chạy.',
      levelsLabel: 'Màn mẫu',
      stageLabel: 'Sân chơi (giả)',
      stageHint: 'Bấm vào đây rồi nhấn Space để chạy.',
      run: 'Chạy',
      reset: 'Làm lại',
      runCount: (n: number) => `đã chạy: ${String(n)}`,
      lastRun: (n: number) => `lần chạy cuối: ${String(n)} khối`,
      blocksUsed: (n: number) => `đang dùng: ${String(n)} khối`,
      orphans: (n: number) => `khối rời: ${String(n)}`,
      noLimit: 'không giới hạn khối',
      levels: {
        build3: 'Tự ghép · tối đa 3 khối',
        parsons: 'Ghép hình',
        free: 'Đủ loại khối',
      },
      backHome: 'Về trang đầu',
      // Sample block labels (dev-only blocks, not part of any game kind).
      blockWalk: 'đi tới',
      blockJump: 'nhảy',
      blockTurn: 'rẽ phải',
      blockIsHole: 'có hố',
    },
  },
} as const;
