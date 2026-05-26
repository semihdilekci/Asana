-- Eski geliştirme anahtarı; canonical enum NOTIFICATION_EDIT (bildirim listesi permission gerektirmez)
DELETE FROM "role_permissions" WHERE "permission_key" = 'NOTIFICATION_READ';
