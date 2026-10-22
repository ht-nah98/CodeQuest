"""Check a Leanbot against lesson 0 from the command line (coach tool, no browser needed).

    python3 tools/leanbot-check/check.py              # flash leanbot-check.ino, then check
    python3 tools/leanbot-check/check.py --no-flash   # robot already runs leanbot-check.ino
    python3 tools/leanbot-check/check.py --move       # also drive the wheels (robot on the FLOOR)
    python3 tools/leanbot-check/check.py --hands      # also wait for touch, hand and line tests

Each item of lesson 0 ("Xong Bài 0 khi đủ chín việc") is checked from the robot's own serial
line where it can be; what only a person can see (the colour of the lights, the eight notes,
where the robot stopped) is asked of the coach at the end. Standard library only.
"""

from __future__ import annotations

import argparse
import base64
import glob
import json
import os
import re
import subprocess
import sys
import termios
import time
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKETCH = HERE / "leanbot-check.ino"
COMPILE_URL = "https://cs.leanbot.space/v3/compile"
# TB 0000 - IR 00 0000 00 - 23 cm - GR 0 0
STATUS = re.compile(
    r"TB (?P<tb>[01]{4}) - IR (?P<irl>[01]{2}) (?P<line>[01]{4}) (?P<irr>[01]{2}) - "
    r"(?P<cm>-?\d+) cm - GR (?P<grl>-?\d+) (?P<grr>-?\d+)"
)


@dataclass
class Status:
    touch: str
    side_left: str
    line: str
    side_right: str
    cm: int
    grip_left: int
    grip_right: int

    @classmethod
    def parse(cls, text: str) -> "Status | None":
        m = STATUS.search(text)
        if not m:
            return None
        return cls(m["tb"], m["irl"], m["line"], m["irr"], int(m["cm"]), int(m["grl"]), int(m["grr"]))


@dataclass
class Report:
    rows: list[tuple[str, str, str]] = field(default_factory=list)

    def add(self, item: str, verdict: str, detail: str) -> None:
        self.rows.append((item, verdict, detail))
        print(f"  [{verdict:^6}] {item}: {detail}", flush=True)


# --- finding the robot, compiling, flashing -------------------------------------------------


def find_port() -> str | None:
    """The CH340 the Leanbot's Arduino port shows up as (USB id 1a86:7523)."""
    by_id = sorted(glob.glob("/dev/serial/by-id/*1a86*"))
    if by_id:
        return os.path.realpath(by_id[0])
    ports = sorted(glob.glob("/dev/ttyUSB*"))
    return ports[0] if ports else None


def compile_sketch(source: str) -> bytes:
    """Compile on the maker's server; the Leanbot library is not installed on this machine."""
    payload = {
        "fqbn": "arduino:avr:uno",
        "files": [{"name": "LeanbotSketch/LeanbotSketch.ino", "content": source}],
        "flags": {"verbose": False, "preferLocal": False},
        "libs": [],
    }
    req = urllib.request.Request(
        COMPILE_URL, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        res = json.load(r)
    if not (res.get("hex") or "").strip():
        raise RuntimeError("compile failed:\n" + str(res.get("log", ""))[-2000:])
    return base64.b64decode(res["hex"])


def find_avrdude() -> tuple[str, str]:
    home = Path.home() / ".arduino15/packages/arduino/tools/avrdude"
    exe = sorted(home.glob("*/bin/avrdude"))
    conf = sorted(home.glob("*/etc/avrdude.conf"))
    if not exe or not conf:
        raise RuntimeError("avrdude not found: run `arduino-cli core install arduino:avr`")
    return str(exe[-1]), str(conf[-1])


def can_open(port: str) -> bool:
    return os.access(port, os.R_OK | os.W_OK)


def flash(port: str, hex_bytes: bytes) -> None:
    avrdude, conf = find_avrdude()
    hex_path = Path("/tmp/leanbot-check.hex")
    hex_path.write_bytes(hex_bytes)
    cmd = [avrdude, "-C", conf, "-p", "atmega328p", "-c", "arduino", "-P", port, "-b", "115200", "-D",
           "-U", f"flash:w:{hex_path}:i"]
    if not can_open(port):
        # in the dialout group but not in this login session yet
        cmd = ["sg", "dialout", "-c", " ".join(cmd)]
    out = subprocess.run(cmd, capture_output=True, text=True)
    if out.returncode != 0:
        raise RuntimeError("flash failed:\n" + out.stderr[-1500:])


# --- talking to the robot -------------------------------------------------------------------


class Robot:
    def __init__(self, port: str) -> None:
        self.fd = os.open(port, os.O_RDWR | os.O_NOCTTY)
        attrs = termios.tcgetattr(self.fd)
        attrs[4] = attrs[5] = termios.B115200
        attrs[2] = termios.CS8 | termios.CREAD | termios.CLOCAL
        attrs[0] = attrs[1] = attrs[3] = 0
        attrs[6][termios.VMIN] = 0
        attrs[6][termios.VTIME] = 1
        termios.tcsetattr(self.fd, termios.TCSANOW, attrs)
        self.buffer = ""

    def lines(self, seconds: float):
        """Every complete line the robot sends during the next `seconds`."""
        end = time.time() + seconds
        while time.time() < end:
            self.buffer += os.read(self.fd, 512).decode("utf-8", "replace")
            while "\n" in self.buffer:
                line, self.buffer = self.buffer.split("\n", 1)
                yield line.strip()

    def statuses(self, seconds: float) -> list[Status]:
        return [s for s in map(Status.parse, self.lines(seconds)) if s]

    def send(self, command: str) -> None:
        os.write(self.fd, (command + "\n").encode())

    def run(self, command: str, timeout: float) -> tuple[bool, list[Status]]:
        """Send a command, collect status lines until "DONE <command>" or the timeout."""
        self.send(command)
        seen: list[Status] = []
        for line in self.lines(timeout):
            if line == f"DONE {command}":
                return True, seen
            s = Status.parse(line)
            if s:
                seen.append(s)
        return False, seen

    def wait_for(self, what, seconds: float) -> Status | None:
        for line in self.lines(seconds):
            s = Status.parse(line)
            if s and what(s):
                return s
        return None


def reopen(port: str) -> "Robot":
    if can_open(port):
        return Robot(port)
    # re-run this script inside the dialout group, once
    if os.environ.get("LEANBOT_CHECK_SG") != "1":
        os.environ["LEANBOT_CHECK_SG"] = "1"
        args = " ".join(["python3", str(Path(__file__).resolve()), "--no-flash", *sys.argv[1:]])
        os.execvp("sg", ["sg", "dialout", "-c", args])
    raise PermissionError(f"cannot open {port}: add yourself to the dialout group and log in again")


# --- the lesson 0 checklist -----------------------------------------------------------------


def check(robot: Robot, report: Report, move: bool, hands: bool) -> None:
    # 3 + 5: the computer sees the robot, and the status line reads
    sample = robot.statuses(3)
    if not sample:
        report.add("Đọc dòng số liệu", "ĐỎ", "không nhận được dòng TB … GR … nào trong 3 giây")
        return
    s = sample[-1]
    report.add("Đọc dòng số liệu", "XANH", f"{len(sample)} dòng / 3 giây, ví dụ TB {s.touch} IR {s.side_left} {s.line} {s.side_right} {s.cm} cm GR {s.grip_left} {s.grip_right}")

    # touch buttons at rest
    stuck = sorted({i for x in sample for i, c in enumerate(x.touch) if c == "1"})
    names = ["TB1A", "TB1B", "TB2A", "TB2B"]
    if stuck:
        report.add("Vùng chạm lúc không ai chạm", "VÀNG", "đang báo 1: " + ", ".join(names[i] for i in stuck))
    else:
        report.add("Vùng chạm lúc không ai chạm", "XANH", "cả bốn vùng báo 0")

    # ultrasonic eye
    cms = [x.cm for x in sample]
    if all(c <= 0 for c in cms):
        report.add("Mắt siêu âm", "ĐỎ", "luôn báo 0 cm: dây mắt siêu âm lỏng hoặc cắm nhầm cổng")
    else:
        spread = max(cms) - min(cms)
        verdict = "XANH" if spread <= 5 else "VÀNG"
        report.add("Mắt siêu âm", verdict, f"đo được {min(cms)}–{max(cms)} cm khi robot đứng yên")

    # 7: gripper closes and opens
    ok, seen = robot.run("Gripper", 6)
    before = (s.grip_left, s.grip_right)
    closed = seen[-1] if seen else None
    after = robot.statuses(0.6)
    opened = after[-1] if after else None
    if not ok:
        report.add("Tay gắp", "ĐỎ", "lệnh Gripper không chạy xong trong 6 giây")
    elif closed and opened and (closed.grip_left, closed.grip_right) != (opened.grip_left, opened.grip_right):
        gap = abs(closed.grip_left - closed.grip_right)
        verdict = "XANH" if gap <= 5 else "VÀNG"
        report.add("Tay gắp", verdict, f"đóng: {closed.grip_left}/{closed.grip_right}°, mở: {opened.grip_left}/{opened.grip_right}° (lúc đầu {before[0]}/{before[1]}°)")
    else:
        report.add("Tay gắp", "VÀNG", "chạy xong nhưng góc đọc về không đổi: nhìn xem càng có cử động không")

    # 8: lights and buzzer (a person has to look and listen)
    for cmd, item in (("RGBLeds", "Đèn màu"), ("Buzzer", "Còi")):
        ok, _ = robot.run(cmd, 6)
        report.add(item, "XEM" if ok else "ĐỎ", "đã chạy xong: thầy xác nhận bằng mắt/tai" if ok else f"lệnh {cmd} không chạy xong")

    # 6: wheels, only when the robot is on the floor
    if move:
        ok, _ = robot.run("Motion", 15)
        report.add("Bánh xe", "XEM" if ok else "ĐỎ", "tiến 10 cm, lùi 10 cm, quay phải 90°, quay trái 90°: phải về đúng chỗ cũ" if ok else "lệnh Motion không chạy xong")
    else:
        report.add("Bánh xe", "BỎ QUA", "chạy lại với --move khi robot đã đặt dưới sàn (rút cáp ra cũng được nếu nạp xong)")

    if not hands:
        report.add("Vùng chạm, mắt hồng ngoại, siêu âm theo tay", "BỎ QUA", "chạy lại với --hands để kiểm có người thao tác")
        return

    # 9 + touch: each test waits for the change on the robot's own line
    for i, name in enumerate(names):
        print(f"\n  >>> Chạm và giữ vùng {name} (mép mạch có chữ {name}) (15 giây)...", flush=True)
        hit = robot.wait_for(lambda x, i=i: x.touch[i] == "1", 15)
        report.add(f"Vùng chạm {name}", "XANH" if hit else "ĐỎ", "nhận được" if hit else "không thấy số đổi thành 1")

    print("\n  >>> Đưa bàn tay vào trước mắt siêu âm, cách chừng 5–10 cm (15 giây)...", flush=True)
    near = robot.wait_for(lambda x: 0 < x.cm <= 12, 15)
    report.add("Mắt siêu âm theo tay", "XANH" if near else "ĐỎ", f"đo được {near.cm} cm" if near else "không thấy số nhỏ đi dưới 12 cm")

    print("\n  >>> Đặt robot lên vạch ĐEN (hoặc che bốn mắt dưới bụng bằng giấy đen) (20 giây)...", flush=True)
    black = robot.wait_for(lambda x: "1" in x.line, 20)
    report.add("Mắt dò vạch", "XANH" if black else "ĐỎ", f"bốn mắt đọc {black.line}" if black else "bốn mắt dưới bụng không đổi")

    print("\n  >>> Đưa tay sát hai bên thân robot (20 giây)...", flush=True)
    side = robot.wait_for(lambda x: "1" in x.side_left + x.side_right, 20)
    report.add("Mắt hồng ngoại hai bên", "XANH" if side else "ĐỎ", f"trái {side.side_left}, phải {side.side_right}" if side else "không mắt nào đổi")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--no-flash", action="store_true", help="robot already runs leanbot-check.ino")
    ap.add_argument("--move", action="store_true", help="drive the wheels: robot must be on the floor")
    ap.add_argument("--hands", action="store_true", help="wait for a person to touch, wave, cover")
    args = ap.parse_args()

    report = Report()
    print("Kiểm Leanbot theo Bài 0\n", flush=True)
    port = find_port()
    if not port:
        report.add("Máy thấy robot", "ĐỎ", "không có cổng CH340: cắm cáp vào cổng TRÊN, bật công tắc, thử cáp khác")
        return 1
    report.add("Máy thấy robot", "XANH", f"cổng {port} (chip CH340)")

    if not args.no_flash:
        try:
            flash(port, compile_sketch(SKETCH.read_text(encoding="utf-8")))
            report.add("Nạp chương trình", "XANH", "biên dịch trên máy chủ Leanbot và nạp xong")
        except Exception as e:  # noqa: BLE001 - every failure is reported, not raised
            report.add("Nạp chương trình", "ĐỎ", str(e).splitlines()[0])
            return 1
        time.sleep(2)  # the board resets after flashing

    robot = reopen(port)
    check(robot, report, args.move, args.hands)

    print("\nTóm tắt:")
    for item, verdict, _ in report.rows:
        print(f"  {verdict:<7} {item}")
    print("\nThầy tự xác nhận: 7 đèn đều sáng đủ đỏ/xanh lá/xanh dương, còi kêu đủ 8 nốt,"
          "\nhai cổng USB (nạp ở cổng TRÊN), đèn sạc. Dòng VÀNG/ĐỎ thì xem bảng ở Bài 0.")
    return 0 if all(v not in ("ĐỎ",) for _, v, _ in report.rows) else 1


if __name__ == "__main__":
    sys.exit(main())
