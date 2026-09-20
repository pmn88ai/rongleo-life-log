import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isCloudConfigured } from './supabaseClient.js';

// Single source of truth for auth state (spec v2.2 §32). Three states:
//   'loading'       — briefly, while restoring a session on startup
//   'guest'         — no session (or cloud not configured at all) — the
//                     default, fully-functional local-only mode
//   'authenticated' — a valid Supabase session exists
//
// Capture must never block on this: when cloud isn't configured the status
// resolves to 'guest' synchronously, and even when it is configured, the
// app renders immediately in 'loading' → local data is already on screen
// before auth resolves (see App.jsx).
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState(isCloudConfigured ? 'loading' : 'guest');
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState(null);
  // True only right after an explicit, successful signIn() this session —
  // NOT when a reload simply restores an already-active session. This is
  // what tells App.jsx "show the merge/restore screen now", exactly once,
  // instead of on every startup while already logged in (spec §20).
  const [justSignedIn, setJustSignedIn] = useState(false);

  useEffect(() => {
    if (!isCloudConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setStatus('authenticated');
      } else {
        setStatus('guest');
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        setStatus('authenticated');
      } else {
        setSession(null);
        setUser(null);
        setStatus('guest');
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    if (!isCloudConfigured) {
      const err = 'Chưa cấu hình đám mây cho ứng dụng này.';
      setAuthError(err);
      return { ok: false, error: err };
    }
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const friendly = 'Đăng nhập không thành công.';
      setAuthError(friendly);
      return { ok: false, error: friendly };
    }
    setJustSignedIn(true);
    return { ok: true };
  }

  async function signOut() {
    if (isCloudConfigured) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setStatus('guest');
  }

  function clearJustSignedIn() {
    setJustSignedIn(false);
  }

  return (
    <AuthContext.Provider value={{ status, user, session, authError, isCloudConfigured, signIn, signOut, justSignedIn, clearJustSignedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
