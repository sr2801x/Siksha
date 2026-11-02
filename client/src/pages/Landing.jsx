import { Link } from 'react-router-dom';
import {
  BookOpen, ClipboardCheck, ChartColumn, Search, ShieldCheck, Globe, ArrowRight, GraduationCap, Presentation, Sparkles, FileText, PlayCircle, FileType2,
} from 'lucide-react';
import { Logo, ThemeToggle } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../lib/home';

const FEATURES = [
  { icon: BookOpen, title: 'Organised by class, subject & topic', text: 'Notes, PDFs, videos and links arranged exactly the way your syllabus is.' },
  { icon: ClipboardCheck, title: 'Quizzes with instant feedback', text: 'Timed quizzes are auto-evaluated with explanations for every question.' },
  { icon: ChartColumn, title: 'Progress tracking', text: 'Subject-wise performance, weak topics, streaks and printable reports.' },
  { icon: Search, title: 'Search & smart filters', text: 'Find any resource in seconds by keyword, class, subject, topic or type.' },
  { icon: ShieldCheck, title: 'Secure role-based access', text: 'JWT-secured logins with separate student and teacher workspaces.' },
  { icon: Globe, title: 'External educational sources', text: 'Pull in openly licensed content from Wikipedia and Open Library.' },
];

const FLOW = ['Register / Login', 'Role verification', 'Browse or upload content', 'Study material', 'Attempt quiz', 'Instant score & feedback', 'Progress updated'];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? homeFor(user) : '/register';
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Link to={cta} className="btn-primary">Go to dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-16">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[480px] rounded-full bg-brand-400/20 blur-3xl" />
        <div className="fade-in">
          <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <Sparkles className="size-3.5" /> Smart learning for classes 6 – 12
          </span>
          <h1 className="mt-5 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            All your study material, <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">one smart place.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400">
            Siksha brings notes, PDFs, videos and quizzes together — organised by class, subject and topic — with instant feedback and progress tracking for every
            student.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={cta} className="btn-primary px-6 py-3 text-base">
              Start learning <ArrowRight className="size-4" />
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-base">Try the demo</Link>
          </div>
          <div className="mt-8 flex gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2"><GraduationCap className="size-4 text-brand-500" /> For students</span>
            <span className="flex items-center gap-2"><Presentation className="size-4 text-brand-500" /> For teachers</span>
          </div>
        </div>

        {/* Product preview */}
        <div className="fade-in relative" style={{ animationDelay: '.1s' }}>
          <div className="card rotate-1 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Class 9 · Science</p>
              <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">78% avg</span>
            </div>
            {[
              { i: FileText, t: 'Motion – Distance, Displacement & Equations', c: 'text-sky-500' },
              { i: FileType2, t: 'Motion – Formula Sheet (PDF)', c: 'text-rose-500' },
              { i: PlayCircle, t: 'Video lessons: Equations of Motion', c: 'text-violet-500' },
            ].map(({ i: I, t, c }) => (
              <div key={t} className="mb-2 flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <I className={`size-5 ${c}`} />
                <span className="text-sm font-medium">{t}</span>
              </div>
            ))}
            <div className="mt-4 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 p-4 text-white">
              <p className="text-sm text-white/80">Quiz result</p>
              <p className="text-3xl font-bold">5 / 6 correct</p>
              <p className="text-sm text-white/80">Great job! Review question 4 explanation.</p>
            </div>
          </div>
          <div className="card absolute -bottom-6 -left-4 hidden -rotate-2 items-center gap-3 p-4 shadow-xl sm:flex">
            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-500/15">🔥</div>
            <div>
              <p className="text-sm font-semibold">4-day study streak</p>
              <p className="text-xs text-slate-500">Keep going!</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Everything a school student needs</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-500">Built on the MERN stack with secure authentication, REST APIs and cloud file storage.</p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-6 transition hover:-translate-y-1 hover:shadow-md">
                <div className="mb-4 inline-flex rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">How Siksha works</h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {FLOW.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className="card flex items-center gap-2 px-4 py-2.5 text-sm font-medium">
                <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-xs text-white">{i + 1}</span>
                {s}
              </span>
              {i < FLOW.length - 1 && <ArrowRight className="size-4 text-slate-400" />}
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800">
        Siksha — Smart Learning Platform · Chitkara University, Punjab · Built by Nishita, Shivika, Sneha Rathore &amp; Manya Garg
      </footer>
    </div>
  );
}
