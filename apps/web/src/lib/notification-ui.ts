import {
  AlertTriangle,
  Bell01,
  CheckCircle,
  File06,
  Key01,
  User01,
  XCircle,
} from '@untitledui/icons';
import type { FC, SVGProps } from 'react';

export type NotificationIcon = FC<SVGProps<SVGSVGElement>>;

/** Ekran kataloğu S-NOTIF-LIST ile uyumlu ikon eşlemesi */
export function notificationEventIcon(eventType: string): NotificationIcon {
  switch (eventType) {
    case 'ROLE_ASSIGNED':
      return User01;
    case 'PASSWORD_EXPIRY_WARNING':
      return Key01;
    case 'CONSENT_VERSION_PUBLISHED':
      return File06;
    case 'DOCUMENT_INFECTED':
    case 'SECURITY_ANOMALY':
    case 'AUDIT_CHAIN_BROKEN':
      return AlertTriangle;
    case 'ACCOUNT_LOCKED':
      return XCircle;
    case 'PASSWORD_CHANGED':
      return CheckCircle;
    default:
      return Bell01;
  }
}

const EVENT_LABELS: Record<string, string> = {
  DOCUMENT_INFECTED: 'Doküman taraması',
  ACCOUNT_LOCKED: 'Hesap kilitlendi',
  PASSWORD_RESET_REQUESTED: 'Şifre sıfırlama talebi',
  PASSWORD_CHANGED: 'Şifre değişti',
  PASSWORD_EXPIRY_WARNING: 'Şifre süresi uyarısı',
  SUSPICIOUS_LOGIN: 'Şüpheli giriş',
  SUPERADMIN_LOGIN: 'Süperadmin girişi',
  SECURITY_ANOMALY: 'Güvenlik uyarısı',
  AUDIT_CHAIN_BROKEN: 'Denetim zinciri',
  USER_LOGIN_WELCOME: 'Hoş geldiniz',
  DAILY_DIGEST: 'Günlük özet',
  CONSENT_VERSION_PUBLISHED: 'Rıza metni güncellendi',
  ROLE_ASSIGNED: 'Rol atandı',
};

export function notificationEventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType;
}

export function formatNotificationRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 45) return 'Az önce';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 36) return `${hr} saat önce`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR');
}
