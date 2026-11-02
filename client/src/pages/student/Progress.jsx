import { Link } from 'react-router-dom';
import { Printer, Download, Target, Trophy, Clock, ClipboardCheck, BookOpenCheck, Flame } from 'lucide-react';
import { useFetch } from '../../lib/useFetch';
import { PageHeader, Spinner, ErrorBox, StatCard, ProgressBar, scoreColor, fmtDuration, EmptyState } from '../../components/ui';
import { ScoreTrend, AverageBars, SubjectRadar } from '../../components/Charts';

export function exportCsv(timeline, name = 'siksha-report') {
  const rows = [['Date', 'Quiz', 'Subject', 'Topic', 'Score', 'Total', 'Percentage', 'Time (s)']];
  for (const a of timeline) rows.push([new Date(a.date).toLocaleString(), a.quizTitle, a.subject, a.topic, a.score, a.total, a.percentage, a.timeTakenSec]);
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${name}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

// Shared report body — also used by teachers when viewing a student
export function ProgressReport({ data }) {
  const { stats, timeline, bySubject, byTopic, weakTopics, strongTopics, student } = data;
  if (!timeline.length)
    return (
      <EmptyState icon={ClipboardCheck} title="No quiz attempts yet" action={<Link to="/quizzes" className="btn-primary">Take your first quiz</Link>}>
        Your performance report will appear here after you attempt a quiz.
      </EmptyState>
    );
  return (
    <div className="space-y-6">
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">Siksha – Performance Report</h1>
        <p>{student.name} · Class {student.className} · Generated {new Date().toLocaleDateString()}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Target} label="Average score" value={`${stats.averageScore}%`} hint={`Across ${stats.attempts} attempts`} />
        <StatCard icon={Trophy} label="Best score" value={`${stats.bestScore}%`} tone="amber" />
        <StatCard icon={ClipboardCheck} label="Quizzes completed" value={`${stats.quizzesTaken}/${stats.totalQuizzes}`} tone="sky" />
        <StatCard icon={BookOpenCheck} label="Resources completed" value={`${stats.resourcesCompleted}/${stats.totalResources}`} tone="green" />
        <StatCard icon={Clock} label="Time in quizzes" value={`${stats.totalStudyMinutes} min`} tone="brand" />
        <StatCard icon={Flame} label="Current streak" value={`${stats.streak} days`} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-2 font-semibold">Score over time</h2>
          <ScoreTrend data={timeline} />
        </div>
        <div className="card p-5">
          <h2 className="mb-2 font-semibold">Subject strengths</h2>
          {bySubject.length >= 3 ? <SubjectRadar data={bySubject} /> : <AverageBars data={bySubject} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Topic-wise performance</h2>
          <div className="space-y-4">
            {byTopic.map((t) => (
              <div key={t.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{t.name} <span className="text-slate-400">· {t.subject}</span></span>
                  <span className={`font-semibold ${scoreColor(t.average)}`}>{t.average}% <span className="font-normal text-slate-400">({t.attempts})</span></span>
                </div>
                <ProgressBar value={t.average} />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-emerald-600">💪 Strong topics</h2>
            {strongTopics.length ? strongTopics.map((t) => <p key={t.name} className="py-1 text-sm">{t.name} — <b>{t.average}%</b></p>) : <p className="text-sm text-slate-500">Score 80%+ in a topic to see it here.</p>}
          </div>
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-rose-600">🎯 Focus areas</h2>
            {weakTopics.length ? weakTopics.map((t) => <p key={t.name} className="py-1 text-sm">{t.name} — <b>{t.average}%</b></p>) : <p className="text-sm text-slate-500">No weak topics. 🎉</p>}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h2 className="border-b border-slate-200 px-5 py-4 font-semibold dark:border-slate-800">Attempt history</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs tracking-wider text-slate-500 uppercase dark:bg-slate-800/50">
              <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Quiz</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Time</th><th className="no-print px-5 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...timeline].reverse().map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 whitespace-nowrap text-slate-500">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3 font-medium">{a.quizTitle}</td>
                  <td className="px-5 py-3 text-slate-500">{a.subject}</td>
                  <td className={`px-5 py-3 font-semibold ${scoreColor(a.percentage)}`}>{a.score}/{a.total} ({a.percentage}%)</td>
                  <td className="px-5 py-3 text-slate-500">{fmtDuration(a.timeTakenSec || 0)}</td>
                  <td className="no-print px-5 py-3 text-right"><Link to={`/attempts/${a.id}`} className="font-semibold text-brand-600 dark:text-brand-400">Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Progress() {
  const { data, loading, error, reload } = useFetch('/progress/me');
  return (
    <div className="fade-in">
      <PageHeader
        title="My Progress"
        subtitle="Your performance report across subjects and topics."
        actions={
          data?.timeline.length > 0 && (
            <div className="no-print flex gap-2">
              <button className="btn-secondary" onClick={() => exportCsv(data.timeline)}><Download className="size-4" /> Export CSV</button>
              <button className="btn-primary" onClick={() => window.print()}><Printer className="size-4" /> Print report</button>
            </div>
          )
        }
      />
      <ErrorBox error={error} onRetry={reload} />
      {loading ? <Spinner /> : data && <ProgressReport data={data} />}
    </div>
  );
}
