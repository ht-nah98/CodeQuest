// ==UserScript==
// @name         Leanbot Blockly Editor - nhan tieng Viet day du
// @namespace    codequest.leanbot.vi
// @version      1.0.0
// @description  Dich not cac nhan khoi lenh Leanbot con bo tieng Anh tren ide.pythaverse.space/lbeditor
// @match        https://ide.pythaverse.space/lbeditor/*
// @match        https://ide.pythaverse.space/lbeditor-python-simulation/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * Both Leanbot editors ship blocklyduino/msg/leanbot_vi.js with 30 of its 48 Leanbot block
 * labels still in English and 5 more half translated. This script fills the gaps in
 * /lbeditor/ (robot thật, sinh C++) and /lbeditor-python-simulation/ (robot ảo, sinh Python).
 *
 * How it hooks in: leanbot.js does not bake the labels in when the message file loads.
 * Each entry of the global `LeanbotBlocks` is a factory `(id, lang)` that reads
 * `Blockly.Msg.Leanbot[lang][id]` when `LeanbotBlocks_begin()` runs. So patching the
 * message object and calling `LeanbotBlocks_begin()` again regenerates every definition
 * from the new strings - no proxies, no load-order race.
 *
 * Placeholder order and count must stay identical to upstream or the blocks break;
 * tools/lbeditor-vi/check-placeholders.mjs asserts that.
 */
(function () {
  'use strict';

  const CATEGORY = {
    Name: 'Leanbot',
    Motion: 'Di chuyển',
    Gripper: 'Tay gắp',
    RGBLed: 'Đèn LED',
    Sound: 'Âm thanh',
    Sensors: 'Cảm biến',
    IRLine: 'Cảm biến vạch',
  };

  const BLOCKS = {
    'Leanbot.commentLine': { tooltip: 'Thêm một dòng ghi chú cho người đọc. Robot bỏ qua dòng này.', defaults: { commentString: 'Ghi chú' } },
    'Leanbot.section': { tooltip: 'Gom nhiều lệnh thành một nhóm có tên, cho dễ đọc.', defaults: { commentString: 'Ghi chú' } },
    'Leanbot.whenStarted': { tooltip: 'Chạy một lần khi bật robot. Đặt các lệnh cài đặt ở đây.' },
    'Leanbot.delay': { tooltip: 'Đứng yên chờ một lúc rồi mới làm lệnh tiếp theo.' },

    'LbMission.beginByTeacher_end': { message0: 'Nhiệm vụ: Bắt đầu khi chạm cùng lúc %1 %2 %3 Nhiệm vụ: Kết thúc', tooltip: 'Chờ chạm hai nút cùng lúc rồi mới làm nhiệm vụ. Dùng khi thi đấu.' },
    'LbMission.beginByServer_end': { message0: 'Nhiệm vụ: Bắt đầu trên Bản Sao Số %1 %2 %3 Nhiệm vụ: Kết thúc', tooltip: 'Chờ sân mô phỏng ra lệnh bắt đầu rồi mới làm nhiệm vụ.' },
    'LbMission.beginBySelect_end': { message0: 'Nhiệm vụ: Bắt đầu trên Bản Sao Số %1 %2 %3 Nhiệm vụ: Kết thúc', tooltip: 'Chờ sân mô phỏng ra lệnh bắt đầu rồi mới làm nhiệm vụ.' },
    'LbMission.beginByName_end': { message0: 'Nhiệm vụ: Bắt đầu trên Bản Sao Số %1 %2 %3 Nhiệm vụ: Kết thúc', tooltip: 'Chờ sân mô phỏng ra lệnh bắt đầu rồi mới làm nhiệm vụ.' },
    'LbMission.missionSelect': { tooltip: 'Chọn tên nhiệm vụ sẽ chạy.' },
    'LbMission.beginImmediately_end': { tooltip: 'Làm nhiệm vụ ngay, không chờ nút. Dùng khi tập ở nhà.' },
    'LbMission.end': { message0: 'Nhiệm vụ: Kết thúc', tooltip: 'Báo đã xong nhiệm vụ và dừng tính giờ.' },
    'LbMission.elapsedMillis': { message0: 'Nhiệm vụ: Thời gian đã chạy, tính bằng %1', tooltip: 'Cho biết đã mất bao lâu kể từ lúc bắt đầu nhiệm vụ.' },

    'Leanbot.DCMotor.setPower': { message0: 'Động cơ DC: Chạy %1 với sức mạnh %2 %%', tooltip: 'Cho động cơ DC chạy mạnh hay nhẹ. 100% là mạnh nhất.', text: { Forward: 'tới', Backward: 'lùi' } },

    'LbMotion.run': { tooltip: 'Đặt tốc độ cho hai bánh xe. Hai bánh bằng nhau thì đi thẳng.' },
    'LbMotion.waitDistanceMm': { tooltip: 'Chạy tiếp cho đủ quãng đường này rồi mới làm lệnh sau.' },
    'LbMotion.waitRotationDeg': { tooltip: 'Rẽ tiếp cho đủ góc này rồi mới làm lệnh sau. 90 độ là một phần tư vòng.' },
    'LbMotion.wait': { tooltip: 'Giữ nguyên tốc độ đang chạy thêm một lúc nữa.' },
    'LbMotion.stop': { tooltip: 'Giảm tốc rồi dừng hẳn hai bánh xe.' },
    'LbMotion.setZeroOrigin': { message0: 'Di chuyển: Đặt lại mốc đường đi và hướng', tooltip: 'Coi chỗ đang đứng là mốc: đường đi về 0, hướng về 0 độ.' },
    'LbMotion.approxDistance': { message0: 'Di chuyển: Đường đã đi, tính bằng %1', tooltip: 'Cho biết robot đã đi được bao xa kể từ mốc.' },
    'LbMotion.approxHeading': { message0: 'Di chuyển: Hướng đang quay, tính bằng %1', tooltip: 'Cho biết robot đã quay lệch bao nhiêu so với mốc.' },

    'LbGripper.open': { message0: 'Tay gắp: Mở', tooltip: 'Mở hai càng ra (về góc 0 độ) để nhả khối.' },
    'LbGripper.close': { message0: 'Tay gắp: Đóng', tooltip: 'Đóng hai càng lại (về góc 90 độ) để kẹp chặt khối.' },
    'LbGripper.moveTo': { message0: 'Tay gắp: Xoay tới góc %1 %2', tooltip: 'Đưa cả hai càng tới đúng một góc mình chọn.' },
    'LbGripper.moveToLR': { message0: 'Tay gắp: Xoay càng Trái tới %1 và càng Phải tới %2 %3 trong %4 %5', tooltip: 'Đưa từng càng tới góc riêng, trong khoảng thời gian cho trước.' },

    'LbRGB.colour_picker': { tooltip: 'Chọn một màu từ bảng màu.' },
    'LbRGB.colour_random': { message0: 'Màu sắc: Ngẫu nhiên', tooltip: 'Chọn đại một màu bất kỳ.' },
    'LbRGB.colour_rgb': { message0: 'Màu sắc: Đỏ %1 Lục %2 Lam %3', tooltip: 'Pha màu từ ba màu gốc. Mỗi số từ 0 đến 255.' },
    'LbRGB.colour_blend': { message0: 'Màu sắc: Trộn %1 với %2 theo tỉ lệ %3', tooltip: 'Trộn hai màu với nhau. Tỉ lệ từ 0 đến 1.' },
    'LbRGB.setColor': { message0: 'Đèn LED: Đặt %1 thành %2', tooltip: 'Chọn màu cho một bóng đèn. Phải có lệnh Bật sáng mới hiện.', warning: 'Còn thiếu khối màu' },
    'LbRGB.setColorText': { message0: 'Đèn LED: Đặt %1 thành %2', tooltip: 'Chọn màu cho một bóng đèn bằng tên màu.' },
    'LbRGB.shape': { message0: 'Nhóm đèn: O %1 A %2 B %3 C %4 D %5 E %6 F %7', tooltip: 'Chọn những bóng đèn nào nằm trong nhóm.', warning: 'Phải chọn ít nhất 2 bóng đèn' },
    'LbRGB.fillColor': { message0: 'Đèn LED: Tô %1 bằng màu %2', tooltip: 'Đặt cùng một màu cho cả nhóm đèn.', warning: 'Còn thiếu khối màu' },
    'LbRGB.clear': { message0: 'Đèn LED: Tắt hết', tooltip: 'Đưa toàn bộ đèn về màu đen, tức là tắt.' },
    'LbRGB.show': { message0: 'Đèn LED: Bật sáng', tooltip: 'Cho những màu vừa đặt hiện ra trên đèn thật.' },
    'LbRGB.clear_show': { message0: 'Đèn LED: Tắt hết %1 %2 Đèn LED: Bật sáng', tooltip: 'Tắt hết đèn, đặt màu mới ở giữa, rồi bật sáng.' },

    'Leanbot.toneDuration': { message0: 'Âm thanh: Kêu nốt %1 %2 trong %3 %4', tooltip: 'Phát một tiếng bíp. Số Hz càng lớn thì tiếng càng cao.' },

    'LbTouch.read': { message0: 'Nút chạm: %1 đang được chạm?', tooltip: 'Đúng khi ngón tay đang chạm vào nút này.' },
    'LbTouch.waitUntil': { message0: 'Nút chạm: Chờ tới khi %1 được chạm', tooltip: 'Đứng yên chờ, chạm vào nút thì mới chạy tiếp.' },
    'Leanbot.ping': { message0: 'Đo xa: Khoảng cách phía trước, tính bằng %1', tooltip: 'Robot phát sóng siêu âm để đo xem phía trước cách bao xa.' },
    'Leanbot.objectInFront': { message0: 'Đo xa: Phía trước có vật trong vòng %1 %2 ?', tooltip: 'Đúng khi có vật cản gần hơn khoảng cách này.' },

    'LbIRLine.doManualCalibration': { message0: 'Cảm biến vạch: Cân chỉnh bằng nút %1', tooltip: 'Dạy robot phân biệt đen và trắng, làm 3 bước theo nút chạm.' },
    'LbIRLine.setThreshold': { message0: 'Cảm biến vạch: Đặt ngưỡng  2T %1 0T %2 1P %3 3P %4', tooltip: 'Đặt mức phân chia đen / trắng cho từng mắt cảm biến.' },
    'LbIRLine.read': { message0: 'Cảm biến vạch: Đọc cảm biến', tooltip: 'Nhìn xuống sàn một lần và ghi nhớ kết quả.' },
    'LbIRLine.value': { message0: 'Cảm biến vạch: Giá trị 4 mắt (2T, 0T, 1P, 3P)', tooltip: 'Lấy kết quả của lần đọc gần nhất, dưới dạng một con số.' },
    'LbIRLine.isBlackDetected': { message0: 'Cảm biến vạch: Có thấy màu đen?', tooltip: 'Đúng khi ít nhất một mắt cảm biến đang nằm trên vạch đen.' },
    'LbIRLine.state': { tooltip: 'Mô tả một thế đứng trên vạch: mỗi ô là một mắt, đen hoặc trắng.' },
    'LbIRLine.displayOnRGB': { message0: 'Cảm biến vạch: Hiện lên đèn LED màu %1', tooltip: 'Cho đèn LED sáng theo mắt nào đang thấy vạch đen.' },
  };

  /*
   * Category labels are a separate story: the toolbox tree is built from
   * toolbox_leanbot_vi.json before this script runs, and refreshSelection() only
   * rebuilds the flyout, not the labels. Rewriting the rendered labels is the one
   * reliable way to finish the job without rebuilding the whole toolbox.
   */
  const CATEGORY_RENAME = {
    LeanbotVN: 'Leanbot',
    'Đèn Led RGB': 'Đèn LED',
    'Phát nhạc': 'Âm thanh',
    'local/param': 'cục bộ / tham số',
    global: 'toàn cục',
    numbers: 'số',
    text: 'chữ',
    boolean: 'đúng/sai',
    // only present in the Digital Twin (Python) editor
    Text: 'Chữ',
    Lists: 'Danh sách',
    Print: 'In ra',
  };

  function renameCategories() {
    for (const label of document.querySelectorAll('.blocklyTreeLabel')) {
      const next = CATEGORY_RENAME[label.textContent.trim()];
      if (next) label.textContent = next;
    }
  }

  function placeholders(text) {
    return (String(text).match(/%\d+/g) || []).sort().join(',');
  }

  function apply() {
    const vi = window.Blockly && window.Blockly.Msg && window.Blockly.Msg.Leanbot
      && window.Blockly.Msg.Leanbot.vi;
    if (!vi || typeof window.LeanbotBlocks_begin !== 'function') return false;

    Object.assign(vi.Category, CATEGORY);
    for (const [id, patch] of Object.entries(BLOCKS)) {
      const entry = vi[id];
      if (!entry) continue; // upstream renamed or removed the block: leave it alone
      if (patch.message0 && placeholders(patch.message0) !== placeholders(entry.message0)) {
        console.warn('[lbeditor-vi] bỏ qua', id, '- số ô trống không khớp bản gốc');
        continue;
      }
      Object.assign(entry, patch);
    }

    window.LeanbotBlocks_begin(); // rebuild every Blockly.Blocks[...] from the new strings
    const ws = window.Blockly.getMainWorkspace && window.Blockly.getMainWorkspace();
    if (ws && ws.getToolbox && ws.getToolbox()) ws.getToolbox().refreshSelection();
    renameCategories();
    console.log('[lbeditor-vi] đã bật nhãn tiếng Việt đầy đủ');
    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    if (apply() || ++tries > 120) clearInterval(timer);
  }, 250);
})();
