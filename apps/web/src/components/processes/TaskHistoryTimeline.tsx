'use client';

import { useState } from 'react';

import { Button, Card } from '@/components/base';
import { ActionPerformerLine } from '@/components/shared/ActionPerformerLine';
import { STEP_LABEL_MAP } from '@/lib/step-labels';
import type { TaskPreviousTask } from '@/lib/queries/tasks';
import type { ProcessTaskItem } from '@/lib/queries/processes';

import { KtiFormDataModal } from './KtiFormDataModal';

function hasNonEmptyFormPayload(data: unknown): boolean {
  if (data === null || data === undefined) return false;
  if (typeof data !== 'object' || Array.isArray(data)) return false;
  return Object.keys(data as object).length > 0;
}

/** Yönetici onay adımında salt aksiyon vardır; form önizleme gösterilmez. */
function shouldShowFormButton(pt: TaskPreviousTask): boolean {
  if (pt.stepKey === 'KTI_MANAGER_APPROVAL') return false;
  return hasNonEmptyFormPayload(pt.formData);
}

function toModalTask(pt: TaskPreviousTask): ProcessTaskItem {
  return {
    id: pt.stepKey,
    stepKey: pt.stepKey,
    stepOrder: 0,
    status: 'COMPLETED',
    createdAt: pt.completedAt ?? '1970-01-01T00:00:00.000Z',
    completedAt: pt.completedAt,
    completionAction: pt.completionAction ?? null,
    completedBy: pt.completedBy ?? undefined,
    formData: pt.formData,
  };
}

interface TaskHistoryTimelineProps {
  previousTasks: TaskPreviousTask[];
}

export function TaskHistoryTimeline({ previousTasks }: TaskHistoryTimelineProps) {
  const [modalTask, setModalTask] = useState<ProcessTaskItem | null>(null);

  if (previousTasks.length === 0) return null;

  return (
    <>
      <ol className="relative space-y-[var(--space-4)] border-l border-[var(--color-neutral-200)] pl-[var(--space-5)]">
        {previousTasks.map((pt, idx) => {
          const displayLabel = STEP_LABEL_MAP[pt.stepKey] ?? pt.stepLabel;
          const showFormButton = shouldShowFormButton(pt);
          return (
            <li key={`${pt.stepKey}-${idx}`} className="relative">
              <span
                className="absolute -left-[calc(var(--space-5)+5px)] mt-1.5 h-2.5 w-2.5 rounded-full border border-[var(--color-success-300)] bg-[var(--color-success-100)]"
                aria-hidden
              />
              <Card className="space-y-[var(--space-3)] p-[var(--space-4)]">
                <div className="flex flex-wrap items-start justify-between gap-[var(--space-2)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-neutral-900)]">
                      {displayLabel}
                    </p>
                    <p className="text-xs text-[var(--color-neutral-500)]">Tamamlandı</p>
                  </div>
                  {pt.completedAt ? (
                    <time
                      className="text-xs text-[var(--color-neutral-500)]"
                      dateTime={pt.completedAt}
                    >
                      {new Date(pt.completedAt).toLocaleString('tr-TR')}
                    </time>
                  ) : null}
                </div>
                <ActionPerformerLine
                  roleLabel="Tamamlayan"
                  performerDisplayLabel={pt.performerDisplayLabel}
                  performedViaImpersonation={pt.performedViaImpersonation}
                  user={pt.completedBy}
                />
                {pt.completionAction ? (
                  <p className="text-xs text-[var(--color-neutral-600)]">
                    İşlem: {pt.completionAction}
                  </p>
                ) : null}
                {showFormButton ? (
                  <div>
                    <Button
                      color="secondary"
                      size="sm"
                      onPress={() => setModalTask(toModalTask(pt))}
                    >
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
