import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Library, ClipboardList, ChartColumn, Globe, Users, LogOut, Moon, Sun, Menu, Search, FolderUp, PencilRuler, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = {
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/library', label: 'Library', icon: Library },
    { to: '/quizzes', label: 'Quizzes', icon: ClipboardList },
    { to: '/progress', label: 'My Progress', icon: ChartColumn },
    { to: '/explore', label: 'Explore Web', icon: Globe },
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/teacher/content', label: 'Manage Content', icon: FolderUp },
    { to: '/teacher/quizzes', label: 'Quiz Builder', icon: PencilRuler },
    { to: '/teacher/students', label: 'Students & Reports', icon: Users },
    { to: '/library', label: 'Browse Library', icon: Library },
    { to: '/explore', label: 'External Sources', icon: Globe },
  ],
};

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <img src="/favicon.svg" alt="" className="size-9" />
      <span className="text-xl font-extrabold tracking-tight">
        Sik<span className="text-brand-600 dark:text-brand-400">sha</span>
      </span>
    </Link>
  );
}

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('siksha-theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);
  return [dark, setDark];
}

export function ThemeToggle() {
  const [dark, setDark] = useTheme();
  return (
    <button onClick={() => setDark(!dark)} className="btn-ghost p-2.5" title="Toggle theme" aria-label="Toggle theme">
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  const items = NAV[user.role];
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo />
        <button className="btn-ghost p-2 lg:hidden" onClick={() => setOpen(false)}>
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`
            }
          >
            <Icon className="size-[18px]" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-4 text-white">
        <p className="text-sm font-semibold">{user.role === 'student' ? `Class ${user.className}` : 'Teacher workspace'}</p>
        <p className="mt-1 text-xs text-white/80">
          {user.role === 'student' ? 'Keep your streak alive — try one quiz today!' : 'Upload notes, PDFs & quizzes for your classes.'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        {sidebar}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="fade-in absolute inset-y-0 left-0 w-72 bg-white dark:bg-slate-900">{sidebar}</aside>
        </div>
      )}

      <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-950/80">
        <button className="btn-ghost p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <form
          className="relative max-w-md flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/library?q=${encodeURIComponent(q)}`);
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes, PDFs, videos, topics…" className="input py-2 pl-9" />
        </form>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Link to="/profile" className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm leading-tight font-semibold">{user.name}</span>
              <span className="block text-xs leading-tight text-slate-500 capitalize">{user.role}</span>
            </span>
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="btn-ghost p-2.5"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}

