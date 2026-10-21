# Bài 10 — Nhìn robot chạy thử trước (Bản Sao Số)

> Bài gốc: *See Your Robot Before It Moves* · 40 slide · 4 chương (Engage 8 slide, Learn 4, Resolve 22, Growth 6) · Plearn: <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62981>

> Bài này **mở đầu phần mô phỏng** (Bài 10–12). Bé chạy chương trình trên **Leanbot ảo** trong **Bản Sao Số**, chưa dùng robot thật. Bài dùng **Python** (không phải C++) và **ba trang web** cùng lúc. Phần "Dạy thế nào" ghi từng bước thao tác, vì đây là chỗ bé và thầy dễ lạc nhất.
>
> **Chưa ai tự tay chạy thử toàn bộ chuỗi này.** Các bước lấy từ slide (và tài liệu Gateway bản 16/10/2023 có thể đã cũ, theo giáo trình tổng §11). Thầy phải chạy thử một lượt trước buổi học và dành thời gian dự phòng.

## Bé học xong thì làm được gì
- Giải thích được vì sao phải chạy thử robot trong máy trước khi cho robot thật chạy: "Thử trước, chạy thật sau".
- Nói được ba việc của robot: nhìn (cảm biến), nghĩ (bộ não), làm (bánh xe, tay gắp).
- Tự chạy được chương trình mẫu trên Bản Sao Số: mở trình soạn khối, nạp mã mẫu, chạy ở PNote, bấm Start, xem robot ảo chạy.
- Sửa một con số (tốc độ, quãng đường hoặc thời gian chờ) rồi chạy lại, mô tả được robot đi hướng nào, nhanh hay chậm, có gì bất ngờ.
- So sánh hai lần chạy: giống nhau (robot đáng tin) hay khác nhau (có manh mối để sửa lỗi), và đoán trước kết quả trước khi chạy.

## Cần chuẩn bị
| Thứ | Ghi chú |
|---|---|
| Laptop, trình duyệt Chrome | Chrome sẽ hỏi quyền đọc nội dung đã copy (bước Allow). Màn hình tối thiểu 1280×720 |
| Mạng Internet | Cả ba trang đều là web |
| Chuột rời | Bản Sao Số cần kéo chuột phải và cuộn con lăn. Touchpad khó dùng, nên có chuột rời |
| Tài khoản **Pythaverse eID** cho từng bé | Dùng để đăng nhập PNote. Thầy tạo và thử đăng nhập **trước** buổi học |
| Trình soạn khối (Python) | <https://ide.pythaverse.space/lbeditor-python-simulation/index.html> |
| PNote | <https://note.pythaverse.space> |
| Bản Sao Số | Link hiện trong kết quả (output) của PNote: <https://digitaltwin.pythaverse.space/experience> |
| Giấy ghi quan sát | Phiếu có 3 dòng: "Robot đi hướng nào? Nhanh hay chậm? Có gì bất ngờ?" |
| Không cần robot Leanbot thật | Bài này chưa nạp xuống robot thật (đó là Bài 12) |

**Lưu ý trước buổi học:**
- PNote chỉ cho tối đa **100 người** dùng cùng lúc (slide 10, chương Resolve). Lớp đông hoặc trùng giờ với lớp khác có thể không đăng nhập được. Bé đang đăng nhập ở máy khác thì phải đăng xuất. Đăng nhập lỗi thì chờ một lúc rồi thử lại.
- **Việt hóa nhãn khối:** bản vá `tools/lbeditor-vi/lbeditor-vi.user.js` phủ **cả hai** trình soạn khối, kể cả `lbeditor-python-simulation`. Đã kiểm trên máy ngày 21/10/2026: nhãn ra tiếng Việt và code Python sinh ra không đổi. Nhớ mở trang kèm `?lang=vi`.

## Thuật ngữ của bài
Từ đã có ở giáo trình tổng §5 (Digital Twin = Bản Sao Số; Test = Chạy thử; Mission = Nhiệm vụ; Debug = Sửa lỗi; Parameter = Tham số; Program = Chương trình) thì dùng đúng cách dịch đó.

| Tiếng Anh (bé sẽ thấy trên Plearn) | Tiếng Việt | Nói với bé |
|---|---|---|
| Virtual Leanbot Digital Twin | Leanbot ảo trong Bản Sao Số | Robot giống hệt nằm trong máy tính. Thử trước, không sợ hỏng |
| Simulation | Chạy thử ảo (mô phỏng) | Xem robot chạy trên màn hình như xem phim |
| Chief Engineer | Kỹ sư trưởng | Con là người chịu trách nhiệm cho robot chạy tốt |
| Test first. Run later. | Thử trước, chạy thật sau | Kiểm tra trong máy trước rồi mới cho robot thật chạy |
| Physical AI: Sees / Thinks / Acts | Robot nhìn / nghĩ / làm | Cảm biến nhìn, bộ não nghĩ, bánh xe và tay gắp làm |
| Observe | Quan sát | Nhìn thật kỹ: đi hướng nào, nhanh hay chậm |
| Prediction | Dự đoán | Đoán trước robot sẽ làm gì, dựa vào điều con đã biết |
| Consistent | Nhất quán | Chạy mấy lần robot cũng làm y như nhau thì đáng tin |
| Clue | Manh mối | Lần này khác lần trước là gợi ý để tìm chỗ sai |
| PNote | PNote (sổ tay Python của Pythaverse) | Nơi dán mã để gửi cho robot ảo |
| Notebook / cell | Trang sổ tay / ô mã | Trang giấy chứa các ô, mỗi ô chứa một đoạn mã |
| Kernel | Bộ chạy mã | Phần chạy mã trong PNote. "Restart" là cho chạy lại từ đầu |
| Python Blockly Editor | Trình soạn khối (ra mã Python) | Kéo khối, máy tự viết mã Python bên phải |
| Camera angle / Pan / Zoom | Xoay góc nhìn / Dịch khung hình / Phóng to thu nhỏ | Cách nhìn robot rõ hơn |
| Mission histories / Replay | Lịch sử nhiệm vụ / Xem lại | Danh sách các lần chạy, bấm vào để xem lại |
| steps/sec | bước/giây | Đơn vị tốc độ bánh xe. 2000 là tiến, số âm là lùi |

## Khối lệnh dùng trong bài
Tên khối (cột đầu) đối chiếu `lbeditor-blocks-en.json`. Dấu **(?)** là suy đoán của file bóc tách. Cột "Nhãn Việt" xem lưu ý ở trên.

| Khối | Nhãn Việt | Làm gì |
|---|---|---|
| `Leanbot.whenStarted` | Leanbot bắt đầu hoạt động | Khối mũ của chương trình |
| `LbMission.beginByServer_end` (?) | Nhiệm vụ: Bắt đầu trên Bản Sao Số [msNumberGrid] ... Nhiệm vụ: Kết thúc | Bao quanh chương trình, gửi lên Bản Sao Số. Ô chọn tên nhiệm vụ trên slide là `msNumberGrid`. Sinh ra `LbMission.beginDigitalTwin("msNumberGrid")` và `LbMission.end()` |
| `LbMotion.run` (?) | Di chuyển: Chạy với vận tốc Trái [2000] Phải [2000] bước/giây | Đặt tốc độ hai bánh. Hai bánh bằng nhau thì đi thẳng |
| `LbMotion.waitDistanceMm` | Di chuyển: Chạy đoạn đường [35] cm | Chạy tiếp cho đủ quãng đường |
| `LbMotion.stop` | Di chuyển: Dừng | Dừng hẳn hai bánh |
| `Leanbot.delay` | Chờ [1] giây | Đứng yên một lúc |
| `LbGripper.close` | Tay gắp: Đóng | Kẹp khối |
| `LbGripper.open` | Tay gắp: Mở | Nhả khối |
| Khối ghi chú (comment) | Ghi chú | Nhãn "Go straight", "Pick object", "Go back", "Drop object" chia chương trình thành 4 đoạn |

Slide hiện đơn vị **steps/sec** ở khối Chạy. Bản json của khối `LbMotion.run` ghi **rpm**; có thể là biến thể khác của khối. Giáo trình tổng §6 cho cả hai khoảng: −59 … 59 vòng/phút, hoặc −2000 … 2000 bước/giây. Không mâu thuẫn, chỉ khác đơn vị.

## Dạy thế nào
Buổi 12 trong lộ trình, 90 phút (45 phút học + 45 phút thực hành). Cột mốc: **chạy được chương trình trên robot ảo.**

### Mở bài (5 phút)
1. Thầy nói giọng nhẹ, không đổ lỗi: "Hôm nay mỗi con là **Kỹ sư trưởng**. Con chịu trách nhiệm cho một con robot thật. Robot đó phải chạy tốt, không được hỏng."
2. Kể: robot đi qua đường quan trọng, đưa đồ quý. Nếu đâm tường thì nhiệm vụ hỏng. "Lần trước, một robot đi sai hướng rồi đâm tường. Không ai thử nó trước. Con đoán vì sao?"
3. Hỏi (cả lớp giơ tay), theo slide ENGAGE 07: "Việc **đầu tiên** nên làm là gì?" A. Bật robot rồi cầu may. B. Thử robot trong một thế giới giả an toàn trước. C. Không dùng robot, cất lên kệ.
4. Cho bé chọn. Đáp án theo mạch bài là **B** (slide không ghi đáp án). Hỏi một bé vì sao.

### Giảng (35 phút)
**Bước 1. Robot nhìn, nghĩ, làm (7 phút)**
- Thầy vẽ bảng ba cột, chỉ vào robot thật hoặc ảnh:
  - **Nhìn:** cảm biến như mắt, thấy tường, đường, màu, vật.
  - **Nghĩ:** bộ não máy tính nhỏ, nhìn rồi tính làm gì tiếp, như con nghĩ trước khi làm.
  - **Làm:** rẽ, tiến, dừng, quay. Mọi việc robot làm đến từ điều nó thấy và nghĩ.
- Hỏi: "Việc nào robot dùng bánh xe? Việc nào dùng mắt?"

**Bước 2. Thử trước, chạy thật sau (5 phút)**
- Kể hai ví dụ trên slide: phi công tập trên máy bay mô phỏng; bác sĩ phẫu thuật học kỹ trước khi mổ.
- Nói: "Nghĩ trước khi làm không chậm. Nó **rất thông minh**."
- Viết ba bước lên bảng và cho cả lớp đọc theo: **1. Thử** trong thế giới ảo. **2. Quan sát** robot có đi như mình muốn không. **3. Chạy** robot thật.
- Giới thiệu **Bản Sao Số**: "Robot ảo y như robot thật, nhưng nằm trong máy. Con viết lệnh 'tiến', nó tiến trên màn hình như phim hoạt hình. Hỏng cũng không sao."

**Bước 3. Cùng làm Hoạt động 1: "Cho robot ảo chạy lần đầu" (23 phút)**
Thầy làm trên màn chiếu từng bước, bé làm theo trên máy mình, **mỗi bước xong cả lớp mới sang bước sau**. Ba tab sẽ mở lần lượt: tab 1 Trình soạn khối, tab 2 PNote, tab 3 Bản Sao Số. Thầy nói trước: "Con sẽ mở ba trang. Nhớ trang nào là trang nào. Tên mỗi tab ở phía trên."

*Phần A. Tab 1 — Trình soạn khối: lấy mã mẫu*
1. Mở Chrome, vào địa chỉ <https://ide.pythaverse.space/lbeditor-python-simulation/index.html>. Tên trang là "Blockly Editor", có chữ LEANBOT. Bên trái là các nhóm: Logic, Loops, Math, Variables, Functions, Arduino, Leanbot (Text, Lists cũng có). Vùng ghép khối đang có đúng 3 khối: "When Leanbot started", "Mission: Begin Digital Twin [msNumberGrid]" và "Mission: End".
2. Bấm nút **"Load Demo"**. Đó là nút hình **thư mục mở** ở thanh công cụ (đầu thanh, slide khoanh đỏ). Slide gọi tên là "Load Demo", nhưng chữ trên nút không đọc được từ ảnh. Thanh công cụ còn có nút ba chấm, nút mở rộng, hoàn tác, làm lại, nút copy, nút dán.
3. Hộp thoại hiện ra: **"Replace existing blocks? 'Cancel' will merge."** Bấm **OK**. (OK = thay khối cũ bằng khối mẫu. **Đừng bấm Cancel**: Cancel sẽ *gộp* khối mẫu vào khối cũ, đống khối sẽ bị lộn xộn.)
4. Mã mẫu hiện ra. Bên phải là khung mã Python. Bé và thầy cùng đọc bốn đoạn ghi chú: "Go straight", "Pick object", "Go back", "Drop object". Hỏi: "Robot sẽ làm bốn việc gì, theo thứ tự?"
5. Bấm nút **"Open PNote"**: hai tờ giấy màu **xanh ngọc** ở **góc phải khung mã**; có hai nút, bấm nút **ở trên**. Nút này tự copy mã vào bộ nhớ và mở tab mới <https://note.pythaverse.space>.
6. Chrome hỏi: **"ide.pythaverse.space wants to — See text and images copied to the clipboard"** (trên thanh địa chỉ hiện "Share clipboard?"). Bấm **Allow**. **Không bấm Block**, nếu không mã sẽ không dán được.

*Phần B. Tab 2 — PNote: dán và chạy mã*

7. Ở tab PNote, bấm nút cam **"Sign in with Pythaverse eID"** và đăng nhập. Nói với bé: "PNote như quyển sổ ghi lệnh cho robot. Mình mở nó ra cho sẵn sàng nhận mã."
8. Màn hình Launcher của JupyterLab hiện ra. Ở mục **Notebook**, bấm ô **"Python 3 (ipykernel)"**. Ra một trang sổ mới tên "Untitled.ipynb" có một ô trống `[ ]:`.
9. Bấm vào ô trống rồi **dán** mã vừa copy (nút dán trên thanh công cụ của notebook, hoặc Ctrl+V). Ô phải hiện mã bắt đầu bằng `#  Generated Leanbot Python code` và có dòng `from pyLeanbot import *`.
10. Trên thanh công cụ notebook, bấm nút **"Restart the kernal and run all cells"** (slide viết "kernal", là chữ sai của slide; nút có hình **▶▶**, nằm bên phải các nút lưu, +, cắt, copy, dán, ▶, ■, ↻). Với bé, nói đơn giản: "nút ▶▶ chạy cả trang".
11. Kéo xuống phần kết quả (output) dưới ô mã. Sẽ có hai dòng:
    ```
    [LbMission.begin]  Virtual Leanbot ready to run msNumberGrid
    [LbMission.begin]  Please go to  https://digitaltwin.pythaverse.space/experience  to START ...
    ```
    **Bấm vào đường link** ở dòng thứ hai (slide khoanh đỏ). Nó mở tab thứ ba.

*Phần C. Tab 3 — Bản Sao Số: xem robot chạy*

12. **Slide không có mục (1) của "Bước 3"** (slide đánh số từ (2)). Có thể mục (1) là việc bấm link ở bước 11. Thầy ghi nhớ điểm này.
13. Trang hiện thanh xanh có chữ **"Mission: msNumberGrid  by ducanhqa"**, **"Status: Ready"**, **"Time: 0.0"**, **"Score: 0"**, hai nút **"Start"** và **"Back"**. Dưới là sa bàn trắng đánh số 1–21 (3 hàng × 7 ô: hàng trên 1–7, giữa 8–14, dưới 15–21) và Leanbot ảo màu đỏ nằm khoảng giữa ô 10 và 11 trên nền màu nâu.
14. Điều khiển góc nhìn (slide "Mastering Digital Twin Visual Controls"):
    - **Đổi góc nhìn:** nhấn giữ **chuột trái** rồi kéo.
    - **Dịch khung hình (Pan):** nhấn giữ **chuột phải** rồi kéo.
    - **Phóng to / thu nhỏ:** **cuộn con lăn** chuột.
15. Bấm nút **"Start"** (góc phải thanh xanh, cạnh "Back"). Cả lớp quan sát. Trên PNote sẽ in thêm:
    ```
    [LbMission.begin]  Countdown 3 ...
    [LbMission.begin]  Countdown 2 ..
    [LbMission.begin]  Countdown 1 .
    [LbMission.begin]  Go
    [LbMission.end]  Done
    ```
16. Chạy xong, **đóng tab Bản Sao Số** (để khỏi nhầm khi chạy lần sau). Quay lại tab PNote xem kết quả. Dòng cuối `[LbMission.end]  Done` nghĩa là xong.
17. Hỏi cả lớp: "Robot làm những gì? Theo thứ tự nào?" Mong đợi: tiến 35 cm → đứng chờ 1 giây, kẹp → chờ 1 giây → lùi 35 cm → chờ 1 giây, mở tay gắp → chờ 1 giây. (Đây là suy ra từ mã. Slide không mô tả kết quả trên màn hình.)

### Bé tự làm (45 phút)
**Hoạt động 2: "Chạy thêm một lần" (slide Resolve 15–21)**

1. **Sửa chương trình.** Có hai cách. Cách dễ hơn, ít lỗi hơn (mẹo của slide): quay lại **Tab 1 (Trình soạn khối)**, đổi con số ngay trên khối, rồi bấm "Open PNote" lại để copy mã mới. Cách thứ hai: sửa số trực tiếp trong mã Python ở PNote.
   - **Được đổi:** tốc độ Trái/Phải (2000, 2000 và −1000, −1000), quãng đường (35 cm và −35 cm), số giây chờ (1 giây, có 4 chỗ).
   - **Không đổi:** tên nhiệm vụ **`msNumberGrid`** ("don't change this mission name in this lesson", slide ghi rõ).
   - Mỗi lần chỉ đổi **một** con số, để biết số nào gây ra điều gì.
2. **Nạp lại:** lặp bước 5–6 (Open PNote, Allow), rồi dán vào ô và bấm **▶▶** như bước 9–10. (Muốn gọn thì dán đè lên ô cũ; thầy thử cách làm nào ít lỗi nhất.)
3. **Dự đoán trước khi bấm Start** (slide Growth 01). Bé viết một câu: "Mình đoán robot sẽ ______." Thầy hỏi: "Đi thẳng? Rẽ? Dừng? Vẽ hình trong đầu rồi mới bấm."
4. **Bấm link, bấm Start**, quan sát có ghi phiếu: **hướng** (tiến, lùi, rẽ trái, rẽ phải?), **tốc độ** (nhanh hay chậm? có dừng không? có chậm lại trước khi rẽ không?), **bất ngờ** (robot có làm gì mình không đoán trước?). Nói với bé: "Kỹ sư giỏi không bấm Start rồi quay đi. Mắt con là dụng cụ quan trọng nhất lúc này."
5. **Mô tả cho bạn cùng bàn**, theo câu mẫu: "Robot đi **thẳng** rồi **lùi**." / "Nó đi rất **nhanh** rồi **dừng đột ngột**." / "Nó làm điều **con không đoán trước**." Đúng sai không quan trọng: "Đoán sai cũng thú vị như đoán đúng, vì cả hai đều dạy mình điều mới."
6. **Chạy lại lần nữa mà không đổi gì**, rồi so sánh (slide Resolve 19–20):
   - **Giống nhau:** robot nhất quán, làm theo lệnh đáng tin, mã đang chạy tốt.
   - **Khác nhau:** có thể có lỗi nhỏ trong mã, hoặc mô phỏng đã thay đổi. Đó là **manh mối** để tìm hiểu tiếp.
7. **Xem lịch sử.** Ở trang Bản Sao Số, bấm nút **Back** để vào trang **Mission histories**. Trang có nút **BACK** (trái), **LOGOUT** (phải), hai tab **MY MISSIONS** / **SHARED MISSIONS**, các cột Date, Mission, thời gian, "Is public". Bấm nút xanh tên nhiệm vụ để xem lại ("click here to replay your mission"). Nút xám bên cạnh để copy link ("click here to copy link for your submission"). Công tắc "Is public" để cho người khác xem. **Chưa bật chia sẻ nếu chưa hỏi thầy.**
   - Slide cho mẫu các lần chạy ngày 2025-02-20: thời gian 19.4; 17.4; 18.2; 17.4; 18.2; 17.4; 17.4. **Slide không ghi đơn vị** (hợp lý là giây). Dùng thời gian từng lần để chọn bản chạy tốt nhất trước khi nạp cho robot thật (Bài 12).
8. **Khám phá ý mới** (slide Growth 02, nếu còn thời gian): đổi một thứ nữa (chậm hơn, chờ lâu hơn, đổi quãng đường). Câu hỏi: "Nếu chỉ đổi **một** số thì sao?" Mỗi lần đổi là một thí nghiệm.

Nhớ: sau mỗi lần chạy **đóng tab Bản Sao Số**.

### Chốt bài (5 phút)
1. Ba câu hỏi chính của bài, hỏi miệng: (1) Vì sao phải thử robot trước khi chạy thật? (An toàn, không hỏng, học trước khi làm.) (2) Trong Bản Sao Số con làm được gì? (Chạy thử, quan sát, dự đoán, so sánh, thử ý mới.) (3) Bản Sao Số khác robot thật chỗ nào? (Bản Sao Số để **nghĩ** và thử; robot thật để **làm**.)
2. Ba chữ: **An toàn** (không gì hỏng trong mô phỏng), **Thông minh** (học trước khi làm), **Tự tin** (sẵn sàng cho robot thật).
3. Nói: "Hôm nay con là kỹ sư: con đã thử, quan sát, dự đoán và khám phá."
4. Nhắc bé vào Plearn bấm hoàn thành hoạt động bài này ở <https://learn.pythaverse.space/mod/h5pactivity/view.php?id=62981>. Cuối bài Plearn có một trang "Check Your Understanding" (xem mục câu hỏi bên dưới).

## Chương trình mẫu
Chương trình `msNumberGrid`: 4 đoạn **Đi thẳng, Gắp vật, Đi lùi, Thả vật**. Tên khối lấy từ file bóc tách; Python chép từ slide.

- Leanbot bắt đầu hoạt động
  - Nhiệm vụ: Bắt đầu trên Bản Sao Số **msNumberGrid**
    - *Ghi chú:* Go straight
      - Di chuyển: Chạy với vận tốc Trái **2000** Phải **2000** bước/giây
      - Di chuyển: Chạy đoạn đường **35** cm
      - Di chuyển: Dừng
    - *Ghi chú:* Pick object
      - Chờ **1** giây
      - Tay gắp: Đóng
      - Chờ **1** giây
    - *Ghi chú:* Go back
      - Di chuyển: Chạy với vận tốc Trái **−1000** Phải **−1000** bước/giây
      - Di chuyển: Chạy đoạn đường **−35** cm
      - Di chuyển: Dừng
    - *Ghi chú:* Drop object
      - Chờ **1** giây
      - Tay gắp: Mở
      - Chờ **1** giây
  - Nhiệm vụ: Kết thúc

```python
from pyLeanbot import *
Leanbot.begin()
# To START mission, please go to https://dt-qa.pythaverse.space/experience
LbMission.beginDigitalTwin("msNumberGrid")
### Go straight
LbMotion.runLR(2000, 2000)
LbMotion.waitDistanceMm(35 * 10)
LbMotion.stopAndWait()
###
### Pick object
LbDelay(1 * 1000)
LbGripper.close()
LbDelay(1 * 1000)
###
### Go back
LbMotion.runLR(-1000, -1000)
LbMotion.waitDistanceMm((-35) * 10)
LbMotion.stopAndWait()
###
### Drop object
LbDelay(1 * 1000)
LbGripper.open()
LbDelay(1 * 1000)
###
LbMission.end()
```

Đối chiếu khối ↔ dòng mã:

| Khối | Dòng Python |
|---|---|
| Chạy với vận tốc Trái 2000 Phải 2000 | `LbMotion.runLR(2000, 2000)` |
| Chạy đoạn đường 35 cm | `LbMotion.waitDistanceMm(35 * 10)` (cm × 10 = mm) |
| Dừng | `LbMotion.stopAndWait()` |
| Chờ 1 giây | `LbDelay(1 * 1000)` (giây × 1000 = mili giây) |
| Tay gắp: Đóng / Mở | `LbGripper.close()` / `LbGripper.open()` |
| Nhiệm vụ: Bắt đầu trên Bản Sao Số | `LbMission.beginDigitalTwin("msNumberGrid")` |
| Nhiệm vụ: Kết thúc | `LbMission.end()` |

**Biến thể ở slide 09** (bản demo ngày 2025-02-20, kết quả khác ngày): sau dòng `beginDigitalTwin` có thêm hai dòng, trước "Go straight":
```python
LbMotion.runLRrpm(30, -30)
LbMotion.waitRotationDeg(90)
```
Hai dòng này làm robot **xoay tại chỗ 90 độ** (hai bánh quay ngược chiều, tốc độ 30 và −30 vòng/phút). Slide không giải thích dòng này. Giải thích "xoay tại chỗ" là suy ra từ mã và từ Bài 1.

**Không có C++ trong bài này.** Mã bài 10 là Python; khóa gốc nạp mã Python qua PNote cho Bản Sao Số. (Chương trình C++ của bài 1–4 chạy trên robot thật qua trình soạn khối khác.)

## Phiếu ôn luyện

**Bài 1. Sắp thứ tự** (dễ)
**Đề:** Sắp 3 thẻ theo thứ tự đúng: (A) Chạy robot thật (B) Quan sát xem robot có đi như mình muốn không (C) Thử mã trong thế giới ảo.

**Đáp án:** C → B → A. (Thử → Quan sát → Chạy robot thật.)

**Bài 2. Đọc đoán kết quả**
**Đề:** Đọc chương trình mẫu ở trên. a) Robot đi tiến bao nhiêu cm, rồi lùi bao nhiêu cm? b) Tổng thời gian đứng chờ (các khối "Chờ") là bao nhiêu giây? c) Hai khối "Tay gắp" làm gì, theo thứ tự?

**Đáp án:** a) Tiến **35 cm**, lùi **35 cm** (khối lùi ghi −35). b) 4 khối chờ, mỗi khối 1 giây, tổng **4 giây**. c) **Đóng** tay gắp (kẹp vật) trước, **Mở** tay gắp (thả vật) sau.

**Bài 3. Đọc đoán kết quả**
**Đề:** Đổi hai tốc độ 2000, 2000 thành 1000, 1000. Quãng đường vẫn 35 cm. Con đoán: (a) robot còn đi thẳng không? (b) nhanh hơn hay chậm hơn? (c) khi so thời gian chạy, lần nào lâu hơn?

**Đáp án:** (a) Còn đi **thẳng**, vì hai bánh vẫn bằng nhau. (b) **Chậm hơn**. (c) Lần tốc độ **1000** lâu hơn. (Bé phải chạy thật để kiểm. Dự đoán sai cũng là điều học được.)

**Bài 4. Tìm lỗi**
**Đề:** Một bé đổi dòng `LbMission.beginDigitalTwin("msNumberGrid")` thành `LbMission.beginDigitalTwin("abc")` cho "đẹp". Sai ở đâu? Sửa thế nào?

**Đáp án:** Bài này **không được đổi tên nhiệm vụ** `msNumberGrid` (slide ghi rõ "don't change this mission name in this lesson"). Sửa lại tên cũ. (Điều gì xảy ra nếu đổi thì slide không nói, nên không đoán.)

**Bài 5. Tìm lỗi**
**Đề:** Bé chạy xong ô mã ở PNote, thấy hai dòng "Virtual Leanbot ready..." nhưng robot ảo không động đậy. Có ba chỗ có thể sai. Nêu ít nhất hai chỗ.

**Đáp án:** Bất kỳ hai trong ba: (1) chưa **bấm link** trong kết quả để mở Bản Sao Số; (2) ở trang Bản Sao Số chưa bấm nút **Start**; (3) đang nhìn nhầm một **tab Bản Sao Số cũ** của lần chạy trước (nhớ đóng tab sau mỗi lần). Slide cho thấy chỉ sau khi bấm Start, PNote mới in "Countdown 3 ... Go ... Done".

**Bài 6. Điền số**
**Đề:** a) Muốn robot lùi về đúng chỗ xuất phát sau khi tiến 35 cm, khối lùi điền bao nhiêu cm? b) 35 cm bằng bao nhiêu mm (số trong `waitDistanceMm(35 * ?)`)? c) Khoảng tốc độ cho phép là −2000 … 2000 bước/giây. Trong 3 số 1500, −1000, 2500, số nào ra ngoài khoảng?

**Đáp án:** a) **−35** (số âm là lùi, giống chương trình mẫu). b) **10**: 35 cm = 350 mm, nên nhân 10. c) **2500**, vì lớn hơn 2000.

**Bài 7. Dịch nhãn**
**Đề:** a) Dịch sang tiếng Việt: `Gripper: Close`, `Motion: Stop`, `Motion: Keep running for [35] cm`. b) Dịch sang tiếng Anh: "Chờ 1 giây", "Nhiệm vụ: Kết thúc", "Tay gắp: Mở".

**Đáp án:** a) Tay gắp: Đóng; Di chuyển: Dừng; Di chuyển: Chạy đoạn đường 35 cm. b) Wait for 1 seconds; Mission: End; Gripper: Open.

**Bài 8. Sắp thứ tự thao tác**
**Đề:** Sắp 7 việc theo thứ tự đúng khi chạy mã mẫu: (A) Bấm Start ở trang Bản Sao Số (B) Bấm Load Demo rồi OK (C) Bấm "Restart the kernal and run all cells" (D) Bấm Open PNote rồi Allow (E) Dán mã vào ô của notebook "Python 3 (ipykernel)" (F) Bấm link trong kết quả của PNote (G) Mở trình soạn khối `lbeditor-python-simulation`.

**Đáp án:** G → B → D → E → C → F → A. (Sau cùng đóng tab Bản Sao Số.)

**Bài 9. So sánh hai lần chạy**
**Đề:** Bé chạy chương trình y hệt hai lần. Lần 1 mất 17.4, lần 2 mất 19.4 (trong trang Mission histories). Hai lần có giống nhau không? Việc này có ý nghĩa gì? Bé nên làm gì tiếp?

**Đáp án:** **Khác nhau** (17.4 và 19.4). Theo slide, khác nhau là **manh mối**: có thể có lỗi nhỏ trong mã hoặc mô phỏng đã thay đổi. Bé nên chạy thêm vài lần, xem lại bằng nút Replay, rồi mới nạp cho robot thật. (Đơn vị trong bảng không ghi trên slide.)

**Bài 10. Làm trên máy** (khó)
**Đề:** Trong trình soạn khối `lbeditor-python-simulation`, ghép khối sao cho khung mã Python bên phải hiện đúng đoạn sau (giữ nguyên tên nhiệm vụ). Chỉ cần ghép phần ở giữa hai khối "Nhiệm vụ: Bắt đầu" và "Nhiệm vụ: Kết thúc".
```python
LbMotion.runLR(1000, 1000)
LbMotion.waitDistanceMm(20 * 10)
LbMotion.stopAndWait()
LbDelay(2 * 1000)
LbGripper.close()
```

**Đáp án:** Năm khối, theo thứ tự: Chạy với vận tốc Trái **1000** Phải **1000** bước/giây → Chạy đoạn đường **20** cm → Dừng → Chờ **2** giây → Tay gắp: Đóng. Tự chấm: mã sinh ra phải giống chữ ở đề. (Dòng ghi chú `###` có thể xuất hiện nếu bé dùng khối ghi chú; không ảnh hưởng.)

## Câu hỏi kiểm tra của khóa gốc (dịch)
Khóa gốc có **1 trang "Check Your Understanding"** ở cuối chương Growth (slide 05). Trang này **trống** trong ảnh slide: câu hỏi nằm trong phần tương tác H5P, **chưa lấy được**. File phân tích chung của khóa cũng không liệt kê câu nào cho bài này.

Câu hỏi duy nhất trong slide là câu mở bài (Engage, slide 07), không phải câu kiểm tra, không ghi đáp án:

*Question: What Should We Do FIRST?* — Nên làm gì ĐẦU TIÊN?
- *Option A: Just turn the robot on and hope for the best! Let it run and see what happens!* — Cứ bật robot lên và cầu may! Để nó chạy rồi xem sao!
- *Option B: Test the robot in a safe pretend world first — before it moves for real!* — Thử robot trong một thế giới giả an toàn trước, trước khi nó chạy thật!
- *Option C: Don't use the robot at all. Leave it on the shelf and do nothing!* — Không dùng robot. Để trên kệ và không làm gì!

Đáp án theo mạch bài: **B** (slide không đánh dấu).

Ba câu hỏi chính của bài (Engage, slide 02), dùng ôn miệng; **đáp án dưới đây là tóm lược từ nội dung bài, không phải đáp án chính thức của khóa gốc**:
1. *Why should we test the robot before running it in real world?* — Vì sao phải thử robot trước khi chạy thật? An toàn, không hỏng, học trước khi làm.
2. *What can you do in Digital Twin?* — Con làm được gì trong Bản Sao Số? Chạy thử, quan sát, dự đoán, so sánh, thử ý mới.
3. *What is the difference between Virtual Leanbot Digital Twin and real robot?* — Khác nhau chỗ nào giữa Leanbot ảo và robot thật? Bản Sao Số để **nghĩ**, robot thật để **làm**.

## Bé hay vướng ở đâu
| Vướng | Dấu hiệu | Thầy làm gì |
|---|---|---|
| Lạc giữa ba tab | Bé bấm Start ở tab sai, hoặc không biết tab nào là PNote | Dán nhãn giấy: "1 Soạn khối, 2 PNote, 3 Bản Sao Số". Cho đọc tên tab trước khi bấm |
| Bấm Cancel thay vì OK | Khối mẫu lẫn với khối cũ, nhiều khối dư | Tải lại trang, làm lại từ nút Load Demo, nhắc "OK là thay, Cancel là gộp" |
| Bấm Block ở hộp xin quyền | Dán vào PNote không ra mã | Bấm biểu tượng "Share clipboard?" trên thanh địa chỉ, chọn Allow, bấm Open PNote lại |
| Không đăng nhập được PNote | Thông báo lỗi, quay mãi | Có thể máy chủ đầy (tối đa 100 người). Chờ một lúc rồi thử lại; đăng xuất ở máy khác; thầy đã tạo tài khoản trước |
| Quên đóng tab Bản Sao Số cũ | Xem robot của lần chạy trước, tưởng sai | Nhắc: xong mỗi lần chạy thì **đóng tab** |
| Không bấm Start | Robot đứng yên, PNote chưa in "Countdown" | Chỉ nút Start ở góc phải thanh xanh |
| Mở link sai tên miền | Slide có hai địa chỉ: `digitaltwin.pythaverse.space` (in ra trong kết quả) và `dt-qa.pythaverse.space` (chỉ nằm trong dòng ghi chú của mã) | Luôn **bấm link trong kết quả của PNote**, đừng gõ tay |
| Gõ tay URL dài | Sai chính tả | Cho bé bấm link hoặc thầy dán sẵn địa chỉ lên bảng |
| Touchpad khó kéo chuột phải, cuộn | Bé không xoay được camera | Dùng chuột rời; touchpad thì dùng hai ngón để cuộn |
| Nhầm "kernel", "cell", "notebook" | Hỏi "nút nào chạy" | Dạy là "nút ▶▶ chạy cả trang" |
| Nhầm số âm | Tưởng −1000 là chậm, −35 là ngắn | Số âm = lùi. Cho bé tự chạy với −1000 và nhìn robot |
| Đổi tên `msNumberGrid` | Robot không chạy | Nhắc: bài này **không đổi** tên nhiệm vụ |
| Sửa nhiều số cùng lúc | Không biết số nào gây ra điều gì | Mỗi lần chỉ đổi **một** số |
| Sợ "robot buồn / đâm tường" ở slide mở bài | Bé nói "tại ai đó" | Giữ giọng nhẹ: "Lần sau mình thử trước là được rồi" |

## Ghi chú về bản gốc
Lấy từ file bóc tách của bài, cộng với đối chiếu của giáo án này.

- **Slide thiếu mục (1) của "Step 3: Run Virtual Leanbot Digital Twin"**. Slide 11 bắt đầu từ (2). Có thể mục (1) là bấm link ở slide 10.
- **Hai địa chỉ Bản Sao Số:** `https://digitaltwin.pythaverse.space/experience` (in trong kết quả thật) và `https://dt-qa.pythaverse.space/experience` (chú thích trong mã và trong khối; có vẻ là bản QA cũ). Giáo án này dùng `digitaltwin.pythaverse.space`.
- **Tên nút:** slide gọi nút mở thư mục là "Load Demo", nhưng nhãn trên nút trong ảnh không đọc được. Chữ "kernal" (đúng là kernel) là lỗi chính tả của slide.
- **Trang tên "Python Blockly Editor"** nhưng URL là `lbeditor-python-simulation`.
- **Mã mẫu có hai biến thể** (có hoặc không có `runLRrpm(30, -30)` + `waitRotationDeg(90)`), ngày tạo khác nhau (2025-02-20 và 2025-04-24/29).
- **Đơn vị cột thời gian** trong Mission histories (19.4, 17.4...) không ghi trên slide.
- **Khối "Chạy với vận tốc ... steps/sec"** trên slide không khớp hoàn toàn với `LbMotion.run` trong json (ghi rpm). Cần đối chiếu với `bduino-rendered` nếu cần chính xác tên khối. Giáo trình tổng §6 cho cả hai đơn vị, nên **không có mâu thuẫn số liệu**.
- **Giáo trình tổng §3 nói bài 10 "Bản Sao Số; nghĩ trước, làm sau", 40 slide:** khớp. §5.3 ghi Digital Twin "mở từ bài học trên PLearn": thực tế bé mở từ **link trong kết quả của PNote**, không phải trực tiếp từ Plearn.
- **Bản vá Việt hóa đã phủ trang này** (kiểm ngày 21/10/2026). Cả hai trình dùng chung file ngôn ngữ nên một bản vá đủ cho cả hai.
- **Trang "Check Your Understanding" trống** (H5P), xem mục câu hỏi.
- **Giới hạn kiểm chứng:** các bước thao tác chưa được chạy thử thật (giáo trình tổng §11, mục 4).
