# Cài đặt hệ thống học Leanbot AIROC

Hướng dẫn từ máy trắng tới lúc nạp được chương trình xuống robot thật và chạy được robot ảo.
Làm một lần cho mỗi máy. Dành cho **huấn luyện viên**, không đưa cho bé tự làm.

Giáo trình: [`giao-trinh.md`](../giao-trinh.md) ·
Việt hóa trình soạn khối: [`../../tools/lbeditor-vi/`](../../../tools/lbeditor-vi)

> **Tài khoản và mật khẩu không ghi trong tài liệu này.** Repo là nơi chứa code, không phải
> nơi chứa mật khẩu. HLV giữ riêng tài khoản Pythaverse của lớp.

## 0. Cần có sẵn

| Thứ | Yêu cầu | Kiểm thế nào |
|---|---|---|
| Máy tính | Windows hoặc Linux, màn hình ≥ 1280×720 | |
| Trình duyệt | **Google Chrome** | Tài liệu Gateway của Pythaverse chỉ hỗ trợ Chrome |
| Mạng | Ổn định, không chặn `*.pythaverse.space` | Mở <https://learn.pythaverse.space/> |
| Robot | Leanbot Standard Kit | Đủ 2 bánh, tay gắp, cảm biến siêu âm, vòng đèn |
| Dây | **USB Type-C** (cổng "Brain" nối Arduino Nano) | |
| Tài khoản | Tài khoản học sinh Pythaverse | HLV cấp |

## 1. Sạc pin trước (2–4 giờ)

Làm **trước buổi học**, không làm trong buổi.

1. Cắm dây vào **cổng Powerbank** của Leanbot.
2. Đèn LED phía trên pin sẽ **nhấp nháy** (xanh hoặc đỏ).
3. Sạc xong khi đèn **thôi nhấp nháy**. Thường mất 2–4 giờ.

Pin yếu là nguyên nhân số một khiến robot chạy lệch mà không ai nghĩ ra. Bài 12 của khóa
gốc có nhắc điều này.

## 2. Đăng nhập và kiểm tra khóa học

1. Vào <https://pythaverse.space/> → đăng nhập.
2. Mở **Student Workspace**: <https://pythaverse.space/student-workspace/dashboard>.
   Trang này cho thấy số hoạt động đã xong và các khóa đã ghi danh.
3. Mở khóa cần học: **SYNAPSE CITY: Robotics & AI Explorer**
   (<https://learn.pythaverse.space/course/view.php?id=1437>). Khóa có **26 hoạt động**
   tính tiến độ.
4. Cùng một tài khoản dùng được cho PGit, Leanbot IDE và PNote — không cần đăng ký thêm.

## 3. Bật nhãn tiếng Việt cho trình soạn khối

Không bắt buộc về kỹ thuật, nhưng là thứ quyết định bé có hiểu bài hay không:
**30 trong 48 nhãn khối Leanbot vẫn là tiếng Anh** ngay cả khi đã chọn Tiếng Việt.

1. Cài tiện ích **Tampermonkey** cho Chrome.
2. Tampermonkey → *Create a new script* → dán toàn bộ
   [`../../tools/lbeditor-vi/lbeditor-vi.user.js`](../../../tools/lbeditor-vi/lbeditor-vi.user.js) → Ctrl+S.
3. Mở <https://ide.pythaverse.space/lbeditor/?lang=vi>.
4. Kiểm: nhóm **Leanbot → Tay gắp** phải thấy khối **"Tay gắp: Mở"**, không phải
   "Gripper: Open". Console hiện `[lbeditor-vi] đã bật nhãn tiếng Việt đầy đủ`.

Bản vá phủ **cả hai** trình soạn khối và **không làm đổi code sinh ra** — xem phần
"Đã kiểm chứng những gì" trong [`../../tools/lbeditor-vi/README.md`](../../../tools/lbeditor-vi/README.md).

## 4. Ba địa chỉ phải phân biệt

Nhầm ba trang này là lỗi hay gặp nhất trong các buổi đầu.

| Trang | Dùng khi | Sinh ra code | Khối bắt đầu |
|---|---|---|---|
| <https://ide.pythaverse.space/lbeditor/> | Robot **thật** | C++ Arduino | `Nhiệm vụ: Bắt đầu khi chạm cùng lúc TB1A + TB1B` |
| <https://ide.pythaverse.space/lbeditor-python-simulation/index.html> | Robot **ảo** (Bản Sao Số) | Python (`pyLeanbot`) | `Nhiệm vụ: Bắt đầu trên Bản Sao Số "<tên>"` |
| <https://ide.pythaverse.space/#/code> (PIDE) | Gõ thẳng C++, và **nạp xuống robot** | — | — |

Quy tắc nhớ cho bé: *"Có tên nhiệm vụ là robot ảo. Có nút chạm là robot thật."*

## 5. Nạp chương trình xuống robot thật

Nguồn: hướng dẫn "How to upload coding program on Leanbot" của Pythaverse.
**Bài 12 của khóa gốc không có bước nào trong mục này** — slide chỉ nói "Upload Generated
C++ Code to physical Leanbot", không nói làm thế nào.

### 5.1 Chép code từ trình soạn khối sang PIDE
1. Trong trình soạn khối, bấm nút **copy** (màu xanh lục, cạnh khung code bên phải).
2. Mở **PIDE** <https://ide.pythaverse.space/#/code>, bấm **CREATE A NEW PROJECT**, đặt tên, bấm **CREATE**.
3. Dán code vào vùng soạn thảo.

### 5.2 Nạp xuống robot
1. Đặt **BOARD** thành **Arduino Uno** hoặc **Arduino Nano**.
2. **Bật robot trước**, rồi mới cắm USB. Đèn trên robot sáng đỏ.
3. Bấm **Compile & Upload**.
4. Chọn cổng COM, tùy trường hợp:
   - **Không hiện hộp thoại nào** → bỏ qua, sang bước 5. Thường gặp khi máy đã nạp thành công trước đó.
   - **Hiện hộp "wants to connect to a serial port" có danh sách cổng** → chọn cổng đúng, bấm **Connect**.
   - **Hiện hộp nhưng danh sách trống** → rút dây USB, cắm lại, rồi chọn lại.
5. Chờ tới khi hiện **"100% – Done!"**. Tiến trình đi 25% → 50% → xong.
6. **Rút dây USB.** Robot bắt đầu chạy chương trình mới.
7. Robot chờ **chạm cùng lúc TB1A + TB1B** rồi mới đi (nếu dùng khối Nhiệm vụ của lớp).

### 5.3 Máy Linux báo "Failed to open serial port"

Hộp chọn cổng thấy `USB Serial (ttyUSB0)` mà nạp thì báo lỗi này: tài khoản chưa có quyền mở
cổng (`/dev/ttyUSB0` thuộc nhóm `dialout`; thêm vào nhóm rồi thì phải đăng xuất mới có hiệu
lực). Cấp quyền một lần cho mọi Leanbot (chip CH340, `1a86:7523`), không cần đăng xuất:

```bash
echo 'SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", MODE="0666", ENV{ID_MM_DEVICE_IGNORE}="1"' \
  | sudo tee /etc/udev/rules.d/99-leanbot.rules
sudo udevadm control --reload && sudo udevadm trigger
```

Kiểm ngày 22/10/2026 trên máy của thầy: sau lệnh này IDE nạp tới 100% – Done!.
Chip CH340 không có số serial nên **Chrome không nhớ quyền cổng**: mỗi lần mở lại Chrome phải
bấm SELECT DEVICE chọn cổng một lần.

Máy **Windows 7 32-bit** cần cài driver cổng Arduino riêng — xem tài liệu
"Instructions for installing the driver for the port connected to the Arduino circuit"
trên <https://pythaverse.space/docs/>. Windows 10/11 và Linux không cần.

## 6. Chạy robot ảo (Bản Sao Số)

Chuỗi bốn trang, lấy từ bài học Bài 10. **Chưa tự tay chạy thử**, nên buổi đầu cần dự phòng thời gian.

1. **Trình soạn khối Python:** mở
   <https://ide.pythaverse.space/lbeditor-python-simulation/index.html?lang=vi>.
   Bấm **Load Demo** (nút hình thư mục) → **OK** ở hộp "Replace existing blocks?".
2. Bấm **Open PNote** để chép mã. Cho phép quyền truy cập clipboard khi Chrome hỏi
   (**Allow**) — đây là quyền đọc bộ nhớ tạm của chính trang đó, không phải quyền gì khác.
3. **PNote:** <https://note.pythaverse.space> → **Sign in with Pythaverse eID** →
   tạo sổ **Python 3 (ipykernel)** → dán mã → bấm **▶▶ Restart the kernel and run all cells**.
   PNote nhận tối đa 100 người cùng lúc.
4. **Bản Sao Số:** bấm đường dẫn hiện ra trong kết quả chạy
   (<https://digitaltwin.pythaverse.space/experience>) → bấm **Start**.
   Kết quả in `Countdown 3-2-1`, `Go`, rồi `[LbMission.end] Done`.
5. Đóng tab sau mỗi lần chạy, rồi làm lại từ bước 3 cho lần sau.

Điều khiển camera: chuột trái kéo = xoay, chuột phải kéo = di chuyển, con lăn = phóng to.
Nút **Back** mở **Mission histories** để xem lại, so thời gian và chia sẻ.

Tên nhiệm vụ mặc định là **`msNumberGrid`** — **không sửa**, sai tên thì không chạy.

> Slide Bài 10 có hai địa chỉ Bản Sao Số: `digitaltwin.pythaverse.space` (hiện trong kết
> quả chạy thật) và `dt-qa.pythaverse.space` (chú thích cũ trong mã mẫu). **Dùng cái đầu.**

## 7. Nối robot thật vào Bản Sao Số (Gateway) — chỉ khi cần

Chỉ cần khi muốn robot **thật** chạy trong sân ảo. Các bài 1–16 không bắt buộc.
Nguồn: tài liệu Gateway của Pythaverse, **cập nhật lần cuối 16/10/2023 — có thể đã cũ**.

1. Nạp chương trình nhiệm vụ xuống robot qua USB (mục 5).
2. **Ghép đôi Bluetooth** trên Windows: bật robot, đèn Bluetooth nhấp nháy. Chọn mục
   Leanbot **không có chữ BLE** → **Pair** → mã **1234** → chờ hiện **Connected**.
   Xem cổng COM trong **Devices and Printers**.
3. Mở Gateway <https://meta.pythaverse.space/gateway?lang=en> → **Select Leanbot to connect**
   → chọn **Port (COMx)**, **không chọn** mục tên Leanbot → **Connect**.
4. Nối thành công khi đèn Bluetooth **thôi nhấp nháy**.

Ba điều cấm theo tài liệu gốc: **đừng chọn tên Leanbot** trong hộp chọn cổng (Chrome có
thể treo), **đừng tắt robot** giữa chừng, và chỉ bấm **Start** sau khi đã thấy đủ Status,
Time và Score.

## 8. Kiểm tra cuối: máy đã sẵn sàng chưa

Làm đủ 6 mục này thì buổi học chạy được.

- [ ] Pin đầy, đèn thôi nhấp nháy
- [ ] Đăng nhập được PLearn, thấy khóa SYNAPSE CITY
- [ ] Trình soạn khối hiện **"Tay gắp: Mở"** bằng tiếng Việt
- [ ] Nạp được một chương trình xuống robot, thấy **"100% – Done!"**
- [ ] Robot chạy khi chạm TB1A + TB1B
- [ ] Chạy được mã mẫu trên Bản Sao Số, thấy `[LbMission.end] Done`

## 9. Hỏng thì làm gì

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Danh sách cổng COM trống | Dây USB chỉ sạc, không truyền dữ liệu; hoặc chưa bật robot | Đổi dây; bật robot **trước** khi cắm |
| Nạp xong nhưng robot đứng yên | Thiếu hoặc sai khối `Nhiệm vụ: Bắt đầu` | Kiểm khối bắt đầu; robot thật phải dùng khối **nút chạm**, không dùng khối Bản Sao Số |
| Robot đi lệch dần sang một bên | Hai động cơ không đều hẳn | Bình thường. Chỉnh **một** số mỗi lần rồi chạy lại |
| Lệnh 50 cm nhưng đi 48 hoặc 52 cm | Ma sát sàn khác nhau | Bình thường. Giảm số (50 → 47) rồi thử lại |
| Robot bám vạch rồi lạc | Chưa cân chỉnh, hoặc ánh sáng phòng đã đổi | Cân chỉnh lại bằng nút TB1A (Bài 4) |
| Khối vẫn hiện tiếng Anh | Chưa thêm `?lang=vi`, hoặc Tampermonkey đang tắt | Thêm `?lang=vi`; kiểm Console có dòng `[lbeditor-vi]` |
| Chrome treo khi chọn cổng ở Gateway | Đã chọn nhầm mục tên Leanbot | Bấm ổ khóa trên thanh địa chỉ → **Reset permission** → làm lại |
| Bản Sao Số không chạy | Sai tên nhiệm vụ, hoặc PNote đang quá tải | Giữ đúng `msNumberGrid`; chờ rồi chạy lại |

Tài liệu khắc phục sự cố của Pythaverse: <https://pythaverse.space/docs/troubleshooting-guide/>

## 10. Chỗ hướng dẫn này còn thiếu

1. **Chưa tự tay chạy mục 6 và mục 7.** Các bước chép từ slide Bài 10 và tài liệu Gateway.
   Mục 5 (nạp qua USB) cũng lấy từ tài liệu Pythaverse, chưa thử trên robot của lớp.
2. **Chưa đọc dữ liệu từ robot thật.** Khi cắm robot qua USB, có thể đọc thêm phiên bản
   firmware, hiệu chỉnh cảm biến đang lưu, và mức pin — những thứ đó sẽ giúp chỉnh giáo án
   cho đúng con robot này. Việc này cần robot cắm vào máy.
3. **Chưa biết lớp dùng Windows hay Linux**, nên phần driver mới nêu nguyên tắc.

## Nạp code không cần trình duyệt

Cách này dùng khi WebSerial không chạy (Chrome thiếu quyền cổng, máy Linux chưa vào nhóm
`dialout`, hoặc muốn nạp hàng loạt bằng script). Đã chạy thật ngày 21/10/2026 trên máy của
huấn luyện viên.

Mấu chốt: **không cần thư viện Leanbot trên máy**. Thư viện nằm trên máy chủ biên dịch của
hãng — đúng máy chủ mà trình soạn khối web gọi tới. Máy mình chỉ cần `avrdude` để nạp file hex.

1. **Biên dịch.** POST lên `https://cs.leanbot.space/v3/compile`, thân JSON:

   ```json
   {
     "fqbn": "arduino:avr:uno",
     "files": [{ "name": "LeanbotSketch/LeanbotSketch.ino", "content": "<mã nguồn>" }],
     "flags": { "verbose": false, "preferLocal": false },
     "libs": []
   }
   ```

   Trả về `{ "hex": "<base64>", "log": "<log biên dịch>" }`. Lỗi biên dịch thì `hex` rỗng và
   `log` là thông báo lỗi của gcc — rất hữu ích để **kiểm tên hàm có thật hay không**.

2. **Giải base64** ra tệp `.hex`.

3. **Nạp.** `avrdude` đi kèm nhân `arduino:avr` (cài bằng `arduino-cli core install arduino:avr`):

   ```bash
   avrdude -C <đường dẫn>/avrdude.conf -p atmega328p -c arduino \
           -P /dev/ttyUSB0 -b 115200 -D -U flash:w:chuongtrinh.hex:i
   ```

   Dù não là Arduino NANO, `-c arduino -b 115200` (dạng UNO) vẫn nạp được, khớp với việc
   trình soạn đặt `BOARD: ARDUINO UNO`.

4. **Đọc robot nói gì.** Mở `/dev/ttyUSB0` ở 115200 baud. Robot in số hiệu của nó khi khởi
   động, rồi in tiếp những gì chương trình `Serial.print`.

Máy Linux cần quyền cổng: tài khoản phải ở nhóm `dialout` (`sudo usermod -aG dialout $USER`,
rồi **đăng xuất đăng nhập lại**), và phải chặn `brltty` nhận nhầm chip CH340 làm màn hình chữ
nổi (`sudo systemctl mask brltty-udev.service brltty.service`). Không chặn thì `/dev/ttyUSB0`
hiện ra rồi biến mất sau một giây.
