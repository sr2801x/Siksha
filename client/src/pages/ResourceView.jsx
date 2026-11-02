import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Bookmark, CircleCheck, Download, ExternalLink, Eye, Globe, ClipboardList, ArrowRight, PlayCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../lib/useFetch';
import { api } from '../lib/api';
import { Spinner, ErrorBox, TypeBadge, subjectGradient, timeAgo, DIFFICULTY } from '../components/ui';

// youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID → embeddable URL
function youTubeEmbed(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

function Viewer({ item }) {
  if (item.type === 'notes')
    return (
      <article className="prose prose-slate max-w-none p-6 sm:p-8 dark:prose-invert prose-headings:tracking-tight prose-table:text-sm prose-th:bg-slate-50 prose-th:px-3 prose-td:px-3 dark:prose-th:bg-slate-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
      </article>
    );
  if (item.type === 'pdf')
    return (
      <div>
        <iframe src={item.url} title={item.title} className="h-[75vh] w-full rounded-b-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  if (item.type === 'video') {
    const embed = youTubeEmbed(item.url);
    if (embed)
      return (
        <div className="aspect-video">
          <iframe src={embed} title={item.title} className="size-full rounded-b-2xl" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
      );
    if (/\.(mp4|webm)(\?|$)/i.test(item.url) || item.url.startsWith('/uploads'))
      return <video src={item.url} controls className="w-full rounded-b-2xl bg-black" />;
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <PlayCircle className="mb-3 size-14 text-violet-500" />
        <p className="font-semibold">This video collection opens on YouTube</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">Curated video lessons for this topic are hosted externally.</p>
        <a href={item.url} target="_blank" rel="noreferrer" className="btn-primary mt-5">
          Watch videos <ExternalLink className="size-4" />
        </a>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <Globe className="mb-3 size-14 text-emerald-500" />
      <p className="font-semibold">External learning resource</p>
      <p className="mt-1 max-w-md text-sm break-all text-slate-500">{item.url}</p>
      <a href={item.url} target="_blank" rel="noreferrer" className="btn-primary mt-5">
        Open resource <ExternalLink className="size-4" />
      </a>
    </div>
  );
}

function WikiPanel({ topic }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    api(`/external/summary?title=${encodeURIComponent(topic)}`)
      .then((d) => live && setData(d))
      .catch(() => live && setData(false));
    return () => {
      live = false;
    };
  }, [topic]);
  if (data === false || (data && !data.extract)) return null;
  return (
    <div className="card p-5">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
        <Globe className="size-3.5" /> Learn more · Wikipedia
      </p>
      {!data ? (
        <div className="space-y-2">
          <div className="h-3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : (
        <>
          {data.image && <img src={data.image} alt="" className="mb-3 max-h-32 rounded-lg object-cover" />}
          <p className="font-semibold">{data.title}</p>
          <p className="mt-1 line-clamp-6 text-sm text-slate-600 dark:text-slate-400">{data.extract}</p>
          <a href={data.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
            Read on Wikipedia <ExternalLink className="size-3.5" />
          </a>
        </>
      )}
    </div>
  );
}

export default function ResourceView() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(`/resources/${id}`);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const { item, related, quizzes } = data;
  const isStudent = user.role === 'student';
  const isBookmarked = user.bookmarks?.map(String).includes(item._id);
  const isCompleted = user.completed?.map(String).includes(item._id);

  const toggle = async (kind) => {
    try {
      const r = await api(`/resources/${item._id}/${kind}`, { method: 'POST' });
      const field = kind === 'bookmark' ? 'bookmarks' : 'completed';
      setUser({ ...user, [field]: r[field] });
      toast(kind === 'bookmark' ? (r.active ? 'Saved to bookmarks' : 'Removed from bookmarks') : r.active ? 'Marked as completed 🎉' : 'Marked as not completed');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="size-4" /> Back
      </button>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <div className="card overflow-hidden">
            <div className={`bg-gradient-to-r ${subjectGradient(item.subject)} p-6 text-white sm:p-8`}>
              <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white/20 px-2.5 py-0.5">Class {item.className}</span>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5">{item.subject}</span>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5">{item.topic}</span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">{item.title}</h1>
              {item.description && <p className="mt-2 text-white/85">{item.description}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5"><Eye className="size-4" /> {item.views} views</span>
                <span className="flex items-center gap-1.5"><Clock className="size-4" /> {timeAgo(item.createdAt)}</span>
                {item.createdBy && <span>By {item.createdBy.name}</span>}
                {item.source === 'external' && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">External source</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <TypeBadge type={item.type} />
              <div className="ml-auto flex flex-wrap gap-2">
                {item.type === 'pdf' && (
                  <a href={item.url} download className="btn-secondary py-2">
                    <Download className="size-4" /> Download
                  </a>
                )}
                {isStudent && (
                  <>
                    <button onClick={() => toggle('bookmark')} className="btn-secondary py-2">
                      <Bookmark className={`size-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} /> {isBookmarked ? 'Saved' : 'Save'}
                    </button>
                    <button onClick={() => toggle('complete')} className={`${isCompleted ? 'btn bg-emerald-600 text-white hover:bg-emerald-700' : 'btn-primary'} py-2`}>
                      <CircleCheck className="size-4" /> {isCompleted ? 'Completed' : 'Mark complete'}
                    </button>
                  </>
                )}
              </div>
            </div>
            <Viewer item={item} />
          </div>
        </div>

        <aside className="space-y-6">
          {quizzes.length > 0 && (
            <div className="card p-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <ClipboardList className="size-3.5" /> Practise this topic
              </p>
              <div className="space-y-2">
                {quizzes.map((q) => (
                  <div key={q._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-sm font-semibold">{q.title}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`chip capitalize ${DIFFICULTY[q.difficulty]}`}>{q.difficulty}</span>
                      {isStudent && (
                        <Link to={`/quiz/${q._id}`} className="flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
                          Start <ArrowRight className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {related.length > 0 && (
            <div className="card p-5">
              <p className="mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">More on {item.topic}</p>
              <div className="space-y-1">
                {related.map((r) => (
                  <Link key={r._id} to={`/resource/${r._id}`} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TypeBadge type={r.type} />
                    <span className="truncate">{r.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <WikiPanel topic={item.topic} />
        </aside>
      </div>
    </div>
  );
}
