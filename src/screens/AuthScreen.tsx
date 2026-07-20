import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabaseClient';

export function AuthScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit() {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#EAECEF] justify-center px-6"
    >
      <View className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100/50">
        <Text className="text-2xl font-bold text-gray-900 mb-1">
          {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
        </Text>
        <Text className="text-xs text-gray-400 mb-6">
          Your personal fitness &amp; nutrition tracker
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          className="bg-gray-50/60 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-900 mb-3"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          className="bg-gray-50/60 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-900 mb-4"
        />

        {error ? (
          <Text className="text-xs text-red-600 mb-3">{error}</Text>
        ) : null}
        {notice ? (
          <Text className="text-xs text-emerald-600 mb-3">{notice}</Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={loading || !email || !password}
          className="bg-black rounded-full py-3.5 items-center disabled:opacity-40"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-sm font-semibold">
              {mode === 'sign-in' ? 'Sign In' : 'Sign Up'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setError(null);
            setNotice(null);
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
          }}
          className="mt-4 items-center"
        >
          <Text className="text-xs font-semibold text-teal-600">
            {mode === 'sign-in'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
