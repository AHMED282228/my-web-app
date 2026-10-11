// ============ Ядро: состояние, Telegram API, табы, хранилище ============

const App = {
    tg: window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null,
    state: {
        view: "signal",
        market: "otc",
        pair: "EUR/USD OTC",
        tf: "M1",
        lang: "ru",
        favorites: [],
    },
    // Параметры от бота: реф-ссылка брокера, режим витрины, VIP и число
    // подписчиков канала (база для «живых» цифр)
    params: { ref: "", uid: null, demo: false, vip: false, subs: null, lang: null },
};

// --- Параметры запуска (?ref=...&uid=...&demo=1&vip=1) ---
function readParams() {
    let query = window.location.search;
    // Telegram может отдать параметры в hash — подстраховываемся
    if (!query && window.location.hash.indexOf("?") !== -1) {
        query = window.location.hash.slice(window.location.hash.indexOf("?"));
    }
    const params = new URLSearchParams(query);
    App.params.ref = params.get("ref") || CONFIG.REF_URL;
    App.params.uid = params.get("uid") || App.tg?.initDataUnsafe?.user?.id || null;
    App.params.demo = params.get("demo") === "1";
    App.params.vip = params.get("vip") === "1";
    App.params.subs = params.get("subs");
    App.params.lang = params.get("lang");
    applyBotQuotes(params.get("px")); // цены акций и металлов от бота
    document.documentElement.classList.toggle("is-demo", App.params.demo);
    document.documentElement.classList.toggle("is-vip", App.params.vip);
}

// Открывает терминал брокера: главный способ превратить сигнал в реальную сделку.
// Без этого вебапп — тупик: юзер смотрит сигнал и никуда не идёт.
function openBroker() {
    const url = App.params.ref || CONFIG.REF_URL;
    hapticNotify("success");
    try {
        if (App.tg?.openLink) App.tg.openLink(url);
        else window.open(url, "_blank");
    } catch (e) {
        window.open(url, "_blank");
    }
}

// --- Хранилище (localStorage, JSON) ---
const store = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            /* нет места — не критично */
        }
    },
};

// Зеркало в Telegram CloudStorage (переживает чистку кэша)
const cloud = {
    set(key, value) {
        try {
            App.tg?.CloudStorage?.setItem(key, JSON.stringify(value), () => {});
        } catch (e) {}
    },
    get(key, cb) {
        try {
            App.tg?.CloudStorage?.getItem(key, (err, raw) => {
                if (!err && raw) {
                    try {
                        cb(JSON.parse(raw));
                        return;
                    } catch (e) {}
                }
                cb(null);
            });
        } catch (e) {
            cb(null);
        }
    },
};

function haptic(style) {
    try {
        App.tg?.HapticFeedback?.impactOccurred(style || "light");
    } catch (e) {}
}

function hapticNotify(type) {
    try {
        App.tg?.HapticFeedback?.notificationOccurred(type || "success");
    } catch (e) {}
}

// Длинный «AirDrop-style» отклик: серия нарастающих импульсов + успех.
// (Telegram не даёт задать длительность вибрации напрямую — собираем из импульсов.)
function hapticLongSuccess() {
    haptic("light");
    setTimeout(() => haptic("medium"), 90);
    setTimeout(() => haptic("heavy"), 200);
    setTimeout(() => hapticNotify("success"), 330);
    setTimeout(() => haptic("heavy"), 480);
}

// --- Telegram WebApp ---
function initTelegram() {
    if (!App.tg) return;
    try {
        App.tg.ready();
        App.tg.expand();
        App.tg.setHeaderColor && App.tg.setHeaderColor("#06080f");
        App.tg.setBackgroundColor && App.tg.setBackgroundColor("#06080f");
    } catch (e) {}
}

// --- Язык ---
function detectLang() {
    // Язык, выбранный в боте, главнее: сменил его там — приложение переключится
    // следом. Но только один раз на каждую смену, чтобы не затирать язык,
    // который человек потом выбрал уже в самом приложении.
    const fromBot = App.params.lang;
    if (fromBot && I18N[fromBot] && store.get("hog_lang_bot", null) !== fromBot) {
        store.set("hog_lang_bot", fromBot);
        store.set("hog_lang", fromBot);
        return fromBot;
    }
    const saved = store.get("hog_lang", null);
    if (saved && I18N[saved]) return saved;
    const code = String(
        App.tg?.initDataUnsafe?.user?.language_code || navigator.language || "",
    ).toLowerCase();
    const known = LANG_ORDER.find((l) => code.indexOf(l) === 0);
    return known || "en";
}

function setLang(lang) {
    if (!I18N[lang]) lang = "en";
    App.state.lang = lang;
    store.set("hog_lang", lang);
    applyI18n();
    // Перерисовать динамические части на новом языке
    Signal.renderClosedState();
    Signal.renderDemoState();
    Market.renderStatic();
    History.render();
    Profile.render();
    Quests.render();
    Live.render();
}

// --- Тема ---
function applyTheme(dark) {
    document.documentElement.classList.toggle("light-theme", !dark);
    store.set("hog_dark", dark);
    const sw = document.getElementById("theme-switch");
    if (sw) sw.classList.toggle("on", dark);
    try {
        const color = dark ? "#06080f" : "#eef0f6";
        App.tg?.setHeaderColor && App.tg.setHeaderColor(color);
        App.tg?.setBackgroundColor && App.tg.setBackgroundColor(color);
    } catch (e) {}
}

// --- Табы ---
function switchView(name) {
    if (App.state.view === name) return;
    App.state.view = name;
    haptic("light");

    document.querySelectorAll(".view").forEach((v) => {
        v.classList.toggle("active", v.id === "view-" + name);
    });
    document.querySelectorAll(".tabbar .tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.view === name);
    });

    // Живые цены гоняем только когда открыт «Рынок»
    if (name === "market") Market.start();
    else Market.stop();

    if (name === "history") History.render();
    if (name === "profile") Profile.render();

    // Системная кнопка «Назад» в Telegram возвращает на Сигнал
    try {
        if (App.tg?.BackButton) {
            if (name === "signal") App.tg.BackButton.hide();
            else App.tg.BackButton.show();
        }
    } catch (e) {}
}

function initTabs() {
    document.querySelectorAll(".tabbar .tab").forEach((tab) => {
        tab.addEventListener("click", () => switchView(tab.dataset.view));
    });
    try {
        App.tg?.BackButton?.onClick(() => switchView("signal"));
    } catch (e) {}
}
