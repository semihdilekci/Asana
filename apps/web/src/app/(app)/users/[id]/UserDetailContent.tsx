'use client';

import { Alert, Button, Card } from '@/components/base';
import { UserDetailCard } from '@/components/users/UserDetailCard';
import { useUserQuery } from '@/lib/queries/users';

interface UserDetailContentProps {
  userId: string;
}

export function UserDetailContent({ userId }: UserDetailContentProps) {
  const { data: user, isLoading, error, refetch } = useUserQuery(userId);

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" aria-busy className="space-y-[var(--space-4)]">
        <span className="sr-only">Kullanıcı yükleniyor...</span>
        <div className="h-10 w-64 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]" />
        <Card className="h-48 animate-pulse p-[var(--space-6)] bg-[var(--color-neutral-50)]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        <p>Kullanıcı yüklenemedi.</p>
        <Button
          color="secondary"
          size="sm"
          className="mt-[var(--space-2)]"
          onPress={() => void refetch()}
        >
          Tekrar dene
        </Button>
      </Alert>
    );
  }

  if (!user) {
    return <Alert variant="error">Kullanıcı bulunamadı.</Alert>;
  }

  return <UserDetailCard user={user} />;
}
