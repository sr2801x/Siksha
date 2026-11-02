import { useState } from 'react';
import { Save, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { PageHeader } from '../components/ui';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Hindi'];

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, className: user.className || '9', subjectsTaught: user.subjectsTaught || [] });
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api('/auth/me', { method: 'PUT', body: form });
      setUser(r.user);
      toast('Profile updated');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fade-in mx-auto max-w-2xl">
      <PageHeader title="Profile" subtitle="Manage your account details." />
      <form onSubmit={save} className="card space-y-5 p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-xl font-bold text-white">
            {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
          </span>
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <span className="chip mt-1 bg-brand-100 text-brand-700 capitalize dark:bg-brand-500/15 dark:text-brand-300"><ShieldCheck className="size-3" /> {user.role}</span>
          </div>
        </div>
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        {user.role === 'student' ? (
          <div>
            <label className="label">Class</label>
            <select className="input" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })}>
              {['6', '7', '8', '9', '10', '11', '12'].map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="label">Subjects you teach</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => {
                const on = form.subjectsTaught.includes(s);
                return (
                  <button type="button" key={s} onClick={() => setForm({ ...form, subjectsTaught: on ? form.subjectsTaught.filter((x) => x !== s) : [...form.subjectsTaught, s] })} className={`chip border px-3 py-1.5 ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <p className="text-xs text-slate-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
        <div className="flex justify-end">
          <button className="btn-primary" disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes</button>
        </div>
      </form>
    </div>
  );
}
