// ============ Раздел «История» (localStorage + Telegram CloudStorage) ============

const History = {
    MAX: 30,
    items: [],

    init() {
        this.items = store.get("hog_history", []);
        // CloudStorage переживает чистку кэша — если там больше, берём оттуда
        cloud.get("hog_history", (remote) => {
            if (Array.isArray(remote) && remote.length > this.items.length) {
                this.items = remote;
                store.set("hog_history", this.items);
                if (App.state.view === "history") this.render();
            }
        });

        document.getElementById("history-clear").addEventListener("click", () => {
            const doClear = () => {
                this.items = [];
                this.persist();
                this.render();
                hapticNotify("success");
            };
            try {
                App.tg?.showConfirm
                    ? App.tg.showConfirm(t("confirm_clear"), (ok) => ok && doClear())
                    : confirm(t("confirm_clear")) && doClear();
            } catch (e) {
                if (confirm(t("confirm_clear"))) doClear();
            }
        });
    },

    persist() {
        store.set("hog_history", this.items);
        cloud.set("hog_history", this.items);
    },

    add(entry) {
        this.items.unshift(entry);
        if (this.items.length > this.MAX) this.items.length = this.MAX;
        this.persist();
    },

    dayLabel(ts) {
        const d = new Date(ts);
        const today = new Date();
        const yest = new Date();
        yest.setDate(today.getDate() - 1);
        const same = (a, b) => a.toDateString() === b.toDateString();
        if (same(d, today)) return t("today");
        if (same(d, yest)) return t("yesterday");
        return d.toLocaleDateString();
    },

    render() {
        const list = document.getElementById("history-list");
        const empty = document.getElementById("history-empty");
        const clearBtn = document.getElementById("history-clear");

        const todayStr = new Date().toDateString();
        const todayCount = this.items.filter(
            (it) => new Date(it.ts).toDateString() === todayStr,
        ).length;
        document.getElementById("hist-today").textContent = todayCount;
        document.getElementById("hist-total").textContent =
            store.get("hog_count", 0);

        empty.style.display = this.items.length ? "none" : "block";
        clearBtn.hidden = !this.items.length;

        let html = "";
        let lastDay = null;
        this.items.forEach((it) => {
            const day = this.dayLabel(it.ts);
            if (day !== lastDay) {
                html += `<div class="day-label">${day}</div>`;
                lastDay = day;
            }
            const time = new Date(it.ts).toLocaleTimeString().slice(0, 5);
            html +=
                `<div class="hrow">` +
                `<span class="hrow-dir ${it.d}">${DIR_ICONS[it.d] || ""}</span>` +
                `<span class="hrow-pair">${it.p}</span>` +
                `<span class="hrow-tf">${it.tf}</span>` +
                `<span class="hrow-time">${time}</span>` +
                `</div>`;
        });
        list.innerHTML = html;
    },
};
