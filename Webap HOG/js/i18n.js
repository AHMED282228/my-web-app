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
        analysis: [
            "Подключение к торговому серверу…",
            "Сканирую стакан заявок…",
            "Анализ RSI, MACD и объёмов…",
            "Сверяю прогноз с нейросетью…",
            "Формирую сигнал…",
        ],
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
        analysis: [
            "Connecting to trading server…",
            "Scanning the order book…",
            "Analyzing RSI, MACD and volumes…",
            "Cross-checking with neural network…",
            "Building the signal…",
        ],
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
