# Technical Analysis Course Execution Plan

## Purpose

This document turns the `Learn` concept into a build sequence for the current XAU Radar webapp. It assumes the current stack is the existing HTML, CSS, and JS app in this repo, and that the first implementation should be additive, practical, and safe to iterate.

## Current App Baseline

The current webapp already has:

- primary navigation in sidebar and mobile bottom nav
- pages for `Signal`, `Chart`, `History`, `Calendar`, and `Stats`
- bilingual intent already implied by the `中文` language toggle
- multiple beginner notes across the product

This means the `Learn` feature should not start from zero. It should extend the current mental model and help users understand the existing surfaces better.

## Delivery Strategy

Ship this in layered passes:

1. define navigation and information architecture
2. define lesson data model
3. build `Learn` shell and page switching
4. load v1 bilingual lesson content
5. add quizzes, progress, and app CTAs
6. polish mobile UI and copy
7. validate behaviour with real usage

## Folder and Documentation Structure

Use this folder for planning and future docs:

- `docs/learn/`

Recommended future supporting files if the feature is implemented:

- `docs/learn/CONTENT_GUIDE.md`
- `docs/learn/LOCALISATION_GUIDE.md`
- `docs/learn/QUIZ_BANK.md`
- `docs/learn/QA_CHECKLIST.md`

These do not need to be created yet unless implementation starts.

## Implementation Workstreams

## Workstream 1: Navigation and IA

### Objective

Introduce `Learn` without making navigation heavier.

### Decisions

- Add `Learn` as a first-class page.
- Prepare for a reduced mobile primary nav.
- Keep current pages functional during transition.

### Proposed nav rollout

#### Step 1

Add `Learn` to desktop sidebar and mobile nav in a temporary six-item state only if needed for quick testing.

#### Step 2

Refactor navigation toward:

- `Signal`
- `Chart`
- `Learn`
- `More`

#### Step 3

Move `History`, `Calendar`, and `Stats` under `More` for mobile, while retaining a richer desktop structure if desired.

### Files likely affected

- `index.html`
- `css/styles.css`
- `js/ui.js`

### Acceptance criteria

- `Learn` can be opened from both desktop and mobile navigation
- active state works correctly
- no broken page transitions
- mobile tap targets remain comfortable

## Workstream 2: Lesson Data Model

### Objective

Avoid hard-coding lesson content directly into HTML blocks in a way that becomes impossible to maintain.

### Recommendation

Use a structured JS data object or module for lesson definitions.

### Proposed lesson schema

```js
{
  id: 'trend-vs-range',
  order: 3,
  slug: 'trend-vs-range',
  estimatedMinutes: 4,
  ctaTarget: 'chart',
  quiz: [],
  copy: {
    en: {
      title: 'Trend vs Range',
      objective: '',
      coreIdea: '',
      whyItMatters: '',
      example: '',
      beginnerMistake: '',
      riskNote: '',
      exercise: ''
    },
    zh: {
      title: '趋势还是震荡',
      objective: '',
      coreIdea: '',
      whyItMatters: '',
      example: '',
      beginnerMistake: '',
      riskNote: '',
      exercise: ''
    }
  }
}
```

### Recommended location

- `js/learn-data.js` or a clean section inside `js/ui.js` as an interim step

### Acceptance criteria

- content can switch language without duplicating page logic
- lessons can be reordered without rewriting rendering code
- new modules can be added safely

## Workstream 3: Learn Tab UI Shell

### Objective

Create the base `Learn` page and lesson layout.

### Proposed Learn page structure

#### Hero block

- title such as `Learn Technical Analysis`
- short promise
- language-aware subcopy
- progress summary

#### Continue block

- `Continue Lesson 3`
- estimated time
- resume CTA

#### Module list

- 8 to 9 compact module cards or rows
- progress state
- lock/unlock or sequential hints if needed

#### Lesson detail area

- title
- objective
- core idea
- example
- beginner mistake
- risk note
- exercise
- quick quiz
- CTA to live app surface

### UI design rules

- keep the surface clean and premium
- avoid dashboard-card overload
- make chart examples the dominant teaching visual
- use whitespace and typography more than border-heavy boxes
- keep the first viewport clear and intentional

### Files likely affected

- `index.html`
- `css/styles.css`
- `js/ui.js`

### Acceptance criteria

- lesson layout reads comfortably on phone
- English and Chinese labels do not overflow badly
- lessons feel part of the product, not bolted-on docs

## Workstream 4: Curriculum Authoring

### Objective

Write the actual v1 content.

### Lesson list

1. How XAUUSD Moves
2. Candles Without Confusion
3. Trend vs Range
4. Support and Resistance
5. Timeframes That Work Together
6. Indicators as Helpers
7. Entry, TP, and SL
8. News Risk and No-Trade Zones
9. Review, Stats, and Improvement

### Content authoring method

For each lesson, write English first, then adapt Chinese:

1. objective
2. core idea
3. why it matters
4. one XAUUSD example
5. one beginner mistake
6. one risk note
7. one exercise
8. two to four quiz questions
9. one CTA back into the app

### Content standards

- keep lessons at 3 to 6 minutes
- use real XAUUSD framing
- avoid guru language
- reinforce probabilistic thinking
- keep examples concrete

### Acceptance criteria

- all nine lessons exist in both languages
- each lesson includes at least one exercise and one quiz
- all lesson copy is mobile-friendly

## Workstream 5: Malaysian English and Chinese Localisation

### Objective

Make the feature feel native to Malaysian users rather than globally generic.

### English localisation rules

- use simple, practical product English
- avoid aggressive US-style trading hype
- avoid overformal classroom tone
- prefer `better wait`, `too risky`, `price can spike`, `not clear yet`, `mark the level`

### Chinese localisation rules

- use clear Simplified Chinese for v1 unless business chooses Traditional later
- prioritise clarity over literal translation
- keep chart terms consistent
- avoid awkward translated metaphors

### Review process

- do self-review for tone and terminology
- compare English and Chinese quiz meanings
- check label width and line wrapping on mobile

### Acceptance criteria

- no machine-translation feel
- no obvious cultural mismatch
- bilingual quiz logic remains equivalent

## Workstream 6: Lesson-to-App Integration

### Objective

Turn the course into product guidance rather than isolated education content.

### CTA mapping

- lesson 1 -> `Calendar` and `Signal`
- lesson 2 -> `Chart`
- lesson 3 -> `Chart`
- lesson 4 -> `Chart`
- lesson 5 -> `Chart`
- lesson 6 -> `Signal` and `Chart`
- lesson 7 -> `Signal` and `Stats`
- lesson 8 -> `Calendar`
- lesson 9 -> `History` and `Stats`

### Product interactions

- add CTA buttons such as `Open Chart`, `Check Current Signal`, `Review Past Signals`
- optionally highlight relevant tab after CTA
- keep return path back to `Learn`

### Acceptance criteria

- every lesson leads somewhere useful
- users can move back and forth without getting lost

## Workstream 7: Quiz and Progress System

### Objective

Create enough feedback to improve learning without over-engineering the first version.

### v1 scope

- multiple choice quiz blocks
- inline answer feedback
- lesson completed state
- continue learning state
- local persistence using browser storage

### Progress state proposal

- `learn_language`
- `learn_last_lesson`
- `learn_completed_lessons`
- `learn_quiz_results`

### Acceptance criteria

- progress survives refresh
- language preference is remembered
- continue card reflects actual last lesson

## Workstream 8: Visual and Interaction Polish

### Objective

Make the feature feel intentional and premium.

### Motion ideas

- soft section reveal when opening a lesson
- progress bar fill transition
- subtle quiz feedback transition

### Visual ideas

- chart-led lesson hero imagery
- restrained accent use
- strong title hierarchy
- very limited badge use

### Avoid

- too many boxed cards
- neon education styling
- noisy gamification
- long scrolly text walls

### Acceptance criteria

- no part of the learn flow feels generic or cluttered
- first screen is understandable in seconds

## Workstream 9: QA and Content Validation

### Objective

Ensure the feature works for real learners, not just in theory.

### Functional QA

- open every lesson from fresh load
- switch languages on each lesson
- answer quizzes and verify feedback
- refresh page and verify progress persistence
- verify CTA targets

### UX QA

- test on phone widths
- test long Chinese strings
- test tap comfort for navigation
- test visual hierarchy in first viewport

### Content QA

- ensure no lesson over-teaches
- ensure every lesson has a risk note
- ensure no false-certainty language
- ensure examples remain XAUUSD-relevant

### Acceptance criteria

- no broken navigation or content states
- no critical mobile readability issue
- no major bilingual mismatch

## Recommended Build Order

### Sprint 0: Planning

- finalise project plan
- finalise lesson list
- finalise navigation direction

### Sprint 1: Scaffold

- add `Learn` page shell
- add nav entry
- add lesson data model
- add placeholder content rendering

### Sprint 2: Content and localisation

- write English lessons
- adapt Chinese lessons
- add quiz content

### Sprint 3: Interaction

- add progress persistence
- add continue flow
- add CTA links to app tabs

### Sprint 4: Polish

- refine mobile layout
- refine visual hierarchy
- improve copy density and transitions

### Sprint 5: QA and release prep

- run full functional QA
- run bilingual QA
- fix high-priority issues

## Concrete Implementation Notes for This Repo

### `index.html`

Likely work:

- add new `Learn` nav item
- add `page-learn` section
- optionally prepare `More` grouping later

### `css/styles.css`

Likely work:

- add `Learn` page layout styles
- support bilingual wrapping
- keep mobile spacing clean
- adjust bottom nav if structure changes

### `js/ui.js`

Likely work:

- register new page in navigation logic
- render lesson content
- handle language-aware lesson copy
- manage progress and quiz state
- wire CTAs to page changes

### `js/app.js`

Likely work:

- minimal or none, unless app-level initialisation is needed

## Definition of Done

The execution is complete when:

- `Learn` is live in the webapp
- nine lessons are available in English and Chinese
- lessons are clearly written for Malaysian users
- quizzes and progress work
- CTAs connect lessons to current app screens
- mobile UI remains clean
- no serious localisation issue remains

## Post-v1 Opportunities

- advanced lesson path
- annotated chart screenshots
- scenario-based drills using real historical signals
- journaling prompts tied to history and stats
- personalised lesson suggestions based on user behaviour
