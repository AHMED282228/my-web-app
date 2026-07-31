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

    // Пары выбираются неравномерно: большая часть сделок приходится на
    // ходовые инструменты. При равномерном выборе в ленте бесконечно мелькает
    // экзотика вроде QAR/CNY, и сразу видно генератор.
    randomPair() {
        if (Math.random() < 0.55) {
            const top = INSTRUMENTS.standard
                .slice(0, 6)
                .concat(INSTRUMENTS.otc.slice(0, 6));
            return top[Math.floor(Math.random() * top.length)];
        }
        const all = INSTRUMENTS.standard.concat(INSTRUMENTS.otc);
        return all[Math.floor(Math.random() * all.length)];
    },

    makeEntry(secondsAgo, entry) {
        // Точность — среднее двух случайных: значения группируются около 89%,
        // а крайние 85% и 94% выпадают редко, как и бывает на дистанции
        const acc = 85 + ((Math.random() + Math.random()) / 2) * 9;
        return Object.assign(
            {
                pair: this.randomPair(),
                dir: Math.random() < 0.5 ? "buy" : "sell",
                acc: acc.toFixed(1) + "%",
                ts: Date.now() - secondsAgo * 1000,
                own: false,
            },
            entry || {},
        );
    },

    // Пауза до следующего сигнала. Показательное распределение — так ведут себя
    // независимые случайные события: серии подряд чередуются с затишьем, но
    // средняя частота сохраняется. Равномерный интервал шёл бы как метроном
    // и выдавал бы скрипт с первого взгляда.
    nextGap(mean) {
        const u = Math.max(1e-6, Math.random());
        return Math.min(mean * 4, -Math.log(u) * mean);
    },

    // Заполняем ленту так, будто сигналы шли с текущей скоростью
    seedFeed() {
        const mean = this.feedInterval();
        this.feed = [];
        let ago = this.nextGap(mean) * 0.5;
        for (let i = 0; i < 6; i++) {
            this.feed.push(this.makeEntry(ago));
            ago += this.nextGap(mean);
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

    // Интервал случайный и плавающий (зависит от времени суток), поэтому не
    // setInterval, а перепланирование после каждого срабатывания
    scheduleFeed() {
        clearTimeout(this._feedTimer);
        const wait = this.nextGap(this.feedInterval());
        this._feedTimer = setTimeout(() => {
            if (App.state.view === "signal") {
                this.unshift(this.makeEntry(0));
                // Иногда двое жмут кнопку почти одновременно — в реальном потоке
                // такие сдвоенные записи обязательно встречаются
                if (Math.random() < 0.18) {
                    setTimeout(() => {
                        if (App.state.view === "signal") this.unshift(this.makeEntry(0));
                    }, 700 + Math.random() * 2000);
                }
            }
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
