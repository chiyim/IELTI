#!/usr/bin/env bash
# Generate cover thumbnails for every PDF/EPUB in the e-book library.
# Idempotent: skips files where the resulting <id>.jpg already exists.
# Output: writes JPGs into ./thumbs/, logs to stderr.
set -u
SRC="/Volumes/NAS14T/English/漫画书合集pdf"
DST="/Users/ilam/Desktop/iLam_codex/IELTI/thumbs"
mkdir -p "$DST"
ok=0; skip=0; fail=0; epub_fail=0

slugify() {
  # Match the slug used by the data manifest: lowercase, non-alnum -> '-', trim '-'.
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/-+/-/g; s/^-|-$//g'
}

# Use python to iterate via null-separated filenames so spaces/CJK are safe.
python3 - "$SRC" "$DST" <<'PY'
import os, sys, subprocess, urllib.parse

src = sys.argv[1]
dst = sys.argv[2]
ok = skip = fail = epub_fail = 0

def slugify(name):
    import re
    s = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    s = re.sub(r'-+', '-', s)
    return s

files = sorted(os.listdir(src))
total = len(files)
for idx, name in enumerate(files, 1):
    full = os.path.join(src, name)
    if not os.path.isfile(full):
        continue
    # Skip macOS metadata sidecar files
    if name.startswith('._'):
        continue
    ext = os.path.splitext(name)[1].lower()
    if ext not in ('.pdf', '.epub'):
        continue

    book_id = slugify(os.path.splitext(name)[0])
    out = os.path.join(dst, book_id + '.jpg')
    if os.path.exists(out):
        skip += 1
        continue

    print(f'[{idx}/{total}] {name[:60]}', flush=True)
    # qlmanage writes a PNG with the same basename next to -o dir.
    # Large files (300+ MB) can take >60s to render the first page; allow 240s.
    try:
        proc = subprocess.run(
            ['qlmanage', '-t', '-s', '480', '-f', '1', '-o', dst, full],
            capture_output=True, timeout=240
        )
    except subprocess.TimeoutExpired:
        print(f'  timeout on {name[:40]}', flush=True)
        if ext == '.epub':
            epub_fail += 1
        else:
            fail += 1
        tmp_png = os.path.join(dst, name + '.png')
        if os.path.exists(tmp_png):
            try: os.remove(tmp_png)
            except OSError: pass
        continue
    tmp_png = os.path.join(dst, name + '.png')
    if proc.returncode == 0 and os.path.exists(tmp_png):
        # Convert PNG -> JPG and delete the PNG.
        sips = subprocess.run(
            ['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', 'high',
             tmp_png, '--out', out],
            capture_output=True
        )
        try: os.remove(tmp_png)
        except OSError: pass
        if sips.returncode == 0 and os.path.exists(out):
            ok += 1
        else:
            fail += 1
    else:
        if ext == '.epub':
            epub_fail += 1
        else:
            fail += 1
        # Cleanup any partial output
        if os.path.exists(tmp_png):
            try: os.remove(tmp_png)
            except OSError: pass

print(f'\nDone. Generated: {ok}, Skipped: {skip}, Failed (pdf): {fail}, Failed (epub): {epub_fail}')
PY
