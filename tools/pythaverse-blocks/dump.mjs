// Dump every block in the toolbox of Pythaverse's Leanbot block editor, in Vietnamese and in
// English, with the Arduino code each block generates. Source for docs/product/the-gioi-leanbot.md.
//   node tools/pythaverse-blocks/dump.mjs [out.json]
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const b = await chromium.launch();
const out = {};
for (const lang of ['vi', 'en']) {
  const p = await b.newPage();
  await p.goto(`https://ide.pythaverse.space/lbeditor/?lang=${lang}`, { waitUntil: 'networkidle' });
  out[lang] = await p.evaluate(() => {
    const { Blockly } = window;
    const ws = Blockly.getMainWorkspace();
    const tree = ws.options.languageTree;
    const gen = Blockly.Arduino;
    gen.init(ws);
    const msg = (s) => s && s.replace(/%\{BKY_(\w+)\}/g, (_, k) => Blockly.Msg[k] ?? k);
    const cats = [];
    const walk = (node, path) => {
      for (const c of node.contents || []) {
        if (c.kind === 'category') {
          cats.push({ name: msg(c.name), path, custom: c.custom, blocks: [] });
          walk(c, path.concat(msg(c.name)));
        } else if (c.kind === 'block') {
          const cat = cats[cats.length - 1];
          let text = '',
            code = '',
            err = '';
          try {
            const xml = c.blockxml
              ? typeof c.blockxml === 'string'
                ? Blockly.Xml.textToDom(c.blockxml)
                : c.blockxml
              : null;
            const blk = xml ? Blockly.Xml.domToBlock(xml, ws) : ws.newBlock(c.type);
            text = blk.toString();
            try {
              const g = gen.blockToCode(blk);
              code = Array.isArray(g) ? g[0] : g;
            } catch (e) {
              err = String(e).slice(0, 120);
            }
            blk.dispose();
          } catch (e) {
            err = String(e).slice(0, 120);
          }
          cat.blocks.push({
            type:
              c.type ||
              (c.blockxml &&
                /type=["']([^"']+)["']/.exec(
                  typeof c.blockxml === 'string' ? c.blockxml : c.blockxml.outerHTML,
                )?.[1]),
            text,
            code: (code || '').trim(),
            err,
          });
        }
      }
    };
    walk(tree, []);
    const inTb = new Set(cats.flatMap((c) => c.blocks.map((b) => b.type)));
    const extra = [];
    for (const t of Object.keys(Blockly.Blocks)) {
      if (inTb.has(t)) continue;
      let text = '',
        code = '',
        err = '';
      try {
        const blk = ws.newBlock(t);
        text = blk.toString();
        try {
          const g = gen.blockToCode(blk);
          code = Array.isArray(g) ? g[0] : g;
        } catch (e) {
          err = String(e).slice(0, 100);
        }
        blk.dispose();
      } catch (e) {
        err = String(e).slice(0, 100);
      }
      extra.push({ type: t, text, code: (code || '').trim(), err });
    }
    return { cats, extra, lbKeys: Object.keys(window.LeanbotArduino) };
  });
  await p.close();
}
// Pair the vi and en toolboxes block by block; both list the same blocks in the same order.
const toolbox = out.vi.cats.flatMap((cat, i) =>
  cat.blocks.map((blk, j) => {
    const en = out.en.cats[i].blocks[j];
    return {
      category: out.en.cats[i].name,
      type: blk.type,
      en: en.text,
      vi: blk.text,
      code: blk.code,
    };
  }),
);
const result = {
  source: 'https://ide.pythaverse.space/lbeditor/ (Blockly 3.20200924.3, generator 2024-09-15)',
  extracted: new Date().toISOString().slice(0, 10),
  toolbox,
};
writeFileSync(
  process.argv[2] ?? 'docs/research/pythaverse-lbeditor-blocks.json',
  JSON.stringify(result, null, 1),
);
await b.close();
