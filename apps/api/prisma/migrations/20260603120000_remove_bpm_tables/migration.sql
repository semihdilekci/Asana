-- Faz 14 İter 5 — BPM tabloları, enum'ları ve notification_event_type BPM değerleri kaldırılır
-- Kaynak: docs/02_DATABASE_SCHEMA.md (ASANA pivot — Faz 14)

-- BPM bildirim / şablon / tercih kayıtları (enum daraltmadan önce)
DELETE FROM "notifications"
WHERE "event_type"::text IN (
  'TASK_ASSIGNED',
  'TASK_CLAIMED_BY_PEER',
  'SLA_WARNING',
  'SLA_BREACH',
  'PROCESS_COMPLETED',
  'PROCESS_REJECTED',
  'PROCESS_CANCELLED',
  'ROLLBACK_PERFORMED'
);

DELETE FROM "notification_preferences"
WHERE "event_type"::text IN (
  'TASK_ASSIGNED',
  'TASK_CLAIMED_BY_PEER',
  'SLA_WARNING',
  'SLA_BREACH',
  'PROCESS_COMPLETED',
  'PROCESS_REJECTED',
  'PROCESS_CANCELLED',
  'ROLLBACK_PERFORMED'
);

DELETE FROM "email_templates"
WHERE "event_type"::text IN (
  'TASK_ASSIGNED',
  'TASK_CLAIMED_BY_PEER',
  'SLA_WARNING',
  'SLA_BREACH',
  'PROCESS_COMPLETED',
  'PROCESS_REJECTED',
  'PROCESS_CANCELLED',
  'ROLLBACK_PERFORMED'
);

-- documents: süreç/görev FK ve indeks
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_process_id_fkey";
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_task_id_fkey";
DROP INDEX IF EXISTS "documents_process_idx";
ALTER TABLE "documents" DROP COLUMN IF EXISTS "process_id";
ALTER TABLE "documents" DROP COLUMN IF EXISTS "task_id";

-- workflow tabloları
DROP TRIGGER IF EXISTS trg_tasks_updated_at ON "tasks";
DROP TRIGGER IF EXISTS trg_processes_updated_at ON "processes";

DROP TABLE "task_assignments";
DROP TABLE "tasks";
DROP TABLE "processes";

DROP SEQUENCE IF EXISTS "process_seq_before_after_kaizen";

DROP TYPE "task_assignment_status";
DROP TYPE "assignment_mode";
DROP TYPE "task_status";
DROP TYPE "process_status";
DROP TYPE "process_type";

-- notification_event_type: BPM değerlerini enum'dan çıkar
CREATE TYPE "notification_event_type_new" AS ENUM (
  'DOCUMENT_INFECTED',
  'ACCOUNT_LOCKED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_CHANGED',
  'PASSWORD_EXPIRY_WARNING',
  'SUSPICIOUS_LOGIN',
  'SUPERADMIN_LOGIN',
  'SECURITY_ANOMALY',
  'AUDIT_CHAIN_BROKEN',
  'USER_LOGIN_WELCOME',
  'DAILY_DIGEST',
  'CONSENT_VERSION_PUBLISHED',
  'ROLE_ASSIGNED'
);

ALTER TABLE "notifications"
  ALTER COLUMN "event_type" TYPE "notification_event_type_new"
  USING ("event_type"::text::"notification_event_type_new");

ALTER TABLE "notification_preferences"
  ALTER COLUMN "event_type" TYPE "notification_event_type_new"
  USING ("event_type"::text::"notification_event_type_new");

ALTER TABLE "email_templates"
  ALTER COLUMN "event_type" TYPE "notification_event_type_new"
  USING ("event_type"::text::"notification_event_type_new");

DROP TYPE "notification_event_type";
ALTER TYPE "notification_event_type_new" RENAME TO "notification_event_type";
