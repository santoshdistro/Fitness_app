import { useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import { AppShell } from './navigation/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useOnlineStatus } from './hooks/useOnlineStatus';

function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-[#b45309] px-4 py-2 text-center text-[11px] font-semibold text-white">
      <WifiOff size={13} />
      You're offline — changes may not save until you reconnect.
    </div>
  );
}

function SessionExpiredToast() {
  const { sessionExpired, session, dismissExpired } = useAuth();
  // Only worth showing once we're actually back on the auth screen.
  if (!sessionExpired || session) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-[var(--accent)] px-4 py-2 text-center text-[11px] font-semibold text-white">
      Your session expired — please sign in again.
      <button type="button" onClick={dismissExpired} aria-label="Dismiss" className="ml-1">
        <X size={13} />
      </button>
    </div>
  );
}

function AppContent() {
  const { session, initializing } = useAuth();

  // The splash in index.html has covered the screen since the first paint — the
  // bundle download, React mounting, and this auth check all happen behind it.
  // Lift it once there is something real underneath, so the app arrives in one
  // move instead of blank screen → spinner → app.
  useEffect(() => {
    if (initializing) return;
    const splash = document.getElementById('splash');
    if (!splash) return;
    splash.classList.add('is-done');
    const done = setTimeout(() => splash.remove(), 520);
    return () => clearTimeout(done);
  }, [initializing]);

  // Nothing to draw yet, and the splash is still on top of it.
  if (initializing) return null;

  return session ? <AppShell /> : <AuthScreen />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OfflineBanner />
        <SessionExpiredToast />
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
