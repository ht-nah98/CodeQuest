/**
 * `maxInstances` in the searches (P2-11, curriculum.md §5.4 T16): how many blocks of each
 * limited type a program (or a part of one) uses, as a small vector. Programs that reach the
 * same simulation state with different usage are kept apart (they may continue differently).
 */

/** Blocks used per limited type, in `InstanceLimits.types` order. */
export type Usage = readonly number[];

export class InstanceLimits {
  /** Limited types that a searched program can contain, sorted. */
  readonly types: readonly string[];
  /** Usage of nothing. */
  readonly none: Usage;
  /** Distinct usage vectors within the limits; 1 without limits (keys stay plain state ids). */
  readonly radix: number;
  private readonly max: readonly number[];

  /** Only the types of `relevant` matter: other limited types never appear in a program. */
  constructor(
    maxInstances: Readonly<Record<string, number>> | undefined,
    relevant: ReadonlySet<string>,
  ) {
    const limited = Object.entries(maxInstances ?? {})
      .filter(([type]) => relevant.has(type))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    this.types = limited.map(([type]) => type);
    this.max = limited.map(([, max]) => max);
    this.none = this.types.map(() => 0);
    this.radix = this.max.reduce((product, max) => product * (max + 1), 1);
  }

  /** Usage of one block of `type`. */
  of(type: string): Usage {
    const index = this.types.indexOf(type);
    if (index === -1) return this.none;
    return this.none.map((_, i) => (i === index ? 1 : 0));
  }

  /** `a + b`, or null when that goes over a limit. */
  add(a: Usage, b: Usage): Usage | null {
    if (this.types.length === 0) return a;
    const sum: number[] = [];
    for (let i = 0; i < this.types.length; i++) {
      const total = (a[i] ?? 0) + (b[i] ?? 0);
      if (total > (this.max[i] ?? 0)) return null;
      sum.push(total);
    }
    return sum;
  }

  /** The sum of several usages, or null when it goes over a limit. */
  sum(parts: readonly Usage[]): Usage | null {
    let total: Usage | null = this.none;
    for (const part of parts) {
      if (total === null) return null;
      total = this.add(total, part);
    }
    return total;
  }

  /** A number in [0, radix) that tells usages apart. */
  index(usage: Usage): number {
    let index = 0;
    for (let i = 0; i < this.types.length; i++)
      index = index * ((this.max[i] ?? 0) + 1) + (usage[i] ?? 0);
    return index;
  }

  /** Whether per-type counts (e.g. `programBlockTypes`) are within `maxInstances`. */
  allows(counts: ReadonlyMap<string, number>): boolean {
    return this.types.every((type, i) => (counts.get(type) ?? 0) <= (this.max[i] ?? 0));
  }
}
