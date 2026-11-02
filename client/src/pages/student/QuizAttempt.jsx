import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Clock, ListChecks, ChevronLeft, ChevronRight, Flag, Send, X, LoaderCircle, Play } from 'lucide-react';
import { useFetch } from '../../lib/useFetch';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Spinner, ErrorBox, Modal, DIFFICULTY, subjectGradient } from '../../components/ui';

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error } = useFetch(`/quizzes/${id}`);
  const quiz = data?.quiz;

  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [flagged, setFlagged] = useState(new Set());
  const [left, setLeft] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef(0);
  const submitted = useRef(false);

  const submit = useCallback(
    async (auto = false) => {
      if (submitted.current) return;
      submitted.current = true;
      setSubmitting(true);
      try {
        const r = await api(`/quizzes/${id}/attempt`, {
          method: 'POST',
          body: { answers, timeTakenSec: Math.round((Date.now() - startedAt.current) / 1000) },
        });
        if (auto) toast("Time's up! Your quiz was submitted automatically.");
        navigate(`/attempts/${r.attempt._id}`, { replace: true, state: { fresh: true } });
      } catch (e) {
        submitted.current = false;
        setSubmitting(false);
        toast(e.message, 'error');
      }
    },
    [answers, id, navigate, toast]
  );

  // Countdown timer
  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [started]);
  useEffect(() => {
    if (started && left === 0) submit(true);
  }, [left, started, submit]);

  // Keyboard shortcuts: 1-4 / A-D choose, arrows navigate
  useEffect(() => {
    if (!started || !quiz) return;
    const onKey = (e) => {
      if (confirm) return;
      const n = quiz.questions[current].options.length;
      const k = e.key.toLowerCase();
      let idx = -1;
      if (/^[1-9]$/.test(k)) idx = Number(k) - 1;
      else if (/^[a-i]$/.test(k)) idx = k.charCodeAt(0) - 97;
      if (idx >= 0 && idx < n) choose(idx);
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(quiz.questions.length - 1, c + 1));
      if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(0, c - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Warn before leaving mid-quiz
  useEffect(() => {
    if (!started) return;
    const h = (e) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [started]);

  if (loading) return <Spinner className="min-h-screen" />;
  if (error) return <div className="p-6"><ErrorBox error={error} /></div>;

  const total = quiz.questions.length;
  const answeredCount = answers.filter((a) => a !== undefined && a !== -1).length;

  function choose(i) {
    setAnswers((a) => {
      const next = [...a];
      next[current] = next[current] === i ? -1 : i;
      return next;
    });
  }

  if (!started)
    return (
      <div className="grid min-h-screen place-items-center p-4">
        <div className="card fade-in w-full max-w-lg overflow-hidden">
          <div className={`bg-gradient-to-r ${subjectGradient(quiz.subject)} p-8 text-white`}>
            <p className="text-sm text-white/80">Class {quiz.className} · {quiz.subject} · {quiz.topic}</p>
            <h1 className="mt-1 text-2xl font-bold">{quiz.title}</h1>
            {quiz.description && <p className="mt-2 text-white/85">{quiz.description}</p>}
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><ListChecks className="mx-auto mb-1 size-5 text-brand-500" /><p className="font-bold">{total}</p><p className="text-xs text-slate-500">Questions</p></div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><Clock className="mx-auto mb-1 size-5 text-brand-500" /><p className="font-bold">{quiz.durationMinutes} min</p><p className="text-xs text-slate-500">Time limit</p></div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><span className={`chip capitalize ${DIFFICULTY[quiz.difficulty]}`}>{quiz.difficulty}</span><p className="mt-2 text-xs text-slate-500">Difficulty</p></div>
            </div>
            <ul className="mt-5 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
              <li>• The quiz auto-submits when the timer reaches zero.</li>
              <li>• You can flag questions and come back to them.</li>
              <li>• Tip: use keys <kbd className="rounded bg-slate-100 px-1.5 dark:bg-slate-800">1–4</kbd> to answer and <kbd className="rounded bg-slate-100 px-1.5 dark:bg-slate-800">← →</kbd> to move.</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Link to="/quizzes" className="btn-secondary flex-1">Back</Link>
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  setAnswers(Array(total).fill(-1));
                  setLeft(quiz.durationMinutes * 60);
                  startedAt.current = Date.now();
                  setStarted(true);
                }}
              >
                <Play className="size-4" /> Start quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  const q = quiz.questions[current];
  const lowTime = left <= 30;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <button onClick={() => setConfirm('exit')} className="btn-ghost p-2" aria-label="Exit quiz"><X className="size-5" /></button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{quiz.title}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(answeredCount / total) * 100}%` }} />
            </div>
          </div>
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-lg font-bold tabular-nums ${lowTime ? 'animate-pulse bg-rose-100 text-rose-600 dark:bg-rose-500/15' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <Clock className="size-4" /> {fmt(left)}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-[1fr_220px]">
        <div key={current} className="fade-in">
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">Question {current + 1} of {total}</p>
          <h2 className="mt-2 text-xl leading-snug font-semibold sm:text-2xl">{q.text}</h2>
          <div className="mt-6 space-y-3">
            {q.options.map((o, i) => {
              const sel = answers[current] === i;
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
                    sel ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                  }`}
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${sel ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-medium">{o}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className="btn-secondary" disabled={current === 0} onClick={() => setCurrent(current - 1)}><ChevronLeft className="size-4" /> Previous</button>
            <button
              className={`btn ${flagged.has(current) ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'btn-ghost'}`}
              onClick={() => setFlagged((f) => { const n = new Set(f); n.has(current) ? n.delete(current) : n.add(current); return n; })}
            >
              <Flag className="size-4" /> {flagged.has(current) ? 'Flagged' : 'Flag for review'}
            </button>
            <div className="ml-auto">
              {current < total - 1 ? (
                <button className="btn-primary" onClick={() => setCurrent(current + 1)}>Next <ChevronRight className="size-4" /></button>
              ) : (
                <button className="btn-primary" onClick={() => setConfirm('submit')}><Send className="size-4" /> Submit</button>
              )}
            </div>
          </div>
        </div>

        <aside className="card h-fit p-4 md:sticky md:top-24">
          <p className="mb-3 text-sm font-semibold">Question palette</p>
          <div className="flex flex-wrap gap-2 md:grid md:grid-cols-5">
            {quiz.questions.map((_, i) => {
              const done = answers[i] !== -1 && answers[i] !== undefined;
              return (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`relative grid size-10 place-items-center rounded-lg md:size-auto md:aspect-square text-sm font-semibold transition ${
                    i === current ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                  } ${done ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {i + 1}
                  {flagged.has(i) && <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-amber-400" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1 text-xs text-slate-500">
            <p><span className="mr-1.5 inline-block size-2.5 rounded bg-brand-600" />Answered ({answeredCount})</p>
            <p><span className="mr-1.5 inline-block size-2.5 rounded bg-slate-200 dark:bg-slate-700" />Not answered ({total - answeredCount})</p>
            <p><span className="mr-1.5 inline-block size-2.5 rounded-full bg-amber-400" />Flagged ({flagged.size})</p>
          </div>
          <button className="btn-primary mt-4 w-full" onClick={() => setConfirm('submit')}><Send className="size-4" /> Submit quiz</button>
        </aside>
      </main>

      <Modal open={Boolean(confirm)} onClose={() => !submitting && setConfirm(false)} title={confirm === 'exit' ? 'Leave this quiz?' : 'Submit your answers?'}>
        {confirm === 'exit' ? (
          <p className="text-slate-600 dark:text-slate-400">Your progress in this attempt will be lost.</p>
        ) : (
          <div className="space-y-2 text-slate-600 dark:text-slate-400">
            <p>You have answered <b className="text-slate-900 dark:text-white">{answeredCount}</b> of {total} questions.</p>
            {total - answeredCount > 0 && <p className="text-amber-600">{total - answeredCount} unanswered question(s) will be marked as skipped.</p>}
            {flagged.size > 0 && <p className="text-amber-600">{flagged.size} question(s) are flagged for review.</p>}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" disabled={submitting} onClick={() => setConfirm(false)}>Keep going</button>
          {confirm === 'exit' ? (
            <button className="btn-danger" onClick={() => navigate('/quizzes')}>Leave quiz</button>
          ) : (
            <button className="btn-primary" disabled={submitting} onClick={() => submit(false)}>
              {submitting && <LoaderCircle className="size-4 animate-spin" />} Submit
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}
