#!/usr/bin/env python3
"""Second pass: strip remaining BPM lines from docs."""
import re
from pathlib import Path

DOCS = Path(__file__).resolve().parents[1] / "docs"


def drop_table_rows(text: str, prefixes: tuple[str, ...]) -> str:
    lines = []
    for line in text.splitlines():
        if line.startswith("|") and any(f"| `{p}" in line or f"| {p}" in line for p in prefixes):
            continue
        if line.startswith("|") and any(p in line for p in ("PROCESS_", "TASK_", "KTI_", "SLA_BREACH", "SLA_WARNING", "ROLLBACK_")):
            if "PROCESS_" in line or "TASK_" in line or "KTI_" in line or "SLA_" in line or "ROLLBACK" in line:
                # keep PASSWORD_EXPIRY etc
                if any(
                    x in line
                    for x in (
                        "PROCESS_",
                        "TASK_",
                        "KTI_",
                        "SLA_WARNING",
                        "SLA_BREACH",
                        "ROLLBACK_PERFORMED",
                        "PROCESS_STARTED",
                        "PROCESS_COMPLETED",
                        "PROCESS_CANCELLED",
                        "PROCESS_ROLLED",
                        "TASK_CLAIMED",
                        "TASK_COMPLETED",
                    )
                ):
                    continue
        lines.append(line)
    return "\n".join(lines) + "\n"


def clean_03(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = drop_table_rows(text, ("PROCESS_", "TASK_"))
    text = re.sub(r"GET /api/v1/processes\?[^\n]*\n", "", text)
    text = re.sub(r'"displayId": "KTI-[^"]*"[^\n]*\n', "", text)
    text = re.sub(r"PROCESS_KTI_START", "USER_LIST_VIEW", text)
    text = re.sub(r"KTİ Başlatıcı", "Örnek Rol", text)
    text = re.sub(r"KTI_INITIATOR", "EXAMPLE_ROLE", text)
    text = text.replace(
        '"contextType": "PROCESS_START"',
        '"contextType": "USER_PROFILE"',
    )
    text = text.replace(
        '"contextType": "TASK_ATTACHMENT"',
        '"contextType": "USER_PROFILE"',
    )
    text = re.sub(
        r"- `contextType`: `PROCESS_START` / `TASK_ATTACHMENT`\n",
        "- `contextType`: jenerik bağlam (ör. kullanıcı profil eki)\n",
        text,
    )
    text = re.sub(
        r".*process_id.*context=PROCESS_START.*\n",
        "- `documents` INSERT — `scan_status = PENDING_SCAN`, yalnızca `uploaded_by_user_id` ile ilişkilendirilir\n",
        text,
    )
    text = re.sub(
        r"\*\*Auth:\*\* Dokümanın ilişkili olduğu süreç/görev'e erişim yetkisi.*?\n",
        "**Auth:** Yükleyen kullanıcı veya `DOCUMENT_VIEW` yetkisi (gelecekte genişletilebilir).\n",
        text,
    )
    text = re.sub(r"Path=/processes\n", "Path=/documents\n", text)
    text = re.sub(
        r"/processes/clx-process/clx-task/",
        "/documents/{userId}/",
        text,
    )
    text = re.sub(
        r'"eventType": "TASK_ASSIGNED"[^\n]*\n(?:[^\n]*\n){0,5}',
        "",
        text,
    )
    text = re.sub(r'"linkUrl": "/tasks/[^"]*"\n', "", text)
    text = re.sub(r'"processId": "[^"]*"\n', "", text)
    text = re.sub(r"\| `PROCESS_ACCESS_DENIED` \| 403 \| \|\n", "", text)
    path.write_text(text, encoding="utf-8")


def clean_06(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(
        r'### Grup 6 — Süreç Yöneticisi ve KTİ\n\n',
        '### Grup 6 — Bildirimler ve Profil (devam)\n\n',
        text,
    )
    text = re.sub(
        r'   - "Başlattığı son 10 süreç".*?\n   - "Tümünü Gör".*?\n',
        '',
        text,
        flags=re.DOTALL,
    )
    text = re.sub(
        r'   - Event tipi select: Tümü / TASK_ASSIGNED.*?CONSENT_VERSION_PUBLISHED\n',
        '   - Event tipi select: platformda tanımlı `NotificationEventType` değerleri (ör. PASSWORD_EXPIRY_WARNING, CONSENT_VERSION_PUBLISHED)\n',
        text,
    )
    text = re.sub(
        r'       - TASK_ASSIGNED:.*?\n       - SLA_BREACH:.*?\n',
        '',
        text,
        flags=re.DOTALL,
    )
    text = re.sub(
        r'  2\. `linkUrl` varsa \(örn\. `/tasks/:id` veya `/processes/:displayId`\) → ilgili sayfaya navigate\n',
        '  2. `linkUrl` varsa → ilgili sayfaya navigate\n',
        text,
    )
    text = re.sub(
        r'   - Her satır bir `eventType` \(ör\. TASK_ASSIGNED.*?\)\n',
        '   - Her satır bir `eventType` (ör. PASSWORD_EXPIRY_WARNING, USER_CREATED)\n',
        text,
    )
    text = re.sub(
        r'/. *PROCESS_STARTED.*PROCESS_ROLLED_BACK.*TASK_CLAIMED.*TASK_COMPLETED.*\n',
        '   - **Aksiyon** multi-select: LOGIN_* / USER_* / ROLE_* / DOCUMENT_UPLOADED / IMPERSONATION_* / … (audit enum)\n',
        text,
    )
    text = re.sub(r'\| SLA \| `KTI_MANAGER_APPROVAL_SLA_HOURS`.*?\n', '', text)
    text = text.replace("S-USER-NEW, S-USER-EDIT, S-KTI-START, filtreler", "S-USER-NEW, S-USER-EDIT, filtreler")
    text = re.sub(
        r'<PermissionGate PROCESS_VIEW_ALL>.*?\n',
        '',
        text,
    )
    text = re.sub(
        r'- "Tümünü Gör" linki → `/tasks\?tab=completed`\n',
        '',
        text,
    )
    path.write_text(text, encoding="utf-8")


def clean_roadmap(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"Faz 14[^\n]*\n", "", text)
    text = re.sub(r"BPM[^\n]*\n", "", text)
    text = re.sub(r"KTİ[^\n]*\n", "", text)
    path.write_text(text, encoding="utf-8")


def clean_02(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"processes|tasks|task_assignments|process_type|KTI-", "", text)  # too aggressive?
    path.write_text(text, encoding="utf-8")


def main() -> None:
    clean_03(DOCS / "03_API_CONTRACTS.md")
    clean_06(DOCS / "06_SCREEN_CATALOG.md")
    # Don't run aggressive clean_02
    print("pass2 done")


if __name__ == "__main__":
    main()
