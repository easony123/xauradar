# XAU Radar Learn Docs

This folder is the working implementation pack for the `Learn` feature on top of the existing XAU Radar webapp.

## What is here

- [`TECHNICAL_ANALYSIS_COURSE_PROJECT_PLAN.md`](./TECHNICAL_ANALYSIS_COURSE_PROJECT_PLAN.md): product strategy, target audience, curriculum shape, and success criteria
- [`TECHNICAL_ANALYSIS_COURSE_EXECUTION_PLAN.md`](./TECHNICAL_ANALYSIS_COURSE_EXECUTION_PLAN.md): repo-aware build sequence and workstreams
- [`CUSTOM_INSTRUCTIONS.md`](./CUSTOM_INSTRUCTIONS.md): project-specific rules for any AI coding assistant working on the `Learn` feature
- [`DEBUG_HANDBOOK.md`](./DEBUG_HANDBOOK.md): step-by-step debugging guide for common `Learn` feature failures
- [`PROMPT_LIBRARY.md`](./PROMPT_LIBRARY.md): copy-paste prompts for AI-assisted implementation, reviews, localisation, and QA
- [`CONTENT_AND_LOCALISATION_GUIDE.md`](./CONTENT_AND_LOCALISATION_GUIDE.md): curriculum, copy, and Malaysian bilingual content rules
- [`QA_CHECKLIST.md`](./QA_CHECKLIST.md): manual and implementation QA checklist for `Learn`

## Core operating assumptions

- The `Learn` feature is built on top of the current HTML, CSS, and JS app in this repo.
- The target audience is Malaysian beginners, not advanced traders.
- English copy should sound like practical Malaysian product English.
- Chinese copy should be natural and concise for Malaysian Chinese users.
- The product should teach through the current app surfaces: `Signal`, `Chart`, `History`, `Calendar`, and `Stats`.
- The feature should reduce confusion and blind signal-following, not add more clutter.

## Recommended working order

1. Read [`TECHNICAL_ANALYSIS_COURSE_PROJECT_PLAN.md`](./TECHNICAL_ANALYSIS_COURSE_PROJECT_PLAN.md).
2. Execute against [`TECHNICAL_ANALYSIS_COURSE_EXECUTION_PLAN.md`](./TECHNICAL_ANALYSIS_COURSE_EXECUTION_PLAN.md).
3. Keep [`CUSTOM_INSTRUCTIONS.md`](./CUSTOM_INSTRUCTIONS.md) active in any AI coding session.
4. Use [`CONTENT_AND_LOCALISATION_GUIDE.md`](./CONTENT_AND_LOCALISATION_GUIDE.md) before writing lesson copy.
5. Use [`PROMPT_LIBRARY.md`](./PROMPT_LIBRARY.md) for concrete implementation tasks.
6. Use [`DEBUG_HANDBOOK.md`](./DEBUG_HANDBOOK.md) when the `Learn` feature behaves incorrectly.
7. Validate changes against [`QA_CHECKLIST.md`](./QA_CHECKLIST.md).

## Current repo surfaces relevant to Learn

- `index.html`
- `css/styles.css`
- `js/ui.js`
- `js/app.js`

## Current product pages relevant to Learn

- `Signal`
- `Chart`
- `History`
- `Calendar`
- `Stats`

The `Learn` experience should be designed to make these pages easier to understand, not compete with them.
