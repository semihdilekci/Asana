'use client';

import { useState } from 'react';

import { Button, ButtonLink, Card } from '@/components/base';
import { ActionPerformerLine } from '@/components/shared/ActionPerformerLine';
import { STEP_LABEL_MAP } from '@/lib/step-labels';
import type { ProcessTaskItem } from '@/lib/queries/processes';
import { useAuthStore } from '@/stores/auth-store';

import { KtiFormDataModal } from './KtiFormDataModal';

export { STEP_LABEL_MAP };

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  CLAIMED: 'Üstlenildi',
  IN_PROGRESS: 'Devam ediyor',
  COMPLETED: 'Tamamlandı',
  SKIPPED_BY_ROLLBACK: 'Geri alma ile atlandı',
  SKIPPED_BY_PEER: 'Eş atama ile atlandı',
  SKIPPED: 'Atlandı',
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function hasNonEmptyFormPayload(data: unknown): boolean {
  if (data === null || data === undefined) return false;
  if (typeof data !== 'object' || Array.isArray(data)) return false;
  return Object.keys(data as object).length > 0;
}

/** Yönetici onay adımında salt aksiyon (onay/red) vardır; form önizleme gösterilmez. */
function shouldShowFormDataButton(task: ProcessTaskItem): boolean {
  if (task.stepKey === 'KTI_MANAGER_APPROVAL') return false;
  return hasNonEmptyFormPayload(task.formData);
}

const ACTIVE_STATUSES = new Set(['PENDING', 'CLAIMED', 'IN_PROGRESS']);

function compareTasksChronologically(a: ProcessTaskItem, b: ProcessTaskItem): number {
  const ca = a.createdAt ?? '';
  const cb = b.createdAt ?? '';
  if (ca && cb) {
    const t = ca.localeCompare(cb);
    if (t !== 0) return t;
  }
  return a.id.localeCompare(b.id);
}

export function ProcessTimeline({ tasks }: { tasks: ProcessTaskItem[] }) {
  const [modalTask, setModalTask] = useState<ProcessTaskItem | null>(null);
  const currentUserId = useAuthStore((s) => s.currentUser?.id);
  const orderedTasks = [...tasks].sort(compareTasksChronologically);

  return (
    <>
      <ol className="relative space-y-[var(--space-4)] border-l border-[var(--color-neutral-200)] pl-[var(--space-5)]">
        {orderedTasks.map((task) => {
          const showFormButton = shouldShowFormDataButton(task);
          const displayLabel = STEP_LABEL_MAP[task.stepKey] ?? task.stepKey;
          const isAssignedToMe =
            !!currentUserId &&
            !!(task.assignedTo?.id === currentUserId || task.isAssignedToCurrentUser);
          const showGoToTask = isAssignedToMe && ACTIVE_STATUSES.has(task.status);
          const timelineStamp = task.completedAt ?? task.createdAt;
          return (
            <li key={task.id} className="relative">
              <span
                className="absolute -left-[calc(var(--space-5)+5px)] mt-1.5 h-2.5 w-2.5 rounded-full border border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)]"
                aria-hidden
              />
              <Card className="space-y-[var(--space-3)] p-[var(--space-4)]">
                <div className="flex flex-wrap items-start justify-between gap-[var(--space-2)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-neutral-900)]">
                      {displayLabel}
                    </p>
                    <p className="text-xs text-[var(--color-neutral-500)]">
                      Adım {task.stepOrder} · {statusLabel(task.status)}
                    </p>
                  </div>
                  <div className="flex items-center gap-[var(--space-2)]">
                    {timelineStamp ? (
                      <time
                        className="text-xs text-[var(--color-neutral-500)]"
                        dateTime={timelineStamp}
                      >
                        {new Date(timelineStamp).toLocaleString('tr-TR')}
                      </time>
                    ) : null}
                    {showGoToTask ? (
                      <ButtonLink
                        href={`/tasks/${encodeURIComponent(task.id)}`}
                        color="secondary"
                        size="sm"
                      >
                        Göreve Git
                      </ButtonLink>
                    ) : null}
                  </div>
                </div>
                {task.assignedTo ? (
                  <p className="text-sm text-[var(--color-neutral-700)]">
                    Atanan: {task.assignedTo.firstName} {task.assignedTo.lastName}
                    {task.assignedTo.sicil ? ` · Sicil ${task.assignedTo.sicil}` : ''}
                  </p>
                ) : null}
                <ActionPerformerLine
                  roleLabel="Tamamlayan"
                  performerDisplayLabel={task.performerDisplayLabel}
                  performedViaImpersonation={task.performedViaImpersonation}
                  user={task.completedBy}
                />
                {task.completionAction ? (
                  <p className="text-xs text-[var(--color-neutral-600)]">
                    İşlem: {task.completionAction}
                  </p>
                ) : null}
                {task.slaDueAt ? (
                  <p className="text-xs text-[var(--color-neutral-600)]">
                    SLA: {new Date(task.slaDueAt).toLocaleString('tr-TR')}
                  </p>
                ) : null}
                {showFormButton ? (
                  <div>
                    <Button color="secondary" size="sm" onPress={() => setModalTask(task)}>
                      Form Detayını Görüntüle
                    </Button>
                  </div>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ol>
      {modalTask ? <KtiFormDataModal task={modalTask} onClose={() => setModalTask(null)} /> : null}
    </>
  );
}
