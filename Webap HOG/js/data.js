// ============ Конфиг и статические данные ============

const CONFIG = {
    SUPPORT_URL: "https://t.me/hog_manager",
    CHANNEL_URL: "https://t.me/+CYnPyCfedLswN2Ey",
    // Юзернейм бота БЕЗ @ — нужен для кнопки «Пригласить друга»
    // (ссылка вида t.me/<бот>?start=<id юзера>). Пусто — кнопка скрыта.
    BOT_USERNAME: "hoganalytics_bot",
};

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
