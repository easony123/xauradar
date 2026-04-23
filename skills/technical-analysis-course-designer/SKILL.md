---
name: technical-analysis-course-designer
description: Design beginner-friendly technical analysis courses, lesson ladders, exercises, quizzes, and in-app teaching flows. Use when Codex needs to create or refine a trading education curriculum, module sequence, lesson plan, onboarding lesson, course copy, or practice workflow for markets such as XAUUSD, forex, indices, or crypto.
---

# Technical Analysis Course Designer

Build courses that help beginners read price action, manage risk, and avoid false certainty. Keep lessons practical, market-linked, and short enough to be used inside a product, deck, document, or learning hub.

Read [references/course-blueprint.md](references/course-blueprint.md) when you need a starter module map, lesson ideas, exercise types, or beginner sequencing guidance.

## Quick Start

Start by fixing five decisions:

- Define the learner level: absolute beginner, early beginner, or novice trader.
- Define the product shape: in-app lessons, button-driven course page, deck, PDF, email sequence, or video outline.
- Define the anchor market: default to XAUUSD unless the user specifies another market.
- Define the learning promise: "read a chart," "understand signals," "learn risk control," or similar.
- Define the course length: quick path, core course, or full curriculum.

When details are missing, default to a beginner, in-app, XAUUSD-focused course with 8 to 10 lessons.

## Workflow

### 1. Define the Learner

- State what the learner knows today.
- State what the learner should be able to do after the course.
- State what the learner should still avoid doing after the course.
- State the main misconceptions to correct early.

Use language such as:

- "Read candles without overpredicting."
- "Distinguish trend, range, and breakout conditions."
- "Place stop loss and take profit with basic logic."
- "Avoid trading blindly into major news."

### 2. Build the Curriculum Spine

Sequence topics from concrete to abstract:

- Teach market context before trade setup.
- Teach candles and structure before indicators.
- Teach support and resistance before entries.
- Teach timeframes before multi-timeframe analysis.
- Teach risk before journaling and performance review.

Prefer 6 to 10 modules. Give each module one outcome, one practice task, and one testable checkpoint.

### 3. Design Each Lesson

Write each lesson with this structure:

1. Objective
2. Why it matters
3. One core concept
4. One annotated example
5. One beginner mistake
6. One guided exercise
7. One quick check or quiz
8. One risk note
9. One bridge to the next lesson

Keep lessons tight. One lesson should usually teach one mental model, not an entire trading framework.

### 4. Add Practice Loops

Use active learning in every module:

- Ask the learner to mark trend direction.
- Ask the learner to locate support or resistance.
- Ask the learner to decide whether a signal is tradeable.
- Ask the learner to choose a stop placement.
- Ask the learner to reject a bad setup.

Prefer short drills over long lectures.

### 5. Add Risk and Ethics

Include these ideas early and repeatedly:

- State that technical analysis is probabilistic, not predictive certainty.
- State that no setup is guaranteed.
- State that beginners should size small and survive first.
- State that news can invalidate clean-looking charts.
- State that overtrading and revenge trading are core beginner risks.

Do not design a course that glamorizes leverage, promises win rate fantasies, or frames indicators as magic.

## Course Design Rules

- Use plain language first and jargon second.
- Use XAUUSD examples when no market is specified.
- Use one chart concept per lesson whenever possible.
- Use indicators as supporting tools, not the center of the curriculum.
- Use current app surfaces when the course will live inside a product. Tie lessons to real tabs, cards, charts, history, and calendar views.
- Use assessments that test decisions, not memorization alone.
- Use repetition on risk, invalidation, patience, and no-trade conditions.
- Avoid starting with candlestick pattern catalogs. Teach structure and context first.

## Standard Deliverables

When the user asks for a course, produce some or all of the following:

- A module map with lesson titles and outcomes
- A detailed lesson spec for each lesson
- Quiz questions with answers
- Practice exercises or chart drills
- UI copy for cards, buttons, empty states, and callouts
- A progression plan from beginner to intermediate

## Lesson Spec Template

Use this template when the user wants depth:

```md
Lesson Title:
Learner Level:
Estimated Time:
Primary Goal:
Prerequisites:

Core Idea:
Explain the single concept the learner must retain.

Why It Matters:
Connect the concept to actual trading decisions.

Example:
Use one XAUUSD or market example with simple reasoning.

Common Beginner Mistake:
Name the likely misunderstanding.

Guided Exercise:
Ask the learner to perform one concrete task.

Quick Check:
Write 2-4 short quiz questions.

Risk Note:
State where the concept can fail or be misused.

Completion Signal:
State what proves the learner understood the lesson.
```

## Output Modes

Adapt the same curriculum to the requested format:

- For an in-app course, keep lessons modular, scannable, and action-oriented.
- For a deck, emphasize slides, visuals, and teaching beats.
- For a document, expand explanations and include examples plus exercises.
- For a tab or button inside a trading UI, prioritize compact micro-lessons, drills, and progress markers.

## Good Defaults for Beginner TA

Unless the user asks otherwise, bias toward this teaching arc:

1. What XAUUSD is and why it moves
2. How to read a candle
3. How to spot trend and range
4. How to mark support and resistance
5. How to use timeframes together
6. How to use indicators carefully
7. How to plan entry, stop, and target
8. How news changes the setup
9. How to review trades and improve

## Response Style

- Sound like a patient trading mentor, not a hype marketer.
- Teach from first principles.
- Prefer examples over slogans.
- Keep confidence calibrated.
- Explain tradeoffs and failure cases.
