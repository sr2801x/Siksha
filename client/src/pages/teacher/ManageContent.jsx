import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Upload, Search, FolderUp, LoaderCircle, FileUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useFetch } from '../../lib/useFetch';
import { api, qs } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Spinner, ErrorBox, EmptyState, Modal, TypeBadge, TYPE_META, timeAgo } from '../../components/ui';

// Class / subject / topic inputs with suggestions from existing content
export function TaxonomyFields({ value, onChange }) {
  const tax = useFetch('/meta/taxonomy');
  const topics = Object.keys(tax.data?.tree[value.className]?.[value.subject] || {});
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <label className="label">Class</label>
        <select className="input" value={value.className} onChange={(e) => onChange({ ...value, className: e.target.value })} required>
          {(tax.data?.classes || ['6', '7', '8', '9', '10', '11', '12']).map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Subject</label>
        <input className="input" list="subjects-list" value={value.subject} onChange={(e) => onChange({ ...value, subject: e.target.value })} required />
        <datalist id="subjects-list">{(tax.data?.subjects || []).map((s) => <option key={s} value={s} />)}</datalist>
      </div>
      <div>
        <label className="label">Topic</label>
        <input className="input" list="topics-list" value={value.topic} onChange={(e) => onChange({ ...value, topic: e.target.value })} required placeholder="e.g. Motion" />
        <datalist id="topics-list">{topics.map((t) => <option key={t} value={t} />)}</datalist>
      </div>
    </div>
  );
}

const EMPTY = { title: '', description: '', type: 'notes', className: '9', subject: 'Science', topic: '', content: '', url: '', tags: '' };

function ResourceForm({ initial, onSaved, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState(initial ? { ...initial, tags: (initial.tags || []).join(', ') } : EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      for (const k of ['title', 'description', 'type', 'className', 'subject', 'topic', 'content', 'url', 'tags']) fd.append(k, form[k] ?? '');
      if (file) fd.append('file', file);
      const r = initial ? await api(`/resources/${initial._id}`, { method: 'PUT', form: fd }) : await api('/resources', { method: 'POST', form: fd });
      toast(initial ? 'Resource updated' : 'Resource published');
      onSaved(r.item);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const accepts = form.type === 'pdf' ? 'application/pdf' : 'video/mp4,video/webm';

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorBox error={error} />
      <div>
        <label className="label">Resource type</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(TYPE_META).map(([k, m]) => (
            <button
              type="button"
              key={k}
              onClick={() => setForm({ ...form, type: k })}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm font-medium transition ${
                form.type === k ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <m.icon className="size-5" /> {m.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Title</label>
        <input className="input" value={form.title} onChange={set('title')} required placeholder="e.g. Motion – Complete Notes" />
      </div>
      <div>
        <label className="label">Short description</label>
        <input className="input" value={form.description} onChange={set('description')} placeholder="What will students learn?" />
      </div>
      <TaxonomyFields value={form} onChange={setForm} />

      {form.type === 'notes' && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label mb-0">Notes content (Markdown supported)</label>
            <button type="button" className="text-sm font-semibold text-brand-600" onClick={() => setPreview(!preview)}>{preview ? 'Edit' : 'Preview'}</button>
          </div>
          {preview ? (
            <div className="prose prose-sm prose-slate max-h-80 max-w-none overflow-auto rounded-xl border border-slate-200 p-4 dark:prose-invert dark:border-slate-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content || '_Nothing to preview_'}</ReactMarkdown>
            </div>
          ) : (
            <textarea className="input min-h-56 font-mono text-[13px]" value={form.content} onChange={set('content')} placeholder={'# Heading\n\nWrite **notes** here. Tables, lists and > quotes work.'} />
          )}
        </div>
      )}

      {(form.type === 'pdf' || form.type === 'video') && (
        <div>
          <label className="label">Upload {form.type === 'pdf' ? 'PDF' : 'video (MP4/WebM)'}</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); e.dataTransfer.files[0] && setFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}
            className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-6 text-center transition ${drag ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-300 hover:border-brand-400 dark:border-slate-700'}`}
          >
            <FileUp className="mb-2 size-7 text-slate-400" />
            {file ? <p className="text-sm font-semibold">{file.name} <span className="font-normal text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></p>
              : <p className="text-sm text-slate-500"><b className="text-brand-600">Click to upload</b> or drag and drop (max 50 MB)</p>}
            {initial?.fileName && !file && <p className="mt-1 text-xs text-slate-400">Current: {initial.fileName}</p>}
            <input ref={fileRef} type="file" accept={accepts} hidden onChange={(e) => setFile(e.target.files[0] || null)} />
          </div>
          {form.type === 'video' && <p className="mt-2 text-center text-xs text-slate-400">— or paste a YouTube link below —</p>}
        </div>
      )}

      {(form.type === 'video' || form.type === 'link') && (
        <div>
          <label className="label">{form.type === 'video' ? 'YouTube / video URL' : 'Link URL'}</label>
          <input className="input" type="url" value={form.url.startsWith('/uploads') ? '' : form.url} onChange={set('url')} placeholder="https://…" />
        </div>
      )}

      <div>
        <label className="label">Tags (comma separated)</label>
        <input className="input" value={form.tags} onChange={set('tags')} placeholder="algebra, cbse, revision" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />} {initial ? 'Save changes' : 'Publish'}</button>
      </div>
    </form>
  );
}

export default function ManageContent() {
  const toast = useToast();
  const [f, setF] = useState({ q: '', type: '', className: '' });
  const [q, setQ] = useState('');
  const { data, loading, error, reload } = useFetch(`/resources${qs({ ...f, mine: 1 })}`);
  const [editing, setEditing] = useState(null); // null | 'new' | resource
  const [deleting, setDeleting] = useState(null);

  const openEdit = async (r) => {
    const full = await api(`/resources/${r._id}`); // list omits markdown content
    setEditing(full.item);
  };

  const doDelete = async () => {
    try {
      await api(`/resources/${deleting._id}`, { method: 'DELETE' });
      toast('Resource deleted');
      setDeleting(null);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const items = data?.items || [];
  return (
    <div className="fade-in">
      <PageHeader
        title="Manage Content"
        subtitle="Upload and organise notes, PDFs, videos and links for your classes."
        actions={<button className="btn-primary" onClick={() => setEditing('new')}><Plus className="size-4" /> New resource</button>}
      />
      <div className="card mb-5 flex flex-wrap gap-3 p-4">
        <form className="relative min-w-[200px] flex-1" onSubmit={(e) => { e.preventDefault(); setF({ ...f, q }); }}>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search your resources…" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <select className="input w-auto" value={f.className} onChange={(e) => setF({ ...f, className: e.target.value })}>
          <option value="">All classes</option>
          {['6', '7', '8', '9', '10', '11', '12'].map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select className="input w-auto" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          <option value="">All types</option>
          {Object.entries(TYPE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading ? <Spinner /> : !items.length ? (
        <EmptyState icon={FolderUp} title="No resources yet" action={<button className="btn-primary" onClick={() => setEditing('new')}><Plus className="size-4" /> Upload your first resource</button>}>
          Notes, PDFs, videos and links you publish will appear here.
        </EmptyState>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs tracking-wider text-slate-500 uppercase dark:bg-slate-800/50">
                <tr><th className="px-5 py-3">Resource</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Class / Subject / Topic</th><th className="px-5 py-3">Views</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="max-w-xs px-5 py-3"><p className="truncate font-medium">{r.title}</p><p className="truncate text-xs text-slate-500">{r.description}</p></td>
                    <td className="px-5 py-3"><TypeBadge type={r.type} /></td>
                    <td className="px-5 py-3 text-slate-500">{r.className} · {r.subject} · {r.topic}</td>
                    <td className="px-5 py-3 tabular-nums">{r.views}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500">{timeAgo(r.updatedAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/resource/${r._id}`} className="btn-ghost p-2" title="View"><Eye className="size-4" /></Link>
                        <button className="btn-ghost p-2" title="Edit" onClick={() => openEdit(r)}><Pencil className="size-4" /></button>
                        <button className="btn-ghost p-2 text-rose-600" title="Delete" onClick={() => setDeleting(r)}><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'New resource' : 'Edit resource'} wide>
        {editing && (
          <ResourceForm
            initial={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>
      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete resource?">
        <p className="text-slate-600 dark:text-slate-400">“{deleting?.title}” will be removed for all students. This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn-danger" onClick={doDelete}><Trash2 className="size-4" /> Delete</button>
        </div>
      </Modal>
    </div>
  );
}
