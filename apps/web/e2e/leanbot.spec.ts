import { expect, test } from '@playwright/test';
import { signInTestProfile } from './helpers';

// Two courses, one account (ADR-0028): the hub, the Leanbot lesson list, and one lesson from
// its goals page through a screen to the quiz.

test.beforeEach(async ({ page }) => {
  await signInTestProfile(page);
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
  await expect(page.getByText('1 / 21')).toBeVisible();

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
  await page.goto('/leanbot/bai-00/20');
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
  await expect(page.getByText('1 / 24')).toBeVisible();

  // The editor screen: its picture carries a description and the link opens in a new tab.
  await page.goto('/leanbot/bai-01/4');
  await expect(page.getByRole('heading', { name: 'Đây là trung tâm chỉ huy' })).toBeVisible();
  await expect(page.getByRole('img')).toHaveAttribute('alt', /Trình soạn khối lệnh/);
  const editor = page.getByRole('link', { name: 'Mở trình soạn khối lệnh' });
  await expect(editor).toHaveAttribute('href', 'https://ide.pythaverse.space/lbeditor/');
  await expect(editor).toHaveAttribute('target', '_blank');

  // The turning screen states which wheel carries the minus sign.
  await page.goto('/leanbot/bai-01/16');
  await expect(page.getByRole('heading', { name: 'Quay sang phải' })).toBeVisible();
  await expect(page.getByText('Trái 50 Phải −50')).toBeVisible();

  await page.goto('/leanbot/bai-01/23');
  await expect(page.getByRole('heading', { name: 'Con nhớ được bao nhiêu?' })).toBeVisible();
  await page.getByRole('button', { name: /^A.*Quay tại chỗ/ }).click();
  await expect(page.getByText(/xoay tại chỗ như con quay/)).toBeVisible();
});
