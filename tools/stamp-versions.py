"""Add a version stamp to every local script and stylesheet link in docs/*.html.

Each link gets ?v=<first 8 characters of the file's SHA-1>, for example module4.js?v=1a2b3c4d.
When a file changes, its stamp changes, so browsers fetch the new copy instead of an old cached one.
Unchanged files keep their stamp and stay cached.

Run it from the repository root before committing:  python tools/stamp-versions.py
"""
import hashlib
import pathlib
import re

DOCS = pathlib.Path(__file__).resolve().parent.parent / "docs"
LINK = re.compile(r'((?:src|href)=")([A-Za-z0-9_.\-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(")')


def stamp(match):
    name = match.group(2)
    path = DOCS / name
    if not path.is_file():
        return match.group(0)
    version = hashlib.sha1(path.read_bytes()).hexdigest()[:8]
    return f"{match.group(1)}{name}?v={version}{match.group(3)}"


for page in sorted(DOCS.glob("*.html")):
    with open(page, encoding="utf-8", newline="") as f:  # newline="" keeps the file's own line endings
        text = f.read()
    new = LINK.sub(stamp, text)
    if new != text:
        with open(page, "w", encoding="utf-8", newline="") as f:
            f.write(new)
        print(f"stamped {page.name}")
    else:
        print(f"{page.name} already up to date")
