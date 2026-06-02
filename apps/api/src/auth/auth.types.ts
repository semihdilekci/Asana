export type AccessTokenPayload = {
  /** Effective (hedef) kullanıcı — impersonation aktifken hedef id */
  sub: string;
  sid: string;
  jti: string;
  /** Gerçek aktör — yalnız impersonation modunda */
  imp?: string;
};

export function resolveImpersonatorId(payload: { sub: string; imp?: string }): string | undefined {
  return payload.imp;
}

export function resolveRealActorId(payload: { sub: string; imp?: string }): string {
  return payload.imp ?? payload.sub;
}
