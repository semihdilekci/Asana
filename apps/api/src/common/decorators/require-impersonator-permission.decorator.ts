import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@leanmgmt/shared-types';

export const IMPERSONATOR_PERMISSIONS_KEY = 'impersonator_permissions';

/** start/switch — yetki impersonator üzerinden çözülür (effective user değil) */
export const RequireImpersonatorPermission = (
  ...permissions: Permission[]
): ReturnType<typeof SetMetadata> => SetMetadata(IMPERSONATOR_PERMISSIONS_KEY, permissions);
