import { useState } from 'react';
import { Search, Users, Download, Printer, ArrowLeft } from 'lucide-react';
import { useFetch } from '../../lib/useFetch';
import { PageHeader, Spinner, ErrorBox, EmptyState, ProgressBar, scoreColor } from '../../components/ui';
import { ProgressReport, exportCsv } from '../student/Progress';

function StudentReport({ id, onBack }) {
  const { data, loading, error } = useFetch(`/progress/teacher/students/${id}`);
  return (
    <div className="fade-in">
      <button onClick={onBack} className="btn-ghost no-print mb-4 -ml-2"><ArrowLeft className="size-4" /> All students</button>
      {loading ? <Spinner /> : error ? <ErrorBox error={error} /> : (
        <>
          <PageHeader
            title={data.student.name}
            subtitle={`Class ${data.student.className} · ${data.student.email}`}
            actions={
              <div className="no-print flex gap-2">
                <button className="btn-secondary" onClick={() => exportCsv(data.timeline, `report-${data.student.name.replace(/\s+/g, '-')}`)}><Download className="size-4" /> CSV</button>
                <button className="btn-primary" onClick={() => window.print()}><Printer className="size-4" /> Print</button>
              </div>
            }
          />
          <ProgressReport data={data} />
        </>
      )}
    </div>
  );
}

export default function Students() {
  const { data, loading, error, reload } = useFetch('/progress/teacher/overview');
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('');
  const [selected, setSelected] = useState(null);

  if (selected) return <StudentReport id={selected} onBack={() => setSelected(null)} />;

  const students = (data?.students || []).filter((s) => (!cls || s.className === cls) && (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.email.includes(q.toLowerCase())));
  const classes = [...new Set((data?.students || []).map((s) => s.className))].sort((a, b) => a - b);

  return (
    <div className="fade-in">
      <PageHeader title="Students & Reports" subtitle="Performance of students who attempted your quizzes. Click a student for the full report." />
      <div className="card mb-5 flex flex-wrap gap-3 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="">All classes</option>
          {classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading ? <Spinner /> : !students.length ? (
        <EmptyState icon={Users} title="No students found">Students appear here once they attempt one of your quizzes.</EmptyState>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs tracking-wider text-slate-500 uppercase dark:bg-slate-800/50">
                <tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Class</th><th className="px-5 py-3">Attempts</th><th className="w-1/3 px-5 py-3">Average</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((s) => (
                  <tr key={s.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40" onClick={() => setSelected(s.id)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                          {s.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                        </span>
                        <div><p className="font-medium">{s.name}</p><p className="text-xs text-slate-500">{s.email}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{s.className}</td>
                    <td className="px-5 py-3 tabular-nums">{s.attempts}</td>
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><ProgressBar value={s.average} /><span className={`w-10 font-semibold ${scoreColor(s.average)}`}>{s.average}%</span></div></td>
                    <td className="px-5 py-3 text-right font-semibold text-brand-600 dark:text-brand-400">View report →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
