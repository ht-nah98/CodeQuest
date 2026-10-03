import sheetJson from 'virtual:panda-sheet';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Sheet {
  frames: Record<string, { frame: Rect }>;
  meta: { size: { w: number; h: number } };
}

const sheet = JSON.parse(sheetJson) as Sheet;

export type PortraitPose = 'idle_1' | 'talk' | 'happy' | 'cheer' | 'jump';

/** Măng's face next to the bubble: one frame of the spritesheet, cropped with CSS. */
export function MangPortrait({ pose, height = 60 }: { pose: PortraitPose; height?: number }) {
  const frame = sheet.frames[`${pose}.png`]?.frame ?? sheet.frames['idle_1.png']?.frame;
  if (!frame) return null;
  const scale = height / frame.h;
  return (
    <span
      aria-hidden="true"
      data-pose={pose}
      className="inline-block shrink-0 bg-no-repeat"
      style={{
        width: Math.round(frame.w * scale),
        height,
        backgroundImage: 'url(/sprites/panda.png)',
        backgroundSize: `${String(sheet.meta.size.w * scale)}px ${String(sheet.meta.size.h * scale)}px`,
        backgroundPosition: `${String(-frame.x * scale)}px ${String(-frame.y * scale)}px`,
      }}
    />
  );
}
