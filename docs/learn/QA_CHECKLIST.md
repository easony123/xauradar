# QA Checklist

Use this checklist before considering the `Learn` feature ready for release or ready for a major refactor.

## Functional QA

- `Learn` is reachable from desktop navigation
- `Learn` is reachable from mobile navigation
- active navigation state updates correctly
- opening `Learn` does not break existing `Signal`, `Chart`, `History`, `Calendar`, or `Stats` pages
- every lesson opens correctly
- lesson switching works correctly
- CTA buttons open the correct target page
- return path back to `Learn` remains understandable

## Content QA

- all planned lessons exist
- each lesson has English and Chinese copy
- each lesson includes one XAUUSD example
- each lesson includes one beginner mistake
- each lesson includes one risk note
- each lesson includes one guided exercise
- each lesson includes quiz questions
- each lesson includes one useful CTA
- no lesson sounds hypey or overconfident

## Localisation QA

- English reads like calm Malaysian product English
- Chinese reads naturally and does not feel machine translated
- English and Chinese quiz logic match
- labels fit on mobile in both languages
- no critical overflow, overlap, or clipped text appears in Chinese
- terminology stays consistent across all lessons

## Progress QA

- language preference is remembered
- last opened lesson is remembered
- completed lesson state is remembered
- progress survives refresh
- invalid storage data fails safely without breaking the page

## Quiz QA

- every question renders correctly
- answer options are tappable on mobile
- correct answers give correct feedback
- wrong answers give sensible feedback
- switching language does not corrupt answer logic
- switching lessons resets transient quiz state if expected

## Mobile QA

- first viewport is clear on phone
- no overcrowded bottom nav state
- lesson headers wrap cleanly
- buttons remain easy to tap
- charts, examples, and drill sections stack cleanly
- Chinese labels remain readable

## Visual QA

- one dominant idea is clear in the first viewport
- `Learn` feels like part of XAU Radar, not a generic education add-on
- page does not look like a wall of identical cards
- hierarchy is strong enough without relying on decorative effects
- motion, if present, supports clarity rather than noise

## Regression QA

- existing dashboard switch behavior still works
- language toggle still works
- existing data-driven pages still render normally
- no broken JS errors appear after adding Learn
- no layout shift makes the page hard to use

## Release blockers

Do not ship if any of these are true:

- `Learn` cannot be opened reliably
- language switching breaks content
- progress persistence fails
- lesson CTA targets are wrong
- mobile nav becomes cramped or confusing
- Chinese copy is clearly broken
- content makes unrealistic trading claims

## Suggested manual test flow

1. Open app in English.
2. Open `Learn`.
3. Start first lesson.
4. Complete one quiz.
5. Click CTA into `Chart` or `Signal`.
6. Return to `Learn`.
7. Switch to Chinese.
8. Re-open the same lesson.
9. Refresh the page.
10. Confirm language and progress persistence.
11. Test on phone width.
12. Scan the first viewport for clarity and clutter.
