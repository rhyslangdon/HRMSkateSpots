import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Spot } from '@/types';

// Helper to get subscription status for a user
async function getSubscriptionStatus(userId: string | null): Promise<'free' | 'premium'> {
  if (!userId) return 'free';
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .single();
  return (profile?.subscription_status as 'free' | 'premium') || 'free';
}

export interface Favourite {
  id: string;
  user_id: string;
  spot_id: string;
  created_at: string;
}

export function useFavourites(userId: string | null) {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      // Avoid calling setState synchronously in effect body
      Promise.resolve().then(() => setFavourites([]));
      return;
    }
    Promise.resolve().then(() => setLoading(true));
    const supabase = createClient();
    supabase
      .from('favourites')
      .select('*')
      .eq('user_id', userId)
      .then(({ data }) => {
        setFavourites(data || []);
        setLoading(false);
      });
  }, [userId]);

  const addFavourite = async (spotId: string) => {
    // Check if user is free and already has 5 favourites
    const status = await getSubscriptionStatus(userId);
    if (status === 'free' && favourites.length >= 5) {
      return {
        data: null,
        error: { message: 'Free users can only have up to 5 favourite spots.' },
      };
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from('favourites')
      .insert([{ user_id: userId, spot_id: spotId }])
      .select();
    if (!error && data) setFavourites((prev) => [...prev, ...data]);
    return { data, error };
  };

  const removeFavourite = async (spotId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('favourites')
      .delete()
      .eq('user_id', userId)
      .eq('spot_id', spotId);
    if (!error) setFavourites((prev) => prev.filter((f) => f.spot_id !== spotId));
    return { error };
  };

  const isFavourite = (spotId: string) => favourites.some((f) => f.spot_id === spotId);

  return { favourites, loading, addFavourite, removeFavourite, isFavourite };
}
