import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, Search, SlidersHorizontal, LibraryBig, X, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../lib/useFetch';
import { qs } from '../lib/api';
import { PageHeader, Spinner, ErrorBox, EmptyState, TYPE_META } from '../components/ui';
import { ResourceCard } from '../components/Cards';

// Class → Subject → Topic navigator
function TopicTree({ tree, value, onChange }) {
  const [openCls, setOpenCls] = useState(value.className || null);
  const [openSub, setOpenSub] = useState(value.subject || null);
  const classes = Object.keys(tree).sort((a, b) => Number(a) - Number(b));
  const btn = (active) =>
    `flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
      active ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;
  return (
    <div className="space-y-0.5">
      {classes.map((c) => (
        <div key={c}>
          <button
            className={btn(value.className === c && !value.subject)}
            onClick={() => {
              setOpenCls(openCls === c ? null : c);
              onChange({ className: c, subject: '', topic: '' });
            }}
          >
            <ChevronRight className={`size-4 transition ${openCls === c ? 'rotate-90' : ''}`} /> Class {c}
          </button>
          {openCls === c && (
            <div className="ml-4 border-l border-slate-200 pl-2 dark:border-slate-800">
              {Object.keys(tree[c]).sort().map((s) => (
                <div key={s}>
                  <button
                    className={btn(value.className === c && value.subject === s && !value.topic)}
                    onClick={() => {
                      setOpenSub(openSub === s ? null : s);
                      onChange({ className: c, subject: s, topic: '' });
                    }}
                  >
                    <ChevronRight className={`size-3.5 transition ${openSub === s ? 'rotate-90' : ''}`} /> {s}
                  </button>
                  {openSub === s && (
                    <div className="ml-4 border-l border-slate-200 pl-2 dark:border-slate-800">
                      {Object.entries(tree[c][s]).map(([t, n]) => (
                        <button key={t} className={btn(value.topic === t)} onClick={() => onChange({ className: c, subject: s, topic: t })}>
                          <span className="flex-1 truncate">{t}</span>
                          <span className="text-xs text-slate-400">{n.resources}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const isStudent = user.role === 'student';

  const filters = {
    q: params.get('q') || '',
    className: params.get('className') ?? (isStudent && !params.get('q') ? user.className : ''),
    subject: params.get('subject') || '',
    topic: params.get('topic') || '',
    type: params.get('type') || '',
    sort: params.get('sort') || '',
    bookmarked: params.get('bookmarked') || '',
  };
  const [q, setQ] = useState(filters.q);

  const update = (patch) => {
    const next = { ...filters, ...patch };
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => (v || k === 'className') && p.set(k, v || ''));
    setParams(p, { replace: true });
  };

  const tax = useFetch('/meta/taxonomy');
  const { data, loading, error, reload } = useFetch(`/resources${qs(filters)}`);
  const items = data?.items || [];
  const bookmarks = useMemo(() => new Set((user.bookmarks || []).map(String)), [user.bookmarks]);
  const completed = useMemo(() => new Set((user.completed || []).map(String)), [user.completed]);

  const subjects = filters.className && tax.data?.tree[filters.className] ? Object.keys(tax.data.tree[filters.className]) : tax.data?.subjects || [];
  const topics = filters.className && filters.subject ? Object.keys(tax.data?.tree[filters.className]?.[filters.subject] || {}) : [];
  const activeChips = ['className', 'subject', 'topic', 'type', 'q'].filter((k) => filters[k]);

  return (
    <div className="fade-in">
      <PageHeader title="Learning Library" subtitle="Browse notes, PDFs, videos and links by class, subject and topic." />

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="card sticky top-20 p-4">
            <p className="mb-3 px-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">Browse</p>
            <button
              className="mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => update({ className: '', subject: '', topic: '', bookmarked: '' })}
            >
              <LibraryBig className="size-4" /> All classes
            </button>
            {isStudent && (
              <button
                className={`mb-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  filters.bookmarked ? 'bg-amber-50 font-semibold text-amber-700 dark:bg-amber-500/10' : ''
                }`}
                onClick={() => update({ bookmarked: filters.bookmarked ? '' : '1', className: '' })}
              >
                <Bookmark className="size-4" /> My bookmarks
              </button>
            )}
            {tax.data ? <TopicTree tree={tax.data.tree} value={filters} onChange={(v) => update({ ...v, bookmarked: '' })} /> : <Spinner className="py-6" />}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="card mb-5 p-4">
            <div className="flex flex-wrap gap-3">
              <form
                className="relative min-w-[200px] flex-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  update({ q });
                }}
              >
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-9" placeholder="Search by title, topic or keyword…" />
              </form>
              <button className="btn-secondary lg:hidden" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="size-4" /> Browse
              </button>
              <select className="input w-auto" value={filters.className} onChange={(e) => update({ className: e.target.value, subject: '', topic: '' })}>
                <option value="">All classes</option>
                {(tax.data?.classes || []).map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
              <select className="input w-auto" value={filters.subject} onChange={(e) => update({ subject: e.target.value, topic: '' })}>
                <option value="">All subjects</option>
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              {topics.length > 0 && (
                <select className="input w-auto" value={filters.topic} onChange={(e) => update({ topic: e.target.value })}>
                  <option value="">All topics</option>
                  {topics.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              )}
              <select className="input w-auto" value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
                <option value="">Newest</option>
                <option value="popular">Most viewed</option>
                <option value="title">A – Z</option>
              </select>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {['', 'notes', 'pdf', 'video', 'link'].map((t) => {
                const Icon = TYPE_META[t]?.icon;
                return (
                  <button
                    key={t}
                    onClick={() => update({ type: t })}
                    className={`chip border px-3 py-1.5 transition ${
                      filters.type === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {Icon && <Icon className="size-3.5" />} {t ? TYPE_META[t].label : 'All types'}
                  </button>
                );
              })}
              {activeChips.length > 0 && (
                <button
                  className="ml-auto text-xs font-semibold text-slate-500 hover:text-rose-600"
                  onClick={() => {
                    setQ('');
                    setParams(new URLSearchParams({ className: '' }), { replace: true });
                  }}
                >
                  <X className="inline size-3.5" /> Clear filters
                </button>
              )}
            </div>
          </div>

          <ErrorBox error={error} onRetry={reload} />
          {loading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState title="No resources found" icon={Search}>
              Try a different keyword or remove some filters.
            </EmptyState>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-500">
                {items.length} resource{items.length !== 1 && 's'}
                {filters.className && ` in Class ${filters.className}`}
                {filters.subject && ` · ${filters.subject}`}
                {filters.topic && ` · ${filters.topic}`}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((r) => (
                  <ResourceCard key={r._id} r={r} bookmarked={bookmarks.has(r._id)} completed={completed.has(r._id)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
