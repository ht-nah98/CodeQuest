# tools/leanbot-check — kiểm một Leanbot từ dòng lệnh

Cho **thầy**, không cho bé: kiểm nhanh một robot theo các mục của Bài 0 mà không cần mở trình
duyệt. Bé thì kiểm bằng Leanbot IDE theo Bài 0 trong app.

```bash
python3 tools/leanbot-check/check.py            # nạp leanbot-check.ino rồi kiểm
python3 tools/leanbot-check/check.py --move     # thêm bánh xe: robot phải ở dưới SÀN
python3 tools/leanbot-check/check.py --hands    # thêm phần cần người: chạm, đưa tay, che mắt
```

- Biên dịch trên máy chủ của hãng (`cs.leanbot.space`), nạp bằng `avrdude` của nhân
  `arduino:avr` (xem `docs/leanbot/thiet-bi/cai-dat.md`). Chỉ dùng thư viện chuẩn của Python.
- `leanbot-check.ino` in đúng dòng số liệu của chương trình kiểm tra Bài 0
  (`TB 0000 - IR 11 1000 11 - 43 cm - GR 0 0`) và nhận `Motion`, `Gripper`, `RGBLeds`, `Buzzer`.
- Máy Linux: cổng `/dev/ttyUSB0` thuộc nhóm `dialout`. Cách cấp quyền một lần cho mọi Leanbot:
  quy tắc udev trong `docs/leanbot/thiet-bi/cai-dat.md`.

Điều đã học khi kiểm robot thật ngày 22/10/2026:
- TB1A, TB1B, TB2A, TB2B là **vùng chạm cảm ứng** ở mép mạch đỏ, không phải nút bấm.
- Robot bị nhấc lên thì 4 mắt dò vạch báo `1111`; phía trước trống thì siêu âm báo `1000 cm`.
- Chip CH340 không có số serial nên Chrome không nhớ quyền cổng: mỗi lần mở Chrome chọn lại.
