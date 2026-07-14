// ============ Раздел «Профиль»: юзер из Telegram, стата, настройки ============

const Profile = {
    init() {
        // Дата первого запуска — для счётчика «дней с нами»
        if (!store.get("hog_first", null)) {
            store.set("hog_first", Date.now());
        }

        // Язык
        document.querySelectorAll("#lang-seg button").forEach((btn) => {
            btn.addEventListener("click", () => {
                haptic("light");
                setLang(btn.dataset.lang);
                this.syncLangSeg();
            });
        });

        // Тема
        document.getElementById("theme-switch").addEventListener("click", () => {
            haptic("light");
            const isDark = !document.documentElement.classList.contains("light-theme");
            applyTheme(!isDark);
        });

        // Ссылки
        document.getElementById("link-support").href = CONFIG.SUPPORT_URL;
        document.getElementById("link-channel").href = CONFIG.CHANNEL_URL;

        const invite = document.getElementById("link-invite");
        const uid = App.tg?.initDataUnsafe?.user?.id;
        if (CONFIG.BOT_USERNAME && uid) {
            const botLink = `https://t.me/${CONFIG.BOT_USERNAME}?start=${uid}`;
            invite.href =
                "https://t.me/share/url?url=" + encodeURIComponent(botLink);
            invite.hidden = false;
        }

        // Повторный запуск обучающего тура
        document.getElementById("link-tour").addEventListener("click", (e) => {
            e.preventDefault();
            haptic("light");
            Tour.start();
        });

        this.renderUser();
        this.syncLangSeg();
    },

    renderUser() {
        const user = App.tg?.initDataUnsafe?.user || null;
        const nameEl = document.getElementById("profile-name");
        const unameEl = document.getElementById("profile-username");
        const avatar = document.getElementById("avatar");

        const first = (user && user.first_name) || "Trader";
        nameEl.textContent = first + ((user && user.last_name) ? " " + user.last_name : "");
        unameEl.textContent = user && user.username ? "@" + user.username : "";

        if (user && user.photo_url) {
            avatar.style.backgroundImage = `url(${user.photo_url})`;
            avatar.textContent = "";
        } else {
            avatar.textContent = first.charAt(0).toUpperCase();
        }
    },

    bumpSignals() {
        store.set("hog_count", store.get("hog_count", 0) + 1);
    },

    syncLangSeg() {
        document.querySelectorAll("#lang-seg button").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.lang === App.state.lang);
        });
    },

    render() {
        const first = store.get("hog_first", Date.now());
        const days = Math.max(1, Math.ceil((Date.now() - first) / 86400000));
        document.getElementById("prof-days").textContent = days;
        document.getElementById("prof-signals").textContent =
            store.get("hog_count", 0);
        this.syncLangSeg();
    },
};
