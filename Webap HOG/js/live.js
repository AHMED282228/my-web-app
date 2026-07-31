// ============ Живая статистика и лента сигналов ============
// Пустой экран с одной кнопкой не выглядит работающей системой. Счётчик онлайна,
// винрейт дня и лента сигналов дают ощущение, что алгоритм крутится постоянно.
//
// Все цифры выводятся из ОДНОЙ величины — числа подписчиков канала (бот присылает
// его в ?subs=). Поэтому они согласованы между собой: сколько сигналов за сутки,
// с такой же скоростью обновляется лента, и столько же онлайна ожидаемо для канала
// такого размера. Раньше числа жили независимо, и на небольшом канале «1 248 онлайн»
// читалось как выдумка — а выдумка бьёт по доверию сильнее, чем скромные цифры.
//
// В пределах суток числа не скачут: они привязаны к дате и времени и меняются плавно.

const Live = {
    _timer: null,
    _feedTimer: null,
    feed: [],
    online: 0,
    userSignals: 0, // сигналы, взятые самим юзером сегодня — идут в общий счётчик

    // ---------- База: подписчики канала ----------

    subs() {
        const n = parseInt(App.params.subs, 10);
        return Math.max(30, isFinite(n) && n > 0 ? n : CONFIG.FALLBACK_SUBS);
    },

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

    // Доля суточного объёма, которая уже «прошла», с учётом кривой активности:
    // ночью счётчик почти стоит, вечером растёт быстро. Плюс средняя активность —
    // она нужна, чтобы перевести суточный объём в текущую скорость.
    _curve() {
        const now = new Date();
        const nowH = now.getHours() + now.getMinutes() / 60;
        const step = 0.25;
        let passed = 0, total = 0;
        for (let h = 0; h < 24; h += step) {
            const a = this.activity(h + step / 2);
            total += a;
            if (h + step <= nowH) passed += a;
            else if (h < nowH) passed += a * ((nowH - h) / step);
        }
        return { progress: total ? passed / total : 0, avg: total / (24 / step) };
    },

    // ---------- Показатели ----------

    targetOnline() {
        const now = new Date();
        const hour = now.getHours() + now.getMinutes() / 60;
        const base = this.subs() * CONFIG.ONLINE_SHARE;
        // Минутная волна, чтобы число дышало, а не стояло колом
        const wave = Math.sin((now.getMinutes() / 60) * Math.PI * 2) * base * 0.08;
        return Math.max(3, Math.round(base * this.activity(hour) + wave));
    },

    winrate() {
        const value = 85.2 + this.seeded(this.daySeed() + 7) * 5.1;
        const drift = Math.sin((new Date().getHours() / 24) * Math.PI * 2) * 0.4;
        return (value + drift).toFixed(1) + "%";
    },

    // Сколько сигналов алгоритм отдаёт за сутки (стабильно в пределах дня)
    dailyTotal() {
        const jitter = 0.85 + this.seeded(this.daySeed() + 13) * 0.3;
        return Math.max(20, Math.round(this.subs() * CONFIG.SIGNALS_PER_SUB * jitter));
    },

    signalsToday() {
        const base = Math.round(this.dailyTotal() * this._curve().progress);
        return Math.max(1, base) + this.userSignals;
    },

    // Секунд между сигналами ПРЯМО СЕЙЧАС. Из этого же числа живёт лента,
    // поэтому её скорость всегда соответствует счётчику «сигналов за сегодня».
    feedInterval() {
        const now = new Date();
        const hour = now.getHours() + now.getMinutes() / 60;
        const { avg } = this._curve();
        const perSecond = (this.dailyTotal() / 86400) * (this.activity(hour) / (avg || 1));
        if (!isFinite(perSecond) || perSecond <= 0) return 60;
        return Math.min(600, Math.max(5, Math.round(1 / perSecond)));
    },

    fmt(n) {
        return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },

    // ---------- Лента ----------

    randomPair() {
        const all = INSTRUMENTS.standard.concat(INSTRUMENTS.otc);
        return all[Math.floor(Math.random() * all.length)];
    },

    makeEntry(secondsAgo, entry) {
        return Object.assign(
            {
                pair: this.randomPair(),
                dir: Math.random() < 0.5 ? "buy" : "sell",
                acc: (Math.random() * 9 + 85).toFixed(1) + "%",
                ts: Date.now() - secondsAgo * 1000,
                own: false,
            },
            entry || {},
        );
    },

    // Заполняем ленту так, будто сигналы шли с текущей скоростью
    seedFeed() {
        const gap = this.feedInterval();
        this.feed = [];
        for (let i = 0; i < 6; i++) {
            this.feed.push(this.makeEntry(gap * (i + 0.4) + Math.random() * gap * 0.5));
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
                    `<div class="feed-row${it.own ? " own" : ""}">` +
                    `<span class="feed-dir ${it.dir}">${it.dir === "buy" ? "▲" : "▼"}</span>` +
                    `<span class="feed-pair">${it.pair}</span>` +
                    `<span class="feed-acc">${it.acc}</span>` +
                    `<span class="feed-time">${this.ago(it.ts)}</span>` +
                    `</div>`,
            )
            .join("");
    },

    unshift(entry) {
        this.feed.unshift(entry);
        if (this.feed.length > 6) this.feed.length = 6;
        this.renderFeed();
        const first = document.querySelector("#live-feed .feed-row");
        if (first) first.classList.add("in");
    },

    // Сигнал, который взял сам пользователь: попадает и в счётчик, и в ленту —
    // иначе цифры «за сегодня» стоят на месте, пока юзер жмёт кнопку.
    registerUserSignal(pair, dir, acc) {
        const today = new Date().toISOString().slice(0, 10);
        const state = store.get("hog_live_user", { day: null, n: 0 });
        if (state.day !== today) {
            state.day = today;
            state.n = 0;
        }
        state.n += 1;
        store.set("hog_live_user", state);
        this.userSignals = state.n;

        this.unshift(this.makeEntry(0, { pair: pair, dir: dir, acc: acc, own: true }));
        this.render();
        this.scheduleFeed(); // сдвигаем следующий чужой сигнал, чтобы не сдвоился
    },

    // ---------- Отрисовка и таймеры ----------

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
        const step = Math.sign(delta) * Math.min(Math.abs(delta), 1 + Math.random() * 2);
        this.online = Math.round(this.online + step);
        this.render();
    },

    // Интервал плавающий (зависит от времени суток), поэтому не setInterval,
    // а перепланирование после каждого срабатывания
    scheduleFeed() {
        clearTimeout(this._feedTimer);
        const wait = this.feedInterval() * (0.6 + Math.random() * 0.8);
        this._feedTimer = setTimeout(() => {
            if (App.state.view === "signal") this.unshift(this.makeEntry(0));
            this.scheduleFeed();
        }, Math.round(wait * 1000));
    },

    init() {
        const today = new Date().toISOString().slice(0, 10);
        const state = store.get("hog_live_user", { day: null, n: 0 });
        this.userSignals = state.day === today ? state.n : 0;

        this.online = this.targetOnline();
        this.seedFeed();
        this.render();
        this._timer = setInterval(() => this.tick(), 4000);
        this.scheduleFeed();
    },
};
