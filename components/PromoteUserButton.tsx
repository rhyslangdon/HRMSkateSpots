'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PromoteUserButtonProps {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export default function PromoteUserButton({ userId, email, isAdmin }: PromoteUserButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handlePromote = async () => {
    if (isAdmin || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || 'Failed to promote user');
      }

      setShowConfirm(false);
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to promote user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => {
          setError('');
          setShowConfirm(true);
        }}
        disabled={isAdmin || isLoading}
        aria-label={isAdmin ? `${email} is already admin` : `Promote ${email} to admin`}
        data-user-id={userId}
      >
        {isAdmin ? 'Already admin' : isLoading ? 'Promoting...' : 'Make admin'}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm whitespace-normal overflow-hidden rounded-xl border border-border bg-background p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground">Promote user to admin?</h3>
            <p className="mt-2 text-sm text-muted-foreground whitespace-normal break-words">
              Are you sure you want to promote this user to admin?
              <span className="mt-1 block w-full break-all font-medium text-foreground">
                {email}
              </span>
              This grants full admin access.
            </p>
            {error && (
              <p className="mt-3 text-sm text-red-600 whitespace-normal break-words">{error}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePromote}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                disabled={isLoading}
              >
                {isLoading ? 'Promoting...' : 'Yes, promote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
