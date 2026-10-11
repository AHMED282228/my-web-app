// ============ Конфиг и статические данные ============

const CONFIG = {
    SUPPORT_URL: "https://t.me/Aurex_trd",
    CHANNEL_URL: "https://t.me/hoganalytics",
    // Юзернейм бота БЕЗ @ — нужен для кнопки «Пригласить друга»
    // (ссылка вида t.me/<бот>?start=<id юзера>). Пусто — кнопка скрыта.
    BOT_USERNAME: "hoganalytics_bot",
    // Запасная ссылка на брокера: обычно актуальную (с click_id) присылает бот
    // в параметре ?ref=, это фолбэк на случай открытия вебаппа напрямую.
    REF_URL: "https://pocketoption.com/",
    // Сколько сигналов можно взять в демо-режиме до первого пополнения
    DEMO_LIMIT: 2,
    // Дневная цель по сигналам для квеста
    DAILY_GOAL: 5,
    // Сколько секунд действителен сигнал (окно входа) по таймфреймам
    ENTRY_WINDOW: { S5: 2, S15: 5, S30: 10, M1: 15 },
    ENTRY_WINDOW_DEFAULT: 30,
    // Как часто перечитывать реальные курсы, пока приложение открыто (секунды)
    PRICE_REFRESH: 60,
    // Размах графика сигнала по таймфреймам: за 5 секунд цена проходит в разы
    // меньше, чем за час, и шкала цен должна это показывать
    CHART_SCALE: { S5: 0.06, S15: 0.1, S30: 0.14, M1: 0.2, M3: 0.35, M30: 0.8, H1: 1 },

    // ---- «Живые» цифры ----
    // Считаются от РЕАЛЬНОГО числа подписчиков канала: бот присылает его
    // параметром ?subs= (сверяется с Telegram раз в сутки). Иначе цифры живут
    // сами по себе и на маленьком канале выглядят выдумкой.
    FALLBACK_SUBS: 250,        // если бот не передал (вебапп открыли напрямую)
    ONLINE_SHARE: 0.07,        // доля подписчиков в приложении на пике активности
    // Сколько сигналов берёт ОДИН человек, пока сидит в приложении (в час).
    // Из этого числа выводятся и объём за сутки, и скорость ленты — иначе они
    // расходятся: 19 человек онлайн при ленте раз в 2 минуты означало бы, что
    // каждый жмёт кнопку раз в 40 минут, чего не бывает.
    SIGNALS_PER_USER_HOUR: 14, // ≈ один сигнал в 4 минуты на активного юзера

    // Активность по часам (0..23). Симметричная формула вокруг пика не годится:
    // она делала 3 часа ночи оживлённее 8 утра. Здесь ночь честно мёртвая,
    // утро разгоняется, пик — вечер после работы.
    ACTIVITY_BY_HOUR: [
        0.16, 0.11, 0.08, 0.07, 0.07, 0.09, 0.15, 0.26,
        0.40, 0.53, 0.61, 0.66, 0.68, 0.72, 0.78, 0.84,
        0.90, 0.95, 0.98, 1.00, 1.00, 0.90, 0.68, 0.38,
    ],
};

// ---------- Технические индикаторы ----------
// Реальные индикаторы теханализа с правдоподобными показаниями. Значения
// генерируются в диапазонах, которые не противоречат вердикту: бычье чтение
// RSI не может быть 78. Аудитория бинарных опционов эти названия знает —
// конкретика («RSI 28 — перепроданность») читается как работа алгоритма,
// абстрактное «анализирую рынок» — как заглушка.
function rnd(min, max, digits) {
    const value = Math.random() * (max - min) + min;
    return digits ? value.toFixed(digits) : String(Math.round(value));
}

const INDICATORS = [
    { n: "RSI (14)", bull: () => [rnd(18, 34), "oversold"], bear: () => [rnd(67, 82), "overbought"] },
    { n: "Stochastic (14,3,3)", bull: () => [rnd(5, 19), "oversold"], bear: () => [rnd(81, 96), "overbought"] },
    { n: "StochRSI (14)", bull: () => [rnd(2, 15), "oversold"], bear: () => [rnd(85, 98), "overbought"] },
    { n: "MACD (12,26,9)", bull: () => [null, "bull_cross"], bear: () => [null, "bear_cross"] },
    { n: "Bollinger Bands (20,2)", bull: () => [null, "lower_band"], bear: () => [null, "upper_band"] },
    { n: "EMA 50 / EMA 200", bull: () => [null, "golden_cross"], bear: () => [null, "death_cross"] },
    { n: "SMA (20)", bull: () => [null, "price_above"], bear: () => [null, "price_below"] },
    { n: "Hull MA (21)", bull: () => [null, "turn_up"], bear: () => [null, "turn_down"] },
    { n: "ADX / DMI (14)", bull: () => [rnd(27, 46), "strong_trend"], bear: () => [rnd(27, 46), "strong_trend"] },
    { n: "ATR (14)", bull: () => [rnd(0.4, 2.4, 2), "vol_ok"], bear: () => [rnd(0.4, 2.4, 2), "vol_ok"] },
    { n: "CCI (20)", bull: () => [rnd(-240, -105), "oversold"], bear: () => [rnd(105, 240), "overbought"] },
    { n: "Williams %R (14)", bull: () => [rnd(-97, -82), "oversold"], bear: () => [rnd(-18, -3), "overbought"] },
    { n: "Ichimoku Kinko Hyo", bull: () => [null, "cloud_above"], bear: () => [null, "cloud_below"] },
    { n: "Parabolic SAR", bull: () => [null, "sar_below"], bear: () => [null, "sar_above"] },
    { n: "SuperTrend (10,3)", bull: () => [null, "trend_up"], bear: () => [null, "trend_down"] },
    { n: "OBV", bull: () => [null, "accumulation"], bear: () => [null, "distribution"] },
    { n: "MFI (14)", bull: () => [rnd(9, 22), "buy_pressure"], bear: () => [rnd(78, 92), "sell_pressure"] },
    { n: "Chaikin Money Flow (20)", bull: () => [rnd(0.11, 0.38, 2), "buy_pressure"], bear: () => [rnd(-0.38, -0.11, 2), "sell_pressure"] },
    { n: "VWAP", bull: () => [null, "price_below_vwap"], bear: () => [null, "price_above_vwap"] },
    { n: "Momentum (10)", bull: () => [null, "bull_div"], bear: () => [null, "bear_div"] },
    { n: "ROC (12)", bull: () => [rnd(0.4, 2.6, 2) + "%", "impulse_up"], bear: () => [("-" + rnd(0.4, 2.6, 2)) + "%", "impulse_down"] },
    { n: "Awesome Oscillator", bull: () => [null, "bull_cross"], bear: () => [null, "bear_cross"] },
    { n: "Aroon (25)", bull: () => [rnd(72, 98) + " / " + rnd(4, 26), "trend_up"], bear: () => [rnd(4, 26) + " / " + rnd(72, 98), "trend_down"] },
    { n: "Fibonacci 61.8%", bull: () => [null, "lvl_support"], bear: () => [null, "lvl_resistance"] },
    { n: "Pivot Points (Classic)", bull: () => [null, "lvl_support"], bear: () => [null, "lvl_resistance"] },
    { n: "Donchian Channels (20)", bull: () => [null, "breakout_up"], bear: () => [null, "breakout_down"] },
    { n: "Keltner Channels (20)", bull: () => [null, "squeeze"], bear: () => [null, "squeeze"] },
    { n: "Volume Profile", bull: () => [null, "accumulation"], bear: () => [null, "distribution"] },
    { n: "TRIX (14)", bull: () => [null, "turn_up"], bear: () => [null, "turn_down"] },
    { n: "DeMarker (14)", bull: () => [rnd(0.08, 0.28, 2), "oversold"], bear: () => [rnd(0.72, 0.94, 2), "overbought"] },
    { n: "Ultimate Oscillator", bull: () => [rnd(12, 29), "oversold"], bear: () => [rnd(71, 88), "overbought"] },
    { n: "Vortex (14)", bull: () => [null, "bull_cross"], bear: () => [null, "bear_cross"] },
    { n: "Elder-Ray Power", bull: () => [null, "buy_pressure"], bear: () => [null, "sell_pressure"] },
    { n: "Alligator (Bill Williams)", bull: () => [null, "turn_up"], bear: () => [null, "turn_down"] },
    { n: "Fractals (Bill Williams)", bull: () => [null, "lvl_support"], bear: () => [null, "lvl_resistance"] },
    { n: "Heikin Ashi", bull: () => [null, "trend_up"], bear: () => [null, "trend_down"] },
    { n: "Accumulation / Distribution", bull: () => [null, "accumulation"], bear: () => [null, "distribution"] },
    { n: "Relative Vigor Index (10)", bull: () => [null, "bull_cross"], bear: () => [null, "bear_cross"] },
    { n: "Schaff Trend Cycle", bull: () => [rnd(3, 18), "turn_up"], bear: () => [rnd(82, 97), "turn_down"] },
    { n: "Chande Momentum (14)", bull: () => [("-" + rnd(52, 78)), "oversold"], bear: () => [rnd(52, 78), "overbought"] },
    { n: "Balance of Power", bull: () => [rnd(0.18, 0.72, 2), "buy_pressure"], bear: () => [("-" + rnd(0.18, 0.72, 2)), "sell_pressure"] },
    { n: "Choppiness Index (14)", bull: () => [rnd(24, 38), "strong_trend"], bear: () => [rnd(24, 38), "strong_trend"] },
    { n: "Linear Regression Channel", bull: () => [null, "lvl_support"], bear: () => [null, "lvl_resistance"] },
    { n: "Standard Deviation (20)", bull: () => [rnd(0.3, 1.8, 2), "vol_ok"], bear: () => [rnd(0.3, 1.8, 2), "vol_ok"] },
];

// Случайные N индикаторов без повторов
function pickIndicators(count) {
    const pool = INDICATORS.slice();
    const picked = [];
    while (picked.length < count && pool.length) {
        picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return picked;
}

// Валютные пары — как в терминале Pocket Option: обычные и OTC.
const INSTRUMENTS = {
    standard: [
        "EUR/USD", "BTC/USD", "ETH/USD", "USD/RUB", "USD/JPY", "GBP/USD",
        "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY",
        "GBP/JPY", "AUD/JPY", "CHF/JPY", "EUR/AUD", "EUR/CAD", "GBP/AUD",
        "GBP/CAD", "AUD/CAD", "AUD/CHF", "NZD/JPY", "NZD/CHF", "CAD/CHF",
        "CAD/JPY", "GBP/CHF", "EUR/CHF",
    ],
    otc: [
        "EUR/USD OTC", "EUR/NZD OTC", "AUD/CAD OTC", "GBP/USD OTC",
        "AED/CNY OTC", "CHF/JPY OTC", "USD/RUB OTC", "GBP/JPY OTC",
        "USD/PKR OTC", "AUD/NZD OTC", "EUR/CHF OTC", "USD/CAD OTC",
        "USD/BRL OTC", "UAH/USD OTC", "CAD/JPY OTC", "TND/USD OTC",
        "SAR/CNY OTC", "QAR/CNY OTC", "EUR/GBP OTC", "EUR/JPY OTC",
        "AUD/CHF OTC", "AUD/JPY OTC", "AUD/USD OTC", "BHD/CNY OTC",
        "CAD/CHF OTC", "CHF/NOK OTC", "EUR/HUF OTC", "EUR/RUB OTC",
        "EUR/TRY OTC", "GBP/AUD OTC", "JOD/CNY OTC", "KES/USD OTC",
        "LBP/USD OTC", "MAD/USD OTC", "NGN/USD OTC", "NZD/JPY OTC",
        "NZD/USD OTC", "OMR/CNY OTC", "USD/ARS OTC", "USD/BDT OTC",
        "USD/CHF OTC", "USD/CLP OTC", "USD/CNH OTC", "USD/COP OTC",
        "USD/DZD OTC", "USD/EGP OTC", "USD/IDR OTC", "USD/INR OTC",
        "USD/JPY OTC", "USD/MXN OTC", "USD/MYR OTC", "USD/PHP OTC",
        "USD/SGD OTC", "USD/THB OTC", "USD/VND OTC", "YER/USD OTC",
        "ZAR/USD OTC", "VISA OTC", "Toncoin OTC", "Tesla OTC", "TRON OTC",
        "Solana OTC", "Silver OTC", "SP500 OTC",
    ],
};

const TIMEFRAMES = {
    standard: ["M1", "M3", "M30", "H1"],
    otc: ["S5", "S15", "S30", "M1", "M3", "M30", "H1"],
};

// Базовая цена и дневной диапазон (пипсы) — для графика и «живых» цен
const PAIR_PARAMS = {
    "EUR/USD": { base: 1.12, range: 80 },
    "BTC/USD": { base: 82800, range: 900 },
    "ETH/USD": { base: 2500, range: 700 },
    "USD/RUB": { base: 85.1, range: 300 },
    "GBP/USD": { base: 1.3236, range: 100 },
    "USD/JPY": { base: 158.3, range: 70 },
    "USD/CHF": { base: 0.83, range: 60 },
    "AUD/USD": { base: 0.6984, range: 80 },
    "USD/CAD": { base: 1.4259, range: 70 },
    "NZD/USD": { base: 0.5612, range: 90 },
    "EUR/GBP": { base: 0.8463, range: 90 },
    "EUR/JPY": { base: 177.3, range: 90 },
    "GBP/JPY": { base: 209.5, range: 120 },
    "AUD/JPY": { base: 110.6, range: 100 },
    "CHF/JPY": { base: 190.7, range: 80 },
    "EUR/AUD": { base: 1.6039, range: 90 },
    "EUR/CAD": { base: 1.5973, range: 90 },
    "GBP/AUD": { base: 1.8951, range: 110 },
    "GBP/CAD": { base: 1.8873, range: 100 },
    "AUD/CAD": { base: 0.9959, range: 80 },
    "AUD/CHF": { base: 0.5797, range: 80 },
    "NZD/JPY": { base: 88.84, range: 100 },
    "NZD/CHF": { base: 0.4658, range: 80 },
    "EUR/USD OTC": { base: 1.12, range: 100 },
    "EUR/NZD OTC": { base: 1.9962, range: 120 },
    "AUD/CAD OTC": { base: 0.9959, range: 100 },
    "GBP/USD OTC": { base: 1.3236, range: 120 },
    "AED/CNY OTC": { base: 1.8222, range: 50 },
    "CHF/JPY OTC": { base: 190.7, range: 90 },
    "VISA OTC": { base: 385.0, range: 200 },
    "USD/RUB OTC": { base: 85.1, range: 300 },
    "GBP/JPY OTC": { base: 209.5, range: 120 },
    "USD/PKR OTC": { base: 276.9, range: 200 },
    "AUD/NZD OTC": { base: 1.2446, range: 80 },
    "EUR/CHF OTC": { base: 0.9298, range: 70 },
    "USD/CAD OTC": { base: 1.4259, range: 90 },
    "USD/BRL OTC": { base: 4.9888, range: 250 },
    "UAH/USD OTC": { base: 0.02226, range: 400 },
    "CAD/JPY OTC": { base: 111.0, range: 80 },
    "Toncoin OTC": { base: 1.6, range: 500 },
    "Tesla OTC": { base: 382.0, range: 400 },
    "TRON OTC": { base: 0.3316, range: 300 },
    "TND/USD OTC": { base: 0.3346, range: 100 },
    "Solana OTC": { base: 109.9, range: 600 },
    "Silver OTC": { base: 61.0, range: 200 },
    "SP500 OTC": { base: 7800.0, range: 300 },
    "SAR/CNY OTC": { base: 1.7831, range: 50 },
    "QAR/CNY OTC": { base: 1.8349, range: 50 },
    "EUR/GBP OTC": { base: 0.8463, range: 90 },
    "EUR/JPY OTC": { base: 177.3, range: 90 },
    "CAD/CHF": { base: 0.58201, range: 90 },
    "CAD/JPY": { base: 111.01, range: 90 },
    "GBP/CHF": { base: 1.0987, range: 90 },
    "EUR/CHF": { base: 0.92975, range: 90 },
    "AUD/CHF OTC": { base: 0.57965, range: 100 },
    "AUD/JPY OTC": { base: 110.56, range: 100 },
    "AUD/USD OTC": { base: 0.69842, range: 100 },
    "BHD/CNY OTC": { base: 17.724, range: 180 },
    "CAD/CHF OTC": { base: 0.58201, range: 100 },
    "CHF/NOK OTC": { base: 11.516, range: 180 },
    "EUR/HUF OTC": { base: 364.92, range: 180 },
    "EUR/RUB OTC": { base: 95.36, range: 180 },
    "EUR/TRY OTC": { base: 55.208, range: 180 },
    "GBP/AUD OTC": { base: 1.8954, range: 100 },
    "JOD/CNY OTC": { base: 9.4396, range: 180 },
    "KES/USD OTC": { base: 0.0077036, range: 180 },
    "LBP/USD OTC": { base: 1.1166e-05, range: 180 },
    "MAD/USD OTC": { base: 0.10193, range: 180 },
    "NGN/USD OTC": { base: 0.00075218, range: 180 },
    "NZD/JPY OTC": { base: 88.842, range: 100 },
    "NZD/USD OTC": { base: 0.56124, range: 100 },
    "OMR/CNY OTC": { base: 17.408, range: 180 },
    "USD/ARS OTC": { base: 1517.2, range: 180 },
    "USD/BDT OTC": { base: 123.3, range: 180 },
    "USD/CHF OTC": { base: 0.82994, range: 100 },
    "USD/CLP OTC": { base: 977.01, range: 180 },
    "USD/CNH OTC": { base: 6.6927, range: 180 },
    "USD/COP OTC": { base: 3204.7, range: 180 },
    "USD/DZD OTC": { base: 134.63, range: 180 },
    "USD/EGP OTC": { base: 52.387, range: 180 },
    "USD/IDR OTC": { base: 17893.0, range: 180 },
    "USD/INR OTC": { base: 96.62, range: 180 },
    "USD/JPY OTC": { base: 158.29, range: 100 },
    "USD/MXN OTC": { base: 18.414, range: 180 },
    "USD/MYR OTC": { base: 4.0857, range: 180 },
    "USD/PHP OTC": { base: 62.739, range: 180 },
    "USD/SGD OTC": { base: 1.2801, range: 180 },
    "USD/THB OTC": { base: 33.539, range: 180 },
    "USD/VND OTC": { base: 25889.0, range: 180 },
    "YER/USD OTC": { base: 0.0042339, range: 180 },
    "ZAR/USD OTC": { base: 0.060555, range: 180 },
    DEFAULT: { base: 1.0, range: 100 },
};

// Расписание бирж (часы UTC)
const MARKET_SCHEDULE = {
    asia: { open: 0, close: 7.5 },
    europe: { open: 8, close: 16.5 },
    america: { open: 14.5, close: 21 },
};

function pairParams(pair) {
    // У OTC-пары без своей записи берём параметры обычной: цена у них одна
    return PAIR_PARAMS[pair] || PAIR_PARAMS[pair.replace(" OTC", "")] || PAIR_PARAMS.DEFAULT;
}

function isJpyPair(pair) {
    return pair.indexOf("JPY") !== -1;
}

// Пункт считается от порядка самой цены: 0.0001 для EUR/USD, 0.01 для USD/JPY,
// 1 для BTC — без отдельного правила на каждый инструмент. Пары чуть ниже
// единицы (USD/CHF 0.83, AUD/USD 0.69) котируются как и те, что чуть выше.
function pipSize(pair) {
    const base = pairParams(pair).base;
    const order = Math.floor(Math.log10(base));
    return Math.pow(10, (order === -1 ? 0 : order) - 4);
}

// Знаков после запятой как в терминале брокера: на один больше, чем у пункта
// (EUR/USD 1.12031, USD/JPY 158.295), но не меньше двух.
function priceDecimals(pair) {
    const pipDigits = Math.round(-Math.log10(pipSize(pair)));
    // У очень дешёвых валют (LBP/USD, NGN/USD) цена и так длинная — без лишнего знака
    const extra = pairParams(pair).base < 0.01 ? 0 : 1;
    return Math.max(2, pipDigits + extra);
}

// Открыт ли (псевдо)рынок для Standard
function isMarketOpen() {
    const now = new Date();
    const h = now.getUTCHours() + now.getUTCMinutes() / 60;
    const d = now.getUTCDay();
    if (d === 0 || d === 6) return false;
    return Object.values(MARKET_SCHEDULE).some(
        (ex) => h >= ex.open && h < ex.close,
    );
}

// ---------- Реальные курсы ----------
// Валюты — Coinbase (курс обновляется раз в минуту), запасной источник —
// open.er-api.com (раз в сутки). Крипта — публичный API Binance. Акции, индекс и
// серебро в браузер бесплатно не отдаёт никто: их цену раз в час берёт бот и
// передаёт в адресе приложения (?px=). От этих цен строятся и вкладка «Рынок»,
// и график сигнала.

const PRICE_SOURCES = {
    fiat: [
        "https://api.coinbase.com/v2/exchange-rates?currency=USD",
        "https://open.er-api.com/v6/latest/USD",
    ],
    crypto: [
        "https://data-api.binance.vision/api/v3/ticker/price",
        "https://api.binance.com/api/v3/ticker/price",
    ],
};

// Все валютные пары из списков инструментов: курс каждой считается из курсов
// двух её валют к доллару. Новую пару достаточно добавить в INSTRUMENTS.
const FIAT_PAIRS = Array.from(
    new Set(
        INSTRUMENTS.standard
            .concat(INSTRUMENTS.otc)
            .map((name) => name.replace(" OTC", ""))
            .filter((name) => /^[A-Z]{3}\/[A-Z]{3}$/.test(name) && !/^(BTC|ETH)\//.test(name)),
    ),
);

// Крипта с Binance (спот к USDT ≈ USD)
const CRYPTO_SYMBOLS = {
    BTCUSDT: "BTC/USD",
    ETHUSDT: "ETH/USD",
    TONUSDT: "Toncoin",
    SOLUSDT: "Solana",
    TRXUSDT: "TRON",
};

let _pricesLoadedAt = 0;
let _pricesLoading = null;

function _setBase(pair, price) {
    const params = PAIR_PARAMS[pair];
    if (!params) return;
    const delta = price - params.base;
    params.base = price;
    // Уже показанный ряд «живых» цен сдвигаем целиком: цена встаёт на реальный
    // уровень, а спарклайн на «Рынке» не теряет форму
    if (typeof Market !== "undefined" && Market.prices[pair]) {
        Market.prices[pair] = Market.prices[pair].map((v) => v + delta);
    }
}

function _applyRealBase(pair, price) {
    if (!isFinite(price) || price <= 0) return;
    _setBase(pair, price);
    _setBase(pair + " OTC", price);
}

// Цены от бота: "Tesla:382.70|VISA:385.45|SP500:7811.54|Silver:61.05"
function applyBotQuotes(raw) {
    String(raw || "")
        .split("|")
        .forEach((item) => {
            const cut = item.lastIndexOf(":");
            if (cut > 0) _applyRealBase(item.slice(0, cut), parseFloat(item.slice(cut + 1)));
        });
}

// fetch с ограничением по времени: зависший источник не должен держать остальные
async function _fetchJson(url) {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 6000) : null;
    try {
        const resp = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return await resp.json();
    } finally {
        if (timer) clearTimeout(timer);
    }
}

async function _loadFiat() {
    for (const url of PRICE_SOURCES.fiat) {
        try {
            const data = await _fetchJson(url);
            // rates = сколько валюты X за 1 USD → пара A/B = rates[B] / rates[A]
            const r = (data && data.rates) || (data && data.data && data.data.rates);
            if (!r || !r.EUR) continue;
            // Офшорный юань (CNH) источники отдельно не дают — он идёт вровень с CNY
            const rate = (code) =>
                code === "USD" ? 1 : parseFloat(r[code === "CNH" ? "CNY" : code]);
            FIAT_PAIRS.forEach((pair) => {
                const [a, b] = pair.split("/");
                _applyRealBase(pair, rate(b) / rate(a));
            });
            return true;
        } catch (e) {
            console.warn("FX source failed: " + url, e);
        }
    }
    return false;
}

async function _loadCrypto() {
    const list = encodeURIComponent(JSON.stringify(Object.keys(CRYPTO_SYMBOLS)));
    for (const url of PRICE_SOURCES.crypto) {
        try {
            const data = await _fetchJson(url + "?symbols=" + list);
            if (!Array.isArray(data) || !data.length) continue;
            data.forEach((row) => {
                _applyRealBase(CRYPTO_SYMBOLS[row.symbol], parseFloat(row.price));
            });
            return true;
        } catch (e) {
            console.warn("Crypto source failed: " + url, e);
        }
    }
    return false;
}

// Перечитывает курсы. Параллельные вызовы склеиваются в один запрос.
function loadRealPrices() {
    if (_pricesLoading) return _pricesLoading;
    _pricesLoading = Promise.allSettled([_loadFiat(), _loadCrypto()]).then((res) => {
        _pricesLoading = null;
        if (res.some((r) => r.status === "fulfilled" && r.value)) {
            _pricesLoadedAt = Date.now();
        }
    });
    return _pricesLoading;
}

// Обновить курсы, если последним больше maxAgeSec секунд
function refreshPricesIfStale(maxAgeSec) {
    if (Date.now() - _pricesLoadedAt < maxAgeSec * 1000) return Promise.resolve();
    return loadRealPrices();
}

// Ближайшее время открытия рынка
function nextMarketOpen() {
    const now = new Date();
    const opens = Object.values(MARKET_SCHEDULE)
        .map((ex) => ex.open)
        .sort((a, b) => a - b);
    const h = now.getUTCHours() + now.getUTCMinutes() / 60;
    const d = now.getUTCDay();

    const mk = (dayOffset, hoursFloat) => {
        const dt = new Date(now);
        dt.setUTCDate(dt.getUTCDate() + dayOffset);
        dt.setUTCHours(Math.floor(hoursFloat), Math.round((hoursFloat % 1) * 60), 0, 0);
        return dt;
    };

    if (d >= 1 && d <= 5) {
        for (const o of opens) if (o > h) return mk(0, o);
    }
    // следующий рабочий день
    let off = 1;
    while ([0, 6].includes((d + off) % 7)) off++;
    return mk(off, opens[0]);
}
