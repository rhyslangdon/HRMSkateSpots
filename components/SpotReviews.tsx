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
    <div className="rounded-xl border border-border bg-background p-3 sm:mt-2 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-foreground">Reviews</p>
        {!loading && reviews.length > 0 && (
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-medium text-emerald-700">
              Skateable {skateableCount}
            </span>
            <span className="rounded-full bg-rose-500/15 px-2.5 py-1 font-medium text-rose-700">
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
            className="min-h-10 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted sm:min-h-9 sm:rounded-md sm:px-2.5 sm:py-2 sm:text-xs"
          >
            {existingUserReview ? 'Edit Review' : 'Add Review'}
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground sm:text-xs">Log in to leave a review.</p>
      )}

      {isFormOpen && userId && (
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm font-semibold text-foreground sm:text-xs">Leave a review</p>
            <select
              value={reviewForm.skateability}
              onChange={(event) =>
                setReviewForm((current) => ({
                  ...current,
                  skateability: event.target.value as Skateability,
                }))
              }
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground sm:min-h-9 sm:rounded-md sm:px-2.5 sm:py-2 sm:text-xs"
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
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground sm:rounded-md sm:px-2.5 sm:py-2 sm:text-xs"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="min-h-11 flex-1 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:min-h-9 sm:rounded-md sm:px-2.5 sm:py-2 sm:text-xs"
              >
                {saving ? 'Saving…' : 'Save Review'}
              </button>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted sm:min-h-9 sm:rounded-md sm:px-2.5 sm:py-2 sm:text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground sm:mt-2 sm:text-xs">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground sm:mt-2 sm:text-xs">No reviews yet.</p>
      ) : (
        <div className="mt-3 max-h-52 space-y-2.5 overflow-y-auto pr-1 sm:mt-2 sm:max-h-36 sm:space-y-2">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border bg-muted/35 p-3 sm:rounded-md sm:p-2"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium sm:px-2 sm:py-0.5 sm:text-[10px] ${
                    review.skateability === 'skateable'
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : 'bg-rose-500/15 text-rose-700'
                  }`}
                >
                  {formatSkateability(review.skateability)}
                </span>
                <span className="text-xs text-muted-foreground sm:text-xs">
                  {review.reviewer_name || 'Anonymous'}
                </span>
              </div>
              {review.comment && (
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-foreground sm:mt-1 sm:text-xs">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-500 sm:mt-2 sm:text-xs">{error}</p>}
    </div>
  );
}
