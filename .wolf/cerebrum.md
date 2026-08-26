---
description: learned preferences, project conventions, and Do-Not-Repeat rules
budget_tokens: 2000
---
# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-08-24

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** new code
- **Audit backend:** Compile it as CommonJS (`module: CommonJS`, `moduleResolution: node`) before starting `dist/index.js`; `tsx watch` cannot run in this environment and the prior ESM build used unresolved extensionless imports.
- **Risk-to-asset relationship:** Use `assetId` as the source of truth, validate it against `ASSETS` on the backend, and keep `assetSystem` only as the human-readable display name.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
