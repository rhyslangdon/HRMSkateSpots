'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/components/ThemeContext';

export default function AppToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        duration: 3000,
        classNames: {
          toast: 'app-toast',
          title: 'app-toast-title',
          description: 'app-toast-description',
          closeButton: 'app-toast-close',
        },
      }}
    />
  );
}
