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
  const action = isAdmin ? 'demote' : 'promote';
  const actionLabel = isAdmin ? 'Demote to user' : 'Make admin';

  const handleRoleChange = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, action }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `Failed to ${action} user`);
      }

      setShowConfirm(false);
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : `Failed to ${action} user`);
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
        disabled={isLoading}
        aria-label={isAdmin ? `Demote ${email} to normal user` : `Promote ${email} to admin`}
        data-user-id={userId}
      >
        {isLoading ? (isAdmin ? 'Demoting...' : 'Promoting...') : actionLabel}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm whitespace-normal overflow-hidden rounded-xl border border-border bg-background p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground">
              {isAdmin ? 'Demote admin to normal user?' : 'Promote user to admin?'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground whitespace-normal break-words">
              {isAdmin
                ? 'Are you sure you want to remove admin access from this user?'
                : 'Are you sure you want to promote this user to admin?'}
              <span className="mt-1 block w-full break-all font-medium text-foreground">
                {email}
              </span>
              {isAdmin
                ? 'This user will lose access to admin-only features.'
                : 'This grants full admin access.'}
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
                onClick={handleRoleChange}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${
                  isAdmin ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={isLoading}
              >
                {isLoading
                  ? isAdmin
                    ? 'Demoting...'
                    : 'Promoting...'
                  : isAdmin
                    ? 'Yes, demote'
                    : 'Yes, promote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
