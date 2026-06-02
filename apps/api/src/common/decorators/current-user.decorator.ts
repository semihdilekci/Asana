import { UnauthorizedException, createParamDecorator, type ExecutionContext } from '@nestjs/common';

export type AuthenticatedUser = {
  /** Effective (hedef) kullanıcı id */
  id: string;
  sessionId: string;
  jti: string;
  /** Gerçek aktör — impersonation aktifken dolu */
  impersonatorId?: string;
};

/** Oturum/audit işlemleri için gerçek kullanıcı id */
export function realActorId(user: AuthenticatedUser): string {
  return user.impersonatorId ?? user.id;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  },
);
