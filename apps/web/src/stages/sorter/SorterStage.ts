import { type Application, Container, Graphics, Text, type Ticker } from 'pixi.js';
import type { SceneTheme } from '@codequest/content-schema';
import type { SorterConfig, SorterEvent } from '@codequest/games';
import { vi } from '../../i18n/vi';
import { UI_COLORS as C } from '../../ui/tokens';
import { shade } from '../colors';
import { reducedMotion } from '../motion';
import { sceneArt } from '../sceneThemes';
import { isAborted, type StageRenderer, tween } from '../types';
import {
  applyEvent,
  bookHeight,
  HUD_BAND,
  layoutShelf,
  PLANK_PX,
  type ShelfLayout,
  type ShelfState,
  startState,
} from './layout';

/** Durations at speed 1, in ms. */
const MS = {
  move: 380,
  toStart: 520,
  swapLift: 240,
  swapAcross: 420,
  ask: 420,
  bump: 300,
} as const;

const HUD_FONT = { fontFamily: 'VT323', fontSize: 24, fill: C.ink } as const;
const SPINE_FONT = { fontFamily: 'VT323', fontSize: 34, fill: C.ink } as const;
const CHIP_PAD = 6;
const CHIP_GAP = 8;
/** How far a book lifts off the plank before crossing over its neighbour, in px. */
const SWAP_LIFT = 26;

/** Spine colours by number, so two books with the same number look the same. */
const SPINES = [C.brand, C.go, C.coin, C.sky, C.oops] as const;

/** Whether text can be drawn (a browser with a canvas); unit tests run the stage on Node. */
function canDrawText(): boolean {
  return typeof document !== 'undefined';
}

/** Ease in and out, so a step starts and stops gently. */
function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

interface BookArt {
  box: Graphics;
  label: Text | null;
  /** Which place on the shelf this piece of art shows (1…n). */
  place: number;
  /** Offsets while a swap plays, in px: sideways towards the other book, and up off the plank. */
  shiftX: number;
  lift: number;
}

/**
 * Bookshelf stage (ADR-0025): a row of numbered books, a hand that steps right or jumps back to
 * the first book, and two books that change places. A question lights the book (or the pair) it
 * asks about, and the HUD counts the questions left and the swaps done, because those two numbers
 * are what a shelf level's stars are about.
 */
export class SorterStage implements StageRenderer<SorterEvent> {
  private readonly world = new Container();
  private readonly shelf = new Container();
  private readonly plank = new Graphics();
  private readonly flag = new Graphics();
  private readonly hand = new Graphics();
  private readonly glow = new Graphics();
  private readonly hud = new Container();
  private readonly chips = new Graphics();
  private questionText: Text | null = null;
  private swapText: Text | null = null;
  private books: BookArt[] = [];
  private labels: Text[] = [];
  private layout: ShelfLayout;
  private state: ShelfState;
  /** Where the hand is drawn (fractional while it travels). */
  private handPlace = 1;
  private destroyed = false;

  constructor(
    private readonly app: Application,
    private readonly config: SorterConfig,
    private readonly theme?: SceneTheme,
  ) {
    this.state = startState(config);
    this.layout = layoutShelf(this.state.books, app.screen.width, app.screen.height);
    this.hud.addChild(this.chips);
    this.world.addChild(this.plank, this.glow, this.shelf, this.flag, this.hand, this.hud);
    app.stage.addChild(this.world);
    this.build();
    this.draw();
  }

  // ---- building ---------------------------------------------------------------------------

  private build(): void {
    this.shelf.removeChildren();
    this.books = [];
    this.labels = [];
    for (const [i, number] of this.state.books.entries()) {
      const box = new Graphics();
      const label = canDrawText() ? new Text({ text: String(number), style: SPINE_FONT }) : null;
      this.shelf.addChild(box);
      if (label) {
        label.anchor.set(0.5, 0.5);
        this.labels.push(label);
        this.shelf.addChild(label);
      }
      this.books.push({ box, label, place: i + 1, shiftX: 0, lift: 0 });
    }
    if (canDrawText()) {
      this.questionText = new Text({ text: '', style: HUD_FONT });
      this.swapText = new Text({ text: '', style: HUD_FONT });
      this.hud.addChild(this.questionText, this.swapText);
    }
  }

  // ---- drawing ----------------------------------------------------------------------------

  private spineOf(number: number): string {
    return SPINES[(number - 1) % SPINES.length] ?? C.brand;
  }

  /** One pass over the current state: nothing on this stage animates by itself. */
  private draw(): void {
    if (this.destroyed) return;
    const l = this.layout;

    this.plank
      .clear()
      .rect(l.plankX - 10, l.plankY, l.plankWidth + 20, PLANK_PX)
      .fill(shade(sceneArt(this.theme).near.main, 0.8))
      .rect(l.plankX - 10, l.plankY + PLANK_PX, l.plankWidth + 20, 4)
      .fill(C.ink);

    this.glow.clear();
    for (const place of this.state.asking) {
      const slot = l.books[place - 1];
      const number = this.state.books[place - 1];
      if (!slot || number === undefined) continue;
      const tall = bookHeight(number, l.tallest);
      this.glow
        .roundRect(slot.x - 7, l.plankY - tall - 7, slot.width + 14, tall + 14, 10)
        .fill({ color: C.coin, alpha: 0.5 });
    }

    for (const [i, art] of this.books.entries()) {
      const slot = l.books[art.place - 1];
      const number = this.state.books[art.place - 1];
      if (!slot || number === undefined) continue;
      const tall = bookHeight(number, l.tallest);
      const x = slot.x + art.shiftX;
      const y = l.plankY - tall - art.lift;
      art.box
        .clear()
        .roundRect(x, y, slot.width, tall, 6)
        .fill(this.spineOf(number))
        .roundRect(x, y, slot.width, tall, 6)
        .stroke({ color: C.ink, width: 3 })
        // Two bands near the top, so a book still reads as a book at a glance.
        .rect(x + 6, y + 14, slot.width - 12, 4)
        .fill({ color: C.paper, alpha: 0.75 })
        .rect(x + 6, y + 24, slot.width - 12, 4)
        .fill({ color: C.paper, alpha: 0.75 });
      const label = this.labels[i];
      if (label) {
        label.text = String(number);
        label.position.set(x + slot.width / 2, y + tall / 2 + 8);
      }
    }

    this.drawFlag();
    this.drawHand();
    this.drawHud();
    this.publish();
  }

  /**
   * What the shelf shows, on the canvas element, so e2e can read the books and the hand without
   * looking at pixels (the maze publishes its counters the same way).
   */
  private publish(): void {
    const data = this.app.canvas.dataset;
    data.shelf = this.state.books.join(',');
    data.shelfHand = String(this.state.hand);
    data.shelfSwaps = String(this.state.swaps);
    data.shelfQuestions = this.state.questionsLeft === null ? '' : String(this.state.questionsLeft);
    data.shelfAsking = this.state.asking.join(',');
  }

  /** The flag one place past the last book: where `hết kệ?` is true. */
  private drawFlag(): void {
    const { flagX, plankY } = this.layout;
    this.flag
      .clear()
      .rect(flagX - 3, plankY - 96, 6, 96)
      .fill(C.inkSoft)
      .poly([flagX + 3, plankY - 96, flagX + 46, plankY - 82, flagX + 3, plankY - 68])
      .fill(C.go)
      .poly([flagX + 3, plankY - 96, flagX + 46, plankY - 82, flagX + 3, plankY - 68])
      .stroke({ color: C.ink, width: 3 });
  }

  /** A chunky pointer hanging over the place the hand is at. */
  private drawHand(): void {
    const { places, handY } = this.layout;
    const last = places.length - 1;
    const at = Math.min(Math.max(this.handPlace - 1, 0), last);
    const left = places[0] ?? 0;
    const right = places[last] ?? left;
    const x = last === 0 ? left : left + ((right - left) * at) / last;
    this.hand
      .clear()
      .roundRect(x - 26, handY - 34, 52, 34, 8)
      .fill(C.paper)
      .roundRect(x - 26, handY - 34, 52, 34, 8)
      .stroke({ color: C.ink, width: 3 })
      .poly([x - 12, handY, x + 12, handY, x, handY + 22])
      .fill(C.brand)
      .poly([x - 12, handY, x + 12, handY, x, handY + 22])
      .stroke({ color: C.ink, width: 3 });
  }

  private drawHud(): void {
    const t = vi.play.sorter;
    this.chips.clear();
    if (!this.questionText || !this.swapText) return;
    this.questionText.text =
      this.state.questionsLeft === null ? '' : t.questionsLeft(this.state.questionsLeft);
    this.swapText.text = t.swaps(this.state.swaps);

    let x = 12;
    for (const text of [this.questionText, this.swapText]) {
      text.visible = text.text !== '';
      if (!text.visible) continue;
      const w = text.width + CHIP_PAD * 2;
      const h = HUD_FONT.fontSize + CHIP_PAD * 2;
      const y = Math.round((HUD_BAND - h) / 2);
      this.chips
        .roundRect(x, y, w, h, 8)
        .fill(C.paper)
        .roundRect(x, y, w, h, 8)
        .stroke({ color: C.ink, width: 3 });
      text.position.set(x + CHIP_PAD, y + CHIP_PAD);
      x += w + CHIP_GAP;
    }
  }

  // ---- replay -----------------------------------------------------------------------------

  private get ticker(): Ticker {
    return this.app.ticker;
  }

  estimate(event: SorterEvent): number {
    switch (event.type) {
      case 'move':
        return Math.abs(event.to - event.from) > 1 ? MS.toStart : MS.move;
      case 'swap':
        return MS.swapLift + MS.swapAcross;
      case 'ask':
        return MS.ask;
      case 'offShelf':
      case 'noBookRight':
      case 'outOfQuestions':
        return MS.bump;
    }
  }

  async play(event: SorterEvent, signal: AbortSignal): Promise<void> {
    if (this.destroyed) return;
    const still = reducedMotion();
    switch (event.type) {
      case 'move':
        await this.playMove(event.to, this.estimate(event), signal, still);
        break;
      case 'swap':
        await this.playSwap(event.at, signal, still);
        break;
      case 'ask':
        if (!still) await tween(this.ticker, MS.ask, signal);
        break;
      case 'offShelf':
      case 'noBookRight':
      case 'outOfQuestions':
        await this.playBump(event.at, signal, still);
        break;
    }
    // "Làm lại" aborts mid-event. The shelf is about to be reset, so the event must not land:
    // applying it here left the hand one place along after the reset had already put it back.
    if (isAborted(signal)) return;
    this.state = applyEvent(this.state, event);
    this.draw();
  }

  private async playMove(
    to: number,
    duration: number,
    signal: AbortSignal,
    still: boolean,
  ): Promise<void> {
    const from = this.handPlace;
    if (!still) {
      await tween(this.ticker, duration, signal, (p) => {
        this.handPlace = from + (to - from) * ease(p);
        this.drawHand();
      });
    }
    this.handPlace = to;
    this.drawHand();
  }

  private async playSwap(at: number, signal: AbortSignal, still: boolean): Promise<void> {
    const left = this.books.find((b) => b.place === at);
    const right = this.books.find((b) => b.place === at + 1);
    if (left && right && !still) {
      await tween(this.ticker, MS.swapLift, signal, (p) => {
        left.lift = SWAP_LIFT * p;
        right.lift = SWAP_LIFT * p;
        this.draw();
      });
      if (!isAborted(signal)) {
        // The books cross over each other; the shelf's numbers only change once the swap is over,
        // so what a child reads never flickers halfway through.
        await tween(this.ticker, MS.swapAcross, signal, (p) => {
          const shift = this.layout.slot * ease(p);
          left.shiftX = shift;
          right.shiftX = -shift;
          this.draw();
        });
      }
    }
    for (const book of this.books) {
      book.shiftX = 0;
      book.lift = 0;
    }
    // The two pieces of art trade places, so each keeps the spine it was drawn with.
    if (left && right) {
      left.place = at + 1;
      right.place = at;
    }
  }

  private async playBump(at: number, signal: AbortSignal, still: boolean): Promise<void> {
    if (!still) {
      await tween(this.ticker, MS.bump, signal, (p) => {
        this.handPlace = at + Math.sin(p * Math.PI * 3) * 0.12;
        this.drawHand();
      });
    }
    this.handPlace = at;
    this.drawHand();
  }

  reset(): void {
    this.state = startState(this.config);
    this.handPlace = 1;
    for (const [i, book] of this.books.entries()) {
      book.place = i + 1;
      book.shiftX = 0;
      book.lift = 0;
    }
    this.draw();
  }

  rest(): void {
    this.draw();
  }

  hold(): void {
    // The shelf is already a still picture between blocks; nothing to freeze.
  }

  resize(width: number, height: number): void {
    this.layout = layoutShelf(this.state.books, width, height);
    this.draw();
  }

  destroy(): void {
    this.destroyed = true;
    this.world.destroy({ children: true });
  }
}
