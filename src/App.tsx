import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from './core/components/layout/AppLayout';
import { ErrorBoundary } from './core/components/common/ErrorBoundary';
import { LoadingScreen } from './core/components/common/LoadingScreen';

const Dashboard = lazy(() => import('./core/pages/Dashboard'));
const Study = lazy(() => import('./core/pages/Study'));
const Lessons = lazy(() => import('./core/pages/Lessons'));
const Explore = lazy(() => import('./core/pages/Explore'));
const Reading = lazy(() => import('./core/pages/Reading'));
const Listening = lazy(() => import('./core/pages/Listening'));
const Speaking = lazy(() => import('./core/pages/Speaking'));
const Writing = lazy(() => import('./core/pages/Writing'));
const Roadmap = lazy(() => import('./core/pages/Roadmap'));
const Settings = lazy(() => import('./core/pages/Settings'));
const PackSelector = lazy(() => import('./core/pages/PackSelector'));
const Placement = lazy(() => import('./core/pages/Placement'));
const ExerciseDebug = import.meta.env.DEV
  ? lazy(() => import('./core/pages/ExerciseDebug'))
  : null;

function Page({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ErrorBoundary inline>{children}</ErrorBoundary>
    </Suspense>
  );
}

export default function App() {
  const basename = import.meta.env.BASE_URL;
  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Page><Dashboard /></Page>} />
            <Route path="/study" element={<Page><Study /></Page>} />
            <Route path="/lessons" element={<Page><Lessons /></Page>} />
            <Route path="/explore" element={<Page><Explore /></Page>} />
            <Route path="/reading" element={<Page><Reading /></Page>} />
            <Route path="/listening" element={<Page><Listening /></Page>} />
            <Route path="/speaking" element={<Page><Speaking /></Page>} />
            <Route path="/writing" element={<Page><Writing /></Page>} />
            <Route path="/roadmap" element={<Page><Roadmap /></Page>} />
            <Route path="/settings" element={<Page><Settings /></Page>} />
            <Route path="/pack-selector" element={<Page><PackSelector /></Page>} />
            <Route path="/placement" element={<Page><Placement /></Page>} />
            {ExerciseDebug && (
              <Route path="/debug/exercises" element={<Page><ExerciseDebug /></Page>} />
            )}
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
