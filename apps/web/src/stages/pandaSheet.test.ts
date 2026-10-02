import { describe, expect, it } from 'vitest';
import sheetJson from '../../public/sprites/panda.json?raw';
import pngDataUrl from '../../public/sprites/panda.png?inline';
import { PANDA_ANIMATIONS, PANDA_FRAME_SIZE } from './panda';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface SheetData {
  frames: Record<
    string,
    {
      frame: Rect;
      spriteSourceSize: Rect;
      sourceSize: { w: number; h: number };
      anchor: { x: number; y: number };
    }
  >;
  animations: Record<string, string[]>;
  meta: { image: string; size: { w: number; h: number } };
}

const sheet = JSON.parse(sheetJson) as SheetData;

/** Width and height from the PNG IHDR chunk. */
function pngSize(dataUrl: string): { w: number; h: number } {
  const bytes = Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1, 200)), (c) =>
    c.charCodeAt(0),
  );
  const view = new DataView(bytes.buffer);
  return { w: view.getUint32(16), h: view.getUint32(20) };
}

describe('public/sprites/panda.json', () => {
  it('has the 16 cleaned frames of Măng', () => {
    expect(Object.keys(sheet.frames)).toHaveLength(16);
  });

  it('defines every animation of stage-rendering.md §3 with existing frames', () => {
    expect(Object.keys(sheet.animations).sort()).toEqual([...PANDA_ANIMATIONS].sort());
    for (const frames of Object.values(sheet.animations)) {
      expect(frames.length).toBeGreaterThan(0);
      for (const frame of frames) expect(sheet.frames).toHaveProperty([frame]);
    }
    expect(sheet.animations.walk).toEqual(['walk_1.png', 'walk_2.png', 'walk_3.png', 'walk_4.png']);
    expect(sheet.animations.run).toHaveLength(4);
    expect(sheet.animations.idle).toEqual(['idle_1.png', 'idle_2.png']);
  });

  it('keeps every frame rect inside the atlas image', () => {
    const size = pngSize(pngDataUrl);
    expect(sheet.meta.image).toBe('panda.png');
    expect(sheet.meta.size).toEqual(size);
    for (const { frame, spriteSourceSize, sourceSize } of Object.values(sheet.frames)) {
      expect(frame.x).toBeGreaterThanOrEqual(0);
      expect(frame.y).toBeGreaterThanOrEqual(0);
      expect(frame.x + frame.w).toBeLessThanOrEqual(size.w);
      expect(frame.y + frame.h).toBeLessThanOrEqual(size.h);
      expect(sourceSize).toEqual({ w: PANDA_FRAME_SIZE, h: PANDA_FRAME_SIZE });
      expect(spriteSourceSize.x + spriteSourceSize.w).toBeLessThanOrEqual(sourceSize.w);
      expect(spriteSourceSize.y + spriteSourceSize.h).toBeLessThanOrEqual(sourceSize.h);
    }
  });

  it('packs frames without overlap', () => {
    const rects = Object.values(sheet.frames).map((f) => f.frame);
    for (const [i, a] of rects.entries()) {
      for (const b of rects.slice(i + 1)) {
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart).toBe(true);
      }
    }
  });

  it('anchors every grounded animation at its feet line', () => {
    // Airborne animations borrow the idle feet line (tools/sprites/pack.py AIRBORNE).
    const airborne = new Set(['jump']);
    const frameOf = (name: string) => {
      const frame = sheet.frames[name];
      if (!frame) throw new Error(`missing frame ${name}`);
      return frame;
    };
    const feetLine = (names: string[]) =>
      Math.max(...names.map((n) => frameOf(n).spriteSourceSize.y + frameOf(n).spriteSourceSize.h));
    const idleAnchor = frameOf('idle_1.png').anchor.y;
    for (const [animation, names] of Object.entries(sheet.animations)) {
      const anchors = new Set(names.map((n) => frameOf(n).anchor.y));
      expect(anchors.size, animation).toBe(1);
      const anchorPx = frameOf(names[0] ?? '').anchor.y * PANDA_FRAME_SIZE;
      if (airborne.has(animation)) {
        expect(frameOf(names[0] ?? '').anchor.y, animation).toBe(idleAnchor);
        expect(feetLine(names), animation).toBeLessThan(anchorPx);
      } else {
        expect(Math.abs(feetLine(names) - anchorPx), animation).toBeLessThanOrEqual(1);
      }
    }
  });
});
