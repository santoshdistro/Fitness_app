import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EAECEF] px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[2rem] border border-gray-100/50 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-bold text-gray-900">
          {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mb-6 text-xs text-gray-400">
          Your personal fitness &amp; nutrition tracker
        </p>

        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          autoCapitalize="none"
          className="mb-3 w-full rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300"
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="mb-4 w-full rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300"
        />

        {error ? <p className="mb-3 text-xs text-red-600">{error}</p> : null}
        {notice ? <p className="mb-3 text-xs text-emerald-600">{notice}</p> : null}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="flex w-full items-center justify-center rounded-full bg-black py-3.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
          className="mt-4 w-full text-center text-xs font-semibold text-teal-600"
        >
          {mode === 'sign-in'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
