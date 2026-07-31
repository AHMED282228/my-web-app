// ============ Точка входа ============

document.addEventListener("DOMContentLoaded", () => {
    initTelegram();
    readParams(); // ?ref=…&uid=…&demo=1&vip=1 от бота

    App.state.lang = detectLang();
    applyTheme(store.get("hog_dark", true)); // тёмная по умолчанию

    initTabs();
    Quests.init(); // до Signal: тот дёргает Quests.bump() на каждом сигнале
    Signal.init();
    Market.init();
    History.init();
    Profile.init();
    Live.init();

    applyI18n();
    Signal.renderDemoState(); // подписи демо зависят от языка — после applyI18n
    Quests.render();
    History.render();
    Profile.render();

    // Обучающий тур при самом первом открытии (один раз)
    Tour.maybeStart();

    // Подтягиваем реальные курсы (fiat + крипта) и перецентровываем цены
    loadRealPrices().then(() => {
        Market.prices = {};
        Market.renderStatic();
    });
});
