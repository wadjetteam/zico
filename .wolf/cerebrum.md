---
description: learned preferences, project conventions, and Do-Not-Repeat rules
budget_tokens: 2000
---
# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-08-27

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** zico-version5
- **Risk treatment workflow:** Status must remain separate from overdue and escalation state; completion is evidence-driven, not simply progress == 100.
- **UI compatibility:** Browser prompts are unsupported in this runtime, so approval, evidence, and review forms must use in-app modal flows instead of `window.prompt()`.
- **Route placement:** The risk treatment module belongs in the Risk Management section and is exposed at `/risk/treatment` through both the nav config and app router.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
