/** The chip above a Leanbot heading. Screens sharing one read as a single section. */
export function LeanbotEyebrow({ text }: { text: string }) {
  return (
    <span className="justify-self-start rounded-key border-3 border-ink bg-brand-soft px-2 py-0.5 font-display text-sm tracking-wide uppercase">
      {text}
    </span>
  );
}
