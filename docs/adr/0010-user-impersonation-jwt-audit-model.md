# ADR 0010: User Impersonation — JWT, Audit ve Oturum Modeli

## Durum

Kabul edildi (dokümantasyon — 28 Mayıs 2026)

## Bağlam

Troubleshooting, denetim ve test için yetkili kullanıcıların başka bir kullanıcı adına uygulama içinde tam yetkiyle çalışması gerekiyor. Faz 8 admin panel taslağında impersonation post-MVP olarak işaretlenmişti; go-live öncesi kapsam Faz 13 ile netleştirildi. Güvenlik: gerçek aktör audit’te kaybolmamalı, SUPERADMIN hedefi ve pasif kullanıcı yasak olmalı, yetki ayrı hassas permission ile sınırlandırılmalı.

## Karar

1. **Yetki:** `USER_IMPERSONATION` — `Permission` enum, category `ACTION`, `isSensitive: true`. Rol ataması dışında özel superadmin bypass yok; permission resolver effective user üzerinden çalışır.
2. **JWT access token:** `sub` = **effective (hedef) user id**; impersonation aktifken opsiyonel `imp` = **impersonator user id**. Roller/permission JWT’ye kodlanmaz (mevcut model).
3. **Oturum:** Mevcut refresh cookie + session satırı korunur; impersonation yalnız yeni access token üretimi ile ifade edilir. OIDC login flow’una impersonation karıştırılmaz — yalnız mevcut app session üzerinden.
4. **Hedef kısıtları (hard deny):** pasif kullanıcı, SUPERADMIN rolündeki kullanıcı, impersonator’ın kendisi.
5. **Audit actor modeli:** `audit_logs.user_id` = **impersonator** (gerçek aktör). `metadata.isImpersonation: true`, `metadata.impersonatedUserId`, `metadata.impersonatedUserSicil`, `metadata.impersonatedUserDisplayName`. UI etiketi: `{Impersonator Ad Soyad - sicil} ({Hedef Ad Soyad - sicil} yerine)` + aksiyon yanında **Impersonation** badge.
6. **Lifecycle audit:** `IMPERSONATION_STARTED`, `IMPERSONATION_STOPPED`, `IMPERSONATION_SWITCHED`.
7. **UX:** Süre sınırı yok. Impersonation aktifken header bandında user-switch ikonu → kendi hesaba dön; effective user adına tık → user search modal. Tam hedef deneyimi (bildirimler, menü, permission gate’ler).
8. **Rate limit:** `POST /auth/impersonate/start` ve `switch` — 10 istek / dakika / kullanıcı.

## Reddedilen alternatifler

- **Audit `user_id` = hedef kullanıcı:** Gerçek aktör kaybolur; denetim ve KVKK hesap verebilirliği zayıflar.
- **Permission impersonator üzerinden çözülür:** Hedef kullanıcı deneyimi bozulur; troubleshooting amacına aykırı.
- **SUPERADMIN otomatik impersonation hakkı:** Least privilege ihlali; ayrı permission ile seçili kullanıcılara verilir.
- **Otomatik idle timeout (MVP):** Bilinçli ertelendi; audit + permission yeterli savunma kabul edildi.

## Sonuçlar

- **Olumlu:** Denetlenebilir “o kişi gibi” test ve destek; pentest senaryolarına net giriş noktası.
- **Dikkat:** Impersonation altında yapılan mutating aksiyonlar hukuki olarak impersonator’a yazılır — UI ve audit formatı bunu açık göstermeli.
- **Dikkat:** Hedef kullanıcıya “hesabınız görüntülendi” bildirimi MVP’de yok (bilinçli kapsam dışı).

## İlgili dokümanlar

- `.cursor/rules/63-phase-13-user-impersonation.mdc`
- `docs/03_API_CONTRACTS.md` — Bölüm 9.1 (impersonate endpoint’leri)
- `docs/07_SECURITY_IMPLEMENTATION.md` — Bölüm 3.1 (JWT claims), impersonation özeti
- `docs/mimari-kararlar.md` — [IMP-001], [AUD-005]
- `docs/06_SCREEN_CATALOG.md` — S-IMPERSONATION-MODAL, S-ADMIN-AUDIT güncellemesi
