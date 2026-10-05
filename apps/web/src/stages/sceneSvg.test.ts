import { describe, expect, it } from 'vitest';
import { SCENE_THEMES } from '@codequest/content-schema';
import { groundTileUrl, mazeTileUrl, pixelDataUrl } from './sceneSvg';

const decode = (url: string): string =>
  decodeURIComponent(url.replace(/^data:image\/svg\+xml,/, ''));

describe('scene SVG tiles (P2-23)', () => {
  it('draws one rect per run of a colour, skipping transparent texels', () => {
    const svg = decode(pixelDataUrl(['aab.', '.bbb'], { a: '#111111', b: '#222222' }));
    expect(svg).toContain('viewBox="0 0 4 2"');
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg.match(/<rect /g)).toHaveLength(3);
    expect(svg).toContain('<rect x="0" y="0" width="2" height="1" fill="#111111"/>');
    expect(svg).toContain('<rect x="1" y="1" width="3" height="1" fill="#222222"/>');
  });

  it('Làng Tre (and no theme) keeps the Kenney tile and the bamboo maze', () => {
    expect(groundTileUrl('lang-tre')).toBeNull();
    expect(groundTileUrl(undefined)).toBeNull();
    expect(mazeTileUrl('lang-tre', 'wall')).toBeNull();
    expect(mazeTileUrl(undefined, 'floor')).toBeNull();
  });

  it.each(SCENE_THEMES.filter((t) => t !== 'lang-tre'))(
    '%s has its own tiles, made once',
    (theme) => {
      const ground = groundTileUrl(theme);
      expect(ground?.startsWith('data:image/svg+xml,')).toBe(true);
      // Only # < > % " are escaped: none of them is left raw, the rest stays readable.
      expect(ground?.slice('data:image/svg+xml,'.length)).not.toMatch(/[#<>"]/);
      expect(ground).toContain('shape-rendering=%22crispEdges%22');
      expect(groundTileUrl(theme)).toBe(ground);
      expect(decode(ground ?? '')).toContain('viewBox="0 0 18 18"');
      const wall = mazeTileUrl(theme, 'wall');
      const floor = mazeTileUrl(theme, 'floor');
      expect(decode(wall ?? '')).toContain('viewBox="0 0 12 12"');
      expect(wall).not.toBe(floor);
    },
  );
});
