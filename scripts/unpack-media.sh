#!/usr/bin/env bash
# Restores public/media/ (WebP images) from media-pack/media.tar.b64 after cloning.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/media
base64 -d media-pack/media.tar.b64 | tar -x -C public/media
echo "Restored $(ls public/media | wc -l) files into public/media/"
