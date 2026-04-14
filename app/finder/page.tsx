'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/components/SubscriptionContext';

export default function FinderPage() {
  const { status } = useSubscription();
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any[]>([]);

  // Show loading state while subscription status is being fetched
  if (status === null) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // Block non-premium users
  if (status !== 'premium') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Premium Feature</h1>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          The Spot Finder is available to premium subscribers only. Upgrade your plan to get
          AI-powered spot recommendations near you.
        </p>
        <Link
          href="/pricing"
          className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          View Pricing
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const geoData = await geoRes.json();
      if (!geoData[0]) throw new Error('Location not found. Try a more specific address.');
      const { lat, lon } = geoData[0];

      const params = new URLSearchParams({ lat, lon, description });
      const apiRes = await fetch(`/api/route-spots?${params}`);
      if (!apiRes.ok) {
        const body = await apiRes.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to fetch spots');
      }
      const spots = await apiRes.json();
      if (spots.length === 0) throw new Error('No spots found matching your description.');
      setResults(spots);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Spot Finder</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Describe what you&apos;re looking for and we&apos;ll find the nearest matching spots.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground">
              Preferred Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Downtown Halifax, Spring Garden Road, Citadel Hill"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground">
              What are you looking for?
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Describe the kind of spot you want in your own words.
            </p>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="e.g. I want to skate ledges and manny pads"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Finding spots…' : 'Find Spots'}
          </button>
        </form>

        {results.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Suggested Spots</h2>
            <ul className="space-y-3">
              {results.map((spot) => (
                <li
                  key={spot.id}
                  className="rounded-lg border border-border bg-background px-4 py-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{spot.name}</span>
                    <div className="flex gap-1">
                      <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground capitalize">
                        {spot.spot_type}
                      </span>
                      {spot.street_feature && (
                        <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground capitalize">
                          {spot.street_feature}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {spot.address ?? spot.city ?? ''}
                  </p>
                  {spot.distance != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ~{spot.distance.toFixed(1)} km away
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
