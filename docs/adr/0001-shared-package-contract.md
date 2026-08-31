# ADR-0001: Shared package contract JSON

## Status

Accepted

## Context

Emit (TypeScript Zod) and install (PHP) both need the same Free widget list, core plugins, snippet types, and Woo gate. Duplicated lists drifted (PHP tree rules lagged Zod).

## Decision

Keep one source file at `packages/schema/contract/ctw-contract.json`. `scripts/sync-contract.mjs` generates TypeScript constants and `CTW_Native\Contract\Package_Contract`. Elementor persistence for pages and ElementsKit templates goes through `Document_Writer` after `Tree_Validator`. `Element_Factory` is removed (no production caller). CLI owns argv UX; `@ctw/generate` is a library only.

## Consequences

Edit the JSON, run `npm run build -w @ctw/schema` (or root `npm run build`), commit generated TS + PHP. Do not hand-edit generated files.
