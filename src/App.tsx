import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AtlasShell } from './components/AtlasShell';

type View = 'landing' | 'atlas';

/**
 * Root view switch. The landing page and the atlas share one design language;
 * each mounts its own Three.js scene and disposes it on navigation.
 */
export default function App(): React.ReactElement {
  const [view, setView] = useState<View>('landing');

  return view === 'landing' ? (
    <LandingPage onOpenAtlas={() => setView('atlas')} />
  ) : (
    <AtlasShell onExit={() => setView('landing')} />
  );
}
