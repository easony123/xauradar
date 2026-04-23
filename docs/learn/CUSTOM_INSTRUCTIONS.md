# Custom Instructions

Paste these rules into any AI workspace or keep them as the operating contract for the `Learn` feature in this repo.

## Full version

```text
You are working on the XAUUSD Radar repo at C:\Users\aikshen2001\OneDrive\Documents\XAUusd.

Project intent:
- Extend the existing XAU Radar webapp with a `Learn` experience that teaches beginner technical analysis inside the product.
- Build for Malaysian users first.
- Treat English and Chinese as first-class product languages for this feature.
- Keep the `Learn` feature practical, chart-linked, and tied to the current app pages.

Target user rules:
- The learner is a beginner or early beginner, not an advanced trader.
- The default learner is interested in XAUUSD and may use mobile first.
- The user needs clarity, structure, and risk discipline more than advanced theory.
- The product should help users understand when not to trade, not just when to trade.

Content rules:
- Teach market context before entries.
- Teach candles and structure before indicators.
- Teach support and resistance before advanced setups.
- Treat indicators as helpers, not as the centre of the curriculum.
- Include a risk note in every lesson.
- Include one XAUUSD-linked example in every lesson.
- Include one beginner mistake in every lesson.
- Include one CTA that sends the learner into a real app surface.
- Do not write course content like a trading guru, marketer, or social media salesman.
- Do not promise certainty, easy money, or unrealistic win rates.

Malaysian language rules:
- English should sound like practical Malaysian product English: clear, calm, simple, and not too American.
- Chinese should be concise, natural, and readable for Malaysian Chinese users.
- Avoid awkward direct translation.
- Prefer short labels that fit mobile UI.
- If a concept is hard to translate cleanly, preserve meaning rather than literal wording.

Frontend and UX rules:
- Keep the feature clean and premium, not noisy or gamified.
- Avoid adding a wall of cards with equal visual weight.
- Use chart-based examples as the main learning visual.
- Lessons should be finishable in one short sitting, usually around 3-6 minutes.
- The first screen of `Learn` must be understandable in seconds.
- Every page should have one dominant purpose.
- Do not let `Learn` make the mobile navigation worse.

Repo rules:
- Match the existing app structure unless there is a clear reason to refactor.
- Keep navigation logic consistent between desktop and mobile.
- If you add new page states, make sure `js/ui.js` page switching remains coherent.
- Prefer structured lesson data over large hard-coded HTML blobs.
- Keep copy maintainable and language-aware.
- Do not silently break the existing `Signal`, `Chart`, `History`, `Calendar`, or `Stats` flows.

Implementation rules:
- Build the `Learn` shell first, then content, then progress/quiz logic, then polish.
- Keep lesson content data separate enough to support future expansion.
- Preserve layout stability while content renders.
- Support bilingual switching without duplicating rendering logic unnecessarily.
- Persist user progress and last opened lesson in browser storage unless a stronger store is introduced later.

Testing rules:
- Test English and Chinese copy on mobile widths.
- Test navigation state carefully.
- Test progress persistence across refresh.
- Test CTAs from lessons into current app pages.
- Treat broken active-nav state, broken language switching, and broken progress persistence as release blockers.

Communication rules:
- Be explicit about assumptions.
- If you simplify scope, say what was deferred.
- If a design choice improves mobile clarity at the cost of feature count, prefer clarity.
- When in doubt, bias toward simplicity, teaching quality, and risk awareness.
```

## Compact version

```text
XAU Radar Learn rules:
- Build `Learn` for Malaysian beginner traders.
- Use calm Malaysian English and natural Chinese.
- Teach context -> candles -> structure -> levels -> timeframes -> indicators -> risk -> review.
- Tie every lesson to current app surfaces.
- Keep lessons short, practical, and mobile-friendly.
- Use chart examples, not theory walls.
- Never write hypey trading copy or imply certainty.
- Keep nav simple, progress persistent, and language switching reliable.
- Do not break existing page flows while adding Learn.
```

## Local project invariants

- The current app already has pages for `Signal`, `Chart`, `History`, `Calendar`, and `Stats`.
- The language toggle already exists in the top bar and should be respected by the future `Learn` flow.
- The mobile bottom nav is currently space-constrained and should not be casually overloaded.
- The `Learn` feature should improve understanding of live product surfaces rather than become a detached academy.

Any implementation that changes these assumptions should call it out explicitly in code review and docs.
