import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import { AppShell } from './navigation/AppShell';

function AppContent() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="app-bg flex min-h-dvh items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent)]" />
      </div>
    );
  }

  return session ? <AppShell /> : <AuthScreen />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
