import { describe, expect, it } from 'vitest';
import {
  BONUS_LEVEL_PRICE,
  COINS,
  DEFAULT_PAR_EDITS,
  FAILED_RESULTS,
  HINT_PRICES,
  MAX_LEVEL_COINS,
  PREDICT_STARS_BY_ATTEMPT,
  REPLAY_DAILY_CAP,
  SAFETY_NET,
  SHOP_PRICE_RANGES,
  STAR_CAP_AFTER_HINT,
  STREAK_MILESTONE_DAYS,
  TIME_ZONE,
  WORLD_UNLOCK,
} from './index';

// Mirrors docs/product/rewards-economy.md; a failure here means code and doc disagree.
describe('rewards config', () => {
  it('matches the coin sources table (§2)', () => {
    expect(COINS).toEqual({
      starter: 30,
      levelClear: 10,
      star2: 5,
      star3: 5,
      firstTry: 5,
      lesson: 5,
      daily: 10,
      streakMilestone: 50,
      replay: 1,
      creativeFirstSave: 10,
      groupGoal: 20,
    });
    expect(STREAK_MILESTONE_DAYS).toBe(7);
    expect(REPLAY_DAILY_CAP).toBe(5);
  });

  it('caps one level at 25 coins, 35 with the daily bonus', () => {
    expect(COINS.levelClear + COINS.star2 + COINS.star3 + COINS.firstTry).toBe(MAX_LEVEL_COINS);
    expect(MAX_LEVEL_COINS).toBe(25);
    expect(MAX_LEVEL_COINS + COINS.daily).toBe(35);
  });

  it('matches hint prices and the safety net', () => {
    expect(HINT_PRICES).toEqual({ 1: 5, 2: 15, 3: 40 });
    expect(SAFETY_NET).toEqual({
      freeTier1AfterFails: 3,
      discountTier2AfterFails: 6,
      discountedTier2Price: 5,
    });
    expect(FAILED_RESULTS).toEqual(['incomplete', 'crash', 'timeout']);
  });

  it('matches star rules (§1)', () => {
    expect(STAR_CAP_AFTER_HINT).toEqual({ 2: 2, 3: 1 });
    expect(PREDICT_STARS_BY_ATTEMPT).toEqual([3, 2, 1]);
    expect(DEFAULT_PAR_EDITS).toBe(1);
  });

  it('matches shop prices and unlock rules (§2, §3)', () => {
    expect(BONUS_LEVEL_PRICE).toBe(30);
    expect(SHOP_PRICE_RANGES).toEqual({
      skin: { min: 50, max: 200 },
      pen: { min: 30, max: 100 },
      fx: { min: 30, max: 100 },
      music: { min: 30, max: 100 },
    });
    expect(WORLD_UNLOCK).toEqual({
      minStarRatio: 0.6,
      countedStages: ['guided', 'practice', 'boss'],
    });
    expect(TIME_ZONE).toBe('Asia/Ho_Chi_Minh');
  });
});
