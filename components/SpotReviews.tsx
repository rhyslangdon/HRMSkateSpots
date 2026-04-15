'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Review, Skateability } from '@/types';

interface SpotReviewsProps {
  spotId: string;
  userId: string | null;
}

function formatSkateability(value: Skateability) {
  return value === 'skateable' ? 'Skateable' : 'Not Skateable';
}

export default function SpotReviews({ spotId, userId }: SpotReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    skateability: 'skateable' as Skateability,
    comment: '',
  });

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/reviews?spotId=${encodeURIComponent(spotId)}`);
      const payload = (await res.json()) as { data?: Review[]; message?: string };

      if (!res.ok) {
        throw new Error(payload.message || 'Could not load reviews.');
      }

      setReviews(payload.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [spotId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    const existingReview = reviews.find((review) => review.user_id === userId);

    if (existingReview) {
      setReviewForm({
        skateability: existingReview.skateability,
        comment: existingReview.comment ?? '',
      });
      return;
    }

    setReviewForm({
      skateability: 'skateable',
      comment: '',
    });
  }, [reviews, userId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spot_id: spotId,
          skateability: reviewForm.skateability,
          comment: reviewForm.comment,
        }),
      });

      const payload = (await res.json()) as { message?: string };

      if (!res.ok) {
        throw new Error(payload.message || 'Could not save review.');
      }

      await loadReviews();
      setIsFormOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save review.');
    } finally {
      setSaving(false);
    }
  }

  const skateableCount = reviews.filter((review) => review.skateability === 'skateable').length;
  const notSkateableCount = reviews.length - skateableCount;
  const existingUserReview = reviews.find((review) => review.user_id === userId);

  return (
    <div className="relative mt-2 border-t border-border pt-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-foreground">Reviews</p>
        {!loading && reviews.length > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-700">
              Skateable {skateableCount}
            </span>
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-medium text-rose-700">
              Not Skateable {notSkateableCount}
            </span>
          </div>
        )}
      </div>

      {userId ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsFormOpen((current) => !current);
            }}
            className="min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted sm:min-h-0 sm:py-1.5"
          >
            {existingUserReview ? 'Edit Review' : 'Add Review'}
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Log in to leave a review.</p>
      )}

      {isFormOpen && userId && (
        <div className="absolute inset-x-0 top-14 z-20 rounded-md border border-border bg-background p-2 shadow-lg sm:top-12 sm:p-2.5">
          <form onSubmit={handleSubmit} className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Leave a review</p>
            <select
              value={reviewForm.skateability}
              onChange={(event) =>
                setReviewForm((current) => ({
                  ...current,
                  skateability: event.target.value as Skateability,
                }))
              }
              className="min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground sm:min-h-0 sm:py-1.5"
            >
              <option value="skateable">Skateable</option>
              <option value="not_skateable">Not Skateable</option>
            </select>
            <textarea
              value={reviewForm.comment}
              onChange={(event) =>
                setReviewForm((current) => ({ ...current, comment: event.target.value }))
              }
              rows={2}
              maxLength={250}
              placeholder="Leave a short review (optional)"
              className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground sm:py-1.5"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="min-h-9 flex-1 rounded-md bg-primary px-2.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:min-h-0 sm:py-1.5"
              >
                {saving ? 'Saving…' : 'Save Review'}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="min-h-9 flex-1 rounded-md border border-border px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted sm:min-h-0 sm:py-1.5"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="mt-2 text-xs text-muted-foreground">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="mt-2 max-h-36 space-y-2 overflow-y-auto pr-1">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-md border border-border bg-muted/40 p-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    review.skateability === 'skateable'
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : 'bg-rose-500/15 text-rose-700'
                  }`}
                >
                  {formatSkateability(review.skateability)}
                </span>
                <span className="text-xs text-muted-foreground">{review.reviewer_name}</span>
              </div>
              {review.comment && (
                <p className="mt-1 whitespace-pre-line break-words text-xs text-foreground">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
