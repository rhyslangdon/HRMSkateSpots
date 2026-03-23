'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

// Types
export type SubscriptionStatus = 'free' | 'premium' | null;

interface SubscriptionContextType {
  status: SubscriptionStatus;
  setStatus: (status: SubscriptionStatus) => void;
  refreshStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SubscriptionStatus>(null);

  // Fetch subscription status from Supabase
  const refreshStatus = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus(null);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();
    setStatus(profile?.subscription_status || 'free');
  };

  useEffect(() => {
    // Avoid calling setState synchronously in the effect body
    (async () => {
      await refreshStatus();
    })();
    // Listen for auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshStatus();
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ status, setStatus, refreshStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
