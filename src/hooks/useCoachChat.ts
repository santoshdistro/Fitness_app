import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatCoach, type ChatMessage } from '../lib/aiClient';

// Persist the coach conversation locally (per user) until the user clears it.
function storageKey(userId: string): string {
  return `coach_chat:${userId}`;
}

export function useCoachChat() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!userId) {
      setMessages([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(userId));
      setMessages(raw ? (JSON.parse(raw) as ChatMessage[]) : []);
    } catch {
      setMessages([]);
    }
  }, [userId]);

  const persist = useCallback(
    (next: ChatMessage[]) => {
      setMessages(next);
      if (userId) localStorage.setItem(storageKey(userId), JSON.stringify(next));
    },
    [userId],
  );

  const send = useCallback(
    async (text: string, context: string) => {
      const trimmed = text.trim();
      if (!userId || !trimmed || sending) return;
      const base = [...messages, { role: 'user' as const, content: trimmed }];
      persist(base);
      setSending(true);
      try {
        const { reply } = await chatCoach(userId, { context, messages: base });
        persist([...base, { role: 'assistant', content: reply }]);
      } catch {
        persist([
          ...base,
          { role: 'assistant', content: "⚠️ I couldn't reach the coach just now — try again in a moment." },
        ]);
      } finally {
        setSending(false);
      }
    },
    [userId, messages, persist, sending],
  );

  const clear = useCallback(() => {
    if (userId) localStorage.removeItem(storageKey(userId));
    setMessages([]);
  }, [userId]);

  return { messages, sending, send, clear };
}
