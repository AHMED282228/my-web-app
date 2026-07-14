// ============ Ядро: состояние, Telegram API, табы, хранилище ============

const App = {
    tg: window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null,
    state: {
        view: "signal",
        market: "standard",
        pair: "EUR/USD",
        tf: "M1",
        lang: "ru",
        favorites: [],
    },
};

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
    const saved = store.get("hog_lang", null);
    if (saved === "ru" || saved === "en") return saved;
    const code =
        App.tg?.initDataUnsafe?.user?.language_code ||
        navigator.language ||
        "";
    return String(code).toLowerCase().indexOf("ru") === 0 ? "ru" : "en";
}

function setLang(lang) {
    App.state.lang = lang;
    store.set("hog_lang", lang);
    applyI18n();
    // Перерисовать динамические части на новом языке
    Signal.renderClosedState();
    Market.renderStatic();
    History.render();
    Profile.render();
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
