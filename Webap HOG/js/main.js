// ============ Точка входа ============

document.addEventListener("DOMContentLoaded", () => {
    initTelegram();

    App.state.lang = detectLang();
    applyTheme(store.get("hog_dark", true)); // тёмная по умолчанию

    initTabs();
    Signal.init();
    Market.init();
    History.init();
    Profile.init();

    applyI18n();
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
