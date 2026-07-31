// ============ Раздел «Сигнал»: выбор, анализ, график, кулдаун ============

// SVG-стрелки тренда для BUY/SELL (карточка сигнала и история)
const DIR_ICONS = {
    buy:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>',
    sell:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="3 7 9 13 13 9 21 17"/><polyline points="15 17 21 17 21 11"/></svg>',
};

const Signal = {
    cooldownUntil: { standard: 0, otc: 0 },
    cooldownTotal: { standard: 60, otc: 60 },
    busy: false,
    _tick: null,
    // Направление и показания индикаторов текущего сигнала: определяются ДО фазы
    // анализа, чтобы строки анализа не противоречили итоговому вердикту.
    pending: null,
    entryUntil: 0,
    entryTotal: 0,
    demoUsed: 0,

    el(id) {
        return document.getElementById(id);
    },

    init() {
        App.state.favorites = store.get("hog_favs", []);
        this.demoUsed = store.get("hog_demo_used", 0);

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

        // Вход в сделку: главный мост между сигналом и реальным оборотом.
        // В демо-режиме та же кнопка ведёт на пополнение — другого пути дальше нет.
        this.el("trade-btn").addEventListener("click", () => {
            haptic("heavy");
            openBroker();
        });
        this.el("demo-unlock-btn").addEventListener("click", () => {
            haptic("heavy");
            openBroker();
        });

        this.renderTfChips();
        this.updateFavBtn();
        this.renderClosedState();
        this.renderDemoState();
        setInterval(() => this.renderClosedState(), 60 * 1000);

        this._tick = setInterval(() => {
            this.tickCooldown();
            this.tickEntry();
        }, 500);
    },

    // ---------- Демо-режим ----------

    demoLeft() {
        return Math.max(0, CONFIG.DEMO_LIMIT - this.demoUsed);
    },

    demoExhausted() {
        return App.params.demo && this.demoLeft() <= 0;
    },

    renderDemoState() {
        const banner = this.el("demo-banner");
        const over = this.el("demo-over");
        banner.hidden = !App.params.demo || this.demoExhausted();
        over.hidden = !this.demoExhausted();
        this.el("demo-left").textContent = this.demoLeft();

        // В демо кнопка сделки честно говорит, что вход откроется после пополнения
        this.el("trade-label").textContent = App.params.demo
            ? t("demo_trade_locked")
            : t("open_trade");
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
            closed || this.busy || this.cooldownLeft() > 0 || this.demoExhausted();
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
        this.entryUntil = 0;
    },

    // ---------- Окно входа ----------

    startEntryTimer() {
        this.entryTotal =
            CONFIG.ENTRY_WINDOW[App.state.tf] || CONFIG.ENTRY_WINDOW_DEFAULT;
        this.entryUntil = Date.now() + this.entryTotal * 1000;
        this.el("entry-expired").hidden = true;
        this.el("entry-timer").classList.remove("expired");
        this.el("trade-btn").classList.remove("stale");
        this.tickEntry();
    },

    tickEntry() {
        if (!this.entryUntil || this.el("signal-card").hidden) return;
        const left = Math.max(0, Math.ceil((this.entryUntil - Date.now()) / 1000));
        const m = Math.floor(left / 60);
        const s = String(left % 60).padStart(2, "0");
        this.el("entry-value").textContent = m + ":" + s;
        this.el("entry-fill").style.width =
            Math.max(0, (left / this.entryTotal) * 100) + "%";

        if (left <= 0) {
            // Окно закрылось: сигнал больше не актуален, честно об этом говорим
            this.entryUntil = 0;
            this.el("entry-expired").hidden = false;
            this.el("entry-timer").classList.add("expired");
            this.el("trade-btn").classList.add("stale");
        }
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
            btn.disabled = closed || this.demoExhausted();
        }
    },

    // ---------- Получение сигнала ----------

    // Показания индикаторов под выбранное направление: сначала решаем, куда идёт
    // сигнал, потом подбираем чтения — иначе в анализе мелькает «перекупленность»
    // перед сигналом на покупку, и вся серьёзность рассыпается.
    buildReadings(dir) {
        return pickIndicators(4).map((ind) => {
            const [value, verdict] = dir === "buy" ? ind.bull() : ind.bear();
            return { name: ind.n, value: value, verdict: verdict };
        });
    },

    readingLine(reading) {
        const value = reading.value === null ? "" : reading.value + " — ";
        return reading.name + ": " + value + t(reading.verdict);
    },

    getSignal() {
        if (this.busy || this.cooldownLeft() > 0) return;
        if (this.demoExhausted()) {
            this.renderDemoState();
            this.el("demo-over").scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        this.busy = true;
        haptic("heavy"); // ощутимый отклик на нажатие

        const btn = this.el("get-signal-btn");
        btn.disabled = true;
        this.el("signal-card").hidden = true;
        this.entryUntil = 0;

        const dir = Math.random() < 0.5 ? "buy" : "sell";
        this.pending = { dir: dir, readings: this.buildReadings(dir) };

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

        const lines = [t("analysis_connect")]
            .concat(this.pending.readings.map((r) => this.readingLine(r)))
            .concat([t("analysis_build")]);
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
        const dir = this.pending ? this.pending.dir : Math.random() < 0.5 ? "buy" : "sell";
        const readings = this.pending ? this.pending.readings : [];
        const acc = (Math.random() * 10 + 85).toFixed(2) + "%";
        const now = new Date();
        const time = now.toLocaleTimeString();

        this.el("signal-pair").textContent = pair;
        this.el("signal-time").textContent = time;
        const dirEl = this.el("signal-dir");
        dirEl.innerHTML =
            '<span class="dir-icon">' + DIR_ICONS[dir] + "</span>" +
            "<span>" + t(dir) + "</span>";
        dirEl.className = "signal-dir " + dir;
        this.el("meta-tf").textContent = App.state.tf;
        this.el("meta-acc").textContent = acc;

        // Чем подтверждён вердикт: конкретные индикаторы читаются как работа,
        // а не как «нажал кнопку — выпала стрелка»
        this.el("indicators-list").innerHTML = readings
            .map(
                (r) =>
                    `<div class="ind-row ${dir}">` +
                    `<span class="ind-check">✓</span>` +
                    `<span class="ind-name">${r.name}</span>` +
                    `<span class="ind-verdict">${r.value === null ? "" : r.value + " · "}${t(r.verdict)}</span>` +
                    `</div>`,
            )
            .join("");

        const resultCard = this.el("signal-card");
        resultCard.hidden = false;
        // Автопрокрутка к результату — сигнал сразу перед глазами
        setTimeout(() => {
            resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);

        this.drawChart(pair, dir);
        this.startEntryTimer();

        History.add({ p: pair, d: dir, tf: App.state.tf, acc: acc, ts: Date.now() });
        Profile.bumpSignals();
        Quests.bump();
        // Свой сигнал тоже идёт в общий счётчик и в ленту — иначе цифры
        // «за сегодня» не реагируют на нажатие кнопки
        Live.registerUserSignal(pair, dir, acc);

        if (App.params.demo) {
            this.demoUsed += 1;
            store.set("hog_demo_used", this.demoUsed);
        }
        this.renderDemoState();

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
        // Центр графика — ТЕКУЩАЯ живая цена пары (как на вкладке «Рынок»),
        // а не фиксированная база: иначе график всегда чертился от одного уровня.
        const center = Market.currentPrice(pair);
        const half = (params.range / 2) * pip;
        const minP = center - half * 1.5;
        const maxP = center + half * 1.5;

        const boxW = candlesBox.clientWidth || 280;
        const boxH = candlesBox.clientHeight || 190;
        const padY = 14;
        const plotH = boxH - padY * 2;
        const norm = (p) => padY + ((maxP - p) / (maxP - minP)) * plotH;

        const col = dir === "buy" ? "#10b981" : "#ef4444";
        const dirSign = dir === "buy" ? 1 : -1;
        const pastW = Math.round(boxW * 0.7); // левая часть — «прошлое» (свечи), правая — зона экспирации

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
        for (let c = 1; c < 5; c++) {
            const gl = document.createElement("div");
            gl.className = "grid-line";
            gl.style.cssText = `left:${(c / 5) * 100}%;top:0;width:1px;height:100%`;
            gridBox.appendChild(gl);
        }

        // Цены: тренд к направлению сигнала + шум (в пределах «прошлого»)
        const count = 16;
        const start = center;
        const move = (35 + Math.random() * 20) * pip * dirSign;
        const prices = [start];
        for (let i = 1; i < count; i++) {
            const ideal = start + (move * i) / (count - 1);
            const noise = (Math.random() * 14 - 7) * pip;
            prices.push(Math.max(minP, Math.min(maxP, ideal + noise)));
        }
        const entryPrice = Math.max(minP, Math.min(maxP, start + move));
        prices[count - 1] = entryPrice;

        // Геометрия свечей в диапазоне [8, pastW-8]
        const cw = 7;
        const gap = (pastW - 16 - count * cw) / (count - 1);
        const cx = (i) => 8 + i * (cw + gap) + cw / 2;

        for (let i = 0; i < count; i++) {
            const open = prices[i];
            const close = i === count - 1 ? prices[i] : prices[i + 1];
            const hi = Math.min(maxP, Math.max(open, close) + Math.random() * 10 * pip);
            const lo = Math.max(minP, Math.min(open, close) - Math.random() * 10 * pip);

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
            setTimeout(() => candle.classList.add("in"), 50 + i * 45);
        }
        candlesBox.classList.add("has-fx"); // приглушаем свечи, чтобы линия читалась

        this.drawFx(candlesBox, {
            col, dir, dirSign, dec, boxW, boxH, padY, plotH,
            pastW, cx, norm, prices, entryPrice, count,
        });
    },

    // Слой поверх свечей: неон-линия + заливка + вход + зона экспирации + тег цены
    drawFx(box, o) {
        const entryY = o.norm(o.entryPrice);
        const targetY = Math.max(
            o.padY,
            Math.min(o.boxH - o.padY, entryY - o.dirSign * o.plotH * 0.24),
        );
        const baseY = o.boxH - o.padY;
        const nowX = o.pastW;
        const rightX = o.boxW - 6;

        const linePts = o.prices
            .map((p, i) => `${o.cx(i).toFixed(1)},${o.norm(p).toFixed(1)}`)
            .join(" ");
        const areaPts =
            `${o.cx(0).toFixed(1)},${baseY.toFixed(1)} ` +
            linePts +
            ` ${o.cx(o.count - 1).toFixed(1)},${baseY.toFixed(1)}`;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "chart-fx");
        svg.setAttribute("viewBox", `0 0 ${o.boxW} ${o.boxH}`);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.innerHTML =
            `<defs><linearGradient id="fxGrad" x1="0" y1="0" x2="0" y2="1">` +
            `<stop offset="0" stop-color="${o.col}" stop-opacity="0.30"/>` +
            `<stop offset="1" stop-color="${o.col}" stop-opacity="0"/>` +
            `</linearGradient></defs>` +
            `<polygon class="fx-area" points="${areaPts}" fill="url(#fxGrad)"/>` +
            `<polygon class="fx-cone" points="${nowX},${entryY.toFixed(1)} ${rightX},${targetY.toFixed(1)} ${rightX},${entryY.toFixed(1)}" fill="${o.col}" fill-opacity="0.15"/>` +
            `<line class="fx-entry" x1="0" y1="${entryY.toFixed(1)}" x2="${o.boxW}" y2="${entryY.toFixed(1)}" stroke="${o.col}"/>` +
            `<line class="fx-now" x1="${nowX}" y1="${o.padY}" x2="${nowX}" y2="${baseY}"/>` +
            `<line class="fx-proj" x1="${nowX}" y1="${entryY.toFixed(1)}" x2="${rightX}" y2="${targetY.toFixed(1)}" stroke="${o.col}"/>` +
            `<polyline class="fx-line" points="${linePts}" stroke="${o.col}"/>`;
        box.appendChild(svg);

        // Точка входа (пульсирует), цель, тег цены
        const dot = document.createElement("div");
        dot.className = "fx-dot " + o.dir;
        dot.style.cssText = `left:${nowX}px;top:${entryY}px`;
        box.appendChild(dot);

        const tgt = document.createElement("div");
        tgt.className = "fx-target " + o.dir;
        tgt.style.cssText = `left:${rightX}px;top:${targetY}px`;
        box.appendChild(tgt);

        const tag = document.createElement("div");
        tag.className = "fx-tag " + o.dir;
        tag.style.top = entryY + "px";
        tag.textContent = o.entryPrice.toFixed(o.dec);
        box.appendChild(tag);

        // Появление: линия «прочерчивается», остальное плавно проявляется
        requestAnimationFrame(() => {
            svg.classList.add("show");
            const line = svg.querySelector(".fx-line");
            line.style.filter = `drop-shadow(0 0 3px ${o.col})`;
            try {
                const len = line.getTotalLength();
                line.style.strokeDasharray = len;
                line.style.strokeDashoffset = len;
                requestAnimationFrame(() => {
                    line.style.transition = "stroke-dashoffset 0.8s ease";
                    line.style.strokeDashoffset = "0";
                });
            } catch (e) {}
        });
        setTimeout(() => dot.classList.add("show"), 360);
        setTimeout(() => tag.classList.add("show"), 480);
        setTimeout(() => tgt.classList.add("show"), 640);
    },
};
