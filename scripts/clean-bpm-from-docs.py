#!/usr/bin/env python3
"""Remove BPM/process/task documentation from docs/ (no archive)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


def remove_between_markers(text: str, start: str, end: str) -> str:
    i = text.find(start)
    if i == -1:
        return text
    j = text.find(end, i + len(start))
    if j == -1:
        return text
    return text[:i] + text[j:]


def remove_section_by_header(text: str, header_prefix: str, until_headers: list[str]) -> str:
    """Remove from line starting with header_prefix until next line matching any until_headers."""
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    skipping = False
    for line in lines:
        if not skipping and line.startswith(header_prefix):
            skipping = True
            continue
        if skipping:
            if any(line.startswith(h) for h in until_headers):
                skipping = False
                out.append(line)
            continue
        out.append(line)
    return "".join(out)


def clean_03_api(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(
        r"> \*\*Faz 14 \(2026-06\):\*\*.*?\n\n",
        "",
        text,
        count=1,
    )
    text = remove_between_markers(text, "### 9.5 Processes Modülü", "### 9.7 Documents Modülü")
    text = text.replace(
        "### 9.7 Documents Modülü\n\n> **Güncelleme (Faz 14):** Document modülü korunuyor; `process_id` / `task_id` bağlantıları kaldırıldı — generic attachment (`uploaded_by_user_id`) modeli geçerlidir.\n\n",
        "### 9.5 Documents Modülü\n\n",
    )
    # Renumber 9.8+ -> 9.6+
    for old, new in [
        ("### 9.11 ", "### 9.9 "),
        ("### 9.10 ", "### 9.8 "),
        ("### 9.9 ", "### 9.7 "),
        ("### 9.8 ", "### 9.6 "),
    ]:
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")


def clean_02_db(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = remove_between_markers(text, "### 6.4 Workflow", "### 6.5 Documents")
    text = text.replace("### 6.5 Documents", "### 6.4 Documents")
    text = text.replace("### 6.6 Notifications", "### 6.5 Notifications")
    text = text.replace("### 6.7 System", "### 6.6 System")
    text = re.sub(
        r"\*\*Faz 14 sonrası generic attachment:\*\* yalnızca yükleyen kullanıcıya \(`uploaded_by_user_id`\) bağlı; süreç/görev FK yok\.\n\n",
        "Generic dosya eki: yalnızca yükleyen kullanıcıya (`uploaded_by_user_id`) bağlı.\n\n",
        text,
    )
    path.write_text(text, encoding="utf-8")


def clean_04_backend(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = remove_between_markers(text, "## 10. Per-Process Module Pattern", "## 11. Background Jobs")
    text = remove_between_markers(text, "### 15.2 Per-Process Pattern", "## 16. Test Yapılanması")
    text = re.sub(r"\| `sla-monitor`.*\n", "", text)
    text = re.sub(
        r"Domain event'ler \(user\.created, task\.assigned, sla\.breached vb\.\)",
        "Domain event'ler (user.created, notification.* vb.)",
        text,
    )
    path.write_text(text, encoding="utf-8")


def clean_06_catalog(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(
        r"Platformda toplam \*\*\d+ ekran\*\* vardır — \d+ kritik, \d+ ikincil\.",
        "Platformda toplam **36 ekran** vardır — 24 kritik, 12 ikincil.",
        text,
    )
    # Remove table rows for groups 6-7
    text = re.sub(
        r"\| \*\*Grup 6 — Süreç.*?\n"
        r"(?:\| S-(?:PROC|TASK|KTI)[^\n]*\n)+"
        r"\| \*\*Grup 7 — Görevler\*\*.*?\n"
        r"(?:\| S-TASK[^\n]*\n)+",
        "",
        text,
        flags=re.DOTALL,
    )
    text = text.replace("**Grup 8 — Bildirimler", "**Grup 6 — Bildirimler")
    text = text.replace("**Grup 9 — Admin**", "**Grup 7 — Admin**")

    # Mermaid cleanup
    text = re.sub(
        r"\n    PROCADMIN\[.*?\n    PROCROLLBACK\[.*?\n\n    TASKLIST\[.*?\n    TASKDETAIL\[.*?\n",
        "\n",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(
        r"\n    DASH --> PROCADMIN\n    DASH --> TASKLIST\n",
        "\n",
        text,
    )
    text = re.sub(
        r"\n    PROCADMIN -->.*?\n    KTISTART -->.*?\n    PROCCANCEL -->.*?\n    PROCROLLBACK -->.*?\n",
        "\n",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(
        r"\n    TASKLIST -->.*?\n    TASKDETAIL -->.*?\n",
        "\n",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(
        r"\n    NOTIFLIST -->.*?(?=\n    NOTIFLIST -->|PROFILE)",
        "\n",
        text,
        count=1,
    )
    text = re.sub(
        r"\n    NOTIFLIST -->\|Bildirim tıkla\| TASKDETAIL\n    NOTIFLIST -->\|Bildirim tıkla\| PROCDETAIL\n",
        "\n",
        text,
    )
    text = re.sub(
        r",PROCMY,PROCADMIN,PROCDETAIL,KTISTART,TASKLIST,TASKDETAIL,",
        ",",
        text,
    )
    text = re.sub(r",PROCCANCEL,PROCROLLBACK modal", "", text)
    text = re.sub(r"    class PROCCANCEL,PROCROLLBACK modal\n", "", text)

    # Sidebar
    text = re.sub(
        r"📋 Görevlerim.*?\n🗂️ Master Data",
        "🗂️ Master Data",
        text,
        flags=re.DOTALL,
    )

    # Dashboard section replace
    dash_old = re.search(
        r"(#### S-DASH-HOME — Ana Sayfa\n\n)> \*\*⚠️ Güncelleme.*?(?=---\n\n### Grup 3)",
        text,
        flags=re.DOTALL,
    )
    if dash_old:
        dash_new = """#### S-DASH-HOME — Ana Sayfa

**Route:** `/dashboard`
**Erişim:** Auth (tüm authenticated kullanıcılar)
**Layout:** AppLayout
**Seviye:** Kritik

##### Görsel Yapı

1. **Hoşgeldin başlığı** — "Günaydın/İyi günler/İyi akşamlar, {firstName}" (saat dilimine göre)
2. **Kısa karşılama metni** — platform tanıtımı / yönlendirme (statik veya admin özeti)
3. **Widget grid** (opsiyonel, 12 kolon):
   - **W1 — Son Bildirimler** (tüm kullanıcılar): ilk 5 bildirim, "Tümünü Gör" → `/notifications`
   - **W2 — Denetim Chain Sağlığı** (`AUDIT_LOG_VIEW`): son doğrulama özeti → `/admin/audit-logs/chain-integrity`
4. **Hızlı aksiyonlar:** `<PermissionGate USER_CREATE>` "Kullanıcı Ekle", `<PermissionGate AUDIT_LOG_VIEW>` "Denetim Kayıtları"

##### Veri Kaynağı

- `GET /api/v1/notifications?limit=5`
- `GET /api/v1/admin/audit-logs/chain-integrity` (yetkili kullanıcılar)
- `queryKeys.notifications.list`, `queryKeys.admin.auditChainIntegrity`

##### Durum Ekranları

- Loading: widget skeleton'ları bağımsız
- Empty: bildirim yoksa sessiz empty state
- Error: widget bazlı `<ErrorBoundary>`

"""
        text = text[: dash_old.start(1)] + dash_new + text[dash_old.end() :]

    # Remove detailed screen sections (Grup 6-7 content)
    text = remove_between_markers(
        text,
        "#### S-PROC-LIST-ADMIN — Süreç Yöneticisi",
        "#### S-NOTIF-LIST — Bildirim Merkezi",
    )
    text = remove_between_markers(
        text,
        "### S-PROC-HISTORY — Süreç Tarihçesi",
        "### S-ADMIN-AUDIT-CHAIN — Audit Zinciri",
    )

    # Misc references
    text = text.replace("S-PROC-LIST-*, S-TASK-LIST, ", "")
    text = text.replace("S-KTI-START (before/after fotoğraflar), S-TASK-DETAIL (revize akışında).", "")
    text = text.replace("S-PROC-CANCEL` ve `S-PROC-ROLLBACK`", "yüksek riskli destructive aksiyonlar")
    text = re.sub(r"/ Task / Process /", "/ ", text)
    text = re.sub(
        r"Filter: event kategori \(Auth / Task / Process / System\)",
        "Filter: event kategori (Auth / System / …)",
        text,
    )
    path.write_text(text, encoding="utf-8")


def clean_10_roadmap(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(
        r"    F5\[Faz 5: Process Engine \+ KTİ Workflow\]\n    F6\[Faz 6: Task Management \+ Document Upload\]\n",
        "",
        text,
    )
    text = text.replace("F4 --> F5\n    F5 --> F6\n    F6 --> F7", "F4 --> F7")
    text = text.replace("F3 --> F7\n    F3 --> F8\n    F6 --> F8", "F3 --> F7\n    F3 --> F8")
    text = text.replace("F3 --> F9\n    F6 --> F9\n    F7 --> F9", "F3 --> F9\n    F7 --> F9")
    text = re.sub(
        r"    class F3,F4,F5,F6 core",
        "    class F3,F4 core",
        text,
    )
    text = text.replace(
        "**Kritik path:** F0 → F2 → F3 → F4 → F5 → F6 → F8 → F9 → F10 → F11 → F13 → F12.",
        "**Kritik path:** F0 → F2 → F3 → F4 → F7 → F8 → F9 → F10 → F11 → F13 → F12.",
    )
    text = re.sub(
        r"\n> \*\*Not \(Haziran 2026\):\*\* Faz 5.*?\n",
        "\n",
        text,
    )
    text = re.sub(
        r"\n### Faz 5 — Process Engine.*?\n### Faz 7 — Notification",
        "\n### Faz 7 — Notification",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(
        r"\n### Faz 14 — BPM Decommission.*?\n---\n\n### Faz 12 — UAT",
        "\n---\n\n### Faz 12 — UAT",
        text,
        flags=re.DOTALL,
    )
    text = text.replace("- Pilot user grubu KTİ süreçleri başlatıyor\n", "- Pilot user grubu temel akışları doğrular\n")
    text = text.replace("06_SCREEN_CATALOG (S-TASK-DETAIL tam şablonu)", "06_SCREEN_CATALOG")
    path.write_text(text, encoding="utf-8")


def clean_08_testing(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"\|.*SlaBadge.*Faz 14.*\n", "", text)
    text = re.sub(r"\|.*kti\.workflow.*Faz 14.*\n", "", text)
    text = remove_between_markers(
        text,
        "### 3.3 Integration Test Örneği — KTİ Full Flow",
        "### 3.4",
    )
    if "### 3.4" not in text:
        text = remove_between_markers(text, "### 3.3 Integration Test Örneği — KTİ Full Flow", "### 4.")
    text = re.sub(
        r"\n2\. \*\*KTİ happy path\*\*.*?\n3\. \*\*KTİ revision loop\*\*.*?\n",
        "\n",
        text,
    )
    text = remove_between_markers(text, "### 4.3 E2E Test Örneği — KTİ Happy Path", "### 4.4")
    if "### 4.4" not in text:
        text = remove_between_markers(text, "### 4.3 E2E Test Örneği — KTİ Happy Path", "## 5.")
    text = remove_between_markers(text, "### 7.2 KTİ Workflow", "### 7.3")
    if "### 7.3" not in text:
        text = remove_between_markers(text, "### 7.2 KTİ Workflow", "## 8.")
    text = re.sub(r"\| S-PROC-[^\n]*Faz 14[^\n]*\n", "", text)
    text = re.sub(r"\| S-TASK-[^\n]*Faz 14[^\n]*\n", "", text)
    text = re.sub(r"\| `process-list[^\n]*\n", "", text)
    text = re.sub(r"\| `kti-start[^\n]*\n", "", text)
    text = re.sub(
        r"\| `dashboard-mixed\.js` \|.*?\n",
        "",
        text,
    )
    text = re.sub(r"Lighthouse CI her PR'da kritik 3 sayfada.*?\n.*?`/processes`.*?\n", "", text, flags=re.DOTALL)
    path.write_text(text, encoding="utf-8")


def clean_07_security(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"\*\*PROCESS_ADMIN\*\* —.*?\n\n", "", text, flags=re.DOTALL)
    text = re.sub(r"\| PROCESS_[^\n]*\n", "", text)
    text = re.sub(r"- `PROCESS_[^\n]*\n", "", text)
    path.write_text(text, encoding="utf-8")


def clean_uat(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = remove_between_markers(text, "### TC-APP-005", "### TC-APP-006")
    if "### TC-APP-006" not in text:
        text = remove_between_markers(text, "### TC-APP-005", "### TC-APP-007")
    text = remove_between_markers(text, "### TC-APP-007", "### TC-APP-008")
    if "### TC-APP-008" not in text:
        text = remove_between_markers(text, "### TC-APP-007", "### TC-APP-")
    text = remove_between_markers(text, "## Ek A: Senaryo — uçtan uca", "## Ek B:")
    if "## Ek B:" not in text:
        text = remove_between_markers(text, "## Ek A: Senaryo — uçtan uca", "\n## ")
    path.write_text(text, encoding="utf-8")


def clean_mimari(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = remove_between_markers(text, "## 19. ASANA Pivot — BPM Decommission Kararı", "")
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def clean_00_overview(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"KTİ[^\n]*\n", "", text)
    text = re.sub(r".*süreç motoru.*\n", "", text, flags=re.IGNORECASE)
    path.write_text(text, encoding="utf-8")


def clean_01_domain(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    for hdr in [
        "### 2.",
        "## 3.",
        "## 4.",
        "## 5.",
        "## 6.",
    ]:
        pass
    text = remove_between_markers(text, "### 2.10 Process", "### 2.11")
    if "### 2.11" not in text:
        text = remove_between_markers(text, "### 2.10 Process", "## 3.")
    text = remove_between_markers(text, "### 2.11 Task", "### 2.12")
    if "### 2.12" not in text:
        text = remove_between_markers(text, "### 2.11 Task", "## 3.")
    text = re.sub(r"dinamik görev ataması[^\n]*\n", "", text)
    path.write_text(text, encoding="utf-8")


def global_faz14_strikes(path: Path) -> None:
    if not path.exists() or path.suffix != ".md":
        return
    text = path.read_text(encoding="utf-8")
    orig = text
    text = re.sub(r"> \*\*⛔ Kaldırıldı \(Faz 14\):\*\*[^\n]*\n\n?", "", text)
    text = re.sub(r"> \*\*⚠️ Güncelleme \(Faz 14\):\*\*[^\n]*\n\n?", "", text)
    text = re.sub(r" \(Faz 14 ile kaldırıldı\)", "", text)
    text = re.sub(r" — Faz 14 ile kaldırıldı", "", text)
    if text != orig:
        path.write_text(text, encoding="utf-8")


def main() -> None:
    (DOCS / "templates" / "PROCESS_DESIGN_TEMPLATE.md").unlink(missing_ok=True)

    clean_03_api(DOCS / "03_API_CONTRACTS.md")
    clean_02_db(DOCS / "02_DATABASE_SCHEMA.md")
    clean_04_backend(DOCS / "04_BACKEND_SPEC.md")
    clean_06_catalog(DOCS / "06_SCREEN_CATALOG.md")
    clean_10_roadmap(DOCS / "10_IMPLEMENTATION_ROADMAP.md")
    clean_08_testing(DOCS / "08_TESTING_STRATEGY.md")
    clean_07_security(DOCS / "07_SECURITY_IMPLEMENTATION.md")
    clean_uat(DOCS / "UAT_KULLANICI_KABUL_TEST_PLANI.md")
    clean_mimari(DOCS / "mimari-kararlar.md")
    clean_00_overview(DOCS / "00_PROJECT_OVERVIEW.md")
    clean_01_domain(DOCS / "01_DOMAIN_MODEL.md")

    for md in DOCS.rglob("*.md"):
        if "PROCESS_DESIGN" in md.name:
            md.unlink(missing_ok=True)
            continue
        global_faz14_strikes(md)

    print("BPM doc cleanup done.")


if __name__ == "__main__":
    main()
