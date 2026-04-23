/**
 * ui.js - DOM rendering for XAU Radar dashboard.
 */

const APP_TIMEZONE = 'Asia/Kuala_Lumpur';
const APP_TZ_LABEL = 'MYT';
const THEME_KEY = 'xauradar_theme';
const XAU_PIP_SIZE = 0.1;
const LANG_KEY = 'xauradar_lang';
const GOOGLE_TRANSLATE_SCRIPT_ID = 'xauradar-google-translate-script';
const GOOGLE_TRANSLATE_CALLBACK = '__xauRadarGoogleTranslateInit';
const DASHBOARD_MODE_KEY = 'xauradar_dashboard_mode';
const SIGNAL_LANE_KEY = 'xauradar_signal_lane';
const SIGNAL_EXPANDED_KEY = 'xauradar_signal_expanded';
const POLY_CATEGORY_KEY = 'xauradar_poly_category';
const POLY_SORT_KEY = 'xauradar_poly_sort';
const POLY_VIEW_KEY = 'xauradar_poly_view';
const POLY_BET_TYPE_KEY = 'xauradar_poly_bet_type';
const LEARN_PROGRESS_KEY = 'xauradar_learn_progress_v1';
const LEARN_QUIZ_KEY = 'xauradar_learn_quiz_v1';

let activeDashboardMode = 'xau';
let lastXauPage = 'signal';
let currentLearnLessonId = 'how-xauusd-moves';
let learnQuizFeedback = {};
let learnSelectedAnswers = {};
const polymarketState = {
  btcTick: null,
  markets: [],
  fallbackMarkets: [],
  slices: { trending: [], breaking: [], new: [] },
  feedStatus: {
    liveOk: false,
    fallbackUsed: false,
    sourceMode: 'idle',
    sourceLabel: 'Waiting for live feed',
    fetchedAt: null,
    error: '',
  },
  category: 'all',
  query: '',
  sort: 'volume',
  view: 'all',
  betType: 'all',
  renderCount: 60,
  selectedMarketSlug: '',
  historyBySlug: {},
};
const POLY_CATEGORIES = ['all', 'trending', 'breaking', 'new', 'politics', 'crypto', 'finance', 'geopolitics', 'oil', 'xauusd'];
const POLY_SORT_OPTIONS = ['volume', 'liquidity', 'ending', 'probability'];
const POLY_VIEW_OPTIONS = ['all', 'active', 'ending', 'resolved'];
const POLY_BET_TYPE_OPTIONS = ['all', 'up_down', 'above_below', 'price_range', 'hit_price'];
const POLY_LABELS = {
  all: 'All',
  trending: 'Trending',
  breaking: 'Breaking',
  new: 'New',
  politics: 'Politics',
  crypto: 'Crypto',
  finance: 'Finance',
  oil: 'Oil',
  geopolitics: 'Geopolitics',
  xauusd: 'XAUUSD',
};
const POLY_MARKET_TYPE_LABELS = {
  all: 'General',
  up_down: 'Up / Down',
  above_below: 'Above / Below',
  price_range: 'Price Range',
  hit_price: 'Hit Price',
};
const MORE_PAGE_TARGETS = new Set(['history', 'calendar', 'stats']);
const LEARN_UI_COPY = {
  en: {
    heroEyebrow: 'Learn XAUUSD with context',
    heroTitle: 'Turn signals into chart understanding, one short lesson at a time.',
    heroBody: 'Built for Malaysian beginners who want practical technical analysis, not trading hype.',
    startLesson: 'Start Lesson 1',
    continueLesson: 'Continue Lesson',
    progressTitle: 'Your Progress',
    currentLesson: 'Current lesson',
    nextAction: 'Next action',
    continueTitle: 'Continue Learning',
    openLesson: 'Open Lesson',
    markComplete: 'Mark Complete',
    completed: 'Completed',
    openChart: 'Open Chart',
    openSignal: 'Open Signal',
    openCalendar: 'Open Calendar',
    openHistory: 'Open History',
    openStats: 'Open Stats',
    modules: 'Course Modules',
    beginnerPath: 'Beginner Path',
    objective: 'Objective',
    coreIdea: 'Core Idea',
    whyItMatters: 'Why It Matters',
    example: 'XAUUSD Example',
    beginnerMistake: 'Beginner Mistake',
    riskNote: 'Risk Note',
    exercise: 'Guided Exercise',
    apply: 'Apply It In The App',
    quickCheck: 'Quick Check',
    chooseToSee: 'Choose an answer to see the explanation.',
    lessonOf: 'Lesson',
    of: 'of',
    min: 'min',
    nextActionText: 'Open the first lesson and finish the quick check.',
    languageBadge: 'EN + 中文',
  },
  zh: {
    heroEyebrow: '用真实情境学 XAUUSD',
    heroTitle: '把信号看懂成图表逻辑，一次学一小课就够。',
    heroBody: '这套内容是给马来西亚初学者的，重点是实用技术分析，不是喊单式话术。',
    startLesson: '开始第 1 课',
    continueLesson: '继续学习',
    progressTitle: '你的进度',
    currentLesson: '当前课程',
    nextAction: '下一步',
    continueTitle: '继续这一课',
    openLesson: '打开课程',
    markComplete: '标记完成',
    completed: '已完成',
    openChart: '打开图表',
    openSignal: '打开信号',
    openCalendar: '打开日历',
    openHistory: '打开历史',
    openStats: '打开统计',
    modules: '课程目录',
    beginnerPath: '新手路径',
    objective: '学习目标',
    coreIdea: '核心概念',
    whyItMatters: '为什么重要',
    example: 'XAUUSD 例子',
    beginnerMistake: '新手常犯错',
    riskNote: '风险提醒',
    exercise: '练习任务',
    apply: '回到 App 实战',
    quickCheck: '快速检查',
    chooseToSee: '先选一个答案，再看解释。',
    lessonOf: '第',
    of: '课 / 共',
    min: '分钟',
    nextActionText: '先打开第一课，做完快速检查再继续。',
    languageBadge: 'EN + 中文',
  },
};
const LEARN_LESSONS = [
  {
    id: 'how-xauusd-moves',
    order: 1,
    estimatedMinutes: 4,
    ctaTarget: 'calendar',
    ctaLabel: { en: 'Open Calendar', zh: '打开日历' },
    quiz: [
      {
        id: 'xau-driver-1',
        correctAnswer: 'b',
        answers: {
          en: [
            { key: 'a', text: 'Only candle patterns matter for gold.' },
            { key: 'b', text: 'Gold can react sharply to USD, yields, and big US news.' },
            { key: 'c', text: 'Gold always moves slowly during data releases.' },
          ],
          zh: [
            { key: 'a', text: '黄金只看K线形态就够了。' },
            { key: 'b', text: '黄金会明显受到美元、收益率和美国重磅数据影响。' },
            { key: 'c', text: '数据公布时，黄金一定会慢慢走。' },
          ],
        },
        explanation: {
          en: 'XAUUSD is not random. Macro drivers can change the speed and direction of the move very quickly.',
          zh: 'XAUUSD 不是随机乱走。宏观因素会很快改变波动速度和方向。',
        },
      },
      {
        id: 'xau-driver-2',
        correctAnswer: 'c',
        answers: {
          en: [
            { key: 'a', text: 'Chase immediately because volatility is exciting.' },
            { key: 'b', text: 'Ignore the calendar and focus only on indicators.' },
            { key: 'c', text: 'Check the event calendar first before forcing an entry.' },
          ],
          zh: [
            { key: 'a', text: '波动大就立刻追进去。' },
            { key: 'b', text: '不用看日历，只看指标就好。' },
            { key: 'c', text: '先看经济日历，再决定要不要进场。' },
          ],
        },
        explanation: {
          en: 'Context comes first. Near major events, a clean setup can fail for reasons outside the pattern itself.',
          zh: '先看情境再看形态。重大事件附近，再漂亮的形态也可能被消息打坏。',
        },
      },
    ],
    copy: {
      en: {
        title: 'How XAUUSD Moves',
        objective: 'Understand the main forces behind gold before trying to read any setup.',
        coreIdea: 'Gold reacts to USD strength, yields, risk sentiment, and major US data. The chart matters, but the context matters too.',
        whyItMatters: 'If you know what is moving gold, you stop treating every candle as a mystery and start reading the move with more discipline.',
        example: 'If CPI comes in hot and yields jump, gold can drop fast even when the chart looked calm one hour earlier.',
        beginnerMistake: 'Looking at the signal only and forgetting that major news can completely change the quality of the setup.',
        riskNote: 'Before entering XAUUSD, always check whether a high-impact event is near.',
        exercise: 'Open Calendar and identify the next high-impact event that could shake gold today or this week.',
        ctaCopy: 'Use the Calendar page to see whether the market backdrop is calm or dangerous before the next setup.',
        focusTitle: 'Context first',
        focusBody: 'Read the macro backdrop before you trust the chart too much.',
      },
      zh: {
        title: 'XAUUSD 为什么会动',
        objective: '先理解影响黄金的主要力量，再去判断图表形态。',
        coreIdea: '黄金会受到美元强弱、收益率、避险情绪和美国重磅数据影响。图表重要，但背景更重要。',
        whyItMatters: '当你知道黄金为什么在动，就不会把每一根K线都当成谜题，也更容易保持纪律。',
        example: '如果 CPI 高于预期、收益率一起上冲，黄金可能会突然下跌，就算一小时前图表看起来还很平静。',
        beginnerMistake: '只看信号，不看重大新闻，结果把原本还不错的形态当成一定能做。',
        riskNote: '做 XAUUSD 前，先确认附近有没有高影响事件。',
        exercise: '打开经济日历，找出今天或本周最可能影响黄金的高影响事件。',
        ctaCopy: '先用日历确认市场背景，再决定这个 setup 值不值得碰。',
        focusTitle: '先看背景',
        focusBody: '别只盯图表，先知道黄金为什么可能突然加速。',
      },
    },
  },
  {
    id: 'candles-without-confusion',
    order: 2,
    estimatedMinutes: 4,
    ctaTarget: 'chart',
    ctaLabel: { en: 'Open Chart', zh: '打开图表' },
    quiz: [
      {
        id: 'candle-1',
        correctAnswer: 'a',
        answers: {
          en: [
            { key: 'a', text: 'A long wick can show rejection, not just noise.' },
            { key: 'b', text: 'Only the candle colour matters.' },
            { key: 'c', text: 'Every bullish candle means buy now.' },
          ],
          zh: [
            { key: 'a', text: '长影线可能代表价格被明显拒绝。' },
            { key: 'b', text: '只看K线颜色就够了。' },
            { key: 'c', text: '只要阳线出现，就一定要立刻买。' },
          ],
        },
        explanation: {
          en: 'Wicks show where price tried to go and failed. That information matters for entries and traps.',
          zh: '影线代表价格曾经尝试走过去，但被打回来。这对进场和陷阱判断很重要。',
        },
      },
      {
        id: 'candle-2',
        correctAnswer: 'b',
        answers: {
          en: [
            { key: 'a', text: 'A candle close is less important than intrabar excitement.' },
            { key: 'b', text: 'A strong close usually tells you more than a noisy mid-candle move.' },
            { key: 'c', text: 'You should judge direction before the candle is near closing.' },
          ],
          zh: [
            { key: 'a', text: 'K线收盘不重要，盘中怎么跳最重要。' },
            { key: 'b', text: '强势收盘通常比中途乱跳更有参考价值。' },
            { key: 'c', text: 'K线还没快收盘前，就应该先下结论。' },
          ],
        },
        explanation: {
          en: 'A close contains commitment. Mid-candle movement often creates false confidence.',
          zh: '收盘更能代表市场是否真的站稳。盘中波动很容易给你假信心。',
        },
      },
    ],
    copy: {
      en: {
        title: 'Candles Without Confusion',
        objective: 'Read open, high, low, close and wick rejection without overcomplicating it.',
        coreIdea: 'A candle tells you where price opened, stretched, failed, and finally closed. The wick and the close matter together.',
        whyItMatters: 'If you read one candle properly, you stop chasing colour and start understanding pressure and rejection.',
        example: 'When gold prints a long upper wick near resistance, buyers may have tried to push higher but failed to hold the level.',
        beginnerMistake: 'Assuming every green candle is bullish confirmation even when the close is weak or trapped under resistance.',
        riskNote: 'One candle alone is not enough. Always check where it formed.',
        exercise: 'Open Chart and compare one candle with a strong close versus one with a long wick and weak finish.',
        ctaCopy: 'Use the live chart and decide which candle shows real control and which one only looks dramatic.',
        focusTitle: 'Wick + close',
        focusBody: 'A candle tells a story. Read the rejection and the close together.',
      },
      zh: {
        title: '看懂 K 线，不要越看越乱',
        objective: '学会用开高低收和影线来理解K线，而不是只看颜色。',
        coreIdea: '一根K线会告诉你价格从哪里开、拉到哪里、被打回多少，最后收在哪里。影线和收盘都要一起看。',
        whyItMatters: '当你真正会读K线，就不会只追颜色，而会开始看多空力量和价格拒绝。',
        example: '如果金价在阻力位附近留下很长的上影线，说明买方有推高过，但最后没守住。',
        beginnerMistake: '看到阳线就当成确认上涨，却忽略它其实收得很弱，或者刚好压在阻力下方。',
        riskNote: '单看一根K线不够，先看它出现在什么位置。',
        exercise: '打开图表，比较一根强势收盘K线和一根长影线但收得不好的K线。',
        ctaCopy: '回到实时图表，判断哪一根K线是真的强，哪一根只是看起来很刺激。',
        focusTitle: '影线 + 收盘',
        focusBody: '别只看颜色，先看价格有没有被明显打回来。',
      },
    },
  },
  {
    id: 'trend-vs-range',
    order: 3,
    estimatedMinutes: 5,
    ctaTarget: 'chart',
    ctaLabel: { en: 'Open Chart', zh: '打开图表' },
    quiz: [
      {
        id: 'trend-1',
        correctAnswer: 'c',
        answers: {
          en: [
            { key: 'a', text: 'Every small pullback means the trend is over.' },
            { key: 'b', text: 'A range and a trend should be traded the same way.' },
            { key: 'c', text: 'Higher highs and higher lows usually suggest an uptrend.' },
          ],
          zh: [
            { key: 'a', text: '只要有小回调，趋势就结束了。' },
            { key: 'b', text: '震荡和趋势可以用同样方式做。' },
            { key: 'c', text: '高点越来越高、低点也越来越高，通常代表上升趋势。' },
          ],
        },
        explanation: {
          en: 'Structure matters more than emotion. A real trend usually keeps defending its pullbacks.',
          zh: '结构比情绪更重要。真正的趋势，回调后通常还能继续守住结构。',
        },
      },
      {
        id: 'trend-2',
        correctAnswer: 'a',
        answers: {
          en: [
            { key: 'a', text: 'If you are unsure whether price is trending or ranging, reduce confidence and wait.' },
            { key: 'b', text: 'When in doubt, force a breakout trade.' },
            { key: 'c', text: 'Direction does not matter if the signal badge looks strong.' },
          ],
          zh: [
            { key: 'a', text: '如果你分不清趋势还是震荡，就先降低信心，等更清楚。' },
            { key: 'b', text: '看不清时，反而更应该硬做突破。' },
            { key: 'c', text: '只要信号 badge 看起来强，方向不重要。' },
          ],
        },
        explanation: {
          en: 'Unclear structure is already useful information. Waiting is part of the edge.',
          zh: '看不清结构，本身就是信息。会等，才是优势的一部分。',
        },
      },
    ],
    copy: {
      en: {
        title: 'Trend vs Range',
        objective: 'Tell the difference between a directional move and a sideways market before planning entries.',
        coreIdea: 'A trend keeps building structure. A range keeps sending price back into the same zone.',
        whyItMatters: 'Most beginner mistakes come from using trend logic inside a range, or range logic inside a trend.',
        example: 'If gold keeps printing higher lows and reclaiming pullbacks, buying the dip makes more sense than fading every push.',
        beginnerMistake: 'Calling every pullback a reversal and jumping against the move too early.',
        riskNote: 'If structure is unclear, your trade idea is weaker even if one candle looks good.',
        exercise: 'Open Chart and decide whether the current move is trending, ranging, or not clear enough yet.',
        ctaCopy: 'Use the chart first. Decide the market condition before you look at the signal card.',
        focusTitle: 'Read structure first',
        focusBody: 'The setup quality changes when you know whether price is trending or ranging.',
      },
      zh: {
        title: '趋势还是震荡',
        objective: '在计划进场前，先分清市场是在走趋势还是在区间震荡。',
        coreIdea: '趋势会不断建立结构，震荡则会把价格反复拉回同一区域。',
        whyItMatters: '很多新手亏损，都是因为在震荡里用趋势做法，或在趋势里用震荡做法。',
        example: '如果金价一直抬高低点，回调后又能收回去，那顺势找买点通常比一路猜顶更合理。',
        beginnerMistake: '每次小回调都当成要反转，太早逆势进场。',
        riskNote: '如果结构还不清楚，就算有一根好看的K线，交易逻辑也还是偏弱。',
        exercise: '打开图表，判断当前价格是趋势、震荡，还是还不够清楚。',
        ctaCopy: '先看图表结构，再决定要不要相信眼前这个 signal。',
        focusTitle: '先认结构',
        focusBody: '你知道市场状态后，setup 的质量才会更清楚。',
      },
    },
  },
  {
    id: 'support-and-resistance',
    order: 4,
    estimatedMinutes: 4,
    ctaTarget: 'chart',
    ctaLabel: { en: 'Open Chart', zh: '打开图表' },
    quiz: [
      {
        id: 'sr-1',
        correctAnswer: 'b',
        answers: {
          en: [
            { key: 'a', text: 'Draw as many lines as possible to be safe.' },
            { key: 'b', text: 'Mark the nearest meaningful zones, not every tiny reaction.' },
            { key: 'c', text: 'Support and resistance do not matter on gold.' },
          ],
          zh: [
            { key: 'a', text: '线越多越安全。' },
            { key: 'b', text: '先标最近、最关键的区域，不要把每个小反应都画出来。' },
            { key: 'c', text: '黄金根本不看支撑阻力。' },
          ],
        },
        explanation: {
          en: 'Good levels simplify the chart. Bad levels make every part of the chart look important.',
          zh: '好的水平位会让图更清楚，不好的画法会让整张图看起来哪里都重要。',
        },
      },
      {
        id: 'sr-2',
        correctAnswer: 'a',
        answers: {
          en: [
            { key: 'a', text: 'A clean level can still fail when news or momentum is strong.' },
            { key: 'b', text: 'A level always holds once it is drawn.' },
            { key: 'c', text: 'Levels matter only after you enter.' },
          ],
          zh: [
            { key: 'a', text: '再干净的水平位，碰到强新闻或强动能也可能失效。' },
            { key: 'b', text: '只要画出来，水平位一定会守住。' },
            { key: 'c', text: '水平位只有进场后才重要。' },
          ],
        },
        explanation: {
          en: 'Levels are areas of interest, not guarantees. Context still decides the reaction quality.',
          zh: '水平位是重点区域，不是保证。最后还是要看当下背景和动能。',
        },
      },
    ],
    copy: {
      en: {
        title: 'Support and Resistance',
        objective: 'Mark the nearest useful zones so you do not enter straight into trouble.',
        coreIdea: 'Support and resistance are areas where price previously reacted with enough force to matter again.',
        whyItMatters: 'A good level helps you plan entry, stop, and target with more structure and less guesswork.',
        example: 'If gold rejects the same zone near a prior high several times, that area can act like resistance until buyers prove otherwise.',
        beginnerMistake: 'Drawing too many lines until every price level starts looking important.',
        riskNote: 'Levels are zones, not exact magic numbers.',
        exercise: 'Open Chart and mark the closest support and resistance that would affect the next setup.',
        ctaCopy: 'Use the chart and check whether price is near a wall, not just whether the signal looks attractive.',
        focusTitle: 'Mark the key zone',
        focusBody: 'Keep only the levels that can still affect the next decision.',
      },
      zh: {
        title: '支撑与阻力',
        objective: '学会先标出最近、最有用的区域，避免直接撞进风险位。',
        coreIdea: '支撑和阻力，是价格曾经明显反应过、未来仍可能再起作用的区域。',
        whyItMatters: '关键位置看清后，进场、止损、止盈都会更有结构，不再只是猜。',
        example: '如果金价在前高附近多次被打下来，这个区域在买方重新站稳前，都可能继续充当阻力。',
        beginnerMistake: '画太多线，结果每个价位看起来都很重要。',
        riskNote: '水平位是区域，不是神奇到分毫不差的数字。',
        exercise: '打开图表，标出最靠近当前价格、最可能影响下一笔 setup 的支撑和阻力。',
        ctaCopy: '回到图表，先确认前面有没有墙，再看这个 signal 是否还值得做。',
        focusTitle: '先画关键区',
        focusBody: '别把图表画满，保留会影响下一步决定的水平位就好。',
      },
    },
  },
  {
    id: 'timeframes-that-work-together',
    order: 5,
    estimatedMinutes: 4,
    ctaTarget: 'chart',
    ctaLabel: { en: 'Open Chart', zh: '打开图表' },
    quiz: [
      {
        id: 'tf-1',
        correctAnswer: 'c',
        answers: {
          en: [
            { key: 'a', text: 'Use only one timeframe forever.' },
            { key: 'b', text: 'Lower timeframe noise is always more reliable.' },
            { key: 'c', text: 'Higher timeframe bias plus lower timeframe execution is usually clearer.' },
          ],
          zh: [
            { key: 'a', text: '只看一个 timeframe 就够一辈子。' },
            { key: 'b', text: '越小 timeframe 越可靠。' },
            { key: 'c', text: '高 timeframe 定方向，低 timeframe 找执行，通常更清楚。' },
          ],
        },
        explanation: {
          en: 'Bias and execution are different jobs. Separate them and the chart becomes easier to read.',
          zh: '方向判断和执行进场是两回事。把它们分开，图表会更容易看懂。',
        },
      },
      {
        id: 'tf-2',
        correctAnswer: 'a',
        answers: {
          en: [
            { key: 'a', text: 'If H1 and M5 completely disagree, you should slow down and reassess.' },
            { key: 'b', text: 'Conflicting timeframes mean stronger conviction.' },
            { key: 'c', text: 'Timeframe conflict does not matter if a signal is active.' },
          ],
          zh: [
            { key: 'a', text: '如果 H1 和 M5 完全相反，就应该先放慢，再重新判断。' },
            { key: 'b', text: 'timeframe 冲突代表更强信心。' },
            { key: 'c', text: '只要 signal 亮了，timeframe 冲突也不用管。' },
          ],
        },
        explanation: {
          en: 'Timeframe conflict often means you are mixing different stories into one trade idea.',
          zh: 'timeframe 打架，通常代表你把不同层级的故事硬塞成一笔交易。',
        },
      },
    ],
    copy: {
      en: {
        title: 'Timeframes That Work Together',
        objective: 'Use higher timeframe bias and lower timeframe execution without mixing them up.',
        coreIdea: 'The higher timeframe tells you the broad map. The lower timeframe tells you where the entry becomes cleaner or messier.',
        whyItMatters: 'Many bad trades come from treating short-term noise as if it outranks the larger structure.',
        example: 'If H1 is still bullish but M5 pulls back into support, you may get a cleaner long than if you fade the whole move.',
        beginnerMistake: 'Switching timeframes every few seconds until one of them agrees with the trade you already want.',
        riskNote: 'More timeframes do not always mean more clarity. Use only what helps the decision.',
        exercise: 'Open Chart and compare H1 bias with M15 or M5 structure before choosing a direction.',
        ctaCopy: 'Use the timeframe buttons and decide whether the short-term move still fits the bigger map.',
        focusTitle: 'Bias first, entry second',
        focusBody: 'Use the bigger map for direction and the smaller map for timing.',
      },
      zh: {
        title: '让 timeframe 彼此配合',
        objective: '学会用高 timeframe 定方向，再用低 timeframe 找更干净的执行点。',
        coreIdea: '高 timeframe 给你大地图，低 timeframe 告诉你进场是变清楚了，还是变乱了。',
        whyItMatters: '很多烂交易，都是把短线噪音当成比大结构更重要。',
        example: '如果 H1 还是偏多，而 M5 回踩到支撑附近，你顺势找多通常会比一路猜顶更合理。',
        beginnerMistake: '不停切 timeframe，只为了找到一个同意你原本想法的画面。',
        riskNote: '看的 timeframe 越多，不一定越清楚。只留真正有帮助的。',
        exercise: '打开图表，对比 H1 的方向和 M15 / M5 的结构，再决定偏向哪一边。',
        ctaCopy: '用 timeframe 按钮先看大方向，再看短线动作有没有配合。',
        focusTitle: '先定方向，再找节奏',
        focusBody: '高 timeframe 定大局，低 timeframe 才负责执行。',
      },
    },
  },
  {
    id: 'indicators-as-helpers',
    order: 6,
    estimatedMinutes: 4,
    ctaTarget: 'signal',
    ctaLabel: { en: 'Open Signal', zh: '打开信号' },
    quiz: [
      {
        id: 'ind-1',
        correctAnswer: 'b',
        answers: {
          en: [
            { key: 'a', text: 'One indicator cross is enough to ignore everything else.' },
            { key: 'b', text: 'Indicators should support price context, not replace it.' },
            { key: 'c', text: 'More indicators always means a better setup.' },
          ],
          zh: [
            { key: 'a', text: '只要一个指标交叉出现，就可以忽略其他东西。' },
            { key: 'b', text: '指标应该辅助价格背景，而不是取代它。' },
            { key: 'c', text: '指标越多，setup 一定越好。' },
          ],
        },
        explanation: {
          en: 'Indicators help you organise information. They do not remove the need to read structure and risk.',
          zh: '指标是帮你整理信息，不是帮你省掉结构判断和风险判断。',
        },
      },
      {
        id: 'ind-2',
        correctAnswer: 'a',
        answers: {
          en: [
            { key: 'a', text: 'ATR can help you judge whether a stop is unrealistically tight for gold.' },
            { key: 'b', text: 'ATR tells you the exact future direction.' },
            { key: 'c', text: 'ADX means buy whenever it rises.' },
          ],
          zh: [
            { key: 'a', text: 'ATR 可以帮你判断止损对黄金来说会不会太近。' },
            { key: 'b', text: 'ATR 可以直接告诉你未来方向。' },
            { key: 'c', text: 'ADX 只要往上就代表一定要买。' },
          ],
        },
        explanation: {
          en: 'ATR measures movement size, which helps with stop logic and volatility expectations.',
          zh: 'ATR 反映波动大小，所以更适合辅助止损和波动判断。',
        },
      },
    ],
    copy: {
      en: {
        title: 'Indicators as Helpers',
        objective: 'Use indicators as supporting tools instead of turning them into a shortcut for thinking.',
        coreIdea: 'EMA, RSI, ATR, and ADX can help you confirm structure, momentum, and volatility, but they cannot replace context.',
        whyItMatters: 'If you let indicators do all the thinking, you become late, reactive, and easily trapped.',
        example: 'A bullish EMA structure matters more when price is also holding above support, not when it is buying straight into resistance.',
        beginnerMistake: 'Stacking more indicators whenever confidence is low, which usually creates more noise, not more clarity.',
        riskNote: 'A neat indicator reading can still fail if the price location is bad.',
        exercise: 'Open Signal and ask whether the indicator conditions support the chart story or only look nice on their own.',
        ctaCopy: 'Use the Signal card to see which conditions are green, then check whether they match the chart context.',
        focusTitle: 'Indicators support, not lead',
        focusBody: 'Use indicators to confirm the story, not to invent one.',
      },
      zh: {
        title: '把指标当助手，不当老板',
        objective: '学会把指标当辅助工具，而不是当成替你思考的捷径。',
        coreIdea: 'EMA、RSI、ATR、ADX 可以帮助你看结构、动能和波动，但它们不能取代背景判断。',
        whyItMatters: '如果你把所有思考都交给指标，通常会变得更慢、更被动，也更容易被套。',
        example: 'EMA 多头排列当然有参考价值，但如果价格已经直接撞上阻力位，这个参考就会变弱。',
        beginnerMistake: '一没信心就加更多指标，结果不是更清楚，而是更吵。',
        riskNote: '指标读数再漂亮，如果价格位置不好，一样会失败。',
        exercise: '打开 Signal，先看条件是不是都变绿了，再问自己：它们有没有真的配合图表背景？',
        ctaCopy: '先看 Signal 条件，再回到图表确认这些条件是不是有背景支持。',
        focusTitle: '指标只能辅助',
        focusBody: '别让指标替你编故事，先让价格结构说话。',
      },
    },
  },
  {
    id: 'entry-tp-and-sl',
    order: 7,
    estimatedMinutes: 5,
    ctaTarget: 'signal',
    ctaLabel: { en: 'Open Signal', zh: '打开信号' },
    quiz: [
      {
        id: 'risk-1',
        correctAnswer: 'c',
        answers: {
          en: [
            { key: 'a', text: 'Place stop loss anywhere as long as the lot size is small.' },
            { key: 'b', text: 'Take profit is enough; invalidation is optional.' },
            { key: 'c', text: 'A good trade plan knows where the idea is wrong, not only where profit is hoped for.' },
          ],
          zh: [
            { key: 'a', text: '止损随便放，只要手数够小就行。' },
            { key: 'b', text: '只要有止盈，交易逻辑错不重要。' },
            { key: 'c', text: '好的交易计划会先知道哪里错，不只是希望赚到哪里。' },
          ],
        },
        explanation: {
          en: 'Risk starts with invalidation. If you do not know where the idea breaks, the rest of the plan is weak.',
          zh: '风险管理先从失效点开始。如果你不知道哪里算错，后面的计划就很弱。',
        },
      },
      {
        id: 'risk-2',
        correctAnswer: 'b',
        answers: {
          en: [
            { key: 'a', text: 'If stop distance is tiny, the trade is always better.' },
            { key: 'b', text: 'Gold often needs breathing room, so unrealistically tight stops can be poor risk control.' },
            { key: 'c', text: 'TP1, TP2, and TP3 are only decoration.' },
          ],
          zh: [
            { key: 'a', text: '止损越小，交易一定越好。' },
            { key: 'b', text: '黄金常需要一点呼吸空间，止损太贴反而不是好风控。' },
            { key: 'c', text: 'TP1、TP2、TP3 只是摆设。' },
          ],
        },
        explanation: {
          en: 'Tight risk is not the same as smart risk. The stop still has to fit the market.',
          zh: '止损小不等于风控好，关键是这个止损要符合市场波动。',
        },
      },
    ],
    copy: {
      en: {
        title: 'Entry, TP, and SL',
        objective: 'Understand how entry, take profit, and stop loss work together as one trade plan.',
        coreIdea: 'Entry gets you in. Stop loss protects your idea when it is wrong. Targets define how the trade pays when it works.',
        whyItMatters: 'Without clear invalidation, even a nice-looking signal becomes guesswork.',
        example: 'If gold is buying from support, the stop should usually sit beyond the structure that would prove the bounce failed.',
        beginnerMistake: 'Using a very tight stop only because the loss looks smaller on paper.',
        riskNote: 'A smaller stop is only good if it still respects market structure and volatility.',
        exercise: 'Open Signal and ask whether the current stop placement makes structural sense, not just mathematical sense.',
        ctaCopy: 'Use the live signal card to study where the setup becomes invalid and whether the targets are realistic.',
        focusTitle: 'Know where you are wrong',
        focusBody: 'Good risk control begins with invalidation, not with hope.',
      },
      zh: {
        title: '进场、止盈、止损怎么配合',
        objective: '理解进场、止盈和止损，如何一起组成完整的交易计划。',
        coreIdea: 'Entry 负责让你进场，Stop Loss 负责在想法错时保护你，Targets 负责定义做对时怎么拿利润。',
        whyItMatters: '如果没有明确失效点，再漂亮的 signal 也只是猜。',
        example: '如果金价是在支撑位反弹做多，止损通常应该放在那个结构真正失守之后，而不是随便贴近一点。',
        beginnerMistake: '只因为纸面亏损看起来小，就把止损放得太紧。',
        riskNote: '止损更小不一定更好，前提是它仍然尊重结构和波动。',
        exercise: '打开 Signal，先问自己当前止损位置是不是符合结构，而不只是看起来数字更漂亮。',
        ctaCopy: '用实时 signal 卡片练习看失效点，而不只是看目标位。',
        focusTitle: '先知道哪里错',
        focusBody: '风控不是先想赚多少，而是先知道哪里证明你错了。',
      },
    },
  },
  {
    id: 'news-risk-and-no-trade-zones',
    order: 8,
    estimatedMinutes: 4,
    ctaTarget: 'calendar',
    ctaLabel: { en: 'Open Calendar', zh: '打开日历' },
    quiz: [
      {
        id: 'news-1',
        correctAnswer: 'a',
        answers: {
          en: [
            { key: 'a', text: 'A no-trade decision can be the correct decision near major news.' },
            { key: 'b', text: 'You should always trade because volatility means opportunity.' },
            { key: 'c', text: 'Major news matters only for stocks, not gold.' },
          ],
          zh: [
            { key: 'a', text: '重大新闻附近，选择不交易也可能是正确决定。' },
            { key: 'b', text: '波动大就一定要做，不然浪费机会。' },
            { key: 'c', text: '重磅新闻只影响股票，不影响黄金。' },
          ],
        },
        explanation: {
          en: 'Discipline is not only about entering. Sometimes the edge is in avoiding unstable conditions.',
          zh: '纪律不只是敢不敢进场，有时真正的优势是避开不稳定时段。',
        },
      },
      {
        id: 'news-2',
        correctAnswer: 'c',
        answers: {
          en: [
            { key: 'a', text: 'Ignore event timing if your indicator alignment looks strong.' },
            { key: 'b', text: 'News matters only after you are already in the trade.' },
            { key: 'c', text: 'Calendar timing changes how much you should trust a setup.' },
          ],
          zh: [
            { key: 'a', text: '只要指标齐了，就不用管事件时间。' },
            { key: 'b', text: '新闻只有进场后才重要。' },
            { key: 'c', text: '事件时间会直接改变你该不该相信一个 setup。' },
          ],
        },
        explanation: {
          en: 'A setup does not exist in isolation. Timing changes execution quality.',
          zh: '一个 setup 不是独立存在的，时间点会直接改变执行质量。',
        },
      },
    ],
    copy: {
      en: {
        title: 'News Risk and No-Trade Zones',
        objective: 'Recognise when calendar risk changes the quality of an otherwise decent setup.',
        coreIdea: 'High-impact events can distort spreads, speed, and direction fast enough to break normal technical logic.',
        whyItMatters: 'A setup can be technically fine but operationally poor because the timing is wrong.',
        example: 'A clean breakout five minutes before FOMC is very different from the same breakout on a quiet session.',
        beginnerMistake: 'Forcing a trade because the chart looks clean while ignoring the calendar.',
        riskNote: 'Near major events, staying flat is often smarter than proving you are brave.',
        exercise: 'Open Calendar and decide whether the next event creates a trade zone or a wait zone.',
        ctaCopy: 'Use the event list and ask whether the next setup should be traded, reduced, or skipped.',
        focusTitle: 'No-trade is still a decision',
        focusBody: 'Protecting capital near major news is part of the edge.',
      },
      zh: {
        title: '新闻风险与不交易区',
        objective: '学会判断什么时候日历风险会让原本还不错的 setup 变差。',
        coreIdea: '高影响事件会突然改变点差、速度和方向，快到足以打坏原本正常的技术逻辑。',
        whyItMatters: '一个 setup 可能技术上没问题，但时间点不对，执行质量就会很差。',
        example: 'FOMC 前 5 分钟的漂亮突破，和安静时段的同样突破，质量完全不是一回事。',
        beginnerMistake: '图表看起来干净，就硬做，不去看经济日历。',
        riskNote: '重大事件附近，空手等待往往比硬证明自己敢做更聪明。',
        exercise: '打开日历，判断下一个事件会形成可交易区，还是该等待的区域。',
        ctaCopy: '看完事件列表后，再决定这个 setup 是该做、缩小，还是直接跳过。',
        focusTitle: '不做也是决定',
        focusBody: '重大新闻前先保护资金，本身就是优势的一部分。',
      },
    },
  },
  {
    id: 'review-stats-and-improvement',
    order: 9,
    estimatedMinutes: 4,
    ctaTarget: 'stats',
    ctaLabel: { en: 'Open Stats', zh: '打开统计' },
    quiz: [
      {
        id: 'review-1',
        correctAnswer: 'b',
        answers: {
          en: [
            { key: 'a', text: 'Win rate alone tells the whole story.' },
            { key: 'b', text: 'Review should include how and why trades won or lost, not just the final count.' },
            { key: 'c', text: 'Once a trade closes, there is nothing useful to learn from it.' },
          ],
          zh: [
            { key: 'a', text: '只看胜率就能知道全部。' },
            { key: 'b', text: '复盘要看为什么赢、为什么输，不只是看数量。' },
            { key: 'c', text: '交易结束后，就没有什么值得学的了。' },
          ],
        },
        explanation: {
          en: 'Numbers matter, but behaviour matters too. Review should improve future decisions.',
          zh: '数字重要，但行为也重要。复盘的目的，是让下一次决定更好。',
        },
      },
      {
        id: 'review-2',
        correctAnswer: 'a',
        answers: {
          en: [
            { key: 'a', text: 'History and stats help you spot repeated mistakes before they become habits.' },
            { key: 'b', text: 'Review is only useful for advanced traders.' },
            { key: 'c', text: 'Losing trades should be ignored to protect confidence.' },
          ],
          zh: [
            { key: 'a', text: '历史和统计能帮你更早发现重复错误，别让它变成习惯。' },
            { key: 'b', text: '只有高手才需要复盘。' },
            { key: 'c', text: '亏损单最好不要看，免得影响信心。' },
          ],
        },
        explanation: {
          en: 'Review is what turns random experience into usable improvement.',
          zh: '复盘就是把零散经验，变成真正能用的进步。',
        },
      },
    ],
    copy: {
      en: {
        title: 'Review, Stats, and Improvement',
        objective: 'Use history and stats to learn from outcomes instead of reacting emotionally to them.',
        coreIdea: 'A good review asks what the setup looked like, what the context was, and whether the decision was still sound.',
        whyItMatters: 'Without review, the same mistake can repeat for months while the trader keeps blaming the market.',
        example: 'A losing trade taken directly into high-impact news tells a different story from a losing trade taken from a clean level in a calm session.',
        beginnerMistake: 'Looking only at win rate and ignoring whether the entries themselves were disciplined.',
        riskNote: 'A win can still be a bad trade, and a loss can still come from a correct process.',
        exercise: 'Open History or Stats and identify one pattern you should repeat and one mistake you should stop.',
        ctaCopy: 'Use History and Stats together to judge process quality, not only emotional outcome.',
        focusTitle: 'Review the process',
        focusBody: 'The goal is not to feel good. The goal is to get sharper.',
      },
      zh: {
        title: '复盘、统计与进步',
        objective: '学会用历史和统计来复盘，而不是只对结果产生情绪反应。',
        coreIdea: '好的复盘会看 setup 当时长什么样、背景如何，以及那个决定本身是否合理。',
        whyItMatters: '不复盘，同样的错误可以重复好几个月，最后只会怪市场。',
        example: '一笔亏损，如果是直接冲进高影响新闻，和另一笔在平静时段、关键位附近的亏损，故事完全不同。',
        beginnerMistake: '只盯胜率，不去看进场过程到底有没有纪律。',
        riskNote: '赢单也可能是坏交易，亏单也可能来自正确流程。',
        exercise: '打开 History 或 Stats，找出一个你应该重复的好习惯，以及一个必须停止的错误。',
        ctaCopy: '把 History 和 Stats 一起看，判断的是流程质量，不只是输赢情绪。',
        focusTitle: '复盘的是流程',
        focusBody: '目标不是让自己好受，而是让下一次更清楚。',
      },
    },
  },
];

let googleTranslateLoader = null;
const animatedValueState = new Map();
let polymarketListScrollTop = 0;

function getSelectedSignalLane() {
  return String(localStorage.getItem(SIGNAL_LANE_KEY) || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
}

function getExpandedSignalLanes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SIGNAL_EXPANDED_KEY) || '{}');
    return {
      intraday: Boolean(parsed?.intraday),
      swing: Boolean(parsed?.swing),
    };
  } catch {
    return { intraday: false, swing: false };
  }
}

function isSignalLaneExpanded(lane) {
  const normalized = String(lane || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
  return Boolean(getExpandedSignalLanes()[normalized]);
}

function setSignalLaneExpanded(lane, expanded, emit = true) {
  const normalized = String(lane || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
  const next = {
    ...getExpandedSignalLanes(),
    [normalized]: Boolean(expanded),
  };
  localStorage.setItem(SIGNAL_EXPANDED_KEY, JSON.stringify(next));
  if (emit && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xauradar:signal-lane-expand', { detail: { lane: normalized, expanded: Boolean(expanded) } }));
  }
  return next[normalized];
}

function toggleSignalLaneExpanded(lane, emit = true) {
  const next = !isSignalLaneExpanded(lane);
  return setSignalLaneExpanded(lane, next, emit);
}

function setSelectedSignalLane(lane, emit = true) {
  const normalized = String(lane || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
  localStorage.setItem(SIGNAL_LANE_KEY, normalized);
  if (emit && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xauradar:signal-lane-change', { detail: { lane: normalized } }));
  }
  return normalized;
}

function pulseAnimatedElement(el, direction = 'neutral') {
  if (!el) return;
  el.classList.remove('value-refresh', 'value-refresh--up', 'value-refresh--down', 'value-refresh--neutral');
  void el.offsetWidth;
  el.classList.add('value-refresh', `value-refresh--${direction}`);
}

function setAnimatedContent(el, key, displayValue, options = {}) {
  if (!el) return;
  const { html = false, numericValue = NaN } = options;
  const normalizedDisplay = String(displayValue ?? '');
  const nextNumeric = Number.isFinite(numericValue) ? Number(numericValue) : NaN;
  const previous = animatedValueState.get(key);
  const changed = !previous || previous.display !== normalizedDisplay;

  if (html) {
    el.innerHTML = normalizedDisplay;
  } else {
    el.textContent = normalizedDisplay;
  }

  if (changed && previous) {
    let direction = 'neutral';
    if (Number.isFinite(previous.numeric) && Number.isFinite(nextNumeric)) {
      if (nextNumeric > previous.numeric) direction = 'up';
      else if (nextNumeric < previous.numeric) direction = 'down';
    }
    pulseAnimatedElement(el, direction);
  }

  animatedValueState.set(key, { display: normalizedDisplay, numeric: nextNumeric });
}

function setAnimatedButtonCount(btn, key, label, count) {
  if (!btn) return;
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  const text = `${String(label || '').split(' (')[0]} (${safeCount})`;
  const previous = animatedValueState.get(key);
  btn.textContent = text;
  if (previous && previous.numeric !== safeCount) {
    const direction = safeCount > previous.numeric ? 'up' : safeCount < previous.numeric ? 'down' : 'neutral';
    pulseAnimatedElement(btn, direction);
  }
  animatedValueState.set(key, { display: text, numeric: safeCount });
}

function buildAnimatedInlineMarkup(key, displayValue, numericValue, tagName = 'span', className = '', inlineStyle = '') {
  const safeTag = String(tagName || 'span').toLowerCase();
  const attrs = [
    className ? `class="${escapeHtml(className)}"` : '',
    `data-animate-key="${escapeHtml(key)}"`,
    `data-animate-value="${escapeHtml(String(numericValue))}"`,
    inlineStyle ? `style="${escapeHtml(inlineStyle)}"` : '',
  ].filter(Boolean).join(' ');
  return `<${safeTag} ${attrs}>${escapeHtml(String(displayValue))}</${safeTag}>`;
}

function applyAnimatedValues(root) {
  if (!root) return;
  root.querySelectorAll('[data-animate-key]').forEach((el) => {
    const key = String(el.getAttribute('data-animate-key') || '').trim();
    if (!key) return;
    const numericValue = Number(el.getAttribute('data-animate-value'));
    const displayValue = el.textContent || '';
    setAnimatedContent(el, key, displayValue, { numericValue });
  });
}

function getSelectedPolymarketMarketSlug() {
  return String(polymarketState.selectedMarketSlug || '').trim();
}

function setSelectedPolymarketMarketSlug(slug, emit = true) {
  const normalized = String(slug || '').trim();
  polymarketState.selectedMarketSlug = normalized;
  if (emit && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xauradar:polymarket-market-change', { detail: { slug: normalized || null } }));
  }
  return normalized;
}

function setPolymarketMarketHistory(slug, rows = []) {
  const key = String(slug || '').trim();
  if (!key) return;
  polymarketState.historyBySlug[key] = Array.isArray(rows) ? rows.slice() : [];
}

function isPhoneDetailMode() {
  return Boolean(window.matchMedia && window.matchMedia('(max-width: 767px)').matches);
}

function rememberPolymarketListScroll() {
  const listPage = document.getElementById('page-polymarket');
  if (!listPage) return;
  polymarketListScrollTop = Math.max(0, Number(listPage.scrollTop) || 0);
}

function restorePolymarketListScroll() {
  const listPage = document.getElementById('page-polymarket');
  if (!listPage) return;
  const nextTop = Math.max(0, Number(polymarketListScrollTop) || 0);
  window.requestAnimationFrame(() => {
    listPage.scrollTop = nextTop;
  });
}

function openPolymarketDetail(slug) {
  const normalized = setSelectedPolymarketMarketSlug(slug);
  if (!normalized) return;
  if (isPhoneDetailMode()) {
    rememberPolymarketListScroll();
    setActivePage('polymarket-detail', { force: true });
  }
  renderPolymarketDashboard();
}

function closePolymarketDetail(options = {}) {
  const restoreScroll = options.restoreScroll !== false;
  const hadSelection = Boolean(getSelectedPolymarketMarketSlug());
  setSelectedPolymarketMarketSlug('', false);

  const detailBackdrop = document.getElementById('polymarket-detail-backdrop');
  const detailSheet = document.getElementById('polymarket-detail-sheet');
  if (detailBackdrop) detailBackdrop.hidden = true;
  if (detailSheet) {
    detailSheet.hidden = true;
    detailSheet.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('poly-detail-open', 'poly-mobile-detail-open');

  const detailPageActive = document.getElementById('page-polymarket-detail')?.classList.contains('active');
  if (isPhoneDetailMode() || detailPageActive) {
    setActivePage('polymarket', { force: true });
    if (restoreScroll) restorePolymarketListScroll();
  }

  if (hadSelection || detailPageActive) {
    renderPolymarketDashboard();
  }
}

function toXauPips(priceDelta) {
  const delta = Number(priceDelta);
  if (!Number.isFinite(delta)) return NaN;
  const pipSize = Number.isFinite(XAU_PIP_SIZE) && XAU_PIP_SIZE > 0 ? XAU_PIP_SIZE : 0.1;
  return delta / pipSize;
}

const MY_FULL_TIME_FMT = new Intl.DateTimeFormat('en-MY', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const MY_SHORT_TIME_FMT = new Intl.DateTimeFormat('en-MY', {
  timeZone: APP_TIMEZONE,
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatMalaysiaTime(value, useShort = false) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const fmt = useShort ? MY_SHORT_TIME_FMT : MY_FULL_TIME_FMT;
  return `${fmt.format(date)} ${APP_TZ_LABEL}`;
}

function formatTimeAgo(value) {
  if (!value) return '--';
  const date = value instanceof Date ? value : new Date(value);
  const ts = date.getTime();
  if (!Number.isFinite(ts)) return '--';

  const deltaMs = Date.now() - ts;
  const isFuture = deltaMs < 0;
  const absMs = Math.abs(deltaMs);

  if (absMs < 45000) {
    return isFuture ? 'soon' : 'just now';
  }

  const minutes = Math.round(absMs / 60000);
  if (minutes < 60) {
    return `${minutes}m ${isFuture ? 'from now' : 'ago'}`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ${isFuture ? 'from now' : 'ago'}`;
  }

  const days = Math.round(hours / 24);
  return `${days}d ${isFuture ? 'from now' : 'ago'}`;
}

function getTimePartsInTimezone(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  const clock = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return { hour, minute, clock };
}

function setTheme(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.textContent = theme === 'light' ? 'Light' : 'Dark';
    toggle.setAttribute('aria-label', `Theme: ${theme}`);
  }

  if (window.Chart && window.Chart.isInitialized && window.Chart.isInitialized() && window.Chart.applyTheme) {
    window.Chart.applyTheme(theme);
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = saved || (prefersLight ? 'light' : 'dark');
  setTheme(initial);

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      setTheme(next);
    });
  }
}

function setActivePage(target, opts = {}) {
  const force = Boolean(opts.force);
  const isPolymarketPage = target === 'polymarket' || target === 'polymarket-detail';
  if (activeDashboardMode === 'polymarket' && !isPolymarketPage && !force) {
    target = 'polymarket';
  }
  if (!isPolymarketPage) {
    lastXauPage = target;
  }

  const pages = document.querySelectorAll('.page');
  pages.forEach((p) => p.classList.remove('active'));
  const page = document.getElementById(`page-${target}`);
  if (page) page.classList.add('active');

  document.querySelectorAll('.nav-item').forEach((node) => {
    const nodePage = String(node.dataset.page || '');
    const isMoreProxy = nodePage === 'more' && MORE_PAGE_TARGETS.has(target);
    const isActive = nodePage === target || isMoreProxy;
    node.classList.toggle('active', isActive);
  });

  if (target === 'chart' && window.Chart && !window.Chart.isInitialized()) {
    window.Chart.init();
  }
  if (target === 'learn') {
    if (page && typeof page.scrollTo === 'function') {
      page.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (window.UI && typeof window.UI.renderLearnPage === 'function') {
      window.UI.renderLearnPage();
    } else {
      renderLearnPage();
    }
  }
  window.dispatchEvent(new CustomEvent('xauradar:page-change', { detail: { page: target } }));
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => setActivePage(item.dataset.page));
  });
  document.querySelectorAll('.learn-nav-link').forEach((item) => {
    if (item.dataset.bound === '1') return;
    item.dataset.bound = '1';
    item.addEventListener('click', () => setActivePage(item.dataset.targetPage || 'signal'));
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCompactUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  if (Math.abs(n) >= 1000000000) return `$${(n / 1000000000).toFixed(2)}B`;
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function getHoursUntil(value) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return null;
  return (ts - Date.now()) / 3600000;
}

function toMillisUi(value) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function buildPolymarketFreshnessSummary(feedStatus = {}) {
  const mode = String(feedStatus?.sourceMode || 'idle').toLowerCase();
  const sourceLabel = String(feedStatus?.sourceLabel || '').trim();
  const fetchedAt = feedStatus?.fetchedAt || null;
  const error = String(feedStatus?.error || '').trim();

  if (mode === 'live') {
    return fetchedAt
      ? `${sourceLabel || 'Live Gamma'} updated ${formatTimeAgo(fetchedAt)}`
      : (sourceLabel || 'Live Gamma active');
  }

  if (mode === 'fallback') {
    return `${sourceLabel || 'Supabase cache fallback'} ${fetchedAt ? formatTimeAgo(fetchedAt) : 'recently'}`;
  }

  if (mode === 'stale') {
    return `${sourceLabel || 'Holding last live values'} ${fetchedAt ? `from ${formatTimeAgo(fetchedAt)}` : ''}`.trim();
  }

  if (mode === 'error') {
    return error ? `Live feed error: ${error}` : 'Live feed unavailable';
  }

  return sourceLabel || 'Waiting for live feed';
}

function renderPolymarketRenderFailure(error, context = 'render') {
  const message = String(error?.message || error || 'Unknown render error').trim() || 'Unknown render error';
  console.error(`Polymarket ${context} error:`, error);

  const diagnosticsEl = document.getElementById('polymarket-diagnostics');
  const featuredEl = document.getElementById('polymarket-featured-market');
  const listEl = document.getElementById('polymarket-markets-list');
  const breakingEl = document.getElementById('polymarket-breaking-list');
  const hotTopicsEl = document.getElementById('polymarket-hot-topics');
  const spotlightEl = document.getElementById('polymarket-spotlight-strip');
  const detailBackdrop = document.getElementById('polymarket-detail-backdrop');
  const detailSheet = document.getElementById('polymarket-detail-sheet');
  const detailTitleEl = document.getElementById('polymarket-detail-title');
  const detailBodyEl = document.getElementById('polymarket-detail-body');
  const detailPageTitleEl = document.getElementById('polymarket-detail-page-title');
  const detailPageBodyEl = document.getElementById('polymarket-detail-page-body');

  if (diagnosticsEl) {
    diagnosticsEl.textContent = `Polymarket render issue (${context}): ${message}`;
  }

  const fallbackMarkup = `
    <div class="empty-state">
      <div class="empty-state__title">Polymarket refresh hit a render issue</div>
      <div class="empty-state__sub">The dashboard will retry automatically. Latest error: ${escapeHtml(message)}</div>
    </div>
  `;

  if (featuredEl) featuredEl.innerHTML = fallbackMarkup;
  if (listEl) listEl.innerHTML = fallbackMarkup;
  if (breakingEl) breakingEl.innerHTML = '<div class="feature-note">Breaking markets are temporarily unavailable while the page recovers.</div>';
  if (hotTopicsEl) hotTopicsEl.innerHTML = '<div class="feature-note">Topics will return after the next successful refresh.</div>';
  if (spotlightEl) spotlightEl.innerHTML = '<div class="feature-note">Spotlight markets will return after the next successful refresh.</div>';

  if (detailBackdrop) detailBackdrop.hidden = true;
  if (detailSheet) {
    detailSheet.hidden = true;
    detailSheet.setAttribute('aria-hidden', 'true');
  }
  if (detailTitleEl) detailTitleEl.textContent = 'Polymarket detail unavailable';
  if (detailBodyEl) {
    detailBodyEl.innerHTML = '<div class="feature-note">Details will reappear after the next successful market render.</div>';
  }
  if (detailPageTitleEl) detailPageTitleEl.textContent = 'Polymarket detail unavailable';
  if (detailPageBodyEl) {
    detailPageBodyEl.innerHTML = '<div class="feature-note">Details will reappear after the next successful market render.</div>';
  }
  document.body.classList.remove('poly-detail-open', 'poly-mobile-detail-open');
}

function updateDashboardTopbar(mode) {
  const assetLabel = document.getElementById('topbar-asset-label');
  const assetSub = document.getElementById('topbar-asset-sub');
  const modeBadge = document.getElementById('dashboard-mode-badge');
  const sourceBadge = document.getElementById('source-badge');
  const sessionPill = document.getElementById('session-pill');
  const status = document.getElementById('connection-status');

  if (assetLabel) assetLabel.textContent = mode === 'polymarket' ? 'Polymarket' : 'XAU/USD';
  if (assetSub) assetSub.textContent = mode === 'polymarket' ? 'Crypto + event probabilities' : 'Live market dashboard';

  if (modeBadge) {
    modeBadge.textContent = mode === 'polymarket' ? 'POLYMARKET' : 'XAU RADAR';
    modeBadge.className = `mode-badge ${mode === 'polymarket' ? 'mode-badge--polymarket' : 'mode-badge--xau'}`;
  }

  const hideXauMeta = mode === 'polymarket';
  if (sourceBadge) sourceBadge.style.display = hideXauMeta ? 'none' : '';
  if (sessionPill) sessionPill.style.display = hideXauMeta ? 'none' : '';
  if (status) status.style.display = hideXauMeta ? 'none' : '';
}

function closeDashboardSwitchMenu() {
  const btn = document.getElementById('dashboard-switch-btn');
  const menu = document.getElementById('dashboard-switch-menu');
  if (!btn || !menu) return;
  menu.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
}

function setDashboardMode(mode, opts = {}) {
  const persist = opts.persist !== false;
  activeDashboardMode = mode === 'polymarket' ? 'polymarket' : 'xau';

  const appShell = document.getElementById('app-shell');
  if (appShell) appShell.classList.toggle('app-shell--polymarket', activeDashboardMode === 'polymarket');

  if (persist) localStorage.setItem(DASHBOARD_MODE_KEY, activeDashboardMode);
  updateDashboardTopbar(activeDashboardMode);

  const optionNodes = document.querySelectorAll('.dashboard-switch-option');
  optionNodes.forEach((node) => {
    const isActive = node.dataset.mode === activeDashboardMode;
    node.classList.toggle('active', isActive);
    node.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  if (activeDashboardMode === 'polymarket') {
    setActivePage('polymarket', { force: true });
  } else {
    setActivePage(lastXauPage || 'signal', { force: true });
  }

  window.dispatchEvent(new CustomEvent('xauradar:dashboard-mode', { detail: { mode: activeDashboardMode } }));
}

function initDashboardSwitch() {
  const btn = document.getElementById('dashboard-switch-btn');
  const menu = document.getElementById('dashboard-switch-menu');
  if (!btn || !menu) return;
  menu.hidden = true;
  btn.setAttribute('aria-expanded', 'false');

  const saved = localStorage.getItem(DASHBOARD_MODE_KEY);
  setDashboardMode(saved === 'polymarket' ? 'polymarket' : 'xau', { persist: false });

  btn.addEventListener('click', (evt) => {
    evt.stopPropagation();
    const next = menu.hidden;
    menu.hidden = !next;
    btn.setAttribute('aria-expanded', next ? 'true' : 'false');
  });

  menu.querySelectorAll('.dashboard-switch-option').forEach((item) => {
    item.addEventListener('click', () => {
      setDashboardMode(item.dataset.mode || 'xau');
      closeDashboardSwitchMenu();
    });
  });

  document.addEventListener('click', (evt) => {
    if (menu.hidden) return;
    if (menu.contains(evt.target) || btn.contains(evt.target)) return;
    closeDashboardSwitchMenu();
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') closeDashboardSwitchMenu();
  });
}

function getDashboardMode() {
  return activeDashboardMode;
}

function normalizePolymarketCategory(rawCategory, titleText = '', meta = null) {
  const metaDisplay = String(meta?.display_category || meta?.displayCategory || '').trim().toLowerCase();
  if (POLY_CATEGORIES.includes(metaDisplay) && metaDisplay !== 'all') return metaDisplay;

  const value = String(rawCategory || '').trim().toLowerCase();
  if (POLY_CATEGORIES.includes(value) && value !== 'all') return value;

  const rawSource = String(meta?.raw_category || meta?.rawCategory || value || '').toLowerCase();
  const text = `${metaDisplay} ${rawSource} ${value} ${String(titleText || '').toLowerCase()}`;
  if (/(trending|trend)/.test(text)) return 'trending';
  if (/(breaking|urgent|headline|flash|developing)/.test(text)) return 'breaking';
  if (/(new|fresh|latest|launched|launch)/.test(text)) return 'new';
  if (/(xauusd|xau|spot gold|gold price|bullion|precious metal)/.test(text)) return 'xauusd';
  if (/(oil|wti|brent|crude|opec|energy)/.test(text)) return 'oil';
  if (/(bitcoin|btc|ethereum|eth|solana|sol|crypto|token|coin|doge|memecoin|altcoin|defi|stablecoin|nft)/.test(text)) return 'crypto';
  if (/(politics|election|president|senate|congress|minister|party|government|white house|parliament|trump|biden|campaign|vote|voting)/.test(text)) return 'politics';
  if (/(war|geopolitic|geopolitics|conflict|russia|ukraine|china|taiwan|israel|middle east|iran|sanction|ceasefire|military|nato|putin|xi jinping|gaza|hezbollah)/.test(text)) return 'geopolitics';
  if (/(fomc|fed|powell|rate|cpi|inflation|nfp|jobs|yield|treasury|tariff|economy|recession|gdp|finance|financial|stocks|nasdaq|s&p|dow|bond|dollar|usd|bitcoin|btc|ethereum|eth|solana|crypto|token|coin|doge|memecoin|altcoin|defi|etf)/.test(text)) return 'finance';
  return 'other';
}

function normalizePolymarketCategories(rawCategory, titleText = '', meta = null) {
  const visible = new Set();
  const fromMeta = Array.isArray(meta?.display_categories)
    ? meta.display_categories
    : Array.isArray(meta?.displayCategories)
      ? meta.displayCategories
      : [];

  fromMeta
    .map((value) => String(value || '').trim().toLowerCase())
    .filter((value) => POLY_CATEGORIES.includes(value) && value !== 'all')
    .forEach((value) => visible.add(value));

  const primary = normalizePolymarketCategory(rawCategory, titleText, meta);
  if (primary && primary !== 'other') {
    visible.add(primary);
  }

  const metaDisplay = String(meta?.display_category || meta?.displayCategory || '').trim().toLowerCase();
  const rawSource = String(meta?.raw_category || meta?.rawCategory || rawCategory || '').trim().toLowerCase();
  const text = `${metaDisplay} ${rawSource} ${String(titleText || '').toLowerCase()}`;

  if (/(breaking|urgent|headline|flash|developing|ceasefire|deal|meeting|summit|talks|diplomatic|sanction|attack|missile|war|conflict|tariff|fed|fomc|rate cut|rate hike|interest rate|election|vote|approval|ban|default|bankruptcy|merger|earnings)/.test(text)) {
    visible.add('breaking');
  }
  if (/(new|fresh|latest|launched|launch|recent)/.test(text)) {
    visible.add('new');
  }
  if (/(trending|trend|top volume|most active)/.test(text)) {
    visible.add('trending');
  }
  if (/(xauusd|xau|spot gold|gold price|bullion|precious metal)/.test(text)) {
    visible.add('xauusd');
  }
  if (/(oil|wti|brent|crude|opec|energy)/.test(text)) {
    visible.add('oil');
  }
  if (/(bitcoin|btc|ethereum|eth|solana|sol|crypto|token|coin|doge|memecoin|altcoin|defi|stablecoin|nft)/.test(text)) {
    visible.add('crypto');
  }
  if (/(politics|election|president|senate|congress|minister|party|government|white house|parliament|trump|biden|campaign|vote|voting)/.test(text)) {
    visible.add('politics');
  }
  if (/(war|geopolitic|geopolitics|conflict|russia|ukraine|china|taiwan|israel|middle east|iran|sanction|ceasefire|military|nato|putin|xi jinping|gaza|hezbollah)/.test(text)) {
    visible.add('geopolitics');
  }
  if (/(fomc|fed|powell|rate|cpi|inflation|nfp|jobs|yield|treasury|tariff|economy|recession|gdp|finance|financial|stocks|nasdaq|s&p|dow|bond|dollar|usd|etf)/.test(text)) {
    visible.add('finance');
  }

  return Array.from(visible);
}

function classifyBetType(titleText = '') {
  const t = String(titleText || '').toLowerCase();
  if (/(up or down|up\/down|\bup\b.*\bdown\b|\bdown\b.*\bup\b)/.test(t)) return 'up_down';
  if (/(above|below|over|under)/.test(t)) return 'above_below';
  if (/(range|between|from .* to|price band)/.test(t)) return 'price_range';
  if (/(hit|reach|touch)/.test(t)) return 'hit_price';
  return 'all';
}

function normalizePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  if (n >= 0 && n <= 1) return n * 100;
  return n;
}

function clamp01To100(value) {
  if (!Number.isFinite(value)) return NaN;
  return Math.max(0, Math.min(100, value));
}

function normalizePolymarketRow(row) {
  const title = String(row?.title || row?.question || 'Untitled market');
  const meta = row?.meta && typeof row.meta === 'object' ? row.meta : null;
  const category = normalizePolymarketCategory(row?.category, title, meta);
  const categories = normalizePolymarketCategories(row?.category, title, meta);
  const marketType = classifyBetType(title);
  const probability = clamp01To100(normalizePercent(row?.probability));

  let yesPct = clamp01To100(normalizePercent(row?.yes_price));
  let noPct = clamp01To100(normalizePercent(row?.no_price));
  if (!Number.isFinite(yesPct) && Number.isFinite(probability)) yesPct = probability;
  if (!Number.isFinite(noPct) && Number.isFinite(yesPct)) noPct = 100 - yesPct;
  if (!Number.isFinite(yesPct) && Number.isFinite(noPct)) yesPct = 100 - noPct;
  yesPct = clamp01To100(yesPct);
  noPct = clamp01To100(noPct);

  const volume = Number(row?.volume);
  const liquidity = Number(row?.liquidity);
  const status = String(row?.status || 'active').trim().toLowerCase();
  const endDate = row?.end_date || row?.end_at || row?.close_time || null;
  const hoursUntil = getHoursUntil(endDate);

  return {
    ...row,
    title,
    category: category === 'other' && categories[0] ? categories[0] : category,
    categories,
    rawCategory: String(meta?.raw_category || row?.category || 'other').trim().toLowerCase() || 'other',
    marketType,
    probability,
    yesPct,
    noPct,
    volume: Number.isFinite(volume) ? volume : NaN,
    liquidity: Number.isFinite(liquidity) ? liquidity : NaN,
    status,
    endDate,
    hoursUntil,
  };
}

function isPolymarketResolvedStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized.includes('resolved') || normalized.includes('closed') || normalized.includes('archived');
}

function isPolymarketActiveStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return true;
  if (isPolymarketResolvedStatus(normalized)) return false;
  return ['active', 'open', 'live'].includes(normalized) || !normalized.includes('inactive');
}

function filterPolymarketByView(markets, view) {
  const rows = Array.isArray(markets) ? markets.slice() : [];
  if (view === 'active') {
    return rows.filter((market) => isPolymarketActiveStatus(market.status));
  }
  if (view === 'ending') {
    return rows.filter((market) => isPolymarketActiveStatus(market.status)
      && Number.isFinite(market.hoursUntil)
      && market.hoursUntil >= 0
      && market.hoursUntil <= 72);
  }
  if (view === 'resolved') {
    return rows.filter((market) => isPolymarketResolvedStatus(market.status));
  }
  return rows;
}

function setPolymarketCategory(category, opts = {}) {
  const persist = opts.persist !== false;
  const next = POLY_CATEGORIES.includes(category) ? category : 'all';
  polymarketState.category = next;
  if (persist) localStorage.setItem(POLY_CATEGORY_KEY, next);
}

function setPolymarketSort(sortValue, opts = {}) {
  const persist = opts.persist !== false;
  const next = POLY_SORT_OPTIONS.includes(sortValue) ? sortValue : 'volume';
  polymarketState.sort = next;
  if (persist) localStorage.setItem(POLY_SORT_KEY, next);
}

function setPolymarketView(viewValue, opts = {}) {
  const persist = opts.persist !== false;
  const next = POLY_VIEW_OPTIONS.includes(viewValue) ? viewValue : 'all';
  polymarketState.view = next;
  if (persist) localStorage.setItem(POLY_VIEW_KEY, next);
}

function setPolymarketBetType(value, opts = {}) {
  const persist = opts.persist !== false;
  const next = POLY_BET_TYPE_OPTIONS.includes(value) ? value : 'all';
  polymarketState.betType = next;
  if (persist) localStorage.setItem(POLY_BET_TYPE_KEY, next);
}

function initPolymarketControls() {
  const tabs = Array.from(document.querySelectorAll('#polymarket-tabs .poly-tab'));
  const betTabs = Array.from(document.querySelectorAll('#polymarket-bet-tabs .poly-bet-tab'));
  const viewTabs = Array.from(document.querySelectorAll('#polymarket-view-nav .poly-view-tab'));
  const searchInput = document.getElementById('polymarket-search');
  const sortSelect = document.getElementById('polymarket-sort');
  const detailClose = document.getElementById('polymarket-detail-close');
  const detailBackdrop = document.getElementById('polymarket-detail-backdrop');
  const detailPageBack = document.getElementById('polymarket-detail-page-back');
  const detailPageClose = document.getElementById('polymarket-detail-page-close');

  const savedCategory = localStorage.getItem(POLY_CATEGORY_KEY);
  const savedSort = localStorage.getItem(POLY_SORT_KEY);
  const savedView = localStorage.getItem(POLY_VIEW_KEY);
  const savedBetType = localStorage.getItem(POLY_BET_TYPE_KEY);
  setPolymarketCategory(savedCategory || 'all', { persist: false });
  setPolymarketSort(savedSort || 'volume', { persist: false });
  setPolymarketView(savedView || 'all', { persist: false });
  setPolymarketBetType(betTabs.length ? (savedBetType || 'all') : 'all', { persist: false });

  if (sortSelect) sortSelect.value = polymarketState.sort;

  tabs.forEach((btn) => {
    if (!btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const category = String(btn.dataset.category || 'all').toLowerCase();
        setPolymarketCategory(category);
        renderPolymarketDashboard();
      });
    }
  });

  betTabs.forEach((btn) => {
    if (!btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const value = String(btn.dataset.betType || 'all').toLowerCase();
        setPolymarketBetType(value);
        renderPolymarketDashboard();
      });
    }
  });

  viewTabs.forEach((btn) => {
    if (!btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const view = String(btn.dataset.view || 'all').toLowerCase();
        setPolymarketView(view);
        renderPolymarketDashboard();
      });
    }
  });

  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = '1';
    searchInput.addEventListener('input', () => {
      polymarketState.query = String(searchInput.value || '').trim().toLowerCase();
      renderPolymarketDashboard();
    });
  }

  if (sortSelect && !sortSelect.dataset.bound) {
    sortSelect.dataset.bound = '1';
    sortSelect.addEventListener('change', () => {
      setPolymarketSort(sortSelect.value);
      renderPolymarketDashboard();
    });
  }

  if (detailClose && !detailClose.dataset.bound) {
    detailClose.dataset.bound = '1';
    detailClose.addEventListener('click', () => closePolymarketDetail());
  }

  if (detailBackdrop && !detailBackdrop.dataset.bound) {
    detailBackdrop.dataset.bound = '1';
    detailBackdrop.addEventListener('click', () => closePolymarketDetail());
  }

  if (detailPageBack && !detailPageBack.dataset.bound) {
    detailPageBack.dataset.bound = '1';
    detailPageBack.addEventListener('click', () => closePolymarketDetail());
  }

  if (detailPageClose && !detailPageClose.dataset.bound) {
    detailPageClose.dataset.bound = '1';
    detailPageClose.addEventListener('click', () => closePolymarketDetail());
  }

  if (!window.__polyDetailEscBound) {
    window.__polyDetailEscBound = true;
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!getSelectedPolymarketMarketSlug()) return;
      if (isPhoneDetailMode()) return;
      closePolymarketDetail();
    });
  }

  renderPolymarketDashboard();
}

function getCurrentGoogTrans() {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function setGoogTransCookie(value) {
  document.cookie = `googtrans=${value};path=/`;
  const host = window.location.hostname;
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    document.cookie = `googtrans=${value};path=/;domain=${host}`;
  }
}

function getPreferredLanguage() {
  const saved = localStorage.getItem(LANG_KEY);
  const cookie = getCurrentGoogTrans();
  if (saved === 'zh-CN' || cookie.includes('/zh-CN')) {
    return 'zh-CN';
  }
  return 'en';
}

function applyTranslateToggleLabel(btn, lang) {
  if (!btn) return;
  btn.textContent = lang === 'zh-CN' ? 'EN' : '中文';
  btn.setAttribute('aria-label', lang === 'zh-CN' ? 'Switch language to English' : 'Switch language to Chinese');
}

function ensureGoogleTranslateWidget() {
  if (googleTranslateLoader) return googleTranslateLoader;

  googleTranslateLoader = new Promise((resolve) => {
    const container = document.getElementById('google_translate_element');
    if (!container) {
      console.warn('Google Translate container is missing.');
      resolve(false);
      return;
    }

    const initWidget = () => {
      try {
        if (!window.google?.translate?.TranslateElement) {
          console.warn('Google Translate API is unavailable after script load.');
          resolve(false);
          return;
        }

        if (!container.dataset.ready) {
          container.innerHTML = '';
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,zh-CN',
              autoDisplay: false,
              multilanguagePage: false,
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            },
            'google_translate_element'
          );
          container.dataset.ready = '1';
        }

        window.setTimeout(() => resolve(true), 150);
      } catch (err) {
        console.warn('Failed to initialize Google Translate widget:', err?.message || err);
        resolve(false);
      }
    };

    if (window.google?.translate?.TranslateElement) {
      initWidget();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID);
    window[GOOGLE_TRANSLATE_CALLBACK] = initWidget;

    if (existingScript) {
      window.setTimeout(() => {
        if (window.google?.translate?.TranslateElement) {
          initWidget();
        } else {
          console.warn('Google Translate script is present but widget did not initialize.');
          resolve(false);
        }
      }, 800);
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
    script.async = true;
    script.src = `https://translate.google.com/translate_a/element.js?cb=${GOOGLE_TRANSLATE_CALLBACK}`;
    script.onerror = () => {
      console.warn('Google Translate script failed to load.');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return googleTranslateLoader;
}

function syncGoogleTranslateLanguage(lang) {
  const normalized = lang === 'zh-CN' ? 'zh-CN' : 'en';
  setGoogTransCookie(normalized === 'zh-CN' ? '/en/zh-CN' : '/en/en');

  const combo = document.querySelector('#google_translate_element select.goog-te-combo');
  if (!combo) return false;

  if (combo.value !== normalized) {
    combo.value = normalized;
    combo.dispatchEvent(new Event('change', { bubbles: true }));
    combo.dispatchEvent(new Event('input', { bubbles: true }));
  }
  return true;
}

async function applyTranslateLanguage(lang, { persist = true } = {}) {
  const normalized = lang === 'zh-CN' ? 'zh-CN' : 'en';
  const btn = document.getElementById('translate-toggle');
  if (persist) {
    localStorage.setItem(LANG_KEY, normalized);
  }
  applyTranslateToggleLabel(btn, normalized);
  window.dispatchEvent(new CustomEvent('xauradar:language-change', { detail: { lang: normalized } }));

  const ready = await ensureGoogleTranslateWidget();
  if (!ready) {
    console.warn('Google Translate widget is unavailable; keeping readable toggle only.');
    return false;
  }

  const synced = syncGoogleTranslateLanguage(normalized);
  if (!synced) {
    console.warn('Google Translate widget did not expose the language selector.');
    return false;
  }
  return true;
}

function initTranslateToggle() {
  const btn = document.getElementById('translate-toggle');
  if (!btn) return;

  let lang = getPreferredLanguage();
  applyTranslateToggleLabel(btn, lang);
  applyTranslateLanguage(lang, { persist: false });

  if (btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';

  btn.addEventListener('click', async () => {
    const next = lang === 'zh-CN' ? 'en' : 'zh-CN';
    btn.disabled = true;
    try {
      const ok = await applyTranslateLanguage(next);
      lang = next;
      if (!ok) {
        applyTranslateToggleLabel(btn, next);
      }
    } finally {
      btn.disabled = false;
    }
  });
}

function getLearnLanguage() {
  return getPreferredLanguage() === 'zh-CN' ? 'zh' : 'en';
}

function getLearnProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEARN_PROGRESS_KEY) || '{}');
    const completedLessonIds = Array.isArray(parsed?.completedLessonIds)
      ? parsed.completedLessonIds.filter((value) => typeof value === 'string')
      : [];
    const lastLessonId = typeof parsed?.lastLessonId === 'string' ? parsed.lastLessonId : LEARN_LESSONS[0].id;
    return {
      completedLessonIds,
      lastLessonId: LEARN_LESSONS.some((lesson) => lesson.id === lastLessonId) ? lastLessonId : LEARN_LESSONS[0].id,
    };
  } catch {
    return {
      completedLessonIds: [],
      lastLessonId: LEARN_LESSONS[0].id,
    };
  }
}

function saveLearnProgress(progress) {
  localStorage.setItem(LEARN_PROGRESS_KEY, JSON.stringify({
    completedLessonIds: Array.isArray(progress?.completedLessonIds) ? progress.completedLessonIds : [],
    lastLessonId: typeof progress?.lastLessonId === 'string' ? progress.lastLessonId : LEARN_LESSONS[0].id,
  }));
}

function getLearnQuizState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEARN_QUIZ_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveLearnQuizState(state) {
  localStorage.setItem(LEARN_QUIZ_KEY, JSON.stringify(state && typeof state === 'object' ? state : {}));
}

function getLearnLesson(id) {
  return LEARN_LESSONS.find((lesson) => lesson.id === id) || LEARN_LESSONS[0];
}

function getLearnCopy(lesson, lang = getLearnLanguage()) {
  return lesson?.copy?.[lang] || lesson?.copy?.en || {};
}

function isLessonCompleted(id) {
  return getLearnProgress().completedLessonIds.includes(id);
}

function getNextLearnLesson(currentId) {
  const progress = getLearnProgress();
  const incomplete = LEARN_LESSONS.find((lesson) => !progress.completedLessonIds.includes(lesson.id));
  if (incomplete) return incomplete;
  const currentIndex = LEARN_LESSONS.findIndex((lesson) => lesson.id === currentId);
  return LEARN_LESSONS[(currentIndex + 1) % LEARN_LESSONS.length] || LEARN_LESSONS[0];
}

function setCurrentLearnLesson(id, { persist = true } = {}) {
  const lesson = getLearnLesson(id);
  currentLearnLessonId = lesson.id;
  if (persist) {
    const progress = getLearnProgress();
    progress.lastLessonId = lesson.id;
    saveLearnProgress(progress);
  }
  renderLearnPage();
}

function toggleLearnLessonComplete(id = currentLearnLessonId) {
  const progress = getLearnProgress();
  const exists = progress.completedLessonIds.includes(id);
  progress.completedLessonIds = exists
    ? progress.completedLessonIds.filter((value) => value !== id)
    : progress.completedLessonIds.concat(id);
  progress.lastLessonId = id;
  saveLearnProgress(progress);
  renderLearnPage();
}

function getLearnCtaLabel(lesson, lang) {
  const copy = LEARN_UI_COPY[lang];
  const fallback = lesson?.ctaLabel?.[lang] || lesson?.ctaLabel?.en || '';
  if (fallback) return fallback;
  if (lesson.ctaTarget === 'signal') return copy.openSignal;
  if (lesson.ctaTarget === 'calendar') return copy.openCalendar;
  if (lesson.ctaTarget === 'history') return copy.openHistory;
  if (lesson.ctaTarget === 'stats') return copy.openStats;
  return copy.openChart;
}

function renderLearnModuleList(lang) {
  const list = document.getElementById('learn-module-list');
  if (!list) return;
  const copy = LEARN_UI_COPY[lang];
  const progress = getLearnProgress();
  list.innerHTML = LEARN_LESSONS.map((lesson) => {
    const lessonCopy = getLearnCopy(lesson, lang);
    const isActive = lesson.id === currentLearnLessonId;
    const isDone = progress.completedLessonIds.includes(lesson.id);
    return `
      <button type="button" class="learn-module-item${isActive ? ' active' : ''}" data-learn-lesson="${escapeHtml(lesson.id)}">
        <span class="learn-module-item__index">${lesson.order}</span>
        <span class="learn-module-item__copy">
          <span class="learn-module-item__title">${escapeHtml(lessonCopy.title || `Lesson ${lesson.order}`)}</span>
          <span class="learn-module-item__meta">${escapeHtml(String(lesson.estimatedMinutes))} ${escapeHtml(copy.min)}${isDone ? ` • ${escapeHtml(copy.completed)}` : ''}</span>
        </span>
      </button>
    `;
  }).join('');
}

function renderLearnQuiz(lesson, lang) {
  const list = document.getElementById('learn-quiz-list');
  const feedback = document.getElementById('learn-quiz-feedback');
  const badge = document.getElementById('learn-quiz-badge');
  if (!list || !feedback || !badge) return;

  const copy = LEARN_UI_COPY[lang];
  const answersState = learnSelectedAnswers[currentLearnLessonId] || {};
  badge.textContent = `${lesson.quiz.length} ${lang === 'zh' ? '题' : lesson.quiz.length === 1 ? 'question' : 'questions'}`;

  list.innerHTML = lesson.quiz.map((question, index) => {
    const options = question.answers?.[lang] || question.answers?.en || [];
    const selectedKey = answersState[question.id] || '';
    const correctKey = question.correctAnswer;
    return `
      <section class="learn-quiz-question">
        <div class="learn-quiz-question__title">${escapeHtml(`${lang === 'zh' ? `问题 ${index + 1}` : `Question ${index + 1}`}`)}</div>
        <div class="learn-quiz-options">
          ${options.map((option) => `
            <button
              type="button"
              class="learn-quiz-option${selectedKey === option.key ? ' active' : ''}${selectedKey && option.key === correctKey ? ' correct' : ''}${selectedKey === option.key && selectedKey !== correctKey ? ' incorrect' : ''}"
              data-learn-question="${escapeHtml(question.id)}"
              data-learn-answer="${escapeHtml(option.key)}"
            >
              <span class="learn-quiz-option__key">${escapeHtml(option.key.toUpperCase())}</span>
              <span>${escapeHtml(option.text)}</span>
            </button>
          `).join('')}
        </div>
      </section>
    `;
  }).join('');

  feedback.textContent = learnQuizFeedback[currentLearnLessonId] || copy.chooseToSee;
}

function renderLearnPage() {
  const page = document.getElementById('page-learn');
  if (!page) return;

  const lang = getLearnLanguage();
  const uiCopy = LEARN_UI_COPY[lang];
  const progress = getLearnProgress();
  const lesson = getLearnLesson(currentLearnLessonId || progress.lastLessonId || LEARN_LESSONS[0].id);
  currentLearnLessonId = lesson.id;
  const lessonCopy = getLearnCopy(lesson, lang);
  const completedCount = progress.completedLessonIds.length;
  const progressPct = Math.max(0, Math.min(100, (completedCount / LEARN_LESSONS.length) * 100));
  const nextLesson = getNextLearnLesson(lesson.id);
  const nextLessonCopy = getLearnCopy(nextLesson, lang);
  const isCompleted = progress.completedLessonIds.includes(lesson.id);
  const hasTouchedCourse = completedCount > 0 || Boolean(Object.keys(getLearnQuizState()[lesson.id] || {}).length) || progress.lastLessonId !== LEARN_LESSONS[0].id;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('learn-hero-eyebrow', uiCopy.heroEyebrow);
  setText('learn-hero-title', uiCopy.heroTitle);
  setText('learn-hero-body', uiCopy.heroBody);
  setText('learn-focus-title', lessonCopy.focusTitle || lessonCopy.title);
  setText('learn-focus-body', lessonCopy.focusBody || lessonCopy.coreIdea);
  setText('learn-progress-title', uiCopy.progressTitle);
  setText('learn-progress-badge', `${completedCount} / ${LEARN_LESSONS.length}`);
  setText('learn-progress-current-label', uiCopy.currentLesson);
  setText('learn-current-lesson-name', lessonCopy.title);
  setText('learn-progress-next-label', uiCopy.nextAction);
  setText('learn-next-action-text', completedCount === LEARN_LESSONS.length ? (lang === 'zh' ? '你已经完成基础路径，可以回去复盘实战。' : 'You finished the beginner path. Use the app to review and apply it.') : (nextLessonCopy.title ? `${uiCopy.continueLesson}: ${nextLessonCopy.title}` : uiCopy.nextActionText));
  setText('learn-continue-title', uiCopy.continueTitle);
  setText('learn-continue-minutes', `${lesson.estimatedMinutes} ${uiCopy.min}`);
  setText('learn-continue-lesson-title', lessonCopy.title);
  setText('learn-continue-copy', lessonCopy.coreIdea);
  setText('learn-module-title', uiCopy.modules);
  setText('learn-module-badge', uiCopy.beginnerPath);
  setText('learn-lesson-index', lang === 'zh' ? `第 ${lesson.order} 课 / 共 ${LEARN_LESSONS.length} 课` : `Lesson ${lesson.order} of ${LEARN_LESSONS.length}`);
  setText('learn-lesson-title', lessonCopy.title);
  setText('learn-lesson-time', `${lesson.estimatedMinutes} ${uiCopy.min}`);
  setText('learn-objective-label', uiCopy.objective);
  setText('learn-objective-copy', lessonCopy.objective);
  setText('learn-core-idea-label', uiCopy.coreIdea);
  setText('learn-core-idea-copy', lessonCopy.coreIdea);
  setText('learn-why-label', uiCopy.whyItMatters);
  setText('learn-why-copy', lessonCopy.whyItMatters);
  setText('learn-example-label', uiCopy.example);
  setText('learn-example-copy', lessonCopy.example);
  setText('learn-mistake-label', uiCopy.beginnerMistake);
  setText('learn-mistake-copy', lessonCopy.beginnerMistake);
  setText('learn-risk-label', uiCopy.riskNote);
  setText('learn-risk-copy', lessonCopy.riskNote);
  setText('learn-exercise-label', uiCopy.exercise);
  setText('learn-exercise-copy', lessonCopy.exercise);
  setText('learn-cta-label', uiCopy.apply);
  setText('learn-cta-copy', lessonCopy.ctaCopy);
  setText('learn-quiz-title', uiCopy.quickCheck);

  const progressFill = document.getElementById('learn-progress-fill');
  if (progressFill) progressFill.style.width = `${progressPct}%`;

  const resumeBtn = document.getElementById('learn-resume-btn');
  if (resumeBtn) resumeBtn.textContent = hasTouchedCourse ? uiCopy.continueLesson : uiCopy.startLesson;

  const languageNote = document.getElementById('learn-language-note');
  if (languageNote) languageNote.textContent = uiCopy.languageBadge;

  const continueBtn = document.getElementById('learn-continue-btn');
  if (continueBtn) continueBtn.textContent = uiCopy.openLesson;

  const markBtn = document.getElementById('learn-mark-complete-btn');
  if (markBtn) markBtn.textContent = isCompleted ? uiCopy.completed : uiCopy.markComplete;

  const ctaBtn = document.getElementById('learn-cta-btn');
  if (ctaBtn) {
    ctaBtn.textContent = getLearnCtaLabel(lesson, lang);
    ctaBtn.dataset.targetPage = lesson.ctaTarget || 'chart';
  }

  renderLearnModuleList(lang);
  renderLearnQuiz(lesson, lang);
}

function initLearnPage() {
  const page = document.getElementById('page-learn');
  if (!page) return;
  const progress = getLearnProgress();
  currentLearnLessonId = getLearnLesson(progress.lastLessonId).id;

  if (page.dataset.bound === '1') {
    renderLearnPage();
    return;
  }
  page.dataset.bound = '1';

  page.addEventListener('click', (evt) => {
    const lessonBtn = evt.target.closest('[data-learn-lesson]');
    if (lessonBtn) {
      setCurrentLearnLesson(lessonBtn.dataset.learnLesson || LEARN_LESSONS[0].id);
      return;
    }

    const navBtn = evt.target.closest('.learn-nav-link,[data-target-page]');
    if (navBtn && navBtn.dataset.targetPage) {
      setActivePage(navBtn.dataset.targetPage);
      return;
    }

    const continueBtn = evt.target.closest('#learn-resume-btn,#learn-continue-btn');
    if (continueBtn) {
      setCurrentLearnLesson(getLearnProgress().lastLessonId || currentLearnLessonId);
      return;
    }

    const markBtn = evt.target.closest('#learn-mark-complete-btn');
    if (markBtn) {
      toggleLearnLessonComplete(currentLearnLessonId);
      return;
    }

    const answerBtn = evt.target.closest('[data-learn-question][data-learn-answer]');
    if (answerBtn) {
      const questionId = String(answerBtn.dataset.learnQuestion || '').trim();
      const answerKey = String(answerBtn.dataset.learnAnswer || '').trim();
      const lesson = getLearnLesson(currentLearnLessonId);
      const lang = getLearnLanguage();
      const question = lesson.quiz.find((item) => item.id === questionId);
      if (!question) return;

      learnSelectedAnswers[currentLearnLessonId] = {
        ...(learnSelectedAnswers[currentLearnLessonId] || {}),
        [questionId]: answerKey,
      };
      const existingQuizState = getLearnQuizState();
      existingQuizState[currentLearnLessonId] = {
        ...(existingQuizState[currentLearnLessonId] || {}),
        [questionId]: answerKey,
      };
      saveLearnQuizState(existingQuizState);
      learnQuizFeedback[currentLearnLessonId] = question.explanation?.[lang] || question.explanation?.en || LEARN_UI_COPY[lang].chooseToSee;
      renderLearnPage();
    }
  });

  window.addEventListener('xauradar:language-change', () => renderLearnPage());
  learnSelectedAnswers = getLearnQuizState();
  renderLearnPage();
}

function initChartTime() {
  const el = document.getElementById('chart-current-time');
  if (!el) return;
  const tick = () => {
    const nowText = formatMalaysiaTime(new Date(), true);
    el.textContent = `Now: ${nowText}`;
  };
  tick();
  setInterval(tick, 1000);
}

function setAuthButtonUser(email) {
  const btn = document.getElementById('auth-logout-btn');
  if (!btn) return;
  if (email) {
    const short = email.length > 18 ? `${email.slice(0, 15)}...` : email;
    btn.textContent = short;
    btn.classList.add('auth-trigger--active');
    btn.setAttribute('title', email);
  } else {
    btn.textContent = 'Logout';
    btn.classList.remove('auth-trigger--active');
    btn.removeAttribute('title');
  }
}

function setAuthGateVisible(visible) {
  const gate = document.getElementById('auth-gate');
  const app = document.getElementById('app-shell');
  if (!gate || !app) return;

  if (visible) {
    gate.classList.remove('auth-gate--hidden');
    app.classList.add('app-shell--hidden');
  } else {
    gate.classList.add('auth-gate--hidden');
    app.classList.remove('app-shell--hidden');
  }
}

function initAuthGate({ onLogin, onSignup, onLogout, onAuthenticated }) {
  const loginTab = document.getElementById('auth-tab-login');
  const signupTab = document.getElementById('auth-tab-signup');
  const loginForm = document.getElementById('auth-login-form');
  const signupForm = document.getElementById('auth-signup-form');
  const feedback = document.getElementById('auth-feedback');
  const logoutBtn = document.getElementById('auth-logout-btn');
  const loginSubmit = document.getElementById('auth-login-submit');
  const signupSubmit = document.getElementById('auth-signup-submit');

  if (!loginTab || !signupTab || !loginForm || !signupForm || !feedback || !logoutBtn || !loginSubmit || !signupSubmit) {
    return;
  }

  const showTab = (tab) => {
    const loginActive = tab === 'login';
    loginTab.classList.toggle('active', loginActive);
    signupTab.classList.toggle('active', !loginActive);
    loginForm.classList.toggle('auth-form--hidden', !loginActive);
    signupForm.classList.toggle('auth-form--hidden', loginActive);
    feedback.textContent = '';
    feedback.className = 'auth-feedback';
  };

  loginTab.addEventListener('click', () => showTab('login'));
  signupTab.addEventListener('click', () => showTab('signup'));

  loginForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const email = (document.getElementById('auth-login-email')?.value || '').trim();
    const password = document.getElementById('auth-login-password')?.value || '';
    if (!email || !password) return;

    loginSubmit.disabled = true;
    loginSubmit.textContent = 'Logging in...';
    try {
      const data = await onLogin(email, password);
      const userEmail = data?.user?.email || data?.session?.user?.email || email;
      setAuthButtonUser(userEmail);
      setAuthGateVisible(false);
      if (onAuthenticated) onAuthenticated();
      feedback.textContent = '';
      loginForm.reset();
    } catch (err) {
      feedback.textContent = err?.message || 'Login failed.';
      feedback.className = 'auth-feedback auth-feedback--error';
    } finally {
      loginSubmit.disabled = false;
      loginSubmit.textContent = 'Login';
    }
  });

  signupForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const email = (document.getElementById('auth-signup-email')?.value || '').trim();
    const password = document.getElementById('auth-signup-password')?.value || '';
    if (!email || password.length < 8) {
      feedback.textContent = 'Use a valid email and password (minimum 8 chars).';
      feedback.className = 'auth-feedback auth-feedback--error';
      return;
    }

    signupSubmit.disabled = true;
    signupSubmit.textContent = 'Creating...';
    try {
      const result = await onSignup(email, password);
      const userEmail = result?.session?.user?.email || email;
      setAuthButtonUser(userEmail);
      setAuthGateVisible(false);
      if (onAuthenticated) onAuthenticated();
      feedback.textContent = '';
      signupForm.reset();
    } catch (err) {
      feedback.textContent = err?.message || 'Sign up failed.';
      feedback.className = 'auth-feedback auth-feedback--error';
    } finally {
      signupSubmit.disabled = false;
      signupSubmit.textContent = 'Create account';
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await onLogout();
      setAuthButtonUser(null);
      setAuthGateVisible(true);
    } catch (err) {
      console.error('Logout failed', err?.message || err);
    }
  });
}

function updateSessionPill() {
  const el = document.getElementById('session-pill');
  if (!el) return;

  const now = new Date();
  const myt = getTimePartsInTimezone(now, APP_TIMEZONE);
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const total = utcH * 60 + utcM;
  const weekday = now.getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
  const marketOpen = !(
    weekday === 6
    || (weekday === 0 && total < 22 * 60)
    || (weekday === 5 && total >= 22 * 60)
  );

  const sessions = [
    { name: 'Sydney', start: 21 * 60, end: 30 * 60, color: '#4f8cff' },
    { name: 'Tokyo', start: 0, end: 9 * 60, color: '#8b6eff' },
    { name: 'London', start: 7 * 60, end: 16 * 60, color: '#1fca77' },
    { name: 'New York', start: 12 * 60, end: 21 * 60, color: '#ef5d6c' },
  ];

  let active = null;
  if (marketOpen) {
    for (const s of sessions) {
      const start = s.start % (24 * 60);
      const end = s.end % (24 * 60);
      const inside = start < end ? total >= start && total < end : total >= start || total < end;
      if (inside) {
        active = s;
        break;
      }
    }
  }

  let text = `${myt.clock} ${APP_TZ_LABEL} | Market Closed`;
  if (active) {
    const end = active.end % (24 * 60);
    let left = end - total;
    if (left < 0) left += 24 * 60;
    const h = Math.floor(left / 60);
    const m = left % 60;
    text = `${myt.clock} ${APP_TZ_LABEL} | ${active.name} ${h}h ${m}m left`;
    el.style.background = `${active.color}20`;
    el.style.borderColor = `${active.color}55`;
    el.style.color = active.color;
  } else {
    el.style.background = '';
    el.style.borderColor = '';
    el.style.color = '';
  }

  el.textContent = text;

  const sideSession = document.getElementById('sidebar-session');
  if (sideSession) sideSession.textContent = active ? active.name : 'Closed';
}

function updateHeaderPrice(priceData) {
  if (!priceData || !priceData.price) return;

  const priceEl = document.getElementById('header-price');
  const changeEl = document.getElementById('header-change');
  const statusEl = document.getElementById('connection-status');
  const sourceEl = document.getElementById('source-badge');

  if (priceEl) {
    priceEl.textContent = `$${priceData.price.toFixed(2)}`;
    priceEl.className = 'topbar__price';
    if (priceData.direction === 'up' || priceData.direction === 'down') {
      priceEl.classList.add(priceData.direction);
    } else {
      priceEl.classList.add('neutral');
    }
    priceEl.classList.add('price-bounce');
    setTimeout(() => priceEl.classList.remove('price-bounce'), 300);
  }

  const ts = Number(priceData.timestamp) || Date.now();
  const ageMin = Number.isFinite(priceData.ageMinutes)
    ? Math.max(0, Math.floor(priceData.ageMinutes))
    : Math.max(0, Math.floor((Date.now() - ts) / 60000));
  const ageText = ageMin < 1 ? 'now' : ageMin < 60 ? `${ageMin}m ago` : `${Math.floor(ageMin / 60)}h ago`;
  const source = (priceData.source || '').toUpperCase();
  const delta = Number(priceData.changeValue);
  const deltaPct = Number(priceData.changePct);
  const hasDelta = Number.isFinite(delta) && Number.isFinite(deltaPct);
  const deltaPips = hasDelta ? toXauPips(delta) : NaN;
  const deltaSign = hasDelta ? (delta > 0 ? '+' : delta < 0 ? '-' : '') : '';
  const deltaIcon = hasDelta ? (delta > 0 ? '▲' : delta < 0 ? '▼' : '•') : '•';
  const deltaClass = hasDelta ? (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat') : 'flat';
  const deltaText = hasDelta
    ? `${deltaIcon} ${deltaSign}${Math.abs(delta).toFixed(2)} (${deltaSign}${Math.abs(deltaPct).toFixed(3)}%) | ${deltaSign}${Math.abs(deltaPips).toFixed(1)}p`
    : 'Δ --';

  if (changeEl) {
    const freshness = source === 'TD_DELAYED'
      ? `Last tick: ${ageText} | delayed`
      : source === 'STALE'
        ? `Last tick: ${ageText} | stale`
        : `Last tick: ${ageText}`;
    changeEl.innerHTML = `<span class="topbar__delta ${deltaClass}">${deltaText}</span> <span class="topbar__fresh">${freshness}</span>`;
  }

  if (statusEl) {
    statusEl.innerHTML = '<span class="status-dot"></span>';
  }

  if (sourceEl) {
    const sourceMap = {
      TD_LIVE: { label: 'LIVE', cls: 'source-badge--quote' },
      TD_DELAYED: { label: 'DELAY', cls: 'source-badge--1m' },
      STALE: { label: 'STALE', cls: 'source-badge--prev' },
    };
    const mapped = sourceMap[source] || { label: '--', cls: 'source-badge--unknown' };
    sourceEl.textContent = mapped.label;
    sourceEl.className = `source-badge ${mapped.cls}`;
    sourceEl.setAttribute('aria-label', `Price source: ${mapped.label}`);

    const sideSource = document.getElementById('sidebar-source');
    if (sideSource) sideSource.textContent = mapped.label;
  }
}

function getLaneThreshold(signal) {
  const lane = String(signal?.lane || 'intraday').toLowerCase();
  const fromPayload = Number(signal?.conditions_met?.threshold_normalized);
  if (Number.isFinite(fromPayload) && fromPayload > 0) return fromPayload;
  return lane === 'swing' ? 72 : 70;
}

function describeBlockedReason(code) {
  const map = {
    RR_BELOW_MIN: 'Risk/reward too low',
    HIGH_IMPACT_BLACKOUT: 'High-impact news time',
    SPREAD_TOO_WIDE: 'Spread too wide',
    STOP_DISTANCE_OUT_OF_BAND: 'Stop distance not valid',
    SCORE_BELOW_THRESHOLD: 'Quality score too low',
    ACTIVE_SIGNAL_EXISTS: 'Lane already has an active trade',
    ACTIVE_TRADE_OPEN: 'Trade already open in this lane',
    CONSECUTIVE_SL_LIMIT: 'Consecutive stop-loss guard',
    daily_guard_triggered: 'Daily risk guard active',
    INSERT_FAILED: 'Signal storage failed',
  };
  return map[code] || code || 'Waiting for setup';
}

function laneLabel(lane) {
  return String(lane || 'intraday').toLowerCase() === 'swing' ? 'Swing (H1/H4)' : 'Intraday (M15/H1)';
}

function buildLiveProgress(signal, currentPrice) {
  if (!signal) return 'Waiting for setup';
  const side = String(signal.signal_type || signal.type || '').toUpperCase();
  const state = String(signal.decision_state || signal.status || '').toUpperCase();
  const entry = Number(signal.entry_price || 0);
  const tp1 = Number(signal.tp1 || 0);
  const tp2 = Number(signal.tp2 || 0);
  const tp3 = Number(signal.tp3 || 0);
  const sl = Number(signal.stop_loss ?? signal.sl ?? 0);
  const price = Number(currentPrice || 0);

  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(entry) || entry <= 0 || !side || side === 'WAIT') {
    return state === 'ACTIVE' || state === 'IN_TRADE' ? 'Live setup waiting for next price tick' : 'Watching next setup';
  }

  const deltaFromEntry = toXauPips(Math.abs(price - entry));
  const distance = (target) => `${toXauPips(Math.abs(target - price)).toFixed(1)}p`;

  if (side === 'BUY') {
    if (price >= tp3 && tp3 > 0) return `TP3 touched | ${distance(tp3)} beyond target`;
    if (price >= tp2 && tp2 > 0) return `Above TP2 | ${distance(tp3)} to TP3`;
    if (price >= tp1 && tp1 > 0) return `Above TP1 | ${distance(tp2)} to TP2`;
    if (price <= sl && sl > 0) return `At stop zone | ${distance(entry)} back to entry`;
    if (price >= entry) return `Live | +${deltaFromEntry.toFixed(1)}p from entry`;
    return `Below entry | ${deltaFromEntry.toFixed(1)}p to entry`;
  }

  if (side === 'SELL') {
    if (price <= tp3 && tp3 > 0) return `TP3 touched | ${distance(tp3)} beyond target`;
    if (price <= tp2 && tp2 > 0) return `Below TP2 | ${distance(tp3)} to TP3`;
    if (price <= tp1 && tp1 > 0) return `Below TP1 | ${distance(tp2)} to TP2`;
    if (price >= sl && sl > 0) return `At stop zone | ${distance(entry)} back to entry`;
    if (price <= entry) return `Live | +${deltaFromEntry.toFixed(1)}p from entry`;
    return `Above entry | ${deltaFromEntry.toFixed(1)}p to entry`;
  }

  return 'Watching next setup';
}

function renderSignalHero(decisionRun, signalsByLane = {}, currentPrice = null) {
  const hero = document.getElementById('signal-hero');
  if (!hero) return;
  const heroChip = document.querySelector('.hero-chip');
  if (heroChip) heroChip.textContent = 'Market Signals';

  const toValidTs = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    const ts = date.getTime();
    return Number.isFinite(ts) ? ts : null;
  };
  const formatLastUpdatedText = (value) => {
    const ts = toValidTs(value);
    if (!ts) return 'Signal refresh: waiting for engine | target every 3m';
    return `Signal refresh: ${formatMalaysiaTime(ts, true)} | refresh target: every 3m`;
  };

  const selectedLane = getSelectedSignalLane();
  const lanes = ['intraday', 'swing'];
  const laneModels = lanes.map((lane) => {
    const activeSignal = signalsByLane?.[lane] || null;
    const decision = decisionRun?.lanes?.[lane] || null;
    return activeSignal
      ? { ...(decision || {}), ...activeSignal, decision_state: decision?.decision_state || 'IN_TRADE', lane }
      : decision;
  }).filter(Boolean);
  const latestEngineRunTs = toValidTs(decisionRun?.created_at);
  const fallbackSignalTs = laneModels
    .flatMap((signal) => [signal?.created_at])
    .map(toValidTs)
    .filter((ts) => ts !== null)
    .reduce((latest, ts) => Math.max(latest, ts), 0);
  const lastUpdatedText = formatLastUpdatedText(latestEngineRunTs || fallbackSignalTs || null);

  if (laneModels.length === 0) {
    hero.innerHTML = `
      <div class="signal-hero__badge waiting">Waiting for lane decisions...</div>
      <div class="signal-hero__time">${lastUpdatedText}</div>
    `;
    return;
  }

  hero.innerHTML = `
    <div class="signal-hero__time">${lastUpdatedText}</div>
    <div class="signal-hero-grid">
      ${lanes.map((lane) => {
        const expanded = isSignalLaneExpanded(lane);
        const signal = laneModels.find((row) => String(row.lane || '').toLowerCase() === lane) || null;
        if (!signal) {
          return `
            <article
              class="signal-lane-card signal-lane-card--empty signal-lane-card--collapsed ${selectedLane === lane ? 'is-selected' : ''}"
              data-lane="${lane}"
              role="button"
              tabindex="0"
              aria-expanded="false"
            >
              <div class="signal-lane-card__top">
                <span class="lane-badge lane-badge--${lane}">${lane.toUpperCase()}</span>
                <span class="signal-lane-card__state">WAITING</span>
              </div>
              <div class="signal-lane-card__side waiting">NO TRADE</div>
              <div class="signal-lane-card__reason">No lane decision yet.</div>
            </article>
          `;
        }

        const decisionState = String(signal.decision_state || signal.status || 'NOT_READY').toUpperCase();
        const side = String(signal.signal_type || signal.type || 'WAIT').toUpperCase();
        const scoreNum = Math.max(0, Math.min(100, Number(signal.score_total || 0)));
        const confNum = Math.max(0, Math.min(100, Number(signal.confidence || scoreNum || 0)));
        const scoreClass = scoreNum >= 70 ? 'conf-high' : scoreNum >= 50 ? 'conf-med' : 'conf-low';
        const confClass = confNum >= 70 ? 'conf-high' : confNum >= 50 ? 'conf-med' : 'conf-low';
        const tradable = decisionState === 'ACTIVE' || decisionState === 'IN_TRADE';
        const sideLabel = tradable && (side === 'BUY' || side === 'SELL') ? side : 'NO TRADE';
        const badgeClass = sideLabel === 'BUY' ? 'buy' : sideLabel === 'SELL' ? 'sell' : 'waiting';
        const trigger = getLaneThreshold(signal);
        const reasonCode = signal.blocked_reason || signal.reason || signal?.conditions_met?.blocked_reason || '';
        const reasonText = tradable
          ? buildLiveProgress(signal, currentPrice)
          : `${side && side !== 'WAIT' ? `Best setup: ${side}. ` : ''}${describeBlockedReason(reasonCode)}`;
        const regime = signal.h1_regime || signal?.conditions_met?.adaptive_exits?.regime || ((Number(signal.adx_value || 0) >= 20) ? 'Trending' : 'Range');
        const time = formatMalaysiaTime(signal.created_at);
        const compactHint = tradable
          ? 'Signal active'
          : decisionState === 'NOT_READY'
            ? 'Watching setup'
            : 'Awaiting next engine update';

        return `
          <article
            class="signal-lane-card ${selectedLane === lane ? 'is-selected' : ''} ${expanded ? 'signal-lane-card--expanded' : 'signal-lane-card--collapsed'}"
            data-lane="${lane}"
            role="button"
            tabindex="0"
            aria-expanded="${expanded ? 'true' : 'false'}"
          >
            <div class="signal-lane-card__top">
              <span class="lane-badge lane-badge--${lane}">${lane.toUpperCase()}</span>
              <div class="signal-lane-card__controls">
                <span class="signal-lane-card__state">${decisionState === 'IN_TRADE' ? 'IN TRADE' : decisionState}</span>
                <button type="button" class="signal-lane-card__toggle" data-lane-toggle="${lane}" aria-label="${expanded ? 'Hide signal details' : 'Expand signal details'}">
                  ${expanded ? 'Hide' : 'Expand'}
                </button>
              </div>
            </div>
            <div class="signal-lane-card__side ${badgeClass}">${sideLabel}</div>
            ${expanded ? `
              <div class="signal-lane-card__headline">${lane === 'swing' ? 'Swing market signal' : 'Intraday market signal'}</div>
              <div class="signal-lane-card__reason">${reasonText}</div>
            ` : `
              <div class="signal-lane-card__summary-grid">
                <div class="signal-lane-card__summary-stat">
                  <span class="signal-lane-card__summary-label">Score</span>
                  <strong class="signal-lane-card__summary-value ${scoreClass}">${scoreNum.toFixed(1)}</strong>
                </div>
                <div class="signal-lane-card__summary-stat">
                  <span class="signal-lane-card__summary-label">Confidence</span>
                  <strong class="signal-lane-card__summary-value ${confClass}">${confNum.toFixed(0)}%</strong>
                </div>
              </div>
              <div class="signal-lane-card__summary">${compactHint}</div>
            `}
            <div class="signal-lane-card__details" ${expanded ? '' : 'hidden'}>
              <div class="signal-lane-card__metrics">
                <div class="hero-meter">
                  <div class="hero-meter__head">Score <strong class="${scoreClass}">${scoreNum.toFixed(1)}/100</strong></div>
                  <div class="hero-meter__track"><span class="hero-meter__fill ${scoreClass}" style="width:${scoreNum.toFixed(1)}%"></span></div>
                </div>
                <div class="hero-meter">
                  <div class="hero-meter__head">Confidence <strong class="${confClass}">${confNum.toFixed(0)}%</strong></div>
                  <div class="hero-meter__track"><span class="hero-meter__fill ${confClass}" style="width:${confNum.toFixed(1)}%"></span></div>
                </div>
              </div>
              <div class="signal-lane-card__meta">Trigger minimum: ${trigger.toFixed(0)}/100 | ${laneLabel(lane)}</div>
              <div class="signal-lane-card__meta">Regime: ${regime} | Session: ${signal.session_context || '--'}</div>
              <div class="signal-lane-card__time">${time || 'Waiting for engine update'}</div>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;

  hero.querySelectorAll('.signal-lane-card[data-lane]').forEach((card) => {
    card.addEventListener('click', () => setSelectedSignalLane(card.dataset.lane));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setSelectedSignalLane(card.dataset.lane);
      }
    });
  });
  hero.querySelectorAll('[data-lane-toggle]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleSignalLaneExpanded(btn.dataset.laneToggle);
      renderSignalHero(decisionRun, signalsByLane, currentPrice);
    });
  });
}

function renderLevels(signal, currentPrice) {
  const container = document.getElementById('levels-row');
  const context = document.getElementById('trade-levels-context');
  if (!container) return;
  if (!signal) {
    if (context) {
      context.className = 'trade-levels-setup trade-levels-setup--neutral';
      context.innerHTML = `
        <span class="trade-levels-setup__title">Setup</span>
        <span class="trade-levels-setup__value">--</span>
        <span class="trade-levels-setup__lane">--</span>
      `;
    }
    return;
  }

  const entry = parseFloat(signal.entry_price) || 0;
  const tp1 = parseFloat(signal.tp1) || 0;
  const tp2 = parseFloat(signal.tp2) || 0;
  const tp3 = parseFloat(signal.tp3) || 0;
  const sl = parseFloat(signal.stop_loss ?? signal.sl) || 0;
  const price = currentPrice || entry;
  const signalType = signal.signal_type || signal.type;
  const status = String(signal.status || '').toUpperCase();
  const lane = String(signal.lane || 'intraday').toLowerCase();
  if (context) {
    const laneText = lane === 'swing' ? 'Swing (H1/H4)' : 'Intraday (M15/H1)';
    const side = String(signalType || '').toUpperCase();
    const isReady = status === 'ACTIVE';
    const sideCls = !isReady
      ? 'trade-levels-setup--neutral'
      : side === 'BUY'
        ? 'trade-levels-setup--buy'
        : side === 'SELL'
          ? 'trade-levels-setup--sell'
          : 'trade-levels-setup--neutral';
    const setupText = isReady ? (side || '--') : 'NO TRADE';
    const laneNote = isReady ? laneText : `${laneText} | candidate`;
    context.className = `trade-levels-setup ${sideCls}`;
    context.innerHTML = `
      <span class="trade-levels-setup__title">Setup</span>
      <span class="trade-levels-setup__value">${setupText}</span>
      <span class="trade-levels-setup__lane">${laneNote}</span>
    `;
  }

  const dist = (target) => {
    if (!target || !entry) return '';
    const delta = Math.abs(target - entry);
    const pips = toXauPips(delta);
    return `${pips.toFixed(1)}p`;
  };
  const hitCheck = (target, isTp) => {
    if (!price || !target) return '';
    if (isTp && signalType === 'BUY' && price >= target) return ' hit';
    if (isTp && signalType === 'SELL' && price <= target) return ' hit';
    return '';
  };

  container.innerHTML = `
    <div class="level-item">
      <div class="level-item__label entry">Entry</div>
      <div class="level-item__price">${entry.toFixed(2)}</div>
    </div>
    <div class="level-item${hitCheck(tp1, true)}">
      <div class="level-item__label tp">TP1</div>
      <div class="level-item__price">${tp1.toFixed(2)}</div>
      <div class="level-item__dist">${dist(tp1)}</div>
    </div>
    <div class="level-item${hitCheck(tp2, true)}">
      <div class="level-item__label tp">TP2</div>
      <div class="level-item__price">${tp2.toFixed(2)}</div>
      <div class="level-item__dist">${dist(tp2)}</div>
    </div>
    <div class="level-item${hitCheck(tp3, true)}">
      <div class="level-item__label tp">TP3</div>
      <div class="level-item__price">${tp3.toFixed(2)}</div>
      <div class="level-item__dist">${dist(tp3)}</div>
    </div>
    <div class="level-item">
      <div class="level-item__label sl">SL</div>
      <div class="level-item__price">${sl.toFixed(2)}</div>
      <div class="level-item__dist">${dist(sl)}</div>
    </div>
  `;
}

function renderConditions(decisionRun, snapshot, forcedLane = null) {
  const container = document.getElementById('conditions-row');
  if (!container) return;
  const lanes = ['intraday', 'swing'];

  const renderRow = (label, items, tone = 'neutral') => `
    <div class="conditions-block conditions-block--${tone}">
      <div class="conditions-block__label">${label}</div>
      <div class="conditions-block__chips">
        ${items.map((item) => `<span class="cond-chip ${item.met ? 'met' : 'blocked'}">${item.label}: ${item.met ? 'PASS' : 'BLOCKED'}</span>`).join('')}
      </div>
    </div>
  `;

  const makeConditionItems = (obj, lane) => {
    const source = obj && typeof obj === 'object' ? obj : {};
    const items = [
      { key: 'trend_filter', label: 'trend direction' },
      { key: 'momentum', label: 'price momentum' },
      { key: 'pullback', label: 'entry pullback' },
      { key: 'session_fit', label: 'session timing' },
      { key: 'volatility_spread', label: 'market quality' },
    ];
    if (lane === 'intraday') {
      items.push({ key: 'asian_range', label: 'asia breakout' });
    }
    return items.map((item) => ({ label: item.label, met: Boolean(source[item.key]) }));
  };

  const emptyItems = [
    { label: 'trend filter', met: false },
    { label: 'pullback', met: false },
    { label: 'momentum', met: false },
    { label: 'asian range', met: false },
    { label: 'volatility+spread', met: false },
    { label: 'session fit', met: false },
  ];

  const buildPreviewItems = (side, lane) => {
    if (!snapshot) return emptyItems;
    const adx = Number(snapshot.adx_value ?? snapshot.adx ?? 0);
    const stochK = Number(snapshot.stochrsi_k ?? 0);
    const stochD = Number(snapshot.stochrsi_d ?? 0);
    const macd = Number(snapshot.macd_value ?? snapshot.macd_histogram ?? 0);
    const atr = Number(snapshot.atr_value ?? snapshot.atr ?? 0);
    const adxMin = lane === 'swing' ? 20 : 18;
    const isBuy = side === 'BUY';
    return [
      { met: adx >= adxMin, label: 'trend filter' },
      { met: isBuy ? (stochK > stochD) : (stochK < stochD), label: 'pullback' },
      { met: isBuy ? macd >= 0 : macd <= 0, label: 'momentum' },
      { met: false, label: 'asian range' },
      { met: atr > 0, label: 'volatility+spread' },
      { met: adx >= adxMin, label: 'session fit' },
    ];
  };

  let activeLane = forcedLane || getSelectedSignalLane();
  if (!lanes.includes(activeLane)) activeLane = 'intraday';

  const getLaneData = (lane) => decisionRun?.lanes?.[lane] || null;
  const getCandidate = (lane, side) => {
    const laneData = getLaneData(lane);
    return laneData?.candidates?.[String(side || '').toLowerCase()] || null;
  };

  const renderSidePanel = (lane, side) => {
    const row = getCandidate(lane, side);
    const tone = side === 'BUY' ? 'buy' : 'sell';
    if (!row) {
      const previewRaw = buildPreviewItems(side, lane);
      const previewObj = {
        trend_filter: previewRaw.find((x) => x.label === 'trend filter')?.met,
        momentum: previewRaw.find((x) => x.label === 'momentum')?.met,
        pullback: previewRaw.find((x) => x.label === 'pullback')?.met,
        session_fit: previewRaw.find((x) => x.label === 'session fit')?.met,
        asian_range: previewRaw.find((x) => x.label === 'asian range')?.met,
        volatility_spread: previewRaw.find((x) => x.label === 'volatility+spread')?.met,
        macro_news: true,
      };
      const setupItems = makeConditionItems(previewObj, lane);
      return `
        <div class="conditions-lane-panel">
          <div class="conditions-side conditions-side--${side.toLowerCase()}">${side} setup</div>
          ${renderRow('Setup checks', setupItems, tone)}
          <div class="feature-note">Source: live preview (latest indicators)${lane === 'swing' ? ' | Asia breakout is intraday-only' : ''}</div>
        </div>
      `;
    }

    const c = row.conditions_met || {};
    const gates = c.hard_gates && typeof c.hard_gates === 'object' ? c.hard_gates : {};
    const newsCtx = c.news_context && typeof c.news_context === 'object' ? c.news_context : {};
    const setupItems = makeConditionItems(c, lane);
    const gateItems = [
      { key: 'spread_ok', label: 'spread cap' },
      { key: 'min_rr_ok', label: 'min RR' },
      { key: 'stop_band_ok', label: 'stop band' },
      { key: 'news_ok', label: 'news blackout' },
    ].map((item) => ({ label: item.label, met: Boolean(gates[item.key]) }));

    const blockedReason = row.blocked_reason || c.blocked_reason || '';
    const sessionText = c.session_context || row.session_context || '--';
    const scoreTotal = Number(c.score_total ?? row.score_total ?? 0);
    const baseThreshold = Number(c.base_threshold ?? row.base_threshold ?? c.threshold_raw ?? 0);
    const sessionThresholdAdjustment = Number(c.session_threshold_adjustment ?? row.session_threshold_adjustment ?? 0);
    const finalThreshold = Number(c.final_threshold ?? row.final_threshold ?? c.threshold_raw ?? 0);
    const sessionEntryAllowed = Boolean(c.session_entry_allowed ?? gates.session_allowed ?? false);
    const newsText = newsCtx.high_blackout
      ? 'High-impact blackout active'
      : newsCtx.medium_penalty
        ? 'Medium-impact penalty active'
        : 'No active news penalty';
    const scoreThresholdText = finalThreshold > 0
      ? `Score: ${scoreTotal.toFixed(0)} / Required: ${finalThreshold.toFixed(0)}`
      : '';
    const sessionPolicyText = sessionText === 'ASIA'
      ? `Session entry: ${sessionEntryAllowed ? 'allowed' : 'blocked'} | Asia requires higher confidence${sessionThresholdAdjustment > 0 ? ` (+${sessionThresholdAdjustment.toFixed(0)})` : ''}`
      : `Session entry: ${sessionEntryAllowed ? 'allowed' : 'blocked'}`;
    const thresholdBreakdownText = sessionText === 'ASIA' && finalThreshold > 0
      ? `Asia threshold: ${finalThreshold.toFixed(0)} = base ${baseThreshold.toFixed(0)} + ${sessionThresholdAdjustment.toFixed(0)}`
      : '';

    return `
      <div class="conditions-lane-panel">
        <div class="conditions-side conditions-side--${side.toLowerCase()}">${side} setup</div>
        ${renderRow('Setup checks', setupItems, tone)}
        ${renderRow('Hard gates', gateItems, blockedReason ? 'sell' : 'buy')}
        <div class="feature-note">Session: ${sessionText} | News: ${newsText}</div>
        <div class="feature-note">${sessionPolicyText}${scoreThresholdText ? ` | ${scoreThresholdText}` : ''}</div>
        ${thresholdBreakdownText ? `<div class="feature-note">${thresholdBreakdownText}</div>` : ''}
        <div class="feature-note">Beginner note: aim for mostly PASS in setup checks, then hard gates must PASS.</div>
        ${lane === 'swing' ? '<div class="feature-note">Asia breakout is intraday-only, so it is hidden on Swing tab.</div>' : ''}
        ${blockedReason ? `<div class="feature-note">Blocked reason: ${blockedReason}</div>` : ''}
      </div>
    `;
  };

  const resolveAdaptiveExits = () => {
    const laneData = getLaneData(activeLane);
    const fromLane = laneData?.conditions_met?.adaptive_exits;
    if (fromLane && typeof fromLane === 'object') return fromLane;
    return getCandidate(activeLane, 'BUY')?.conditions_met?.adaptive_exits
      || getCandidate(activeLane, 'SELL')?.conditions_met?.adaptive_exits
      || null;
  };

  const adaptive = resolveAdaptiveExits();
  const adaptiveText = adaptive
    ? `Hybrid stop: ATR ${Number(adaptive.atr_stop_dist || 0).toFixed(2)} vs Structure ${Number(adaptive.structure_stop_dist || 0).toFixed(2)} | Regime: ${adaptive.regime || '--'} | Session mult (TP/SL): ${Number(adaptive.session_tp_mult || 1).toFixed(2)}/${Number(adaptive.session_stop_mult || 1).toFixed(2)}`
    : 'Hybrid stop transparency: waiting for adaptive exit payload.';

  container.innerHTML = `
    <div class="conditions-tabs" role="tablist" aria-label="Condition lanes">
      ${lanes.map((lane) => `
        <button type="button" class="conditions-tab ${lane === activeLane ? 'active' : ''}" data-lane="${lane}" role="tab" aria-selected="${lane === activeLane}">
          ${laneLabel(lane)}
        </button>
      `).join('')}
    </div>
    ${!['ACTIVE', 'IN_TRADE'].includes(String(getLaneData(activeLane)?.decision_state || '').toUpperCase())
      ? '<div class="feature-note feature-note--warning">No active trade now. BUY/SELL below are setup checks only.</div>'
      : ''}
    <div class="feature-note">${adaptiveText}</div>
    <div class="conditions-dual">
      ${renderSidePanel(activeLane, 'BUY')}
      ${renderSidePanel(activeLane, 'SELL')}
    </div>
  `;

  container.querySelectorAll('.conditions-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lane = String(btn.dataset.lane || '').toLowerCase();
      if (!lanes.includes(lane)) return;
      setSelectedSignalLane(lane);
      renderConditions(decisionRun, snapshot, lane);
    });
  });
}

function renderNewsBanner(events) {
  const banner = document.getElementById('news-banner');
  if (!banner) return;

  if (!events || events.length === 0) {
    banner.classList.remove('visible');
    return;
  }

  const nextHighUsd = events.find((e) => (e.currency || '').toUpperCase() === 'USD' && (e.impact || '').toUpperCase() === 'HIGH');
  if (!nextHighUsd) {
    banner.classList.remove('visible');
    return;
  }

  const next = nextHighUsd;
  const time = new Date(next.event_date);
  const diff = time.getTime() - Date.now();
  const mins = Math.floor(diff / 60000);

  if (mins > 0 && mins <= 120) {
    banner.classList.add('visible');
    const textEl = banner.querySelector('.news-banner__text');
    const timeEl = banner.querySelector('.news-banner__time');
    if (textEl) textEl.textContent = `${next.event_name} (${next.impact})`;
    if (timeEl) timeEl.textContent = mins <= 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  } else {
    banner.classList.remove('visible');
  }
}

function renderHistory(signals) {
  const container = document.getElementById('history-list');
  if (!container) return;
  const visibleSignals = Array.isArray(signals)
    ? signals.filter((s) => String(s.status || '').toUpperCase() !== 'REJECTED')
    : [];

  if (!visibleSignals || visibleSignals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">No signal history yet</div>
        <div class="empty-state__sub">Active, breakeven, expired, TP, and SL signals will appear here.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = visibleSignals.map((s) => {
    const type = s.signal_type || s.type || 'WAIT';
    const entry = parseFloat(s.entry_price) || 0;
    const conf = s.confidence || 0;
    const score = Number(s.score_total || 0).toFixed(1);
    const lane = (s.lane || 'intraday').toUpperCase();
    const blockedReason = s.blocked_reason || '';
    const time = formatMalaysiaTime(s.created_at);
    const statusRaw = String(s.status || 'ACTIVE').toUpperCase();
    const status = statusRaw.replace(/_/g, ' ');

    let statusCls = 'active';
    if (statusRaw.startsWith('HIT_TP')) statusCls = 'hit-tp';
    if (statusRaw === 'HIT_SL') statusCls = 'hit-sl';
    if (statusRaw === 'BREAKEVEN' || statusRaw === 'EXPIRED') statusCls = 'expired';

    return `
      <div class="history-item">
        <div class="history-item__type ${type.toLowerCase()}">${type}</div>
        <div class="history-item__info">
          <div class="history-item__entry">$${entry.toFixed(2)}</div>
          <div class="history-item__meta">${time} | ${lane} | Score ${score}</div>
          ${blockedReason ? `<div class="history-item__meta">Reason: ${blockedReason}</div>` : ''}
        </div>
        <div class="history-item__right">
          <div class="history-item__status ${statusCls}">${status}</div>
          <div class="history-item__conf">${conf}% conf</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderEvents(events) {
  const container = document.getElementById('events-list');
  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:24px;">
        <div class="empty-state__sub">No upcoming events in the next 7 days</div>
      </div>
    `;
    return;
  }

  container.innerHTML = events.map((e) => {
    const time = formatMalaysiaTime(e.event_date, true);
    const impact = (e.impact || '--').toUpperCase();
    const currency = (e.currency || '--').toUpperCase();
    return `
      <div class="history-item">
        <div class="history-item__info">
          <div class="history-item__entry">${e.event_name}</div>
          <div class="history-item__meta">${time} | ${currency}</div>
        </div>
        <div class="history-item__right">
          <div class="history-item__status ${impact === 'HIGH' ? 'hit-sl' : impact === 'MEDIUM' ? 'active' : 'expired'}">${impact}</div>
        </div>
      </div>
    `;
  }).join('');
}

function getPolymarketStatusText(market) {
  if (String(market?.status || '').includes('resolved')) return 'RESOLVED';
  if (String(market?.status || '').includes('closed')) return 'CLOSED';
  return 'ACTIVE';
}

function getPolymarketStatusClass(market) {
  if (String(market?.status || '').includes('resolved')) return 'status-resolved';
  if (String(market?.status || '').includes('closed')) return 'status-closed';
  return 'status-active';
}

function getPolymarketCategoryLabel(market) {
  const categories = Array.isArray(market?.categories) ? market.categories : [];
  const primary = categories.find((category) => !['all', 'trending', 'breaking', 'new'].includes(category))
    || market?.category
    || 'other';
  return POLY_LABELS[primary] || String(primary || 'Other').toUpperCase();
}

function getPolymarketEndText(market) {
  if (!market?.endDate) return '--';
  if (Number.isFinite(market.hoursUntil) && market.hoursUntil >= 0) {
    return market.hoursUntil < 24 ? `${market.hoursUntil.toFixed(1)}h left` : `${Math.ceil(market.hoursUntil / 24)}d left`;
  }
  if (Number.isFinite(market.hoursUntil) && market.hoursUntil < 0) return 'Ended';
  return formatMalaysiaTime(market.endDate, true);
}

function buildPolymarketHistoryChartMarkup(historyRows = [], market = null) {
  const rows = Array.isArray(historyRows) ? historyRows : [];
  const points = rows.map((row) => {
    const yes = clamp01To100(normalizePercent(row?.yes_price ?? row?.probability));
    const ts = toMillisUi(row?.provider_ts || row?.created_at || row?.updated_at || row?.captured_at);
    return Number.isFinite(yes) && Number.isFinite(ts) ? { yes, ts } : null;
  }).filter(Boolean).sort((a, b) => a.ts - b.ts);

  if (!points.length && market && Number.isFinite(market.yesPct)) {
    points.push({ yes: market.yesPct, ts: toMillisUi(market.provider_ts) || Date.now() });
  }

  if (points.length < 2) {
    const single = points[0];
    return `
      <div class="poly-detail-history__empty">
        <div class="feature-note">${single ? `Latest probability snapshot: ${single.yes.toFixed(1)}% YES.` : 'Probability history will appear once snapshots are available.'}</div>
      </div>
    `;
  }

  const width = 760;
  const height = 220;
  const padX = 10;
  const padY = 14;
  const minTs = points[0].ts;
  const maxTs = points[points.length - 1].ts;
  const spanTs = Math.max(1, maxTs - minTs);
  const polyline = points.map((point) => {
    const x = padX + ((point.ts - minTs) / spanTs) * (width - padX * 2);
    const y = padY + ((100 - point.yes) / 100) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const latest = points[points.length - 1];
  const earliest = points[0];
  const high = points.reduce((max, point) => Math.max(max, point.yes), -Infinity);
  const low = points.reduce((min, point) => Math.min(min, point.yes), Infinity);
  const delta = latest.yes - earliest.yes;
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts`;

  return `
    <div class="poly-detail-history">
      <div class="poly-detail-history__stats">
        <span>Latest ${latest.yes.toFixed(1)}%</span>
        <span>High ${high.toFixed(1)}%</span>
        <span>Low ${low.toFixed(1)}%</span>
        <span>${deltaLabel}</span>
      </div>
      <svg viewBox="0 0 ${width} ${height}" class="poly-detail-history__chart" role="img" aria-label="Probability history chart">
        <defs>
          <linearGradient id="poly-history-line" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stop-color="#39c17f"></stop>
            <stop offset="100%" stop-color="#2d8cff"></stop>
          </linearGradient>
        </defs>
        <line x1="${padX}" y1="${height / 2}" x2="${width - padX}" y2="${height / 2}" class="poly-detail-history__midline"></line>
        <polyline points="${polyline}" class="poly-detail-history__line"></polyline>
      </svg>
      <div class="poly-detail-history__axis">
        <span>${escapeHtml(formatMalaysiaTime(minTs, true))}</span>
        <span>${escapeHtml(formatMalaysiaTime(maxTs, true))}</span>
      </div>
    </div>
  `;
}

function renderPolymarketDashboard(btcTick, feedOrMarkets) {
  try {
    if (btcTick !== undefined) {
      polymarketState.btcTick = btcTick || null;
    }
    if (feedOrMarkets !== undefined) {
      if (Array.isArray(feedOrMarkets)) {
        const nextMarkets = feedOrMarkets.map(normalizePolymarketRow).filter(Boolean);
        if (nextMarkets.length || !Array.isArray(polymarketState.markets) || !polymarketState.markets.length) {
          polymarketState.markets = nextMarkets;
        }
        polymarketState.fallbackMarkets = nextMarkets;
        if (!polymarketState.slices || typeof polymarketState.slices !== 'object') {
          polymarketState.slices = { trending: [], breaking: [], new: [] };
        }
        polymarketState.feedStatus = {
          ...polymarketState.feedStatus,
          sourceMode: 'fallback',
          sourceLabel: 'Supabase cache',
        };
      } else if (feedOrMarkets && typeof feedOrMarkets === 'object') {
        const feed = feedOrMarkets;
        const nextMarkets = Array.isArray(feed.markets) ? feed.markets.map(normalizePolymarketRow).filter(Boolean) : [];
        const previousSlices = polymarketState.slices && typeof polymarketState.slices === 'object'
          ? polymarketState.slices
          : { trending: [], breaking: [], new: [] };
        const nextSlices = {
          trending: Array.isArray(feed.slices?.trending) ? feed.slices.trending.map(normalizePolymarketRow).filter(Boolean) : [],
          breaking: Array.isArray(feed.slices?.breaking) ? feed.slices.breaking.map(normalizePolymarketRow).filter(Boolean) : [],
          new: Array.isArray(feed.slices?.new) ? feed.slices.new.map(normalizePolymarketRow).filter(Boolean) : [],
        };
        polymarketState.fallbackMarkets = Array.isArray(feed.fallbackMarkets)
          ? feed.fallbackMarkets.map(normalizePolymarketRow).filter(Boolean)
          : (polymarketState.fallbackMarkets || []);
        if (nextMarkets.length || !Array.isArray(polymarketState.markets) || !polymarketState.markets.length) {
          polymarketState.markets = nextMarkets;
        }
        polymarketState.slices = {
          trending: nextSlices.trending.length ? nextSlices.trending : (previousSlices.trending || []),
          breaking: nextSlices.breaking.length ? nextSlices.breaking : (previousSlices.breaking || []),
          new: nextSlices.new.length ? nextSlices.new : (previousSlices.new || []),
        };
        polymarketState.feedStatus = {
          liveOk: Boolean(feed.liveOk),
          fallbackUsed: Boolean(feed.fallbackUsed),
          sourceMode: String(feed.sourceMode || 'idle'),
          sourceLabel: String(feed.sourceLabel || 'Waiting for live feed'),
          fetchedAt: feed.fetchedAt || null,
          error: String(feed.error || ''),
        };
      }
    }

  const activeBtc = polymarketState.btcTick;
  const rawMarkets = Array.isArray(polymarketState.markets) ? polymarketState.markets : [];
  const fallbackMarkets = Array.isArray(polymarketState.fallbackMarkets) ? polymarketState.fallbackMarkets : [];
  const renderableMarkets = (rawMarkets.length ? rawMarkets : fallbackMarkets).filter(Boolean);
  const categorizedMarkets = renderableMarkets.filter((row) => Array.isArray(row.categories) && row.categories.some((cat) => POLY_CATEGORIES.includes(cat) && cat !== 'all'));
  const unmatchedCount = Math.max(0, renderableMarkets.length - categorizedMarkets.length);
  const sorters = {
    volume: (a, b) => (Number(b.volume) || -Infinity) - (Number(a.volume) || -Infinity),
    liquidity: (a, b) => (Number(b.liquidity) || -Infinity) - (Number(a.liquidity) || -Infinity),
    ending: (a, b) => {
      const ah = Number.isFinite(a.hoursUntil) && a.hoursUntil >= 0 ? a.hoursUntil : Infinity;
      const bh = Number.isFinite(b.hoursUntil) && b.hoursUntil >= 0 ? b.hoursUntil : Infinity;
      return ah - bh;
    },
    probability: (a, b) => {
      const av = Number.isFinite(a.yesPct) ? Math.max(a.yesPct, 100 - a.yesPct) : -Infinity;
      const bv = Number.isFinite(b.yesPct) ? Math.max(b.yesPct, 100 - b.yesPct) : -Infinity;
      return bv - av;
    },
    recent: (a, b) => (toMillisUi(b.provider_ts) || 0) - (toMillisUi(a.provider_ts) || 0),
  };
  const allActiveMarkets = renderableMarkets.filter((market) => isPolymarketActiveStatus(market.status)).slice().sort(sorters.volume);
  const breakingFallback = allActiveMarkets.filter((market) => {
    const text = `${market.title} ${(market.categories || []).join(' ')} ${market.rawCategory || ''}`.toLowerCase();
    return (market.categories || []).includes('breaking') || /(breaking|urgent|headline|flash|developing|war|ceasefire|meeting|tariff|fed|rate cut|diplomatic|summit)/.test(text);
  }).slice(0, 8);
  const newFallback = allActiveMarkets.slice().sort(sorters.recent).slice(0, 12);
  const trendingSlice = (polymarketState.slices.trending.length ? polymarketState.slices.trending : allActiveMarkets.slice(0, 24)).slice().sort(sorters.volume);
  const breakingSlice = (polymarketState.slices.breaking.length ? polymarketState.slices.breaking : breakingFallback).slice().sort(sorters.volume);
  const newSlice = (polymarketState.slices.new.length ? polymarketState.slices.new : newFallback).slice().sort(sorters.recent);
  const selectedSlug = getSelectedPolymarketMarketSlug();

  const activeCategory = polymarketState.category;
  const activeSort = polymarketState.sort;
  const activeQuery = polymarketState.query;
  const activeView = polymarketState.view;
  const activeBetType = polymarketState.betType;

  const tabButtons = Array.from(document.querySelectorAll('#polymarket-tabs .poly-tab'));
  const viewButtons = Array.from(document.querySelectorAll('#polymarket-view-nav .poly-view-tab'));
  const categoryCounts = {
    all: renderableMarkets.length,
    trending: trendingSlice.length,
    breaking: breakingSlice.length,
    new: newSlice.length,
  };
  categorizedMarkets.forEach((market) => {
    const categories = Array.isArray(market.categories) ? market.categories : [];
    categories.forEach((category) => {
      if (POLY_CATEGORIES.includes(category) && !['all', 'trending', 'breaking', 'new'].includes(category)) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
  });
  tabButtons.forEach((btn) => {
    const category = String(btn.dataset.category || 'all').toLowerCase();
    const isActive = category === activeCategory;
    const baseLabel = btn.dataset.baseLabel || btn.textContent.trim();
    btn.dataset.baseLabel = baseLabel;
    setAnimatedButtonCount(btn, `poly-tab:${category}`, baseLabel, Number(categoryCounts[category] || 0));
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  const categoryPools = {
    all: renderableMarkets.slice(),
    trending: trendingSlice.slice(),
    breaking: breakingSlice.slice(),
    new: newSlice.slice(),
    politics: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('politics')),
    crypto: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('crypto')),
    finance: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('finance')),
    geopolitics: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('geopolitics')),
    oil: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('oil')),
    xauusd: categorizedMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes('xauusd')),
  };
  const filterByQuery = (markets) => {
    if (!activeQuery) return markets.slice();
    return markets.filter((market) => {
      const haystack = `${market.title} ${market.category} ${(market.categories || []).join(' ')} ${market.status} ${market.marketType}`.toLowerCase();
      return haystack.includes(activeQuery);
    });
  };
  const filterByBetType = (markets) => {
    if (!activeBetType || activeBetType === 'all') return markets.slice();
    return markets.filter((market) => market.marketType === activeBetType);
  };
  const canonicalBaseMarkets = filterByBetType(filterByQuery(categoryPools[activeCategory] || categoryPools.all));

  const viewCounts = {
    all: canonicalBaseMarkets.length,
    active: filterPolymarketByView(canonicalBaseMarkets, 'active').length,
    ending: filterPolymarketByView(canonicalBaseMarkets, 'ending').length,
    resolved: filterPolymarketByView(canonicalBaseMarkets, 'resolved').length,
  };
  viewButtons.forEach((btn) => {
    const view = String(btn.dataset.view || 'all').toLowerCase();
    const isActive = view === activeView;
    const baseLabel = btn.dataset.baseLabel || btn.textContent.trim();
    btn.dataset.baseLabel = baseLabel;
    setAnimatedButtonCount(btn, `poly-view:${view}`, baseLabel, Number(viewCounts[view] || 0));
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  const visibleMarkets = filterPolymarketByView(canonicalBaseMarkets, activeView).slice().sort(sorters[activeSort] || sorters.volume);
  const featuredMarket = visibleMarkets.find((market) => isPolymarketActiveStatus(market.status))
    || canonicalBaseMarkets.find((market) => isPolymarketActiveStatus(market.status))
    || visibleMarkets[0]
    || canonicalBaseMarkets[0]
    || allActiveMarkets[0]
    || renderableMarkets[0]
    || null;
  const spotlightSource = visibleMarkets.length
    ? visibleMarkets
    : canonicalBaseMarkets.length
      ? canonicalBaseMarkets
      : (activeCategory === 'breaking' ? breakingSlice : activeCategory === 'new' ? newSlice : trendingSlice);
  const spotlightMarkets = spotlightSource
    .filter((market) => !featuredMarket || market.market_slug !== featuredMarket.market_slug)
    .slice(0, 4);
  const selectedMarket = selectedSlug
    ? (renderableMarkets.find((market) => market.market_slug === selectedSlug)
      || trendingSlice.find((market) => market.market_slug === selectedSlug)
      || breakingSlice.find((market) => market.market_slug === selectedSlug)
      || newSlice.find((market) => market.market_slug === selectedSlug)
      || null)
    : null;
  const topicRows = POLY_CATEGORIES
    .filter((category) => !['all', 'trending', 'breaking', 'new'].includes(category))
    .map((category) => {
      const rows = allActiveMarkets.filter((market) => Array.isArray(market.categories) && market.categories.includes(category));
      return {
        category,
        label: POLY_LABELS[category] || category,
        count: rows.length,
        volume: rows.reduce((sum, row) => sum + (Number.isFinite(row.volume) ? row.volume : 0), 0),
      };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || b.volume - a.volume)
    .slice(0, 6);

  const btcPriceEl = document.getElementById('polymarket-btc-price');
  const btcChangeEl = document.getElementById('polymarket-btc-change');
  const syncEl = document.getElementById('polymarket-last-sync');
  const livePillEl = document.getElementById('polymarket-live-pill');
  const kpiCountEl = document.getElementById('polymarket-kpi-count');
  const kpiVolEl = document.getElementById('polymarket-kpi-volume');
  const kpiEndingEl = document.getElementById('polymarket-kpi-ending');
  const diagnosticsEl = document.getElementById('polymarket-diagnostics');
  const listEl = document.getElementById('polymarket-markets-list');
  const breakingEl = document.getElementById('polymarket-breaking-list');
  const hotTopicsEl = document.getElementById('polymarket-hot-topics');
  const featuredEl = document.getElementById('polymarket-featured-market');
  const spotlightEl = document.getElementById('polymarket-spotlight-strip');
  const detailBackdrop = document.getElementById('polymarket-detail-backdrop');
  const detailSheet = document.getElementById('polymarket-detail-sheet');
  const detailTitleEl = document.getElementById('polymarket-detail-title');
  const detailBodyEl = document.getElementById('polymarket-detail-body');
  const detailPageEl = document.getElementById('page-polymarket-detail');
  const detailPageTitleEl = document.getElementById('polymarket-detail-page-title');
  const detailPageBodyEl = document.getElementById('polymarket-detail-page-body');

  if (btcPriceEl) {
    if (!activeBtc || !Number.isFinite(Number(activeBtc.price))) {
      setAnimatedContent(btcPriceEl, 'poly:btc:price', '$--');
      btcPriceEl.className = 'polymarket-btc__price';
    } else {
      const price = Number(activeBtc.price);
      const change24h = Number(activeBtc.change_24h ?? activeBtc.change24h);
      btcPriceEl.className = `polymarket-btc__price ${Number.isFinite(change24h) ? (change24h >= 0 ? 'up' : 'down') : ''}`.trim();
      setAnimatedContent(btcPriceEl, 'poly:btc:price', `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, { numericValue: price });
    }
  }
  if (btcChangeEl) {
    if (!activeBtc) {
      setAnimatedContent(btcChangeEl, 'poly:btc:change', 'Waiting for feed...');
    } else {
      const change24h = Number(activeBtc.change_24h ?? activeBtc.change24h);
      if (Number.isFinite(change24h)) {
        const sign = change24h >= 0 ? '+' : '-';
        const icon = change24h >= 0 ? '\u25B2' : '\u25BC';
        setAnimatedContent(btcChangeEl, 'poly:btc:change', `${icon} ${sign}${Math.abs(change24h).toFixed(2)}% (24h)`, { numericValue: change24h });
      } else {
        setAnimatedContent(btcChangeEl, 'poly:btc:change', '24h change unavailable');
      }
    }
  }
  if (syncEl) {
    const ts = polymarketState.feedStatus.fetchedAt || activeBtc?.provider_ts || activeBtc?.created_at || null;
    syncEl.textContent = ts ? `Last sync: ${formatMalaysiaTime(ts, true)}` : 'Last sync: --';
  }
  if (livePillEl) {
    livePillEl.textContent = polymarketState.feedStatus.sourceLabel || 'Live Gamma';
    livePillEl.classList.remove('poly-live-pill--fallback', 'poly-live-pill--stale');
    if (polymarketState.feedStatus.sourceMode === 'fallback') {
      livePillEl.classList.add('poly-live-pill--fallback');
    } else if (['stale', 'error'].includes(polymarketState.feedStatus.sourceMode)) {
      livePillEl.classList.add('poly-live-pill--stale');
    }
  }

  setAnimatedContent(kpiCountEl, 'poly:kpi:count', String(visibleMarkets.length), { numericValue: visibleMarkets.length });
  setAnimatedContent(
    kpiVolEl,
    'poly:kpi:volume',
    formatCompactUsd(visibleMarkets.reduce((sum, market) => sum + (Number.isFinite(market.volume) ? market.volume : 0), 0)),
    { numericValue: visibleMarkets.reduce((sum, market) => sum + (Number.isFinite(market.volume) ? market.volume : 0), 0) }
  );
  setAnimatedContent(
    kpiEndingEl,
    'poly:kpi:ending',
    String(visibleMarkets.filter((market) => isPolymarketActiveStatus(market.status) && Number.isFinite(market.hoursUntil) && market.hoursUntil >= 0 && market.hoursUntil <= 48).length),
    { numericValue: visibleMarkets.filter((market) => isPolymarketActiveStatus(market.status) && Number.isFinite(market.hoursUntil) && market.hoursUntil >= 0 && market.hoursUntil <= 48).length }
  );
  if (diagnosticsEl) {
    diagnosticsEl.textContent = `${buildPolymarketFreshnessSummary(polymarketState.feedStatus)} | Loaded ${categorizedMarkets.length} mapped markets | ${unmatchedCount} unmatched`;
  }

  if (getDashboardMode() === 'polymarket') {
    const headerPrice = document.getElementById('header-price');
    const headerChange = document.getElementById('header-change');
    if (headerPrice) {
      if (activeBtc && Number.isFinite(Number(activeBtc.price))) {
        const price = Number(activeBtc.price);
        const chg = Number(activeBtc.change_24h ?? activeBtc.change24h);
        headerPrice.className = `topbar__price ${Number.isFinite(chg) ? (chg >= 0 ? 'up' : 'down') : 'neutral'}`;
        setAnimatedContent(headerPrice, 'poly:topbar:price', `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, { numericValue: price });
      } else {
        headerPrice.className = 'topbar__price neutral';
        setAnimatedContent(headerPrice, 'poly:topbar:price', '$--');
      }
    }
    if (headerChange) {
      if (activeBtc) {
        const chg = Number(activeBtc.change_24h ?? activeBtc.change24h);
        const ts = polymarketState.feedStatus.fetchedAt || activeBtc.provider_ts || activeBtc.created_at;
        const age = ts ? `Updated ${formatMalaysiaTime(ts, true)}` : 'Updated --';
        setAnimatedContent(
          headerChange,
          'poly:topbar:change',
          Number.isFinite(chg) ? `BTC 24h: ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% | ${age}` : `BTC 24h: -- | ${age}`,
          { numericValue: chg }
        );
      } else {
        setAnimatedContent(headerChange, 'poly:topbar:change', 'Waiting for BTC feed');
      }
    }
  }

  const iconByCategory = {
    trending: 'Tr',
    breaking: 'Br',
    new: 'Nw',
    politics: 'Po',
    crypto: '₿',
    finance: 'Fi',
    oil: 'Oi',
    geopolitics: 'Ge',
    xauusd: 'Au',
  };
  const buildMarketTriggerAttr = (market) => `data-poly-open-market="${escapeHtml(market.market_slug)}"`;
  const buildProbabilityCells = (market, keyPrefix, size = 'default') => {
    const yesPctText = Number.isFinite(market.yesPct) ? `${market.yesPct.toFixed(size === 'featured' ? 0 : 1)}%` : '--';
    const noPctText = Number.isFinite(market.noPct) ? `${market.noPct.toFixed(size === 'featured' ? 0 : 1)}%` : '--';
    const yesText = Number.isFinite(market.yesPct) ? `${Math.round(market.yesPct)}c` : '--';
    const noText = Number.isFinite(market.noPct) ? `${Math.round(market.noPct)}c` : '--';
    return {
      yesPctText,
      noPctText,
      yesText,
      noText,
      yesPctMarkup: buildAnimatedInlineMarkup(`${keyPrefix}:yes-pct`, yesPctText, market.yesPct, 'span', size === 'featured' ? 'poly-featured-odd__pct' : 'poly-odd__pct'),
      noPctMarkup: buildAnimatedInlineMarkup(`${keyPrefix}:no-pct`, noPctText, market.noPct, 'span', size === 'featured' ? 'poly-featured-odd__pct' : 'poly-odd__pct'),
      yesValueMarkup: buildAnimatedInlineMarkup(`${keyPrefix}:yes-value`, yesText, market.yesPct, 'span', size === 'featured' ? 'poly-featured-odd__value' : 'poly-odd__value'),
      noValueMarkup: buildAnimatedInlineMarkup(`${keyPrefix}:no-value`, noText, market.noPct, 'span', size === 'featured' ? 'poly-featured-odd__value' : 'poly-odd__value'),
    };
  };
  const buildPolymarketDetailBodyMarkup = (market) => {
    if (!market) {
      return '<div class="feature-note">Choose a market card to inspect its detail.</div>';
    }
    const categoryLine = (market.categories || [])
      .filter((category) => category !== 'all')
      .map((category) => POLY_LABELS[category] || category)
      .join(' • ');
    const historyRows = polymarketState.historyBySlug[market.market_slug] || [];
    const detailOdds = buildProbabilityCells(market, `poly:detail:${market.market_slug}`, 'featured');
    return `
      <section class="poly-detail-section">
        <div class="poly-detail-badges">
          <span class="polymarket-card__status ${getPolymarketStatusClass(market)}">${getPolymarketStatusText(market)}</span>
          <span class="poly-detail-chip">${escapeHtml(categoryLine || getPolymarketCategoryLabel(market))}</span>
          <span class="poly-detail-chip">${escapeHtml(POLY_MARKET_TYPE_LABELS[market.marketType] || 'General')}</span>
          <span class="poly-detail-chip">${escapeHtml(getPolymarketEndText(market))}</span>
        </div>
        <div class="poly-detail-odds">
          <div class="poly-featured-odd poly-featured-odd--yes">
            <span class="poly-featured-odd__name">Yes</span>
            ${detailOdds.yesPctMarkup}
            ${detailOdds.yesValueMarkup}
          </div>
          <div class="poly-featured-odd poly-featured-odd--no">
            <span class="poly-featured-odd__name">No</span>
            ${detailOdds.noPctMarkup}
            ${detailOdds.noValueMarkup}
          </div>
        </div>
      </section>
      <section class="poly-detail-section poly-detail-grid">
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Volume</span>
          <strong>${formatCompactUsd(market.volume)}</strong>
        </div>
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Liquidity</span>
          <strong>${formatCompactUsd(market.liquidity)}</strong>
        </div>
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Last sync</span>
          <strong>${escapeHtml(formatMalaysiaTime(market.provider_ts || polymarketState.feedStatus.fetchedAt, true) || '--')}</strong>
        </div>
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Source</span>
          <strong>${escapeHtml(polymarketState.feedStatus.sourceLabel || 'Live Gamma')}</strong>
        </div>
      </section>
      <section class="poly-detail-section">
        <div class="poly-detail-section__title">Probability history</div>
        ${buildPolymarketHistoryChartMarkup(historyRows, market)}
      </section>
      <section class="poly-detail-section poly-detail-grid">
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Market slug</span>
          <strong>${escapeHtml(market.market_slug)}</strong>
        </div>
        <div class="poly-detail-stat">
          <span class="poly-detail-stat__label">Display freshness</span>
          <strong>${escapeHtml(buildPolymarketFreshnessSummary(polymarketState.feedStatus))}</strong>
        </div>
      </section>
    `;
  };

  if (breakingEl) {
    if (!breakingSlice.length) {
      breakingEl.innerHTML = '<div class="feature-note">No breaking markets yet.</div>';
    } else {
      breakingEl.innerHTML = breakingSlice.slice(0, 6).map((market, index) => `
        <article class="poly-side-item poly-market-trigger" ${buildMarketTriggerAttr(market)}>
          <span class="poly-side-item__rank">${index + 1}</span>
          <div class="poly-side-item__body">
            <div class="poly-side-item__title">${escapeHtml(market.title)}</div>
            <div class="poly-side-item__meta">${escapeHtml(getPolymarketCategoryLabel(market))} | ${escapeHtml(formatCompactUsd(market.volume))}</div>
          </div>
          ${buildAnimatedInlineMarkup(`poly:breaking:${market.market_slug}:yes`, Number.isFinite(market.yesPct) ? `${market.yesPct.toFixed(0)}%` : '--', market.yesPct, 'span', 'poly-side-item__prob')}
        </article>
      `).join('');
      applyAnimatedValues(breakingEl);
    }
  }

  if (hotTopicsEl) {
    if (!topicRows.length) {
      hotTopicsEl.innerHTML = '<div class="feature-note">Topics will appear here automatically.</div>';
    } else {
      hotTopicsEl.innerHTML = topicRows.map((topic) => `
        <button type="button" class="poly-topic-card ${topic.category === activeCategory ? 'active' : ''}" data-poly-topic="${topic.category}">
          <span class="poly-topic-card__label">${escapeHtml(topic.label)}</span>
          <span class="poly-topic-card__meta">${topic.count} mkts | ${escapeHtml(formatCompactUsd(topic.volume))}</span>
        </button>
      `).join('');
      hotTopicsEl.querySelectorAll('[data-poly-topic]').forEach((btn) => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => {
          setPolymarketCategory(btn.dataset.polyTopic || 'all');
          renderPolymarketDashboard();
        });
      });
    }
  }

  if (featuredEl) {
    if (!featuredMarket) {
      featuredEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">No featured market yet</div>
          <div class="empty-state__sub">Try another category or wait for the next refresh.</div>
        </div>
      `;
    } else {
      const odds = buildProbabilityCells(featuredMarket, `poly:featured:${featuredMarket.market_slug}`, 'featured');
      const categoryLine = (featuredMarket.categories || [])
        .filter((category) => category !== 'all')
        .slice(0, 3)
        .map((category) => POLY_LABELS[category] || category)
        .join(' • ');
      featuredEl.innerHTML = `
        <article class="poly-featured-card__panel poly-market-trigger" ${buildMarketTriggerAttr(featuredMarket)}>
          <div class="poly-featured-card__head">
            <div>
              <div class="poly-featured-card__eyebrow">${escapeHtml(categoryLine || getPolymarketCategoryLabel(featuredMarket))}</div>
              <h3 class="poly-featured-card__title">${escapeHtml(featuredMarket.title)}</h3>
            </div>
            <span class="polymarket-card__status ${getPolymarketStatusClass(featuredMarket)}">${getPolymarketStatusText(featuredMarket)}</span>
          </div>
          <div class="poly-featured-card__body">
            <div class="poly-featured-card__pricing">
              <div class="poly-featured-stat">
                <span class="poly-featured-stat__label">Volume</span>
                <span class="poly-featured-stat__value">${formatCompactUsd(featuredMarket.volume)}</span>
              </div>
              <div class="poly-featured-stat">
                <span class="poly-featured-stat__label">Liquidity</span>
                <span class="poly-featured-stat__value">${formatCompactUsd(featuredMarket.liquidity)}</span>
              </div>
              <div class="poly-featured-stat">
                <span class="poly-featured-stat__label">Ends</span>
                <span class="poly-featured-stat__value">${escapeHtml(getPolymarketEndText(featuredMarket))}</span>
              </div>
            </div>
            <div class="poly-featured-odds">
              <div class="poly-featured-odd poly-featured-odd--yes">
                <span class="poly-featured-odd__name">Yes</span>
                ${odds.yesPctMarkup}
                ${odds.yesValueMarkup}
              </div>
              <div class="poly-featured-odd poly-featured-odd--no">
                <span class="poly-featured-odd__name">No</span>
                ${odds.noPctMarkup}
                ${odds.noValueMarkup}
              </div>
            </div>
          </div>
        </article>
      `;
      applyAnimatedValues(featuredEl);
    }
  }

  if (spotlightEl) {
    if (!spotlightMarkets.length) {
      spotlightEl.innerHTML = '<div class="feature-note">More spotlight markets will appear here.</div>';
    } else {
      spotlightEl.innerHTML = spotlightMarkets.map((market) => `
        <article class="poly-spotlight-card poly-market-trigger" ${buildMarketTriggerAttr(market)}>
          <div class="poly-spotlight-card__cat">${escapeHtml(getPolymarketCategoryLabel(market))}</div>
          <div class="poly-spotlight-card__title">${escapeHtml(market.title)}</div>
          <div class="poly-spotlight-card__meta">${escapeHtml(getPolymarketStatusText(market))} | ${escapeHtml(formatCompactUsd(market.volume))}</div>
          ${buildAnimatedInlineMarkup(`poly:spotlight:${market.market_slug}:yes`, Number.isFinite(market.yesPct) ? `${market.yesPct.toFixed(1)}% YES` : '--', market.yesPct, 'div', 'poly-spotlight-card__prob')}
        </article>
      `).join('');
      applyAnimatedValues(spotlightEl);
    }
  }

  if (!listEl) return;
  if (!visibleMarkets.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__title">No markets in this tab yet</div>
        <div class="empty-state__sub">Try another category, clear search, or wait for the next refresh.</div>
      </div>
    `;
  } else {
    const top = visibleMarkets.slice(0, Math.max(12, polymarketState.renderCount || 60));
    listEl.innerHTML = top.map((market) => {
      const leadCategory = (market.categories || []).find((category) => iconByCategory[category]) || market.category;
      const categoryIcon = iconByCategory[leadCategory] || 'Mk';
      const typeLabel = POLY_MARKET_TYPE_LABELS[market.marketType] || 'General';
      const probWidth = Number.isFinite(market.yesPct) ? Math.max(2, Math.min(98, market.yesPct)) : 50;
      const odds = buildProbabilityCells(market, `poly:grid:${market.market_slug}`);
      return `
        <article class="polymarket-card poly-market-trigger" ${buildMarketTriggerAttr(market)}>
          <div class="polymarket-card__head">
            <div class="polymarket-card__asset">${escapeHtml(categoryIcon)}</div>
            <div class="polymarket-card__title-wrap">
              <div class="polymarket-card__title">${escapeHtml(market.title)}</div>
              <div class="polymarket-card__catline">${escapeHtml(getPolymarketCategoryLabel(market))} | ${escapeHtml(typeLabel)}</div>
            </div>
            <span class="polymarket-card__status ${getPolymarketStatusClass(market)}">${getPolymarketStatusText(market)}</span>
          </div>
          <div class="polymarket-card__odds">
            <div class="poly-odd poly-odd--yes">
              <div class="poly-odd__label">Yes</div>
              ${odds.yesValueMarkup}
              ${odds.yesPctMarkup}
            </div>
            <div class="poly-odd poly-odd--no">
              <div class="poly-odd__label">No</div>
              ${odds.noValueMarkup}
              ${odds.noPctMarkup}
            </div>
          </div>
          <div class="poly-prob-row">
            <span>YES probability: ${escapeHtml(odds.yesPctText)}</span>
            <span>NO probability: ${escapeHtml(odds.noPctText)}</span>
          </div>
          <div class="poly-prob-track" aria-label="Yes probability">
            <span class="poly-prob-fill" style="width:${probWidth.toFixed(1)}%"></span>
          </div>
          <div class="polymarket-card__meta">
            <span>Volume: ${formatCompactUsd(market.volume)}</span>
            <span>Liquidity: ${formatCompactUsd(market.liquidity)}</span>
            <span>Ends: ${escapeHtml(getPolymarketEndText(market))}</span>
          </div>
        </article>
      `;
    }).join('');
    applyAnimatedValues(listEl);
  }

  document.querySelectorAll('[data-poly-open-market]').forEach((node) => {
    if (node.dataset.polyBound) return;
    node.dataset.polyBound = '1';
    if (!['BUTTON', 'A'].includes(node.tagName)) {
      node.setAttribute('tabindex', node.getAttribute('tabindex') || '0');
      node.setAttribute('role', node.getAttribute('role') || 'button');
    }
    const openMarket = () => {
      const slug = String(node.getAttribute('data-poly-open-market') || '').trim();
      if (!slug) return;
      openPolymarketDetail(slug);
    };
    node.addEventListener('click', openMarket);
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMarket();
      }
    });
  });

  const shouldOpenDetail = Boolean(selectedMarket);
  const phoneDetailMode = isPhoneDetailMode();
  const desktopDetailOpen = shouldOpenDetail && !phoneDetailMode;
  const mobileDetailOpen = shouldOpenDetail && phoneDetailMode;

  if (detailBackdrop) detailBackdrop.hidden = !desktopDetailOpen;
  if (detailSheet) {
    detailSheet.hidden = !desktopDetailOpen;
    detailSheet.setAttribute('aria-hidden', desktopDetailOpen ? 'false' : 'true');
  }
  document.body.classList.toggle('poly-detail-open', desktopDetailOpen);
  document.body.classList.toggle('poly-mobile-detail-open', mobileDetailOpen);

  if (shouldOpenDetail && selectedMarket) {
    const detailMarkup = buildPolymarketDetailBodyMarkup(selectedMarket);

    if (detailTitleEl) detailTitleEl.textContent = selectedMarket.title;
    if (detailBodyEl) {
      detailBodyEl.innerHTML = detailMarkup;
      applyAnimatedValues(detailBodyEl);
    }
    if (detailPageTitleEl) detailPageTitleEl.textContent = selectedMarket.title;
    if (detailPageBodyEl) {
      detailPageBodyEl.innerHTML = detailMarkup;
      applyAnimatedValues(detailPageBodyEl);
    }

    if (phoneDetailMode) {
      if (!detailPageEl?.classList.contains('active')) {
        setActivePage('polymarket-detail', { force: true });
      }
    } else if (detailPageEl?.classList.contains('active')) {
      setActivePage('polymarket', { force: true });
    }
  } else {
    if (detailTitleEl) detailTitleEl.textContent = 'Loading market...';
    if (detailBodyEl) detailBodyEl.innerHTML = '<div class="feature-note">Choose a market card to inspect its detail.</div>';
    if (detailPageTitleEl) detailPageTitleEl.textContent = 'Loading market...';
    if (detailPageBodyEl) detailPageBodyEl.innerHTML = '<div class="feature-note">Choose a market card to inspect its detail.</div>';

    if (detailPageEl?.classList.contains('active')) {
      setActivePage('polymarket', { force: true });
      restorePolymarketListScroll();
    }
  }
  } catch (error) {
    renderPolymarketRenderFailure(error, 'dashboard');
  }
}
function renderStats(stats) {
  if (!stats) return;

  const heroEl = document.getElementById('stats-hero');
  if (heroEl) {
    heroEl.innerHTML = `
      <div class="stats-hero__winrate">${stats.winRate}%</div>
      <div class="stats-hero__label">Win Rate (${stats.totalSignals} tradable signals) | Expectancy ${stats.expectancy ?? '--'}R</div>
      ${stats.windows ? `<div class="stats-hero__label">Rolling E: 50=${stats.windows.w50?.expectancy ?? '--'} | 100=${stats.windows.w100?.expectancy ?? '--'} | 300=${stats.windows.w300?.expectancy ?? '--'}</div>` : ''}
    `;
  }

  const gridEl = document.getElementById('stats-grid');
  if (gridEl) {
    gridEl.innerHTML = `
      <div class="stat-tile">
        <div class="stat-tile__label">Total Signals</div>
        <div class="stat-tile__value">${stats.totalSignals}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">Execution</div>
        <div class="stat-tile__value">${stats.winCount ?? 0}W / ${stats.lossCount ?? 0}L</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">Total Pips</div>
        <div class="stat-tile__value" style="color:${parseFloat(stats.totalPips) >= 0 ? 'var(--green)' : 'var(--red)'}">${stats.totalPips}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">Avg RR / Drawdown</div>
        <div class="stat-tile__value">${stats.avgRR ?? '--'} / ${stats.drawdown ?? '--'}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">Lane Win (I / S)</div>
        <div class="stat-tile__value">${stats.laneStats?.intraday?.winRate ?? '--'}% / ${stats.laneStats?.swing?.winRate ?? '--'}%</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile__label">Lane Expectancy (I / S)</div>
        <div class="stat-tile__value">${stats.laneStats?.intraday?.expectancy ?? '--'} / ${stats.laneStats?.swing?.expectancy ?? '--'}</div>
      </div>
    `;
  }

  const tpEl = document.getElementById('tp-breakdown');
  if (tpEl) {
    tpEl.innerHTML = `
      <div class="tp-bar-item"><div class="tp-bar-item__bar tp1"></div><div class="tp-bar-item__count">${stats.tp1Hits}</div><div class="tp-bar-item__label">TP1</div></div>
      <div class="tp-bar-item"><div class="tp-bar-item__bar tp2"></div><div class="tp-bar-item__count">${stats.tp2Hits}</div><div class="tp-bar-item__label">TP2</div></div>
      <div class="tp-bar-item"><div class="tp-bar-item__bar tp3"></div><div class="tp-bar-item__count">${stats.tp3Hits}</div><div class="tp-bar-item__label">TP3</div></div>
      <div class="tp-bar-item"><div class="tp-bar-item__bar sl"></div><div class="tp-bar-item__count">${stats.slHits}</div><div class="tp-bar-item__label">SL</div></div>
    `;
  }
}

function initDemoControls({ onToggleAutoTrade, onResetDemoAccount, onRefresh }) {
  const toggle = document.getElementById('demo-auto-toggle');
  const resetBtn = document.getElementById('demo-reset-btn');
  const status = document.getElementById('demo-control-status');

  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = '1';
    toggle.addEventListener('change', async () => {
      toggle.disabled = true;
      if (status) status.textContent = 'Saving auto-trade setting...';
      try {
        await onToggleAutoTrade(Boolean(toggle.checked));
        if (status) status.textContent = `Auto-trade ${toggle.checked ? 'enabled' : 'disabled'}.`;
        if (onRefresh) await onRefresh();
      } catch (err) {
        if (status) status.textContent = err?.message || 'Failed to update auto-trade setting.';
      } finally {
        toggle.disabled = false;
      }
    });
  }

  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = '1';
    resetBtn.addEventListener('click', async () => {
      const ok = window.confirm('Reset live state? This keeps only the newest ACTIVE signal, deletes older signal history, clears demo trades/events/equity, and resets the account to $100,000.');
      if (!ok) return;
      resetBtn.disabled = true;
      if (status) status.textContent = 'Resetting live stats and demo state...';
      try {
        await onResetDemoAccount();
        if (status) status.textContent = 'Live state reset complete.';
        if (onRefresh) await onRefresh();
      } catch (err) {
        if (status) status.textContent = err?.message || 'Live state reset failed.';
      } finally {
        resetBtn.disabled = false;
      }
    });
  }
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatSignedMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  const prefix = n > 0 ? '+' : n < 0 ? '-' : '';
  return `${prefix}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderDemoEquityCurve(points) {
  const host = document.getElementById('demo-equity-chart');
  if (!host) return;
  if (!Array.isArray(points) || points.length < 2) {
    host.innerHTML = '<div class="feature-note">Need at least 2 equity points to draw curve.</div>';
    return;
  }

  const values = points.map((p) => Number(p.equity || 0)).filter((v) => Number.isFinite(v));
  if (values.length < 2) {
    host.innerHTML = '<div class="feature-note">Need at least 2 equity points to draw curve.</div>';
    return;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);

  const w = 100;
  const h = 36;
  const pad = 2;
  const path = values
    .map((v, i) => {
      const x = pad + ((w - pad * 2) * i) / Math.max(values.length - 1, 1);
      const y = h - pad - ((h - pad * 2) * (v - min)) / span;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  host.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Demo equity curve">
      <polyline class="equity-line" points="${path}"></polyline>
    </svg>
  `;
}

function renderDemoDashboard(perf, curve = [], trades = [], events = []) {
  const summary = document.getElementById('demo-summary-grid');
  const lane = document.getElementById('demo-lane-split');
  const history = document.getElementById('demo-trade-history');
  const toggle = document.getElementById('demo-auto-toggle');
  const status = document.getElementById('demo-control-status');

  if (!summary || !lane || !history) return;

  if (!perf || !perf.account) {
    summary.innerHTML = `
      <div class="stat-tile">
        <div class="stat-tile__label">Demo account</div>
        <div class="stat-tile__value">Loading...</div>
      </div>
    `;
    lane.innerHTML = '';
    history.innerHTML = '<div class="feature-note">No demo trades yet.</div>';
    renderDemoEquityCurve(curve);
    return;
  }

  const roiColor = perf.roiPct >= 0 ? 'var(--green)' : 'var(--red)';
  const pnlColor = perf.pnlTotal >= 0 ? 'var(--green)' : 'var(--red)';

  summary.innerHTML = `
    <div class="stat-tile"><div class="stat-tile__label">Starting Capital</div><div class="stat-tile__value">${formatMoney(perf.starting)}</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Balance</div><div class="stat-tile__value">${formatMoney(perf.balance)}</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Equity</div><div class="stat-tile__value">${formatMoney(perf.equity)}</div></div>
    <div class="stat-tile"><div class="stat-tile__label">ROI</div><div class="stat-tile__value" style="color:${roiColor}">${perf.roiPct.toFixed(2)}%</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Open Trades</div><div class="stat-tile__value">${perf.openTrades}</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Win Rate</div><div class="stat-tile__value">${perf.winRate.toFixed(1)}%</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Max Drawdown</div><div class="stat-tile__value">${perf.maxDrawdownPct.toFixed(2)}%</div></div>
    <div class="stat-tile"><div class="stat-tile__label">Net PnL</div><div class="stat-tile__value" style="color:${pnlColor}">${formatMoney(perf.pnlTotal)}</div></div>
  `;

  lane.innerHTML = `
    <div class="lane-chip">
      <span>Intraday</span>
      <span>${perf.laneStats?.intraday?.trades ?? 0} trades</span>
      <span>${(perf.laneStats?.intraday?.winRate ?? 0).toFixed(1)}% win</span>
    </div>
    <div class="lane-chip">
      <span>Swing</span>
      <span>${perf.laneStats?.swing?.trades ?? 0} trades</span>
      <span>${(perf.laneStats?.swing?.winRate ?? 0).toFixed(1)}% win</span>
    </div>
  `;

  const openRows = Array.isArray(perf.effectiveOpenTrades) ? perf.effectiveOpenTrades.slice(0, 6) : [];
  const eventRows = Array.isArray(events)
    ? events.filter((evt) => String(evt.event_type || '').toUpperCase() !== 'OPEN').slice(0, 24)
    : [];
  const tradeRows = Array.isArray(trades)
    ? trades.filter((trade) => !trade.isEffectiveOpen).slice(0, 20)
    : [];
  if (openRows.length === 0 && eventRows.length === 0 && tradeRows.length === 0) {
    history.innerHTML = '<div class="feature-note">No demo trades yet.</div>';
  } else {
    const openMarkup = openRows.map((trade) => {
      const laneText = String(trade.lane || 'intraday').toUpperCase();
      const sideText = String(trade.side || '--').toUpperCase();
      const pnl = Number(trade.livePnlUsd || 0);
      const pnlCls = pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'text-muted';
      return `
        <div class="demo-trade-row">
          <div class="demo-trade-row__left">
            <div class="demo-trade-row__meta">${laneText} | ${sideText} | LIVE OPEN</div>
            <div class="demo-trade-row__sub">Entry ${Number(trade.entry || 0).toFixed(2)} | Mark ${Number.isFinite(Number(trade.markPrice)) ? Number(trade.markPrice).toFixed(2) : '--'} | Size ${Number(trade.remainingPositionSize || trade.position_size || 0).toFixed(3)}</div>
          </div>
          <div class="demo-trade-row__right">
            <div class="demo-trade-row__pnl ${pnlCls}">${formatSignedMoney(pnl)}</div>
            <div class="demo-trade-row__sub">${formatMalaysiaTime(trade.opened_at, true)}</div>
          </div>
        </div>
      `;
    }).join('');

    const eventLabels = {
      OPEN: 'Trade opened',
      TP1_PARTIAL: 'TP1 partial fill',
      SL_TO_BREAKEVEN: 'Stop moved to breakeven',
      TP2: 'Final exit at TP2',
      TP3: 'Final exit at TP3',
      STOP_LOSS: 'Final exit at stop loss',
      BREAKEVEN: 'Final exit at breakeven',
      EXPIRED: 'Final exit expired',
    };
    const eventMarkup = eventRows.map((evt) => {
      const laneText = String(evt.lane || 'intraday').toUpperCase();
      const eventType = String(evt.event_type || '--').toUpperCase();
      const price = Number(evt.event_price || 0);
      const pnl = Number(evt.pnl_usd || 0);
      const pnlCls = pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'text-muted';
      return `
        <div class="demo-trade-row">
          <div class="demo-trade-row__left">
            <div class="demo-trade-row__meta">${laneText} | ${eventLabels[eventType] || eventType}</div>
            <div class="demo-trade-row__sub">Price ${price ? price.toFixed(2) : '--'} | Size ${Number(evt.realized_size || 0).toFixed(3)} | Left ${Number(evt.remaining_size || 0).toFixed(3)}</div>
          </div>
          <div class="demo-trade-row__right">
            <div class="demo-trade-row__pnl ${pnlCls}">${formatMoney(pnl)}</div>
            <div class="demo-trade-row__sub">${formatMalaysiaTime(evt.created_at, true)}</div>
          </div>
        </div>
      `;
    }).join('');

    const tradeMarkup = tradeRows.map((t) => {
      const side = String(t.side || '--').toUpperCase();
      const laneText = String(t.lane || 'intraday').toUpperCase();
      const statusText = String(t.effectiveStatus || t.status || '--').toUpperCase();
      const pnl = Number(t.livePnlUsd ?? t.pnl_usd ?? 0);
      const isSettling = statusText === 'SETTLING';
      const pnlCls = (statusText === 'BREAKEVEN' || isSettling) ? 'text-muted' : (pnl >= 0 ? 'profit' : 'loss');
      const pnlText = isSettling ? 'Pending' : formatMoney(pnl);
      return `
        <div class="demo-trade-row">
          <div class="demo-trade-row__left">
            <div class="demo-trade-row__meta">${laneText} | ${side} | ${statusText}</div>
            <div class="demo-trade-row__sub">${isSettling
              ? `Entry ${Number(t.entry || 0).toFixed(2)} | Awaiting reconciliation`
              : `Entry ${Number(t.entry || 0).toFixed(2)} | SL ${Number(t.sl || 0).toFixed(2)}`}</div>
          </div>
          <div class="demo-trade-row__right">
            <div class="demo-trade-row__pnl ${pnlCls}">${pnlText}</div>
            <div class="demo-trade-row__sub">${formatMalaysiaTime(t.opened_at, true)}</div>
          </div>
        </div>
      `;
    }).join('');

    history.innerHTML = [openMarkup, eventMarkup, tradeMarkup].filter(Boolean).join('');
  }

  if (toggle) toggle.checked = Boolean(perf.account.auto_trade_enabled);
  if (status && !status.textContent) {
    status.textContent = `Live demo P/L follows active signals and the latest XAU price.`;
  }

  renderDemoEquityCurve((Array.isArray(curve) && curve.length > 0) ? curve : perf.equityPoints || []);
}

function updateRiskCalc(signal, riskState = null) {
  const lotInput = document.getElementById('lot-input');
  if (!lotInput) return;
  const equityInput = document.getElementById('equity-input');
  const pipChangeInput = document.getElementById('pip-change-input');
  const plPreviewEl = document.getElementById('pl-preview-value');
  const advisedLotEl = document.getElementById('advised-lot-value');
  const riskGuardEl = document.getElementById('risk-guard-note');
  const dollarsPerPipPerLot = XAU_PIP_SIZE * 100;

  const setValues = () => {
    const lotSize = Math.max(parseFloat(lotInput?.value || '0') || 0, 0);
    const equity = Math.max(parseFloat(equityInput?.value || '10000') || 0, 0);
    const pipChange = parseFloat(pipChangeInput?.value || '0') || 0;
    const plPreview = pipChange * lotSize * dollarsPerPipPerLot;

    if (plPreviewEl) {
      plPreviewEl.textContent = formatSignedMoney(plPreview);
      plPreviewEl.className = `risk-val__num ${plPreview > 0 ? 'profit' : plPreview < 0 ? 'loss' : 'text-muted'}`;
    }

    const signalData = lotInput._riskSignal;
    if (!signalData) {
      if (advisedLotEl) {
        advisedLotEl.textContent = '--';
        advisedLotEl.className = 'risk-val__num text-muted';
      }
      if (riskGuardEl) {
        riskGuardEl.textContent = 'Advice appears when a tradable signal is live.';
      }
      return;
    }

    const lane = String(signalData.lane || 'intraday').toLowerCase() === 'swing' ? 'swing' : 'intraday';
    const riskPct = lane === 'swing' ? 0.75 : 0.50;
    const entry = parseFloat(signalData.entry_price) || 0;
    const sl = parseFloat(signalData.stop_loss ?? signalData.sl) || 0;
    const stopDist = Math.abs(entry - sl);
    const riskDollars = equity * (riskPct / 100);
    const stopPips = stopDist > 0 ? (stopDist / XAU_PIP_SIZE) : 0;
    const advisedLot = stopPips > 0 ? (riskDollars / (stopPips * dollarsPerPipPerLot)) : NaN;

    if (advisedLotEl) {
      advisedLotEl.textContent = Number.isFinite(advisedLot) ? advisedLot.toFixed(2) : '--';
      advisedLotEl.className = `risk-val__num ${Number.isFinite(advisedLot) ? 'profit' : 'text-muted'}`;
    }

    if (riskGuardEl) {
      riskGuardEl.textContent = Number.isFinite(advisedLot)
        ? `Advice uses ${lane === 'swing' ? 'Swing 0.75%' : 'Intraday 0.50%'} risk over a ${stopPips.toFixed(1)}p stop on the live signal.`
        : 'Advice appears when a tradable signal is live.';
    }
  };

  if (!lotInput._riskBound) {
    lotInput.addEventListener('input', setValues);
    if (equityInput) equityInput.addEventListener('input', setValues);
    if (pipChangeInput) pipChangeInput.addEventListener('input', setValues);
    lotInput._riskBound = true;
  }

  lotInput._riskSignal = signal || null;
  setValues();
}

window.UI = {
  initTheme,
  initTranslateToggle,
  initNavigation,
  initLearnPage,
  initDashboardSwitch,
  initPolymarketControls,
  getSelectedPolymarketMarketSlug,
  getSelectedSignalLane,
  setSelectedSignalLane,
  setDashboardMode,
  getDashboardMode,
  initChartTime,
  initAuthGate,
  setAuthGateVisible,
  setAuthButtonUser,
  updateSessionPill,
  updateHeaderPrice,
  renderSignalHero,
  renderLevels,
  renderConditions,
  renderNewsBanner,
  renderHistory,
  renderEvents,
  renderPolymarketDashboard,
  renderPolymarketRenderFailure,
  renderStats,
  initDemoControls,
  renderDemoDashboard,
  renderDemoEquityCurve,
  setPolymarketMarketHistory,
  updateRiskCalc,
  renderLearnPage,
};



