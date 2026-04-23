# Technical Analysis Course Project Plan

## Overview

This project adds a `Learn` experience on top of the existing XAU Radar webapp so beginners can understand what they are seeing before they try to trade it. The course is designed for Malaysian users first, with content and UX tuned for:

- Malaysian English that feels natural, clear, and not too American
- Chinese copy that reads naturally for Malaysian Chinese users
- beginner traders who know XAUUSD exists but do not yet read charts confidently
- mobile-first usage, because many users will check signals and lessons from phone

The goal is not to build a giant theory academy. The goal is to build a practical in-app learning layer that helps users:

- read candles and trend structure
- understand support and resistance
- connect signals to chart context
- respect risk management and major news
- use the current app tabs more intelligently

The course should feel like a calm, credible mentor inside the product, not a hype funnel.

## Product Thesis

The strongest version of `Learn` is a guided micro-course tied directly to the existing webapp surfaces:

- `Signal` teaches what the live setup means
- `Chart` teaches structure, timeframe, and context
- `History` teaches review and pattern recognition
- `Calendar` teaches event risk and no-trade zones
- `Stats` teaches performance interpretation and risk discipline

Instead of separating learning from trading, the product should teach users using the exact screens they already use.

## Target Audience

### Primary audience

- Malaysians aged roughly 18 to 40
- beginner or early-stage traders
- users interested in XAUUSD, forex, and short-term trading
- users who may mix English and Chinese in daily life
- users who want simple explanations, not institutional jargon

### User traits

- comfortable with mobile apps
- impatient with long lectures
- attracted to signals, but often weak in chart reading
- easily confused by too many indicators
- likely to underestimate risk
- more likely to complete short lessons than long textbook chapters

### What they know now

- basic awareness of candles, buy/sell, TP, SL
- weak understanding of trend structure
- weak understanding of multi-timeframe thinking
- weak understanding of when not to trade
- little habit of journaling or reviewing losses

### What they should know after the core course

- how to identify trend vs range
- how to mark a usable support/resistance zone
- how to read the app's signal, chart, calendar, and stats in one flow
- how to think in probabilities instead of certainty
- how to avoid common beginner mistakes in XAUUSD

## Learning Promise

By the end of the first release, a beginner should be able to say:

- "I can read the basic story of the chart."
- "I know what this signal is trying to do."
- "I know where the setup becomes invalid."
- "I know when news risk is too high."
- "I know that not every clean chart should be traded."

## Strategic Principles

- Teach from chart context before indicators.
- Teach one mental model per lesson.
- Use XAUUSD examples by default.
- Repeat risk management early and often.
- Prefer action-based learning over long reading.
- Use current app screens as teaching surfaces.
- Keep lessons short enough to finish in 3 to 6 minutes.
- Treat Chinese localisation as first-class, not an afterthought.

## Scope

### In scope for v1

- New `Learn` entry in navigation
- Beginner-focused technical analysis micro-course
- 8 to 10 structured lessons
- Malaysian English and Simplified Chinese copy
- lesson cards, quick quizzes, and short practice tasks
- progress tracking in browser storage
- tight linkage from lessons back to live app screens
- CTA patterns such as `Go to Chart`, `Check Current Signal`, `Review Today`

### Out of scope for v1

- advanced ICT/SMC curriculum
- video hosting and voiceover
- user-generated notes
- paid subscriptions for lessons
- AI tutor chat
- certification
- deep personal analytics beyond simple completion metrics

## Success Criteria

### Product outcomes

- users can complete a lesson within one short sitting
- users can move from lesson to relevant app screen in one tap
- users understand what each current tab is for
- `Learn` reduces confusion rather than increasing UI clutter

### Learning outcomes

- users can correctly answer simple trend/range questions
- users can identify support/resistance on a chart image
- users can explain basic TP/SL logic
- users can identify why high-impact news changes trade quality

### Behaviour outcomes

- more chart opens from educational CTAs
- more history/stats visits for review instead of pure signal-chasing
- reduced reliance on blind signal-following

## UX Direction

## Navigation Strategy

Do not overload the bottom bar with six equal-weight buttons. The cleaner target state is:

- `Trade` or `Signal`
- `Chart`
- `Learn`
- `More`

Where `More` contains:

- `History`
- `Calendar`
- `Stats`

For desktop, the sidebar can remain fuller, but mobile should bias toward fewer primary items and clearer hierarchy.

## Learn Tab Experience

The `Learn` tab should behave like a guided workspace, not a wall of text.

### Learn tab structure

1. Hero / lesson overview
2. Continue learning rail
3. Current module card
4. Visual example block
5. Short drill or quiz
6. Real-app CTA
7. Module list / progress list

### What a single lesson should contain

- lesson title
- 1 clear objective
- 1 concise explanation
- 1 XAUUSD example
- 1 common beginner mistake
- 1 risk reminder
- 1 guided exercise
- 2 to 4 quick-check questions
- 1 next action inside the app

## Course Architecture

The recommended v1 curriculum is nine lessons.

### Module 1: How XAUUSD Moves

Outcome:
User understands that gold does not move randomly and is affected by USD, yields, session flow, and risk sentiment.

Practice:
User identifies whether a headline or market event is likely bullish, bearish, or volatile for gold.

Checkpoint:
User can explain why gold may spike even when the chart looked calm earlier.

### Module 2: Candles Without Confusion

Outcome:
User can read open, high, low, close and recognise rejection wicks.

Practice:
User labels bullish, bearish, and indecisive candles.

Checkpoint:
User can tell the difference between a strong close and a weak wicky candle.

### Module 3: Trend vs Range

Outcome:
User can identify higher highs, higher lows, lower highs, lower lows, and sideways structure.

Practice:
User chooses whether current price action is trending or ranging.

Checkpoint:
User avoids treating every small pullback as reversal.

### Module 4: Support and Resistance

Outcome:
User can mark usable zones without drawing too many lines.

Practice:
User selects the most relevant nearby reaction zone.

Checkpoint:
User can explain why a level matters.

### Module 5: Timeframes That Work Together

Outcome:
User understands why H1 can set bias while M15 or M5 helps execution.

Practice:
User matches higher timeframe bias with lower timeframe entry logic.

Checkpoint:
User stops mixing conflicting timeframes blindly.

### Module 6: Indicators as Helpers

Outcome:
User understands EMA, RSI, ATR, and ADX as supporting tools.

Practice:
User chooses whether an indicator confirms or conflicts with price action.

Checkpoint:
User no longer treats one indicator cross as a complete setup.

### Module 7: Entry, TP, and SL

Outcome:
User understands setup logic, invalidation, and staged targets.

Practice:
User selects a more sensible stop loss and target structure.

Checkpoint:
User can explain where the trade idea is wrong, not just where profit is hoped for.

### Module 8: News Risk and No-Trade Zones

Outcome:
User understands CPI, FOMC, NFP, and high-impact events can break clean chart structure.

Practice:
User decides whether to wait, reduce size, or skip a setup near news.

Checkpoint:
User can identify when a no-trade decision is the right decision.

### Module 9: Review, Stats, and Improvement

Outcome:
User understands win rate, TP hit patterns, and why review matters.

Practice:
User inspects history and stats to identify recurring mistakes.

Checkpoint:
User can describe one good habit and one mistake to remove.

## Content Design Rules

### Tone rules for Malaysian English

- Use clear, friendly product English.
- Sound practical, not academic.
- Avoid over-American phrasing such as "crush the market" or "killer setup".
- Avoid stiff British legalistic tone.
- Keep sentences short and scannable.
- Use familiar terms such as `mark the level`, `price spike`, `better to wait`, `too risky to chase`.
- Allow a lightly local rhythm, but do not force slang.

### Tone rules for Chinese

- Use natural Simplified Chinese unless you choose to support Traditional later.
- Keep financial terms consistent.
- Prefer short, plain instructional lines over literal word-for-word translation.
- Make sure the Chinese copy sounds like a teacher, not a machine translation.
- Avoid Mainland-only buzzwords if a clearer neutral term exists.

### Bilingual content rules

- English is the source of truth for lesson structure.
- Chinese is not direct translation only; adapt for clarity.
- UI labels must remain short enough for mobile.
- Quiz logic and answer meanings must stay equivalent across languages.

## Localisation Guidelines

### Malaysian English examples

- Good: `Price can turn fast near big news. Better wait for the candle to close.`
- Good: `This setup looks clean, but the stop loss is too tight for gold.`
- Good: `If you are not sure whether it is trend or range, do not rush the entry.`

### Chinese examples

- Good: `重大新闻前后，金价波动会突然放大，先等K线收稳会更稳妥。`
- Good: `这个形态看起来不错，但止损放得太近，黄金很容易先扫掉。`
- Good: `如果你还看不清是趋势还是震荡，就先不要急着进场。`

## Functional Requirements

### User-facing requirements

- user can enter `Learn` from main navigation
- user sees current progress
- user can start from lesson 1 or continue where they stopped
- each lesson supports English and Chinese
- each lesson contains a practice component
- each lesson links to at least one existing app surface
- user can mark lesson complete
- user can revisit any unlocked lesson

### Content requirements

- every lesson must include a risk note
- every lesson must include one XAUUSD example
- every lesson must include a beginner mistake callout
- every lesson must include one next-step CTA into the app

### Technical requirements

- no heavy layout shift while loading
- mobile performance must remain smooth
- lesson data structure must support localisation
- course content should be maintainable without rewriting app logic

## Proposed Information Architecture

### Primary navigation target state

- `Signal`
- `Chart`
- `Learn`
- `More`

### Learn page sections

- course hero
- continue card
- module cards
- lesson detail view
- quiz state
- practice CTA area
- progress summary

### More menu contents

- `History`
- `Calendar`
- `Stats`

## Data and Content Model

Each lesson should eventually support fields like:

- `id`
- `moduleId`
- `order`
- `slug`
- `title`
- `estimatedMinutes`
- `objective`
- `coreIdea`
- `whyItMatters`
- `example`
- `beginnerMistake`
- `riskNote`
- `guidedExercise`
- `quiz`
- `ctaTarget`
- `copy.en`
- `copy.zh`

Progress state should track:

- started lessons
- completed lessons
- last opened lesson
- quiz attempts
- language preference

## Visual Design Direction

The `Learn` experience should feel distinct from raw dashboard utilities but still belong to the same product family.

### Design direction

- keep the app premium and restrained
- avoid adding clutter or many cards for no reason
- use one clear visual anchor per lesson
- use chart imagery and annotations as the hero visual language
- use bold typography and calm spacing
- use motion only for guidance and continuity

### Avoid

- gamified noise
- excessive badges
- fake academy look
- course marketplace aesthetics
- too many tabs inside tabs

## Analytics and Measurement

Track at least:

- `learn_tab_opened`
- `lesson_started`
- `lesson_completed`
- `quiz_answered`
- `lesson_cta_clicked`
- `language_switched`
- `continue_learning_clicked`

Useful metrics:

- lesson completion rate
- average lesson completion time
- most abandoned lesson
- most used CTA target
- English vs Chinese usage split

## Risks

### Product risks

- adding a new tab makes navigation heavier instead of cleaner
- too much theory reduces lesson completion
- weak localisation makes Chinese users ignore the feature

### Learning risks

- content becomes too advanced too early
- indicators dominate the curriculum
- risk management is treated as optional

### Technical risks

- page logic grows messy if `Learn` is bolted in without shared config
- duplicated navigation becomes harder to maintain
- content structure becomes inconsistent if copy is hard-coded in many places

## Mitigations

- keep the course modular and short
- tie every lesson back to real app actions
- use shared navigation config for future tab work
- structure content data cleanly for bilingual support
- test real copy lengths on mobile in both languages

## Delivery Phases

### Phase 1: Planning and IA

- finalise navigation model
- finalise lesson list
- define bilingual copy standards

### Phase 2: Content Design

- write English lesson source
- adapt Chinese lesson copy
- create quizzes and drills

### Phase 3: Learn Tab UX

- design learn landing view
- design lesson detail pattern
- design practice and progress patterns

### Phase 4: Integration

- connect lessons to current app pages
- add progress tracking
- validate mobile behaviour

### Phase 5: QA and Refinement

- content QA
- bilingual QA
- UX polish
- analytics verification

## Acceptance Criteria

The project is ready for release when:

- `Learn` exists as a clear, discoverable product surface
- the first nine lessons are complete in English and Chinese
- the lessons feel written for Malaysians, not generic global users
- each lesson links to a relevant live app action
- mobile navigation remains usable
- copy has been reviewed for clarity and tone in both languages
- progress state works reliably across refreshes

## Recommended File Placement

This planning work belongs under `docs/learn/` so the documentation stays separate from the existing autotrade plans and can grow into a dedicated learning feature doc set.
