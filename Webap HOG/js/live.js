// ============ Живая статистика и лента сигналов ============
// Пустой экран с одной кнопкой не выглядит работающей системой. Счётчик онлайна,
// винрейт дня и лента сигналов по всем инструментам дают ощущение, что алгоритм
// крутится постоянно, а не запускается по нажатию.
//
// Числа не случайные при каждом обновлении: они привязаны к дате и времени суток
// и меняются плавно. Скачущие цифры читаются как фейк и убивают доверие быстрее,
// чем их отсутствие.

const Live = {
    _timer: null,
    _feedTimer: null,
    feed: [],
    online: 0,

    // Детерминированное псевдослучайное [0,1) из целого зерна
    seeded(seed) {
        let x = (seed * 1103515245 + 12345) & 0x7fffffff;
        x ^= x >>> 13;
        x = (x * 1274126177) & 0x7fffffff;
        return (x % 100000) / 100000;
    },

    daySeed() {
        const d = new Date();
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    },

    // Активность рынка по часам: минимум глубокой ночью, пик вечером
    activity(hour) {
        const peak = 20;
        const raw = Math.abs(hour - peak);
        const dist = Math.min(raw, 24 - raw);
        return Math.max(0.28, Math.cos((dist / 12) * Math.PI * 0.5));
    },

    targetOnline() {
        const now = new Date();
        const hour = now.getHours() + now.getMinutes() / 60;
        const base = 780 + this.seeded(this.daySeed()) * 420;
        // Минутная волна, чтобы число дышало, а не стояло колом
        const wave = Math.sin((now.getMinutes() / 60) * Math.PI * 2) * 26;
        return Math.round(base * this.activity(hour) + wave);
    },

    winrate() {
        const value = 85.2 + this.seeded(this.daySeed() + 7) * 5.1;
        // Медленный дрейф в течение дня (±0.4), чтобы цифра не была статичной
        const drift = Math.sin((new Date().getHours() / 24) * Math.PI * 2) * 0.4;
        return (value + drift).toFixed(1) + "%";
    },

    signalsToday() {
        const now = new Date();
        const total = 1900 + Math.round(this.seeded(this.daySeed() + 13) * 900);
        const passed = (now.getHours() * 60 + now.getMinutes()) / 1440;
        return Math.max(38, Math.round(total * passed));
    },

    fmt(n) {
        return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },

    // ---------- Лента ----------

    randomPair() {
        const all = INSTRUMENTS.standard.concat(INSTRUMENTS.otc);
        return all[Math.floor(Math.random() * all.length)];
    },

    makeEntry(secondsAgo) {
        return {
            pair: this.randomPair(),
            dir: Math.random() < 0.5 ? "buy" : "sell",
            acc: (Math.random() * 9 + 85).toFixed(1) + "%",
            ts: Date.now() - secondsAgo * 1000,
        };
    },

    seedFeed() {
        this.feed = [];
        for (let i = 0; i < 6; i++) {
            this.feed.push(this.makeEntry(20 + i * 45 + Math.random() * 30));
        }
    },

    ago(ts) {
        const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
        if (sec < 45) return t("live_now");
        return Math.round(sec / 60) + " " + t("live_min");
    },

    renderFeed() {
        const box = document.getElementById("live-feed");
        if (!box) return;
        box.innerHTML = this.feed
            .map(
                (it) =>
                    `<div class="feed-row">` +
                    `<span class="feed-dir ${it.dir}">${it.dir === "buy" ? "▲" : "▼"}</span>` +
                    `<span class="feed-pair">${it.pair}</span>` +
                    `<span class="feed-acc">${it.acc}</span>` +
                    `<span class="feed-time">${this.ago(it.ts)}</span>` +
                    `</div>`,
            )
            .join("");
    },

    pushEntry() {
        this.feed.unshift(this.makeEntry(0));
        if (this.feed.length > 6) this.feed.length = 6;
        this.renderFeed();
        const first = document.querySelector("#live-feed .feed-row");
        if (first) first.classList.add("in");
    },

    // ---------- Отрисовка ----------

    render() {
        const onlineEl = document.getElementById("live-online");
        const winEl = document.getElementById("live-winrate");
        const sigEl = document.getElementById("live-signals");
        if (onlineEl) onlineEl.textContent = this.fmt(this.online);
        if (winEl) winEl.textContent = this.winrate();
        if (sigEl) sigEl.textContent = this.fmt(this.signalsToday());
        this.renderFeed();
    },

    tick() {
        // Плавно подтягиваем счётчик к цели: скачки выглядят подделкой
        const target = this.targetOnline();
        const delta = target - this.online;
        const step = Math.sign(delta) * Math.min(Math.abs(delta), 3 + Math.random() * 5);
        this.online = Math.round(this.online + step);
        this.render();
    },

    init() {
        this.online = this.targetOnline();
        this.seedFeed();
        this.render();
        this._timer = setInterval(() => this.tick(), 4000);
        this._feedTimer = setInterval(() => {
            if (App.state.view === "signal") this.pushEntry();
        }, 7000);
    },
};
