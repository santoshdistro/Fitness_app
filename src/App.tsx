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

  if (initializing) {
    return (
      <div className="app-bg flex min-h-dvh items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]" />
      </div>
    );
  }

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
