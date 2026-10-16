"""Generates World 9 "Tháp Họa Sĩ" (turtle) content from compact programs (P4-12, P4-13).

Run from the repo root: `python3 tools/content-gen/w09gen.py` (stdlib only), then prettier and
content:check; `python3 tools/content-gen/w09table.py` rewrites the "Chi tiết từng màn" table of
docs/product/curriculum.md §6.4. Edit levels here, never the generated JSON by hand.

Program DSL: tokens separated by spaces: F<n> forward, R<d>/L<d> turn, U/D pen, REP<n>[ ... ].
The target picture of a level is its solution unrolled (pen moves included), so the target
and the solution can never disagree; the paper and start are fitted around the drawing.
"""
import json, math, os, re, sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ROOT = os.path.join(REPO, 'content', 'worlds', 'w09-thap-hoa-si') + os.sep
WORLD = 'w09-thap-hoa-si'

# ---- DSL ---------------------------------------------------------------------------------------
def tokenize(src):
    return re.findall(r'REP\d+\[|\]|[FRL]\d+|[UDP]', src)

def parse(src):
    toks = tokenize(src); pos = 0
    def seq():
        nonlocal pos
        out = []
        while pos < len(toks) and toks[pos] != ']':
            t = toks[pos]; pos += 1
            if t.startswith('REP'):
                n = int(t[3:-1]); body = seq(); assert toks[pos] == ']'; pos += 1
                out.append(('REP', n, body))
            else:
                out.append((t[0], int(t[1:]) if len(t) > 1 else None))
        return out
    tree = seq(); assert pos == len(toks), src
    return tree

# `P` calls the level's one spell (W9 l16 "cánh"); its body, in the same DSL.
SPELL = {'id': 'canh', 'name': 'cánh', 'body': 'REP2[F2 R60 F2 R120]'}

def unroll(tree):
    out = []
    for item in tree:
        if item[0] == 'P':
            out += unroll(parse(SPELL['body']))
        elif item[0] == 'REP':
            for _ in range(item[1]): out += unroll(item[2])
        else: out.append(item)
    return out

def path_string(flat):
    toks = []
    for kind, n in flat:
        if kind == 'F' and toks and re.fullmatch(r'F\d+', toks[-1]):
            toks[-1] = 'F' + str(int(toks[-1][1:]) + n)
        else:
            toks.append(kind + ('' if n is None else str(n)))
    # Merge "L60 R30" style pairs is not needed: the schema allows any 30-multiple turn.
    return ' '.join(toks)

def trace(flat, heading_deg, pen=True):
    """Float points visited (pen up too) and drawn segments, start at (0, 0)."""
    x = y = 0.0; h = heading_deg; pts = [(0.0, 0.0)]; segs = 0
    for kind, n in flat:
        if kind == 'F':
            for _ in range(n):
                x += math.cos(math.radians(h)); y += math.sin(math.radians(h)); pts.append((x, y))
                segs += 1 if pen else 0
        elif kind == 'L': h += n
        elif kind == 'R': h -= n
        elif kind == 'U': pen = False
        elif kind == 'D': pen = True
    return pts, segs

def blocks_of(tree, ids):
    def mk(item):
        k = item[0]
        def nid(p):
            ids[p] = ids.get(p, 0) + 1; return f'{p}{ids[p]}'
        if k == 'F': return {'type': 'turtle_forward', 'id': nid('fwd'), 'fields': {'N': item[1]}}
        if k == 'R': return {'type': 'turtle_turn_right', 'id': nid('right'), 'fields': {'DEG': str(item[1])}}
        if k == 'L': return {'type': 'turtle_turn_left', 'id': nid('left'), 'fields': {'DEG': str(item[1])}}
        if k == 'U': return {'type': 'turtle_pen_up', 'id': nid('up')}
        if k == 'D': return {'type': 'turtle_pen_down', 'id': nid('down')}
        if k == 'P': return {'type': 'cq_proc_call', 'id': nid('call'), 'fields': {'PROC': SPELL['id']}}
        loop = {'type': 'cq_repeat', 'id': nid('loop'), 'fields': {'TIMES': item[1]}}
        body = chain([mk(b) for b in item[2]])
        if body: loop['inputs'] = {'DO': {'block': body}}
        return loop
    return [mk(i) for i in tree]

def chain(blocks):
    nxt = None
    for b in reversed(blocks):
        b = dict(b)
        if nxt is not None: b['next'] = {'block': nxt}
        nxt = b
    return nxt

def pieces_workspace(pieces):
    """Parsons: each piece (DSL) is one loose stack; ids are counted across the pieces in order,
    so they match the solution's when the pieces list its blocks in program order."""
    ids = {}
    tops = [{'type': 'cq_start', 'id': 'start', 'x': 40, 'y': 40, 'deletable': False}]
    for i, src in enumerate(pieces):
        stack = chain(blocks_of(parse(src), ids))
        tops.append({**stack, 'x': 300 if i % 2 else 60, 'y': 140 + 90 * i})
    return {'blocks': {'languageVersion': 0, 'blocks': tops}}

def workspace(src, loose=False, spell=False, joined=0):
    ids = {}
    blocks = blocks_of(parse(src), ids)
    start = {'type': 'cq_start', 'id': 'start', 'x': 40, 'y': 40, 'deletable': False}
    if spell:
        body = chain(blocks_of(parse(SPELL['body']), ids))
        define = {'type': 'cq_proc_def', 'id': 'def1', 'x': 40, 'y': 320,
                  'fields': {'PROC': SPELL['id']}, 'inputs': {'BODY': {'block': body}}}
        c = chain(blocks)
        if c: start['next'] = {'block': c}
        return {'blocks': {'languageVersion': 0, 'blocks': [start, define]}}
    if loose:
        # Parsons: the first `joined` blocks already hang under "khi bắt đầu", the rest are loose.
        if joined:
            start['next'] = {'block': chain(blocks[:joined])}
        tops = [start]
        for i, b in enumerate(blocks[joined:]):
            tops.append({**b, 'x': 300 if i % 2 else 60, 'y': 140 + 70 * i})
        return {'blocks': {'languageVersion': 0, 'blocks': tops}}
    c = chain(blocks)
    if c: start['next'] = {'block': c}
    return {'blocks': {'languageVersion': 0, 'blocks': [start]}}

def count_blocks(tree):
    return sum(1 + (count_blocks(i[2]) if i[0] == 'REP' else 0) for i in tree)

# ---- Paper fitting -----------------------------------------------------------------------------
def fit(programs, heading, margin=1):
    pts = []
    for p in programs:
        pts += trace(unroll(parse(p)), heading)[0]
    minx = min(p[0] for p in pts); maxx = max(p[0] for p in pts)
    miny = min(p[1] for p in pts); maxy = max(p[1] for p in pts)
    eps = 1e-9
    sx = math.ceil(margin - minx - eps); sy = math.ceil(margin - miny - eps)
    w = math.ceil(maxx + sx + margin - eps); h = math.ceil(maxy + sy + margin - eps)
    assert w <= 12 and h <= 12, (programs, w, h)
    return {'w': w, 'h': h}, (sx, sy)

def angles_of(*programs):
    found = set()
    for p in programs:
        for m in re.finditer(r'[RL](\d+)', p): found.add(int(m.group(1)))
    return sorted(found)

# ---- Levels ------------------------------------------------------------------------------------
def tb(*entries):
    out = []
    for e in entries:
        if e == 'repeat': out.append('cq_repeat')
        elif e == 'up': out.append('turtle_pen_up')
        elif e == 'down': out.append('turtle_pen_down')
        elif e == 'fwd': out.append('turtle_forward')
        else:
            k, n = e[0], int(e[1:])
            t = {'F': 'turtle_forward', 'R': 'turtle_turn_right', 'L': 'turtle_turn_left'}[k]
            out.append({'type': t, 'fields': {'N': n} if k == 'F' else {'DEG': str(n)}})
    return out

def hint(id, say, trigger='enter', point=None, reason=None):
    # `trigger` is a trigger name, or a whole condition (e.g. after 2 failed runs).
    when = dict(trigger) if isinstance(trigger, dict) else {'trigger': trigger}
    if reason: when['lastReason'] = reason
    h = {'id': id, 'when': when, 'say': say}
    if point: h['point'] = point
    return h

LEVELS = []
DETAILS = []   # rows for curriculum.md §6.4 "Chi tiết từng màn"

def level(id, stage, mode, title, objective, goal, misconception, mission, *, sol=None,
          initial=None, heading=0, toolbox=(), par=None, par_edits=None, depth=1, hints=(),
          thinking, options=None, max_blocks=None, grid=None, extra_fit=(), t1=None,
          angles=None, loose=False, notes='', joined=0, target=None, par_unproven=False,
          pieces=None):
    # The paper fits the solution (and every predict card); a bughunt's buggy program stops at
    # its first stray line, so it needs no room.
    programs = [target or sol] + [o[0] for o in (options or [])] + list(extra_fit)
    # One free step around the drawing: room for stray lines, and for Măng at the paper's edge.
    size, (sx, sy) = fit(programs, heading, 1)
    used = set(angles_of(*programs, *([initial] if initial else [])))
    used |= {int(e['fields']['DEG']) for e in toolbox if isinstance(e, dict) and 'DEG' in e['fields']}
    ang = angles or [a for a in [30, 60, 90, 120, 150, 180] if a in used] or [90]
    cfg = {'size': size, 'start': {'x': sx, 'y': sy, 'heading': heading}}
    if mode != 'predict':
        flat = unroll(parse(target or sol))
        cfg['target'] = [{'from': [sx, sy], 'heading': heading, 'path': path_string(flat)}]
    cfg['angles'] = ang
    cfg['grid'] = grid or ('square' if all(a in (90, 180) for a in ang) else 'tri')
    lv = {'id': id, 'worldId': WORLD, 'stage': stage, 'kind': 'turtle', 'mode': mode,
          'title': title, 'objective': objective, 'learningGoal': goal}
    if misconception: lv['misconception'] = misconception
    if mission: lv['mission'] = mission
    lv['toolbox'] = list(toolbox)
    if max_blocks: lv['maxBlocks'] = max_blocks
    if mode != 'predict': lv['maxLoopDepth'] = depth
    if par is not None: lv['par'] = par
    if par_unproven: lv['parUnproven'] = True
    if par_edits is not None: lv['parEdits'] = par_edits
    lv['config'] = cfg
    if initial: lv['initialWorkspace'] = workspace(initial)
    if mode == 'parsons':
        lv['initialWorkspace'] = (pieces_workspace(pieces) if pieces
                                  else workspace(sol, loose=True, joined=joined))
    if mode == 'predict':
        lv['initialWorkspace'] = workspace(sol)
        lv['predict'] = {'options': [{'drawProgram': workspace(p), 'label': l} for p, l in options]}
    elif sol: lv['solution'] = workspace(sol)
    lv['hints'] = list(hints)
    lv['thinkingHint'] = thinking
    LEVELS.append(lv)
    lines = trace(unroll(parse(sol)), heading)[1] if sol else 0
    DETAILS.append((id, stage, mode, size, (sx, sy, heading), cfg.get('target'), sol, initial,
                    count_blocks(parse(sol)) if sol else 0, par, t1, options, notes, ang))
    return lv

NEW = 'Khối mới! '
TIP = {
    'fwd': 'Tiến 3 bước: bút hạ thì có nét dài 3',
    'right': 'Rẽ phải 90 độ: quay tại chỗ, chưa đi',
    'left': 'Rẽ trái 90 độ: quay tại chỗ, chưa đi',
    'up': 'Nhấc bút: đi tiếp thì không có nét',
    'down': 'Hạ bút: đi tiếp thì có nét',
}
STRAY = lambda say, point=None: hint('stray', say, 'run-end', point, 'EXTRA_LINE')
MISSING = lambda say, point=None: hint('missing', say, 'run-end', point, 'MISSING_LINES')

level('w09-l01', 'guided', 'build', 'Hàng rào thẳng', 'Vẽ hàng rào giống hình mẫu nhé!',
      'Khối tiến … bước vẽ một nét thẳng dài đúng số bước.',
      'Tiến bao nhiêu cũng được, miễn qua hết hình mẫu.',
      'Cô Thỏ nhờ Măng vẽ hàng rào ở tầng 1.',
      sol='F5', toolbox=['turtle_forward'], par=1, grid='square',
      hints=[hint('new', NEW + TIP['fwd'], point='toolbox:turtle_forward'),
             hint('count', 'Hàng rào dài mấy bước? Đếm chấm nhé.', point='stage'),
             STRAY('Nét đỏ thừa ra. Hàng rào dài mấy bước?'),
             MISSING('Còn nét chưa vẽ. Hàng rào dài mấy bước?')],
      thinking='Hình mẫu dài mấy bước?', t1=['F6'],
      notes='Ô N mở 1–9; `tiến 6` vẽ nét lạ ở bước thứ 6.')

level('w09-l02', 'guided', 'parsons', 'Khung cửa', 'Ghép khối để vẽ khung cửa nhé!',
      'Rẽ phải 90 độ chỉ quay, không vẽ nét.',
      'Rẽ cũng vẽ một nét.',
      'Tầng 1 cần một khung cửa.',
      sol='F2 R90 F3 R90 F2', heading=90, toolbox=[], par=5, grid='square',
      hints=[hint('new', NEW + TIP['right'], point='block:turtle_turn_right'),
             hint('sides', 'Cửa có 3 cạnh. Cạnh nào dài nhất?', point='stage')],
      thinking='Rẽ xong thì Măng nhìn về đâu?',
      notes='Măng bắt đầu nhìn lên (90°). Hai khối `tiến 2` đổi chỗ cho nhau vẫn đúng.')

level('w09-l03', 'guided', 'build', 'Ô cửa sổ', 'Vẽ ô cửa sổ hình chữ nhật nhé!',
      'Vòng lặp vẽ lại một nửa hình chữ nhật 2 lần.',
      'Hình chữ nhật phải lặp 4 lần như hình vuông.',
      'Tầng 1 cần một ô cửa sổ.',
      sol='REP2[F3 R90 F1 R90]', toolbox=tb('F3', 'F1', 'R90', 'repeat'), par=5, grid='square',
      hints=[hint('half', 'Nửa hình chữ nhật gồm những khối nào?', point='toolbox:cq_repeat'),
             hint('twice', 'Nửa hình đó lặp mấy lần?', point='stage'),
             STRAY('Cạnh dài đi trước hay cạnh ngắn đi trước?')],
      thinking='Hình chữ nhật có mấy cạnh dài?', t1=['REP2[F1 R90 F3 R90]'],
      notes='`lặp 4` cũng đúng (vẽ lại nét cũ không sao). Đổi 3 ↔ 1 vẽ nét lạ.')

level('w09-l04', 'guided', 'predict', 'Góc rẽ đổi hình', 'Măng vẽ hình gì? Đoán xem!',
      'Góc rẽ quyết định hình: rẽ 120 độ 3 lần là tam giác.',
      'Rẽ góc nào cũng ra tam giác.', None,
      sol='REP3[F3 R120]', toolbox=[],
      options=[('REP3[F3 R120]', 'Tam giác'), ('REP3[F3 R90]', 'Hình vuông thiếu 1 cạnh'),
               ('REP3[F3 R60]', 'Nửa lục giác')],
      hints=[hint('angle', 'Mỗi lần Măng rẽ mấy độ?', point='stage'),
             hint('three', 'Đếm số lần rẽ. Mỗi cạnh dài mấy?', trigger='idle')],
      thinking='Rẽ 120 độ thì cạnh sau đi về đâu?',
      notes='Thẻ soạn bằng `drawProgram`.')

level('w09-l05', 'practice', 'build', 'Bậc thang', 'Vẽ bậc thang đi lên nhé!',
      'Rẽ trái và rẽ phải quay hai phía khác nhau.',
      'Rẽ trái hay rẽ phải cũng như nhau.',
      'Tầng 2 có cầu thang lên mái.',
      sol='REP3[F1 L90 F1 R90]', toolbox=tb('F1', 'L90', 'R90', 'repeat'), par=5,
      grid='square',
      hints=[hint('new', NEW + TIP['left'], point='toolbox:turtle_turn_left'),
             STRAY('Bậc này đi xuống. Rẽ phía nào để đi lên?')],
      thinking='Lên một bậc: rẽ trái hay rẽ phải?', t1=['REP3[F1 R90 F1 L90]'],
      notes='Đổi trái ↔ phải thì bậc đi xuống: nét lạ ngay bậc đầu.')

level('w09-l06', 'practice', 'bughunt', 'Lục giác lệch', 'Có 1 khối sai. Sửa giúp Măng nhé!',
      'Lục giác rẽ 60 độ: 6 lần rẽ đủ 1 vòng 360 độ.',
      'Rẽ theo góc trong của hình (lục giác rẽ 120).',
      'Cửa sổ tròn của tầng 2 bị lệch.',
      sol='REP6[F2 R60]', initial='REP6[F2 R120]', toolbox=tb('F2', 'R60', 'R120', 'repeat'),
      par=3, par_edits=1,
      hints=[hint('circle', 'Bấm Từng bước. 6 lần rẽ có đủ 1 vòng không?', point='step'),
             STRAY('Rẽ 120 độ 3 lần ra hình gì?'),
             hint('add', '60+60+60+60+60+60 bằng mấy?',
                  {'all': [{'trigger': 'run-end'}, {'failStreak': {'gte': 2}}]})],
      thinking='6 lần rẽ cộng lại là mấy độ?',
      notes='Gợi ý không nói góc đúng: bé tự tìm 60. Sau 2 lần sai: phép cộng 6 lần 60.')

level('w09-l07', 'practice', 'build', 'Ngôi nhà', 'Vẽ ngôi nhà có mái nhọn nhé!',
      'Ghép một hình vuông và một mái tam giác bằng góc 60 và 120.',
      'Mái nhà rẽ 90 độ như hình vuông.',
      'Tầng 2 cần một ngôi nhà nhỏ.',
      sol='REP4[F2 R90] L60 F2 R120 F2', toolbox=tb('F2', 'R90', 'L60', 'R120', 'repeat'),
      par=7, grid='tri',
      hints=[hint('roof', 'Vẽ tường trước hay mái trước?', point='stage'),
             hint('up', 'Măng đang nhìn sang phải. Mái đi lên mấy độ?', point='toolbox:turtle_turn_left'),
             STRAY('Mái nhà rẽ mấy độ?')],
      thinking='Vẽ xong hình vuông, Măng nhìn về đâu?',
      t1=['REP4[F2 R90] L60 F2 R90 F2'],
      notes='Bắt đầu ở góc trên bên trái của tường.')

level('w09-l08', 'practice', 'build', 'Nét đứt', 'Vẽ đường nét đứt nhé!',
      'Nhấc bút thì Măng vẫn đi nhưng không có nét.',
      'Nhấc bút là Măng đứng yên.',
      'Lối đi tầng 3 kẻ nét đứt.',
      sol='REP3[F1 U F1 D]', toolbox=tb('F1', 'up', 'down', 'repeat'), par=5, grid='square',
      hints=[hint('up', NEW + TIP['up'], point='toolbox:turtle_pen_up'),
             hint('down', NEW + TIP['down'], point='toolbox:turtle_pen_down'),
             STRAY('Chỗ hở thì bút phải lên hay xuống?')],
      thinking='Chỗ hở, Măng có đi qua không?', t1=['REP3[F1 F1]'],
      notes='Hai khối bút là một ý ("bút lên / xuống"), luôn đi đôi.')

level('w09-l09', 'practice', 'parsons', 'Hai ô cửa', 'Ghép khối để vẽ 2 ô cửa nhé!',
      'Nhấc bút để dời sang chỗ mới, rồi hạ bút vẽ tiếp.',
      'Muốn vẽ hai hình rời nhau phải vẽ cả đường nối.',
      'Tầng 3 cần hai ô cửa sổ.',
      sol='REP4[F2 R90] U F3 D REP4[F2 R90]', toolbox=[], par=9, grid='square', joined=1,
      hints=[hint('gap', 'Giữa hai ô cửa có nét không?', point='block:turtle_pen_up'),
             hint('order', 'Bút lên lúc nào? Bút xuống lúc nào?', point='stage')],
      thinking='Đi sang ô thứ 2, bút lên hay xuống?',
      notes='Ô cửa thứ nhất đã ghép sẵn; bé ghép bút lên, đi, bút xuống và ô thứ 2.')

level('w09-l10', 'practice', 'build', 'Ba ô liền', 'Vẽ 3 ô vuông liền nhau nhé!',
      'Vòng lặp trong vòng lặp: vòng trong chạy hết mới đi tiếp.',
      'Mọi khối trong vòng lặp ngoài đều chạy mỗi vòng trong.',
      'Tầng 3 lát gạch vuông.',
      sol='REP3[REP4[F2 R90] F2]', toolbox=tb('F2', 'R90', 'repeat'), par=5, depth=2,
      grid='square',
      hints=[hint('inner', 'Vòng trong vẽ 1 ô. Vòng ngoài làm gì?', point='toolbox:cq_repeat'),
             STRAY('Khối tiến để dời sang ô sau nằm ở vòng nào?')],
      thinking='Vẽ xong 1 ô, Măng đi đâu?', t1=['REP3[REP4[F2 R90 F2]]'],
      notes='`tiến 2` vào vòng trong vẽ nét lạ.')

level('w09-l11', 'practice', 'predict', 'Vòng trong chạy hết', 'Măng vẽ mấy tam giác? Đoán xem!',
      'Vòng trong chạy hết mỗi lần vòng ngoài chạy.',
      'Vòng trong chỉ chạy 1 lần.', None,
      sol='REP2[F2 REP3[F1 L120]]', toolbox=[],
      options=[('REP2[F2 REP3[F1 L120]]', '2 tam giác'), ('F4 REP3[F1 L120]', '1 tam giác ở cuối'),
               ('REP2[F2 F1 L120]', 'Đường gấp khúc')],
      hints=[hint('step', 'Bấm Từng bước. Vòng trong chạy mấy lần?', point='step'),
             hint('count', 'Mỗi lần vòng ngoài chạy, vòng trong vẽ gì?', trigger='idle')],
      thinking='Vòng ngoài chạy 2 lần. Mỗi lần có gì?')

level('w09-l12', 'practice', 'bughunt', 'Bút hạ mấy lần', 'Có 1 khối nằm sai chỗ. Sửa nhé!',
      'Khối ở ngoài vòng lặp chạy 1 lần; ở trong thì chạy mỗi vòng.',
      'Khối nằm ngay sau vòng lặp cũng chạy mỗi vòng.',
      'Hàng cờ tam giác tầng 3 chỉ có 1 cờ.',
      sol='REP3[REP3[F1 L120] U F2 D]', initial='REP3[REP3[F1 L120] U F2] D',
      toolbox=tb('F1', 'F2', 'L120', 'up', 'down', 'repeat'), par=7, par_edits=1, depth=2,
      hints=[hint('where', 'Bấm Từng bước. Bút hạ xuống mấy lần?', point='step'),
             MISSING('Khối hạ bút chạy mấy lần?', point='block:turtle_pen_down')],
      thinking='Sau cờ thứ nhất, bút đang lên hay xuống?', t1=['REP3[REP3[F1 L120] F2 D]'],
      notes='Khối sai chỗ là `hạ bút` nằm sau vòng lặp (chạy 1 lần, lúc cuối), nên chỉ có cờ '
            'đầu: `MISSING_LINES`. Sửa = kéo `hạ bút` vào cuối vòng ngoài (1 thao tác). Bản trước '
            '(`tiến` sai vòng) trùng bẫy của `l10` nên đã đổi.')

level('w09-l13', 'practice', 'build', 'Bông 6 ô vuông', 'Vẽ bông hoa 6 ô vuông nhé!',
      'Rẽ ở vòng ngoài xoay cả hình sau mỗi lần vẽ.',
      'Muốn xoay hình phải rẽ ở trong vòng trong.',
      'Tầng 4 cần một bông hoa.',
      sol='REP6[REP4[F2 R90] R60]', toolbox=tb('F2', 'R90', 'R60', 'repeat'), par=5, depth=2,
      hints=[hint('turn', 'Vẽ xong 1 ô vuông thì xoay mấy độ?', point='toolbox:cq_repeat'),
             STRAY('Khối rẽ 60 độ nằm ở vòng nào?')],
      thinking='6 ô vuông, mỗi lần xoay bao nhiêu độ?', t1=['REP6[REP4[F2 R90 R60]]'],
      notes='`phải 60` vào vòng trong vẽ nét lạ.')

level('w09-l14', 'practice', 'parsons', 'Quạt giấy', 'Ghép khối để vẽ quạt giấy nhé!',
      'Rẽ trước rồi vẽ, hay vẽ rồi mới rẽ: hình khác nhau.',
      'Thứ tự khối trong vòng ngoài không đổi hình.',
      'Quạt giấy cho tầng 4.',
      sol='REP3[R90 REP3[F2 L120]]', toolbox=[], par=5, depth=2,
      pieces=['REP3[]', 'R90', 'REP3[F2 L120]'],
      hints=[hint('wing', 'Vòng trong vẽ gì?', point='block:turtle_turn_left'),
             hint('turn', 'Cánh đầu tiên chỉ về đâu? Rẽ trước hay sau?', point='stage')],
      thinking='Cánh đầu tiên chỉ về hướng nào?',
      notes='Mảnh rời: vòng ngoài rỗng, `phải 90`, vòng trong có sẵn thân. 3 cánh (không phải 4): '
            'đặt `phải 90` sau vòng trong thì cánh lệch, nét lạ. Bản 4 cánh xoay đều nên 2 cách '
            'ghép cùng thắng.')

# l16 (spells, needs P4-03) is written last, by hand.

level('w09-l15', 'practice', 'build', 'Khung tranh', 'Vẽ khung tranh nét đứt nhé!',
      'Bút lên xuống ở vòng trong, rẽ ở vòng ngoài.',
      'Khối rẽ đặt ở vòng nào cũng được.',
      'Tầng 4 treo một bức tranh.',
      sol='REP4[REP2[F1 U F1 D] R90]', toolbox=tb('F1', 'up', 'down', 'R90', 'repeat'), par=7,
      depth=2, grid='square',
      hints=[hint('side', 'Vòng trong vẽ mấy nét đứt?', point='toolbox:cq_repeat'),
             STRAY('Rẽ sau mỗi nét hay sau mỗi cạnh?')],
      thinking='Một cạnh có mấy nét?', t1=['REP4[REP2[F1 U F1 D R90]]'],
      notes='`phải 90` vào vòng trong vẽ nét lạ.')

level('w09-l17', 'practice', 'bughunt', 'Cành tuyết', 'Có 1 khối sai. Sửa nhé!',
      'Rẽ 180 độ là quay ngược lại, đi về chỗ cũ.',
      'Đi vào nhánh rồi tự quay về được.',
      'Cành tuyết trên tầng 5 bị gãy.',
      sol='REP3[F2 REP2[L60 F1 R180 F1] L60 F2 L60]',
      initial='REP3[F2 REP2[L60 F1 R120 F1] L60 F2 L60]',
      toolbox=tb('F1', 'F2', 'L60', 'R120', 'R180', 'repeat'), par=10, par_edits=1, depth=2,
      hints=[hint('back', 'Khối này quay mấy độ?', point='block:turtle_turn_right'),
             STRAY('Vào nhánh rồi, muốn quay về thì rẽ mấy độ?')],
      thinking='Đi vào nhánh rồi quay về: rẽ mấy độ?',
      notes='Ý mới "rẽ 180 độ là quay ngược lại" có bài `w09-lesson-quay-nguoc` (câu luật, demo, '
            'quiz). Tooltip vẫn ghi 90 độ; câu luật của 180 nằm ở bài.')

level('w09-l18', 'challenge', 'build', 'Bậc ô vuông', 'Vẽ bậc thang ô vuông, ít khối thôi!',
      'Vòng ngoài vẽ một ô rồi dời lên một bậc.',
      None, None,
      sol='REP3[REP5[F1 L90] F1 R90]', target='REP3[REP4[F1 L90] F1 L90 F1 R90]',
      toolbox=tb('F1', 'L90', 'R90', 'repeat'),
      par=6, max_blocks=8, depth=2, grid='square',
      hints=[hint('few', 'Chỉ có 8 khối. Vòng nào lặp lại?', point='capacity'),
             STRAY('Lên bậc rồi, Măng có nhìn đúng hướng không?'),
             hint('more', 'Đi thêm 1 cạnh nữa thì tới bậc sau?',
                  {'all': [{'trigger': 'run-end'}, {'failStreak': {'gte': 2}}]})],
      thinking='Sau mỗi ô, Măng đi đâu để lên bậc?',
      t1=['REP3[REP4[F1 L90] F1 L90 F1]'],
      notes='Cách 8 khối `lặp 3 {lặp 4 {tiến 1, trái 90}, tiến 1, trái 90, tiến 1, phải 90}` vẫn '
            'thắng (⭐⭐). Cách 6 khối (`par`): vòng trong chạy 5 lần, cạnh thứ 5 đưa Măng tới bậc '
            'sau; gợi ý sau 2 lần sai hỏi đúng ý đó. Vẽ từng ô vượt 8 khối.')

level('w09-l19', 'challenge', 'predict', 'Cờ chong chóng', 'Măng vẽ hình gì? Đoán xem!',
      'Đọc vòng lặp lồng nhau và đoán hình.', None, None,
      sol='REP4[F1 REP3[F1 R120] R90]', toolbox=[],
      options=[('REP4[F1 REP3[F1 R120] R90]', '4 lá cờ quanh tâm'),
               ('F1 REP3[F1 R120]', '1 lá cờ'),
               ('REP4[F1 F1 R120 R90]', 'Đường gấp khúc')],
      hints=[hint('one', 'Một vòng ngoài vẽ gì?', trigger='idle')],
      thinking='Vòng ngoài chạy mấy lần? Mỗi lần vẽ gì?')

level('w09-boss', 'boss', 'build', 'Bông hoa tuyết', 'Vẽ bông hoa tuyết 6 cánh nhé!',
      'Mọi khối của Tháp Họa Sĩ: lặp lồng nhau, góc, nhấc bút.',
      None, 'Lễ hội mùa đông cần một bông tuyết!',
      sol='REP6[F1 U F1 D REP3[F1 L120] U R180 F2 D R120]',
      toolbox=tb('F1', 'F2', 'L120', 'R120', 'R180', 'up', 'down', 'repeat'), par=13, depth=2,
      par_unproven=True,
      hints=[hint('arm', 'Cánh đầu tiên cần những khối nào?', point='stage'),
             STRAY('Chỗ hở và đường về: bút lên hay xuống?'),
             hint('home', 'Vẽ xong tinh thể, về tâm bằng đường nào?',
                  {'all': [{'trigger': 'run-end'}, {'failStreak': {'gte': 2}}]})],
      thinking='Một cánh gồm những phần nào?',
      t1=['REP6[F1 F1 REP3[F1 L120] R180 F2 R120]'],
      notes='Mỗi cánh: nét đứt từ tâm, một tinh thể tam giác ở đầu, rồi nhấc bút đi về tâm. '
            'Không nhấc bút thì khe và đường về thành nét lạ: nhấc bút là cần để đi, không chỉ '
            'để trang trí.')

# ---- l16: the W8 spell, reviewed (needs A's spell search, P4-03) --------------------------------
def spell_level():
    sol = 'REP3[P R120] R90 F3 P'
    lv = level('w09-l16', 'practice', 'build', 'Hoa ba cánh', 'Vẽ hoa ba cánh có cuống nhé!',
               'Ôn phép thuật: dạy phép vẽ 1 cánh, làm phép ở 2 chỗ.',
               'Phép chỉ dùng được một lần.',
               'Bồn hoa tầng 4 cần một bông hoa.',
               sol=sol, toolbox=tb('F2', 'F3', 'R60', 'R90', 'R120', 'repeat'), par=12,
               max_blocks=12, depth=2,
               hints=[hint('spell', 'Hoa có mấy cánh giống nhau?', point='toolbox:cq_proc_def'),
                      hint('call', 'Làm phép mấy lần thì đủ hoa và lá?',
                           point='toolbox:cq_proc_call'),
                      STRAY('Vẽ xong 1 cánh, quay mấy độ để vẽ cánh sau?')],
               thinking='Cánh và lá giống nhau không?',
               t1=['REP3[P R60] R90 F3 P'],
               notes='Ôn phép của W8 (cần W8 làm trước). Thân phép cố định (ADR-0023 chế độ 1). R5: '
                     '`maxBlocks` 12, chép thẳng cần 14.')
    lv['procedures'] = [{'id': SPELL['id'], 'name': SPELL['name']}]
    lv['toolbox'] = [{'type': 'cq_proc_def', 'fields': {'PROC': SPELL['id']}},
                     {'type': 'cq_proc_call', 'fields': {'PROC': SPELL['id']}}] + lv['toolbox']
    lv['solution'] = workspace(sol, spell=True)
    # Keep the key order of the other levels: procedures before config.
    order = ['id', 'worldId', 'stage', 'kind', 'mode', 'title', 'objective', 'learningGoal',
             'misconception', 'mission', 'toolbox', 'maxBlocks', 'maxLoopDepth', 'par',
             'procedures', 'config', 'solution', 'hints', 'thinkingHint']
    LEVELS[LEVELS.index(lv)] = {k: lv[k] for k in order if k in lv}

spell_level()

CREATIVE = {
    'id': 'w09-creative', 'worldId': WORLD, 'stage': 'creative', 'kind': 'turtle',
    'mode': 'creative', 'title': 'Bức tường trống', 'objective': 'Vẽ gì cũng được. Tự do nhé!',
    'learningGoal': 'Tự vẽ hình của mình bằng lặp lồng nhau, góc và bút.',
    'toolbox': tb('F1', 'F2', 'R60', 'R90', 'R120', 'L60', 'L90', 'L120', 'up', 'down',
                  'repeat'),
    'maxLoopDepth': 2,
    'config': {'size': {'w': 12, 'h': 12}, 'start': {'x': 6, 'y': 6, 'heading': 0},
               'angles': [30, 60, 90, 120, 150, 180], 'grid': 'tri'},
    'hints': [],
}
LEVELS.append(CREATIVE)

# ---- Lessons -----------------------------------------------------------------------------------
def demo(text, src, heading=0):
    size, (sx, sy) = fit([src], heading, 1)
    return {'type': 'demo', 'text': text, 'kind': 'turtle',
            'config': {'size': size, 'start': {'x': sx, 'y': sy, 'heading': heading},
                       'angles': sorted(set(angles_of(src)) or {90}),
                       'grid': 'square' if set(angles_of(src)) <= {90, 180} else 'tri'},
            'workspace': workspace(src)}

def say(text, pose='point'):
    return {'type': 'say', 'pose': pose, 'text': text}

def quiz(text, options, explain, correct=0):
    return {'type': 'quiz', 'text': text, 'options': options, 'correct': correct,
            'explain': explain}

LESSONS = [
    ('w09-lesson', 'Tháp Họa Sĩ', None, [
        say('Cô Thỏ nhờ Măng vẽ lại Tháp Họa Sĩ.', 'happy'),
        say('Bút hạ thì Măng đi đâu cũng có nét.'),
        say('Vẽ thứ tự nào cũng được, miễn giống hình mẫu.', 'think'),
        quiz('Măng rẽ phải 90 độ. Có nét mới không?', ['Không', 'Có'],
             'Rẽ chỉ quay tại chỗ, Măng chưa đi.'),
    ]),
    ('w09-lesson-but', 'Khối tiến bước', 'w09-l01', [
        say(NEW + TIP['fwd']),
        demo('Tiến 3: một nét dài 3.', 'F3'),
        demo('Tiến 1 rồi tiến 2: cũng nét dài 3.', 'F1 F2'),
        quiz('Măng tiến 4 bước. Nét dài mấy?', ['4', '1'], 'Mỗi bước thêm 1 đoạn: 4 bước, nét dài 4.'),
    ]),
    ('w09-lesson-re-phai', 'Khối rẽ phải', 'w09-l02', [
        say(NEW + TIP['right']),
        demo('Tiến, rẽ phải, tiến: chữ L.', 'F2 R90 F2'),
        quiz('Măng nhìn lên, rẽ phải 90 độ. Giờ nhìn đâu?', ['Sang phải', 'Sang trái'],
             '90 độ là góc vuông. Nhìn lên, rẽ phải: nhìn sang phải.'),
    ]),
    ('w09-lesson-goc', 'Góc rẽ đổi hình', 'w09-l04', [
        say('Góc rẽ đổi hình.'),
        demo('Rẽ 90 độ 4 lần: hình vuông.', 'REP4[F2 R90]'),
        demo('Rẽ 90 độ 3 lần: thiếu 1 cạnh.', 'REP3[F2 R90]'),
        quiz('Đổi số độ của khối rẽ. Hình có đổi không?', ['Có', 'Không'],
             'Góc rẽ khác thì cạnh sau đi hướng khác.'),
    ]),
    ('w09-lesson-re-trai', 'Khối rẽ trái', 'w09-l05', [
        say(NEW + TIP['left']),
        demo('Tiến, rẽ trái, tiến: nét đi lên.', 'F2 L90 F2'),
        quiz('Măng nhìn sang phải, rẽ trái 90 độ. Giờ nhìn đâu?', ['Lên trên', 'Xuống dưới'],
             'Rẽ trái từ hướng phải là quay lên trên.'),
    ]),
    ('w09-lesson-mot-vong', 'Đủ một vòng', 'w09-l06', [
        say('Đi đủ 1 vòng là quay 360 độ.'),
        say('Góc rẽ là chỗ Măng quay thêm, không phải góc hình.', 'think'),
        demo('12 lần rẽ 30 độ: đủ 1 vòng.', 'REP12[F1 R30]'),
        quiz('Hình vuông rẽ 4 lần. Mỗi lần mấy độ?', ['90', '60'],
             '90+90+90+90 = 360: đủ 1 vòng.'),
    ]),
    ('w09-lesson-nhac-but', 'Bút lên, bút xuống', 'w09-l08', [
        say(NEW + TIP['up']),
        say(NEW + TIP['down']),
        demo('Nhấc bút ở giữa: nét đứt.', 'F1 U F1 D F1'),
        quiz('Nhấc bút rồi tiến 2. Măng có đi không?', ['Có, nhưng không có nét', 'Không, đứng yên'],
             'Nhấc bút: Măng vẫn đi, chỉ không có nét.'),
    ]),
    ('w09-lesson-lap-long', 'Lặp trong lặp', 'w09-l10', [
        say('Vòng trong chạy hết, vòng ngoài mới đi tiếp.'),
        demo('Vòng trong vẽ ô vuông. Vòng ngoài chạy 2 lần.', 'REP2[REP4[F1 R90] U F2 D]'),
        quiz('Lặp 2 lần { lặp 4 lần { tiến } }. Tiến mấy lần?', ['8 lần', '4 lần'],
             '2 × 4 = 8: vòng trong chạy hết mỗi lần.'),
    ]),
    ('w09-lesson-xoay-hinh', 'Xoay hình', 'w09-l13', [
        say('Rẽ ở vòng ngoài: hình xoay sau mỗi lần vẽ.'),
        demo('3 ô vuông, mỗi lần xoay 120 độ.', 'REP3[REP4[F1 R90] R120]'),
        quiz('Muốn xoay cả hình, khối rẽ đặt ở đâu?', ['Vòng ngoài', 'Vòng trong'],
             'Vòng ngoài chạy sau mỗi hình: hình xoay.'),
    ]),
    ('w09-lesson-quay-nguoc', 'Quay ngược lại', 'w09-l17', [
        say('Rẽ 180 độ là quay ngược lại.'),
        demo('Tiến 2, rẽ 180, tiến 2: về chỗ cũ.', 'F2 R180 F2'),
        quiz('Rẽ phải 180 độ rồi tiến 2. Măng đi đâu?', ['Đi ngược lại', 'Đi tiếp như cũ'],
             'Rẽ 180 độ: Măng quay mặt về phía sau.'),
    ]),
]

WORLD_JSON = {
    'id': WORLD, 'order': 9, 'title': 'Tháp Họa Sĩ', 'emoji': '🎨',
    'concept': 'Lặp lồng nhau và góc: vẽ hình bằng bút',
    'story': 'Gió thổi bay màu vẽ của Tháp Họa Sĩ. Măng cầm bút vẽ lại từng tầng.',
    'chapters': [
        {'id': 'thap-trong', 'title': 'Tháp trống trơn',
         'lines': ['Tháp Họa Sĩ của cô Thỏ có 5 tầng.',
                   'Gió thổi bay hết màu vẽ trên tường.',
                   'Măng cầm bút lông, vẽ lại từng tầng.'],
         'art': {'cast': ['bunny'], 'prop': 'tower'}},
        {'id': 'mai-nha', 'title': 'Mái nhà', 'unlockAfter': 'w09-l07',
         'lines': ['Tầng 2 có ngôi nhà và cửa sổ lục giác.', 'Cô Thỏ khen: góc rẽ đẹp quá!'],
         'art': {'cast': ['bunny'], 'prop': 'easel'}},
        {'id': 'but-nhay', 'title': 'Bút biết nhảy', 'unlockAfter': 'w09-l09',
         'lines': ['Bút nhấc lên, bút hạ xuống.', 'Tầng 3 có lối đi nét đứt và hai ô cửa.'],
         'art': {'cast': ['bunny'], 'prop': 'easel'}},
        {'id': 'vong-trong-vong', 'title': 'Vòng trong vòng', 'unlockAfter': 'w09-l15',
         'lines': ['Lặp trong lặp vẽ hoa và chong chóng.', 'Chỉ còn tầng 5 trên đỉnh tháp.'],
         'art': {'cast': ['bunny'], 'prop': 'tower'}},
        {'id': 'hoa-tuyet', 'title': 'Hoa tuyết trên đỉnh tháp', 'unlockAfter': 'w09-boss',
         'lines': ['Bông tuyết lấp lánh cho lễ hội mùa đông.',
                   'Học Viện Thuật Toán đang chờ Măng!'],
         'art': {'cast': ['bunny', 'owl'], 'prop': 'tower'}},
    ],
    'theme': {'tileset': '/tiles/ground.png', 'palette': 'day', 'scene': 'thap-hoa-si'},
    'lessonIds': [l[0] for l in LESSONS],
    'levelIds': [f'w09-l{n:02d}' for n in range(1, 20)] + ['w09-boss', 'w09-creative'],
    'unlock': {'minStarRatio': 0.6},
    'unplugged': {'title': 'Rùa băng keo', 'steps': [
        'Dán lưới băng keo trên sàn. Một bé làm rùa, cầm phấn.',
        'Bạn đọc thẻ "tiến 2 bước", "rẽ phải 90 độ". Rùa xoay người, tay chỉ hướng.',
        'Vòng 1: vẽ hình vuông. Đếm số lần rẽ: 4 lần, đủ 1 vòng.',
        'Vòng 2: vẽ tam giác. Thử rẽ 60 (sai), rồi rẽ 120.',
        'Vòng 3: thẻ "lặp 3 lần { lặp 4 lần {…}, tiến 2 }". Cả nhóm đếm số cạnh trước khi vẽ.',
    ]},
}

# ---- Output ------------------------------------------------------------------------------------
def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    for lv in LEVELS:
        write(ROOT + 'levels/' + lv['id'] + '.json', lv)
    for id, title, before, cards in LESSONS:
        lesson = {'id': id, 'worldId': WORLD, 'title': title}
        if before: lesson['beforeLevel'] = before
        lesson['cards'] = cards
        write(ROOT + 'lessons/' + id + '.json', lesson)
    write(ROOT + 'world.json', WORLD_JSON)
    print(len(LEVELS), 'levels,', len(LESSONS), 'lessons written to', ROOT)
    print('Next: npx prettier --write content/worlds/w09-thap-hoa-si && npm run content:check')
