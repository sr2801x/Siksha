import { Link } from 'react-router-dom';
import { FolderUp, ClipboardList, Users, Target, Eye, Plus, PencilRuler, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../lib/useFetch';
import { StatCard, Spinner, ErrorBox, scoreColor, timeAgo, TypeBadge } from '../../components/ui';
import { AverageBars, Donut, PIE_COLORS } from '../../components/Charts';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/progress/teacher/overview');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const { stats, perQuiz, typeCounts, recentAttempts, topResources, students, bySubject } = data;
  const quizBars = perQuiz.filter((q) => q.attempts).map((q) => ({ name: q.title, average: q.average }));

  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-slate-500">Welcome back,</p>
          <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/teacher/content" className="btn-secondary"><Plus className="size-4" /> Upload content</Link>
          <Link to="/teacher/quizzes" className="btn-primary"><PencilRuler className="size-4" /> Create quiz</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={FolderUp} label="Resources" value={stats.resources} />
        <StatCard icon={ClipboardList} label="Quizzes" value={stats.quizzes} tone="sky" />
        <StatCard icon={Users} label="Active students" value={stats.students} tone="green" />
        <StatCard icon={Target} label="Avg. quiz score" value={`${stats.averageScore}%`} tone="amber" hint={`${stats.attempts} attempts`} />
        <StatCard icon={Eye} label="Content views" value={stats.totalViews} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-2 font-semibold">Average score per quiz</h2>
          {quizBars.length ? <AverageBars data={quizBars} layout="horizontal" height={280} /> : <p className="py-16 text-center text-sm text-slate-500">No attempts yet.</p>}
        </div>
        <div className="card p-5">
          <h2 className="mb-2 font-semibold">Content mix</h2>
          <Donut data={typeCounts.filter((t) => t.value)} />
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {typeCounts.map((t, i) => (
              <span key={t.name} className="flex items-center gap-2 capitalize">
                <span className="size-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} /> {t.name} <b className="ml-auto">{t.value}</b>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Recent quiz attempts</h2>
          <div className="space-y-3">
            {recentAttempts.length ? recentAttempts.slice(0, 6).map((a) => (
              <Link to={`/attempts/${a.id}`} key={a.id} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className={`w-11 text-sm font-bold tabular-nums ${scoreColor(a.percentage)}`}>{a.percentage}%</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.student}</p>
                  <p className="truncate text-xs text-slate-500">{a.quizTitle}</p>
                </div>
                <span className="text-xs text-slate-400">{timeAgo(a.date)}</span>
              </Link>
            )) : <p className="text-sm text-slate-500">No attempts yet.</p>}
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Top students</h2>
            <Link to="/teacher/students" className="text-sm font-semibold text-brand-600 dark:text-brand-400">All <ArrowRight className="inline size-3.5" /></Link>
          </div>
          <div className="space-y-3">
            {students.slice(0, 6).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-slate-500">Class {s.className} · {s.attempts} attempts</p>
                </div>
                <span className={`text-sm font-bold ${scoreColor(s.average)}`}>{s.average}%</span>
              </div>
            ))}
            {!students.length && <p className="text-sm text-slate-500">No students yet.</p>}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Most viewed content</h2>
          <div className="space-y-3">
            {topResources.map((r) => (
              <Link to={`/resource/${r.id}`} key={r.id} className="flex items-center gap-3 text-sm hover:text-brand-600">
                <TypeBadge type={r.type} />
                <span className="flex-1 truncate">{r.title}</span>
                <span className="flex items-center gap-1 text-xs text-slate-500"><Eye className="size-3.5" />{r.views}</span>
              </Link>
            ))}
          </div>
          {bySubject.length > 0 && (
            <>
              <h3 className="mt-6 mb-2 text-sm font-semibold">Average by subject</h3>
              {bySubject.map((s) => <p key={s.name} className="flex justify-between py-0.5 text-sm"><span>{s.name}</span><b className={scoreColor(s.average)}>{s.average}%</b></p>)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
