import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { errorTextClass, inputClass, submitButtonClass } from '../components/forms/formStyles';

export function AuthScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const { error: authError } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    if (mode === 'sign-up') {
      setNotice('Check your email to confirm your account, then sign in.');
    }
  }

  return (
    <div className="app-bg flex min-h-dvh flex-col items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="glass-card anim-fade-rise w-full max-w-sm p-6 shadow-2xl"
      >
        <h1 className="mb-1 text-2xl font-bold text-[var(--text)]">
          {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mb-6 text-xs text-[var(--muted)]">
          Your personal fitness &amp; nutrition tracker
        </p>

        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          autoCapitalize="none"
          className={`${inputClass} mb-3`}
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className={`${inputClass} mb-4`}
        />

        {error ? <p className={errorTextClass}>{error}</p> : null}
        {notice ? <p className="mb-3 text-xs text-emerald-400">{notice}</p> : null}

        <button type="submit" disabled={loading || !email || !password} className={submitButtonClass}>
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : mode === 'sign-in' ? (
            'Sign In'
          ) : (
            'Sign Up'
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setNotice(null);
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
          }}
          className="mt-4 w-full text-center text-xs font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          {mode === 'sign-in'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
