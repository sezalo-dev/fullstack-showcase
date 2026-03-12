'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createConversation } from '@/lib/api';

interface ContactButtonProps {
  listingId: string;
  className?: string;
}

export function ContactButton({ listingId, className = 'btn-primary' }: ContactButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const { user, session, loading } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleContact = async () => {
    if (loading) {
      return;
    }

    // Redirect to login if not authenticated
    if (!user || !session) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      router.push(`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`);
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const accessToken = session.access_token;
      if (!accessToken) {
        throw new Error(t('common.error'));
      }

      const conversation = await createConversation(listingId, accessToken);
      
      if (!conversation) {
        throw new Error(t('common.error'));
      }

      // Redirect to messages page with conversation ID
      router.push(`/dashboard/messages/${conversation.id}`);
    } catch (err) {
      const errorMessage = (err as Error).message || t('common.error');
      setError(errorMessage);
      console.error('Error creating conversation:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleContact}
        disabled={isCreating || loading}
        className={className}
      >
        {isCreating ? t('common.loading') || 'Lädt...' : t('listing.contact')}
      </button>
      {error && (
        <p className="text-sm mt-2" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
