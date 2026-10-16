"""Rewrites the W9 "Chi tiết từng màn" table in docs/product/curriculum.md §6.4 from w09gen.py.

Run from anywhere: `python3 tools/content-gen/w09table.py` (stdlib only).
"""
import os
import re
import sys

sys.dont_write_bytecode = True  # no __pycache__ next to the scripts

sys.path.insert(0, os.path.dirname(__file__))
import w09gen  # noqa: E402  (builds LEVELS / DETAILS on import, writes nothing)

FIELDS = ['id', 'stage', 'mode', 'size', 'start', 'target', 'sol', 'initial', 'blocks', 'par',
          't1', 'options', 'notes', 'angles']
D = [dict(zip(FIELDS, d)) for d in w09gen.DETAILS]
CURRICULUM = os.path.join(w09gen.REPO, 'docs', 'product', 'curriculum.md')
def vn(src):
    if src is None: return '—'
    s=re.sub(r'REP(\d+)\[', r'lặp \1 {', src).replace(']','}')
    s=re.sub(r'\bF(\d+)', r'tiến \1', s); s=re.sub(r'\bR(\d+)', r'phải \1', s); s=re.sub(r'\bL(\d+)', r'trái \1', s)
    s=re.sub(r'\bU\b','nhấc', s); s=re.sub(r'\bD\b','hạ', s); s=re.sub(r'\bP\b','cánh', s)
    s=re.sub(r' (?=(tiến|phải|trái|nhấc|hạ|lặp|cánh))', ', ', s).replace('{, ','{')
    return '`'+s+'`'
key=lambda d: (d['id']=='w09-boss', d['id'])
rows=['| ID | Giấy · xuất phát | Hình mẫu (`target`) | Lời giải · khối | `par` | Bẫy T1 (vẽ nét lạ) | Ghi chú khi soạn |','|---|---|---|---|---|---|---|']
for d in sorted(D,key=key):
    sz=d['size']; st=d['start']
    paper=f"{sz['w']} × {sz['h']} · ({st[0]}, {st[1]}), {st[2]}°"
    if d['target'] is None: tgt='— (predict)'
    else:
        p=d['target'][0]['path']
        tgt=('`'+p+'`') if len(p)<=40 else ('cách tự nhiên trải ra' if d['id']=='w09-l18' else 'lời giải trải ra')
    sol=vn(d['sol'])
    if d['initial']: sol+='; cho sẵn '+vn(d['initial'])
    if d['options']: sol+='; thẻ: '+' / '.join(f"{l} {vn(p)}" for p,l in d['options'])
    blocks=f"{d['blocks']} khối"
    if d['id']=='w09-l16': blocks+=' + phép `cánh` 6 khối (`dạy phép` + `lặp 2 {tiến 2, phải 60, tiến 2, phải 120}`)'
    t1=', '.join(vn(t) for t in (d['t1'] or [])) or '—'
    par=str(d['par']) if d['par'] else '—'
    rows.append(f"| `{d['id']}` | {paper} | {tgt} | {sol} · {blocks} | {par} | {t1} | {d['notes'] or ''} |")
table='\n'.join(rows)+'\n'
p=CURRICULUM; s=open(p).read()
i=s.index('| ID | Giấy · xuất phát |'); j=s.index('### 6.5 Thế giới 10')
s=s[:i]+table+'\n'+s[j:]
open(p,'w').write(s)
print('table rewritten in', CURRICULUM)
