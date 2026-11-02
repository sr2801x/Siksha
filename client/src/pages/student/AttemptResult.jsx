import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { CircleCheck, CircleX, CircleMinus, RotateCcw, Clock, Lightbulb, ArrowLeft, LibraryBig } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../lib/useFetch';
import { Spinner, ErrorBox, ScoreRing, fmtDuration } from '../../components/ui';

function Confetti() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  const colors = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#0ea5e9'];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <style>{`@keyframes fall{to{transform:translateY(110vh) rotate(720deg)}}`}</style>
      {Array.from({ length: 70 }).map((_, i) => (
        <span
          key={i}
          className="absolute -top-4 block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animation: `fall ${2 + (i % 5) * 0.4}s ${(i % 10) * 0.08}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

const message = (p) =>
  p === 100 ? 'Perfect score! Outstanding 🌟' : p >= 80 ? 'Excellent work! 🎉' : p >= 60 ? 'Good job — a little more practice! 💪' : 'Keep practising, you will get there! 📚';

export default function AttemptResult() {
  const { id } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(`/progress/attempts/${id}`);
  const [filter, setFilter] = useState('all');

  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const { attempt, feedback } = data;
  const correct = feedback.filter((f) => f.isCorrect).length;
  const skipped = feedback.filter((f) => f.selected === -1).length;
  const wrong = feedback.length - correct - skipped;
  const shown = feedback
    .map((f, i) => ({ ...f, n: i + 1 }))
    .filter((f) => (filter === 'all' ? true : filter === 'correct' ? f.isCorrect : filter === 'wrong' ? !f.isCorrect && f.selected !== -1 : f.selected === -1));

  return (
    <div className="fade-in mx-auto max-w-4xl space-y-6">
      {state?.fresh && attempt.percentage >= 80 && <Confetti />}
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2"><ArrowLeft className="size-4" /> Back</button>

      <div className="card overflow-hidden">
        <div className="grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
          <div className="relative mx-auto">
            <ScoreRing value={attempt.percentage} size={150} />
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-3xl font-extrabold">{attempt.percentage}%</p>
                <p className="text-xs text-slate-500">{attempt.score}/{attempt.total}</p>
              </div>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm text-slate-500">{attempt.subject} · {attempt.topic}</p>
            <h1 className="text-2xl font-bold">{attempt.quizTitle}</h1>
            <p className="mt-1 text-lg">{message(attempt.percentage)}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
              <span className="chip bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><CircleCheck className="size-3.5" /> {correct} correct</span>
              <span className="chip bg-rose-100 px-3 py-1 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"><CircleX className="size-3.5" /> {wrong} wrong</span>
              <span className="chip bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><CircleMinus className="size-3.5" /> {skipped} skipped</span>
              <span className="chip bg-sky-100 px-3 py-1 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"><Clock className="size-3.5" /> {fmtDuration(attempt.timeTakenSec || 0)}</span>
            </div>
            {user.role === 'student' && attempt.quiz && (
              <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Link to={`/quiz/${attempt.quiz._id}`} className="btn-primary"><RotateCcw className="size-4" /> Retake quiz</Link>
                <Link to={`/library?${new URLSearchParams({ className: attempt.className, subject: attempt.subject, topic: attempt.topic })}`} className="btn-secondary">
                  <LibraryBig className="size-4" /> Revise topic
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Answer review</h2>
        <div className="flex rounded-xl border border-slate-300 p-1 text-sm dark:border-slate-700">
          {[['all', 'All'], ['correct', 'Correct'], ['wrong', 'Wrong'], ['skipped', 'Skipped']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`rounded-lg px-3 py-1 font-medium ${filter === v ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {shown.map((f) => (
          <div key={f.n} className={`card border-l-4 p-5 ${f.isCorrect ? 'border-l-emerald-500' : f.selected === -1 ? 'border-l-slate-300' : 'border-l-rose-500'}`}>
            <div className="flex items-start gap-3">
              {f.isCorrect ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-500" /> : f.selected === -1 ? <CircleMinus className="mt-0.5 size-5 shrink-0 text-slate-400" /> : <CircleX className="mt-0.5 size-5 shrink-0 text-rose-500" />}
              <p className="font-semibold"><span className="text-slate-400">Q{f.n}.</span> {f.question}</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {f.options.map((o, i) => {
                const isAns = i === f.correctIndex;
                const isSel = i === f.selected;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      isAns ? 'border-emerald-300 bg-emerald-50 font-medium text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : isSel ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span className="font-bold">{String.fromCharCode(65 + i)}.</span> {o}
                    {isAns && <span className="ml-auto text-xs">Correct answer</span>}
                    {isSel && !isAns && <span className="ml-auto text-xs">Your answer</span>}
                  </div>
                );
              })}
            </div>
            {f.explanation && (
              <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <Lightbulb className="size-4 shrink-0" /> {f.explanation}
              </p>
            )}
          </div>
        ))}
        {!shown.length && <p className="py-8 text-center text-sm text-slate-500">Nothing in this filter.</p>}
      </div>
    </div>
  );
}
