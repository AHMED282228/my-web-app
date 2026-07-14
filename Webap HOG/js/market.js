// ============ Раздел «Рынок»: живые цены, спарклайны, топ дня, биржи ============

const Market = {
    prices: {}, // pair -> массив последних цен
    _timer: null,

    init() {
        this.renderStatic();
    },

    // Детерминированный «топ дня»: одинаковый у всех юзеров, меняется раз в сутки
    topPairs() {
        const all = INSTRUMENTS[App.state.market];
        const day = new Date().toISOString().slice(0, 10);
        let seed = 0;
        for (let i = 0; i < day.length; i++) seed = (seed * 31 + day.charCodeAt(i)) | 0;
        const picked = [];
        for (let i = 0; picked.length < 3 && i < all.length * 3; i++) {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            const p = all[seed % all.length];
            if (picked.indexOf(p) === -1) picked.push(p);
        }
        return picked;
    },

    seriesFor(pair) {
        if (!this.prices[pair]) {
            const params = pairParams(pair);
            const pip = pipSize(pair);
            const arr = [params.base];
            for (let i = 1; i < 20; i++) {
                arr.push(arr[i - 1] + (Math.random() - 0.5) * 6 * pip);
            }
            this.prices[pair] = arr;
        }
        return this.prices[pair];
    },

    advance(pair) {
        const arr = this.seriesFor(pair);
        const pip = pipSize(pair);
        const params = pairParams(pair);
        const half = (params.range / 2) * pipSize(pair) * 2;
        let next = arr[arr.length - 1] + (Math.random() - 0.5) * 5 * pip;
        next = Math.max(params.base - half, Math.min(params.base + half, next));
        arr.push(next);
        if (arr.length > 20) arr.shift();
        return arr;
    },

    rowHtml(pair, hot) {
        return (
            `<div class="mrow${hot ? " hot" : ""}" data-pair="${pair}">` +
            `<div class="mrow-name">${hot ? '<span class="hot-mark">🔥 </span>' : ""}${pair}</div>` +
            `<svg class="mrow-spark" viewBox="0 0 64 26" preserveAspectRatio="none"><polyline fill="none" stroke-width="1.6" points=""/></svg>` +
            `<div class="mrow-right"><div class="mrow-price">--</div><div class="mrow-chg">--</div></div>` +
            `</div>`
        );
    },

    renderStatic() {
        // Статус бирж
        const now = new Date();
        const h = now.getUTCHours() + now.getUTCMinutes() / 60;
        const weekend = [0, 6].includes(now.getUTCDay());
        const names = { asia: "ex_asia", europe: "ex_europe", america: "ex_america" };
        let exHtml = "";
        Object.keys(MARKET_SCHEDULE).forEach((key) => {
            const ex = MARKET_SCHEDULE[key];
            const open = !weekend && h >= ex.open && h < ex.close;
            exHtml +=
                `<div class="exchange-chip"><span>${t(names[key])}</span>` +
                `<span class="st ${open ? "open" : "closed"}">${t(open ? "exchange_open" : "exchange_closed")}</span></div>`;
        });
        document.getElementById("exchanges").innerHTML = exHtml;

        // Списки пар
        const top = this.topPairs();
        document.getElementById("top-pairs").innerHTML = top
            .map((p) => this.rowHtml(p, true))
            .join("");
        document.getElementById("market-list").innerHTML = INSTRUMENTS[
            App.state.market
        ]
            .filter((p) => top.indexOf(p) === -1)
            .map((p) => this.rowHtml(p, false))
            .join("");

        // Тап по паре — выбрать её и перейти на Сигнал
        document.querySelectorAll("#view-market .mrow").forEach((row) => {
            row.addEventListener("click", () => {
                Signal.setPair(row.dataset.pair);
                switchView("signal");
            });
        });

        this.updateRows();
    },

    updateRows() {
        document.querySelectorAll("#view-market .mrow").forEach((row) => {
            const pair = row.dataset.pair;
            const arr = this.advance(pair);
            const dec = priceDecimals(pair);
            const last = arr[arr.length - 1];
            const prev = arr[0];
            const chg = ((last - prev) / prev) * 100;

            row.querySelector(".mrow-price").textContent = last.toFixed(dec);
            const chgEl = row.querySelector(".mrow-chg");
            chgEl.textContent = (chg >= 0 ? "+" : "") + chg.toFixed(2) + "%";
            chgEl.className = "mrow-chg " + (chg >= 0 ? "up" : "down");

            // Спарклайн
            const min = Math.min.apply(null, arr);
            const max = Math.max.apply(null, arr);
            const span = max - min || 1;
            const pts = arr
                .map(
                    (v, i) =>
                        ((i / (arr.length - 1)) * 64).toFixed(1) +
                        "," +
                        (24 - ((v - min) / span) * 22 + 1).toFixed(1),
                )
                .join(" ");
            const line = row.querySelector("polyline");
            line.setAttribute("points", pts);
            line.setAttribute("stroke", chg >= 0 ? "#10b981" : "#ef4444");
        });
    },

    start() {
        this.renderStatic();
        if (this._timer) return;
        this._timer = setInterval(() => this.updateRows(), 1600);
    },

    stop() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    },
};
