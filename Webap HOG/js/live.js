// ============ Живая статистика и лента сигналов ============
// Пустой экран с одной кнопкой не выглядит работающей системой. Счётчик онлайна,
// винрейт дня и лента сигналов дают ощущение, что алгоритм крутится постоянно.
//
// Счётчики выводятся из числа подписчиков канала (бот присылает его в ?subs=):
// от него считается онлайн, от онлайна — объём сигналов за сутки. Раньше числа
// жили независимо, и на небольшом канале «1 248 онлайн» читалось как выдумка.
//
// Лента устроена просто: новая строка появляется сверху примерно раз в полсекунды
// днём и раз в полторы ночью, при любом размере канала.

const Live = {
    _timer: null,
    _feedTimer: null,
    feed: [],       // строки ленты, новые сверху
    ownFeed: [],    // свои сигналы за сегодня (переживают закрытие приложения)
    online: 0,
    userSignals: 0, // сигналы, взятые самим юзером сегодня — идут в общий счётчик
    _nextAt: 0,     // когда должна появиться следующая строка ленты

    FEED_SIZE: 6,
    FEED_DAY_SEC: 0.5,   // секунд между строками ленты днём, в среднем
    FEED_NIGHT_SEC: 1.5, // и ночью

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

    daySeed(date) {
        const d = date || new Date();
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

    // Сколько человек в приложении в заданный час
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
    dayJitter(seed) {
        return 0.9 + this.seeded((seed || this.daySeed()) + 13) * 0.2;
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

    // Секунд между строками ленты. Ночь и день берутся из той же таблицы активности,
    // что и онлайн, поэтому утром лента разгоняется плавно, а не скачком.
    feedInterval() {
        const a = this.activity(this.nowHour());
        const day = Math.min(1, Math.max(0, (a - 0.16) / (0.5 - 0.16)));
        return this.FEED_NIGHT_SEC + (this.FEED_DAY_SEC - this.FEED_NIGHT_SEC) * day;
    },

    // Промежуток до следующей строки, мс: с разбросом, чтобы лента не тикала метрономом
    feedDelay() {
        return this.feedInterval() * 1000 * (0.6 + Math.random() * 0.8);
    },

    fmt(n) {
        return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },

    // ---------- Лента ----------

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

    // Новая строка общей ленты. Та же пара дважды подряд не выпадает.
    randomEntry(ts, afterPair) {
        let pair = this.pairFor(Math.random(), Math.random());
        for (let i = 0; i < 5 && pair === afterPair; i++) {
            pair = this.pairFor(Math.random(), Math.random());
        }
        // Точность — среднее двух случайных: значения группируются около 89%,
        // а крайние 85% и 94% выпадают редко, как и бывает на дистанции
        const acc = 85 + ((Math.random() + Math.random()) / 2) * 9;
        return {
            pair: pair,
            dir: Math.random() < 0.5 ? "buy" : "sell",
            acc: acc.toFixed(1) + "%",
            ts: ts,
            own: false,
        };
    },

    ago(ts) {
        const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
        if (sec < 45) return t("live_now");
        return Math.round(sec / 60) + " " + t("live_min");
    },

    rowEl(it) {
        const row = document.createElement("div");
        row.className = "feed-row" + (it.own ? " own" : "");
        const cell = (cls, text) => {
            const span = document.createElement("span");
            span.className = cls;
            span.textContent = text;
            row.appendChild(span);
        };
        cell("feed-dir " + (it.dir === "buy" ? "buy" : "sell"), it.dir === "buy" ? "▲" : "▼");
        cell("feed-pair", it.pair || "");
        cell("feed-acc", it.acc || "");
        cell("feed-time", this.ago(it.ts));
        return row;
    },

    // Полная перерисовка ленты — при запуске, смене языка и после простоя
    renderFeed() {
        const box = document.getElementById("live-feed");
        if (!box) return;
        box.textContent = "";
        this.feed.forEach((it) => box.appendChild(this.rowEl(it)));
        this._dirty = false;
    },

    // Обновляет только подписи времени. Сами строки не трогаем: раньше лента
    // перерисовывалась целиком каждые 4 секунды и обрывала анимацию появления.
    updateTimes() {
        const box = document.getElementById("live-feed");
        if (!box) return;
        if (this._dirty || box.children.length !== this.feed.length) {
            this.renderFeed();
            return;
        }
        this.feed.forEach((it, i) => {
            const cell = box.children[i].querySelector(".feed-time");
            const text = this.ago(it.ts);
            if (cell && cell.textContent !== text) cell.textContent = text;
        });
    },

    // Ставит строку наверх ленты, лишнюю снизу убирает
    pushEntry(entry) {
        this.feed.unshift(entry);
        if (this.feed.length > this.FEED_SIZE) this.feed.length = this.FEED_SIZE;

        const box = document.getElementById("live-feed");
        if (!box) return;
        const row = this.rowEl(entry);
        row.classList.add("in");
        box.insertBefore(row, box.firstChild);
        while (box.children.length > this.feed.length) box.removeChild(box.lastChild);
    },

    // Лента на момент открытия: последние строки «задним числом» + свои сигналы
    fillFeed() {
        const now = Date.now();
        const entries = [];
        let ts = now;
        let last = null;
        for (let i = 0; i < this.FEED_SIZE; i++) {
            ts -= this.feedDelay();
            const entry = this.randomEntry(ts, last);
            last = entry.pair;
            entries.push(entry);
        }
        this.feed = entries
            .concat(this.ownFeed.filter((it) => it && it.ts <= now))
            .sort((a, b) => b.ts - a.ts)
            .slice(0, this.FEED_SIZE);
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
        const entry = { pair: pair, dir: dir, acc: acc, ts: Date.now(), own: true };
        state.n += 1;
        state.feed = (state.feed || []).concat([entry]);
        if (state.feed.length > 6) state.feed = state.feed.slice(-6);
        store.set("hog_live_user", state);

        this.userSignals = state.n;
        this.ownFeed = state.feed;
        this.pushEntry(entry);
        this.render();
    },

    // ---------- Отрисовка и таймеры ----------

    render() {
        const onlineEl = document.getElementById("live-online");
        const winEl = document.getElementById("live-winrate");
        const sigEl = document.getElementById("live-signals");
        if (onlineEl) onlineEl.textContent = this.fmt(this.online);
        if (winEl) winEl.textContent = this.winrate();
        if (sigEl) sigEl.textContent = this.fmt(this.signalsToday());
        this.updateTimes();
    },

    tick() {
        try {
            // Плавно подтягиваем счётчик к цели: скачки выглядят подделкой
            const target = this.targetOnline();
            const delta = target - this.online;
            const step = Math.sign(delta) * Math.min(Math.abs(delta), 1 + Math.random() * 2);
            this.online = Math.round(this.online + step);
            this.render();
        } catch (e) {
            /* один неудачный такт не должен останавливать счётчики */
        }
        this.catchUp(); // сторож: если таймер ленты заглох — поднимает его
    },

    scheduleFeed() {
        clearTimeout(this._feedTimer);
        const delay = this.feedDelay();
        this._nextAt = Date.now() + delay;
        this._feedTimer = setTimeout(() => this.feedStep(), delay);
    },

    // Следующий запуск ставится в любом случае: раньше любая ошибка при
    // отрисовке обрывала цепочку, и лента замирала до перезапуска приложения
    feedStep() {
        try {
            this.pushEntry(this.randomEntry(Date.now(), this.feed[0] && this.feed[0].pair));
            this.updateTimes();
        } catch (e) {
            this._dirty = true; // строки на экране могли разойтись со списком — перерисуем
        } finally {
            this.scheduleFeed();
        }
    },

    // Пока приложение свёрнуто, телефон придерживает или вовсе замораживает
    // таймеры. По возвращении дописываем пропущенные строки и заводим таймер заново.
    catchUp() {
        try {
            const now = Date.now();
            if (this._nextAt && now < this._nextAt + 1500) return; // таймер жив
            const step = this.feedInterval() * 1000;
            const missed = Math.min(
                this.FEED_SIZE,
                1 + Math.floor(Math.max(0, now - this._nextAt) / step),
            );
            for (let k = missed - 1; k >= 0; k--) {
                const entry = this.randomEntry(now - k * step, this.feed[0] && this.feed[0].pair);
                if (k === 0) {
                    this.renderFeed();
                    this.pushEntry(entry); // анимируется только самая свежая
                } else {
                    this.feed.unshift(entry);
                    if (this.feed.length > this.FEED_SIZE) this.feed.length = this.FEED_SIZE;
                }
            }
        } catch (e) {
            /* не вышло дописать — просто идём дальше */
        }
        this.scheduleFeed();
    },

    init() {
        const today = new Date().toISOString().slice(0, 10);
        const state = store.get("hog_live_user", { day: null, n: 0, feed: [] });
        const fresh = state.day === today;
        this.userSignals = fresh ? state.n : 0;
        this.ownFeed = fresh && Array.isArray(state.feed) ? state.feed : [];

        this.online = this.targetOnline();
        this.fillFeed();
        this.render();

        clearInterval(this._timer);
        this._timer = setInterval(() => this.tick(), 4000);
        this.scheduleFeed();

        if (!this._bound) {
            this._bound = true;
            const wake = () => {
                if (!document.hidden) this.catchUp();
            };
            document.addEventListener("visibilitychange", wake);
            window.addEventListener("pageshow", wake);
            window.addEventListener("focus", wake);
        }
    },
};
