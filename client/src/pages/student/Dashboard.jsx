import { Link, useNavigate } from 'react-router-dom';
import { Target, Trophy, Flame, BookOpenCheck, ArrowRight, TriangleAlert, ClipboardList, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../lib/useFetch';
import { qs } from '../../lib/api';
import { StatCard, Spinner, ErrorBox, ProgressBar, scoreColor, timeAgo, EmptyState } from '../../components/ui';
import { ScoreTrend, AverageBars } from '../../components/Charts';
import { ResourceCard, QuizCard } from '../../components/Cards';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const progress = useFetch('/progress/me');
  const latest = useFetch(`/resources${qs({ className: user.className, sort: 'popular' })}`);
  const quizzes = useFetch(`/quizzes${qs({ className: user.className })}`);

  if (progress.loading) return <Spinner />;
  if (progress.error) return <ErrorBox error={progress.error} onRetry={progress.reload} />;
  const { stats, timeline, bySubject, weakTopics } = progress.data;
  const pending = (quizzes.data?.items || []).filter((q) => !q.attemptCount).slice(0, 3);
  const completed = new Set((user.completed || []).map(String));
  const bookmarks = new Set((user.bookmarks || []).map(String));
  const continueItems = (latest.data?.items || []).filter((r) => !completed.has(r._id)).slice(0, 3);
  const completionPct = stats.totalResources ? Math.round((stats.resourcesCompleted / stats.totalResources) * 100) : 0;

  return (
    <div className="fade-in space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-violet-600 p-6 text-white sm:p-8">
        <div className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10" />
        <div className="absolute right-24 -bottom-20 size-40 rounded-full bg-white/5" />
        <p className="relative text-white/80">{greeting()},</p>
        <h1 className="relative text-3xl font-bold">{user.name.split(' ')[0]} 👋</h1>
        <p className="relative mt-2 max-w-xl text-white/85">
          {stats.attempts
            ? `You've completed ${stats.quizzesTaken} of ${stats.totalQuizzes} Class ${user.className} quizzes with an average of ${stats.averageScore}%.`
            : `Welcome to Siksha! Start with a topic from your Class ${user.className} library.`}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <Link to="/library" className="btn bg-white text-brand-700 hover:bg-white/90">Continue learning <ArrowRight className="size-4" /></Link>
          <Link to="/quizzes" className="btn bg-white/15 text-white hover:bg-white/25">Take a quiz</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Target} label="Average score" value={`${stats.averageScore}%`} hint={`${stats.attempts} attempts`} />
        <StatCard icon={Trophy} label="Best score" value={`${stats.bestScore}%`} tone="amber" />
        <StatCard icon={Flame} label="Study streak" value={`${stats.streak} day${stats.streak === 1 ? '' : 's'}`} tone="rose" hint="Quiz daily to grow it" />
        <StatCard icon={BookOpenCheck} label="Resources done" value={`${stats.resourcesCompleted}/${stats.totalResources}`} tone="green" hint={`${completionPct}% of your class library`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Score trend</h2>
            <Link to="/progress" className="text-sm font-semibold text-brand-600 dark:text-brand-400">Full report →</Link>
          </div>
          {timeline.length ? <ScoreTrend data={timeline.slice(-10)} /> : <p className="py-16 text-center text-sm text-slate-500">Take a quiz to see your trend.</p>}
        </div>
        <div className="card p-5">
          <h2 className="mb-2 font-semibold">By subject</h2>
          {bySubject.length ? <AverageBars data={bySubject} height={240} /> : <p className="py-16 text-center text-sm text-slate-500">No data yet.</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="mb-1 flex items-center gap-2 font-semibold"><TriangleAlert className="size-4 text-amber-500" /> Needs practice</h2>
          <p className="mb-4 text-sm text-slate-500">Topics where your average is below 60%.</p>
          {weakTopics.length ? (
            <div className="space-y-4">
              {weakTopics.map((t) => (
                <div key={t.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <Link to={`/library?${new URLSearchParams({ className: user.className, subject: t.subject || '', topic: t.name })}`} className="font-medium hover:text-brand-600">
                      {t.name}
                    </Link>
                    <span className={`font-semibold ${scoreColor(t.average)}`}>{t.average}%</span>
                  </div>
                  <ProgressBar value={t.average} />
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Sparkles className="mr-1 inline size-4" /> No weak topics right now — great work!
            </p>
          )}
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Recent activity</h2>
          {timeline.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...timeline].reverse().slice(0, 5).map((a) => (
                <Link key={a.id} to={`/attempts/${a.id}`} className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className={`grid size-11 place-items-center rounded-xl bg-slate-100 text-sm font-bold dark:bg-slate-800 ${scoreColor(a.percentage)}`}>{a.percentage}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.quizTitle}</p>
                    <p className="text-xs text-slate-500">{a.subject} · {a.score}/{a.total} correct</p>
                  </div>
                  <span className="text-xs text-slate-400">{timeAgo(a.date)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No quiz attempts yet.</p>
          )}
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pick up where you left off</h2>
          <Link to="/library" className="text-sm font-semibold text-brand-600 dark:text-brand-400">Browse all →</Link>
        </div>
        {continueItems.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {continueItems.map((r) => <ResourceCard key={r._id} r={r} bookmarked={bookmarks.has(r._id)} />)}
          </div>
        ) : (
          <EmptyState title="You've completed everything here!">Explore other classes or external sources.</EmptyState>
        )}
      </section>

      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><ClipboardList className="size-5" /> Quizzes you haven't tried</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pending.map((q) => <QuizCard key={q._id} q={q} onStart={() => navigate(`/quiz/${q._id}`)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
