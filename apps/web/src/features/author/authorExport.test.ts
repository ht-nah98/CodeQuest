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
});
