import { useEffect } from 'react';
import { FileText, FileType2, PlayCircle, Link2, Loader2, X, Inbox } from 'lucide-react';

export const TYPE_META = {
  notes: { label: 'Notes', icon: FileText, cls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  pdf: { label: 'PDF', icon: FileType2, cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
  video: { label: 'Video', icon: PlayCircle, cls: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
  link: { label: 'Link', icon: Link2, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
};

export const SUBJECT_COLORS = {
  Mathematics: 'from-indigo-500 to-blue-500',
  Science: 'from-emerald-500 to-teal-500',
  English: 'from-amber-500 to-orange-500',
  'Social Studies': 'from-rose-500 to-pink-500',
  'Computer Science': 'from-cyan-500 to-sky-500',
  Hindi: 'from-orange-500 to-red-500',
};
export const subjectGradient = (s) => SUBJECT_COLORS[s] || 'from-slate-500 to-slate-600';

export const DIFFICULTY = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  hard: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export function TypeBadge({ type }) {
  const m = TYPE_META[type] || TYPE_META.link;
  const Icon = m.icon;
  return (
    <span className={`chip ${m.cls}`}>
      <Icon className="size-3" /> {m.label}
    </span>
  );
}

export function scoreColor(p) {
  if (p >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (p >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-16 text-slate-400 ${className}`}>
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
      {error.message || String(error)}
      {onRetry && (
        <button onClick={onRetry} className="ml-2 font-semibold underline">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, children, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
        <Icon className="size-6" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-md text-sm text-slate-500">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`rounded-xl p-3 ${tones[tone]}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {hint && <p className="truncate text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className={`card fade-in flex max-h-[calc(100dvh-2rem)] w-full flex-col ${wide ? 'max-w-3xl' : 'max-w-lg'}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="btn-ghost -mr-2 p-2">
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-6">{children}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ value, className = '' }) {
  const v = Math.max(0, Math.min(100, value || 0));
  const color = v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}>
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${v}%` }} />
    </div>
  );
}

export function ScoreRing({ value, size = 140, stroke = 12 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#f43f5e';
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-100 dark:stroke-slate-800" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * value) / 100}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
};

export const fmtDuration = (sec) => (sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`);
