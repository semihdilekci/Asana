'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { Loading01 } from '@untitledui/icons';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button, Card, inputClassName } from '@/components/base';
import type { TaskDetail } from '@/lib/queries/tasks';
import { useTaskClaimMutation, useTaskCompleteMutation } from '@/lib/queries/tasks';

import { KtiRevisionTaskForm } from './KtiRevisionTaskForm';

const KTI_MANAGER = 'KTI_MANAGER_APPROVAL';
const KTI_REVISION = 'KTI_REVISION';

const managerFormSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT', 'REQUEST_REVISION']),
    reason: z.string().optional(),
    comment: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'REJECT' || data.action === 'REQUEST_REVISION') {
      const r = data.reason?.trim() ?? '';
      if (r.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reason'],
          message: 'Gerekçe en az 10 karakter olmalıdır',
        });
      }
    }
  });

type ManagerFormValues = z.infer<typeof managerFormSchema>;

interface TaskActionsProps {
  task: TaskDetail;
  onRefetch: () => void;
}

export function TaskActions({ task, onRefetch }: TaskActionsProps) {
  const router = useRouter();
  const claimMutation = useTaskClaimMutation(task.id);
  const completeMutation = useTaskCompleteMutation(task.id, task.process.displayId);

  const defaultAction =
    (task.allowedActions.includes('APPROVE')
      ? 'APPROVE'
      : (task.allowedActions[0] as ManagerFormValues['action'] | undefined)) ?? 'APPROVE';

  const managerForm = useForm<ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: {
      action: defaultAction,
      reason: '',
      comment: '',
    },
  });

  const showClaim = task.assignmentMode === 'CLAIM' && task.status === 'PENDING';
  const showManagerPanel =
    task.stepKey === KTI_MANAGER &&
    (task.status === 'PENDING' || task.status === 'CLAIMED' || task.status === 'IN_PROGRESS') &&
    task.allowedActions.length > 0 &&
    !(task.assignmentMode === 'CLAIM' && task.status === 'PENDING');
  const showRevision = task.stepKey === KTI_REVISION && task.status === 'PENDING';
  const readOnlyCompleted =
    task.status === 'COMPLETED' ||
    task.status === 'SKIPPED_BY_PEER' ||
    task.status === 'SKIPPED_BY_ROLLBACK';

  const handleClaim = async () => {
    try {
      await claimMutation.mutateAsync();
      toast.success('Görevi üstlendiniz');
      onRefetch();
    } catch (e) {
      if (isAxiosError(e)) {
        const code = e.response?.data?.error?.code as string | undefined;
        if (code === 'TASK_CLAIM_LOST') {
          toast.error('Bu görev başka biri tarafından üstlenildi');
          onRefetch();
          return;
        }
        toast.error(e.response?.data?.error?.message ?? 'Üstlenilemedi');
        return;
      }
      toast.error('Üstlenilemedi');
    }
  };

  const onManagerSubmit = async (values: ManagerFormValues) => {
    try {
      const res = await completeMutation.mutateAsync({
        action: values.action,
        reason: values.reason?.trim() || undefined,
        formData: { comment: values.comment?.trim() || undefined },
      });
      if (values.action === 'APPROVE') {
        toast.success('Süreç onaylandı');
        router.push(`/processes/${encodeURIComponent(task.process.displayId)}`);
      } else if (values.action === 'REJECT') {
        toast.success('Süreç reddedildi');
        router.push(`/processes/${encodeURIComponent(task.process.displayId)}`);
      } else if (values.action === 'REQUEST_REVISION') {
        toast.success('Revize için başlatıcıya gönderildi');
        router.push('/tasks?tab=completed');
      } else {
        toast.success('Görev tamamlandı');
        if (res.nextTaskId) {
          router.push(`/tasks/${encodeURIComponent(res.nextTaskId)}`);
        } else {
          router.push(`/processes/${encodeURIComponent(task.process.displayId)}`);
        }
      }
    } catch (e) {
      if (isAxiosError(e)) {
        const code = e.response?.data?.error?.code as string | undefined;
        if (code === 'TASK_REASON_REQUIRED') {
          managerForm.setError('reason', { message: 'Gerekçe zorunludur' });
          return;
        }
        if (code === 'VALIDATION_FAILED') {
          toast.error(e.response?.data?.error?.message ?? 'Doğrulama hatası');
          return;
        }
        toast.error(e.response?.data?.error?.message ?? 'Tamamlanamadı');
        return;
      }
      toast.error('Tamamlanamadı');
    }
  };

  if (readOnlyCompleted) {
    return (
      <Card className="p-[var(--space-4)] text-sm text-[var(--color-neutral-700)]">
        Bu görev tamamlandı veya atlandı; yeni işlem yapılamaz.
      </Card>
    );
  }

  if (showClaim) {
    return (
      <Card className="space-y-[var(--space-4)] p-[var(--space-5)]">
        <p className="text-sm text-[var(--color-neutral-700)]">
          Bu görev üstlenilebilir. Üstlendiğinizde diğer adaylar için görev kapanır.
        </p>
        <Button
          color="primary"
          isDisabled={claimMutation.isPending}
          onPress={() => void handleClaim()}
        >
          {claimMutation.isPending ? (
            <>
              <Loading01 className="mr-2 inline size-4 animate-spin" aria-hidden />
              İşleniyor…
            </>
          ) : (
            'Üstlen'
          )}
        </Button>
      </Card>
    );
  }

  if (showRevision) {
    return <KtiRevisionTaskForm task={task} />;
  }

  if (showManagerPanel) {
    const selectedAction = managerForm.watch('action');
    const needsReason = task.reasonRequiredFor.includes(selectedAction);

    return (
      <form onSubmit={managerForm.handleSubmit(onManagerSubmit)}>
        <Card className="space-y-[var(--space-5)] p-[var(--space-5)]">
          <fieldset className="space-y-[var(--space-3)]">
            <legend className="text-sm font-medium text-[var(--color-neutral-900)]">
              Kararınız
            </legend>
            <div className="flex flex-wrap gap-[var(--space-3)]">
              {task.allowedActions.includes('APPROVE') ? (
                <Button
                  type="button"
                  size="sm"
                  style={
                    selectedAction === 'APPROVE'
                      ? {
                          background:
                            'linear-gradient(135deg, #4ade80 0%, var(--color-success-700) 100%)',
                          color: 'var(--color-fg-inverse)',
                          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.45)',
                          transform: 'scale(1.02)',
                          borderColor: 'transparent',
                        }
                      : {
                          background: 'var(--color-success-soft)',
                          color: 'var(--color-success-700)',
                          borderColor: 'var(--color-success-200)',
                        }
                  }
                  onPress={() => {
                    managerForm.setValue('action', 'APPROVE');
                    managerForm.setValue('reason', '');
                  }}
                >
                  ✓ Onayla
                </Button>
              ) : null}
              {task.allowedActions.includes('REJECT') ? (
                <Button
                  type="button"
                  size="sm"
                  style={
                    selectedAction === 'REJECT'
                      ? {
                          background: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
                          color: 'var(--color-fg-inverse)',
                          boxShadow: '0 4px 16px rgba(244, 63, 94, 0.45)',
                          transform: 'scale(1.02)',
                          borderColor: 'transparent',
                        }
                      : {
                          background: 'var(--color-danger-soft)',
                          color: 'var(--color-danger)',
                          borderColor: 'var(--color-danger-border)',
                        }
                  }
                  onPress={() => {
                    managerForm.setValue('action', 'REJECT');
                    managerForm.setValue('reason', '');
                  }}
                >
                  ✕ Reddet
                </Button>
              ) : null}
              {task.allowedActions.includes('REQUEST_REVISION') ? (
                <Button
                  type="button"
                  size="sm"
                  style={
                    selectedAction === 'REQUEST_REVISION'
                      ? {
                          background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                          color: 'var(--color-warning-900)',
                          boxShadow: '0 4px 16px rgba(245, 158, 11, 0.45)',
                          transform: 'scale(1.02)',
                          borderColor: 'transparent',
                        }
                      : {
                          background: 'var(--color-warning-soft)',
                          color: 'var(--color-warning-900)',
                          borderColor: 'var(--color-warning-200)',
                        }
                  }
                  onPress={() => {
                    managerForm.setValue('action', 'REQUEST_REVISION');
                    managerForm.setValue('reason', '');
                  }}
                >
                  ↩ Revize İste
                </Button>
              ) : null}
            </div>
            {managerForm.formState.errors.action ? (
              <p className="text-sm text-[var(--color-error-700)]">
                {managerForm.formState.errors.action.message}
              </p>
            ) : null}
          </fieldset>

          {needsReason ? (
            <div>
              <label
                htmlFor="task-reason"
                className="mb-[var(--space-1)] block text-sm font-medium text-[var(--color-neutral-900)]"
              >
                Gerekçe <span className="text-[var(--color-error-600)]">*</span>
              </label>
              <textarea
                id="task-reason"
                rows={4}
                className={inputClassName('md', 'min-h-[6rem] w-full')}
                placeholder="En az 10 karakter"
                {...managerForm.register('reason')}
              />
              {managerForm.formState.errors.reason ? (
                <p className="mt-1 text-sm text-[var(--color-error-700)]">
                  {managerForm.formState.errors.reason.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="task-comment"
              className="mb-[var(--space-1)] block text-sm font-medium text-[var(--color-neutral-900)]"
            >
              Yorum{' '}
              <span className="text-xs font-normal text-[var(--color-neutral-500)]">
                (opsiyonel)
              </span>
            </label>
            <textarea
              id="task-comment"
              rows={3}
              className={inputClassName('md', 'min-h-[4rem] w-full')}
              placeholder="Ek açıklama..."
              {...managerForm.register('comment')}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              color="primary"
              isDisabled={completeMutation.isPending || !selectedAction}
            >
              {completeMutation.isPending ? (
                <>
                  <Loading01 className="mr-2 inline size-4 animate-spin" aria-hidden />
                  Kaydediliyor…
                </>
              ) : (
                'Kaydet ve Tamamla'
              )}
            </Button>
          </div>
        </Card>
      </form>
    );
  }

  return (
    <Card className="p-[var(--space-4)] text-sm text-[var(--color-neutral-600)]">
      Bu görev için şu anda bir aksiyon tanımlı değil veya erişiminiz yok.
    </Card>
  );
}
