import { Link } from 'react-router-dom';
import { Eye, Bookmark, CircleCheck, Clock, ListChecks, Trophy, ArrowRight } from 'lucide-react';
import { TypeBadge, subjectGradient, DIFFICULTY, scoreColor } from './ui';

export function ResourceCard({ r, bookmarked, completed }) {
  return (
    <Link to={`/resource/${r._id}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`h-1.5 bg-gradient-to-r ${subjectGradient(r.subject)}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <TypeBadge type={r.type} />
          <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Class {r.className}</span>
          <span className="ml-auto flex gap-1.5">
            {completed && <CircleCheck className="size-4 text-emerald-500" title="Completed" />}
            {bookmarked && <Bookmark className="size-4 fill-amber-400 text-amber-400" title="Bookmarked" />}
          </span>
        </div>
        <h3 className="line-clamp-2 font-semibold group-hover:text-brand-600 dark:group-hover:text-brand-400">{r.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{r.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-500">
          <span className="truncate">
            {r.subject} · {r.topic}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Eye className="size-3.5" /> {r.views}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function QuizCard({ q, onStart }) {
  const attempted = q.attemptCount > 0;
  return (
    <div className="card flex flex-col p-5 transition hover:shadow-md">
      <div className="mb-3 flex items-center gap-2">
        <span className={`chip capitalize ${DIFFICULTY[q.difficulty]}`}>{q.difficulty}</span>
        <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Class {q.className}</span>
        {attempted && (
          <span className={`ml-auto flex items-center gap-1 text-sm font-bold ${scoreColor(q.bestScore)}`}>
            <Trophy className="size-4" /> {q.bestScore}%
          </span>
        )}
      </div>
      <h3 className="font-semibold">{q.title}</h3>
      <p className="mt-1 text-sm text-slate-500">
        {q.subject} · {q.topic}
      </p>
      {q.description && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{q.description}</p>}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <ListChecks className="size-3.5" /> {q.questionCount} questions
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" /> {q.durationMinutes} min
        </span>
        {attempted && <span>{q.attemptCount} attempt{q.attemptCount > 1 ? 's' : ''}</span>}
      </div>
      <button onClick={onStart} className={`${attempted ? 'btn-secondary' : 'btn-primary'} mt-4 w-full`}>
        {attempted ? 'Retake quiz' : 'Start quiz'} <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
