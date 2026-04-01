'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: formData.password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-foreground">Password updated!</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <button
            onClick={() => {
              router.push('/dashboard');
              router.refresh();
            }}
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              New password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm new password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Updating password…' : 'Update password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:text-primary/90">
            &larr; Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
