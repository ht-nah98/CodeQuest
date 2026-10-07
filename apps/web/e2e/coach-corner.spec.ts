import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { signInTestProfile } from './helpers';

// P2-05 acceptance (docs/roadmap/phase-2.md): the coach corner at /coach, behind the adult lock.
// Local progress is seeded straight into IndexedDB, two backup files are opened (read in memory,
// never written to the laptop), the CSV summary is downloaded, and a world unlocked by hand for
// a child opens for that child.

const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/coach-corner';
const CONTENT = fileURLToPath(new URL('../../../content/worlds/', import.meta.url));
const W01 = 'w01-lang-tre';
const W02 = 'w02-rung-lap-lai';
const NOW = new Date().toISOString();

/** Levels the coach table counts in a world: live ones, bonus excluded (metrics.ts). */
function countedLevels(worldDir: string): number {
  const world = JSON.parse(readFileSync(join(CONTENT, worldDir, 'world.json'), 'utf8')) as {
    levelIds: string[];
  };
  const files = new Map(
    readdirSync(CONTENT).flatMap((dir) => {
      try {
        return readdirSync(join(CONTENT, dir, 'levels')).map(
          (f) => [f.replace(/\.json$/, ''), join(CONTENT, dir, 'levels', f)] as const,
        );
      } catch {
        return [];
      }
    }),
  );
  return world.levelIds.filter((id) => {
    const path = files.get(id);
    if (path === undefined) return false;
    const level = JSON.parse(readFileSync(path, 'utf8')) as { stage: string; retired?: boolean };
    return level.stage !== 'bonus' && level.retired !== true;
  }).length;
}

const progress = (profileId: string, levelId: string, bestStars: number, firstTryWin = false) => ({
  profileId,
  levelId,
  bestStars,
  bestBlocks: 4,
  completedAt: NOW,
  firstTryWin,
  attempts: 1,
  updatedAt: NOW,
});

const coin = (profileId: string, id: string, reason: string, delta: number) => ({
  id,
  profileId,
  delta,
  reason,
  refId: null,
  at: NOW,
  localDay: NOW.slice(0, 10),
});

const attempt = (profileId: string, id: string, levelId: string, hintTiersBought: number[]) => {
  const start = new Date(Date.parse(NOW) - 3 * 60_000).toISOString();
  return {
    id,
    profileId,
    levelId,
    startedAt: start,
    endedAt: NOW,
    runs: [
      { runId: `${id}-1`, result: 'incomplete', reasonCode: 'FELL_IN_HOLE', blocksUsed: 3 },
      { runId: `${id}-2`, result: 'success', reasonCode: null, blocksUsed: 4 },
    ],
    hintTiersBought,
    won: true,
  };
};

const FAKE_PIN_HASH = `pbkdf2-sha256$100000$${'A'.repeat(22)}==$${'B'.repeat(43)}=`;

/** A backup file (data/backup.ts format) of one child. */
function backupFile(id: string, nickname: string, stars: number[]): string {
  return JSON.stringify({
    format: 'codequest-backup',
    version: 1,
    exportedAt: NOW,
    profiles: [
      {
        profile: {
          id,
          nickname,
          avatarId: 'cat',
          pinHash: FAKE_PIN_HASH,
          settings: {
            musicVolume: 0.5,
            sfxVolume: 0.5,
            voiceVolume: 0.5,
            reducedMotion: false,
            colorBlindTheme: false,
          },
          createdAt: NOW,
        },
        lessons: [],
        progress: stars.map((s, i) => progress(id, `w01-l0${String(i + 1)}`, s)),
        drafts: [],
        attempts: [attempt(id, `${id}-a1`, 'w01-l01', [3])],
        ledger: [coin(id, 'starter', 'starter', 30)],
        inventory: [],
        badges: [],
        creations: [],
      },
    ],
  });
}

/** Writes rows straight into the app's IndexedDB (the app already created it). */
async function seedRows(page: Page, rows: Record<string, unknown[]>): Promise<void> {
  await page.evaluate(async (tables) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('codequest');
      req.onsuccess = () => {
        resolve(req.result);
      };
      req.onerror = () => {
        reject(new Error('open failed'));
      };
    });
    const tx = db.transaction(Object.keys(tables), 'readwrite');
    for (const [name, list] of Object.entries(tables)) {
      for (const row of list) tx.objectStore(name).put(row);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(new Error('write failed'));
      };
    });
    db.close();
  }, rows);
}

async function countProfiles(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('codequest');
      req.onsuccess = () => {
        resolve(req.result);
      };
      req.onerror = () => {
        reject(new Error('open failed'));
      };
    });
    const count = await new Promise<number>((resolve) => {
      const req = db.transaction('profiles').objectStore('profiles').count();
      req.onsuccess = () => {
        resolve(req.result);
      };
    });
    db.close();
    return count;
  });
}

/** Opens /coach through the adult lock (a multiplication). */
async function openCorner(page: Page): Promise<void> {
  await page.goto('/coach');
  const question = page.getByTestId('coach-gate-question');
  await expect(question).toBeVisible();
  const a = Number(await question.getAttribute('data-a'));
  const b = Number(await question.getAttribute('data-b'));
  await page.getByRole('textbox').fill(String(a * b));
  await page.getByRole('button', { name: 'Mở' }).click();
  await expect(page.getByTestId('coach-corner')).toBeVisible();
}

let errors: string[];
let foreign: string[];

test.beforeEach(({ page }) => {
  mkdirSync(SHOTS, { recursive: true });
  errors = [];
  foreign = [];
  page.on('console', (msg) => {
    if (msg.text().startsWith('[.WebGL-')) return;
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    if (url.hostname !== 'localhost') foreign.push(req.url());
  });
});

test.afterEach(() => {
  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
});

test('a child cannot open the coach corner without the adult lock', async ({ page }) => {
  await signInTestProfile(page, 'Bé Khóa');
  await page.goto('/coach');
  await expect(page.getByTestId('coach-gate')).toBeVisible();
  await page.getByRole('textbox').fill('1');
  await page.getByRole('button', { name: 'Mở' }).click();
  await expect(page.getByRole('alert')).toHaveText('Chưa đúng. Thử lại nhé.');
  await expect(page.getByTestId('coach-corner')).toHaveCount(0);
});

test('shows a child of this laptop, its level detail, and unlocks a world for it', async ({
  page,
}) => {
  await signInTestProfile(page, 'Na');
  const id = await page.evaluate(() => sessionStorage.getItem('cq.profileId'));
  if (id === null) throw new Error('not signed in');
  // A real child: no author "unlock all".
  await page.evaluate(() => {
    sessionStorage.removeItem('cq.unlockAll');
  });
  await seedRows(page, {
    progress: [progress(id, 'w01-l01', 3, true), progress(id, 'w01-l02', 2)],
    attempts: [attempt(id, `${id}-a1`, 'w01-l02', [1])],
    // 30 starter + 25 (w01-l01) + 15 (w01-l02) − 5 (hint 1) = 65
    ledger: [
      coin(id, 'level-clear:w01-l01', 'level-clear', 10),
      coin(id, 'star-2:w01-l01', 'star-2', 5),
      coin(id, 'star-3:w01-l01', 'star-3', 5),
      coin(id, 'first-try:w01-l01', 'first-try', 5),
      coin(id, 'level-clear:w01-l02', 'level-clear', 10),
      coin(id, 'star-2:w01-l02', 'star-2', 5),
      coin(id, 'hint-1:w01-l02', 'hint-1', -5),
    ],
  });

  await page.goto(`/w/${W02}`);
  await expect(page.getByText('Thế giới này chưa mở. Qua thế giới trước nhé!')).toBeVisible({
    timeout: 15_000,
  });

  await openCorner(page);
  const row = page.locator('[data-testid="coach-row"][data-child="Na"]');
  await expect(row).toBeVisible();
  await expect(row.getByTestId(`cell-${W01}`)).toContainText(`2/${String(countedLevels(W01))}`);
  await expect(row.getByTestId(`cell-${W01}`)).toContainText('★ 5');
  await expect(row.getByTestId(`cell-${W02}`)).toContainText(`0/${String(countedLevels(W02))}`);
  await expect(row.getByTestId('cell-stars')).toHaveText('5');
  await expect(row.getByTestId('cell-coins')).toHaveText('65');
  await expect(row.getByTestId('cell-time')).toHaveText('3 phút');
  await expect(row.getByTestId('cell-streak')).toHaveText('0 ngày');
  await expect(page.getByTestId('coach-concepts')).toContainText('50% thua · 2 lần chạy');

  await row.getByRole('button', { name: 'Na' }).click();
  const detail = page.getByTestId('coach-detail');
  await expect(detail).toBeVisible();
  await detail.getByTestId(`detail-world-${W01}`).getByRole('button', { name: 'Xem màn' }).click();
  const level = detail.getByTestId('detail-level-w01-l02');
  await expect(level).toContainText('FELL_IN_HOLE ×1');
  await expect(level).toContainText('1/0/0');
  await expect(level).toContainText('★ 2');
  await expect(detail.getByTestId('detail-level-w01-l01')).toContainText('Có');

  await detail.getByTestId(`unlock-${W02}`).click();
  await expect(detail.getByTestId(`detail-world-${W02}`)).toContainText('Đã mở tay');
  await page.screenshot({ path: `${SHOTS}/local-detail.png`, fullPage: true });

  // The child (same tab, still signed in) now gets into world 2.
  await page.goto(`/w/${W02}`);
  await expect(page.getByRole('heading', { level: 1, name: /Rừng Lặp Lại/ })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText('Thế giới này chưa mở. Qua thế giới trước nhé!')).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/world2-unlocked.png` });

  // Undo, so the world is locked again.
  await page.goto('/coach');
  await page.locator('[data-testid="coach-row"][data-child="Na"]').getByRole('button').click();
  await page.getByTestId(`relock-${W02}`).click();
  await page.goto(`/w/${W02}`);
  await expect(page.getByText('Thế giới này chưa mở. Qua thế giới trước nhé!')).toBeVisible({
    timeout: 15_000,
  });

  // Opening one level of a locked world opens the world too, so the child can reach it.
  await page.goto('/coach');
  await page.locator('[data-testid="coach-row"][data-child="Na"]').getByRole('button').click();
  await page.getByTestId(`detail-world-${W02}`).getByRole('button', { name: 'Xem màn' }).click();
  await page.getByTestId('unlock-w02-l03').click();
  await expect(page.getByTestId('detail-level-w02-l03')).toContainText('Đã mở tay');
  await expect(page.getByTestId(`detail-world-${W02}`)).toContainText('Đã mở tay');
  await page.goto('/play/w02-l03');
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
});

test('opens two backup files read-only and exports the CSV summary', async ({ page }) => {
  await openCorner(page);
  await expect(page.getByText('Chưa có bé nào. Mở file sao lưu hoặc tạo hồ sơ.')).toBeVisible();

  await page.getByTestId('coach-file-input').setInputFiles([
    {
      name: 'mai.json',
      mimeType: 'application/json',
      buffer: Buffer.from(backupFile('p-mai', 'Mai', [3, 2])),
    },
    {
      name: 'ty.json',
      mimeType: 'application/json',
      buffer: Buffer.from(backupFile('p-ty', 'Tý', [1])),
    },
    { name: 'rac.json', mimeType: 'application/json', buffer: Buffer.from('{"x":1}') },
  ]);
  await expect(page.getByTestId('coach-file')).toHaveCount(2);
  await expect(page.getByRole('alert').filter({ hasText: 'rac.json' })).toHaveText(
    'rac.json: không phải file sao lưu',
  );
  const rows = page.getByTestId('coach-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: 'Mai' }).getByTestId('cell-stars')).toHaveText('5');
  await expect(rows.filter({ hasText: 'Tý' }).getByTestId('cell-stars')).toHaveText('1');
  // Each child bought a tier-3 hint on w01-l01: the level is flagged "Khó".
  await expect(page.getByTestId('coach-stuck')).toContainText('w01-l01Khó');

  // File children are read-only: no unlock buttons.
  await rows.filter({ hasText: 'Mai' }).getByRole('button', { name: 'Mai' }).click();
  await expect(page.getByTestId('coach-detail')).toContainText('chỉ xem');
  await expect(page.getByTestId(`unlock-${W02}`)).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/files.png`, fullPage: true });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('coach-export-csv').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^codequest-hlv-\d{4}-\d{2}-\d{2}\.csv$/);
  const path = await download.path();
  const csv = readFileSync(path, 'utf8');
  const lines = csv
    .replace(/^\uFEFF/, '')
    .trim()
    .split('\r\n');
  expect(lines[0]).toBe(
    'Biệt danh,Thế giới,Màn xong,Số màn,Sao,Sao tối đa,Học gần nhất (thế giới),Xu,Chuỗi ngày,Phút học,Học gần nhất,Nguồn',
  );
  expect(lines).toContainEqual(
    expect.stringMatching(
      new RegExp(
        `^Mai,${W01},2,${String(countedLevels(W01))},5,\\d+,[\\d-]+,30,0,3,[\\d-]+,mai\\.json$`,
      ),
    ),
  );
  // One line per child × world.
  const worlds = readdirSync(CONTENT).filter((dir) => !dir.startsWith('_')).length;
  expect(lines).toHaveLength(1 + 2 * worlds);
  expect(lines.filter((l) => l.startsWith('Tý,'))).toHaveLength(worlds);

  // Nothing from the files reached this laptop's database.
  expect(await countProfiles(page)).toBe(0);
  await page.getByRole('button', { name: 'Bỏ file mai.json' }).click();
  await expect(rows).toHaveCount(1);
});
