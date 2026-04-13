import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Login from '../../pages/Login';

export default function AuthGuard({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading state
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-tertiary text-sm">加载中...</div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <Login />;
  }

  return children;
}
