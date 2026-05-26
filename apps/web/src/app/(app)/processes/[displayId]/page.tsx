import type { Metadata } from 'next';

import { ProcessDetail } from '@/components/processes/ProcessDetail';
import { ProcessDetailBackLink } from '@/components/processes/ProcessDetailBackLink';

interface PageProps {
  params: Promise<{ displayId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { displayId } = await params;
  return { title: `Süreç ${displayId}` };
}

export default async function ProcessDetailPage({ params }: PageProps) {
  const { displayId } = await params;
  return (
    <div className="space-y-[var(--space-6)]">
      <ProcessDetail displayId={displayId} />
      <ProcessDetailBackLink />
    </div>
  );
}
