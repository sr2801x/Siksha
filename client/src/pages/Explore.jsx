import { useState } from 'react';
import { Globe, Search, ExternalLink, BookOpen, LoaderCircle, Import } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { PageHeader, EmptyState, ErrorBox, Modal } from '../components/ui';
import { TaxonomyFields } from './teacher/ManageContent';

const SUGGESTIONS = ['Photosynthesis', 'Pythagorean theorem', 'French Revolution', 'Newton\'s laws of motion', 'Periodic table', 'Mughal Empire'];

export default function Explore() {
  const { user } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(null);
  const [meta, setMeta] = useState({ className: '9', subject: 'Science', topic: '' });

  const search = async (term) => {
    const query = (term ?? q).trim();
    if (!query) return;
    setQ(query);
    setBusy(true);
    setError(null);
    try {
      setRes(await api(`/external/search?q=${encodeURIComponent(query)}`));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const doImport = async (e) => {
    e.preventDefault();
    try {
      await api('/external/import', { method: 'POST', body: { title: importing.title, url: importing.url, description: importing.snippet, ...meta } });
      toast('Added to the library');
      setImporting(null);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const Result = ({ r }) => (
    <div className="card flex gap-4 p-4">
      {r.image ? (
        <img src={r.image} alt="" className="h-24 w-16 shrink-0 rounded-md object-cover" />
      ) : (
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800">
          {r.source === 'Wikipedia' ? <Globe className="size-5 text-slate-500" /> : <BookOpen className="size-5 text-slate-500" />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{r.title}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{r.snippet}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
            Open <ExternalLink className="size-3.5" />
          </a>
          {user.role === 'teacher' && (
            <button
              className="inline-flex items-center gap-1 font-semibold text-emerald-600"
              onClick={() => {
                setMeta((m) => ({ ...m, topic: q }));
                setImporting(r);
              }}
            >
              <Import className="size-3.5" /> Add to library
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <PageHeader
        title="Explore external sources"
        subtitle="Search openly licensed educational content from Wikipedia and Open Library — fetched through official public APIs."
      />
      <form
        className="card mb-6 flex flex-wrap gap-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Photosynthesis, Quadratic equation…" />
        </div>
        <button className="btn-primary" disabled={busy}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />} Search
        </button>
        <div className="flex w-full flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button type="button" key={s} onClick={() => search(s)} className="chip border border-slate-200 px-3 py-1 hover:border-brand-400 dark:border-slate-700">
              {s}
            </button>
          ))}
        </div>
      </form>
      <ErrorBox error={error} />
      {!res && !busy && (
        <EmptyState icon={Globe} title="Discover more beyond the syllabus">
          Search any topic to find encyclopaedia articles and books.{user.role === 'teacher' && ' You can add useful results straight to the library.'}
        </EmptyState>
      )}
      {res && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Globe className="size-4" /> Wikipedia articles</h2>
            <div className="space-y-3">
              {res.wikipedia.length ? res.wikipedia.map((r) => <Result key={r.url} r={r} />) : <p className="text-sm text-slate-500">No articles found.</p>}
            </div>
          </section>
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><BookOpen className="size-4" /> Books (Open Library)</h2>
            <div className="space-y-3">
              {res.books.length ? res.books.map((r) => <Result key={r.url} r={r} />) : <p className="text-sm text-slate-500">No books found.</p>}
            </div>
          </section>
        </div>
      )}

      <Modal open={Boolean(importing)} onClose={() => setImporting(null)} title="Add to library">
        {importing && (
          <form onSubmit={doImport} className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
              <p className="font-semibold">{importing.title}</p>
              <p className="text-slate-500">{importing.source}</p>
            </div>
            <TaxonomyFields value={meta} onChange={setMeta} />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setImporting(null)}>Cancel</button>
              <button className="btn-primary">Add as link</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
