/**
 * @license
 * Copyright 2020 Sébastien CANET
 * SPDX-License-Identifier: BSD-3-Clause
 */

/*
 * Complete Vietnamese labels for the Leanbot blocks of Leanbot Blockly Editor
 * (https://ide.pythaverse.space/lbeditor/).
 *
 * Drop-in replacement for blocklyduino/msg/leanbot_vi.js. The upstream file ships
 * only a partial translation: 33 of 48 block labels are still English and several
 * others are half translated ("Di chuyen: approx. Distance in mm"). Key names,
 * placeholder order and placeholder count are kept byte-for-byte compatible, so the
 * blocks render and generate the same Arduino code.
 *
 * Wording targets 9-11 year olds: short, no jargon, same term for the same thing
 * everywhere (see docs/product/leanbot-airoc-vi.md for the glossary).
 */

'use strict';

goog.provide('Blockly.Msg.leanbot_vi');

goog.require('Blockly.Msg');


var LeanbotMsg_vi = {};

/*==================================================================================================
                                      Categories
==================================================================================================*/

/* Upstream misspells this key as "Caregory"; kept so the file stays a drop-in replacement. */
LeanbotMsg_vi["Caregory"] = {
  Name       :    "Leanbot",
  Motion     :    "Di chuyển",
  Gripper    :    "Tay gắp",
  RGBLed     :    "Đèn LED",
  Sound      :    "Âm thanh",
  Sensors    :    "Cảm biến",
  IRLine     :    "Cảm biến vạch",
};


/*==================================================================================================
                                      Blocks
==================================================================================================*/

LeanbotMsg_vi["Warning"] = {
  OutOfRange             : "Ngoài khoảng cho phép",
};


LeanbotMsg_vi["Unit"] = {
  Second                 : "giây",
  Millisecond            : "mili giây",
  Centimeter             : "cm",
  Millimeter             : "mm",
  Degree                 : "độ",
  Hertz                  : "Hz",
  Kilohertz              : "kHz",
  StepPerSec             : "bước/giây",
  RevPerMin              : "vòng/phút",
};


LeanbotMsg_vi["Block"] = {

  "Leanbot.commentLine" : {
    message0 : "⠀ %1",
    tooltip  : "Thêm một dòng ghi chú cho người đọc. Robot bỏ qua dòng này.",
    defaults : {
      commentString : "Ghi chú",
    },
  },

  "Leanbot.section" : {
    message0 : "⠀ %1 %2 %3",
    tooltip  : "Gom nhiều lệnh thành một nhóm có tên, cho dễ đọc.",
    defaults : {
      commentString : "Ghi chú",
    },
  },

  "Leanbot.whenStarted" : {
    message0 : "Leanbot bắt đầu hoạt động",
    tooltip  : "Chạy một lần khi bật robot. Đặt các lệnh cài đặt ở đây.",
  },

  "Leanbot.delay" : {
    message0 : "Chờ %1 %2",
    tooltip  : "Đứng yên chờ một lúc rồi mới làm lệnh tiếp theo.",
    text     : {"Running": "chạy", "Turning": "rẽ"},
  },


  /*---------------------------------------------------------------*/
  "LbMission.beginByTeacher_end" : {
    message0 : "Nhiệm vụ: Bắt đầu khi chạm cùng lúc %1 %2 %3 Nhiệm vụ: Kết thúc",
    tooltip  : "Chờ chạm hai nút cùng lúc rồi mới làm nhiệm vụ. Dùng khi thi đấu.",
  },

  "LbMission.beginByServer_end" : {
    message0 : "Nhiệm vụ: Bắt đầu trên Bản Sao Số %1 %2 %3 Nhiệm vụ: Kết thúc",
    tooltip  : "Chờ sân mô phỏng ra lệnh bắt đầu rồi mới làm nhiệm vụ.",
  },

  "LbMission.beginBySelect_end" : {
    message0 : "Nhiệm vụ: Bắt đầu trên Bản Sao Số %1 %2 %3 Nhiệm vụ: Kết thúc",
    tooltip  : "Chờ sân mô phỏng ra lệnh bắt đầu rồi mới làm nhiệm vụ.",
  },

  "LbMission.missionSelect" : {
    message0 : "%1 %2 %3",
    tooltip  : "Chọn tên nhiệm vụ sẽ chạy.",
  },

  "LbMission.beginByName_end" : {
    message0 : "Nhiệm vụ: Bắt đầu trên Bản Sao Số %1 %2 %3 Nhiệm vụ: Kết thúc",
    tooltip  : "Chờ sân mô phỏng ra lệnh bắt đầu rồi mới làm nhiệm vụ.",
  },

  "LbMission.beginImmediately_end" : {
    message0 : "Nhiệm vụ: Bắt đầu ngay lập tức %1 %2 Nhiệm vụ: Kết thúc",
    tooltip  : "Làm nhiệm vụ ngay, không chờ nút. Dùng khi tập ở nhà.",
  },

  "LbMission.end" : {
    message0 : "Nhiệm vụ: Kết thúc",
    tooltip  : "Báo đã xong nhiệm vụ và dừng tính giờ.",
  },

  "LbMission.elapsedMillis" : {
    message0 : "Nhiệm vụ: Thời gian đã chạy, tính bằng %1",
    tooltip  : "Cho biết đã mất bao lâu kể từ lúc bắt đầu nhiệm vụ.",
  },

  "Leanbot.DCMotor.setPower" : {
    message0 : "Động cơ DC: Chạy %1 với sức mạnh %2 %%",
    tooltip  : "Cho động cơ DC chạy mạnh hay nhẹ. 100% là mạnh nhất.",
    text     : {"Forward": "tới", "Backward": "lùi"},
  },


  /*---------------------------------------------------------------*/
  "LbMotion.run" : {
    message0 : "Di chuyển: %1 với vận tốc Trái %2 Phải %3 %4",
    tooltip  : "Đặt tốc độ cho hai bánh xe. Hai bánh bằng nhau thì đi thẳng.",
    text     : {"Run": "Chạy", "Turn": "Rẽ"},
  },

  "LbMotion.waitDistanceMm" : {
    message0 : "Di chuyển: Chạy đoạn đường %1 %2",
    tooltip  : "Chạy tiếp cho đủ quãng đường này rồi mới làm lệnh sau.",
  },

  "LbMotion.waitRotationDeg" : {
    message0 : "Di chuyển: Rẽ góc %1 %2",
    tooltip  : "Rẽ tiếp cho đủ góc này rồi mới làm lệnh sau. 90 độ là một phần tư vòng.",
  },

  "LbMotion.wait" : {
    message0 : "Di chuyển: Tiếp tục %1 trong %2 %3",
    tooltip  : "Giữ nguyên tốc độ đang chạy thêm một lúc nữa.",
    text     : {"Running": "chạy", "Turning": "rẽ"},
  },

  "LbMotion.stop" : {
    message0 : "Di chuyển: Dừng",
    tooltip  : "Giảm tốc rồi dừng hẳn hai bánh xe.",
  },

  "LbMotion.setZeroOrigin" : {
    message0 : "Di chuyển: Đặt lại mốc đường đi và hướng",
    tooltip  : "Coi chỗ đang đứng là mốc: đường đi về 0, hướng về 0 độ.",
  },

  "LbMotion.approxDistance" : {
    message0 : "Di chuyển: Đường đã đi, tính bằng %1",
    tooltip  : "Cho biết robot đã đi được bao xa kể từ mốc.",
  },

  "LbMotion.approxHeading" : {
    message0 : "Di chuyển: Hướng đang quay, tính bằng %1",
    tooltip  : "Cho biết robot đã quay lệch bao nhiêu so với mốc.",
  },


  /*---------------------------------------------------------------*/
  "LbGripper.open": {
    message0 : "Tay gắp: Mở",
    tooltip  : "Mở hai càng ra (về góc 0 độ) để nhả khối.",
  },

  "LbGripper.close" : {
    message0 : "Tay gắp: Đóng",
    tooltip  : "Đóng hai càng lại (về góc 90 độ) để kẹp chặt khối.",
  },

  "LbGripper.moveTo" : {
    message0 : "Tay gắp: Xoay tới góc %1 %2",
    tooltip  : "Đưa cả hai càng tới đúng một góc mình chọn.",
  },

  "LbGripper.moveToLR" : {
    message0 : "Tay gắp: Xoay càng Trái tới %1 và càng Phải tới %2 %3 trong %4 %5",
    tooltip  : "Đưa từng càng tới góc riêng, trong khoảng thời gian cho trước.",
  },


  /*---------------------------------------------------------------*/
  "LbRGB.colour_picker" : {
    message0 : "Màu sắc: %1",
    tooltip  : "Chọn một màu từ bảng màu.",
  },

  "LbRGB.colour_random" : {
    message0 : "Màu sắc: Ngẫu nhiên",
    tooltip  : "Chọn đại một màu bất kỳ.",
  },

  "LbRGB.colour_rgb" : {
    message0 : "Màu sắc: Đỏ %1 Lục %2 Lam %3",
    tooltip  : "Pha màu từ ba màu gốc. Mỗi số từ 0 đến 255.",
  },

  "LbRGB.colour_blend" : {
    message0 : "Màu sắc: Trộn %1 với %2 theo tỉ lệ %3",
    tooltip  : "Trộn hai màu với nhau. Tỉ lệ từ 0 đến 1.",
  },

  "LbRGB.setColor" : {
    message0 : "Đèn LED: Đặt %1 thành %2",
    tooltip  : "Chọn màu cho một bóng đèn. Phải có lệnh Bật đèn mới sáng.",
    warning  : "Còn thiếu khối màu",
  },

  "LbRGB.setColorText" : {
    message0 : "Đèn LED: Đặt %1 thành %2",
    tooltip  : "Chọn màu cho một bóng đèn bằng tên màu.",
  },

  "LbRGB.shape" : {
    message0 : "Nhóm đèn: O %1 A %2 B %3 C %4 D %5 E %6 F %7",
    tooltip  : "Chọn những bóng đèn nào nằm trong nhóm.",
    warning  : "Phải chọn ít nhất 2 bóng đèn",
  },

  "LbRGB.fillColor" : {
    message0 : "Đèn LED: Tô %1 bằng màu %2",
    tooltip  : "Đặt cùng một màu cho cả nhóm đèn.",
    warning  : "Còn thiếu khối màu",
  },

  "LbRGB.clear" : {
    message0 : "Đèn LED: Tắt hết",
    tooltip  : "Đưa toàn bộ đèn về màu đen, tức là tắt.",
  },

  "LbRGB.show" : {
    message0 : "Đèn LED: Bật sáng",
    tooltip  : "Cho những màu vừa đặt hiện ra trên đèn thật.",
  },

  "LbRGB.clear_show" : {
    message0 : "Đèn LED: Tắt hết %1 %2 Đèn LED: Bật sáng",
    tooltip  : "Tắt hết đèn, đặt màu mới ở giữa, rồi bật sáng.",
  },


  /*---------------------------------------------------------------*/
  "Leanbot.toneDuration" : {
    message0 : "Âm thanh: Kêu nốt %1 %2 trong %3 %4",
    tooltip  : "Phát một tiếng bíp. Số Hz càng lớn thì tiếng càng cao.",
  },


  /*---------------------------------------------------------------*/
  "LbTouch.read" : {
    message0 : "Nút chạm: %1 đang được chạm?",
    tooltip  : "Đúng khi ngón tay đang chạm vào nút này.",
  },

  "LbTouch.waitUntil" : {
    message0 : "Nút chạm: Chờ tới khi %1 được chạm",
    tooltip  : "Đứng yên chờ, chạm vào nút thì mới chạy tiếp.",
  },

  "Leanbot.ping" : {
    message0 : "Đo xa: Khoảng cách phía trước, tính bằng %1",
    tooltip  : "Robot phát sóng siêu âm để đo xem phía trước cách bao xa.",
  },

  "Leanbot.objectInFront" : {
    message0 : "Đo xa: Phía trước có vật trong vòng %1 %2 ?",
    tooltip  : "Đúng khi có vật cản gần hơn khoảng cách này.",
  },


  /*---------------------------------------------------------------*/
  "LbIRLine.doManualCalibration" : {
    message0 : "Cảm biến vạch: Cân chỉnh bằng nút %1",
    tooltip  : "Dạy robot phân biệt đen và trắng, làm 3 bước theo nút chạm.",
  },

  "LbIRLine.setThreshold" : {
    message0 : "Cảm biến vạch: Đặt ngưỡng  2T %1 0T %2 1P %3 3P %4",
    tooltip  : "Đặt mức phân chia đen / trắng cho từng mắt cảm biến.",
  },

  "LbIRLine.read" : {
    message0 : "Cảm biến vạch: Đọc cảm biến",
    tooltip  : "Nhìn xuống sàn một lần và ghi nhớ kết quả.",
  },

  "LbIRLine.value" : {
    message0 : "Cảm biến vạch: Giá trị 4 mắt (2T, 0T, 1P, 3P)",
    tooltip  : "Lấy kết quả của lần đọc gần nhất, dưới dạng một con số.",
  },

  "LbIRLine.isBlackDetected" : {
    message0 : "Cảm biến vạch: Có thấy màu đen?",
    tooltip  : "Đúng khi ít nhất một mắt cảm biến đang nằm trên vạch đen.",
  },

  "LbIRLine.state" : {
    message0 : "Cảm biến vạch: %1 %2 %3 %4",
    tooltip  : "Mô tả một thế đứng trên vạch: mỗi ô là một mắt, đen hoặc trắng.",
  },

  "LbIRLine.displayOnRGB" : {
    message0 : "Cảm biến vạch: Hiện lên đèn LED màu %1",
    tooltip  : "Cho đèn LED sáng theo mắt nào đang thấy vạch đen.",
  },

};


/*==================================================================================================
                                      Definition
==================================================================================================*/

Blockly.Msg.Leanbot["vi"] = {
  Category      :      LeanbotMsg_vi["Caregory"],
  Warning       :      LeanbotMsg_vi["Warning"],
  Unit          :      LeanbotMsg_vi["Unit"],

  ...LeanbotMsg_vi["Block"],
};
