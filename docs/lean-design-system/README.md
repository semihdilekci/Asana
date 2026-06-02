# Lean Management — Design System

**ADR 0009** ile Untitled UI React felsefesine geçiş kararı alındı.  
Bu klasör projenin tek görsel gerçekliğidir.

> **Faz 12 tamamlandı (2026-05):** `ls-*` bileşen sınıfları kaldırıldı. Yeni UI `apps/web/src/components/base/` + `application/` üzerinden; ikonlar `@untitledui/icons` (`base/icons/` re-export).

## Tasarım Felsefesi

Untitled UI React referansı alınarak:

- **Temiz, nötr zemin** — beyaz sayfa, minimal border
- **Elektrik Cyan marka** — `#7df9ff` imza tonu; eylemler için `#0aa7b0` (brand-600)
- **Sade tipografi** — Inter body, Plus Jakarta Sans display
- **Token hiyerarşisi** — semantic → component; `#hex` sabit değer yasak
- **Erişilebilir primitifler** — React Aria tabanlı bileşenler

## İçindekiler

```
lean-design-system/
├── tokens.css          # Renk, tipografi, spacing, radius, shadow, motion (CSS değişkenleri)
├── components.css      # BOŞ — Faz 12 İter 5 (eski ls-* kaldırıldı)
├── icons.jsx           # DEPRECATED — yalnızca referans; kullanmayın
├── index.css           # tokens (components.css artık boş)
└── README.md
```

## Brand Rengi Skalası

| Token               | Hex       | Kullanım                                                 |
| ------------------- | --------- | -------------------------------------------------------- |
| `--color-brand-300` | `#7df9ff` | Vurgu, glow efekti, focus ring, aktif rozet              |
| `--color-brand-500` | `#0dd4de` | İkincil eylem, badge bg                                  |
| `--color-brand-600` | `#0aa7b0` | **Birincil eylem** — buton arkaplanı, sidebar aktif pill |
| `--color-brand-700` | `#077d84` | Hover durumu                                             |
| `--color-brand-50`  | `#f0fdfe` | Hafif marka vurgusu arkaplanı                            |

## Bileşen Modeli (Faz 12 hedefi)

```
apps/web/src/components/
├── base/            # Untitled UI kaynak — Button, Input, Badge, Table…
│   ├── buttons/
│   ├── inputs/
│   ├── badges/
│   └── ...
├── application/     # Untitled UI dashboard parçaları — Sidebar, Header, Nav
├── shared/          # PermissionGate, DataTable sarmalayıcıları, PageShell
└── users|tasks|…   # Domain — sadece base/ ve shared/ kullanır
```

## `ls-*` → Yeni Bileşen Eşleme (Geçiş Tablosu)

| Eski (`ls-*`)              | Yeni (`base/`)                 | Durum         |
| -------------------------- | ------------------------------ | ------------- |
| `ls-btn ls-btn--primary`   | `<Button color="primary">`     | Faz 12 İter 2 |
| `ls-btn ls-btn--neutral`   | `<Button color="secondary">`   | Faz 12 İter 2 |
| `ls-btn ls-btn--danger`    | `<Button color="destructive">` | Faz 12 İter 2 |
| `ls-card`                  | `<Card>` / `<Section>`         | Faz 12 İter 2 |
| `ls-input`                 | `<Input>` / `<TextField>`      | Faz 12 İter 2 |
| `ls-alert ls-alert--error` | `<Alert variant="error">`      | Faz 12 İter 2 |
| `ls-sidebar-nav-link`      | `<SidebarNavItem>`             | Faz 12 İter 3 |

## Token Cheat-Sheet

| Amaç                   | Token                                            |
| ---------------------- | ------------------------------------------------ |
| Sayfa arkaplanı        | `var(--gradient-page-bg)`                        |
| Kart yüzeyi            | `var(--color-surface-card)`                      |
| Birincil eylem (brand) | `var(--color-brand-600)`                         |
| İmza vurgu (electric)  | `var(--color-brand-300)`                         |
| Hover                  | `var(--color-brand-700)`                         |
| Focus ring             | `var(--color-brand-300)` — `var(--shadow-focus)` |
| Ana metin              | `var(--color-text-primary)`                      |
| İkincil metin          | `var(--color-text-secondary)`                    |
| Üçüncül metin          | `var(--color-text-tertiary)`                     |
| Border                 | `var(--color-border-primary)`                    |
| Kart shadow            | `var(--shadow-card)`                             |
| Font body              | `var(--font-body)`                               |
| Font display           | `var(--font-display)`                            |
| Spacing                | `var(--space-1)` … `var(--space-12)`             |
| Radius                 | `var(--radius-xs)` … `var(--radius-card)`        |

## Kural: Token Dışına Çıkma Yasak

- Yeni renk/spacing: önce `tokens.css`'deki değişkenlere bak; yoksa **token dosyasına** ekle.
- **`#hex` literal değer** TSX/JSX içinde yasak.
- `components.css` boşaltıldı; bileşenler `apps/web/src/components/base/` kullanır.

## Cursor / Agent

`.cursor/rules/26-lean-design-system.mdc` — Untitled UI bileşen modeli + token kuralları  
`.cursor/rules/62-phase-12-UI-migration.mdc` — Faz 12 iterasyon planı  
ADR: `docs/adr/0009-untitledui-tailwind4-react-aria-ui-migration.md`
