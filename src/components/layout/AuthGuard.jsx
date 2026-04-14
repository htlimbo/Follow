import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { isTauri, getStorageMode } from '../../store';
import Login from '../../pages/Login';

export default function AuthGuard({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading

  // 桌面本地模式不需要登录
  const isLocal = isTauri && getStorageMode() === 'local';

  useEffect(() => {
    if (isLocal) {
      setSession('local');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [isLocal]);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-tertiary text-sm">加载中...</div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return children;
}
