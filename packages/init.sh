#!/usr/bin/env bash
set -e

echo "=== svutils Harness Initialization & Verification ==="

echo ">> Checking dependencies..."
bun install

echo ">> Running typecheck (svelte-check)..."
bun run check

echo ">> Running format check (oxfmt)..."
bun run format

echo ">> Running linter (oxlint & eslint)..."
bun run lint

echo ">> Running unit tests (vitest)..."
bun run test

echo ">> Testing library packaging (prepack)..."
bun run prepack

echo "=== All Checks Passed Successfully ==="
