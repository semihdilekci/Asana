# Süreç Tasarım Şablonu (Process Design Template)

> Bu şablon, **Lean Management Platformu**'na yeni bir iş süreci tipi (örn. KTİ, 5S Audit, TPM Round) eklenmek istendiğinde **tüm geliştirme öncesi karar setini** tek dosyada toplamak için kullanılır.
>
> **Nasıl kullanılır:**
>
> 1. Bu dosyayı kopyala: `docs/processes/<process-slug>.draft.md` (örn. `docs/processes/five-s-audit.draft.md`).
> 2. Tüm `<...>` placeholder'larını doldur. Cevabını bilmediğin alana **"KARAR GEREKLİ"** yaz.
> 3. `**@add-process-type`\*\* skill'ini doldurulmuş şablonla çağır. Skill bu şablona göre dokümantasyon → faz → kod geliştirmesini sırayla yapar.
>
> **Hangi alanlar zorunlu?** Tüm alanlar zorunlu. "Yok" diyorsan bile **"YOK"** yaz; boş bırakma. Boş alan → skill çalışmaz, eksik soruları sorar.
>
> **Hibrit dil kuralı (`02-language-naming.mdc`):**
>
> - Identifier (enum, step_key, permission, file, route) → **İngilizce UPPER_SNAKE veya kebab-case**.
> - Kullanıcı metni (TR ad, label, mesaj, mail) → **Türkçe**.

---

## 0. Şablon Meta

| Alan                 | Değer                       |
| -------------------- | --------------------------- |
| **Şablonu dolduran** | Semih Dilekçi               |
| **Tarih**            | 20.05.2026                  |
| **Hedef MVP / Faz**  | MVP, Yeni süreç ekleme fazı |
| **Şablon sürümü**    | 1.0                         |

---

## 1. Süreç Kimliği

| Alan                        | Değer                | Kural                                                                       |
| --------------------------- | -------------------- | --------------------------------------------------------------------------- |
| **Türkçe ad**               | YGT (KOBETSU KAIZEN) | Kullanıcıya gösterilen tam ad                                               |
| **Kısa ad (TR)**            | YGT                  | Menü, breadcrumb için                                                       |
| **Sistem kodu (enum)**      | YGT                  | `ProcessType` enum'a eklenecek. UPPER_SNAKE_CASE, İngilizce.                |
| **displayId prefix**        | YGT                  | `<PREFIX>-NNNNNN` üretir. 2-4 harf/rakam. Benzersiz olmalı (mevcut: `KTI`). |
| **DB sequence adı**         | process_seq_ygt      | `process_seq_<snake_case_enum>`.                                            |
| **URL slug**                | ygt                  | `/processes/<slug>/start` route'unda kullanılır. kebab-case.                |
| **İkon (lucide-react adı)** | blocks               | Sidebar/liste rozetinde kullanılır.                                         |

### 1.1 Süreç Tanımı (TR, 2-4 cümle)

<YGT süreci 10 adımda Kaizen yani Kobetsu Kaizen sürecini tamsil eder. >

### 1.2 Kapsam (MVP)

- **Kapsamda:** <bu sürümde gelen özellikler>
- **Kapsam dışı:** <bilinçli olarak yapılmayanlar — post-MVP>

---

## 2. Aktörler ve Yetkiler

| Aktör (rol)                   | Süreç içindeki sorumluluk                                                        |
| ----------------------------- | -------------------------------------------------------------------------------- |
| **Başlatıcı (initiator)**     | PROCESS_YGT_START rolüne sahip kullanıcılar başlatır                             |
| **Onaylayan**                 | <örn: "Başlatıcının yöneticisi (`manager_user_id`)">                             |
| **Görüntüleyici (read-only)** | Kullanıcılar sadece kendi başlattıkları süreçleri veya dahil oldukları görevleri |
| **Admin override**            | Süperadmin / `PROCESS_VIEW_ALL` / `PROCESS_CANCEL` / `PROCESS_ROLLBACK`          |

### 2.1 Yeni Permission'lar

> KTİ örneği: `PROCESS_KTI_START`. **Cancel/Rollback/ViewAll/Document upload yeniden kullanılır — yeniden tanımlanmaz.**

| Permission key      | Kategori (`MENU`/`ACTION`/`DATA`/`FIELD`) | `isSensitive` | Açıklama (TR)  | Hangi sistem rollerine atanacak |
| ------------------- | ----------------------------------------- | ------------- | -------------- | ------------------------------- |
| `PROCESS_YGT_START` | ACTION                                    | false         | Süreç başlatma | yok                             |
|                     |                                           |               |                |                                 |

### 2.2 Yeniden Kullanılan Permission'lar (değiştirme!)

- `PROCESS_CANCEL` — idari iptal
- `PROCESS_ROLLBACK` — adım geri alma
- `PROCESS_VIEW_ALL` — admin liste/detay
- `DOCUMENT_UPLOAD` — bu süreçte upload var mı? EVET

---

## 3. State Machine

### 3.1 Process Statüleri (jenerik, değiştirme!)

`INITIATED` → `IN_PROGRESS` → `COMPLETED` | `REJECTED` | `CANCELLED`

> KTİ pratikte `INITIATED`'i bypass edip direkt `IN_PROGRESS` ile insert eder. Sen de aynı kalıbı koru, sapma gerekiyorsa **ADR yaz**.

| Statü         | Anlamı (bu süreçte)                |
| ------------- | ---------------------------------- |
| `IN_PROGRESS` | <hangi adımlardayken>              |
| `COMPLETED`   |                                    |
| `REJECTED`    | <hangi adımda hangi aksiyonla>     |
| `CANCELLED`   | <kim, hangi gerekçeyle iptal eder> |

### 3.2 Adımlar (Steps)

> Her adım `tasks` tablosunda bir satırdır. `step_order` 1'den başlar. `step_key` UPPER_SNAKE, prefix sürecin enum kodu.

| Order | step_key           | TR Etiket              | Assignment Mode        | Assignee Kaynak                      | SLA (saat) | Allowed Actions                       |
| ----- | ------------------ | ---------------------- | ---------------------- | ------------------------------------ | ---------- | ------------------------------------- |
| 1     | `<TIP>_INITIATION` | <örn: "Başlatma">      | `SINGLE`               | `initiator`                          | <örn: 48>  | `SUBMIT`                              |
| 2     | `<TIP>_<ADIM>`     | <örn: "Yönetici Onay"> | `SINGLE`/`COMPETITIVE` | `manager_user_id` veya rol/attribute | <örn: 72>  | `APPROVE`,`REJECT`,`REQUEST_REVISION` |
| 3     | `<TIP>_<ADIM>`     | ...                    | ...                    | ...                                  | ...        | ...                                   |

**Assignment Mode:**

- `SINGLE` — tek assignee (initiator, manager). DIRECT mode.
- `COMPETITIVE` — birden fazla aday; ilk claim eden sahiplenir (peer eviction).

**Assignee kaynak seçenekleri:**

- `initiator` — `started_by_user_id`
- `manager_user_id` — başlatıcının yöneticisi (yoksa 422 `USER_NOT_FOUND`)
- `role:<ROLE_CODE>` — verilen rolün tüm sahipleri (COMPETITIVE önerilir)
- `attribute:<key>=<value>` — attribute eşleşen kullanıcılar
- `previous_step_assignee` — önceki adımın çözümleyeni

### 3.3 Geçiş Tablosu (Transition Map)

| Mevcut step_key          | Action             | Sonraki step_key veya terminal | Process status sonrası |
| ------------------------ | ------------------ | ------------------------------ | ---------------------- |
| `<TIP>_INITIATION`       | `SUBMIT`           | `<TIP>_MANAGER_APPROVAL`       | `IN_PROGRESS`          |
| `<TIP>_MANAGER_APPROVAL` | `APPROVE`          | terminal                       | `COMPLETED`            |
| `<TIP>_MANAGER_APPROVAL` | `REJECT`           | terminal                       | `REJECTED`             |
| `<TIP>_MANAGER_APPROVAL` | `REQUEST_REVISION` | `<TIP>_REVISION`               | `IN_PROGRESS`          |
| `<TIP>_REVISION`         | `RESUBMIT`         | `<TIP>_MANAGER_APPROVAL`       | `IN_PROGRESS`          |

### 3.4 İptal (Cancel) Kuralı

- Cancel edilebilir process statüleri: <örn: `IN_PROGRESS`>
- Cancel için zorunlu permission: `PROCESS_CANCEL` (değiştirme)
- Cancel reason min karakter: <örn: 10>
- Aktif task'lar nasıl işlenir: <varsayılan: `SKIPPED_BY_ROLLBACK`>

### 3.5 Rollback (Geri Al) Kuralı

- Rollback edilebilir mi? <EVET/HAYIR>
- Edilebilirse hedef adımlar: <örn: "her zaman bir önceki adıma">
- Atama yeniden çözülür mü? <EVET (varsayılan) / HAYIR>

---

## 4. Form / Veri Şeması

> Süreç verisi `tasks.form_data` JSONB'de saklanır. Tip başına ayrı kolon yapılmaz. KTİ'de `processes.metadata` boş — sen de gerekmedikçe kullanma.

### 4.1 Start Endpoint Payload (`POST /api/v1/processes/<slug>/start`)

Bu, kullanıcı **süreç başlatırken** gönderdiği veri. Başlatma task'ı `COMPLETED` olarak insert edilir; bu payload `form_data`'sına yazılır.

| Field       | Tip                                               | Zorunlu? | Validation            | Açıklama           |
| ----------- | ------------------------------------------------- | -------- | --------------------- | ------------------ |
| `companyId` | `string (uuid/cuid)`                              | EVET     | starter ile eşleşmeli | Hangi şirket adına |
|             | <`string`/`number`/`array`/`enum`/`documentId[]`> |          | min/max/regex         |                    |

**Doküman alanları varsa** her birinin: rol (`BEFORE` / `AFTER` / `EVIDENCE` / `ATTACHMENT`), min/max sayı, izin verilen MIME (`docs/03_API_CONTRACTS.md` whitelist'i).

### 4.2 Task Action Payload'ları

Her adım için onay/ret/revize aksiyonunda kullanıcının dolduracağı form alanları:

#### Adım: `<TIP>_<ADIM>`

| Action             | Field              | Tip      | Zorunlu?      | Açıklama         |
| ------------------ | ------------------ | -------- | ------------- | ---------------- |
| `APPROVE`          | `formData.comment` | `string` | opsiyonel     | Onay yorumu      |
| `REJECT`           | `reason`           | `string` | EVET (min 10) | Ret gerekçesi    |
| `REQUEST_REVISION` | `reason`           | `string` | EVET (min 10) | Revize gerekçesi |

> Reason validation kuralı KTİ ile aynı (`ProcessCancelBodySchema` referans).

### 4.3 Read Model (Liste/Detay Görünümü)

Liste rozetinde gösterilecek "aktif adım etiketi" mantığı — `workflow.getListActiveStepLabel()`'da set edilir:

| Aktif step_key (veya process status) | TR etiket           |
| ------------------------------------ | ------------------- |
| `COMPLETED` (process)                | `Tamamlandı`        |
| `REJECTED` (process)                 | `Reddedildi`        |
| `CANCELLED` (process)                | `İptal Edildi`      |
| `<TIP>_INITIATION`                   | <örn: `Başlatıldı`> |
| `<TIP>_<ADIM>`                       |                     |

---

## 5. UI / UX

### 5.1 Yeni Ekranlar

> Her birini `docs/06_SCREEN_CATALOG.md`'ye S-ID ile ekle. Mevcut S-PROC-LIST, S-PROC-DETAIL, S-TASK-DETAIL **yeniden kullanılır** — sadece tip-özel start sayfası yeni.

| Screen ID       | Route                     | Permission            | Açıklama                  |
| --------------- | ------------------------- | --------------------- | ------------------------- |
| `S-<TIP>-START` | `/processes/<slug>/start` | `PROCESS_<TIP>_START` | Çok adımlı başlatma formu |
|                 |                           |                       |                           |

### 5.2 Mevcut Ekran Güncellemeleri

- `**AppSidebarNav`\*\* → Yeni " Başlat" menü öğesi (`PermissionGate` ile sarılı)
- `**ProcessAdminList` / `ProcessList**` → Tip filtresi dropdown'una `<TIP>` ekle
- `**step-labels.ts**` → Yeni `step_key` → TR etiket eşleşmesi
- `**TaskActions` / `TaskDetail**` → Yeni step_key'ler için action butonları (form alanları)
- `**app-breadcrumbs.ts**` → `DISPLAY_ID_RE` regex'ini yeni prefix kapsayacak şekilde genişlet

### 5.3 Form Akışı (Start)

> KTİ örneği: çok adımlı (bilgi → gözden geçir → ONAYLIYORUM kutusu + submit). Aynı kalıbı kullan.

| Adım | İçerik                     | Validation                    |
| ---- | -------------------------- | ----------------------------- |
| 1    |                            |                               |
| 2    | <Dokümanlar (varsa)>       |                               |
| 3    | Gözden geçir + onay kutusu | "ONAYLIYORUM" işaretli olmalı |

### 5.4 State'ler (Her ekran için)

- Loading (skeleton)
- Empty
- Error
- Permission denied
- Success (toast + redirect: `/processes/:displayId`)

### 5.5 Türkçe String'ler

Toast / bildirim / hata mesajları için TR varyantları (örnekler):

| Olay              | Mesaj                                                              |
| ----------------- | ------------------------------------------------------------------ |
| Başarılı başlatma | <"5S Denetimi başarıyla başlatıldı.">                              |
| Yetersiz yetki    | <"Bu sürece başlamak için yetkiniz yok.">                          |
| Doküman taranıyor | <"Dokümanlar henüz taranıyor. Lütfen biraz sonra tekrar deneyin."> |

---

## 6. Bildirimler ve E-postalar

> Mevcut notification + email pipeline kullanılır (`docs/05_FRONTEND_SPEC.md` + Faz 7). Yeni kanal eklenmez.

### 6.1 Olay → Bildirim Eşleştirmesi

| Tetikleyici olay                    | Hedef kullanıcı       | Kanal          | Önem   | Mesaj başlığı (TR)                      |
| ----------------------------------- | --------------------- | -------------- | ------ | --------------------------------------- |
| `task.assigned` (adım 2)            | Manager               | in-app + email | normal | <"Onayınızı bekleyen yeni 5S denetimi"> |
| `task.completed` (terminal APPROVE) | Initiator             | in-app + email | normal | <"5S denetiminiz onaylandı">            |
| `task.completed` (REJECT)           | Initiator             | in-app + email | yüksek | <"5S denetiminiz reddedildi">           |
| `task.completed` (REQUEST_REVISION) | Initiator             | in-app + email | yüksek | <"Revize istendi">                      |
| `task.sla.overdue`                  | Assignee              | in-app         | normal | <"SLA süresi aşıldı">                   |
| `process.cancelled`                 | Initiator + assignees | in-app         | normal | <"Süreç iptal edildi">                  |

### 6.2 Yeni E-posta Şablonları (`email_templates`)

| Template key                          | Tetikleyici            | Değişkenler                            | Konu (TR)                                              |
| ------------------------------------- | ---------------------- | -------------------------------------- | ------------------------------------------------------ |
| `<tip_slug>.manager_approval_pending` | task.assigned (adım 2) | `firstName`, `displayId`, `processUrl` | <"Onayınızı bekleyen yeni 5S denetimi: {{displayId}}"> |
|                                       |                        |                                        |                                                        |

---

## 7. SLA ve Cron'lar

| Adım                     | SLA saat | Overdue politikası                    |
| ------------------------ | -------- | ------------------------------------- |
| `<TIP>_INITIATION`       | <48>     | <yok / bildirim / escalation>         |
| `<TIP>_MANAGER_APPROVAL` | <72>     | <"task.sla.overdue" → email + in-app> |

> SLA overdue cron Faz 6'da kurulmuştur — sadece `step_key`/saat değerlerini eklemen yeter; yeni cron yazılmaz.

---

## 8. Audit Log

> `@Audit('<ACTION>', '<ENTITY_TYPE>')` ile state değiştiren her endpoint loglanır. Yeni audit action listesi:

| Action key         | Entity    | Tetikleyici                    | Detay alanları      |
| ------------------ | --------- | ------------------------------ | ------------------- |
| `START_PROCESS`    | `process` | `POST /processes/<slug>/start` | `{processType}`     |
| `COMPLETE_TASK`    | `task`    | task complete                  | `{action, stepKey}` |
| `CANCEL_PROCESS`   | `process` | reuse                          | —                   |
| `ROLLBACK_PROCESS` | `process` | reuse                          | —                   |

> Yeni action eklemek istiyorsan `docs/07_SECURITY_IMPLEMENTATION.md` audit listesine ekle.

---

## 9. İş Kuralları (Önemli Kararlar)

> Süreç-özel iş kuralları. KTİ'deki "manager yoksa 422" gibi.

1. <Kural 1, örn: "Başlatıcının şirketi formdaki `companyId` ile eşleşmeli — yoksa `KTI_COMPANY_MISMATCH` 422.">
2. <Kural 2>
3. <Kural 3>

---

## 10. Test Senaryoları

### 10.1 Happy Path (E2E)

1. Initiator giriş → " Başlat" menü → form doldur → submit
2. `displayId` üretilir (örn: `5SA-000001`), redirect `/processes/5SA-000001`
3. Manager bildirim alır, login → görev → APPROVE
4. Initiator "tamamlandı" bildirimi alır
5. Liste'de status `COMPLETED`

### 10.2 Kritik Edge Cases

- Başlatıcının manager'ı yok → 422 `USER_NOT_FOUND`
- Doküman PENDING_SCAN → 409 `DOCUMENT_SCAN_PENDING`
- Permission yok → 403
- Başkasının task'ına complete → 403 `TASK_ACCESS_DENIED`
- Terminal süreç tekrar cancel → 409 `PROCESS_INVALID_STATE`
- Rollback hedef >= mevcut → 422 `PROCESS_ROLLBACK_INVALID_TARGET`
- <Tipe özel ek case>

### 10.3 Coverage Hedefi

`04-quality-gates.mdc`'ye uygun (Yüksek risk modül):

- Workflow + service: ≥85% line, ≥75% branch
- Frontend form: ≥75% line

---

## 11. Açık Yasaklar (Don'ts)

> MVP'de yapılmayacak şeyler. Skill bunları bilmeli, agent eklemeye çalışmamalı.

- <örn: "Paralel adımlar — sıralı kalsın">
- <örn: "Görsel state machine editörü — yok">
- <örn: "Doküman versiyonlama — yüklenen değişmez">
- <örn: "Native mobile — responsive web yeter">

---

## 12. İlgili Dokümanlar / ADR

> Skill bu süreç çalışırken aşağıdakileri context'e yükler.

- `docs/00_PROJECT_OVERVIEW.md` — proje kimliği
- `docs/01_DOMAIN_MODEL.md` Bölüm 3-4 — state machine
- `docs/02_DATABASE_SCHEMA.md` Bölüm 6.4, 9-11 — processes/tasks şema
- `docs/03_API_CONTRACTS.md` Bölüm 9.5, 9.6 — process/task endpoints
- `docs/05_FRONTEND_SPEC.md` — route + form patterns
- `docs/06_SCREEN_CATALOG.md` — S-\* katalog
- `.cursor/rules/13-backend-processes.mdc` — ProcessTypeRegistry pattern
- `.cursor/rules/43-add-new-permission.mdc` — permission ekleme
- `.cursor/rules/42-add-prisma-migration.mdc` — migration
- ADR-0016 (ProcessTypeRegistry), ADR-0017 (State machine)

### 12.1 Yeni ADR Gerekli mi?

- <Mevcut pattern'den sapma var mı? VARSA → ADR yaz, link buraya>
- <YOKSA → "ADR gerekmiyor; KTİ pattern'i ile tam uyumlu.">

---

## 13. Tamamlama Onayı (Skill İçin)

Skill çalışmaya başlamadan önce **bu kontrol listesi**ndeki tüm cevapları sorar:

- Sistem kodu (enum) ve displayId prefix benzersiz mi?
- Tüm adımların `step_key`, SLA, assignee kaynağı belirtilmiş mi?
- Geçiş tablosu (3.3) eksiksiz mi?
- Yeni permission(lar) listelenmiş mi? Hangi rollere atanacağı belirtilmiş mi?
- Start payload (4.1) tüm alanları ile dolu mu?
- Bildirim eşleştirmesi (6.1) yapılmış mı?
- Test happy path (10.1) yazılmış mı?
- MVP dışı (11) ayrıştırılmış mı?

Hepsi onaylı → **skill geliştirmeye başlayabilir.**
