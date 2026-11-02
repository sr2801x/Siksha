import { useState } from 'react';
import { Plus, Pencil, Trash2, ListChecks, Clock, Users, GripVertical, Check, LoaderCircle, Save, X, Copy, PencilRuler } from 'lucide-react';
import { useFetch } from '../../lib/useFetch';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Spinner, ErrorBox, EmptyState, Modal, DIFFICULTY, scoreColor } from '../../components/ui';
import { TaxonomyFields } from './ManageContent';

const blankQ = () => ({ text: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' });
const BLANK = { title: '', description: '', className: '9', subject: 'Mathematics', topic: '', difficulty: 'medium', durationMinutes: 10, published: true, questions: [blankQ()] };

function QuizEditor({ initial, onSaved, onCancel }) {
  const toast = useToast();
  const [quiz, setQuiz] = useState(initial || BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const setQ = (i, patch) => setQuiz((z) => ({ ...z, questions: z.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { ...quiz, durationMinutes: Number(quiz.durationMinutes) };
      initial?._id ? await api(`/quizzes/${initial._id}`, { method: 'PUT', body }) : await api('/quizzes', { method: 'POST', body });
      toast(initial?._id ? 'Quiz updated' : 'Quiz created');
      onSaved();
    } catch (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{initial?._id ? 'Edit quiz' : 'Create a new quiz'}</h1>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}><X className="size-4" /> Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Save quiz</button>
        </div>
      </div>
      <ErrorBox error={error} />
      <div className="card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="label">Quiz title</label>
            <input className="input" required value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} placeholder="e.g. Motion – Chapter Test" />
          </div>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-medium">
            <input type="checkbox" className="size-4 accent-brand-600" checked={quiz.published} onChange={(e) => setQuiz({ ...quiz, published: e.target.checked })} /> Published
          </label>
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" value={quiz.description} onChange={(e) => setQuiz({ ...quiz, description: e.target.value })} placeholder="Optional" />
        </div>
        <TaxonomyFields value={quiz} onChange={setQuiz} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Difficulty</label>
            <div className="flex gap-2">
              {['easy', 'medium', 'hard'].map((d) => (
                <button type="button" key={d} onClick={() => setQuiz({ ...quiz, difficulty: d })} className={`flex-1 rounded-xl border-2 py-2 text-sm font-semibold capitalize ${quiz.difficulty === d ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-slate-200 dark:border-slate-800'}`}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Time limit (minutes)</label>
            <input className="input" type="number" min={1} max={180} value={quiz.durationMinutes} onChange={(e) => setQuiz({ ...quiz, durationMinutes: e.target.value })} />
          </div>
        </div>
      </div>

      {quiz.questions.map((q, i) => (
        <div key={i} className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <GripVertical className="size-4 text-slate-300" />
            <span className="font-semibold">Question {i + 1}</span>
            <div className="ml-auto flex gap-1">
              <button type="button" className="btn-ghost p-2" title="Duplicate" onClick={() => setQuiz((z) => ({ ...z, questions: [...z.questions.slice(0, i + 1), structuredClone(q), ...z.questions.slice(i + 1)] }))}><Copy className="size-4" /></button>
              <button type="button" className="btn-ghost p-2 text-rose-600" title="Remove" disabled={quiz.questions.length === 1} onClick={() => setQuiz((z) => ({ ...z, questions: z.questions.filter((_, j) => j !== i) }))}><Trash2 className="size-4" /></button>
            </div>
          </div>
          <textarea className="input min-h-20" required value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} placeholder="Type the question…" />
          <p className="mt-4 mb-2 text-sm text-slate-500">Options — click the circle to mark the correct answer</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, k) => (
              <div key={k} className={`flex items-center gap-2 rounded-xl border-2 p-1.5 pl-2 ${q.correctIndex === k ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5' : 'border-transparent'}`}>
                <button type="button" onClick={() => setQ(i, { correctIndex: k })} className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${q.correctIndex === k ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`} title="Mark correct">
                  {q.correctIndex === k && <Check className="size-4" />}
                </button>
                <input className="input py-2" required value={o} placeholder={`Option ${String.fromCharCode(65 + k)}`} onChange={(e) => setQ(i, { options: q.options.map((x, m) => (m === k ? e.target.value : x)) })} />
                {q.options.length > 2 && (
                  <button type="button" className="text-slate-400 hover:text-rose-500" onClick={() => setQ(i, { options: q.options.filter((_, m) => m !== k), correctIndex: q.correctIndex === k ? 0 : q.correctIndex > k ? q.correctIndex - 1 : q.correctIndex })}>
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {q.options.length < 6 && (
            <button type="button" className="mt-2 text-sm font-semibold text-brand-600" onClick={() => setQ(i, { options: [...q.options, ''] })}>+ Add option</button>
          )}
          <div className="mt-4">
            <label className="label">Explanation (shown after submission)</label>
            <input className="input" value={q.explanation} onChange={(e) => setQ(i, { explanation: e.target.value })} placeholder="Why is this the correct answer?" />
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary w-full border-dashed py-4" onClick={() => setQuiz((z) => ({ ...z, questions: [...z.questions, blankQ()] }))}>
        <Plus className="size-4" /> Add question
      </button>
    </form>
  );
}

export default function QuizBuilder() {
  const toast = useToast();
  const quizzes = useFetch('/quizzes?mine=1');
  const overview = useFetch('/progress/teacher/overview');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  if (editing)
    return <QuizEditor initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); quizzes.reload(); overview.reload(); }} />;

  const stats = new Map((overview.data?.perQuiz || []).map((p) => [String(p.id), p]));
  const items = quizzes.data?.items || [];

  const openEdit = async (q) => setEditing((await api(`/quizzes/${q._id}`)).quiz);
  const doDelete = async () => {
    try {
      await api(`/quizzes/${deleting._id}`, { method: 'DELETE' });
      toast('Quiz deleted');
      setDeleting(null);
      quizzes.reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Quiz Builder" subtitle="Create MCQ quizzes with automatic evaluation and explanations." actions={<button className="btn-primary" onClick={() => setEditing('new')}><Plus className="size-4" /> New quiz</button>} />
      <ErrorBox error={quizzes.error} onRetry={quizzes.reload} />
      {quizzes.loading ? <Spinner /> : !items.length ? (
        <EmptyState icon={PencilRuler} title="No quizzes yet" action={<button className="btn-primary" onClick={() => setEditing('new')}><Plus className="size-4" /> Create a quiz</button>}>Build your first quiz for students to practise.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((q) => {
            const s = stats.get(String(q._id));
            return (
              <div key={q._id} className="card flex flex-col p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className={`chip capitalize ${DIFFICULTY[q.difficulty]}`}>{q.difficulty}</span>
                  <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Class {q.className}</span>
                  {!q.published && <span className="chip bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">Draft</span>}
                </div>
                <h3 className="font-semibold">{q.title}</h3>
                <p className="text-sm text-slate-500">{q.subject} · {q.topic}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 py-2 dark:bg-slate-800"><ListChecks className="mx-auto size-4 text-slate-400" /><p className="text-sm font-bold">{q.questionCount}</p></div>
                  <div className="rounded-xl bg-slate-50 py-2 dark:bg-slate-800"><Clock className="mx-auto size-4 text-slate-400" /><p className="text-sm font-bold">{q.durationMinutes}m</p></div>
                  <div className="rounded-xl bg-slate-50 py-2 dark:bg-slate-800"><Users className="mx-auto size-4 text-slate-400" /><p className="text-sm font-bold">{s?.attempts ?? 0}</p></div>
                </div>
                {s?.attempts > 0 && <p className="mt-3 text-sm text-slate-500">Class average: <b className={scoreColor(s.average)}>{s.average}%</b></p>}
                <div className="mt-auto flex gap-2 pt-4">
                  <button className="btn-secondary flex-1" onClick={() => openEdit(q)}><Pencil className="size-4" /> Edit</button>
                  <button className="btn-ghost text-rose-600" onClick={() => setDeleting(q)}><Trash2 className="size-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete quiz?">
        <p className="text-slate-600 dark:text-slate-400">“{deleting?.title}” and all its student attempts will be deleted.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn-danger" onClick={doDelete}><Trash2 className="size-4" /> Delete</button>
        </div>
      </Modal>
    </div>
  );
}
