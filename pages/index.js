// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Eingeloggt → Dashboard
        router.replace('/dashboard');
      } else {
        // Nicht eingeloggt → Login-Seite
        router.replace('/login');
      }
    });
  }, [router]);

  return <p className="p-4 text-center">Lade …</p>;
}
