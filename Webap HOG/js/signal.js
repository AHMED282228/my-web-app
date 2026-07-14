// ============ Раздел «Сигнал»: выбор, анализ, график, кулдаун ============

const Signal = {
    cooldownUntil: { standard: 0, otc: 0 },
    cooldownTotal: { standard: 60, otc: 60 },
    busy: false,
    _tick: null,

    el(id) {
        return document.getElementById(id);
    },

    init() {
        App.state.favorites = store.get("hog_favs", []);

        // Segmented Standard/OTC
        document.querySelectorAll("#market-seg .seg-btn").forEach((btn) => {
            btn.addEventListener("click", () => this.setMarket(btn.dataset.market));
        });

        // Выбор пары (bottom-sheet)
        this.el("pair-select-btn").addEventListener("click", () => this.openSheet());
        this.el("pair-sheet").addEventListener("click", (e) => {
            if (e.target === this.el("pair-sheet")) this.closeSheet();
        });
        this.el("pair-search").addEventListener("input", () => this.renderSheet());

        // Избранное
        this.el("fav-btn").addEventListener("click", () => {
            this.toggleFav(App.state.pair);
            haptic("light");
        });

        this.el("get-signal-btn").addEventListener("click", () => this.getSignal());
        this.el("switch-otc-btn").addEventListener("click", () => this.setMarket("otc"));

        this.renderTfChips();
        this.updateFavBtn();
        this.renderClosedState();
        setInterval(() => this.renderClosedState(), 60 * 1000);

        this._tick = setInterval(() => this.tickCooldown(), 500);
    },

    // ---------- Рынок / пара / таймфрейм ----------

    setMarket(market) {
        if (App.state.market === market) return;
        App.state.market = market;
        haptic("light");

        const seg = this.el("market-seg");
        seg.dataset.active = market;
        seg.querySelectorAll(".seg-btn").forEach((b) =>
            b.classList.toggle("active", b.dataset.market === market),
        );

        // Пара и ТФ должны существовать в новом списке
        if (INSTRUMENTS[market].indexOf(App.state.pair) === -1) {
            const fav = App.state.favorites.find(
                (p) => INSTRUMENTS[market].indexOf(p) !== -1,
            );
            this.setPair(fav || INSTRUMENTS[market][0]);
        }
        if (TIMEFRAMES[market].indexOf(App.state.tf) === -1) {
            App.state.tf = TIMEFRAMES[market][0];
        }

        this.renderTfChips();
        this.renderClosedState();
        this.hideSignalCard();
        Market.renderStatic();
    },

    setPair(pair) {
        App.state.pair = pair;
        this.el("pair-current").textContent = pair;
        this.updateFavBtn();
    },

    renderTfChips() {
        const box = this.el("tf-chips");
        box.innerHTML = "";
        TIMEFRAMES[App.state.market].forEach((tf) => {
            const chip = document.createElement("button");
            chip.className = "chip" + (tf === App.state.tf ? " active" : "");
            chip.textContent = tf;
            chip.addEventListener("click", () => {
                App.state.tf = tf;
                haptic("light");
                box.querySelectorAll(".chip").forEach((c) =>
                    c.classList.toggle("active", c.textContent === tf),
                );
            });
            box.appendChild(chip);
        });
    },

    // ---------- Избранное ----------

    toggleFav(pair) {
        const i = App.state.favorites.indexOf(pair);
        if (i === -1) App.state.favorites.unshift(pair);
        else App.state.favorites.splice(i, 1);
        store.set("hog_favs", App.state.favorites);
        this.updateFavBtn();
    },

    updateFavBtn() {
        const on = App.state.favorites.indexOf(App.state.pair) !== -1;
        const btn = this.el("fav-btn");
        btn.textContent = on ? "★" : "☆";
        btn.classList.toggle("on", on);
    },

    // ---------- Bottom-sheet выбора пары ----------

    openSheet() {
        haptic("light");
        this.el("pair-search").value = "";
        this.renderSheet();
        this.el("pair-sheet").classList.add("open");
    },

    closeSheet() {
        this.el("pair-sheet").classList.remove("open");
    },

    renderSheet() {
        const list = this.el("pair-list");
        const q = this.el("pair-search").value.trim().toLowerCase();
        const all = INSTRUMENTS[App.state.market];
        const favs = App.state.favorites.filter((p) => all.indexOf(p) !== -1);
        const rest = all.filter((p) => favs.indexOf(p) === -1);
        const pairs = favs.concat(rest).filter(
            (p) => !q || p.toLowerCase().indexOf(q) !== -1,
        );

        list.innerHTML = "";
        pairs.forEach((pair) => {
            const li = document.createElement("li");
            li.className =
                "sheet-item" + (pair === App.state.pair ? " selected" : "");

            const name = document.createElement("span");
            name.textContent = pair;
            li.appendChild(name);

            const star = document.createElement("span");
            const isFav = App.state.favorites.indexOf(pair) !== -1;
            star.className = "si-star" + (isFav ? " on" : "");
            star.textContent = isFav ? "★" : "☆";
            star.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleFav(pair);
                this.renderSheet();
            });
            li.appendChild(star);

            li.addEventListener("click", () => {
                this.setPair(pair);
                haptic("light");
                this.closeSheet();
            });
            list.appendChild(li);
        });
    },

    // ---------- Рынок закрыт (Standard) ----------

    renderClosedState() {
        const closed = App.state.market === "standard" && !isMarketOpen();
        this.el("closed-card").hidden = !closed;
        this.el("get-signal-btn").disabled =
            closed || this.busy || this.cooldownLeft() > 0;
        if (closed) {
            const dt = nextMarketOpen();
            const dd = String(dt.getDate()).padStart(2, "0");
            const mm = String(dt.getMonth() + 1).padStart(2, "0");
            this.el("closed-until").textContent =
                t("market_open_at") + " " + dd + "." + mm + "." + dt.getFullYear();
            this.hideSignalCard();
        }
    },

    hideSignalCard() {
        this.el("signal-card").hidden = true;
        this.el("analysis-card").hidden = true;
    },

    // ---------- Кулдаун ----------

    cooldownLeft() {
        return Math.max(
            0,
            Math.ceil((this.cooldownUntil[App.state.market] - Date.now()) / 1000),
        );
    },

    startCooldown() {
        const secByTf = { S5: 5, S15: 15, S30: 30 };
        const total = secByTf[App.state.tf] || 60;
        this.cooldownTotal[App.state.market] = total;
        this.cooldownUntil[App.state.market] = Date.now() + total * 1000;
        this.el("cooldown-track").hidden = false;
    },

    tickCooldown() {
        const left = this.cooldownLeft();
        const btn = this.el("get-signal-btn");
        const label = this.el("cta-label");
        const track = this.el("cooldown-track");

        if (this.busy) return;

        if (left > 0) {
            btn.disabled = true;
            const m = String(Math.floor(left / 60)).padStart(2, "0");
            const s = String(left % 60).padStart(2, "0");
            label.textContent = m + ":" + s;
            track.hidden = false;
            const total = this.cooldownTotal[App.state.market] || 60;
            this.el("cooldown-fill").style.width =
                Math.max(0, (left / total) * 100) + "%";
        } else {
            label.textContent = t("get_signal");
            track.hidden = true;
            const closed = App.state.market === "standard" && !isMarketOpen();
            btn.disabled = closed;
        }
    },

    // ---------- Получение сигнала ----------

    getSignal() {
        if (this.busy || this.cooldownLeft() > 0) return;
        this.busy = true;
        haptic("heavy"); // ощутимый отклик на нажатие

        const btn = this.el("get-signal-btn");
        btn.disabled = true;
        this.el("signal-card").hidden = true;

        // Фаза «анализа»: эквалайзер + бегущие строки + прогресс
        const card = this.el("analysis-card");
        const line = this.el("analysis-line");
        const fill = this.el("analysis-fill");
        this.el("analysis-eq").hidden = false;
        this.el("analysis-check").hidden = true;
        card.hidden = false;
        fill.style.width = "0%";

        // Держим процесс в поле зрения — не заставляем юзера листать
        setTimeout(() => {
            card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 60);

        const lines = t("analysis");
        let i = 0;
        const step = () => {
            if (i < lines.length) {
                line.textContent = lines[i];
                line.style.animation = "none";
                void line.offsetWidth; // перезапуск анимации появления строки
                line.style.animation = "";
                fill.style.width = Math.round(((i + 1) / lines.length) * 100) + "%";
                i++;
                setTimeout(step, 620);
            } else {
                // Анализ завершён: эквалайзер -> галочка + длинный виброотклик
                this.el("analysis-eq").hidden = true;
                this.el("analysis-check").hidden = false;
                hapticLongSuccess();
                setTimeout(() => this.showResult(), 850);
            }
        };
        step();
    },

    showResult() {
        this.el("analysis-card").hidden = true;

        const pair = App.state.pair;
        const dir = Math.random() < 0.5 ? "buy" : "sell";
        const acc = (Math.random() * 10 + 85).toFixed(2) + "%";
        const now = new Date();
        const time = now.toLocaleTimeString();

        this.el("signal-pair").textContent = pair;
        this.el("signal-time").textContent = time;
        const dirEl = this.el("signal-dir");
        dirEl.textContent = t(dir);
        dirEl.className = "signal-dir " + dir;
        this.el("meta-tf").textContent = App.state.tf;
        this.el("meta-acc").textContent = acc;
        const resultCard = this.el("signal-card");
        resultCard.hidden = false;
        // Автопрокрутка к результату — сигнал сразу перед глазами
        setTimeout(() => {
            resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);

        this.drawChart(pair, dir);

        History.add({ p: pair, d: dir, tf: App.state.tf, acc: acc, ts: Date.now() });
        Profile.bumpSignals();

        this.startCooldown();
        this.busy = false;
        this.tickCooldown();
    },

    // ---------- График ----------

    drawChart(pair, dir) {
        const candlesBox = this.el("chart-candles");
        const gridBox = this.el("chart-grid");
        const yBox = this.el("chart-y");
        candlesBox.innerHTML = "";
        gridBox.innerHTML = "";
        yBox.innerHTML = "";

        const params = pairParams(pair);
        const pip = pipSize(pair);
        const dec = priceDecimals(pair);
        const half = (params.range / 2) * pip;
        const minP = params.base - half * 1.5;
        const maxP = params.base + half * 1.5;
        const H = 190;

        // Сетка + ось Y
        const rows = 5;
        for (let r = 0; r < rows; r++) {
            const topPct = (r / (rows - 1)) * 100;

            const gl = document.createElement("div");
            gl.className = "grid-line";
            gl.style.cssText = `top:${topPct}%;left:0;width:100%;height:1px;transform:translateY(-50%)`;
            gridBox.appendChild(gl);

            const price = maxP - ((maxP - minP) * r) / (rows - 1);
            const yl = document.createElement("div");
            yl.className = "y-label";
            yl.style.top = topPct + "%";
            yl.textContent = price.toFixed(dec);
            yBox.appendChild(yl);
        }
        for (let c = 1; c < 6; c++) {
            const gl = document.createElement("div");
            gl.className = "grid-line";
            gl.style.cssText = `left:${(c / 6) * 100}%;top:0;width:1px;height:100%`;
            gridBox.appendChild(gl);
        }

        // Свечи: тренд к направлению сигнала + шум
        const count = 20;
        const start = params.base;
        const move = (40 + Math.random() * 20) * pip * (dir === "buy" ? 1 : -1);
        const prices = [start];
        for (let i = 1; i < count; i++) {
            const ideal = start + (move * i) / (count - 1);
            const noise = (Math.random() * 16 - 8) * pip;
            prices.push(Math.max(minP, Math.min(maxP, ideal + noise)));
        }
        prices[count - 1] = Math.max(minP, Math.min(maxP, start + move));

        const norm = (p) => H - ((p - minP) / (maxP - minP)) * H;
        const boxW = candlesBox.clientWidth || 280;
        const cw = 8;
        const gap = (boxW - 16 - count * cw) / (count - 1);

        for (let i = 0; i < count; i++) {
            const open = prices[i];
            const close = i === count - 1 ? prices[i] : prices[i + 1];
            const hi = Math.min(maxP, Math.max(open, close) + Math.random() * 12 * pip);
            const lo = Math.max(minP, Math.min(open, close) - Math.random() * 12 * pip);

            const top = Math.min(norm(open), norm(close));
            const bodyH = Math.max(3, Math.abs(norm(close) - norm(open)));

            const candle = document.createElement("div");
            candle.className = "candle " + (close >= open ? "green" : "red");
            candle.style.cssText = `left:${8 + i * (cw + gap)}px;top:${top}px;width:${cw}px;height:${bodyH}px`;

            const wickTopH = top - norm(hi);
            if (wickTopH > 0) {
                const w = document.createElement("div");
                w.className = "wick";
                w.style.cssText = `top:${-wickTopH}px;height:${wickTopH}px`;
                candle.appendChild(w);
            }
            const wickBotH = norm(lo) - (top + bodyH);
            if (wickBotH > 0) {
                const w = document.createElement("div");
                w.className = "wick";
                w.style.cssText = `top:${bodyH}px;height:${wickBotH}px`;
                candle.appendChild(w);
            }

            candlesBox.appendChild(candle);
            setTimeout(() => candle.classList.add("in"), 120 + i * 130);
        }
    },
};
