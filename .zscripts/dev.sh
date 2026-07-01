#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
bun install
bun run db:push
bun run db:generate
bun run dev
