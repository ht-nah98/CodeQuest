import { describe, expect, it } from 'vitest';
import type { WorkspaceJson } from '@codequest/content-schema';
import { authorWorkspaceJson } from './authorExport';

describe('authorWorkspaceJson', () => {
  it('replaces Blockly ids with stable path ids and keeps only top-level positions', () => {
    const json = {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'cq_start',
            id: 'a#/{random',
            x: 40,
            y: 40,
            next: {
              block: {
                type: 'cq_repeat',
                id: 'b`2',
                x: 3,
                y: 9,
                fields: { TIMES: 2 },
                inputs: { DO: { block: { type: 'runner_walk', id: 'c\\3' } } },
              },
            },
          },
        ],
      },
    } as unknown as WorkspaceJson;
    const out = authorWorkspaceJson(json);
    const ids: string[] = [];
    JSON.stringify(out, (key, value: unknown) => {
      if (key === 'id' && typeof value === 'string') ids.push(value);
      return value;
    });
    expect(ids.every((id) => /^[A-Za-z0-9_\-.:]+$/.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(3);
    const text = JSON.stringify(out);
    expect(text).toContain('"x":40');
    expect(text).not.toContain('"x":3');
    // Same program, same ids.
    expect(authorWorkspaceJson(json)).toEqual(out);
  });

  it('drops Blockly disabled marks so content never ships a dead block (P2-07 review)', () => {
    const json = {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'cq_start', id: 'start', x: 40, y: 40 },
          { type: 'runner_walk', id: 'w', x: 300, y: 40, disabledReasons: ['ORPHANED_BLOCK'] },
          { type: 'runner_jump', id: 'j', x: 300, y: 99, enabled: false },
        ],
      },
    } as unknown as WorkspaceJson;
    const text = JSON.stringify(authorWorkspaceJson(json));
    expect(text).not.toContain('disabledReasons');
    expect(text).not.toContain('enabled');
  });

  it('can keep ids that are already content-safe and unique', () => {
    const json = {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'cq_start',
            id: 'start',
            next: {
              block: {
                type: 'runner_walk',
                id: 'walk1',
                next: {
                  block: {
                    type: 'runner_walk',
                    id: 'walk1',
                    next: { block: { type: 'runner_jump', id: 'a#b' } },
                  },
                },
              },
            },
          },
        ],
      },
    } as unknown as WorkspaceJson;
    const ids: string[] = [];
    JSON.stringify(authorWorkspaceJson(json, { keepContentIds: true }), (key, value: unknown) => {
      if (key === 'id' && typeof value === 'string') ids.push(value);
      return value;
    });
    expect(ids.slice(0, 2)).toEqual(['start', 'walk1']);
    expect(new Set(ids).size).toBe(4);
    expect(ids.every((id) => /^[A-Za-z0-9_\-.:]+$/.test(id))).toBe(true);
  });
});
