'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function UnauthorizedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const attemptedPath = searchParams.get('unauthorized_access');
    if (!attemptedPath) return;

    toast.error('Access Denied', {
      description: `You are not authorized to access ${attemptedPath}.`,
      duration: 5000,
    });

    // Remove the query param from the URL without a page reload
    const params = new URLSearchParams(searchParams.toString());
    params.delete('unauthorized_access');
    const newUrl = params.size > 0 ? `/?${params.toString()}` : '/';
    router.replace(newUrl);
  }, [searchParams, router]);

  return null;
}
