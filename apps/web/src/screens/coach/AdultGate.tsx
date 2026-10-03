import { type ReactNode, type SyntheticEvent, useState } from 'react';
import { Link } from 'react-router';
import {
  isGateAnswer,
  isGateOpen,
  makeChallenge,
  rememberGateOpen,
} from '../../features/coach/adultGate';
import { vi } from '../../i18n/vi';
import { Button, Panel } from '../../ui';

const t = vi.coachGate;

/** Shows `children` once an adult solved the multiplication (once per tab). */
export function AdultGate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(isGateOpen);
  // UI only (not simulation): any randomness is fine for a speed bump.
  const [challenge] = useState(() => makeChallenge(Math.random));
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  if (open) return children;

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isGateAnswer(challenge, answer)) {
      rememberGateOpen();
      setOpen(true);
    } else {
      setWrong(true);
      setAnswer('');
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-ground p-6">
      <Panel as="section" className="grid w-[420px] gap-4 p-8" data-testid="coach-gate">
        <h1 className="m-0 text-title">{t.title}</h1>
        <p className="m-0 text-ink-soft">{t.help}</p>
        <form onSubmit={submit} className="grid gap-3" noValidate>
          <label className="grid gap-2">
            <span
              className="font-pixel text-pixel-lg"
              data-testid="coach-gate-question"
              data-a={challenge.a}
              data-b={challenge.b}
            >
              {t.question(challenge.a, challenge.b)}
            </span>
            <span className="sr-only">{t.answerLabel}</span>
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="off"
              value={answer}
              aria-invalid={wrong}
              onChange={(event) => {
                setAnswer(event.target.value);
              }}
              className="h-14 rounded-button border-3 border-ink bg-white px-4 font-display text-[26px] font-extrabold shadow-key outline-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand-deep"
            />
          </label>
          <p role="alert" className="m-0 min-h-6 font-bold text-oops">
            {wrong ? t.wrong : ''}
          </p>
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="font-display font-bold text-ink">
              {t.back}
            </Link>
            <Button type="submit" variant="go" size="md">
              {t.open}
            </Button>
          </div>
        </form>
      </Panel>
    </main>
  );
}
