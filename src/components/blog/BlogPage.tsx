import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock, ChevronLeft } from 'lucide-react';

interface PostMeta {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  createdAt: string;
  author: string;
  generator: string;
  readingMinutes: number;
}
interface Post extends PostMeta {
  body: string;
}

interface Props {
  /** Initial article slug from the URL, if any. */
  slug: string | null;
  onHome: () => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * The Bio Galaxy journal. Lists every published article and opens any one of them
 * as a full read. Navigation uses the History API so each article has its own
 * shareable, indexable URL under /blog.
 */
export const BlogPage: React.FC<Props> = ({ slug, onHome }) => {
  const [posts, setPosts] = useState<PostMeta[] | null>(null);
  const [active, setActive] = useState<Post | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(slug);
  const [error, setError] = useState<string | null>(null);

  // Keep the open article in sync with browser back/forward navigation.
  useEffect(() => {
    const onPop = (): void => {
      const path = window.location.pathname;
      setActiveSlug(path.startsWith('/blog/') ? decodeURIComponent(path.slice('/blog/'.length)) : null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/blog')
      .then((r) => r.json())
      .then((data: { posts: PostMeta[] }) => { if (!cancelled) setPosts(data.posts ?? []); })
      .catch(() => { if (!cancelled) setError('The journal could not be loaded.'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeSlug) { setActive(null); return; }
    let cancelled = false;
    setActive(null);
    fetch(`/api/blog/${encodeURIComponent(activeSlug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((post: Post) => { if (!cancelled) setActive(post); })
      .catch(() => { if (!cancelled) setError('That article could not be found.'); });
    return () => { cancelled = true; };
  }, [activeSlug]);

  const openPost = (s: string): void => {
    window.history.pushState({}, '', `/blog/${s}`);
    setActiveSlug(s);
    setError(null);
    window.scrollTo(0, 0);
  };
  const backToList = (): void => {
    window.history.pushState({}, '', '/blog');
    setActiveSlug(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
        <button onClick={onHome} className="flex items-center gap-1.5 rounded-sm border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200">
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Home
        </button>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#27c4d9]" aria-hidden /><span className="text-[13px] font-semibold tracking-tight">Bio Galaxy Journal</span></div>
        <span className="w-16" />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {error && !active && <p className="rounded-md border border-rose-500/30 bg-rose-500/10 p-4 text-[13px] text-rose-200">{error}</p>}

        {active ? (
          <article>
            <button onClick={backToList} className="mb-6 inline-flex items-center gap-1.5 text-[12px] text-slate-400 transition hover:text-cyan-300"><ArrowLeft className="h-3.5 w-3.5" /> All articles</button>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{active.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(active.createdAt)}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {active.readingMinutes} min read</span>
              <span>{active.author}</span>
            </div>
            <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-slate-300">
              {active.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
            </div>
            {active.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {active.tags.map((t) => <span key={t} className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">{t}</span>)}
              </div>
            )}
          </article>
        ) : (
          <>
            <div className="mb-10">
              <span className="meta-label rounded-full border border-white/10 bg-[#02040a]/50 px-3 py-1">Daily, quality-controlled, never repeated</span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">The Bio Galaxy Journal</h1>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-400">Field notes on the platform and the science behind it. A fresh article publishes every day at a different time, each one checked for originality and house style before it goes live.</p>
            </div>

            {posts === null && !error && <p className="text-[13px] text-slate-500">Loading the journal…</p>}
            {posts && posts.length === 0 && <p className="text-[13px] text-slate-500">No articles yet. The next one is on its way.</p>}

            <div className="space-y-4">
              {posts?.map((post) => (
                <button key={post.slug} onClick={() => openPost(post.slug)} className="block w-full rounded-lg border border-white/10 bg-white/[0.015] p-5 text-left transition hover:border-cyan-500/40 hover:bg-cyan-500/[0.04]">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(post.createdAt)}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.readingMinutes} min</span>
                  </div>
                  <h2 className="mt-2 text-[18px] font-semibold text-slate-100">{post.title}</h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{post.summary}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
      <footer className="border-t border-white/10 px-6 py-6 text-center"><span className="meta-label">Bio Galaxy Journal · Articles are quality-checked for originality and house style</span></footer>
    </div>
  );
};
