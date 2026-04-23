# Content And Localisation Guide

Use this guide when writing, editing, reviewing, or implementing `Learn` lesson content for XAU Radar.

## Core audience

Write for:

- Malaysian beginner traders
- users who are curious about XAUUSD but not strong in chart reading yet
- users who need practical structure, not market mythology
- users who may switch between English and Chinese

## Teaching priorities

Teach in this sequence unless there is a strong reason not to:

1. what XAUUSD is and why it moves
2. how to read candles
3. how to identify trend vs range
4. how to mark support and resistance
5. how to use timeframes together
6. how to use indicators carefully
7. how to plan entry, stop, and targets
8. how news affects setups
9. how to review trades and improve

## What every lesson must contain

- title
- objective
- one core idea
- why it matters
- one XAUUSD example
- one beginner mistake
- one risk note
- one guided exercise
- two to four quick-check questions
- one CTA into a real app surface

## Good lesson design rules

- teach one mental model per lesson
- keep each lesson short enough for mobile completion
- prefer examples and choices over long explanation blocks
- repeat risk awareness regularly
- explain where the idea fails or becomes unsafe

## Bad lesson patterns

- too many indicators in one lesson
- advanced jargon too early
- no real market example
- no warning about failure cases
- quiz questions that only test memorisation of terms
- copy that sounds like trading hype or social media flexing

## Tone guide for English

Use:

- clear, calm, practical wording
- short explanatory sentences
- product-style instructional language
- phrases like `better wait`, `too risky`, `not clear yet`, `mark the level`, `price can spike`

Avoid:

- `crush the market`
- `killer setup`
- `easy money`
- `institutional sniper entry`
- `you must take this trade`

### Good English examples

- `This chart looks bullish, but the candle has not closed yet. Better wait for confirmation.`
- `Gold can move very fast during major US news, so a good-looking setup can fail quickly.`
- `If you cannot tell whether price is trending or ranging, do not rush to enter.`

## Tone guide for Chinese

Use:

- short, direct sentences
- common trading words used consistently
- natural explanatory language
- concise risk reminders

Avoid:

- literal translation of English phrasing when it sounds awkward
- overly theatrical finance language
- mainland internet slang unless genuinely clearer

### Good Chinese examples

- `这根K线还没收稳，先别急着判断方向。`
- `重大数据公布前后，金价很容易突然放大波动。`
- `如果你还分不清趋势还是震荡，就先不要急着进场。`

## Bilingual implementation rules

- English and Chinese should carry equivalent meaning.
- Chinese should not be treated as a token add-on translation.
- UI labels must remain short enough for mobile.
- Quiz answers must map to the same logic in both languages.
- If one language needs slightly different phrasing for clarity, that is acceptable.

## Fixed terminology guidance

Try to stay consistent with these concept mappings:

| Concept | English | Chinese |
|---|---|---|
| trend | Trend | 趋势 |
| range | Range | 震荡 / 区间 |
| support | Support | 支撑 |
| resistance | Resistance | 阻力 |
| stop loss | Stop Loss | 止损 |
| take profit | Take Profit | 止盈 |
| entry | Entry | 进场 |
| breakout | Breakout | 突破 |
| pullback | Pullback | 回调 |
| risk | Risk | 风险 |
| high-impact news | High-impact news | 高影响新闻 / 高影响数据 |

Choose one Chinese variant per concept and stay consistent in code and UI.

## CTA mapping guide

Use these CTA destinations by default:

- chart-reading lessons -> `Chart`
- setup lessons -> `Signal`
- news lessons -> `Calendar`
- review lessons -> `History` or `Stats`

Each lesson should end with a real action such as:

- `Open Chart`
- `Check Current Signal`
- `Review Recent Signals`
- `See This Week's High-Impact Events`

## Suggested lesson lengths

- lesson overview: 20 to 40 words
- core explanation: 60 to 120 words
- beginner mistake: 1 to 2 short sentences
- risk note: 1 short sentence
- exercise: 1 short task
- quiz: 2 to 4 questions

## Content review checklist

Before shipping a lesson, ask:

- does this help a beginner make a better decision
- is the lesson too long for mobile
- is the risk note clear
- is the XAUUSD example concrete enough
- does the Chinese copy sound natural
- does the CTA lead somewhere genuinely useful

## Suggested lesson data shape

Use a content shape close to this:

```js
{
  id: 'support-resistance',
  order: 4,
  estimatedMinutes: 4,
  ctaTarget: 'chart',
  copy: {
    en: {
      title: 'Support and Resistance',
      objective: 'Learn how to mark the most relevant nearby levels.',
      coreIdea: 'Price often reacts at obvious zones where buyers or sellers defended earlier.',
      whyItMatters: 'Marking the right level helps you avoid entering into a wall.',
      example: 'If gold keeps rejecting the same zone near a prior high, that area can act as resistance.',
      beginnerMistake: 'Drawing too many lines until every part of the chart looks important.',
      riskNote: 'A strong news catalyst can break a good-looking level quickly.',
      exercise: 'Mark the nearest support and resistance on the current chart.'
    },
    zh: {
      title: '支撑与阻力',
      objective: '学会先找出离当前价格最近、最关键的水平位。',
      coreIdea: '价格常会在过去买卖双方明显防守过的区域出现反应。',
      whyItMatters: '先看清关键位置，可以避免直接撞上压力位或支撑位。',
      example: '如果金价多次在前高附近被压回去，这个区域就可能是阻力。',
      beginnerMistake: '画太多线，结果整张图看起来每个位置都重要。',
      riskNote: '重大新闻出来时，再漂亮的水平位也可能很快失效。',
      exercise: '打开当前图表，先标出最近的支撑和阻力。'
    }
  }
}
```
