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
    ownFeed: [],    // свои сигналы за сегодня (переживают закрытие приложения)
    online: 0,
    userSignals: 0, // сигналы, взятые самим юзером сегодня — идут в общий счётчик
    _nextTs: null,  // время следующего сигнала общего потока

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

    // Активность по часам из таблицы, с линейной интерполяцией между часами —
    // чтобы счётчики не прыгали ступенькой на границе часа
    activity(hour) {
        const table = CONFIG.ACTIVITY_BY_HOUR;
        const h = ((hour % 24) + 24) % 24;
        const i = Math.floor(h);
        const frac = h - i;
        const a = table[i];
        const b = table[(i + 1) % 24];
        return a + (b - a) * frac;
    },

    nowHour() {
        const now = new Date();
        return now.getHours() + now.getMinutes() / 60;
    },

    // Сколько человек в приложении в заданный час. Единственный источник правды:
    // и счётчик онлайна, и скорость сигналов считаются отсюда, поэтому «сколько
    // жмёт кнопку один юзер» получается одинаковым в любое время суток.
    onlineAt(hour) {
        return Math.max(
            3,
            Math.round(this.subs() * CONFIG.ONLINE_SHARE * this.activity(hour)),
        );
    },

    // Сколько сигналов берут ВСЕ, кто сейчас в приложении, за час
    ratePerHour(hour) {
        return this.onlineAt(hour) * CONFIG.SIGNALS_PER_USER_HOUR;
    },

    // Накопленный объём от полуночи до часа untilHour
    _integral(untilHour) {
        const step = 0.25;
        let sum = 0;
        for (let h = 0; h < 24 && h < untilHour; h += step) {
            const width = Math.min(step, untilHour - h);
            sum += this.ratePerHour(h + width / 2) * width;
        }
        return sum;
    },

    // Разброс по дням: одинаковый в пределах суток, иначе цифры «дышали» бы
    // при каждом открытии приложения
    dayJitter() {
        return 0.9 + this.seeded(this.daySeed() + 13) * 0.2;
    },

    // ---------- Показатели ----------

    targetOnline() {
        const now = new Date();
        const base = this.onlineAt(this.nowHour());
        // Минутная волна, чтобы число дышало, а не стояло колом
        const wave = Math.sin((now.getMinutes() / 60) * Math.PI * 2) * base * 0.08;
        return Math.max(3, Math.round(base + wave));
    },

    winrate() {
        const value = 85.2 + this.seeded(this.daySeed() + 7) * 5.1;
        const drift = Math.sin((new Date().getHours() / 24) * Math.PI * 2) * 0.4;
        return (value + drift).toFixed(1) + "%";
    },

    // Сколько сигналов алгоритм отдаёт за полные сутки
    dailyTotal() {
        return Math.max(20, Math.round(this._integral(24) * this.dayJitter()));
    },

    signalsToday() {
        const base = Math.round(this._integral(this.nowHour()) * this.dayJitter());
        return Math.max(1, base) + this.userSignals;
    },

    // Секунд между сигналами ПРЯМО СЕЙЧАС — из той же скорости, что и счётчик
    feedInterval() {
        const perHour = this.ratePerHour(this.nowHour()) * this.dayJitter();
        if (!isFinite(perHour) || perHour <= 0) return 300;
        return Math.min(600, Math.max(4, Math.round(3600 / perHour)));
    },

    fmt(n) {
        return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },

    // ---------- Лента ----------

    // Псевдослучайное число №n сегодняшнего дня. Одинаково при каждом вызове,
    // поэтому весь поток сигналов за сутки воспроизводим.
    _prng(n) {
        return this.seeded(this.daySeed() * 7919 + n * 104729);
    },

    // Пары выбираются неравномерно: большая часть сделок приходится на
    // ходовые инструменты. При равномерном выборе в ленте бесконечно мелькает
    // экзотика вроде QAR/CNY, и сразу видно генератор.
    pairFor(r1, r2) {
        if (r1 < 0.55) {
            const top = INSTRUMENTS.standard
                .slice(0, 6)
                .concat(INSTRUMENTS.otc.slice(0, 6));
            return top[Math.floor(r2 * top.length) % top.length];
        }
        const all = INSTRUMENTS.standard.concat(INSTRUMENTS.otc);
        return all[Math.floor(r2 * all.length) % all.length];
    },

    // Сигнал №i дневного потока — полностью определяется номером и датой
    entryAt(i, ts) {
        const r = (k) => this._prng(i * 8 + k);
        // Точность — среднее двух случайных: значения группируются около 89%,
        // а крайние 85% и 94% выпадают редко, как и бывает на дистанции
        const acc = 85 + ((r(1) + r(2)) / 2) * 9;
        return {
            pair: this.pairFor(r(3), r(4)),
            dir: r(5) < 0.5 ? "buy" : "sell",
            acc: acc.toFixed(1) + "%",
            ts: ts,
            own: false,
        };
    },

    // Свой сигнал: время и параметры настоящие, в общий поток не входит
    makeEntry(secondsAgo, entry) {
        return Object.assign(
            { pair: "", dir: "buy", acc: "", ts: Date.now() - secondsAgo * 1000, own: false },
            entry || {},
        );
    },

    // Разворачиваем поток сигналов с полуночи до момента nowMs.
    //
    // Ключевое: поток ДЕТЕРМИНИРОВАННЫЙ. Раньше лента набивалась случайными
    // числами при каждом запуске — закрыл приложение, открыл, и «история»
    // сигналов уже другая. Это вскрывается за десять секунд. Теперь при
    // повторном открытии видна та же лента, просто состарившаяся, а новые
    // записи появляются только по мере хода времени.
    //
    // Промежутки показательные (пуассоновский поток) со скоростью, зависящей
    // от часа: серии подряд чередуются с затишьем, но средняя частота держится.
    streamUntil(nowMs) {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const startMs = dayStart.getTime();

        const tail = [];
        let hours = 0;
        let i = 0;
        let nextTs = null;

        while (hours < 24 && i < 20000) {
            const rate = Math.max(0.5, this.ratePerHour(hours) * this.dayJitter());
            const u = Math.max(1e-6, this._prng(i * 8));
            hours += Math.min(4 / rate, -Math.log(u) / rate);
            i++;
            const ts = startMs + hours * 3600000;
            if (ts > nowMs) {
                nextTs = ts;
                break;
            }
            tail.push(this.entryAt(i, ts));
            if (tail.length > 12) tail.shift();
        }
        return { entries: tail, nextTs: nextTs };
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

    // Пересобирает ленту: общий поток + свои сигналы, вместе по времени.
    // Свои хранятся отдельно и переживают закрытие приложения, поэтому после
    // повторного открытия остаются на своих местах в общей ленте.
    rebuildFeed() {
        const stream = this.streamUntil(Date.now());
        this._nextTs = stream.nextTs;
        this.feed = stream.entries
            .concat(this.ownFeed)
            .sort((a, b) => b.ts - a.ts)
            .slice(0, 6);
        this.renderFeed();
    },

    // Сигнал, который взял сам пользователь: попадает и в счётчик, и в ленту —
    // иначе цифры «за сегодня» стоят на месте, пока юзер жмёт кнопку.
    registerUserSignal(pair, dir, acc) {
        const today = new Date().toISOString().slice(0, 10);
        const state = store.get("hog_live_user", { day: null, n: 0, feed: [] });
        if (state.day !== today) {
            state.day = today;
            state.n = 0;
            state.feed = [];
        }
        state.n += 1;
        state.feed = (state.feed || []).concat([
            { pair: pair, dir: dir, acc: acc, ts: Date.now(), own: true },
        ]);
        if (state.feed.length > 6) state.feed = state.feed.slice(-6);
        store.set("hog_live_user", state);

        this.userSignals = state.n;
        this.ownFeed = state.feed;
        this.rebuildFeed();
        this.render();

        const first = document.querySelector("#live-feed .feed-row");
        if (first) first.classList.add("in");
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

    // Момент следующего сигнала известен заранее (поток детерминированный),
    // поэтому просто ждём до него, а не выдумываем интервал
    scheduleFeed() {
        clearTimeout(this._feedTimer);
        const wait = this._nextTs
            ? Math.max(1000, this._nextTs - Date.now())
            : 60000;
        this._feedTimer = setTimeout(() => {
            this.rebuildFeed();
            const first = document.querySelector("#live-feed .feed-row");
            if (first) first.classList.add("in");
            this.render();
            this.scheduleFeed();
        }, Math.min(wait, 600000));
    },

    init() {
        const today = new Date().toISOString().slice(0, 10);
        const state = store.get("hog_live_user", { day: null, n: 0, feed: [] });
        const fresh = state.day === today;
        this.userSignals = fresh ? state.n : 0;
        this.ownFeed = fresh ? state.feed || [] : [];

        this.online = this.targetOnline();
        this.rebuildFeed();
        this.render();
        this._timer = setInterval(() => this.tick(), 4000);
        this.scheduleFeed();
    },
};
