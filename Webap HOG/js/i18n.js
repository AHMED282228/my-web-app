// ============ Словари интерфейса (ru/en) ============

const I18N = {
    ru: {
        ai_online: "AI online",
        tab_signal: "Сигнал",
        tab_market: "Рынок",
        tab_history: "История",
        tab_profile: "Профиль",
        pair_label: "Валютная пара",
        tf_label: "Таймфрейм",
        get_signal: "Получить сигнал",
        accuracy: "Точность",
        buy: "КУПИТЬ",
        sell: "ПРОДАТЬ",
        market_closed: "Рынок закрыт",
        market_open_at: "Откроется",
        switch_otc: "Перейти в OTC",
        search_pair: "Поиск пары…",
        top_day: "🔥 Топ дня",
        all_pairs: "Все инструменты",
        exchange_open: "открыта",
        exchange_closed: "закрыта",
        ex_asia: "Азия",
        ex_europe: "Европа",
        ex_america: "Америка",
        signals_today: "сигналов сегодня",
        signals_total: "всего",
        history_empty: "Здесь появятся ваши сигналы",
        clear_history: "Очистить историю",
        confirm_clear: "Удалить всю историю сигналов?",
        today: "Сегодня",
        yesterday: "Вчера",
        days_with_us: "дней с нами",
        signals_got: "сигналов получено",
        language: "Язык",
        theme: "Тёмная тема",
        support: "Поддержка",
        channel: "Telegram-канал",
        invite: "Пригласить друга",
        tour_repeat: "Обучение",

        // ---- Сделка и окно входа ----
        open_trade: "📈 Открыть сделку",
        enter_within: "Оптимальный вход в течение",
        signal_expired: "Окно входа закрыто — возьмите новый сигнал",
        indicators_used: "Сигнал подтверждён индикаторами",

        // ---- Демо-режим ----
        demo_badge: "DEMO",
        demo_sub: "Смотрите, как работает алгоритм. Осталось пробных сигналов:",
        demo_over_t: "Пробные сигналы закончились",
        demo_over_d: "Вы увидели, как работает алгоритм. Полный доступ — без лимитов и с кнопкой входа в сделку — открывается после первого пополнения счёта.",
        demo_unlock: "🔓 Пополнить и открыть доступ",
        demo_after: "После пополнения нажмите «Проверить⚡️» в боте — доступ откроется автоматически.",
        demo_trade_locked: "🔒 Сделки доступны после пополнения",

        // ---- Живая статистика ----
        live_online: "трейдеров онлайн",
        live_winrate: "винрейт за сегодня",
        live_signals: "сигналов за сегодня",
        live_feed: "Лента сигналов",
        live_now: "только что",
        live_min: "мин назад",

        // ---- Серии и задания ----
        quest_title: "Задание дня",
        quest_desc: "Возьмите сигналов сегодня:",
        quest_done: "Задание выполнено — серия продлена 🔥",
        streak_days: "дней подряд",
        best_streak: "лучшая серия",
        level: "Уровень",
        vip_badge: "VIP",
        vip_note: "VIP-доступ активен: приоритетные сигналы и расширенный набор инструментов.",

        // ---- Риск ----
        disclaimer_title: "Предупреждение о рисках",
        disclaimer_text:
            "Торговля бинарными опционами связана с высоким риском потери вложенных средств. " +
            "Сигналы носят информационный характер и не являются индивидуальной инвестиционной " +
            "рекомендацией. Ни один алгоритм не гарантирует прибыль. Рискуйте не более 2–5% депозита " +
            "на сделку и не вкладывайте средства, потерю которых не можете себе позволить.",

        // ---- Обучающий тур ----
        tour_next: "Далее",
        tour_skip: "Пропустить",
        tour_start: "Начать 🚀",
        tour_welcome_t: "Добро пожаловать! 👋",
        tour_welcome_d: "HOG OpenAI 5.0 — ваш AI-ассистент для торговых сигналов. За 30 секунд покажем, как всё устроено.",
        tour_market_t: "Тип рынка",
        tour_market_d: "Standard — классические пары, доступны в часы работы бирж. OTC — работает 24/7, даже в выходные.",
        tour_pair_t: "Валютная пара",
        tour_pair_d: "Нажмите, чтобы выбрать инструмент. Звёздочка добавляет пару в избранное — она всегда будет вверху списка.",
        tour_tf_t: "Таймфрейм",
        tour_tf_d: "Время экспирации сделки. Выбирайте тот же таймфрейм, который ставите у брокера.",
        tour_cta_t: "Получение сигнала",
        tour_cta_d: "Главная кнопка: AI проанализирует рынок и выдаст направление сделки — КУПИТЬ или ПРОДАТЬ — с точностью прогноза.",
        tour_tabs_t: "Навигация",
        tour_tabs_d: "«Рынок» — живые котировки, «История» — ваши прошлые сигналы, «Профиль» — язык, тема и поддержка.",
        tour_markettab_t: "Выбор пары на «Рынке»",
        tour_markettab_d: "Это вкладка «Рынок» с живыми котировками. Нажмите на любую пару — она сразу подставится в сигнал, и вы вернётесь на экран сигнала.",
        tour_done_t: "Всё готово! ⚡",
        tour_done_d: "Вы знаете всё, что нужно. Получите свой первый сигнал прямо сейчас! Повторить обучение можно в Профиле.",

        // ---- Фаза анализа ----
        analysis_connect: "Подключение к торговому серверу…",
        analysis_build: "Свожу показания индикаторов в сигнал…",

        // ---- Вердикты индикаторов ----
        oversold: "перепроданность",
        overbought: "перекупленность",
        bull_cross: "бычье пересечение",
        bear_cross: "медвежье пересечение",
        lower_band: "касание нижней полосы",
        upper_band: "касание верхней полосы",
        golden_cross: "золотой крест",
        death_cross: "крест смерти",
        price_above: "цена выше средней",
        price_below: "цена ниже средней",
        turn_up: "разворот вверх",
        turn_down: "разворот вниз",
        strong_trend: "тренд выраженный",
        vol_ok: "волатильность в норме",
        cloud_above: "цена выше облака",
        cloud_below: "цена ниже облака",
        sar_below: "точки под ценой",
        sar_above: "точки над ценой",
        trend_up: "восходящий тренд",
        trend_down: "нисходящий тренд",
        accumulation: "накопление",
        distribution: "распределение",
        buy_pressure: "давление покупателей",
        sell_pressure: "давление продавцов",
        price_below_vwap: "цена под VWAP",
        price_above_vwap: "цена над VWAP",
        bull_div: "бычья дивергенция",
        bear_div: "медвежья дивергенция",
        impulse_up: "импульс вверх",
        impulse_down: "импульс вниз",
        support: "отбой от поддержки",
        resistance: "отбой от сопротивления",
        breakout_up: "пробой вверх",
        breakout_down: "пробой вниз",
        squeeze: "сжатие волатильности",
    },
    en: {
        ai_online: "AI online",
        tab_signal: "Signal",
        tab_market: "Market",
        tab_history: "History",
        tab_profile: "Profile",
        pair_label: "Currency pair",
        tf_label: "Timeframe",
        get_signal: "Get signal",
        accuracy: "Accuracy",
        buy: "BUY",
        sell: "SELL",
        market_closed: "Market closed",
        market_open_at: "Opens",
        switch_otc: "Switch to OTC",
        search_pair: "Search pair…",
        top_day: "🔥 Top today",
        all_pairs: "All instruments",
        exchange_open: "open",
        exchange_closed: "closed",
        ex_asia: "Asia",
        ex_europe: "Europe",
        ex_america: "America",
        signals_today: "signals today",
        signals_total: "total",
        history_empty: "Your signals will appear here",
        clear_history: "Clear history",
        confirm_clear: "Delete all signal history?",
        today: "Today",
        yesterday: "Yesterday",
        days_with_us: "days with us",
        signals_got: "signals received",
        language: "Language",
        theme: "Dark theme",
        support: "Support",
        channel: "Telegram channel",
        invite: "Invite a friend",
        tour_repeat: "Tutorial",

        // ---- Trade and entry window ----
        open_trade: "📈 Open the trade",
        enter_within: "Best entry within",
        signal_expired: "Entry window closed — get a new signal",
        indicators_used: "Signal confirmed by indicators",

        // ---- Demo mode ----
        demo_badge: "DEMO",
        demo_sub: "See how the algorithm works. Trial signals left:",
        demo_over_t: "Trial signals are over",
        demo_over_d: "You have seen how the algorithm works. Full access — no limits and with the trade button — opens after your first deposit.",
        demo_unlock: "🔓 Deposit and unlock access",
        demo_after: "After the deposit press «Check⚡️» in the bot — access opens automatically.",
        demo_trade_locked: "🔒 Trades available after the deposit",

        // ---- Live stats ----
        live_online: "traders online",
        live_winrate: "win rate today",
        live_signals: "signals today",
        live_feed: "Signal feed",
        live_now: "just now",
        live_min: "min ago",

        // ---- Streaks and quests ----
        quest_title: "Daily goal",
        quest_desc: "Take signals today:",
        quest_done: "Goal completed — streak extended 🔥",
        streak_days: "days in a row",
        best_streak: "best streak",
        level: "Level",
        vip_badge: "VIP",
        vip_note: "VIP access is active: priority signals and an extended set of instruments.",

        // ---- Risk ----
        disclaimer_title: "Risk warning",
        disclaimer_text:
            "Trading binary options involves a high risk of losing your invested funds. " +
            "Signals are informational and are not personal investment advice. No algorithm " +
            "guarantees a profit. Risk no more than 2–5% of your deposit per trade and never " +
            "invest money you cannot afford to lose.",

        // ---- Tutorial ----
        tour_next: "Next",
        tour_skip: "Skip",
        tour_start: "Start 🚀",
        tour_welcome_t: "Welcome! 👋",
        tour_welcome_d: "HOG OpenAI 5.0 is your AI assistant for trading signals. Let us show you around in 30 seconds.",
        tour_market_t: "Market type",
        tour_market_d: "Standard — classic pairs, available during exchange hours. OTC — works 24/7, even on weekends.",
        tour_pair_t: "Currency pair",
        tour_pair_d: "Tap to pick an instrument. The star adds a pair to favorites — it will always stay on top of the list.",
        tour_tf_t: "Timeframe",
        tour_tf_d: "Trade expiration time. Pick the same timeframe you set at your broker.",
        tour_cta_t: "Getting a signal",
        tour_cta_d: "The main button: AI analyzes the market and gives you the trade direction — BUY or SELL — with forecast accuracy.",
        tour_tabs_t: "Navigation",
        tour_tabs_d: "“Market” — live quotes, “History” — your past signals, “Profile” — language, theme and support.",
        tour_markettab_t: "Picking a pair on “Market”",
        tour_markettab_d: "This is the “Market” tab with live quotes. Tap any pair — it's instantly set for the signal and you're taken back to the signal screen.",
        tour_done_t: "All set! ⚡",
        tour_done_d: "You know everything you need. Get your first signal right now! You can replay the tutorial from Profile.",

        // ---- Analysis phase ----
        analysis_connect: "Connecting to the trading server…",
        analysis_build: "Merging indicator readings into a signal…",

        // ---- Indicator verdicts ----
        oversold: "oversold",
        overbought: "overbought",
        bull_cross: "bullish crossover",
        bear_cross: "bearish crossover",
        lower_band: "touching the lower band",
        upper_band: "touching the upper band",
        golden_cross: "golden cross",
        death_cross: "death cross",
        price_above: "price above the average",
        price_below: "price below the average",
        turn_up: "turning up",
        turn_down: "turning down",
        strong_trend: "pronounced trend",
        vol_ok: "volatility is normal",
        cloud_above: "price above the cloud",
        cloud_below: "price below the cloud",
        sar_below: "dots below price",
        sar_above: "dots above price",
        trend_up: "uptrend",
        trend_down: "downtrend",
        accumulation: "accumulation",
        distribution: "distribution",
        buy_pressure: "buying pressure",
        sell_pressure: "selling pressure",
        price_below_vwap: "price under VWAP",
        price_above_vwap: "price over VWAP",
        bull_div: "bullish divergence",
        bear_div: "bearish divergence",
        impulse_up: "upward impulse",
        impulse_down: "downward impulse",
        support: "bounce off support",
        resistance: "rejection at resistance",
        breakout_up: "breakout up",
        breakout_down: "breakout down",
        squeeze: "volatility squeeze",
    },
};

function t(key) {
    // App объявлен через const в core.js и в window не попадает — проверяем через typeof
    const lang = (typeof App !== "undefined" && App.state.lang) || "ru";
    return (I18N[lang] && I18N[lang][key]) || I18N.ru[key] || key;
}

// Проставляет переводы всем элементам с data-i18n / data-i18n-ph
function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
        el.placeholder = t(el.getAttribute("data-i18n-ph"));
    });
}
