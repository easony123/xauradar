# Debug Handbook

Use this handbook when the `Learn` feature behaves incorrectly or feels wrong in the current webapp.

## Primary debugging mindset

Debug in this order:

1. navigation and page state
2. lesson data loading
3. language switching
4. progress persistence
5. lesson CTA routing
6. mobile layout and copy overflow
7. visual hierarchy and UX quality

Do not start by patching CSS randomly. First identify whether the bug is data, state, rendering, or layout.

## Files most likely involved

- `index.html`
- `css/styles.css`
- `js/ui.js`
- `js/app.js`

Potential future files if introduced:

- `js/learn-data.js`
- `js/learn.js`

## Common failure modes

## 1. Learn tab does not open

### Likely causes

- missing `data-page="learn"` wiring in nav
- missing `page-learn` section in HTML
- `setActivePage()` logic does not recognise the new page correctly
- active nav state is being overwritten by another mode change

### What to check

- whether the `Learn` nav item exists in both sidebar and mobile navigation
- whether `id="page-learn"` exists
- whether `setActivePage('learn')` activates the correct section
- whether any existing dashboard mode logic redirects away from `learn`

### Safe fix pattern

- add page shell in HTML
- add nav items consistently
- update page-switch logic once, not in many scattered handlers

## 2. Learn page opens but content is blank

### Likely causes

- lesson data not loaded or malformed
- render function not called
- selectors do not match current DOM
- language key missing

### What to check

- whether lesson data object exists and is reachable
- whether required fields are present for the current lesson
- whether the render target element exists
- whether a JS error stops rendering early

### Safe fix pattern

- validate lesson data schema
- add default fallback values for optional text
- fail gracefully with a visible empty state instead of silent blank content

## 3. English works but Chinese copy is broken or missing

### Likely causes

- Chinese copy object missing on some lessons
- language key mismatch such as `zh` vs `cn`
- render logic assumes English-only fields
- string length causes UI clipping or overlap

### What to check

- whether every lesson has both `en` and `zh` copy
- whether the language toggle maps to the same keys used in lesson data
- whether mobile widths break line wrapping

### Safe fix pattern

- use one consistent language key convention
- add content validation before rendering
- let text wrap naturally on mobile instead of forcing single-line labels

## 4. Lesson progress does not persist after refresh

### Likely causes

- localStorage key mismatch
- saved JSON parse failure
- progress write happens but read path uses a different shape
- state update not triggered after saving

### What to check

- storage keys and payload shape
- whether writes happen after lesson completion
- whether reads happen on app init
- whether progress UI re-renders after load

### Safe fix pattern

- keep progress schema minimal
- use one storage reader and one writer helper
- guard invalid JSON and fall back safely

## 5. Lesson CTA opens the wrong app page

### Likely causes

- `ctaTarget` value does not match existing page IDs
- routing logic hard-codes legacy names
- nav state updates but page state does not

### What to check

- whether CTA target maps exactly to an existing `data-page`
- whether target page exists in DOM
- whether CTA return path back to `Learn` is preserved or intentionally omitted

### Safe fix pattern

- keep CTA targets equal to real page names
- use the same page-switching function as the main nav

## 6. Mobile layout becomes cramped after adding Learn

### Likely causes

- bottom nav has too many equal-width items
- long translated labels overflow
- lesson page uses too many stacked cards
- margins and padding inherited from desktop assumptions

### What to check

- bottom-nav column count
- label length in both languages
- first viewport on common phone widths
- whether the `Learn` page has too many competing blocks

### Safe fix pattern

- reduce primary nav complexity instead of squeezing more items
- shorten UI labels before shrinking typography too far
- use section hierarchy, not endless card stacks

## 7. Learn feature feels generic or cluttered even if technically correct

### Likely causes

- too many cards of equal visual weight
- no clear first action
- too much text above the fold
- visual style does not match the rest of the app
- course copy sounds like a textbook or trading influencer

### What to check

- can the first viewport be understood in 5 seconds
- is one main action obvious
- is chart imagery doing teaching work
- does the copy sound calm and credible

### Safe fix pattern

- reduce, merge, or reorder sections
- make one current lesson dominant
- move secondary content lower
- rewrite copy to sound more practical

## 8. Quiz logic behaves strangely

### Likely causes

- answer indexes mismatch between languages
- score state persists incorrectly
- lesson changes do not reset local quiz state

### What to check

- whether question options are structurally identical across languages
- whether correct answer references are index-based or key-based
- whether switching lesson resets transient state cleanly

### Safe fix pattern

- use stable question IDs
- use consistent answer keys across languages
- separate persisted progress from transient answer-selection state

## Debugging workflow by layer

## DOM layer

- confirm the relevant `Learn` elements exist
- confirm IDs and `data-page` values match JS logic
- confirm there is one source of truth for each rendered block

## State layer

- inspect active page value
- inspect language state
- inspect progress state
- inspect current lesson ID

## Data layer

- inspect lesson object shape
- confirm bilingual text presence
- confirm quiz schema integrity
- confirm CTA targets are valid

## Styling layer

- inspect overflow on phone widths
- inspect label wrapping
- inspect first viewport hierarchy
- inspect active states in nav and module lists

## Experience layer

- ask whether a real beginner would understand the screen
- ask whether the user knows what to do next
- ask whether the page teaches or merely displays content

## Release-blocking bugs

Treat these as high severity:

- `Learn` page cannot open
- language switching breaks lesson rendering
- progress does not persist reliably
- wrong CTA destination
- bottom nav becomes unusable on mobile
- blank lesson screen with no visible error state
- copy in either language is clearly broken or unreadable

## Quick triage prompts for future AI use

### Prompt: broken Learn page

```text
Debug the Learn feature in this repo.

Check in this order:
- page registration and nav state
- presence of page-learn in HTML
- lesson render path
- language state
- progress state

Do not redesign the feature yet. First identify the exact failing layer, then implement the smallest safe fix.
```

### Prompt: broken localisation

```text
Debug bilingual Learn content in this repo.

Focus on:
- en/zh lesson data completeness
- language key consistency
- mobile overflow in Chinese
- quiz answer mapping across languages

Preserve meaning and keep fixes minimal and safe.
```

### Prompt: UI feels cluttered

```text
Review the Learn page UX in this repo.

Focus on:
- first viewport clarity
- section hierarchy
- chart-led teaching visuals
- card overload
- mobile scanability

Present concrete UI problems first, then propose the smallest high-leverage changes.
```
