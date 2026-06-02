import { describe, expect, it } from 'vitest';

import {
  formatAuditActorDisplayLabel,
  formatImpersonationActionLabel,
  isImpersonationMutatingAudit,
} from './audit-impersonation-display.js';

describe('formatAuditActorDisplayLabel', () => {
  it('normal kayıtta yalnız aktör adını döner', () => {
    expect(
      formatAuditActorDisplayLabel(
        { firstName: 'Seed', lastName: 'Manager', sicil: '00000002' },
        null,
      ),
    ).toBe('Seed Manager · 00000002');
  });

  it('isImpersonation metadata ile hedef yerine formatı', () => {
    expect(
      formatAuditActorDisplayLabel(
        { firstName: 'Seed', lastName: 'Manager', sicil: '00000002' },
        {
          isImpersonation: true,
          impersonatedUserDisplayName: 'Rıza Bekleyen',
          impersonatedUserSicil: '00000008',
        },
      ),
    ).toBe('Seed Manager · 00000002 (Rıza Bekleyen · 00000008 yerine)');
  });
});

describe('formatImpersonationActionLabel', () => {
  it('timeline etiketi audit ile aynı format', () => {
    expect(
      formatImpersonationActionLabel(
        { firstName: 'Seed', lastName: 'Manager', sicil: '00000002' },
        { firstName: 'E2E', lastName: 'Hedef', sicil: '00000010' },
      ),
    ).toBe('Seed Manager · 00000002 (E2E Hedef · 00000010 yerine)');
  });
});

describe('isImpersonationMutatingAudit', () => {
  it('isImpersonation true ise badge göster', () => {
    expect(isImpersonationMutatingAudit({ isImpersonation: true })).toBe(true);
  });

  it('lifecycle metadata için false', () => {
    expect(isImpersonationMutatingAudit({ targetUserId: 'x' })).toBe(false);
  });
});
