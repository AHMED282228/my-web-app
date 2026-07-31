// ============ Конфиг и статические данные ============

const CONFIG = {
    SUPPORT_URL: "https://t.me/hog_manager",
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
    ENTRY_WINDOW: { S5: 10, S15: 15, S30: 20 },
    ENTRY_WINDOW_DEFAULT: 30,
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
    { n: "Fibonacci 61.8%", bull: () => [null, "support"], bear: () => [null, "resistance"] },
    { n: "Pivot Points (Classic)", bull: () => [null, "support"], bear: () => [null, "resistance"] },
    { n: "Donchian Channels (20)", bull: () => [null, "breakout_up"], bear: () => [null, "breakout_down"] },
    { n: "Keltner Channels (20)", bull: () => [null, "squeeze"], bear: () => [null, "squeeze"] },
    { n: "Volume Profile", bull: () => [null, "accumulation"], bear: () => [null, "distribution"] },
    { n: "TRIX (14)", bull: () => [null, "turn_up"], bear: () => [null, "turn_down"] },
    { n: "DeMarker (14)", bull: () => [rnd(0.08, 0.28, 2), "oversold"], bear: () => [rnd(0.72, 0.94, 2), "overbought"] },
    { n: "Ultimate Oscillator", bull: () => [rnd(12, 29), "oversold"], bear: () => [rnd(71, 88), "overbought"] },
    { n: "Vortex (14)", bull: () => [null, "bull_cross"], bear: () => [null, "bear_cross"] },
    { n: "Elder-Ray Power", bull: () => [null, "buy_pressure"], bear: () => [null, "sell_pressure"] },
    { n: "Alligator (Bill Williams)", bull: () => [null, "turn_up"], bear: () => [null, "turn_down"] },
    { n: "Fractals (Bill Williams)", bull: () => [null, "support"], bear: () => [null, "resistance"] },
    { n: "Heikin Ashi", bull: () => [null, "trend_up"], bear: () => [null, "trend_down"] },
    { n: "Accumulation / Distribution", bull: () => [null, "accumulation"], bear: () => [null, "distribution"] },
    { n: "Relative Vigor Index (10)", bull: () => [null, "bull_cross"], bear: () => [null, "bear_cross"] },
    { n: "Schaff Trend Cycle", bull: () => [rnd(3, 18), "turn_up"], bear: () => [rnd(82, 97), "turn_down"] },
    { n: "Chande Momentum (14)", bull: () => [("-" + rnd(52, 78)), "oversold"], bear: () => [rnd(52, 78), "overbought"] },
    { n: "Balance of Power", bull: () => [rnd(0.18, 0.72, 2), "buy_pressure"], bear: () => [("-" + rnd(0.18, 0.72, 2)), "sell_pressure"] },
    { n: "Choppiness Index (14)", bull: () => [rnd(24, 38), "strong_trend"], bear: () => [rnd(24, 38), "strong_trend"] },
    { n: "Linear Regression Channel", bull: () => [null, "support"], bear: () => [null, "resistance"] },
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

const INSTRUMENTS = {
    standard: [
        "EUR/USD", "BTC/USD", "ETH/USD", "USD/RUB", "USD/JPY", "GBP/USD",
        "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY",
        "GBP/JPY", "AUD/JPY", "CHF/JPY", "EUR/AUD", "EUR/CAD", "GBP/AUD",
        "GBP/CAD", "AUD/CAD", "AUD/CHF", "NZD/JPY", "NZD/CHF",
    ],
    otc: [
        "EUR/USD OTC", "EUR/NZD OTC", "AUD/CAD OTC", "GBP/USD OTC",
        "AED/CNY OTC", "CHF/JPY OTC", "VISA OTC", "USD/RUB OTC",
        "GBP/JPY OTC", "USD/PKR OTC", "AUD/NZD OTC", "EUR/CHF OTC",
        "USD/CAD OTC", "USD/BRL OTC", "UAH/USD OTC", "CAD/JPY OTC",
        "Toncoin OTC", "Tesla OTC", "TRON OTC", "TND/USD OTC",
        "Solana OTC", "Silver OTC", "SP500 OTC", "SAR/CNY OTC",
        "QAR/CNY OTC", "EUR/GBP OTC", "EUR/JPY OTC",
    ],
};

const TIMEFRAMES = {
    standard: ["M1", "M3", "M30", "H1"],
    otc: ["S5", "S15", "S30", "M1", "M3", "M30", "H1"],
};

// Базовая цена и дневной диапазон (пипсы) — для графика и «живых» цен
const PAIR_PARAMS = {
    "EUR/USD": { base: 1.08, range: 80 },
    "BTC/USD": { base: 64000, range: 900 },
    "ETH/USD": { base: 3100, range: 700 },
    "USD/RUB": { base: 92.5, range: 300 },
    "GBP/USD": { base: 1.27, range: 100 },
    "USD/JPY": { base: 151.5, range: 70 },
    "USD/CHF": { base: 0.92, range: 60 },
    "AUD/USD": { base: 0.65, range: 80 },
    "USD/CAD": { base: 1.36, range: 70 },
    "NZD/USD": { base: 0.59, range: 90 },
    "EUR/GBP": { base: 0.85, range: 90 },
    "EUR/JPY": { base: 163.0, range: 90 },
    "GBP/JPY": { base: 192.5, range: 120 },
    "AUD/JPY": { base: 109.0, range: 100 },
    "CHF/JPY": { base: 164.5, range: 80 },
    "EUR/AUD": { base: 1.66, range: 90 },
    "EUR/CAD": { base: 1.47, range: 90 },
    "GBP/AUD": { base: 1.91, range: 110 },
    "GBP/CAD": { base: 1.71, range: 100 },
    "AUD/CAD": { base: 0.89, range: 80 },
    "AUD/CHF": { base: 0.61, range: 80 },
    "NZD/JPY": { base: 98.5, range: 100 },
    "NZD/CHF": { base: 0.55, range: 80 },
    "EUR/USD OTC": { base: 1.08, range: 100 },
    "EUR/NZD OTC": { base: 1.83, range: 120 },
    "AUD/CAD OTC": { base: 0.89, range: 100 },
    "GBP/USD OTC": { base: 1.27, range: 120 },
    "AED/CNY OTC": { base: 1.97, range: 50 },
    "CHF/JPY OTC": { base: 164.5, range: 90 },
    "VISA OTC": { base: 250.0, range: 200 },
    "USD/RUB OTC": { base: 92.5, range: 300 },
    "GBP/JPY OTC": { base: 192.5, range: 120 },
    "USD/PKR OTC": { base: 278.0, range: 200 },
    "AUD/NZD OTC": { base: 1.09, range: 80 },
    "EUR/CHF OTC": { base: 0.97, range: 70 },
    "USD/CAD OTC": { base: 1.36, range: 90 },
    "USD/BRL OTC": { base: 5.2, range: 250 },
    "UAH/USD OTC": { base: 39.5, range: 400 },
    "CAD/JPY OTC": { base: 113.0, range: 80 },
    "Toncoin OTC": { base: 5.5, range: 500 },
    "Tesla OTC": { base: 240.0, range: 400 },
    "TRON OTC": { base: 0.16, range: 300 },
    "TND/USD OTC": { base: 0.32, range: 100 },
    "Solana OTC": { base: 140.0, range: 600 },
    "Silver OTC": { base: 28.0, range: 200 },
    "SP500 OTC": { base: 5200.0, range: 300 },
    "SAR/CNY OTC": { base: 1.92, range: 50 },
    "QAR/CNY OTC": { base: 1.92, range: 50 },
    DEFAULT: { base: 1.0, range: 100 },
};

// Расписание бирж (часы UTC)
const MARKET_SCHEDULE = {
    asia: { open: 0, close: 7.5 },
    europe: { open: 8, close: 16.5 },
    america: { open: 14.5, close: 21 },
};

function pairParams(pair) {
    return PAIR_PARAMS[pair] || PAIR_PARAMS.DEFAULT;
}

function isJpyPair(pair) {
    return pair.indexOf("JPY") !== -1;
}

function pipSize(pair) {
    const base = pairParams(pair).base;
    if (base >= 1000) return 1; // BTC, SP500 и т.п.
    if (base >= 50) return 0.01; // JPY, RUB и т.п.
    return 0.0001;
}

function priceDecimals(pair) {
    const base = pairParams(pair).base;
    if (base >= 1000) return 0;
    if (base >= 50) return 2;
    if (base >= 10) return 3;
    return 4;
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
// Валюты — open.er-api.com (бесплатно, без ключа), крипта — публичный API Binance.
// Обновляем базовые цены пар: графики и «живые» цены центруются на реальных уровнях.

function _applyRealBase(pair, price) {
    if (!isFinite(price) || price <= 0) return;
    if (PAIR_PARAMS[pair]) PAIR_PARAMS[pair].base = price;
    const otc = pair + " OTC";
    if (PAIR_PARAMS[otc]) PAIR_PARAMS[otc].base = price;
}

async function loadRealPrices() {
    // Фиат: rates = сколько валюты X за 1 USD → пара A/B = rates[B] / rates[A]
    try {
        const resp = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await resp.json();
        const r = data && data.rates;
        if (r) {
            const fx = (a, b) => (r[a] && r[b] ? r[b] / r[a] : null);
            const fiatPairs = [
                "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD",
                "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY",
                "AUD/JPY", "CHF/JPY", "EUR/AUD", "EUR/CAD", "GBP/AUD",
                "GBP/CAD", "AUD/CAD", "AUD/CHF", "NZD/JPY", "NZD/CHF",
                "USD/RUB", "USD/PKR", "USD/BRL", "TND/USD", "EUR/NZD",
                "AUD/NZD", "EUR/CHF", "AED/CNY", "SAR/CNY", "QAR/CNY",
                "UAH/USD",
            ];
            fiatPairs.forEach((pair) => {
                const [a, b] = pair.split("/");
                const price = fx(a, b);
                if (price) _applyRealBase(pair, price);
            });
        }
    } catch (e) {
        console.warn("FX rates unavailable, using defaults", e);
    }

    // Крипта с Binance (спот к USDT ≈ USD)
    const crypto = {
        BTCUSDT: "BTC/USD",
        ETHUSDT: "ETH/USD",
        TONUSDT: "Toncoin",
        SOLUSDT: "Solana",
        TRXUSDT: "TRON",
    };
    await Promise.allSettled(
        Object.keys(crypto).map(async (sym) => {
            const resp = await fetch(
                "https://api.binance.com/api/v3/ticker/price?symbol=" + sym,
            );
            const data = await resp.json();
            _applyRealBase(crypto[sym], parseFloat(data.price));
        }),
    );
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
