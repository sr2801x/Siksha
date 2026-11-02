import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Presentation, Mail, Lock, UserRound, LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo, ThemeToggle } from '../components/Layout';
import { ErrorBox } from '../components/ui';
import { homeFor } from '../lib/home';

const CLASSES = ['6', '7', '8', '9', '10', '11', '12'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Hindi'];

function Shell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-violet-600 p-12 text-white lg:flex">
        <div className="absolute -right-24 -bottom-24 size-96 rounded-full bg-white/10" />
        <div className="absolute top-32 -left-16 size-56 rounded-full bg-white/5" />
        <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold">
          <img src="/favicon.svg" className="size-9 rounded-lg ring-2 ring-white/30" alt="" /> Siksha
        </Link>
        <div className="relative">
          <h2 className="text-4xl leading-tight font-bold">Learn smarter,<br />one topic at a time.</h2>
          <p className="mt-4 max-w-md text-white/80">Notes, PDFs, videos and quizzes for your class — with instant feedback and progress you can actually see.</p>
        </div>
        <p className="relative text-sm text-white/60">Chitkara University · Department of CSE</p>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5 lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12">
          <div className="fade-in w-full max-w-md">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1.5 mb-8 text-slate-500">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
      <input className="input pl-10" {...props} />
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await login(form.email, form.password);
      navigate(homeFor(u));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const demo = (role) =>
    setForm(role === 'teacher' ? { email: 'teacher@siksha.com', password: 'teacher123' } : { email: 'student@siksha.com', password: 'student123' });

  return (
    <Shell title="Welcome back 👋" subtitle="Log in to continue learning.">
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => demo('student')} className="btn-secondary">
          <GraduationCap className="size-4" /> Demo student
        </button>
        <button type="button" onClick={() => demo('teacher')} className="btn-secondary">
          <Presentation className="size-4" /> Demo teacher
        </button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox error={error} />
        <div>
          <label className="label">Email</label>
          <IconInput icon={Mail} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@school.com" />
        </div>
        <div>
          <label className="label">Password</label>
          <IconInput icon={Lock} type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </div>
        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy && <LoaderCircle className="size-4 animate-spin" />} Log in
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        New to Siksha?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Create an account
        </Link>
      </p>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', className: '9', subjectsTaught: [] });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await register(form);
      navigate(homeFor(u));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Create your account" subtitle="Join Siksha as a student or a teacher.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: 'student', l: 'Student', i: GraduationCap, d: 'Learn & practise' },
            { v: 'teacher', l: 'Teacher', i: Presentation, d: 'Upload & assess' },
          ].map(({ v, l, i: I, d }) => (
            <button
              type="button"
              key={v}
              onClick={() => setForm({ ...form, role: v })}
              className={`rounded-2xl border-2 p-4 text-left transition ${
                form.role === v ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
              }`}
            >
              <I className={`mb-2 size-6 ${form.role === v ? 'text-brand-600' : 'text-slate-400'}`} />
              <p className="font-semibold">{l}</p>
              <p className="text-xs text-slate-500">{d}</p>
            </button>
          ))}
        </div>
        <ErrorBox error={error} />
        <div>
          <label className="label">Full name</label>
          <IconInput icon={UserRound} required value={form.name} onChange={set('name')} placeholder="Your name" />
        </div>
        <div>
          <label className="label">Email</label>
          <IconInput icon={Mail} type="email" required value={form.email} onChange={set('email')} placeholder="you@school.com" />
        </div>
        <div>
          <label className="label">Password</label>
          <IconInput icon={Lock} type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
        </div>
        {form.role === 'student' ? (
          <div>
            <label className="label">Class</label>
            <div className="flex flex-wrap gap-2">
              {CLASSES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setForm({ ...form, className: c })}
                  className={`size-11 rounded-xl border text-sm font-semibold transition ${
                    form.className === c ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 hover:border-brand-400 dark:border-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="label">Subjects you teach</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => {
                const on = form.subjectsTaught.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setForm({ ...form, subjectsTaught: on ? form.subjectsTaught.filter((x) => x !== s) : [...form.subjectsTaught, s] })}
                    className={`chip border px-3 py-1.5 ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy && <LoaderCircle className="size-4 animate-spin" />} Create account
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Log in
        </Link>
      </p>
    </Shell>
  );
}
