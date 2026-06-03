/** Cross-app yardımcıları — Faz 2+ ile doldurulacak */
export function noop(): void {
  /* scaffold */
}

export { bufferToPrismaBytes, bytesToNodeBuffer } from './bytes.js';
export { calendarDaysUntilPasswordExpiry } from './password-expiry-calendar.js';
export {
  decryptAes256GcmDeterministic,
  decryptAes256GcmProbabilistic,
  deterministicIvFromNamespace,
  encryptAes256GcmDeterministic,
  encryptAes256GcmProbabilistic,
  hmacBlindIndexHex,
} from './pii-crypto.js';
export {
  auditLogCanonicalString,
  nextAuditChainHash,
  stableJsonStringifyForAudit,
} from './audit-chain-canonical.js';
export {
  formatAuditActorDisplayLabel,
  formatImpersonationActionLabel,
  isImpersonationMutatingAudit,
  type AuditActorNameParts,
} from './audit-impersonation-display.js';
export { verifyAuditLogChain, type AuditChainVerifyInputRow } from './audit-chain-verify.js';
export { sanitizeInternalRedirectPath } from './internal-redirect-path.js';
export {
  resolveTransactionalFromAddress,
  sendMailViaSmtpFromEnv,
  sendMailWithTransport,
  type TransactionalMailPayload,
  type TransactionalMailWithFrom,
} from './smtp-mail.js';
export { buildPgPoolConfig } from './pg-pool-config.js';
