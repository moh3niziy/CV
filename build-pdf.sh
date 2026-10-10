#!/bin/sh
# Regenerates the downloadable resume PDFs from index.html using headless Chrome.
# Run after editing the resume content: ./build-pdf.sh
set -e
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

for lang in en fa; do
    out="Mohsen-Iziy-Resume-$(echo "$lang" | tr a-z A-Z).pdf"
    "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
        --virtual-time-budget=8000 --print-to-pdf="$out" \
        "file://$PWD/index.html?lang=$lang#resume" 2>/dev/null
    echo "✓ $out"
done
