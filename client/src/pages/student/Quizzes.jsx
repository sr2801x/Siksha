import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../lib/useFetch';
import { qs } from '../../lib/api';
import { PageHeader, Spinner, ErrorBox, EmptyState } from '../../components/ui';
import { QuizCard } from '../../components/Cards';

export default function Quizzes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ className: user.className, subject: '', difficulty: '', q: '', status: '' });
  const [q, setQ] = useState('');
  const tax = useFetch('/meta/taxonomy');
  const { data, loading, error, reload } = useFetch(`/quizzes${qs({ className: f.className, subject: f.subject, difficulty: f.difficulty, q: f.q })}`);
  let items = data?.items || [];
  if (f.status === 'todo') items = items.filter((x) => !x.attemptCount);
  if (f.status === 'done') items = items.filter((x) => x.attemptCount);
  const subjects = f.className && tax.data?.tree[f.className] ? Object.keys(tax.data.tree[f.className]) : tax.data?.subjects || [];

  return (
    <div className="fade-in">
      <PageHeader title="Quizzes" subtitle="Practise topic-wise quizzes. Every answer is evaluated instantly with explanations." />
      <div className="card mb-6 flex flex-wrap gap-3 p-4">
        <form
          className="relative min-w-[200px] flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setF({ ...f, q });
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search quizzes…" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <select className="input w-auto" value={f.className} onChange={(e) => setF({ ...f, className: e.target.value, subject: '' })}>
          <option value="">All classes</option>
          {(tax.data?.classes || []).map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select className="input w-auto" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-auto" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}>
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <div className="flex rounded-xl border border-slate-300 p-1 dark:border-slate-700">
          {[['', 'All'], ['todo', 'Not attempted'], ['done', 'Attempted']].map(([v, l]) => (
            <button key={v} onClick={() => setF({ ...f, status: v })} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${f.status === v ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((x) => <QuizCard key={x._id} q={x} onStart={() => navigate(`/quiz/${x._id}`)} />)}
        </div>
      ) : (
        <EmptyState icon={ClipboardList} title="No quizzes match">Try another class or subject.</EmptyState>
      )}
    </div>
  );
}
