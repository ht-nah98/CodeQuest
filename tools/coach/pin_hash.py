"""Prints the PBKDF2 hash (apps/web/src/data/pin.ts format) of a 4-digit coach PIN, to paste
into the deploy's VITE_COACH_PIN_HASH setting. Usage: npm run coach-pin-hash -- 1234"""
import base64
import hashlib
import os
import re
import sys

pin = sys.argv[1] if len(sys.argv) > 1 else ""
if not re.fullmatch(r"\d{4}", pin):
    sys.exit("Usage: npm run coach-pin-hash -- <4-digit PIN>")
salt = os.urandom(16)
digest = hashlib.pbkdf2_hmac("sha256", pin.encode(), salt, 100_000, 32)
print("$".join(["pbkdf2-sha256", "100000", base64.b64encode(salt).decode(), base64.b64encode(digest).decode()]))
