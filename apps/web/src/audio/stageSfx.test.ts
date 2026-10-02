import { describe, expect, it } from 'vitest';
import { blocklySfx, stageSfx } from './stageSfx';
import {
  feedbackVoiceId,
  hintVoiceId,
  lessonCardVoiceId,
  levelVoiceId,
  uiVoiceId,
} from './voiceIds';

describe('stageSfx', () => {
  it('maps runner and maze events to effects', () => {
    expect(stageSfx('jump')).toBe('jump');
    expect(stageSfx('fall')).toBe('fall');
    expect(stageSfx('bump')).toBe('bump');
    expect(stageSfx('collect')).toBe('collect');
    expect(stageSfx('win')).toBe('win');
    expect(stageSfx('move')).toBe('step');
  });

  it('is silent for unknown events (and inherited object keys)', () => {
    expect(stageSfx('teleport')).toBeNull();
    expect(stageSfx('toString')).toBeNull();
  });
});

describe('blocklySfx', () => {
  it('snaps on connect, drops on a loose drop or delete', () => {
    expect(blocklySfx({ type: 'move', reason: ['drag', 'connect'], newParentId: 'a' })).toBe(
      'snap',
    );
    expect(blocklySfx({ type: 'move', reason: ['drag'] })).toBe('drop');
    expect(blocklySfx({ type: 'delete' })).toBe('drop');
    expect(blocklySfx({ type: 'change' })).toBeNull();
  });
});

describe('voice ids (content-model.md §2 examples)', () => {
  it('match the documented patterns', () => {
    expect(levelVoiceId('w01-l03', 'objective')).toBe('w01-l03.objective');
    expect(levelVoiceId('w01-l03', 'thinking')).toBe('w01-l03.thinking');
    expect(hintVoiceId('w01-l03', 'jump-new')).toBe('w01-l03.hint.jump-new');
    expect(lessonCardVoiceId('w01-lesson', 0)).toBe('w01-lesson.c1');
    expect(lessonCardVoiceId('w01-lesson', 5, true)).toBe('w01-lesson.c6.explain');
    expect(feedbackVoiceId('FELL_IN_HOLE')).toBe('feedback.FELL_IN_HOLE');
    expect(feedbackVoiceId('FELL_IN_HOLE', 'w01-l03')).toBe('w01-l03.feedback.FELL_IN_HOLE');
    expect(uiVoiceId('results.stars3')).toBe('ui.results.stars3');
  });
});
