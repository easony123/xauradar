(function learnPlatformBootstrap() {
  const STORAGE_KEY = 'xauradar_learn_platform_v2';
  const LANG_KEY = 'xauradar_lang';
  const EXAM_SIZE = 20;
  const PERFECT_SCORE = 20;
  const LESSON_CHAIN = [
    'xauusd-actually-moves',
    'candles-and-closing-strength',
    'market-structure-and-swing-logic',
    'support-resistance-zones',
    'trend-vs-range-decision-making',
    'multi-timeframe-bias-execution',
    'indicators-supporting-evidence',
    'entry-invalidation-targets',
    'news-risk-volatility-no-trade-zones',
    'liquidity-sweeps-stop-hunts',
    'breakout-vs-false-breakout',
    'pullback-entries-and-continuation',
    'session-behaviour-and-time-of-day-edge',
    'volatility-regimes-and-atr-adaptation',
    'supply-demand-order-blocks',
    'confluence-without-overfitting',
    'trade-management-review-process',
  ];
  const STAGE_META = {
    foundation: {
      title: {
        en: 'Foundation Track',
        zh: '基础阶段',
      },
      label: {
        en: 'Build real chart-reading habits before touching advanced concepts.',
        zh: '先建立真实的读图习惯，再进阶到更难的概念。',
      },
      eyebrow: {
        en: 'Stage 1',
        zh: '阶段 1',
      },
    },
    pro: {
      title: {
        en: 'Balanced Pro Track',
        zh: 'Balanced Pro 进阶阶段',
      },
      label: {
        en: 'Context, liquidity, and execution quality for more serious traders.',
        zh: '更重视背景、流动性与执行质量，适合想更认真进步的交易者。',
      },
      eyebrow: {
        en: 'Stage 2',
        zh: '阶段 2',
      },
    },
  };

  const roadmapLessons = createRoadmapLessons();
  const lessonMap = new Map(roadmapLessons.map((lesson) => [lesson.id, lesson]));

  const rootState = loadState();
  let rootEl = null;
  let listenersBound = false;
  let audioContext = null;
  let audioUnlocked = false;
  let activeMusicCue = null;
  let actionBarMeasureFrame = 0;

  function createRoadmapLessons() {
    return [
      createLessonXauDrivers(),
      createLessonCandlesClosingStrength(),
      createLessonMarketStructureSwingLogic(),
      createLessonSupportResistanceZones(),
      createLessonTrendRange(),
      createLessonMultiTimeframeBiasExecution(),
      createLessonIndicatorsSupportingEvidence(),
      createLessonEntryInvalidationTargets(),
      createLessonNewsRiskVolatility(),
      createLessonLiquiditySweeps(),
      createLessonBreakoutFalseBreakout(),
      createLessonPullbackEntriesContinuation(),
      createLessonSessionBehaviourTimeOfDay(),
      createLessonVolatilityRegimesAtr(),
      createLessonSupplyDemandOrderBlocks(),
      createLessonConfluenceWithoutOverfitting(),
      createLessonTradeManagementReview(),
    ];

    const preview = (config) => ({
      ...(config.id === 'candles-and-closing-strength'
        ? createLessonCandlesClosingStrength()
        : config.id === 'market-structure-and-swing-logic'
          ? createLessonMarketStructureSwingLogic()
          : config.id === 'support-resistance-zones'
            ? createLessonSupportResistanceZones()
            : config.id === 'multi-timeframe-bias-execution'
              ? createLessonMultiTimeframeBiasExecution()
              : config.id === 'indicators-supporting-evidence'
                ? createLessonIndicatorsSupportingEvidence()
                : config.id === 'entry-invalidation-targets'
                  ? createLessonEntryInvalidationTargets()
                  : config.id === 'news-risk-volatility-no-trade-zones'
                    ? createLessonNewsRiskVolatility()
                    : config.id === 'breakout-vs-false-breakout'
                      ? createLessonBreakoutFalseBreakout()
                      : config.id === 'pullback-entries-and-continuation'
                        ? createLessonPullbackEntriesContinuation()
                        : config.id === 'session-behaviour-and-time-of-day-edge'
                          ? createLessonSessionBehaviourTimeOfDay()
                          : config.id === 'volatility-regimes-and-atr-adaptation'
                            ? createLessonVolatilityRegimesAtr()
                            : config.id === 'supply-demand-order-blocks'
                              ? createLessonSupplyDemandOrderBlocks()
                              : config.id === 'confluence-without-overfitting'
                                ? createLessonConfluenceWithoutOverfitting()
                                : config.id === 'trade-management-review-process'
                                  ? createLessonTradeManagementReview()
            : {
              ...config,
              available: false,
              steps: [],
              questionBank: [],
              stats: config.stats || [],
            }),
    });

    const lessons = [
      createLessonXauDrivers(),
      preview({
        id: 'candles-and-closing-strength',
        stage: 'foundation',
        order: 2,
        slug: 'candles-and-closing-strength',
        estimatedMinutes: 18,
        difficulty: 'Foundation',
        round: 'Round 2',
        title: { en: 'Candles and Closing Strength', zh: 'K线与收盘力度' },
        summary: {
          en: 'Read conviction from closes, wicks, and follow-through instead of memorising candle names.',
          zh: '从收盘位置、影线和后续跟进判断力度，而不是死背K线名称。',
        },
      }),
      preview({
        id: 'market-structure-and-swing-logic',
        stage: 'foundation',
        order: 3,
        slug: 'market-structure-and-swing-logic',
        estimatedMinutes: 20,
        difficulty: 'Foundation',
        round: 'Round 2',
        title: { en: 'Market Structure and Swing Logic', zh: '市场结构与摆动逻辑' },
        summary: {
          en: 'Higher highs, lower lows, impulse, pullback, and where a structure break actually matters.',
          zh: '学习高低点、推动波、回调，以及真正重要的结构破坏。',
        },
      }),
      preview({
        id: 'support-resistance-zones',
        stage: 'foundation',
        order: 4,
        slug: 'support-resistance-zones',
        estimatedMinutes: 19,
        difficulty: 'Foundation',
        round: 'Round 2',
        title: { en: 'Support, Resistance, and Zones', zh: '支撑、阻力与区域' },
        summary: {
          en: 'Draw cleaner zones, stop overmarking, and learn what makes a level worth respecting.',
          zh: '学会画更干净的区域，别再画满全图，并知道什么水平位才值得尊重。',
        },
      }),
      createLessonTrendRange(),
      preview({
        id: 'multi-timeframe-bias-execution',
        stage: 'foundation',
        order: 6,
        slug: 'multi-timeframe-bias-and-execution',
        estimatedMinutes: 21,
        difficulty: 'Bridge',
        round: 'Round 2',
        title: { en: 'Multi-Timeframe Bias and Execution', zh: '多周期方向与执行' },
        summary: {
          en: 'Separate higher-timeframe bias from lower-timeframe execution so your trade idea stays coherent.',
          zh: '把高周期方向和低周期执行拆开，让交易逻辑保持一致。',
        },
      }),
      preview({
        id: 'indicators-supporting-evidence',
        stage: 'foundation',
        order: 7,
        slug: 'indicators-as-supporting-evidence',
        estimatedMinutes: 18,
        difficulty: 'Bridge',
        round: 'Round 2',
        title: { en: 'Indicators as Supporting Evidence', zh: '把指标当辅助证据' },
        summary: {
          en: 'Use EMA, RSI, ATR, and ADX to support structure instead of outsourcing your thinking.',
          zh: '让 EMA、RSI、ATR、ADX 去辅助结构，而不是代替你思考。',
        },
      }),
      preview({
        id: 'entry-invalidation-targets',
        stage: 'foundation',
        order: 8,
        slug: 'entry-invalidation-targets-and-trade-planning',
        estimatedMinutes: 23,
        difficulty: 'Bridge',
        round: 'Round 2',
        title: { en: 'Entry, Invalidation, Targets, and Trade Planning', zh: '进场、失效点、目标与交易计划' },
        summary: {
          en: 'Turn a chart read into an executable plan with logical entries, stops, and target structure.',
          zh: '把图表判断转成真正可执行的计划，包括合理的进场、止损和目标结构。',
        },
      }),
      preview({
        id: 'news-risk-volatility-no-trade-zones',
        stage: 'foundation',
        order: 9,
        slug: 'news-risk-volatility-and-no-trade-zones',
        estimatedMinutes: 18,
        difficulty: 'Bridge',
        round: 'Round 2',
        title: { en: 'News Risk, Volatility, and No-Trade Zones', zh: '新闻风险、波动与不交易区' },
        summary: {
          en: 'Know when clean-looking structure is not enough because event risk can distort the tape.',
          zh: '知道什么时候就算结构看起来很干净，也要因为消息风险而先避开。',
        },
      }),
      createLessonLiquiditySweeps(),
      preview({
        id: 'breakout-vs-false-breakout',
        stage: 'pro',
        order: 11,
        slug: 'breakout-vs-false-breakout',
        estimatedMinutes: 22,
        difficulty: 'Advanced',
        round: 'Round 3',
        title: { en: 'Breakout vs False Breakout', zh: '真突破 vs 假突破' },
        summary: {
          en: 'Differentiate expansion that can continue from expansion that was built only to trap late entries.',
          zh: '分辨能继续扩张的突破，和只是用来诱多诱空的假动作。',
        },
      }),
      preview({
        id: 'pullback-entries-and-continuation',
        stage: 'pro',
        order: 12,
        slug: 'pullback-entries-and-continuation-structure',
        estimatedMinutes: 22,
        difficulty: 'Advanced',
        round: 'Round 3',
        title: { en: 'Pullback Entries and Continuation Structure', zh: '回调进场与延续结构' },
        summary: {
          en: 'Learn what makes a pullback healthy, dangerous, or late.',
          zh: '学会判断一个回调是健康、危险，还是已经太迟。',
        },
      }),
      preview({
        id: 'session-behaviour-and-time-of-day-edge',
        stage: 'pro',
        order: 13,
        slug: 'session-behaviour-and-time-of-day-edge',
        estimatedMinutes: 21,
        difficulty: 'Advanced',
        round: 'Round 3',
        title: { en: 'Session Behaviour and Time-of-Day Edge', zh: '交易时段行为与时间优势' },
        summary: {
          en: 'Understand why London, New York, and overlap periods do not produce the same behaviour on gold.',
          zh: '理解伦敦盘、纽约盘和重叠时段为什么不会给黄金相同的走势行为。',
        },
      }),
      preview({
        id: 'volatility-regimes-and-atr-adaptation',
        stage: 'pro',
        order: 14,
        slug: 'volatility-regimes-atr-and-position-adaptation',
        estimatedMinutes: 21,
        difficulty: 'Advanced',
        round: 'Round 3',
        title: { en: 'Volatility Regimes, ATR, and Position Adaptation', zh: '波动状态、ATR 与仓位适配' },
        summary: {
          en: 'Adapt stops, expectations, and sizing to the market you actually have, not the one you wish for.',
          zh: '让止损、预期和仓位适配当下的市场，而不是适配你想像中的市场。',
        },
      }),
      preview({
        id: 'supply-demand-order-blocks',
        stage: 'pro',
        order: 15,
        slug: 'supply-demand-order-blocks-and-reaction-quality',
        estimatedMinutes: 24,
        difficulty: 'Advanced',
        round: 'Round 3',
        title: { en: 'Supply/Demand, Order Blocks, and Reaction Quality', zh: '供需区、订单块与反应质量' },
        summary: {
          en: 'Judge whether a reaction zone is strong, weak, or already consumed.',
          zh: '判断一个反应区是强、弱，还是已经被消耗。',
        },
      }),
      preview({
        id: 'confluence-without-overfitting',
        stage: 'pro',
        order: 16,
        slug: 'confluence-building-without-overfitting',
        estimatedMinutes: 22,
        difficulty: 'Advanced',
        round: 'Round 3',
        title: { en: 'Confluence Building Without Overfitting', zh: '建立共振，但不要过度拟合' },
        summary: {
          en: 'Use multiple aligned signals without building a fragile checklist that only looks smart in hindsight.',
          zh: '学会用多重共振，但别堆成一个只会事后看起来很聪明的脆弱清单。',
        },
      }),
      preview({
        id: 'trade-management-review-process',
        stage: 'pro',
        order: 17,
        slug: 'trade-management-review-and-process-improvement',
        estimatedMinutes: 24,
        difficulty: 'Advanced',
        round: 'Round 3',
        title: { en: 'Trade Management, Review, and Process Improvement', zh: '持仓管理、复盘与流程优化' },
        summary: {
          en: 'Protect gains, review mistakes, and build a process that compounds instead of just chasing entries.',
          zh: '保护利润、复盘错误，建立会长期复利的流程，而不只是追求进场点。',
        },
      }),
    ];

    return lessons.sort((a, b) => a.order - b.order);
  }

  function createLessonXauDrivers() {
    const questionBank = buildXauMoveQuestionBank();

    return {
      id: 'xauusd-actually-moves',
      stage: 'foundation',
      order: 1,
      slug: 'how-xauusd-actually-moves',
      estimatedMinutes: 18,
      difficulty: 'Foundation',
      available: true,
      round: 'Round 1',
      accent: 'gold',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: '20/20 mastery required', zh: '必须 20/20 才算完成' },
      ],
      title: {
        en: 'How XAUUSD Actually Moves',
        zh: 'XAUUSD 到底怎样动',
      },
      summary: {
        en: 'Read gold through USD, yields, sessions, and event risk instead of treating every move like random noise.',
        zh: '从美元、收益率、交易时段和事件风险理解黄金，而不是把每一段波动都当成随机噪音。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'Gold is not random just because it is fast',
            zh: '黄金不是因为快，就等于没逻辑',
          },
          body: {
            en: [
              'Gold often feels wild to beginners because it can move sharply around session opens, macro data, and sudden risk-off flows.',
              'But professional reading starts with context: the dollar, US yields, liquidity conditions, and whether price is reacting during Asia, London, or New York.',
            ],
            zh: [
              '很多新手觉得黄金很乱，是因为它在开盘时段、宏观数据和避险情绪变化时，常常会突然加速。',
              '但更专业的读法，是先看背景：美元、美国收益率、流动性状态，以及现在到底是亚洲盘、伦敦盘还是纽约盘。',
            ],
          },
          supportingCopy: {
            en: 'You are not predicting every tick. You are building a cleaner bias before you even think about entry.',
            zh: '你不是要预测每一跳，而是在考虑进场前，先建立一个更干净的偏向。',
          },
          chartState: createChartStateXauDrivers('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'The core engine: dollar, yields, and timing',
            zh: '核心引擎：美元、收益率、时间点',
          },
          body: {
            en: [
              'A softer dollar and easing yields often remove pressure from gold. A firmer dollar or rising real yields can lean against it.',
              'That bias still matters more when it appears during active liquidity windows. London and New York can turn a quiet chart into a one-direction expansion very quickly.',
            ],
            zh: [
              '美元转弱、收益率回落，通常会减轻黄金的压力。美元转强或真实收益率走高，则可能压着黄金。',
              '但这种偏向，往往要在流动性真的起来的时候才更有意义。伦敦盘和纽约盘，能很快把一张平静的图变成单边扩张。',
            ],
          },
          supportingCopy: {
            en: 'Bias gets stronger when macro and session behaviour point in the same direction.',
            zh: '当宏观背景和时段行为指向同一边时，偏向会更强。',
          },
          chartState: createChartStateXauDrivers('drivers'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'A realistic XAUUSD read',
            zh: '一个更像真实交易的 XAUUSD 读法',
          },
          body: {
            en: [
              'Imagine London opens after a softer CPI follow-through. Yields keep sliding, the dollar cannot reclaim strength, and gold pushes above the Asia high.',
              'That does not force a blind long, but it does tell you the stronger idea is to wait for a controlled pullback rather than instantly fade the breakout.',
            ],
            zh: [
              '想像伦敦盘开出后，前面偏冷的 CPI 影响还在延续。收益率继续回落，美元也收不回强势，黄金顺势突破亚洲高点。',
              '这不代表你要闭眼追多，但它告诉你，较强的思路通常是等一个受控回踩，而不是立刻逆势去空。',
            ],
          },
          supportingCopy: {
            en: 'Good TA is often about ranking ideas, not pretending there is only one outcome.',
            zh: '好的技术分析，很多时候是在给各种可能性排优先级，而不是假装只有一个结果。',
          },
          chartState: createChartStateXauDrivers('example'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: what deserves your attention first?',
            zh: '检查点：你应该先关注什么？',
          },
          body: {
            en: [
              'Scenario: US yields are slipping, DXY is weak, and London has just broken above the Asia high with gold holding the retest.',
            ],
            zh: [
              '情境：美国收益率回落、DXY 转弱，而伦敦盘刚刚向上突破亚洲高点，黄金回踩后仍守得住。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'Bias stays bullish, but the next job is to judge whether the pullback structure still holds.',
                zh: '偏向仍然偏多，但下一步要判断回踩结构是否还守得住。',
              },
              feedback: {
                en: 'Correct. Context points bullish, but professional execution still waits for structure confirmation.',
                zh: '正确。背景偏多，但更专业的执行仍然要等结构确认。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'Short immediately because the move already looks overextended.',
                zh: '立刻做空，因为涨太多了，看起来已经过度延伸。',
              },
              feedback: {
                en: 'Too reactive. “Already moved a lot” is not a thesis by itself.',
                zh: '太情绪化了。“已经涨很多”本身不算完整逻辑。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'Ignore the macro backdrop because the chart is already above Asia high.',
                zh: '既然已经站上亚洲高点，就不用管宏观背景。',
              },
              feedback: {
                en: 'The opposite. The macro backdrop is exactly what gives the move more quality.',
                zh: '刚好相反。正是宏观背景让这段走势更有质量。',
              },
            },
          ],
          chartState: createChartStateXauDrivers('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'Before the mastery exam',
            zh: '进入精通测试前',
          },
          body: {
            en: [
              'Remember the hierarchy: context first, structure second, execution third.',
              'If the backdrop is unclear, the best trade can simply be no trade. That mindset matters more than finding a perfect-looking candle.',
            ],
            zh: [
              '记住顺序：先看背景，再看结构，最后才是执行。',
              '如果背景不清楚，最好的交易也可能是什么都不做。这个观念比找到一根“完美”的K线更重要。',
            ],
          },
          supportingCopy: {
            en: 'The mastery exam is strict: 20 randomly drawn questions, and only 20/20 completes the lesson.',
            zh: '精通测试很严格：会随机抽 20 题，只有 20/20 才算完成本课。',
          },
          chartState: createChartStateXauDrivers('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonCandlesClosingStrength() {
    const questionBank = buildCandleStrengthQuestionBank();

    return {
      id: 'candles-and-closing-strength',
      stage: 'foundation',
      order: 2,
      slug: 'candles-and-closing-strength',
      estimatedMinutes: 18,
      difficulty: 'Foundation',
      available: true,
      round: 'Round 2',
      accent: 'sky',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Strong-close focus', zh: '聚焦强弱收盘' },
      ],
      title: {
        en: 'Candles and Closing Strength',
        zh: 'K线与收盘力度',
      },
      summary: {
        en: 'Read conviction from closes, wicks, and follow-through instead of memorising candle names.',
        zh: '从收盘位置、影线和后续跟进判断力度，而不是死背 K 线名字。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'A candle is a decision snapshot, not a magic pattern',
            zh: '一根 K 线是决策快照，不是魔法形态',
          },
          body: {
            en: [
              'Beginners often memorise candle names first, then force the market to match those names. That usually creates false confidence.',
              'A better starting point is simpler: where did the candle close, how much rejection did it leave, and did the next candles agree with that message?',
            ],
            zh: [
              '很多新手先背一堆 K 线名称，再硬把市场塞进那些名称里，这通常只会制造假自信。',
              '更好的起点更简单：这根 K 线收在哪里、留下多少拒绝痕迹、后面的 K 线有没有认可它的意思。',
            ],
          },
          supportingCopy: {
            en: 'Close location matters more than pattern labels when you are trying to read real conviction.',
            zh: '当你想读出真实力度时，收盘位置通常比形态名字更重要。',
          },
          chartState: createChartStateCandlesClosingStrength('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'Strong closes tell you who actually won the auction',
            zh: '强收盘，告诉你谁真正赢了这轮博弈',
          },
          body: {
            en: [
              'A bullish candle that closes near its high usually says buyers kept control into the close. A bearish candle that closes near its low says sellers stayed in charge.',
              'That does not guarantee continuation, but it does carry more information than a candle that travelled far and then gave most of it back before closing.',
            ],
            zh: [
              '一根多头 K 线如果收在接近最高点的位置，通常说明买方一直把控到收盘。空头 K 线收在接近最低点，也是在说卖方控制力还在。',
              '这不代表一定会延续，但它确实比“中途冲很远，最后又吐回去”的 K 线更有信息量。',
            ],
          },
          supportingCopy: {
            en: 'Strong close first. Follow-through second. Put those two together before calling something real strength.',
            zh: '先看强收盘，再看有没有后续跟进。两者结合后，才更像真实力度。',
          },
          chartState: createChartStateCandlesClosingStrength('close'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'Wicks are useful only when the next reaction agrees',
            zh: '影线有用，但前提是后面的反应也同意',
          },
          body: {
            en: [
              'A long lower wick into support can be constructive, but only if the next candles defend that rejection and start reclaiming ground.',
              'If the next candle immediately closes weak again, then the wick was only a temporary pause, not proof that buyers took back control.',
            ],
            zh: [
              '支撑位附近出现长下影线，确实可能是积极信号，但前提是后面的 K 线要继续守住这段拒绝并开始收复位置。',
              '如果下一根马上又弱收，那这根影线更像短暂停顿，而不是买方重新拿回控制权的证据。',
            ],
          },
          supportingCopy: {
            en: 'Never promote one wick into a full thesis without checking the next 1 to 3 candles.',
            zh: '不要只靠一根影线就升级成完整判断，至少先看后面 1 到 3 根的反应。',
          },
          chartState: createChartStateCandlesClosingStrength('example'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: which candle message deserves more respect?',
            zh: '检查点：哪一种 K 线信息更值得尊重？',
          },
          body: {
            en: [
              'Two bullish candles printed. One closed near its high and the next candle held above half its body. The other had a big upper wick and lost most of its move before the close.',
            ],
            zh: [
              '现在有两根多头 K 线。一根接近高点收盘，而且下一根仍守在它实体一半上方；另一根虽然涨得多，但上影很长，收盘前吐回了大部分涨幅。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'Respect the candle with the strong close and better follow-through.',
                zh: '更该尊重强收盘、且后续更能跟进的那一根。',
              },
              feedback: {
                en: 'Correct. Close quality plus follow-through carries more weight than a flashy move that cannot hold.',
                zh: '正确。收盘质量加上后续跟进，比一根看起来很猛但守不住的 K 线更重要。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'Respect the candle that travelled the furthest intrabar, even if it could not hold the move.',
                zh: '更该尊重盘中走得最远的那一根，就算最后守不住也没关系。',
              },
              feedback: {
                en: 'Not quite. Distance travelled matters less when the market rejects most of that move before the close.',
                zh: '不对。若收盘前已经吐回大部分走势，盘中走多远的重要性就下降了。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'Both candles mean the same thing, because they are both green.',
                zh: '两根都一样，因为它们都是阳线。',
              },
              feedback: {
                en: 'That is too shallow. Candle colour alone does not tell you how much control buyers actually kept.',
                zh: '这看得太浅了。K 线颜色本身，并不能说明买方到底守住了多少控制权。',
              },
            },
          ],
          chartState: createChartStateCandlesClosingStrength('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'Read the close, then test the reaction',
            zh: '先读收盘，再验证反应',
          },
          body: {
            en: [
              'One candle can start the idea, but the next reaction decides whether that idea deserves trust.',
              'That mindset is what stops you from overreacting to one dramatic wick or one emotional breakout bar.',
            ],
            zh: [
              '一根 K 线可以提供起点，但后续反应才决定这个起点值不值得信。',
              '这种思维，能帮你避免被一根夸张影线或一根情绪化突破棒带着跑。',
            ],
          },
          supportingCopy: {
            en: 'The mastery exam will test close quality, wick meaning, and follow-through discipline together.',
            zh: '接下来的精通测试，会一起考你对收盘质量、影线含义和后续跟进的理解。',
          },
          chartState: createChartStateCandlesClosingStrength('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonMarketStructureSwingLogic() {
    const questionBank = buildMarketStructureQuestionBank();

    return {
      id: 'market-structure-and-swing-logic',
      stage: 'foundation',
      order: 3,
      slug: 'market-structure-and-swing-logic',
      estimatedMinutes: 20,
      difficulty: 'Foundation',
      available: true,
      round: 'Round 2',
      accent: 'emerald',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Swing logic focus', zh: '聚焦摆动结构' },
      ],
      title: {
        en: 'Market Structure and Swing Logic',
        zh: '市场结构与摆动逻辑',
      },
      summary: {
        en: 'Higher highs, lower lows, impulse, pullback, and where a structure break actually matters.',
        zh: '学习高低点、推动波、回调，以及真正重要的结构破坏。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'Structure is the map behind the candles',
            zh: '结构，是 K 线背后的地图',
          },
          body: {
            en: [
              'Candles show the battle. Structure shows the path that battle is building over time.',
              'If you cannot see where the last meaningful high, low, impulse, and pullback are, your entries will usually become guesses dressed up as analysis.',
            ],
            zh: [
              'K 线展示的是单次交锋，结构展示的是这些交锋逐步拼出来的路径。',
              '如果你看不出最近一个有意义的高点、低点、推动波和回调在哪里，你的进场通常就会变成披着分析外衣的猜测。',
            ],
          },
          supportingCopy: {
            en: 'Structure helps you decide whether price is building continuation, failure, or just noisy overlap.',
            zh: '结构能帮你区分，价格是在做延续、做失败，还是只是在重叠噪音里打转。',
          },
          chartState: createChartStateMarketStructure('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'Impulse and pullback should be read as a pair',
            zh: '推动波和回调，应该成对阅读',
          },
          body: {
            en: [
              'A healthy bullish structure usually shows impulse first, then a pullback that fails to take back too much ground, then another push.',
              'If the pullback starts erasing the entire impulse and the reclaim is weak, that is no longer clean continuation behaviour.',
            ],
            zh: [
              '健康的多头结构，通常是先有推动波，再有一个没有吃回太多空间的回调，接着再往上推。',
              '如果回调开始把前面的推动几乎吃光，而且后续收复又很弱，那就已经不像干净的延续结构了。',
            ],
          },
          supportingCopy: {
            en: 'Do not judge the impulse alone. Judge how much of it survives the pullback.',
            zh: '不要只看推动波本身，更要看它在回调后还能保留多少。',
          },
          chartState: createChartStateMarketStructure('trend'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'A structure break matters only when it changes the sequence',
            zh: '结构破坏，只有改变顺序时才真正重要',
          },
          body: {
            en: [
              'One quick stab below a prior low is not automatically a full bearish shift. Sometimes it is only a sweep or brief liquidation.',
              'The meaningful break is the one that changes the sequence: a prior higher low fails, reclaim attempts stay weak, and the next lower high starts to hold.',
            ],
            zh: [
              '一次快速刺破前低，并不自动等于彻底转空。有时它只是扫流动性，或一次短暂甩盘。',
              '真正有意义的破坏，是顺序被改掉了：原本的更高低点失守，收复动作也站不回去，接着新的更低高点开始成立。',
            ],
          },
          supportingCopy: {
            en: 'A break is not just a line violation. It is a sequence violation.',
            zh: '结构破坏不只是穿线，而是顺序被破坏。',
          },
          chartState: createChartStateMarketStructure('example'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: has structure really changed?',
            zh: '检查点：结构真的变了吗？',
          },
          body: {
            en: [
              'Price briefly traded below the last pullback low, but it reclaimed the level fast and then printed another push that held above the prior base.',
            ],
            zh: [
              '价格短暂跌破了最近的回调低点，但很快收回该位置，随后又打出一段新的上推，并守在前面的底座上方。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'Not yet. One quick violation is not enough if the sequence gets repaired immediately.',
                zh: '还不算。若顺序马上被修复，一次短暂失守还不够构成真正转向。',
              },
              feedback: {
                en: 'Correct. The sequence matters more than one isolated poke through a level.',
                zh: '正确。比起单次刺穿，更重要的是后续顺序有没有真的被改掉。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'Yes. Any break of the last low automatically confirms a bearish reversal.',
                zh: '算。只要跌破最近低点，就自动确认转空。',
              },
              feedback: {
                en: 'Too rigid. Structure needs follow-through, not just one instant print below a level.',
                zh: '太死板了。结构转向需要后续跟进，而不是只看一瞬间的跌破。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'Structure does not matter as long as the chart still feels bullish overall.',
                zh: '只要整体感觉还偏多，结构就不重要。',
              },
              feedback: {
                en: 'That mindset gets people trapped. “Feels bullish” is weaker than actual sequence reading.',
                zh: '这种思路很容易被套。所谓“感觉偏多”，远不如实际顺序阅读可靠。',
              },
            },
          ],
          chartState: createChartStateMarketStructure('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'Structure gives your trade idea a spine',
            zh: '结构，是交易逻辑的骨架',
          },
          body: {
            en: [
              'If you can name the impulse, the pullback, the defended swing, and the invalidation point, you are no longer entering off pure emotion.',
              'That does not guarantee profit. It does make your idea clearer, testable, and easier to reject when the market proves you wrong.',
            ],
            zh: [
              '如果你能明确指出推动波、回调、被守住的摆动点，以及失效点，那你就不是纯情绪进场了。',
              '这当然不保证赚钱，但会让你的逻辑更清楚、更可检验，也更容易在市场证明你错时及时放弃。',
            ],
          },
          supportingCopy: {
            en: 'The mastery exam will force you to separate true sequence changes from noisy violations.',
            zh: '接下来的精通测试，会逼你分清真正的顺序变化，和只是噪音式的假破坏。',
          },
          chartState: createChartStateMarketStructure('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonSupportResistanceZones() {
    const questionBank = buildSupportResistanceQuestionBank();

    return {
      id: 'support-resistance-zones',
      stage: 'foundation',
      order: 4,
      slug: 'support-resistance-zones',
      estimatedMinutes: 19,
      difficulty: 'Foundation',
      available: true,
      round: 'Round 2',
      accent: 'violet',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Zone quality focus', zh: '聚焦区域质量' },
      ],
      title: {
        en: 'Support, Resistance, and Zones',
        zh: '支撑、阻力与区域',
      },
      summary: {
        en: 'Draw cleaner zones, stop overmarking, and learn what makes a level worth respecting.',
        zh: '学会画更干净的区域，别再画满全图，并知道什么水平位才值得尊重。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'A level is a reaction area, not a laser line',
            zh: '关键位更像反应区域，不是激光线',
          },
          body: {
            en: [
              'New traders often draw support and resistance as perfect lines, then panic the moment price wicks a little through them.',
              'Real markets rarely turn on one exact tick. What matters more is whether price reacts inside a meaningful area and whether that reaction actually changes behaviour.',
            ],
            zh: [
              '很多新手把支撑阻力画成一条完美直线，结果价格只要多刺一点点，就开始怀疑整个判断。',
              '真实市场很少在某一个精确点位上突然转向。更重要的是，价格是否在一个有意义的区域里发生反应，以及这个反应有没有真的改变行为。',
            ],
          },
          supportingCopy: {
            en: 'Think in shelves and pockets of interest, not single-pixel precision.',
            zh: '要把它看成平台和兴趣区，而不是像素级精确点。',
          },
          chartState: createChartStateSupportResistance('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'A good zone has memory, location, and reaction quality',
            zh: '好的区域，要有记忆、位置和反应质量',
          },
          body: {
            en: [
              'The best zones usually come from places the market already cared about: prior swing highs or lows, clean rejection shelves, session highs/lows, or breakout-retest areas.',
              'A random midpoint with no strong reaction history is usually not worth the same respect, even if you can draw a line there.',
            ],
            zh: [
              '最好的区域，通常来自市场本来就重视过的位置：前高前低、清楚的拒绝平台、时段高低点，或突破后回踩的区域。',
              '而图中央那种没什么强反应历史的位置，就算你也能画一条线出来，通常也不值得同样的尊重。',
            ],
          },
          supportingCopy: {
            en: 'A zone deserves attention when price previously changed behaviour there in a visible way.',
            zh: '只有当价格曾在该处明显改变过行为，这个区域才更值得注意。',
          },
          chartState: createChartStateSupportResistance('quality'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'Role reversal is stronger when the retest actually holds',
            zh: '角色互换，前提是回踩真的守住',
          },
          body: {
            en: [
              'A former resistance area can become support, but only if the retest is accepted and buyers defend it with follow-through.',
              'If price pokes above resistance, comes back down, and then cannot hold the retest, the “role reversal” story is still unproven.',
            ],
            zh: [
              '原本的阻力区，确实有机会变成支撑，但前提是回踩后要被接受，并且买方要用后续跟进把它守住。',
              '如果价格只是短暂站上去，又掉回来，回踩也守不住，那“阻力变支撑”的故事仍然没有被证明。',
            ],
          },
          supportingCopy: {
            en: 'Do not give a zone credit just because price touched it. Give it credit when behaviour changes there.',
            zh: '不要因为价格碰到区域就给它加分，要看行为有没有在那边真的改变。',
          },
          chartState: createChartStateSupportResistance('example'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: which zone deserves more respect?',
            zh: '检查点：哪个区域更值得尊重？',
          },
          body: {
            en: [
              'Zone A is a random midpoint where price paused once. Zone B lines up with a prior swing high, a London rejection, and a later breakout-retest shelf.',
            ],
            zh: [
              'A 区只是图中间一个随便停过一次的位置。B 区同时对齐了前高、伦敦时段的拒绝，以及之后的突破回踩平台。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'Zone B, because it has stronger location memory and clearer behaviour change.',
                zh: 'B 区，因为它的位置记忆更强，行为变化也更清楚。',
              },
              feedback: {
                en: 'Correct. A meaningful zone usually has multiple reasons to matter, not just one accidental pause.',
                zh: '正确。一个有意义的区域，通常不只靠一次偶然停顿，而是有多重理由让它重要。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'Zone A, because every place where price pauses should be treated equally.',
                zh: 'A 区，因为价格停过的地方都该一视同仁。',
              },
              feedback: {
                en: 'No. Not every pause is meaningful. Good zones usually have better location and stronger prior reactions.',
                zh: '不对。不是每一次停顿都同样重要。好的区域通常位置更关键，且之前的反应也更强。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'Both zones are identical as long as you draw them wide enough.',
                zh: '只要你画得够宽，两个区域其实都一样。',
              },
              feedback: {
                en: 'Drawing wider does not create quality. The level still needs real market memory.',
                zh: '画得更宽不会自动变高质量，区域还是要有真实的市场记忆。',
              },
            },
          ],
          chartState: createChartStateSupportResistance('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'Cleaner zones reduce emotional overtrading',
            zh: '区域画得更干净，情绪化交易就会少很多',
          },
          body: {
            en: [
              'When your chart has too many lines, every price tick starts to feel like a signal. That usually leads to overtrading.',
              'Cleaner zones force you to wait for price to arrive at places that actually matter. That patience is part of the edge.',
            ],
            zh: [
              '当你的图上线太多时，市场每跳一下都像是一个信号，这通常只会把你带向过度交易。',
              '更干净的区域，会逼你等价格来到真正重要的位置，而这种等待本身就是优势的一部分。',
            ],
          },
          supportingCopy: {
            en: 'The mastery exam will test zone quality, role reversal, and the discipline to ignore weak levels.',
            zh: '接下来的精通测试，会考你对区域质量、角色互换，以及忽略弱水平位的纪律。',
          },
          chartState: createChartStateSupportResistance('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonMultiTimeframeBiasExecution() {
    const questionBank = buildMultiTimeframeQuestionBank();

    return {
      id: 'multi-timeframe-bias-execution',
      stage: 'foundation',
      order: 6,
      slug: 'multi-timeframe-bias-and-execution',
      estimatedMinutes: 21,
      difficulty: 'Bridge',
      available: true,
      round: 'Round 2',
      accent: 'cyan',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Top-down workflow', zh: '自上而下流程' },
      ],
      title: {
        en: 'Multi-Timeframe Bias and Execution',
        zh: '多周期方向与执行',
      },
      summary: {
        en: 'Separate higher-timeframe bias from lower-timeframe execution so your trade idea stays coherent.',
        zh: '把高周期方向和低周期执行拆开，让交易逻辑保持一致。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'Bias and execution are not the same job',
            zh: '方向判断和执行，并不是同一份工作',
          },
          body: {
            en: [
              'The higher timeframe helps you decide what kind of move the market is more likely to respect. The lower timeframe helps you decide where and how to participate.',
              'Confusion starts when traders try to do both jobs on one chart and end up mixing a daily idea with a random five-minute trigger.',
            ],
            zh: [
              '高周期帮助你判断市场更可能尊重哪一种大方向，低周期帮助你决定该在哪里、用什么方式参与。',
              '很多人会混乱，是因为试图只用一张图同时完成这两份工作，最后把日线想法和 5 分钟的随机信号混在一起。',
            ],
          },
          supportingCopy: {
            en: 'First choose the direction framework. Then choose the execution framework.',
            zh: '先决定方向框架，再决定执行框架。',
          },
          chartState: createChartStateMultiTimeframe('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'Start high enough to see the map',
            zh: '先看够大的图，才看得到地图',
          },
          body: {
            en: [
              'If the higher timeframe is trending up into clean space, the lower timeframe should not be used to invent a full bearish thesis from one noisy red candle.',
              'The job of the lower timeframe is usually to refine timing, confirm structure, or warn that the higher-timeframe idea is not yet ready.',
            ],
            zh: [
              '如果高周期是在干净空间里向上走，那么低周期不该只因为一根杂乱阴线，就硬编出完整看空逻辑。',
              '低周期更常见的任务，是帮助你优化 timing、确认结构，或提醒你高周期想法暂时还没成熟。',
            ],
          },
          supportingCopy: {
            en: 'Use the lower timeframe to enter better, not to sabotage the bigger map.',
            zh: '用低周期是为了更好地进场，不是为了破坏大图逻辑。',
          },
          chartState: createChartStateMultiTimeframe('bias'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'A clean top-down XAUUSD workflow',
            zh: '一个更干净的 XAUUSD 自上而下流程',
          },
          body: {
            en: [
              'Suppose H1 shows higher highs and higher lows above a reclaimed breakout shelf. Then M15 can be used to wait for a pullback and reclaim, while M5 only helps tighten the trigger.',
              'That is very different from taking an M5 breakout in the opposite direction while pretending it outweighs the H1 structure.',
            ],
            zh: [
              '例如 H1 已经站在收回后的突破平台上方，并持续做更高高点和更高低点。这时 M15 可以用来等回踩和收复，M5 只是帮你把触发点收得更细。',
              '这和拿一个反方向的 M5 小突破，假装它比 H1 结构更重要，是完全不同的事。',
            ],
          },
          supportingCopy: {
            en: 'The smaller chart should serve the bigger thesis, not compete with it.',
            zh: '更小的图应该服务大逻辑，而不是和大逻辑打架。',
          },
          chartState: createChartStateMultiTimeframe('example'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: which timeframe is doing which job?',
            zh: '检查点：哪个周期该做哪份工作？',
          },
          body: {
            en: [
              'H1 is bullish above support. M15 has just pulled back into that support. M5 prints a small reclaim candle inside the M15 reaction area.',
            ],
            zh: [
              'H1 在支撑上方偏多，M15 刚回踩到支撑区域，而 M5 在这个 M15 反应区里打出一根小型收复 K 线。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'H1 gives the bias, M15 gives the setup, and M5 can help refine the trigger.',
                zh: 'H1 给方向，M15 给 setup，M5 只负责把触发点收得更细。',
              },
              feedback: {
                en: 'Correct. That is the clean top-down division of labour.',
                zh: '正确。这才是干净的自上而下分工。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'M5 now overrides H1 because execution is always more important than bias.',
                zh: '既然要执行，那 M5 现在就比 H1 更重要。',
              },
              feedback: {
                en: 'Not right. Execution matters, but it should still serve the bigger bias framework.',
                zh: '不对。执行当然重要，但它仍然应该服务更大的方向框架。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'All three timeframes are saying the same thing, so there is no need to separate jobs at all.',
                zh: '反正三个周期都在讲同一件事，所以根本不需要区分任务。',
              },
              feedback: {
                en: 'That is too loose. Even aligned timeframes still have different responsibilities.',
                zh: '这太松了。就算周期方向一致，它们的职责也还是不一样。',
              },
            },
          ],
          chartState: createChartStateMultiTimeframe('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'Good execution should look smaller than the thesis',
            zh: '好的执行，应该看起来比大逻辑更小',
          },
          body: {
            en: [
              'If your trigger chart is telling a bigger story than your bias chart, your process is probably backwards.',
              'A strong multi-timeframe process keeps the top-down story coherent: bigger chart for direction, smaller chart for precision.',
            ],
            zh: [
              '如果你的 trigger 图讲出来的故事，比你的 bias 图还大，那多半就是流程反了。',
              '好的多周期流程，会让自上而下的故事保持一致：大图负责方向，小图负责精度。',
            ],
          },
          supportingCopy: {
            en: 'The exam will test whether you can separate bias, setup, and trigger without mixing them up.',
            zh: '接下来的测试会检查你能不能把方向、setup 和 trigger 分清楚。',
          },
          chartState: createChartStateMultiTimeframe('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonIndicatorsSupportingEvidence() {
    const questionBank = buildIndicatorsQuestionBank();

    return {
      id: 'indicators-supporting-evidence',
      stage: 'foundation',
      order: 7,
      slug: 'indicators-as-supporting-evidence',
      estimatedMinutes: 18,
      difficulty: 'Bridge',
      available: true,
      round: 'Round 2',
      accent: 'amber',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Indicator discipline', zh: '指标使用纪律' },
      ],
      title: {
        en: 'Indicators as Supporting Evidence',
        zh: '把指标当辅助证据',
      },
      summary: {
        en: 'Use EMA, RSI, ATR, and ADX to support structure instead of outsourcing your thinking.',
        zh: '让 EMA、RSI、ATR、ADX 去辅助结构，而不是代替你思考。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'Indicators should confirm, not command',
            zh: '指标应该确认，不应该下命令',
          },
          body: {
            en: [
              'Indicators are useful because they summarise certain types of behaviour quickly. They become dangerous when traders treat them like autopilot buttons.',
              'A strong chart read should exist before the indicator is checked. The indicator then helps you judge whether that read is supported, stretched, or weak.',
            ],
            zh: [
              '指标有用，是因为它们能快速概括某类行为；它们危险，是因为很多人把它们当成自动驾驶按钮。',
              '一个像样的图表判断，应该先存在，再去看指标。指标的任务，是帮你确认这个判断是被支持、被拉伸，还是偏弱。',
            ],
          },
          supportingCopy: {
            en: 'Price first. Structure second. Indicator evidence after that.',
            zh: '先看价格，再看结构，最后才看指标证据。',
          },
          chartState: createChartStateIndicators('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'Different indicators answer different questions',
            zh: '不同指标，回答的是不同问题',
          },
          body: {
            en: [
              'EMA can help frame trend direction and reclaim logic. RSI can hint at momentum quality, but not replace structure. ATR helps you judge expected range. ADX helps judge trend strength, not entry timing by itself.',
              'Confusion comes when traders expect one indicator to answer all of those questions at once.',
            ],
            zh: [
              'EMA 更适合辅助趋势方向和收复逻辑；RSI 可以提示动能质量，但不能代替结构；ATR 帮你看波动预期；ADX 更多是看趋势强度，而不是单独给进场点。',
              '很多混乱，就是因为交易者期待一个指标同时回答所有问题。',
            ],
          },
          supportingCopy: {
            en: 'If you do not know what question an indicator answers, you will misuse the answer too.',
            zh: '如果你根本不知道一个指标在回答什么问题，你也一定会用错它给出的答案。',
          },
          chartState: createChartStateIndicators('roles'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'Structure plus indicator alignment is stronger than indicator alone',
            zh: '结构和指标同向，比单看指标更强',
          },
          body: {
            en: [
              'Suppose price reclaims a support shelf, EMA slope turns up, and RSI recovers from a weak patch back above the balance zone. That combination can support the long idea.',
              'But if EMA and RSI look “good” while price is still trapped under resistance with poor structure, the indicator story should not override the chart.',
            ],
            zh: [
              '例如价格先收回支撑平台，EMA 斜率也转上，RSI 从疲弱区重新回到平衡上方，这样的组合可以辅助多头想法。',
              '但如果 EMA 和 RSI 看起来“不错”，价格本身却还卡在阻力下方、结构也不好，那指标故事不该反过来压过图表。',
            ],
          },
          supportingCopy: {
            en: 'Confluence means alignment with the chart, not escape from the chart.',
            zh: '所谓共振，是和图表同向，不是逃离图表本身。',
          },
          chartState: createChartStateIndicators('example'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: what should the indicator actually do here?',
            zh: '检查点：这里的指标到底该做什么？',
          },
          body: {
            en: [
              'Price is sitting under resistance with messy overlap. RSI is rising, and one EMA cross just printed.',
            ],
            zh: [
              '价格还压在阻力下方，而且结构重叠很乱；此时 RSI 在上升，也刚出现一次 EMA 交叉。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'Use the indicator as supporting evidence only; it still cannot rescue weak structure.',
                zh: '指标只能当辅助证据，不能把弱结构直接救活。',
              },
              feedback: {
                en: 'Correct. Indicator strength does not magically upgrade messy structure.',
                zh: '正确。指标看起来偏强，并不会神奇地把混乱结构升级成高质量 setup。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'Take the trade immediately because indicator cross always matters more than price location.',
                zh: '立刻进场，因为指标交叉永远比价格位置更重要。',
              },
              feedback: {
                en: 'Too indicator-centric. Location and structure still decide whether the setup is efficient.',
                zh: '太以指标为中心了。位置和结构，仍然决定这笔交易是否高效。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'Ignore price completely once two indicators agree with each other.',
                zh: '只要两个指标一致，就可以完全不看价格。',
              },
              feedback: {
                en: 'That is exactly the trap. Indicators should support the chart, not replace it.',
                zh: '这正是陷阱。指标是辅助图表，不是取代图表。',
              },
            },
          ],
          chartState: createChartStateIndicators('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'An indicator is strongest when it says less',
            zh: '指标最强的时候，往往是它“说得更少”',
          },
          body: {
            en: [
              'The best indicator use is often modest: it confirms, warns, or helps you size expectations. It does not need to be the star of the trade idea.',
              'When indicators become your whole thesis, you usually stop reading the market and start reading a lagging summary of it.',
            ],
            zh: [
              '最好的指标使用方式，通常是克制的：用来确认、提醒、或帮你调整预期，而不是当整笔交易的主角。',
              '一旦指标变成你的全部逻辑，你通常就不是在读市场，而是在读市场的滞后摘要。',
            ],
          },
          supportingCopy: {
            en: 'The exam will test whether you can match the right indicator to the right question.',
            zh: '接下来的测试，会检查你能不能把正确指标配到正确问题上。',
          },
          chartState: createChartStateIndicators('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonEntryInvalidationTargets() {
    const questionBank = buildTradePlanningQuestionBank();

    return {
      id: 'entry-invalidation-targets',
      stage: 'foundation',
      order: 8,
      slug: 'entry-invalidation-targets-and-trade-planning',
      estimatedMinutes: 23,
      difficulty: 'Bridge',
      available: true,
      round: 'Round 2',
      accent: 'coral',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Trade planning focus', zh: '聚焦交易计划' },
      ],
      title: {
        en: 'Entry, Invalidation, Targets, and Trade Planning',
        zh: '进场、失效点、目标与交易计划',
      },
      summary: {
        en: 'Turn a chart read into an executable plan with logical entries, stops, and target structure.',
        zh: '把图表判断转成真正可执行的计划，包括合理的进场、止损和目标结构。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'A trade idea is not a trade plan yet',
            zh: '有想法，不等于已经有计划',
          },
          body: {
            en: [
              'Many traders can describe direction, but still cannot tell you where the trade becomes wrong, where the entry makes sense, or what the first realistic target is.',
              'That gap is where a lot of emotional trading begins.',
            ],
            zh: [
              '很多人能讲方向，但还是说不清楚哪里才算做错、哪里进场更合理、第一目标大概在哪里。',
              '而这段空白，正是很多情绪化交易开始的地方。',
            ],
          },
          supportingCopy: {
            en: 'Direction is only one part. A real plan needs location, invalidation, and payoff structure.',
            zh: '方向只是其中一部分。真正的计划还需要位置、失效点和收益结构。',
          },
          chartState: createChartStateTradePlanning('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'Invalidation tells you where the idea breaks',
            zh: '失效点，是告诉你逻辑在哪里坏掉',
          },
          body: {
            en: [
              'A stop should usually sit beyond the point that proves the trade thesis is no longer valid, not at a random round number that simply feels safe.',
              'Good invalidation is tied to structure. If a bullish continuation idea needs a higher low to survive, that higher low matters more than your comfort level.',
            ],
            zh: [
              '止损通常应该放在“足以证明这个逻辑已经不成立”的位置后面，而不是随便放在一个你觉得安全的整数位。',
              '好的失效点，应该绑定结构。如果你的多头延续逻辑需要一个更高低点继续活着，那这个更高低点就比你的主观舒适感更重要。',
            ],
          },
          supportingCopy: {
            en: 'A stop is not there to avoid pain. It is there to define the cost of being wrong.',
            zh: '止损不是为了躲痛，而是为了明确“做错要付多少钱”。',
          },
          chartState: createChartStateTradePlanning('invalidation'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'Targets should come from structure, not fantasy',
            zh: '目标位应该来自结构，不是来自幻想',
          },
          body: {
            en: [
              'A clean target often comes from prior highs, range edges, liquidity pools, or the next major opposing zone. It should be tied to where price may actually react.',
              'Saying “I want 1:5 RR” first and then inventing a target to match it is backwards.',
            ],
            zh: [
              '一个像样的目标位，常常来自前高、区间边界、流动性池，或下一个主要对手区域。它应该绑定价格可能真的会反应的位置。',
              '先决定“我要 1:5 RR”，再反过来硬编目标位去配合它，这个顺序是倒的。',
            ],
          },
          supportingCopy: {
            en: 'RR matters, but only after the target is structurally believable.',
            zh: 'RR 当然重要，但前提是目标位在结构上先说得通。',
          },
          chartState: createChartStateTradePlanning('example'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: which plan is actually coherent?',
            zh: '检查点：哪一种计划才算真正自洽？',
          },
          body: {
            en: [
              'A bullish pullback entry is near support. Plan A places the stop beyond the pullback low and targets the prior high. Plan B places a tight arbitrary stop inside noise and targets a distant fantasy level.',
            ],
            zh: [
              '现在是一个回踩支撑的多头进场。A 方案把止损放在回调低点后面，目标看前高；B 方案把止损随便塞进噪音里，却把目标写成一个很远的幻想位。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'Plan A, because its entry, invalidation, and target all come from the same structure.',
                zh: 'A 方案，因为它的进场、失效点和目标都来自同一套结构。',
              },
              feedback: {
                en: 'Correct. A coherent trade plan should come from one chart story, not three unrelated guesses.',
                zh: '正确。自洽的交易计划，应该来自同一个图表故事，而不是三个彼此无关的猜测。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'Plan B, because a tighter stop always means a smarter trade.',
                zh: 'B 方案，因为止损越短，交易就一定越聪明。',
              },
              feedback: {
                en: 'Not true. A stop that sits inside noise often gets clipped before the idea even has room to work.',
                zh: '不对。把止损塞进噪音里，常常会在逻辑还没真正失败前就先被打掉。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'Both are equal as long as the trader feels confident enough.',
                zh: '只要交易者够有信心，两种方案都一样。',
              },
              feedback: {
                en: 'Confidence is not structure. The plan still has to make sense on the chart.',
                zh: '信心不等于结构。计划本身还是得在图上说得通。',
              },
            },
          ],
          chartState: createChartStateTradePlanning('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'A plan should survive before the trade starts',
            zh: '好的计划，要在交易开始前就能站得住',
          },
          body: {
            en: [
              'If you already know where you are wrong, where you are aiming, and why the entry is placed there, you are less likely to improvise under pressure.',
              'That does not remove uncertainty. It does reduce chaos.',
            ],
            zh: [
              '如果你在交易开始前，就知道哪里错、目标看哪里、为什么从这里进，你就不容易在压力下临场乱改。',
              '这不会消除不确定性，但会明显减少混乱。',
            ],
          },
          supportingCopy: {
            en: 'The exam will test whether your entry, stop, and target come from one consistent chart logic.',
            zh: '接下来的测试，会检查你的进场、止损和目标，是否来自同一套一致的图表逻辑。',
          },
          chartState: createChartStateTradePlanning('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonNewsRiskVolatility() {
    const questionBank = buildNewsRiskQuestionBank();

    return {
      id: 'news-risk-volatility-no-trade-zones',
      stage: 'foundation',
      order: 9,
      slug: 'news-risk-volatility-and-no-trade-zones',
      estimatedMinutes: 18,
      difficulty: 'Bridge',
      available: true,
      round: 'Round 2',
      accent: 'rose',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Event-risk focus', zh: '聚焦事件风险' },
      ],
      title: {
        en: 'News Risk, Volatility, and No-Trade Zones',
        zh: '新闻风险、波动与不交易区',
      },
      summary: {
        en: 'Know when clean-looking structure is not enough because event risk can distort the tape.',
        zh: '知道什么时候就算结构很好看，也要因为事件风险而先避开。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'A good chart can still be a bad trade today',
            zh: '图很好看，不代表今天就是好交易',
          },
          body: {
            en: [
              'One of the biggest beginner mistakes is thinking a clean chart always deserves execution, no matter what is scheduled next.',
              'But around CPI, FOMC, NFP, or surprise headlines, the tape can behave in ways that temporarily ignore the beautiful structure you marked.',
            ],
            zh: [
              '新手很常见的错误之一，就是觉得只要图看起来干净，不管接下来要发生什么，都值得直接执行。',
              '但在 CPI、FOMC、NFP 或突发新闻附近，盘面常常会暂时无视你画得很漂亮的结构。',
            ],
          },
          supportingCopy: {
            en: 'Tradeability depends on timing and volatility regime, not only chart shape.',
            zh: '值不值得做，取决于 timing 和波动状态，而不只取决于图形长相。',
          },
          chartState: createChartStateNewsRisk('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'Event risk changes what “normal” looks like',
            zh: '事件风险会改写什么叫“正常”',
          },
          body: {
            en: [
              'Before a major release, spreads widen, liquidity thins, and price can fake one side before exploding the other way. During the release, normal stop logic often becomes less reliable.',
              'That does not mean “never trade news”. It means you should recognise when the environment no longer supports your usual style.',
            ],
            zh: [
              '重大数据前，点差会变宽、流动性会变薄，价格也可能先假扫一边再往另一边爆开。数据公布瞬间，平时那套止损逻辑也常常不再可靠。',
              '这不代表“永远不能碰新闻”，而是你要认出：现在的环境已经不再支持你平时那套做法。',
            ],
          },
          supportingCopy: {
            en: 'A no-trade decision can be a high-quality decision when volatility regime is distorted.',
            zh: '当波动状态失真时，不交易本身也可以是高质量决定。',
          },
          chartState: createChartStateNewsRisk('risk'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'A pretty setup right before CPI is still fragile',
            zh: '数据前的漂亮 setup，依然很脆弱',
          },
          body: {
            en: [
              'Imagine gold is holding a bullish structure beautifully, but CPI is fifteen minutes away and intraday ATR has already expanded sharply. That setup may still be directionally fine, yet execution quality is deteriorating fast.',
              'Many losses come from confusing “good idea” with “good moment”.',
            ],
            zh: [
              '想象一下，黄金结构看上去非常漂亮地偏多，但 CPI 只剩 15 分钟，日内 ATR 也已经明显放大。这时方向想法也许没错，但执行质量正在迅速变差。',
              '很多亏损，就是把“想法不错”和“时机不错”混为一谈。',
            ],
          },
          supportingCopy: {
            en: 'A strong thesis can still deserve a delayed entry if the timing is poor.',
            zh: '就算逻辑不错，只要 timing 很差，也完全可能值得延后进场。',
          },
          chartState: createChartStateNewsRisk('example'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: is this a no-trade zone?',
            zh: '检查点：这里算不算不交易区？',
          },
          body: {
            en: [
              'Gold is sitting on a clean support shelf, but FOMC statement is due soon, spreads are widening, and the last three candles are violently two-sided.',
            ],
            zh: [
              '黄金正好踩在一个很干净的支撑平台上，但 FOMC 声明快到了，点差在变宽，最近三根 K 线也都是双向乱甩。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'Yes. The structure may look clean, but current execution conditions are distorted.',
                zh: '算。结构也许好看，但当前执行条件已经失真了。',
              },
              feedback: {
                en: 'Correct. Clean structure alone is not enough when event risk is actively degrading execution quality.',
                zh: '正确。事件风险正在破坏执行质量时，光有干净结构还不够。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'No. If support is real, news should not matter very much.',
                zh: '不算。只要支撑是真的，新闻就不会太重要。',
              },
              feedback: {
                en: 'That is dangerous thinking. News can temporarily distort or blow through clean levels.',
                zh: '这种想法很危险。新闻完全可能暂时扭曲，甚至直接打穿本来很干净的关键位。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'No. Wider spreads simply mean the move will be even more profitable if you are right.',
                zh: '不算。点差变宽只代表如果你做对了，会赚得更快。',
              },
              feedback: {
                en: 'That ignores execution cost and distortion risk. Wider spreads are not a free bonus.',
                zh: '这忽略了执行成本和失真风险。点差变宽不是免费奖励。',
              },
            },
          ],
          chartState: createChartStateNewsRisk('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'Patience is part of risk control',
            zh: '耐心，本身就是风控的一部分',
          },
          body: {
            en: [
              'Professional behaviour is not only about finding trades. It is also about refusing conditions that make your edge hard to express.',
              'Sometimes the best use of technical analysis is to realise that the chart can wait, but the event cannot.',
            ],
            zh: [
              '更专业的行为，不只是会找交易，也包括会拒绝那些让优势难以表达出来的环境。',
              '有时候技术分析最好的用途，就是让你意识到：图可以等，但事件不会等。',
            ],
          },
          supportingCopy: {
            en: 'The exam will test whether you can separate clean structure from tradeable conditions.',
            zh: '接下来的测试，会检查你能不能把“结构好看”和“值得交易”分开来看。',
          },
          chartState: createChartStateNewsRisk('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonBreakoutFalseBreakout() {
    const questionBank = buildBreakoutFalseBreakoutQuestionBank();

    return {
      id: 'breakout-vs-false-breakout',
      stage: 'pro',
      order: 11,
      slug: 'breakout-vs-false-breakout',
      estimatedMinutes: 22,
      difficulty: 'Advanced',
      available: true,
      round: 'Round 3',
      accent: 'amber',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Acceptance focus', zh: '聚焦接受度' },
      ],
      title: {
        en: 'Breakout vs False Breakout',
        zh: '真突破 vs 假突破',
      },
      summary: {
        en: 'Differentiate expansion that can continue from expansion built only to trap late participation.',
        zh: '分辨能继续扩张的真突破，和只是用来诱多诱空的假动作。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'A break is not the same thing as acceptance',
            zh: '刺穿，不等于被接受',
          },
          body: {
            en: [
              'Advanced traders stop treating every break of highs or lows as equal. The first job is not to label the move. The first job is to ask whether the market accepted the new ground.',
              'If price breaks a level and cannot hold there, the move may be more about stop runs and trapped late entries than genuine expansion.',
            ],
            zh: [
              '更进阶的交易者，不会把每一次冲破高低点都看成同一种突破。第一步不是急着贴标签，而是先问：市场有没有接受这个新位置。',
              '如果价格冲破某个水平后根本站不稳，那更可能只是扫止损、骗晚追，而不是真正的扩张。',
            ],
          },
          supportingCopy: {
            en: 'Breakout quality is judged after the break, not only at the moment of the break.',
            zh: '突破质量要看突破之后，而不是只看突破当下那一下。',
          },
          chartState: createChartStateBreakoutFalseBreakout('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'What a true breakout usually shows',
            zh: '真突破通常会出现什么',
          },
          body: {
            en: [
              'A higher-quality breakout usually does more than print one big candle. It tends to close well, hold above the broken shelf, and keep pullbacks shallow enough that the new ground still looks accepted.',
              'The breakout does not need to be perfect. But it should make the market behave differently from the old range.',
            ],
            zh: [
              '较高质量的真突破，通常不只是拉出一根大蜡烛。它往往会有不错的收盘、能守在突破平台上方，而且后续回踩不会深到把新区域又丢回去。',
              '真突破不一定完美，但至少要让市场行为明显不同于原本的区间节奏。',
            ],
          },
          supportingCopy: {
            en: 'Strong close plus hold plus continuation matters more than the first spike alone.',
            zh: '强收盘、守得住、再延续，比第一下冲出去本身更重要。',
          },
          chartState: createChartStateBreakoutFalseBreakout('acceptance'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'What a false breakout usually reveals',
            zh: '假突破通常暴露什么',
          },
          body: {
            en: [
              'False breakout behaviour often looks exciting first and weak second. Price raids the obvious level, attracts chase entries, then fails to hold the new area and slides back into the old structure.',
              'That failure to hold is the real information. Without it, you only know that price moved fast for a moment.',
            ],
            zh: [
              '假突破常常是“先热闹、后疲软”。价格先扫过明显水平位，吸引人追进去，然后却守不住新区间，最后又滑回旧结构里。',
              '真正有信息量的是后面“守不住”这件事。没有这一步，你只知道价格短时间动得很快而已。',
            ],
          },
          supportingCopy: {
            en: 'The trap is not the wick. The trap is the failed acceptance after the wick.',
            zh: '陷阱不在那根影线本身，而在影线之后的接受度失败。',
          },
          chartState: createChartStateBreakoutFalseBreakout('false'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: breakout or trap?',
            zh: '检查点：是真突破还是陷阱？',
          },
          body: {
            en: [
              'Price pushes above a visible high, but the next two candles close back inside the old range and reclaim attempts stall immediately.',
            ],
            zh: [
              '价格冲过一个很明显的高点，但接下来两根 K 线又收回旧区间里，而且后续重回上方的尝试也马上失败。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'This is more consistent with a false breakout, because the new area was not accepted.',
                zh: '这更符合假突破，因为新区域没有被真正接受。',
              },
              feedback: {
                en: 'Correct. The failed acceptance matters more than the first pop through the level.',
                zh: '正确。真正关键的是接受失败，而不是最开始那一下冲破。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'This is still a clean breakout because price did trade above the high once.',
                zh: '这仍然算干净突破，因为价格毕竟有上去过一次。',
              },
              feedback: {
                en: 'That overweights the first touch and ignores the failed hold.',
                zh: '这种看法太重视第一下刺穿，反而忽略了后面的守不住。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'The chart gives no information yet because only volume matters in breakouts.',
                zh: '这张图还没有信息，因为突破只需要看成交量。',
              },
              feedback: {
                en: 'Volume can help, but price acceptance is already giving you important information here.',
                zh: '成交活跃度当然有帮助，但这里价格接受度本身已经提供了很重要的信息。',
              },
            },
          ],
          chartState: createChartStateBreakoutFalseBreakout('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'Read the sequence, not the excitement',
            zh: '读顺序，不是读热闹',
          },
          body: {
            en: [
              'A professional breakout read is a sequence read: break, close, hold, retest, continuation or failure. If you skip the middle steps, you will keep getting trapped by motion that looks dramatic but carries weak commitment.',
              'That is the bridge into the mastery exam: not every expansion deserves breakout logic.',
            ],
            zh: [
              '专业的突破阅读，本质上是在读一段顺序：冲破、收盘、站稳、回测、延续或失败。如果你把中间几步跳过，就会一直被那些看起来很刺激、但承接很弱的动作骗进去。',
              '这也是接下来精通测验要检查的重点：不是每一段扩张都值得套用突破逻辑。',
            ],
          },
          supportingCopy: {
            en: 'The exam will test whether you can separate expansion from acceptance.',
            zh: '接下来的测试，会检查你能不能把“扩张”与“接受度”分开来读。',
          },
          chartState: createChartStateBreakoutFalseBreakout('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonPullbackEntriesContinuation() {
    const questionBank = buildPullbackContinuationQuestionBank();

    return {
      id: 'pullback-entries-and-continuation',
      stage: 'pro',
      order: 12,
      slug: 'pullback-entries-and-continuation-structure',
      estimatedMinutes: 22,
      difficulty: 'Advanced',
      available: true,
      round: 'Round 3',
      accent: 'sky',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Continuation focus', zh: '聚焦延续结构' },
      ],
      title: {
        en: 'Pullback Entries and Continuation Structure',
        zh: '回调进场与延续结构',
      },
      summary: {
        en: 'Learn what makes a pullback healthy, dangerous, or simply too late to chase.',
        zh: '学会判断一个回调是健康、危险，还是已经太迟不该追。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'A pullback is not automatically a bargain',
            zh: '回调，不自动等于便宜货',
          },
          body: {
            en: [
              'Many traders hear “buy the dip” and stop thinking. But advanced continuation work is more precise: some pullbacks are healthy pauses, some are warning signs, and some arrive so late that the risk-reward is already damaged.',
              'The job is not to love every dip. The job is to judge what kind of dip you are looking at.',
            ],
            zh: [
              '很多人一听到“buy the dip”，脑袋就停了。但更进阶的延续阅读会更细：有些回调是健康喘息，有些是警讯，有些则已经晚到把风险回报都毁掉了。',
              '你的工作不是爱上每一次回调，而是看懂你眼前是哪一种回调。',
            ],
          },
          supportingCopy: {
            en: 'Continuation quality comes from where and how the pullback happens.',
            zh: '延续质量，取决于回调发生在哪里、又是怎么发生的。',
          },
          chartState: createChartStatePullbackContinuation('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'Healthy pullbacks leave the trend intact',
            zh: '健康回调，不会把趋势骨架拆掉',
          },
          body: {
            en: [
              'A healthy pullback usually retraces into a meaningful support area, slows down, and then gives back control to the trend side before major structure is lost.',
              'The best continuation entries are often not the deepest dips. They are the dips that look controlled and still fit the broader trend map.',
            ],
            zh: [
              '健康的回调，通常会回到有意义的支撑区，节奏开始放慢，然后在关键结构还没坏掉前，把控制权重新交回趋势方向。',
              '最好的延续进场，不一定是跌得最深的那一次；通常是那种看起来受控、而且仍然贴合大趋势地图的回调。',
            ],
          },
          supportingCopy: {
            en: 'A continuation pullback should relieve stretch, not destroy structure.',
            zh: '延续型回调应该是缓解拉伸，而不是把结构拆掉。',
          },
          chartState: createChartStatePullbackContinuation('healthy'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'Dangerous pullbacks warn before they reverse',
            zh: '危险回调，通常会先发警讯',
          },
          body: {
            en: [
              'A dangerous pullback often retraces too deeply, breaks the last meaningful support, or keeps producing weak reclaim attempts. That does not force an instant reversal, but it does reduce continuation quality sharply.',
              'Late traders often call these “better prices.” In reality, the chart may be telling you the original trend story is losing coherence.',
            ],
            zh: [
              '危险的回调，往往会回得太深、跌穿最近真正重要的支撑，或一直出现很弱的收回动作。它不一定马上反转，但会明显削弱延续质量。',
              '很多晚来的交易者会把这种情况叫做“更好的价格”。实际上，图可能已经在告诉你：原本的趋势故事开始变得不连贯了。',
            ],
          },
          supportingCopy: {
            en: 'Do not confuse cheaper price with safer continuation.',
            zh: '不要把“价格更便宜”误会成“延续更安全”。',
          },
          chartState: createChartStatePullbackContinuation('danger'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: healthy dip or damaged trend?',
            zh: '检查点：健康回调还是受损趋势？',
          },
          body: {
            en: [
              'Price rallies cleanly, then the pullback cuts through the last support shelf, loses the previous higher low, and each reclaim closes weak.',
            ],
            zh: [
              '价格原本涨得很干净，但接下来的回调跌穿最近支撑平台、破坏前一个更高低点，而且每次想收回都收得很弱。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'This pullback is damaging the continuation story, not simply refreshing it.',
                zh: '这个回调正在破坏延续逻辑，而不只是帮趋势降温。',
              },
              feedback: {
                en: 'Correct. A continuation dip should not casually erase the structure it depends on.',
                zh: '正确。延续型回调，不应该轻易把它赖以成立的结构抹掉。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'This is automatically a stronger buy because the market is now cheaper.',
                zh: '这一定是更强的买点，因为价格现在更便宜了。',
              },
              feedback: {
                en: 'Cheaper is not automatically better if the continuation framework is breaking down.',
                zh: '如果延续框架本身在坏掉，“更便宜”并不会自动变成“更好”。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'Pullback depth never matters as long as the original bias was bullish.',
                zh: '只要原本偏多，回调深度永远都不重要。',
              },
              feedback: {
                en: 'Pullback depth matters a lot, because depth changes continuation efficiency and sometimes the whole idea.',
                zh: '回调深度非常重要，因为它会改变延续效率，有时甚至直接改变整个想法。',
              },
            },
          ],
          chartState: createChartStatePullbackContinuation('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'The best continuation entries feel patient, not desperate',
            zh: '最好的延续进场，通常看起来更有耐心，而不是更着急',
          },
          body: {
            en: [
              'Advanced continuation work is not about proving courage by buying every retrace. It is about waiting for pullbacks that preserve the structure, respect the map, and still leave efficient risk-to-reward.',
              'That is what the exam will measure: can you tell a constructive reset from a damaged move or a late chase?',
            ],
            zh: [
              '更进阶的延续交易，不是靠“每次回调都敢接”来证明勇气，而是等那些既保留结构、又尊重地图、同时还留有高效风险回报的回调。',
              '这也是接下来考试会检查的重点：你能不能把建设性的重置，和已经受损的走势、或太晚的追价分开？',
            ],
          },
          supportingCopy: {
            en: 'The exam will test whether your continuation logic survives under pressure.',
            zh: '接下来的测试，会检查你的延续逻辑在压力下是否还能站得住。',
          },
          chartState: createChartStatePullbackContinuation('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonSessionBehaviourTimeOfDay() {
    const questionBank = buildSessionBehaviourQuestionBank();

    return {
      id: 'session-behaviour-and-time-of-day-edge',
      stage: 'pro',
      order: 13,
      slug: 'session-behaviour-and-time-of-day-edge',
      estimatedMinutes: 21,
      difficulty: 'Advanced',
      available: true,
      round: 'Round 3',
      accent: 'violet',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Timing focus', zh: '聚焦时段 timing' },
      ],
      title: {
        en: 'Session Behaviour and Time-of-Day Edge',
        zh: '交易时段行为与时间优势',
      },
      summary: {
        en: 'Understand why London, New York, and overlap periods do not produce the same behaviour on gold.',
        zh: '理解伦敦盘、纽约盘和重叠时段，为什么不会给黄金相同的行为模式。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'Time changes behaviour, not just speed',
            zh: '时间改变的，不只是快慢',
          },
          body: {
            en: [
              'Many traders only think of sessions as “more volatility” or “less volatility.” That is too shallow. Different times of day often change what kind of movement is common: balance, expansion, sweep, reclaim, or trend continuation.',
              'On gold, time-of-day edge often comes from knowing when participation is real and when price is only drifting on thin conditions.',
            ],
            zh: [
              '很多人一讲时段，只会想到“波动大一点”或“波动小一点”。这太浅了。不同时间段，常常会改变常见的价格行为类型：是平衡、扩张、扫流动性、收回，还是趋势延续。',
              '对黄金来说，时间优势很多时候来自你能不能分辨：现在的参与是真实的，还是价格只是在薄流动性里慢慢漂。',
            ],
          },
          supportingCopy: {
            en: 'Session reading is about behaviour quality, not only clock time.',
            zh: '读时段，读的是行为质量，不只是时钟数字。',
          },
          chartState: createChartStateSessionBehaviour('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'London and New York do not move gold the same way',
            zh: '伦敦盘和纽约盘，不会用同样方式推动黄金',
          },
          body: {
            en: [
              'London often delivers cleaner directional expansion when Europe and macro participation arrive. New York can extend that move, reverse it, or inject event-driven volatility depending on data and US flows.',
              'That means the same chart pattern can have very different quality depending on which session is producing it.',
            ],
            zh: [
              '伦敦盘常常在欧洲资金和宏观参与进场后，带来更干净的方向扩张。纽约盘则可能延续、反转，或者因为美国数据和资金流带来事件型波动。',
              '所以同样的图形，放在不同 session 里，质量可能完全不一样。',
            ],
          },
          supportingCopy: {
            en: 'A pattern should be judged together with the session that produced it.',
            zh: '一个形态，要连同“是谁在那个时段把它做出来”一起判断。',
          },
          chartState: createChartStateSessionBehaviour('london-ny'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'Overlap hours can create edge or confusion',
            zh: '重叠时段，既可能给优势，也可能给混乱',
          },
          body: {
            en: [
              'The London-New York overlap can produce some of the cleanest continuation if the earlier structure is aligned. It can also produce violent reversals if fresh US information hits the tape.',
              'That is why advanced session reading does not stop at “this is active time.” It asks what kind of order flow is likely to dominate this active time.',
            ],
            zh: [
              '伦敦和纽约重叠时段，如果前面结构本来就顺，常常会给出很漂亮的延续；但如果新的美国信息突然进场，它也能瞬间变成剧烈反转。',
              '所以更进阶的 session 阅读，不会停在“这个时间很活跃”。它会继续问：在这个活跃时间里，最可能主导的订单流是什么？',
            ],
          },
          supportingCopy: {
            en: 'Active hours increase opportunity, but they also increase the cost of reading the tape wrongly.',
            zh: '活跃时间会增加机会，但也会放大读错盘面的代价。',
          },
          chartState: createChartStateSessionBehaviour('overlap'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: trustworthy move or thin-market illusion?',
            zh: '检查点：是真实推动，还是薄市场幻觉？',
          },
          body: {
            en: [
              'Price drifts higher slowly through a sleepy period, then the first active session opens and the whole move is immediately sold back into the prior range.',
            ],
            zh: [
              '价格在很安静的时段里慢慢往上漂，结果一到第一个真正活跃的 session，整段上涨立刻被卖回原本区间里。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'The earlier drift had weak session quality, so the active-session rejection deserves more weight.',
                zh: '前面的慢漂时段质量偏弱，所以活跃时段的拒绝更值得重视。',
              },
              feedback: {
                en: 'Correct. Thin-session drift often deserves less trust than active-session response.',
                zh: '正确。薄时段的慢漂，通常不如活跃时段的反应更值得信任。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'The earlier move is automatically stronger because it started first.',
                zh: '前面的走势一定更强，因为它先开始。',
              },
              feedback: {
                en: 'Starting first does not guarantee stronger participation or better quality.',
                zh: '先开始，并不代表参与更强、质量更高。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'Sessions do not matter if the candles look directional enough.',
                zh: '只要 K 线看起来够有方向，时段就不重要。',
              },
              feedback: {
                en: 'Session context often decides whether directional candles deserve trust.',
                zh: '时段背景常常决定这些有方向感的 K 线值不值得信任。',
              },
            },
          ],
          chartState: createChartStateSessionBehaviour('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'Edge comes from matching idea to clock',
            zh: '真正的优势，来自让想法和时间对上',
          },
          body: {
            en: [
              'Advanced time-of-day reading is not superstition about hours. It is matching your setup logic to the kind of participation the clock is likely to bring.',
              'The exam will test whether you can stop treating all volatility as equal and start treating session quality as part of the setup.',
            ],
            zh: [
              '更进阶的时间优势，不是迷信某个小时，而是把你的 setup 逻辑，和时钟可能带来的参与质量配对起来。',
              '接下来的测试，会检查你能不能不再把所有波动都看成一样，而是把 session 质量真正纳入 setup 本身的一部分。',
            ],
          },
          supportingCopy: {
            en: 'You are not trading the chart alone. You are trading chart plus timing.',
            zh: '你交易的不是图表本身，而是图表加 timing 的组合。',
          },
          chartState: createChartStateSessionBehaviour('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonVolatilityRegimesAtr() {
    const questionBank = buildVolatilityRegimeQuestionBank();

    return {
      id: 'volatility-regimes-and-atr-adaptation',
      stage: 'pro',
      order: 14,
      slug: 'volatility-regimes-atr-and-position-adaptation',
      estimatedMinutes: 21,
      difficulty: 'Advanced',
      available: true,
      round: 'Round 3',
      accent: 'orange',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'ATR adaptation', zh: 'ATR 适配' },
      ],
      title: { en: 'Volatility Regimes, ATR, and Position Adaptation', zh: '波动状态、ATR 与仓位适配' },
      summary: {
        en: 'Adapt stops, expectations, and sizing to the market you actually have, not the one you wish for.',
        zh: '让止损、预期和仓位适配你当前真正面对的市场，而不是适配你想象中的市场。',
      },
      steps: [
        {
          type: 'intro',
          title: { en: 'Same setup, different volatility, different trade', zh: '同样的 setup，波动不同，交易也不同' },
          body: {
            en: [
              'A setup that works with a 6-dollar daily rhythm does not behave the same way in a 20-dollar expansion day.',
              'Advanced traders adjust stop width, target expectation, and size when volatility regime changes.',
            ],
            zh: [
              '一套在日内 6 美元节奏里好用的 setup，放到 20 美元扩张日里，行为不会一样。',
              '更进阶的交易者，会在波动状态变化时同步调整止损宽度、目标预期和仓位。',
            ],
          },
          supportingCopy: { en: 'Volatility regime changes the operating conditions of the exact same chart idea.', zh: '波动状态会改变同一套图表想法的执行条件。' },
          chartState: createChartStateVolatilityRegime('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: { en: 'What ATR is helping you notice', zh: 'ATR 真正在帮你注意什么' },
          body: {
            en: [
              'ATR is not there to replace chart reading. It helps you measure whether the environment is quiet, normal, or unusually explosive.',
              'That matters because normal-day stop and target assumptions often break when ATR expands sharply.',
            ],
            zh: [
              'ATR 不是拿来取代读图的。它是在帮你衡量：当前环境是安静、正常，还是异常爆炸。',
              '这很重要，因为当 ATR 明显放大时，平常日子的止损和目标假设往往会失效。',
            ],
          },
          supportingCopy: { en: 'ATR is an adaptation tool, not a magic entry signal.', zh: 'ATR 是适配工具，不是魔法进场信号。' },
          chartState: createChartStateVolatilityRegime('atr'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: { en: 'When volatility rises, tight habits become expensive', zh: '波动一放大，太紧的习惯就会变贵' },
          body: {
            en: [
              'A stop that was perfectly reasonable yesterday can become noise-level today if candles are suddenly twice as large.',
              'Sometimes the right adaptation is wider stop with smaller size. Sometimes it is simply no trade.',
            ],
            zh: [
              '昨天还很合理的止损，今天如果蜡烛突然变成两倍大，就可能只剩“噪音级别”。',
              '有时正确适配是更宽止损配更小仓位；有时甚至就是不交易。',
            ],
          },
          supportingCopy: { en: 'Better adaptation often looks less exciting but keeps the trade logic honest.', zh: '更好的适配通常没那么刺激，但会让交易逻辑更诚实。' },
          chartState: createChartStateVolatilityRegime('example'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: { en: 'Checkpoint: adapt or force?', zh: '检查点：是适配，还是硬做？' },
          body: {
            en: ['ATR has doubled, your normal stop would sit inside ordinary noise, and the target room has not increased much.'],
            zh: ['ATR 已经翻倍，你平常的止损会落在普通噪音里面，但目标空间却没有同步扩大。'],
          },
          options: [
            { key: 'a', correct: true, text: { en: 'Adapt size and expectations, or pass if asymmetry is poor.', zh: '调整仓位和预期；如果不对称性太差，就放弃。' }, feedback: { en: 'Correct. Volatility adaptation is about changing conditions, not stubborn consistency.', zh: '正确。波动适配的重点，是承认条件变了，而不是死守旧习惯。' } },
            { key: 'b', correct: false, text: { en: 'Keep the same stop and size because discipline means never changing.', zh: '继续用同样止损和仓位，因为纪律就是永远不改。' }, feedback: { en: 'That is rigidity, not discipline. Discipline includes adapting to new conditions.', zh: '那不叫纪律，那叫僵硬。真正的纪律也包括适应新环境。' } },
            { key: 'c', correct: false, text: { en: 'Increase size so the bigger movement can pay you faster.', zh: '反而加大仓位，因为波动更大可以赚更快。' }, feedback: { en: 'That confuses opportunity with controllable risk.', zh: '这把“机会变大”和“风险仍可控”混为一谈。' } },
          ],
          chartState: createChartStateVolatilityRegime('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: { en: 'Professional sizing follows environment', zh: '专业仓位，会跟着环境走' },
          body: {
            en: [
              'Advanced traders do not try to prove bravery by holding the same size through every regime.',
              'The exam will test whether you can connect volatility, ATR, stop logic, and position adaptation into one coherent decision.',
            ],
            zh: [
              '更进阶的交易者，不会靠“任何状态都维持同样仓位”来证明自己勇敢。',
              '接下来的测试，会检查你能不能把波动、ATR、止损逻辑和仓位适配，连成一个完整决策。',
            ],
          },
          supportingCopy: { en: 'Good adaptation keeps your process stable even when price behaviour is not.', zh: '好的适配，会在价格行为不稳定时，仍让你的流程保持稳定。' },
          chartState: createChartStateVolatilityRegime('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonSupplyDemandOrderBlocks() {
    const questionBank = buildSupplyDemandQuestionBank();

    return {
      id: 'supply-demand-order-blocks',
      stage: 'pro',
      order: 15,
      slug: 'supply-demand-order-blocks-and-reaction-quality',
      estimatedMinutes: 24,
      difficulty: 'Advanced',
      available: true,
      round: 'Round 3',
      accent: 'emerald',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Reaction quality', zh: '反应质量' },
      ],
      title: { en: 'Supply/Demand, Order Blocks, and Reaction Quality', zh: '供需区、订单块与反应质量' },
      summary: {
        en: 'Judge whether a reaction zone is strong, weak, or already consumed.',
        zh: '判断一个反应区是强、弱，还是已经被消耗。',
      },
      steps: [
        {
          type: 'intro',
          title: { en: 'A zone is not strong just because you named it', zh: '一个区域，不会因为你给它取了名字就自动变强' },
          body: {
            en: [
              'Supply, demand, and order block language can be useful, but only if the market actually reacts with quality there.',
              'A labelled box is not the same thing as a defended zone.',
            ],
            zh: [
              '供需区、订单块这些词可以有用，但前提是市场真的在那边给出有质量的反应。',
              '画出一个盒子，不等于这个区域真的被防守。',
            ],
          },
          supportingCopy: { en: 'Reaction quality matters more than vocabulary quality.', zh: '反应质量，比名词包装更重要。' },
          chartState: createChartStateSupplyDemand('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: { en: 'Strong zones react with intent', zh: '强区域，会用“有意图”的方式反应' },
          body: {
            en: [
              'A strong reaction zone usually shows fast response, clean displacement, or repeated evidence that the market still cares there.',
              'Weak zones look soft, slow, or inconsistent. Consumed zones may still be drawn on the chart, but they no longer command the same respect.',
            ],
            zh: [
              '一个强反应区，通常会表现出快速反应、干净位移，或反复证明市场仍然在意它。',
              '弱区域则会显得拖、软、犹豫。被消耗的区域也许还画在图上，但已经不再值得同样尊重。',
            ],
          },
          supportingCopy: { en: 'The market tells you zone quality through behaviour, not through your template.', zh: '区域质量，是市场用行为告诉你的，不是模板替你决定的。' },
          chartState: createChartStateSupplyDemand('quality'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: { en: 'Consumed zones still look pretty on old charts', zh: '被消耗的区域，在旧图上看起来仍然很漂亮' },
          body: {
            en: [
              'A level that worked once or twice can become much less useful after repeated testing, shallow bounces, and declining reaction quality.',
              'This is where advanced reading matters: not asking “Did this zone ever work?” but “Does this zone still deserve weight now?”',
            ],
            zh: [
              '一个曾经有效过一两次的区域，在被反复测试、反弹越来越浅、反应质量下降后，价值会明显衰减。',
              '这也是更进阶阅读的重点：不是问“这个区曾经有没有用过？”，而是问“它现在还配得上多少权重？”',
            ],
          },
          supportingCopy: { en: 'Freshness and reaction quality both matter.', zh: '新鲜度和反应质量，都很重要。' },
          chartState: createChartStateSupplyDemand('example'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: { en: 'Checkpoint: strong, weak, or consumed?', zh: '检查点：强、弱，还是被消耗？' },
          body: {
            en: ['A demand zone has been hit four times, each bounce is smaller, and the most recent touch barely reacts before breaking.'],
            zh: ['一个需求区已经被打了四次，每次反弹都更小，最近一次几乎没反应就破掉了。'],
          },
          options: [
            { key: 'a', correct: true, text: { en: 'This zone looks consumed and deserves much less trust now.', zh: '这个区域看起来已经被消耗，不该再像以前那样信任。' }, feedback: { en: 'Correct. Repeated testing plus weaker bounces usually means edge is decaying.', zh: '正确。反复测试加上反弹越来越弱，通常代表优势在衰减。' } },
            { key: 'b', correct: false, text: { en: 'This zone is stronger now because price proved it many times.', zh: '这个区域现在更强，因为价格证明过很多次。' }, feedback: { en: 'Repeated proof can become repeated consumption if reaction quality deteriorates.', zh: '反复证明，也可能变成反复消耗，尤其当反应质量越来越差时。' } },
            { key: 'c', correct: false, text: { en: 'Zone quality never changes unless the box is redrawn.', zh: '除非重新画盒子，否则区域质量不会改变。' }, feedback: { en: 'Zone quality changes through live interaction, not through redrawing alone.', zh: '区域质量会随着实时互动改变，不是靠重画盒子才改变。' } },
          ],
          chartState: createChartStateSupplyDemand('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: { en: 'Respect reaction quality more than labels', zh: '先尊重反应质量，再尊重标签' },
          body: {
            en: [
              'Advanced zone reading is less about arguing whether something is “really an order block” and more about asking whether the market is still defending or rejecting there with meaningful force.',
              'The exam will test whether you can judge quality, freshness, and consumption without hiding behind vocabulary.',
            ],
            zh: [
              '更进阶的区域阅读，重点不在争论“这到底算不算订单块”，而在于看市场是否仍在那边用有分量的方式防守或拒绝。',
              '接下来的测试，会检查你能不能不躲在名词背后，直接判断质量、新鲜度和消耗程度。',
            ],
          },
          supportingCopy: { en: 'Good zone reading is behaviour-first, label-second.', zh: '好的区域阅读，是行为优先、标签其次。' },
          chartState: createChartStateSupplyDemand('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonConfluenceWithoutOverfitting() {
    const questionBank = buildConfluenceQuestionBank();

    return {
      id: 'confluence-without-overfitting',
      stage: 'pro',
      order: 16,
      slug: 'confluence-building-without-overfitting',
      estimatedMinutes: 22,
      difficulty: 'Advanced',
      available: true,
      round: 'Round 3',
      accent: 'cyan',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Confluence design', zh: '共振设计' },
      ],
      title: { en: 'Confluence Building Without Overfitting', zh: '建立共振，但不要过度拟合' },
      summary: {
        en: 'Use multiple aligned signals without building a fragile checklist that only looks smart in hindsight.',
        zh: '学会用多重共振，但别堆成一个只会事后看起来很聪明的脆弱清单。',
      },
      steps: [
        {
          type: 'intro',
          title: { en: 'Confluence should simplify, not suffocate', zh: '共振应该让判断更简单，不是更窒息' },
          body: {
            en: [
              'Confluence is powerful when a few independent factors point to the same trade logic.',
              'It becomes dangerous when traders keep adding conditions until only hindsight-perfect setups are allowed.',
            ],
            zh: [
              '共振最有力的时候，是少数几个彼此独立的因素都指向同一套交易逻辑。',
              '但当交易者不断往上堆条件，直到只剩事后才完美的 setup 才能过关时，共振就开始变危险。',
            ],
          },
          supportingCopy: { en: 'Good confluence increases clarity; bad confluence manufactures excuses.', zh: '好的共振会增加清晰度；坏的共振只会制造借口。' },
          chartState: createChartStateConfluence('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: { en: 'Independent signals matter more than duplicated signals', zh: '彼此独立的信号，比重复同类信号更有价值' },
          body: {
            en: [
              'A support shelf, higher-timeframe bias, and session timing can form useful confluence because they answer different questions.',
              'Three momentum indicators saying similar things often do not create three times the edge.',
            ],
            zh: [
              '支撑平台、更高周期偏向、时段 timing 之所以能形成有价值的共振，是因为它们在回答不同问题。',
              '但三种动能指标都在说差不多的话，通常不会让优势变成三倍。',
            ],
          },
          supportingCopy: { en: 'Confluence is strongest when each layer adds different information.', zh: '当每一层都在补充不同信息时，共振才最强。' },
          chartState: createChartStateConfluence('quality'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: { en: 'Overfitting usually sounds clever before it loses money', zh: '过度拟合，在亏钱前通常都听起来很聪明' },
          body: {
            en: [
              'If you need ten conditions to justify one trade, you may not be refining the setup. You may be protecting yourself from uncertainty by building a fragile checklist.',
              'Real markets stay messy. Your framework should survive that mess instead of needing perfect alignment every time.',
            ],
            zh: [
              '如果你需要十个条件才能说服自己做一笔单，很多时候你不是在优化 setup，而是在用脆弱清单对抗不确定性。',
              '真实市场就是会乱。你的框架应该能在这种乱里活下来，而不是每次都要求完美对齐。',
            ],
          },
          supportingCopy: { en: 'The goal is robust alignment, not endless filtering.', zh: '目标是稳健对齐，不是无止境过滤。' },
          chartState: createChartStateConfluence('example'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: { en: 'Checkpoint: real confluence or checklist addiction?', zh: '检查点：是真共振，还是清单成瘾？' },
          body: {
            en: ['The setup already has trend bias, support location, and active-session timing aligned, but the trader still refuses it because two extra oscillators are not perfect.'],
            zh: ['这笔 setup 已经有趋势偏向、支撑位置、活跃时段 timing 对齐，但交易者仍拒绝，因为另外两个震荡指标不够完美。'],
          },
          options: [
            { key: 'a', correct: true, text: { en: 'This looks more like overfitting than useful confluence building.', zh: '这更像过度拟合，而不是有用的共振构建。' }, feedback: { en: 'Correct. Once key independent factors align, endless extra filtering can do more harm than good.', zh: '正确。当关键的独立因素已经对齐后，无止境加过滤常常弊大于利。' } },
            { key: 'b', correct: false, text: { en: 'This is always better because more filters always mean better precision.', zh: '这样永远更好，因为过滤越多就一定越精准。' }, feedback: { en: 'More filters can also mean later entries, fewer trades, and more hindsight bias.', zh: '过滤更多，也可能意味着更晚进场、更少机会，以及更强的事后偏见。' } },
            { key: 'c', correct: false, text: { en: 'Confluence only counts if every indicator and every timeframe agrees perfectly.', zh: '只有所有指标和所有周期都完美同意，才算共振。' }, feedback: { en: 'That standard is often unrealistic and encourages fragile decision-making.', zh: '这个标准通常不现实，也会让决策变得很脆弱。' } },
          ],
          chartState: createChartStateConfluence('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: { en: 'Build a framework that survives imperfect markets', zh: '建立一套能活在“不完美市场”里的框架' },
          body: {
            en: [
              'Advanced confluence work is about using a small number of meaningful layers to increase confidence without becoming dependent on perfect alignment.',
              'The exam will test whether you can distinguish robust alignment from smart-sounding overfitting.',
            ],
            zh: [
              '更进阶的共振工作，是用少量但有意义的层次提升信心，而不是依赖“全部完美对齐”才敢行动。',
              '接下来的测试，会检查你能不能把稳健对齐，和“听起来很聪明”的过度拟合分开。',
            ],
          },
          supportingCopy: { en: 'Good confluence makes you more decisive, not more paralysed.', zh: '好的共振会让你更果断，而不是更瘫痪。' },
          chartState: createChartStateConfluence('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonTradeManagementReview() {
    const questionBank = buildTradeManagementQuestionBank();

    return {
      id: 'trade-management-review-process',
      stage: 'pro',
      order: 17,
      slug: 'trade-management-review-and-process-improvement',
      estimatedMinutes: 24,
      difficulty: 'Advanced',
      available: true,
      round: 'Round 3',
      accent: 'slate',
      stats: [
        { en: '5 lesson pages', zh: '5 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Review focus', zh: '聚焦复盘' },
      ],
      title: { en: 'Trade Management, Review, and Process Improvement', zh: '持仓管理、复盘与流程优化' },
      summary: {
        en: 'Protect gains, review mistakes, and build a process that compounds instead of just chasing entries.',
        zh: '保护利润、复盘错误，建立会长期复利的流程，而不只是追逐进场点。',
      },
      steps: [
        {
          type: 'intro',
          title: { en: 'Good entries still need good management', zh: '再好的进场，也还要配更好的管理' },
          body: {
            en: [
              'Many developing traders obsess over entry quality and neglect what happens after the position is open.',
              'But advanced performance often comes more from management consistency and review quality than from slightly better entries.',
            ],
            zh: [
              '很多还在成长中的交易者，只会执着于进场好不好，却忽略开仓之后发生什么。',
              '但更进阶的表现，很多时候来自更稳定的管理和更好的复盘，而不是多精细那一点进场。',
            ],
          },
          supportingCopy: { en: 'Entry starts the trade. Management and review shape the career.', zh: '进场只是开始；管理和复盘才会塑造整个交易生涯。' },
          chartState: createChartStateTradeManagement('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: { en: 'Management should follow structure, not emotion', zh: '管理要跟着结构走，不是跟着情绪走' },
          body: {
            en: [
              'Moving stops, scaling, or holding runners can all be reasonable, but only if they are tied to clear market logic.',
              'Emotional management usually sounds like this: “It looked scary so I cut,” or “I felt hopeful so I held.”',
            ],
            zh: [
              '移动止损、分批止盈、或保留 runner 都可以合理，但前提是它们必须绑在清楚的市场逻辑上。',
              '情绪化管理通常听起来像这样：“看起来有点可怕我就砍了”，或“我感觉还有希望所以继续拿着”。',
            ],
          },
          supportingCopy: { en: 'Management quality comes from predefined logic under pressure.', zh: '管理质量，来自你在压力下还能执行预先写好的逻辑。' },
          chartState: createChartStateTradeManagement('management'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: { en: 'Review should improve the process, not feed the ego', zh: '复盘要改进流程，不是喂养 ego' },
          body: {
            en: [
              'A good review asks: Was my read sound? Was my risk placement coherent? Did I follow the plan? Was the no-trade option ignored? What repeated mistake is actually costing me money?',
              'A bad review only asks whether the trade won or lost.',
            ],
            zh: [
              '好的复盘会问：我的读法对不对？风险摆放是否连贯？我有没有照计划执行？有没有忽略“不做”这个选项？什么重复错误才是真正在持续花我的钱？',
              '坏的复盘，只会问这笔单是赢还是亏。',
            ],
          },
          supportingCopy: { en: 'The goal of review is process improvement, not emotional storytelling.', zh: '复盘的目标是优化流程，不是做情绪叙事。' },
          chartState: createChartStateTradeManagement('review'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: { en: 'Checkpoint: process error or market error?', zh: '检查点：是流程错，还是市场错？' },
          body: {
            en: ['The idea was solid, but the trader ignored planned stop placement, widened risk, and held through news without adjustment.'],
            zh: ['原本的想法其实不差，但交易者无视预设止损、擅自放大风险，而且还没调整就硬带仓穿消息。'],
          },
          options: [
            { key: 'a', correct: true, text: { en: 'This is mainly a process error, not just bad market luck.', zh: '这主要是流程错误，不只是市场运气差。' }, feedback: { en: 'Correct. A decent idea can still lose badly if process discipline collapses.', zh: '正确。就算想法不差，只要流程纪律崩掉，也一样会亏得很难看。' } },
            { key: 'b', correct: false, text: { en: 'This is purely a market problem because volatility was unavoidable.', zh: '这纯粹是市场问题，因为波动无法避免。' }, feedback: { en: 'Volatility exists, but several avoidable process mistakes made the outcome worse.', zh: '波动当然存在，但这里有好几个本来可以避免的流程错误，让结果更糟。' } },
            { key: 'c', correct: false, text: { en: 'Review is unnecessary because the trade thesis was originally good.', zh: '既然原始观点不错，就没必要复盘。' }, feedback: { en: 'A good thesis does not excuse poor execution or management.', zh: '观点不错，并不能替糟糕执行或管理开脱。' } },
          ],
          chartState: createChartStateTradeManagement('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: { en: 'Your edge compounds through process quality', zh: '你的优势，会通过流程质量来复利' },
          body: {
            en: [
              'Advanced trading is not just about finding better charts. It is about protecting gains, cutting mistakes faster, and reviewing honestly enough to keep improving.',
              'The exam will test whether you can think beyond entry and see the full lifecycle of a trade.',
            ],
            zh: [
              '更进阶的交易，不只是找更漂亮的图，而是学会保护利润、更快砍掉错误，并且诚实复盘到能持续进步。',
              '接下来的测试，会检查你能不能不只盯着进场，而是看到一笔交易的完整生命周期。',
            ],
          },
          supportingCopy: { en: 'A strong process makes your best days repeatable and your worst days survivable.', zh: '强流程会让你的好日子更可复制，也会让最差日子更可存活。' },
          chartState: createChartStateTradeManagement('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonTrendRange() {
    const questionBank = buildTrendRangeQuestionBank();

    return {
      id: 'trend-vs-range-decision-making',
      stage: 'foundation',
      order: 5,
      slug: 'trend-vs-range-decision-making',
      estimatedMinutes: 19,
      difficulty: 'Bridge',
      available: true,
      unlockAfter: 'xauusd-actually-moves',
      round: 'Round 1',
      accent: 'teal',
      stats: [
        { en: '6 lesson pages', zh: '6 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'No auto-complete', zh: '不允许自动完成' },
      ],
      title: {
        en: 'Trend vs Range Decision-Making',
        zh: '趋势 vs 震荡的决策逻辑',
      },
      summary: {
        en: 'Learn to classify the market correctly before choosing trend logic, range logic, or the discipline to wait.',
        zh: '先把市场分对类，再决定该用趋势逻辑、震荡逻辑，还是干脆先等。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'Most beginner losses are classification errors',
            zh: '很多新手亏损，其实是分类错误',
          },
          body: {
            en: [
              'A strong candle inside a range is not the same thing as trend continuation. A sharp rejection inside a trend is not automatically a reversal.',
              'Before entry logic, you need market-condition logic. Is price expanding directionally, rotating between boundaries, or too unclear to justify risk?',
            ],
            zh: [
              '区间里的强K线，不等于趋势延续。趋势里的急跌急涨，也不自动等于反转。',
              '在谈进场逻辑前，你先要有市场状态逻辑。现在价格是在单边扩张、在边界间来回轮动，还是根本还不够清楚？',
            ],
          },
          supportingCopy: {
            en: 'A wrong market label usually ruins the rest of the trade plan.',
            zh: '市场状态贴错标签，后面的交易计划通常也会一起歪掉。',
          },
          chartState: createChartStateTrendRange('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'What a trend really looks like',
            zh: '真正的趋势长什么样',
          },
          body: {
            en: [
              'A trend keeps producing structured continuation: higher highs and higher lows for a bullish trend, or the opposite for a bearish one.',
              'The key is not just direction. It is whether pullbacks are getting absorbed and whether reclaim attempts keep succeeding.',
            ],
            zh: [
              '趋势会持续产出有结构的延续：多头趋势是一连串更高高点与更高低点，空头则相反。',
              '重点不只是方向，而是回踩有没有被吸收，以及价格的收复动作是不是一再成功。',
            ],
          },
          supportingCopy: {
            en: 'Trend logic wants continuation after controlled pullback, not blind chasing.',
            zh: '趋势逻辑想要的是受控回踩后的延续，不是闭眼追价。',
          },
          chartState: createChartStateTrendRange('trend'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'concept',
          title: {
            en: 'What a range really looks like',
            zh: '真正的震荡长什么样',
          },
          body: {
            en: [
              'A range keeps returning price toward the same middle ground. Pushes into the edges often fail unless real expansion enters the tape.',
              'Range logic is more about rejection quality, rotation, and not getting trapped into late breakout attempts.',
            ],
            zh: [
              '震荡会不断把价格拉回同一片中间区域。除非真的有新扩张进场，否则边缘位置的推进通常很容易失败。',
              '震荡逻辑更重视拒绝质量、来回轮动，以及不要被晚来的假突破带进去。',
            ],
          },
          supportingCopy: {
            en: 'If price keeps revisiting the same zone, ask whether you are trading a boundary or chasing noise.',
            zh: '如果价格一直回到同一区域，就要问自己：你是在交易边界，还是在追噪音？',
          },
          chartState: createChartStateTrendRange('range'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: choose the correct market condition',
            zh: '检查点：选出正确的市场状态',
          },
          body: {
            en: [
              'Price has rejected the same upper band three times, held the same lower band twice, and keeps snapping back to the middle after each move.',
            ],
            zh: [
              '价格已经三次在同一上方区域被压回，也两次在同一下方区域撑住，而且每次走出去后都会很快回到中间。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: false,
              text: {
                en: 'Clean bullish trend. Keep buying every breakout.',
                zh: '标准多头趋势，继续买所有突破。',
              },
              feedback: {
                en: 'No. Repeated mean reversion back into the middle is range behaviour, not clean trend continuation.',
                zh: '不对。价格不断回到中间，比较像震荡，不是干净趋势延续。',
              },
            },
            {
              key: 'b',
              correct: true,
              text: {
                en: 'Range behaviour. Respect the edges and be careful with late breakout attempts.',
                zh: '这是震荡行为。要尊重边界，并小心晚来的突破追单。',
              },
              feedback: {
                en: 'Correct. Repeated edge rejection plus rotation back to the middle is classic range behaviour.',
                zh: '正确。边界反复拒绝、价格回到中间，是典型的震荡特征。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'Impossible to classify, so any entry logic is equally valid.',
                zh: '根本无法分类，所以任何进场逻辑都一样。',
              },
              feedback: {
                en: 'There is enough information here to classify it as a range. Precision is not the same as confusion.',
                zh: '这里其实已经有足够信息把它归类成震荡。不是不完美，就等于看不懂。',
              },
            },
          ],
          chartState: createChartStateTrendRange('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'The real edge is choosing the right playbook',
            zh: '真正的优势，是用对剧本',
          },
          body: {
            en: [
              'A trend and a range demand different expectations, stop placement, and patience profile.',
              'If you are not sure yet, that is still useful information. A delayed entry is usually cheaper than a forced wrong read.',
            ],
            zh: [
              '趋势和震荡，要求的是不同的预期、止损逻辑和耐心节奏。',
              '如果你还不确定，那本身就是有价值的信息。晚一点进场，通常都比看错后硬做来得便宜。',
            ],
          },
          supportingCopy: {
            en: 'Next comes the mastery exam: 20 random questions pulled from a 100-question bank.',
            zh: '接下来是精通测试：会从 100 题题库里随机抽 20 题。',
          },
          chartState: createChartStateTrendRange('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createLessonLiquiditySweeps() {
    const questionBank = buildLiquidityQuestionBank();

    return {
      id: 'liquidity-sweeps-stop-hunts',
      stage: 'pro',
      order: 10,
      slug: 'liquidity-sweeps-stop-hunts',
      estimatedMinutes: 22,
      difficulty: 'Advanced',
      available: true,
      unlockAfter: 'trend-vs-range-decision-making',
      round: 'Round 1',
      accent: 'violet',
      stats: [
        { en: '6 lesson pages', zh: '6 个课程页面' },
        { en: '100-question bank', zh: '100 题题库' },
        { en: 'Advanced lesson', zh: '进阶课程' },
      ],
      title: {
        en: 'Liquidity, Sweeps, and Stop Hunts',
        zh: '流动性、扫损与诱导',
      },
      summary: {
        en: 'Study how price raids obvious pools of liquidity, then judge whether the move is true continuation or a trap reversal.',
        zh: '学习价格如何去扫明显的流动性池，再判断那一下是真延续还是诱导反转。',
      },
      steps: [
        {
          type: 'intro',
          title: {
            en: 'Why obvious highs and lows attract price',
            zh: '为什么明显高低点会吸引价格',
          },
          body: {
            en: [
              'Equal highs, equal lows, prior day extremes, and clean breakout levels often attract stops, breakout orders, and delayed participation.',
              'That cluster of orders matters because once price touches it, the tape can either continue aggressively or snap back when the move was only built to harvest liquidity.',
            ],
            zh: [
              '等高、等低、前一天高低点，以及很干净的突破位，通常都会聚集止损、突破单和迟到的跟单资金。',
              '这些挂单之所以重要，是因为价格一碰到那里，可能会继续强势扩张，也可能在只是为了拿流动性的情况下迅速反抽。',
            ],
          },
          supportingCopy: {
            en: 'A sweep is not automatically a reversal. The reaction quality matters.',
            zh: '扫流动性不自动等于反转，重点是后续反应质量。',
          },
          chartState: createChartStateLiquidity('intro'),
          animationPreset: 'rise',
          sfxCue: 'lesson-open',
        },
        {
          type: 'concept',
          title: {
            en: 'What makes a sweep meaningful',
            zh: '什么样的 sweep 才有意义',
          },
          body: {
            en: [
              'A useful sweep usually shows one of two things: fast reclaim back below/above the swept level, or failure to hold the new breakout ground despite the stop run.',
              'If price sweeps highs and then keeps accepting above them, you may simply be watching true continuation rather than a trap.',
            ],
            zh: [
              '一个有意义的 sweep，通常会出现两种特征之一：快速收回到被扫位置下方/上方，或者扫完之后根本守不住新的突破区。',
              '如果价格扫高后还能持续站稳上方，那你看到的可能只是一次真延续，而不是陷阱。',
            ],
          },
          supportingCopy: {
            en: 'The reclaim and the acceptance tell you more than the sweep itself.',
            zh: '真正比 sweep 本身更重要的，是收回动作和后续接受度。',
          },
          chartState: createChartStateLiquidity('meaningful'),
          animationPreset: 'reveal',
          sfxCue: 'step-next',
        },
        {
          type: 'example',
          title: {
            en: 'A common XAUUSD trap sequence',
            zh: '一个很常见的 XAUUSD 陷阱顺序',
          },
          body: {
            en: [
              'Gold builds equal highs during New York pre-data positioning. CPI hits, price spikes through those highs, late breakout buyers chase, and then the move gets fully reclaimed within minutes.',
              'That sequence is not “bearish because it wicked”. It is bearish because the breakout failed to achieve acceptance after harvesting the obvious liquidity.',
            ],
            zh: [
              '黄金在纽约数据前先堆出一排等高。CPI 一出，价格先冲破这些高点，晚进的突破买盘追进去，结果几分钟内整段拉回都被收掉。',
              '这个结构不是“因为有上影线所以看空”，而是因为突破拿完明显流动性后，根本没有形成站稳接受。',
            ],
          },
          supportingCopy: {
            en: 'Advanced TA cares about sequence and acceptance, not just shape recognition.',
            zh: '更进阶的技术分析，看的是顺序和接受，而不只是形状辨认。',
          },
          chartState: createChartStateLiquidity('example'),
          animationPreset: 'pulse',
          sfxCue: 'step-next',
        },
        {
          type: 'drill',
          title: {
            en: 'Checkpoint: sweep or true breakout?',
            zh: '检查点：这是 sweep 还是有效突破？',
          },
          body: {
            en: [
              'Price runs above equal highs, then closes back below the level and fails to reclaim it on the next bounce.',
            ],
            zh: [
              '价格先扫过一排等高，随后收回到该水平位下方，接着下一次反弹也收不回去。',
            ],
          },
          options: [
            {
              key: 'a',
              correct: true,
              text: {
                en: 'This looks more like a sweep that failed to hold, so the rejection deserves respect.',
                zh: '这更像是扫完后守不住的 sweep，所以这个拒绝值得重视。',
              },
              feedback: {
                en: 'Correct. The failed reclaim matters more than the fact that highs were briefly broken.',
                zh: '正确。真正关键的是收不回去，而不是高点曾经被短暂突破。',
              },
            },
            {
              key: 'b',
              correct: false,
              text: {
                en: 'Any break above equal highs is automatically a bullish breakout.',
                zh: '只要突破等高，就自动算多头突破。',
              },
              feedback: {
                en: 'Not enough. Breakout quality depends on acceptance after the sweep, not just the first touch.',
                zh: '还不够。突破质量取决于扫完后的接受度，不是第一次碰到就算数。',
              },
            },
            {
              key: 'c',
              correct: false,
              text: {
                en: 'The sweep tells us nothing because stop runs are random.',
                zh: '这个 sweep 没有意义，因为扫损都是随机的。',
              },
              feedback: {
                en: 'It does tell us something. Obvious liquidity pools often shape the next reaction.',
                zh: '其实很有意义。明显的流动性池，常常会主导下一段反应。',
              },
            },
          ],
          chartState: createChartStateLiquidity('drill'),
          animationPreset: 'spark',
          sfxCue: 'step-next',
        },
        {
          type: 'bridge',
          title: {
            en: 'The advanced mindset',
            zh: '更进阶的思维方式',
          },
          body: {
            en: [
              'Do not worship the label “liquidity sweep”. The label matters less than what the market does immediately after the raid.',
              'If you can read sweep, reclaim, and acceptance as one sequence, you stop reacting to shapes and start reading intent.',
            ],
            zh: [
              '不要迷信“liquidity sweep”这个标签。比标签更重要的，是市场在扫完之后立刻怎么走。',
              '如果你能把 sweep、收回和接受度当成一个连续动作去看，你就不再只是看形状，而是在读意图。',
            ],
          },
          supportingCopy: {
            en: 'The mastery exam is strict on purpose. Advanced concepts should not be passed casually.',
            zh: '这套精通测试故意做得严格。进阶概念不应该被轻松带过。',
          },
          chartState: createChartStateLiquidity('exam'),
          animationPreset: 'rise',
          sfxCue: 'step-next',
        },
      ],
      questionBank,
    };
  }

  function createChartStateXauDrivers(mode) {
    const title = {
      en: 'London expansion after softer yields',
      zh: '收益率回落后的伦敦扩张',
    };

    const variants = {
      intro: {
        type: 'drivers',
        title,
        candles: buildCandles([
          2321.4, 2321.6, 2321.5, 2321.7, 2321.6, 2321.8, 2321.7, 2321.9, 2321.8, 2322.0,
          2322.2, 2322.8, 2323.5, 2324.2, 2324.9, 2325.8, 2326.6, 2327.3, 2328.0, 2328.7,
        ]),
        zones: [
          { from: 0, to: 8, top: 2322.3, bottom: 2321.1, label: { en: 'Asia balance', zh: '亚洲盘平衡区' }, tone: 'muted' },
        ],
        markers: [
          { index: 12, price: 2324.0, label: { en: 'London impulse', zh: '伦敦推动' }, tone: 'bull' },
        ],
      },
      drivers: {
        type: 'drivers',
        title,
        candles: buildCandles([
          2326.3, 2325.9, 2325.4, 2325.1, 2325.5, 2326.1, 2326.7, 2327.4, 2328.0, 2328.6,
          2329.2, 2329.8, 2330.4, 2330.0, 2330.6, 2331.1, 2331.7, 2332.2, 2332.6, 2333.0,
        ]),
        zones: [
          { from: 2, to: 6, top: 2326.4, bottom: 2324.8, label: { en: 'Fresh support', zh: '新支撑区' }, tone: 'bull' },
        ],
        markers: [
          { index: 3, price: 2325.0, label: { en: 'Yields soft', zh: '收益率转弱' }, tone: 'info' },
          { index: 10, price: 2329.3, label: { en: 'DXY weak', zh: 'DXY 转弱' }, tone: 'bull' },
        ],
      },
      example: {
        type: 'drivers',
        title,
        candles: buildCandles([
          2322.0, 2322.3, 2322.7, 2323.1, 2323.7, 2324.3, 2325.0, 2325.8, 2326.5, 2325.7,
          2325.1, 2325.5, 2326.1, 2326.8, 2327.6, 2328.4, 2329.1, 2329.8, 2330.5, 2331.1,
        ]),
        zones: [
          { from: 2, to: 5, top: 2324.6, bottom: 2322.7, label: { en: 'Asia high zone', zh: '亚洲高点区' }, tone: 'muted' },
          { from: 9, to: 12, top: 2326.2, bottom: 2324.8, label: { en: 'Retest hold', zh: '回踩守住' }, tone: 'bull' },
        ],
        markers: [
          { index: 7, price: 2326.0, label: { en: 'Break above Asia', zh: '突破亚洲高点' }, tone: 'bull' },
          { index: 15, price: 2328.8, label: { en: 'Expansion', zh: '扩张延续' }, tone: 'bull' },
        ],
      },
      drill: {
        type: 'drivers',
        title,
        candles: buildCandles([
          2324.2, 2324.6, 2325.0, 2325.4, 2325.9, 2326.4, 2327.0, 2327.6, 2328.2, 2328.6,
          2327.8, 2327.2, 2327.6, 2328.1, 2328.7, 2329.3, 2329.8, 2330.2, 2330.5, 2330.9,
        ]),
        zones: [
          { from: 9, to: 12, top: 2328.8, bottom: 2326.9, label: { en: 'Decision zone', zh: '决策区' }, tone: 'focus' },
        ],
        markers: [
          { index: 11, price: 2327.2, label: { en: 'Hold or fail?', zh: '守住还是失守？' }, tone: 'warn' },
        ],
      },
      exam: {
        type: 'drivers',
        title,
        candles: buildCandles([
          2327.0, 2327.4, 2327.9, 2328.4, 2328.9, 2329.4, 2329.9, 2330.3, 2330.8, 2331.2,
          2331.6, 2331.0, 2331.4, 2331.9, 2332.5, 2333.1, 2333.6, 2334.1, 2334.6, 2335.0,
        ]),
        zones: [
          { from: 10, to: 15, top: 2333.0, bottom: 2330.7, label: { en: 'Bias remains bullish', zh: '偏向仍偏多' }, tone: 'bull' },
        ],
        markers: [
          { index: 11, price: 2331.0, label: { en: 'Context > candle', zh: '背景大于单根 K 线' }, tone: 'info' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateTrendRange(mode) {
    if (mode === 'exam') {
      return {
        type: 'bridge',
        title: { en: 'Choose the right playbook', zh: '用对剧本' },
        candles: buildCandles([
          2336.2, 2335.7, 2335.1, 2334.8, 2334.2, 2333.9, 2333.4, 2333.0, 2332.7, 2332.9,
          2333.4, 2334.0, 2334.8, 2335.6, 2336.2, 2335.5, 2334.9, 2334.4, 2334.9, 2335.8,
          2336.6, 2337.3, 2338.0,
        ]),
        zones: [
          { from: 6, to: 10, top: 2333.6, bottom: 2332.5, label: { en: 'Trend base', zh: '趋势底座' }, tone: 'muted' },
          { from: 15, to: 18, top: 2335.7, bottom: 2334.1, label: { en: 'Pullback support', zh: '回踩支撑' }, tone: 'bull' },
        ],
        markers: [
          { index: 14, price: 2336.2, label: { en: 'Impulse first', zh: '先看到一段推动波' }, tone: 'info' },
          { index: 17, price: 2334.4, label: { en: 'Trend logic belongs here', zh: '这里才是趋势逻辑' }, tone: 'info' },
        ],
      };
    }

    const variants = {
      intro: {
        type: 'classification',
        title: { en: 'Classification before execution', zh: '先分类，再执行' },
        candles: buildCandles([
          2335.8, 2335.1, 2335.7, 2334.9, 2335.4, 2334.6, 2335.2, 2334.5, 2335.1, 2334.7,
          2335.3, 2334.8, 2335.0, 2334.6, 2335.2, 2334.7, 2335.1, 2334.8, 2335.0, 2334.9,
        ]),
        zones: [
          { from: 2, to: 14, top: 2336.1, bottom: 2334.3, label: { en: 'Unclear zone', zh: '不清晰区' }, tone: 'muted' },
        ],
        markers: [
          { index: 8, price: 2335.3, label: { en: 'Wait if needed', zh: '必要时先等' }, tone: 'warn' },
        ],
      },
      trend: {
        type: 'trend',
        title: { en: 'Structured bullish continuation', zh: '有结构的多头延续' },
        candles: buildCandles([
          2329.4, 2330.0, 2330.7, 2331.4, 2331.0, 2331.8, 2332.5, 2333.1, 2332.7, 2333.6,
          2334.4, 2335.2, 2334.8, 2335.7, 2336.4, 2337.1, 2336.8, 2337.7, 2338.4, 2339.0,
        ]),
        zones: [
          { from: 11, to: 14, top: 2335.9, bottom: 2334.6, label: { en: 'Buyback zone', zh: '回踩承接区' }, tone: 'bull' },
        ],
        markers: [
          { index: 8, price: 2332.8, label: { en: 'Impulse', zh: '推动波' }, tone: 'bull' },
          { index: 16, price: 2336.9, label: { en: 'Higher high', zh: '更高高点' }, tone: 'bull' },
        ],
      },
      range: {
        type: 'range',
        title: { en: 'Repeated rotation inside a band', zh: '区间内反复轮动' },
        candles: buildCandles([
          2334.3, 2334.9, 2333.8, 2334.6, 2333.7, 2334.8, 2333.6, 2334.7, 2333.5, 2334.6,
          2333.7, 2334.9, 2333.8, 2334.7, 2333.6, 2334.5, 2333.7, 2334.6, 2333.8, 2334.4,
        ]),
        zones: [
          { from: 0, to: 18, top: 2335.3, bottom: 2333.4, label: { en: 'Range boundary', zh: '震荡边界' }, tone: 'focus' },
        ],
        markers: [
          { index: 1, price: 2335.0, label: { en: 'Upper reject', zh: '上沿压回' }, tone: 'bear' },
          { index: 8, price: 2333.6, label: { en: 'Lower hold', zh: '下沿支撑' }, tone: 'bull' },
        ],
      },
      drill: {
        type: 'range-drill',
        title: { en: 'Respect the edges', zh: '尊重边界' },
        candles: buildCandles([
          2334.0, 2334.6, 2333.8, 2334.4, 2333.7, 2334.5, 2333.6, 2334.6, 2333.7, 2334.8,
          2335.1, 2334.3, 2333.9, 2334.4, 2333.8, 2334.3, 2333.7, 2334.2, 2333.8, 2334.1,
        ]),
        zones: [
          { from: 0, to: 18, top: 2335.2, bottom: 2333.5, label: { en: 'Range stays intact', zh: '区间仍有效' }, tone: 'focus' },
        ],
        markers: [
          { index: 10, price: 2335.0, label: { en: 'Late breakout trap risk', zh: '晚追突破风险' }, tone: 'warn' },
        ],
      },
      exam: {
        type: 'bridge',
        title: { en: 'Choose the right playbook', zh: '用对剧本' },
        candles: buildCandles([
          2336.2, 2335.7, 2335.1, 2334.8, 2334.2, 2333.9, 2333.4, 2333.0, 2332.7, 2332.9,
          2333.3, 2333.8, 2334.4, 2335.0, 2335.7, 2336.2, 2336.8, 2337.3, 2337.9, 2338.4,
        ]),
        zones: [
          { from: 6, to: 10, top: 2333.6, bottom: 2332.5, label: { en: 'Trend base', zh: '趋势底座' }, tone: 'muted' },
          { from: 12, to: 15, top: 2335.9, bottom: 2334.4, label: { en: 'Pullback support', zh: '回踩支撑' }, tone: 'bull' },
        ],
        markers: [
          { index: 13, price: 2335.0, label: { en: 'Trend logic belongs here', zh: '这里才是趋势逻辑' }, tone: 'info' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateLiquidity(mode) {
    const variants = {
      intro: {
        type: 'liquidity',
        title: { en: 'Equal highs attract stops', zh: '等高会吸引止损' },
        candles: buildCandles([
          2340.8, 2341.2, 2341.6, 2341.3, 2341.8, 2342.1, 2341.9, 2342.2, 2342.0, 2342.3,
          2342.1, 2342.4, 2342.2, 2342.5, 2342.3, 2342.6, 2342.4, 2342.7, 2342.5, 2342.6,
        ]),
        zones: [
          { from: 10, to: 18, top: 2342.9, bottom: 2342.1, label: { en: 'Equal highs', zh: '等高区' }, tone: 'muted' },
        ],
        markers: [
          { index: 16, price: 2342.7, label: { en: 'Liquidity pool', zh: '流动性池' }, tone: 'warn' },
        ],
      },
      meaningful: {
        type: 'liquidity-reclaim',
        title: { en: 'Reclaim failure matters', zh: '收不回去才关键' },
        candles: buildCandles([
          2341.0, 2341.4, 2341.9, 2341.6, 2342.0, 2342.4, 2342.2, 2343.0, 2344.5, 2342.9,
          2342.0, 2341.5, 2341.2, 2340.9, 2341.1, 2340.8, 2340.6, 2340.9, 2340.5, 2340.3,
        ]),
        zones: [
          { from: 7, to: 10, top: 2343.3, bottom: 2341.9, label: { en: 'Post-sweep reclaim zone', zh: '扫后收回区' }, tone: 'bear' },
        ],
        markers: [
          { index: 8, price: 2344.3, label: { en: 'Stops triggered', zh: '止损被打' }, tone: 'warn' },
          { index: 11, price: 2341.6, label: { en: 'Acceptance below', zh: '回到下方接受' }, tone: 'bear' },
        ],
      },
      example: {
        type: 'liquidity-example',
        title: { en: 'Data spike trap', zh: '数据尖刺陷阱' },
        candles: buildCandles([
          2341.2, 2341.7, 2342.0, 2342.4, 2342.7, 2342.9, 2342.8, 2343.2, 2345.1, 2343.6,
          2342.4, 2341.6, 2341.0, 2340.7, 2340.9, 2340.6, 2340.4, 2340.7, 2340.3, 2340.1,
        ]),
        zones: [
          { from: 4, to: 8, top: 2343.4, bottom: 2342.3, label: { en: 'Pre-data highs', zh: '数据前高点' }, tone: 'focus' },
          { from: 10, to: 14, top: 2342.5, bottom: 2340.8, label: { en: 'Failed breakout acceptance', zh: '突破接受失败' }, tone: 'bear' },
        ],
        markers: [
          { index: 8, price: 2344.9, label: { en: 'News spike', zh: '数据尖刺' }, tone: 'warn' },
          { index: 12, price: 2341.1, label: { en: 'Fast reclaim', zh: '快速收回' }, tone: 'bear' },
        ],
      },
      drill: {
        type: 'liquidity-drill',
        title: { en: 'Sweep vs breakout', zh: '扫流动性 vs 真突破' },
        candles: buildCandles([
          2341.1, 2341.5, 2341.9, 2342.2, 2342.5, 2342.7, 2343.0, 2343.4, 2344.6, 2343.8,
          2342.9, 2342.2, 2341.8, 2341.4, 2341.1, 2340.9, 2340.7, 2340.9, 2340.6, 2340.4,
        ]),
        zones: [
          { from: 6, to: 9, top: 2343.6, bottom: 2342.4, label: { en: 'Decision shelf', zh: '决策平台' }, tone: 'warn' },
        ],
        markers: [
          { index: 8, price: 2344.4, label: { en: 'Sweep', zh: '扫流动性' }, tone: 'warn' },
          { index: 12, price: 2341.9, label: { en: 'No reclaim', zh: '收不回去' }, tone: 'bear' },
        ],
      },
      exam: {
        type: 'liquidity-bridge',
        title: { en: 'Read the sequence, not the label', zh: '读顺序，不是读标签' },
        candles: buildCandles([
          2342.2, 2341.8, 2341.4, 2341.1, 2340.7, 2340.3, 2340.0, 2339.7, 2338.9, 2339.8,
          2340.4, 2341.0, 2341.6, 2342.0, 2342.4, 2342.8, 2343.1, 2343.4, 2343.7, 2344.0,
        ]),
        zones: [
          { from: 6, to: 9, top: 2340.4, bottom: 2338.8, label: { en: 'Obvious liquidity', zh: '明显流动性' }, tone: 'muted' },
          { from: 10, to: 15, top: 2342.6, bottom: 2340.2, label: { en: 'Intent revealed here', zh: '意图在这里暴露' }, tone: 'bull' },
        ],
        markers: [
          { index: 8, price: 2339.0, label: { en: 'Sell-side sweep', zh: '下方流动性被扫' }, tone: 'warn' },
          { index: 13, price: 2342.0, label: { en: 'Sequence complete', zh: '顺序完成' }, tone: 'info' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateCandlesClosingStrength(mode) {
    const variants = {
      intro: {
        type: 'candles-intro',
        title: { en: 'Close tells the story', zh: '收盘位置最会讲故事' },
        candles: buildCandles([
          2331.8, 2331.4, 2331.9, 2331.5, 2332.0, 2331.7, 2332.4, 2332.9, 2333.3, 2333.7,
          2334.0, 2333.8, 2334.3, 2334.8, 2335.1, 2335.4, 2335.7, 2335.9, 2336.1, 2336.3,
        ]),
        zones: [
          { from: 6, to: 9, top: 2334.1, bottom: 2332.5, label: { en: 'Strong body close', zh: '强实体收盘' }, tone: 'bull' },
        ],
        markers: [
          { index: 10, price: 2333.8, label: { en: 'Buyers kept the close', zh: '买方把控到收盘' }, tone: 'info' },
        ],
      },
      close: {
        type: 'candles-close',
        title: { en: 'Close quality beats travel distance', zh: '收盘质量比盘中路程更重要' },
        candles: buildCandles([
          2334.8, 2335.4, 2335.9, 2335.2, 2336.1, 2336.8, 2336.0, 2336.5, 2337.2, 2337.6,
          2337.1, 2337.8, 2338.2, 2337.6, 2338.4, 2338.7, 2338.4, 2338.9, 2339.2, 2339.5,
        ]),
        zones: [
          { from: 3, to: 6, top: 2336.9, bottom: 2335.7, label: { en: 'Weak reclaim close', zh: '弱收复收盘' }, tone: 'bear' },
          { from: 10, to: 13, top: 2338.5, bottom: 2337.0, label: { en: 'Strong close shelf', zh: '强收盘平台' }, tone: 'bull' },
        ],
        markers: [
          { index: 5, price: 2336.7, label: { en: 'Travelled far, held little', zh: '盘中走得远，收盘守得少' }, tone: 'bear' },
          { index: 12, price: 2337.9, label: { en: 'Close near high', zh: '接近高点收盘' }, tone: 'info' },
        ],
      },
      example: {
        type: 'candles-example',
        title: { en: 'Wick plus follow-through', zh: '影线加后续跟进' },
        candles: buildCandles([
          2336.4, 2335.9, 2335.5, 2335.1, 2334.9, 2334.6, 2334.3, 2334.9, 2335.7, 2335.4,
          2335.9, 2336.3, 2336.7, 2337.0, 2337.3, 2337.6, 2337.9, 2338.1, 2338.3, 2338.5,
        ]),
        zones: [
          { from: 5, to: 8, top: 2335.2, bottom: 2334.1, label: { en: 'Lower-wick reject zone', zh: '下影拒绝区' }, tone: 'bull' },
          { from: 8, to: 11, top: 2336.3, bottom: 2335.2, label: { en: 'Follow-through starts here', zh: '后续跟进从这里开始' }, tone: 'focus' },
        ],
        markers: [
          { index: 7, price: 2334.8, label: { en: 'Wick alone is not enough', zh: '只有影线还不够' }, tone: 'info' },
          { index: 10, price: 2336.0, label: { en: 'Next closes agree', zh: '后面收盘开始认同' }, tone: 'bull' },
        ],
      },
      drill: {
        type: 'candles-drill',
        title: { en: 'Respect the close that held', zh: '尊重真正守住的收盘' },
        candles: buildCandles([
          2333.7, 2334.2, 2334.6, 2334.0, 2334.9, 2335.5, 2334.7, 2335.1, 2335.8, 2336.1,
          2335.4, 2335.9, 2336.3, 2336.6, 2336.2, 2336.8, 2337.1, 2337.4, 2337.7, 2338.0,
        ]),
        zones: [
          { from: 3, to: 6, top: 2335.8, bottom: 2334.4, label: { en: 'Flashy but loose', zh: '看着猛，但收得松' }, tone: 'bear' },
          { from: 10, to: 13, top: 2336.8, bottom: 2335.3, label: { en: 'Cleaner acceptance', zh: '更干净的接受' }, tone: 'bull' },
        ],
        markers: [
          { index: 5, price: 2335.3, label: { en: 'Big move, weak hold', zh: '大波动，弱守住' }, tone: 'bear' },
          { index: 12, price: 2336.2, label: { en: 'Better message', zh: '更好的信息' }, tone: 'info' },
        ],
      },
      exam: {
        type: 'candles-bridge',
        title: { en: 'Read strength through the close', zh: '通过收盘读取强弱' },
        candles: buildCandles([
          2332.9, 2332.6, 2332.3, 2332.1, 2332.5, 2333.0, 2333.6, 2334.2, 2334.8, 2335.4,
          2334.9, 2334.6, 2335.1, 2335.8, 2336.4, 2336.0, 2336.5, 2337.0, 2337.4, 2337.8,
        ]),
        zones: [
          { from: 6, to: 10, top: 2335.7, bottom: 2333.8, label: { en: 'Impulse closes strong', zh: '推动波强收盘' }, tone: 'bull' },
          { from: 10, to: 13, top: 2335.4, bottom: 2334.4, label: { en: 'Pullback still held', zh: '回踩仍守得住' }, tone: 'focus' },
        ],
        markers: [
          { index: 9, price: 2335.3, label: { en: 'Close first', zh: '先看收盘' }, tone: 'info' },
          { index: 13, price: 2335.7, label: { en: 'Then test follow-through', zh: '再看后续跟进' }, tone: 'info' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateMarketStructure(mode) {
    const variants = {
      intro: {
        type: 'structure-intro',
        title: { en: 'Swings build the map', zh: '摆动点会拼出地图' },
        candles: buildCandles([
          2336.1, 2335.5, 2335.0, 2334.6, 2334.1, 2333.7, 2333.4, 2333.0, 2332.8, 2333.1,
          2333.5, 2334.0, 2334.5, 2335.0, 2335.6, 2336.0, 2336.4, 2336.8, 2337.2, 2337.5,
        ]),
        zones: [
          { from: 6, to: 10, top: 2333.6, bottom: 2332.5, label: { en: 'Swing base', zh: '摆动底座' }, tone: 'muted' },
        ],
        markers: [
          { index: 13, price: 2335.1, label: { en: 'Structure starts to rise', zh: '结构开始抬高' }, tone: 'info' },
        ],
      },
      trend: {
        type: 'structure-trend',
        title: { en: 'Impulse plus pullback pair', zh: '推动波加回调成对出现' },
        candles: buildCandles([
          2331.8, 2332.4, 2333.0, 2333.7, 2334.3, 2334.9, 2335.4, 2334.8, 2334.3, 2334.7,
          2335.4, 2336.0, 2336.7, 2337.2, 2337.8, 2338.3, 2338.0, 2338.5, 2338.9, 2339.3,
        ]),
        zones: [
          { from: 6, to: 10, top: 2335.2, bottom: 2334.1, label: { en: 'Controlled pullback', zh: '受控回调' }, tone: 'bull' },
        ],
        markers: [
          { index: 5, price: 2335.0, label: { en: 'Impulse', zh: '推动波' }, tone: 'bull' },
          { index: 10, price: 2334.8, label: { en: 'Higher low survives', zh: '更高低点守住' }, tone: 'info' },
        ],
      },
      example: {
        type: 'structure-example',
        title: { en: 'A break must change the sequence', zh: '破坏必须改变顺序' },
        candles: buildCandles([
          2338.0, 2337.6, 2337.1, 2336.7, 2336.2, 2335.8, 2335.4, 2335.1, 2334.8, 2335.3,
          2335.8, 2335.4, 2335.0, 2334.6, 2334.3, 2334.0, 2333.8, 2333.6, 2333.5, 2333.3,
        ]),
        zones: [
          { from: 7, to: 11, top: 2335.7, bottom: 2334.7, label: { en: 'Failed reclaim area', zh: '收复失败区' }, tone: 'bear' },
        ],
        markers: [
          { index: 8, price: 2334.9, label: { en: 'Prior higher low lost', zh: '原先更高低点失守' }, tone: 'warn' },
          { index: 12, price: 2335.0, label: { en: 'Reclaim stays weak', zh: '收复动作偏弱' }, tone: 'bear' },
        ],
      },
      drill: {
        type: 'structure-drill',
        title: { en: 'Sequence repaired or truly broken?', zh: '顺序修复了，还是彻底坏了？' },
        candles: buildCandles([
          2333.2, 2333.7, 2334.2, 2334.8, 2335.3, 2335.8, 2335.1, 2334.6, 2334.2, 2334.9,
          2335.4, 2335.9, 2336.3, 2336.8, 2337.1, 2337.4, 2337.0, 2337.5, 2337.8, 2338.1,
        ]),
        zones: [
          { from: 7, to: 10, top: 2335.0, bottom: 2334.0, label: { en: 'Quick repair zone', zh: '快速修复区' }, tone: 'focus' },
        ],
        markers: [
          { index: 8, price: 2334.3, label: { en: 'Brief violation', zh: '短暂失守' }, tone: 'warn' },
          { index: 11, price: 2335.8, label: { en: 'Sequence repaired', zh: '顺序被修复' }, tone: 'info' },
        ],
      },
      exam: {
        type: 'structure-bridge',
        title: { en: 'Sequence gives the verdict', zh: '顺序才给最终结论' },
        candles: buildCandles([
          2332.4, 2332.9, 2333.4, 2334.0, 2334.7, 2335.3, 2336.0, 2336.7, 2336.1, 2335.5,
          2335.1, 2335.6, 2336.3, 2336.9, 2337.4, 2337.9, 2338.3, 2338.7, 2339.0, 2339.3,
        ]),
        zones: [
          { from: 6, to: 11, top: 2336.9, bottom: 2334.9, label: { en: 'Pullback did not kill impulse', zh: '回调没有毁掉推动' }, tone: 'bull' },
        ],
        markers: [
          { index: 7, price: 2336.6, label: { en: 'Impulse set the base', zh: '推动波先定基调' }, tone: 'bull' },
          { index: 12, price: 2336.1, label: { en: 'Structure still survives here', zh: '结构在这里仍然活着' }, tone: 'info' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateSupportResistance(mode) {
    const variants = {
      intro: {
        type: 'zones-intro',
        title: { en: 'Levels behave like shelves', zh: '关键位更像平台' },
        candles: buildCandles([
          2337.5, 2337.0, 2336.6, 2336.1, 2335.8, 2335.4, 2335.0, 2335.3, 2335.7, 2336.0,
          2335.6, 2335.2, 2335.5, 2335.9, 2336.2, 2336.6, 2336.9, 2337.2, 2337.5, 2337.8,
        ]),
        zones: [
          { from: 5, to: 13, top: 2336.2, bottom: 2335.0, label: { en: 'Reaction shelf', zh: '反应平台' }, tone: 'muted' },
        ],
        markers: [
          { index: 9, price: 2335.9, label: { en: 'Not a single line', zh: '不是一条死线' }, tone: 'info' },
        ],
      },
      quality: {
        type: 'zones-quality',
        title: { en: 'Good zone vs random line', zh: '好区域 vs 随便一条线' },
        candles: buildCandles([
          2333.8, 2334.4, 2335.0, 2335.6, 2336.1, 2336.5, 2336.0, 2335.6, 2335.2, 2335.7,
          2336.2, 2336.7, 2337.1, 2336.8, 2336.4, 2336.9, 2337.3, 2337.6, 2337.9, 2338.1,
        ]),
        zones: [
          { from: 3, to: 6, top: 2336.8, bottom: 2335.6, label: { en: 'Prior swing zone', zh: '前高摆动区' }, tone: 'focus' },
          { from: 10, to: 12, top: 2336.9, bottom: 2336.1, label: { en: 'Retest memory', zh: '回踩记忆区' }, tone: 'bull' },
        ],
        markers: [
          { index: 8, price: 2335.3, label: { en: 'Random midpoint', zh: '随意中间位' }, tone: 'warn' },
        ],
      },
      example: {
        type: 'zones-example',
        title: { en: 'Resistance can flip only if it holds', zh: '阻力变支撑，前提是守得住' },
        candles: buildCandles([
          2332.7, 2333.2, 2333.7, 2334.1, 2334.6, 2335.1, 2335.5, 2335.9, 2335.4, 2334.9,
          2335.3, 2335.8, 2336.3, 2336.7, 2337.1, 2337.4, 2337.7, 2338.0, 2338.2, 2338.4,
        ]),
        zones: [
          { from: 6, to: 9, top: 2336.0, bottom: 2335.1, label: { en: 'Old resistance shelf', zh: '旧阻力平台' }, tone: 'focus' },
          { from: 9, to: 12, top: 2335.9, bottom: 2334.8, label: { en: 'Retest must hold here', zh: '回踩要守在这里' }, tone: 'bull' },
        ],
        markers: [
          { index: 7, price: 2335.8, label: { en: 'Breakout', zh: '突破' }, tone: 'bull' },
          { index: 10, price: 2335.2, label: { en: 'Role reversal proves itself here', zh: '角色互换在这里被证明' }, tone: 'info' },
        ],
      },
      drill: {
        type: 'zones-drill',
        title: { en: 'Choose the zone with memory', zh: '选那个有记忆的区域' },
        candles: buildCandles([
          2335.1, 2335.6, 2336.2, 2336.7, 2337.1, 2336.6, 2336.0, 2335.7, 2336.1, 2336.6,
          2337.0, 2337.4, 2337.8, 2337.3, 2336.9, 2337.2, 2337.6, 2337.9, 2338.1, 2338.3,
        ]),
        zones: [
          { from: 2, to: 5, top: 2337.3, bottom: 2336.2, label: { en: 'High-memory zone', zh: '高记忆区域' }, tone: 'focus' },
          { from: 8, to: 10, top: 2336.5, bottom: 2335.9, label: { en: 'Weak midpoint line', zh: '弱中间位' }, tone: 'bear' },
        ],
        markers: [
          { index: 4, price: 2337.0, label: { en: 'Strong rejection history', zh: '有明显拒绝历史' }, tone: 'info' },
          { index: 9, price: 2336.2, label: { en: 'Just one pause', zh: '只是停过一次' }, tone: 'warn' },
        ],
      },
      exam: {
        type: 'zones-bridge',
        title: { en: 'Respect the cleaner area', zh: '尊重更干净的区域' },
        candles: buildCandles([
          2334.5, 2334.9, 2335.3, 2335.8, 2336.2, 2336.7, 2337.1, 2336.6, 2336.1, 2335.8,
          2336.2, 2336.7, 2337.2, 2337.6, 2338.0, 2338.3, 2338.6, 2338.9, 2339.1, 2339.3,
        ]),
        zones: [
          { from: 5, to: 10, top: 2337.2, bottom: 2335.7, label: { en: 'Zone with memory', zh: '有记忆的区域' }, tone: 'bull' },
        ],
        markers: [
          { index: 6, price: 2337.0, label: { en: 'Old resistance first', zh: '先是旧阻力' }, tone: 'focus' },
          { index: 10, price: 2336.1, label: { en: 'Then support if it holds', zh: '守住后才算支撑' }, tone: 'info' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateMultiTimeframe(mode) {
    const variants = {
      intro: {
        type: 'mtf-intro',
        title: { en: 'Higher timeframe first', zh: '先看高周期' },
        candles: buildCandles([
          2331.4, 2331.9, 2332.5, 2333.0, 2333.6, 2334.2, 2334.8, 2335.4, 2335.0, 2335.5,
          2336.0, 2336.4, 2336.9, 2337.3, 2337.8, 2338.2, 2338.6, 2338.9, 2339.2, 2339.5,
        ]),
        zones: [
          { from: 6, to: 10, top: 2335.7, bottom: 2334.7, label: { en: 'Bias shelf (H1)', zh: '方向平台（H1）' }, tone: 'bull' },
        ],
        markers: [
          { index: 13, price: 2337.2, label: { en: 'Lower chart comes later', zh: '小图是后面才用的' }, tone: 'info' },
        ],
      },
      bias: {
        type: 'mtf-bias',
        title: { en: 'Bias before trigger', zh: '先方向，后触发' },
        candles: buildCandles([
          2335.2, 2335.7, 2336.2, 2336.8, 2337.4, 2338.0, 2338.5, 2338.1, 2337.7, 2338.0,
          2338.4, 2338.9, 2339.4, 2339.8, 2340.2, 2340.5, 2340.1, 2340.4, 2340.8, 2341.1,
        ]),
        zones: [
          { from: 6, to: 10, top: 2338.6, bottom: 2337.5, label: { en: 'M15 setup inside H1 bias', zh: 'H1 方向下的 M15 setup' }, tone: 'focus' },
        ],
        markers: [
          { index: 5, price: 2338.0, label: { en: 'H1 direction first', zh: '先看 H1 方向' }, tone: 'bull' },
          { index: 9, price: 2337.9, label: { en: 'Then refine on smaller chart', zh: '再到小图细化' }, tone: 'info' },
        ],
      },
      example: {
        type: 'mtf-example',
        title: { en: 'Top-down pullback entry', zh: '自上而下的回踩进场' },
        candles: buildCandles([
          2334.0, 2334.5, 2335.1, 2335.8, 2336.4, 2337.0, 2337.6, 2338.1, 2337.8, 2337.3,
          2336.9, 2337.2, 2337.7, 2338.2, 2338.8, 2339.3, 2339.7, 2340.0, 2340.3, 2340.6,
        ]),
        zones: [
          { from: 7, to: 11, top: 2338.3, bottom: 2336.8, label: { en: 'Pullback area for execution', zh: '执行用的回踩区' }, tone: 'bull' },
        ],
        markers: [
          { index: 6, price: 2337.5, label: { en: 'H1 breakout already happened', zh: 'H1 突破已先发生' }, tone: 'focus' },
          { index: 11, price: 2337.1, label: { en: 'M15 gives the setup', zh: 'M15 给出 setup' }, tone: 'info' },
        ],
      },
      drill: {
        type: 'mtf-drill',
        title: { en: 'Bias, setup, trigger', zh: '方向、setup、trigger' },
        candles: buildCandles([
          2336.0, 2336.5, 2337.1, 2337.7, 2338.2, 2338.7, 2338.3, 2337.9, 2337.5, 2338.0,
          2338.4, 2338.9, 2339.3, 2339.7, 2340.0, 2340.3, 2340.6, 2340.9, 2341.1, 2341.3,
        ]),
        zones: [
          { from: 6, to: 9, top: 2338.5, bottom: 2337.4, label: { en: 'Setup zone', zh: 'setup 区' }, tone: 'focus' },
          { from: 9, to: 11, top: 2338.4, bottom: 2337.8, label: { en: 'Small trigger pocket', zh: '小 trigger 区' }, tone: 'bull' },
        ],
        markers: [
          { index: 4, price: 2338.1, label: { en: 'H1 bias', zh: 'H1 方向' }, tone: 'bull' },
        ],
      },
      exam: {
        type: 'mtf-exam',
        title: { en: 'Keep the timeframes coherent', zh: '让周期逻辑保持一致' },
        candles: buildCandles([
          2335.1, 2335.6, 2336.2, 2336.9, 2337.5, 2338.1, 2338.7, 2339.2, 2338.8, 2338.3,
          2337.9, 2338.2, 2338.8, 2339.3, 2339.8, 2340.2, 2340.6, 2340.9, 2341.2, 2341.5,
        ]),
        zones: [
          { from: 7, to: 11, top: 2339.3, bottom: 2337.8, label: { en: 'Execution should live here', zh: '执行应该发生在这里' }, tone: 'bull' },
        ],
        markers: [
          { index: 5, price: 2338.0, label: { en: 'Bias from higher chart', zh: '方向来自大图' }, tone: 'focus' },
          { index: 10, price: 2338.0, label: { en: 'Trigger from smaller chart', zh: '触发来自小图' }, tone: 'info' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateIndicators(mode) {
    const variants = {
      intro: {
        type: 'indicators-intro',
        title: { en: 'Indicators support the read', zh: '指标只辅助阅读' },
        candles: buildCandles([
          2332.8, 2333.2, 2333.7, 2334.1, 2334.6, 2335.0, 2335.4, 2335.8, 2336.2, 2335.9,
          2335.6, 2335.9, 2336.3, 2336.8, 2337.2, 2337.6, 2338.0, 2338.3, 2338.6, 2338.9,
        ]),
        zones: [
          { from: 7, to: 12, top: 2336.4, bottom: 2335.4, label: { en: 'Price structure still leads', zh: '价格结构仍是主导' }, tone: 'focus' },
        ],
        markers: [
          { index: 10, price: 2335.8, label: { en: 'Indicator checks come after', zh: '指标检查在后面' }, tone: 'info' },
        ],
      },
      roles: {
        type: 'indicators-roles',
        title: { en: 'One question per indicator', zh: '一个指标回答一个问题' },
        candles: buildCandles([
          2334.2, 2334.8, 2335.3, 2335.9, 2336.4, 2336.9, 2337.3, 2336.8, 2336.3, 2336.7,
          2337.1, 2337.6, 2338.0, 2338.4, 2338.8, 2339.1, 2338.7, 2339.0, 2339.3, 2339.6,
        ]),
        zones: [
          { from: 6, to: 9, top: 2337.4, bottom: 2336.2, label: { en: 'EMA / reclaim context', zh: 'EMA / 收复语境' }, tone: 'bull' },
          { from: 10, to: 13, top: 2338.2, bottom: 2337.0, label: { en: 'Momentum quality check', zh: '动能质量检查' }, tone: 'focus' },
        ],
        markers: [
          { index: 8, price: 2336.5, label: { en: 'Trend question', zh: '趋势问题' }, tone: 'bull' },
          { index: 12, price: 2337.9, label: { en: 'Momentum question', zh: '动能问题' }, tone: 'info' },
        ],
      },
      example: {
        type: 'indicators-example',
        title: { en: 'Indicator alignment after reclaim', zh: '收复后才看指标同向' },
        candles: buildCandles([
          2335.8, 2335.3, 2334.9, 2335.2, 2335.7, 2336.2, 2336.7, 2337.2, 2337.6, 2337.3,
          2336.9, 2337.4, 2338.0, 2338.5, 2338.9, 2339.2, 2339.5, 2339.8, 2340.0, 2340.2,
        ]),
        zones: [
          { from: 4, to: 8, top: 2337.4, bottom: 2335.4, label: { en: 'Structure reclaimed first', zh: '先有结构收复' }, tone: 'bull' },
          { from: 9, to: 12, top: 2337.8, bottom: 2336.8, label: { en: 'Indicator support after that', zh: '之后才看指标支持' }, tone: 'focus' },
        ],
        markers: [
          { index: 7, price: 2337.1, label: { en: 'Price reclaimed', zh: '价格先收复' }, tone: 'bull' },
          { index: 11, price: 2337.3, label: { en: 'Indicators confirm', zh: '指标再确认' }, tone: 'info' },
        ],
      },
      drill: {
        type: 'indicators-drill',
        title: { en: 'Messy price beats pretty indicator', zh: '混乱价格胜过漂亮指标' },
        candles: buildCandles([
          2338.3, 2337.9, 2338.2, 2337.8, 2338.1, 2337.7, 2338.0, 2337.6, 2337.9, 2337.5,
          2337.8, 2337.4, 2337.7, 2337.3, 2337.6, 2337.2, 2337.5, 2337.1, 2337.4, 2337.0,
        ]),
        zones: [
          { from: 1, to: 16, top: 2338.4, bottom: 2337.1, label: { en: 'Messy overlap under resistance', zh: '阻力下方的混乱重叠' }, tone: 'muted' },
        ],
        markers: [
          { index: 10, price: 2337.7, label: { en: 'Indicator looks better than chart', zh: '指标看起来比图更好' }, tone: 'warn' },
        ],
      },
      exam: {
        type: 'indicators-exam',
        title: { en: 'Match the indicator to the question', zh: '把指标配到对的问题上' },
        candles: buildCandles([
          2334.9, 2335.3, 2335.8, 2336.2, 2336.7, 2337.1, 2337.5, 2337.9, 2337.4, 2337.0,
          2337.4, 2337.9, 2338.4, 2338.9, 2339.3, 2339.7, 2340.0, 2340.3, 2340.6, 2340.9,
        ]),
        zones: [
          { from: 7, to: 11, top: 2338.1, bottom: 2336.8, label: { en: 'Structure remains primary', zh: '结构仍是主导' }, tone: 'focus' },
        ],
        markers: [
          { index: 6, price: 2337.4, label: { en: 'Ask structure first', zh: '先问结构问题' }, tone: 'bull' },
          { index: 10, price: 2337.3, label: { en: 'Indicator answers second', zh: '指标后回答' }, tone: 'info' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateTradePlanning(mode) {
    const variants = {
      intro: {
        type: 'plan-intro',
        title: { en: 'Idea vs executable plan', zh: '想法和计划不是一回事' },
        candles: buildCandles([
          2333.6, 2334.1, 2334.6, 2335.0, 2335.5, 2335.9, 2336.4, 2336.0, 2335.6, 2335.3,
          2335.8, 2336.3, 2336.8, 2337.2, 2337.6, 2337.9, 2338.2, 2338.5, 2338.8, 2339.0,
        ]),
        zones: [
          { from: 7, to: 10, top: 2336.2, bottom: 2335.2, label: { en: 'Potential entry area', zh: '候选进场区' }, tone: 'focus' },
        ],
        markers: [
          { index: 12, price: 2336.7, label: { en: 'Idea needs a plan now', zh: '想法现在要落成计划' }, tone: 'info' },
        ],
      },
      invalidation: {
        type: 'plan-invalidation',
        title: { en: 'Stop beyond structural failure', zh: '止损放在结构失效后面' },
        candles: buildCandles([
          2335.1, 2335.6, 2336.2, 2336.8, 2337.3, 2337.8, 2337.4, 2337.0, 2336.6, 2336.2,
          2336.6, 2337.1, 2337.5, 2338.0, 2338.4, 2338.8, 2339.1, 2339.4, 2339.7, 2340.0,
        ]),
        zones: [
          { from: 7, to: 11, top: 2337.2, bottom: 2336.0, label: { en: 'Idea fails below here', zh: '跌破这里才算失效' }, tone: 'bear' },
        ],
        markers: [
          { index: 9, price: 2336.3, label: { en: 'Structure stop', zh: '结构止损' }, tone: 'warn' },
        ],
      },
      example: {
        type: 'plan-example',
        title: { en: 'Target from structure', zh: '目标位来自结构' },
        candles: buildCandles([
          2332.9, 2333.4, 2333.9, 2334.5, 2335.0, 2335.6, 2336.1, 2335.7, 2335.3, 2335.8,
          2336.4, 2337.0, 2337.5, 2338.0, 2338.4, 2338.8, 2339.1, 2339.4, 2339.6, 2339.8,
        ]),
        zones: [
          { from: 6, to: 9, top: 2336.3, bottom: 2335.2, label: { en: 'Entry on pullback', zh: '回踩进场区' }, tone: 'bull' },
          { from: 13, to: 17, top: 2339.2, bottom: 2338.1, label: { en: 'Prior high / target shelf', zh: '前高 / 目标平台' }, tone: 'focus' },
        ],
        markers: [
          { index: 8, price: 2335.4, label: { en: 'Entry', zh: '进场' }, tone: 'bull' },
          { index: 14, price: 2338.7, label: { en: 'Target from chart', zh: '目标来自图表' }, tone: 'info' },
        ],
      },
      drill: {
        type: 'plan-drill',
        title: { en: 'Coherent plan vs random numbers', zh: '自洽计划 vs 随机数字' },
        candles: buildCandles([
          2334.6, 2335.0, 2335.5, 2336.0, 2336.5, 2337.0, 2336.6, 2336.2, 2335.9, 2336.3,
          2336.8, 2337.3, 2337.8, 2338.2, 2338.6, 2338.9, 2339.2, 2339.5, 2339.7, 2339.9,
        ]),
        zones: [
          { from: 6, to: 10, top: 2336.8, bottom: 2335.8, label: { en: 'Logical pullback shelf', zh: '合理回踩平台' }, tone: 'bull' },
          { from: 13, to: 16, top: 2339.0, bottom: 2338.1, label: { en: 'Reasonable target zone', zh: '合理目标区' }, tone: 'focus' },
        ],
        markers: [
          { index: 8, price: 2336.0, label: { en: 'Stop should sit below shelf', zh: '止损应放平台下方' }, tone: 'warn' },
        ],
      },
      exam: {
        type: 'plan-exam',
        title: { en: 'One chart story, one trade plan', zh: '一套图表故事，对应一套计划' },
        candles: buildCandles([
          2333.8, 2334.3, 2334.9, 2335.4, 2335.9, 2336.5, 2337.0, 2337.5, 2337.1, 2336.7,
          2336.3, 2336.8, 2337.4, 2338.0, 2338.5, 2339.0, 2339.4, 2339.8, 2340.1, 2340.4,
        ]),
        zones: [
          { from: 7, to: 11, top: 2337.7, bottom: 2336.2, label: { en: 'Plan around this structure', zh: '围绕这段结构做计划' }, tone: 'bull' },
        ],
        markers: [
          { index: 9, price: 2336.5, label: { en: 'Entry / invalidation logic here', zh: '进场 / 失效逻辑在这里' }, tone: 'info' },
          { index: 14, price: 2338.7, label: { en: 'Target should be believable', zh: '目标要先说得通' }, tone: 'focus' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateNewsRisk(mode) {
    const variants = {
      intro: {
        type: 'news-intro',
        title: { en: 'Clean chart, risky timing', zh: '结构干净，不代表 timing 也干净' },
        candles: buildCandles([
          2337.2, 2337.7, 2338.1, 2338.6, 2339.0, 2339.5, 2340.0, 2339.6, 2339.1, 2339.4,
          2339.8, 2340.2, 2340.5, 2340.8, 2341.0, 2341.2, 2341.4, 2341.5, 2341.6, 2341.7,
        ]),
        zones: [
          { from: 7, to: 10, top: 2340.1, bottom: 2339.0, label: { en: 'Support still looks clean', zh: '支撑看起来仍很干净' }, tone: 'bull' },
        ],
        markers: [
          { index: 12, price: 2340.4, label: { en: 'But event risk is near', zh: '但事件风险就在附近' }, tone: 'warn' },
        ],
      },
      risk: {
        type: 'news-risk',
        title: { en: 'Volatility regime is changing', zh: '波动状态正在变化' },
        candles: buildCandles([
          2340.1, 2339.6, 2340.5, 2339.2, 2340.8, 2338.9, 2341.1, 2339.3, 2340.9, 2339.5,
          2340.7, 2339.7, 2340.6, 2339.8, 2340.5, 2339.9, 2340.4, 2340.0, 2340.3, 2340.1,
        ]),
        zones: [
          { from: 1, to: 14, top: 2341.3, bottom: 2338.8, label: { en: 'Two-sided event distortion', zh: '双向事件失真区' }, tone: 'warn' },
        ],
        markers: [
          { index: 6, price: 2341.0, label: { en: 'Normal stop logic degrades here', zh: '平时止损逻辑会变差' }, tone: 'warn' },
        ],
      },
      example: {
        type: 'news-example',
        title: { en: 'Bullish structure, bad timing', zh: '逻辑偏多，但 timing 很差' },
        candles: buildCandles([
          2336.8, 2337.3, 2337.9, 2338.4, 2339.0, 2339.5, 2340.0, 2339.6, 2339.2, 2339.7,
          2340.2, 2340.7, 2340.1, 2340.9, 2339.8, 2341.0, 2339.7, 2341.1, 2339.9, 2341.0,
        ]),
        zones: [
          { from: 5, to: 10, top: 2340.2, bottom: 2339.1, label: { en: 'Bullish structure shelf', zh: '偏多结构平台' }, tone: 'bull' },
          { from: 11, to: 18, top: 2341.2, bottom: 2339.6, label: { en: 'Pre-event distortion zone', zh: '数据前失真区' }, tone: 'warn' },
        ],
        markers: [
          { index: 8, price: 2339.5, label: { en: 'Good idea', zh: '逻辑没错' }, tone: 'bull' },
          { index: 14, price: 2339.9, label: { en: 'But poor timing', zh: '但 timing 很差' }, tone: 'warn' },
        ],
      },
      drill: {
        type: 'news-drill',
        title: { en: 'No-trade zone', zh: '不交易区' },
        candles: buildCandles([
          2338.4, 2339.0, 2339.6, 2340.2, 2339.3, 2340.5, 2339.0, 2340.7, 2338.9, 2340.8,
          2339.1, 2340.6, 2339.2, 2340.5, 2339.3, 2340.4, 2339.5, 2340.3, 2339.6, 2340.2,
        ]),
        zones: [
          { from: 0, to: 18, top: 2340.9, bottom: 2338.8, label: { en: 'Execution quality collapsed', zh: '执行质量已经塌了' }, tone: 'warn' },
        ],
        markers: [
          { index: 9, price: 2340.7, label: { en: 'Do not confuse clean level with clean conditions', zh: '别把好位置和好环境混为一谈' }, tone: 'info' },
        ],
      },
      exam: {
        type: 'news-exam',
        title: { en: 'Tradeable is not the same as readable', zh: '看得懂，不等于值得做' },
        candles: buildCandles([
          2337.0, 2337.5, 2338.0, 2338.5, 2339.1, 2339.6, 2340.1, 2340.6, 2339.8, 2340.9,
          2339.4, 2341.0, 2339.3, 2340.8, 2339.6, 2340.7, 2339.9, 2340.6, 2340.1, 2340.5,
        ]),
        zones: [
          { from: 4, to: 8, top: 2340.3, bottom: 2339.0, label: { en: 'Readable structure', zh: '结构仍可读' }, tone: 'bull' },
          { from: 8, to: 18, top: 2341.1, bottom: 2339.2, label: { en: 'But tradeability is poor', zh: '但可交易性很差' }, tone: 'warn' },
        ],
        markers: [
          { index: 7, price: 2340.4, label: { en: 'Structure can stay valid', zh: '结构可以还有效' }, tone: 'bull' },
          { index: 12, price: 2339.4, label: { en: 'Execution can still be wrong', zh: '执行仍可能不值得' }, tone: 'warn' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateBreakoutFalseBreakout(mode) {
    const variants = {
      intro: {
        type: 'breakout-intro',
        title: { en: 'Break first, hold second', zh: '先冲破，再看守不守得住' },
        candles: buildCandles([
          2335.8, 2335.4, 2335.1, 2334.8, 2334.6, 2334.9, 2335.3, 2335.7, 2336.1, 2336.6,
          2336.9, 2337.3, 2337.6, 2337.9, 2338.1, 2337.8, 2337.5, 2337.7, 2338.0, 2338.2,
        ]),
        zones: [
          { from: 6, to: 10, top: 2337.2, bottom: 2335.9, label: { en: 'Old resistance shelf', zh: '旧阻力平台' }, tone: 'focus' },
        ],
        markers: [
          { index: 12, price: 2337.7, label: { en: 'Break is visible', zh: '突破已经看得到' }, tone: 'bull' },
          { index: 16, price: 2337.4, label: { en: 'Now ask: accepted?', zh: '现在要问：有被接受吗？' }, tone: 'info' },
        ],
      },
      acceptance: {
        type: 'breakout-acceptance',
        title: { en: 'Accepted breakout', zh: '被接受的突破' },
        candles: buildCandles([
          2334.9, 2335.1, 2335.4, 2335.8, 2336.2, 2336.6, 2337.0, 2337.4, 2337.8, 2338.2,
          2337.7, 2337.9, 2338.4, 2338.9, 2339.3, 2339.7, 2340.0, 2340.3, 2340.5, 2340.8,
        ]),
        zones: [
          { from: 7, to: 11, top: 2338.0, bottom: 2337.2, label: { en: 'Retest hold above breakout', zh: '突破后回测守住' }, tone: 'bull' },
        ],
        markers: [
          { index: 9, price: 2338.1, label: { en: 'Strong close', zh: '收盘有力' }, tone: 'bull' },
          { index: 12, price: 2338.2, label: { en: 'Acceptance here', zh: '接受度出现在这里' }, tone: 'info' },
        ],
      },
      false: {
        type: 'breakout-false',
        title: { en: 'Trap after the break', zh: '突破后的陷阱' },
        candles: buildCandles([
          2335.1, 2335.4, 2335.7, 2336.1, 2336.5, 2336.9, 2337.3, 2337.7, 2338.2, 2338.6,
          2337.5, 2336.8, 2336.1, 2335.6, 2335.2, 2335.5, 2335.3, 2335.1, 2335.0, 2334.8,
        ]),
        zones: [
          { from: 7, to: 10, top: 2338.4, bottom: 2337.2, label: { en: 'Could not hold new ground', zh: '新区间守不住' }, tone: 'bear' },
        ],
        markers: [
          { index: 9, price: 2338.5, label: { en: 'Late buyers trapped', zh: '晚追买盘被困' }, tone: 'warn' },
          { index: 12, price: 2336.1, label: { en: 'Back into old range', zh: '滑回旧区间' }, tone: 'bear' },
        ],
      },
      drill: {
        type: 'breakout-drill',
        title: { en: 'Acceptance failed fast', zh: '接受度很快失败' },
        candles: buildCandles([
          2336.0, 2336.3, 2336.7, 2337.0, 2337.4, 2337.8, 2338.1, 2338.4, 2338.7, 2338.2,
          2337.6, 2337.1, 2336.7, 2336.4, 2336.2, 2336.0, 2335.9, 2335.8, 2335.7, 2335.6,
        ]),
        zones: [
          { from: 6, to: 8, top: 2338.8, bottom: 2337.9, label: { en: 'Breakout looked good first', zh: '一开始看起来像真突破' }, tone: 'focus' },
        ],
        markers: [
          { index: 11, price: 2337.0, label: { en: 'But failed hold matters more', zh: '但守不住更关键' }, tone: 'warn' },
        ],
      },
      exam: {
        type: 'breakout-exam',
        title: { en: 'Expansion vs acceptance', zh: '扩张 vs 接受度' },
        candles: buildCandles([
          2334.7, 2335.1, 2335.6, 2336.0, 2336.4, 2336.8, 2337.2, 2337.7, 2338.1, 2338.5,
          2338.0, 2338.2, 2338.7, 2339.2, 2339.6, 2340.0, 2340.2, 2340.4, 2340.6, 2340.8,
        ]),
        zones: [
          { from: 7, to: 11, top: 2338.4, bottom: 2337.5, label: { en: 'This shelf must hold', zh: '这个平台必须守住' }, tone: 'bull' },
        ],
        markers: [
          { index: 9, price: 2338.4, label: { en: 'Breakout alone is not enough', zh: '只突破还不够' }, tone: 'info' },
          { index: 12, price: 2338.6, label: { en: 'Continuation earns trust', zh: '后续延续才赢得信任' }, tone: 'bull' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStatePullbackContinuation(mode) {
    const variants = {
      intro: {
        type: 'pullback-intro',
        title: { en: 'Not every dip is healthy', zh: '不是每个回调都健康' },
        candles: buildCandles([
          2332.8, 2333.2, 2333.7, 2334.3, 2334.9, 2335.5, 2336.0, 2336.5, 2337.0, 2337.4,
          2337.0, 2336.7, 2336.5, 2336.8, 2337.2, 2337.6, 2338.0, 2338.3, 2338.6, 2338.9,
        ]),
        zones: [
          { from: 9, to: 13, top: 2337.4, bottom: 2336.4, label: { en: 'Dip to evaluate', zh: '需要判断的回调' }, tone: 'focus' },
        ],
        markers: [
          { index: 11, price: 2336.7, label: { en: 'Cheap is not enough', zh: '便宜还不够' }, tone: 'warn' },
        ],
      },
      healthy: {
        type: 'pullback-healthy',
        title: { en: 'Controlled continuation pullback', zh: '受控的延续回调' },
        candles: buildCandles([
          2331.7, 2332.2, 2332.8, 2333.4, 2334.0, 2334.7, 2335.4, 2336.0, 2336.6, 2337.1,
          2336.7, 2336.4, 2336.2, 2336.5, 2336.9, 2337.4, 2337.9, 2338.3, 2338.7, 2339.1,
        ]),
        zones: [
          { from: 9, to: 13, top: 2337.0, bottom: 2336.1, label: { en: 'Healthy pullback support', zh: '健康回调支撑区' }, tone: 'bull' },
        ],
        markers: [
          { index: 8, price: 2336.6, label: { en: 'Impulse leg first', zh: '先有一段推动' }, tone: 'bull' },
          { index: 13, price: 2336.4, label: { en: 'Structure still intact', zh: '结构仍完整' }, tone: 'info' },
        ],
      },
      danger: {
        type: 'pullback-danger',
        title: { en: 'Deep pullback damaging structure', zh: '深回调正在伤害结构' },
        candles: buildCandles([
          2332.0, 2332.6, 2333.2, 2333.8, 2334.5, 2335.2, 2335.9, 2336.6, 2337.2, 2337.7,
          2337.0, 2336.3, 2335.7, 2335.1, 2334.6, 2334.9, 2335.2, 2335.5, 2335.7, 2335.8,
        ]),
        zones: [
          { from: 10, to: 15, top: 2336.9, bottom: 2334.5, label: { en: 'Too deep / poor reclaim', zh: '太深 / 收回偏弱' }, tone: 'bear' },
        ],
        markers: [
          { index: 13, price: 2335.1, label: { en: 'Last support lost', zh: '最近支撑已丢失' }, tone: 'bear' },
        ],
      },
      drill: {
        type: 'pullback-drill',
        title: { en: 'Continuation or damage?', zh: '是延续还是受损？' },
        candles: buildCandles([
          2333.0, 2333.5, 2334.1, 2334.7, 2335.2, 2335.8, 2336.4, 2337.0, 2337.5, 2337.9,
          2337.2, 2336.6, 2336.0, 2335.5, 2335.1, 2335.3, 2335.5, 2335.7, 2335.8, 2335.9,
        ]),
        zones: [
          { from: 10, to: 15, top: 2337.2, bottom: 2335.0, label: { en: 'Question this pullback', zh: '这个回调要特别审视' }, tone: 'warn' },
        ],
        markers: [
          { index: 14, price: 2335.1, label: { en: 'Too much damage', zh: '破坏已经偏大' }, tone: 'warn' },
        ],
      },
      exam: {
        type: 'pullback-exam',
        title: { en: 'Continuation must stay efficient', zh: '延续必须保持效率' },
        candles: buildCandles([
          2332.4, 2332.9, 2333.5, 2334.1, 2334.7, 2335.3, 2335.9, 2336.5, 2337.0, 2337.5,
          2337.1, 2336.8, 2336.6, 2336.9, 2337.3, 2337.8, 2338.2, 2338.6, 2338.9, 2339.2,
        ]),
        zones: [
          { from: 9, to: 13, top: 2337.4, bottom: 2336.5, label: { en: 'Constructive reset zone', zh: '建设性重置区' }, tone: 'bull' },
        ],
        markers: [
          { index: 12, price: 2336.7, label: { en: 'Better continuation area', zh: '更好的延续位置' }, tone: 'info' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateSessionBehaviour(mode) {
    const variants = {
      intro: {
        type: 'session-intro',
        title: { en: 'Thin drift versus active participation', zh: '薄时段漂移 vs 活跃参与' },
        candles: buildCandles([
          2336.2, 2336.3, 2336.5, 2336.6, 2336.8, 2336.9, 2337.0, 2337.2, 2337.3, 2337.5,
          2337.0, 2336.6, 2336.3, 2336.1, 2336.0, 2336.2, 2336.5, 2336.9, 2337.2, 2337.4,
        ]),
        zones: [
          { from: 0, to: 8, top: 2337.4, bottom: 2336.1, label: { en: 'Thin-session drift', zh: '薄时段慢漂' }, tone: 'muted' },
          { from: 9, to: 14, top: 2337.6, bottom: 2335.9, label: { en: 'Active-session reset', zh: '活跃时段重定价' }, tone: 'focus' },
        ],
        markers: [
          { index: 10, price: 2337.0, label: { en: 'Clock changed the tape', zh: '时钟改变了盘面' }, tone: 'info' },
        ],
      },
      'london-ny': {
        type: 'session-london-ny',
        title: { en: 'London expansion, New York decision', zh: '伦敦扩张，纽约定性' },
        candles: buildCandles([
          2334.9, 2335.1, 2335.4, 2335.8, 2336.2, 2336.7, 2337.2, 2337.8, 2338.3, 2338.8,
          2338.4, 2338.1, 2337.8, 2338.2, 2338.7, 2339.1, 2339.5, 2339.8, 2340.0, 2340.2,
        ]),
        zones: [
          { from: 2, to: 8, top: 2338.2, bottom: 2335.3, label: { en: 'London impulse', zh: '伦敦推动段' }, tone: 'bull' },
          { from: 10, to: 14, top: 2338.5, bottom: 2337.7, label: { en: 'New York retest decision', zh: '纽约回测决策区' }, tone: 'focus' },
        ],
        markers: [
          { index: 7, price: 2337.7, label: { en: 'Active expansion', zh: '活跃扩张' }, tone: 'bull' },
          { index: 13, price: 2338.1, label: { en: 'US flow decides follow-through', zh: '美盘资金决定是否延续' }, tone: 'info' },
        ],
      },
      overlap: {
        type: 'session-overlap',
        title: { en: 'Overlap can amplify both edge and chaos', zh: '重叠时段会同时放大优势与混乱' },
        candles: buildCandles([
          2335.7, 2336.1, 2336.6, 2337.0, 2337.5, 2338.0, 2338.5, 2338.9, 2339.3, 2339.8,
          2339.1, 2338.6, 2338.2, 2338.7, 2339.3, 2339.9, 2340.4, 2340.8, 2341.1, 2341.3,
        ]),
        zones: [
          { from: 6, to: 10, top: 2339.8, bottom: 2338.8, label: { en: 'Overlap shock zone', zh: '重叠时段冲击区' }, tone: 'warn' },
        ],
        markers: [
          { index: 9, price: 2339.8, label: { en: 'Fresh US information can hit here', zh: '新的美国信息可能在这里进场' }, tone: 'warn' },
          { index: 14, price: 2339.2, label: { en: 'Only then decide continuation or reversal', zh: '这之后才决定延续还是反转' }, tone: 'info' },
        ],
      },
      drill: {
        type: 'session-drill',
        title: { en: 'Thin move versus real move', zh: '薄市场走势 vs 真正推动' },
        candles: buildCandles([
          2336.0, 2336.1, 2336.3, 2336.5, 2336.6, 2336.8, 2337.0, 2337.1, 2337.2, 2337.3,
          2336.8, 2336.3, 2335.9, 2335.7, 2335.6, 2335.8, 2336.0, 2336.3, 2336.6, 2336.8,
        ]),
        zones: [
          { from: 0, to: 8, top: 2337.3, bottom: 2336.0, label: { en: 'Sleepy drift', zh: '昏睡慢漂' }, tone: 'muted' },
          { from: 9, to: 14, top: 2337.3, bottom: 2335.5, label: { en: 'Active-session rejection', zh: '活跃时段拒绝' }, tone: 'bear' },
        ],
        markers: [
          { index: 12, price: 2335.9, label: { en: 'This reaction deserves more weight', zh: '这个反应更有分量' }, tone: 'warn' },
        ],
      },
      exam: {
        type: 'session-exam',
        title: { en: 'Match setup to session quality', zh: '让 setup 对上 session 质量' },
        candles: buildCandles([
          2335.2, 2335.6, 2336.0, 2336.5, 2337.0, 2337.4, 2337.8, 2338.2, 2338.6, 2339.0,
          2338.6, 2338.3, 2338.1, 2338.5, 2338.9, 2339.3, 2339.7, 2340.0, 2340.3, 2340.5,
        ]),
        zones: [
          { from: 2, to: 8, top: 2338.5, bottom: 2335.8, label: { en: 'Strong session-led move', zh: '强势 session 推动' }, tone: 'bull' },
          { from: 10, to: 13, top: 2338.8, bottom: 2338.0, label: { en: 'Retest in active flow', zh: '活跃订单流里的回测' }, tone: 'focus' },
        ],
        markers: [
          { index: 11, price: 2338.2, label: { en: 'Timing is part of quality', zh: '时间本身就是质量的一部分' }, tone: 'info' },
        ],
      },
    };

    return variants[mode] || variants.intro;
  }

  function createChartStateVolatilityRegime(mode) {
    const variants = {
      intro: {
        type: 'volatility-intro',
        title: { en: 'Same chart, different regime', zh: '同样图形，不同波动状态' },
        candles: buildCandles([2335.0, 2335.4, 2335.8, 2336.2, 2336.6, 2337.0, 2337.4, 2337.0, 2336.7, 2337.1, 2337.5, 2337.9, 2338.3, 2338.6, 2338.9, 2339.1, 2339.3, 2339.5, 2339.6, 2339.8]),
        zones: [{ from: 6, to: 10, top: 2337.5, bottom: 2336.6, label: { en: 'Normal pullback zone', zh: '正常回踩区' }, tone: 'focus' }],
        markers: [{ index: 14, price: 2338.9, label: { en: 'Looks similar, trades differently', zh: '看起来像，但交易方式不同' }, tone: 'info' }],
      },
      atr: {
        type: 'volatility-atr',
        title: { en: 'ATR expansion changes assumptions', zh: 'ATR 放大，假设也要跟着变' },
        candles: buildCandles([2334.8, 2335.6, 2334.9, 2336.1, 2335.0, 2336.5, 2335.3, 2336.9, 2335.8, 2337.2, 2336.1, 2337.5, 2336.4, 2337.8, 2336.8, 2338.0, 2337.1, 2338.2, 2337.4, 2338.4]),
        zones: [{ from: 2, to: 14, top: 2338.0, bottom: 2335.0, label: { en: 'Expanded candle range', zh: '蜡烛波幅已放大' }, tone: 'warn' }],
        markers: [{ index: 10, price: 2336.2, label: { en: 'Old stop logic too tight', zh: '旧止损逻辑太紧' }, tone: 'warn' }],
      },
      example: {
        type: 'volatility-example',
        title: { en: 'Volatility rose, target did not', zh: '波动变大，但目标空间没变大' },
        candles: buildCandles([2336.0, 2336.8, 2336.1, 2337.0, 2336.2, 2337.3, 2336.4, 2337.5, 2336.7, 2337.8, 2336.9, 2338.0, 2337.2, 2338.2, 2337.4, 2338.3, 2337.6, 2338.4, 2337.8, 2338.5]),
        zones: [
          { from: 1, to: 14, top: 2338.3, bottom: 2336.1, label: { en: 'Bigger noise environment', zh: '更大的噪音环境' }, tone: 'warn' },
          { from: 15, to: 18, top: 2338.5, bottom: 2337.8, label: { en: 'Target room still limited', zh: '目标空间仍有限' }, tone: 'focus' },
        ],
        markers: [{ index: 8, price: 2336.7, label: { en: 'Size must adapt', zh: '仓位必须适配' }, tone: 'info' }],
      },
      drill: {
        type: 'volatility-drill',
        title: { en: 'Poor asymmetry under high ATR', zh: '高 ATR 下的不良不对称性' },
        candles: buildCandles([2335.4, 2336.2, 2335.5, 2336.4, 2335.6, 2336.6, 2335.7, 2336.8, 2335.8, 2337.0, 2335.9, 2337.1, 2336.0, 2337.2, 2336.1, 2337.2, 2336.2, 2337.3, 2336.3, 2337.3]),
        zones: [{ from: 0, to: 15, top: 2337.2, bottom: 2335.5, label: { en: 'High-noise regime', zh: '高噪音波动状态' }, tone: 'warn' }],
        markers: [{ index: 12, price: 2336.0, label: { en: 'Adapt or pass', zh: '适配或放弃' }, tone: 'warn' }],
      },
      exam: {
        type: 'volatility-exam',
        title: { en: 'Match size to environment', zh: '让仓位匹配环境' },
        candles: buildCandles([2334.9, 2335.5, 2335.0, 2335.9, 2335.2, 2336.3, 2335.5, 2336.7, 2335.9, 2337.1, 2336.3, 2337.4, 2336.6, 2337.7, 2336.9, 2337.9, 2337.1, 2338.1, 2337.3, 2338.2]),
        zones: [{ from: 5, to: 13, top: 2337.6, bottom: 2335.4, label: { en: 'Regime-aware stop zone', zh: '适配波动后的止损区' }, tone: 'focus' }],
        markers: [{ index: 14, price: 2336.9, label: { en: 'Good process adapts here', zh: '好流程会在这里适配' }, tone: 'info' }],
      },
    };
    return variants[mode] || variants.intro;
  }

  function createChartStateSupplyDemand(mode) {
    const variants = {
      intro: {
        type: 'sd-intro',
        title: { en: 'Label vs live reaction', zh: '标签 vs 实际反应' },
        candles: buildCandles([2338.0, 2337.5, 2337.1, 2336.8, 2336.4, 2336.1, 2336.5, 2337.0, 2337.5, 2338.0, 2338.3, 2338.6, 2338.9, 2338.5, 2338.1, 2337.8, 2338.0, 2338.3, 2338.5, 2338.7]),
        zones: [{ from: 5, to: 9, top: 2338.0, bottom: 2336.2, label: { en: 'Demand box drawn here', zh: '这里画了需求区' }, tone: 'focus' }],
        markers: [{ index: 11, price: 2338.6, label: { en: 'Reaction quality decides value', zh: '反应质量才决定价值' }, tone: 'info' }],
      },
      quality: {
        type: 'sd-quality',
        title: { en: 'Strong reaction with displacement', zh: '有位移的强反应' },
        candles: buildCandles([2338.4, 2338.0, 2337.6, 2337.2, 2336.8, 2336.4, 2336.8, 2337.4, 2338.1, 2338.8, 2339.4, 2339.9, 2340.3, 2340.6, 2340.8, 2341.0, 2341.1, 2341.2, 2341.3, 2341.4]),
        zones: [{ from: 4, to: 7, top: 2337.6, bottom: 2336.3, label: { en: 'Demand reacted hard', zh: '需求区反应有力' }, tone: 'bull' }],
        markers: [{ index: 8, price: 2338.1, label: { en: 'Displacement confirms quality', zh: '位移确认质量' }, tone: 'bull' }],
      },
      example: {
        type: 'sd-example',
        title: { en: 'Consumed zone', zh: '被消耗的区域' },
        candles: buildCandles([2339.0, 2338.5, 2338.1, 2337.8, 2337.5, 2337.9, 2337.6, 2337.9, 2337.7, 2337.9, 2337.8, 2338.0, 2337.7, 2337.9, 2337.6, 2337.8, 2337.4, 2337.2, 2337.0, 2336.8]),
        zones: [{ from: 3, to: 15, top: 2338.0, bottom: 2337.4, label: { en: 'Repeatedly tested demand', zh: '被反复测试的需求区' }, tone: 'warn' }],
        markers: [{ index: 17, price: 2337.2, label: { en: 'Reaction faded over time', zh: '反应越来越弱' }, tone: 'warn' }],
      },
      drill: {
        type: 'sd-drill',
        title: { en: 'Count the quality, not just the touches', zh: '数质量，不只是数触碰次数' },
        candles: buildCandles([2338.7, 2338.2, 2337.8, 2337.5, 2337.2, 2337.6, 2337.3, 2337.6, 2337.4, 2337.6, 2337.5, 2337.7, 2337.4, 2337.6, 2337.3, 2337.5, 2337.1, 2336.9, 2336.7, 2336.5]),
        zones: [{ from: 3, to: 16, top: 2337.8, bottom: 2337.2, label: { en: 'Zone being consumed', zh: '区域正在被消耗' }, tone: 'warn' }],
        markers: [{ index: 18, price: 2336.7, label: { en: 'Break comes after weak bounces', zh: '弱反弹后最终破位' }, tone: 'bear' }],
      },
      exam: {
        type: 'sd-exam',
        title: { en: 'Read freshness and force', zh: '读新鲜度与力量' },
        candles: buildCandles([2338.9, 2338.4, 2338.0, 2337.6, 2337.2, 2336.9, 2337.4, 2338.0, 2338.7, 2339.3, 2339.9, 2340.4, 2340.7, 2341.0, 2341.2, 2341.4, 2341.5, 2341.6, 2341.7, 2341.8]),
        zones: [{ from: 4, to: 8, top: 2338.4, bottom: 2336.8, label: { en: 'Fresh demand / strong response', zh: '新鲜需求区 / 强反应' }, tone: 'bull' }],
        markers: [{ index: 9, price: 2339.3, label: { en: 'Respect this more than labels', zh: '这比标签更值得尊重' }, tone: 'info' }],
      },
    };
    return variants[mode] || variants.intro;
  }

  function createChartStateConfluence(mode) {
    const variants = {
      intro: {
        type: 'confluence-intro',
        title: { en: 'A few aligned reasons', zh: '少数但对齐的理由' },
        candles: buildCandles([2334.8, 2335.2, 2335.7, 2336.1, 2336.5, 2336.9, 2337.3, 2337.7, 2338.0, 2337.6, 2337.2, 2337.5, 2337.9, 2338.3, 2338.7, 2339.0, 2339.3, 2339.5, 2339.7, 2339.9]),
        zones: [{ from: 7, to: 11, top: 2338.0, bottom: 2337.2, label: { en: 'Support + bias + timing', zh: '支撑 + 偏向 + timing' }, tone: 'bull' }],
        markers: [{ index: 12, price: 2337.9, label: { en: 'Useful confluence', zh: '有用的共振' }, tone: 'info' }],
      },
      quality: {
        type: 'confluence-quality',
        title: { en: 'Independent layers, not duplicates', zh: '独立层次，而不是重复堆叠' },
        candles: buildCandles([2335.1, 2335.5, 2336.0, 2336.4, 2336.8, 2337.2, 2337.6, 2337.3, 2337.0, 2337.4, 2337.8, 2338.3, 2338.7, 2339.0, 2339.3, 2339.6, 2339.8, 2340.0, 2340.2, 2340.4]),
        zones: [{ from: 6, to: 10, top: 2337.8, bottom: 2336.9, label: { en: 'Different layers align here', zh: '不同层次在这里对齐' }, tone: 'focus' }],
        markers: [{ index: 9, price: 2337.4, label: { en: 'Each layer adds something new', zh: '每一层都在补新信息' }, tone: 'info' }],
      },
      example: {
        type: 'confluence-example',
        title: { en: 'Too many filters, too little edge', zh: '过滤太多，优势太少' },
        candles: buildCandles([2336.0, 2336.3, 2336.7, 2337.0, 2337.4, 2337.7, 2338.0, 2338.3, 2338.5, 2338.2, 2337.9, 2338.1, 2338.4, 2338.6, 2338.8, 2339.0, 2339.1, 2339.2, 2339.3, 2339.4]),
        zones: [{ from: 7, to: 10, top: 2338.5, bottom: 2337.9, label: { en: 'Core setup already aligned', zh: '核心 setup 已经对齐' }, tone: 'bull' }],
        markers: [{ index: 12, price: 2338.4, label: { en: 'Extra filters add little', zh: '额外过滤加分很少' }, tone: 'warn' }],
      },
      drill: {
        type: 'confluence-drill',
        title: { en: 'Robust or overfit?', zh: '稳健还是过拟合？' },
        candles: buildCandles([2335.6, 2336.0, 2336.5, 2336.9, 2337.3, 2337.7, 2338.1, 2337.8, 2337.5, 2337.9, 2338.2, 2338.6, 2338.9, 2339.1, 2339.3, 2339.5, 2339.6, 2339.7, 2339.8, 2339.9]),
        zones: [{ from: 6, to: 10, top: 2338.2, bottom: 2337.4, label: { en: 'Enough alignment already', zh: '已经有足够对齐' }, tone: 'focus' }],
        markers: [{ index: 11, price: 2338.6, label: { en: 'Do not keep adding excuses', zh: '不要继续往上加借口' }, tone: 'warn' }],
      },
      exam: {
        type: 'confluence-exam',
        title: { en: 'Clarity beats complexity', zh: '清晰胜过复杂' },
        candles: buildCandles([2334.9, 2335.3, 2335.8, 2336.2, 2336.6, 2337.0, 2337.4, 2337.8, 2338.1, 2337.8, 2337.6, 2338.0, 2338.4, 2338.8, 2339.1, 2339.4, 2339.6, 2339.8, 2340.0, 2340.2]),
        zones: [{ from: 7, to: 11, top: 2338.1, bottom: 2337.5, label: { en: 'Robust alignment zone', zh: '稳健对齐区' }, tone: 'bull' }],
        markers: [{ index: 12, price: 2338.4, label: { en: 'Confluence should simplify action', zh: '共振应该简化行动' }, tone: 'info' }],
      },
    };
    return variants[mode] || variants.intro;
  }

  function createChartStateTradeManagement(mode) {
    const variants = {
      intro: {
        type: 'management-intro',
        title: { en: 'The trade begins after entry', zh: '交易在进场后才真正开始' },
        candles: buildCandles([2333.9, 2334.4, 2334.9, 2335.4, 2335.8, 2336.2, 2336.6, 2337.0, 2337.4, 2337.1, 2336.8, 2337.2, 2337.6, 2337.9, 2338.2, 2338.5, 2338.7, 2338.9, 2339.1, 2339.3]),
        zones: [{ from: 8, to: 12, top: 2337.6, bottom: 2336.7, label: { en: 'Management decisions begin here', zh: '这里开始进入管理决策' }, tone: 'focus' }],
        markers: [{ index: 13, price: 2337.9, label: { en: 'Entry was only step one', zh: '进场只是第一步' }, tone: 'info' }],
      },
      management: {
        type: 'management-logic',
        title: { en: 'Follow structure, not fear', zh: '跟结构走，不跟恐惧走' },
        candles: buildCandles([2334.2, 2334.8, 2335.3, 2335.8, 2336.3, 2336.8, 2337.2, 2337.6, 2338.0, 2337.7, 2337.4, 2337.8, 2338.2, 2338.5, 2338.8, 2339.0, 2339.2, 2339.4, 2339.5, 2339.6]),
        zones: [{ from: 8, to: 12, top: 2338.1, bottom: 2337.3, label: { en: 'Move stop only for structural reason', zh: '只因结构原因再动止损' }, tone: 'focus' }],
        markers: [{ index: 10, price: 2337.4, label: { en: 'Do not tighten from emotion', zh: '不要因情绪乱收紧' }, tone: 'warn' }],
      },
      review: {
        type: 'management-review',
        title: { en: 'Review the lifecycle, not only PnL', zh: '复盘整段生命周期，不只看盈亏' },
        candles: buildCandles([2335.0, 2335.5, 2336.0, 2336.4, 2336.9, 2337.4, 2337.9, 2338.3, 2338.7, 2338.2, 2337.8, 2338.1, 2338.5, 2338.8, 2339.0, 2339.2, 2339.3, 2339.4, 2339.5, 2339.6]),
        zones: [{ from: 8, to: 13, top: 2338.7, bottom: 2337.8, label: { en: 'Management choices changed outcome here', zh: '管理选择在这里改变了结果' }, tone: 'focus' }],
        markers: [{ index: 12, price: 2338.5, label: { en: 'Review process, not just result', zh: '复盘流程，不只复盘结果' }, tone: 'info' }],
      },
      drill: {
        type: 'management-drill',
        title: { en: 'Process error zone', zh: '流程错误区' },
        candles: buildCandles([2335.1, 2335.7, 2336.2, 2336.7, 2337.1, 2337.6, 2338.0, 2338.4, 2338.1, 2337.7, 2337.2, 2336.8, 2336.4, 2336.1, 2335.9, 2335.7, 2335.6, 2335.5, 2335.4, 2335.3]),
        zones: [{ from: 8, to: 15, top: 2338.2, bottom: 2335.8, label: { en: 'Execution discipline failed', zh: '执行纪律在这里失败' }, tone: 'warn' }],
        markers: [{ index: 13, price: 2336.1, label: { en: 'This is process damage', zh: '这里是流程损伤' }, tone: 'warn' }],
      },
      exam: {
        type: 'management-exam',
        title: { en: 'Process compounds edge', zh: '流程会放大优势' },
        candles: buildCandles([2334.8, 2335.3, 2335.8, 2336.3, 2336.8, 2337.2, 2337.6, 2338.0, 2338.4, 2338.1, 2337.9, 2338.2, 2338.6, 2338.9, 2339.2, 2339.4, 2339.6, 2339.8, 2340.0, 2340.1]),
        zones: [{ from: 9, to: 13, top: 2338.6, bottom: 2337.9, label: { en: 'Good management preserves edge', zh: '好的管理会保住优势' }, tone: 'bull' }],
        markers: [{ index: 14, price: 2339.2, label: { en: 'Strong process lives here', zh: '强流程在这里体现' }, tone: 'info' }],
      },
    };
    return variants[mode] || variants.intro;
  }

  function buildCandles(values) {
    const candles = [];
    for (let i = 0; i < values.length - 1; i += 1) {
      const open = values[i];
      const close = values[i + 1];
      const high = Math.max(open, close) + (0.35 + ((i % 3) * 0.12));
      const low = Math.min(open, close) - (0.32 + (((i + 1) % 3) * 0.14));
      candles.push({ open, high, low, close });
    }
    return candles;
  }

  function buildXauMoveQuestionBank() {
    const scenarios = [
      {
        id: 'xau-1',
        difficulty: 'foundation',
        conceptTag: 'macro-bias',
        situation: {
          en: 'US yields cool after CPI, DXY is slipping, and gold holds above the Asia high into London.',
          zh: 'CPI 后美国收益率回落，DXY 转弱，而黄金在伦敦盘守在亚洲高点之上。',
        },
        bestRead: {
          en: 'Bias stays bullish, but you still wait for a clean pullback structure before entry.',
          zh: '偏向仍偏多，但进场前还是要等一个干净的回踩结构。',
        },
        driver: {
          en: 'Softer yields and a weaker dollar are removing pressure from gold.',
          zh: '收益率回落加上美元转弱，正在减轻黄金压力。',
        },
        trap: {
          en: 'Shorting only because the move already looks extended.',
          zh: '只是因为涨太多了，就直接逆势做空。',
        },
        confirmation: {
          en: 'Check whether the retest above Asia high still holds during London.',
          zh: '确认伦敦盘里，亚洲高点上方的回踩是否还守得住。',
        },
      },
      {
        id: 'xau-2',
        difficulty: 'foundation',
        conceptTag: 'session-timing',
        situation: {
          en: 'Asia is quiet, but London opens with heavy buying while DXY cannot bounce.',
          zh: '亚洲盘很安静，但伦敦一开就出现强买盘，而 DXY 也弹不起来。',
        },
        bestRead: {
          en: 'The active session is giving the bullish bias more credibility, so wait for continuation structure.',
          zh: '活跃时段让这段多头偏向更有可信度，所以应该等延续结构。',
        },
        driver: {
          en: 'Liquidity arriving during London can turn a quiet bias into real expansion.',
          zh: '伦敦流动性进场后，原本安静的偏向可能会被放大成真正的扩张。',
        },
        trap: {
          en: 'Ignoring the session shift and assuming the market will stay sleepy.',
          zh: '忽略时段切换，还以为市场会继续死气沉沉。',
        },
        confirmation: {
          en: 'Watch whether higher lows keep printing after the London impulse.',
          zh: '观察伦敦推动后，价格有没有继续抬高低点。',
        },
      },
      {
        id: 'xau-3',
        difficulty: 'foundation',
        conceptTag: 'news-risk',
        situation: {
          en: 'Gold looks strong, but CPI is fifteen minutes away and volatility has already widened sharply.',
          zh: '黄金看起来很强，但十五分钟后就是 CPI，而且波动已经明显放大。',
        },
        bestRead: {
          en: 'Bias may still be bullish, but execution quality is weak right before a major release.',
          zh: '偏向可能还是偏多，但在重大数据前，执行质量会明显变差。',
        },
        driver: {
          en: 'Event risk can distort even a clean chart right before the release.',
          zh: '重大事件风险会在公布前把再干净的图也扭曲掉。',
        },
        trap: {
          en: 'Pretending the upcoming data does not matter because the candles look nice.',
          zh: '因为K线好看，就假装即将公布的数据不重要。',
        },
        confirmation: {
          en: 'Check whether you even want exposure before the event instead of forcing a trade.',
          zh: '先确认你是否真的想在数据前持仓，而不是硬要找单。',
        },
      },
      {
        id: 'xau-4',
        difficulty: 'foundation',
        conceptTag: 'dollar-strength',
        situation: {
          en: 'DXY reclaims strength, yields tick higher, and gold fails twice near intraday resistance.',
          zh: 'DXY 收回强势、收益率往上顶，而黄金在日内阻力附近连续两次冲不过去。',
        },
        bestRead: {
          en: 'Bullish gold ideas deserve less trust because macro pressure is pushing the other way.',
          zh: '黄金多头想法要更保守，因为宏观压力正往反方向推。',
        },
        driver: {
          en: 'A firmer dollar and stronger yields can lean against gold upside.',
          zh: '美元走强、收益率抬升，都会压制黄金上行。',
        },
        trap: {
          en: 'Buying just because gold dipped into a familiar support line once.',
          zh: '只是因为黄金碰到一个熟悉支撑线，就直接去买。',
        },
        confirmation: {
          en: 'Check whether sellers keep defending intraday highs after each bounce.',
          zh: '确认每次反弹后，卖方是否还继续守住日内高点。',
        },
      },
      {
        id: 'xau-5',
        difficulty: 'foundation',
        conceptTag: 'real-yields',
        situation: {
          en: 'Real yields are falling while gold grinds higher without sharp rejection from London supply.',
          zh: '真实收益率在走低，而黄金缓慢抬高，伦敦阻力区也没有出现明显压回。',
        },
        bestRead: {
          en: 'The path of least resistance still leans higher, provided pullbacks remain controlled.',
          zh: '只要回踩还是受控的，阻力最小路径仍偏向上方。',
        },
        driver: {
          en: 'Falling real yields often make gold easier to support on dips.',
          zh: '真实收益率回落，通常会让黄金在回踩时更容易获得支撑。',
        },
        trap: {
          en: 'Calling every slow grind a fake move just because it is not explosive.',
          zh: '只因为涨得不暴力，就把每一段慢涨都当成假动作。',
        },
        confirmation: {
          en: 'Check whether pullbacks keep getting bought before prior support breaks.',
          zh: '看每次回踩是否都在跌破前支撑前就被买起来。',
        },
      },
      {
        id: 'xau-6',
        difficulty: 'foundation',
        conceptTag: 'session-timing',
        situation: {
          en: 'New York opens, yields bounce, and gold loses the level that London used as support.',
          zh: '纽约盘开出后，收益率反弹，黄金跌破了伦敦盘曾经守住的支撑位。',
        },
        bestRead: {
          en: 'The earlier bullish bias is weakening because the session handover changed the tape.',
          zh: '先前的多头偏向正在减弱，因为时段切换后盘面已经变了。',
        },
        driver: {
          en: 'A new active session can invalidate the earlier structure when macro pressure shifts.',
          zh: '当宏观压力变化时，新活跃时段可能会直接推翻前面的结构。',
        },
        trap: {
          en: 'Assuming London support must hold forever because it worked once.',
          zh: '以为伦敦支撑之前有效过一次，就会永远有效。',
        },
        confirmation: {
          en: 'Check whether price can reclaim the broken level or keeps accepting below it.',
          zh: '观察价格能否收回跌破的位置，还是继续在其下方接受。',
        },
      },
      {
        id: 'xau-7',
        difficulty: 'foundation',
        conceptTag: 'risk-off',
        situation: {
          en: 'Equity futures wobble, headlines turn risk-off, and gold holds firm despite only a modest dollar pullback.',
          zh: '股指期货转弱、避险新闻升温，而黄金即使在美元只小幅回落的情况下仍然很稳。',
        },
        bestRead: {
          en: 'Safe-haven demand may be helping gold, so fading strength without structure is dangerous.',
          zh: '避险需求可能正在支撑黄金，所以没有结构就去逆势，是危险的。',
        },
        driver: {
          en: 'Risk-off flows can support gold even when the dollar story is not the only driver.',
          zh: '就算不只看美元，避险资金流也可能支撑黄金。',
        },
        trap: {
          en: 'Ignoring the headline regime because it is not printed on the chart itself.',
          zh: '因为新闻没有直接画在图上，就完全忽略它。',
        },
        confirmation: {
          en: 'Check whether pullbacks stay shallow while risk-off headlines remain active.',
          zh: '确认在避险新闻仍然活跃时，回踩是不是继续偏浅。',
        },
      },
      {
        id: 'xau-8',
        difficulty: 'foundation',
        conceptTag: 'structure-confirmation',
        situation: {
          en: 'Gold rallies with macro support, but the last push into highs leaves a weak close and no clean retest yet.',
          zh: '黄金在宏观支持下上涨，但最后一段冲高收盘偏弱，而且还没有出现干净回踩。',
        },
        bestRead: {
          en: 'The bias can stay constructive, but execution should wait for structure to clean up.',
          zh: '偏向可以继续偏多，但执行上还是应该等结构整理清楚。',
        },
        driver: {
          en: 'Bias and execution quality are different decisions; a good backdrop does not erase messy structure.',
          zh: '偏向和执行质量是两回事；背景再好，也不能抹掉乱结构。',
        },
        trap: {
          en: 'Forcing entry just because the bigger story already sounds bullish.',
          zh: '因为大方向听起来偏多，就硬要立刻进场。',
        },
        confirmation: {
          en: 'Check whether price can retest and hold the breakout area instead of chasing the weak close.',
          zh: '看价格能否回踩并守住突破区，而不是去追那根收得不够强的K线。',
        },
      },
      {
        id: 'xau-9',
        difficulty: 'bridge',
        conceptTag: 'yield-spike',
        situation: {
          en: 'Treasury yields spike abruptly and gold loses momentum right as New York liquidity increases.',
          zh: '美债收益率突然急拉，而黄金在纽约流动性刚起来时就失去动能。',
        },
        bestRead: {
          en: 'Gold longs should be handled more defensively because the pressure regime just changed.',
          zh: '黄金多单要更防守，因为压力状态刚刚发生变化。',
        },
        driver: {
          en: 'A sudden yield spike can quickly change how much buyers can sustain.',
          zh: '收益率突然拉升，会很快改变买方还能撑多久。',
        },
        trap: {
          en: 'Holding the same bullish conviction as if the macro input never changed.',
          zh: '宏观输入都变了，却还维持完全一样的多头信念。',
        },
        confirmation: {
          en: 'Check whether buyers can still defend the last higher low after the yield spike.',
          zh: '看收益率拉升后，买方是否还能守住最近的更高低点。',
        },
      },
      {
        id: 'xau-10',
        difficulty: 'bridge',
        conceptTag: 'calendar-awareness',
        situation: {
          en: 'Gold is holding well, but FOMC later today means the current calm may not reflect the real volatility risk.',
          zh: '黄金目前守得不错，但今天稍后有 FOMC，眼前的平静未必代表真实波动风险。',
        },
        bestRead: {
          en: 'Today’s trade quality must be judged with event timing in mind, not just the current candles.',
          zh: '今天的交易质量必须把事件时间点算进去，不能只看眼前K线。',
        },
        driver: {
          en: 'Major scheduled events can reset the market even when pre-event structure looks orderly.',
          zh: '重大事件就算在公布前结构很整齐，也可能把市场重新洗牌。',
        },
        trap: {
          en: 'Treating pre-event calm as proof that the setup is safe.',
          zh: '把数据前的平静，当成 setup 安全的证明。',
        },
        confirmation: {
          en: 'Check whether you have enough edge to hold into the event at all.',
          zh: '先确认你是否真的有足够优势，要把仓位拿到事件公布。',
        },
      },
      {
        id: 'xau-11',
        difficulty: 'bridge',
        conceptTag: 'dxy-divergence',
        situation: {
          en: 'Gold stops rising even though DXY softens slightly, and yields are no longer falling.',
          zh: '就算 DXY 略微转弱，黄金也涨不动了，而且收益率也不再继续下滑。',
        },
        bestRead: {
          en: 'The bullish case is losing quality because not all supporting drivers are still aligned.',
          zh: '多头逻辑正在失去质量，因为原本的支持因素已经不再同向。',
        },
        driver: {
          en: 'When supportive drivers stop aligning, the move often loses its clean edge.',
          zh: '当支持因素不再一致时，走势通常会失去原本干净的优势。',
        },
        trap: {
          en: 'Seeing one small dollar dip and ignoring the rest of the context.',
          zh: '只看到美元小跌一下，就忽略了其他背景。',
        },
        confirmation: {
          en: 'Check whether price still builds higher lows or starts stalling under resistance.',
          zh: '看价格是不是还在抬高低点，还是开始在阻力下方停滞。',
        },
      },
      {
        id: 'xau-12',
        difficulty: 'bridge',
        conceptTag: 'intraday-structure',
        situation: {
          en: 'Gold reclaims the Asia high, holds it, and then forms another higher low during London.',
          zh: '黄金站回亚洲高点并守住，接着在伦敦盘又做出一个更高低点。',
        },
        bestRead: {
          en: 'That sequence supports continuation better than trying to fade the second push.',
          zh: '这个顺序更支持延续，而不是去逆着第二段上推。',
        },
        driver: {
          en: 'Reclaim plus hold plus higher low is a stronger continuation sequence than one breakout candle alone.',
          zh: '收回、守住、再抬高低点，这种顺序比单根突破K线更能支持延续。',
        },
        trap: {
          en: 'Calling the second push exhausted without respecting the structure that built it.',
          zh: '没有尊重形成这段走势的结构，就先说第二波已经没力。',
        },
        confirmation: {
          en: 'Check whether the higher low survives before price attacks the highs again.',
          zh: '确认再攻高前，这个更高低点有没有继续守住。',
        },
      },
      {
        id: 'xau-13',
        difficulty: 'bridge',
        conceptTag: 'session-shift',
        situation: {
          en: 'Asia sold off, but London completely reverses the move on stronger participation.',
          zh: '亚洲盘先跌，但伦敦盘在更强参与度下把整段走势完全反过来。',
        },
        bestRead: {
          en: 'The new active session deserves more weight than the thin overnight move.',
          zh: '新的活跃时段，应该比夜里较薄的走势更有分量。',
        },
        driver: {
          en: 'Session quality can matter as much as direction because active participation changes validity.',
          zh: '时段质量和方向一样重要，因为真实参与度会改变走势可信度。',
        },
        trap: {
          en: 'Sticking blindly to the Asia move just because it happened first.',
          zh: '只因为亚洲盘先走出来，就死抱着那段方向不放。',
        },
        confirmation: {
          en: 'Check whether London reclaim is holding rather than instantly fading back.',
          zh: '确认伦敦的收复动作是否站得稳，而不是立刻又缩回去。',
        },
      },
      {
        id: 'xau-14',
        difficulty: 'bridge',
        conceptTag: 'macro-conflict',
        situation: {
          en: 'Gold ticks higher, but DXY is also firm and yields are mixed, leaving no clean macro alignment.',
          zh: '黄金稍微抬高，但 DXY 也偏强，收益率又很混乱，整体没有干净的宏观共振。',
        },
        bestRead: {
          en: 'Your bias should stay softer because the move lacks clean macro sponsorship.',
          zh: '你的偏向应该更保守，因为这段走势缺少干净的宏观支持。',
        },
        driver: {
          en: 'When the supporting drivers conflict, conviction should usually come down.',
          zh: '支持因素彼此冲突时，信心通常就应该下降。',
        },
        trap: {
          en: 'Acting highly certain when the backdrop is obviously mixed.',
          zh: '在背景明明很混乱时，还表现得特别确定。',
        },
        confirmation: {
          en: 'Check whether the chart itself offers unusually strong structure before increasing conviction.',
          zh: '在提高信心前，先看图表本身是否给出异常强的结构。',
        },
      },
      {
        id: 'xau-15',
        difficulty: 'bridge',
        conceptTag: 'location',
        situation: {
          en: 'Gold is still bullish on context, but price is pushing directly into a major daily resistance shelf.',
          zh: '黄金背景仍偏多，但价格正直接顶进一个重要的日线阻力平台。',
        },
        bestRead: {
          en: 'Bullish bias survives, but the location makes fresh longs less attractive right here.',
          zh: '多头偏向还在，但这个位置会让此刻的新多单吸引力下降。',
        },
        driver: {
          en: 'Context matters, but location still decides whether the trade is efficient.',
          zh: '背景很重要，但真正决定交易是否高效的，还是位置。',
        },
        trap: {
          en: 'Thinking a bullish backdrop means every long entry is automatically good.',
          zh: '以为大背景偏多，就代表任何多单进场都是好位置。',
        },
        confirmation: {
          en: 'Check whether resistance gets accepted through or rejects price cleanly first.',
          zh: '先看阻力是被真正站稳突破，还是把价格干净压回去。',
        },
      },
      {
        id: 'xau-16',
        difficulty: 'bridge',
        conceptTag: 'usd-reset',
        situation: {
          en: 'The dollar bounces sharply after a policymaker comment and gold instantly loses its intraday bid.',
          zh: '一位官员讲话后，美元突然强弹，而黄金立刻失去日内买盘支撑。',
        },
        bestRead: {
          en: 'The prior bullish idea is under pressure and should be re-evaluated, not defended emotionally.',
          zh: '原本的多头想法已经受压，需要重新评估，而不是情绪化地死守。',
        },
        driver: {
          en: 'A policy-driven dollar reset can change intraday gold behaviour very quickly.',
          zh: '政策相关带来的美元重定价，可能很快就改变黄金日内行为。',
        },
        trap: {
          en: 'Defending the old idea as if the new information never arrived.',
          zh: '好像新信息从没出现过一样，硬守旧想法。',
        },
        confirmation: {
          en: 'Check whether price can reclaim the lost intraday support or keeps trading below it.',
          zh: '看价格能否收回失去的日内支撑，还是继续压在其下方。',
        },
      },
      {
        id: 'xau-17',
        difficulty: 'bridge',
        conceptTag: 'opening-drive',
        situation: {
          en: 'New York opens with aggressive gold buying and no immediate rejection despite a crowded chart nearby.',
          zh: '纽约盘开出后，黄金被积极买起，而且即使附近图上看起来很拥挤，也没有立刻被压回。',
        },
        bestRead: {
          en: 'Strong opening drive can matter, but you still need to judge whether acceptance develops after the impulse.',
          zh: '强开盘推动很重要，但你还是要看推动后能不能形成接受。',
        },
        driver: {
          en: 'Opening drive matters because fresh participation often reveals the day’s real intent.',
          zh: '开盘推动之所以重要，是因为新参与度常常会暴露当天真正的意图。',
        },
        trap: {
          en: 'Either chasing blindly or fading blindly without reading what happens after the impulse.',
          zh: '不是闭眼追，就是闭眼反着做，完全不看推动后的反应。',
        },
        confirmation: {
          en: 'Check whether pullbacks after the open are being bought or if the move instantly collapses.',
          zh: '看开盘后的小回踩有没有继续被买，还是整段马上塌掉。',
        },
      },
      {
        id: 'xau-18',
        difficulty: 'bridge',
        conceptTag: 'failed-bullish-case',
        situation: {
          en: 'Gold had supportive macro context, but price loses higher-low structure and cannot reclaim it.',
          zh: '黄金原本有支持性的宏观背景，但价格已经破坏更高低点结构，而且收不回去。',
        },
        bestRead: {
          en: 'The backdrop may still help longer term, but the immediate bullish execution case has failed.',
          zh: '背景可能对更大级别仍有帮助，但眼前的多头执行逻辑已经失败。',
        },
        driver: {
          en: 'Context can support bias, but broken structure invalidates specific execution ideas.',
          zh: '背景可以支持偏向，但结构坏掉后，某个具体执行逻辑就算失效。',
        },
        trap: {
          en: 'Confusing long-term bias with proof that the current setup is still valid.',
          zh: '把更大级别偏向，误当成眼前 setup 仍然有效的证明。',
        },
        confirmation: {
          en: 'Check whether any new base forms before rebuilding the long thesis.',
          zh: '在重建做多逻辑前，先看有没有新的底座结构形成。',
        },
      },
      {
        id: 'xau-19',
        difficulty: 'bridge',
        conceptTag: 'range-awareness',
        situation: {
          en: 'Macro inputs are mildly bullish, but intraday gold is still rotating inside the same narrow range.',
          zh: '宏观输入略偏多，但日内黄金依然在同一个窄区间里来回轮动。',
        },
        bestRead: {
          en: 'Bias alone is not enough; until the range breaks properly, execution still needs patience.',
          zh: '光有偏向还不够；在区间真正突破前，执行上还是需要耐心。',
        },
        driver: {
          en: 'Context does not cancel the fact that current price behaviour is still range-bound.',
          zh: '背景不能抹掉眼前价格仍然在震荡的事实。',
        },
        trap: {
          en: 'Trading as if macro bias automatically turns a range into a trend.',
          zh: '以为宏观偏向一出现，区间就自动变趋势。',
        },
        confirmation: {
          en: 'Check whether price can actually break and accept outside the range.',
          zh: '观察价格能否真正突破并在区间外接受。',
        },
      },
      {
        id: 'xau-20',
        difficulty: 'bridge',
        conceptTag: 'risk-management',
        situation: {
          en: 'Gold bias is constructive, but volatility expands so much that your normal stop would be unrealistically tight.',
          zh: '黄金偏向是建设性的，但波动突然放大到让你平常的止损显得过近。',
        },
        bestRead: {
          en: 'The idea may remain valid, but position structure must adapt to the new volatility.',
          zh: '逻辑也许还成立，但仓位结构必须适应新的波动状态。',
        },
        driver: {
          en: 'A good bias still fails if the trade structure cannot survive normal movement.',
          zh: '偏向再好，如果交易结构扛不住正常波动，也一样会失败。',
        },
        trap: {
          en: 'Keeping the same tight stop just to preserve a prettier risk-reward number.',
          zh: '为了让风险回报比好看一点，就硬用原本过紧的止损。',
        },
        confirmation: {
          en: 'Check whether the setup still works with realistic stop placement and size.',
          zh: '确认这个 setup 在合理止损和仓位下，是否仍然值得做。',
        },
      },
    ];

    return buildScenarioQuestionBank('xau', scenarios, {
      accurateStatement: {
        en: 'Technical analysis here is about ranking probabilities, not promising a guaranteed move.',
        zh: '这里的技术分析，是在排序概率，不是在承诺一定会怎样走。',
      },
      falseStatement: {
        en: 'Once macro context looks good, structure no longer matters.',
        zh: '只要宏观背景看起来好，结构就不再重要。',
      },
    });
  }

  function buildTrendRangeQuestionBank() {
    const scenarios = [
      {
        id: 'tr-1',
        difficulty: 'foundation',
        conceptTag: 'trend',
        situation: {
          en: 'Gold prints higher highs and higher lows, and each pullback gets bought before the previous swing low breaks.',
          zh: '黄金不断做出更高高点与更高低点，而且每次回踩都在跌破前低前就被买起来。',
        },
        bestRead: {
          en: 'This is trend behaviour, so continuation logic is stronger than blind fading.',
          zh: '这是趋势行为，所以延续逻辑比盲目逆势更强。',
        },
        driver: {
          en: 'The repeated defence of higher lows shows continuation structure.',
          zh: '更高低点一再被守住，说明延续结构还在。',
        },
        trap: {
          en: 'Calling every pullback a reversal just because price paused.',
          zh: '只要价格停一下，就把每次回踩都当成反转。',
        },
        confirmation: {
          en: 'Check whether the next pullback still respects the latest support shelf.',
          zh: '看下一次回踩是否继续尊重最近的支撑平台。',
        },
      },
      {
        id: 'tr-2',
        difficulty: 'foundation',
        conceptTag: 'range',
        situation: {
          en: 'Price keeps rejecting the same upper area and bouncing from the same lower area without clean acceptance outside the band.',
          zh: '价格一直在同一上沿被压回，也一直在同一下沿弹起，而且从未在区间外形成干净接受。',
        },
        bestRead: {
          en: 'This is range behaviour, so edge-to-edge logic matters more than breakout chasing.',
          zh: '这是震荡行为，所以边界逻辑比追突破更重要。',
        },
        driver: {
          en: 'Repeated rejection and mean reversion back into the band define the range.',
          zh: '反复拒绝并回到区间内部，就是震荡的定义。',
        },
        trap: {
          en: 'Buying every upper-band poke as if it must turn into a breakout.',
          zh: '每次上沿一碰，就把它当成一定要突破。',
        },
        confirmation: {
          en: 'Check whether price can finally accept outside the band before changing the label.',
          zh: '先看价格能否真正站稳区间外，再考虑改标签。',
        },
      },
      {
        id: 'tr-3',
        difficulty: 'foundation',
        conceptTag: 'unclear',
        situation: {
          en: 'Gold whipsaws around the middle of the intraday range with no clear impulse, no edge test, and no clean structure.',
          zh: '黄金在日内区间中段来回抽动，没有清晰推动、没有边界测试，也没有干净结构。',
        },
        bestRead: {
          en: 'Condition is unclear, so patience is more professional than forcing a label.',
          zh: '当前状态不清楚，所以耐心比硬贴标签更专业。',
        },
        driver: {
          en: 'When neither trend nor range logic is clearly present, preserving capital is part of the edge.',
          zh: '当趋势逻辑和震荡逻辑都不明显时，保护资本本身就是优势的一部分。',
        },
        trap: {
          en: 'Pretending uncertainty means you should just pick a side quickly.',
          zh: '把不确定，当成必须快点乱选方向的理由。',
        },
        confirmation: {
          en: 'Check whether price reaches an edge or builds a real impulse before acting.',
          zh: '等价格去到边界，或真正形成推动后再行动。',
        },
      },
      {
        id: 'tr-4',
        difficulty: 'foundation',
        conceptTag: 'trend',
        situation: {
          en: 'A breakout from the range is followed by a controlled retest that holds, then a fresh higher high.',
          zh: '价格从区间突破后，出现受控回踩并守住，接着再做出新的更高高点。',
        },
        bestRead: {
          en: 'The market is transitioning into trend behaviour, and continuation logic is becoming valid.',
          zh: '市场正在转向趋势行为，延续逻辑开始变得有效。',
        },
        driver: {
          en: 'Break, retest hold, and new expansion form a stronger trend sequence.',
          zh: '突破、回踩守住、再扩张，是更强的趋势顺序。',
        },
        trap: {
          en: 'Treating the old range label as permanent even after the structure clearly changes.',
          zh: '结构已经明显变了，还把旧震荡标签当成永远有效。',
        },
        confirmation: {
          en: 'Check whether reclaimed breakout support keeps holding on the next dip.',
          zh: '确认下一次回踩时，突破支撑是否仍继续守住。',
        },
      },
      {
        id: 'tr-5',
        difficulty: 'foundation',
        conceptTag: 'range',
        situation: {
          en: 'Price spikes above the range high but immediately falls back into the middle with no follow-through.',
          zh: '价格先冲破区间上沿，但马上掉回中间，而且完全没有后续延续。',
        },
        bestRead: {
          en: 'That looks more like a failed breakout inside a range than a true trend start.',
          zh: '这更像是震荡里的突破失败，不像真正趋势起点。',
        },
        driver: {
          en: 'No acceptance above the boundary means the range logic still matters.',
          zh: '边界上方没有形成接受，代表震荡逻辑仍然重要。',
        },
        trap: {
          en: 'Assuming every brief break of a boundary proves a new trend.',
          zh: '以为边界只要短暂被破，就代表新趋势来了。',
        },
        confirmation: {
          en: 'Check whether price can reclaim the failed level again or keeps rotating inside.',
          zh: '看价格能不能再次站稳失败的突破位，还是继续回到区间内部轮动。',
        },
      },
      {
        id: 'tr-6',
        difficulty: 'bridge',
        conceptTag: 'trend',
        situation: {
          en: 'Gold keeps stair-stepping higher across London, with shallow pullbacks and strong closes near candle highs.',
          zh: '黄金在伦敦盘一阶一阶抬高，回踩浅，收盘也经常收在K线高位附近。',
        },
        bestRead: {
          en: 'That is a quality trend sequence, so countertrend fading needs stronger evidence.',
          zh: '这是质量不错的趋势顺序，所以逆势去做需要更强证据。',
        },
        driver: {
          en: 'Shallow pullbacks plus strong closes show sustained directional pressure.',
          zh: '浅回踩加上强收盘，说明方向压力持续存在。',
        },
        trap: {
          en: 'Shorting every green candle just because it looks crowded.',
          zh: '只要看到连续阳线，就每一根都想去空。',
        },
        confirmation: {
          en: 'Check whether pullbacks remain shallow instead of slicing through the last base.',
          zh: '看回踩是否继续偏浅，而不是直接砍穿最近的底座。',
        },
      },
      {
        id: 'tr-7',
        difficulty: 'bridge',
        conceptTag: 'range',
        situation: {
          en: 'Gold keeps rotating between a prior day high and a defended intraday shelf, but never builds new follow-through.',
          zh: '黄金不断在前日高点与日内支撑之间来回轮动，却始终没有建立新的延续。',
        },
        bestRead: {
          en: 'That is still range behaviour, even if individual candles look dramatic.',
          zh: '就算单根K线看起来很戏剧化，这仍然是震荡行为。',
        },
        driver: {
          en: 'The lack of net acceptance outside the band keeps the market classified as a range.',
          zh: '只要区间外没有净接受，市场就还是该归类为震荡。',
        },
        trap: {
          en: 'Letting one emotional candle erase the broader range context.',
          zh: '让一根情绪很重的K线，盖掉更大的震荡背景。',
        },
        confirmation: {
          en: 'Check whether price finally establishes acceptance beyond the prior day high.',
          zh: '看价格是否终于能在前日高点之外形成接受。',
        },
      },
      {
        id: 'tr-8',
        difficulty: 'bridge',
        conceptTag: 'unclear',
        situation: {
          en: 'There is one big impulse candle, but the rest of the session is messy and keeps retracing deeply.',
          zh: '虽然有一根很大的推动K线，但接下来的整个时段都很乱，而且一直深度回撤。',
        },
        bestRead: {
          en: 'One impulse alone is not enough to classify a durable trend.',
          zh: '单靠一根推动K线，还不足以把市场定义成持续趋势。',
        },
        driver: {
          en: 'Classification needs follow-through, not one isolated dramatic bar.',
          zh: '市场分类要看后续延续，不是只看一根孤立的大K线。',
        },
        trap: {
          en: 'Treating a single big candle as proof that the trend is now obvious.',
          zh: '把一根大K线，直接当成趋势已经明确的证明。',
        },
        confirmation: {
          en: 'Check whether price can preserve structure after the impulse instead of retracing most of it.',
          zh: '看推动后价格能否保住结构，而不是把大部分涨跌都吐回去。',
        },
      },
      {
        id: 'tr-9',
        difficulty: 'bridge',
        conceptTag: 'trend',
        situation: {
          en: 'Price breaks above resistance, then every dip into the breakout zone is quickly bought and closes strong.',
          zh: '价格突破阻力后，每次回踩突破区都很快被买起，而且收盘偏强。',
        },
        bestRead: {
          en: 'Trend logic deserves more weight because the breakout area is now acting as support.',
          zh: '趋势逻辑更值得重视，因为突破区已经开始转成支撑。',
        },
        driver: {
          en: 'Acceptance above the old ceiling shifts the playbook toward continuation.',
          zh: '旧天花板上方形成接受，会把剧本转向延续。',
        },
        trap: {
          en: 'Still trading it like a range just because that was yesterday’s condition.',
          zh: '明明状态已经变化，却还用昨天的震荡逻辑去做。',
        },
        confirmation: {
          en: 'Check whether the breakout shelf keeps holding on repeated tests.',
          zh: '确认突破平台在多次测试下是否继续守住。',
        },
      },
      {
        id: 'tr-10',
        difficulty: 'bridge',
        conceptTag: 'range',
        situation: {
          en: 'Gold tags both sides of the day’s band but repeatedly snaps back to the midpoint without directional acceptance.',
          zh: '黄金今天上下两边都碰过，但每次都会拉回到中间，而且没有方向性接受。',
        },
        bestRead: {
          en: 'The market is rotating, so you should respect the band and avoid mid-range impulsiveness.',
          zh: '市场在做轮动，所以要尊重区间，也别在中间位置冲动操作。',
        },
        driver: {
          en: 'Repeated reversion to the midpoint is a strong clue that the market is still rotational.',
          zh: '反复回到中点，是市场仍在轮动的强烈线索。',
        },
        trap: {
          en: 'Forcing trend entries from the middle of the range.',
          zh: '在区间中间硬做趋势单。',
        },
        confirmation: {
          en: 'Check whether price can finally break and stay outside one side of the band.',
          zh: '看价格是否终于能突破并站在区间某一边之外。',
        },
      },
      {
        id: 'tr-11',
        difficulty: 'bridge',
        conceptTag: 'trend',
        situation: {
          en: 'Price makes a lower low but is instantly reclaimed, then builds a series of higher lows afterward.',
          zh: '价格先打出一个更低低点，但马上被收回，随后又开始形成一串更高低点。',
        },
        bestRead: {
          en: 'The latest sequence now favours bullish transition rather than staying stuck on the old sell-off label.',
          zh: '最新这段顺序，已经更偏向多头转变，而不是继续停留在旧的下跌标签里。',
        },
        driver: {
          en: 'Classification should adapt when the sequence of structure clearly changes.',
          zh: '当结构顺序明显改变时，分类也应该跟着更新。',
        },
        trap: {
          en: 'Anchoring too hard to what the market did earlier instead of what it is doing now.',
          zh: '太执着于市场之前做了什么，而不是它现在正在做什么。',
        },
        confirmation: {
          en: 'Check whether the reclaimed low remains protected as new higher lows form.',
          zh: '看被收回的低点是否继续被保护，同时新的更高低点是否形成。',
        },
      },
      {
        id: 'tr-12',
        difficulty: 'bridge',
        conceptTag: 'unclear',
        situation: {
          en: 'Price alternates strong-looking candles both up and down, but none of them generate follow-through.',
          zh: '价格上下都出现过看起来很强的K线，但没有任何一边真正得到延续。',
        },
        bestRead: {
          en: 'The market is noisy, not necessarily tradable, and certainty should stay low.',
          zh: '这是噪音很重的市场，不一定值得做，确定性也应该保持低。',
        },
        driver: {
          en: 'Without follow-through, strong-looking candles are not enough to define condition.',
          zh: '没有后续延续时，单看强K线还不足以定义市场状态。',
        },
        trap: {
          en: 'Confusing intensity with clarity.',
          zh: '把激烈程度误当成清晰度。',
        },
        confirmation: {
          en: 'Wait for either cleaner continuation structure or a clearer edge-to-edge rotation.',
          zh: '等更干净的延续结构，或更明确的边界轮动出现后再说。',
        },
      },
      {
        id: 'tr-13',
        difficulty: 'bridge',
        conceptTag: 'range',
        situation: {
          en: 'An apparent breakout stalls immediately under higher-timeframe resistance and falls back into the prior band.',
          zh: '一个看似突破的动作，马上就在高周期阻力下停住，然后跌回原本区间。',
        },
        bestRead: {
          en: 'The range label still wins because the breakout never achieved acceptance.',
          zh: '震荡标签仍然有效，因为这个突破根本没有形成接受。',
        },
        driver: {
          en: 'Acceptance matters more than briefly poking outside a boundary.',
          zh: '真正重要的是接受，而不是短暂戳出边界。',
        },
        trap: {
          en: 'Treating the first break as proof without checking where it failed.',
          zh: '没有看它是在哪里失败，就把第一次突破当成证明。',
        },
        confirmation: {
          en: 'Check whether the higher-timeframe resistance keeps rejecting follow-through.',
          zh: '确认高周期阻力是否继续压住后续延续。',
        },
      },
      {
        id: 'tr-14',
        difficulty: 'bridge',
        conceptTag: 'trend',
        situation: {
          en: 'Gold trends lower all morning, and each bounce fails below the previous swing high.',
          zh: '黄金整个早盘都在走低，而且每次反弹都过不了前一个摆动高点。',
        },
        bestRead: {
          en: 'That is bearish trend behaviour, so continuation shorts are more logical than bottom-picking.',
          zh: '这是空头趋势行为，所以顺势空比猜底更合理。',
        },
        driver: {
          en: 'Failed bounces under prior highs show sellers still control the structure.',
          zh: '每次反弹都过不了前高，说明卖方还控制着结构。',
        },
        trap: {
          en: 'Buying simply because the market has already fallen for several candles.',
          zh: '只是因为已经跌了几根，就硬去抄底。',
        },
        confirmation: {
          en: 'Check whether the next bounce also fails beneath the most recent swing high.',
          zh: '看下一次反弹是否依然过不了最近摆动高点。',
        },
      },
      {
        id: 'tr-15',
        difficulty: 'bridge',
        conceptTag: 'range',
        situation: {
          en: 'The market has spent hours between the same two boundaries, but social chatter keeps calling every twitch a breakout.',
          zh: '市场已经在同一对边界之间来回几个小时了，但外面一直有人把每次小动作都叫成突破。',
        },
        bestRead: {
          en: 'Your label should still come from price behaviour, not the excitement around it.',
          zh: '你的分类应该来自价格行为，而不是外面的情绪。',
        },
        driver: {
          en: 'The chart decides the condition; commentary does not create acceptance.',
          zh: '市场状态由图表决定；外部解读不会帮价格制造接受。',
        },
        trap: {
          en: 'Letting hype turn a range into an imagined trend.',
          zh: '让情绪把震荡硬说成趋势。',
        },
        confirmation: {
          en: 'Check whether the market itself finally changes character, not whether people sound confident.',
          zh: '看市场自己有没有换性格，而不是别人讲得多有信心。',
        },
      },
      {
        id: 'tr-16',
        difficulty: 'advanced',
        conceptTag: 'transition',
        situation: {
          en: 'Price shifts from noisy range into one clean directional expansion, then keeps accepting outside the old rotation band.',
          zh: '价格从杂乱震荡切换成一段干净扩张，而且还持续在旧区间外接受。',
        },
        bestRead: {
          en: 'The market is transitioning, so you should update from range logic toward trend logic.',
          zh: '市场正在切换，所以你应该从震荡逻辑更新到趋势逻辑。',
        },
        driver: {
          en: 'Condition changes when acceptance appears outside the old rotational boundaries.',
          zh: '一旦在旧轮动边界外形成接受，市场状态就改变了。',
        },
        trap: {
          en: 'Holding onto the old range label long after price behaviour changed.',
          zh: '价格行为早就变了，却还一直抱着旧震荡标签。',
        },
        confirmation: {
          en: 'Check whether the new outside area now acts as support/resistance instead of old mean reversion returning.',
          zh: '确认新的外部区域是否开始转成支撑/阻力，而不是又回到旧震荡均值逻辑。',
        },
      },
      {
        id: 'tr-17',
        difficulty: 'advanced',
        conceptTag: 'trend',
        situation: {
          en: 'Momentum is strong, but price is now very far from the last valid pullback base.',
          zh: '动能很强，但价格已经离最近一次有效回踩底座很远。',
        },
        bestRead: {
          en: 'Trend label can stay valid while the immediate entry quality still deteriorates.',
          zh: '趋势标签可以继续有效，但眼前的进场质量仍然可能下降。',
        },
        driver: {
          en: 'Condition and entry are separate; a valid trend can still become a poor chase.',
          zh: '市场状态和进场是分开的；趋势没错，不代表现在追进去就好。',
        },
        trap: {
          en: 'Thinking a valid trend means every price is an equally good entry.',
          zh: '以为趋势成立，就代表任何价格追进去都一样好。',
        },
        confirmation: {
          en: 'Wait for structure to reset instead of confusing trend classification with entry permission.',
          zh: '等结构重新整理，而不是把趋势分类误当成随时都能进场。',
        },
      },
      {
        id: 'tr-18',
        difficulty: 'advanced',
        conceptTag: 'range',
        situation: {
          en: 'Price pokes both ends of the band during news noise but still settles back into the same middle area afterward.',
          zh: '新闻噪音期间，价格上下两端都刺穿过，但最后还是回到同一个中间区域。',
        },
        bestRead: {
          en: 'The market may still be rotational despite noisy excursions outside the band.',
          zh: '就算中间有很多噪音刺穿，市场整体仍然可能是震荡轮动。',
        },
        driver: {
          en: 'Temporary excursions are less important than where price ultimately accepts.',
          zh: '短暂刺穿没有最终接受重要。',
        },
        trap: {
          en: 'Reclassifying the market every time a headline causes a spike.',
          zh: '每次新闻尖刺一出现，就重贴一次标签。',
        },
        confirmation: {
          en: 'Check where the market accepts after the noise settles.',
          zh: '看噪音过去后，市场最后接受在哪里。',
        },
      },
      {
        id: 'tr-19',
        difficulty: 'advanced',
        conceptTag: 'unclear',
        situation: {
          en: 'The chart shows conflicting signals across structure, session timing, and higher-timeframe location.',
          zh: '图表在结构、时段行为和高周期位置上都出现互相打架的信号。',
        },
        bestRead: {
          en: 'Classification confidence should drop, and capital preservation becomes part of good decision-making.',
          zh: '分类信心应该下降，而保护资本就是良好决策的一部分。',
        },
        driver: {
          en: 'Confidence should reflect clarity; when evidence conflicts, certainty should come down.',
          zh: '信心应该反映清晰度；证据互相冲突时，确定性就该下降。',
        },
        trap: {
          en: 'Forcing a neat label because ambiguity feels uncomfortable.',
          zh: '因为不喜欢模糊感，就硬塞一个看起来整齐的标签。',
        },
        confirmation: {
          en: 'Wait for one side of the evidence to become meaningfully cleaner.',
          zh: '等其中一边的证据真正变得更干净再说。',
        },
      },
      {
        id: 'tr-20',
        difficulty: 'advanced',
        conceptTag: 'playbook-selection',
        situation: {
          en: 'The market clearly rotates for hours, then forms one breakout that finally holds on retest.',
          zh: '市场先明显震荡了几个小时，之后终于出现一次真正能在回踩上守住的突破。',
        },
        bestRead: {
          en: 'The correct skill is knowing when to stop using range logic and switch playbooks.',
          zh: '真正的功力，是知道什么时候要停止用震荡逻辑，改用新的剧本。',
        },
        driver: {
          en: 'Good traders do not just classify well; they update well when conditions change.',
          zh: '好的交易者不只会分类，也会在市场变了时及时更新。',
        },
        trap: {
          en: 'Either refusing to update or updating too early without acceptance.',
          zh: '不是死不更新，就是在还没接受前更新得太早。',
        },
        confirmation: {
          en: 'Check whether the retest really holds and leads to fresh expansion.',
          zh: '确认回踩是否真的守住，并带来新的扩张。',
        },
      },
    ];

    return buildScenarioQuestionBank('trend', scenarios, {
      accurateStatement: {
        en: 'The best trade idea often starts with identifying the right market condition, not the prettiest candle.',
        zh: '最好的交易逻辑，往往始于认对市场状态，而不是看到最漂亮的K线。',
      },
      falseStatement: {
        en: 'If you feel confident, the market must already be trending.',
        zh: '只要你感觉很有信心，市场就一定已经在趋势中。',
      },
    });
  }

  function buildLiquidityQuestionBank() {
    const scenarios = [
      {
        id: 'liq-1',
        difficulty: 'advanced',
        conceptTag: 'equal-high-sweep',
        situation: {
          en: 'Gold runs above equal highs, triggers breakout buying, then closes back below the level within minutes.',
          zh: '黄金先扫过一排等高，触发突破买盘，几分钟内却又收回到该水平位下方。',
        },
        bestRead: {
          en: 'This looks more like a sweep that failed to hold than a clean continuation breakout.',
          zh: '这更像是扫流动性后守不住的动作，而不是干净延续突破。',
        },
        driver: {
          en: 'The failed hold below the swept highs is what gives the sequence meaning.',
          zh: '扫高后守不住，才是这段顺序真正有意义的地方。',
        },
        trap: {
          en: 'Calling every brief break of highs a valid breakout.',
          zh: '只要高点被短暂突破，就直接认定是真突破。',
        },
        confirmation: {
          en: 'Check whether price can reclaim the swept level or keeps accepting below it.',
          zh: '确认价格能否收回被扫的位置，还是继续在其下方接受。',
        },
      },
      {
        id: 'liq-2',
        difficulty: 'advanced',
        conceptTag: 'equal-low-sweep',
        situation: {
          en: 'Price sweeps a cluster of equal lows, traps breakdown sellers, and then reclaims back inside the prior range.',
          zh: '价格扫过一排等低，套住追空的突破卖盘，然后又收回到原本区间内部。',
        },
        bestRead: {
          en: 'That sequence supports a failed-breakdown read rather than fresh bearish continuation.',
          zh: '这个顺序更支持跌破失败，而不是新的空头延续。',
        },
        driver: {
          en: 'Reclaiming back into the prior range weakens the bearish breakdown case.',
          zh: '收回到原本区间内部，会削弱空头跌破逻辑。',
        },
        trap: {
          en: 'Assuming the first poke under lows is enough proof to stay bearish.',
          zh: '以为低点只要被刺穿一次，就足够证明还该继续看空。',
        },
        confirmation: {
          en: 'Check whether buyers can now defend the reclaimed range floor.',
          zh: '确认买方是否能守住被收回的区间下沿。',
        },
      },
      {
        id: 'liq-3',
        difficulty: 'advanced',
        conceptTag: 'acceptance',
        situation: {
          en: 'Gold breaks above a clear liquidity pool and then keeps trading comfortably above it for the next hour.',
          zh: '黄金突破一个很明显的流动性池后，接下来一小时都稳稳站在上方。',
        },
        bestRead: {
          en: 'That is more likely true acceptance after the raid, not a simple stop-hunt reversal.',
          zh: '这更像是扫完后的真实接受，而不是单纯扫损反转。',
        },
        driver: {
          en: 'Continued acceptance after the raid supports breakout validity.',
          zh: '扫完后还能持续接受，说明突破更有效。',
        },
        trap: {
          en: 'Assuming every liquidity raid must reverse immediately.',
          zh: '以为所有流动性扫单都一定要立刻反转。',
        },
        confirmation: {
          en: 'Check whether pullbacks stay supported above the reclaimed level.',
          zh: '看回踩时，价格是否仍在被收回的位置上方获得支撑。',
        },
      },
      {
        id: 'liq-4',
        difficulty: 'advanced',
        conceptTag: 'reclaim-failure',
        situation: {
          en: 'Price spikes above a prior day high, then every bounce afterwards fails beneath that same level.',
          zh: '价格先刺穿前一天高点，之后每次反弹却都过不了那个位置。',
        },
        bestRead: {
          en: 'The failure to reclaim suggests the sweep is being rejected, not accepted.',
          zh: '收不回去，说明这个 sweep 是被拒绝，而不是被接受。',
        },
        driver: {
          en: 'Repeated reclaim failure matters more than the first spike itself.',
          zh: '比起第一次尖刺，更重要的是后面一再收不回去。',
        },
        trap: {
          en: 'Focusing only on the initial breakout and ignoring the response.',
          zh: '只看第一次突破，不看之后的反应。',
        },
        confirmation: {
          en: 'Check whether the failed reclaim keeps producing lower highs beneath the swept level.',
          zh: '确认在被扫水平位下方，是否继续形成更低高点。',
        },
      },
      {
        id: 'liq-5',
        difficulty: 'advanced',
        conceptTag: 'news-sweep',
        situation: {
          en: 'CPI causes a fast sweep above equal highs, but the candle closes deep back inside the pre-news range.',
          zh: 'CPI 让价格快速扫过等高，但最后这根K线深深收回到数据前的区间里。',
        },
        bestRead: {
          en: 'That is a meaningful warning sign for failed breakout buyers, not a clean bullish acceptance.',
          zh: '这对追突破买盘来说是明显警告，而不是干净的多头接受。',
        },
        driver: {
          en: 'Closing back inside the old range after a stop run often signals rejection.',
          zh: '扫完止损后再收回旧区间，常常意味着拒绝。',
        },
        trap: {
          en: 'Treating the news spike high as proof that price “must” continue higher.',
          zh: '把新闻尖刺高点，当成价格“必须”继续涨的证明。',
        },
        confirmation: {
          en: 'Check whether the next bounce still gets rejected inside the reclaimed range.',
          zh: '看接下来反弹时，价格是否继续在被收回的区间内受压。',
        },
      },
      {
        id: 'liq-6',
        difficulty: 'advanced',
        conceptTag: 'resting-liquidity',
        situation: {
          en: 'Gold spends hours building obvious equal highs right under New York open.',
          zh: '黄金在纽约盘前花了几个小时，堆出一排非常明显的等高。',
        },
        bestRead: {
          en: 'That obvious structure likely contains resting liquidity that can attract the next raid.',
          zh: '这种明显结构很可能堆着流动性，容易吸引下一次扫单。',
        },
        driver: {
          en: 'Obvious clustered highs often become liquidity magnets.',
          zh: '明显聚集的高点，常常会变成流动性磁铁。',
        },
        trap: {
          en: 'Ignoring the liquidity pool and reacting only after price has already raided it.',
          zh: '完全不预判流动性池，等价格扫完才开始反应。',
        },
        confirmation: {
          en: 'Plan to watch how price behaves immediately after the sweep, not only the sweep itself.',
          zh: '先规划好：重点看扫完后的反应，而不只是扫单那一下。',
        },
      },
      {
        id: 'liq-7',
        difficulty: 'advanced',
        conceptTag: 'continuation',
        situation: {
          en: 'Price raids prior highs and instantly builds fresh support above them instead of collapsing back.',
          zh: '价格扫过前高后，立刻在其上方建立新支撑，而不是跌回去。',
        },
        bestRead: {
          en: 'That behaviour supports continuation after liquidity was taken, not a trap reversal.',
          zh: '这种行为更支持拿完流动性后的延续，而不是陷阱反转。',
        },
        driver: {
          en: 'New support forming above the raided highs signals acceptance.',
          zh: '被扫高点上方形成新支撑，代表接受度出现。',
        },
        trap: {
          en: 'Shorting every sweep by rule, without reading acceptance.',
          zh: '不看接受度，只要 sweep 就机械做空。',
        },
        confirmation: {
          en: 'Check whether pullbacks keep holding above the old highs.',
          zh: '确认回踩时，价格是否继续守在旧高点上方。',
        },
      },
      {
        id: 'liq-8',
        difficulty: 'advanced',
        conceptTag: 'failed-breakdown',
        situation: {
          en: 'A breakdown under the overnight low cannot stay accepted and price quickly rotates back above the shelf.',
          zh: '价格跌破隔夜低点后无法形成接受，很快又转回到平台上方。',
        },
        bestRead: {
          en: 'The breakdown failed, so the liquidity raid now deserves reversal respect.',
          zh: '这个跌破失败了，所以这次流动性扫单更值得用反转角度去重视。',
        },
        driver: {
          en: 'Failure to accept below the overnight low weakens the bearish case.',
          zh: '在隔夜低点下方无法接受，会削弱空头逻辑。',
        },
        trap: {
          en: 'Staying heavily bearish just because the low was briefly broken.',
          zh: '只是因为低点短暂被破，就继续重仓看空。',
        },
        confirmation: {
          en: 'Check whether the reclaimed shelf now holds as support.',
          zh: '看被收回的平台是否开始转成支撑。',
        },
      },
      {
        id: 'liq-9',
        difficulty: 'advanced',
        conceptTag: 'sequence',
        situation: {
          en: 'Equal highs form, then get swept, then price reclaims below them, then produces a lower high.',
          zh: '先有一排等高，然后被扫，再收回到其下方，接着又形成更低高点。',
        },
        bestRead: {
          en: 'That full sequence supports bearish intent more than the sweep alone would.',
          zh: '完整顺序比单看 sweep 本身，更能支持看空意图。',
        },
        driver: {
          en: 'Sweep plus reclaim plus lower high creates a stronger sequence of evidence.',
          zh: 'sweep 加上收回，再加上更低高点，会形成更强的证据链。',
        },
        trap: {
          en: 'Stopping the analysis at “highs got taken” without reading the next steps.',
          zh: '分析停在“高点被扫了”，却不继续看后面的动作。',
        },
        confirmation: {
          en: 'Check whether the lower high leads into further downside acceptance.',
          zh: '确认更低高点之后，是否继续出现下方接受。',
        },
      },
      {
        id: 'liq-10',
        difficulty: 'advanced',
        conceptTag: 'location',
        situation: {
          en: 'A sweep occurs directly into a major higher-timeframe supply zone and then stalls immediately.',
          zh: '一次 sweep 正好打进高周期重要供给区，随后立刻停住。',
        },
        bestRead: {
          en: 'The higher-timeframe location makes the failed hold more meaningful.',
          zh: '高周期位置，会让这个守不住的动作更有意义。',
        },
        driver: {
          en: 'Sweep quality improves when the raid happens into meaningful higher-timeframe location.',
          zh: '当 sweep 打进高周期关键位置时，它的参考价值会更高。',
        },
        trap: {
          en: 'Ignoring location and treating all sweeps as equally important.',
          zh: '忽略位置，把所有 sweep 都当成一样重要。',
        },
        confirmation: {
          en: 'Check whether the supply zone keeps blocking reclaim attempts.',
          zh: '确认供给区是否继续压住收回动作。',
        },
      },
      {
        id: 'liq-11',
        difficulty: 'advanced',
        conceptTag: 'sellside-liquidity',
        situation: {
          en: 'Price runs through obvious sell-side liquidity below equal lows and immediately rips back into the prior structure.',
          zh: '价格先扫穿等低下方明显卖方流动性，接着立刻拉回到原本结构里。',
        },
        bestRead: {
          en: 'That is a classic failed bearish expansion sequence.',
          zh: '这是很典型的空头扩张失败顺序。',
        },
        driver: {
          en: 'The fast return into prior structure shows the sell-side raid did not produce acceptance.',
          zh: '快速回到原本结构里，说明这次向下扫单没有形成接受。',
        },
        trap: {
          en: 'Selling after the breakdown is already being reversed.',
          zh: '明明跌破已经被反收了，才后知后觉去追空。',
        },
        confirmation: {
          en: 'Check whether buyers can now build higher lows back inside the old range.',
          zh: '确认买方是否能在旧区间内部重新建立更高低点。',
        },
      },
      {
        id: 'liq-12',
        difficulty: 'advanced',
        conceptTag: 'buyside-liquidity',
        situation: {
          en: 'Price wicks above prior highs, but order flow cannot sustain and the move is sold aggressively back under the level.',
          zh: '价格先影线刺破前高，但订单流无法持续，随后被强力卖回到该位置下方。',
        },
        bestRead: {
          en: 'The wick alone is not the signal; the aggressive rejection back under the level is.',
          zh: '信号不是上影线本身，而是强力收回到该水平位下方的动作。',
        },
        driver: {
          en: 'Rejection and failure to sustain are what transform a raid into a usable read.',
          zh: '拒绝和无法持续，才会把一次扫单变成有用的信息。',
        },
        trap: {
          en: 'Using candle shape alone without reading whether the level was accepted.',
          zh: '只看K线形状，不看那个位置有没有被接受。',
        },
        confirmation: {
          en: 'Check whether later bounces also fail beneath the raided highs.',
          zh: '看后面反弹时，是否也继续过不了被扫的高点。',
        },
      },
      {
        id: 'liq-13',
        difficulty: 'advanced',
        conceptTag: 'news-volatility',
        situation: {
          en: 'A huge data spike sweeps both sides of the range before settling back near the middle.',
          zh: '一波很大的数据尖刺先把区间上下两边都扫掉，最后却回到中间附近。',
        },
        bestRead: {
          en: 'The spike harvested liquidity on both sides, so the close and acceptance matter more than the excursion.',
          zh: '这次尖刺把两边流动性都拿了，所以比起刺穿本身，更该看收盘和接受位置。',
        },
        driver: {
          en: 'Extreme volatility can raid both sides, making acceptance the key filter.',
          zh: '极端波动可以把两边都扫掉，因此接受位置才是关键过滤器。',
        },
        trap: {
          en: 'Assuming whichever side was touched first must define the final bias.',
          zh: '以为先扫到哪一边，最终偏向就一定是哪一边。',
        },
        confirmation: {
          en: 'Check where price settles once volatility stops exploding.',
          zh: '看波动冷静下来后，价格最终停在哪里。',
        },
      },
      {
        id: 'liq-14',
        difficulty: 'advanced',
        conceptTag: 'retest',
        situation: {
          en: 'After a sweep rejection, price retests the level from below and gets rejected again.',
          zh: 'sweep 被拒绝后，价格从下方回测那个水平位，又再次被压回。',
        },
        bestRead: {
          en: 'The retest failure adds confirmation to the rejection sequence.',
          zh: '回测失败，为这个拒绝顺序增加了确认。',
        },
        driver: {
          en: 'Retest failure often confirms that the market now rejects the raided level.',
          zh: '回测失败，常常能确认市场现在确实在拒绝被扫的位置。',
        },
        trap: {
          en: 'Ignoring the retest and treating the first rejection as the entire story.',
          zh: '忽略回测动作，把第一次拒绝当成全部故事。',
        },
        confirmation: {
          en: 'Check whether the retest failure leads into fresh downside acceptance.',
          zh: '确认回测失败后，是否继续形成下方接受。',
        },
      },
      {
        id: 'liq-15',
        difficulty: 'advanced',
        conceptTag: 'noisy-sweep',
        situation: {
          en: 'Price briefly sweeps a low, but the surrounding structure is chaotic and gives no clean reclaim sequence.',
          zh: '价格短暂扫了一下低点，但周围结构非常混乱，也没有干净的收回顺序。',
        },
        bestRead: {
          en: 'The sweep alone is not enough; the read stays weak when the surrounding structure is messy.',
          zh: '单靠一次 sweep 还不够；周边结构很乱时，这个判断仍然偏弱。',
        },
        driver: {
          en: 'A good label without a good sequence is often not enough for high-conviction execution.',
          zh: '有标签但没顺序，通常不足以支撑高信心执行。',
        },
        trap: {
          en: 'Forcing a strong liquidity narrative out of weak surrounding evidence.',
          zh: '周边证据很弱，却硬要讲出一个很强的流动性故事。',
        },
        confirmation: {
          en: 'Wait for a cleaner reclaim or more structured follow-through.',
          zh: '等更干净的收回动作，或更有结构的后续跟进。',
        },
      },
      {
        id: 'liq-16',
        difficulty: 'advanced',
        conceptTag: 'continuation-after-raid',
        situation: {
          en: 'A buy-side raid is followed by consolidation just above the highs rather than immediate rejection.',
          zh: '买方流动性被扫完后，价格不是立刻回落，而是在高点上方横向整理。',
        },
        bestRead: {
          en: 'That consolidation suggests acceptance and possible continuation, not an automatic short.',
          zh: '这种整理更像接受和潜在延续，而不是自动给你一个做空信号。',
        },
        driver: {
          en: 'Holding above the raided highs is a sign the move may be real.',
          zh: '扫完高点后还能守在上方，代表这段走势可能是真的。',
        },
        trap: {
          en: 'Shorting every liquidity event without checking whether acceptance formed.',
          zh: '不看接受度，只要看到流动性事件就一律做空。',
        },
        confirmation: {
          en: 'Check whether the consolidation resolves higher while still respecting the new support.',
          zh: '看整理结束后，是否能在守住新支撑的同时往上走。',
        },
      },
      {
        id: 'liq-17',
        difficulty: 'advanced',
        conceptTag: 'session-liquidity',
        situation: {
          en: 'London closes, liquidity thins, and a sweep occurs without much follow-through in either direction.',
          zh: '伦敦收盘后流动性变薄，这时出现一次 sweep，但两边都没有什么后续。',
        },
        bestRead: {
          en: 'The read should stay lighter because the sweep happened in thinner conditions.',
          zh: '这个判断应该更保守，因为 sweep 发生在更薄的流动性环境里。',
        },
        driver: {
          en: 'Session quality matters; a thin-market sweep can be less reliable than one during active participation.',
          zh: '时段质量很重要；薄量环境中的 sweep，可靠度可能不如活跃时段。',
        },
        trap: {
          en: 'Treating all sweeps as equally meaningful regardless of session quality.',
          zh: '不管时段质量如何，都把所有 sweep 视为同等重要。',
        },
        confirmation: {
          en: 'Check whether active-session participation later confirms the read.',
          zh: '看后面活跃时段参与进来时，是否会确认这个读法。',
        },
      },
      {
        id: 'liq-18',
        difficulty: 'advanced',
        conceptTag: 'higher-timeframe-liquidity',
        situation: {
          en: 'The market raids a weekly high and instantly rotates back under it while lower-timeframe structure flips bearish.',
          zh: '市场扫过周线高点后立刻转回其下方，而且低周期结构也转成偏空。',
        },
        bestRead: {
          en: 'That raid carries more weight because it happened at a meaningful higher-timeframe pool.',
          zh: '这次 raid 更有分量，因为它发生在有意义的高周期流动性池。',
        },
        driver: {
          en: 'Higher-timeframe liquidity plus lower-timeframe rejection creates a stronger confluence.',
          zh: '高周期流动性加上低周期拒绝，会形成更强共振。',
        },
        trap: {
          en: 'Ignoring the weekly level and reading the move as an ordinary intraday wick.',
          zh: '忽略周线位置，把它当成普通日内影线看待。',
        },
        confirmation: {
          en: 'Check whether lower-timeframe lower highs keep forming beneath the weekly high.',
          zh: '确认周高下方，低周期是否继续形成更低高点。',
        },
      },
      {
        id: 'liq-19',
        difficulty: 'advanced',
        conceptTag: 'laddered-highs',
        situation: {
          en: 'Price forms a staircase into obvious highs, sweeps them, then loses the staircase base.',
          zh: '价格像楼梯一样一路抬高到明显高点，扫完后又跌破整段楼梯底座。',
        },
        bestRead: {
          en: 'Losing the staircase base after the sweep strengthens the failed-continuation case.',
          zh: '扫完后连楼梯底座都失守，会强化延续失败的判断。',
        },
        driver: {
          en: 'The broken staircase base shows the momentum structure no longer holds.',
          zh: '楼梯底座被破，说明动能结构已经守不住。',
        },
        trap: {
          en: 'Watching the sweep but ignoring the failure of the approach structure.',
          zh: '只看 sweep，却不看上去那段结构本身也已经失败。',
        },
        confirmation: {
          en: 'Check whether price now accepts below the former staircase base.',
          zh: '看价格是否开始在原本楼梯底座下方接受。',
        },
      },
      {
        id: 'liq-20',
        difficulty: 'advanced',
        conceptTag: 'discipline',
        situation: {
          en: 'A famous “liquidity sweep” pattern seems to appear, but there is no clean reclaim, no location edge, and no follow-through.',
          zh: '一个很有名的“liquidity sweep”形态似乎出现了，但没有干净收回、没有位置优势，也没有跟进。',
        },
        bestRead: {
          en: 'The disciplined read is to downgrade conviction instead of forcing the pattern label.',
          zh: '有纪律的读法，是主动降低信心，而不是硬套形态标签。',
        },
        driver: {
          en: 'Professional reads depend on sequence quality, not the popularity of a label.',
          zh: '更专业的读法，取决于顺序质量，不取决于标签流不流行。',
        },
        trap: {
          en: 'Forcing a trade because the setup name sounds advanced.',
          zh: '只因为 setup 名字听起来很高级，就硬要去做。',
        },
        confirmation: {
          en: 'Wait until reclaim, location, or follow-through actually improve the quality.',
          zh: '等收回、位置或后续跟进真的把质量提高后再说。',
        },
      },
    ];

    return buildScenarioQuestionBank('liq', scenarios, {
      accurateStatement: {
        en: 'Sweeps matter most when you can read the sequence after the raid, not just the raid itself.',
        zh: 'sweep 最有价值的时候，是你能读懂扫完后的顺序，而不只是扫的那一下。',
      },
      falseStatement: {
        en: 'Every liquidity sweep should be traded as an immediate reversal.',
        zh: '每一次 liquidity sweep 都应该被当成立刻反转来做。',
      },
    });
  }

  function buildCandleStrengthQuestionBank() {
    const scenarios = [
      {
        id: 'candle-1',
        difficulty: 'foundation',
        conceptTag: 'strong-close',
        situation: { en: 'Gold prints a bullish candle that closes near its high, and the next candle holds above half the body.', zh: '黄金打出一根接近高点收盘的阳线，下一根也守在它实体一半上方。' },
        bestRead: { en: 'Buyers likely kept control into the close, and the follow-through supports that read.', zh: '这更像买方把控制权带到了收盘，而且后续反应也支持这个判断。' },
        driver: { en: 'Strong close plus hold above the body gives the candle more credibility.', zh: '强收盘再加上后续守住实体，是这根 K 线更有可信度的关键。' },
        trap: { en: 'Ignoring the close and focusing only on how far price travelled intrabar.', zh: '忽略收盘位置，只看盘中一度走了多远。' },
        confirmation: { en: 'Check whether the next 1 to 3 candles keep defending the strong close zone.', zh: '看后面 1 到 3 根 K 线，是否继续守住这段强收盘区域。' },
      },
      {
        id: 'candle-2',
        difficulty: 'foundation',
        conceptTag: 'weak-close',
        situation: { en: 'A bullish candle rallies hard intrabar but leaves a large upper wick and closes near the middle.', zh: '一根阳线盘中冲得很猛，但留下长上影，最后只收在中间附近。' },
        bestRead: { en: 'The move looked strong intrabar, but buyers did not keep enough control into the close.', zh: '盘中看起来很强，但买方没有把足够的控制力守到收盘。' },
        driver: { en: 'A weak close reduces the credibility of the intrabar expansion.', zh: '收盘偏弱，会削弱那段盘中扩张的可信度。' },
        trap: { en: 'Treating every big green candle as strong continuation without checking where it closed.', zh: '不看收盘位置，只要是大阳线就直接当成强势延续。' },
        confirmation: { en: 'Check whether price can reclaim the upper half of the candle on the next attempt.', zh: '看下一次推进时，价格能不能重新收回这根 K 线的上半区。' },
      },
      {
        id: 'candle-3',
        difficulty: 'foundation',
        conceptTag: 'wick-rejection',
        situation: { en: 'Price sweeps below support, leaves a long lower wick, and the next candle closes back above the shelf.', zh: '价格先扫穿支撑，留下长下影，下一根又重新收回支撑平台上方。' },
        bestRead: { en: 'The wick matters because the next candle confirmed the rejection instead of wasting it.', zh: '这根影线之所以有意义，是因为下一根确认了拒绝，而不是把它浪费掉。' },
        driver: { en: 'Wick plus follow-through is much stronger than wick by itself.', zh: '影线加后续跟进，会比单独一根影线强得多。' },
        trap: { en: 'Believing one wick is enough proof even if the next candle closes weak again.', zh: '只靠一根影线就下结论，即使下一根马上又弱收也不改看法。' },
        confirmation: { en: 'Check whether buyers keep defending above the reclaimed support zone.', zh: '看买方是否继续守在重新收回的支撑区上方。' },
      },
      {
        id: 'candle-4',
        difficulty: 'foundation',
        conceptTag: 'wick-failure',
        situation: { en: 'A long lower wick prints at support, but the next candle immediately closes back near the lows.', zh: '支撑位附近出现长下影，但下一根马上又收回到低位附近。' },
        bestRead: { en: 'The wick alone did not earn trust because the next reaction stayed weak.', zh: '这根影线本身还不值得信，因为后续反应仍然偏弱。' },
        driver: { en: 'Follow-through failed, so the rejection signal lost quality.', zh: '后续跟进失败，让这段拒绝信号质量下降。' },
        trap: { en: 'Calling the support confirmed just because one wick looked dramatic.', zh: '只因为一根影线看起来夸张，就认定支撑已经确认。' },
        confirmation: { en: 'Check whether price can retake the midpoint of the wick candle first.', zh: '先看价格能不能重新站回那根影线 K 线的中位。' },
      },
      {
        id: 'candle-5',
        difficulty: 'foundation',
        conceptTag: 'breakout-close',
        situation: { en: 'Gold breaks above Asia high with a candle that closes strong and leaves little upper wick.', zh: '黄金突破亚洲高点时，那根 K 线强势收盘，几乎没留下上影。' },
        bestRead: { en: 'The breakout close deserves respect, though execution still prefers a controlled next setup.', zh: '这种突破收盘值得尊重，但执行上仍更偏好等下一步受控结构。' },
        driver: { en: 'A clean close through the level shows better acceptance than a brief poke through it.', zh: '干净地收在关键位上方，比短暂刺穿一下更能说明接受度。' },
        trap: { en: 'Fading it immediately only because the candle already moved a lot.', zh: '只因为这根已经涨很多，就立刻反手去空。' },
        confirmation: { en: 'Check whether the breakout area can hold on the first pullback.', zh: '看第一次回踩时，突破区能不能被守住。' },
      },
      {
        id: 'candle-6',
        difficulty: 'foundation',
        conceptTag: 'breakout-failure',
        situation: { en: 'Price spikes above resistance, but the candle leaves a long upper wick and closes back under the level.', zh: '价格一度冲过阻力，但留下很长上影，最后又收回阻力下方。' },
        bestRead: { en: 'That is weaker breakout information because acceptance above the level failed immediately.', zh: '这属于偏弱的突破信息，因为站上去后的接受度立刻失败了。' },
        driver: { en: 'The close back under resistance matters more than the brief intrabar breakout.', zh: '收回阻力下方，比盘中短暂突破本身更重要。' },
        trap: { en: 'Calling it a clean breakout because the wick touched a higher price.', zh: '只因为上影碰到更高价格，就把它当成干净突破。' },
        confirmation: { en: 'Check whether sellers keep defending the level on the next bounce.', zh: '看下一次反弹时，卖方是否继续守住该阻力。' },
      },
      {
        id: 'candle-7',
        difficulty: 'foundation',
        conceptTag: 'bearish-close',
        situation: { en: 'A red candle closes near its low after rejecting a prior intraday resistance shelf.', zh: '价格在日内阻力平台被压回后，出现一根接近低点收盘的阴线。' },
        bestRead: { en: 'Sellers likely won that auction, and the rejection has more weight because of the location.', zh: '这轮博弈更像卖方赢了，而且因为发生在阻力位，拒绝更有分量。' },
        driver: { en: 'Strong bearish close at resistance gives the rejection better context.', zh: '阻力位附近的强空收盘，会让这次拒绝更有背景意义。' },
        trap: { en: 'Ignoring location and saying the candle is meaningless because it is only one bar.', zh: '完全忽略位置，只因为它只有一根 K 线就说没有意义。' },
        confirmation: { en: 'Check whether the next bounce stays capped below that resistance shelf.', zh: '看下一次反弹时，价格是否仍被压在那个阻力平台下方。' },
      },
      {
        id: 'candle-8',
        difficulty: 'foundation',
        conceptTag: 'inside-close',
        situation: { en: 'After a strong impulse, the next candle is small and closes inside the prior body.', zh: '在一段强推动之后，下一根变得很小，而且收在前一根实体内部。' },
        bestRead: { en: 'Momentum paused, so the previous message should not be promoted blindly without follow-through.', zh: '动能暂时停顿了，所以不能不看后续就盲目放大前一根的信息。' },
        driver: { en: 'Smaller overlap candles often mean the market is digesting rather than confirming direction instantly.', zh: '这种缩小且重叠的 K 线，常常说明市场在消化，而不是马上确认方向。' },
        trap: { en: 'Pretending the small overlap candle confirms the same momentum automatically.', zh: '把这种小而重叠的 K 线，自动当成同方向确认。' },
        confirmation: { en: 'Check whether the next expansion candle resolves the pause cleanly.', zh: '看下一根扩张 K 线，能不能把这段停顿干净地解决掉。' },
      },
      {
        id: 'candle-9',
        difficulty: 'foundation',
        conceptTag: 'session-context',
        situation: { en: 'A strong green close appears right into London open after Asia stayed balanced.', zh: '亚洲盘比较平衡，到了伦敦开盘刚好出现一根强势阳线收盘。' },
        bestRead: { en: 'The close matters more because active session liquidity just arrived.', zh: '这根收盘更值得重视，因为真正活跃的时段流动性刚刚进场。' },
        driver: { en: 'Timing improves the relevance of candle information when liquidity expands.', zh: '当流动性扩张时，时段会放大 K 线信息的重要性。' },
        trap: { en: 'Treating a London-opening strong close as no different from a sleepy overnight print.', zh: '把伦敦开盘后的强收盘，和深夜冷清时段的 K 线看成完全一样。' },
        confirmation: { en: 'Check whether the next candles keep extending instead of instantly giving back the open drive.', zh: '看接下来几根是否继续延伸，而不是马上把开盘推动吐回去。' },
      },
      {
        id: 'candle-10',
        difficulty: 'foundation',
        conceptTag: 'doji-context',
        situation: { en: 'A doji forms in the middle of a noisy range with no clear boundary nearby.', zh: '一根十字星出现在嘈杂震荡区间的中间，附近也没有明确边界。' },
        bestRead: { en: 'It is mostly noise here; the candle by itself does not earn much respect.', zh: '在这里它更像噪音，这根 K 线本身不值得太多尊重。' },
        driver: { en: 'Mid-range indecision with no useful location usually carries low decision value.', zh: '区间中间的犹豫信号，若没有位置优势，通常决策价值很低。' },
        trap: { en: 'Treating every doji as a major reversal warning regardless of location.', zh: '不管位置如何，都把十字星当成重大反转警告。' },
        confirmation: { en: 'Check whether price reaches an actual edge or key zone before reacting.', zh: '先看价格会不会走到真正的边界或关键区，再决定要不要反应。' },
      },
      {
        id: 'candle-11',
        difficulty: 'bridge',
        conceptTag: 'follow-through-fail',
        situation: { en: 'A bearish candle closes strong, but the next candle instantly reclaims nearly the whole body.', zh: '一根阴线原本强势收盘，但下一根马上收回了它大部分实体。' },
        bestRead: { en: 'The first bearish message lost quality because the follow-through failed immediately.', zh: '第一根空头信息的质量立刻下降了，因为后续跟进失败。' },
        driver: { en: 'Follow-through failure can downgrade even a strong-looking close.', zh: '就算原本收盘看起来很强，只要后续跟进失败，质量也会下降。' },
        trap: { en: 'Holding the first bearish read stubbornly as if the reclaim never happened.', zh: '像后面的收复根本没发生一样，死守第一根空头判断。' },
        confirmation: { en: 'Check whether the reclaim can hold above the prior bearish body midpoint.', zh: '看收复动作能不能继续守在前面阴线实体中位上方。' },
      },
      {
        id: 'candle-12',
        difficulty: 'bridge',
        conceptTag: 'weak-bounce',
        situation: { en: 'Price bounces from support but each bullish candle closes with noticeable upper wicks.', zh: '价格从支撑位反弹，但每根阳线都带着明显上影收盘。' },
        bestRead: { en: 'Buyers are trying, but they are not yet keeping clean control into the close.', zh: '买方在尝试反推，但还没有在收盘上建立干净控制。' },
        driver: { en: 'Repeated upper wicks suggest upside acceptance is still incomplete.', zh: '连续上影说明上方接受度仍不完整。' },
        trap: { en: 'Calling every green candle “strength” without noticing how much of it gets rejected.', zh: '只要看到阳线就叫强势，却不看它被吐回多少。' },
        confirmation: { en: 'Check whether a later candle can finally close cleanly near its high.', zh: '看后面会不会终于出现一根接近高点收盘的干净阳线。' },
      },
      {
        id: 'candle-13',
        difficulty: 'bridge',
        conceptTag: 'support-hold',
        situation: { en: 'At a prior daily support, gold prints two small green candles that both close in their upper third.', zh: '来到前日线支撑后，黄金连续打出两根小阳线，而且都收在上三分之一。' },
        bestRead: { en: 'The candles are small, but their closes still suggest support is being defended patiently.', zh: '虽然实体不大，但这两次收盘仍说明支撑正在被耐心防守。' },
        driver: { en: 'Small candles can still be useful if their close quality and location agree.', zh: '即使 K 线不大，只要收盘质量和位置都一致，也一样有用。' },
        trap: { en: 'Ignoring them only because they are not big dramatic bars.', zh: '只因为它们不够夸张，就完全忽略这些 K 线。' },
        confirmation: { en: 'Check whether the next candle can expand upward without losing that support base.', zh: '看下一根能否向上扩张，同时不丢掉这段支撑底座。' },
      },
      {
        id: 'candle-14',
        difficulty: 'bridge',
        conceptTag: 'news-wick',
        situation: { en: 'A news release produces a huge wick both ways, and the candle closes near the middle.', zh: '数据公布后出现一根上下都很长的剧烈波动 K 线，最后收在中间。' },
        bestRead: { en: 'The candle shows volatility, but not a clean directional message yet.', zh: '这根 K 线说明波动很大，但还没有给出干净的方向信息。' },
        driver: { en: 'Middle close after two-sided chaos usually means the market is still re-pricing, not settled.', zh: '双向剧烈波动后却收在中间，通常代表市场还在重定价，而不是已经定方向。' },
        trap: { en: 'Pretending the biggest wick automatically gives the clearest signal.', zh: '以为波动最大的一根，自动就是最清楚的信号。' },
        confirmation: { en: 'Check what the next normal candles do once the event shock passes.', zh: '看事件冲击过去后，后面正常节奏的 K 线怎么走。' },
      },
      {
        id: 'candle-15',
        difficulty: 'bridge',
        conceptTag: 'reclaim-close',
        situation: { en: 'Price reclaims a broken intraday level, and the reclaim candle closes strong instead of stalling under it.', zh: '价格把一个失守的日内水平位收回去，而且收复 K 线是强势收盘，不是卡在下方。' },
        bestRead: { en: 'The reclaim deserves attention because the candle finished with control, not hesitation.', zh: '这次收复值得注意，因为收盘体现的是控制力，而不是犹豫。' },
        driver: { en: 'A strong reclaim close improves the odds that the broken level can act supportive again.', zh: '强势的收复收盘，会提高这个水平位重新转成支撑的概率。' },
        trap: { en: 'Treating the reclaim as meaningless until multiple indicators agree first.', zh: '在一堆指标都同意前，直接把这种收复看成没意义。' },
        confirmation: { en: 'Check whether the reclaimed level still holds on the next dip.', zh: '看下一次回踩时，这个重新收回的位置能不能继续守住。' },
      },
      {
        id: 'candle-16',
        difficulty: 'bridge',
        conceptTag: 'trend-pause',
        situation: { en: 'During an uptrend, one red candle prints, but it closes well above the prior higher low.', zh: '在上升趋势里出现一根阴线，但它收盘时仍远高于前面的更高低点。' },
        bestRead: { en: 'This may just be a pause candle, not enough by itself to call a full trend failure.', zh: '这更像一根停顿 K 线，本身还不足以叫作完整趋势失败。' },
        driver: { en: 'One opposite-colour candle matters less when the broader structure remains intact.', zh: '如果更大的结构还在，一根反色 K 线的重要性就会下降。' },
        trap: { en: 'Calling trend reversal immediately just because one red candle appeared.', zh: '只看到一根阴线，就立刻宣布趋势反转。' },
        confirmation: { en: 'Check whether the next candles defend the prior higher low or start breaking it.', zh: '看后面是否继续守住前面的更高低点，还是开始真的破坏它。' },
      },
      {
        id: 'candle-17',
        difficulty: 'bridge',
        conceptTag: 'late-chase',
        situation: { en: 'A final breakout candle closes green but with a shrinking body and obvious upper rejection into resistance.', zh: '最后一根突破阳线虽然还是绿色收盘，但实体缩小，而且顶着阻力留下明显上影。' },
        bestRead: { en: 'The candle is still green, but the quality is deteriorating and late chasing is less attractive.', zh: '虽然还是阳线，但质量正在变差，晚追进去的吸引力明显下降。' },
        driver: { en: 'Deteriorating close quality near resistance weakens the continuation message.', zh: '在阻力附近，收盘质量恶化会削弱延续信息。' },
        trap: { en: 'Assuming the breakout is equally strong simply because the candle colour stayed green.', zh: '只因为颜色还是阳线，就以为突破强度完全没变。' },
        confirmation: { en: 'Check whether price can still hold above the breakout shelf after the weak-looking close.', zh: '看这种偏弱收盘后，价格还能不能继续守在突破平台上方。' },
      },
      {
        id: 'candle-18',
        difficulty: 'bridge',
        conceptTag: 'range-rejection',
        situation: { en: 'At the top of a range, price prints a candle with a large upper wick and closes back inside the band.', zh: '在区间上沿，价格打出一根大上影 K 线，并收回到区间内部。' },
        bestRead: { en: 'That candle fits range rejection logic better than trend-breakout logic.', zh: '这根 K 线更符合区间拒绝逻辑，而不是趋势突破逻辑。' },
        driver: { en: 'Close back inside the range matters more than the brief push through the edge.', zh: '重新收回区间内部，比短暂冲出边界更重要。' },
        trap: { en: 'Calling it a valid breakout because price briefly printed above the range ceiling.', zh: '只因为价格短暂冲出区间上沿，就认定这是有效突破。' },
        confirmation: { en: 'Check whether the next candle keeps rotating back into the range middle.', zh: '看下一根是否继续朝区间中部回转。' },
      },
      {
        id: 'candle-19',
        difficulty: 'bridge',
        conceptTag: 'slow-strength',
        situation: { en: 'Price advances slowly with several modest bullish candles, but most of them close in their upper half and keep making progress.', zh: '价格不是暴冲，而是靠几根中等阳线慢慢推高，但大多都收在上半部，而且持续推进。' },
        bestRead: { en: 'The move can still be healthy even without dramatic candles because the closes keep showing acceptance.', zh: '就算 K 线不夸张，这段走势仍可能很健康，因为收盘持续在显示接受度。' },
        driver: { en: 'Steady upper-half closes can signal real acceptance even without explosive momentum.', zh: '持续收在上半部，就算不暴力，也可能代表真实接受。' },
        trap: { en: 'Dismissing the move as weak only because it is not flashy.', zh: '只因为走势不花哨，就把它直接当成弱。' },
        confirmation: { en: 'Check whether pullbacks stay shallow while the upper-half closes continue.', zh: '看回踩是否持续偏浅，同时上半部收盘是否还能延续。' },
      },
      {
        id: 'candle-20',
        difficulty: 'bridge',
        conceptTag: 'close-vs-pattern',
        situation: { en: 'Two candles look visually similar, but one closes strong at support and the other closes weak in the middle of nowhere.', zh: '两根 K 线外形看上去很像，但一根是在支撑位强收盘，另一根却是在图中央偏弱收盘。' },
        bestRead: { en: 'The support-location strong close deserves far more respect than the lookalike candle in poor location.', zh: '那根在支撑位强收盘的 K 线，远比图中央那根长得像的更值得重视。' },
        driver: { en: 'Location and close quality matter more than surface pattern resemblance.', zh: '位置和收盘质量，比表面形态像不像更重要。' },
        trap: { en: 'Treating them as equal because the candle shapes look almost the same.', zh: '只因为两根长得差不多，就把它们看成同等重要。' },
        confirmation: { en: 'Check whether the better-located candle also gets better reaction from the next bars.', zh: '再看位置更好的那根，是否也得到后续更好的反应。' },
      },
    ];

    return buildScenarioQuestionBank('candle', scenarios, {
      accurateStatement: {
        en: 'Read the close, the wick, and the next reaction together instead of worshipping pattern names.',
        zh: '把收盘、影线和后续反应一起看，而不是迷信形态名称。',
      },
      falseStatement: {
        en: 'Candle names matter more than where the candle closed or what happened next.',
        zh: 'K 线名称比收盘位置和后续反应更重要。',
      },
    });
  }

  function buildMarketStructureQuestionBank() {
    const scenarios = [
      {
        id: 'structure-1',
        difficulty: 'foundation',
        conceptTag: 'hh-hl',
        situation: { en: 'Gold prints higher highs and higher lows, and each pullback stays above the previous swing low.', zh: '黄金持续做出更高高点和更高低点，而且每次回调都守在前一个摆动低点上方。' },
        bestRead: { en: 'This is constructive bullish structure, not random green noise.', zh: '这更像建设性的多头结构，而不是随机上涨噪音。' },
        driver: { en: 'The sequence of higher highs and higher lows is what gives the trend its shape.', zh: '真正赋予趋势形状的，是更高高点和更高低点的顺序。' },
        trap: { en: 'Fading the move only because price already looks high on the screen.', zh: '只因为价格看起来已经很高，就直接逆着去做。' },
        confirmation: { en: 'Check whether the next pullback still defends the most recent higher low.', zh: '看下一次回调时，最近那个更高低点是否继续被守住。' },
      },
      {
        id: 'structure-2',
        difficulty: 'foundation',
        conceptTag: 'll-lh',
        situation: { en: 'Price keeps making lower lows and lower highs, and each rebound fails beneath the prior bounce peak.', zh: '价格持续做出更低低点和更低高点，而且每次反弹都过不了前一个反弹高点。' },
        bestRead: { en: 'This is orderly bearish structure, not just a few random red candles.', zh: '这更像有秩序的空头结构，而不是几根随便的阴线。' },
        driver: { en: 'Lower-high failures tell you sellers are still controlling the reclaim attempts.', zh: '更低高点的失败，说明卖方仍在控制每次收复动作。' },
        trap: { en: 'Buying every dip just because the move already looks oversold.', zh: '只因为看起来跌很多了，就去接每一次下跌。' },
        confirmation: { en: 'Check whether the next rebound also stalls below the prior lower high.', zh: '看下一次反弹时，是否仍卡在前一个更低高点下方。' },
      },
      {
        id: 'structure-3',
        difficulty: 'foundation',
        conceptTag: 'sweep-vs-break',
        situation: { en: 'Price dips below the last pullback low but quickly reclaims it and pushes to a fresh intraday high.', zh: '价格短暂跌破最近回调低点后很快收回，随后又推向新的日内高点。' },
        bestRead: { en: 'That looks more like a brief sweep or shakeout than a confirmed structure failure.', zh: '这更像一次短暂扫流动性或甩盘，而不是确认结构失败。' },
        driver: { en: 'The sequence was repaired quickly, so one dip below a level is not enough by itself.', zh: '顺序很快被修复，所以单次跌破还不足以下结论。' },
        trap: { en: 'Calling every sweep of a prior low a full reversal immediately.', zh: '只要扫到前低，就立刻宣布完全反转。' },
        confirmation: { en: 'Check whether the reclaimed low keeps holding on the next pullback.', zh: '看被收回的低点，在下一次回踩时能否继续守住。' },
      },
      {
        id: 'structure-4',
        difficulty: 'foundation',
        conceptTag: 'sequence-break',
        situation: { en: 'A prior higher low fails, the bounce back is weak, and the next lower high starts rejecting price.', zh: '原本的更高低点失守，反弹收复也偏弱，接着新的更低高点开始压住价格。' },
        bestRead: { en: 'This is a meaningful structural deterioration because the sequence itself changed.', zh: '这属于有意义的结构恶化，因为顺序本身已经变了。' },
        driver: { en: 'Failure of the higher low plus a weak reclaim is much more serious than one fast wick.', zh: '更高低点失守再加弱收复，比单次快速影线严重得多。' },
        trap: { en: 'Ignoring the break because the bigger chart still “feels bullish”.', zh: '明明结构已坏，却还因为大图感觉偏多就完全忽略。' },
        confirmation: { en: 'Check whether the new lower high continues to cap price on the next bounce.', zh: '看下一次反弹时，这个新的更低高点是否继续压住价格。' },
      },
      {
        id: 'structure-5',
        difficulty: 'foundation',
        conceptTag: 'range-middle',
        situation: { en: 'Price is overlapping in the middle of a band with no clean impulse or defended swing edge.', zh: '价格在区间中部来回重叠，没有干净推动波，也没有被明确守住的摆动边界。' },
        bestRead: { en: 'Structure is unclear here, so conviction should stay light instead of forced.', zh: '这里的结构偏模糊，所以信心应该放轻，而不是硬做判断。' },
        driver: { en: 'No clear swing hierarchy usually means lower-quality structure information.', zh: '当摆动层级不清楚时，结构信息通常就比较低质量。' },
        trap: { en: 'Pretending every choppy overlap has a hidden trend if you zoom hard enough.', zh: '硬要把这种重叠震荡看成隐藏趋势，只是因为你放大得够久。' },
        confirmation: { en: 'Check whether price reaches a meaningful edge before deciding the playbook.', zh: '先看价格会不会走到一个真正有意义的边界，再决定剧本。' },
      },
      {
        id: 'structure-6',
        difficulty: 'foundation',
        conceptTag: 'impulse-quality',
        situation: { en: 'A bullish push expands fast, but the pullback that follows gives back almost the whole move.', zh: '一段多头推动波冲得很快，但后面的回调几乎把整个推动都吐回去了。' },
        bestRead: { en: 'That impulse was not as healthy as it first looked because too much ground was surrendered.', zh: '这段推动波没有看上去那么健康，因为后面丢掉了太多空间。' },
        driver: { en: 'A healthy structure usually does not give back nearly all of its impulse immediately.', zh: '健康结构通常不会马上把推动波的大部分空间都吐掉。' },
        trap: { en: 'Judging the move only by the speed of the impulse and ignoring the pullback quality.', zh: '只看推动波冲多快，完全不看回调质量。' },
        confirmation: { en: 'Check whether buyers can reclaim the midpoint of that impulse cleanly.', zh: '看买方能否把那段推动波的中位干净收回来。' },
      },
      {
        id: 'structure-7',
        difficulty: 'foundation',
        conceptTag: 'defended-swing',
        situation: { en: 'A pullback tags a prior swing low, rejects it, and the next candles start lifting again.', zh: '一次回调碰到前摆动低点后被拒绝，接着后面的 K 线又开始上抬。' },
        bestRead: { en: 'The defended swing low strengthens the continuation case.', zh: '这个被守住的摆动低点，会强化延续逻辑。' },
        driver: { en: 'When a known swing is defended and price reacts upward, the structure is still functioning.', zh: '当一个已知摆动点被守住并向上反应时，说明结构还在工作。' },
        trap: { en: 'Ignoring the defended swing and chasing only after price is extended again.', zh: '无视这个被守住的摆动点，只想等价格再次拉高后才追进去。' },
        confirmation: { en: 'Check whether the next push can take out the prior local high.', zh: '看下一次上推能不能突破前一个局部高点。' },
      },
      {
        id: 'structure-8',
        difficulty: 'foundation',
        conceptTag: 'local-vs-major',
        situation: { en: 'One tiny internal low breaks, but the major swing low that defines the trend is still far below.', zh: '一个很小的内部低点被跌破了，但真正定义趋势的大摆动低点还远在下方。' },
        bestRead: { en: 'The chart may be weakening locally, but the major structure has not fully broken yet.', zh: '局部结构也许在转弱，但大的结构还没有完全坏掉。' },
        driver: { en: 'Not every tiny internal break deserves the same weight as a major swing failure.', zh: '不是每个小内部破坏，都跟大摆动失守一样重要。' },
        trap: { en: 'Treating a minor internal break as full trend invalidation automatically.', zh: '把一个很小的内部破坏，自动当成整段趋势完全失效。' },
        confirmation: { en: 'Check whether the larger swing low is later threatened or still defended.', zh: '看后面更大的摆动低点，会不会也被威胁，还是继续被守住。' },
      },
      {
        id: 'structure-9',
        difficulty: 'foundation',
        conceptTag: 'higher-high-fail',
        situation: { en: 'Price makes a fresh high, but the next pullback immediately undercuts the prior higher low.', zh: '价格刚做出新高，下一次回调却立刻跌穿了前面的更高低点。' },
        bestRead: { en: 'That new high loses value because the supportive sequence failed too quickly.', zh: '这个新高的价值会下降，因为支撑它的顺序太快就坏掉了。' },
        driver: { en: 'A higher high without a surviving higher low underneath is weaker continuation evidence.', zh: '若下面的更高低点守不住，那么上面的新高就不是很强的延续证据。' },
        trap: { en: 'Believing the new high alone proves the structure is still perfect.', zh: '只因为做了新高，就以为结构仍然完美无缺。' },
        confirmation: { en: 'Check whether price can reclaim back above the broken higher-low zone fast.', zh: '看价格能不能很快重新站回那个被破坏的更高低点区域。' },
      },
      {
        id: 'structure-10',
        difficulty: 'foundation',
        conceptTag: 'failed-reclaim',
        situation: { en: 'After breaking down, price bounces but keeps stalling under the breakdown shelf.', zh: '跌破之后价格虽有反弹，但每次都卡在原本的跌破平台下方。' },
        bestRead: { en: 'That weak reclaim supports bearish structure continuation.', zh: '这种弱收复更支持空头结构延续。' },
        driver: { en: 'Failed reclaim tells you sellers still control the retest area.', zh: '收复失败说明卖方仍控制着回测区域。' },
        trap: { en: 'Calling the move neutral just because price bounced once after the breakdown.', zh: '只因为跌破后反弹过一次，就说走势已经中性。' },
        confirmation: { en: 'Check whether the next selloff starts from below that same shelf again.', zh: '看下一次下跌是否又从这个平台下方启动。' },
      },
      {
        id: 'structure-11',
        difficulty: 'bridge',
        conceptTag: 'session-impulse',
        situation: { en: 'London creates a clean bullish impulse, and New York only retraces shallowly before price continues up.', zh: '伦敦时段打出干净多头推动，到了纽约也只是浅回踩，然后价格继续上走。' },
        bestRead: { en: 'The sequence still looks healthy because the active-session handover did not break the structure.', zh: '这段顺序仍然健康，因为活跃时段切换后并没有把结构打坏。' },
        driver: { en: 'Shallow retrace across session handover is often a strong continuation clue.', zh: '跨时段切换仍只是浅回踩，通常是很强的延续线索。' },
        trap: { en: 'Shorting automatically at New York open just because another session started.', zh: '只因为纽约开盘了，就自动去反手做空。' },
        confirmation: { en: 'Check whether the London higher low still survives through New York volatility.', zh: '看伦敦留下的更高低点，能不能扛住纽约波动。' },
      },
      {
        id: 'structure-12',
        difficulty: 'bridge',
        conceptTag: 'equal-highs',
        situation: { en: 'Price approaches the same high twice without clean breakout or deep rejection yet.', zh: '价格连续两次靠近同一个高点，但还没有干净突破，也没有深度拒绝。' },
        bestRead: { en: 'Structure is unresolved here; the chart is testing a decision point rather than offering certainty.', zh: '这里的结构还没解决，图表是在测试决策点，而不是给出确定答案。' },
        driver: { en: 'Repeated tests of the same high can precede breakout or rejection, so sequence is still incomplete.', zh: '连续测试同一高点，既可能突破也可能拒绝，所以顺序还没完成。' },
        trap: { en: 'Acting like the outcome is already obvious before the market shows acceptance or rejection.', zh: '在市场还没给出接受或拒绝前，就假装结果已经很明显。' },
        confirmation: { en: 'Check whether the next reaction is a clean breakout hold or a failure back into range.', zh: '看下一次反应，是干净站稳突破，还是失败回到区间。' },
      },
      {
        id: 'structure-13',
        difficulty: 'bridge',
        conceptTag: 'choppy-overlap',
        situation: { en: 'Several candles overlap heavily, and every push gets pulled back before making a clear new swing.', zh: '连续几根 K 线高度重叠，每次推进都会被拉回，始终做不出清晰新摆动。' },
        bestRead: { en: 'The structure is messy, so forcing trend logic here is lower quality.', zh: '这种结构很乱，硬套趋势逻辑会比较低质量。' },
        driver: { en: 'Heavy overlap usually means weak structure clarity and lower-quality continuation reads.', zh: '大量重叠通常代表结构清晰度低，延续判断质量也会下降。' },
        trap: { en: 'Pretending a strong trend exists simply because one candle looked exciting.', zh: '只因为某一根 K 线看起来刺激，就硬说存在强趋势。' },
        confirmation: { en: 'Check whether price can finally separate from the overlap zone and defend that move.', zh: '看价格能不能真正脱离重叠区，并把那段脱离守住。' },
      },
      {
        id: 'structure-14',
        difficulty: 'bridge',
        conceptTag: 'supportive-pullback',
        situation: { en: 'A pullback lands inside prior demand, holds above the previous swing low, and then closes back green.', zh: '回调落进前需求区，守在上一个摆动低点之上，随后又重新收出阳线。' },
        bestRead: { en: 'That pullback still supports continuation because the structure absorbed it well.', zh: '这个回调仍支持延续，因为结构把它吸收得不错。' },
        driver: { en: 'Holding above the prior swing low while reclaiming green is supportive sequence behaviour.', zh: '守在前摆动低点之上，同时重新收回阳线，是偏支持的顺序行为。' },
        trap: { en: 'Calling the trend broken simply because any pullback happened at all.', zh: '只要出现回调，就立刻说趋势坏了。' },
        confirmation: { en: 'Check whether the next push can revisit or exceed the prior high.', zh: '看下一次上推，能不能回到或超越前高。' },
      },
      {
        id: 'structure-15',
        difficulty: 'bridge',
        conceptTag: 'macro-pressure',
        situation: { en: 'Gold structure was bullish, but yields spike and the latest higher low is now under pressure.', zh: '黄金原本结构偏多，但收益率突然拉升，最近那个更高低点开始承压。' },
        bestRead: { en: 'Structure should be re-tested carefully because outside pressure is now challenging the sequence.', zh: '这时要重新仔细检验结构，因为外部压力正在挑战原本顺序。' },
        driver: { en: 'Macro pressure does not erase structure instantly, but it can put key swings at risk.', zh: '宏观压力不会立刻抹掉结构，但会让关键摆动点进入危险区。' },
        trap: { en: 'Ignoring the new pressure and assuming the old structure must keep working unchanged.', zh: '完全无视新的压力，还以为旧结构一定会照常工作。' },
        confirmation: { en: 'Check whether the latest higher low survives or fails under the new pressure.', zh: '看最新那个更高低点，在新压力下到底守住还是失守。' },
      },
      {
        id: 'structure-16',
        difficulty: 'bridge',
        conceptTag: 'range-vs-trend',
        situation: { en: 'Highs are flat, lows are rising slightly, but price keeps snapping back inside the same band.', zh: '高点横着，低点略微抬高，但价格还是不断被拉回同一个区间里。' },
        bestRead: { en: 'This is still not clean trend structure yet; the band is still dominating behaviour.', zh: '这还不能算干净趋势结构，主导行为的仍然是那条区间带。' },
        driver: { en: 'Until price accepts outside the band, the internal sequence still behaves more like rotation.', zh: '在真正站稳区间外之前，内部顺序更像轮动而不是趋势。' },
        trap: { en: 'Calling trend immediately just because one side of the range looks slightly stronger.', zh: '只因为区间某一边稍微强一点，就马上叫趋势。' },
        confirmation: { en: 'Check whether the next move finally accepts outside the band instead of rotating back again.', zh: '看下一步是否终于站稳区间外，而不是又转回区间中。' },
      },
      {
        id: 'structure-17',
        difficulty: 'bridge',
        conceptTag: 'late-break',
        situation: { en: 'Price breaks a prior low late in the move, but the follow-through after the break is poor.', zh: '价格在走势后段跌破前低，但跌破之后几乎没有像样的跟进。' },
        bestRead: { en: 'The break exists, but its quality is questionable because the sequence did not accelerate cleanly.', zh: '这个破坏虽然发生了，但质量存疑，因为顺序并没有干净加速。' },
        driver: { en: 'Meaningful structural breaks often show better follow-through than a tired late break.', zh: '真正有分量的结构破坏，通常会比这种疲态后段跌破更有后续。' },
        trap: { en: 'Treating every late break as equally strong just because the line got crossed.', zh: '只因为线被穿了，就把所有后段跌破都看成同样强。' },
        confirmation: { en: 'Check whether sellers can build a lower high after the break or not.', zh: '看跌破后，卖方能不能再做出一个更低高点。' },
      },
      {
        id: 'structure-18',
        difficulty: 'bridge',
        conceptTag: 'rebuild-sequence',
        situation: { en: 'After a messy chop, price begins making cleaner higher lows and finally accepts above the prior cap.', zh: '经历一段混乱重叠后，价格开始做出更干净的更高低点，最后也站上前面压制位。' },
        bestRead: { en: 'The structure may be rebuilding into something more bullish as the sequence cleans up.', zh: '结构可能正在重新搭建成更偏多的样子，因为顺序开始变干净。' },
        driver: { en: 'Cleaned-up sequence plus acceptance above the cap matters more than the earlier chop.', zh: '更干净的顺序再加上站上压制位，比前面的杂乱震荡更重要。' },
        trap: { en: 'Staying anchored to the old messy phase even after the sequence improves.', zh: '就算顺序已经改善，还是死守之前那段混乱阶段的旧印象。' },
        confirmation: { en: 'Check whether the breakout shelf now acts as support on retest.', zh: '看突破平台回踩后，是否开始转成支撑。' },
      },
      {
        id: 'structure-19',
        difficulty: 'bridge',
        conceptTag: 'impulse-loss',
        situation: { en: 'A rally makes a new high, but each following candle loses more momentum and the next pullback grows deeper.', zh: '一段上涨虽然创出新高，但后面每根 K 线都越来越没力，下一次回调也变得更深。' },
        bestRead: { en: 'Structure may still be up, but the trend quality is deteriorating and deserves more caution.', zh: '结构可能还没完全转坏，但趋势质量正在恶化，需要更谨慎。' },
        driver: { en: 'Deteriorating impulse quality often shows up before structure fully fails.', zh: '推动波质量恶化，常常会先于完整结构失败出现。' },
        trap: { en: 'Pretending a new high means quality cannot be worsening underneath.', zh: '只因为出了新高，就假装内部质量不可能变差。' },
        confirmation: { en: 'Check whether the next pullback still stops above the prior higher low.', zh: '看下一次回调，是否仍停在前一个更高低点上方。' },
      },
      {
        id: 'structure-20',
        difficulty: 'bridge',
        conceptTag: 'location-sequence',
        situation: { en: 'Price is near a major daily resistance while the intraday sequence still looks upward.', zh: '价格已经靠近日线大阻力，但日内顺序看起来还在向上。' },
        bestRead: { en: 'The structure can still be up, but the location makes continuation less efficient to chase blindly.', zh: '结构可以仍偏上，但这个位置会让盲追延续变得没那么高效。' },
        driver: { en: 'Sequence and location must be read together, not as isolated truths.', zh: '顺序和位置必须一起读，不能各看各的。' },
        trap: { en: 'Assuming upward sequence means every long entry remains equally attractive everywhere.', zh: '以为只要顺序向上，任何位置做多都同样吸引。' },
        confirmation: { en: 'Check whether resistance gets accepted through or starts rejecting the sequence.', zh: '看阻力是被站稳突破，还是开始拒绝这段顺序。' },
      },
    ];

    return buildScenarioQuestionBank('structure', scenarios, {
      accurateStatement: {
        en: 'A structure break matters when the sequence changes, not just when one line gets poked through.',
        zh: '真正有意义的结构破坏，是顺序被改掉，而不只是某条线被短暂刺穿。',
      },
      falseStatement: {
        en: 'Any single violation of a prior swing automatically proves a full reversal.',
        zh: '只要前摆动点被碰穿一次，就自动证明彻底反转。',
      },
    });
  }

  function buildSupportResistanceQuestionBank() {
    const scenarios = [
      {
        id: 'zone-1',
        difficulty: 'foundation',
        conceptTag: 'reaction-area',
        situation: { en: 'Price reacts several times within a 6-dollar shelf rather than one exact tick.', zh: '价格多次在一个 6 美元宽的平台里反应，而不是精确卡在单一点位。' },
        bestRead: { en: 'That level should be treated as a zone or shelf, not a laser-precise line.', zh: '这种位置更应该被当成区域或平台，而不是激光般精确的一条线。' },
        driver: { en: 'Repeated reaction inside an area is stronger evidence than one exact-touch fantasy.', zh: '在一段区域里反复反应，比幻想只认一个精确点更有现实意义。' },
        trap: { en: 'Calling the level invalid the moment price wicks a little through the line.', zh: '价格只要多刺穿一点点，就立刻判定关键位失效。' },
        confirmation: { en: 'Check whether behaviour changes inside that shelf, not just at one price print.', zh: '看行为有没有在这个平台里改变，而不是只看某一个报价。' },
      },
      {
        id: 'zone-2',
        difficulty: 'foundation',
        conceptTag: 'strong-location',
        situation: { en: 'A zone lines up with a prior swing high, London rejection, and later breakout-retest hold.', zh: '某个区域同时对齐了前高、伦敦时段拒绝，以及之后的突破回踩守住。' },
        bestRead: { en: 'That is a high-quality zone because it has memory from multiple reactions.', zh: '这属于高质量区域，因为它有多次反应留下的记忆。' },
        driver: { en: 'Multiple meaningful reactions make a zone worth more respect.', zh: '多次有意义的反应，会让一个区域更值得尊重。' },
        trap: { en: 'Treating it as equal to any random pause in the middle of the chart.', zh: '把它和图中间任何随便停过一次的位置看成一样。' },
        confirmation: { en: 'Check whether price still responds there when retested again.', zh: '看下次再回到这里时，价格是否仍有反应。' },
      },
      {
        id: 'zone-3',
        difficulty: 'foundation',
        conceptTag: 'weak-location',
        situation: { en: 'A trader highlights a midpoint where price paused once, but there is no strong prior rejection or swing there.', zh: '交易者特别圈出图中央一个只停过一次的位置，但那里没有明显拒绝或关键摆动。' },
        bestRead: { en: 'That is a weak zone candidate and probably deserves less weight.', zh: '这属于偏弱的候选区域，通常不该给太多权重。' },
        driver: { en: 'One minor pause without stronger location context is low-quality level information.', zh: '只有一次小停顿、却缺少更强的位置背景，通常属于低质量水平位信息。' },
        trap: { en: 'Giving every little pause the same importance as a real swing or session level.', zh: '把每一个小停顿都给到和前高前低、时段位一样的分量。' },
        confirmation: { en: 'Check whether the zone has any broader structure or session reason behind it.', zh: '看这个区域背后有没有更大的结构或时段逻辑支持。' },
      },
      {
        id: 'zone-4',
        difficulty: 'foundation',
        conceptTag: 'role-reversal',
        situation: { en: 'Resistance breaks cleanly, then the first pullback lands back on that shelf and buyers defend it.', zh: '阻力位被干净突破后，第一次回踩回到那个平台，买方又把它守住。' },
        bestRead: { en: 'This supports a resistance-to-support role reversal story.', zh: '这更支持“阻力转支撑”的角色互换逻辑。' },
        driver: { en: 'Break plus hold on retest is what gives the flipped zone credibility.', zh: '真正让角色互换有可信度的，是突破之后回踩还能守住。' },
        trap: { en: 'Calling role reversal confirmed before the retest even happens.', zh: '还没等到回踩验证，就先宣布角色互换已经成立。' },
        confirmation: { en: 'Check whether the retest shelf survives under the next dip.', zh: '看这个回踩平台，在下一次小回落里能不能继续守住。' },
      },
      {
        id: 'zone-5',
        difficulty: 'foundation',
        conceptTag: 'failed-role-reversal',
        situation: { en: 'Price breaks above resistance, but the retest falls back through the old shelf and cannot reclaim it.', zh: '价格虽然站上阻力，但回踩时又跌回旧平台下方，而且再也收不回来。' },
        bestRead: { en: 'The role-reversal idea failed because the zone did not hold when tested.', zh: '这个角色互换逻辑失败了，因为区域在真正被测试时没守住。' },
        driver: { en: 'A broken shelf that cannot be reclaimed loses the supportive story quickly.', zh: '一旦平台失守后又收不回来，支撑故事就会很快失色。' },
        trap: { en: 'Still insisting the zone is valid just because it used to matter once.', zh: '只因为它以前重要过一次，就坚持这个区域现在还有效。' },
        confirmation: { en: 'Check whether the old shelf now starts capping price from above instead.', zh: '看这个旧平台会不会反过来开始从上方压住价格。' },
      },
      {
        id: 'zone-6',
        difficulty: 'foundation',
        conceptTag: 'session-level',
        situation: { en: 'Gold revisits the London low during New York, and that same area triggers another sharp bounce.', zh: '纽约时段里，黄金再次回到伦敦低点附近，而那个区域又引发一段急弹。' },
        bestRead: { en: 'That session low is proving itself as a meaningful reaction zone.', zh: '这个时段低点正在证明自己是有意义的反应区域。' },
        driver: { en: 'Session highs and lows often matter because many traders watched or traded them already.', zh: '时段高低点之所以重要，是因为很多交易者本来就看着它、甚至在它附近成交。' },
        trap: { en: 'Ignoring session levels because they are not classic textbook support lines.', zh: '只因为它不是教科书里的传统支撑线，就忽略时段位。' },
        confirmation: { en: 'Check whether the next revisit still gets defended or finally breaks cleanly.', zh: '看下次再回到这里时，是继续被守住，还是终于被干净跌穿。' },
      },
      {
        id: 'zone-7',
        difficulty: 'foundation',
        conceptTag: 'consumed-zone',
        situation: { en: 'A support zone has already been touched and bounced from four separate times in one session.', zh: '同一个支撑区在一个时段里已经被碰了四次，而且每次都弹起来。' },
        bestRead: { en: 'The zone may be getting consumed, so later bounces deserve less automatic trust.', zh: '这个区域可能正在被消耗，所以后面的反弹不该再被自动信任。' },
        driver: { en: 'Repeated hits can weaken a zone, especially when each bounce gets less convincing.', zh: '区域被反复撞击会逐渐变弱，尤其当每次反弹都越来越没力时。' },
        trap: { en: 'Assuming the fifth touch is as strong as the first touch just because the line still exists.', zh: '只因为线还画在那里，就以为第五次和第一次一样强。' },
        confirmation: { en: 'Check whether each rebound is shrinking and whether a clean break is becoming more likely.', zh: '看每次反弹是否在缩小，以及干净破位是否越来越接近。' },
      },
      {
        id: 'zone-8',
        difficulty: 'foundation',
        conceptTag: 'fresh-zone',
        situation: { en: 'A breakout-retest area is being revisited for the first time since the breakout happened.', zh: '某个突破回踩区域，自从突破后这是第一次重新回访。' },
        bestRead: { en: 'A first retest often deserves more respect than a zone that has already been used repeatedly.', zh: '第一次回踩，通常比已经被反复使用的区域更值得尊重。' },
        driver: { en: 'Freshness matters because the zone has not yet been consumed by repeated testing.', zh: '新鲜度很重要，因为区域还没有被反复测试消耗掉。' },
        trap: { en: 'Treating a first retest and a fifth retest as identical setups.', zh: '把第一次回踩和第五次回踩当成完全一样的 setup。' },
        confirmation: { en: 'Check whether the first touch produces a sharp behavioural response.', zh: '看第一次碰触时，是否出现清楚的行为反应。' },
      },
      {
        id: 'zone-9',
        difficulty: 'foundation',
        conceptTag: 'overmarking',
        situation: { en: 'A chart is covered with many tiny levels so that every candle touches something.', zh: '一张图被画满各种小水平位，导致每根 K 线看起来都像碰到了什么。' },
        bestRead: { en: 'The chart is overmarked, which reduces clarity and encourages emotional trading.', zh: '这张图已经过度标线，会降低清晰度并放大情绪化交易。' },
        driver: { en: 'Too many levels make every move feel significant, even when it is not.', zh: '线太多时，每一个小波动都会看起来像很重要，其实并不是。' },
        trap: { en: 'Thinking more lines automatically means more precision and better analysis.', zh: '以为线画得越多，就越精准、分析越强。' },
        confirmation: { en: 'Check which zones actually changed behaviour before keeping them on the chart.', zh: '只保留那些真正改变过行为的区域，其余就该删掉。' },
      },
      {
        id: 'zone-10',
        difficulty: 'foundation',
        conceptTag: 'daily-level',
        situation: { en: 'Intraday price is now pressing into a daily resistance shelf that caused a major rejection earlier this week.', zh: '日内价格正压向本周早些时候曾造成大幅拒绝的日线阻力平台。' },
        bestRead: { en: 'That daily shelf deserves more attention than a random intraday midpoint nearby.', zh: '这个日线平台比旁边随便的日内中间位更值得重视。' },
        driver: { en: 'Higher-timeframe zones often matter more because more market participants recognised them.', zh: '高时间框架的区域常更重要，因为更多参与者注意过它。' },
        trap: { en: 'Ignoring a major daily shelf because the lower timeframe still looks clean.', zh: '只因为小级别看起来还干净，就完全忽略大日线平台。' },
        confirmation: { en: 'Check whether price gets accepted through the shelf or rejected back from it.', zh: '看价格是被真正站稳穿过去，还是从这个平台被压回来。' },
      },
      {
        id: 'zone-11',
        difficulty: 'bridge',
        conceptTag: 'zone-width',
        situation: { en: 'One trader draws a razor-thin line, while another marks the full wick-to-close reaction pocket.', zh: '一个交易者只画一条非常细的线，另一个则标出从影线到收盘形成的整段反应口袋。' },
        bestRead: { en: 'The broader reaction pocket is often more realistic if that is how price actually behaved there.', zh: '如果价格本来就是在那一整段区域里反应，那么画出更完整的反应口袋更现实。' },
        driver: { en: 'Zone width should reflect actual reaction behaviour, not forced geometric neatness.', zh: '区域宽度应反映真实反应行为，而不是为了图面整齐而强行收窄。' },
        trap: { en: 'Making the zone unrealistically thin just to feel precise.', zh: '为了让自己感觉更精准，就把区域硬画得过薄。' },
        confirmation: { en: 'Check whether price repeatedly reacts inside the wider pocket, not just at one tick.', zh: '看价格是不是反复在较宽区域里反应，而不是只碰一个点。' },
      },
      {
        id: 'zone-12',
        difficulty: 'bridge',
        conceptTag: 'breakout-hold',
        situation: { en: 'Price pushes above resistance, but the first candle above the zone closes weak and the next one slips back inside.', zh: '价格推上阻力区，但站在上方的第一根 K 线收得偏弱，下一根马上又滑回区域内。' },
        bestRead: { en: 'The breakout has poor quality because the zone did not hold as accepted support.', zh: '这个突破质量偏差，因为区域没有以“被接受的支撑”形式守住。' },
        driver: { en: 'Acceptance above a zone matters more than a temporary push through it.', zh: '真正站稳接受，比临时冲过去更重要。' },
        trap: { en: 'Calling it valid just because price spent one candle above the zone.', zh: '只因为价格有一根 K 线站到区域上方，就宣布有效。' },
        confirmation: { en: 'Check whether price can quickly reclaim above the zone again or stays trapped below.', zh: '看价格能不能很快重新站上区域，还是继续被困在下方。' },
      },
      {
        id: 'zone-13',
        difficulty: 'bridge',
        conceptTag: 'confluence-zone',
        situation: { en: 'A level lines up with prior day high, London rejection, and a VWAP reclaim shelf during New York.', zh: '某个位置同时贴合前日高点、伦敦拒绝位，以及纽约时段 VWAP 收复平台。' },
        bestRead: { en: 'That zone deserves extra respect because several independent references agree there.', zh: '这个区域值得额外重视，因为多个独立参考都汇聚在这里。' },
        driver: { en: 'Confluence improves zone quality when the references are genuinely independent.', zh: '当这些参考彼此独立时，共振会提高区域质量。' },
        trap: { en: 'Ignoring the zone because no single line there looks perfect by itself.', zh: '只因为没有某一条线“完美无缺”，就忽视整个区域。' },
        confirmation: { en: 'Check whether price behaviour actually changes there instead of assuming confluence is enough by itself.', zh: '看价格行为是否真的在这里改变，而不是只靠“共振”两个字。' },
      },
      {
        id: 'zone-14',
        difficulty: 'bridge',
        conceptTag: 'false-confidence',
        situation: { en: 'A trader claims a level is strong because it worked once, but the reaction was small and quickly erased.', zh: '有交易者说某个水平位很强，因为它曾经有效过一次，但那次反应很小而且很快被抹掉。' },
        bestRead: { en: 'One small reaction is not enough proof that the zone deserves heavy trust.', zh: '只有一次很小的反应，还不足以证明这个区域值得高度信任。' },
        driver: { en: 'Reaction quality matters as much as reaction count.', zh: '反应质量和反应次数一样重要。' },
        trap: { en: 'Counting every tiny touch as major evidence that the level is powerful.', zh: '把每一次很小的碰触都算成证明这个水平位很强的大证据。' },
        confirmation: { en: 'Check whether later reactions from the zone are strong, fast, and behaviour-changing.', zh: '看之后从该区域发出的反应，是否够强、够快、且真的改变行为。' },
      },
      {
        id: 'zone-15',
        difficulty: 'bridge',
        conceptTag: 'location-vs-bias',
        situation: { en: 'The macro bias is bullish, but price is trading directly into a fresh resistance zone that has not been cleared yet.', zh: '大背景偏多，但价格正直接撞进一个还没真正清掉的新鲜阻力区。' },
        bestRead: { en: 'Bias can stay bullish while the exact location still makes fresh longs less efficient.', zh: '偏多背景可以继续存在，但当前位置仍会让新的多单不够高效。' },
        driver: { en: 'Location decides trade efficiency even when the broader direction is supportive.', zh: '就算大方向支持，位置仍然决定这笔交易高不高效。' },
        trap: { en: 'Believing bullish bias means resistance no longer matters.', zh: '以为只要大背景偏多，阻力就不再重要。' },
        confirmation: { en: 'Check whether resistance gets accepted through before adding conviction.', zh: '先看阻力是否被真正接受突破，再增加信心。' },
      },
      {
        id: 'zone-16',
        difficulty: 'bridge',
        conceptTag: 'sweep-zone',
        situation: { en: 'A support zone gets swept, but price immediately reclaims the full shelf and closes back above it.', zh: '支撑区被扫穿后，价格立刻把整个平台收回来，并重新收在上方。' },
        bestRead: { en: 'The sweep does not kill the zone automatically if the full shelf is reclaimed fast.', zh: '只要整个平台被快速收回，这次扫穿并不会自动让区域失效。' },
        driver: { en: 'Fast reclaim can restore the zone’s relevance after a brief liquidity raid.', zh: '快速收回，能在一次短暂扫流动性后重新恢复区域的重要性。' },
        trap: { en: 'Declaring the zone dead forever just because price pierced it once.', zh: '只因为价格穿过一次，就宣布这个区域永远失效。' },
        confirmation: { en: 'Check whether the shelf continues to hold from above after the reclaim.', zh: '看收回后，这个平台能否继续在上方守住。' },
      },
      {
        id: 'zone-17',
        difficulty: 'bridge',
        conceptTag: 'mid-chart-clutter',
        situation: { en: 'Most of the marked levels now sit in the middle of current price action rather than at obvious turns.', zh: '图上大多数标出来的线，现在都堆在当前价格中间，而不是明显转折点上。' },
        bestRead: { en: 'The chart likely needs cleanup because those middle levels are adding clutter more than edge.', zh: '这张图大概率需要清理，因为这些中间位增加的是杂讯，不是优势。' },
        driver: { en: 'Useful levels usually frame decisions at edges, not suffocate every candle in the middle.', zh: '有用的水平位通常是帮助你在边界做决策，而不是在中间把每根 K 线都勒住。' },
        trap: { en: 'Keeping every old line forever because deleting it feels like losing information.', zh: '觉得删线就像失去信息，所以把旧线永远留着。' },
        confirmation: { en: 'Check which zones still frame real decisions and remove the rest.', zh: '保留那些仍在框定真实决策的区域，其余的就删掉。' },
      },
      {
        id: 'zone-18',
        difficulty: 'bridge',
        conceptTag: 'retest-quality',
        situation: { en: 'Price revisits a breakout shelf, but the bounce is tiny and sellers quickly press it back down.', zh: '价格再次回到突破平台，但反弹很小，卖方又很快把它压回去。' },
        bestRead: { en: 'The retest quality is weak, so the zone is not proving itself as strong support yet.', zh: '这次回踩质量偏弱，所以该区域还没证明自己是强支撑。' },
        driver: { en: 'Weak reaction quality means the zone deserves less trust even if it is in the right location.', zh: '即使位置看起来对，只要反应质量弱，这个区域也不该被太信任。' },
        trap: { en: 'Calling the zone valid purely because price touched it where expected.', zh: '只因为价格碰到了“预期中的位置”，就宣布区域有效。' },
        confirmation: { en: 'Check whether a later retest produces stronger defence or a clean breakdown instead.', zh: '看后面再来一次时，是会出现更强防守，还是干净破位。' },
      },
      {
        id: 'zone-19',
        difficulty: 'bridge',
        conceptTag: 'daily-vs-intraday',
        situation: { en: 'An intraday support sits slightly above a major daily support shelf, and price is descending toward both.', zh: '一个日内支撑位在上方不远处，下面更深一点还有一个更重要的日线支撑平台，而价格正往两者方向回落。' },
        bestRead: { en: 'Both levels matter, but the daily shelf likely carries more weight if the intraday line fails.', zh: '两个位置都值得看，但若上面的日内支撑失效，下方日线平台通常更有分量。' },
        driver: { en: 'Higher-timeframe memory often outweighs a small intraday level when the market drops into both.', zh: '当价格同时压向两者时，高时间框架记忆往往比小日内位更有份量。' },
        trap: { en: 'Acting as if only the nearest tiny line matters and the daily shelf is irrelevant.', zh: '只盯最近那条小线，好像下面的日线平台完全不存在。' },
        confirmation: { en: 'Check how price behaves at the intraday line and whether it escalates into the daily shelf next.', zh: '看价格在日内线的反应，以及之后会不会进一步测试日线平台。' },
      },
      {
        id: 'zone-20',
        difficulty: 'bridge',
        conceptTag: 'clean-chart',
        situation: { en: 'After removing weak levels, only three major zones remain, and the chart suddenly looks quieter.', zh: '删掉弱水平位后，图上只剩下三个大区域，画面突然安静很多。' },
        bestRead: { en: 'That is usually an improvement because cleaner maps help you wait for better decisions.', zh: '这通常是进步，因为更干净的地图会逼你等更好的决策点。' },
        driver: { en: 'Cleaner charts reduce the temptation to force a trade at every small movement.', zh: '更干净的图，会减少你在每个小波动上硬要找单的冲动。' },
        trap: { en: 'Thinking the chart became worse only because it now has fewer lines.', zh: '只因为线变少了，就觉得图变差了。' },
        confirmation: { en: 'Check whether the remaining zones still cover the market’s real decision points.', zh: '看留下来的区域，是否仍能覆盖市场真正的决策点。' },
      },
    ];

    return buildScenarioQuestionBank('zone', scenarios, {
      accurateStatement: {
        en: 'A level earns respect when location, memory, and reaction quality agree, not just because a line can be drawn there.',
        zh: '一个水平位之所以值得尊重，是因为位置、记忆和反应质量同时成立，而不是因为你能在那里画一条线。',
      },
      falseStatement: {
        en: 'Any place where price once paused deserves the same weight as a major zone.',
        zh: '只要价格停过一次的地方，就该和重要区域拥有同样权重。',
      },
    });
  }

  function buildMultiTimeframeQuestionBank() {
    const scenarios = [
      {
        id: 'mtf-1',
        difficulty: 'foundation',
        conceptTag: 'top-down-bias',
        situation: { en: 'H1 is trending higher with clean higher highs, while M5 is pulling back into a prior breakout shelf.', zh: 'H1 明显在走高，结构是干净的高点抬高；同时 M5 正回踩到前面突破后的平台。' },
        bestRead: { en: 'Use H1 for bias and treat the M5 pullback as a possible execution area, not as a reason to short blindly.', zh: '应该先用 H1 定方向，再把 M5 的回踩看成可能的执行区，而不是因为小级别回落就盲目做空。' },
        driver: { en: 'Higher timeframe structure tells you what kind of setup deserves attention; lower timeframe refines location.', zh: '高时间框架负责告诉你该看哪种 setup；低时间框架负责细化位置。' },
        trap: { en: 'Giving M5 equal authority to H1 just because both charts are on the screen.', zh: '只因为两个图都打开着，就把 M5 和 H1 看成同等权重。' },
        confirmation: { en: 'Check whether the M5 pullback actually stabilises and respects the H1 direction.', zh: '要看 M5 回踩后有没有稳住，并继续配合 H1 的方向。' },
      },
      {
        id: 'mtf-2',
        difficulty: 'foundation',
        conceptTag: 'execution-vs-bias',
        situation: { en: 'The trader says the M1 chart looks bearish, but H4 is still holding a major bullish support zone.', zh: '交易者说 M1 看起来偏空，但 H4 仍然守在一个很关键的多头支撑区上方。' },
        bestRead: { en: 'The lower timeframe weakness may only be noise inside a higher-timeframe support area.', zh: '这类超小级别的走弱，很可能只是高周期支撑区里的噪音。' },
        driver: { en: 'Lower-timeframe movement must be interpreted inside the higher-timeframe location.', zh: '小级别波动必须放进高周期的位置背景里解读。' },
        trap: { en: 'Assuming every bearish M1 sequence automatically overrules a major H4 support.', zh: '以为只要 M1 出现空头节奏，就能自动推翻 H4 的关键支撑。' },
        confirmation: { en: 'Check whether H4 support actually breaks or whether M1 weakness gets absorbed.', zh: '重点是看 H4 支撑有没有真的失守，还是 M1 的弱势被吸收掉。' },
      },
      {
        id: 'mtf-3',
        difficulty: 'foundation',
        conceptTag: 'same-chart-confusion',
        situation: { en: 'A beginner keeps switching from H1 to M15 to M5 and changes bias every time the candle colour changes.', zh: '初学者一直在 H1、M15、M5 之间切来切去，只要 K 线颜色一变就换方向。' },
        bestRead: { en: 'They are mixing different jobs of different timeframes instead of assigning each chart a role.', zh: '这代表他把不同时间框架的职责混在一起了，而不是给每个图明确分工。' },
        driver: { en: 'Without role separation, timeframe switching creates emotional bias changes instead of cleaner analysis.', zh: '如果没有分工，切换周期只会制造情绪化改方向，而不是更清晰的分析。' },
        trap: { en: 'Believing more timeframe switching automatically means more precision.', zh: '以为切换周期越多，就一定越精准。' },
        confirmation: { en: 'Check whether each timeframe has a fixed job such as bias, structure, or entry timing.', zh: '要看每个周期有没有固定职责，例如偏向、结构、或进场时机。' },
      },
      {
        id: 'mtf-4',
        difficulty: 'foundation',
        conceptTag: 'bias-mismatch',
        situation: { en: 'Daily is range-bound, H1 is near the top of that range, and M5 suddenly prints a strong bullish breakout candle.', zh: '日线还在区间里，H1 已经靠近区间上沿，而 M5 突然拉出一根很强的突破阳线。' },
        bestRead: { en: 'The small bullish breakout should be judged carefully because it is pressing into higher-timeframe range resistance.', zh: '这个小级别突破不能直接追，因为它正好撞上更高周期的区间阻力。' },
        driver: { en: 'Higher-timeframe location can make an impressive lower-timeframe move much less efficient.', zh: '更高周期的位置，可能会让一个看起来很强的小级别动作变得不高效。' },
        trap: { en: 'Chasing the M5 impulse without checking where H1 or Daily are sitting.', zh: '只看 M5 冲出去就追单，完全不检查 H1 或日线位置。' },
        confirmation: { en: 'Check whether price gets accepted through the larger range top before trusting continuation.', zh: '要看价格能不能真正站稳更大区间上沿，再去相信延续。' },
      },
      {
        id: 'mtf-5',
        difficulty: 'foundation',
        conceptTag: 'entry-refinement',
        situation: { en: 'H1 bias is bullish and M15 is holding a support shelf, but M1 is still chopping aggressively.', zh: 'H1 偏多，M15 也守着支撑平台，但 M1 还在很激烈地来回乱震。' },
        bestRead: { en: 'Wait for M1 to clean up before using it for entry timing; bias does not mean instant execution.', zh: '应该先等 M1 整理清楚，再拿来做进场时机；有偏向不代表要立刻执行。' },
        driver: { en: 'Execution timeframe is for timing quality, not for forcing trades the moment bias appears.', zh: '执行周期是拿来优化时机的，不是偏向一出现就逼自己立刻下单。' },
        trap: { en: 'Entering immediately just to feel aligned with the higher timeframe.', zh: '为了“跟高周期一致”就立刻冲进去。' },
        confirmation: { en: 'Check for cleaner M1 structure before pressing the trade.', zh: '先看 M1 有没有变成更干净的结构，再考虑执行。' },
      },
      {
        id: 'mtf-6',
        difficulty: 'foundation',
        conceptTag: 'timeframe-role',
        situation: { en: 'A trader uses H4 to place entries and M1 to decide the macro trend.', zh: '有交易者拿 H4 来找精确进场，却拿 M1 来决定大方向。' },
        bestRead: { en: 'The roles are reversed in an unhelpful way.', zh: '这种用法把时间框架的角色反过来了，而且没有帮助。' },
        driver: { en: 'Broad structure usually belongs to higher timeframes, while precise timing belongs to lower ones.', zh: '大结构通常属于高周期，精确 timing 通常属于低周期。' },
        trap: { en: 'Thinking any timeframe can do any job equally well.', zh: '以为任何周期都可以同样胜任任何工作。' },
        confirmation: { en: 'Check whether the chosen timeframe matches the decision being made.', zh: '看所选周期是否真的匹配当前要做的决策。' },
      },
      {
        id: 'mtf-7',
        difficulty: 'foundation',
        conceptTag: 'countertrend-risk',
        situation: { en: 'M15 prints a bearish reversal pattern, but H1 and H4 are both still trending higher cleanly.', zh: 'M15 出现了一个看起来像反转的空头形态，但 H1 和 H4 仍然干净地往上。' },
        bestRead: { en: 'That short idea is countertrend and should be treated as lower-quality unless bigger structure changes.', zh: '这个做空想法属于逆势，除非更大结构也开始变化，否则质量偏低。' },
        driver: { en: 'Small reversal patterns matter less when larger trend structure is still intact.', zh: '如果更大的趋势结构还完好，小级别反转形态的权重就会低很多。' },
        trap: { en: 'Treating one M15 pattern as if it instantly flips the whole market.', zh: '把一套 M15 形态当成可以瞬间翻转整个市场。' },
        confirmation: { en: 'Check whether H1 starts losing structure instead of assuming the M15 signal is enough.', zh: '应该看 H1 有没有开始失去结构，而不是默认 M15 一个信号就够了。' },
      },
      {
        id: 'mtf-8',
        difficulty: 'foundation',
        conceptTag: 'alignment',
        situation: { en: 'Daily is bullish, H1 is bullish, and M5 is now pulling back into support after an impulse leg.', zh: '日线偏多，H1 也偏多，M5 在一段推动后正回踩到支撑区。' },
        bestRead: { en: 'This is the kind of alignment that usually creates cleaner continuation logic.', zh: '这类上下周期同向、再配合小级别回踩，通常才是更干净的延续逻辑。' },
        driver: { en: 'When bias, structure, and location line up, execution decisions become simpler.', zh: '当偏向、结构和位置都站在同一边时，执行决策会简单很多。' },
        trap: { en: 'Ignoring the pullback and entering only after price is already stretched.', zh: '无视回踩位置，非要等价格已经拉伸后才追进去。' },
        confirmation: { en: 'Check whether the support area actually holds and produces continuation.', zh: '要看支撑区是否真的守住，并带来延续。' },
      },
      {
        id: 'mtf-9',
        difficulty: 'foundation',
        conceptTag: 'too-many-frames',
        situation: { en: 'The trader is checking Monthly, Weekly, Daily, H4, H1, M30, M15, M5, and M1 before every trade.', zh: '交易者每次下单前都要看月线、周线、日线、H4、H1、M30、M15、M5、M1。' },
        bestRead: { en: 'This often creates paralysis rather than better execution.', zh: '这种做法很多时候带来的不是更好执行，而是分析瘫痪。' },
        driver: { en: 'A small number of clearly assigned timeframes is often more useful than checking every possible chart.', zh: '少量但分工清楚的周期，通常比把所有周期都看一遍更有用。' },
        trap: { en: 'Assuming more screens always means more edge.', zh: '以为看的图越多，优势就一定越大。' },
        confirmation: { en: 'Check whether any timeframe in the stack is redundant and not changing decisions.', zh: '看这堆周期里有没有一些其实是重复的、不会改变决策。' },
      },
      {
        id: 'mtf-10',
        difficulty: 'foundation',
        conceptTag: 'daily-bias-h1-entry',
        situation: { en: 'Daily has already reclaimed a major support zone, and the trader is now waiting on H1 for a cleaner continuation entry.', zh: '日线已经重新收复一个关键支撑区，交易者现在在等 H1 给出更干净的延续进场。' },
        bestRead: { en: 'That is a sensible top-down workflow: higher timeframe establishes the idea, lower timeframe times the trade.', zh: '这就是合理的自上而下流程：高周期先给想法，低周期再负责 timing。' },
        driver: { en: 'Bias should normally be established before entry precision is pursued.', zh: '通常应该先建立偏向，再去追求进场精度。' },
        trap: { en: 'Entering on Daily alone without waiting for any executable structure.', zh: '只看日线就直接进，不等任何可执行结构。' },
        confirmation: { en: 'Check whether H1 gives a tradable continuation pattern rather than guessing.', zh: '要看 H1 有没有给出可交易的延续结构，而不是靠猜。' },
      },
      {
        id: 'mtf-11',
        difficulty: 'bridge',
        conceptTag: 'bias-reset',
        situation: { en: 'H1 was bullish all morning, but the New York session breaks the last major swing low and fails to reclaim it.', zh: 'H1 早上一直偏多，但纽约时段跌破了最近关键摆动低点，而且收不回来。' },
        bestRead: { en: 'The higher-timeframe bias may be resetting, so old long ideas deserve re-evaluation.', zh: '更高一级的偏向可能在重置，原本的做多逻辑需要重新评估。' },
        driver: { en: 'Bias is not permanent; it changes when the timeframe that created it loses structure.', zh: '偏向不是永久的；当建立偏向的那个周期失去结构时，它就会变。' },
        trap: { en: 'Staying blindly bullish just because earlier bias had been bullish.', zh: '只因为前面一直偏多，就继续盲目看多。' },
        confirmation: { en: 'Check whether the broken H1 structure remains lost or gets reclaimed quickly.', zh: '要看被破坏的 H1 结构是持续失守，还是很快被收回。' },
      },
      {
        id: 'mtf-12',
        difficulty: 'bridge',
        conceptTag: 'range-bias',
        situation: { en: 'Daily is not trending; it is rotating inside a wide range, while M15 keeps printing mini trends.', zh: '日线并不趋势，而是在一个宽区间里来回轮动；但 M15 一直会出现很多小趋势。' },
        bestRead: { en: 'Those M15 mini trends still live inside a larger range environment.', zh: '这些 M15 的小趋势，依然都只是更大区间环境里的局部波动。' },
        driver: { en: 'Timeframe context prevents you from mistaking local movement for global trend.', zh: '时间框架背景能避免你把局部走势误认成全局趋势。' },
        trap: { en: 'Calling the market fully trending just because the execution timeframe looks directional.', zh: '只因为执行周期看起来有方向，就宣布整个市场都在趋势。' },
        confirmation: { en: 'Check where the smaller move sits inside the larger Daily range.', zh: '看这个小级别走势，究竟处在日线大区间的什么位置。' },
      },
      {
        id: 'mtf-13',
        difficulty: 'bridge',
        conceptTag: 'location-over-signal',
        situation: { en: 'M5 produces a clean bullish entry pattern, but it is forming directly under a major H1 resistance shelf.', zh: 'M5 给出一个很干净的多头入场形态，但它正好出现在 H1 的重要阻力下方。' },
        bestRead: { en: 'The signal quality is reduced by poor higher-timeframe location.', zh: '由于高周期位置不好，这个信号的质量被明显打折。' },
        driver: { en: 'Location can outweigh signal beauty when the bigger chart says space is limited.', zh: '当更大级别告诉你空间有限时，位置的重要性可以盖过信号好不好看。' },
        trap: { en: 'Ranking entry patterns without checking where they sit on the higher timeframe.', zh: '只给形态打分，却不先看它落在高周期的哪里。' },
        confirmation: { en: 'Check whether resistance clears before trusting the lower-timeframe setup fully.', zh: '先看阻力有没有清掉，再决定是否真正信任这个小级别 setup。' },
      },
      {
        id: 'mtf-14',
        difficulty: 'bridge',
        conceptTag: 'confirmation-delay',
        situation: { en: 'The trader waits for Weekly, Daily, H4, H1, and M15 all to say the exact same thing before acting.', zh: '交易者一定要等周线、日线、H4、H1、M15 全都说完全一样的话才愿意行动。' },
        bestRead: { en: 'That can become over-confirmation and cause very late entries.', zh: '这很容易变成过度确认，最后导致进场太晚。' },
        driver: { en: 'Good multi-timeframe analysis should simplify action, not delay it endlessly.', zh: '好的多周期分析应该帮助行动更清楚，而不是无限拖延。' },
        trap: { en: 'Thinking more confirmation is always better no matter the cost.', zh: '以为确认越多就一定越好，完全不管代价。' },
        confirmation: { en: 'Check whether the extra timeframe checks are improving decisions or just postponing them.', zh: '看多出来的周期确认，究竟是在提升决策，还是只是在拖延决策。' },
      },
      {
        id: 'mtf-15',
        difficulty: 'bridge',
        conceptTag: 'session-execution',
        situation: { en: 'Daily bias is bullish, H1 support is nearby, and London open is approaching with expected volatility expansion.', zh: '日线偏多，H1 支撑就在附近，同时伦敦开盘快到了，波动预期会上升。' },
        bestRead: { en: 'The setup quality depends not only on timeframe alignment but also on whether session timing supports execution.', zh: '这笔 setup 的质量，不只取决于周期对齐，还取决于时段 timing 是否支持执行。' },
        driver: { en: 'Timeframe alignment works best when combined with a session that can actually move price.', zh: '周期对齐最好还要配合一个能真正推动价格的时段。' },
        trap: { en: 'Ignoring timing and acting as if every minute gives the same execution quality.', zh: '忽略 timing，仿佛每一分钟的执行质量都一样。' },
        confirmation: { en: 'Check whether the session open delivers the expected response from support.', zh: '要看时段开启后，支撑位有没有给出预期中的反应。' },
      },
      {
        id: 'mtf-16',
        difficulty: 'bridge',
        conceptTag: 'micro-noise',
        situation: { en: 'M1 keeps printing fake breaks around a level, while M15 remains cleanly balanced above support.', zh: 'M1 在某个位置附近不断假突破，但 M15 仍然很干净地守在支撑上方震荡。' },
        bestRead: { en: 'The M1 noise should not automatically override the cleaner M15 picture.', zh: '这些 M1 噪音不该自动推翻更干净的 M15 结构。' },
        driver: { en: 'The execution chart should refine, not emotionally sabotage, the broader setup.', zh: '执行图的职责是细化，而不是情绪化地破坏更大的 setup。' },
        trap: { en: 'Letting every M1 fake break reset the whole trade idea.', zh: '只要 M1 假突破一次，就把整个交易想法全部推倒重来。' },
        confirmation: { en: 'Check whether M15 support still holds while M1 shakes around it.', zh: '重点是看 M15 的支撑在 M1 乱晃时有没有继续守住。' },
      },
      {
        id: 'mtf-17',
        difficulty: 'bridge',
        conceptTag: 'frame-selection',
        situation: { en: 'The trader uses Daily for macro context, H1 for bias, and M5 for execution, and ignores the other charts.', zh: '交易者只用日线看宏观背景、H1 看偏向、M5 看执行，其他图一概不看。' },
        bestRead: { en: 'That can be an excellent workflow if those three frames are enough for the strategy.', zh: '如果这三层已经足够支撑策略，这反而可能是很优秀的流程。' },
        driver: { en: 'Consistency of workflow often matters more than checking every possible timeframe.', zh: '流程的一致性，往往比把所有周期都看一遍更重要。' },
        trap: { en: 'Assuming a simpler framework must be less professional.', zh: '以为流程更简单，就一定比较不专业。' },
        confirmation: { en: 'Check whether those three frames consistently answer context, bias, and timing.', zh: '看这三个周期是否能稳定回答背景、偏向和 timing。' },
      },
      {
        id: 'mtf-18',
        difficulty: 'bridge',
        conceptTag: 'bias-vs-trigger',
        situation: { en: 'The trader knows the H1 bias is bullish, but keeps entering before M5 shows any sign of stabilising.', zh: '交易者知道 H1 偏多，但每次都在 M5 还没稳住前就提前进场。' },
        bestRead: { en: 'They understand bias, but they are skipping the trigger discipline.', zh: '他理解了偏向，但跳过了执行触发条件的纪律。' },
        driver: { en: 'Bias tells you what to prefer; trigger tells you when the trade is actually ready.', zh: '偏向告诉你偏好什么；触发条件告诉你什么时候才真的准备好。' },
        trap: { en: 'Thinking having the right bias is enough to justify any timing.', zh: '以为方向看对了，就足以合理化任何 timing。' },
        confirmation: { en: 'Check whether the execution chart gives a real hold, reclaim, or continuation trigger.', zh: '要看执行图有没有给出真正的守住、收回或延续触发。' },
      },
      {
        id: 'mtf-19',
        difficulty: 'bridge',
        conceptTag: 'compression',
        situation: { en: 'H4 is coiling beneath resistance, H1 is compressing, and M5 keeps faking in both directions.', zh: 'H4 在阻力下方收缩，H1 也在压缩，M5 则来回两边假动作。' },
        bestRead: { en: 'Lower-timeframe confusion is normal when higher timeframes are compressing before expansion.', zh: '当更高周期在扩张前先压缩时，小级别出现混乱是很正常的。' },
        driver: { en: 'Execution noise often increases when larger charts are storing energy.', zh: '更大级别在蓄力时，执行级别的噪音常常会升高。' },
        trap: { en: 'Interpreting every small fake move as a new independent bias.', zh: '把每一个小假动作都解读成一个新的独立偏向。' },
        confirmation: { en: 'Check whether the higher-timeframe compression is still intact before reacting to every M5 wiggle.', zh: '先看更高周期的压缩是否还在，再决定要不要理会每次 M5 的抖动。' },
      },
      {
        id: 'mtf-20',
        difficulty: 'bridge',
        conceptTag: 'bridge-summary',
        situation: { en: 'A trader says, “I only want one chart, because multi-timeframe analysis is confusing.”', zh: '有交易者说：“我只想看一张图，因为多周期分析太容易让人混乱了。”' },
        bestRead: { en: 'The real solution is not one chart versus many charts; it is giving each chosen chart a clear job.', zh: '真正的解决方案不是“一张图还是很多图”，而是给每个选中的周期清楚分工。' },
        driver: { en: 'Confusion usually comes from role confusion, not from the existence of multiple timeframes itself.', zh: '混乱通常来自角色混乱，而不是因为“有多个周期”本身。' },
        trap: { en: 'Treating multi-timeframe work as inherently bad instead of fixing the workflow.', zh: '把多周期分析本身当成坏事，而不是去修正流程。' },
        confirmation: { en: 'Check whether each chart answers one distinct question before adding or removing it.', zh: '在增加或删除某个周期前，先看它是否真的在回答一个明确的问题。' },
      },
    ];

    return buildScenarioQuestionBank('mtf', scenarios, {
      accurateStatement: {
        en: 'Higher timeframe gives context, lower timeframe refines execution, and mixing those jobs creates confusion.',
        zh: '高周期负责背景，低周期负责执行细化；把这两个工作混在一起，就会让分析变乱。',
      },
      falseStatement: {
        en: 'Every timeframe deserves equal authority in every decision.',
        zh: '每一个时间框架在每一种决策里都应该拥有同等权威。',
      },
    });
  }

  function buildIndicatorsQuestionBank() {
    const scenarios = [
      {
        id: 'ind-1',
        difficulty: 'foundation',
        conceptTag: 'indicator-role',
        situation: { en: 'Price is breaking structure cleanly, and the trader asks whether EMA, RSI, and ATR can support that read.', zh: '价格本身已经很干净地破结构了，交易者想知道 EMA、RSI、ATR 能不能拿来辅助这个判断。' },
        bestRead: { en: 'Indicators should be used as supporting evidence, not as replacement for reading price structure.', zh: '指标应该是辅助证据，而不是取代价格结构阅读本身。' },
        driver: { en: 'Indicators work best when they help organise what price is already showing.', zh: '指标最有价值的时候，是帮助整理价格本来就在表达的内容。' },
        trap: { en: 'Ignoring price and outsourcing the whole decision to indicator readings.', zh: '不看价格本身，直接把整个决策外包给指标。' },
        confirmation: { en: 'Check whether the indicator agrees with structure instead of contradicting it blindly.', zh: '应该看指标是否和结构互相印证，而不是盲目唱反调。' },
      },
      {
        id: 'ind-2',
        difficulty: 'foundation',
        conceptTag: 'ema-trend',
        situation: { en: 'Price keeps holding above a rising EMA and each pullback gets bought quickly.', zh: '价格一直守在上升中的 EMA 上方，而且每次回踩都很快被买回去。' },
        bestRead: { en: 'The EMA is acting as a trend filter, not as magical proof by itself.', zh: '这里的 EMA 更像趋势过滤器，而不是单独就能证明一切的魔法线。' },
        driver: { en: 'A rising EMA plus repeated holds can reinforce trend context when price structure already supports it.', zh: '当价格结构本身就支持趋势时，上升 EMA 加上多次守住，能强化趋势背景。' },
        trap: { en: 'Buying only because price touched the EMA once.', zh: '只因为价格碰到一次 EMA 就直接买。' },
        confirmation: { en: 'Check whether price behaviour at the EMA stays constructive across retests.', zh: '要看价格在 EMA 附近的行为，是否在多次回测里都保持建设性。' },
      },
      {
        id: 'ind-3',
        difficulty: 'foundation',
        conceptTag: 'rsi-context',
        situation: { en: 'RSI prints above 70 while price is trending strongly higher with little pullback.', zh: 'RSI 已经超过 70，但价格本身正在强劲上涨，几乎没有回踩。' },
        bestRead: { en: 'High RSI alone does not automatically mean the market must reverse immediately.', zh: '单靠 RSI 偏高，并不等于市场马上一定要反转。' },
        driver: { en: 'Momentum indicators can stay elevated for long periods during healthy trends.', zh: '在健康趋势里，动能指标可以长时间维持在高位。' },
        trap: { en: 'Shorting just because RSI says “overbought.”', zh: '只因为 RSI 显示“超买”就直接做空。' },
        confirmation: { en: 'Check whether price structure is actually weakening before treating RSI as reversal evidence.', zh: '先看价格结构有没有真的转弱，再把 RSI 当反转证据。' },
      },
      {
        id: 'ind-4',
        difficulty: 'foundation',
        conceptTag: 'atr-volatility',
        situation: { en: 'ATR expands sharply after CPI, and the trader wants to keep using the same stop width as before the release.', zh: 'CPI 后 ATR 明显放大，但交易者还想继续用数据前那种一样窄的止损。' },
        bestRead: { en: 'ATR is warning that volatility has changed, so risk placement may need adaptation.', zh: 'ATR 是在提醒你波动环境已经变了，所以风险摆放可能也要调整。' },
        driver: { en: 'Volatility measures help you avoid using normal-day assumptions in abnormal conditions.', zh: '波动指标的价值，就是避免你在异常环境里还套用平常日子的假设。' },
        trap: { en: 'Pretending the market is moving with the same rhythm as before the news.', zh: '假装市场和消息前的节奏完全一样。' },
        confirmation: { en: 'Check whether the average candle range has clearly expanded relative to earlier.', zh: '看平均波幅是否相对早前明显扩大。' },
      },
      {
        id: 'ind-5',
        difficulty: 'foundation',
        conceptTag: 'indicator-conflict',
        situation: { en: 'Price is making higher highs, but one oscillator is starting to diverge slightly.', zh: '价格还在创新高，但某个震荡指标开始出现一点点背离。' },
        bestRead: { en: 'That divergence is a caution flag, not an automatic trend-reversal command.', zh: '这种背离更像提醒你提高警觉，而不是自动发出反转指令。' },
        driver: { en: 'Indicators can warn about weakening momentum without proving that structure has already failed.', zh: '指标可以提醒动能在减弱，但并不能单独证明结构已经坏掉。' },
        trap: { en: 'Acting as if any divergence instantly invalidates a strong uptrend.', zh: '把任何背离都当成能立刻推翻强势上升趋势。' },
        confirmation: { en: 'Check whether price also starts losing follow-through or key support.', zh: '看价格是否也开始失去延续性，或跌破关键支撑。' },
      },
      {
        id: 'ind-6',
        difficulty: 'foundation',
        conceptTag: 'ema-cluster',
        situation: { en: 'Several EMAs are stacked bullishly, and price keeps rejecting the same pullback zone.', zh: '几条 EMA 呈多头排列，同时价格不断在同一个回踩区被买起来。' },
        bestRead: { en: 'The EMAs strengthen the bullish read because they align with structure and behaviour.', zh: '这些 EMA 之所以有帮助，是因为它们和结构、行为反应是同方向的。' },
        driver: { en: 'Indicator confluence matters more when price action is telling the same story.', zh: '当价格行为本身就在讲同一个故事时，指标共振才更有意义。' },
        trap: { en: 'Thinking stacked EMAs are enough even if price starts breaking support badly.', zh: '就算价格已经严重破支撑，仍然觉得 EMA 排列本身就够了。' },
        confirmation: { en: 'Check whether price keeps respecting the same zone rather than only the lines themselves.', zh: '重点要看价格是否持续尊重同一片区域，而不只是“碰到线”而已。' },
      },
      {
        id: 'ind-7',
        difficulty: 'foundation',
        conceptTag: 'indicator-overload',
        situation: { en: 'The chart has RSI, MACD, Stochastics, Bollinger Bands, three EMAs, ATR, and ADX all at once.', zh: '图上同时挂着 RSI、MACD、随机指标、布林带、三条 EMA、ATR 和 ADX。' },
        bestRead: { en: 'This is likely too much indicator layering and may reduce clarity instead of improving it.', zh: '这很可能已经是过度叠指标，降低清晰度多过提升判断力。' },
        driver: { en: 'More indicators often create more noise when they all repeat similar information.', zh: '当很多指标都在重复类似信息时，更多指标通常只会制造更多噪音。' },
        trap: { en: 'Believing a trade is more professional just because the chart looks more complicated.', zh: '以为图越复杂、指标越多，交易就越专业。' },
        confirmation: { en: 'Check whether each indicator has a distinct job or is just duplicating another one.', zh: '看每个指标有没有独立职责，还是只是在重复别人的工作。' },
      },
      {
        id: 'ind-8',
        difficulty: 'foundation',
        conceptTag: 'adx-trend-strength',
        situation: { en: 'ADX rises while price breaks out of a multi-hour balance and keeps extending.', zh: 'ADX 上升，同时价格脱离了几个小时的平衡区并持续扩张。' },
        bestRead: { en: 'ADX is supporting the idea that trend strength is increasing, not predicting direction by itself.', zh: '这里的 ADX 是在支持“趋势强度上升”，但它本身并不负责预测方向。' },
        driver: { en: 'Trend-strength tools help measure commitment, but direction still comes from price and structure.', zh: '趋势强度工具可以衡量投入程度，但方向仍要从价格和结构来判断。' },
        trap: { en: 'Using ADX alone to decide long versus short.', zh: '单靠 ADX 来决定做多还是做空。' },
        confirmation: { en: 'Check whether structure expansion and ADX strength are occurring together.', zh: '要看结构扩张和 ADX 变强是否在同一时间发生。' },
      },
      {
        id: 'ind-9',
        difficulty: 'foundation',
        conceptTag: 'supporting-evidence',
        situation: { en: 'Price reclaims support, volume expands, and EMA slope turns up at the same time.', zh: '价格重新站回支撑，成交活跃度增加，同时 EMA 斜率也开始往上。' },
        bestRead: { en: 'That is good supporting evidence because multiple tools confirm the same price story.', zh: '这属于比较好的辅助证据，因为多个工具都在确认同一段价格故事。' },
        driver: { en: 'Indicators become more useful when they confirm a coherent price-action narrative.', zh: '当指标是在确认一个连贯的价格叙事时，它们才更有价值。' },
        trap: { en: 'Treating the indicator cluster as more important than the support reclaim itself.', zh: '把一堆指标的变化，看得比价格重新站回支撑本身还重要。' },
        confirmation: { en: 'Check whether the reclaim continues to hold after the initial bounce.', zh: '要看重新站回支撑后，后续有没有继续守住。' },
      },
      {
        id: 'ind-10',
        difficulty: 'foundation',
        conceptTag: 'late-indicator',
        situation: { en: 'By the time the indicator fully confirms, price has already moved far away from the best trade location.', zh: '等到指标完全确认的时候，价格已经离最佳交易位置很远了。' },
        bestRead: { en: 'That is the cost of lagging tools: they can validate context while still being late for location.', zh: '这就是滞后型工具的代价：它们可以帮助确认背景，但位置常常已经晚了。' },
        driver: { en: 'Indicators often describe what has already happened better than they predict what comes next.', zh: '指标通常更擅长描述已经发生的事，而不是提前预测下一步。' },
        trap: { en: 'Chasing the market just because the lagging confirmation finally arrives.', zh: '只因为滞后确认终于来了，就去追已经走远的价格。' },
        confirmation: { en: 'Check whether the remaining reward still justifies the late entry.', zh: '要看价格走远后，剩余空间还值不值得追。' },
      },
      {
        id: 'ind-11',
        difficulty: 'bridge',
        conceptTag: 'divergence-context',
        situation: { en: 'RSI divergence appears right into a known daily resistance shelf after a long trend leg.', zh: '在一段长趋势腿之后，价格正好冲到已知日线阻力区，同时 RSI 出现背离。' },
        bestRead: { en: 'That divergence matters more here because it appears in meaningful higher-timeframe location.', zh: '这里的背离会更值得看，是因为它出现在有意义的高周期位置上。' },
        driver: { en: 'Indicator signals gain weight when location and structure make the same warning.', zh: '当位置和结构也在发出同一类警告时，指标信号的权重会更高。' },
        trap: { en: 'Treating divergence the same way everywhere regardless of location.', zh: '不管出现在哪里，都把背离一视同仁地对待。' },
        confirmation: { en: 'Check whether price also loses follow-through near resistance.', zh: '要看价格在阻力附近是否也开始失去延续。' },
      },
      {
        id: 'ind-12',
        difficulty: 'bridge',
        conceptTag: 'indicator-dependency',
        situation: { en: 'The trader cannot take any trade unless every indicator on the chart agrees perfectly.', zh: '交易者只有在图上所有指标都完全一致时，才敢下单。' },
        bestRead: { en: 'This is a form of indicator dependency that can delay or distort good decisions.', zh: '这是一种对指标的依赖，容易拖慢甚至扭曲原本不错的决策。' },
        driver: { en: 'Demanding perfect agreement from imperfect tools often destroys timing.', zh: '要求一堆本来就不完美的工具“完全一致”，往往会毁掉 timing。' },
        trap: { en: 'Believing uncertainty disappears if enough indicators agree.', zh: '以为只要指标够多、够一致，不确定性就会消失。' },
        confirmation: { en: 'Check whether the indicator checklist is helping or just freezing action.', zh: '看这套指标清单是在帮忙，还是只是在冻结行动。' },
      },
      {
        id: 'ind-13',
        difficulty: 'bridge',
        conceptTag: 'ema-break',
        situation: { en: 'Price slices through a popular EMA, but the higher-timeframe support underneath still has not broken.', zh: '价格跌穿了一条很多人爱看的 EMA，但下方高周期支撑其实还没破。' },
        bestRead: { en: 'The EMA break alone does not guarantee trend failure if the bigger support still holds.', zh: '如果更大的支撑还守着，单独跌穿 EMA 并不代表趋势已经失败。' },
        driver: { en: 'An indicator line is weaker evidence than a meaningful structural level.', zh: '单独一条指标线的证据力度，通常弱于真正有意义的结构位。' },
        trap: { en: 'Treating the EMA as more important than the actual support shelf below.', zh: '把 EMA 看得比下方真实的支撑平台还重要。' },
        confirmation: { en: 'Check whether structure also breaks, not just the EMA.', zh: '要确认被破坏的是不是连结构一起，而不只是 EMA。' },
      },
      {
        id: 'ind-14',
        difficulty: 'bridge',
        conceptTag: 'atr-adaptation',
        situation: { en: 'ATR has doubled over the last two sessions, yet the trader still expects tiny candle-by-candle precision.', zh: 'ATR 在过去两天已经翻倍，但交易者仍然期待像平常一样细到每根 K 线的精确度。' },
        bestRead: { en: 'The expectations are mismatched with the volatility regime.', zh: '这种期待和当前的波动环境明显不匹配。' },
        driver: { en: 'ATR is useful because it forces you to respect changing environment rather than static habits.', zh: 'ATR 的价值，就在于逼你尊重环境变化，而不是死守旧习惯。' },
        trap: { en: 'Blaming the setup when the real issue is using quiet-day expectations in a loud market.', zh: '把问题怪在 setup 上，却忽略自己拿“安静日”的期待去面对“躁动市”。' },
        confirmation: { en: 'Check whether stop, target, and position size assumptions still match current ATR.', zh: '要检查止损、目标和仓位假设，是否还匹配当前 ATR。' },
      },
      {
        id: 'ind-15',
        difficulty: 'bridge',
        conceptTag: 'indicator-contradiction',
        situation: { en: 'EMA slope is bullish, RSI is flattening, and ADX is fading while price stalls under resistance.', zh: 'EMA 斜率还是多头，RSI 开始走平，ADX 在走弱，同时价格卡在阻力下面。' },
        bestRead: { en: 'The mixed indicator picture says momentum may be slowing, but the decision still depends on price behaviour at resistance.', zh: '这种混合的指标画面说明动能可能在放慢，但决策仍要看价格在阻力处怎么表现。' },
        driver: { en: 'When indicators disagree, price behaviour at key location should decide the trade, not indicator voting.', zh: '当指标互相打架时，真正该决定交易的是关键位置上的价格行为，而不是指标投票。' },
        trap: { en: 'Trying to average conflicting indicators into fake certainty.', zh: '硬把互相矛盾的指标平均成一种假确定性。' },
        confirmation: { en: 'Check whether resistance rejects, breaks, or accepts price.', zh: '看阻力最终是把价格压回去、被突破，还是被真正接受。' },
      },
      {
        id: 'ind-16',
        difficulty: 'bridge',
        conceptTag: 'macd-substitute',
        situation: { en: 'A trader says they do not need market structure because MACD crossovers already tell them everything.', zh: '有交易者说自己不需要看市场结构，因为 MACD 金叉死叉已经告诉他全部。' },
        bestRead: { en: 'That is over-reliance on one tool and ignores the context MACD cannot replace.', zh: '这属于对单一工具的过度依赖，也忽略了 MACD 无法替代的背景。' },
        driver: { en: 'No single indicator contains full information about trend, location, and risk quality.', zh: '没有任何单一指标能完整包含趋势、位置和风险质量。' },
        trap: { en: 'Using a crossover as if it were a full trading plan.', zh: '把一次金叉死叉当成完整交易计划。' },
        confirmation: { en: 'Check what structure and location say before trusting the crossover.', zh: '先看结构和位置怎么说，再决定能不能信这个 crossover。' },
      },
      {
        id: 'ind-17',
        difficulty: 'bridge',
        conceptTag: 'volume-context',
        situation: { en: 'A breakout occurs on thin participation, and the trader wants to call it fully confirmed.', zh: '某次突破发生时参与度偏薄，但交易者已经想宣布完全确认。' },
        bestRead: { en: 'Weak participation makes the breakout less convincing, even if the candle itself looks good.', zh: '参与度偏薄会让这个突破没那么有说服力，就算蜡烛本身很好看也一样。' },
        driver: { en: 'Participation matters because strong moves usually attract commitment, not emptiness.', zh: '参与度之所以重要，是因为真正强的推动通常会带来承接，而不是空心。' },
        trap: { en: 'Judging the breakout only by candle shape and ignoring participation quality.', zh: '只看蜡烛形状，不看参与质量。' },
        confirmation: { en: 'Check whether follow-through arrives with stronger activity afterward.', zh: '看后续延续时，参与活跃度有没有跟上来。' },
      },
      {
        id: 'ind-18',
        difficulty: 'bridge',
        conceptTag: 'bbands-context',
        situation: { en: 'Price rides the upper Bollinger Band during a strong impulse leg.', zh: '价格在一段强推动里持续贴着布林带上轨走。' },
        bestRead: { en: 'That can reflect trend strength, not necessarily immediate exhaustion.', zh: '这有可能反映的是趋势强度，而不一定代表马上衰竭。' },
        driver: { en: 'Bands describe expansion and stretch, but context decides whether stretch is dangerous or healthy.', zh: '布林带反映的是扩张和拉伸，但拉伸是危险还是健康，要由背景决定。' },
        trap: { en: 'Automatically fading every upper-band ride.', zh: '只要贴着上轨走，就自动反手做空。' },
        confirmation: { en: 'Check whether price starts losing impulse quality before fading the move.', zh: '在考虑反向前，先看价格是否真的开始失去推动质量。' },
      },
      {
        id: 'ind-19',
        difficulty: 'bridge',
        conceptTag: 'clean-stack',
        situation: { en: 'The trader only keeps one trend tool, one momentum tool, and one volatility tool on the chart.', zh: '交易者图上只保留一个趋势工具、一个动能工具、一个波动工具。' },
        bestRead: { en: 'That is often healthier than stacking many overlapping tools without clear purpose.', zh: '这通常比堆很多重叠工具却没有明确目的来得健康。' },
        driver: { en: 'A small, deliberate indicator stack is easier to interpret consistently.', zh: '少量、刻意挑选的指标组合，更容易被稳定地解读。' },
        trap: { en: 'Assuming “more tools” automatically equals “more confirmation.”', zh: '以为“工具更多”就等于“确认更多”。' },
        confirmation: { en: 'Check whether each tool answers a different question.', zh: '看每个工具是否真的在回答不同的问题。' },
      },
      {
        id: 'ind-20',
        difficulty: 'bridge',
        conceptTag: 'bridge-summary',
        situation: { en: 'A beginner asks, “Should I trade from price action or indicators?”', zh: '初学者问：“我应该看价格行为，还是看指标？”' },
        bestRead: { en: 'Price action should lead, and indicators should support or organise that read.', zh: '应该让价格行为当主角，指标负责辅助和整理这个判断。' },
        driver: { en: 'Indicators are strongest when they reinforce a coherent market read instead of replacing it.', zh: '指标最强的时候，是在强化一个已经连贯的市场判断，而不是取代它。' },
        trap: { en: 'Treating price action and indicators as if they must be enemies.', zh: '把价格行为和指标当成非此即彼的敌人。' },
        confirmation: { en: 'Check whether the indicator actually adds clarity or just adds dependence.', zh: '看这个指标是在增加清晰度，还是只是在增加依赖。' },
      },
    ];

    return buildScenarioQuestionBank('indicator', scenarios, {
      accurateStatement: {
        en: 'Indicators are assistants for structure, momentum, and volatility reading, not substitutes for market understanding.',
        zh: '指标是帮助你阅读结构、动能和波动的助手，不是取代市场理解的替身。',
      },
      falseStatement: {
        en: 'A single indicator can replace price action, structure, and context completely.',
        zh: '单一指标可以完全取代价格行为、结构和背景。',
      },
    });
  }

  function buildTradePlanningQuestionBank() {
    const scenarios = [
      {
        id: 'plan-1',
        difficulty: 'foundation',
        conceptTag: 'entry-location',
        situation: { en: 'Price is already extended far above support, but the trader wants to buy immediately because the bias is bullish.', zh: '价格已经明显离支撑很远，但交易者因为偏多，就想立刻直接追多。' },
        bestRead: { en: 'The bias may still be bullish, but the exact entry location is now less efficient.', zh: '偏向也许还是多头，但当前这个进场位置已经不够高效。' },
        driver: { en: 'Trade planning depends on both direction and location, not direction alone.', zh: '交易规划取决于方向和位置，而不只是方向。' },
        trap: { en: 'Assuming bullish bias automatically makes any long entry acceptable.', zh: '以为只要偏多，任何做多进场都算合理。' },
        confirmation: { en: 'Check whether price offers a better pullback or reclaim area before forcing the trade.', zh: '先看价格会不会给出更好的回踩或收回位置，再决定要不要做。' },
      },
      {
        id: 'plan-2',
        difficulty: 'foundation',
        conceptTag: 'stop-placement',
        situation: { en: 'The stop loss is placed inside the obvious support zone instead of beyond the invalidation point.', zh: '止损被放在很明显的支撑区里面，而不是放到真正的失效点后面。' },
        bestRead: { en: 'That stop placement is fragile because normal zone noise can hit it without invalidating the idea.', zh: '这种止损位置很脆弱，因为正常的区间噪音就可能把它打掉，但交易想法未必真的失效。' },
        driver: { en: 'A stop should usually sit beyond the point that proves the trade idea is wrong.', zh: '止损通常应该放在能够证明交易想法错误的位置之后。' },
        trap: { en: 'Using the tightest possible stop only to maximise position size.', zh: '只为了放大仓位，就硬把止损缩到最小。' },
        confirmation: { en: 'Check what price behaviour would genuinely invalidate the setup.', zh: '先想清楚什么样的价格行为，才算真的否定这个 setup。' },
      },
      {
        id: 'plan-3',
        difficulty: 'foundation',
        conceptTag: 'target-selection',
        situation: { en: 'The trader sets take profit at an arbitrary round number without checking structure overhead.', zh: '交易者把止盈随便设在一个整数关口，却没有看上方结构。' },
        bestRead: { en: 'Targets should be connected to structure, liquidity, or realistic travel, not random preference.', zh: '目标位应该和结构、流动性或真实可达空间有关，而不是随便凭喜好设置。' },
        driver: { en: 'Good targets come from where price is likely to react, not from wishful thinking.', zh: '好的目标位来自价格更可能反应的地方，而不是靠想象。' },
        trap: { en: 'Picking numbers that feel good without checking market context.', zh: '只选自己看着舒服的数字，不检查市场背景。' },
        confirmation: { en: 'Check whether there is a logical reaction point before your chosen target.', zh: '看你设的目标之前，有没有更合理的反应位。' },
      },
      {
        id: 'plan-4',
        difficulty: 'foundation',
        conceptTag: 'risk-reward',
        situation: { en: 'A setup risks 12 dollars to target only 6 dollars into nearby resistance.', zh: '一笔 setup 要冒 12 美元风险，但上方近阻力之前只有 6 美元空间。' },
        bestRead: { en: 'The trade is inefficient because the reward is too small relative to the risk and location.', zh: '这笔交易效率很差，因为空间相对风险太小，而且位置也不好。' },
        driver: { en: 'Risk-reward only matters when based on realistic structure, not fantasy extension.', zh: '风险回报只有建立在现实结构上才有意义，不是靠幻想拉伸。' },
        trap: { en: 'Pretending the nearby resistance does not exist in order to force the ratio.', zh: '为了把比例说得好看，就假装近处阻力不存在。' },
        confirmation: { en: 'Check how much clean room price really has before the next barrier.', zh: '看下一道障碍前，价格到底还有多少干净空间。' },
      },
      {
        id: 'plan-5',
        difficulty: 'foundation',
        conceptTag: 'invalidation',
        situation: { en: 'The trade idea was based on support holding, but support has now broken and failed to reclaim.', zh: '这笔交易最初的前提是支撑会守住，但现在支撑已经跌破，而且收不回来。' },
        bestRead: { en: 'The original trade thesis is invalidated, so stubbornly staying in is no longer disciplined.', zh: '原本的交易前提已经被否定，再硬扛就不再是纪律，而是执拗。' },
        driver: { en: 'Invalidation is about the idea being wrong, not about your feelings about the trade.', zh: '失效讲的是交易想法错了，不是你对这笔单的感觉。' },
        trap: { en: 'Staying in because the market might come back eventually.', zh: '因为市场“说不定会回来”，就继续死扛。' },
        confirmation: { en: 'Check whether the reason for entry still objectively exists.', zh: '看最初进场的理由是否还客观存在。' },
      },
      {
        id: 'plan-6',
        difficulty: 'foundation',
        conceptTag: 'tp-scaling',
        situation: { en: 'The trader wants to scale out some size at the first reaction point and leave the rest for a larger target.', zh: '交易者想先在第一反应位减一点仓，剩下的再看更大的目标。' },
        bestRead: { en: 'That can be sensible if the plan is decided before the trade and matches structure.', zh: '如果这是在进场前就定好的计划，而且和结构匹配，这样做是合理的。' },
        driver: { en: 'Scaling works best when it follows a pre-planned structure map, not live panic.', zh: '分批止盈最好建立在预先规划的结构地图上，而不是临场慌张。' },
        trap: { en: 'Randomly taking profit just because the candle temporarily looks scary.', zh: '只因为临时看见一根吓人的 K 线，就随便乱减仓。' },
        confirmation: { en: 'Check whether each scale-out level corresponds to a real structural milestone.', zh: '看每一个减仓位，是否都对应真正的结构里程碑。' },
      },
      {
        id: 'plan-7',
        difficulty: 'foundation',
        conceptTag: 'no-trade',
        situation: { en: 'Bias is decent, but entry is poor, stop is awkward, and target is capped by nearby resistance.', zh: '偏向还不错，但进场差、止损别扭、目标又被近阻力卡住。' },
        bestRead: { en: 'This may simply be a no-trade, even if the directional idea is not crazy.', zh: '这种情况很可能就该放弃，不代表方向错了，只是交易本身不够好。' },
        driver: { en: 'A good market read does not always produce a good trade.', zh: '市场判断不错，不代表一定能形成一笔好交易。' },
        trap: { en: 'Forcing a trade because the directional opinion sounds clever.', zh: '因为方向观点听起来很聪明，就硬要下单。' },
        confirmation: { en: 'Check whether location, risk, and target actually line up well enough to justify action.', zh: '看位置、风险和目标是否真的配合得足够好。' },
      },
      {
        id: 'plan-8',
        difficulty: 'foundation',
        conceptTag: 'entry-trigger',
        situation: { en: 'Price has reached support, but there is still no clear hold, reclaim, or reversal trigger yet.', zh: '价格已经来到支撑，但还没有明显守住、收回或反转触发。' },
        bestRead: { en: 'Location alone is not yet enough; the trade still needs a trigger or behaviour change.', zh: '只有位置还不够，交易仍然需要触发条件或行为变化。' },
        driver: { en: 'Planning separates good location from actual execution readiness.', zh: '交易规划会把“好位置”和“真的可以执行”分开。' },
        trap: { en: 'Entering immediately the moment price touches a marked zone.', zh: '价格一碰到画好的区域就立刻冲进去。' },
        confirmation: { en: 'Check whether the zone produces a real behavioural response first.', zh: '先看这个区域有没有真的带来行为反应。' },
      },
      {
        id: 'plan-9',
        difficulty: 'foundation',
        conceptTag: 'rr-fantasy',
        situation: { en: 'The spreadsheet says the trade has 4R potential, but only if price slices through three major resistance shelves.', zh: '表格上写着这笔单有 4R 空间，但前提是价格得一路穿过三个大阻力平台。' },
        bestRead: { en: 'That 4R expectation is probably fantasy if the path to target is crowded with barriers.', zh: '如果通往目标的路上全是障碍，这种 4R 期待大概率只是幻想。' },
        driver: { en: 'Reward estimates must respect intervening structure, not only final destination.', zh: '收益预估必须尊重途中结构，而不只是盯着最终终点。' },
        trap: { en: 'Advertising huge R-multiples without checking the path price must travel first.', zh: '先喊超大 R 倍数，却不检查价格中途要经过什么。' },
        confirmation: { en: 'Check whether price has clean room or multiple barriers before target.', zh: '看目标前面究竟是干净空间，还是层层障碍。' },
      },
      {
        id: 'plan-10',
        difficulty: 'foundation',
        conceptTag: 'trade-map',
        situation: { en: 'Before entering, the trader already knows entry area, stop area, first target, and invalidation condition.', zh: '进场前，交易者已经明确知道入场区、止损区、第一目标和失效条件。' },
        bestRead: { en: 'That is a healthy trade map because the decision is defined before emotions arrive.', zh: '这就是健康的交易地图，因为决策在情绪进来之前就先定义好了。' },
        driver: { en: 'Planning reduces emotional improvisation during live price movement.', zh: '事前规划可以减少盘中价格波动时的情绪 improvisation。' },
        trap: { en: 'Treating all those decisions as something to figure out only after entry.', zh: '把这些决定都拖到进场之后才临时想。' },
        confirmation: { en: 'Check whether the map still makes sense in current market conditions.', zh: '看这张交易地图在当前市场条件下是否仍然成立。' },
      },
      {
        id: 'plan-11',
        difficulty: 'bridge',
        conceptTag: 'break-even',
        situation: { en: 'The trader moves stop to breakeven immediately after a tiny initial bounce, even though the setup usually needs room.', zh: '交易者只要看到一点点初步反弹，就马上把止损拉到保本，但这个 setup 本来就需要空间。' },
        bestRead: { en: 'That break-even move may be emotionally comforting but structurally premature.', zh: '这种拉保本也许让人心理舒服，但从结构上看太早了。' },
        driver: { en: 'A stop should serve the trade structure, not only your desire to avoid discomfort.', zh: '止损的职责是服务交易结构，而不是只满足你不想难受的情绪。' },
        trap: { en: 'Assuming breakeven is always the “safe” professional move.', zh: '以为拉保本永远都是“安全又专业”的做法。' },
        confirmation: { en: 'Check whether the trade has actually earned the right to tighter protection.', zh: '看这笔单是否真的已经走到值得更紧保护的位置。' },
      },
      {
        id: 'plan-12',
        difficulty: 'bridge',
        conceptTag: 'partial-vs-hold',
        situation: { en: 'Price reaches first target, but structure still looks healthy and no clear reversal appears.', zh: '价格到达第一目标，但结构看起来还健康，也没有明显反转。' },
        bestRead: { en: 'This is where pre-planned management matters; either partial or hold can be valid if chosen deliberately.', zh: '这就是预先规划的重要性；减仓或继续持有都可能合理，关键是事先有计划。' },
        driver: { en: 'Management quality comes from consistency, not from guessing in the moment.', zh: '管理质量来自一致性，而不是盘中临时猜。' },
        trap: { en: 'Changing the whole plan impulsively because the market looks exciting.', zh: '只因为市场看起来很刺激，就临时把整套计划推翻。' },
        confirmation: { en: 'Check whether your original management plan still fits the live structure.', zh: '看原本的管理计划是否仍然适配实时结构。' },
      },
      {
        id: 'plan-13',
        difficulty: 'bridge',
        conceptTag: 'size-vs-stop',
        situation: { en: 'The trader wants a larger position, so they shrink the stop below what the structure really needs.', zh: '交易者为了放更大仓位，把止损缩得比结构真正需要的还小。' },
        bestRead: { en: 'That is backwards: size should adapt to valid stop placement, not the other way around.', zh: '这逻辑是反的：仓位应该配合有效止损，而不是止损去迁就仓位。' },
        driver: { en: 'Risk control starts with where the idea is wrong, then size is adjusted around that.', zh: '风险控制应该先确定“哪里代表想法错了”，再让仓位去配合。' },
        trap: { en: 'Designing the stop around desired profit rather than setup logic.', zh: '为了想赚更多，反过来按利润欲望去设计止损。' },
        confirmation: { en: 'Check whether the stop still sits beyond meaningful invalidation after resizing.', zh: '缩完之后，要看止损是否还在真正的失效点之外。' },
      },
      {
        id: 'plan-14',
        difficulty: 'bridge',
        conceptTag: 'liquidity-target',
        situation: { en: 'There is a visible cluster of equal highs above price, and the trader is considering that area as target.', zh: '价格上方有一堆很明显的等高点，交易者正考虑把那里当目标位。' },
        bestRead: { en: 'That is sensible because visible liquidity often attracts price or at least creates reaction.', zh: '这很合理，因为明显流动性经常会吸引价格，至少也容易引发反应。' },
        driver: { en: 'Targets improve when linked to likely reaction pools instead of arbitrary distance.', zh: '把目标跟更可能发生反应的流动性池挂钩，会比任意距离更合理。' },
        trap: { en: 'Ignoring obvious liquidity and choosing a target with no market logic behind it.', zh: '无视明显流动性，随便设一个没有市场逻辑的目标。' },
        confirmation: { en: 'Check whether a nearer structure is likely to interrupt the path first.', zh: '先看途中有没有更近的结构会先打断这条路径。' },
      },
      {
        id: 'plan-15',
        difficulty: 'bridge',
        conceptTag: 'invalidation-vs-pain',
        situation: { en: 'The trader says, “I know my setup is broken, but I do not want to lock in the loss yet.”', zh: '交易者说：“我知道我的 setup 已经坏了，但我现在还不想认亏。”' },
        bestRead: { en: 'That is emotional resistance, not disciplined trade management.', zh: '这不是纪律化管理，而是情绪上的抗拒。' },
        driver: { en: 'Once invalidation is confirmed, staying in becomes a new gamble, not the old thesis.', zh: '一旦失效成立，继续持有就变成新的赌博，而不是原来的 thesis。' },
        trap: { en: 'Calling emotional hesitation “patience.”', zh: '把情绪拖延包装成“耐心”。' },
        confirmation: { en: 'Check whether the original reason for the trade still survives objectively.', zh: '看原来的交易理由是否还客观存在。' },
      },
      {
        id: 'plan-16',
        difficulty: 'bridge',
        conceptTag: 're-entry',
        situation: { en: 'A good long setup invalidates, but later the zone is reclaimed cleanly with fresh structure.', zh: '一笔原本不错的多头 setup 先失效了，但后来该区域又被干净收回，并重新出现新结构。' },
        bestRead: { en: 'A fresh trade can become valid again, but it should be treated as a new setup, not stubborn continuation of the old one.', zh: '这可能重新变成一笔有效交易，但要把它当新 setup，而不是旧单的执拗延续。' },
        driver: { en: 'Invalidation kills the old idea; reclaim and new structure can create a new one.', zh: '失效会杀掉旧想法；但收回和新结构可能创造新的想法。' },
        trap: { en: 'Pretending the original trade never failed and calling it the same position idea.', zh: '假装原本那笔从未失效，还把它硬说成同一个交易想法。' },
        confirmation: { en: 'Check whether the reclaim is genuine enough to justify a completely new plan.', zh: '看这次收回是否真的足够扎实，值得写一份全新的计划。' },
      },
      {
        id: 'plan-17',
        difficulty: 'bridge',
        conceptTag: 'session-awareness',
        situation: { en: 'Entry looks good, but high-impact data is due in three minutes and spread is already widening.', zh: '进场位置看起来不错，但三分钟后就有高影响数据，而且点差已经开始变宽。' },
        bestRead: { en: 'Even a good-looking plan can become poor execution if event timing changes the environment.', zh: '哪怕原本计划不错，若事件 timing 改变环境，也可能变成糟糕执行。' },
        driver: { en: 'Trade planning must include timing risk, not only chart shape.', zh: '交易规划必须把时间风险算进去，而不是只看图形。' },
        trap: { en: 'Acting as if the chart is frozen and news timing is irrelevant.', zh: '把图表当成静止的，仿佛消息 timing 完全不重要。' },
        confirmation: { en: 'Check whether the setup still deserves action after event risk is considered.', zh: '把事件风险算进去后，再看这笔 setup 还值不值得做。' },
      },
      {
        id: 'plan-18',
        difficulty: 'bridge',
        conceptTag: 'poor-asymmetry',
        situation: { en: 'The stop has to be wide because volatility is high, but the nearest logical target has shrunk because price is late in the move.', zh: '因为波动很大，止损不得不放宽；但因为走势已经很晚，最近合理目标空间又很小。' },
        bestRead: { en: 'This is poor asymmetry, and passing on the trade may be the best decision.', zh: '这是典型的不对称性很差，放弃交易可能才是最佳决策。' },
        driver: { en: 'Good planning includes recognising when the market no longer offers efficient risk-to-opportunity.', zh: '好的规划也包括看懂什么时候市场已经不再提供高效的风险机会比。' },
        trap: { en: 'Trading anyway because the setup once would have been good earlier.', zh: '只因为这套结构如果早点出现会很好，就现在也硬要做。' },
        confirmation: { en: 'Check whether current volatility and remaining space still make the plan worthwhile.', zh: '看当前波动和剩余空间，是否还让这份计划值得执行。' },
      },
      {
        id: 'plan-19',
        difficulty: 'bridge',
        conceptTag: 'bridge-summary',
        situation: { en: 'A beginner asks, “If I think price will go up, is that already a full trading plan?”', zh: '初学者问：“如果我觉得价格会上涨，这就已经算完整交易计划了吗？”' },
        bestRead: { en: 'No. Direction is only one part; you still need entry, invalidation, target, and risk logic.', zh: '还不算。方向只是其中一部分；你还需要进场、失效、目标和风险逻辑。' },
        driver: { en: 'An opinion about direction becomes tradable only after it is converted into a risk-defined plan.', zh: '一个方向观点只有被转换成风险明确的计划后，才算可交易。' },
        trap: { en: 'Confusing market opinion with executable plan.', zh: '把市场观点和可执行计划混为一谈。' },
        confirmation: { en: 'Check whether the trade can be explained with exact if-then management logic.', zh: '看这笔单能不能用明确的 if-then 管理逻辑说清楚。' },
      },
      {
        id: 'plan-20',
        difficulty: 'bridge',
        conceptTag: 'discipline-map',
        situation: { en: 'The trader writes down, “If support holds, I enter. If support breaks, I exit. If price reaches liquidity above, I scale.”', zh: '交易者写下：“如果支撑守住我进场；如果支撑跌破我出场；如果价格到达上方流动性我减仓。”' },
        bestRead: { en: 'That is strong planning language because it translates chart reading into disciplined actions.', zh: '这就是很强的规划语言，因为它把读图转换成了有纪律的动作。' },
        driver: { en: 'Good plans are conditional, specific, and easy to execute under pressure.', zh: '好的计划应该是有条件、够具体、并且在压力下也容易执行。' },
        trap: { en: 'Keeping the plan vague so it can be reinterpreted emotionally later.', zh: '故意把计划写得模糊，好让自己之后情绪化重解释。' },
        confirmation: { en: 'Check whether every important branch already has a response defined.', zh: '看每一个重要分支，是否都已经提前定义好应对。' },
      },
    ];

    return buildScenarioQuestionBank('trade-plan', scenarios, {
      accurateStatement: {
        en: 'A trade plan is direction plus location, invalidation, target, and risk logic written clearly enough to execute.',
        zh: '交易计划是把方向、位置、失效、目标和风险逻辑，写得足够清楚到可以直接执行。',
      },
      falseStatement: {
        en: 'If the bias is right, the rest of the plan does not matter very much.',
        zh: '只要方向看对了，计划里的其他部分其实不太重要。',
      },
    });
  }

  function buildNewsRiskQuestionBank() {
    const scenarios = [
      {
        id: 'news-1',
        difficulty: 'foundation',
        conceptTag: 'high-impact-awareness',
        situation: { en: 'CPI is scheduled in five minutes, and price is sitting exactly at your planned entry zone.', zh: '还有五分钟就要公布 CPI，而价格正好来到你计划中的入场区。' },
        bestRead: { en: 'The setup is now exposed to event risk, so chart quality alone is no longer enough.', zh: '这笔 setup 现在已经暴露在事件风险里，所以单靠图形好看已经不够。' },
        driver: { en: 'High-impact news can override normal technical behaviour temporarily.', zh: '高影响消息会暂时压过平常的技术行为。' },
        trap: { en: 'Entering as if the next five minutes will behave like an ordinary quiet period.', zh: '当成接下来五分钟只是普通平静时段来进场。' },
        confirmation: { en: 'Check whether you truly want exposure through the release itself.', zh: '先确认你是不是真的想带仓穿过这个数据。' },
      },
      {
        id: 'news-2',
        difficulty: 'foundation',
        conceptTag: 'calendar-check',
        situation: { en: 'A trader loses discipline repeatedly because they never check the economic calendar before entering.', zh: '交易者总是莫名被打停损，其中一个原因是他进场前从不看经济日历。' },
        bestRead: { en: 'Ignoring the calendar is a process problem, not just bad luck.', zh: '不看日历属于流程问题，不只是运气差。' },
        driver: { en: 'News awareness is part of risk management, not an optional extra.', zh: '消息 awareness 本来就是风险管理的一部分，不是可有可无的附加项。' },
        trap: { en: 'Treating every surprise event as random bad luck instead of fixable preparation error.', zh: '把每次突发事件都当随机倒霉，而不是可修正的准备错误。' },
        confirmation: { en: 'Check whether the day has any high-impact releases before trusting technical setups.', zh: '在信任技术 setup 前，先看当天有没有高影响数据。' },
      },
      {
        id: 'news-3',
        difficulty: 'foundation',
        conceptTag: 'spread-risk',
        situation: { en: 'Just before the release, spread widens and small candles become erratic around your level.', zh: '数据前，点差变宽，小蜡烛在你的关键位附近开始乱跳。' },
        bestRead: { en: 'Execution quality is deteriorating, even if the level itself still looks valid.', zh: '即便这个关键位本身还合理，执行质量也在恶化。' },
        driver: { en: 'Spread and erratic movement can damage otherwise decent setups.', zh: '点差变宽和乱跳波动，会伤害原本还不错的 setup。' },
        trap: { en: 'Focusing only on the level and pretending microstructure does not matter.', zh: '只盯着关键位，假装微观执行条件不重要。' },
        confirmation: { en: 'Check whether real trading conditions are still acceptable, not only whether the chart looks similar.', zh: '要确认真实交易条件是否还能接受，而不只是图表看起来差不多。' },
      },
      {
        id: 'news-4',
        difficulty: 'foundation',
        conceptTag: 'post-news-chase',
        situation: { en: 'After NFP, gold spikes hard in one direction and the trader wants to chase the first huge candle.', zh: 'NFP 公布后，黄金突然朝一个方向猛冲，交易者想追第一根超大蜡烛。' },
        bestRead: { en: 'That first spike is often poor chasing territory because price discovery is still chaotic.', zh: '第一波大尖刺通常不是好追的位置，因为价格发现过程还很混乱。' },
        driver: { en: 'Immediate post-news candles often reflect disorder more than stable opportunity.', zh: '消息后的第一批大蜡烛，往往更像混乱，而不是稳定机会。' },
        trap: { en: 'Assuming the first explosive candle offers the best risk-adjusted entry.', zh: '以为第一根最爆炸的蜡烛，反而提供最好风险回报。' },
        confirmation: { en: 'Check whether price stabilises or retests before considering follow-through.', zh: '先看价格是否有稳定或回测，再考虑后续延续。' },
      },
      {
        id: 'news-5',
        difficulty: 'foundation',
        conceptTag: 'normal-vs-abnormal',
        situation: { en: 'On a quiet Asian session, price respects support cleanly. During FOMC minutes, the same kind of support breaks and reclaims repeatedly.', zh: '在安静的亚洲时段，价格会很规矩地尊重支撑；但在 FOMC 纪要时，同类型支撑却反复跌破又收回。' },
        bestRead: { en: 'News periods often behave abnormally compared with normal session conditions.', zh: '消息时段的行为，往往和正常时段很不一样。' },
        driver: { en: 'Technical patterns become less clean when macro event flow dominates order flow.', zh: '当宏观事件流主导订单流时，技术形态通常会变得没那么干净。' },
        trap: { en: 'Expecting event periods to respect levels exactly like quiet hours.', zh: '期待消息时段会像平静时段那样完美尊重关键位。' },
        confirmation: { en: 'Check whether the current environment is normal session trade or event-driven trade.', zh: '要先分清现在是正常时段交易，还是事件驱动交易。' },
      },
      {
        id: 'news-6',
        difficulty: 'foundation',
        conceptTag: 'no-trade-window',
        situation: { en: 'The trader has a rule not to open new positions within ten minutes before top-tier data.', zh: '交易者给自己定了一条规则：顶级数据前十分钟不新开仓。' },
        bestRead: { en: 'That is a sensible no-trade window designed to avoid avoidable execution chaos.', zh: '这是一种合理的 no-trade window，目的是避开本来就可避免的执行混乱。' },
        driver: { en: 'Good process often means refusing trades in periods where edge is hard to measure.', zh: '好的流程常常意味着，主动放弃那些优势难以衡量的时段。' },
        trap: { en: 'Treating such rules as “too conservative” without respecting the cost of event chaos.', zh: '不尊重消息混乱的代价，就嫌这种规则“太保守”。' },
        confirmation: { en: 'Check whether the rule improves consistency over many trades, not just one exciting setup.', zh: '看这条规则是否能在长期提升一致性，而不是只盯一笔刺激 setup。' },
      },
      {
        id: 'news-7',
        difficulty: 'foundation',
        conceptTag: 'session-vs-news',
        situation: { en: 'London open usually brings volatility, but today that move will overlap with a major US data release.', zh: '伦敦开盘本来就容易放大波动，但今天它还会和重要美国数据重叠。' },
        bestRead: { en: 'The session effect and event effect are stacking, which raises uncertainty further.', zh: '时段效应和事件效应叠在一起，会进一步放大不确定性。' },
        driver: { en: 'Volatility sources can compound rather than simply add neatly.', zh: '波动来源有时不是简单相加，而是会互相放大。' },
        trap: { en: 'Treating it as “just another London move.”', zh: '把这种情况当成“普通伦敦波动”处理。' },
        confirmation: { en: 'Check whether the market is facing one source of movement or several at once.', zh: '看当前市场面对的是单一波动源，还是多个一起上。' },
      },
      {
        id: 'news-8',
        difficulty: 'foundation',
        conceptTag: 'event-hold',
        situation: { en: 'The trader already has a position from earlier and now must decide whether to hold through the release.', zh: '交易者较早前已经有仓位，现在必须决定是否带单穿过数据公布。' },
        bestRead: { en: 'Holding through news is a separate risk decision, not just passive continuation of the original trade.', zh: '带仓穿消息是一个新的风险决策，不只是原本交易的被动延续。' },
        driver: { en: 'Event risk changes the profile of the trade even if the chart idea has not changed yet.', zh: '即使图形想法还没变，事件风险也已经改变了这笔单的性质。' },
        trap: { en: 'Acting as if nothing meaningful changes just because the position was entered earlier.', zh: '因为仓位是早些时候开的，就假装现在什么都没变。' },
        confirmation: { en: 'Check whether your size and stop logic still make sense through the release.', zh: '确认带过数据后，仓位和止损逻辑是否还合理。' },
      },
      {
        id: 'news-9',
        difficulty: 'foundation',
        conceptTag: 'false-breaks',
        situation: { en: 'Around the release, price spikes above resistance, then instantly reverses back below it.', zh: '数据附近，价格先刺破阻力，随后又立刻反转跌回阻力下方。' },
        bestRead: { en: 'This is exactly why event periods can produce false breaks and messy technical signals.', zh: '这正说明了为什么事件时段很容易制造假突破和凌乱信号。' },
        driver: { en: 'Fast liquidity grabs are more common when news volatility is driving price.', zh: '当消息波动主导价格时，快速扫流动性的情况会更常见。' },
        trap: { en: 'Treating every event spike as clean confirmation of breakout strength.', zh: '把每一次消息尖刺都当成干净的突破确认。' },
        confirmation: { en: 'Check whether price can hold after the spike instead of reacting to the spike itself.', zh: '不要只看尖刺本身，要看尖刺后能不能真的守住。' },
      },
      {
        id: 'news-10',
        difficulty: 'foundation',
        conceptTag: 'calendar-priority',
        situation: { en: 'The day has minor releases, medium releases, and one top-tier release later in New York.', zh: '当天有小数据、中等数据，以及纽约时段稍后一个顶级数据。' },
        bestRead: { en: 'The top-tier release deserves the most planning weight because it is most likely to distort the market.', zh: '顶级数据应该被赋予最高规划权重，因为它最有可能扭曲市场。' },
        driver: { en: 'Not all calendar events matter equally, so planning should prioritise impact.', zh: '并不是所有经济日历事件都同样重要，所以规划应按影响力排序。' },
        trap: { en: 'Treating all events as identical or ignoring the hierarchy completely.', zh: '把所有事件都当成一样，或完全忽视层级差异。' },
        confirmation: { en: 'Check which release is most likely to change volatility and behaviour materially.', zh: '看哪一个事件最可能真正改变波动和行为。' },
      },
      {
        id: 'news-11',
        difficulty: 'bridge',
        conceptTag: 'fade-after-news',
        situation: { en: 'A huge post-news spike reaches a known liquidity pool and then immediately loses follow-through.', zh: '消息后的一大段尖刺冲到已知流动性池后，立刻失去后续延续。' },
        bestRead: { en: 'That can become a valid fade idea, but only after the failure is actually visible.', zh: '这可以发展成一个有效反手思路，但前提是失败已经清楚地显现出来。' },
        driver: { en: 'Event spikes should be faded from evidence of failure, not from reflexively hating big moves.', zh: '消息尖刺只能在失败证据出现后才考虑反手，而不是因为你本能讨厌大波动。' },
        trap: { en: 'Auto-fading every strong post-news move without waiting for failure.', zh: '任何消息大波动都自动反手，却不等失败出现。' },
        confirmation: { en: 'Check whether reclaim failure or structure loss confirms the fade idea.', zh: '看是否出现收回失败或结构转弱来确认这个反手逻辑。' },
      },
      {
        id: 'news-12',
        difficulty: 'bridge',
        conceptTag: 'repricing',
        situation: { en: 'After a surprise inflation print, gold trends for hours instead of just producing one noisy spike.', zh: '意外通胀数据公布后，黄金不是只尖刺一下，而是持续趋势了好几个小时。' },
        bestRead: { en: 'Some news moves are not noise; they are genuine repricing that can create real trend conditions.', zh: '有些消息行情不是噪音，而是真正的重新定价，会形成真实趋势环境。' },
        driver: { en: 'Strong macro surprises can change the market narrative, not just create temporary chaos.', zh: '强烈的宏观意外会改变市场叙事，而不只是制造短暂混乱。' },
        trap: { en: 'Calling all news movement “untradable noise” no matter what follows.', zh: '不管后面怎么走，都把所有消息行情统称为“不可交易噪音”。' },
        confirmation: { en: 'Check whether the market is stabilising into a directional structure after the release.', zh: '看消息后，市场是否逐步稳定成一个方向性结构。' },
      },
      {
        id: 'news-13',
        difficulty: 'bridge',
        conceptTag: 're-entry-post-event',
        situation: { en: 'The trader wisely stayed flat through the release and now sees price retesting the post-news breakout zone.', zh: '交易者很理智地空仓躲过数据，现在看到价格在回测消息后的突破区。' },
        bestRead: { en: 'This can be a much cleaner re-entry opportunity than gambling through the release itself.', zh: '这通常会比直接赌数据本身，形成更干净的再入场机会。' },
        driver: { en: 'Letting the event pass first can improve clarity while still leaving room for trade.', zh: '先让事件过去，往往能提升清晰度，而且未必真的错过全部空间。' },
        trap: { en: 'Assuming if you did not trade the release candle, the whole move is already gone.', zh: '以为没做数据当下那根蜡烛，就等于整段行情都错过了。' },
        confirmation: { en: 'Check whether the retest behaves constructively after the event volatility settles.', zh: '看波动稍微稳定后，这个回测是否表现得更建设性。' },
      },
      {
        id: 'news-14',
        difficulty: 'bridge',
        conceptTag: 'size-reduction',
        situation: { en: 'The trader insists on holding through the release but cuts size materially beforehand.', zh: '交易者坚持要带仓穿数据，但在事前明显缩小了仓位。' },
        bestRead: { en: 'That at least acknowledges event risk and adapts exposure rather than pretending nothing changes.', zh: '这至少算是承认了事件风险，并调整了敞口，而不是假装什么都没变。' },
        driver: { en: 'When event exposure is chosen deliberately, size adaptation becomes part of the plan.', zh: '当你有意识地选择承受事件风险时，缩仓本来就该成为计划的一部分。' },
        trap: { en: 'Keeping full normal size through major releases without any adjustment.', zh: '在重大数据前完全不调整，还硬带正常满仓穿过去。' },
        confirmation: { en: 'Check whether the reduced size genuinely matches the uncertainty you are accepting.', zh: '看缩小后的仓位，是否真的匹配你愿意承受的不确定性。' },
      },
      {
        id: 'news-15',
        difficulty: 'bridge',
        conceptTag: 'technical-invalidity',
        situation: { en: 'A beautiful technical setup appears one minute before Powell speaks live.', zh: '一个很漂亮的技术 setup，偏偏出现在鲍威尔即将现场讲话前一分钟。' },
        bestRead: { en: 'The setup may still be technically pretty, but operationally it is much less trustworthy.', zh: '这个 setup 也许技术上很漂亮，但从执行层面看，可信度已经大幅下降。' },
        driver: { en: 'Operational quality can collapse even when technical appearance still looks attractive.', zh: '即便技术外观还很好看，执行质量也可能突然崩掉。' },
        trap: { en: 'Confusing technical beauty with operational tradability.', zh: '把技术图形好看，误以为就一定可执行。' },
        confirmation: { en: 'Check whether event context has changed the practical tradeability of the setup.', zh: '看事件背景是否已经改变了这个 setup 的实际可交易性。' },
      },
      {
        id: 'news-16',
        difficulty: 'bridge',
        conceptTag: 'news-and-levels',
        situation: { en: 'Price is sitting at a daily support right before CPI, and the trader says the level will definitely hold because it is high timeframe.', zh: '价格在 CPI 前正好压在日线支撑上，交易者说因为这是高周期支撑，所以一定会守住。' },
        bestRead: { en: 'High-timeframe levels matter, but they are not immune to event shock.', zh: '高周期关键位当然重要，但它们并不会对事件冲击免疫。' },
        driver: { en: 'News can temporarily overwhelm even strong levels before the market re-evaluates them.', zh: '消息会暂时压过再强的关键位，之后市场才会重新评估它们。' },
        trap: { en: 'Treating higher-timeframe support as a guarantee during major news.', zh: '在重大消息面前，把高周期支撑当成保证书。' },
        confirmation: { en: 'Check how the level behaves after the release, not just before it.', zh: '重点要看数据后这个关键位怎么表现，而不是只看数据前。' },
      },
      {
        id: 'news-17',
        difficulty: 'bridge',
        conceptTag: 'reaction-quality',
        situation: { en: 'After the release, price pierces support but quickly reclaims it with strong closes.', zh: '数据后，价格先刺穿支撑，但很快用强收盘重新站回去。' },
        bestRead: { en: 'The reclaim quality matters more than the initial violation alone.', zh: '这里更重要的是收回的质量，而不是最初那一下刺穿本身。' },
        driver: { en: 'Event periods require reading the full sequence, not just the first dramatic print.', zh: '消息时段需要看完整序列，而不是只盯第一下最戏剧性的报价。' },
        trap: { en: 'Declaring support dead forever from the first headline spike.', zh: '只根据消息后第一下尖刺，就宣布支撑永久失效。' },
        confirmation: { en: 'Check whether price can continue holding above the reclaimed level.', zh: '看收回后，价格是否还能继续守在关键位上方。' },
      },
      {
        id: 'news-18',
        difficulty: 'bridge',
        conceptTag: 'calendar-discipline',
        situation: { en: 'Two traders see the same chart; one checks the calendar and stands aside, the other enters and gets chopped by the release.', zh: '两个交易者看到同一张图；一个先看日历然后选择观望，另一个直接进场，结果被数据来回扫。' },
        bestRead: { en: 'The difference is process discipline, not chart intelligence.', zh: '真正的差别在流程纪律，而不是谁更会看图。' },
        driver: { en: 'Risk process often separates professional behaviour from impulsive behaviour.', zh: '风险流程常常才是专业和冲动之间的真正分界线。' },
        trap: { en: 'Thinking technical skill alone can compensate for calendar neglect.', zh: '以为技术能力够强，就能弥补不看日历。' },
        confirmation: { en: 'Check whether the process protected capital better than the “exciting” trade did.', zh: '看这套流程是否比“刺激的那笔交易”更有效地保护了本金。' },
      },
      {
        id: 'news-19',
        difficulty: 'bridge',
        conceptTag: 'event-filter',
        situation: { en: 'The trader chooses to take only A-grade setups on high-impact days and ignore all mediocre ones.', zh: '交易者在高影响日消息日，只做 A 级 setup，所有普通 setup 一律过滤。' },
        bestRead: { en: 'That is a sensible filter because event days demand stricter selectivity.', zh: '这是一种合理过滤，因为事件日通常需要更严格的挑选标准。' },
        driver: { en: 'When environment risk rises, setup quality threshold should usually rise as well.', zh: '当环境风险上升时，setup 的门槛通常也该跟着提高。' },
        trap: { en: 'Trading the same quantity and quality of setups no matter how risky the day is.', zh: '不管当天风险多高，做单数量和标准都完全不变。' },
        confirmation: { en: 'Check whether your setup criteria adapt to the day’s event profile.', zh: '看你的 setup 标准是否有随着当天事件画像而调整。' },
      },
      {
        id: 'news-20',
        difficulty: 'bridge',
        conceptTag: 'bridge-summary',
        situation: { en: 'A beginner asks, “If my chart setup is good, do I still need to care about news?”', zh: '初学者问：“如果我的图表 setup 很好，我还需要在意消息吗？”' },
        bestRead: { en: 'Yes. A chart setup and event risk are different layers of the same trade decision.', zh: '当然需要。图表 setup 和事件风险，是同一笔交易决策里的两个层面。' },
        driver: { en: 'Technical quality does not cancel macro event risk; both must be respected together.', zh: '技术质量并不会取消宏观事件风险，这两者必须一起被尊重。' },
        trap: { en: 'Treating technical analysis and event risk as unrelated worlds.', zh: '把技术分析和事件风险看成互不相关的两个世界。' },
        confirmation: { en: 'Check whether the trade still makes sense after the calendar is included in the plan.', zh: '把日历因素纳入计划后，再看这笔交易是否仍然合理。' },
      },
    ];

    return buildScenarioQuestionBank('news-risk', scenarios, {
      accurateStatement: {
        en: 'Technical setups must be filtered through event risk, timing, and execution conditions during major news periods.',
        zh: '在重大消息时段里，技术 setup 必须再经过事件风险、时间点和执行条件的过滤。',
      },
      falseStatement: {
        en: 'If the chart pattern is strong enough, economic news can be ignored safely.',
        zh: '只要图形够强，经济消息就可以放心忽略。',
      },
    });
  }

  function buildBreakoutFalseBreakoutQuestionBank() {
    const scenarios = [
      { id: 'break-1', difficulty: 'foundation', conceptTag: 'acceptance', situation: { en: 'Price breaks above resistance, closes strong, retests the shelf, and holds above it.', zh: '价格突破阻力、强势收盘、回测平台后还能守在上方。' }, bestRead: { en: 'This is higher-quality breakout behaviour because the new area is being accepted.', zh: '这属于较高质量的突破行为，因为新区间正在被接受。' }, driver: { en: 'Break plus hold plus continuation matters more than the first push alone.', zh: '突破后能守住再延续，比第一下冲出去本身更重要。' }, trap: { en: 'Ignoring the retest hold and focusing only on candle size.', zh: '无视回测守住，只盯着蜡烛大小。' }, confirmation: { en: 'Check whether later pullbacks still stay above the broken shelf.', zh: '看后续回踩是否仍守在突破平台上方。' } },
      { id: 'break-2', difficulty: 'foundation', conceptTag: 'failed-hold', situation: { en: 'Price trades above a visible high briefly, then closes back inside the old range.', zh: '价格短暂冲过明显高点，但收盘又回到旧区间。' }, bestRead: { en: 'This is weaker than a real breakout because acceptance failed quickly.', zh: '这比真突破弱得多，因为接受度很快失败。' }, driver: { en: 'Closing back inside the old structure matters more than the brief poke higher.', zh: '收回旧结构内部，比短暂冲高本身更重要。' }, trap: { en: 'Calling every wick through highs a valid breakout.', zh: '把每次冲过高点的影线都当有效突破。' }, confirmation: { en: 'Check whether reclaim attempts above the high keep failing.', zh: '看之后再想站回高点上方时，是不是继续失败。' } },
      { id: 'break-3', difficulty: 'foundation', conceptTag: 'breakout-close', situation: { en: 'A breakout candle closes in its upper range with little rejection.', zh: '突破蜡烛收在上半部，而且上方拒绝很少。' }, bestRead: { en: 'That close deserves respect because it shows stronger commitment than a weak close.', zh: '这种收盘值得尊重，因为它比弱收盘更显示承接。' }, driver: { en: 'Closing strength helps judge whether breakout participation was confident.', zh: '收盘强度能帮助判断突破参与是否有信心。' }, trap: { en: 'Treating all breakout closes as equal no matter where they finish.', zh: '不管收在哪里，都把所有突破收盘看成一样。' }, confirmation: { en: 'Check whether the next bar protects the strong close or erases it quickly.', zh: '看下一根是否保护这个强收盘，还是很快把它抹掉。' } },
      { id: 'break-4', difficulty: 'foundation', conceptTag: 'late-chase', situation: { en: 'Price already extended far from the breakout shelf before the trader enters.', zh: '交易者进场时，价格已经离突破平台很远。' }, bestRead: { en: 'The breakout may still be valid, but the entry quality is now worse.', zh: '突破也许还有效，但这个进场质量已经变差。' }, driver: { en: 'Breakout quality and entry efficiency are related but not identical.', zh: '突破质量和进场效率有关，但不是同一回事。' }, trap: { en: 'Assuming a valid breakout automatically means any late entry is also good.', zh: '以为突破有效，就代表任何晚追位置也都合理。' }, confirmation: { en: 'Check whether a retest or pause offers a more efficient continuation entry.', zh: '看有没有回测或停顿能提供更高效的继续进场。' } },
      { id: 'break-5', difficulty: 'foundation', conceptTag: 'range-fakeout', situation: { en: 'Price keeps revisiting range highs but cannot hold outside the range.', zh: '价格不断去测区间上沿，但始终站不稳在区间外。' }, bestRead: { en: 'This still looks more like range behaviour with repeated fakeouts than trend breakout.', zh: '这更像区间行为里的反复假突破，而不是趋势突破。' }, driver: { en: 'Repeated failure to achieve acceptance means the old range still matters.', zh: '反复无法建立接受度，就代表旧区间仍然有效。' }, trap: { en: 'Calling every test of the ceiling a fresh trend start.', zh: '把每次冲上沿都当成新的趋势起点。' }, confirmation: { en: 'Check whether price can finally hold above the ceiling instead of snapping back.', zh: '看价格是否终于能站稳上沿，而不是又被弹回。' } },
      { id: 'break-6', difficulty: 'foundation', conceptTag: 'retest-quality', situation: { en: 'After breakout, the first pullback is shallow and buyers respond quickly.', zh: '突破后第一次回踩很浅，而且买方很快接住。' }, bestRead: { en: 'That retest quality supports continuation because the shelf is acting as support.', zh: '这种回测质量支持延续，因为平台正在转成支撑。' }, driver: { en: 'Good breakouts often show responsive demand on early retests.', zh: '高质量突破，早期回测时常能看到快速承接。' }, trap: { en: 'Ignoring the hold and waiting for impossible perfect confirmation.', zh: '无视这种守住表现，只想等不现实的完美确认。' }, confirmation: { en: 'Check whether the next push can print a fresh high after the hold.', zh: '看守住之后，下一段能否再打出新高。' } },
      { id: 'break-7', difficulty: 'foundation', conceptTag: 'thin-break', situation: { en: 'Price breaks a level during a thin session, then loses it once active participation returns.', zh: '价格在薄市场时段突破某个水平，但一到活跃时段就守不住。' }, bestRead: { en: 'The thin-session breakout deserves less trust than the active-session rejection.', zh: '这种薄时段突破，可信度低于活跃时段的拒绝。' }, driver: { en: 'Session quality affects breakout reliability.', zh: '时段质量会影响突破可靠性。' }, trap: { en: 'Treating all breaks as equally meaningful regardless of participation.', zh: '不管参与质量如何，都把所有突破看成一样。' }, confirmation: { en: 'Check whether active-session flow supports or rejects the break.', zh: '看活跃时段的订单流是支持这次突破，还是把它否掉。' } },
      { id: 'break-8', difficulty: 'foundation', conceptTag: 'breakout-vs-news', situation: { en: 'A huge candle breaks the level during news, but price cannot stabilise afterward.', zh: '消息期间一根巨大的蜡烛冲破了水平位，但之后价格根本稳不下来。' }, bestRead: { en: 'The move may be event volatility rather than trustworthy breakout acceptance.', zh: '这更可能是事件波动，而不是值得信任的突破接受。' }, driver: { en: 'News spikes need post-spike acceptance before being trusted as breakouts.', zh: '消息尖刺必须经过后续接受，才值得被当成突破。' }, trap: { en: 'Trusting the first post-news candle as if it settles the whole story.', zh: '把消息后第一根蜡烛，当成能决定整段故事。' }, confirmation: { en: 'Check where price settles once event volatility cools.', zh: '等事件波动稍降后，看价格最终站在哪里。' } },
      { id: 'break-9', difficulty: 'foundation', conceptTag: 'space-to-run', situation: { en: 'A breakout occurs directly under major higher-timeframe resistance.', zh: '某次突破正好发生在更高周期大阻力正下方。' }, bestRead: { en: 'The breakout may have poor space-to-run even if it looks clean locally.', zh: '即便局部看起来干净，这个突破的可运行空间也可能很差。' }, driver: { en: 'Location above the level matters as much as the break itself.', zh: '突破之后上方还有什么，和突破本身一样重要。' }, trap: { en: 'Ignoring higher-timeframe location because the lower-timeframe candle looks strong.', zh: '只因小级别蜡烛够强，就无视高周期位置。' }, confirmation: { en: 'Check whether the higher-timeframe barrier is cleared or still capping price.', zh: '看更高周期障碍有没有被清掉，还是仍在压价。' } },
      { id: 'break-10', difficulty: 'foundation', conceptTag: 'bridge-summary', situation: { en: 'A trader says, “If price breaks, I buy. If price drops, I sell.”', zh: '有交易者说：“突破我就买，跌破我就卖。”' }, bestRead: { en: 'That is too shallow because it ignores acceptance, location, and follow-through quality.', zh: '这太浅了，因为它忽略了接受度、位置和后续延续质量。' }, driver: { en: 'Professional breakout logic reads sequence, not only direction of the first move.', zh: '专业的突破逻辑读的是顺序，而不只是一开始往哪边动。' }, trap: { en: 'Reducing breakout work to simple line crossing.', zh: '把突破阅读简化成“过线就算”。' }, confirmation: { en: 'Check what price does after the level breaks before deciding the playbook.', zh: '先看破位后价格怎么走，再决定用哪套剧本。' } },
      { id: 'break-11', difficulty: 'bridge', conceptTag: 'compression-break', situation: { en: 'Price compressed tightly under resistance for hours, then broke and held above it.', zh: '价格在阻力下方压缩了好几个小时，随后突破并站稳。' }, bestRead: { en: 'That breakout is stronger because compression plus acceptance often signals real expansion.', zh: '这种突破更强，因为压缩后再被接受，常常意味着真实扩张。' }, driver: { en: 'Stored energy matters when the break is followed by acceptance.', zh: '如果突破后还能被接受，前面的蓄力就很有意义。' }, trap: { en: 'Treating this the same as a random one-candle poke.', zh: '把这种情况和随便一根蜡烛的乱刺看成一样。' }, confirmation: { en: 'Check whether the broken shelf becomes support on retest.', zh: '看突破平台回踩后是否真的转成支撑。' } },
      { id: 'break-12', difficulty: 'bridge', conceptTag: 'exhausted-break', situation: { en: 'A market runs for hours, then finally pokes above highs with a shrinking body and heavy rejection.', zh: '市场已经单边走了很久，最后才勉强刺破高点，而且实体缩小、拒绝很重。' }, bestRead: { en: 'That is vulnerable breakout behaviour because the expansion may be getting exhausted.', zh: '这种突破行为很脆弱，因为扩张可能已经在衰竭。' }, driver: { en: 'Late-stage breakout attempts often lose quality when bodies shrink and rejection grows.', zh: '后段突破如果实体缩小、拒绝变重，质量通常会下降。' }, trap: { en: 'Treating the final poke as equally healthy just because it still closed green.', zh: '只因为还是阳线收盘，就把最后这下也当成同样健康。' }, confirmation: { en: 'Check whether the next bar can extend or immediately stalls.', zh: '看下一根能否继续扩张，还是马上停住。' } },
      { id: 'break-13', difficulty: 'bridge', conceptTag: 'liquidity-raid', situation: { en: 'Price runs equal highs, triggers entries, then instantly reclaims below the level.', zh: '价格扫过等高点、触发追单后，马上又收回水平位下方。' }, bestRead: { en: 'This is more consistent with a liquidity raid than a trustworthy breakout.', zh: '这更符合扫流动性，而不是值得信任的突破。' }, driver: { en: 'Fast reclaim after the raid says the new territory was not truly accepted.', zh: '扫完之后快速收回，说明新区域并没有被真正接受。' }, trap: { en: 'Calling it bullish just because stops were cleared above highs.', zh: '只因为高点上的止损被扫到，就认定它是多头。' }, confirmation: { en: 'Check whether price can get back above the level and hold this time.', zh: '看价格之后能否重新站上去，而且这次能守住。' } },
      { id: 'break-14', difficulty: 'bridge', conceptTag: 'reclaim-strength', situation: { en: 'Price breaks out, retests, holds, and then reclaims the local intraday VWAP too.', zh: '价格突破后回测守住，接着连日内 VWAP 也重新收回。' }, bestRead: { en: 'That stack of evidence improves breakout confidence because acceptance is broadening.', zh: '这会提升突破可信度，因为接受范围正在扩大。' }, driver: { en: 'Multiple acceptance signals in the same direction strengthen the breakout case.', zh: '多个同方向的接受信号，会强化突破成立的概率。' }, trap: { en: 'Ignoring additional confirmation because one candle was already “enough.”', zh: '因为觉得一根蜡烛已经够了，就无视后面更多确认。' }, confirmation: { en: 'Check whether later pullbacks still find support in the reclaimed area.', zh: '看后续回踩时，收回区域是否继续提供支撑。' } },
      { id: 'break-15', difficulty: 'bridge', conceptTag: 're-break', situation: { en: 'The first breakout failed, but later the level is attacked again with stronger closes and no fast rejection.', zh: '第一次突破失败了，但之后这个水平再次被攻击，而且收盘更强、也没有快速拒绝。' }, bestRead: { en: 'A failed first attempt does not prevent a later breakout from becoming valid.', zh: '第一次失败，并不代表后面的再次突破就不可能成立。' }, driver: { en: 'Each breakout attempt must be judged by its own acceptance sequence.', zh: '每一次突破尝试，都要根据自己的接受顺序单独判断。' }, trap: { en: 'Assuming a level can never break just because it rejected once earlier.', zh: '只因为它前面拒绝过一次，就以为这个水平永远突破不了。' }, confirmation: { en: 'Check whether the newer attempt behaves differently after the break.', zh: '看这次新的尝试，在破位后的行为是否明显不同。' } },
      { id: 'break-16', difficulty: 'bridge', conceptTag: 'timeframe-breakout', situation: { en: 'M5 breaks cleanly, but H1 still shows price moving into a major range ceiling.', zh: 'M5 突破得很干净，但 H1 仍显示价格正在撞向大区间上沿。' }, bestRead: { en: 'The lower-timeframe breakout may be real locally, but still lower-quality in bigger context.', zh: '这个小级别突破在局部也许是真的，但放到更大背景里质量仍然打折。' }, driver: { en: 'Breakout quality depends on timeframe context, not only local neatness.', zh: '突破质量取决于时间框架背景，而不只是局部看起来整齐。' }, trap: { en: 'Judging breakout quality from one timeframe only.', zh: '只用一个周期，就给突破质量下结论。' }, confirmation: { en: 'Check whether the higher-timeframe barrier is accepted through as well.', zh: '看更高周期障碍是否也被真正站稳突破。' } },
      { id: 'break-17', difficulty: 'bridge', conceptTag: 'volume-support', situation: { en: 'A breakout holds and follow-through arrives with improving participation.', zh: '突破守住后，后续延续也伴随更强参与进场。' }, bestRead: { en: 'That improves breakout quality because participation supports the acceptance story.', zh: '这会提升突破质量，因为参与度在支持接受度故事。' }, driver: { en: 'Participation can reinforce price acceptance when both point in the same direction.', zh: '当参与度和价格接受度方向一致时，信号会更扎实。' }, trap: { en: 'Thinking volume or participation is irrelevant once price already broke the line.', zh: '以为只要价格过线后，参与度就完全不重要。' }, confirmation: { en: 'Check whether support on pullbacks remains active as participation stays healthy.', zh: '看回踩承接是否还活跃，而且参与度是否仍健康。' } },
      { id: 'break-18', difficulty: 'bridge', conceptTag: 'failed-retest', situation: { en: 'The first pullback after breakout slices back through the shelf and closes below it decisively.', zh: '突破后的第一次回踩，直接把平台切穿，而且干脆收在下方。' }, bestRead: { en: 'That is a serious warning because the breakout shelf failed its first real test.', zh: '这是严重警讯，因为突破平台第一次真正被测就失败了。' }, driver: { en: 'The first retest often carries important information about whether the breakout was trustworthy.', zh: '第一次回测通常很有信息量，它会告诉你这个突破值不值得信。' }, trap: { en: 'Still calling the breakout strong because the original candle looked great.', zh: '只因为最初那根蜡烛很好看，就继续说突破很强。' }, confirmation: { en: 'Check whether the shelf can be reclaimed quickly or remains broken.', zh: '看这个平台能否很快收回，还是会持续失守。' } },
      { id: 'break-19', difficulty: 'bridge', conceptTag: 'overfitting-breakout', situation: { en: 'The trader needs five extra indicators to justify a breakout that price itself is not holding well.', zh: '交易者需要再找五个额外指标，来替一个价格自己都站不稳的突破辩护。' }, bestRead: { en: 'That is overfitting weak price action instead of accepting that the breakout quality is poor.', zh: '这属于对弱价格行为的过度拟合，而不是诚实承认突破质量偏差。' }, driver: { en: 'When price cannot hold the break, extra tools rarely rescue the trade thesis honestly.', zh: '如果价格自己都守不住，额外工具通常也无法诚实地救回这套逻辑。' }, trap: { en: 'Searching endlessly for confirmation after the core acceptance test already failed.', zh: '在核心接受测试已经失败后，仍然无止境地找额外确认。' }, confirmation: { en: 'Check whether the basic break-hold-continue sequence is there before adding anything else.', zh: '先看最基本的突破-守住-延续顺序是否存在，再谈其他。' } },
      { id: 'break-20', difficulty: 'bridge', conceptTag: 'playbook-choice', situation: { en: 'A trader sees expansion, but cannot decide whether to apply breakout logic or fade logic.', zh: '交易者看到价格在扩张，但不知道该用突破剧本还是反手剧本。' }, bestRead: { en: 'The decision should come from acceptance versus failure, not from how exciting the move looks.', zh: '真正该决定剧本的，是接受还是失败，而不是这段走势看起来多刺激。' }, driver: { en: 'Expansion alone is incomplete information until the market proves what it wants to do with the new ground.', zh: '单独的扩张信息还不完整，直到市场证明它想怎么处理这块新区域。' }, trap: { en: 'Choosing the playbook emotionally from speed alone.', zh: '只根据速度快不快，就情绪化地选剧本。' }, confirmation: { en: 'Check whether price is being accepted outside the old area or rejected back into it.', zh: '看价格究竟是在旧区域外被接受，还是被拒绝回旧区域里。' } },
    ];

    return buildScenarioQuestionBank('breakout', scenarios, {
      accurateStatement: {
        en: 'A breakout earns trust from acceptance, retest quality, and continuation, not from line-crossing alone.',
        zh: '一段突破是否值得信任，取决于接受度、回测质量和后续延续，而不是只看有没有过线。',
      },
      falseStatement: {
        en: 'Any move through a visible level is automatically a valid breakout.',
        zh: '只要穿过明显水平位，就自动算有效突破。',
      },
    });
  }

  function buildPullbackContinuationQuestionBank() {
    const scenarios = [
      { id: 'pull-1', difficulty: 'foundation', conceptTag: 'healthy-pullback', situation: { en: 'Price trends up, pulls back into support, slows down, and then closes back strong.', zh: '价格上升后回踩支撑、节奏放慢，然后又重新强势收回。' }, bestRead: { en: 'This is healthy pullback behaviour that supports continuation.', zh: '这属于健康回调行为，支持后续延续。' }, driver: { en: 'Controlled retrace plus constructive reclaim suggests the trend is resetting, not breaking.', zh: '受控回踩加建设性收回，说明趋势是在重置，不是在坏掉。' }, trap: { en: 'Calling every pullback a reversal attempt.', zh: '把每一次回调都叫成反转。' }, confirmation: { en: 'Check whether the next push can resume above the prior reaction high.', zh: '看下一段能否重新推动并超过前一个反应高点。' } },
      { id: 'pull-2', difficulty: 'foundation', conceptTag: 'too-deep', situation: { en: 'The pullback erases most of the prior impulse and nearly retests the origin of the move.', zh: '这次回调几乎把前面的推动吐回去，还快回测到起涨点。' }, bestRead: { en: 'That pullback is becoming dangerous because it is erasing too much of the prior trend leg.', zh: '这个回调已经开始危险，因为它抹掉了太多前面的趋势腿。' }, driver: { en: 'Continuation loses quality when the reset becomes too deep.', zh: '如果重置太深，延续质量就会下降。' }, trap: { en: 'Calling it better value only because price is lower now.', zh: '只因为价格更低，就说这是更好价值。' }, confirmation: { en: 'Check whether meaningful support and previous structure are still intact.', zh: '看有意义的支撑和前结构是否仍完整。' } },
      { id: 'pull-3', difficulty: 'foundation', conceptTag: 'entry-quality', situation: { en: 'The trader buys after the whole continuation leg already stretched far from support.', zh: '交易者在整段延续已经离支撑很远之后才去买。' }, bestRead: { en: 'The trend may still be intact, but the entry quality is late and less efficient.', zh: '趋势也许还完整，但这个进场已经偏晚、效率偏差。' }, driver: { en: 'Continuation quality and entry quality are related but not identical.', zh: '延续质量和进场质量有关，但不是一回事。' }, trap: { en: 'Assuming intact trend means every entry timing is equally good.', zh: '以为只要趋势没坏，任何进场 timing 都一样好。' }, confirmation: { en: 'Check whether the move is too stretched relative to the last valid support zone.', zh: '看这段走势相对最近有效支撑区是否已经太拉伸。' } },
      { id: 'pull-4', difficulty: 'foundation', conceptTag: 'shallow-reset', situation: { en: 'A strong trend only retraces briefly before buyers step in again.', zh: '一段强趋势只做了短暂回踩，买方就又重新接手。' }, bestRead: { en: 'That can be strong continuation behaviour if structure remains orderly.', zh: '如果结构仍然有序，这可以是很强的延续行为。' }, driver: { en: 'In healthy trends, pullbacks do not always need to be deep to be tradable.', zh: '在健康趋势里，回调不一定要很深才可交易。' }, trap: { en: 'Demanding huge pullbacks before every continuation trade.', zh: '每一次延续都执着地要等超深回调。' }, confirmation: { en: 'Check whether the shallow reset still happens at a logical support area.', zh: '看这种浅回调是否仍然发生在合理支撑区域。' } },
      { id: 'pull-5', difficulty: 'foundation', conceptTag: 'support-loss', situation: { en: 'Price loses the last defended higher low and reclaim attempts stay weak.', zh: '价格跌破最近守住的更高低点，而且收回尝试一直偏弱。' }, bestRead: { en: 'The continuation story is weakening materially.', zh: '这说明延续故事正在明显转弱。' }, driver: { en: 'A good pullback should not casually destroy the support structure it depends on.', zh: '好的回调，不应该随便把自己赖以成立的支撑结构毁掉。' }, trap: { en: 'Still calling it a textbook dip because the broader bias was bullish earlier.', zh: '只因为前面大方向偏多，就继续把它叫成标准回调。' }, confirmation: { en: 'Check whether the lost support can be reclaimed with strength.', zh: '看失去的支撑能否被有力收回。' } },
      { id: 'pull-6', difficulty: 'foundation', conceptTag: 'pullback-location', situation: { en: 'A retrace lands into prior breakout support and reacts immediately.', zh: '一次回踩正好回到前面突破支撑区，而且立刻出现反应。' }, bestRead: { en: 'That is constructive because location and behaviour align.', zh: '这很建设性，因为位置和行为是对得上的。' }, driver: { en: 'A pullback is strongest when it resets into meaningful structure, not random open space.', zh: '回调最强的时候，是回到有意义结构，而不是随便掉进空白区域。' }, trap: { en: 'Ignoring the location and judging only the candle colour.', zh: '无视位置，只看蜡烛颜色。' }, confirmation: { en: 'Check whether the shelf continues to behave like support on retest.', zh: '看这个平台继续回测时是否仍像支撑。' } },
      { id: 'pull-7', difficulty: 'foundation', conceptTag: 'late-buyer', situation: { en: 'A trader buys only after the pullback has already resolved and price is back near local highs.', zh: '交易者等到回调都已经走完、价格又回到局部高位附近才去追。' }, bestRead: { en: 'That is late participation and may offer poor asymmetry.', zh: '这属于晚参与，风险报酬比可能很差。' }, driver: { en: 'The best continuation entries usually happen nearer the constructive reset than the emotional expansion.', zh: '最好的延续进场，通常更靠近建设性重置，而不是情绪扩张末端。' }, trap: { en: 'Thinking waiting longer always makes continuation safer.', zh: '以为等得更晚，就一定更安全。' }, confirmation: { en: 'Check how far price already is from the pullback support area.', zh: '看价格已经离回调支撑区多远。' } },
      { id: 'pull-8', difficulty: 'foundation', conceptTag: 'messy-reclaim', situation: { en: 'Price reaches support, but the reclaim is sloppy and every candle gets sold back.', zh: '价格碰到支撑后，收回过程很拖泥带水，而且每根都被卖回。' }, bestRead: { en: 'This is weaker continuation evidence because the reclaim quality is poor.', zh: '这属于偏弱的延续证据，因为收回质量很差。' }, driver: { en: 'Reclaim quality matters; location alone is not enough.', zh: '收回质量很重要，单靠位置还不够。' }, trap: { en: 'Entering immediately just because support was touched.', zh: '只因碰到支撑就立刻进场。' }, confirmation: { en: 'Check whether closes start improving before trusting the dip.', zh: '看收盘质量有没有开始改善，再决定是否信任这次回调。' } },
      { id: 'pull-9', difficulty: 'foundation', conceptTag: 'bridge-summary', situation: { en: 'A trader says, “Any dip in an uptrend is a buy.”', zh: '有交易者说：“上升趋势里的任何回调都可以买。”' }, bestRead: { en: 'That is too crude because pullback depth, location, and reclaim quality all matter.', zh: '这种说法太粗糙，因为回调深度、位置和收回质量都很重要。' }, driver: { en: 'Continuation work is about quality filtering, not blind optimism.', zh: '延续交易的重点是质量筛选，而不是盲目乐观。' }, trap: { en: 'Reducing all continuation logic to one slogan.', zh: '把所有延续逻辑都简化成一句口号。' }, confirmation: { en: 'Check whether the dip preserved the structure you need.', zh: '看这次回调有没有保留你需要的结构。' } },
      { id: 'pull-10', difficulty: 'foundation', conceptTag: 'retest-speed', situation: { en: 'A dip reaches support and is rejected quickly instead of staying there for long.', zh: '回调碰到支撑后，很快就被拒绝上去，而不是在那里拖很久。' }, bestRead: { en: 'Fast rejection can support continuation because it shows responsive buying.', zh: '快速拒绝有利于延续，因为它显示买盘反应积极。' }, driver: { en: 'Healthy pullbacks often meet responsive defence rather than endless hesitation.', zh: '健康回调常常会遇到快速防守，而不是无止境犹豫。' }, trap: { en: 'Assuming every fast move is unreliable by default.', zh: '默认把所有快速反应都当成不可靠。' }, confirmation: { en: 'Check whether the following candles build on that rejection constructively.', zh: '看后面的蜡烛是否能顺着这次拒绝继续建设性发展。' } },
      { id: 'pull-11', difficulty: 'bridge', conceptTag: 'multi-timeframe-pullback', situation: { en: 'H1 stays bullish while M5 pullback looks ugly for a few minutes.', zh: 'H1 仍偏多，但 M5 的回调有几分钟看起来很难看。' }, bestRead: { en: 'The lower-timeframe ugliness may still be noise if higher-timeframe continuation structure holds.', zh: '只要更高周期延续结构还在，这种小级别难看可能仍只是噪音。' }, driver: { en: 'Pullback quality should be judged in the timeframe that defines the continuation idea.', zh: '回调质量，应该在定义这笔延续想法的那个周期里判断。' }, trap: { en: 'Letting every ugly M5 sequence kill an intact H1 continuation thesis.', zh: '只要 M5 难看一点，就把完整的 H1 延续逻辑全部推翻。' }, confirmation: { en: 'Check whether H1 support still survives while M5 shakes around it.', zh: '看 M5 在乱晃时，H1 支撑是否依然健在。' } },
      { id: 'pull-12', difficulty: 'bridge', conceptTag: 'sharp-vs-controlled', situation: { en: 'One pullback bleeds slowly into support; another spikes violently through support before reclaiming.', zh: '有一种回调是慢慢流到支撑；另一种则是先暴力刺穿支撑再收回。' }, bestRead: { en: 'These two resets do not mean the same thing and should not be treated identically.', zh: '这两种重置完全不是同一种东西，不该用同样方式处理。' }, driver: { en: 'Pullback character matters, not just final price level.', zh: '回调的“性格”很重要，不只是最终落点。' }, trap: { en: 'Reducing both moves to “price touched support.”', zh: '把两种情况都简化成“价格碰到支撑”。' }, confirmation: { en: 'Check whether the reclaim after the violent move is trustworthy enough.', zh: '看暴力动作后的收回，是否足够可信。' } },
      { id: 'pull-13', difficulty: 'bridge', conceptTag: 'continuation-window', situation: { en: 'The market is still trending, but multiple continuation entries have already happened from the same shelf.', zh: '市场趋势还在，但同一个平台已经走出过好几次延续进场。' }, bestRead: { en: 'The continuation edge may be decaying because the same shelf is being reused repeatedly.', zh: '延续优势可能正在衰减，因为同一个平台被反复使用。' }, driver: { en: 'Repeated use can reduce the freshness of a pullback location.', zh: '反复使用会降低回调位置的新鲜度。' }, trap: { en: 'Assuming the fifth pullback is as clean as the first.', zh: '以为第五次回踩和第一次一样干净。' }, confirmation: { en: 'Check whether reactions from the shelf are getting weaker over time.', zh: '看这个平台给出的反应是否在逐步变弱。' } },
      { id: 'pull-14', difficulty: 'bridge', conceptTag: 'continuation-after-breakout', situation: { en: 'A breakout holds, then price pulls back to the breakout shelf and stabilises there.', zh: '一次突破守住后，价格回踩到突破平台并在那边稳住。' }, bestRead: { en: 'This is a classic continuation setup because the breakout and pullback stories align.', zh: '这是典型延续 setup，因为突破故事和回调故事是对齐的。' }, driver: { en: 'Best pullback entries often come when role reversal and trend logic agree.', zh: '最好的回调进场，常常出现在角色互换和趋势逻辑同时成立时。' }, trap: { en: 'Ignoring the role-reversal support and waiting for a much later chase.', zh: '无视这种角色互换支撑，非要等更晚的位置再追。' }, confirmation: { en: 'Check whether the reclaimed shelf keeps acting as support.', zh: '看被收回的平台是否继续像支撑一样发挥作用。' } },
      { id: 'pull-15', difficulty: 'bridge', conceptTag: 'failing-follow-through', situation: { en: 'The pullback seems to hold, but the next push cannot even retest the prior high.', zh: '回调看似守住了，但下一波推动连前高都碰不到。' }, bestRead: { en: 'That weak follow-through is a warning that continuation quality is fading.', zh: '这种弱延续是在提醒：延续质量正在下降。' }, driver: { en: 'A healthy reset should usually hand momentum back to the trend side, not stall immediately.', zh: '健康重置之后，动能通常会回到趋势方向，而不是立刻又停住。' }, trap: { en: 'Calling the dip successful just because support held once.', zh: '只因为支撑守住了一次，就宣布回调成功。' }, confirmation: { en: 'Check whether the next push has enough energy to threaten prior highs.', zh: '看下一波推动有没有足够力量去威胁前高。' } },
      { id: 'pull-16', difficulty: 'bridge', conceptTag: 'session-pullback', situation: { en: 'A clean London continuation pullback is suddenly tested again during New York data volatility.', zh: '原本很干净的伦敦延续回调，突然在纽约数据波动里再次被测试。' }, bestRead: { en: 'The pullback story must be re-evaluated because session context changed materially.', zh: '因为时段背景发生明显变化，这个回调故事需要重新评估。' }, driver: { en: 'Continuation quality can change when the session and volatility regime change.', zh: '当时段和波动状态变化时，延续质量也会跟着变。' }, trap: { en: 'Assuming the setup is frozen in quality from the earlier session.', zh: '以为这笔 setup 的质量会永远停留在较早的时段状态。' }, confirmation: { en: 'Check whether the support still survives under the new session conditions.', zh: '看在新 session 条件下，这个支撑还能否继续守住。' } },
      { id: 'pull-17', difficulty: 'bridge', conceptTag: 'space-to-target', situation: { en: 'The pullback is healthy, but overhead resistance leaves only tiny room to the target.', zh: '回调本身很健康，但上方阻力让目标空间只剩一点点。' }, bestRead: { en: 'Good pullback quality does not automatically create a good trade if space is poor.', zh: '回调质量不错，也不代表这笔交易就一定好做；空间不够照样不高效。' }, driver: { en: 'Continuation logic still has to respect target room and asymmetry.', zh: '延续逻辑仍然必须尊重目标空间和不对称性。' }, trap: { en: 'Buying every healthy pullback regardless of nearby barriers.', zh: '不管上方障碍多近，只要回调健康就全部照买。' }, confirmation: { en: 'Check how much clean room remains before the next likely reaction zone.', zh: '看下一道可能反应区之前，还剩多少干净空间。' } },
      { id: 'pull-18', difficulty: 'bridge', conceptTag: 'too-late-reset', situation: { en: 'Price trends for a long time, then the trader waits for a pullback so deep that it almost changes the whole structure.', zh: '价格已经趋势了很久，结果交易者等到一个深到几乎改写整个结构的回调才想接。' }, bestRead: { en: 'That may be too late to call it a normal continuation pullback.', zh: '这种情况可能已经太晚，不适合再叫它普通延续回调。' }, driver: { en: 'Some deep resets are no longer efficient continuation setups by the time they arrive.', zh: '有些深重置到了那个程度，已经不再是高效的延续 setup。' }, trap: { en: 'Thinking patience always improves continuation quality no matter how deep the reset becomes.', zh: '以为只要更有耐心，回调越深延续质量就一定越好。' }, confirmation: { en: 'Check whether the pullback still preserves the broader trend map.', zh: '看这个回调是否还保留着更大的趋势地图。' } },
      { id: 'pull-19', difficulty: 'bridge', conceptTag: 'chain-of-logic', situation: { en: 'Entry, stop, and target all depend on a pullback holding one specific shelf.', zh: '进场、止损和目标，全部都建立在同一个回调平台会守住这件事上。' }, bestRead: { en: 'That is coherent continuation planning because the trade logic is built around one structural idea.', zh: '这属于连贯的延续规划，因为整笔交易都围绕同一个结构想法建立。' }, driver: { en: 'Best continuation trades have one clear structural anchor, not five unrelated reasons.', zh: '最好的延续交易，通常围绕一个明确结构锚点，而不是五个互不相干的理由。' }, trap: { en: 'Building entry, stop, and target from three different chart stories.', zh: '进场、止损、目标各自来自三套不同图表故事。' }, confirmation: { en: 'Check whether all management decisions still point back to the same support shelf.', zh: '看所有管理决策是否都还能回到同一个支撑平台。' } },
      { id: 'pull-20', difficulty: 'bridge', conceptTag: 'bridge-summary', situation: { en: 'A trader asks, “What is the one thing I should watch first on a pullback?”', zh: '有交易者问：“看回调时，我第一件最该看什么？”' }, bestRead: { en: 'Watch whether the pullback preserves the structure that the continuation idea depends on.', zh: '先看这个回调有没有保住延续逻辑赖以成立的结构。' }, driver: { en: 'Structure preservation is the core filter that separates constructive reset from damaging retrace.', zh: '是否保留结构，是区分“建设性重置”和“破坏性回调”的核心过滤器。' }, trap: { en: 'Focusing first on whether price simply looks cheaper.', zh: '第一眼只看价格是不是更便宜。' }, confirmation: { en: 'Check whether support, reclaim quality, and remaining room still line up.', zh: '看支撑、收回质量和剩余空间是否仍然对得上。' } },
    ];

    return buildScenarioQuestionBank('pullback', scenarios, {
      accurateStatement: {
        en: 'A good pullback relieves stretch while preserving structure, location quality, and efficient risk-to-reward.',
        zh: '好的回调，是在缓解拉伸的同时，仍保留结构、位置质量和高效风险回报。',
      },
      falseStatement: {
        en: 'Any dip inside a trend is automatically a great continuation entry.',
        zh: '趋势里的任何回调，都会自动变成很好的延续进场。',
      },
    });
  }

  function buildSessionBehaviourQuestionBank() {
    const scenarios = [
      { id: 'session-1', difficulty: 'foundation', conceptTag: 'thin-drift', situation: { en: 'Gold drifts higher slowly during a very quiet period with little real participation.', zh: '黄金在很安静的时段里缓慢上漂，真实参与并不多。' }, bestRead: { en: 'That move deserves less trust than a move produced during active participation.', zh: '这种走势的可信度，通常低于活跃参与时段走出来的行情。' }, driver: { en: 'Thin-session drift often carries weaker commitment than active-session expansion.', zh: '薄时段慢漂的承接，通常弱于活跃时段扩张。' }, trap: { en: 'Treating all directional movement as equally meaningful regardless of time.', zh: '不管发生在什么时间，都把方向性走势看成一样有意义。' }, confirmation: { en: 'Check what happens once active-session traders arrive.', zh: '看真正活跃的 session 进场后，会怎么对待这段走势。' } },
      { id: 'session-2', difficulty: 'foundation', conceptTag: 'london-expansion', situation: { en: 'London open brings a clean directional expansion out of an overnight balance.', zh: '伦敦开盘后，价格从隔夜平衡区里走出一段很干净的单边扩张。' }, bestRead: { en: 'That is the kind of session-led move that often deserves more respect.', zh: '这种由 session 带出来的扩张，通常更值得尊重。' }, driver: { en: 'Active European participation often improves the quality of breakout and continuation moves in gold.', zh: '欧洲活跃参与，常常会提升黄金突破和延续行情的质量。' }, trap: { en: 'Treating it as no different from a sleepy overnight drift.', zh: '把它和安静隔夜时段的慢漂看成没差别。' }, confirmation: { en: 'Check whether the breakout holds once the opening impulse cools.', zh: '看开盘推动降温后，突破能不能继续守住。' } },
      { id: 'session-3', difficulty: 'foundation', conceptTag: 'new-york-reprice', situation: { en: 'New York arrives and reverses much of the earlier London move after fresh US information.', zh: '纽约盘进场后，在新的美国信息影响下，回吐了伦敦较早前的大部分走势。' }, bestRead: { en: 'The session handover changed the quality of the earlier move materially.', zh: '这次 session 切换，明显改变了前面那段走势的质量。' }, driver: { en: 'Fresh participation can reprice the market rather than simply continue the earlier tape.', zh: '新的参与者会重新定价市场，而不只是机械延续前面的走势。' }, trap: { en: 'Assuming the earlier session move must keep dominating all day.', zh: '以为较早时段的走势一定会统治一整天。' }, confirmation: { en: 'Check whether the new session accepts the reversal or rejects it.', zh: '看新 session 对这段反向动作是接受还是拒绝。' } },
      { id: 'session-4', difficulty: 'foundation', conceptTag: 'overlap-opportunity', situation: { en: 'The London move is healthy, and the overlap begins with continuation from a clean retest.', zh: '伦敦时段本来就走得健康，而重叠时段一开始又从干净回测位置继续延续。' }, bestRead: { en: 'This can be a strong time-of-day edge because active flow is supporting an already coherent idea.', zh: '这可能就是很好的时间优势，因为活跃订单流正在支持一个本来就连贯的想法。' }, driver: { en: 'Best overlap continuation comes when timing and structure already agree before the extra flow arrives.', zh: '最好的重叠时段延续，往往出现在额外流动性到来前，timing 和结构本来就已对齐。' }, trap: { en: 'Thinking overlap is automatically chaotic and therefore always untouchable.', zh: '以为重叠时段一定混乱，所以永远不能碰。' }, confirmation: { en: 'Check whether the retest still holds once overlap flow enters fully.', zh: '看重叠时段订单流完全进来后，这个回测还能不能继续守住。' } },
      { id: 'session-5', difficulty: 'foundation', conceptTag: 'time-mismatch', situation: { en: 'A trader uses breakout logic during a dead period where range drift is more common.', zh: '交易者在一个很死的时段里，用突破逻辑来下单，但那个时段更常见的是区间漂移。' }, bestRead: { en: 'The setup logic may be mismatched with the time-of-day behaviour.', zh: '这套 setup 逻辑，很可能和这个时段的常见行为不匹配。' }, driver: { en: 'Edge often comes from matching the playbook to the session, not forcing one playbook all day.', zh: '真正的优势常来自让剧本配合时段，而不是整天只硬套一种剧本。' }, trap: { en: 'Assuming a favourite setup should be traded the same way at every hour.', zh: '以为自己喜欢的 setup，在每个小时都该同样处理。' }, confirmation: { en: 'Check whether the session normally rewards expansion or mean reversion.', zh: '看这个时段平时更奖励扩张，还是更常回归均值。' } },
      { id: 'session-6', difficulty: 'foundation', conceptTag: 'clock-awareness', situation: { en: 'The chart looks similar on two days, but one is during London open and the other during lunch-hour drift.', zh: '两天的图形看起来很像，但一天发生在伦敦开盘，一天发生在午间慢漂。' }, bestRead: { en: 'Similar shapes can have different meaning when session context is different.', zh: '形状很像，不代表意义一样；session 背景不同，解读就会不同。' }, driver: { en: 'Time context changes the reliability of the same-looking structure.', zh: '时间背景会改变“看起来很像”的结构可靠性。' }, trap: { en: 'Reading patterns as if the clock does not matter.', zh: '读形态时，假装时钟完全不重要。' }, confirmation: { en: 'Check what kind of participation usually exists at that hour.', zh: '看那个时间通常会有什么样的参与质量。' } },
      { id: 'session-7', difficulty: 'foundation', conceptTag: 'lunch-fade', situation: { en: 'A move starts strong but stalls badly into a low-energy midday period.', zh: '一段走势开始得很强，但进入低能量午间后明显熄火。' }, bestRead: { en: 'The time-of-day shift is reducing the quality of the move.', zh: '时间段切换正在降低这段走势的质量。' }, driver: { en: 'Momentum often needs active participation to continue behaving cleanly.', zh: '动能想继续干净延续，通常需要活跃参与来支撑。' }, trap: { en: 'Expecting the same trend quality during a sleepy window.', zh: '在很疲软的时间窗里，还期待同样的趋势质量。' }, confirmation: { en: 'Check whether the move revives only when the next active session begins.', zh: '看是否要等下一个活跃时段开始，走势才重新活起来。' } },
      { id: 'session-8', difficulty: 'foundation', conceptTag: 'false-activity', situation: { en: 'A single large candle appears in a thin session, but the following bars show no commitment.', zh: '薄市场时段里突然冒出一根大蜡烛，但后面几根完全没有承接。' }, bestRead: { en: 'That is weak session-quality evidence because the move lacked follow-through.', zh: '这属于偏弱的时段质量证据，因为后面根本没有延续。' }, driver: { en: 'One dramatic candle does not compensate for poor overall participation quality.', zh: '单独一根戏剧性大蜡烛，弥补不了整体参与质量偏差。' }, trap: { en: 'Calling it an important breakout only because one bar was large.', zh: '只因为有一根大蜡烛，就把它当成重要突破。' }, confirmation: { en: 'Check whether later candles confirm or ignore the initial burst.', zh: '看后续蜡烛是确认这次爆发，还是直接无视它。' } },
      { id: 'session-9', difficulty: 'foundation', conceptTag: 'session-edge', situation: { en: 'A trader only takes breakout setups during hours when gold usually has real participation.', zh: '交易者只在黄金通常有真实参与的时段里做突破 setup。' }, bestRead: { en: 'That can be a real edge because the playbook is aligned with time-of-day quality.', zh: '这可能就是一种真实优势，因为剧本和时段质量是对齐的。' }, driver: { en: 'Time filtering can improve setup quality by removing low-participation noise.', zh: '时间过滤可以把低参与噪音剔掉，从而提升 setup 质量。' }, trap: { en: 'Believing time filters are unnecessary if the chart line is drawn well.', zh: '以为只要图上的线画得好，时间过滤就不需要。' }, confirmation: { en: 'Check whether the chosen hours consistently support the same setup style.', zh: '看你选的时段，是否稳定支持同一种 setup 风格。' } },
      { id: 'session-10', difficulty: 'foundation', conceptTag: 'bridge-summary', situation: { en: 'A beginner asks, “Why does the same setup work in one session and fail in another?”', zh: '初学者问：“为什么同一个 setup，在一个 session 能做，在另一个却失败？”' }, bestRead: { en: 'Because session quality changes participation, volatility, and the kind of movement the market is willing to sustain.', zh: '因为 session 质量会改变参与、波动，以及市场愿意维持哪种走势。' }, driver: { en: 'Time-of-day affects behaviour, not only speed.', zh: '一天中的时间会改变行为，而不只是改变快慢。' }, trap: { en: 'Assuming the chart setup is the whole story by itself.', zh: '以为图表 setup 本身已经是全部故事。' }, confirmation: { en: 'Check what kind of session produced the setup before trusting it.', zh: '先看这个 setup 是在什么样的 session 里长出来的。' } },
      { id: 'session-11', difficulty: 'bridge', conceptTag: 'asia-balance', situation: { en: 'Asia spends hours in balance, then London cleanly breaks the range with real follow-through.', zh: '亚洲时段长时间平衡，随后伦敦很干净地把区间打穿，并带来真实延续。' }, bestRead: { en: 'That is a classic example of session handover changing the behaviour regime.', zh: '这就是经典的 session 交接改变行为状态的例子。' }, driver: { en: 'Balanced overnight trade often gives active sessions something to expand from.', zh: '隔夜平衡交易，常常会给活跃 session 一个可以扩张的基础。' }, trap: { en: 'Calling the London move random because Asia had no trend.', zh: '因为亚洲没趋势，就把伦敦的动作叫随机。' }, confirmation: { en: 'Check whether the broken Asia range becomes usable support or resistance.', zh: '看被打穿的亚洲区间边缘，能否转成可用支撑或阻力。' } },
      { id: 'session-12', difficulty: 'bridge', conceptTag: 'us-data-session', situation: { en: 'A normally clean New York continuation period is disrupted by top-tier US data.', zh: '原本通常很干净的纽约延续时段，被顶级美国数据打断了。' }, bestRead: { en: 'Session tendencies still matter, but event flow can temporarily override them.', zh: 'session 倾向依然重要，但事件流会暂时压过它。' }, driver: { en: 'Time-of-day edge must always be filtered through macro event timing.', zh: '时间优势永远都要再经过宏观事件 timing 的过滤。' }, trap: { en: 'Assuming session statistics overrule real-time event risk.', zh: '以为 session 统计规律能压过实时事件风险。' }, confirmation: { en: 'Check whether the event shock settles back into normal session behaviour later.', zh: '看事件冲击过去后，是否又回到正常 session 行为。' } },
      { id: 'session-13', difficulty: 'bridge', conceptTag: 'overlap-fade', situation: { en: 'The overlap produces a vertical move, but it slams into higher-timeframe supply and loses follow-through fast.', zh: '重叠时段打出一段很垂直的走势，但它直接撞上高周期供给区，而且很快失去延续。' }, bestRead: { en: 'Active timing helped create movement, but location still limits whether the move deserves continuation logic.', zh: '活跃 timing 帮它打出了波动，但位置仍会决定这段走势能不能继续套用延续逻辑。' }, driver: { en: 'Session strength does not cancel higher-timeframe barriers.', zh: 'session 强度，并不会取消高周期障碍。' }, trap: { en: 'Assuming active-session speed always means breakout quality is high.', zh: '以为活跃时段走得快，就一定代表突破质量高。' }, confirmation: { en: 'Check whether the supply zone gets accepted through or rejects the move cleanly.', zh: '看供给区最后是被接受突破，还是干净拒绝。' } },
      { id: 'session-14', difficulty: 'bridge', conceptTag: 'same-clock-different-day', situation: { en: 'London open on Monday drifts differently from London open on NFP Friday.', zh: '周一的伦敦开盘，和 NFP 周五的伦敦开盘，行为完全不同。' }, bestRead: { en: 'Clock time matters, but day context matters too.', zh: '时钟时间重要，但当天背景也一样重要。' }, driver: { en: 'Session behaviour is shaped by both the hour and the broader event landscape of the day.', zh: 'session 行为同时受到时点和当天更大事件背景的塑造。' }, trap: { en: 'Using time-of-day rules as if they are rigid and context-free.', zh: '把时间规则当成僵硬、脱离背景的死规定。' }, confirmation: { en: 'Check what kind of day the session is opening into.', zh: '看这个 session 正在进入的是怎样的一天。' } },
      { id: 'session-15', difficulty: 'bridge', conceptTag: 'session-confirmation', situation: { en: 'A breakout begins in a weak period, but later active-session traders fully accept and extend it.', zh: '一段突破最初开始在偏弱时段，但之后活跃 session 交易者彻底接受并把它继续推开。' }, bestRead: { en: 'The later session confirmation can materially improve the breakout story.', zh: '后面活跃时段的确认，会明显提升这段突破故事的质量。' }, driver: { en: 'A move does not have to start in the best session to become valid later.', zh: '一段走势不一定要在最佳时段开始，才有机会在后面变有效。' }, trap: { en: 'Rejecting the move forever just because its first phase began in weak conditions.', zh: '只因为第一阶段开始在弱时段，就永久否定整段走势。' }, confirmation: { en: 'Check whether active participation later validates the move with acceptance and follow-through.', zh: '看后续活跃参与是否用接受度和延续，把这段走势真正验证。' } },
      { id: 'session-16', difficulty: 'bridge', conceptTag: 'timing-overconfidence', situation: { en: 'The trader memorised “London open bullish” and buys every day at the same minute.', zh: '交易者背下了“伦敦开盘看多”，结果每天到同一分钟就机械买。' }, bestRead: { en: 'That is overconfidence in timing rules without reading the actual tape.', zh: '这属于对 timing 规则的过度自信，却没有真正读盘。' }, driver: { en: 'Time-of-day edge is conditional context, not a blind mechanical command.', zh: '时间优势是有条件的背景，不是盲目的机械指令。' }, trap: { en: 'Turning session tendencies into superstition.', zh: '把 session 倾向变成迷信。' }, confirmation: { en: 'Check whether structure and participation actually support the same idea that day.', zh: '看当天结构和参与质量是否真的支持同一个想法。' } },
      { id: 'session-17', difficulty: 'bridge', conceptTag: 'hand-over-risk', situation: { en: 'A trade looks clean right before session handover, but the next active flow could reprice it sharply.', zh: '一笔交易在 session 切换前看起来很干净，但下一波活跃资金可能会大幅重定价。' }, bestRead: { en: 'Session handover itself is a risk factor that can change the quality of the setup.', zh: 'session 切换本身就是一种风险因素，会改变 setup 质量。' }, driver: { en: 'A setup should be judged not only by what is happening now, but by what participation is about to arrive.', zh: '判断 setup 时，不只要看现在发生什么，也要看接下来会有什么参与进场。' }, trap: { en: 'Ignoring handover risk because the current candles still look calm.', zh: '只因为眼前蜡烛还很平静，就忽视切换风险。' }, confirmation: { en: 'Check whether your setup is entering a stronger or weaker participation window next.', zh: '看你的 setup 接下来是要进入更强参与窗口，还是更弱窗口。' } },
      { id: 'session-18', difficulty: 'bridge', conceptTag: 'midday-range', situation: { en: 'Price rotates repeatedly during lunch hours with no clean expansion even though early morning was directional.', zh: '虽然早盘曾有方向性，但午间时段价格不断来回轮动，没有干净扩张。' }, bestRead: { en: 'The session likely shifted from expansion mode into range mode.', zh: '这个 session 很可能已经从扩张模式，切换成区间模式。' }, driver: { en: 'Time-of-day can change the dominant playbook inside the same trading day.', zh: '同一天里，时间本身也会改变主导剧本。' }, trap: { en: 'Still forcing trend logic simply because the morning moved directionally.', zh: '只因为早盘单边过，就继续硬套趋势逻辑。' }, confirmation: { en: 'Check whether edges of the range now matter more than mid-band breakout attempts.', zh: '看现在是不是区间边缘比中间突破尝试更值得重视。' } },
      { id: 'session-19', difficulty: 'bridge', conceptTag: 'quality-filter', situation: { en: 'Two identical chart patterns appear, but one prints in overlap with active volume and the other in sleepy post-lunch trade.', zh: '两套几乎一样的图形同时出现，但一个出现在重叠时段且成交活跃，另一个出现在午后疲软时段。' }, bestRead: { en: 'The overlap pattern usually deserves more weight because session quality is stronger.', zh: '重叠时段那套通常更值得重视，因为 session 质量更强。' }, driver: { en: 'Pattern quality should be filtered through the quality of the session that produced it.', zh: '形态质量，应该再经过“产生它的 session 质量”过滤。' }, trap: { en: 'Scoring both setups equally because the shapes match.', zh: '只因为形状一样，就给两者同样评分。' }, confirmation: { en: 'Check whether participation and response quality truly match across the two times.', zh: '看这两个时段的参与度和反应质量，是否真的一样。' } },
      { id: 'session-20', difficulty: 'bridge', conceptTag: 'bridge-summary', situation: { en: 'A trader asks, “What is the edge in time-of-day, really?”', zh: '有交易者问：“时间优势到底真正的 edge 是什么？”' }, bestRead: { en: 'The edge is knowing when a setup style is being supported by the kind of participation currently in the market.', zh: '真正的 edge，是知道某种 setup 风格，什么时候会被当前市场里的参与质量支持。' }, driver: { en: 'Time-of-day edge is about matching playbook to participation quality, not predicting the future from the clock alone.', zh: '时间优势的重点，是让剧本对上参与质量，而不是只靠时钟猜未来。' }, trap: { en: 'Thinking the clock itself predicts price without context.', zh: '以为时钟本身就能脱离背景地预测价格。' }, confirmation: { en: 'Check whether the setup and the session are helping each other rather than fighting each other.', zh: '看 setup 和 session 是在互相加分，还是互相打架。' } },
    ];

    return buildScenarioQuestionBank('session', scenarios, {
      accurateStatement: {
        en: 'Session edge comes from matching setup logic to participation quality, order-flow character, and timing context.',
        zh: '时段优势来自让 setup 逻辑，和参与质量、订单流特征、时间背景彼此匹配。',
      },
      falseStatement: {
        en: 'If a chart pattern looks good, the session it forms in does not matter much.',
        zh: '只要图形够漂亮，它出现在什么 session 里就不太重要。',
      },
    });
  }

  function buildVolatilityRegimeQuestionBank() {
    const scenarios = [
      { id: 'vol-1', difficulty: 'foundation', conceptTag: 'atr-regime', situation: { en: 'ATR doubled over two sessions while the trader kept using the same stop width.', zh: 'ATR 两个时段内翻倍，但交易者仍沿用同样止损宽度。' }, bestRead: { en: 'The stop logic is no longer adapted to the current regime.', zh: '这个止损逻辑已经不适配当前波动状态。' }, driver: { en: 'Higher ATR means ordinary noise is larger than before.', zh: 'ATR 变大，代表普通噪音也比以前更大。' }, trap: { en: 'Treating new volatility like an unchanged environment.', zh: '把新的波动环境当成完全没变化。' }, confirmation: { en: 'Check whether your stop still sits outside normal noise for today.', zh: '看你的止损今天是否还在正常噪音之外。' } },
      { id: 'vol-2', difficulty: 'foundation', conceptTag: 'size-adaptation', situation: { en: 'The chart idea still looks valid, but candles are now twice as large as last week.', zh: '图表想法还成立，但蜡烛现在比上周大了两倍。' }, bestRead: { en: 'The idea may still be tradable, but size and stop must adapt.', zh: '这想法也许还能做，但仓位和止损都必须适配。' }, driver: { en: 'Environment change can preserve direction while changing risk structure.', zh: '环境变化可以保留方向，却改变风险结构。' }, trap: { en: 'Thinking valid direction means no change to sizing is needed.', zh: '以为方向还对，就不需要改仓位。' }, confirmation: { en: 'Check whether current range expansion still fits your usual exposure.', zh: '看当前波幅扩张是否还适合你平常的敞口。' } },
      { id: 'vol-3', difficulty: 'foundation', conceptTag: 'poor-asymmetry', situation: { en: 'Stop must widen because volatility expanded, but target room has not improved.', zh: '止损必须放宽，因为波动放大了，但目标空间却没有变大。' }, bestRead: { en: 'This trade asymmetry may now be poor enough to skip.', zh: '这笔交易的不对称性现在可能已经差到该放弃。' }, driver: { en: 'Good setups can become poor trades when volatility changes the maths.', zh: '原本不错的 setup，也可能因波动变化让数学变差。' }, trap: { en: 'Forcing the trade because the original chart looked good.', zh: '只因为原始图形不错，就硬把交易做下去。' }, confirmation: { en: 'Check whether the remaining reward still justifies the wider risk.', zh: '看剩余收益是否还足以合理化更宽风险。' } },
      { id: 'vol-4', difficulty: 'foundation', conceptTag: 'quiet-regime', situation: { en: 'ATR is compressed and intraday candles are small, but the trader expects huge trend targets.', zh: 'ATR 处在压缩状态，日内蜡烛也很小，但交易者还期待超大趋势目标。' }, bestRead: { en: 'Expectations may be too large for the current quiet regime.', zh: '对于当前安静状态，这种预期可能太大了。' }, driver: { en: 'Low-volatility conditions often need tighter expectations or more patience.', zh: '低波动环境通常需要更紧的预期，或更多耐心。' }, trap: { en: 'Demanding explosive targets from sleepy conditions.', zh: '在昏睡环境里还要求爆炸性目标。' }, confirmation: { en: 'Check whether the average travel of recent candles supports your target idea.', zh: '看最近平均运行幅度是否支持你的目标想法。' } },
      { id: 'vol-5', difficulty: 'foundation', conceptTag: 'news-regime', situation: { en: 'ATR jumps after a major data release and the trader wants to “trade normally.”', zh: '重大数据后 ATR 突然跳升，但交易者还想“正常交易”。' }, bestRead: { en: 'Normal assumptions are dangerous when the regime has shifted abruptly.', zh: '当波动状态突然切换时，继续沿用平常假设会很危险。' }, driver: { en: 'Event-driven volatility often invalidates ordinary operating assumptions.', zh: '事件驱动波动常常会让平常的操作假设失效。' }, trap: { en: 'Pretending a regime shift is only temporary noise.', zh: '假装状态切换只是暂时噪音。' }, confirmation: { en: 'Check whether volatility has actually stabilised before trading as usual again.', zh: '看波动是否真的稳定下来，再恢复平常做法。' } },
      { id: 'vol-6', difficulty: 'foundation', conceptTag: 'tight-stop-failure', situation: { en: 'A stop that used to survive normal pullbacks is now repeatedly clipped in the new regime.', zh: '原本能扛住正常回踩的止损，在新状态里反复被打掉。' }, bestRead: { en: 'The stop placement may now be too tight relative to current volatility.', zh: '相对于当前波动，这个止损可能已经太紧。' }, driver: { en: 'Same price structure can require different breathing room in different regimes.', zh: '同样的价格结构，在不同状态里会需要不同呼吸空间。' }, trap: { en: 'Blaming the market for being irrational instead of adapting the stop logic.', zh: '不调整止损逻辑，只怪市场“不讲理”。' }, confirmation: { en: 'Check whether repeated stop-outs come from setup failure or volatility mismatch.', zh: '看反复止损到底来自 setup 失败，还是波动不匹配。' } },
      { id: 'vol-7', difficulty: 'foundation', conceptTag: 'same-size-error', situation: { en: 'The trader keeps identical size across quiet, normal, and explosive days.', zh: '交易者在安静、正常和爆炸性行情日里都用同样仓位。' }, bestRead: { en: 'That ignores regime differences and can distort risk badly.', zh: '这忽视了状态差异，会严重扭曲风险。' }, driver: { en: 'Consistent process does not mean identical exposure in every environment.', zh: '流程一致，不代表每个环境都要用同样敞口。' }, trap: { en: 'Confusing mechanical sameness with disciplined consistency.', zh: '把机械化的一模一样，误会成有纪律的一致性。' }, confirmation: { en: 'Check whether your size logic actually changes with environment risk.', zh: '看你的仓位逻辑是否真的会随环境风险变化。' } },
      { id: 'vol-8', difficulty: 'foundation', conceptTag: 'atr-as-assistant', situation: { en: 'The trader wants ATR to tell them long or short.', zh: '交易者想让 ATR 直接告诉他该做多还是做空。' }, bestRead: { en: 'ATR is for environment adaptation, not direction prediction.', zh: 'ATR 是拿来适配环境的，不是拿来预测方向。' }, driver: { en: 'Volatility tools answer a different question from bias tools.', zh: '波动工具回答的问题，和方向工具不同。' }, trap: { en: 'Using ATR as a substitute for structure and bias reading.', zh: '把 ATR 当成结构和偏向阅读的替代品。' }, confirmation: { en: 'Check what question ATR is actually helping you answer.', zh: '先想清楚 ATR 实际在帮你回答什么问题。' } },
      { id: 'vol-9', difficulty: 'foundation', conceptTag: 'wider-stop-smaller-size', situation: { en: 'The regime is active, so the trader widens stop but reduces size to keep account risk stable.', zh: '当前状态很活跃，所以交易者把止损放宽、同时缩小仓位，让账户风险保持稳定。' }, bestRead: { en: 'That is sensible adaptation because risk is being held constant while structure is respected.', zh: '这属于合理适配，因为它一边尊重结构，一边把账户风险控制住。' }, driver: { en: 'Good process adapts trade structure without losing risk discipline.', zh: '好流程会适配交易结构，同时不丢掉风险纪律。' }, trap: { en: 'Thinking wider stop must always mean more account risk.', zh: '以为止损放宽，就一定代表账户风险更大。' }, confirmation: { en: 'Check whether the smaller size truly offsets the wider stop.', zh: '看缩小后的仓位是否真的抵消了更宽止损。' } },
      { id: 'vol-10', difficulty: 'foundation', conceptTag: 'skip-trade', situation: { en: 'The market is too explosive for your framework, and every adjustment still leaves poor asymmetry.', zh: '市场对你的框架来说已经太爆了，而且怎么调都还是不对称性很差。' }, bestRead: { en: 'No trade may be the highest-quality decision.', zh: '不交易，可能反而是最高质量的决定。' }, driver: { en: 'Adaptation includes recognising when the environment is simply not offering your edge.', zh: '所谓适配，也包括承认这个环境根本没有提供你的优势。' }, trap: { en: 'Forcing action because “there must be a way to trade this.”', zh: '因为“总该有办法做”，就硬逼自己出手。' }, confirmation: { en: 'Check whether the regime still fits your strategy at all.', zh: '看这个状态是否还适合你的策略。' } },
      { id: 'vol-11', difficulty: 'bridge', conceptTag: 'compression-expansion', situation: { en: 'ATR stayed low for days, then expansion starts and the trader still expects compression behaviour.', zh: 'ATR 连续几天很低，随后开始扩张，但交易者仍按压缩状态去预期市场。' }, bestRead: { en: 'The behaviour expectation is lagging behind the regime shift.', zh: '你的行为预期已经落后于波动状态切换。' }, driver: { en: 'Regime changes demand expectation changes, not only stop changes.', zh: '状态切换不仅要求改止损，也要求改预期。' }, trap: { en: 'Updating risk placement but not updating behavioural expectation.', zh: '只改风险摆放，却不改行为预期。' }, confirmation: { en: 'Check whether the market is still compressing or already expanding.', zh: '看市场现在到底还在压缩，还是已经扩张。' } },
      { id: 'vol-12', difficulty: 'bridge', conceptTag: 'late-regime-awareness', situation: { en: 'The trader realises only after three stop-outs that volatility was far above normal.', zh: '交易者是在连续三次止损后，才意识到波动远高于平常。' }, bestRead: { en: 'The adaptation came too late; regime awareness should begin before repeated damage.', zh: '这个适配来得太晚了；状态 awareness 应该在连续受伤前就开始。' }, driver: { en: 'Process quality means noticing the environment early, not after the bill arrives.', zh: '流程质量的体现，是尽早看懂环境，而不是等账单来了才反应。' }, trap: { en: 'Treating repeated stop-outs as unrelated accidents.', zh: '把连续止损当成互不相关的偶然。' }, confirmation: { en: 'Check whether a recent cluster of losses shares the same volatility mismatch.', zh: '看最近这串亏损，是否共享同样的波动不匹配。' } },
      { id: 'vol-13', difficulty: 'bridge', conceptTag: 'target-adaptation', situation: { en: 'ATR shrinks and the trader sensibly shortens target expectations instead of forcing old numbers.', zh: 'ATR 收缩后，交易者很理智地缩短了目标预期，而不是硬套旧数字。' }, bestRead: { en: 'That is good adaptation because expectations now match the environment.', zh: '这就是好的适配，因为预期已经重新匹配环境。' }, driver: { en: 'Target logic should move with regime, not stay fixed out of habit.', zh: '目标逻辑应该跟着状态变化，而不是出于习惯一成不变。' }, trap: { en: 'Treating old target distances as sacred.', zh: '把旧目标距离当成神圣不可改。' }, confirmation: { en: 'Check whether recent average travel still supports the former target size.', zh: '看最近平均运行幅度是否还支持以前的目标大小。' } },
      { id: 'vol-14', difficulty: 'bridge', conceptTag: 'normal-day-overreaction', situation: { en: 'ATR is normal, but the trader widens stops excessively out of fear from the last volatile week.', zh: 'ATR 已回到正常，但交易者因为上一周太刺激，仍然过度放宽止损。' }, bestRead: { en: 'This is adapting to memory, not to the current regime.', zh: '这适配的是“记忆”，不是当前状态。' }, driver: { en: 'Good regime reading must reflect the current market, not recent emotional scars.', zh: '好的状态阅读，必须反映当前市场，而不是近期情绪伤痕。' }, trap: { en: 'Trading the last regime after it has already faded.', zh: '在旧状态已经结束后，仍用旧状态来交易。' }, confirmation: { en: 'Check what ATR and current candle behaviour say now, not last week.', zh: '看现在的 ATR 和蜡烛行为怎么说，而不是看上周。' } },
      { id: 'vol-15', difficulty: 'bridge', conceptTag: 'regime-mix', situation: { en: 'Higher timeframe ATR is calm, but intraday session volatility is temporarily explosive around data.', zh: '更高周期 ATR 还算平静，但日内 session 波动在数据附近短暂爆炸。' }, bestRead: { en: 'Short-term regime adaptation may still be necessary even if the broader backdrop is calmer.', zh: '即使大背景还算平静，短期状态适配也依然必要。' }, driver: { en: 'Regime can be different across horizons, and execution must respect the active horizon.', zh: '不同时间层次的状态可以不同，而执行必须尊重当前活跃层次。' }, trap: { en: 'Using only the higher-timeframe regime and ignoring immediate execution conditions.', zh: '只看高周期状态，却无视当前执行层面的条件。' }, confirmation: { en: 'Check which horizon is actually driving your execution risk right now.', zh: '看现在真正主导你执行风险的是哪个时间层次。' } },
      { id: 'vol-16', difficulty: 'bridge', conceptTag: 'rr-deception', situation: { en: 'A spreadsheet still shows nice R-multiples, but only because it assumes unrealistic fill quality in high volatility.', zh: '表格上看起来 R 倍数很漂亮，但前提是高波动里还假设了不现实的成交质量。' }, bestRead: { en: 'That is deceptive edge because execution slippage is being ignored.', zh: '这属于欺骗性的优势，因为它忽略了执行滑点。' }, driver: { en: 'Volatility adaptation must include execution quality, not only chart geometry.', zh: '波动适配也必须包含执行质量，而不只是图形几何。' }, trap: { en: 'Trusting clean spreadsheet maths from dirty market conditions.', zh: '用脏市场条件，去相信很干净的表格数学。' }, confirmation: { en: 'Check whether your assumptions about fills and spreads still hold in this regime.', zh: '看你对成交和点差的假设，在当前状态里是否仍成立。' } },
      { id: 'vol-17', difficulty: 'bridge', conceptTag: 'regime-patience', situation: { en: 'ATR is elevated, so the trader waits for fewer but cleaner setups instead of trading every fluctuation.', zh: 'ATR 升高后，交易者选择等更少但更干净的 setup，而不是每个波动都去做。' }, bestRead: { en: 'That is disciplined regime filtering, not passivity.', zh: '这叫有纪律的状态过滤，不叫消极。' }, driver: { en: 'When noise increases, selectivity often needs to rise too.', zh: '当噪音增加时，选择性通常也该同步提高。' }, trap: { en: 'Thinking higher volatility automatically means more trades should be taken.', zh: '以为波动越大，就自动代表该做更多交易。' }, confirmation: { en: 'Check whether your setup threshold rises when regime quality falls.', zh: '看当状态质量下降时，你的 setup 门槛是否也跟着提高。' } },
      { id: 'vol-18', difficulty: 'bridge', conceptTag: 'regime-recovery', situation: { en: 'After a volatile event day, ATR starts normalising and ranges compress again.', zh: '在一个剧烈事件日之后，ATR 开始恢复正常，波幅也重新收缩。' }, bestRead: { en: 'The framework can gradually shift back toward normal assumptions, but only as the evidence improves.', zh: '你的框架可以逐步切回正常假设，但前提是证据真的在改善。' }, driver: { en: 'Regime recovery should be observed, not guessed prematurely.', zh: '状态恢复要靠观察确认，而不是过早猜测。' }, trap: { en: 'Assuming one calmer hour means the entire regime is already normal again.', zh: '只因为安静了一小时，就宣布整体状态已经恢复正常。' }, confirmation: { en: 'Check whether calm behaviour persists across more than one small window.', zh: '看安静行为是否能跨越不止一个小时间窗持续存在。' } },
      { id: 'vol-19', difficulty: 'bridge', conceptTag: 'bridge-summary', situation: { en: 'A trader asks, “What is ATR really for in my decision process?”', zh: '有交易者问：“ATR 在我的决策流程里，到底真正是干嘛的？”' }, bestRead: { en: 'It helps adapt stop width, expectations, and size to the volatility regime you are trading.', zh: '它是在帮助你把止损宽度、预期和仓位，适配你正在交易的波动状态。' }, driver: { en: 'ATR is an environment tool that improves execution realism.', zh: 'ATR 是一个环境工具，它会提升执行的现实感。' }, trap: { en: 'Treating ATR as a directional system or an optional decoration.', zh: '把 ATR 当成方向系统，或把它当成可有可无的装饰。' }, confirmation: { en: 'Check whether ATR is changing how you operate, not just what you observe.', zh: '看 ATR 有没有真正改变你的操作，而不只是改变你的观察。' } },
      { id: 'vol-20', difficulty: 'bridge', conceptTag: 'regime-discipline', situation: { en: 'The trader says, “I want one fixed rule set that works the same in every market.”', zh: '交易者说：“我想要一套固定规则，在任何市场里都完全一样有效。”' }, bestRead: { en: 'That ambition ignores regime reality; good rules adapt without becoming random.', zh: '这种想法忽略了状态现实；好的规则会适配，但不会变随机。' }, driver: { en: 'Robust process is flexible at the right places and fixed at the right places.', zh: '稳健流程的关键，是该灵活的地方会灵活，该固定的地方会固定。' }, trap: { en: 'Confusing rigidity with robustness.', zh: '把僵硬误会成稳健。' }, confirmation: { en: 'Check whether your framework distinguishes what must stay fixed from what must adapt.', zh: '看你的框架是否区分了什么必须固定、什么必须适配。' } },
    ];

    return buildScenarioQuestionBank('volatility', scenarios, {
      accurateStatement: {
        en: 'Volatility regime should change stop logic, target expectation, and size when the environment changes meaningfully.',
        zh: '当环境发生明显变化时，波动状态就应该同步改变止损逻辑、目标预期和仓位。',
      },
      falseStatement: {
        en: 'A disciplined trader should use the exact same stop, size, and target assumptions in every volatility regime.',
        zh: '有纪律的交易者，应该在所有波动状态里都用完全相同的止损、仓位和目标假设。',
      },
    });
  }

  function buildSupplyDemandQuestionBank() {
    const scenarios = [
      { id: 'sd-1', difficulty: 'foundation', conceptTag: 'reaction-quality', situation: { en: 'Price taps a demand zone and launches away with fast displacement.', zh: '价格碰到需求区后，立刻快速位移离开。' }, bestRead: { en: 'That is strong reaction quality and deserves respect.', zh: '这属于强反应质量，值得尊重。' }, driver: { en: 'Fast displacement signals real response, not cosmetic respect.', zh: '快速位移说明这是真反应，不是表面尊重。' }, trap: { en: 'Treating it as no different from a weak bounce.', zh: '把它和那种软绵绵的小反弹看成一样。' }, confirmation: { en: 'Check whether later revisits still trigger meaningful reaction.', zh: '看后续再回访时，是否仍能触发有分量的反应。' } },
      { id: 'sd-2', difficulty: 'foundation', conceptTag: 'weak-zone', situation: { en: 'A marked zone is revisited, but the bounce is shallow and immediately fades.', zh: '一个画好的区域再次被碰到，但反弹很浅，而且马上熄火。' }, bestRead: { en: 'This is weak reaction quality and deserves less trust.', zh: '这属于弱反应质量，不该给太高信任。' }, driver: { en: 'Reaction quality depends on what price actually does there, not what the box is called.', zh: '反应质量取决于价格在那边真的做了什么，不是看这个盒子叫什么。' }, trap: { en: 'Calling the zone strong because it reacted at all.', zh: '只要有一点反应，就把区域叫成强区。' }, confirmation: { en: 'Check whether the reaction meaningfully changes behaviour or barely interrupts it.', zh: '看这个反应是否真正改变行为，还是只是轻微打断。' } },
      { id: 'sd-3', difficulty: 'foundation', conceptTag: 'consumed-zone', situation: { en: 'A supply zone has been touched three times and each rejection is smaller.', zh: '一个供给区已经被碰了三次，而且每次拒绝都更弱。' }, bestRead: { en: 'The zone may be getting consumed and losing authority.', zh: '这个区域可能正在被消耗，权威在下降。' }, driver: { en: 'Repeated testing with weaker reaction usually means edge is decaying.', zh: '反复测试、反应更弱，通常代表优势在衰减。' }, trap: { en: 'Treating repeated touches as proof that the zone is getting stronger.', zh: '把反复被碰，误当成越来越强的证明。' }, confirmation: { en: 'Check whether the next touch produces a cleaner break.', zh: '看下一次碰到时，是否更容易出现干净破位。' } },
      { id: 'sd-4', difficulty: 'foundation', conceptTag: 'freshness', situation: { en: 'A fresh demand zone is revisited for the first time since the impulse originated there.', zh: '一个新鲜需求区，自从推动起点以来第一次被重新回访。' }, bestRead: { en: 'Freshness can improve zone quality if behaviour confirms it.', zh: '如果行为配合，新鲜度会提升区域质量。' }, driver: { en: 'Untouched zones often deserve more attention than repeatedly used ones.', zh: '未被反复使用的区域，通常比被反复消耗的更值得注意。' }, trap: { en: 'Treating first-touch and fifth-touch zones as identical.', zh: '把第一次回访和第五次回访看成一样。' }, confirmation: { en: 'Check whether the first revisit produces a sharp reaction.', zh: '看第一次回访是否给出干净而迅速的反应。' } },
      { id: 'sd-5', difficulty: 'foundation', conceptTag: 'order-block-label', situation: { en: 'A trader labels a box as an order block, but price slices through it with almost no response.', zh: '交易者把一个盒子叫成订单块，但价格几乎没反应就切穿了它。' }, bestRead: { en: 'The label does not save the zone if reaction quality is poor.', zh: '如果反应质量很差，再漂亮的标签也救不了这个区域。' }, driver: { en: 'Names do not create edge; behaviour does.', zh: '边优势不是靠命名产生的，而是靠行为。' }, trap: { en: 'Defending the label after the market already invalidated the behaviour.', zh: '市场行为都否定了，还继续捍卫那个标签。' }, confirmation: { en: 'Check what the market actually defended, not what you hoped it would defend.', zh: '看市场真正防守了什么，而不是你希望它防守什么。' } },
      { id: 'sd-6', difficulty: 'foundation', conceptTag: 'displacement', situation: { en: 'A zone produces one clean move that immediately reclaims structure.', zh: '某个区域带出一段干净位移，而且立刻收回结构。' }, bestRead: { en: 'That is stronger evidence of meaningful demand or supply than a hesitant drift.', zh: '这比那种犹豫慢漂，更能证明这里有意义上的供需反应。' }, driver: { en: 'Displacement often reveals stronger intent than passive bouncing.', zh: '位移常比被动弹一下更能暴露意图。' }, trap: { en: 'Treating displacement and weak chop as equivalent reactions.', zh: '把有位移的反应和弱震荡当成等价。' }, confirmation: { en: 'Check whether follow-through after the displacement remains coherent.', zh: '看位移后的后续是否还能保持连贯。' } },
      { id: 'sd-7', difficulty: 'foundation', conceptTag: 'mid-chart-box', situation: { en: 'A trader draws an order block in the middle of nowhere with no clear structure shift attached to it.', zh: '交易者在图中央一个没什么背景的位置画了订单块，而且没有明显结构转换。' }, bestRead: { en: 'This is low-quality context and likely over-labeling.', zh: '这属于低质量背景，很可能只是过度贴标签。' }, driver: { en: 'Good zones usually connect to meaningful structure, displacement, or repeated memory.', zh: '好区域通常会连到有意义的结构、位移，或被市场记住的位置。' }, trap: { en: 'Thinking every candle cluster deserves a special box.', zh: '以为每一团 K 线都值得一个特别的盒子。' }, confirmation: { en: 'Check whether the marked area actually changed market behaviour before.', zh: '看这个区域以前是否真的改变过市场行为。' } },
      { id: 'sd-8', difficulty: 'foundation', conceptTag: 'reclaim-zone', situation: { en: 'Price sweeps below demand, then quickly reclaims the zone and closes back above it.', zh: '价格先扫穿需求区，随后很快把区域收回并收在上方。' }, bestRead: { en: 'The zone may still matter because reclaim quality restored it.', zh: '这个区域可能仍然有效，因为收回质量把它重新救回来了。' }, driver: { en: 'A quick reclaim can preserve zone relevance after a brief raid.', zh: '快速收回，可以在短暂扫流动性后保住区域相关性。' }, trap: { en: 'Declaring the zone dead forever from the first pierce.', zh: '只看第一次刺穿，就宣布区域永久死亡。' }, confirmation: { en: 'Check whether price can continue to hold above the reclaimed area.', zh: '看收回后价格能否继续守在区域上方。' } },
      { id: 'sd-9', difficulty: 'foundation', conceptTag: 'reaction-speed', situation: { en: 'One zone reacts instantly while another needs many slow candles before doing anything.', zh: '一个区域碰到就立刻反应，另一个则拖很多根慢蜡烛才有动作。' }, bestRead: { en: 'Reaction speed is one useful clue in judging zone quality.', zh: '反应速度，是判断区域质量的一个有用线索。' }, driver: { en: 'High-quality zones often show clearer urgency from one side of the market.', zh: '高质量区域，常会表现出更明显的一侧急迫性。' }, trap: { en: 'Ignoring reaction speed completely when comparing zones.', zh: '比较区域时，完全无视反应速度。' }, confirmation: { en: 'Check whether the fast reaction also creates meaningful displacement.', zh: '看快速反应之后，是否也带来了有意义位移。' } },
      { id: 'sd-10', difficulty: 'foundation', conceptTag: 'bridge-summary', situation: { en: 'A trader asks, “How do I know whether a supply or demand zone is actually good?”', zh: '有交易者问：“我怎么知道一个供需区到底好不好？”' }, bestRead: { en: 'Judge freshness, reaction quality, and whether the market still responds with force there.', zh: '看新鲜度、反应质量，以及市场是否仍然在那边给出有力量的回应。' }, driver: { en: 'Zone quality is behavioural, not decorative.', zh: '区域质量是行为属性，不是装饰属性。' }, trap: { en: 'Answering only with vocabulary and ignoring live price response.', zh: '只会回答名词定义，却忽略实时价格反应。' }, confirmation: { en: 'Check whether the zone still changes price behaviour meaningfully right now.', zh: '看这个区域现在是否还能真实改变价格行为。' } },
      { id: 'sd-11', difficulty: 'bridge', conceptTag: 'supply-into-liquidity', situation: { en: 'Price rallies into equal highs and a higher-timeframe supply zone at the same time.', zh: '价格上涨时，同时撞上等高流动性和更高周期供给区。' }, bestRead: { en: 'That is stronger supply context because location and likely liquidity both align.', zh: '这会强化供给背景，因为位置和潜在流动性同时对齐。' }, driver: { en: 'Independent reasons at the same location can improve zone significance.', zh: '同一位置上多个独立理由对齐，会提高区域的重要性。' }, trap: { en: 'Treating the supply zone the same as any random mid-chart box.', zh: '把这种供给区和图中随机盒子看成一样。' }, confirmation: { en: 'Check whether reaction quality is as strong as the location quality suggests.', zh: '看反应质量是否配得上位置质量。' } },
      { id: 'sd-12', difficulty: 'bridge', conceptTag: 'weak-order-block', situation: { en: 'The supposed order block causes only one tiny pause before price keeps running through it.', zh: '所谓订单块只造成一次很小停顿，然后价格继续穿过去。' }, bestRead: { en: 'That is weak evidence and should not be over-respected later.', zh: '这证据很弱，后面不该过度尊重。' }, driver: { en: 'Minor pauses do not automatically create powerful zones.', zh: '小停顿不会自动变成强区域。' }, trap: { en: 'Recycling every tiny pause into a future institutional level.', zh: '把每个小停顿都回收成未来机构位。' }, confirmation: { en: 'Check whether the zone ever produced meaningful displacement or structure change.', zh: '看这个区域是否曾带来有意义位移或结构变化。' } },
      { id: 'sd-13', difficulty: 'bridge', conceptTag: 'nested-zones', situation: { en: 'A broad demand area contains a smaller intraday reaction pocket inside it.', zh: '一个较宽的大需求区里面，又包着一个更小的日内反应袋。' }, bestRead: { en: 'The smaller pocket can help refine entry, but the larger area still defines the main context.', zh: '较小口袋可以帮助细化进场，但较大的区域仍定义主要背景。' }, driver: { en: 'Refinement is useful only when it remains anchored to the larger zone context.', zh: '细化只有在仍然锚定大区域背景时才有价值。' }, trap: { en: 'Forgetting the larger zone and worshipping only the tiny internal pocket.', zh: '忘掉大区域，只迷信里面那个小口袋。' }, confirmation: { en: 'Check whether the smaller pocket actually behaves inside the larger demand framework.', zh: '看较小口袋是否真的是在较大需求框架内发挥作用。' } },
      { id: 'sd-14', difficulty: 'bridge', conceptTag: 'zone-exhaustion', situation: { en: 'Every bounce from the zone becomes smaller and shorter-lived over several sessions.', zh: '跨几个 session 之后，这个区域的每次反弹都更小、更短命。' }, bestRead: { en: 'That is classic evidence of zone exhaustion.', zh: '这就是区域衰竭的经典证据。' }, driver: { en: 'The market is gradually consuming the response quality that once made the zone useful.', zh: '市场正在逐步消耗，让这个区域曾经有用的那部分反应质量。' }, trap: { en: 'Focusing only on the number of bounces and not their decaying quality.', zh: '只数反弹次数，不看质量在衰减。' }, confirmation: { en: 'Check whether the next test breaks more easily than the earlier ones.', zh: '看下一次测试是否比之前更容易被打穿。' } },
      { id: 'sd-15', difficulty: 'bridge', conceptTag: 'fresh-vs-consumed', situation: { en: 'Two demand zones exist: one is fresh and one has already been tested repeatedly.', zh: '现在有两个需求区：一个很新鲜，一个已经反复被打。' }, bestRead: { en: 'The fresh zone usually deserves more weight unless the consumed one still shows clearly superior reaction quality.', zh: '通常新鲜区更值得重视，除非那个被打过的区域仍展示出明显更强的反应质量。' }, driver: { en: 'Freshness and reaction strength must be weighed together, not separately.', zh: '新鲜度和反应强度要一起权衡，而不是分开看。' }, trap: { en: 'Using freshness alone and ignoring live behaviour.', zh: '只看新鲜度，完全不看实时行为。' }, confirmation: { en: 'Check whether the older zone still reacts with enough force to compete.', zh: '看旧区域的反应是否还足够有力，值得和新区域竞争。' } },
      { id: 'sd-16', difficulty: 'bridge', conceptTag: 'false-confidence-box', situation: { en: 'A trader keeps redrawing the box after each failure so it still “looks respected.”', zh: '交易者每失败一次就重画盒子，好让它看起来仍然“被尊重”。' }, bestRead: { en: 'That is chart cosmetics, not honest zone reading.', zh: '这叫图表美容，不叫诚实读区。' }, driver: { en: 'If your zone must keep moving to stay correct, the original read may not have had edge.', zh: '如果你的区域必须一直移动才能保持“正确”，原始判断可能根本没边。' }, trap: { en: 'Using redraws to hide declining quality.', zh: '用重画来掩盖质量下降。' }, confirmation: { en: 'Check whether the same market logic still supports the zone after each redraw.', zh: '看每次重画后，是否仍有同样的市场逻辑支持这个区域。' } },
      { id: 'sd-17', difficulty: 'bridge', conceptTag: 'supply-failure', situation: { en: 'A supply zone rejects once, then the next revisit rips straight through and holds above.', zh: '一个供给区第一次有拒绝，但下次再来时直接穿过去，而且站稳在上方。' }, bestRead: { en: 'The supply story has weakened materially because the zone failed its next test.', zh: '供给故事已经明显转弱，因为区域在下一次测试时失败了。' }, driver: { en: 'Zones must keep proving themselves; one historical reaction is not permanent authority.', zh: '区域必须持续证明自己；历史上一段反应，不代表永久权威。' }, trap: { en: 'Still shorting aggressively only because the zone once mattered.', zh: '只因为这个区以前有用过，就继续激进做空。' }, confirmation: { en: 'Check whether the old supply now acts as support after the break.', zh: '看这个旧供给区破掉后，是否反而转成支撑。' } },
      { id: 'sd-18', difficulty: 'bridge', conceptTag: 'demand-inside-range', situation: { en: 'A demand zone sits in the middle of a broad range instead of at the lower edge.', zh: '一个需求区位于大区间中间，而不是位于下沿。' }, bestRead: { en: 'Its location makes it less attractive than a zone near the actual edge of the range.', zh: '它的位置让它比区间边缘附近的区域更不吸引。' }, driver: { en: 'Zone quality is not only about the box itself, but also where it sits in broader structure.', zh: '区域质量不仅看盒子本身，也看它落在更大结构的哪里。' }, trap: { en: 'Ignoring broader range location because the box looks neat locally.', zh: '只因局部盒子画得漂亮，就忽视大区间位置。' }, confirmation: { en: 'Check whether there is better edge elsewhere in the larger structure.', zh: '看更大结构里是否有更好的优势位置。' } },
      { id: 'sd-19', difficulty: 'bridge', conceptTag: 'reaction-vs-story', situation: { en: 'The story behind a zone sounds sophisticated, but the live reaction stays messy and weak.', zh: '这个区域背后的故事听起来很高级，但实时反应却一直很乱、很弱。' }, bestRead: { en: 'The live reaction should outweigh the clever story.', zh: '实时反应，应该比那个听起来很聪明的故事更重要。' }, driver: { en: 'Good narratives cannot rescue poor live behaviour forever.', zh: '再好的叙事，也救不了长期很差的实时行为。' }, trap: { en: 'Believing the story more than the chart in front of you.', zh: '相信故事，超过相信眼前的图。' }, confirmation: { en: 'Check whether reaction quality finally justifies the narrative, or keeps contradicting it.', zh: '看反应质量最终有没有配得上这个叙事，还是一直在打脸它。' } },
      { id: 'sd-20', difficulty: 'bridge', conceptTag: 'bridge-summary', situation: { en: 'A trader asks, “What is the most advanced way to read supply and demand?”', zh: '有交易者问：“读供需区最进阶的方式是什么？”' }, bestRead: { en: 'Read freshness, location, reaction quality, and consumption together instead of relying on labels alone.', zh: '把新鲜度、位置、反应质量和消耗程度一起读，而不是只靠标签。' }, driver: { en: 'Advanced zone reading is dynamic and behavioural, not static and decorative.', zh: '更进阶的区域阅读，是动态的、行为式的，不是静态装饰式的。' }, trap: { en: 'Searching for the perfect label instead of the real behaviour.', zh: '一直寻找完美标签，却不去看真实行为。' }, confirmation: { en: 'Check whether the zone still has both context quality and live response quality.', zh: '看这个区域现在是否仍同时具备背景质量和实时反应质量。' } },
    ];

    return buildScenarioQuestionBank('supply-demand', scenarios, {
      accurateStatement: {
        en: 'Supply and demand quality comes from freshness, location, and reaction quality, not from labels alone.',
        zh: '供需区的质量，来自新鲜度、位置和反应质量，而不是只来自标签。',
      },
      falseStatement: {
        en: 'If a zone has a sophisticated name, it deserves automatic respect even when the reaction is weak.',
        zh: '只要一个区域名字够高级，就算反应很弱也该自动尊重。',
      },
    });
  }

  function buildConfluenceQuestionBank() {
    const scenarios = [
      { id: 'conf-1', difficulty: 'foundation', conceptTag: 'independent-factors', situation: { en: 'Support location, H1 bias, and active London timing all support the same idea.', zh: '支撑位置、H1 偏向和活跃伦敦时段都在支持同一个想法。' }, bestRead: { en: 'This is useful confluence because different layers are agreeing.', zh: '这属于有用共振，因为不同层次在对齐。' }, driver: { en: 'Confluence is strongest when layers answer different questions.', zh: '共振最强的时候，是不同层次在回答不同问题。' }, trap: { en: 'Treating this the same as three duplicated indicators saying the same thing.', zh: '把这种情况和三个重复指标一起说话看成一样。' }, confirmation: { en: 'Check whether each layer is genuinely independent.', zh: '看每一层是否真的是独立信息。' } },
      { id: 'conf-2', difficulty: 'foundation', conceptTag: 'duplicate-signals', situation: { en: 'Three momentum indicators all show similar bullish momentum at the same moment.', zh: '三个动能指标在同一时刻都显示类似的多头动能。' }, bestRead: { en: 'This is less powerful than independent confluence because much of the information overlaps.', zh: '这不如独立共振有力，因为很多信息其实是重叠的。' }, driver: { en: 'Duplicate signals rarely create proportional edge.', zh: '重复信号很少会成比例增加优势。' }, trap: { en: 'Counting similar tools as three separate reasons of equal weight.', zh: '把很像的工具硬算成三条同样有分量的理由。' }, confirmation: { en: 'Check whether the tools truly add different information.', zh: '看这些工具是否真的在补充不同信息。' } },
      { id: 'conf-3', difficulty: 'foundation', conceptTag: 'too-many-filters', situation: { en: 'A setup already has location and bias aligned, but the trader keeps waiting for many extra confirmations.', zh: '一笔 setup 已经位置和偏向对齐，但交易者还在继续等一大堆额外确认。' }, bestRead: { en: 'This risks turning useful confluence into overfitting.', zh: '这有可能把有用共振变成过度拟合。' }, driver: { en: 'More filters are not always more edge; sometimes they are more delay.', zh: '更多过滤不一定是更多优势；有时只是更多延迟。' }, trap: { en: 'Assuming every extra condition improves the trade equally.', zh: '以为每加一个条件，交易就一定同样变好。' }, confirmation: { en: 'Check whether the added filter changes decisions meaningfully or only postpones them.', zh: '看新增过滤是有意义地改变决策，还是只在拖延决策。' } },
      { id: 'conf-4', difficulty: 'foundation', conceptTag: 'location-first', situation: { en: 'Indicator signals look nice, but the setup sits directly under higher-timeframe resistance.', zh: '指标信号看起来不错，但 setup 正好压在高周期阻力下面。' }, bestRead: { en: 'Location still deserves more weight than decorative confluence.', zh: '位置仍比那些装饰性共振更值得重视。' }, driver: { en: 'Bad location can degrade even pretty signal stacks.', zh: '位置不好，连漂亮信号堆栈都会被打折。' }, trap: { en: 'Using indicators to override obviously poor location.', zh: '拿指标去硬压过明显很差的位置。' }, confirmation: { en: 'Check whether the bigger barrier has actually cleared.', zh: '看更大的障碍是否真的清掉了。' } },
      { id: 'conf-5', difficulty: 'foundation', conceptTag: 'simple-framework', situation: { en: 'The trader uses only structure, location, and timing to make decisions consistently.', zh: '交易者只用结构、位置和 timing 三层，稳定做决策。' }, bestRead: { en: 'That can be stronger than a bloated checklist if those three layers are well understood.', zh: '如果这三层理解得够深，这通常会比一大坨清单更强。' }, driver: { en: 'Quality of framework matters more than quantity of items.', zh: '框架质量，往往比条目数量更重要。' }, trap: { en: 'Assuming a simple framework must be unsophisticated.', zh: '以为框架简单，就一定不够进阶。' }, confirmation: { en: 'Check whether the smaller framework still answers the core trade questions.', zh: '看这套更小框架是否仍回答了核心交易问题。' } },
      { id: 'conf-6', difficulty: 'foundation', conceptTag: 'hindsight-checklist', situation: { en: 'The trader explains every good past trade with ten reasons but could not have acted on all ten in real time.', zh: '交易者事后能给每一笔好单找十个理由，但实时里根本不可能同时执行这十个条件。' }, bestRead: { en: 'This is hindsight-heavy confluence, not necessarily real-time edge.', zh: '这更像事后共振，不一定是真实时间里的优势。' }, driver: { en: 'A usable framework must survive real-time uncertainty, not only hindsight clarity.', zh: '可用框架必须能活在实时不确定性里，不是只在事后清晰。' }, trap: { en: 'Mistaking rich hindsight explanation for real tradeability.', zh: '把事后解释丰富，误会成实时可交易。' }, confirmation: { en: 'Check whether the confluence could truly be recognised and acted on live.', zh: '看这些共振是否真的能在实时被认出并执行。' } },
      { id: 'conf-7', difficulty: 'foundation', conceptTag: 'confluence-vs-fear', situation: { en: 'The trader adds more filters each week because they are afraid of being wrong.', zh: '交易者每周都在加过滤条件，因为他害怕做错。' }, bestRead: { en: 'This may be emotional self-protection disguised as better confluence.', zh: '这可能是情绪自我保护，伪装成更好的共振。' }, driver: { en: 'Some filter stacking is fear management, not edge building.', zh: '有些堆过滤，其实是在管理恐惧，不是在建立优势。' }, trap: { en: 'Calling all extra conditions “discipline” automatically.', zh: '把所有额外条件都自动叫成“纪律”。' }, confirmation: { en: 'Check whether the added conditions improved results or only reduced action.', zh: '看新增条件是改善结果，还是只是减少行动。' } },
      { id: 'conf-8', difficulty: 'foundation', conceptTag: 'timing-layer', situation: { en: 'A setup has strong structure and location, but occurs in a thin dead period.', zh: '一笔 setup 结构和位置都很好，但偏偏发生在很薄、很死的时段。' }, bestRead: { en: 'Missing timing quality means the confluence is incomplete.', zh: '缺少 timing 质量，代表这套共振其实还不完整。' }, driver: { en: 'Confluence should include participation quality, not only chart geometry.', zh: '共振应包含参与质量，而不只看图形几何。' }, trap: { en: 'Thinking location plus bias is always enough by themselves.', zh: '以为位置加偏向永远就已经足够。' }, confirmation: { en: 'Check whether a better session would improve execution quality materially.', zh: '看换到更好的时段后，执行质量是否会明显改善。' } },
      { id: 'conf-9', difficulty: 'foundation', conceptTag: 'bridge-summary', situation: { en: 'A trader asks, “How many things should line up before I take a trade?”', zh: '有交易者问：“一笔单到底要多少东西对齐，我才该做？”' }, bestRead: { en: 'Enough independent factors to create clarity, but not so many that the process becomes fragile.', zh: '要多到足以形成清晰，但不要多到让流程变脆弱。' }, driver: { en: 'The correct number is determined by robustness, not by maximal complexity.', zh: '正确数量取决于稳健性，而不是复杂度越高越好。' }, trap: { en: 'Looking for a magical fixed number of conditions.', zh: '寻找一个神奇固定数字，好像条件越多越对。' }, confirmation: { en: 'Check whether each factor adds unique decision value.', zh: '看每一个因素是否都在增加独特的决策价值。' } },
      { id: 'conf-10', difficulty: 'foundation', conceptTag: 'conflict-layer', situation: { en: 'Two strong layers align, but one secondary signal disagrees slightly.', zh: '两个强层次已经对齐，但有一个次要信号略微不同意。' }, bestRead: { en: 'A minor disagreement does not necessarily invalidate the whole setup.', zh: '一个次要分歧，不一定能推翻整个 setup。' }, driver: { en: 'Confluence is about weighting layers properly, not demanding perfect uniformity.', zh: '共振的重点是正确加权，而不是要求完美一致。' }, trap: { en: 'Throwing away the setup because every tiny detail is not identical.', zh: '只因为每个小细节不完全一致，就把整笔 setup 丢掉。' }, confirmation: { en: 'Check whether the disagreement affects the core thesis or only a minor detail.', zh: '看这个分歧影响的是核心 thesis，还是只是次要细节。' } },
      { id: 'conf-11', difficulty: 'bridge', conceptTag: 'weighting', situation: { en: 'Higher-timeframe bias, support shelf, and session timing align, while one oscillator is neutral.', zh: '高周期偏向、支撑平台和时段 timing 都对齐，但某个震荡指标只是中性。' }, bestRead: { en: 'The core confluence remains strong because the neutral oscillator is low-weight context.', zh: '核心共振依然很强，因为那个中性震荡指标只是低权重背景。' }, driver: { en: 'Not all confluence layers deserve equal weight.', zh: '不是每一层共振都该拥有同样权重。' }, trap: { en: 'Letting a neutral minor tool cancel major alignment.', zh: '让一个中性的次要工具，取消掉主要对齐。' }, confirmation: { en: 'Check which layers are truly driving the trade thesis.', zh: '看哪些层次才是真正在驱动交易 thesis。' } },
      { id: 'conf-12', difficulty: 'bridge', conceptTag: 'robust-setup', situation: { en: 'A setup still makes sense even if one supporting indicator is removed from the chart.', zh: '就算把一个辅助指标拿掉，这笔 setup 仍然讲得通。' }, bestRead: { en: 'That suggests robust confluence rather than indicator dependency.', zh: '这说明它更像稳健共振，而不是指标依赖。' }, driver: { en: 'Strong frameworks can survive the removal of secondary decoration.', zh: '强框架可以承受次要装饰被拿掉。' }, trap: { en: 'Building a setup that collapses if any tiny layer is missing.', zh: '把 setup 设计成少一个小层次就彻底垮掉。' }, confirmation: { en: 'Check whether the main thesis still stands without the secondary tool.', zh: '看拿掉次要工具后，主 thesis 是否仍站得住。' } },
      { id: 'conf-13', difficulty: 'bridge', conceptTag: 'checklist-fragility', situation: { en: 'The trader misses many good trades because one tiny checklist item is often absent.', zh: '交易者错过很多好机会，因为常常只差一个很小的 checklist 条目。' }, bestRead: { en: 'The checklist may be too fragile for live markets.', zh: '这份 checklist 可能对真实市场来说太脆弱。' }, driver: { en: 'Fragile rules can reduce opportunity without improving quality proportionally.', zh: '脆弱规则会减少机会，却不一定成比例提升质量。' }, trap: { en: 'Assuming missed trades always prove discipline rather than over-filtering.', zh: '把所有错过机会都自动解读成“有纪律”，而不是过滤过度。' }, confirmation: { en: 'Check whether the missing item truly predicts quality or is only cosmetic.', zh: '看缺失的那一项，是否真的能预测质量，还是只是装饰。' } },
      { id: 'conf-14', difficulty: 'bridge', conceptTag: 'independent-logic', situation: { en: 'A setup has support, liquidity pool above, and active-session timing all pointing to the same long idea.', zh: '一笔 setup 同时拥有支撑、上方流动性池和活跃时段 timing，一起指向多头想法。' }, bestRead: { en: 'This is high-quality confluence because each element contributes different logic to the same trade.', zh: '这属于高质量共振，因为每个元素都在用不同逻辑支撑同一笔交易。' }, driver: { en: 'The strongest confluence is layered, not duplicated.', zh: '最强的共振是分层互补，不是重复堆叠。' }, trap: { en: 'Scoring this no better than a cluster of similar oscillators.', zh: '把它和一堆相似震荡指标的聚堆打成同分。' }, confirmation: { en: 'Check whether each factor answers a distinct risk or edge question.', zh: '看每个因素是否都在回答不同的风险或优势问题。' } },
      { id: 'conf-15', difficulty: 'bridge', conceptTag: 'late-entry-overfit', situation: { en: 'By the time all extra filters agree, the setup is late and the reward is worse.', zh: '等到所有额外过滤都同意时，setup 已经晚了，收益空间也变差。' }, bestRead: { en: 'The extra confluence may be reducing edge by delaying execution too much.', zh: '这些额外共振，可能因为过度拖延执行而在削弱优势。' }, driver: { en: 'Perfect-looking alignment can arrive too late to be valuable.', zh: '看起来完美的对齐，有时会晚到失去价值。' }, trap: { en: 'Celebrating perfect confirmation while ignoring declining asymmetry.', zh: '只庆祝完美确认，却无视不对称性正在变差。' }, confirmation: { en: 'Check whether the remaining reward still justifies waiting for all filters.', zh: '看等到所有过滤齐全后，剩余收益是否仍值得。' } },
      { id: 'conf-16', difficulty: 'bridge', conceptTag: 'process-simplicity', situation: { en: 'A trader can explain their trade with three coherent reasons in ten seconds.', zh: '交易者能在十秒内用三条连贯理由解释这笔交易。' }, bestRead: { en: 'That is often a sign of strong confluence design rather than lack of sophistication.', zh: '这通常说明共振设计得好，而不是“不够复杂”。' }, driver: { en: 'If the framework is clear, it is easier to execute and review honestly.', zh: '如果框架够清楚，就更容易执行，也更容易诚实复盘。' }, trap: { en: 'Believing complicated explanations are automatically more advanced.', zh: '以为解释越复杂，就自动越进阶。' }, confirmation: { en: 'Check whether the few reasons still cover context, location, and execution quality.', zh: '看这几条理由是否仍涵盖背景、位置和执行质量。' } },
      { id: 'conf-17', difficulty: 'bridge', conceptTag: 'minor-layer-removal', situation: { en: 'Removing one oscillator barely changes which setups the trader would take.', zh: '拿掉一个震荡指标后，交易者会做的 setup 几乎没变。' }, bestRead: { en: 'That suggests the indicator was probably not adding much unique value.', zh: '这说明那个指标大概没增加太多独特价值。' }, driver: { en: 'If removing a layer changes nothing, the layer may be redundant.', zh: '如果拿掉一层什么都没变，那这一层可能是冗余的。' }, trap: { en: 'Keeping redundant tools just because they look professional.', zh: '只因为看起来专业，就继续保留冗余工具。' }, confirmation: { en: 'Check whether the removed tool ever changed real decisions materially.', zh: '看被移除的工具，过去是否真的显著改变过决策。' } },
      { id: 'conf-18', difficulty: 'bridge', conceptTag: 'market-messiness', situation: { en: 'The market is slightly messy, but the setup still has enough aligned evidence to be tradable.', zh: '市场有一点乱，但这笔 setup 仍然有足够对齐证据可交易。' }, bestRead: { en: 'Good confluence can survive mild imperfection without needing a fantasy-perfect chart.', zh: '好的共振可以在轻度不完美中存活，不需要幻想级完美图形。' }, driver: { en: 'Real-world robustness matters more than textbook perfection.', zh: '现实世界里的稳健性，通常比教科书式完美更重要。' }, trap: { en: 'Rejecting every slightly messy setup no matter how strong the core alignment is.', zh: '不管核心对齐多强，只要有一点乱就全部拒绝。' }, confirmation: { en: 'Check whether the mess damages the thesis or simply reflects normal market texture.', zh: '看这些“乱”是在伤害 thesis，还是只是正常市场纹理。' } },
      { id: 'conf-19', difficulty: 'bridge', conceptTag: 'bridge-summary', situation: { en: 'A trader asks, “What is the difference between confluence and overfitting?”', zh: '有交易者问：“共振和过度拟合的差别到底是什么？”' }, bestRead: { en: 'Confluence adds independent clarity; overfitting adds fragile conditions that mostly reduce real-time usability.', zh: '共振是在增加独立清晰度；过度拟合是在增加脆弱条件，主要会降低实时可用性。' }, driver: { en: 'The difference is robustness under live uncertainty.', zh: '它们的差别，在于能不能活在实时不确定性里。' }, trap: { en: 'Defining overfitting only by number of tools, not by fragility of process.', zh: '只按工具数量定义过拟合，而不看流程脆弱性。' }, confirmation: { en: 'Check whether the framework improves action or merely beautifies hindsight.', zh: '看这套框架是在改善行动，还是只是在美化事后解释。' } },
      { id: 'conf-20', difficulty: 'bridge', conceptTag: 'decisiveness', situation: { en: 'The trader becomes calmer and more decisive after simplifying confluence to a few strong layers.', zh: '交易者把共振简化成几个强层次后，反而更冷静、更果断。' }, bestRead: { en: 'That is often a sign the framework became more robust, not weaker.', zh: '这通常说明框架变得更稳健了，而不是更弱。' }, driver: { en: 'Robust confluence reduces noise and decision paralysis.', zh: '稳健共振会减少噪音和决策瘫痪。' }, trap: { en: 'Assuming more hesitation must mean deeper analysis.', zh: '以为越犹豫，就代表分析越深。' }, confirmation: { en: 'Check whether the simplified framework still catches your best setups consistently.', zh: '看这套简化框架是否仍能稳定抓住你最好的 setup。' } },
    ];

    return buildScenarioQuestionBank('confluence', scenarios, {
      accurateStatement: {
        en: 'Good confluence adds independent clarity without making the process fragile, delayed, or hindsight-dependent.',
        zh: '好的共振，会增加独立清晰度，但不会让流程变脆弱、变拖延、或变成依赖事后解释。',
      },
      falseStatement: {
        en: 'The more filters and confirmations a trader adds, the more edge they automatically create.',
        zh: '交易者加的过滤和确认越多，就会自动创造越多优势。',
      },
    });
  }

  function buildTradeManagementQuestionBank() {
    const scenarios = [
      { id: 'tm-1', difficulty: 'foundation', conceptTag: 'process-vs-entry', situation: { en: 'The entry was good, but the trader ignored their management plan after entry.', zh: '进场本来不错，但交易者开仓后无视了自己的管理计划。' }, bestRead: { en: 'Good entry cannot rescue poor management discipline.', zh: '好的进场，救不了糟糕的管理纪律。' }, driver: { en: 'Trade quality continues after entry; it does not stop at fill price.', zh: '交易质量在进场后还会继续变化，不会在成交那一刻结束。' }, trap: { en: 'Treating entry accuracy as the whole trade.', zh: '把进场精度当成整笔交易的全部。' }, confirmation: { en: 'Check whether management decisions remained aligned with the original plan.', zh: '看管理动作是否仍和原计划对齐。' } },
      { id: 'tm-2', difficulty: 'foundation', conceptTag: 'emotional-stop-move', situation: { en: 'The trader moves stop to breakeven too early because the candles look scary.', zh: '交易者因为蜡烛看起来有点可怕，就太早把止损拉到保本。' }, bestRead: { en: 'This is emotional management unless the structure has earned the adjustment.', zh: '除非结构真的支持，否则这就是情绪化管理。' }, driver: { en: 'Stop movement should be justified by structure, not discomfort.', zh: '止损移动应该由结构来证明，而不是由不舒服来驱动。' }, trap: { en: 'Believing breakeven is automatically professional no matter when it happens.', zh: '以为不管什么时候拉保本，都自动等于专业。' }, confirmation: { en: 'Check whether the trade truly progressed enough to justify tighter protection.', zh: '看这笔交易是否真的进展到值得更紧保护。' } },
      { id: 'tm-3', difficulty: 'foundation', conceptTag: 'scale-out', situation: { en: 'The trader planned to reduce size at a known reaction level before the trade started.', zh: '交易者在开仓前，就计划好要在已知反应位减仓。' }, bestRead: { en: 'That is disciplined management because the action was pre-planned and structure-based.', zh: '这属于有纪律管理，因为动作是预先规划且基于结构的。' }, driver: { en: 'Scaling works best when linked to predefined structure, not live panic.', zh: '分批止盈最有效的时候，是绑在预先定义的结构上，而不是盘中恐慌。' }, trap: { en: 'Calling all partial profit-taking emotional by default.', zh: '默认把所有分批止盈都当成情绪化。' }, confirmation: { en: 'Check whether the scale-out level still matches a logical reaction point.', zh: '看减仓位是否仍对应合理反应点。' } },
      { id: 'tm-4', difficulty: 'foundation', conceptTag: 'hold-through-news', situation: { en: 'The trade was fine, but the trader held through high-impact news without any plan adjustment.', zh: '这笔交易本来还可以，但交易者在没有任何计划调整下带仓穿高影响新闻。' }, bestRead: { en: 'That is a process error because event risk changed the trade profile.', zh: '这属于流程错误，因为事件风险已经改变了这笔单的性质。' }, driver: { en: 'Management includes adapting to changing event conditions.', zh: '管理本来就包括适配事件条件变化。' }, trap: { en: 'Treating hold-through-news as passive continuation of the old trade.', zh: '把带仓穿新闻当成原交易的被动延续。' }, confirmation: { en: 'Check whether event exposure was intentionally managed or simply ignored.', zh: '看事件敞口是被有意管理，还是被直接忽略。' } },
      { id: 'tm-5', difficulty: 'foundation', conceptTag: 'review-depth', situation: { en: 'The review notes only say “won” or “lost” with no process detail.', zh: '复盘记录只写“赢了”或“亏了”，没有任何流程细节。' }, bestRead: { en: 'This review is too shallow to improve process meaningfully.', zh: '这种复盘太浅，不足以真正改善流程。' }, driver: { en: 'Process improvement requires more than outcome labels.', zh: '流程改进，需要的不只是结果标签。' }, trap: { en: 'Treating PnL outcome as enough review information by itself.', zh: '把盈亏结果本身当成足够复盘信息。' }, confirmation: { en: 'Check whether the review captures thesis, execution, and management quality.', zh: '看复盘是否记录了 thesis、执行和管理质量。' } },
      { id: 'tm-6', difficulty: 'foundation', conceptTag: 'good-loss', situation: { en: 'A trade lost, but the read was sound and the stop respected the plan perfectly.', zh: '这笔交易亏了，但读法是合理的，止损也完全照计划执行。' }, bestRead: { en: 'This can still be a good trade even though it lost money.', zh: '尽管亏钱，这依然可能是一笔好交易。' }, driver: { en: 'Trade quality and trade outcome are related but not identical.', zh: '交易质量和交易结果有关，但不是同一回事。' }, trap: { en: 'Calling every losing trade a bad trade automatically.', zh: '只要亏钱，就自动把它叫成坏交易。' }, confirmation: { en: 'Check whether the process and risk discipline were actually correct.', zh: '看流程和风险纪律是否真的做对了。' } },
      { id: 'tm-7', difficulty: 'foundation', conceptTag: 'bad-win', situation: { en: 'A trader broke rules, widened risk, and still happened to make money.', zh: '交易者破坏规则、放大风险，但最后刚好还是赚了钱。' }, bestRead: { en: 'This can still be a bad trade because the process was poor.', zh: '这仍然可能是一笔坏交易，因为流程很差。' }, driver: { en: 'A lucky outcome does not validate a weak process.', zh: '侥幸结果，不会替差流程背书。' }, trap: { en: 'Treating profit alone as proof the management was good.', zh: '把盈利本身当成管理优秀的证明。' }, confirmation: { en: 'Check whether you would want the exact same process repeated many times.', zh: '看你是否愿意让同样流程被重复很多次。' } },
      { id: 'tm-8', difficulty: 'foundation', conceptTag: 'runner-logic', situation: { en: 'The trader keeps a small runner only after first target was reached and structure stayed strong.', zh: '交易者是在第一目标到达、且结构仍强时，才保留小 runner。' }, bestRead: { en: 'That can be disciplined if it was part of the plan and still fits structure.', zh: '如果本来就在计划里，而且结构也支持，这就可能很有纪律。' }, driver: { en: 'Leaving a runner is strongest when it follows both plan and structure.', zh: '保留 runner 最合理的时候，是计划和结构都支持。' }, trap: { en: 'Leaving a runner just because greed took over after a fast move.', zh: '只因为涨得快、贪心上来了，就硬留 runner。' }, confirmation: { en: 'Check whether the runner still has valid structural room to travel.', zh: '看这个 runner 是否仍有结构上合理的空间。' } },
      { id: 'tm-9', difficulty: 'foundation', conceptTag: 'review-honesty', situation: { en: 'The trader edits journal notes after the fact to make the original plan look smarter.', zh: '交易者事后改 journal，让原计划看起来更聪明。' }, bestRead: { en: 'This destroys review value because the process record is no longer honest.', zh: '这会毁掉复盘价值，因为流程记录已经不诚实。' }, driver: { en: 'Review only works when the record reflects what was actually known and done live.', zh: '复盘只有在记录忠实反映实时已知信息和实际动作时才有用。' }, trap: { en: 'Beautifying the journal to protect ego.', zh: '为了保护 ego 而美化记录。' }, confirmation: { en: 'Check whether the journal captures what you truly knew at the time.', zh: '看 journal 是否记录了你当时真实知道的东西。' } },
      { id: 'tm-10', difficulty: 'foundation', conceptTag: 'bridge-summary', situation: { en: 'A trader says, “My edge comes from entries, so management is secondary.”', zh: '有交易者说：“我的 edge 来自进场，所以管理只是次要。”' }, bestRead: { en: 'That is incomplete because management and review are major sources of long-run edge.', zh: '这说法不完整，因为管理和复盘本身就是长期优势的重要来源。' }, driver: { en: 'Entries start the trade, but management shapes expectancy and review shapes improvement.', zh: '进场开启交易，但管理塑造期望值，复盘塑造进步。' }, trap: { en: 'Treating post-entry decisions as low-importance details.', zh: '把进场后的决策当成低重要度细节。' }, confirmation: { en: 'Check whether your biggest repeated losses come from entries or from post-entry process failure.', zh: '看你重复出现的大亏，究竟更多来自进场，还是来自进场后的流程失败。' } },
      { id: 'tm-11', difficulty: 'bridge', conceptTag: 'plan-deviation', situation: { en: 'The trade was planned as a scalp, but once in profit the trader emotionally converts it into a swing hold.', zh: '这笔单原本计划是短打，但一旦浮盈，交易者情绪化地把它改成波段持有。' }, bestRead: { en: 'This is a process drift unless a new plan is created honestly from fresh structure.', zh: '除非基于新结构诚实写出新计划，否则这就是流程漂移。' }, driver: { en: 'Changing timeframe and holding style mid-trade needs more than emotion.', zh: '盘中改变持有周期和风格，不能只靠情绪。' }, trap: { en: 'Calling every emotional plan change “letting profits run.”', zh: '把每一次情绪化改计划都叫成“让利润奔跑”。' }, confirmation: { en: 'Check whether the hold decision is supported by new structure, not only new hope.', zh: '看继续持有是否由新结构支持，而不是只由新希望支持。' } },
      { id: 'tm-12', difficulty: 'bridge', conceptTag: 'stop-widening', situation: { en: 'Price approaches stop, and the trader moves it wider without any new structural reason.', zh: '价格快碰止损时，交易者在没有任何新结构理由下把止损放得更宽。' }, bestRead: { en: 'This is emotional risk expansion, not disciplined management.', zh: '这叫情绪化扩大风险，不叫有纪律管理。' }, driver: { en: 'A stop widened without structural justification usually means the plan is being abandoned.', zh: '没有结构理由的放宽止损，通常代表计划正在被抛弃。' }, trap: { en: 'Calling it flexibility when it is really fear of taking the loss.', zh: '把它叫“灵活”，其实只是害怕认亏。' }, confirmation: { en: 'Check whether the original invalidation point actually changed.', zh: '看原本失效点是否真的发生变化。' } },
      { id: 'tm-13', difficulty: 'bridge', conceptTag: 'review-cluster', situation: { en: 'Three recent losses all came from the same mistake: entering before confirmation to avoid missing out.', zh: '最近三笔亏损都来自同一个错误：怕错过，所以在确认前抢先进去。' }, bestRead: { en: 'This is exactly the kind of repeatable process leak a good review should identify.', zh: '这正是好复盘应该识别出的那种可重复流程漏洞。' }, driver: { en: 'Review becomes valuable when it finds patterns, not isolated excuses.', zh: '复盘变得有价值，是在于它能发现模式，而不是替每笔单找借口。' }, trap: { en: 'Reviewing each loss as if it were completely unrelated.', zh: '把每一笔亏损都当成完全无关的个案。' }, confirmation: { en: 'Check whether the same emotional trigger keeps appearing across trades.', zh: '看同样的情绪触发是否在多笔交易中反复出现。' } },
      { id: 'tm-14', difficulty: 'bridge', conceptTag: 'management-consistency', situation: { en: 'The trader manages winners one way when calm and a different way when stressed.', zh: '交易者冷静时用一种方式管盈利单，紧张时又换成另一种。' }, bestRead: { en: 'This inconsistency makes performance harder to improve because the process keeps changing.', zh: '这种不一致会让表现更难改进，因为流程一直在变。' }, driver: { en: 'Review needs repeatable behaviour to produce useful feedback loops.', zh: '想让复盘产生有用反馈回路，前提是行为本身得可重复。' }, trap: { en: 'Calling this “adapting” when it is just mood-driven variation.', zh: '把这种情况叫成“适配”，其实只是情绪驱动的变化。' }, confirmation: { en: 'Check whether management differences are coming from structure or from stress.', zh: '看管理差异到底来自结构变化，还是来自压力变化。' } },
      { id: 'tm-15', difficulty: 'bridge', conceptTag: 'exit-quality', situation: { en: 'The original exit level is reached, but the trader refuses to take it because greed now wants more.', zh: '原本目标位已经到了，但交易者因为贪心想要更多，所以拒绝执行。' }, bestRead: { en: 'This is process failure because the market hit the level the plan was built around.', zh: '这属于流程失败，因为市场已经来到计划本来围绕的那个水平。' }, driver: { en: 'A plan loses power if it is abandoned exactly when it is supposed to act.', zh: '如果计划在最该执行的时刻被丢掉，它就失去价值。' }, trap: { en: 'Assuming greed after success is harmless because the trade is already in profit.', zh: '以为已经浮盈后再贪一点，不会有害。' }, confirmation: { en: 'Check whether any new structural evidence justifies changing the target.', zh: '看有没有任何新的结构证据，足以合理化改目标。' } },
      { id: 'tm-16', difficulty: 'bridge', conceptTag: 'review-metric', situation: { en: 'The journal tracks setup type, session, execution grade, management deviation, and whether news risk was respected.', zh: 'journal 会记录 setup 类型、session、执行评分、管理偏差，以及是否尊重了消息风险。' }, bestRead: { en: 'This is useful review structure because it tracks behaviour, not only outcome.', zh: '这是一种有用复盘结构，因为它在追踪行为，而不只是追踪结果。' }, driver: { en: 'Good review metrics should reveal process patterns that PnL alone hides.', zh: '好的复盘指标，应该揭示那些 PnL 本身看不到的流程模式。' }, trap: { en: 'Thinking such detail is unnecessary as long as win rate is visible.', zh: '只要看得到胜率，就觉得这些细节都不重要。' }, confirmation: { en: 'Check whether your review fields can explain repeated mistakes clearly.', zh: '看这些复盘字段是否能清楚解释重复错误。' } },
      { id: 'tm-17', difficulty: 'bridge', conceptTag: 'runner-abuse', situation: { en: 'The trader calls every leftover piece a runner even when no structural room remains.', zh: '交易者把每一小部分剩仓都叫 runner，哪怕结构上已经没空间了。' }, bestRead: { en: 'That is runner abuse, not disciplined trade management.', zh: '这叫滥用 runner，不叫有纪律管理。' }, driver: { en: 'A runner should still have logical space and structural reason to exist.', zh: 'runner 本身也需要逻辑空间和结构理由。' }, trap: { en: 'Treating “runner” as a flattering name for random greed.', zh: '把 runner 当成随机贪心的好听说法。' }, confirmation: { en: 'Check whether the leftover position still has a valid thesis beyond hope.', zh: '看剩下仓位除了希望之外，是否还有有效 thesis。' } },
      { id: 'tm-18', difficulty: 'bridge', conceptTag: 'daily-process', situation: { en: 'The trader has a bad day, but the review still finds that losses came from rule-following setups in a hostile regime.', zh: '交易者有一个糟糕日子，但复盘发现亏损其实来自守规则的 setup，只是碰上敌对状态。' }, bestRead: { en: 'That day may still contain useful execution discipline even though the result hurt.', zh: '这一天虽然结果难受，但流程纪律可能依然有价值。' }, driver: { en: 'A harsh day can still be process-positive if rules were followed honestly.', zh: '即使是很惨的一天，只要规则被诚实执行，流程上仍可能是正面的。' }, trap: { en: 'Throwing away a sound process because one bad day felt painful.', zh: '只因为一天很痛，就把本来合理的流程全部丢掉。' }, confirmation: { en: 'Check whether the problem was execution error or simply adverse environment variance.', zh: '看问题来自执行错误，还是只是环境不利的波动。' } },
      { id: 'tm-19', difficulty: 'bridge', conceptTag: 'bridge-summary', situation: { en: 'A trader asks, “What is the real purpose of review?”', zh: '有交易者问：“复盘真正的目的到底是什么？”' }, bestRead: { en: 'To improve process quality by finding repeatable strengths and repeatable leaks.', zh: '是为了通过找出可重复优势和可重复漏洞，来提升流程质量。' }, driver: { en: 'Review is a process-improvement tool, not a scoreboard ritual.', zh: '复盘是流程改进工具，不是记分板仪式。' }, trap: { en: 'Using review only to relive emotions from the trade.', zh: '把复盘只拿来重新体验那笔单的情绪。' }, confirmation: { en: 'Check whether your review leads to process changes, not only opinions.', zh: '看你的复盘是否会带来流程改变，而不只是带来观点。' } },
      { id: 'tm-20', difficulty: 'bridge', conceptTag: 'compound-edge', situation: { en: 'Over months, the trader improves stop discipline, exit consistency, and journal honesty more than entry accuracy.', zh: '几个月下来，交易者提升的是止损纪律、出场一致性和 journal 诚实度，而不是只提升进场精度。' }, bestRead: { en: 'That is exactly how process quality compounds edge over time.', zh: '这正是流程质量如何在长期里复利放大优势。' }, driver: { en: 'Big improvements often come from better repeatability, not from one magical entry trick.', zh: '真正的大提升，往往来自更好的可重复性，而不是某个神奇进场技巧。' }, trap: { en: 'Believing edge compounds only through signal discovery.', zh: '以为优势只能靠找到新信号来复利。' }, confirmation: { en: 'Check whether process metrics are improving alongside or even ahead of PnL.', zh: '看流程指标是否和 PnL 一起改善，甚至比 PnL 更早改善。' } },
    ];

    return buildScenarioQuestionBank('trade-management', scenarios, {
      accurateStatement: {
        en: 'Trade management and review create long-run edge by improving repeatability, discipline, and honest process learning.',
        zh: '持仓管理和复盘，会通过提升可重复性、纪律和诚实学习，来创造长期优势。',
      },
      falseStatement: {
        en: 'Once entry is good, management and review matter only a little.',
        zh: '只要进场够好，管理和复盘就不太重要了。',
      },
    });
  }

  function buildScenarioQuestionBank(prefix, scenarios, ruleCopy) {
    const stems = [
      {
        difficulty: 'read',
        conceptTag: 'best-read',
        prompt: {
          en: (scenario) => `${scenario.situation.en} What is the best first read?`,
          zh: (scenario) => `${scenario.situation.zh} 最合理的第一判断是什么？`,
        },
        correct: (scenario) => scenario.bestRead,
        distractors: (scenario) => [
          { en: 'Take the most aggressive entry immediately and ignore structure.', zh: '立刻用最激进方式进场，完全忽略结构。' },
          { en: scenario.trap.en, zh: scenario.trap.zh },
          { en: 'Treat the move as guaranteed instead of probabilistic.', zh: '把这段走势当成必然结果，而不是概率问题。' },
        ],
        explanation: (scenario) => ({
          en: `${scenario.driver.en} ${ruleCopy.accurateStatement.en}`,
          zh: `${scenario.driver.zh}${ruleCopy.accurateStatement.zh}`,
        }),
      },
      {
        difficulty: 'driver',
        conceptTag: 'key-driver',
        prompt: {
          en: (scenario) => `${scenario.situation.en} Which detail matters most here?`,
          zh: (scenario) => `${scenario.situation.zh} 这里最关键的细节是什么？`,
        },
        correct: (scenario) => scenario.driver,
        distractors: () => [
          { en: 'The fact that price moved fast automatically makes the setup valid.', zh: '只要价格动得快，setup 就自动有效。' },
          { en: 'One emotional candle matters more than the surrounding sequence.', zh: '一根情绪化K线比周边顺序更重要。' },
          { en: ruleCopy.falseStatement.en, zh: ruleCopy.falseStatement.zh },
        ],
        explanation: (scenario) => ({
          en: `${scenario.driver.en} That is the context clue a serious reader should prioritise.`,
          zh: `${scenario.driver.zh} 这才是更认真读图的人该优先看的背景线索。`,
        }),
      },
      {
        difficulty: 'trap',
        conceptTag: 'beginner-trap',
        prompt: {
          en: (scenario) => `${scenario.situation.en} Which response is the beginner trap?`,
          zh: (scenario) => `${scenario.situation.zh} 哪一种反应是新手常见陷阱？`,
        },
        correct: (scenario) => scenario.trap,
        distractors: (scenario) => [
          { en: scenario.bestRead.en, zh: scenario.bestRead.zh },
          { en: scenario.confirmation.en, zh: scenario.confirmation.zh },
          { en: 'Lower conviction until the evidence becomes cleaner.', zh: '在证据更干净前，先降低信心。' },
        ],
        explanation: (scenario) => ({
          en: `The trap is ${scenario.trap.en.toLowerCase()}. Better process means protecting yourself from impulsive misreads.`,
          zh: `陷阱在于${scenario.trap.zh}。更好的流程，是保护自己别被冲动误判带走。`,
        }),
      },
      {
        difficulty: 'confirmation',
        conceptTag: 'next-check',
        prompt: {
          en: (scenario) => `${scenario.situation.en} Before you execute, what should you confirm next?`,
          zh: (scenario) => `${scenario.situation.zh} 在执行前，你下一步最该确认什么？`,
        },
        correct: (scenario) => scenario.confirmation,
        distractors: () => [
          { en: 'Nothing else matters now once the first read sounds plausible.', zh: '只要第一判断听起来合理，其他都不重要了。' },
          { en: 'Add more indicators until one of them gives certainty.', zh: '多加几个指标，直到有一个能给你确定感。' },
          { en: 'Double your size so the good idea pays off faster.', zh: '仓位直接加倍，让好想法更快变现。' },
        ],
        explanation: (scenario) => ({
          en: `${scenario.confirmation.en} Good analysis becomes useful only when it translates into a disciplined next check.`,
          zh: `${scenario.confirmation.zh} 好的分析，只有在能转成有纪律的下一步检查时，才真正有用。`,
        }),
      },
      {
        difficulty: 'mindset',
        conceptTag: 'professional-mindset',
        prompt: {
          en: (scenario) => `${scenario.situation.en} Which statement best fits a professional mindset?`,
          zh: (scenario) => `${scenario.situation.zh} 哪一句最符合更专业的思维方式？`,
        },
        correct: () => ruleCopy.accurateStatement,
        distractors: (scenario) => [
          { en: scenario.trap.en, zh: scenario.trap.zh },
          { en: ruleCopy.falseStatement.en, zh: ruleCopy.falseStatement.zh },
          { en: 'If one clue looks strong, you no longer need risk control.', zh: '只要有一个线索看起来强，就不需要风控。' },
        ],
        explanation: () => ({
          en: ruleCopy.accurateStatement.en,
          zh: ruleCopy.accurateStatement.zh,
        }),
      },
    ];

    const questions = [];
    scenarios.forEach((scenario, scenarioIndex) => {
      stems.forEach((stem, stemIndex) => {
        questions.push(createScenarioQuestion(prefix, scenario, scenarioIndex, stem, stemIndex));
      });
    });
    return questions.slice(0, 100);
  }

  function createScenarioQuestion(prefix, scenario, scenarioIndex, stem, stemIndex) {
    const correct = stem.correct(scenario);
    const distractors = stem.distractors(scenario);
    const slot = (scenarioIndex + stemIndex) % 4;
    const options = distractors.slice(0, 3);
    options.splice(slot, 0, correct);
    const choiceKeys = ['a', 'b', 'c', 'd'];
    const correctChoiceKey = choiceKeys[slot];

    return {
      id: `${prefix}-${scenario.id}-${stemIndex + 1}`,
      difficulty: scenario.difficulty,
      conceptTag: `${scenario.conceptTag}-${stem.conceptTag}`,
      prompt: {
        en: stem.prompt.en(scenario),
        zh: stem.prompt.zh(scenario),
      },
      choices: {
        en: options.map((option, index) => ({ key: choiceKeys[index], text: option.en })),
        zh: options.map((option, index) => ({ key: choiceKeys[index], text: option.zh })),
      },
      correctChoiceKey,
      explanation: stem.explanation(scenario),
    };
  }

  function loadState() {
    const fallback = {
      view: 'overview',
      activeLessonId: LESSON_CHAIN[0],
      stepIndex: 0,
      completedLessonIds: [],
      bestScores: {},
      soundEnabled: true,
      musicEnabled: true,
      activeExam: null,
      lastResult: null,
      drillAnswers: {},
      lastVisitedAt: Date.now(),
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return fallback;
      return {
        ...fallback,
        ...parsed,
        soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
        musicEnabled: typeof parsed.musicEnabled === 'boolean' ? parsed.musicEnabled : true,
        completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds.filter((id) => lessonMap.has(id)) : [],
        bestScores: parsed.bestScores && typeof parsed.bestScores === 'object' ? parsed.bestScores : {},
        drillAnswers: parsed.drillAnswers && typeof parsed.drillAnswers === 'object' ? parsed.drillAnswers : {},
      };
    } catch {
      return fallback;
    }
  }

  function saveState() {
    rootState.lastVisitedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rootState));
  }

  function scheduleActionBarMeasure() {
    if (actionBarMeasureFrame) {
      cancelAnimationFrame(actionBarMeasureFrame);
    }
    actionBarMeasureFrame = requestAnimationFrame(() => {
      actionBarMeasureFrame = 0;
      measureActionBarLayout();
    });
  }

  function measureActionBarLayout() {
    if (!rootEl) return;
    const shell = rootEl.querySelector('.learn-player-shell, .learn-quiz-shell');
    const scope = shell || rootEl.querySelector('.learn-platform') || rootEl;
    const rect = scope.getBoundingClientRect();
    rootEl.style.setProperty('--learn-action-bar-left', `${Math.max(12, rect.left)}px`);
    rootEl.style.setProperty('--learn-action-bar-width', `${Math.max(280, rect.width)}px`);
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function scrollLearnViewportToTop() {
    const page = document.getElementById('page-learn');
    if (!page) return;
    page.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  function renderAndResetLearnViewport() {
    render();
    requestAnimationFrame(() => {
      scrollLearnViewportToTop();
    });
  }

  function getLanguage() {
    return localStorage.getItem(LANG_KEY) === 'zh-CN' ? 'zh' : 'en';
  }

  function text(copy, lang = getLanguage()) {
    if (copy == null) return '';
    if (typeof copy === 'string') return copy;
    return copy[lang] || copy.en || '';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isLessonAvailable(lesson) {
    return Boolean(lesson && lesson.available);
  }

  function getActiveLesson() {
    const lesson = lessonMap.get(rootState.activeLessonId);
    if (lesson && (lesson.available || lesson.id === LESSON_CHAIN[0])) return lesson;
    return lessonMap.get(LESSON_CHAIN[0]);
  }

  function getAccessibleLessonIds() {
    return roadmapLessons.filter((lesson) => lesson.available && isLessonAvailable(lesson)).map((lesson) => lesson.id);
  }

  function startLesson(lessonId) {
    const lesson = lessonMap.get(lessonId);
    if (!lesson || !lesson.available || !isLessonAvailable(lesson)) return;
    rootState.activeLessonId = lessonId;
    rootState.view = 'lesson';
    rootState.stepIndex = 0;
    rootState.activeExam = null;
    rootState.lastResult = null;
    saveState();
    playSound('lesson-open');
    renderAndResetLearnViewport();
  }

  function moveStep(delta) {
    const lesson = getActiveLesson();
    if (!lesson || !lesson.steps.length) return;
    const nextIndex = rootState.stepIndex + delta;
    if (delta > 0) {
      const step = lesson.steps[rootState.stepIndex];
      if (step && step.type === 'drill') {
        const drillKey = getDrillStorageKey(lesson.id, rootState.stepIndex);
        const chosenKey = rootState.drillAnswers[drillKey];
        const selectedOption = step.options.find((option) => option.key === chosenKey);
        if (!selectedOption || !selectedOption.correct) {
          return;
        }
      }
      if (nextIndex >= lesson.steps.length) {
        beginExam(lesson.id);
        return;
      }
    }
    rootState.stepIndex = Math.max(0, Math.min(nextIndex, lesson.steps.length - 1));
    saveState();
    playSound('step-next');
    renderAndResetLearnViewport();
  }

  function beginExam(lessonId) {
    const lesson = lessonMap.get(lessonId);
    if (!lesson || !lesson.available || lesson.questionBank.length < EXAM_SIZE) return;
    const selectedIds = shuffled(lesson.questionBank.map((question) => question.id)).slice(0, EXAM_SIZE);
    rootState.activeLessonId = lessonId;
    rootState.view = 'quiz';
    rootState.activeExam = {
      lessonId,
      questionIds: selectedIds,
      currentIndex: 0,
      answers: {},
      createdAt: Date.now(),
    };
    rootState.lastResult = null;
    saveState();
    playSound('step-next');
    renderAndResetLearnViewport();
  }

  function selectDrillAnswer(stepIndex, key) {
    const lesson = getActiveLesson();
    if (!lesson) return;
    const step = lesson.steps[stepIndex];
    if (!step || step.type !== 'drill') return;
    const drillKey = getDrillStorageKey(lesson.id, stepIndex);
    rootState.drillAnswers[drillKey] = key;
    saveState();
    const option = step.options.find((item) => item.key === key);
    playSound(option && option.correct ? 'quiz-correct' : 'quiz-wrong');
    render();
  }

  function answerQuizQuestion(choiceKey) {
    const exam = rootState.activeExam;
    if (!exam) return;
    const question = getCurrentExamQuestion();
    if (!question) return;
    if (exam.answers[question.id]) return;
    const isCorrect = choiceKey === question.correctChoiceKey;
    exam.answers[question.id] = {
      selectedKey: choiceKey,
      isCorrect,
      answeredAt: Date.now(),
    };
    saveState();
    playSound(isCorrect ? 'quiz-correct' : 'quiz-wrong');
    render();
  }

  function nextQuizStep() {
    const exam = rootState.activeExam;
    if (!exam) return;
    const question = getCurrentExamQuestion();
    if (!question || !exam.answers[question.id]) return;
    if (exam.currentIndex >= exam.questionIds.length - 1) {
      finishExam();
      return;
    }
    exam.currentIndex += 1;
    saveState();
    playSound('step-next');
    renderAndResetLearnViewport();
  }

  function finishExam() {
    const exam = rootState.activeExam;
    if (!exam) return;
    const lesson = lessonMap.get(exam.lessonId);
    if (!lesson) return;
    const questions = exam.questionIds.map((id) => lesson.questionBank.find((question) => question.id === id)).filter(Boolean);
    const correct = questions.filter((question) => exam.answers[question.id]?.isCorrect).length;
    const passed = correct === PERFECT_SCORE;
    const incorrect = questions
      .filter((question) => !exam.answers[question.id]?.isCorrect)
      .map((question) => ({
        id: question.id,
        prompt: question.prompt,
        explanation: question.explanation,
        selectedKey: exam.answers[question.id]?.selectedKey || null,
        correctChoiceKey: question.correctChoiceKey,
        choices: question.choices,
      }));

    rootState.bestScores[lesson.id] = Math.max(Number(rootState.bestScores[lesson.id]) || 0, correct);
    if (passed && !rootState.completedLessonIds.includes(lesson.id)) {
      rootState.completedLessonIds.push(lesson.id);
      playSound('lesson-pass');
      if (lesson.id === 'xauusd-actually-moves' || lesson.id === 'trend-vs-range-decision-making') {
        playSound('lesson-unlock');
      }
    } else {
      playSound('lesson-fail');
    }

    rootState.lastResult = {
      lessonId: lesson.id,
      correct,
      total: EXAM_SIZE,
      passed,
      incorrect,
      finishedAt: Date.now(),
    };
    rootState.activeExam = null;
    rootState.view = 'results';
    saveState();
    renderAndResetLearnViewport();
  }

  function retryExam() {
    const result = rootState.lastResult;
    if (!result) return;
    beginExam(result.lessonId);
  }

  function backToOverview() {
    rootState.view = 'overview';
    rootState.activeExam = null;
    saveState();
    renderAndResetLearnViewport();
  }

  function resumeCurrentFlow() {
    const lesson = getActiveLesson();
    if (!lesson) return;
    if (rootState.activeExam && rootState.activeExam.lessonId === lesson.id) {
      rootState.view = 'quiz';
    } else if (rootState.lastResult && rootState.lastResult.lessonId === lesson.id && rootState.view === 'results') {
      rootState.view = 'results';
    } else {
      rootState.view = 'lesson';
    }
    saveState();
    renderAndResetLearnViewport();
  }

  function getCurrentExamQuestion() {
    const exam = rootState.activeExam;
    if (!exam) return null;
    const lesson = lessonMap.get(exam.lessonId);
    if (!lesson) return null;
    const questionId = exam.questionIds[exam.currentIndex];
    return lesson.questionBank.find((question) => question.id === questionId) || null;
  }

  function getDrillStorageKey(lessonId, stepIndex) {
    return `${lessonId}:${stepIndex}`;
  }

  function shuffled(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function render() {
    rootEl = document.getElementById('learn-root');
    if (!rootEl) return;

    const lesson = getActiveLesson();
    const view = rootState.view;
    const lang = getLanguage();

    rootEl.innerHTML = `
      <div class="learn-platform learn-platform--${escapeHtml(view)}" data-learn-view="${escapeHtml(view)}">
        ${renderAmbientShell()}
        ${view === 'overview' ? renderOverview(lang, lesson) : ''}
        ${view === 'lesson' ? renderLessonPlayer(lang, lesson) : ''}
        ${view === 'quiz' ? renderQuiz(lang, lesson) : ''}
        ${view === 'results' ? renderResults(lang, lesson) : ''}
      </div>
    `;
    scheduleActionBarMeasure();
    syncLessonAudio();
  }

  function renderAmbientShell() {
    return `
      <div class="learn-platform__ambient">
        <span class="learn-platform__glow learn-platform__glow--a"></span>
        <span class="learn-platform__glow learn-platform__glow--b"></span>
        <span class="learn-platform__grid"></span>
      </div>
    `;
  }

  function renderOverview(lang, activeLesson) {
    const completedCount = rootState.completedLessonIds.length;
    const availableCount = roadmapLessons.filter((lesson) => lesson.available).length;
    const progressPct = Math.round((completedCount / Math.max(availableCount, 1)) * 100);
    const accessibleIds = getAccessibleLessonIds();
    const resumeLesson = rootState.lastResult && !rootState.lastResult.passed
      ? lessonMap.get(rootState.lastResult.lessonId)
      : lessonMap.get(accessibleIds[accessibleIds.length - 1] || LESSON_CHAIN[0]) || activeLesson;
    const featuredLessonId = resumeLesson?.id || LESSON_CHAIN[0];

    const foundationLessons = roadmapLessons.filter((lesson) => lesson.stage === 'foundation');
    const proLessons = roadmapLessons.filter((lesson) => lesson.stage === 'pro');
    const liveLessons = roadmapLessons.filter((lesson) => lesson.available);
    const liveFocusItems = liveLessons.slice(0, 6);
    const foundationLiveCount = foundationLessons.filter((lesson) => lesson.available).length;
    const proLiveCount = proLessons.filter((lesson) => lesson.available).length;

    return `
      <section class="learn-overview-shell">
        <header class="learn-overview-hero learn-animate learn-animate--rise">
          <div class="learn-overview-hero__copy">
            <span class="learn-overview-hero__eyebrow">${lang === 'zh' ? 'XAU Radar 学习平台' : 'XAU Radar Learning Platform'}</span>
            <h1>${lang === 'zh' ? '像专业学习平台一样，一课一课把技术分析学扎实' : 'A premium in-app course flow for mastering technical analysis step by step'}</h1>
            <p>${lang === 'zh'
              ? '这不是随便看完就算完成的 Learn tab。每一课都有分页式教学、动态 XAUUSD 图例、100 题题库，以及严格的 20/20 精通测试。'
              : 'Each lesson has page-by-page teaching, dynamic XAUUSD charts, a 100-question bank, and a strict 20/20 mastery exam.'}</p>
            <div class="learn-overview-hero__actions">
              <button type="button" class="learn-btn learn-btn--primary" data-action="resume-learn">${lang === 'zh' ? '继续课程' : 'Continue course'}</button>
              <button type="button" class="learn-btn learn-btn--ghost" data-action="toggle-sound">${rootState.soundEnabled ? (lang === 'zh' ? '关闭音效' : 'Sound on') : (lang === 'zh' ? '开启音效' : 'Sound off')}</button>
            </div>
            <div class="learn-overview-metrics">
              <div class="learn-metric-card">
                <span>${lang === 'zh' ? '已完成课程' : 'Completed lessons'}</span>
                <strong>${completedCount}/${availableCount}</strong>
              </div>
              <div class="learn-metric-card">
                <span>${lang === 'zh' ? '当前精通进度' : 'Mastery progress'}</span>
                <strong>${progressPct}%</strong>
              </div>
              <div class="learn-metric-card">
                <span>${lang === 'zh' ? '严格完成规则' : 'Completion rule'}</span>
                <strong>20/20</strong>
              </div>
            </div>
          </div>
          <aside class="learn-overview-focus learn-animate learn-animate--pulse">
            <div class="learn-focus-card">
              <span class="learn-focus-card__eyebrow">${lang === 'zh' ? '当前课程阵列' : 'Current curriculum'}</span>
              <h2>${lang === 'zh' ? `${availableCount} 节 live lessons` : `${availableCount} live lessons`}</h2>
              <p>${lang === 'zh'
                ? `Foundation 已上线 ${foundationLiveCount} 节，Advanced 已上线 ${proLiveCount} 节。现在整套 Learn flow 已经能从课程、图表、题库一路走到 mastery exam。`
                : `The foundation track now has ${foundationLiveCount} live lessons and the advanced track has ${proLiveCount}. The full Learn flow is now connected from lesson pages to charts, question banks, and mastery exams.`}</p>
              <ul class="learn-focus-list">
                ${liveFocusItems.map((lesson) => `<li>${escapeHtml(text(lesson.title, lang))}</li>`).join('')}
              </ul>
            </div>
          </aside>
        </header>

        <section class="learn-resume-banner learn-animate learn-animate--reveal">
          <div>
            <span class="learn-section-label">${lang === 'zh' ? '继续点' : 'Resume point'}</span>
            <h2>${escapeHtml(text(resumeLesson.title, lang))}</h2>
            <p>${escapeHtml(text(resumeLesson.summary, lang))}</p>
          </div>
          <button type="button" class="learn-btn learn-btn--primary" data-action="start-lesson" data-lesson-id="${escapeHtml(resumeLesson.id)}">${lang === 'zh' ? '开始这一课' : 'Start this lesson'}</button>
        </section>

        <section class="learn-stage-section">
          ${renderStageBlock(lang, 'foundation', foundationLessons, featuredLessonId)}
          ${renderStageBlock(lang, 'pro', proLessons, featuredLessonId)}
        </section>
      </section>
    `;
  }

  function renderStageBlock(lang, stageId, lessons, featuredLessonId) {
    const meta = STAGE_META[stageId];
    const availableCount = lessons.filter((lesson) => lesson.available).length;
    return `
      <div class="learn-stage-card learn-animate learn-animate--rise">
        <div class="learn-stage-card__head">
          <div>
            <span class="learn-section-label">${escapeHtml(text(meta.eyebrow, lang))}</span>
            <h2>${escapeHtml(text(meta.title, lang))}</h2>
            <p>${escapeHtml(text(meta.label, lang))}</p>
          </div>
          <div class="learn-stage-pill">${availableCount === lessons.length
            ? `${lessons.length} ${lang === 'zh' ? '课已上线' : 'lessons live'}`
            : `${availableCount}/${lessons.length} ${lang === 'zh' ? '课已上线' : 'live'}`}</div>
        </div>
        <div class="learn-lesson-grid">
          ${lessons.map((lesson, index) => renderLessonCard(lang, lesson, index, featuredLessonId)).join('')}
        </div>
      </div>
    `;
  }

  function renderLessonCard(lang, lesson, index, featuredLessonId) {
    const availableNow = isLessonAvailable(lesson);
    const completed = rootState.completedLessonIds.includes(lesson.id);
    const bestScore = Number(rootState.bestScores[lesson.id]) || 0;
    const featured = lesson.id === featuredLessonId && lesson.available;
    const statusLabel = completed
      ? (lang === 'zh' ? '已完成' : 'Completed')
      : availableNow
        ? featured ? (lang === 'zh' ? '推荐开始' : 'Recommended') : (lang === 'zh' ? '已上线' : 'Live now')
        : lesson.round;
    const ctaLabel = completed
      ? (lang === 'zh' ? '复习' : 'Review')
      : availableNow
        ? (lang === 'zh' ? '开始学习' : 'Start lesson')
        : (lang === 'zh' ? '敬请期待' : 'Coming soon');

    return `
      <article class="learn-lesson-card learn-lesson-card--${availableNow ? 'live' : 'preview'} ${completed ? 'is-complete' : ''} ${featured ? 'is-featured' : ''} learn-animate learn-animate--reveal" style="--learn-stagger:${index};">
        <div class="learn-lesson-card__top">
          <span class="learn-lesson-card__order">${lesson.order}</span>
          <span class="learn-lesson-card__status">${escapeHtml(statusLabel)}</span>
        </div>
        <div class="learn-lesson-card__body">
          <div class="learn-lesson-card__meta">
            <span>${escapeHtml(lesson.difficulty)}</span>
            <span>${lesson.estimatedMinutes}${lang === 'zh' ? ' 分钟' : ' min'}</span>
          </div>
          <h3>${escapeHtml(text(lesson.title, lang))}</h3>
          <p>${escapeHtml(text(lesson.summary, lang))}</p>
          <div class="learn-lesson-card__footer">
            <span>${bestScore > 0 ? `${lang === 'zh' ? '最佳成绩' : 'Best score'} ${bestScore}/20` : (lang === 'zh' ? '尚未测试' : 'Not tested yet')}</span>
            <button type="button" class="learn-inline-btn" ${availableNow ? `data-action="start-lesson" data-lesson-id="${escapeHtml(lesson.id)}"` : 'disabled'}>
              ${escapeHtml(featured && !completed ? (lang === 'zh' ? '从这里开始' : 'Start here') : ctaLabel)}
            </button>
          </div>
          ${lesson.stats && lesson.stats.length ? `
            <div class="learn-chip-row">
              ${lesson.stats.map((item) => `<span class="learn-chip">${escapeHtml(text(item, lang))}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  function renderLessonPlayer(lang, lesson) {
    const step = lesson.steps[rootState.stepIndex] || lesson.steps[0];
    const stepNumber = rootState.stepIndex + 1;
    const totalSteps = lesson.steps.length;
    const drillKey = getDrillStorageKey(lesson.id, rootState.stepIndex);
    const selectedDrill = rootState.drillAnswers[drillKey];
    const selectedDrillOption = step.type === 'drill' ? step.options.find((option) => option.key === selectedDrill) : null;

    return `
      <section class="learn-player-shell">
        <header class="learn-player-header learn-animate learn-animate--rise">
          <div class="learn-player-header__left">
            <button type="button" class="learn-icon-btn" data-action="back-overview" aria-label="${lang === 'zh' ? '返回课程总览' : 'Back to overview'}">←</button>
            <div>
              <span class="learn-section-label">${escapeHtml(text(STAGE_META[lesson.stage].title, lang))}</span>
              <h1>${escapeHtml(text(lesson.title, lang))}</h1>
              <p>${escapeHtml(text(lesson.summary, lang))}</p>
            </div>
          </div>
          <div class="learn-player-header__right">
            <div class="learn-player-badge">${stepNumber}/${totalSteps}</div>
            <button type="button" class="learn-btn learn-btn--ghost" data-action="toggle-sound">${rootState.soundEnabled ? (lang === 'zh' ? '音效已开' : 'Sound on') : (lang === 'zh' ? '音效已关' : 'Sound off')}</button>
          </div>
        </header>

        <div class="learn-player-progress">
          <span style="width:${(stepNumber / totalSteps) * 100}%"></span>
        </div>

        <div class="learn-mobile-progress learn-animate learn-animate--reveal">
          <div class="learn-mobile-progress__meta">
            <span>${lang === 'zh' ? `步骤 ${stepNumber} / ${totalSteps}` : `Step ${stepNumber} / ${totalSteps}`}</span>
            <strong>${escapeHtml(step.type === 'drill' ? (lang === 'zh' ? '检查点' : 'Checkpoint') : step.type === 'bridge' ? (lang === 'zh' ? '进入测试前' : 'Before exam') : (lang === 'zh' ? '课程内容' : 'Lesson page'))}</strong>
          </div>
          <div class="learn-mobile-progress__title">${escapeHtml(text(step.title, lang))}</div>
        </div>

        <div class="learn-player-layout">
          <aside class="learn-player-sidebar learn-animate learn-animate--reveal">
            <div class="learn-sidebar-card">
              <span class="learn-section-label">${lang === 'zh' ? '课程步骤' : 'Lesson flow'}</span>
              <ol>
                ${lesson.steps.map((item, index) => `
                  <li class="${index === rootState.stepIndex ? 'is-active' : ''} ${index < rootState.stepIndex ? 'is-done' : ''}">
                    <span>${index + 1}</span>
                    <div>
                      <strong>${escapeHtml(text(item.title, lang))}</strong>
                      <small>${escapeHtml(item.type === 'drill' ? (lang === 'zh' ? '练习检查点' : 'Checkpoint drill') : item.type === 'bridge' ? (lang === 'zh' ? '进入测试前' : 'Before the exam') : (lang === 'zh' ? '课程页' : 'Lesson page'))}</small>
                    </div>
                  </li>
                `).join('')}
              </ol>
            </div>
          </aside>

          <main class="learn-player-main">
            <article class="learn-step-card learn-animate learn-animate--${escapeHtml(step.animationPreset || 'rise')}">
              <div class="learn-step-card__content">
                <span class="learn-step-kicker">${escapeHtml(step.type === 'drill' ? (lang === 'zh' ? 'Checkpoint Drill' : 'Checkpoint Drill') : step.type === 'bridge' ? (lang === 'zh' ? 'Mastery Gate' : 'Mastery Gate') : (lang === 'zh' ? 'Lesson Page' : 'Lesson Page'))}</span>
                <h2>${escapeHtml(text(step.title, lang))}</h2>
                ${step.body[lang].map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
                ${step.supportingCopy ? `<div class="learn-step-note">${escapeHtml(text(step.supportingCopy, lang))}</div>` : ''}
                ${step.type === 'drill' ? renderDrillBlock(lang, lesson, step, selectedDrillOption) : ''}
              </div>
              <div class="learn-step-card__chart">
                ${renderChart(step.chartState, lang)}
              </div>
            </article>

          </main>
        </div>

        <div class="learn-action-bar learn-action-bar--lesson learn-animate learn-animate--reveal">
          <div class="learn-action-bar__meta">
            <span>${escapeHtml(text(lesson.title, lang))}</span>
            <strong>${lang === 'zh' ? `步骤 ${stepNumber} / ${totalSteps}` : `Step ${stepNumber} / ${totalSteps}`}</strong>
          </div>
          <div class="learn-action-bar__actions">
            <button type="button" class="learn-btn learn-btn--ghost" data-action="step-back" ${rootState.stepIndex === 0 ? 'disabled' : ''}>${lang === 'zh' ? '上一页' : 'Previous'}</button>
            <button type="button" class="learn-btn learn-btn--primary" data-action="step-next" ${step.type === 'drill' && (!selectedDrillOption || !selectedDrillOption.correct) ? 'disabled' : ''}>
              ${rootState.stepIndex === totalSteps - 1 ? (lang === 'zh' ? '开始测试' : 'Start exam') : (lang === 'zh' ? '下一页' : 'Next')}
            </button>
          </div>
        </div>
      </section>
    `;
  }

  function renderDrillBlock(lang, lesson, step, selectedOption) {
    const stepIndex = rootState.stepIndex;
    return `
      <div class="learn-drill-block">
        <div class="learn-drill-options">
          ${step.options.map((option) => {
            const isSelected = selectedOption && selectedOption.key === option.key;
            const stateClass = isSelected ? (option.correct ? 'is-correct' : 'is-wrong') : selectedOption && selectedOption.correct && option.correct ? 'is-correct' : '';
            return `
              <button
                type="button"
                class="learn-drill-option ${stateClass}"
                data-action="drill-answer"
                data-step-index="${stepIndex}"
                data-option-key="${escapeHtml(option.key)}"
                ${selectedOption && selectedOption.correct ? 'disabled' : ''}
              >
                <span>${option.key.toUpperCase()}</span>
                <strong>${escapeHtml(text(option.text, lang))}</strong>
              </button>
            `;
          }).join('')}
        </div>
        ${selectedOption ? `
          <div class="learn-drill-feedback ${selectedOption.correct ? 'is-correct' : 'is-wrong'}">
            ${escapeHtml(text(selectedOption.feedback, lang))}
          </div>
        ` : `
          <div class="learn-drill-feedback is-neutral">
            ${lang === 'zh' ? '先选出你认为最合理的答案。只有答对这一页，才能继续往下。' : 'Choose the answer you believe is most accurate. You need the correct checkpoint answer before continuing.'}
          </div>
        `}
      </div>
    `;
  }

  function renderQuiz(lang, lesson) {
    const exam = rootState.activeExam;
    const question = getCurrentExamQuestion();
    if (!exam || !question) {
      return `
        <section class="learn-results-shell">
          <div class="learn-empty-card">
            <h2>${lang === 'zh' ? '找不到当前测试' : 'No active exam found'}</h2>
            <button type="button" class="learn-btn learn-btn--primary" data-action="back-overview">${lang === 'zh' ? '回到总览' : 'Back to overview'}</button>
          </div>
        </section>
      `;
    }
    const answerState = exam.answers[question.id];
    const progressPct = ((exam.currentIndex + 1) / exam.questionIds.length) * 100;

    return `
      <section class="learn-quiz-shell">
        <header class="learn-quiz-header learn-animate learn-animate--rise">
          <div>
            <span class="learn-section-label">${lang === 'zh' ? '精通测试' : 'Mastery exam'}</span>
            <h1>${escapeHtml(text(lesson.title, lang))}</h1>
            <p>${lang === 'zh' ? '每次随机抽 20 题。只有 20/20 才会完成。' : 'Each attempt draws 20 questions. Only 20/20 completes the lesson.'}</p>
          </div>
          <button type="button" class="learn-btn learn-btn--ghost" data-action="back-overview">${lang === 'zh' ? '回到总览' : 'Back to overview'}</button>
        </header>

        <div class="learn-player-progress">
          <span style="width:${progressPct}%"></span>
        </div>

        <div class="learn-quiz-layout">
          <article class="learn-quiz-card learn-animate learn-animate--reveal">
            <div class="learn-quiz-card__meta">
              <span>${lang === 'zh' ? `第 ${exam.currentIndex + 1} / ${EXAM_SIZE} 题` : `Question ${exam.currentIndex + 1} / ${EXAM_SIZE}`}</span>
              <span>${escapeHtml(question.difficulty)}</span>
            </div>
            <h2>${escapeHtml(text(question.prompt, lang))}</h2>
            <div class="learn-quiz-options">
              ${question.choices[lang].map((choice) => {
                const selected = answerState && answerState.selectedKey === choice.key;
                const correct = choice.key === question.correctChoiceKey;
                const optionClass = answerState
                  ? correct ? 'is-correct' : selected ? 'is-wrong' : ''
                  : '';
                return `
                  <button
                    type="button"
                    class="learn-quiz-option ${optionClass}"
                    data-action="quiz-answer"
                    data-choice-key="${escapeHtml(choice.key)}"
                    ${answerState ? 'disabled' : ''}
                  >
                    <span>${choice.key.toUpperCase()}</span>
                    <strong>${escapeHtml(choice.text)}</strong>
                  </button>
                `;
              }).join('')}
            </div>
            <div class="learn-quiz-feedback ${answerState ? (answerState.isCorrect ? 'is-correct' : 'is-wrong') : 'is-neutral'}">
              ${answerState
                ? escapeHtml(text(question.explanation, lang))
                : (lang === 'zh' ? '先作答。作答后会立即显示解释，然后才能前往下一题。' : 'Answer first. The explanation appears immediately, then you can move on.')}
            </div>
          </article>
          <aside class="learn-quiz-side learn-animate learn-animate--pulse">
            <div class="learn-side-card">
              <h3>${lang === 'zh' ? '通过规则' : 'Pass rule'}</h3>
              <p>${lang === 'zh' ? '这一轮必须 20 题全对，才会正式解锁完成。' : 'You must get all 20 questions correct in the same attempt to complete the lesson.'}</p>
            </div>
            <div class="learn-side-card">
              <h3>${lang === 'zh' ? '当前状态' : 'Current status'}</h3>
              <p>${lang === 'zh'
                ? `已回答 ${Object.keys(exam.answers).length} 题，当前正确 ${Object.values(exam.answers).filter((entry) => entry.isCorrect).length} 题。`
                : `${Object.keys(exam.answers).length} answered so far, ${Object.values(exam.answers).filter((entry) => entry.isCorrect).length} correct.`}</p>
            </div>
          </aside>
        </div>

        <div class="learn-action-bar learn-action-bar--quiz learn-animate learn-animate--reveal">
          <div class="learn-action-bar__meta">
            <span>${lang === 'zh' ? `第 ${exam.currentIndex + 1} / ${EXAM_SIZE} 题` : `Question ${exam.currentIndex + 1} / ${EXAM_SIZE}`}</span>
            <strong>${answerState ? (answerState.isCorrect ? (lang === 'zh' ? '已作答' : 'Answered') : (lang === 'zh' ? '先看解释再继续' : 'Review feedback then continue')) : (lang === 'zh' ? '先选择答案' : 'Answer to continue')}</strong>
          </div>
          <div class="learn-action-bar__actions">
            <button type="button" class="learn-btn learn-btn--ghost" data-action="restart-exam">${lang === 'zh' ? '重抽 20 题' : 'Redraw exam'}</button>
            <button type="button" class="learn-btn learn-btn--primary" data-action="quiz-next" ${answerState ? '' : 'disabled'}>
              ${exam.currentIndex === EXAM_SIZE - 1 ? (lang === 'zh' ? '提交成绩' : 'Submit score') : (lang === 'zh' ? '下一题' : 'Next question')}
            </button>
          </div>
        </div>
      </section>
    `;
  }

  function renderResults(lang, lesson) {
    const result = rootState.lastResult;
    if (!result) {
      return `
        <section class="learn-results-shell">
          <div class="learn-empty-card">
            <h2>${lang === 'zh' ? '还没有最近一次结果' : 'No recent result yet'}</h2>
            <button type="button" class="learn-btn learn-btn--primary" data-action="back-overview">${lang === 'zh' ? '回到总览' : 'Back to overview'}</button>
          </div>
        </section>
      `;
    }
    const passed = result.passed;
    const nextLesson = lessonMap.get(LESSON_CHAIN[LESSON_CHAIN.indexOf(result.lessonId) + 1]);
    const primaryAction = passed
      ? (nextLesson && isLessonAvailable(nextLesson) ? 'start-lesson' : 'back-overview')
      : 'retry-exam';

    return `
      <section class="learn-results-shell">
        <div class="learn-results-card ${passed ? 'is-pass' : 'is-fail'} learn-animate learn-animate--rise">
          <span class="learn-section-label">${passed ? (lang === 'zh' ? '精通已达成' : 'Mastery achieved') : (lang === 'zh' ? '仍未通过' : 'Mastery not achieved yet')}</span>
          <h1>${escapeHtml(text(lesson.title, lang))}</h1>
          <div class="learn-results-score">${result.correct}/${result.total}</div>
          <p>${passed
            ? (lang === 'zh'
              ? '这一课已完成。因为你这一次拿到 20/20，系统才会标记通过。'
              : 'This lesson is complete because you achieved 20/20 in the same attempt.')
            : (lang === 'zh'
              ? '这次没有到 20/20，所以不会标记完成。你需要重新抽一套 20 题再试一次。'
              : 'This attempt did not reach 20/20, so the lesson stays incomplete. Retry with a fresh 20-question set.')}</p>
          <div class="learn-results-actions">
            <button type="button" class="learn-btn learn-btn--primary" data-action="${primaryAction}" ${passed && nextLesson && isLessonAvailable(nextLesson) ? `data-lesson-id="${escapeHtml(nextLesson.id)}"` : ''}>
              ${passed
                ? nextLesson && isLessonAvailable(nextLesson)
                  ? (lang === 'zh' ? '进入下一课' : 'Start next lesson')
                  : (lang === 'zh' ? '回到总览' : 'Back to overview')
                : (lang === 'zh' ? '重新抽 20 题' : 'Retry with 20 new questions')}
            </button>
            <button type="button" class="learn-btn learn-btn--ghost" data-action="back-overview">${lang === 'zh' ? '回到课程总览' : 'Course overview'}</button>
          </div>
        </div>

        ${!passed && result.incorrect.length ? `
          <section class="learn-review-block learn-animate learn-animate--reveal">
            <div class="learn-review-block__head">
              <span class="learn-section-label">${lang === 'zh' ? '错题回看' : 'Wrong-answer review'}</span>
              <h2>${lang === 'zh' ? '你这次失分的位置' : 'Where this attempt lost points'}</h2>
            </div>
            <div class="learn-review-list">
              ${result.incorrect.slice(0, 6).map((item) => {
                const chosen = item.selectedKey
                  ? item.choices[lang].find((choice) => choice.key === item.selectedKey)
                  : null;
                const correct = item.choices[lang].find((choice) => choice.key === item.correctChoiceKey);
                return `
                  <article class="learn-review-item">
                    <h3>${escapeHtml(text(item.prompt, lang))}</h3>
                    <p><strong>${lang === 'zh' ? '你的答案：' : 'Your answer: '}</strong>${escapeHtml(chosen ? chosen.text : (lang === 'zh' ? '未作答' : 'No answer'))}</p>
                    <p><strong>${lang === 'zh' ? '正确答案：' : 'Correct answer: '}</strong>${escapeHtml(correct ? correct.text : '')}</p>
                    <p>${escapeHtml(text(item.explanation, lang))}</p>
                  </article>
                `;
              }).join('')}
            </div>
          </section>
        ` : ''}
      </section>
    `;
  }

  function renderChart(chartState, lang) {
    const candles = Array.isArray(chartState.candles) ? chartState.candles : [];
    const zoneValues = (chartState.zones || []).flatMap((zone) => [zone.top, zone.bottom]).filter((value) => Number.isFinite(value));
    const markerValues = (chartState.markers || []).map((marker) => marker.price).filter((value) => Number.isFinite(value));
    const values = candles.flatMap((candle) => [candle.high, candle.low]).concat(zoneValues, markerValues).filter((value) => Number.isFinite(value));
    const rawMax = Math.max(...values, 1);
    const rawMin = Math.min(...values);
    const rawRange = Math.max(rawMax - rawMin, 1);
    const verticalPadding = Math.max(rawRange * 0.14, 0.9);
    const max = rawMax + verticalPadding;
    const min = rawMin - verticalPadding;
    const range = Math.max(max - min, 1);
    const width = 960;
    const height = 560;
    const paddingX = 42;
    const paddingY = 74;
    const labelHeight = 30;
    const chartHeight = height - (paddingY * 2);
    const candleAreaWidth = width - (paddingX * 2);
    const candleSpacing = candleAreaWidth / Math.max(candles.length, 1);
    const candleWidth = Math.min(28, Math.max(12, candleSpacing * 0.62));
    const priceToY = (value) => paddingY + ((max - value) / range) * chartHeight;
    const axisValues = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      return max - (range * ratio);
    });
    const plotMidY = paddingY + (chartHeight / 2);
    const labelSpacing = 8;
    const noteBoxes = [];
    const candleCollisionBoxes = candles.map((candle, index) => {
      const centerX = paddingX + (index * candleSpacing) + (candleSpacing * 0.5);
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      const bodyY = Math.min(openY, closeY);
      const bodyHeight = Math.max(6, Math.abs(openY - closeY));
      return {
        left: centerX - (candleWidth / 2) - 8,
        right: centerX + (candleWidth / 2) + 8,
        top: Math.min(highY, bodyY) - 8,
        bottom: Math.max(lowY, bodyY + bodyHeight) + 8,
      };
    });

    const overlapsRect = (a, b) => !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);

    const placeNearbyLabel = (anchorX, anchorY, labelWidth, preferredSide = 'top') => {
      const labelTop = preferredSide === 'top';
      const candidateSpecs = [];
      const horizontalOffsets = [
        18,
        -labelWidth - 18,
        -(labelWidth / 2),
        54,
        -labelWidth - 54,
        -(labelWidth * 0.25),
      ];
      const preferredVerticals = labelTop
        ? [-42, -78, -114, 18, 54, 90]
        : [18, 54, 90, -42, -78, -114];

      preferredVerticals.forEach((dy) => {
        horizontalOffsets.forEach((dx) => {
          candidateSpecs.push({ dx, dy });
        });
      });

      const makeBox = (candidateX, candidateY) => ({
        left: candidateX - labelSpacing,
        right: candidateX + labelWidth + labelSpacing,
        top: candidateY - labelSpacing,
        bottom: candidateY + labelHeight + labelSpacing,
      });

      let bestCandidate = null;

      for (const spec of candidateSpecs) {
        const x = Math.max(14, Math.min(width - labelWidth - 14, anchorX + spec.dx));
        const y = Math.max(14, Math.min(height - labelHeight - 14, anchorY + spec.dy));
        const box = makeBox(x, y);
        const hitsCandle = candleCollisionBoxes.some((candleBox) => overlapsRect(box, candleBox));
        const hitsNote = noteBoxes.some((noteBox) => overlapsRect(box, noteBox));
        if (!hitsCandle && !hitsNote) {
          noteBoxes.push(box);
          return { x, y, side: y < anchorY ? 'top' : 'bottom' };
        }

        const penalty = (hitsCandle ? 10000 : 0) + (hitsNote ? 5000 : 0) + Math.abs(spec.dy) + Math.abs(spec.dx * 0.15);
        if (!bestCandidate || penalty < bestCandidate.penalty) {
          bestCandidate = { x, y, box, penalty };
        }
      }

      noteBoxes.push(bestCandidate.box);
      return { x: bestCandidate.x, y: bestCandidate.y, side: bestCandidate.y < anchorY ? 'top' : 'bottom' };
    };

    const zoneFillMarkup = (chartState.zones || []).map((zone) => {
      const x = paddingX + (zone.from * candleSpacing) - (candleSpacing * 0.35);
      const zoneWidth = ((zone.to - zone.from + 1) * candleSpacing);
      const y = priceToY(zone.top);
      const zoneHeight = Math.max(12, priceToY(zone.bottom) - y);
      return `
        <g class="learn-chart-zone learn-chart-zone--${escapeHtml(zone.tone || 'muted')}">
          <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${zoneWidth.toFixed(1)}" height="${zoneHeight.toFixed(1)}" rx="12"></rect>
        </g>
      `;
    }).join('');

    const zoneLabelMarkup = (chartState.zones || []).map((zone) => {
      const x = paddingX + (zone.from * candleSpacing) - (candleSpacing * 0.35);
      const zoneWidth = ((zone.to - zone.from + 1) * candleSpacing);
      const y = priceToY(zone.top);
      const zoneBottomY = priceToY(zone.bottom);
      const zoneCenterX = x + (zoneWidth / 2);
      const label = text(zone.label, lang);
      const labelWidth = Math.max(112, Math.min(Math.max(zoneWidth - 18, 112), (String(label).length * 8.2) + 28));
      const preferredSide = ((y + zoneBottomY) / 2) > plotMidY ? 'top' : 'bottom';
      const anchorY = preferredSide === 'top' ? y : zoneBottomY;
      const slot = placeNearbyLabel(zoneCenterX, anchorY, labelWidth, preferredSide);
      const connectorX = slot.x + (labelWidth / 2);
      const connectorY = slot.side === 'top' ? slot.y + labelHeight : slot.y;
      return `
        <g class="learn-chart-zone-label learn-chart-zone-label--${escapeHtml(zone.tone || 'muted')}">
          <line x1="${zoneCenterX.toFixed(1)}" y1="${anchorY.toFixed(1)}" x2="${connectorX.toFixed(1)}" y2="${connectorY.toFixed(1)}"></line>
          <rect x="${slot.x.toFixed(1)}" y="${slot.y.toFixed(1)}" width="${labelWidth.toFixed(1)}" height="${labelHeight}" rx="10"></rect>
          <text x="${(slot.x + 12).toFixed(1)}" y="${(slot.y + 20).toFixed(1)}">${escapeHtml(label)}</text>
        </g>
      `;
    }).join('');

    const candleMarkup = candles.map((candle, index) => {
      const centerX = paddingX + (index * candleSpacing) + (candleSpacing * 0.5);
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      const bodyY = Math.min(openY, closeY);
      const bodyHeight = Math.max(6, Math.abs(openY - closeY));
      const bullish = candle.close >= candle.open;
      return `
        <g class="learn-chart-candle ${bullish ? 'is-bull' : 'is-bear'}">
          <line x1="${centerX.toFixed(1)}" x2="${centerX.toFixed(1)}" y1="${highY.toFixed(1)}" y2="${lowY.toFixed(1)}"></line>
          <rect x="${(centerX - (candleWidth / 2)).toFixed(1)}" y="${bodyY.toFixed(1)}" width="${candleWidth.toFixed(1)}" height="${bodyHeight.toFixed(1)}" rx="4"></rect>
        </g>
      `;
    }).join('');

    const markerMarkup = (chartState.markers || []).map((marker) => {
      const x = paddingX + (marker.index * candleSpacing) + (candleSpacing * 0.5);
      const y = priceToY(marker.price);
      const label = text(marker.label, lang);
      const labelWidth = Math.max(138, Math.min(220, (String(label).length * 8.4) + 28));
      const preferredSide = y > plotMidY ? 'top' : 'bottom';
      const slot = placeNearbyLabel(x, y, labelWidth, preferredSide);
      const connectorX = slot.x + Math.min(labelWidth - 20, Math.max(20, x - slot.x));
      const connectorY = slot.side === 'top' ? slot.y + labelHeight : slot.y;
      return `
        <g class="learn-chart-marker learn-chart-marker--${escapeHtml(marker.tone || 'info')}">
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5"></circle>
          <line x1="${x.toFixed(1)}" x2="${connectorX.toFixed(1)}" y1="${y.toFixed(1)}" y2="${connectorY.toFixed(1)}"></line>
          <rect x="${slot.x.toFixed(1)}" y="${slot.y.toFixed(1)}" width="${labelWidth.toFixed(1)}" height="${labelHeight}" rx="10"></rect>
          <text x="${(slot.x + 12).toFixed(1)}" y="${(slot.y + 20).toFixed(1)}">${escapeHtml(label)}</text>
        </g>
      `;
    }).join('');

    return `
      <div class="learn-chart-card">
        <div class="learn-chart-card__head">
          <span>${lang === 'zh' ? 'XAUUSD 教学图例' : 'XAUUSD lesson scenario'}</span>
          <strong>${escapeHtml(text(chartState.title, lang))}</strong>
        </div>
        <svg class="learn-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(text(chartState.title, lang))}">
          <defs>
            <linearGradient id="learn-chart-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="rgba(10,18,32,0.95)"></stop>
              <stop offset="100%" stop-color="rgba(3,8,18,0.82)"></stop>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="${width}" height="${height}" rx="24" fill="url(#learn-chart-bg)"></rect>
          <rect class="learn-chart-frame" x="${paddingX - 10}" y="10" width="${(width - (paddingX * 2) + 20).toFixed(1)}" height="${(height - 20).toFixed(1)}" rx="22"></rect>
          ${[0.2, 0.4, 0.6, 0.8].map((step) => {
            const y = paddingY + (chartHeight * step);
            return `<line class="learn-chart-grid-line" x1="${paddingX}" x2="${width - paddingX}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"></line>`;
          }).join('')}
          ${Array.from({ length: Math.max(0, candles.length - 1) }, (_, index) => {
            if (index % 3 !== 0) return '';
            const x = paddingX + ((index + 0.5) * candleSpacing);
            return `<line class="learn-chart-grid-line learn-chart-grid-line--vertical" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${paddingY}" y2="${(height - paddingY).toFixed(1)}"></line>`;
          }).join('')}
          ${axisValues.map((axisValue) => {
            const y = priceToY(axisValue);
            return `
              <g class="learn-chart-axis">
                <text x="${(width - paddingX + 8).toFixed(1)}" y="${(y + 4).toFixed(1)}">${axisValue.toFixed(1)}</text>
              </g>
            `;
          }).join('')}
          ${zoneFillMarkup}
          ${candleMarkup}
          ${zoneLabelMarkup}
          ${markerMarkup}
        </svg>
        <div class="learn-chart-card__legend">
          <span><i class="is-bull"></i>${lang === 'zh' ? '上涨K线' : 'Bullish candle'}</span>
          <span><i class="is-bear"></i>${lang === 'zh' ? '下跌K线' : 'Bearish candle'}</span>
        </div>
      </div>
    `;
  }

  function toggleSound() {
    const nextEnabled = !rootState.soundEnabled;
    rootState.soundEnabled = nextEnabled;
    rootState.musicEnabled = nextEnabled;
    if (nextEnabled) {
      unlockAudio().catch(() => {});
      playSound('ui-on');
      syncLessonAudio();
    } else {
      stopLessonMusic(true);
    }
    saveState();
    render();
  }

  function ensureAudioContext() {
    if (audioContext) return audioContext;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
    return audioContext;
  }

  async function unlockAudio() {
    const context = ensureAudioContext();
    if (!context) return null;
    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch {
        return context;
      }
    }
    audioUnlocked = context.state === 'running';
    return context;
  }

  function createMusicVoice(context, frequency, gainValue, filterNode) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(gainValue, context.currentTime);
    oscillator.connect(gain);
    gain.connect(filterNode);
    oscillator.start();
    return { oscillator, gain };
  }

  function startLessonMusic() {
    const context = ensureAudioContext();
    if (!context || activeMusicCue || !audioUnlocked || !rootState.soundEnabled || !rootState.musicEnabled) return;
    if (context.state === 'suspended') return;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(920, context.currentTime);
    filter.Q.setValueAtTime(0.8, context.currentTime);

    const masterGain = context.createGain();
    masterGain.gain.setValueAtTime(0.0001, context.currentTime);
    filter.connect(masterGain);
    masterGain.connect(context.destination);

    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.07, context.currentTime);
    lfoGain.gain.setValueAtTime(110, context.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const voices = [
      createMusicVoice(context, 220, 0.011, filter),
      createMusicVoice(context, 277.18, 0.008, filter),
      createMusicVoice(context, 329.63, 0.007, filter),
    ];

    masterGain.gain.exponentialRampToValueAtTime(0.022, context.currentTime + 1.2);
    lfo.start();
    activeMusicCue = { masterGain, filter, lfo, lfoGain, voices };
  }

  function stopLessonMusic(immediate = false) {
    if (!activeMusicCue || !audioContext) return;
    const { masterGain, lfo, voices } = activeMusicCue;
    const now = audioContext.currentTime;
    const stopAt = immediate ? now + 0.04 : now + 0.6;
    const currentGain = Math.max(masterGain.gain.value || 0.0001, 0.0001);
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(currentGain, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    voices.forEach(({ oscillator }) => oscillator.stop(stopAt + 0.05));
    lfo.stop(stopAt + 0.05);
    activeMusicCue = null;
  }

  function syncLessonAudio() {
    const shouldPlayMusic = rootState.soundEnabled
      && rootState.musicEnabled
      && audioUnlocked
      && (rootState.view === 'lesson' || rootState.view === 'quiz');
    if (shouldPlayMusic) {
      startLessonMusic();
    } else {
      stopLessonMusic(rootState.view === 'overview');
    }
  }

  function playTone(frequency, duration, type = 'sine', gainValue = 0.028, when = 0) {
    const context = ensureAudioContext();
    if (!context || !rootState.soundEnabled || !audioUnlocked) return;
    if (context.state === 'suspended') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + when);
    gain.gain.setValueAtTime(0.0001, context.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(gainValue, context.currentTime + when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + when + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + when);
    oscillator.stop(context.currentTime + when + duration + 0.02);
  }

  function playSound(cue) {
    if (!rootState.soundEnabled) return;
    switch (cue) {
      case 'lesson-open':
        playTone(440, 0.14, 'triangle', 0.024, 0);
        playTone(660, 0.18, 'sine', 0.02, 0.1);
        break;
      case 'step-next':
        playTone(560, 0.08, 'triangle', 0.018, 0);
        playTone(760, 0.08, 'triangle', 0.015, 0.08);
        break;
      case 'quiz-correct':
        playTone(660, 0.08, 'sine', 0.026, 0);
        playTone(880, 0.13, 'triangle', 0.022, 0.08);
        break;
      case 'quiz-wrong':
        playTone(320, 0.09, 'sawtooth', 0.02, 0);
        playTone(220, 0.14, 'sawtooth', 0.016, 0.08);
        break;
      case 'lesson-pass':
        playTone(523.25, 0.1, 'triangle', 0.025, 0);
        playTone(659.25, 0.12, 'triangle', 0.022, 0.08);
        playTone(783.99, 0.18, 'sine', 0.02, 0.16);
        break;
      case 'lesson-fail':
        playTone(260, 0.12, 'sawtooth', 0.02, 0);
        playTone(200, 0.18, 'sawtooth', 0.016, 0.09);
        break;
      case 'lesson-unlock':
        playTone(700, 0.08, 'triangle', 0.018, 0);
        playTone(980, 0.08, 'triangle', 0.018, 0.08);
        playTone(1180, 0.12, 'sine', 0.016, 0.16);
        break;
      case 'ui-on':
        playTone(740, 0.08, 'sine', 0.02, 0);
        break;
      default:
        break;
    }
  }

  function bindListeners() {
    if (listenersBound) return;
    listenersBound = true;
    rootEl.addEventListener('pointerdown', (event) => {
      if (!rootEl || !rootEl.contains(event.target)) return;
      unlockAudio().then(() => {
        syncLessonAudio();
      }).catch(() => {});
    });
    rootEl.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-action]');
      if (!trigger || !rootEl || !rootEl.contains(trigger)) return;
      unlockAudio().then(() => {
        syncLessonAudio();
      }).catch(() => {});
      const action = trigger.getAttribute('data-action');
      if (!action) return;

      if (action === 'start-lesson') {
        startLesson(trigger.getAttribute('data-lesson-id'));
      } else if (action === 'resume-learn') {
        resumeCurrentFlow();
      } else if (action === 'toggle-sound') {
        toggleSound();
      } else if (action === 'step-next') {
        moveStep(1);
      } else if (action === 'step-back') {
        moveStep(-1);
      } else if (action === 'back-overview') {
        backToOverview();
      } else if (action === 'drill-answer') {
        selectDrillAnswer(Number(trigger.getAttribute('data-step-index')), trigger.getAttribute('data-option-key'));
      } else if (action === 'quiz-answer') {
        answerQuizQuestion(trigger.getAttribute('data-choice-key'));
      } else if (action === 'quiz-next') {
        nextQuizStep();
      } else if (action === 'retry-exam') {
        retryExam();
      } else if (action === 'restart-exam') {
        beginExam(rootState.activeExam?.lessonId || rootState.activeLessonId);
      }
    });

    window.addEventListener('xauradar:language-change', () => {
      render();
    });
    window.addEventListener('resize', () => {
      scheduleActionBarMeasure();
    });
    window.addEventListener('xauradar:page-change', (event) => {
      const page = event?.detail?.page;
      if (page !== 'learn') {
        stopLessonMusic(false);
      } else {
        scheduleActionBarMeasure();
        syncLessonAudio();
      }
    });
  }

  function initLearnPage() {
    rootEl = document.getElementById('learn-root');
    if (!rootEl) return;
    bindListeners();
    render();
  }

  function renderLearnPage() {
    rootEl = document.getElementById('learn-root');
    render();
  }

  window.UI = window.UI || {};
  window.UI.initLearnPage = initLearnPage;
  window.UI.renderLearnPage = renderLearnPage;
})();
