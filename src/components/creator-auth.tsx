import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

const CreatorContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });
export const useCreator = () => useContext(CreatorContext);

export function CreatorProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setReady(true);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        void router.invalidate();
        if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries();
      }
    });
    void supabase.auth.getUser().then(({ data }) => {
      if (active) { setUser(data.user); setReady(true); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [router, queryClient]);
  return <CreatorContext.Provider value={{ user, ready }}>{children}</CreatorContext.Provider>;
}

export function CreatorAccount({ compact = false }: { compact?: boolean }) {
  const { user, ready } = useCreator();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (data.session) setOpen(false); else setMessage('Check your email to confirm your creator account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setOpen(false);
      }
      setPassword('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Sign-in failed.'); }
    finally { setBusy(false); }
  }
  async function google() {
    setBusy(true); setMessage('');
    try {
      const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (!result.redirected) setOpen(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Google sign-in failed.'); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true);
    try {
      await queryClient.cancelQueries(); queryClient.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Sign-out failed.'); setOpen(true); }
    finally { setBusy(false); }
  }
  return <>
    <Button variant="ghost" size={compact ? 'icon' : 'default'} disabled={!ready || busy} title={user ? 'Creator account' : 'Sign in'} aria-label={user ? 'Creator account' : 'Sign in'} onClick={() => { setOpen(true); setMessage(''); }}>
      <LogIn size={16} />{!compact && (user ? 'Creator account' : 'Sign in')}
    </Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-sm rounded-lg">
      <DialogTitle>{user ? 'Creator account' : mode === 'signup' ? 'Join QED Studio' : 'Sign in to QED Studio'}</DialogTitle>
      <DialogDescription>{user ? 'Your publishing account' : 'Creator sign-in'}</DialogDescription>
      {user ? <><p className="break-all text-sm">{user.email}</p><Button variant="outline" disabled={busy} onClick={() => void signOut()}><LogOut size={16}/>Sign out</Button></> : <>
        <Button variant="outline" onClick={() => void google()} disabled={busy}>Continue with Google</Button>
        <form className="grid gap-4" onSubmit={submit}>
          <label className="grid gap-2 text-sm">Email<Input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}/></label>
          <label className="grid gap-2 text-sm">Password<Input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={e => setPassword(e.target.value)}/></label>
          <Button disabled={busy} type="submit">{busy && <Loader2 className="animate-spin" size={16}/>} {mode === 'signup' ? 'Create account' : 'Sign in'}</Button>
        </form>
        <Button variant="ghost" disabled={busy} onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); }}>{mode === 'signup' ? 'Already have an account? Sign in' : 'Create a creator account'}</Button>
      </>}
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </DialogContent></Dialog>
  </>;
}