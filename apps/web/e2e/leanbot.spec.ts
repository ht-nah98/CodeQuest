import { expect, test } from '@playwright/test';
import { signInTestProfile, unlockLeanbotCourse } from './helpers';

// Two courses, one account (ADR-0028): the hub, the Leanbot lesson list, and one lesson from
// its goals page through a screen to the quiz.

test.beforeEach(async ({ page }) => {
  await signInTestProfile(page);
  // Lesson 0 gates the rest of the course; the gate has its own test below.
  await unlockLeanbotCourse(page);
});

test('the hub offers both courses and leads into each', async ({ page }) => {
  await page.goto('/hub');

  await expect(page.getByRole('heading', { name: 'Học gì hôm nay?' })).toBeVisible();
  await expect(page.getByText('Chào Bé Thử!')).toBeVisible();

  const leanbot = page.getByRole('link', { name: /Leanbot/ });
  const codequest = page.getByRole('link', { name: /CodeQuest/ });
  await expect(leanbot).toBeVisible();
  await expect(codequest).toBeVisible();

  await codequest.click();
  await expect(page).toHaveURL(/\/map$/);

  await page.goto('/hub');
  await page.getByRole('link', { name: /Leanbot/ }).click();
  await expect(page).toHaveURL(/\/leanbot$/);
  await expect(page.getByRole('heading', { name: 'Khóa Leanbot' })).toBeVisible();
});

test('the lesson list shows lesson 0 and opens it', async ({ page }) => {
  await page.goto('/leanbot');

  const lesson = page.getByRole('link', { name: /Làm quen và kiểm tra Leanbot/ });
  await expect(lesson).toBeVisible();
  await lesson.click();

  await expect(page).toHaveURL(/\/leanbot\/bai-00\/0$/);
  await expect(page.getByRole('heading', { name: 'Học xong bài này con sẽ…' })).toBeVisible();
});

test('a lesson runs from its goals to the quiz and scores it', async ({ page }) => {
  await page.goto('/leanbot/bai-00/0');

  // The page counter names the whole lesson, so the flow below cannot silently skip pages.
  await expect(page.getByText('1 / 33')).toBeVisible();

  await page.getByRole('button', { name: 'Tiếp →' }).click();
  await expect(page).toHaveURL(/\/leanbot\/bai-00\/1$/);
  await expect(page.getByRole('heading', { name: 'Chào Leanbot!' })).toBeVisible();

  // The picture of the robot's back, which always carries its description.
  await page.goto('/leanbot/bai-00/6');
  await expect(page.getByRole('heading', { name: /HAI cổng USB/ })).toBeVisible();
  await expect(page.getByRole('img')).toHaveAttribute('alt', /Mặt sau Leanbot/);

  // The next screen names the trap and offers the tick box.
  await page.goto('/leanbot/bai-00/7');
  await expect(page.getByRole('heading', { name: /Cắm nhầm/ })).toBeVisible();
  await expect(page.getByText('Để NẠP CODE')).toBeVisible();
  await expect(page.getByText('Chỉ để SẠC')).toBeVisible();

  // beforeEach seeds every tick, so clear this one to watch it go from empty to set.
  await page.evaluate(() => {
    localStorage.removeItem('cq.leanbot.check.bai-00.6');
  });
  await page.reload();

  const tick = page.getByRole('button', { name: /Con chỉ đúng hai cổng rồi/ });
  await expect(tick).toHaveAttribute('aria-pressed', 'false');
  await tick.click();
  await expect(tick).toHaveAttribute('aria-pressed', 'true');
  // The tick is a note to self, so it survives leaving the screen and coming back.
  await page.reload();
  await expect(page.getByRole('button', { name: /Con chỉ đúng hai cổng rồi/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // The quiz marks a right answer and explains it.
  await page.goto('/leanbot/bai-00/32');
  await expect(page.getByRole('heading', { name: 'Con nhớ được bao nhiêu?' })).toBeVisible();
  await page.getByRole('button', { name: /Cắm vào cổng nào\?/ }).click();
  await expect(page.getByText(/hai cổng USB sát nhau/)).toBeVisible();
});

test('a lesson id that does not exist says so instead of crashing', async ({ page }) => {
  await page.goto('/leanbot/bai-99/0');
  await expect(page.getByText('Không tìm thấy bài này.')).toBeVisible();
});

test('a page number past the end lands on the last page', async ({ page }) => {
  await page.goto('/leanbot/bai-00/999');
  await expect(page.getByRole('heading', { name: 'Con nhớ được bao nhiêu?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tiếp →' })).toBeDisabled();
});

// Lesson 1 is the first lesson with an outward link (the block editor) and the first whose
// pictures are of the editor rather than the robot.
test('lesson 1 lists, links out to the editor and scores its quiz', async ({ page }) => {
  await page.goto('/leanbot');
  await page.getByRole('link', { name: /Cùng di chuyển/ }).click();
  await expect(page).toHaveURL(/\/leanbot\/bai-01\/0$/);
  await expect(page.getByText('1 / 27')).toBeVisible();

  // The editor screen: its picture carries a description and the link opens in a new tab.
  await page.goto('/leanbot/bai-01/4');
  await expect(page.getByRole('heading', { name: 'Đây là trung tâm chỉ huy' })).toBeVisible();
  await expect(page.getByRole('img')).toHaveAttribute('alt', /Trình soạn khối lệnh/);
  const editor = page.getByRole('link', { name: 'Mở trình soạn khối lệnh (tiếng Việt)' });
  await expect(editor).toHaveAttribute('href', 'https://ide.pythaverse.space/lbeditor/?lang=vi');
  await expect(editor).toHaveAttribute('target', '_blank');

  // The screen after it is how a coach switches the editor to Vietnamese at all.
  await page.goto('/leanbot/bai-01/5');
  await expect(page.getByRole('heading', { name: /Chữ ra tiếng Anh/ })).toBeVisible();
  await expect(page.getByText('https://ide.pythaverse.space/lbeditor/?lang=vi')).toBeVisible();
  await expect(page.getByText(/bánh răng.*KHÔNG đổi ngôn ngữ/)).toBeVisible();

  // The turning screen states which wheel carries the minus sign.
  await page.goto('/leanbot/bai-01/17');
  await expect(page.getByRole('heading', { name: 'Quay sang phải' })).toBeVisible();
  await expect(page.getByText('Trái 50 Phải −50')).toBeVisible();

  // Every lesson ends with how to try it on the robot and what a wrong result means.
  await page.goto('/leanbot/bai-01/24');
  await expect(page.getByRole('heading', { name: /Thử trên robot/ })).toBeVisible();
  await page.goto('/leanbot/bai-01/25');
  await expect(page.getByText('Robot đi cong')).toBeVisible();
  await expect(page.getByRole('button', { name: /robot đi gần đúng 50 cm/ })).toBeVisible();

  await page.goto('/leanbot/bai-01/26');
  await expect(page.getByRole('heading', { name: 'Con nhớ được bao nhiêu?' })).toBeVisible();
  await page.getByRole('button', { name: /^A.*Quay tại chỗ/ }).click();
  await expect(page.getByText(/xoay tại chỗ như con quay/)).toBeVisible();
});

// Lessons 2 and 3: the list must carry every lesson that has a JSON file, and each lesson's
// quiz must score. These two are the first whose screens are pure procedure and warning.
test('lessons 2 and 3 open from the list and score their quizzes', async ({ page }) => {
  await page.goto('/leanbot');
  for (const name of [/Làm quen và kiểm tra Leanbot/, /Cùng di chuyển/, /Cánh tay kẹp/, /Mắt thần siêu âm/]) {
    await expect(page.getByRole('link', { name })).toBeVisible();
  }

  // Lesson 2: the two angles a child keeps swapping, and the safe range.
  await page.getByRole('link', { name: /Cánh tay kẹp/ }).click();
  await expect(page).toHaveURL(/\/leanbot\/bai-02\/0$/);
  await expect(page.getByText('1 / 22')).toBeVisible();

  await page.goto('/leanbot/bai-02/4');
  await expect(page.getByRole('heading', { name: '0 độ là MỞ, 90 độ là ĐÓNG' })).toBeVisible();
  await page.goto('/leanbot/bai-02/5');
  await expect(page.getByText(/càng có thể GÃY/)).toBeVisible();

  await page.goto('/leanbot/bai-02/21');
  await page.getByRole('button', { name: /^A.*0 độ/ }).click();
  await expect(page.getByText(/hai càng chúc xuống đất/)).toBeVisible();

  // Lesson 3: the yo-yo explanation is the point of the lesson.
  await page.goto('/leanbot/bai-03/7');
  await expect(page.getByRole('heading', { name: /5 cm đó gọi là vùng đệm/ })).toBeVisible();
  await page.goto('/leanbot/bai-03/22');
  await page.getByRole('button', { name: /giật tới lui như yo-yo/ }).click();
  await expect(page.getByText(/5 cm chênh là vùng đệm/)).toBeVisible();
});

// The gate (lesson 0 is the setup lesson): until its tick boxes are all set, the later lessons
// are listed but not openable, by click or by URL.
test('lesson 0 gates the rest of the course until its boxes are ticked', async ({ page }) => {
  await page.evaluate(() => {
    for (let i = 0; i < 40; i++) localStorage.removeItem(`cq.leanbot.check.bai-00.${String(i)}`);
  });
  await page.goto('/leanbot');

  await expect(page.getByText(/Bài 0 còn \d+ ô chưa tích/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Làm quen và kiểm tra Leanbot/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Cùng di chuyển/ })).toHaveCount(0);
  await expect(page.getByText('Xong Bài 0 đã nhé!').first()).toBeVisible();

  // A hand-typed URL is refused too, and offers the way back to lesson 0.
  await page.goto('/leanbot/bai-01/4');
  await expect(page.getByRole('button', { name: 'Về Bài 0' })).toBeVisible();

  // Ticking the lot opens everything.
  await unlockLeanbotCourse(page);
  await page.goto('/leanbot');
  await expect(page.getByText('Bài 0 xong! Đủ 9 ô.')).toBeVisible();
  await page.getByRole('link', { name: /Cùng di chuyển/ }).click();
  await expect(page).toHaveURL(/\/leanbot\/bai-01\/0$/);
});
