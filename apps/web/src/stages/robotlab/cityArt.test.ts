import { describe, expect, it } from 'vitest';
import { THANH_PHO_MANG } from '@codequest/games';
import { patternPixels } from '../maze/pixelArt';
import { cityScenery, type SceneryArt, sceneryArt } from './cityArt';

const ARTS: SceneryArt[] = [
  'hut',
  'bamboo',
  'tree',
  'pond',
  'flowers',
  'marketRed',
  'marketYellow',
  'house0',
  'house1',
  'factory',
  'chimney',
];

describe('city scenery art', () => {
  it.each(ARTS)('%s is a 16×16 pattern with known colours', (name) => {
    const { rows, palette } = sceneryArt(name);
    const image = patternPixels(rows, palette);
    expect([image.width, image.height]).toEqual([16, 16]);
  });

  it('draws the districts of Thành Phố Măng', () => {
    const scenery = cityScenery(THANH_PHO_MANG.map);
    const at = (r: number, c: number) => scenery[r]?.[c];
    expect(at(0, 1)).toEqual({ kind: 'art', art: 'hut', ground: 'grass' });
    expect(at(0, 2)).toEqual({ kind: 'art', art: 'bamboo', ground: 'grass' });
    expect(at(3, 1)).toMatchObject({ art: 'pond' });
    expect(at(2, 2)).toMatchObject({ art: 'flowers' });
    expect(at(0, 4)).toEqual({ kind: 'water' });
    expect(at(1, 4)).toEqual({ kind: 'bridge', across: 'EW' });
    expect(at(5, 4)).toEqual({ kind: 'bridge', across: 'EW' });
    expect(at(1, 6)).toMatchObject({ art: 'marketYellow' });
    expect(at(1, 7)).toMatchObject({ art: 'marketRed' });
    expect(at(5, 6)).toMatchObject({ art: 'factory' });
    expect(at(5, 7)).toMatchObject({ art: 'chimney' });
    // Crossings, the lab, zones and stations keep no scenery: the job spots stay clear.
    expect(at(3, 3)).toEqual({ kind: 'none' });
    expect(at(4, 7)).toEqual({ kind: 'none' });
    expect(at(0, 0)).toEqual({ kind: 'none' });
  });

  it('gives any other map city roofs by position, the same every time', () => {
    const map = ['L#.', '.#.', '#..'];
    const scenery = cityScenery(map);
    expect(scenery[0]?.[1]).toEqual({ kind: 'art', art: 'house1', ground: 'plain' });
    expect(scenery[1]?.[1]).toEqual({ kind: 'art', art: 'house0', ground: 'plain' });
    expect(scenery[2]?.[0]).toEqual({ kind: 'art', art: 'house0', ground: 'plain' });
    expect(cityScenery(map)).toEqual(scenery);
  });
});
