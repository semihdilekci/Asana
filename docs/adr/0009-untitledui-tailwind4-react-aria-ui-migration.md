# ADR 0009: UI Katmanı Yenilenmesi — Untitled UI React + Tailwind CSS v4 + React Aria

## Durum

Kabul edildi (26 Mayıs 2026)

## Bağlam

Platformun mevcut UI katmanı `docs/lean-design-system/` altında proje-içi bir CSS token + utility sınıf sistemi (`ls-*`) üzerine kuruludur. Tailwind 3.4 ile birlikte kullanılan bu yapı, shadcn/ui primitiflerini gerektirdiği hâlde uygulanmamıştır; bileşen kütüphanesi fiilen yoktur. Proje büyüdükçe:

- Yeni ekranlar `ls-*` sınıflarıyla elle oluşturuluyor; bileşen yeniden kullanımı zayıf.
- `ls-btn`, `ls-card`, `ls-input` arasındaki tutarsızlıklar arttı.
- Uzun vadeli bakım yükü ve görsel tutarsızlık belirginleşti.
- Holding kullanıcılarının profesyonel görsel standart beklentisi, mevcut arayüzün gerisinde kalıyor.

**Hedef:** Untitled UI React'in felsefesi — sade token hiyerarşisi, erişilebilir primitifler, tutarlı bileşen sözdizimi — benimsenerek tüm geliştirmeler bu temele oturtulacak.

## Karar

### 1. Görsel referans: Untitled UI React (Free tier)

Untitled UI React'in **ücretsiz bileşenleri** proje bileşen tabanı olarak kullanılır. Kaynak kodu projeye kopyalanır (`apps/web/src/components/base/`); npm dependency değil. PRO bileşenler bu kararın kapsamı dışıdır; gerektiğinde ayrı ADR ile eklenebilir.

### 2. Tailwind CSS v4

`tailwindcss` **v3 → v4** yükseltmesi yapılır.

- `tailwind.config.ts` → `@theme` CSS blokları.
- `globals.css`: `@import "tailwindcss"` + `@import "./theme.css"`.
- Plugin'ler: `tailwindcss-animate`, `tailwindcss-react-aria-components`.

### 3. React Aria

Untitled UI bileşenlerinin temel erişilebilirlik katmanı `react-aria-components` üzerinden sağlanır. Mevcut ham `<button>` / `<input>` kullanımları bileşen migrasyonu sırasında React Aria primitifleriyle değiştirilir.

### 4. Brand rengi: Elektrik Cyan `#7df9ff`

Holding marka rengi `#7df9ff` (elektrik cyan) olarak belirlendi.  
Bu değer `--color-brand-300` konumuna yerleştirilir; birincil eylem (buton, sidebar aktif pill) için **`--color-brand-600`** (`#0aa7b0`) kullanılır — yeterli kontrast sağlar.

| Token               | Değer     | Kullanım                             |
| ------------------- | --------- | ------------------------------------ |
| `--color-brand-300` | `#7df9ff` | Vurgu, glow, focus ring, aktif rozet |
| `--color-brand-600` | `#0aa7b0` | Buton arkaplanı, sidebar aktif pill  |
| `--color-brand-700` | `#077d84` | Hover durumu                         |

### 5. İkonlar

`@untitledui/icons` paketi eklenir; `lucide-react` bağımlılığı **geçiş süresince korunur**, dalga 2 sonrası kaldırılır.

### 6. `ls-*` sınıfları — kademeli kullanım dışı bırakma

Mevcut `ls-*` sınıfları migration süresince çalışır durumda kalır. `components.css` **deprecated** olarak işaretlenir. Faz 12 Dalga 2 tamamlandığında kaldırılır.

### 7. Kural ve doküman güncellemesi

- `docs/lean-design-system/` içeriği Untitled UI + holding brand'e göre revize edilir.
- `.cursor/rules/26-lean-design-system.mdc` Untitled UI component modelini referans alır.
- `.cursor/rules/62-phase-12-UI-migration.mdc` geçiş iterasyonlarını tanımlar.

## Sonuçlar

- **Olumlu:** Bileşen tutarlılığı artar; yeni ekranlar hazır primitiflerden inşa edilir.
- **Olumlu:** React Aria ile WCAG 2.1 AA erişilebilirlik temeli otomatik sağlanır.
- **Olumlu:** Tailwind v4 `@theme` ile CSS değişkeni ve sınıf sistemi bütünleşir.
- **Dikkat:** Tailwind v3 → v4 breaking change'ler (`@tailwind` direktifleri, JIT değişiklikleri). Tüm mevcut Tailwind sınıfları gözden geçirilmeli.
- **Dikkat:** `#7df9ff` çok açık bir ton; metin kontrast testleri `brand-300` üzerinde yapılmalı — bu nedenle eylem bileşenleri `brand-600`+ kullanır.
- **Dikkat:** Geçiş süresi boyunca `ls-*` + yeni bileşenler birlikte çalışır — hibrit dönem `ls-*` kullanımını dondurur (yeni kod yasak).

## İlgili dokümanlar

- `docs/lean-design-system/README.md` — revize edilmiş DS kılavuzu
- `docs/lean-design-system/tokens.css` — güncellenen token listesi
- `.cursor/rules/26-lean-design-system.mdc` — ajan tasarım sistemi kuralları
- `.cursor/rules/62-phase-12-UI-migration.mdc` — faz ve iterasyon planı
- [Untitled UI React Docs](https://www.untitledui.com/react/docs/introduction) — kaynak referans
