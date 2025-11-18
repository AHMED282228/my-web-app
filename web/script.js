// --- Параметры валютных пар для масштабирования графика ---
// Базовая цена и примерный дневной диапазон (High - Low) в пунктах (pips)
// 1 pip = 0.0001 для большинства пар (0.01 для JPY пар)
const pairParameters = {
    // Major Pairs
    "EUR/USD": { basePrice: 1.08, dailyRangePips: 80 },
    "GBP/USD": { basePrice: 1.27, dailyRangePips: 100 },
    "USD/JPY": { basePrice: 151.5, dailyRangePips: 70 }, // JPY pair: 1 pip = 0.01
    "USD/CHF": { basePrice: 0.92, dailyRangePips: 60 },
    "AUD/USD": { basePrice: 0.65, dailyRangePips: 80 },
    "USD/CAD": { basePrice: 1.36, dailyRangePips: 70 },
    "NZD/USD": { basePrice: 0.59, dailyRangePips: 90 },
    // Crossover Pairs
    "EUR/GBP": { basePrice: 0.85, dailyRangePips: 90 },
    "EUR/JPY": { basePrice: 163.0, dailyRangePips: 90 }, // JPY pair
    "GBP/JPY": { basePrice: 192.5, dailyRangePips: 120 }, // JPY pair
    "AUD/JPY": { basePrice: 109.0, dailyRangePips: 100 }, // JPY pair
    "CHF/JPY": { basePrice: 164.5, dailyRangePips: 80 }, // JPY pair
    "EUR/AUD": { basePrice: 1.66, dailyRangePips: 90 },
    "EUR/CAD": { basePrice: 1.47, dailyRangePips: 90 },
    "GBP/AUD": { basePrice: 1.91, dailyRangePips: 110 },
    "GBP/CAD": { basePrice: 1.71, dailyRangePips: 100 },
    "AUD/CAD": { basePrice: 0.89, dailyRangePips: 80 },
    "AUD/CHF": { basePrice: 0.61, dailyRangePips: 80 },
    "NZD/JPY": { basePrice: 98.5, dailyRangePips: 100 }, // JPY pair
    "NZD/CHF": { basePrice: 0.55, dailyRangePips: 80 },
    // OTC Pairs (примерные значения, можно уточнить)
    "EUR/USD OTC": { basePrice: 1.08, dailyRangePips: 100 },
    "EUR/NZD OTC": { basePrice: 1.83, dailyRangePips: 120 },
    "AUD/CAD OTC": { basePrice: 0.89, dailyRangePips: 100 },
    "GBP/USD OTC": { basePrice: 1.27, dailyRangePips: 120 },
    "AED/CNY OTC": { basePrice: 1.97, dailyRangePips: 50 }, // Менее волатильная
    "CHF/JPY OTC": { basePrice: 164.5, dailyRangePips: 90 }, // JPY pair
    "VISA OTC": { basePrice: 250.0, dailyRangePips: 200 }, // Акции, высокая волатильность
    "USD/RUB OTC": { basePrice: 92.5, dailyRangePips: 300 }, // Очень высокая волатильность
    "USD/PKR OTC": { basePrice: 278.0, dailyRangePips: 200 }, // Высокая волатильность
    "AUD/NZD OTC": { basePrice: 1.09, dailyRangePips: 80 },
    "EUR/CHF OTC": { basePrice: 0.97, dailyRangePips: 70 },
    "USD/BRL OTC": { basePrice: 5.2, dailyRangePips: 250 }, // Высокая волатильность
    "UAH/USD OTC": { basePrice: 39.5, dailyRangePips: 400 }, // Очень высокая волатильность
    "CAD/JPY OTC": { basePrice: 113.0, dailyRangePips: 80 }, // JPY pair
    "Toncoin OTC": { basePrice: 5.5, dailyRangePips: 500 }, // Крипта, очень высокая волатильность
    "Tesla OTC": { basePrice: 240.0, dailyRangePips: 400 }, // Акции, высокая волатильность
    "TRON OTC": { basePrice: 0.16, dailyRangePips: 300 }, // Крипта, высокая волатильность
    "TND/USD OTC": { basePrice: 0.32, dailyRangePips: 100 },
    "Solana OTC": { basePrice: 140.0, dailyRangePips: 600 }, // Крипта, очень высокая волатильность
    "Silver OTC": { basePrice: 28.0, dailyRangePips: 200 }, // Товары
    "SP500 OTC": { basePrice: 5200.0, dailyRangePips: 300 }, // Индекс, средняя волатильность
    "SAR/CNY OTC": { basePrice: 1.92, dailyRangePips: 50 }, // Менее волатильная
    "QAR/CNY OTC": { basePrice: 1.92, dailyRangePips: 50 }, // Менее волатильная
    "EUR/GBP OTC": { basePrice: 0.85, dailyRangePips: 100 },
    "EUR/JPY OTC": { basePrice: 163.0, dailyRangePips: 100 }, // JPY pair
    // Fallback для неизвестных пар
    DEFAULT: { basePrice: 1.0, dailyRangePips: 100 },
};
// Вспомогательная функция для определения, является ли пара JPY-парой
function isJpyPair(pair) {
    return pair.includes("/JPY") || pair.includes("JPY/");
}

// --- НОВАЯ ФУНКЦИЯ: Рассчитать реальный диапазон цен для пары ---
function calculateRealPriceRange(pair) {
    const params = pairParameters[pair] || pairParameters.DEFAULT;
    const basePrice = params.basePrice;
    const dailyRangePips = params.dailyRangePips;

    // Определяем стоимость одного пункта (pip)
    const pipSize = isJpyPair(pair) ? 0.01 : 0.0001;

    // Рассчитываем половину диапазона в пунктах
    const halfRangeInPips = dailyRangePips / 2;

    // Рассчитываем минимальную и максимальную цену
    // Добавляем немного запаса (например, 0.5 диапазона) сверху и снизу для лучшего визуального восприятия
    const bufferInPips = halfRangeInPips * 0.5; // 50% от половины диапазона как буфер
    const bufferPrice = bufferInPips * pipSize;

    const minPrice = basePrice - halfRangeInPips * pipSize - bufferPrice;
    const maxPrice = basePrice + halfRangeInPips * pipSize + bufferPrice;

    return { minPrice, maxPrice, basePrice, dailyRangePips, pipSize };
}
// --- КОНЕЦ НОВОЙ ФУНКЦИИ ---

// --- Объект переводов таймфреймов с краткими названиями ---
const timeframeTranslations = {
    en: {
        S5: "S5",
        S15: "S15",
        S30: "S30",
        M1: "M1",
        M3: "M3",
        M5: "M5",
        M15: "M15",
        M30: "M30",
        H1: "H1",
        H4: "H4",
        // Добавьте другие таймфреймы по мере необходимости
    },
    ru: {
        S5: "S5",
        S15: "S15",
        S30: "S30",
        M1: "M1",
        M3: "M3",
        M5: "M5",
        M15: "M15",
        M30: "M30",
        H1: "H1",
        H4: "H4",
        // Добавьте другие таймфреймы по мере необходимости
    }
};

// --- Исправленная функция для создания/обновления кастомного селекта ---
function createCustomSelect(
    selectElementId,
    customSelectId,
    optionsData,
    defaultText,
) {
    const selectElement = document.getElementById(selectElementId); // Оригинальный <select>
    const customSelect = document.getElementById(customSelectId); // Контейнер .custom-select
    const selectedValueSpan = customSelect.querySelector(
        ".custom-select__trigger span",
    ); // Элемент для отображения выбранного значения
    const optionsList = customSelect.querySelector(".custom-options"); // <ul> для опций

    // --- Проверка существования элементов ---
    if (!selectElement || !customSelect || !selectedValueSpan || !optionsList) {
        console.error(
            "createCustomSelect: Required elements not found for IDs:",
            selectElementId,
            customSelectId,
        );
        return;
    }

    // --- Очищаем существующие опции ---
    selectElement.innerHTML = "";
    optionsList.innerHTML = "";

    // --- Заполняем оригинальный select и создаем кастомные опции ---
    let firstOptionValue = null;
    optionsData.forEach((optionData, index) => {
        // Создаем <option> для оригинального select
        const optionEl = document.createElement("option");
        optionEl.value = optionData.value;
        optionEl.textContent = optionData.text;
        selectElement.appendChild(optionEl);

        if (index === 0) firstOptionValue = optionData.value; // Сохраняем значение первой опции

        // Создаем <li> для кастомного списка
        const li = document.createElement("li");
        li.className = "custom-option";
        li.textContent = optionData.text;
        li.dataset.value = optionData.value;
        // Устанавливаем CSS-переменную для анимации задержки
        li.style.setProperty("--index", index);

        // Обработчик клика на кастомной опции
        li.addEventListener("click", () => {
            // Обновляем отображаемое значение
            selectedValueSpan.textContent = optionData.text;
            // Обновляем значение оригинального select
            selectElement.value = optionData.value;
            // Закрываем кастомный список
            customSelect.classList.remove("open");
            // Обновляем состояние selected у кастомных опций
            optionsList.querySelectorAll(".custom-option").forEach((opt) => {
                opt.classList.remove("selected");
            });
            li.classList.add("selected");
        });

        optionsList.appendChild(li);
    });

    // Проверяем, есть ли уже выбранное значение в оригинальном select
    if (
        selectElement.value &&
        selectElement.options.namedItem &&
        selectElement.options.namedItem(selectElement.value)
    ) {
        // Если есть и оно входит в новый список, оставляем его
        const selectedOptionText = selectElement.options.namedItem(
            selectElement.value,
        ).text;
        selectedValueSpan.textContent = selectedOptionText;
        // Отмечаем соответствующую кастомную опцию
        optionsList.querySelectorAll(".custom-option").forEach((opt) => {
            opt.classList.remove("selected");
            if (opt.dataset.value === selectElement.value) {
                opt.classList.add("selected");
            }
        });
    } else if (firstOptionValue !== null) {
        // Если нет или не входит, устанавливаем первую из нового списка
        const firstOption = optionsData[0];
        selectedValueSpan.textContent = firstOption.text;
        selectElement.value = firstOption.value;
        // Отмечаем первую опцию как выбранную
        if (optionsList.firstElementChild) {
            optionsList
                .querySelectorAll(".custom-option")
                .forEach((opt) => opt.classList.remove("selected"));
            optionsList.firstElementChild.classList.add("selected");
        }
    } else {
        // Если список пуст
        selectedValueSpan.textContent = defaultText || "--";
        selectElement.value = "";
    }

    // Проверим, есть ли специальный флаг на элементе.
    if (!customSelect.dataset.customSelectInitialized) {
        // --- Обработчик клика на триггере (открытие/закрытие) ---
        const triggerHandler = (e) => {
            e.stopPropagation(); // Предотвращаем всплытие, чтобы не сработал document click
            customSelect.classList.toggle("open");
            // Закрываем другие кастомные селекты, если они есть
            document.querySelectorAll(".custom-select").forEach((cs) => {
                if (cs !== customSelect) cs.classList.remove("open");
            });
        };
        customSelect
            .querySelector(".custom-select__trigger")
            .addEventListener("click", triggerHandler);

        // --- Обработчик клика вне селекта (закрытие) ---
        const documentClickHandler = (e) => {
            if (!customSelect.contains(e.target)) {
                customSelect.classList.remove("open");
            }
        };
        document.addEventListener("click", documentClickHandler);

        // --- Обработчик клавиатуры (опционально) ---
        const keydownHandler = (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                customSelect.classList.toggle("open");
            }
            // Можно добавить навигацию стрелками, если нужно
        };
        customSelect.addEventListener("keydown", keydownHandler);

        // Устанавливаем флаг, что обработчики добавлены
        customSelect.dataset.customSelectInitialized = "true";
        // console.log(`Custom select handlers initialized for ${customSelectId}`);
    } else {
        // console.log(`Custom select handlers already initialized for ${customSelectId}, skipping.`);
    }
}

// --- Добавляем объект переводов ---
const translations = {
    en: {
        settings: "Signal Settings",
        currency_label: "Currencies",
        time_label: "Time",
        get_signal: "Get Signal",
        signal: "Signal",
        signal_pair_default: "--",
        signal_action_default: "--",
        analyzing_title: "Analyzing market data...",
        analyzing_text: "Our algorithm is processing your request",
        copyright: "© 2025 A3ik GPT X - Professional Trading Analytics",
        market_standard: "Standard",
        market_otc: "OTC",
        join_telegram: "Join Telegram",
        timeframe_label: "Timeframe",
        accuracy_label: "Accuracy",
        // --- НОВОЕ: Переводы для сигнала ---
        signal_buy: "BUY ⬆",
        signal_sell: "SELL ⬇",
        chart_title: "Currency pair chart",
        remaining: "Remaining",
        market_closed: "Market Closed",
        market_will_open: "The market will open on",
        switch_to_otc: "Switch to OTC",
        // --- КОНЕЦ НОВОГО ---
    },
    ru: {
        settings: "Настройки сигнала",
        currency_label: "Валюты",
        time_label: "Время",
        get_signal: "Получить сигнал",
        signal: "Сигнал",
        signal_pair_default: "--",
        signal_action_default: "--",
        analyzing_title: "Анализ данных рынка...",
        analyzing_text: "Наш алгоритм обрабатывает ваш запрос",
        copyright: "© 2025 A3ik GPT X - Профессиональная торговая аналитика",
        market_standard: "Стандарт",
        market_otc: "OTC",
        join_telegram: "Присоединяйтесь к Telegram",
        timeframe_label: "Таймфрейм",
        accuracy_label: "Точность",
        // --- НОВОЕ: Переводы для сигнала ---
        signal_buy: "КУПИТЬ  ⬆",
        signal_sell: "ПРОДАТЬ  ⬇",
        chart_title: "График валютной пары",
        remaining: "Осталось",
        market_closed: "Рынок закрыт",
        market_will_open: "Рынок откроется",
        switch_to_otc: "Перейти в OTC",
        // --- КОНЕЦ НОВОГО ---
    },
};
// --- Восстановленные списки инструментов из исходника ---
const instruments = {
    standard: [
        "EUR/USD",
        "BTC/USD",
        "ETH/USD",
        "USD/RUB",
        "USD/JPY",
        "GBP/USD",
        "USD/CHF",
        "AUD/USD",
        "USD/CAD",
        "NZD/USD",
        "EUR/GBP",
        "EUR/JPY",
        "GBP/JPY",
        "AUD/JPY",
        "CHF/JPY",
        "EUR/AUD",
        "EUR/CAD",
        "GBP/AUD",
        "GBP/CAD",
        "AUD/CAD",
        "AUD/CHF",
        "NZD/JPY",
        "NZD/CHF",
    ],
    otc: [
        "EUR/USD OTC",
        "EUR/NZD OTC",
        "AUD/CAD OTC",
        "GBP/USD OTC",
        "AED/CNY OTC",
        "CHF/JPY OTC",
        "VISA OTC",
        "USD/RUB OTC",
        "GBP/JPY OTC",
        "USD/PKR OTC",
        "AUD/NZD OTC",
        "EUR/CHF OTC",
        "USD/CAD OTC",
        "USD/BRL OTC",
        "UAH/USD OTC",
        "CAD/JPY OTC",
        "Toncoin OTC",
        "Tesla OTC",
        "TRON OTC",
        "TND/USD OTC",
        "Solana OTC",
        "Silver OTC",
        "SP500 OTC",
        "SAR/CNY OTC",
        "QAR/CNY OTC",
        "EUR/GBP OTC",
        "EUR/JPY OTC",
    ],
};
// --- Восстановленные таймфреймы из исходника ---
const timeframes = {
    standard: ["M1", "M3", "M30", "H1"],
    otc: ["S5", "S15", "S30", "M1", "M3", "M30", "H1"],
};
// --- Восстановленное расписание бирж из исходника ---
const marketSchedule = {
    asia: {
        TSE: { open: 0, close: 6 },
        SSE: { open: 1.5, close: 7.5 },
        HKEX: { open: 1.5, close: 7.5 },
    },
    europe: {
        LSE: { open: 8, close: 16.5 },
        Deutsche: { open: 8, close: 16.5 },
        Euronext: { open: 8, close: 16.5 },
    },
    america: {
        NYSE: { open: 14.5, close: 21 },
        NASDAQ: { open: 14.5, close: 21 },
    },
};
let chartAnimationTimeout = null; // Для хранения ID таймаута анимации графика
let currentChartPriceRange = { minPrice: 0, maxPrice: 100 }; // Храним текущий диапазон цен графика
let standardTimerState = { timerId: null, secondsLeft: 60 };
let otcTimerState = { timerId: null, secondsLeft: 60 };

// --- НОВОЕ: Хранилище состояний таймеров ---
const timerStates = {
    standard: { timerId: null, secondsLeft: 60 }, // Начальное значение 60 секунд
    otc: { timerId: null, secondsLeft: 60 },
};
// --- КОНЕЦ НОВОГО ---

// --- Восстановленные функции из исходника ---
// Получение следующего времени открытия рынка
function getNextMarketOpenTime() {
    const now = new Date();
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    const utcDay = now.getUTCDay();
    const createDate = (baseDate, hoursFloat) => {
        const date = new Date(baseDate);
        const hours = Math.floor(hoursFloat);
        const minutes = Math.round((hoursFloat - hours) * 60);
        date.setUTCHours(hours, minutes, 0, 0);
        return date;
    };
    let openTimes = [];
    for (const region of Object.values(marketSchedule)) {
        for (const exchange of Object.values(region)) {
            openTimes.push(exchange.open);
        }
    }
    openTimes.sort((a, b) => a - b);
    const getNextBusinessDay = (date, offset) => {
        const nextDate = new Date(date);
        nextDate.setUTCDate(date.getUTCDate() + offset);
        const nextDay = nextDate.getUTCDay();
        if (nextDay === 0 || nextDay === 6) {
            return getNextBusinessDay(date, offset + 1);
        }
        return nextDate;
    };
    if (utcDay >= 1 && utcDay <= 5) {
        for (const time of openTimes) {
            if (time > utcHours) {
                return createDate(now, time);
            }
        }
        const nextBusinessDay = getNextBusinessDay(now, 1);
        const nextTime = Math.min(...openTimes);
        return createDate(nextBusinessDay, nextTime);
    } else {
        const nextBusinessDay = getNextBusinessDay(now, 1);
        const nextTime = Math.min(...openTimes);
        return createDate(nextBusinessDay, nextTime);
    }
}
// Форматирование даты в DD.MM.YYYY
function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${String(day).padStart(2, "0")}.${String(month).padStart(
        2,
        "0",
    )}.${year}`;
}
// Проверка, открыт ли рынок
function isMarketOpen() {
    const now = new Date();
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    const utcDay = now.getUTCDay();
    if (utcDay === 0 || utcDay === 6) return false;
    for (const region of Object.values(marketSchedule)) {
        for (const exchange of Object.values(region)) {
            if (utcHours >= exchange.open && utcHours < exchange.close) {
                return true;
            }
        }
    }
    return false;
}
// Обновить список инструментов
function updateInstruments(market) {
    const currencySelect = document.getElementById("currency-pair");
    currencySelect.innerHTML = ""; // Очищаем оригинальный select

    // Заполняем оригинальный select
    instruments[market].forEach((pair) => {
        const option = document.createElement("option");
        option.value = pair;
        option.textContent = pair;
        currencySelect.appendChild(option);
    });

    // --- ДОБАВИТЬ СЮДА ---
    // --- После заполнения списка валют ---
    // Создаем или обновляем кастомный селект для валют
    const currencySelectElement = document.getElementById("currency-pair");
    if (currencySelectElement && currencySelectElement.options.length > 0) {
        const currencyOptions = Array.from(currencySelectElement.options).map(
            (opt) => ({ value: opt.value, text: opt.text }),
        );
        createCustomSelect(
            "currency-pair",
            "currency-custom-select",
            currencyOptions,
            "--",
        );
    }
}
// Обновить список таймфреймов с учётом текущего языка
function updateTimeframes(market) {
    const tfList = timeframes[market];
    // НЕ трогаем оригинальный #timeframe напрямую здесь
    const timeframeSelect = document.getElementById("timeframe");
    const currentLang = getCurrentLanguage(); // Получить текущий язык для перевода

    // ВМЕСТО заполнения timeframeSelect, подготавливаем данные для createCustomSelect
    const timeframeOptions = tfList.map((tf) => ({
        value: tf,
        // Использовать перевод, если он есть, иначе оставить оригинальное значение
        text: timeframeTranslations["en"]?.[tf] || tf,
    }));

    // Вызываем createCustomSelect, передавая ему обновлённые данные
    // Предполагается, что createCustomSelect может корректно обновлять существующий кастомный селект
    createCustomSelect(
        "timeframe",
        "timeframe-custom-select",
        timeframeOptions,
        "--",
    );
}

// --- Обновлённая функция updateBottomTimerDisplay ---
// Отображает таймер закрытия рынка ТОЛЬКО если активна вкладка 'standard' и он закрыт.
function updateBottomTimerDisplay(marketType) {
    const cooldownTimerContainer = document.getElementById(
        "cooldown-timer-container",
    );
    const cooldownContent = document.getElementById("cooldown-content");
    if (!cooldownTimerContainer || !cooldownContent) return;

    // Всегда очищаем содержимое и сбрасываем класс
    cooldownContent.innerHTML = "";
    cooldownTimerContainer.classList.remove("market-closed");

    // Полностью скрываем контейнер, если рынок открыт или это OTC
    if (marketType !== "standard" || isMarketOpen()) {
        cooldownTimerContainer.style.display = "none";
        return;
    }

    // Показываем контейнер и заполняем содержимым только для закрытого стандартного рынка
    cooldownTimerContainer.style.display = "block";
    const nextOpenDate = getNextMarketOpenTime();
    const formattedDate = formatDate(nextOpenDate);
    const currentLang = getCurrentLanguage();

    cooldownContent.innerHTML = `
        <div class="market-closed-content">
            <div class="warning-text">${
                translations[currentLang]?.market_will_open ||
                translations["en"]?.market_will_open ||
                "The market will open on"
            } ${formattedDate}</div>
            <div class="tech-connection">
                <div class="connection-line"></div>
                <div class="connection-pulse"></div>
            </div>
            <!-- Кнопка Switch to OTC показывается только здесь, на standard, когда закрыт -->
            <button class="switch-otc-btn" onclick="switchMarket()">${
                translations[currentLang]?.switch_to_otc ||
                translations["en"]?.switch_to_otc ||
                "Switch to OTC"
            }</button>
        </div>`;
    cooldownTimerContainer.classList.add("market-closed");
}
// --- Конец обновлённой функции ---
// --- Конец обновлённой функции ---
// --- Конец обновлённой функции ---

function updateMarketStatus() {
    const activeTab = document.querySelector(".market-tab.active");
    const marketType = activeTab ? activeTab.dataset.market : "standard";
    const getSignalBtn = document.getElementById("get-signal-btn");
    const cooldownTimerContainer = document.getElementById(
        "cooldown-timer-container",
    );
    const cooldownContent = document.getElementById("cooldown-content");
    // Получаем текущий язык для перевода
    const currentLang = getCurrentLanguage();
    const signalText =
        translations[currentLang]?.get_signal ||
        translations["en"]?.get_signal ||
        "Get Signal";
    // --- ИЗМЕНЕНО: Используем перевод для надписи Market Closed ---
    const marketClosedText =
        translations[currentLang]?.market_closed ||
        translations["en"]?.market_closed ||
        "Market Closed";
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    // --- Логика для независимых таймеров ---
    const currentState = timerStates[marketType] || timerStates["standard"];
    // --- Проверка, закрыт ли рынок ---
    // ВАЖНО: Проверяем статус рынка ТОЛЬКО если активный тип - 'standard'
    const isClosed = marketType === "standard" && !isMarketOpen();
    if (isClosed) {
        // --- Рынок Standard ЗАКРЫТ ---
        getSignalBtn.disabled = true;
        // --- ИЗМЕНЕНО: Используем переведённый текст ---
        getSignalBtn.textContent = marketClosedText;
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
        // Получаем время следующего открытия
        const nextOpenDate = getNextMarketOpenTime();
        const formattedDate = formatDate(nextOpenDate);
        // Показываем сообщение о закрытии и кнопку Switch to OTC ТОЛЬКО если активен standard
        // (Хотя по логике, если активен otc, isClosed будет false, так как marketType !== "standard")
        cooldownContent.innerHTML = `
            <div class="market-closed-content">
                <div class="warning-text">${
                    translations[currentLang]?.market_will_open ||
                    translations["en"]?.market_will_open ||
                    "The market will open on"
                } ${formattedDate}</div>
                <div class="tech-connection">
                    <div class="connection-line"></div>
                    <div class="connection-pulse"></div>
                </div>
                <button class="switch-otc-btn" onclick="switchMarket()">${
                    translations[currentLang]?.switch_to_otc ||
                    translations["en"]?.switch_to_otc ||
                    "Switch to OTC"
                }</button>
            </div>
        `;
        cooldownTimerContainer.classList.add("market-closed");
    } else {
        // --- Рынок Standard ОТКРЫТ или активен OTC ---
        if (currentState.timerId !== null) {
            // Таймер для этого режима активен
            getSignalBtn.disabled = true;
            const formattedTime = formatTime(currentState.secondsLeft);
            getSignalBtn.textContent = formattedTime;
        } else {
            // Таймер для этого режима не активен
            getSignalBtn.disabled = false;
            getSignalBtn.textContent = signalText;
        }
        // Убедимся, что режим "рынок закрыт" снят, если он был
        if (
            cooldownTimerContainer &&
            cooldownTimerContainer.classList.contains("market-closed")
        ) {
            cooldownTimerContainer.classList.remove("market-closed");
        }
        // Всегда очищаем содержимое нижнего таймера, если рынок открыт или активен OTC
        // updateBottomTimerDisplay теперь управляет этим
        updateBottomTimerDisplay(marketType); // Передаем marketType, чтобы функция знала, что делать
    }
}
// --- Конец обновленной функции updateMarketStatus ---
// Сбросить отображение сигнала
function resetSignalDisplay() {
    const signalPair = document.getElementById("signal-pair");
    const signalAction = document.getElementById("signal-action");
    const signalTimestamp = document.getElementById("signal-timestamp");
    const signalLoading = document.getElementById("signal-loading");
    const signalContent = document.getElementById("signal-content");
    const cooldownTimer = document.getElementById("cooldown-timer");
    if (signalPair) signalPair.textContent = "--";
    if (signalAction) {
        signalAction.textContent = "--";
        signalAction.className = "signal-action"; // Сброс классов
    }
    if (signalTimestamp) signalTimestamp.textContent = "--:--:--";
    if (cooldownTimer) cooldownTimer.textContent = "--:--";
    if (signalLoading) signalLoading.style.display = "none";
    if (signalContent) {
        signalContent.style.opacity = "1";
        signalContent.style.pointerEvents = "auto";
    }
}
// --- Функция для переключения языка ---
function switchLanguage(lang) {
    // --- ОСТАНОВКА АНИМАЦИИ ГРАФИКА ПРИ СМЕНЕ ЯЗЫКА ---
    // 1. Очистить таймаут анимации графика, если он активен
    if (chartAnimationTimeout) {
        clearTimeout(chartAnimationTimeout);
        chartAnimationTimeout = null;
        // console.log("[DEBUG] Chart animation timeout cleared on language switch");
    }
    // --- Конец остановки анимации ---
    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.getAttribute("data-i18n");
        if (translations[lang] && translations[lang][key] !== undefined) {
            // Проверка для специфичных элементов, например, placeholder'ов или содержимого SVG
            if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
                element.placeholder = translations[lang][key];
            } else if (element.id === "telegram-link-text") {
                // Пример для SVG текста
                for (let i = 0; i < element.childNodes.length; i++) {
                    if (element.childNodes[i].nodeType === Node.TEXT_NODE) {
                        element.childNodes[i].nodeValue =
                            translations[lang][key];
                        break;
                    }
                }
            } else {
                // Стандартная обработка textContent
                element.textContent = translations[lang][key];
            }
        }
    });
    // Обновить текст на кнопке переключения языка
    const languageToggleBtn = document.getElementById("language-toggle");
    if (languageToggleBtn) {
        languageToggleBtn.textContent = lang === "en" ? "RU" : "EN";
    }
    // Сохранить выбранный язык и установить атрибут lang у html
    localStorage.setItem("selectedLanguage", lang);
    document.documentElement.lang = lang;
    // --- СБРОС СИГНАЛА И ГРАФИКА ПРИ СМЕНЕ ЯЗЫКА ---
    // 1. Сбросить отображение сигнала (включая график)
    resetSignalDisplay();
    // --- НОВОЕ: Скрыть прогресс-бар при смене языка ---
    const progressBarContainer = document.getElementById(
        "signal-progress-container",
    );
    if (progressBarContainer) {
        progressBarContainer.classList.remove("show");
        // Ждем окончания анимации, затем скрываем полностью
        setTimeout(() => {
            if (!progressBarContainer.classList.contains("show")) {
                progressBarContainer.style.display = "none";
            }
        }, 300); // Должно совпадать с длительностью transition в CSS
    }
    // --- КОНЕЦ НОВОГО ---
    // 2. Очистить контейнер графика напрямую, на всякий случай
    const candlestickChartContainer = document.getElementById(
        "candlestick-chart-container",
    );
    if (candlestickChartContainer) {
        candlestickChartContainer.innerHTML = "";
    }
    // 3. Очистить ось Y графика
    const yAxisContainer = document.getElementById("y-axis");
    if (yAxisContainer) {
        yAxisContainer.innerHTML = "";
    }
    // 4. Сбросить значения под надписями Таймфрейм и Точность
    const timeframeValueElement = document.getElementById(
        "chart-timeframe-value",
    );
    const accuracyValueElement = document.getElementById(
        "chart-accuracy-value",
    );
    if (timeframeValueElement) {
        timeframeValueElement.textContent = "--";
    }
    if (accuracyValueElement) {
        accuracyValueElement.textContent = "--";
    }
    // --- Конец сброса ---
    // --- Обновить таймфреймы, чтобы отразить перевод ---
    // Определить текущий тип рынка (standard по умолчанию)
    const activeTab = document.querySelector(".market-tab.active");
    const marketType = activeTab ? activeTab.dataset.market : "standard";
    updateTimeframes(marketType);
    // --- ВАЖНО: Обновить статус рынка после сброса и смены языка ---
    // Это исправит надпись на кнопке, если рынок закрыт
    updateMarketStatus();
    // --- Конец обновления ---
}
// --- Функция для получения текущего языка ---
function getCurrentLanguage() {
    const savedLang = localStorage.getItem("selectedLanguage");
    if (savedLang && (savedLang === "en" || savedLang === "ru")) {
        return savedLang;
    }
    return "ru";
}
// --- Функция для переключения темы ---
function toggleTheme() {
    const htmlElement = document.documentElement;
    const isLight = htmlElement.classList.contains("light-theme");
    const themeToggleBtn = document.getElementById("theme-toggle");

    // --- Определение SVG-иконок ---
    // Иконка солнца с лучами
    const sunIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon">
            <circle cx="12" cy="12" r="4"></circle>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
    `;

    // Иконка луны
    const moonIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="theme-icon">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
    `;

    if (isLight) {
        // Переключаемся на тёмную тему -> показываем луну
        htmlElement.classList.remove("light-theme");
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = moonIconSVG; // Иконка луны
        }
    } else {
        // Переключаемся на светлую тему -> показываем солнце
        htmlElement.classList.add("light-theme");
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = sunIconSVG; // Иконка солнца с лучами
        }
    }

    // Сохраняем выбранную тему
    localStorage.setItem(
        "theme",
        htmlElement.classList.contains("light-theme") ? "light" : "dark",
    );
}
// --- Загрузка сохранённой темы ---
function loadSavedTheme() {
    const savedTheme = localStorage.getItem("theme");
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById("theme-toggle");

    // --- Определение SVG-иконок (те же, что и в toggleTheme) ---
    const sunIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon">
            <circle cx="12" cy="12" r="4"></circle>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
    `;

    const moonIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="theme-icon">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
    `;

    // Применяем класс темы к <html>
    if (savedTheme === "light") {
        htmlElement.classList.add("light-theme");
        // При загрузке светлой темы показываем иконку солнца
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = sunIconSVG;
        }
    } else {
        htmlElement.classList.remove("light-theme");
        // При загрузке тёмной темы (или по умолчанию) показываем иконку луны
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = moonIconSVG;
        }
    }
    // Примечание: Блок else внутри loadSavedTheme в исходном коде был пустым или дублировал логику.
    // Теперь он корректно отображает иконку луны по умолчанию.
}
// --- Инициализация приложения ---
document.addEventListener("DOMContentLoaded", function () {
    // --- Инициализация кнопки темы ---
    const themeToggleBtn = document.getElementById("theme-toggle");
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", toggleTheme);
    }
    // --- Загружаем сохранённую тему ---
    loadSavedTheme();
    // --- Инициализация переключателя языка ---
    const languageToggleBtn = document.getElementById("language-toggle");
    if (languageToggleBtn) {
        languageToggleBtn.addEventListener("click", () => {
            const currentLang = getCurrentLanguage();
            const newLang = currentLang === "en" ? "ru" : "en";
            switchLanguage(newLang);
        });
    }
    // --- Загружаем язык при запуске ---
    const initialLang = getCurrentLanguage();
    switchLanguage(initialLang);
    // --- Восстановленная инициализация из исходника, адаптированная под новый код ---
    const marketTabs = document.querySelectorAll(".market-tab");
    const getSignalBtn = document.getElementById("get-signal-btn");
    // --- Инициализация вкладок и селектов -
    marketTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            // ... (очистка графика) ...
            const clickedMarketType = tab.dataset.market;
            // --- УДАЛИТЬ ИЛИ ЗАКОММЕНТИРОВАТЬ ВЕСЬ БЛОК ПРОВЕРКИ isTargetMarketClosed ---
            // const isTargetMarketClosed = clickedMarketType === "standard" && !isMarketOpen();
            // if (isTargetMarketClosed) {
            //     // ... (код показа сообщения о закрытии) ...
            //     return; // <-- УДАЛИТЬ ЭТО
            // } else {
            // --- КОНЕЦ УДАЛЁННОГО БЛОКА ---

            // Стандартная логика переключения вкладки ВСЕГДА выполняется
            marketTabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            updateInstruments(clickedMarketType);
            updateTimeframes(clickedMarketType);
            resetSignalDisplay();
            // updateMarketStatus теперь сама решает, что показывать
            updateMarketStatus(); // <-- ВСЕГДА вызывается
            updateBottomTimerDisplay(clickedMarketType);
            // } // <-- УДАЛИТЬ ЭТУ ЗАКРЫВАЮЩУЮ СКОБКУ else
        });
    });
    // --- Инициализировать селекты при запуске ---
    // Предполагаем, что 'standard' активен по умолчанию
    updateInstruments("standard");
    updateTimeframes("standard");
    resetSignalDisplay();
    updateMarketStatus(); // Проверить статус при загрузке
    // --- Обновленная функция getSignal с изменением надписи на кнопке ---
    function getSignal() {
        // Очистка предыдущей анимации, если она еще идет
        if (chartAnimationTimeout) {
            clearTimeout(chartAnimationTimeout);
            chartAnimationTimeout = null;
        }

        const currencySelect = document.getElementById("currency-pair");
        const timeframeSelect = document.getElementById("timeframe");
        const pair = currencySelect.value;

        // --- НАЧАЛО НОВОГО КОДА: Обновление информации над графиком и определение скорости анимации ---
        // Получаем выбранный таймфрейм
        const selectedTimeframe = timeframeSelect.value;
        // Получаем текущий язык для перевода таймфрейма
        const currentLang = getCurrentLanguage();
        // Переводим таймфрейм, если есть перевод, иначе оставляем оригинальное значение
        const translatedTimeframe =
            timeframeTranslations[currentLang]?.[selectedTimeframe] ||
            selectedTimeframe;
        // Генерируем случайную точность от 85 до 95 с двумя знаками после запятой
        const randomAccuracy = (Math.random() * 10 + 85).toFixed(2) + "%";
        // Находим элементы для отображения значений
        const timeframeValueElement = document.getElementById(
            "chart-timeframe-value",
        );
        const accuracyValueElement = document.getElementById(
            "chart-accuracy-value",
        );
        // Обновляем текст в элементах
        if (timeframeValueElement) {
            timeframeValueElement.textContent = translatedTimeframe;
        }
        if (accuracyValueElement) {
            accuracyValueElement.textContent = randomAccuracy;
        }

        // --- НОВОЕ: Определение скорости анимации в зависимости от таймфрейма ---
        // Карта таймфреймов и соответствующих ПОЛНЫХ длительностей таймфрейма (в миллисекундах)
        const timeframeFullDurations = {
            // Секундные таймфреймы
            S5: 5 * 1000, // 5 секунд = 5000 мс
            S15: 15 * 1000, // 15 секунд = 15000 мс
            S30: 30 * 1000, // 30 секунд = 30000 мс
            // Минутные таймфреймы
            M1: 1 * 60 * 1000, // 1 минута = 60000 мс
            M3: 3 * 60 * 1000, // 3 минуты = 180000 мс
            M5: 5 * 60 * 1000, // 5 минут = 300000 мс (если вдруг добавите)
            M15: 15 * 60 * 1000, // 15 минут = 900000 мс (если вдруг добавите)
            M30: 30 * 60 * 1000, // 30 минут = 1800000 мс
            // Часовые таймфреймы
            H1: 1 * 60 * 60 * 1000, // 1 час = 3600000 мс
            H4: 4 * 60 * 60 * 1000, // 4 часа = 14400000 мс (если вдруг добавите)
            // Добавьте другие таймфреймы и их длительности по необходимости
        };
        // Получаем полную длительность выбранного таймфрейма или используем значение по умолчанию (60000 мс = 1 минута)
        const fullTimeframeDuration =
            timeframeFullDurations[selectedTimeframe] || 60000;
        // Рассчитываем длительность анимации как ПОЛОВИНУ времени таймфрейма
        const totalAnimationDuration = fullTimeframeDuration;
        // Количество свечей для отрисовки (должно совпадать с candleCount в createAnimatedCandlestickChart)
        const totalCandleCount = 20;
        // Рассчитываем задержку между свечами
        // Вычитаем немного времени (например, 50мс), чтобы последняя свеча успела отрисоваться до окончания таймера
        const calculatedDelay =
            totalCandleCount > 1
                ? (totalAnimationDuration - 50) / (totalCandleCount - 1)
                : 0;
        // Ограничиваем минимальную задержку, чтобы анимация не была слишком быстрой (например, минимум 20мс)
        const animationDelay = Math.max(calculatedDelay, 20);
        // Сохраняем задержку в переменной, доступной для функции createAnimatedCandlestickChart
        window.currentAnimationDelay = animationDelay;
        // Также сохраняем общую длительность анимации для отладки или других целей
        window.currentTotalAnimationDuration = totalAnimationDuration;
        // --- КОНЕЦ НОВОГО ---

        // --- ИЗМЕНЕНИЕ: Показываем надпись "Получить сигнал" на кнопке, затем "Анализ..." ---
        const getSignalBtn = document.getElementById("get-signal-btn");
        const signalText =
            translations[currentLang]?.get_signal ||
            translations["en"]?.get_signal ||
            "Get Signal";
        // --- НОВОЕ: Получаем текст для надписи "Анализ..." ---
        const analyzingText =
            translations[currentLang]?.analyzing_title ||
            translations["en"]?.analyzing_title ||
            "Analyzing...";
        // --- КОНЕЦ НОВОГО ---

        if (getSignalBtn) {
            getSignalBtn.disabled = true; // Блокируем кнопку
            getSignalBtn.textContent = signalText; // Сначала показываем надпись "Получить сигнал"
            // --- НОВОЕ: Через небольшую задержку меняем надпись на "Анализ..." ---
            // Это даст время пользователю увидеть первоначальную надпись
            setTimeout(() => {
                // Проверяем, не была ли кнопка разблокирована (например, смена языка)
                // и не изменился ли её текст (например, на таймер) за это время
                if (
                    getSignalBtn.disabled &&
                    getSignalBtn.textContent === signalText
                ) {
                    getSignalBtn.textContent = analyzingText; // Меняем на "Анализ..."
                    getSignalBtn.classList.add("analyzing"); // Добавляем класс для анимации
                }
            }, 100); // Задержка 100мс, можно немного увеличить, если нужно
            // --- КОНЕЦ НОВОГО ---
        }
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---

        // Скрыть контент, показать загрузку
        const signalContent = document.getElementById("signal-content");
        const signalLoading = document.getElementById("signal-loading");
        signalContent.style.opacity = "0";
        signalContent.style.pointerEvents = "none"; // Отключить взаимодействие
        signalLoading.style.display = "flex";

        // Очистить старый график перед новой генерацией
        const candlestickChartContainer = document.getElementById(
            "candlestick-chart-container",
        );
        candlestickChartContainer.innerHTML = "";

        // Имитация задержки
        setTimeout(() => {
            // --- НОВОЕ: Генерация сигнала с учетом перевода ---
            const signalTypes = ["buy", "sell"];
            const randomSignalType =
                signalTypes[Math.floor(Math.random() * signalTypes.length)];
            // Получаем текущий язык для перевода сигнала
            const currentLang = getCurrentLanguage();
            // Переводим сигнал, если есть перевод, иначе используем английский вариант
            let randomSignal;
            if (randomSignalType === "buy") {
                randomSignal =
                    translations[currentLang]?.signal_buy ||
                    translations["en"]?.signal_buy ||
                    "BUY";
            } else {
                // randomSignalType === "sell"
                randomSignal =
                    translations[currentLang]?.signal_sell ||
                    translations["en"]?.signal_sell ||
                    "SELL";
            }
            // --- КОНЕЦ НОВОГО ---

            // Отобразить сигнал
            const signalPair = document.getElementById("signal-pair");
            const signalAction = document.getElementById("signal-action");
            const signalTimestamp = document.getElementById("signal-timestamp");
            signalPair.textContent = pair;
            // Устанавливаем текст сигнала (уже переведённый)
            signalAction.textContent = randomSignal; // 'КУПИТЬ' или 'ПРОДАТЬ'
            // Сброс и установка класса в зависимости от ТИПА сигнала (buy/sell), а не от текста
            signalAction.className = "signal-action"; // Сбрасываем все классы, кроме базового
            if (randomSignalType === "buy") {
                signalAction.classList.add("buy");
            } else if (randomSignalType === "sell") {
                signalAction.classList.add("sell");
            }
            // --- КОНЕЦ НОВОГО БЛОКА ---
            const now = new Date();
            signalTimestamp.textContent = now.toLocaleTimeString(); // Или использовать getCurrentTime из исходника

            // Скрыть загрузку, показать контент
            signalLoading.style.display = "none";
            signalContent.style.opacity = "1";
            signalContent.style.pointerEvents = "auto"; // Включить взаимодействие

            // --- Вызов новой функции для анимированного графика ---
            createAnimatedCandlestickChart(
                randomSignal,
                candlestickChartContainer,
            );

            // --- Запустить таймер обратного отсчета ---
            startCooldown(); // <-- Вот ключевое изменение

            // --- НОВОЕ: Остановка анимации кнопки после запуска таймера ---
            // Убедимся, что анимация остановлена и кнопка отображает таймер
            if (getSignalBtn) {
                // Убираем класс анимации
                getSignalBtn.classList.remove("analyzing");
                // Текст таймера будет установлен внутри startCooldown, но на всякий случай
                // можно здесь не делать ничего, так как startCooldown это обработает.
                // getSignalBtn.textContent = formatTime(timerDuration); // Не нужно, startCooldown сделает это
                // Кнопка уже будет disabled внутри startCooldown
            }
            // --- КОНЕЦ НОВОГО ---
        }, 3000); // Задержка 3 секунды
    }

    // --- Новая/Исправленная функция для создания анимированного свечного графика с большим размахом ---
    function createAnimatedCandlestickChart(signalType, container) {
        // Очистить старый график
        container.innerHTML = "";
        // Очистка предыдущей анимации, если она еще идет
        if (chartAnimationTimeout) {
            clearTimeout(chartAnimationTimeout);
            chartAnimationTimeout = null;
        }

        // --- МОДИФИКАЦИЯ 1: Получить выбранную пару ---
        const currencySelect = document.getElementById("currency-pair");
        const selectedPair = currencySelect ? currencySelect.value : "EUR/USD"; // По умолчанию, если не найдено

        // --- МОДИФИКАЦИЯ 2: Рассчитать реальный диапазон цен ---
        const { minPrice, maxPrice } = calculateRealPriceRange(selectedPair);
        const priceRange = maxPrice - minPrice;
        // --- Сохраняем диапазон цен для оси Y ---
        currentChartPriceRange = { minPrice, maxPrice }; // Можно убрать, если используем calculateRealPriceRange напрямую

        // --- Получаем контейнер оси Y ---
        const yAxisContainer = document.getElementById("y-axis");
        if (yAxisContainer) {
            // --- МОДИФИКАЦИЯ 3: Обновить ось Y с реальными ценами ---
            updateYAxisWithRealPrices(
                yAxisContainer,
                minPrice,
                maxPrice,
                selectedPair,
            ); // Вызов новой функции
        }

        // --- ИЗМЕНЕННЫЕ параметры графика ---
        const candleCount = 20; // Увеличено количество свечей (было 15)
        const candleWidth = 8; // Уменьшена ширина свечи (было 20)
        // candleSpacing будет рассчитано позже
        // --- Конец изменений ---
        const chartHeight = 180; // Высота графика (учитываем padding контейнера)
        const params = pairParameters[selectedPair] || pairParameters.DEFAULT;
        const basePrice = params.basePrice;
        const startPrice = basePrice; // Начинаем с базовой цены пары

        let endPrice;
        // Определяем конечную цену с большим размахом в зависимости от сигнала
        // --- МОДИФИКАЦИЯ 5: Рассчитать движение в реальных пунктах ---
        const pipSize = isJpyPair(selectedPair) ? 0.01 : 0.0001;
        const requiredMovePips = 40 + Math.random() * 20; // Требуемое движение: от 40 до 60 пунктов
        const requiredMovePrice = requiredMovePips * pipSize; // Переводим в цену

        if (signalType === "BUY") {
            // Для BUY конечная цена должна быть значительно выше начальной
            endPrice = startPrice + requiredMovePrice;
        } else {
            // SELL
            // Для SELL конечная цена должна быть значительно ниже начальной
            endPrice = startPrice - requiredMovePrice;
        }
        // Ограничиваем конечную цену в пределах расширенного диапазона
        endPrice = Math.max(minPrice, Math.min(maxPrice, endPrice));

        // Генерируем данные для свечей
        const candles = [];
        // Генерируем промежуточные точки (candleCount - 2, так как первая и последняя уже определены)
        const intermediatePoints = candleCount - 2;
        const intermediatePrices = [];
        if (intermediatePoints > 0) {
            // Рассчитываем "идеальную" линию от startPrice до endPrice
            const priceDelta = (endPrice - startPrice) / (candleCount - 1);
            for (let i = 1; i < candleCount - 1; i++) {
                // Точка на идеальной линии
                const idealPrice = startPrice + priceDelta * i;
                // Добавляем увеличенное случайное отклонение
                // --- МОДИФИКАЦИЯ 6: Использовать реальный размер пункта для волатильности ---
                const volatilityPips = 8; // Волатильность в пунктах
                const volatilityPrice = volatilityPips * pipSize;
                const randomOffset =
                    Math.random() * volatilityPrice * 2 - volatilityPrice;
                let priceWithNoise = idealPrice + randomOffset;
                // Ограничиваем отклонение в пределах диапазона
                priceWithNoise = Math.max(
                    minPrice,
                    Math.min(maxPrice, priceWithNoise),
                );
                intermediatePrices.push(priceWithNoise);
            }
        }
        // Формируем массив всех цен: начальная -> промежуточные -> конечная
        const allPrices = [startPrice, ...intermediatePrices, endPrice];

        // Создаем свечи на основе цен
        for (let i = 0; i < allPrices.length; i++) {
            const open = allPrices[i];
            let close;
            // Для последней свечи закрытие равно endPrice
            if (i === allPrices.length - 1) {
                close = endPrice;
            } else {
                close = allPrices[i + 1];
            }
            // Генерируем high и low относительно open и close с увеличенной амплитудой
            const base = Math.min(open, close);
            const top = Math.max(open, close);
            // --- МОДИФИКАЦИЯ 7: Использовать реальный размер пункта для теней ---
            const shadowVolatilityPips = 6; // Волатильность теней в пунктах
            const shadowVolatilityPrice = shadowVolatilityPips * pipSize;
            // High должен быть >= top, low <= base
            const high = Math.min(
                maxPrice,
                top + Math.random() * shadowVolatilityPrice * 2,
            );
            const low = Math.max(
                minPrice,
                base - Math.random() * shadowVolatilityPrice * 2,
            );
            candles.push({ open, close, high, low });
        }

        // --- НАЧАЛО МОДИФИКАЦИИ: Добавление симметричных отступов слева и справа ---
        const horizontalPadding = 8; // <-- Задайте желаемый отступ слева и справа в пикселях
        // Получаем ширину контейнера для графика
        const containerWidth =
            container.clientWidth || container.offsetWidth || 300;
        // Вычисляем ширину, доступную для свечей (учитываем отступы слева и справа)
        const availableWidthForCandles = containerWidth - 2 * horizontalPadding; // Учитываем оба отступа
        // Рассчитываем общую ширину, необходимую для всех свечей (без учета межсвечного интервала)
        const totalCandlesWidth = candleCount * candleWidth;
        let candleSpacing;
        let leftOffset = horizontalPadding; // <-- Начинаем с левого отступа

        if (totalCandlesWidth <= availableWidthForCandles && candleCount > 1) {
            // Если все свечи помещаются в доступную ширину, рассчитываем равномерное расстояние между ними
            // Общее пространство для интервалов = доступная ширина - общая ширина свечей
            const totalSpacing = availableWidthForCandles - totalCandlesWidth;
            // Интервал между свечами (если n свечей, то n-1 интервалов)
            candleSpacing = totalSpacing / (candleCount - 1);
            // leftOffset уже установлен на horizontalPadding
        } else {
            // Если свечи не помещаются в доступную ширину, уменьшаем интервал между ними до 0 (плотно друг к другу)
            candleSpacing = 0;
            const totalGraphWidth = candleCount * candleWidth; // Ширина всех свечей без интервалов
            // Центрируем получившийся график в *доступной* ширине
            // Это означает, что отступы слева и справа будут соблюдены, а свечи центрируются между ними.
            const centeringOffset =
                (availableWidthForCandles - totalGraphWidth) / 2;
            // Корректируем leftOffset: базовый отступ + центрирующее смещение
            leftOffset = horizontalPadding + centeringOffset;
            // Альтернатива: Если вы хотите, чтобы свечи начинались с самого левого допустимого края
            // даже если не помещаются, установите leftOffset = horizontalPadding;
            // leftOffset = horizontalPadding;
        }
        // --- КОНЕЦ МОДИФИКАЦИИ ---

        // Пересчитываем позицию X
        const calculateX = (index) => {
            // Позиция = начальное смещение (левый отступ) + (индекс * (ширина свечи + интервал))
            return leftOffset + index * (candleWidth + candleSpacing);
        };

        // --- Функция нормализации цены для координат Y с новым диапазоном ---
        const normalize = (price) => {
            // Инвертируем Y, так как 0,0 в CSS находится в верхнем левом углу
            // priceRange уже определен выше (реальный диапазон)
            return (
                chartHeight - ((price - minPrice) / priceRange) * chartHeight
            );
        };

        // --- Установка минимальной высоты тела свечи ---
        const MIN_BODY_HEIGHT = 3; // Минимальная высота тела свечи в пикселях
        // Рисуем свечи с анимацией
        let index = 0;
        const drawNextCandle = () => {
            if (index >= candles.length) {
                chartAnimationTimeout = null; // Сброс ID таймаута по завершении
                return; // Все свечи нарисованы
            }
            const candle = candles[index];
            const x = calculateX(index);
            const openY = normalize(candle.open);
            const closeY = normalize(candle.close);
            const highY = normalize(candle.high);
            const lowY = normalize(candle.low);

            // Создаем элемент свечи
            const candleElement = document.createElement("div");
            candleElement.classList.add("candlestick");
            candleElement.style.position = "absolute"; // Абсолютное позиционирование внутри контейнера графика
            // Определяем цвет свечи
            const isGreen = candle.close > candle.open;
            const candleColor = isGreen
                ? "rgba(39, 174, 96, 0.9)"
                : "rgba(192, 57, 43, 0.9)";
            candleElement.classList.add(
                isGreen ? "green-candle" : "red-candle",
            );

            // --- Расчет тела свечи с минимальной высотой ---
            // Определяем "верх" и "низ" тела свечи
            const bodyTopY = Math.min(openY, closeY);
            const bodyBottomY = Math.max(openY, closeY);
            // Рассчитываем высоту тела
            let bodyHeight = Math.abs(closeY - openY);
            // Если высота тела меньше минимальной, корректируем позицию и высоту
            let adjustedBodyTopY = bodyTopY;
            let adjustedBodyHeight = bodyHeight;
            if (bodyHeight < MIN_BODY_HEIGHT) {
                // Центрируем минимальное тело между bodyTopY и bodyBottomY
                const center = (bodyTopY + bodyBottomY) / 2;
                adjustedBodyTopY = center - MIN_BODY_HEIGHT / 2;
                adjustedBodyHeight = MIN_BODY_HEIGHT;
            }

            // Применяем стили к телу свечи
            candleElement.style.left = `${x}px`;
            candleElement.style.width = `${candleWidth}px`;
            candleElement.style.top = `${adjustedBodyTopY}px`;
            candleElement.style.height = `${adjustedBodyHeight}px`;
            // Не устанавливаем background-color здесь, так как он задается через CSS-класс

            // --- Создание и стилизация фитилей (тень свечи) ---
            // --- Верхняя тень ---
            const wickTop = document.createElement("div");
            wickTop.classList.add("wick");
            wickTop.style.position = "absolute";
            wickTop.style.left = `calc(50% - 0.5px)`; // Центрируем (1px ширина)
            wickTop.style.width = "1px";
            wickTop.style.backgroundColor = candleColor;
            // Высота верхнего фитиля - расстояние от high до верха СКОРРЕКТИРОВАННОГО тела
            const wickTopHeight = adjustedBodyTopY - highY;
            // top фитиля относительно родителя (candleElement) - это разница между high и top свечи
            const wickTopTop = highY - adjustedBodyTopY; // Позиция начала фитиля внутри элемента свечи
            // Добавляем фитиль только если его высота положительна
            if (wickTopHeight > 0) {
                wickTop.style.top = `${wickTopTop}px`;
                wickTop.style.height = `${wickTopHeight}px`;
                candleElement.appendChild(wickTop);
            }
            // --- Нижняя тень ---
            const wickBottom = document.createElement("div");
            wickBottom.classList.add("wick");
            wickBottom.style.position = "absolute";
            wickBottom.style.left = `calc(50% - 0.5px)`; // Центрируем (1px ширина)
            wickBottom.style.width = "1px";
            wickBottom.style.backgroundColor = candleColor;
            // top фитиля относительно родителя (candleElement) - это высота СКОРРЕКТИРОВАННОГО тела свечи
            const wickBottomTop = adjustedBodyHeight;
            // Высота нижнего фитиля - расстояние от низа СКОРРЕКТИРОВАННОГО тела до low
            const wickBottomHeight =
                lowY - (adjustedBodyTopY + adjustedBodyHeight);
            // Добавляем фитиль только если его высота положительна
            if (wickBottomHeight > 0) {
                wickBottom.style.top = `${wickBottomTop}px`;
                wickBottom.style.height = `${wickBottomHeight}px`;
                candleElement.appendChild(wickBottom);
            }

            container.appendChild(candleElement);
            // --- Анимация появления свечи ---
            setTimeout(() => {
                candleElement.classList.add("animate-in");
            }, 10);
            index++;
            // --- ЗАМЕДЛЕННАЯ анимация ---
            chartAnimationTimeout = setTimeout(
                drawNextCandle,
                window.currentAnimationDelay || 300,
            ); // Используем динамическую задержку
        };
        // Начать рисование с первой свечи
        drawNextCandle();
    }
    // --- Конец обновленной функции createAnimatedCandlestickChart ---
    // - НОВАЯ ФУНКЦИЯ: Обновить ось Y с реальными ценами и добавить линии от границы -
    function updateYAxisWithRealPrices(
        yAxisContainer,
        minPrice,
        maxPrice,
        pair,
    ) {
        if (!yAxisContainer) return; // Если контейнер не найден, выходим

        yAxisContainer.innerHTML = ""; // Очищаем содержимое оси Y

        // Определяем количество знаков после запятой
        const decimalPlaces = isJpyPair(pair) ? 2 : 4;

        const labelCount = 5; // Количество меток на оси
        const priceStep = (maxPrice - minPrice) / (labelCount - 1); // Шаг между метками

        // Создаем контейнер для линий
        const linesContainer = document.createElement("div");
        linesContainer.classList.add("y-axis-lines");
        linesContainer.style.position = "absolute";
        linesContainer.style.top = "0";
        linesContainer.style.left = "100%"; // Линии начинаются от правого края контейнера оси Y (границы с графиком)
        linesContainer.style.width = "10000px"; // Делаем ширину большой, чтобы линии точно доходили
        linesContainer.style.height = "100%";
        linesContainer.style.pointerEvents = "none"; // Линии не должны мешать взаимодействию
        yAxisContainer.style.position = "relative"; // Контейнер оси Y должен быть relative для позиционирования linesContainer
        yAxisContainer.appendChild(linesContainer); // Добавляем контейнер для линий в контейнер оси

        // Создаем метки от maxPrice (сверху) до minPrice (снизу)
        for (let i = 0; i < labelCount; i++) {
            const price = maxPrice - priceStep * i; // Идем сверху вниз
            const labelElement = document.createElement("div");
            labelElement.classList.add("y-axis-label");
            // Форматируем цену с правильным количеством знаков после запятой
            labelElement.textContent = price.toFixed(decimalPlaces);
            // Позиционируем метку абсолютно
            labelElement.style.position = "absolute";
            // Рассчитываем вертикальную позицию метки
            // i=0 -> top: 0%, i=4 -> top: 100%
            const topPercentage = (i / (labelCount - 1)) * 100;
            labelElement.style.top = `${topPercentage}%`;
            labelElement.style.left = "0";
            labelElement.style.transform = "translateY(-50%)"; // Центрируем метку по вертикали относительно своей позиции
            labelElement.style.zIndex = "2"; // Метки поверх линий
            labelElement.style.width = "100%"; // Ширина метки 100% контейнера оси Y
            labelElement.style.textAlign = "center"; // Текст по центру метки
            yAxisContainer.appendChild(labelElement);

            // Создаем линию для этой метки
            const lineElement = document.createElement("div");
            lineElement.classList.add("y-axis-line");
            lineElement.style.position = "absolute";
            lineElement.style.top = `${topPercentage}%`;
            lineElement.style.left = "0"; // Линия начинается от левого края linesContainer (границы оси Y)
            lineElement.style.width = "100%"; // Ширина линии равна ширине linesContainer (вправо до края)
            lineElement.style.height = "1px";
            lineElement.style.backgroundColor = "rgba(255, 255, 255, 0.1)"; // Цвет линии (можно настроить)
            lineElement.style.transform = "translateY(-50%)"; // Центрируем линию по вертикали
            lineElement.style.zIndex = "1";
            linesContainer.appendChild(lineElement); // Добавляем линию в контейнер линий
        }
    }
    // - КОНЕЦ НОВОЙ ФУНКЦИИ -
    // - НОВАЯ ФУНКЦИЯ: Обновить ось Y с реальными ценами и добавить сетку с квадратными ячейками -
    function updateYAxisWithRealPrices(
        yAxisContainer,
        minPrice,
        maxPrice,
        pair,
    ) {
        if (!yAxisContainer) return; // Если контейнер не найден, выходим

        yAxisContainer.innerHTML = ""; // Очищаем содержимое оси Y

        // Определяем количество знаков после запятой
        const decimalPlaces = isJpyPair(pair) ? 2 : 4;

        const horizontalLabelCount = 9; // Количество горизонтальных меток на оси
        const verticalLineCount = horizontalLabelCount; // Количество вертикальных линий = количеству горизонтальных для квадратных ячеек
        const priceStep = (maxPrice - minPrice) / (horizontalLabelCount - 1); // Шаг между горизонтальными метками

        // Создаем контейнер для горизонтальных линий
        const horizontalLinesContainer = document.createElement("div");
        horizontalLinesContainer.classList.add("y-axis-horizontal-lines");
        horizontalLinesContainer.style.position = "absolute";
        horizontalLinesContainer.style.top = "0";
        horizontalLinesContainer.style.left = "100%"; // Линии начинаются от правого края контейнера оси Y (границы с графиком)
        horizontalLinesContainer.style.width = "10000px"; // Делаем ширину большой, чтобы линии точно доходили
        horizontalLinesContainer.style.height = "100%";
        horizontalLinesContainer.style.pointerEvents = "none"; // Линии не должны мешать взаимодействию
        yAxisContainer.style.position = "relative"; // Контейнер оси Y должен быть relative для позиционирования linesContainer
        yAxisContainer.appendChild(horizontalLinesContainer); // Добавляем контейнер для горизонтальных линий в контейнер оси

        // Получаем контейнер графика для создания вертикальных линий
        const chartContainer = document.getElementById(
            "candlestick-chart-container",
        );
        let verticalLinesContainer =
            chartContainer.querySelector(".grid-lines");

        // Если контейнер для вертикальных линий уже существует, очищаем его, иначе создаем новый
        if (verticalLinesContainer) {
            verticalLinesContainer.innerHTML = "";
        } else {
            verticalLinesContainer = document.createElement("div");
            verticalLinesContainer.classList.add("grid-lines");
            chartContainer.appendChild(verticalLinesContainer);
        }

        verticalLinesContainer.style.position = "absolute";
        verticalLinesContainer.style.top = "0";
        verticalLinesContainer.style.left = "0";
        verticalLinesContainer.style.width = "100%";
        verticalLinesContainer.style.height = "100%";
        verticalLinesContainer.style.pointerEvents = "none";
        verticalLinesContainer.style.zIndex = "0";

        // Создаем горизонтальные метки и линии
        for (let i = 0; i < horizontalLabelCount; i++) {
            const price = maxPrice - priceStep * i; // Идем сверху вниз
            const labelElement = document.createElement("div");
            labelElement.classList.add("y-axis-label");
            // Форматируем цену с правильным количеством знаков после запятой
            labelElement.textContent = price.toFixed(decimalPlaces);
            // Позиционируем метку абсолютно
            labelElement.style.position = "absolute";
            // Рассчитываем вертикальную позицию метки
            // i=0 -> top: 0%, i=4 -> top: 100%
            const topPercentage = (i / (horizontalLabelCount - 1)) * 100;
            labelElement.style.top = `${topPercentage}%`;
            labelElement.style.left = "0";
            labelElement.style.transform = "translateY(-50%)"; // Центрируем метку по вертикали относительно своей позиции
            labelElement.style.zIndex = "2"; // Метки поверх линий
            labelElement.style.width = "100%"; // Ширина метки 100% контейнера оси Y
            labelElement.style.textAlign = "center"; // Текст по центру метки
            yAxisContainer.appendChild(labelElement);

            // Создаем горизонтальную линию для этой метки
            const horizontalLineElement = document.createElement("div");
            horizontalLineElement.classList.add(
                "grid-line",
                "horizontal-grid-line",
            );
            horizontalLineElement.style.position = "absolute";
            horizontalLineElement.style.top = `${topPercentage}%`;
            horizontalLineElement.style.left = "0"; // Линия начинается от левого края horizontalLinesContainer (границы оси Y)
            horizontalLineElement.style.width = "100%"; // Ширина линии равна ширине horizontalLinesContainer (вправо до края)
            horizontalLineElement.style.height = "1px";
            horizontalLineElement.style.backgroundColor =
                "var(--grid-line-color)";
            horizontalLineElement.style.transform = "translateY(-50%)"; // Центрируем линию по вертикали
            horizontalLineElement.style.zIndex = "1";
            horizontalLinesContainer.appendChild(horizontalLineElement); // Добавляем линию в контейнер горизонтальных линий
        }

        // Создаем вертикальные линии сетки для квадратных ячеек
        // Получаем ширину контейнера графика для расчета интервалов
        const containerWidth = chartContainer
            ? chartContainer.clientWidth
            : 300; // Значение по умолчанию

        // Создаем вертикальные линии с равными интервалами
        for (let i = 0; i < verticalLineCount; i++) {
            // Рассчитываем позицию вертикальной линии в процентах
            const leftPercentage = (i / (verticalLineCount - 1)) * 100;
            const xPosition = (containerWidth * leftPercentage) / 100;

            const verticalLineElement = document.createElement("div");
            verticalLineElement.classList.add(
                "grid-line",
                "vertical-grid-line",
            );
            verticalLineElement.style.position = "absolute";
            verticalLineElement.style.top = "0";
            verticalLineElement.style.left = `${xPosition}px`;
            verticalLineElement.style.width = "1px";
            verticalLineElement.style.height = "100%";
            verticalLineElement.style.backgroundColor =
                "var(--grid-line-color)";
            verticalLineElement.style.zIndex = "1";
            verticalLinesContainer.appendChild(verticalLineElement);
        }
    }
    // - КОНЕЦ НОВОЙ ФУНКЦИИ -
    // - КОНЕЦ НОВОЙ ФУНКЦИИ -
    // --- Назначить обработчик кнопки ---
    getSignalBtn.addEventListener("click", getSignal);
// - Обновленная функция startCooldown с динамическим временем в зависимости от таймфрейма и управлением прогресс-баром -
function startCooldown() {
    const activeTab = document.querySelector(".market-tab.active");
    const marketType = activeTab ? activeTab.dataset.market : "standard";
    const timeframeSelect = document.getElementById("timeframe");
    const selectedTimeframe = timeframeSelect?.value || "M1";

    // Определяем длительность таймера по таймфрейму
    let timerDuration = 60; // По умолчанию 60 секунд
    if (selectedTimeframe === "S5") {
        timerDuration = 5;
    } else if (selectedTimeframe === "S15") {
        timerDuration = 15;
    } else if (selectedTimeframe === "S30") {
        timerDuration = 30;
    }
    // Все остальные (M1, M3, H1 и т.д.) — 60 секунд по умолчанию

    const currentState = timerStates[marketType] || timerStates["standard"];
    const getSignalBtn = document.getElementById("get-signal-btn");
    const signalText =
        translations[getCurrentLanguage()]?.get_signal ||
        translations["en"]?.get_signal ||
        "Get Signal";

    // --- НОВОЕ: Получаем элементы прогресс-бара ---
    const progressBarContainer = document.getElementById(
        "signal-progress-container",
    );
    const progressBarFill = document.getElementById(
        "signal-progress-bar-fill",
    );
    const progressTimerDisplay = document.getElementById(
        "signal-progress-timer",
    );
    const progressLabel = document.getElementById("signal-progress-label");
    // --- КОНЕЦ НОВОГО ---

    // Очищаем предыдущий таймер
    if (currentState.timerId) {
        clearInterval(currentState.timerId);
    }
    let seconds = timerDuration;
    currentState.secondsLeft = seconds;

    // Обновляем нижний таймер (делаем пустым)
    updateBottomTimerDisplay(marketType);

    // Блокируем кнопку и показываем таймер
    if (getSignalBtn) {
        getSignalBtn.disabled = true;
        getSignalBtn.textContent = formatTime(seconds); // <-- Исправлено: форматируем seconds до запуска таймера
        // Убедимся, что анимация остановлена при запуске таймера
        getSignalBtn.classList.remove("analyzing");
    }

    // --- НОВОЕ: Показываем и инициализируем прогресс-бар ---
    if (progressBarContainer && progressBarFill && progressTimerDisplay) {
        // Сбрасываем прогресс-бар
        progressBarFill.style.width = "100%";
        progressTimerDisplay.textContent = formatTime(seconds); // <-- Исправлено: форматируем seconds
        // Показываем контейнер с анимацией
        progressBarContainer.classList.add("show");
        progressBarContainer.style.display = "block";
    }
    // --- КОНЕЦ НОВОГО ---

    // Запускаем таймер
    const timerId = setInterval(() => {
        const currentActiveTab =
            document.querySelector(".market-tab.active");
        const currentMarketType = currentActiveTab
            ? currentActiveTab.dataset.market
            : "standard";

        // --- Исправлено: Проверка и остановка до уменьшения seconds ---
        if (seconds <= 0) {
            clearInterval(timerId);
            currentState.timerId = null;
            currentState.secondsLeft = timerDuration;
            if (getSignalBtn && currentMarketType === marketType) {
                getSignalBtn.disabled = false;
                getSignalBtn.textContent = signalText;
                 // Убедимся, что анимация не запущена при завершении
                getSignalBtn.classList.remove("analyzing");
            }
            // --- НОВОЕ: Скрываем прогресс-бар ---
            if (progressBarContainer) {
                // Начинаем скрывать анимацию
                progressBarContainer.classList.remove("show");
                // Ждем окончания анимации, затем скрываем полностью
                setTimeout(() => {
                    if (!progressBarContainer.classList.contains("show")) {
                        progressBarContainer.style.display = "none";
                    }
                }, 300); // Должно совпадать с длительностью transition в CSS
            }
            // --- КОНЕЦ НОВОГО ---
            // После завершения таймера — снова обновляем нижний таймер (чтобы был пустым)
            updateBottomTimerDisplay(marketType);
            return; // Выходим из интервала
        }
        // --- Конец исправления ---
        seconds--;
        currentState.secondsLeft = seconds;
        if (getSignalBtn && currentMarketType === marketType) {
            getSignalBtn.textContent = formatTime(seconds);
            // Убедимся, что анимация не запущена во время таймера
            getSignalBtn.classList.remove("analyzing");
        }
        // --- НОВОЕ: Обновляем прогресс-бар ---
        if (
            progressBarContainer &&
            progressBarFill &&
            progressTimerDisplay &&
            currentMarketType === marketType
        ) {
            progressTimerDisplay.textContent = formatTime(seconds);
            // Рассчитываем процент оставшегося времени
            const progressPercent = (seconds / timerDuration) * 100;
            // Обновляем ширину полосы прогресса
            progressBarFill.style.width = `${progressPercent}%`;
        }
        // --- КОНЕЦ НОВОГО ---

    }, 1000);

    // Сохраняем ID таймера
    currentState.timerId = timerId;
}
    // --- Вспомогательная функция для форматирования времени ---
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    // --- Функция переключения рынка для кнопки ---
    // --- Исправленная функция переключения рынка для кнопки ---
    window.switchMarket = function () {
        const marketTabs = document.querySelectorAll(".market-tab");
        const activeTab = document.querySelector(".market-tab.active");
        const currentMarket = activeTab ? activeTab.dataset.market : "standard";

        // Определяем, на какой рынок нужно переключиться (противоположный текущему)
        const targetMarket = currentMarket === "standard" ? "otc" : "standard";

        // Ищем вкладку для целевого рынка и кликаем по ней
        marketTabs.forEach((tab) => {
            if (tab.dataset.market === targetMarket) {
                tab.click();
            }
        });

        // --- Сброс отображения таймера и сигнала ---
        // (Эта часть остается как в оригинале)
        const cooldownTimerContainer = document.getElementById(
            "cooldown-timer-container",
        );
        const cooldownContent = document.getElementById("cooldown-content");
        if (cooldownTimerContainer && cooldownContent) {
            cooldownTimerContainer.classList.remove("market-closed");
            // Просто очищаем содержимое, updateBottomTimerDisplay теперь управляет этим
            cooldownContent.innerHTML = "";
        }
        const getSignalBtn = document.getElementById("get-signal-btn");
        if (getSignalBtn) getSignalBtn.disabled = false;
        resetSignalDisplay(); // Сбросить сигнал при переключении
    };
    // --- Конец исправленной функции ---

    // Найти все стандартные селекты с классом modern-select
    const modernSelects = document.querySelectorAll("select.modern-select");

    modernSelects.forEach((select) => {
        // Добавить класс 'focus' при получении фокуса
        select.addEventListener("focus", function () {
            this.classList.add("focus");
        });

        // Убрать класс 'focus' при потере фокуса
        select.addEventListener("blur", function () {
            this.classList.remove("focus");
        });
    });
});
