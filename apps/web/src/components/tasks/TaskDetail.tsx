'use client';

import Link from 'next/link';
import { isAxiosError } from 'axios';

import { TaskHistoryTimeline } from '@/components/processes/TaskHistoryTimeline';
import { useTaskDetailQuery } from '@/lib/queries/tasks';

import { SlaBadge } from './SlaBadge';
import { TaskActions } from './TaskActions';

interface TaskDetailProps {
  taskId: string;
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  const { data: task, isLoading, isError, error, refetch } = useTaskDetailQuery(taskId);

  if (isLoading) {
    return (
      <div className="space-y-[var(--space-4)]" role="status" aria-live="polite">
        <span className="sr-only">Yükleniyor…</span>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const code = isAxiosError(error)
      ? (error.response?.data as { error?: { code?: string } })?.error?.code
      : undefined;
    if (status === 404 || code === 'TASK_NOT_FOUND') {
      return (
        <div className="ls-alert ls-alert--danger" role="alert">
          <p>Görev bulunamadı.</p>
          <Link href="/tasks" className="mt-2 inline-block text-sm underline">
            Görevlerime dön
          </Link>
        </div>
      );
    }
    if (status === 403 || code === 'TASK_ACCESS_DENIED') {
      return (
        <div className="ls-alert ls-alert--danger" role="alert">
          <p>Bu görevi görüntüleme yetkiniz yok.</p>
          <Link href="/tasks" className="mt-2 inline-block text-sm underline">
            Görevlerime dön
          </Link>
        </div>
      );
    }
    return (
      <div className="ls-alert ls-alert--danger" role="alert">
        <p>Yüklenemedi.</p>
        <button
          type="button"
          className="ls-btn ls-btn--neutral ls-btn--sm mt-2"
          onClick={() => refetch()}
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  const isRevision = task.stepKey === 'KTI_REVISION';

  // Yönetici gerekçesini önce task üst alanlarından, yoksa previousTasks'taki
  // KTI_MANAGER_APPROVAL adımının reason/formData.comment alanlarından türet.
  // Birden fazla revize döngüsünde en son yönetici kararı geçerli olmalı
  const managerApprovalRows = task.previousTasks.filter(
    (pt) => pt.stepKey === 'KTI_MANAGER_APPROVAL',
  );
  const managerApprovalTask =
    managerApprovalRows.length > 0
      ? managerApprovalRows[managerApprovalRows.length - 1]
      : undefined;
  const managerReason = task.managerReason ?? managerApprovalTask?.reason ?? null;
  const managerComment =
    task.managerComment ??
    (managerApprovalTask?.formData as { comment?: string } | null | undefined)?.comment ??
    null;

  return (
    <div className="space-y-[var(--space-6)]">
      <nav className="text-sm text-[var(--color-neutral-600)]" aria-label="Breadcrumb">
        <Link href="/tasks" className="hover:text-[var(--color-primary-600)]">
          Görevlerim
        </Link>
        <span className="mx-2" aria-hidden>
          ›
        </span>
        <span className="text-[var(--color-neutral-900)]">
          {task.process.displayId} — {task.stepLabel}
        </span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-[var(--space-4)]">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-neutral-900)]">
            {task.stepLabel}
          </h1>
          <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-3)]">
            <span className="rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-800)]">
              {task.status}
            </span>
            <SlaBadge
              slaDueAt={task.slaDueAt}
              slaBaselineAt={task.slaBaselineAt ?? null}
              isSlaOverdue={task.isSlaOverdue}
            />
          </div>
        </div>
        <Link
          href={`/processes/${encodeURIComponent(task.process.displayId)}`}
          className="ls-btn ls-btn--neutral ls-btn--sm shrink-0"
        >
          Süreç Detayı
        </Link>
      </div>

      {isRevision ? (
        <div
          className="rounded-[var(--radius-md)] border-l-4 border-[var(--color-warning-500)] bg-[var(--color-warning-50)] p-[var(--space-4)]"
          role="alert"
        >
          <p className="text-sm font-semibold text-[var(--color-warning-800)]">
            Yöneticiniz revize istedi
          </p>
          <p className="mt-[var(--space-1)] text-sm font-medium text-[var(--color-neutral-900)]">
            {managerReason ?? 'Gerekçe belirtilmemiş'}
          </p>
          {managerComment ? (
            <p className="mt-[var(--space-1)] text-sm text-[var(--color-neutral-700)]">
              {managerComment}
            </p>
          ) : null}
        </div>
      ) : null}

      {task.previousTasks.length > 0 ? (
        <section className="space-y-[var(--space-3)]">
          <h2 className="text-sm font-semibold text-[var(--color-neutral-800)]">Görev Tarihçesi</h2>
          <TaskHistoryTimeline previousTasks={task.previousTasks} />
        </section>
      ) : null}

      <TaskActions task={task} onRefetch={() => void refetch()} />
    </div>
  );
}
