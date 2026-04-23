# Prompt Library

Use these prompts when you want an AI assistant to implement or review the `Learn` feature in this repo without losing the product, content, and localisation rules.

## Prompt 1: scaffold the Learn page shell

```text
Work in this repo: C:\Users\aikshen2001\OneDrive\Documents\XAUusd

Read:
- docs/learn/TECHNICAL_ANALYSIS_COURSE_PROJECT_PLAN.md
- docs/learn/TECHNICAL_ANALYSIS_COURSE_EXECUTION_PLAN.md
- docs/learn/CUSTOM_INSTRUCTIONS.md
- index.html
- css/styles.css
- js/ui.js

Implement the first Learn page shell for XAU Radar.

Requirements:
- add a new Learn page section
- add Learn into the current navigation
- preserve existing Signal, Chart, History, Calendar, and Stats behavior
- keep mobile layout stable
- make the first viewport clear and premium, not cluttered
- do not implement full lesson data yet beyond placeholders if needed

Deliver:
- code changes
- brief explanation of nav and page-state changes
- assumptions or deferred items
```

## Prompt 2: create the lesson data model

```text
Work in this repo: C:\Users\aikshen2001\OneDrive\Documents\XAUusd

Read:
- docs/learn/TECHNICAL_ANALYSIS_COURSE_EXECUTION_PLAN.md
- docs/learn/CONTENT_AND_LOCALISATION_GUIDE.md
- docs/learn/CUSTOM_INSTRUCTIONS.md
- js/ui.js

Implement a structured lesson data model for the Learn feature.

Requirements:
- support English and Chinese content
- support title, objective, core idea, example, beginner mistake, risk note, exercise, quiz, and CTA target
- keep the shape maintainable and easy to extend
- do not hard-code giant HTML strings for lesson content

Deliver:
- the lesson data structure
- any helper render utilities needed
- a short explanation of how bilingual content is represented
```

## Prompt 3: write the v1 course content

```text
Work in this repo: C:\Users\aikshen2001\OneDrive\Documents\XAUusd

Read:
- docs/learn/TECHNICAL_ANALYSIS_COURSE_PROJECT_PLAN.md
- docs/learn/CONTENT_AND_LOCALISATION_GUIDE.md
- docs/learn/CUSTOM_INSTRUCTIONS.md

Write the v1 Learn curriculum content for the XAU Radar webapp.

Scope:
- How XAUUSD Moves
- Candles Without Confusion
- Trend vs Range
- Support and Resistance
- Timeframes That Work Together
- Indicators as Helpers
- Entry, TP, and SL
- News Risk and No-Trade Zones
- Review, Stats, and Improvement

Requirements:
- target Malaysian beginners
- write calm Malaysian English
- write natural Chinese
- include one XAUUSD example per lesson
- include one beginner mistake per lesson
- include one risk note per lesson
- include one app CTA per lesson
- keep each lesson concise and mobile-friendly

Deliver:
- lesson content structured for the codebase
- any assumptions or copy constraints
```

## Prompt 4: implement progress persistence

```text
Work in this repo: C:\Users\aikshen2001\OneDrive\Documents\XAUusd

Read:
- docs/learn/TECHNICAL_ANALYSIS_COURSE_EXECUTION_PLAN.md
- docs/learn/CUSTOM_INSTRUCTIONS.md
- docs/learn/QA_CHECKLIST.md
- js/ui.js

Implement Learn progress persistence using browser storage.

Requirements:
- remember language preference for Learn
- remember last opened lesson
- remember completed lessons
- survive refresh safely
- handle invalid storage data gracefully

Deliver:
- code changes
- storage keys used
- brief note on failure handling
```

## Prompt 5: implement quiz interactions

```text
Work in this repo: C:\Users\aikshen2001\OneDrive\Documents\XAUusd

Read:
- docs/learn/CONTENT_AND_LOCALISATION_GUIDE.md
- docs/learn/CUSTOM_INSTRUCTIONS.md
- docs/learn/QA_CHECKLIST.md

Implement the quiz interaction layer for Learn.

Requirements:
- support bilingual questions and answers
- provide immediate answer feedback
- keep answer mapping consistent across languages
- avoid overcomplicated scoring
- keep mobile interaction easy to tap

Deliver:
- code changes
- explanation of quiz state model
- tests or manual QA notes if relevant
```

## Prompt 6: refactor nav for Learn plus More

```text
Work in this repo: C:\Users\aikshen2001\OneDrive\Documents\XAUusd

Read:
- docs/learn/TECHNICAL_ANALYSIS_COURSE_PROJECT_PLAN.md
- docs/learn/TECHNICAL_ANALYSIS_COURSE_EXECUTION_PLAN.md
- docs/learn/CUSTOM_INSTRUCTIONS.md
- index.html
- css/styles.css
- js/ui.js

Refactor the navigation to support Learn without overcrowding mobile.

Goal:
- move toward a primary nav model of Signal, Chart, Learn, and More

Requirements:
- preserve existing page access
- keep desktop and mobile behavior coherent
- do not create cramped tap targets
- make the UI simpler, not more complex

Deliver:
- code changes
- short explanation of the navigation model
- any follow-up work still needed
```

## Prompt 7: review Learn feature with code-review mindset

```text
Review the Learn feature implementation in this repo with a code-review mindset.

Focus on:
- broken nav state
- brittle lesson data shape
- localisation bugs
- progress persistence issues
- wrong CTA targets
- mobile overflow and poor tap areas
- UX regressions caused by over-clutter

Present findings first with file references and severity. Keep summaries brief.
```

## Prompt 8: debug a broken Learn regression

```text
A bug was found in the Learn feature in this repo.

Before changing code:
- read docs/learn/CUSTOM_INSTRUCTIONS.md
- read docs/learn/DEBUG_HANDBOOK.md
- identify whether the failure is nav, state, data, localisation, persistence, or layout

Rules:
- do not redesign the whole feature if a narrow fix is enough
- do not break existing XAU pages while fixing Learn
- do not introduce English-only assumptions
- add or update QA notes if behavior changed

Then implement the smallest safe fix and summarize the behavioral change.
```

## Prompt 9: tighten Malaysian copy quality

```text
Work in this repo: C:\Users\aikshen2001\OneDrive\Documents\XAUusd

Read:
- docs/learn/CONTENT_AND_LOCALISATION_GUIDE.md
- docs/learn/CUSTOM_INSTRUCTIONS.md

Improve the Learn feature copy quality for Malaysian users.

Focus on:
- English that sounds practical and local, not too American
- Chinese that sounds natural and concise
- labels that fit mobile UI
- preserving teaching clarity and risk discipline

Deliver:
- rewritten copy
- note any terms that should stay fixed across the product
```

## Prompt 10: produce release-readiness notes

```text
Work in this repo: C:\Users\aikshen2001\OneDrive\Documents\XAUusd

Read:
- docs/learn/TECHNICAL_ANALYSIS_COURSE_PROJECT_PLAN.md
- docs/learn/TECHNICAL_ANALYSIS_COURSE_EXECUTION_PLAN.md
- docs/learn/QA_CHECKLIST.md

Write release-readiness notes for the Learn feature.

Include:
- navigation readiness
- bilingual content readiness
- mobile readiness
- analytics readiness
- known deferred items
- rollout risks
```
