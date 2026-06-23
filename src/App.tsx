import React, { useEffect, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AtlasShell } from './components/AtlasShell';
import { BlogPage } from './components/blog/BlogPage';

type View = 'landing' | 'atlas' | 'blog';

function viewFromPath(path: string): View {
  return path.startsWith('/blog') ? 'blog' : 'landing';
}

/**
 * Root view switch. The landing page and the atlas share one design language;
 * each mounts its own Three.js scene and disposes it on navigation. The journal
 * lives under /blog and is reachable directly as an indexable URL.
 */
export default function App(): React.ReactElement {
  const [view, setView] = useState<View>(() =>
    typeof window === 'undefined' ? 'landing' : viewFromPath(window.location.pathname),
  );

  // Honor browser back/forward between the journal and the landing page.
  useEffect(() => {
    const onPop = (): void => setView(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goHome = (): void => {
    window.history.pushState({}, '', '/');
    setView('landing');
  };

  if (view === 'blog') {
    const path = window.location.pathname;
    const slug = path.startsWith('/blog/') ? decodeURIComponent(path.slice('/blog/'.length)) : null;
    return <BlogPage slug={slug} onHome={goHome} />;
  }
  return view === 'atlas' ? (
    <AtlasShell onExit={() => setView('landing')} />
  ) : (
    <LandingPage onOpenAtlas={() => setView('atlas')} />
  );
}
